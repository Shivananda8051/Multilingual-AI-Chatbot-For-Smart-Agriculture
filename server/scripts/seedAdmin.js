// Script to seed admin user
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_PHONE = '+918147038051';

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-agriculture');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    let admin = await User.findOne({ phone: ADMIN_PHONE });

    if (admin) {
      // Update existing user to admin
      admin.role = 'admin';
      admin.name = admin.name || 'Admin';
      admin.isProfileComplete = true;
      await admin.save();
      console.log('Existing user updated to admin:', ADMIN_PHONE);
    } else {
      // Create new admin user
      admin = await User.create({
        phone: ADMIN_PHONE,
        name: 'Admin',
        role: 'admin',
        isProfileComplete: true,
        preferredLanguage: 'en',
        notificationSettings: {
          push: true,
          inApp: true,
          weather: true,
          community: true
        }
      });
      console.log('Admin user created:', ADMIN_PHONE);
    }

    console.log('Admin setup complete!');
    console.log('Admin Phone:', ADMIN_PHONE);
    console.log('Admin Role:', admin.role);

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedAdmin();
