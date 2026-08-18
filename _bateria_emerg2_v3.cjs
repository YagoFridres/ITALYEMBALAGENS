const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;
function H(u,tm){return new Promise(R=>{
  const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};
  const o={host:'adm.italyembalagens.com.br',path:u,method:'GET',headers:hdr,timeout:tm||60000};
  const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{const ms=Date.now()-t0;let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,4000)}}R({ms,s:r.statusCode,j,raw:b.slice(0,5000)})})});
  rq.setTimeout(tm||60000,()=>rq.destroy(new Error('to')));rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();
});}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
const alvo=[{chave:'ripke',sub:'moveis ripke'},{chave:'ruiz',sub:'ruiz'},{chave:'rotoplast',sub:'rotoplast'},{chave:'dkadi',sub:'dkadi'},{chave:'itacir',sub:'itacir'}];
const out={};out.feito_em=new Date().toISOString();
try{
  let h=H('/api/version',20000,false);let ver=null;
  h.then(v=>out.version_antes=v);
}catch(_){}
(async()=>{
  out.ver=(await H('/api/version',20000,false));
  try{fs.writeFileSync(path.join(p,'_b3_v.txt'),String(out.ver.s));}catch(_){}
  out.clientes=(await H('/api/clientes?limit=500&lite=1',120000));
  const arr=Array.isArray(out.clientes.j?.data)?out.clientes.j.data:[];
  out.clientes_total=arr.length;
  out.bateria=[];let temZero=false;let naoEncontrou=false;let erro=false;
  for(const a of alvo){
    const sub=norm(a.sub);let match=null;
    for(const c of arr){const n=norm(c.nome);if((!match)&&n.indexOf(sub)>=0){match=c;break;}}
    if(!match){naoEncontrou=true;out.bateria.push({chave:a.chave,sub,erro:'CLIENTE_NAO_ENCONTRADO',total_clientes:arr.length});continue;}
    const total_ofs=Number(match.total_ofs ?? match.qtd_ofs ?? 0)||0;
    const res={chave:a.chave,sub,id:match.id,nome:match.nome,total_ofs,uf:match.uf||null,cidade:match.cidade||null};
    if(total_ofs===0){temZero=true;res.aviso='ZERO_OFS_PODE_OU_NAO_SER_PROBLEMA';} else {res.ok='TEM_OFS'};
    out.bateria.push(res);
  }
  out.summary={tem_zero_ofs_em_algum:temZero,nao_encontrou_algum:naoEncontrou};
  try{fs.writeFileSync(path.join(p,'_BATERIA_EMERG2_FINAL_v3.json'),JSON.stringify(out,null,2));}catch(_){try{fs.writeFileSync(path.join(p,'_b3_ERR.txt'),'wrt');}catch(_){}}
  process.exit(0);
})().catch(e=>{try{fs.writeFileSync(path.join(p,'_BATERIA_CATCH.txt'),String(e?.message||e))}catch(_){}process.exit(2)});
