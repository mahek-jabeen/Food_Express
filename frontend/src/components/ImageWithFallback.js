import React, { useState } from 'react';

/**
 * Image component with automatic fallback handling
 * Builds full URL for backend images and shows placeholder on error
 */
const ImageWithFallback = ({ 
  src, 
  alt, 
  fallback, 
  className = '',
  ...props 
}) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get backend base URL from environment (remove /api suffix if present)
  const BACKEND_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
    : 'http://localhost:5000';

  /**
   * Build full image URL
   * - If src starts with http:// or https://, use as-is (external URL)
   * - If src starts with /uploads, prepend backend URL
   * - Otherwise, use placeholder
   */
  const getImageUrl = () => {
    if (!src || imgError) {
      return fallback;
    }

    // External URL (http:// or https://)
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }

    // Backend upload path
    if (src.startsWith('/uploads')) {
      return `${BACKEND_URL}${src}`;
    }

    // If it's just a filename, assume it's in uploads
    if (src && !src.includes('/')) {
      return `${BACKEND_URL}/uploads/${src}`;
    }

    return fallback;
  };

  const handleError = () => {
    setImgError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && (
        <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
          <svg 
            className="w-8 h-8 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}
      <img
        src={getImageUrl()}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </>
  );
};

// Default fallback images
export const DEFAULT_RESTAURANT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop';

export default ImageWithFallback;
