const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Property = require('../models/Property');
const ServicePackage = require('../models/ServicePackage');
const AppointmentService = require('../models/AppointmentService');
const Service = require('../models/Service');
const { validationResult } = require('express-validator');
const { format } = require('date-fns');
const { generateInvoicePDF } = require('../services/invoiceService');

// @desc    Create Stripe payment intent
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { appointmentId } = req.body;
    const userId = req.user.id;

    // Find the appointment
    const appointment = await Appointment.findOne({
      where: { id: appointmentId, userId },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      where: { appointmentId, status: ['completed', 'pending'] },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this appointment',
      });
    }

    // Convert amount to cents for Stripe
    const amount = Math.round(parseFloat(appointment.totalPrice) * 100);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        appointmentId: appointment.id,
        userId: userId,
      },
      description: `Lawn care service - Appointment ${appointment.id}`,
    });

    // Create payment record
    const payment = await Payment.create({
      userId,
      appointmentId,
      amount: appointment.totalPrice,
      status: 'pending',
      paymentMethod: 'credit_card',
      stripePaymentIntentId: paymentIntent.id,
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
        amount: appointment.totalPrice,
      },
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message,
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
const confirmPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found',
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      where: {
        stripePaymentIntentId: paymentIntentId,
        userId,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    if (paymentIntent.status === 'succeeded') {
      // Update payment record
      const updateData = {
        status: 'completed',
        paidAt: new Date(),
      };

      // Extract payment method details if available
      if (paymentIntent.charges && paymentIntent.charges.data.length > 0) {
        const charge = paymentIntent.charges.data[0];
        updateData.stripeChargeId = charge.id;

        if (charge.payment_method_details && charge.payment_method_details.card) {
          updateData.last4 = charge.payment_method_details.card.last4;
          updateData.cardBrand = charge.payment_method_details.card.brand;
        }
      }

      // Generate invoice number
      const invoiceNumber = `INV-${format(new Date(), 'yyyyMMdd')}-${payment.id.substring(0, 8).toUpperCase()}`;
      updateData.invoiceNumber = invoiceNumber;

      await payment.update(updateData);

      // Update appointment status if needed
      if (payment.appointmentId) {
        const appointment = await Appointment.findByPk(payment.appointmentId);
        if (appointment && appointment.status === 'scheduled') {
          // Don't change status, just log that payment is received
          console.log(`Payment received for appointment ${appointment.id}`);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: payment,
      });
    } else if (paymentIntent.status === 'processing') {
      res.status(200).json({
        success: true,
        message: 'Payment is processing',
        data: payment,
      });
    } else {
      // Payment failed
      await payment.update({ status: 'failed' });

      res.status(400).json({
        success: false,
        message: 'Payment failed',
        data: payment,
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message,
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const payment = await Payment.findOne({
      where: whereClause,
      include: [
        {
          model: Appointment,
          as: 'appointment',
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      error: error.message,
    });
  }
};

// @desc    Get all payments for user
// @route   GET /api/payments
// @access  Private
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, limit = 50, offset = 0 } = req.query;

    const whereClause = userRole === 'admin' ? {} : { userId };

    if (status) {
      whereClause.status = status;
    }

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Appointment,
          as: 'appointment',
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: payments.count,
      data: payments.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: payments.count,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
    });
  }
};

// @desc    Download invoice PDF
// @route   GET /api/payments/:id/invoice
// @access  Private
const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    // Find payment with all necessary relations
    const payment = await Payment.findOne({
      where: whereClause,
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: ServicePackage, as: 'servicePackage' },
            { model: Property, as: 'property' },
            {
              model: AppointmentService,
              as: 'appointmentServices',
              include: [{ model: Service, as: 'service' }],
            },
          ],
        },
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Invoice can only be downloaded for completed payments',
      });
    }

    // Generate PDF
    const doc = generateInvoicePDF(
      payment,
      payment.appointment,
      payment.user,
      payment.appointment?.property
    );

    // Set response headers
    const filename = `invoice-${payment.invoiceNumber || payment.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe the PDF to the response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download invoice',
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentById,
  getUserPayments,
  downloadInvoice,
};
