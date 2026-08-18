const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAzNzUwMjhkLTc2NTItNDhjNS05MTZjLTNhMzI1ZDcyYjRlMiIsIm5vbWUiOiJBRElNSU5JU1RSQURPUiIsImVtYWlsIjoiaXRhbHkiLCJwZXJmaWwiOiJhZG1pbiIsInBlcm1pc3NvZXMiOlsidHVkbyJdLCJhdmF0YXJfdXJsIjoiaHR0cHM6Ly91YnlnanF4a2ZsZmFjaHRsb2dkdy5zdXBhYmFzZS5jby9zdG9yYWdlL3YxL29iamVjdC9wdWJsaWMvY2hhdC1hcnF1aXZvcy9hdmF0YXJlcy8wMzc1MDI4ZC03NjUyLTQ4YzUtOTE2Yy0zYTMyNWQ3MmI0ZTIuanBnP3Y9MTc4MDQxMTMzODY0NiIsImlhdCI6MTc4NjYyOTc1MiwiZXhwIjoxNzg5MjIxNzUyfQ.o92KGHEY04rJ390cmd4eroZUxijy92NXKIKf7Qi9kEI";

const chunkLimit = 500;
const maxPages = 5;
const all = [];
const prog = [];

(async () => {
  for (let page = 0; page < maxPages; page++) {
    const t = Date.now() + "_" + page;
    const url = "https://adm.italyembalagens.com.br/api/clientes?lite=1&limit=" + chunkLimit + "&offset=" + (page * chunkLimit) + "&nocache=1&order=created_at&dir=desc&t=" + t;
    try {
      const resp = await fetch(url, {
        method: "GET",
        headers: { "Authorization": "Bearer " + token },
        signal: AbortSignal.timeout(45000)
      });
      let json;
      try { json = await resp.json(); } catch (e) { json = { parseErr: String(e.message || e) }; }
      let arr = [];
      if (json && json.ok && Array.isArray(json.data)) arr = json.data;
      else if (Array.isArray(json && json.data)) arr = json.data;
      prog.push({
        page: page,
        arr: arr.length,
        status: resp.status,
        ok: json ? json.ok : null,
        err: json ? json.err || json.error : null,
        firstId: arr.length ? arr[0].id : null,
        lastId: arr.length ? arr[arr.length - 1].id : null,
        keys: arr.length ? Object.keys(arr[0]).slice(0, 15) : []
      });
      for (let j = 0; j < arr.length; j++) all.push(arr[j]);
      if (arr.length < chunkLimit) break;
    } catch (e) {
      prog.push({ page: page, arr: -1, ok: false, err: String(e.message || e) });
      break;
    }
  }

  const total = all.length;
  const ripke = all.filter(x => String(x && x.nome || x && x.clinome || x && x.razao_social || "").toUpperCase().includes("RIPKE"));
  let ripkeMax = 0;
  let ripkeSumV = 0;
  for (const r of ripke) {
    const v = Math.max(
      Number(r.qtd_ofs || 0) | 0,
      Number(r.num_ofs || 0) | 0,
      Number(r.qtd_of || 0) | 0,
      Number(r.of_count || 0) | 0,
      Number(r.total_ofs || 0) | 0
    );
    if (v > ripkeMax) ripkeMax = v;
    const vl = Number(r.total_valor || r.valor || r.vl_total || 0);
    if (!isNaN(vl)) ripkeSumV += vl;
  }
  const out = {
    pages: prog,
    total: total,
    ripkeMatches: ripke.length,
    ripkeMaxQtdOfs: ripkeMax,
    ripkeSumValor: ripkeSumV.toFixed(2),
    ripkeSample: ripke.slice(0, 2).map(x => ({
      id: x.id, nome: x.nome || x.clinome,
      qtd_ofs: x.qtd_ofs, qtd_of: x.qtd_of, num_ofs: x.num_ofs, of_count: x.of_count, total_ofs: x.total_ofs,
      total_valor: x.total_valor, valor: x.valor, vl_total: x.vl_total,
      empId: x.empId, cidade: x.cidade, uf: x.uf
    }))
  };
  console.log(JSON.stringify(out, null, 2));
})();
