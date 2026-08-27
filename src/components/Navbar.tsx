import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  GraduationCap,
  Download,
  Upload,
  Palette,
  WifiOff,
  Settings,
  Heart,
  Plus,
} from 'lucide-react';
import { useApp, type AppTheme } from '../context/AppContext';
import { exportDatabaseBackup, importDatabaseBackup, db } from '../db/db';

export const Navbar: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const {
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
  } = useApp();

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('6');

  const themes: { id: AppTheme; label: string; bg: string; dot: string }[] = [
    { id: 'pink', label: 'Hồng Ngọt Ngào', bg: 'from-pink-400 to-rose-400', dot: 'bg-pink-400' },
    { id: 'mint', label: 'Xanh Bạc Hà', bg: 'from-emerald-400 to-teal-400', dot: 'bg-emerald-400' },
    { id: 'lavender', label: 'Tím Mộng Mơ', bg: 'from-purple-400 to-indigo-400', dot: 'bg-purple-400' },
    { id: 'peach', label: 'Cam Đào Xinh', bg: 'from-amber-400 to-orange-400', dot: 'bg-orange-400' },
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      } catch (err) {
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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-400 via-pink-300 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-300/50 transform hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                  Sổ Tay Giáo Viên 4.0
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <WifiOff className="w-3 h-3" /> Offline 100%
                </span>
              </div>
              <p className="text-xs text-pink-700/80 font-medium flex items-center gap-1">
                Trợ thủ đắc lực của cô giáo <Heart className="w-3 h-3 text-pink-500 fill-pink-500 inline" />
              </p>
            </div>
          </div>

          {/* Center Selector: Year & Class */}
          <div className="hidden md:flex items-center gap-3 bg-pink-50/80 p-1.5 rounded-2xl border border-pink-200">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl shadow-xs border border-pink-100">
              <Calendar className="w-4 h-4 text-pink-500" />
              <select
                value={currentYear?.id || ''}
                onChange={(e) => setCurrentYearId(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer pr-2"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isCurrent ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl shadow-xs border border-pink-100">
              {currentClass?.avatarUrl ? (
                <img src={currentClass.avatarUrl} alt="Class Avatar" className="w-4 h-4 rounded-full object-cover shrink-0 border border-pink-300" />
              ) : (
                <GraduationCap className="w-4 h-4 text-pink-500" />
              )}
              <select
                value={currentClass?.id || ''}
                onChange={(e) => setCurrentClassId(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer pr-2"
              >

                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.roomNumber || 'Phòng học'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddClass(true)}
              title="Thêm lớp mới"
              className="p-1.5 rounded-xl hover:bg-pink-200/50 text-pink-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            
            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="Đổi chủ đề màu sắc"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Theme</span>
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-pink-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-xs font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Màu sắc yêu thích
                  </div>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        theme === t.id ? 'bg-pink-50 text-pink-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${t.dot} shadow-xs`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Backup & Export */}
            <button
              onClick={handleExport}
              className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Sao lưu dữ liệu về máy (JSON)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Sao lưu</span>
            </button>

            {/* Restore */}
            <label
              className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Phục hồi dữ liệu từ file"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Nạp lại</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-xs shadow-pink-300 transition-colors"
              title="Cài đặt hệ thống"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

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
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-md shadow-pink-300/50"
                >
                  Tạo lớp ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
