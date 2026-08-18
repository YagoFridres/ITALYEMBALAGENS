// Provar BUG1: /api/clientes?lite=1 retorna total_ofs para RIPKE (antes era null / undefined por causa da whitelist curta no normalizeCli + não usava lite=1)
const https = require('https');
const fs = require('fs');
const token = (fs.readFileSync(__dirname+'\\_token_admin.txt','utf8').split('\n')[0]||'').trim();
if(!token){ console.log('SEM TOKEN'); process.exit(1); }
const opt = {
  hostname:'italyembalagens-production.up.railway.app',
  method:'GET',
  path:'/api/clientes?lite=1&search=RIPKE&__nc='+Date.now(),
  headers:{ 'Authorization':'Bearer '+token, 'Cache-Control':'no-cache' },
  timeout:25000, rejectUnauthorized:false
};
console.log('GET /api/clientes?lite=1&search=RIPKE  Authorization=Bearer ' + token.substring(0,15)+'...');
const req = https.request(opt, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    console.log('HTTP',res.statusCode,'content-type=',res.headers['content-type']);
    let j; try{ j=JSON.parse(d); }catch(e){ console.log('NÃO JSON:',d.substring(0,300)); return; }
    if(!j.ok){ console.log('ERRO:',JSON.stringify(j,null,2).substring(0,400)); return; }
    const arr = j.data || [];
    console.log('Total clientes encontrados:',arr.length);
    arr.forEach((c,i) => {
      const nome = String(c.nome||c.rs||'').toUpperCase();
      if(nome.includes('RIPKE')){
        console.log('\n🎯 CLIENTE RIPKE ENCONTRADO (index '+i+'):');
        console.log('  nome         :', c.nome || c.rs);
        console.log('  id           :', String(c.id||'').substring(0,12)+'...');
        console.log('  total_ofs    :', c.total_ofs, typeof c.total_ofs, '(esperado: numero 430+, NAO nulo/undefined/0 por causa de whitelist)');
        console.log('  totalOfs     :', c.totalOfs, typeof c.totalOfs, '(camelCase adicionado no backend lite map)');
        console.log('  total_valor  :', typeof c.total_valor === 'number' ? (c.total_valor > 1000 ? ((c.total_valor/1000).toFixed(1)+'k') : c.total_valor) : c.total_valor, typeof c.total_valor);
        console.log('  totalValor   :', typeof c.totalValor, c.totalValor != null ? 'presente' : 'ausente');
        console.log('  ativo        :', c.ativo, typeof c.ativo);
        console.log('  created_at   :', c.created_at ? String(c.created_at).substring(0,19) : 'null');
        console.log('  campos_count :', Object.keys(c).length);
        console.log('  TODOS os campos:', Object.keys(c).join(','));
        // BUG1 assert: total_ofs não null não undefined numero >= 400
        let ok = 0, tot = 4;
        if(c.total_ofs != null && typeof c.total_ofs === 'number' && c.total_ofs >= 400){ console.log('  ✅ BUG1-PASSOU: total_ofs é NUMERO >= 400 ('+c.total_ofs+') — whitelist normalizeCli/backend NÃO apagou este campo (ANTES ERA NULL/UNDEFINED)'); ok++; }
        else console.log('  ❌ BUG1-FALHOU: total_ofs='+c.total_ofs);
        if(c.totalOfs != null && typeof c.totalOfs === 'number'){ console.log('  ✅ BUG1-PASSOU: totalOfs camelCase PRESENTE ('+c.totalOfs+') — backend lite map agora envia ambos os formatos'); ok++; }
        else console.log('  ❌ BUG1-FALHOU: totalOfs='+c.totalOfs);
        if(typeof c.total_valor === 'number'){ console.log('  ✅ BUG1-PASSOU: total_valor é NUMERO — whitelist não apagou'); ok++; }
        else console.log('  ❌ BUG1-FALHOU: total_valor='+c.total_valor);
        if(c.ativo !== undefined && c.created_at !== undefined){ console.log('  ✅ BUG1-PASSOU: ativo e created_at presentes na resposta'); ok++; }
        else console.log('  ❌ BUG1-FALHOU: ativo/created_at ausentes');
        console.log('\n  RESUMO BUG1:', ok,'/',tot,' campos CORRETOS na resposta API (antes whitelist SEM normalizeCli matava 4 campos)');
      } else {
        console.log(i+'. outro cliente:', c.nome||c.rs, 'total_ofs=', c.total_ofs);
      }
    });
    if(arr.length === 0){ console.log('Nenhum cliente retornado. Dados:', JSON.stringify(j).substring(0,400)); }
  });
});
req.on('error',e=>console.log('ERR',e.message));
req.setTimeout(25000,()=>req.destroy(new Error('timeout')));
req.end();
