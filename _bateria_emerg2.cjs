const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;
function H(u,tm){return new Promise(R=>{
  const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};
  const o={host:'adm.italyembalagens.com.br',path:u,method:'GET',headers:hdr,timeout:tm||30000};
  const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{const ms=Date.now()-t0;let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,3000)}}R({ms,s:r.statusCode,j,raw:b.slice(0,9000)})})});
  rq.setTimeout(tm||30000,()=>rq.destroy(new Error('to')));rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();
});}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
async function M(){
  const out={};
  try{fs.writeFileSync(path.join(p,'_b2_step0.txt'),'START');}catch(_){}
  out.empresas=(await H('/api/empresas',15000));
  out.clientes_list=(await H('/api/clientes?limit=500',30000));
  const arr=Array.isArray(out.clientes_list.j)?out.clientes_list.j:(out.clientes_list.j?.data||[]);
  out.clientes_total=arr.length;
  const nomes=['moveis ripke','ruiz','rotoplast','dkadi','itacir'];
  const ids={};
  for(const c of arr||[]){const n=norm(c.nome);for(const nome of nomes){if(n.indexOf(nome)>=0 && !ids[nome]){ids[nome]={id:c.id,nome:c.nome,uf:c.uf,cidade:c.cidade,empresa_id:c.empresa_id};}}}
  out.ids=ids;
  const resultados=[];let qtd0=0;let qtdNaoZero=0;let qtdErro=0;
  for(const nome of nomes){
    const cli=ids[nome];let res=null;let ofsArr=[];
    if(!cli){resultados.push({nome,ok:false,motivo:'NAO_ENCONTRADO_NA_LISTAGEM'});qtdErro++;continue;}
    try{
      res=await H('/api/clientes/'+encodeURIComponent(cli.id)+'/ofs?status=ativos&incluir_cancelados=false',30000);
      ofsArr=Array.isArray(res.j)?res.j:(res.j?.data||[]);
      const numeros=(ofsArr||[]).map(o=>String(o?.numero||'')).filter(Boolean);
      if((ofsArr||[]).length===0 || numeros.length===0){qtd0++;resultados.push({nome,ok:true,id:cli.id,qtd_ofs:(ofsArr||[]).length,qtd_numeros_validos:numeros.length,criterio:'0_OFS_ENCONTRADO',amostra_5:numeros.slice(0,5)});}
      else{qtdNaoZero++;resultados.push({nome,ok:true,id:cli.id,qtd_ofs:(ofsArr||[]).length,qtd_numeros_validos:numeros.length,criterio:'TEM_OFS_COM_NUMEROS',amostra_5:numeros.slice(0,5)});}
    }catch(e){qtdErro++;resultados.push({nome,id:cli.id,ok:false,catchErr:String(e?.message||e),http_s:res?.s,http_err:res?.j?.error||null});}
  }
  out.bateria={nomes,qtd_resultados:resultados.length,qtd_0_OFS:qtd0,qtd_com_OFS:qtdNaoZero,qtd_ERRO:qtdErro,resultados};
  try{fs.writeFileSync(path.join(p,'_BATERIA_EMERG2_FINAL.json'),JSON.stringify(out,null,2))}catch(_){try{fs.writeFileSync(path.join(p,'_b2_ERR.txt'),'write_err')}catch(_){}}
  process.exit(qtd0===0 && qtdErro===0?0:1);
}
M().catch(e=>{try{fs.writeFileSync(path.join(p,'_BATERIA_CATCH.txt'),String(e?.message||e))}catch(_){}process.exit(2)});
