import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiLocationMarker, HiRefresh, HiChevronDown, HiLightBulb } from 'react-icons/hi';
import { WiDaySunny, WiCloudy, WiRain, WiThunderstorm, WiSnow, WiFog, WiHumidity, WiStrongWind } from 'react-icons/wi';
import { weatherAPI } from '../../services/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

// Cache settings
const CACHE_KEY_PREFIX = 'agribot_dashboard_weather_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached data for specific language
const getCachedData = (lang) => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY_PREFIX + lang);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {}
  return null;
};

// Save to cache with language
const setCachedData = (data, lang) => {
  try {
    sessionStorage.setItem(CACHE_KEY_PREFIX + lang, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {}
};

// Parse markdown-style tips into structured format
const parseFarmingTips = (text) => {
  if (!text) return [];

  // Split by lines starting with - or •
  const lines = text.split(/\n/).filter(line => line.trim());
  const tips = [];

  lines.forEach(line => {
    // Remove leading - or • and trim
    let cleanLine = line.replace(/^[-•]\s*/, '').trim();
    if (!cleanLine) return;

    // Extract bold title if present (text between ** **)
    const boldMatch = cleanLine.match(/\*\*([^*]+)\*\*/);
    let title = '';
    let description = cleanLine;

    if (boldMatch) {
      title = boldMatch[1].replace(/:$/, ''); // Remove trailing colon
      description = cleanLine.replace(/\*\*[^*]+\*\*\s*[-:]?\s*/, '').trim();
    }

    if (title || description) {
      tips.push({ title, description });
    }
  });

  return tips;
};

const weatherIcons = {
  Clear: WiDaySunny,
  Clouds: WiCloudy,
  Rain: WiRain,
  Drizzle: WiRain,
  Thunderstorm: WiThunderstorm,
  Snow: WiSnow,
  Mist: WiFog,
  Fog: WiFog,
  Haze: WiFog
};

const DEFAULT_LOCATION = { lat: 12.9716, lng: 77.5946 };

const DashboardWeatherWidget = () => {
  const { language, t } = useLanguage();

  // Initialize from cache (language-specific)
  const cachedData = getCachedData(language);
  const [weather, setWeather] = useState(cachedData?.weather || null);
  const [forecast, setForecast] = useState(cachedData?.forecast || []);
  const [advice, setAdvice] = useState(cachedData?.advice || null);
  const [loading, setLoading] = useState(!cachedData);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);
  const lastLanguageRef = useRef(language);
  const hasFetchedRef = useRef(false);
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { location, loading: locationLoading } = useGeolocation({ autoFetch: true });

  const getEffectiveLocation = () => {
    if (location) return location;
    if (user?.location?.coordinates) {
      return { lat: user.location.coordinates[1], lng: user.location.coordinates[0] };
    }
    return DEFAULT_LOCATION;
  };

  useEffect(() => {
    // Check if language changed - if so, refetch
    if (lastLanguageRef.current !== language) {
      lastLanguageRef.current = language;
      // Check for language-specific cache
      const langCache = getCachedData(language);
      if (langCache) {
        setWeather(langCache.weather);
        setForecast(langCache.forecast || []);
        setAdvice(langCache.advice);
        return;
      }
      // No cache for this language, fetch new data
      fetchAllWeatherData(getEffectiveLocation());
      return;
    }

    // Initial fetch
    if (hasFetchedRef.current) return;
    if (getCachedData(language)) {
      hasFetchedRef.current = true;
      return;
    }

    if (!locationLoading) {
      hasFetchedRef.current = true;
      fetchAllWeatherData(getEffectiveLocation());
    }
  }, [location, locationLoading, user, language]);

  const fetchAllWeatherData = async (loc, forceRefresh = false) => {
    if (!loc || loc.lat === undefined) {
      loc = DEFAULT_LOCATION;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all weather data in parallel
      const [currentRes, forecastRes, adviceRes] = await Promise.allSettled([
        weatherAPI.getCurrent(loc.lat, loc.lng),
        weatherAPI.getForecast(loc.lat, loc.lng),
        weatherAPI.getAdvice(loc.lat, loc.lng, language)
      ]);

      let newWeather = null;
      let newForecast = [];
      let newAdvice = null;

      if (currentRes.status === 'fulfilled') {
        newWeather = currentRes.value.data.weather;
        setWeather(newWeather);
      }

      if (forecastRes.status === 'fulfilled' && forecastRes.value.data.forecast) {
        // Backend already returns processed daily forecast with tempMax, tempMin, condition
        newForecast = forecastRes.value.data.forecast.map(day => ({
          ...day,
          date: new Date(day.date) // Convert date string to Date object
        })).slice(0, 3);
        setForecast(newForecast);
      }

      if (adviceRes.status === 'fulfilled') {
        newAdvice = adviceRes.value.data.advice;
        setAdvice(newAdvice);
      }

      // Save to cache (with language)
      if (newWeather) {
        setCachedData({
          weather: newWeather,
          forecast: newForecast,
          advice: newAdvice
        }, language);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // Clear cache and fetch fresh data
    sessionStorage.removeItem(CACHE_KEY_PREFIX + language);
    hasFetchedRef.current = false;
    fetchAllWeatherData(getEffectiveLocation(), true);
  };

  const WeatherIcon = weather ? weatherIcons[weather.condition] || WiDaySunny : WiDaySunny;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
        </div>
      </motion.div>
    );
  }

  if (error || !weather) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400 mb-3">{error || t('weatherUnavailable')}</p>
          <button onClick={handleRefresh} className="btn btn-primary btn-sm">
            <HiRefresh className="w-4 h-4 mr-1" />
            {t('retry')}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Current Weather Header - Compact & Professional */}
      <div className="text-white px-4 py-3" style={{ background: 'linear-gradient(135deg, #2d5a3d 0%, #1e4d2b 50%, #2d5a3d 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <WeatherIcon className="w-9 h-9 opacity-90" />
            <div>
              <div className="text-xl font-bold tracking-tight">{weather.temp}°C</div>
              <div className="text-[11px] text-white/70 capitalize">{weather.description}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Grouped Stats Container - Polished */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="flex items-center gap-1 text-white/85" title={`${t('humidity') || 'Humidity'}: ${weather.humidity}%`}>
                <WiHumidity className="w-5 h-5" aria-label="Humidity" />
                <span className="text-xs font-medium">{weather.humidity}%</span>
              </div>
              <div className="w-px h-4 bg-white/20" aria-hidden="true" />
              <div className="flex items-center gap-1 text-white/85" title={`${t('windSpeed') || 'Wind Speed'}: ${weather.windSpeed} m/s`}>
                <WiStrongWind className="w-5 h-5" aria-label="Wind Speed" />
                <span className="text-xs font-medium">{weather.windSpeed} m/s</span>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200"
              title={t('refreshWeather') || 'Refresh weather data'}
              aria-label="Refresh weather"
            >
              <HiRefresh className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </div>

      {/* 3-Day Forecast - Consistent Card Design */}
      {forecast.length > 0 && (
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
            {t('threeDayForecast')}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {forecast.map((day, index) => {
              const DayIcon = weatherIcons[day.condition] || WiDaySunny;
              const isToday = index === 0;
              let dayName = t('day') + ' ' + (index + 1);
              if (isToday) {
                dayName = t('today');
              } else if (day.date instanceof Date && !isNaN(day.date)) {
                dayName = day.date.toLocaleDateString(language, { weekday: 'short' });
              }
              return (
                <div
                  key={index}
                  className={`relative text-center p-2.5 rounded-xl transition-all duration-200 border cursor-pointer hover:-translate-y-0.5 ${
                    isToday
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 shadow-md hover:shadow-lg'
                      : 'bg-white dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md'
                  }`}
                  style={{ boxShadow: isToday ? '0 4px 12px rgba(76, 175, 80, 0.15)' : '0 4px 12px rgba(0,0,0,0.06)' }}
                >
                  {isToday && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                      {dayName}
                    </div>
                  )}
                  <div className={`text-[10px] font-semibold uppercase tracking-wide ${
                    isToday ? 'text-primary-700 dark:text-primary-300 mt-1' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {!isToday && dayName}
                  </div>
                  <DayIcon className={`w-8 h-8 mx-auto my-0.5 ${
                    isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <div className={`text-sm font-bold ${
                    isToday ? 'text-primary-800 dark:text-primary-200' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {day.tempMax}°
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">
                    {day.tempMin}°
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Farming Tips - Enhanced Prominence */}
      {advice && (advice.basic?.length > 0 || advice.detailed) && (
        <div
          className="px-4 py-3"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(180, 83, 9, 0.1) 0%, rgba(161, 98, 7, 0.1) 100%)'
              : 'linear-gradient(135deg, #FFF8E1 0%, #F9FAF7 100%)'
          }}
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-left p-2 -m-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <HiLightBulb className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {t('farmingTipsToday')}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {expanded ? 'Tap to collapse' : 'Tap to view recommendations'}
                </p>
              </div>
            </div>
            <div className={`w-7 h-7 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center transition-all duration-200 group-hover:shadow-md ${expanded ? 'rotate-180' : ''}`}>
              <HiChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
          </button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-3"
            >
              {/* Basic tips */}
              {advice.basic?.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                </div>
              ))}

              {/* AI-generated detailed tips - parsed and styled */}
              {advice.detailed && (
                <div className="space-y-2 mt-2">
                  {parseFarmingTips(advice.detailed).map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-primary-500"
                    >
                      {tip.title && (
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">
                          {tip.title}
                        </p>
                      )}
                      {tip.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {tip.description}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default DashboardWeatherWidget;
