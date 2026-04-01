const { supabasePublic } = require('../db/supabase');

function extractBearerToken(req) {
  const hdr = req.headers.authorization || req.headers.Authorization || '';
  const m = String(hdr).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

async function authMiddleware(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabasePublic.auth.getUser(token);
    if (error) return res.status(401).json({ error: 'Unauthorized' });
    if (!data || !data.user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = data.user;
    req.token = token;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { authMiddleware };
