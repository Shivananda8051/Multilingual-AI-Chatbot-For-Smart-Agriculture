const weatherService = require('../services/weatherService');
const ollamaService = require('../services/ollamaService');
const translationService = require('../services/translationService');

// @desc    Get weather by city name
// @route   GET /api/weather/city
exports.getWeatherByCity = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    const weather = await weatherService.getWeatherByCity(city);

    res.status(200).json(weather.weather);
  } catch (error) {
    console.error('Weather by city error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch weather data'
    });
  }
};

// @desc    Get current weather
// @route   GET /api/weather/current
exports.getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      // Use user's stored location if available
      if (req.user.location?.coordinates?.lat) {
        const { lat: userLat, lng: userLon } = req.user.location.coordinates;
        const weather = await weatherService.getCurrentWeather(userLat, userLon);
        return res.status(200).json({
          success: true,
          weather: weather.weather
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const weather = await weatherService.getCurrentWeather(lat, lon);

    res.status(200).json({
      success: true,
      weather: weather.weather
    });
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather data'
    });
  }
};

// @desc    Get 7-day weather forecast
// @route   GET /api/weather/forecast
exports.getForecast = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      if (req.user.location?.coordinates?.lat) {
        const { lat: userLat, lng: userLon } = req.user.location.coordinates;
        const forecast = await weatherService.getForecast(userLat, userLon);
        return res.status(200).json({
          success: true,
          ...forecast
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const forecast = await weatherService.getForecast(lat, lon);

    res.status(200).json({
      success: true,
      ...forecast
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forecast data'
    });
  }
};

// @desc    Get weather-based farming advice
// @route   GET /api/weather/advice
exports.getWeatherAdvice = async (req, res) => {
  try {
    const { lat, lon, language } = req.query;
    const userLanguage = language || req.user.preferredLanguage || 'en';

    let latitude = lat;
    let longitude = lon;

    // Use user's stored location if not provided
    if (!lat || !lon) {
      if (req.user.location?.coordinates?.lat) {
        latitude = req.user.location.coordinates.lat;
        longitude = req.user.location.coordinates.lng;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Location is required'
        });
      }
    }

    // Get current weather
    const weatherData = await weatherService.getCurrentWeather(latitude, longitude);

    // Get basic weather advice
    const basicAdvice = weatherService.getFarmingAdvice(weatherData.weather);

    // Get AI-powered detailed advice (directly in user's language)
    const crops = req.user.cropsGrown || ['general crops'];
    const aiAdvice = await ollamaService.getWeatherAdvice(weatherData.weather, crops, userLanguage);

    res.status(200).json({
      success: true,
      weather: weatherData.weather,
      advice: {
        basic: basicAdvice,
        detailed: aiAdvice.message
      }
    });
  } catch (error) {
    console.error('Weather advice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weather advice'
    });
  }
};
