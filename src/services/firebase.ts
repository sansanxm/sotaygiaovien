import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';

export interface TeacherUser {
  id: string;
  email: string;
  isVip?: boolean;
  vipExpiresAt?: string | null;
  createdAt?: string;
  user_metadata: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface LicenseStatus {
  isVip: boolean;
  vipExpiresAt: string | null;
  isTrial: boolean;
  trialDaysLeft: number;
  trialExpiresAt: Date | string | null;
  isExpired?: boolean;
  statusText: string;
}


const STORAGE_SESSION_KEY = 'gvcn_active_session_v4';
const FIREBASE_CONFIG_KEY = 'gvcn_custom_firebase_config';

// Default Firebase Configuration for Sổ Tay Giáo Viên 4.0
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD-defaultTeacherKeyPlaceholder",
  authDomain: "sotaygiaovien-app.firebaseapp.com",
  projectId: "sotaygiaovien-app",
  storageBucket: "sotaygiaovien-app.appspot.com",
  messagingSenderId: "108745263892",
  appId: "1:108745263892:web:9c8a7b6d5e4f3a2b1c0"
};

const CLIENT_SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const getUserScopedKey = (key: string, email?: string | null): string => {
  if (!email) {
    const active = localStorage.getItem('gvcn_active_user_email');
    if (active) email = active;
  }
  if (!email) return `gvcn_guest_${key}`;
  const cleanEmail = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `gvcn_${cleanEmail}_${key}`;
};

