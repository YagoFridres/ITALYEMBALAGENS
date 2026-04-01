const { supabaseForUser } = require('../db/supabase');

function sb(req) {
  return supabaseForUser(req.accessToken);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function list(req, res) {
  try {
    const { maquina_id, dia } = req.query || {};
    const day = dia || todayISO();
    const start = `${day}T00:00:00.000Z`;
    const end = `${day}T23:59:59.999Z`;

    let q = sb(req)
      .from('apontamentos')
      .select('*, ofs(id,numero,descricao,status,data_producao,urgente,quantidade), maquinas(id,nome)')
      .gte('inicio', start)
      .lte('inicio', end)
      .order('inicio', { ascending: false });

    if (maquina_id) q = q.eq('maquina_id', maquina_id);

    const { data, error } = await q;
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'apont_list_failed' });
  }
}

async function ativos(req, res) {
  try {
    const { data, error } = await sb(req)
      .from('apontamentos')
      .select('*, ofs(id,numero,descricao,status,data_producao,urgente), maquinas(id,nome)')
      .eq('status', 'em_andamento')
      .order('inicio', { ascending: false });
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'apont_ativos_failed' });
  }
}

async function start(req, res) {
  try {
    const { of_id, maquina_id, operador, obs } = req.body || {};
    if (!of_id || !maquina_id) return res.status(400).json({ ok: false, error: 'of_maquina_required' });

    const { data: ongoing, error: e1 } = await sb(req)
      .from('apontamentos')
      .select('id')
      .eq('maquina_id', maquina_id)
      .eq('status', 'em_andamento')
      .limit(1);
    if (e1) return res.status(400).json({ ok: false, error: e1.message });
    if (ongoing && ongoing.length) return res.status(409).json({ ok: false, error: 'maquina_ocupada' });

    const { data, error } = await sb(req)
      .from('apontamentos')
      .insert({ of_id, maquina_id, operador: operador || null, status: 'em_andamento', obs: obs || null })
      .select('*')
      .single();
    if (error) return res.status(400).json({ ok: false, error: error.message });

    await sb(req).from('ofs').update({ status: 'Em produção' }).eq('id', of_id);

    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'apont_start_failed' });
  }
}

async function finish(req, res) {
  try {
    const { id } = req.params;
    const { quantidade_produzida, obs } = req.body || {};
    const qp = Number(quantidade_produzida || 0);
    if (!Number.isFinite(qp) || qp < 0) return res.status(400).json({ ok: false, error: 'quantidade_invalida' });

    const { data: cur, error: e1 } = await sb(req).from('apontamentos').select('id,of_id,status').eq('id', id).single();
    if (e1) return res.status(400).json({ ok: false, error: e1.message });
    if (cur.status !== 'em_andamento') return res.status(409).json({ ok: false, error: 'not_running' });

    const { data, error } = await sb(req)
      .from('apontamentos')
      .update({ status: 'finalizado', fim: new Date().toISOString(), quantidade_produzida: qp, obs: obs || null })
      .eq('id', id)
      .select('*')
      .single();
    if (error) return res.status(400).json({ ok: false, error: error.message });

    await sb(req).from('ofs').update({ status: 'Concluída' }).eq('id', cur.of_id);

    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'apont_finish_failed' });
  }
}

module.exports = { list, ativos, start, finish };
