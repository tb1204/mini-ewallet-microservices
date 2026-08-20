import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // Tự động gửi & nhận HttpOnly Cookie cùng với API requests
});

// Request Interceptor: Tự động đính kèm TraceId & fallback token
axiosClient.interceptors.request.use(
  (config) => {
    // Trình duyệt tự động đính kèm HttpOnly Cookie qua withCredentials: true.
    // [DEMO FALLBACK]: Nếu chưa nối Backend thật, đính kèm token từ localStorage
    const token = localStorage.getItem('ewallet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Trace ID giả lập cho Distributed Tracing (Microservices Tracking)
    config.headers['X-Trace-Id'] = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi toàn cục & Auto Refresh Token / Redirect
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    //const originalRequest = error.config;

    // Xử lý lỗi 401 Unauthorized (Token hết hạn hoặc chưa đăng nhập)
    if (error.response && error.response.status === 401) {
      /* 
       * [KHI NỐI BACKEND THẬT CÓ REFRESH TOKEN]:
       * Un-comment đoạn này để tự động làm mới token thầm lặng
       * 
       * if (!originalRequest._retry) {
       *   originalRequest._retry = true;
       *   try {
       *     await axiosClient.post('/auth/refresh-token');
       *     return axiosClient(originalRequest);
       *   } catch (refreshErr) {
       *     // Refresh token cũng hết hạn -> logout hẳn
       *   }
       * }
       */

      // Dọn dẹp cache thông tin user & điều hướng về màn hình đăng nhập
      localStorage.removeItem('ewallet_token'); // [DEMO FALLBACK: Xóa dòng này khi nối Backend thật]
      localStorage.removeItem('ewallet_user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
