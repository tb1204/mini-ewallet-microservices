import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { ArrowUpRight, Building, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const banks = [
  { id: 'VCB', name: 'Vietcombank' },
  { id: 'TCB', name: 'Techcombank' },
  { id: 'MB', name: 'MBBank' },
  { id: 'CTG', name: 'VietinBank' },
  { id: 'BIDV', name: 'BIDV' },
  { id: 'VPB', name: 'VPBank' },
  { id: 'ACB', name: 'ACB' }
];

export default function WithdrawPage() {
  const { user, verifyPin } = useAuthStore();
  const { balance, executeWithdraw } = useWalletStore();
  const navigate = useNavigate();

  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState(null);

  const fee = 5000;

  useEffect(() => {
    generateIdempotencyKey();
    if (user?.fullName) {
      setAccountName(user.fullName.toUpperCase());
    }
  }, [user]);

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

  const handleSubmitInit = (e) => {
    e.preventDefault();
    setError('');

    if (!accountNumber || !accountName) {
      setError('Vui lòng nhập đầy đủ số tài khoản và tên chủ tài khoản!');
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Số tiền rút phải lớn hơn 0 VNĐ!');
      return;
    }

    const totalDeduction = num + fee;
    if (totalDeduction > balance) {
      setError(`Số dư không đủ! Cần có ${totalDeduction.toLocaleString('vi-VN')} VNĐ (bao gồm phí 5.000 VNĐ).`);
      return;
    }

    if (!user?.hasPin) {
      setError('Bạn cần cài đặt Mã PIN 6 số trước khi thực hiện giao dịch!');
      return;
    }

    setShowPinModal(true);
  };

  const handleConfirmPinAndWithdraw = async (e) => {
    e.preventDefault();
    setError('');

    const isValid = await verifyPin(pinCode);
    if (!isValid) {
      setError('Mã PIN 6 số không chính xác!');
      return;
    }

    try {
      setLoading(true);
      const tx = await executeWithdraw({
        bankName,
        accountNumber,
        accountName,
        amount,
        idempotencyKey
      });

      setSuccessTx(tx);
      setShowPinModal(false);
    } catch (err) {
      setError(err.message || 'Giao dịch rút tiền thất bại!');
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
            <ArrowUpRight className="w-5 h-5 text-purple-500" />
            Rút Tiền Về Ngân Hàng (`transaction_db`)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Rút tiền từ ví về tài khoản ngân hàng liên kết, tính phí cố định 5.000 VNĐ.
          </p>
        </div>
      </div>

      {/* Success View */}
      {successTx ? (
        <div className="clean-card p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mx-auto border border-purple-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-purple-600">Lệnh Rút Tiền Thành Công!</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Đã chuyển {parseFloat(successTx.amount).toLocaleString('vi-VN')} VNĐ về {bankName}.
          </p>

          <div className="clean-card-subtle p-4 text-xs font-mono text-left space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Mã giao dịch:</span>
              <span className="font-bold">{successTx.transactionCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Phí giao dịch:</span>
              <span>{fee.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Trace ID:</span>
              <span className="text-slate-500">{successTx.traceId}</span>
            </div>
          </div>

          <div className="flex gap-3 max-w-md mx-auto pt-2">
            <button
              onClick={() => {
                setSuccessTx(null);
                setAmount('');
                setAccountNumber('');
                generateIdempotencyKey();
              }}
              className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
            >
              Rút Tiếp
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
            >
              Về Trang Chủ Ví
            </button>
          </div>
        </div>
      ) : (
        /* Withdraw Form */
        <div className="clean-card p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmitInit} className="space-y-4">
            
            {/* Bank Selector */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Ngân hàng thụ hưởng:</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full clean-input px-3.5 py-2.5 text-sm"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Số tài khoản ngân hàng:</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="VD: 10123456789"
                className="w-full clean-input px-3.5 py-2.5 text-sm font-mono"
                required
              />
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Tên chủ tài khoản (Viết hoa không dấu):</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                placeholder="VD: NGUYEN VAN A"
                className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold uppercase"
                required
              />
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold">Số tiền rút (VNĐ):</label>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Số dư: <strong className="text-emerald-600">{balance.toLocaleString('vi-VN')} VNĐ</strong>
                </span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 500000"
                className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold"
                required
              />
              <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                Phí rút tiền cố định: <span className="font-semibold text-purple-500">5.000 VNĐ</span>
              </div>
            </div>

            {/* Idempotency Key info */}
            <div className="clean-card-subtle p-3.5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-center text-[var(--text-secondary)]">
                <span>Idempotency Key (Chống rút tiền 2 lần):</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-purple-500 hover:underline flex items-center gap-1"
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
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition"
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
              <ShieldCheck className="w-5 h-5 text-purple-500" />
              Xác Nhận PIN 6 Số
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5">
              Nhập mã PIN để xác nhận rút {parseFloat(amount).toLocaleString('vi-VN')} VNĐ về {bankName}
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
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Xác Nhận Rút Tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
