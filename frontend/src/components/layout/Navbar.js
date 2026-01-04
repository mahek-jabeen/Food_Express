import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">FoodXpress</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Show Home only for customers and non-authenticated users */}
            {(!isAuthenticated || user?.role === 'customer' || user?.role === 'admin') && (
              <Link to="/" className="text-gray-700 hover:text-primary-600 transition">
                Home
              </Link>
            )}
            
            {isAuthenticated && (
              <>
                {/* Customer Menu */}
                {(user?.role === 'customer' || user?.role === 'admin') && (
                  <>
                    <Link to="/orders" className="text-gray-700 hover:text-primary-600 transition">
                      My Orders
                    </Link>
                    <Link to="/reviews" className="text-gray-700 hover:text-primary-600 transition">
                      Reviews
                    </Link>
                  </>
                )}
                
                {/* Restaurant Menu */}
                {user?.role === 'restaurant' && (
                  <Link to="/restaurant/dashboard" className="text-gray-700 hover:text-primary-600 transition font-semibold">
                    📊 Dashboard
                  </Link>
                )}
                
                {/* Delivery Menu */}
                {user?.role === 'delivery' && (
                  <Link to="/delivery/dashboard" className="text-gray-700 hover:text-primary-600 transition font-semibold">
                    🚚 Dashboard
                  </Link>
                )}
              </>
            )}

            {/* Show cart only for customers */}
            {(!isAuthenticated || user?.role === 'customer' || user?.role === 'admin') && (
              <Link to="/cart" className="relative text-gray-700 hover:text-primary-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-700 hover:text-primary-600 transition flex items-center gap-2">
                  <span>{user?.name}</span>
                  {user?.role === 'restaurant' && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                      Restaurant
                    </span>
                  )}
                  {user?.role === 'delivery' && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                      Delivery
                    </span>
                  )}
                  {user?.role === 'admin' && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">
                      Admin
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Show Home only for customers */}
            {(!isAuthenticated || user?.role === 'customer' || user?.role === 'admin') && (
              <Link
                to="/"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
            )}
            
            {isAuthenticated && (
              <>
                {/* Customer Menu */}
                {(user?.role === 'customer' || user?.role === 'admin') && (
                  <>
                    <Link
                      to="/orders"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/reviews"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Reviews
                    </Link>
                  </>
                )}
                
                {/* Restaurant Menu */}
                {user?.role === 'restaurant' && (
                  <Link
                    to="/restaurant/dashboard"
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded font-semibold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📊 Restaurant Dashboard
                  </Link>
                )}
                
                {/* Delivery Menu */}
                {user?.role === 'delivery' && (
                  <Link
                    to="/delivery/dashboard"
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded font-semibold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🚚 Delivery Dashboard
                  </Link>
                )}
                
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile ({user?.role})
                </Link>
              </>
            )}
            
            {/* Show cart only for customers */}
            {(!isAuthenticated || user?.role === 'customer' || user?.role === 'admin') && (
              <Link
                to="/cart"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cart ({getItemCount()})
              </Link>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
