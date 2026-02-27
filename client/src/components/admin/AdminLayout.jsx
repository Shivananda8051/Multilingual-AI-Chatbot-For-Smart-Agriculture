import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiChartBar,
  HiUsers,
  HiPlay,
  HiCog,
  HiLogout,
  HiQuestionMarkCircle,
  HiSupport,
  HiSearch,
  HiBell,
  HiChat,
  HiDocumentText,
  HiHome,
  HiMenu,
  HiX,
  HiShoppingCart,
  HiClipboardList,
  HiPhotograph
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { icon: HiChartBar, label: 'Overview', path: '/admin' },
    { icon: HiUsers, label: 'Users', path: '/admin/users' },
    { icon: HiCog, label: 'Settings', path: '/admin/settings' },
  ];

  const bottomItems = [
    { icon: HiQuestionMarkCircle, label: 'Help Centre', path: '#' },
    { icon: HiSupport, label: 'Contact us', path: '#' },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="font-bold text-xl">AgriBot</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6">
        <ul className="space-y-1 lg:space-y-2">
          {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={idx}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Links */}
      <div className="px-3 lg:px-4 py-4 lg:py-6 border-t border-white/10">
        <ul className="space-y-1 lg:space-y-2">
          {bottomItems.map((item, idx) => (
            <li key={idx}>
              <Link
                to={item.path}
                className="flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full"
            >
              <HiLogout className="w-5 h-5" />
              <span className="font-medium">Log out</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Back to App */}
      <div className="px-3 lg:px-4 pb-4 lg:pb-6">
        <Link
          to="/dashboard"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-all"
        >
          <HiHome className="w-5 h-5" />
          <span className="font-medium">Back to App</span>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f0f5f9] flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#1e2a4a] to-[#152238] text-white flex flex-col z-50 lg:hidden"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-[#1e2a4a] to-[#152238] text-white flex-col fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="bg-transparent px-4 lg:px-8 py-4 lg:py-6 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white shadow-sm"
            >
              <HiMenu className="w-6 h-6 text-gray-600" />
            </button>

            <div className="hidden lg:block">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
                Welcome Back, {user?.name?.split(' ')[0] || 'Admin'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Here's what's happening with your platform</p>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {/* Search - Hidden on mobile */}
              <div className="hidden md:block relative">
                <HiSearch className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2.5 bg-white rounded-xl border-0 shadow-sm focus:ring-2 focus:ring-amber-500 w-48 lg:w-64"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 lg:p-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <HiBell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User */}
              <div className="flex items-center gap-2 lg:gap-3 bg-white rounded-xl px-2 lg:px-4 py-2 shadow-sm">
                <div className="w-8 lg:w-9 h-8 lg:h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm lg:text-base">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-gray-800 text-sm">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Title */}
          <div className="lg:hidden mt-4">
            <h1 className="text-xl font-bold text-gray-800">
              Welcome, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <p className="text-gray-500 text-sm">Platform overview</p>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 lg:px-8 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
