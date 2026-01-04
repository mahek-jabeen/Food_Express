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
        email: 'customer@test.com',
        password: '123456',
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
        name: 'Test Restaurant',
        email: 'restaurant@test.com',
        password: '123456',
        phone: '9876543211',
        role: 'restaurant'
      },
      {
        name: 'Test Delivery',
        email: 'delivery@test.com',
        password: '123456',
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

    // Create test restaurant for restaurant user
    const restaurantUser = await User.findOne({ email: 'restaurant@test.com' });
    if (restaurantUser) {
      const existingRestaurant = await Restaurant.findOne({ owner: restaurantUser._id });
      if (!existingRestaurant) {
        const restaurant = new Restaurant({
          name: 'Test Restaurant',
          description: 'A test restaurant for development and testing',
          owner: restaurantUser._id,
          email: 'restaurant@test.com',
          phone: '9876543211',
          address: {
            street: '456 Restaurant Ave',
            city: 'Delhi',
            state: 'Delhi',
            zipCode: '110002',
            coordinates: {
              latitude: 28.6139,
              longitude: 77.2090
            }
          },
          cuisine: ['Indian', 'Chinese', 'Fast Food'],
          rating: 4.5,
          deliveryFee: 40,
          deliveryTime: '30-45 min',
          isActive: true
        });

        await restaurant.save();
        
        // Update user with restaurantId
        restaurantUser.restaurantId = restaurant._id;
        await restaurantUser.save();
        
        console.log('✅ Created test restaurant');
      } else {
        console.log('⚠️  Test restaurant already exists');
      }
    }

    console.log('\n🎉 Test users setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('Customer: customer@test.com / 123456');
    console.log('Restaurant: restaurant@test.com / 123456');
    console.log('Delivery: delivery@test.com / 123456');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestUsers();
