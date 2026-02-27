const ollamaService = require('../services/ollamaService');
const groqService = require('../services/groqService');
const plantDiseaseService = require('../services/plantDiseaseService');
const translationService = require('../services/translationService');
const DiseaseDetection = require('../models/DiseaseDetection');
const fs = require('fs');
const path = require('path');

// Initialize PlantVillage model on load
plantDiseaseService.initialize().catch(err => console.log('PlantVillage model will load on first use'));

// @desc    Detect crop disease from image
// @route   POST /api/disease/detect
exports.detectDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const { cropType, additionalInfo, language } = req.body;
    const userLanguage = language || req.user.preferredLanguage || 'en';

    // Read image and convert to base64
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    // Determine MIME type
    const ext = path.extname(req.file.originalname).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    let analysis;
    let usedModel = 'plantvillage';
    let plantVillageResult = null;

    // Try PlantVillage TensorFlow model first (fastest, ~100ms)
    try {
      plantVillageResult = await plantDiseaseService.analyzeImage(imageBuffer);
      console.log(`PlantVillage detection: ${plantVillageResult.disease} (${plantVillageResult.confidence}%)`);

      // Generate detailed analysis using Groq (primary) or Ollama (fallback)
      try {
        console.log('Generating analysis with Groq...');
        const groqResult = await groqService.generateDiseaseAnalysis(plantVillageResult, userLanguage);
        analysis = {
          analysis: groqResult.message,
          model: 'PlantVillage + Groq'
        };
        usedModel = 'groq';
        console.log('Groq analysis successful');
      } catch (groqError) {
        console.log('Groq failed, falling back to Ollama:', groqError.message);
        // Fallback to local Ollama for analysis generation
        analysis = {
          analysis: plantDiseaseService.generateAnalysis(plantVillageResult),
          model: 'PlantVillage-MobileNet'
        };
        usedModel = 'ollama-fallback';
      }
    } catch (plantError) {
      console.log('PlantVillage failed, trying Groq vision...', plantError.message);

      // Try Groq vision model for direct image analysis
      try {
        const prompt = createAnalysisPrompt(cropType, additionalInfo);
        analysis = await groqService.analyzeImage(imageBase64, prompt, mimeType);
        usedModel = 'groq-vision';
        console.log('Groq vision analysis successful');
      } catch (groqError) {
        console.log('Groq vision failed, falling back to Ollama:', groqError.message);
        // Final fallback to Ollama
        const prompt = createAnalysisPrompt(cropType, additionalInfo);
        analysis = await ollamaService.analyzeImage(imageBase64, prompt);
        usedModel = 'ollama';
      }
    }

    // Helper function for prompt (defined below)
    function createAnalysisPrompt(cropType, additionalInfo) {
      let prompt = `You are an expert agricultural disease detection AI. Analyze this crop image carefully for any diseases, pests, nutrient deficiencies, or health issues.`;

      if (cropType) {
        prompt += `\n\nThe farmer has identified this as: ${cropType}`;
      }
      if (additionalInfo) {
        prompt += `\nAdditional context from farmer: ${additionalInfo}`;
      }

      prompt += `

Please provide a structured analysis with:

**Diagnosis:** What disease/problem is visible (or confirm if healthy)

**Severity:** mild / moderate / severe / healthy

**Symptoms Observed:** What visual signs indicate this problem

**Likely Causes:** What typically causes this condition

**Treatment Recommendations:**
- Immediate actions to take
- Recommended products/remedies
- Application instructions

**Prevention Tips:** How to prevent this in future

**Expert Consultation:** When to seek professional help

Be specific, practical, and helpful. If the plant appears healthy, confirm that and provide general care tips.`;
      return prompt;
    }

    // Translate response if needed (skip if Groq already generated in user's language)
    let responseContent = analysis.analysis;
    if (userLanguage !== 'en' && usedModel !== 'groq') {
      try {
        const translation = await translationService.translateFromEnglish(responseContent, userLanguage);
        responseContent = translation.translatedText;
      } catch (translationError) {
        console.log('Translation failed, using English:', translationError.message);
        // Keep English if translation fails
      }
    }

    // Extract severity from analysis
    let severity = 'unknown';
    let detectedCrop = cropType || 'Unknown';
    let detectedDisease = null;

    if (plantVillageResult) {
      // Use PlantVillage result for severity
      if (plantVillageResult.isHealthy) {
        severity = 'healthy';
      } else if (plantVillageResult.confidence > 80) {
        severity = 'severe';
      } else if (plantVillageResult.confidence > 50) {
        severity = 'moderate';
      } else {
        severity = 'mild';
      }
      detectedCrop = plantVillageResult.crop;
      detectedDisease = plantVillageResult.disease;
    } else {
      // Fallback: Extract from text analysis
      const analysisLower = analysis.analysis.toLowerCase();
      if (analysisLower.includes('healthy') || analysisLower.includes('no disease') || analysisLower.includes('no visible')) {
        severity = 'healthy';
      } else if (analysisLower.includes('severe') || analysisLower.includes('critical') || analysisLower.includes('serious')) {
        severity = 'severe';
      } else if (analysisLower.includes('moderate') || analysisLower.includes('medium')) {
        severity = 'moderate';
      } else if (analysisLower.includes('mild') || analysisLower.includes('minor') || analysisLower.includes('early stage')) {
        severity = 'mild';
      }
    }

    // Save to database for history
    const imageUrl = `/uploads/${req.file.filename}`;
    const detection = await DiseaseDetection.create({
      user: req.user._id,
      imageUrl,
      cropType: detectedCrop,
      additionalInfo,
      analysis: responseContent,
      originalAnalysis: analysis.analysis,
      severity,
      language: userLanguage
    });

    // Build response with PlantVillage details if available
    const resultData = {
      id: detection._id,
      analysis: responseContent,
      originalAnalysis: analysis.analysis,
      imageUrl,
      cropType: detectedCrop,
      severity,
      timestamp: detection.createdAt,
      model: usedModel
    };

    // Add PlantVillage-specific data if available
    if (plantVillageResult) {
      resultData.disease = detectedDisease;
      resultData.confidence = plantVillageResult.confidence;
      resultData.isHealthy = plantVillageResult.isHealthy;
      resultData.inferenceTime = plantVillageResult.inferenceTime;
      resultData.topPredictions = plantVillageResult.topPredictions;
    }

    res.status(200).json({
      success: true,
      result: resultData
    });
  } catch (error) {
    console.error('Disease detection error:', error);

    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }

    res.status(500).json({
      success: false,
      message: 'Failed to analyze image. Please try again.'
    });
  }
};

// @desc    Get disease detection history
// @route   GET /api/disease/history
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const history = await DiseaseDetection.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('imageUrl cropType analysis severity createdAt');

    const total = await DiseaseDetection.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get disease history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history'
    });
  }
};

// @desc    Get single detection detail
// @route   GET /api/disease/history/:id
exports.getDetectionById = async (req, res) => {
  try {
    const detection = await DiseaseDetection.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    res.status(200).json({
      success: true,
      detection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get detection'
    });
  }
};

// @desc    Delete detection from history
// @route   DELETE /api/disease/history/:id
exports.deleteDetection = async (req, res) => {
  try {
    const detection = await DiseaseDetection.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Detection deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete detection'
    });
  }
};
