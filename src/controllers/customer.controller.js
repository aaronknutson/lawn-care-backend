const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Property = require('../models/Property');
const ServicePackage = require('../models/ServicePackage');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get customer profile
 * @route GET /api/customers/profile
 * @access Private (customer)
 */
const getCustomerProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

/**
 * Update customer profile
 * @route PUT /api/customers/profile
 * @access Private (customer)
 */
const updateCustomerProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone, email } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (email) user.email = email;

    await user.save();

    // Return user without password
    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * Get customer appointments
 * @route GET /api/customers/appointments
 * @access Private (customer)
 */
const getCustomerAppointments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, limit = 50, offset = 0 } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const appointments = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'address', 'city', 'state', 'zipCode'],
        },
        {
          model: ServicePackage,
          as: 'servicePackage',
          attributes: ['id', 'name', 'description'],
        },
      ],
      order: [['scheduledDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        appointments: appointments.rows,
        total: appointments.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching customer appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message,
    });
  }
};

/**
 * Get customer payments
 * @route GET /api/customers/payments
 * @access Private (customer)
 */
const getCustomerPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    const payments = await Payment.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'scheduledDate', 'status'],
          include: [
            {
              model: ServicePackage,
              as: 'servicePackage',
              attributes: ['name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        payments: payments.rows,
        total: payments.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
    });
  }
};

/**
 * Pause service (mark all scheduled appointments as paused)
 * @route PATCH /api/customers/pause-service
 * @access Private (customer)
 */
const pauseService = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Update all scheduled appointments to paused
    const updated = await Appointment.update(
      { status: 'paused' },
      {
        where: {
          userId,
          status: 'scheduled',
        },
      }
    );

    res.json({
      success: true,
      message: 'Service paused successfully',
      data: {
        pausedCount: updated[0],
      },
    });
  } catch (error) {
    console.error('Error pausing service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause service',
      error: error.message,
    });
  }
};

/**
 * Resume service (mark all paused appointments as scheduled)
 * @route PATCH /api/customers/resume-service
 * @access Private (customer)
 */
const resumeService = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Update all paused appointments back to scheduled
    const updated = await Appointment.update(
      { status: 'scheduled' },
      {
        where: {
          userId,
          status: 'paused',
        },
      }
    );

    res.json({
      success: true,
      message: 'Service resumed successfully',
      data: {
        resumedCount: updated[0],
      },
    });
  } catch (error) {
    console.error('Error resuming service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume service',
      error: error.message,
    });
  }
};

/**
 * Update customer password
 * @route PUT /api/customers/password
 * @access Private (customer)
 */
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
    });
  }
};

/**
 * Update customer profile photo
 * @route PUT /api/customers/profile-photo
 * @access Private (customer)
 */
const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file uploaded',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Delete old photo if exists
    if (user.profilePhoto) {
      try {
        const oldPhotoPath = path.join(__dirname, '../../', user.profilePhoto);
        await fs.unlink(oldPhotoPath);
      } catch (err) {
        // Ignore if old photo doesn't exist
        console.log('Old photo not found or already deleted');
      }
    }

    // Save new photo path (relative to project root)
    const photoPath = `/uploads/profiles/${req.file.filename}`;
    user.profilePhoto = photoPath;
    await user.save();

    // Return user without password
    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile photo',
      error: error.message,
    });
  }
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerAppointments,
  getCustomerPayments,
  pauseService,
  resumeService,
  updatePassword,
  updateProfilePhoto,
};
