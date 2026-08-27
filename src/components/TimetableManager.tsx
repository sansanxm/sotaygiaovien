import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Download,
  Share2,
  Edit2,
  Trash2,
  BookOpen,
  MapPin,
  User,
  X,
  Check,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';

import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { TimetableEntry, DayOfWeek } from '../types';
import { exportTimetableToExcel } from '../utils/excelExporter';

interface SubjectPreset {
  name: string;
  icon: string;
  color: string;
  defaultTeacher?: string;
}

const VIETNAMESE_SUBJECTS: SubjectPreset[] = [
  { name: 'Toán', icon: '📐', color: '#3b82f6' },
  { name: 'Ngữ văn', icon: '📚', color: '#ec4899' },
  { name: 'Tiếng Anh', icon: '🇬🇧', color: '#8b5cf6' },
  { name: 'KHTN (Vật lí)', icon: '⚡', color: '#06b6d4' },
  { name: 'KHTN (Hóa học)', icon: '🧪', color: '#0ea5e9' },
  { name: 'KHTN (Sinh học)', icon: '🌿', color: '#10b981' },
  { name: 'Lịch sử & Địa lí', icon: '🌍', color: '#f59e0b' },
  { name: 'Tin học', icon: '💻', color: '#6366f1' },
  { name: 'Công nghệ', icon: '⚙️', color: '#64748b' },
  { name: 'Giáo dục thể chất', icon: '⚽', color: '#10b981' },
  { name: 'GDCD', icon: '⚖️', color: '#84cc16' },
  { name: 'Âm nhạc', icon: '🎵', color: '#f97316' },
  { name: 'Mỹ thuật', icon: '🎨', color: '#d946ef' },
  { name: 'Chào cờ', icon: '🚩', color: '#f43f5e' },
  { name: 'Sinh hoạt lớp (SHL)', icon: '🌸', color: '#f43f5e' },
  { name: 'Hoạt động trải nghiệm', icon: '🌟', color: '#a855f7' },
  { name: 'Tự chọn / Bồi dưỡng', icon: '📖', color: '#14b8a6' },
];

const PERIOD_TIMES_MORNING = [
  { period: 1, time: '07:15 - 08:00' },
  { period: 2, time: '08:05 - 08:50' },
  { period: 3, time: '09:05 - 09:50' },
  { period: 4, time: '09:55 - 10:40' },
  { period: 5, time: '10:45 - 11:30' },
];

const PERIOD_TIMES_AFTERNOON = [
  { period: 1, time: '13:30 - 14:15' },
  { period: 2, time: '14:20 - 15:05' },
  { period: 3, time: '15:20 - 16:05' },
  { period: 4, time: '16:10 - 16:55' },
  { period: 5, time: '17:00 - 17:45' },
];

const DAYS_CONFIG: { key: DayOfWeek; label: string; short: string; dayIndex: number }[] = [
  { key: 'monday', label: 'Thứ Hai', short: 'T2', dayIndex: 1 },
  { key: 'tuesday', label: 'Thứ Ba', short: 'T3', dayIndex: 2 },
  { key: 'wednesday', label: 'Thứ Tư', short: 'T4', dayIndex: 3 },
  { key: 'thursday', label: 'Thứ Năm', short: 'T5', dayIndex: 4 },
  { key: 'friday', label: 'Thứ Sáu', short: 'T6', dayIndex: 5 },
  { key: 'saturday', label: 'Thứ Bảy', short: 'T7', dayIndex: 6 },
];

