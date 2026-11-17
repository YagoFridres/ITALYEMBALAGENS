#!/bin/bash
# Diagnóstico: mesmo update que o sistema faz, pelo supabase-js, com variações — volta ao vazio no fim — 17/11
cd /opt/pcp-pro/app
cat > /tmp/diag150.js <<'JS'
require('fs').readFileSync('/opt/pcp-pro/app/.env','utf8').split('\n').forEach(l=>{const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^"|"$/g,'');});
const { createClient } = require('/opt/pcp-pro/app/node_modules/@supabase/supabase-js');
const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY;
const sb=createClient(url,key,{auth:{persistSession:false}});
const ID='1484e63b-bb26-4a07-ba4c-63ee9913c0aa';
(async()=>{
  for (const p of [{localizacao:'N1'},{emp_id:'E1',localizacao:'N2'},{emp_id:'E1',empresa_id:null,localizacao:'N3'}]) {
    const r=await sb.from('facas_estoque').update(p).eq('id',ID).select();
    console.log(JSON.stringify(p), '=>', r.error?('ERRO '+r.error.message):(r.data&&r.data[0]&&r.data[0].localizacao));
  }
  await sb.from('facas_estoque').update({localizacao:''}).eq('id',ID);
  console.log('url host:', String(url).replace(/\/\/([^/]+).*/,'$1'));
})();
JS
node /tmp/diag150.js 2>&1 | head -20; rm -f /tmp/diag150.js
