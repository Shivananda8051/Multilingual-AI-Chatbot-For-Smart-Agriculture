import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiPlus, HiX, HiCalendar, HiClock, HiCheck,
  HiTrash, HiPencil, HiExclamation,
  HiLightBulb, HiLocationMarker, HiRefresh
} from 'react-icons/hi';
import { FaWater, FaLeaf, FaTint, FaFlask, FaCloudRain, FaSun, FaTemperatureHigh } from 'react-icons/fa';
import { WiHumidity, WiThermometer, WiRain, WiDaySunny, WiCloudy } from 'react-icons/wi';
import { useLanguage } from '../context/LanguageContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { weatherAPI, chatAPI } from '../services/api';
import toast from 'react-hot-toast';

// Irrigation Methods with translation keys
const irrigationMethods = [
  { id: 'drip', nameKey: 'methodDrip', icon: '💧', waterEfficiency: 90 },
  { id: 'sprinkler', nameKey: 'methodSprinkler', icon: '🌧️', waterEfficiency: 75 },
  { id: 'flood', nameKey: 'methodFlood', icon: '🌊', waterEfficiency: 50 },
  { id: 'furrow', nameKey: 'methodFurrow', icon: '〰️', waterEfficiency: 60 },
  { id: 'manual', nameKey: 'methodManual', icon: '🪣', waterEfficiency: 65 },
];

// Fertilizer Types
const fertilizerTypes = [
  { id: 'urea', name: 'Urea', npk: '46-0-0', category: 'nitrogen' },
  { id: 'dap', name: 'DAP', npk: '18-46-0', category: 'phosphorus' },
  { id: 'mop', name: 'MOP (Potash)', npk: '0-0-60', category: 'potassium' },
  { id: 'npk', name: 'NPK Complex', npk: '10-26-26', category: 'mixed' },
  { id: 'ssp', name: 'SSP', npk: '0-16-0', category: 'phosphorus' },
  { id: 'organic', name: 'Organic/Compost', npk: 'Variable', category: 'organic' },
  { id: 'vermicompost', name: 'Vermicompost', npk: '1.5-0.5-1', category: 'organic' },
  { id: 'neem', name: 'Neem Cake', npk: '5-1-2', category: 'organic' },
];

// Generate AI prompt for tips
const generateAIPrompt = (weather, activeTab, language) => {
  const temp = weather?.main?.temp;
  const humidity = weather?.main?.humidity;
  const weatherCondition = weather?.weather?.[0]?.main;
  const description = weather?.weather?.[0]?.description;
  const location = weather?.name;

  const languageNames = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    ml: 'Malayalam',
    bn: 'Bengali',
    mr: 'Marathi'
  };

  const langName = languageNames[language] || 'English';

  if (activeTab === 'irrigation') {
    return `You are an agricultural expert. Based on the current weather conditions, provide 3-4 specific irrigation tips for farmers.

Current Weather at ${location || 'the location'}:
- Temperature: ${temp ? Math.round(temp) + '°C' : 'Unknown'}
- Humidity: ${humidity ? humidity + '%' : 'Unknown'}
- Weather: ${description || weatherCondition || 'Unknown'}

Provide practical, actionable irrigation tips considering:
1. Best time to irrigate today
2. Water quantity adjustments needed
3. Any warnings based on weather
4. Water-saving suggestions

IMPORTANT: Respond in ${langName} language only. Keep each tip concise (1-2 sentences). Format as a simple numbered list.`;
  } else {
    return `You are an agricultural expert. Based on the current weather conditions, provide 3-4 specific fertilizer application tips for farmers.

Current Weather at ${location || 'the location'}:
- Temperature: ${temp ? Math.round(temp) + '°C' : 'Unknown'}
- Humidity: ${humidity ? humidity + '%' : 'Unknown'}
- Weather: ${description || weatherCondition || 'Unknown'}

Provide practical, actionable fertilizer tips considering:
1. Whether it's safe to apply fertilizer today
2. Best application method for current conditions
3. Any warnings based on weather
4. Optimal timing suggestions

IMPORTANT: Respond in ${langName} language only. Keep each tip concise (1-2 sentences). Format as a simple numbered list.`;
  }
};

