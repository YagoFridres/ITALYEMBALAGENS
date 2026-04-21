const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const compression = require('compression');
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
  try {
    cacheClearPrefix('chapas_estoque:');
    cacheClearPrefix('chapas_');
  } catch (_) {
    globalThis.__pendingCacheClearPrefixes = ['chapas_estoque:', 'chapas_'];
  }
  console.log('✅ Supabase key:', supabaseKeySource, 'len:', (supabaseKey ? String(supabaseKey).length : 0), 'tipo provável:', (supabaseKey && String(supabaseKey).length > 200 ? 'SERVICE ROLE' : 'ANON/curta'));
}

const app = express();
app.set('etag', false);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const _serverCache = {};
const _serverCacheTTL = {};
const SERVER_CACHE_TTL = 10 * 60 * 1000;

function cacheGet(key) {
  if (_serverCacheTTL[key] && Date.now() < _serverCacheTTL[key]) return _serverCache[key];
  return null;
}
function cacheSet(key, data, ttlMs) {
  _serverCache[key] = data;
  const ttl = Number(ttlMs);
  _serverCacheTTL[key] = Date.now() + (Number.isFinite(ttl) && ttl > 0 ? ttl : SERVER_CACHE_TTL);
}
function cacheClear(key) {
  delete _serverCache[key];
  delete _serverCacheTTL[key];
}
function cacheClearPrefix(prefix) {
  Object.keys(_serverCache).forEach((k) => {
    if (k.startsWith(prefix)) cacheClear(k);
  });
  Object.keys(_serverCacheTTL).forEach((k) => {
    if (k.startsWith(prefix)) cacheClear(k);
  });
}
if (Array.isArray(globalThis.__pendingCacheClearPrefixes) && globalThis.__pendingCacheClearPrefixes.length) {
  globalThis.__pendingCacheClearPrefixes.forEach((p) => {
    try { cacheClearPrefix(String(p || '')); } catch (_) {}
  });
  try { delete globalThis.__pendingCacheClearPrefixes; } catch (_) { globalThis.__pendingCacheClearPrefixes = null; }
}

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

app.post('/api/admin/limpar_uploads', requireAdmin, async (req, res) => {
  try {
    const dirs = [
      path.join(__dirname, 'uploads', 'of'),
      path.join(__dirname, 'uploads', 'chat')
    ];
    let total = 0;
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const p = path.join(dir, f);
        try {
          const st = fs.statSync(p);
          if (st.isFile()) {
            fs.unlinkSync(p);
            total++;
          }
        } catch (e) {}
      }
    }
    return ok(res, { deletados: total });
  } catch (e) { return err(res, e); }
});

const chatUploadDir = path.join(__dirname, 'uploads', 'chat');
try { fs.mkdirSync(chatUploadDir, { recursive: true }); } catch (e) {}

const chatUpload = multer({
  storage: multer.memoryStorage(),
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

const ofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const okExt = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!okExt.has(ext)) return cb(new Error('Tipo de arquivo não permitido'));
    return cb(null, true);
  },
});

app.post('/api/chat/upload', authMiddleware, chatUpload.single('file'), async (req, res) => {
  try {
    const f = req.file || null;
    if (!f) return res.status(400).json({ ok: false, error: 'Arquivo obrigatório' });
    const ext = path.extname(f.originalname || '').toLowerCase();
    const filename = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const { error } = await supabase.storage
      .from('uploads')
      .upload(filename, f.buffer, { contentType: f.mimetype, upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filename);
    return ok(res, { url: urlData?.publicUrl || '' });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
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
      .limit(100);
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
  if (table !== 'ofs') {
    const { data, error } = await supabase.from(table).insert([row]).select('*').limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
  }
  let payload = { ...(row || {}) };
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { data, error } = await supabase.from(table).insert([payload]).select('*').limit(1);
    if (!error) return (data && data[0]) || null;
    const msg = String(error.message || error);
    const col = msg.match(/Could not find the '([^']+)' column/)?.[1];
    if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
      delete payload[col];
      continue;
    }
    throw error;
  }
  throw new Error('Falha ao inserir OF após tentativas');
}

async function updateOne(table, id, row) {
  if (!supabase) throw new Error('Supabase não configurado no ambiente. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY).');
  if (table !== 'ofs') {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
  }
  let payload = { ...(row || {}) };
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select('*').limit(1);
    if (!error) return (data && data[0]) || null;
    const msg = String(error.message || error);
    const col = msg.match(/Could not find the '([^']+)' column/)?.[1];
    if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
      delete payload[col];
      continue;
    }
    throw error;
  }
  throw new Error('Falha ao atualizar OF após tentativas');
}

