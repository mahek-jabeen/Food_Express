import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { 
  createPaymentSession, 
  confirmPayment, 
  checkPaymentStatus,
  initiateUPICollect,
  simulatePaymentSuccess,
  createInstantUPIPayment
} from "../controllers/payment.controller.js";

const router = express.Router();

// Create payment session (UPI or COD)
router.post("/create", protect, createPaymentSession);

// Instant UPI Payment (Mock payment for testing)
router.post("/instant-upi", protect, createInstantUPIPayment);

// Check payment status (polling endpoint)
router.get("/status/:paymentId", protect, checkPaymentStatus);

// Initiate UPI collect request
router.post("/upi-collect", protect, initiateUPICollect);

// Confirm payment (manual or webhook)
router.post("/confirm", protect, confirmPayment);

// Simulate payment success (for testing/demo)
router.post("/simulate-success", protect, simulatePaymentSuccess);

export default router;
