import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { register, login, getMe, updatePassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot be more than 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['customer', 'restaurant', 'delivery'])
    .withMessage('Role must be either customer, restaurant, or delivery')
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['customer', 'restaurant', 'delivery'])
    .withMessage('Role must be either customer, restaurant, or delivery')
];

const passwordUpdateValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Routes
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/me', protect, getMe);
router.put('/password', protect, passwordUpdateValidation, validateRequest, updatePassword);

export default router;
