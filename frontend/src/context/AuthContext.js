import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

// Create a separate context for cart clearing to avoid circular dependency
let cartClearCallback = null;

export const registerCartClearCallback = (callback) => {
  cartClearCallback = callback;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    try {
      // IMPORTANT: Clear any existing token/user before login
      // This prevents token reuse across different roles
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      
      console.log(`🔐 Logging in as role: ${role}`);
      
      const response = await api.post('/auth/login', { email, password, role });
      const { user: userData, token } = response.data.data;
      
      // Validate that backend returned the correct role
      if (userData.role !== role) {
        console.error(`⚠️ Role mismatch! Requested: ${role}, Received: ${userData.role}`);
        return {
          success: false,
          error: `Role mismatch: Expected ${role} but got ${userData.role}`
        };
      }
      
      console.log(`✅ Login successful as ${userData.role}: ${userData.email}`);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data?.message || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    console.log(`🚪 Logging out user: ${user?.email} (${user?.role})`);
    
    // IMPORTANT: Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    // Clear cart on logout
    if (cartClearCallback) {
      cartClearCallback();
    }
    
    console.log('✅ Logout complete - all tokens cleared');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
