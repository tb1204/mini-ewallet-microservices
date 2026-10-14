import axiosClient from './axiosClient';

const SAVINGS_SERVICE_URL = '/v1/savings';

/**
 * Savings account management API endpoints
 */
export const savingsApi = {
  /**
   * Retrieve all savings accounts belonging to current authenticated user
   */
  getMySavings: async () => {
    return await axiosClient.get(`${SAVINGS_SERVICE_URL}/me`);
  },

  /**
   * Open / deposit into a new savings account
   * @param {Object} data - { title, termMonths, interestRate, amount }
   */
  depositSavings: async ({ title, termMonths, interestRate, amount }) => {
    return await axiosClient.post(SAVINGS_SERVICE_URL, {
      title,
      termMonths: parseInt(termMonths, 10),
      interestRate: parseFloat(interestRate),
      amount: parseFloat(amount),
    });
  },

  /**
   * Withdraw / settle an active savings account
   * @param {string} savingsId
   */
  withdrawSavings: async (savingsId) => {
    return await axiosClient.post(`${SAVINGS_SERVICE_URL}/${savingsId}/withdraw`);
  },
};

export default savingsApi;
