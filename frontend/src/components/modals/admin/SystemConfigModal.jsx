import { useState, useEffect } from 'react';
import { Settings, AlertTriangle, CheckCircle2, X, Loader2, ShieldCheck, DollarSign } from 'lucide-react';
import { auditApi } from '../../../api';

/**
 * System Parameter Configuration Modal for Administrators
 * Connects directly to audit-service SystemConfig endpoints.
 */
export default function SystemConfigModal({ isOpen, onClose }) {
  const [dailyLimit, setDailyLimit] = useState('50000000');
  const [singleLimit, setSingleLimit] = useState('20000000');
  const [withdrawFee, setWithdrawFee] = useState('5000');
  const [p2pFeePercent, setP2pFeePercent] = useState('0');
  const [utilityCommissionPercent, setUtilityCommissionPercent] = useState('2');
  const [otpThreshold, setOtpThreshold] = useState('2000000');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatVND = (num) => {
    const val = Number(num);
    if (isNaN(val) || val <= 0) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ';
  };

  // Fetch system configurations from audit-service when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchConfigs = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await auditApi.getSystemConfigs();
        const configs = response?.result || response?.data || response;

        if (isMounted && Array.isArray(configs)) {
          configs.forEach((item) => {
            const key = item.key || item.configKey;
            const val = item.value || item.configValue;
            if (key === 'DAILY_TRANSFER_LIMIT') setDailyLimit(val);
            if (key === 'SINGLE_TRANSFER_LIMIT') setSingleLimit(val);
            if (key === 'WITHDRAW_FEE') setWithdrawFee(val);
            if (key === 'P2P_FEE_PERCENT') setP2pFeePercent(val);
            if (key === 'UTILITY_COMMISSION_PERCENT') setUtilityCommissionPercent(val);
            if (key === 'OTP_THRESHOLD') setOtpThreshold(val);
            if (key === 'MAINTENANCE_MODE') setMaintenanceMode(val === 'true');
          });
        }
      } catch (err) {
        console.error('Failed to load system configs:', err);
        if (isMounted) {
          setErrorMessage('Không thể tải cấu hình từ audit-service. Đang hiển thị giá trị mặc định.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchConfigs();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Business Logic Validations
    const numDaily = Number(dailyLimit);
    const numSingle = Number(singleLimit);
    const numWithdraw = Number(withdrawFee);
    const numP2p = Number(p2pFeePercent);
    const numCommission = Number(utilityCommissionPercent);
    const numOtp = Number(otpThreshold);

    if (isNaN(numDaily) || numDaily <= 0) {
      setErrorMessage('Hạn mức giao dịch / ngày phải là số dương hợp lệ.');
      return;
    }
    if (isNaN(numSingle) || numSingle <= 0) {
      setErrorMessage('Hạn mức 1 giao dịch phải là số dương hợp lệ.');
      return;
    }
    if (numSingle > numDaily) {
      setErrorMessage(`Hạn mức 1 giao dịch (${formatVND(numSingle)}) không được vượt quá hạn mức giao dịch / ngày (${formatVND(numDaily)}).`);
      return;
    }
    if (isNaN(numWithdraw) || numWithdraw < 0) {
      setErrorMessage('Phí rút tiền cố định không được âm.');
      return;
    }
    if (isNaN(numP2p) || numP2p < 0 || numP2p > 100) {
      setErrorMessage('Phí chuyển tiền P2P phải từ 0% đến 100%.');
      return;
    }
    if (isNaN(numCommission) || numCommission < 0 || numCommission > 100) {
      setErrorMessage('Hoa hồng đối tác tiện ích phải từ 0% đến 100%.');
      return;
    }
    if (isNaN(numOtp) || numOtp < 0) {
      setErrorMessage('Ngưỡng xác thực OTP phải là số không âm.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        DAILY_TRANSFER_LIMIT: String(dailyLimit),
        SINGLE_TRANSFER_LIMIT: String(singleLimit),
        WITHDRAW_FEE: String(withdrawFee),
        P2P_FEE_PERCENT: String(p2pFeePercent),
        UTILITY_COMMISSION_PERCENT: String(utilityCommissionPercent),
        OTP_THRESHOLD: String(otpThreshold),
        MAINTENANCE_MODE: maintenanceMode ? 'true' : 'false',
      };

      await auditApi.batchUpdateSystemConfigs(payload);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save system configs:', err);
      const msg = err.response?.data?.message || err.message || 'Lưu cấu hình thất bại';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="clean-card max-w-lg w-full p-6 rounded-2xl shadow-2xl relative space-y-5 border border-border-main">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:bg-bg-card-subtle transition"
          aria-label="Đóng"
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
            <p className="text-xs text-text-secondary">
              Thiết lập tham số giao dịch, hạn mức thanh toán và bảo mật ví điện tử
            </p>
          </div>
        </div>

        {/* Notification feedback */}
        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Đã lưu cấu hình tham số hệ thống và đồng bộ thành công!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-secondary">
            <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
            <span className="text-xs">Đang tải cấu hình hệ thống từ máy chủ...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            
            {/* Daily & Single Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-text-secondary">
                  Hạn mức giao dịch / ngày (VNĐ)
                </label>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full clean-input py-2 px-3 text-xs font-mono"
                  placeholder="50000000"
                  required
                />
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium font-mono mt-1">
                  ≈ {formatVND(dailyLimit)}
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
                  className="w-full clean-input py-2 px-3 text-xs font-mono"
                  placeholder="20000000"
                  required
                />
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium font-mono mt-1">
                  ≈ {formatVND(singleLimit)}
                </div>
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
                  className="w-full clean-input py-2 px-3 text-xs font-mono"
                  placeholder="5000"
                  required
                />
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono mt-1">
                  ≈ {formatVND(withdrawFee)} / lần rút (Người rút trả)
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-text-secondary">
                  Phí chuyển tiền P2P (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={p2pFeePercent}
                  onChange={(e) => setP2pFeePercent(e.target.value)}
                  className="w-full clean-input py-2 px-3 text-xs font-mono"
                  placeholder="0"
                  required
                />
                <div className="text-[11px] text-text-muted mt-1">
                  {Number(p2pFeePercent) === 0 ? '✓ Miễn phí chuyển khoản nội bộ' : `${p2pFeePercent}% cộng thêm (Người gửi trả)`}
                </div>
              </div>
            </div>

            {/* Utility Commission & Security OTP Threshold */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-text-secondary">
                  Hoa hồng đối tác tiện ích (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={utilityCommissionPercent}
                  onChange={(e) => setUtilityCommissionPercent(e.target.value)}
                  className="w-full clean-input py-2 px-3 text-xs font-mono"
                  placeholder="2"
                  required
                />
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium font-mono mt-1">
                  ✓ Ví hưởng {utilityCommissionPercent}% chiết khấu từ đối tác
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-text-secondary">
                  Ngưỡng bắt buộc xác thực OTP (VNĐ)
                </label>
                <input
                  type="number"
                  value={otpThreshold}
                  onChange={(e) => setOtpThreshold(e.target.value)}
                  className="w-full clean-input py-2 px-3 text-xs font-mono"
                  placeholder="2000000"
                  required
                />
                <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium font-mono mt-1">
                  ≈ {formatVND(otpThreshold)}
                </div>
              </div>
            </div>

            {/* Maintenance Mode Warning when ON */}
            {maintenanceMode && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">LƯU Ý QUAN TRỌNG:</div>
                  <div className="text-[11px] leading-relaxed">
                    Chế độ bảo trì đang được BẬT. Khi lưu, toàn bộ người dùng trong hệ thống sẽ bị tạm dừng nạp, rút và chuyển tiền!
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Mode Toggle */}
            <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
              maintenanceMode 
                ? 'border-amber-500/40 bg-amber-500/10' 
                : 'border-border-main bg-bg-card-subtle'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  maintenanceMode ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-text-primary">Chế độ Bảo trì Hệ thống</div>
                  <div className="text-[10px] text-text-secondary">Tạm dừng tất cả giao dịch nạp/rút/chuyển tiền</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-12 h-6 rounded-full transition-colors p-1 relative cursor-pointer ${
                  maintenanceMode ? 'bg-amber-500' : 'bg-slate-700'
                }`}
                aria-label="Bật tắt chế độ bảo trì"
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
                disabled={isSaving}
                className="px-4 py-2 rounded-xl clean-card-subtle font-semibold text-text-secondary hover:text-text-primary transition disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Lưu Cấu Hình
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