export const TimetableManager: React.FC = () => {
  const { currentClass, currentYear, teacherName, triggerConfetti } = useApp();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [activeSessionView, setActiveSessionView] = useState<'all' | 'morning' | 'afternoon'>('all');

  // Edit Modal State
  const [selectedSlot, setSelectedSlot] = useState<{
    dayOfWeek: DayOfWeek;
    session: 'morning' | 'afternoon';
    period: number;
    dayLabel: string;
  } | null>(null);

  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formColor, setFormColor] = useState('#ec4899');

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Load timetable entries from database
  const loadTimetable = async () => {
    if (!currentClass) return;
    const list = await db.timetable.where('classId').equals(currentClass.id).toArray();
    setEntries(list);
  };

  useEffect(() => {
    loadTimetable();
  }, [currentClass]);

  // Current day index in Vietnam: Sunday = 0, Monday = 1, ... Saturday = 6
  const currentDayIndex = new Date().getDay();

  // Find entry for a specific slot
  const getEntry = (day: DayOfWeek, session: 'morning' | 'afternoon', period: number) => {
    return entries.find(
      (e) => e.dayOfWeek === day && e.session === session && e.period === period
    );
  };

  // Open Edit Modal
  const handleOpenEditSlot = (
    dayOfWeek: DayOfWeek,
    session: 'morning' | 'afternoon',
    period: number,
    dayLabel: string
  ) => {
    const existing = getEntry(dayOfWeek, session, period);
    setSelectedSlot({ dayOfWeek, session, period, dayLabel });

    if (existing) {
      setFormSubject(existing.subject || '');
      setFormTeacher(existing.teacher || '');
      setFormRoom(existing.room || '');
      setFormNote(existing.note || '');
      setFormColor(existing.color || '#3b82f6');
    } else {
      setFormSubject('');
      setFormTeacher('');
      setFormRoom(currentClass?.roomNumber || 'Phòng học');
      setFormNote('');
      setFormColor('#ec4899');
    }
  };

  // Save Slot
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !currentClass) return;

    const { dayOfWeek, session, period } = selectedSlot;
    const existing = getEntry(dayOfWeek, session, period);

    if (!formSubject.trim()) {
      // If empty subject, delete slot
      if (existing) {
        await db.timetable.delete(existing.id);
      }
    } else {
      const entryId = existing?.id || `tt-${currentClass.id}-${dayOfWeek}-${session}-${period}`;
      const updatedEntry: TimetableEntry = {
        id: entryId,
        classId: currentClass.id,
        dayOfWeek,
        session,
        period,
        subject: formSubject.trim(),
        teacher: formTeacher.trim(),
        room: formRoom.trim(),
        note: formNote.trim(),
        color: formColor,
      };

      await db.timetable.put(updatedEntry);
    }

    await loadTimetable();
    triggerConfetti();
    setSelectedSlot(null);
  };

  // Clear Slot (Make it empty)
  const handleClearCurrentSlot = async () => {
    if (!selectedSlot || !currentClass) return;
    const { dayOfWeek, session, period } = selectedSlot;
    const existing = getEntry(dayOfWeek, session, period);
    if (existing) {
      await db.timetable.delete(existing.id);
      await loadTimetable();
    }
    setSelectedSlot(null);
  };

  // 1-Click Clear Entire Class Timetable
  const handleClearEntireTimetable = async () => {
    if (!currentClass) return;
    if (window.confirm('Cô/Thầy có chắc muốn xóa trắng toàn bộ thời khóa biểu của lớp để xếp lại từ đầu?')) {
      await db.timetable.where('classId').equals(currentClass.id).delete();
      await loadTimetable();
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    if (!currentClass) return;
    await exportTimetableToExcel(
      entries,
      currentClass.name,
      currentYear?.name || '2025 - 2026',
      teacherName || currentClass.homeroomTeacher || 'Giáo viên'
    );
    triggerConfetti();
  };

  // Export Image for Zalo
  const handleExportImage = async () => {
    if (!printAreaRef.current) return;
    try {
      const canvas = await html2canvas(printAreaRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `ThoiKhoaBieu_${currentClass?.name || 'Lop'}_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      triggerConfetti();
      alert('Đã tạo ảnh Thời khóa biểu thành công! Cô/Thầy có thể gửi trực tiếp vào nhóm Zalo lớp.');
    } catch (err) {
      alert('Có lỗi khi xuất ảnh thời khóa biểu!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 theme-text" /> Thời khóa biểu lớp {currentClass?.name}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Quản lý lịch học các thứ trong tuần, tự động đánh dấu Hôm nay và xuất file Excel / Ảnh gửi Zalo
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Session Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-extrabold">
            <button
              onClick={() => setActiveSessionView('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSessionView === 'all'
                  ? 'theme-btn-primary text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1" /> Cả ngày
            </button>

            <button
              onClick={() => setActiveSessionView('morning')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSessionView === 'morning'
                  ? 'theme-btn-primary text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 inline mr-1 text-amber-500" /> Sáng
            </button>

            <button
              onClick={() => setActiveSessionView('afternoon')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSessionView === 'afternoon'
                  ? 'theme-btn-primary text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5 inline mr-1 text-indigo-500" /> Chiều
            </button>
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Xuất file Excel Thời khóa biểu chuẩn Times New Roman 14"
          >
            <Download className="w-4 h-4" /> Xuất Excel
          </button>

          {/* Export Image Button */}
          <button
            onClick={handleExportImage}
            className="px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Tạo ảnh thời khóa biểu gửi vào nhóm Zalo"
          >
            <Share2 className="w-4 h-4" /> Tạo ảnh Zalo
          </button>


          {/* Clear Button */}
          <button
            onClick={handleClearEntireTimetable}
            className="p-2 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
            title="Xóa trắng thời khóa biểu của lớp"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Timetable Canvas Area (Captured for Zalo Image) */}
      <div ref={printAreaRef} className="glass-card p-4 sm:p-6 rounded-3xl space-y-6 bg-white/95">
        
        {/* Banner Header for Exported Image */}
        <div className="text-center pb-2 border-b border-slate-100 space-y-1">
          <h3 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight uppercase">
            THỜI KHÓA BIỂU {currentClass?.name?.toUpperCase()}
          </h3>
          <p className="text-xs sm:text-sm font-bold theme-text">
            Năm học {currentYear?.name || '2025 - 2026'} • GVCN: {currentClass?.homeroomTeacher || teacherName || 'Thầy/Cô'}
          </p>
        </div>

        {/* 1. BUỔI SÁNG TABLE */}
        {(activeSessionView === 'all' || activeSessionView === 'morning') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
                <Sun className="w-4 h-4 text-amber-600" /> BUỔI SÁNG (5 TIẾT)
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[700px] border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="p-2.5 text-center font-black text-slate-500 uppercase text-[11px] w-24 bg-slate-50 rounded-tl-2xl">
                      Tiết / Giờ
                    </th>
                    {DAYS_CONFIG.map((d) => {
                      const isToday = currentDayIndex === d.dayIndex;
                      return (
                        <th
                          key={d.key}
                          className={`p-2.5 text-center font-black uppercase text-xs sm:text-sm transition-all ${
                            isToday
                              ? 'theme-btn-primary text-white shadow-xs rounded-t-xl'
                              : 'text-slate-700 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{d.label}</span>
                            {isToday && (
                              <span className="text-[10px] bg-white text-pink-700 px-1.5 py-0.2 rounded-full font-black ml-1">
                                Hôm nay
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {PERIOD_TIMES_MORNING.map((pt) => (
                    <tr key={pt.period} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Period Header */}
                      <td className="p-2.5 text-center bg-slate-50/80 border-r border-slate-100">
                        <div className="font-black text-slate-800 text-xs sm:text-sm">
                          Tiết {pt.period}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {pt.time}
                        </div>
                      </td>

                      {/* Days Slots */}
                      {DAYS_CONFIG.map((d) => {
                        const entry = getEntry(d.key, 'morning', pt.period);
                        const isToday = currentDayIndex === d.dayIndex;

                        return (
                          <td
                            key={d.key}
                            onClick={() => handleOpenEditSlot(d.key, 'morning', pt.period, d.label)}
                            className={`p-2 text-center transition-all cursor-pointer relative group border-r border-slate-100 ${
                              isToday ? 'bg-pink-50/30' : ''
                            }`}
                          >
                            {entry ? (
                              <div
                                style={{
                                  backgroundColor: `${entry.color || '#3b82f6'}15`,
                                  borderColor: `${entry.color || '#3b82f6'}40`,
                                }}
                                className="p-2.5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-md shadow-2xs group-hover:border-pink-400"
                              >
                                <div
                                  style={{ color: entry.color || '#3b82f6' }}
                                  className="font-black text-xs sm:text-sm truncate flex items-center justify-between"
                                >
                                  <span>{entry.subject}</span>
                                  <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {entry.teacher && (
                                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate flex items-center gap-1">
                                    <User className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                                    <span>{entry.teacher}</span>
                                  </div>
                                )}

                                {entry.room && (
                                  <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    <span>{entry.room}</span>
                                  </div>
                                )}

                                {entry.note && (
                                  <div className="text-[9px] text-amber-700 font-bold bg-amber-100/70 px-1 py-0.2 rounded mt-1 truncate">
                                    📝 {entry.note}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-14 rounded-2xl border border-dashed border-slate-200 hover:border-pink-300 hover:bg-pink-50/40 flex items-center justify-center text-[11px] text-slate-300 hover:text-pink-500 font-bold transition-all">
                                + Thêm môn
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. BUỔI CHIỀU TABLE */}
        {(activeSessionView === 'all' || activeSessionView === 'afternoon') && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-800 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
                <Moon className="w-4 h-4 text-indigo-600" /> BUỔI CHIỀU (5 TIẾT)
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[700px] border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="p-2.5 text-center font-black text-slate-500 uppercase text-[11px] w-24 bg-slate-50 rounded-tl-2xl">
                      Tiết / Giờ
                    </th>
                    {DAYS_CONFIG.map((d) => {
                      const isToday = currentDayIndex === d.dayIndex;
                      return (
                        <th
                          key={d.key}
                          className={`p-2.5 text-center font-black uppercase text-xs sm:text-sm transition-all ${
                            isToday
                              ? 'theme-btn-primary text-white shadow-xs rounded-t-xl'
                              : 'text-slate-700 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{d.label}</span>
                            {isToday && (
                              <span className="text-[10px] bg-white text-pink-700 px-1.5 py-0.2 rounded-full font-black ml-1">
                                Hôm nay
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {PERIOD_TIMES_AFTERNOON.map((pt) => (
                    <tr key={pt.period} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Period Header */}
                      <td className="p-2.5 text-center bg-slate-50/80 border-r border-slate-100">
                        <div className="font-black text-slate-800 text-xs sm:text-sm">
                          Tiết {pt.period}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {pt.time}
                        </div>
                      </td>

                      {/* Days Slots */}
                      {DAYS_CONFIG.map((d) => {
                        const entry = getEntry(d.key, 'afternoon', pt.period);
                        const isToday = currentDayIndex === d.dayIndex;

                        return (
                          <td
                            key={d.key}
                            onClick={() => handleOpenEditSlot(d.key, 'afternoon', pt.period, d.label)}
                            className={`p-2 text-center transition-all cursor-pointer relative group border-r border-slate-100 ${
                              isToday ? 'bg-pink-50/30' : ''
                            }`}
                          >
                            {entry ? (
                              <div
                                style={{
                                  backgroundColor: `${entry.color || '#8b5cf6'}15`,
                                  borderColor: `${entry.color || '#8b5cf6'}40`,
                                }}
                                className="p-2.5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-md shadow-2xs group-hover:border-pink-400"
                              >
                                <div
                                  style={{ color: entry.color || '#8b5cf6' }}
                                  className="font-black text-xs sm:text-sm truncate flex items-center justify-between"
                                >
                                  <span>{entry.subject}</span>
                                  <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {entry.teacher && (
                                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate flex items-center gap-1">
                                    <User className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                                    <span>{entry.teacher}</span>
                                  </div>
                                )}

                                {entry.room && (
                                  <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    <span>{entry.room}</span>
                                  </div>
                                )}

                                {entry.note && (
                                  <div className="text-[9px] text-amber-700 font-bold bg-amber-100/70 px-1 py-0.2 rounded mt-1 truncate">
                                    📝 {entry.note}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-14 rounded-2xl border border-dashed border-slate-200 hover:border-pink-300 hover:bg-pink-50/40 flex items-center justify-center text-[11px] text-slate-300 hover:text-pink-500 font-bold transition-all">
                                + Thêm môn
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================
          PERIOD EDIT MODAL (POPUP CHỈNH SỬA TIẾT HỌC)
          ========================================================= */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-pink-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 theme-banner text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-white/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Cập Nhật Tiết Học
                  </h3>
                  <p className="text-xs text-white/90 font-bold">
                    {selectedSlot.dayLabel} • {selectedSlot.session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'} • Tiết {selectedSlot.period}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSlot(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSlot} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm custom-scrollbar">
              
              {/* Quick Preset Subjects */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">
                  ⚡ Chọn nhanh môn học phổ biến:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-2xl bg-slate-50 border border-slate-200 custom-scrollbar">
                  {VIETNAMESE_SUBJECTS.map((sub) => (
                    <button
                      key={sub.name}
                      type="button"
                      onClick={() => {
                        setFormSubject(sub.name);
                        setFormColor(sub.color);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        formSubject === sub.name
                          ? 'theme-btn-primary text-white shadow-2xs scale-105'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300 hover:bg-pink-50/50'
                      }`}
                    >
                      <span>{sub.icon}</span>
                      <span>{sub.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Tên môn học *
                </label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Ví dụ: Toán, Ngữ văn, Tiếng Anh, Tin học..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-extrabold text-slate-800"
                />
              </div>

              {/* Teacher & Room in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Giáo viên dạy
                  </label>
                  <input
                    type="text"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="Ví dụ: Cô Nga, Thầy Hùng..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Phòng học / Địa điểm
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="Ví dụ: Phòng 204, Phòng Tin..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Ghi chú tiết học (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra 15 phút, Mang dụng cụ vẽ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium text-slate-800"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Màu sắc đại diện thẻ môn:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#ec4899', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#d946ef', '#f43f5e', '#64748b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        formColor === c ? 'ring-4 ring-slate-300 scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClearCurrentSlot}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Để trống tiết này
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl theme-btn-primary text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Lưu tiết học
                  </button>

                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
