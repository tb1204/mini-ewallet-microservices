import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, Search, Eye, CreditCard, X,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useWalletStore } from '../../store/useWalletStore';

/**
 * SYSTEM TRANSACTIONS PAGE (SystemTransactionsPage)
 * - Displays system-wide ledger history (Top-up, Withdraw, P2P Transfer)
 * - 7-Column Table Layout: Transaction ID, From Source, To Account, Amount, Status, Time, Actions
 * - Integrated Search & Status Filter (SUCCESS / PENDING / FAILED)
 * - Tri-state sorting mechanism (Default sort by newest timestamp)
 * - Flexible client-side pagination (5, 10, 20 rows per page) & Idempotency Key detail view
 */
export default function SystemTransactionsPage() {
  const { transactions } = useWalletStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sorting State (null means default sort by createdAt desc)
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals
  const [selectedTx, setSelectedTx] = useState(null);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' VNĐ';

  // 3-State Sort Handler: (none/default) -> asc -> desc -> (default)
  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      // Third click resets back to default (createdAt desc)
      setSortField(null);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // 1. Filtered Data
  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesSearch =
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.senderName && t.senderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.recipientName && t.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [transactions, searchTerm, statusFilter]);

  // 2. Sorted Data
  const sortedTxs = useMemo(() => {
    // Default sorting when sortField is null: Sort by createdAt desc (Newest first)
    if (!sortField) {
      return [...filteredTxs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return [...filteredTxs].sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      if (sortField === 'createdAt') {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, 'vi', { sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTxs, sortField, sortOrder]);

  // 3. Paginated Data
  const totalPages = Math.ceil(sortedTxs.length / pageSize) || 1;
  const paginatedTxs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTxs.slice(start, start + pageSize);
  }, [sortedTxs, currentPage, pageSize]);

  // Helper icon for sort headers
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 inline-block ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 inline-block ml-1" />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Title */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)] tracking-tight">
          <ArrowLeftRight className="w-5 h-5 text-blue-600" />
          Quản Lý Giao Dịch
        </h1>
      </div>

      {/* Main Table Card */}
      <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
        
        {/* Table Filters & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Danh Sách Giao Dịch ({filteredTxs.length})
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo Mã GD, Người gửi, Người nhận..."
                className="w-full clean-input pl-9 pr-3 py-1.5 text-xs"
              />
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="clean-input py-1.5 px-3 text-xs w-full sm:w-auto"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="SUCCESS">Thành công</option>
              <option value="PENDING">Đang xử lý</option>
              <option value="FAILED">Thất bại</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-primary)]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--text-secondary)] border-b border-[var(--border-main)] font-medium select-none">
              <tr>
                {/* ID Header */}
                <th
                  onClick={() => handleSort('id')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Mã giao dịch</span>
                    {renderSortIcon('id')}
                  </div>
                </th>

                {/* From Header */}
                <th
                  onClick={() => handleSort('senderName')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Từ nguồn</span>
                    {renderSortIcon('senderName')}
                  </div>
                </th>

                {/* To Header */}
                <th
                  onClick={() => handleSort('recipientName')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Đến tài khoản</span>
                    {renderSortIcon('recipientName')}
                  </div>
                </th>

                {/* Amount Header */}
                <th
                  onClick={() => handleSort('amount')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Số tiền</span>
                    {renderSortIcon('amount')}
                  </div>
                </th>

                {/* Status Header */}
                <th
                  onClick={() => handleSort('status')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Trạng thái</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                {/* CreatedAt Header */}
                <th
                  onClick={() => handleSort('createdAt')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Thời gian</span>
                    {renderSortIcon('createdAt')}
                  </div>
                </th>

                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {paginatedTxs.length > 0 ? (
                paginatedTxs.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--table-hover-bg)] transition">
                    
                    {/* Transaction ID */}
                    <td className="p-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {t.id}
                    </td>

                    {/* From */}
                    <td className="p-3 font-medium text-[var(--text-primary)]">
                      {t.type === 'TOPUP' ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-mono">
                          <CreditCard className="w-3.5 h-3.5" /> {t.bankName || 'Ngân Hàng VCB'}
                        </span>
                      ) : (
                        t.senderName || 'Nguyễn Văn User'
                      )}
                    </td>

                    {/* To */}
                    <td className="p-3 font-medium text-[var(--text-primary)]">
                      {t.type === 'WITHDRAW' ? (
                        <span className="text-blue-600 flex items-center gap-1 font-mono">
                          <CreditCard className="w-3.5 h-3.5" /> {t.bankName || 'Ngân Hàng BIDV'}
                        </span>
                      ) : (
                        t.recipientName || (t.type === 'TOPUP' ? 'Ví Cá Nhân' : 'Dịch vụ E-Wallet')
                      )}
                    </td>

                    {/* Amount */}
                    <td className="p-3 font-mono font-semibold text-[var(--text-primary)]">
                      {formatVND(t.amount)}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          t.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : t.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {t.status === 'SUCCESS' ? 'Thành công' : t.status === 'PENDING' ? 'Đang xử lý' : 'Thất bại'}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="p-3 text-[var(--text-secondary)] text-[11px] whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString('vi-VN')}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedTx(t)}
                        className="px-2.5 py-1 rounded-lg clean-card-subtle text-xs font-medium hover:border-slate-400 border border-[var(--border-main)] inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Xem
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[var(--text-muted)] text-xs">
                    Không tìm thấy giao dịch phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-main)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span>Số dòng mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="clean-input py-1 px-2 text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="ml-2">
              Hiển thị {sortedTxs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, sortedTxs.length)} trong tổng số {sortedTxs.length} giao dịch
            </span>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[var(--border-main)] clean-card-subtle disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'clean-card-subtle border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-[var(--border-main)] clean-card-subtle disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="clean-card w-full max-w-md p-5 space-y-4 rounded-xl border border-[var(--border-main)] shadow-xl relative animate-in zoom-in-95 duration-150">
            
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">Chi Tiết Giao Dịch</h3>
                <span className="font-mono text-xs text-blue-600">{selectedTx.id}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Loại giao dịch:</span>
                <span className="font-semibold text-blue-600 uppercase">{selectedTx.type}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Từ nguồn (From):</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedTx.senderName || 'Hệ thống'}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Đến tài khoản (To):</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedTx.recipientName || 'Ví E-Wallet'}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[var(--text-secondary)]">Số tiền:</span>
                <span className="font-bold text-sm text-emerald-600">{formatVND(selectedTx.amount)}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle font-mono">
                <span className="text-[var(--text-secondary)]">Idempotency Key:</span>
                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[180px]">{selectedTx.idempotencyKey || `idemp-${selectedTx.id}`}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Thời gian khởi tạo:</span>
                <span>{new Date(selectedTx.createdAt).toLocaleString('vi-VN')}</span>
              </div>

              <div className="p-2.5 rounded-lg clean-card-subtle space-y-1">
                <div className="text-[var(--text-secondary)]">Ghi chú:</div>
                <div className="text-[var(--text-primary)]">{selectedTx.description || 'Giao dịch qua ví điện tử MiniWallet'}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
