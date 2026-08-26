import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { db, exportDatabaseBackup, importDatabaseBackup } from '../db/db';
import { seedInitialDatabase } from '../db/initialData';
import { adminGoogleSync, type TeacherUser as CloudUser, type SyncState } from '../services/adminGoogleScriptSync';
import type { SchoolYear, ClassRoom, ActiveTab, TeacherTitle, AppTheme } from '../types';

export type { AppTheme, SyncState, CloudUser };


export interface ThemeConfig {
  id: AppTheme;
  label: string;
  dot: string;
  badge: string;
  bgGradient: string;
  sidebarActive: string;
  buttonPrimary: string;
  buttonSecondary: string;
  accentText: string;
  accentBg: string;
  cardBorder: string;
  glowShadow: string;
  iconColor: string;
}

export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  pink: {
    id: 'pink',
    label: 'Hồng Dịu Dàng (Cô Giáo)',
    dot: 'bg-pink-400',
    badge: 'bg-pink-100 text-pink-700 border-pink-200',
    bgGradient: 'from-pink-50 via-[#FFF5F8] to-rose-50/60 text-slate-800',
    sidebarActive: 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-pink-300/60',
    buttonPrimary: 'bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white shadow-pink-300/50',
    buttonSecondary: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200',
    accentText: 'text-pink-600',
    accentBg: 'bg-pink-50',
    cardBorder: 'border-pink-200/80',
    glowShadow: 'shadow-pink-200/50',
    iconColor: 'text-pink-500',
  },
  ocean: {
    id: 'ocean',
    label: 'Xanh Biển Lịch Lãm (Thầy Giáo)',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    bgGradient: 'from-sky-50 via-[#F0F7FF] to-blue-50/70 text-slate-800',
    sidebarActive: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-blue-300/60',
    buttonPrimary: 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white shadow-blue-300/50',
    buttonSecondary: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    accentText: 'text-blue-600',
    accentBg: 'bg-blue-50',
    cardBorder: 'border-blue-200/80',
    glowShadow: 'shadow-blue-200/50',
    iconColor: 'text-blue-500',
  },
  mint: {
    id: 'mint',
    label: 'Xanh Bạc Hà Tươi Mát (Dịu Mắt)',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bgGradient: 'from-emerald-50 via-[#F2FCF8] to-teal-50/70 text-slate-800',
    sidebarActive: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-300/60',
    buttonPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-emerald-300/50',
    buttonSecondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
    accentText: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    cardBorder: 'border-emerald-200/80',
    glowShadow: 'shadow-emerald-200/50',
    iconColor: 'text-emerald-500',
  },
  lavender: {
    id: 'lavender',
    label: 'Tím Mộng Mơ (Trang Nhã)',
    dot: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    bgGradient: 'from-purple-50 via-[#FAF5FF] to-indigo-50/70 text-slate-800',
    sidebarActive: 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-purple-300/60',
    buttonPrimary: 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white shadow-purple-300/50',
    buttonSecondary: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    accentText: 'text-purple-600',
    accentBg: 'bg-purple-50',
    cardBorder: 'border-purple-200/80',
    glowShadow: 'shadow-purple-200/50',
    iconColor: 'text-purple-500',
  },
  peach: {
    id: 'peach',
    label: 'Cam Đào Ấm Áp (Năng Động)',
    dot: 'bg-orange-400',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    bgGradient: 'from-amber-50 via-[#FFF9F2] to-orange-50/70 text-slate-800',
    sidebarActive: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-300/60',
    buttonPrimary: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-300/50',
    buttonSecondary: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
    accentText: 'text-orange-600',
    accentBg: 'bg-orange-50',
    cardBorder: 'border-orange-200/80',
    glowShadow: 'shadow-orange-200/50',
    iconColor: 'text-orange-500',
  },
  slate: {
    id: 'slate',
    label: 'Xám Khói Hiện Đại (Tối Giản)',
    dot: 'bg-slate-700',
    badge: 'bg-slate-200 text-slate-800 border-slate-300',
    bgGradient: 'from-slate-100 via-[#F8FAFC] to-slate-200/70 text-slate-800',
    sidebarActive: 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-slate-400/60',
    buttonPrimary: 'bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white shadow-slate-400/50',
    buttonSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300',
    accentText: 'text-slate-700',
    accentBg: 'bg-slate-100',
    cardBorder: 'border-slate-300/80',
    glowShadow: 'shadow-slate-300/50',
    iconColor: 'text-slate-700',
  },
};

export interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  currentThemeConfig: ThemeConfig;
  teacherTitle: TeacherTitle;
  setTeacherTitle: (title: TeacherTitle) => void;
  teacherName: string;
  setTeacherName: (name: string) => void;
  years: SchoolYear[];
  currentYear: SchoolYear | null;
  setCurrentYearId: (id: string) => void;
  classes: ClassRoom[];
  currentClass: ClassRoom | null;
  setCurrentClassId: (id: string) => void;
  refreshAppData: () => Promise<void>;
  triggerConfetti: () => void;
  isLoading: boolean;

  // Teacher Account & Cloud Sync
  user: CloudUser | null;
  syncState: SyncState;
  lastSyncedAt: Date | null;
  signIn: (email: string, password: string) => Promise<{ user: CloudUser | null; error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ user: CloudUser | null; error: Error | null }>;
  signOut: () => Promise<void>;
  syncWithCloud: (direction?: 'upload' | 'download' | 'both') => Promise<boolean>;
  clearAllData: () => Promise<void>;
}


const AppContext = createContext<AppContextType | undefined>(undefined);




export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  const [theme, setThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem('gvcn_theme') as AppTheme) || 'pink';
  });

  const [teacherTitle, setTeacherTitleState] = useState<TeacherTitle>(() => {
    return (localStorage.getItem('gvcn_teacher_title') as TeacherTitle) || 'Cô giáo';
  });

  const [teacherName, setTeacherNameState] = useState<string>(() => {
    return localStorage.getItem('gvcn_teacher_name') || 'Nguyễn Nga';
  });

  const [years, setYears] = useState<SchoolYear[]>([]);
  const [currentYear, setCurrentYear] = useState<SchoolYear | null>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cloud Sync & Auth States
  const [user, setUser] = useState<CloudUser | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('local-only');

  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const syncingRef = useRef(false);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('gvcn_theme', newTheme);
  };

  const setTeacherTitle = (newTitle: TeacherTitle) => {
    setTeacherTitleState(newTitle);
    localStorage.setItem('gvcn_teacher_title', newTitle);
  };

  const setTeacherName = (newName: string) => {
    setTeacherNameState(newName);
    localStorage.setItem('gvcn_teacher_name', newName);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#38bdf8', '#34d399', '#c084fc', '#facc15', '#fb923c'],
    });
  };

  const refreshAppData = async () => {
    try {
      await seedInitialDatabase();
      const allYears = await db.years.toArray();
      setYears(allYears);

      let activeY = allYears.find((y) => y.isCurrent) || allYears[0] || null;
      if (currentYear) {
        const found = allYears.find((y) => y.id === currentYear.id);
        if (found) activeY = found;
      }
      setCurrentYear(activeY);

      if (activeY) {
        const classList = await db.classes.where('yearId').equals(activeY.id).toArray();
        setClasses(classList);

        let activeC = classList[0] || null;
        if (currentClass) {
          const foundC = classList.find((c) => c.id === currentClass.id);
          if (foundC) activeC = foundC;
        }
        setCurrentClass(activeC);
      } else {
        setClasses([]);
        setCurrentClass(null);
      }
    } catch (err) {
      console.error('Error loading app data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Email & Password Sign In
  const signIn = async (email: string, password: string) => {
    const res = await adminGoogleSync.signIn(email, password);
    if (res.user) {
      setUser(res.user);
      setSyncState('synced');
    }
    return res;
  };

  // Email & Password Sign Up
  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await adminGoogleSync.signUp(email, password, fullName);
    if (res.user) {
      setUser(res.user);
      setSyncState('synced');
    }
    return res;
  };

  // Sign Out
  const signOut = async () => {
    await adminGoogleSync.signOut();
    setUser(null);
    setSyncState('local-only');
  };


  // Bidirectional Cloud Sync
  // Cloud Sync: Default to 'upload' (Overwrite Cloud with newest local changes)
  const syncWithCloud = useCallback(
    async (direction: 'upload' | 'download' | 'both' = 'upload'): Promise<boolean> => {
      if (!user) {

        setSyncState('local-only');
        return false;
      }

      if (!navigator.onLine) {
        setSyncState('offline');
        return false;
      }

      if (syncingRef.current) return false;
      syncingRef.current = true;
      setSyncState('syncing');

      try {
        if (direction === 'download') {
          const res = await adminGoogleSync.downloadBackupFromCloud(user);
          if (res.success && res.dataJson && !res.empty) {
            await importDatabaseBackup(res.dataJson);
            await refreshAppData();
          }
        } else {
          // 'upload' - Always export current local data and overwrite Cloud
          const backupJson = await exportDatabaseBackup();
          const uploadRes = await adminGoogleSync.uploadBackupToCloud(user, backupJson);
          if (!uploadRes.success) {
            console.warn('Sync upload warning:', uploadRes.error);
          }
        }

        setSyncState('synced');
        setLastSyncedAt(new Date());
        return true;
      } catch (err) {
        console.error('Sync failed:', err);
        setSyncState('error');
        return false;
      } finally {
        syncingRef.current = false;
      }
    },
    [user]
  );

  // Initialize Admin Google Auth state on mount (runs once)
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await adminGoogleSync.getCurrentUser();
        if (currentUser && isMounted) {
          setUser(currentUser);
          setSyncState('synced');
          // If local database is completely empty on new device, download cloud data
          const localYearsCount = await db.years.count();
          const localClassesCount = await db.classes.count();
          if (localYearsCount === 0 && localClassesCount === 0 && navigator.onLine) {
            await syncWithCloud('download');
          }
        }
      } catch (err) {
        console.error('Init auth error:', err);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        syncWithCloud('upload');
      }
    };
    const handleOffline = () => {
      setSyncState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, syncWithCloud]);



  useEffect(() => {
    refreshAppData();
  }, []);

  const setCurrentYearId = async (id: string) => {
    const found = years.find((y) => y.id === id);
    if (found) {
      setCurrentYear(found);
      const classList = await db.classes.where('yearId').equals(found.id).toArray();
      setClasses(classList);
      setCurrentClass(classList[0] || null);
    }
  };

  const setCurrentClassId = (id: string) => {
    const found = classes.find((c) => c.id === id);
    if (found) {
      setCurrentClass(found);
    }
  };

  // Clear all data permanently and wipe cloud storage
  const clearAllData = async () => {
    localStorage.setItem('gvcn_has_seeded', 'true');
    await Promise.all([
      db.years.clear(),
      db.classes.clear(),
      db.students.clear(),
      db.attendance.clear(),
      db.behaviorLogs.clear(),
      db.fundTransactions.clear(),
      db.todos.clear(),
      db.timetable.clear(),
      db.seats.clear(),
    ]);

    // Create a clean school year
    const cleanYear = {
      id: `year-${Date.now()}`,
      name: 'Năm học 2025 - 2026',
      isCurrent: true,
      startDate: '2025-09-05',
      endDate: '2026-05-31',
    };
    await db.years.add(cleanYear);

    // Overwrite Cloud with clean database
    if (user) {
      const cleanBackupJson = await exportDatabaseBackup();
      await adminGoogleSync.uploadBackupToCloud(user, cleanBackupJson);
      setLastSyncedAt(new Date());
    }

    await refreshAppData();
  };

  const currentThemeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.pink;

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        setTheme,
        currentThemeConfig,
        teacherTitle,
        setTeacherTitle,
        teacherName,
        setTeacherName,
        years,
        currentYear,
        setCurrentYearId,
        classes,
        currentClass,
        setCurrentClassId,
        refreshAppData,
        triggerConfetti,
        isLoading,
        user,
        syncState,
        lastSyncedAt,
        signIn,
        signUp,
        signOut,
        syncWithCloud,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};


export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
