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
  login: async ({ emailOrPhone, password }) => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/login`, {
      emailOrPhone,
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
      pin: pin || '123456',
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
   * Logout current authenticated session and revoke active refresh tokens
   */
  logout: async () => {
    return await axiosClient.post(`${AUTH_SERVICE_URL}/logout`);
  },
};

export default authApi;