async function deleteOne(table, id) {
  if (!supabase) throw new Error('Supabase não configurado no ambiente. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY).');
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

function ofIn(p) {
  const out = { ...p };
  const sanitizeDate = (v) => {
    if (v === undefined || v === null) return v;
    const s = String(v).trim();
    return s === '' ? null : s;
  };
  delete out.val;
  delete out.valor;
  delete out.vtot;
  delete out.vunit;
  if (out.valor_total === undefined && out.valor_venda !== undefined) {
    out.valor_total = out.valor_venda;
  }
  if (out.valor_venda === undefined && out.valor_total !== undefined) {
    out.valor_venda = out.valor_total;
  }
  const has = (k) => Object.prototype.hasOwnProperty.call(p || {}, k);
  if (has('maq')) {
    out.maq = Array.isArray(p.maq) ? JSON.stringify(p.maq) : (typeof p.maq === 'string' ? p.maq : '[]');
  }
  if (has('imgs')) {
    out.imgs = Array.isArray(p.imgs) ? JSON.stringify(p.imgs) : (typeof p.imgs === 'string' ? p.imgs : '[]');
  }
  if (has('itens')) {
    if (Array.isArray(p.itens)) out.itens = p.itens;
    else if (typeof p.itens === 'string') {
      try { out.itens = JSON.parse(p.itens || '[]'); } catch (e) { out.itens = []; }
    } else out.itens = [];
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
  if (has('chapa_id')) out.chapa_id = p.chapa_id ? String(p.chapa_id) : null;
  if (has('chp') && !has('chapa_id')) out.chapa_id = p.chp ? String(p.chp) : null;
  if (has('qtd_chapas')) out.qtd_chapas = Math.trunc(Number(p.qtd_chapas) || 0);
  if (has('qchp') && !has('qtd_chapas')) out.qtd_chapas = Math.trunc(Number(p.qchp) || 0);
  if (has('dia')) out.dia = sanitizeDate(p.dia);
  if (has('ent')) out.ent = sanitizeDate(p.ent);
  if (has('data_producao')) out.data_producao = sanitizeDate(p.data_producao);
  if (has('data_entrega')) out.data_entrega = sanitizeDate(p.data_entrega);
  if (has('data_conclusao')) out.data_conclusao = sanitizeDate(p.data_conclusao);
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

async function ofsInsertWithRetry(row) {
  let p = { ...(row || {}) };
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const r = await supabase.from('ofs').insert([p]).select('*').single();
    if (!r.error) return r;
    const msg = String(r.error.message || r.error);
    const col = msg.match(/Could not find the '([^']+)' column/)?.[1];
    if (col && Object.prototype.hasOwnProperty.call(p, col)) {
      delete p[col];
      continue;
    }
    return r;
  }
  return { data: null, error: { message: 'Falha ao inserir OF após tentativas' } };
}

async function ofsUpdateWithRetry(id, row) {
  let p = { ...(row || {}) };
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const r = await supabase.from('ofs').update(p).eq('id', id).select('*').single();
    if (!r.error) return r;
    const msg = String(r.error.message || r.error);
    const col = msg.match(/Could not find the '([^']+)' column/)?.[1];
    if (col && Object.prototype.hasOwnProperty.call(p, col)) {
      delete p[col];
      continue;
    }
    return r;
  }
  return { data: null, error: { message: 'Falha ao atualizar OF após tentativas' } };
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
    const status = req.query.status ? String(req.query.status) : '';
    const hasPaging = req.query.limit != null || req.query.offset != null;
    const limit = Math.min(parseInt(String(req.query.limit || ''), 10) || 100, 500);
    const offset = parseInt(String(req.query.offset || ''), 10) || 0;
    const lite = String(req.query.lite || '') === '1';
    const selectSlim = "id,of,seq,status,dia,ent,cli_id,cliId,prodDesc,qtd,maq,fluxo_maquinas,maquina_atual_index,emp_id,vendedor,vend_id,valor_total,valor_venda,obs,imgs,deleted_at,of_numero,numero,descricao,created_at,data_producao,data_entrega,chapa_id,qtd_chapas";
    const incluirExcluidas = String(req.query.incluir_excluidas || '') === '1';
    const excluirCanceladas = String(req.query.excluir_canceladas || '') === '1';
    const empCols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    const fields = (from || to) ? ['data_producao', 'dia', 'created_at'] : [null];
    const cacheKey = 'ofs:' + empId + ':' + status + ':' + from + ':' + to + ':' + String(incluirExcluidas ? '1' : '0') + ':' + String(lite ? '1' : '0') + ':' + String(req.query.limit || '') + ':' + String(req.query.offset || '');
    const cached = cacheGet(cacheKey);
    if (cached) return ok(res, cached);

    let lastError = null;
    for (const empCol of empCols) {
      for (const field of fields) {
        let q = supabase.from('ofs').select(selectSlim).order('seq', { ascending: true });
        if (empCol) q = q.eq(empCol, empId);
        if (status) q = q.eq('status', status);
        if (excluirCanceladas) q = q.neq('status', 'Cancelada').neq('status', 'Cancelado');
        if (field) {
          if (from) q = q.gte(field, from);
          if (to) q = q.lte(field, to);
        }
        if (!incluirExcluidas) {
          try { q = q.is('deleted_at', null); } catch (_) {}
        }
        if (hasPaging) q = q.range(offset, offset + limit - 1);
        else q = q.limit(200);

        let { data, error } = await q;
        if (error) {
          const msg = String(error.message || error);
          const isMissingColumn = msg.toLowerCase().includes('does not exist') || msg.includes('Could not find');
          if (isMissingColumn) {
            let q3 = supabase.from('ofs').select('*').order('seq', { ascending: true });
            if (empCol) q3 = q3.eq(empCol, empId);
            if (status) q3 = q3.eq('status', status);
            if (excluirCanceladas) q3 = q3.neq('status', 'Cancelada').neq('status', 'Cancelado');
            if (field) {
              if (from) q3 = q3.gte(field, from);
              if (to) q3 = q3.lte(field, to);
            }
            if (!incluirExcluidas) {
              try { q3 = q3.is('deleted_at', null); } catch (_) {}
            }
            if (hasPaging) q3 = q3.range(offset, offset + limit - 1);
            else q3 = q3.limit(200);
            const r3 = await q3;
            data = r3.data;
            error = r3.error;
          }
        }
        if (error) {
          const msg = String(error.message || error);
          if (!incluirExcluidas && msg.toLowerCase().includes("deleted_at") && (msg.includes('column') || msg.includes('Could not find'))) {
            let q2 = supabase.from('ofs').select(selectSlim).order('seq', { ascending: true });
            if (empCol) q2 = q2.eq(empCol, empId);
            if (status) q2 = q2.eq('status', status);
            if (excluirCanceladas) q2 = q2.neq('status', 'Cancelada').neq('status', 'Cancelado');
            if (field) {
              if (from) q2 = q2.gte(field, from);
              if (to) q2 = q2.lte(field, to);
            }
            if (hasPaging) q2 = q2.range(offset, offset + limit - 1);
            else q2 = q2.limit(200);
            const r2 = await q2;
            data = r2.data;
            error = r2.error;
          }
        }

        if (!error) {
          const rows = data || [];
          if (!lite) {
            cacheSet(cacheKey, rows, 3 * 60 * 1000);
            return ok(res, rows);
          }
          const trimmed = rows.map((r) => ({
            id: r.id,
            seq: r.seq ?? r.prioridade ?? null,
            of: r.of ?? r.numero ?? r.of_num ?? r.ofNum ?? null,
            numero: r.numero ?? null,
            of_num: r.of_num ?? null,
            cli_id: r.cli_id ?? r.cliente_id ?? r.cliId ?? r.clienteId ?? null,
            cliente_id: r.cliente_id ?? null,
            cliente_nome: r.cliente_nome ?? r.cliente ?? r.cli_nome ?? null,
            vendId: r.vendId ?? r.vendedor_id ?? r.vendedorId ?? null,
            vendedor_id: r.vendedor_id ?? null,
            vendedor_nome: r.vendedor_nome ?? r.vendedor ?? null,
            status: r.status ?? null,
            urg: r.urg ?? r.urgente ?? null,
            urgente: r.urgente ?? null,
            qtd: r.qtd ?? r.quantidade ?? null,
            quantidade: r.quantidade ?? null,
            dia: r.dia ?? r.data_producao ?? null,
            data_producao: r.data_producao ?? null,
            ent: r.ent ?? r.data_entrega ?? null,
            data_entrega: r.data_entrega ?? null,
            fluxo: r.fluxo ?? null,
            maq: r.maq ?? null,
            fluxo_maquinas: r.fluxo_maquinas ?? null,
            maquina_atual_index: r.maquina_atual_index ?? null,
            imagem_url: r.imagem_url ?? null,
            imgs: r.imgs ?? null,
            descricao: r.descricao ?? r.prod_desc ?? null,
            obs: r.obs ?? r.obs2 ?? null,
            emp_id: r.emp_id ?? r.empId ?? null,
            deleted_at: r.deleted_at ?? null,
            created_at: r.created_at ?? null,
          }));
          cacheSet(cacheKey, trimmed, 3 * 60 * 1000);
          return ok(res, trimmed);
        }
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
async function _maybeRegistrarComissaoOF(req, body, ofRow) {
  try {
    const vendedorId = String(body?.vendedor_id ?? body?.vend_id ?? body?.vendId ?? ofRow?.vendedor_id ?? ofRow?.vend_id ?? ofRow?.vendId ?? '').trim();
    const valorOf = Number(body?.valor_total ?? body?.valor_venda ?? ofRow?.valor_total ?? ofRow?.valor_venda ?? 0);
    console.log('[COMISSAO] vendedorId:', vendedorId, 'valorOf:', valorOf);
    if (!vendedorId || !(valorOf > 0)) return;
    const { data: vend } = await supabase.from('vendedores').select('*').eq('id', vendedorId).maybeSingle();
    const perc = Number(vend?.comissao_pct ?? vend?.comissao ?? vend?.comissaoPct ?? 0);
    console.log('[OF COMISSAO] vendedorId:', vendedorId, 'valorOf:', valorOf, 'comissao%:', perc);
    if (!(perc > 0)) return;
    const valorComissao = valorOf * (perc / 100);
    const numero = body?.of ?? body?.numero ?? ofRow?.of ?? ofRow?.numero ?? '';
    await supabase.from('historico_acoes').insert([{
      tipo_acao: 'comissao_of',
      descricao: `Comissão OF #${numero || ''}: ${vend?.nome || ''} — R$ ${valorComissao.toFixed(2)} (${perc}% de R$ ${valorOf.toFixed(2)})`,
      usuario: req.usuario?.nome || 'sistema',
      data_hora: new Date().toISOString()
    }]);
  } catch (e) {}
}

async function _maybeBaixaAutomaticaChapasOF(req, body, ofRow) {
  try {
    if (body && body._estoqueJaBaixadoCriacao) return;
    const chapaId = String(body?.chapa_id ?? body?.chapaId ?? body?.chp ?? ofRow?.chapa_id ?? ofRow?.chapaId ?? ofRow?.chp ?? '').trim();
    const qtdChapas = Math.trunc(Number(body?.qtd_chapas ?? body?.qtdChapas ?? body?.qchp ?? 0) || 0);
    console.log('[OF BAIXA CHAPAS] chapaId:', chapaId, 'qtdChapas:', qtdChapas);
    if (!chapaId || !(qtdChapas > 0)) return;
    const table = await _chapasPreferV2Table();
    if (!table) return;
    const { data: chapa, error: e1 } = await supabase.from(table).select('*').eq('id', chapaId).single();
    if (e1 || !chapa) return;
    const canonChapa = _chapasCanonicalFromAny(chapa, table);
    const qtdAtual = Math.trunc(Number(canonChapa.quantidade || 0) || 0);
    const qtdNova = Math.max(0, qtdAtual - qtdChapas);
    const updPayload = table === 'chapas_estoque_v2'
      ? { quantidade: qtdNova, atualizado_por: req.usuario?.nome || 'sistema' }
      : { qtd: qtdNova };
    const upd = await supabase.from(table).update(updPayload).eq('id', chapaId);
    if (upd.error) return;
    cacheClearPrefix('chapas_estoque:');

    if (table === 'chapas_estoque_v2') {
      const ofNumero = body?.of ?? body?.numero ?? ofRow?.of ?? ofRow?.numero ?? null;
      const cliRef = body?.cliId ?? body?.cli_id ?? body?.cliente_id ?? ofRow?.cliId ?? ofRow?.cli_id ?? ofRow?.cliente_id ?? '';
      const empId = body?.emp_id ?? body?.empId ?? ofRow?.emp_id ?? ofRow?.empId ?? 'E1';
      const mov = {
        chapa_id: chapaId,
        tipo: 'saida',
        delta: -qtdChapas,
        qtd_anterior: qtdAtual,
        qtd_nova: qtdNova,
        obs: `Saída automática - OF #${ofNumero || ''} · Cliente: ${cliRef || ''}`.trim(),
        usuario: req.usuario?.nome || 'sistema',
        emp_id: empId || null,
        of_numero: ofNumero ? String(ofNumero) : null,
      };
      try { await supabase.from('chapas_estoque_movimentos_v2').insert([mov]); } catch (e) {}
    }
  } catch (e) {}
}

app.post('/api/ofs', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    console.log('[OF SAVE]', req.method, req.params.id || 'novo', JSON.stringify(Object.keys(body)));
    const createdRes = await ofsInsertWithRetry(ofIn(body));
    if (createdRes.error) throw createdRes.error;
    const created = createdRes.data;
    await _maybeRegistrarComissaoOF(req, body, created);
    return ok(res, created);
  } catch (e) { bad(res, e.message); }
});

