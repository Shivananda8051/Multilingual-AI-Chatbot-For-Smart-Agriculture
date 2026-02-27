require('dotenv').config({ path: '../.env' });
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const Settings = require('./models/Settings');
const { initializeSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
initializeSocket(server);

// Start server after MongoDB connects
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Initialize default settings
    try {
      await Settings.initDefaults();
      console.log('Default settings initialized');
    } catch (error) {
      console.error('Failed to initialize settings:', error);
    }

    // Start listening only after DB is connected
    server.listen(PORT, () => {
      console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║   Smart Agriculture Chatbot Server                    ║
  ║   Running on port ${PORT}                               ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                       ║
  ║   Socket.IO: Enabled                                  ║
  ║   MongoDB: Connected                                  ║
  ╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
