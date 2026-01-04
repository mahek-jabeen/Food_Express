import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MenuManagement = () => {
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingItemId, setDeletingItemId] = useState(null);
  const { user, setUser } = useAuth();

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
    
    console.log(`✅ Menu management access granted for: ${user.email} (restaurant: ${user.restaurantId})`);
  }, [user, setUser]);

  const fetchMenuItems = useCallback(async () => {
    // Guard: Ensure user is restaurant before making API calls
    if (!user || user.role !== 'restaurant' || !user.restaurantId) {
      console.error('🚫 Menu fetch guard: User role is not restaurant or no restaurantId');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`🔄 Fetching menu items for restaurant: ${user.restaurantId}`);
      
      const response = await api.get(`/menu/${user.restaurantId}`);
      
      // Backend returns: { status: "success", data: { menuItems } }
      const itemsData = response.data.data.menuItems || [];
      setMenuItems(Array.isArray(itemsData) ? itemsData : []);
      
      console.log(`✅ Loaded ${itemsData.length} menu items`);
      console.log('📊 Menu API response:', response.data.status);
      setError('');
    } catch (err) {
      console.error('❌ Failed to fetch menu items:', err);
      setError(err.response?.data?.message || 'Failed to load menu items');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) {
      return;
    }

    // Guard: Ensure user is restaurant before making API calls
    if (!user || user.role !== 'restaurant') {
      alert('Access Denied: Only restaurant users can delete food items.');
      return;
    }

    try {
      setDeletingItemId(itemId);
      console.log(`🗑️ Deleting menu item: ${itemId}`);
      
      await api.delete(`/menu/item/${itemId}`);
      
      console.log('✅ Menu item deleted successfully');
      setSuccess('Food item deleted successfully!');
      
      // Refresh the menu items list
      await fetchMenuItems();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('❌ Failed to delete menu item:', err);
      
      // Handle 403 specifically - wrong role
      if (err.response?.status === 403) {
        alert('Access Denied: You do not have permission to delete this item.');
        return;
      }
      
      setError(err.response?.data?.message || 'Failed to delete food item');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    // Guard: Ensure user is restaurant before making API calls
    if (!user || user.role !== 'restaurant') {
      alert('Access Denied: Only restaurant users can update food items.');
      return;
    }

    try {
      console.log(`🔄 Toggling availability for item: ${itemId}`);
      
      await api.put(`/menu/item/${itemId}`, {
        isAvailable: !currentStatus
      });
      
      console.log('✅ Item availability updated successfully');
      
      // Refresh the menu items list
      await fetchMenuItems();
      
    } catch (err) {
      console.error('❌ Failed to update item availability:', err);
      
      // Handle 403 specifically - wrong role
      if (err.response?.status === 403) {
        alert('Access Denied: You do not have permission to update this item.');
        return;
      }
      
      setError(err.response?.data?.message || 'Failed to update item availability');
    }
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Appetizer': 'bg-blue-100 text-blue-800',
      'Main Course': 'bg-green-100 text-green-800',
      'Dessert': 'bg-pink-100 text-pink-800',
      'Beverage': 'bg-purple-100 text-purple-800',
      'Side': 'bg-yellow-100 text-yellow-800',
      'Salad': 'bg-orange-100 text-orange-800',
      'Soup': 'bg-red-100 text-red-800',
      'Special': 'bg-indigo-100 text-indigo-800',
      'Pizza': 'bg-gray-100 text-gray-800',
      'Burger': 'bg-amber-100 text-amber-800',
      'Sandwich': 'bg-teal-100 text-teal-800',
      'Biryani': 'bg-cyan-100 text-cyan-800',
      'Coffee': 'bg-brown-100 text-brown-800',
      'Snacks': 'bg-lime-100 text-lime-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Loading state
  if (loading && menuItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
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
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Add Food Item
          </Link>
          <Link
            to="/restaurant/menu"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            Menu Management
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant's food items</p>
        </div>
        <Link
          to="/restaurant/add-item"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
        >
          Add New Item
        </Link>
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

      {/* Menu Items Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Menu Items ({menuItems.length})
          </h2>
        </div>

        {menuItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first food item</p>
            <Link
              to="/restaurant/add-item"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {menuItems.map((item) => (
              <div key={item._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                {/* Item Image */}
                <div className="h-48 bg-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-orange-600">{formatPrice(item.price)}</span>
                    <div className="flex items-center gap-2">
                      {item.isVeg && (
                        <span className="text-green-600 text-sm font-medium">🌱 Veg</span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        item.isAvailable
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      disabled={deletingItemId === item._id}
                      className="px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingItemId === item._id ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;
