const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;const TARGET='20260812103000';
function step(n,s){try{fs.writeFileSync(path.join(p,'_vf_s'+n+'.txt'),String(s||''))}catch(_){}}
function H(u,tm,auth){return new Promise(R=>{
  const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache'};if(auth)hdr.Authorization='Bearer '+T;
  const o={host:'adm.italyembalagens.com.br',path:u,method:'GET',headers:hdr,timeout:tm||30000};
  const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{const ms=Date.now()-t0;let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,2000)}}R({ms,s:r.statusCode,j,raw:b.slice(0,6000)})})});
  rq.setTimeout(tm||30000,()=>rq.destroy(new Error('to')));rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();
});}
function conta(arr,filt){let n=0;for(const x of arr||[]){if(filt(x))n++;}return n;}
async function pollDeploy(esperado){for(let i=1;i<=50;i++){step(1,'pollv_'+i);const v=await H('/api/version',15000,false);if(v.s===200 && v.j && v.j.runtime && v.j.runtime.patch===esperado)return v;await new Promise(r=>setTimeout(r,6000));}return null;}
async function M(){
  step(0,'BOOT target='+TARGET+' em '+new Date().toISOString());
  const dv=await pollDeploy(TARGET);
  step(2,'deploy_patch='+(dv?.j?.runtime?.patch||'?')+' commit='+(dv?.j?.git?.commit||'?'));
  const emp=await H('/api/empresas',25000,true);
  step(3,'emp_s='+emp.s+' qtd='+(Array.isArray(emp.j?.data)?emp.j.data.length:'naoArray'));
  const cores=await H('/api/cores-impressao',25000,true);
  const listaCores=Array.isArray(cores.j)?cores.j:[];
  const sem=listaCores.filter(x=>String(x?.nome||'').toLowerCase().indexOf('sem impress')>=0);
  step(4,'cores_s='+cores.s+' total='+listaCores.length+' qtd_sem_impress='+sem.length);
  const clientesFiltros=[
    {label:'RIPKE',nomeLimpo:'moveis ripke'},
    {label:'RUIZ',nomeLimpo:'ruiz'},
    {label:'ROTOPLAST',nomeLimpo:'rotoplast'},
    {label:'DKADI',nomeLimpo:'dkadi'},
    {label:'ITACIR',nomeLimpo:'itacir'},
  ];
  const resultadoClientes=[];
  const totalClientes=conta(emp.j?.data,x=>!!x?.id);
  for(let i=0;i<clientesFiltros.length;i++){
    const t0=Date.now();
    let res=null;
    try{
      let pathBusca;
      try{
        const params=new URLSearchParams({q:clientesFiltros[i].nomeLimpo,limit:'20',incluir_inativos:'false'}).toString();
        pathBusca='/api/clientes/buscar?'+params;
        res=await H(pathBusca,25000,true);
      }catch(_){res={ne:'busca_catch'};}
      let ofs=[];
      let erroOfs=null;let qtdOfsNaoZero=null;
      if(res.s===200 && Array.isArray(res.j?.data || res.j)){
        const arr=Array.isArray(res.j)?res.j:(res.j?.data||[]);
        let matchId=null;
        for(const c of arr){
          const nm=String(c?.nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
          const tgt=clientesFiltros[i].nomeLimpo.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
          if(nm.indexOf(tgt)>=0){matchId=c.id;break;}
        }
        if(matchId){
          try{const or=await H('/api/clientes/'+encodeURIComponent(matchId)+'/ofs?status=ativos&incluir_cancelados=false',25000,true);
            if(or.s===200){ofs=Array.isArray(or.j?.data)?or.j.data:(Array.isArray(or.j)?or.j:[]);qtdOfsNaoZero=ofs.length>0&&ofs.filter(o=>String(o?.numero||'').trim()!=='').length>0?true:(ofs.length>0?'maybe':false);}
            else{erroOfs='ofs_s_'+or.s+(or.j?.error?'_'+or.j.error:'');}
          }catch(_){erroOfs='ofs_exception';}
        } else {erroOfs='SEM_MATCH_ID_BUSCA';}
      } else {erroOfs='BUSCA_FALHOU s='+(res.s||'?')+(res.ne?' ne='+res.ne:'')+' r='+String((res.raw||'||')).slice(0,200);}
      resultadoClientes.push({
        i,label:clientesFiltros[i].label,nomeBusca:clientesFiltros[i].nomeLimpo,
        busca_s:res.s,busca_ne:res.ne||null,busca_err:res.j?.error||null,
        ofs_qtd:ofs.length,qtd_vazia:(ofs.length===0)?'SIM_0_OFs':'NAO',
        ofs_nao_vazios_confirm:qtdOfsNaoZero,
        ofs_erro:erroOfs,
        amostra_numeros:(ofs.slice(0,5).map(o=>String(o?.numero||'?')+'@'+String(o?.status||'?')).join('|')),
        ms:Date.now()-t0
      });
    }catch(e){resultadoClientes.push({i,label:clientesFiltros[i].label,ms:Date.now()-t0,catchErr:String(e?.message||e)});}
  }
  const bateria={
    total_clientes_emp:totalClientes,
    qtd_checados:resultadoClientes.length,
    qtd_que_eram_0_OFS:resultadoClientes.filter(x=>x.ofs_qtd===0).length,
    qtd_que_tem_OFS:resultadoClientes.filter(x=>x.ofs_qtd>0).length,
    qtd_ERRO_na_busca:resultadoClientes.filter(x=>x.ofs_erro!=null).length,
    detalhe:resultadoClientes
  };
  const sw=await H('/sw.js',15000,false);
  const swStr=String(sw.raw||'');
  const swMatch=swStr.match(/italy-erp-v(\d{14})/);
  const rel={
    feito_em:new Date().toISOString(),
    deploy:dv?{patch:dv.j.runtime.patch,sw:dv.j.runtime.sw,commit:dv.j.git.commit,deploy_id:dv.j.deploy?.id||null,ok:true}:null,
    health:{cores_total:listaCores.length,sem_impressao_total:sem.length,sem_impressao_list:sem.map(x=>({id:x.id,empresa:x.empresa_id,nome:x.nome,hex:x.hex,ativo:x.ativo,created_at:x.created_at}))},
    bateria_emerg2_contagem_0_ofs:bateria,
    sw_cache:{found_it:!!swMatch,timestamp_extraido:swMatch?swMatch[1]:null,match_target:swMatch?swMatch[1]===TARGET:null},
  };
  try{fs.writeFileSync(path.join(p,'_VALIDACAO_FINAL_PART3.json'),JSON.stringify(rel,null,2))}catch(_){try{fs.writeFileSync(path.join(p,'_VF_ERR.json'),JSON.stringify({err:'json_size'},null,2))}catch(_){}}
  step(9,'FIM bateria='+bateria.qtd_checados+' 0ofs='+bateria.qtd_que_eram_0_OFS+' comofs='+bateria.qtd_que_tem_OFS);
  process.exit(bateria.qtd_que_eram_0_OFS===0?0:1);
}
M().catch(e=>{try{fs.writeFileSync(path.join(p,'_VALIDACAO_FINAL_CATCH.txt'),String(e?.message||e))}catch(_){}process.exit(2)});
