const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

// Map to store userId -> socketId for targeted notifications
const userSockets = new Map();

const initializeSocket = (server) => {
  // Get allowed origins from environment or use defaults
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Allow local network IPs
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // Allow 10.x.x.x network
        /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/,  // Allow 172.x.x.x network (hotspot)
        /^https?:\/\/.*\.vercel\.app$/,       // Allow Vercel deployments
        /^https?:\/\/.*\.netlify\.app$/       // Allow Netlify deployments
      ];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check against allowed origins
        const isAllowed = allowedOrigins.some(allowed => {
          if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return allowed === origin;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          console.log('Socket CORS blocked origin:', origin);
          callback(null, true); // Allow anyway in development
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Better mobile support
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['polling', 'websocket']
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`Socket connected: ${socket.id} (User: ${userId})`);

    // Store user's socket connection
    userSockets.set(userId, socket.id);

    // Join user to their personal room for targeted notifications
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${userId})`);
      userSockets.delete(userId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('Socket.IO initialized');
  return io;
};

// Get the Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Send notification to a specific user
const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot send notification');
    return false;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`Notification sent to user ${userId}:`, notification.title);
  return true;
};

// Send notification to multiple users
const sendNotificationToUsers = (userIds, notification) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot send notifications');
    return false;
  }

  userIds.forEach(userId => {
    io.to(`user:${userId}`).emit('notification', notification);
  });
  console.log(`Notification sent to ${userIds.length} users:`, notification.title);
  return true;
};

// Broadcast to all connected users
const broadcastNotification = (notification) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot broadcast');
    return false;
  }

  io.emit('notification', notification);
  console.log('Broadcast notification:', notification.title);
  return true;
};

// Get online users count
const getOnlineUsersCount = () => {
  return userSockets.size;
};

// Check if user is online
const isUserOnline = (userId) => {
  return userSockets.has(userId);
};

module.exports = {
  initializeSocket,
  getIO,
  sendNotificationToUser,
  sendNotificationToUsers,
  broadcastNotification,
  getOnlineUsersCount,
  isUserOnline
};
