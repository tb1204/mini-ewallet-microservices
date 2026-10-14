import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Send, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import BannerCarousel from '../../components/dashboard/BannerCarousel';
import QuickUtilitiesGrid from '../../components/dashboard/QuickUtilitiesGrid';
import RecentTransactionsWidget from '../../components/dashboard/RecentTransactionsWidget';
import SpendingStatsWidget from '../../components/dashboard/SpendingStatsWidget';

export default function UserDashboardPage() {
  const { user, verifyPin } = useAuthStore();
  const { balance, status: walletStatus, version, fetchMyWallet, fetchTransactions } = useWalletStore();

  useEffect(() => {
    fetchMyWallet();
    fetchTransactions();
  }, []);

  // Balance unlock state (requires PIN on first reveal after login)
  const [isBalanceUnlocked, setIsBalanceUnlocked] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  // PIN modal for balance reveal
  const [showBalancePinModal, setShowBalancePinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Toggle balance visibility with mandatory PIN check on first reveal
  const handleToggleBalanceClick = () => {
    if (!isBalanceUnlocked) {
      if (!user?.hasPin) {
        alert('Bạn cần cài đặt Mã PIN 6 số trước khi xem số dư!');
        return;
      }
      setPinError('');
      setPinCode('');
      setShowBalancePinModal(true);
    } else {
      setShowBalance(!showBalance);
    }
  };

  const handleConfirmPinForBalance = async (e) => {
    e.preventDefault();
    setPinError('');

    const isValid = await verifyPin(pinCode);
    if (!isValid) {
      setPinError('Mã PIN 6 số không chính xác!');
      return;
    }

    setIsBalanceUnlocked(true);
    setShowBalance(true);
    setShowBalancePinModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Header */}
      <div className="clean-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.fullName}! 👋
          </h1>
        </div>

        {!user?.hasPin && (
          <Link
            to="/security"
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Cài Đặt Mã PIN Ngay
          </Link>
        )}
      </div>

      {/* Wallet Balance Card & Quick Actions */}
      <div className="clean-card p-6 sm:p-8 space-y-6 relative shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Số Dư
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              VND
            </span>
          </div>

          <button
            id="btn-toggle-balance"
            onClick={handleToggleBalanceClick}
            className="px-3 py-1.5 rounded-lg clean-card-subtle text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-1.5"
            title="Xem/Ẩn số dư"
          >
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showBalance ? 'Ẩn số dư' : 'Xem số dư'}</span>
          </button>
        </div>

        {/* Balance Display */}
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-baseline gap-2">
            {showBalance && isBalanceUnlocked ? formatCurrency(balance) : '•••••••• VNĐ'}
          </div>
          <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 font-mono font-medium capitalize">
            <CheckCircle2 className="w-3.5 h-3.5" /> Trạng thái: {walletStatus ? walletStatus.toLowerCase() : 'active'}
          </p>
        </div>

        {/* Financial Action Buttons */}
        <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[var(--border-main)]">
          <Link
            to="/topup"
            className="py-3 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex flex-col items-center gap-1.5 transition text-center"
          >
            <ArrowDownLeft className="w-5 h-5" />
            Nạp Tiền
          </Link>

          <Link
            to="/transfer"
            className="py-3 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 text-xs font-bold flex flex-col items-center gap-1.5 transition text-center"
          >
            <Send className="w-5 h-5" />
            Chuyển Tiền
          </Link>

          <Link
            to="/withdraw"
            className="py-3 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 text-xs font-bold flex flex-col items-center gap-1.5 transition text-center"
          >
            <ArrowUpRight className="w-5 h-5" />
            Rút Tiền
          </Link>
        </div>
      </div>

      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Quick Utility Services Grid */}
      <QuickUtilitiesGrid />

      {/* Spending Statistics Widget */}
      <SpendingStatsWidget />

      {/* Recent Transactions Widget */}
      <RecentTransactionsWidget />

      {/* Balance Reveal PIN Modal */}
      {showBalancePinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-sm">
          <div className="clean-card p-6 sm:p-8 max-w-sm w-full relative shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Xác Nhận PIN Xem Số Dư</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Vui lòng nhập mã PIN 6 số để hiển thị số dư ví của bạn
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs text-center">
                ⚠️ {pinError}
              </div>
            )}

            <form onSubmit={handleConfirmPinForBalance} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="••••••"
                className="w-full clean-input px-3 py-3 text-center text-2xl font-mono tracking-widest"
                required
                autoFocus
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBalancePinModal(false)}
                  className="flex-1 py-2.5 clean-card-subtle text-xs font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Xác Nhận PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
