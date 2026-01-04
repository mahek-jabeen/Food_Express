import Cart from '../models/Cart.model.js';
import MenuItem from '../models/MenuItem.model.js';
import Restaurant from '../models/Restaurant.model.js';

// @desc    Get user's cart
// @route   GET /api/cart/:userId
// @access  Private
const getCart = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify user is accessing their own cart
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this cart'
      });
    }

    let cart = await Cart.findOne({ user: userId })
      .populate('restaurant', 'name logo deliveryFee minimumOrder')
      .populate('items.menuItem', 'name image price isAvailable');

    // Create empty cart if doesn't exist
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    res.status(200).json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity, customizations, specialInstructions } = req.body;
    const userId = req.user._id;

    // Validate menu item
    const menuItem = await MenuItem.findById(menuItemId).populate('restaurant');
    
    if (!menuItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found'
      });
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({
        status: 'error',
        message: 'This item is currently unavailable'
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        restaurant: menuItem.restaurant._id,
        items: []
      });
    }

    // Check if cart is from different restaurant
    if (cart.restaurant && cart.restaurant.toString() !== menuItem.restaurant._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot add items from different restaurants. Please clear your cart first.',
        data: {
          currentRestaurant: cart.restaurant,
          newRestaurant: menuItem.restaurant._id
        }
      });
    }

    // Set restaurant if first item
    if (!cart.restaurant) {
      cart.restaurant = menuItem.restaurant._id;
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.menuItem.toString() === menuItemId &&
      JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity || 1;
    } else {
      // Add new item
      cart.items.push({
        menuItem: menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: quantity || 1,
        image: menuItem.image,
        customizations: customizations || [],
        specialInstructions: specialInstructions || ''
      });
    }

    // Update delivery fee
    cart.deliveryFee = menuItem.restaurant.deliveryFee;

    await cart.save();

    // Populate for response
    await cart.populate([
      { path: 'restaurant', select: 'name logo deliveryFee minimumOrder' },
      { path: 'items.menuItem', select: 'name image price isAvailable' }
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Item added to cart',
      data: { cart }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/item/:itemId
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found in cart'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    await cart.populate([
      { path: 'restaurant', select: 'name logo deliveryFee minimumOrder' },
      { path: 'items.menuItem', select: 'name image price isAvailable' }
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Cart item updated',
      data: { cart }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:itemId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    // Clear restaurant if cart is empty
    if (cart.items.length === 0) {
      cart.restaurant = null;
      cart.deliveryFee = 0;
    }

    await cart.save();

    await cart.populate([
      { path: 'restaurant', select: 'name logo deliveryFee minimumOrder' },
      { path: 'items.menuItem', select: 'name image price isAvailable' }
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart',
      data: { cart }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/:userId
// @access  Private
const clearCart = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify user is clearing their own cart
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to clear this cart'
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    cart.items = [];
    cart.restaurant = null;
    cart.deliveryFee = 0;
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared successfully',
      data: { cart }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
