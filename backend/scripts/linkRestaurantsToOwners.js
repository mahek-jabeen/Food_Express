import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Restaurant from '../models/Restaurant.model.js';

const linkRestaurantsToOwners = async () => {
  try {
    console.log('🔗 Linking restaurants to restaurant owners...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all restaurant users without restaurantId
    const restaurantUsers = await User.find({ 
      role: 'restaurant',
      $or: [
        { restaurantId: null },
        { restaurantId: { $exists: false } }
      ]
    });

    console.log(`Found ${restaurantUsers.length} restaurant users without restaurantId`);

    for (const user of restaurantUsers) {
      // Find restaurant owned by this user
      const restaurant = await Restaurant.findOne({ owner: user._id });
      
      if (restaurant) {
        user.restaurantId = restaurant._id;
        await user.save();
        console.log(`✅ Linked ${user.email} to restaurant: ${restaurant.name}`);
      } else {
        console.log(`⚠️  No restaurant found for ${user.email}`);
      }
    }

    console.log('✅ Restaurant linking completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

linkRestaurantsToOwners();
