import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCamera, HiUpload, HiX, HiLightBulb, HiExclamation, HiClock, HiTrash, HiPhotograph } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { diseaseAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Disease = () => {
  const [activeTab, setActiveTab] = useState('detect');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [cropType, setCropType] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const { t, language } = useLanguage();

  // Load history when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await diseaseAPI.getHistory();
      setHistory(response.data.history);
    } catch (error) {
      toast.error(t('failedToLoadHistory'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!confirm(t('deleteFromHistory'))) return;
    try {
      await diseaseAPI.deleteDetection(id);
      setHistory(prev => prev.filter(item => item._id !== id));
      toast.success(t('deletedFromHistory'));
    } catch (error) {
      toast.error(t('failedToDelete'));
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleAnalyze = async () => {
    if (!image) {
      toast.error(t('pleaseUploadImage'));
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('cropType', cropType);
    formData.append('language', language);

    try {
      const response = await diseaseAPI.detect(formData);
      setResult(response.data.result);
      toast.success(t('analysisComplete'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('failedToAnalyzeImage'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setCropType('');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'healthy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'mild': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'moderate': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'severe': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold">{t('diseaseDetection')}</h1>
        <p className="text-gray-500 mt-1">
          {t('uploadPhotoDesc')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => { setActiveTab('detect'); setSelectedHistory(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'detect'
              ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiCamera className="w-5 h-5" />
          {t('newDetection')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiClock className="w-5 h-5" />
          {t('history')}
        </button>
      </div>

      {activeTab === 'history' ? (
        /* History View */
        <div className="space-y-4">
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : selectedHistory ? (
            /* Selected History Detail */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <button
                onClick={() => setSelectedHistory(null)}
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                {t('backToHistory')}
              </button>
              <div className="card overflow-hidden">
                <img
                  src={selectedHistory.imageUrl}
                  alt="Detection"
                  className="w-full max-h-48 object-cover"
                />
              </div>
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">
                    {format(new Date(selectedHistory.createdAt), 'PPp')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedHistory.severity)}`}>
                    {selectedHistory.severity}
                  </span>
                </div>
                <p className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('crop')}: {selectedHistory.cropType}
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                  <ReactMarkdown>{selectedHistory.analysis}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ) : history.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiPhotograph className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">{t('noHistoryYet')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('detectionsAppearHere')}</p>
            </div>
          ) : (
            /* History List */
            <div className="space-y-3">
              {history.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-3 flex gap-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedHistory(item)}
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt="Detection"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">{item.cropType}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {item.analysis.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(item.createdAt), 'PP')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(item._id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg self-center"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`card p-8 border-2 border-dashed cursor-pointer transition-all ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
                    <HiUpload className="w-8 h-8 text-primary-600" />
                  </div>
                  <p className="text-lg font-medium">{t('uploadImage')}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {t('dragDropOrClick')}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {t('supportsFormats')}
                  </p>
                </div>
              )}
            </div>

            {/* Camera Option (Mobile) */}
            <div className="flex gap-2">
              <label className="btn btn-outline flex-1 cursor-pointer">
                <HiCamera className="w-5 h-5" />
                {t('takePhoto')}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setImage(file);
                      setPreview(URL.createObjectURL(file));
                      setResult(null);
                    }
                  }}
                />
              </label>
            </div>

            {/* Crop Type */}
            {preview && (
              <div>
                <label className="block text-sm font-medium mb-2">{t('cropType')} ({t('optional')})</label>
                <input
                  type="text"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  placeholder={t('cropPlaceholder')}
                  className="input"
                />
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!image || loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  {t('analyzing')}
                </>
              ) : (
                <>
                  <HiLightBulb className="w-5 h-5" />
                  {t('analyzeImage')}
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Preview */}
            <div className="card overflow-hidden">
              <img
                src={preview}
                alt="Analyzed"
                className="w-full max-h-48 object-cover"
              />
            </div>

            {/* Analysis Result */}
            <div className="card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                  <HiExclamation className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{t('diagnosis')}</h3>
                  <div className="mt-2 prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    <ReactMarkdown>{result.analysis}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="btn btn-outline flex-1"
              >
                <HiCamera className="w-5 h-5" />
                {t('newAnalysis')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  loadHistory();
                  handleReset();
                }}
                className="btn btn-primary flex-1"
              >
                <HiClock className="w-5 h-5" />
                {t('viewHistory')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      )}

      {/* Tips - only show on detect tab */}
      {activeTab === 'detect' && (
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t('tipsForBetterResults')}</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• {t('tipGoodLighting')}</li>
            <li>• {t('tipFocusAffected')}</li>
            <li>• {t('tipIncludeBoth')}</li>
            <li>• {t('tipSpecifyCrop')}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Disease;
