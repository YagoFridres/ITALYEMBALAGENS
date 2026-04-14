const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');

function parseFluxo(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch (e) { return []; }
  }
  return [];
}

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
  console.log('✅ Supabase key:', supabaseKeySource, 'len:', (supabaseKey ? String(supabaseKey).length : 0), 'tipo provável:', (supabaseKey && String(supabaseKey).length > 200 ? 'SERVICE ROLE' : 'ANON/curta'));
}

const app = express();
app.set('etag', false);
app.use(cors());
app.use(express.json({ limit: '50mb' }));

function setNoCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) setNoCache(res);
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { etag: false, lastModified: false, setHeaders: setNoCache }));
app.use(express.static(__dirname, { etag: false, lastModified: false, setHeaders: setNoCache }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { etag: false, lastModified: false, setHeaders: setNoCache }));

app.get('/', (req, res) => {
  setNoCache(res);
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

const JWT_SECRET = process.env.JWT_SECRET || 'italy_secret_2026';

function authMiddleware(req, res, next) {
  const raw = String(req.headers.authorization || '');
  const token = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length).trim() : '';
  if (!token) return res.status(401).json({ ok: false, error: 'Não autorizado' });
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'Token inválido' });
  }
}

function requireAdmin(req, res, next) {
  const u = req.usuario || null;
  const perms = Array.isArray(u?.permissoes) ? u.permissoes : [];
  if (u?.perfil === 'admin' || perms.includes('tudo')) return next();
  return res.status(403).json({ ok: false, error: 'Sem permissão' });
}

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  if (req.method === 'OPTIONS') return next();
  if (req.path === '/api/health') return next();
  if (req.path === '/api/auth/login' || req.path === '/api/auth/login/') return next();
  return authMiddleware(req, res, next);
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

function initialsFromName(nome) {
  const parts = String(nome || '').trim().split(/\s+/g).filter(Boolean);
  if (!parts.length) return '??';
  const a = parts[0] ? parts[0][0] : '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] || '');
  return (String(a || '') + String(b || '')).toUpperCase().slice(0, 2) || '??';
}

function avatarColorFromText(s) {
  const str = String(s || '').trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
  const hue = Math.abs(h) % 360;
  const sat = 68;
  const lig = 48;
  return `hsl(${hue} ${sat}% ${lig}%)`;
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ error: 'Email e senha obrigatórios' });

    const { data: rows, error: e1 } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', String(email).trim().toLowerCase())
      .eq('ativo', true)
      .limit(1);

    if (e1) {
      console.error('Erro busca usuario:', e1);
      return res.status(500).json({ error: 'Erro ao buscar usuário: ' + e1.message });
    }
    if (!rows || rows.length === 0) {
      console.error('Usuário não encontrado (ou acesso bloqueado por RLS).', {
        email: String(email).trim().toLowerCase(),
        keySource: supabaseKeySource,
      });
      if (supabaseKeySource === 'SUPABASE_ANON_KEY' || supabaseKeySource === 'index.html:SUPABASE_KEY') {
        return res.status(500).json({
          error: 'Login bloqueado por permissões (RLS) ao ler public.usuarios. No Railway, use SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY com service_role).',
        });
      }
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const usuario = rows[0];
    console.log('Usuario encontrado:', usuario.email, '| hash:', usuario.senha_hash?.substring(0, 10));

    const hash = String(usuario.senha_hash || '');
    let senhaValida = false;

    try {
      senhaValida = await bcrypt.compare(String(senha), hash);
      console.log('bcrypt resultado:', senhaValida);
    } catch (e) {
      console.error('Erro bcrypt:', String(e.message || e));
      senhaValida = false;
    }

    if (!senhaValida && !hash.startsWith('$2')) {
      const { data: ok, error: e2 } = await supabase
        .rpc('verificar_senha', { senha_input: String(senha), hash });
      console.log('verificar_senha resultado:', ok, '| erro:', e2);
      if (e2) console.error('Erro RPC verificar_senha:', e2);
      senhaValida = !e2 && !!ok;
    }

    if (!senhaValida) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        permissoes: usuario.permissoes,
      },
      process.env.JWT_SECRET || 'italy_secret_2026',
      { expiresIn: '24h' }
    );

    await supabase.from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', usuario.id);

    console.log('Login OK:', usuario.email);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        permissoes: usuario.permissoes,
        canais_chat: usuario.canais_chat,
        avatar_iniciais: usuario.avatar_iniciais || 'AD',
        avatar_cor: usuario.avatar_cor || '#4A90D9',
      },
    });
  } catch (err) {
    console.error('Erro geral no login:', err);
    res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil, permissoes, canais_chat, avatar_iniciais, avatar_cor')
      .eq('id', req.usuario.id)
      .single();
    if (error || !usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(usuario);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/refresh', authMiddleware, (req, res) => {
  const u = req.usuario;
  const token = jwt.sign(
    { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil, permissoes: u.permissoes },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ token });
});

app.get('/api/usuarios', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,nome,email,perfil,permissoes,canais_chat,ativo,avatar_iniciais,avatar_cor,criado_em,ultimo_acesso')
      .order('nome', { ascending: true });
    if (error) throw error;
    return ok(res, data || []);
  } catch (e) { return err(res, e); }
});

app.post('/api/usuarios', requireAdmin, async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const senha = String(req.body?.senha || '').trim();
    const perfil = String(req.body?.perfil || 'custom').trim();
    const ativo = req.body?.ativo !== undefined ? !!req.body.ativo : true;
    const avatar_cor = String(req.body?.avatar_cor || '').trim();
    const permissoes = Array.isArray(req.body?.permissoes) ? req.body.permissoes : [];
    const canais_chat = Array.isArray(req.body?.canais_chat) ? req.body.canais_chat : undefined;

    if (!nome || !email || !senha) return res.status(400).json({ ok: false, error: 'nome, email e senha são obrigatórios' });
    const senha_hash = await bcrypt.hash(senha, 10);

    const row = {
      nome,
      email,
      senha_hash,
      perfil: perfil === 'admin' ? 'admin' : 'custom',
      permissoes: perfil === 'admin' ? ['tudo'] : permissoes,
      canais_chat: canais_chat !== undefined ? canais_chat : undefined,
      ativo,
      avatar_iniciais: String(req.body?.avatar_iniciais || '').trim() || initialsFromName(nome),
      avatar_cor: avatar_cor || avatarColorFromText(email),
    };

    const { data, error } = await supabase.from('usuarios').insert([row]).select('id,nome,email,perfil,permissoes,canais_chat,ativo,avatar_iniciais,avatar_cor,criado_em,ultimo_acesso').single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.put('/api/usuarios/:id', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });

    const payload = { ...req.body };
    delete payload.id;
    delete payload.senha;
    delete payload.senha_hash;

    if (payload.email != null) payload.email = String(payload.email || '').trim().toLowerCase();
    if (payload.nome != null) payload.nome = String(payload.nome || '').trim();
    if (payload.perfil === 'admin') payload.permissoes = ['tudo'];
    if (payload.perfil && payload.perfil !== 'admin') payload.perfil = 'custom';
    if (payload.ativo != null) payload.ativo = !!payload.ativo;
    if (payload.permissoes != null && !Array.isArray(payload.permissoes)) payload.permissoes = [];
    if (payload.canais_chat != null && !Array.isArray(payload.canais_chat)) payload.canais_chat = [];

    const { data, error } = await supabase
      .from('usuarios')
      .update(payload)
      .eq('id', id)
      .select('id,nome,email,perfil,permissoes,canais_chat,ativo,avatar_iniciais,avatar_cor,criado_em,ultimo_acesso')
      .single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.put('/api/usuarios/:id/senha', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const senha = String(req.body?.senha || '').trim();
    if (!id || !senha) return res.status(400).json({ ok: false, error: 'id e senha obrigatórios' });
    const senha_hash = await bcrypt.hash(senha, 10);
    const { error } = await supabase.from('usuarios').update({ senha_hash }).eq('id', id);
    if (error) throw error;
    return ok(res, true);
  } catch (e) { return err(res, e); }
});

app.delete('/api/usuarios/:id', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });

    if (String(req.usuario?.id || '') === id) {
      return res.status(400).json({ error: 'Você não pode deletar seu próprio usuário' });
    }

    const { data: admins, error: aerr } = await supabase
      .from('usuarios')
      .select('id')
      .eq('perfil', 'admin')
      .eq('ativo', true);
    if (aerr) throw aerr;
    if (Array.isArray(admins) && admins.length <= 1 && String(admins[0]?.id || '') === id) {
      return res.status(400).json({ error: 'Não é possível remover o único administrador do sistema' });
    }

    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
    return ok(res, true);
  } catch (e) { return err(res, e); }
});

const chatUploadDir = path.join(__dirname, 'uploads', 'chat');
try { fs.mkdirSync(chatUploadDir, { recursive: true }); } catch (e) {}

const chatStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, chatUploadDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 12);
    const id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2));
    cb(null, id + ext);
  },
});

const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const okExt = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.xlsx', '.docx', '.txt']);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!okExt.has(ext)) return cb(new Error('Tipo de arquivo não permitido'));
    return cb(null, true);
  },
});

const ofUploadDir = path.join(__dirname, 'uploads', 'of');
try { fs.mkdirSync(ofUploadDir, { recursive: true }); } catch (e) {}

const ofStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, ofUploadDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 12);
    const id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2));
    cb(null, id + ext);
  },
});

const ofUpload = multer({
  storage: ofStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const okExt = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!okExt.has(ext)) return cb(new Error('Tipo de arquivo não permitido'));
    return cb(null, true);
  },
});

function chatPermForCanal(nome) {
  const n = String(nome || '').trim().toLowerCase();
  if (n === 'geral') return 'chat_geral';
  if (n === 'vendas') return 'chat_vendas';
  if (n === 'pcp') return 'chat_pcp';
  if (n === 'estoque') return 'chat_estoque';
  if (n === 'pedidos') return 'chat_pedidos';
  return null;
}

function canAccessChatCanal(req, canalNome) {
  const u = req.usuario || null;
  const perms = Array.isArray(u?.permissoes) ? u.permissoes : [];
  if (u?.perfil === 'admin' || perms.includes('tudo')) return true;
  const key = chatPermForCanal(canalNome);
  if (!key) return false;
  return perms.includes(key);
}

// Chat removido

