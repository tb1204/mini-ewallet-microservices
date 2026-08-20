
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UserDashboardPage from './pages/dashboard/UserDashboardPage';
import SecuritySettingsPage from './pages/profile/SecuritySettingsPage';
import TopUpPage from './pages/transactions/TopUpPage';
import TransferPage from './pages/transactions/TransferPage';
import WithdrawPage from './pages/transactions/WithdrawPage';
import TransactionHistoryPage from './pages/transactions/TransactionHistoryPage';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import WalletManagementPage from './pages/admin/WalletManagementPage';
import SystemTransactionsPage from './pages/admin/SystemTransactionsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

export default function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={
            user?.role === 'ROLE_ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <UserDashboardPage />
            )
          }
        />
        <Route path="/topup" element={<TopUpPage />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/withdraw" element={<WithdrawPage />} />
        <Route path="/history" element={<TransactionHistoryPage />} />
        <Route path="/security" element={<SecuritySettingsPage />} />
      </Route>

      {/* Admin Protected Routes wrapped in AdminLayout */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/wallets" element={<WalletManagementPage />} />
          <Route path="/admin/transactions" element={<SystemTransactionsPage />} />
          <Route path="/admin/roles" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to={user?.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/'} replace />} />
    </Routes>
  );
}
