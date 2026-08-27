import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { db, exportDatabaseBackup, importDatabaseBackup, getUserScopedKey } from '../db/db';

import { seedInitialDatabase } from '../db/initialData';
import { adminGoogleSync, type TeacherUser as CloudUser, type SyncState, type LicenseStatus } from '../services/adminGoogleScriptSync';
import type { SchoolYear, ClassRoom, ActiveTab, TeacherTitle, AppTheme } from '../types';
import { VipUpgradeModal } from '../components/VipUpgradeModal';

export type { AppTheme, SyncState, CloudUser, LicenseStatus };




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
  teacherAvatar: string | null;
  setTeacherAvatar: (avatar: string | null) => void;
  teacherCover: string | null;
  setTeacherCover: (cover: string | null) => void;
  teacherBio: string;
  setTeacherBio: (bio: string) => void;
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
  isVip: boolean;
  vipExpiresAt: string | null;
  licenseStatus: LicenseStatus;
  showVipModal: boolean;
  setShowVipModal: (show: boolean) => void;
  activateVip: (expiresAt?: string) => void;
  signIn: (email: string, password: string) => Promise<{ user: CloudUser | null; error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ user: CloudUser | null; error: Error | null }>;
  signOut: () => Promise<void>;
  syncWithCloud: (direction?: 'upload' | 'download' | 'both') => Promise<boolean>;
  clearAllData: () => Promise<void>;
}


const AppContext = createContext<AppContextType | undefined>(undefined);




