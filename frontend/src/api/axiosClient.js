import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// Variables to handle concurrent 401 token refresh queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request Interceptor:
 * - Attaches Bearer JWT token from localStorage.
 * - Generates and attaches unique X-Trace-Id header for distributed tracing.
 */
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ewallet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach distributed tracing ID
    config.headers['X-Trace-Id'] = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * - Unwraps response payload.
 * - Intercepts 401 Unauthorized errors and executes silent Refresh Token rotation.
 * - Automatically retries queued failed requests upon successful token refresh.
 * - Redirects to /login if token refresh fails or refresh token is invalid.
 */
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if the failed request was the refresh-token endpoint itself or login endpoint
      if (originalRequest.url?.includes('/v1/auth/refresh-token') || originalRequest.url?.includes('/v1/auth/login')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('ewallet_refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        handleLogoutRedirect();
        return Promise.reject(error);
      }

      try {
        // Direct call to refresh-token endpoint using isolated axios instance
        const response = await axios.post(`${API_BASE_URL}/v1/auth/refresh-token`, {
          refreshToken,
        });

        const authData = response.data?.result || response.data?.data || response.data;
        const newAccessToken = authData?.accessToken;
        const newRefreshToken = authData?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('ewallet_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('ewallet_refresh_token', newRefreshToken);
          }
          if (authData?.user) {
            localStorage.setItem('ewallet_user', JSON.stringify(authData.user));
          }

          axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return axiosClient(originalRequest);
        } else {
          throw new Error('No access token returned from refresh endpoint');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        handleLogoutRedirect();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Clears local session storage and redirects user to login page
 */
function handleLogoutRedirect() {
  localStorage.removeItem('ewallet_token');
  localStorage.removeItem('ewallet_refresh_token');
  localStorage.removeItem('ewallet_user');

  if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.href = '/login';
  }
}

export default axiosClient;
