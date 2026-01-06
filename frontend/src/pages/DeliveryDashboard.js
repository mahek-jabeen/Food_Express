import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// DEFAULT CENTER FOR SAFETY
const DEFAULT_CENTER = [28.6139, 77.2090];

// Helper function to validate LatLng
function isValidLatLng(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

// Linear interpolation function for smooth movement
function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

// Helper function to interpolate between two coordinates
function interpolateCoords(start, end, progress) {
  return {
    lat: lerp(start.lat, end.lat, progress),
    lng: lerp(start.lng, end.lng, progress)
  };
}

const DeliveryDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  
  // State for moving delivery marker
  const [deliveryPosition, setDeliveryPosition] = useState(null);
  const movementIntervalRef = useRef(null);
  const movementProgressRef = useRef(0);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'delivery') {
      alert('Access Denied: This dashboard is only for delivery partners.');
      navigate('/');
    }
  }, [user, navigate]);

  const fetchDashboardData = useCallback(async () => {
    if (!user || user.role !== 'delivery') {
      return;
    }
    
    try {
      setLoading(true);
      const [statsRes, availableRes, myOrdersRes] = await Promise.all([
        api.get('/delivery/stats'),
        api.get('/delivery/available-orders'),
        api.get('/delivery/my-orders')
      ]);
      
      setStats(statsRes.data.data.stats);
      setAvailableOrders(availableRes.data.data.orders);
      setMyOrders(myOrdersRes.data.data.orders);
      setError('');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (err.response?.status === 403) {
        alert('Access Denied: You do not have permission to access delivery data.');
        navigate('/');
        return;
      }
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  // Calculate real-time stats from myOrders state
  useEffect(() => {
    const completedOrders = myOrders.filter(order => order.status === 'delivered').length;
    const activeOrders = myOrders.filter(order => order.status === 'picked_up' || order.status === 'ready').length;
    const totalEarnings = myOrders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    
    setStats(prev => ({
      ...prev,
      completedOrders,
      activeOrders,
      totalEarnings
    }));
  }, [myOrders]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchLocationData = async (orderId) => {
    if (!orderId) return;
    
    try {
      const res = await api.get(`/orders/${orderId}/location`);
      
      if (res.data && res.data.data) {
        const data = res.data.data;
        setLocationData(data);
        
        if (data.customerLocation?.lat && data.customerLocation?.lng) {
          setMapCenter([data.customerLocation.lat, data.customerLocation.lng]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch location data:', err);
    }
  };

  // Helper function to get valid coordinates with validation
  const getValidCoordinates = (location, fallbackLat = 28.6139, fallbackLng = 77.2090) => {
    if (!location) return [fallbackLat, fallbackLng];
    
    const lat = location.lat || location.latitude;
    const lng = location.lng || location.longitude;
    
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      if (isValidLatLng(numLat, numLng)) {
        return [numLat, numLng];
      }
    }
    
    return [fallbackLat, fallbackLng];
  };

  // Check if map can be rendered safely
  const canRenderMap = () => {
    return isValidLatLng(mapCenter[0], mapCenter[1]);
  };

  // Check if marker can be rendered safely
  const canRenderMarker = (locationData) => {
    if (!locationData?.lat || !locationData?.lng) return false;
    return isValidLatLng(locationData.lat, locationData.lng);
  };

  const handleAcceptOrder = async (orderId) => {
    if (actionLoading) return;
    
    if (!user || user.role !== 'delivery') {
      alert('Access Denied: Only delivery partners can accept orders.');
      return;
    }
    
    try {
      setActionLoading(orderId);
      await api.post(`/delivery/accept/${orderId}`);
      fetchDashboardData();
    } catch (err) {
      console.error('Accept order error:', err);
      if (err.response?.status === 403) {
        alert('Access Denied: You do not have permission to accept orders.');
        return;
      }
      alert(err.response?.data?.message || 'Failed to accept order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    if (actionLoading) return;
    
    if (!user || user.role !== 'delivery') {
      alert('Access Denied: Only delivery partners can update delivery status.');
      return;
    }
    
    try {
      setActionLoading(orderId);
      await api.put(`/delivery/orders/${orderId}/status`, { status: 'delivered' });
      alert('Order marked as delivered!');
      fetchDashboardData();
    } catch (err) {
      console.error('Mark delivered error:', err);
      if (err.response?.status === 403) {
        alert('Access Denied: You do not have permission to update delivery status.');
        return;
      }
      alert(err.response?.data?.message || 'Failed to mark as delivered');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleMarkDeliveredClick = (e, orderId) => {
    e.stopPropagation();
    handleMarkDelivered(orderId);
  };

  const toggleOrderExpansion = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setLocationData(null);
    } else {
      setExpandedOrder(orderId);
      await fetchLocationData(orderId);
    }
  };

  // DEMO LIVE TRACKING - INTERVAL-BASED MOVING DELIVERY MARKER
  useEffect(() => {
    // Clear any existing interval
    if (movementIntervalRef.current) {
      clearInterval(movementIntervalRef.current);
      movementIntervalRef.current = null;
    }

    // Reset progress
    movementProgressRef.current = 0;

    // Get the expanded order to track
    const expandedOrderData = myOrders.find(order => order._id === expandedOrder);
    
    // Start movement only when expanded order is picked_up and location data exists
    if (expandedOrderData?.status === 'picked_up' && locationData?.restaurantLocation && locationData?.customerLocation) {
      console.log('Starting delivery movement simulation for order:', expandedOrder);
      
      // Initialize delivery position at restaurant
      setDeliveryPosition(locationData.restaurantLocation);
      movementProgressRef.current = 0;

      // Start interval to move delivery marker every 3 seconds
      movementIntervalRef.current = setInterval(() => {
        movementProgressRef.current += 0.1; // Move 10% closer each interval

        // Stop when reached customer (100% progress)
        if (movementProgressRef.current >= 1) {
          movementProgressRef.current = 1;
          setDeliveryPosition(locationData.customerLocation);
          
          // Clear interval when delivery is complete
          if (movementIntervalRef.current) {
            clearInterval(movementIntervalRef.current);
            movementIntervalRef.current = null;
          }
          console.log('Delivery movement simulation completed');
          return;
        }

        // Calculate interpolated position between restaurant and customer
        const interpolatedPosition = interpolateCoords(
          locationData.restaurantLocation,
          locationData.customerLocation,
          movementProgressRef.current
        );

        setDeliveryPosition(interpolatedPosition);
        console.log(`Delivery progress: ${Math.round(movementProgressRef.current * 100)}%`);

      }, 3000); // Update every 3 seconds
    }

    // Stop movement when expanded order is delivered
    if (expandedOrderData?.status === 'delivered') {
      console.log('Order delivered, stopping movement');
      if (movementIntervalRef.current) {
        clearInterval(movementIntervalRef.current);
        movementIntervalRef.current = null;
      }
      // Set final position to customer
      if (locationData?.customerLocation) {
        setDeliveryPosition(locationData.customerLocation);
      }
    }

    // Cleanup on unmount or order change
    return () => {
      if (movementIntervalRef.current) {
        clearInterval(movementIntervalRef.current);
        movementIntervalRef.current = null;
      }
    };
  }, [expandedOrder, myOrders, locationData]); // Dependency on expanded order and location data

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-orange-100 text-orange-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    return status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN';
  };

  const formatPrice = (price) => {
    return price ? `₹${parseFloat(price).toFixed(2)}` : '₹0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
          <p className="text-gray-600">Manage your deliveries efficiently</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
                <p className="text-2xl font-bold text-green-600">{formatPrice(stats?.totalEarnings || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Completed Orders</h3>
                <p className="text-2xl font-bold text-blue-600">{stats?.completedOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
                <p className="text-2xl font-bold text-orange-600">{stats?.activeOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Avg Delivery Time</h3>
                <p className="text-2xl font-bold text-purple-600">{stats?.avgDeliveryTime || '0'} min</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">⏱️</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange('available')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'available'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Available Orders ({availableOrders.length})
              </button>
              <button
                onClick={() => handleTabChange('my-orders')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'my-orders'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Orders ({myOrders.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'available' && (
              <div className="space-y-4">
                {availableOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📦</span>
                    </div>
                    <p className="text-gray-500">No available orders at the moment</p>
                    <p className="text-sm text-gray-400">Check back later for new orders</p>
                  </div>
                ) : (
                  availableOrders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">
                            {order.user?.name} • {order.user?.address?.street}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {order.items?.length || 0} items
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">{formatPrice(order.totalAmount)}</p>
                          <p className="text-sm text-gray-500">{formatPrice(order.deliveryFee)} delivery</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleOrderExpansion(order._id)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition"
                        >
                          {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => handleAcceptOrder(order._id)}
                          disabled={actionLoading === order._id}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition"
                        >
                          {actionLoading === order._id ? 'Accepting...' : '✓ Accept Order'}
                        </button>
                      </div>

                      {expandedOrder === order._id && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Order Details</h4>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              <strong>Restaurant:</strong> {order.restaurant?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Customer:</strong> {order.user?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Address:</strong> {order.user?.address?.street}, {order.user?.address?.city}
                            </p>
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                              <ul className="space-y-1">
                                {order.items?.map((item, idx) => (
                                  <li key={idx} className="text-sm text-gray-600">
                                    {item.quantity}x {item.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'my-orders' && (
              <div className="space-y-4">
                {myOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📦</span>
                    </div>
                    <p className="text-gray-500">No active deliveries</p>
                    <p className="text-sm text-gray-400">Accepted orders will appear here</p>
                  </div>
                ) : (
                  myOrders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">
                            {order.user?.name} • {order.user?.address?.street}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {order.items?.length || 0} items
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">{formatPrice(order.totalAmount)}</p>
                          <p className="text-sm text-gray-500">{formatPrice(order.deliveryFee)} delivery</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleOrderExpansion(order._id)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition"
                        >
                          {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                        </button>
                        {order.status === 'picked_up' && (
                          <button
                            onClick={(e) => handleMarkDeliveredClick(e, order._id)}
                            disabled={actionLoading === order._id}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition"
                          >
                            {actionLoading === order._id ? 'Updating...' : '✓ Mark as Delivered'}
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <div className="w-full bg-gray-100 text-gray-600 px-4 py-3 rounded-lg font-semibold text-center">
                            ✓ Delivered
                          </div>
                        )}
                      </div>

                      {expandedOrder === order._id && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Live Tracking Map</h4>
                          
                          {canRenderMap() ? (
                            <div className="h-64 rounded-lg overflow-hidden mb-4">
                              <MapContainer
                                center={mapCenter}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                              >
                                <TileLayer
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                
                                {canRenderMarker(locationData?.restaurantLocation || order.restaurant?.location) && (
                                  <Marker
                                    position={getValidCoordinates(
                                      locationData?.restaurantLocation || order.restaurant?.location,
                                      28.6139, 77.2090
                                    )}
                                  >
                                    <Popup>
                                      <div className="text-sm">
                                        <strong>🍕 Restaurant</strong><br />
                                        {order.restaurant?.name}
                                      </div>
                                    </Popup>
                                  </Marker>
                                )}
                                
                                {canRenderMarker(locationData?.customerLocation || order.user?.address?.coordinates) && (
                                  <Marker
                                    position={getValidCoordinates(
                                      locationData?.customerLocation || order.user?.address?.coordinates,
                                      28.6139, 77.2090
                                    )}
                                  >
                                    <Popup>
                                      <div className="text-sm">
                                        <strong>🏠 Delivery Address</strong><br />
                                        {order.user?.name}<br />
                                        {order.user?.address?.street}, {order.user?.address?.city}
                                      </div>
                                    </Popup>
                                  </Marker>
                                )}
                                
                                {deliveryPosition && isValidLatLng(deliveryPosition.lat, deliveryPosition.lng) && (
                                  <Marker
                                    position={[deliveryPosition.lat, deliveryPosition.lng]}
                                  >
                                    <Popup>
                                      <div className="text-sm">
                                        <strong>🚚 Your Location</strong><br />
                                        <span className="text-green-600">Live Position</span><br />
                                        {order.status === 'picked_up' && (
                                          <span className="text-orange-600">On the way...</span>
                                        )}
                                        {order.status === 'delivered' && (
                                          <span className="text-blue-600">Delivered!</span>
                                        )}
                                      </div>
                                    </Popup>
                                  </Marker>
                                )}
                              </MapContainer>
                            </div>
                          ) : (
                            <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg mb-4">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  </svg>
                                </div>
                                <p className="text-gray-600">Waiting for live location...</p>
                                <p className="text-sm text-gray-500 mt-2">Map will show when location is available</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              <strong>Restaurant:</strong> {order.restaurant?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Customer:</strong> {order.user?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Address:</strong> {order.user?.address?.street}, {order.user?.address?.city}
                            </p>
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                              <ul className="space-y-1">
                                {order.items?.map((item, idx) => (
                                  <li key={idx} className="text-sm text-gray-600">
                                    {item.quantity}x {item.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          {order.status === 'picked_up' && deliveryPosition && (
                            <div className="mt-4 text-center text-green-600 font-medium">
                              🚚 You are on the way to customer
                            </div>
                          )}
                          {order.status === 'delivered' && (
                            <div className="mt-4 text-center text-blue-600 font-medium">
                              ✅ Order delivered successfully!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;