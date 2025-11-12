const Property = require('../models/Property');
const { validationResult } = require('express-validator');

// @desc    Create a new property
// @route   POST /api/properties
// @access  Private
const createProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const {
      address,
      city,
      state,
      zipCode,
      lotSize,
      specialInstructions,
      gateCode,
      hasBackyard,
      hasDogs,
      isPrimary,
    } = req.body;

    // If this is set as primary, unset other primary properties
    if (isPrimary) {
      await Property.update(
        { isPrimary: false },
        { where: { userId } }
      );
    }

    const property = await Property.create({
      userId,
      address,
      city,
      state,
      zipCode,
      lotSize,
      specialInstructions,
      gateCode,
      hasBackyard: hasBackyard || false,
      hasDogs: hasDogs || false,
      isPrimary: isPrimary !== undefined ? isPrimary : true,
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property,
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error.message,
    });
  }
};

// @desc    Get all properties for the authenticated user
// @route   GET /api/properties
// @access  Private
const getUserProperties = async (req, res) => {
  try {
    const userId = req.user.id;

    const properties = await Property.findAll({
      where: { userId },
      order: [['isPrimary', 'DESC'], ['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message,
    });
  }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Private
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const property = await Property.findOne({ where: whereClause });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property',
      error: error.message,
    });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private
const updateProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const property = await Property.findOne({ where: whereClause });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    const {
      address,
      city,
      state,
      zipCode,
      lotSize,
      specialInstructions,
      gateCode,
      hasBackyard,
      hasDogs,
      isPrimary,
    } = req.body;

    // If this is set as primary, unset other primary properties for this user
    if (isPrimary && !property.isPrimary) {
      await Property.update(
        { isPrimary: false },
        { where: { userId: property.userId } }
      );
    }

    const updates = {};
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (zipCode !== undefined) updates.zipCode = zipCode;
    if (lotSize !== undefined) updates.lotSize = lotSize;
    if (specialInstructions !== undefined) updates.specialInstructions = specialInstructions;
    if (gateCode !== undefined) updates.gateCode = gateCode;
    if (hasBackyard !== undefined) updates.hasBackyard = hasBackyard;
    if (hasDogs !== undefined) updates.hasDogs = hasDogs;
    if (isPrimary !== undefined) updates.isPrimary = isPrimary;

    await property.update(updates);

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: property,
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property',
      error: error.message,
    });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const property = await Property.findOne({ where: whereClause });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Check if property has associated appointments
    const appointmentsCount = await property.countAppointments();

    if (appointmentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete property with existing appointments. Please cancel appointments first.',
      });
    }

    await property.destroy();

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error.message,
    });
  }
};

module.exports = {
  createProperty,
  getUserProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
};
