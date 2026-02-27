import axios from 'axios';

// Use environment variable or construct from current hostname (for mobile support)
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  console.log('VITE_API_URL from env:', envUrl);

  // If using proxy or relative URL
  if (envUrl && (envUrl === '/api' || envUrl.startsWith('/'))) {
    return envUrl;
  }

  // If full URL provided
  if (envUrl) {
    return envUrl;
  }

  // Fallback: construct from current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:5000/api`;
};

const API_URL = getApiUrl();
console.log('Final API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors with retry logic
let isRefreshing = false;
let failedQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors (no response)
    if (!error.response) {
      console.warn('Network error - retrying...');
      // Retry once for network errors
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return api(originalRequest);
      }
      return Promise.reject(error);
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      console.warn('Rate limited - waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return api(originalRequest);
    }

    // Handle 401 - only logout if it's a genuine auth failure
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');

      // Only redirect if we had a token and it's now invalid
      // Don't redirect for missing token (user was already logged out)
      if (token && !originalRequest._authRetry) {
        originalRequest._authRetry = true;

        // Try once more - token might have been refreshed
        try {
          return await api(originalRequest);
        } catch (retryError) {
          // Still failing - clear auth and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  // Firebase Phone Auth (recommended)
  firebaseLogin: (idToken, fcmToken) => api.post('/auth/firebase-login', { idToken, fcmToken }),
  adminFirebaseLogin: (idToken) => api.post('/auth/admin/firebase-login', { idToken }),
  updateFCMToken: (fcmToken) => api.post('/auth/update-fcm-token', { fcmToken }),
  // Legacy OTP methods (kept for backwards compatibility)
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  // WhatsApp OTP methods (Twilio)
  sendWhatsAppOTP: (phone) => api.post('/auth/send-whatsapp-otp', { phone }),
  verifyWhatsAppOTP: (phone, otp, fcmToken) => api.post('/auth/verify-whatsapp-otp', { phone, otp, fcmToken }),
  // SMS OTP methods (Twilio)
  sendSmsOTP: (phone) => api.post('/auth/send-sms-otp', { phone }),
  setupProfile: (data) => api.post('/auth/setup-profile', data),
  getMe: () => api.get('/auth/me'),
  adminLogin: (phone, otp) => api.post('/auth/admin/login', { phone, otp })
};

// Chat API
export const chatAPI = {
  sendMessage: (message, language) => api.post('/chat/message', { message, language }),
  getHistory: (page = 1) => api.get(`/chat/history?page=${page}`),
  clearHistory: () => api.delete('/chat/clear'),
  submitFeedback: (messageId, feedback) => api.post('/chat/feedback', { messageId, feedback }),
  getSessions: () => api.get('/chat/sessions'),
  getSession: (sessionId) => api.get(`/chat/session/${sessionId}`)
};

// Disease Detection API
export const diseaseAPI = {
  detect: (formData) => api.post('/disease/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getHistory: (page = 1) => api.get(`/disease/history?page=${page}`),
  getDetection: (id) => api.get(`/disease/history/${id}`),
  deleteDetection: (id) => api.delete(`/disease/history/${id}`)
};

// Weather API
export const weatherAPI = {
  getCurrent: (lat, lon) => api.get(`/weather/current?lat=${lat}&lon=${lon}`),
  getByCity: (city) => api.get(`/weather/city?city=${encodeURIComponent(city)}`),
  getForecast: (lat, lon) => api.get(`/weather/forecast?lat=${lat}&lon=${lon}`),
  getAdvice: (lat, lon, language) => api.get(`/weather/advice?lat=${lat}&lon=${lon}&language=${language}`)
};

// Posts API
export const postsAPI = {
  getPosts: (page = 1, category, hashtag) => {
    let url = `/posts?page=${page}`;
    if (category) url += `&category=${category}`;
    if (hashtag) url += `&hashtag=${hashtag}`;
    return api.get(url);
  },
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (formData) => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  addComment: (id, content) => api.post(`/posts/${id}/comment`, { content }),
  deleteComment: (id, commentId) => api.delete(`/posts/${id}/comment/${commentId}`)
};

// Users API
export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (formData) => api.put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  toggleFollow: (id) => api.post(`/users/follow/${id}`),
  getFollowers: (id) => api.get(`/users/${id}/followers`),
  getFollowing: (id) => api.get(`/users/${id}/following`),
  getUserPosts: (id, page = 1) => api.get(`/users/${id}/posts?page=${page}`),
  joinCommunity: () => api.post('/users/community/join'),
  searchUsers: (query, page = 1) => api.get(`/users/search/query?q=${encodeURIComponent(query)}&page=${page}`)
};

// Stories API
export const storiesAPI = {
  getStories: () => api.get('/stories'),
  createStory: (formData) => api.post('/stories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  viewStory: (id) => api.post(`/stories/${id}/view`),
  deleteStory: (id) => api.delete(`/stories/${id}`),
  getMyStories: () => api.get('/stories/my')
};

// IoT API
export const iotAPI = {
  // Device Management
  getDevices: () => api.get('/iot/devices'),
  registerDevice: (deviceId, secretKey, name) => api.post('/iot/devices/register', { deviceId, secretKey, name }),
  removeDevice: (deviceId) => api.delete(`/iot/devices/${deviceId}`),
  updateDevice: (deviceId, data) => api.put(`/iot/devices/${deviceId}`, data),
  getDeviceStatus: (deviceId) => api.get(`/iot/devices/${deviceId}/status`),
  provisionDevice: (type, sensors) => api.post('/iot/devices/provision', { type, sensors }),
  // Sensor Data
  getSensors: () => api.get('/iot/sensors'),
  addData: (data) => api.post('/iot/data', data),
  getHistory: (params) => api.get('/iot/history', { params }),
  updateThresholds: (data) => api.put('/iot/thresholds', data)
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getGeography: () => api.get('/admin/geography'),
  getAnalytics: () => api.get('/admin/analytics'),
  getActivity: (limit = 20) => api.get(`/admin/activity?limit=${limit}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getShortsAnalytics: () => api.get('/admin/shorts-analytics'),
  getLocationAnalytics: () => api.get('/admin/location-analytics')
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear')
};

// Reels API
export const reelsAPI = {
  getReels: (category, featured) => {
    let url = '/reels';
    const params = [];
    if (category) params.push(`category=${category}`);
    if (featured) params.push('featured=true');
    if (params.length) url += `?${params.join('&')}`;
    return api.get(url);
  },
  getReel: (id) => api.get(`/reels/${id}`),
  toggleLike: (id) => api.post(`/reels/${id}/like`),
  getCategories: () => api.get('/reels/categories'),
  // Comments
  getComments: (id, page = 1) => api.get(`/reels/${id}/comments?page=${page}`),
  addComment: (id, content) => api.post(`/reels/${id}/comment`, { content }),
  deleteComment: (id, commentId) => api.delete(`/reels/${id}/comment/${commentId}`),
  // Share
  shareReel: (id) => api.post(`/reels/${id}/share`),
  // View tracking
  trackView: (id) => api.post(`/reels/${id}/view`),
  // User submission
  createUserShort: (data) => api.post('/reels/user', data),
  // Admin methods
  createReel: (data) => api.post('/reels', data),
  updateReel: (id, data) => api.put(`/reels/${id}`, data),
  deleteReel: (id) => api.delete(`/reels/${id}`),
  seedReels: () => api.post('/reels/seed')
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  getSetting: (key) => api.get(`/settings/${key}`),
  updateSetting: (key, value) => api.put(`/settings/${key}`, { value }),
  toggleOTP: () => api.post('/settings/toggle-otp'),
  getOTPStatus: () => api.get('/settings/otp-status'),
  // Verified numbers for OTP testing
  getVerifiedNumbers: () => api.get('/settings/verified-numbers'),
  addVerifiedNumber: (phone) => api.post('/settings/verified-numbers', { phone }),
  removeVerifiedNumber: (phone) => api.delete(`/settings/verified-numbers/${encodeURIComponent(phone)}`),
  sendTestOTP: (phone, method) => api.post('/settings/send-test-otp', { phone, method })
};

// Text-to-Speech API (ElevenLabs)
export const ttsAPI = {
  speak: async (text, language = 'en') => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tts/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text, language })
    });
    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }
    return response.blob();
  },
  getVoices: () => api.get('/tts/voices')
};

// Crop Calendar API
export const cropCalendarAPI = {
  // Calendar entries
  getCalendarEntries: (params) => api.get('/crop-calendar', { params }),
  getCalendarEntry: (id) => api.get(`/crop-calendar/${id}`),
  createCalendarEntry: (data) => api.post('/crop-calendar', data),
  updateCalendarEntry: (id, data) => api.put(`/crop-calendar/${id}`, data),
  updateStatus: (id, status, weatherData) => api.put(`/crop-calendar/${id}/status`, { status, weatherData }),
  deleteCalendarEntry: (id) => api.delete(`/crop-calendar/${id}`),
  // Recommendations
  getRecommendations: (month) => api.get('/crop-calendar/recommendations', { params: { month } }),
  getRotationSuggestions: () => api.get('/crop-calendar/rotation-suggestions'),
  getStats: (year) => api.get('/crop-calendar/stats', { params: { year } }),
  // Crop database
  getCrops: (params) => api.get('/crop-calendar/crops', { params }),
  getCrop: (id) => api.get(`/crop-calendar/crops/${id}`),
  getCategories: () => api.get('/crop-calendar/crops/categories'),
  getSeasonalCrops: (month, region) => api.get('/crop-calendar/crops/seasonal', { params: { month, region } }),
  // Activities
  getActivities: (params) => api.get('/crop-calendar/activities', { params }),
  getUpcomingActivities: (days) => api.get('/crop-calendar/activities/upcoming', { params: { days } }),
  getTodayActivities: () => api.get('/crop-calendar/activities/today'),
  getOverdueActivities: () => api.get('/crop-calendar/activities/overdue'),
  createActivity: (data) => api.post('/crop-calendar/activities', data),
  updateActivity: (id, data) => api.put(`/crop-calendar/activities/${id}`, data),
  completeActivity: (id, notes) => api.put(`/crop-calendar/activities/${id}/complete`, { notes }),
  skipActivity: (id, reason) => api.put(`/crop-calendar/activities/${id}/skip`, { reason }),
  deleteActivity: (id) => api.delete(`/crop-calendar/activities/${id}`)
};

// Marketplace API
export const marketplaceAPI = {
  // Listings
  getListings: (params) => api.get('/marketplace/listings', { params }),
  getListing: (id) => api.get(`/marketplace/listings/${id}`),
  createListing: (formData) => api.post('/marketplace/listings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateListing: (id, formData) => api.put(`/marketplace/listings/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteListing: (id) => api.delete(`/marketplace/listings/${id}`),
  // User listings
  getMyListings: (params) => api.get('/marketplace/my-listings', { params }),
  getSavedListings: (params) => api.get('/marketplace/saved', { params }),
  // Engagement
  toggleSave: (id) => api.post(`/marketplace/listings/${id}/save`),
  recordInquiry: (id, data) => api.post(`/marketplace/listings/${id}/inquiry`, data),
  // Mandi prices
  getMandiPrices: (commodity, state, district) =>
    api.get('/marketplace/mandi-prices', { params: { commodity, state, district } }),
  getPriceComparison: (id) => api.get(`/marketplace/price-compare/${id}`),
  getTrendingCrops: (state) => api.get('/marketplace/trending', { params: { state } }),
  // Options
  getOptions: () => api.get('/marketplace/options')
};

// Schemes API
export const schemesAPI = {
  getSchemes: (params) => api.get('/schemes', { params }),
  getScheme: (id) => api.get(`/schemes/${id}`),
  getCategories: () => api.get('/schemes/categories'),
  getRecommendations: () => api.get('/schemes/recommendations'),
  getOfficialPortals: () => api.get('/schemes/portals'),
  checkEligibility: (id) => api.post(`/schemes/${id}/check-eligibility`),
  // Live from myScheme.gov.in
  getLiveSchemes: (category) => api.get('/schemes/live', { params: { category } }),
  getLiveSchemeDetails: (slug) => api.get(`/schemes/live/${slug}`),
  // Admin
  createScheme: (data) => api.post('/schemes', data),
  updateScheme: (id, data) => api.put(`/schemes/${id}`, data),
  deleteScheme: (id) => api.delete(`/schemes/${id}`),
  syncFromGov: () => api.post('/schemes/sync')
};

// Scheme Applications API
export const schemeApplicationsAPI = {
  getMyApplications: (params) => api.get('/scheme-applications/my', { params }),
  getApplication: (id) => api.get(`/scheme-applications/${id}`),
  createApplication: (data) => api.post('/scheme-applications', data),
  updateApplication: (id, data) => api.put(`/scheme-applications/${id}`, data),
  submitApplication: (id) => api.post(`/scheme-applications/${id}/submit`),
  cancelApplication: (id, reason) => api.post(`/scheme-applications/${id}/cancel`, { reason }),
  trackApplication: (applicationNumber) => api.get(`/scheme-applications/track/${applicationNumber}`),
  // Admin
  getAllApplications: (params) => api.get('/scheme-applications', { params }),
  getStats: () => api.get('/scheme-applications/stats'),
  updateStatus: (id, status, remarks, benefitDetails) =>
    api.put(`/scheme-applications/${id}/status`, { status, remarks, benefitDetails })
};

// Mandi Prices API - Government Market Data
export const mandiAPI = {
  // Get prices with filters
  getPrices: (params) => api.get('/mandi/prices', { params }),
  // Get available states
  getStates: () => api.get('/mandi/states'),
  // Get trending commodities
  getTrending: (state) => api.get('/mandi/trending', { params: { state } }),
  // Get prices for a specific commodity
  getCommodityPrices: (commodity, state) =>
    api.get(`/mandi/commodity/${encodeURIComponent(commodity)}`, { params: { state } }),
  // Get price comparison across markets
  getPriceComparison: (commodity, state) =>
    api.get(`/mandi/compare/${encodeURIComponent(commodity)}`, { params: { state } }),
  // Get prices by state
  getStatePrices: (state, limit) =>
    api.get(`/mandi/state/${encodeURIComponent(state)}`, { params: { limit } }),
  // Get prices from a specific market
  getMarketPrices: (market, state) =>
    api.get(`/mandi/market/${encodeURIComponent(market)}`, { params: { state } })
};

// Translation API - Runtime Translation
export const translateAPI = {
  // Translate single text
  translateText: (text, targetLang, sourceLang = 'en') =>
    api.post('/translate/text', { text, sourceLang, targetLang }),
  // Batch translate multiple texts
  translateBatch: (texts, targetLang, sourceLang = 'en') =>
    api.post('/translate/batch', { texts, sourceLang, targetLang }),
  // Translate UI strings object
  translateUI: (strings, targetLang, sourceLang = 'en') =>
    api.post('/translate/ui', { strings, sourceLang, targetLang }),
  // Detect language
  detectLanguage: (text) =>
    api.post('/translate/detect', { text }),
  // Get available languages
  getLanguages: () =>
    api.get('/translate/languages'),
  // Health check
  checkHealth: () =>
    api.get('/translate/health')
};

// Alerts API - Push Notifications & Subscriptions
export const alertsAPI = {
  // Get user's alert subscriptions
  getSubscriptions: () => api.get('/alerts/subscriptions'),
  // Register FCM token
  registerToken: (fcmToken) => api.post('/alerts/register-token', { fcmToken }),
  // Price alerts
  addPriceAlert: (data) => api.post('/alerts/price', data),
  removePriceAlert: (alertId) => api.delete(`/alerts/price/${alertId}`),
  // Weather alerts
  updateWeatherAlerts: (data) => api.put('/alerts/weather', data),
  // Scheme alerts
  updateSchemeAlerts: (data) => api.put('/alerts/schemes', data),
  // Preferences
  updatePreferences: (data) => api.put('/alerts/preferences', data),
  // Test notification
  sendTestNotification: () => api.post('/alerts/test')
};

// Voice Chat API (Groq-powered fast responses)
export const voiceChatAPI = {
  sendMessage: (message, language = 'en') => api.post('/voice-chat/message', { message, language }),
  health: () => api.get('/voice-chat/health')
};

// Crop Recommendation API
export const cropRecommendationAPI = {
  // Get crop recommendations based on conditions
  getRecommendations: (data) => api.post('/crop-recommendation/recommend', data),
  // Get profit estimation for a crop
  getProfitEstimation: (data) => api.post('/crop-recommendation/profit', data),
  // Get sowing calendar
  getSowingCalendar: (state) => api.get('/crop-recommendation/calendar', { params: { state } }),
  // Get available options (soil types, seasons, etc.)
  getOptions: () => api.get('/crop-recommendation/options'),
  // Get all crops info
  getAllCrops: () => api.get('/crop-recommendation/crops')
};
