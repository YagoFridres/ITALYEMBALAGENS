const { supabaseAdmin } = require('../db/supabase');

function safeError(e) {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e.message) return e.message;
  return JSON.stringify(e);
}

async function getAll(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, data: data || [] });
  } catch (e) {
    return res.status(500).json({ error: safeError(e) });
  }
}

async function getOne(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .limit(1);
    if (error) return res.status(400).json({ error: error.message });
    const row = data && data[0] ? data[0] : null;
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true, data: row });
  } catch (e) {
    return res.status(500).json({ error: safeError(e) });
  }
}

async function create(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, description, status } = req.body || {};
    const t = String(title || '').trim();
    if (!t) return res.status(400).json({ error: 'Title is required' });
    const payload = {
      user_id: userId,
      title: t,
      description: description ? String(description) : null,
      status: status ? String(status) : 'active',
    };
    const { data, error } = await supabaseAdmin.from('items').insert([payload]).select('*').limit(1);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, data: (data && data[0]) || null });
  } catch (e) {
    return res.status(500).json({ error: safeError(e) });
  }
}

async function update(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const { title, description, status } = req.body || {};
    const payload = {};
    if (title !== undefined) {
      const t = String(title || '').trim();
      if (!t) return res.status(400).json({ error: 'Title is required' });
      payload.title = t;
    }
    if (description !== undefined) payload.description = description ? String(description) : null;
    if (status !== undefined) payload.status = status ? String(status) : 'active';

    const { data, error } = await supabaseAdmin
      .from('items')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .limit(1);
    if (error) return res.status(400).json({ error: error.message });
    const row = data && data[0] ? data[0] : null;
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true, data: row });
  } catch (e) {
    return res.status(500).json({ error: safeError(e) });
  }
}

async function remove(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const { error } = await supabaseAdmin.from('items').delete().eq('id', id).eq('user_id', userId);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: safeError(e) });
  }
}

module.exports = { getAll, getOne, create, update, remove };
