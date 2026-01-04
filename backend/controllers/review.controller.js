import Review from '../models/Review.model.js';
import Order from '../models/Order.model.js';

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { restaurant, order, rating, foodRating, deliveryRating, comment, images } = req.body;

    // Check if order exists and belongs to user
    const orderDoc = await Order.findById(order);
    if (!orderDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (orderDoc.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to review this order'
      });
    }

    if (orderDoc.status !== 'delivered') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only review delivered orders'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ user: req.user._id, order });
    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this order'
      });
    }

    const review = await Review.create({
      user: req.user._id,
      restaurant,
      order,
      rating,
      foodRating,
      deliveryRating,
      comment,
      images
    });

    // Mark order as reviewed
    orderDoc.reviewed = true;
    await orderDoc.save();

    await review.populate('user', 'name profileImage');

    res.status(201).json({
      status: 'success',
      data: { review }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get restaurant reviews
// @route   GET /api/reviews/restaurant/:restaurantId
// @access  Public
const getRestaurantReviews = async (req, res) => {
  try {
    const { rating, sort } = req.query;
    
    let query = { restaurant: req.params.restaurantId };

    if (rating) {
      query.rating = parseInt(rating);
    }

    let sortOption = '-createdAt';
    if (sort === 'helpful') {
      sortOption = '-helpful -createdAt';
    } else if (sort === 'rating_high') {
      sortOption = '-rating -createdAt';
    } else if (sort === 'rating_low') {
      sortOption = 'rating -createdAt';
    }

    const reviews = await Review.find(query)
      .populate('user', 'name profileImage')
      .populate('order', 'orderNumber')
      .sort(sortOption);

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user reviews
// @route   GET /api/reviews/user
// @access  Private
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('restaurant', 'name logo')
      .populate('order', 'orderNumber')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check authorization
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this review'
      });
    }

    review = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name profileImage');

    res.status(200).json({
      status: 'success',
      data: { review }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check authorization
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
const markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check if user already marked as helpful
    if (review.helpfulUsers.includes(req.user._id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Already marked as helpful'
      });
    }

    review.helpful += 1;
    review.helpfulUsers.push(req.user._id);
    await review.save();

    res.status(200).json({
      status: 'success',
      data: { review }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add restaurant reply to review
// @route   POST /api/reviews/:id/reply
// @access  Private (restaurant owners only)
const addRestaurantReply = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Reply message is required'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check if review already has a reply
    if (review.response && review.response.message) {
      return res.status(400).json({
        status: 'error',
        message: 'Review already has a reply'
      });
    }

    // Verify the user is the restaurant owner for this review
    if (req.user.role !== 'restaurant' || req.user.restaurantId.toString() !== review.restaurant.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to reply to this review'
      });
    }

    // Add reply
    review.response = {
      message: message.trim(),
      respondedAt: new Date(),
      respondedBy: req.user._id
    };

    await review.save();

    await review.populate('user', 'name profileImage');

    res.status(200).json({
      status: 'success',
      data: { review }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export {
  createReview,
  getRestaurantReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  addRestaurantReply
};
