import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Wallet, LogOut, KeyRound, LayoutDashboard, History, FileText, Sun, Moon, ArrowDownLeft, Send, ArrowUpRight, User, Bell, Check, Users, ArrowLeftRight, Settings, Menu, X } from 'lucide-react';
import UserInfoModal from '../modals/UserInfoModal';
import SystemConfigModal from '../modals/admin/SystemConfigModal';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserModal, setShowUserModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Nạp tiền thành công', detail: 'Tài khoản ví vừa tăng +500.000 VNĐ từ ngân hàng.', time: '10 phút trước', read: false, type: 'topup' },
    { id: 2, title: 'Tính năng mới!', detail: 'Đã cập nhật Thống kê chi tiêu trực quan hàng tháng.', time: '1 giờ trước', read: false, type: 'feature' },
    { id: 3, title: 'Bảo mật tài khoản', detail: 'Mã PIN 6 số đã được bảo vệ với mã hóa Idempotency.', time: 'Hôm qua', read: true, type: 'security' }
  ]);

  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 w-full clean-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to={user?.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/'} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight flex items-center gap-2">
                MiniWallet
                {user?.role === 'ROLE_ADMIN' && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-600 px-2 py-0.5 rounded-full border border-purple-500/30 font-semibold uppercase tracking-wider hidden sm:inline-block">
                    Admin Portal
                  </span>
                )}
              </span>
            </div>
          </Link>

          {/* Navigation Links based on ROLE */}
          <nav className="hidden md:flex items-center gap-1">
            {user?.role === 'ROLE_ADMIN' ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/admin/dashboard')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary)'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-purple-500" />
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/admin/users')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-500" />
                  Quản Lý User
                </Link>
                <Link
                  to="/admin/transactions"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/admin/transactions')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                  Giao Dịch Hệ Thống
                </Link>
                <Link
                  to="/admin/audit-logs"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/admin/audit-logs')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary)'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  Audit Logs
                </Link>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  Cấu Hình Ví
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/')
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tổng Quan
                </Link>
                <Link
                  to="/topup"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/topup')
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : 'text-text-secondary hover:text-text-primary)'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                  Nạp Tiền
                </Link>
                <Link
                  to="/transfer"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/transfer')
                      ? 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Send className="w-4 h-4 text-indigo-500" />
                  Chuyển Tiền
                </Link>
                <Link
                  to="/withdraw"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/withdraw')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-purple-500" />
                  Rút Tiền
                </Link>
                <Link
                  to="/history"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive('/history')
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <History className="w-4 h-4" />
                  Lịch Sử
                </Link>
              </>
            )}

            <Link
              to="/security"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive('/security')
                  ? 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Mã PIN
            </Link>
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              id="btn-toggle-theme"
              title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
              className="p-2 rounded-lg border border-border-main hover:bg-bg-card-subtle text-text-primary transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Notifications Bell Icon */}
            <div className="relative" ref={notifRef}>
              <button
                id="btn-notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Thông báo hệ thống"
                className="p-2 rounded-lg border border-border-main hover:bg-bg-card-subtle text-text-primary transition relative cursor-pointer"
              >
                <Bell className="w-4 h-4 text-emerald-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 clean-card shadow-2xl rounded-2xl border border-border-main p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-border-main pb-2.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Thông Báo Ví</h4>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                          n.read
                            ? 'clean-card-subtle border-border-main opacity-70'
                            : 'bg-emerald-500/5 border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-text-primary">
                          <span className="flex items-center gap-1.5">
                            {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
                            {n.title}
                          </span>
                          <span className="text-[10px] text-text-secondary font-mono">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          {n.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Button with Full Name & Avatar */}
            <button
              id="btn-user-profile-modal"
              onClick={() => setShowUserModal(true)}
              title="Nhấp để xem Thông Tin Tài Khoản"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 border cursor-pointer hover:border-emerald-500 ${
                user?.role === 'ROLE_ADMIN'
                  ? 'bg-purple-500/20 text-purple-600 border-purple-500/30'
                  : 'clean-card-subtle text-text-primary border-border-main'
              }`}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-emerald-500/40" />
              ) : (
                <User className="w-4 h-4 text-emerald-500" />
              )}
              <span className="hidden sm:inline">{user?.fullName || (user?.role === 'ROLE_ADMIN' ? 'Admin' : 'User')}</span>
            </button>

            {/* Logout Button with Text */}
            <button
              id="btn-logout"
              onClick={handleLogout}
              title="Đăng xuất"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Menu di động"
              className="md:hidden p-2 rounded-lg border border-border-main hover:bg-bg-card-subtle text-text-primary transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-emerald-500" /> : <Menu className="w-4 h-4 text-emerald-500" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Links Dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border-main clean-card p-3 space-y-1.5 mx-4 mb-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            {user?.role === 'ROLE_ADMIN' ? (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                    isActive('/admin/dashboard')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-purple-500" />
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                    isActive('/admin/users')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-500" />
                  Quản Lý User
                </Link>
                <Link
                  to="/admin/transactions"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                    isActive('/admin/transactions')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                  Giao Dịch Hệ Thống
                </Link>
                <Link
                  to="/admin/audit-logs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                    isActive('/admin/audit-logs')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  Audit Logs
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowConfigModal(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-purple-600 transition flex items-center gap-2 cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  Cấu Hình Ví
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                    isActive('/')
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tổng Quan
                </Link>
                <Link
                  to="/topup"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                    isActive('/topup')
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                  Nạp Tiền
                </Link>
                <Link
                  to="/transfer"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                    isActive('/transfer')
                      ? 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Send className="w-4 h-4 text-indigo-500" />
                  Chuyển Tiền
                </Link>
                <Link
                  to="/withdraw"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                    isActive('/withdraw')
                      ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-purple-500" />
                  Rút Tiền
                </Link>
                <Link
                  to="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                    isActive('/history')
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <History className="w-4 h-4" />
                  Lịch Sử
                </Link>
              </>
            )}

            <Link
              to="/security"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                isActive('/security')
                  ? 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Mã PIN
            </Link>
          </nav>
        )}
      </header>

      {/* User Information Popup Modal */}
      <UserInfoModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />

      {/* Admin System Config Modal */}
      <SystemConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </>
  );
}
