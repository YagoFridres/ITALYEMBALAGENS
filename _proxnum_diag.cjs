const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const BASE = 'https://adm.italyembalagens.com.br';
const TOKEN = jwt.sign({ id: 't', perfil: 'admin' }, 'italy_secret_2026', { expiresIn: '10h' });
const OUT = '_DIAG_PROXNUM.jsonl';
fs.writeFileSync(OUT, '');
function L(o){ fs.appendFileSync(OUT, JSON.stringify(o)+'\n'); process.stdout.write(JSON.stringify(o).slice(0,500)+'\n'); }

function req(method, path, body=null) {
  return new Promise(resolve => {
    try {
      const u = new URL(BASE+path);
      const opts = { method, hostname:u.hostname, port:443, path:u.pathname+u.search, timeout:30000,
        headers:{ 'Authorization':'Bearer '+TOKEN, 'Content-Type':'application/json','Accept':'application/json' }};
      const r = https.request(opts, res=>{ let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ let j=null; try{j=d?JSON.parse(d):null}catch(_){j={_raw:d.slice(0,500)}}; resolve({s:res.statusCode,j,raw0:d.slice(0,500)}); }); });
      r.on('timeout',()=>{r.destroy(); resolve({s:-1,j:null,err:'timeout'});});
      r.on('error',e=>resolve({s:0,j:null,err:String(e.message||e)}));
      if(body) r.write(JSON.stringify(body)); r.end();
    } catch(e){ resolve({s:-2,j:null,err:String(e.message||e)}); }
  });
}

(async()=>{
  L({t:'START'});
  // 1) Empresas
  const emps = await req('GET','/api/empresas');
  const lista = (emps.j?.ok && Array.isArray(emps.j.data)) ? emps.j.data : [];
  L({t:'EMPS', qtd: lista.length, data: lista.map(e=>({id:e.id.slice(0,20)+'...', sigla:e.sigla, codigo:e.codigo, nome:e.nome}))});

  // 2) proximo-numero para CADA empresa
  for (const e of lista) {
    const r = await req('GET','/api/ofs/proximo-numero?empId=' + e.id);
    L({t:'PROXN_EMP', sigla:e.sigla, cod:e.codigo, resp:r.j, s:r.s});
  }
  // 3) proximo-numero SEM empId (query params vazio)
  const rNenhum = await req('GET','/api/ofs/proximo-numero');
  L({t:'PROXN_SEM_EMP', resp:rNenhum.j, s:rNenhum.s});

  // 4) Listar OFs SEM filtro empresa (ou filtro is null) com deleted_at=null order numero desc limit 30
  //    O endpoint /api/ofs aceita ?empId=xxx. Não passar nada para ver todas, ou talvez precise de outro parametro.
  //    Tentar primeiro sem parametro nenhum (ou _all=1)
  for (const path of [
    '/api/ofs?limit=30&order=numero.desc',
    '/api/ofs?limit=30&order=created_at.desc&empId=',
    '/api/ofs?limit=30&order=numero.desc&_tudo=1'
  ]) {
    const r = await req('GET', path);
    let rows = [];
    if (r.j?.ok) rows = Array.isArray(r.j.ofs) ? r.j.ofs : (Array.isArray(r.j.data) ? r.j.data : []);
    const top = rows.slice(0,15).map(o=>({n:o.numero||o.of, del:o.deleted_at?'S':'N', emp_id:o.emp_id, eid:(o.empresa_id||'').slice(0,15), c:String(o.clinome||'').slice(0,25), d:String(o.descricao||'').slice(0,40)}));
    L({t:'OFS', path, qtd: rows.length, top15: top, respStatus: r.s});
    // Se já temos rows com numero alto, não precisa tentar os outros paths
    if (rows.some(o => parseInt(String(o.numero||o.of||'0').replace(/\D/g,''))>=100000)) break;
  }

  L({t:'FIM'});
  process.exit(0);
})().catch(e=>{L({err:String(e)});process.exit(1);});
