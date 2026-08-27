import React, { useState, useEffect } from 'react';
import {
  Shuffle,
  RotateCw,
  Users,
  Trash2,
  Footprints,
  Sparkles,
  Layout,
  Search,
  X,
  Check,
  UserX,
  ArrowRightLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student, Seat, SeatingLayoutType } from '../types';
import { getStudentInitial } from '../utils/studentHelper';

export const SeatingChart: React.FC = () => {
  const { currentClass, triggerConfetti } = useApp();


  const [students, setStudents] = useState<Student[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);

  // Modal Student Selection for specific seat
  const [selectedSeatTarget, setSelectedSeatTarget] = useState<{
    row: number;
    col: number;
    title: string;
  } | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  // Layout mode
  const [layoutType, setLayoutType] = useState<SeatingLayoutType>(() => {
    return (currentClass?.layoutType as SeatingLayoutType) || '3-dãy';
  });

  const [rows, setRows] = useState<number>(4);
  const [cols, setCols] = useState<number>(6);

  // Configure rows and cols based on layoutType
  const applyLayoutPreset = async (preset: SeatingLayoutType) => {
    if (!currentClass) return;

    let targetRows = 4;
    let targetCols = 6;

    if (preset === '3-dãy') {
      targetRows = 4;
      targetCols = 6; // 3 blocks of 2 cols
    } else if (preset === '2-dãy') {
      targetRows = 5;
      targetCols = 4; // 2 blocks of 2 cols
    } else if (preset === '4-dãy') {
      targetRows = 4;
      targetCols = 4; // 4 single cols
    } else if (preset === 'nhóm-u') {
      targetRows = 4;
      targetCols = 4; // 4 table clusters
    }

    setLayoutType(preset);
    setRows(targetRows);
    setCols(targetCols);

    try {
      const studentList = await db.students
        .where('classId')
        .equals(currentClass.id)
        .sortBy('rollNumber');

      const newSeats: Seat[] = [];
      let sIdx = 0;
      for (let r = 0; r < targetRows; r++) {
        for (let c = 0; c < targetCols; c++) {
          newSeats.push({
            id: `seat-${currentClass.id}-${r}-${c}`,
            classId: currentClass.id,
            row: r,
            col: c,
            studentId: sIdx < studentList.length ? studentList[sIdx].id : null,
          });
          sIdx++;
        }
      }

      await db.classes.update(currentClass.id, {
        layoutType: preset,
        rows: targetRows,
        cols: targetCols,
      });

      await db.seats.where('classId').equals(currentClass.id).delete();
      await db.seats.bulkPut(newSeats);

      setSeats(newSeats);
      triggerConfetti();
    } catch (err) {
      console.error('Error applying layout preset:', err);
    }
  };

  const loadSeatingData = async () => {
    if (!currentClass) return;

    const freshClass = await db.classes.get(currentClass.id);
    const currentLayout = (freshClass?.layoutType as SeatingLayoutType) || (currentClass.layoutType as SeatingLayoutType) || '3-dãy';
    setLayoutType(currentLayout);

    let defaultRows = freshClass?.rows || currentClass.rows || 4;
    let defaultCols = freshClass?.cols || currentClass.cols || (currentLayout === '3-dãy' ? 6 : 4);
    setRows(defaultRows);
    setCols(defaultCols);

    const studentList = await db.students
      .where('classId')
      .equals(currentClass.id)
      .sortBy('rollNumber');
    setStudents(studentList);

    const seatList = await db.seats.where('classId').equals(currentClass.id).toArray();

    if (seatList.length === 0) {
      const initialSeats: Seat[] = [];
      let sIdx = 0;
      for (let r = 0; r < defaultRows; r++) {
        for (let c = 0; c < defaultCols; c++) {
          initialSeats.push({
            id: `seat-${currentClass.id}-${r}-${c}`,
            classId: currentClass.id,
            row: r,
            col: c,
            studentId: sIdx < studentList.length ? studentList[sIdx].id : null,
          });
          sIdx++;
        }
      }
      setSeats(initialSeats);
      await db.seats.bulkPut(initialSeats);
    } else {
      setSeats(seatList);
    }
  };

  useEffect(() => {
    loadSeatingData();
  }, [currentClass?.id]);


  const getStudentById = (id: string | null): Student | undefined => {
    if (!id) return undefined;
    return students.find((s) => s.id === id);
  };

  // Find unassigned students
  const assignedStudentIds = new Set(seats.map((s) => s.studentId).filter(Boolean));
  const unassignedStudents = students.filter((s) => !assignedStudentIds.has(s.id));

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    e.dataTransfer.setData('text/plain', studentId);
    setDraggedStudentId(studentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnSeat = async (targetRow: number, targetCol: number) => {
    if (!draggedStudentId || !currentClass) return;

    const newSeats = [...seats];
    const targetSeatIndex = newSeats.findIndex((s) => s.row === targetRow && s.col === targetCol);
    const sourceSeatIndex = newSeats.findIndex((s) => s.studentId === draggedStudentId);

    if (targetSeatIndex >= 0) {
      const existingStudentOnTarget = newSeats[targetSeatIndex].studentId;

      newSeats[targetSeatIndex] = {
        ...newSeats[targetSeatIndex],
        studentId: draggedStudentId,
      };

      if (sourceSeatIndex >= 0) {
        newSeats[sourceSeatIndex] = {
          ...newSeats[sourceSeatIndex],
          studentId: existingStudentOnTarget,
        };
      }

      setSeats(newSeats);
      await db.seats.bulkPut(newSeats);
      triggerConfetti();
    }
    setDraggedStudentId(null);
  };

  const handleDropToUnassigned = async () => {
    if (!draggedStudentId || !currentClass) return;

    const newSeats = [...seats];
    const sourceSeatIndex = newSeats.findIndex((s) => s.studentId === draggedStudentId);

    if (sourceSeatIndex >= 0) {
      newSeats[sourceSeatIndex] = {
        ...newSeats[sourceSeatIndex],
        studentId: null,
      };
      setSeats(newSeats);
      await db.seats.bulkPut(newSeats);
    }
    setDraggedStudentId(null);
  };

  // 1-Click Shuffle Seating
  const handleShuffleSeats = async () => {
    if (students.length === 0 || !currentClass) return;
    if (window.confirm('Cô/Thầy có muốn xáo trộn ngẫu nhiên chỗ ngồi cho cả lớp không?')) {
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
      const newSeats = seats.map((seat, index) => ({
        ...seat,
        studentId: index < shuffledStudents.length ? shuffledStudents[index].id : null,
      }));

      setSeats(newSeats);
      await db.seats.bulkPut(newSeats);
      triggerConfetti();
    }
  };

  // Weekly Row Rotation (Luân chuyển dãy tuần chống cận thị)
  const handleRotateColumns = async () => {
    if (!currentClass || seats.length === 0) return;

    if (layoutType === '3-dãy') {
      // Rotate 3 blocks of 2 columns: Dãy 1 (0,1) -> Dãy 2 (2,3) -> Dãy 3 (4,5) -> Dãy 1
      const newSeats = seats.map((seat) => {
        let newCol = seat.col;
        if (seat.col === 0) newCol = 2;
        else if (seat.col === 1) newCol = 3;
        else if (seat.col === 2) newCol = 4;
        else if (seat.col === 3) newCol = 5;
        else if (seat.col === 4) newCol = 0;
        else if (seat.col === 5) newCol = 1;

        const sourceSeat = seats.find((s) => s.row === seat.row && s.col === newCol);
        return {
          ...seat,
          studentId: sourceSeat?.studentId || null,
        };
      });
      setSeats(newSeats);
      await db.seats.bulkPut(newSeats);
      triggerConfetti();
      alert('Đã luân chuyển 3 dãy bàn theo tuần thành công! 🔄');
    } else {
      // General column shift
      const newSeats = seats.map((seat) => {
        const nextCol = (seat.col + 1) % cols;
        const sourceSeat = seats.find((s) => s.row === seat.row && s.col === nextCol);
        return {
          ...seat,
          studentId: sourceSeat?.studentId || null,
        };
      });
      setSeats(newSeats);
      await db.seats.bulkPut(newSeats);
      triggerConfetti();
      alert('Đã luân chuyển các dãy bàn tuần mới thành công! 🔄');
    }
  };

  // Clear all seats
  const handleClearSeats = async () => {
    if (window.confirm('Cô/Thầy có chắc muốn xóa toàn bộ chỗ ngồi để xếp lại từ đầu?')) {
      const newSeats = seats.map((s) => ({ ...s, studentId: null }));
      setSeats(newSeats);
      await db.seats.bulkPut(newSeats);
    }
  };

  // Helper to render columns grouped by layout aisles
  const renderLayoutContent = () => {
    if (layoutType === '3-dãy') {
      // 3 Clusters of 2 Columns with 2 Aisles
      return (
        <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6">
          
          {/* DÃY 1 (Tổ 1: Cột 0, Cột 1) */}
          <div className="space-y-3 p-3 rounded-2xl bg-white/70 border theme-card-border shadow-2xs">
            <div className="text-center font-extrabold text-xs uppercase tracking-wider theme-text">
              DÃY 1 (TỔ 1)
            </div>
            <div className="space-y-3">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-2">
                  {[0, 1].map((c) => renderDesk(r, c))}
                </div>
              ))}
            </div>
          </div>

          {/* LỐI ĐI 1 (Aisle 1) */}
          <div className="hidden sm:flex flex-col items-center justify-center self-stretch px-1.5 py-4 text-slate-400 font-extrabold text-[11px] select-none border-x-2 border-dashed border-slate-200">
            <Footprints className="w-4 h-4 mb-2 theme-text" />
            <span className="[writing-mode:vertical-lr] tracking-widest uppercase">LỐI ĐI 1</span>
          </div>

          {/* DÃY 2 (Tổ 2: Cột 2, Cột 3) */}
          <div className="space-y-3 p-3 rounded-2xl bg-white/70 border theme-card-border shadow-2xs">
            <div className="text-center font-extrabold text-xs uppercase tracking-wider theme-text">
              DÃY 2 (TỔ 2 - GIỮA)
            </div>
            <div className="space-y-3">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-2">
                  {[2, 3].map((c) => renderDesk(r, c))}
                </div>
              ))}
            </div>
          </div>

          {/* LỐI ĐI 2 (Aisle 2) */}
          <div className="hidden sm:flex flex-col items-center justify-center self-stretch px-1.5 py-4 text-slate-400 font-extrabold text-[11px] select-none border-x-2 border-dashed border-slate-200">
            <Footprints className="w-4 h-4 mb-2 theme-text" />
            <span className="[writing-mode:vertical-lr] tracking-widest uppercase">LỐI ĐI 2</span>
          </div>

          {/* DÃY 3 (Tổ 3: Cột 4, Cột 5) */}
          <div className="space-y-3 p-3 rounded-2xl bg-white/70 border theme-card-border shadow-2xs">
            <div className="text-center font-extrabold text-xs uppercase tracking-wider theme-text">
              DÃY 3 (TỔ 3)
            </div>
            <div className="space-y-3">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-2">
                  {[4, 5].map((c) => renderDesk(r, c))}
                </div>
              ))}
            </div>
          </div>

        </div>
      );
    } else if (layoutType === '2-dãy') {
      // 2 Clusters with 1 Big Central Aisle
      return (
        <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-10">
          
          {/* DÃY TRÁI (Cột 0, 1) */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/70 border theme-card-border shadow-2xs">
            <div className="text-center font-extrabold text-xs uppercase tracking-wider theme-text">
              DÃY TRÁI (TỔ 1 & 2)
            </div>
            <div className="space-y-3">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-2.5">
                  {[0, 1].map((c) => renderDesk(r, c))}
                </div>
              ))}
            </div>
          </div>

          {/* LỐI ĐI CHÍNH (Central Aisle) */}
          <div className="hidden sm:flex flex-col items-center justify-center self-stretch px-4 py-4 text-slate-400 font-extrabold text-xs select-none border-x-2 border-dashed border-slate-200">
            <Footprints className="w-5 h-5 mb-2 theme-text animate-bounce" />
            <span className="[writing-mode:vertical-lr] tracking-widest uppercase">LỐI ĐI TRUNG TÂM</span>
          </div>

          {/* DÃY PHẢI (Cột 2, 3) */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/70 border theme-card-border shadow-2xs">
            <div className="text-center font-extrabold text-xs uppercase tracking-wider theme-text">
              DÃY PHẢI (TỔ 3 & 4)
            </div>
            <div className="space-y-3">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-2.5">
                  {[2, 3].map((c) => renderDesk(r, c))}
                </div>
              ))}
            </div>
          </div>

        </div>
      );
    } else if (layoutType === '4-dãy') {
      // 4 Individual Rows with 3 Aisles
      return (
        <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((colIdx) => (
            <React.Fragment key={colIdx}>
              <div className="space-y-3 p-3 rounded-2xl bg-white/70 border theme-card-border shadow-2xs">
                <div className="text-center font-extrabold text-xs uppercase tracking-wider theme-text">
                  DÃY {colIdx + 1}
                </div>
                <div className="space-y-3">
                  {Array.from({ length: rows }).map((_, r) => (
                    <div key={r}>
                      {renderDesk(r, colIdx)}
                    </div>
                  ))}
                </div>
              </div>

              {colIdx < 3 && (
                <div className="hidden sm:flex flex-col items-center justify-center self-stretch px-1 text-slate-300 font-extrabold text-[10px] select-none border-x border-dashed border-slate-200">
                  <span className="[writing-mode:vertical-lr] tracking-widest">LỐI ĐI</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    } else {
      // 4 Table Groups (Nhóm U / 4 Cụm Tổ)
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { name: 'CỤM TỔ 1 (GẦN CỬA)', desks: [[0, 0], [0, 1], [1, 0], [1, 1]] },
            { name: 'CỤM TỔ 2 (GẦN CỬA SỔ)', desks: [[0, 2], [0, 3], [1, 2], [1, 3]] },
            { name: 'CỤM TỔ 3 (CUỐI LỚP TRÁI)', desks: [[2, 0], [2, 1], [3, 0], [3, 1]] },
            { name: 'CỤM TỔ 4 (CUỐI LỚP PHẢI)', desks: [[2, 2], [2, 3], [3, 2], [3, 3]] },
          ].map((grp, gIdx) => (
            <div key={gIdx} className="p-4 rounded-3xl bg-white/80 border theme-card-border shadow-sm space-y-3">
              <div className="font-extrabold text-xs text-center theme-text uppercase tracking-wider">
                {grp.name}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {grp.desks.map(([r, c]) => (
                  <div key={`${r}-${c}`}>
                    {renderDesk(r, c)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  // Assign / Swap student to a target seat via modal
  const handleAssignStudentToTargetSeat = async (studentId: string | null) => {
    if (!selectedSeatTarget || !currentClass) return;

    const { row: targetRow, col: targetCol } = selectedSeatTarget;
    const newSeats = [...seats];
    const targetSeatIndex = newSeats.findIndex((s) => s.row === targetRow && s.col === targetCol);

    if (studentId === null) {
      // Clear current seat
      if (targetSeatIndex >= 0) {
        newSeats[targetSeatIndex] = {
          ...newSeats[targetSeatIndex],
          studentId: null,
        };
      }
    } else {
      const sourceSeatIndex = newSeats.findIndex((s) => s.studentId === studentId);
      const existingStudentOnTarget = targetSeatIndex >= 0 ? newSeats[targetSeatIndex].studentId : null;

      if (targetSeatIndex >= 0) {
        newSeats[targetSeatIndex] = {
          ...newSeats[targetSeatIndex],
          studentId: studentId,
        };
      }

      // If the selected student was already seated somewhere else, swap them
      if (sourceSeatIndex >= 0 && sourceSeatIndex !== targetSeatIndex) {
        newSeats[sourceSeatIndex] = {
          ...newSeats[sourceSeatIndex],
          studentId: existingStudentOnTarget,
        };
      }
    }

    setSeats(newSeats);
    await db.seats.bulkPut(newSeats);
    triggerConfetti();
    setSelectedSeatTarget(null);
    setModalSearch('');
  };

  // Render a Single Desk Card
  const renderDesk = (r: number, c: number) => {
    const seat = seats.find((s) => s.row === r && s.col === c);
    const student = seat ? getStudentById(seat.studentId) : undefined;

    return (
      <div
        key={`${r}-${c}`}
        onClick={() => {
          setSelectedSeatTarget({
            row: r,
            col: c,
            title: `Hàng ${r + 1} - Bàn ${c + 1}`,
          });
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.stopPropagation();
          handleDropOnSeat(r, c);
        }}
        className={`w-28 sm:w-32 h-24 rounded-2xl p-2 flex flex-col justify-between border-2 transition-all cursor-pointer relative group ${
          student
            ? 'bg-white border-slate-200/90 shadow-2xs hover:border-pink-400 hover:shadow-md hover:scale-[1.02]'
            : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-pink-50/60 hover:border-pink-400 hover:scale-[1.02]'
        }`}
        title={`Bấm vào để chọn hoặc đổi học sinh cho Hàng ${r + 1} - Bàn ${c + 1}`}
      >
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span className="group-hover:text-pink-600 transition-colors">H{r + 1}-B{c + 1}</span>
          {student ? (
            <span className={`px-1.5 py-0.2 rounded-md font-extrabold ${student.gender === 'Nữ' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
              {student.gender}
            </span>
          ) : (
            <span className="text-[9px] text-pink-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              + Chọn HS
            </span>
          )}
        </div>

        {student ? (
          <div
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              handleDragStart(e, student.id);
            }}
            className="text-center cursor-grab active:cursor-grabbing my-auto select-none"
          >
            {student.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt=""
                className="w-9 h-9 mx-auto rounded-full object-cover shadow-xs border-2 theme-card-border"
              />
            ) : (
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-black text-xs shadow-xs border ${
                  student.gender === 'Nữ'
                    ? 'bg-rose-200 text-rose-800 border-rose-300'
                    : 'bg-sky-200 text-sky-800 border-sky-300'
                }`}
              >
                {getStudentInitial(student.fullName)}
              </div>
            )}
            <div className="text-xs font-bold text-slate-800 mt-1 truncate">
              {student.fullName}
            </div>
            <div className="text-[10px] font-semibold theme-text">
              STT: {student.rollNumber}
            </div>
          </div>
        ) : (
          <div className="text-center my-auto text-slate-400 text-xs font-medium italic group-hover:text-pink-500 transition-colors">
            + Chọn học sinh
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Bar & Layout Presets */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <Layout className="w-5 h-5 theme-text" /> Sơ đồ lớp học & chỗ ngồi kéo - thả
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Lựa chọn sơ đồ 2 dãy, 3 dãy, 4 dãy có lối đi và luân chuyển hàng tuần chống cận thị
          </p>
        </div>

        {/* Layout Presets Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {[
            { id: '3-dãy', label: '🏛️ 3 dãy (2 lối đi)' },
            { id: '2-dãy', label: '🏢 2 dãy (1 lối đi)' },
            { id: '4-dãy', label: '🏫 4 dãy (3 lối đi)' },
            { id: 'nhóm-u', label: '👥 4 cụm tổ nhóm' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => applyLayoutPreset(t.id as SeatingLayoutType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                layoutType === t.id
                  ? 'theme-btn-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRotateColumns}
            className="px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Đổi chỗ các dãy bàn tuần mới để chống cận thị và lệch mắt"
          >
            <RotateCw className="w-4 h-4 text-amber-600" />
            <span>Đổi dãy tuần</span>
          </button>

          <button
            onClick={handleShuffleSeats}
            className="px-3.5 py-2 rounded-2xl theme-btn-secondary text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>Xếp ngẫu nhiên</span>
          </button>

          <button
            onClick={handleClearSeats}
            className="p-2 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
            title="Xóa hết chỗ ngồi để xếp lại"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
        
        {/* Blackboard & Teacher Podium (Bảng đen & Bục giảng) */}
        <div className="relative max-w-2xl mx-auto mb-6">
          <div className="h-10 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-md tracking-widest uppercase border-2 border-emerald-700">
            📋 BẢNG ĐEN LỚP HỌC
          </div>

          <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black border border-amber-300">
            🚪 CỬA RA VÀO
          </div>

          <div className="absolute -bottom-3 right-8 px-3.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300 shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" /> BỤC GIẢNG GVCN
          </div>
        </div>

        {/* Desks Grid with Aisles */}
        <div className="overflow-x-auto py-2 custom-scrollbar">
          {renderLayoutContent()}
        </div>

      </div>

      {/* Bottom Tray: Unassigned Students */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDropToUnassigned}
        className="glass-panel p-5 rounded-3xl space-y-3 border-2 border-dashed theme-card-border"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl theme-soft-bg theme-text">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Khay học sinh chưa xếp chỗ ({unassignedStudents.length} em)
            </h4>
          </div>


          <span className="text-xs text-slate-400 font-medium">
            Kéo thả học sinh từ khay vào bàn hoặc gắp từ bàn thả ra đây
          </span>
        </div>

        {unassignedStudents.length === 0 ? (
          <div className="text-center py-4 text-xs font-bold text-emerald-600 bg-emerald-50/60 rounded-2xl border border-emerald-200">
            ✨ Tuyệt vời! Toàn bộ {students.length} học sinh của lớp đã được xếp chỗ ngồi!
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {unassignedStudents.map((st) => (
              <div
                key={st.id}
                draggable
                onDragStart={(e) => handleDragStart(e, st.id)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-pink-400 hover:shadow-md cursor-grab active:cursor-grabbing text-xs font-extrabold flex items-center gap-2 transition-all select-none"
              >
                {st.avatarUrl ? (
                  <img src={st.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      st.gender === 'Nữ' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {getStudentInitial(st.fullName)}
                  </span>
                )}
                <span className="text-slate-800">{st.fullName}</span>
                <span className="text-[10px] text-slate-400 font-semibold">#{st.rollNumber}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Selection Modal for Specific Desk */}
      {selectedSeatTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-pink-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 theme-banner text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-white/20">
                  <Layout className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Chọn Học Sinh Vào Bàn
                  </h3>
                  <p className="text-xs text-white/90 font-bold">
                    Vị trí: {selectedSeatTarget.title} • {currentClass?.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedSeatTarget(null);
                  setModalSearch('');
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Quick Actions */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/70 shrink-0">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Gõ tên hoặc số thứ tự học sinh..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs"
                />
                {modalSearch && (
                  <button
                    onClick={() => setModalSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action: Empty Seat if currently occupied */}
              {(() => {
                const currentSeat = seats.find(
                  (s) => s.row === selectedSeatTarget.row && s.col === selectedSeatTarget.col
                );
                const currentStudentOnDesk = currentSeat ? getStudentById(currentSeat.studentId) : null;

                if (currentStudentOnDesk) {
                  return (
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-800">
                          Đang ngồi: <strong>{currentStudentOnDesk.fullName}</strong> (#{currentStudentOnDesk.rollNumber})
                        </span>
                      </div>
                      <button
                        onClick={() => handleAssignStudentToTargetSeat(null)}
                        className="px-3 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" /> Để trống bàn này
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {(() => {
                const filtered = students.filter((st) => {
                  const q = modalSearch.toLowerCase().trim();
                  return (
                    st.fullName.toLowerCase().includes(q) ||
                    String(st.rollNumber).includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">
                      Không tìm thấy học sinh nào phù hợp!
                    </div>
                  );
                }

                return filtered.map((st) => {
                  // Find where this student is currently sitting
                  const currentSeatOfStudent = seats.find((s) => s.studentId === st.id);
                  const isCurrentTargetSeat =
                    currentSeatOfStudent &&
                    currentSeatOfStudent.row === selectedSeatTarget.row &&
                    currentSeatOfStudent.col === selectedSeatTarget.col;

                  return (
                    <button
                      key={st.id}
                      onClick={() => handleAssignStudentToTargetSeat(st.id)}
                      className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer group ${
                        isCurrentTargetSeat
                          ? 'bg-pink-50/80 border-pink-300 ring-2 ring-pink-400 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-pink-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {st.avatarUrl ? (
                          <img
                            src={st.avatarUrl}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border-2 theme-card-border"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${
                              st.gender === 'Nữ'
                                ? 'bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-sky-100 text-sky-700 border-sky-200'
                            }`}
                          >
                            {getStudentInitial(st.fullName)}
                          </div>
                        )}

                        <div>
                          <div className="font-extrabold text-xs sm:text-sm text-slate-800 group-hover:text-pink-600 transition-colors flex items-center gap-1.5">
                            <span>{st.fullName}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                                st.gender === 'Nữ'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-sky-100 text-sky-700'
                              }`}
                            >
                              {st.gender}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            STT: {st.rollNumber} {st.parentPhone ? `• SĐT: ${st.parentPhone}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isCurrentTargetSeat ? (
                          <span className="px-2.5 py-1 rounded-xl bg-pink-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5" /> Đang ngồi đây
                          </span>
                        ) : currentSeatOfStudent ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px] flex items-center gap-1 group-hover:bg-amber-100">
                            <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                            Đang ở H{currentSeatOfStudent.row + 1}-B{currentSeatOfStudent.col + 1}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 group-hover:bg-emerald-100">
                            <Check className="w-3 h-3 text-emerald-600" /> Chưa xếp chỗ
                          </span>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => {
                  setSelectedSeatTarget(null);
                  setModalSearch('');
                }}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