async function selectAll(table, orderBy) {
  if (!supabase) throw new Error('Supabase não configurado no ambiente. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY).');
  let q = supabase.from(table).select('*');
  if (orderBy) q = q.order(orderBy, { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

app.get('/api/historico_acoes', authMiddleware, async (req, res) => {
  try {
    let q = supabase
      .from('historico_acoes')
      .select('*')
      .order('data_hora', { ascending: false })
      .limit(500);
    if (req.query?.tipo) q = q.ilike('tipo_acao', `%${String(req.query.tipo)}%`);
    const { data, error } = await q;
    if (error) throw error;
    return ok(res, data || []);
  } catch (e) {
    return err(res, e);
  }
});
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
  if (has('fluxo_maquinas')) {
    if (Array.isArray(p.fluxo_maquinas)) out.fluxo_maquinas = p.fluxo_maquinas;
    else if (typeof p.fluxo_maquinas === 'string') {
      try { out.fluxo_maquinas = JSON.parse(p.fluxo_maquinas); } catch (e) { out.fluxo_maquinas = []; }
    } else out.fluxo_maquinas = [];
  }
  if (has('maquina_atual_index')) {
    const idx = Number(p.maquina_atual_index);
    out.maquina_atual_index = Number.isFinite(idx) ? idx : 0;
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
  const end = p.end !== undefined ? p.end : undefined;
  const out = { ...p };
  if (tel !== undefined) out.tel = tel;
  if (out.endereco === undefined && end !== undefined) out.endereco = end;
  if (out.vend_id !== undefined && out.vendedor_id === undefined) out.vendedor_id = out.vend_id;
  if (out.vendedorId !== undefined && out.vendedor_id === undefined) out.vendedor_id = out.vendedorId;
  delete out.end;
  delete out.fone;
  delete out.vend_id;
  delete out.vendedorId;
  return out;
}

function clientesPayload(p) {
  const b = clientesIn(p || {});
  const out = {};
  const map = {
    nome: 'nome',
    razao_social: 'razao_social',
    rs: 'razao_social',
    cnpj: 'cnpj',
    cpf: 'cpf',
    tel: 'tel',
    telefone: 'tel',
    email: 'email',
    cidade: 'cidade',
    estado: 'estado',
    uf: 'estado',
    endereco: 'endereco',
    contato: 'contato',
    observacoes: 'observacoes',
    obs: 'observacoes',
    emp_id: 'emp_id',
    empId: 'emp_id',
    ramo_atividade: 'ramo_atividade',
    ramo: 'ramo_atividade',
    vendedor_id: 'vendedor_id',
    vendId: 'vendedor_id',
    ativo: 'ativo',
  };
  Object.entries(map).forEach(([from, to]) => {
    if (b[from] !== undefined) out[to] = b[from];
  });
  Object.keys(out).forEach(k => (out[k] === undefined || out[k] === '') && delete out[k]);
  delete out.end;
  return out;
}

async function clientesInsertCompat(payload) {
  const attempts = [
    payload,
    (() => {
      const p = { ...payload };
      if (p.observacoes !== undefined) { p.obs = p.observacoes; delete p.observacoes; }
      if (p.endereco !== undefined) { p.end = p.endereco; delete p.endereco; }
      if (p.razao_social !== undefined) { p.rs = p.razao_social; delete p.razao_social; }
      if (p.ramo_atividade !== undefined) { p.ramo = p.ramo_atividade; delete p.ramo_atividade; }
      return p;
    })(),
  ];
  let lastErr = null;
  for (const p of attempts) {
    const { data, error } = await supabase.from('clientes').insert([p]).select();
    if (!error) return { data, error: null };
    lastErr = error;
    const msg = String(error.message || error);
    if (msg.includes('column') || msg.includes('Could not find')) continue;
  }
  return { data: null, error: lastErr };
}

async function clientesUpdateCompat(id, payload) {
  const attempts = [
    payload,
    (() => {
      const p = { ...payload };
      if (p.observacoes !== undefined) { p.obs = p.observacoes; delete p.observacoes; }
      if (p.endereco !== undefined) { p.end = p.endereco; delete p.endereco; }
      if (p.razao_social !== undefined) { p.rs = p.razao_social; delete p.razao_social; }
      if (p.ramo_atividade !== undefined) { p.ramo = p.ramo_atividade; delete p.ramo_atividade; }
      return p;
    })(),
  ];
  let lastErr = null;
  for (const p of attempts) {
    const { data, error } = await supabase.from('clientes').update(p).eq('id', id).select().limit(1);
    if (!error) return { data, error: null };
    lastErr = error;
    const msg = String(error.message || error);
    if (msg.includes('column') || msg.includes('Could not find')) continue;
  }
  return { data: null, error: lastErr };
}

function fornecedoresIn(p) {
  const tel = p.telefone !== undefined ? p.telefone : (p.tel !== undefined ? p.tel : p.fone);
  const end = p.endereco !== undefined ? p.endereco : (p.end !== undefined ? p.end : p.endereco);
  const out = { ...p };
  if (tel !== undefined) out.telefone = tel;
  if (end !== undefined) out.endereco = end;
  delete out.fone;
  delete out.tel;
  delete out.end;
  return out;
}

function fornecedoresPayload(p) {
  const b = fornecedoresIn(p || {});
  const out = {};
  const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  const nome = (b.nome || '').trim();
  if (nome) out.nome = nome;
  if (b.razao_social !== undefined) out.razao_social = b.razao_social;
  else if (b.rs !== undefined) out.razao_social = b.rs;
  else if (!out.razao_social) out.razao_social = nome;

  if (b.cnpj !== undefined) out.cnpj = b.cnpj;
  if (b.telefone !== undefined) out.telefone = b.telefone;
  if (b.email !== undefined) out.email = b.email;
  if (b.contato !== undefined) out.contato = b.contato;
  else if (b.representante !== undefined) out.contato = b.representante;
  if (b.endereco !== undefined) out.endereco = b.endereco;
  if (b.tipo !== undefined) out.tipo = b.tipo;
  if (b.cidade !== undefined) out.cidade = b.cidade;
  if (b.uf !== undefined) out.uf = b.uf;
  if (b.estado !== undefined && out.uf === undefined) out.uf = b.estado;
  if (b.obs !== undefined) out.obs = b.obs;
  if (b.observacoes !== undefined) out.observacoes = b.observacoes;

  const emp = b.empresa_id ?? b.empresaId ?? b.emp_id ?? b.empId ?? null;
  if (isUuid(emp)) out.empresa_id = emp;

  Object.keys(out).forEach(k => (out[k] === undefined || out[k] === null) && delete out[k]);
  return out;
}

async function fornecedoresInsertCompat(payload) {
  const tryInsertDroppingUnknown = async (p) => {
    let cur = { ...(p || {}) };
    let lastErr = null;
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.from('fornecedores').insert([cur]).select();
      if (!error) return { data, error: null };
      lastErr = error;
      const msg = String(error.message || error);
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && Object.prototype.hasOwnProperty.call(cur, col)) {
        delete cur[col];
        continue;
      }
      return { data: null, error };
    }
    return { data: null, error: lastErr };
  };

  const attempts = [
    payload,
    (() => {
      const p = { ...payload };
      if (p.telefone !== undefined) { p.tel = p.telefone; delete p.telefone; }
      if (p.endereco !== undefined) { p.end = p.endereco; delete p.endereco; }
      if (p.razao_social !== undefined) { p.rs = p.razao_social; delete p.razao_social; }
      if (p.empresa_id !== undefined) { p.emp_id = p.empresa_id; delete p.empresa_id; }
      return p;
    })(),
  ];
  let lastErr = null;
  for (const p of attempts) {
    const r = await tryInsertDroppingUnknown(p);
    if (!r.error) return r;
    lastErr = r.error;
    const msg = String(r.error.message || r.error);
    if (msg.includes('column') || msg.includes('Could not find')) continue;
  }
  return { data: null, error: lastErr };
}

async function fornecedoresUpdateCompat(id, payload) {
  const tryUpdateDroppingUnknown = async (p) => {
    let cur = { ...(p || {}) };
    let lastErr = null;
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.from('fornecedores').update(cur).eq('id', id).select();
      if (!error) return { data, error: null };
      lastErr = error;
      const msg = String(error.message || error);
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && Object.prototype.hasOwnProperty.call(cur, col)) {
        delete cur[col];
        continue;
      }
      return { data: null, error };
    }
    return { data: null, error: lastErr };
  };

  const attempts = [
    payload,
    (() => {
      const p = { ...payload };
      if (p.telefone !== undefined) { p.tel = p.telefone; delete p.telefone; }
      if (p.endereco !== undefined) { p.end = p.endereco; delete p.endereco; }
      if (p.razao_social !== undefined) { p.rs = p.razao_social; delete p.razao_social; }
      if (p.empresa_id !== undefined) { p.emp_id = p.empresa_id; delete p.empresa_id; }
      return p;
    })(),
  ];
  let lastErr = null;
  for (const p of attempts) {
    const r = await tryUpdateDroppingUnknown(p);
    if (!r.error) return r;
    lastErr = r.error;
    const msg = String(r.error.message || r.error);
    if (msg.includes('column') || msg.includes('Could not find')) continue;
  }
  return { data: null, error: lastErr };
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

app.get('/api/ofs', authMiddleware, async (req, res) => {
  try {
    const from = req.query.from ? String(req.query.from) : '';
    const to = req.query.to ? String(req.query.to) : '';
    const empId = req.query.empId ? String(req.query.empId) : '';
    const incluirExcluidas = String(req.query.incluir_excluidas || '') === '1';
    const empCols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    const fields = (from || to) ? ['data_producao', 'dia', 'created_at'] : [null];

    let lastError = null;
    for (const empCol of empCols) {
      for (const field of fields) {
        let q = supabase.from('ofs').select('*').order('seq', { ascending: true });
        if (empCol) q = q.eq(empCol, empId);
        if (field) {
          if (from) q = q.gte(field, from);
          if (to) q = q.lte(field, to);
        }
        if (!incluirExcluidas) q = q.is('deleted_at', null);

        let { data, error } = await q;
        if (error) {
          const msg = String(error.message || error);
          if (!incluirExcluidas && msg.toLowerCase().includes("deleted_at") && (msg.includes('column') || msg.includes('Could not find'))) {
            let q2 = supabase.from('ofs').select('*').order('seq', { ascending: true });
            if (empCol) q2 = q2.eq(empCol, empId);
            if (field) {
              if (from) q2 = q2.gte(field, from);
              if (to) q2 = q2.lte(field, to);
            }
            const r2 = await q2;
            data = r2.data;
            error = r2.error;
          }
        }

        if (!error) return ok(res, data || []);
        lastError = error;
        const msg = String(error.message || error);
        if (empCol && (msg.includes('column') || msg.includes('Could not find'))) continue;
        if (field && (msg.includes('column') || msg.includes('Could not find'))) continue;
        throw error;
      }
    }
    throw lastError;
  } catch (e) { bad(res, e.message); }
});
app.post('/api/ofs', authMiddleware, async (req, res) => {
  try { ok(res, await insertOne('ofs', ofIn(req.body || {}))); } catch (e) { bad(res, e.message); }
});
app.put('/api/ofs/:id', authMiddleware, async (req, res) => {
  try { ok(res, await updateOne('ofs', req.params.id, ofIn(req.body || {}))); } catch (e) { bad(res, e.message); }
});
app.delete('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const now = new Date().toISOString();
    const payload = { deleted_at: now, updated_at: now };
    let { data, error } = await supabase.from('ofs').update(payload).eq('id', id).select('*').maybeSingle();
    if (error) {
      const msg = String(error.message || error);
      if (msg.toLowerCase().includes('deleted_at') && (msg.includes('column') || msg.includes('Could not find'))) {
        await deleteOne('ofs', id);
        return ok(res, true);
      }
      throw error;
    }
    return res.json({ ok: true, data });
  } catch (e) { bad(res, e.message); }
});

app.patch('/api/ofs/:id/restore', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const now = new Date().toISOString();
    const payload = { deleted_at: null, updated_at: now };
    const { data, error } = await supabase.from('ofs').update(payload).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    return res.json({ ok: true, data });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
});

