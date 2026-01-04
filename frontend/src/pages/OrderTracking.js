import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import ReviewModal from "../components/ReviewModal";

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasJoinedRoom = useRef(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // 🔁 Backend is the source of truth
  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false);
      setError('Order ID is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const res = await api.get(`/orders/${orderId}`);
      
      // Backend returns: { status: "success", data: { order } }
      if (res.data && res.data.data && res.data.data.order) {
        const orderData = res.data.data.order;
        setOrder(orderData);
      } else {
        setError('Order data not found in response');
      }
      
    } catch (err) {
      console.error("❌ Failed to fetch order", err);
      
      // Handle 401/403 specifically - not authorized
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Access Denied: You are not authorized to view this order.');
        return;
      }
      
      // Handle 404 specifically - order not found
      if (err.response?.status === 404) {
        setError('Order not found.');
        return;
      }
      
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Fetch all customer orders
  const fetchCustomerOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await api.get('/orders/user');
      
      // Backend returns: { status: "success", data: { orders } }
      const ordersData = res.data.data.orders || res.data.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      
    } catch (err) {
      console.error("❌ Failed to fetch customer orders", err);
      
      // Handle 401/403 specifically - not authorized
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Access Denied: You are not authorized to view orders.');
        return;
      }
      
      setError('Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      fetchCustomerOrders();
    }
  }, [orderId]);

  // 🔔 Real-time updates (signal → refetch)
  useEffect(() => {
    if (!socket || !orderId || hasJoinedRoom.current) return;

    console.log(`📡 Joining order room: order:${orderId}`);
    socket.emit("join-order", { orderId });
    hasJoinedRoom.current = true;

    const handleOrderUpdate = () => {
      console.log("🔔 Order update received → refetching");
      fetchOrder();
    };

    socket.on("order-updated", handleOrderUpdate);
    socket.on("order-picked", handleOrderUpdate);
    socket.on("order-delivered", handleOrderUpdate);

    return () => {
      socket.off("order-updated", handleOrderUpdate);
      socket.off("order-picked", handleOrderUpdate);
      socket.off("order-delivered", handleOrderUpdate);
      hasJoinedRoom.current = false;
    };
  }, [socket, orderId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-600"></div>
        <p className="ml-4 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Show all orders list when no orderId
  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">{orders.length} orders found</p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full h-24 w-24 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-600 mb-6">Start ordering from your favorite restaurants!</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                Browse Restaurants
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {order.restaurant?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <p className="text-lg font-bold text-orange-600 mt-2">
                          ₹{order.pricing?.total?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-900 font-medium">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => navigate(`/orders/${order._id}`)}
                        className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
                      >
                        Track Order
                      </button>
                      {order.status === 'delivered' && (
                        <button className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">
                          Order Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single order tracking view
  if (orderId) {
    if (!order && !loading && !error) {
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
            Loading order details...
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

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
                  <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Restaurant</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {order.restaurant?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-6">
              {/* Status */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{order.pricing?.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">₹{order.pricing?.deliveryFee?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹{order.pricing?.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-orange-600">₹{order.pricing?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">
                    {order.deliveryAddress?.street}<br />
                    {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
                  </p>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    order.payment?.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment?.status === 'completed' ? '✓ Paid' : '⏳ Payment Pending'}
                  </span>
                  {order.payment?.method && (
                    <span className="text-sm text-gray-600">
                      ({order.payment.method.toUpperCase()})
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/orders')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Back to My Orders
                </button>
                {order.status === 'delivered' && !order.reviewed && (
                  <button 
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center"
                  >
                    ⭐ Rate Order
                  </button>
                )}
              </div>
              
              <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                order={order}
                onReviewSubmitted={() => {
                  fetchOrder();
                  setIsReviewModalOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default OrderTracking;