// Parse AI response into tips array
const parseAITips = (response) => {
  if (!response) return [];

  const lines = response.split('\n').filter(line => line.trim());
  const tips = [];

  for (const line of lines) {
    const cleanedLine = line.replace(/^\d+[\.\)]\s*/, '').trim();
    if (cleanedLine && cleanedLine.length > 10) {
      // Determine icon and priority based on content
      let icon = 'tip';
      let priority = 'normal';

      const lowerLine = cleanedLine.toLowerCase();
      if (lowerLine.includes('rain') || lowerLine.includes('बारिश') || lowerLine.includes('மழை') || lowerLine.includes('వర్షం') || lowerLine.includes('ಮಳೆ')) {
        icon = 'rain';
        priority = 'high';
      } else if (lowerLine.includes('warning') || lowerLine.includes('avoid') || lowerLine.includes('don\'t') || lowerLine.includes('not') || lowerLine.includes('नहीं') || lowerLine.includes('बचें')) {
        icon = 'warning';
        priority = 'high';
      } else if (lowerLine.includes('temperature') || lowerLine.includes('hot') || lowerLine.includes('heat') || lowerLine.includes('तापमान') || lowerLine.includes('गर्म')) {
        icon = 'hot';
      } else if (lowerLine.includes('humidity') || lowerLine.includes('नमी') || lowerLine.includes('ஈரப்பதம்')) {
        icon = 'humidity';
      } else if (lowerLine.includes('water') || lowerLine.includes('irrigat') || lowerLine.includes('पानी') || lowerLine.includes('सिंचाई')) {
        icon = 'water';
      } else if (lowerLine.includes('morning') || lowerLine.includes('sun') || lowerLine.includes('सुबह')) {
        icon = 'sun';
      }

      tips.push({ text: cleanedLine, icon, priority });
    }
  }

  return tips.slice(0, 5); // Max 5 tips
};

