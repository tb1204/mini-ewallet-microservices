import { create } from 'zustand';
import { walletApi, transactionApi, savingsApi } from '../api';

/**
 * Wallet, Transactions, and Savings State Store
 */
export const useWalletStore = create((set, get) => ({
  wallet: null,
  balance: 0,
  currency: 'VND',
  status: 'ACTIVE',
  version: 0,
  transactions: [],
  savingsAccounts: [],
  isLoading: false,

  /**
   * Fetch current authenticated user's wallet details from wallet-service
   */
  fetchMyWallet: async () => {
    try {
      const response = await walletApi.getMyWallet();
      const walletData = response?.result || response?.data || response;
      if (walletData) {
        set({
          wallet: walletData,
          balance: parseFloat(walletData.balance) || 0,
          currency: walletData.currency || 'VND',
          status: walletData.status || 'ACTIVE',
          version: (get().version || 0) + 1,
        });
      }
      return walletData;
    } catch (error) {
      console.warn('Failed to fetch wallet:', error);
      return null;
    }
  },

  /**
   * Fetch transaction history for current user from transaction-service
   */
  fetchTransactions: async () => {
    try {
      const response = await transactionApi.getTransactionHistory();
      const txs = response?.result || response?.data || [];
      const safeList = Array.isArray(txs) ? txs : [];
      set({ transactions: safeList });
      return safeList;
    } catch (error) {
      console.warn('Failed to fetch transactions:', error);
      return [];
    }
  },

  /**
   * Fetch user's active savings accounts from wallet-service
   */
  fetchSavings: async () => {
    try {
      const response = await savingsApi.getMySavings();
      const savings = response?.result || response?.data || [];
      const safeList = Array.isArray(savings) ? savings : [];
      set({ savingsAccounts: safeList });
      return safeList;
    } catch (error) {
      console.warn('Failed to fetch savings accounts:', error);
      return [];
    }
  },

  /**
   * Execute Top-Up (Deposit) into wallet
   * @param {Object} payload - { amount, paymentMethod, idempotencyKey, description }
   */
  executeTopUp: async ({ amount, paymentMethod, idempotencyKey, description }) => {
    set({ isLoading: true });
    try {
      const numAmount = parseFloat(amount);
      const response = await walletApi.topUp({ amount: numAmount });
      const walletData = response?.result || response?.data;

      // Refresh wallet & transaction history
      await Promise.allSettled([get().fetchMyWallet(), get().fetchTransactions()]);

      set({ isLoading: false });
      return walletData;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || error.message || 'Top-up failed';
      throw new Error(message);
    }
  },

  /**
   * Execute P2P Transfer to recipient
   * @param {Object} payload - { recipientEmailOrPhone, amount, pin, idempotencyKey, description }
   */
  executeTransfer: async ({ recipientEmailOrPhone, amount, pin, idempotencyKey, description }) => {
    set({ isLoading: true });
    try {
      const numAmount = parseFloat(amount);
      const response = await transactionApi.transferP2P({
        recipient: recipientEmailOrPhone,
        amount: numAmount,
        pin,
        description,
        idempotencyKey,
      });

      const txData = response?.result || response?.data;

      // Refresh wallet & transaction history
      await Promise.allSettled([get().fetchMyWallet(), get().fetchTransactions()]);

      set({ isLoading: false });
      return txData;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || error.message || 'Transfer failed';
      throw new Error(message);
    }
  },

  /**
   * Execute Withdrawal from wallet to bank account
   * @param {Object} payload - { bankName, accountNumber, accountName, amount, pin, idempotencyKey }
   */
  executeWithdraw: async ({ bankName, accountNumber, accountName, amount, pin, idempotencyKey }) => {
    set({ isLoading: true });
    try {
      const numAmount = parseFloat(amount);
      const response = await walletApi.withdraw({
        amount: numAmount,
        pin,
      });

      const walletData = response?.result || response?.data;

      // Refresh wallet & transaction history
      await Promise.allSettled([get().fetchMyWallet(), get().fetchTransactions()]);

      set({ isLoading: false });
      return walletData;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || error.message || 'Withdrawal failed';
      throw new Error(message);
    }
  },

  /**
   * Open a new savings account
   * @param {Object} payload - { title, termMonths, interestRate, amount, idempotencyKey }
   */
  depositSavings: async ({ title, termMonths, interestRate, amount, idempotencyKey }) => {
    set({ isLoading: true });
    try {
      const response = await savingsApi.depositSavings({
        title,
        termMonths,
        interestRate,
        amount,
      });

      const savingsData = response?.result || response?.data;

      // Refresh wallet & savings accounts
      await Promise.allSettled([get().fetchMyWallet(), get().fetchSavings()]);

      set({ isLoading: false });
      return savingsData;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || error.message || 'Failed to deposit savings';
      throw new Error(message);
    }
  },

  /**
   * Settle and withdraw savings account back into wallet
   * @param {Object} payload - { savingsId }
   */
  withdrawSavings: async ({ savingsId }) => {
    set({ isLoading: true });
    try {
      const response = await savingsApi.withdrawSavings(savingsId);
      const resultData = response?.result || response?.data;

      // Refresh wallet & savings accounts
      await Promise.allSettled([get().fetchMyWallet(), get().fetchSavings()]);

      set({ isLoading: false });
      return resultData;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || error.message || 'Failed to settle savings';
      throw new Error(message);
    }
  },

  /**
   * Utility Payment Action (Phone top-up, bills, data packages, movie tickets, insurance)
   */
  executeUtilityPayment: async ({ serviceName, provider, targetId, amount, details, idempotencyKey }) => {
    set({ isLoading: true });
    try {
      const numAmount = parseFloat(amount);
      const desc = details || `Payment for ${serviceName} (${provider || ''} ${targetId || ''})`.trim();

      // Execute as a withdrawal/payment operation
      const response = await walletApi.withdraw({
        amount: numAmount,
        pin: '123456', // Default system transaction verification
      });

      await Promise.allSettled([get().fetchMyWallet(), get().fetchTransactions()]);

      set({ isLoading: false });
      return response?.result || response?.data;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || error.message || 'Utility payment failed';
      throw new Error(message);
    }
  },
}));

export default useWalletStore;
