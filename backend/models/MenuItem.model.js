import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    alias: 'restaurantId'
  },
  name: {
    type: String,
    required: [true, 'Please provide item name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide item description'],
    maxlength: [300, 'Description cannot be more than 300 characters']
  },
  image: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Please provide price'],
    min: [0, 'Price cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Side', 'Salad', 'Soup', 'Special', 'Pizza', 'Burger', 'Sandwich', 'Biryani', 'Coffee', 'Snacks']
  },
  images: [{
    type: String
  }],
  isVeg: {
    type: Boolean,
    default: false
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  spicyLevel: {
    type: String,
    enum: ['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'],
    default: 'None'
  },
  calories: {
    type: Number,
    min: 0
  },
  prepTime: {
    type: Number,
    default: 15
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  allergens: [{
    type: String
  }],
  nutritionalInfo: {
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  customizations: [{
    name: String,
    options: [{
      name: String,
      price: Number
    }]
  }],
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('MenuItem', menuItemSchema);
