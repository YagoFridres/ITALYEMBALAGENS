const { supabaseForUser } = require('../db/supabase');

function sb(req) {
  return supabaseForUser(req.accessToken);
}

async function list(req, res) {
  try {
    const { status, maquina_id, empresa_id, cliente_id, urgente, de, ate } = req.query || {};
    let q = sb(req)
      .from('ofs')
      .select('*, clientes(id,codigo,nome), maquinas(id,nome), fluxos(id,nome)')
      .order('data_producao', { ascending: true })
      .order('prioridade', { ascending: false })
      .order('created_at', { ascending: false });

    if (status) q = q.eq('status', status);
    if (maquina_id) q = q.eq('maquina_id', maquina_id);
    if (empresa_id) q = q.eq('empresa_id', empresa_id);
    if (cliente_id) q = q.eq('cliente_id', cliente_id);
    if (urgente === 'true') q = q.eq('urgente', true);
    if (urgente === 'false') q = q.eq('urgente', false);
    if (de) q = q.gte('data_producao', de);
    if (ate) q = q.lte('data_producao', ate);

    const { data, error } = await q;
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'ofs_list_failed' });
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await sb(req)
      .from('ofs')
      .select('*, clientes(id,codigo,nome), maquinas(id,nome), fluxos(id,nome)')
      .eq('id', id)
      .maybeSingle();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    if (!data) return res.status(404).json({ ok: false, error: 'not_found' });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'ofs_get_failed' });
  }
}

async function create(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.numero) return res.status(400).json({ ok: false, error: 'numero_required' });
    const { data, error } = await sb(req).from('ofs').insert(payload).select('*').single();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'ofs_create_failed' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const { data, error } = await sb(req).from('ofs').update(payload).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'ofs_update_failed' });
  }
}

async function cancel(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await sb(req).from('ofs').update({ status: 'Cancelada' }).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'ofs_cancel_failed' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const { error } = await sb(req).from('ofs').delete().eq('id', id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'ofs_delete_failed' });
  }
}

async function meta(req, res) {
  try {
    const [emp, cli, maq, flu] = await Promise.all([
      sb(req).from('empresas').select('*').order('nome', { ascending: true }),
      sb(req).from('clientes').select('id,codigo,nome,empresa_id,ativo').order('nome', { ascending: true }),
      sb(req).from('maquinas').select('*').order('nome', { ascending: true }),
      sb(req).from('fluxos').select('*').order('nome', { ascending: true }),
    ]);
    const errors = [emp.error, cli.error, maq.error, flu.error].filter(Boolean);
    if (errors.length) return res.status(400).json({ ok: false, error: errors[0].message });
    return res.json({
      ok: true,
      data: { empresas: emp.data || [], clientes: cli.data || [], maquinas: maq.data || [], fluxos: flu.data || [] },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'ofs_meta_failed' });
  }
}

module.exports = { list, getOne, create, update, cancel, remove, meta };
