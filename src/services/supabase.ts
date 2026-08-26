import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

// Pre-configured Central Cloud Server for all teachers
// Built into the app packaging so teachers don't have to configure anything!
const DEFAULT_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://gvcn-cloud.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y24tY2xvdWQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MDAwMDAwMCwiZXhwIjoxOTgwMDAwMDAwfQ.placeholder';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error' | 'local-only';

class CloudSyncService {
  private client: SupabaseClient | null = null;
  private url: string = DEFAULT_SUPABASE_URL;
  private anonKey: string = DEFAULT_SUPABASE_ANON_KEY;

  constructor() {
    // Check if custom environment or saved config exists
    const savedUrl = localStorage.getItem('sotay_supabase_url');
    const savedKey = localStorage.getItem('sotay_supabase_anon');
    if (savedUrl) this.url = savedUrl;
    if (savedKey) this.anonKey = savedKey;
  }

  public getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(this.url, this.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }
    return this.client;
  }

  public isConfigured(): boolean {
    return Boolean(this.url && this.anonKey && !this.url.includes('example-project'));
  }

  // 1. Email & Password Sign In
  public async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const client = this.getClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      return { user: data.user, error };
    } catch (err) {
      return { user: null, error: err as Error };
    }
  }

  // 2. Email & Password Sign Up (Auto Create Teacher Account)
  public async signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ user: User | null; error: Error | null }> {
    try {
      const client = this.getClient();
      const { data, error } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      return { user: data.user, error };
    } catch (err) {
      return { user: null, error: err as Error };
    }
  }

  // 3. Sign Out
  public async signOut(): Promise<void> {
    try {
      const client = this.getClient();
      await client.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  }

  // 4. Get Current Active User
  public async getCurrentUser(): Promise<User | null> {
    try {
      const client = this.getClient();
      const { data } = await client.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  }

  // 5. Upload class database to Cloud
  public async uploadBackupToCloud(
    user: User,
    dataJson: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();
      const parsedData = JSON.parse(dataJson);

      const { error } = await client.from('teacher_clouds').upsert(
        {
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Giáo viên',
          avatar_url: user.user_metadata?.avatar_url || '',
          data: parsedData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.warn('Cloud upload warning:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Cloud upload exception:', err);
      return { success: false, error: (err as Error).message };
    }
  }

  // 6. Download class database from Cloud
  public async downloadBackupFromCloud(
    user: User
  ): Promise<{ success: boolean; dataJson?: string; empty?: boolean; error?: string }> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from('teacher_clouds')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || !data.data) {
        return { success: true, empty: true };
      }

      return {
        success: true,
        dataJson: JSON.stringify(data.data),
      };
    } catch (err) {
      console.error('Cloud download exception:', err);
      return { success: false, error: (err as Error).message };
    }
  }
}

export const supabaseService = new CloudSyncService();
export const cloudSyncService = supabaseService;
