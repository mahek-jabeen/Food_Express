import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../utils/api";

const UPIPaymentPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [paymentStatus, setPaymentStatus] = useState("initiated");
  const [upiId, setUpiId] = useState("");
  const [collectRequestSent, setCollectRequestSent] = useState(false);
  const [showUPIInput, setShowUPIInput] = useState(false);

  const pollingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    initiatePayment();
    return () => {
      // Cleanup intervals on unmount
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initiatePayment = async () => {
    try {
      setLoading(true);
      const response = await api.post("/payment/create", {
        orderId,
        paymentMethod: "upi",
        amount: parseFloat(amount),
      });

      const data = response.data;
      setPaymentData(data);
      setLoading(false);

      // Start countdown timer
      startTimer();

      // Start polling for payment status
      startPolling(data.paymentId);
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err.response?.data?.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startPolling = (paymentId) => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/payment/status/${paymentId}`);
        const status = response.data.paymentStatus;
        setPaymentStatus(status);

        if (status === "completed") {
          clearInterval(pollingIntervalRef.current);
          clearInterval(timerIntervalRef.current);
          navigate(`/payment-success/${orderId}?method=upi`);
        } else if (status === "failed") {
          clearInterval(pollingIntervalRef.current);
          clearInterval(timerIntervalRef.current);
          navigate(`/payment-failed/${orderId}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000); // Poll every 3 seconds
  };

  const handleTimeout = () => {
    clearInterval(pollingIntervalRef.current);
    clearInterval(timerIntervalRef.current);
    setError("Payment session expired. Please try again.");
    setTimeout(() => {
      navigate(`/payment-failed/${orderId}`);
    }, 2000);
  };

  const handleUPICollect = async () => {
    if (!upiId || !paymentData) return;

    try {
      await api.post("/payment/upi-collect", {
        paymentId: paymentData.paymentId,
        upiId: upiId.trim(),
      });

      setCollectRequestSent(true);
    } catch (err) {
      console.error("UPI collect error:", err);
      alert(err.response?.data?.message || "Failed to send collect request");
    }
  };

  const handleSimulateSuccess = async () => {
    if (!window.confirm("Simulate successful payment? (For testing only)")) {
      return;
    }

    try {
      await api.post("/payment/simulate-success", {
        paymentId: paymentData.paymentId,
      });
      // Payment status will be detected by polling
      alert("Payment simulation triggered. Redirecting...");
    } catch (err) {
      console.error("Simulation error:", err);
      alert("Failed to simulate payment");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Initializing payment...</p>
        </div>
      </div>
    );
  }

  if (error && !paymentData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="font-bold text-xl mb-2">Payment Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate(`/checkout`)}
            className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete UPI Payment</h1>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="text-gray-600">Amount to pay:</span>
            <span className="text-2xl font-bold text-orange-600">₹{amount}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-gray-600">Time remaining:</span>
            <span className={`font-bold text-lg ${timeLeft < 60 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Payment Status */}
        {paymentStatus === "initiated" && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-pulse">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              </div>
              <span className="font-semibold text-blue-900">Waiting for payment...</span>
            </div>
          </div>
        )}

        {/* QR Code Section */}
        <div className="mb-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan QR Code</h2>
          <div className="bg-white p-6 rounded-lg border-2 border-dashed border-orange-300 inline-block">
            {paymentData?.qrCode && (
              <img 
                src={paymentData.qrCode} 
                alt="UPI Payment QR Code" 
                className="w-64 h-64 mx-auto"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            )}
          </div>
          <p className="text-gray-700 mt-4 font-medium">
            📱 Scan with any UPI app
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Google Pay • PhonePe • Paytm • BHIM • Amazon Pay
          </p>
        </div>

        {/* UPI ID Section - Enter UPI ID Option */}
        <div className="mb-6 border-t pt-6">
          <button
            onClick={() => setShowUPIInput(!showUPIInput)}
            className="text-orange-600 hover:text-orange-700 font-semibold mb-3 flex items-center gap-2 mx-auto"
          >
            {showUPIInput ? "Hide UPI ID option" : "💳 Or enter your UPI ID"}
            <svg className={`w-4 h-4 transition-transform ${showUPIInput ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {showUPIInput && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Enter UPI ID for Collect Request</h3>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your UPI ID
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@paytm"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={collectRequestSent}
                />
                <button
                  onClick={handleUPICollect}
                  disabled={!upiId || collectRequestSent}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {collectRequestSent ? "✓ Sent" : "Send Request"}
                </button>
              </div>
              {collectRequestSent && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Payment request sent to {upiId}! Please check your UPI app and approve.
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                💡 You'll receive a payment request notification in your UPI app
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">How to Pay:</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Open any UPI app on your phone (Google Pay, PhonePe, Paytm, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Scan the QR code shown above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Verify the amount and merchant details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Enter your UPI PIN to complete payment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <span>Payment will be confirmed automatically - don't close this page!</span>
            </li>
          </ol>
        </div>

        {/* Demo Button - Only for testing */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 mb-3">
              🔧 <strong>Demo Mode:</strong> Click below to simulate successful payment
            </p>
            <button
              onClick={handleSimulateSuccess}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Simulate Payment Success (Testing Only)
            </button>
          </div>
        )}

        {/* Cancel Button */}
        <button
          onClick={() => navigate(`/payment-failed/${orderId}`)}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
};

export default UPIPaymentPage;
