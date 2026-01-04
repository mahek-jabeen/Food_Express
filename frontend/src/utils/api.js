import axios from 'axios';

// REACT_APP_API_URL should be the backend URL without /api suffix
// In development: uses setupProxy.js (no need for full URL)
// In production: REACT_APP_API_URL should be https://your-backend.com (we add /api here)
const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://foodxpress-backend-atr3.onrender.com/api';


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
    const userStr = localStorage.getItem('user');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';

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
