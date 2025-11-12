const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
  getAllAddOnServices,
  createAddOnService,
  updateAddOnService,
  deleteAddOnService,
  getAllCrewMembers,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember,
} = require('../controllers/admin.service.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// ============= SERVICE PACKAGES =============

/**
 * @route   GET /api/admin/services/packages
 * @desc    Get all service packages (including inactive)
 * @access  Private (Admin)
 */
router.get('/packages', getAllServicePackages);

/**
 * @route   POST /api/admin/services/packages
 * @desc    Create new service package
 * @access  Private (Admin)
 */
router.post(
  '/packages',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('basePrice')
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
    body('features').optional().isArray().withMessage('Features must be an array'),
    body('pricingTiers').optional().isObject().withMessage('Pricing tiers must be an object'),
  ],
  createServicePackage
);

/**
 * @route   PUT /api/admin/services/packages/:id
 * @desc    Update service package
 * @access  Private (Admin)
 */
router.put(
  '/packages/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('basePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
    body('features').optional().isArray().withMessage('Features must be an array'),
    body('pricingTiers').optional().isObject().withMessage('Pricing tiers must be an object'),
  ],
  updateServicePackage
);

/**
 * @route   DELETE /api/admin/services/packages/:id
 * @desc    Delete service package
 * @access  Private (Admin)
 */
router.delete('/packages/:id', deleteServicePackage);

// ============= ADD-ON SERVICES =============

/**
 * @route   GET /api/admin/services/add-ons
 * @desc    Get all add-on services (including inactive)
 * @access  Private (Admin)
 */
router.get('/add-ons', getAllAddOnServices);

/**
 * @route   POST /api/admin/services/add-ons
 * @desc    Create new add-on service
 * @access  Private (Admin)
 */
router.post(
  '/add-ons',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category')
      .optional()
      .isIn(['addon', 'seasonal', 'one-time'])
      .withMessage('Invalid category'),
  ],
  createAddOnService
);

/**
 * @route   PUT /api/admin/services/add-ons/:id
 * @desc    Update add-on service
 * @access  Private (Admin)
 */
router.put(
  '/add-ons/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('category')
      .optional()
      .isIn(['addon', 'seasonal', 'one-time'])
      .withMessage('Invalid category'),
  ],
  updateAddOnService
);

/**
 * @route   DELETE /api/admin/services/add-ons/:id
 * @desc    Delete add-on service
 * @access  Private (Admin)
 */
router.delete('/add-ons/:id', deleteAddOnService);

// ============= CREW MEMBERS =============

/**
 * @route   GET /api/admin/crew
 * @desc    Get all crew members
 * @access  Private (Admin)
 */
router.get('/crew', getAllCrewMembers);

/**
 * @route   POST /api/admin/crew
 * @desc    Create new crew member
 * @access  Private (Admin)
 */
router.post(
  '/crew',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role').optional().trim().notEmpty().withMessage('Role cannot be empty'),
  ],
  createCrewMember
);

/**
 * @route   PUT /api/admin/crew/:id
 * @desc    Update crew member
 * @access  Private (Admin)
 */
router.put(
  '/crew/:id',
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('role').optional().trim().notEmpty().withMessage('Role cannot be empty'),
  ],
  updateCrewMember
);

/**
 * @route   DELETE /api/admin/crew/:id
 * @desc    Delete crew member
 * @access  Private (Admin)
 */
router.delete('/crew/:id', deleteCrewMember);

module.exports = router;
