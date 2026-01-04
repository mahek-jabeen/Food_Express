import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithFallback, { DEFAULT_RESTAURANT_IMAGE } from './ImageWithFallback';

const RestaurantCard = ({ restaurant }) => {
  return (
    <Link to={`/restaurant/${restaurant._id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1">
        <div className="relative h-48">
          <ImageWithFallback
            src={restaurant.logo || restaurant.image}
            alt={restaurant.name}
            fallback={DEFAULT_RESTAURANT_IMAGE}
            className="w-full h-full object-cover"
          />
          {restaurant.featured && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded">
              Featured
            </span>
          )}
          {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white text-gray-900 px-3 py-1 rounded-full font-semibold">
                Closed
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h3>
          
          <div className="flex items-center mb-2">
            <div className="flex items-center text-yellow-400">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <span className="ml-1 text-gray-900 font-semibold">{restaurant.rating.toFixed(1)}</span>
            </div>
            <span className="ml-2 text-gray-600 text-sm">({restaurant.totalReviews} reviews)</span>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description}</p>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>{restaurant.priceRange}</span>
              <span>•</span>
              <span>{restaurant.cuisine.slice(0, 2).join(', ')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center text-gray-600 text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {restaurant.deliveryTime.min}-{restaurant.deliveryTime.max} min
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              ${restaurant.deliveryFee === 0 ? 'Free' : restaurant.deliveryFee.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
