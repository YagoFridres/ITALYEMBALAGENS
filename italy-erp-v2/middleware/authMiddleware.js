const { supabasePublic } = require('../db/supabase');

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const { data, error } = await supabasePublic.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ ok: false, error: 'unauthorized' });

    req.user = data.user;
    req.accessToken = token;
    return next();
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'auth_failed' });
  }
}

module.exports = { requireAuth };
