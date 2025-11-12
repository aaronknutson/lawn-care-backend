require('dotenv').config();
const User = require('../models/User');

async function seedUsers() {
  try {
    console.log('🌱 Seeding users...');

    // Create demo customer
    const customer = await User.findOrCreate({
      where: { email: 'demo@customer.com' },
      defaults: {
        email: 'demo@customer.com',
        password: 'demo123',
        firstName: 'Demo',
        lastName: 'Customer',
        phone: '(555) 123-4567',
        role: 'customer',
      },
    });

    if (customer[1]) {
      console.log('✅ Created demo customer: demo@customer.com / demo123');
    } else {
      console.log('ℹ️  Demo customer already exists');
    }

    // Create admin user
    const admin = await User.findOrCreate({
      where: { email: 'admin@greenscape.com' },
      defaults: {
        email: 'admin@greenscape.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'GreenScape',
        phone: '(555) 987-6543',
        role: 'admin',
      },
    });

    if (admin[1]) {
      console.log('✅ Created admin user: admin@greenscape.com / admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('✅ User seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ User seeding failed:', error);
    process.exit(1);
  }
}

seedUsers();
