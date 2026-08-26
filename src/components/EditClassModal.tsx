import React, { useState, useEffect } from 'react';
import { GraduationCap, Check, X, Building, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

import { db } from '../db/db';
import type { ClassRoom } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetClass: ClassRoom | null;
  onUpdated: () => Promise<void>;
}

export const EditClassModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetClass,
  onUpdated,
}) => {
  const { triggerConfetti } = useApp();

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('6');
  const [roomNumber, setRoomNumber] = useState('');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);

  useEffect(() => {
    if (targetClass) {
      setName(targetClass.name);
      setGrade(String(targetClass.grade || 6));
      setRoomNumber(targetClass.roomNumber || '');
      setHomeroomTeacher(targetClass.homeroomTeacher || '');
      setRows(targetClass.rows || 4);
      setCols(targetClass.cols || 4);
    }
  }, [targetClass, isOpen]);

  if (!isOpen || !targetClass) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await db.classes.update(targetClass.id, {
      name: name.trim(),
      grade: parseInt(grade, 10) || 6,
      roomNumber: roomNumber.trim() || 'Phòng học',
      homeroomTeacher: homeroomTeacher.trim() || 'Giáo viên chủ nhiệm',
      rows: Number(rows) || 4,
      cols: Number(cols) || 4,
      totalDesks: (Number(rows) || 4) * (Number(cols) || 4),
    });

    await onUpdated();
    triggerConfetti();
    alert(`Đã cập nhật thành công thông tin lớp ${name}! 🎉`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-pink-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 theme-banner text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                Chỉnh Sửa Thông Tin Lớp {targetClass.name}
              </h3>
              <p className="text-xs text-white/90 font-medium">
                Cập nhật tên lớp, phòng học, giáo viên và cấu hình sơ đồ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tên lớp học *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: 6A1, 10B2..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Khối lớp</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold text-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Phòng học / Vị trí
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="Ví dụ: Phòng 204 - Nhà A..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Giáo viên chủ nhiệm
            </label>
            <input
              type="text"
              value={homeroomTeacher}
              onChange={(e) => setHomeroomTeacher(e.target.value)}
              placeholder="Ví dụ: Cô giáo Nguyễn Thị Nga..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold text-slate-800"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-extrabold text-xs text-slate-700 block">
              Sơ đồ bàn ghế mặc định của lớp:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Số hàng bàn (Dọc)</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Số cột bàn (Dãy ngang)</label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-center"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white theme-btn-primary rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Lưu Thay Đổi
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