app.post('/api/ofs/upload', authMiddleware, ofUpload.single('file'), async (req, res) => {
  try {
    const f = req.file || null;
    if (!f) return res.status(400).json({ ok: false, error: 'Arquivo obrigatório' });
    return ok(res, { url: '/uploads/of/' + f.filename });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
});

app.get('/api/relatorio/vendedor', authMiddleware, async (req, res) => {
  try {
    const mes = String(req.query.mes || '').trim();
    const empId = String(req.query.empId || '').trim();
    let query = supabase.from('ofs').select('*');
    if (mes) {
      const inicio = mes + '-01';
      const fim = mes + '-31';
      query = query.gte('dia', inicio).lte('dia', fim);
    }
    if (empId) query = query.eq('emp_id', empId);
    query = query.neq('status', 'Cancelada').neq('status', 'Cancelado');
    let { data: ofs, error } = await query.is('deleted_at', null);
    if (error) {
      const msg = String(error.message || error);
      if (msg.toLowerCase().includes('deleted_at') && (msg.includes('column') || msg.includes('Could not find'))) {
        const r2 = await query;
        ofs = r2.data;
        error = r2.error;
      }
    }
    if (error) return res.status(500).json({ error: error.message });
    const { data: vendedores } = await supabase.from('vendedores').select('id, nome');
    const mapVend = {};
    (vendedores || []).forEach(v => { mapVend[v.id] = v.nome; });
    const grupos = {};
    let totalGeral = 0;
    (ofs || []).forEach(of => {
      const vendNome = mapVend[of.vendId || of.vendedor_id] || of.vendedor || of.vend || 'Sem Vendedor';
      const valor = Number(of.valor || of.valor_venda || of.valor_total || of.vtot || of.vunit || 0);
      const qtd = Number(of.qtd || of.quantidade || 0);
      if (!grupos[vendNome]) grupos[vendNome] = { vendedor: vendNome, pedidos: 0, qtdTotal: 0, valorTotal: 0, ofs: [] };
      grupos[vendNome].pedidos++;
      grupos[vendNome].qtdTotal += qtd;
      grupos[vendNome].valorTotal += valor;
      grupos[vendNome].ofs.push({
        numero: of.of || of.numero || '',
        cliente: of.cliId || of.cliente || '',
        qtd, valor,
        dataPedido: of.dia || of.data_pedido || '',
        dataEntrega: of.ent || of.data_entrega || '',
        status: of.status || ''
      });
      totalGeral += valor;
    });
    const resultado = Object.values(grupos).map(g => ({
      ...g,
      ticketMedio: g.pedidos > 0 ? g.valorTotal / g.pedidos : 0,
      participacao: totalGeral > 0 ? (g.valorTotal / totalGeral * 100).toFixed(1) : '0.0',
    })).sort((a, b) => b.valorTotal - a.valorTotal);
    return res.json({ vendedores: resultado, totalGeral, totalPedidos: (ofs || []).length });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
});
app.patch('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const payload = { ...ofIn(req.body || {}), updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('ofs').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return res.json({ ok: true, data });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
});

app.patch('/api/ofs/:id/baixa', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return bad(res, 'id obrigatório');

    const { data: rows, error: e1 } = await supabase.from('ofs').select('*').eq('id', id).limit(1);
    if (e1) throw e1;
    const of = rows && rows[0] ? rows[0] : null;
    if (!of) return bad(res, 'OF não encontrada');

    let fluxo = parseFluxo(of.fluxo_maquinas);
    if (!Array.isArray(fluxo) || fluxo.length === 0) {
      const maq = parseFluxo(of.maq);
      fluxo = Array.isArray(maq) ? maq.map((x) => String(x || '').trim()).filter(Boolean) : [];
    }

    const idx0 = Number(of.maquina_atual_index != null ? of.maquina_atual_index : 0);
    const idx = Number.isFinite(idx0) && idx0 >= 0 ? idx0 : 0;
    const atual = fluxo[idx] != null ? String(fluxo[idx]) : '';
    const nextIdx = idx + 1;
    const proxima = nextIdx < fluxo.length ? String(fluxo[nextIdx]) : '';
    const concluida = fluxo.length === 0 || nextIdx >= fluxo.length;

    const nowIso = new Date().toISOString();
    let payload = { maquina_atual_index: nextIdx };
    payload = { ...payload, status: concluida ? 'Pedido Pronto' : 'Em Produção' };
    if (concluida) payload = { ...payload, data_conclusao: nowIso };

    let upd = await supabase.from('ofs').update(payload).eq('id', id).select('*').single();
    if (upd.error) {
      const msg = String(upd.error.message || upd.error);
      if (msg.includes('column') || msg.includes('Could not find')) {
        const fallbackPayload = { status: concluida ? 'Pedido Pronto' : 'Em Produção' };
        upd = await supabase.from('ofs').update(fallbackPayload).eq('id', id).select('*').single();
      }
    }
    if (upd.error) throw upd.error;

    const usuario = req.body?.usuario ? String(req.body.usuario) : 'sistema';
    const numero = of.of != null ? of.of : (of.numero != null ? of.numero : '');
    const msg = concluida
      ? `OF #${numero} baixada em ${atual || '—'} — PEDIDO PRONTO ✓`
      : `OF #${numero} baixada em ${atual || '—'} → próxima: ${proxima || '—'}`;

    if (concluida) {
      try {
        const mesRef = new Date().toISOString().slice(0, 7);
        await supabase.from('relatorio_producao').insert([{
          mes_referencia: mesRef,
          data: nowIso.slice(0, 10),
          of_numero: numero || '',
          cliente: of.cli_id ?? of.cliente_id ?? of.cliId ?? '',
          produto: of.prodDesc ?? of.prod_desc ?? of.prod ?? of.descricao ?? '',
          quantidade: of.qtd ?? of.quantidade ?? 0,
          valor: of.valor ?? of.valor_venda ?? of.val ?? 0,
          maquina: atual || '',
          status: 'Pedido Pronto',
        }]);
      } catch (e) {}
    }

    try {
      await supabase.from('historico_acoes').insert([{
        data_hora: nowIso,
        tipo_acao: 'baixa_of',
        descricao: msg,
        usuario,
      }]);
    } catch (e) {}

    res.json({ ok: true, concluida, proxima: proxima || null, status: payload.status });
  } catch (e) { err(res, e); }
});

app.get('/api/roteiro_entrega', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('roteiro_entrega')
      .select('*')
      .eq('ativo', true)
      .order('dia_semana', { ascending: true })
      .order('cidade', { ascending: true });
    if (error) throw error;
    return ok(res, data || []);
  } catch (e) { return err(res, e); }
});

app.post('/api/roteiro_entrega', authMiddleware, async (req, res) => {
  try {
    const { cidade, dia_semana, observacao } = req.body || {};
    if (!cidade || !dia_semana) return bad(res, 'Cidade e dia obrigatórios');
    const payload = {
      cidade: String(cidade).trim(),
      dia_semana: parseInt(dia_semana),
      observacao: observacao || null,
      ativo: req.body?.ativo !== false,
    };
    const { data, error } = await supabase.from('roteiro_entrega').insert([payload]).select().single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.put('/api/roteiro_entrega/:id', authMiddleware, async (req, res) => {
  try {
    const { cidade, dia_semana, ativo, observacao } = req.body || {};
    const payload = {
      cidade: cidade != null ? String(cidade).trim() : undefined,
      dia_semana: dia_semana != null ? parseInt(dia_semana) : undefined,
      ativo: ativo != null ? !!ativo : undefined,
      observacao: observacao != null ? observacao : undefined,
    };
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    const { data, error } = await supabase.from('roteiro_entrega').update(payload).eq('id', req.params.id).select().single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.delete('/api/roteiro_entrega/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('roteiro_entrega').delete().eq('id', req.params.id);
    if (error) throw error;
    return ok(res, true);
  } catch (e) { return err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// CLIENTES
// ══════════════════════════════════════════════════════════════
app.get('/api/clientes', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('clientes').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) return ok(res, data || []);
      lastErr = error;
      const msg = String(error.message || error);
      if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});

app.post('/api/clientes', authMiddleware, async (req, res) => {
  try {
    const payload = clientesPayload(req.body || {});
    let { data, error } = await clientesInsertCompat(payload);
    if (error) {
      const msg = String(error.message || error);
      if (msg.includes("vendedor_id") || msg.includes("vendedor")) {
        delete payload.vendedor_id;
        delete payload.vendedor;
        ({ data, error } = await clientesInsertCompat(payload));
      }
    }
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/clientes/:id', authMiddleware, async (req, res) => {
  try {
    const payload = clientesPayload({ ...(req.body || {}) });
    delete payload.id;
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    let { data, error } = await clientesUpdateCompat(req.params.id, payload);
    if (error) {
      const msg = String(error.message || error);
      if (msg.includes("vendedor_id") || msg.includes("vendedor")) {
        delete payload.vendedor_id;
        delete payload.vendedor;
        ({ data, error } = await clientesUpdateCompat(req.params.id, payload));
      }
    }
    if (error) throw error;
    const updated = Array.isArray(data) ? data[0] : data;
    if (!updated) return res.status(404).json({ error: 'Cliente não encontrado' });
    ok(res, updated);
  } catch (e) { err(res, e); }
});

app.delete('/api/clientes/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('clientes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// VENDEDORES
// ══════════════════════════════════════════════════════════════
app.get('/api/vendedores', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('vendedores').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) return ok(res, data || []);
      lastErr = error;
      const msg = String(error.message || error);
      if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});

app.post('/api/vendedores', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('vendedores').insert([vendedoresIn(req.body || {})]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/vendedores/:id', authMiddleware, async (req, res) => {
  try {
    const payload = vendedoresIn({ ...(req.body || {}) }); delete payload.id;
    const { data, error } = await supabase.from('vendedores')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/vendedores/:id', authMiddleware, async (req, res) => {
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

app.get('/api/orcamentos', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('orcamentos').select('*').order('criado_em', { ascending: false });
    if (req.query.numero) q = q.eq('numero_orcamento', String(req.query.numero));
    if (req.query.cliente) q = q.ilike('cliente_nome', `%${String(req.query.cliente)}%`);
    if (req.query.empId) q = q.eq('emp_id', String(req.query.empId));
    const { data, error } = await q.limit(50);
    if (error) return res.status(500).json({ error: error.message });
    return ok(res, data || []);
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
});
app.post('/api/orcamentos', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};

    const orderCols = ['criado_em', 'created_at'];
    let ultimo = null;
    let lastErr = null;
    for (const orderCol of orderCols) {
      const r = await supabase.from('orcamentos').select('numero_orcamento').order(orderCol, { ascending: false }).limit(1);
      if (!r.error) { ultimo = r.data; break; }
      lastErr = r.error;
      const msg = String(r.error.message || r.error);
      if (msg.includes('column') || msg.includes('Could not find')) continue;
      throw r.error;
    }
    if (lastErr && ultimo === null) throw lastErr;

    const ultimoNum = parseInt(String(ultimo?.[0]?.numero_orcamento || '0').replace(/\D/g, ''), 10) || 0;
    const novoNum = String(ultimoNum + 1).padStart(4, '0');

    const payload = {
      numero_orcamento: novoNum,
      titulo: b.medidas || b.titulo || '',
      descricao: b.cliente_nome || b.descricao || '',
      cliente_nome: b.cliente_nome || '',
      medidas: b.medidas || '',
      quantidade: b.quantidade || 0,
      onda: b.onda || '',
      valor_unitario: b.valor_unitario || 0,
      valor_total: b.valor_total || 0,
      parametros: b.parametros || {},
      resultados: b.resultados || [],
      emp_id: b.emp_id || '',
      criado_por: req.usuario?.nome || 'sistema',
      criado_em: new Date().toISOString(),
      status: 'Rascunho',
    };
    if (b.cliente_id && String(b.cliente_id).match(/^[0-9a-f-]{36}$/i)) payload.cliente_id = b.cliente_id;

    const { data, error } = await supabase.from('orcamentos').insert([payload]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return ok(res, data);
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
});
app.put('/api/orcamentos/:id', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const updates = {
      titulo: b.medidas || b.titulo || '',
      descricao: b.cliente_nome || b.descricao || '',
      cliente_nome: b.cliente_nome || '',
      medidas: b.medidas || '',
      quantidade: b.quantidade || 0,
      onda: b.onda || '',
      valor_unitario: b.valor_unitario || 0,
      valor_total: b.valor_total || 0,
      parametros: b.parametros || {},
      resultados: b.resultados || [],
    };
    const { data, error } = await supabase.from('orcamentos').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return ok(res, data);
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
});
app.delete('/api/orcamentos/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('orcamentos').delete().eq('id', req.params.id);
    if (error) throw error;
    return ok(res, true);
  } catch (e) { return err(res, e); }
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
app.get('/api/operadores', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('operadores').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) return ok(res, data || []);
      lastErr = error;
      const msg = String(error.message || error);
      if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});

app.post('/api/operadores', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('operadores').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/operadores/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('operadores')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/operadores/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('operadores').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// MÁQUINAS
// ══════════════════════════════════════════════════════════════
app.get('/api/maquinas', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('maquinas').select('*').order('ordem', { ascending: true });
    if (error) throw error;
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/maquinas', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const payload = {
      nome: String(b.nome ?? b.col ?? b.name ?? '').trim(),
      ordem: b.ordem != null ? Number(b.ordem) : undefined,
      setor: String(b.setor ?? '').trim() || null,
      producao: b.producao != null ? Number(b.producao) : (b.phora != null ? Number(b.phora) : 0),
      setup_medio: b.setup_medio != null ? Number(b.setup_medio) : (b.setup != null ? Number(b.setup) : 0),
      passagem_media: b.passagem_media != null ? Number(b.passagem_media) : (b.passagem != null ? Number(b.passagem) : 0),
      descricao: String(b.descricao ?? b.desc ?? '').trim() || null,
      icone: String(b.icone ?? b.ico ?? '').trim() || null,
      ativo: (b.ativo === undefined) ? true : (b.ativo === true || b.ativo === 'true' || b.ativo === 1 || b.ativo === '1')
    };
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
    console.log('[maquinas POST] payload:', payload);
    const { data, error } = await supabase.from('maquinas').insert([payload]).select();
    if (error) { console.error('[maquinas POST] erro:', JSON.stringify(error)); throw error; }
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { console.error('[maquinas POST] catch:', e && e.message ? e.message : e); err(res, e); }
});

app.put('/api/maquinas/:id', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const payload = {
      nome: b.nome !== undefined || b.col !== undefined || b.name !== undefined ? String(b.nome ?? b.col ?? b.name ?? '').trim() : undefined,
      ordem: b.ordem != null ? Number(b.ordem) : undefined,
      setor: b.setor !== undefined ? (String(b.setor ?? '').trim() || null) : undefined,
      producao: b.producao !== undefined || b.phora !== undefined ? Number(b.producao ?? b.phora ?? 0) : undefined,
      setup_medio: b.setup_medio !== undefined || b.setup !== undefined ? Number(b.setup_medio ?? b.setup ?? 0) : undefined,
      passagem_media: b.passagem_media !== undefined || b.passagem !== undefined ? Number(b.passagem_media ?? b.passagem ?? 0) : undefined,
      descricao: b.descricao !== undefined || b.desc !== undefined ? (String(b.descricao ?? b.desc ?? '').trim() || null) : undefined,
      icone: b.icone !== undefined || b.ico !== undefined ? (String(b.icone ?? b.ico ?? '').trim() || null) : undefined,
      ativo: b.ativo === undefined ? undefined : (b.ativo === true || b.ativo === 'true' || b.ativo === 1 || b.ativo === '1')
    };
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
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

app.post('/api/fluxos', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const payload = {
      nome: String(b.nome || '').trim(),
      descricao: String(b.descricao || '').trim() || null,
      emp_id: String(b.emp_id ?? b.empId ?? '').trim() || null,
      ativo: (b.ativo === undefined) ? true : (b.ativo === true || b.ativo === 'true' || b.ativo === 1 || b.ativo === '1'),
      etapas: Array.isArray(b.etapas) ? JSON.stringify(b.etapas) : (b.etapas != null ? String(b.etapas) : '[]')
    };
    console.log('[fluxos POST] payload:', payload);
    const { data, error } = await supabase.from('fluxos').insert([payload]).select();
    if (error) { console.error('[fluxos POST] erro:', JSON.stringify(error)); throw error; }
    ok(res, data[0]);
  } catch (e) { console.error('[fluxos POST] catch:', e && e.message ? e.message : e); err(res, e); }
});

app.put('/api/fluxos/:id', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const payload = {
      nome: b.nome !== undefined ? String(b.nome || '').trim() : undefined,
      descricao: b.descricao !== undefined ? (String(b.descricao || '').trim() || null) : undefined,
      emp_id: (b.emp_id !== undefined || b.empId !== undefined) ? (String(b.emp_id ?? b.empId ?? '').trim() || null) : undefined,
      ativo: b.ativo === undefined ? undefined : (b.ativo === true || b.ativo === 'true' || b.ativo === 1 || b.ativo === '1'),
      etapas: b.etapas === undefined ? undefined : (Array.isArray(b.etapas) ? JSON.stringify(b.etapas) : String(b.etapas))
    };
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
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
app.get('/api/fornecedores', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('fornecedores').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) return ok(res, data || []);
      lastErr = error;
      const msg = String(error.message || error);
      if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});