// Weather-based Tips Panel Component with AI
const WeatherTipsPanel = ({ weather, weatherLoading, location, locationLoading, locationError, onRefresh, onCitySearch, activeTab, t, language }) => {
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [lastFetchKey, setLastFetchKey] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [showCityInput, setShowCityInput] = useState(false);

  // Fetch AI-generated tips
  const fetchAITips = async () => {
    if (!weather) return;

    const fetchKey = `${activeTab}-${weather?.main?.temp}-${weather?.main?.humidity}-${language}`;
    if (fetchKey === lastFetchKey && tips.length > 0) return;

    setTipsLoading(true);
    try {
      const prompt = generateAIPrompt(weather, activeTab, language);
      const response = await chatAPI.sendMessage(prompt, language);
      const aiResponse = response.data?.response || response.data?.message || '';
      const parsedTips = parseAITips(aiResponse);

      if (parsedTips.length > 0) {
        setTips(parsedTips);
        setLastFetchKey(fetchKey);
      }
    } catch (error) {
      console.error('Failed to fetch AI tips:', error);
      // Set default tips on error
      setTips([
        { text: t('tipIrrigationMorning') || 'Water early morning (5-7 AM) to reduce evaporation', icon: 'sun', priority: 'normal' }
      ]);
    } finally {
      setTipsLoading(false);
    }
  };

  // Fetch tips when weather or activeTab changes
  useEffect(() => {
    if (weather && !weatherLoading) {
      fetchAITips();
    }
  }, [weather, activeTab, language]);

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'rain': return <WiRain className="w-5 h-5 text-blue-500" />;
      case 'sun': return <WiDaySunny className="w-5 h-5 text-yellow-500" />;
      case 'hot': return <FaTemperatureHigh className="w-4 h-4 text-red-500" />;
      case 'cold': return <WiThermometer className="w-5 h-5 text-blue-400" />;
      case 'humidity': return <WiHumidity className="w-5 h-5 text-cyan-500" />;
      case 'water': return <FaTint className="w-4 h-4 text-blue-500" />;
      case 'cloud': return <WiCloudy className="w-5 h-5 text-gray-500" />;
      case 'warning': return <HiExclamation className="w-5 h-5 text-orange-500" />;
      default: return <HiLightBulb className="w-5 h-5 text-yellow-500" />;
    }
  };

  const handleRefresh = () => {
    setLastFetchKey(''); // Reset to force refresh
    onRefresh();
    if (weather) {
      fetchAITips();
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4">
      {/* Weather Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HiLightBulb className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {activeTab === 'irrigation' ? (t('irrigationTips') || 'Irrigation Tips') : (t('fertilizerTips') || 'Fertilizer Tips')}
          </h3>
          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
            AI
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={weatherLoading || tipsLoading}
          className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <HiRefresh className={`w-4 h-4 text-amber-600 ${(weatherLoading || tipsLoading) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current Weather Display */}
      {weather && (
        <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <HiLocationMarker className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{weather.name || t('yourLocation') || 'Your Location'}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <WiThermometer className="w-5 h-5 text-orange-500" />
              <span className="font-medium">{Math.round(weather.main?.temp)}°C</span>
            </span>
            <span className="flex items-center gap-1">
              <WiHumidity className="w-5 h-5 text-blue-500" />
              <span>{weather.main?.humidity}%</span>
            </span>
            <span className="capitalize text-gray-600 dark:text-gray-400">
              {weather.weather?.[0]?.description}
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(weatherLoading || tipsLoading) && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {tipsLoading ? (t('generatingTips') || 'AI is generating personalized tips...') : (t('loadingWeather') || 'Loading weather data...')}
          </span>
        </div>
      )}

      {/* Location Loading */}
      {locationLoading && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {t('fetchingLocation') || 'Fetching your location...'}
          </span>
        </div>
      )}

      {/* Location Error with Manual City Input */}
      {locationError && !locationLoading && !weather && (
        <div className="flex flex-col gap-3 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <HiExclamation className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {locationError}
            </span>
          </div>

          {!showCityInput ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onRefresh}
                className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
              >
                {t('tryAgain') || 'Try Again'}
              </button>
              <span className="text-xs text-gray-500">or</span>
              <button
                onClick={() => setShowCityInput(true)}
                className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
              >
                {t('enterCityManually') || 'Enter city manually'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                placeholder={t('enterCityName') || 'Enter city name (e.g., Mumbai, Delhi)'}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualCity.trim()) {
                    onCitySearch(manualCity.trim());
                  }
                }}
              />
              <button
                onClick={() => {
                  if (manualCity.trim()) {
                    onCitySearch(manualCity.trim());
                  }
                }}
                disabled={!manualCity.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('search') || 'Search'}
              </button>
              <button
                onClick={() => {
                  setShowCityInput(false);
                  setManualCity('');
                }}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <HiX className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Location - only show if not loading and no error */}
      {!location && !locationLoading && !locationError && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <HiLocationMarker className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-orange-700 dark:text-orange-300">
            {t('enableLocation') || 'Enable location for personalized weather-based tips'}
          </span>
        </div>
      )}

      {/* Tips List */}
      {!tipsLoading && tips.length > 0 && (
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li
              key={index}
              className={`flex items-start gap-2 text-sm p-2 rounded-lg ${
                tip.priority === 'high'
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {getIcon(tip.icon)}
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      )}

      {/* No tips yet */}
      {!tipsLoading && tips.length === 0 && weather && (
        <div className="text-center py-4 text-gray-500">
          <p>{t('clickRefreshForTips') || 'Click refresh to get AI-powered tips'}</p>
        </div>
      )}
    </div>
  );
};

// Add Irrigation Modal
const AddIrrigationModal = ({ isOpen, onClose, onAdd, editData, t }) => {
  const [formData, setFormData] = useState({
    cropName: '',
    fieldName: '',
    method: 'drip',
    waterAmount: '',
    unit: 'liters',
    duration: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '06:00',
    notes: '',
    recurring: false,
    recurringDays: 3,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        scheduledDate: editData.scheduledDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        cropName: '',
        fieldName: '',
        method: 'drip',
        waterAmount: '',
        unit: 'liters',
        duration: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '06:00',
        notes: '',
        recurring: false,
        recurringDays: 3,
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cropName || !formData.waterAmount) {
      toast.error(t('fillRequiredFields') || 'Please fill required fields');
      return;
    }
    onAdd({ ...formData, id: editData?.id || Date.now() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FaWater className="text-blue-500" />
              {editData ? (t('editIrrigation') || 'Edit Irrigation') : (t('scheduleIrrigation') || 'Schedule Irrigation')}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <HiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('cropName') || 'Crop Name'} *
                </label>
                <input
                  type="text"
                  value={formData.cropName}
                  onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder={t('egWheatRice') || 'e.g., Wheat, Rice'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('fieldName') || 'Field Name'}
                </label>
                <input
                  type="text"
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder={t('egNorthField') || 'e.g., North Field'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('irrigationMethod') || 'Irrigation Method'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {irrigationMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, method: method.id })}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      formData.method === method.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{method.icon}</span>
                    <p className="text-xs mt-1">{t(method.nameKey) || method.nameKey}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('waterAmount') || 'Water Amount'} *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.waterAmount}
                    onChange={(e) => setFormData({ ...formData, waterAmount: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder={t('amount') || 'Amount'}
                    required
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="liters">L</option>
                    <option value="gallons">Gal</option>
                    <option value="cubic_meters">m³</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('duration') || 'Duration'} ({t('mins') || 'mins'})
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('date') || 'Date'} *
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('time') || 'Time'}
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.recurring}
                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-gray-300">
                {t('repeatEvery') || 'Repeat every'}
              </label>
              <input
                type="number"
                value={formData.recurringDays}
                onChange={(e) => setFormData({ ...formData, recurringDays: e.target.value })}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                min="1"
                disabled={!formData.recurring}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('days') || 'days'}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('notes') || 'Notes'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                rows="2"
                placeholder={t('additionalNotes') || 'Any additional notes...'}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editData ? (t('update') || 'Update') : (t('schedule') || 'Schedule')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// Add Fertilizer Modal
const AddFertilizerModal = ({ isOpen, onClose, onAdd, editData, t }) => {
  const [formData, setFormData] = useState({
    cropName: '',
    fieldName: '',
    fertilizerType: 'urea',
    customName: '',
    quantity: '',
    unit: 'kg',
    applicationMethod: 'broadcasting',
    scheduledDate: new Date().toISOString().split('T')[0],
    growthStage: 'vegetative',
    notes: '',
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        scheduledDate: editData.scheduledDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        cropName: '',
        fieldName: '',
        fertilizerType: 'urea',
        customName: '',
        quantity: '',
        unit: 'kg',
        applicationMethod: 'broadcasting',
        scheduledDate: new Date().toISOString().split('T')[0],
        growthStage: 'vegetative',
        notes: '',
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cropName || !formData.quantity) {
      toast.error(t('fillRequiredFields') || 'Please fill required fields');
      return;
    }
    onAdd({ ...formData, id: editData?.id || Date.now() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FaLeaf className="text-green-500" />
              {editData ? (t('editFertilizer') || 'Edit Fertilizer') : (t('addFertilizerApplication') || 'Add Fertilizer Application')}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <HiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('cropName') || 'Crop Name'} *
                </label>
                <input
                  type="text"
                  value={formData.cropName}
                  onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder={t('egWheatRice') || 'e.g., Wheat, Rice'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('fieldName') || 'Field Name'}
                </label>
                <input
                  type="text"
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder={t('egNorthField') || 'e.g., North Field'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('fertilizerType') || 'Fertilizer Type'}
              </label>
              <select
                value={formData.fertilizerType}
                onChange={(e) => setFormData({ ...formData, fertilizerType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {fertilizerTypes.map((fert) => (
                  <option key={fert.id} value={fert.id}>
                    {fert.name} ({fert.npk})
                  </option>
                ))}
                <option value="custom">{t('customOther') || 'Custom / Other'}</option>
              </select>
            </div>

            {formData.fertilizerType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('customFertilizerName') || 'Custom Fertilizer Name'}
                </label>
                <input
                  type="text"
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder={t('enterFertilizerName') || 'Enter fertilizer name'}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('quantity') || 'Quantity'} *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder={t('amount') || 'Amount'}
                    required
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="bags">{t('bags') || 'bags'}</option>
                    <option value="liters">L</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('applicationMethod') || 'Application Method'}
                </label>
                <select
                  value={formData.applicationMethod}
                  onChange={(e) => setFormData({ ...formData, applicationMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="broadcasting">{t('broadcasting') || 'Broadcasting'}</option>
                  <option value="side_dressing">{t('sideDressing') || 'Side Dressing'}</option>
                  <option value="foliar_spray">{t('foliarSpray') || 'Foliar Spray'}</option>
                  <option value="fertigation">{t('fertigation') || 'Fertigation'}</option>
                  <option value="basal">{t('basalApplication') || 'Basal Application'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('date') || 'Date'} *
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('growthStage') || 'Growth Stage'}
                </label>
                <select
                  value={formData.growthStage}
                  onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="pre_sowing">{t('preSowing') || 'Pre-Sowing'}</option>
                  <option value="seedling">{t('seedling') || 'Seedling'}</option>
                  <option value="vegetative">{t('vegetative') || 'Vegetative'}</option>
                  <option value="flowering">{t('flowering') || 'Flowering'}</option>
                  <option value="fruiting">{t('fruiting') || 'Fruiting'}</option>
                  <option value="maturity">{t('maturity') || 'Maturity'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('notes') || 'Notes'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                rows="2"
                placeholder={t('additionalNotes') || 'Any additional notes...'}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editData ? (t('update') || 'Update') : (t('add') || 'Add')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// Irrigation Card Component
const IrrigationCard = ({ item, onComplete, onEdit, onDelete, t }) => {
  const method = irrigationMethods.find(m => m.id === item.method) || irrigationMethods[0];
  const isCompleted = item.status === 'completed';
  const isPast = new Date(item.scheduledDate) < new Date() && !isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-l-4 ${
        isCompleted ? 'border-green-500 opacity-75' : isPast ? 'border-red-500' : 'border-blue-500'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{method.icon}</span>
            <h3 className="font-medium text-gray-900 dark:text-white">{item.cropName}</h3>
            {isCompleted && <HiCheck className="w-5 h-5 text-green-500" />}
            {isPast && <HiExclamation className="w-5 h-5 text-red-500" />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {item.fieldName || (t('mainField') || 'Main Field')} • {t(method.nameKey) || method.nameKey}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <FaTint className="w-3 h-3" />
              {item.waterAmount} {item.unit}
            </span>
            {item.duration && (
              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <HiClock className="w-3 h-3" />
                {item.duration} {t('mins') || 'mins'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {new Date(item.scheduledDate).toLocaleDateString()}
            </span>
            {item.scheduledTime && (
              <span className="text-xs text-gray-500">{item.scheduledTime}</span>
            )}
            {item.recurring && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {t('every') || 'Every'} {item.recurringDays} {t('days') || 'days'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {!isCompleted && (
            <button
              onClick={() => onComplete(item.id)}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
              title={t('markComplete') || 'Mark Complete'}
            >
              <HiCheck className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
            title={t('edit') || 'Edit'}
          >
            <HiPencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            title={t('delete') || 'Delete'}
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Fertilizer Card Component
const FertilizerCard = ({ item, onComplete, onEdit, onDelete, t }) => {
  const fertilizer = fertilizerTypes.find(f => f.id === item.fertilizerType);
  const isCompleted = item.status === 'completed';
  const isPast = new Date(item.scheduledDate) < new Date() && !isCompleted;

  const categoryColors = {
    nitrogen: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    phosphorus: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    potassium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    mixed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    organic: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-l-4 ${
        isCompleted ? 'border-green-500 opacity-75' : isPast ? 'border-red-500' : 'border-green-500'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FaLeaf className="w-4 h-4 text-green-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">{item.cropName}</h3>
            {isCompleted && <HiCheck className="w-5 h-5 text-green-500" />}
            {isPast && <HiExclamation className="w-5 h-5 text-red-500" />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {item.fieldName || (t('mainField') || 'Main Field')}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[fertilizer?.category] || categoryColors.mixed}`}>
              {fertilizer?.name || item.customName || 'Custom'}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item.quantity} {item.unit}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
              {t(item.applicationMethod) || item.applicationMethod?.replace('_', ' ')}
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
              {t(item.growthStage) || item.growthStage?.replace('_', ' ')}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {new Date(item.scheduledDate).toLocaleDateString()}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {!isCompleted && (
            <button
              onClick={() => onComplete(item.id)}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
              title={t('markComplete') || 'Mark Complete'}
            >
              <HiCheck className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
            title={t('edit') || 'Edit'}
          >
            <HiPencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            title={t('delete') || 'Delete'}
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Demo data for irrigation schedules
const demoIrrigationSchedules = [
  {
    id: 'demo1',
    cropName: 'Wheat',
    fieldName: 'North Field',
    method: 'drip',
    waterAmount: '500',
    unit: 'liters',
    duration: '45',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '06:00',
    notes: 'Morning irrigation before sunrise',
    recurring: true,
    recurringDays: 3,
    status: 'pending'
  },
  {
    id: 'demo2',
    cropName: 'Tomato',
    fieldName: 'Greenhouse A',
    method: 'sprinkler',
    waterAmount: '200',
    unit: 'liters',
    duration: '30',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduledTime: '07:00',
    notes: 'Check soil moisture before irrigation',
    recurring: false,
    recurringDays: 0,
    status: 'pending'
  },
  {
    id: 'demo3',
    cropName: 'Rice',
    fieldName: 'South Paddy',
    method: 'flood',
    waterAmount: '1000',
    unit: 'liters',
    duration: '60',
    scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    scheduledTime: '05:30',
    notes: 'Completed morning flooding',
    recurring: true,
    recurringDays: 2,
    status: 'completed',
    completedAt: new Date(Date.now() - 82800000).toISOString()
  }
];

// Demo data for fertilizer applications
const demoFertilizerApplications = [
  {
    id: 'fertdemo1',
    cropName: 'Wheat',
    fieldName: 'North Field',
    fertilizerType: 'urea',
    customName: '',
    quantity: '25',
    unit: 'kg',
    applicationMethod: 'broadcasting',
    scheduledDate: new Date().toISOString().split('T')[0],
    growthStage: 'vegetative',
    notes: 'First top dressing application',
    status: 'pending'
  },
  {
    id: 'fertdemo2',
    cropName: 'Tomato',
    fieldName: 'Greenhouse A',
    fertilizerType: 'npk',
    customName: '',
    quantity: '10',
    unit: 'kg',
    applicationMethod: 'fertigation',
    scheduledDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    growthStage: 'flowering',
    notes: 'NPK for flower development',
    status: 'pending'
  },
  {
    id: 'fertdemo3',
    cropName: 'Potato',
    fieldName: 'East Plot',
    fertilizerType: 'organic',
    customName: '',
    quantity: '50',
    unit: 'kg',
    applicationMethod: 'side_dressing',
    scheduledDate: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    growthStage: 'vegetative',
    notes: 'Organic manure applied',
    status: 'completed',
    completedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'fertdemo4',
    cropName: 'Rice',
    fieldName: 'South Paddy',
    fertilizerType: 'dap',
    customName: '',
    quantity: '30',
    unit: 'kg',
    applicationMethod: 'basal',
    scheduledDate: new Date(Date.now() - 604800000).toISOString().split('T')[0],
    growthStage: 'seedling',
    notes: 'Basal dose during transplanting',
    status: 'completed',
    completedAt: new Date(Date.now() - 518400000).toISOString()
  }
];

// Main Component
const IrrigationFertilizer = () => {
  const { t, language } = useLanguage();
  const { location, getLocation, loading: locationLoading, error: locationError } = useGeolocation({ autoFetch: true });
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('irrigation');
  const [showIrrigationModal, setShowIrrigationModal] = useState(false);
  const [showFertilizerModal, setShowFertilizerModal] = useState(false);
  const [editIrrigation, setEditIrrigation] = useState(null);
  const [editFertilizer, setEditFertilizer] = useState(null);
  const [filter, setFilter] = useState('all');

  // Load from localStorage with demo data fallback
  const [irrigationSchedules, setIrrigationSchedules] = useState(() => {
    const saved = localStorage.getItem('agribot_irrigation');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed : demoIrrigationSchedules;
    }
    return demoIrrigationSchedules;
  });

  const [fertilizerApplications, setFertilizerApplications] = useState(() => {
    const saved = localStorage.getItem('agribot_fertilizer');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed : demoFertilizerApplications;
    }
    return demoFertilizerApplications;
  });

  // Fetch weather data by coordinates
  const fetchWeather = async () => {
    if (!location) return;

    setWeatherLoading(true);
    try {
      const response = await weatherAPI.getCurrent(location.lat, location.lng);
      setWeather(response.data);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Fetch weather by city name
  const fetchWeatherByCity = async (city) => {
    setWeatherLoading(true);
    try {
      const response = await weatherAPI.getByCity(city);
      setWeather(response.data);
      toast.success(`Weather loaded for ${response.data.name || city}`);
    } catch (error) {
      console.error('Failed to fetch weather by city:', error);
      toast.error(error.response?.data?.message || 'City not found. Please try another city name.');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Fetch weather when location changes
  useEffect(() => {
    if (location) {
      fetchWeather();
    }
  }, [location]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('agribot_irrigation', JSON.stringify(irrigationSchedules));
  }, [irrigationSchedules]);

  useEffect(() => {
    localStorage.setItem('agribot_fertilizer', JSON.stringify(fertilizerApplications));
  }, [fertilizerApplications]);

  // Irrigation handlers
  const handleAddIrrigation = (data) => {
    if (editIrrigation) {
      setIrrigationSchedules(prev => prev.map(item => item.id === data.id ? data : item));
      toast.success(t('irrigationUpdated') || 'Irrigation schedule updated!');
    } else {
      setIrrigationSchedules(prev => [...prev, { ...data, status: 'pending' }]);
      toast.success(t('irrigationScheduled') || 'Irrigation scheduled!');
    }
    setShowIrrigationModal(false);
    setEditIrrigation(null);
  };

  const handleCompleteIrrigation = (id) => {
    setIrrigationSchedules(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'completed', completedAt: new Date().toISOString() } : item
    ));
    toast.success(t('irrigationCompleted') || 'Irrigation marked as complete!');
  };

  const handleDeleteIrrigation = (id) => {
    if (confirm(t('deleteIrrigationConfirm') || 'Delete this irrigation schedule?')) {
      setIrrigationSchedules(prev => prev.filter(item => item.id !== id));
      toast.success(t('irrigationDeleted') || 'Irrigation schedule deleted');
    }
  };

  // Fertilizer handlers
  const handleAddFertilizer = (data) => {
    if (editFertilizer) {
      setFertilizerApplications(prev => prev.map(item => item.id === data.id ? data : item));
      toast.success(t('fertilizerUpdated') || 'Fertilizer application updated!');
    } else {
      setFertilizerApplications(prev => [...prev, { ...data, status: 'pending' }]);
      toast.success(t('fertilizerAdded') || 'Fertilizer application added!');
    }
    setShowFertilizerModal(false);
    setEditFertilizer(null);
  };

  const handleCompleteFertilizer = (id) => {
    setFertilizerApplications(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'completed', completedAt: new Date().toISOString() } : item
    ));
    toast.success(t('fertilizerCompleted') || 'Fertilizer application marked as complete!');
  };

  const handleDeleteFertilizer = (id) => {
    if (confirm(t('deleteFertilizerConfirm') || 'Delete this fertilizer application?')) {
      setFertilizerApplications(prev => prev.filter(item => item.id !== id));
      toast.success(t('fertilizerDeleted') || 'Fertilizer application deleted');
    }
  };

  // Filter data
  const filterData = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'pending':
        return data.filter(item => item.status !== 'completed');
      case 'completed':
        return data.filter(item => item.status === 'completed');
      case 'today':
        return data.filter(item => {
          const itemDate = new Date(item.scheduledDate);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === today.getTime();
        });
      default:
        return data;
    }
  };

  // Stats
  const irrigationStats = {
    total: irrigationSchedules.length,
    pending: irrigationSchedules.filter(i => i.status !== 'completed').length,
    completed: irrigationSchedules.filter(i => i.status === 'completed').length,
    totalWater: irrigationSchedules.reduce((sum, i) => sum + (parseFloat(i.waterAmount) || 0), 0),
  };

  const fertilizerStats = {
    total: fertilizerApplications.length,
    pending: fertilizerApplications.filter(f => f.status !== 'completed').length,
    completed: fertilizerApplications.filter(f => f.status === 'completed').length,
    totalQuantity: fertilizerApplications.reduce((sum, f) => sum + (parseFloat(f.quantity) || 0), 0),
  };

  const filterLabels = {
    all: t('all') || 'All',
    pending: t('pending') || 'Pending',
    completed: t('completed') || 'Completed',
    today: t('today') || 'Today'
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center shadow-lg">
            <FaWater className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('irrigationFertilizer') || 'Irrigation & Fertilizer'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('irrigationFertilizerDesc') || 'Manage water and nutrient schedules for your crops'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('irrigation')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'irrigation'
              ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <FaWater className="w-4 h-4" />
          {t('irrigation') || 'Irrigation'}
        </button>
        <button
          onClick={() => setActiveTab('fertilizer')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'fertilizer'
              ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <FaLeaf className="w-4 h-4" />
          {t('fertilizer') || 'Fertilizer'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activeTab === 'irrigation' ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <HiCalendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{irrigationStats.total}</p>
                  <p className="text-sm text-gray-500">{t('totalSchedules') || 'Total Schedules'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <HiClock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{irrigationStats.pending}</p>
                  <p className="text-sm text-gray-500">{t('pending') || 'Pending'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <HiCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{irrigationStats.completed}</p>
                  <p className="text-sm text-gray-500">{t('completed') || 'Completed'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <FaTint className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{irrigationStats.totalWater.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{t('totalWater') || 'Total Water (L)'}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <HiCalendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{fertilizerStats.total}</p>
                  <p className="text-sm text-gray-500">{t('totalApplications') || 'Total Applications'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <HiClock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{fertilizerStats.pending}</p>
                  <p className="text-sm text-gray-500">{t('pending') || 'Pending'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <HiCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{fertilizerStats.completed}</p>
                  <p className="text-sm text-gray-500">{t('completed') || 'Completed'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <FaFlask className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{fertilizerStats.totalQuantity}</p>
                  <p className="text-sm text-gray-500">{t('totalUsed') || 'Total Used (kg)'}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Weather-based Tips */}
      <WeatherTipsPanel
        weather={weather}
        weatherLoading={weatherLoading}
        location={location}
        locationLoading={locationLoading}
        locationError={locationError}
        onRefresh={() => {
          if (!location) {
            getLocation();
          } else {
            fetchWeather();
          }
        }}
        onCitySearch={fetchWeatherByCity}
        activeTab={activeTab}
        t={t}
        language={language}
      />

      {/* Filter and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          {Object.entries(filterLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? activeTab === 'irrigation' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => activeTab === 'irrigation' ? setShowIrrigationModal(true) : setShowFertilizerModal(true)}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
            activeTab === 'irrigation' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <HiPlus className="w-5 h-5" />
          {activeTab === 'irrigation' ? (t('scheduleIrrigation') || 'Schedule Irrigation') : (t('addFertilizer') || 'Add Fertilizer')}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'irrigation' ? (
          filterData(irrigationSchedules).length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <FaWater className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('noIrrigationSchedules') || 'No irrigation schedules'}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('startByScheduling') || 'Start by scheduling your first irrigation'}
              </p>
              <button
                onClick={() => setShowIrrigationModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <HiPlus className="w-5 h-5" />
                {t('scheduleIrrigation') || 'Schedule Irrigation'}
              </button>
            </div>
          ) : (
            filterData(irrigationSchedules)
              .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
              .map(item => (
                <IrrigationCard
                  key={item.id}
                  item={item}
                  onComplete={handleCompleteIrrigation}
                  onEdit={(item) => { setEditIrrigation(item); setShowIrrigationModal(true); }}
                  onDelete={handleDeleteIrrigation}
                  t={t}
                />
              ))
          )
        ) : (
          filterData(fertilizerApplications).length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <FaLeaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('noFertilizerApplications') || 'No fertilizer applications'}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('startByAdding') || 'Start by adding your first fertilizer application'}
              </p>
              <button
                onClick={() => setShowFertilizerModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <HiPlus className="w-5 h-5" />
                {t('addFertilizer') || 'Add Fertilizer'}
              </button>
            </div>
          ) : (
            filterData(fertilizerApplications)
              .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
              .map(item => (
                <FertilizerCard
                  key={item.id}
                  item={item}
                  onComplete={handleCompleteFertilizer}
                  onEdit={(item) => { setEditFertilizer(item); setShowFertilizerModal(true); }}
                  onDelete={handleDeleteFertilizer}
                  t={t}
                />
              ))
          )
        )}
      </div>

      {/* Modals */}
      <AddIrrigationModal
        isOpen={showIrrigationModal}
        onClose={() => { setShowIrrigationModal(false); setEditIrrigation(null); }}
        onAdd={handleAddIrrigation}
        editData={editIrrigation}
        t={t}
      />
      <AddFertilizerModal
        isOpen={showFertilizerModal}
        onClose={() => { setShowFertilizerModal(false); setEditFertilizer(null); }}
        onAdd={handleAddFertilizer}
        editData={editFertilizer}
        t={t}
      />
    </div>
  );
};

export default IrrigationFertilizer;
