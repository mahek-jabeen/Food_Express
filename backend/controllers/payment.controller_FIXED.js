import Order from "../models/Order.model.js";
import crypto from "crypto";
import QRCode from "qrcode";

// In-memory store for payment sessions (in production, use Redis)
const paymentSessions = new Map();

// CREATE PAYMENT SESSION (for existing orders or payment retry)
export const createPaymentSession = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, upiId, upiApp } = req.body;

    // Basic validation
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "orderId, amount, and paymentMethod are required",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Verify user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      });
    }

    // CRITICAL: Prevent payment if order is already paid
    if (order.payment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this order",
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.payment.status,
          paidAt: order.payment.paidAt
        }
      });
    }

    // Only allow payment for pending orders
    if (order.status !== "pending_payment") {
      return res.status(400).json({
        success: false,
        message: `Cannot process payment for ${order.status} orders. Only pending_payment orders can be paid.`,
      });
    }

    // CASE 1 – COD (Cash on Delivery)
    if (paymentMethod === "cod") {
      order.payment.method = "cod";
      order.payment.status = "pending"; // Keep pending until delivery
      order.status = "confirmed"; // Confirm order immediately
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Cash on Delivery order confirmed",
        redirectUrl: `/payment-success/${orderId}?method=cod`,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentMethod: "cod"
        }
      });
    }

    // CASE 2 – UPI PAYMENT (Fake payment with instant success)
    if (paymentMethod === "upi") {
      // Validate UPI ID for UPI payments
      if (!upiId || !upiId.includes('@')) {
        return res.status(400).json({
          success: false,
          message: "Valid UPI ID is required (must contain @)",
        });
      }

      // DEMO UPI PAYMENT – NO REAL TRANSACTION
      const mockTransactionId = `UPI-MOCK-${Date.now()}`;
      
      // Update payment status to paid
      order.payment.method = "upi";
      order.payment.status = "paid"; // Use "paid" instead of "completed"
      order.payment.transactionId = mockTransactionId;
      order.payment.upiId = upiId; // Store UPI ID from request body
      order.payment.app = upiApp || 'unknown'; // Store UPI app from request body
      order.payment.paidAt = new Date();
      
      // Update order status from pending_payment to paid
      order.status = "paid";
      
      // Add to status history
      order.statusHistory.push({
        status: "paid",
        timestamp: new Date(),
        updatedBy: req.user._id
      });
      
      await order.save();

      // Emit socket event for real-time updates
      const socket = req.app.get('io');
      if (socket) {
        // Emit to customer
        socket.to(`user:${order.user}`).emit('payment-success', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.payment.status,
          transactionId: mockTransactionId
        });
        
        // Emit to restaurant
        if (order.restaurantId) {
          socket.to(`restaurant:${order.restaurantId}`).emit('payment-success', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.payment.status
          });
        }
        
        // Emit to delivery partners
        socket.to('delivery').emit('payment-success', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status
        });
      }

      return res.status(201).json({
        success: true,
        message: "UPI payment successful",
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.payment.status,
          paymentMethod: order.payment.method,
          transactionId: mockTransactionId,
          paidAt: order.payment.paidAt
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid payment method. Use 'upi' or 'cod'"
    });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Payment session error",
      error: error.message
    });
  }
};

// INSTANT UPI PAYMENT (Mock payment for testing)
export const createInstantUPIPayment = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, upiId, upiApp } = req.body;

    // Basic validation for UPI instant payment
    if (!orderId || !amount || paymentMethod !== "upi") {
      return res.status(400).json({
        success: false,
        message: "orderId, amount, and paymentMethod='upi' are required",
      });
    }

    // Validate UPI ID for UPI payments
    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({
        success: false,
        message: "Valid UPI ID is required (must contain @)",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Verify user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      });
    }

    // CRITICAL: Prevent payment if order is already paid
    if (order.payment.status === "paid" || order.payment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this order",
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.payment.status,
          paidAt: order.payment.paidAt
        }
      });
    }

    // Only allow payment for pending orders
    if (order.status !== "pending_payment") {
      return res.status(400).json({
        success: false,
        message: `Cannot process payment for ${order.status} orders. Only pending_payment orders can be paid.`,
      });
    }

    // DEMO UPI PAYMENT – NO REAL TRANSACTION
    const mockTransactionId = `UPI-MOCK-${Date.now()}`;
    
    // Update payment status to paid
    order.payment.method = "upi";
    order.payment.status = "paid"; // Use "paid" instead of "completed"
    order.payment.transactionId = mockTransactionId;
    order.payment.upiId = upiId; // Store UPI ID from request body
    order.payment.app = upiApp || 'unknown'; // Store UPI app from request body
    order.payment.paidAt = new Date();
    
    // Update order status from pending_payment to paid
    order.status = "paid";
    
    // Add to status history
    order.statusHistory.push({
      status: "paid",
      timestamp: new Date(),
      updatedBy: req.user._id
    });
    
    await order.save();

    // Emit socket event for real-time updates
    const socket = req.app.get('io');
    if (socket) {
      // Emit to customer
      socket.to(`user:${order.user}`).emit('payment-success', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.payment.status,
        transactionId: mockTransactionId
      });
      
      // Emit to restaurant
      if (order.restaurantId) {
        socket.to(`restaurant:${order.restaurantId}`).emit('payment-success', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.payment.status
        });
      }
      
      // Emit to delivery partners
      socket.to('delivery').emit('payment-success', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      });
    }

    return res.status(201).json({
      success: true,
      message: "UPI payment completed successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.payment.status,
        paymentMethod: order.payment.method,
        transactionId: mockTransactionId,
        paidAt: order.payment.paidAt
      }
    });
  } catch (error) {
    console.error("INSTANT UPI PAYMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: error.message
    });
  }
};

