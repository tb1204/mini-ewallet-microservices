import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { walletApi } from '../../api/walletApi';
import { 
  ArrowUpRight, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Check, 
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Loader2,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PinRequiredModal from '../../components/modals/PinRequiredModal';
import LinkBankModal from '../../components/modals/LinkBankModal';

// Map color/bg for known bank codes
const bankStyleMap = {
  TCB: { color: 'border-red-500/30 text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  VCB: { color: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  MBB: { color: 'border-blue-500/30 text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  CTG: { color: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
  BIDV: { color: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  DEFAULT: { color: 'border-purple-500/30 text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' }
};

const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

export default function WithdrawPage() {
  const { user, verifyPin } = useAuthStore();
  const { balance, executeWithdraw, fetchMyWallet } = useWalletStore();
  const navigate = useNavigate();

  // Linked bank accounts fetched from DB (wallet_db -> linked_bank_accounts)
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [selectedBankId, setSelectedBankId] = useState(null);

  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Modals
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinRequiredModal, setShowPinRequiredModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState(null);

  const fee = 0; // Miễn phí rút tiền về ngân hàng liên kết
  const ownerName = user?.fullName ? user.fullName.toUpperCase() : 'TRAN CONG BANG';

  useEffect(() => {
    generateIdempotencyKey();
    fetchMyWallet();
    fetchLinkedBanks();
  }, [user]);

  const fetchLinkedBanks = async () => {
    try {
      setLoadingBanks(true);
      const res = await walletApi.getLinkedBanks();
      const list = res?.result || res?.data || [];
      if (Array.isArray(list)) {
        setLinkedBanks(list);
        if (list.length > 0) {
          const defaultBank = list.find((b) => b.isDefault) || list[0];
          setSelectedBankId(defaultBank.id);
        } else {
          setSelectedBankId(null);
        }
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách ngân hàng liên kết từ DB:', err);
    } finally {
      setLoadingBanks(false);
    }
  };

  const selectedBank = linkedBanks.find((b) => b.id === selectedBankId) || linkedBanks[0];

  const generateIdempotencyKey = () => {
    const uuid = 'idemp-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    setIdempotencyKey(uuid);
  };

  const handleQuickAmount = (val) => {
    setAmount(String(val));
    setError('');
  };

  const handleWithdrawAll = () => {
    if (balance <= 0) {
      setError('Số dư ví của bạn hiện tại là 0 VNĐ!');
      return;
    }
    const maxWithdraw = Math.floor(balance - fee);
    if (maxWithdraw < 10000) {
      setError('Số dư còn lại không đủ số tiền rút tối thiểu (10.000 VNĐ)!');
      return;
    }
    setAmount(String(maxWithdraw));
    setError('');
  };

  const handleSubmitInit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedBank) {
      setError('Vui lòng liên kết và chọn một tài khoản ngân hàng để rút tiền!');
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ!');
      return;
    }

    if (num < 10000) {
      setError('Số tiền rút tối thiểu là 10.000 VNĐ!');
      return;
    }

    const totalDeduction = num + fee;
    if (totalDeduction > balance) {
      setError(`Số dư không đủ! Cần có ít nhất ${totalDeduction.toLocaleString('vi-VN')} VNĐ trong ví.`);
      return;
    }

    // Check if user has configured PIN
    if (!user?.hasPin) {
      setShowPinRequiredModal(true);
      return;
    }

    setShowPinModal(true);
  };

  const handleConfirmPinAndWithdraw = async (e) => {
    e.preventDefault();
    setError('');

    if (pinCode.length !== 6) {
      setError('Mã PIN phải bao gồm 6 chữ số!');
      return;
    }

    const isValid = await verifyPin(pinCode);
    if (!isValid) {
      setError('Mã PIN 6 số không chính xác!');
      return;
    }

    try {
      setLoading(true);
      await executeWithdraw({
        bankName: selectedBank.bankName,
        accountNumber: selectedBank.accountNumber,
        accountName: ownerName,
        amount,
        pin: pinCode,
        idempotencyKey
      });

      // Receipt data
      setSuccessTx({
        amount: parseFloat(amount),
        bankName: selectedBank.bankName,
        accountNumber: selectedBank.accountNumber,
        accountName: ownerName,
        transactionCode: 'WD' + Math.floor(100000000 + Math.random() * 900000000),
        traceId: idempotencyKey,
        time: new Date().toLocaleString('vi-VN'),
        fee: fee
      });

      setShowPinModal(false);
      setPinCode('');
    } catch (err) {
      setError(err.message || 'Giao dịch rút tiền thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkBankSuccess = (newAccount) => {
    fetchLinkedBanks();
    if (newAccount?.id) {
      setSelectedBankId(newAccount.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div className="clean-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Rút Tiền Về Ngân Hàng</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Rút tiền nhanh 24/7 về tài khoản ngân hàng chính chủ đã liên kết.
            </p>
          </div>
        </div>
      </div>

      {/* Success View */}
      {successTx ? (
        <div className="clean-card p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Rút Tiền Thành Công!</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Đã chuyển tiền về tài khoản ngân hàng liên kết qua cổng Napas 24/7.
            </p>
          </div>

          <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            -{successTx.amount.toLocaleString('vi-VN')} VNĐ
          </div>

          <div className="clean-card-subtle p-5 text-xs text-left space-y-2.5 max-w-md mx-auto rounded-xl">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Ngân hàng nhận:</span>
              <span className="font-bold flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-500" />
                {successTx.bankName}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Số tài khoản:</span>
              <span className="font-mono font-bold tracking-wider">{successTx.accountNumber}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Chủ tài khoản:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{successTx.accountName}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Mã giao dịch:</span>
              <span className="font-mono font-bold">{successTx.transactionCode}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Thời gian:</span>
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {successTx.time}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-[var(--text-secondary)]">Phí giao dịch:</span>
              <span className="text-emerald-600 font-semibold">Miễn phí (0 VNĐ)</span>
            </div>
          </div>

          <div className="flex gap-3 max-w-md mx-auto pt-2">
            <button
              onClick={() => {
                setSuccessTx(null);
                setAmount('');
                generateIdempotencyKey();
              }}
              className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl hover:bg-[var(--card-hover)] transition"
            >
              Rút Tiếp
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-purple-600/20"
            >
              Về Trang Chủ Ví
            </button>
          </div>
        </div>
      ) : (
        /* Main Withdraw Form */
        <div className="clean-card p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* 1. Danh sách Ngân Hàng Đã Liên Kết */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold tracking-wide uppercase text-[var(--text-secondary)] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-500" />
                Chọn tài khoản ngân hàng nhận tiền:
              </label>

              {linkedBanks.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Chính chủ
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(true)}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm ngân hàng</span>
                  </button>
                </div>
              )}
            </div>

            {loadingBanks ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-subtle)] animate-pulse space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[var(--border-subtle)]"></div>
                      <div className="h-4 bg-[var(--border-subtle)] rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-[var(--border-subtle)] rounded w-32"></div>
                    <div className="flex justify-between items-center pt-1">
                      <div className="h-3 bg-[var(--border-subtle)] rounded w-20"></div>
                      <div className="h-3 bg-[var(--border-subtle)] rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : linkedBanks.length === 0 ? (
              /* EMPTY STATE: Chưa có ngân hàng nào */
              <div className="p-8 clean-card-subtle text-center space-y-4 rounded-2xl border-2 border-dashed border-[var(--border-subtle)]">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Bạn chưa liên kết tài khoản ngân hàng nào</h4>
                  <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1">
                    Theo quy định, bạn cần liên kết tài khoản ngân hàng chính chủ để thực hiện rút tiền từ ví MiniWallet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-purple-600/20 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Liên Kết Tài Khoản Ngân Hàng Ngay</span>
                </button>
              </div>
            ) : (
              /* Có ngân hàng liên kết */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {linkedBanks.map((bank) => {
                  const isSelected = bank.id === selectedBankId;
                  const style = bankStyleMap[bank.bankCode] || bankStyleMap.DEFAULT;
                  return (
                    <div
                      key={bank.id}
                      onClick={() => setSelectedBankId(bank.id)}
                      className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-500/10 shadow-md ring-2 ring-purple-500/30'
                          : 'border-[var(--border-subtle)] hover:border-purple-400 bg-[var(--card-subtle)]'
                      }`}
                    >
                      {/* Check badge */}
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-lg ${style.bg} ${style.color} flex items-center justify-center font-bold text-xs`}>
                          {bank.bankCode}
                        </div>
                        <span className="text-xs font-bold truncate pr-4">{bank.bankName}</span>
                      </div>

                      <div className="text-xs font-mono font-semibold tracking-wider text-[var(--text-primary)]">
                        {bank.accountNumber}
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                        <span className="truncate uppercase font-medium">{bank.accountHolderName || ownerName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--card-bg)] border border-[var(--border-subtle)]">
                          {bank.isDefault ? 'Mặc định' : 'Chính chủ'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form nhập tiền và rút (chỉ hiện khi đã có ít nhất 1 ngân hàng liên kết) */}
          {linkedBanks.length > 0 && (
            <form onSubmit={handleSubmitInit} className="space-y-6 pt-2">
              
              {/* 2. Số Tiền Rút */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold tracking-wide uppercase text-[var(--text-secondary)]">
                    Số tiền muốn rút (VNĐ):
                  </label>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Khả dụng: <strong className="text-emerald-600 font-bold">{balance.toLocaleString('vi-VN')} VNĐ</strong>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    placeholder="Tối thiểu 10.000 VNĐ"
                    className="w-full clean-input px-4 py-3 text-base font-mono font-bold"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-secondary)]">
                    VNĐ
                  </span>
                </div>

                {/* Quick Amount Chips */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2.5">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className="py-1.5 px-2 clean-card-subtle hover:border-purple-500 text-xs font-medium rounded-lg transition text-center"
                    >
                      {val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleWithdrawAll}
                    className="py-1.5 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold rounded-lg transition text-center"
                  >
                    Rút tất cả
                  </button>
                </div>
              </div>

              {/* 3. Tóm Tắt Chi Phí Giao Dịch */}
              <div className="clean-card-subtle p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-[var(--text-secondary)]">
                  <span>Số tiền rút:</span>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {amount && !isNaN(parseFloat(amount)) ? parseFloat(amount).toLocaleString('vi-VN') : 0} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center text-[var(--text-secondary)]">
                  <span>Phí dịch vụ:</span>
                  <span className="font-semibold text-emerald-600">Miễn phí (0 VNĐ)</span>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-between items-center text-sm font-bold">
                  <span>Tổng tiền trừ khỏi ví:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono">
                    {amount && !isNaN(parseFloat(amount)) ? parseFloat(amount).toLocaleString('vi-VN') : 0} VNĐ
                  </span>
                </div>
              </div>

              {/* 4. Action Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
              >
                <span>Tiếp Tục & Xác Nhận PIN</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Bảo mật note */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Giao dịch bảo mật 2 lớp qua mã PIN cá nhân & Napas 24/7</span>
              </div>

            </form>
          )}

        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-sm">
          <div className="clean-card p-6 sm:p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" />
              Xác Nhận Rút Tiền
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Nhập mã PIN 6 số để rút <strong className="text-purple-600">{parseFloat(amount).toLocaleString('vi-VN')} VNĐ</strong> về tài khoản <strong>{selectedBank?.bankName} ({selectedBank?.accountNumber})</strong>
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleConfirmPinAndWithdraw} className="space-y-4">
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
                  onClick={() => {
                    setShowPinModal(false);
                    setPinCode('');
                    setError('');
                  }}
                  className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || pinCode.length !== 6}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Xác Nhận Rút'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Prompt to Setup PIN */}
      <PinRequiredModal
        isOpen={showPinRequiredModal}
        onClose={() => setShowPinRequiredModal(false)}
      />

      {/* Modal Link Bank Account */}
      <LinkBankModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSuccess={handleLinkBankSuccess}
      />

    </div>
  );
}
