const { supabaseForUser } = require('../db/supabase');

function sb(req) {
  return supabaseForUser(req.accessToken);
}

async function list(req, res) {
  try {
    const { search, tipo, empresa_id } = req.query || {};
    let q = sb(req).from('estoque').select('*').order('descricao', { ascending: true });
    if (tipo) q = q.eq('tipo', tipo);
    if (empresa_id) q = q.eq('empresa_id', empresa_id);

    if (search && String(search).trim()) {
      const s = String(search).trim().replace(/%/g, '');
      const like = `%${s}%`;
      q = q.or([`codigo.ilike.${like}`, `descricao.ilike.${like}`, `tipo.ilike.${like}`].join(','));
    }

    const { data, error } = await q;
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'estoque_list_failed' });
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await sb(req).from('estoque').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    if (!data) return res.status(404).json({ ok: false, error: 'not_found' });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'estoque_get_failed' });
  }
}

async function create(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.codigo || !payload.descricao) {
      return res.status(400).json({ ok: false, error: 'codigo_descricao_required' });
    }
    const { data, error } = await sb(req).from('estoque').insert(payload).select('*').single();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'estoque_create_failed' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const { data, error } = await sb(req).from('estoque').update(payload).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'estoque_update_failed' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const { error } = await sb(req).from('estoque').delete().eq('id', id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'estoque_delete_failed' });
  }
}

async function movimento(req, res) {
  try {
    const { id } = req.params;
    const { delta } = req.body || {};
    const d = Number(delta);
    if (!Number.isFinite(d) || d === 0) return res.status(400).json({ ok: false, error: 'delta_required' });

    const { data: cur, error: e1 } = await sb(req).from('estoque').select('id,quantidade').eq('id', id).single();
    if (e1) return res.status(400).json({ ok: false, error: e1.message });
    const nova = Number(cur.quantidade || 0) + d;

    const { data, error } = await sb(req).from('estoque').update({ quantidade: nova }).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'estoque_mov_failed' });
  }
}

module.exports = { list, getOne, create, update, remove, movimento };
