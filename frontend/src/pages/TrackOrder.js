import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const TrackOrder = () => {
  console.log("TrackOrder mounted");
  
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initialize state safely
  const [order, setOrder] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for moving delivery marker
  const [deliveryPosition, setDeliveryPosition] = useState(null);
  const movementIntervalRef = useRef(null);
  const movementProgressRef = useRef(0);

  // Fetch order data
  const fetchOrder = async () => {
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    try {
      console.log(`📡 Fetching order: ${orderId}`);
      const res = await api.get(`/orders/${orderId}`);
      
      if (res.data && res.data.data && res.data.data.order) {
        setOrder(res.data.data.order);
        console.log('✅ Order data loaded:', res.data.data.order);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('❌ Failed to fetch order:', err);
      if (err.response?.status === 404) {
        setError('Order not found');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to load order');
      }
    }
  };

  // Fetch location data
  const fetchLocation = async () => {
    if (!orderId) return;

    try {
      console.log(`📍 Fetching location: ${orderId}`);
      const res = await api.get(`/orders/${orderId}/location`);
      
      if (res.data && res.data.data) {
        setLocation(res.data.data);
        console.log('✅ Location data loaded:', res.data.data);
      }
    } catch (err) {
      console.error('❌ Failed to fetch location:', err);
      // Don't set error for location failures - it's optional
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    await Promise.all([
      fetchOrder(),
      fetchLocation()
    ]);
    
    setLoading(false);
  };

  // Compute map center SAFELY with validation
  const getMapCenter = () => {
    if (location?.customerLocation?.lat && location?.customerLocation?.lng) {
      const { lat, lng } = location.customerLocation;
      if (isValidLatLng(lat, lng)) {
        return [lat, lng];
      }
    }
    
    if (location?.restaurantLocation?.lat && location?.restaurantLocation?.lng) {
      const { lat, lng } = location.restaurantLocation;
      if (isValidLatLng(lat, lng)) {
        return [lat, lng];
      }
    }
    
    // Fallback to default center
    return DEFAULT_CENTER;
  };

  // Check if map can be rendered safely
  const canRenderMap = () => {
    const center = getMapCenter();
    return isValidLatLng(center[0], center[1]);
  };

  // Check if marker can be rendered safely
  const canRenderMarker = (locationData) => {
    if (!locationData?.lat || !locationData?.lng) return false;
    return isValidLatLng(locationData.lat, locationData.lng);
  };

  // Format status
  const formatStatus = (status) => {
    return status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN';
  };

  // Status color
  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Effects
  useEffect(() => {
    if (user && user.role !== 'customer') {
      setError('Access denied: This page is for customers only');
      setLoading(false);
      return;
    }
  }, [user]);

  useEffect(() => {
    if (orderId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // DEMO LIVE TRACKING - INTERVAL-BASED MOVING DELIVERY MARKER
  useEffect(() => {
    // Clear any existing interval
    if (movementIntervalRef.current) {
      clearInterval(movementIntervalRef.current);
      movementIntervalRef.current = null;
    }

    // Reset progress
    movementProgressRef.current = 0;

    // Start movement only when order is picked_up
    if (order?.status === 'picked_up' && location?.restaurantLocation && location?.customerLocation) {
      console.log('🚚 Starting delivery movement simulation');
      
      // Initialize delivery position at restaurant
      setDeliveryPosition(location.restaurantLocation);
      movementProgressRef.current = 0;

      // Start interval to move delivery marker every 3 seconds
      movementIntervalRef.current = setInterval(() => {
        movementProgressRef.current += 0.1; // Move 10% closer each interval

        // Stop when reached customer (100% progress)
        if (movementProgressRef.current >= 1) {
          movementProgressRef.current = 1;
          setDeliveryPosition(location.customerLocation);
          
          // Clear interval when delivery is complete
          if (movementIntervalRef.current) {
            clearInterval(movementIntervalRef.current);
            movementIntervalRef.current = null;
          }
          console.log('✅ Delivery movement simulation completed');
          return;
        }

        // Calculate interpolated position between restaurant and customer
        const interpolatedPosition = interpolateCoords(
          location.restaurantLocation,
          location.customerLocation,
          movementProgressRef.current
        );

        setDeliveryPosition(interpolatedPosition);
        console.log(`📍 Delivery progress: ${Math.round(movementProgressRef.current * 100)}%`);

      }, 3000); // Update every 3 seconds
    }

    // Stop movement when order is delivered
    if (order?.status === 'delivered') {
      console.log('🏁 Order delivered, stopping movement');
      if (movementIntervalRef.current) {
        clearInterval(movementIntervalRef.current);
        movementIntervalRef.current = null;
      }
      // Set final position to customer
      if (location?.customerLocation) {
        setDeliveryPosition(location.customerLocation);
      }
    }

    // Cleanup on unmount or order change
    return () => {
      if (movementIntervalRef.current) {
        clearInterval(movementIntervalRef.current);
        movementIntervalRef.current = null;
      }
    };
  }, [order?.status, location]); // Dependency on order status and location data

  // FIXED RENDER GUARDS - No silent failures
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading order...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
        >
          Back to My Orders
        </button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Order not found or loading...
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
        >
          Back to My Orders
        </button>
      </div>
    );
  }

  const mapCenter = getMapCenter();

  // Main content - ONE root element
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Order</h1>
        <p className="text-gray-600">Order #{orderId?.slice(-8) || 'Unknown'}</p>
      </div>

      {/* Order Status */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {formatStatus(order.status)}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
        
        {/* Restaurant Info */}
        {order.restaurant && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Restaurant</h3>
            <p className="text-gray-700">{order.restaurant.name}</p>
            <p className="text-gray-600 text-sm">{order.restaurant.address}</p>
          </div>
        )}

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.menuItem?.name || item.name}</span>
                  <span className="text-gray-600">₹{(item.price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-orange-600">₹{(order.totalAmount || order.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Map Section - CRITICAL: Only render when valid coordinates exist */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Tracking</h2>
        
        {/* Map - ONLY render when valid coordinates exist AND delivery position is available */}
        {canRenderMap() && deliveryPosition && 
         typeof deliveryPosition.lat === "number" && 
         typeof deliveryPosition.lng === "number" && (
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
              
              {/* Restaurant Marker - ONLY render with valid coordinates */}
              {canRenderMarker(location?.restaurantLocation) && (
                <Marker position={[location.restaurantLocation.lat, location.restaurantLocation.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <strong>🍕 Restaurant</strong><br />
                      {order.restaurant?.name}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Customer Marker - ONLY render with valid coordinates */}
              {canRenderMarker(location?.customerLocation) && (
                <Marker position={[location.customerLocation.lat, location.customerLocation.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <strong>🏠 Delivery Address</strong><br />
                      {order.user?.name}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Delivery Partner Marker - MOVING MARKER with interval-based animation */}
              {deliveryPosition && isValidLatLng(deliveryPosition.lat, deliveryPosition.lng) && (
                <Marker position={[deliveryPosition.lat, deliveryPosition.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <strong>🚚 Delivery Partner</strong><br />
                      <span className="text-green-600">Live Location</span><br />
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
        )}
        
        {/* Fallback when map data is missing */}
        {(!canRenderMap() || !deliveryPosition || 
          typeof deliveryPosition.lat !== "number" || 
          typeof deliveryPosition.lng !== "number") && (
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg mb-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <p className="text-gray-600">Waiting for live location...</p>
              <p className="text-sm text-gray-500 mt-2">Map will show when location is available</p>
            </div>
          </div>
        )}
        
        {/* Map Legend */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Restaurant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Customer</span>
          </div>
          {(deliveryPosition || canRenderMarker(location?.deliveryLocation)) && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Delivery Partner</span>
            </div>
          )}
        </div>

        {/* Delivery Status Text */}
        {order.status === 'picked_up' && deliveryPosition && (
          <div className="text-center text-green-600 font-medium">
            🚚 Delivery partner is on the way
          </div>
        )}
        {order.status === 'delivered' && (
          <div className="text-center text-blue-600 font-medium">
            ✅ Order delivered successfully!
          </div>
        )}
      </div>

      {/* Delivery Partner Info */}
      {order.deliveryPartner && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Partner</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">Name:</span> {order.deliveryPartner.name || 'N/A'}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Phone:</span> {order.deliveryPartner.phone || 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
