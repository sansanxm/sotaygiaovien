import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Crown,
  Zap,
  ShieldCheck,
  ArrowRight,
  X,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

interface AuthAndPlanOnboardingProps {
  onClose?: () => void;
}

export const AuthAndPlanOnboarding: React.FC<AuthAndPlanOnboardingProps> = ({ onClose }) => {

  const {
    signIn,
    signUp,
    setTeacherName,
    setTeacherTitle,
    triggerConfetti,
    syncWithCloud,
    refreshAppData,
    setShowVipModal,
  } = useApp();


  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justAuthenticated, setJustAuthenticated] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedTitle, setSelectedTitle] = useState<'Cô giáo' | 'Thầy giáo'>('Cô giáo');

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { user, error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (
        error.message.toLowerCase().includes('invalid') ||
        error.message.includes('không tồn tại') ||
        error.message.includes('mật khẩu')
      ) {
        setErrorMsg('Email hoặc mật khẩu không chính xác. Nếu chưa có tài khoản, hãy chọn "Đăng Ký Tài Khoản".');
      } else {
        setErrorMsg(error.message);
      }
    } else if (user) {
      triggerConfetti();
      await syncWithCloud('download');
      await refreshAppData();
      setJustAuthenticated(true);
    }
  };

  // 2. Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự để đảm bảo an toàn!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const teacherDisplayName = fullName.trim() || 'Giáo viên';
    const { user, error } = await signUp(email, password, teacherDisplayName);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else if (user) {
      setTeacherName(teacherDisplayName);
      setTeacherTitle(selectedTitle);
      triggerConfetti();
      await syncWithCloud('download');
      await refreshAppData();
      setJustAuthenticated(true);
    }

  };

  // PHASE 2: WELCOME & PLAN SELECTION SCREEN (Shown right after auth)
  if (justAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#FFF5F8] via-[#F8FAFC] to-[#F0F7FF] flex items-center justify-center p-4 overflow-y-auto font-sans">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden my-auto animate-in zoom-in-95 duration-300">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-8 sm:p-10 text-white text-center">
            <div className="absolute top-2 left-6 text-white/15 text-7xl select-none">🌸</div>
            <div className="absolute -bottom-4 right-10 text-white/15 text-8xl select-none">✨</div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider mb-1 border border-white/30">
                <Sparkles className="w-3.5 h-3.5 text-yellow-200" /> Chúc mừng đăng nhập thành công
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Chào mừng {fullName ? `${selectedTitle} ${fullName}` : 'Thầy/Cô'}! 💖
              </h1>
              <p className="text-xs sm:text-base text-white/90 font-medium max-w-xl mx-auto leading-relaxed">
                Hãy lựa chọn gói bắt đầu phù hợp để đồng hành cùng lớp học của bạn:
              </p>
            </div>
          </div>

          {/* 2 Plan Cards */}
          <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* OPTION 1: 30-Day Full Free Trial */}
            <div className="p-6 sm:p-7 rounded-3xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all flex flex-col justify-between space-y-6 relative group shadow-sm hover:shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Trải nghiệm miễn phí
                  </span>
                  <span className="text-xs font-black text-emerald-600">30 ngày đầu</span>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-black text-slate-800">
                    0 đ <span className="text-xs text-slate-400 font-bold">/ 30 ngày</span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Không cần thanh toán ngay • Bắt đầu sử dụng trong 1 giây
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-emerald-200/60 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Trọn vẹn 100% tính năng không giới hạn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Quản lý học sinh, điểm danh, sơ đồ lớp kéo thả</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cắt ảnh khuôn mặt học sinh AI, sổ thu chi quỹ lớp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Đồng bộ và sao lưu dữ liệu đám mây an toàn</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setJustAuthenticated(false);
                  window.location.reload();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-200/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <span>Bắt đầu trải nghiệm 30 ngày 🚀</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* OPTION 2: VIP Royal Lifetime Plan */}
            <div className="p-6 sm:p-7 rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/80 via-yellow-50/40 to-white flex flex-col justify-between space-y-6 relative shadow-lg ring-2 ring-amber-300/40">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                👑 Khuyên dùng - tiết kiệm 70%
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-amber-600 text-amber-600" /> Bản quyền trọn đời
                  </span>
                  <span className="text-xs font-black text-amber-700">Dùng vĩnh viễn</span>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-700">
                    199.000 đ <span className="text-xs text-slate-400 font-bold line-through">650.000 đ</span>
                  </div>
                  <p className="text-xs text-amber-700/80 font-bold mt-1">
                    Thanh toán 1 lần duy nhất • Sử dụng trọn đời ♾️
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-amber-200 text-xs font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                    <span><strong>Mở khóa vĩnh viễn:</strong> Không giới hạn thời gian và số lượng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                    <span><strong>Đồng bộ đám mây đa thiết bị:</strong> Máy tính & điện thoại</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                    <span><strong>Ưu tiên tính năng mới:</strong> Cập nhật AI mới nhất liên tục</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                    <span><strong>Hỗ trợ kỹ thuật ưu tiên 1-1:</strong> Trực tiếp từ đội ngũ phát triển</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setJustAuthenticated(false);
                  setShowVipModal(true);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-105 text-white font-black text-xs shadow-lg shadow-amber-300/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <Crown className="w-4 h-4 fill-white" />
                <span>Nâng cấp VIP ngay (quét VietQR 3s)</span>
              </button>
            </div>

          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400 font-semibold">
            Sổ tay Giáo viên 4.0 • Dành riêng cho Giáo viên Việt Nam © 2026
          </div>

        </div>
      </div>
    );
  }

  // PHASE 1: MANDATORY LOGIN / SIGN UP SCREEN
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-pink-50 via-[#FFF5F8] to-rose-100 flex items-center justify-center p-4 overflow-y-auto font-sans">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-pink-300/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-rose-300/25 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-pink-200/80 overflow-hidden relative z-10 animate-in zoom-in-95 duration-250 my-auto">
        
        {/* Close Button if opened as Modal */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-white/80 hover:bg-pink-100 text-slate-400 hover:text-slate-700 transition-colors z-20 cursor-pointer shadow-2xs"
            title="Đóng cửa sổ (Dùng Offline)"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Branding Header */}
        <div className="p-6 sm:p-7 text-center space-y-2 border-b border-pink-100 bg-gradient-to-b from-pink-50/80 to-transparent relative">

          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center text-3xl shadow-lg shadow-pink-300/50">
            🌸
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Sổ tay Giáo viên 4.0
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Quản lý lớp học thông minh & đồng bộ đa thiết bị
            </p>
          </div>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 m-5 rounded-2xl">
          <button
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Đăng nhập
          </button>

          <button
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'register'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Đăng ký mới
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 pt-0 space-y-4">
          
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3.5">
            
            {/* Register Extra Fields: Full Name & Title */}
            {authMode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Danh xưng & họ tên</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedTitle}
                      onChange={(e) => setSelectedTitle(e.target.value as any)}
                      className="px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    >
                      <option value="Cô giáo">Cô giáo</option>
                      <option value="Thầy giáo">Thầy giáo</option>
                    </select>

                    <div className="relative flex-1">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Nga..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Địa chỉ email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="giaovien@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-md shadow-pink-300/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{authMode === 'login' ? 'Đăng nhập vào ứng dụng' : 'Tạo tài khoản & tiếp tục'}</span>
                </>
              )}
            </button>

            {/* Offline Guest Trial Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-200"
              >
                <span>🚀 Dùng thử Offline (Không cần đăng nhập)</span>
              </button>
            )}
          </form>



          {/* Quick Guarantee */}
          <div className="pt-2 text-center text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Dữ liệu học sinh được mã hóa bảo mật 100%</span>
          </div>

        </div>

      </div>
    </div>
  );
};
