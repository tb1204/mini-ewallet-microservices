import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { ArrowDownLeft, Building2, QrCode, CheckCircle2, Copy, Check, X, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopUpPage() {
  const { user } = useAuthStore();
  const { executeTopUp, fetchMyWallet } = useWalletStore();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('VIETQR');
  const [idempotencyKey, setIdempotencyKey] = useState('');

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
  }, []);

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

    if (paymentMethod === 'VIETQR') {
      // Show VietQR scanning modal
      setShowVietQrModal(true);
    } else {
      // Direct Bank Transfer simulation
      performTopUp();
    }
  };

  // Perform top-up call
  const performTopUp = async () => {
    setError('');
    setLoading(true);
    try {
      await executeTopUp({
        amount: numAmount,
        paymentMethod,
        idempotencyKey,
        description: `Nạp tiền qua ${paymentMethod === 'VIETQR' ? 'VietQR' : 'Chuyển khoản ngân hàng'}`,
      });

      setSuccessTx({
        amount: numAmount,
        paymentMethod: paymentMethod === 'VIETQR' ? 'Quét Mã VietQR' : 'Chuyển Khoản Ngân Hàng',
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
            Nạp tiền vào tài khoản ví nhanh chóng và an toàn.
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

          <div className="clean-card-subtle p-4 text-xs font-mono text-left space-y-2.5 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Phương thức:</span>
              <span className="font-semibold text-emerald-600">{successTx.paymentMethod}</span>
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
                generateIdempotencyKey();
              }}
              className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
            >
              Nạp Tiền Tiếp
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20"
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

          <form onSubmit={handleSubmit} className="space-y-5">
            
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
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-bold'
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
                min="10000"
                step="1000"
                className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold"
                required
              />
            </div>

            {/* Payment Method Selection: VietQR & Bank Transfer */}
            <div>
              <label className="block text-xs font-semibold mb-2">Phương thức thanh toán:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('VIETQR')}
                  className={`p-4 rounded-xl border text-xs font-medium flex flex-col items-center gap-2 transition ${
                    paymentMethod === 'VIETQR'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-bold shadow-sm'
                      : 'clean-card-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <QrCode className="w-6 h-6 text-emerald-500" />
                  <span>Quét Mã VietQR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-4 rounded-xl border text-xs font-medium flex flex-col items-center gap-2 transition ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-bold shadow-sm'
                      : 'clean-card-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Building2 className="w-6 h-6 text-indigo-500" />
                  <span>Chuyển Khoản Ngân Hàng</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý nạp tiền...</span>
                </>
              ) : (
                <span>Xác Nhận Nạp Tiền</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* VietQR Scanning Modal */}
      {showVietQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="clean-card p-6 sm:p-7 max-w-md w-full relative shadow-2xl space-y-4 animate-scale-up">
            
            {/* Close button */}
            <button
              onClick={() => setShowVietQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-800/20 transition"
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
                    className="p-1 hover:bg-slate-800/20 rounded"
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
                    className="p-1 hover:bg-slate-800/20 rounded"
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
                className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={performTopUp}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
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
