import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';

/**
 * Modal prompting users to set up their 6-digit transaction PIN
 * before performing sensitive actions (view balance, transfer money, withdraw, etc.)
 */
export default function PinRequiredModal({
  isOpen,
  onClose,
  title = 'Chưa Thiết Lập Mã PIN Giao Dịch',
  description = 'Vui lòng tạo mã PIN để tiếp tục.',
  redirectPath = '/security',
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToSetup = () => {
    onClose();
    navigate(redirectPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm clean-card p-6 relative shadow-2xl space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-800/20 transition"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Icon & Header */}
        <div className="text-center space-y-2.5 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            {title}
          </h3>

          <p className="text-sm text-[var(--text-secondary)] px-2">
            {description}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-600/30 text-xs font-semibold text-[var(--text-secondary)] hover:bg-slate-800/20 transition text-center"
          >
            Để sau
          </button>

          <button
            type="button"
            onClick={handleGoToSetup}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
          >
            <span>Tạo Mã PIN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
