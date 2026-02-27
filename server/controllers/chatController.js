const Chat = require('../models/Chat');
const ollamaService = require('../services/ollamaService');

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

    // Get response from Ollama (directly in user's language)
    const userContext = {
      location: req.user.location?.city || 'India',
      crops: req.user.cropsGrown
    };

    const aiResponse = await ollamaService.chat(llmMessages, userContext, userLanguage);

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
      suggestions = await ollamaService.generateSuggestions(message, responseContent, userLanguage);
    } catch (suggestionError) {
      console.error('Suggestion error:', suggestionError);
      // Continue without suggestions
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
