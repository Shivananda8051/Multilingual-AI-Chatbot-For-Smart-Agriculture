import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiLocationMarker, HiRefresh } from 'react-icons/hi';
import { WiDaySunny, WiCloudy, WiRain, WiThunderstorm, WiSnow, WiFog, WiHumidity, WiStrongWind } from 'react-icons/wi';
import { weatherAPI } from '../../services/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

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

// Muted, professional gradients - no competing colors
const weatherGradients = {
  Clear: 'from-slate-700 via-slate-600 to-slate-700',
  Clouds: 'from-slate-700 via-slate-600 to-slate-700',
  Rain: 'from-slate-800 via-slate-700 to-slate-800',
  Drizzle: 'from-slate-700 via-slate-600 to-slate-700',
  Thunderstorm: 'from-slate-900 via-slate-800 to-slate-900',
  Snow: 'from-slate-600 via-slate-500 to-slate-600',
  Mist: 'from-slate-700 via-slate-600 to-slate-700',
  Fog: 'from-slate-700 via-slate-600 to-slate-700',
  Haze: 'from-slate-700 via-slate-600 to-slate-700'
};

const DEFAULT_LOCATION = { lat: 12.9716, lng: 77.5946 };

// ============== WEATHER ANIMATIONS ==============

const RainAnimation = () => {
  const drops = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 0.4 + Math.random() * 0.3,
    size: 1 + Math.random() * 1.5
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {drops.map((drop) => (
        <motion.div
          key={drop.id}
          className="absolute bg-gradient-to-b from-blue-200/80 to-blue-400/80 rounded-full"
          style={{
            left: `${drop.left}%`,
            width: `${drop.size}px`,
            height: `${drop.size * 12}px`,
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: '100vh', opacity: [0, 0.8, 0.8, 0] }}
          transition={{
            duration: drop.duration,
            delay: drop.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-400/30 to-transparent" />
    </div>
  );
};

const ThunderstormAnimation = () => {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const flashInterval = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 100);
      setTimeout(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), 80);
      }, 150);
    }, 2000);
    return () => clearInterval(flashInterval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.03 }}
            className="absolute inset-0 bg-white/80 z-50"
          />
        )}
      </AnimatePresence>
      <svg className="absolute top-0 left-1/4 w-24 h-48 z-40" viewBox="0 0 100 200">
        <motion.path
          d="M50 0 L35 70 L55 70 L25 200 L45 90 L25 90 L50 0"
          fill="none"
          stroke="#FBBF24"
          strokeWidth="4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: flash ? 1 : 0, opacity: flash ? 1 : 0 }}
          transition={{ duration: 0.08 }}
          style={{ filter: 'drop-shadow(0 0 8px #FBBF24)' }}
        />
      </svg>
      <RainAnimation />
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 via-indigo-900/30 to-slate-900/50" />
    </div>
  );
};

const SunnyAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute -top-10 left-1/2 -translate-x-1/2"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-32 bg-gradient-to-b from-yellow-300/60 to-transparent origin-bottom"
          style={{ left: '50%', bottom: '50%', transform: `translateX(-50%) rotate(${i * 45}deg)` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </motion.div>
    <motion.div
      className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(253,224,71,0.8) 0%, rgba(251,191,36,0.4) 50%, transparent 70%)' }}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-orange-300/20 via-yellow-200/10 to-transparent" />
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-yellow-200/60 rounded-full"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2 + Math.random() * 2, delay: Math.random(), repeat: Infinity }}
      />
    ))}
  </div>
);

const CloudyAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[{ top: '5%', dur: 20, size: 'w-32 h-16' }, { top: '25%', dur: 25, size: 'w-40 h-20' }, { top: '15%', dur: 18, size: 'w-28 h-14' }].map((c, i) => (
      <motion.div
        key={i}
        className={`absolute ${c.size} opacity-70`}
        style={{ top: c.top }}
        initial={{ x: '-30%' }}
        animate={{ x: '110vw' }}
        transition={{ duration: c.dur, delay: i * 4, repeat: Infinity, ease: 'linear' }}
      >
        <div className="relative w-full h-full">
          <div className="absolute bottom-0 left-1/4 w-1/2 h-3/4 bg-white/90 rounded-full" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-white/80 rounded-full" />
          <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-white/80 rounded-full" />
        </div>
      </motion.div>
    ))}
    <div className="absolute inset-0 bg-gradient-to-b from-gray-300/20 to-transparent" />
  </div>
);

const SnowAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 40 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 2, duration: 2 + Math.random() * 3, size: 2 + Math.random() * 4
    })).map((f) => (
      <motion.div
        key={f.id}
        className="absolute bg-white rounded-full"
        style={{ left: `${f.left}%`, width: `${f.size}px`, height: `${f.size}px`, boxShadow: '0 0 6px rgba(255,255,255,0.8)' }}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: '100vh', x: [0, 10, -10, 0], opacity: [0, 1, 1, 0], rotate: 360 }}
        transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'linear' }}
      />
    ))}
    <div className="absolute inset-0 bg-gradient-to-b from-blue-100/30 to-cyan-100/20" />
  </div>
);

const FogAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 6 + i * 2, delay: i * 1.5, repeat: Infinity, ease: 'linear' }}
      />
    ))}
    <div className="absolute inset-0 bg-gray-300/20 backdrop-blur-[1px]" />
  </div>
);

const HazeAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute inset-0"
      style={{ background: 'radial-gradient(ellipse at top, rgba(251,191,36,0.3) 0%, transparent 60%)' }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-amber-300/50 rounded-full"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3 + Math.random() * 2, delay: Math.random() * 2, repeat: Infinity }}
      />
    ))}
  </div>
);

