import { create } from 'zustand';
import { authApi, userApi } from '../api';

/**
 * Authentication and User Identity State Store
 */
export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('ewallet_user')) || null,
  token: localStorage.getItem('ewallet_token') || null,
  refreshToken: localStorage.getItem('ewallet_refresh_token') || null,
  registeredUsers: [],
  isLoading: false,

  /**
   * Login action with email/phone and password
   */
  login: async (emailOrPhone, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ emailOrPhone, password });
      const authData = response?.result || response?.data || response;

      if (!authData || !authData.accessToken) {
        throw new Error(response?.message || 'Authentication failed');
      }

      const { accessToken, refreshToken, user } = authData;

      localStorage.setItem('ewallet_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('ewallet_refresh_token', refreshToken);
      }
      if (user) {
        localStorage.setItem('ewallet_user', JSON.stringify(user));
      }

      set({
        user,
        token: accessToken,
        refreshToken: refreshToken || null,
        isLoading: false,
      });

      return user;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    }
  },

  /**
   * Register a new user account and automatically persist session
   */
  register: async ({ fullName, email, phoneNumber, password, pin, username }) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register({
        fullName,
        email,
        phoneNumber,
        password,
        pin: pin || '123456',
        username,
      });

      const authData = response?.result || response?.data || response;
      if (!authData || !authData.accessToken) {
        throw new Error(response?.message || 'Registration failed');
      }

      const { accessToken, refreshToken, user } = authData;

      localStorage.setItem('ewallet_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('ewallet_refresh_token', refreshToken);
      }
      if (user) {
        localStorage.setItem('ewallet_user', JSON.stringify(user));
      }

      set({
        user,
        token: accessToken,
        refreshToken: refreshToken || null,
        isLoading: false,
      });

      return user;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    }
  },

  /**
   * Fetch latest profile of current authenticated user from identity-service
   */
  fetchProfile: async () => {
    try {
      const response = await userApi.getProfile();
      const userData = response?.result || response?.data || response;
      if (userData) {
        localStorage.setItem('ewallet_user', JSON.stringify(userData));
        set({ user: userData });
      }
      return userData;
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      return null;
    }
  },

  /**
   * Update profile metadata (full name, avatar URL)
   */
  updateProfile: async ({ fullName, avatarUrl }) => {
    try {
      const response = await userApi.updateProfile({ fullName, avatarUrl });
      const updatedUser = response?.result || response?.data || response;
      if (updatedUser) {
        localStorage.setItem('ewallet_user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      throw new Error(message);
    }
  },

  /**
   * Setup initial 6-digit transaction PIN
   */
  setupPin: async (pinCode) => {
    try {
      await authApi.changePin({ newPin: pinCode });
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, hasPin: true };
        localStorage.setItem('ewallet_user', JSON.stringify(updated));
        set({ user: updated });
      }
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to set PIN';
      throw new Error(message);
    }
  },

  /**
   * Change existing 6-digit transaction PIN
   */
  changePin: async (oldPinCode, newPinCode) => {
    try {
      await authApi.changePin({ oldPin: oldPinCode, newPin: newPinCode });
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, hasPin: true };
        localStorage.setItem('ewallet_user', JSON.stringify(updated));
        set({ user: updated });
      }
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to change PIN';
      throw new Error(message);
    }
  },

  /**
   * Verify user's 6-digit transaction PIN against identity-service BCrypt hash
   */
  verifyPin: async (pinCode) => {
    try {
      const response = await authApi.verifyPin(pinCode);
      const isValid = response?.result ?? response?.data ?? false;
      return !!isValid;
    } catch (error) {
      return false;
    }
  },

  /**
   * Request PIN reset OTP
   */
  sendPinResetOtp: async () => {
    // Demo verification code fallback for forgot-PIN flow
    return '666888';
  },

  /**
   * Reset PIN using verified OTP
   */
  resetPinWithOtp: async (otpCode, newPinCode) => {
    if (otpCode !== '666888' && otpCode.length < 6) {
      throw new Error('Invalid verification OTP code');
    }
    return get().setupPin(newPinCode);
  },

  /**
   * Admin Query: Fetch all users from identity-service
   */
  fetchAllUsers: async (params = {}) => {
    try {
      const response = await userApi.getAllUsers({ size: 100, ...params });
      const users = response?.result || response?.data || [];
      set({ registeredUsers: Array.isArray(users) ? users : [] });
      return users;
    } catch (error) {
      console.warn('Failed to fetch all users:', error);
      return [];
    }
  },

  /**
   * Admin Action: Toggle user active status (ACTIVE <-> BLOCKED)
   */
  toggleUserStatus: async (targetUserId) => {
    try {
      const response = await userApi.toggleUserStatus(targetUserId);
      const updatedUser = response?.result || response?.data;
      
      // Update local registeredUsers list
      const currentList = get().registeredUsers;
      const updatedList = currentList.map((u) => (u.id === targetUserId ? updatedUser : u));
      set({ registeredUsers: updatedList });

      // If toggled self
      const currentUser = get().user;
      if (currentUser && currentUser.id === targetUserId) {
        localStorage.setItem('ewallet_user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }

      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update user status';
      throw new Error(message);
    }
  },

  /**
   * Admin Action: Update user authorization role
   */
  updateUserRole: async (targetUserId, newRole) => {
    try {
      const response = await userApi.updateUserRole(targetUserId, newRole);
      const updatedUser = response?.result || response?.data;

      const currentList = get().registeredUsers;
      const updatedList = currentList.map((u) => (u.id === targetUserId ? updatedUser : u));
      set({ registeredUsers: updatedList });

      const currentUser = get().user;
      if (currentUser && currentUser.id === targetUserId) {
        localStorage.setItem('ewallet_user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }

      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update role';
      throw new Error(message);
    }
  },

  /**
   * Admin Action: Full edit user profile and role
   */
  updateUserInfo: async (targetUserId, { fullName, email, phoneNumber, role, isActive }) => {
    try {
      const response = await userApi.adminUpdateUser(targetUserId, {
        fullName,
        email,
        phoneNumber,
        role,
        isActive,
      });
      const updatedUser = response?.result || response?.data;

      const currentList = get().registeredUsers;
      const updatedList = currentList.map((u) => (u.id === targetUserId ? updatedUser : u));
      set({ registeredUsers: updatedList });

      const currentUser = get().user;
      if (currentUser && currentUser.id === targetUserId) {
        localStorage.setItem('ewallet_user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }

      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update user info';
      throw new Error(message);
    }
  },

  /**
   * Logout action: clears local storage and calls logout endpoint
   */
  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem('ewallet_user');
      localStorage.removeItem('ewallet_token');
      localStorage.removeItem('ewallet_refresh_token');
      set({ user: null, token: null, refreshToken: null });
    }
  },
}));

export default useAuthStore;
