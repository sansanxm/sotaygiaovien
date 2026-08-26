import React, { useState, useEffect } from 'react';
import {
  Award,
  Star,
  Plus,
  Sparkles,
  Flame,
  Clock,
  Trash2,
  ThumbsUp,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student, BehaviorLog } from '../types';
import { exportBehaviorToExcel } from '../utils/excelExporter';

export const BehaviorTracker: React.FC = () => {
  const { currentClass, teacherName, triggerConfetti } = useApp();


  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Modal custom point
  const [showModal, setShowModal] = useState(false);
  const [pointType, setPointType] = useState<'praise' | 'violation'>('praise');
  const [pointValue, setPointValue] = useState<number>(5);
  const [pointTitle, setPointTitle] = useState('');
  const [pointNote, setPointNote] = useState('');

  const loadData = async () => {
    if (!currentClass) return;

    const studentList = await db.students
      .where('classId')
      .equals(currentClass.id)
      .sortBy('rollNumber');
    setStudents(studentList);

    const logList = await db.behaviorLogs
      .where('classId')
      .equals(currentClass.id)
      .reverse()
      .toArray();
    setLogs(logList);
  };

  useEffect(() => {
    loadData();
  }, [currentClass]);

  // Pre-set Praise presets
  const praisePresets = [
    { title: 'Phát biểu hăng hái & đúng', points: 5, icon: '🙋' },
    { title: 'Đạt điểm 9-10 bài kiểm tra', points: 10, icon: '💯' },
    { title: 'Làm việc tốt, giúp đỡ bạn bè', points: 5, icon: '🤝' },
    { title: 'Tự giác trực nhật vệ sinh sạch sẽ', points: 5, icon: '🧹' },
    { title: 'Tích cực tham gia phong trào lớp', points: 10, icon: '🎨' },
  ];

  // Pre-set Violation presets
  const violationPresets = [
    { title: 'Nói chuyện riêng trong giờ học', points: -2, icon: '🗣️' },
    { title: 'Chưa làm bài tập về nhà', points: -5, icon: '📖' },
    { title: 'Quên sách vở / đồ dùng học tập', points: -2, icon: '🎒' },
    { title: 'Không đúng tác phong, đồng phục', points: -2, icon: '👔' },
    { title: 'Đi học muộn không lý do', points: -2, icon: '⏰' },
  ];


  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !pointTitle.trim() || !currentClass) return;

    const finalPoints = pointType === 'praise' ? Math.abs(pointValue) : -Math.abs(pointValue);

    const newLog: BehaviorLog = {
      id: `bh-${Date.now()}`,
      classId: currentClass.id,
      studentId: selectedStudentId,
      date: new Date().toISOString().split('T')[0],
      type: pointType,
      points: finalPoints,
      title: pointTitle.trim(),
      note: pointNote.trim(),
    };

    await db.behaviorLogs.add(newLog);
    if (pointType === 'praise') triggerConfetti();
    setShowModal(false);
    setPointTitle('');
    setPointNote('');
    await loadData();
  };

  const handleDeleteLog = async (id: string) => {
    await db.behaviorLogs.delete(id);
    await loadData();
  };

  // Calculate points per student
  const pointsMap: Record<string, { total: number; praises: number; violations: number }> = {};
  logs.forEach((l) => {
    if (!pointsMap[l.studentId]) {
      pointsMap[l.studentId] = { total: 0, praises: 0, violations: 0 };
    }
    pointsMap[l.studentId].total += l.points;
    if (l.type === 'praise') pointsMap[l.studentId].praises += 1;
    else pointsMap[l.studentId].violations += 1;
  });

  const leaderboard = students
    .map((st) => {
      const stats = pointsMap[st.id] || { total: 0, praises: 0, violations: 0 };
      return {
        student: st,
        points: stats.total,
        praises: stats.praises,
        violations: stats.violations,
      };
    })
    .sort((a, b) => b.points - a.points);


  const handleExportExcel = async () => {
    if (!currentClass || leaderboard.length === 0) return;
    await exportBehaviorToExcel(
       leaderboard,
       currentClass.name,
       teacherName || currentClass.homeroomTeacher || 'Giáo viên'
    );
    triggerConfetti();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Sổ Nề Nếp & Bảng Vàng Thi Đua
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Tích sao khen thưởng hành động tốt & Nhắc nhở nề nếp kỷ luật
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Excel Export Button */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Xuất file Excel bảng vàng thi đua chuẩn Times New Roman 14"
          >
            <Download className="w-4 h-4" /> Xuất Excel
          </button>

          <button
            onClick={() => {
              setSelectedStudentId(students[0]?.id || '');
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-300/50 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Chấm Điểm Nề Nếp
          </button>
        </div>
      </div>

      {/* Grid: Left (Leaderboard) & Right (Quick Action Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Star Leaderboard (1 Col) */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Bảng Vàng Vinh Danh 🏆</h3>
              <p className="text-xs text-slate-500 font-medium">Bảng điểm thi đua tổng hợp của lớp</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {leaderboard.map((item, idx) => {
              const isTop1 = idx === 0 && item.points > 0;
              const isTop2 = idx === 1 && item.points > 0;
              const isTop3 = idx === 2 && item.points > 0;

              return (
                <div
                  key={item.student.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isTop1
                      ? 'bg-gradient-to-r from-amber-50 to-amber-100/60 border-amber-300 shadow-xs'
                      : isTop2
                      ? 'bg-slate-50 border-slate-200'
                      : isTop3
                      ? 'bg-orange-50/60 border-orange-200'
                      : 'bg-white border-pink-100 hover:border-pink-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                        isTop1
                          ? 'bg-amber-400 text-amber-950'
                          : isTop2
                          ? 'bg-slate-300 text-slate-800'
                          : isTop3
                          ? 'bg-orange-300 text-orange-950'
                          : 'bg-pink-100 text-pink-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.student.fullName}</div>
                      <div className="text-[10px] text-slate-400">STT: {item.student.rollNumber}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-extrabold text-xs">
                    {item.points >= 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> +{item.points}
                      </span>
                    ) : (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                        {item.points}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (2 Cols): Quick Scoring per Student & Recent Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick 1-Click Praise / Violation Tray */}
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-sm font-extrabold text-pink-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-500" /> Tích Sao Nhanh Cho Học Sinh
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Praise column */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
                <div className="text-xs font-extrabold text-emerald-800 mb-2 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> Khen thưởng (+ Điểm Tốt)
                </div>
                <div className="space-y-1.5">
                  {praisePresets.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => {
                        if (students.length === 0) return;
                        setSelectedStudentId(students[0].id);
                        setPointType('praise');
                        setPointValue(p.points);
                        setPointTitle(p.title);
                        setShowModal(true);
                      }}
                      className="w-full text-left p-2 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-100 text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{p.icon}</span> {p.title}
                      </span>
                      <span className="text-emerald-600 font-extrabold shrink-0">+{p.points}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Violation column */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80">
                <div className="text-xs font-extrabold text-rose-800 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Nhắc nhở (- Trừ Điểm)
                </div>
                <div className="space-y-1.5">
                  {violationPresets.map((v, vIdx) => (
                    <button
                      key={vIdx}
                      onClick={() => {
                        if (students.length === 0) return;
                        setSelectedStudentId(students[0].id);
                        setPointType('violation');
                        setPointValue(Math.abs(v.points));
                        setPointTitle(v.title);
                        setShowModal(true);
                      }}
                      className="w-full text-left p-2 rounded-xl bg-white hover:bg-rose-100/60 border border-rose-100 text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{v.icon}</span> {v.title}
                      </span>
                      <span className="text-rose-600 font-extrabold shrink-0">{v.points}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Recent History Logs */}
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Nhật Ký Thi Đua Gần Đây</h3>
                  <p className="text-xs text-slate-500 font-medium">Lịch sử cộng / trừ điểm học sinh trong tuần</p>
                </div>
              </div>
            </div>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có nhật ký chấm điểm nào.</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {logs.slice(0, 15).map((l) => {
                  const student = students.find((s) => s.id === l.studentId);
                  return (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-pink-100/80 hover:bg-pink-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                            l.type === 'praise'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {l.type === 'praise' ? '+' : '-'}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {student?.fullName || 'Học sinh'} • <span className="font-normal text-slate-600">{l.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Ngày {l.date} {l.note ? `• ${l.note}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                            l.type === 'praise'
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : 'text-rose-700 bg-rose-50 border border-rose-200'
                          }`}
                        >
                          {l.points > 0 ? `+${l.points}` : l.points} sao
                        </span>
                        <button
                          onClick={() => handleDeleteLog(l.id)}
                          className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa mục này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Add Behavior Score */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-pink-200 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-pink-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-pink-500" /> Chấm Điểm Học Sinh
            </h3>

            <form onSubmit={handleSaveCustom} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Chọn học sinh *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold"
                  required
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.rollNumber}. {s.fullName} ({s.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hình thức</label>
                  <select
                    value={pointType}
                    onChange={(e) => setPointType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold"
                  >
                    <option value="praise">Khen thưởng (+)</option>
                    <option value="violation">Nhắc nhở (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số điểm sao</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={pointValue}
                    onChange={(e) => setPointValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold text-center"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lý do chấm điểm *</label>
                <input
                  type="text"
                  value={pointTitle}
                  onChange={(e) => setPointTitle(e.target.value)}
                  placeholder="Ví dụ: Phát biểu hay, điểm 10 toán, vệ sinh..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú thêm</label>
                <input
                  type="text"
                  value={pointNote}
                  onChange={(e) => setPointNote(e.target.value)}
                  placeholder="Chi tiết hoàn cảnh..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-md shadow-pink-300/50"
                >
                  Lưu điểm ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
