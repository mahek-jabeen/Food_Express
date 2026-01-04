import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

import mongoose from 'mongoose';
import Restaurant from './models/Restaurant.model.js';
import MenuItem from './models/MenuItem.model.js';
import connectDB from './config/db.js';

// Restaurant seed data with real restaurants
const restaurants = [
  {
    name: "Domino's Pizza",
    description: "America's favorite pizza delivery company. Fresh, hot pizza delivered to your door in 30 minutes or less.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    cuisine: ["Pizza", "Italian", "Fast Food"],
    location: "Multiple Locations",
    phone: "+1-800-DOMINOS",
    email: "contact@dominos.com",
    rating: 4.2,
    totalReviews: 5420,
    priceRange: "$$",
    deliveryTime: "25-35 mins",
    deliveryFee: 2.99,
    minimumOrder: 10,
    isOpen: true,
    featured: true,
    tags: ["Pizza", "Fast Delivery", "American", "Casual Dining"]
  },
  {
    name: "McDonald's",
    description: "World's largest fast-food restaurant chain. Serving breakfast, burgers, chicken, and more.",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
    cuisine: ["Fast Food", "American", "Burgers"],
    location: "Multiple Locations",
    phone: "+1-800-MCDONALDS",
    email: "contact@mcdonalds.com",
    rating: 4.1,
    totalReviews: 8750,
    priceRange: "$",
    deliveryTime: "20-30 mins",
    deliveryFee: 1.99,
    minimumOrder: 8,
    isOpen: true,
    featured: true,
    tags: ["Burgers", "Fast Food", "Breakfast", "Family Friendly"]
  },
  {
    name: "KFC (Kentucky Fried Chicken)",
    description: "Finger lickin' good! Famous for original recipe fried chicken, buckets, and family meals.",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800",
    cuisine: ["Fast Food", "American", "Chicken"],
    location: "Multiple Locations",
    phone: "+1-800-CALL-KFC",
    email: "contact@kfc.com",
    rating: 4.3,
    totalReviews: 6230,
    priceRange: "$$",
    deliveryTime: "30-40 mins",
    deliveryFee: 2.49,
    minimumOrder: 12,
    isOpen: true,
    featured: false,
    tags: ["Fried Chicken", "Family Meals", "Fast Food"]
  },
  {
    name: "Subway",
    description: "Eat Fresh! Customize your own subs and salads with fresh ingredients.",
    image: "https://images.unsplash.com/photo-1623855244261-c7229f1f6bff?w=800",
    cuisine: ["Sandwiches", "Fast Food", "Healthy"],
    location: "Multiple Locations",
    phone: "+1-800-SUBWAY",
    email: "contact@subway.com",
    rating: 4.0,
    totalReviews: 4890,
    priceRange: "$",
    deliveryTime: "20-30 mins",
    deliveryFee: 1.49,
    minimumOrder: 7,
    isOpen: true,
    featured: false,
    tags: ["Sandwiches", "Healthy", "Customizable", "Quick Bites"]
  },
  {
    name: "Starbucks Coffee",
    description: "Premium coffee, handcrafted beverages, fresh food, and merchandise. Your daily coffee ritual.",
    image: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800",
    cuisine: ["Coffee", "Cafe", "Beverages"],
    location: "Multiple Locations",
    phone: "+1-800-STARBUCKS",
    email: "contact@starbucks.com",
    rating: 4.4,
    totalReviews: 9560,
    priceRange: "$$",
    deliveryTime: "15-25 mins",
    deliveryFee: 2.99,
    minimumOrder: 5,
    isOpen: true,
    featured: true,
    tags: ["Coffee", "Breakfast", "Premium", "Wifi Available"]
  },
  {
    name: "Paradise Biryani",
    description: "Authentic Hyderabadi Biryani and Indian cuisine. Famous for aromatic biryanis and flavorful curries.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    cuisine: ["Indian", "Biryani", "Halal"],
    location: "Multiple Locations",
    phone: "+1-555-BIRYANI",
    email: "contact@paradisebiryani.com",
    rating: 4.6,
    totalReviews: 7890,
    priceRange: "$$",
    deliveryTime: "35-45 mins",
    deliveryFee: 3.49,
    minimumOrder: 15,
    isOpen: true,
    featured: true,
    tags: ["Biryani", "Indian", "Halal", "Spicy", "Authentic"]
  },
  {
    name: "Chipotle Mexican Grill",
    description: "Fresh, responsibly sourced Mexican food. Build your own burritos, bowls, tacos, and salads.",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
    cuisine: ["Mexican", "Fast Casual", "Healthy"],
    location: "Multiple Locations",
    phone: "+1-800-CHIPOTLE",
    email: "contact@chipotle.com",
    rating: 4.3,
    totalReviews: 6780,
    priceRange: "$$",
    deliveryTime: "25-35 mins",
    deliveryFee: 2.49,
    minimumOrder: 10,
    isOpen: true,
    featured: false,
    tags: ["Mexican", "Burritos", "Healthy", "Customizable"]
  },
  {
    name: "Burger King",
    description: "Home of the Whopper. Flame-grilled burgers, chicken sandwiches, and more.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    cuisine: ["Fast Food", "American", "Burgers"],
    location: "Multiple Locations",
    phone: "+1-800-BK-CROWN",
    email: "contact@burgerking.com",
    rating: 4.0,
    totalReviews: 5340,
    priceRange: "$",
    deliveryTime: "25-35 mins",
    deliveryFee: 1.99,
    minimumOrder: 8,
    isOpen: true,
    featured: false,
    tags: ["Burgers", "Fast Food", "Flame-Grilled"]
  },
  {
    name: "Panda Express",
    description: "American Chinese cuisine. Orange Chicken, Beijing Beef, and other Chinese-inspired dishes.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800",
    cuisine: ["Chinese", "Asian", "Fast Food"],
    location: "Multiple Locations",
    phone: "+1-800-PANDA-EX",
    email: "contact@pandaexpress.com",
    rating: 4.2,
    totalReviews: 5120,
    priceRange: "$$",
    deliveryTime: "30-40 mins",
    deliveryFee: 2.49,
    minimumOrder: 12,
    isOpen: true,
    featured: false,
    tags: ["Chinese", "Asian Fusion", "Quick Meals"]
  },
  {
    name: "Taco Bell",
    description: "Think Outside the Bun. Mexican-inspired fast food including tacos, burritos, quesadillas, and nachos.",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
    cuisine: ["Mexican", "Fast Food", "Tex-Mex"],
    location: "Multiple Locations",
    phone: "+1-800-TACOBELL",
    email: "contact@tacobell.com",
    rating: 4.1,
    totalReviews: 4670,
    priceRange: "$",
    deliveryTime: "20-30 mins",
    deliveryFee: 1.49,
    minimumOrder: 7,
    isOpen: true,
    featured: false,
    tags: ["Tacos", "Mexican", "Late Night", "Value Meals"]
  }
];

