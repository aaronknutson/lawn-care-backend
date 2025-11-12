const { Op } = require('sequelize');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Property = require('../models/Property');
const ServicePackage = require('../models/ServicePackage');
const { sequelize } = require('../models');
const { Parser } = require('json2csv');

/**
 * Get all customers with search, filter, sort, and pagination
 * @route GET /api/admin/customers
 * @access Private (admin only)
 */
const getAllCustomers = async (req, res) => {
  try {
    const {
      search = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      limit = 10,
      page = 1,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause for search
    const whereClause = {
      role: 'customer', // Only get customers, not admins
    };

    // Search across multiple fields
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Filter by status
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Get customers with related data
    const customers = await User.findAndCountAll({
      where: whereClause,
      attributes: {
        exclude: ['password'],
        include: [
          // Count of appointments
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM appointments
              WHERE appointments.user_id = "User".id
            )`),
            'appointmentCount',
          ],
          // Total lifetime value (sum of all payments)
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(amount), 0)
              FROM payments
              WHERE payments.user_id = "User".id
              AND payments.status = 'completed'
            )`),
            'lifetimeValue',
          ],
          // Next appointment date
          [
            sequelize.literal(`(
              SELECT scheduled_date
              FROM appointments
              WHERE appointments.user_id = "User".id
              AND appointments.status = 'scheduled'
              ORDER BY scheduled_date ASC
              LIMIT 1
            )`),
            'nextAppointment',
          ],
        ],
      },
      include: [
        {
          model: Property,
          as: 'properties',
          attributes: ['id', 'address', 'city', 'state', 'zipCode', 'lotSize'],
          limit: 1,
        },
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        customers: customers.rows,
        pagination: {
          total: customers.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(customers.count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message,
    });
  }
};

/**
 * Create new customer (admin)
 * @route POST /api/admin/customers
 * @access Private (admin only)
 */
const createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create customer
    const customer = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password, // Will be hashed by model hook
      role: 'customer',
      status: 'active',
    });

    // Return without password
    const customerData = customer.toJSON();
    delete customerData.password;

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customerData,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message,
    });
  }
};

/**
 * Update customer (admin)
 * @route PUT /api/admin/customers/:id
 * @access Private (admin only)
 */
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, status } = req.body;

    const customer = await User.findOne({
      where: { id, role: 'customer' },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Check if email is taken by another user
    if (email && email !== customer.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    // Update fields
    if (firstName) customer.firstName = firstName;
    if (lastName) customer.lastName = lastName;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (status) customer.status = status;

    await customer.save();

    // Return without password
    const customerData = customer.toJSON();
    delete customerData.password;

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customerData,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message,
    });
  }
};

/**
 * Archive/deactivate customer
 * @route DELETE /api/admin/customers/:id
 * @access Private (admin only)
 */
const archiveCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findOne({
      where: { id, role: 'customer' },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Set status to archived instead of deleting
    customer.status = 'archived';
    await customer.save();

    // Cancel all scheduled appointments
    await Appointment.update(
      { status: 'cancelled' },
      {
        where: {
          userId: id,
          status: 'scheduled',
        },
      }
    );

    res.json({
      success: true,
      message: 'Customer archived successfully',
    });
  } catch (error) {
    console.error('Error archiving customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive customer',
      error: error.message,
    });
  }
};

/**
 * Get detailed customer profile
 * @route GET /api/admin/customers/:id/profile
 * @access Private (admin only)
 */
const getCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findOne({
      where: { id, role: 'customer' },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Property,
          as: 'properties',
          attributes: ['id', 'address', 'city', 'state', 'zipCode', 'lotSize', 'hasBackyard', 'hasDogs', 'gateCode', 'isPrimary'],
        },
        {
          model: Appointment,
          as: 'appointments',
          attributes: ['id', 'scheduledDate', 'scheduledTime', 'status', 'totalPrice', 'frequency'],
          include: [
            {
              model: ServicePackage,
              as: 'servicePackage',
              attributes: ['name'],
            },
            {
              model: Property,
              as: 'property',
              attributes: ['address', 'city', 'state'],
            },
          ],
          order: [['scheduledDate', 'DESC']],
          limit: 10,
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'status', 'paymentMethod', 'paidAt', 'createdAt'],
          include: [
            {
              model: Appointment,
              as: 'appointment',
              attributes: ['scheduledDate'],
            },
          ],
          order: [['createdAt', 'DESC']],
          limit: 10,
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Calculate statistics
    const stats = {
      totalAppointments: await Appointment.count({ where: { userId: id } }),
      completedAppointments: await Appointment.count({ where: { userId: id, status: 'completed' } }),
      totalSpent: await Payment.sum('amount', { where: { userId: id, status: 'completed' } }) || 0,
      averageOrderValue: 0,
    };

    if (stats.completedAppointments > 0) {
      stats.averageOrderValue = stats.totalSpent / stats.completedAppointments;
    }

    res.json({
      success: true,
      data: {
        customer,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer profile',
      error: error.message,
    });
  }
};

/**
 * Add communication note to customer
 * @route POST /api/admin/customers/:id/notes
 * @access Private (admin only)
 */
const addCustomerNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user.userId;

    const customer = await User.findOne({
      where: { id, role: 'customer' },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Get existing notes or initialize empty array
    const notes = customer.notes || [];

    // Add new note
    const newNote = {
      id: Date.now().toString(),
      note,
      addedBy: adminId,
      addedAt: new Date().toISOString(),
    };

    notes.push(newNote);

    // Update customer with new notes
    customer.notes = notes;
    await customer.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: newNote,
    });
  } catch (error) {
    console.error('Error adding customer note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message,
    });
  }
};

/**
 * Export customers to CSV
 * @route GET /api/admin/customers/export
 * @access Private (admin only)
 */
const exportCustomers = async (req, res) => {
  try {
    const customers = await User.findAll({
      where: { role: 'customer' },
      attributes: {
        exclude: ['password'],
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM appointments
              WHERE appointments.user_id = "User".id
            )`),
            'appointmentCount',
          ],
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(amount), 0)
              FROM payments
              WHERE payments.user_id = "User".id
              AND payments.status = 'completed'
            )`),
            'lifetimeValue',
          ],
        ],
      },
      include: [
        {
          model: Property,
          as: 'properties',
          attributes: ['address', 'city', 'state', 'zipCode'],
          where: { isPrimary: true },
          required: false,
        },
      ],
      raw: false,
    });

    // Format data for CSV
    const csvData = customers.map((customer) => {
      const customerData = customer.toJSON();
      const primaryProperty = customerData.properties && customerData.properties[0];

      return {
        ID: customerData.id,
        'First Name': customerData.firstName,
        'Last Name': customerData.lastName,
        Email: customerData.email,
        Phone: customerData.phone,
        Status: customerData.status,
        'Primary Address': primaryProperty ? `${primaryProperty.address}, ${primaryProperty.city}, ${primaryProperty.state} ${primaryProperty.zipCode}` : '',
        'Total Appointments': customerData.appointmentCount || 0,
        'Lifetime Value': `$${(customerData.lifetimeValue || 0).toFixed(2)}`,
        'Created At': new Date(customerData.createdAt).toLocaleDateString(),
      };
    });

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers-${Date.now()}.csv`);

    res.send(csv);
  } catch (error) {
    console.error('Error exporting customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export customers',
      error: error.message,
    });
  }
};

module.exports = {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  archiveCustomer,
  getCustomerProfile,
  addCustomerNote,
  exportCustomers,
};