app.get('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const { data, error } = await supabase.from('ofs').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    if (!data) return res.status(404).json({ ok: false, error: 'OF não encontrada' });
    return ok(res, data);
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
});

app.put('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    console.log('[OF SAVE]', req.method, req.params.id || 'novo', JSON.stringify(Object.keys(body)));
    const updRes = await ofsUpdateWithRetry(req.params.id, ofIn(body));
    if (updRes.error) throw updRes.error;
    const updated = updRes.data;
    await _maybeRegistrarComissaoOF(req, body, updated);
    return ok(res, updated);
  } catch (e) { bad(res, e.message); }
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
    try {
      const vendId = String(data?.vendedor_id || '').trim();
      const val = Number(data?.valor_total || data?.valor_venda || 0);
      const numero = data?.of ?? data?.numero ?? '';
      if (vendId && val > 0) {
        await supabase.from('historico_acoes').insert([{
          tipo_acao: 'comissao_cancelada',
          descricao: `Comissão cancelada - OF #${numero || ''} cancelada/excluída`,
          usuario: req.usuario?.nome || 'sistema',
          data_hora: new Date().toISOString()
        }]);
      }
    } catch (_) {}
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
    const ext = path.extname(f.originalname || '').toLowerCase();
    const filename = `of/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const { error } = await supabase.storage
      .from('uploads')
      .upload(filename, f.buffer, { contentType: f.mimetype, upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filename);
    return ok(res, { url: urlData?.publicUrl || '' });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
});

app.get('/api/relatorio/vendedor', authMiddleware, async (req, res) => {
  try {
    console.log('[RELATORIO VENDEDOR] iniciando, query:', req.query);

    const mes = String(req.query.mes || '').trim();
    const de = String(req.query.de || '').trim();
    const ate = String(req.query.ate || '').trim();
    const empId = String(req.query.empId || '').trim();

    const monthBounds = (m) => {
      const s = String(m || '').slice(0, 7);
      const [yy, mm] = s.split('-').map((x) => Number(x));
      if (!(yy > 1900 && mm >= 1 && mm <= 12)) return { ini: '', fim: '' };
      const dtIni = new Date(yy, mm - 1, 1);
      const dtFim = new Date(yy, mm, 0);
      return { ini: dtIni.toISOString().slice(0, 10), fim: dtFim.toISOString().slice(0, 10) };
    };

    const baseCols = [
      'id', 'of', 'numero', 'status', 'dia', 'created_at',
      'cli_id',
      'vendedor_id',
      'valor_total', 'valor_venda',
      'qtd', 'descricao',
      'emp_id', 'deleted_at',
    ];
    const selectWithRetry = async (table, cols, build) => {
      let useCols = cols.slice();
      for (let tentativa = 0; tentativa < 5; tentativa++) {
        const q = build(supabase.from(table).select(useCols.join(',')));
        const r = await q.limit(500);
        if (!r.error) return { data: r.data || [], usedCols: useCols };
        const msg = String(r.error.message || r.error);
        console.error('[RELATORIO VENDEDOR] erro query:', msg);
        const col = msg.match(/Could not find the '([^']+)' column/)?.[1];
        if (col && useCols.includes(col)) {
          useCols = useCols.filter((c) => c !== col);
          continue;
        }
        throw r.error;
      }
      throw new Error('Falha ao buscar OFs após tentativas');
    };

    const { ini: iniMes, fim: fimMes } = mes ? monthBounds(mes) : { ini: '', fim: '' };
    const diaIni = mes ? iniMes : (de || '');
    const diaFim = mes ? fimMes : (ate || '');

    let ofs = [];
    try {
      const r1 = await selectWithRetry('ofs', baseCols, (q) => {
        let qq = q;
        if (empId) qq = qq.eq('emp_id', empId);
        if (diaIni && diaFim) qq = qq.gte('dia', diaIni).lte('dia', diaFim);
        return qq;
      });
      ofs = r1.data || [];
    } catch (error) {
      console.error('[RELATORIO VENDEDOR] erro query ofs:', String(error?.message || error));
      const cols2 = [
        'id', 'of', 'numero', 'status', 'dia', 'created_at',
        'cli_id',
        'vendedor_id',
        'valor_total', 'valor_venda',
        'qtd', 'descricao',
        'emp_id',
      ];
      const r2 = await selectWithRetry('ofs', cols2, (q) => {
        let qq = q;
        if (empId) qq = qq.eq('emp_id', empId);
        if (mes && iniMes && fimMes) qq = qq.gte('created_at', iniMes).lte('created_at', fimMes);
        return qq;
      });
      ofs = r2.data || [];
    }

    ofs = (ofs || []).filter((of) => {
      if (!of) return false;
      const st = String(of.status || '').toLowerCase();
      if (st === 'cancelada' || st === 'cancelado') return false;
      if (of.deleted_at) return false;
      return true;
    });

    console.log('[RELATORIO VENDEDOR] OFs após filtro:', ofs.length);

    const cliIds = Array.from(new Set((ofs || []).map((o) => String(o?.cli_id || '').trim()).filter(Boolean)));
    const mapCli = {};
    if (cliIds.length) {
      try {
        const { data: clis, error: ec } = await supabase.from('clientes').select('id,nome').in('id', cliIds);
        if (!ec) (clis || []).forEach((c) => { if (c && c.id) mapCli[String(c.id)] = c.nome || ''; });
      } catch (_) {}
    }

    const { data: vendedores, error: ev } = await supabase.from('vendedores').select('id,nome,comissao_pct');
    if (ev) throw ev;
    const mapVend = {};
    (vendedores || []).forEach((v) => {
      mapVend[String(v.id)] = { id: v.id, nome: v.nome || '', pct: Number(v.comissao_pct || 0) };
    });

    console.log('[RELATORIO VENDEDOR] vendedores:', Object.keys(mapVend).length);

    const grupos = {};
    let totalGeral = 0;
    let totalComissao = 0;

    for (const ofRow of ofs) {
      const vendId = String(ofRow.vendedor_id || '').trim();
      if (!vendId) continue;

      const vend = mapVend[vendId];
      const vendNome = vend ? vend.nome : 'Vendedor não encontrado';
      const pct = vend ? vend.pct : 0;
      const valor = Number(ofRow.valor_total || ofRow.valor_venda || 0);
      const comissaoOf = valor * (pct / 100);
      const dtOf = ofRow.dia || (ofRow.created_at ? String(ofRow.created_at).slice(0, 10) : '');

      if (!grupos[vendId]) {
        grupos[vendId] = {
          vendedorId: vendId,
          vendedor: vendNome,
          comissaoPct: pct,
          pedidos: 0,
          qtdTotal: 0,
          valorTotal: 0,
          comissaoTotal: 0,
          ofs: [],
        };
      }

      grupos[vendId].pedidos++;
      grupos[vendId].qtdTotal += Number(ofRow.qtd || 0);
      grupos[vendId].valorTotal += valor;
      grupos[vendId].comissaoTotal += comissaoOf;
      grupos[vendId].ofs.push({
        numero: ofRow.of || ofRow.numero || '',
        cliente: mapCli[String(ofRow.cli_id || '').trim()] || (ofRow.cli_id || ''),
        descricao: ofRow.descricao || '',
        qtd: Number(ofRow.qtd || 0),
        valor,
        comissaoPct: pct,
        comissaoValor: comissaoOf,
        dataPedido: dtOf,
        status: ofRow.status || '',
      });

      totalGeral += valor;
      totalComissao += comissaoOf;
    }

    const resultado = Object.values(grupos)
      .map((g) => ({ ...g, ticketMedio: g.pedidos > 0 ? g.valorTotal / g.pedidos : 0 }))
      .sort((a, b) => b.valorTotal - a.valorTotal);

    console.log('[RELATORIO VENDEDOR] grupos:', resultado.length);

    return res.json({
      vendedores: resultado,
      totalGeral,
      totalComissao,
      totalPedidos: ofs.length,
    });
  } catch (e) {
    console.error('[RELATORIO VENDEDOR] ERRO FATAL:', e?.message, e?.stack);
    return res.status(500).json({ error: String(e.message || e) });
  }
});
app.patch('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const payload = { ...ofIn(req.body || {}), updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('ofs').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    try {
      const st = String(payload?.status || '').trim().toLowerCase();
      if (st === 'cancelada' || st === 'cancelado') {
        const vendId = String(data?.vendedor_id || '').trim();
        const val = Number(data?.valor_total || data?.valor_venda || 0);
        const numero = data?.of ?? data?.numero ?? '';
        if (vendId && val > 0) {
          await supabase.from('historico_acoes').insert([{
            tipo_acao: 'comissao_cancelada',
            descricao: `Comissão cancelada - OF #${numero || ''} cancelada/excluída`,
            usuario: req.usuario?.nome || 'sistema',
            data_hora: new Date().toISOString()
          }]);
        }
      }
    } catch (_) {}
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
    if (req.body && req.body.qtd_real != null && Number(req.body.qtd_real) > 0) {
      const qtdOriginal = Number(of.qtd || req.body.qtd_real);
      const qtdReal = Number(req.body.qtd_real);
      payload.qtd = qtdReal;

      const valorOriginal = Number(of.valor_total || of.valor_venda || 0);
      if (valorOriginal > 0 && qtdOriginal > 0) {
        const novoValor = (qtdReal / qtdOriginal) * valorOriginal;
        payload.valor_total = Math.round(novoValor * 100) / 100;
        payload.valor_venda = payload.valor_total;
      }
    }
    console.log('[BAIXA FINAL] payload update:', payload);
    let upd = await supabase.from('ofs').update(payload).eq('id', id).select('*').single();
    console.log('[BAIXA FINAL] upd.error:', upd.error);
    if (upd.error) {
      const msg = String(upd.error.message || upd.error);
      if (msg.includes('column') || msg.includes('Could not find')) {
        const fallbackPayload = { status: concluida ? 'Pedido Pronto' : 'Em Produção' };
        upd = await supabase.from('ofs').update(fallbackPayload).eq('id', id).select('*').single();
        console.log('[BAIXA] fallback upd.data:', upd.data, 'upd.error:', upd.error);
      }
    }
    if (upd.error) throw upd.error;
    if (concluida) {
      try {
        const row = upd && upd.data ? upd.data : of;
        await _maybeRegistrarComissaoOF(req, {
          vendedor_id: row?.vendedor_id ?? of?.vendedor_id ?? null,
          valor_total: row?.valor_total ?? row?.valor_venda ?? null,
          valor_venda: row?.valor_venda ?? null,
          of: row?.of ?? of?.of ?? null,
          numero: row?.numero ?? of?.numero ?? null,
        }, row);
      } catch (_) {}
    }

    const usuario = req.body?.usuario ? String(req.body.usuario) : 'sistema';
    const numero = of.of != null ? of.of : (of.numero != null ? of.numero : '');
    const msg = concluida
      ? `OF #${numero} baixada em ${atual || '—'} — PEDIDO PRONTO ✓`
      : `OF #${numero} baixada em ${atual || '—'} → próxima: ${proxima || '—'}`;

    if (concluida) {
      try {
        const ofRel = (upd && upd.data) ? upd.data : of;
        const mesRef = new Date().toISOString().slice(0, 7);
        await supabase.from('relatorio_producao').insert([{
          mes_referencia: mesRef,
          data: nowIso.slice(0, 10),
          of_numero: numero || '',
          cliente: of.cli_id ?? of.cliente_id ?? of.cliId ?? '',
          produto: of.prodDesc ?? of.prod_desc ?? of.prod ?? of.descricao ?? '',
          quantidade: ofRel.qtd ?? ofRel.quantidade ?? 0,
          valor: ofRel.valor_total ?? ofRel.valor_venda ?? 0,
          maquina: atual || '',
          status: 'Pedido Pronto',
        }]);
      } catch (e) {}
    }

    if (concluida) {
      try {
        const ofAtual = upd && upd.data ? upd.data : of;
        const chapaId = String(ofAtual?.chapa_id || ofAtual?.chp || '').trim();
        const ofNumRef = String(ofAtual?.of ?? ofAtual?.numero ?? '').trim();
        let jaBaixado = false;
        const tableCh = await _chapasPreferV2Table();
        if (tableCh === 'chapas_estoque_v2' && chapaId && ofNumRef) {
          const ex = await supabase
            .from('chapas_estoque_movimentos_v2')
            .select('id')
            .eq('chapa_id', chapaId)
            .eq('of_numero', ofNumRef)
            .eq('tipo', 'saida')
            .limit(1)
            .maybeSingle();
          if (!ex.error && ex.data) jaBaixado = true;
        }
        if (!jaBaixado) await _maybeBaixaAutomaticaChapasOF(req, ofAtual, ofAtual);
        const itens = Array.isArray(ofAtual?.itens) ? ofAtual.itens : (typeof ofAtual?.itens === 'string' ? JSON.parse(ofAtual.itens || '[]') : []);
        for (const item of itens) {
          const itemChapaId = String(item?.chapa_id || '').trim();
          const itemQtdChapas = Number(item?.qtd_chapas || 0);
          if (!itemChapaId || !(itemQtdChapas > 0)) continue;
          await _maybeBaixaAutomaticaChapasOF(req, {
            chapa_id: itemChapaId,
            qtd_chapas: itemQtdChapas,
            _estoqueJaBaixadoCriacao: false,
          }, ofAtual);
        }
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
    const hasPaging = req.query.limit != null || req.query.offset != null;
    const limit = Math.min(parseInt(String(req.query.limit || ''), 10) || 100, 500);
    const offset = parseInt(String(req.query.offset || ''), 10) || 0;
    const lite = String(req.query.lite || '') === '1';
    const cacheKey = !hasPaging ? ('clientes_' + (empId || 'all') + ':' + (lite ? 'lite' : 'full')) : '';
    if (cacheKey) {
      const cached = cacheGet(cacheKey);
      if (cached) return ok(res, cached);
    }
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    const selectSlim = 'id,nome,razao_social,cnpj,tel,email,cidade,estado,vendedor_id,emp_id,ativo,ramo_atividade,rs,ie,uf,end,ramo,pagto,rep,obs,observacoes,vendedor,vendId,empId';
    for (const col of cols) {
      let q = supabase.from('clientes').select(selectSlim).order('nome');
      if (col) q = q.eq(col, empId);
      if (hasPaging) q = q.range(offset, offset + limit - 1);
      const { data, error } = await q;
      if (!error) {
        const rows = data || [];
        if (!lite) {
          if (cacheKey) cacheSet(cacheKey, rows);
          return ok(res, rows);
        }
        const trimmed = rows.map((r) => ({
          id: r.id,
          nome: r.nome ?? null,
          rs: r.rs ?? r.razao_social ?? r.razaoSocial ?? null,
          razao_social: r.razao_social ?? null,
          cnpj: r.cnpj ?? null,
          ie: r.ie ?? null,
          tel: r.tel ?? r.telefone ?? null,
          telefone: r.telefone ?? null,
          email: r.email ?? null,
          cidade: r.cidade ?? null,
          uf: r.uf ?? null,
          ramo: r.ramo ?? null,
          emp_id: r.emp_id ?? r.empId ?? null,
          empId: r.empId ?? null,
          vendedor_id: r.vendedor_id ?? r.vendId ?? r.vendedorId ?? null,
          vendId: r.vendId ?? null,
          obs: r.obs ?? r.observacoes ?? null,
          observacoes: r.observacoes ?? null,
        }));
        if (cacheKey) cacheSet(cacheKey, trimmed);
        return ok(res, trimmed);
      }
      lastErr = error;
      const msg = String(error.message || error);
      if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;
      throw error;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});

app.get('/api/clientes/:id/vendedor', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const { data: cli, error: e1 } = await supabase
      .from('clientes')
      .select('id,nome,vendedor_id,vendId,vend_id')
      .eq('id', id)
      .maybeSingle();
    if (e1) throw e1;
    if (!cli) return res.status(404).json({ ok: false, error: 'Cliente não encontrado' });
    const vendedorId = String(cli.vendedor_id || cli.vendId || cli.vend_id || '').trim();
    if (!vendedorId) return res.json({ vendedor_id: null, vendedor_nome: null, comissao_pct: 0 });
    const { data: vend, error: e2 } = await supabase
      .from('vendedores')
      .select('id,nome,comissao_pct')
      .eq('id', vendedorId)
      .maybeSingle();
    if (e2) throw e2;
    return res.json({
      vendedor_id: vendedorId,
      vendedor_nome: vend?.nome || null,
      comissao_pct: Number(vend?.comissao_pct || 0),
    });
  } catch (e) { return err(res, e); }
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
    cacheClearPrefix('clientes_');
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
    cacheClearPrefix('clientes_');
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// VENDEDORES
// ══════════════════════════════════════════════════════════════
app.get('/api/vendedores', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const cacheKey = 'vendedores_' + empId;
    const cached = cacheGet(cacheKey);
    if (cached) return ok(res, cached);
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('vendedores').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) {
        const rows = data || [];
        cacheSet(cacheKey, rows);
        return ok(res, rows);
      }
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
    cacheClearPrefix('vendedores_');
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/vendedores/:id', authMiddleware, async (req, res) => {
  try {
    const payload = vendedoresIn({ ...(req.body || {}) }); delete payload.id;
    const { data, error } = await supabase.from('vendedores')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    cacheClearPrefix('vendedores_');
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/vendedores/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('vendedores').delete().eq('id', req.params.id);
    if (error) throw error;
    cacheClearPrefix('vendedores_');
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

app.get('/api/visitas_vendedor', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('visitas_vendedor').select('*').order('data_visita', { ascending: true });
    if (req.query.vendedor_id) q = q.eq('vendedor_id', String(req.query.vendedor_id));
    if (req.query.status) q = q.eq('status', String(req.query.status));
    if (req.query.data) q = q.eq('data_visita', String(req.query.data));
    if (req.query.empId) q = q.eq('emp_id', String(req.query.empId));
    const { data, error } = await q;
    if (error) throw error;
    ok(res, data || []);
  } catch (e) { err(res, e); }
});

