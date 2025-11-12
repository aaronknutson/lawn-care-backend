const express = require('express');
const router = express.Router();
const { getForecast, getCurrent } = require('../controllers/weather.controller');

// Weather routes are public - no authentication required
// This allows the frontend to display weather data on admin dashboards
// Weather data is publicly available information

// Routes
router.get('/forecast/:date/:zipCode', getForecast);
router.get('/current/:zipCode', getCurrent);

module.exports = router;
