import axiosClient from './axiosClient';

const USER_SERVICE_URL = '/v1/users';

/**
 * User profile and administration API endpoints
 */
export const userApi = {
  /**
   * Get current authenticated user profile
   */
  getProfile: async () => {
    return await axiosClient.get(`${USER_SERVICE_URL}/profile`);
  },

  /**
   * Get specific user profile details by UUID
   * @param {string} id
   */
  getUserById: async (id) => {
    return await axiosClient.get(`${USER_SERVICE_URL}/${id}`);
  },

  /**
   * Search user by identifier (phone, email, username, or UUID)
   * @param {string} identifier
   */
  searchUserByIdentifier: async (identifier) => {
    return await axiosClient.get(`${USER_SERVICE_URL}/search/${encodeURIComponent(identifier)}`);
  },

  /**
   * Update current user's profile metadata (full name, avatar URL)
   * @param {Object} data - { fullName, avatarUrl }
   */
  updateProfile: async ({ fullName, avatarUrl }) => {
    return await axiosClient.put(`${USER_SERVICE_URL}/profile`, {
      fullName,
      avatarUrl,
    });
  },

  /**
   * Change current user's login password
   * @param {Object} data - { oldPassword, newPassword }
   */
  changePassword: async ({ oldPassword, newPassword }) => {
    return await axiosClient.put(`${USER_SERVICE_URL}/change-password`, {
      oldPassword,
      newPassword,
    });
  },

  /**
   * Admin Query: Get all users with keyword, role, status filtering and pagination
   * @param {Object} params - { keyword, role, isActive, page, size, sort }
   */
  getAllUsers: async (params = {}) => {
    return await axiosClient.get(USER_SERVICE_URL, { params });
  },

  /**
   * Admin Action: Toggle user active status (ACTIVE <-> BLOCKED)
   * @param {string} id - Target user UUID
   */
  toggleUserStatus: async (id) => {
    return await axiosClient.put(`${USER_SERVICE_URL}/${id}/status`);
  },

  /**
   * Admin Action: Update user authorization role
   * @param {string} id - Target user UUID
   * @param {string} role - ROLE_USER | ROLE_STAFF | ROLE_ADMIN
   */
  updateUserRole: async (id, role) => {
    return await axiosClient.put(`${USER_SERVICE_URL}/${id}/role`, null, {
      params: { role },
    });
  },

  /**
   * Admin Action: Full update of user information
   * @param {string} id - Target user UUID
   * @param {Object} data - { fullName, email, phoneNumber, role, isActive }
   */
  adminUpdateUser: async (id, data) => {
    return await axiosClient.put(`${USER_SERVICE_URL}/${id}`, data);
  },
};

export default userApi;
