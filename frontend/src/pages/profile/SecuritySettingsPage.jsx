import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldCheck, KeyRound, CheckCircle2, Lock, AlertCircle, ArrowLeft, Mail, Phone, RefreshCw } from 'lucide-react';

export default function SecuritySettingsPage() {
  const { user, setupPin, changePin, verifyPin, sendPinResetOtp, resetPinWithOtp } = useAuthStore();
  
  // Steps:
  // 0: Enter Old PIN (Only if user already has a PIN)
  // 1: Enter New PIN
  // 2: Confirm New PIN
  const [step, setStep] = useState(user?.hasPin ? 0 : 1);

  const [oldPin, setOldPin] = useState(['', '', '', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);

  // Forgot PIN OTP states
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['6', '6', '6', '8', '8', '8']); // Pre-filled mock OTP for quick demo
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStep(user?.hasPin ? 0 : 1);
    setIsOtpMode(false);
    setIsOtpVerified(false);
  }, [user]);

  const getCurrentDigits = () => {
    if (isOtpMode) return otpDigits;
    if (step === 0) return oldPin;
    if (step === 1) return newPin;
    return confirmPin;
  };

  const setCurrentDigits = (val) => {
    if (isOtpMode) setOtpDigits(val);
    else if (step === 0) setOldPin(val);
    else if (step === 1) setNewPin(val);
    else setConfirmPin(val);
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const digits = getCurrentDigits();
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setCurrentDigits(newDigits);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-input-${isOtpMode ? 'otp' : step}-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    const digits = getCurrentDigits();
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${isOtpMode ? 'otp' : step}-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Trigger Forgot PIN OTP Flow
  const handleForgotPinClick = async () => {
    setError('');
    setLoading(true);
    try {
      const mockOtp = await sendPinResetOtp();
      setIsOtpMode(true);
      setOtpSentMsg(`Mã OTP xác thực 6 số đã được gửi tới Email ${user.email} & SĐT ${user.phoneNumber}! (Mã demo: ${mockOtp})`);
    } catch (err) {
      setError(err.message || 'Không thể gửi mã OTP xác thực!');
    } finally {
      setLoading(false);
    }
  };

  // Process Step Transition or Final Submission
  const handleProceed = async (e) => {
    e.preventDefault();
    setError('');

    const currentDigitsStr = getCurrentDigits().join('');
    if (currentDigitsStr.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số!');
      return;
    }

    if (isOtpMode) {
      // Verify OTP
      setLoading(true);
      await new Promise((r) => setTimeout(r, 400));
      setLoading(false);

      if (currentDigitsStr !== '666888' && currentDigitsStr.length < 6) {
        setError('Mã OTP xác thực không hợp lệ!');
        return;
      }

      setIsOtpVerified(true);
      setIsOtpMode(false);
      setStep(1); // Advance directly to New PIN step
      setSuccessMsg('Xác thực OTP thành công! Vui lòng nhập Mã PIN Mới bên dưới.');
      setTimeout(() => setSuccessMsg(''), 4000);
      return;
    }

    if (step === 0) {
      // Validate Old PIN
      setLoading(true);
      const isValid = await verifyPin(currentDigitsStr);
      setLoading(false);

      if (!isValid) {
        setError('Mã PIN hiện tại (mã PIN cũ) không chính xác! Vui lòng kiểm tra lại hoặc dùng nút "Quên mã PIN".');
        return;
      }
      // Old PIN correct -> Go to Step 1 (New PIN)
      setStep(1);
    } else if (step === 1) {
      // Advance to Confirm Step
      setStep(2);
    } else if (step === 2) {
      // Confirm & Save
      const newPinStr = newPin.join('');
      const confirmPinStr = confirmPin.join('');

      if (newPinStr !== confirmPinStr) {
        setError('Xác nhận mã PIN mới không khớp! Vui lòng nhập lại.');
        return;
      }

      try {
        setLoading(true);
        if (isOtpVerified) {
          const otpStr = otpDigits.join('');
          await resetPinWithOtp(otpStr, newPinStr);
          setSuccessMsg('Đặt lại mã PIN mới qua xác thực OTP thành công!');
        } else if (user?.hasPin) {
          const oldPinStr = oldPin.join('');
          await changePin(oldPinStr, newPinStr);
          setSuccessMsg('Thay đổi mã PIN 6 số thành công!');
        } else {
          await setupPin(newPinStr);
          setSuccessMsg('Cài đặt mã PIN 6 số thành công!');
        }

        // Reset form
        setOldPin(['', '', '', '', '', '']);
        setNewPin(['', '', '', '', '', '']);
        setConfirmPin(['', '', '', '', '', '']);
        setIsOtpVerified(false);
        setStep(user?.hasPin ? 0 : 1);
      } catch (err) {
        setError(err.message || 'Lỗi khi cập nhật mã PIN!');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStepTitle = () => {
    if (isOtpMode) return 'Nhập Mã OTP Xác Thực';
    if (step === 0) return 'Xác Nhận Mã PIN Cũ';
    if (step === 1) return isOtpVerified ? 'Tạo Mã PIN Mới (Quên PIN)' : (user?.hasPin ? 'Nhập Mã PIN Mới' : 'Tạo Mã PIN 6 Số Mới');
    return 'Xác Nhận Lại Mã PIN Mới';
  };

  const getStepSubTitle = () => {
    if (isOtpMode) return `Nhập mã 6 chữ số vừa nhận để tiếp tục đặt lại PIN`;
    if (step === 0) return 'Vui lòng nhập lại 6 chữ số PIN hiện tại của bạn để tiếp tục';
    if (step === 1) return 'Nhập 6 chữ số bí mật dành riêng cho mã PIN mới';
    return 'Vui lòng nhập lại 6 chữ số PIN mới để hoàn tất thay đổi';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="clean-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-500" />
            Bảo Mật & Quản Lý Mã PIN
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Đổi mã PIN cũ hoặc xác thực OTP khi quên mã PIN để khởi tạo lại.
          </p>
        </div>

        <div>
          {user?.hasPin ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              PIN Đã Kích Hoạt
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Chưa Có PIN
            </span>
          )}
        </div>
      </div>

      {/* OTP Banner Info */}
      {isOtpMode && otpSentMsg && (
        <div className="clean-card p-4 border-indigo-500/40 bg-indigo-500/10 text-indigo-500 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Mail className="w-4 h-4 text-indigo-500" />
            Xác Thực Quên Mã PIN
          </div>
          <p>{otpSentMsg}</p>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="clean-card p-4 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-xs text-emerald-600 hover:underline shrink-0"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Step Indicator Progress Bar */}
      <div className="clean-card p-4 max-w-md mx-auto flex items-center justify-around text-xs font-mono">
        {user?.hasPin && !isOtpVerified && (
          <div className={`flex items-center gap-1.5 ${step === 0 || isOtpMode ? 'text-emerald-600 font-bold' : 'text-[var(--text-secondary)]'}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">1</span>
            {isOtpMode ? 'Xác thực OTP' : 'Mã PIN Cũ'}
          </div>
        )}
        <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-emerald-600 font-bold' : 'text-[var(--text-secondary)]'}`}>
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">{user?.hasPin && !isOtpVerified ? '2' : '1'}</span>
          Mã PIN Mới
        </div>
        <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-emerald-600 font-bold' : 'text-[var(--text-secondary)]'}`}>
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">{user?.hasPin && !isOtpVerified ? '3' : '2'}</span>
          Xác Nhận
        </div>
      </div>

      {/* Main Interactive PIN Card */}
      <div className="clean-card p-6 sm:p-8 text-center max-w-md mx-auto shadow-sm">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>

        <h2 className="text-lg font-bold mb-1">
          {getStepTitle()}
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mb-6">
          {getStepSubTitle()}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleProceed} className="space-y-6">
          {/* 6-Digit PIN Inputs */}
          <div className="flex justify-center items-center gap-2 sm:gap-3">
            {getCurrentDigits().map((digit, idx) => (
              <input
                key={`${isOtpMode ? 'otp' : step}-${idx}`}
                id={`pin-input-${isOtpMode ? 'otp' : step}-${idx}`}
                type={isOtpMode ? 'text' : 'password'}
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-12 text-center text-xl font-bold clean-input text-[var(--text-primary)] shadow-inner font-mono"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Forgot PIN Link on Step 0 */}
          {step === 0 && !isOtpMode && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPinClick}
                className="text-xs text-indigo-500 hover:underline font-semibold"
              >
                Quên mã PIN cũ? Quá trình xác thực OTP →
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {(step > (user?.hasPin && !isOtpVerified ? 0 : 1) || isOtpMode) && (
              <button
                type="button"
                onClick={() => {
                  if (isOtpMode) setIsOtpMode(false);
                  else setStep(step - 1);
                }}
                className="flex-1 py-2.5 clean-card-subtle text-[var(--text-secondary)] text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Hủy
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <span>Đang xử lý...</span>
              ) : isOtpMode ? (
                'Xác Thực OTP →'
              ) : step === 2 ? (
                'Lưu Mã PIN Mới'
              ) : (
                'Tiếp Theo →'
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