export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Cloud Sync & Auth States
  const [user, setUser] = useState<CloudUser | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('local-only');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const currentEmail = user?.email || localStorage.getItem('gvcn_active_user_email') || null;

  const [theme, setThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem(getUserScopedKey('theme', currentEmail)) as AppTheme) || 'pink';
  });

  const [teacherTitle, setTeacherTitleState] = useState<TeacherTitle>(() => {
    return (localStorage.getItem(getUserScopedKey('teacher_title', currentEmail)) as TeacherTitle) || 'Thầy/Cô';
  });

  const [teacherName, setTeacherNameState] = useState<string>(() => {
    return localStorage.getItem(getUserScopedKey('teacher_name', currentEmail)) || '';
  });

  const [teacherAvatar, setTeacherAvatarState] = useState<string | null>(() => {
    return localStorage.getItem(getUserScopedKey('teacher_avatar', currentEmail)) || null;
  });

  const [teacherCover, setTeacherCoverState] = useState<string | null>(() => {
    return localStorage.getItem(getUserScopedKey('teacher_cover', currentEmail)) || null;
  });

  const [teacherBio, setTeacherBioState] = useState<string>(() => {
    return localStorage.getItem(getUserScopedKey('teacher_bio', currentEmail)) || 'Tận tâm vì học sinh thân yêu • Mỗi ngày đến trường là một ngày vui';
  });

  const [years, setYears] = useState<SchoolYear[]>([]);
  const [currentYear, setCurrentYear] = useState<SchoolYear | null>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // VIP & 30-Day Trial License State
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>(() => adminGoogleSync.getLicenseStatus(currentEmail || undefined));

  const [isVip, setIsVip] = useState<boolean>(() => licenseStatus.isVip);
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(() => licenseStatus.vipExpiresAt);
  const [showVipModal, setShowVipModal] = useState(false);

  const activateVip = (expiresAt: string = 'lifetime') => {
    const targetEmail = user?.email || currentEmail || 'local_user';
    setIsVip(true);
    setVipExpiresAt(expiresAt);
    adminGoogleSync.setLocalVip(targetEmail, expiresAt);
    setLicenseStatus(adminGoogleSync.getLicenseStatus(targetEmail));
    if (user && navigator.onLine) {
      setTimeout(() => syncWithCloud('upload'), 300);
    }
  };




  const syncingRef = useRef(false);


  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(getUserScopedKey('theme', user?.email), newTheme);
    if (user && navigator.onLine) {
      setTimeout(() => syncWithCloud('upload'), 500);
    }
  };

  const setTeacherTitle = (newTitle: TeacherTitle) => {
    setTeacherTitleState(newTitle);
    localStorage.setItem(getUserScopedKey('teacher_title', user?.email), newTitle);
    if (user && navigator.onLine) {
      setTimeout(() => syncWithCloud('upload'), 500);
    }
  };

  const setTeacherName = (newName: string) => {
    setTeacherNameState(newName);
    localStorage.setItem(getUserScopedKey('teacher_name', user?.email), newName);
    if (user && navigator.onLine) {
      setTimeout(() => syncWithCloud('upload'), 500);
    }
  };

  const setTeacherAvatar = (newAvatar: string | null) => {
    setTeacherAvatarState(newAvatar);
    const key = getUserScopedKey('teacher_avatar', user?.email);
    if (newAvatar) {
      localStorage.setItem(key, newAvatar);
    } else {
      localStorage.removeItem(key);
    }
    if (user && navigator.onLine) {
      setTimeout(() => syncWithCloud('upload'), 500);
    }
  };

  const setTeacherCover = (newCover: string | null) => {
    setTeacherCoverState(newCover);
    const key = getUserScopedKey('teacher_cover', user?.email);
    if (newCover) {
      localStorage.setItem(key, newCover);
    } else {
      localStorage.removeItem(key);
    }
    if (user && navigator.onLine) {
      setTimeout(() => syncWithCloud('upload'), 500);
    }
  };

  const setTeacherBio = (newBio: string) => {
    setTeacherBioState(newBio);
    localStorage.setItem(getUserScopedKey('teacher_bio', user?.email), newBio);
    if (user && navigator.onLine) {
      setTimeout(() => syncWithCloud('upload'), 500);
    }
  };

  const triggerConfetti = () => {

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#38bdf8', '#34d399', '#c084fc', '#facc15', '#fb923c'],
    });
  };

  const refreshAppData = async (emailOverride?: string) => {
    try {
      const activeEmail = emailOverride || user?.email || localStorage.getItem('gvcn_active_user_email') || null;
      await seedInitialDatabase();

      // Refresh Local Settings & Profile States specifically for active user
      setTeacherTitleState((localStorage.getItem(getUserScopedKey('teacher_title', activeEmail)) as TeacherTitle) || 'Thầy/Cô');
      setTeacherNameState(localStorage.getItem(getUserScopedKey('teacher_name', activeEmail)) || '');
      setTeacherAvatarState(localStorage.getItem(getUserScopedKey('teacher_avatar', activeEmail)) || null);
      setTeacherCoverState(localStorage.getItem(getUserScopedKey('teacher_cover', activeEmail)) || null);
      setTeacherBioState(localStorage.getItem(getUserScopedKey('teacher_bio', activeEmail)) || 'Tận tâm vì học sinh thân yêu • Mỗi ngày đến trường là một ngày vui');
      setThemeState((localStorage.getItem(getUserScopedKey('theme', activeEmail)) as AppTheme) || 'pink');

      const lic = adminGoogleSync.getLicenseStatus(activeEmail || undefined);
      setLicenseStatus(lic);
      setIsVip(lic.isVip);
      setVipExpiresAt(lic.vipExpiresAt);

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

  // Helper to clear local in-memory database tables
  const wipeLocalTables = async () => {
    await Promise.all([
      db.years.clear(),
      db.classes.clear(),
      db.students.clear(),
      db.attendance.clear(),
      db.behaviorLogs.clear(),
      db.fundTransactions.clear(),
      db.seats.clear(),
      db.commentTemplates.clear(),
      db.evaluations.clear(),
      db.todos.clear(),
      db.timetable.clear(),
    ]);
  };

  // Email & Password Sign In
  const signIn = async (email: string, password: string) => {
    const res = await adminGoogleSync.signIn(email, password);
    if (res.user) {
      // 1. Wipe previous local data completely
      await wipeLocalTables();
      
      // 2. Set new active session
      localStorage.setItem('gvcn_active_user_email', res.user.email);
      setUser(res.user);
      setSyncState('synced');
      
      // 3. Check VIP
      const liveVip = await adminGoogleSync.checkVipStatusLive(res.user);
      if (liveVip.isVip) {
        activateVip(liveVip.vipExpiresAt || 'lifetime');
      }

      // 4. Download this user's data from Cloud
      await syncWithCloud('download');
      await refreshAppData(res.user.email);
    }
    return res;
  };

  // Email & Password Sign Up (Creates a completely clean, isolated new account)
  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await adminGoogleSync.signUp(email, password, fullName);
    if (res.user) {
      // 1. Wipe previous local data completely
      await wipeLocalTables();

      // 2. Set new active session
      localStorage.setItem('gvcn_active_user_email', res.user.email);
      setUser(res.user);
      setSyncState('synced');

      // 3. Reset profile state specifically for this new user
      setTeacherName(fullName.trim() || 'Giáo viên');
      setTeacherAvatar(null);
      setTeacherCover(null);

      // 4. Initialize fresh template database
      await seedInitialDatabase();
      await refreshAppData(res.user.email);

      // 5. Upload the initial clean state to Cloud for this new account
      await syncWithCloud('upload');
    }
    return res;
  };

  // Sign Out (Completely wipes active memory to ensure total account isolation)
  const signOut = async () => {
    await adminGoogleSync.signOut();
    localStorage.removeItem('gvcn_active_user_email');
    setUser(null);
    setSyncState('local-only');
    
    // Wipe local database tables to prevent account data leakage
    await wipeLocalTables();

    setTeacherTitleState('Thầy/Cô');
    setTeacherNameState('');
    setTeacherAvatarState(null);
    setTeacherCoverState(null);
    setTeacherBioState('Tận tâm vì học sinh thân yêu • Mỗi ngày đến trường là một ngày vui');
    setThemeState('pink');
    setIsVip(false);
    setVipExpiresAt(null);
    setYears([]);
    setClasses([]);
    setCurrentYear(null);
    setCurrentClass(null);
  };



  // Bidirectional Cloud Sync
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
            await importDatabaseBackup(res.dataJson, user.email);
            await refreshAppData(user.email);
          }
        } else {
          // 'upload' - Always export current user's local data and overwrite Cloud
          const backupJson = await exportDatabaseBackup(user.email);
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
          localStorage.setItem('gvcn_active_user_email', currentUser.email);
          setUser(currentUser);
          setSyncState('synced');

          // Check VIP live from Cloud or Local
          const liveVip = await adminGoogleSync.checkVipStatusLive(currentUser);
          if (liveVip.isVip) {
            setIsVip(true);
            setVipExpiresAt(liveVip.vipExpiresAt || 'lifetime');
            adminGoogleSync.setLocalVip(currentUser.email, liveVip.vipExpiresAt || 'lifetime');
            setLicenseStatus(adminGoogleSync.getLicenseStatus(currentUser.email));
          } else {
            const lic = adminGoogleSync.getLicenseStatus(currentUser.email);
            setLicenseStatus(lic);
            setIsVip(lic.isVip);
            setVipExpiresAt(lic.vipExpiresAt);
          }

          // Auto-download cloud data if online
          if (navigator.onLine) {
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
        teacherAvatar,
        setTeacherAvatar,
        teacherCover,
        setTeacherCover,
        teacherBio,
        setTeacherBio,
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
        isVip,
        vipExpiresAt,
        licenseStatus,
        showVipModal,
        setShowVipModal,

        activateVip,
        signIn,
        signUp,
        signOut,
        syncWithCloud,
        clearAllData,
      }}
    >
      {children}
      <VipUpgradeModal isOpen={showVipModal} onClose={() => setShowVipModal(false)} />
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
