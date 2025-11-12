require('dotenv').config();
const sequelize = require('../config/database');

// Import all models in dependency order
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
const PropertyPhoto = require('../models/PropertyPhoto');
const Notification = require('../models/Notification');
const Quote = require('../models/Quote');

async function migrate() {
  try {
    console.log('🔄 Running migrations...');

    // Sync all models
    await sequelize.sync({ alter: true });

    console.log('✅ Migrations completed successfully');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - properties');
    console.log('   - service_packages');
    console.log('   - services');
    console.log('   - crew_members');
    console.log('   - appointments');
    console.log('   - appointment_services');
    console.log('   - payments');
    console.log('   - reviews');
    console.log('   - referrals');
    console.log('   - property_photos');
    console.log('   - notifications');
    console.log('   - quotes');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
