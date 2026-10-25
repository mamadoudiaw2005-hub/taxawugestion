import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pdnbogrgohgzjkrzywml.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5dSQiJQXcHxzXDapC41Mjg_xZrgbPu_';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

/**
 * Service d'authentification Supabase
 */
export const supabaseAuth = {
  async signUp(email: string, password: string, metadata: { name: string; role?: string; shopName?: string }) {
    if (!supabase) throw new Error('Supabase n\'est pas encore configuré. Renseignez vos clés dans le fichier .env');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase n\'est pas encore configuré. Renseignez vos clés dans le fichier .env');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    if (!supabase) throw new Error('Supabase n\'est pas encore configuré.');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      }
    });
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
    return data;
  },

  async resetPassword(email: string) {
    if (!supabase) throw new Error('Supabase n\'est pas encore configuré.');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword: string) {
    if (!supabase) throw new Error('Supabase n\'est pas encore configuré.');
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  },

  async getUser() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  }
};
