import React, { useState } from 'react';
import { useWalletStore } from '../../store/useWalletStore';
import { History, Filter, ArrowDownLeft, ArrowUpRight, Send, CheckCircle2, Eye, X, Copy, Check } from 'lucide-react';

export default function TransactionHistoryPage() {
  const { transactions } = useWalletStore();
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const filteredTx = transactions.filter((tx) => {
    if (filterType !== 'ALL' && tx.type !== filterType) return false;
    if (filterStatus !== 'ALL' && tx.status !== filterStatus) return false;
    return true;
  });

  const formatMoney = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="clean-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            Lịch Sử Giao Dịch (`transaction_db`)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Tra cứu biến động tài sản, mã Idempotency Key chống trùng lặp và Trace ID Zipkin.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="clean-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-xs font-semibold">Bộ Lọc:</span>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="clean-input px-3 py-1.5 text-xs"
          >
            <option value="ALL">Tất cả loại (ALL)</option>
            <option value="TOPUP">TOPUP (Nạp tiền)</option>
            <option value="TRANSFER">TRANSFER (Chuyển tiền)</option>
            <option value="WITHDRAW">WITHDRAW (Rút tiền)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="clean-input px-3 py-1.5 text-xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">SUCCESS (Thành công)</option>
            <option value="PENDING">PENDING (Đang xử lý)</option>
            <option value="FAILED">FAILED (Thất bại)</option>
          </select>
        </div>

        <span className="text-xs text-[var(--text-secondary)] font-mono">
          Tổng số: <strong>{filteredTx.length}</strong> giao dịch
        </span>
      </div>

      {/* Table */}
      <div className="clean-card p-6 overflow-x-auto">
        <table className="w-full text-left text-xs text-[var(--text-primary)]">
          <thead className="bg-[var(--table-header-bg)] text-[var(--text-secondary)] font-mono border-b border-[var(--border-main)]">
            <tr>
              <th className="p-3">Mã Giao Dịch</th>
              <th className="p-3">Loại</th>
              <th className="p-3">Số Tiền</th>
              <th className="p-3">Mô Tả</th>
              <th className="p-3">Trạng Thái</th>
              <th className="p-3">Thời Gian</th>
              <th className="p-3 text-right">Chi Tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-main)]">
            {filteredTx.map((tx) => (
              <tr key={tx.id} className="hover:bg-[var(--table-hover-bg)] transition">
                <td className="p-3">
                  <div className="font-mono font-bold">{tx.transactionCode}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">Trace: {tx.traceId}</div>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded clean-card-subtle">
                    {tx.type === 'TOPUP' && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />}
                    {tx.type === 'TRANSFER' && <Send className="w-3.5 h-3.5 text-indigo-500" />}
                    {tx.type === 'WITHDRAW' && <ArrowUpRight className="w-3.5 h-3.5 text-purple-500" />}
                    {tx.type}
                  </span>
                </td>
                <td className="p-3 font-bold text-sm">
                  {tx.type === 'TOPUP' ? '+' : '-'}{formatMoney(tx.amount)}
                </td>
                <td className="p-3 text-[var(--text-secondary)] max-w-xs truncate">{tx.description}</td>
                <td className="p-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {tx.status}
                  </span>
                </td>
                <td className="p-3 font-mono text-[var(--text-secondary)]">
                  {new Date(tx.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedTx(tx)}
                    className="p-1.5 rounded-lg clean-card-subtle hover:border-emerald-500 transition text-[var(--text-secondary)] hover:text-emerald-500"
                    title="Xem chi tiết giao dịch"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-sm">
          <div className="clean-card p-6 sm:p-8 max-w-lg w-full relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                Chi Tiết Giao Dịch #{selectedTx.transactionCode}
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                <span className="text-[var(--text-secondary)]">Loại Giao Dịch:</span>
                <span className="font-bold text-emerald-600">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                <span className="text-[var(--text-secondary)]">Số Tiền:</span>
                <span className="font-bold text-base">{formatMoney(selectedTx.amount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                <span className="text-[var(--text-secondary)]">Phí Giao Dịch:</span>
                <span>{formatMoney(selectedTx.fee)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                <span className="text-[var(--text-secondary)]">Mô Tả:</span>
                <span className="text-[var(--text-primary)] font-sans">{selectedTx.description}</span>
              </div>

              {/* Idempotency Key */}
              <div className="py-2 border-b border-[var(--border-main)] space-y-1">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Idempotency Key:</span>
                  <button
                    onClick={() => handleCopy(selectedTx.idempotencyKey)}
                    className="text-emerald-500 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedKey ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 break-all">{selectedTx.idempotencyKey}</div>
              </div>

              {/* Trace ID */}
              <div className="py-2 border-b border-[var(--border-main)] space-y-1">
                <span className="text-[var(--text-secondary)] block">Trace ID (Zipkin Distributed Tracing):</span>
                <div className="text-[11px] text-slate-500 break-all">{selectedTx.traceId}</div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-[var(--text-secondary)]">Thời Gian Hoàn Tất:</span>
                <span>{new Date(selectedTx.completedAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition mt-2"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
