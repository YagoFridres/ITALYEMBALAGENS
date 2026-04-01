import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { APP_CONFIG } from '../config.js';

export function createSupabase() {
  const url = String(APP_CONFIG.supabaseUrl || '').trim();
  const key = String(APP_CONFIG.supabaseAnonKey || '').trim();
  if (!url || !key || url.includes('SEU_PROJETO') || key.includes('SUA_CHAVE')) {
    return { client: null, configured: false };
  }
  const client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return { client, configured: true };
}
