import Order from '../models/Order.model.js';
import Restaurant from '../models/Restaurant.model.js';
import MenuItem from '../models/MenuItem.model.js';
import { emitOrderUpdate } from '../socket/socketHandler.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    console.log("=== ORDER CREATION DEBUG START ===");
    console.log("REQ BODY:", req.body);

    const {
      restaurant,
      items,
      deliveryAddress,
      paymentMethod,
      specialInstructions
    } = req.body;

    console.log("Authenticated User:", req.user?._id);

    // Validate required fields
    if (!restaurant) {
      return res.status(400).json({ status: "error", message: "Restaurant is required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: "error", message: "Items are required" });
    }
    if (!req.user || !req.user._id) {
      return res.status(401).json({ status: "error", message: "Authentication required" });
    }

    // Validate restaurant
    const restaurantDoc = await Restaurant.findById(restaurant);
    if (!restaurantDoc) {
      return res.status(404).json({ status: "error", message: "Restaurant not found" });
    }

    // Process items
    let subtotal = 0;
    const orderItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.menuItem) {
        return res.status(400).json({
          status: "error",
          message: `Menu item missing at index ${i}`
        });
      }

      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({
          status: "error",
          message: `Menu item not found: ${item.menuItem}`
        });
      }

      let price = menuItem.price;
      if (item.customizations?.length) {
        item.customizations.forEach(c => price += c.price || 0);
      }

      const quantity = item.quantity || 1;
      subtotal += price * quantity;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity,
        price,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || ""
      });
    }

    // Pricing
    const deliveryFee = restaurantDoc.deliveryFee || 0;
    const tax = subtotal * 0.08;
    const total = subtotal + tax + deliveryFee;

    // Generate REQUIRED order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Estimated delivery time
    const estimatedDeliveryTime = new Date(
      Date.now() + ((restaurantDoc.deliveryTime?.max || 30) * 60000)
    );

    const orderData = {
      orderNumber,
      user: req.user._id,
      restaurant,
      restaurantId: restaurant, // 🔥 CRITICAL: Set restaurantId for filtering
      items: orderItems,
      deliveryAddress: deliveryAddress || {},
      pricing: {
        subtotal,
        deliveryFee,
        tax,
        total
      },
      payment: {
        method: paymentMethod || 'upi',
        status: 'pending',
        transactionId: null,
        paidAt: null
      },
      status: 'pending_payment', // Order starts as pending_payment
      specialInstructions: specialInstructions || "",
      estimatedDeliveryTime
    };

    console.log("=== ORDER DATA TO SAVE ===");
    console.log(JSON.stringify(orderData, null, 2));

    // Create order
    const newOrder = await Order.create(orderData);

    // Populate
    await newOrder.populate([
      { path: "user", select: "name email phone" },
      { path: "restaurant", select: "name logo address" },
      { path: "items.menuItem", select: "name image" }
    ]);

    console.log("Order created:", newOrder._id);
    console.log("=== ORDER CREATION SUCCESS ===");

    // NOTE: Do NOT emit new-order here - order is still pending_payment
    // Restaurant should only receive notification when payment is completed (status = 'paid')
    // The new-order event will be emitted in updatePaymentStatus when status becomes 'paid'

    return res.status(201).json({
      status: "success",
      data: { order: newOrder }
    });

  } catch (error) {
    console.log("=== ORDER CREATION ERROR ===");
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Order creation failed",
      error: error.message,
      stack: error.stack
    });
  }
};

