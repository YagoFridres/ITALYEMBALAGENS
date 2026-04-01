const { supabasePublic } = require('../db/supabase');

async function register(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: 'email_password_required' });

    const { data, error } = await supabasePublic.auth.signUp({ email, password });
    if (error) return res.status(400).json({ ok: false, error: error.message });

    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'register_failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: 'email_password_required' });

    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ ok: false, error: error.message });

    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'login_failed' });
  }
}

async function logout(req, res) {
  return res.json({ ok: true });
}

async function me(req, res) {
  return res.json({ ok: true, data: { user: req.user } });
}

module.exports = { register, login, logout, me };
