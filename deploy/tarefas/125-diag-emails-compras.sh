#!/bin/bash
# Diagnóstico (somente leitura) dos e-mails de todas as compras — 13/11
cat > /tmp/diag125.js <<'JS'
const fs=require('fs'),tls=require('tls');
const c=JSON.parse(fs.readFileSync('/etc/pcp-pro/email-compras.json','utf8'));
const host=String(c.imap_host||c.host||'').trim(),port=Number(c.imap_port||993);
const sock=tls.connect({host,port,servername:host,rejectUnauthorized:false});
let buf='',n=0,pend=null;
sock.on('data',d=>{buf+=d.toString('latin1');chk();});
function chk(){if(!pend)return;const i=buf.indexOf(pend.tag+' ');if(i>=0){const j=buf.indexOf('\r\n',i);if(j>=0){const out=buf.slice(0,j+2);buf=buf.slice(j+2);const p=pend;pend=null;p.ok(out);}}}
function cmd(l){const tag='A'+(++n);return new Promise(ok=>{pend={tag,ok};sock.write(tag+' '+l+'\r\n');chk();});}
const q=x=>'"'+String(x).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
const dec=s=>String(s).replace(/=\?[^?]+\?([bBqQ])\?([^?]*)\?=/g,(m,e,t)=>/b/i.test(e)?Buffer.from(t,'base64').toString('utf8'):Buffer.from(t.replace(/_/g,' ').replace(/=([0-9A-F]{2})/gi,(x,h)=>String.fromCharCode(parseInt(h,16))),'latin1').toString('utf8'));
const san=s=>dec(s).replace(/@/g,'(a)');
async function heads(pasta,crit){
  await cmd('EXAMINE '+q(pasta));
  const s=await cmd('UID SEARCH '+crit); const ids=((s.match(/\* SEARCH([^\r]*)/)||[])[1]||'').trim().split(/\s+/).filter(Boolean);
  if(!ids.length)return [];
  const f=await cmd('UID FETCH '+ids.join(',')+' (BODY.PEEK[HEADER.FIELDS (DATE FROM TO SUBJECT)])');
  const out=[];let cur=null;
  f.replace(/\r\n[ \t]+/g,' ').split('\r\n').forEach(l=>{if(/^\* \d+ FETCH/.test(l)){cur={};out.push(cur);}const m=l.match(/^(Date|From|To|Subject):\s*(.*)$/i);if(m&&cur)cur[m[1].toLowerCase()]=san(m[2]);});
  return out;
}
sock.once('secureConnect',async()=>{
  await new Promise(r=>setTimeout(r,800)); buf='';
  const l=await cmd('LOGIN '+q(c.user)+' '+q(c.pass)); if(!/A1 OK/.test(l)){console.log('login falhou');process.exit(0);}
  const env=await heads('INBOX.Sent','SINCE 4-Nov-2026 SUBJECT "CMP-0"');
  console.log('== ENVIADOS (pasta Sent) ==');env.forEach(m=>console.log((m.subject||'').replace(/.*(CMP-\d+).*/,'$1'),'|',m.date,'|',m.to));
  const cop=await heads('INBOX','SINCE 4-Nov-2026 SUBJECT "CMP-0"');
  console.log('== NA CAIXA DE ENTRADA (cópias e confirmações) ==');cop.forEach(m=>console.log(m.subject,'|',m.date,'|de:',m.from));
  const dev=await heads('INBOX','SINCE 4-Nov-2026 OR OR OR FROM "mailer-daemon" FROM "postmaster" SUBJECT "Undeliver" SUBJECT "entregue"');
  console.log('== DEVOLUCOES ==',dev.length);dev.forEach(m=>console.log(m.subject,'|',m.date,'|de:',m.from));
  for(const p of ['INBOX.spam','INBOX.Junk']){const sp=await heads(p,'SINCE 4-Nov-2026');console.log('== '+p+' ==',sp.length);sp.slice(-15).forEach(m=>console.log(m.subject,'|',m.date,'|de:',m.from));}
  sock.write('Z LOGOUT\r\n'); setTimeout(()=>process.exit(0),500);
});
setTimeout(()=>{console.log('tempo esgotado');process.exit(0)},50000);
JS
timeout 70 node /tmp/diag125.js 2>&1 | cut -c1-200; rm -f /tmp/diag125.js
