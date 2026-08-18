const https=require('https');const jwt=require('jsonwebtoken');
const t=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});
const q='ROTOPLAST';
const p='/api/clientes?q='+encodeURIComponent(q)+'&order=rototodos&dir=asc&incluir_inativos=true';
const o={host:'adm.italyembalagens.com.br',path:p,method:'GET',headers:{'Authorization':'Bearer '+t},timeout:180000};
const s=Date.now();
const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{
  if(r.statusCode!==200){process.stdout.write('HTTP'+r.statusCode+' '+b.slice(0,200)+'\n');process.exit(1);}
  try{const d=JSON.parse(b);const arr=Array.isArray(d?.data)?d.data:(Array.isArray(d)?d:[]);process.stdout.write('TOTAL clientes ROTOPLAST filtrados: '+arr.length+'\n');for(let i=0;i<arr.length;i++){const c=arr[i];process.stdout.write('  ['+i+'] id='+c.id.slice(0,8)+'... | nome='+String(c.nome||c.rs||'').slice(0,40)+' | total_ofs='+(c.total_ofs==null?'NULL':Number(c.total_ofs))+'\n');}process.exit(0);}
  catch(e){process.stdout.write('PARSE_ERR '+e.message+'\nBODY[:500]='+b.slice(0,500)+'\n');process.exit(3);}
});});
rq.on('timeout',()=>{rq.destroy(new Error('to'));});
rq.on('error',e=>{process.stdout.write('NET '+e.message+'\n');process.exit(4);});
rq.end();
