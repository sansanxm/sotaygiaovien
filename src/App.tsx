import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TimetableManager } from './components/TimetableManager';
import { Dashboard } from './components/Dashboard';

import { StudentList } from './components/StudentList';
import { SeatingChart } from './components/SeatingChart';
import { AttendanceView } from './components/AttendanceView';
import { BehaviorTracker } from './components/BehaviorTracker';
import { FundManager } from './components/FundManager';
import { CommentBank } from './components/CommentBank';
import { RandomPicker } from './components/RandomPicker';
import { TodosView } from './components/TodosView';
import { TeacherNotebook } from './components/TeacherNotebook';
import { SettingsModal } from './components/SettingsModal';
import { MobileNavigation } from './components/MobileNavigation';

import { TrialExpiredPaywall } from './components/TrialExpiredPaywall';
import { AuthAndPlanOnboarding } from './components/AuthAndPlanOnboarding';
import { AiAssistantModal } from './components/AiAssistantModal';
import { Sparkles, RefreshCw, Crown, Bot } from 'lucide-react';



interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center p-6 bg-[#FFF5F7] text-slate-800 text-center font-sans">
          <div className="w-16 h-16 rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center text-3xl mb-4 shadow-lg">
            🌸
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Sổ Tay Giáo Viên 4.0</h2>
          <p className="text-xs text-slate-500 max-w-md mb-6 font-semibold leading-relaxed">
            Ứng dụng đã sẵn sàng. Bấm nút bên dưới để tải lại dữ liệu an toàn ngay lập tức.
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-xs shadow-md shadow-pink-300/50 flex items-center gap-2 cursor-pointer active:scale-98 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Tải Lại Trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const {

    activeTab,
    theme,
    isLoading,
    user,
    licenseStatus,

    isVip,
    setShowVipModal,
    syncState,
    syncWithCloud,
    triggerConfetti,
    currentClass,
    currentYear,
    refreshAppData,
  } = useApp();





  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isSyncingUpload, setIsSyncingUpload] = useState(false);

  const [isSyncingDownload, setIsSyncingDownload] = useState(false);
  const [hasChosenOffline, setHasChosenOffline] = useState<boolean>(() => {
    return localStorage.getItem('gvcn_offline_mode_selected') === 'true';
  });

  const handleSelectOffline = () => {
    localStorage.setItem('gvcn_offline_mode_selected', 'true');
    setHasChosenOffline(true);
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return { label: 'Tổng quan lớp học', icon: '📊' };
      case 'timetable': return { label: 'Thời khóa biểu', icon: '📅' };
      case 'students': return { label: 'Danh sách học sinh', icon: '👥' };
      case 'seating': return { label: 'Sơ đồ chỗ ngồi', icon: '🪑' };
      case 'attendance': return { label: 'Sổ điểm danh', icon: '📋' };
      case 'behavior': return { label: 'Nề nếp & thi đua', icon: '⭐' };
      case 'fund': return { label: 'Thu - chi quỹ lớp', icon: '💰' };
      case 'comments': return { label: 'Ngân hàng nhận xét', icon: '💬' };
      case 'notebook': return { label: 'Sổ ghi chép', icon: '📖' };
      case 'random-picker': return { label: 'Vòng quay may mắn', icon: '🎲' };
      case 'todos': return { label: 'Sổ tay công việc', icon: '📝' };
      default: return { label: 'Sổ tay Giáo viên 4.0', icon: '🌸' };
    }
  };


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <Sparkles className="w-10 h-10 animate-spin theme-text mb-3" />
        <h2 className="text-lg font-black tracking-tight">Đang khởi tạo Sổ Tay Giáo Viên...</h2>
        <p className="text-xs font-semibold text-slate-400 mt-1">Ứng dụng quản lý lớp học dành cho mọi Giáo viên</p>
      </div>
    );
  }

  // 1. Show Login / Registration Screen on initial launch if not logged in and not offline
  if (!user && !hasChosenOffline) {
    return <AuthAndPlanOnboarding onSelectOffline={handleSelectOffline} />;
  }

  // 2. If 30-day Free Trial is Expired and User is not VIP -> Lock app with Paywall
  if (!isVip && !licenseStatus.isVip && licenseStatus.isExpired) {
    return <TrialExpiredPaywall />;
  }



  const tabInfo = getTabLabel();

  return (
    <div
      data-theme={theme}
      style={{ background: 'var(--theme-bg-gradient)' }}
      className="h-screen w-screen overflow-hidden flex flex-col md:flex-row font-sans transition-colors duration-300"
    >
      
      {/* 1. Mobile Top & Bottom Navigation (Visible only on mobile < 768px) */}
      <MobileNavigation onOpenSettings={() => setShowSettings(true)} />

      {/* 2. Left Vertical Sidebar (Visible on desktop >= 768px) */}
      <Sidebar onOpenSettings={() => setShowSettings(true)} />

      {/* 3. Main Content Canvas with Full 2-Way Scrolling (Scroll X & Y) */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        
        {/* Trial Countdown Notice Bar (Top of Content) - ONLY shown when user is NOT VIP */}
        {/* Trial Countdown Notice Bar (Top of Content) - ONLY shown when user is NOT VIP */}
        {!isVip && !licenseStatus.isVip && licenseStatus.isTrial && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 px-4 py-1.5 text-xs font-black flex items-center justify-between shadow-xs shrink-0 z-30">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-slate-900 shrink-0" />
              <span className="truncate">
                Bản Dùng Thử Offline Miễn Phí: Còn <strong>{licenseStatus.trialDaysLeft} ngày</strong> trải nghiệm. {user ? `(Tài khoản: ${user.email})` : '(Không cần đăng nhập)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-2.5 py-0.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-extrabold text-[10px] uppercase tracking-wider shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  🔑 Đăng nhập / Đăng ký
                </button>
              )}
              <button
                onClick={() => setShowVipModal(true)}
                className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-yellow-300 hover:bg-black font-extrabold text-[10px] uppercase tracking-wider shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <Crown className="w-3 h-3 fill-yellow-300" /> Nâng Cấp VIP
              </button>
            </div>
          </div>
        )}

        {/* Desktop Top Header Bar (Houses User Account & Cloud Sync Controls) */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md border-b theme-card-border shrink-0 z-20 shadow-2xs">
          {/* Left: Page Title Breadcrumb */}
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{tabInfo.icon}</span>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">
                {tabInfo.label}
              </h2>
              <span className="text-xs text-slate-500 font-bold">
                {currentClass ? `Lớp ${currentClass.name} • ${currentYear?.name || ''}` : 'Sổ tay Giáo viên 4.0'}
              </span>
            </div>
          </div>

          {/* Right: Cloud Sync Pill & User Account Card */}
          <div className="flex items-center gap-2">
            {/* Cloud Sync & Backup Actions */}
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border theme-card-border">
              {/* Sync Status Badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                <span
                  className={`w-2 h-2 rounded-full ${
                    syncState === 'synced'
                      ? 'bg-emerald-500'
                      : syncState === 'syncing'
                      ? 'bg-amber-500 animate-spin'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="hidden lg:inline">
                  {syncState === 'synced'
                    ? 'Đã đồng bộ Cloud'
                    : syncState === 'syncing'
                    ? 'Đang đồng bộ...'
                    : 'Cục bộ (Offline)'}
                </span>
              </div>

              {/* Sao lưu Button */}
              <button
                disabled={isSyncingUpload || isSyncingDownload}
                onClick={async () => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  setIsSyncingUpload(true);
                  const ok = await syncWithCloud('upload');
                  setIsSyncingUpload(false);
                  if (ok) {
                    triggerConfetti();
                    alert('✅ Đã sao lưu dữ liệu lên Cloud thành công!');
                  } else {
                    alert('❌ Không thể sao lưu. Vui lòng kiểm tra kết nối mạng.');
                  }
                }}
                className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200 flex items-center gap-0.5 cursor-pointer transition-all shadow-2xs active:scale-95"
                title="Sao lưu dữ liệu từ máy này lên Cloud"
              >
                <span>{isSyncingUpload ? 'Đang lưu...' : '⬆️ Sao lưu'}</span>
              </button>

              {/* Khôi phục Button */}
              <button
                disabled={isSyncingUpload || isSyncingDownload}
                onClick={async () => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  if (window.confirm('Khôi phục toàn bộ dữ liệu từ Cloud về máy tính này?')) {
                    setIsSyncingDownload(true);
                    const ok = await syncWithCloud('download');
                    setIsSyncingDownload(false);
                    if (ok) {
                      await refreshAppData();
                      triggerConfetti();
                      alert('✅ Đã khôi phục toàn bộ Năm học, Lớp học và Gói VIP từ Cloud thành công!');
                    } else {
                      alert('❌ Không thể khôi phục. Vui lòng kiểm tra kết nối mạng.');
                    }
                  }
                }}
                className="px-2 py-1 rounded-lg bg-white hover:bg-sky-50 text-sky-700 font-extrabold text-[10px] border border-sky-200 flex items-center gap-0.5 cursor-pointer transition-all shadow-2xs active:scale-95"
                title="Khôi phục dữ liệu từ Cloud về máy"
              >
                <span>{isSyncingDownload ? 'Đang tải...' : '⬇️ Khôi phục'}</span>
              </button>
            </div>


            {/* User Account Chip or Login Button */}
            {user ? (
              <div
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white border theme-card-border hover:border-pink-300 shadow-2xs cursor-pointer transition-all hover:scale-102"
                title="Bấm để mở Cài đặt & Quản lý tài khoản"
              >
                <div className="w-6 h-6 rounded-full theme-avatar flex items-center justify-center font-bold text-xs shrink-0">
                  {(user.user_metadata?.full_name || user.email || 'GV').slice(0, 1).toUpperCase()}
                </div>

                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-800">
                      {user.user_metadata?.full_name || 'Giáo viên'}
                    </span>
                    {isVip ? (
                      <span className="text-[9px] font-black px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> VIP
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                        Dùng thử
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">
                    {user.email}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-2.5 py-1 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-extrabold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <span>🔑 Đăng Nhập</span>
              </button>
            )}

            {/* AI Assistant Button */}
            <button
              onClick={() => setShowAiModal(true)}
              className="px-2.5 py-1 rounded-xl theme-btn-primary text-white font-extrabold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95 animate-pulse hover:animate-none"
              title="Mở Trợ lý Sư phạm AI Gemini Flash"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trợ lý AI ✨</span>
            </button>

            {/* Refresh App Button */}
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border theme-card-border shadow-2xs transition-colors cursor-pointer"
              title="Làm mới / Tải lại ứng dụng"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>


        {/* Main Scrollable Viewport with Mobile Top/Bottom Safe Area Insets */}
        <main className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-6 lg:p-8 pt-16 pb-24 md:pt-6 md:pb-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto min-w-[300px] pb-12">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'timetable' && <TimetableManager />}
            {activeTab === 'students' && <StudentList />}
            {activeTab === 'seating' && <SeatingChart />}
            {activeTab === 'attendance' && <AttendanceView />}
            {activeTab === 'behavior' && <BehaviorTracker />}
            {activeTab === 'fund' && <FundManager />}
            {activeTab === 'comments' && <CommentBank />}
            {activeTab === 'notebook' && <TeacherNotebook />}
            {activeTab === 'random-picker' && <RandomPicker />}
            {activeTab === 'todos' && <TodosView />}

          </div>
        </main>

        {/* Footer info bar (hidden on mobile to maximize screen area) */}
        <footer className="hidden md:block w-full bg-white/90 backdrop-blur-md border-t border-slate-200/80 py-1.5 px-6 text-[10px] text-slate-500 font-semibold tracking-wider uppercase text-center shrink-0">
          <span>THIẾT KẾ VÀ PHÁT TRIỂN BỞI <strong className="text-slate-700 font-black">XIAO SYSTEM</strong> © 2026</span>
          <span className="mx-2 text-slate-300">•</span>
          <span className="theme-text font-black">HỖ TRỢ 24/7: 0971986343</span>
        </footer>




      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Auth & Login Modal */}
      {showAuthModal && <AuthAndPlanOnboarding onClose={() => setShowAuthModal(false)} />}

      {/* Universal AI Assistant Modal */}
      <AiAssistantModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />




    </div>
  );
};


export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
