import { useState, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { X, Mail, Phone, ShieldCheck, ShieldAlert, KeyRound, LogOut, Cpu, Edit3, Check, Save, Camera, Upload } from 'lucide-react';

// Sample curated preset avatars
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80'
];

export default function UserInfoModal({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const updateUserProfile = (partialUser) => {
    const updatedUser = { ...user, ...partialUser };
    localStorage.setItem('ewallet_user', JSON.stringify(updatedUser));
    useAuthStore.setState({ user: updatedUser });
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile({ fullName, phoneNumber });
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Avatar file upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result;
      updateUserProfile({ avatarUrl: base64Url });
      setShowAvatarPicker(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (url) => {
    updateUserProfile({ avatarUrl: url });
    setShowAvatarPicker(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRemoveAvatar = () => {
    updateUserProfile({ avatarUrl: null });
    setShowAvatarPicker(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-modal-overlay backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Right Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-bg-card text-text-primary shadow-2xl border-l border-border-main flex flex-col justify-between transform transition-transform duration-300 ease-in-out animate-slide-left">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-border-main flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar Circle with Camera Overlay */}
            <div className="relative group">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              {/* Edit Avatar Overlay Button */}
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                title="Đổi ảnh đại diện"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-base">{user.fullName}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary clean-card-subtle transition"
            title="Đóng tab"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar Selector Dropdown Modal */}
        {showAvatarPicker && (
          <div className="p-4 bg-bg-card-subtle border-b border-border-main space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Đổi Ảnh Đại Diện
              </span>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="text-[11px] text-text-secondary hover:text-text-primary"
              >
                Đóng
              </button>
            </div>

            {/* Custom Image Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Tải Ảnh Từ Máy
              </button>

              {user.avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  className="py-2 px-3 rounded-xl clean-card-subtle text-red-500 text-xs font-bold hover:bg-red-500/10 transition cursor-pointer"
                >
                  Xóa Ảnh
                </button>
              )}
            </div>

            {/* Preset Avatars */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-text-secondary">Hoặc chọn ảnh có sẵn:</span>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPresetAvatar(url)}
                    className="w-10 h-10 rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition cursor-pointer hover:scale-105"
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Drawer Body - User Details & Edit Form */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> Đã cập nhật thông tin cá nhân!
            </div>
          )}

          <div className="flex items-center justify-between pb-2 border-b border-border-main">
            <span className="font-bold text-sm text-text-secondary uppercase tracking-wider">
              Thông Tin Cá Nhân
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-indigo-500 hover:underline flex items-center gap-1 font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Hủy sửa' : 'Chỉnh sửa'}
            </button>
          </div>

          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Họ và Tên:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full clean-input px-3 py-2 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Số Điện Thoại:</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full clean-input px-3 py-2 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Email (Không thể thay đổi):</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full clean-input px-3 py-2 text-xs font-mono opacity-60 bg-bg-card-subtle"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" /> Lưu Thay Đổi
              </button>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl clean-card-subtle space-y-1">
                <span className="text-[11px] text-text-secondary block">Họ và Tên</span>
                <span className="text-sm font-bold block">{user.fullName}</span>
              </div>

              <div className="p-3.5 rounded-xl clean-card-subtle space-y-1">
                <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Đăng Ký
                </span>
                <span className="text-xs font-mono font-medium block">{user.email}</span>
              </div>

              <div className="p-3.5 rounded-xl clean-card-subtle space-y-1">
                <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Số Điện Thoại
                </span>
                <span className="text-xs font-mono font-medium block">{user.phoneNumber}</span>
              </div>

              <div className="p-3.5 rounded-xl clean-card-subtle space-y-1">
                <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" /> Trạng Thái Tài Khoản
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  {user.status || 'ACTIVE'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl clean-card-subtle space-y-1">
                <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Mã PIN Bảo Mật 6 Số
                </span>
                {user.hasPin ? (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 pt-0.5">
                    <ShieldCheck className="w-4 h-4" /> Đã thiết lập mã PIN
                  </span>
                ) : (
                  <span className="text-amber-500 font-bold text-xs flex items-center gap-1 pt-0.5">
                    <ShieldAlert className="w-4 h-4" /> Chưa tạo mã PIN
                  </span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-border-main space-y-2.5 bg-bg-card-subtle">
          <Link
            to="/security"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl clean-card text-xs font-semibold flex items-center justify-center gap-2 hover:border-emerald-500 transition shadow-sm"
          >
            <KeyRound className="w-4 h-4 text-emerald-500" />
            {user.hasPin ? 'Cài Đặt / Đổi Mã PIN' : 'Tạo Mã PIN Mới'}
          </Link>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            Đăng Xuất Tài Khoản
          </button>
        </div>

      </div>
    </>
  );
}
