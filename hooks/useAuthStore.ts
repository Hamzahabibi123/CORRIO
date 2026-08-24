import { create } from 'zustand';
import { supabase } from '../services/supabase';
import {
  fetchProfileRowWithRetry,
  getCurrentSession,
  registerManager,
  registerRider,
  signIn as apiSignIn,
  signOut as apiSignOut,
  toAppProfile,
  toAuthSession,
  type RegisterManagerInput,
  type RegisterRiderInput,
} from '../services/auth';
import type { AppProfile, AuthSession, Role } from '../types';

interface AuthState {
  session: AuthSession | null;
  profile: AppProfile | null;
  status: 'idle' | 'loading' | 'ready';
  /** Ripristina la sessione salvata (AsyncStorage) all'avvio dell'app. */
  restore: () => Promise<void>;
  /** Login con ruolo atteso: se il profilo reale ha un ruolo diverso, fallisce con errore leggibile. */
  login: (email: string, password: string, expectedRole: Role) => Promise<{ error: string | null }>;
  signUpManager: (input: RegisterManagerInput) => Promise<{ error: string | null; needsEmailConfirm: boolean }>;
  signUpRider: (input: RegisterRiderInput) => Promise<{ error: string | null; needsEmailConfirm: boolean }>;
  logout: () => Promise<void>;
  /** Aggiorna profilo/business su Supabase e nello stato locale (equivalente persistProfileToDb). */
  updateProfile: (patch: Partial<AppProfile>) => Promise<{ error: string | null }>;
  setRiderActive: (active: boolean) => Promise<void>;
}

async function loadSession(userId: string, email: string): Promise<{ session: AuthSession; profile: AppProfile } | null> {
  const row = await fetchProfileRowWithRetry(userId);
  if (!row) return null;
  return { session: toAuthSession(userId, email, row), profile: toAppProfile(userId, email, row) };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  status: 'idle',

  restore: async () => {
    set({ status: 'loading' });
    const activeSession = await getCurrentSession();
    if (activeSession?.user) {
      const loaded = await loadSession(activeSession.user.id, activeSession.user.email ?? '');
      if (loaded) {
        set({ session: loaded.session, profile: loaded.profile, status: 'ready' });
        return;
      }
    }
    set({ session: null, profile: null, status: 'ready' });
  },

  login: async (email, password, expectedRole) => {
    const { data, error } = await apiSignIn(email, password);
    if (error) return { error: error.message };
    const loaded = await loadSession(data.user.id, data.user.email ?? '');
    if (!loaded) return { error: 'Impossibile caricare il profilo.' };
    if (loaded.session.role !== expectedRole) {
      await apiSignOut();
      return { error: `Questo account è registrato come ${loaded.session.role === 'manager' ? 'Manager' : 'Rider'}.` };
    }
    set({ session: loaded.session, profile: loaded.profile, status: 'ready' });
    return { error: null };
  },

  signUpManager: async (input) => {
    const { data, error } = await registerManager(input);
    if (error) return { error: error.message, needsEmailConfirm: false };
    if (data.session && data.user) {
      const loaded = await loadSession(data.user.id, data.user.email ?? '');
      if (loaded) set({ session: loaded.session, profile: loaded.profile, status: 'ready' });
      return { error: null, needsEmailConfirm: false };
    }
    return { error: null, needsEmailConfirm: true };
  },

  signUpRider: async (input) => {
    const { data, error } = await registerRider(input);
    if (error) return { error: error.message, needsEmailConfirm: false };
    if (data.session && data.user) {
      const loaded = await loadSession(data.user.id, data.user.email ?? '');
      if (loaded) set({ session: loaded.session, profile: loaded.profile, status: 'ready' });
      return { error: null, needsEmailConfirm: false };
    }
    return { error: null, needsEmailConfirm: true };
  },

  logout: async () => {
    await apiSignOut();
    set({ session: null, profile: null });
  },

  updateProfile: async (patch) => {
    const { session, profile } = get();
    if (!session || !profile) return { error: 'Nessuna sessione attiva.' };
    const nextProfile: AppProfile = { ...profile, ...patch };
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: nextProfile.firstName,
        last_name: nextProfile.lastName,
        phone: nextProfile.phone,
      })
      .eq('id', session.id);
    if (profileError) return { error: profileError.message };

    if (session.role === 'manager' && nextProfile.businessId) {
      const { error: bizError } = await supabase
        .from('business')
        .update({ name: nextProfile.restaurantName, address: nextProfile.address })
        .eq('id', nextProfile.businessId);
      if (bizError) return { error: bizError.message };
    }
    set({ profile: nextProfile });
    return { error: null };
  },

  setRiderActive: async (active) => {
    const { session } = get();
    if (!session) return;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: active, status_since: new Date().toISOString() })
      .eq('id', session.id);
    if (error) console.error('Errore aggiornamento stato rider', error);
  },
}));
