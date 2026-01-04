import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: '',
    restaurantId: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch restaurants when role is set to restaurant
  useEffect(() => {
    if (role === 'restaurant') {
      fetchRestaurants();
    }
  }, [role]);

  const fetchRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      const res = await api.get('/restaurants');
      const restaurantsData = res.data.data.restaurants;
      setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : []);
    } catch (err) {
      console.error('Failed to load restaurants', err);
      setError('Failed to load restaurants');
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const handleRoleClick = (selectedRole) => {
    setRole(selectedRole);
    setFormData({ ...formData, role: selectedRole });
    // Reset restaurantId when role changes
    if (selectedRole !== 'restaurant') {
      setRestaurantId('');
      setFormData({ ...formData, role: selectedRole, restaurantId: '' });
    }
  };

  const handleRestaurantChange = (e) => {
    const value = e.target.value;
    setRestaurantId(value);
    setFormData({ ...formData, restaurantId: value });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [addressField]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!role) {
      setError('Please select your role');
      return;
    }

    if (role === 'restaurant' && !restaurantId) {
      setError('Please select a restaurant');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    
    // Add restaurantId only for restaurant role
    if (role === 'restaurant') {
      registerData.restaurantId = restaurantId;
    }
    
    const result = await register(registerData);
    
    if (result.success) {
      const userRole = result.user?.role || registerData.role;
      
      if (userRole === 'restaurant') {
        navigate('/restaurant/dashboard');
      } else if (userRole === 'delivery') {
        navigate('/delivery/dashboard');
      } else if (userRole === 'admin') {
        navigate('/restaurant/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="text-gray-600 mt-2">Join FoodXpress AI today</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Role *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => handleRoleClick('customer')}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition ${
                    role === 'customer'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="role-customer"
                      name="role"
                      value="customer"
                      checked={role === 'customer'}
                      onChange={() => handleRoleClick('customer')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="role-customer" className="ml-3 cursor-pointer">
                      <span className="block text-sm font-semibold text-gray-900">Customer</span>
                      <span className="block text-xs text-gray-600">Order food from restaurants</span>
                    </label>
                  </div>
                </div>

                <div
                  onClick={() => handleRoleClick('restaurant')}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition ${
                    role === 'restaurant'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="role-restaurant"
                      name="role"
                      value="restaurant"
                      checked={role === 'restaurant'}
                      onChange={() => handleRoleClick('restaurant')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="role-restaurant" className="ml-3 cursor-pointer">
                      <span className="block text-sm font-semibold text-gray-900">Restaurant</span>
                      <span className="block text-xs text-gray-600">Manage your restaurant</span>
                    </label>
                  </div>
                </div>

                <div
                  onClick={() => handleRoleClick('delivery')}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition ${
                    role === 'delivery'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="role-delivery"
                      name="role"
                      value="delivery"
                      checked={role === 'delivery'}
                      onChange={() => handleRoleClick('delivery')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="role-delivery" className="ml-3 cursor-pointer">
                      <span className="block text-sm font-semibold text-gray-900">Delivery</span>
                      <span className="block text-xs text-gray-600">Deliver orders to customers</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Restaurant Selection Dropdown */}
            {role === 'restaurant' && (
              <div>
                <label htmlFor="restaurantId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Restaurant *
                </label>
                {loadingRestaurants ? (
                  <p className="text-sm text-gray-600">Loading restaurants...</p>
                ) : (
                  <select
                    id="restaurantId"
                    name="restaurantId"
                    value={restaurantId}
                    onChange={handleRestaurantChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="">Select a restaurant...</option>
                    {restaurants.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    id="address.street"
                    name="address.street"
                    type="text"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      id="address.city"
                      name="address.city"
                      type="text"
                      value={formData.address.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      id="address.state"
                      name="address.state"
                      type="text"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="NY"
                    />
                  </div>

                  <div>
                    <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      id="address.zipCode"
                      name="address.zipCode"
                      type="text"
                      value={formData.address.zipCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;