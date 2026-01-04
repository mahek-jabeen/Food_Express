import express from 'express';
const router = express.Router();
import {
  createOrder,
  getUserOrders,
  getOrder,
  getOrderLocation,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

// Create order - customers only
router.route('/')
  .post(protect, authorize('customer'), createOrder);

// Get user's own orders - customers only
router.route('/user')
  .get(protect, authorize('customer'), getUserOrders);

// Get single order - authenticated users (role-based access checked in controller)
router.route('/:id')
  .get(protect, getOrder);

// Get order location data for tracking - authenticated users
router.route('/:id/location')
  .get(protect, getOrderLocation);

// Update order status - DEPRECATED (restaurants and delivery MUST use their own endpoints)
// Only admin can use this generic endpoint for emergency overrides
router.route('/:id/status')
  .put(protect, authorize('admin'), updateOrderStatus);

// Cancel order - customers only (checked in controller for ownership)
router.route('/:id/cancel')
  .put(protect, authorize('customer'), cancelOrder);

// Update payment status - customers only (checked in controller for ownership)
router.route('/:id/payment')
  .put(protect, authorize('customer'), updatePaymentStatus);

export default router;