const WeatherAnimationOverlay = ({ condition, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const animations = {
    Clear: SunnyAnimation, Clouds: CloudyAnimation, Rain: RainAnimation, Drizzle: RainAnimation,
    Thunderstorm: ThunderstormAnimation, Snow: SnowAnimation, Mist: FogAnimation, Fog: FogAnimation, Haze: HazeAnimation
  };
  const AnimationComponent = animations[condition] || SunnyAnimation;
  const gradient = weatherGradients[condition] || weatherGradients.Clear;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100]"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <AnimationComponent />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            {condition === 'Clear' && <WiDaySunny className="w-28 h-28 mx-auto text-yellow-200 drop-shadow-2xl" />}
            {condition === 'Clouds' && <WiCloudy className="w-28 h-28 mx-auto text-white drop-shadow-2xl" />}
            {(condition === 'Rain' || condition === 'Drizzle') && <WiRain className="w-28 h-28 mx-auto text-blue-200 drop-shadow-2xl" />}
            {condition === 'Thunderstorm' && <WiThunderstorm className="w-28 h-28 mx-auto text-yellow-300 drop-shadow-2xl" />}
            {condition === 'Snow' && <WiSnow className="w-28 h-28 mx-auto text-white drop-shadow-2xl" />}
            {(condition === 'Mist' || condition === 'Fog') && <WiFog className="w-28 h-28 mx-auto text-gray-200 drop-shadow-2xl" />}
            {condition === 'Haze' && <WiFog className="w-28 h-28 mx-auto text-amber-200 drop-shadow-2xl" />}
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-white/80 text-lg font-medium capitalize"
          >
            {condition}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============== MAIN WIDGET ==============

const CACHE_KEY = 'agribot_weather_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const WeatherWidget = () => {
  const [weather, setWeather] = useState(() => {
    // Try to load from cache on initial render
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (e) {}
    return null;
  });
  const [loading, setLoading] = useState(!weather);
  const [error, setError] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetchedRef = useRef(false);
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { location, error: locationError, getLocation, loading: locationLoading } = useGeolocation({ autoFetch: true });

  const getEffectiveLocation = useCallback(() => {
    if (location) return location;
    if (user?.location?.coordinates) {
      return { lat: user.location.coordinates[1], lng: user.location.coordinates[0] };
    }
    return DEFAULT_LOCATION;
  }, [location, user]);

  useEffect(() => {
    // Skip if already fetched in this session or if we have valid cache
    if (hasFetchedRef.current || weather) {
      setLoading(false);
      return;
    }

    if (!locationLoading) {
      hasFetchedRef.current = true;
      fetchWeather(getEffectiveLocation(), true);
    }
  }, [locationLoading]);

  const fetchWeather = async (loc, showAnim = false) => {
    if (!loc || loc.lat === undefined) loc = DEFAULT_LOCATION;
    try {
      setLoading(true);
      const response = await weatherAPI.getCurrent(loc.lat, loc.lng);
      const weatherData = response.data.weather;
      setWeather(weatherData);
      setError(null);

      // Cache the weather data
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: weatherData,
          timestamp: Date.now()
        }));
      } catch (e) {}

      if (showAnim && weatherData) setShowAnimation(true);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Clear cache to force fresh fetch
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {}
    getLocation();
    await fetchWeather(getEffectiveLocation(), false);
    setRefreshing(false);
  };

  const WeatherIcon = weather ? weatherIcons[weather.condition] || WiDaySunny : WiDaySunny;
  const gradient = weather ? weatherGradients[weather.condition] || weatherGradients.Clear : 'from-emerald-500 to-teal-500';

  if (locationLoading || loading) {
    return (
      <div className={`shadow-sm border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#F4F7F5] border-gray-200'}`}>
        <div className="flex items-center justify-center gap-2 py-2 px-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className={`w-4 h-4 border-2 rounded-full ${isDark ? 'border-slate-600 border-t-primary-400' : 'border-gray-300 border-t-primary-600'}`} />
          <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Fetching weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`shadow-sm border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#F4F7F5] border-gray-200'}`}>
        <div className="flex items-center justify-between py-2 px-3">
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{error || 'Weather unavailable'}</span>
          <button onClick={handleRefresh} className={`p-1 rounded-full transition-all ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}>
            <HiRefresh className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showAnimation && (
          <WeatherAnimationOverlay condition={weather.condition} onComplete={() => setShowAnimation(false)} />
        )}
      </AnimatePresence>

      {/* Minimal Weather Bar - Theme Aware */}
      <div className={`relative shadow-sm overflow-hidden border-b ${
        isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-[#F4F7F5] border-gray-200'
      }`}>
        {/* Content */}
        <div className="relative flex items-center justify-between py-2 px-3 sm:px-4">
          {/* Left Section - Location & Quick Temp */}
          <div className="flex items-center gap-2">
            <HiLocationMarker className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
            <span className={`text-xs font-medium max-w-[120px] truncate ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {weather.city}
            </span>
            <div className={`w-px h-4 mx-1 ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`} />
            <WeatherIcon className={`w-5 h-5 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {weather.temp}°C
            </span>
          </div>

          {/* Right Section - Minimal */}
          <div className="flex items-center gap-2">
            <span className={`text-xs capitalize hidden xs:inline ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {weather.description}
            </span>
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-1.5 rounded-full transition-all ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
            >
              <motion.div
                animate={{ rotate: refreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: 'linear' }}
              >
                <HiRefresh className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WeatherWidget;
