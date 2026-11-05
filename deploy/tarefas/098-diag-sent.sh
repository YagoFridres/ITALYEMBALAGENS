. deploy/lib.sh
# leitura apenas (EXAMINE): quais mensagens de hoje estão em cada pasta "enviados" do comercial@
grep -hE "\[EMAIL\]\[enviados\]|enviar-email" /opt/pcp-pro/app-out-0.log /opt/pcp-pro/app-err-0.log | tail -n 5 | cut -c1-200
node -e '
const fs=require("fs"),tls=require("tls");
const c=JSON.parse(fs.readFileSync("/etc/pcp-pro/email-compras.json","utf8"));
const s=tls.connect({host:c.host,port:993,servername:c.host,rejectUnauthorized:false},()=>{
  const q=x=>"\""+String(x).replace(/\\/g,"\\\\").replace(/"/g,"\\\"")+"\"";
  s.write("A1 LOGIN "+q(c.user)+" "+q(c.pass)+"\r\n");
  for (const [i,p] of ["INBOX.Sent","INBOX"].entries()) s.write("B"+i+" EXAMINE "+q(p)+"\r\nC"+i+" SEARCH SINCE 5-Nov-2026\r\nD"+i+" FETCH 1:* (FLAGS INTERNALDATE BODY.PEEK[HEADER.FIELDS (SUBJECT DATE FROM)])\r\n");
  s.write("Z LOGOUT\r\n");
});
let out=""; s.on("data",d=>out+=d); s.on("close",()=>{ const l=out.split("\r\n").filter(x=>/^(B|C|D)\d |^\* (SEARCH|\d+ EXISTS)|^Subject:|^Date:|INTERNALDATE/i.test(x)); console.log(l.slice(-80).join("\n").slice(0,6000)); });
setTimeout(()=>s.destroy(),20000);'
