import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { Send, CheckCircle2, ShieldCheck, UserCheck, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TransferPage() {
  const { user, registeredUsers, verifyPin } = useAuthStore();
  const { balance, executeTransfer } = useWalletStore();
  const navigate = useNavigate();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Recipient search suggestion
  const [recipientName, setRecipientName] = useState('');

  // PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState(null);

  useEffect(() => {
    generateIdempotencyKey();
  }, []);

  useEffect(() => {
    if (!recipient) {
      setRecipientName('');
      return;
    }
    const found = registeredUsers.find(
      (u) => u.email.toLowerCase() === recipient.toLowerCase() || u.phoneNumber === recipient
    );
    if (found) {
      setRecipientName(found.fullName);
    } else {
      setRecipientName('');
    }
  }, [recipient, registeredUsers]);

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

    if (!recipient) {
      setError('Vui lòng nhập Email hoặc Số điện thoại người nhận!');
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Số tiền chuyển phải lớn hơn 0 VNĐ!');
      return;
    }

    if (num > balance) {
      setError(`Số dư ví không đủ! Hiện có ${balance.toLocaleString('vi-VN')} VNĐ.`);
      return;
    }

    if (!user?.hasPin) {
      setError('Bạn cần cài đặt Mã PIN 6 số trước khi thực hiện giao dịch!');
      return;
    }

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
      const tx = await executeTransfer({
        recipientEmailOrPhone: recipient,
        amount,
        idempotencyKey,
        description
      });

      setSuccessTx(tx);
      setShowPinModal(false);
    } catch (err) {
      setError(err.message || 'Giao dịch chuyển tiền thất bại!');
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
            <Send className="w-5 h-5 text-indigo-500" />
            Chuyển Tiền P2P (`transaction_db`)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Chuyển tiền người dùng với mã Idempotency Key tự động chống chuyển 2 lần.
          </p>
        </div>
      </div>

      {/* Success View */}
      {successTx ? (
        <div className="clean-card p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-indigo-600">Chuyển Tiền Thành Công!</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Đã chuyển {parseFloat(successTx.amount).toLocaleString('vi-VN')} VNĐ cho người nhận.
          </p>

          <div className="clean-card-subtle p-4 text-xs font-mono text-left space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Mã giao dịch:</span>
              <span className="font-bold">{successTx.transactionCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Mô tả:</span>
              <span>{successTx.description}</span>
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
                setRecipient('');
                setDescription('');
                generateIdempotencyKey();
              }}
              className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
            >
              Chuyển Tiếp
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
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

          <form onSubmit={handleSubmitInit} className="space-y-4">
            
            {/* Recipient Input */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Email hoặc Số điện thoại người nhận:</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="VD: 0987654321 hoặc user@ewallet.com"
                className="w-full clean-input px-3.5 py-2.5 text-sm"
                required
              />
              {recipientName && (
                <div className="mt-1.5 text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Tìm thấy: {recipientName}
                </div>
              )}
            </div>

            {/* Quick recipient suggestions */}
            <div>
              <span className="text-[11px] text-[var(--text-secondary)] block mb-1">Gợi ý người nhận có sẵn:</span>
              <div className="flex flex-wrap gap-2">
                {registeredUsers
                  .filter((u) => u.id !== user?.id)
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setRecipient(u.email)}
                      className="px-2.5 py-1 rounded-lg clean-card-subtle text-[11px] font-mono hover:border-indigo-500 transition"
                    >
                      👤 {u.fullName} ({u.role})
                    </button>
                  ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold">Số tiền chuyển (VNĐ):</label>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Khả dụng: <strong className="text-emerald-600">{balance.toLocaleString('vi-VN')} VNĐ</strong>
                </span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 100000"
                className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold"
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Nội dung chuyển tiền:</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Chuyển tiền ăn trưa"
                className="w-full clean-input px-3.5 py-2.5 text-sm"
              />
            </div>

            {/* Idempotency Key info */}
            <div className="clean-card-subtle p-3.5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-center text-[var(--text-secondary)]">
                <span>Idempotency Key (Chống chuyển 2 lần):</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-indigo-500 hover:underline flex items-center gap-1"
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
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition"
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
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Xác Nhận PIN 6 Số
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5">
              Nhập mã PIN để chuyển {parseFloat(amount).toLocaleString('vi-VN')} VNĐ cho {recipient}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
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
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Đang chuyển...' : 'Xác Nhận Chuyển'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