app.post('/api/fornecedores', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const nome = String(b.nome || '').trim();
    if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
    const payload = fornecedoresPayload(b);
    let { data, error } = await fornecedoresInsertCompat(payload);
    if (error) throw error;
    return ok(res, data[0]);
  } catch (e) { return err(res, e); }
});

app.put('/api/fornecedores/:id', authMiddleware, async (req, res) => {
  try {
    const payload = fornecedoresPayload({ ...(req.body || {}) });
    delete payload.id;
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    const { data, error } = await fornecedoresUpdateCompat(req.params.id, payload);
    if (error) throw error;
    return ok(res, data[0]);
  } catch (e) { return err(res, e); }
});

app.delete('/api/fornecedores/:id', authMiddleware, async (req, res) => {
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
    const empId = req.query.empId ? String(req.query.empId) : '';
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('estoque').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) return ok(res, data || []);
      lastErr = error;
      const msg = String(error.message || error);
      if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;
      throw error;
    }
    throw lastErr;
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
app.get('/api/facas_estoque', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('facas_estoque').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) return ok(res, data || []);
      lastErr = error;
      const msg = String(error.message || error);
      if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});
app.post('/api/facas_estoque', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const asJson = (v) => (Array.isArray(v) || (v && typeof v === 'object')) ? JSON.stringify(v) : v;
    const payloadBase = {
      nome: b.nome || b.descricao || b.codigo || '',
      codigo: b.codigo || b.nome || '',
      descricao: b.descricao || b.nome || '',
      quantidade: Number(b.quantidade ?? b.qtd ?? 0) || 0,
      cliente: b.cliente || '',
      emp_id: b.emp_id || b.empId || 'E1',
      medidas: b.medidas || '',
      valor: Number(b.valor ?? b.valor_unitario ?? 0) || 0,
      observacoes: b.observacoes || b.obs || '',
      obs: b.obs || b.observacoes || '',
      imagem_url: b.imagem_url || b.foto || b.imagem || '',
      foto: b.foto || b.imagem_url || b.imagem || '',
      maquinas: asJson(b.maquinas || []),
      clientes: asJson(b.clientes || []),
    };
    Object.keys(payloadBase).forEach(k => payloadBase[k] === undefined && delete payloadBase[k]);
    let payload = { ...payloadBase };
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.from('facas_estoque').insert([payload]).select();
      if (!error) return ok(res, data[0]);
      const msg = String(error.message || error);
      const m1 = msg.match(/Could not find the '([^']+)' column/);
      const m2 = msg.match(/column \"([^\"]+)\"/);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && payload[col] !== undefined) { delete payload[col]; continue; }
      throw error;
    }
    return res.status(500).json({ ok: false, error: 'Falha ao inserir faca' });
  } catch (e) { err(res, e); }
});
app.put('/api/facas_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const b = { ...req.body }; delete b.id;
    const asJson = (v) => (Array.isArray(v) || (v && typeof v === 'object')) ? JSON.stringify(v) : v;
    const payloadBase = {
      nome: b.nome || b.descricao || b.codigo,
      codigo: b.codigo || b.nome,
      descricao: b.descricao || b.nome,
      quantidade: b.quantidade ?? b.qtd,
      cliente: b.cliente,
      emp_id: b.emp_id || b.empId,
      medidas: b.medidas,
      valor: b.valor ?? b.valor_unitario,
      observacoes: b.observacoes || b.obs,
      obs: b.obs || b.observacoes,
      imagem_url: b.imagem_url || b.foto || b.imagem,
      foto: b.foto || b.imagem_url || b.imagem,
      maquinas: b.maquinas !== undefined ? asJson(b.maquinas) : undefined,
      clientes: b.clientes !== undefined ? asJson(b.clientes) : undefined,
    };
    Object.keys(payloadBase).forEach(k => payloadBase[k] === undefined && delete payloadBase[k]);
    let payload = { ...payloadBase };
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.from('facas_estoque').update(payload).eq('id', req.params.id).select();
      if (!error) return ok(res, data[0]);
      const msg = String(error.message || error);
      const m1 = msg.match(/Could not find the '([^']+)' column/);
      const m2 = msg.match(/column \"([^\"]+)\"/);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && payload[col] !== undefined) { delete payload[col]; continue; }
      throw error;
    }
    return res.status(500).json({ ok: false, error: 'Falha ao atualizar faca' });
  } catch (e) { err(res, e); }
});
app.delete('/api/facas_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('facas_estoque').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// CLICHÊS ESTOQUE
// ══════════════════════════════════════════════════════════════
app.get('/api/cliches_estoque', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('cliches_estoque').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) return ok(res, data || []);
      lastErr = error;
      const msg = String(error.message || error);
      if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});
app.post('/api/cliches_estoque', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const asJson = (v) => (Array.isArray(v) || (v && typeof v === 'object')) ? JSON.stringify(v) : v;
    const payloadBase = {
      nome: b.nome || b.descricao || b.codigo || '',
      codigo: b.codigo || b.nome || '',
      descricao: b.descricao || b.nome || '',
      quantidade: Number(b.quantidade ?? b.qtd ?? 0) || 0,
      cliente: b.cliente || '',
      emp_id: b.emp_id || b.empId || 'E1',
      medidas: b.medidas || '',
      valor: Number(b.valor ?? b.valor_unitario ?? 0) || 0,
      observacoes: b.observacoes || b.obs || '',
      obs: b.obs || b.observacoes || '',
      imagem_url: b.imagem_url || b.foto || b.imagem || '',
      foto: b.foto || b.imagem_url || b.imagem || '',
      maquinas: asJson(b.maquinas || []),
      clientes: asJson(b.clientes || []),
    };
    Object.keys(payloadBase).forEach(k => payloadBase[k] === undefined && delete payloadBase[k]);
    let payload = { ...payloadBase };
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.from('cliches_estoque').insert([payload]).select();
      if (!error) return ok(res, data[0]);
      const msg = String(error.message || error);
      const m1 = msg.match(/Could not find the '([^']+)' column/);
      const m2 = msg.match(/column \"([^\"]+)\"/);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && payload[col] !== undefined) { delete payload[col]; continue; }
      throw error;
    }
    return res.status(500).json({ ok: false, error: 'Falha ao inserir clichê' });
  } catch (e) { err(res, e); }
});
app.put('/api/cliches_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const b = { ...req.body }; delete b.id;
    const asJson = (v) => (Array.isArray(v) || (v && typeof v === 'object')) ? JSON.stringify(v) : v;
    const payloadBase = {
      nome: b.nome || b.descricao || b.codigo,
      codigo: b.codigo || b.nome,
      descricao: b.descricao || b.nome,
      quantidade: b.quantidade ?? b.qtd,
      cliente: b.cliente,
      emp_id: b.emp_id || b.empId,
      medidas: b.medidas,
      valor: b.valor ?? b.valor_unitario,
      observacoes: b.observacoes || b.obs,
      obs: b.obs || b.observacoes,
      imagem_url: b.imagem_url || b.foto || b.imagem,
      foto: b.foto || b.imagem_url || b.imagem,
      maquinas: b.maquinas !== undefined ? asJson(b.maquinas) : undefined,
      clientes: b.clientes !== undefined ? asJson(b.clientes) : undefined,
    };
    Object.keys(payloadBase).forEach(k => payloadBase[k] === undefined && delete payloadBase[k]);
    let payload = { ...payloadBase };
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.from('cliches_estoque').update(payload).eq('id', req.params.id).select();
      if (!error) return ok(res, data[0]);
      const msg = String(error.message || error);
      const m1 = msg.match(/Could not find the '([^']+)' column/);
      const m2 = msg.match(/column \"([^\"]+)\"/);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && payload[col] !== undefined) { delete payload[col]; continue; }
      throw error;
    }
    return res.status(500).json({ ok: false, error: 'Falha ao atualizar clichê' });
  } catch (e) { err(res, e); }
});
app.delete('/api/cliches_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('cliches_estoque').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// CHAPAS ESTOQUE
// ══════════════════════════════════════════════════════════════
async function _chapasPreferV2Table() {
  const tables = ['chapas_estoque_v2', 'chapas_estoque'];
  let lastErr = null;
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (!error) return t;
    lastErr = error;
    const msg = String(error.message || error);
    if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) continue;
  }
  return 'chapas_estoque';
}

function _chapasNormKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-]+/g, '_')
    .replace(/_+/g, '_');
}

function _chapasKeyMap(row) {
  const m = {};
  Object.keys(row || {}).forEach((k) => { m[_chapasNormKey(k)] = k; });
  return m;
}

