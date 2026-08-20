import React, { useState, useMemo } from 'react';
import { 
  FileText, Code, Search, RefreshCcw, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight as ChevronRightIcon 
} from 'lucide-react';

const mockEnterpriseAuditLogs = [
  {
    id: 'audit-001',
    timeStr: '10:05:22',
    fullTimestamp: new Date(Date.now() - 300000).toISOString(),
    performer: 'Quản Trị Viên (Admin)',
    performerRole: 'ROLE_ADMIN',
    action: 'MỞ KHÓA USER',
    actionBadgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    targetUser: 'user456 (Lê Văn B)',
    serviceName: 'identity-service',
    payload: {
      action: 'UNLOCK_ACCOUNT',
      targetUserId: 'u2222222-2222-2222-2222-222222222222',
      reason: 'Đã xác minh giấy tờ tùy thân',
      adminIp: '192.168.1.100'
    }
  },
  {
    id: 'audit-002',
    timeStr: '10:00:15',
    fullTimestamp: new Date(Date.now() - 600000).toISOString(),
    performer: 'Quản Trị Viên (Admin)',
    performerRole: 'ROLE_ADMIN',
    action: 'KHÓA USER',
    actionBadgeClass: 'bg-red-500/10 text-red-600 border-red-500/20',
    targetUser: 'user123 (Nguyễn Văn User)',
    serviceName: 'identity-service',
    payload: {
      action: 'LOCK_ACCOUNT',
      targetUserId: 'u1111111-1111-1111-1111-111111111111',
      reason: 'Nhập sai mã PIN quá số lần cho phép',
      adminIp: '192.168.1.100'
    }
  },
  {
    id: 'audit-003',
    timeStr: '09:45:00',
    fullTimestamp: new Date(Date.now() - 1500000).toISOString(),
    performer: 'Quản Trị Viên (Admin)',
    performerRole: 'ROLE_ADMIN',
    action: 'ĐỔI VAI TRÒ',
    actionBadgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    targetUser: 'staff888 (Trần Thị Nhân Viên)',
    serviceName: 'identity-service',
    payload: {
      action: 'UPDATE_USER_ROLE',
      targetUserId: 's8888888-8888-8888-8888-888888888888',
      previousRole: 'ROLE_USER',
      newRole: 'ROLE_STAFF',
      updatedBy: 'admin@ewallet.com'
    }
  },
  {
    id: 'audit-004',
    timeStr: '09:12:40',
    fullTimestamp: new Date(Date.now() - 3600000).toISOString(),
    performer: 'Trần Thị Nhân Viên (Staff)',
    performerRole: 'ROLE_STAFF',
    action: 'KHÓA VÍ',
    actionBadgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    targetUser: 'w-303-user-blocked (Lê Văn B)',
    serviceName: 'wallet-service',
    payload: {
      action: 'FREEZE_WALLET_BALANCE',
      walletId: 'w-303-user-blocked',
      lockedBalance: 2100000,
      redisLockStatus: 'SUCCESS_LOCKED'
    }
  },
  {
    id: 'audit-005',
    timeStr: '08:30:10',
    fullTimestamp: new Date(Date.now() - 7200000).toISOString(),
    performer: 'Quản Trị Viên (Admin)',
    performerRole: 'ROLE_ADMIN',
    action: 'CẤU HÌNH THAM SỐ',
    actionBadgeClass: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    targetUser: 'Cấu Hình Hệ Thống',
    serviceName: 'wallet-service',
    payload: {
      action: 'UPDATE_TRANSACTION_LIMITS',
      dailyLimitVnd: 500000000,
      maxPerTxVnd: 100000000,
      otpThresholdVnd: 10000000,
      maintenanceMode: false
    }
  }
];

/**
 * SYSTEM AUDIT LOGS PAGE (AuditLogsPage)
 * - Security event & admin action audit trail inspector
 * - Full-width log data table supporting tri-state sorting & pagination
 * - Bottom JSON Event Detail Inspector displaying payload metadata dynamically on row selection
 */
