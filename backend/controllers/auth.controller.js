import User from '../models/User.model.js';
import Restaurant from '../models/Restaurant.model.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token (includes user ID and role)
const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('❌ CRITICAL ERROR: JWT_SECRET is not defined in environment variables');
    console.error('Current env keys:', Object.keys(process.env).filter(k => k.includes('JWT')));
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign({ id, role }, secret, {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, address, restaurantId } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields: name, email, password, phone'
      });
    }

    // Validate role is provided
    if (!role) {
      return res.status(400).json({
        status: 'error',
        message: 'Please select your role'
      });
    }

    // Validate role is valid
    const validRoles = ['customer', 'restaurant', 'delivery'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role selected. Please choose: customer, restaurant, or delivery'
      });
    }

    // 🔥 RESTAURANT FLOW: Validate restaurantId for restaurant users
    if (role === 'restaurant') {
      if (!restaurantId) {
        return res.status(400).json({
          status: 'error',
          message: 'Restaurant users must select a restaurant'
        });
      }
      
      // Validate that restaurant exists
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(400).json({
          status: 'error',
          message: 'Selected restaurant does not exist'
        });
      }
      
      console.log(`✅ Restaurant signup: ${email} → Restaurant: ${restaurant.name} (${restaurantId})`);
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Create user with validated role
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      role,
      address
    };

    // 🔥 CRITICAL: Link restaurant users to their restaurant
    if (role === 'restaurant') {
      userData.restaurantId = restaurantId;
    }

    // For delivery partners, initialize delivery-specific fields
    if (role === 'delivery') {
      userData.deliveryStatus = 'offline';
    }

    const user = await User.create(userData);

    if (user) {
      console.log(`✅ User registered successfully: ${user.email} (Role: ${user.role})`);
      
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            address: user.address,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          },
          token: generateToken(user._id, user.role)
        }
      });
    }
  } catch (error) {
    console.error('❌ Registration Error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Validate role is provided
    if (!role) {
      return res.status(400).json({
        status: 'error',
        message: 'Please select your role'
      });
    }

    // Validate role is valid
    const validRoles = ['customer', 'restaurant', 'delivery'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role selected'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address'
      });
    }

    // Check for user and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      console.log(`⚠️  Login attempt failed: User not found - ${email}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log(`⚠️  Login attempt failed: Account deactivated - ${email}`);
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password exists on user object
    if (!user.password) {
      console.error(`❌ Password field missing for user: ${email}`);
      return res.status(500).json({
        status: 'error',
        message: 'Authentication error. Please contact support.'
      });
    }

    // Check if password matches using the model method
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log(`⚠️  Login attempt failed: Invalid password - ${email}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Validate role matches user's registered role
    if (user.role !== role) {
      console.log(`⚠️  Login attempt failed: Role mismatch - ${email} (Expected: ${user.role}, Provided: ${role})`);
      return res.status(401).json({
        status: 'error',
        message: `Invalid credentials. You are registered as a ${user.role}, not as a ${role}.`
      });
    }

    // 🔥 CRITICAL: Validate restaurantId for restaurant users
    if (user.role === 'restaurant') {
      if (!user.restaurantId) {
        console.error(`❌ Restaurant user missing restaurantId: ${email}`);
        return res.status(403).json({
          status: 'error',
          message: 'Your restaurant account is not properly configured. Please contact support.'
        });
      }
      
      console.log(`✅ Restaurant user validated: ${email} → Restaurant: ${user.restaurantId}`);
    }

    console.log(`✅ User logged in successfully: ${user.email} (Role: ${user.role})`);

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          address: user.address,
          profileImage: user.profileImage,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          restaurantId: user.restaurantId || undefined // 🔥 CRITICAL: Include restaurantId for restaurant users
        },
        token: generateToken(user._id, user.role)
      }
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Get User Error:', error);
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log(`✅ Password updated for user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
      data: {
        token: generateToken(user._id, user.role)
      }
    });
  } catch (error) {
    console.error('❌ Update Password Error:', error);
    next(error);
  }
};

export {
  register,
  login,
  getMe,
  updatePassword
};
