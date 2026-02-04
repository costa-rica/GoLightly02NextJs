import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import logger from '@/config/logger';

// Get base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add JWT token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (Redux persist stores it there)
    if (typeof window !== 'undefined') {
      try {
        const persistedState = localStorage.getItem('persist:root');
        if (persistedState) {
          const parsed = JSON.parse(persistedState);
          const authState = JSON.parse(parsed.auth);
          const token = authState?.accessToken;

          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        logger.error('Error reading token from localStorage:', error);
      }
    }

    return config;
  },
  (error: AxiosError) => {
    logger.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;

      // Log the error
      logger.error(`API Error [${status}]:`, data);

      // Handle specific status codes
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          logger.warn('Unauthorized request - token may be expired');
          // Clear auth state from localStorage
          if (typeof window !== 'undefined') {
            try {
              const persistedState = localStorage.getItem('persist:root');
              if (persistedState) {
                const parsed = JSON.parse(persistedState);
                parsed.auth = JSON.stringify({
                  user: null,
                  accessToken: null,
                  isAuthenticated: false,
                });
                localStorage.setItem('persist:root', JSON.stringify(parsed));
              }
            } catch (e) {
              logger.error('Error clearing auth state:', e);
            }
          }
          break;

        case 403:
          // Forbidden
          logger.warn('Access forbidden');
          break;

        case 404:
          // Not found
          logger.warn('Resource not found');
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          logger.error('Server error occurred');
          break;

        default:
          logger.error(`Unhandled error status: ${status}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      logger.error('No response received from server:', error.message);
    } else {
      // Something else happened
      logger.error('API request error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
