import React, { useState } from 'react';
import api from '../utils/api';

const ReviewModal = ({ isOpen, onClose, order, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reviewData = {
        restaurant: order.restaurant._id || order.restaurant,
        order: order._id,
        rating,
        comment: comment.trim()
      };

      await api.post('/reviews', reviewData);
      
      // Call success callback
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      // Close modal
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
        >
          <svg
            className={`w-10 h-10 ${
              starValue <= (hoverRating || rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            } fill-current transition-colors`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        </button>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Rate Your Order</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 text-sm">
              {order?.restaurant?.name || 'Restaurant'}
            </p>
            <p className="text-gray-500 text-xs">
              Order #{order?.orderNumber}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex justify-center space-x-2">
                {renderStars()}
              </div>
              {rating > 0 && (
                <p className="text-center mt-2 text-sm text-gray-600">
                  {rating} out of 5 stars
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                maxLength="500"
                placeholder="Share your experience..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 characters
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
