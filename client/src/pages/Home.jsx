import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiChat,
  HiCamera,
  HiUsers,
  HiChip,
  HiLightBulb,
  HiTrendingUp
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { mandiAPI } from '../services/api';
import DashboardWeatherWidget from '../components/common/DashboardWeatherWidget';

const Home = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [trendingData, setTrendingData] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Fetch trending mandi data
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await mandiAPI.getTrending();
        if (response.data?.success && response.data?.trending) {
          // Get top 2 trending commodities
          setTrendingData(response.data.trending.slice(0, 2));
        }
      } catch (error) {
        console.error('Failed to fetch trending data:', error);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const features = [
    {
      icon: HiChat,
      title: t('aiChatbot'),
      description: t('aiChatbotDesc'),
      path: '/dashboard/chat',
      color: 'bg-primary-500'
    },
    {
      icon: HiCamera,
      title: t('diseaseDetection'),
      description: t('diseaseDetectionDesc'),
      path: '/dashboard/disease',
      color: 'bg-red-500'
    },
    {
      icon: HiUsers,
      title: t('community'),
      description: t('communityDesc'),
      path: '/dashboard/blog',
      color: 'bg-blue-500'
    },
    {
      icon: HiChip,
      title: t('iotSensors'),
      description: t('iotDesc'),
      path: '/dashboard/iot',
      color: 'bg-purple-500'
    }
  ];


  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden ring-2 ring-primary-200 dark:ring-primary-800">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-primary-600">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {t('welcomeUser').replace('{name}', user?.name?.split(' ')[0] || t('farmer'))}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('howCanWeHelp')}
              </p>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/dashboard/chat"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-600/25 transition-all duration-200"
            >
              <HiChat className="w-3.5 h-3.5" />
              {t('askAI') || 'Ask AI'}
            </Link>
            <Link
              to="/dashboard/disease"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <HiCamera className="w-3.5 h-3.5" />
              {t('scanCrop') || 'Scan Crop'}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Weather Widget */}
      <DashboardWeatherWidget />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={feature.path}
              className="card card-hover p-4 flex flex-col items-start gap-3"
            >
              <div className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center shadow-sm`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  {feature.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Tips & Updates */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">{t('todaysInsights')}</h2>

        {/* Tip of the Day */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-4"
        >
          <div className="flex items-start gap-3">
            <HiLightBulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-gray-900 dark:text-white">{t('tipOfDay')}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                {t('tipContent')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Market Update - Live Mandi Data */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-4"
        >
          <div className="flex items-start gap-3">
            <HiTrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">{t('marketUpdate')}</h4>
                <Link to="/dashboard/mandi-prices" className="text-[10px] text-primary-600 hover:underline">
                  {t('viewAll') || 'View All'}
                </Link>
              </div>

              {trendingLoading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                </div>
              ) : trendingData.length > 0 ? (
                <div className="mt-2 space-y-2.5">
                  {trendingData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2.5 py-2">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {item.commodity}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          ₹{item.avgPrice?.toLocaleString()}/qt
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                          {item.marketCount} {t('markets')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t('marketContent')}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Crops Summary */}
      {user?.cropsGrown?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-4"
        >
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">{t('yourCrops')}</h3>
          <div className="flex flex-wrap gap-2">
            {user.cropsGrown.map((crop) => (
              <span key={crop} className="badge badge-primary text-xs">
                {crop}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Chat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Link
          to="/dashboard/chat"
          className="block card p-5 text-white hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #2d5a3d 0%, #1e4d2b 50%, #2d5a3d 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">{t('askAgriBot')}</h3>
              <p className="text-white/80 text-xs mt-1">
                {t('askAnything')}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <HiChat className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
};

export default Home;
