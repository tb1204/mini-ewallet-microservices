import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Code, Search, RefreshCcw, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight as ChevronRightIcon 
} from 'lucide-react';
import { auditApi } from '../../api';

const getActionBadgeClass = (action, badgeClass) => {
  if (badgeClass) return badgeClass;
  if (!action) return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  const upper = action.toUpperCase();
  if (upper.includes('UNLOCK') || upper.includes('ACTIVE') || upper.includes('SUCCESS') || upper.includes('MỞ KHÓA')) {
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  }
  if (upper.includes('LOCK') || upper.includes('DELETE') || upper.includes('FAILED') || upper.includes('BLOCK') || upper.includes('KHÓA')) {
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  }
  if (upper.includes('ROLE') || upper.includes('PERMISSION') || upper.includes('USER') || upper.includes('VAI TRÒ')) {
    return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  }
  if (upper.includes('FREEZE') || upper.includes('WARNING') || upper.includes('LIMIT') || upper.includes('ĐÓNG BĂNG')) {
    return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  }
  if (upper.includes('CONFIG') || upper.includes('SETTING') || upper.includes('CẤU HÌNH')) {
    return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
  }
  return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
};

/**
 * SYSTEM AUDIT LOGS PAGE (AuditLogsPage)
 * - Security event & admin action audit trail inspector connected to audit-service
 * - Full-width log data table supporting tri-state sorting & pagination
 * - Bottom JSON Event Detail Inspector displaying payload metadata dynamically on row selection
 */
export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Sorting State (null means default sort by fullTimestamp desc)
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditApi.getAuditLogs({ size: 100 });
      const logList = response?.result || response?.data || [];
      const safeLogs = Array.isArray(logList) ? logList : [];
      setLogs(safeLogs);
      if (safeLogs.length > 0) {
        setSelectedLog(safeLogs[0]);
      } else {
        setSelectedLog(null);
      }
    } catch (error) {
      console.warn('Failed to fetch audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
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
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const actionMatch = l.action?.toLowerCase().includes(search.toLowerCase());
      const performerMatch = l.performer?.toLowerCase().includes(search.toLowerCase());
      const targetMatch = l.targetUser?.toLowerCase().includes(search.toLowerCase());
      const serviceMatch = l.serviceName?.toLowerCase().includes(search.toLowerCase());
      return actionMatch || performerMatch || targetMatch || serviceMatch;
    });
  }, [logs, search]);

  // 2. Sorted Data
  const sortedLogs = useMemo(() => {
    if (!sortField) {
      return [...filteredLogs].sort((a, b) => {
        const timeA = new Date(a.fullTimestamp || a.createdAt).getTime();
        const timeB = new Date(b.fullTimestamp || b.createdAt).getTime();
        return timeB - timeA;
      });
    }

    return [...filteredLogs].sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      if (sortField === 'fullTimestamp' || sortField === 'createdAt') {
        const dateA = new Date(a.fullTimestamp || a.createdAt).getTime();
        const dateB = new Date(b.fullTimestamp || b.createdAt).getTime();
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
          Nhật Ký Hệ Thống (`audit_db`)
        </h1>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg clean-card-subtle text-xs font-medium flex items-center gap-1.5 hover:border-slate-400 border border-[var(--border-main)] transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Main Full-Width Table Card */}
      <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
        {/* Toolbar: Search input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo hành động, người thực hiện, đối tượng..."
              className="clean-input pl-9 pr-4 py-1.5 text-xs w-full"
            />
          </div>

          <div className="text-xs text-[var(--text-secondary)] font-mono self-end sm:self-center">
            Tổng cộng: <strong>{filteredLogs.length}</strong> nhật ký
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto border border-[var(--border-main)] rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--table-header-bg)] text-[var(--text-secondary)] border-b border-[var(--border-main)] font-semibold select-none">
              <tr>
                <th 
                  onClick={() => handleSort('fullTimestamp')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  Thời Gian {renderSortIcon('fullTimestamp')}
                </th>
                <th 
                  onClick={() => handleSort('performer')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  Người Thực Hiện {renderSortIcon('performer')}
                </th>
                <th 
                  onClick={() => handleSort('action')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  Hành Động {renderSortIcon('action')}
                </th>
                <th 
                  onClick={() => handleSort('targetUser')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  Đối Tượng {renderSortIcon('targetUser')}
                </th>
                <th 
                  onClick={() => handleSort('serviceName')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  Service {renderSortIcon('serviceName')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {paginatedLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const timestampStr = log.fullTimestamp || log.createdAt;
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`cursor-pointer transition ${
                      isSelected 
                        ? 'bg-blue-500/10 text-[var(--text-primary)] font-medium' 
                        : 'hover:bg-[var(--table-hover-bg)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                      {timestampStr ? new Date(timestampStr).toLocaleString('vi-VN') : log.timeStr}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[var(--text-primary)]">{log.performer}</div>
                      {log.performerRole && (
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">{log.performerRole}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border inline-block ${getActionBadgeClass(log.action, log.actionBadgeClass)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-primary)] font-medium">
                      {log.targetUser || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text-muted)]">
                      {log.serviceName || 'audit-service'}
                    </td>
                  </tr>
                );
              })}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[var(--text-muted)] text-xs">
                    {loading ? 'Đang tải danh sách nhật ký...' : 'Không tìm thấy bản ghi nhật ký phù hợp.'}
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

      {/* JSON Inspector Section */}
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
              <div className="font-semibold text-[var(--text-primary)]">{selectedLog.action} - {selectedLog.targetUser || 'N/A'}</div>
              <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                Thực hiện bởi: <strong>{selectedLog.performer}</strong> • Thời gian: {new Date(selectedLog.fullTimestamp || selectedLog.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>

            <pre className="p-4 rounded-lg bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
              {JSON.stringify(selectedLog.payload || selectedLog.details || selectedLog, null, 2)}
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
