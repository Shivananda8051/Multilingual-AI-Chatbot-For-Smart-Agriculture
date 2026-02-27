const axios = require('axios');

class TranslationService {
  constructor() {
    this.libreTranslateURL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5555';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Language code mapping
  languageMap = {
    'en': 'en',
    'hi': 'hi',
    'ta': 'ta',
    'te': 'te',
    'kn': 'kn',
    'ml': 'ml',
    'bn': 'bn',
    'mr': 'mr'
  };

  // Language names for display
  languageNames = {
    'en': 'English',
    'hi': 'हिंदी',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'kn': 'ಕನ್ನಡ',
    'ml': 'മലയാളം',
    'bn': 'বাংলা',
    'mr': 'मराठी'
  };

  // Generate cache key
  getCacheKey(text, sourceLang, targetLang) {
    return `${sourceLang}:${targetLang}:${text}`;
  }

  // Check cache
  getFromCache(text, sourceLang, targetLang) {
    const key = this.getCacheKey(text, sourceLang, targetLang);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.translation;
    }
    return null;
  }

  // Save to cache
  saveToCache(text, sourceLang, targetLang, translation) {
    const key = this.getCacheKey(text, sourceLang, targetLang);
    this.cache.set(key, { translation, timestamp: Date.now() });
  }

  // Try LibreTranslate first
  async translateWithLibreTranslate(text, sourceLang, targetLang) {
    try {
      const response = await axios.post(`${this.libreTranslateURL}/translate`, {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      }, { timeout: 5000 });

      return response.data.translatedText;
    } catch (error) {
      return null;
    }
  }

  // Fallback to MyMemory Translation API (Free)
  async translateWithMyMemory(text, sourceLang, targetLang) {
    try {
      const langPair = `${sourceLang}|${targetLang}`;
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: langPair,
          de: 'agribot@example.com' // Email for higher rate limit
        },
        timeout: 10000
      });

      if (response.data?.responseStatus === 200 && response.data?.responseData?.translatedText) {
        return response.data.responseData.translatedText;
      }
      return null;
    } catch (error) {
      console.error('MyMemory translation error:', error.message);
      return null;
    }
  }

  // Main translate function with fallbacks
  async translate(text, sourceLang, targetLang) {
    try {
      // If same language, return as is
      if (sourceLang === targetLang || !text || text.trim() === '') {
        return { success: true, translatedText: text };
      }

      // Check cache first
      const cached = this.getFromCache(text, sourceLang, targetLang);
      if (cached) {
        return { success: true, translatedText: cached, fromCache: true };
      }

      const source = this.languageMap[sourceLang] || 'en';
      const target = this.languageMap[targetLang] || 'en';

      // Try LibreTranslate first
      let translatedText = await this.translateWithLibreTranslate(text, source, target);

      // Fallback to MyMemory if LibreTranslate fails
      if (!translatedText) {
        translatedText = await this.translateWithMyMemory(text, source, target);
      }

      if (translatedText) {
        this.saveToCache(text, sourceLang, targetLang, translatedText);
        return {
          success: true,
          translatedText,
          sourceLang,
          targetLang
        };
      }

      // Return original text if all translations fail
      return {
        success: false,
        translatedText: text,
        error: 'Translation service unavailable'
      };
    } catch (error) {
      console.error('Translation error:', error.message);
      return {
        success: false,
        translatedText: text,
        error: 'Translation service unavailable'
      };
    }
  }

  // Batch translate multiple texts
  async translateBatch(texts, sourceLang, targetLang) {
    if (sourceLang === targetLang) {
      return texts.map(text => ({ original: text, translated: text }));
    }

    const results = await Promise.all(
      texts.map(async (text) => {
        const result = await this.translate(text, sourceLang, targetLang);
        return {
          original: text,
          translated: result.translatedText,
          success: result.success
        };
      })
    );

    return results;
  }

  // Translate an object's values (for UI translations)
  async translateObject(obj, sourceLang, targetLang) {
    if (sourceLang === targetLang) {
      return obj;
    }

    const result = {};
    const entries = Object.entries(obj);

    for (const [key, value] of entries) {
      if (typeof value === 'string') {
        const translated = await this.translate(value, sourceLang, targetLang);
        result[key] = translated.translatedText;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = await this.translateObject(value, sourceLang, targetLang);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  async detectLanguage(text) {
    try {
      // Try LibreTranslate first
      const response = await axios.post(`${this.libreTranslateURL}/detect`, {
        q: text
      }, { timeout: 5000 });

      if (response.data && response.data.length > 0) {
        return {
          success: true,
          language: response.data[0].language,
          confidence: response.data[0].confidence
        };
      }
      return { success: false, language: 'en', confidence: 0 };
    } catch (error) {
      // Default to English if detection fails
      return { success: false, language: 'en', confidence: 0 };
    }
  }

  async translateToEnglish(text, sourceLang) {
    return this.translate(text, sourceLang, 'en');
  }

  async translateFromEnglish(text, targetLang) {
    return this.translate(text, 'en', targetLang);
  }

  getLanguages() {
    return Object.entries(this.languageNames).map(([code, name]) => ({
      code,
      name
    }));
  }

  async checkHealth() {
    try {
      // Try LibreTranslate
      const libreResponse = await axios.get(`${this.libreTranslateURL}/languages`, { timeout: 3000 });
      return { success: true, provider: 'libretranslate', languages: libreResponse.data };
    } catch {
      // Check MyMemory availability
      try {
        const myMemoryResponse = await axios.get('https://api.mymemory.translated.net/get', {
          params: { q: 'hello', langpair: 'en|hi' },
          timeout: 5000
        });
        if (myMemoryResponse.data?.responseStatus === 200) {
          return { success: true, provider: 'mymemory' };
        }
      } catch {
        return { success: false, error: 'No translation service available' };
      }
    }
    return { success: false, error: 'Translation service unavailable' };
  }

  // Clear cache (for maintenance)
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new TranslationService();
