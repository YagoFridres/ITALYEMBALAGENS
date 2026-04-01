const { supabaseForUser } = require('../db/supabase');

function sb(req) {
  return supabaseForUser(req.accessToken);
}

async function list(req, res) {
  try {
    const { search, empresa_id, ativo } = req.query || {};
    let q = sb(req).from('clientes').select('*').order('created_at', { ascending: false });

    if (empresa_id) q = q.eq('empresa_id', empresa_id);
    if (ativo === 'true') q = q.eq('ativo', true);
    if (ativo === 'false') q = q.eq('ativo', false);

    if (search && String(search).trim()) {
      const s = String(search).trim().replace(/%/g, '');
      const like = `%${s}%`;
      q = q.or(
        [
          `codigo.ilike.${like}`,
          `nome.ilike.${like}`,
          `cidade.ilike.${like}`,
          `cnpj.ilike.${like}`,
          `representante.ilike.${like}`,
        ].join(',')
      );
    }

    const { data, error } = await q;
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'clientes_list_failed' });
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await sb(req).from('clientes').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    if (!data) return res.status(404).json({ ok: false, error: 'not_found' });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'clientes_get_failed' });
  }
}

async function create(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.codigo || !payload.nome) {
      return res.status(400).json({ ok: false, error: 'codigo_nome_required' });
    }
    const { data, error } = await sb(req).from('clientes').insert(payload).select('*').single();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'clientes_create_failed' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const { data, error } = await sb(req).from('clientes').update(payload).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'clientes_update_failed' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const { error } = await sb(req).from('clientes').delete().eq('id', id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'clientes_delete_failed' });
  }
}

module.exports = { list, getOne, create, update, remove };
