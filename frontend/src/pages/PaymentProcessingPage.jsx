import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

const PaymentProcessingPage = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState("");

  const amount = searchParams.get("amount") || "0";
  const UPI_ID = "foodxpress@upi"; // Your UPI ID
  const UPI_NAME = "FoodXpress";

  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      const order = response.data.data.order;
      setOrderDetails(order);

      // Check if payment is already completed
      if (order.payment.status === 'completed') {
        setError('Payment already completed for this order.');
      }

      // Check if order is not pending
      if (order.status !== 'pending') {
        setError(`This order is ${order.status}. Cannot process payment.`);
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError("Failed to load order details");
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleUPIPayment = () => {
    // Construct UPI intent URL
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`;
    
    // For mobile devices, try to open UPI app
    if (/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = upiUrl;
      
      // After attempting to open UPI app, show completion options
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    } else {
      // For desktop, show QR code or UPI ID
      setError("UPI payment is best done on mobile. Please scan QR code or use UPI ID manually.");
    }
  };

  const handlePaymentComplete = async () => {
    setLoading(true);
    setError("");

    try {
      // Verify order can be paid (must be pending)
      const orderCheck = await api.get(`/orders/${orderId}`);
      const order = orderCheck.data.data.order;

      // Check if already paid
      if (order.payment.status === 'completed') {
        setError('This order has already been paid.');
        setLoading(false);
        return;
      }

      // Check if order is not pending
      if (order.status !== 'pending') {
        setError(`Cannot complete payment for ${order.status} orders.`);
        setLoading(false);
        return;
      }

      // Update payment status to completed
      await api.put(`/orders/${orderId}/payment`, {
        status: "completed",
        transactionId: `UPI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      // Navigate to success page
      navigate(`/payment-success/${orderId}?method=upi`);
    } catch (err) {
      console.error("Payment confirmation error:", err);
      setError(err.response?.data?.message || "Failed to confirm payment");
      setLoading(false);
    }
  };

  const handlePaymentFailed = () => {
    navigate(`/payment-failed/${orderId}`);
  };

  if (error && !orderDetails) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate("/orders")}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">📱</div>
          <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
          <p className="text-gray-600">Pay via UPI to confirm your order</p>
        </div>

        {/* Amount Display */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-6 text-center">
          <p className="text-gray-600 mb-2">Amount to Pay</p>
          <p className="text-4xl font-bold text-orange-600">₹{amount}</p>
          <p className="text-sm text-gray-500 mt-2">Order ID: {orderId?.slice(-8)}</p>
        </div>

        {/* UPI Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-4 text-lg">UPI Payment Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">UPI ID:</span>
              <span className="font-mono font-semibold">{UPI_ID}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Merchant:</span>
              <span className="font-semibold">{UPI_NAME}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">₹{amount}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-6">
          <button
            onClick={handleUPIPayment}
            disabled={!!error || loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Open UPI App (Google Pay / PhonePe / Paytm)
          </button>

          <div className="text-center text-sm text-gray-600">
            <p>After completing payment in your UPI app:</p>
          </div>

          <button
            onClick={handlePaymentComplete}
            disabled={loading || !!error}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Confirming..." : "I've Completed the Payment"}
          </button>

          <button
            onClick={handlePaymentFailed}
            disabled={loading}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            Payment Failed / Cancel
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="border-t pt-6 mt-6">
          <h3 className="font-semibold mb-3 text-sm text-gray-700">How to Pay:</h3>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Click "Open UPI App" button above</li>
            <li>Select your UPI app (Google Pay, PhonePe, etc.)</li>
            <li>Verify the amount and complete payment</li>
            <li>Return here and click "I've Completed the Payment"</li>
          </ol>
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a demo implementation. In production, payment confirmation 
            would be verified through a payment gateway webhook.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingPage;
