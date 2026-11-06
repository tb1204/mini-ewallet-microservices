import axiosClient from './axiosClient';

const AUTH_SERVICE_URL = '/v1/auth';

/**
 * Authentication and PIN security API endpoints
 */
export const authApi = {
  /**
   * Authenticate user with credentials (email/phone and password)
   * @param {Object} credentials - { emailOrPhone, password }
   */
  login: async ({ emailOrPhone, usernameOrEmail, password }) => {
    const identifier = usernameOrEmail || emailOrPhone;
    return await axiosClient.post(`${AUTH_SERVICE_URL}/login`, {
      usernameOrEmail: identifier,
      emailOrPhone: identifier,
      password,
    });
  },

  /**
   * Register a new user account
   * @param {Object} data - { username, email, phoneNumber, password, fullName, pin, avatarUrl }
   */
  register: async ({ username, email, phoneNumber, password, fullName, pin, avatarUrl }) => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/register`, {
      username: username || email?.split('@')[0] || `user_${Date.now()}`,
      email,
      phoneNumber,
      password,
      fullName,
      pin: null,
      avatarUrl,
    });
  },

  /**
   * Request silent token refresh using 7-day Refresh Token
   * @param {string} refreshToken
   */
  refreshToken: async (refreshToken) => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/refresh-token`, {
      refreshToken,
    });
  },

  /**
   * Verify user's 6-digit transaction PIN
   * @param {string} pin
   */
  verifyPin: async (pin) => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/verify-pin`, { pin });
  },

  /**
   * Set up or change user's 6-digit transaction PIN
   * @param {Object} data - { oldPin, newPin }
   */
  changePin: async ({ oldPin, newPin }) => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/change-pin`, {
      oldPin,
      newPin,
    });
  },

  /**
   * Send real 6-digit OTP to user's registered email for PIN reset
   */
  sendPinResetOtp: async () => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/forgot-pin/send-otp`);
  },

  /**
   * Verify 6-digit OTP entered by user
   * @param {string} otp
   */
  verifyPinResetOtp: async (otp) => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/forgot-pin/verify-otp`, { otp });
  },

  /**
   * Reset transaction PIN using verified OTP
   * @param {Object} data - { otp, newPin }
   */
  resetPinWithOtp: async ({ otp, newPin }) => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/forgot-pin/reset`, { otp, newPin });
  },

  /**
   * Logout current authenticated session and revoke active refresh tokens
   */
  logout: async () => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/logout`);
  },
};

export default authApi;
