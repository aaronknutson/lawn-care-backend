require('dotenv').config();
const sequelize = require('../config/database');
const { 
  User, Property, ServicePackage, Service, CrewMember, 
  Appointment, Payment, Review, Referral 
} = require('../models');
const { faker } = require('@faker-js/faker');
const { subDays, addDays, format } = require('date-fns');

async function seedDeployment() {
  try {
    console.log('🚀 Starting deployment database seeding...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Sync database (create tables if they don't exist)
    await sequelize.sync();
    console.log('✅ Database schema synced\n');

    // ==========================================
    // 1. SEED USERS (Admin + Demo Customer)
    // ==========================================
    console.log('👥 Seeding users...');

    const [admin] = await User.findOrCreate({
      where: { email: 'admin@greenscape.com' },
      defaults: {
        email: 'admin@greenscape.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'GreenScape',
        phone: '(555) 987-6543',
        role: 'admin',
        status: 'active',
      },
    });

    const [demoCustomer] = await User.findOrCreate({
      where: { email: 'demo@customer.com' },
      defaults: {
        email: 'demo@customer.com',
        password: 'demo123',
        firstName: 'Demo',
        lastName: 'Customer',
        phone: '(555) 123-4567',
        role: 'customer',
        status: 'active',
      },
    });

    console.log('✅ Users seeded (admin@greenscape.com / admin123, demo@customer.com / demo123)\n');

    // ==========================================
    // 2. SEED SERVICE PACKAGES
    // ==========================================
    console.log('📦 Seeding service packages...');

    const [basicPackage] = await ServicePackage.findOrCreate({
      where: { name: 'Basic Mow' },
      defaults: {
        name: 'Basic Mow',
        description: 'Perfect for maintaining your lawn\'s neat appearance',
        basePrice: 35.00,
        features: [
          'Lawn mowing',
          'Edging along sidewalks & driveways',
          'Blowing debris from hard surfaces'
        ],
        pricingTiers: {
          small: 1.0,
          medium: 1.2,
          large: 1.5,
          xlarge: 2.0
        },
        sortOrder: 1,
        isActive: true,
      },
    });

    const [premiumPackage] = await ServicePackage.findOrCreate({
      where: { name: 'Premium Care' },
      defaults: {
        name: 'Premium Care',
        description: 'Complete lawn care for a pristine yard',
        basePrice: 60.00,
        features: [
          'Everything in Basic Mow',
          'Hedge & shrub trimming',
          'Weed control treatment',
          'Line trimming around obstacles'
        ],
        pricingTiers: {
          small: 1.0,
          medium: 1.2,
          large: 1.5,
          xlarge: 2.0
        },
        sortOrder: 2,
        isActive: true,
      },
    });

    const [deluxePackage] = await ServicePackage.findOrCreate({
      where: { name: 'Deluxe Package' },
      defaults: {
        name: 'Deluxe Package',
        description: 'Ultimate lawn perfection with seasonal care',
        basePrice: 95.00,
        features: [
          'Everything in Premium Care',
          'Fertilization treatment',
          'Seasonal cleanup services',
          'Mulching & bed maintenance',
          'Priority scheduling'
        ],
        pricingTiers: {
          small: 1.0,
          medium: 1.2,
          large: 1.5,
          xlarge: 2.0
        },
        sortOrder: 3,
        isActive: true,
      },
    });

    console.log('✅ Service packages seeded\n');

    // ==========================================
    // 3. SEED ADD-ON SERVICES
    // ==========================================
    console.log('🔧 Seeding add-on services...');

    const services = [
      { name: 'Lawn Aeration', price: 50.00, description: 'Improve soil health and grass growth', category: 'addon', icon: 'wind', isActive: true },
      { name: 'Fertilization', price: 40.00, description: 'Nutrient-rich treatment for lush green lawns', category: 'addon', icon: 'sparkles', isActive: true },
      { name: 'Weed Control', price: 30.00, description: 'Targeted weed elimination', category: 'addon', icon: 'shield-check', isActive: true },
      { name: 'Leaf Removal', price: 45.00, description: 'Complete fall cleanup service', category: 'seasonal', icon: 'leaf', isActive: true },
      { name: 'Hedge Trimming', price: 35.00, description: 'Professional shrub shaping', category: 'addon', icon: 'scissors', isActive: true },
      { name: 'Spring Cleanup', price: 75.00, description: 'Comprehensive yard preparation', category: 'seasonal', icon: 'sun', isActive: true },
    ];

    for (const service of services) {
      await Service.findOrCreate({
        where: { name: service.name },
        defaults: service,
      });
    }

    console.log('✅ Add-on services seeded\n');

    // ==========================================
    // 4. SEED CREW MEMBERS
    // ==========================================
    console.log('👷 Seeding crew members...');

    const crewMembers = [
      { firstName: 'Mike', lastName: 'Rodriguez', role: 'Lead Technician', phone: '(555) 234-5678', hireDate: new Date('2020-03-15'), isActive: true },
      { firstName: 'Sarah', lastName: 'Johnson', role: 'Technician', phone: '(555) 345-6789', hireDate: new Date('2021-06-01'), isActive: true },
      { firstName: 'David', lastName: 'Chen', role: 'Technician', phone: '(555) 456-7890', hireDate: new Date('2022-01-10'), isActive: true },
      { firstName: 'James', lastName: 'Williams', role: 'Senior Technician', phone: '(555) 567-8901', hireDate: new Date('2019-08-20'), isActive: true },
      { firstName: 'Maria', lastName: 'Garcia', role: 'Technician', phone: '(555) 678-9012', hireDate: new Date('2023-04-05'), isActive: true },
    ];

    const createdCrewMembers = [];
    for (const crew of crewMembers) {
      const [crewMember] = await CrewMember.findOrCreate({
        where: { firstName: crew.firstName, lastName: crew.lastName },
        defaults: crew,
      });
      createdCrewMembers.push(crewMember);
    }

    console.log('✅ Crew members seeded\n');

    // ==========================================
    // 5. SEED DEMO CUSTOMER DATA
    // ==========================================
    console.log('🏡 Seeding demo customer data...');

    // Create property for demo customer
    const [demoProperty] = await Property.findOrCreate({
      where: { userId: demoCustomer.id, address: '123 Maple Street' },
      defaults: {
        userId: demoCustomer.id,
        address: '123 Maple Street',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        lotSize: 7500,
        specialInstructions: 'Please water the flowers after mowing. Gate code is 1234.',
        gateCode: '1234',
        hasBackyard: true,
        hasDogs: true,
        isPrimary: true,
      },
    });

    // Create appointments for demo customer
    const appointmentsData = [
      { days: -90, time: '9:00 AM', status: 'completed', packageIndex: 0, hasReview: true },
      { days: -75, time: '10:00 AM', status: 'completed', packageIndex: 1, hasReview: false },
      { days: -60, time: '2:00 PM', status: 'completed', packageIndex: 0, hasReview: true },
      { days: -45, time: '11:00 AM', status: 'completed', packageIndex: 1, hasReview: false },
      { days: -30, time: '9:30 AM', status: 'completed', packageIndex: 2, hasReview: true },
      { days: -15, time: '1:00 PM', status: 'completed', packageIndex: 0, hasReview: false },
      { days: 7, time: '9:00 AM', status: 'scheduled', packageIndex: 1, hasReview: false },
      { days: 14, time: '2:00 PM', status: 'scheduled', packageIndex: 0, hasReview: false },
      { days: 21, time: '11:00 AM', status: 'scheduled', packageIndex: 1, hasReview: false },
    ];

    const packages = [basicPackage, premiumPackage, deluxePackage];

    for (const aptData of appointmentsData) {
      const scheduledDate = addDays(new Date(), aptData.days);
      const servicePackage = packages[aptData.packageIndex];
      const crewMember = createdCrewMembers[Math.floor(Math.random() * createdCrewMembers.length)];

      // Calculate price
      const multiplier = demoProperty.lotSize < 5000 ? 1.0 : 
                        demoProperty.lotSize < 10000 ? 1.2 : 
                        demoProperty.lotSize < 15000 ? 1.5 : 2.0;
      const totalPrice = parseFloat(servicePackage.basePrice) * multiplier;

      const [appointment] = await Appointment.findOrCreate({
        where: {
          userId: demoCustomer.id,
          scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
          scheduledTime: aptData.time,
        },
        defaults: {
          userId: demoCustomer.id,
          propertyId: demoProperty.id,
          servicePackageId: servicePackage.id,
          crewMemberId: crewMember.id,
          scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
          scheduledTime: aptData.time,
          status: aptData.status,
          frequency: 'one-time',
          totalPrice: totalPrice.toFixed(2),
          completedAt: aptData.status === 'completed' ? scheduledDate : null,
          notes: aptData.status === 'completed' ? 'Service completed successfully.' : null,
        },
      });

      // Create payment for completed appointments
      if (aptData.status === 'completed') {
        await Payment.findOrCreate({
          where: { appointmentId: appointment.id },
          defaults: {
            userId: demoCustomer.id,
            appointmentId: appointment.id,
            amount: totalPrice.toFixed(2),
            status: 'completed',
            paymentMethod: 'credit_card',
            last4: '4242',
            cardBrand: 'Visa',
            invoiceNumber: `INV-${format(scheduledDate, 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            paidAt: scheduledDate,
          },
        });

        // Create review if specified
        if (aptData.hasReview) {
          await Review.findOrCreate({
            where: { appointmentId: appointment.id },
            defaults: {
              userId: demoCustomer.id,
              appointmentId: appointment.id,
              rating: 5,
              title: 'Excellent Service!',
              comment: 'The crew did an amazing job on my lawn. Very professional and thorough!',
              isApproved: true,
              isFeatured: false,
              approvedAt: scheduledDate,
            },
          });
        }
      }
    }

    console.log('✅ Demo customer data seeded\n');

    // ==========================================
    // 6. SEED ADDITIONAL CUSTOMERS
    // ==========================================
    console.log('👥 Seeding additional customers...');

    const customerCount = 15;
    const frequencies = ['weekly', 'bi-weekly', 'monthly', 'one-time'];

    for (let i = 0; i < customerCount; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();

      const [customer] = await User.findOrCreate({
        where: { email },
        defaults: {
          email,
          password: 'customer123',
          firstName,
          lastName,
          phone: faker.phone.number('(###) ###-####'),
          role: 'customer',
          status: 'active',
        },
      });

      // Create property
      const lotSizes = [3500, 5000, 7500, 10000, 12500, 15000, 20000];
      const lotSize = lotSizes[Math.floor(Math.random() * lotSizes.length)];

      const property = await Property.create({
        userId: customer.id,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode('#####'),
        lotSize,
        specialInstructions: Math.random() > 0.6 ? faker.lorem.sentence() : null,
        gateCode: Math.random() > 0.7 ? faker.string.numeric(4) : null,
        hasBackyard: Math.random() > 0.3,
        hasDogs: Math.random() > 0.6,
        isPrimary: true,
      });

      // Create 2-4 appointments
      const appointmentCount = Math.floor(Math.random() * 3) + 2;

      for (let j = 0; j < appointmentCount; j++) {
        const selectedPackage = packages[Math.floor(Math.random() * packages.length)];
        const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];

        // Calculate price
        let priceMultiplier = 1.0;
        if (lotSize < 5000) priceMultiplier = 1.0;
        else if (lotSize < 10000) priceMultiplier = 1.2;
        else if (lotSize < 15000) priceMultiplier = 1.5;
        else priceMultiplier = 2.0;

        const totalPrice = parseFloat(selectedPackage.basePrice) * priceMultiplier;

        // Random date in the past 60 days
        const scheduledDate = subDays(new Date(), Math.floor(Math.random() * 60));
        const isCompleted = scheduledDate < new Date();
        const crewMember = createdCrewMembers[Math.floor(Math.random() * createdCrewMembers.length)];

        const appointment = await Appointment.create({
          userId: customer.id,
          propertyId: property.id,
          servicePackageId: selectedPackage.id,
          crewMemberId: crewMember.id,
          scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
          scheduledTime: '09:00 AM',
          status: isCompleted ? 'completed' : 'scheduled',
          frequency,
          totalPrice: totalPrice.toFixed(2),
          completedAt: isCompleted ? scheduledDate : null,
          notes: Math.random() > 0.7 ? faker.lorem.sentence() : null,
        });

        // Create payment for completed appointments
        if (isCompleted) {
          await Payment.create({
            userId: customer.id,
            appointmentId: appointment.id,
            amount: totalPrice.toFixed(2),
            status: 'completed',
            paymentMethod: 'credit_card',
            last4: faker.finance.creditCardNumber('####'),
            cardBrand: faker.helpers.arrayElement(['Visa', 'Mastercard', 'Amex']),
            invoiceNumber: `INV-${format(scheduledDate, 'yyyyMMdd')}-${faker.string.numeric(4)}`,
            paidAt: scheduledDate,
          });

          // 50% chance of review
          if (Math.random() > 0.5) {
            const rating = Math.floor(Math.random() * 2) + 4;
            await Review.create({
              userId: customer.id,
              appointmentId: appointment.id,
              rating,
              title: faker.helpers.arrayElement([
                'Excellent Service!',
                'Great Job!',
                'Professional Work',
                'Highly Recommend',
              ]),
              comment: faker.lorem.sentences(2),
              isApproved: true,
              isFeatured: rating === 5 && Math.random() > 0.7,
              approvedAt: scheduledDate,
            });
          }
        }
      }
    }

    console.log('✅ Additional customers seeded\n');

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('🎉 Deployment database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   - Admin Account: admin@greenscape.com / admin123');
    console.log('   - Demo Customer: demo@customer.com / demo123');
    console.log('   - Service Packages: 3');
    console.log('   - Add-on Services: 6');
    console.log('   - Crew Members: 5');
    console.log(`   - Total Customers: ${customerCount + 1}`);
    console.log('   - Properties: Created for all customers');
    console.log('   - Appointments: Multiple per customer');
    console.log('   - Payments: Created for completed appointments');
    console.log('   - Reviews: Created for ~50% of completed appointments\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Deployment seeding failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

seedDeployment();
