
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldAlert } from 'lucide-react';

export default function AdminRoute() {
  const { user } = useAuthStore();

  if (user?.role !== 'ROLE_ADMIN') {
    return (
      <div className="glass-panel p-8 rounded-2xl max-w-lg mx-auto text-center border-amber-500/30 my-12">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/40">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Truy Cập Bị Từ Chối (403 Forbidden)</h2>
        <p className="text-slate-400 text-sm mb-6">
          Trang này chỉ dành cho người dùng có quyền <strong className="text-purple-400">ROLE_ADMIN</strong>. Tài khoản hiện tại của bạn là <strong className="text-indigo-400">{user?.role}</strong>.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <Outlet />;
}
