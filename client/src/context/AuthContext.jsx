import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Use ref to store lastActivity so interval can access latest value without re-creating
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    checkAuth();
  }, []);

  // Keep session alive - refresh auth every 15 minutes if user is active
  useEffect(() => {
    if (!isAuthenticated) return;

    const SESSION_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes
    const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current; // Use ref for latest value

      // Only refresh if user was active in last 30 minutes
      if (timeSinceActivity < ACTIVITY_TIMEOUT) {
        console.log('Refreshing session...');
        checkAuth(true); // Silently refresh session
      } else {
        console.log('Session inactive, skipping refresh');
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated]); // Only depends on auth status, not activity

  // Track user activity to keep session alive
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const updateActivity = () => {
      const now = Date.now();
      setLastActivity(now);
      lastActivityRef.current = now; // Update ref for interval to access
    };

    // Listen to user activity
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
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

  const checkAuth = async (silent = false) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        const userData = response.data.user;

        setUser(userData);
        setIsAuthenticated(true);

        // Cache user data for offline support
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('lastAuthCheck', Date.now().toString());

        // Update FCM token on auth check (but not on silent refreshes)
        if (!silent) {
          updateFCMToken();
        }
      } catch (error) {
        console.error('Auth check failed:', error);

        // Only clear auth on genuine 401/403 errors, not network/rate limit issues
        const status = error.response?.status;

        if (status === 401 || status === 403) {
          // Token is invalid or expired - clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('lastAuthCheck');
          setUser(null);
          setIsAuthenticated(false);
        } else if (!navigator.onLine || status === 429 || !error.response) {
          // Network offline, rate limited, or network error - use cached data
          const cachedUser = localStorage.getItem('user');
          const lastCheck = localStorage.getItem('lastAuthCheck');

          if (cachedUser && lastCheck) {
            const cacheAge = Date.now() - parseInt(lastCheck);
            const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

            // Use cache if less than 24 hours old
            if (cacheAge < MAX_CACHE_AGE) {
              try {
                setUser(JSON.parse(cachedUser));
                setIsAuthenticated(true);
                console.log('Using cached user data (offline/network error)');
              } catch (e) {
                console.error('Failed to parse cached user:', e);
              }
            } else {
              console.log('Cached data too old, clearing auth');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('lastAuthCheck');
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
