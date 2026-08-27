import React, { useState, useEffect } from 'react';
import { GraduationCap, Check, X, Building, UserCheck, Camera, Image as ImageIcon, Sparkles, BookOpen } from 'lucide-react';
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
                Cập nhật tên lớp, phân loại lớp, giáo viên và cấu hình sơ đồ
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm max-h-[85vh] overflow-y-auto">
          
          {/* Class Role / Type */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Phân loại & Vai trò với lớp</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setClassType('gvcn')}
                className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  classType === 'gvcn'
                    ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4" /> Lớp Chủ Nhiệm (GVCN)
              </button>

              <button
                type="button"
                onClick={() => setClassType('bomon')}
                className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  classType === 'bomon'
                    ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Lớp Bộ Môn / Chuyên Ngành
              </button>
            </div>
          </div>

          {/* Subject (if Bộ Môn) */}
          {classType === 'bomon' && (
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 animate-in fade-in">
              <label className="block text-xs font-bold text-amber-900 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" /> Môn giảng dạy tại lớp này:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Toán, Ngữ văn, Tiếng Anh, Tin học, Vật lí..."
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Toán', 'Ngữ văn', 'Tiếng Anh', 'KHTN (Lí/Hóa/Sinh)', 'Lịch sử & Địa lí', 'Tin học', 'Công nghệ', 'Âm nhạc', 'Mỹ thuật', 'GDTC'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Phòng học / Vị trí
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Ví dụ: Phòng 204..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" /> {classType === 'bomon' ? 'GV Giảng dạy' : 'GV Chủ nhiệm'}
              </label>
              <input
                type="text"
                value={homeroomTeacher}
                onChange={(e) => setHomeroomTeacher(e.target.value)}
                placeholder="Ví dụ: Thầy/Cô..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold text-slate-800"
              />
            </div>
          </div>


          {/* Class Photo & Cover Customization */}
          <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-200 space-y-3">
            <span className="font-extrabold text-xs text-pink-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Ảnh đại diện & ảnh bìa riêng của lớp {name || targetClass.name}:
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Class Avatar */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600">Ảnh đại diện lớp</label>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-2 border-pink-300 overflow-hidden bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-xs shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{name ? name.slice(0, 3) : 'LỚP'}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="px-2.5 py-1 rounded-lg bg-white border border-pink-200 text-pink-700 font-bold text-[11px] hover:bg-pink-50 cursor-pointer inline-flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Tải ảnh
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
                        className="text-[10px] text-rose-500 hover:underline block font-semibold"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Class Cover Photo */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600">Ảnh bìa lớp</label>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-12 rounded-xl border-2 border-pink-300 overflow-hidden bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-[10px] shrink-0">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-pink-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="px-2.5 py-1 rounded-lg bg-white border border-pink-200 text-pink-700 font-bold text-[11px] hover:bg-pink-50 cursor-pointer inline-flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Tải ảnh
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
                        className="text-[10px] text-rose-500 hover:underline block font-semibold"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Class Bio / Slogan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Khẩu hiệu / Giới thiệu riêng của lớp</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ví dụ: Đoàn kết là sức mạnh • Học hết sức, chơi hết mình!"
                className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
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
