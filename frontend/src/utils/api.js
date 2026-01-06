import axios from 'axios';

// Use environment variable for API URL (Vite)
// In production: VITE_API_URL should point to backend (e.g., https://backend.onrender.com)
const getApiUrl = () => {
  // Get environment variable using Vite's import.meta.env
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    // Remove trailing slashes and ensure /api suffix
    const baseUrl = apiUrl.replace(/\/+$/, '');
    const finalUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    console.log('✅ API URL configured:', finalUrl);
    return finalUrl;
  }
  
  // Fallback to localhost for development
  console.warn('⚠️ VITE_API_URL not set, using localhost:5000');
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();
console.log('🌐 API Base URL:', API_URL);

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
