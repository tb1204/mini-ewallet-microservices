import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { 
  Wallet, LayoutDashboard, Users, CreditCard, ArrowLeftRight, 
  FileText, Settings, LogOut, Sun, Moon, Menu, X
} from 'lucide-react';
import SystemConfigModal from '../modals/admin/SystemConfigModal';
import UserInfoModal from '../modals/UserInfoModal';
import PageSpinner from '../common/PageSpinner';

export default function AdminLayout() {
  const { logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Trigger loading effect when switching menu routes (~1s)
  useEffect(() => {
    setIsLoading(true);
    const endTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      clearTimeout(endTimer);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Tổng Quan Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Quản Lý Người Dùng', path: '/admin/users', icon: Users, badge: null },
    { label: 'Quản Lý Ví Điện Tử', path: '/admin/wallets', icon: CreditCard, badge: null },
    { label: 'Quản Lý Giao Dịch', path: '/admin/transactions', icon: ArrowLeftRight, badge: null },
    { label: 'Nhật Ký Hệ Thống', path: '/admin/audit-logs', icon: FileText, badge: 'LOGS' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex relative">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Left Vertical Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 clean-card border-r border-border-main flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 p-1 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <img src="/favicon.svg" alt="NovaPay Logo" className="w-full h-full rounded-[8px]" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight block text-emerald-600 dark:text-emerald-400">
                  NovaPay
                </span>
                <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {/* Theme Toggle Button in Header */}
              <button
                onClick={toggleTheme}
                title="Đổi giao diện Sáng / Tối"
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card-subtle transition cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:bg-bg-card-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-subtle'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-700/20 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Actions */}
        <div className="p-4 border-t border-border-main space-y-2">
          
          {/* Quick System Config Trigger */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="w-full px-3 py-2 rounded-lg text-xs font-medium clean-card-subtle hover:border-slate-400 border border-border-main flex items-center gap-2 text-text-secondary hover:text-text-primary transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Cấu hình</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 border border-transparent transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>

      </aside>

      {/* Main Content View Port (Right side) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Mobile Top Navigation Bar */}
        <header className="h-16 clean-header border-b border-border-main flex items-center justify-between px-4 lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg clean-card-subtle text-text-primary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">NovaPay Admin</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg clean-card-subtle text-text-primary"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </header>

        {/* Page Content Outlet with Transition Effect */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 flex flex-col">
          {isLoading ? (
            <PageSpinner message="Đang tải dữ liệu..." />
          ) : (
            <div className="animate-in fade-in duration-200">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      {/* System Modals */}
      <SystemConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
      <UserInfoModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

    </div>
  );
}
