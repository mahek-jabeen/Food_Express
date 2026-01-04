import express from 'express';
const router = express.Router();
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cart.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

// All cart routes require authentication (customers only)
router.use(protect);
router.use(authorize('customer'));

router.route('/:userId')
  .get(getCart)
  .delete(clearCart);

router.post('/add', addToCart);

router.route('/item/:itemId')
  .put(updateCartItem)
  .delete(removeFromCart);

export default router;
