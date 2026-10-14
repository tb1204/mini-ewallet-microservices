import axiosClient from './axiosClient';

const TRANSACTION_SERVICE_URL = '/v1/transactions';

/**
 * Transaction and money transfer API endpoints
 */
export const transactionApi = {
  /**
   * Execute P2P money transfer via Saga orchestration
   * @param {Object} data - { recipient, amount, pin, description, idempotencyKey }
   */
  transferP2P: async ({ recipient, amount, pin, description, idempotencyKey }) => {
    return await axiosClient.post(`${TRANSACTION_SERVICE_URL}/transfer`, {
      recipient,
      amount: parseFloat(amount),
      pin,
      description,
      idempotencyKey,
    });
  },

  /**
   * Retrieve transaction history for current user's wallet
   */
  getTransactionHistory: async () => {
    return await axiosClient.get(`${TRANSACTION_SERVICE_URL}/history`);
  },

  /**
   * Retrieve transaction detail by transaction UUID
   * @param {string} id
   */
  getTransactionDetail: async (id) => {
    return await axiosClient.get(`${TRANSACTION_SERVICE_URL}/${id}`);
  },

  /**
   * Retrieve transaction detail by unique transaction code (e.g., TXN...)
   * @param {string} code
   */
  getTransactionByCode: async (code) => {
    return await axiosClient.get(`${TRANSACTION_SERVICE_URL}/code/${code}`);
  },

  /**
   * Admin Query: Retrieve all system transactions with pagination, keyword search, and status filtering
   * @param {Object} params - { keyword, status, page, size, sort }
   */
  getAllSystemTransactions: async (params = {}) => {
    return await axiosClient.get(`${TRANSACTION_SERVICE_URL}/admin`, { params });
  },
};

export default transactionApi;
