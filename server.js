const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

function loadDotEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const l = String(line || '').trim();
      if (!l || l.startsWith('#')) return;
      const i = l.indexOf('=');
      if (i <= 0) return;
      const k = l.slice(0, i).trim();
      let v = l.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    });
  } catch (e) {}
}

function loadEnv() {
  try {
    require('dotenv').config();
  } catch (e) {}
  loadDotEnv();
}

loadEnv();

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE;
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;
}

function extractFrontSupabaseConfig() {
  try {
    const htmlPath = path.join(__dirname, 'index.html');
    if (!fs.existsSync(htmlPath)) return null;
    const raw = fs.readFileSync(htmlPath, 'utf8');
    const urlMatch = raw.match(/\bconst\s+SUPABASE_URL\s*=\s*(['"`])([^'"`]+)\1/);
    const keyMatch = raw.match(/\bconst\s+SUPABASE_KEY\s*=\s*(['"`])([^'"`]+)\1/);
    const url = urlMatch ? String(urlMatch[2] || '').trim() : '';
    const key = keyMatch ? String(keyMatch[2] || '').trim() : '';
    if (!url || !key) return null;
    if (url.includes('SEU_PROJETO') || key.includes('SUA_CHAVE')) return null;
    return { url, key };
  } catch (e) {
    return null;
  }
}

const frontSb = extractFrontSupabaseConfig();
const supabaseUrl = process.env.SUPABASE_URL || (frontSb ? frontSb.url : null);
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  (frontSb ? frontSb.key : null);
const supabaseKeySource = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? 'SUPABASE_SERVICE_ROLE_KEY'
  : (process.env.SUPABASE_KEY
    ? 'SUPABASE_KEY'
    : (process.env.SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' : (frontSb ? 'index.html:SUPABASE_KEY' : null)));

let supabase = null;
let _supabaseEnvOk = true;
const _supabaseMissing = [];

if (!supabaseUrl) { _supabaseEnvOk = false; _supabaseMissing.push('SUPABASE_URL'); }
if (!supabaseKey) { _supabaseEnvOk = false; _supabaseMissing.push('SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_KEY ou SUPABASE_ANON_KEY'); }

if (!_supabaseEnvOk) {
  console.error('Erro: variáveis do Supabase ausentes.');
  console.error('Esperado no ambiente (TRAE/deploy):');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (recomendado) ou SUPABASE_KEY ou SUPABASE_ANON_KEY');
  console.error('- (fallback) SUPABASE_ANON_KEY');
  console.error('Faltando:', _supabaseMissing.join(', '));
  console.error('Status detectado:');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.error('SUPABASE_KEY:', !!process.env.SUPABASE_KEY);
  console.error('SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
  console.error('index.html fallback:', !!frontSb);
  process.exit(1);
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase conectado:', supabaseUrl);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    supabase: {
      configured: !!supabase,
      url: !!supabaseUrl,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasKey: !!process.env.SUPABASE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasIndexHtmlFallback: !!frontSb,
      keySource: supabaseKeySource,
      missing: _supabaseMissing,
    },
  });
});

function ok(res, data) {
  res.json({ ok: true, data });
}

function err(res, e) {
  const isPlainObject = (v) => v && typeof v === 'object' && (v.constructor === Object || Object.getPrototypeOf(v) === null);
  let errorText = '';
  let meta = null;

  try {
    if (typeof e === 'string') errorText = e;
    else if (e instanceof Error) errorText = e.message || String(e);
    else if (e && typeof e === 'object' && typeof e.message === 'string') errorText = e.message;
    else errorText = String(e);
  } catch (_) {
    errorText = 'Erro desconhecido';
  }

  try {
    if (e instanceof Error) meta = { name: e.name, message: e.message, stack: e.stack };
    else if (isPlainObject(e)) meta = e;
    else if (e && typeof e === 'object') meta = { ...e };
  } catch (_) {}

  console.error('API error:', errorText);
  if (meta) console.error('API error meta:', meta);
  res.json({ ok: false, error: errorText, meta });
}

function bad(res, error) {
  err(res, error);
}

async function selectAll(table, orderBy) {
  if (!supabase) throw new Error('Supabase não configurado no ambiente. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY).');
  let q = supabase.from(table).select('*');
  if (orderBy) q = q.order(orderBy, { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function insertOne(table, row) {
  if (!supabase) throw new Error('Supabase não configurado no ambiente. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY).');
  const { data, error } = await supabase.from(table).insert([row]).select('*').limit(1);
  if (error) throw error;
  return (data && data[0]) || null;
}

async function updateOne(table, id, row) {
  if (!supabase) throw new Error('Supabase não configurado no ambiente. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY).');
  const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').limit(1);
  if (error) throw error;
  return (data && data[0]) || null;
}

async function deleteOne(table, id) {
  if (!supabase) throw new Error('Supabase não configurado no ambiente. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY).');
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

function ofIn(p) {
  const out = { ...p };
  const has = (k) => Object.prototype.hasOwnProperty.call(p || {}, k);
  if (has('maq')) {
    out.maq = Array.isArray(p.maq) ? JSON.stringify(p.maq) : (typeof p.maq === 'string' ? p.maq : '[]');
  }
  if (has('imgs')) {
    out.imgs = Array.isArray(p.imgs) ? JSON.stringify(p.imgs) : (typeof p.imgs === 'string' ? p.imgs : '[]');
  }
  const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (out.empresa_id && !isUuid(out.empresa_id)) {
    if (!out.emp_id) out.emp_id = out.empresa_id;
    delete out.empresa_id;
  }
  if (out.cliente_id && !isUuid(out.cliente_id)) {
    if (!out.cli_id) out.cli_id = out.cliente_id;
    delete out.cliente_id;
  }
  return out;
}

function clientesIn(p) {
  const tel = p.tel !== undefined ? p.tel : p.fone;
  const out = { ...p };
  if (tel !== undefined) out.tel = tel;
  if (out.vend_id !== undefined && out.vendedor_id === undefined) out.vendedor_id = out.vend_id;
  if (out.vendedorId !== undefined && out.vendedor_id === undefined) out.vendedor_id = out.vendedorId;
  delete out.fone;
  delete out.vend_id;
  delete out.vendedorId;
  return out;
}

function fornecedoresIn(p) {
  const tel = p.tel !== undefined ? p.tel : p.fone;
  const end = p.end !== undefined ? p.end : p.endereco;
  const out = { ...p };
  if (tel !== undefined) out.tel = tel;
  if (end !== undefined) out.end = end;
  delete out.fone;
  delete out.endereco;
  return out;
}

function vendedoresIn(p) {
  const tel = p.tel !== undefined ? p.tel : p.fone;
  const reg = p.reg !== undefined ? p.reg : p.registro;
  const out = { ...p };
  if (tel !== undefined) out.tel = tel;
  if (reg !== undefined) out.reg = reg;
  delete out.fone;
  delete out.registro;
  return out;
}

app.get('/api/ofs', async (req, res) => {
  try {
    const from = req.query.from ? String(req.query.from) : '';
    const to = req.query.to ? String(req.query.to) : '';
    if (from || to) {
      const fields = ['data_producao', 'dia', 'created_at'];
      let lastError = null;
      for (const field of fields) {
        let q = supabase.from('ofs').select('*').order('seq', { ascending: true });
        if (from) q = q.gte(field, from);
        if (to) q = q.lte(field, to);
        const { data, error } = await q;
        if (!error) return ok(res, data || []);
        lastError = error;
        const msg = String(error.message || error);
        if (!msg.includes('column')) break;
      }
      throw lastError;
    }
    ok(res, await selectAll('ofs', 'seq'));
  } catch (e) { bad(res, e.message); }
});
app.post('/api/ofs', async (req, res) => {
  try { ok(res, await insertOne('ofs', ofIn(req.body || {}))); } catch (e) { bad(res, e.message); }
});
app.put('/api/ofs/:id', async (req, res) => {
  try { ok(res, await updateOne('ofs', req.params.id, ofIn(req.body || {}))); } catch (e) { bad(res, e.message); }
});
app.delete('/api/ofs/:id', async (req, res) => {
  try { await deleteOne('ofs', req.params.id); ok(res, true); } catch (e) { bad(res, e.message); }
});

// ══════════════════════════════════════════════════════════════
// CLIENTES
// ══════════════════════════════════════════════════════════════
app.get('/api/clientes', async (req, res) => {
  try {
    const { data, error } = await supabase.from('clientes').select('*').order('nome');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const payload = clientesIn(req.body || {});
    let { data, error } = await supabase.from('clientes').insert([payload]).select();
    if (error) {
      const msg = String(error.message || error);
      if (msg.includes("vendedor_id") || msg.includes("vendedor")) {
        delete payload.vendedor_id;
        delete payload.vendedor;
        ({ data, error } = await supabase.from('clientes').insert([payload]).select());
      }
    }
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const payload = clientesIn({ ...(req.body || {}) }); delete payload.id;
    let { data, error } = await supabase.from('clientes').update(payload).eq('id', req.params.id).select();
    if (error) {
      const msg = String(error.message || error);
      if (msg.includes("vendedor_id") || msg.includes("vendedor")) {
        delete payload.vendedor_id;
        delete payload.vendedor;
        ({ data, error } = await supabase.from('clientes').update(payload).eq('id', req.params.id).select());
      }
    }
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('clientes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// VENDEDORES
// ══════════════════════════════════════════════════════════════
app.get('/api/vendedores', async (req, res) => {
  try {
    const { data, error } = await supabase.from('vendedores').select('*').order('nome');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/vendedores', async (req, res) => {
  try {
    const { data, error } = await supabase.from('vendedores').insert([vendedoresIn(req.body || {})]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/vendedores/:id', async (req, res) => {
  try {
    const payload = vendedoresIn({ ...(req.body || {}) }); delete payload.id;
    const { data, error } = await supabase.from('vendedores')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/vendedores/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('vendedores').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// EMPRESAS
// ══════════════════════════════════════════════════════════════
app.get('/api/empresas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('empresas').select('*').order('nome');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.get('/api/orcamentos', async (req, res) => {
  try { ok(res, await selectAll('orcamentos', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/orcamentos', async (req, res) => {
  try { ok(res, await insertOne('orcamentos', req.body || {})); } catch (e) { bad(res, e.message); }
});
app.put('/api/orcamentos/:id', async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    delete payload.id;
    ok(res, await updateOne('orcamentos', req.params.id, payload));
  } catch (e) { bad(res, e.message); }
});
app.delete('/api/orcamentos/:id', async (req, res) => {
  try { await deleteOne('orcamentos', req.params.id); ok(res, true); } catch (e) { bad(res, e.message); }
});

// ══════════════════════════════════════════════════════════════
// APONTAMENTOS
// ══════════════════════════════════════════════════════════════
app.get('/api/apontamentos', async (req, res) => {
  try {
    const { data, error } = await supabase.from('apontamentos')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/apontamentos', async (req, res) => {
  try {
    const { data, error } = await supabase.from('apontamentos').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/apontamentos/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('apontamentos')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// OPERADORES
// ══════════════════════════════════════════════════════════════
app.get('/api/operadores', async (req, res) => {
  try {
    const { data, error } = await supabase.from('operadores').select('*').order('nome');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/operadores', async (req, res) => {
  try {
    const { data, error } = await supabase.from('operadores').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/operadores/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('operadores')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/operadores/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('operadores').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// MÁQUINAS
// ══════════════════════════════════════════════════════════════
app.get('/api/maquinas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('maquinas').select('*');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/maquinas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('maquinas').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/maquinas/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('maquinas')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/maquinas/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('maquinas').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// FLUXOS
// ══════════════════════════════════════════════════════════════
app.get('/api/fluxos', async (req, res) => {
  try {
    const { data, error } = await supabase.from('fluxos').select('*').order('nome');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/fluxos', async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    if (Array.isArray(payload.etapas)) payload.etapas = JSON.stringify(payload.etapas);
    const { data, error } = await supabase.from('fluxos').insert([payload]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/fluxos/:id', async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    delete payload.id;
    if (Array.isArray(payload.etapas)) payload.etapas = JSON.stringify(payload.etapas);
    const { data, error } = await supabase.from('fluxos').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/fluxos/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('fluxos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// COMPRAS
// ══════════════════════════════════════════════════════════════
app.get('/api/compras', async (req, res) => {
  try {
    const { data, error } = await supabase.from('compras')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/compras', async (req, res) => {
  try {
    const { data, error } = await supabase.from('compras').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/compras/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('compras')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/compras/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('compras').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// FORNECEDORES
// ══════════════════════════════════════════════════════════════
app.get('/api/fornecedores', async (req, res) => {
  try {
    const { data, error } = await supabase.from('fornecedores').select('*').order('nome');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/fornecedores', async (req, res) => {
  try {
    const { data, error } = await supabase.from('fornecedores').insert([fornecedoresIn(req.body || {})]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/fornecedores/:id', async (req, res) => {
  try {
    const payload = fornecedoresIn({ ...(req.body || {}) }); delete payload.id;
    const { data, error } = await supabase.from('fornecedores')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/fornecedores/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('fornecedores').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// INCONFORMIDADES
// ══════════════════════════════════════════════════════════════
app.get('/api/inconformidades', async (req, res) => {
  try {
    const { data, error } = await supabase.from('inconformidades')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/inconformidades', async (req, res) => {
  try {
    const { data, error } = await supabase.from('inconformidades').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/inconformidades/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('inconformidades')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/inconformidades/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('inconformidades').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// NOTAS FISCAIS
// ══════════════════════════════════════════════════════════════
app.get('/api/notas_fiscais', async (req, res) => {
  try {
    const { data, error } = await supabase.from('notas_fiscais')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/notas_fiscais', async (req, res) => {
  try {
    const payload = { ...req.body };
    if(Array.isArray(payload.itens)) payload.itens = JSON.stringify(payload.itens);
    const { data, error } = await supabase.from('notas_fiscais').insert([payload]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/notas_fiscais/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    if(Array.isArray(payload.itens)) payload.itens = JSON.stringify(payload.itens);
    const { data, error } = await supabase.from('notas_fiscais')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/notas_fiscais/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('notas_fiscais').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

app.get('/api/estoque', async (req, res) => {
  try {
    const { data, error } = await supabase.from('estoque').select('*').order('nome');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/estoque', async (req, res) => {
  try {
    const { data, error } = await supabase.from('estoque').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/estoque/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('estoque')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/estoque/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('estoque').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// FACAS ESTOQUE
// ══════════════════════════════════════════════════════════════
app.get('/api/facas_estoque', async (req, res) => {
  try {
    const { data, error } = await supabase.from('facas_estoque').select('*').order('nome');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});
app.post('/api/facas_estoque', async (req, res) => {
  try {
    const { data, error } = await supabase.from('facas_estoque').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});
app.put('/api/facas_estoque/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('facas_estoque').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});
app.delete('/api/facas_estoque/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('facas_estoque').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// CLICHÊS ESTOQUE
// ══════════════════════════════════════════════════════════════
app.get('/api/cliches_estoque', async (req, res) => {
  try {
    const { data, error } = await supabase.from('cliches_estoque').select('*').order('nome');
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});
app.post('/api/cliches_estoque', async (req, res) => {
  try {
    const { data, error } = await supabase.from('cliches_estoque').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});
app.put('/api/cliches_estoque/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('cliches_estoque').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});
app.delete('/api/cliches_estoque/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('cliches_estoque').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// CHAPAS ESTOQUE
// ══════════════════════════════════════════════════════════════
app.get('/api/chapas_estoque', async (req, res) => {
  try {
    const tables = ['chapas_estoque', 'estoque_chapas', 'estoque'];
    let lastErr = null;
    for (const t of tables) {
      const { data, error } = await supabase.from(t).select('*').order('nome');
      if (!error) return ok(res, data);
      lastErr = error;
      const msg = String(error.message || error);
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});
app.post('/api/chapas_estoque', async (req, res) => {
  try {
    const tables = ['chapas_estoque', 'estoque_chapas', 'estoque'];
    let lastErr = null;
    for (const t of tables) {
      const input = req.body || {};
      const tryInsert = async (payload) => supabase.from(t).insert([payload]).select();

      let { data, error } = await tryInsert(input);
      if (!error) return ok(res, data[0]);
      lastErr = error;

      const msg = String(error.message || error);
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) continue;
      if (msg.includes('column') || msg.includes('Could not find')) {
        const payload = { ...input };
        delete payload.forn;
        delete payload.valor_unitario;
        delete payload.valorUnitario;
        ({ data, error } = await tryInsert(payload));
        if (!error) return ok(res, data[0]);
        lastErr = error;
      }
      throw lastErr;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});
app.put('/api/chapas_estoque/:id', async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const tables = ['chapas_estoque', 'estoque_chapas', 'estoque'];
    let lastErr = null;
    for (const t of tables) {
      const tryUpdate = async (p) => supabase.from(t).update(p).eq('id', req.params.id).select();
      let { data, error } = await tryUpdate(payload);
      if (!error) return ok(res, data[0]);
      lastErr = error;
      const msg = String(error.message || error);
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) continue;
      if (msg.includes('column') || msg.includes('Could not find')) {
        const p = { ...payload };
        delete p.forn;
        delete p.valor_unitario;
        delete p.valorUnitario;
        ({ data, error } = await tryUpdate(p));
        if (!error) return ok(res, data[0]);
        lastErr = error;
      }
      throw lastErr;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});
app.delete('/api/chapas_estoque/:id', async (req, res) => {
  try {
    const tables = ['chapas_estoque', 'estoque_chapas', 'estoque'];
    let lastErr = null;
    for (const t of tables) {
      const { error } = await supabase.from(t).delete().eq('id', req.params.id);
      if (!error) return res.json({ ok: true });
      lastErr = error;
      const msg = String(error.message || error);
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});

app.post('/api/chapas_estoque/reset', async (req, res) => {
  try {
    console.log('chapas_estoque/reset body type:', Array.isArray(req.body) ? 'array' : typeof req.body);
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      console.log('chapas_estoque/reset body keys:', Object.keys(req.body).slice(0, 20));
    }
    const tables = ['chapas_estoque', 'estoque_chapas', 'estoque'];
    let lastErr = null;

    const resolveTable = async () => {
      for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (!error) return t;
        lastErr = error;
        const msg = String(error.message || error);
        if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) continue;
        throw error;
      }
      throw lastErr;
    };

    const t = await resolveTable();
    const items = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.items) ? req.body.items : []);
    console.log('chapas_estoque/reset items:', Array.isArray(items) ? items.length : 'not_array');
    if (!Array.isArray(items) || items.length === 0) return bad(res, 'items vazio');

    const toNum = (v, fallback = 0) => {
      if (v == null || v === '') return fallback;
      if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
      const s0 = String(v).trim().replace(/R\$/gi, '').replace(/\s+/g, '');
      const s = s0.includes(',') ? s0.replace(/\./g, '').replace(',', '.') : s0;
      const n = Number(s);
      return Number.isFinite(n) ? n : fallback;
    };

    const hasCol = async (col) => {
      const { error } = await supabase.from(t).select(col).limit(1);
      if (!error) return true;
      const msg = String(error.message || error);
      if (msg.includes('column') || msg.includes('Could not find')) return false;
      throw error;
    };

    const cols = {
      forn: await hasCol('forn'),
      fornecedor: await hasCol('fornecedor'),
      tipo_papel: await hasCol('tipo_papel'),
      modelo: await hasCol('modelo'),
      nom: await hasCol('nom'),
      codigo: await hasCol('codigo'),
      tam: await hasCol('tam'),
      tamanho: await hasCol('tamanho'),
      nome: await hasCol('nome'),
      descricao: await hasCol('descricao'),
      quantidade: await hasCol('quantidade'),
      quantidade_atual: await hasCol('quantidade_atual'),
      qtd: await hasCol('qtd'),
      saldo: await hasCol('saldo'),
      valor_unitario: await hasCol('valor_unitario'),
      custo_unitario: await hasCol('custo_unitario'),
      val: await hasCol('val'),
      valor_total: await hasCol('valor_total'),
      total: await hasCol('total'),
      vtot: await hasCol('vtot')
    };

    const requested = items.length;
    const normalized = items.map((it) => {
      const fornecedor = it.fornecedor ?? it.forn ?? it.FORNECEDOR ?? '';
      const nomenclatura = it.nomenclatura ?? it.tipo_papel ?? it.NOMENCLATURA ?? '';
      const tamanho = it.tamanho ?? it.TAMANHO ?? '';
      const nome = it.nome ?? it.NOME ?? '';
      const quantidade = toNum(it.quantidade ?? it.quantidade_atual ?? it.QUANTIDADE ?? 0, 0);
      const valor_unitario = toNum(it.valor_unitario ?? it.valorUnitario ?? it['R$'] ?? it.VALOR ?? 0, 0);
      const qInt = Math.trunc(quantidade) || 0;
      const vUnit = Number(valor_unitario) || 0;
      const vTot = qInt * vUnit;

      const out = {};

      const forn = String(fornecedor || '').trim();
      const code = String(nomenclatura || '').trim();
      const desc = (String(nome || '').trim() || code);
      const tamRaw = String(tamanho || '').trim();

      if (cols.forn) out.forn = forn;
      else if (cols.fornecedor) out.fornecedor = forn;

      if (cols.tipo_papel) out.tipo_papel = code;
      else if (cols.modelo) out.modelo = code;
      else if (cols.nom) out.nom = code;
      else if (cols.codigo) out.codigo = code;

      if (cols.tamanho) out.tamanho = tamRaw;
      else if (cols.tam) out.tam = tamRaw;

      if (cols.nome) out.nome = desc;
      else if (cols.descricao) out.descricao = desc;

      if (cols.quantidade) out.quantidade = qInt;
      else if (cols.quantidade_atual) out.quantidade_atual = qInt;
      else if (cols.qtd) out.qtd = qInt;
      else if (cols.saldo) out.saldo = qInt;

      if (cols.valor_unitario) out.valor_unitario = vUnit;
      else if (cols.custo_unitario) out.custo_unitario = vUnit;
      else if (cols.val) out.val = vUnit;

      return {
        _key: `${code.trim().toUpperCase()}|${tamRaw.replace(/\s+/g,'').toUpperCase()}`,
        _valid: !!(code && tamRaw),
        _q: qInt,
        _vunit: vUnit,
        _vtot: vTot,
        out
      };
    }).filter((x) => x._valid);

    const map = new Map();
    normalized.forEach((x) => {
      map.set(x._key, x);
    });
    const clean = Array.from(map.values()).map((x) => {
      const out = { ...x.out };
      delete out.valor_total;
      delete out.total;
      delete out.vtot;
      return out;
    });
    const invalid = requested - normalized.length;
    const duplicates = normalized.length - clean.length;

    const delFilter = '00000000-0000-0000-0000-000000000000';
    const { error: delErr } = await supabase.from(t).delete().neq('id', delFilter);
    if (delErr) throw delErr;

    const chunkSize = 500;
    let inserted = 0;
    for (let i = 0; i < clean.length; i += chunkSize) {
      const chunk = clean.slice(i, i + chunkSize);
      const { error } = await supabase.from(t).insert(chunk);
      if (error) throw error;
      inserted += chunk.length;
    }

    const saved_fields = [...new Set(clean.flatMap((r) => Object.keys(r)))].sort();
    ok(res, { deleted: true, table: t, requested, valid: normalized.length, invalid, duplicates, inserted, saved_fields });
  } catch (e) { err(res, e); }
});

app.get('/api/hist_estoque', async (req, res) => {
  try {
    const { data, error } = await supabase.from('hist_estoque')
      .select('*').order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/hist_estoque', async (req, res) => {
  try {
    const { data, error } = await supabase.from('hist_estoque').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.post('/api/log', async (req, res) => {
  ok(res, true);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
