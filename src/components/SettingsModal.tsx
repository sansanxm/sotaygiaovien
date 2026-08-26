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
  QrCode,
  Zap,
  Check,
} from 'lucide-react';

import { useApp, THEME_CONFIGS } from '../context/AppContext';
import { db, exportDatabaseBackup, importDatabaseBackup } from '../db/db';
import { GoogleAuthModal } from './GoogleAuthModal';
import { adminGoogleSync, type BankConfig } from '../services/adminGoogleScriptSync';
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
    years,
    classes,
    currentYear,
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

  // Bank Config for Admin VietQR
  const [bankConfigState, setBankConfigState] = useState<BankConfig>(() => adminGoogleSync.getBankConfig());
  const [bankSaveMsg, setBankSaveMsg] = useState(false);
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
    const all = await db.years.toArray();
    for (const y of all) {
      await db.years.update(y.id, { isCurrent: y.id === yearId });
    }
    await refreshAppData();
    triggerConfetti();
  };

  const handleDeleteYear = async (yearId: string, name: string) => {
    if (window.confirm(`Cô/Thầy có chắc chắn muốn xóa "${name}" và toàn bộ dữ liệu lớp học liên quan?`)) {
      await db.years.delete(yearId);
      const cls = await db.classes.where('yearId').equals(yearId).toArray();
      for (const c of cls) {
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
      roomNumber: newClassRoom.trim(),
      homeroomTeacher: newClassTeacher.trim() || `${teacherTitle} ${teacherName}`,
      totalDesks: 16,
      rows: 4,
      cols: 4,
    });

    setNewClassName('');
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
              <h3 className="text-base sm:text-lg font-black">Cài Đặt Hệ Thống & Tùy Biến</h3>
              <p className="text-xs text-pink-100 font-medium">Tùy biến Thầy / Cô, màu sắc và sao lưu toàn diện</p>
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
            { id: 'profile', label: '🎨 Giao Diện & Danh Xưng', icon: <Palette className="w-4 h-4" /> },
            { id: 'vip', label: '👑 Bản Quyền & VietQR', icon: <Crown className="w-4 h-4 text-amber-500" /> },
            { id: 'cloud', label: '☁️ Đồng Bộ Google & Cloud', icon: <Cloud className="w-4 h-4" /> },
            { id: 'years', label: 'Năm Học', icon: <Calendar className="w-4 h-4" /> },
            { id: 'classes', label: 'Lớp Học', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'backup', label: '💾 Sao Lưu & Khôi Phục', icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'guide', label: 'Hướng Dẫn', icon: <HelpCircle className="w-4 h-4" /> },
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
                        {isVip ? 'Tài Khoản Bản Quyền VIP Hoàng Gia 👑' : 'Bản Miễn Phí (Cơ Bản)'}
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
                      <Zap className="w-4 h-4 fill-white" /> Quét VietQR Nâng Cấp (3s)
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md text-xs font-black text-amber-900 border border-amber-300 shrink-0 self-start sm:self-auto">
                      Vĩnh Viễn ♾️
                    </span>
                  )}
                </div>
              </div>

              {/* License Key Quick Form */}
              {!isVip && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500" /> Kích Hoạt Bằng Mã Bản Quyền (License Key):
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
                      Kích Hoạt
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

              {/* Admin VietQR Payment Gateway Config */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-amber-600" /> Cấu Hình Tài Khoản Nhận Tiền VietQR (Dành Cho Chủ App / Admin):
                  </div>
                  {bankSaveMsg && (
                    <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Đã lưu cấu hình!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Ngân Hàng (Napas)</label>
                    <select
                      value={bankConfigState.bankId}
                      onChange={(e) => setBankConfigState({ ...bankConfigState, bankId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                    >
                      <option value="MB">MBBank (Quân Đội)</option>
                      <option value="VCB">Vietcombank</option>
                      <option value="TCB">Techcombank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="CTG">VietinBank</option>
                      <option value="ACB">ACB</option>
                      <option value="VPB">VPBank</option>
                      <option value="TPB">TPBank</option>
                      <option value="STB">Sacombank</option>
                      <option value="AGR">Agribank</option>
                      <option value="HDB">HDBank</option>
                      <option value="VIB">VIB</option>
                      <option value="OCB">OCB</option>
                      <option value="MSB">MSB</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Số Tài Khoản</label>
                    <input
                      type="text"
                      value={bankConfigState.accountNo}
                      onChange={(e) => setBankConfigState({ ...bankConfigState, accountNo: e.target.value })}
                      placeholder="0988123456"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tên Chủ Tài Khoản</label>
                    <input
                      type="text"
                      value={bankConfigState.accountName}
                      onChange={(e) => setBankConfigState({ ...bankConfigState, accountName: e.target.value.toUpperCase() })}
                      placeholder="NGUYEN VAN A"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Giá Gói 1 Năm (VNĐ)</label>
                    <input
                      type="number"
                      step={1000}
                      value={bankConfigState.price1Year}
                      onChange={(e) => setBankConfigState({ ...bankConfigState, price1Year: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Giá Gói Trọn Đời (VNĐ)</label>
                    <input
                      type="number"
                      step={1000}
                      value={bankConfigState.priceLifetime}
                      onChange={(e) => setBankConfigState({ ...bankConfigState, priceLifetime: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    adminGoogleSync.saveBankConfig(bankConfigState);
                    setBankSaveMsg(true);
                    setTimeout(() => setBankSaveMsg(false), 2500);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs cursor-pointer active:scale-98 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Lưu Cài Đặt Cổng VietQR
                </button>
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
                    <Cloud className="w-4 h-4 text-pink-500" /> Trạng Thái Tài Khoản Đám Mây:
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
                        ? 'Đã Đồng Bộ Mới Nhất'
                        : syncState === 'syncing'
                        ? 'Đang Đồng Bộ...'
                        : syncState === 'offline'
                        ? 'Ngoại Tuyến (Offline)'
                        : 'Lưu Cục Bộ Trên Máy'}
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
                          <h4 className="font-black text-sm text-slate-800">
                            {user.user_metadata?.full_name || 'Giáo viên'}
                          </h4>
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
                            setSyncMsg('Đã lưu & ghi đè dữ liệu máy tính hiện tại lên Cloud thành công!');
                          } else {
                            setSyncMsg('Không thể đồng bộ. Vui lòng kiểm tra kết nối mạng.');
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl theme-btn-primary text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        title="Đẩy dữ liệu trên máy tính này lên Cloud (Ghi đè bản cũ)"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Lưu & Ghi Đè Lên Cloud</span>
                      </button>


                      <button
                        disabled={isSyncing}
                        onClick={async () => {
                          if (window.confirm('Tải dữ liệu từ Đám mây về sẽ cập nhật toàn bộ dữ liệu trên máy tính này. Tiếp tục?')) {
                            setIsSyncing(true);
                            const ok = await syncWithCloud('download');
                            setIsSyncing(false);
                            if (ok) {
                              triggerConfetti();
                              setSyncMsg('Đã nạp toàn bộ dữ liệu mới nhất từ Đám mây về máy!');
                            }
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Tải Từ Cloud Về Máy</span>
                      </button>
                    </div>

                    {syncMsg && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                      <Cloud className="w-4 h-4" /> Đăng Nhập / Tạo Tài Khoản
                    </button>
                  </div>
                )}
              </div>

              {/* Offline-First Information Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Nguyên lý Hoạt Động Ngoại Tuyến (Offline-First):
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
                  <UserCheck className="w-4 h-4 text-pink-500" /> Danh xưng & Tên giáo viên chủ nhiệm:
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
                  <Palette className="w-4 h-4 text-pink-500" /> Chọn Màu Sắc Giao Diện Yêu Thích:
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
                  <Plus className="w-4 h-4" /> Thêm Năm Học
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
                  Thêm lớp chủ nhiệm mới trong {currentYear?.name}:
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Tên lớp (6A1, 10B...)"
                    className="px-3 py-2 rounded-xl border border-pink-200 bg-white font-bold"
                  />
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-pink-200 bg-white font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newClassTeacher}
                    onChange={(e) => setNewClassTeacher(e.target.value)}
                    placeholder="Tên GVCN"
                    className="px-3 py-2 rounded-xl border border-pink-200 bg-white font-semibold"
                  />
                  <input
                    type="text"
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    placeholder="Phòng học"
                    className="px-3 py-2 rounded-xl border border-pink-200 bg-white font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Tạo Lớp Mới
                </button>
              </form>

              <div className="space-y-2">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl border border-pink-100 bg-white shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                      <div className="text-xs text-slate-500">
                        {c.homeroomTeacher} • {c.roomNumber || 'Phòng học'}
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
                  <Database className="w-4 h-4 text-emerald-600" /> Thống Kê Dữ Liệu Hiện Tại Trên Máy:
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
                  <span className="text-sm">Tải File Sao Lưu Toàn Bộ</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Xuất file .json lưu về máy an toàn 100%
                  </span>
                </button>

                <label className="p-5 rounded-2xl border-2 border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-black text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs">
                  <Upload className="w-7 h-7 text-indigo-600" />
                  <span className="text-sm">Phục Hồi Dữ Liệu Từ File</span>
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
                  <Trash2 className="w-4 h-4" /> 🧹 Xóa Sạch Dữ Liệu Mẫu (Bắt Đầu Năm Học Mới)
                </button>

                <button
                  onClick={handleResetDemo}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer py-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Nạp lại mẫu Lớp 6A1
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
                  <li><strong>Tùy chọn Thầy/Cô:</strong> Trong tab "Giao Diện & Danh Xưng", thầy/cô có thể chọn màu sắc và cách xưng hô phù hợp.</li>
                  <li><strong>Cắt ảnh tập thể:</strong> Ở mục Học sinh, nhấp vào khuôn mặt trên ảnh lớp để gán avatar cực nhanh.</li>
                  <li><strong>Dán từ Excel:</strong> Copy bảng từ Excel và nhấn Ctrl+V để nạp danh sách trong 3 giây.</li>
                  <li><strong>Báo cáo thu chi:</strong> Xuất ảnh bảng quỹ gửi trực tiếp vào nhóm Zalo phụ huynh.</li>
                </ul>
              </div>

              <div className="text-center pt-2 text-[11px] text-slate-500 font-medium">
                Ứng dụng Sổ Tay Giáo Viên • Thiết kế và phát triển bởi <strong className="text-slate-800 font-bold">Xiao System</strong> © 2026
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

