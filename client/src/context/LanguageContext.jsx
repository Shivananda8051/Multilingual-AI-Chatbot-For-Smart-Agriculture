import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { translateAPI } from '../services/api';
import staticTranslations from '../utils/translations';

const LanguageContext = createContext(null);

// Translation cache management
const CACHE_KEY = 'agribot_translations';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const getTranslationCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_EXPIRY) {
        return data.translations;
      }
    }
  } catch (e) {
    console.warn('Failed to read translation cache:', e);
  }
  return {};
};

const saveTranslationCache = (translations) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      translations,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to save translation cache:', e);
  }
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' }
];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });
  const [runtimeTranslations, setRuntimeTranslations] = useState(() => getTranslationCache());
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationMode, setTranslationMode] = useState(() => {
    return localStorage.getItem('translationMode') || 'runtime'; // 'static' or 'runtime'
  });
  const pendingTranslations = useRef(new Set());
  const translationQueue = useRef([]);
  const batchTimeout = useRef(null);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('translationMode', translationMode);
  }, [translationMode]);

  // Save runtime translations to cache when they change
  useEffect(() => {
    if (Object.keys(runtimeTranslations).length > 0) {
      saveTranslationCache(runtimeTranslations);
    }
  }, [runtimeTranslations]);

  // Get cache key for a translation
  const getCacheKey = useCallback((text, targetLang) => {
    return `${targetLang}:${text}`;
  }, []);

  // Process batched translations
  const processBatchTranslations = useCallback(async () => {
    if (translationQueue.current.length === 0) return;

    const batch = [...translationQueue.current];
    translationQueue.current = [];

    const textsToTranslate = batch.map(item => item.text);
    const targetLang = batch[0]?.targetLang || language;

    try {
      const response = await translateAPI.translateBatch(textsToTranslate, targetLang, 'en');

      if (response.data?.success && response.data?.translations) {
        const newTranslations = { ...runtimeTranslations };

        response.data.translations.forEach((result, index) => {
          const cacheKey = getCacheKey(batch[index].text, targetLang);
          newTranslations[cacheKey] = result.translated;
          pendingTranslations.current.delete(batch[index].text);
        });

        setRuntimeTranslations(newTranslations);
      }
    } catch (error) {
      console.error('Batch translation error:', error);
      // Clear pending translations on error
      batch.forEach(item => pendingTranslations.current.delete(item.text));
    }
  }, [language, runtimeTranslations, getCacheKey]);

  // Queue a text for batch translation
  const queueTranslation = useCallback((text, targetLang) => {
    if (pendingTranslations.current.has(text)) return;

    pendingTranslations.current.add(text);
    translationQueue.current.push({ text, targetLang });

    // Clear existing timeout and set a new one
    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
    }

    // Process batch after 100ms of no new requests, or if batch is large enough
    if (translationQueue.current.length >= 20) {
      processBatchTranslations();
    } else {
      batchTimeout.current = setTimeout(processBatchTranslations, 100);
    }
  }, [processBatchTranslations]);

  // Translate a single text (returns immediately with fallback, updates async)
  const translateText = useCallback(async (text, targetLang = language) => {
    if (!text || targetLang === 'en') return text;

    const cacheKey = getCacheKey(text, targetLang);

    // Check cache first
    if (runtimeTranslations[cacheKey]) {
      return runtimeTranslations[cacheKey];
    }

    // Queue for batch translation
    queueTranslation(text, targetLang);

    // Return original text while translation is pending
    return text;
  }, [language, runtimeTranslations, getCacheKey, queueTranslation]);

  // Get translation from static file or runtime cache
  const t = useCallback((key) => {
    // For English, always use static translations
    if (language === 'en') {
      const keys = key.split('.');
      let value = staticTranslations.en;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    }

    // If using static mode, use static translations
    if (translationMode === 'static') {
      const keys = key.split('.');
      let value = staticTranslations[language];
      for (const k of keys) {
        value = value?.[k];
      }
      // Fallback to English if not found
      if (!value) {
        value = staticTranslations.en;
        for (const k of keys) {
          value = value?.[k];
        }
      }
      return value || key;
    }

    // Runtime mode: Check runtime cache first
    const keys = key.split('.');
    let englishValue = staticTranslations.en;
    for (const k of keys) {
      englishValue = englishValue?.[k];
    }

    if (!englishValue) return key;

    const cacheKey = getCacheKey(englishValue, language);

    // Return cached translation if available
    if (runtimeTranslations[cacheKey]) {
      return runtimeTranslations[cacheKey];
    }

    // Check static translations as fallback
    let staticValue = staticTranslations[language];
    for (const k of keys) {
      staticValue = staticValue?.[k];
    }

    if (staticValue) {
      return staticValue;
    }

    // Queue for runtime translation
    queueTranslation(englishValue, language);

    // Return English value while waiting for translation
    return englishValue;
  }, [language, translationMode, runtimeTranslations, getCacheKey, queueTranslation]);

  // Translate dynamic content (not from static keys)
  const translateDynamic = useCallback(async (text) => {
    if (!text || language === 'en') return text;

    const cacheKey = getCacheKey(text, language);

    // Check cache
    if (runtimeTranslations[cacheKey]) {
      return runtimeTranslations[cacheKey];
    }

    // Try to translate via API
    try {
      setIsTranslating(true);
      const response = await translateAPI.translateText(text, language, 'en');

      if (response.data?.success && response.data?.translatedText) {
        const newTranslations = { ...runtimeTranslations };
        newTranslations[cacheKey] = response.data.translatedText;
        setRuntimeTranslations(newTranslations);
        return response.data.translatedText;
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }

    return text;
  }, [language, runtimeTranslations, getCacheKey]);

  const changeLanguage = useCallback((langCode) => {
    if (languages.find(l => l.code === langCode)) {
      setLanguage(langCode);
    }
  }, []);

  const getCurrentLanguage = useCallback(() => {
    return languages.find(l => l.code === language) || languages[0];
  }, [language]);

  const toggleTranslationMode = useCallback(() => {
    setTranslationMode(prev => prev === 'static' ? 'runtime' : 'static');
  }, []);

  // Clear translation cache
  const clearTranslationCache = useCallback(() => {
    setRuntimeTranslations({});
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const value = {
    language,
    languages,
    t,
    translateText,
    translateDynamic,
    changeLanguage,
    getCurrentLanguage,
    isTranslating,
    translationMode,
    toggleTranslationMode,
    clearTranslationCache
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
