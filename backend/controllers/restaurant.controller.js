import Restaurant from '../models/Restaurant.model.js';
import Order from '../models/Order.model.js';
import { emitOrderUpdate } from '../socket/socketHandler.js';

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
const getRestaurants = async (req, res, next) => {
  try {
    const { 
      cuisine, 
      search, 
      priceRange, 
      rating, 
      minRating,
      isOpen, 
      featured,
      deliveryTime,
      limit = 50,
      page = 1,
      sort = '-rating'
    } = req.query;
    
    let query = { isActive: true };

    // Filter by cuisine (support multiple cuisines)
    if (cuisine) {
      const cuisines = cuisine.split(',').map(c => c.trim());
      query.cuisine = { $in: cuisines };
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by price range (support multiple)
    if (priceRange) {
      const priceRanges = priceRange.split(',').map(p => p.trim());
      query.priceRange = { $in: priceRanges };
    }

    // Filter by minimum rating
    if (rating || minRating) {
      const minRatingValue = parseFloat(rating || minRating);
      if (!isNaN(minRatingValue)) {
        query.rating = { $gte: minRatingValue };
      }
    }

    // Filter by open status
    if (isOpen !== undefined) {
      query.isOpen = isOpen === 'true' || isOpen === true;
    }

    // Filter by featured status
    if (featured !== undefined) {
      query.featured = featured === 'true' || featured === true;
    }

    // Filter by delivery time
    if (deliveryTime) {
      const maxDeliveryTime = parseInt(deliveryTime);
      if (!isNaN(maxDeliveryTime)) {
        query['deliveryTime.max'] = { $lte: maxDeliveryTime };
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Count total documents
    const total = await Restaurant.countDocuments(query);

    // Execute query with pagination
    const restaurants = await Restaurant.find(query)
      .populate('owner', 'name email phone')
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .lean();

    console.log(`✅ Retrieved ${restaurants.length} restaurants`);

    res.status(200).json({
      status: 'success',
      results: restaurants.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: { restaurants }
    });
  } catch (error) {
    console.error('❌ Get Restaurants Error:', error);
    next(error);
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('menuItems')
      .lean();

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found'
      });
    }

    if (!restaurant.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant is not available'
      });
    }

    console.log(`✅ Retrieved restaurant: ${restaurant.name}`);

    res.status(200).json({
      status: 'success',
      data: { restaurant }
    });
  } catch (error) {
    console.error('❌ Get Restaurant Error:', error);
    next(error);
  }
};

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private (Restaurant Owner/Admin)
const createRestaurant = async (req, res, next) => {
  try {
    // Validate required fields
    const { name, description, cuisine, address, phone, email } = req.body;

    if (!name || !description || !cuisine || !address || !phone || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields: name, description, cuisine, address, phone, email'
      });
    }

    const restaurantData = {
      ...req.body,
      owner: req.user._id
    };

    const restaurant = await Restaurant.create(restaurantData);

    // Link restaurantId to the user
    if (req.user.role === 'restaurant') {
      await User.findByIdAndUpdate(req.user._id, {
        restaurantId: restaurant._id
      });
      console.log(`✅ Linked restaurantId ${restaurant._id} to user ${req.user.email}`);
    }

    console.log(`✅ Restaurant created: ${restaurant.name} by ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Restaurant created successfully',
      data: { restaurant }
    });
  } catch (error) {
    console.error('❌ Create Restaurant Error:', error);
    next(error);
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (Restaurant Owner/Admin)
const updateRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found'
      });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this restaurant'
      });
    }

    // Prevent updating owner field
    delete req.body.owner;

    restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone');

    console.log(`✅ Restaurant updated: ${restaurant.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Restaurant updated successfully',
      data: { restaurant }
    });
  } catch (error) {
    console.error('❌ Update Restaurant Error:', error);
    next(error);
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (Restaurant Owner/Admin)
const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found'
      });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this restaurant'
      });
    }

    const restaurantName = restaurant.name;
    await restaurant.deleteOne();

    console.log(`✅ Restaurant deleted: ${restaurantName}`);

    res.status(200).json({
      status: 'success',
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete Restaurant Error:', error);
    next(error);
  }
};

