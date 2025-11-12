const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerAppointments,
  getCustomerPayments,
  pauseService,
  resumeService,
  updatePassword,
  updateProfilePhoto,
} = require('../controllers/customer.controller');

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Validation for profile update
const updateProfileValidation = [
  body('firstName')
    .optional()
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^\(\d{3}\) \d{3}-\d{4}$/)
    .withMessage('Phone must be in format (555) 555-5555'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address'),
];

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', getCustomerProfile);
router.put('/profile', updateProfileValidation, updateCustomerProfile);

// Password update
router.put('/password', updatePassword);

// Profile photo upload
router.put('/profile-photo', upload.single('photo'), updateProfilePhoto);

// Appointments and payments
router.get('/appointments', getCustomerAppointments);
router.get('/payments', getCustomerPayments);

// Service management
router.patch('/pause-service', pauseService);
router.patch('/resume-service', resumeService);

module.exports = router;
