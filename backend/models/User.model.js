import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number']
  },
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'delivery', 'admin'],
    required: [true, 'Please select a role']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  profileImage: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // 🔥 CRITICAL: Restaurant ID for restaurant users to link to their restaurant
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: function() {
      return this.role === 'restaurant';
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Delivery-specific fields
  vehicleDetails: {
    type: {
      type: String,
      enum: ['bike', 'scooter', 'bicycle', 'car']
    },
    number: String,
    model: String
  },
  deliveryStatus: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },
  currentLocation: {
    latitude: Number,
    longitude: Number
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JSON response (exclude sensitive data)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);
