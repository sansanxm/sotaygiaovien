import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  GraduationCap,
  Check,
  X,
  Building,
  UserCheck,
  Camera,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  LayoutGrid,
  Quote,
} from 'lucide-react';
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
  const [classType, setClassType] = useState<'gvcn' | 'bomon'>('gvcn');
  const [subject, setSubject] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (targetClass) {
      setName(targetClass.name);
      setGrade(String(targetClass.grade || 6));
      setClassType(targetClass.classType || 'gvcn');
      setSubject(targetClass.subject || '');
      setRoomNumber(targetClass.roomNumber || '');
      setHomeroomTeacher(targetClass.homeroomTeacher || '');
      setRows(targetClass.rows || 4);
      setCols(targetClass.cols || 4);
      setAvatarUrl(targetClass.avatarUrl || null);
      setCoverUrl(targetClass.coverUrl || null);
      setBio(targetClass.bio || '');
    }
  }, [targetClass, isOpen]);

  if (!isOpen || !targetClass) return null;

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, JPEG, WEBP)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = type === 'cover' ? 1200 : 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', type === 'cover' ? 0.78 : 0.82);
          if (type === 'avatar') {
            setAvatarUrl(compressed);
          } else {
            setCoverUrl(compressed);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await db.classes.update(targetClass.id, {
      name: name.trim(),
      grade: parseInt(grade, 10) || 6,
      roomNumber: roomNumber.trim() || 'Phòng học',
      homeroomTeacher: homeroomTeacher.trim() || 'Giáo viên',
      rows: Number(rows) || 4,
      cols: Number(cols) || 4,
      totalDesks: (Number(rows) || 4) * (Number(cols) || 4),
      avatarUrl,
      coverUrl,
      bio: bio.trim() || null,
      classType,
      subject: classType === 'bomon' ? (subject.trim() || 'Bộ môn') : '',
    });

    await onUpdated();
    triggerConfetti();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full border border-pink-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 theme-banner text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                Chỉnh Sửa Thông Tin Lớp {targetClass.name}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 font-medium">
                Cập nhật thông tin chi tiết, ảnh đại diện và cấu hình sơ đồ lớp học
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs sm:text-sm overflow-y-auto flex-1">
          
          {/* Class Role / Type */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              1. Phân loại & Vai trò giảng dạy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setClassType('gvcn')}
                className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
                  classType === 'gvcn'
                    ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200 ring-2 ring-pink-400 ring-offset-1'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-5 h-5" /> Lớp Chủ Nhiệm (GVCN)
              </button>

              <button
                type="button"
                onClick={() => setClassType('bomon')}
                className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
                  classType === 'bomon'
                    ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200 ring-2 ring-pink-400 ring-offset-1'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-5 h-5" /> Lớp Bộ Môn / Chuyên Ngành
              </button>
            </div>
          </div>

          {/* Subject (if Bộ Môn) */}
          {classType === 'bomon' && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2.5 animate-in fade-in">
              <label className="block text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" /> Môn giảng dạy tại lớp này:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Toán, Ngữ văn, Tiếng Anh, Tin học, Vật lí..."
                className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-white font-bold text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-2xs"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {['Toán', 'Ngữ văn', 'Tiếng Anh', 'KHTN (Lí/Hóa/Sinh)', 'Lịch sử & Địa lí', 'Tin học', 'Công nghệ', 'Âm nhạc', 'Mỹ thuật', 'GDTC'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Information Section */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              2. Thông tin cơ bản của lớp
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên lớp học *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: 6A1, 10B2..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold text-slate-800 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Khối lớp</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold text-slate-800 bg-slate-50/50 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Building className="w-4 h-4 text-slate-400" /> Phòng học / Vị trí
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Ví dụ: Phòng 204..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold text-slate-800 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-slate-400" /> {classType === 'bomon' ? 'GV Giảng dạy' : 'GV Chủ nhiệm'}
                </label>
                <input
                  type="text"
                  value={homeroomTeacher}
                  onChange={(e) => setHomeroomTeacher(e.target.value)}
                  placeholder="Ví dụ: Thầy/Cô..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold text-slate-800 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Class Photo & Cover Customization */}
          <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200/80 space-y-4">
            <span className="font-extrabold text-xs text-pink-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-pink-500" /> 3. Ảnh đại diện & ảnh bìa riêng của lớp {name || targetClass.name}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Class Avatar */}
              <div className="p-3 bg-white rounded-2xl border border-pink-100 flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-pink-300 overflow-hidden bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-sm shrink-0 shadow-xs">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{name ? name.slice(0, 3) : 'LỚP'}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700">Ảnh đại diện lớp</span>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs border border-pink-200 cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                      <Camera className="w-3.5 h-3.5" /> Tải ảnh
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleImagePick(e, 'avatar')}
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(null)}
                        className="text-xs text-rose-500 hover:underline font-semibold"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Class Cover Photo */}
              <div className="p-3 bg-white rounded-2xl border border-pink-100 flex items-center gap-3">
                <div className="w-20 h-14 rounded-xl border-2 border-pink-300 overflow-hidden bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-xs shrink-0 shadow-xs">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-pink-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700">Ảnh bìa lớp</span>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs border border-pink-200 cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                      <Camera className="w-3.5 h-3.5" /> Tải ảnh
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleImagePick(e, 'cover')}
                      />
                    </label>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl(null)}
                        className="text-xs text-rose-500 hover:underline font-semibold"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Class Bio / Slogan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Quote className="w-3.5 h-3.5 text-pink-500" /> Khẩu hiệu / Giới thiệu riêng của lớp
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ví dụ: Đoàn kết là sức mạnh • Học hết sức, chơi hết mình!"
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          {/* Seat Layout Configuration */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <LayoutGrid className="w-4 h-4 text-slate-500" /> 4. Sơ đồ bàn ghế mặc định của lớp
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số hàng bàn (Dọc)</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-center text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số cột bàn (Dãy ngang)</label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-center text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-7 py-3 text-xs sm:text-sm font-extrabold text-white theme-btn-primary rounded-2xl shadow-lg shadow-pink-300/40 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-5 h-5" /> Lưu Thay Đổi
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};
