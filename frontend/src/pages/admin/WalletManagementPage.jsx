import React, { useState, useMemo } from 'react';
import { 
  CreditCard, Search, Lock, Unlock, Eye, CheckCircle2, X,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight 
} from 'lucide-react';

const initialWallets = [
  {
    id: 'w-101-user-main',
    userId: 'u1111111-1111-1111-1111-111111111111',
    ownerName: 'Nguyễn Văn User',
    ownerEmail: 'user@ewallet.com',
    balance: 15450000,
    currency: 'VND',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00Z',
    lastTransactionAt: '2026-08-06T10:30:00Z'
  },
  {
    id: 'w-202-staff-main',
    userId: 's8888888-8888-8888-8888-888888888888',
    ownerName: 'Trần Thị Nhân Viên (Staff)',
    ownerEmail: 'staff@ewallet.com',
    balance: 8500000,
    currency: 'VND',
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:15:00Z',
    lastTransactionAt: '2026-08-05T14:20:00Z'
  },
  {
    id: 'w-999-admin-main',
    userId: 'a9999999-9999-9999-9999-999999999999',
    ownerName: 'Quản Trị Viên (Admin)',
    ownerEmail: 'admin@ewallet.com',
    balance: 100000000,
    currency: 'VND',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    lastTransactionAt: '2026-08-06T12:00:00Z'
  },
  {
    id: 'w-303-user-blocked',
    userId: 'u2222222-2222-2222-2222-222222222222',
    ownerName: 'Lê Văn B',
    ownerEmail: 'le.van.b@ewallet.com',
    balance: 2100000,
    currency: 'VND',
    status: 'LOCKED',
    createdAt: '2026-03-10T11:00:00Z',
    lastTransactionAt: '2026-07-20T16:45:00Z'
  }
];

/**
 * WALLET MANAGEMENT PAGE (WalletManagementPage)
 * - Standard 5-Column Table Layout: ID, Owner, Balance, Status, Actions
 * - Real-time keyword search (Wallet ID, Name, Email) & Status filtering (ACTIVE / LOCKED)
 * - Tri-state sorting mechanism (Default createdAt DESC -> ASC -> DESC -> Default)
 * - Flexible client-side pagination (5, 10, 20 rows per page)
 * - Admin controls for wallet freeze/unfreeze & detail modal viewing
 */
export default function WalletManagementPage() {
  const [wallets, setWallets] = useState(initialWallets);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sorting State (null means default sort by createdAt desc)
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals & Feedback
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [msg, setMsg] = useState('');

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' VNĐ';

  const handleToggleWalletLock = (walletId, ownerName, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const updated = wallets.map(w => w.id === walletId ? { ...w, status: newStatus } : w);
    setWallets(updated);
    setMsg(`Ví của "${ownerName}" đã chuyển sang trạng thái: ${newStatus === 'LOCKED' ? 'Đã khóa' : 'Đã mở khóa'}`);
    setTimeout(() => setMsg(''), 3000);
  };

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
  const filteredWallets = useMemo(() => {
    return wallets.filter(w => {
      const matchesSearch = 
        w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [wallets, searchTerm, statusFilter]);

  // 2. Sorted Data
  const sortedWallets = useMemo(() => {
    // Default sort by createdAt desc
    if (!sortField) {
      return [...filteredWallets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return [...filteredWallets].sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

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
  }, [filteredWallets, sortField, sortOrder]);

  // 3. Paginated Data
  const totalPages = Math.ceil(sortedWallets.length / pageSize) || 1;
  const paginatedWallets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedWallets.slice(start, start + pageSize);
  }, [sortedWallets, currentPage, pageSize]);

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
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)] tracking-tight">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Quản Lý Ví Điện Tử
        </h1>
      </div>

      {/* Notice Message */}
      {msg && (
        <div className="clean-card p-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {msg}
        </div>
      )}

      {/* Wallets Table Container */}
      <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
        
        {/* Table Header & Search Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Danh Sách Ví Điện Tử ({filteredWallets.length})
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
                placeholder="Tìm theo Mã ví, Tên, Email..."
                className="w-full clean-input pl-9 pr-3 py-1.5 text-xs"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="clean-input py-1.5 px-3 text-xs w-full sm:w-auto"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
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
                    <span>ID</span>
                    {renderSortIcon('id')}
                  </div>
                </th>

                {/* Owner Header */}
                <th
                  onClick={() => handleSort('ownerName')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Chủ sở hữu</span>
                    {renderSortIcon('ownerName')}
                  </div>
                </th>

                {/* Balance Header */}
                <th
                  onClick={() => handleSort('balance')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Số dư</span>
                    {renderSortIcon('balance')}
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

                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {paginatedWallets.length > 0 ? (
                paginatedWallets.map((w) => (
                  <tr key={w.id} className="hover:bg-[var(--table-hover-bg)] transition">
                    
                    {/* Wallet ID */}
                    <td className="p-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {w.id}
                    </td>

                    {/* Owner */}
                    <td className="p-3">
                      <div className="font-medium text-[var(--text-primary)]">{w.ownerName}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">{w.ownerEmail}</div>
                    </td>

                    {/* Balance */}
                    <td className="p-3 font-mono font-semibold text-[var(--text-primary)]">
                      {formatVND(w.balance)}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          w.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {w.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View Button */}
                        <button
                          onClick={() => setSelectedWallet(w)}
                          className="px-2.5 py-1 rounded-lg clean-card-subtle text-xs font-medium hover:border-slate-400 border border-[var(--border-main)] flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Xem
                        </button>

                        {/* Lock / Unlock Button */}
                        <button
                          onClick={() => handleToggleWalletLock(w.id, w.ownerName, w.status)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition cursor-pointer ${
                            w.status === 'ACTIVE'
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/20'
                          }`}
                        >
                          {w.status === 'ACTIVE' ? (
                            <>
                              <Lock className="w-3.5 h-3.5" /> Khóa
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" /> Mở khóa
                            </>
                          )}
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[var(--text-muted)] text-xs">
                    Không tìm thấy ví điện tử phù hợp.
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
              Hiển thị {sortedWallets.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, sortedWallets.length)} trong tổng số {sortedWallets.length} ví
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

      {/* Wallet Detail View Modal */}
      {selectedWallet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="clean-card w-full max-w-md p-5 space-y-4 rounded-xl border border-[var(--border-main)] shadow-xl relative animate-in zoom-in-95 duration-150">
            
            <button
              onClick={() => setSelectedWallet(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">Chi Tiết Ví Điện Tử</h3>
                <span className="font-mono text-xs text-blue-600">{selectedWallet.id}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Chủ sở hữu:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedWallet.ownerName}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Email liên hệ:</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedWallet.ownerEmail}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[var(--text-secondary)]">Số dư hiện tại:</span>
                <span className="font-bold text-sm text-emerald-600">{formatVND(selectedWallet.balance)}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Trạng thái ví:</span>
                <span className={`font-medium ${selectedWallet.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedWallet.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Ngày khởi tạo:</span>
                <span>{new Date(selectedWallet.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedWallet(null)}
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
