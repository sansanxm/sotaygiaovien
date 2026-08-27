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
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  LogOut,
  Crown,
  BookMarked,
} from 'lucide-react';

import { useApp, type AppTheme } from '../context/AppContext';
import { db } from '../db/db';
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
    isVip,
    signOut,
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showEditClass, setShowEditClass] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('6');

  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'timetable', label: 'Thời khóa biểu', icon: <Calendar className="w-5 h-5" />, badge: 'MỚI' },
    { id: 'students', label: 'Danh sách học sinh', icon: <Users className="w-5 h-5" /> },
    { id: 'seating', label: 'Sơ đồ lớp học', icon: <Grid className="w-5 h-5" /> },
    { id: 'attendance', label: 'Sổ điểm danh', icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'behavior', label: 'Nề nếp & thi đua', icon: <Award className="w-5 h-5" />, badge: 'HOT' },
    { id: 'fund', label: 'Thu - chi quỹ lớp', icon: <Wallet className="w-5 h-5" /> },
    { id: 'comments', label: 'Ngân hàng nhận xét', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'notebook', label: 'Sổ ghi chép', icon: <BookMarked className="w-5 h-5" />, badge: 'MỚI' },
    { id: 'random-picker', label: 'Vòng quay may mắn', icon: <Dices className="w-5 h-5" /> },
    { id: 'todos', label: 'Sổ việc cần làm', icon: <CheckSquare className="w-5 h-5" /> },
  ];


  const themes: { id: AppTheme; label: string; dot: string }[] = [
    { id: 'pink', label: '🌸 Hồng dịu dàng', dot: 'bg-pink-400' },
    { id: 'ocean', label: '🌊 Xanh biển lịch lãm', dot: 'bg-blue-500' },
    { id: 'mint', label: '🍃 Xanh bạc hà tươi mát', dot: 'bg-emerald-500' },
    { id: 'lavender', label: '🔮 Tím mộng mơ', dot: 'bg-purple-500' },
    { id: 'peach', label: '🍑 Cam đào ấm áp', dot: 'bg-orange-400' },
    { id: 'slate', label: '🌙 Xám khói hiện đại', dot: 'bg-slate-700' },
  ];

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
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/80 text-sm font-bold text-slate-800 shadow-2xs">
              <Calendar className="w-4 h-4 theme-text shrink-0" />
              <select
                value={currentYear?.id || ''}
                onChange={(e) => setCurrentYearId(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none cursor-pointer truncate font-bold text-sm text-slate-800"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isCurrent ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/80 text-sm font-bold text-slate-800 flex-1 truncate shadow-2xs">
                <GraduationCap className="w-4 h-4 theme-text shrink-0" />
                <select
                  value={currentClass?.id || ''}
                  onChange={(e) => setCurrentClassId(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none cursor-pointer truncate font-bold text-sm text-slate-800"
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
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
                  title="Sửa thông tin lớp học này"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              {/* Add Class Button */}
              <button
                onClick={() => setShowAddClass(true)}
                className="p-2.5 rounded-xl theme-btn-primary text-white shadow-2xs transition-colors cursor-pointer"
                title="Tạo lớp mới"
              >
                <Plus className="w-4 h-4" />
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
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] sm:text-base font-extrabold transition-all duration-200 cursor-pointer ${
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
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>



      {/* Bottom Controls: Ultra-Compact 1-Row Bar */}
      <div className="p-3 border-t theme-card-border theme-soft-bg space-y-2">
        
        {/* Compact User Row when Expanded */}
        {user && !isCollapsed && (
          <div 
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white border theme-card-border flex items-center justify-between gap-2 cursor-pointer hover:border-pink-300 transition-colors shadow-2xs"
            title="Bấm để mở Cài đặt & Đồng bộ Cloud"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full theme-avatar flex items-center justify-center font-bold text-xs shrink-0">
                {(user.user_metadata?.full_name || user.email || 'GV').slice(0, 1).toUpperCase()}
              </div>
              <div className="truncate text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {user.user_metadata?.full_name || 'Giáo viên'}
                  </span>
                  {isVip && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5 shrink-0">
                      <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> VIP
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span
                className={`w-2 h-2 rounded-full ${
                  syncState === 'synced'
                    ? 'bg-emerald-500'
                    : syncState === 'syncing'
                    ? 'bg-amber-500 animate-spin'
                    : 'bg-slate-400'
                }`}
                title={syncState === 'synced' ? 'Đã đồng bộ Cloud' : 'Chưa đồng bộ'}
              />
            </div>
          </div>
        )}

        {/* 1-Row Action Buttons */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Theme Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`w-full p-2.5 rounded-xl bg-white hover:brightness-95 theme-text border theme-card-border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                isCollapsed ? 'px-2' : ''
              }`}
              title="Đổi chủ đề màu sắc"
            >
              <Palette className="w-4 h-4" />
              {!isCollapsed && <span>Giao diện</span>}
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

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 theme-text border theme-card-border shadow-2xs transition-colors cursor-pointer"
            title="Cài đặt hệ thống & Đồng bộ Cloud"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout */}
          {user && (
            <button
              onClick={signOut}
              className="p-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs transition-colors cursor-pointer"
              title="Đăng xuất tài khoản"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
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
              <GraduationCap className="w-5 h-5 text-pink-500" /> Thêm lớp chủ nhiệm mới
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

