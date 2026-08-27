import React, { useEffect, useState } from 'react';

import {
  Users,
  CalendarCheck,
  Wallet,
  Sparkles,
  Cake,
  Star,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  TrendingUp,
  Dices,
  Flame,
  Award,
  Calendar,
  Camera,
  Trash2,
  Edit3,
  Crown,
  X,
} from 'lucide-react';


import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student, AttendanceRecord, TeacherTodo, TimetableEntry, DayOfWeek, TeacherTitle } from '../types';


export const Dashboard: React.FC = () => {
  const {
    currentClass,
    currentYear,
    teacherTitle,
    setTeacherTitle,
    teacherName,
    setTeacherName,
    teacherAvatar,
    setTeacherAvatar,
    teacherCover,
    setTeacherCover,
    teacherBio,
    setTeacherBio,
    updateClassPhoto,
    isVip,
    setActiveTab,
    triggerConfetti,
  } = useApp();

  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [fundBalance, setFundBalance] = useState<number>(0);
  const [topStars, setTopStars] = useState<{ student: Student; points: number }[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<{ student: Student; daysLeft: number; displayDate: string }[]>([]);
  const [todos, setTodos] = useState<TeacherTodo[]>([]);
  const [todayLessons, setTodayLessons] = useState<TimetableEntry[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');

  // Class-scoped Cover & Avatar
  const effectiveCover = currentClass?.coverUrl || teacherCover || null;
  const effectiveAvatar = currentClass?.avatarUrl || teacherAvatar || null;
  const effectiveBio = currentClass?.bio || teacherBio;

  // Profile Edit Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editTitle, setEditTitle] = useState<TeacherTitle>(teacherTitle);
  const [editName, setEditName] = useState(teacherName);
  const [editBio, setEditBio] = useState(effectiveBio);

  // Sync editBio when currentClass changes
  useEffect(() => {
    setEditBio(currentClass?.bio || teacherBio);
  }, [currentClass?.id, currentClass?.bio, teacherBio]);

  // Handle Photo Upload & Image Compression (Class-Scoped)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, JPEG, WEBP)!');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      alert('Không thể đọc file ảnh. Vui lòng thử lại!');
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        alert('Lỗi khi tải ảnh. Vui lòng chọn ảnh khác!');
      };

      img.onload = async () => {
        try {
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
            if (currentClass) {
              await updateClassPhoto(currentClass.id, type, compressed);
            } else {
              if (type === 'avatar') {
                setTeacherAvatar(compressed);
              } else {
                setTeacherCover(compressed);
              }
            }
            triggerConfetti();
          }
        } catch (err) {
          console.error('Lỗi nén ảnh:', err);
          alert('Không thể xử lý ảnh này trên thiết bị. Vui lòng chọn ảnh có dung lượng nhỏ hơn!');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherTitle(editTitle);
    setTeacherName(editName);
    setTeacherBio(editBio);
    if (currentClass) {
      await updateClassPhoto(currentClass.id, 'bio', editBio);
    }
    setIsEditingProfile(false);
    triggerConfetti();
  };





  useEffect(() => {
    if (!currentClass) return;

    const loadDashboardData = async () => {
      // 1. Students
      const studentList = await db.students.where('classId').equals(currentClass.id).toArray();
      setStudents(studentList);

      // 2. Today attendance
      const todayStr = new Date().toISOString().split('T')[0];
      const attList = await db.attendance.where('classId').equals(currentClass.id).and(a => a.date === todayStr).toArray();
      setTodayAttendance(attList);

      // 3. Fund balance
      const fundList = await db.fundTransactions.where('classId').equals(currentClass.id).toArray();
      const income = fundList.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
      const expense = fundList.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      setFundBalance(income - expense);

      // 4. Star Leaderboard
      const logs = await db.behaviorLogs.where('classId').equals(currentClass.id).toArray();
      const pointsMap: Record<string, number> = {};
      logs.forEach(l => {
        pointsMap[l.studentId] = (pointsMap[l.studentId] || 0) + l.points;
      });

      const ranking = studentList
        .map(st => ({
          student: st,
          points: pointsMap[st.id] || 0,
        }))
        .filter(r => r.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);
      setTopStars(ranking);

      // 5. Upcoming birthdays in current & next month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;

      const bdays = studentList
        .map(st => {
          if (!st.dob) return null;
          const [, m, d] = st.dob.split('-').map(Number);
          if (!m || !d) return null;

          // calculate next birthday
          let bdayYear = now.getFullYear();
          let bdayDate = new Date(bdayYear, m - 1, d);
          if (bdayDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            bdayDate = new Date(bdayYear + 1, m - 1, d);
          }

          const diffTime = bdayDate.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return {
            student: st,
            daysLeft,
            displayDate: `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}`,
            isThisMonth: m === currentMonth,
          };
        })
        .filter(b => b !== null && b.daysLeft <= 45)
        .sort((a, b) => a!.daysLeft - b!.daysLeft)
        .slice(0, 4) as { student: Student; daysLeft: number; displayDate: string }[];

      setUpcomingBirthdays(bdays);

      // 6. Todos
      const todoList = await db.todos.where('classId').equals(currentClass.id).toArray();
      setTodos(todoList);

      // 7. Today's Timetable Lessons
      const dayMap: Record<number, DayOfWeek> = {
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
      };
      const todayDayIndex = new Date().getDay();
      const todayDayKey = dayMap[todayDayIndex];
      if (todayDayKey) {
        const lessons = await db.timetable
          .where('classId')
          .equals(currentClass.id)
          .and((t) => t.dayOfWeek === todayDayKey)
          .toArray();
        setTodayLessons(
          lessons.sort((a, b) =>
            a.session === b.session
              ? a.period - b.period
              : a.session === 'morning'
              ? -1
              : 1
          )
        );
      } else {
        setTodayLessons([]);
      }
    };

    loadDashboardData();
  }, [currentClass]);


  const handleToggleTodo = async (todo: TeacherTodo) => {
    const updated = !todo.isDone;
    await db.todos.update(todo.id, { isDone: updated });
    setTodos(prev => prev.map(t => (t.id === todo.id ? { ...t, isDone: updated } : t)));
    if (updated) {
      triggerConfetti();
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !currentClass) return;

    const newTodo: TeacherTodo = {
      id: `todo-${Date.now()}`,
      classId: currentClass.id,
      title: newTodoTitle.trim(),
      dueDate: new Date().toISOString().split('T')[0],
      isDone: false,
      priority: 'medium',
      category: 'Chủ nhiệm',
    };

    await db.todos.add(newTodo);
    setTodos(prev => [newTodo, ...prev]);
    setNewTodoTitle('');
  };

  const boysCount = students.filter(s => s.gender === 'Nam').length;
  const girlsCount = students.filter(s => s.gender === 'Nữ').length;
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const excusedCount = todayAttendance.filter(a => a.status === 'excused').length;
  const lateCount = todayAttendance.filter(a => a.status === 'late').length;

  if (!currentClass) {
    return (
      <div className="text-center py-20 px-4 max-w-md mx-auto space-y-4 animate-in fade-in">
        <div className="w-20 h-20 mx-auto rounded-3xl theme-btn-primary flex items-center justify-center text-4xl shadow-xl">
          🌸
        </div>
        <h2 className="text-2xl font-black text-slate-800">Chào mừng Thầy/Cô!</h2>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Ứng dụng Sổ tay Giáo viên 4.0 đã sẵn sàng. Hãy bấm nút <strong>"+ Lớp mới"</strong> ở thanh menu bên trái (hoặc trên thanh đầu trang điện thoại) để bắt đầu tạo lớp học đầu tiên!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Facebook-style Teacher Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden relative transition-all duration-300">

        
        {/* 1. COVER PHOTO BANNER */}
        <div className="relative w-full h-48 sm:h-64 md:h-72 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 overflow-hidden group">
          {effectiveCover ? (
            <img
              src={effectiveCover}
              alt={`Ảnh bìa lớp ${currentClass.name}`}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-101"
            />
          ) : (
            <div className="w-full h-full theme-banner relative flex items-center justify-center p-6 text-white select-none">
              {/* Cute floating stickers */}
              <div className="absolute top-4 left-6 text-white/20 text-6xl animate-pulse">🌸</div>
              <div className="absolute top-6 right-10 text-white/20 text-7xl">✨</div>
              <div className="absolute bottom-4 left-1/4 text-white/15 text-5xl">📚</div>
              <div className="absolute bottom-6 right-1/3 text-white/20 text-6xl">🎓</div>

              <div className="text-center space-y-1 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider border border-white/30 text-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Sổ tay Giáo viên 4.0
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-white drop-shadow-sm">
                  Chào mừng {teacherName ? `${teacherTitle} ${teacherName}` : teacherTitle}! 💖
                </h3>
                <p className="text-xs sm:text-sm text-white/90 font-medium">
                  {currentYear?.name || 'Năm học mới'} • Lớp {currentClass.name} • {currentClass.roomNumber || 'Phòng học chính'}
                </p>
              </div>
            </div>
          )}

          {/* Gradient Overlay at Bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

          {/* Year & Class Pill Badge (Top-Left) */}
          <div className="absolute top-3.5 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-bold text-white border border-white/25 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-300" /> {currentYear?.name || 'Năm học mới'} • Lớp {currentClass.name}
          </div>

          {/* Cover Photo Action Buttons */}
          <div className="absolute top-3.5 right-4 z-30 flex items-center gap-2">
            <label
              className="px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-800 font-extrabold text-xs shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 select-none"
              title={`Tải ảnh bìa riêng cho lớp ${currentClass.name}`}
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handlePhotoUpload(e, 'cover')}
              />
              <Camera className="w-4 h-4 text-slate-700" />
              <span>{effectiveCover ? 'Đổi ảnh bìa lớp' : 'Thêm ảnh bìa lớp'}</span>
            </label>

            {effectiveCover && (
              <button
                onClick={async () => {
                  if (window.confirm(`Thầy/Cô có muốn xóa ảnh bìa riêng của lớp ${currentClass.name}?`)) {
                    if (currentClass) {
                      await updateClassPhoto(currentClass.id, 'cover', null);
                    }
                    setTeacherCover(null);
                  }
                }}
                className="p-2 rounded-xl bg-black/40 hover:bg-rose-600/90 text-white backdrop-blur-md transition-colors cursor-pointer"
                title="Xóa ảnh bìa lớp"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>


        {/* 2. PROFILE DETAILS & AVATAR ROW (Overlapping Cover) */}
        <div className="px-6 sm:px-8 pb-6 pt-2">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-16 sm:-mt-20 relative z-20">
            
            {/* Left: Avatar + Names + Homeroom Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-5 text-center sm:text-left">
              
              {/* Avatar Circle Container */}
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-xl bg-gradient-to-tr from-pink-400 to-rose-500 overflow-hidden relative flex items-center justify-center text-white text-4xl sm:text-5xl font-black shrink-0">
                  {effectiveAvatar ? (
                    <img
                      src={effectiveAvatar}
                      alt={`Ảnh đại diện lớp ${currentClass.name}`}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-pink-400 via-rose-400 to-amber-300 text-white font-black text-3xl sm:text-4xl select-none">
                      {currentClass.name || 'LỚP'}
                    </div>
                  )}
                </div>

                {/* Camera Badge to Upload Avatar (Direct Native Touch Label) */}
                <label
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer active:scale-95 transition-transform select-none"
                  title={`Thay đổi ảnh đại diện riêng cho lớp ${currentClass.name}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handlePhotoUpload(e, 'avatar')}
                  />
                  <Camera className="w-4 h-4" />
                </label>

                {effectiveAvatar && (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Thầy/Cô có muốn xóa ảnh đại diện riêng của lớp ${currentClass.name}?`)) {
                        if (currentClass) {
                          await updateClassPhoto(currentClass.id, 'avatar', null);
                        }
                        setTeacherAvatar(null);
                      }
                    }}
                    className="absolute top-0 right-0 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md border border-white cursor-pointer"
                    title="Xóa ảnh đại diện"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>


              {/* Name & Metadata */}
              <div className="space-y-1 sm:pb-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    {teacherName ? `${teacherTitle} ${teacherName}` : teacherTitle}
                  </h1>

                  {isVip ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-extrabold text-[11px] shadow-xs border border-amber-300">
                      <Crown className="w-3 h-3 fill-slate-900" /> VIP
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-extrabold text-[11px]">
                      <Sparkles className="w-3 h-3 text-pink-500" /> Giáo viên
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 font-semibold flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span>Giáo viên Lớp <strong className="text-slate-800 font-bold">{currentClass.name}</strong></span>
                  <span>•</span>
                  <span>{currentClass.roomNumber || 'Phòng học chính'}</span>
                  <span>•</span>
                  <span>Sĩ số: <strong className="text-pink-600 font-bold">{students.length} em</strong></span>
                </p>


                {/* Slogan / Bio Quote */}
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  <p className="text-sm text-slate-600 italic max-w-xl font-medium">
                    "{effectiveBio || 'Tận tâm vì học sinh thân yêu • Mỗi ngày đến trường là một ngày vui'}"
                  </p>

                  <button
                    onClick={() => {
                      setEditTitle(teacherTitle);
                      setEditName(teacherName);
                      setEditBio(teacherBio);
                      setIsEditingProfile(true);
                    }}
                    className="p-1 text-slate-400 hover:text-pink-600 cursor-pointer rounded-lg hover:bg-pink-50"
                    title="Chỉnh sửa thông tin & châm ngôn"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right: Quick Action Buttons (Facebook Header Style) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 md:pt-0 sm:pb-2">
              <button
                onClick={() => setActiveTab('attendance')}
                className="px-4 py-2.5 rounded-xl theme-btn-primary text-white font-extrabold text-sm shadow-sm hover:brightness-105 flex items-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <CalendarCheck className="w-4 h-4" /> Điểm danh
              </button>

              <button
                onClick={() => setActiveTab('random-picker')}
                className="px-4 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-extrabold text-sm border border-pink-200 flex items-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <Dices className="w-4 h-4" /> Vòng quay gọi tên
              </button>

              <button
                onClick={() => setActiveTab('behavior')}
                className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-sm border border-amber-200 flex items-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Tích sao
              </button>

              <button
                onClick={() => {
                  setEditTitle(teacherTitle);
                  setEditName(teacherName);
                  setEditBio(teacherBio);
                  setIsEditingProfile(true);
                }}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                title="Chỉnh sửa thông tin trang cá nhân"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-pink-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-base">
                <Edit3 className="w-5 h-5" /> Chỉnh sửa hồ sơ Thầy/Cô
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Xưng hô:</label>
                <select
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value as TeacherTitle)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-pink-400 bg-slate-50 text-sm"
                >
                  <option value="Cô giáo">Cô giáo 👩‍🏫</option>
                  <option value="Thầy giáo">Thầy giáo 👨‍🏫</option>
                  <option value="Thầy/Cô">Thầy/Cô 🧑‍🏫</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Họ và tên giáo viên:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Thị Nga..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-pink-400 bg-slate-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Lời nhắn / Châm ngôn giảng dạy:</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Ví dụ: Tận tâm vì học sinh thân yêu • Mỗi ngày đến trường là một ngày vui"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400 bg-slate-50 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl theme-btn-primary text-white font-black text-sm shadow-md cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Students Total */}
        <div 
          onClick={() => setActiveTab('students')}
          className="glass-card p-5 rounded-3xl cursor-pointer group hover:border-pink-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wider">Sĩ số lớp</span>
            <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-800">{students.length}</span>
            <span className="text-sm font-bold text-pink-600">học sinh</span>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-600 flex items-center gap-3">
            <span>👦 Nam: <strong className="text-slate-800">{boysCount}</strong></span>
            <span>👧 Nữ: <strong className="text-slate-800">{girlsCount}</strong></span>
          </div>
        </div>


        {/* Card 2: Today Attendance */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="glass-card p-5 rounded-3xl cursor-pointer group hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wider">Điểm danh hôm nay</span>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600">
              {todayAttendance.length > 0 ? `${presentCount}/${students.length}` : 'Chưa'}
            </span>
            <span className="text-sm font-bold text-slate-500">có mặt</span>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-600 flex items-center gap-2">
            {todayAttendance.length === 0 ? (
              <span className="text-amber-600 font-bold">Chưa điểm danh buổi này ⚠️</span>
            ) : (
              <>
                <span className="text-emerald-700">Đủ: {presentCount}</span>
                <span className="text-amber-700">Muộn: {lateCount}</span>
                <span className="text-rose-700">Phép: {excusedCount}</span>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Fund Balance */}
        <div 
          onClick={() => setActiveTab('fund')}
          className="glass-card p-5 rounded-3xl cursor-pointer group hover:border-purple-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wider">Số dư quỹ lớp</span>
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-700">
              {fundBalance.toLocaleString('vi-VN')}
            </span>
            <span className="text-sm font-bold text-purple-500">đ</span>
          </div>
          <div className="mt-2 text-sm font-bold text-purple-700 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Minh bạch & đầy đủ hóa đơn
          </div>
        </div>

        {/* Card 4: Star Champion */}
        <div 
          onClick={() => setActiveTab('behavior')}
          className="glass-card p-5 rounded-3xl cursor-pointer group hover:border-amber-300 bg-gradient-to-br from-amber-50/50 to-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold text-amber-700 uppercase tracking-wider">Ngôi sao tuần này</span>
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3">
            {topStars[0] ? (
              <div>
                <div className="text-base font-extrabold text-slate-800 truncate">
                  👑 {topStars[0].student.fullName}
                </div>
                <div className="text-sm font-bold text-amber-600 mt-1 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  Đạt {topStars[0].points} điểm tích cực
                </div>
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-500">Chưa có lượt chấm điểm</span>
            )}
          </div>
        </div>

      </div>

      {/* Today's Schedule Banner */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl theme-btn-primary text-white shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2 flex-wrap">
                Lịch học hôm nay

                <span className="text-xs font-extrabold px-3 py-1 rounded-full theme-badge">
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </h3>
              <p className="text-sm text-slate-600 font-semibold">Các tiết học của Lớp {currentClass?.name} trong ngày</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('timetable')}
            className="text-sm font-bold theme-text hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            Xem toàn bộ TKB tuần <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {todayLessons.length === 0 ? (
          <div className="py-7 px-4 text-center text-slate-600 text-sm sm:text-base font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            Hôm nay không có tiết học nào hoặc là ngày nghỉ. 
            <button
              onClick={() => setActiveTab('timetable')}
              className="theme-text font-bold ml-1.5 hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              Xem / Xếp thời khóa biểu tại đây <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
            {todayLessons.map((lesson) => (
              <div
                key={lesson.id}
                style={{
                  backgroundColor: `${lesson.color || 'var(--theme-primary)'}10`,
                  borderColor: `${lesson.color || 'var(--theme-primary)'}30`,
                }}
                className="p-3.5 rounded-2xl border-2 space-y-1.5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                  <span>Tiết {lesson.period} ({lesson.session === 'morning' ? 'Sáng' : 'Chiều'})</span>
                </div>
                <div
                  style={{ color: lesson.color || 'var(--theme-primary)' }}
                  className="font-black text-base truncate"
                >
                  {lesson.subject}
                </div>
                {lesson.teacher && (
                  <div className="text-xs text-slate-700 font-bold truncate">
                    👤 {lesson.teacher}
                  </div>
                )}
                {lesson.room && (
                  <div className="text-xs text-slate-500 font-semibold truncate">
                    📍 {lesson.room}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Two Columns: Left & Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Quick Tasks & Star Ranking */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top 3 Stars Leaderboard */}
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">Bảng vàng thi đua & khen thưởng</h3>
                  <p className="text-sm text-slate-600 font-semibold">Học sinh có nhiều điểm tốt và tiến bộ vượt bậc</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('behavior')}
                className="text-sm font-bold theme-text hover:underline flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {topStars.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-600 text-sm sm:text-base font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có điểm tích lũy tuần này. Hãy bấm vào mục "Nề nếp & thi đua" để cộng sao cho các em!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topStars.map((item, idx) => {
                  const medals = ['🥇 Hạng 1', '🥈 Hạng 2', '🥉 Hạng 3'];
                  const bgColors = ['bg-amber-50 border-amber-200', 'bg-slate-50 border-slate-200', 'bg-orange-50 border-orange-200'];
                  return (
                    <div
                      key={item.student.id}
                      className={`p-4 rounded-2xl border ${bgColors[idx]} text-center relative overflow-hidden`}
                    >
                      <div className="text-sm font-black text-amber-700 mb-1">{medals[idx]}</div>
                      <div className="w-12 h-12 mx-auto rounded-full theme-avatar border-2 border-white shadow-xs flex items-center justify-center font-bold text-base mb-2">
                        {item.student.fullName.slice(-2)}
                      </div>
                      <div className="text-sm sm:text-base font-bold text-slate-800 truncate">{item.student.fullName}</div>
                      <div className="text-xs font-extrabold text-amber-600 mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white shadow-2xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> +{item.points} sao
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Teacher Todo list */}
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl theme-btn-primary text-white">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">Sổ tay công việc</h3>
                  <p className="text-sm text-slate-600 font-semibold">Nhắc nhở công tác chủ nhiệm và kế hoạch tuần</p>
                </div>
              </div>
            </div>

            {/* Input Add Todo */}
            <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="Thêm việc cần làm (Vd: Thu sổ khám sức khỏe, họp chi bộ...)"
                className="flex-1 px-4 py-3 rounded-xl border theme-card-border focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm font-semibold theme-soft-bg"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl theme-btn-primary text-white font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" /> Thêm
              </button>
            </form>

            <div className="space-y-2">
              {todos.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTodo(t)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    t.isDone
                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {t.isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 theme-text shrink-0" />
                    )}
                    <span className="text-sm sm:text-base font-semibold">{t.title}</span>
                  </div>
                  {t.dueDate && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg theme-badge shrink-0">
                      {t.dueDate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): Birthdays & Motivation Card */}
        <div className="space-y-6">
          
          {/* Upcoming Birthdays Card */}
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 rounded-xl theme-soft-bg theme-text">
                <Cake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Sinh nhật sắp tới 🎂</h3>
                <p className="text-sm text-slate-600 font-semibold">Nhắc nhở chúc mừng sinh nhật học sinh</p>
              </div>
            </div>

            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-slate-600 font-semibold text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Không có sinh nhật nào trong 45 ngày tới.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map((b) => (
                  <div
                    key={b.student.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl theme-soft-bg border theme-card-border hover:brightness-95 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full theme-avatar flex items-center justify-center font-bold text-sm">
                        {b.student.fullName.slice(-2)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{b.student.fullName}</div>
                        <div className="text-xs theme-text font-bold">Ngày {b.displayDate}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {b.daysLeft === 0 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-extrabold animate-bounce inline-block">
                          HÔM NAY 🎉
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-slate-700">
                          còn <strong className="theme-text text-sm">{b.daysLeft}</strong> ngày
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher's Motivation Box */}
          <div className="rounded-3xl p-6 theme-quote-box shadow-xs">
            <h4 className="text-sm font-extrabold uppercase tracking-wider mb-2 flex items-center gap-2 opacity-95">
              💡 Lời nhắn yêu thương
            </h4>
            <p className="text-sm sm:text-base font-semibold italic leading-relaxed opacity-95">
              "Mỗi học sinh là một bông hoa với vẻ đẹp và thời điểm nở rộ riêng. Sự dịu dàng và kiên nhẫn của Thầy/Cô chính là ánh nắng ấm áp nhất."
            </p>
            <div className="mt-3 text-right text-xs sm:text-sm font-extrabold theme-quote-author">
              — Sổ Tay Giáo Viên 4.0 🌸
            </div>

          </div>


        </div>

      </div>

    </div>
  );
};


