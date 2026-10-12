import axiosClient from './axiosClient';

const TRANSACTION_SERVICE_URL = import.meta.env.VITE_TRANSACTION_SERVICE_URL || 'http://localhost:8083/api/v1/transactions';

export const transactionApi = {
  transferP2P: async ({ recipient, amount, pin, description, idempotencyKey }) => {
    return await axiosClient.post(`${TRANSACTION_SERVICE_URL}/transfer`, {
      recipient,
      amount: parseFloat(amount),
      pin,
      description,
      idempotencyKey
    });
  },

  getTransactionHistory: async () => {
    return await axiosClient.get(`${TRANSACTION_SERVICE_URL}/history`);
  },

  getTransactionDetail: async (id) => {
    return await axiosClient.get(`${TRANSACTION_SERVICE_URL}/${id}`);
  }
};

export default transactionApi;
