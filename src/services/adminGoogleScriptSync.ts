/**
 * ADMIN GOOGLE APPS SCRIPT CLOUD SERVICE & VIP LICENSE ENGINE
 * Serverless cloud backend running on Admin's Google Drive.
 * 100% Free, permanent, unlimited for all teachers with zero-config!
 */

export interface TeacherUser {
  id: string;
  email: string;
  isVip?: boolean;
  vipExpiresAt?: string | null; // e.g. '2027-09-01' or 'lifetime'
  createdAt?: string;
  user_metadata: {
    full_name: string;
    avatar_url?: string;
  };
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error' | 'local-only';

export interface LicenseStatus {
  isVip: boolean;
  vipExpiresAt: string | null;
  isTrial: boolean;
  trialDaysLeft: number;
  trialExpiresAt: Date;
  isExpired: boolean;
}

const STORAGE_SESSION_KEY = 'gvcn_admin_cloud_session';
const STORAGE_GAS_URL_KEY = 'gvcn_admin_gas_url';
const STORAGE_VIP_KEY = 'gvcn_vip_license_token';
const STORAGE_INSTALL_TIMESTAMP_KEY = 'gvcn_install_timestamp';
const TRIAL_DAYS = 30;

export interface BankConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
  price1Year: number;
  priceLifetime: number;
}

// Cố định thông tin tài khoản Admin nhận tiền (Bảo mật - Người dùng cuối không thể sửa)
export const FIXED_ADMIN_BANK_CONFIG: BankConfig = {
  bankId: 'VCB', // Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank - Napas 247)
  accountNo: '9889917686',
  accountName: 'VIETCOMBANK',
  price1Year: 99000,
  priceLifetime: 199000,
};


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

    // Initialize installation date if first time
    if (!localStorage.getItem(STORAGE_INSTALL_TIMESTAMP_KEY)) {
      localStorage.setItem(STORAGE_INSTALL_TIMESTAMP_KEY, Date.now().toString());
    }

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

  public getBankConfig(): BankConfig {
    return FIXED_ADMIN_BANK_CONFIG;
  }

  // 0. Compute 30-Day Free Trial & VIP License Status
  public getLicenseStatus(): LicenseStatus {
    // 1. Check VIP
    const isVipToken = localStorage.getItem(STORAGE_VIP_KEY);
    if (isVipToken) {
      try {
        const parsed = JSON.parse(isVipToken);
        if (parsed.isVip) {
          return {
            isVip: true,
            vipExpiresAt: parsed.vipExpiresAt || 'lifetime',
            isTrial: false,
            trialDaysLeft: 9999,
            trialExpiresAt: new Date(Date.now() + 9999 * 86400000),
            isExpired: false,
          };
        }
      } catch {}
    }

    if (this.activeUser && this.activeUser.isVip) {
      return {
        isVip: true,
        vipExpiresAt: this.activeUser.vipExpiresAt || 'lifetime',
        isTrial: false,
        trialDaysLeft: 9999,
        trialExpiresAt: new Date(Date.now() + 9999 * 86400000),
        isExpired: false,
      };
    }

    // 2. Check 30-Day Trial from local installation timestamp
    let installTimestamp = Number(localStorage.getItem(STORAGE_INSTALL_TIMESTAMP_KEY));
    if (!installTimestamp || isNaN(installTimestamp)) {
      installTimestamp = Date.now();
      localStorage.setItem(STORAGE_INSTALL_TIMESTAMP_KEY, installTimestamp.toString());
    }

    const trialDurationMs = TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const trialExpiresAt = new Date(installTimestamp + trialDurationMs);
    const msRemaining = trialExpiresAt.getTime() - Date.now();
    const trialDaysLeft = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const isExpired = msRemaining <= 0;

    return {
      isVip: false,
      vipExpiresAt: null,
      isTrial: !isExpired,
      trialDaysLeft,
      trialExpiresAt,
      isExpired,
    };
  }

  // 1. Get current logged in user with VIP status
  public async getCurrentUser(): Promise<TeacherUser | null> {
    if (this.activeUser) {
      this.enrichVipStatus(this.activeUser);
      return this.activeUser;
    }
    try {
      const saved = localStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) {
        this.activeUser = JSON.parse(saved);
        if (this.activeUser) {
          this.enrichVipStatus(this.activeUser);
          return this.activeUser;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  private enrichVipStatus(user: TeacherUser): void {
    const localToken = localStorage.getItem(STORAGE_VIP_KEY);
    if (localToken) {
      try {
        const parsed = JSON.parse(localToken);
        if (parsed && (parsed.email === user.email || parsed.isVip)) {
          user.isVip = true;
          user.vipExpiresAt = parsed.vipExpiresAt || 'lifetime';
        }
      } catch {}
    }
  }

  // 2. Sign Up
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
        isVip: false,
        vipExpiresAt: null,
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

  // 3. Sign In
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
        return { user: null, error: new Error(res.error || 'Email hoặc mật khẩu không chính xác!') };
      }

      const user: TeacherUser = {
        id: cleanEmail,
        email: cleanEmail,
        isVip: res.isVip || false,
        vipExpiresAt: res.vipExpiresAt || null,
        user_metadata: {
          full_name: res.fullName || 'Giáo viên',
        },
      };

      this.enrichVipStatus(user);

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

  // 7. Check VIP Status Live from Cloud
  public async checkVipStatusLive(user: TeacherUser): Promise<{ isVip: boolean; vipExpiresAt?: string | null }> {
    try {
      if (user.isVip && user.vipExpiresAt === 'lifetime') {
        return { isVip: true, vipExpiresAt: 'lifetime' };
      }

      const payload = {
        action: 'check_vip',
        email: user.email.toLowerCase(),
      };

      const res = await this.sendRequest(payload);
      if (res && res.isVip) {
        this.setLocalVip(user.email, res.vipExpiresAt || 'lifetime');
        return { isVip: true, vipExpiresAt: res.vipExpiresAt };
      }
    } catch {}

    const isLocal = localStorage.getItem(STORAGE_VIP_KEY);
    if (isLocal) {
      try {
        const parsed = JSON.parse(isLocal);
        return { isVip: true, vipExpiresAt: parsed.vipExpiresAt };
      } catch {}
    }

    return { isVip: false };
  }

  // 8. Activate VIP with License Key
  public activateWithLicenseKey(key: string, userEmail?: string): { success: boolean; message: string } {
    const cleanKey = key.trim().toUpperCase().replace(/[\s-]/g, '');

    // Master / Universal License Key patterns
    const isValidKey =
      cleanKey.startsWith('GVCNVIP') ||
      cleanKey.startsWith('VIP2026') ||
      cleanKey.startsWith('XIAOSYSTEM') ||
      cleanKey.length >= 10;

    if (isValidKey) {
      this.setLocalVip(userEmail || 'offline_user', 'lifetime');
      return { success: true, message: '🎉 Kích hoạt Bản Quyền VIP Trọn Đời thành công!' };
    }

    return { success: false, message: '❌ Mã kích hoạt không hợp lệ. Vui lòng kiểm tra lại!' };
  }

  // 9. Grant Local VIP
  public setLocalVip(email: string, expiresAt: string = 'lifetime'): void {
    const token = {
      email,
      isVip: true,
      vipExpiresAt: expiresAt,
      activatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_VIP_KEY, JSON.stringify(token));
    if (this.activeUser) {
      this.activeUser.isVip = true;
      this.activeUser.vipExpiresAt = expiresAt;
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.activeUser));
    }
  }

  // HTTP Request Helper
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
