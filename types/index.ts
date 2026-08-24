// Tipi che rispecchiano lo schema Supabase (public.business / public.profiles /
// public.work_sessions / public.orders) — vedi il backend descritto in CHORRIO_APP.

export type Role = 'rider' | 'manager';
export type ProfileType = 'MANAGER' | 'RIDER';
export type PaymentType = 'pos' | 'cash' | 'paid';

export interface BusinessRow {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  code: string;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  business_id: string | null;
  profile_type: ProfileType;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  status_since: string;
  created_at: string;
  business?: Pick<BusinessRow, 'id' | 'name' | 'address' | 'code'> | null;
}

export interface WorkSessionRow {
  id: string;
  business_id: string;
  rider_id: string;
  started_at: string;
  closed_at: string | null;
}

export interface OrderRow {
  id: string;
  session_id: string;
  business_id: string;
  rider_id: string;
  address: string;
  amount: number;
  payment_type: PaymentType | null;
  phone: string | null;
  customer_name: string | null;
  created_at: string;
}

// --- Stato applicativo lato client (mirror di authSession/profile nell'app web) ---
export interface AuthSession {
  id: string; // auth.users.id / profiles.id
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string;
  businessId: string | null;
}

export interface AppProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  restaurantName: string;
  address: string;
  businessCode: string;
  businessId: string;
}

// Ordine "in giornata" lato UI (equivalente dell'oggetto `orders[]` nell'app web)
export interface UiOrder {
  id: string;
  address: string;
  amount: number;
  type: PaymentType | null;
  phone: string | null;
  customerName: string | null;
  ts: number; // epoch ms
}

// "Giornata" archiviata nello storico (equivalente di un `day` in history/mgrHistory)
export interface HistoryDay {
  id: string; // work_sessions.id
  label: string;
  startedAt: number;
  closedAt: number;
  orders: UiOrder[];
  riderEmail: string;
  riderName: string;
}

// --- Lato Manager (equivalente di ridersCache / mgrHistory nell'app web) ---
export interface ManagerRider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  statusSince: string | null;
}

// Come HistoryDay ma con anche l'id del rider (per il filtro select del manager).
export interface ManagerHistoryDay extends HistoryDay {
  riderId: string;
}
