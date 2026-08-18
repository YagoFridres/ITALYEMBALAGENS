const https=require('https');const jwt=require('jsonwebtoken');const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'3h'});
const GET=(u,tm)=>new Promise(R=>{const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}};R({ms:Date.now()-t0,s:r.statusCode,j});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT'});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();});
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
(async()=>{
  console.log('JWT token length=', T.length);
  const rc = await GET('/api/clientes?limit=900&nocache='+Date.now(),60000);
  console.log('/api/clientes HTTP', rc.s, 'ms', rc.ms, 'typeof j:', typeof rc.j, 'keys:', Object.keys(rc.j||{}).slice(0,6).join(','));
  let arr = [];
  if(Array.isArray(rc.j?.data))arr=rc.j.data;
  else if(Array.isArray(rc.j))arr=rc.j;
  console.log('arr.length =', arr.length);
  if(arr.length){
    const sample = arr.slice(0,2).map(o=>({id:o.id?.slice(0,12),nome:o.nome||o.razao_social||null,emp:o.empresa_id||o.emp_id||null,del:!!o.deleted_at}));
    console.log('SAMPLE:', JSON.stringify(sample,null,2));
    const matches = arr.filter(o=>norm(o?.nome||o?.razao_social||o?.nome_fantasia||'').includes('ripke')).map(o=>({id:o.id?.slice(0,16),nome:o.nome||o.razao_social||o.nome_fantasia||null,emp:o.empresa_id||o.emp_id||null,del:!!o.deleted_at,status:o.status||null}));
    console.log('\n=== RIPKE matches ===');
    console.log(JSON.stringify(matches,null,2));
    // tambem listar ROTOPLAST, RUIZ, ITACIR, DKADI (outros nomes conhecidos)
    for(const nome of ['rotoplast','ruiz','itacir','dkadi','moveis']){
      const m = arr.filter(o=>norm(o?.nome||o?.razao_social||o?.nome_fantasia||'').includes(nome)).slice(0,3).map(o=>({id:o.id?.slice(0,12),nome:o.nome||o.razao_social||o.nome_fantasia||null,emp:o.empresa_id||o.emp_id||null,del:!!o.deleted_at}));
      console.log('\nmatches "'+nome+'":', JSON.stringify(m,null,2));
    }
  }
  console.log('\n=== EMPRESAS ===');
  const re = await GET('/api/empresas?nocache='+Date.now(),60000);
  let earr=[];if(Array.isArray(re.j?.data))earr=re.j.data;else if(Array.isArray(re.j))earr=re.j;
  console.log('empresas len=',earr.length);
  console.log(JSON.stringify(earr.map(o=>({id:o.id,codigo:o.codigo||o.emp_id||null,nome:o.nome||o.razao_social||o.nome_fantasia||null})),null,2));
  process.exit(0);
})().catch(e=>{console.error('CATCH',e?.message||e);process.exit(2);});
