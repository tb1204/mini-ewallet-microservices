import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { ArrowDownLeft, CreditCard, Building2, QrCode, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopUpPage() {
  const { user, verifyPin } = useAuthStore();
  const { executeTopUp, fetchMyWallet } = useWalletStore();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [description, setDescription] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState(null);

  // Generate unique idempotency key on mount
  useEffect(() => {
    generateIdempotencyKey();
    fetchMyWallet();
  }, []);

  const generateIdempotencyKey = () => {
    const uuid = 'idemp-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    setIdempotencyKey(uuid);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(idempotencyKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const presets = [100000, 200000, 500000, 1000000, 2000000, 5000000];

  const handleSubmitInit = (e) => {
    e.preventDefault();
    setError('');

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Số tiền nạp phải lớn hơn 0 VNĐ!');
      return;
    }

    if (!user?.hasPin) {
      setError('Bạn cần cài đặt Mã PIN 6 số trước khi thực hiện giao dịch!');
      return;
    }

    setShowPinModal(true);
  };

  const handleConfirmPinAndTopUp = async (e) => {
    e.preventDefault();
    setError('');

    const isValid = await verifyPin(pinCode);
    if (!isValid) {
      setError('Mã PIN 6 số không chính xác!');
      return;
    }

    try {
      setLoading(true);
      const tx = await executeTopUp({
        amount,
        paymentMethod,
        idempotencyKey,
        description
      });

      setSuccessTx(tx);
      setShowPinModal(false);
    } catch (err) {
      setError(err.message || 'Giao dịch thất bại!');
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
            Nạp Tiền Vào Ví (`transaction_db`)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Nạp tiền trực tiếp vào tài khoản ví chính sử dụng mã Idempotency Key chống trùng lặp.
          </p>
        </div>
      </div>

      {/* Success View */}
      {successTx ? (
        <div className="clean-card p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-emerald-600">Nạp Tiền Thành Công!</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Đã cộng +{parseFloat(successTx.amount).toLocaleString('vi-VN')} VNĐ vào Ví chính.
          </p>

          <div className="clean-card-subtle p-4 text-xs font-mono text-left space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Mã giao dịch:</span>
              <span className="font-bold">{successTx.transactionCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Trace ID:</span>
              <span className="text-slate-500">{successTx.traceId}</span>
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
                generateIdempotencyKey();
              }}
              className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
            >
              Nạp Tiền Tiếp
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
            >
              Về Trang Chủ Ví
            </button>
          </div>
        </div>
      ) : (
        /* TopUp Form */
        <div className="clean-card p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmitInit} className="space-y-5">
            
            {/* Amount Presets */}
            <div>
              <label className="block text-xs font-semibold mb-2">Chọn nhanh số tiền (VNĐ):</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border transition ${
                      amount === val.toString()
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600'
                        : 'clean-card-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {(val / 1000).toLocaleString()}k
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Số tiền nạp tùy chỉnh (VNĐ):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 500000"
                className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold"
                required
              />
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-xs font-semibold mb-2">Phương thức thanh toán:</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600'
                      : 'clean-card-subtle text-[var(--text-secondary)]'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  Chuyển Khoản Ngân Hàng
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('VIETQR')}
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'VIETQR'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600'
                      : 'clean-card-subtle text-[var(--text-secondary)]'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  Quét Mã VietQR
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600'
                      : 'clean-card-subtle text-[var(--text-secondary)]'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Thẻ Thẻ Quốc Tế
                </button>
              </div>
            </div>

            {/* Idempotency Key info */}
            <div className="clean-card-subtle p-3.5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-center text-[var(--text-secondary)]">
                <span>Idempotency Key (Tự động sinh chống nạp trùng):</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-emerald-600 hover:underline flex items-center gap-1"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey ? 'Đã copy' : 'Copy Key'}
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-500 truncate">{idempotencyKey}</div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition"
            >
              Tiếp Theo & Xác Nhận PIN
            </button>
          </form>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-sm">
          <div className="clean-card p-6 sm:p-8 max-w-md w-full relative shadow-2xl">
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Xác Nhận PIN 6 Số
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5">
              Nhập mã PIN để hoàn tất giao dịch nạp {parseFloat(amount).toLocaleString('vi-VN')} VNĐ
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleConfirmPinAndTopUp} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="••••••"
                className="w-full clean-input px-3 py-3 text-center text-xl font-mono tracking-widest"
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
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Đang nạp...' : 'Xác Nhận Nạp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
