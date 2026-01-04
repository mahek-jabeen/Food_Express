import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token found, return 401
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, no token provided'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      console.error(`🔒 Auth Error: User not found for ID ${decoded.id}`);
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Ensure user is active
    if (!req.user.isActive) {
      console.error(`🔒 Auth Error: User account is inactive ${req.user.email}`);
      return res.status(401).json({
        status: 'error',
        message: 'User account is inactive'
      });
    }

    // Log successful authentication (for debugging)
    console.log(`✅ Auth Success: ${req.user.email} (${req.user.role}) - ${req.method} ${req.path}`);
    
    next();
  } catch (error) {
    console.error(`🔒 Auth Error: ${error.message} - ${req.method} ${req.path}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired, please login again'
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, invalid token'
    });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'Not authorized as admin'
    });
  }
};

// Restaurant middleware
const restaurant = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'restaurant')) {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'Not authorized as restaurant'
    });
  }
};

// Alias for backward compatibility
const restaurantOwner = restaurant;

// Delivery middleware
const delivery = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'delivery')) {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'Not authorized as delivery personnel'
    });
  }
};

// Customer middleware
const customer = (req, res, next) => {
  if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'Not authorized as customer'
    });
  }
};

// Check multiple roles (Generic authorize middleware)
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        status: 'error',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
  };
};

// Generic authorize middleware (recommended approach)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.error(`🚫 Authorization Error: No user object found - ${req.method} ${req.path}`);
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (roles.includes(req.user.role)) {
      console.log(`✅ Authorization Success: ${req.user.email} (${req.user.role}) authorized for ${req.path}`);
      next();
    } else {
      console.error(`🚫 Authorization Failed: ${req.user.email} (${req.user.role}) tried to access ${req.path} - Required: ${roles.join(' or ')}`);
      res.status(403).json({
        status: 'error',
        message: `Access denied. Required role: ${roles.join(' or ')}`,
        yourRole: req.user.role,
        requiredRoles: roles
      });
    }
  };
};

// Specific role-only middleware (strict - no admin bypass)
const customerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'customer') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Customer role required',
      yourRole: req.user.role
    });
  }
  next();
};

const restaurantOwnerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'restaurant') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Restaurant role required',
      yourRole: req.user.role
    });
  }
  next();
};

const deliveryOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'delivery') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Delivery role required',
      yourRole: req.user.role
    });
  }
  next();
};

// Simplified role-specific guards (aliases for better clarity)
const isCustomer = authorize('customer');
const isRestaurantOwner = authorize('restaurant');
const isDeliveryPartner = authorize('delivery');

export { 
  // Core middleware
  protect, 
  authorize,
  
  // Legacy exports (for backward compatibility)
  admin, 
  restaurant, 
  restaurantOwner, 
  delivery, 
  customer, 
  checkRole,
  
  // Strict role-only guards
  customerOnly,
  restaurantOwnerOnly,
  deliveryOnly,
  
  // Clear named aliases for route protection
  isCustomer,
  isRestaurantOwner,
  isDeliveryPartner
};