app.post('/api/visitas_vendedor', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('visitas_vendedor').insert([req.body || {}]).select();
    if (error) throw error;
    cacheClearPrefix('clientes_');
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/visitas_vendedor/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...(req.body || {}) }; delete payload.id;
    const { data, error } = await supabase.from('visitas_vendedor').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/visitas_vendedor/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('visitas_vendedor').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// EMPRESAS
// ══════════════════════════════════════════════════════════════
app.get('/api/empresas', async (req, res) => {
  try {
    const cached = cacheGet('empresas');
    if (cached) return ok(res, cached);
    const { data, error } = await supabase.from('empresas').select('*').order('nome');
    if (error) throw error;
    cacheSet('empresas', data || []);
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

app.get('/api/orcamentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const { data, error } = await supabase.from('orcamentos').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    if (!data) return res.status(404).json({ ok: false, error: 'Orçamento não encontrado' });
    return ok(res, data);
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
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
    const cacheKey = 'operadores_' + (empId || 'all');
    const cached = cacheGet(cacheKey);
    if (cached) return ok(res, cached);
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('operadores').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) {
        const rows = data || [];
        cacheSet(cacheKey, rows);
        return ok(res, rows);
      }
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
    cacheClearPrefix('operadores_');
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/operadores/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('operadores')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    cacheClearPrefix('operadores_');
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/operadores/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('operadores').delete().eq('id', req.params.id);
    if (error) throw error;
    cacheClearPrefix('operadores_');
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// MÁQUINAS
// ══════════════════════════════════════════════════════════════
app.get('/api/maquinas', authMiddleware, async (req, res) => {
  try {
    const cached = cacheGet('maquinas');
    if (cached) return ok(res, cached);
    const { data, error } = await supabase.from('maquinas').select('*').order('ordem', { ascending: true });
    if (error) throw error;
    cacheSet('maquinas', data || []);
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
    cacheClear('maquinas');
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
    cacheClear('maquinas');
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/maquinas/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('maquinas').delete().eq('id', req.params.id);
    if (error) throw error;
    cacheClear('maquinas');
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// FLUXOS
// ══════════════════════════════════════════════════════════════
app.get('/api/fluxos', async (req, res) => {
  try {
    const cached = cacheGet('fluxos');
    if (cached) return ok(res, cached);
    const { data, error } = await supabase.from('fluxos').select('*').order('nome');
    if (error) throw error;
    cacheSet('fluxos', data || []);
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/fluxos', authMiddleware, async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    if (!payload.nome) return res.status(400).json({ ok: false, error: 'Nome obrigatório' });
    const parseArr = (v) => {
      if (!v) return [];
      let arr = v;
      if (typeof arr === 'string') {
        try { arr = JSON.parse(arr); } catch (_) { return []; }
      }
      if (!Array.isArray(arr)) return [];
      return arr.map(x => typeof x === 'object' ? (x.nome || x.name || x.id || String(x)) : String(x));
    };
    payload.etapas = parseArr(payload.etapas);
    console.log('[fluxos POST] payload:', payload);
    const { data, error } = await supabase.from('fluxos').insert([payload]).select();
    if (error) { console.error('[fluxos POST] erro:', JSON.stringify(error)); throw error; }
    cacheClear('fluxos');
    ok(res, data[0]);
  } catch (e) { console.error('[fluxos POST] catch:', e && e.message ? e.message : e); err(res, e); }
});

app.put('/api/fluxos/:id', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const parseArr = (v) => {
      if (!v) return [];
      let arr = v;
      if (typeof arr === 'string') {
        try { arr = JSON.parse(arr); } catch (_) { return []; }
      }
      if (!Array.isArray(arr)) return [];
      return arr.map(x => typeof x === 'object' ? (x.nome || x.name || x.id || String(x)) : String(x));
    };
    let etapas = b.etapas;
    if (etapas !== undefined) etapas = parseArr(etapas);
    const payload = {
      nome: b.nome !== undefined ? String(b.nome || '').trim() : undefined,
      descricao: b.descricao !== undefined ? (String(b.descricao || '').trim() || null) : undefined,
      emp_id: (b.emp_id !== undefined || b.empId !== undefined) ? (String(b.emp_id ?? b.empId ?? '').trim() || null) : undefined,
      ativo: b.ativo === undefined ? undefined : (b.ativo === true || b.ativo === 'true' || b.ativo === 1 || b.ativo === '1'),
      etapas: etapas === undefined ? undefined : etapas
    };
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
    const { data, error } = await supabase.from('fluxos').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    cacheClear('fluxos');
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/fluxos/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('fluxos').delete().eq('id', req.params.id);
    if (error) throw error;
    cacheClear('fluxos');
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
    const parseArr = (v) => {
      if (!v) return [];
      let arr = v;
      if (typeof arr === 'string') {
        try { arr = JSON.parse(arr); } catch (_) { return []; }
      }
      if (!Array.isArray(arr)) return [];
      return arr.map(x => typeof x === 'object' ? (x.nome || x.name || x.id || String(x)) : String(x));
    };
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
      maquinas: parseArr(b.maquinas),
      clientes: parseArr(b.clientes),
    };
    Object.keys(payloadBase).forEach(k => payloadBase[k] === undefined && delete payloadBase[k]);
    let payload = { ...payloadBase };
    console.log('[facas POST] payload:', payload);
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.from('facas_estoque').insert([payload]).select();
      if (!error) return ok(res, data[0]);
      console.error('[facas POST] erro:', JSON.stringify(error));
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
    const parseArr = (v) => {
      if (!v) return [];
      let arr = v;
      if (typeof arr === 'string') {
        try { arr = JSON.parse(arr); } catch (_) { return []; }
      }
      if (!Array.isArray(arr)) return [];
      return arr.map(x => typeof x === 'object' ? (x.nome || x.name || x.id || String(x)) : String(x));
    };
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
      maquinas: b.maquinas !== undefined ? parseArr(b.maquinas) : undefined,
      clientes: b.clientes !== undefined ? parseArr(b.clientes) : undefined,
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
    const parseArr = (v) => {
      if (!v) return [];
      let arr = v;
      if (typeof arr === 'string') {
        try { arr = JSON.parse(arr); } catch (_) { return []; }
      }
      if (!Array.isArray(arr)) return [];
      return arr.map(x => typeof x === 'object' ? (x.nome || x.name || x.id || String(x)) : String(x));
    };
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
      maquinas: parseArr(b.maquinas),
      clientes: parseArr(b.clientes),
    };
    Object.keys(payloadBase).forEach(k => payloadBase[k] === undefined && delete payloadBase[k]);
    let payload = { ...payloadBase };
    console.log('[cliches POST] payload:', payload);
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.from('cliches_estoque').insert([payload]).select();
      if (!error) return ok(res, data[0]);
      console.error('[cliches POST] erro:', JSON.stringify(error));
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
    const parseArr = (v) => {
      if (!v) return [];
      let arr = v;
      if (typeof arr === 'string') {
        try { arr = JSON.parse(arr); } catch (_) { return []; }
      }
      if (!Array.isArray(arr)) return [];
      return arr.map(x => typeof x === 'object' ? (x.nome || x.name || x.id || String(x)) : String(x));
    };
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
      maquinas: b.maquinas !== undefined ? parseArr(b.maquinas) : undefined,
      clientes: b.clientes !== undefined ? parseArr(b.clientes) : undefined,
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
  const nome = _chapasGet(row, km, ['nome', 'nome_uso', 'nome uso', 'nome_comercial', 'nome comercial', 'nom', 'descricao', 'desc', 'name']) || nomenclatura;
  const tamanho = _chapasGet(row, km, ['tamanho', 'tam']);
  const qualCnpj = _chapasGet(row, km, ['qual_cnpj', 'qual cnpj', 'qual', 'cnpj', 'fabricante']);
  const nf = _chapasGet(row, km, ['numero_nf', 'nf']);
  const qtd = _chapasNum(_chapasGet(row, km, ['quantidade_atual', 'quantidade', 'qtd', 'saldo']));
  const vunit = _chapasNum(_chapasGet(row, km, ['valor_unitario', 'val', 'custo_unitario', 'valor unitario', 'vunit', 'rs']));
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
  const empresaVinc = qualCnpj || _chapasGet(row, km, ['empresa_vinculada', 'empresa vinculada', 'fabricante_empresa', 'fabricante empresa', 'empresa']) || _chapasEmpresaFromEmpId(empId);
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
    const qEntries = Object.entries(req.query || {}).filter(([_, v]) => String(v ?? '').trim() !== '');
    const hasFiltros = qEntries.length > 0;
    const cacheKey = hasFiltros
      ? ('chapas_estoque:' + table + ':q:' + new URLSearchParams(qEntries.sort((a, b) => String(a[0]).localeCompare(String(b[0])))).toString())
      : ('chapas_estoque:' + table + ':all');
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);
    const selectV2Base = [
      'id','fornecedor','nomenclatura','tamanho','nome_uso','categoria','quantidade',
      'valor_unitario','valor_total','estoque_minimo','emp_id','empresa_vinculada',
      'riscada','cliente_nome','cliente_id','data_entrada','qual_cnpj','qual','nf','vincos','observacao','risca_desc'
    ];
    let selectStr = '*';
    if (table === 'chapas_estoque_v2') selectStr = selectV2Base.join(',');
    let sel = selectStr;
    let data = null;
    let error = null;
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const r = await supabase.from(table).select(sel);
      data = r.data;
      error = r.error;
      if (!error) break;
      const msg = String(error.message || error);
      const col = msg.match(/Could not find the '([^']+)' column/)?.[1];
      if (col && table === 'chapas_estoque_v2' && sel !== '*') {
        const parts = sel.split(',').map(s => s.trim()).filter(Boolean);
        const next = parts.filter(p => p !== col);
        if (next.length === parts.length) break;
        sel = next.join(',');
        continue;
      }
      break;
    }
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
    cacheSet(cacheKey, rows);
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
      cacheClearPrefix('chapas_estoque:');
      await _chapasLogAcao(req, 'estoque_chapas_cadastro', `Chapa cadastrada: ${payload.nome_uso || ''} · ${payload.fornecedor || ''} · ${payload.nomenclatura || ''} · ${payload.tamanho || ''}`);
      return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque_v2'));
    }

    const nomeObrig = String(b.nome_uso || b.nome || b.nom || b.nomenclatura || b.descricao || b.nome_comercial || '').trim();
    const payload = {
      forn: b.fornecedor || b.forn || '',
      nom: b.nomenclatura || b.nom || b.codigo || b.cod || b.nome || '',
      tam: b.tamanho || b.tam || '',
      nome: nomeObrig,
      nome_uso: nomeObrig,
      nome_comercial: b.nome_comercial || b.nomenclatura || b.nom || '',
      qual: b.qual_cnpj || b.qual || '',
      qual_cnpj: b.qual_cnpj || b.qual || '',
      nf: b.nf || '',
      numero_nf: b.numero_nf || b.nf || '',
      qtd: Number(b.quantidade || b.qtd || 0),
      quantidade: Number(b.quantidade || b.qtd || 0),
      quantidade_atual: Number(b.quantidade_atual || b.quantidade || b.qtd || 0),
      val: Number(b.valor_unitario || b.val || 0),
      valor_unitario: Number(b.valor_unitario || b.val || 0),
      vincos: b.vincos || '',
      observacao: b.observacao || b.observacoes || '',
      data_entrada: b.data_entrada || b.dataEntrada || b.entrada_de_dados || null,
      emp_id: b.emp_id || 'E1',
      categoria: b.categoria || 'Estoque Simples',
    };
    let insPayload = { ...payload };
    let data = null;
    let error = null;
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const r = await supabase.from('chapas_estoque').insert(insPayload).select().single();
      data = r.data;
      error = r.error;
      if (!error) break;
      const msg = String(error.message || error);
      const col = msg.match(/Could not find the '([^']+)' column/)?.[1];
      if (col && Object.prototype.hasOwnProperty.call(insPayload, col)) {
        delete insPayload[col];
        continue;
      }
      break;
    }
    if (error) return res.status(500).json({ error: String(error.message || error) });
    cacheClearPrefix('chapas_estoque:');
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
      cacheClearPrefix('chapas_estoque:');
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
    cacheClearPrefix('chapas_estoque:');
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
      cacheClearPrefix('chapas_estoque:');
      await _chapasLogAcao(req, 'estoque_chapas_patch', `Atualização rápida: ${data?.nome_uso || ''} · ${data?.fornecedor || ''} · qtd=${data?.quantidade ?? ''}`);
      return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque_v2'));
    }

    const payload = {};
    if (b.quantidade !== undefined) payload.qtd = Number(b.quantidade);
    if (b.qtd !== undefined) payload.qtd = Number(b.qtd);
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    const { data, error } = await supabase.from('chapas_estoque').update(payload).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    cacheClearPrefix('chapas_estoque:');
    await _chapasLogAcao(req, 'estoque_chapas_patch', `Atualização rápida (legado): ${data?.nom || ''} · ${data?.forn || ''} · qtd=${data?.qtd ?? ''}`);
    return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque'));
  } catch (e) { err(res, e); }
});

