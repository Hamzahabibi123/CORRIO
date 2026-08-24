import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Stesso progetto Supabase usato dall'app web (CHORRIO_APP/pizza-orders-app.html).
// Backend non modificato: stessa URL, stessa publishable key, stesse tabelle/RLS/RPC.
const SUPABASE_URL = 'https://onmfdawvnwoccgkgtwla.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nN4u1F41LUpIHWPfiSVyQQ_7FpGSQCF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
