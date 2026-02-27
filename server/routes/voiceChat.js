const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const groqService = require('../services/groqService');
const axios = require('axios');

// Ollama fallback configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'kimi-k2:1t-cloud';

// System prompt for voice chat (agriculture focused, concise responses)
const VOICE_SYSTEM_PROMPT = `You are AgriBot, a helpful voice assistant for Indian farmers.

IMPORTANT RULES:
1. Keep responses SHORT and CONVERSATIONAL (2-4 sentences max)
2. Speak naturally like a friendly expert, not a textbook
3. Always respond in the SAME LANGUAGE the user speaks
4. Focus on practical, actionable advice
5. If asked about crops, pests, weather, or farming - give direct answers
6. Avoid markdown formatting (no **, ##, bullets) - this is for voice output

You help with:
- Crop diseases and treatments
- Farming techniques
- Weather-based advice
- Market prices
- Government schemes
- General agricultural questions`;

// Language name mapping
const getLanguageName = (code) => {
  const languages = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'bn': 'Bengali',
    'mr': 'Marathi',
    'gu': 'Gujarati'
  };
  return languages[code] || 'English';
};

// Ollama fallback function
async function ollamaChat(message, language) {
  const langName = getLanguageName(language);
  const langInstruction = language !== 'en'
    ? `\n\nIMPORTANT: Respond in ${langName} language only.`
    : '';

  const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
    model: OLLAMA_MODEL,
    messages: [
      { role: 'system', content: VOICE_SYSTEM_PROMPT + langInstruction },
      { role: 'user', content: message }
    ],
    stream: false,
    options: {
      temperature: 0.7,
      num_predict: 200 // Keep responses short for voice
    }
  }, { timeout: 30000 });

  return response.data.message.content;
}

/**
 * @route   POST /api/voice-chat/message
 * @desc    Voice chat with Groq (fast) or Ollama fallback
 * @access  Private
 */
router.post('/message', protect, async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const langName = getLanguageName(language);
    const langInstruction = language !== 'en'
      ? `\n\nIMPORTANT: Respond ENTIRELY in ${langName} language.`
      : '';

    let responseText;
    let provider = 'groq';

    // Try Groq first (faster)
    if (groqService.isConfigured()) {
      try {
        console.log(`Voice Chat - Using Groq, Language: ${language}`);

        const result = await groqService.chat([
          { role: 'system', content: VOICE_SYSTEM_PROMPT + langInstruction },
          { role: 'user', content: message }
        ], {
          temperature: 0.7,
          maxTokens: 200 // Short responses for voice
        });

        responseText = result.message;
      } catch (groqError) {
        console.error('Groq failed, falling back to Ollama:', groqError.message);
        responseText = await ollamaChat(message, language);
        provider = 'ollama';
      }
    } else {
      // Groq not configured, use Ollama
      console.log(`Voice Chat - Using Ollama (Groq not configured), Language: ${language}`);
      responseText = await ollamaChat(message, language);
      provider = 'ollama';
    }

    res.json({
      success: true,
      message: {
        content: responseText,
        role: 'assistant'
      },
      provider
    });

  } catch (error) {
    console.error('Voice chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice message'
    });
  }
});

/**
 * @route   GET /api/voice-chat/health
 * @desc    Check voice chat service status
 * @access  Private
 */
router.get('/health', protect, async (req, res) => {
  const status = {
    groq: groqService.isConfigured() ? 'configured' : 'not_configured',
    ollama: 'checking'
  };

  try {
    await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 2000 });
    status.ollama = 'available';
  } catch {
    status.ollama = 'unavailable';
  }

  res.json({
    success: true,
    status,
    preferredProvider: groqService.isConfigured() ? 'groq' : 'ollama'
  });
});

module.exports = router;
