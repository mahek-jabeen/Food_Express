import express from 'express';
const router = express.Router();
import {
  createReview,
  getRestaurantReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  addRestaurantReply
} from '../controllers/review.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

router.route('/')
  .post(protect, authorize('customer'), createReview);

router.route('/restaurant/:restaurantId')
  .get(getRestaurantReviews);

router.route('/user')
  .get(protect, authorize('customer'), getUserReviews);

router.route('/:id')
  .put(protect, authorize('customer'), updateReview)
  .delete(protect, authorize('customer'), deleteReview);

router.route('/:id/helpful')
  .put(protect, authorize('customer'), markHelpful);

router.route('/:id/reply')
  .post(protect, authorize('restaurant'), addRestaurantReply);

export default router;