function _chapasGet(row, km, keys) {
  for (const k0 of keys) {
    const k = km[_chapasNormKey(k0)];
    if (!k) continue;
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
}

function _chapasNum(v) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function _chapasEmpresaFromEmpId(empId) {
  const e = String(empId || '').trim().toUpperCase();
  if (e === 'E2' || e.includes('CARTO')) return 'CARTOESTE';
  if (e === 'E3' || e.includes('OESTE')) return 'OESTEPACK';
  return 'ITALY EMBALAGENS';
}

function _chapasCanonicalFromAny(row, table) {
  if (table === 'chapas_estoque_v2') {
    const qtd = Number(row.quantidade || 0) || 0;
    const vunit = Number(row.valor_unitario || 0) || 0;
    const vtot = Number(row.valor_total || 0) || (qtd * vunit);
    const empId = row.emp_id || '';
    return {
      id: row.id,
      fornecedor: row.fornecedor || '',
      nomenclatura: row.nomenclatura || '',
      tamanho: row.tamanho || '',
      nome: row.nome_uso || row.nome || '',
      empresa_vinculada: row.empresa_vinculada || _chapasEmpresaFromEmpId(empId),
      qual_cnpj: row.qual_cnpj || row.fabricante || '',
      nf: row.nf || '',
      quantidade: qtd,
      valor_unitario: vunit,
      valor_total: vtot,
      categoria: row.categoria || 'Estoque Simples',
      vincos: row.vincos || '',
      observacao: row.observacao || '',
      cliente: row.cliente_nome || row.cliente || '',
      cliente_id: row.cliente_id || null,
      riscada: !!row.riscada,
      risca_desc: row.risca_desc || '',
      estoque_minimo: Number(row.estoque_minimo || 200) || 200,
      data_entrada: row.data_entrada || null,
      emp_id: empId,
      criado_por: row.criado_por || '',
      atualizado_por: row.atualizado_por || '',
      criado_em: row.created_at || row.criado_em || null,
      atualizado_em: row.updated_at || row.atualizado_em || null,
    };
  }

  const km = _chapasKeyMap(row);
  const fornecedor = _chapasGet(row, km, ['fornecedor', 'forn']);
  const nomenclatura = _chapasGet(row, km, ['nomenclatura', 'nom', 'codigo', 'cod', 'tipo_papel', 'tipo papel']);
  const nome = _chapasGet(row, km, ['nome_uso', 'nome uso', 'nome', 'name', 'nome_comercial', 'nome comercial', 'descricao', 'desc']) || nomenclatura;
  const tamanho = _chapasGet(row, km, ['tamanho', 'tam']);
  const qualCnpj = _chapasGet(row, km, ['qual_cnpj', 'qual cnpj', 'qual', 'cnpj', 'fabricante']);
  const nf = _chapasGet(row, km, ['nf', 'numero_nf', 'numero nf', 'nota', 'nota_fiscal', 'nota fiscal']);
  const qtd = _chapasNum(_chapasGet(row, km, ['quantidade', 'qtd', 'saldo']));
  const vunit = _chapasNum(_chapasGet(row, km, ['valor_unitario', 'valor unitario', 'val', 'vunit', 'rs']));
  const vtot = _chapasNum(_chapasGet(row, km, ['valor_total', 'valor total', 'total', 'vtot']));
  const estoqueMin = _chapasNum(_chapasGet(row, km, ['estoque_minimo', 'estoque minimo', 'quantidade_minima', 'quantidade minima', 'min']));
  const vincos = _chapasGet(row, km, ['vincos', 'víncos']);
  const observacao = _chapasGet(row, km, ['observacao', 'observação', 'observacoes', 'observações', 'obs']);
  const dataEntrada = _chapasGet(row, km, ['data_entrada', 'data entrada', 'entrada_de_dados', 'entrada de dados', 'entrada_de_dados']);
  const categoria = _chapasGet(row, km, ['categoria']) || 'Estoque Simples';
  const cliente = _chapasGet(row, km, ['cliente', 'cliente_nome', 'cliente nome']);
  const riscadaRaw = _chapasGet(row, km, ['riscada', 'riscado', 'ver_real', 'ver real']);
  const riscada = String(riscadaRaw).toLowerCase() === 'true' || String(riscadaRaw).toLowerCase() === 'sim' || String(riscadaRaw) === '1';
  const riscaDesc = _chapasGet(row, km, ['risca_desc', 'descricao_risca', 'descrição da risca', 'descricao da risca']);
  const empId = _chapasGet(row, km, ['emp_id', 'emp id', 'empId', 'empresa', 'empresa_id', 'empresa id']);
  const empresaVinc = _chapasGet(row, km, ['empresa_vinculada', 'empresa vinculada', 'fabricante_empresa', 'fabricante empresa', 'empresa']) || _chapasEmpresaFromEmpId(empId);
  const id = _chapasGet(row, km, ['id']);
  const criadoPor = _chapasGet(row, km, ['criado_por', 'criado por', 'usuario', 'usuário']);
  const atualizadoPor = _chapasGet(row, km, ['atualizado_por', 'atualizado por', 'editado_por', 'editado por']);

  return {
    id,
    fornecedor,
    nomenclatura,
    tamanho,
    nome,
    empresa_vinculada: empresaVinc,
    qual_cnpj: qualCnpj,
    nf,
    quantidade: qtd,
    valor_unitario: vunit,
    valor_total: vtot || (qtd * vunit),
    categoria,
    vincos,
    observacao,
    cliente,
    cliente_id: null,
    riscada,
    risca_desc: riscaDesc,
    estoque_minimo: estoqueMin || 200,
    data_entrada: dataEntrada || null,
    emp_id: empId,
    criado_por: criadoPor,
    atualizado_por: atualizadoPor,
    criado_em: row.criado_em || row.created_at || null,
    atualizado_em: row.atualizado_em || row.updated_at || null,
  };
}

function _chapasBool(v) {
  if (v === true || v === false) return v;
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return false;
  return s === '1' || s === 'true' || s === 'sim' || s === 'yes' || s === 'y';
}

function _chapasToNum(v, fallback = 0) {
  if (v == null || v === '') return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const s0 = String(v).trim().replace(/R\$/gi, '').replace(/\s+/g, '');
  const s = s0.includes(',') ? s0.replace(/\./g, '').replace(',', '.') : s0;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function _chapasPayloadV2FromBody(b, req, isUpdate) {
  const payload = {};
  const set = (k, v) => {
    if (v === undefined) return;
    payload[k] = v;
  };

  const setText = (k, v, present) => {
    if (!present) return;
    const s = String(v ?? '').trim();
    set(k, s !== '' ? s : (isUpdate ? null : undefined));
  };

  const fornecedor = (b.fornecedor ?? b.forn ?? '').toString().trim();
  const nomenclatura = (b.nomenclatura ?? b.nom ?? b.codigo ?? b.cod ?? '').toString().trim();
  const tamanho = (b.tamanho ?? b.tam ?? '').toString().trim().toUpperCase();
  const nomeUso = (b.nome_uso ?? b.nomeUso ?? b.nome ?? b.nome_uso ?? '').toString().trim();
  const categoria = (b.categoria ?? '').toString().trim() || 'Estoque Simples';

  if (!isUpdate) {
    if (!fornecedor) throw new Error('Fornecedor obrigatório');
    if (!nomenclatura) throw new Error('Nomenclatura obrigatória');
    if (!tamanho) throw new Error('Tamanho obrigatório');
    if (!nomeUso) throw new Error('Nome/Uso obrigatório');
    if (!categoria) throw new Error('Categoria obrigatória');
  }

  if (fornecedor) set('fornecedor', fornecedor);
  if (nomenclatura) set('nomenclatura', nomenclatura);
  if (tamanho) set('tamanho', tamanho);
  if (nomeUso) set('nome_uso', nomeUso);
  if (!isUpdate) {
    if (categoria) set('categoria', categoria);
  }

  const qualCnpj = (b.qual_cnpj ?? b.qual ?? b.fabricante ?? '').toString().trim();
  const nf = (b.nf ?? b.nf_entrada ?? '').toString().trim();
  const vincos = (b.vincos ?? '').toString().trim();
  const observacao = (b.observacao ?? b.observacoes ?? '').toString().trim();
  const riscaDesc = (b.risca_desc ?? b.descricao_risca ?? '').toString().trim();
  const estoqueMin = b.estoque_minimo != null ? Math.trunc(_chapasToNum(b.estoque_minimo, 200)) : undefined;
  const hasDataEntrada = (b.data_entrada !== undefined || b.dataEntrada !== undefined || b.entrada_de_dados !== undefined);
  const dataEntrada = hasDataEntrada ? ((b.data_entrada ?? b.dataEntrada ?? b.entrada_de_dados ?? null) || null) : undefined;
  const empIdBody = (b.emp_id ?? b.empId ?? '').toString().trim();
  const empIdQuery = req?.query?.empId ? String(req.query.empId).trim() : '';
  const empId = empIdBody || empIdQuery || (isUpdate ? '' : 'E1');
  const empresaVinculadaRaw = (b.empresa_vinculada ?? b.empresaVinculada ?? b.empresa ?? '').toString().trim();
  const empresaVinculada = empresaVinculadaRaw || _chapasEmpresaFromEmpId(empId || 'E1');

  setText('qual_cnpj', qualCnpj, (b.qual_cnpj !== undefined || b.qual !== undefined || b.fabricante !== undefined));
  setText('nf', nf, (b.nf !== undefined || b.nf_entrada !== undefined));
  if (b.empresa_vinculada !== undefined || b.empresaVinculada !== undefined || b.empresa !== undefined) set('empresa_vinculada', empresaVinculada);
  setText('risca_desc', riscaDesc, (b.risca_desc !== undefined || b.descricao_risca !== undefined));
  setText('vincos', vincos, (b.vincos !== undefined));
  setText('observacao', observacao, (b.observacao !== undefined || b.observacoes !== undefined));
  if (estoqueMin !== undefined) set('estoque_minimo', estoqueMin);
  if (dataEntrada !== undefined) set('data_entrada', dataEntrada);
  if (empId !== '') set('emp_id', empId);

  const qtd = b.quantidade != null ? Math.trunc(_chapasToNum(b.quantidade, 0)) : (b.qtd != null ? Math.trunc(_chapasToNum(b.qtd, 0)) : undefined);
  if (qtd !== undefined) {
    if (qtd < 0) throw new Error('Quantidade não pode ser negativa');
    set('quantidade', qtd);
  }

  const vunit = b.valor_unitario != null ? _chapasToNum(b.valor_unitario, 0) : (b.val != null ? _chapasToNum(b.val, 0) : undefined);
  if (vunit !== undefined) {
    if (vunit < 0) throw new Error('Valor unitário inválido');
    set('valor_unitario', vunit);
  }

  const clienteId = (b.cliente_id ?? b.clienteId ?? '').toString().trim();
  const clienteNome = (b.cliente_nome ?? b.clienteNome ?? b.cliente ?? '').toString().trim();
  if (clienteId) set('cliente_id', clienteId);
  if (clienteNome) set('cliente_nome', clienteNome);
  if (!clienteId && clienteNome === '') {
    if (b.cliente_id === null || b.clienteId === null) set('cliente_id', null);
    if (b.cliente_nome === null || b.clienteNome === null || b.cliente === null) set('cliente_nome', null);
  }

  if (!isUpdate) set('criado_por', req?.usuario?.nome || 'sistema');
  set('atualizado_por', req?.usuario?.nome || 'sistema');

  if (b.categoria !== undefined) set('categoria', String(b.categoria || '').trim());
  if (b.riscada !== undefined) set('riscada', _chapasBool(b.riscada));

  return payload;
}

async function _chapasLogAcao(req, tipo, descricao) {
  const row = {
    tipo_acao: String(tipo || '').trim().slice(0, 60),
    descricao: String(descricao || '').trim().slice(0, 300),
    usuario: req?.usuario?.nome || 'sistema',
    data_hora: new Date().toISOString(),
  };
  try {
    await supabase.from('historico_acoes').insert([row]);
  } catch (_) {}
}

const chapasCsvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext !== '.csv') return cb(new Error('Apenas CSV'));
    return cb(null, true);
  },
});

function _chapasParseCsv(text) {
  const s = String(text || '');
  const firstLine = (s.split(/\r?\n/)[0] || '');
  const sep = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === sep) { row.push(cur); cur = ''; continue; }
    if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; continue; }
    if (ch === '\r') continue;
    cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }

  const header = (rows.shift() || []).map((h) => String(h || '').trim());
  const norm = (k) => String(k || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-]+/g, '_')
    .replace(/_+/g, '_');

  const idx = {};
  header.forEach((h, i) => { idx[norm(h)] = i; });

  const get = (r, keys) => {
    for (const k of keys) {
      const i = idx[norm(k)];
      if (i == null) continue;
      const v = r[i];
      if (v != null && String(v).trim() !== '') return v;
    }
    return '';
  };

  const out = [];
  for (const r of rows) {
    if (!r || !r.length) continue;
    const fornecedor = get(r, ['fornecedor', 'forn']);
    const nomenclatura = get(r, ['nomenclatura', 'nom', 'codigo', 'cod', 'modelo', 'tipo_papel', 'tipo papel']);
    const tamanho = get(r, ['tamanho', 'tam']);
    const nomeUso = get(r, ['nome_uso', 'nome uso', 'nome', 'descricao', 'uso']);
    const empresaVinculada = get(r, ['empresa_vinculada', 'empresa vinculada', 'empresa', 'fabricante_empresa', 'fabricante empresa']);
    const qualCnpj = get(r, ['qual_cnpj', 'qual cnpj', 'fabricante', 'cnpj']);
    const nf = get(r, ['nf', 'nota_fiscal', 'nota fiscal']);
    const quantidade = get(r, ['quantidade', 'qtd', 'saldo']);
    const valorUnitario = get(r, ['valor_unitario', 'valor unitario', 'rs/un', 'r$/un', 'val', 'vunit']);
    const categoria = get(r, ['categoria', 'grupo']);
    const vincos = get(r, ['vincos']);
    const observacao = get(r, ['observacao', 'observação', 'obs']);
    const clienteNome = get(r, ['cliente', 'cliente_nome', 'cliente nome']);
    const riscada = get(r, ['riscada', 'riscado', 'ja_vem_riscada', 'já vem riscada']);
    const riscaDesc = get(r, ['risca_desc', 'descricao_risca', 'descrição da risca', 'descricao da risca']);
    const estoqueMin = get(r, ['estoque_minimo', 'estoque minimo', 'min']);
    const dataEntrada = get(r, ['data_entrada', 'data entrada', 'entrada_de_dados', 'entrada de dados']);

    const item = {
      fornecedor,
      nomenclatura,
      tamanho,
      nome_uso: nomeUso,
      empresa_vinculada: empresaVinculada,
      qual_cnpj: qualCnpj,
      nf,
      quantidade: quantidade,
      valor_unitario: valorUnitario,
      categoria,
      vincos,
      observacao,
      cliente_nome: clienteNome,
      riscada,
      risca_desc: riscaDesc,
      estoque_minimo: estoqueMin,
      data_entrada: dataEntrada,
    };

    if ([fornecedor, nomenclatura, tamanho, nomeUso].every(v => String(v || '').trim() === '')) continue;
    out.push(item);
  }

  return out;
}