// @desc    Get restaurant's orders
// @route   GET /api/restaurant/orders
// @access  Private (Restaurant only)
const getRestaurantOrders = async (req, res) => {
  try {
    // Get restaurant associated with this user
    if (!req.user.restaurantId) {
      console.error(`❌ Restaurant orders fetch failed: No restaurantId for user ${req.user.email}`);
      return res.status(400).json({
        status: 'error',
        message: 'No restaurant associated with this account'
      });
    }

    console.log(`📊 Fetching ALL orders for restaurant: ${req.user.restaurantId}`);

    // Build query - 🔥 CRITICAL: Use restaurantId for strict filtering
    // NO status filtering - include ALL statuses
    const query = { restaurantId: req.user.restaurantId };

    // Get ALL orders for this restaurant - no limits, no pagination, no status filtering
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.menuItem', 'name image')
      .populate('deliveryPartner', 'name phone vehicleDetails')
      .sort('-createdAt'); // Sort by createdAt descending

    // 🔧 CRITICAL FIX: Remove any potential duplicates from database query
    const uniqueOrders = orders.filter((order, index, self) =>
      index === self.findIndex((o) => o._id.toString() === order._id.toString())
    );

    console.log(`✅ Retrieved ${orders.length} orders for restaurant ${req.user.restaurantId}, ${uniqueOrders.length} unique after dedup`);

    return res.status(200).json({
      status: 'success',
      results: uniqueOrders.length,
      data: { orders: uniqueOrders }
    });
  } catch (error) {
    console.error('❌ Get restaurant orders error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// @desc    Get single order details for restaurant
// @route   GET /api/restaurant/orders/:id
// @access  Private (Restaurant only)
const getRestaurantOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('restaurant', 'name address phone')
      .populate('items.menuItem', 'name image description')
      .populate('deliveryPartner', 'name phone vehicleDetails deliveryStatus');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Verify this order belongs to restaurant's restaurant
    if (order.restaurant._id.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this order'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    console.error('Get restaurant order error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// @desc    Update order status (Restaurant workflow)
// @route   PUT /api/restaurant/orders/:id/status
// @access  Private (Restaurant only)
const updateRestaurantOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    console.log(`🏪 Restaurant ${req.user.email} updating order ${req.params.id} to status: ${status}`);

    // Validate allowed status transitions for restaurant
    const allowedStatuses = ['preparing', 'ready', 'rejected', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      console.error(`❌ Invalid status: ${status}`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Restaurant can only set: preparing, ready, rejected, cancelled'
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

    // Verify this order belongs to restaurant's restaurant
    if (order.restaurant.toString() !== req.user.restaurantId.toString()) {
      console.error(`❌ Unauthorized: Order ${req.params.id} does not belong to restaurant ${req.user.restaurantId}`);
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this order'
      });
    }

    // Validate status flow (STRICT)
    const currentStatus = order.status;
    const validTransitions = {
      'paid': ['preparing', 'rejected'],
      'preparing': ['ready', 'cancelled']
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      console.error(`❌ Invalid transition: ${currentStatus} → ${status}`);
      return res.status(400).json({
        status: 'error',
        message: `Cannot transition from ${currentStatus} to ${status}. Valid transitions: ${validTransitions[currentStatus]?.join(', ') || 'none'}`
      });
    }

    // Update status
    order.status = status;
    await order.save();

    console.log(`✅ Order ${order.orderNumber} status updated: ${currentStatus} → ${status}`);

    // Populate for response
    await order.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'restaurant', select: 'name logo address' },
      { path: 'deliveryPartner', select: 'name phone' },
      { path: 'items.menuItem', select: 'name image' }
    ]);

    // Emit real-time update via Socket.IO
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
    console.error('❌ Update order status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// @desc    Get restaurant dashboard stats
// @route   GET /api/restaurant/stats
// @access  Private (Restaurant only)
const getRestaurantStats = async (req, res) => {
  try {
    if (!req.user.restaurantId) {
      return res.status(400).json({
        status: 'error',
        message: 'No restaurant associated with this account'
      });
    }

    const restaurantId = req.user.restaurantId;

    // Get counts for different statuses
    const [
      paidCount,
      preparingCount,
      readyCount,
      totalToday,
      totalRevenue
    ] = await Promise.all([
      Order.countDocuments({ restaurant: restaurantId, status: 'paid' }),
      Order.countDocuments({ restaurant: restaurantId, status: 'preparing' }),
      Order.countDocuments({ restaurant: restaurantId, status: 'ready' }),
      Order.countDocuments({
        restaurant: restaurantId,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Order.aggregate([
        {
          $match: {
            restaurant: restaurantId,
            status: { $nin: ['cancelled'] },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.total' }
          }
        }
      ])
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        stats: {
          paid: paidCount,
          preparing: preparingCount,
          ready: readyCount,
          today: totalToday,
          revenue: totalRevenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get restaurant stats error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

export {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantOrders,
  getRestaurantOrder,
  updateRestaurantOrderStatus,
  getRestaurantStats
};
