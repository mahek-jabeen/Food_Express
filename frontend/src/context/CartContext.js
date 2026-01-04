import React, { createContext, useState, useContext, useEffect } from 'react';
import { registerCartClearCallback } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    const savedRestaurant = localStorage.getItem('cartRestaurant');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    if (savedRestaurant) {
      setRestaurant(JSON.parse(savedRestaurant));
    }
  }, []);

  useEffect(() => {
    // Register cart clear callback for logout
    const clearCart = () => {
      setCartItems([]);
      setRestaurant(null);
      localStorage.removeItem('cart');
      localStorage.removeItem('cartRestaurant');
    };
    
    registerCartClearCallback(clearCart);
  }, []);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
    if (restaurant) {
      localStorage.setItem('cartRestaurant', JSON.stringify(restaurant));
    }
  }, [cartItems, restaurant]);

  const addToCart = (item, restaurantData) => {
    // Check if adding from different restaurant
    if (restaurant && restaurant._id !== restaurantData._id) {
      const confirm = window.confirm(
        'Your cart contains items from another restaurant. Do you want to clear it and add this item?'
      );
      if (!confirm) return;
      setCartItems([]);
    }

    setRestaurant(restaurantData);

    // Check if item already exists
    const existingIndex = cartItems.findIndex(
      (cartItem) => cartItem._id === item._id
    );

    if (existingIndex > -1) {
      const updatedCart = [...cartItems];
      updatedCart[existingIndex].quantity += item.quantity || 1;
      setCartItems(updatedCart);
    } else {
      setCartItems([...cartItems, { ...item, quantity: item.quantity || 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter((item) => item._id !== itemId);
    setCartItems(updatedCart);
    
    if (updatedCart.length === 0) {
      setRestaurant(null);
      localStorage.removeItem('cartRestaurant');
    }
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cartItems.map((item) =>
      item._id === itemId ? { ...item, quantity } : item
    );
    setCartItems(updatedCart);
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurant(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartRestaurant');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    restaurant,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
