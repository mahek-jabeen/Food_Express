import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const RestaurantOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const { socket, connected } = useSocket();
  const { user, setUser } = useAuth();
  
  // 🔧 Prevent duplicate useEffect executions in Strict Mode
  const hasSetupListeners = useRef(false);
  const isFetching = useRef(false);

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
    
    console.log(`✅ Restaurant orders access granted for: ${user.email} (restaurant: ${user.restaurantId})`);
  }, [user, setUser]);

  const fetchOrders = useCallback(async () => {
    // Guard: Ensure user is restaurant before making API calls
    if (!user || user.role !== 'restaurant' || isFetching.current) {
      console.error('🚫 API Guard: User role is not restaurant or already fetching');
      return;
    }
    
    try {
      isFetching.current = true;
      setLoading(true);
      
      console.log(`🔄 Fetching orders for restaurant: ${user.restaurantId}`);
      
      const ordersRes = await api.get('/restaurant/orders');

      const fetchedOrders = ordersRes.data.data.orders || [];
      
      console.log(`✅ Received ${fetchedOrders.length} orders for restaurant ${user.restaurantId}`);
      
      // 🔥 SINGLE SOURCE OF TRUTH: Replace state completely with backend data
      setOrders(fetchedOrders);
      setError('');
    } catch (err) {
      console.error('Orders fetch error:', err);
      
      // Handle 403 specifically - wrong role
      if (err.response?.status === 403) {
        alert('Access Denied: You do not have permission to access restaurant data.');
        window.location.href = '/';
        return;
      }
      
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 🔔 Real-time updates (Restaurant)
  useEffect(() => {
    if (!socket || !user || user.role !== 'restaurant' || hasSetupListeners.current) return;

    console.log('🍽️ Setting up restaurant socket listeners');

    const handleNewOrder = () => {
      console.log('🆕 new-order received → refetching orders');
      fetchOrders();
    };

    const handleOrderUpdated = () => {
      console.log('🔄 order-updated received → refetching orders');
      fetchOrders();
    };

    const handleOrderReady = () => {
      console.log('📦 order-ready received → refetching orders');
      fetchOrders();
    };

    // Attach listeners
    socket.on('new-order', handleNewOrder);
    socket.on('order-updated', handleOrderUpdated);
    socket.on('order-ready', handleOrderReady);
    
    // Mark as set up to prevent duplicates
    hasSetupListeners.current = true;

    return () => {
      console.log('🧹 Cleaning up restaurant socket listeners');
      socket.off('new-order', handleNewOrder);
      socket.off('order-updated', handleOrderUpdated);
      socket.off('order-ready', handleOrderReady);
      hasSetupListeners.current = false;
    };
  }, [socket, user, fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    // Guard: Ensure user is restaurant before making API calls
    if (!user || user.role !== 'restaurant') {
      console.error('🚫 Access Denied: Only restaurant users can update order status.');
      console.error(`🔍 Attempted by user: ${user?.email}, role: ${user?.role}`);
      alert('Access Denied: Only restaurant users can update order status.');
      return;
    }
    
    // Additional validation: Ensure restaurantId exists
    if (!user.restaurantId) {
      console.error('🚫 Access Denied: Restaurant user missing restaurantId');
      alert('Access Denied: Your restaurant account is not properly configured.');
      return;
    }
    
    console.log(`🔄 Restaurant ${user.email} updating order ${orderId} to status: ${newStatus}`);
    
    try {
      console.log(`🔄 Updating order ${orderId} to status: ${newStatus}`);
      
      setUpdatingOrderId(orderId);
      
      const response = await api.put(`/restaurant/orders/${orderId}/status`, {
        status: newStatus
      });
      
      console.log('✅ Status updated, waiting for socket signal to refetch');
      console.log('📊 Order status API response:', response.data.status);
      
      // Socket will emit update automatically, but this provides instant feedback
    } catch (err) {
      console.error('Status update error:', err);
      
      // Handle 403 specifically - wrong role
      if (err.response?.status === 403) {
        alert('Access Denied: You do not have permission to update order status.');
        return;
      }
      
      alert(err.response?.data?.message || 'Failed to update order status');
      // Refresh on error to ensure consistency with backend
      console.log('⚠️ Error occurred, refreshing from backend to ensure consistency');
      fetchOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextAction = (currentStatus) => {
    const transitions = {
      paid: { next: 'preparing', label: 'Start Preparing', color: 'bg-purple-600 hover:bg-purple-700' },
      preparing: { next: 'ready', label: 'Mark as Ready', color: 'bg-green-600 hover:bg-green-700' },
      ready: { next: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-indigo-600 hover:bg-indigo-700' },
      out_for_delivery: { next: 'delivered', label: 'Mark as Delivered', color: 'bg-gray-600 hover:bg-gray-700' }
    };
    return transitions[currentStatus];
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
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
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
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
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Menu Management
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Orders</h1>
          <p className="text-gray-600 mt-1">Manage all your restaurant orders</p>
        </div>
        {connected && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">Live Updates Active</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders ({orders.length})</h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">When customers place orders, they will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => {
              const nextAction = getNextAction(order.status);
              
              return (
                <div key={order._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          Order #{order._id.slice(-8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Customer:</span> {order.user?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Phone:</span> {order.user?.phone || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Email:</span> {order.user?.email || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Total:</span> ₹{order.totalAmount || order.total || 0}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Placed:</span> {formatTime(order.createdAt)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Items:</span> {order.items?.length || 0}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items:</h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                  {item.menuItem?.image && (
                                    <img 
                                      src={item.menuItem.image} 
                                      alt={item.menuItem.name}
                                      className="w-8 h-8 object-cover rounded"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  )}
                                  <span className="font-medium">{item.quantity}x</span>
                                  <span>{item.menuItem?.name || item.name || 'Item'}</span>
                                </div>
                                <span className="text-gray-600">₹{item.price || 0}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delivery Address */}
                      {order.deliveryAddress && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Address:</h4>
                          <p className="text-sm text-gray-600">
                            {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.zipCode}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-6">
                      {nextAction && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, nextAction.next)}
                          disabled={updatingOrderId === order._id || user?.role !== 'restaurant'}
                          className={`px-4 py-2 text-white rounded-lg transition font-medium ${
                            updatingOrderId === order._id || user?.role !== 'restaurant'
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : nextAction.color
                          }`}
                        >
                          {user?.role !== 'restaurant' ? (
                            'Access Denied'
                          ) : updatingOrderId === order._id ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </span>
                          ) : (
                            nextAction.label
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantOrders;
