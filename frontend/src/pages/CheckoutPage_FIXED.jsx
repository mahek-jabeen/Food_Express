import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import FakeUpiModal from "../components/FakeUpiModal";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, restaurant, getCartTotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const subtotal = getCartTotal();
  const deliveryFee = restaurant?.deliveryFee || 0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const handlePaymentSuccess = () => {
    // DEMO UPI PAYMENT – NO REAL TRANSACTION
    // Show success state
    alert("Payment Successful! Order placed successfully.");
    // Close modal and redirect to My Orders
    setShowUpiModal(false);
    clearCart();
    navigate('/orders'); // Redirect to My Orders page
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!restaurant) {
      setError("Restaurant information missing");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (!user?.address || !user.address.street) {
      setError("Please add a delivery address in your profile");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create order with payment status = pending
      const orderResponse = await api.post("/orders", {
        restaurant: restaurant._id,
        items: cartItems.map((item) => ({
          menuItem: item._id,
          quantity: item.quantity,
        })),
        deliveryAddress: user.address,
        paymentMethod,
      });

      const order = orderResponse.data.data.order;
      const orderId = order._id;
      setCreatedOrderId(orderId);

      // Handle payment method routing
      if (paymentMethod === "cod") {
        // COD: Mark payment as completed (will be paid on delivery)
        try {
          await api.put(`/orders/${orderId}/payment`, {
            status: 'completed',
            transactionId: `COD-${orderId}`
          });
        } catch (paymentErr) {
          console.error("COD payment update error:", paymentErr);
          // Continue anyway for COD - order is already created
        }
        
        // Clear cart and redirect to success page
        clearCart();
        navigate(`/payment-success/${orderId}?method=cod`);
      } else if (paymentMethod === "upi") {
        // UPI: Show modal for fake UPI payment
        setShowUpiModal(true);
      }

    } catch (err) {
      console.error("Order creation error:", err);
      setError(err.response?.data?.message || "Failed to create order. Please try again.");
      setLoading(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">No Restaurant Selected</h1>
        <p className="mb-4">Please add items to your cart first.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Your Cart is Empty</h1>
        <p className="mb-4">Add items to your cart before checkout.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* ORDER SUMMARY */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2 mb-4">
          {cartItems.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>₹{deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (8%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t pt-2">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* DELIVERY ADDRESS */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
        {user?.address?.street ? (
          <div className="text-gray-700">
            <p>{user.address.street}</p>
            {user.address.city && <p>{user.address.city}, {user.address.state} {user.address.zipCode}</p>}
            {user.address.instructions && (
              <p className="text-sm text-gray-500 mt-2">Note: {user.address.instructions}</p>
            )}
          </div>
        ) : (
          <div className="text-red-600">
            <p>No delivery address found. Please add one in your profile.</p>
            <button
              onClick={() => navigate("/profile")}
              className="text-orange-600 underline mt-2"
            >
              Update Profile
            </button>
          </div>
        )}
      </div>

      {/* PAYMENT METHOD */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

        {/* UPI Option */}
        <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 mb-3">
          <input
            type="radio"
            value="upi"
            checked={paymentMethod === "upi"}
            onChange={() => setPaymentMethod("upi")}
            className="w-5 h-5 text-orange-600"
          />
          <div className="flex-1">
            <div className="font-semibold">UPI Payment</div>
            <div className="text-sm text-gray-600">
              Pay via Google Pay, PhonePe, Paytm or any UPI app
            </div>
          </div>
          <div className="text-2xl">📱</div>
        </label>

        {/* COD Option */}
        <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 mb-3">
          <input
            type="radio"
            value="cod"
            checked={paymentMethod === "cod"}
            onChange={() => setPaymentMethod("cod")}
            className="w-5 h-5 text-orange-600"
          />
          <div className="flex-1">
            <div className="font-semibold">Cash on Delivery</div>
            <div className="text-sm text-gray-600">
              Pay with cash when your order arrives
            </div>
          </div>
          <div className="text-2xl">💵</div>
        </label>

        {/* Card Option (Disabled) */}
        <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-not-allowed opacity-50">
          <input
            type="radio"
            value="card"
            disabled
            className="w-5 h-5 text-gray-400"
          />
          <div className="flex-1">
            <div className="font-semibold">Credit/Debit Card</div>
            <div className="text-sm text-gray-600">
              Coming Soon - Pay with credit or debit card
            </div>
          </div>
          <div className="text-2xl">💳</div>
        </label>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* PLACE ORDER BUTTON */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-semibold text-lg transition"
      >
        {loading ? "Placing Order..." : "Place Order"}
      </button>

      {/* UPI Payment Modal */}
      <FakeUpiModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        orderId={createdOrderId}
        amount={total}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default CheckoutPage;
