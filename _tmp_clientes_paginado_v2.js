const https = require('https');
const fs = require('fs');
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAzNzUwMjhkLTc2NTItNDhjNS05MTZjLTNhMzI1ZDcyYjRlMiIsIm5vbWUiOiJBRElNSU5JU1RSQURPUiIsImVtYWlsIjoiaXRhbHkiLCJwZXJmaWwiOiJhZG1pbiIsInBlcm1pc3NvZXMiOlsidHVkbyJdLCJhdmF0YXJfdXJsIjoiaHR0cHM6Ly91YnlnanF4a2ZsZmFjaHRsb2dkdy5zdXBhYmFzZS5jby9zdG9yYWdlL3YxL29iamVjdC9wdWJsaWMvY2hhdC1hcnF1aXZvcy9hdmF0YXJlcy8wMzc1MDI4ZC03NjUyLTQ4YzUtOTE2Yy0zYTMyNWQ3MmI0ZTIuanBnP3Y9MTc4MDQxMTMzODY0NiIsImlhdCI6MTc4NjYyOTc1MiwiZXhwIjoxNzg5MjIxNzUyfQ.o92KGHEY04rJ390cmd4eroZUxijy92NXKIKf7Qi9kEI";
const OUT = "_tmp_result_clientes";
const chunkLimit = 500;
const maxPages = 5;
const all = [];
const prog = [];

function getJSON(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, port: 443, path: u.pathname + u.search,
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      timeout: 60000
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => { data += c.toString(); });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, parseErr: String(e.message || e), rawLen: data.length, rawHead: data.slice(0, 400) }); }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', (e) => { reject(e); });
    req.end();
  });
}

(async () => {
  for (let page = 0; page < maxPages; page++) {
    const t = Date.now() + "_" + page;
    const url = "https://adm.italyembalagens.com.br/api/clientes?lite=1&limit=" + chunkLimit + "&offset=" + (page * chunkLimit) + "&nocache=1&order=created_at&dir=desc&t=" + t;
    try {
      const r = await getJSON(url);
      let arr = [];
      if (r.json && r.json.ok && Array.isArray(r.json.data)) arr = r.json.data;
      else if (r.json && Array.isArray(r.json.data)) arr = r.json.data;
      prog.push({
        page: page, status: r.status, arr: arr.length,
        ok: r.json ? r.json.ok : null,
        err: r.json ? (r.json.err || r.json.error || null) : null,
        parseErr: r.parseErr || null,
        rawLen: r.rawLen || null,
        firstId: arr.length ? arr[0].id : null, lastId: arr.length ? arr[arr.length - 1].id : null,
        keys: arr.length ? Object.keys(arr[0]).slice(0, 20) : []
      });
      for (const a of arr) all.push(a);
      fs.writeFileSync(OUT + '.partial.json', JSON.stringify({ pagesDone: page + 1, totalNow: all.length, prog, sample: arr.slice(0,2).map(x => ({ id: x.id, n: String(x.nome || x.clinome || '').slice(0,30) })) }, null, 2));
      if (arr.length < chunkLimit) break;
    } catch (e) {
      prog.push({ page: page, arr: -1, ok: false, err: String(e.message || e) });
      break;
    }
  }
  const total = all.length;
  const ripke = all.filter(x => String(x && (x.nome || x.clinome || x.razao_social || '')).toUpperCase().includes('RIPKE'));
  let ripkeMax = 0;
  let ripkeSumV = 0;
  for (const r of ripke) {
    const v = Math.max(0, (r.qtd_ofs | 0), (r.num_ofs | 0), (r.qtd_of | 0), (r.of_count | 0), (r.total_ofs | 0));
    if (v > ripkeMax) ripkeMax = v;
    const vl = Number(r.total_valor || r.valor || r.vl_total || 0);
    if (!isNaN(vl)) ripkeSumV += vl;
  }
  const deduped = [...new Map(all.map(x => [String(x.id || ('rand_' + Math.random())), x])).values()];
  const out = {
    pages: prog,
    totalRaw: total,
    totalDeduped: deduped.length,
    ripkeMatches: ripke.length,
    ripkeMaxQtdOfs: ripkeMax,
    ripkeSumValor: Number(ripkeSumV.toFixed(2)),
    ripkeSample: ripke.slice(0, 3).map(x => ({
      id: x.id, nome: x.nome || x.clinome || '',
      qtd_ofs: x.qtd_ofs, qtd_of: x.qtd_of, num_ofs: x.num_ofs, of_count: x.of_count, total_ofs: x.total_ofs,
      total_valor: x.total_valor, valor: x.valor, vl_total: x.vl_total,
      empId: x.empId, cidade: x.cidade, uf: x.uf
    }))
  };
  fs.writeFileSync(OUT + '.json', JSON.stringify(out, null, 2));
  process.stdout.write('WROTE ' + OUT + '.json size=' + fs.statSync(OUT + '.json').size + '\n');
})().catch(e => { fs.writeFileSync(OUT + '.err.txt', String(e.stack || e.message || e)); process.stdout.write('FATAL ' + String(e.message || e) + '\n'); });
