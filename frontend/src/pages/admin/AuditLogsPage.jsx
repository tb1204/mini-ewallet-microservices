import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Code2, Search, RefreshCcw, Eye, Shield, AlertTriangle, 
  Info, ShieldAlert, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, 
  ChevronRight, Loader2, CheckCircle2, Server, User, Calendar, Copy, Check
} from 'lucide-react';
import { auditApi } from '../../api';

// 1. Action Metadata & Severity Mapping (Fintech Compliance Standard)
const ACTION_MAP = {
  // Authentication & Credentials
  LOGIN: { label: 'Đăng nhập', level: 'INFO', color: 'blue' },
  REGISTER: { label: 'Đăng ký tài khoản', level: 'INFO', color: 'emerald' },
  CHANGE_PASSWORD: { label: 'Đổi mật khẩu', level: 'WARNING', color: 'amber' },
  UPDATE_PIN: { label: 'Đổi mã PIN', level: 'WARNING', color: 'amber' },
  
  // Account & Wallet Administration (High Impact)
  LOCK_ACCOUNT: { label: 'Khóa tài khoản', level: 'CRITICAL', color: 'red' },
  UNLOCK_ACCOUNT: { label: 'Mở khóa tài khoản', level: 'CRITICAL', color: 'emerald' },
  UPDATE_USER_ROLE: { label: 'Cập nhật vai trò', level: 'CRITICAL', color: 'purple' },
  FREEZE_WALLET: { label: 'Khóa ví điện tử', level: 'CRITICAL', color: 'red' },
  UNFREEZE_WALLET: { label: 'Mở khóa ví', level: 'CRITICAL', color: 'emerald' },
  
  // Financial Transactions
  TOPUP: { label: 'Nạp tiền ví', level: 'INFO', color: 'emerald' },
  WITHDRAW: { label: 'Rút tiền về bank', level: 'INFO', color: 'amber' },
  TRANSFER: { label: 'Chuyển tiền P2P', level: 'INFO', color: 'purple' },
  
  // Notification & Communication
  SEND_NOTIFICATION: { label: 'Gửi thông báo', level: 'INFO', color: 'blue' },
  SEND_OTP: { label: 'Gửi mã OTP', level: 'INFO', color: 'amber' },
  SEND_EMAIL: { label: 'Gửi Email thông báo', level: 'INFO', color: 'blue' },

  // System Configurations
  UPDATE_CONFIG: { label: 'Đổi cấu hình hệ thống', level: 'CRITICAL', color: 'purple' },
};

// Registered Microservices in System Architecture
const SYSTEM_SERVICES = [
  'identity-service',
  'wallet-service',
  'transaction-service',
  'notification-service',
  'audit-service',
  'api-gateway'
];

const getActionInfo = (action) => {
  if (!action) return { label: 'Không xác định', level: 'INFO', color: 'slate' };
  const upper = action.toUpperCase();
  if (ACTION_MAP[upper]) return ACTION_MAP[upper];
  
  if (upper.includes('LOCK') || upper.includes('BLOCK') || upper.includes('DELETE') || upper.includes('KHÓA')) {
    return { label: action, level: 'CRITICAL', color: 'red' };
  }
  if (upper.includes('CONFIG') || upper.includes('ROLE')) {
    return { label: action, level: 'CRITICAL', color: 'purple' };
  }
  if (upper.includes('PASS') || upper.includes('PIN') || upper.includes('WARN')) {
    return { label: action, level: 'WARNING', color: 'amber' };
  }
  return { label: action, level: 'INFO', color: 'blue' };
};

/**
 * SYSTEM AUDIT LOGS PAGE (AuditLogsPage)
 * - Enterprise-grade Audit Trail & Security Compliance Monitor
 * - Real-time append-only log view across Microservices
 * - 5W1H Structured Detail Inspector (Visual Table & Raw JSON modes)
 */
