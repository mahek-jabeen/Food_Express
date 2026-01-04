import express from 'express';
const router = express.Router();
import {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
} from '../controllers/restaurant.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

router.route('/')
  .get(getRestaurants)
  .post(protect, authorize('restaurant', 'admin'), createRestaurant);

router.route('/:id')
  .get(getRestaurant)
  .put(protect, authorize('restaurant', 'admin'), updateRestaurant)
  .delete(protect, authorize('restaurant', 'admin'), deleteRestaurant);

export default router;
