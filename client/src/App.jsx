import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout Components
import Layout from './components/common/Layout';
import AdminLayout from './components/admin/AdminLayout';

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Chat from './pages/Chat';
import Disease from './pages/Disease';
import Blog from './pages/Blog';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import IoT from './pages/IoT';
import Shorts from './pages/Shorts';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminUsers from './pages/AdminUsers';
import Marketplace from './pages/Marketplace';
import CropCalendar from './pages/CropCalendar';
import Schemes from './pages/Schemes';
import MandiPrices from './pages/MandiPrices';
import CropRecommendation from './pages/CropRecommendation';
import NotificationSettings from './pages/NotificationSettings';
import IrrigationFertilizer from './pages/IrrigationFertilizer';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (!user?.isProfileComplete) {
      return <Navigate to="/setup-profile" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Landing Page - Always accessible */}
      <Route path="/" element={<Landing />} />

      {/* Login Page */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      {/* Profile Setup */}
      <Route
        path="/setup-profile"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes with Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="chat" element={<Chat />} />
        <Route path="disease" element={<Disease />} />
        <Route path="blog" element={<Blog />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="iot" element={<IoT />} />
        <Route path="shorts" element={<Shorts />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="crop-calendar" element={<CropCalendar />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="mandi-prices" element={<MandiPrices />} />
        <Route path="crop-recommendation" element={<CropRecommendation />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="irrigation-fertilizer" element={<IrrigationFertilizer />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
