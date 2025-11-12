require('dotenv').config();
const { User, Property, Appointment, Payment, Review, ServicePackage, Service, CrewMember, Referral } = require('../models');
const sequelize = require('../config/database');
const { faker } = require('@faker-js/faker');

async function seedDemoCustomerData() {
  try {
    console.log('🌱 Seeding demo customer data...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Find or create demo customer
    const [demoCustomer, created] = await User.findOrCreate({
      where: { email: 'demo@customer.com' },
      defaults: {
        email: 'demo@customer.com',
        password: 'demo123', // Will be hashed by the model hook
        firstName: 'Demo',
        lastName: 'Customer',
        phone: '(555) 123-4567',
        role: 'customer',
        status: 'active',
      },
    });

    if (created) {
      console.log('✅ Created demo customer: demo@customer.com / demo123');
    } else {
      console.log('✅ Found existing demo customer');
    }

    // Find or create property for demo customer
    let property = await Property.findOne({
      where: { userId: demoCustomer.id },
    });

    if (!property) {
      property = await Property.create({
        userId: demoCustomer.id,
        address: '123 Maple Street',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        lotSize: 7500,
        specialInstructions: 'Please water the flowers after mowing. Gate code is 1234.',
        gateCode: '1234',
        hasBackyard: true,
        hasDogs: true,
        isPrimary: true,
      });
      console.log('✅ Created property for demo customer');
    } else {
      console.log('✅ Found existing property');
    }

    // Get service packages and crew members
    const servicePackages = await ServicePackage.findAll({ where: { isActive: true } });
    const services = await Service.findAll({ where: { isActive: true } });
    const crewMembers = await CrewMember.findAll({ where: { isActive: true } });

    if (servicePackages.length === 0) {
      console.log('❌ No service packages found. Please run seed-all.js first.');
      process.exit(1);
    }

    // Create referral code
    let referral = await Referral.findOne({ where: { referrerId: demoCustomer.id } });
    if (!referral) {
      referral = await Referral.create({
        referrerId: demoCustomer.id,
        referralCode: `DEMO${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: 'pending',
        discountAmount: 10.00,
        discountType: 'percentage',
      });
      console.log('✅ Created referral code for demo customer');
    }

    // Delete existing appointments and payments for demo customer to avoid duplicates
    await Payment.destroy({ where: { userId: demoCustomer.id } });
    await Appointment.destroy({ where: { userId: demoCustomer.id } });
    console.log('✅ Cleaned up existing demo data\n');

    console.log('📅 Creating appointments and payments...\n');

    // Create appointments with different statuses and dates
    const appointmentsData = [
      // Past completed appointments (3 months ago)
      {
        scheduledDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        scheduledTime: '9:00 AM',
        status: 'completed',
        packageIndex: 0,
        addServices: true,
        hasReview: true,
      },
      {
        scheduledDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
        scheduledTime: '10:00 AM',
        status: 'completed',
        packageIndex: 1,
        addServices: false,
      },
      {
        scheduledDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        scheduledTime: '2:00 PM',
        status: 'completed',
        packageIndex: 0,
        addServices: true,
      },
      {
        scheduledDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        scheduledTime: '11:00 AM',
        status: 'completed',
        packageIndex: 1,
        addServices: false,
      },
      {
        scheduledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        scheduledTime: '9:30 AM',
        status: 'completed',
        packageIndex: 2,
        addServices: true,
      },
      {
        scheduledDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        scheduledTime: '1:00 PM',
        status: 'completed',
        packageIndex: 0,
        addServices: false,
      },
      // Recent scheduled appointments
      {
        scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        scheduledTime: '10:00 AM',
        status: 'in-progress',
        packageIndex: 1,
        addServices: false,
      },
      // Upcoming appointments
      {
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        scheduledTime: '9:00 AM',
        status: 'scheduled',
        packageIndex: 1,
        addServices: true,
      },
      {
        scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        scheduledTime: '2:00 PM',
        status: 'scheduled',
        packageIndex: 0,
        addServices: false,
      },
      {
        scheduledDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        scheduledTime: '11:00 AM',
        status: 'scheduled',
        packageIndex: 1,
        addServices: true,
      },
    ];

    let totalRevenue = 0;

    for (const aptData of appointmentsData) {
      const servicePackage = servicePackages[aptData.packageIndex];
      const crewMember = crewMembers[Math.floor(Math.random() * crewMembers.length)];

      // Calculate price based on lot size
      let multiplier = 1.0;
      if (property.lotSize < 5000) {
        multiplier = servicePackage.pricingTiers.small || 1.0;
      } else if (property.lotSize < 10000) {
        multiplier = servicePackage.pricingTiers.medium || 1.2;
      } else if (property.lotSize < 15000) {
        multiplier = servicePackage.pricingTiers.large || 1.5;
      } else {
        multiplier = servicePackage.pricingTiers.xlarge || 2.0;
      }

      let totalPrice = parseFloat(servicePackage.basePrice) * multiplier;

      // Create appointment
      const appointment = await Appointment.create({
        userId: demoCustomer.id,
        propertyId: property.id,
        servicePackageId: servicePackage.id,
        crewMemberId: crewMember?.id,
        scheduledDate: aptData.scheduledDate.toISOString().split('T')[0],
        scheduledTime: aptData.scheduledTime,
        status: aptData.status,
        frequency: 'one-time',
        totalPrice: totalPrice.toFixed(2),
        completedAt: aptData.status === 'completed' ? aptData.scheduledDate : null,
        notes: aptData.status === 'completed' ? 'Service completed successfully.' : null,
      });

      // Add add-on services
      if (aptData.addServices && services.length > 0) {
        const randomService = services[Math.floor(Math.random() * services.length)];
        const AppointmentService = sequelize.models.AppointmentService;
        await AppointmentService.create({
          appointmentId: appointment.id,
          serviceId: randomService.id,
          price: parseFloat(randomService.price),
          quantity: 1,
        });
        totalPrice += parseFloat(randomService.price);
        await appointment.update({ totalPrice: totalPrice.toFixed(2) });
      }

      // Create payment for completed appointments
      if (aptData.status === 'completed') {
        await Payment.create({
          userId: demoCustomer.id,
          appointmentId: appointment.id,
          amount: totalPrice.toFixed(2),
          status: 'completed',
          paymentMethod: 'credit_card',
          last4: '4242',
          cardBrand: 'Visa',
          invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          paidAt: aptData.scheduledDate,
        });
        totalRevenue += totalPrice;
      }

      // Create review for some completed appointments
      if (aptData.hasReview && aptData.status === 'completed') {
        await Review.create({
          userId: demoCustomer.id,
          appointmentId: appointment.id,
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          title: faker.helpers.arrayElement([
            'Excellent Service!',
            'Very Professional',
            'Highly Recommend',
            'Great Job!',
            'Outstanding Work',
          ]),
          comment: faker.helpers.arrayElement([
            'The crew did an amazing job on my lawn. Very professional and thorough!',
            'My yard looks fantastic! Will definitely use this service again.',
            'Prompt arrival, professional service, and excellent results.',
            'Best lawn care service I\'ve used. Highly recommend!',
            'They transformed my overgrown yard into a beautiful lawn.',
          ]),
          isApproved: true,
          isFeatured: false,
          approvedAt: aptData.scheduledDate,
        });
      }

      const statusEmoji = {
        completed: '✅',
        'in-progress': '🔄',
        scheduled: '📅',
      };

      console.log(
        `${statusEmoji[aptData.status]} ${aptData.status.toUpperCase().padEnd(12)} - ${aptData.scheduledDate.toISOString().split('T')[0]} ${aptData.scheduledTime.padEnd(8)} - ${servicePackage.name} ($${totalPrice.toFixed(2)})`
      );
    }

    console.log(`\n💰 Total Revenue from Demo Customer: $${totalRevenue.toFixed(2)}`);
    console.log('\n✅ Demo customer data seeded successfully!');
    console.log('\n📋 Demo Customer Details:');
    console.log('   Email: demo@customer.com');
    console.log('   Password: demo123');
    console.log(`   Total Appointments: ${appointmentsData.length}`);
    console.log(`   Completed: ${appointmentsData.filter(a => a.status === 'completed').length}`);
    console.log(`   Scheduled: ${appointmentsData.filter(a => a.status === 'scheduled').length}`);
    console.log(`   In Progress: ${appointmentsData.filter(a => a.status === 'in-progress').length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo customer data:', error);
    process.exit(1);
  }
}

seedDemoCustomerData();
