import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome,
  HiChat,
  HiCamera,
  HiUsers,
  HiUser,
  HiChip,
  HiPlay,
  HiMenu,
  HiX,
  HiShoppingCart,
  HiCalendar,
  HiDocumentText,
  HiCurrencyRupee,
  HiSparkles,
  HiBeaker
} from 'react-icons/hi';
import { useLanguage } from '../../context/LanguageContext';
import Header from './Header';
import WeatherWidget from './WeatherWidget';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();

  // Show weather widget only on home page
  const isHomePage = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  // All navigation items
  const navItems = [
    { path: '/dashboard', icon: HiHome, label: t('home'), end: true },
    { path: '/dashboard/chat', icon: HiChat, label: t('chat') },
    { path: '/dashboard/disease', icon: HiCamera, label: t('disease') },
    { path: '/dashboard/shorts', icon: HiPlay, label: t('shorts') },
    { path: '/dashboard/mandi-prices', icon: HiCurrencyRupee, label: t('mandi') },
    { path: '/dashboard/schemes', icon: HiDocumentText, label: t('schemes') },
    { path: '/dashboard/crop-recommendation', icon: HiSparkles, label: t('cropRecommendation') || 'Crop Guide' },
    { path: '/dashboard/marketplace', icon: HiShoppingCart, label: t('marketplace') },
    { path: '/dashboard/crop-calendar', icon: HiCalendar, label: t('cropCalendar') },
    { path: '/dashboard/irrigation-fertilizer', icon: HiBeaker, label: t('irrigationFertilizer') || 'Irrigation' },
    { path: '/dashboard/blog', icon: HiUsers, label: t('blog') },
    { path: '/dashboard/iot', icon: HiChip, label: t('iot') },
    { path: '/dashboard/profile', icon: HiUser, label: t('profile') },
  ];

  // Mobile bottom nav items (first 5: Home, Chat, Disease, Shorts, Mandi + menu)
  const mobileNavItems = navItems.slice(0, 5);

  // Items for the "More" menu (remaining items)
  const moreMenuItems = navItems.slice(5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Weather Widget - Only on Home page */}
      {isHomePage && (
        <div className="fixed top-16 left-0 lg:left-64 right-0 z-30">
          <WeatherWidget />
        </div>
      )}

      <div className={`flex ${isHomePage ? 'pt-[108px]' : 'pt-16'}`}>
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 ${isHomePage ? 'lg:pt-[108px]' : 'lg:pt-16'} lg:pb-4 lg:bg-white lg:dark:bg-gray-800 lg:border-r lg:border-gray-200 lg:dark:border-gray-700`}>
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl lg:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-primary-600">AgriBot</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>
                <nav className="p-4 space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? 'nav-link-active' : ''}`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
          <div className="p-3 sm:p-4 lg:p-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden safe-bottom">
          <div className="flex items-center justify-around py-1.5">
            {mobileNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-14 lg:hidden" />
    </div>
  );
};

export default Layout;
