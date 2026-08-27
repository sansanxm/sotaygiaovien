import React, { useState, useEffect, useRef } from 'react';
import {
  Dices,
  Star,
  Users,
  CheckCircle2,
  Trophy,
  RotateCcw,
  Sparkles,
  Maximize,
  Minimize,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student, BehaviorLog } from '../types';

import { getStudentInitial } from '../utils/studentHelper';

export const RandomPicker: React.FC = () => {
  const { currentClass } = useApp();

  const [students, setStudents] = useState<Student[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickCount, setPickCount] = useState<number>(1);
  const [winners, setWinners] = useState<Student[]>([]);
  const [showWinnerPopup, setShowWinnerPopup] = useState<boolean>(false);
  const [calledHistory, setCalledHistory] = useState<Student[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);


  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Pastel Colors for Wheel Segments
  const wheelColors = [
    '#f472b6', '#fb7185', '#c084fc', '#818cf8',
    '#38bdf8', '#34d399', '#a3e635', '#facc15',
    '#fb923c', '#f43f5e', '#e879f9', '#2dd4bf',
  ];

  const loadStudents = async () => {
    if (!currentClass) return;
    const list = await db.students
      .where('classId')
      .equals(currentClass.id)
      .sortBy('rollNumber');
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, [currentClass]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Draw the wheel on Canvas
  const drawWheel = (rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || students.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const numSegments = students.length;
    const segmentAngle = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, width, height);

    // Draw Wheel Outer Shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fill();
    ctx.restore();

    // Draw Segments
    for (let i = 0; i < numSegments; i++) {
      const startAngle = rotationAngle + i * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      const student = students[i];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternating pastel color
      ctx.fillStyle = wheelColors[i % wheelColors.length];
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw Text (Student Name)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Quicksand, Nunito, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;

      // Truncate name if long
      const displayName = student.fullName.length > 15 ? student.fullName.slice(0, 13) + '..' : student.fullName;
      ctx.fillText(displayName, radius - 20, 5);
      ctx.restore();

      ctx.restore();
    }

    // Draw Center Circle Cap
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 34, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f472b6';
    ctx.stroke();

    // Center emoji / star
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '22px sans-serif';
    ctx.fillText('🎯', centerX, centerY);
    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [students]);

  const triggerGrandConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.6 } };

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  // Spin Wheel with Easing
  const spinWheel = () => {
    if (isSpinning || students.length === 0) return;

    setIsSpinning(true);
    setWinners([]);
    setShowWinnerPopup(false);

    const actualCount = Math.min(pickCount, students.length);
    const winningIndex = Math.floor(Math.random() * students.length);
    const primaryStudent = students[winningIndex];

    // Pick additional distinct winners if pickCount > 1
    const chosenWinners: Student[] = [primaryStudent];
    if (actualCount > 1) {
      const remainingStudents = students.filter((_, idx) => idx !== winningIndex);
      const shuffledOthers = [...remainingStudents].sort(() => Math.random() - 0.5);
      for (let i = 0; i < actualCount - 1; i++) {
        if (shuffledOthers[i]) {
          chosenWinners.push(shuffledOthers[i]);
        }
      }
    }

    const numSegments = students.length;
    const segmentAngle = (2 * Math.PI) / numSegments;

    const targetSegmentCenter = winningIndex * segmentAngle + segmentAngle / 2;
    const desiredAngle = (3 * Math.PI) / 2 - targetSegmentCenter;

    const extraSpins = (7 + Math.floor(Math.random() * 4)) * (2 * Math.PI);
    const startRotation = currentRotationRef.current % (2 * Math.PI);
    const finalRotation = startRotation + extraSpins + ((desiredAngle - startRotation + 4 * Math.PI) % (2 * Math.PI));

    const startTime = performance.now();
    const duration = 4800; // 4.8 seconds

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentAngle = startRotation + (finalRotation - startRotation) * easedProgress;
      currentRotationRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setWinners(chosenWinners);
        setIsSpinning(false);
        setShowWinnerPopup(true);
        setCalledHistory((prev) => {
          const newHistory = [...chosenWinners, ...prev.filter((p) => !chosenWinners.some((w) => w.id === p.id))];
          return newHistory.slice(0, 15);
        });
        triggerGrandConfetti();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleAddStarToAllWinners = async (points: number, title: string) => {
    if (winners.length === 0 || !currentClass) return;

    const newLogs: BehaviorLog[] = winners.map((w, idx) => ({
      id: `bh-${Date.now()}-${idx}`,
      classId: currentClass.id,
      studentId: w.id,
      date: new Date().toISOString().split('T')[0],
      type: 'praise',
      points,
      title,
    }));

    await db.behaviorLogs.bulkAdd(newLogs);
    triggerGrandConfetti();
    alert(`Đã cộng +${points} điểm sao cho cả ${winners.length} học sinh được chọn! ⭐`);
  };

  const handleAddStarToSingleWinner = async (targetStudent: Student, points: number, title: string) => {
    if (!currentClass) return;

    const newLog: BehaviorLog = {
      id: `bh-${Date.now()}`,
      classId: currentClass.id,
      studentId: targetStudent.id,
      date: new Date().toISOString().split('T')[0],
      type: 'praise',
      points,
      title,
    };

    await db.behaviorLogs.add(newLog);
    triggerGrandConfetti();
    alert(`Đã cộng +${points} điểm sao cho em ${targetStudent.fullName}! ⭐`);
  };


  return (
    <div
      ref={containerRef}
      style={isFullscreen ? { background: 'var(--theme-bg-gradient)' } : undefined}
      className={`space-y-6 animate-in fade-in duration-300 ${
        isFullscreen ? 'p-6 sm:p-10 min-h-screen overflow-y-auto' : ''
      }`}
    >
      
      {/* Top Header Bar */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Dices className="w-6 h-6 theme-text animate-bounce" /> Vòng quay may mắn gọi tên học sinh
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            Bốc thăm ngẫu nhiên bài cũ, phát biểu và trò chơi lớp học
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs sm:text-sm font-extrabold theme-badge px-4 py-2 rounded-2xl">
            Sĩ số: {students.length} học sinh
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md theme-btn-primary text-white"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Mở toàn màn hình cho cả lớp quan sát'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span>{isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình 📺'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Wheel (2 cols) & Winner History (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Canvas Wheel */}
        <div className="lg:col-span-2 glass-card p-6 sm:p-10 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden min-h-[520px]">
          
          {/* Pick Count Selector Pills */}
          <div className="mb-4 z-20 flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200">
            <span className="text-xs font-black text-slate-500 px-2 flex items-center gap-1">
              Chế độ gọi:
            </span>
            {[
              { count: 1, label: '🎯 Gọi 1 HS' },
              { count: 2, label: '👥 Gọi 2 HS' },
              { count: 3, label: '👨‍👩‍👧 Gọi 3 HS' },
              { count: 4, label: '🌟 Gọi 4 HS' },
            ].map((item) => (
              <button
                key={item.count}
                disabled={isSpinning}
                onClick={() => setPickCount(item.count)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  pickCount === item.count
                    ? 'theme-btn-primary text-white shadow-md transform scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Wheel Pointer (Kim chỉ trên đỉnh) */}
          <div className="relative z-20 flex flex-col items-center -mb-4">
            <div className="w-7 h-10 theme-btn-primary rounded-b-full shadow-2xl border-2 border-white flex items-center justify-center transform drop-shadow-lg">
              <span className="text-[12px] text-white font-black">▼</span>
            </div>
          </div>

          {/* The Canvas Wheel */}
          <div className="relative my-2">
            <canvas
              ref={canvasRef}
              width={isFullscreen ? 520 : 440}
              height={isFullscreen ? 520 : 440}
              className="max-w-full h-auto drop-shadow-2xl transition-all"
            />
          </div>

          {/* Spin Trigger Button */}
          <div className="mt-6">
            <button
              disabled={isSpinning || students.length === 0}
              onClick={spinWheel}
              className={`px-10 py-4 rounded-3xl font-black text-base sm:text-xl flex items-center justify-center gap-3 shadow-2xl transition-all cursor-pointer ${
                isSpinning
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'theme-btn-primary text-white transform hover:scale-105 active:scale-95'
              }`}
            >
              <RotateCcw className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>
                {isSpinning
                  ? `Đang quay chọn ${pickCount} học sinh...`
                  : `Quay gọi ${pickCount} học sinh 🎯`}
              </span>
            </button>
          </div>

        </div>

        {/* Right Column: History List */}
        <div className="space-y-6">
          
          {/* Winner Snapshot Card */}
          <div className="glass-card p-6 rounded-3xl text-center space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider theme-text flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Vừa bốc thăm gần nhất
            </h3>

            {winners.length > 0 ? (
              <div className="space-y-3">
                {winners.length === 1 ? (
                  <>
                    {winners[0].avatarUrl ? (
                      <img
                        src={winners[0].avatarUrl}
                        alt={winners[0].fullName}
                        className="w-20 h-20 rounded-full mx-auto border-4 theme-card-border shadow-md object-cover"
                      />
                    ) : (
                      <div
                        className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center font-black text-2xl shadow-md border-4 ${
                          winners[0].gender === 'Nữ'
                            ? 'bg-rose-200 text-rose-800 border-rose-300'
                            : 'bg-sky-200 text-sky-800 border-sky-300'
                        }`}
                      >
                        {getStudentInitial(winners[0].fullName)}
                      </div>
                    )}

                    <div>
                      <h4 className="text-xl font-black text-slate-800">{winners[0].fullName}</h4>
                      <p className="text-xs sm:text-sm font-bold theme-text">
                        STT: {winners[0].rollNumber} • Giới tính: {winners[0].gender}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-bold theme-text block">
                      Đã chọn {winners.length} học sinh cùng lúc:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {winners.map((w) => (
                        <div
                          key={w.id}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-left flex items-center gap-2 shadow-2xs"
                        >
                          {w.avatarUrl ? (
                            <img src={w.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <span className="w-7 h-7 rounded-full theme-soft-bg theme-text font-bold text-xs flex items-center justify-center shrink-0">
                              {getStudentInitial(w.fullName)}
                            </span>
                          )}
                          <div className="truncate">
                            <p className="font-extrabold text-xs text-slate-800 truncate">{w.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">#{w.rollNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowWinnerPopup(true)}
                  className="px-4 py-2 rounded-xl theme-btn-secondary text-xs font-bold transition-colors cursor-pointer w-full mt-2"
                >
                  Xem lại bảng chúc mừng 🎊
                </button>
              </div>
            ) : (
              <div className="py-8 text-xs sm:text-sm text-slate-400 font-medium">
                Bấm nút "QUAY GỌI HỌC SINH" để bắt đầu!
              </div>
            )}
          </div>

          {/* Called History */}
          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl theme-soft-bg theme-text">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700">
                  Đã gọi gần đây
                </h4>
              </div>


              {calledHistory.length > 0 && (
                <button
                  onClick={() => setCalledHistory([])}
                  className="text-xs font-bold text-slate-400 hover:text-pink-600 cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>

            {calledHistory.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-400 text-center py-4">Chưa có lượt quay nào</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {calledHistory.map((st, idx) => (
                  <div
                    key={`${st.id}-${idx}`}
                    className="p-3 rounded-2xl bg-white/90 border theme-card-border flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {st.avatarUrl ? (
                        <img src={st.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <span className="w-6 h-6 rounded-full theme-soft-bg theme-text font-black text-xs flex items-center justify-center">
                          {getStudentInitial(st.fullName)}
                        </span>
                      )}
                      <span>{st.fullName}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* =========================================================
          GIANT CENTER WINNER POPUP MODAL (1, 2, 3, or 4 Students)
          ========================================================= */}
      {showWinnerPopup && winners.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className={`bg-white rounded-3xl w-full border-4 border-amber-300 shadow-2xl overflow-hidden text-center relative p-6 sm:p-8 animate-in zoom-in-95 duration-300 ${
              winners.length === 1 ? 'max-w-xl' : 'max-w-4xl'
            }`}
          >
            
            {/* Close button */}
            <button
              onClick={() => setShowWinnerPopup(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sparkles Ribbon */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-amber-950 font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-amber-300/50 mb-4 animate-bounce">
              <Sparkles className="w-4 h-4" />
              {winners.length === 1
                ? 'CHÚC MỪNG HỌC SINH MAY MẮN 🎉'
                : `CHÚC MỪNG ${winners.length} HỌC SINH ĐƯỢC GỌI 🎉`}
            </div>

            {/* Case 1: Single Winner */}
            {winners.length === 1 && (
              <>
                <div className="my-4 relative inline-block">
                  {winners[0].avatarUrl ? (
                    <img
                      src={winners[0].avatarUrl}
                      alt={winners[0].fullName}
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto border-4 border-amber-400 shadow-2xl object-cover"
                    />
                  ) : (
                    <div
                      className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto flex items-center justify-center font-black text-5xl sm:text-6xl shadow-2xl border-4 ${
                        winners[0].gender === 'Nữ'
                          ? 'bg-gradient-to-tr from-pink-300 to-rose-200 text-pink-900 border-pink-400'
                          : 'bg-gradient-to-tr from-sky-300 to-blue-200 text-sky-900 border-sky-400'
                      }`}
                    >
                      {getStudentInitial(winners[0].fullName)}
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-400 border-2 border-white text-white flex items-center justify-center font-black text-lg shadow-md">
                    ⭐
                  </div>
                </div>

                <div className="space-y-1 my-3">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                    {winners[0].fullName}
                  </h2>
                  <p className="text-sm sm:text-base font-extrabold text-pink-600">
                    STT: {winners[0].rollNumber} • Giới tính: {winners[0].gender} • {currentClass?.name}
                  </p>
                </div>

                {/* Instant Star Reward Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleAddStarToSingleWinner(winners[0], 5, 'Trả lời bài cũ xuất sắc')}
                    className="py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span>+5 Sao Bài Cũ Tốt ⭐</span>
                  </button>

                  <button
                    onClick={() => handleAddStarToSingleWinner(winners[0], 10, 'Phát biểu đúng câu hỏi khó')}
                    className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-300 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
                  >
                    <Trophy className="w-4 h-4 text-emerald-600" />
                    <span>+10 Sao Điểm 10 🏆</span>
                  </button>
                </div>
              </>
            )}

            {/* Case 2: Multi Winners (2, 3, or 4 students) */}
            {winners.length > 1 && (
              <div className="my-4 space-y-4">
                <div
                  className={`grid gap-4 ${
                    winners.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : winners.length === 3
                      ? 'grid-cols-1 sm:grid-cols-3'
                      : 'grid-cols-2 sm:grid-cols-4'
                  }`}
                >
                  {winners.map((st, idx) => (
                    <div
                      key={st.id}
                      className="p-4 rounded-3xl bg-slate-50 border-2 border-amber-200/80 shadow-md flex flex-col items-center justify-between text-center relative space-y-2 hover:border-amber-400 transition-all"
                    >
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </div>

                      {st.avatarUrl ? (
                        <img
                          src={st.avatarUrl}
                          alt={st.fullName}
                          className="w-20 h-20 rounded-full object-cover border-4 border-amber-300 shadow-md"
                        />
                      ) : (
                        <div
                          className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl shadow-md border-4 ${
                            st.gender === 'Nữ'
                              ? 'bg-rose-200 text-rose-800 border-rose-300'
                              : 'bg-sky-200 text-sky-800 border-sky-300'
                          }`}
                        >
                          {getStudentInitial(st.fullName)}
                        </div>
                      )}

                      <div>
                        <h4 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                          {st.fullName}
                        </h4>
                        <p className="text-xs font-bold theme-text mt-0.5">
                          STT: {st.rollNumber} • {st.gender}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddStarToSingleWinner(st, 5, 'Phát biểu hăng hái')}
                        className="w-full py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>+5 Sao</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Group Star Reward Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleAddStarToAllWinners(5, 'Trả lời bài tốt')}
                    className="py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span>+5 Sao Cho Cả {winners.length} Bạn ⭐</span>
                  </button>

                  <button
                    onClick={() => handleAddStarToAllWinners(10, 'Nhóm hoàn thành xuất sắc')}
                    className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-300 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
                  >
                    <Trophy className="w-4 h-4 text-emerald-600" />
                    <span>+10 Sao Cho Cả {winners.length} Bạn 🏆</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Bottom */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowWinnerPopup(false);
                  setTimeout(spinWheel, 300);
                }}
                className="flex-1 py-3 rounded-2xl theme-btn-primary text-white font-extrabold text-sm sm:text-base shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                🎯 Quay Lượt Tiếp Theo
              </button>

              <button
                onClick={() => setShowWinnerPopup(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm cursor-pointer"
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
