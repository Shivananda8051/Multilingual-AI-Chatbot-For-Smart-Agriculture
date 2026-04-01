const Chat = require('../models/Chat');
const ollamaService = require('../services/ollamaService');
const groqService = require('../services/groqService');

// @desc    Send message to AI chatbot
// @route   POST /api/chat/message
exports.sendMessage = async (req, res) => {
  try {
    const { message, language } = req.body;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get or create active chat
    let chat = await Chat.findOne({ user: userId, isActive: true });
    if (!chat) {
      chat = await Chat.create({ user: userId, messages: [] });
    }

    // Use message directly - modern LLMs can understand all Indian languages
    const userLanguage = language || req.user.preferredLanguage || 'en';

    // Add user message to chat
    chat.messages.push({
      role: 'user',
      content: message,
      originalLanguage: userLanguage
    });

    // Prepare messages for LLM - use original content (no translation needed)
    const llmMessages = chat.messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Get response from LLM (Groq primary, Ollama fallback)
    const userContext = {
      location: req.user.location?.city || 'India',
      crops: req.user.cropsGrown
    };

    let aiResponse;
    if (groqService.isConfigured()) {
      try {
        const systemPrompt = ollamaService.getSystemPrompt(userLanguage);
        const contextInfo = `User context: Location: ${userContext.location || 'India'}, Main crops: ${userContext.crops?.join(', ') || 'various crops'}`;

        // Check for greeting
        const lastMsg = llmMessages[llmMessages.length - 1];
        if (lastMsg && lastMsg.role === 'user' && ollamaService.isGreeting(lastMsg.content)) {
          aiResponse = { message: ollamaService.getGreetingResponse(userLanguage) };
        } else {
          const groqMessages = [
            { role: 'system', content: `${systemPrompt}\n\n${contextInfo}` },
            ...llmMessages
          ];
          aiResponse = await groqService.chat(groqMessages, { temperature: 0.7, maxTokens: 300 });
        }
      } catch (groqError) {
        console.log('Groq failed, falling back to Ollama:', groqError.message);
        aiResponse = await ollamaService.chat(llmMessages, userContext, userLanguage);
      }
    } else {
      aiResponse = await ollamaService.chat(llmMessages, userContext, userLanguage);
    }

    // Response is already in user's language
    const responseContent = aiResponse.message;

    // Add assistant message to chat
    const assistantMsg = {
      role: 'assistant',
      content: responseContent,
      originalLanguage: userLanguage
    };
    chat.messages.push(assistantMsg);

    await chat.save();

    // Get the ID of the newly added message
    const newMessageId = chat.messages[chat.messages.length - 1]._id;

    // Generate related suggestions (in user's language)
    let suggestions = [];
    try {
      if (groqService.isConfigured()) {
        try {
          const langName = ollamaService.getLanguageName(userLanguage);
          const langInstruction = userLanguage !== 'en' ? ` Generate the questions in ${langName} language.` : '';
          const suggestPrompt = `Farmer asked: "${message}"\n\nGenerate exactly 3 SHORT follow-up questions about FARMING/AGRICULTURE only.${langInstruction}\n\nRULES:\n- Questions MUST be about crops, farming, agriculture\n- Keep each question under 8 words\n- Return ONLY a JSON array\nExample: ["Best fertilizer for rice?", "When to water crops?", "How to control pests?"]`;

          const suggestResult = await groqService.chat([
            { role: 'system', content: `You generate ONLY farming related follow-up questions. Return ONLY a JSON array of 3 questions.${langInstruction}` },
            { role: 'user', content: suggestPrompt }
          ], { temperature: 0.5, maxTokens: 200 });

          const jsonMatch = suggestResult.message.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            suggestions = JSON.parse(jsonMatch[0]).slice(0, 3);
          }
        } catch (groqSuggestError) {
          suggestions = await ollamaService.generateSuggestions(message, responseContent, userLanguage);
        }
      } else {
        suggestions = await ollamaService.generateSuggestions(message, responseContent, userLanguage);
      }
    } catch (suggestionError) {
      console.error('Suggestion error:', suggestionError);
      suggestions = ollamaService.getFallbackSuggestions(message, userLanguage);
    }

    res.status(200).json({
      success: true,
      message: {
        _id: newMessageId,
        role: 'assistant',
        content: responseContent
      },
      suggestions
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response. Please try again.'
    });
  }
};

// @desc    Get chat history
// @route   GET /api/chat/history
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findOne({ user: userId, isActive: true });

    if (!chat) {
      return res.status(200).json({
        success: true,
        messages: []
      });
    }

    // Get paginated messages (most recent first)
    const startIndex = Math.max(0, chat.messages.length - page * limit);
    const endIndex = chat.messages.length - (page - 1) * limit;
    const messages = chat.messages.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      messages,
      hasMore: startIndex > 0
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history'
    });
  }
};

// @desc    Clear chat history
// @route   DELETE /api/chat/clear
exports.clearHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // Mark current chat as inactive
    await Chat.findOneAndUpdate(
      { user: userId, isActive: true },
      { isActive: false }
    );

    // Create new active chat
    await Chat.create({ user: userId, messages: [] });

    res.status(200).json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history'
    });
  }
};

// @desc    Get all chat sessions for user
// @route   GET /api/chat/sessions
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Chat.find({ user: userId })
      .select('_id createdAt updatedAt isActive messages')
      .sort({ updatedAt: -1 })
      .limit(20);

    const formattedSessions = sessions.map(session => {
      const firstUserMessage = session.messages.find(m => m.role === 'user');
      return {
        _id: session._id,
        title: firstUserMessage?.content?.substring(0, 50) || 'New Chat',
        firstMessage: firstUserMessage?.content?.substring(0, 100) || '',
        messageCount: session.messages.length,
        isActive: session.isActive,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      sessions: formattedSessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat sessions'
    });
  }
};

// @desc    Get specific chat session
// @route   GET /api/chat/session/:sessionId
exports.getSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    const session = await Chat.findOne({ _id: sessionId, user: userId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      messages: session.messages
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat session'
    });
  }
};

// @desc    Submit feedback on a message
// @route   POST /api/chat/feedback
exports.submitFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId, feedback } = req.body;

    if (!messageId || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Message ID and feedback are required'
      });
    }

    if (!['helpful', 'not_helpful'].includes(feedback)) {
      return res.status(400).json({
        success: false,
        message: 'Feedback must be "helpful" or "not_helpful"'
      });
    }

    const chat = await Chat.findOne({ user: userId, isActive: true });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const message = chat.messages.id(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.role !== 'assistant') {
      return res.status(400).json({
        success: false,
        message: 'Can only provide feedback on assistant messages'
      });
    }

    // Toggle feedback - if same feedback clicked again, remove it
    message.feedback = message.feedback === feedback ? null : feedback;
    await chat.save();

    res.status(200).json({
      success: true,
      feedback: message.feedback,
      message: message.feedback ? 'Feedback submitted' : 'Feedback removed'
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
};