// @desc    Get all orders for user
// @route   GET /api/orders/user
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("restaurant", "name logo")
      .populate("items.menuItem", "name image")
      .sort("-createdAt");

    return res.status(200).json({
      status: "success",
      results: orders.length,
      data: { orders }
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("restaurant", "name logo address")
      .populate("items.menuItem", "name image description")
      .populate("deliveryPartner", "name phone vehicleDetails");

    if (!order) {
      return res.status(404).json({ status: "error", message: "Order not found" });
    }

    // Role-based access control
    const userRole = req.user.role;
    const userId = req.user._id.toString();

    if (userRole === 'admin') {
      // Admin can view any order
    } else if (userRole === 'customer') {
      // Customer can only view their own orders
      if (order.user._id.toString() !== userId) {
        return res.status(403).json({ status: "error", message: "Not authorized to view this order" });
      }
    } else if (userRole === 'restaurant') {
      // Restaurant can only view orders for their restaurant
      if (!req.user.restaurantId || order.restaurant._id.toString() !== req.user.restaurantId.toString()) {
        return res.status(403).json({ status: "error", message: "Not authorized to view this order" });
      }
    } else if (userRole === 'delivery') {
      // Delivery can view orders assigned to them or available orders
      if (order.deliveryPartner && order.deliveryPartner._id.toString() !== userId && order.status !== 'ready') {
        return res.status(403).json({ status: "error", message: "Not authorized to view this order" });
      }
    } else {
      return res.status(403).json({ status: "error", message: "Unauthorized" });
    }

    return res.status(200).json({
      status: "success",
      data: { order }
    });

  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// @desc    Update order status (DEPRECATED - Use role-specific endpoints)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    // Only admin can use this generic endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        status: "error", 
        message: "Use role-specific endpoints: /api/restaurant/orders/:id/status or /api/delivery/orders/:id/status" 
      });
    }

    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: "error", message: "Order not found" });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      status: "success",
      data: { order }
    });

  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ status: "error", message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: "error", message: "Unauthorized" });
    }

    order.status = "cancelled";
    order.cancellationReason = reason;
    order.cancelledAt = new Date();

    await order.save();

    return res.status(200).json({
      status: "success",
      data: { order }
    });

  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// @desc    Update payment status for an order
// @route   PUT /api/orders/:id/payment
// @access  Private
const updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionId } = req.body;

    // Validate status
    if (!status || !['pending', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ 
        status: "error", 
        message: "Valid payment status is required (pending, completed, failed)" 
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ status: "error", message: "Order not found" });
    }

    // Verify the user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: "error", message: "Unauthorized" });
    }

    // Prevent updating already completed payments
    if (order.payment.status === 'completed' && status === 'completed') {
      return res.status(400).json({ 
        status: "error", 
        message: "Payment already completed" 
      });
    }

    // Update payment status
    order.payment.status = status;
    
    if (status === 'completed') {
      order.payment.paidAt = new Date();
      if (transactionId) {
        order.payment.transactionId = transactionId;
      }
      // When payment is completed, update order status from pending_payment to paid
      if (order.status === 'pending_payment') {
        order.status = 'paid';
      }
    }

    await order.save();

    // Populate for real-time emission
    await order.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'restaurant', select: 'name logo address' },
      { path: 'items.menuItem', select: 'name image' }
    ]);

    // Emit order update via Socket.IO
    try {
      emitOrderUpdate(order);
      
      // CRITICAL: Emit new-order to restaurant only when payment is completed
      // This ensures restaurants only see paid orders, not pending_payment orders
      if (status === 'completed' && order.status === 'paid') {
        console.log(`🆕 New paid order notification sent to restaurant: ${order.orderNumber}`);
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    return res.status(200).json({
      status: "success",
      message: "Payment status updated successfully",
      data: { order }
    });

  } catch (error) {
    console.error("Payment update error:", error);
    return res.status(500).json({ 
      status: "error", 
      message: "Failed to update payment status",
      error: error.message 
    });
  }
};

// @desc    Get order location data for tracking
// @route   GET /api/orders/:id/location
// @access  Private
const getOrderLocation = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name address phone')
      .populate('restaurant', 'name address location')
      .populate('deliveryPartner', 'name currentLocation');
    
    if (!order) {
      return res.status(404).json({ 
        status: "error", 
        message: "Order not found" 
      });
    }

    // Verify user owns this order (customer or delivery partner)
    if (order.user._id.toString() !== req.user._id.toString() && 
        order.deliveryPartner?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        status: "error", 
        message: "Unauthorized to view this order's location" 
      });
    }

    const locationData = {
      restaurantLocation: order.restaurant?.location || null,
      customerLocation: order.user?.address || null,
      deliveryBoyLocation: order.deliveryPartner?.currentLocation || null,
      status: order.status,
      orderNumber: order.orderNumber
    };

    return res.status(200).json({
      status: "success",
      message: "Location data retrieved successfully",
      data: locationData
    });

  } catch (error) {
    console.error("Get order location error:", error);
    return res.status(500).json({ 
      status: "error", 
      message: "Failed to retrieve location data",
      error: error.message 
    });
  }
};

export {
  createOrder,
  getUserOrders,
  getOrder,
  getOrderLocation,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus
};
