import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const RestaurantDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [error, setError] = useState('');
  const { socket, connected } = useSocket();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  // 🔧 Prevent duplicate useEffect executions in Strict Mode
  const hasSetupListeners = useRef(false);
  const isFetching = useRef(false);
  
  // STRICT ROLE GUARD: Only restaurant users can access this dashboard
  useEffect(() => {
    if (user && user.role !== 'restaurant') {
      console.error('🚫 Access Denied: Only restaurant users can access this dashboard');
      console.error(`🔍 Current user role: ${user.role}, email: ${user.email}`);
      alert(`Access Denied: This dashboard is only for restaurant users. Your role is: ${user.role}`);
      
      // Force logout and redirect to prevent token reuse
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      
      navigate('/login');
      return;
    }
    
    // Additional validation: Ensure restaurantId exists for restaurant users
    if (user && user.role === 'restaurant' && !user.restaurantId) {
      console.error('🚫 Access Denied: Restaurant user missing restaurantId');
      alert('Access Denied: Your restaurant account is not properly configured. Please contact support.');
      navigate('/login');
      return;
    }
    
    console.log(`✅ Restaurant dashboard access granted for: ${user.email} (restaurant: ${user.restaurantId})`);
  }, [user, navigate, setUser]);
  
  // Request notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchRestaurant = useCallback(async () => {
    // Guard: Ensure user is restaurant before making API calls
    if (!user || user.role !== 'restaurant' || !user.restaurantId) {
      console.error('🚫 Restaurant fetch guard: User role is not restaurant or no restaurantId');
      return;
    }
    
    try {
      console.log(`🔄 Fetching restaurant details for: ${user.restaurantId}`);
      
      const res = await api.get(`/restaurants/${user.restaurantId}`);
      
      // Backend returns: { status: "success", data: { restaurant } }
      if (res.data && res.data.data && res.data.data.restaurant) {
        const restaurantData = res.data.data.restaurant;
        setRestaurant(restaurantData);
        console.log(`✅ Loaded restaurant: ${restaurantData.name}`);
      } else {
        console.error('❌ Invalid restaurant response format');
      }
      
    } catch (err) {
      console.error('❌ Failed to fetch restaurant details:', err);
      setError('Failed to load restaurant details');
    }
  }, [user]);

  const fetchOrders = useCallback(async () => {
    // Guard: Ensure user is restaurant before making API calls
    if (!user || user.role !== 'restaurant' || isFetching.current) {
      console.error('🚫 API Guard: User role is not restaurant or already fetching');
      return;
    }
    
    try {
      isFetching.current = true;
      setLoading(true);
      
      console.log(`🔄 Fetching orders for restaurant: ${user.restaurantId} (timestamp: ${Date.now()})`);
      
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/restaurant/stats'),
        api.get('/restaurant/orders') // 🔥 CRITICAL: No params - backend filters by restaurantId automatically
      ]);

      const fetchedOrders = ordersRes.data.data.orders || [];
      
      console.log(`✅ Received ${fetchedOrders.length} orders for restaurant ${user.restaurantId}`);
      console.log(`📊 Order IDs: ${fetchedOrders.map(o => o._id).join(', ')}`);
      
      // 🔥 SINGLE SOURCE OF TRUTH: Replace state completely with backend data
      // No deduplication needed - backend ensures restaurant-specific filtering
      setOrders(fetchedOrders);
      setStats(statsRes.data.data.stats);
      setError('');
      
      // Also fetch restaurant details
      await fetchRestaurant();
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      
      // Handle 403 specifically - wrong role
      if (err.response?.status === 403) {
        alert('Access Denied: You do not have permission to access restaurant data.');
        navigate('/');
        return;
      }
      
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [user, navigate, fetchRestaurant]);

  const fetchStats = useCallback(async () => {
    // Guard: Ensure user is restaurant before making API calls
    if (!user || user.role !== 'restaurant') {
      return;
    }
    
    try {
      const statsRes = await api.get('/restaurant/stats');
      // _t timestamp is added automatically by axios interceptor for cache-busting
      setStats(statsRes.data.data.stats);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debug: Log order count on render
  useEffect(() => {
    console.log(`📊 RestaurantDashboard rendering with ${orders.length} orders (filter: ${selectedStatus || 'all'})`);
    
    // Check for duplicates
    const orderIds = orders.map(o => o._id);
    const uniqueIds = new Set(orderIds);
    if (orderIds.length !== uniqueIds.size) {
      console.error('❌ DUPLICATE ORDERS DETECTED!', {
        total: orderIds.length,
        unique: uniqueIds.size,
        duplicates: orderIds.length - uniqueIds.size
      });
    } else {
      console.log('✅ No duplicate orders in state');
    }
  }, [orders, selectedStatus]);

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
      alert('Access Denied: Only restaurant users can update order status.');
      return;
    }
    
    try {
      console.log(`🔄 Updating order ${orderId} to status: ${newStatus}`);
      
      const response = await api.put(`/restaurant/orders/${orderId}/status`, {
        status: newStatus
      });
      
      console.log('✅ Status updated, waiting for socket signal to refetch');
// DO NOTHING HERE
// Backend will emit `order-changed`
// Socket listener will refetch from backend

      
      console.log(`✅ Order ${orderId} updated successfully to ${newStatus}`);
      
      // Socket will also send update, but this provides instant feedback
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
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextAction = (currentStatus) => {
    const transitions = {
      paid: { next: 'preparing', label: 'Start Preparing', color: 'bg-purple-600 hover:bg-purple-700' },
      preparing: { next: 'ready', label: 'Mark as Ready', color: 'bg-green-600 hover:bg-green-700' }
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

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Restaurant Header */}
      {restaurant && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Restaurant Image */}
            <div className="md:w-1/4 h-48 md:h-auto">
              {restaurant.image ? (
                <img 
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-full bg-gray-200 flex items-center justify-center" style={{display: restaurant.image ? 'none' : 'flex'}}>
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
            </div>
            
            {/* Restaurant Info */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                  <p className="text-gray-600 mb-4">{restaurant.description || 'Manage your restaurant orders and track performance'}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {restaurant.address && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>{restaurant.address}</span>
                      </div>
                    )}
                    
                    {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                        <span>{restaurant.cuisine.join(', ')}</span>
                      </div>
                    )}
                    
                    {restaurant.rating && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        <span>{restaurant.rating.toFixed(1)} ⭐</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {connected && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium">Live Updates Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <Link
            to="/restaurant/dashboard"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
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
            to="/restaurant/reviews"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Reviews
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
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Track and manage incoming orders</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">New Orders (Paid)</p>
                <p className="text-3xl font-bold text-blue-900">{stats.paid || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Preparing</p>
                <p className="text-3xl font-bold text-purple-900">{stats.preparing || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Ready</p>
                <p className="text-3xl font-bold text-green-900">{stats.ready || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {['', 'paid', 'preparing', 'ready'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  selectedStatus === status
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status === '' ? 'All Orders' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedStatus ? `${selectedStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Orders` : 'All Orders'}
            </h2>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <p className="text-gray-600 font-medium">No orders found</p>
              <p className="text-gray-500 text-sm mt-1">Orders will appear here when customers place them</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const nextAction = getNextAction(order.status);
                return (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">#{order.orderNumber}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Customer:</span> {order.user?.name} • {order.user?.phone}
                        </p>
                        <p className="text-sm text-gray-500">{formatTime(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">₹{order.pricing?.total?.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{order.payment?.method?.toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Items:</p>
                      <ul className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600">
                            {item.quantity}x {item.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {order.status === 'paid' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'preparing')}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                          >
                            ✓ Start Preparing
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'rejected')}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                          >
                            ✗ Reject Order
                          </button>
                        </>
                      )}
                      {nextAction && order.status !== 'paid' && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, nextAction.next)}
                          className={`flex-1 ${nextAction.color} text-white px-4 py-2 rounded-lg font-semibold transition`}
                        >
                          {nextAction.label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
