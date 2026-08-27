import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  CalendarDays,
  CalendarRange,
  Download,
  X,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student } from '../types';
import {
  exportAttendanceWeeklyReport,
  exportAttendanceMonthlyReport,
  exportAttendanceTermReport,
} from '../utils/excelExporter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export const AttendanceExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
}) => {
  const { currentClass, currentYear, teacherName, triggerConfetti } = useApp();

  const [exportMode, setExportMode] = useState<'week' | 'month' | 'term'>('week');
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedTerm, setSelectedTerm] = useState<'Học Kỳ 1' | 'Học Kỳ 2' | 'Cả Năm'>('Học Kỳ 1');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !currentClass) return null;

  // Helper to compute Monday to Saturday of a date
  const getWeekDates = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);

    const weekDays: { date: string; dayLabel: string }[] = [];
    const labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    for (let i = 0; i < 6; i++) {
      const current = new Date(mon);
      current.setDate(mon.getDate() + i);
      const iso = current.toISOString().split('T')[0];
      weekDays.push({ date: iso, dayLabel: labels[i] });
    }

    return weekDays;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const className = currentClass.name;
      const yearName = currentYear?.name || '2026 - 2027';

      if (exportMode === 'week') {
        const weekDays = getWeekDates(selectedWeekDate);
        const startDate = weekDays[0].date;
        const endDate = weekDays[5].date;

        const records = await db.attendance
          .where('classId')
          .equals(currentClass.id)
          .and((a) => a.date >= startDate && a.date <= endDate)
          .toArray();

        const weekTitle = `Tuần từ ${startDate.slice(5)} đến ${endDate.slice(5)}`;
        await exportAttendanceWeeklyReport(
          students,
          records,
          weekDays,
          weekTitle,
          className,
          yearName,
          teacherName
        );
      } else if (exportMode === 'month') {
        const startMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const endMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;

        const records = await db.attendance
          .where('classId')
          .equals(currentClass.id)
          .and((a) => a.date >= startMonthStr && a.date <= endMonthStr)
          .toArray();

        await exportAttendanceMonthlyReport(
          students,
          records,
          selectedMonth,
          selectedYear,
          className,
          yearName,
          teacherName
        );
      } else if (exportMode === 'term') {
        const allClassRecords = await db.attendance
          .where('classId')
          .equals(currentClass.id)
          .toArray();

        const recordCountMap = new Map<string, { present: number; excused: number; unexcused: number; late: number }>();
        students.forEach((st) => {
          recordCountMap.set(st.id, { present: 0, excused: 0, unexcused: 0, late: 0 });
        });

        allClassRecords.forEach((r) => {
          const counts = recordCountMap.get(r.studentId);
          if (counts) {
            if (r.status === 'present') counts.present++;
            else if (r.status === 'excused') counts.excused++;
            else if (r.status === 'unexcused') counts.unexcused++;
            else if (r.status === 'late') counts.late++;
          }
        });

        const summaryData = students.map((st) => {
          const counts = recordCountMap.get(st.id) || { present: 0, excused: 0, unexcused: 0, late: 0 };
          const totalDays = counts.present + counts.excused + counts.unexcused + counts.late;
          const rate = totalDays > 0 ? `${Math.round((counts.present / totalDays) * 100)}%` : '100%';
          
          let conductNote = 'Chuyên cần tốt';
          if (counts.unexcused >= 3) conductNote = 'Cần nhắc nhở nghỉ K phép';
          else if (counts.late >= 4) conductNote = 'Thường xuyên đi muộn';

          return {
            student: st,
            totalPresent: counts.present,
            totalExcused: counts.excused,
            totalUnexcused: counts.unexcused,
            totalLate: counts.late,
            attendanceRate: rate,
            conductNote,
          };
        });

        await exportAttendanceTermReport(
          students,
          summaryData,
          selectedTerm,
          className,
          yearName,
          teacherName
        );
      }

      triggerConfetti();
      onClose();
    } catch (err) {
      console.error('Error exporting attendance:', err);
      alert('Có lỗi khi xuất file Excel!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-pink-200 shadow-2xl overflow-hidden animate-in zoom-in-95 font-sans">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Xuất sổ điểm danh Excel</h3>
              <p className="text-xs text-pink-100 font-medium">Lớp {currentClass.name} • Chuẩn Bộ GD&ĐT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Modes Switcher */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setExportMode('week')}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                exportMode === 'week'
                  ? 'bg-white text-pink-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Theo tuần
            </button>

            <button
              onClick={() => setExportMode('month')}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                exportMode === 'month'
                  ? 'bg-white text-pink-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Theo tháng
            </button>

            <button
              onClick={() => setExportMode('term')}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                exportMode === 'term'
                  ? 'bg-white text-pink-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" /> Theo học kỳ
            </button>
          </div>

          {/* MODE 1: WEEK OPTIONS */}
          {exportMode === 'week' && (
            <div className="space-y-3 p-4 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs">
              <label className="font-bold text-slate-700 block">
                Chọn một ngày trong tuần cần xuất sổ:
              </label>
              <input
                type="date"
                value={selectedWeekDate}
                onChange={(e) => setSelectedWeekDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <div className="text-[11px] text-slate-500 font-medium">
                📅 Hệ thống sẽ tự động xuất ma trận <strong>Thứ 2 đến Thứ 7</strong> (Buổi Sáng & Buổi Chiều) và thống kê chuyên cần từng học sinh.
              </div>
            </div>
          )}

          {/* MODE 2: MONTH OPTIONS */}
          {exportMode === 'month' && (
            <div className="space-y-3 p-4 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Chọn tháng:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Năm:</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                📊 Xuất toàn bộ <strong>Ngày 1 đến Ngày 31</strong> trong tháng kèm tổng kết số buổi Đủ, Có phép (P), Không phép (K), Đi muộn (M).
              </div>
            </div>
          )}

          {/* MODE 3: TERM OPTIONS */}
          {exportMode === 'term' && (
            <div className="space-y-3 p-4 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs">
              <label className="font-bold text-slate-700 block">Chọn học kỳ / năm học:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Học Kỳ 1', 'Học Kỳ 2', 'Cả Năm'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTerm(t)}
                    className={`py-2 px-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                      selectedTerm === t
                        ? 'border-pink-500 bg-white text-pink-600 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                🏆 Bảng tổng kết tỷ lệ chuyên cần cả kỳ có phần ký tên của <strong>Giáo viên chủ nhiệm</strong> và <strong>Ban Giám Hiệu</strong>.
              </div>
            </div>
          )}

          {/* Action Export Button */}
          <button
            disabled={isExporting}
            onClick={handleExport}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-md shadow-pink-300/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all disabled:opacity-70"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Đang tạo file Excel...' : 'Tải file Excel báo cáo (.xlsx)'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
