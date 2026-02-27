const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'kimi-k2:1t-cloud';
    this.visionModel = process.env.OLLAMA_VISION_MODEL || 'llava';
  }

  // Language names for prompts
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

  // Check if message is a greeting
  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'hii', 'hiii', 'namaste', 'namaskar', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings'];
    const lowerMsg = message.toLowerCase().trim();
    return greetings.some(g => lowerMsg === g || lowerMsg.startsWith(g + ' ') || lowerMsg.startsWith(g + ',') || lowerMsg.startsWith(g + '!'));
  }

  // Get greeting response in user's language
  getGreetingResponse(language = 'en') {
    const greetings = {
      en: [
        "Hello! I'm AgriBot, your farming assistant. How can I help you today with your crops, farming, or agricultural needs?",
        "Hi there! I'm AgriBot, here to help with all your agricultural questions. What would you like to know about farming?",
        "Hello farmer! I'm AgriBot. How can I help you today? Feel free to ask about crops, diseases, irrigation, or any farming topic!"
      ],
      hi: [
        "नमस्ते! मैं एग्रीबॉट हूं, आपका खेती सहायक। आज मैं आपकी फसलों, खेती या कृषि संबंधी जरूरतों में कैसे मदद कर सकता हूं?",
        "नमस्कार! मैं एग्रीबॉट हूं। खेती से जुड़े सवाल पूछें - फसल, कीट नियंत्रण, उर्वरक या सरकारी योजनाएं!",
        "प्रणाम किसान भाई! मैं एग्रीबॉट हूं। फसल, रोग, सिंचाई या किसी भी खेती विषय पर पूछें!"
      ],
      kn: [
        "ನಮಸ್ಕಾರ! ನಾನು ಅಗ್ರಿಬಾಟ್, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ಬೆಳೆಗಳು, ಕೃಷಿ ಅಥವಾ ಕೃಷಿ ಅಗತ್ಯಗಳಲ್ಲಿ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
        "ನಮಸ್ತೆ! ನಾನು ಅಗ್ರಿಬಾಟ್. ಕೃಷಿ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ - ಬೆಳೆ, ಕೀಟ ನಿಯಂತ್ರಣ, ಗೊಬ್ಬರ ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು!",
        "ನಮಸ್ಕಾರ ರೈತ ಬಂಧು! ಬೆಳೆ, ರೋಗ, ನೀರಾವರಿ ಅಥವಾ ಯಾವುದೇ ಕೃಷಿ ವಿಷಯದ ಬಗ್ಗೆ ಕೇಳಿ!"
      ],
      ta: [
        "வணக்கம்! நான் அக்ரிபாட், உங்கள் விவசாய உதவியாளர். பயிர்கள், விவசாயம் அல்லது விவசாய தேவைகளில் நான் எவ்வாறு உதவ முடியும்?",
        "நமஸ்தே! நான் அக்ரிபாட். விவசாய கேள்விகளைக் கேளுங்கள் - பயிர், பூச்சி கட்டுப்பாடு, உரம் அல்லது அரசு திட்டங்கள்!"
      ],
      te: [
        "నమస్కారం! నేను అగ్రిబాట్, మీ వ్యవసాయ సహాయకుడిని. పంటలు, వ్యవసాయం లేదా వ్యవసాయ అవసరాలలో నేను ఎలా సహాయపడగలను?",
        "నమస్తే! నేను అగ్రిబాట్. వ్యవసాయ ప్రశ్నలు అడగండి - పంట, పురుగు నియంత్రణ, ఎరువులు లేదా ప్రభుత్వ పథకాలు!"
      ],
      mr: [
        "नमस्कार! मी अ‍ॅग्रीबॉट आहे, तुमचा शेती सहाय्यक. पिके, शेती किंवा कृषी गरजांमध्ये मी कशी मदत करू शकतो?",
        "नमस्ते! मी अ‍ॅग्रीबॉट आहे. शेतीविषयक प्रश्न विचारा - पीक, कीड नियंत्रण, खते किंवा सरकारी योजना!"
      ],
      bn: [
        "নমস্কার! আমি অ্যাগ্রিবট, আপনার কৃষি সহায়ক। ফসল, চাষ বা কৃষি প্রয়োজনে আমি কীভাবে সাহায্য করতে পারি?",
        "হ্যালো! আমি অ্যাগ্রিবট। কৃষি প্রশ্ন জিজ্ঞাসা করুন - ফসল, কীটপতঙ্গ নিয়ন্ত্রণ, সার বা সরকারি প্রকল্প!"
      ],
      ml: [
        "നമസ്കാരം! ഞാൻ അഗ്രിബോട്ട്, നിങ്ങളുടെ കൃഷി സഹായി. വിളകൾ, കൃഷി അല്ലെങ്കിൽ കാർഷിക ആവശ്യങ്ങളിൽ എനിക്ക് എങ്ങനെ സഹായിക്കാനാകും?",
        "ഹലോ! ഞാൻ അഗ്രിബോട്ട്. കൃഷി ചോദ്യങ്ങൾ ചോദിക്കൂ - വിള, കീട നിയന്ത്രണം, വളം അല്ലെങ്കിൽ സർക്കാർ പദ്ധതികൾ!"
      ]
    };

    const langGreetings = greetings[language] || greetings.en;
    return langGreetings[Math.floor(Math.random() * langGreetings.length)];
  }

  // System prompt for agricultural domain expertise
  getSystemPrompt(language = 'en') {
    const langName = this.getLanguageName(language);
    const languageInstruction = language !== 'en'
      ? `\n\nIMPORTANT: You MUST respond ENTIRELY in ${langName} language. All your responses, including greetings, tips, and explanations must be in ${langName}.`
      : '';

    return `You are AgriBot, an expert agricultural advisor AI assistant for Indian farmers.

CRITICAL RULES:
1. Keep answers SHORT - 2-4 bullet points max
2. Be direct and practical
3. Use simple language

FORMAT:
- Use "- " for bullets (one per line)
- Use **bold** for headings
- No long paragraphs

EXAMPLE RESPONSE:
**Quick Tips:**
- Point one here
- Point two here
- Point three here

RESTRICTIONS:
- ONLY answer agriculture/farming questions
- For non-farming topics, say: "I'm AgriBot, your farming assistant. Please ask me about crops, farming, pest control, or livestock!"

EXPERTISE: Crops, pests, fertilizers, irrigation, weather advice, livestock, government schemes (PM-KISAN), organic farming, market prices.

Be concise. Indian farmers need quick, actionable advice.${languageInstruction}`;
  }

  // Generate related suggestions based on user's question
  async generateSuggestions(userQuestion, aiResponse, language = 'en') {
    try {
      const langName = this.getLanguageName(language);
      const langInstruction = language !== 'en'
        ? ` Generate the questions in ${langName} language.`
        : '';

      const prompt = `Farmer asked: "${userQuestion}"

Generate exactly 3 SHORT follow-up questions about FARMING/AGRICULTURE only.${langInstruction}

RULES:
- Questions MUST be about crops, farming, agriculture, weather, fertilizers, pests, irrigation, seeds, harvest, livestock, soil, or government farming schemes
- NO personal questions (no "what is my name", "where do I live", etc.)
- NO questions about AI or chatbot
- Keep each question under 8 words
- Questions should help the farmer with their agricultural work

Return ONLY a JSON array, nothing else.
Example: ["Best fertilizer for rice?", "When to water crops?", "How to control pests?"]`;

      const response = await axios.post(`${this.baseURL}/api/chat`, {
        model: this.model,
        messages: [
          { role: 'system', content: `You generate ONLY farming/agriculture related follow-up questions. NEVER generate personal questions or questions about AI. Return ONLY a JSON array of 3 farming questions.${language !== 'en' ? ` Questions must be in ${langName} language.` : ''}` },
          { role: 'user', content: prompt }
        ],
        stream: false,
        options: {
          temperature: 0.5,
          top_p: 0.9
        }
      });

      const content = response.data.message.content.trim();

      // Try to parse JSON from response
      try {
        // Find JSON array in response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          let suggestions = JSON.parse(jsonMatch[0]);
          if (Array.isArray(suggestions) && suggestions.length > 0) {
            // Filter out non-farming questions
            const badPatterns = /\b(my name|your name|who am i|where .* live|hometown|AI|chatbot|robot|assistant|help me|what can you|tell me about yourself)\b/i;
            suggestions = suggestions
              .slice(0, 3)
              .map(s => s.trim())
              .filter(s => !badPatterns.test(s));

            if (suggestions.length >= 2) {
              return suggestions;
            }
          }
        }
      } catch (parseError) {
        console.error('Failed to parse suggestions:', parseError);
      }

      // Fallback suggestions based on common farming topics
      return this.getFallbackSuggestions(userQuestion, language);
    } catch (error) {
      console.error('Suggestion generation error:', error.message);
      return this.getFallbackSuggestions(userQuestion, language);
    }
  }

  // Fallback suggestions if AI generation fails
  getFallbackSuggestions(question, language = 'en') {
    // Default farming suggestions by language
    const defaultSuggestions = {
      en: ['Best crop for this season?', 'How to improve soil health?', 'Government farming schemes?'],
      hi: ['इस मौसम के लिए सबसे अच्छी फसल?', 'मिट्टी की सेहत कैसे सुधारें?', 'सरकारी कृषि योजनाएं?'],
      kn: ['ಈ ಋತುವಿಗೆ ಉತ್ತಮ ಬೆಳೆ?', 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಸುಧಾರಿಸುವುದು?', 'ಸರ್ಕಾರಿ ಕೃಷಿ ಯೋಜನೆಗಳು?'],
      ta: ['இந்த பருவத்திற்கு சிறந்த பயிர்?', 'மண் ஆரோக்கியத்தை மேம்படுத்துவது?', 'அரசு விவசாய திட்டங்கள்?'],
      te: ['ఈ సీజన్‌కు ఉత్తమ పంట?', 'నేల ఆరోగ్యాన్ని మెరుగుపరచడం?', 'ప్రభుత్వ వ్యవసాయ పథకాలు?'],
      mr: ['या हंगामासाठी सर्वोत्तम पीक?', 'मातीचे आरोग्य सुधारणे?', 'सरकारी शेती योजना?'],
      bn: ['এই মৌসুমের জন্য সেরা ফসল?', 'মাটির স্বাস্থ্য উন্নত করা?', 'সরকারি কৃষি প্রকল্প?'],
      ml: ['ഈ സീസണിലെ മികച്ച വിള?', 'മണ്ണിന്റെ ആരോഗ്യം മെച്ചപ്പെടുത്തുക?', 'സർക്കാർ കൃഷി പദ്ധതികൾ?']
    };

    const lowerQuestion = question.toLowerCase();

    // English keyword-based suggestions
    if (language === 'en') {
      if (lowerQuestion.includes('rice') || lowerQuestion.includes('paddy')) {
        return ['Best fertilizer for rice?', 'Rice pest control tips?', 'When to harvest rice?'];
      } else if (lowerQuestion.includes('wheat')) {
        return ['Wheat irrigation schedule?', 'Wheat disease prevention?', 'Best wheat varieties?'];
      } else if (lowerQuestion.includes('cotton')) {
        return ['Cotton pest management?', 'Cotton water requirements?', 'Cotton harvesting time?'];
      } else if (lowerQuestion.includes('tomato') || lowerQuestion.includes('vegetable')) {
        return ['Tomato disease control?', 'Best vegetable fertilizers?', 'Organic pest control?'];
      } else if (lowerQuestion.includes('fertilizer') || lowerQuestion.includes('manure')) {
        return ['Organic vs chemical fertilizer?', 'When to apply fertilizer?', 'Soil testing methods?'];
      } else if (lowerQuestion.includes('pest') || lowerQuestion.includes('disease')) {
        return ['Natural pest remedies?', 'Pesticide application tips?', 'Disease prevention methods?'];
      } else if (lowerQuestion.includes('irrigation') || lowerQuestion.includes('water')) {
        return ['Drip irrigation benefits?', 'Water saving techniques?', 'Best irrigation time?'];
      }
    }

    return defaultSuggestions[language] || defaultSuggestions.en;
  }

  async chat(messages, userContext = {}, language = 'en') {
    try {
      // Check if the last message is a greeting
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user' && this.isGreeting(lastMessage.content)) {
        return {
          success: true,
          message: this.getGreetingResponse(language),
          model: 'greeting-handler'
        };
      }

      // Prepare messages with system prompt (includes language instruction)
      const fullMessages = [
        { role: 'system', content: this.getSystemPrompt(language) },
        ...messages
      ];

      // Add user context if available
      if (userContext.location || userContext.crops) {
        const contextPrompt = `User context: Location: ${userContext.location || 'India'}, Main crops: ${userContext.crops?.join(', ') || 'various crops'}`;
        fullMessages[0].content += `\n\n${contextPrompt}`;
      }

      const response = await axios.post(`${this.baseURL}/api/chat`, {
        model: this.model,
        messages: fullMessages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 300  // Limit response length for shorter answers
        }
      });

      return {
        success: true,
        message: response.data.message.content,
        model: this.model
      };
    } catch (error) {
      console.error('Ollama chat error:', error.message);
      throw new Error('Failed to get response from AI. Please try again.');
    }
  }

  async streamChat(messages, onChunk) {
    try {
      const fullMessages = [
        { role: 'system', content: this.getSystemPrompt() },
        ...messages
      ];

      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: this.model,
          messages: fullMessages,
          stream: true
        },
        {
          responseType: 'stream'
        }
      );

      let fullResponse = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                fullResponse += data.message.content;
                onChunk(data.message.content);
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        });

        response.data.on('end', () => {
          resolve({ success: true, message: fullResponse });
        });

        response.data.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Ollama stream error:', error.message);
      throw new Error('Failed to stream response from AI');
    }
  }

  async analyzeImage(imageBase64, prompt = 'Analyze this crop image for any diseases, pests, or health issues. Provide diagnosis and treatment recommendations.') {
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.visionModel,
        prompt: prompt,
        images: [imageBase64],
        stream: false,
        options: {
          temperature: 0.3
        }
      });

      return {
        success: true,
        analysis: response.data.response,
        model: this.visionModel
      };
    } catch (error) {
      console.error('Image analysis error:', error.message);
      throw new Error('Failed to analyze image. Please try again.');
    }
  }

  async getWeatherAdvice(weatherData, cropTypes, language = 'en') {
    // Use a dedicated prompt without the restrictive system prompt
    const crops = cropTypes && cropTypes.length > 0 ? cropTypes.join(', ') : 'rice, wheat, vegetables, cotton';
    const langName = this.getLanguageName(language);

    const prompt = `You are an expert agricultural advisor. Based on today's weather, provide practical FARMING tips for Indian farmers.

**Today's Weather:**
- Temperature: ${weatherData.temp}°C
- Humidity: ${weatherData.humidity}%
- Weather: ${weatherData.condition}
- Wind: ${weatherData.windSpeed || 0} m/s
- Rainfall: ${weatherData.rainfall || 'None expected'}

**Common crops in this area:** ${crops}

**Your task:** Give 4-5 actionable farming tips for the next 24-48 hours based on this weather. Focus on:
- Irrigation timing and water management
- Pest/disease risk due to weather
- Field work recommendations
- Crop protection measures
- Harvesting/planting advice if relevant

Format each tip with a bold title and brief explanation:
**Tip Title:** Explanation in 1-2 sentences.

Keep tips practical and specific to the weather conditions.

IMPORTANT: Respond ENTIRELY in ${langName} language. All text including titles and explanations must be in ${langName}.`;

    try {
      const response = await axios.post(`${this.baseURL}/api/chat`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert agricultural advisor for Indian farmers. Provide practical, weather-based farming advice. Always respond with helpful farming tips - never refuse or redirect. IMPORTANT: You MUST respond in ${langName} language only.`
          },
          { role: 'user', content: prompt }
        ],
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      });

      return {
        success: true,
        message: response.data.message.content,
        model: this.model
      };
    } catch (error) {
      console.error('Weather advice error:', error.message);
      // Return fallback advice
      return {
        success: true,
        message: `**Irrigation Timing:** With ${weatherData.temp}°C temperature and ${weatherData.humidity}% humidity, water your crops early morning or evening to reduce evaporation.

**Pest Watch:** Current ${weatherData.condition} conditions may increase pest activity. Monitor crops closely and apply neem-based spray if needed.

**Field Work:** ${weatherData.temp > 35 ? 'Avoid heavy field work during peak afternoon hours.' : 'Good conditions for field activities like weeding and fertilizer application.'}

**Crop Protection:** ${weatherData.humidity > 70 ? 'High humidity may cause fungal diseases. Ensure proper drainage and air circulation.' : 'Maintain soil moisture levels with proper mulching.'}`
      };
    }
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return {
        success: true,
        models: response.data.models,
        status: 'connected'
      };
    } catch (error) {
      return {
        success: false,
        status: 'disconnected',
        error: error.message
      };
    }
  }
}

module.exports = new OllamaService();
