import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CalendarCheck,
  Menu,
  X,
  Award,
  Wallet,
  Grid,
  BookOpen,
  Dices,
  CheckSquare,
  Settings,
  Cloud,
  Upload,
  Download,
  LogOut,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ActiveTab } from '../types';
import { GoogleAuthModal } from './GoogleAuthModal';

interface Props {
  onOpenSettings: () => void;
}

export const MobileNavigation: React.FC<Props> = ({ onOpenSettings }) => {
  const {
    activeTab,
    setActiveTab,
    currentClass,
    classes,
    setCurrentClassId,
    currentYear,
    user,
    syncState,
    syncWithCloud,
    signOut,
    triggerConfetti,
  } = useApp();

  const [showDrawer, setShowDrawer] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSyncingUpload, setIsSyncingUpload] = useState(false);
  const [isSyncingDownload, setIsSyncingDownload] = useState(false);
  const [showPwaGuide, setShowPwaGuide] = useState(false);

  const mainTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tổng Quan', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'timetable', label: 'Lịch Học', icon: <Calendar className="w-5 h-5" /> },
    { id: 'students', label: 'Học Sinh', icon: <Users className="w-5 h-5" /> },
    { id: 'attendance', label: 'Điểm Danh', icon: <CalendarCheck className="w-5 h-5" /> },
  ];

  const drawerMenuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'behavior', label: 'Nề Nếp & Thi Đua', icon: <Award className="w-5 h-5 text-amber-500" />, badge: 'HOT' },
    { id: 'fund', label: 'Thu - Chi Quỹ Lớp', icon: <Wallet className="w-5 h-5 text-emerald-500" /> },
    { id: 'seating', label: 'Sơ Đồ Lớp Học', icon: <Grid className="w-5 h-5 text-sky-500" /> },
    { id: 'comments', label: 'Ngân Hàng Nhận Xét', icon: <BookOpen className="w-5 h-5 text-purple-500" /> },
    { id: 'random-picker', label: 'Vòng Quay May Mắn', icon: <Dices className="w-5 h-5 text-indigo-500" /> },
    { id: 'todos', label: 'Việc Cần Làm', icon: <CheckSquare className="w-5 h-5 text-teal-500" /> },
  ];

  return (
    <div className="md:hidden">
      {/* 1. Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b theme-card-border px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-xl theme-btn-primary flex items-center justify-center text-white font-black text-sm shrink-0 shadow-2xs">
            🌸
          </div>

          {/* Quick Class Selector */}
          <div className="flex flex-col text-left truncate">
            {classes.length > 0 ? (
              <select
                value={currentClass?.id || ''}
                onChange={(e) => setCurrentClassId(e.target.value)}
                className="font-black text-xs text-slate-800 bg-transparent border-none p-0 focus:outline-none cursor-pointer truncate"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({currentYear?.name || ''})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-black text-xs text-slate-800">Sổ Tay Giáo Viên 4.0</span>
            )}
            <span className="text-[10px] text-slate-400 font-bold">
              {currentClass ? `${currentClass.roomNumber || 'Phòng học'}` : 'Chưa chọn lớp'}
            </span>
          </div>
        </div>

        {/* Top Right: User Sync Dot & Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          {user ? (
            <button
              onClick={() => setShowDrawer(true)}
              className="w-7 h-7 rounded-full theme-avatar flex items-center justify-center font-bold text-xs relative cursor-pointer"
            >
              {(user.user_metadata?.full_name || user.email || 'GV').slice(0, 1).toUpperCase()}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                  syncState === 'synced' ? 'bg-emerald-500' : syncState === 'syncing' ? 'bg-amber-500 animate-spin' : 'bg-slate-400'
                }`}
              />
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="py-1 px-2.5 rounded-xl theme-btn-secondary text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" /> Đăng nhập
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-slate-100 hover:brightness-95 text-slate-600 transition-colors cursor-pointer"
            title="Cài đặt"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t theme-card-border px-2 py-1.5 flex items-center justify-around shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id && !showDrawer;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowDrawer(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive ? 'theme-text font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'theme-soft-bg theme-text' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}

        {/* 5th Tab: "Thêm" (More Menu Drawer) */}
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            showDrawer ? 'theme-text font-black scale-105' : 'text-slate-400 font-bold hover:text-slate-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${showDrawer ? 'theme-soft-bg theme-text' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Thêm</span>
        </button>
      </nav>

      {/* 3. Mobile Slide-Over Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl border-t theme-card-border animate-in slide-in-from-bottom duration-250">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl theme-soft-bg theme-text">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Tính Năng & Tiện Ích</h3>
                  <p className="text-[11px] text-slate-400 font-bold">Toàn bộ công cụ quản lý lớp học 4.0</p>
                </div>
              </div>

              <button
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Account & Cloud Sync Box */}
            {user ? (
              <div className="p-3.5 rounded-2xl theme-soft-bg border theme-card-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full theme-btn-primary flex items-center justify-center font-bold text-sm">
                      {(user.user_metadata?.full_name || user.email || 'GV').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800">{user.user_metadata?.full_name || 'Giáo viên'}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{user.email}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      signOut();
                      setShowDrawer(false);
                    }}
                    className="p-1.5 rounded-xl bg-white text-slate-400 hover:text-rose-600 border border-slate-200 cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Sync & Restore Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    disabled={isSyncingUpload}
                    onClick={async () => {
                      setIsSyncingUpload(true);
                      const ok = await syncWithCloud('upload');
                      setIsSyncingUpload(false);
                      if (ok) {
                        triggerConfetti();
                        alert('✅ Đã sao lưu và ghi đè dữ liệu lên Cloud thành công!');
                      }
                    }}
                    className="py-2 px-3 rounded-xl theme-btn-primary text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                  >
                    <Upload className={`w-3.5 h-3.5 ${isSyncingUpload ? 'animate-spin' : ''}`} />
                    <span>{isSyncingUpload ? 'Đang lưu...' : 'Sao lưu'}</span>
                  </button>

                  <button
                    disabled={isSyncingDownload}
                    onClick={async () => {
                      if (window.confirm('Tải dữ liệu từ Cloud về máy này? Dữ liệu trên máy sẽ được cập nhật.')) {
                        setIsSyncingDownload(true);
                        const ok = await syncWithCloud('download');
                        setIsSyncingDownload(false);
                        if (ok) {
                          triggerConfetti();
                          alert('✅ Đã khôi phục dữ liệu từ Cloud về máy thành công!');
                        }
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                  >
                    <Download className={`w-3.5 h-3.5 ${isSyncingDownload ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDownload ? 'Đang tải...' : 'Khôi phục'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl theme-soft-bg border theme-card-border text-center space-y-2">
                <p className="text-xs text-slate-700 font-bold">Đăng nhập để đồng bộ dữ liệu đa thiết bị</p>
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setShowDrawer(false);
                  }}
                  className="w-full py-2.5 rounded-xl theme-btn-primary text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Cloud className="w-4 h-4" /> Đăng Nhập / Tạo Tài Khoản
                </button>
              </div>
            )}

            {/* Menu Grid (6 core utilities) */}
            <div className="grid grid-cols-2 gap-2.5">
              {drawerMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowDrawer(false);
                  }}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-2.5 text-left cursor-pointer ${
                    activeTab === item.id
                      ? 'border-emerald-500 theme-soft-bg theme-text font-black shadow-xs'
                      : 'border-slate-100 bg-slate-50/70 hover:brightness-95 text-slate-700 font-bold'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0">
                    {item.icon}
                  </div>
                  <div className="truncate">
                    <div className="text-xs leading-tight">{item.label}</div>
                    {item.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full theme-badge">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* PWA Install Guide Button */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setShowPwaGuide(!showPwaGuide)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>Hướng dẫn cài vào Điện Thoại</span>
              </button>

              <button
                onClick={() => {
                  onOpenSettings();
                  setShowDrawer(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span>Cài Đặt</span>
              </button>
            </div>

            {/* PWA Guide Modal Content */}
            {showPwaGuide && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2 text-xs text-indigo-950 animate-in fade-in">
                <h4 className="font-black flex items-center gap-1.5 text-indigo-900">
                  📱 Cách cài App chạy như thật trên Điện Thoại:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-indigo-900/90 leading-relaxed font-semibold">
                  <li><strong>iPhone (Safari):</strong> Bấm nút <strong>Chia sẻ 📤</strong> ở chân Safari ➡️ Chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.</li>
                  <li><strong>Android (Chrome):</strong> Bấm nút <strong>⋮ (3 chấm)</strong> góc trên ➡️ Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào MH chính"</strong>.</li>
                </ul>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};
