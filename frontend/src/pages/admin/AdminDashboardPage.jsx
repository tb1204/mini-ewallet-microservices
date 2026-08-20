import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CreditCard, ArrowLeftRight, DollarSign, TrendingUp, 
  UserPlus, Activity, ChevronRight
} from 'lucide-react';

/**
 * Admin Dashboard Overview Page
 * Displays KPI cards, 6-month analytics charts, and quick navigation shortcuts.
 */
export default function AdminDashboardPage() {
  const navigate = useNavigate();

  // Mock chart data - 6-month transaction volume
  const transactionChartData = [
    { month: 'Tháng 3', volume: 18500, amountStr: '18.5K GD', growth: '+12%' },
    { month: 'Tháng 4', volume: 22100, amountStr: '22.1K GD', growth: '+19%' },
    { month: 'Tháng 5', volume: 25400, amountStr: '25.4K GD', growth: '+15%' },
    { month: 'Tháng 6', volume: 27800, amountStr: '27.8K GD', growth: '+9%' },
    { month: 'Tháng 7', volume: 29200, amountStr: '29.2K GD', growth: '+5%' },
    { month: 'Tháng 8 (Hiện tại)', volume: 29000, amountStr: '29.0K GD', growth: '+8%' },
  ];

  // Mock chart data - 6-month user registration growth
  const userGrowthData = [
    { month: 'Tháng 3', count: 120, totalUsers: 650 },
    { month: 'Tháng 4', count: 180, totalUsers: 830 },
    { month: 'Tháng 5', count: 210, totalUsers: 1040 },
    { month: 'Tháng 6', count: 90, totalUsers: 1130 },
    { month: 'Tháng 7', count: 40, totalUsers: 1170 },
    { month: 'Tháng 8', count: 30, totalUsers: 1200 },
  ];

  // Max values for chart percentage calculation
  const maxTxVolume = Math.max(...transactionChartData.map(d => d.volume));
  const maxUserCount = Math.max(...userGrowthData.map(d => d.count));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header title */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Tổng Quan Hệ Thống
        </h1>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Total Users */}
        <div 
          onClick={() => navigate('/admin/users')}
          className="clean-card p-5 rounded-xl border border-[var(--border-main)] hover:border-blue-500 transition cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Tổng Người Dùng</span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">1,200</div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +12% tháng này
              </span>
              <span className="text-[var(--text-muted)] text-[11px]">1,150 Hoạt động</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Wallets */}
        <div 
          onClick={() => navigate('/admin/wallets')}
          className="clean-card p-5 rounded-xl border border-[var(--border-main)] hover:border-emerald-500 transition cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Tổng Số Ví</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">1,180</div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-emerald-600 font-medium">98.3% Mở Ví</span>
              <span className="text-[var(--text-muted)] text-[11px]">20 Khóa Ví</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Transactions */}
        <div 
          onClick={() => navigate('/admin/transactions')}
          className="clean-card p-5 rounded-xl border border-[var(--border-main)] hover:border-indigo-500 transition cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Tổng Giao Dịch</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">152,000</div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-indigo-600 font-medium">Tổng $4.2M</span>
              <span className="text-[var(--text-muted)] text-[11px]">Thành công 99.9%</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Revenue */}
        <div className="clean-card p-5 rounded-xl border border-[var(--border-main)] hover:border-amber-500 transition space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Tổng Doanh Thu</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 tracking-tight">$2,500</div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +18.5%
              </span>
              <span className="text-[var(--text-muted)] text-[11px]">~52.5 Tr VNĐ</span>
            </div>
          </div>
        </div>

      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Monthly Transaction Volume */}
        <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
              Biểu Đồ Giao Dịch (Số lượng giao dịch 6 tháng)
            </h2>
            <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              152K Tổng GD
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {transactionChartData.map((item, idx) => {
              const heightPercent = Math.round((item.volume / maxTxVolume) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-secondary)] font-sans">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{item.amountStr}</span>
                      <span className="text-[10px] text-emerald-600 font-medium">{item.growth}</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${heightPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: User Account Registration Growth */}
        <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Biểu Đồ Người Dùng (Tốc độ mở tài khoản mới)
            </h2>
            <span className="text-xs font-mono font-medium text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              1,200 Người Dùng
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {userGrowthData.map((item, idx) => {
              const heightPercent = Math.round((item.count / maxUserCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-secondary)] font-sans">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600">+{item.count} người mới</span>
                      <span className="text-[10px] text-[var(--text-muted)]">(Lũy kế: {item.totalUsers})</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${heightPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        
        <div 
          onClick={() => navigate('/admin/users')}
          className="clean-card p-4 rounded-xl border border-[var(--border-main)] hover:border-blue-500 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-semibold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-[var(--text-primary)]">Quản Lý Người Dùng</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Xem danh sách, Tìm kiếm & Khóa/Mở khóa User</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition" />
        </div>

        <div 
          onClick={() => navigate('/admin/wallets')}
          className="clean-card p-4 rounded-xl border border-[var(--border-main)] hover:border-emerald-500 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-semibold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-[var(--text-primary)]">Quản Lý Ví Điện Tử</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Xem số dư ví thực tế & Khóa/Mở khóa Ví</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition" />
        </div>

        <div 
          onClick={() => navigate('/admin/audit-logs')}
          className="clean-card p-4 rounded-xl border border-[var(--border-main)] hover:border-amber-500 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-semibold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-[var(--text-primary)]">Nhật Ký Hệ Thống</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Truy vết hành động bảo mật & sự kiện Audit Log</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition" />
        </div>

      </div>

    </div>
  );
}
