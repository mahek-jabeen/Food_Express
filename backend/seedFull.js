import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Restaurant from './models/Restaurant.model.js';
import MenuItem from './models/MenuItem.model.js';

const seed = async () => {
  try {
    console.log('🌱 Seeding full database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodxpress');
    console.log('✅ Connected to MongoDB');
    
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Create all 10 restaurants
    const restaurants = await Restaurant.create([
      {
        name: "Domino's Pizza",
        description: "America's favorite pizza delivery company",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
        cuisine: ["Pizza", "Italian"],
        location: "Multiple Locations",
        phone: "+1-800-DOMINOS",
        email: "contact@dominos.com",
        rating: 4.2,
        totalReviews: 5420,
        priceRange: "$$",
        deliveryTime: "25-35 mins",
        featured: true
      },
      {
        name: "McDonald's",
        description: "World's largest fast-food restaurant chain",
        image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
        cuisine: ["Fast Food", "American", "Burgers"],
        location: "Multiple Locations",
        phone: "+1-800-MCDONALDS",
        email: "contact@mcdonalds.com",
        rating: 4.1,
        totalReviews: 8750,
        priceRange: "$",
        deliveryTime: "20-30 mins",
        featured: true
      },
      {
        name: "KFC",
        description: "Finger lickin' good! Famous for fried chicken",
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800",
        cuisine: ["Fast Food", "American", "Chicken"],
        location: "Multiple Locations",
        phone: "+1-800-CALL-KFC",
        email: "contact@kfc.com",
        rating: 4.3,
        totalReviews: 6230,
        priceRange: "$$",
        deliveryTime: "30-40 mins"
      },
      {
        name: "Subway",
        description: "Eat Fresh! Customize your own subs",
        image: "https://images.unsplash.com/photo-1623855244261-c7229f1f6bff?w=800",
        cuisine: ["Sandwiches", "Fast Food"],
        location: "Multiple Locations",
        phone: "+1-800-SUBWAY",
        email: "contact@subway.com",
        rating: 4.0,
        totalReviews: 4890,
        priceRange: "$",
        deliveryTime: "20-30 mins"
      },
      {
        name: "Starbucks Coffee",
        description: "Premium coffee and handcrafted beverages",
        image: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800",
        cuisine: ["Coffee", "Cafe"],
        location: "Multiple Locations",
        phone: "+1-800-STARBUCKS",
        email: "contact@starbucks.com",
        rating: 4.4,
        totalReviews: 9560,
        priceRange: "$$",
        deliveryTime: "15-25 mins",
        featured: true
      },
      {
        name: "Paradise Biryani",
        description: "Authentic Hyderabadi Biryani and Indian cuisine",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
        cuisine: ["Indian", "Biryani", "Halal"],
        location: "Multiple Locations",
        phone: "+1-555-BIRYANI",
        email: "contact@paradisebiryani.com",
        rating: 4.6,
        totalReviews: 7890,
        priceRange: "$$",
        deliveryTime: "35-45 mins",
        featured: true
      },
      {
        name: "Chipotle Mexican Grill",
        description: "Fresh, responsibly sourced Mexican food",
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
        cuisine: ["Mexican", "Fast Casual"],
        location: "Multiple Locations",
        phone: "+1-800-CHIPOTLE",
        email: "contact@chipotle.com",
        rating: 4.3,
        totalReviews: 6780,
        priceRange: "$$",
        deliveryTime: "25-35 mins"
      },
      {
        name: "Burger King",
        description: "Home of the Whopper. Flame-grilled burgers",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
        cuisine: ["Fast Food", "American", "Burgers"],
        location: "Multiple Locations",
        phone: "+1-800-BK-CROWN",
        email: "contact@burgerking.com",
        rating: 4.0,
        totalReviews: 5340,
        priceRange: "$",
        deliveryTime: "25-35 mins"
      },
      {
        name: "Panda Express",
        description: "American Chinese cuisine. Famous for Orange Chicken",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800",
        cuisine: ["Chinese", "Asian"],
        location: "Multiple Locations",
        phone: "+1-800-PANDA-EX",
        email: "contact@pandaexpress.com",
        rating: 4.2,
        totalReviews: 5120,
        priceRange: "$$",
        deliveryTime: "30-40 mins"
      },
      {
        name: "Taco Bell",
        description: "Think Outside the Bun. Mexican-inspired fast food",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
        cuisine: ["Mexican", "Fast Food"],
        location: "Multiple Locations",
        phone: "+1-800-TACOBELL",
        email: "contact@tacobell.com",
        rating: 4.1,
        totalReviews: 4670,
        priceRange: "$",
        deliveryTime: "20-30 mins"
      }
    ]);
    
    console.log(`✅ Created ${restaurants.length} restaurants`);
    
    // Create menu items (5 per restaurant = 50 total)
    const menuItems = [];
    
    // Domino's
    menuItems.push(
      { restaurant: restaurants[0]._id, name: "Pepperoni Pizza", description: "Classic pepperoni with mozzarella", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500", price: 12.99, rating: 4.5, category: "Pizza", isVeg: false },
      { restaurant: restaurants[0]._id, name: "Veggie Supreme Pizza", description: "Loaded with vegetables", image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=500", price: 11.99, rating: 4.3, category: "Pizza", isVeg: true },
      { restaurant: restaurants[0]._id, name: "BBQ Chicken Pizza", description: "Grilled chicken with BBQ sauce", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500", price: 14.99, rating: 4.6, category: "Pizza", isVeg: false, isFeatured: true },
      { restaurant: restaurants[0]._id, name: "Cheese Bread", description: "Garlic-seasoned bread with cheese", image: "https://images.unsplash.com/photo-1619367770065-b4f935d0bf7a?w=500", price: 5.99, rating: 4.4, category: "Side", isVeg: true },
      { restaurant: restaurants[0]._id, name: "Chocolate Lava Cake", description: "Warm chocolate cake", image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500", price: 4.99, rating: 4.7, category: "Dessert", isVeg: true }
    );
    
    // McDonald's
    menuItems.push(
      { restaurant: restaurants[1]._id, name: "Big Mac", description: "Two beef patties, special sauce", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500", price: 5.99, rating: 4.6, category: "Burger", isVeg: false, isFeatured: true },
      { restaurant: restaurants[1]._id, name: "McChicken Sandwich", description: "Crispy chicken patty", image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500", price: 4.49, rating: 4.3, category: "Burger", isVeg: false },
      { restaurant: restaurants[1]._id, name: "French Fries", description: "World-famous golden fries", image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500", price: 2.99, rating: 4.7, category: "Side", isVeg: true },
      { restaurant: restaurants[1]._id, name: "Egg McMuffin", description: "Freshly cracked egg breakfast", image: "https://images.unsplash.com/photo-1565060299507-44e0e5e162f5?w=500", price: 3.99, rating: 4.5, category: "Main Course", isVeg: false },
      { restaurant: restaurants[1]._id, name: "McFlurry with Oreo", description: "Vanilla soft serve with Oreo", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", price: 3.49, rating: 4.6, category: "Dessert", isVeg: true }
    );
    
    // KFC
    menuItems.push(
      { restaurant: restaurants[2]._id, name: "Original Recipe Chicken", description: "Hand-breaded with 11 herbs and spices", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500", price: 8.99, rating: 4.5, category: "Main Course", isVeg: false, isFeatured: true },
      { restaurant: restaurants[2]._id, name: "Bucket Meal", description: "12 pieces with sides", image: "https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=500", price: 32.99, rating: 4.7, category: "Main Course", isVeg: false },
      { restaurant: restaurants[2]._id, name: "Mashed Potatoes & Gravy", description: "Creamy mashed potatoes", image: "https://images.unsplash.com/photo-1585329930456-85c2eb5ac5d1?w=500", price: 3.49, rating: 4.4, category: "Side", isVeg: true },
      { restaurant: restaurants[2]._id, name: "Coleslaw", description: "Fresh cabbage slaw", image: "https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=500", price: 2.99, rating: 4.2, category: "Side", isVeg: true },
      { restaurant: restaurants[2]._id, name: "Chicken Popcorn", description: "Bite-sized crispy chicken", image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500", price: 4.99, rating: 4.3, category: "Snacks", isVeg: false }
    );
    
    // Subway
    menuItems.push(
      { restaurant: restaurants[3]._id, name: "Italian B.M.T.", description: "Genoa salami, pepperoni, ham", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500", price: 7.99, rating: 4.4, category: "Sandwich", isVeg: false, isFeatured: true },
      { restaurant: restaurants[3]._id, name: "Veggie Delite", description: "All the crisp veggies", image: "https://images.unsplash.com/photo-1623855244261-c7229f1f6bff?w=500", price: 5.99, rating: 4.1, category: "Sandwich", isVeg: true },
      { restaurant: restaurants[3]._id, name: "Chicken Teriyaki", description: "Savory chicken with teriyaki", image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500", price: 8.49, rating: 4.3, category: "Sandwich", isVeg: false },
      { restaurant: restaurants[3]._id, name: "Cookies (3 Pack)", description: "Freshly baked cookies", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500", price: 2.99, rating: 4.5, category: "Dessert", isVeg: true },
      { restaurant: restaurants[3]._id, name: "Meatball Marinara", description: "Italian meatballs in marinara", image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=500", price: 7.49, rating: 4.4, category: "Sandwich", isVeg: false }
    );
    
    // Starbucks
    menuItems.push(
      { restaurant: restaurants[4]._id, name: "Caffe Latte", description: "Espresso with steamed milk", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500", price: 4.95, rating: 4.6, category: "Coffee", isVeg: true, isFeatured: true },
      { restaurant: restaurants[4]._id, name: "Caramel Macchiato", description: "Vanilla, espresso, caramel", image: "https://images.unsplash.com/photo-1562610822-05bb7e9e0990?w=500", price: 5.45, rating: 4.7, category: "Coffee", isVeg: true },
      { restaurant: restaurants[4]._id, name: "Iced White Chocolate Mocha", description: "White chocolate espresso drink", image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500", price: 5.95, rating: 4.8, category: "Coffee", isVeg: true },
      { restaurant: restaurants[4]._id, name: "Blueberry Muffin", description: "Moist muffin with blueberries", image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500", price: 3.45, rating: 4.4, category: "Dessert", isVeg: true },
      { restaurant: restaurants[4]._id, name: "Egg & Cheese Sandwich", description: "Cage-free eggs on English muffin", image: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=500", price: 4.95, rating: 4.3, category: "Main Course", isVeg: false }
    );
    
    // Paradise Biryani
    menuItems.push(
      { restaurant: restaurants[5]._id, name: "Chicken Dum Biryani", description: "Authentic Hyderabadi biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500", price: 13.99, rating: 4.8, category: "Biryani", isVeg: false, isFeatured: true, spiceLevel: "Medium" },
      { restaurant: restaurants[5]._id, name: "Veg Biryani", description: "Mixed vegetables with rice", image: "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500", price: 11.99, rating: 4.5, category: "Biryani", isVeg: true, spiceLevel: "Mild" },
      { restaurant: restaurants[5]._id, name: "Chicken 65", description: "Spicy deep-fried chicken", image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500", price: 9.99, rating: 4.7, category: "Appetizer", isVeg: false, spiceLevel: "Hot" },
      { restaurant: restaurants[5]._id, name: "Paneer Butter Masala", description: "Cottage cheese in creamy gravy", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500", price: 12.99, rating: 4.6, category: "Main Course", isVeg: true, spiceLevel: "Mild" },
      { restaurant: restaurants[5]._id, name: "Gulab Jamun", description: "Sweet dumplings in syrup", image: "https://images.unsplash.com/photo-1624797432677-6f803a98acb3?w=500", price: 4.99, rating: 4.8, category: "Dessert", isVeg: true }
    );
    
    // Chipotle
    menuItems.push(
      { restaurant: restaurants[6]._id, name: "Chicken Burrito", description: "Grilled chicken, rice, beans", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500", price: 9.99, rating: 4.5, category: "Main Course", isVeg: false, isFeatured: true },
      { restaurant: restaurants[6]._id, name: "Veggie Bowl", description: "Rice, beans, fajita veggies", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500", price: 9.49, rating: 4.4, category: "Main Course", isVeg: true },
      { restaurant: restaurants[6]._id, name: "Carnitas Tacos", description: "Three soft tacos with pork", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500", price: 8.99, rating: 4.6, category: "Main Course", isVeg: false },
      { restaurant: restaurants[6]._id, name: "Chips & Guacamole", description: "Fresh tortilla chips with guac", image: "https://images.unsplash.com/photo-1550458593-9e5c4e035a02?w=500", price: 4.99, rating: 4.7, category: "Side", isVeg: true, isVegan: true },
      { restaurant: restaurants[6]._id, name: "Steak Quesadilla", description: "Grilled steak with cheese", image: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=500", price: 10.99, rating: 4.5, category: "Main Course", isVeg: false }
    );
    
    // Burger King
    menuItems.push(
      { restaurant: restaurants[7]._id, name: "Whopper", description: "Flame-grilled beef patty", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500", price: 6.49, rating: 4.5, category: "Burger", isVeg: false, isFeatured: true },
      { restaurant: restaurants[7]._id, name: "Chicken Nuggets (10 pc)", description: "Crispy white meat nuggets", image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500", price: 5.99, rating: 4.3, category: "Main Course", isVeg: false },
      { restaurant: restaurants[7]._id, name: "Onion Rings", description: "Golden-fried onion rings", image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500", price: 3.49, rating: 4.4, category: "Side", isVeg: true },
      { restaurant: restaurants[7]._id, name: "Chicken Fries", description: "Crispy chicken shaped fries", image: "https://images.unsplash.com/photo-1562967916-7a827abad98b?w=500", price: 4.49, rating: 4.2, category: "Snacks", isVeg: false },
      { restaurant: restaurants[7]._id, name: "Hershey's Sundae Pie", description: "Chocolate pie", image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500", price: 2.99, rating: 4.5, category: "Dessert", isVeg: true }
    );
    
    // Panda Express
    menuItems.push(
      { restaurant: restaurants[8]._id, name: "Orange Chicken", description: "Crispy chicken in orange sauce", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500", price: 9.99, rating: 4.7, category: "Main Course", isVeg: false, isFeatured: true },
      { restaurant: restaurants[8]._id, name: "Beijing Beef", description: "Crispy beef with peppers", image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500", price: 10.99, rating: 4.6, category: "Main Course", isVeg: false },
      { restaurant: restaurants[8]._id, name: "Vegetable Spring Rolls", description: "Crispy veggie rolls", image: "https://images.unsplash.com/photo-1613279232960-3f26d1566f4e?w=500", price: 4.99, rating: 4.3, category: "Appetizer", isVeg: true },
      { restaurant: restaurants[8]._id, name: "Fried Rice", description: "Rice with eggs, peas, carrots", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500", price: 3.99, rating: 4.4, category: "Side", isVeg: false },
      { restaurant: restaurants[8]._id, name: "Honey Walnut Shrimp", description: "Crispy shrimp with walnuts", image: "https://images.unsplash.com/photo-1559058922-4c2dd3faed4c?w=500", price: 11.99, rating: 4.8, category: "Main Course", isVeg: false }
    );
    
    // Taco Bell
    menuItems.push(
      { restaurant: restaurants[9]._id, name: "Crunchy Taco Supreme", description: "Seasoned beef in crunchy shell", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500", price: 3.49, rating: 4.4, category: "Main Course", isVeg: false },
      { restaurant: restaurants[9]._id, name: "Bean Burrito", description: "Refried beans with cheddar", image: "https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=500", price: 2.99, rating: 4.2, category: "Main Course", isVeg: true },
      { restaurant: restaurants[9]._id, name: "Nachos BellGrande", description: "Tortilla chips loaded up", image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500", price: 5.99, rating: 4.5, category: "Main Course", isVeg: false, isFeatured: true },
      { restaurant: restaurants[9]._id, name: "Cinnamon Twists", description: "Sweet cinnamon sugar twists", image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500", price: 1.99, rating: 4.3, category: "Dessert", isVeg: true },
      { restaurant: restaurants[9]._id, name: "Quesarito", description: "Quesadilla wrapped burrito", image: "https://images.unsplash.com/photo-1599974624720-4ec2c8be1035?w=500", price: 4.99, rating: 4.6, category: "Main Course", isVeg: false }
    );
    
    await MenuItem.insertMany(menuItems);
    console.log(`✅ Created ${menuItems.length} menu items`);
    
    console.log('\n✅ Database seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Restaurants: ${restaurants.length}`);
    console.log(`   - Menu Items: ${menuItems.length}`);
    console.log(`\n🎉 FoodXpress database is ready!`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
