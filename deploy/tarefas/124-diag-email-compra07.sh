#!/bin/bash
# Diagnóstico (somente leitura) do e-mail da compra 07 — 13/11
echo "== logs pm2 de e-mail (10/11) =="
grep -h -E "EMAIL|enviar-email|sendMail" /root/.pm2/logs/pcp-pro-*.log 2>/dev/null | grep -E "2026-11-10|enviados" | tail -20 | cut -c1-250 | sed 's/@/(a)/g'
echo "== IMAP (EXAMINE, nada é alterado) =="
cat > /tmp/diag124.js <<'JS'
const fs=require('fs'),tls=require('tls');
const c=JSON.parse(fs.readFileSync('/etc/pcp-pro/email-compras.json','utf8'));
const host=String(c.imap_host||c.host||'').trim(),port=Number(c.imap_port||993);
const sock=tls.connect({host,port,servername:host,rejectUnauthorized:false});
let buf='',n=0,pend=null;
sock.on('data',d=>{buf+=d.toString('latin1');chk();});
function chk(){if(!pend)return;const i=buf.indexOf(pend.tag+' ');if(i>=0){const j=buf.indexOf('\r\n',i);if(j>=0){const out=buf.slice(0,j+2);buf=buf.slice(j+2);const p=pend;pend=null;p.ok(out);}}}
function cmd(l){const tag='A'+(++n);return new Promise(ok=>{pend={tag,ok};sock.write(tag+' '+l+'\r\n');chk();});}
const q=x=>'"'+String(x).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
const san=s=>String(s).replace(/@/g,'(a)').replace(/=\?[^?]+\?[bB]\?([^?]*)\?=/g,(m,t)=>Buffer.from(t,'base64').toString('utf8'));
async function busca(pasta,crit,rot){
  const r=await cmd('EXAMINE '+q(pasta)); if(!/ OK/.test(r.split('\r\n').slice(-2)[0])){console.log(rot,'pasta não abriu',pasta);return;}
  const s=await cmd('UID SEARCH '+crit); const ids=((s.match(/\* SEARCH([^\r]*)/)||[])[1]||'').trim().split(/\s+/).filter(Boolean);
  console.log('--',rot,'['+pasta+']',ids.length,'mensagens');
  if(!ids.length)return;
  const f=await cmd('UID FETCH '+ids.slice(-15).join(',')+' (BODY.PEEK[HEADER.FIELDS (DATE FROM TO SUBJECT)] BODY.PEEK[TEXT]<0.1500>)');
  console.log(san(f).replace(/\r/g,'').split('\n').filter(l=>/^(Date|From|To|Subject):|550|551|552|553|554|rejected|blocked|spam|não|not |unknown|full|cheia|quota|Diagnostic|Status:|Final-Recipient/i.test(l)).slice(0,80).join('\n'));
}
sock.once('secureConnect',async()=>{
  await new Promise(r=>setTimeout(r,800)); buf='';
  const l=await cmd('LOGIN '+q(c.user)+' '+q(c.pass)); if(!/A1 OK/.test(l)){console.log('login falhou');process.exit(0);}
  const lst=await cmd('LIST "" "*"'); console.log('pastas:',lst.split('\r\n').filter(x=>x.startsWith('* LIST')).map(x=>x.split(' ').slice(-1)[0]).join(' '));
  await busca('INBOX','SINCE 10-Nov-2026 OR OR FROM "mailer-daemon" FROM "postmaster" SUBJECT "Undeliver"','DEVOLUCOES');
  await busca('INBOX','SINCE 10-Nov-2026 BEFORE 11-Nov-2026 SUBJECT "Pedido"','COPIAS 10/11 na entrada');
  await busca('INBOX','SINCE 9-Nov-2026 FROM "adami.com.br"','RESPOSTAS ADAMI');
  const sent=(lst.split('\r\n').find(x=>/\\Sent/i.test(x))||'').split(' ').slice(-1)[0].replace(/"/g,'')||'INBOX.Sent';
  await busca(sent,'SINCE 10-Nov-2026 BEFORE 11-Nov-2026','ENVIADOS 10/11');
  sock.write('Z LOGOUT\r\n'); setTimeout(()=>process.exit(0),500);
});
setTimeout(()=>{console.log('tempo esgotado');process.exit(0)},40000);
JS
timeout 60 node /tmp/diag124.js 2>&1 | cut -c1-220; rm -f /tmp/diag124.js
