const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'t', perfil:'admin' }, secret, { expiresIn:'2h' });

const UUID_ITALY = 'df5f7672-0a6b-402d-ae65-296554236c31';
const UUID_CLIENTE_NOME_REAL_AQUI = 'cef7e8c5-e6d2-49a8-984b-8c44a687e278';

function apiPost(pathStr, bodyObj) {
  return new Promise((resolve) => {
    const body = JSON.stringify(bodyObj || {});
    const opts = {
      host:'adm.italyembalagens.com.br', path: pathStr, method:'POST',
      headers:{
        'Authorization':'Bearer '+token,
        'Accept':'application/json',
        'Content-Type':'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 60000,
    };
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(b); } catch(_) { parsed = { raw: b.slice(0,1000) }; }
        resolve({ status: res.statusCode, body: parsed, raw: b.slice(0,2000) });
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', e => resolve({ netErr: String(e?.message||e) }));
    req.write(body);
    req.end();
  });
}

async function main(){
  const resultados = {};

  // CASO 1: Payload VAZIO (sem nada)
  resultados.caso1_payload_vazio = await apiPost('/api/ofs', {});

  // CASO 2: Dados mínimos + empresa mas SEM CLIENTE
  resultados.caso2_sem_cliente = await apiPost('/api/ofs', {
    empresa_id: UUID_ITALY,
    emp_id: 'E1',
    // sem cli_id, sem cliente
    vendedor_id: 'vendedor-teste',
    qtd: 100,
    produto: 'TESTE EMERG3',
    data_entrega: '2026-12-31',
    valor_unitario: 10.50,
  });

  // CASO 3: CLIENTE INVÁLIDO (UUID inexistente)
  resultados.caso3_cliente_invalido = await apiPost('/api/ofs', {
    empresa_id: UUID_ITALY,
    emp_id: 'E1',
    cli_id: '00000000-0000-0000-0000-000000000099',
    vendedor_id: 'vendedor-teste',
    qtd: 100,
    produto: 'TESTE EMERG3 CLIENTE RUIM',
    data_entrega: '2026-12-31',
    valor_unitario: 10.50,
  });

  // CASO 4: CLIENTE FANTASIA "NOME REAL AQUI" (existe no banco, ID real)
  resultados.caso4_cliente_nome_real_aqui = await apiPost('/api/ofs', {
    empresa_id: UUID_ITALY,
    emp_id: 'E1',
    cli_id: UUID_CLIENTE_NOME_REAL_AQUI,
    vendedor_id: 'vendedor-teste',
    qtd: 100,
    produto: 'TESTE EMERG3 CLIENTE FANTASIA',
    data_entrega: '2026-12-31',
    valor_unitario: 10.50,
  });

  // Extrai só os campos importantes para o relatório
  const clean = {};
  for (const k of Object.keys(resultados)) {
    const r = resultados[k];
    clean[k] = {
      status_http: r.status,
      netErr: r.netErr || null,
      ok: r.body?.ok ?? null,
      error: r.body?.error ?? null,
      missing: r.body?.missing ?? null,
      id_gerado: r.body?.id || r.body?.data?.id || null,
    };
  }

  const fp = path.join(__dirname, '_DIAG_EMERG3_CRIACAO_OF.json');
  fs.writeFileSync(fp, JSON.stringify({ raw: resultados, resumo: clean }, null, 2));
  process.exit(0);
}

main().catch(e => { try { fs.writeFileSync(path.join(__dirname,'_DIAG_EMERG3_ERR.json'), JSON.stringify({err:String(e?.message||e)},null,2)); } catch(_){} process.exit(1); });
