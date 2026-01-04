import express from 'express';
import { protect, restaurantOwnerOnly } from '../middleware/auth.middleware.js';
import {
  getRestaurantOrders,
  getRestaurantOrder,
  updateRestaurantOrderStatus,
  getRestaurantStats
} from '../controllers/restaurant.controller.js';

const router = express.Router();

// All routes require authentication and STRICT restaurant role (no admin bypass)
router.use(protect);
router.use(restaurantOwnerOnly);

// Get restaurant orders
router.get('/orders', getRestaurantOrders);

// Get restaurant stats
router.get('/stats', getRestaurantStats);

// Get single order
router.get('/orders/:id', getRestaurantOrder);

// Update order status
router.put('/orders/:id/status', updateRestaurantOrderStatus);

export default router;
