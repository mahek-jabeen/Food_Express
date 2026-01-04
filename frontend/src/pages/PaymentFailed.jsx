import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";

const PaymentFailed = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.data.order);
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  const handleRetryPayment = async () => {
    if (!order) return;

    setRetrying(true);
    
    // Check if order is still pending before retry
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      alert('This order cannot be retried. Order status: ' + order.status);
      setRetrying(false);
      return;
    }

    // Check payment method and redirect accordingly
    if (order.payment.method === 'upi') {
      // Redirect to UPI payment page for retry
      navigate(`/upi-payment/${orderId}?amount=${order.pricing?.total?.toFixed(2)}`);
    } else {
      alert('Only UPI payments can be retried. Please contact support.');
      setRetrying(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      await api.put(`/orders/${orderId}/cancel`, {
        reason: "Payment failed"
      });
      navigate("/orders");
    } catch (err) {
      console.error("Failed to cancel order:", err);
      navigate("/orders");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Failed Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h1>
          <p className="text-gray-600">
            We couldn't process your payment. Please try again or choose a different payment method.
          </p>
        </div>

        {/* Order Details */}
        {order && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold mb-4">Order Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-semibold">{order.orderNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Restaurant:</span>
                <span className="font-semibold">{order.restaurant?.name || "N/A"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-lg text-orange-600">
                  ₹{order.pricing?.total?.toFixed(2) || "0.00"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className="font-semibold text-red-600">Failed</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">
            <strong>Payment could not be completed.</strong> This might be due to:
          </p>
          <ul className="text-left text-sm text-red-700 mt-2 ml-6 list-disc">
            <li>Insufficient balance in your UPI account</li>
            <li>Network connectivity issues</li>
            <li>Payment timeout or cancellation</li>
            <li>Technical issue with payment provider</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetryPayment}
            disabled={retrying}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {retrying ? "Redirecting..." : "Retry Payment"}
          </button>
          
          <button
            onClick={handleCancelOrder}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Cancel Order
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full text-orange-600 hover:text-orange-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Browse Restaurants
          </button>
        </div>

        {/* Help Message */}
        <p className="text-gray-600 text-sm mt-6">
          Need help? Contact our support team for assistance.
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
