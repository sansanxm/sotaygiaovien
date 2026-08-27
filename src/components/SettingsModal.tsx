import React, { useState, useEffect } from 'react';
import {
  Settings,
  Calendar,
  GraduationCap,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Plus,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Palette,
  UserCheck,
  Database,
  CheckCircle2,
  Cloud,
  LogOut,
  Crown,
  Zap,
  BookOpen,
} from 'lucide-react';

import { useApp, THEME_CONFIGS } from '../context/AppContext';
import { db, exportDatabaseBackup, importDatabaseBackup } from '../db/db';
import { GoogleAuthModal } from './GoogleAuthModal';
import { adminGoogleSync } from '../services/supabase';
import type { TeacherTitle, AppTheme } from '../types';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    theme,
    setTheme,
    teacherTitle,
    setTeacherTitle,
    teacherName,
    setTeacherName,
    teacherAvatar,
    teacherCover,
    years,
    classes,
    currentYear,
    setCurrentYearId,
    refreshAppData,
    triggerConfetti,

    user,
    syncState,
    lastSyncedAt,
    isVip,
    activateVip,
    setShowVipModal,
    syncWithCloud,

    signOut,
    clearAllData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'cloud' | 'vip' | 'years' | 'classes' | 'backup' | 'guide'>('profile');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const [manualKeyInput, setManualKeyInput] = useState('');
  const [keyResult, setKeyResult] = useState<{ success: boolean; message: string } | null>(null);






  // Stats of Database
  const [dbStats, setDbStats] = useState({
    yearsCount: 0,
    classesCount: 0,
    studentsCount: 0,
    attendanceCount: 0,
    behaviorCount: 0,
    fundCount: 0,
    seatsCount: 0,
    todosCount: 0,
  });

  // Add Year form
  const [newYearName, setNewYearName] = useState('');
  // Add Class form
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState(teacherName || 'Giáo viên');
  const [newClassGrade, setNewClassGrade] = useState('6');
  const [newClassRoom, setNewClassRoom] = useState('Phòng 204');
  const [newClassType, setNewClassType] = useState<'gvcn' | 'bomon'>('gvcn');
  const [newClassSubject, setNewClassSubject] = useState('');

  useEffect(() => {
    if (isOpen) {
      const loadStats = async () => {
        setDbStats({
          yearsCount: await db.years.count(),
          classesCount: await db.classes.count(),
          studentsCount: await db.students.count(),
          attendanceCount: await db.attendance.count(),
          behaviorCount: await db.behaviorLogs.count(),
          fundCount: await db.fundTransactions.count(),
          seatsCount: await db.seats.count(),
          todosCount: await db.todos.count(),
        });
      };
      loadStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim()) return;

    const newYearId = `year-${Date.now()}`;
    await db.years.add({
      id: newYearId,
      name: newYearName.trim(),
      isCurrent: false,
      startDate: `${new Date().getFullYear()}-09-05`,
      endDate: `${new Date().getFullYear() + 1}-05-31`,
    });

    setNewYearName('');
    await refreshAppData();
    triggerConfetti();
  };

  const handleSetCurrentYear = async (yearId: string) => {
    const allYears = await db.years.toArray();
    for (const y of allYears) {
      await db.years.update(y.id, { isCurrent: y.id === yearId });
    }
    setCurrentYearId(yearId);
    await refreshAppData();
  };

  const handleDeleteYear = async (yearId: string, name: string) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn xóa năm học "${name}" và toàn bộ lớp học của năm này?`)) {
      await db.years.delete(yearId);
      const linkedClasses = await db.classes.where('yearId').equals(yearId).toArray();
      for (const c of linkedClasses) {
        await db.students.where('classId').equals(c.id).delete();
        await db.attendance.where('classId').equals(c.id).delete();
        await db.behaviorLogs.where('classId').equals(c.id).delete();
        await db.fundTransactions.where('classId').equals(c.id).delete();
        await db.seats.where('classId').equals(c.id).delete();
        await db.classes.delete(c.id);
      }
      await refreshAppData();
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !currentYear) return;

    const newClassId = `class-${Date.now()}`;
    await db.classes.add({
      id: newClassId,
      yearId: currentYear.id,
      name: newClassName.trim(),
      grade: Number(newClassGrade) || 6,
      classType: newClassType,
      subject: newClassType === 'bomon' ? (newClassSubject.trim() || 'Bộ môn') : '',
      roomNumber: newClassRoom.trim() || 'Phòng học',
      homeroomTeacher: newClassTeacher.trim() || (newClassType === 'bomon' ? 'GV Giảng dạy' : `${teacherTitle} ${teacherName}`),
      totalDesks: 16,
      rows: 4,
      cols: 4,
    });

    setNewClassName('');
    setNewClassSubject('');
    await refreshAppData();
    triggerConfetti();
  };

  const handleDeleteClass = async (classId: string, name: string) => {
    if (window.confirm(`Xóa lớp "${name}" và toàn bộ dữ liệu học sinh của lớp?`)) {
      await db.classes.delete(classId);
      await db.students.where('classId').equals(classId).delete();
      await db.attendance.where('classId').equals(classId).delete();
      await db.behaviorLogs.where('classId').equals(classId).delete();
      await db.fundTransactions.where('classId').equals(classId).delete();
      await db.seats.where('classId').equals(classId).delete();
      await refreshAppData();
    }
  };

  const handleExport = async () => {
    const json = await exportDatabaseBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `SaoLuu_ToanBo_GVCN_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerConfetti();
    alert(`Sao lưu thành công toàn bộ ${dbStats.studentsCount} học sinh và dữ liệu hệ thống!`);
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
        alert('Phục hồi dữ liệu thành công 100%!');
      } catch {
        alert('File sao lưu không hợp lệ hoặc bị lỗi!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAllData = async () => {
    if (
      window.confirm(
        '⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA SẠCH DỮ LIỆU MẪU?\n\nThao tác này sẽ xóa sạch toàn bộ lớp mẫu 6A1, học sinh, điểm danh, quỹ tiền... và tự động đồng bộ làm mới lên Google Drive để bạn bắt đầu năm học mới từ đầu.'
      )
    ) {
      await clearAllData();
      triggerConfetti();
      alert('Đã xóa sạch toàn bộ dữ liệu mẫu và làm mới Đám Mây thành công 100%! Bây giờ bạn có thể bắt đầu tạo lớp và thêm học sinh thật của mình.');
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Khôi phục về dữ liệu mẫu ban đầu (Lớp 6A1, học sinh, điểm danh mẫu)?')) {
      localStorage.removeItem('gvcn_has_seeded');
      await db.delete();
      window.location.reload();
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-pink-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">Cài đặt hệ thống & tùy biến</h3>
              <p className="text-xs text-pink-100 font-medium">Tùy biến Thầy/Cô, màu sắc và sao lưu toàn diện</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-pink-100 bg-pink-50/50 px-6 pt-3 gap-2 overflow-x-auto">
          {[
            { id: 'profile', label: '🎨 Giao diện & danh xưng', icon: <Palette className="w-4 h-4" /> },
            { id: 'vip', label: '👑 Bản quyền & VietQR', icon: <Crown className="w-4 h-4 text-amber-500" /> },
            { id: 'cloud', label: '☁️ Đồng bộ Google & đám mây', icon: <Cloud className="w-4 h-4" /> },
            { id: 'years', label: 'Năm học', icon: <Calendar className="w-4 h-4" /> },
            { id: 'classes', label: 'Lớp học', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'backup', label: '💾 Sao lưu & khôi phục', icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'guide', label: 'Hướng dẫn', icon: <HelpCircle className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* Tab VIP & VietQR */}
          {activeTab === 'vip' && (
            <div className="space-y-6">
              
              {/* VIP Status Banner */}
              <div className={`p-5 rounded-2xl border ${
                isVip
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 border-amber-300 shadow-md'
                  : 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 text-slate-800 border-amber-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Crown className={`w-5 h-5 ${isVip ? 'fill-slate-900 text-slate-900' : 'text-amber-500'}`} />
                      <span className="font-black text-sm uppercase tracking-wider">
                        {isVip ? 'Tài khoản bản quyền VIP hoàng gia 👑' : 'Bản miễn phí (cơ bản)'}
                      </span>
                    </div>
                    <p className={`text-xs ${isVip ? 'text-slate-800 font-semibold' : 'text-slate-600'}`}>
                      {isVip
                        ? 'Toàn bộ tính năng cao cấp, đồng bộ đám mây và nhận diện AI không giới hạn đã mở khóa vĩnh viễn.'
                        : 'Nâng cấp VIP để mở khóa không giới hạn lớp học, cắt ảnh khuôn mặt AI và đồng bộ đa thiết bị.'}
                    </p>
                  </div>

                  {!isVip ? (
                    <button
                      onClick={() => {
                        onClose();
                        setShowVipModal(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-105 text-white font-black text-xs shadow-md shadow-amber-300/50 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shrink-0"
                    >
                      <Zap className="w-4 h-4 fill-white" /> Quét VietQR nâng cấp (3s)
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md text-xs font-black text-amber-900 border border-amber-300 shrink-0 self-start sm:self-auto">
                      Vĩnh viễn ♾️
                    </span>
                  )}
                </div>
              </div>

              {/* License Key Quick Form */}
              {!isVip && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500" /> Kích hoạt bằng mã bản quyền (license key):
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualKeyInput}
                      onChange={(e) => {
                        setManualKeyInput(e.target.value);
                        setKeyResult(null);
                      }}
                      placeholder="Nhập mã ví dụ: GVCNVIP-XXXX-YYYY..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"
                    />
                    <button
                      onClick={() => {
                        if (!manualKeyInput.trim()) return;
                        const res = adminGoogleSync.activateWithLicenseKey(manualKeyInput, user?.email);
                        setKeyResult(res);
                        if (res.success) {
                          activateVip('lifetime');
                          triggerConfetti();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer active:scale-98"
                    >
                      Kích hoạt
                    </button>
                  </div>

                  {keyResult && (
                    <div className={`p-2.5 rounded-xl text-xs font-bold ${
                      keyResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {keyResult.message}
                    </div>
                  )}
                </div>
              )}

              {/* VIP Benefits Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
                <div className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Đặc quyền khi sử dụng bản quyền VIP:
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 font-semibold">
                  <li>Không giới hạn số năm học, lớp học và học sinh.</li>
                  <li>Cắt ảnh chân dung tự động từ ảnh tập thể bằng AI.</li>
                  <li>Tự động sao lưu và đồng bộ đa thiết bị (máy tính + điện thoại) 24/7.</li>
                  <li>Hỗ trợ kỹ thuật ưu tiên trực tiếp từ đội ngũ phát triển.</li>
                </ul>
              </div>



            </div>
          )}
          
          {/* Tab Cloud: Teacher Account & Cloud Sync */}
          {activeTab === 'cloud' && (
            <div className="space-y-5">

              
              {/* Account Status Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-50/80 via-rose-50/40 to-white border border-pink-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-xs uppercase tracking-wider text-pink-900 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-pink-500" /> Trạng thái tài khoản đám mây:
                  </div>

                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        syncState === 'synced'
                          ? 'bg-emerald-500 animate-pulse'
                          : syncState === 'syncing'
                          ? 'bg-amber-500 animate-spin'
                          : syncState === 'offline'
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-slate-700">
                      {syncState === 'synced'
                        ? 'Đã đồng bộ mới nhất'
                        : syncState === 'syncing'
                        ? 'Đang đồng bộ...'
                        : syncState === 'offline'
                        ? 'Ngoại tuyến (offline)'
                        : 'Lưu cục bộ trên máy'}
                    </span>
                  </span>
                </div>

                {user ? (
                  <div className="p-4 rounded-2xl bg-white border border-pink-100 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {user.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full border-2 border-pink-300 shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-black text-base">
                            {(user.user_metadata?.full_name || user.email || 'GV').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-slate-800">
                              {user.user_metadata?.full_name || 'Giáo viên'}
                            </h4>
                            {isVip ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-600 fill-amber-500" /> VIP
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                Dùng thử
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                          {lastSyncedAt && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Đồng bộ lần cuối: {lastSyncedAt.toLocaleTimeString('vi-VN')} ngày {lastSyncedAt.toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={signOut}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                      </button>
                    </div>

                    {/* Sync Summary Badges */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                      <div className="text-center">
                        <span className="text-slate-400 font-semibold block">Bản quyền</span>
                        <strong className="text-slate-800 font-bold">{isVip ? '👑 VIP Vĩnh viễn' : '⏳ Dùng thử'}</strong>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <span className="text-slate-400 font-semibold block">Lớp & Học sinh</span>
                        <strong className="text-slate-800 font-bold">{classes.length} lớp</strong>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-400 font-semibold block">Ảnh bìa & Avatar</span>
                        <strong className="text-pink-600 font-bold">
                          {teacherCover || teacherAvatar ? '📸 Đã thiết lập' : 'Chưa có'}
                        </strong>

                      </div>
                    </div>

                    {/* Sync Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        disabled={isSyncing}
                        onClick={async () => {
                          setIsSyncing(true);
                          setSyncMsg(null);
                          const ok = await syncWithCloud('upload');
                          setIsSyncing(false);
                          if (ok) {
                            triggerConfetti();
                            setSyncMsg('🎉 Đã đẩy toàn bộ Dữ liệu, Ảnh bìa, Avatar & Bản quyền VIP lên Cloud thành công!');
                          } else {
                            setSyncMsg('Không thể đồng bộ. Vui lòng kiểm tra kết nối mạng.');
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl theme-btn-primary text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
                        title="Đẩy dữ liệu, ảnh và bản quyền VIP từ thiết bị này lên Cloud"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Lưu & đẩy lên Cloud</span>
                      </button>

                      <button
                        disabled={isSyncing}
                        onClick={async () => {
                          setIsSyncing(true);
                          setSyncMsg(null);
                          const ok = await syncWithCloud('download');
                          setIsSyncing(false);
                          if (ok) {
                            triggerConfetti();
                            setSyncMsg('🎉 Đã nạp thành công toàn bộ Dữ liệu, Ảnh bìa, Avatar & Bản quyền VIP từ Cloud!');
                          } else {
                            setSyncMsg('Không thể tải từ Cloud. Vui lòng kiểm tra kết nối mạng.');
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                        title="Tải dữ liệu, ảnh và bản quyền VIP từ Cloud về thiết bị này"
                      >
                        <Download className="w-4 h-4" />
                        <span>Tải từ Cloud về máy</span>
                      </button>
                    </div>

                    {syncMsg && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{syncMsg}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white border border-pink-100 text-center space-y-3">

                    <p className="text-xs text-slate-600 font-medium">
                      Đăng nhập tài khoản để tự động đồng bộ dữ liệu trên nhiều máy tính và sao lưu an toàn khi đổi thiết bị.
                    </p>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 text-white font-black text-xs sm:text-sm shadow-md inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Cloud className="w-4 h-4" /> Đăng nhập / tạo tài khoản
                    </button>
                  </div>
                )}
              </div>

              {/* Firebase Cloud Project Configuration Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-amber-950">Hệ Thống Đám Mây Firebase Google</h4>
                      <p className="text-[11px] text-amber-800">Cơ sở dữ liệu Firestore NoSQL thời gian thực & sao lưu đa tầng</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đang hoạt động
                  </span>
                </div>
                <div className="text-[11px] text-amber-900 leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-100 space-y-1">
                  <p className="font-bold text-slate-800">📌 Thầy/Cô có cần tạo dự án trên Firebase không?</p>
                  <p>• <strong>Mặc định</strong>: Ứng dụng đã được tích hợp sẵn hệ thống Firebase Cloud tự động. Thầy/Cô chỉ cần <strong>Đăng ký / Đăng nhập tài khoản Email</strong> là có thể sử dụng ngay lập tức mà <strong>không cần cài đặt bất kỳ thứ gì trên Firebase</strong>.</p>
                  <p>• <strong>Nếu muốn dùng tài khoản Firebase riêng của Thầy/Cô</strong>: Thầy/Cô có thể tạo dự án miễn phí tại <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">console.firebase.google.com</a>, bật Firestore Database & Authentication rồi dán mã cấu hình vào mục cài đặt.</p>
                </div>
              </div>

              {/* Offline-First Information Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Nguyên lý hoạt động ngoại tuyến (offline-first):
                </div>
                <p>
                  1. Mọi thao tác chấm điểm, điểm danh, nề nếp đều ghi trực tiếp vào máy tính trước (tốc độ 0ms, không cần mạng).
                </p>
                <p>
                  2. Ngay khi máy tính kết nối Internet trở lại, hệ thống sẽ tự động đồng bộ ngầm lên Cloud mà không làm gián đoạn công việc của Thầy/Cô.
                </p>
              </div>

            </div>
          )}

          
          {/* Tab 0: Profile & Theme Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Teacher Title & Name */}
              <div className="p-5 rounded-2xl bg-pink-50/60 border border-pink-200 space-y-4">
                <div className="font-extrabold text-xs uppercase tracking-wider text-pink-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-pink-500" /> Danh xưng & tên giáo viên:
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Xưng hô:</label>
                    <select
                      value={teacherTitle}
                      onChange={(e) => {
                        setTeacherTitle(e.target.value as TeacherTitle);
                        triggerConfetti();
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
                    >
                      <option value="Cô giáo">Cô giáo 👩‍🏫</option>
                      <option value="Thầy giáo">Thầy giáo 👨‍🏫</option>
                      <option value="Thầy/Cô">Thầy/Cô 🧑‍🏫</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Họ và tên giáo viên:</label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Thị Nga, Trần Văn Nam..."
                      className="w-full px-3.5 py-2 rounded-xl border border-pink-200 bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Color Picker */}
              <div className="space-y-3">
                <div className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-pink-500" /> Chọn màu sắc giao diện yêu thích:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(THEME_CONFIGS) as AppTheme[]).map((key) => {
                    const cfg = THEME_CONFIGS[key];
                    const isSelected = theme === key;

                    return (
                      <div
                        key={key}
                        onClick={() => {
                          setTheme(key);
                          triggerConfetti();
                        }}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-pink-500 bg-pink-50/70 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-pink-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full ${cfg.dot} shadow-xs shrink-0`} />
                          <span className="font-bold text-xs text-slate-800">{cfg.label}</span>
                        </div>

                        {isSelected && <CheckCircle2 className="w-5 h-5 text-pink-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Tab 1: Years Management */}
          {activeTab === 'years' && (
            <div className="space-y-5">
              <form onSubmit={handleAddYear} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  placeholder="Ví dụ: Năm học 2026 - 2027..."
                  className="flex-1 px-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm năm học
                </button>
              </form>

              <div className="space-y-2">
                {years.map((y) => (
                  <div
                    key={y.id}
                    className="p-3.5 rounded-2xl border border-pink-100 bg-white shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{y.name}</span>
                      {y.isCurrent && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          NĂM HIỆN TẠI ⭐
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!y.isCurrent && (
                        <button
                          onClick={() => handleSetCurrentYear(y.id)}
                          className="px-3 py-1 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-bold cursor-pointer"
                        >
                          Chọn làm năm chính
                        </button>
                      )}
                      {years.length > 1 && (
                        <button
                          onClick={() => handleDeleteYear(y.id, y.name)}
                          className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Xóa năm học này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Classes Management */}
          {activeTab === 'classes' && (
            <div className="space-y-5">
              <form onSubmit={handleAddClass} className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200 space-y-3">
                <div className="font-bold text-pink-800 text-xs uppercase tracking-wider">
                  Thêm lớp học mới trong {currentYear?.name}:
                </div>

                {/* Role */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewClassType('gvcn')}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newClassType === 'gvcn'
                        ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" /> Lớp Chủ Nhiệm
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewClassType('bomon')}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newClassType === 'bomon'
                        ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Lớp Bộ Môn / Chuyên Ngành
                  </button>
                </div>

                {newClassType === 'bomon' && (
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-amber-900">Môn giảng dạy:</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Toán, Ngữ văn, Tiếng Anh, Tin học..."
                      value={newClassSubject}
                      onChange={(e) => setNewClassSubject(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Tên lớp (6A1, 10B...)"
                    className="px-3 py-2 rounded-xl border border-pink-200 bg-white font-bold text-xs"
                  />
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-pink-200 bg-white font-bold text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newClassTeacher}
                    onChange={(e) => setNewClassTeacher(e.target.value)}
                    placeholder="Tên Giáo viên"
                    className="px-3 py-2 rounded-xl border border-pink-200 bg-white font-semibold text-xs"
                  />

                  <input
                    type="text"
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    placeholder="Phòng học"
                    className="px-3 py-2 rounded-xl border border-pink-200 bg-white font-semibold text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Tạo lớp ngay
                </button>
              </form>

              <div className="space-y-2">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl border border-pink-100 bg-white shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-pink-300 overflow-hidden bg-pink-50 flex items-center justify-center font-bold text-xs text-pink-700 shrink-0">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{c.name.slice(0, 3)}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            c.classType === 'bomon'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-pink-100 text-pink-700 border border-pink-200'
                          }`}>
                            {c.classType === 'bomon' ? `📚 ${c.subject || 'Bộ môn'}` : '🎓 GVCN'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.homeroomTeacher} • {c.roomNumber || 'Phòng học'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteClass(c.id, c.name)}
                      className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Xóa lớp này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Tab 3: Backup & Restore Engine */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              
              {/* Database Summary Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="font-extrabold text-xs text-emerald-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" /> Thống kê dữ liệu hiện tại trên máy:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold text-emerald-800">
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    📚 Lớp: {dbStats.classesCount} ({dbStats.yearsCount} năm)
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    👩‍🎓 Học sinh: {dbStats.studentsCount} em
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    ⭐ Điểm nề nếp: {dbStats.behaviorCount}
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    💰 Quỹ thu chi: {dbStats.fundCount}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleExport}
                  className="p-5 rounded-2xl border-2 border-pink-300 bg-pink-50/70 hover:bg-pink-100 text-pink-900 font-black text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-7 h-7 text-pink-600" />
                  <span className="text-sm">Tải file sao lưu toàn bộ</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Xuất file .json lưu về máy an toàn 100%
                  </span>
                </button>

                <label className="p-5 rounded-2xl border-2 border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-black text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs">
                  <Upload className="w-7 h-7 text-indigo-600" />
                  <span className="text-sm">Phục hồi dữ liệu từ file</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Chọn file sao lưu .json đã lưu trước đây
                  </span>
                  <input type="file" accept=".json,.gvcn" onChange={handleImport} className="hidden" />
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-center">
                <button
                  onClick={handleClearAllData}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> 🧹 Xóa sạch dữ liệu mẫu (bắt đầu năm học mới)
                </button>

                <button
                  onClick={handleResetDemo}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer py-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Nạp lại mẫu lớp 6A1
                </button>
              </div>

            </div>
          )}

          {/* Tab 4: Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200">
                <h4 className="font-extrabold text-pink-900 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-500" /> Bí quyết sử dụng hiệu quả:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Tùy chọn Thầy/Cô:</strong> Trong tab "Giao diện & danh xưng", thầy/cô có thể chọn màu sắc và cách xưng hô phù hợp.</li>
                  <li><strong>Cắt ảnh tập thể:</strong> Ở mục Học sinh, nhấp vào khuôn mặt trên ảnh lớp để gán avatar cực nhanh.</li>
                  <li><strong>Dán từ Excel:</strong> Copy bảng từ Excel và nhấn Ctrl+V để nạp danh sách trong 3 giây.</li>
                  <li><strong>Báo cáo thu chi:</strong> Xuất ảnh bảng quỹ gửi trực tiếp vào nhóm Zalo phụ huynh.</li>
                </ul>
              </div>

              <div className="text-center pt-2 text-[11px] text-slate-500 font-medium">
                Ứng dụng Sổ tay Giáo viên • Thiết kế và phát triển bởi <strong className="text-slate-800 font-bold">Xiao System</strong> © 2026
              </div>

            </div>
          )}

        </div>


      </div>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

