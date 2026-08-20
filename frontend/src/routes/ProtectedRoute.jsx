
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/layout/Navbar';

export default function ProtectedRoute() {
  const { user, token } = useAuthStore();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (user.status === 'BLOCKED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-main) p-4 text-text-primary transition-colors duration-200">
        <div className="clean-card p-8 rounded-2xl max-w-md w-full text-center border-red-500/30">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/40 font-bold text-xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2">Tài khoản bị khóa</h2>
          <p className="text-text-secondary text-sm mb-6">
            Tài khoản của bạn hiện đang ở trạng thái BLOCKED. Vui lòng liên hệ Quản trị viên để biết thêm chi tiết.
          </p>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Quay lại trang Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-main) text-text-primary transition-colors duration-200 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
