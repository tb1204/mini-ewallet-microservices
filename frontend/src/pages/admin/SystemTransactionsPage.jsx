import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeftRight, Search, Eye, CreditCard, X,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Loader2, AlertCircle 
} from 'lucide-react';
import { transactionApi } from '../../api';

/**
 * SYSTEM TRANSACTIONS PAGE (SystemTransactionsPage)
 * - Displays system-wide ledger history (Top-up, Withdraw, P2P Transfer)
 * - Connected directly to transaction-service /api/v1/transactions/admin
 * - 7-Column Table Layout: Transaction ID, From Source, To Account, Amount, Status, Time, Actions
 * - Integrated Search & Status Filter (SUCCESS / PENDING / FAILED)
 * - Tri-state sorting mechanism (Default sort by newest timestamp)
 * - Flexible client-side pagination (5, 10, 20 rows per page) & Idempotency Key detail view
 */
export default function SystemTransactionsPage() {
  const [systemTransactions, setSystemTransactions] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
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

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' VNĐ';

  // Fetch all system transactions on mount
  useEffect(() => {
    let isMounted = true;
    const fetchAllTransactions = async () => {
      setIsFetching(true);
      setErrorMessage('');
      try {
        const response = await transactionApi.getAllSystemTransactions({ size: 100 });
        const list = response?.result || response?.data || response;
        if (isMounted) {
          setSystemTransactions(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Failed to load system transactions:', err);
        if (isMounted) {
          setErrorMessage('Không thể tải nhật ký giao dịch hệ thống từ transaction-service.');
        }
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    fetchAllTransactions();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3-State Sort Handler: (none/default) -> asc -> desc -> (default)
  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortField(null);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // 1. Filtered Data
  const filteredTxs = useMemo(() => {
    return systemTransactions.filter((t) => {
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesSearch =
        (t.id && t.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.senderWalletId && t.senderWalletId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.receiverWalletId && t.receiverWalletId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.type && t.type.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [systemTransactions, searchTerm, statusFilter]);

  // 2. Sorted Data
  const sortedTxs = useMemo(() => {
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
          Quản Lý Giao Dịch Hệ Thống (Microservice Ledger)
        </h1>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="clean-card p-3 bg-red-500/10 border-red-500/30 text-red-600 text-xs flex items-center gap-2 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          {errorMessage}
        </div>
      )}

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
                placeholder="Tìm theo Mã GD, Ví gửi, Ví nhận..."
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

                {/* Type Header */}
                <th
                  onClick={() => handleSort('type')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Loại</span>
                    {renderSortIcon('type')}
                  </div>
                </th>

                {/* From Header */}
                <th
                  onClick={() => handleSort('senderWalletId')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Nguồn gửi</span>
                    {renderSortIcon('senderWalletId')}
                  </div>
                </th>

                {/* To Header */}
                <th
                  onClick={() => handleSort('receiverWalletId')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Đích nhận</span>
                    {renderSortIcon('receiverWalletId')}
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
              {isFetching ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-[var(--text-secondary)] text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span>Đang tải nhật ký giao dịch toàn hệ thống...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTxs.length > 0 ? (
                paginatedTxs.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--table-hover-bg)] transition">
                    
                    {/* Transaction ID */}
                    <td className="p-3 font-mono font-medium text-blue-600 dark:text-blue-400 max-w-[120px] truncate" title={t.id}>
                      {t.id.length > 12 ? `${t.id.slice(0, 10)}...` : t.id}
                    </td>

                    {/* Type */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                        {t.type}
                      </span>
                    </td>

                    {/* From */}
                    <td className="p-3 font-mono text-[11px] text-[var(--text-primary)] max-w-[120px] truncate" title={t.senderWalletId || 'Hệ thống'}>
                      {t.type === 'TOPUP' ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> Ngân hàng
                        </span>
                      ) : (
                        t.senderWalletId ? `${t.senderWalletId.slice(0, 8)}...` : 'Hệ thống'
                      )}
                    </td>

                    {/* To */}
                    <td className="p-3 font-mono text-[11px] text-[var(--text-primary)] max-w-[120px] truncate" title={t.receiverWalletId || 'Ví e-Wallet'}>
                      {t.type === 'WITHDRAW' ? (
                        <span className="text-blue-600 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> Ngân hàng
                        </span>
                      ) : (
                        t.receiverWalletId ? `${t.receiverWalletId.slice(0, 8)}...` : 'Ví e-Wallet'
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
                      {t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
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
                  <td colSpan="8" className="text-center py-8 text-[var(--text-muted)] text-xs">
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
                <span className="text-[var(--text-secondary)]">Từ ví nguồn:</span>
                <span className="font-mono text-[11px] text-[var(--text-primary)]">{selectedTx.senderWalletId || 'Hệ thống'}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Đến ví nhận:</span>
                <span className="font-mono text-[11px] text-[var(--text-primary)]">{selectedTx.receiverWalletId || 'Ví e-Wallet'}</span>
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
                <span>{selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}</span>
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

