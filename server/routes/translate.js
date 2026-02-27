const express = require('express');
const router = express.Router();
const translationService = require('../services/translationService');

// Translate single text
router.post('/text', async (req, res) => {
  try {
    const { text, sourceLang = 'en', targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({
        success: false,
        message: 'Text and target language are required'
      });
    }

    const result = await translationService.translate(text, sourceLang, targetLang);
    res.json(result);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      translatedText: req.body.text
    });
  }
});

// Batch translate multiple texts
router.post('/batch', async (req, res) => {
  try {
    const { texts, sourceLang = 'en', targetLang } = req.body;

    if (!texts || !Array.isArray(texts) || !targetLang) {
      return res.status(400).json({
        success: false,
        message: 'Texts array and target language are required'
      });
    }

    // Limit batch size to prevent abuse
    if (texts.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 texts per batch'
      });
    }

    const results = await translationService.translateBatch(texts, sourceLang, targetLang);
    res.json({
      success: true,
      translations: results
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch translation failed'
    });
  }
});

// Translate UI strings object
router.post('/ui', async (req, res) => {
  try {
    const { strings, sourceLang = 'en', targetLang } = req.body;

    if (!strings || typeof strings !== 'object' || !targetLang) {
      return res.status(400).json({
        success: false,
        message: 'Strings object and target language are required'
      });
    }

    const translated = await translationService.translateObject(strings, sourceLang, targetLang);
    res.json({
      success: true,
      translations: translated,
      language: targetLang
    });
  } catch (error) {
    console.error('UI translation error:', error);
    res.status(500).json({
      success: false,
      message: 'UI translation failed'
    });
  }
});

// Detect language
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const result = await translationService.detectLanguage(text);
    res.json(result);
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      language: 'en',
      confidence: 0
    });
  }
});

// Get available languages
router.get('/languages', (req, res) => {
  const languages = translationService.getLanguages();
  res.json({
    success: true,
    languages
  });
});

// Health check
router.get('/health', async (req, res) => {
  const health = await translationService.checkHealth();
  res.json(health);
});

module.exports = router;
