# Smart Agriculture Chatbot - AgriBot

A multilingual AI-powered chatbot for smart agriculture that helps farmers with real-time crop health advice, weather updates, disease detection, and community engagement.

## Features

### Core Features

- **AI Chatbot** - Powered by Ollama LLM (kimi-k2:1t-cloud) for intelligent agricultural advice
- **Multilingual Support** - 8 languages: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi
- **Voice Interface** - Voice input and text-to-speech for accessibility
- **Disease Detection** - AI-powered crop disease identification using LLaVA vision model
- **Weather Integration** - Real-time weather data with farming recommendations
- **Community Blog** - Instagram-like social features for farmer networking
- **IoT Sensors** - Real-time monitoring of soil moisture, temperature, humidity
- **Push Notifications** - Weather alerts and agricultural news via Firebase FCM
- **PWA Support** - Installable progressive web app with offline capabilities

### User Features

- Phone-based authentication via Firebase OTP
- Profile setup with location, crops, and language preferences
- Follow/unfollow other farmers
- Create and engage with community posts
- Personal dashboard with crops summary

### Admin Features

- Analytics dashboard with user growth charts
- Geographic distribution of users
- Language usage statistics
- User management capabilities
- Activity monitoring

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- Firebase Admin SDK (Phone Auth + FCM)
- Twilio (SMS notifications)
- Ollama (LLM integration)
- LibreTranslate (Multilingual support)

### Frontend
- React 18 + Vite
- Tailwind CSS
- Framer Motion (animations)
- Recharts (data visualization)
- Firebase SDK (Auth + Messaging)
- PWA with Workbox

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v18 or higher)
2. **MongoDB** running locally or connection string to MongoDB Atlas
3. **Ollama** installed and running with required models:
   ```bash
   # Install Ollama from https://ollama.ai
   ollama pull kimi-k2:1t-cloud
   ollama pull llava
   ```
4. **LibreTranslate** (optional, for multilingual support):
   ```bash
   pip install libretranslate
   libretranslate --port 5555
   ```

## Installation

1. **Clone the repository**
   ```bash
   cd ChatBot
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**

   Edit the `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/smart-agriculture

   # Ollama LLM Configuration
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=kimi-k2:1t-cloud
   OLLAMA_VISION_MODEL=llava

   # Firebase Configuration (Get from Firebase Console)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email@project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=30d

   # Twilio Configuration (Get from Twilio Console)
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+1234567890

   # External APIs
   OPENWEATHERMAP_API_KEY=your-openweathermap-api-key
   LIBRETRANSLATE_URL=http://localhost:5555

   # Firebase Cloud Messaging
   FIREBASE_VAPID_KEY=your-vapid-key

   # Client Configuration
   VITE_API_URL=http://localhost:5000/api
   VITE_FIREBASE_VAPID_KEY=your-vapid-key
   ```

4. **Configure Firebase Client**

   Update `client/src/config/firebase.js` with your Firebase project config.

## Running the Application

### Development Mode

```bash
# Run both server and client concurrently
npm run dev

# Or run separately
npm run server  # Backend on http://localhost:5000
npm run client  # Frontend on http://localhost:5173
```

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
ChatBot/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React contexts (Auth, Language)
│   │   ├── hooks/            # Custom hooks (Voice, Geolocation)
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   └── config/           # Firebase configuration
│   └── public/               # Static assets & PWA files
├── server/                    # Express backend
│   ├── controllers/          # Request handlers
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   ├── middleware/           # Auth, upload, admin
│   ├── services/             # External services
│   └── config/               # Database & Firebase config
└── .env                      # Environment variables
```

## API Endpoints

### Authentication
- `POST /api/auth/firebase-login` - Login with Firebase ID token
- `POST /api/auth/setup-profile` - Complete profile setup

### Chat
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/clear` - Clear chat history

### Disease Detection
- `POST /api/disease/detect` - Analyze crop image

### Weather
- `GET /api/weather/current` - Get current weather
- `GET /api/weather/forecast` - Get 7-day forecast
- `GET /api/weather/advice` - Get farming advice

### Community Posts
- `GET /api/posts` - Get feed
- `POST /api/posts` - Create post
- `POST /api/posts/:id/like` - Toggle like
- `POST /api/posts/:id/comment` - Add comment

### IoT Sensors
- `GET /api/iot/sensors` - Get sensor data
- `POST /api/iot/data` - Submit sensor reading
- `GET /api/iot/history` - Get historical data

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/geography` - Geographic analytics

## Supported Languages

| Code | Language   | Native Name |
|------|------------|-------------|
| en   | English    | English     |
| hi   | Hindi      | हिंदी        |
| ta   | Tamil      | தமிழ்        |
| te   | Telugu     | తెలుగు       |
| kn   | Kannada    | ಕನ್ನಡ        |
| ml   | Malayalam  | മലയാളം       |
| bn   | Bengali    | বাংলা        |
| mr   | Marathi    | मराठी        |

## Setting Up External Services

### Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable Phone Authentication
3. Enable Cloud Messaging
4. Download service account key for server
5. Copy web config for client

### Twilio Setup (Optional - for SMS)

1. Create account at [Twilio](https://www.twilio.com)
2. Get Account SID, Auth Token, and Phone Number
3. Add to `.env` file

### OpenWeatherMap Setup

1. Create account at [OpenWeatherMap](https://openweathermap.org)
2. Generate API key
3. Add to `.env` file

## PWA Installation

The app can be installed as a Progressive Web App:

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Or use menu > "Install AgriBot"

## Troubleshooting

### Common Issues

1. **Ollama not responding**
   - Ensure Ollama is running: `ollama serve`
   - Check if model is downloaded: `ollama list`

2. **Firebase Auth errors**
   - Verify Firebase config matches console
   - Ensure phone auth is enabled in Firebase Console

3. **Translation not working**
   - LibreTranslate must be running on port 5555
   - Or disable translation for English-only mode

4. **MongoDB connection failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Ollama for local LLM inference
- Firebase for authentication and notifications
- OpenWeatherMap for weather data
- LibreTranslate for multilingual support


##dieases

  Supported Crops (38 classes)

  - Apple, Blueberry, Cherry, Corn, Grape
  - Orange, Peach, Pepper, Potato, Raspberry
  - Soybean, Squash, Strawberry, Tomato

  How It Works Now

  1. PlantVillage runs first (fastest, local, no API limits)
  2. If PlantVillage fails → falls back to Gemini
  3. If Gemini fails → falls back to Ollama

  Files Added/Modified

  - server/services/plantDiseaseService.js - New TensorFlow.js service
  - server/controllers/diseaseController.js - Updated to use PlantVillage first
  - server/models/plant-disease/ - Downloaded model files (~13MB)

  Restart your server to start using the new disease detection. The first detection will be slower (~5s for model loading), subsequent ones will be ~3.5 seconds.
