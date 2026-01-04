import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from '../models/Restaurant.model.js';

dotenv.config();

const seedRestaurants = async () => {
  try {
    console.log('🌱 Starting restaurant seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing restaurants
    await Restaurant.deleteMany();
    console.log('🗑️ Old restaurants removed');

    const restaurants = [
      {
        name: 'Paradise Biryani',
        description: 'Authentic Hyderabadi Biryani',
        cuisine: 'Indian',
        priceRange: '$$',
        location: 'Hyderabad, Telangana',
        email: 'paradise@foodxpress.com',
        phone: '9876543210',
        image:
          'https://images.unsplash.com/photo-1600628422019-46f37f87b8fa',
        rating: 4.6,
        deliveryTime: 30,
        isOpen: true,
      },
      {
        name: 'Mehfil Restaurant',
        description: 'Famous for spicy biryani and kebabs',
        cuisine: 'Indian',
        priceRange: '$$',
        location: 'Banjara Hills, Hyderabad',
        email: 'mehfil@foodxpress.com',
        phone: '9123456780',
        image:
          'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
        rating: 4.5,
        deliveryTime: 35,
        isOpen: true,
      },
    ];

    for (const restaurant of restaurants) {
      await Restaurant.create(restaurant);
      console.log(`🍽️ Added: ${restaurant.name}`);
    }

    console.log('🎉 Restaurants seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedRestaurants();
