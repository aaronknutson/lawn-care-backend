const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getReferralCode,
  getReferralStats,
} = require('../controllers/referral.controller');

// All routes require authentication
router.use(authenticate);

router.get('/code', getReferralCode);
router.get('/stats', getReferralStats);

module.exports = router;
