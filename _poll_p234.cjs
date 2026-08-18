const https = require('https');
const HOST = 'adm.italyembalagens.com.br';
const EXPECT = '20260813060000';
const MAX_MS = 180000;
const STEP = 7000;
const start = Date.now();
function probe(){
  return new Promise((res)=>{
    const req = https.get('https://'+HOST+'/api/version', { headers: { 'User-Agent':'probe-p234/1.0','Accept':'application/json' } }, (r)=>{
      let d = ''; r.on('data', c=>d+=c); r.on('end', ()=>{ res({s:r.statusCode, b:d}); });
    });
    req.on('error', (e)=>res({s:0,b:String(e.message||e)}));
    req.setTimeout(12000, ()=>{ req.destroy(); res({s:0,b:'timeout'}); });
  });
}
(async function(){
  while(Date.now()-start < MAX_MS){
    const el = Math.round((Date.now()-start)/1000);
    let r; try { r = await probe(); } catch(e){ r={s:0,b:String(e)} }
    let patch = null, commit = null;
    try{
      const j = JSON.parse(r.b||'{}');
      patch = j.runtime && j.runtime.patch ? String(j.runtime.patch) : null;
      commit = j.git && j.git.commit ? String(j.git.commit).slice(0,7) : null;
    }catch(_){}
    const ok = (r.s===200) && (patch===EXPECT);
    console.log('['+el+'s] HTTP '+r.s+' | patch='+(patch||'(none)')+' | commit='+(commit||'(none)')+' | '+ (ok?'OK':'aguardando'));
    if(ok){ console.log('\n✅ DEPLOY CONFIRMADO em '+el+'s.'); process.exit(0); }
    await new Promise(rr=>setTimeout(rr, STEP));
  }
  console.log('\n❌ TIMEOUT. Deploy não confirmou em '+Math.round(MAX_MS/1000)+'s.');
  process.exit(1);
})();
