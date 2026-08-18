const https = require('https');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInVpZCI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiZW1wcmVzYV9pZCI6IkUxIiwiZW1wSWQiOiJFMSIsImlhdCI6MTc4NjU2NjU5MSwiZXhwIjoxNzg2NjA5NzkxfQ.yKsnKpTTW6UzzBEosC4XapJfmmvTl6IqPCzZX9-PO5A';

function req(path) {
  return new Promise((resolve) => {
    const o = {
      hostname: 'adm.italyembalagens.com.br',
      method: 'GET',
      path: path + (path.includes('?')?'&':'?') + '__nc=' + Date.now(),
      headers: { Authorization: 'Bearer ' + token, 'Cache-Control': 'no-cache' },
      timeout: 30000, rejectUnauthorized: false
    };
    const r = https.request(o, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ s: res.statusCode, patch: res.headers['x-index-patch-version'] || 'n/a', d }));
    });
    r.on('error', e => resolve({ s: 'ERR', patch: '', d: e.message }));
    r.setTimeout(30000, () => r.destroy(new Error('timeout')));
    r.end();
  });
}

(async () => {
  const v = await req('/api/version');
  console.log('/api/version HTTP ' + v.s + '  x-patch=' + v.patch);
  let j; try { j = JSON.parse(v.d); } catch(e){}
  if (j && j.runtime) console.log('  runtime.patch=' + j.runtime.patch + '  commit=' + j.git.commit.substring(0, 7));

  const c = await req('/api/clientes?lite=1&search=RIPKE');
  console.log('/api/clientes?lite=1 HTTP ' + c.s);
  let jc; try { jc = JSON.parse(c.d); } catch (e) { console.log('BAD JSON: ' + c.d.substring(0, 300)); return; }
  if (!jc.ok) { console.log('  ERRO: ' + JSON.stringify(jc).substring(0, 300)); return; }
  console.log('  data.length=' + jc.data.length);
  const ripke = jc.data.find(c => String(c.nome || c.rs || '').toUpperCase().includes('RIPKE'));
  if (!ripke) { console.log('  RIPKE NAO ENCONTRADO, mostrando os primeiros:'); jc.data.slice(0, 5).forEach(x => console.log('    ' + x.nome)); return; }
  console.log('\n🎯 RIPKE ENCONTRADO:');
  console.log('  nome         :', ripke.nome);
  console.log('  total_ofs  :', ripke.total_ofs, ' (' + typeof ripke.total_ofs + ')');
  console.log('  totalOfs   :', ripke.totalOfs, ' (' + typeof ripke.totalOfs + ')');
  console.log('  total_valor:', ripke.total_valor != null ? String(ripke.total_valor).substring(0, 15) : null, 'tipo=' + typeof ripke.total_valor);
  console.log('  totalValor :', typeof ripke.totalValor);
  console.log('  ativo       :', ripke.ativo);
  console.log('  created_at  :', ripke.created_at ? String(ripke.created_at).substring(0, 19) : null);
  console.log('  keys count  :', Object.keys(ripke).length, ' -> ', Object.keys(ripke).join(','));
  let ok = 0, tot = 4;
  if (ripke.total_ofs != null && typeof ripke.total_ofs === 'number' && ripke.total_ofs >= 400) {
    console.log('  ✅ BUG1-PASSOU (1/' + tot + ') total_ofs = ' + ripke.total_ofs + ' (NUMERO >=400, NAO NULL/UNDEFINED - whitelist normalizeCli nao apagou o campo)'); ok++;
  } else console.log('  ❌ BUG1 total_ofs=' + ripke.total_ofs);
  if (ripke.totalOfs != null && typeof ripke.totalOfs === 'number') {
    console.log('  ✅ BUG1-PASSOU (2/' + tot + ') totalOfs camelCase PRESENTE'); ok++;
  } else console.log('  ❌ BUG1 totalOfs=' + ripke.totalOfs);
  if (typeof ripke.total_valor === 'number') {
    console.log('  ✅ BUG1-PASSOU (3/' + tot + ') total_valor PRESENTE numero'); ok++;
  } else console.log('  ❌ BUG1 total_valor=' + ripke.total_valor);
  if (ripke.ativo !== undefined && ripke.created_at !== undefined) {
    console.log('  ✅ BUG1-PASSOU (4/' + tot + ') ativo e created_at presentes'); ok++;
  } else console.log('  ❌ BUG1 campos ausentes');
  console.log('\n  RESUMO: ' + ok + '/' + tot + ' CHECKS PASSARAM');
})();
