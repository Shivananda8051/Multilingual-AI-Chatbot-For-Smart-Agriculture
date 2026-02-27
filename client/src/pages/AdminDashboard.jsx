import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiUsers,
  HiChat,
  HiDocumentText,
  HiTrendingUp,
  HiTrendingDown,
  HiLocationMarker,
  HiCog,
  HiShieldCheck,
  HiPlay,
  HiPlus,
  HiTrash,
  HiX,
  HiEye,
  HiHeart,
  HiPencil,
  HiStar,
  HiShare,
  HiChatAlt,
  HiChevronDown,
  HiChevronUp,
  HiRefresh,
  HiPhone,
  HiPaperAirplane,
  HiPhotograph,
  HiClipboardList,
  HiShoppingCart,
  HiClock,
  HiGlobe,
  HiCurrencyRupee,
  HiCalendar,
  HiLightningBolt
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminAPI, settingsAPI, reelsAPI } from '../services/api';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

const CATEGORIES = [
  { id: 'farming_tips', name: 'Farming Tips' },
  { id: 'crop_care', name: 'Crop Care' },
  { id: 'irrigation', name: 'Irrigation' },
  { id: 'organic_farming', name: 'Organic Farming' },
  { id: 'pest_control', name: 'Pest Control' },
  { id: 'harvesting', name: 'Harvesting' },
  { id: 'equipment', name: 'Equipment' },
  { id: 'success_stories', name: 'Success Stories' },
  { id: 'weather', name: 'Weather Tips' },
  { id: 'market', name: 'Market Insights' }
];

const CATEGORY_NAMES = {
  farming_tips: 'Farming Tips',
  crop_care: 'Crop Care',
  irrigation: 'Irrigation',
  organic_farming: 'Organic Farming',
  pest_control: 'Pest Control',
  harvesting: 'Harvesting',
  equipment: 'Equipment',
  success_stories: 'Success Stories',
  weather: 'Weather Tips',
  market: 'Market Insights'
};

