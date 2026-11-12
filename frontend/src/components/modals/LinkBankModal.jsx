import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { walletApi } from '../../api/walletApi';
import { Building2, ShieldCheck, X, Loader2, CreditCard, CheckCircle2, Plus, Star, Trash2, ArrowLeft } from 'lucide-react';

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

export default function LinkBankModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuthStore();

  const [view, setView] = useState('LIST'); // 'LIST' or 'CREATE'
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Create Form State
  const [bankCode, setBankCode] = useState('TCB');
  const [accountNumber, setAccountNumber] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const ownerName = user?.fullName ? user.fullName.toUpperCase() : 'NGUYEN VAN A';
  const selectedBank = popularBanks.find((b) => b.code === bankCode) || popularBanks[0];

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      fetchLinkedBanks();
    }
  }, [isOpen]);

  const fetchLinkedBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await walletApi.getLinkedBanks();
      const list = res?.result || res?.data || [];
      const safeList = Array.isArray(list) ? list : [];
      setLinkedBanks(safeList);
      if (safeList.length === 0) {
        setView('CREATE');
        setIsDefault(true);
      } else {
        setView('LIST');
      }
    } catch (err) {
      console.warn('Could not load linked banks:', err);
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleSetDefault = async (bankId) => {
    setError('');
    setActionLoadingId(bankId);
    try {
      await walletApi.setDefaultBank(bankId);
      setSuccessMsg('Đã đặt làm tài khoản ngân hàng mặc định thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchLinkedBanks();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt làm tài khoản mặc định!');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnlink = async (bank) => {
    const confirm = window.confirm(`Bạn có chắc muốn hủy liên kết tài khoản ngân hàng ${bank.bankName} (${bank.accountNumber})?`);
    if (!confirm) return;

    setError('');
    setActionLoadingId(bank.id);
    try {
      await walletApi.unlinkBank(bank.id);
      setSuccessMsg('Đã hủy liên kết tài khoản ngân hàng thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchLinkedBanks();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy liên kết ngân hàng!');
    } finally {
      setActionLoadingId(null);
    }
  };

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
        isDefault: isDefault ? 1 : 0,
      });

      setSuccessMsg('Liên kết tài khoản ngân hàng mới thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setAccountNumber('');
      await fetchLinkedBanks();
      setView('LIST');
      if (onSuccess) onSuccess(res?.result || res?.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Liên kết tài khoản ngân hàng thất bại!');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="clean-card p-6 sm:p-7 max-w-lg w-full relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-card-hover transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          {view === 'CREATE' && linkedBanks.length > 0 && (
            <button
              onClick={() => {
                setView('LIST');
                setError('');
              }}
              className="p-1.5 rounded-lg border border-border-main hover:bg-card-hover text-text-secondary transition"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              {view === 'LIST' ? 'Quản Lý Tài Khoản Ngân Hàng' : 'Liên Kết Tài Khoản Ngân Hàng'}
            </h3>
            <p className="text-xs text-text-secondary">
              {view === 'LIST'
                ? 'Danh sách các tài khoản ngân hàng chính chủ liên kết với ví.'
                : 'Chỉ liên kết tài khoản ngân hàng chính chủ của bạn.'}
            </p>
          </div>
        </div>

        {/* Success / Error Banners */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* VIEW 1: DANH SÁCH TÀI KHOẢN NGÂN HÀNG */}
        {view === 'LIST' && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {loadingBanks ? (
              <div className="py-12 text-center text-text-secondary space-y-2">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-purple-500" />
                <p className="text-xs">Đang tải danh sách ngân hàng...</p>
              </div>
            ) : linkedBanks.length === 0 ? (
              <div className="py-8 text-center text-text-secondary space-y-3">
                <Building2 className="w-10 h-10 mx-auto text-purple-500/40" />
                <p className="text-xs font-semibold">Chưa có tài khoản ngân hàng nào được liên kết.</p>
                <button
                  onClick={() => setView('CREATE')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Liên kết tài khoản đầu tiên
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2.5">
                  {linkedBanks.map((bank) => {
                    const style = bankStyleMap[bank.bankCode] || bankStyleMap.DEFAULT;
                    const isDefaultBank = bank.isDefault === 1 || bank.isDefault === true || bank.default === 1 || bank.default === true;
                    const isActionLoading = actionLoadingId === bank.id;

                    return (
                      <div
                        key={bank.id}
                        className={`p-4 rounded-2xl border transition relative ${
                          isDefaultBank
                            ? 'bg-purple-500/10 border-purple-500/60 shadow-sm ring-1 ring-purple-500/30'
                            : 'clean-card-subtle border-border-main hover:border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${style.bg} ${style.color} flex items-center justify-center font-bold text-xs shrink-0 border`}>
                              {bank.bankCode}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{bank.bankName}</span>
                                {isDefaultBank && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white flex items-center gap-1 shadow-xs">
                                    <Star className="w-2.5 h-2.5 fill-current" /> Mặc định
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-xs font-semibold text-text-primary tracking-wider mt-0.5">
                                {bank.accountNumber}
                              </div>
                              <div className="text-[11px] text-text-secondary uppercase mt-0.5">
                                {bank.accountHolderName || ownerName}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            {isDefaultBank ? (
                              <button
                                type="button"
                                disabled
                                title="Tài khoản này đang được đặt làm mặc định"
                                className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm opacity-100 cursor-default"
                              >
                                <Star className="w-3 h-3 fill-current" />
                                <span>Đặt mặc định</span>
                              </button>
                            ) : (
                              <button
                                disabled={isActionLoading}
                                onClick={() => handleSetDefault(bank.id)}
                                title="Đặt làm tài khoản thanh toán mặc định khi nạp / rút tiền"
                                className="px-2.5 py-1 rounded-lg border border-purple-500/40 text-purple-600 hover:bg-purple-600 hover:text-white text-[11px] font-medium transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                {isActionLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Star className="w-3 h-3" />
                                )}
                                <span>Đặt mặc định</span>
                              </button>
                            )}

                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUnlink(bank)}
                              title="Hủy liên kết tài khoản này"
                              className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setView('CREATE');
                      setError('');
                      setIsDefault(false);
                    }}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Liên kết thêm tài khoản ngân hàng khác</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW 2: FORM LIÊN KẾT NGÂN HÀNG MỚI */}
        {view === 'CREATE' && (
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
            
            {/* Ngân hàng */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Ngân hàng phát hành:</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full clean-input px-3.5 py-2.5 text-xs font-medium cursor-pointer"
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
                className="w-full clean-input px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider"
                required
              />
            </div>

            {/* Tên chủ tài khoản */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold">Tên chủ tài khoản (Chính chủ):</label>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Khớp 100% KYC Ví
                </span>
              </div>
              <input
                type="text"
                value={ownerName}
                disabled
                className="w-full clean-input px-3.5 py-2.5 text-xs font-bold uppercase opacity-80 cursor-not-allowed bg-black/5 dark:bg-white/5"
              />
              <p className="text-[10px] text-text-secondary mt-1">
                * Theo quy định Ngân hàng Nhà nước, tài khoản ngân hàng bắt buộc phải trùng tên với chủ ví.
              </p>
            </div>

            {/* Đặt làm mặc định */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefaultCheck"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="isDefaultCheck" className="text-xs font-medium text-text-primary cursor-pointer select-none">
                Đặt làm tài khoản ngân hàng ưu tiên mặc định khi Nạp / Rút tiền
              </label>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex gap-3 pt-3">
              {linkedBanks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setView('LIST')}
                  className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl hover:bg-card-hover transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang liên kết...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Liên Kết</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
