const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'test-cli-0001', perfil:'admin', email:'test@italy.com' }, secret, { expiresIn:'1h' });

const HOST = 'https://adm.italyembalagens.com.br';
const headers = { 'Authorization':'Bearer '+token, 'Content-Type':'application/json' };

const clientes = [
  { nome:'MOVEIS RIPKE', id:'be617df1-441a-4f11-918e-d813a5ac854c', esperado_listagem:422 },
  { nome:'MOVEIS RUIZ', id:'da2798c7-bf61-434f-bf3f-fbfd0877599d', esperado_listagem:275 },
  { nome:'ROTOPLAST 1969f4f4', id:'1969f4f4-7095-44c8-9de3-7d28b2243687', esperado_listagem:0 },
  { nome:'ROTOPLAST 74ce7e67', id:'74ce7e67-f1fc-474f-80fa-8302b43854ee', esperado_listagem:28 },
  { nome:'DKADI', id:'99c17e9d-336d-4e93-9b74-102433c95a17', esperado_listagem:23 },
];

async function runPainel(c) {
  const t0 = Date.now();
  const url = HOST + '/api/clientes/' + c.id + '/painel';
  try {
    const r = await fetch(url, { headers });
    if (!r.ok) return { nome:c.nome, id:c.id, error:'HTTP '+r.status, tempo_ms:Date.now()-t0 };
    const d = await r.json();
    let total = Number(d?.total_ofs || 0);
    if (!total && Array.isArray(d?.todas)) total = d.todas.length;
    if (!total && Array.isArray(d)) total = d.length;
    return { nome:c.nome, id:c.id, total_ofs_painel:total, esperado:c.esperado_listagem, match: total===c.esperado_listagem, tempo_ms:Date.now()-t0 };
  } catch(e) { return { nome:c.nome, id:c.id, error:String(e?.message||e), tempo_ms:Date.now()-t0 }; }
}

async function main(){
  const res = [];
  for (const c of clientes) {
    const r = await runPainel(c);
    res.push(r);
    console.log('[PAINEL]', c.nome, r.error?('ERRO: '+r.error):('total='+r.total_ofs_painel+' esperado='+c.esperado_listagem+' -> '+(r.match?'OK':'DIFF')), r.tempo_ms+'ms');
  }
  const final = { todos_passaram: res.every(r=>r.match && !r.error), resultados: res };
  fs.writeFileSync(path.join(__dirname,'_tmp_paineis.json'), JSON.stringify(final,null,2));
}
main().catch(e=>{ console.error(e?.message||e); process.exit(1); });
