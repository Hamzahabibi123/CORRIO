import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';
import type { ManagerHistoryDay, ManagerRider, PaymentType, UiOrder } from '../types';

interface ManagerState {
  riders: ManagerRider[];
  ridersLoading: boolean;
  ridersError: string | null;
  fetchRiders: () => Promise<void>;

  history: ManagerHistoryDay[];
  historyLoading: boolean;
  historyError: string | null;
  fetchHistory: () => Promise<void>;
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const raw = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Equivalente lato manager di useOrdersStore/useHistoryStore: elenco rider del
// business (profiles.profile_type='RIDER') e storico di TUTTE le sessioni chiuse
// del business, con il nome del rider che le ha effettuate — porting di
// refreshRidersCache()/getRidersList() e fetchManagerHistory() dal riferimento web.
export const useManagerStore = create<ManagerState>((set) => ({
  riders: [],
  ridersLoading: false,
  ridersError: null,

  fetchRiders: async () => {
    const auth = useAuthStore.getState();
    if (!auth.session?.businessId) {
      set({ riders: [], ridersLoading: false });
      return;
    }
    set({ ridersLoading: true, ridersError: null });
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, is_active, status_since')
      .eq('business_id', auth.session.businessId)
      .eq('profile_type', 'RIDER')
      .order('first_name', { ascending: true });
    if (error) {
      set({ ridersLoading: false, ridersError: error.message });
      return;
    }
    const riders: ManagerRider[] = (data || []).map((r) => ({
      id: r.id,
      firstName: r.first_name || '',
      lastName: r.last_name || '',
      email: r.email || '',
      phone: r.phone || '',
      isActive: !!r.is_active,
      statusSince: r.status_since,
    }));
    set({ riders, ridersLoading: false });
  },

  history: [],
  historyLoading: false,
  historyError: null,

  fetchHistory: async () => {
    const auth = useAuthStore.getState();
    if (!auth.session?.businessId) {
      set({ history: [], historyLoading: false });
      return;
    }
    set({ historyLoading: true, historyError: null });

    const { data: sessions, error: sessionsError } = await supabase
      .from('work_sessions')
      .select('id, started_at, closed_at, rider_id')
      .eq('business_id', auth.session.businessId)
      .not('closed_at', 'is', null)
      .order('closed_at', { ascending: false })
      .limit(200);

    if (sessionsError) {
      set({ historyLoading: false, historyError: sessionsError.message });
      return;
    }
    if (!sessions || sessions.length === 0) {
      set({ historyLoading: false, history: [] });
      return;
    }

    const riderIds = Array.from(new Set(sessions.map((s) => s.rider_id).filter(Boolean)));
    const { data: ridersData, error: ridersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', riderIds);
    if (ridersError) {
      set({ historyLoading: false, historyError: ridersError.message });
      return;
    }
    const riderById = new Map((ridersData || []).map((r) => [r.id, r]));

    const sessionIds = sessions.map((s) => s.id);
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, session_id, address, amount, payment_type, phone, customer_name, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });
    if (ordersError) {
      set({ historyLoading: false, historyError: ordersError.message });
      return;
    }

    const ordersBySession = new Map<string, UiOrder[]>();
    (ordersData || []).forEach((o) => {
      const list = ordersBySession.get(o.session_id) ?? [];
      list.push({
        id: o.id,
        address: o.address,
        amount: Number(o.amount),
        type: o.payment_type as PaymentType | null,
        phone: o.phone ?? null,
        customerName: o.customer_name ?? null,
        ts: new Date(o.created_at).getTime(),
      });
      ordersBySession.set(o.session_id, list);
    });

    const history: ManagerHistoryDay[] = sessions.map((s) => {
      const rider = riderById.get(s.rider_id);
      const riderName = rider ? `${rider.first_name || ''} ${rider.last_name || ''}`.trim() : '';
      return {
        id: s.id,
        label: formatDayLabel(s.closed_at as string),
        startedAt: new Date(s.started_at).getTime(),
        closedAt: new Date(s.closed_at as string).getTime(),
        orders: ordersBySession.get(s.id) ?? [],
        riderId: s.rider_id,
        riderEmail: rider?.email || '',
        riderName: riderName || 'Rider sconosciuto',
      };
    });

    set({ historyLoading: false, history });
  },
}));
