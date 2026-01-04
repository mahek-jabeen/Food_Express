import mongoose from 'mongoose';
import User from './models/User.model.js';
import Restaurant from './models/Restaurant.model.js';
import dotenv from 'dotenv';

dotenv.config();

const fixRestaurantUsers = async () => {
  try {
    console.log('🔧 Fixing restaurant user associations...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get all restaurant users
    const restaurantUsers = await User.find({ role: 'restaurant' });
    console.log(`Found ${restaurantUsers.length} restaurant users\n`);

    if (restaurantUsers.length === 0) {
      console.log('⚠️  No restaurant users found');
      process.exit(0);
    }

    // Get all restaurants
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    console.log(`Found ${restaurants.length} restaurants\n`);

    if (restaurants.length === 0) {
      console.log('❌ No restaurants found. Please create a restaurant first.');
      process.exit(1);
    }

    let fixed = 0;
    let alreadySet = 0;

    for (const user of restaurantUsers) {
      if (user.restaurantId) {
        console.log(`✓ ${user.email} already has restaurantId: ${user.restaurantId}`);
        alreadySet++;
        continue;
      }

      // Assign the first available restaurant (or you can customize this logic)
      const restaurant = restaurants[fixed % restaurants.length];
      
      user.restaurantId = restaurant._id;
      await user.save();

      console.log(`✅ Fixed ${user.email} → ${restaurant.name} (${restaurant._id})`);
      fixed++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Fix Complete!`);
    console.log(`   - Already set: ${alreadySet}`);
    console.log(`   - Newly fixed: ${fixed}`);
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixRestaurantUsers();
