const https=require('https');const fs=require('fs');const path=require('path');
const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));
const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});
const P=__dirname;
fs.writeFileSync(path.join(P,'_step_00_start.txt'),'START');
function H(p,nm,tm){
  return new Promise((R)=>{
    fs.writeFileSync(path.join(P,'_step_'+nm+'_pre.txt'),'PRE_'+p);
    const o={host:'adm.italyembalagens.com.br',path:p,method:'GET',headers:{Accept:'application/json','Authorization':'Bearer '+T},timeout:tm||180000};
    const rq=https.request(o,r=>{
      fs.writeFileSync(path.join(P,'_step_'+nm+'_hdr.txt'),'HDR_S_'+r.statusCode);
      let b='';
      let k=0;
      r.on('data',d=>{b+=d;k++;if(k%30===0){fs.writeFileSync(path.join(P,'_step_'+nm+'_data.txt'),'DATA_CHUNKS_'+k+'_LEN_'+b.length);}});
      r.on('end',()=>{
        fs.writeFileSync(path.join(P,'_step_'+nm+'_endlen.txt'),'END_LEN='+b.length);
        try{R({s:r.statusCode,j:JSON.parse(b),r:b.slice(0,5000),len:b.length})}
        catch(e){fs.writeFileSync(path.join(P,'_step_'+nm+'_parse_err.txt'),'PE_'+e.message+'_RAW_'+b.slice(0,2000));R({s:r.statusCode,pe:e.message,r:b.slice(0,5000),len:b.length})}
      });
    });
    rq.on('timeout',()=>{fs.writeFileSync(path.join(P,'_step_'+nm+'_timeout.txt'),'TO');rq.destroy(new Error('to'))});
    rq.on('error',e=>{fs.writeFileSync(path.join(P,'_step_'+nm+'_neterr.txt'),'NE_'+String(e?.message||e));R({ne:String(e?.message||e)})});
    rq.end();
  });
}
async function M(){
  fs.writeFileSync(path.join(P,'_step_10_before_oneshot.txt'),'T0');
  const O=await H('/api/_oneshot_fix_cores_sem_impressao','OS',240000);
  fs.writeFileSync(path.join(P,'_oneshot_RESULT.json'),JSON.stringify(O,null,2));
  fs.writeFileSync(path.join(P,'_step_20_after_oneshot.txt'),'T1_OS_S='+O.s);
  process.exit(O.s===200?0:1);
}
M().catch(e=>{fs.writeFileSync(path.join(P,'_CATCH_MAIN.txt'),'M_'+String(e?.message||e));process.exit(1)});
