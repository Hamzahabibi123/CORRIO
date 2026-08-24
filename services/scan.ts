import { supabase } from './supabase';

// Chiama la Edge Function Supabase "scan-order": riceve una foto del foglio
// ordine (base64 JPEG) e restituisce {customerName, address, phone, amount}
// letti automaticamente tramite un modello di visione (OpenAI o Anthropic,
// a seconda di quale chiave è configurata nelle Secrets della Edge Function
// su Supabase). Se non è configurata nessuna chiave, la funzione risponde con
// {error:'ocr_not_configured'} e l'app propone la compilazione manuale.
export interface ScanResult {
  customerName: string;
  address: string;
  phone: string;
  amount: number;
}

export type ScanOutcome =
  | { ok: true; data: ScanResult }
  | { ok: false; reason: 'not_configured' | 'error'; message: string };

export async function scanOrderImage(base64: string): Promise<ScanOutcome> {
  try {
    const { data, error } = await supabase.functions.invoke('scan-order', {
      body: { image: base64 },
    });
    if (error) {
      return { ok: false, reason: 'error', message: error.message };
    }
    if (data?.error === 'ocr_not_configured') {
      return { ok: false, reason: 'not_configured', message: data.message || 'OCR non configurato.' };
    }
    if (data?.error) {
      return { ok: false, reason: 'error', message: data.message || data.error };
    }
    const customerName = typeof data?.customer_name === 'string' ? data.customer_name.trim() : '';
    const address = typeof data?.address === 'string' ? data.address.trim() : '';
    const phone = typeof data?.phone === 'string' ? data.phone.trim() : '';
    const amount = typeof data?.amount === 'number' ? data.amount : parseFloat(data?.amount) || 0;
    return { ok: true, data: { customerName, address, phone, amount } };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}
