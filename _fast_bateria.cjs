const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;let S=[];
const L=(m)=>{const t=new Date().toISOString();S.push(t+' '+String(m||''));try{fs.appendFileSync(path.join(p,'_fast.log.txt'),t+' '+String(m||'').replace(/\r?\n/g,' | ')+'\n');}catch(_){}};
function H(u,tm){return new Promise(R=>{
  const t0=Date.now();L('REQ s='+u+' tm='+tm);
  const hdr={Accept:'application/json','Cache-Control':'no-cache','Pragma':'no-cache'};hdr.Authorization='Bearer '+T;
  const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||60000};
  const rq=https.request(o,r=>{let b='';r.on('data',d=>{b+=d;});r.on('end',()=>{const ms=Date.now()-t0;let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}}L('RSP s='+u+' status='+r.statusCode+' ms='+ms+' bodylen='+b.length);R({ms,s:r.statusCode,j,raw:b.slice(0,6000)});});});
  rq.setTimeout(tm||60000,()=>{L('TMO '+u);try{rq.destroy(new Error('tmout'));}catch(_){}R({ne:'TIMEOUT',tm:(Date.now()-t0)});});rq.on('error',e=>{L('ERR '+u+' '+String(e?.message||e));R({ne:String(e?.message||e)});});rq.end();
});}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
(async()=>{
  L('BOOT');
  try{
    const v=await H('/api/version',20000,false);
    L('VER s='+v.s+' patch='+String(v?.j?.runtime?.patch||'?'));
  }catch(_){L('VER exc');}
  const alvo=['ripke','ruiz','rotoplast','dkadi','itacir'];
  const resCli=await H('/api/clientes?search=ripke&limit=20&lite=1',30000);
  L('Q_RIPKE s='+resCli.s+' t='+String(resCli?.j?.data?.length||Array.isArray(resCli.j)?resCli.j.length:'?'));
  if(resCli.s===200){
    const arr=Array.isArray(resCli.j)?resCli.j:(Array.isArray(resCli.j?.data)?resCli.j.data:[]);
    L('Q_RIPKE arr='+arr.length);
    for(let i=0;i<Math.min(5,arr.length);i++){const c=arr[i];L('  CLI'+i+' nome='+String(c?.nome||'?')+' id='+String(c?.id||'?')+' tofs='+Number(c?.total_ofs||0));}
  }else{L('Q_RIPKE FALHOU s='+resCli.s+' ne='+String(resCli.ne||'')+' r='+String(resCli.raw||'').slice(0,400));}
  L('DONE');
  try{fs.writeFileSync(path.join(p,'_FAST_bateria.txt'),S.join('\n'));}catch(_){}
  process.exit(0);
})().catch(e=>{L('CAT '+String(e?.message||e));try{fs.writeFileSync(path.join(p,'_FAST_bateria.txt'),S.join('\n'));}catch(_){}process.exit(2);});
