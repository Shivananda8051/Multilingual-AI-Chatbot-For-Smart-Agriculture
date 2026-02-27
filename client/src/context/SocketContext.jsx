import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle visibility change (mobile: reconnect when user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socket && !socket.connected) {
        console.log('Page visible, reconnecting socket...');
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [socket]);

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection - use current hostname for mobile support
    let socketUrl;
    const apiUrl = import.meta.env.VITE_API_URL;

    // If using proxy (/api) or no URL set, construct from current hostname
    if (!apiUrl || apiUrl === '/api' || apiUrl.startsWith('/')) {
      // Use the current page's hostname so mobile devices can connect
      const hostname = window.location.hostname;
      // For localhost, always use HTTP for Socket.IO (server is HTTP)
      // For production/remote, match the page protocol
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const protocol = isLocalhost ? 'http:' : window.location.protocol;
      socketUrl = `${protocol}//${hostname}:5000`;
    } else {
      // Full URL provided - extract base URL (remove /api)
      socketUrl = apiUrl.replace('/api', '');
    }
    console.log('Attempting socket connection to:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'], // Polling first for better mobile support
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying on mobile
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id, 'Transport:', newSocket.io.engine.transport.name);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      // Auto-reconnect if disconnected unexpectedly on mobile
      if (reason === 'io server disconnect' || reason === 'transport close') {
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    // Handle reconnection
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnection attempt:', attemptNumber);
    });

    // Note: Notification handling is done in Header.jsx to avoid duplicate handlers
    // Header.jsx listens for 'notification' events and updates both local and context state

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  // Add notification to list (for manual additions)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  // Clear a notification
  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n._id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n._id !== notificationId);
    });
  }, []);

  // Set initial notifications (from API)
  const setInitialNotifications = useCallback((notifs, count) => {
    setNotifications(notifs);
    setUnreadCount(count);
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    setInitialNotifications,
    setUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
