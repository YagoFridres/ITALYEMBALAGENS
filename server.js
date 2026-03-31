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
if (!supabaseKey) { _supabaseEnvOk = false; _supabaseMissing.push('SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_KEY'); }

if (!_supabaseEnvOk) {
  console.error('Erro: variáveis do Supabase ausentes.');
  console.error('Esperado no ambiente (TRAE/deploy):');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (recomendado) ou SUPABASE_KEY');
  console.error('- (fallback) SUPABASE_ANON_KEY');
  console.error('Faltando:', _supabaseMissing.join(', '));
  console.error('Status detectado:');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.error('SUPABASE_KEY:', !!process.env.SUPABASE_KEY);
  console.error('SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
  console.error('index.html fallback:', !!frontSb);
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase conectado:', supabaseUrl);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname)));

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

function bad(res, error) {
  res.json({ ok: false, error: String(error || 'Erro') });
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
  const maq = Array.isArray(p.maq) ? JSON.stringify(p.maq) : (typeof p.maq === 'string' ? p.maq : '[]');
  const imgs = Array.isArray(p.imgs) ? JSON.stringify(p.imgs) : (typeof p.imgs === 'string' ? p.imgs : '[]');
  return { ...p, maq, imgs };
}

function clientesIn(p) {
  const tel = p.tel !== undefined ? p.tel : p.fone;
  return { ...p, tel };
}

function fornecedoresIn(p) {
  const tel = p.tel !== undefined ? p.tel : p.fone;
  return { ...p, tel };
}

app.get('/api/ofs', async (req, res) => {
  try { ok(res, await selectAll('ofs', 'seq')); } catch (e) { bad(res, e.message); }
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

app.get('/api/clientes', async (req, res) => {
  try { ok(res, await selectAll('clientes', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/clientes', async (req, res) => {
  try { ok(res, await insertOne('clientes', clientesIn(req.body || {}))); } catch (e) { bad(res, e.message); }
});
app.put('/api/clientes/:id', async (req, res) => {
  try { ok(res, await updateOne('clientes', req.params.id, clientesIn(req.body || {}))); } catch (e) { bad(res, e.message); }
});
app.delete('/api/clientes/:id', async (req, res) => {
  try { await deleteOne('clientes', req.params.id); ok(res, true); } catch (e) { bad(res, e.message); }
});

app.get('/api/vendedores', async (req, res) => {
  try { ok(res, await selectAll('vendedores', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/vendedores', async (req, res) => {
  try { ok(res, await insertOne('vendedores', req.body || {})); } catch (e) { bad(res, e.message); }
});
app.put('/api/vendedores/:id', async (req, res) => {
  try { ok(res, await updateOne('vendedores', req.params.id, req.body || {})); } catch (e) { bad(res, e.message); }
});
app.delete('/api/vendedores/:id', async (req, res) => {
  try { await deleteOne('vendedores', req.params.id); ok(res, true); } catch (e) { bad(res, e.message); }
});

app.get('/api/orcamentos', async (req, res) => {
  try { ok(res, await selectAll('orcamentos', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/orcamentos', async (req, res) => {
  try { ok(res, await insertOne('orcamentos', req.body || {})); } catch (e) { bad(res, e.message); }
});
app.put('/api/orcamentos/:id', async (req, res) => {
  try { ok(res, await updateOne('orcamentos', req.params.id, req.body || {})); } catch (e) { bad(res, e.message); }
});
app.delete('/api/orcamentos/:id', async (req, res) => {
  try { await deleteOne('orcamentos', req.params.id); ok(res, true); } catch (e) { bad(res, e.message); }
});

app.get('/api/apontamentos', async (req, res) => {
  try { ok(res, await selectAll('apontamentos', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/apontamentos', async (req, res) => {
  try { ok(res, await insertOne('apontamentos', req.body || {})); } catch (e) { bad(res, e.message); }
});

app.get('/api/operadores', async (req, res) => {
  try { ok(res, await selectAll('operadores', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/operadores', async (req, res) => {
  try { ok(res, await insertOne('operadores', req.body || {})); } catch (e) { bad(res, e.message); }
});

app.get('/api/maquinas', async (req, res) => {
  try { ok(res, await selectAll('maquinas', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/maquinas', async (req, res) => {
  try { ok(res, await insertOne('maquinas', req.body || {})); } catch (e) { bad(res, e.message); }
});

app.get('/api/compras', async (req, res) => {
  try { ok(res, await selectAll('compras', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/compras', async (req, res) => {
  try { ok(res, await insertOne('compras', req.body || {})); } catch (e) { bad(res, e.message); }
});

app.get('/api/fornecedores', async (req, res) => {
  try { ok(res, await selectAll('fornecedores', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/fornecedores', async (req, res) => {
  try { ok(res, await insertOne('fornecedores', fornecedoresIn(req.body || {}))); } catch (e) { bad(res, e.message); }
});

app.get('/api/inconformidades', async (req, res) => {
  try { ok(res, await selectAll('inconformidades', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/inconformidades', async (req, res) => {
  try { ok(res, await insertOne('inconformidades', req.body || {})); } catch (e) { bad(res, e.message); }
});

app.get('/api/notas_fiscais', async (req, res) => {
  try { ok(res, await selectAll('notas_fiscais', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/notas_fiscais', async (req, res) => {
  try { ok(res, await insertOne('notas_fiscais', req.body || {})); } catch (e) { bad(res, e.message); }
});

app.get('/api/estoque', async (req, res) => {
  try { ok(res, await selectAll('estoque', 'created_at')); } catch (e) { bad(res, e.message); }
});

app.get('/api/hist_estoque', async (req, res) => {
  try { ok(res, await selectAll('hist_estoque', 'created_at')); } catch (e) { bad(res, e.message); }
});
app.post('/api/hist_estoque', async (req, res) => {
  try {
    const p = req.body || {};
    const row = {
      tipo: p.tipo || '',
      chp: p.item_id || p.chp || '',
      qtd: Number(p.qtd || 0),
      of_num: p.of_num || '',
      data: p.data || new Date().toISOString().slice(0, 10),
      obs: p.motivo || p.obs || '',
      emp_id: p.emp_id || '',
    };
    ok(res, await insertOne('hist_estoque', row));
  } catch (e) { bad(res, e.message); }
});

app.post('/api/log', async (req, res) => {
  ok(res, true);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