app.patch('/api/chapas_estoque/:id/inline', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const table = await _chapasPreferV2Table();
    console.log('[INLINE] table:', table, 'body:', JSON.stringify(b));
    const payload = {};

    // empresa_vinculada só existe na v2; no legado mapear para qual_cnpj/qual
    if ('empresa_vinculada' in b) {
      if (table === 'chapas_estoque_v2') payload.empresa_vinculada = String(b.empresa_vinculada);
      payload.qual_cnpj = String(b.empresa_vinculada);
      payload.qual = String(b.empresa_vinculada);
    }
    if ('qual_cnpj' in b && !('empresa_vinculada' in b)) {
      payload.qual_cnpj = String(b.qual_cnpj);
    }
    if ('categoria' in b) payload.categoria = String(b.categoria || '').trim();
    if ('emp_id' in b) payload.emp_id = String(b.emp_id);
    if ('riscada' in b) payload.riscada = b.riscada === true || b.riscada === 'true';

    if (Object.keys(payload).length === 0) {
      console.warn('[INLINE] payload vazio! body:', JSON.stringify(b));
      return res.status(400).json({ ok: false, error: 'Nenhum campo válido. Body: ' + JSON.stringify(b) });
    }

    if (table === 'chapas_estoque_v2') {
      payload.atualizado_por = req.usuario?.nome || 'sistema';
    }

    console.log('[INLINE] payload:', JSON.stringify(payload));

    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[INLINE] supabase error:', JSON.stringify(error));
      const msg = String(error.message || '');
      const m = msg.match(/Could not find the '([^']+)' column/);
      if (m && m[1] && payload[m[1]] !== undefined) {
        delete payload[m[1]];
        const r2 = await supabase.from(table).update(payload).eq('id', req.params.id).select().maybeSingle();
        if (r2.error) return res.status(500).json({ ok: false, error: r2.error.message });
        cacheClearPrefix('chapas_');
        cacheClearPrefix('chapas_estoque:');
        return res.json({ ok: true, data: r2.data });
      }
      return res.status(500).json({ ok: false, error: error.message });
    }

    cacheClearPrefix('chapas_');
    cacheClearPrefix('chapas_estoque:');
    return res.json({ ok: true, data });
  } catch (e) {
    console.error('[INLINE] catch:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
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
    cacheClearPrefix('chapas_estoque:');

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
    const limit = Math.max(1, Math.min(500, Math.trunc(_chapasToNum(req.query.limit, 120))));
    const chapaId = String(req.query.chapa_id || '').trim();
    const empId = String(req.query.empId || '').trim();

    let movs = null;
    let movErr = null;
    try {
      let q = supabase.from('chapas_estoque_movimentos_v2').select('*').order('created_at', { ascending: false }).limit(limit);
      if (chapaId) q = q.eq('chapa_id', chapaId);
      if (empId) q = q.eq('emp_id', empId);
      const r = await q;
      movs = r?.data || [];
      movErr = r?.error || null;
      if (!movErr && Array.isArray(movs) && movs.length > 0) return ok(res, movs);
    } catch (e) {
      movErr = e;
    }

    if (movErr || !Array.isArray(movs) || movs.length === 0) {
      const tipos = ['estoque_entrada', 'estoque_saida', 'estoque_ajuste', 'estoque_manual', 'estoque_chapas_patch', 'baixa_of'];
      const { data: hist, error: histErr } = await supabase
        .from('historico_acoes')
        .select('*')
        .in('tipo_acao', tipos)
        .order('data_hora', { ascending: false })
        .limit(limit);

      if (histErr) {
        const msg = String(histErr.message || histErr);
        if (msg.includes('does not exist') || msg.includes('relation')) return ok(res, []);
        return res.status(500).json({ ok: false, error: histErr.message });
      }
      return ok(res, (hist || []).map(h => ({
        id: h.id,
        tipo: h.tipo_acao,
        descricao: h.descricao,
        usuario: h.usuario,
        created_at: h.data_hora,
        delta: null,
        qtd_anterior: null,
        qtd_nova: null
      })));
    }

    return ok(res, movs || []);
  } catch (e) { err(res, e); }
});

