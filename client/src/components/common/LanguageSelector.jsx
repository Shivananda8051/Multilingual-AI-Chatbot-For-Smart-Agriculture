import { motion } from 'framer-motion';
import { HiCheck, HiRefresh, HiGlobe } from 'react-icons/hi';
import { useLanguage, languages } from '../../context/LanguageContext';

const LanguageSelector = ({ onClose }) => {
  const {
    language,
    changeLanguage,
    t,
    translationMode,
    toggleTranslationMode,
    clearTranslationCache,
    isTranslating
  } = useLanguage();

  const handleSelect = (langCode) => {
    changeLanguage(langCode);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-12 w-auto sm:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">
            {t('selectLanguage')}
          </h3>
        </div>

        <div className="py-2 max-h-56 overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                language === lang.code ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{lang.nativeName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</span>
              </div>
              {language === lang.code && (
                <HiCheck className="w-5 h-5 text-primary-600" />
              )}
            </button>
          ))}
        </div>

        {/* Translation Mode Toggle */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiGlobe className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Translation</span>
            </div>
            <button
              onClick={toggleTranslationMode}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                translationMode === 'runtime'
                  ? 'bg-primary-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  translationMode === 'runtime' ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {translationMode === 'runtime'
              ? 'Live translation (API)'
              : 'Static translation (Offline)'}
          </p>

          {/* Clear Cache Button */}
          {translationMode === 'runtime' && (
            <button
              onClick={clearTranslationCache}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition-colors"
            >
              <HiRefresh className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
              Clear translation cache
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default LanguageSelector;
