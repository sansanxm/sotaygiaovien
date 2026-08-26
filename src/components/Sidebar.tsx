import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Grid,
  CalendarCheck,
  Award,
  Wallet,
  BookOpen,
  Dices,
  CheckSquare,
  Sparkles,
  Calendar,
  GraduationCap,
  Download,
  Upload,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Cloud,
  LogOut,
  Crown,
} from 'lucide-react';


import { useApp, type AppTheme } from '../context/AppContext';
import { exportDatabaseBackup, importDatabaseBackup, db } from '../db/db';
import type { ActiveTab } from '../types';
import { EditClassModal } from './EditClassModal';
import { GoogleAuthModal } from './GoogleAuthModal';


interface Props {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<Props> = ({ onOpenSettings }) => {
  const {
    activeTab,
    setActiveTab,
    theme,
    setTheme,
    years,
    currentYear,
    setCurrentYearId,
    classes,
    currentClass,
    setCurrentClassId,
    refreshAppData,
    triggerConfetti,
    user,
    syncState,
    lastSyncedAt,
    isVip,
    setShowVipModal,
    syncWithCloud,
    signOut,
  } = useApp();


  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showEditClass, setShowEditClass] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSyncingUpload, setIsSyncingUpload] = useState(false);
  const [isSyncingDownload, setIsSyncingDownload] = useState(false);
  const [newClassName, setNewClassName] = useState('');



  const [newClassGrade, setNewClassGrade] = useState('6');

  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Tổng Quan', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'timetable', label: 'Thời Khóa Biểu', icon: <Calendar className="w-5 h-5" />, badge: 'MỚI' },
    { id: 'students', label: 'Danh Sách Học Sinh', icon: <Users className="w-5 h-5" /> },
    { id: 'seating', label: 'Sơ Đồ Lớp Học', icon: <Grid className="w-5 h-5" /> },
    { id: 'attendance', label: 'Sổ Điểm Danh', icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'behavior', label: 'Nề Nếp & Thi Đua', icon: <Award className="w-5 h-5" />, badge: 'HOT' },
    { id: 'fund', label: 'Thu - Chi Quỹ Lớp', icon: <Wallet className="w-5 h-5" /> },
    { id: 'comments', label: 'Ngân Hàng Nhận Xét', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'random-picker', label: 'Vòng Quay May Mắn', icon: <Dices className="w-5 h-5" /> },
    { id: 'todos', label: 'Sổ Việc Cần Làm', icon: <CheckSquare className="w-5 h-5" /> },
  ];


  const themes: { id: AppTheme; label: string; dot: string }[] = [
    { id: 'pink', label: '🌸 Hồng Dịu Dàng', dot: 'bg-pink-400' },
    { id: 'ocean', label: '🌊 Xanh Biển Lịch Lãm', dot: 'bg-blue-500' },
    { id: 'mint', label: '🍃 Xanh Bạc Hà Tươi Mát', dot: 'bg-emerald-500' },
    { id: 'lavender', label: '🔮 Tím Mộng Mơ', dot: 'bg-purple-500' },
    { id: 'peach', label: '🍑 Cam Đào Ấm Áp', dot: 'bg-orange-400' },
    { id: 'slate', label: '🌙 Xám Khói Hiện Đại', dot: 'bg-slate-700' },
  ];


  const handleExport = async () => {
    try {
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `SaoLuu_GVCN_${currentClass?.name || 'Data'}_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      triggerConfetti();
      alert('Đã xuất file sao lưu an toàn về máy tính!');
    } catch {
      alert('Có lỗi khi xuất file sao lưu!');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importDatabaseBackup(content);
        await refreshAppData();
        triggerConfetti();
        alert('Phục hồi dữ liệu thành công!');
      } catch {
        alert('File không hợp lệ hoặc bị lỗi!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleQuickAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !currentYear) return;

    const newId = `class-${Date.now()}`;
    await db.classes.add({
      id: newId,
      yearId: currentYear.id,
      name: newClassName.trim(),
      grade: parseInt(newClassGrade, 10) || 6,
      roomNumber: 'Phòng học mới',
      homeroomTeacher: 'Cô giáo',
      totalDesks: 16,
      rows: 4,
      cols: 4,
    });
    setNewClassName('');
    setShowAddClass(false);
    await refreshAppData();
    setCurrentClassId(newId);
    triggerConfetti();
  };

  return (
    <aside
      className={`hidden md:flex h-screen sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-r border-pink-200/80 shadow-lg flex-col justify-between transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >

      
      {/* Top Section: Logo, Collapse Button & Class Selectors */}
      <div className="p-4 border-b border-pink-100/80 space-y-3">
        
        {/* Brand Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-11 h-11 shrink-0 rounded-2xl theme-btn-primary flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-black text-lg tracking-tight theme-text block truncate">
                  Sổ tay Giáo viên 4.0
                </span>
              </div>
            )}


          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Year & Class Selector Card (Only when expanded) */}
        {!isCollapsed && (
          <div className="space-y-2 theme-soft-bg p-3 rounded-2xl border theme-card-border">
            {/* Year */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/60 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 theme-text shrink-0" />
              <select
                value={currentYear?.id || ''}
                onChange={(e) => setCurrentYearId(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none cursor-pointer truncate"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isCurrent ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/60 text-xs font-bold text-slate-700 flex-1 truncate">
                <GraduationCap className="w-4 h-4 theme-text shrink-0" />
                <select
                  value={currentClass?.id || ''}
                  onChange={(e) => setCurrentClassId(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none cursor-pointer truncate"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.roomNumber || 'Phòng học'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Class Button */}
              {currentClass && (
                <button
                  onClick={() => setShowEditClass(true)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
                  title="Sửa thông tin lớp học này"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Add Class Button */}
              <button
                onClick={() => setShowAddClass(true)}
                className="p-2 rounded-xl theme-btn-primary text-white shadow-2xs transition-colors cursor-pointer"
                title="Tạo lớp mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}


      </div>

      {/* Middle Section: Vertical Menu Items with Scroll */}
      <nav className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm sm:text-[15px] font-extrabold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'theme-sidebar-active scale-[1.02]'
                  : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>



      {/* Bottom Controls: Theme, Backup, Settings & Account */}
      <div className="p-3 border-t theme-card-border theme-soft-bg space-y-2">
        
        {/* User Profile / Google Sync Card */}
        <div className="bg-white p-2.5 rounded-2xl border theme-card-border shadow-2xs space-y-2">
          {user ? (
            <div className="space-y-2">
              {/* User Header Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border theme-card-border shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full theme-avatar flex items-center justify-center font-bold text-xs shrink-0">
                      {(user.user_metadata?.full_name || user.email || 'GV').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  {!isCollapsed && (
                    <div className="truncate text-left">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {user.user_metadata?.full_name || 'Giáo viên'}
                        </span>
                        {isVip && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5 shrink-0">
                            <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> VIP
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        {user.email}
                      </div>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <button
                    onClick={signOut}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Đăng xuất tài khoản"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* VIP Upgrade Banner (for Free users) */}
              {!isVip && !isCollapsed && (
                <button
                  onClick={() => setShowVipModal(true)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:brightness-105 text-white font-black text-[11px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
                  title="Nâng cấp VIP tự động qua VietQR"
                >
                  <Crown className="w-3.5 h-3.5 fill-white" />
                  <span>Nâng Cấp VIP (Quét QR 3s)</span>
                </button>
              )}


              {/* 2 Buttons: Sao lưu & Khôi phục (Nằm ngay dưới email) */}
              {!isCollapsed ? (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    disabled={isSyncingUpload || isSyncingDownload}
                    onClick={async () => {
                      setIsSyncingUpload(true);
                      const ok = await syncWithCloud('upload');
                      setIsSyncingUpload(false);
                      if (ok) {
                        triggerConfetti();
                        alert('✅ Đã sao lưu và ghi đè dữ liệu hiện tại lên Cloud thành công!');
                      } else {
                        alert('❌ Không thể sao lưu. Vui lòng kiểm tra kết nối mạng.');
                      }
                    }}
                    className="py-1.5 px-2 rounded-xl theme-btn-secondary font-extrabold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                    title="Sao lưu toàn bộ dữ liệu máy này lên Cloud (Ghi đè bản cũ)"
                  >
                    <Upload className={`w-3.5 h-3.5 shrink-0 ${isSyncingUpload ? 'animate-spin' : ''}`} />
                    <span>{isSyncingUpload ? 'Đang lưu...' : 'Sao lưu'}</span>
                  </button>

                  <button
                    disabled={isSyncingUpload || isSyncingDownload}
                    onClick={async () => {
                      if (
                        window.confirm(
                          '⚠️ KHÔI PHỤC DỮ LIỆU TỪ CLOUD?\n\nThao tác này sẽ tải bản sao lưu từ Cloud về và cập nhật toàn bộ dữ liệu trên máy tính này. Bạn có muốn tiếp tục?'
                        )
                      ) {
                        setIsSyncingDownload(true);
                        const ok = await syncWithCloud('download');
                        setIsSyncingDownload(false);
                        if (ok) {
                          triggerConfetti();
                          alert('✅ Đã khôi phục toàn bộ dữ liệu từ Cloud về máy tính thành công!');
                        } else {
                          alert('❌ Không thể khôi phục. Vui lòng kiểm tra kết nối mạng.');
                        }
                      }
                    }}
                    className="py-1.5 px-2 rounded-xl theme-btn-secondary font-extrabold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                    title="Tải bản sao lưu từ Cloud về máy tính này khi sang máy khác"
                  >
                    <Download className={`w-3.5 h-3.5 shrink-0 ${isSyncingDownload ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDownload ? 'Đang tải...' : 'Khôi phục'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    disabled={isSyncingUpload || isSyncingDownload}
                    onClick={async () => {
                      setIsSyncingUpload(true);
                      await syncWithCloud('upload');
                      setIsSyncingUpload(false);
                      triggerConfetti();
                    }}
                    className="p-1.5 rounded-lg theme-soft-bg theme-text hover:brightness-95 flex items-center justify-center cursor-pointer"
                    title="Sao lưu lên Cloud"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={isSyncingUpload || isSyncingDownload}
                    onClick={async () => {
                      if (window.confirm('Tải dữ liệu từ Cloud về máy này?')) {
                        setIsSyncingDownload(true);
                        await syncWithCloud('download');
                        setIsSyncingDownload(false);
                        triggerConfetti();
                      }
                    }}
                    className="p-1.5 rounded-lg theme-soft-bg theme-text hover:brightness-95 flex items-center justify-center cursor-pointer"
                    title="Khôi phục từ Cloud"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Status Bar */}
              {!isCollapsed && (
                <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        syncState === 'synced'
                          ? 'bg-emerald-500'
                          : syncState === 'syncing'
                          ? 'bg-amber-500 animate-spin'
                          : syncState === 'offline'
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-slate-600">
                      {syncState === 'synced'
                        ? 'Đã đồng bộ Cloud'
                        : syncState === 'syncing'
                        ? 'Đang đồng bộ...'
                        : syncState === 'offline'
                        ? 'Ngoại tuyến'
                        : 'Cục bộ'}
                    </span>
                  </span>
                  {lastSyncedAt && (
                    <span className="text-slate-400 font-normal">
                      {lastSyncedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (

            <div>
              <button
                onClick={() => setShowAuthModal(true)}
                className={`w-full py-2.5 px-2.5 rounded-xl theme-btn-primary font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                  isCollapsed ? 'px-2' : ''
                }`}
                title="Đăng nhập hoặc tạo tài khoản để đồng bộ Cloud"
              >
                <Cloud className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Đăng Nhập / Đăng Ký</span>}
              </button>
            </div>
          )}

        </div>


        {/* Theme Menu & Backup Row */}
        <div className="flex items-center justify-between gap-1">
          
          {/* Theme Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`w-full p-2 rounded-xl bg-white hover:brightness-95 theme-text border theme-card-border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isCollapsed ? 'px-2' : ''
              }`}
              title="Đổi chủ đề màu sắc"
            >
              <Palette className="w-4 h-4" />
              {!isCollapsed && <span>Theme</span>}
            </button>

            {showThemeMenu && (
              <div className="absolute bottom-12 left-0 w-48 bg-white rounded-2xl shadow-2xl border theme-card-border p-2 z-50 animate-in slide-in-from-bottom-2">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Màu sắc yêu thích
                </div>
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                      theme === t.id ? 'theme-soft-bg theme-text font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Backup */}
          <button
            onClick={handleExport}
            className="p-2 rounded-xl bg-white hover:brightness-95 theme-text border theme-card-border text-xs font-bold transition-colors cursor-pointer"
            title="Sao lưu dữ liệu JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Restore */}
          <label
            className="p-2 rounded-xl bg-white hover:brightness-95 theme-text border theme-card-border text-xs font-bold transition-colors cursor-pointer"
            title="Phục hồi dữ liệu JSON"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-xs transition-colors cursor-pointer"
            title="Cài đặt hệ thống"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />



      {/* Modal Quick Add Class */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-pink-200 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-pink-800 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-pink-500" /> Thêm Lớp Chủ Nhiệm Mới
            </h3>
            <form onSubmit={handleQuickAddClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên lớp học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 6A2, 10C1, 1A..."
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm font-semibold"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Khối lớp</label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm font-semibold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-md shadow-pink-300/50 cursor-pointer"
                >
                  Tạo lớp ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Class */}
      <EditClassModal
        isOpen={showEditClass}
        onClose={() => setShowEditClass(false)}
        targetClass={currentClass}
        onUpdated={refreshAppData}
      />

    </aside>
  );
};

