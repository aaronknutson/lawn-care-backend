const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  getServicePackages,
  getAddOnServices,
  calculatePrice,
  quickQuote,
} = require('../controllers/service.controller');

// Validation error handler middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
  }
  next();
};

// Validation middleware for calculate-price endpoint
const calculatePriceValidation = [
  body('packageId')
    .notEmpty()
    .withMessage('Package ID is required')
    .isUUID()
    .withMessage('Package ID must be a valid UUID'),
  body('lotSize')
    .notEmpty()
    .withMessage('Lot size is required')
    .isInt({ min: 1 })
    .withMessage('Lot size must be a positive integer'),
  body('addOnIds')
    .optional()
    .isArray()
    .withMessage('Add-on IDs must be an array'),
  body('addOnIds.*')
    .optional()
    .isUUID()
    .withMessage('Each add-on ID must be a valid UUID'),
];

// Validation middleware for quick-quote endpoint
const quickQuoteValidation = [
  body('lotSize')
    .notEmpty()
    .withMessage('Lot size is required')
    .isInt({ min: 1 })
    .withMessage('Lot size must be a positive integer'),
  body('packageName')
    .optional()
    .isString()
    .withMessage('Package name must be a string'),
];

// Public routes
router.get('/packages', getServicePackages);
router.get('/add-ons', getAddOnServices);
router.post('/calculate-price', calculatePriceValidation, validate, calculatePrice);
router.post('/quick-quote', quickQuoteValidation, validate, quickQuote);

module.exports = router;
