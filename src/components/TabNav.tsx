import React from 'react';
import {
  LayoutDashboard,
  Users,
  Grid,
  CalendarCheck,
  Award,
  Wallet,
  BookOpen,
  Dices,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ActiveTab } from '../types';

export const TabNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Học sinh', icon: <Users className="w-4 h-4" /> },
    { id: 'seating', label: 'Sơ đồ lớp', icon: <Grid className="w-4 h-4" /> },
    { id: 'attendance', label: 'Điểm danh', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'behavior', label: 'Nề nếp & Thi đua', icon: <Award className="w-4 h-4" />, badge: 'HOT' },
    { id: 'fund', label: 'Thu - Chi Quỹ', icon: <Wallet className="w-4 h-4" /> },
    { id: 'comments', label: 'Nhận xét học sinh', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'random-picker', label: 'Gọi tên ngẫu nhiên', icon: <Dices className="w-4 h-4" /> },
    { id: 'todos', label: 'Việc cần làm', icon: <CheckSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full bg-white/70 backdrop-blur-md border-b border-pink-100 py-2.5 px-4 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md shadow-pink-300/60 scale-[1.02]'
                  : 'bg-white/80 hover:bg-pink-50/80 text-slate-600 hover:text-pink-600 border border-pink-100/80 shadow-2xs'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-300 text-amber-900 leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
