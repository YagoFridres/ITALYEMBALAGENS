. deploy/lib.sh
# só testa login IMAP + lista de pastas (não grava nada, não mostra senha)
cd /opt/pcp-pro 2>/dev/null || true
node -e '
const fs=require("fs"),tls=require("tls");
for (const arq of ["email-compras.json","email-orcamentos.json"]) {
  let c={}; try{c=JSON.parse(fs.readFileSync("/etc/pcp-pro/"+arq,"utf8"))}catch(e){console.log(arq,"sem config");continue}
  const host=c.host; const s=tls.connect({host,port:993,servername:host,rejectUnauthorized:false},()=>{
    const q=x=>"\""+String(x).replace(/\\/g,"\\\\").replace(/"/g,"\\\"")+"\"";
    s.write("A1 LOGIN "+q(c.user)+" "+q(c.pass)+"\r\nA2 LIST \"\" \"*\"\r\nA3 LOGOUT\r\n");
  });
  let out=""; s.on("data",d=>out+=d); s.on("error",e=>console.log(arq,"erro",e.message));
  s.on("close",()=>console.log("== "+arq+" ("+host+")\n"+out.split("\r\n").filter(l=>/^A[12] |^\* LIST/.test(l)).join("\n")));
  setTimeout(()=>s.destroy(),15000);
}'
