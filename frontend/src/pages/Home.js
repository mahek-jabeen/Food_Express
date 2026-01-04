import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import RestaurantCard from '../components/RestaurantCard';
import AIChatbot from '../components/AIChatbot';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const cuisines = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'American', 'Thai', 'Mediterranean'];
  const priceRanges = ['$', '$$', '$$$', '$$$$'];

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCuisine) params.append('cuisine', selectedCuisine);
      if (priceRange) params.append('priceRange', priceRange);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/restaurants?${params.toString()}`);
      // Backend returns: { status: "success", data: { restaurants: [...] } }
      const restaurantsData = response.data?.data?.restaurants || [];
      setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [selectedCuisine, priceRange, searchTerm]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Delicious Food, Delivered Fast
            </h1>
            <p className="text-xl mb-8">
              Powered by us to find your perfect meal
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex bg-white rounded-lg shadow-lg overflow-hidden">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for restaurants or dishes..."
                  className="flex-1 px-6 py-4 text-gray-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 px-8 py-4 text-white font-semibold transition"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Cuisine</label>
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">All Cuisines</option>
              {cuisines.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">All Prices</option>
              {priceRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          {(selectedCuisine || priceRange) && (
            <button
              onClick={() => {
                setSelectedCuisine('');
                setPriceRange('');
              }}
              className="mt-6 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : restaurants.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'Available Restaurants'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant._id} restaurant={restaurant} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No restaurants found. Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
};

export default Home;
