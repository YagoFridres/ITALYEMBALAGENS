const { createClient } = require('@supabase/supabase-js');

function mustGetEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`${name} is required`);
  }
  return String(v).trim();
}

const SUPABASE_URL = mustGetEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = mustGetEnv('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

module.exports = {
  supabasePublic,
  supabaseAdmin,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
};