export default function AuditLogsPage() {
  const [logs, setLogs] = useState(mockEnterpriseAuditLogs);
  const [selectedLog, setSelectedLog] = useState(mockEnterpriseAuditLogs[0]);
  const [search, setSearch] = useState('');

  // Sorting State (null means default sort by fullTimestamp desc)
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // 3-State Sort Handler: (none/default) -> asc -> desc -> (default)
  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      // Third click resets back to default (fullTimestamp desc)
      setSortField(null);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // 1. Filtered Data
  const filteredLogs = useMemo(() => {
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.performer.toLowerCase().includes(search.toLowerCase()) ||
        l.targetUser.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  // 2. Sorted Data
  const sortedLogs = useMemo(() => {
    // Default sort by fullTimestamp desc
    if (!sortField) {
      return [...filteredLogs].sort((a, b) => new Date(b.fullTimestamp) - new Date(a.fullTimestamp));
    }

    return [...filteredLogs].sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      if (sortField === 'fullTimestamp') {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, 'vi', { sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLogs, sortField, sortOrder]);

  // 3. Paginated Data
  const totalPages = Math.ceil(sortedLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [sortedLogs, currentPage, pageSize]);

  // Helper icon for sort headers
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 inline-block ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-amber-600 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-amber-600 inline-block ml-1" />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)] tracking-tight">
          <FileText className="w-5 h-5 text-amber-600" />
          Nhật Ký Hệ Thống
        </h1>

        <button
          onClick={() => setLogs([...mockEnterpriseAuditLogs])}
          className="px-3 py-1.5 rounded-lg clean-card-subtle text-xs font-medium flex items-center gap-1.5 hover:border-slate-400 border border-[var(--border-main)] transition cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* Main Full-Width Table Card */}
      <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
        
        {/* Table Search Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Danh Sách Nhật Ký ({filteredLogs.length})
          </h2>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Lọc theo Hành động, Người thực hiện, Đối tượng..."
              className="w-full clean-input pl-9 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Log List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-primary)]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--text-secondary)] border-b border-[var(--border-main)] font-medium select-none">
              <tr>
                {/* Time Header */}
                <th
                  onClick={() => handleSort('fullTimestamp')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Thời gian</span>
                    {renderSortIcon('fullTimestamp')}
                  </div>
                </th>

                {/* Performer Header */}
                <th
                  onClick={() => handleSort('performer')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Người thực hiện</span>
                    {renderSortIcon('performer')}
                  </div>
                </th>

                {/* Action Header */}
                <th
                  onClick={() => handleSort('action')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Hành động</span>
                    {renderSortIcon('action')}
                  </div>
                </th>

                {/* Target Header */}
                <th
                  onClick={() => handleSort('targetUser')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Đối tượng</span>
                    {renderSortIcon('targetUser')}
                  </div>
                </th>

                <th className="p-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-500/10 font-semibold'
                          : 'hover:bg-[var(--table-hover-bg)]'
                      }`}
                    >
                      {/* Time */}
                      <td className="p-3 text-blue-600 font-mono whitespace-nowrap">
                        {log.timeStr} ({new Date(log.fullTimestamp).toLocaleDateString('vi-VN')})
                      </td>

                      {/* Performer */}
                      <td className="p-3 text-[var(--text-primary)] font-medium">
                        {log.performer}
                      </td>

                      {/* Action */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${log.actionBadgeClass}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Target User */}
                      <td className="p-3 text-[var(--text-secondary)]">
                        {log.targetUser}
                      </td>

                      {/* Chevron Action */}
                      <td className="p-3 text-right">
                        <ChevronRight className={`w-4 h-4 inline-block transition ${isSelected ? 'text-blue-600 translate-x-1' : 'text-[var(--text-muted)]'}`} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[var(--text-muted)] text-xs">
                    Không tìm thấy bản ghi nhật ký phù hợp.
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
              Hiển thị {sortedLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, sortedLogs.length)} trong tổng số {sortedLogs.length} nhật ký
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
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* JSON Inspector Section (Full-width below the table) */}
      <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
        <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-[var(--border-main)] pb-3 text-[var(--text-primary)]">
          <Code className="w-4 h-4 text-emerald-600" />
          Chi Tiết Sự Kiện (JSON)
        </h2>

        {selectedLog ? (
          <div className="space-y-3">
            <div className="text-xs text-[var(--text-secondary)] font-mono flex items-center justify-between">
              <span>Mã nhật ký: <strong className="text-[var(--text-primary)]">{selectedLog.id}</strong></span>
            </div>

            <div className="p-3 rounded-lg clean-card-subtle space-y-1 text-xs">
              <div className="font-semibold text-[var(--text-primary)]">{selectedLog.action} - {selectedLog.targetUser}</div>
              <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                Thực hiện bởi: <strong>{selectedLog.performer}</strong> • Thời gian: {new Date(selectedLog.fullTimestamp).toLocaleString('vi-VN')}
              </div>
            </div>

            <pre className="p-4 rounded-lg bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
              {JSON.stringify(selectedLog.payload, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)] text-xs">
            Chọn một bản ghi nhật ký từ danh sách trên để xem chi tiết dữ liệu JSON.
          </div>
        )}
      </div>

    </div>
  );
}
