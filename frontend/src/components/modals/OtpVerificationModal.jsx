import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, Clock, RefreshCw, X, Loader2, AlertCircle } from 'lucide-react';

/**
 * High-Security Transaction OTP Verification Modal
 * - Strict 120-second countdown timer per fintech compliance
 * - Masked email notification hint
 * - Auto-focus and 6-digit OTP entry
 * - One-click Resend OTP action
 */
export default function OtpVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  onResend,
  maskedEmail = '',
  amount = 0,
  isLoading = false,
  errorMessage = '',
}) {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 120s countdown
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef(null);

  // Reset timer and OTP when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setTimeLeft(120);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' VNĐ';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6 || timeLeft <= 0) return;
    onConfirm(otp.trim());
  };

  const handleResendClick = async () => {
    if (timeLeft > 90 || isResending) return; // Prevent spamming within first 30s
    setIsResending(true);
    try {
      if (onResend) await onResend();
      setTimeLeft(120);
      setOtp('');
      if (inputRef.current) inputRef.current.focus();
    } finally {
      setIsResending(false);
    }
  };

  const isExpired = timeLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="clean-card max-w-md w-full p-6 rounded-2xl shadow-2xl relative space-y-5 border border-border-main animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:bg-bg-card-subtle transition cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 mx-auto flex items-center justify-center border border-blue-500/30 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Xác Thực Giao Dịch Giá Trị Cao
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Giao dịch số tiền <strong className="text-blue-600 dark:text-blue-400">{formatVND(amount)}</strong> cần xác thực mã OTP 2 lớp
            </p>
          </div>
        </div>

        {/* Email Hint Alert */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-200">
          <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Mã OTP (6 chữ số) đã được gửi đến email: <br />
            <strong className="font-mono text-blue-700 dark:text-blue-300">
              {maskedEmail || 'email đã đăng ký'}
            </strong>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-text-secondary">
              <span>Nhập mã OTP</span>
              <span className={`inline-flex items-center gap-1 font-mono font-semibold ${
                isExpired ? 'text-red-500' : timeLeft < 30 ? 'text-amber-500 animate-pulse' : 'text-blue-600 dark:text-blue-400'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {isExpired ? 'Hết hạn' : formatTimer(timeLeft)}
              </span>
            </div>

            <input
              ref={inputRef}
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
              }}
              placeholder="• • • • • •"
              disabled={isLoading || isExpired}
              className="w-full clean-input text-center text-2xl tracking-[0.6em] font-mono font-bold py-3 disabled:opacity-50"
              autoComplete="one-time-code"
            />
          </div>

          {/* Resend OTP Action */}
          <div className="text-center text-xs">
            {isExpired ? (
              <span className="text-red-500 font-medium">Mã OTP đã hết thời gian hiệu lực (120s). </span>
            ) : (
              <span className="text-text-secondary">Chưa nhận được mã? </span>
            )}
            <button
              type="button"
              onClick={handleResendClick}
              disabled={(!isExpired && timeLeft > 90) || isResending || isLoading}
              className={`font-semibold inline-flex items-center gap-1 ml-1 cursor-pointer transition ${
                (!isExpired && timeLeft > 90) || isResending || isLoading
                  ? 'text-text-muted cursor-not-allowed opacity-50'
                  : 'text-blue-600 dark:text-blue-400 hover:underline'
              }`}
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Đang gửi lại...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Gửi lại mã {!isExpired && timeLeft > 90 && `(${timeLeft - 90}s)`}
                </>
              )}
            </button>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-main">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl clean-card-subtle font-semibold text-text-secondary hover:text-text-primary transition text-xs cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={otp.length !== 6 || isLoading || isExpired}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Xác Nhận Chuyển Tiền
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

