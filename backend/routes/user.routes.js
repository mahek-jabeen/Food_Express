import express from 'express';
const router = express.Router();
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

export default router;
