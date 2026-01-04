// Custom Error Handler Class
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Async Handler - Wraps async functions to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not Found Error Handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Duplicate field value for ${field}. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || err.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
};

export {
  ErrorResponse,
  asyncHandler,
  notFound,
  errorHandler
};
