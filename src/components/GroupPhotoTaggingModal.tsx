import React, { useState, useRef } from 'react';
import {
  Camera,
  Check,
  ZoomIn,
  ZoomOut,
  Scissors,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Eye,
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
  const [cropSize, setCropSize] = useState<number>(45); // diameter in px (supports ultra-small 15px to 200px)
  const [zoom, setZoom] = useState<number>(1); // zoom level 1x -> 4x
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [croppedAvatarData, setCroppedAvatarData] = useState<string | null>(null);
  const [clickCoord, setClickCoord] = useState<{ x: number; y: number } | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [taggedStudentIds, setTaggedStudentIds] = useState<string[]>(() => {
    return students.filter((s) => !!s.avatarUrl).map((s) => s.id);
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setCroppedAvatarData(null);
      setClickCoord(null);
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imageRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    setHoverCoord({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
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

    const base64 = canvas.toDataURL('image/jpeg', 0.9);
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

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((prev) => Math.min(prev + 0.25, 4));
      } else {
        setZoom((prev) => Math.max(prev - 0.25, 1));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-6xl w-full border border-pink-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                Gán Ảnh Đại Diện Tự Động Từ Ảnh Tập Thể Lớp 📸
              </h3>
              <p className="text-xs text-pink-100 font-medium">
                Zoom to ảnh và nhấp chuột trực tiếp vào mặt từng học sinh để tự động cắt avatar chuẩn xác
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2 cols): Interactive Image Viewer with Zoom & Crop Controls */}
          <div className="lg:col-span-2 space-y-3 flex flex-col">
            
            {/* Upload Area when no image */}
            {!imageSrc ? (
              <label className="border-3 border-dashed border-pink-300 rounded-3xl p-12 flex flex-col items-center justify-center gap-3 bg-pink-50/40 hover:bg-pink-100/50 transition-all cursor-pointer text-center flex-1 min-h-[350px]">
                <div className="w-16 h-16 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="font-extrabold text-base text-pink-800">
                  Tải Lên Bức Ảnh Tập Thể Lớp (Khai giảng, Dã ngoại, Bế giảng...)
                </div>
                <p className="text-xs text-slate-500 max-w-sm">
                  Chỉ cần 1 bức ảnh chụp chung rõ mặt cả lớp, cô có thể zoom to và gán ảnh cho toàn bộ học sinh trong 1 phút!
                </p>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <>
                {/* Multi-function Control Bar (Zoom & Fine Crop Size) */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  
                  {/* 1. Zoom Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5 text-pink-500" /> Zoom:
                    </span>
                    <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs">
                      <button
                        onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                        disabled={zoom <= 1}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Thu nhỏ ảnh"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>

                      <span className="px-2 font-mono font-black text-pink-600 text-xs min-w-[45px] text-center">
                        {Math.round(zoom * 100)}%
                      </span>

                      <button
                        onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
                        disabled={zoom >= 4}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Phóng to ảnh"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Zoom Presets */}
                    <div className="hidden sm:flex items-center gap-1">
                      {[1, 2, 3].map((zVal) => (
                        <button
                          key={zVal}
                          onClick={() => setZoom(zVal)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            zoom === zVal
                              ? 'bg-pink-500 text-white shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {zVal}x
                        </button>
                      ))}
                      {zoom > 1 && (
                        <button
                          onClick={() => setZoom(1)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 flex items-center gap-1 cursor-pointer"
                          title="Đặt lại 100%"
                        >
                          <RotateCcw className="w-3 h-3" /> 100%
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Crop Size Fine-Tuning */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-pink-500" /> Cỡ Khung Cắt:
                    </span>

                    <input
                      type="range"
                      min={15}
                      max={180}
                      step={2}
                      value={cropSize}
                      onChange={(e) => setCropSize(Number(e.target.value))}
                      className="w-24 sm:w-28 accent-pink-500 cursor-pointer"
                      title={`Đường kính cắt: ${cropSize}px`}
                    />

                    <span className="px-2 py-0.5 rounded-lg bg-pink-100 text-pink-700 font-mono font-black text-[11px] min-w-[40px] text-center">
                      {cropSize}px
                    </span>

                    {/* Quick Size Presets */}
                    <div className="flex items-center gap-1">
                      {[
                        { label: 'Rất nhỏ', size: 22 },
                        { label: 'Nhỏ', size: 40 },
                        { label: 'Vừa', size: 70 },
                        { label: 'Lớn', size: 120 },
                      ].map((preset) => (
                        <button
                          key={preset.size}
                          onClick={() => setCropSize(preset.size)}
                          className={`px-1.5 py-1 rounded-lg text-[9px] font-extrabold cursor-pointer transition-all ${
                            cropSize === preset.size
                              ? 'bg-pink-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change Photo Link */}
                  <label className="text-pink-600 hover:text-pink-700 underline cursor-pointer text-[11px] font-bold shrink-0">
                    Đổi ảnh khác
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {/* Main Interactive Photo Canvas Wrapper with Pan/Scroll */}
                <div
                  ref={scrollContainerRef}
                  onWheel={handleWheelZoom}
                  className="relative border-2 border-pink-200 rounded-3xl overflow-auto custom-scrollbar shadow-inner bg-slate-950 flex items-center justify-center min-h-[420px] max-h-[550px]"
                >
                  <div
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="relative inline-block select-none"
                  >
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      alt="Ảnh tập thể lớp"
                      onClick={handleImageClick}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      className="max-h-[500px] w-auto object-contain cursor-crosshair block"
                    />

                    {/* Live Aiming Reticle Circle (Theo con trỏ chuột) */}
                    {hoverCoord && (
                      <div
                        style={{
                          left: hoverCoord.x - cropSize / 2,
                          top: hoverCoord.y - cropSize / 2,
                          width: cropSize,
                          height: cropSize,
                        }}
                        className="absolute rounded-full border-2 border-dashed border-yellow-300 bg-pink-500/25 pointer-events-none shadow-lg backdrop-blur-[0.5px]"
                      >
                        {/* Center Crosshair Dot */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-xs" />
                      </div>
                    )}

                    {/* Marker Circle overlay on clicked coordinate */}
                    {clickCoord && (
                      <div
                        style={{
                          left: clickCoord.x - cropSize / 2,
                          top: clickCoord.y - cropSize / 2,
                          width: cropSize,
                          height: cropSize,
                        }}
                        className="absolute rounded-full border-3 border-pink-400 bg-pink-400/30 pointer-events-none shadow-xl ring-4 ring-pink-300/40"
                      />
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between px-1">
                  <span>💡 Giữ phím <strong>Ctrl</strong> và <strong>Cuộn chuột</strong> để phóng to/thu nhỏ nhanh</span>
                  <span>Vòng tròn đứt khúc màu vàng là kích thước mặt sẽ được cắt</span>
                </div>
              </>
            )}

          </div>

          {/* Right Column (1 col): Face Preview & Student Assignment */}
          <div className="space-y-4 flex flex-col justify-between">
            
            {/* Cropped Face Preview Card */}
            <div className="glass-card p-5 rounded-3xl text-center space-y-3.5 border-pink-300 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-wider text-pink-800 flex items-center justify-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-pink-600" /> Khuôn Mặt Vừa Cắt
              </h4>

              {croppedAvatarData ? (
                <div className="space-y-3.5 animate-in zoom-in-95">
                  <div className="relative inline-block">
                    <img
                      src={croppedAvatarData}
                      alt="Avatar Preview"
                      className="w-28 h-28 rounded-full mx-auto border-4 border-pink-400 shadow-lg object-cover bg-white"
                    />
                    <div className="absolute bottom-0 right-0 p-1 rounded-full bg-emerald-500 text-white shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Gán cho học sinh:
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-pink-200 bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pink-400 text-slate-800 shadow-2xs"
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
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-black text-xs shadow-md shadow-pink-300/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                  >
                    <Check className="w-4 h-4" /> Lưu Avatar Cho Học Sinh Này
                  </button>
                </div>
              ) : (
                <div className="py-10 px-4 text-xs text-slate-400 font-medium bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  {imageSrc
                    ? '👈 Hãy di chuột và nhấp vào khuôn mặt học sinh trên ảnh bên trái để cắt avatar'
                    : 'Hãy tải ảnh tập thể lên trước'}
                </div>
              )}
            </div>

            {/* Students Completion Progress Checklist */}
            <div className="glass-card p-4 rounded-3xl space-y-2 flex-1 max-h-[300px] overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                <span>Tiến độ đã gán ảnh</span>
                <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-black text-[11px]">
                  {taggedStudentIds.length}/{students.length} em ({students.length > 0 ? Math.round((taggedStudentIds.length / students.length) * 100) : 0}%)
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
                          ? 'bg-pink-100 font-black text-pink-900 border border-pink-300 shadow-2xs'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {st.avatarUrl ? (
                          <img src={st.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 border border-pink-300" />
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
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">Chưa có</span>
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
