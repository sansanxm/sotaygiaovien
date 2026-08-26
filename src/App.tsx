import React, { useState, useEffect } from 'react';
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
import { Sparkles } from 'lucide-react';


const AppContent: React.FC = () => {
  const { activeTab, theme, isLoading } = useApp();

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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