app.get('/api/chapas_estoque', authMiddleware, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error('[chapas_estoque] erro Supabase:', JSON.stringify(error));
      return res.json([]);
    }

    let rows = (data || []).map((r) => _chapasCanonicalFromAny(r, table));

    if (req.query.empId) {
      const emp = String(req.query.empId).trim();
      rows = rows.filter(r => String(r.emp_id || '').trim() === emp || String(r.qual_cnpj || '').trim() === emp);
    }
    if (req.query.fornecedor) {
      const f = String(req.query.fornecedor).toLowerCase();
      rows = rows.filter(r => String(r.fornecedor || '').toLowerCase().includes(f));
    }
    if (req.query.categoria) {
      const cat = String(req.query.categoria).trim();
      rows = rows.filter(r => String(r.categoria || '').trim() === cat);
    }
    if (req.query.busca) {
      const b = String(req.query.busca).toLowerCase();
      rows = rows.filter(r => [r.nome, r.nomenclatura, r.fornecedor, r.tamanho, r.nf, r.empresa_vinculada, r.qual_cnpj, r.vincos, r.observacao, r.categoria, r.cliente, r.risca_desc].join(' ').toLowerCase().includes(b));
    }
    if (req.query.cliente) {
      const c = String(req.query.cliente).toLowerCase();
      rows = rows.filter(r => String(r.cliente || '').toLowerCase().includes(c));
    }
    if (req.query.nf) {
      const n = String(req.query.nf).toLowerCase();
      rows = rows.filter(r => String(r.nf || '').toLowerCase().includes(n));
    }
    if (req.query.nomenclatura) {
      const n = String(req.query.nomenclatura).toLowerCase();
      rows = rows.filter(r => String(r.nomenclatura || '').toLowerCase().includes(n));
    }
    if (req.query.tamanho) {
      const t = String(req.query.tamanho).toLowerCase();
      rows = rows.filter(r => String(r.tamanho || '').toLowerCase().includes(t));
    }
    if (req.query.empresa_vinculada) {
      const ev = String(req.query.empresa_vinculada).toLowerCase();
      rows = rows.filter(r => String(r.empresa_vinculada || '').toLowerCase().includes(ev));
    }
    if (req.query.riscadas === '1') rows = rows.filter(r => !!r.riscada);
    if (req.query.com_vincos === '1') rows = rows.filter(r => String(r.vincos || '').trim() !== '');
    if (req.query.baixo === '1') rows = rows.filter(r => (Number(r.quantidade || 0) || 0) < (Number(r.estoque_minimo || 200) || 200));
    if (req.query.sem_estoque === '1') rows = rows.filter(r => (Number(r.quantidade || 0) || 0) <= 0);
    if (req.query.cliente_id) {
      const cid = String(req.query.cliente_id).trim();
      rows = rows.filter(r => String(r.cliente_id || '').trim() === cid);
    }

    rows.sort((a,b)=>{
      const ca = String(a.categoria||'').toLowerCase();
      const cb = String(b.categoria||'').toLowerCase();
      if(ca !== cb) return ca > cb ? 1 : -1;
      const fa = String(a.fornecedor||'').toLowerCase();
      const fb = String(b.fornecedor||'').toLowerCase();
      if(fa !== fb) return fa > fb ? 1 : -1;
      const na = String(a.nomenclatura||'').toLowerCase();
      const nb = String(b.nomenclatura||'').toLowerCase();
      if(na !== nb) return na > nb ? 1 : -1;
      const ta = String(a.tamanho||'').toLowerCase();
      const tb = String(b.tamanho||'').toLowerCase();
      return ta > tb ? 1 : ta < tb ? -1 : 0;
    });

    console.log('[chapas_estoque] OK:', rows.length, 'registros');
    return res.json(rows);
  } catch (err) {
    console.error('[chapas_estoque] catch:', err.message);
    return res.json([]);
  }
});
app.post('/api/chapas_estoque', authMiddleware, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    const b = req.body || {};

    if (table === 'chapas_estoque_v2') {
      const payload = _chapasPayloadV2FromBody(b, req, false);
      let { data, error } = await supabase.from('chapas_estoque_v2').insert([payload]).select().single();
      if (error) {
        const msg = String(error.message || error);
        if (msg.toLowerCase().includes('empresa_vinculada') && msg.toLowerCase().includes('column')) {
          const retry = { ...payload };
          delete retry.empresa_vinculada;
          const r2 = await supabase.from('chapas_estoque_v2').insert([retry]).select().single();
          data = r2.data;
          error = r2.error;
        }
      }
      if (error) return res.status(500).json({ error: error.message });
      await _chapasLogAcao(req, 'estoque_chapas_cadastro', `Chapa cadastrada: ${payload.nome_uso || ''} · ${payload.fornecedor || ''} · ${payload.nomenclatura || ''} · ${payload.tamanho || ''}`);
      return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque_v2'));
    }

    const payload = {
      forn: b.fornecedor || b.forn || '',
      nom: b.nomenclatura || b.nom || b.codigo || b.cod || b.nome || '',
      tam: b.tamanho || b.tam || '',
      qual: b.qual_cnpj || b.qual || '',
      qual_cnpj: b.qual_cnpj || b.qual || '',
      nf: b.nf || '',
      qtd: Number(b.quantidade || b.qtd || 0),
      val: Number(b.valor_unitario || b.val || 0),
      vincos: b.vincos || '',
      observacao: b.observacao || b.observacoes || '',
      entrada_de_dados: b.data_entrada || b.entrada_de_dados || null,
      emp_id: b.emp_id || 'E1',
    };
    const { data, error } = await supabase.from('chapas_estoque').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    await _chapasLogAcao(req, 'estoque_chapas_cadastro', `Chapa cadastrada (legado): ${payload.nom || ''} · ${payload.forn || ''} · ${payload.tam || ''}`);
    return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque'));
  } catch (e) { err(res, e); }
});
app.put('/api/chapas_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    const b = req.body || {};

    if (table === 'chapas_estoque_v2') {
      const payload = _chapasPayloadV2FromBody(b, req, true);
      if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
      let { data, error } = await supabase.from('chapas_estoque_v2').update(payload).eq('id', req.params.id).select().single();
      if (error) {
        const msg = String(error.message || error);
        if (msg.toLowerCase().includes('empresa_vinculada') && msg.toLowerCase().includes('column')) {
          const retry = { ...payload };
          delete retry.empresa_vinculada;
          const r2 = await supabase.from('chapas_estoque_v2').update(retry).eq('id', req.params.id).select().single();
          data = r2.data;
          error = r2.error;
        }
      }
      if (error) return res.status(500).json({ error: error.message });
      await _chapasLogAcao(req, 'estoque_chapas_edicao', `Chapa atualizada: ${data?.nome_uso || ''} · ${data?.fornecedor || ''} · ${data?.nomenclatura || ''} · ${data?.tamanho || ''}`);
      return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque_v2'));
    }

    const payload = {};
    if (b.fornecedor || b.forn) payload.forn = b.fornecedor || b.forn;
    if (b.nomenclatura || b.nom || b.codigo || b.cod || b.nome) payload.nom = b.nomenclatura || b.nom || b.codigo || b.cod || b.nome;
    if (b.tamanho || b.tam) payload.tam = b.tamanho || b.tam;
    if (b.qual_cnpj || b.qual) { payload.qual = b.qual_cnpj || b.qual; payload.qual_cnpj = b.qual_cnpj || b.qual; }
    if (b.nf) payload.nf = b.nf;
    if (b.quantidade !== undefined || b.qtd !== undefined) payload.qtd = Number(b.quantidade ?? b.qtd ?? 0);
    if (b.valor_unitario !== undefined || b.val !== undefined) payload.val = Number(b.valor_unitario ?? b.val ?? 0);
    if (b.vincos !== undefined) payload.vincos = b.vincos;
    if (b.observacao !== undefined) payload.observacao = b.observacao;
    if (b.emp_id) payload.emp_id = b.emp_id;
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    const { data, error } = await supabase.from('chapas_estoque').update(payload).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    await _chapasLogAcao(req, 'estoque_chapas_edicao', `Chapa atualizada (legado): ${data?.nom || ''} · ${data?.forn || ''} · ${data?.tam || ''}`);
    return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque'));
  } catch (e) { err(res, e); }
});
app.patch('/api/chapas_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    const b = req.body || {};

    if (table === 'chapas_estoque_v2') {
      const payload = _chapasPayloadV2FromBody(b, req, true);
      if (b.quantidade !== undefined) payload.quantidade = Math.trunc(_chapasToNum(b.quantidade, 0));
      if (b.qtd !== undefined) payload.quantidade = Math.trunc(_chapasToNum(b.qtd, 0));
      if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
      const { data, error } = await supabase.from('chapas_estoque_v2').update(payload).eq('id', req.params.id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await _chapasLogAcao(req, 'estoque_chapas_patch', `Atualização rápida: ${data?.nome_uso || ''} · ${data?.fornecedor || ''} · qtd=${data?.quantidade ?? ''}`);
      return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque_v2'));
    }

    const payload = {};
    if (b.quantidade !== undefined) payload.qtd = Number(b.quantidade);
    if (b.qtd !== undefined) payload.qtd = Number(b.qtd);
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    const { data, error } = await supabase.from('chapas_estoque').update(payload).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    await _chapasLogAcao(req, 'estoque_chapas_patch', `Atualização rápida (legado): ${data?.nom || ''} · ${data?.forn || ''} · qtd=${data?.qtd ?? ''}`);
    return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque'));
  } catch (e) { err(res, e); }
});

app.patch('/api/chapas_estoque/:id/inline', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const table = await _chapasPreferV2Table();
    const payload = {};
    const bool = (v) => (v === true || v === 'true' || v === 1 || v === '1');
    if ('empresa_vinculada' in b) payload.empresa_vinculada = String(b.empresa_vinculada);
    if ('qual_cnpj' in b) payload.qual_cnpj = String(b.qual_cnpj);
    if ('emp_id' in b) payload.emp_id = String(b.emp_id);
    if ('empId' in b && payload.emp_id === undefined) payload.emp_id = String(b.empId);
    if ('categoria' in b) payload.categoria = String(b.categoria || '').trim();
    if ('riscada' in b && table === 'chapas_estoque_v2') payload.riscada = bool(b.riscada);

    if (!Object.keys(payload).length) return res.status(400).json({ ok: false, error: 'Nenhum campo válido' });

    const finalPayload = { ...payload };
    if (table === 'chapas_estoque_v2') {
      finalPayload.atualizado_por = req.usuario?.nome || 'sistema';
      if (finalPayload.qual_cnpj === undefined && finalPayload.empresa_vinculada !== undefined) finalPayload.qual_cnpj = finalPayload.empresa_vinculada;
    } else {
      const legacy = {};
      if (finalPayload.qual_cnpj !== undefined) {
        legacy.qual = String(finalPayload.qual_cnpj);
        legacy.qual_cnpj = String(finalPayload.qual_cnpj);
      } else if (finalPayload.empresa_vinculada !== undefined) {
        legacy.qual = String(finalPayload.empresa_vinculada);
        legacy.qual_cnpj = String(finalPayload.empresa_vinculada);
      }
      if (finalPayload.emp_id !== undefined) legacy.emp_id = String(finalPayload.emp_id);
      if (finalPayload.categoria !== undefined) legacy.categoria = String(finalPayload.categoria || '').trim();
      if (finalPayload.riscada !== undefined) legacy.riscada = bool(finalPayload.riscada);
      Object.keys(finalPayload).forEach(k => { delete finalPayload[k]; });
      Object.assign(finalPayload, legacy);
    }

    console.log('[inline patch] table:', table, 'id:', req.params.id, 'payload:', finalPayload);

    let { data, error } = await supabase.from(table).update(finalPayload).eq('id', req.params.id).select().maybeSingle();
    if (error) {
      const msg = String(error.message || error);
      const m = msg.match(/Could not find the '([^']+)' column/i);
      if (m && m[1] && finalPayload[m[1]] !== undefined) {
        const retry = { ...finalPayload };
        delete retry[m[1]];
        if (!Object.keys(retry).length) return res.status(400).json({ ok: false, error: 'Nenhum campo válido' });
        const r2 = await supabase.from(table).update(retry).eq('id', req.params.id).select().maybeSingle();
        data = r2.data;
        error = r2.error;
      } else {
        const isMissingColumn = msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist');
        if (isMissingColumn) {
          const retry = { ...finalPayload };
          delete retry.empresa_vinculada;
          delete retry.categoria;
          delete retry.riscada;
          if (Object.keys(retry).length) {
            const r2 = await supabase.from(table).update(retry).eq('id', req.params.id).select().maybeSingle();
            data = r2.data;
            error = r2.error;
          }
        }
      }
    }

    if (error) {
      console.error('[inline patch] supabase error:', JSON.stringify(error));
      console.error('[inline patch] erro supabase (ctx):', { table, id: req.params.id, body: b, payload: finalPayload });
      return res.status(500).json({ ok: false, error: error.message });
    }

    if (!data) return res.status(404).json({ ok: false, error: 'Chapa não encontrada (ou sem permissão)' });
    console.log('[inline patch] OK:', data?.id);
    return res.json({ ok: true, data });
  } catch (e) {
    console.error('[inline patch] catch:', e && e.message ? e.message : e);
    return res.status(500).json({ ok: false, error: String((e && e.message) ? e.message : e) });
  }
});

