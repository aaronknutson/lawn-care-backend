const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentById,
  getUserPayments,
  downloadInvoice,
} = require('../controllers/payment.controller');

// Validation middleware
const createPaymentIntentValidation = [
  body('appointmentId')
    .notEmpty()
    .withMessage('Appointment ID is required')
    .isUUID()
    .withMessage('Appointment ID must be a valid UUID'),
];

const confirmPaymentValidation = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required')
    .isString()
    .withMessage('Payment intent ID must be a string'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.post('/create-intent', createPaymentIntentValidation, createPaymentIntent);
router.post('/confirm', confirmPaymentValidation, confirmPayment);
router.get('/', getUserPayments);
router.get('/:id/invoice', downloadInvoice);
router.get('/:id', getPaymentById);

module.exports = router;
