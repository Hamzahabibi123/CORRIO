import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';
import type { HistoryDay, PaymentType, UiOrder } from '../types';

interface HistoryState {
  days: HistoryDay[];
  loading: boolean;
  error: string | null;
  /** Carica le sessioni chiuse del rider corrente (work_sessions.closed_at not null)
   *  con i relativi ordini — equivalente dello storico caricato lato web da
   *  `history` (array di "giornate" già archiviate). */
  fetchHistory: () => Promise<void>;
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const raw = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export const useHistoryStore = create<HistoryState>((set) => ({
  days: [],
  loading: false,
  error: null,

  fetchHistory: async () => {
    const auth = useAuthStore.getState();
    if (!auth.session) return;
    set({ loading: true, error: null });

    const { data: sessions, error: sessionsError } = await supabase
      .from('work_sessions')
      .select('id, started_at, closed_at')
      .eq('rider_id', auth.session.id)
      .not('closed_at', 'is', null)
      .order('closed_at', { ascending: false })
      .limit(60);

    if (sessionsError) {
      set({ loading: false, error: sessionsError.message });
      return;
    }
    if (!sessions || sessions.length === 0) {
      set({ loading: false, days: [] });
      return;
    }

    const sessionIds = sessions.map((s) => s.id);
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, session_id, address, amount, payment_type, phone, customer_name, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    if (ordersError) {
      set({ loading: false, error: ordersError.message });
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

    const days: HistoryDay[] = sessions.map((s) => ({
      id: s.id,
      label: formatDayLabel(s.closed_at as string),
      startedAt: new Date(s.started_at).getTime(),
      closedAt: new Date(s.closed_at as string).getTime(),
      orders: ordersBySession.get(s.id) ?? [],
      riderEmail: auth.session!.email,
      riderName: `${auth.session!.firstName} ${auth.session!.lastName}`.trim(),
    }));

    set({ loading: false, days });
  },
}));