// CHECK PAYMENT STATUS (for polling)
export const checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "paymentId is required"
      });
    }

    // Check if session exists
    const session = paymentSessions.get(paymentId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Payment session not found or expired"
      });
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      paymentSessions.delete(paymentId);
      return res.status(410).json({
        success: false,
        message: "Payment session expired",
        expired: true
      });
    }

    // Get order to check actual payment status
    const order = await Order.findById(session.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Verify user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    return res.status(200).json({
      success: true,
      paymentStatus: order.payment.status,
      orderStatus: order.status,
      paidAt: order.payment.paidAt,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check payment status"
    });
  }
};

// INITIATE UPI COLLECT REQUEST
export const initiateUPICollect = async (req, res) => {
  try {
    const { paymentId, upiId } = req.body;

    if (!paymentId || !upiId) {
      return res.status(400).json({
        success: false,
        message: "paymentId and upiId are required"
      });
    }

    // Validate UPI ID format (basic validation)
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid UPI ID format"
      });
    }

    const session = paymentSessions.get(paymentId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Payment session not found"
      });
    }

    const order = await Order.findById(session.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Verify user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // In real implementation, this would trigger UPI collect request
    // For now, we'll simulate it
    session.upiId = upiId;
    session.collectRequestSent = true;
    session.collectRequestTime = new Date();
    paymentSessions.set(paymentId, session);

    return res.status(200).json({
      success: true,
      message: "UPI collect request initiated. Please approve on your phone.",
      upiId,
      waitingForApproval: true
    });
  } catch (error) {
    console.error("UPI collect error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate UPI collect request"
    });
  }
};

// CONFIRM PAYMENT (Manual confirmation or webhook)
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentId, transactionId } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: "orderId is required" 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Verify user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to confirm payment for this order",
      });
    }

    // Prevent double payment confirmation
    if (order.payment.status === "paid" || order.payment.status === "completed") {
      return res.status(200).json({ 
        success: true, 
        message: "Payment already completed",
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          paidAt: order.payment.paidAt
        }
      });
    }

    // Update payment status
    order.payment.status = "paid"; // Use "paid" instead of "completed"
    order.payment.paidAt = new Date();
    if (transactionId) {
      order.payment.transactionId = transactionId;
    }

    // Update order status from pending to confirmed
    if (order.status === "pending") {
      order.status = "confirmed";
    }

    await order.save();

    // Clean up session if exists
    if (paymentId && paymentSessions.has(paymentId)) {
      const session = paymentSessions.get(paymentId);
      session.status = "paid"; // Use "paid" instead of "completed"
      paymentSessions.set(paymentId, session);
      
      // Delete after a delay to allow final polling
      setTimeout(() => {
        paymentSessions.delete(paymentId);
      }, 10000);
    }

    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      orderId,
      paymentId,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.payment.status
      }
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Payment confirmation failed",
      error: error.message
    });
  }
};

// SIMULATE PAYMENT SUCCESS (For testing/demo purposes)
export const simulatePaymentSuccess = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "paymentId is required"
      });
    }

    const session = paymentSessions.get(paymentId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Payment session not found"
      });
    }

    const order = await Order.findById(session.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Verify user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // DEMO UPI PAYMENT – NO REAL TRANSACTION
    // Simulate successful payment
    order.payment.status = "paid"; // Use "paid" instead of "completed"
    order.payment.paidAt = new Date();
    order.payment.transactionId = `UPI-DEMO-${Date.now()}`;
    order.status = "confirmed";
    await order.save();

    // Update session
    session.status = "paid"; // Use "paid" instead of "completed"
    paymentSessions.set(paymentId, session);

    return res.status(200).json({
      success: true,
      message: "Payment simulated successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.payment.status
      }
    });
  } catch (error) {
    console.error("Simulate payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to simulate payment"
    });
  }
};
