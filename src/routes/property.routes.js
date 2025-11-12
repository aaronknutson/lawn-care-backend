const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const {
  createProperty,
  getUserProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} = require('../controllers/property.controller');

// Validation middleware
const propertyValidation = [
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isString()
    .withMessage('Address must be a string'),
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .withMessage('City must be a string'),
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isString()
    .isLength({ min: 2, max: 2 })
    .withMessage('State must be a 2-letter code'),
  body('zipCode')
    .notEmpty()
    .withMessage('Zip code is required')
    .isString()
    .withMessage('Zip code must be a string'),
  body('lotSize')
    .notEmpty()
    .withMessage('Lot size is required')
    .isInt({ min: 1 })
    .withMessage('Lot size must be a positive integer'),
  body('specialInstructions')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Special instructions must be a string'),
  body('gateCode')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Gate code must be a string'),
  body('hasBackyard')
    .optional({ checkFalsy: false })
    .isBoolean()
    .withMessage('hasBackyard must be a boolean'),
  body('hasDogs')
    .optional({ checkFalsy: false })
    .isBoolean()
    .withMessage('hasDogs must be a boolean'),
  body('isPrimary')
    .optional({ checkFalsy: false })
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
];

const updatePropertyValidation = [
  param('id')
    .isUUID()
    .withMessage('Property ID must be a valid UUID'),
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string'),
  body('city')
    .optional()
    .isString()
    .withMessage('City must be a string'),
  body('state')
    .optional()
    .isString()
    .isLength({ min: 2, max: 2 })
    .withMessage('State must be a 2-letter code'),
  body('zipCode')
    .optional()
    .isString()
    .withMessage('Zip code must be a string'),
  body('lotSize')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Lot size must be a positive integer'),
  body('specialInstructions')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Special instructions must be a string'),
  body('gateCode')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Gate code must be a string'),
  body('hasBackyard')
    .optional({ checkFalsy: false })
    .isBoolean()
    .withMessage('hasBackyard must be a boolean'),
  body('hasDogs')
    .optional({ checkFalsy: false })
    .isBoolean()
    .withMessage('hasDogs must be a boolean'),
  body('isPrimary')
    .optional({ checkFalsy: false })
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.post('/', propertyValidation, createProperty);
router.get('/', getUserProperties);
router.get('/:id', getPropertyById);
router.put('/:id', updatePropertyValidation, updateProperty);
router.delete('/:id', deleteProperty);

module.exports = router;
