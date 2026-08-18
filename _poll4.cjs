const https = require('https');
const EXPECTED = '20260813080300';
const URL = 'https://adm.italyembalagens.com.br/api/version';
const MAX = 80;
let i = 0;
function poll(){
  i++;
  const req = https.get(URL, { timeout: 10000, headers: { 'User-Agent':'node-poll/4.0', 'Accept':'application/json' } }, (res) => {
    let d='';
    res.on('data', c=>d+=c);
    res.on('end', ()=>{
      try{
        const j = JSON.parse(d || '{}');
        const patch = String(((j||{}).runtime||{}).patch || (j||{}).patch || '');
        const ok = patch.includes(EXPECTED);
        const comm = String(((j||{}).git||{}).commit || '').slice(0,7);
        console.log('['+String(i).padStart(2,'0')+'/'+MAX+'] HTTP='+res.statusCode+' patch='+JSON.stringify(patch)+' commit='+JSON.stringify(comm)+' ok='+ok);
        if(ok && res.statusCode===200){ process.exit(0); }
      }catch(e){ console.log('parse_err'); }
      if(i>=MAX){ process.exit(1); }
      setTimeout(poll, 2500);
    });
  });
  req.on('error', e=>{
    console.log('err='+e.message);
    if(i>=MAX){ process.exit(1); }
    setTimeout(poll, 2500);
  });
}
poll();
