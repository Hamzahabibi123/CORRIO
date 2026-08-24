import { supabase } from './supabase';
import type { AppProfile, AuthSession, ProfileRow, ProfileType, Role } from '../types';

// Stessa logica di traduzione errori usata in pizza-orders-app.html (translateAuthError)
const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email o password non corretti.',
  'User already registered': 'Esiste già un account con questa email. Prova ad accedere.',
  'Email not confirmed': 'Devi prima confermare la tua email: controlla la posta in arrivo.',
  'Password should be at least 6 characters': 'La password deve avere almeno 6 caratteri.',
};
export function translateAuthError(message: string): string {
  return AUTH_ERROR_MAP[message] ?? message;
}

export function roleLabel(role: Role): string {
  return role === 'manager' ? 'Manager' : 'Rider';
}

// --- Lettura profilo (identica alla query fetchProfileRow del web) ---
export async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, business_id, profile_type, first_name, last_name, email, phone, is_active, status_since, created_at, business:business_id(id, name, address, code)'
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('Errore lettura profilo', error);
    return null;
  }
  return data as ProfileRow | null;
}

export async function fetchProfileRowWithRetry(userId: string, attempts = 3): Promise<ProfileRow | null> {
  for (let i = 0; i < attempts; i++) {
    const row = await fetchProfileRow(userId);
    if (row) return row;
    await new Promise((r) => setTimeout(r, 450));
  }
  return null;
}

// Converte la coppia (utente Supabase Auth, riga profiles) nello stato applicativo
// — equivalente di applySessionData() nell'app web.
export function toAuthSession(userId: string, email: string, row: ProfileRow): AuthSession {
  return {
    id: userId,
    email,
    role: row.profile_type === 'MANAGER' ? 'manager' : 'rider',
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    phone: row.phone || '',
    businessId: row.business_id || null,
  };
}

export function toAppProfile(userId: string, email: string, row: ProfileRow): AppProfile {
  const biz = row.business ?? null;
  return {
    id: userId,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    email: email || '',
    phone: row.phone || '',
    restaurantName: biz?.name ?? '',
    address: biz?.address ?? '',
    businessCode: biz?.code ?? '',
    businessId: row.business_id ?? '',
  };
}

// --- Validazione codice business (RPC resolve_business_code, invariata lato DB) ---
export async function resolveBusinessCode(code: string): Promise<{ businessId: string; businessName: string } | null> {
  const { data, error } = await supabase.rpc('resolve_business_code', { p_code: code.trim().toUpperCase() });
  if (error || !data || data.length === 0) return null;
  return { businessId: data[0].business_id, businessName: data[0].business_name };
}

// --- Registrazione ---
export interface RegisterManagerInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  restaurantName: string;
  address: string;
}
export interface RegisterRiderInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  businessCode: string;
}

function buildMetadata(
  profileType: ProfileType,
  base: { firstName: string; lastName: string; phone: string },
  extra: Record<string, string>
) {
  return {
    profile_type: profileType,
    first_name: base.firstName,
    last_name: base.lastName,
    phone: base.phone,
    ...extra,
  };
}

export async function registerManager(input: RegisterManagerInput) {
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: buildMetadata('MANAGER', input, {
        restaurant_name: input.restaurantName,
        address: input.address,
      }),
    },
  });
}

export async function registerRider(input: RegisterRiderInput) {
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: buildMetadata('RIDER', input, {
        business_code: input.businessCode.trim().toUpperCase(),
      }),
    },
  });
}

// --- Login / logout / sessione ---
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
