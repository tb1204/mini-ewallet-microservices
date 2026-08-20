import { useState } from 'react';
import { BarChart3, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function SpendingStatsWidget() {
  // 6 recent months mock statistics data
  const monthlyData = [
    {
      id: 't3',
      monthName: 'Tháng 3',
      buttonLabel: 'Tháng 3',
      shortLabel: 'T3',
      displayAmount: '3.1M',
      amount: 3100000,
      prevAmount: 2800000,
      txCount: 8,
      isCurrent: false,
      categories: [
        { name: 'Chuyển tiền P2P', amount: 1395000, percentage: 45, color: 'bg-emerald-600' },
        { name: 'Hóa đơn Điện & Nước', amount: 775000, percentage: 25, color: 'bg-amber-500' },
        { name: 'Điện thoại & Data 4G', amount: 558000, percentage: 18, color: 'bg-blue-600' },
        { name: 'Tiết kiệm & Bảo hiểm', amount: 372000, percentage: 12, color: 'bg-purple-600' }
      ]
    },
    {
      id: 't4',
      monthName: 'Tháng 4',
      buttonLabel: 'Tháng 4',
      shortLabel: 'T4',
      displayAmount: '4.8M',
      amount: 4800000,
      prevAmount: 3100000,
      txCount: 14,
      isCurrent: false,
      categories: [
        { name: 'Chuyển tiền P2P', amount: 2400000, percentage: 50, color: 'bg-emerald-600' },
        { name: 'Hóa đơn Điện & Nước', amount: 960000, percentage: 20, color: 'bg-amber-500' },
        { name: 'Điện thoại & Data 4G', amount: 720000, percentage: 15, color: 'bg-blue-600' },
        { name: 'Tiết kiệm & Bảo hiểm', amount: 720000, percentage: 15, color: 'bg-purple-600' }
      ]
    },
    {
      id: 't5',
      monthName: 'Tháng 5',
      buttonLabel: 'Tháng 5',
      shortLabel: 'T5',
      displayAmount: '2.9M',
      amount: 2900000,
      prevAmount: 4800000,
      txCount: 7,
      isCurrent: false,
      categories: [
        { name: 'Chuyển tiền P2P', amount: 1160000, percentage: 40, color: 'bg-emerald-600' },
        { name: 'Hóa đơn Điện & Nước', amount: 870000, percentage: 30, color: 'bg-amber-500' },
        { name: 'Điện thoại & Data 4G', amount: 580000, percentage: 20, color: 'bg-blue-600' },
        { name: 'Tiết kiệm & Bảo hiểm', amount: 290000, percentage: 10, color: 'bg-purple-600' }
      ]
    },
    {
      id: 't6',
      monthName: 'Tháng 6',
      buttonLabel: 'Tháng 6',
      shortLabel: 'T6',
      displayAmount: '5.2M',
      amount: 5200000,
      prevAmount: 2900000,
      txCount: 16,
      isCurrent: false,
      categories: [
        { name: 'Chuyển tiền P2P', amount: 2444000, percentage: 47, color: 'bg-emerald-600' },
        { name: 'Hóa đơn Điện & Nước', amount: 1144000, percentage: 22, color: 'bg-amber-500' },
        { name: 'Điện thoại & Data 4G', amount: 832000, percentage: 16, color: 'bg-blue-600' },
        { name: 'Tiết kiệm & Bảo hiểm', amount: 780000, percentage: 15, color: 'bg-purple-600' }
      ]
    },
    {
      id: 't7',
      monthName: 'Tháng 7',
      buttonLabel: 'Tháng 7',
      shortLabel: 'T7',
      displayAmount: '4.4M',
      amount: 4380000,
      prevAmount: 5200000,
      txCount: 12,
      isCurrent: false,
      categories: [
        { name: 'Chuyển tiền P2P', amount: 1971000, percentage: 45, color: 'bg-emerald-600' },
        { name: 'Hóa đơn Điện & Nước', amount: 1095000, percentage: 25, color: 'bg-amber-500' },
        { name: 'Điện thoại & Data 4G', amount: 788400, percentage: 18, color: 'bg-blue-600' },
        { name: 'Tiết kiệm & Bảo hiểm', amount: 525600, percentage: 12, color: 'bg-purple-600' }
      ]
    },
    {
      id: 't8',
      monthName: 'Tháng 8 (Hiện tại)',
      buttonLabel: 'Tháng 8 (Hiện tại)',
      shortLabel: 'Tháng 8',
      displayAmount: '3.9M',
      amount: 3850000,
      prevAmount: 4380000,
      txCount: 9,
      isCurrent: true,
      categories: [
        { name: 'Chuyển tiền P2P', amount: 1732500, percentage: 45, color: 'bg-emerald-600' },
        { name: 'Hóa đơn Điện & Nước', amount: 962500, percentage: 25, color: 'bg-amber-500' },
        { name: 'Điện thoại & Data 4G', amount: 693000, percentage: 18, color: 'bg-blue-600' },
        { name: 'Tiết kiệm & Bảo hiểm', amount: 462000, percentage: 12, color: 'bg-purple-600' }
      ]
    }
  ];

  // Default selected month is dynamically resolved (current month or latest item)
  const [selectedMonthId, setSelectedMonthId] = useState(
    () => monthlyData.find((m) => m.isCurrent)?.id || monthlyData[monthlyData.length - 1]?.id
  );

  // Active selected data
  const selectedData = monthlyData.find((m) => m.id === selectedMonthId) || monthlyData[monthlyData.length - 1];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const maxAmount = Math.max(...monthlyData.map((d) => d.amount));
  const diffPercent = (((selectedData.amount - selectedData.prevAmount) / selectedData.prevAmount) * 100).toFixed(1);
  const isReduced = selectedData.amount < selectedData.prevAmount;

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
            const isSelected = m.id === selectedMonthId;
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
              {isReduced ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold bg-emerald-600/10 px-2 py-0.5 rounded">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Giảm {Math.abs(diffPercent)}%
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
                : `Tiết kiệm được ${formatCurrency(selectedData.prevAmount - selectedData.amount)}`}
            </p>
          </div>

          {/* Daily Average */}
          <div className="clean-card p-4 rounded-xl space-y-1 border border-border-main">
            <span className="text-xs text-text-secondary font-medium">TB Chi Tiêu / Ngày</span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight">
              {formatCurrency(Math.round(selectedData.amount / 30))}
            </div>
            <p className="text-[11px] text-text-secondary pt-1">
              Tính trên bình quân 30 ngày
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
                const heightPercent = Math.round((d.amount / maxAmount) * 100);
                const isThisSelected = d.id === selectedMonthId;

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

                    {/* Realistic Bar Column (No Capsule Overflow) */}
                    <div className="w-full max-w-7 h-full flex items-end justify-center">
                      <div
                        style={{ height: `${heightPercent}%` }}
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
