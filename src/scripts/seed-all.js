require('dotenv').config();
const { faker } = require('@faker-js/faker');
const { subDays, addDays, format } = require('date-fns');

// Import models
const User = require('../models/User');
const Property = require('../models/Property');
const ServicePackage = require('../models/ServicePackage');
const Service = require('../models/Service');
const CrewMember = require('../models/CrewMember');
const Appointment = require('../models/Appointment');
const AppointmentService = require('../models/AppointmentService');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Referral = require('../models/Referral');

async function seedAll() {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');

    // ==========================================
    // 1. SEED SERVICE PACKAGES
    // ==========================================
    console.log('📦 Seeding service packages...');

    const basicPackage = await ServicePackage.findOrCreate({
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
          small: 1.0,    // < 5000 sq ft
          medium: 1.2,   // 5000-10000 sq ft
          large: 1.5,    // 10000-15000 sq ft
          xlarge: 2.0    // > 15000 sq ft
        },
        sortOrder: 1,
      },
    });

    const premiumPackage = await ServicePackage.findOrCreate({
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
      },
    });

    const deluxePackage = await ServicePackage.findOrCreate({
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
      },
    });

    console.log('✅ Service packages seeded\n');

    // ==========================================
    // 2. SEED ADD-ON SERVICES
    // ==========================================
    console.log('🔧 Seeding add-on services...');

    const services = [
      { name: 'Lawn Aeration', price: 50.00, description: 'Improve soil health and grass growth', category: 'addon', icon: 'wind' },
      { name: 'Fertilization', price: 40.00, description: 'Nutrient-rich treatment for lush green lawns', category: 'addon', icon: 'sparkles' },
      { name: 'Weed Control', price: 30.00, description: 'Targeted weed elimination', category: 'addon', icon: 'shield-check' },
      { name: 'Leaf Removal', price: 45.00, description: 'Complete fall cleanup service', category: 'seasonal', icon: 'leaf' },
      { name: 'Hedge Trimming', price: 35.00, description: 'Professional shrub shaping', category: 'addon', icon: 'scissors' },
      { name: 'Spring Cleanup', price: 75.00, description: 'Comprehensive yard preparation', category: 'seasonal', icon: 'sun' },
    ];

    for (const service of services) {
      await Service.findOrCreate({
        where: { name: service.name },
        defaults: service,
      });
    }

    console.log('✅ Add-on services seeded\n');

    // ==========================================
    // 3. SEED CREW MEMBERS
    // ==========================================
    console.log('👷 Seeding crew members...');

    const crewMembers = [
      { firstName: 'Mike', lastName: 'Rodriguez', role: 'Lead Technician', phone: '(555) 234-5678', hireDate: new Date('2020-03-15') },
      { firstName: 'Sarah', lastName: 'Johnson', role: 'Technician', phone: '(555) 345-6789', hireDate: new Date('2021-06-01') },
      { firstName: 'David', lastName: 'Chen', role: 'Technician', phone: '(555) 456-7890', hireDate: new Date('2022-01-10') },
      { firstName: 'James', lastName: 'Williams', role: 'Senior Technician', phone: '(555) 567-8901', hireDate: new Date('2019-08-20') },
      { firstName: 'Maria', lastName: 'Garcia', role: 'Technician', phone: '(555) 678-9012', hireDate: new Date('2023-04-05') },
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
    // 4. SEED CUSTOMERS, PROPERTIES, AND APPOINTMENTS
    // ==========================================
    console.log('👥 Seeding customers with properties and appointments...');

    const customerCount = 18;
    const packages = [basicPackage[0], premiumPackage[0], deluxePackage[0]];
    const frequencies = ['weekly', 'bi-weekly', 'monthly', 'one-time'];

    for (let i = 0; i < customerCount; i++) {
      // Create customer
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
        },
      });

      // Create property for customer
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

      // Create referral code for customer
      const referralCode = `${firstName.substring(0, 3).toUpperCase()}${lastName.substring(0, 3).toUpperCase()}${faker.string.numeric(3)}`;
      await Referral.create({
        referrerId: customer.id,
        referralCode,
        status: 'pending',
        discountAmount: 10.00,
        discountType: 'fixed',
      });

      // Create 2-5 appointments in the past 3 months
      const appointmentCount = Math.floor(Math.random() * 4) + 2;

      for (let j = 0; j < appointmentCount; j++) {
        const selectedPackage = packages[Math.floor(Math.random() * packages.length)];
        const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];

        // Calculate price based on lot size
        let priceMultiplier = 1.0;
        if (lotSize < 5000) priceMultiplier = selectedPackage.pricingTiers.small;
        else if (lotSize < 10000) priceMultiplier = selectedPackage.pricingTiers.medium;
        else if (lotSize < 15000) priceMultiplier = selectedPackage.pricingTiers.large;
        else priceMultiplier = selectedPackage.pricingTiers.xlarge;

        const totalPrice = parseFloat(selectedPackage.basePrice) * priceMultiplier;

        // Random date in the past 90 days or today/upcoming
        let scheduledDate;
        if (j === 0 && Math.random() > 0.7) {
          // 30% chance of having an appointment today or upcoming
          scheduledDate = addDays(new Date(), Math.floor(Math.random() * 7));
        } else {
          scheduledDate = subDays(new Date(), Math.floor(Math.random() * 90));
        }

        const isCompleted = scheduledDate < new Date();
        const crewMember = createdCrewMembers[Math.floor(Math.random() * createdCrewMembers.length)];

        const appointment = await Appointment.create({
          userId: customer.id,
          propertyId: property.id,
          servicePackageId: selectedPackage.id,
          crewMemberId: crewMember.id,
          scheduledDate,
          scheduledTime: '09:00 AM',
          status: isCompleted ? 'completed' : 'scheduled',
          frequency,
          totalPrice,
          completedAt: isCompleted ? scheduledDate : null,
          notes: Math.random() > 0.7 ? faker.lorem.sentence() : null,
        });

        // Add random add-on services to some appointments
        if (Math.random() > 0.5) {
          const allServices = await Service.findAll();
          const randomService = allServices[Math.floor(Math.random() * allServices.length)];

          await AppointmentService.create({
            appointmentId: appointment.id,
            serviceId: randomService.id,
            price: randomService.price,
            quantity: 1,
          });
        }

        // Create payment for completed appointments
        if (isCompleted) {
          await Payment.create({
            userId: customer.id,
            appointmentId: appointment.id,
            amount: totalPrice,
            status: 'completed',
            paymentMethod: 'credit_card',
            last4: faker.finance.creditCardNumber('####'),
            cardBrand: faker.helpers.arrayElement(['Visa', 'Mastercard', 'Amex']),
            invoiceNumber: `INV-${format(scheduledDate, 'yyyyMMdd')}-${faker.string.numeric(4)}`,
            paidAt: scheduledDate,
          });

          // 50% chance of having a review for completed appointments
          if (Math.random() > 0.5) {
            const rating = Math.random() > 0.8 ? 5 : Math.random() > 0.5 ? 4 : 3;
            const reviews = {
              5: [
                { title: 'Outstanding Service!', comment: 'The crew did an amazing job on my lawn. Highly recommend!' },
                { title: 'Excellent Work', comment: 'Very professional and thorough. My yard looks fantastic!' },
                { title: 'Best Lawn Service', comment: 'I\'ve tried many services, and GreenScape is by far the best.' },
              ],
              4: [
                { title: 'Great Service', comment: 'Very satisfied with the work. Minor issue with timing but overall great.' },
                { title: 'Professional Team', comment: 'Good quality work and friendly crew members.' },
              ],
              3: [
                { title: 'Good Service', comment: 'Work was fine, nothing exceptional but got the job done.' },
              ],
            };

            const reviewOptions = reviews[rating];
            const selectedReview = reviewOptions[Math.floor(Math.random() * reviewOptions.length)];

            await Review.create({
              userId: customer.id,
              appointmentId: appointment.id,
              rating,
              title: selectedReview.title,
              comment: selectedReview.comment,
              isApproved: Math.random() > 0.2, // 80% approved
              isFeatured: rating === 5 && Math.random() > 0.7,
              approvedAt: Math.random() > 0.2 ? new Date() : null,
            });
          }
        }
      }
    }

    console.log('✅ Customers, properties, and appointments seeded\n');

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Service Packages: 3`);
    console.log(`   - Add-on Services: 6`);
    console.log(`   - Crew Members: 5`);
    console.log(`   - Customers: ${customerCount}`);
    console.log(`   - Appointments: ~${customerCount * 3}`);
    console.log(`   - Payments: Created for all completed appointments`);
    console.log(`   - Reviews: Created for ~50% of completed appointments`);
    console.log(`   - Referral Codes: ${customerCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedAll();
