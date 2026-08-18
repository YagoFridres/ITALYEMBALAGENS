const https=require('https');const fs=require('fs');const path=require('path');const jwt=require(path.join(__dirname,'node_modules/jsonwebtoken'));const T=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});const p=__dirname;
const GET=(u,tm)=>new Promise(R=>{const t0=Date.now();const hdr={Accept:'application/json','Cache-Control':'no-cache',Authorization:'Bearer '+T};const o={host:'adm.italyembalagens.com.br',port:443,path:u,method:'GET',headers:hdr,timeout:tm||60000};const rq=https.request(o,r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{let j;try{j=JSON.parse(b)}catch(e){j={pe:e.message,r:b.slice(0,3000)}};R({ms:Date.now()-t0,s:r.statusCode,j,raw:b.slice(0,4000)});});});rq.setTimeout(tm||60000,()=>{try{rq.destroy();}catch(_){}R({ne:'TIMEOUT',tm:Date.now()-t0});});rq.on('error',e=>R({ne:String(e?.message||e)}));rq.end();});
const UUID_RE=/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
function _isUuid(s){return UUID_RE.test(String(s||'').trim());}
function _clienteNomeValido(s){let r=String(s||'').trim();if(!r)return '';r=r.replace(/\s+/g,' ').trim();if(/^c\d{2,}(?:[_\-\s]*)$/i.test(r))return '';return r;}
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 \-]/g, ' ').trim();
// BACKEND resolver (idêntico lógico ao server.js, adaptado p/ array em memória)
function _buscarClienteRegistroOF(arr, cliId, opts = {}) {
  const id = String(cliId || '').trim();
  if (!id || !Array.isArray(arr)) return null;
  const empId = String(opts.empresa_id || opts.empId || '').trim();
  const filtraEmp = (c) => {
    if (!empId) return true;
    const e1 = String(c?.emp_id || c?.empId || c?.empresa_id || 'E1').trim().toUpperCase();
    return !e1 || e1 === empId.toUpperCase();
  };
  const tries = [];
  if (_isUuid(id)) tries.push({ column: 'id', value: id, modo: 'uuid' });
  tries.push({ column: 'codigo', value: id, modo: 'codigo' });
  if (!_isUuid(id)) tries.push({ column: 'id', value: id, modo: 'legacy_text_id' });
  const seen = new Set();
  for (const attempt of tries) {
    const key = String(attempt.column || '') + ':' + String(attempt.value || '');
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const col = attempt.column;
      const candidates = arr.filter(c => filtraEmp(c) && String(c?.[col] || '').trim() === attempt.value);
      if (Array.isArray(candidates) && candidates.length === 1) return { registro: candidates[0], modo: attempt.modo };
    } catch (_) {}
  }
  const refNorm = id;
  if (refNorm.length >= 2) {
    try {
      const candidatos = arr.filter(c => filtraEmp(c));
      if (Array.isArray(candidatos) && candidatos.length) {
        const tgt = norm(refNorm);
        let exato = null;
        let start = null;
        const inclui = [];
        for (const c of candidatos) {
          const n = norm(c?.nome || c?.rs || c?.razao_social || '');
          if (!n) continue;
          if (n === tgt) { if (!exato) exato = c; continue; }
          if (n.startsWith(tgt)) { if (!start) start = c; continue; }
          if (n.indexOf(tgt) >= 0) inclui.push(c);
        }
        if (exato) return { registro: exato, modo: 'nome_exato' };
        if (start) return { registro: start, modo: 'nome_startswith' };
        if (inclui.length === 1) return { registro: inclui[0], modo: 'nome_includes_unico' };
        if (inclui.length > 1) return { ambiguo: true, qtd: inclui.length, candidatos: inclui.slice(0, 10), modo: 'nome_ambiguo' };
        if (candidatos.length === 1) return { registro: candidatos[0], modo: 'nome_unico_match' };
        return { ambiguo: true, qtd: candidatos.length, candidatos: candidatos.slice(0, 10), modo: 'nome_ambiguo_varios' };
      }
    } catch (_) {}
  }
  return null;
}
function _resolverClienteIdentidadeOF(arr, raw, opts = {}) {
  const ref = String(raw || '').trim();
  if (!ref) return null;
  const found = _buscarClienteRegistroOF(arr, ref, opts);
  if (!found) return null;
  if (found.ambiguo) return { ambiguo: true, qtd: found.qtd, candidatos: (found.candidatos || []).map(c => ({ id: c.id, nome: c.nome, empresa: c.empresa_id || c.emp_id || null })), ref };
  const cli = found.registro || found;
  const id = String(cli?.id || '').trim();
  if (!id) return null;
  const nome = _clienteNomeValido(cli?.nome || cli?.rs || cli?.razao_social || cli?.razao || cli?.cliente_nome || '');
  return { id, codigo: String(cli?.codigo || '').trim(), nome, vendedor_id: String(cli?.vendedor_id || cli?.vendId || cli?.vend_id || '').trim() || null, empresa_id: String(cli?.empresa_id || cli?.empId || cli?.emp_id || '').trim() || null, modo_resolvido: String(found?.modo || 'direto') };
}
// FRONTEND resolver (idêntico ao index.html)
function _resolverClienteOFRapida(arr, textoDigitado, empresaLegado) {
  const texto = String(textoDigitado || '').trim();
  const out = { ok: false, cliente: null, id: '', nome: '', mensagem: '', ambiguidade: 0, prioridade: null };
  if (!texto) { out.mensagem = 'Selecione um cliente válido da lista para prosseguir.'; return out; }
  if (!Array.isArray(arr) || !arr.length) { out.mensagem = 'Lista de clientes ainda carregando...'; return out; }
  const empLeg = String(empresaLegado || 'E1').trim().toUpperCase();
  const filtraEmp = (c) => {
    if (!empLeg) return true;
    const e1 = String(c?.emp_id || c?.empId || c?.empresa_id || 'E1').trim().toUpperCase();
    if (!e1) return true;
    return e1 === empLeg;
  };
  const nomeC = (c) => String(c?.nome || c?.razao_social || c?.razao || c?.rs || c?.cliente_nome || '').trim();
  const tgt = norm(texto);
  const exatos = []; const starts = []; const incls = [];
  for (const c of arr) {
    try { if (!filtraEmp(c)) continue; } catch (_e) {}
    const n = norm(nomeC(c));
    if (!n) continue;
    if (n === tgt) exatos.push(c);
    else if (n.startsWith(tgt)) starts.push(c);
    else if (n.indexOf(tgt) >= 0) incls.push(c);
  }
  if (exatos.length === 1) { out.ok = true; out.cliente = exatos[0]; out.id = String(exatos[0].id || '').trim(); out.nome = nomeC(exatos[0]); out.prioridade = 'exato'; return out; }
  if (starts.length === 1) { out.ok = true; out.cliente = starts[0]; out.id = String(starts[0].id || '').trim(); out.nome = nomeC(starts[0]); out.prioridade = 'inicio'; return out; }
  if (exatos.length > 1 || starts.length > 1) { out.ambiguidade = (exatos.length || starts.length); out.mensagem = 'Digite mais caracteres — ' + out.ambiguidade + ' clientes corresponderam (selecione um da lista).'; return out; }
  if (incls.length === 1) { out.ok = true; out.cliente = incls[0]; out.id = String(incls[0].id || '').trim(); out.nome = nomeC(incls[0]); out.prioridade = 'contem'; return out; }
  if (incls.length > 1) { out.ambiguidade = incls.length; out.mensagem = `Digite mais caracteres — ${incls.length} clientes corresponderam parcialmente.`; return out; }
  out.mensagem = `Nenhum cliente encontrado para "${texto}". Digite e selecione um cliente da lista.`;
  return out;
}
( async () => {
  const out = { feito_em: new Date().toISOString(), fetch_clientes: null, qtd_clientes: 0, casos: {} };
  const r = await GET('/api/clientes?lite=1&limit=500', 60000);
  out.fetch_clientes = { status: r.s, ms: r.ms, erro: r?.j?.error || null };
  let arr = [];
  if (r.s === 200) {
    if (Array.isArray(r?.j?.data)) arr = r.j.data;
    else if (Array.isArray(r.j)) arr = r.j;
    else if (Array.isArray(r?.j?.clientes)) arr = r.j.clientes;
  }
  out.qtd_clientes = arr.length;
  // CASOS
  const casos = [
    ['A', 'MÓVEIS RIPKE', 'E1'],
    ['B', 'moveis ripke', 'E1'],
    ['C', 'moveis ripke xablau inexistente 123987', 'E1'],
    ['D', 'RIPKE', 'E1'],
  ];
  for (const [tag, texto, empId] of casos) {
    const back = _resolverClienteIdentidadeOF(arr, texto, { empresa_id: empId });
    const front = _resolverClienteOFRapida(arr, texto, empId);
    out.casos['CASO_'+tag+'_'+texto.replace(/[^a-zA-Z0-9]/g,'_')] = {
      backend: back ? { id: back.id || null, nome: back.nome || (back.ambiguo ? 'AMBIGUO_'+back.qtd : 'INEXISTENTE'), ambiguo: !!back.ambiguo, qtd: back.qtd || null, modo: back.modo_resolvido || null, candidatos: (back.candidatos || []).map(c=>c.nome || '').slice(0,5) } : 'NULL_INEXISTENTE',
      frontend: { ok: front.ok, id: front.id || null, nome: front.nome || null, prioridade: front.prioridade || null, ambiguidade: front.ambiguidade || 0, mensagem: front.mensagem || null }
    };
  }
  try{fs.writeFileSync(path.join(p,'_PROVA_LOCAL_RESOLVERS.json'),JSON.stringify(out,null,2));}catch(e){try{fs.writeFileSync(path.join(p,'_PROVA_LOCAL_ERR.txt'),String(e?.message||e));}catch(_){}}
  console.log(JSON.stringify({ qtd_cli: out.qtd_clientes, fetch_status: out.fetch_clientes.status, casos: Object.keys(out.casos).length }, null, 2));
  process.exit(0);
})().catch(e=>{try{fs.writeFileSync(path.join(p,'_PROVA_LOCAL_CATCH.txt'),String(e?.message||e));}catch(_){}process.exit(2);});
