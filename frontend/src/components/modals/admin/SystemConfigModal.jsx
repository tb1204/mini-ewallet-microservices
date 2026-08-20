import { useState } from 'react';
import { Settings, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function SystemConfigModal({ isOpen, onClose }) {
  const [dailyLimit, setDailyLimit] = useState('50000000');
  const [singleLimit, setSingleLimit] = useState('20000000');
  const [withdrawFee, setWithdrawFee] = useState('5000');
  const [p2pFeePercent, setP2pFeePercent] = useState('0');
  const [otpThreshold, setOtpThreshold] = useState('2000000');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="clean-card max-w-lg w-full p-6 rounded-2xl shadow-2xl relative space-y-5 border border-border-main">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:bg-bg-card-subtle transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-border-main pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 flex items-center justify-center border border-purple-500/30">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Cấu Hình Hạn Mức & Phí Hệ Thống
            </h3>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Đã lưu cấu hình tham số hệ thống thành công!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Daily Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-text-secondary">
                Hạn mức giao dịch / ngày (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full clean-input py-2 px-3 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-text-secondary">
                Hạn mức 1 giao dịch (VNĐ)
              </label>
              <input
                type="number"
                value={singleLimit}
                onChange={(e) => setSingleLimit(e.target.value)}
                className="w-full clean-input py-2 px-3 text-xs"
              />
            </div>
          </div>

          {/* Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-text-secondary">
                Phí rút tiền cố định (VNĐ)
              </label>
              <input
                type="number"
                value={withdrawFee}
                onChange={(e) => setWithdrawFee(e.target.value)}
                className="w-full clean-input py-2 px-3 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-text-secondary">
                Phí chuyển tiền P2P (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={p2pFeePercent}
                onChange={(e) => setP2pFeePercent(e.target.value)}
                className="w-full clean-input py-2 px-3 text-xs"
              />
            </div>
          </div>

          {/* Security OTP Threshold */}
          <div>
            <label className="block font-semibold mb-1 text-text-secondary">
              Ngưỡng bắt buộc xác thực OTP (VNĐ)
            </label>
            <input
              type="number"
              value={otpThreshold}
              onChange={(e) => setOtpThreshold(e.target.value)}
              className="w-full clean-input py-2 px-3 text-xs"
            />
            <p className="text-[10px] text-text-muted mt-1">
              Giao dịch vượt giá trị này sẽ yêu cầu thêm xác thực OTP qua SMS/Notification.
            </p>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <div className="font-bold text-text-primary">Chế độ Bảo trì Hệ thống</div>
                <div className="text-[10px] text-text-secondary">Tạm dừng tất cả giao dịch nạp/rút/chuyển tiền</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 rounded-full transition-colors p-1 relative ${
                maintenanceMode ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-main">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl clean-card-subtle font-semibold text-text-secondary hover:text-text-primary transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md transition"
            >
              Lưu Cấu Hình
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
