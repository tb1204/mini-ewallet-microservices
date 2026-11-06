import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { userApi, walletApi } from '../../api';
import {
  Send,
  Building2,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  X,
  CreditCard,
  Landmark,
  BadgeCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PinRequiredModal from '../../components/modals/PinRequiredModal';

// Popular Vietnamese Banks with NAPAS support and official VietQR logos
const POPULAR_BANKS = [
  { id: 'MB', bin: '970422', name: 'MBBank', fullName: 'Ngân hàng Quân Đội', logo: 'https://cdn.vietqr.io/img/MB.png' },
  { id: 'VCB', bin: '970436', name: 'Vietcombank', fullName: 'Ngoại Thương Việt Nam', logo: 'https://cdn.vietqr.io/img/VCB.png' },
  { id: 'TCB', bin: '970407', name: 'Techcombank', fullName: 'Kỹ Thương Việt Nam', logo: 'https://cdn.vietqr.io/img/TCB.png' },
  { id: 'ICB', bin: '970415', name: 'VietinBank', fullName: 'Công Thương Việt Nam', logo: 'https://cdn.vietqr.io/img/ICB.png' },
  { id: 'BIDV', bin: '970418', name: 'BIDV', fullName: 'Đầu Tư và Phát Triển VN', logo: 'https://cdn.vietqr.io/img/BIDV.png' },
  { id: 'ACB', bin: '970416', name: 'ACB', fullName: 'Á Châu', logo: 'https://cdn.vietqr.io/img/ACB.png' },
  { id: 'VPB', bin: '970432', name: 'VPBank', fullName: 'Việt Nam Thịnh Vượng', logo: 'https://cdn.vietqr.io/img/VPB.png' },
  { id: 'TPB', bin: '970423', name: 'TPBank', fullName: 'Tiên Phong', logo: 'https://cdn.vietqr.io/img/TPB.png' },
  { id: 'STB', bin: '970403', name: 'Sacombank', fullName: 'Sài Gòn Thương Tín', logo: 'https://cdn.vietqr.io/img/SACOMBANK.png' },
  { id: 'VIB', bin: '970441', name: 'VIB', fullName: 'Quốc Tế Việt Nam', logo: 'https://cdn.vietqr.io/img/VIB.png' },
  { id: 'VBA', bin: '970405', name: 'Agribank', fullName: 'Nông Nghiệp và Phát Triển NT', logo: 'https://cdn.vietqr.io/img/VBA.png' },
];

export default function TransferPage() {
  const { user, verifyPin, registeredUsers = [] } = useAuthStore();
  const { balance = 0, executeTransfer, fetchMyWallet } = useWalletStore();
  const navigate = useNavigate();

  // Transfer Mode: 'WALLET' (P2P) or 'BANK' (Napas 247)
  const [transferMode, setTransferMode] = useState('WALLET');

  // P2P State
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');

  // Bank Transfer State
  const [selectedBank, setSelectedBank] = useState(POPULAR_BANKS[0]);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [isLookingUpBank, setIsLookingUpBank] = useState(false);

  // Common Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinRequiredModal, setShowPinRequiredModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState(null);

  // Quick preset amounts
  const presets = [50000, 100000, 200000, 500000, 1000000];

  useEffect(() => {
    generateIdempotencyKey();
    fetchMyWallet();
  }, []);

  // Auto-search user by identifier (P2P mode)
  useEffect(() => {
    if (transferMode !== 'WALLET') return;
    if (!recipient || recipient.trim().length < 3) {
      setRecipientName('');
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await userApi.searchUserByIdentifier(recipient.trim());
        const found = response?.result || response?.data;
        if (found && found.fullName) {
          setRecipientName(found.fullName);
        } else {
          setRecipientName('');
        }
      } catch (e) {
        setRecipientName('');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [recipient, transferMode]);

  // Auto-lookup bank account name (Bank mode)
  useEffect(() => {
    if (transferMode !== 'BANK') return;
    const cleanAcc = bankAccountNumber.trim();
    if (cleanAcc.length < 6) {
      setBankAccountName('');
      return;
    }

    setIsLookingUpBank(true);
    const timer = setTimeout(async () => {
      try {
        // Try VietQR Open Lookup if available
        const res = await fetch('https://api.vietqr.io/v2/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',
                    // 'x-client-id': 'de3c50d0-f193-428e-9dcd-b7b4a87c08b8',
                    // 'x-api-key': 'eb4e197c-8696-456a-9779-37e5adc20e6d'
           },
          body: JSON.stringify({
            bin: selectedBank.bin,
            accountNumber: cleanAcc,
          }),
        });
        const data = await res.json();
        if (data && data.code === '00' && data.data?.accountName) {
          setBankAccountName(data.data.accountName.toUpperCase());
        } else {
          // Graceful fallback for demo accounts
          fallbackAccountName(cleanAcc);
        }
      } catch (err) {
        fallbackAccountName(cleanAcc);
      } finally {
        setIsLookingUpBank(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [bankAccountNumber, selectedBank, transferMode]);

  // Fallback demo account name generator
  const fallbackAccountName = (acc) => {
    if (acc === user?.phoneNumber) {
      setBankAccountName(user.fullName ? user.fullName.toUpperCase() : 'NGUYEN VAN A');
    } else {
      const demoNames = ['NGUYEN VAN A', 'TRAN CONG BANG', 'LE THI MAI', 'HOANG MINH DUC', 'PHAM QUOC TOAN'];
      const hash = acc.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      setBankAccountName(demoNames[hash % demoNames.length]);
    }
  };

  const generateIdempotencyKey = () => {
    const uuid = 'idemp-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    setIdempotencyKey(uuid);
  };

  const handleSubmitInit = (e) => {
    e.preventDefault();
    setError('');

    if (transferMode === 'WALLET') {
      if (!recipient) {
        setError('Vui lòng nhập Email hoặc Số điện thoại người nhận!');
        return;
      }
    } else {
      if (!bankAccountNumber) {
        setError('Vui lòng nhập số tài khoản ngân hàng nhận tiền!');
        return;
      }
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Số tiền chuyển phải lớn hơn 0 VNĐ!');
      return;
    }

    if (num > (balance || 0)) {
      setError(`Số dư ví không đủ! Hiện có ${(balance || 0).toLocaleString('vi-VN')} VNĐ.`);
      return;
    }

    if (!user?.hasPin) {
      setShowPinRequiredModal(true);
      return;
    }

    setPinCode('');
    setShowPinModal(true);
  };

  const handleConfirmPinAndTransfer = async (e) => {
    e.preventDefault();
    setError('');

    const isValid = await verifyPin(pinCode);
    if (!isValid) {
      setError('Mã PIN 6 số không chính xác!');
      return;
    }

    try {
      setLoading(true);

      if (transferMode === 'WALLET') {
        // P2P Wallet Transfer via Transaction Service Saga
        const tx = await executeTransfer({
          recipientEmailOrPhone: recipient,
          amount,
          pin: pinCode,
          idempotencyKey,
          description: description || `Chuyển tiền cho ${recipientName || recipient}`,
        });

        setSuccessTx({
          type: 'WALLET',
          amount: parseFloat(amount),
          recipientTitle: recipientName ? `${recipientName} (${recipient})` : recipient,
          description: description || `Chuyển tiền ví cho ${recipientName || recipient}`,
          transactionCode: tx?.transactionCode || idempotencyKey.toUpperCase(),
          traceId: tx?.traceId || `trace-${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Bank Transfer (Napas 24/7) - executed as wallet deduction + Napas mock
        await walletApi.withdraw({
          amount: parseFloat(amount),
          pin: pinCode,
        });

        await fetchMyWallet();

        setSuccessTx({
          type: 'BANK',
          amount: parseFloat(amount),
          bankName: selectedBank.name,
          accountNumber: bankAccountNumber,
          accountName: bankAccountName || 'NGUYEN VAN A',
          description: description || `NAPAS247 ${user?.fullName || ''} chuyen tien`.trim(),
          transactionCode: `NAPAS${Date.now().toString().slice(-8)}`,
          traceId: `trace-${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
      }

      setShowPinModal(false);
    } catch (err) {
      setError(err.message || 'Giao dịch chuyển tiền thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="clean-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-500" />
            Chuyển Tiền
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Chuyển tiền nhanh 24/7 đến Ví điện tử hoặc Tài khoản Ngân Hàng.
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl clean-card-subtle">
        <button
          type="button"
          onClick={() => {
            setTransferMode('WALLET');
            setError('');
          }}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            transferMode === 'WALLET'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Đến Ví MiniWallet</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTransferMode('BANK');
            setError('');
          }}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            transferMode === 'BANK'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Đến Tài Khoản Ngân Hàng</span>
        </button>
      </div>

      {/* Success Receipt View */}
      {successTx ? (
        <div className="clean-card p-8 text-center space-y-5 animate-scale-up">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-emerald-600">Chuyển Tiền Thành Công!</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Đã chuyển thành công{' '}
              <strong className="text-emerald-500 font-mono text-sm">
                {successTx.amount.toLocaleString('vi-VN')} VNĐ
              </strong>
            </p>
          </div>

          <div className="clean-card-subtle p-5 text-xs font-mono text-left space-y-3 max-w-md mx-auto rounded-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700/20">
              <span className="text-[var(--text-secondary)]">Hình thức:</span>
              <span className="font-bold text-indigo-400">
                {successTx.type === 'WALLET' ? 'Ví MiniWallet (P2P)' : 'Chuyển Khoản Ngân Hàng (NAPAS 24/7)'}
              </span>
            </div>

            {successTx.type === 'WALLET' ? (
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Người nhận:</span>
                <span className="font-bold">{successTx.recipientTitle}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Ngân hàng:</span>
                  <span className="font-bold">{successTx.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Số tài khoản:</span>
                  <span className="font-bold">{successTx.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Tên thụ hưởng:</span>
                  <span className="font-bold text-emerald-500">{successTx.accountName}</span>
                </div>
              </>
            )}

            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Phí giao dịch:</span>
              <span className="text-emerald-500 font-bold">Miễn phí (0đ)</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Mã giao dịch:</span>
              <span className="font-bold truncate max-w-[200px]">{successTx.transactionCode}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Thời gian:</span>
              <span>{new Date(successTx.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <div className="flex gap-3 max-w-md mx-auto pt-2">
            <button
              onClick={() => {
                setSuccessTx(null);
                setAmount('');
                setRecipient('');
                setBankAccountNumber('');
                setBankAccountName('');
                setDescription('');
                generateIdempotencyKey();
              }}
              className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
            >
              Chuyển Tiếp
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              Về Trang Chủ Ví
            </button>
          </div>
        </div>
      ) : (
        /* Transfer Form */
        <div className="clean-card p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmitInit} className="space-y-5">

            {/* TAB 1: P2P Wallet Transfer Form Fields */}
            {transferMode === 'WALLET' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Email hoặc Số điện thoại người nhận:
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="VD: 0987654321 hoặc user@ewallet.com"
                    className="w-full clean-input px-3.5 py-2.5 text-sm"
                    required
                  />

                  {/* Recipient Lookup Result */}
                  {recipientName && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 font-semibold flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-emerald-500" />
                      <span>Người nhận: <strong>{recipientName}</strong></span>
                    </div>
                  )}
                </div>

                {/* Quick suggestions */}
                {Array.isArray(registeredUsers) && registeredUsers.length > 0 && (
                  <div>
                    <span className="text-[11px] text-[var(--text-secondary)] block mb-1">
                      Gợi ý người nhận có sẵn:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {registeredUsers
                        .filter((u) => u && u.id !== user?.id)
                        .map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setRecipient(u.email || u.phoneNumber)}
                            className="px-2.5 py-1 rounded-lg clean-card-subtle text-[11px] font-mono hover:border-indigo-500 transition"
                          >
                            👤 {u.fullName} ({u.role})
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: Bank Transfer (Napas 247) Fields */
              <div className="space-y-4">
                {/* Select Bank */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Ngân hàng thụ hưởng:</label>
                  <div className="relative">
                    <select
                      value={selectedBank.id}
                      onChange={(e) => {
                        const b = POPULAR_BANKS.find((item) => item.id === e.target.value);
                        if (b) setSelectedBank(b);
                      }}
                      className="w-full clean-input px-3.5 py-2.5 text-sm font-semibold appearance-none pr-8 cursor-pointer"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-white py-1">
                          {b.name} - {b.fullName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Số tài khoản ngân hàng:</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nhập số tài khoản (VD: 0941477178)"
                    className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider"
                    required
                  />

                  {/* Bank Lookup Result / Status */}
                  {isLookingUpBank && (
                    <div className="mt-2 text-xs text-indigo-400 flex items-center gap-1.5 font-medium animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tra cứu tên chủ tài khoản qua NAPAS 24/7...</span>
                    </div>
                  )}

                  {!isLookingUpBank && bankAccountName && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 font-semibold flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-emerald-500" />
                      <span>Chủ tài khoản: <strong className="text-sm font-mono">{bankAccountName}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold">Số tiền chuyển (VNĐ):</label>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Khả dụng:{' '}
                  <strong className="text-emerald-600 font-mono">
                    {(balance || 0).toLocaleString('vi-VN')} VNĐ
                  </strong>
                </div>
              </div>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 100000"
                min="1000"
                step="1000"
                className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold"
                required
              />

              {/* Quick Amount Presets & All Button */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition ${
                      amount === val.toString()
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                        : 'clean-card-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {(val / 1000).toLocaleString()}k
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(Math.floor(balance || 0).toString())}
                  className="py-1.5 text-xs font-mono font-semibold rounded-lg border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition"
                  title="Chuyển toàn bộ số dư"
                >
                  Tất cả
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Lời nhắn chuyển tiền (Tùy chọn):</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  transferMode === 'WALLET'
                    ? 'VD: Chuyển tiền ăn trưa'
                    : `NAPAS ${user?.fullName || ''} chuyen tien`.trim()
                }
                className="w-full clean-input px-3.5 py-2.5 text-sm"
              />
            </div>

            {/* Transaction Fee Note */}
            <div className="p-3 rounded-xl clean-card-subtle flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Phí giao dịch:</span>
              <span className="text-emerald-500 font-bold">Miễn Phí (0 VNĐ)</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <span>Tiếp Tục & Xác Nhận PIN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Confirmation & PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="clean-card p-6 sm:p-7 max-w-sm w-full relative shadow-2xl space-y-4 animate-scale-up">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-800/20 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Xác Nhận PIN Chuyển Tiền</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {transferMode === 'WALLET'
                  ? `Chuyển ${parseFloat(amount || 0).toLocaleString('vi-VN')} VNĐ cho ${recipientName || recipient}`
                  : `Chuyển ${parseFloat(amount || 0).toLocaleString('vi-VN')} VNĐ tới ${selectedBank.name} - ${bankAccountName || bankAccountNumber}`}
              </p>
            </div>

            {/* Summary Details */}
            <div className="clean-card-subtle p-3 rounded-xl text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Số tiền:</span>
                <span className="font-bold text-indigo-400">
                  {parseFloat(amount || 0).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Phí:</span>
                <span className="text-emerald-500 font-bold">0đ</span>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs text-center">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleConfirmPinAndTransfer} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="••••••"
                className="w-full clean-input px-3 py-3 text-center text-2xl font-mono tracking-widest"
                required
                autoFocus
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Xác Nhận</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Prompt to Setup PIN if user has not created PIN yet */}
      <PinRequiredModal
        isOpen={showPinRequiredModal}
        onClose={() => setShowPinRequiredModal(false)}
      />

    </div>
  );
}
