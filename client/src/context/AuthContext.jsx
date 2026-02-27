import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { signOut as firebaseSignOut, getFCMToken, onForegroundMessage } from '../config/firebase';
import { playNotificationSound, unlockNotificationSound } from '../hooks/useNotificationSound';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Setup foreground message listener for push notifications (FCM)
  useEffect(() => {
    if (isAuthenticated) {
      // Unlock audio on first interaction
      const handleInteraction = () => unlockNotificationSound();
      document.addEventListener('click', handleInteraction, { once: true });
      document.addEventListener('touchstart', handleInteraction, { once: true });

      const unsubscribe = onForegroundMessage((payload) => {
        console.log('FCM foreground message received:', payload);
        const { title, body } = payload.notification || {};
        if (title) {
          // Play notification sound
          playNotificationSound();

          toast(body || title, {
            icon: '🔔',
            duration: 5000,
            position: 'top-center'
          });
        }
      });

      return () => {
        unsubscribe();
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
        setIsAuthenticated(true);

        // Update FCM token on auth check
        updateFCMToken();
      } catch (error) {
        console.error('Auth check failed:', error);

        // Only clear auth on genuine 401 errors, not network/rate limit issues
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          // For network errors, try to use cached user data
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
              setIsAuthenticated(true);
              console.log('Using cached user data due to network error');
            } catch (e) {
              console.error('Failed to parse cached user:', e);
            }
          }
        }
      }
    }
    setLoading(false);
  };

  const updateFCMToken = async (throwOnError = false) => {
    try {
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await authAPI.updateFCMToken(fcmToken);
        console.log('FCM token registered successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update FCM token:', error);
      if (throwOnError) {
        throw error;
      }
      return false;
    }
  };

  const login = async (token, userData, fcmToken = null) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);

    // Update FCM token after login
    if (fcmToken) {
      try {
        await authAPI.updateFCMToken(fcmToken);
      } catch (error) {
        console.error('Failed to update FCM token:', error);
      }
    } else {
      updateFCMToken();
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase
      await firebaseSignOut();
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
    localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
  };

  const value = {
    user,
    token: localStorage.getItem('token'),
    loading,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    updateUser,
    checkAuth,
    updateFCMToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
