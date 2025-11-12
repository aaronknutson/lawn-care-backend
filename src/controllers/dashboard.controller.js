const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../models');
const { Appointment, Payment, User, ServicePackage, Property, Service } = require('../models');

/**
 * GET /api/dashboard/stats
 * Get overview statistics for admin dashboard
 */
const getOverviewStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total active customers
    const totalCustomers = await User.count({
      where: { role: 'customer' },
    });

    // Get today's appointments count
    const todaysAppointments = await Appointment.count({
      where: {
        scheduledDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
        status: {
          [Op.in]: ['scheduled', 'in-progress'],
        },
      },
    });

    // Get total appointments this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyAppointments = await Appointment.count({
      where: {
        scheduledDate: {
          [Op.gte]: startOfMonth,
          [Op.lte]: endOfMonth,
        },
      },
    });

    // Get total revenue (all completed payments)
    const totalRevenueResult = await Payment.sum('amount', {
      where: { status: 'completed' },
    });
    const totalRevenue = totalRevenueResult || 0;

    // Get this month's revenue
    const monthlyRevenueResult = await Payment.sum('amount', {
      where: {
        status: 'completed',
        paidAt: {
          [Op.gte]: startOfMonth,
          [Op.lte]: endOfMonth,
        },
      },
    });
    const monthlyRevenue = monthlyRevenueResult || 0;

    // Get today's revenue
    const todayRevenueResult = await Payment.sum('amount', {
      where: {
        status: 'completed',
        paidAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });
    const todayRevenue = todayRevenueResult || 0;

    // Get pending payments count
    const pendingPayments = await Payment.count({
      where: { status: 'pending' },
    });

    res.json({
      success: true,
      data: {
        totalCustomers,
        todaysAppointments,
        monthlyAppointments,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        pendingPayments,
      },
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview statistics',
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/revenue
 * Get detailed revenue analytics
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate MRR (Monthly Recurring Revenue)
    // Get all recurring appointments (not one-time)
    const recurringAppointments = await Appointment.findAll({
      where: {
        frequency: {
          [Op.ne]: 'one-time',
        },
        status: {
          [Op.in]: ['scheduled', 'in-progress', 'completed'],
        },
      },
      include: [
        {
          model: ServicePackage,
          as: 'servicePackage',
        },
      ],
    });

    // Calculate MRR based on frequency
    let mrr = 0;
    recurringAppointments.forEach((appointment) => {
      const price = parseFloat(appointment.totalPrice || 0);
      if (appointment.frequency === 'weekly') {
        mrr += price * 4; // Approximate 4 weeks per month
      } else if (appointment.frequency === 'bi-weekly') {
        mrr += price * 2; // Twice per month
      } else if (appointment.frequency === 'monthly') {
        mrr += price; // Once per month
      }
    });

    // Get revenue by service type (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByService = await Payment.findAll({
      attributes: [
        [fn('SUM', col('Payment.amount')), 'revenue'],
      ],
      where: {
        status: 'completed',
        paidAt: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
      include: [
        {
          model: Appointment,
          as: 'appointment',
          attributes: [],
          include: [
            {
              model: ServicePackage,
              as: 'servicePackage',
              attributes: ['name'],
            },
          ],
        },
      ],
      group: ['appointment.servicePackage.id', 'appointment.servicePackage.name'],
      raw: true,
    });

    // Get growth trends (last 6 months)
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenueTrend = await Payment.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('paid_at')), 'month'],
        [fn('SUM', col('amount')), 'revenue'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        status: 'completed',
        paidAt: {
          [Op.gte]: sixMonthsAgo,
        },
      },
      group: [literal('DATE_TRUNC(\'month\', "paid_at")')],
      order: [[literal('DATE_TRUNC(\'month\', "paid_at")'), 'ASC']],
      raw: true,
    });

    // Today's revenue
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRevenueResult = await Payment.sum('amount', {
      where: {
        status: 'completed',
        paidAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });
    const todayRevenue = todayRevenueResult || 0;

    res.json({
      success: true,
      data: {
        mrr: parseFloat(mrr.toFixed(2)),
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        revenueByService: revenueByService.map((item) => ({
          name: item['appointment.servicePackage.name'] || 'Unknown',
          revenue: parseFloat(item.revenue || 0),
        })),
        monthlyTrend: monthlyRevenueTrend.map((item) => ({
          month: item.month,
          revenue: parseFloat(item.revenue || 0),
          count: parseInt(item.count || 0),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/appointments-today
 * Get today's appointments with details
 */
const getTodaysAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.findAll({
      where: {
        scheduledDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
        {
          model: Property,
          as: 'property',
          attributes: ['address', 'city', 'state', 'zipCode'],
        },
        {
          model: ServicePackage,
          as: 'servicePackage',
          attributes: ['name', 'description'],
        },
      ],
      order: [['scheduledTime', 'ASC']],
    });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s appointments',
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/customer-metrics
 * Get customer-related metrics
 */
const getCustomerMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total active customers
    const totalCustomers = await User.count({
      where: { role: 'customer' },
    });

    // New customers this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newCustomersThisMonth = await User.count({
      where: {
        role: 'customer',
        createdAt: {
          [Op.gte]: startOfMonth,
        },
      },
    });

    // Customers with recurring services
    const recurringCustomers = await Appointment.count({
      distinct: true,
      col: 'user_id',
      where: {
        frequency: {
          [Op.ne]: 'one-time',
        },
        status: {
          [Op.in]: ['scheduled', 'in-progress', 'completed'],
        },
      },
    });

    // Customer retention rate (customers with more than 1 appointment)
    const customersWithMultipleAppointments = await sequelize.query(
      `SELECT COUNT(DISTINCT "user_id") as count
       FROM (
         SELECT "user_id", COUNT(*) as appointment_count
         FROM appointments
         GROUP BY "user_id"
         HAVING COUNT(*) > 1
       ) as subquery`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const retainedCustomers = customersWithMultipleAppointments[0]?.count || 0;
    const retentionRate = totalCustomers > 0
      ? ((retainedCustomers / totalCustomers) * 100).toFixed(2)
      : 0;

    // Calculate churn rate (customers with no appointments in last 90 days)
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const customersWithRecentAppointments = await Appointment.count({
      distinct: true,
      col: 'user_id',
      where: {
        scheduledDate: {
          [Op.gte]: ninetyDaysAgo,
        },
      },
    });

    const churnedCustomers = totalCustomers - customersWithRecentAppointments;
    const churnRate = totalCustomers > 0
      ? ((churnedCustomers / totalCustomers) * 100).toFixed(2)
      : 0;

    // Average customer lifetime value (total revenue / total customers)
    const totalRevenueResult = await Payment.sum('amount', {
      where: { status: 'completed' },
    });
    const totalRevenue = totalRevenueResult || 0;
    const avgLifetimeValue = totalCustomers > 0
      ? (totalRevenue / totalCustomers).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        totalCustomers,
        newCustomersThisMonth,
        recurringCustomers,
        retentionRate: parseFloat(retentionRate),
        churnRate: parseFloat(churnRate),
        avgLifetimeValue: parseFloat(avgLifetimeValue),
      },
    });
  } catch (error) {
    console.error('Error fetching customer metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer metrics',
      error: error.message,
    });
  }
};

module.exports = {
  getOverviewStats,
  getRevenueAnalytics,
  getTodaysAppointments,
  getCustomerMetrics,
};
