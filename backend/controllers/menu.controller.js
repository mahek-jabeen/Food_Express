import MenuItem from '../models/MenuItem.model.js';
import Restaurant from '../models/Restaurant.model.js';

// @desc    Get menu items for a restaurant
// @route   GET /api/menu/:restaurantId
// @route   GET /api/restaurants/:id/menu
// @access  Public
const getMenuItems = async (req, res) => {
  try {
    const { category, search, isVegetarian, isVegan, isGlutenFree } = req.query;
    
    // Support both route patterns
    const restaurantId = req.params.restaurantId || req.params.id;
    
    let query = { 
      restaurant: restaurantId,
      isAvailable: true 
    };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isVegetarian === 'true') {
      query.isVegetarian = true;
    }

    if (isVegan === 'true') {
      query.isVegan = true;
    }

    if (isGlutenFree === 'true') {
      query.isGlutenFree = true;
    }

    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'name')
      .sort('category name');

    res.status(200).json({
      status: 'success',
      results: menuItems.length,
      data: { menuItems }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/item/:id
// @access  Public
const getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('restaurant', 'name address phone');

    if (!menuItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { menuItem }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private (Restaurant Owner/Admin)
const createMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.body.restaurant || req.body.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found'
      });
    }

    // Check ownership (if owner exists)
    if (restaurant.owner && restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to add menu items to this restaurant'
      });
    }

    const menuItem = await MenuItem.create({ ...req.body, restaurant: restaurant._id });

    // Maintain the denormalized menuItems array on Restaurant
    restaurant.menuItems = restaurant.menuItems || [];
    restaurant.menuItems.push(menuItem._id);
    await restaurant.save();

    res.status(201).json({
      status: 'success',
      data: { menuItem }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (Restaurant Owner/Admin)
const updateMenuItem = async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found'
      });
    }

    // Check ownership
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this menu item'
      });
    }

    menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: { menuItem }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Restaurant Owner/Admin)
const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found'
      });
    }

    // Check ownership (if owner exists)
    if (menuItem.restaurant.owner && menuItem.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this menu item'
      });
    }

    // Remove reference from Restaurant.menuItems
    await Restaurant.findByIdAndUpdate(menuItem.restaurant._id, { $pull: { menuItems: menuItem._id } });

    await menuItem.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
