const { Review, User, Appointment, ServicePackage } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all reviews (public endpoint)
 * @route GET /api/reviews
 * @query approved - Filter by approval status (true/false)
 * @query limit - Limit number of results
 * @query offset - Offset for pagination
 */
const getAllReviews = async (req, res) => {
  try {
    const { approved, limit = 20, offset = 0 } = req.query;

    const whereClause = {};

    // Filter by approval status (for public testimonials)
    if (approved !== undefined) {
      whereClause.isApproved = approved === 'true';
    }

    const reviews = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email'],
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'scheduledDate', 'status'],
          include: [
            {
              model: ServicePackage,
              as: 'servicePackage',
              attributes: ['name', 'description'],
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
      message: 'Reviews fetched successfully',
      data: {
        reviews: reviews.rows,
        total: reviews.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

/**
 * Get review by ID
 * @route GET /api/reviews/:id
 */
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email'],
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'scheduledDate', 'status'],
          include: [
            {
              model: ServicePackage,
              as: 'servicePackage',
              attributes: ['name', 'description'],
            },
          ],
        },
      ],
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.json({
      success: true,
      message: 'Review fetched successfully',
      data: review,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: error.message,
    });
  }
};

/**
 * Create a new review (customer only)
 * @route POST /api/reviews
 * @body appointmentId - Appointment ID
 * @body rating - Rating (1-5)
 * @body comment - Review comment
 */
const createReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    const userId = req.user.userId;

    // Validate appointment exists and belongs to user
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        userId,
        status: 'completed', // Only completed appointments can be reviewed
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not eligible for review',
      });
    }

    // Check if review already exists for this appointment
    const existingReview = await Review.findOne({
      where: { appointmentId },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this appointment',
      });
    }

    // Create review
    const review = await Review.create({
      userId,
      appointmentId,
      rating: parseInt(rating),
      comment,
      isApproved: false, // Requires admin approval
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully (pending approval)',
      data: review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message,
    });
  }
};

/**
 * Update review (admin only - for approval)
 * @route PUT /api/reviews/:id
 */
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, adminResponse } = req.body;

    // Only admins can approve/reject reviews
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can approve reviews',
      });
    }

    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Update review
    await review.update({
      isApproved: isApproved !== undefined ? isApproved : review.isApproved,
      adminResponse: adminResponse || review.adminResponse,
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

/**
 * Delete review (admin only)
 * @route DELETE /api/reviews/:id
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admins can delete reviews
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete reviews',
      });
    }

    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    await review.destroy();

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
