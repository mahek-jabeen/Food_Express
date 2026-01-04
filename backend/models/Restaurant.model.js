import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide restaurant name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide restaurant description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    default: ''
  },
  cuisine: [{
    type: String,
    required: true
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for seed data
  },
  location: {
    type: String,
    required: false,
    default: 'Multiple Locations'
  },
  address: {
    street: {
      type: String,
      required: false
    },
    city: {
      type: String,
      required: false
    },
    state: {
      type: String,
      required: false
    },
    zipCode: {
      type: String,
      required: false
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number']
  },
  email: {
    type: String,
    required: [true, 'Please provide email']
  },
  images: [{
    type: String
  }],
  logo: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },
  deliveryTime: {
    type: String,
    default: '30-40 mins'
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 0
  },
  minimumOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openingHours: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    open: String,
    close: String,
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String
  }],
  featured: {
    type: Boolean,
    default: false
  },
  // Explicit menuItems array as per requirement
  menuItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }]
}, {  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.model('Restaurant', restaurantSchema);
