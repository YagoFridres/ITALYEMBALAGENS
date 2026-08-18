const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'t', perfil:'admin' }, secret, { expiresIn:'2h' });

const OFS_IDS = [
  'c4db942d-7024-401a-a330-56a7faed344a',
  'afea1a07-acb8-4967-8a1e-fa16ecc8da1b',
  'c5478e8b-c98c-40de-98de-65477363bc26',
  '0a49f941-426a-4f35-ab81-118ad57423b4',
  '3100fdd2-6d75-49c5-a3ce-18fe3a58e0f0',
  'b2886f39-c729-4592-ba55-3a7cc37713c3',
  '15ce6411-1e9a-40cf-80af-c5e6ebda1247',
  'c2f83ddc-1b71-45c3-86f5-163638bde440',
];
const CLIENTES_IDS = [
  'cef7e8c5-e6d2-49a8-984b-8c44a687e278',
  '3f11ccd8-00b2-4eda-b1fd-c8b660367a50',
];

function get(p) {
  return new Promise((resolve) => {
    const opts = {
      host:'adm.italyembalagens.com.br', path: p, method:'GET',
      headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/json' },
      timeout: 60000,
    };
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(b); } catch(_) { parsed = { raw: b.slice(0,2000) }; }
        resolve({ status: res.statusCode, body: parsed, raw: b.slice(0,3000) });
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', e => resolve({ netErr: String(e?.message||e) }));
    req.end();
  });
}

async function main(){
  const out = {
    modo: 'PREVIEW-SELECT-SEM-ALTERACOES-DEPLOY-ATUAL-77c4ed3',
    gerado_em: new Date().toISOString(),
  };
  const SEED = Date.now();

  // 1) 8 OFs individais (GET /api/ofs/:id)
  out.oofs_alvo_8 = { tentativas: 0, encontrados: 0, nao_encontrados: [], registros: [] };
  for (const id of OFS_IDS) {
    out.oofs_alvo_8.tentativas += 1;
    const r = await get('/api/ofs/' + encodeURIComponent(id) + '?seed=' + SEED);
    if (r.status === 200 && r.body?.id) {
      const o = r.body;
      out.oofs_alvo_8.registros.push({
        id: o.id,
        numero: o.numero || o.of || null,
        seq: o.seq || null,
        emp_id: o.emp_id || null,
        empresa_id: o.empresa_id || null,
        cli_id: o.cli_id || o.cliId || o.cliente_id || null,
        nome_cliente_of: o.clinome || o.cliNome || o.cliente_nome || o.cliente || null,
        descricao: (o.descricao || o.produto || '').slice(0,120),
        produto: (o.produto || '').slice(0,120),
        created_at: (o.created_at || '').slice(0,19),
        deleted_at: o.deleted_at || null,
      });
      out.oofs_alvo_8.encontrados += 1;
    } else {
      out.oofs_alvo_8.nao_encontrados.push({ id, status: r.status, http_body_preview: (r.raw||'').slice(0,200) });
    }
  }

  // 2) 2 clientes: buscar por query + filtrar por ID
  out.clientes_alvo_2 = { encontrados: 0, registros: [], ids_buscados: CLIENTES_IDS };
  const rClis = await get('/api/clientes?q=' + encodeURIComponent('NOME REAL AQUI') + '&order=cln_' + SEED);
  try {
    const arr = Array.isArray(rClis.body?.data) ? rClis.body.data : (Array.isArray(rClis.body) ? rClis.body : []);
    const filtrados = arr.filter(c => CLIENTES_IDS.includes(String(c?.id || '')));
    out.clientes_alvo_2.registros = filtrados.map(c => ({
      id: c.id,
      nome: c.nome || null,
      rs: c.rs || c.razao_social || null,
      codigo: c.codigo || null,
      empresa_id: c.empresa_id || null,
      created_at: (c.created_at || '').slice(0,19),
      deleted_at: c.deleted_at || null,
      total_ofs_listagem: c.total_ofs || c.total_ofs_listagem || null,
    }));
    out.clientes_alvo_2.encontrados = filtrados.length;
  } catch(e) { out.clientes_alvo_2.erro = e.message; }

  // 3) Empresas (todas)
  out.empresas_todas = { qtd: 0, registros: [], uuid_italy: null, uuid_cartoeste: null, uuid_oestepack: null };
  const rEmp = await get('/api/empresas?_=' + SEED);
  try {
    const arr = Array.isArray(rEmp.body?.data) ? rEmp.body.data : (Array.isArray(rEmp.body) ? rEmp.body : []);
    out.empresas_todas.registros = arr.map(e => ({
      id: e.id, nome: e.nome||e.apelido||null, emp_id: e.emp_id||e.codigo_legado||e.codigo||null,
      apelido: e.apelido||null, created_at: (e.created_at||'').slice(0,19),
    }));
    out.empresas_todas.qtd = out.empresas_todas.registros.length;
    const busca = (re) => (out.empresas_todas.registros.find(e => re.test(String(e.nome||'').toUpperCase() + '|' + String(e.emp_id||'').toUpperCase() + '|' + String(e.apelido||'').toUpperCase())) || {}).id || null;
    out.empresas_todas.uuid_italy     = busca(/ITALY|^E1$/);
    out.empresas_todas.uuid_cartoeste = busca(/CARTOESTE|^E2$/);
    out.empresas_todas.uuid_oestepack = busca(/OESTEPACK|^E3$/);
  } catch(e) { out.empresas_todas.erro = e.message; }

  // 4) Cores impressao (SEM filtro → retorna tudo) + filtrar "Sem Impressão"
  out.cores_sem_impressao_existentes = { qtd: 0, registros: [] };
  const rCor = await get('/api/cores-impressao?_=' + SEED);
  try {
    const arr = Array.isArray(rCor.body?.data) ? rCor.body.data : (Array.isArray(rCor.body) ? rCor.body : []);
    const filt = arr.filter(c => /sem\s*impress/i.test(String(c?.nome || '')));
    out.cores_sem_impressao_existentes.registros = filt.map(c => ({
      id: c.id, nome: c.nome, empresa_id: c.empresa_id || null,
      codigo: c.codigo||null, hex: c.hex||null, ativo: c.ativo ?? null, ordem: c.ordem ?? null,
    }));
    out.cores_sem_impressao_existentes.qtd = filt.length;
    const mapa = {};
    for (const c of filt) { mapa[String(c.empresa_id||'GLOBAL')] = c; }
    out.cores_sem_impressao_por_empresa = {
      italy_tem: !!mapa[out.empresas_todas.uuid_italy || ''],
      cartoeste_tem: !!mapa[out.empresas_todas.uuid_cartoeste || ''],
      oestepack_tem: !!mapa[out.empresas_todas.uuid_oestepack || ''],
    };
  } catch(e) { out.cores_sem_impressao_existentes.erro = e.message; }

  const fp = path.join(__dirname, '_PREVIEW_LIMPEZA_SEM_ALTERACOES.json');
  fs.writeFileSync(fp, JSON.stringify(out, null, 2));
  process.exit(0);
}

main().catch(e => { try { fs.writeFileSync(path.join(__dirname,'_PREVIEW_ERR.json'), JSON.stringify({err:String(e?.message||e)},null,2)); } catch(_){} process.exit(1); });
