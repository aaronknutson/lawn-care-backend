const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  archiveCustomer,
  getCustomerProfile,
  addCustomerNote,
  exportCustomers,
} = require('../controllers/admin.customer.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const { body } = require('express-validator');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @route   GET /api/admin/customers
 * @desc    Get all customers with search, filter, sort, and pagination
 * @access  Private (Admin)
 */
router.get('/', getAllCustomers);

/**
 * @route   GET /api/admin/customers/export
 * @desc    Export customers to CSV
 * @access  Private (Admin)
 * @note    This route must come before /:id routes
 */
router.get('/export', exportCustomers);

/**
 * @route   POST /api/admin/customers
 * @desc    Create new customer
 * @access  Private (Admin)
 */
router.post(
  '/',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  createCustomer
);

/**
 * @route   GET /api/admin/customers/:id/profile
 * @desc    Get detailed customer profile
 * @access  Private (Admin)
 */
router.get('/:id/profile', getCustomerProfile);

/**
 * @route   POST /api/admin/customers/:id/notes
 * @desc    Add communication note to customer
 * @access  Private (Admin)
 */
router.post(
  '/:id/notes',
  [body('note').trim().notEmpty().withMessage('Note is required')],
  addCustomerNote
);

/**
 * @route   PUT /api/admin/customers/:id
 * @desc    Update customer
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('status')
      .optional()
      .isIn(['active', 'paused', 'archived'])
      .withMessage('Invalid status'),
  ],
  updateCustomer
);

/**
 * @route   DELETE /api/admin/customers/:id
 * @desc    Archive/deactivate customer
 * @access  Private (Admin)
 */
router.delete('/:id', archiveCustomer);

module.exports = router;
