const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const edgeTTSService = require('../services/edgeTTSService');

/**
 * @route   POST /api/tts/speak
 * @desc    Convert text to speech using Microsoft Edge TTS (FREE)
 * @access  Private
 */
router.post('/speak', protect, async (req, res) => {
  try {
    const { text, language, gender } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    // Limit text length
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Text is too long. Maximum 5000 characters allowed.'
      });
    }

    const audioBuffer = await edgeTTSService.textToSpeech(text, language, gender);

    // Set headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert text to speech'
    });
  }
});

/**
 * @route   GET /api/tts/voices
 * @desc    Get available voices
 * @access  Private
 */
router.get('/voices', protect, async (req, res) => {
  try {
    const voices = edgeTTSService.getAvailableVoices();
    res.json({
      success: true,
      voices
    });
  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voices'
    });
  }
});

module.exports = router;
