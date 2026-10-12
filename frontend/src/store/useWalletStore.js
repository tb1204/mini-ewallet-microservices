import { create } from 'zustand';
import transactionApi from '../api/transactionApi';

// Initial Mock Transactions based on transaction_db schema
const initialTransactions = [
  {
    id: 'tx-1001',
    transactionCode: 'TXN20260804001',
    idempotencyKey: '7c9e6679-7425-40de-944b-[#idemp1]',
    sourceWalletId: null,
    targetWalletId: 'w-user-111',
    type: 'TOPUP',
    amount: 25000000,
    fee: 0,
    status: 'SUCCESS',
    traceId: 'trace-88219-zipkin-a1',
    description: 'Nạp tiền vào ví qua Chuyển khoản ngân hàng',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'tx-1002',
    transactionCode: 'TXN20260804002',
    idempotencyKey: 'a1b2c3d4-e5f6-4a5b-[#idemp2]',
    sourceWalletId: 'w-user-111',
    targetWalletId: 'w-admin-999',
    type: 'TRANSFER',
    amount: 1500000,
    fee: 0,
    status: 'SUCCESS',
    traceId: 'trace-99120-zipkin-b2',
    description: 'Chuyển tiền P2P cho Quản Trị Viên (Admin)',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'tx-1003',
    transactionCode: 'TXN20260804003',
    idempotencyKey: 'f9e8d7c6-b5a4-4f3e-[#idemp3]',
    sourceWalletId: 'w-user-111',
    targetWalletId: null,
    type: 'WITHDRAW',
    amount: 500000,
    fee: 5000,
    status: 'SUCCESS',
    traceId: 'trace-12345-zipkin-c3',
    description: 'Rút tiền về Vietcombank (STK: 9988776655)',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    completedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

export const useWalletStore = create((set, get) => ({
  balance: JSON.parse(localStorage.getItem('ewallet_balance')) ?? 23000000,
  currency: 'VND',
  status: 'ACTIVE',
  version: 0, // Optimistic locking version
  transactions: JSON.parse(localStorage.getItem('ewallet_transactions')) || initialTransactions,

  // Top Up Action
  executeTopUp: async ({ amount, paymentMethod, idempotencyKey, description }) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const { balance, transactions, version } = get();
    const numAmount = parseFloat(amount);
    const code = `TXN${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`;
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newTx = {
      id: `tx-${Date.now()}`,
      transactionCode: code,
      idempotencyKey,
      sourceWalletId: null,
      targetWalletId: 'w-user-111',
      type: 'TOPUP',
      amount: numAmount,
      fee: 0,
      status: 'SUCCESS',
      traceId,
      description: description || `Nạp tiền qua phương thức ${paymentMethod}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const newBalance = balance + numAmount;
    const updatedTxs = [newTx, ...transactions];

    localStorage.setItem('ewallet_balance', JSON.stringify(newBalance));
    localStorage.setItem('ewallet_transactions', JSON.stringify(updatedTxs));

    set({
      balance: newBalance,
      transactions: updatedTxs,
      version: version + 1
    });

    return newTx;
  },

  // Transfer P2P Action
  executeTransfer: async ({ recipientEmailOrPhone, amount, pin, idempotencyKey, description }) => {
    const { balance, transactions, version } = get();
    const numAmount = parseFloat(amount);

    if (numAmount > balance) {
      throw new Error('Số dư ví không đủ để thực hiện chuyển tiền!');
    }

    try {
      // Call Backend transaction-service API if token is present
      const token = localStorage.getItem('ewallet_token');
      if (token) {
        const response = await transactionApi.transferP2P({
          recipient: recipientEmailOrPhone,
          amount: numAmount,
          pin: pin || '123456',
          description: description || `Chuyển tiền tới ${recipientEmailOrPhone}`,
          idempotencyKey
        });

        const txData = response?.result || response?.data || response;
        const newBalance = balance - numAmount;
        const updatedTxs = [txData, ...transactions];

        localStorage.setItem('ewallet_balance', JSON.stringify(newBalance));
        localStorage.setItem('ewallet_transactions', JSON.stringify(updatedTxs));

        set({
          balance: newBalance,
          transactions: updatedTxs,
          version: version + 1
        });

        return txData;
      }
    } catch (apiErr) {
      console.warn('Backend API call failed, falling back to local simulation:', apiErr);
      if (apiErr.response?.data?.message) {
        throw new Error(apiErr.response.data.message);
      }
    }

    // Fallback simulation when running offline without backend token
    await new Promise((resolve) => setTimeout(resolve, 600));
    const code = `TXN${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`;
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newTx = {
      id: `tx-${Date.now()}`,
      transactionCode: code,
      idempotencyKey,
      sourceWalletId: 'w-user-111',
      targetWalletId: `w-recip-${recipientEmailOrPhone}`,
      type: 'TRANSFER',
      amount: numAmount,
      fee: 0,
      status: 'SUCCESS',
      traceId,
      description: description || `Chuyển tiền tới ${recipientEmailOrPhone}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const newBalance = balance - numAmount;
    const updatedTxs = [newTx, ...transactions];

    localStorage.setItem('ewallet_balance', JSON.stringify(newBalance));
    localStorage.setItem('ewallet_transactions', JSON.stringify(updatedTxs));

    set({
      balance: newBalance,
      transactions: updatedTxs,
      version: version + 1
    });

    return newTx;
  },

  // Withdraw Action
  executeWithdraw: async ({ bankName, accountNumber, accountName, amount, idempotencyKey }) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const { balance, transactions, version } = get();
    const numAmount = parseFloat(amount);
    const fee = 5000; // 5,000 VND withdrawal fee
    const totalDeduction = numAmount + fee;

    if (totalDeduction > balance) {
      throw new Error(`Số dư không đủ! Cần có ${totalDeduction.toLocaleString('vi-VN')} VNĐ (bao gồm phí 5.000 VNĐ)`);
    }

    const code = `TXN${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`;
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newTx = {
      id: `tx-${Date.now()}`,
      transactionCode: code,
      idempotencyKey,
      sourceWalletId: 'w-user-111',
      targetWalletId: null,
      type: 'WITHDRAW',
      amount: numAmount,
      fee,
      status: 'SUCCESS',
      traceId,
      description: `Rút tiền về ${bankName} (${accountNumber} - ${accountName})`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const newBalance = balance - totalDeduction;
    const updatedTxs = [newTx, ...transactions];

    localStorage.setItem('ewallet_balance', JSON.stringify(newBalance));
    localStorage.setItem('ewallet_transactions', JSON.stringify(updatedTxs));

    set({
      balance: newBalance,
      transactions: updatedTxs,
      version: version + 1
    });

    return newTx;
  },

  // Savings State
  savingsAccounts: JSON.parse(localStorage.getItem('ewallet_savings')) || [
    {
      id: 'sav-101',
      title: 'Tiết kiệm linh hoạt 4.0%/năm',
      termMonths: 0,
      interestRate: 4.0,
      amount: 5000000,
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
    }
  ],

  // Utility Payment Action (Phone Top-up, Bills, Data, Movies, Insurance)
  executeUtilityPayment: async ({ serviceName, provider, targetId, amount, details, idempotencyKey }) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const { balance, transactions, version } = get();
    const numAmount = parseFloat(amount);

    if (numAmount > balance) {
      throw new Error(`Số dư ví không đủ! Bạn cần ${numAmount.toLocaleString('vi-VN')} VNĐ để thanh toán.`);
    }

    const code = `TXN${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`;
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const desc = details || `Thanh toán dịch vụ ${serviceName} (${provider || ''} ${targetId || ''})`.trim();

    const newTx = {
      id: `tx-${Date.now()}`,
      transactionCode: code,
      idempotencyKey: idempotencyKey || `idemp-${Date.now()}`,
      sourceWalletId: 'w-user-111',
      targetWalletId: provider ? `provider-${provider}` : null,
      type: 'PAYMENT',
      amount: numAmount,
      fee: 0,
      status: 'SUCCESS',
      traceId,
      description: desc,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const newBalance = balance - numAmount;
    const updatedTxs = [newTx, ...transactions];

    localStorage.setItem('ewallet_balance', JSON.stringify(newBalance));
    localStorage.setItem('ewallet_transactions', JSON.stringify(updatedTxs));

    set({
      balance: newBalance,
      transactions: updatedTxs,
      version: version + 1
    });

    return newTx;
  },

  // Deposit Savings
  depositSavings: async ({ title, termMonths, interestRate, amount, idempotencyKey }) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const { balance, transactions, savingsAccounts, version } = get();
    const numAmount = parseFloat(amount);

    if (numAmount > balance) {
      throw new Error(`Số dư ví không đủ để gửi tiết kiệm ${numAmount.toLocaleString('vi-VN')} VNĐ!`);
    }

    const newSavings = {
      id: `sav-${Date.now()}`,
      title: title || `Tiết kiệm ${termMonths === 0 ? 'Linh hoạt' : `${termMonths} tháng`}`,
      termMonths: parseInt(termMonths),
      interestRate: parseFloat(interestRate),
      amount: numAmount,
      createdAt: new Date().toISOString()
    };

    const code = `TXN${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`;
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newTx = {
      id: `tx-${Date.now()}`,
      transactionCode: code,
      idempotencyKey: idempotencyKey || `idemp-${Date.now()}`,
      sourceWalletId: 'w-user-111',
      targetWalletId: 'w-savings-vault',
      type: 'PAYMENT',
      amount: numAmount,
      fee: 0,
      status: 'SUCCESS',
      traceId,
      description: `Mở Sổ Tiết Kiệm Ví: ${newSavings.title} (${numAmount.toLocaleString('vi-VN')} VNĐ - Lãi ${interestRate}%/năm)`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const newBalance = balance - numAmount;
    const updatedSavings = [newSavings, ...savingsAccounts];
    const updatedTxs = [newTx, ...transactions];

    localStorage.setItem('ewallet_balance', JSON.stringify(newBalance));
    localStorage.setItem('ewallet_savings', JSON.stringify(updatedSavings));
    localStorage.setItem('ewallet_transactions', JSON.stringify(updatedTxs));

    set({
      balance: newBalance,
      savingsAccounts: updatedSavings,
      transactions: updatedTxs,
      version: version + 1
    });

    return newSavings;
  },

  // Withdraw Savings
  withdrawSavings: async ({ savingsId }) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const { balance, transactions, savingsAccounts, version } = get();
    const item = savingsAccounts.find((s) => s.id === savingsId);

    if (!item) {
      throw new Error('Sổ tiết kiệm không tồn tại!');
    }

    // Rough estimated interest earned for demo
    const daysActive = Math.max(1, Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86400000));
    const estimatedInterest = Math.round((item.amount * (item.interestRate / 100) * daysActive) / 365);
    const totalPayout = item.amount + estimatedInterest;

    const code = `TXN${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`;
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newTx = {
      id: `tx-${Date.now()}`,
      transactionCode: code,
      idempotencyKey: `idemp-withdraw-sav-${Date.now()}`,
      sourceWalletId: 'w-savings-vault',
      targetWalletId: 'w-user-111',
      type: 'TOPUP',
      amount: totalPayout,
      fee: 0,
      status: 'SUCCESS',
      traceId,
      description: `Rút Sổ Tiết Kiệm về Ví (Gốc: ${item.amount.toLocaleString('vi-VN')} + Lãi: ${estimatedInterest.toLocaleString('vi-VN')} VNĐ)`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const newBalance = balance + totalPayout;
    const updatedSavings = savingsAccounts.filter((s) => s.id !== savingsId);
    const updatedTxs = [newTx, ...transactions];

    localStorage.setItem('ewallet_balance', JSON.stringify(newBalance));
    localStorage.setItem('ewallet_savings', JSON.stringify(updatedSavings));
    localStorage.setItem('ewallet_transactions', JSON.stringify(updatedTxs));

    set({
      balance: newBalance,
      savingsAccounts: updatedSavings,
      transactions: updatedTxs,
      version: version + 1
    });

    return totalPayout;
  }
}));