// Menu items seed data - comprehensive menu for each restaurant
const getMenuItems = (restaurants) => {
  const menuItems = [];
  
  // Domino's Pizza Menu
  const dominos = restaurants.find(r => r.name === "Domino's Pizza");
  if (dominos) {
    menuItems.push(
      {
        restaurant: dominos._id,
        name: "Pepperoni Pizza",
        description: "Classic pepperoni with mozzarella cheese and signature sauce",
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500",
        price: 12.99,
        rating: 4.5,
        category: "Pizza",
        isVeg: false,
        isAvailable: true,
        tags: ["Popular", "Classic"]
      },
      {
        restaurant: dominos._id,
        name: "Veggie Supreme Pizza",
        description: "Loaded with fresh vegetables, mushrooms, peppers, onions, and olives",
        image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=500",
        price: 11.99,
        rating: 4.3,
        category: "Pizza",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Vegetarian", "Healthy"]
      },
      {
        restaurant: dominos._id,
        name: "BBQ Chicken Pizza",
        description: "Grilled chicken with BBQ sauce, onions, and cilantro",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500",
        price: 14.99,
        rating: 4.6,
        category: "Pizza",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        tags: ["BBQ", "Chicken"]
      },
      {
        restaurant: dominos._id,
        name: "Cheese Bread",
        description: "Garlic-seasoned bread topped with melted cheese",
        image: "https://images.unsplash.com/photo-1619367770065-b4f935d0bf7a?w=500",
        price: 5.99,
        rating: 4.4,
        category: "Side",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Side", "Cheesy"]
      },
      {
        restaurant: dominos._id,
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with molten chocolate center",
        image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500",
        price: 4.99,
        rating: 4.7,
        category: "Dessert",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Dessert", "Chocolate"]
      }
    );
  }

  // McDonald's Menu
  const mcdonalds = restaurants.find(r => r.name === "McDonald's");
  if (mcdonalds) {
    menuItems.push(
      {
        restaurant: mcdonalds._id,
        name: "Big Mac",
        description: "Two beef patties, special sauce, lettuce, cheese, pickles, onions on sesame seed bun",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500",
        price: 5.99,
        rating: 4.6,
        category: "Burger",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        tags: ["Signature", "Popular"]
      },
      {
        restaurant: mcdonalds._id,
        name: "McChicken Sandwich",
        description: "Crispy chicken patty with lettuce and mayo",
        image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500",
        price: 4.49,
        rating: 4.3,
        category: "Burger",
        isVeg: false,
        isAvailable: true,
        tags: ["Chicken", "Crispy"]
      },
      {
        restaurant: mcdonalds._id,
        name: "French Fries",
        description: "World-famous golden french fries, salted to perfection",
        image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500",
        price: 2.99,
        rating: 4.7,
        category: "Side",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Classic", "Popular"]
      },
      {
        restaurant: mcdonalds._id,
        name: "Egg McMuffin",
        description: "Freshly cracked egg, Canadian bacon, and cheese on English muffin",
        image: "https://images.unsplash.com/photo-1565060299507-44e0e5e162f5?w=500",
        price: 3.99,
        rating: 4.5,
        category: "Breakfast",
        isVeg: false,
        isAvailable: true,
        tags: ["Breakfast", "Egg"]
      },
      {
        restaurant: mcdonalds._id,
        name: "McFlurry with Oreo",
        description: "Creamy vanilla soft serve blended with Oreo cookie pieces",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500",
        price: 3.49,
        rating: 4.6,
        category: "Dessert",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Ice Cream", "Oreo"]
      }
    );
  }

  // KFC Menu
  const kfc = restaurants.find(r => r.name === "KFC (Kentucky Fried Chicken)");
  if (kfc) {
    menuItems.push(
      {
        restaurant: kfc._id,
        name: "Original Recipe Chicken",
        description: "Hand-breaded chicken with 11 herbs and spices",
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500",
        price: 8.99,
        rating: 4.5,
        category: "Main Course",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        tags: ["Signature", "Fried Chicken"]
      },
      {
        restaurant: kfc._id,
        name: "Bucket Meal",
        description: "12 pieces of chicken with 3 large sides and 6 biscuits",
        image: "https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=500",
        price: 32.99,
        rating: 4.7,
        category: "Main Course",
        isVeg: false,
        isAvailable: true,
        tags: ["Family Meal", "Value"]
      },
      {
        restaurant: kfc._id,
        name: "Mashed Potatoes & Gravy",
        description: "Creamy mashed potatoes with rich gravy",
        image: "https://images.unsplash.com/photo-1585329930456-85c2eb5ac5d1?w=500",
        price: 3.49,
        rating: 4.4,
        category: "Side",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Side", "Comfort Food"]
      },
      {
        restaurant: kfc._id,
        name: "Coleslaw",
        description: "Fresh cabbage slaw with KFC's signature dressing",
        image: "https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=500",
        price: 2.99,
        rating: 4.2,
        category: "Side",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Fresh", "Healthy"]
      }
    );
  }

  // Subway Menu
  const subway = restaurants.find(r => r.name === "Subway");
  if (subway) {
    menuItems.push(
      {
        restaurant: subway._id,
        name: "Italian B.M.T.",
        description: "Genoa salami, spicy pepperoni, and Black Forest ham",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500",
        price: 7.99,
        rating: 4.4,
        category: "Sandwich",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        tags: ["Popular", "Classic"]
      },
      {
        restaurant: subway._id,
        name: "Veggie Delite",
        description: "All the crisp veggies you like on your favorite freshly baked bread",
        image: "https://images.unsplash.com/photo-1623855244261-c7229f1f6bff?w=500",
        price: 5.99,
        rating: 4.1,
        category: "Sandwich",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Healthy", "Vegetarian"]
      },
      {
        restaurant: subway._id,
        name: "Chicken Teriyaki",
        description: "Savory chicken strips glazed with teriyaki sauce",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500",
        price: 8.49,
        rating: 4.3,
        category: "Sandwich",
        isVeg: false,
        isAvailable: true,
        tags: ["Chicken", "Asian Fusion"]
      },
      {
        restaurant: subway._id,
        name: "Cookies (3 Pack)",
        description: "Freshly baked chocolate chip, oatmeal raisin, or double chocolate",
        image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500",
        price: 2.99,
        rating: 4.5,
        category: "Dessert",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Sweet", "Snack"]
      }
    );
  }

  // Starbucks Menu
  const starbucks = restaurants.find(r => r.name === "Starbucks Coffee");
  if (starbucks) {
    menuItems.push(
      {
        restaurant: starbucks._id,
        name: "Caffe Latte",
        description: "Espresso with steamed milk and light foam",
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500",
        price: 4.95,
        rating: 4.6,
        category: "Coffee",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        isFeatured: true,
        tags: ["Coffee", "Classic"]
      },
      {
        restaurant: starbucks._id,
        name: "Caramel Macchiato",
        description: "Vanilla syrup, steamed milk, espresso, and caramel drizzle",
        image: "https://images.unsplash.com/photo-1562610822-05bb7e9e0990?w=500",
        price: 5.45,
        rating: 4.7,
        category: "Coffee",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Sweet", "Popular"]
      },
      {
        restaurant: starbucks._id,
        name: "Iced White Chocolate Mocha",
        description: "White chocolate sauce, espresso, milk, and ice",
        image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500",
        price: 5.95,
        rating: 4.8,
        category: "Coffee",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Iced", "Chocolate"]
      },
      {
        restaurant: starbucks._id,
        name: "Blueberry Muffin",
        description: "Moist muffin loaded with blueberries",
        image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500",
        price: 3.45,
        rating: 4.4,
        category: "Dessert",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Pastry", "Breakfast"]
      },
      {
        restaurant: starbucks._id,
        name: "Egg & Cheese Breakfast Sandwich",
        description: "Cage-free eggs and aged cheddar on English muffin",
        image: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=500",
        price: 4.95,
        rating: 4.3,
        category: "Breakfast",
        isVeg: false,
        isAvailable: true,
        tags: ["Breakfast", "Protein"]
      }
    );
  }

  // Paradise Biryani Menu
  const paradise = restaurants.find(r => r.name === "Paradise Biryani");
  if (paradise) {
    menuItems.push(
      {
        restaurant: paradise._id,
        name: "Chicken Dum Biryani",
        description: "Authentic Hyderabadi biryani with tender chicken and aromatic basmati rice",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
        price: 13.99,
        rating: 4.8,
        category: "Biryani",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        spiceLevel: "Medium",
        tags: ["Signature", "Halal", "Spicy"]
      },
      {
        restaurant: paradise._id,
        name: "Veg Biryani",
        description: "Mixed vegetables cooked with fragrant basmati rice and spices",
        image: "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500",
        price: 11.99,
        rating: 4.5,
        category: "Biryani",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        spiceLevel: "Mild",
        tags: ["Vegetarian", "Aromatic"]
      },
      {
        restaurant: paradise._id,
        name: "Chicken 65",
        description: "Spicy, deep-fried chicken dish with South Indian flavors",
        image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500",
        price: 9.99,
        rating: 4.7,
        category: "Appetizer",
        isVeg: false,
        isAvailable: true,
        spiceLevel: "Hot",
        tags: ["Spicy", "Fried"]
      },
      {
        restaurant: paradise._id,
        name: "Paneer Butter Masala",
        description: "Cottage cheese in rich creamy tomato gravy",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500",
        price: 12.99,
        rating: 4.6,
        category: "Main Course",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        spiceLevel: "Mild",
        tags: ["Vegetarian", "Creamy"]
      },
      {
        restaurant: paradise._id,
        name: "Gulab Jamun",
        description: "Sweet deep-fried dumplings soaked in rose-flavored syrup",
        image: "https://images.unsplash.com/photo-1624797432677-6f803a98acb3?w=500",
        price: 4.99,
        rating: 4.8,
        category: "Dessert",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Sweet", "Traditional"]
      }
    );
  }

  // Chipotle Menu
  const chipotle = restaurants.find(r => r.name === "Chipotle Mexican Grill");
  if (chipotle) {
    menuItems.push(
      {
        restaurant: chipotle._id,
        name: "Chicken Burrito",
        description: "Grilled chicken, rice, beans, salsa, cheese in flour tortilla",
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500",
        price: 9.99,
        rating: 4.5,
        category: "Main Course",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        tags: ["Popular", "Filling"]
      },
      {
        restaurant: chipotle._id,
        name: "Veggie Bowl",
        description: "Rice, black beans, fajita veggies, salsa, guacamole",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500",
        price: 9.49,
        rating: 4.4,
        category: "Main Course",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Healthy", "Bowl"]
      },
      {
        restaurant: chipotle._id,
        name: "Carnitas Tacos",
        description: "Three soft tacos with braised pork and toppings",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500",
        price: 8.99,
        rating: 4.6,
        category: "Main Course",
        isVeg: false,
        isAvailable: true,
        tags: ["Tacos", "Pork"]
      },
      {
        restaurant: chipotle._id,
        name: "Chips & Guacamole",
        description: "Fresh tortilla chips with house-made guacamole",
        image: "https://images.unsplash.com/photo-1550458593-9e5c4e035a02?w=500",
        price: 4.99,
        rating: 4.7,
        category: "Side",
        isVeg: true,
        isVegetarian: true,
        isVegan: true,
        isAvailable: true,
        tags: ["Fresh", "Vegan"]
      }
    );
  }

  // Burger King Menu
  const burgerKing = restaurants.find(r => r.name === "Burger King");
  if (burgerKing) {
    menuItems.push(
      {
        restaurant: burgerKing._id,
        name: "Whopper",
        description: "Flame-grilled beef patty, tomatoes, lettuce, mayo, ketchup, pickles, onions",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
        price: 6.49,
        rating: 4.5,
        category: "Burger",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        tags: ["Signature", "Flame-Grilled"]
      },
      {
        restaurant: burgerKing._id,
        name: "Chicken Nuggets (10 pc)",
        description: "Crispy white meat chicken nuggets",
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500",
        price: 5.99,
        rating: 4.3,
        category: "Main Course",
        isVeg: false,
        isAvailable: true,
        tags: ["Chicken", "Crispy"]
      },
      {
        restaurant: burgerKing._id,
        name: "Onion Rings",
        description: "Golden-fried onion rings with BK zesty sauce",
        image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500",
        price: 3.49,
        rating: 4.4,
        category: "Side",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Crispy", "Side"]
      }
    );
  }

  // Panda Express Menu
  const panda = restaurants.find(r => r.name === "Panda Express");
  if (panda) {
    menuItems.push(
      {
        restaurant: panda._id,
        name: "Orange Chicken",
        description: "Crispy chicken wok-tossed in sweet and spicy orange sauce",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500",
        price: 9.99,
        rating: 4.7,
        category: "Main Course",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        tags: ["Signature", "Popular", "Sweet & Spicy"]
      },
      {
        restaurant: panda._id,
        name: "Beijing Beef",
        description: "Crispy beef, bell peppers, and onions in sweet-tangy sauce",
        image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500",
        price: 10.99,
        rating: 4.6,
        category: "Main Course",
        isVeg: false,
        isAvailable: true,
        tags: ["Beef", "Crispy"]
      },
      {
        restaurant: panda._id,
        name: "Vegetable Spring Rolls",
        description: "Crispy rolls filled with cabbage, celery, carrots, and onions",
        image: "https://images.unsplash.com/photo-1613279232960-3f26d1566f4e?w=500",
        price: 4.99,
        rating: 4.3,
        category: "Appetizer",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Vegetarian", "Crispy"]
      },
      {
        restaurant: panda._id,
        name: "Fried Rice",
        description: "Prepared steamed white rice with soy sauce, eggs, peas, carrots",
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500",
        price: 3.99,
        rating: 4.4,
        category: "Side",
        isVeg: false,
        isAvailable: true,
        tags: ["Side", "Classic"]
      }
    );
  }

  // Taco Bell Menu
  const tacoBell = restaurants.find(r => r.name === "Taco Bell");
  if (tacoBell) {
    menuItems.push(
      {
        restaurant: tacoBell._id,
        name: "Crunchy Taco Supreme",
        description: "Seasoned beef, lettuce, tomatoes, sour cream, cheddar in crunchy shell",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500",
        price: 3.49,
        rating: 4.4,
        category: "Main Course",
        isVeg: false,
        isAvailable: true,
        tags: ["Classic", "Popular"]
      },
      {
        restaurant: tacoBell._id,
        name: "Bean Burrito",
        description: "Refried beans, cheddar, onions, red sauce in flour tortilla",
        image: "https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=500",
        price: 2.99,
        rating: 4.2,
        category: "Main Course",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Vegetarian", "Value"]
      },
      {
        restaurant: tacoBell._id,
        name: "Nachos BellGrande",
        description: "Tortilla chips with seasoned beef, beans, nacho cheese, sour cream",
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500",
        price: 5.99,
        rating: 4.5,
        category: "Main Course",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        tags: ["Nachos", "Sharing"]
      },
      {
        restaurant: tacoBell._id,
        name: "Cinnamon Twists",
        description: "Crispy puffed corn twists covered in cinnamon sugar",
        image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500",
        price: 1.99,
        rating: 4.3,
        category: "Dessert",
        isVeg: true,
        isVegetarian: true,
        isAvailable: true,
        tags: ["Sweet", "Dessert"]
      }
    );
  }

  return menuItems;
};

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');
    
    // Connect to database with timeout
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodxpress', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connected');
    
    // Clear existing data
    console.log('🗑️  Clearing existing restaurants and menu items...');
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('✅ Existing data cleared');
    
    // Insert restaurants
    console.log('📦 Inserting restaurants...');
    const createdRestaurants = await Restaurant.insertMany(restaurants);
    console.log(`✅ ${createdRestaurants.length} restaurants created`);
    
    // Generate and insert menu items
    console.log('🍽️  Generating menu items...');
    const menuItems = getMenuItems(createdRestaurants);
    const createdMenuItems = await MenuItem.insertMany(menuItems);
    console.log(`✅ ${createdMenuItems.length} menu items created`);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Restaurants: ${createdRestaurants.length}`);
    console.log(`   - Menu Items: ${createdMenuItems.length}`);
    console.log(`\n🎉 Your FoodXpress database is ready!`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { restaurants, getMenuItems, seedDatabase };
