import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Restaurant from '../models/Restaurant.model.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery');
    console.log('✅ Connected to MongoDB');

    // Create test users
    const testUsers = [
      {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'customer',
        address: {
          street: '123 Main Street',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110001',
          coordinates: {
            latitude: 28.6139,
            longitude: 77.2090
          }
        }
      },
      {
        name: 'Test Delivery',
        email: 'delivery@example.com',
        password: 'password123',
        phone: '9876543212',
        role: 'delivery'
      }
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists`);
        continue;
      }

      // Create user (password will be hashed by pre-save hook)
      const user = await User.create(userData);
      console.log(`✅ Created ${userData.role} user: ${userData.email}`);
    }

    console.log('\\n🎉 Test users setup complete!');
    console.log('\\n📋 Login Credentials:');
    console.log('Customer: customer@example.com / password123');
    console.log('Delivery: delivery@example.com / password123');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestUsers();
