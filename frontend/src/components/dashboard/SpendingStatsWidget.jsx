import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useWalletStore } from '../../store/useWalletStore';

export default function SpendingStatsWidget() {
  const { transactions, wallet, fetchTransactions, fetchMyWallet } = useWalletStore();
  const [selectedMonthId, setSelectedMonthId] = useState(null);

  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      fetchTransactions();
    }
    if (!wallet) {
      fetchMyWallet();
    }
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatCompact = (val) => {
    if (!val || val === 0) return '0 đ';
    if (val >= 1_000_000_000) {
      const b = (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
      return `${b}B`;
    }
    if (val >= 1_000_000) {
      const m = (val / 1_000_000).toFixed(1).replace(/\.0$/, '');
      return `${m}M`;
    }
    if (val >= 1_000) {
      const k = (val / 1_000).toFixed(0);
      return `${k}K`;
    }
    return `${val} đ`;
  };

  const parseTxDate = (createdAt) => {
    if (!createdAt) return null;
    if (Array.isArray(createdAt)) {
      return new Date(createdAt[0], createdAt[1] - 1, createdAt[2] || 1);
    }
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? null : d;
  };

  const currentWalletId = wallet?.id;

  const isIncoming = (tx) => {
    if (!tx) return false;
    const txType = tx.serviceType || tx.type;
    if (txType === 'TOPUP') return true;
    if (tx.description && tx.description.toLowerCase().includes('rút tiền từ sổ tiết kiệm')) return true;
    if (currentWalletId && tx.receiverWalletId === currentWalletId && tx.senderWalletId !== currentWalletId) return true;
    return false;
  };

  // 6-month statistical data computed dynamically from real database transactions
  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth(); // 0 to 11

    // Build 7 rolling months: 6 months ago (index 0) up to current month (index 6)
    const rawMonths = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIndex - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      const isCurrent = i === 0;

      rawMonths.push({
        year,
        month,
        id: `m_${year}_${month}`,
        shortLabel: isCurrent ? `Tháng ${month}` : `T${month}`,
        monthName: isCurrent ? `Tháng ${month} (Hiện tại)` : `Tháng ${month}`,
        daysInMonth,
        isCurrent
      });
    }

    const txList = Array.isArray(transactions) ? transactions : [];

    // Compute metrics for all 7 raw months
    const computed = rawMonths.map((m) => {
      // Find all successful spending transactions matching this month & year
      const monthTxList = txList.filter((tx) => {
        if (!tx || tx.status !== 'SUCCESS') return false;
        if (isIncoming(tx)) return false;
        const d = parseTxDate(tx.createdAt);
        if (!d) return false;
        return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
      });

      const totalAmount = monthTxList.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const txCount = monthTxList.length;

      // Group into categories
      let p2pAmount = 0;
      let billAmount = 0;
      let dataAmount = 0;
      let savingsAmount = 0;
      let otherAmount = 0;

      monthTxList.forEach((tx) => {
        const type = tx.serviceType || tx.type;
        const amt = parseFloat(tx.amount) || 0;
        if (type === 'TRANSFER') {
          p2pAmount += amt;
        } else if (type === 'UTILITY_BILL') {
          billAmount += amt;
        } else if (type === 'UTILITY_DATA') {
          dataAmount += amt;
        } else if (type === 'SAVINGS' || type === 'INSURANCE') {
          savingsAmount += amt;
        } else {
          otherAmount += amt;
        }
      });

      const categories = [
        {
          name: 'Chuyển tiền P2P',
          amount: p2pAmount,
          percentage: totalAmount > 0 ? Math.round((p2pAmount / totalAmount) * 100) : 0,
          color: 'bg-emerald-600'
        },
        {
          name: 'Hóa đơn Điện & Nước',
          amount: billAmount,
          percentage: totalAmount > 0 ? Math.round((billAmount / totalAmount) * 100) : 0,
          color: 'bg-amber-500'
        },
        {
          name: 'Điện thoại & Data 4G',
          amount: dataAmount,
          percentage: totalAmount > 0 ? Math.round((dataAmount / totalAmount) * 100) : 0,
          color: 'bg-blue-600'
        },
        {
          name: 'Tiết kiệm & Bảo hiểm',
          amount: savingsAmount,
          percentage: totalAmount > 0 ? Math.round((savingsAmount / totalAmount) * 100) : 0,
          color: 'bg-purple-600'
        }
      ];

      if (otherAmount > 0) {
        categories.push({
          name: 'Rút tiền & Khác',
          amount: otherAmount,
          percentage: totalAmount > 0 ? Math.round((otherAmount / totalAmount) * 100) : 0,
          color: 'bg-rose-500'
        });
      }

      return {
        ...m,
        amount: totalAmount,
        displayAmount: formatCompact(totalAmount),
        txCount,
        categories
      };
    });

    // The 6 displayed months are from index 1 to 6; prevAmount comes from index - 1
    const final6Months = [];
    for (let k = 1; k < computed.length; k++) {
      final6Months.push({
        ...computed[k],
        prevAmount: computed[k - 1].amount
      });
    }

    return final6Months;
  }, [transactions, wallet]);

  // Active selected data
  const currentMonthItem = monthlyData.find((m) => m.isCurrent) || monthlyData[monthlyData.length - 1];
  const activeMonthId = selectedMonthId && monthlyData.some((m) => m.id === selectedMonthId)
    ? selectedMonthId
    : currentMonthItem?.id;

  const selectedData = monthlyData.find((m) => m.id === activeMonthId) || currentMonthItem || {
    id: 'default',
    monthName: 'Tháng này',
    shortLabel: 'Tháng này',
    displayAmount: '0 đ',
    amount: 0,
    prevAmount: 0,
    txCount: 0,
    daysInMonth: 30,
    categories: []
  };

  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 0);

  let diffPercent = '0.0';
  let isReduced = false;
  let isSame = true;

  if (selectedData.prevAmount > 0) {
    const diff = selectedData.amount - selectedData.prevAmount;
    diffPercent = Math.abs((diff / selectedData.prevAmount) * 100).toFixed(1);
    isReduced = diff < 0;
    isSame = diff === 0;
  } else if (selectedData.amount > 0) {
    diffPercent = '100.0';
    isReduced = false;
    isSame = false;
  } else {
    diffPercent = '0.0';
    isReduced = false;
    isSame = true;
  }

  return (
    <div className="clean-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-main pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 border border-emerald-600/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight">Thống Kê Chi Tiêu</h2>
            <p className="text-xs text-text-secondary">
              Báo cáo biến động chi tiêu thực tế hàng tháng
            </p>
          </div>
        </div>
      </div>

      {/* 6 Month Selection Tabs */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          Chọn tháng xem báo cáo:
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
          {monthlyData.map((m) => {
            const isSelected = m.id === activeMonthId;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMonthId(m.id)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-bg-card-subtle text-text-secondary hover:text-text-primary border-border-main hover:border-slate-300'
                }`}
              >
                <span className="text-xs">{m.shortLabel}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-100' : 'text-text-secondary'}`}>
                  {m.displayAmount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Month Detailed Stats Cards */}
      <div className="p-5 rounded-xl bg-bg-card-subtle border border-border-main space-y-6">
        <div className="flex items-center justify-between border-b border-border-main pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-text-primary">
              Báo Cáo Chi Tiêu {selectedData.monthName}
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-md bg-emerald-600/10 text-emerald-600 border border-emerald-600/20">
            {selectedData.txCount} giao dịch
          </span>
        </div>

        {/* 3 Metric Cards for Selected Month */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Total Spending */}
          <div className="clean-card p-4 rounded-xl space-y-1 border border-border-main">
            <span className="text-xs text-text-secondary font-medium">
              Tổng Chi Tiêu ({selectedData.shortLabel})
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight">
              {formatCurrency(selectedData.amount)}
            </div>
            <div className="flex items-center gap-1.5 text-xs pt-1">
              {isSame ? (
                <span className="inline-flex items-center gap-0.5 text-slate-500 font-semibold bg-slate-500/10 px-2 py-0.5 rounded">
                  0%
                </span>
              ) : isReduced ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold bg-emerald-600/10 px-2 py-0.5 rounded">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Giảm {diffPercent}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-rose-600 font-semibold bg-rose-600/10 px-2 py-0.5 rounded">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Tăng +{diffPercent}%
                </span>
              )}
              <span className="text-[11px] text-text-secondary">so với tháng trước</span>
            </div>
          </div>

          {/* Previous Month Comparison */}
          <div className="clean-card p-4 rounded-xl space-y-1 border border-border-main">
            <span className="text-xs text-text-secondary font-medium">Chi Tiêu Tháng Trước</span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight">
              {formatCurrency(selectedData.prevAmount)}
            </div>
            <p className="text-[11px] text-text-secondary pt-1">
              {selectedData.amount > selectedData.prevAmount
                ? `Tiêu nhiều hơn ${formatCurrency(selectedData.amount - selectedData.prevAmount)}`
                : selectedData.amount < selectedData.prevAmount
                ? `Tiết kiệm được ${formatCurrency(selectedData.prevAmount - selectedData.amount)}`
                : `Không đổi so với tháng trước`}
            </p>
          </div>

          {/* Daily Average */}
          <div className="clean-card p-4 rounded-xl space-y-1 border border-border-main">
            <span className="text-xs text-text-secondary font-medium">TB Chi Tiêu / Ngày</span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight">
              {formatCurrency(Math.round(selectedData.amount / (selectedData.daysInMonth || 30)))}
            </div>
            <p className="text-[11px] text-text-secondary pt-1">
              Tính trên bình quân {selectedData.daysInMonth || 30} ngày
            </p>
          </div>
        </div>

        {/* Visual Real-world Chart & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Realistic Bar Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Tương quan chi tiêu 6 tháng
              </span>
            </div>

            {/* Clean Chart Container with Gridlines */}
            <div className="h-44 w-full pt-6 pb-1 px-2 flex items-end justify-between gap-3 relative border-b border-slate-200 dark:border-slate-700">
              {/* Background horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
              </div>

              {monthlyData.map((d) => {
                const heightPercent = maxAmount > 0 ? Math.round((d.amount / maxAmount) * 100) : 0;
                const isThisSelected = d.id === activeMonthId;

                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedMonthId(d.id)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-10"
                  >
                    {/* Amount Text Above Bar */}
                    <span
                      className={`text-[10px] font-mono mb-1 transition ${
                        isThisSelected
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-text-secondary group-hover:text-text-primary'
                      }`}
                    >
                      {d.displayAmount}
                    </span>

                    {/* Realistic Bar Column */}
                    <div className="w-full max-w-7 h-full flex items-end justify-center">
                      <div
                        style={{ height: `${heightPercent > 0 ? Math.max(heightPercent, 6) : 0}%` }}
                        className={`w-full rounded-t-md transition-all duration-200 ${
                          isThisSelected
                            ? 'bg-emerald-600 dark:bg-emerald-500 shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                        }`}
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`mt-2 text-[11px] font-medium transition ${
                        isThisSelected
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-text-secondary group-hover:text-text-primary'
                      }`}
                    >
                      {d.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Phân bổ danh mục ({selectedData.shortLabel})
            </span>

            <div className="space-y-3 pt-1">
              {selectedData.categories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-sm ${cat.color}`} />
                      {cat.name}
                    </span>
                    <span className="font-mono text-text-secondary">
                      {formatCurrency(cat.amount)} ({cat.percentage}%)
                    </span>
                  </div>
                  {/* Standard clean progress bar */}
                  <div className="w-full h-2 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className={`h-full rounded-md ${cat.color} transition-all duration-300`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
