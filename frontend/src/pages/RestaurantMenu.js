import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MenuItemCard from '../components/MenuItemCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ImageWithFallback, { DEFAULT_RESTAURANT_IMAGE } from '../components/ImageWithFallback';

const RestaurantMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchRestaurantDetails = useCallback(async () => {
    try {
      const response = await api.get(`/restaurants/${id}`);
      setRestaurant(response.data.data.restaurant);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  }, [id]);

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/menu/${id}`);
      setMenuItems(response.data.data.menuItems);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRestaurantDetails();
    fetchMenuItems();
  }, [fetchRestaurantDetails, fetchMenuItems]);

  const handleAddToCart = (item) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (restaurant) {
      addToCart(item, restaurant);
      // Show success message (you could use a toast library here)
      alert(`${item.name} added to cart!`);
    }
  };

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading || !restaurant) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-6">
            <ImageWithFallback
              src={restaurant.logo || restaurant.image}
              alt={restaurant.name}
              fallback={DEFAULT_RESTAURANT_IMAGE}
              className="w-32 h-32 rounded-lg object-cover shadow-md"
            />
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
                {!restaurant.isOpen && (
                  <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
                    Closed
                  </span>
                )}
              </div>
              
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center text-yellow-400">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="ml-1 text-gray-900 font-semibold">{restaurant.rating.toFixed(1)}</span>
                  <span className="ml-1 text-gray-600">({restaurant.totalReviews} reviews)</span>
                </div>
                <span className="text-gray-600">{restaurant.priceRange}</span>
                <span className="text-gray-600">{restaurant.cuisine.join(', ')}</span>
              </div>

              <p className="text-gray-600 mt-3">{restaurant.description}</p>

              <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {restaurant.deliveryTime.min}-{restaurant.deliveryTime.max} min
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Delivery: ${restaurant.deliveryFee === 0 ? 'Free' : restaurant.deliveryFee.toFixed(2)}
                </div>
                <div className="flex items-center">
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>

  {/* FIXED ADDRESS HANDLING */}
  {restaurant.address && typeof restaurant.address === "object"
    ? `${restaurant.address.city || "City not available"}, ${restaurant.address.state || "State not available"}`
    : restaurant.address || restaurant.location || "Location not available"}
</div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        {filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item._id}
                item={item}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No items available in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantMenu;