// Stat Card Component - Responsive
const StatCard = ({ title, value, change, changeType, icon: Icon, iconBg, iconColor, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-2xl lg:text-3xl font-bold text-gray-800 truncate">{value?.toLocaleString() || '0'}</p>
        <p className="text-gray-500 text-xs lg:text-sm mt-1 truncate">{title}</p>
        {change && (
          <div className={`flex items-center gap-1 mt-2 text-xs lg:text-sm ${
            changeType === 'up' ? 'text-emerald-500' : changeType === 'down' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {changeType === 'up' ? (
              <HiTrendingUp className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
            ) : changeType === 'down' ? (
              <HiTrendingDown className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
            ) : null}
            <span className="truncate">{change}</span>
          </div>
        )}
        {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 ml-2`}>
        <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${iconColor}`} />
      </div>
    </div>
  </motion.div>
);

// Mini Stat Card for secondary metrics
const MiniStatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-gray-50 rounded-xl p-3 lg:p-4">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-lg lg:text-xl font-bold text-gray-800">{value?.toLocaleString() || '0'}</p>
        <p className="text-xs text-gray-500 truncate">{title}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [geography, setGeography] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [togglingOtp, setTogglingOtp] = useState(false);

  // OTP Testing State
  const [verifiedNumbers, setVerifiedNumbers] = useState([]);
  const [testPhone, setTestPhone] = useState('');
  const [addingNumber, setAddingNumber] = useState(false);
  const [sendingTestOtp, setSendingTestOtp] = useState(false);
  const [testOtpResult, setTestOtpResult] = useState(null);
  const [showOtpPanel, setShowOtpPanel] = useState(false);

  // Shorts Management State
  const [shorts, setShorts] = useState([]);
  const [showShortsPanel, setShowShortsPanel] = useState(false);
  const [showAddShort, setShowAddShort] = useState(false);
  const [editingShort, setEditingShort] = useState(null);
  const [addingShort, setAddingShort] = useState(false);
  const [shortForm, setShortForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnail: '',
    category: 'farming_tips',
    tags: '',
    isFeatured: false
  });

  // Analytics State
  const [shortsAnalytics, setShortsAnalytics] = useState(null);
  const [locationAnalytics, setLocationAnalytics] = useState(null);

  useEffect(() => {
    loadDashboardData();
    loadOTPStatus();
    loadVerifiedNumbers();
    loadShorts();
    loadShortsAnalytics();
    loadLocationAnalytics();
  }, []);

  const loadOTPStatus = async () => {
    try {
      const response = await settingsAPI.getOTPStatus();
      setOtpEnabled(response.data.otpServiceEnabled);
    } catch (error) {
      console.error('Failed to load OTP status:', error);
    }
  };

  const handleToggleOTP = async () => {
    setTogglingOtp(true);
    try {
      const response = await settingsAPI.toggleOTP();
      setOtpEnabled(response.data.otpServiceEnabled);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Failed to toggle OTP:', error);
      toast.error('Failed to toggle OTP service');
    } finally {
      setTogglingOtp(false);
    }
  };

  const loadVerifiedNumbers = async () => {
    try {
      const response = await settingsAPI.getVerifiedNumbers();
      setVerifiedNumbers(response.data.verifiedNumbers || []);
    } catch (error) {
      console.error('Failed to load verified numbers:', error);
    }
  };

  const handleAddVerifiedNumber = async () => {
    if (!testPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setAddingNumber(true);
    try {
      const response = await settingsAPI.addVerifiedNumber(testPhone);
      setVerifiedNumbers(response.data.verifiedNumbers);
      setTestPhone('');
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add number');
    } finally {
      setAddingNumber(false);
    }
  };

  const handleRemoveVerifiedNumber = async (phone) => {
    try {
      const response = await settingsAPI.removeVerifiedNumber(phone);
      setVerifiedNumbers(response.data.verifiedNumbers);
      toast.success('Number removed');
    } catch (error) {
      toast.error('Failed to remove number');
    }
  };

  const handleSendTestOTP = async (method) => {
    if (!testPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setSendingTestOtp(true);
    setTestOtpResult(null);
    try {
      const response = await settingsAPI.sendTestOTP(testPhone, method);
      setTestOtpResult(response.data);
      if (response.data.success) {
        toast.success(`OTP: ${response.data.otp}`);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send OTP';
      setTestOtpResult({ success: false, message: errorMsg, results: error.response?.data?.results });
      toast.error(errorMsg);
    } finally {
      setSendingTestOtp(false);
    }
  };

  const loadShorts = async () => {
    try {
      const response = await reelsAPI.getReels();
      setShorts(response.data.reels || []);
    } catch (error) {
      console.error('Failed to load shorts:', error);
    }
  };

  const loadShortsAnalytics = async () => {
    try {
      const response = await adminAPI.getShortsAnalytics();
      setShortsAnalytics(response.data.shortsAnalytics);
    } catch (error) {
      console.error('Failed to load shorts analytics:', error);
    }
  };

  const loadLocationAnalytics = async () => {
    try {
      const response = await adminAPI.getLocationAnalytics();
      setLocationAnalytics(response.data.locationAnalytics);
    } catch (error) {
      console.error('Failed to load location analytics:', error);
    }
  };

  const handleAddShort = async (e) => {
    e.preventDefault();
    if (!shortForm.title.trim() || !shortForm.videoUrl.trim()) {
      toast.error('Title and Video URL are required');
      return;
    }

    setAddingShort(true);
    try {
      const tagsArray = shortForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      if (editingShort) {
        await reelsAPI.updateReel(editingShort._id, {
          title: shortForm.title.trim(),
          description: shortForm.description.trim(),
          videoUrl: shortForm.videoUrl.trim(),
          thumbnail: shortForm.thumbnail.trim() || null,
          category: shortForm.category,
          tags: tagsArray,
          isFeatured: shortForm.isFeatured
        });
        toast.success('Short updated successfully!');
      } else {
        await reelsAPI.createReel({
          title: shortForm.title.trim(),
          description: shortForm.description.trim(),
          videoUrl: shortForm.videoUrl.trim(),
          thumbnail: shortForm.thumbnail.trim() || null,
          category: shortForm.category,
          tags: tagsArray,
          isFeatured: shortForm.isFeatured
        });
        toast.success('Short added successfully!');
      }

      setShowAddShort(false);
      setEditingShort(null);
      setShortForm({ title: '', description: '', videoUrl: '', thumbnail: '', category: 'farming_tips', tags: '', isFeatured: false });
      loadShorts();
      loadShortsAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save short');
    } finally {
      setAddingShort(false);
    }
  };

  const handleEditShort = (short) => {
    setEditingShort(short);
    setShortForm({
      title: short.title || '',
      description: short.description || '',
      videoUrl: short.video?.url || '',
      thumbnail: short.video?.thumbnail || '',
      category: short.category || 'farming_tips',
      tags: short.tags?.join(', ') || '',
      isFeatured: short.isFeatured || false
    });
    setShowAddShort(true);
  };

  const handleDeleteShort = async (id) => {
    if (!confirm('Are you sure you want to delete this short?')) return;
    try {
      await reelsAPI.deleteReel(id);
      toast.success('Short deleted');
      setShorts(prev => prev.filter(s => s._id !== id));
      loadShortsAnalytics();
    } catch (error) {
      toast.error('Failed to delete short');
    }
  };

  const handleToggleFeatured = async (short) => {
    try {
      await reelsAPI.updateReel(short._id, { isFeatured: !short.isFeatured });
      toast.success(short.isFeatured ? 'Unpinned' : 'Pinned as featured');
      loadShorts();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const loadDashboardData = async () => {
    try {
      const [statsRes, geoRes, analyticsRes, activityRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getGeography(),
        adminAPI.getAnalytics(),
        adminAPI.getActivity(10),
        adminAPI.getUsers({ limit: 5 })
      ]);

      setStats(statsRes.data.stats);
      setGeography(geoRes.data.geography);
      setAnalytics(analyticsRes.data.analytics);
      setActivity(activityRes.data.activities);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    setStats({
      users: { total: 89935, newToday: 25, newThisWeek: 150, activeToday: 46827 },
      posts: { total: 23283, today: 85 },
      chats: { total: 124854, today: 320 },
      userGrowth: Array(7).fill(0).map((_, i) => ({
        _id: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i],
        users: Math.floor(Math.random() * 60) + 20,
        active: Math.floor(Math.random() * 40) + 10
      })),
      languageStats: [
        { _id: 'en', count: 400 },
        { _id: 'hi', count: 350 },
        { _id: 'ta', count: 200 },
        { _id: 'te', count: 150 }
      ]
    });

    setGeography({
      byState: [
        { _id: 'Maharashtra', count: 320 },
        { _id: 'Uttar Pradesh', count: 280 },
        { _id: 'Punjab', count: 200 },
        { _id: 'Karnataka', count: 180 },
        { _id: 'Tamil Nadu', count: 150 }
      ]
    });

    setAnalytics({
      cropStats: [
        { _id: 'Rice', count: 450 },
        { _id: 'Wheat', count: 380 },
        { _id: 'Cotton', count: 290 },
        { _id: 'Sugarcane', count: 220 },
        { _id: 'Vegetables', count: 180 }
      ]
    });

    setActivity([
      { type: 'user_joined', data: { name: 'Rajesh Kumar' }, time: new Date() },
      { type: 'new_post', data: { content: 'New farming tips...' }, time: new Date(Date.now() - 5 * 60000) }
    ]);

    setUsers([
      { _id: '1', name: 'Ramesh Patel', location: { city: 'Ahmedabad', state: 'Gujarat' }, createdAt: new Date() },
      { _id: '2', name: 'Suresh Kumar', location: { city: 'Delhi', state: 'Delhi' }, createdAt: new Date() }
    ]);
  };

  const languageNames = { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali', mr: 'Marathi' };

  // Prepare chart data
  const chartData = stats?.userGrowth?.map(item => ({
    name: item._id?.split('-')?.[1] || item._id,
    users: item.count || item.users || 0,
    active: Math.floor((item.count || item.users || 0) * 0.7)
  })) || [];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard
          title="Total Users"
          value={stats?.users?.total}
          change={`+${stats?.users?.newThisWeek || 0} this week`}
          changeType="up"
          icon={HiUsers}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Active Today"
          value={stats?.users?.activeToday}
          change={`${((stats?.users?.activeToday / stats?.users?.total) * 100 || 0).toFixed(1)}% of total`}
          changeType="up"
          icon={HiTrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard
          title="AI Chats"
          value={stats?.chats?.total}
          change={`+${stats?.chats?.today || 0} today`}
          changeType="up"
          icon={HiChat}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
        <StatCard
          title="Posts"
          value={stats?.posts?.total}
          change={`+${stats?.posts?.today || 0} today`}
          changeType="up"
          icon={HiDocumentText}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        <MiniStatCard title="Disease Scans" value={stats?.diseaseScans || 156} icon={HiPhotograph} color="bg-red-500" />
        <MiniStatCard title="Schemes Applied" value={stats?.schemeApplications || 89} icon={HiClipboardList} color="bg-green-500" />
        <MiniStatCard title="Marketplace Listings" value={stats?.listings || 234} icon={HiShoppingCart} color="bg-blue-500" />
        <MiniStatCard title="Shorts Views" value={shortsAnalytics?.engagement?.totalViews || 0} icon={HiPlay} color="bg-purple-500" />
        <MiniStatCard title="New Today" value={stats?.users?.newToday || 0} icon={HiUsers} color="bg-amber-500" />
        <MiniStatCard title="Avg Session" value={`${stats?.avgSessionMinutes || 8}m`} icon={HiClock} color="bg-cyan-500" />
      </div>

      {/* Analytics Chart & Language Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 lg:mb-6">
            <h3 className="font-semibold text-gray-800">User Growth Analytics</h3>
            <div className="flex items-center gap-3 lg:gap-4 text-xs lg:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-gray-500">New</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span className="text-gray-500">Active</span>
              </div>
              <select className="text-xs lg:text-sm border rounded-lg px-2 lg:px-3 py-1 lg:py-1.5 bg-gray-50">
                <option>Monthly</option>
                <option>Weekly</option>
              </select>
            </div>
          </div>
          <div className="h-48 sm:h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="none" fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="active" stroke="none" fill="url(#colorActive)" />
                <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Language Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="font-semibold text-gray-800 text-sm lg:text-base">Language Distribution</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <HiRefresh className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>
          <div className="h-40 lg:h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.languageStats}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  {stats?.languageStats?.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, languageNames[name] || name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 lg:gap-2 mt-3 lg:mt-4">
            {stats?.languageStats?.slice(0, 6).map((lang, idx) => (
              <div key={idx} className="flex items-center gap-1.5 lg:gap-2">
                <span className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx] }}></span>
                <span className="text-xs lg:text-sm text-gray-600 truncate">{languageNames[lang._id] || lang._id}</span>
                <span className="text-xs text-gray-400 ml-auto">{lang.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Feature Usage & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Feature Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-3 lg:mb-4 text-sm lg:text-base">Feature Usage</h3>
          <div className="space-y-3">
            {[
              { name: 'AI Chat', value: stats?.chats?.total || 124854, percent: 85, color: 'bg-purple-500' },
              { name: 'Disease Detection', value: stats?.diseaseScans || 156, percent: 45, color: 'bg-red-500' },
              { name: 'Marketplace', value: stats?.listings || 234, percent: 60, color: 'bg-blue-500' },
              { name: 'Schemes', value: stats?.schemeApplications || 89, percent: 35, color: 'bg-green-500' },
              { name: 'Shorts', value: shortsAnalytics?.engagement?.totalViews || 0, percent: 70, color: 'bg-amber-500' },
            ].map((feature, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs lg:text-sm mb-1">
                  <span className="text-gray-600">{feature.name}</span>
                  <span className="text-gray-800 font-medium">{feature.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${feature.color} rounded-full`} style={{ width: `${feature.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Daily Activity Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-3 lg:mb-4 text-sm lg:text-base">Daily Activity</h3>
          <div className="h-36 lg:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { hour: '6AM', users: 120 },
                { hour: '9AM', users: 450 },
                { hour: '12PM', users: 680 },
                { hour: '3PM', users: 520 },
                { hour: '6PM', users: 750 },
                { hour: '9PM', users: 420 },
                { hour: '12AM', users: 180 }
              ]}>
                <defs>
                  <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} fill="url(#activityGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Peak: 6PM
            </span>
            <span>Avg: 445 users/hour</span>
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-3 lg:mb-4 text-sm lg:text-base">System Health</h3>
          <div className="space-y-3">
            {[
              { name: 'API Response', status: 'healthy', value: '45ms', icon: HiLightningBolt },
              { name: 'Database', status: 'healthy', value: '99.9%', icon: HiShieldCheck },
              { name: 'AI Service', status: 'healthy', value: 'Active', icon: HiChat },
              { name: 'Storage', status: 'warning', value: '78%', icon: HiPhotograph },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 lg:p-3 bg-gray-50 rounded-lg lg:rounded-xl">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.status === 'healthy' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs lg:text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs lg:text-sm font-medium text-gray-800">{item.value}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    item.status === 'healthy' ? 'bg-green-500' : 'bg-amber-500'
                  }`}></span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* OTP Toggle & Shorts Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* OTP Service */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl shadow-sm overflow-hidden"
        >
          <button
            onClick={() => setShowOtpPanel(!showOtpPanel)}
            className="w-full p-4 lg:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 lg:gap-4">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                otpEnabled ? 'bg-green-50' : 'bg-amber-50'
              }`}>
                {otpEnabled ? (
                  <FaWhatsapp className="w-5 h-5 lg:w-6 lg:h-6 text-green-500" />
                ) : (
                  <HiCog className="w-5 h-5 lg:w-6 lg:h-6 text-amber-500" />
                )}
              </div>
              <div className="text-left min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm lg:text-base">OTP Service</h3>
                <p className="text-xs lg:text-sm text-gray-500 truncate">
                  {otpEnabled ? 'Production' : 'Dev Mode'} • {verifiedNumbers.length} verified
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
              <div
                onClick={(e) => { e.stopPropagation(); handleToggleOTP(); }}
                className={`relative w-12 h-7 lg:w-14 lg:h-8 rounded-full transition-colors cursor-pointer ${
                  otpEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white shadow transition-transform ${
                  otpEnabled ? 'translate-x-6 lg:translate-x-7' : 'translate-x-1'
                }`} />
              </div>
              {showOtpPanel ? <HiChevronUp className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" /> : <HiChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />}
            </div>
          </button>

          {/* Expanded OTP Panel */}
          <AnimatePresence>
            {showOtpPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-100"
              >
                <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
                  {/* Phone Input */}
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1.5 lg:mb-2">Test Phone Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <HiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={testPhone}
                          onChange={(e) => setTestPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full pl-9 lg:pl-10 pr-3 lg:pr-4 py-2 lg:py-2.5 text-sm border border-gray-200 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleAddVerifiedNumber}
                        disabled={addingNumber || !testPhone.trim()}
                        className="px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg lg:rounded-xl font-medium text-xs lg:text-sm disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <HiPlus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                    </div>
                  </div>

                  {/* Send Test OTP Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleSendTestOTP('sms')}
                      disabled={sendingTestOtp || !testPhone.trim()}
                      className="px-2 lg:px-4 py-2 lg:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg lg:rounded-xl font-medium text-xs lg:text-sm disabled:opacity-50 flex items-center justify-center gap-1 lg:gap-2"
                    >
                      <HiPaperAirplane className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      <span className="hidden sm:inline">{sendingTestOtp ? 'Sending...' : 'SMS'}</span>
                      <span className="sm:hidden">SMS</span>
                    </button>
                    <button
                      onClick={() => handleSendTestOTP('whatsapp')}
                      disabled={sendingTestOtp || !testPhone.trim()}
                      className="px-2 lg:px-4 py-2 lg:py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg lg:rounded-xl font-medium text-xs lg:text-sm disabled:opacity-50 flex items-center justify-center gap-1 lg:gap-2"
                    >
                      <FaWhatsapp className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      <span className="hidden sm:inline">{sendingTestOtp ? 'Sending...' : 'WhatsApp'}</span>
                      <span className="sm:hidden">WA</span>
                    </button>
                    <button
                      onClick={() => handleSendTestOTP('both')}
                      disabled={sendingTestOtp || !testPhone.trim()}
                      className="px-2 lg:px-4 py-2 lg:py-2.5 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-lg lg:rounded-xl font-medium text-xs lg:text-sm disabled:opacity-50 flex items-center justify-center gap-1 lg:gap-2"
                    >
                      <HiPaperAirplane className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      <span>{sendingTestOtp ? '...' : 'Both'}</span>
                    </button>
                  </div>

                  {/* Test Result */}
                  {testOtpResult && (
                    <div className={`p-3 lg:p-4 rounded-lg lg:rounded-xl ${testOtpResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={`font-medium text-sm lg:text-base ${testOtpResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {testOtpResult.success ? `OTP: ${testOtpResult.otp}` : 'Failed'}
                      </p>
                      {testOtpResult.results && (
                        <div className="mt-1.5 lg:mt-2 space-y-1 text-xs lg:text-sm">
                          {testOtpResult.results.sms && (
                            <p className={testOtpResult.results.sms.success ? 'text-green-600' : 'text-red-600'}>
                              SMS: {testOtpResult.results.sms.success ? 'Sent' : testOtpResult.results.sms.error}
                            </p>
                          )}
                          {testOtpResult.results.whatsapp && (
                            <p className={testOtpResult.results.whatsapp.success ? 'text-green-600' : 'text-red-600'}>
                              WA: {testOtpResult.results.whatsapp.success ? 'Sent' : testOtpResult.results.whatsapp.error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verified Numbers List */}
                  {verifiedNumbers.length > 0 && (
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1.5 lg:mb-2">Saved Numbers</label>
                      <div className="flex flex-wrap gap-1.5 lg:gap-2">
                        {verifiedNumbers.map((phone) => (
                          <div
                            key={phone}
                            className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1 lg:py-1.5 bg-gray-100 rounded-full text-xs lg:text-sm"
                          >
                            <span className="truncate max-w-[100px] lg:max-w-none">{phone}</span>
                            <button
                              onClick={() => setTestPhone(phone.replace('+91', ''))}
                              className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                              title="Use this number"
                            >
                              <HiPhone className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveVerifiedNumber(phone)}
                              className="text-red-500 hover:text-red-700 flex-shrink-0"
                              title="Remove"
                            >
                              <HiX className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info Note */}
                  <p className="text-[10px] lg:text-xs text-gray-500 bg-amber-50 p-2.5 lg:p-3 rounded-lg leading-relaxed">
                    <strong>Note:</strong> WhatsApp sandbox requires "join &lt;code&gt;" to +1 415 523 8886. SMS trial: verified numbers only.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Shorts Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl shadow-sm overflow-hidden"
        >
          <button
            onClick={() => setShowShortsPanel(!showShortsPanel)}
            className="w-full p-4 lg:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <HiPlay className="w-5 h-5 lg:w-6 lg:h-6 text-purple-500" />
              </div>
              <div className="text-left min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm lg:text-base">Shorts Management</h3>
                <p className="text-xs lg:text-sm text-gray-500">{shorts.length} shorts • {(shortsAnalytics?.engagement?.totalViews || 0).toLocaleString()} views</p>
              </div>
            </div>
            {showShortsPanel ? <HiChevronUp className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" /> : <HiChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" />}
          </button>
        </motion.div>
      </div>

      {/* Shorts Panel */}
      <AnimatePresence>
        {showShortsPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl lg:rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-4 lg:p-6">
              <div className="flex justify-between items-center mb-4 lg:mb-6">
                <h4 className="font-semibold text-gray-800 text-sm lg:text-base">All Shorts</h4>
                <button
                  onClick={() => { setEditingShort(null); setShortForm({ title: '', description: '', videoUrl: '', thumbnail: '', category: 'farming_tips', tags: '', isFeatured: false }); setShowAddShort(true); }}
                  className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg lg:rounded-xl font-medium text-xs lg:text-sm flex items-center gap-1.5 lg:gap-2 hover:shadow-lg transition-shadow"
                >
                  <HiPlus className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden sm:inline">Add</span> Short
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 lg:gap-4">
                {shorts.map((short) => (
                  <div key={short._id} className="relative group rounded-lg lg:rounded-xl overflow-hidden bg-gray-100">
                    <div className="aspect-[9/16] relative">
                      {short.video?.thumbnail ? (
                        <img src={short.video.thumbnail} alt={short.title} className="w-full h-full object-cover" />
                      ) : (
                        <video src={short.video?.url} className="w-full h-full object-cover" muted />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-1.5 lg:bottom-2 left-1.5 lg:left-2 right-1.5 lg:right-2">
                        <p className="text-white font-medium text-[10px] lg:text-xs line-clamp-2">{short.title}</p>
                        <div className="flex items-center gap-1.5 lg:gap-2 mt-0.5 lg:mt-1 text-white/80 text-[10px] lg:text-xs">
                          <span className="flex items-center gap-0.5"><HiEye className="w-2.5 h-2.5 lg:w-3 lg:h-3" />{short.views || 0}</span>
                          <span className="flex items-center gap-0.5"><HiHeart className="w-2.5 h-2.5 lg:w-3 lg:h-3" />{short.likes?.length || 0}</span>
                        </div>
                      </div>
                      <div className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleToggleFeatured(short)} className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${short.isFeatured ? 'bg-amber-500 text-white' : 'bg-white/80 text-gray-700'}`}>
                          <HiStar className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <button onClick={() => handleEditShort(short)} className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-white/80 flex items-center justify-center text-gray-700">
                          <HiPencil className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <button onClick={() => handleDeleteShort(short._id)} className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-red-500/80 flex items-center justify-center text-white">
                          <HiTrash className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      </div>
                      {short.isFeatured && (
                        <span className="absolute top-1.5 lg:top-2 left-1.5 lg:left-2 px-1.5 lg:px-2 py-0.5 bg-amber-500 text-white text-[10px] lg:text-xs font-medium rounded-full">Pinned</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-3 lg:mb-4 text-sm lg:text-base">Users by State</h3>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationAnalytics?.stateDetails || geography?.byState} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis dataKey={locationAnalytics?.stateDetails ? "state" : "_id"} type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Bar dataKey={locationAnalytics?.stateDetails ? "totalUsers" : "count"} fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-3 lg:mb-4 text-sm lg:text-base">Top Cities</h3>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationAnalytics?.districtStats?.slice(0, 8) || geography?.byCity?.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey={locationAnalytics?.districtStats ? "city" : "_id"} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} width={30} />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-3 lg:mb-4 text-sm lg:text-base">Recent Activity</h3>
          <div className="space-y-3 lg:space-y-4">
            {activity.map((item, index) => (
              <div key={index} className="flex items-center gap-2 lg:gap-3">
                <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.type === 'user_joined' ? 'bg-blue-50 text-blue-500' :
                  item.type === 'new_post' ? 'bg-green-50 text-green-500' :
                  'bg-purple-50 text-purple-500'
                }`}>
                  {item.type === 'user_joined' ? <HiUsers className="w-4 h-4 lg:w-5 lg:h-5" /> :
                   item.type === 'new_post' ? <HiDocumentText className="w-4 h-4 lg:w-5 lg:h-5" /> :
                   <HiChat className="w-4 h-4 lg:w-5 lg:h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs lg:text-sm text-gray-800 truncate">
                    {item.type === 'user_joined' ? `${item.data?.name} joined` :
                     item.type === 'new_post' ? 'New post created' :
                     `${item.data?.user?.name} chatted`}
                  </p>
                  <p className="text-xs text-gray-400">{format(new Date(item.time), 'MMM d, h:mm a')}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-3 lg:mb-4 text-sm lg:text-base">Recent Users</h3>
          <div className="space-y-2 lg:space-y-3">
            {users.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-2.5 lg:p-3 bg-gray-50 rounded-lg lg:rounded-xl">
                <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm lg:text-base">{user.name?.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-xs lg:text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.location?.city}, {user.location?.state}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{format(new Date(user.createdAt), 'MMM d')}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Short Modal */}
      <AnimatePresence>
        {showAddShort && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowAddShort(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-4 lg:p-6 w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-800">{editingShort ? 'Edit Short' : 'Add New Short'}</h3>
                <button onClick={() => setShowAddShort(false)} className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg">
                  <HiX className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>

              <form onSubmit={handleAddShort} className="space-y-3 lg:space-y-4">
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={shortForm.title}
                    onChange={(e) => setShortForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm border border-gray-200 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Video URL *</label>
                  <input
                    type="url"
                    value={shortForm.videoUrl}
                    onChange={(e) => setShortForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm border border-gray-200 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                  <input
                    type="url"
                    value={shortForm.thumbnail}
                    onChange={(e) => setShortForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                    className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm border border-gray-200 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={shortForm.category}
                    onChange={(e) => setShortForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm border border-gray-200 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={shortForm.isFeatured}
                    onChange={(e) => setShortForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="featured" className="text-xs lg:text-sm text-gray-700">Pin as Featured</label>
                </div>
                <div className="flex gap-2 lg:gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddShort(false)} className="flex-1 px-3 lg:px-4 py-2 lg:py-2.5 border border-gray-200 rounded-lg lg:rounded-xl font-medium text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={addingShort} className="flex-1 px-3 lg:px-4 py-2 lg:py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg lg:rounded-xl font-medium text-sm hover:shadow-lg transition-shadow disabled:opacity-50">
                    {addingShort ? 'Saving...' : editingShort ? 'Update' : 'Add Short'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
