import React, { useState, useEffect, useRef } from 'react';
import {
  Dices,
  Star,
  Trophy,
  RotateCcw,
  Maximize,
  Minimize,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student, BehaviorLog } from '../types';


// Web Audio API Synthesizer for Zero-Latency Spin Sounds
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Crisp tick sound when wheel needle passes segment pin
const playTickSound = (speedRatio: number) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 480 + Math.max(0, speedRatio) * 520;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch { }
};

// Grand Victory Fanfare audio effect when wheel lands on winner
const playVictorySound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { f: 523.25, time: 0, duration: 0.15 },    // C5
      { f: 659.25, time: 0.12, duration: 0.15 }, // E5
      { f: 783.99, time: 0.24, duration: 0.15 }, // G5
      { f: 1046.50, time: 0.36, duration: 0.4 }, // C6
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(0, ctx.currentTime + n.time);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.duration);
    });

    // Grand victory chord arpeggio burst
    setTimeout(() => {
      if (!ctx) return;
      [1046.50, 1318.51, 1567.98].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      });
    }, 450);

  } catch { }
};


export const RandomPicker: React.FC = () => {
  const { currentClass } = useApp();

  const [students, setStudents] = useState<Student[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickCount, setPickCount] = useState<number>(1);
  const [winners, setWinners] = useState<Student[]>([]);
  const [showWinnerPopup, setShowWinnerPopup] = useState<boolean>(false);
  const [calledHistory, setCalledHistory] = useState<Student[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

    // Draw Wheel Outer Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();

    // Draw Segments
    students.forEach((st, i) => {
      const startAngle = rotationAngle + i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = wheelColors[i % wheelColors.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw Text (Student Name)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Nunito, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3;

      // Truncate long names
      let nameText = `${st.rollNumber}. ${st.fullName}`;
      if (numSegments > 25 && nameText.length > 12) {
        nameText = nameText.slice(0, 10) + '...';
      }
      ctx.fillText(nameText, radius - 20, 4);
      ctx.restore();

      ctx.restore();
    });

    // Draw Center Circle Cap
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f472b6';
    ctx.stroke();

    // Center Icon / Text
    ctx.fillStyle = '#db2777';
    ctx.font = 'black 14px Quicksand, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GVCN 4.0', centerX, centerY + 5);
    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [students]);

  // Grand Confetti Burst
  const triggerGrandConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  // Spin Wheel with Easing & Sound Effects
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
    let lastPinIndex = -1;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentAngle = startRotation + (finalRotation - startRotation) * easedProgress;
      currentRotationRef.current = currentAngle;
      drawWheel(currentAngle);

      // Play tick sound when needle passes a segment boundary pin
      const currentPinIndex = Math.floor(currentAngle / segmentAngle);
      if (currentPinIndex !== lastPinIndex) {
        lastPinIndex = currentPinIndex;
        if (soundEnabled) {
          playTickSound(1 - progress);
        }
      }

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

        if (soundEnabled) {
          playVictorySound();
        }
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
    alert(`Đã cộng +${points} điểm sao cho ${winners.length} học sinh được chọn! ⭐`);
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
    alert(`Đã cộng +${points} điểm cho em ${targetStudent.fullName}! ⭐`);
  };

  if (!currentClass) {
    return (
      <div className="glass-card p-12 rounded-3xl text-center text-slate-500 font-bold">
        Vui lòng chọn hoặc tạo Lớp học để sử dụng Vòng quay may mắn! 🎲
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`space-y-6 animate-in fade-in duration-300 ${isFullscreen ? 'bg-slate-900 p-6 overflow-y-auto min-h-screen text-white' : ''}`}>

      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Dices className="w-6 h-6 theme-text animate-bounce" /> Vòng quay may mắn gọi tên học sinh
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            Bốc thăm ngẫu nhiên bài cũ, phát biểu và trò chơi lớp học
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs sm:text-sm font-extrabold theme-badge px-4 py-2 rounded-2xl">
            Sĩ số: {students.length} học sinh
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer border ${soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
            title={soundEnabled ? 'Tắt âm thanh quay' : 'Bật âm thanh quay & nhạc mừng'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Nhạc: Bật 🔊' : 'Nhạc: Tắt 🔇'}</span>
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md theme-btn-primary text-white"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Mở toàn màn hình cho cả lớp quan sát'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình 📺'}</span>
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
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${pickCount === item.count
                    ? 'theme-btn-primary text-white shadow-md transform scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Wheel Pointer */}
          <div className="relative z-20 flex flex-col items-center -mb-4">
            <div className="w-7 h-10 theme-btn-primary rounded-b-full shadow-2xl border-2 border-white flex items-center justify-center transform drop-shadow-lg">
              <span className="text-[12px] text-white font-black">▼</span>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="relative z-10 p-2">
            <canvas
              ref={canvasRef}
              width={440}
              height={440}
              className="max-w-full h-auto drop-shadow-xl"
            />
          </div>

          {/* Spin Trigger Button */}
          <button
            disabled={isSpinning || students.length === 0}
            onClick={spinWheel}
            className="mt-6 z-20 px-8 py-3.5 rounded-2xl theme-btn-primary font-black text-sm sm:text-base shadow-xl flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Đang quay ngẫu nhiên...' : 'QUAY NGAY HÔM NAY! 🎲'}</span>
          </button>
        </div>

        {/* Right Column: History of Called Students */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Lịch sử gọi tên gần nhất
              </h3>
              <span className="text-xs font-bold text-slate-400">Top 15</span>
            </div>

            {calledHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                Chưa có học sinh nào được gọi. Hãy nhấn nút "Quay ngay" để bắt đầu! 🌸
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {calledHistory.map((st, idx) => (
                  <div
                    key={`${st.id}-${idx}`}
                    className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-xl bg-amber-100 text-amber-800 font-extrabold text-[11px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {st.rollNumber}. {st.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Giới tính: {st.gender}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddStarToSingleWinner(st, 1, 'Hăng hái phát biểu (Vòng quay)')}
                      className="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Cộng 1 sao thi đua"
                    >
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" /> +1 Sao
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {calledHistory.length > 0 && (
            <button
              onClick={() => setCalledHistory([])}
              className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Xóa lịch sử gọi
            </button>
          )}
        </div>

      </div>

      {/* Winner Popup Modal */}
      {showWinnerPopup && winners.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border theme-card-border shadow-2xl animate-in zoom-in-95 text-center relative overflow-hidden">

            {/* Top Confetti & Trophy Header */}
            <div className="w-20 h-20 mx-auto rounded-full theme-soft-bg border-2 theme-card-border flex items-center justify-center text-3xl shadow-inner mb-3 animate-bounce">
              🎉
            </div>

            <h3 className="text-lg sm:text-xl font-black theme-text uppercase tracking-tight">
              CHÚC MỪNG HỌC SINH ĐƯỢC CHỌN!
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-1">
              Thầy/Cô hãy gọi các em lên bảng hoặc chuẩn bị trả lời nhé!
            </p>

            {/* Winner List */}
            <div className="my-5 space-y-2.5">
              {winners.map((w, idx) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-2xl theme-soft-bg border theme-card-border shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full theme-btn-primary font-black text-xs flex items-center justify-center shadow-xs">
                      #{idx + 1}
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-black text-slate-800">
                        {w.rollNumber}. {w.fullName}
                      </div>
                      <div className="text-xs font-semibold text-slate-500">Giới tính: {w.gender}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddStarToSingleWinner(w, 1, 'Hăng hái trả lời (Vòng quay)')}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> +1 Sao
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={() => handleAddStarToAllWinners(1, 'Khen thưởng Vòng quay may mắn')}
                className="w-full sm:flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Star className="w-4 h-4 fill-white" /> Cộng +1 Sao cả {winners.length} em
              </button>

              <button
                onClick={() => setShowWinnerPopup(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                Đóng
              </button>
            </div>

            <button
              onClick={() => setShowWinnerPopup(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
