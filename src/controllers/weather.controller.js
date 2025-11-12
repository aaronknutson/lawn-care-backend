const { getWeatherForecast, getCurrentWeather } = require('../services/weatherService');

// @desc    Get weather forecast for a specific date and location
// @route   GET /api/weather/forecast/:date/:zipCode
// @access  Private (Admin)
const getForecast = async (req, res) => {
  try {
    const { date, zipCode } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Validate zip code
    if (!/^\d{5}$/.test(zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid zip code. Use 5-digit US zip code',
      });
    }

    const weatherData = await getWeatherForecast(date, zipCode);

    res.status(200).json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather forecast',
      error: error.message,
    });
  }
};

// @desc    Get current weather for a location
// @route   GET /api/weather/current/:zipCode
// @access  Private (Admin)
const getCurrent = async (req, res) => {
  try {
    const { zipCode } = req.params;

    // Validate zip code
    if (!/^\d{5}$/.test(zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid zip code. Use 5-digit US zip code',
      });
    }

    const weatherData = await getCurrentWeather(zipCode);

    res.status(200).json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current weather',
      error: error.message,
    });
  }
};

module.exports = {
  getForecast,
  getCurrent,
};
