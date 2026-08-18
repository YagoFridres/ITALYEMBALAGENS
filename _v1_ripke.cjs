const https=require('https');const jwt=require('jsonwebtoken');
const t=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});
const q='RIPKE',esp=422;
const p='/api/clientes?q='+encodeURIComponent(q)+'&order=ripke1&dir=asc';
const o={host:'adm.italyembalagens.com.br',path:p,method:'GET',headers:{'Authorization':'Bearer '+t},timeout:180000};
const s=Date.now();
const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{
  if(r.statusCode!==200){process.stdout.write('RIPKE HTTP'+r.statusCode+' '+b.slice(0,120)+'\n');process.exit(1);}
  try{const d=JSON.parse(b);const arr=Array.isArray(d?.data)?d.data:(Array.isArray(d)?d:[]);const c=arr.find(x=>String(x?.nome||x?.rs||'').toUpperCase().includes(q));const v=c?.total_ofs==null?null:Number(c.total_ofs);process.stdout.write('RIPKE|found='+!!c+'|nome='+(c?.nome||'').slice(0,30)+'|total_ofs='+v+'|esperado='+esp+'|match='+(v===esp)+'|tempo_ms='+(Date.now()-s)+'\n');process.exit(v===esp?0:2);}
  catch(e){process.stdout.write('RIPKE PARSE_ERR '+e.message+' '+b.slice(0,200)+'\n');process.exit(3);}
});});
rq.on('timeout',()=>{rq.destroy(new Error('to'));});
rq.on('error',e=>{process.stdout.write('RIPKE NET '+e.message+'\n');process.exit(4);});
rq.end();
