const axios = require('axios');

const OPENWEATHER_API_KEY = process.env.WEATHER_API_KEY || 'demo'; // Get from env
const OPENWEATHER_BASE_URL = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';

/**
 * Get weather forecast for a specific date and location
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} zipCode - US zip code
 * @returns {Promise} Weather data
 */
const getWeatherForecast = async (date, zipCode) => {
  try {
    // Get coordinates from zip code using geocoding API
    const geoResponse = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        zip: `${zipCode},US`,
        appid: OPENWEATHER_API_KEY,
      }
    });

    const { coord } = geoResponse.data;

    // Get 5-day forecast
    const forecastResponse = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        lat: coord.lat,
        lon: coord.lon,
        appid: OPENWEATHER_API_KEY,
        units: 'imperial', // Fahrenheit
      }
    });

    // Find forecast for the specific date
    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0); // Set to noon for comparison

    const forecasts = forecastResponse.data.list;

    // Find closest forecast to target date
    let closestForecast = null;
    let smallestDiff = Infinity;

    forecasts.forEach(forecast => {
      const forecastDate = new Date(forecast.dt * 1000);
      const diff = Math.abs(forecastDate - targetDate);

      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestForecast = forecast;
      }
    });

    if (!closestForecast) {
      return {
        condition: 'Unknown',
        temperature: null,
        humidity: null,
        windSpeed: null,
        description: 'Weather data not available for this date',
      };
    }

    return {
      condition: closestForecast.weather[0].main,
      description: closestForecast.weather[0].description,
      temperature: Math.round(closestForecast.main.temp),
      feelsLike: Math.round(closestForecast.main.feels_like),
      humidity: closestForecast.main.humidity,
      windSpeed: Math.round(closestForecast.wind.speed),
      icon: closestForecast.weather[0].icon,
      date: new Date(closestForecast.dt * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Weather API Error:', error.message);

    // Return mock data if API fails
    return {
      condition: 'Clear',
      description: 'Weather data temporarily unavailable',
      temperature: 75,
      feelsLike: 75,
      humidity: 50,
      windSpeed: 5,
      icon: '01d',
      date: new Date(date).toISOString(),
      error: 'Using mock data - API unavailable',
    };
  }
};

/**
 * Get current weather for a location
 * @param {string} zipCode - US zip code
 * @returns {Promise} Current weather data
 */
const getCurrentWeather = async (zipCode) => {
  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        zip: `${zipCode},US`,
        appid: OPENWEATHER_API_KEY,
        units: 'imperial',
      }
    });

    const data = response.data;

    return {
      condition: data.weather[0].main,
      description: data.weather[0].description,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      icon: data.weather[0].icon,
      city: data.name,
    };
  } catch (error) {
    console.error('Weather API Error:', error.message);

    // Return mock data if API fails
    return {
      condition: 'Clear',
      description: 'Weather data temporarily unavailable',
      temperature: 75,
      feelsLike: 75,
      humidity: 50,
      windSpeed: 5,
      icon: '01d',
      city: 'Unknown',
      error: 'Using mock data - API unavailable',
    };
  }
};

module.exports = {
  getWeatherForecast,
  getCurrentWeather,
};
