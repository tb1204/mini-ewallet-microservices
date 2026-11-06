import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { walletApi } from '../../api/walletApi';
import { Building2, ShieldCheck, X, Loader2, CreditCard, CheckCircle } from 'lucide-react';

const popularBanks = [
  { code: 'TCB', name: 'Techcombank' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'MBB', name: 'MBBank' },
  { code: 'CTG', name: 'VietinBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
];

export default function LinkBankModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuthStore();

  const [bankCode, setBankCode] = useState('TCB');
  const [accountNumber, setAccountNumber] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const ownerName = user?.fullName ? user.fullName.toUpperCase() : 'TRAN CONG BANG';
  const selectedBank = popularBanks.find((b) => b.code === bankCode) || popularBanks[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanAccNo = accountNumber.trim().replace(/\s/g, '');
    if (!cleanAccNo || cleanAccNo.length < 6) {
      setError('Số tài khoản ngân hàng không hợp lệ (tối thiểu 6 ký tự số)!');
      return;
    }

    try {
      setLoading(true);
      const res = await walletApi.linkBank({
        bankCode: selectedBank.code,
        bankName: selectedBank.name,
        accountNumber: cleanAccNo,
        accountHolderName: ownerName,
        isDefault,
      });

      const linkedAccount = res?.result || res?.data;
      if (onSuccess) {
        onSuccess(linkedAccount);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Liên kết tài khoản ngân hàng thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-sm">
      <div className="clean-card p-6 sm:p-8 max-w-lg w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Liên Kết Tài Khoản Ngân Hàng</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Chỉ liên kết tài khoản ngân hàng chính chủ của bạn.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Ngân hàng */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">Ngân hàng phát hành:</label>
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="w-full clean-input px-3.5 py-2.5 text-sm"
            >
              {popularBanks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Số tài khoản */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">Số tài khoản ngân hàng:</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="VD: 1018766809"
              className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold"
              required
            />
          </div>

          {/* Tên chủ thẻ (Readonly KYC) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold">Tên chủ tài khoản (Chính chủ):</label>
              <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Khớp 100% KYC Ví
              </span>
            </div>
            <input
              type="text"
              value={ownerName}
              readOnly
              disabled
              className="w-full clean-input px-3.5 py-2.5 text-sm font-mono font-bold uppercase bg-[var(--card-subtle)] opacity-80 cursor-not-allowed text-emerald-600 dark:text-emerald-400"
            />
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              * Theo quy định Ngân hàng Nhà nước, tài khoản ngân hàng bắt buộc phải trùng tên với chủ ví.
            </p>
          </div>

          {/* Checkbox default */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultAccount"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
            />
            <label htmlFor="isDefaultAccount" className="text-xs text-[var(--text-secondary)] cursor-pointer">
              Đặt làm tài khoản ngân hàng ưu tiên mặc định
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Xác Nhận Liên Kết</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

