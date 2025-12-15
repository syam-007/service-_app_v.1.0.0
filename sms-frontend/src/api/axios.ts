// src/api/axios.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔍 [Axios Request Interceptor]');
    console.log('URL:', config.url);
    console.log('Token exists:', !!token);
    console.log('Token value (first 20 chars):', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization?.substring(0, 30) + '...');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    console.log('---');
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ [Axios Response] Success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('❌ [Axios Response] Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      headers: error.response?.headers,
      data: error.response?.data,
    });
    
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - is the backend running?');
    } else if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token might be invalid or expired');
      console.log('Current token in localStorage:', localStorage.getItem('access_token'));
      localStorage.removeItem('access_token');
      // Don't redirect automatically, just log
      console.log('Token removed from localStorage');
    } else if (!error.response) {
      console.error('Cannot connect to backend. Please make sure Django server is running on http://localhost:8000');
    }
    return Promise.reject(error);
  }
);

export default api;