import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import { emitOrderUpdate } from '../socket/socketHandler.js';

// @desc    Get available orders for delivery (ready_for_pickup)
// @route   GET /api/delivery/available-orders
// @access  Private (Delivery only)
const getAvailableOrders = async (req, res) => {
  try {
    console.log(`📦 Fetching available orders for delivery partner: ${req.user.email}`);
    
    // Get orders that are ready for pickup and not assigned to anyone
    // Use $eq: null to explicitly check for null (not undefined)
    const orders = await Order.find({
      status: 'ready',
      deliveryPartner: { $eq: null }
    })
      .populate('restaurant', 'name address phone logo')
      .populate('user', 'name phone address')
      .populate('items.menuItem', 'name image')
      .sort('createdAt')
      .limit(20)
      .lean(); // Use lean() for better performance

    console.log(`✅ Found ${orders.length} available orders for delivery`);

    return res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders }
    });
  } catch (error) {
    console.error('❌ Get available orders error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch available orders',
      error: error.message
    });
  }
};

// @desc    Get delivery partner's assigned orders
// @route   GET /api/delivery/my-orders
// @access  Private (Delivery only)
const getMyDeliveries = async (req, res) => {
  try {
    const { status } = req.query;

    console.log(`📦 Fetching my deliveries for: ${req.user.email}, status: ${status || 'all'}`);

    // Build query for orders assigned to this delivery partner
    const query = { deliveryPartner: req.user._id };
    if (status && status !== '') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('restaurant', 'name address phone logo')
      .populate('user', 'name phone address')
      .populate('items.menuItem', 'name image')
      .sort('-createdAt')
      .limit(50)
      .lean(); // Use lean() for better performance

    console.log(`✅ Found ${orders.length} deliveries for partner ${req.user.email}`);

    return res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders }
    });
  } catch (error) {
    console.error('❌ Get my deliveries error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch deliveries',
      error: error.message
    });
  }
};

// @desc    Accept delivery order
// @route   POST /api/delivery/accept/:id
// @access  Private (Delivery only)
const acceptDelivery = async (req, res) => {
  try {
    console.log(`🚚 Delivery partner ${req.user.email} attempting to accept order ${req.params.id}`);

    // Check if delivery partner already has an active order FIRST
    const activeDelivery = await Order.findOne({
      deliveryPartner: req.user._id,
      status: 'picked_up'
    });

    if (activeDelivery) {
      console.log(`⚠️  Delivery partner ${req.user.email} already has active delivery ${activeDelivery.orderNumber}`);
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active delivery. Complete it before accepting another.'
      });
    }

    // Use findOneAndUpdate with atomic operation to prevent race conditions
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'ready',
        deliveryPartner: null  // Only update if not already assigned
      },
      {
        $set: {
          deliveryPartner: req.user._id,
          status: 'picked_up'
        }
      },
      { new: true }  // Return updated document
    );

    if (!order) {
      console.log(`❌ Order ${req.params.id} not available - either not found, not ready, or already assigned`);
      return res.status(400).json({
        status: 'error',
        message: 'Order not available. It may have been taken by another delivery partner.'
      });
    }

    console.log(`✅ Order ${order.orderNumber} assigned to delivery partner ${req.user.email}`);

    // Update delivery partner status to busy
    await User.findByIdAndUpdate(req.user._id, {
      deliveryStatus: 'busy'
    });

    // Populate for response
    await order.populate([
      { path: 'restaurant', select: 'name address phone logo' },
      { path: 'user', select: 'name phone address' },
      { path: 'deliveryPartner', select: 'name phone vehicleDetails' },
      { path: 'items.menuItem', select: 'name image' }
    ]);

    // Emit real-time updates (single emission, no duplicates)
    try {
      emitOrderUpdate(order);
      console.log(`📢 Socket.IO: Broadcast order update for ${order.orderNumber}`);
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Delivery accepted successfully',
      data: { order }
    });
  } catch (error) {
    console.error('❌ Accept delivery error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to accept delivery',
      error: error.message
    });
  }
};