app.post('/api/chapas_estoque/:id/movimento', authMiddleware, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    const b = req.body || {};
    const tipo = String(b.tipo || '').trim().toLowerCase();
    if (!['entrada', 'saida', 'ajuste'].includes(tipo)) return res.status(400).json({ ok: false, error: 'Tipo inválido (entrada/saida/ajuste)' });

    const id = req.params.id;
    const { data: cur, error: curErr } = await supabase.from(table).select('*').eq('id', id).single();
    if (curErr) return res.status(404).json({ ok: false, error: 'Chapa não encontrada' });

    const canonCur = _chapasCanonicalFromAny(cur, table);
    const oldQtd = Number(canonCur.quantidade || 0) || 0;
    let newQtd = oldQtd;

    if (tipo === 'ajuste') {
      const alvo = Math.trunc(_chapasToNum(b.quantidade, NaN));
      if (!Number.isFinite(alvo) || alvo < 0) return res.status(400).json({ ok: false, error: 'Quantidade inválida' });
      newQtd = alvo;
    } else {
      const delta = Math.trunc(_chapasToNum(b.delta, NaN));
      if (!Number.isFinite(delta) || delta <= 0) return res.status(400).json({ ok: false, error: 'Delta inválido' });
      newQtd = tipo === 'entrada' ? (oldQtd + delta) : (oldQtd - delta);
      if (newQtd < 0) return res.status(400).json({ ok: false, error: 'Saldo insuficiente' });
    }

    const patch = table === 'chapas_estoque_v2'
      ? { quantidade: newQtd, atualizado_por: req?.usuario?.nome || 'sistema' }
      : { qtd: newQtd };

    if (b.nf) {
      if (table === 'chapas_estoque_v2') patch.nf = String(b.nf).trim();
      else patch.nf = String(b.nf).trim();
    }

    const { data: upd, error: updErr } = await supabase.from(table).update(patch).eq('id', id).select().single();
    if (updErr) return res.status(500).json({ ok: false, error: updErr.message });

    const canonUpd = _chapasCanonicalFromAny(upd, table);
    const deltaTxt = tipo === 'ajuste' ? `de ${oldQtd} para ${newQtd}` : `${tipo === 'entrada' ? '+' : '-'}${Math.abs(newQtd - oldQtd)}`;
    const desc = `Estoque chapas: ${tipo.toUpperCase()} ${deltaTxt} · ${canonUpd.nome || ''} · ${canonUpd.fornecedor || ''} · ${canonUpd.nomenclatura || ''} · ${canonUpd.tamanho || ''}`.trim();
    await _chapasLogAcao(req, `estoque_${tipo}`, desc);

    if (table === 'chapas_estoque_v2') {
      const delta = Math.trunc((Number(newQtd) || 0) - (Number(oldQtd) || 0));
      const mov = {
        chapa_id: id,
        tipo,
        delta,
        qtd_anterior: Math.trunc(oldQtd),
        qtd_nova: Math.trunc(newQtd),
        nf: (b.nf != null && String(b.nf).trim() !== '') ? String(b.nf).trim() : null,
        obs: (b.obs != null && String(b.obs).trim() !== '') ? String(b.obs).trim() : null,
        usuario: req?.usuario?.nome || 'sistema',
        emp_id: canonUpd.emp_id || null,
      };
      try {
        await supabase.from('chapas_estoque_movimentos_v2').insert([mov]);
      } catch (_) {}
    }

    return ok(res, canonUpd);
  } catch (e) { err(res, e); }
});

app.get('/api/chapas_estoque_movimentos', authMiddleware, async (req, res) => {
  try {
    const preferred = await _chapasPreferV2Table();
    if (preferred !== 'chapas_estoque_v2') return ok(res, []);
    const limit = Math.max(1, Math.min(500, Math.trunc(_chapasToNum(req.query.limit, 120))));
    const chapaId = String(req.query.chapa_id || '').trim();
    const empId = String(req.query.empId || '').trim();

    let q = supabase.from('chapas_estoque_movimentos_v2').select('*').order('created_at', { ascending: false }).limit(limit);
    if (chapaId) q = q.eq('chapa_id', chapaId);
    if (empId) q = q.eq('emp_id', empId);

    const { data, error } = await q;
    if (error) {
      const msg = String(error.message || error);
      if (msg.includes('does not exist') || msg.includes('relation')) return ok(res, []);
      return res.status(500).json({ ok: false, error: error.message });
    }
    return ok(res, data || []);
  } catch (e) { err(res, e); }
});

app.delete('/api/chapas_estoque_movimentos/:id', authMiddleware, async (req, res) => {
  try {
    const preferred = await _chapasPreferV2Table();
    if (preferred !== 'chapas_estoque_v2') return res.status(400).json({ ok: false, error: 'Movimentações disponíveis apenas no v2' });

    const movId = req.params.id;
    const { data: mov, error: movErr } = await supabase.from('chapas_estoque_movimentos_v2').select('*').eq('id', movId).single();
    if (movErr || !mov) return res.status(404).json({ ok: false, error: 'Movimentação não encontrada' });
    if (mov.reverted) return res.status(400).json({ ok: false, error: 'Movimentação já revertida' });

    const chapaId = mov.chapa_id;
    const { data: cur, error: curErr } = await supabase.from('chapas_estoque_v2').select('*').eq('id', chapaId).single();
    if (curErr || !cur) return res.status(404).json({ ok: false, error: 'Chapa não encontrada' });

    const canonCur = _chapasCanonicalFromAny(cur, 'chapas_estoque_v2');
    const curQtd = Math.trunc(Number(canonCur.quantidade || 0) || 0);
    const delta = Math.trunc(Number(mov.delta || 0) || 0);
    const newQtd = curQtd - delta;
    if (newQtd < 0) return res.status(400).json({ ok: false, error: 'Reversão inválida (saldo ficaria negativo)' });

    const { data: upd, error: updErr } = await supabase
      .from('chapas_estoque_v2')
      .update({ quantidade: newQtd, atualizado_por: req?.usuario?.nome || 'sistema' })
      .eq('id', chapaId)
      .select()
      .single();
    if (updErr) return res.status(500).json({ ok: false, error: updErr.message });

    const { error: revErr } = await supabase
      .from('chapas_estoque_movimentos_v2')
      .update({ reverted: true, reverted_by: req?.usuario?.nome || 'sistema', reverted_at: new Date().toISOString() })
      .eq('id', movId);
    if (revErr) return res.status(500).json({ ok: false, error: revErr.message });

    const canonUpd = _chapasCanonicalFromAny(upd, 'chapas_estoque_v2');
    await _chapasLogAcao(req, 'estoque_movimento_revertido', `Movimento revertido (${mov.tipo}) delta=${delta} · ${canonUpd.nome || ''} · ${canonUpd.fornecedor || ''} · ${canonUpd.nomenclatura || ''} · ${canonUpd.tamanho || ''}`);

    return ok(res, { chapa: canonUpd });
  } catch (e) { err(res, e); }
});

app.post('/api/chapas_estoque/import_csv', authMiddleware, chapasCsvUpload.single('file'), async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    if (table !== 'chapas_estoque_v2') return res.status(400).json({ ok: false, error: 'Tabela chapas_estoque_v2 não encontrada no banco' });
    if (!req.file || !req.file.buffer) return res.status(400).json({ ok: false, error: 'Arquivo CSV não recebido' });

    const mode = String(req.query.mode || req.body?.mode || 'append').toLowerCase().trim();
    if (!['append', 'replace'].includes(mode)) return res.status(400).json({ ok: false, error: 'mode inválido (append/replace)' });

    const text = req.file.buffer.toString('utf8');
    const parsed = _chapasParseCsv(text);
    if (!parsed.length) return res.status(400).json({ ok: false, error: 'CSV vazio ou sem linhas válidas' });

    if (mode === 'replace') {
      const delFilter = '00000000-0000-0000-0000-000000000000';
      const { error: delErr } = await supabase.from('chapas_estoque_v2').delete().neq('id', delFilter);
      if (delErr) return res.status(500).json({ ok: false, error: delErr.message });
    }

    const clean = [];
    const errors = [];
    for (let i = 0; i < parsed.length; i++) {
      try {
        const p = _chapasPayloadV2FromBody(parsed[i], req, false);
        clean.push(p);
      } catch (e) {
        if (errors.length < 25) errors.push({ line: i + 2, error: String(e?.message || e) });
      }
    }

    if (!clean.length) return res.status(400).json({ ok: false, error: 'Nenhuma linha válida para importar', errors });

    const chunkSize = 200;
    let inserted = 0;
    for (let i = 0; i < clean.length; i += chunkSize) {
      const chunk = clean.slice(i, i + chunkSize);
      const { error } = await supabase.from('chapas_estoque_v2').insert(chunk);
      if (error) return res.status(500).json({ ok: false, error: error.message, inserted, errors });
      inserted += chunk.length;
    }

    await _chapasLogAcao(req, 'estoque_chapas_import_csv', `Import CSV (${mode}): ${inserted} itens importados`);
    return ok(res, { inserted, totalParsed: parsed.length, errors });
  } catch (e) { err(res, e); }
});

app.post('/api/chapas_estoque/migrar_legacy', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    if (table !== 'chapas_estoque_v2') return res.status(400).json({ ok: false, error: 'Tabela chapas_estoque_v2 não encontrada no banco' });

    const { data: legacy, error: legacyErr } = await supabase.from('chapas_estoque').select('*');
    if (legacyErr) return res.status(500).json({ ok: false, error: legacyErr.message });

    const canonical = (legacy || []).map((r) => _chapasCanonicalFromAny(r, 'chapas_estoque'));
    const mapped = canonical.map((c) => ({
      fornecedor: c.fornecedor || '',
      nomenclatura: c.nomenclatura || '',
      tamanho: c.tamanho || '',
      nome_uso: c.nome || c.nomenclatura || '',
      empresa_vinculada: c.empresa_vinculada || _chapasEmpresaFromEmpId(c.emp_id),
      qual_cnpj: c.qual_cnpj || '',
      nf: c.nf || '',
      quantidade: Math.trunc(Number(c.quantidade || 0) || 0),
      valor_unitario: Number(c.valor_unitario || 0) || 0,
      categoria: c.categoria || 'Estoque Simples',
      vincos: c.vincos || '',
      observacao: c.observacao || '',
      cliente_nome: c.cliente || null,
      riscada: !!c.riscada,
      risca_desc: c.risca_desc || '',
      estoque_minimo: Math.trunc(Number(c.estoque_minimo || 200) || 200),
      data_entrada: c.data_entrada || null,
      emp_id: c.emp_id || 'E1',
      criado_por: req?.usuario?.nome || 'sistema',
      atualizado_por: req?.usuario?.nome || 'sistema',
    })).filter(x => x.fornecedor && x.nomenclatura && x.tamanho);

    const chunkSize = 200;
    let inserted = 0;
    for (let i = 0; i < mapped.length; i += chunkSize) {
      const chunk = mapped.slice(i, i + chunkSize);
      const { error } = await supabase.from('chapas_estoque_v2').insert(chunk);
      if (error) return res.status(500).json({ ok: false, error: error.message, inserted });
      inserted += chunk.length;
    }

    await _chapasLogAcao(req, 'estoque_chapas_migrar_legacy', `Migração legado -> v2: ${inserted} itens`);
    return ok(res, { inserted, legacyCount: (legacy || []).length });
  } catch (e) { err(res, e); }
});
app.delete('/api/chapas_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const preferred = await _chapasPreferV2Table();
    const tables = preferred === 'chapas_estoque_v2'
      ? ['chapas_estoque_v2', 'chapas_estoque', 'estoque_chapas', 'estoque']
      : ['chapas_estoque', 'estoque_chapas', 'estoque'];
    let lastErr = null;
    for (const t of tables) {
      const { error } = await supabase.from(t).delete().eq('id', req.params.id);
      if (!error) {
        await _chapasLogAcao(req, 'estoque_chapas_excluir', `Chapa excluída (id=${req.params.id})`);
        return res.json({ ok: true });
      }
      lastErr = error;
      const msg = String(error.message || error);
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});

