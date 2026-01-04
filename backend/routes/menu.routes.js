import express from 'express';
const router = express.Router();
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menu.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

// Menu management routes (protected)
router.route('/')
  .post(protect, authorize('restaurant', 'admin'), createMenuItem);

// Get menu items for a restaurant (both patterns supported)
router.route('/:restaurantId')
  .get(getMenuItems);

router.route('/:id/menu')
  .get(getMenuItems);

// Individual menu item routes
router.route('/item/:id')
  .get(getMenuItem)
  .put(protect, authorize('restaurant', 'admin'), updateMenuItem)
  .delete(protect, authorize('restaurant', 'admin'), deleteMenuItem);

export default router;