// @desc    Update delivery status
// @route   PUT /api/delivery/orders/:id/status
// @access  Private (Delivery only)
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    console.log(`🚚 Delivery partner ${req.user.email} updating order ${req.params.id} to status: ${status}`);

    // Validate allowed status for delivery
    const allowedStatuses = ['picked_up', 'delivered'];
    if (!allowedStatuses.includes(status)) {
      console.error(`❌ Invalid status: ${status}`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Delivery can only set: picked_up, delivered'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      console.error(`❌ Order not found: ${req.params.id}`);
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Verify this order is assigned to this delivery partner
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString()) {
      console.error(`❌ Unauthorized: Order ${req.params.id} not assigned to delivery partner ${req.user.email}`);
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this order'
      });
    }

    // Validate status flow (STRICT)
    const currentStatus = order.status;
    const validTransitions = {
      'picked_up': ['delivered']
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      console.error(`❌ Invalid transition: ${currentStatus} → ${status}`);
      return res.status(400).json({
        status: 'error',
        message: `Cannot transition from ${currentStatus} to ${status}. Order must be in 'picked_up' status.`
      });
    }

    // Update status
    order.status = status;
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      // Update delivery partner status to available
      await User.findByIdAndUpdate(req.user._id, {
        deliveryStatus: 'available'
      });
      console.log(`✅ Delivery partner ${req.user.email} status set to available`);
    }
    await order.save();

    console.log(`✅ Order ${order.orderNumber} status updated: ${currentStatus} → ${status}`);

    // Populate for response
    await order.populate([
      { path: 'restaurant', select: 'name address phone logo' },
      { path: 'user', select: 'name phone address' },
      { path: 'deliveryPartner', select: 'name phone vehicleDetails' },
      { path: 'items.menuItem', select: 'name image' }
    ]);

    // Emit real-time update
    try {
      emitOrderUpdate(order);
      console.log(`📢 Socket.IO: Broadcast order update for ${order.orderNumber}`);
    } catch (socketError) {
      console.error("❌ Socket emission error:", socketError);
    }

    return res.status(200).json({
      status: 'success',
      message: `Order status updated to ${status}`,
      data: { order }
    });
  } catch (error) {
    console.error('❌ Update delivery status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update delivery status',
      error: error.message
    });
  }
};

// @desc    Get delivery partner stats
// @route   GET /api/delivery/stats
// @access  Private (Delivery only)
const getDeliveryStats = async (req, res) => {
  try {
    const deliveryPartnerId = req.user._id;

    const [
      activeDeliveries,
      completedToday,
      totalCompleted,
      totalEarnings
    ] = await Promise.all([
      Order.countDocuments({
        deliveryPartner: deliveryPartnerId,
        status: 'picked_up'
      }),
      Order.countDocuments({
        deliveryPartner: deliveryPartnerId,
        status: 'delivered',
        actualDeliveryTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Order.countDocuments({
        deliveryPartner: deliveryPartnerId,
        status: 'delivered'
      }),
      Order.aggregate([
        {
          $match: {
            deliveryPartner: deliveryPartnerId,
            status: 'delivered'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.deliveryFee' }
          }
        }
      ])
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        stats: {
          active: activeDeliveries,
          completedToday: completedToday,
          totalCompleted: totalCompleted,
          earnings: totalEarnings[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get delivery stats error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

// @desc    Update delivery partner location
// @route   PUT /api/delivery/location
// @access  Private (Delivery only)
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: { latitude, longitude }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update location',
      error: error.message
    });
  }
};

// @desc    Toggle delivery status (available/offline)
// @route   PUT /api/delivery/toggle-status
// @access  Private (Delivery only)
const toggleDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['available', 'offline'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either available or offline'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { deliveryStatus: status },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      status: 'success',
      message: `Status updated to ${status}`,
      data: { user }
    });
  } catch (error) {
    console.error('Toggle delivery status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update status',
      error: error.message
    });
  }
};

export {
  getAvailableOrders,
  getMyDeliveries,
  acceptDelivery,
  updateDeliveryStatus,
  getDeliveryStats,
  updateLocation,
  toggleDeliveryStatus
};
