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
      { expiresIn: '8h' }
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
    const { data, error } = await supabase.from('clientes').update(p).eq('id', id).select();
    if (!error) return { data, error: null };
    lastErr = error;
    const msg = String(error.message || error);
    if (msg.includes('column') || msg.includes('Could not find')) continue;
  }
  return { data: null, error: lastErr };
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

app.get('/api/ofs', authMiddleware, async (req, res) => {
  try {
    const from = req.query.from ? String(req.query.from) : '';
    const to = req.query.to ? String(req.query.to) : '';
    const empId = req.query.empId ? String(req.query.empId) : '';
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
        const { data, error } = await q;
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
  try { await deleteOne('ofs', req.params.id); ok(res, true); } catch (e) { bad(res, e.message); }
});

app.patch('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const payload = { ...ofIn(req.body || {}), updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('ofs').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return res.json({ ok: true, data });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
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
    ok(res, data[0]);
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
    const { data, error } = await supabase.from('fornecedores').insert([fornecedoresIn(req.body || {})]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/fornecedores/:id', authMiddleware, async (req, res) => {
  try {
    const payload = fornecedoresIn({ ...(req.body || {}) }); delete payload.id;
    const { data, error } = await supabase.from('fornecedores')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
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
    const { data, error } = await supabase.from('facas_estoque').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});
app.put('/api/facas_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('facas_estoque').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
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
    const { data, error } = await supabase.from('cliches_estoque').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});
app.put('/api/cliches_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('cliches_estoque').update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
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
app.get('/api/chapas_estoque', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const tables = ['chapas_estoque', 'estoque_chapas', 'estoque'];
    let lastErr = null;
    for (const t of tables) {
      const empCols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
      for (const col of empCols) {
        let q = supabase.from(t).select('*');
        if (col) q = q.eq(col, empId);
        let { data, error } = await q
          .order('fornecedor', { ascending: true })
          .order('nomenclatura', { ascending: true })
          .order('tamanho', { ascending: true });
        if (error) {
          const msg = String(error.message || error);
          if (msg.includes('column') || msg.includes('Could not find')) {
            ({ data, error } = await (col ? supabase.from(t).select('*').eq(col, empId) : supabase.from(t).select('*')).order('nome'));
          }
        }
        if (!error) return ok(res, data);
        lastErr = error;
        const msg = String(error.message || error);
        if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;
        if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) break;
        break;
      }
      const msg2 = String(lastErr?.message || lastErr || '');
      if (msg2.includes('does not exist') || msg2.includes('relation') || msg2.includes('not find')) continue;
      throw lastErr;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});
app.post('/api/chapas_estoque', authMiddleware, async (req, res) => {
  try {
    const tables = ['chapas_estoque', 'estoque_chapas', 'estoque'];
    let lastErr = null;
    for (const t of tables) {
      const input = req.body || {};
      const canonical = {
        fornecedor: input.fornecedor ?? input.forn ?? '',
        nomenclatura: input.nomenclatura ?? input.nom ?? input.codigo ?? input.cod ?? input.tipo_papel ?? '',
        tamanho: input.tamanho ?? input.tam ?? '',
        nome: input.nome ?? input.descricao ?? '',
        qual_cnpj: input.qual_cnpj ?? input.cnpj ?? '',
        nf: input.nf ?? '',
        quantidade: input.quantidade ?? input.qtd ?? input.quantidade_atual ?? 0,
        valor_unitario: input.valor_unitario ?? input.val ?? input.custo_unitario ?? 0,
        estoque_minimo: input.estoque_minimo ?? input.min ?? 200
      };
      const tryInsert = async (payload) => supabase.from(t).insert([payload]).select();

      let { data, error } = await tryInsert(canonical);
      if (!error) return ok(res, data[0]);
      lastErr = error;

      const msg = String(error.message || error);
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('not find')) continue;
      if (msg.includes('column') || msg.includes('Could not find')) {
        const payload = { ...input };
        delete payload.valor_total;
        delete payload.total;
        delete payload.vtot;
        ({ data, error } = await tryInsert(payload));
        if (!error) return ok(res, data[0]);
        lastErr = error;
      }
      throw lastErr;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});
app.put('/api/chapas_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const input = { ...req.body }; delete input.id;
    const payload = {
      fornecedor: input.fornecedor ?? input.forn,
      nomenclatura: input.nomenclatura ?? input.nom ?? input.codigo ?? input.cod ?? input.tipo_papel,
      tamanho: input.tamanho ?? input.tam,
      nome: input.nome ?? input.descricao,
      qual_cnpj: input.qual_cnpj ?? input.cnpj,
      nf: input.nf,
      quantidade: input.quantidade ?? input.qtd ?? input.quantidade_atual,
      valor_unitario: input.valor_unitario ?? input.val ?? input.custo_unitario,
      estoque_minimo: input.estoque_minimo ?? input.min
    };
    Object.keys(payload).forEach(k=>payload[k]===undefined && delete payload[k]);
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
        const p = { ...input };
        delete p.valor_total;
        delete p.total;
        delete p.vtot;
        ({ data, error } = await tryUpdate(p));
        if (!error) return ok(res, data[0]);
        lastErr = error;
      }
      throw lastErr;
    }
    throw lastErr;
  } catch (e) { err(res, e); }
});
app.delete('/api/chapas_estoque/:id', authMiddleware, async (req, res) => {
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
    const arr = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.items) ? req.body.items : []);
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

app.use((e, req, res, next) => {
  if (!e) return next();
  const msg = String(e.message || e);
  if (e instanceof multer.MulterError) return res.status(400).json({ ok: false, error: msg });
  if (msg.includes('Tipo de arquivo não permitido')) return res.status(400).json({ ok: false, error: msg });
  return res.status(500).json({ ok: false, error: msg });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
