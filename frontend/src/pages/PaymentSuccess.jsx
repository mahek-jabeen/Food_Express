import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

const PaymentSuccess = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const paymentMethod = searchParams.get("method");

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
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            {paymentMethod === "cod" ? "Order Placed Successfully!" : "Payment Successful!"}
          </h1>
          <p className="text-gray-600 text-lg">
            {paymentMethod === "cod" 
              ? "Your order has been confirmed. Pay with cash on delivery."
              : "Your UPI payment has been confirmed and order is being processed."
            }
          </p>
        </div>

        {/* Order Details */}
        {order && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            
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
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold uppercase">
                  {order.payment.method === "cod" ? "Cash on Delivery" : order.payment.method.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-lg text-orange-600">
                  ₹{order.pricing?.total?.toFixed(2) || "0.00"}
                </span>
              </div>

              {order.payment.status === "completed" && order.payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid At:</span>
                  <span className="font-semibold">
                    {new Date(order.payment.paidAt).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Delivery:</span>
                <span className="font-semibold">
                  {order.estimatedDeliveryTime 
                    ? new Date(order.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "30-45 minutes"
                  }
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Items Ordered:</h3>
              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Specific Message */}
        {paymentMethod === "cod" && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">💵</div>
              <div>
                <p className="text-amber-900 font-semibold mb-1">Cash on Delivery</p>
                <p className="text-amber-800 text-sm">
                  Please keep <strong>₹{order?.pricing?.total?.toFixed(2) || "0.00"}</strong> ready. 
                  Pay the delivery person in cash when your order arrives.
                </p>
                <p className="text-amber-700 text-xs mt-2">
                  💡 Tip: Keep exact change ready for a smooth delivery experience
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "upi" && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <p className="text-green-900 font-semibold mb-1">UPI Payment Completed</p>
                <p className="text-green-800 text-sm">
                  Your payment of <strong>₹{order?.pricing?.total?.toFixed(2) || "0.00"}</strong> has been processed successfully.
                  {order?.payment?.transactionId && (
                    <span className="block mt-1 text-xs text-green-700">
                      Transaction ID: {order.payment.transactionId}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/track-order/${orderId}`)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Track Your Order
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Browse More Restaurants
          </button>
        </div>

        {/* Thank You Message */}
        <p className="text-gray-600 mt-6">
          Thank you for ordering with FoodXpress! 🍕
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
