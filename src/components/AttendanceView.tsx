import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCheck,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { db, onDatabaseChanged } from '../db/db';
import type { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { AttendanceExportModal } from './AttendanceExportModal';

export const AttendanceView: React.FC = () => {
  const { currentClass, triggerConfetti } = useApp();



  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [session, setSession] = useState<'Sáng' | 'Chiều'>('Sáng');
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [showExportModal, setShowExportModal] = useState(false);


  const loadData = async () => {
    if (!currentClass) return;

    const studentList = await db.students
      .where('classId')
      .equals(currentClass.id)
      .sortBy('rollNumber');
    setStudents(studentList);

    const existingRecords = await db.attendance
      .where('classId')
      .equals(currentClass.id)
      .and((a) => a.date === selectedDate && a.session === session)
      .toArray();

    const recordMap: Record<string, { status: AttendanceStatus; note: string }> = {};
    existingRecords.forEach((rec) => {
      recordMap[rec.studentId] = { status: rec.status, note: rec.note || '' };
    });

    // Default unrecorded students to 'present' or unrecorded
    setRecords(recordMap);
  };

  useEffect(() => {
    loadData();
    const unsub = onDatabaseChanged(() => {
      loadData();
    });
    return () => {
      unsub();
    };
  }, [currentClass, selectedDate, session]);

  const handleSetStatus = async (studentId: string, status: AttendanceStatus) => {
    if (!currentClass) return;

    const currentNote = records[studentId]?.note || '';
    const updatedMap = {
      ...records,
      [studentId]: { status, note: currentNote },
    };
    setRecords(updatedMap);

    const recordId = `att-${selectedDate}-${session}-${studentId}`;
    await db.attendance.put({
      id: recordId,
      classId: currentClass.id,
      date: selectedDate,
      session,
      studentId,
      status,
      note: currentNote,
    });
  };

  const handleUpdateNote = async (studentId: string, note: string) => {
    if (!currentClass) return;

    const currentStatus = records[studentId]?.status || 'present';
    const updatedMap = {
      ...records,
      [studentId]: { status: currentStatus, note },
    };
    setRecords(updatedMap);

    const recordId = `att-${selectedDate}-${session}-${studentId}`;
    await db.attendance.put({
      id: recordId,
      classId: currentClass.id,
      date: selectedDate,
      session,
      studentId,
      status: currentStatus,
      note,
    });
  };

  const handleMarkAllPresent = async () => {
    if (!currentClass || students.length === 0) return;

    const newMap: Record<string, { status: AttendanceStatus; note: string }> = {};
    const newRecords: AttendanceRecord[] = [];

    students.forEach((st) => {
      newMap[st.id] = { status: 'present', note: records[st.id]?.note || '' };
      newRecords.push({
        id: `att-${selectedDate}-${session}-${st.id}`,
        classId: currentClass.id,
        date: selectedDate,
        session,
        studentId: st.id,
        status: 'present',
        note: records[st.id]?.note || '',
      });
    });

    setRecords(newMap);
    await db.attendance.bulkPut(newRecords);
    triggerConfetti();
  };

  const changeDateBy = (offsetDays: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offsetDays);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Stats calculation
  const total = students.length;
  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;

  students.forEach((st) => {
    const stStatus = records[st.id]?.status || 'present';
    if (stStatus === 'present') presentCount++;
    else if (stStatus === 'late') lateCount++;
    else if (stStatus === 'excused') excusedCount++;
    else if (stStatus === 'unexcused') unexcusedCount++;
  });


  return (

    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Controls Header */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Date & Session Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Prev Date */}
          <button
            onClick={() => changeDateBy(-1)}
            className="p-2 rounded-2xl bg-white border theme-card-border hover:theme-soft-bg theme-text shadow-2xs transition-colors cursor-pointer"
            title="Ngày hôm trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-2xl bg-white border theme-card-border text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 theme-ring shadow-2xs"
          />

          {/* Next Date */}
          <button
            onClick={() => changeDateBy(1)}
            className="p-2 rounded-2xl bg-white border theme-card-border hover:theme-soft-bg theme-text shadow-2xs transition-colors cursor-pointer"
            title="Ngày hôm sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Session Selector */}
          <div className="flex theme-soft-bg p-1 rounded-2xl border theme-card-border">
            {(['Sáng', 'Chiều'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSession(s)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  session === s ? 'theme-btn-primary text-white shadow-xs' : 'text-slate-600 hover:theme-text'
                }`}
              >
                Buổi {s}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-200 transition-all cursor-pointer active:scale-95"
          >
            <CheckCheck className="w-4 h-4" /> Điểm danh cả lớp có mặt
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 rounded-2xl theme-soft-bg hover:bg-white theme-text border theme-card-border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Xuất sổ điểm danh ra Excel theo tuần, tháng, học kỳ"
          >
            <Download className="w-4 h-4" /> Xuất Excel (tuần / tháng / kỳ)
          </button>

        </div>


      </div>

      {/* Summary Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-2xl border-emerald-200 bg-emerald-50/40 text-center shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Có mặt</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{presentCount}/{total}</div>
        </div>
        <div className="glass-card p-4 rounded-2xl border-amber-200 bg-amber-50/40 text-center shadow-2xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase">Đi muộn</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{lateCount}</div>
        </div>
        <div className="glass-card p-4 rounded-2xl border-blue-200 bg-blue-50/40 text-center shadow-2xs">
          <div className="text-[11px] font-bold text-blue-800 uppercase">Vắng có phép</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{excusedCount}</div>
        </div>
        <div className="glass-card p-4 rounded-2xl border-rose-200 bg-rose-50/40 text-center shadow-2xs">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Không phép</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{unexcusedCount}</div>
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs border theme-card-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="theme-soft-bg theme-text uppercase font-extrabold text-[11px] border-b theme-card-border">
              <tr>
                <th className="py-3 px-4 w-16">STT</th>
                <th className="py-3 px-4">Họ và tên học sinh</th>
                <th className="py-3 px-4 text-center">Trạng thái điểm danh</th>
                <th className="py-3 px-4">Lý do / Ghi chú của cô</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-card-border">
              {students.map((st) => {
                const currentStatus = records[st.id]?.status || 'present';
                const currentNote = records[st.id]?.note || '';

                return (
                  <tr key={st.id} className="hover:theme-soft-bg transition-colors">
                    <td className="py-3 px-4 font-bold theme-text">{st.rollNumber}</td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            st.gender === 'Nữ'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {st.fullName.slice(-2)}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800">{st.fullName}</div>
                          {st.parentPhone && (
                            <div className="text-[11px] text-slate-400">PH: {st.parentPhone}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status Options */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(st.id, 'present')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            currentStatus === 'present'
                              ? 'bg-emerald-500 text-white shadow-xs scale-105'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Có mặt
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(st.id, 'late')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-xs scale-105'
                              : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Muộn
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(st.id, 'excused')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            currentStatus === 'excused'
                              ? 'bg-blue-500 text-white shadow-xs scale-105'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" /> Có phép
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(st.id, 'unexcused')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            currentStatus === 'unexcused'
                              ? 'bg-rose-500 text-white shadow-xs scale-105'
                              : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Không phép
                        </button>
                      </div>
                    </td>

                    {/* Note Input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) => handleUpdateNote(st.id, e.target.value)}
                        placeholder="Ghi chú lý do..."
                        className="w-full px-3 py-1.5 rounded-xl border theme-card-border bg-white focus:outline-none focus:ring-2 theme-ring text-xs font-semibold"
                      />

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Attendance Export Modal (Week / Month / Term) */}
      <AttendanceExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        students={students}
      />
    </div>
  );
};
