/**
 * ADMIN GOOGLE APPS SCRIPT CLOUD SERVICE
 * Serverless cloud backend running on Admin's Google Drive.
 * 100% Free, permanent, unlimited for all teachers with zero-config!
 */

export interface TeacherUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url?: string;
  };
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error' | 'local-only';

const STORAGE_SESSION_KEY = 'gvcn_admin_cloud_session';
const STORAGE_GAS_URL_KEY = 'gvcn_admin_gas_url';

// Default Admin Script URL (Baked permanently into app for all teachers)
export const DEFAULT_ADMIN_GAS_URL =
  'https://script.google.com/macros/s/AKfycbzoLxvzgWqmWKWBbCDqOUM5F0lZbiO25uK8_GF1Sk48HeF-wvJaZ-rKReGCZqpu5CwhBw/exec';


// Password hash helper
function hashPassword(pwd: string): string {
  let h = 5381;
  for (let i = 0; i < pwd.length; i++) {
    h = (h * 33) ^ pwd.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

class AdminGoogleScriptSyncService {
  private activeUser: TeacherUser | null = null;
  private scriptUrl: string = DEFAULT_ADMIN_GAS_URL;

  constructor() {
    this.scriptUrl = DEFAULT_ADMIN_GAS_URL;
    localStorage.setItem(STORAGE_GAS_URL_KEY, DEFAULT_ADMIN_GAS_URL);

    try {
      const savedUser = localStorage.getItem(STORAGE_SESSION_KEY);
      if (savedUser) {
        this.activeUser = JSON.parse(savedUser);
      }
    } catch {
      this.activeUser = null;
    }
  }


  public getScriptUrl(): string {
    return this.scriptUrl;
  }

  public setScriptUrl(url: string): void {
    if (url) {
      this.scriptUrl = url.trim();
      localStorage.setItem(STORAGE_GAS_URL_KEY, this.scriptUrl);
    }
  }

  public isConfigured(): boolean {
    return Boolean(
      this.scriptUrl &&
        this.scriptUrl.startsWith('https://script.google.com/macros/s/') &&
        !this.scriptUrl.includes('placeholder')
    );
  }

  // 1. Get current logged in user
  public async getCurrentUser(): Promise<TeacherUser | null> {
    if (this.activeUser) return this.activeUser;
    try {
      const saved = localStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) {
        this.activeUser = JSON.parse(saved);
        return this.activeUser;
      }
    } catch {
      // ignore
    }
    return null;
  }

  // 2. Sign Up (Register new teacher account on Admin's Google Drive)
  public async signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ user: TeacherUser | null; error: Error | null }> {
    try {
      if (!navigator.onLine) {
        return { user: null, error: new Error('Không có kết nối mạng Internet!') };
      }

      const cleanEmail = email.trim().toLowerCase();
      const pwdHash = hashPassword(password);

      const payload = {
        action: 'register',
        email: cleanEmail,
        passwordHash: pwdHash,
        fullName: fullName.trim() || 'Giáo viên',
      };

      const res = await this.sendRequest(payload);
      if (!res.success) {
        return { user: null, error: new Error(res.error || 'Đăng ký không thành công!') };
      }

      const user: TeacherUser = {
        id: cleanEmail,
        email: cleanEmail,
        user_metadata: {
          full_name: fullName.trim() || 'Giáo viên',
        },
      };

      this.activeUser = user;
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));

      return { user, error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      return { user: null, error: err as Error };
    }
  }

  // 3. Sign In (Authenticate teacher on Admin's Google Drive)
  public async signIn(
    email: string,
    password: string
  ): Promise<{ user: TeacherUser | null; error: Error | null }> {
    try {
      if (!navigator.onLine) {
        return { user: null, error: new Error('Không có kết nối mạng Internet!') };
      }

      const cleanEmail = email.trim().toLowerCase();
      const pwdHash = hashPassword(password);

      const payload = {
        action: 'login',
        email: cleanEmail,
        passwordHash: pwdHash,
      };

      const res = await this.sendRequest(payload);
      if (!res.success) {
        return { user: null, error: new Error(res.error || 'Sai email hoặc mật khẩu!') };
      }

      const user: TeacherUser = {
        id: cleanEmail,
        email: cleanEmail,
        user_metadata: {
          full_name: res.fullName || 'Giáo viên',
        },
      };

      this.activeUser = user;
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));

      return { user, error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { user: null, error: err as Error };
    }
  }

  // 4. Sign Out
  public async signOut(): Promise<void> {
    this.activeUser = null;
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }

  // 5. Upload class database to Admin's Google Drive
  public async uploadBackupToCloud(
    user: TeacherUser,
    dataJson: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = {
        action: 'sync_upload',
        email: user.email.toLowerCase(),
        fullName: user.user_metadata.full_name,
        data: JSON.parse(dataJson),
      };

      const res = await this.sendRequest(payload);
      return { success: res.success, error: res.error };
    } catch (err) {
      console.error('Upload backup error:', err);
      return { success: false, error: (err as Error).message };
    }
  }

  // 6. Download class database from Admin's Google Drive
  public async downloadBackupFromCloud(
    user: TeacherUser
  ): Promise<{ success: boolean; dataJson?: string; empty?: boolean; error?: string }> {
    try {
      const payload = {
        action: 'sync_download',
        email: user.email.toLowerCase(),
      };

      const res = await this.sendRequest(payload);
      if (!res.success) {
        return { success: false, error: res.error };
      }

      if (!res.data) {
        return { success: true, empty: true };
      }

      return {
        success: true,
        dataJson: JSON.stringify(res.data),
      };
    } catch (err) {
      console.error('Download backup error:', err);
      return { success: false, error: (err as Error).message };
    }
  }

  // HTTP Request Helper with redirect handling
  private async sendRequest(payload: any): Promise<any> {
    const url = this.scriptUrl;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      if (response.ok) {
        return { success: true };
      }
      throw new Error('Máy chủ Google Script phản hồi không hợp lệ');
    }
  }
}

export const adminGoogleSync = new AdminGoogleScriptSyncService();
export const freeCloudSync = adminGoogleSync;
export const cloudSyncService = adminGoogleSync;
export const supabaseService = adminGoogleSync;
