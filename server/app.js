const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit'); // Disabled for development
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const diseaseRoutes = require('./routes/disease');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const weatherRoutes = require('./routes/weather');
const iotRoutes = require('./routes/iot');
const adminRoutes = require('./routes/admin');
const storyRoutes = require('./routes/storyRoutes');
const notificationRoutes = require('./routes/notifications');
const reelRoutes = require('./routes/reels');
const ttsRoutes = require('./routes/tts');
const settingsRoutes = require('./routes/settings');
const marketplaceRoutes = require('./routes/marketplace');
const cropCalendarRoutes = require('./routes/cropCalendar');
const schemeRoutes = require('./routes/schemes');
const schemeApplicationRoutes = require('./routes/schemeApplications');
const mandiRoutes = require('./routes/mandi');
const translateRoutes = require('./routes/translate');
const alertRoutes = require('./routes/alerts');
const cropRecommendationRoutes = require('./routes/cropRecommendation');
const voiceChatRoutes = require('./routes/voiceChat');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - DISABLED for development
// Uncomment below for production
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});
app.use('/api/', limiter);
*/

// CORS configuration - Allow mobile and local network access
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // Local network IPs
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,    // 10.x.x.x network
      /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/,   // 172.x.x.x network (hotspot)
      /^https?:\/\/.*\.vercel\.app$/,         // Vercel deployments
      /^https?:\/\/.*\.netlify\.app$/         // Netlify deployments
    ];

    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    callback(null, isAllowed || true); // Allow all in development
  },
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/crop-calendar', cropCalendarRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/scheme-applications', schemeApplicationRoutes);
app.use('/api/mandi', mandiRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/crop-recommendation', cropRecommendationRoutes);
app.use('/api/voice-chat', voiceChatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Agriculture API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
