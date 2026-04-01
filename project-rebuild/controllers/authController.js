const { supabasePublic, supabaseAdmin } = require('../db/supabase');

function safeError(e) {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e.message) return e.message;
  return JSON.stringify(e);
}

async function register(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const { data, error } = await supabasePublic.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ user: data.user, session: data.session });
  } catch (e) {
    return res.status(500).json({ error: safeError(e) });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    return res.json({ user: data.user, session: data.session });
  } catch (e) {
    return res.status(500).json({ error: safeError(e) });
  }
}

async function logout(req, res) {
  try {
    const hdr = req.headers.authorization || req.headers.Authorization || '';
    const m = String(hdr).match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1].trim() : '';

    if (token) {
      try {
        const { data } = await supabasePublic.auth.getUser(token);
        if (data && data.user && data.user.id) {
          if (supabaseAdmin && supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.signOut === 'function') {
            await supabaseAdmin.auth.admin.signOut(data.user.id);
          }
        }
      } catch (e) {}
    }

    try {
      await supabasePublic.auth.signOut();
    } catch (e) {}

    return res.json({ ok: true, message: 'Logged out' });
  } catch (e) {
    return res.status(500).json({ error: safeError(e) });
  }
}

module.exports = { register, login, logout };