app.patch('/api/chapas_estoque_movimentos/:id/confirmar', authMiddleware, async (req, res) => {
  try {
    const preferred = await _chapasPreferV2Table();
    if (preferred !== 'chapas_estoque_v2') return res.status(400).json({ ok: false, error: 'Movimentações disponíveis apenas no v2' });
    const movId = String(req.params.id || '').trim();
    if (!movId) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const qtd = Math.trunc(Number(req.body?.qtd_real_utilizada));
    if (!Number.isFinite(qtd) || qtd < 0) return res.status(400).json({ ok: false, error: 'qtd_real_utilizada inválida' });
    const payload = {
      qtd_real_utilizada: qtd,
      confirmado_por: String(req.body?.confirmado_por || req.usuario?.nome || 'sistema'),
      confirmado_em: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('chapas_estoque_movimentos_v2')
      .update(payload)
      .eq('id', movId)
      .select()
      .single();
    if (error) throw error;
    return res.json({ ok: true, data });
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

app.get('/api/relatorio/estoque_inventario', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const table = await _chapasPreferV2Table();

    let qC = supabase.from(table).select('*');
    if (empId) qC = qC.eq('emp_id', empId);
    const { data: chapasRaw } = await qC;
    const chapas = (chapasRaw || []).map((r) => _chapasCanonicalFromAny(r, table));

    const porCategoria = {};
    chapas.forEach((c) => {
      const cat = c.categoria || 'Sem Categoria';
      if (!porCategoria[cat]) porCategoria[cat] = { quantidade: 0, valor_total: 0, itens: [] };
      porCategoria[cat].quantidade += Number(c.quantidade || 0);
      porCategoria[cat].valor_total += Number(c.valor_total || 0);
      porCategoria[cat].itens.push({
        id: c.id, nome: c.nome || c.nomenclatura,
        tamanho: c.tamanho, quantidade: c.quantidade,
        fornecedor: c.fornecedor, estoque_minimo: c.estoque_minimo
      });
    });

    let qF = supabase.from('facas_estoque').select('*');
    if (empId) qF = qF.eq('emp_id', empId);
    const { data: facas } = await qF;

    let qCl = supabase.from('cliches_estoque').select('*');
    if (empId) qCl = qCl.eq('emp_id', empId);
    const { data: cliches } = await qCl;

    return ok(res, {
      chapas: {
        total_itens: chapas.length,
        total_quantidade: chapas.reduce((s, c) => s + Number(c.quantidade || 0), 0),
        total_valor: chapas.reduce((s, c) => s + Number(c.valor_total || 0), 0),
        abaixo_minimo: chapas.filter((c) => Number(c.quantidade) < Number(c.estoque_minimo || 200)).length,
        por_categoria: porCategoria,
      },
      facas: {
        total_itens: (facas || []).length,
        total_quantidade: (facas || []).reduce((s, f) => s + Number(f.quantidade || f.qtd || 0), 0),
        total_valor: (facas || []).reduce((s, f) => s + Number(f.valor || 0), 0),
        itens: (facas || []).map((f) => ({
          id: f.id, nome: f.nome, medidas: f.medidas,
          quantidade: f.quantidade || f.qtd || 0, valor: f.valor || 0
        })),
      },
      cliches: {
        total_itens: (cliches || []).length,
        total_quantidade: (cliches || []).reduce((s, c) => s + Number(c.quantidade || c.qtd || 0), 0),
        total_valor: (cliches || []).reduce((s, c) => s + Number(c.valor || 0), 0),
        itens: (cliches || []).map((c) => ({
          id: c.id, nome: c.nome, medidas: c.medidas,
          quantidade: c.quantidade || c.qtd || 0, valor: c.valor || 0
        })),
      }
    });
  } catch (e) { err(res, e); }
});

app.get('/api/hist_estoque', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('historico_acoes')
      .select('*')
      .ilike('tipo_acao', '%estoque%')
      .order('data_hora', { ascending: false })
      .limit(500);
    if (error) throw error;
    ok(res, data || []);
  } catch (e) { err(res, e); }
});

app.post('/api/hist_estoque', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const descricao = String(
      b.descricao ||
      [b.tipo ? String(b.tipo).toUpperCase() : 'ESTOQUE', b.item_id ? `item=${b.item_id}` : '', b.qtd != null ? `qtd=${b.qtd}` : '', b.motivo || b.obs || '']
        .filter(Boolean)
        .join(' · ')
    ).trim() || 'Movimentação manual de estoque';
    const payload = {
      tipo_acao: 'estoque_manual',
      descricao,
      usuario: b.usuario || req.usuario?.nome || 'sistema',
      data_hora: new Date().toISOString()
    };
    const { data, error } = await supabase.from('historico_acoes').insert([payload]).select();
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
    if (req.query.mes) {
      const m = String(req.query.mes || '').slice(0, 7);
      const [yy, mm] = m.split('-').map((x) => Number(x));
      if (yy > 1900 && mm >= 1 && mm <= 12) {
        const dtIni = new Date(yy, mm - 1, 1);
        const dtFim = new Date(yy, mm, 0);
        const de = dtIni.toISOString().slice(0, 10);
        const ate = dtFim.toISOString().slice(0, 10);
        q = q.gte('data_recebimento', de).lte('data_recebimento', ate);
      }
    }
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
