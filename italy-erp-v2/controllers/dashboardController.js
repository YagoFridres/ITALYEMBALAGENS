const { supabaseForUser } = require('../db/supabase');

function sb(req) {
  return supabaseForUser(req.accessToken);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function summary(req, res) {
  try {
    const today = todayISO();
    const start = `${today}T00:00:00.000Z`;
    const end = `${today}T23:59:59.999Z`;

    const [ofsResp, apResp, maqResp] = await Promise.all([
      sb(req).from('ofs').select('id,status,data_entrega,urgente,updated_at,maquina_id,numero,descricao').limit(5000),
      sb(req)
        .from('apontamentos')
        .select('id,maquina_id,status,quantidade_produzida,inicio,fim,ofs(id,numero),maquinas(id,nome)')
        .gte('inicio', start)
        .lte('inicio', end)
        .limit(5000),
      sb(req).from('maquinas').select('id,nome').order('nome', { ascending: true }),
    ]);

    if (ofsResp.error) return res.status(400).json({ ok: false, error: ofsResp.error.message });
    if (apResp.error) return res.status(400).json({ ok: false, error: apResp.error.message });
    if (maqResp.error) return res.status(400).json({ ok: false, error: maqResp.error.message });

    const ofs = ofsResp.data || [];
    const apont = apResp.data || [];
    const maquinas = maqResp.data || [];

    const emAberto = ofs.filter((o) => (o.status || 'Em aberto') === 'Em aberto').length;
    const emProducao = ofs.filter((o) => o.status === 'Em produção').length;
    const atrasadas = ofs.filter((o) => {
      if (!o.data_entrega) return false;
      if (o.status === 'Concluída' || o.status === 'Cancelada') return false;
      return String(o.data_entrega) < today;
    }).length;
    const concluidasHoje = ofs.filter((o) => o.status === 'Concluída' && o.updated_at && String(o.updated_at).slice(0, 10) === today).length;
    const urgentes = ofs.filter((o) => o.urgente && o.status !== 'Concluída' && o.status !== 'Cancelada');

    const prodPorMaquina = new Map();
    for (const m of maquinas) prodPorMaquina.set(m.id, { maquina_id: m.id, nome: m.nome, qtd: 0, apontamentos: 0 });
    for (const a of apont) {
      if (a.status !== 'finalizado') continue;
      const row = prodPorMaquina.get(a.maquina_id) || { maquina_id: a.maquina_id, nome: a.maquinas?.nome || '—', qtd: 0, apontamentos: 0 };
      row.qtd += Number(a.quantidade_produzida || 0);
      row.apontamentos += 1;
      prodPorMaquina.set(a.maquina_id, row);
    }

    const ativos = (await sb(req)
      .from('apontamentos')
      .select('id,maquina_id,operador,inicio,status,ofs(id,numero,descricao),maquinas(id,nome)')
      .eq('status', 'em_andamento')
      .order('inicio', { ascending: false })).data;

    return res.json({
      ok: true,
      data: {
        cards: { emAberto, emProducao, atrasadas, concluidasHoje },
        urgentes,
        prodPorMaquina: Array.from(prodPorMaquina.values()),
        ativos: ativos || [],
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'dashboard_failed' });
  }
}

module.exports = { summary };
