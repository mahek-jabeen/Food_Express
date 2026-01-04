import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  image: String,
  customizations: [{
    name: String,
    option: String,
    price: {
      type: Number,
      default: 0
    }
  }],
  specialInstructions: String
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update cart totals before saving
cartSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    let itemPrice = item.price;
    if (item.customizations && item.customizations.length > 0) {
      itemPrice += item.customizations.reduce((customSum, custom) => customSum + (custom.price || 0), 0);
    }
    return sum + (itemPrice * item.quantity);
  }, 0);

  // Calculate tax (8%)
  this.tax = this.subtotal * 0.08;

  // Calculate total
  this.total = this.subtotal + this.deliveryFee + this.tax;

  this.lastUpdated = Date.now();
  next();
});

// Auto-expire cart after 24 hours of inactivity
cartSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('Cart', cartSchema);
