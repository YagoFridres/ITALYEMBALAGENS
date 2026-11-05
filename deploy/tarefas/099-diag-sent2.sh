. deploy/lib.sh
grep -hE "\[EMAIL\]\[enviados\]" /opt/pcp-pro/app-out-0.log /opt/pcp-pro/app-err-0.log | tail -n 5 | cut -c1-200
node -e '
const fs=require("fs"),tls=require("tls");
const c=JSON.parse(fs.readFileSync("/etc/pcp-pro/email-compras.json","utf8"));
const s=tls.connect({host:c.host,port:993,servername:c.host,rejectUnauthorized:false},()=>{
  const q=x=>"\""+String(x).replace(/\\/g,"\\\\").replace(/"/g,"\\\"")+"\"";
  s.write("A1 LOGIN "+q(c.user)+" "+q(c.pass)+"\r\nB1 EXAMINE \"INBOX.Sent\"\r\nC1 SEARCH SINCE 4-Nov-2026\r\nZ LOGOUT\r\n");
});
let out=""; s.on("data",d=>out+=d); s.on("close",()=>{ console.log(out.split("\r\n").filter(x=>!/^A1 OK/.test(x)).join("\n").slice(0,3000)); });
setTimeout(()=>s.destroy(),20000);'
