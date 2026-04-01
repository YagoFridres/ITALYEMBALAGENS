const { createClient } = require('@supabase/supabase-js');

function mustGetEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const supabaseUrl = mustGetEnv('SUPABASE_URL');
const supabaseAnonKey = mustGetEnv('SUPABASE_ANON_KEY');
const supabaseServiceKey = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function supabaseForUser(accessToken) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

module.exports = {
  supabaseAdmin,
  supabasePublic,
  supabaseForUser,
  supabaseUrl,
  supabaseAnonKey,
};
