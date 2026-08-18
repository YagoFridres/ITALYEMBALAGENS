const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'t', perfil:'admin' }, secret, { expiresIn:'2h' });
const path = require('path');

function apiGet(pathStr) {
  return new Promise((resolve) => {
    const opts = {
      host:'adm.italyembalagens.com.br', path: pathStr, method:'GET',
      headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/json' },
      timeout: 60000,
    };
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: b.slice(0,200000) }); }
        catch(e) { resolve({ status:res.statusCode, body: b.slice(0,1000) }); }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', e => resolve({ netErr: String(e?.message||e) }));
    req.end();
  });
}

function listOfsInnerText(html) {
  const matches = [];
  const re = /<td[^>]*class="[^"]*cli[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const txt = m[1].replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim();
    if (txt && txt !== '—' && txt.length < 120) matches.push(txt);
  }
  return matches;
}

async function main(){
  const SEED = Date.now();
  const out = {};

  // 1) Busca cliente exato "NOME REAL AQUI"
  const r1 = await apiGet('/api/clientes?q=' + encodeURIComponent('NOME REAL AQUI') + '&order=seed1_' + SEED);
  out.busca_nome_real_aqui_status = r1.status;
  try {
    const d1 = JSON.parse(r1.body || '{}');
    const arr1 = Array.isArray(d1?.data) ? d1.data : (Array.isArray(d1) ? d1 : []);
    out.busca_nome_real_aqui_qtd = arr1.length;
    out.busca_nome_real_aqui_resultados = arr1.map(x => ({
      id: x?.id,
      nome: x?.nome,
      rs: x?.rs,
      razao_social: x?.razao_social,
      codigo: x?.codigo,
      empresa_id: x?.empresa_id,
      created_at: x?.created_at?.slice?.(0,19),
    }));
  } catch(e) { out.busca_nome_real_aqui_parseErr = e.message; out.busca_nome_real_aqui_body_snippet = (r1.body||'').slice(0,500); }

  // 2) Busca por ILIKE parcial
  const r2 = await apiGet('/api/clientes?q=' + encodeURIComponent('NOME REAL') + '&order=seed2_' + SEED);
  try {
    const d2 = JSON.parse(r2.body || '{}');
    const arr2 = Array.isArray(d2?.data) ? d2.data : (Array.isArray(d2) ? d2 : []);
    out.busca_nome_real_parcial_qtd = arr2.length;
    out.busca_nome_real_parcial_resultados = arr2.map(x => ({
      id: x?.id, nome: x?.nome, rs: x?.rs, codigo: x?.codigo,
    }));
  } catch(e) {}

  // 3) Busca em OFs (ultimas 50 OFs recentes por cliNome)
  const r3 = await apiGet('/api/ofs?limit=50&order=created_at&dir=desc&seed=' + SEED);
  out.ofs_recentes_status = r3.status;
  try {
    const d3 = JSON.parse(r3.body || '{}');
    const arr3 = Array.isArray(d3?.data) ? d3.data : (Array.isArray(d3) ? d3 : []);
    out.ofs_recentes_qtd = arr3.length;
    const suspeitos = arr3.filter(o => {
      const txt = String(o?.cliNome || o?.cliente_nome || o?.clinome || o?.cliente || '').toUpperCase();
      return txt.includes('NOME REAL AQUI') || txt.includes('NOME REAL');
    }).map(o => ({
      id: o?.id, numero: o?.numero||o?.of,
      cliId: o?.cliId||o?.cli_id||o?.cliente_id,
      cliNome: o?.cliNome, cliente_nome: o?.cliente_nome, clinome: o?.clinome,
      created_at: o?.created_at?.slice?.(0,19),
    }));
    out.ofs_suspeitos_qtd = suspeitos.length;
    out.ofs_suspeitos = suspeitos;
    // Tambem extrai nomes unicos de clientes presentes nas OFs
    const nomesUnicos = Array.from(new Set(arr3.map(o => String(o?.cliNome || o?.cliente_nome || o?.clinome || o?.cliente || '—').trim()).filter(Boolean))).slice(0, 60);
    out.ofs_nomes_clientes_unicos_primeiros60 = nomesUnicos;
  } catch(e) { out.ofs_recentes_parseErr = e.message; out.ofs_recentes_snippet = (r3.body||'').slice(0,500); }

  const fp = path.join(__dirname, '_DIAG_NOME_REAL_AQUI.json');
  fs.writeFileSync(fp, JSON.stringify(out, null, 2));
  process.exit(0);
}

main().catch(e => { try { fs.writeFileSync(path.join(__dirname,'_DIAG_NOME_REAL_AQUI_ERR.json'), JSON.stringify({err:String(e?.message||e)},null,2)); } catch(_){} process.exit(1); });
