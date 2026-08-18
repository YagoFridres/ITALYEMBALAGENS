const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const token = jwt.sign({ id:'t', perfil:'admin' }, 'italy_secret_2026', { expiresIn:'2h' });
const EMPRESAS = [
  { id:'', nome:'TODAS (SEM FILTRO)' },
  { id:'E1', nome:'Italy Embalagens' },
  { id:'E2', nome:'Cartoeste' },
  { id:'E3', nome:'Oestepack' },
];
let resultados = [];
async function uma(emp) {
  const p = '/api/cores-impressao' + (emp.id ? ('?empId=' + encodeURIComponent(emp.id)) : '');
  return new Promise((resolve) => {
    const opts = {
      host:'adm.italyembalagens.com.br', path:p, method:'GET', timeout: 30000,
      headers:{'Authorization':'Bearer '+token,'Accept':'application/json'}
    };
    const t0 = Date.now();
    const req = https.request(opts, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try {
          const arr = JSON.parse(b);
          const lista = Array.isArray(arr) ? arr : (Array.isArray(arr.data) ? arr.data : []);
          const nomes = lista.map(c => String(c?.nome||'').trim()).filter(Boolean);
          const temSemImpressao = nomes.some(n => /sem\s*impress/i.test(n));
          const temOff = nomes.some(n => /(off|nenhuma|sem\s*cor|sem\s*tinta|branco)/i.test(n));
          resolve({
            empresa: emp.nome, id: emp.id, status: res.statusCode,
            qtd: lista.length, nomes, tem_sem_impressao: temSemImpressao,
            tem_variantes_off: temOff, tempo_ms: Date.now()-t0
          });
        } catch(e) { resolve({ empresa: emp.nome, err: e.message, body: b.slice(0,400), status: res.statusCode }); }
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({empresa:emp.nome, err:'timeout'}); });
    req.on('error', e => resolve({empresa:emp.nome, err:String(e?.message||e)}));
    req.end();
  });
}
(async () => {
  for (const e of EMPRESAS) resultados.push(await uma(e));
  const out = path.join(__dirname, '_check_cores_empresas.json');
  fs.writeFileSync(out, JSON.stringify(resultados, null, 2));
  for (const r of resultados) {
    if (r.err) console.log(`${r.empresa.padEnd(30)} ERRO: ${r.err}`);
    else console.log(`${r.empresa.padEnd(30)} qtd=${String(r.qtd).padEnd(2)} semImpressao=${r.tem_sem_impressao?'✅':'❌'}  nomes=[${r.nomes.slice(0,8).join(' | ')}${r.nomes.length>8?'...':''}]`);
  }
  console.log('\nJSON salvo:', out);
  const problemas = resultados.filter(r => (r.id==='E2'||r.id==='E3') && !r.tem_sem_impressao).map(r=>r.empresa);
  console.log('\nPROBLEMA (Cartoeste/Oestepack SEM opção "Sem Impressão"):', problemas.length ? problemas.join(', ') + ' ❌' : 'nenhum ✅');
  process.exit(problemas.length ? 1 : 0);
})();