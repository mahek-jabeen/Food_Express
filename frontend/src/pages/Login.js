import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.role) {
      setError('Please select your role');
      return;
    }
    
    setLoading(true);

    const result = await login(formData.email, formData.password, formData.role);
    
    if (result.success) {
      // Role-based redirect after login
      const userRole = result.user?.role;
      
      if (userRole === 'restaurant') {
        navigate('/restaurant/dashboard');
      } else if (userRole === 'delivery') {
        navigate('/delivery/dashboard');
      } else if (userRole === 'admin') {
        navigate('/restaurant/dashboard'); // or admin dashboard if exists
      } else {
        navigate('/'); // customer goes to home
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back!</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
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
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition ${
                    formData.role === 'customer'
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
                      checked={formData.role === 'customer'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="role-customer" className="ml-3 cursor-pointer">
                      <span className="block text-sm font-semibold text-gray-900">Customer</span>
                      <span className="block text-xs text-gray-600">Order food</span>
                    </label>
                  </div>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, role: 'restaurant' })}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition ${
                    formData.role === 'restaurant'
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
                      checked={formData.role === 'restaurant'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="role-restaurant" className="ml-3 cursor-pointer">
                      <span className="block text-sm font-semibold text-gray-900">Restaurant</span>
                      <span className="block text-xs text-gray-600">Manage restaurant</span>
                    </label>
                  </div>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, role: 'delivery' })}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition ${
                    formData.role === 'delivery'
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
                      checked={formData.role === 'delivery'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="role-delivery" className="ml-3 cursor-pointer">
                      <span className="block text-sm font-semibold text-gray-900">Delivery</span>
                      <span className="block text-xs text-gray-600">Deliver orders</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
