const fs=require('fs');const path=require('path');const p=__dirname;
const UUID_RE=/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
function _isUuid(s){return UUID_RE.test(String(s||'').trim());}
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 \-]/g, ' ').trim();
const clientesMock = [
  { id: 'be617df1-1111-1111-1111-111111111111', nome: 'MÓVEIS RIPKE', codigo: '100', emp_id: 'E1', vendedor_id: 'b362b262-0b8f-40e3-865f-7eb5bfe226c8', ativo: true, rs: 'MÓVEIS RIPKE LTDA' },
  { id: '00000000-2222-2222-2222-222222222222', nome: 'RIPKE DISTRIBUIDORA', codigo: '101', emp_id: 'E1' },
  { id: '00000000-3333-3333-3333-333333333333', nome: 'RIPKE SERVIÇOS', codigo: '102', emp_id: 'E1' },
  { id: '00000000-4444-4444-4444-444444444444', nome: 'ROTOPLAST', codigo: '103', emp_id: 'E1' },
  { id: '00000000-5555-5555-5555-555555555555', nome: 'RUIZ', codigo: '104', emp_id: 'E1' },
  { id: '00000000-6666-6666-6666-666666666666', nome: 'DKADI', codigo: '105', emp_id: 'E2' },
];
// BACKEND
function _buscarBackend(arr, id, empId){
  id = String(id || '').trim();
  if (!id) return null;
  empId = String(empId || 'E1').toUpperCase();
  const filtra = (c) => !empId || String(c.emp_id || c.empresa_id || 'E1').toUpperCase() === empId;
  const tries = [];
  if (_isUuid(id)) tries.push({ col: 'id', modo: 'uuid' });
  tries.push({ col: 'codigo', modo: 'codigo' });
  if (!_isUuid(id)) tries.push({ col: 'id', modo: 'legacy' });
  const seen = new Set();
  for (const t of tries) {
    const k = t.col + ':' + id;
    if (seen.has(k)) continue;
    seen.add(k);
    const matchs = arr.filter(c => filtra(c) && String(c[t.col] || '').trim() === id);
    if (matchs.length === 1) return { registro: matchs[0], modo: t.modo };
  }
  if (id.length >= 2) {
    const cand = arr.filter(c => filtra(c));
    const tgt = norm(id);
    let exato = null, start = null, incl = [];
    for (const c of cand) {
      const n = norm(c?.nome || c?.rs || c?.razao_social || '');
      if (!n) continue;
      if (n === tgt) { if (!exato) exato = c; continue; }
      if (n.startsWith(tgt)) { if (!start) start = c; continue; }
      if (n.indexOf(tgt) >= 0) incl.push(c);
    }
    if (exato) return { registro: exato, modo: 'nome_exato' };
    if (start) return { registro: start, modo: 'nome_start' };
    if (incl.length === 1) return { registro: incl[0], modo: 'nome_incl_unico' };
    if (incl.length > 1) return { ambiguo: true, qtd: incl.length, candidatos: incl.slice(0,5), modo: 'nome_ambiguo' };
    if (cand.length === 1) return { registro: cand[0], modo: 'nome_unico' };
    return { ambiguo: true, qtd: cand.length, candidatos: cand.slice(0,5), modo: 'varios_cand' };
  }
  return null;
}
// FRONTEND
function _resolverFront(arr, texto, empLeg){
  texto = String(texto || '').trim();
  const out = { ok:false, id:'', nome:'', amb:0, msg:'', prio:null };
  if (!texto) { out.msg = 'Selecione um cliente'; return out; }
  const e = String(empLeg || 'E1').toUpperCase();
  const filtra = c => !e || String(c.emp_id || c.empresa_id || 'E1').toUpperCase() === e;
  const nomeC = c => String(c.nome || c.razao_social || c.rs || '').trim();
  const tgt = norm(texto);
  const ex=[],st=[],inc=[];
  for (const c of arr){ if (!filtra(c)) continue; const n = norm(nomeC(c)); if (!n) continue; if (n===tgt) ex.push(c); else if (n.startsWith(tgt)) st.push(c); else if (n.indexOf(tgt)>=0) inc.push(c); }
  if (ex.length===1){ out.ok=true; out.id=String(ex[0].id||''); out.nome=nomeC(ex[0]); out.prio='exato'; return out; }
  if (st.length===1){ out.ok=true; out.id=String(st[0].id||''); out.nome=nomeC(st[0]); out.prio='inicio'; return out; }
  if (ex.length>1||st.length>1){ out.amb=ex.length||st.length; out.msg='Ambiguidade '+out.amb; return out; }
  if (inc.length===1){ out.ok=true; out.id=String(inc[0].id||''); out.nome=nomeC(inc[0]); out.prio='contem'; return out; }
  if (inc.length>1){ out.amb=inc.length; out.msg='Ambiguidade parcial '+out.amb; return out; }
  out.msg='Nenhum cliente para "'+texto+'"'; return out;
}
const casos=[['A','MÓVEIS RIPKE','E1'],['B','moveis ripke','E1'],['C','moveis ripke xablau','E1'],['D','RIPKE','E1']];
const out = { feito_em: new Date().toISOString(), mock_qtd: clientesMock.length, casos: {} };
for (const [tag, t, e] of casos){
  const b = _buscarBackend(clientesMock, t, e);
  const f = _resolverFront(clientesMock, t, e);
  out.casos['CASO_'+tag] = {
    backend: b ? (b.registro ? { id: b.registro.id, nome: b.registro.nome, modo: b.modo } : { ambiguo: !!b.ambiguo, qtd: b.qtd, nomes: (b.candidatos||[]).map(c=>c.nome||'').join(' | ') }) : null,
    frontend: { ok: f.ok, id: f.id, nome: f.nome, prioridade: f.prio, ambiguidade: f.amb, mensagem: f.msg }
  };
}
try{fs.writeFileSync(path.join(p,'_PROVA_SIMPLES.json'),JSON.stringify(out,null,2));}catch(e){try{fs.writeFileSync(path.join(p,'_PROVA_SIMPLES_ERR.txt'),String(e?.message||e));}catch(_){}}
console.log(JSON.stringify(out, null, 2));
process.exit(0);
