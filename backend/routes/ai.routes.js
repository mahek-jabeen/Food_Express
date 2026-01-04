import express from 'express';
const router = express.Router();
import { 
  chatWithAI, 
  getRecommendations, 
  getReviewSummary, 
  predictETA 
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

// AI endpoints
router.post('/chat', chatWithAI);
router.post('/chatbot', chatWithAI); // Alias for chat
router.post('/recommendations', protect, getRecommendations);
router.post('/reviews', getReviewSummary);
router.post('/eta', predictETA);

export default router;