app.get('/api/chapas_estoque/search', authMiddleware, async (req, res) => {
  try {
    const q = String(req.query.nomenclatura || '').trim();
    if (!q) return ok(res, []);
    const tables = ['chapas_estoque', 'estoque_chapas', 'estoque'];
    const colsCandidates = ['nomenclatura', 'tipo_papel', 'modelo', 'nom', 'codigo'];
    const results = [];
    const keys = new Set();
    for (const t of tables) {
      for (const col of colsCandidates) {
        try {
          const { data, error } = await supabase.from(t).select('*').ilike(col, `%${q}%`).limit(50);
          if (error) {
            const msg = String(error.message || error);
            if (msg.includes('column') || msg.includes('Could not find')) continue;
            throw error;
          }
          (data || []).forEach((r) => {
            const tp = r.nomenclatura ?? r.tipo_papel ?? r.modelo ?? r.nom ?? r.codigo ?? '';
            const l = r.largura_mm ?? r.largura ?? r.larg ?? null;
            const c = r.comprimento_mm ?? r.comprimento ?? r.comp ?? null;
            const tamStr = r.tamanho ?? r.tam ?? (l && c ? `${l}X${c}` : '');
            const k = [tp, tamStr, r.forn ?? r.fornecedor ?? ''].join('|');
            if (keys.has(k)) return;
            keys.add(k);
            results.push({
              id: r.id || null,
              fornecedor: r.fornecedor ?? r.forn ?? '',
              nomenclatura: tp || '',
              tamanho: tamStr || '',
              quantidade: r.quantidade ?? r.quantidade_atual ?? r.qtd ?? r.saldo ?? 0,
              valor_unitario: r.valor_unitario ?? r.custo_unitario ?? r.val ?? 0,
              nome: r.nome ?? r.descricao ?? '',
              largura_mm: l,
              comprimento_mm: c,
            });
          });
        } catch (_) { continue; }
      }
      if (results.length > 0) break;
    }
    ok(res, results);
  } catch (e) { err(res, e); }
});

app.post('/api/chapas_estoque/reset', authMiddleware, async (req, res) => {
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

app.post('/api/historico_acoes', authMiddleware, async (req, res) => {
  try {
    const row = {
      data_hora: new Date().toISOString(),
      tipo_acao: req.body?.tipo_acao || '',
      descricao: req.body?.descricao || '',
      usuario: req.body?.usuario || 'sistema',
    };
    const tables = ['historico_acoes'];
    let lastErr = null;
    for (const t of tables) {
      const { data, error } = await supabase.from(t).insert([row]).select();
      if (!error) return ok(res, data[0]);
      lastErr = error;
      const msg = String(error.message || error);
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});

app.get('/api/notificacoes', async (req, res) => {
  try {
    const lida = req.query.lida;
    let q = supabase.from('notificacoes').select('*').order('data_hora', { ascending: false }).limit(200);
    if (lida === 'false' || lida === undefined) q = q.eq('lida', false);
    if (lida === 'true') q = q.eq('lida', true);
    const { data, error } = await q;
    if (error) throw error;
    ok(res, data || []);
  } catch (e) { err(res, e); }
});

app.post('/api/notificacoes', async (req, res) => {
  try {
    const row = {
      mensagem: req.body?.mensagem || '',
      tipo: req.body?.tipo || 'info',
      lida: !!req.body?.lida,
      data_hora: req.body?.data_hora || new Date().toISOString(),
      criado_por: req.body?.criado_por || 'sistema',
    };
    const { data, error } = await supabase.from('notificacoes').insert([row]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.patch('/api/notificacoes/:id', async (req, res) => {
  try {
    const payload = { ...req.body };
    const { data, error } = await supabase.from('notificacoes').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.post('/api/notificacoes/clear', async (req, res) => {
  try {
    const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('lida', false);
    if (error) throw error;
    ok(res, true);
  } catch (e) { err(res, e); }
});

app.post('/api/relatorios/dashboard', async (req, res) => {
  try {
    const row = { ...(req.body || {}) };
    const { data, error } = await supabase.from('relatorio_dashboard').insert([row]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.post('/api/relatorios/producao', async (req, res) => {
  try {
    const arr = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.items) ? req.body.items : []);
    if (!Array.isArray(arr) || arr.length === 0) return bad(res, 'vazio');
    const chunk = 1000;
    let inserted = 0;
    for (let i = 0; i < arr.length; i += chunk) {
      const part = arr.slice(i, i + chunk);
      const { error } = await supabase.from('relatorio_producao').insert(part);
      if (error) throw error;
      inserted += part.length;
    }
    ok(res, { inserted });
  } catch (e) { err(res, e); }
});

app.post('/api/relatorios/aparras', async (req, res) => {
  try {
    const arr = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.items) ? req.body.items : (req.body && typeof req.body === 'object' ? [req.body] : []));
    if (!Array.isArray(arr) || arr.length === 0) return bad(res, 'vazio');
    const chunk = 1000;
    let inserted = 0;
    for (let i = 0; i < arr.length; i += chunk) {
      const part = arr.slice(i, i + chunk);
      const { error } = await supabase.from('relatorio_aparras').insert(part);
      if (error) throw error;
      inserted += part.length;
    }
    ok(res, { inserted });
  } catch (e) { err(res, e); }
});

app.put('/api/relatorio/producao/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    delete payload.id;
    const { data, error } = await supabase.from('relatorio_producao').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data && data[0] ? data[0] : null);
  } catch (e) { err(res, e); }
});

app.delete('/api/relatorio/producao/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('relatorio_producao').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

app.put('/api/relatorios/aparras/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    delete payload.id;
    const { data, error } = await supabase.from('relatorio_aparras').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data && data[0] ? data[0] : null);
  } catch (e) { err(res, e); }
});

app.delete('/api/relatorios/aparras/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('relatorio_aparras').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

app.post('/api/relatorios/lancar_of', async (req, res) => {
  try {
    const ofId = req.body?.of_id ? String(req.body.of_id) : '';
    const ofNum = req.body?.of_num ? String(req.body.of_num) : '';
    let of = req.body?.of || null;

    if (!of && ofId) {
      const { data, error } = await supabase.from('ofs').select('*').eq('id', ofId).limit(1);
      if (error) throw error;
      of = data && data[0] ? data[0] : null;
    }

    if (!of && ofNum) {
      const { data, error } = await supabase.from('ofs').select('*').or(`of.eq.${ofNum},numero.eq.${ofNum}`).limit(1);
      if (error) throw error;
      of = data && data[0] ? data[0] : null;
    }

    if (!of) return bad(res, 'OF não encontrada');

    const getDate = (v) => {
      if (!v) return '';
      const s = String(v);
      return s.includes('T') ? s.split('T')[0] : s;
    };
    const dt = getDate(of.data_conclusao || of.data_conclusao_em || of.data_entrega || of.ent || of.dia || of.data_producao || of.created_at || new Date().toISOString());
    const mesRef = dt ? dt.slice(0, 7) : '';

    const maq = Array.isArray(of.maq) ? of.maq : (typeof of.maq === 'string' ? (()=>{try{return JSON.parse(of.maq);}catch(e){return [];}})() : []);
    const maqId = maq[0] || of.maquina || of.maquina_id || '';

    const row = {
      mes_referencia: mesRef,
      data: dt || null,
      maquina: String(maqId || ''),
      vendedor: String(of.vendedor || of.vend || of.vend_id || ''),
      cliente: String(of.cliente || of.cli || of.cli_id || ''),
      tipo_papel: String(of.tipo_papel || of.chp || of.nomenclatura || ''),
      gramatura: of.gramatura != null ? of.gramatura : null,
      comprimento_mm: of.comprimento_mm ?? of.comp ?? null,
      largura_mm: of.largura_mm ?? of.larg ?? null,
      tamanho_m2: of.tamanho_m2 ?? null,
      quantidade: of.quantidade ?? of.qtd ?? null,
      valor_venda: of.valor_venda ?? of.venda ?? null,
      empresa: String(of.empresa || of.emp || of.emp_id || ''),
      desperdicio: of.desperdicio ?? null,
    };

    const { data, error } = await supabase.from('relatorio_producao').insert([row]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.post('/api/relatorio/producao/manual', async (req, res) => {
  try {
    const row = { ...(req.body || {}) };
    if (!row.mes_referencia) return bad(res, 'mes_referencia obrigatório');
    const { data, error } = await supabase.from('relatorio_producao').insert([row]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.get('/api/relatorio/producao', async (req, res) => {
  try {
    const mes = String(req.query.mes || '').trim();
    if (!mes) return bad(res, 'mes obrigatório');
    const { data, error } = await supabase.from('relatorio_producao').select('*').eq('mes_referencia', mes).order('data');
    if (error) throw error;
    ok(res, data || []);
  } catch (e) { err(res, e); }
});

app.get('/api/relatorio/aparras', async (req, res) => {
  try {
    const mes = String(req.query.mes || '').trim();
    if (!mes) return bad(res, 'mes obrigatório');
    const { data, error } = await supabase.from('relatorio_aparras').select('*').eq('mes_referencia', mes).order('data');
    if (error) throw error;
    ok(res, data || []);
  } catch (e) { err(res, e); }
});

app.get('/api/relatorio/dashboard', async (req, res) => {
  try {
    const mes = String(req.query.mes || '').trim();
    if (!mes) return bad(res, 'mes obrigatório');
    const { data, error } = await supabase.from('relatorio_dashboard').select('*').eq('mes_referencia', mes).limit(1);
    if (error) throw error;
    ok(res, (data && data[0]) ? data[0] : null);
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

app.get('/api/recebimento_insumos', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('recebimento_insumos').select('*').order('data_recebimento', { ascending: false });
    if (req.query.mes) q = q.gte('data_recebimento', req.query.mes + '-01').lte('data_recebimento', req.query.mes + '-31');
    if (req.query.empresa) q = q.eq('empresa', req.query.empresa);
    if (req.query.fornecedor) q = q.ilike('fornecedor', '%' + req.query.fornecedor + '%');
    if (req.query.cliente) q = q.ilike('cliente', '%' + req.query.cliente + '%');
    if (req.query.nota_fiscal) q = q.ilike('nota_fiscal', '%' + req.query.nota_fiscal + '%');
    if (req.query.empId) q = q.eq('emp_id', req.query.empId);
    const { data, error } = await q;
    if (error) throw error;
    return ok(res, data || []);
  } catch (e) { err(res, e); }
});

app.post('/api/recebimento_insumos', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('recebimento_insumos').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/recebimento_insumos/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('recebimento_insumos').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/recebimento_insumos/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('recebimento_insumos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

app.get('/api/chapas_categorias', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('chapas_categorias').select('*').order('ordem');
    if (error) throw error;
    ok(res, data || []);
  } catch (e) { err(res, e); }
});

app.post('/api/chapas_categorias', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('chapas_categorias').insert([{ nome: req.body.nome, ordem: req.body.ordem || 0 }]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/chapas_categorias/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('chapas_categorias').update({ nome: req.body.nome, ordem: req.body.ordem }).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/chapas_categorias/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('chapas_categorias').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

app.use((e, req, res, next) => {
  if (!e) return next();
  const msg = String(e.message || e);
  if (e instanceof multer.MulterError) return res.status(400).json({ ok: false, error: msg });
  if (msg.includes('Tipo de arquivo não permitido')) return res.status(400).json({ ok: false, error: msg });
  return res.status(500).json({ ok: false, error: msg });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
