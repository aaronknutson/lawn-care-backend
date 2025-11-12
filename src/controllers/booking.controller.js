const Appointment = require('../models/Appointment');
const Property = require('../models/Property');
const ServicePackage = require('../models/ServicePackage');
const Service = require('../models/Service');
const AppointmentService = require('../models/AppointmentService');
const User = require('../models/User');
const CrewMember = require('../models/CrewMember');
const { validationResult } = require('express-validator');
const { sendBookingConfirmation } = require('../services/emailService');

// @desc    Create a new booking/appointment
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      propertyId,
      servicePackageId,
      scheduledDate,
      scheduledTime,
      frequency,
      addOnServiceIds,
      specialInstructions,
    } = req.body;

    const userId = req.user.id;

    // Verify property belongs to user
    const property = await Property.findOne({
      where: { id: propertyId, userId },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or does not belong to you',
      });
    }

    // Verify service package exists
    const servicePackage = await ServicePackage.findByPk(servicePackageId);
    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found',
      });
    }

    // Calculate package price based on lot size
    let multiplier = 1.0;
    if (property.lotSize < 5000) multiplier = servicePackage.pricingTiers.small || 1.0;
    else if (property.lotSize < 10000) multiplier = servicePackage.pricingTiers.medium || 1.2;
    else if (property.lotSize < 15000) multiplier = servicePackage.pricingTiers.large || 1.5;
    else multiplier = servicePackage.pricingTiers.xlarge || 2.0;

    let totalPrice = parseFloat(servicePackage.basePrice) * multiplier;

    // Create appointment
    const appointment = await Appointment.create({
      userId,
      propertyId,
      servicePackageId,
      scheduledDate,
      scheduledTime: scheduledTime || '09:00 AM',
      frequency: frequency || 'one-time',
      totalPrice,
      specialInstructions,
      status: 'scheduled',
    });

    // Add add-on services if provided
    if (addOnServiceIds && addOnServiceIds.length > 0) {
      const addOnServices = await Service.findAll({
        where: { id: addOnServiceIds, isActive: true },
      });

      for (const service of addOnServices) {
        await AppointmentService.create({
          appointmentId: appointment.id,
          serviceId: service.id,
          price: service.price,
          quantity: 1,
        });

        totalPrice += parseFloat(service.price);
      }

      // Update total price with add-ons
      await appointment.update({ totalPrice });
    }

    // Fetch complete appointment with relations
    const completeBooking = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Property, as: 'property' },
        { model: ServicePackage, as: 'servicePackage' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
    });

    // Send booking confirmation email
    await sendBookingConfirmation(
      completeBooking,
      completeBooking.user,
      completeBooking.property,
      completeBooking.servicePackage
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: completeBooking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const booking = await Appointment.findOne({
      where: whereClause,
      include: [
        { model: Property, as: 'property' },
        { model: ServicePackage, as: 'servicePackage' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: CrewMember, as: 'crewMember' },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message,
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const booking = await Appointment.findOne({ where: whereClause });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Only allow updates if booking is not completed or cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${booking.status} booking`,
      });
    }

    const {
      scheduledDate,
      scheduledTime,
      specialInstructions,
      crewMemberId,
      status,
    } = req.body;

    const updates = {};
    if (scheduledDate) updates.scheduledDate = scheduledDate;
    if (scheduledTime) updates.scheduledTime = scheduledTime;
    if (specialInstructions !== undefined) updates.specialInstructions = specialInstructions;
    if (crewMemberId !== undefined) updates.crewMemberId = crewMemberId;
    if (status && userRole === 'admin') updates.status = status;

    await booking.update(updates);

    const updatedBooking = await Appointment.findByPk(booking.id, {
      include: [
        { model: Property, as: 'property' },
        { model: ServicePackage, as: 'servicePackage' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: CrewMember, as: 'crewMember' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message,
    });
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { cancellationReason } = req.body;

    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const booking = await Appointment.findOne({ where: whereClause });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    await booking.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: cancellationReason || 'No reason provided',
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};

// @desc    Get all bookings with filters
// @route   GET /api/bookings
// @access  Private
const getAllBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, startDate, endDate, limit = 50, offset = 0 } = req.query;

    const whereClause = userRole === 'admin' ? {} : { userId };

    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.scheduledDate = {};
      if (startDate) whereClause.scheduledDate.$gte = new Date(startDate);
      if (endDate) whereClause.scheduledDate.$lte = new Date(endDate);
    }

    const bookings = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        { model: Property, as: 'property' },
        { model: ServicePackage, as: 'servicePackage' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: CrewMember, as: 'crewMember' },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['scheduledDate', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: bookings.count,
      data: bookings.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: bookings.count,
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};

// @desc    Reschedule appointment (for calendar drag-drop)
// @route   PATCH /api/appointments/:id/reschedule
// @access  Private (Admin)
const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime } = req.body;

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date and time are required',
      });
    }

    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Don't allow rescheduling completed or cancelled appointments
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule ${appointment.status} appointment`,
      });
    }

    await appointment.update({
      scheduledDate,
      scheduledTime,
    });

    const updatedAppointment = await Appointment.findByPk(id, {
      include: [
        { model: Property, as: 'property' },
        { model: ServicePackage, as: 'servicePackage' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: CrewMember, as: 'crewMember' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment',
      error: error.message,
    });
  }
};

// @desc    Complete appointment with details
// @route   PATCH /api/appointments/:id/complete
// @access  Private (Admin)
const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { completionNotes, actualDuration, weatherCondition } = req.body;

    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already completed',
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete cancelled appointment',
      });
    }

    await appointment.update({
      status: 'completed',
      completedAt: new Date(),
      completionNotes,
      actualDuration,
      weatherCondition,
    });

    const updatedAppointment = await Appointment.findByPk(id, {
      include: [
        { model: Property, as: 'property' },
        { model: ServicePackage, as: 'servicePackage' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: CrewMember, as: 'crewMember' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Appointment completed successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete appointment',
      error: error.message,
    });
  }
};

// @desc    Upload before/after photos for appointment
// @route   POST /api/appointments/:id/photos
// @access  Private (Admin)
const uploadAppointmentPhotos = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Files will be uploaded via multer middleware
    const photos = {
      beforePhotos: [],
      afterPhotos: [],
    };

    if (req.files) {
      if (req.files.beforePhotos) {
        photos.beforePhotos = req.files.beforePhotos.map(file => `/uploads/appointments/${file.filename}`);
      }
      if (req.files.afterPhotos) {
        photos.afterPhotos = req.files.afterPhotos.map(file => `/uploads/appointments/${file.filename}`);
      }
    }

    // Merge with existing photos if any
    const existingPhotos = appointment.photos || { beforePhotos: [], afterPhotos: [] };
    const updatedPhotos = {
      beforePhotos: [...(existingPhotos.beforePhotos || []), ...photos.beforePhotos],
      afterPhotos: [...(existingPhotos.afterPhotos || []), ...photos.afterPhotos],
    };

    await appointment.update({ photos: updatedPhotos });

    const updatedAppointment = await Appointment.findByPk(id, {
      include: [
        { model: Property, as: 'property' },
        { model: ServicePackage, as: 'servicePackage' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Photos uploaded successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photos',
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
  getAllBookings,
  rescheduleAppointment,
  completeAppointment,
  uploadAppointmentPhotos,
};
