const Quote = require('../models/Quote');
const User = require('../models/User');
const { Op } = require('sequelize');

/**
 * Submit a quote request
 * @route POST /api/quotes
 * @access Public
 */
const submitQuote = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      lotSize,
      serviceType,
      description,
      preferredDate,
    } = req.body;

    const userId = req.user?.userId || null;

    const quote = await Quote.create({
      userId,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      lotSize,
      serviceType,
      description,
      preferredDate,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      data: quote,
    });
  } catch (error) {
    console.error('Error submitting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quote request',
      error: error.message,
    });
  }
};

/**
 * Get all quotes (admin only)
 * @route GET /api/admin/quotes
 * @access Private (Admin)
 */
const getAllQuotes = async (req, res) => {
  try {
    const { status = 'all', limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status !== 'all') {
      whereClause.status = status;
    }

    const quotes = await Quote.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        quotes: quotes.rows,
        pagination: {
          total: quotes.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(quotes.count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotes',
      error: error.message,
    });
  }
};

/**
 * Respond to quote request (admin only)
 * @route PUT /api/admin/quotes/:id
 * @access Private (Admin)
 */
const respondToQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedPrice, adminNotes, status } = req.body;
    const respondedById = req.user.userId;

    const quote = await Quote.findByPk(id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    // Update quote
    if (estimatedPrice !== undefined) quote.estimatedPrice = estimatedPrice;
    if (adminNotes !== undefined) quote.adminNotes = adminNotes;
    if (status !== undefined) quote.status = status;

    if (estimatedPrice) {
      quote.quotedAt = new Date();
      quote.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      quote.respondedById = respondedById;
    }

    await quote.save();

    res.json({
      success: true,
      message: 'Quote updated successfully',
      data: quote,
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quote',
      error: error.message,
    });
  }
};

module.exports = {
  submitQuote,
  getAllQuotes,
  respondToQuote,
};
