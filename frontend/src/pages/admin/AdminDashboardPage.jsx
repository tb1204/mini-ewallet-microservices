import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CreditCard, ArrowLeftRight, DollarSign, TrendingUp, 
  UserPlus, Activity, ChevronRight, Loader2 
} from 'lucide-react';
import { userApi, walletApi, transactionApi } from '../../api';

/**
 * Admin Dashboard Overview Page
 * Computes live KPIs, 6-month transaction metrics, and user growth directly from database entities
 * (Identity, Wallet, Transaction Services).
 */
export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    totalWallets: 0,
    activeWallets: 0,
    lockedWallets: 0,
    totalActiveBalance: 0,
    totalTransactions: 0,
    successTransactions: 0,
    totalVolume: 0,
    totalRevenue: 0,
  });

  const [txChartData, setTxChartData] = useState([]);
  const [userGrowthChart, setUserGrowthChart] = useState([]);

  const parseDate = (dateVal) => {
    if (!dateVal) return null;
    if (Array.isArray(dateVal)) {
      return new Date(dateVal[0], dateVal[1] - 1, dateVal[2] || 1);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  };

  const extractList = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.result)) return res.result;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.content)) return res.content;
    if (res.result && Array.isArray(res.result.content)) return res.result.content;
    if (res.data && Array.isArray(res.data.content)) return res.data.content;
    return [];
  };

  const fetchDashboardMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersResult, walletsResult, txResult] = await Promise.allSettled([
        userApi.getAllUsers({ size: 200 }),
        walletApi.getAllWallets({ size: 200 }),
        transactionApi.getAllSystemTransactions({ size: 200 }),
      ]);

      const usersList = usersResult.status === 'fulfilled'
        ? extractList(usersResult.value)
        : [];

      const walletsList = walletsResult.status === 'fulfilled'
        ? extractList(walletsResult.value)
        : [];

      const txList = txResult.status === 'fulfilled'
        ? extractList(txResult.value)
        : [];

      // 1. KPI Calculations directly from database
      const totalUsers = usersList.length;
      const activeUsers = usersList.filter(u => u.isActive === 1 || u.isActive === true || u.status === 'ACTIVE').length;
      const lockedUsers = usersList.filter(u => u.isActive === 0 || u.isActive === false || u.status === 'BLOCKED' || u.status === 'LOCKED').length;

      const totalWallets = walletsList.length;
      const activeWallets = walletsList.filter(w => w.status === 'ACTIVE').length;
      const lockedWallets = walletsList.filter(w => w.status === 'LOCKED').length;
      const totalActiveBalance = walletsList
        .filter(w => w.status === 'ACTIVE')
        .reduce((acc, w) => acc + (Number(w.balance) || 0), 0);

      const totalTransactions = txList.length;
      const successTransactions = txList.filter(t => t.status === 'SUCCESS').length;
      const totalVolume = txList.reduce((acc, t) => {
        if (t.status === 'SUCCESS' || !t.status) {
          return acc + (Number(t.amount) || 0);
        }
        return acc;
      }, 0);

      const totalRevenue = txList.reduce((acc, t) => {
        const fee = Number(t.fee);
        if (!isNaN(fee) && fee > 0) return acc + fee;
        if ((t.serviceType === 'WITHDRAW' || t.type === 'WITHDRAW') && t.status === 'SUCCESS') {
          return acc + 5000;
        }
        return acc;
      }, 0);

      setStats({
        totalUsers,
        activeUsers,
        lockedUsers,
        totalWallets,
        activeWallets,
        lockedWallets,
        totalActiveBalance,
        totalTransactions,
        successTransactions,
        totalVolume,
        totalRevenue,
      });

      // 2. Real 6-Month Rolling Data Computation
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth(); // 0 to 11

      // Generate 6 consecutive rolling months
      const displayMonths = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonthIndex - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1 to 12

        displayMonths.push({
          year,
          month,
          name: `Tháng ${month}`
        });
      }

      // Compute per-month raw data from actual database records
      const computedTxData = displayMonths.map((m) => {
        const monthTxs = txList.filter((t) => {
          const d = parseDate(t.createdAt);
          if (!d) return false;
          return d.getFullYear() === m.year && (d.getMonth() + 1) === m.month;
        });
        const volume = monthTxs.length;

        return {
          month: m.name,
          volume,
          amountStr: `${volume} GD`
        };
      });

      const computedUserData = displayMonths.map((m) => {
        const newUsers = usersList.filter((u) => {
          const d = parseDate(u.createdAt);
          if (!d) return false;
          return d.getFullYear() === m.year && (d.getMonth() + 1) === m.month;
        });
        const count = newUsers.length;

        return {
          month: m.name,
          count
        };
      });

      setTxChartData(computedTxData);
      setUserGrowthChart(computedUserData);

    } catch (err) {
      console.error('Error fetching admin dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' VNĐ';

  const maxTxVolume = Math.max(1, ...txChartData.map(d => d.volume));
  const maxUserCount = Math.max(1, ...userGrowthChart.map(d => d.count));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Tổng Quan Hệ Thống
          </h1>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải dữ liệu...</span>
          </div>
        )}
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
            <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> {stats.activeUsers} Hoạt động
              </span>
              <span className="text-[var(--text-muted)] text-[11px]">
                {stats.lockedUsers} Đã khóa
              </span>
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
            <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {stats.totalWallets.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-emerald-600 font-medium">
                {stats.activeWallets} Đang hoạt động
              </span>
              <span className="text-[var(--text-muted)] text-[11px]" title="Tổng số dư các ví đang hoạt động">
                {formatVND(stats.totalActiveBalance)}
              </span>
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
            <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {stats.totalTransactions.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-indigo-600 font-medium">
                {stats.successTransactions} Thành công
              </span>
              <span className="text-[var(--text-muted)] text-[11px]">
                {formatVND(stats.totalVolume)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Revenue */}
        <div className="clean-card p-5 rounded-xl border border-[var(--border-main)] hover:border-amber-500 transition space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Doanh thu</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 tracking-tight">
              {formatVND(stats.totalRevenue)}
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
              Biểu đồ giao dịch
            </h2>
            <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {stats.totalTransactions} Tổng GD
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {txChartData.map((item, idx) => {
              const heightPercent = maxTxVolume > 0 && item.volume > 0
                ? Math.max(4, Math.round((item.volume / maxTxVolume) * 100))
                : 0;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-secondary)] font-sans">{item.month}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{item.amountStr}</span>
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
              Biểu đồ người dùng mới
            </h2>
            <span className="text-xs font-mono font-medium text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {stats.totalUsers} Người dùng
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {userGrowthChart.map((item, idx) => {
              const heightPercent = maxUserCount > 0 && item.count > 0
                ? Math.max(4, Math.round((item.count / maxUserCount) * 100))
                : 0;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-secondary)] font-sans">{item.month}</span>
                    <span className="font-semibold text-blue-600">+{item.count} người mới</span>
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
