const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;
const L=[];function log(m){const t=new Date().toISOString();const linha=t+' '+String(m||'');L.push(linha);try{fs.appendFileSync(path.join(p,'_bat5.log.txt'),linha.replace(/\r?\n/g,' | ')+'\n');}catch(_){}}
function H(u,tm){return new Promise(R=>{
  const t0=Date.now();
  const hdr={Accept:'application/json','Cache-Control':'no-cache','Pragma':'no-cache',Authorization:'Bearer '+T};
  const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||60000};
  const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{const ms=Date.now()-t0;let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}};R({ms,s:r.statusCode,j,raw:b.slice(0,6000)});});});
  rq.setTimeout(tm||60000,()=>{try{rq.destroy(new Error('to'));}catch(_){}R({ne:'TIMEOUT',tm:(Date.now()-t0)});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();
});}
async function bater(){
  log('BOOT patch_target=20260812103000');
  const v=await H('/api/version',20000,false);
  log('version s='+v.s+' patch='+String(v?.j?.runtime?.patch||'?')+' commit='+String(v?.j?.git?.commit||'?'));
  const termos=[
    {tag:'RIPKE',q:'moveis ripke',esperadoNaoZero:true},
    {tag:'RUIZ',q:'ruiz',esperadoNaoZero:true},
    {tag:'ROTOPLAST',q:'rotoplast',esperadoNaoZero:true},
    {tag:'DKADI',q:'dkadi',esperadoNaoZero:true},
    {tag:'ITACIR',q:'itacir',esperadoNaoZero:true},
  ];
  const out=[];let z=0,e=0,com=0;
  for(const t of termos){
    const cli=await H('/api/clientes?search='+encodeURIComponent(t.q)+'&limit=5&lite=1',60000);
    if(cli.s!==200||cli.ne){e++;out.push({tag:t.tag,s:cli.s,ne:cli.ne,err:cli?.j?.error||null,raw:String(cli.raw||'').slice(0,400)});continue;}
    const arr=Array.isArray(cli.j)?cli.j:(Array.isArray(cli.j?.data)?cli.j.data:[]);
    if(!arr.length){e++;out.push({tag:t.tag,nao_encontrado:true,busca_qtd:0});continue;}
    const c=arr[0];
    const tofs=Number(c?.total_ofs||0)||0;
    const res={tag:t.tag,id:c.id,nome:c.nome,total_ofs:tofs,uf:c.uf||null,cidade:c.cidade||null,emp_id:c.emp_id||c.empresa_id||null};
    if(tofs===0){z++;res.status='0_OFS';} else {com++;res.status='TEM_OFS';}
    out.push(res);
  }
  const rel={feito_em:new Date().toISOString(),deploy_patch:v?.j?.runtime?.patch||null,deploy_commit:v?.j?.git?.commit||null,deploy_id:v?.j?.deploy?.id||null,bateria:{total:termos.length,qtd_tem_ofs:com,qtd_zero_ofs:z,qtd_erro:e,detalhe:out}};
  log('SUM temofs='+com+' zeroofs='+z+' erros='+e);
  try{fs.writeFileSync(path.join(p,'_BATERIA_5_5_FINAL.json'),JSON.stringify(rel,null,2));}catch(err){log('WRITE_JSON_ERR '+String(err?.message||err));}
  try{fs.writeFileSync(path.join(p,'_BAT5_LINES.txt'),L.join('\n'));}catch(_){}
  process.exit(0);
}
bater().catch(e=>{log('CAT '+String(e?.message||e));try{fs.writeFileSync(path.join(p,'_BAT5_CATCH.txt'),String(e?.message||e));}catch(_){}process.exit(2);});
