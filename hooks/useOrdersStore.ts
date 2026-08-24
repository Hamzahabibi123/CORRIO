import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';
import type { PaymentType, UiOrder } from '../types';

const SESSION_ID_KEY = 'corrio_current_session_id_v1';

interface OrdersState {
  sessionActive: boolean;
  currentSessionId: string | null;
  orders: UiOrder[];
  hydrated: boolean;
  /** Ripristina una sessione aperta (se esiste) all'avvio — equivalente di loadState()
   *  + il controllo sessionActive/currentSessionId dell'app web. */
  hydrate: () => Promise<void>;
  startSession: () => Promise<{ error: string | null }>;
  endSession: () => Promise<{ error: string | null }>;
  addOrder: (address: string, amount: number, phone?: string | null, customerName?: string | null) => Promise<{ error: string | null }>;
  updateOrder: (
    id: string,
    address: string,
    amount: number,
    phone?: string | null,
    customerName?: string | null
  ) => Promise<{ error: string | null }>;
  deleteOrder: (id: string) => Promise<{ error: string | null }>;
  setOrderType: (id: string, type: PaymentType | null) => Promise<{ error: string | null }>;
}

async function fetchOrdersForSession(sessionId: string): Promise<UiOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, address, amount, payment_type, phone, customer_name, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Errore caricamento ordini', error);
    return [];
  }
  return (data || []).map((o) => ({
    id: o.id,
    address: o.address,
    amount: Number(o.amount),
    type: o.payment_type as PaymentType | null,
    phone: o.phone ?? null,
    customerName: o.customer_name ?? null,
    ts: new Date(o.created_at).getTime(),
  }));
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  sessionActive: false,
  currentSessionId: null,
  orders: [],
  hydrated: false,

  hydrate: async () => {
    const storedId = await AsyncStorage.getItem(SESSION_ID_KEY);
    if (!storedId) {
      set({ sessionActive: false, currentSessionId: null, orders: [], hydrated: true });
      return;
    }
    const { data, error } = await supabase
      .from('work_sessions')
      .select('id, closed_at')
      .eq('id', storedId)
      .maybeSingle();
    if (error || !data || data.closed_at) {
      // La sessione salvata non esiste più o è già stata chiusa altrove.
      await AsyncStorage.removeItem(SESSION_ID_KEY);
      set({ sessionActive: false, currentSessionId: null, orders: [], hydrated: true });
      return;
    }
    const orders = await fetchOrdersForSession(storedId);
    set({ sessionActive: true, currentSessionId: storedId, orders, hydrated: true });
  },

  startSession: async () => {
    const auth = useAuthStore.getState();
    if (!auth.session || !auth.session.businessId) {
      return { error: 'Il tuo account non è ancora collegato a un business.' };
    }
    const { data, error } = await supabase
      .from('work_sessions')
      .insert({ business_id: auth.session.businessId, rider_id: auth.session.id })
      .select('id')
      .single();
    if (error) return { error: error.message };
    await AsyncStorage.setItem(SESSION_ID_KEY, data.id);
    set({ sessionActive: true, currentSessionId: data.id, orders: [] });
    await auth.setRiderActive(true);
    return { error: null };
  },

  endSession: async () => {
    const { currentSessionId } = get();
    if (currentSessionId) {
      const { error } = await supabase
        .from('work_sessions')
        .update({ closed_at: new Date().toISOString() })
        .eq('id', currentSessionId);
      if (error) return { error: error.message };
    }
    await AsyncStorage.removeItem(SESSION_ID_KEY);
    set({ sessionActive: false, currentSessionId: null, orders: [] });
    await useAuthStore.getState().setRiderActive(false);
    return { error: null };
  },

  addOrder: async (address, amount, phone, customerName) => {
    const auth = useAuthStore.getState();
    const { currentSessionId } = get();
    if (!currentSessionId || !auth.session) return { error: 'Nessuna sessione attiva.' };
    const { data, error } = await supabase
      .from('orders')
      .insert({
        session_id: currentSessionId,
        business_id: auth.session.businessId,
        rider_id: auth.session.id,
        address,
        amount,
        phone: phone || null,
        customer_name: customerName || null,
      })
      .select('id, created_at')
      .single();
    if (error) return { error: error.message };
    const newOrder: UiOrder = {
      id: data.id,
      address,
      amount,
      type: null,
      phone: phone || null,
      customerName: customerName || null,
      ts: new Date(data.created_at).getTime(),
    };
    set({ orders: [...get().orders, newOrder] });
    return { error: null };
  },

  updateOrder: async (id, address, amount, phone, customerName) => {
    const { error } = await supabase
      .from('orders')
      .update({ address, amount, phone: phone || null, customer_name: customerName || null })
      .eq('id', id);
    if (error) return { error: error.message };
    set({
      orders: get().orders.map((o) =>
        o.id === id ? { ...o, address, amount, phone: phone || null, customerName: customerName || null } : o
      ),
    });
    return { error: null };
  },

  deleteOrder: async (id) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return { error: error.message };
    set({ orders: get().orders.filter((o) => o.id !== id) });
    return { error: null };
  },

  setOrderType: async (id, type) => {
    const { error } = await supabase.from('orders').update({ payment_type: type }).eq('id', id);
    if (error) return { error: error.message };
    set({ orders: get().orders.map((o) => (o.id === id ? { ...o, type } : o)) });
    return { error: null };
  },
}));
