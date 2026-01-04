import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AddFoodItem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // STRICT ROLE GUARD: Only restaurant users can access this page
  useEffect(() => {
    if (user && user.role !== 'restaurant') {
      console.error('🚫 Access Denied: Only restaurant users can access this page');
      console.error(`🔍 Current user role: ${user.role}, email: ${user.email}`);
      alert(`Access Denied: This page is only for restaurant users. Your role is: ${user.role}`);
      
      // Force logout and redirect to prevent token reuse
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      
      window.location.href = '/login';
      return;
    }
    
    // Additional validation: Ensure restaurantId exists for restaurant users
    if (user && user.role === 'restaurant' && !user.restaurantId) {
      console.error('🚫 Access Denied: Restaurant user missing restaurantId');
      alert('Access Denied: Your restaurant account is not properly configured. Please contact support.');
      window.location.href = '/login';
      return;
    }
    
    console.log(`✅ Add food item access granted for: ${user.email} (restaurant: ${user.restaurantId})`);
  }, [user, setUser, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    image: '',
    isVeg: false,
    isAvailable: true
  });

  const categories = [
    'Appetizer',
    'Main Course',
    'Dessert',
    'Beverage',
    'Side',
    'Salad',
    'Soup',
    'Special',
    'Pizza',
    'Burger',
    'Sandwich',
    'Biryani',
    'Coffee',
    'Snacks'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Guard: Ensure user is restaurant before making API calls
    if (!user || user.role !== 'restaurant') {
      alert('Access Denied: Only restaurant users can add food items.');
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      setError('Food item name is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    setLoading(true);

    try {
      console.log(`🍽️ Adding food item for restaurant: ${user.restaurantId}`);
      
      // Prepare data with restaurantId
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        restaurant: user.restaurantId // This maps to restaurantId in the schema
      };

      const response = await api.post('/menu', itemData);
      
      console.log('✅ Food item added successfully');
      console.log('📊 Add item API response:', response.data.status);
      setSuccess('Food item added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Main Course',
        image: '',
        isVeg: false,
        isAvailable: true
      });

      // Redirect to menu management after 2 seconds
      setTimeout(() => {
        navigate('/restaurant/menu');
      }, 2000);

    } catch (err) {
      console.error('❌ Failed to add food item:', err);
      
      // Handle 403 specifically - wrong role
      if (err.response?.status === 403) {
        alert('Access Denied: You do not have permission to add food items.');
        return;
      }
      
      setError(err.response?.data?.message || 'Failed to add food item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Navigation */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <Link
            to="/restaurant/dashboard"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/restaurant/orders"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Orders
          </Link>
          <Link
            to="/restaurant/add-item"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            Add Food Item
          </Link>
          <Link
            to="/restaurant/menu"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Menu Management
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Food Item</h1>
        <p className="text-gray-600 mt-1">Add a new item to your restaurant menu</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Food Item Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Food Item Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
              placeholder="e.g., Butter Chicken"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
              placeholder="Describe your food item..."
            />
          </div>

          {/* Price and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                placeholder="299.00"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
              placeholder="https://example.com/food-image.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional: Add a URL for the food item image
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isVeg"
                name="isVeg"
                checked={formData.isVeg}
                onChange={handleChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="isVeg" className="ml-3 block text-sm text-gray-700">
                Vegetarian
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="isAvailable" className="ml-3 block text-sm text-gray-700">
                Available for ordering
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Food Item...
                </span>
              ) : (
                'Add Food Item'
              )}
            </button>

            <Link
              to="/restaurant/menu"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFoodItem;
