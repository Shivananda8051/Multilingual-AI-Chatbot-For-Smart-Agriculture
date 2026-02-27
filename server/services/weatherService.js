const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY;
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(lat, lon) {
    try {
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      return this.formatWeatherResponse(response.data);
    } catch (error) {
      console.error('Weather API error:', error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  async getWeatherByCity(city) {
    try {
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      return this.formatWeatherResponse(response.data);
    } catch (error) {
      console.error('Weather API error:', error.message);
      if (error.response?.status === 404) {
        throw new Error('City not found. Please check the city name.');
      }
      throw new Error('Failed to fetch weather data');
    }
  }

  formatWeatherResponse(data) {
    return {
      success: true,
      weather: {
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        clouds: data.clouds.all,
        visibility: data.visibility,
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000),
        city: data.name,
        country: data.sys.country,
        // Include raw data for frontend compatibility
        main: data.main,
        weather: data.weather,
        name: data.name
      }
    };
  }

  async getForecast(lat, lon) {
    try {
      const response = await axios.get(`${this.baseURL}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          cnt: 40 // 5 days * 8 (3-hour intervals)
        }
      });

      const data = response.data;

      // Group by day
      const dailyForecast = {};
      data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!dailyForecast[date]) {
          dailyForecast[date] = {
            date,
            temps: [],
            conditions: [],
            humidity: [],
            rain: 0
          };
        }
        dailyForecast[date].temps.push(item.main.temp);
        dailyForecast[date].conditions.push(item.weather[0].main);
        dailyForecast[date].humidity.push(item.main.humidity);
        if (item.rain && item.rain['3h']) {
          dailyForecast[date].rain += item.rain['3h'];
        }
      });

      // Process daily data
      const forecast = Object.values(dailyForecast).map(day => ({
        date: day.date,
        tempMax: Math.round(Math.max(...day.temps)),
        tempMin: Math.round(Math.min(...day.temps)),
        tempAvg: Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length),
        humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
        condition: this.getMostFrequent(day.conditions),
        rainMm: Math.round(day.rain * 10) / 10
      }));

      return {
        success: true,
        city: data.city.name,
        country: data.city.country,
        forecast: forecast.slice(0, 7)
      };
    } catch (error) {
      console.error('Forecast API error:', error.message);
      throw new Error('Failed to fetch forecast data');
    }
  }

  getMostFrequent(arr) {
    const frequency = {};
    let maxFreq = 0;
    let result = arr[0];

    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
      if (frequency[item] > maxFreq) {
        maxFreq = frequency[item];
        result = item;
      }
    });

    return result;
  }

  getWeatherIcon(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  getFarmingAdvice(weather) {
    const advice = [];

    // Temperature-based advice
    if (weather.temp > 35) {
      advice.push('High temperature alert: Increase irrigation frequency and consider shade nets for sensitive crops.');
    } else if (weather.temp < 10) {
      advice.push('Cold weather: Protect tender plants with mulching or covers.');
    }

    // Humidity-based advice
    if (weather.humidity > 80) {
      advice.push('High humidity: Monitor for fungal diseases. Ensure good air circulation.');
    } else if (weather.humidity < 30) {
      advice.push('Low humidity: Increase watering frequency to prevent plant stress.');
    }

    // Rain-based advice
    if (weather.condition === 'Rain' || weather.condition === 'Thunderstorm') {
      advice.push('Rain expected: Delay fertilizer application and pesticide spraying.');
    }

    // Wind-based advice
    if (weather.windSpeed > 10) {
      advice.push('Strong winds: Secure young plants and delay spraying operations.');
    }

    return advice;
  }
}

module.exports = new WeatherService();
