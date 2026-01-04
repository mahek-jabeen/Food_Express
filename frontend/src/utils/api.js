import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests and disable caching
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ROLE-BASED API VALIDATION: Check if user is calling correct endpoints
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const url = config.url || '';
        
        // Validate role-specific endpoints
        if (url.startsWith('/restaurant')) {
          if (user.role !== 'restaurant') {
            console.error(`🚫 API MISMATCH: User role '${user.role}' trying to access restaurant endpoint: ${url}`);
            console.error('📍 This will result in 403 Forbidden from backend');
            console.warn('⚠️ Check your code - wrong dashboard is calling wrong API!');
          }
        } else if (url.startsWith('/delivery')) {
          if (user.role !== 'delivery') {
            console.error(`🚫 API MISMATCH: User role '${user.role}' trying to access delivery endpoint: ${url}`);
            console.error('📍 This will result in 403 Forbidden from backend');
            console.warn('⚠️ Check your code - wrong dashboard is calling wrong API!');
          }
        } else if (url.startsWith('/orders')) {
          if (user.role !== 'customer') {
            console.error(`🚫 API MISMATCH: User role '${user.role}' trying to access customer endpoint: ${url}`);
            console.error('📍 This will result in 403 Forbidden from backend');
            console.warn('⚠️ Check your code - wrong dashboard is calling wrong API!');
          }
        }
        
        // Log successful role match for debugging
        if (url.startsWith('/restaurant') && user.role === 'restaurant') {
          console.log(`✅ Role match: restaurant user calling ${url}`);
        } else if (url.startsWith('/delivery') && user.role === 'delivery') {
          console.log(`✅ Role match: delivery user calling ${url}`);
        } else if (url.startsWith('/orders') && user.role === 'customer') {
          console.log(`✅ Role match: customer user calling ${url}`);
        }
      } catch (err) {
        console.error('⚠️ Failed to parse user from localStorage:', err);
      }
    }
    
    // FORCE CACHE BYPASS: Add timestamp to prevent 304 Not Modified
    // This ensures browser always fetches fresh data from server
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now() // Cache-busting timestamp
      };
    }
    
    // Set aggressive no-cache headers
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
