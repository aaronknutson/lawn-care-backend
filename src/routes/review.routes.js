const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/review.controller');

// Validation middleware for creating reviews
const createReviewValidation = [
  body('appointmentId')
    .notEmpty()
    .withMessage('Appointment ID is required')
    .isUUID()
    .withMessage('Appointment ID must be a valid UUID'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isString()
    .withMessage('Comment must be a string')
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters'),
];

// Validation middleware for updating reviews (admin only)
const updateReviewValidation = [
  body('isApproved')
    .optional()
    .isBoolean()
    .withMessage('isApproved must be a boolean'),
  body('adminResponse')
    .optional()
    .isString()
    .withMessage('Admin response must be a string')
    .isLength({ max: 500 })
    .withMessage('Admin response must be less than 500 characters'),
];

// Public routes
router.get('/', getAllReviews);
router.get('/:id', getReviewById);

// Protected routes (authentication required)
router.post('/', authenticate, createReviewValidation, createReview);
router.put('/:id', authenticate, updateReviewValidation, updateReview);
router.delete('/:id', authenticate, deleteReview);

module.exports = router;
