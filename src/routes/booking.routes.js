const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const { uploadAppointmentPhotos: uploadMiddleware } = require('../middleware/upload.middleware');
const {
  createBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
  getAllBookings,
  rescheduleAppointment,
  completeAppointment,
  uploadAppointmentPhotos,
} = require('../controllers/booking.controller');

// Validation middleware
const createBookingValidation = [
  body('propertyId')
    .notEmpty()
    .withMessage('Property ID is required')
    .isUUID()
    .withMessage('Property ID must be a valid UUID'),
  body('servicePackageId')
    .notEmpty()
    .withMessage('Service package ID is required')
    .isUUID()
    .withMessage('Service package ID must be a valid UUID'),
  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),
  body('scheduledTime')
    .optional()
    .isString()
    .withMessage('Scheduled time must be a string'),
  body('frequency')
    .optional()
    .isIn(['one-time', 'weekly', 'bi-weekly', 'monthly'])
    .withMessage('Frequency must be one of: one-time, weekly, bi-weekly, monthly'),
  body('addOnServiceIds')
    .optional()
    .isArray()
    .withMessage('Add-on service IDs must be an array'),
  body('addOnServiceIds.*')
    .optional()
    .isUUID()
    .withMessage('Each add-on service ID must be a valid UUID'),
  body('specialInstructions')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Special instructions must be a string'),
];

const updateBookingValidation = [
  param('id')
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),
  body('scheduledTime')
    .optional()
    .isString()
    .withMessage('Scheduled time must be a string'),
  body('specialInstructions')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Special instructions must be a string'),
  body('crewMemberId')
    .optional()
    .isUUID()
    .withMessage('Crew member ID must be a valid UUID'),
  body('status')
    .optional()
    .isIn(['scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Status must be valid'),
];

const cancelBookingValidation = [
  param('id')
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
  body('cancellationReason')
    .optional()
    .isString()
    .withMessage('Cancellation reason must be a string'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.post('/', createBookingValidation, createBooking);
router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.put('/:id', updateBookingValidation, updateBooking);
router.delete('/:id', cancelBookingValidation, cancelBooking);

// Admin-only appointment management routes
router.patch('/:id/reschedule', adminMiddleware, rescheduleAppointment);
router.patch('/:id/complete', adminMiddleware, completeAppointment);
router.post('/:id/photos', adminMiddleware, uploadMiddleware, uploadAppointmentPhotos);

module.exports = router;
