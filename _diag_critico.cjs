const https = require('https');
const fs = require('fs');

const BASE = 'https://adm.italyembalagens.com.br';
const jwt = require('jsonwebtoken');
let TOKEN = jwt.sign({ id: 't', perfil: 'admin', nome: 'Teste Admin', emp_id: 'E1', sigla: 'E1' }, 'italy_secret_2026', { expiresIn: '10h' });
console.log('[AUTH] Token length:', TOKEN.length);

function req(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + path);
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...extraHeaders
      }
    };
    const reqObj = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        let json = null;
        try { json = data ? JSON.parse(data) : null; } catch (_) { json = { raw: data.slice(0, 500) }; }
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, body: json, raw: data.slice(0, 1000) });
      });
    });
    reqObj.on('error', reject);
    if (body) reqObj.write(JSON.stringify(body));
    reqObj.end();
  });
}

const EMPRESA_UUID_RIPKE = 'df5f7672-798e-4a6e-9393-3d46ed2d0d1f';
const UUID_RIPKE = 'be617df1-441a-470b-b9f3-f681b8d0a9e6';

async function main() {
  const out = [];
  // 1) Health
  const h = await req('GET', '/api/health');
  out.push({ t: 'HEALTH', s: h.status, b: h.body });

  // 2) Versão deploy
  const i = await req('GET', '/');
  const re = /patch\.js\?v=(\d+)/;
  const m = i.raw.match(re);
  out.push({ t: 'VERSION', patch_v: m ? m[1] : null, html_len: i.raw.length });

  // 3) Próximo número (endpoint dedicado)
  const pn = await req('GET', '/api/ofs/proximo-numero?empId=' + EMPRESA_UUID_RIPKE);
  out.push({ t: 'PROX_NUM_DEDICADO', s: pn.status, b: pn.body });

  // 4) Top 10 OFs por número decrescente (ver se tem 100k+ com deleted_at=null)
  const ofs = await req('GET', '/api/ofs?limit=20&order=numero.desc&empId=' + EMPRESA_UUID_RIPKE);
  const top = (ofs.body?.ok && Array.isArray(ofs.body.ofs) ? ofs.body.ofs : ofs.body?.data || []).slice(0, 15);
  out.push({
    t: 'TOP10_OFS',
    s: ofs.status,
    qtd: top.length,
    ofs: top.map(o => ({
      id: o.id?.slice(0, 12) + '...',
      numero: o.numero || o.of,
      deleted_at: o.deleted_at ? 'SIM=' + String(o.deleted_at).slice(0,16) : 'NÃO',
      empresa_id: (o.empresa_id || '').slice(0, 10) + (o.empresa_id ? '...' : ''),
      emp_id: o.emp_id,
      cli_id: (o.cli_id || '').slice(0, 10) + (o.cli_id ? '...' : ''),
      clinome: String(o.clinome || '').slice(0, 30),
      created_at: String(o.created_at || '').slice(0, 16)
    }))
  });

  // 5) Buscar cliente RIPKE via GET /api/clientes (confirmar que ele existe)
  const c1 = await req('GET', '/api/clientes?limit=1&search=MOVEIS%20RIPKE&empId=' + EMPRESA_UUID_RIPKE);
  out.push({
    t: 'CLIENTES_SEARCH_RIPKE',
    s: c1.status,
    qtd: c1.body?.ok && Array.isArray(c1.body.data) ? c1.body.data.length : (Array.isArray(c1.body) ? c1.body.length : '?'),
    primeiro: (c1.body?.ok && Array.isArray(c1.body.data) ? c1.body.data[0] : (Array.isArray(c1.body) ? c1.body[0] : null)) ? {
      id: (c1.body.data?.[0]?.id || c1.body?.[0]?.id || '').slice(0, 15) + '...',
      nome: c1.body.data?.[0]?.nome || c1.body?.[0]?.nome,
      codigo: c1.body.data?.[0]?.codigo || c1.body?.[0]?.codigo,
      emp_id: c1.body.data?.[0]?.emp_id || c1.body?.[0]?.emp_id,
      empresa_id: (c1.body.data?.[0]?.empresa_id || c1.body?.[0]?.empresa_id || '').slice(0, 15) + '...'
    } : null
  });

  // 6) TESTE BASLINE UUID direto (deve passar 200)
  const ofBase = {
    clinome: 'MOVEIS RIPKE',
    descricao: 'ZZZ_TESTE_APAGAR_BASELINE_CORRECAO',
    qtd: 10,
    ent: '2026-12-31',
    preco: 50,
    vendedor: 'VENDEDOR PADRAO',
    vendedor_id: '00000000-0000-0000-0000-000000000001',
    empresa_id: EMPRESA_UUID_RIPKE,
    cli_id: UUID_RIPKE,
    itens: '[]'
  };
  const rBase = await req('POST', '/api/ofs', ofBase);
  out.push({
    t: 'BASELINE_UUID',
    s: rBase.status,
    ok: rBase.body?.ok,
    of_id: rBase.body?.data?.id || rBase.body?.id,
    numero: rBase.body?.data?.numero || rBase.body?.numero,
    err: rBase.body?.error || null
  });
  // Soft-delete imediato
  if (rBase.body?.data?.id || rBase.body?.id) {
    const did = rBase.body.data?.id || rBase.body.id;
    const d = await req('DELETE', '/api/ofs/' + did);
    out.push({ t: 'DEL_BASELINE', s: d.status, ok: d.body?.ok, deleted_at: d.body?.data?.deleted_at ? 'SETADO' : 'NÃO' });
  }

  // 7) TESTE EXATO_BANCO "MOVEIS RIPKE" (nome igual banco)
  const ofExato = { ...ofBase, cli_id: 'MOVEIS RIPKE', descricao: 'ZZZ_TESTE_APAGAR_EXATO_NOME' };
  delete ofExato.clinome;
  const rExato = await req('POST', '/api/ofs', ofExato);
  out.push({
    t: 'EXATO_NOME',
    s: rExato.status,
    ok: rExato.body?.ok,
    of_id: rExato.body?.data?.id || rExato.body?.id,
    numero: rExato.body?.data?.numero || rExato.body?.numero,
    err: rExato.body?.error || null,
    ref: rExato.body?.ref || null
  });
  if (rExato.body?.data?.id || rExato.body?.id) {
    const did = rExato.body.data?.id || rExato.body.id;
    const d = await req('DELETE', '/api/ofs/' + did);
    out.push({ t: 'DEL_EXATO', s: d.status, ok: d.body?.ok, deleted_at: d.body?.data?.deleted_at ? 'SETADO' : 'NÃO' });
  }

  // 8) Próximo número NOVAMENTE depois de deletar
  const pn2 = await req('GET', '/api/ofs/proximo-numero?empId=' + EMPRESA_UUID_RIPKE);
  out.push({ t: 'PROX_NUM_DEPOIS', s: pn2.status, b: pn2.body });

  // 9) Verificar OFs com ZZZ_TESTE ou numero>=100000
  const fZ = await req('GET', '/api/ofs?limit=50&search=ZZZ_TESTE&empId=' + EMPRESA_UUID_RIPKE);
  const zzzRows = (fZ.body?.ok && Array.isArray(fZ.body.ofs) ? fZ.body.ofs : fZ.body?.data || []).filter(o =>
    (o.numero && parseInt(String(o.numero).replace(/\D/g, '')) >= 100000) ||
    String(o.clinome || o.descricao || '').includes('ZZZ_TESTE')
  );
  out.push({
    t: 'OFS_ZZZ_OU_100K',
    qtd: zzzRows.length,
    ofs: zzzRows.map(o => ({
      id: o.id,
      numero: o.numero || o.of,
      deleted_at: o.deleted_at ? 'SIM' : 'NÃO',
      clinome: String(o.clinome || '').slice(0, 30),
      desc: String(o.descricao || '').slice(0, 40)
    }))
  });

  console.log(JSON.stringify(out, null, 2));
  fs.writeFileSync('_DIAG_CRITICO.json', JSON.stringify(out, null, 2));
}

main().catch(e => { console.error('ERR:', e); process.exit(1); });
