import MenuItem from '../models/MenuItem.model.js';
import Restaurant from '../models/Restaurant.model.js';
import Order from '../models/Order.model.js';

// @desc    AI Chatbot interaction
// @route   POST /api/ai/chat
// @access  Public
const chatWithAI = async (req, res) => {
  try {
    const { message, context } = req.body;

    // Simple AI simulation - In production, integrate with OpenAI or other AI services
    let response = '';

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      const restaurants = await Restaurant.find({ isActive: true }).limit(3).sort('-rating');
      response = `I recommend these top-rated restaurants: ${restaurants.map(r => r.name).join(', ')}. Would you like to know more about any of them?`;
    } else if (lowerMessage.includes('vegetarian') || lowerMessage.includes('vegan')) {
      const items = await MenuItem.find({ 
        isVegetarian: true, 
        isAvailable: true 
      }).limit(5).populate('restaurant', 'name');
      response = `Here are some vegetarian options: ${items.map(i => `${i.name} from ${i.restaurant.name}`).join(', ')}`;
    } else if (lowerMessage.includes('spicy') || lowerMessage.includes('hot')) {
      const items = await MenuItem.find({ 
        spiceLevel: { $in: ['Hot', 'Extra Hot'] },
        isAvailable: true 
      }).limit(5).populate('restaurant', 'name');
      response = items.length > 0 
        ? `Try these spicy dishes: ${items.map(i => i.name).join(', ')}`
        : 'Let me find some spicy options for you!';
    } else if (lowerMessage.includes('cheap') || lowerMessage.includes('budget')) {
      const restaurants = await Restaurant.find({ 
        priceRange: '$',
        isActive: true 
      }).limit(5);
      response = `Budget-friendly restaurants: ${restaurants.map(r => r.name).join(', ')}`;
    } else if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
      response = 'You can track your order in the Order Tracking page. Would you like help with placing a new order?';
    } else {
      response = 'I can help you find restaurants, recommend dishes, or answer questions about our service. What would you like to know?';
    }

    res.status(200).json({
      status: 'success',
      data: {
        response,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get AI recommendations
// @route   POST /api/ai/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const { preferences, dietary } = req.body;
    const userId = req.user._id;

    // Get user's order history
    const userOrders = await Order.find({ user: userId })
      .populate({
        path: 'items.menuItem',
        select: 'category cuisine tags'
      })
      .limit(10)
      .sort('-createdAt');

    // Build query based on preferences and history
    let query = { isActive: true };

    if (dietary) {
      if (dietary.includes('vegetarian')) {
        query.tags = { $in: ['vegetarian', 'healthy'] };
      }
      if (dietary.includes('vegan')) {
        query.tags = { $in: ['vegan', 'plant-based'] };
      }
    }

    const recommendations = await Restaurant.find(query)
      .limit(10)
      .sort('-rating -totalReviews');

    res.status(200).json({
      status: 'success',
      data: {
        recommendations,
        reason: 'Based on your preferences and order history'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get AI-powered review summary
// @route   POST /api/ai/reviews
// @access  Public
const getReviewSummary = async (req, res) => {
  try {
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        status: 'error',
        message: 'Restaurant ID is required'
      });
    }

    const Review = require('../models/Review.model');
    
    // Get recent reviews for the restaurant
    const reviews = await Review.find({ restaurant: restaurantId })
      .sort('-createdAt')
      .limit(50)
      .populate('user', 'name');

    if (reviews.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          summary: 'No reviews available yet for this restaurant.',
          totalReviews: 0,
          averageRating: 0,
          sentiment: 'neutral'
        }
      });
    }

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    const averageFoodRating = reviews.reduce((sum, r) => sum + (r.foodRating || r.rating), 0) / totalReviews;
    const averageDeliveryRating = reviews.reduce((sum, r) => sum + (r.deliveryRating || r.rating), 0) / totalReviews;

    // Analyze sentiment (simple keyword-based analysis)
    const positiveKeywords = ['excellent', 'amazing', 'great', 'delicious', 'perfect', 'love', 'best', 'wonderful', 'fantastic'];
    const negativeKeywords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'disappointing', 'poor', 'cold', 'late'];

    let positiveCount = 0;
    let negativeCount = 0;

    reviews.forEach(review => {
      const comment = review.comment.toLowerCase();
      positiveKeywords.forEach(word => {
        if (comment.includes(word)) positiveCount++;
      });
      negativeKeywords.forEach(word => {
        if (comment.includes(word)) negativeCount++;
      });
    });

    let sentiment = 'neutral';
    if (positiveCount > negativeCount * 1.5) sentiment = 'positive';
    else if (negativeCount > positiveCount * 1.5) sentiment = 'negative';

    // Extract common themes
    const themes = [];
    if (averageFoodRating > 4) themes.push('Excellent food quality');
    else if (averageFoodRating < 3) themes.push('Food quality needs improvement');
    
    if (averageDeliveryRating > 4) themes.push('Fast and reliable delivery');
    else if (averageDeliveryRating < 3) themes.push('Delivery service needs attention');

    // Generate summary based on analysis
    let summary = '';
    if (averageRating >= 4.5) {
      summary = `Highly rated restaurant with ${totalReviews} reviews. Customers consistently praise the quality and service.`;
    } else if (averageRating >= 4) {
      summary = `Well-regarded restaurant with ${totalReviews} reviews. Most customers have positive experiences.`;
    } else if (averageRating >= 3) {
      summary = `Mixed reviews from ${totalReviews} customers. Some aspects are good, but there's room for improvement.`;
    } else {
      summary = `${totalReviews} reviews indicate areas for improvement in food quality or service.`;
    }

    // Add theme details to summary
    if (themes.length > 0) {
      summary += ' ' + themes.join('. ') + '.';
    }

    res.status(200).json({
      status: 'success',
      data: {
        summary,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        averageFoodRating: Math.round(averageFoodRating * 10) / 10,
        averageDeliveryRating: Math.round(averageDeliveryRating * 10) / 10,
        sentiment,
        themes,
        recentReviews: reviews.slice(0, 5).map(r => ({
          rating: r.rating,
          comment: r.comment,
          userName: r.user.name,
          createdAt: r.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Predict ETA for order delivery
// @route   POST /api/ai/eta
// @access  Public
const predictETA = async (req, res) => {
  try {
    const { restaurantId, deliveryAddress, orderItems } = req.body;

    if (!restaurantId || !deliveryAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Restaurant ID and delivery address are required'
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found'
      });
    }

    // Calculate preparation time based on order complexity
    let prepTime = 15; // Base preparation time in minutes
    
    if (orderItems && orderItems.length > 0) {
      // Add time based on number of items
      prepTime += Math.min(orderItems.length * 3, 20);
      
      // Add time for complex items (if prep time is specified)
      const MenuItem = require('../models/MenuItem.model');
      for (const item of orderItems) {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (menuItem && menuItem.prepTime) {
          prepTime = Math.max(prepTime, menuItem.prepTime);
        }
      }
    }

    // Calculate delivery time based on distance (simplified)
    // In production, use Google Maps API or similar for accurate distance
    let deliveryTime = restaurant.deliveryTime.max || 30;

    // Factor in current time (add buffer during peak hours)
    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 11 && currentHour <= 14) || (currentHour >= 18 && currentHour <= 21);
    
    if (isPeakHour) {
      prepTime += 10;
      deliveryTime += 5;
    }

    const totalMinutes = prepTime + deliveryTime;
    const estimatedDeliveryTime = new Date(Date.now() + totalMinutes * 60000);

    res.status(200).json({
      status: 'success',
      data: {
        prepTime,
        deliveryTime,
        totalMinutes,
        estimatedDeliveryTime,
        isPeakHour,
        confidence: isPeakHour ? 'medium' : 'high',
        message: isPeakHour 
          ? `Peak hours detected. Estimated delivery: ${totalMinutes} minutes` 
          : `Estimated delivery: ${totalMinutes} minutes`
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export {
  chatWithAI,
  getRecommendations,
  getReviewSummary,
  predictETA
};