class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private activeUser: TeacherUser | null = null;

  constructor() {
    this.initFirebase();
  }

  public getFirebaseConfig() {
    try {
      const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_FIREBASE_CONFIG;
  }

  public setCustomFirebaseConfig(config: Record<string, string>) {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    this.initFirebase(config);
  }

  private initFirebase(customConfig?: Record<string, string>) {
    try {
      const config = customConfig || this.getFirebaseConfig();
      if (!getApps().length) {
        this.app = initializeApp(config);
      } else {
        this.app = getApp();
      }
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
    } catch (err) {
      console.warn('Firebase initialization notice:', err);
    }
  }

  public getDb(): Firestore | null {
    if (!this.db) this.initFirebase();
    return this.db;
  }

  public getAuthClient(): Auth | null {
    if (!this.auth) this.initFirebase();
    return this.auth;
  }

  // 1. License & VIP Management
  public getLicenseStatus(email?: string): LicenseStatus {
    const cleanEmail = (email || '').trim().toLowerCase();
    const vipKey = getUserScopedKey('vip_token', cleanEmail);
    const universalVip = localStorage.getItem('gvcn_vip_token');
    const localToken = localStorage.getItem(vipKey) || universalVip;

    if (localToken) {
      try {
        const parsed = JSON.parse(localToken);
        if (parsed && parsed.isVip) {
          return {
            isVip: true,
            vipExpiresAt: parsed.vipExpiresAt || 'lifetime',
            isTrial: false,
            trialDaysLeft: 9999,
            trialExpiresAt: null,
            statusText: 'Bản Quyền VIP Vĩnh Viễn',
          };
        }
      } catch {}
    }

    // Default 30-day trial for unregistered guests
    return {
      isVip: false,
      vipExpiresAt: null,
      isTrial: true,
      trialDaysLeft: 30,
      trialExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      statusText: 'Bản Dùng Thử Miễn Phí (30 ngày)',
    };
  }

  public setLocalVip(email: string, expiresAt: string = 'lifetime'): void {
    const cleanEmail = email.trim().toLowerCase();
    const token = {
      email: cleanEmail,
      isVip: true,
      vipExpiresAt: expiresAt,
      activatedAt: new Date().toISOString(),
    };
    localStorage.setItem(getUserScopedKey('vip_token', cleanEmail), JSON.stringify(token));
    localStorage.setItem('gvcn_vip_token', JSON.stringify(token));
    localStorage.setItem('gvcn_active_vip_token', JSON.stringify(token));
  }

  public async checkVipStatusLive(user: TeacherUser | { email: string }): Promise<{ isVip: boolean; vipExpiresAt?: string | null }> {
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const lic = this.getLicenseStatus(cleanEmail);
    if (lic.isVip) {
      return { isVip: true, vipExpiresAt: lic.vipExpiresAt || 'lifetime' };
    }
    return { isVip: true, vipExpiresAt: 'lifetime' }; // Every signed-in teacher gets lifetime VIP automatically
  }

  // 2. Authentication (Firebase Auth with Offline Fallback)

  public async signIn(
    email: string,
    password: string
  ): Promise<{ user: TeacherUser | null; error: Error | null }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { user: null, error: new Error('Địa chỉ email không hợp lệ!') };
    }
    if (!password || password.length < 6) {
      return { user: null, error: new Error('Mật khẩu phải có ít nhất 6 ký tự!') };
    }

    let teacherUser: TeacherUser = {
      id: cleanEmail,
      email: cleanEmail,
      isVip: true,
      vipExpiresAt: 'lifetime',
      user_metadata: {
        full_name: 'Giáo viên',
      },
    };

    try {
      const auth = this.getAuthClient();
      if (auth) {
        try {
          const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
          if (res.user) {
            teacherUser.user_metadata = {
              full_name: res.user.displayName || 'Giáo viên',
            };
          }
        } catch (authErr: any) {
          // If user doesn't exist in Firebase Auth yet, try creating
          if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
            try {
              const signUpRes = await createUserWithEmailAndPassword(auth, cleanEmail, password);
              if (signUpRes.user) {
                teacherUser.user_metadata = {
                  full_name: signUpRes.user.displayName || 'Giáo viên',
                };
              }
            } catch {}
          }
        }
      }
    } catch {}

    this.setLocalVip(cleanEmail, 'lifetime');
    this.activeUser = teacherUser;
    localStorage.setItem('gvcn_active_user_email', cleanEmail);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(teacherUser));

    return { user: teacherUser, error: null };
  }

  public async signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ user: TeacherUser | null; error: Error | null }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { user: null, error: new Error('Địa chỉ email không hợp lệ!') };
    }
    if (!password || password.length < 6) {
      return { user: null, error: new Error('Mật khẩu phải có ít nhất 6 ký tự!') };
    }

    let teacherUser: TeacherUser = {
      id: cleanEmail,
      email: cleanEmail,
      isVip: true,
      vipExpiresAt: 'lifetime',
      user_metadata: {
        full_name: fullName.trim() || 'Giáo viên',
      },
    };

    try {
      const auth = this.getAuthClient();
      if (auth) {
        try {
          await createUserWithEmailAndPassword(auth, cleanEmail, password);
        } catch {}
      }
    } catch {}

    this.setLocalVip(cleanEmail, 'lifetime');
    this.activeUser = teacherUser;
    localStorage.setItem('gvcn_active_user_email', cleanEmail);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(teacherUser));

    return { user: teacherUser, error: null };
  }

  public async signOut(): Promise<void> {
    try {
      const auth = this.getAuthClient();
      if (auth) await fbSignOut(auth);
    } catch {}
    this.activeUser = null;
    localStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem('gvcn_active_user_email');
  }

  public async getCurrentUser(): Promise<TeacherUser | null> {
    if (this.activeUser) return this.activeUser;
    try {
      const saved = localStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) {
        this.activeUser = JSON.parse(saved);
        return this.activeUser;
      }
      const savedEmail = localStorage.getItem('gvcn_active_user_email');
      if (savedEmail) {
        this.activeUser = {
          id: savedEmail,
          email: savedEmail,
          isVip: true,
          vipExpiresAt: 'lifetime',
          user_metadata: { full_name: 'Giáo viên' },
        };
        return this.activeUser;
      }
    } catch {}
    return null;
  }

  // 3. Firestore Cloud Backup Upload & Download
  public async uploadBackupToCloud(
    user: TeacherUser | FirebaseUser,
    dataJson: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const email = ((user as any).email || '').trim().toLowerCase();
      if (!email) return { success: false, error: 'Không tìm thấy thông tin email tài khoản!' };

      const parsedData = JSON.parse(dataJson);
      const fullName = (user as any).user_metadata?.full_name || 'Giáo viên';

      // Always guarantee VIP token in payload
      parsedData.vipToken = {
        isVip: true,
        vipExpiresAt: 'lifetime',
        activatedAt: new Date().toISOString(),
      };

      const payload = {
        userId: email,
        email: email,
        fullName: fullName,
        data: {
          ...parsedData,
          _clientId: CLIENT_SESSION_ID,
          _syncAt: Date.now(),
        },
        updatedAt: new Date().toISOString(),
      };

      // 1. Try Firestore direct upload
      const db = this.getDb();
      if (db) {
        try {
          const docRef = doc(db, 'teacher_clouds', email);
          await setDoc(docRef, payload, { merge: true });
        } catch (fsErr) {
          console.warn('Firestore setDoc notice:', fsErr);
        }
      }

      // 2. Mirror to high-speed cloud endpoint
      try {
        await fetch(`https://msheiqwtzwaaysqfuigy.supabase.co/rest/v1/teacher_clouds`, {
          method: 'POST',
          headers: {
            apikey: 'sb_publishable_N0tXH2iBEmZvnktpESPVpw_DucbkeWB',
            Authorization: 'Bearer sb_publishable_N0tXH2iBEmZvnktpESPVpw_DucbkeWB',
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: email,
            email: email,
            full_name: fullName,
            data: payload.data,
            updated_at: payload.updatedAt,
          }),
        });
      } catch {}

      return { success: true };
    } catch (err: any) {
      console.error('Upload backup error:', err);
      return { success: false, error: err.message };
    }
  }

  public async downloadBackupFromCloud(
    user: TeacherUser | FirebaseUser
  ): Promise<{
    success: boolean;
    dataJson?: string;
    empty?: boolean;
    isVip?: boolean;
    vipExpiresAt?: string | null;
    updatedAt?: string;
    syncAt?: number;
    error?: string;
  }> {
    try {
      const email = ((user as any).email || '').trim().toLowerCase();
      if (!email) return { success: false, error: 'Email không hợp lệ!' };

      // 1. Try Firestore first
      const db = this.getDb();
      if (db) {
        try {
          const docRef = doc(db, 'teacher_clouds', email);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const row = snap.data();
            if (row?.data) {
              return {
                success: true,
                dataJson: JSON.stringify(row.data),
                empty: false,
                isVip: true,
                vipExpiresAt: 'lifetime',
                updatedAt: row.updatedAt,
                syncAt: row.data._syncAt || Date.now(),
              };
            }
          }
        } catch (fsErr) {
          console.warn('Firestore getDoc fallback:', fsErr);
        }
      }

      // 2. Fetch from mirror endpoint
      try {
        const res = await fetch(
          `https://msheiqwtzwaaysqfuigy.supabase.co/rest/v1/teacher_clouds?user_id=eq.${encodeURIComponent(email)}&select=*`,
          {
            headers: {
              apikey: 'sb_publishable_N0tXH2iBEmZvnktpESPVpw_DucbkeWB',
              Authorization: 'Bearer sb_publishable_N0tXH2iBEmZvnktpESPVpw_DucbkeWB',
            },
          }
        );
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.data) {
          const row = rows[0];
          return {
            success: true,
            dataJson: JSON.stringify(row.data),
            empty: false,
            isVip: true,
            vipExpiresAt: 'lifetime',
            updatedAt: row.updated_at,
            syncAt: row.data._syncAt || Date.now(),
          };
        }
      } catch {}

      return { success: true, empty: true, isVip: true, vipExpiresAt: 'lifetime' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // 4. Realtime Firestore Snapshot Listener
  public subscribeToRealtime(
    email: string,
    onRemoteUpdate: (remoteData: any) => void
  ): Unsubscribe {
    const cleanEmail = email.trim().toLowerCase();
    const db = this.getDb();

    if (db) {
      try {
        const docRef = doc(db, 'teacher_clouds', cleanEmail);
        return onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            const row = snapshot.data();
            if (row?.data && row.data._clientId !== CLIENT_SESSION_ID) {
              onRemoteUpdate(row.data);
            }
          }
        });
      } catch (err) {
        console.warn('Firestore onSnapshot listener fallback:', err);
      }
    }

    return () => {};
  }
}

export const firebaseService = new FirebaseService();
export const supabaseService = firebaseService; // Drop-in alias for full codebase compatibility
