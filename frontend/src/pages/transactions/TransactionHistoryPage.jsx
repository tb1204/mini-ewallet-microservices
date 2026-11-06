import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/useWalletStore';
import { 
  History, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Send, 
  CheckCircle2, 
  Eye, 
  X, 
  Copy, 
  Check, 
  Clock, 
  XCircle, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Receipt,
  Building2
} from 'lucide-react';

export default function TransactionHistoryPage() {
  const { transactions, fetchTransactions, isLoading, myWallet } = useWalletStore();
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const currentWalletId = myWallet?.id;

  // Filter transactions
  const filteredTx = (transactions || []).filter((tx) => {
    const txType = tx.serviceType || tx.type;
    if (filterType !== 'ALL' && txType !== filterType) return false;
    if (filterStatus !== 'ALL' && tx.status !== filterStatus) return false;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const code = (tx.transactionCode || '').toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      if (!code.includes(kw) && !desc.includes(kw)) return false;
    }
    return true;
  });

  // Calculate quick stats
  const totalIn = (transactions || []).reduce((acc, tx) => {
    const isTopup = (tx.serviceType === 'TOPUP' || tx.type === 'TOPUP');
    const isReceive = tx.receiverWalletId && currentWalletId && tx.receiverWalletId === currentWalletId && tx.senderWalletId !== currentWalletId;
    if ((isTopup || isReceive) && tx.status === 'SUCCESS') {
      return acc + (parseFloat(tx.amount) || 0);
    }
    return acc;
  }, 0);

  const totalOut = (transactions || []).reduce((acc, tx) => {
    const isWithdraw = (tx.serviceType === 'WITHDRAW' || tx.type === 'WITHDRAW');
    const isSent = (tx.serviceType === 'TRANSFER' || tx.type === 'TRANSFER');
    if ((isWithdraw || isSent) && tx.status === 'SUCCESS') {
      return acc + (parseFloat(tx.amount) || 0);
    }
    return acc;
  }, 0);

  const formatMoney = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const handleCopy = (text, type = 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedTrace(true);
      setTimeout(() => setCopiedTrace(false), 2000);
    }
  };

  // Helper to determine if transaction is incoming or outgoing
  const isIncoming = (tx) => {
    const txType = tx.serviceType || tx.type;
    if (txType === 'TOPUP') return true;
    if (currentWalletId && tx.receiverWalletId === currentWalletId && tx.senderWalletId !== currentWalletId) return true;
    return false;
  };

  const getTxTypeBadge = (tx) => {
    const txType = tx.serviceType || tx.type;
    switch (txType) {
      case 'TOPUP':
        return {
          label: 'Nạp Tiền',
          icon: <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />,
          color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        };
      case 'WITHDRAW':
        return {
          label: 'Rút Tiền',
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-purple-500" />,
          color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        };
      case 'TRANSFER':
        return {
          label: 'Chuyển Tiền',
          icon: <Send className="w-3.5 h-3.5 text-indigo-500" />,
          color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
        };
      default:
        return {
          label: txType || 'Dịch Vụ',
          icon: <Receipt className="w-3.5 h-3.5 text-slate-500" />,
          color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="clean-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Lịch Sử Giao Dịch</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Theo dõi biến động số dư và chi tiết các giao dịch nạp tiền, chuyển tiền, rút tiền.
            </p>
          </div>
        </div>

        {/* <button
          onClick={() => fetchTransactions()}
          disabled={isLoading}
          className="p-2.5 clean-card-subtle hover:border-emerald-500 transition rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Làm mới lịch sử"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          <span className="hidden sm:inline">Làm Mới</span>
        </button> */}
      </div>

      {/* 2. Quick Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Money In */}
        <div className="clean-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Tổng Tiền Vào</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            +{formatMoney(totalIn)}
          </div>
          {/* <p className="text-[11px] text-[var(--text-secondary)]">
            Bao gồm nạp tiền và tiền nhận từ người khác
          </p> */}
        </div>

        {/* Total Money Out */}
        <div className="clean-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Tổng Tiền Ra</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            -{formatMoney(totalOut)}
          </div>
          {/* <p className="text-[11px] text-[var(--text-secondary)]">
            Bao gồm chuyển tiền và rút về ngân hàng
          </p> */}
        </div>

        {/* Total Count */}
        <div className="clean-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Tổng Giao Dịch</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)] font-mono">
            {(transactions || []).length} <span className="text-sm font-normal text-[var(--text-secondary)]">giao dịch</span>
          </div>
          {/* <p className="text-[11px] text-[var(--text-secondary)]">
            Được lưu vết bảo mật trên hệ thống
          </p> */}
        </div>

      </div>

      {/* 3. Filter & Search Bar */}
      <div className="clean-card p-4 flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo mã GD hoặc mô tả..."
              className="w-full clean-input pl-9 pr-3.5 py-2 text-xs"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="clean-input px-3 py-2 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả loại giao dịch</option>
            <option value="TOPUP">Nạp tiền (Top-up)</option>
            <option value="TRANSFER">Chuyển tiền (Transfer)</option>
            <option value="WITHDRAW">Rút tiền (Withdraw)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="clean-input px-3 py-2 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công (SUCCESS)</option>
            <option value="PENDING">Đang xử lý (PENDING)</option>
            <option value="FAILED">Thất bại (FAILED)</option>
          </select>
        </div>

        <span className="text-xs text-[var(--text-secondary)] font-mono">
          Hiển thị: <strong className="text-purple-600 dark:text-purple-400">{filteredTx.length}</strong> / {(transactions || []).length} giao dịch
        </span>
      </div>

      {/* 4. Table / Empty State / Shimmer Loading */}
      <div className="clean-card overflow-hidden">
        {isLoading ? (
          /* Shimmer Skeleton Loading */
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-[var(--card-subtle)] rounded w-1/4 mb-3"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)]">
                <div className="h-4 bg-[var(--card-subtle)] rounded w-1/5"></div>
                <div className="h-6 bg-[var(--card-subtle)] rounded-lg w-24"></div>
                <div className="h-4 bg-[var(--card-subtle)] rounded w-1/6"></div>
                <div className="h-4 bg-[var(--card-subtle)] rounded w-1/4"></div>
                <div className="h-5 bg-[var(--card-subtle)] rounded-full w-20"></div>
                <div className="h-4 bg-[var(--card-subtle)] rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : filteredTx.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[var(--card-subtle)] text-[var(--text-secondary)] flex items-center justify-center mx-auto border border-[var(--border-subtle)]">
              <Receipt className="w-8 h-8 opacity-60" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Chưa có giao dịch nào phù hợp</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1">
                Các giao dịch Nạp tiền, Chuyển tiền và Rút tiền của bạn sẽ được lưu vết và hiển thị đầy đủ tại đây.
              </p>
            </div>
          </div>
        ) : (
          /* Transaction Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-primary)]">
              <thead className="bg-[var(--table-header-bg)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-main)]">
                <tr>
                  <th className="p-3.5">Mã Giao Dịch</th>
                  <th className="p-3.5">Loại</th>
                  <th className="p-3.5">Số Tiền</th>
                  <th className="p-3.5">Mô Tả Giao Dịch</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5">Thời Gian</th>
                  <th className="p-3.5 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filteredTx.map((tx) => {
                  const badge = getTxTypeBadge(tx);
                  const incoming = isIncoming(tx);

                  return (
                    <tr key={tx.id} className="hover:bg-[var(--table-hover-bg)] transition">
                      
                      {/* Code */}
                      <td className="p-3.5 font-mono font-bold text-xs">
                        {tx.transactionCode}
                      </td>

                      {/* Type Badge */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 font-semibold text-[11px] px-2.5 py-1 rounded-lg border ${badge.color}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 font-mono font-bold text-sm">
                        <span className={incoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}>
                          {incoming ? '+' : '-'}{formatMoney(tx.amount)}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="p-3.5 text-[var(--text-secondary)] max-w-xs truncate">
                        {tx.description || 'Không có ghi chú'}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5 ${
                          tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {tx.status === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {tx.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                          {tx.status === 'FAILED' && <XCircle className="w-3.5 h-3.5" />}
                          <span>{tx.status === 'SUCCESS' ? 'Thành công' : tx.status === 'PENDING' ? 'Đang xử lý' : 'Thất bại'}</span>
                        </span>
                      </td>

                      {/* Time */}
                      <td className="p-3.5 font-mono text-[11px] text-[var(--text-secondary)]">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </td>

                      {/* Detail Action */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedTx(tx);
                            setShowTechDetails(false);
                          }}
                          className="p-1.5 rounded-lg clean-card-subtle hover:border-purple-500 transition text-[var(--text-secondary)] hover:text-purple-600 cursor-pointer"
                          title="Xem biên lai chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Transaction Detail Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-sm">
          <div className="clean-card p-6 sm:p-8 max-w-md w-full relative shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center space-y-2 pt-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Biên Lai Giao Dịch</h3>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">#{selectedTx.transactionCode}</p>
              </div>
            </div>

            {/* Big Amount */}
            <div className="text-center py-2">
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                isIncoming(selectedTx) ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'
              }`}>
                {isIncoming(selectedTx) ? '+' : '-'}{formatMoney(selectedTx.amount)}
              </div>
            </div>

            {/* Receipt Details Breakdown */}
            <div className="clean-card-subtle p-4 rounded-xl space-y-2.5 text-xs">
              
              <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">Loại giao dịch:</span>
                <span className="font-bold flex items-center gap-1">
                  {getTxTypeBadge(selectedTx).icon}
                  {getTxTypeBadge(selectedTx).label}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">Trạng thái:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedTx.status === 'SUCCESS' ? 'Thành công' : selectedTx.status}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">Phí dịch vụ:</span>
                <span className="text-emerald-600 font-semibold">Miễn phí (0 VNĐ)</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">Thời gian thực hiện:</span>
                <span className="font-mono text-[var(--text-secondary)]">
                  {new Date(selectedTx.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="py-1">
                <span className="text-[var(--text-secondary)] block mb-1">Lời nhắn / Nội dung:</span>
                <p className="font-medium text-[var(--text-primary)] bg-[var(--card-bg)] p-2 rounded-lg border border-[var(--border-subtle)]">
                  {selectedTx.description || 'Không có lời nhắn'}
                </p>
              </div>

            </div>

            {/* Collapsible Technical Details (For Dev / Audit) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTechDetails(!showTechDetails)}
                className="w-full text-left text-[11px] text-[var(--text-secondary)] hover:text-purple-600 flex items-center justify-between py-1 transition"
              >
                <span>Thông tin kỹ thuật & đối soát (Trace ID, Idempotency)</span>
                {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTechDetails && (
                <div className="mt-2 p-3 rounded-xl clean-card-subtle space-y-2 text-[11px] font-mono animate-in fade-in duration-150">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Idempotency Key:</span>
                      <button
                        onClick={() => handleCopy(selectedTx.idempotencyKey, 'key')}
                        className="text-purple-500 hover:underline flex items-center gap-1"
                      >
                        {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey ? 'Đã copy' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-slate-500 break-all">{selectedTx.idempotencyKey || 'N/A'}</div>
                  </div>

                  <div className="space-y-0.5 pt-1 border-t border-[var(--border-subtle)]">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Mã kiểm toán (UUID):</span>
                    </div>
                    <div className="text-slate-500 break-all">{selectedTx.id}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-purple-600/20"
            >
              Đóng Biên Lai
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
