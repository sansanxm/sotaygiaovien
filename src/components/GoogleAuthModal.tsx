import React, { useState } from 'react';
import {
  Cloud,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';



interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GoogleAuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { triggerConfetti, refreshAppData, syncWithCloud, teacherName, signIn, signUp } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(teacherName || '');

  if (!isOpen) return null;

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { user, error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('invalid') || error.message.includes('không tồn tại')) {
        setErrorMsg('Sai email hoặc mật khẩu! Nếu chưa có tài khoản, vui lòng chọn tab "Tạo Tài Khoản".');
      } else {
        setErrorMsg(error.message);
      }
    } else if (user) {
      triggerConfetti();
      setSuccessMsg('Đăng nhập thành công! Đang tự động nạp dữ liệu từ Cloud...');
      await syncWithCloud('download');
      await refreshAppData();
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 800);
    }
  };

  // 2. Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự để bảo mật!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { user, error } = await signUp(
      email,
      password,
      fullName || 'Giáo viên'
    );
    setLoading(false);




    if (error) {
      setErrorMsg(error.message);
    } else if (user) {
      triggerConfetti();
      setSuccessMsg('Tạo tài khoản thành công! Đang kích hoạt đồng bộ đám mây...');
      await syncWithCloud('upload');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full border border-pink-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 theme-banner text-white relative text-center shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg mb-2">
            <Cloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-black tracking-tight">
            Tài Khoản & Đồng Bộ Đám Mây
          </h3>
          <p className="text-xs text-white/90 font-medium mt-1">
            Tự động lưu trữ trên Cloud • Sang máy mới đăng nhập là có đủ dữ liệu
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-pink-100 bg-pink-50/40 p-1.5 gap-1 shrink-0 text-xs font-bold">
          <button
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>

          <button
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tạo Tài Khoản Mới</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 text-xs sm:text-sm">
          
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* =========================================================
              TAB 1: ĐĂNG NHẬP
              ========================================================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email giáo viên:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: nguyenga@gmail.com..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Mật khẩu:
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl theme-btn-primary text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>{loading ? 'Đang đăng nhập...' : 'Đăng Nhập & Đồng Bộ Ngay'}</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
                  className="text-xs font-bold text-pink-600 hover:underline cursor-pointer"
                >
                  Chưa có tài khoản? Bấm vào đây để tạo tài khoản mới
                </button>
              </div>
            </form>
          )}

          {/* =========================================================
              TAB 2: TẠO TÀI KHOẢN MỚI
              ========================================================= */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Họ và tên giáo viên:
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Cô Nguyễn Nga..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: cogaohai@gmail.com..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Mật khẩu (tối thiểu 6 ký tự):
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Đặt mật khẩu..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>{loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản & Bật Đồng Bộ'}</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Đã có tài khoản? <span className="text-pink-600 font-bold hover:underline">Đăng nhập tại đây</span>
                </button>
              </div>
            </form>
          )}

          {/* Benefits Feature Cards */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-slate-600">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>An toàn & Bảo mật 100% dữ liệu lớp học</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Smartphone className="w-4 h-4 text-pink-500 shrink-0" />
              <span>Dùng mượt mà khi mất mạng (Offline-First)</span>
            </div>
          </div>

          {/* Offline Option */}
          <div className="text-center pt-1">
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Tiếp tục sử dụng Ngoại Tuyến (Offline)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
