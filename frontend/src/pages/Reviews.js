import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reviews/user');
      setReviews(response.data.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
        viewBox="0 0 20 20"
      >
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Reviews</h1>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">No reviews yet</h2>
            <p className="mt-2 text-gray-600">Order food and share your experience!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {review.restaurant?.name}
                    </h3>
                    <div className="flex items-center mt-2">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{review.comment}</p>

                {review.foodRating && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Food: {review.foodRating}/5</span>
                    {review.deliveryRating && <span>Delivery: {review.deliveryRating}/5</span>}
                  </div>
                )}

                {review.response && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-primary-600">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Restaurant Response</p>
                    <p className="text-sm text-gray-700">{review.response.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
