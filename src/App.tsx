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
import { SettingsModal } from './components/SettingsModal';
import { MobileNavigation } from './components/MobileNavigation';
import { TrialExpiredPaywall } from './components/TrialExpiredPaywall';
import { Sparkles, RefreshCw, Crown } from 'lucide-react';

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
  const { activeTab, theme, isLoading, licenseStatus, setShowVipModal } = useApp();

  const [showSettings, setShowSettings] = useState(false);

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

  // 1. If 30-day Free Trial is Expired and User is not VIP -> Lock app with Paywall
  if (licenseStatus.isExpired) {
    return <TrialExpiredPaywall />;
  }

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
        
        {/* Trial Countdown Notice Bar (Top of Content) */}
        {licenseStatus.isTrial && !licenseStatus.isVip && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 px-4 py-1.5 text-xs font-black flex items-center justify-between shadow-xs shrink-0 z-30">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-slate-900 shrink-0" />
              <span className="truncate">
                Bản Dùng Thử Miễn Phí: Còn <strong>{licenseStatus.trialDaysLeft} ngày</strong> trải nghiệm không giới hạn.
              </span>
            </div>
            <button
              onClick={() => setShowVipModal(true)}
              className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-yellow-300 hover:bg-black font-extrabold text-[10px] uppercase tracking-wider shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <Crown className="w-3 h-3 fill-yellow-300" /> Nâng Cấp VIP
            </button>
          </div>
        )}

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
            {activeTab === 'random-picker' && <RandomPicker />}
            {activeTab === 'todos' && <TodosView />}
          </div>
        </main>

        {/* Footer info bar (hidden on mobile to maximize screen area) */}
        <footer className="hidden md:block w-full bg-white/80 backdrop-blur-md border-t border-slate-200/80 py-3 px-6 text-xs text-slate-500 font-extrabold tracking-wider uppercase text-center shrink-0">
          THIẾT KẾ VÀ PHÁT TRIỂN BỞI <strong className="text-slate-800 font-black">XIAO SYSTEM</strong> © 2026
        </footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

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