export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('VISUAL'); // 'VISUAL' | 'JSON'
  const [copied, setCopied] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' VNĐ';

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

  const handleCopyJson = () => {
    if (!selectedLog) return;
    const jsonStr = JSON.stringify(selectedLog.details || selectedLog.payload || selectedLog, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 3-State Sort Handler: (default desc) -> asc -> desc -> default
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

  // List of unique microservices available for filtering
  const availableServices = useMemo(() => {
    const fromLogs = logs.map((l) => l.serviceName).filter(Boolean);
    return Array.from(new Set([...SYSTEM_SERVICES, ...fromLogs]));
  }, [logs]);

  // 1. Filtered Data
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const info = getActionInfo(l.action);
      
      const matchesSearch =
        (l.id && l.id.toLowerCase().includes(search.toLowerCase())) ||
        (l.action && l.action.toLowerCase().includes(search.toLowerCase())) ||
        (info.label && info.label.toLowerCase().includes(search.toLowerCase())) ||
        (l.performer && l.performer.toLowerCase().includes(search.toLowerCase())) ||
        (l.targetUser && l.targetUser.toLowerCase().includes(search.toLowerCase())) ||
        (l.serviceName && l.serviceName.toLowerCase().includes(search.toLowerCase()));

      const matchesLevel = levelFilter === 'ALL' || info.level === levelFilter;
      const matchesService = serviceFilter === 'ALL' || l.serviceName === serviceFilter;

      return matchesSearch && matchesLevel && matchesService;
    });
  }, [logs, search, levelFilter, serviceFilter]);

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

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let info = 0;
    logs.forEach((l) => {
      const act = getActionInfo(l.action);
      if (act.level === 'CRITICAL') critical++;
      else if (act.level === 'WARNING') warning++;
      else info++;
    });
    return { total: logs.length, critical, warning, info };
  }, [logs]);

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

  const renderLevelBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Trọng yếu
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Cảnh báo
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Thông tin
          </span>
        );
    }
  };

  const renderActionBadge = (action) => {
    const info = getActionInfo(action);
    let colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (info.color === 'emerald') colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (info.color === 'red') colorClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    if (info.color === 'amber') colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (info.color === 'purple') colorClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';

    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${colorClass} whitespace-nowrap`}>
        {info.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)] tracking-tight">
            <FileText className="w-5 h-5 text-blue-600" />
            Nhật Ký Kiểm Toán (Audit Logs)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Hệ thống vết vết hành vi và giám sát tuân thủ an ninh theo chuẩn PCI-DSS & Ngân hàng
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg clean-card-subtle text-xs font-medium flex items-center gap-1.5 hover:border-slate-400 border border-[var(--border-main)] transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="clean-card p-4 rounded-xl border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-[var(--text-secondary)]">Tổng Sự Kiện</div>
          <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">{summaryMetrics.total}</div>
        </div>

        <div className="clean-card p-4 rounded-xl border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Thông Thường
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summaryMetrics.info}</div>
        </div>

        <div className="clean-card p-4 rounded-xl border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Cảnh Báo
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{summaryMetrics.warning}</div>
        </div>

        <div className="clean-card p-4 rounded-xl border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-red-600 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Trọng Yếu
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">{summaryMetrics.critical}</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
        
        {/* Toolbar: Search input & Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
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

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="clean-input py-1.5 px-3 text-xs"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="CRITICAL">Trọng yếu (Critical)</option>
              <option value="WARNING">Cảnh báo (Warning)</option>
              <option value="INFO">Thông tin (Info)</option>
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="clean-input py-1.5 px-3 text-xs font-mono"
            >
              <option value="ALL">Tất cả Services</option>
              {availableServices.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>

            <span className="text-[11px] text-[var(--text-secondary)] font-mono ml-1">
              Hiển thị: <strong>{filteredLogs.length}</strong>
            </span>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto border border-[var(--border-main)] rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--table-header-bg)] text-[var(--text-secondary)] border-b border-[var(--border-main)] font-semibold select-none">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th 
                  onClick={() => handleSort('fullTimestamp')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] transition whitespace-nowrap"
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
                <th className="py-2.5 px-3">Mức Độ</th>
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
                  Dịch Vụ {renderSortIcon('serviceName')}
                </th>
                <th className="py-2.5 px-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {paginatedLogs.map((log, index) => {
                const isSelected = selectedLog?.id === log.id;
                const timestampStr = log.fullTimestamp || log.createdAt;
                const stt = (currentPage - 1) * pageSize + index + 1;
                const actionInfo = getActionInfo(log.action);

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
                    {/* STT */}
                    <td className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)] text-[11px] w-12">
                      {stt}
                    </td>

                    {/* Time */}
                    <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-[var(--text-primary)]">
                      {timestampStr ? new Date(timestampStr).toLocaleString('vi-VN') : log.timeStr}
                    </td>

                    {/* Performer */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[var(--text-primary)]">{log.performer}</div>
                      {log.performerRole && (
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">{log.performerRole}</div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3">
                      {renderActionBadge(log.action)}
                    </td>

                    {/* Severity Level */}
                    <td className="py-2.5 px-3">
                      {renderLevelBadge(actionInfo.level)}
                    </td>

                    {/* Target */}
                    <td className="py-2.5 px-3 text-[var(--text-primary)] font-medium max-w-[180px] truncate" title={log.targetUser || '-'}>
                      {log.targetUser || '-'}
                    </td>

                    {/* Service */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text-muted)]">
                      {log.serviceName || 'audit-service'}
                    </td>

                    {/* Action Button */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border inline-flex items-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'clean-card-subtle hover:border-slate-400 border-[var(--border-main)]'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>
                    </td>

                  </tr>
                );
              })}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-[var(--text-muted)] text-xs">
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
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5W1H Event Detail Inspector Section */}
      <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
        
        {/* Section Header with Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Chi Tiết Sự Kiện Kiểm Toán (Audit Event Inspector)
            </h2>
          </div>

          {selectedLog && (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[var(--table-header-bg)] p-0.5 rounded-lg border border-[var(--border-main)]">
                <button
                  onClick={() => setViewMode('VISUAL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    viewMode === 'VISUAL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Bảng Trực Quan
                </button>
                <button
                  onClick={() => setViewMode('JSON')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    viewMode === 'JSON'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Mã JSON Thô
                </button>
              </div>

              {viewMode === 'JSON' && (
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 rounded-lg clean-card-subtle text-xs font-medium border border-[var(--border-main)] inline-flex items-center gap-1 hover:border-slate-400 transition cursor-pointer"
                  title="Sao chép JSON"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã chép' : 'Sao chép'}
                </button>
              )}
            </div>
          )}
        </div>

        {selectedLog ? (
          <div className="space-y-4">
            
            {/* Top Identity Meta Ribbon */}
            <div className="p-3.5 rounded-xl clean-card-subtle border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">Mã bản ghi (Log UUID):</span>
                <span className="font-mono text-slate-600 dark:text-slate-300 select-all font-semibold">
                  {selectedLog.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">Thời gian ghi nhận:</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">
                  {new Date(selectedLog.fullTimestamp || selectedLog.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {viewMode === 'VISUAL' ? (
              /* Visual 5W1H Structured Grid */
              <div className="space-y-4">
                
                {/* 4 Core Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg clean-card-subtle space-y-1">
                    <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                      <User className="w-3 h-3" /> Người thực hiện
                    </div>
                    <div className="font-bold text-[var(--text-primary)]">{selectedLog.performer}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">{selectedLog.performerRole || 'ROLE_USER'}</div>
                  </div>

                  <div className="p-3 rounded-lg clean-card-subtle space-y-1">
                    <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Hành động
                    </div>
                    <div>{renderActionBadge(selectedLog.action)}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">{selectedLog.action}</div>
                  </div>

                  <div className="p-3 rounded-lg clean-card-subtle space-y-1">
                    <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                      <Server className="w-3 h-3" /> Dịch vụ phát sinh
                    </div>
                    <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedLog.serviceName || 'audit-service'}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">IP: {selectedLog.ipAddress || '127.0.0.1'}</div>
                  </div>

                  <div className="p-3 rounded-lg clean-card-subtle space-y-1">
                    <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Mức độ kiểm toán
                    </div>
                    <div>{renderLevelBadge(getActionInfo(selectedLog.action).level)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Đối tượng: {selectedLog.targetUser || 'Hệ thống'}</div>
                  </div>
                </div>

                {/* Event Payload / Changes Breakdown */}
                <div className="p-4 rounded-xl border border-[var(--border-main)] bg-[var(--table-header-bg)] space-y-3">
                  <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    Dữ Liệu Thay Đổi & Tham Số Nghiệp Vụ (Payload Attributes)
                  </div>

                  {(() => {
                    const data = selectedLog.details || selectedLog.payload;
                    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
                      return (
                        <div className="text-xs text-[var(--text-muted)] italic">
                          Không có tham số mở rộng cho bản ghi này.
                        </div>
                      );
                    }

                    // Special Render: Config Diff (Old vs New)
                    if (data.oldValue !== undefined && data.newValue !== undefined) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1">
                            <span className="text-[11px] text-red-600 font-medium">Giá trị cũ (Old Value):</span>
                            <div className="font-mono font-bold text-red-700 dark:text-red-400 break-all">
                              {String(data.oldValue)}
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                            <span className="text-[11px] text-emerald-600 font-medium">Giá trị mới (New Value):</span>
                            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 break-all">
                              {String(data.newValue)}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Special Render: Financial Transaction Details
                    if (data.amount !== undefined || data.transactionCode !== undefined) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          {data.transactionCode && (
                            <div className="p-2.5 rounded-lg clean-card-subtle space-y-0.5">
                              <span className="text-[11px] text-[var(--text-secondary)]">Mã giao dịch:</span>
                              <div className="font-mono font-bold text-blue-600">{data.transactionCode}</div>
                            </div>
                          )}
                          {data.amount && (
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">Số tiền giao dịch:</span>
                              <div className="font-mono font-bold text-sm text-emerald-600">{formatVND(data.amount)}</div>
                            </div>
                          )}
                          {data.fee !== undefined && (
                            <div className="p-2.5 rounded-lg clean-card-subtle space-y-0.5">
                              <span className="text-[11px] text-[var(--text-secondary)]">Phí dịch vụ:</span>
                              <div className="font-mono font-semibold">{formatVND(data.fee)}</div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Generic Key-Value Grid
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                        {Object.entries(data).map(([key, val]) => (
                          <div key={key} className="p-2.5 rounded-lg clean-card-subtle space-y-1">
                            <span className="text-[11px] text-[var(--text-secondary)] font-mono">{key}:</span>
                            <div className="font-semibold text-[var(--text-primary)] break-all font-mono text-[11px]">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>
            ) : (
              /* Raw JSON Inspector Mode */
              <div className="space-y-2">
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner max-h-96">
                  {JSON.stringify(selectedLog.details || selectedLog.payload || selectedLog, null, 2)}
                </pre>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)] text-xs">
            Chọn một bản ghi nhật ký từ danh sách trên để xem chi tiết thông tin kiểm toán.
          </div>
        )}
      </div>

    </div>
  );
}
