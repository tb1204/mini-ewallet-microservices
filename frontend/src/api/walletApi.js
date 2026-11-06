import axiosClient from './axiosClient';

const WALLET_SERVICE_URL = '/v1/wallets';

/**
 * Wallet management API endpoints
 */
export const walletApi = {
  /**
   * Retrieve current authenticated user's wallet details (balance, currency, status)
   */
  getMyWallet: async () => {
    return await axiosClient.get(`${WALLET_SERVICE_URL}/me`);
  },

  /**
   * Retrieve wallet details by user UUID
   * @param {string} userId
   */
  getWalletByUserId: async (userId) => {
    return await axiosClient.get(`${WALLET_SERVICE_URL}/user/${userId}`);
  },

  /**
   * Top-up balance into current user's wallet
   * @param {Object} data - { amount }
   */
  topUp: async ({ amount }) => {
    return await axiosClient.post(`${WALLET_SERVICE_URL}/top-up`, {
      amount: parseFloat(amount),
    });
  },

  /**
   * Withdraw funds from current user's wallet
   * @param {Object} data - { amount, pin }
   */
  withdraw: async ({ amount, pin }) => {
    return await axiosClient.post(`${WALLET_SERVICE_URL}/withdraw`, {
      amount: parseFloat(amount),
      pin,
    });
  },

  /**
   * Retrieve all linked bank accounts for current user
   */
  getLinkedBanks: async () => {
    return await axiosClient.get(`${WALLET_SERVICE_URL}/linked-banks`);
  },

  /**
   * Link a new bank account
   * @param {Object} data - { bankCode, bankName, accountNumber, accountHolderName, isDefault }
   */
  linkBank: async (data) => {
    return await axiosClient.post(`${WALLET_SERVICE_URL}/linked-banks`, data);
  },

  /**
   * Set a linked bank account as default
   * @param {string} id - Linked bank account UUID
   */
  setDefaultBank: async (id) => {
    return await axiosClient.patch(`${WALLET_SERVICE_URL}/linked-banks/${id}/default`);
  },

  /**
   * Unlink a bank account
   * @param {string} id - Linked bank account UUID
   */
  unlinkBank: async (id) => {
    return await axiosClient.delete(`${WALLET_SERVICE_URL}/linked-banks/${id}`);
  },

  /**
   * Admin Query: Retrieve all wallets with optional keyword, status filters, and pagination
   * @param {Object} params - { keyword, status, page, size, sort }
   */
  getAllWallets: async (params = {}) => {
    return await axiosClient.get(WALLET_SERVICE_URL, { params });
  },

  /**
   * Admin Action: Toggle or update wallet status
   * @param {string} id - Target wallet UUID
   * @param {string} [status] - Optional new status (ACTIVE | LOCKED)
   */
  updateWalletStatus: async (id, status) => {
    return await axiosClient.put(`${WALLET_SERVICE_URL}/${id}/status`, null, {
      params: status ? { status } : {},
    });
  },
};

export default walletApi;
