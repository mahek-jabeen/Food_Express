import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? '✅ LOADED' : '❌ NOT FOUND');
console.log('📦 MONGODB_URI:', process.env.MONGODB_URI ? '✅ LOADED' : '❌ NOT FOUND');

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Import database connection
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import reviewRoutes from './routes/review.routes.js';
import aiRoutes from './routes/ai.routes.js';
import cartRoutes from './routes/cart.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import restaurantDashboardRoutes from './routes/restaurant.dashboard.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';

const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');

// Set environment to production to prevent React Strict Mode duplicate calls
app.set('env', 'production');

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://food-express-three-lyart.vercel.app'
];

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://food-express-three-lyart.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.options("*", cors());


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve static files for image uploads
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Favicon handler - silently handle favicon requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Request logging middleware - exclude favicon and static assets
app.use((req, res, next) => {
  if (!req.path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/i)) {
    console.log(`📨 ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'FoodXpress AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/restaurants', menuRoutes); // Mount menu routes under /api/restaurants
app.use('/api/menu', menuRoutes); // Also keep /api/menu for backwards compatibility
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/restaurant', restaurantDashboardRoutes);
app.use('/api/delivery', deliveryRoutes);

// 404 handler - must be before error handler
app.use((req, res, next) => {
  // Silently ignore common browser requests
  if (req.path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|map)$/i)) {
    return res.status(204).end();
  }
  
  // Only log API route 404s
  if (req.path.startsWith('/api/')) {
    console.error(`⚠️  API Route not found: ${req.method} ${req.originalUrl}`);
  }
  
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handling middleware - must be last
app.use((err, req, res, next) => {
  // Don't log errors for static assets
  if (!req.path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|map)$/i)) {
    console.error('❌ Error:', err.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(err.stack);
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      status: 'error',
      message: `${field} already exists`
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid ID format'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`🔐 JWT_SECRET LOADED: ${process.env.JWT_SECRET ? 'YES ✅' : 'NO ❌'}`);
});

// Initialize Socket.IO
import { initializeSocket } from './socket/socketHandler.js';
initializeSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

export default app;
