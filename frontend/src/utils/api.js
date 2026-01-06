import axios from 'axios';

// Use environment variable for API URL
// In development: setupProxy.js handles /api routing to localhost:5000
// In production: REACT_APP_API_URL should point to backend (e.g., https://backend.onrender.com)
const getApiUrl = () => {
  // Production: must use environment variable with safe fallback
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.REACT_APP_API_URL) {
      console.error('❌ CRITICAL: REACT_APP_API_URL not set in production!');
      console.error('❌ Set this in Vercel environment variables: REACT_APP_API_URL=https://your-backend.onrender.com');
      console.error('❌ Using placeholder URL - API calls will fail until configured');
      // Return placeholder instead of throwing - prevents white screen
      return 'https://API-URL-NOT-CONFIGURED/api';
    }
    const baseUrl = process.env.REACT_APP_API_URL.replace(/\/+$/, ''); // Remove trailing slashes
    const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    console.log('✅ Production API URL:', apiUrl);
    return apiUrl;
  }
  
  // Development: use env var if set, otherwise localhost
  if (process.env.REACT_APP_API_URL) {
    const baseUrl = process.env.REACT_APP_API_URL.replace(/\/+$/, '');
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  }
  
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();
console.log('🌐 API Base URL configured:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
