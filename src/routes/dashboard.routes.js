const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const {
  getOverviewStats,
  getRevenueAnalytics,
  getTodaysAppointments,
  getCustomerMetrics,
} = require('../controllers/dashboard.controller');

// All dashboard routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard statistics routes
router.get('/stats', getOverviewStats);
router.get('/revenue', getRevenueAnalytics);
router.get('/appointments-today', getTodaysAppointments);
router.get('/customer-metrics', getCustomerMetrics);

module.exports = router;
