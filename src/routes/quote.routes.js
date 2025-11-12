const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { submitQuote, getAllQuotes, respondToQuote } = require('../controllers/quote.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

/**
 * @route   POST /api/quotes
 * @desc    Submit quote request (public or authenticated)
 * @access  Public
 */
router.post(
  '/',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('zipCode').trim().notEmpty().withMessage('Zip code is required'),
    body('serviceType').trim().notEmpty().withMessage('Service type is required'),
  ],
  submitQuote
);

/**
 * @route   GET /api/admin/quotes
 * @desc    Get all quotes
 * @access  Private (Admin)
 */
router.get('/admin', authMiddleware, adminMiddleware, getAllQuotes);

/**
 * @route   PUT /api/admin/quotes/:id
 * @desc    Respond to quote request
 * @access  Private (Admin)
 */
router.put('/:id/admin', authMiddleware, adminMiddleware, respondToQuote);

module.exports = router;
