import React, { useState, useRef } from 'react';
import {
  Camera,
  Check,
  ZoomIn,
  Sparkles,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onUpdated: () => Promise<void>;
}

export const GroupPhotoTaggingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  onUpdated,
}) => {
  const { currentClass, triggerConfetti } = useApp();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropSize, setCropSize] = useState<number>(100); // diameter of crop area
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [croppedAvatarData, setCroppedAvatarData] = useState<string | null>(null);
  const [clickCoord, setClickCoord] = useState<{ x: number; y: number } | null>(null);
  const [taggedStudentIds, setTaggedStudentIds] = useState<string[]>(() => {
    return students.filter((s) => !!s.avatarUrl).map((s) => s.id);
  });

  const imageRef = useRef<HTMLImageElement>(null);


  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setCroppedAvatarData(null);
      setClickCoord(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale coordinates to natural image dimensions
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    const naturalX = clickX * scaleX;
    const naturalY = clickY * scaleY;

    setClickCoord({ x: clickX, y: clickY });

    // Crop using canvas
    const canvas = document.createElement('canvas');
    const actualCropRadius = (cropSize / 2) * scaleX;
    const actualCropDiameter = actualCropRadius * 2;

    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw circular cropped face
    ctx.beginPath();
    ctx.arc(80, 80, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      img,
      naturalX - actualCropRadius,
      naturalY - actualCropRadius,
      actualCropDiameter,
      actualCropDiameter,
      0,
      0,
      160,
      160
    );

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setCroppedAvatarData(base64);

    // Auto-select first untagged student if not selected
    if (!selectedStudentId) {
      const untagged = students.find((s) => !taggedStudentIds.includes(s.id));
      if (untagged) setSelectedStudentId(untagged.id);
      else if (students[0]) setSelectedStudentId(students[0].id);
    }
  };

  const handleAssignAvatar = async () => {
    if (!selectedStudentId || !croppedAvatarData || !currentClass) return;

    await db.students.update(selectedStudentId, {
      avatarUrl: croppedAvatarData,
    });

    setTaggedStudentIds((prev) => [...new Set([...prev, selectedStudentId])]);
    await onUpdated();
    triggerConfetti();

    // Reset crop preview to prepare for next student
    setCroppedAvatarData(null);
    setClickCoord(null);

    // Auto-advance to next untagged student
    const nextUntagged = students.find(
      (s) => s.id !== selectedStudentId && !taggedStudentIds.includes(s.id)
    );
    if (nextUntagged) {
      setSelectedStudentId(nextUntagged.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-pink-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                Gán Ảnh Đại Diện Nhanh Từ Ảnh Tập Thể Lớp 📸
              </h3>
              <p className="text-xs text-pink-100">
                Nhấp chuột vào khuôn mặt từng học sinh trên ảnh để tự động cắt và lưu avatar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2 cols): Interactive Image Viewer */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Upload Button */}
            {!imageSrc ? (
              <label className="border-3 border-dashed border-pink-300 rounded-3xl p-12 flex flex-col items-center justify-center gap-3 bg-pink-50/40 hover:bg-pink-100/50 transition-all cursor-pointer text-center">
                <div className="w-16 h-16 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="font-extrabold text-base text-pink-800">
                  Tải Lên Bức Ảnh Tập Thể Lớp (Khai giảng, Dã ngoại...)
                </div>
                <p className="text-xs text-slate-500 max-w-sm">
                  Chỉ cần 1 bức ảnh chụp chung rõ mặt cả lớp, cô có thể gán ảnh cho toàn bộ học sinh trong 1 phút!
                </p>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-pink-50 p-2.5 rounded-2xl border border-pink-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    <span>Nhấp chuột vào mặt học sinh trên ảnh</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cỡ mặt:</span>
                      <input
                        type="range"
                        min={60}
                        max={180}
                        value={cropSize}
                        onChange={(e) => setCropSize(Number(e.target.value))}
                        className="w-20 accent-pink-500 cursor-pointer"
                      />
                    </div>

                    <label className="text-pink-600 hover:underline cursor-pointer text-[11px] font-bold">
                      Đổi ảnh khác
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Main Photo Canvas Wrapper */}
                <div className="relative border-2 border-pink-200 rounded-3xl overflow-hidden shadow-inner bg-slate-900 flex items-center justify-center max-h-[500px]">
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Ảnh tập thể lớp"
                    onClick={handleImageClick}
                    className="max-h-[500px] w-auto object-contain cursor-crosshair select-none"
                  />

                  {/* Marker Circle overlay on clicked coordinate */}
                  {clickCoord && (
                    <div
                      style={{
                        left: clickCoord.x - cropSize / 2,
                        top: clickCoord.y - cropSize / 2,
                        width: cropSize,
                        height: cropSize,
                      }}
                      className="absolute rounded-full border-3 border-pink-400 bg-pink-400/20 pointer-events-none animate-ping duration-1000 shadow-xl"
                    />
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column (1 col): Face Preview & Student Assignment */}
          <div className="space-y-4">
            
            {/* Cropped Face Preview Card */}
            <div className="glass-card p-5 rounded-3xl text-center space-y-3 border-pink-300">
              <h4 className="text-xs font-black uppercase tracking-wider text-pink-800">
                Khuôn Mặt Vừa Cắt
              </h4>

              {croppedAvatarData ? (
                <div className="space-y-3">
                  <img
                    src={croppedAvatarData}
                    alt="Avatar Preview"
                    className="w-24 h-24 rounded-full mx-auto border-4 border-pink-400 shadow-md object-cover"
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Gán cho học sinh:
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pink-400 text-slate-800"
                    >
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {taggedStudentIds.includes(st.id) ? '✅ ' : '⭕ '}
                          {st.rollNumber}. {st.fullName} ({st.gender})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAssignAvatar}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-black text-xs shadow-md shadow-pink-300/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Lưu Avatar Học Sinh Này
                  </button>
                </div>
              ) : (
                <div className="py-8 text-xs text-slate-400 font-medium">
                  {imageSrc
                    ? '👈 Hãy nhấp chuột vào khuôn mặt học sinh trên ảnh bên trái để cắt avatar'
                    : 'Hãy tải ảnh lên trước'}
                </div>
              )}
            </div>

            {/* Students Completion Progress Checklist */}
            <div className="glass-card p-4 rounded-3xl space-y-2 max-h-[260px] overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1">
                <span>Tiến độ đã gán ảnh</span>
                <span className="text-pink-600">
                  {taggedStudentIds.length}/{students.length} em
                </span>
              </div>

              <div className="space-y-1">
                {students.map((st) => {
                  const isDone = taggedStudentIds.includes(st.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all ${
                        selectedStudentId === st.id
                          ? 'bg-pink-100/90 font-black text-pink-900 border border-pink-300'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {st.avatarUrl ? (
                          <img src={st.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-[9px] shrink-0">
                            {st.rollNumber}
                          </div>
                        )}
                        <span className="truncate">{st.fullName}</span>
                      </div>

                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-400 shrink-0">Chưa có</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
