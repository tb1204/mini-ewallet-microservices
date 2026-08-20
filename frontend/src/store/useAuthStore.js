import { create } from 'zustand';

// Initial Mock Users dựa trên identity_db schema
const initialUsers = [
  {
    id: 'u1111111-1111-1111-1111-111111111111',
    email: 'user@ewallet.com',
    phoneNumber: '0987654321',
    fullName: 'Nguyễn Văn User',
    role: 'ROLE_USER',
    status: 'ACTIVE',
    hasPin: true,
    pinCode: '123456',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 's8888888-8888-8888-8888-888888888888',
    email: 'staff@ewallet.com',
    phoneNumber: '0912345678',
    fullName: 'Trần Thị Nhân Viên (Staff)',
    role: 'ROLE_STAFF',
    status: 'ACTIVE',
    hasPin: true,
    pinCode: '112233',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'a9999999-9999-9999-9999-999999999999',
    email: 'admin@ewallet.com',
    phoneNumber: '0901234567',
    fullName: 'Quản Trị Viên (Admin)',
    role: 'ROLE_ADMIN',
    status: 'ACTIVE',
    hasPin: true,
    pinCode: '654321',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
  },
  {
    id: 'u2222222-2222-2222-2222-222222222222',
    email: 'le.van.b@ewallet.com',
    phoneNumber: '0933445566',
    fullName: 'Lê Văn B',
    role: 'ROLE_USER',
    status: 'BLOCKED',
    hasPin: false,
    pinCode: null,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('ewallet_user')) || null,
  token: localStorage.getItem('ewallet_token') || null,
  registeredUsers: JSON.parse(localStorage.getItem('ewallet_mock_users')) || initialUsers,
  
  // Login action
  login: async (emailOrPhone, password) => {
    const { registeredUsers } = get();
    await new Promise((resolve) => setTimeout(resolve, 600));

    const foundUser = registeredUsers.find(
      (u) => (u.email === emailOrPhone || u.phoneNumber === emailOrPhone)
    );

    if (!foundUser) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác!');
    }

    if (foundUser.status === 'BLOCKED') {
      throw new Error('Tài khoản của bạn đã bị KHÓA bởi Quản trị viên!');
    }

    const mockToken = `jwt-token-${foundUser.id}-${Date.now()}`;
    const userToSave = {
      id: foundUser.id,
      email: foundUser.email,
      phoneNumber: foundUser.phoneNumber,
      fullName: foundUser.fullName,
      role: foundUser.role,
      status: foundUser.status,
      hasPin: !!foundUser.hasPin,
    };

    localStorage.setItem('ewallet_user', JSON.stringify(userToSave));
    localStorage.setItem('ewallet_token', mockToken);

    set({ user: userToSave, token: mockToken });
    return userToSave;
  },

  // Register action
  register: async ({ fullName, email, phoneNumber, password }) => {
    const { registeredUsers } = get();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const exists = registeredUsers.some(
      (u) => u.email === email || u.phoneNumber === phoneNumber
    );

    if (exists) {
      throw new Error('Email hoặc Số điện thoại đã được đăng ký trước đó!');
    }

    const newUser = {
      id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      email,
      phoneNumber,
      fullName,
      role: 'ROLE_USER',
      status: 'ACTIVE',
      hasPin: false,
      pinCode: null,
      createdAt: new Date().toISOString()
    };

    const updatedList = [...registeredUsers, newUser];
    localStorage.setItem('ewallet_mock_users', JSON.stringify(updatedList));

    set({ registeredUsers: updatedList });
    return get().login(email, password);
  },

  // Set Security PIN
  setupPin: async (pinCode) => {
    const { user, registeredUsers } = get();
    if (!user) throw new Error('Chưa đăng nhập!');
    if (!/^\d{6}$/.test(pinCode)) {
      throw new Error('Mã PIN phải bao gồm 6 chữ số!');
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    const updatedUsers = registeredUsers.map((u) => {
      if (u.id === user.id) {
        return { ...u, hasPin: true, pinCode };
      }
      return u;
    });

    const updatedUser = { ...user, hasPin: true };

    localStorage.setItem('ewallet_mock_users', JSON.stringify(updatedUsers));
    localStorage.setItem('ewallet_user', JSON.stringify(updatedUser));

    set({ user: updatedUser, registeredUsers: updatedUsers });
    return true;
  },

  // Change PIN
  changePin: async (oldPinCode, newPinCode) => {
    const { user, registeredUsers, verifyPin } = get();
    if (!user) throw new Error('Chưa đăng nhập!');

    if (user.hasPin) {
      const isOldValid = await verifyPin(oldPinCode);
      if (!isOldValid) {
        throw new Error('Mã PIN hiện tại không chính xác!');
      }
    }

    if (!/^\d{6}$/.test(newPinCode)) {
      throw new Error('Mã PIN mới phải bao gồm đúng 6 chữ số!');
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    const updatedUsers = registeredUsers.map((u) => {
      if (u.id === user.id) {
        return { ...u, hasPin: true, pinCode: newPinCode };
      }
      return u;
    });

    const updatedUser = { ...user, hasPin: true };

    localStorage.setItem('ewallet_mock_users', JSON.stringify(updatedUsers));
    localStorage.setItem('ewallet_user', JSON.stringify(updatedUser));

    set({ user: updatedUser, registeredUsers: updatedUsers });
    return true;
  },

  // Send OTP
  sendPinResetOtp: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return '666888';
  },

  // Reset PIN
  resetPinWithOtp: async (otpCode, newPinCode) => {
    const { user, registeredUsers } = get();
    if (!user) throw new Error('Chưa đăng nhập!');

    if (!/^\d{6}$/.test(otpCode)) {
      throw new Error('Mã OTP xác thực phải đúng 6 chữ số!');
    }

    if (!/^\d{6}$/.test(newPinCode)) {
      throw new Error('Mã PIN mới phải bao gồm đúng 6 chữ số!');
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedUsers = registeredUsers.map((u) => {
      if (u.id === user.id) {
        return { ...u, hasPin: true, pinCode: newPinCode };
      }
      return u;
    });

    const updatedUser = { ...user, hasPin: true };

    localStorage.setItem('ewallet_mock_users', JSON.stringify(updatedUsers));
    localStorage.setItem('ewallet_user', JSON.stringify(updatedUser));

    set({ user: updatedUser, registeredUsers: updatedUsers });
    return true;
  },

  // Verify PIN
  verifyPin: async (pinCode) => {
    const { user, registeredUsers } = get();
    if (!user) return false;
    const found = registeredUsers.find((u) => u.id === user.id);
    return found && found.pinCode === pinCode;
  },

  // Admin action: Toggle User Lock Status
  toggleUserStatus: (targetUserId) => {
    const { registeredUsers, user } = get();
    if (user?.role !== 'ROLE_ADMIN') {
      throw new Error('Chỉ Quản trị viên mới có quyền thực hiện!');
    }

    const updatedList = registeredUsers.map((u) => {
      if (u.id === targetUserId) {
        const newStatus = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        return { ...u, status: newStatus };
      }
      return u;
    });

    localStorage.setItem('ewallet_mock_users', JSON.stringify(updatedList));
    set({ registeredUsers: updatedList });
  },

  // Admin action: Update User Role
  updateUserRole: (targetUserId, newRole) => {
    const { registeredUsers, user } = get();
    if (user?.role !== 'ROLE_ADMIN') {
      throw new Error('Chỉ Quản trị viên mới có quyền đổi vai trò!');
    }

    const updatedList = registeredUsers.map((u) => {
      if (u.id === targetUserId) {
        return { ...u, role: newRole };
      }
      return u;
    });

    localStorage.setItem('ewallet_mock_users', JSON.stringify(updatedList));
    set({ registeredUsers: updatedList });
  },

  // Admin action: Full Edit User Info & Role
  updateUserInfo: (targetUserId, { fullName, email, phoneNumber, role }) => {
    const { registeredUsers, user } = get();
    if (user?.role !== 'ROLE_ADMIN') {
      throw new Error('Chỉ Quản trị viên mới có quyền chỉnh sửa!');
    }

    const updatedList = registeredUsers.map((u) => {
      if (u.id === targetUserId) {
        return { ...u, fullName, email, phoneNumber, role };
      }
      return u;
    });

    localStorage.setItem('ewallet_mock_users', JSON.stringify(updatedList));
    
    // Check if updating currently logged in admin user
    if (user && user.id === targetUserId) {
      const updatedCurrentUser = { ...user, fullName, email, phoneNumber, role };
      localStorage.setItem('ewallet_user', JSON.stringify(updatedCurrentUser));
      set({ user: updatedCurrentUser });
    }

    set({ registeredUsers: updatedList });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('ewallet_user');
    localStorage.removeItem('ewallet_token');
    set({ user: null, token: null });
  }
}));
