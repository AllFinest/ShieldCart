/**
 * API Client Configuration
 *
 * Centralized Axios instance with:
 * - Base URL configuration
 * - Request interceptor: attaches JWT access token to every request
 * - Response interceptor: handles 401 errors and token refresh
 * - CSRF token handling
 *
 * All API calls in the app should use this instance, not raw axios.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Send cookies (needed for refresh token and CSRF)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor — attach access token and CSRF token.
 */
api.interceptors.request.use(
  (config) => {
    // Attach JWT access token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach CSRF token if available
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — handle token expiry.
 * On 401, attempt to refresh the access token using the refresh token cookie.
 * If refresh fails, redirect to login.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken, trust } = refreshResponse.data.data;
        localStorage.setItem('accessToken', accessToken);
        if (trust) {
          localStorage.setItem('sessionTrust', JSON.stringify(trust));
        }

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('csrfToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Fetch a CSRF token from the server and store it.
 * Call this on app initialization.
 */
export async function fetchCsrfToken() {
  try {
    const response = await api.get('/csrf-token');
    const { csrfToken } = response.data;
    localStorage.setItem('csrfToken', csrfToken);
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error.message);
    return null;
  }
}

export default api;
