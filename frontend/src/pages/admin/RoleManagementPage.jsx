import React, { useState } from 'react';
import { ShieldCheck, Search, CheckCircle2, UserCheck, Shield, Users } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function RoleManagementPage() {
  const { registeredUsers, updateUserRole, user: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState('');

  const handleRoleChange = (userId, name, newRole) => {
    try {
      updateUserRole(userId, newRole);
      setMsg(`Đã cập nhật vai trò tài khoản "${name}" thành: ${newRole}`);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = registeredUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="clean-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <ShieldCheck className="w-5 h-5 text-purple-500" />
            Phân Quyền Vai Trò (`identity_db`)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Gán và chuyển đổi nhanh cấp độ truy cập hệ thống giữa `ROLE_USER`, `ROLE_STAFF` và `ROLE_ADMIN`.
          </p>
        </div>
      </div>

      {/* Notice Message */}
      {msg && (
        <div className="clean-card p-3.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {msg}
        </div>
      )}

      {/* Quick Role Legend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clean-card p-4 rounded-2xl border border-[var(--border-main)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-purple-400">QUẢN TRỊ (ADMIN)</div>
            <div className="text-[11px] text-[var(--text-secondary)]">Toàn quyền quản trị hệ thống ví</div>
          </div>
        </div>

        <div className="clean-card p-4 rounded-2xl border border-[var(--border-main)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-indigo-400">NHÂN VIÊN (STAFF)</div>
            <div className="text-[11px] text-[var(--text-secondary)]">Nhân viên vận hành & CSKH</div>
          </div>
        </div>

        <div className="clean-card p-4 rounded-2xl border border-[var(--border-main)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-emerald-500">NGƯỜI DÙNG (USER)</div>
            <div className="text-[11px] text-[var(--text-secondary)]">Khách hàng ví điện tử</div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="clean-card p-6 space-y-4 rounded-2xl border border-[var(--border-main)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Danh Sách Phân Quyền ({filteredUsers.length})
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT..."
              className="w-full clean-input pl-9 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-primary)]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--text-secondary)] font-mono border-b border-[var(--border-main)] uppercase">
              <tr>
                <th className="p-3">Họ & Tên Tài Khoản</th>
                <th className="p-3">Email & Số Điện Thoại</th>
                <th className="p-3">Vai Trò Hiện Tại</th>
                <th className="p-3 text-right">Thao Tác Đổi Vai Trò</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--table-hover-bg)] transition">
                  
                  {/* Name */}
                  <td className="p-3 font-bold text-[var(--text-primary)]">
                    {u.fullName}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-mono font-bold">
                        (Bạn)
                      </span>
                    )}
                  </td>

                  {/* Email & Phone */}
                  <td className="p-3">
                    <div>{u.email}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] font-mono">{u.phoneNumber}</div>
                  </td>

                  {/* Current Role Badge */}
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase ${
                        u.role === 'ROLE_ADMIN'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : u.role === 'ROLE_STAFF'
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                      }`}
                    >
                      {u.role === 'ROLE_ADMIN' ? '👑 ADMIN' : u.role === 'ROLE_STAFF' ? '👔 STAFF' : '👤 USER'}
                    </span>
                  </td>

                  {/* Role Switch Dropdown / Action */}
                  <td className="p-3 text-right">
                    {u.id !== currentUser?.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        
                        <button
                          onClick={() => handleRoleChange(u.id, u.fullName, 'ROLE_USER')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            u.role === 'ROLE_USER'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                              : 'clean-card-subtle text-[var(--text-secondary)] hover:text-emerald-400'
                          }`}
                        >
                          USER
                        </button>

                        <button
                          onClick={() => handleRoleChange(u.id, u.fullName, 'ROLE_STAFF')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            u.role === 'ROLE_STAFF'
                              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 font-bold'
                              : 'clean-card-subtle text-[var(--text-secondary)] hover:text-indigo-400'
                          }`}
                        >
                          STAFF
                        </button>

                        <button
                          onClick={() => handleRoleChange(u.id, u.fullName, 'ROLE_ADMIN')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            u.role === 'ROLE_ADMIN'
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 font-bold'
                              : 'clean-card-subtle text-[var(--text-secondary)] hover:text-purple-400'
                          }`}
                        >
                          ADMIN
                        </button>

                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">Tài khoản hiện tại</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
