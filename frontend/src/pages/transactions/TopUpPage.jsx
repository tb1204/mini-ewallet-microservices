import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { walletApi } from '../../api/walletApi';
import LinkBankModal from '../../components/modals/LinkBankModal';
import { ArrowDownLeft, Building2, QrCode, CheckCircle2, Copy, Check, X, ArrowRight, Loader2, CreditCard, Star, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const bankStyleMap = {
  TCB: { color: 'border-red-500/30 text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  VCB: { color: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  MBB: { color: 'border-blue-500/30 text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  CTG: { color: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
  BIDV: { color: 'border-teal-500/30 text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
  VPB: { color: 'border-green-500/30 text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  ACB: { color: 'border-sky-500/30 text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' },
  TPB: { color: 'border-purple-500/30 text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  DEFAULT: { color: 'border-purple-500/30 text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
};

export default function TopUpPage() {
  const { user } = useAuthStore();
  const { executeTopUp, fetchMyWallet } = useWalletStore();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('LINKED_BANK'); // 'LINKED_BANK' or 'VIETQR'
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Linked bank accounts
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [showManageBankModal, setShowManageBankModal] = useState(false);

  // VietQR Modal state
  const [showVietQrModal, setShowVietQrModal] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState(null);

  // Quick preset amounts
  const presets = [100000, 200000, 500000, 1000000, 2000000, 5000000];

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
      const safeList = Array.isArray(list) ? list : [];
      setLinkedBanks(safeList);

      if (safeList.length > 0) {
        const defaultBank = safeList.find((b) => b.isDefault === 1 || b.isDefault === true || b.default === 1 || b.default === true) || safeList[0];
        setSelectedBankId(defaultBank.id);
        setPaymentMethod('LINKED_BANK');
      } else {
        setSelectedBankId(null);
        setPaymentMethod('VIETQR');
      }
    } catch (err) {
      console.warn('Failed to fetch linked banks:', err);
    } finally {
      setLoadingBanks(false);
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

  const handleCopyText = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const selectedBank = linkedBanks.find((b) => b.id === selectedBankId);

  // Bank transfer info for VietQR
  const bankInfo = {
    bankId: 'MB',
    bankName: 'MBBank (Ngân hàng Quân Đội)',
    accountNumber: '0941477178',
    accountName: 'MINI WALLET',
    transferContent: `NAP ${user?.phoneNumber || user?.username || 'VI'}`,
  };

  const numAmount = parseFloat(amount) || 0;
  const vietQrUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-compact2.png?amount=${numAmount}&addInfo=${encodeURIComponent(bankInfo.transferContent)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (numAmount <= 0) {
      setError('Số tiền nạp phải lớn hơn 0 VNĐ!');
      return;
    }

    if (numAmount < 10000) {
      setError('Số tiền nạp tối thiểu là 10.000 VNĐ!');
      return;
    }

    if (paymentMethod === 'LINKED_BANK') {
      if (!selectedBank) {
        setError('Vui lòng chọn một tài khoản ngân hàng liên kết để trích tiền nạp!');
        return;
      }
      performTopUp();
    } else if (paymentMethod === 'VIETQR') {
      setShowVietQrModal(true);
    }
  };

  // Perform top-up call
  const performTopUp = async () => {
    setError('');
    setLoading(true);
    try {
      const bankDesc = selectedBank
        ? `Nạp tiền từ ${selectedBank.bankName} (${selectedBank.accountNumber})`
        : 'Nạp tiền qua VietQR';

      await executeTopUp({
        amount: numAmount,
        paymentMethod: selectedBank ? selectedBank.bankName : 'VietQR',
        idempotencyKey,
        description: bankDesc,
      });

      setSuccessTx({
        amount: numAmount,
        paymentMethod: selectedBank
          ? `${selectedBank.bankName} (${selectedBank.accountNumber})`
          : 'Quét Mã VietQR',
        bankName: selectedBank?.bankName,
        accountNumber: selectedBank?.accountNumber,
        transactionCode: idempotencyKey.toUpperCase(),
        createdAt: new Date().toISOString(),
      });

      setShowVietQrModal(false);
    } catch (err) {
      setError(err.message || 'Giao dịch nạp tiền thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="clean-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
            Nạp Tiền Vào Ví
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Nạp tiền trực tiếp từ tài khoản ngân hàng liên kết hoặc qua mã VietQR.
          </p>
        </div>
      </div>

      {/* Success View */}
      {successTx ? (
        <div className="clean-card p-8 text-center space-y-5 animate-scale-up">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-emerald-600">Nạp Tiền Thành Công!</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Đã cộng +{successTx.amount.toLocaleString('vi-VN')} VNĐ vào số dư ví của bạn.
            </p>
          </div>

          <div className="clean-card-subtle p-5 text-xs text-left space-y-2.5 max-w-md mx-auto rounded-xl">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Nguồn tiền nạp:</span>
              <span className="font-bold flex items-center gap-1.5 text-emerald-600">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                {successTx.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Số tiền nạp:</span>
              <span className="font-mono font-bold text-emerald-600 text-sm">
                +{successTx.amount.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Mã giao dịch:</span>
              <span className="font-mono font-bold truncate max-w-[200px]">{successTx.transactionCode}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-[var(--text-secondary)]">Thời gian:</span>
              <span>{new Date(successTx.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <div className="flex gap-3 max-w-md mx-auto pt-2">
            <button
              onClick={() => {
                setSuccessTx(null);
                setAmount('');
                generateIdempotencyKey();
              }}
              className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl hover:bg-[var(--card-hover)] transition cursor-pointer"
            >
              Nạp Tiền Tiếp
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Về Trang Chủ Ví
            </button>
          </div>
        </div>
      ) : (
        /* TopUp Form */
        <div className="clean-card p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Chọn Nguồn Tiền Nạp (Tài khoản ngân hàng liên kết) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Nguồn tiền nạp vào ví:
                </label>

                <button
                  type="button"
                  onClick={() => setShowManageBankModal(true)}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Quản lý ngân hàng</span>
                </button>
              </div>

              {/* Tab Selector: Ngân hàng liên kết vs VietQR */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('LINKED_BANK')}
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                    paymentMethod === 'LINKED_BANK'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 font-bold shadow-sm ring-1 ring-emerald-500/30'
                      : 'clean-card-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  <span>Tài Khoản Đã Liên Kết</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('VIETQR')}
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                    paymentMethod === 'VIETQR'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 font-bold shadow-sm ring-1 ring-emerald-500/30'
                      : 'clean-card-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-500" />
                  <span>Quét Mã VietQR</span>
                </button>
              </div>

              {/* Hiển thị chi tiết theo phương thức */}
              {paymentMethod === 'LINKED_BANK' && (
                <div className="space-y-2 pt-1">
                  {loadingBanks ? (
                    <div className="py-6 text-center text-text-secondary space-y-2">
                      <Loader2 className="w-5 h-5 mx-auto animate-spin text-emerald-500" />
                      <p className="text-xs">Đang tải danh sách tài khoản liên kết...</p>
                    </div>
                  ) : linkedBanks.length === 0 ? (
                    /* Chưa liên kết ngân hàng */
                    <div className="p-4 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-subtle)] text-center space-y-3">
                      <p className="text-xs text-text-secondary">
                        Bạn chưa liên kết tài khoản ngân hàng nào.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowManageBankModal(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Liên kết tài khoản ngân hàng ngay</span>
                      </button>
                    </div>
                  ) : (
                    /* Danh sách ngân hàng liên kết để chọn nạp tiền */
                    <div className="space-y-2">
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        Chọn tài khoản ngân hàng để trích tiền nạp vào ví:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {linkedBanks.map((bank) => {
                          const isSelected = bank.id === selectedBankId;
                          const style = bankStyleMap[bank.bankCode] || bankStyleMap.DEFAULT;

                          return (
                            <div
                              key={bank.id}
                              onClick={() => setSelectedBankId(bank.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition relative flex items-center justify-between ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/20'
                                  : 'clean-card-subtle border-[var(--border-subtle)] hover:border-emerald-400'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg ${style.bg} ${style.color} flex items-center justify-center font-bold text-xs shrink-0 border`}>
                                  {bank.bankCode}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs">{bank.bankName}</span>
                                    {(bank.isDefault === 1 || bank.isDefault === true || bank.default === 1 || bank.default === true) && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-bold flex items-center gap-0.5">
                                        <Star className="w-2.5 h-2.5 fill-current" /> Mặc định
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono text-xs text-text-primary tracking-wider mt-0.5">
                                    {bank.accountNumber}
                                  </div>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Amount Presets */}
            <div>
              <label className="block text-xs font-semibold mb-2">Chọn nhanh số tiền (VNĐ):</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border transition cursor-pointer ${
                      amount === val.toString()
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-bold'
                        : 'clean-card-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {(val / 1000).toLocaleString()}k
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Custom Amount Input */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Số tiền nạp tùy chỉnh (VNĐ):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 500000"
                min="10000"
                step="1000"
                className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (paymentMethod === 'LINKED_BANK' && !selectedBank)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý nạp tiền...</span>
                </>
              ) : (
                <span>
                  {paymentMethod === 'LINKED_BANK' && selectedBank
                    ? `Nạp Tiền Từ ${selectedBank.bankName}`
                    : 'Xác Nhận Nạp Tiền'}
                </span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Manage Linked Banks Modal */}
      <LinkBankModal
        isOpen={showManageBankModal}
        onClose={() => setShowManageBankModal(false)}
        onSuccess={() => {
          fetchLinkedBanks();
        }}
      />

      {/* VietQR Scanning Modal */}
      {showVietQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="clean-card p-6 sm:p-7 max-w-md w-full relative shadow-2xl space-y-4 animate-scale-up">
            
            {/* Close button */}
            <button
              onClick={() => setShowVietQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-800/20 transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                Quét Mã VietQR Nạp Tiền
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Mở app ngân hàng bất kỳ để quét mã và chuyển tiền tự động
              </p>
            </div>

            {/* VietQR Image Container */}
            <div className="bg-white p-3 rounded-2xl flex items-center justify-center shadow-inner mx-auto max-w-[240px]">
              <img
                src={vietQrUrl}
                alt="VietQR Nạp Tiền"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>

            {/* Payment Details */}
            <div className="clean-card-subtle p-3 rounded-xl text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Ngân hàng:</span>
                <span className="font-semibold">{bankInfo.bankName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Số tài khoản:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-600">
                  <span>{bankInfo.accountNumber}</span>
                  <button
                    onClick={() => handleCopyText(bankInfo.accountNumber, 'acc')}
                    className="p-1 hover:bg-slate-800/20 rounded cursor-pointer"
                    title="Copy số tài khoản"
                  >
                    {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Số tiền:</span>
                <span className="font-bold font-mono text-emerald-600 text-sm">
                  {numAmount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Nội dung CK:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-amber-500">
                  <span>{bankInfo.transferContent}</span>
                  <button
                    onClick={() => handleCopyText(bankInfo.transferContent, 'content')}
                    className="p-1 hover:bg-slate-800/20 rounded cursor-pointer"
                    title="Copy nội dung"
                  >
                    {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowVietQrModal(false)}
                className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={performTopUp}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác nhận...</span>
                  </>
                ) : (
                  <>
                    <span>Tôi Đã Chuyển Tiền</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
