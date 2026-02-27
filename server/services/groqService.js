const axios = require('axios');

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1';
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.visionModel = 'llama-3.2-90b-vision-preview'; // Groq's vision model
  }

  isConfigured() {
    return !!this.apiKey;
  }

  // Analyze crop image for disease detection
  async analyzeImage(imageBase64, prompt, mimeType = 'image/jpeg') {
    if (!this.isConfigured()) {
      throw new Error('Groq API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.visionModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1024,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        analysis: response.data.choices[0].message.content,
        model: this.visionModel,
        provider: 'groq'
      };
    } catch (error) {
      console.error('Groq vision analysis error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Groq vision analysis failed');
    }
  }

  // Chat completion for text-based queries
  async chat(messages, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Groq API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || this.model,
          messages,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        message: response.data.choices[0].message.content,
        model: options.model || this.model,
        provider: 'groq',
        usage: response.data.usage
      };
    } catch (error) {
      console.error('Groq chat error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Groq chat failed');
    }
  }

  // Generate disease analysis from PlantVillage result using Groq
  async generateDiseaseAnalysis(plantVillageResult, language = 'en') {
    if (!this.isConfigured()) {
      throw new Error('Groq API key not configured');
    }

    const { crop, disease, isHealthy, confidence, topPredictions } = plantVillageResult;

    const langName = this.getLanguageName(language);
    const langInstruction = language !== 'en'
      ? `\n\nIMPORTANT: Respond ENTIRELY in ${langName} language.`
      : '';

    const prompt = isHealthy
      ? `The plant analysis shows: ${crop} - HEALTHY (${confidence}% confidence).

Provide a brief, helpful response for the farmer:
1. Confirm the plant is healthy
2. Give 3-4 quick care tips to maintain health
3. Mention one thing to watch out for

Keep it concise and practical.${langInstruction}`
      : `Disease detected on ${crop}: ${disease} (${confidence}% confidence)

Other possibilities: ${topPredictions?.slice(1, 3).map(p => `${p.className}: ${p.confidence}%`).join(', ') || 'None'}

Provide expert agricultural advice:
1. **Diagnosis**: Confirm the disease and severity
2. **Symptoms**: What to look for
3. **Treatment**: Specific remedies (organic + chemical options)
4. **Prevention**: How to avoid in future

Be practical and specific. Indian farmer context.${langInstruction}`;

    try {
      const response = await this.chat([
        {
          role: 'system',
          content: `You are an expert agricultural advisor specializing in crop diseases for Indian farmers. Provide practical, actionable advice.${langInstruction}`
        },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.5,
        maxTokens: 800
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  getLanguageName(code) {
    const languages = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'bn': 'Bengali',
      'mr': 'Marathi'
    };
    return languages[code] || 'English';
  }

  // Health check
  async checkHealth() {
    if (!this.isConfigured()) {
      return { success: false, status: 'not_configured', error: 'API key missing' };
    }

    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 5000
      });

      return {
        success: true,
        status: 'connected',
        models: response.data.data?.map(m => m.id) || []
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = new GroqService();
