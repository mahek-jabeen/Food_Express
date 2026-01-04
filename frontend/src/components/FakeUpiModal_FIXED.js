import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';

const FakeUpiModal = ({ 
  isOpen, 
  onClose, 
  orderId, 
  amount, 
  onPaymentSuccess 
}) => {
  const [upiId, setUpiId] = useState('');
  const [upiApp, setUpiApp] = useState('gpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const upiApps = [
    { value: 'gpay', label: 'Google Pay' },
    { value: 'phonepe', label: 'PhonePe' },
    { value: 'paytm', label: 'Paytm' },
    { value: 'bhim', label: 'BHIM' }
  ];

  const validateUpiId = (id) => {
    return id.includes('@') && id.length > 5;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!upiId.trim()) {
      setError('UPI ID is required');
      return;
    }

    if (!validateUpiId(upiId)) {
      setError('Please enter a valid UPI ID (must contain @)');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/payment/create', {
        orderId,
        amount,
        paymentMethod: 'upi',
        upiId,
        upiApp
      });

      if (response.data.success) {
        // Show success message
        onPaymentSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Payment failed');
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">UPI Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* QR Code Section */}
        <div className="text-center mb-6">
          <div className="w-48 h-48 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            {/* Fake QR Code */}
            <div className="text-center">
              <div className="grid grid-cols-8 gap-1 mb-2">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 ${
                      Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600">QR Code</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Scan & Pay using any UPI app
          </p>
          <p className="text-lg font-bold text-gray-900">
            ₹{amount?.toFixed(2)}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* UPI ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UPI ID
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="name@upi"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* UPI App Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UPI App
            </label>
            <select
              value={upiApp}
              onChange={(e) => setUpiApp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {upiApps.map(app => (
                <option key={app.value} value={app.value}>
                  {app.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>This is a demo payment for testing purposes</p>
        </div>
      </div>
    </div>
  );
};

export default FakeUpiModal;
