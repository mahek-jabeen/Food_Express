import React from 'react';
import ImageWithFallback, { DEFAULT_FOOD_IMAGE } from './ImageWithFallback';

const MenuItemCard = ({ item, onAddToCart }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
              <div className="flex items-center space-x-2 mb-2">
                {item.isVegetarian && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                    Vegetarian
                  </span>
                )}
                {item.isVegan && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                    Vegan
                  </span>
                )}
                {item.isGlutenFree && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                    Gluten-Free
                  </span>
                )}
                {item.spiceLevel !== 'None' && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                    🌶️ {item.spiceLevel}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right ml-4">
              <p className="text-lg font-bold text-primary-600">${item.price.toFixed(2)}</p>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-500 text-xs space-x-3">
              {item.calories && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {item.calories} cal
                </span>
              )}
              {item.prepTime && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item.prepTime} min
                </span>
              )}
            </div>

            <button
              onClick={() => onAddToCart(item)}
              disabled={!item.isAvailable}
              className={`px-4 py-2 rounded-lg transition ${
                item.isAvailable
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {item.isAvailable ? 'Add to Cart' : 'Not Available'}
            </button>
          </div>
        </div>

        <div className="w-32 h-32">
          <ImageWithFallback
            src={item.image}
            alt={item.name}
            fallback={DEFAULT_FOOD_IMAGE}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
