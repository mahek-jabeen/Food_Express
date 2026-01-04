import express from 'express';
import { protect, deliveryOnly } from '../middleware/auth.middleware.js';
import {
  getAvailableOrders,
  getMyDeliveries,
  acceptDelivery,
  updateDeliveryStatus,
  getDeliveryStats,
  updateLocation,
  toggleDeliveryStatus
} from '../controllers/delivery.controller.js';

const router = express.Router();

// All routes require authentication and STRICT delivery role (no admin bypass)
router.use(protect);
router.use(deliveryOnly);

// Get available orders (ready_for_pickup)
router.get('/available-orders', getAvailableOrders);

// Get my deliveries
router.get('/my-orders', getMyDeliveries);

// Get delivery stats
router.get('/stats', getDeliveryStats);

// Accept delivery
router.post('/accept/:id', acceptDelivery);

// Update delivery status
router.put('/orders/:id/status', updateDeliveryStatus);

// Update location
router.put('/location', updateLocation);

// Toggle delivery status (available/offline)
router.put('/toggle-status', toggleDeliveryStatus);

export default router;
