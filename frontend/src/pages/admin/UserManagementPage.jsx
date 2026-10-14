import React, { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Users, Search, CheckCircle2, Eye, Edit3, Lock, Unlock, X, 
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Loader2, AlertCircle 
} from 'lucide-react';

/**
 * USER MANAGEMENT PAGE (UserManagementPage)
 * - Standard 7-Column Table Layout: ID, Full Name, Email, Phone Number, Role, Status, Actions
 * - Connected directly to identity-service endpoints via useAuthStore / userApi
 * - Integrated Multi-field Search (ID, Name, Email, Phone) & Dual Filter (Status + Role)
 * - 3-State Sorting Mechanism (Default createdAt DESC -> ASC -> DESC -> Default)
 * - Vietnamese alphabetical sorting support (localeCompare) & Client-side Pagination (5, 10, 20)
 * - Direct User Account Lock/Unlock & User Information / Role Edit Modal
 */
export default function UserManagementPage() {
  const { registeredUsers, fetchAllUsers, toggleUserStatus, updateUserInfo, user: currentUser } = useAuthStore();
  
  // Loading and Error States
  const [isFetching, setIsFetching] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Sorting State (null means default sort by createdAt desc)
  const [sortField, setSortField] = useState(null); 
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals & Feedback
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [msg, setMsg] = useState('');

  // Form State for Edit Modal
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'ROLE_USER'
  });

  // Fetch all users on mount
  useEffect(() => {
    let isMounted = true;
    const loadUsers = async () => {
      setIsFetching(true);
      setErrorMessage('');
      try {
        await fetchAllUsers();
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch users:', err);
          setErrorMessage('Không thể tải danh sách người dùng từ hệ thống.');
        }
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [fetchAllUsers]);

  const handleToggleStatus = async (targetId, name, currentStatus) => {
    setIsActionLoading(true);
    setErrorMessage('');
    try {
      await toggleUserStatus(targetId);
      const newStatus = currentStatus === 'ACTIVE' ? 'Đã khóa' : 'Đã mở khóa';
      setMsg(`Trạng thái tài khoản "${name}": ${newStatus}`);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      setErrorMessage(err.message || 'Lỗi khi thay đổi trạng thái tài khoản');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      fullName: userToEdit.fullName || '',
      email: userToEdit.email || '',
      phoneNumber: userToEdit.phoneNumber || '',
      role: userToEdit.role || 'ROLE_USER'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsActionLoading(true);
    setErrorMessage('');
    try {
      await updateUserInfo(editingUser.id, formData);
      setMsg(`Đã cập nhật thông tin cho "${formData.fullName}"!`);
      setEditingUser(null);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update user:', err);
      setErrorMessage(err.message || 'Lỗi khi cập nhật thông tin người dùng');
    } finally {
      setIsActionLoading(false);
    }
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
  const filteredUsers = useMemo(() => {
    return registeredUsers.filter((u) => {
      const matchesSearch =
        u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phoneNumber.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [registeredUsers, searchTerm, statusFilter, roleFilter]);

  // 2. Sorted Data
  const sortedUsers = useMemo(() => {
    // Default sorting when sortField is null: Sort by createdAt desc (Newest first)
    if (!sortField) {
      return [...filteredUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return [...filteredUsers].sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, 'vi', { sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortOrder]);

  // 3. Paginated Data
  const totalPages = Math.ceil(sortedUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

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
          <Users className="w-5 h-5 text-blue-600" />
          Quản Lý Người Dùng
        </h1>
      </div>

      {/* Notice Message */}
      {msg && (
        <div className="clean-card p-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {msg}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="clean-card p-3 bg-red-500/10 border-red-500/30 text-red-600 text-xs flex items-center gap-2 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          {errorMessage}
        </div>
      )}

      {/* User Table Card */}
      <div className="clean-card p-5 space-y-4 rounded-xl border border-[var(--border-main)]">
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
            Danh Sách Người Dùng ({filteredUsers.length})
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
                placeholder="Tìm theo ID, tên, email, SĐT..."
                className="w-full clean-input pl-9 pr-3 py-1.5 text-xs"
              />
            </div>

            {/* Filter by Status */}
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
              <option value="BLOCKED">Đã khóa</option>
            </select>

            {/* Filter by Role */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="clean-input py-1.5 px-3 text-xs w-full sm:w-auto"
            >
              <option value="ALL">Tất cả Vai Trò</option>
              <option value="ROLE_ADMIN">ADMIN</option>
              <option value="ROLE_STAFF">STAFF</option>
              <option value="ROLE_USER">USER</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-primary)]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--text-secondary)] border-b border-[var(--border-main)] font-medium select-none">
              <tr>
                {/* ID Column Header */}
                <th
                  onClick={() => handleSort('id')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    {renderSortIcon('id')}
                  </div>
                </th>

                {/* Name Header */}
                <th
                  onClick={() => handleSort('fullName')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Họ & Tên</span>
                    {renderSortIcon('fullName')}
                  </div>
                </th>

                {/* Email Header */}
                <th
                  onClick={() => handleSort('email')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Email</span>
                    {renderSortIcon('email')}
                  </div>
                </th>

                {/* Phone Header */}
                <th
                  onClick={() => handleSort('phoneNumber')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Số điện thoại</span>
                    {renderSortIcon('phoneNumber')}
                  </div>
                </th>

                {/* Role Header */}
                <th
                  onClick={() => handleSort('role')}
                  className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Vai trò</span>
                    {renderSortIcon('role')}
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
              {isFetching ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-[var(--text-secondary)] text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--table-hover-bg)] transition">
                    
                    {/* User ID Column */}
                    <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 max-w-[100px] truncate" title={u.id}>
                      {u.id.split('-')[0]}...
                    </td>

                    {/* Name */}
                    <td className="p-3 font-medium text-[var(--text-primary)]">
                      {u.fullName}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium">
                          (Bạn)
                        </span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="p-3 text-[var(--text-secondary)] font-mono">
                      {u.email}
                    </td>

                    {/* Phone */}
                    <td className="p-3 text-[var(--text-secondary)] font-mono">
                      {u.phoneNumber}
                    </td>

                    {/* Role Badge */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          u.role === 'ROLE_ADMIN'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                            : u.role === 'ROLE_STAFF'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {u.role.replace('ROLE_', '')}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-2.5 py-1 rounded-lg clean-card-subtle text-xs font-medium hover:border-slate-400 border border-[var(--border-main)] flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Xem
                        </button>

                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-2.5 py-1 rounded-lg clean-card-subtle text-xs font-medium hover:border-blue-500 border border-[var(--border-main)] flex items-center gap-1 transition cursor-pointer text-blue-600"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Sửa
                        </button>

                        {u.id !== currentUser?.id ? (
                          <button
                            disabled={isActionLoading}
                            onClick={() => handleToggleStatus(u.id, u.fullName, u.status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition cursor-pointer disabled:opacity-50 ${
                              u.status === 'ACTIVE'
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/20'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <Lock className="w-3.5 h-3.5" /> Khóa
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" /> Mở khóa
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)] px-1">Tài khoản bạn</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[var(--text-muted)] text-xs">
                    Không tìm thấy người dùng phù hợp.
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
              Hiển thị {sortedUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, sortedUsers.length)} trong tổng số {sortedUsers.length} người dùng
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

      {/* User Detail View Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="clean-card w-full max-w-md p-5 space-y-4 rounded-xl border border-[var(--border-main)] shadow-xl relative animate-in zoom-in-95 duration-150">
            
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-[var(--text-primary)] flex items-center justify-center font-bold text-sm">
                {selectedUser.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">{selectedUser.fullName}</h3>
                <span className="text-xs text-[var(--text-secondary)] font-mono">{selectedUser.id}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Mã ID đầy đủ:</span>
                <span className="font-mono text-[11px] text-[var(--text-primary)]">{selectedUser.id}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Email:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedUser.email}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Số điện thoại:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedUser.phoneNumber}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Vai trò:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    selectedUser.role === 'ROLE_ADMIN'
                      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                      : selectedUser.role === 'ROLE_STAFF'
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {selectedUser.role.replace('ROLE_', '')}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Mã PIN giao dịch:</span>
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  {selectedUser.role === 'ROLE_USER' 
                    ? (selectedUser.hasPin ? 'Có' : 'Không')
                    : 'Không'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg clean-card-subtle">
                <span className="text-[var(--text-secondary)]">Ngày tham gia:</span>
                <span>{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit User & Assign Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="clean-card w-full max-w-md p-5 space-y-4 rounded-xl border border-[var(--border-main)] shadow-xl relative animate-in zoom-in-95 duration-150">
            
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">Chỉnh Sửa Thông Tin</h3>
                <span className="text-xs text-[var(--text-secondary)] font-mono">{editingUser.id}</span>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Họ & Tên:</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full clean-input px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Địa Chỉ Email:</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full clean-input px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Số Điện Thoại:</label>
                <input
                  type="text"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full clean-input px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Vai Trò (Role):</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full clean-input px-3 py-2 text-xs font-medium"
                >
                  <option value="ROLE_USER">USER (Khách Hàng Ví)</option>
                  <option value="ROLE_STAFF">STAFF (Nhân Viên CSKH)</option>
                  <option value="ROLE_ADMIN">ADMIN (Quản Trị Viên)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 rounded-lg clean-card-subtle border border-[var(--border-main)] font-medium text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
