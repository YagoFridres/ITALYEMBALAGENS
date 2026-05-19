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
const nodemailer = require('nodemailer');
const { XMLParser } = require('fast-xml-parser');
let cron = null;
try { cron = require('node-cron'); } catch (_) { cron = null; }

process.on('uncaughtException', (e) => {
  try { console.error('[CRASH] uncaughtException:', e?.message || e); } catch (_) {}
  try { console.error('[CRASH STACK]', String(e?.stack || '').split('\n').slice(0, 15).join(' | ')); } catch (_) {}
});
process.on('unhandledRejection', (e) => {
  try { console.error('[REJECTION] unhandledRejection:', e?.message || e); } catch (_) {}
  try { console.error('[REJECTION STACK]', String(e?.stack || '').split('\n').slice(0, 15).join(' | ')); } catch (_) {}
});

function parseFluxo(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const raw = String(v || '').trim();
    if (!raw) return [];
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p;
      if (p && typeof p === 'object') {
        const maybe = p.etapas ?? p.maquinas ?? p.sequencia ?? p.maquinas_sequencia ?? p.fluxo ?? p.maq ?? null;
        if (Array.isArray(maybe)) return maybe;
        if (typeof maybe === 'string') return parseFluxo(maybe);
      }
      return [];
    } catch (e) {
      const parts = raw.split(/[,\n;\t|]+/g).map(s => String(s || '').trim()).filter(Boolean);
      return parts.length ? parts : [];
    }
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
  console.error('Aviso: iniciando servidor SEM Supabase configurado (rotas que dependem do banco vão falhar).');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  // Conexão Supabase verificada no startup sem query ao banco
  console.log('✅ Supabase conectado:', supabaseUrl);
}

const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || '').trim();
if (OPENAI_API_KEY) {
  console.log('[IA] OpenAI GPT configurado ✅');
} else {
  console.log('[IA] OpenAI não configurada (opcional)');
}
console.log('[IA] Claude:', !!String(process.env.ANTHROPIC_API_KEY || '').trim(), '| OpenAI:', !!OPENAI_API_KEY);
console.log('[IA DIAGNÓSTICO]', {
  anthropic: process.env.ANTHROPIC_API_KEY ?
    'OK (primeiros 10 chars: ' + String(process.env.ANTHROPIC_API_KEY).slice(0, 10) + ')' :
    'AUSENTE',
  openai: process.env.OPENAI_API_KEY ?
    'OK (primeiros 10 chars: ' + String(process.env.OPENAI_API_KEY).slice(0, 10) + ')' :
    'AUSENTE',
});

let transporter = null;
try {
  const emailUser = String(process.env.EMAIL_USER || '').trim();
  const emailPass = String(process.env.EMAIL_PASS || '').trim();
  if (emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'mail.italyembalagens.com.br',
      port: 587,
      secure: false,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
    });
    transporter.verify((err) => {
      if (err) console.error('[EMAIL] SMTP erro:', String(err?.message || err));
      else console.log('[EMAIL] SMTP Hostgator conectado ✅');
    });
  } else {
    console.log('[EMAIL] SMTP não configurado (EMAIL_USER/EMAIL_PASS ausentes)');
  }
} catch (e) {
  console.error('[EMAIL] erro ao configurar SMTP:', String(e?.message || e));
}

const app = express();
app.set('etag', false);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

function _newRid() {
  try { return crypto.randomBytes(8).toString('hex'); } catch (_) {}
  return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
}
function _safeJson(v) {
  try { return JSON.stringify(v); } catch (_) { return '"[unserializable]"'; }
}
function _reqUserRef(req) {
  try {
    const u = req?.usuario || null;
    const id = u?.id != null ? String(u.id) : '';
    const email = u?.email != null ? String(u.email) : '';
    const nome = u?.nome != null ? String(u.nome) : '';
    return { id, email, nome };
  } catch (_) { return { id: '', email: '', nome: '' }; }
}
function _logApiError(tag, req, err, extra) {
  try {
    const rid = req?._rid || '';
    const user = _reqUserRef(req);
    const line = [
      `[${tag}]`,
      rid ? `rid=${rid}` : '',
      req?.method ? `m=${req.method}` : '',
      req?.originalUrl ? `url=${req.originalUrl}` : '',
      (user.id || user.email || user.nome) ? `user=${_safeJson(user)}` : '',
    ].filter(Boolean).join(' ');
    console.error(line);
    if (extra) console.error(`[${tag}] extra:`, extra);
    if (err instanceof Error) console.error(`[${tag}] err:`, { name: err.name, message: err.message, stack: err.stack });
    else console.error(`[${tag}] err:`, err);
  } catch (_) {}
}

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

app.use((req, res, next) => {
  try {
    req._rid = _newRid();
    res.setHeader('x-request-id', String(req._rid));
  } catch (_) {}
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

app.get('/api/ofs_test', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ ok: false, error: 'supabase_not_configured' });
    const { data, error } = await supabase
      .from('ofs')
      .select('id,numero,status,created_at')
      .limit(3);
    console.log('[OFS TEST]', error?.message || 'OK', Array.isArray(data) ? data.length : null);
    return res.json({ ok: !error, data: data || [], error: error?.message || null });
  } catch (e) {
    console.error('[OFS TEST FATAL]', e?.message);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'italy_secret_2026';

function _getTokenFromReq(req) {
  const raw = String(req.headers.authorization || req.headers.Authorization || '');
  if (raw.toLowerCase().startsWith('bearer ')) return raw.slice(7).trim();
  const x = req.headers['x-access-token'] || req.headers['x-access_token'] || req.headers['x-token'];
  if (x) return String(x).trim();
  const cookieHeader = String(req.headers.cookie || '');
  if (cookieHeader) {
    const m = cookieHeader.match(/(?:^|;\s*)(?:access_token|token)=([^;]+)/i);
    if (m && m[1]) return decodeURIComponent(String(m[1]));
  }
  return '';
}

function authMiddleware(req, res, next) {
  try {
    try { console.log('[AUTH]', req.method, req.path); } catch (_) {}
    if (req && req.usuario && typeof req.usuario === 'object') {
      try { console.log('[AUTH] skip (req.usuario já existe)'); } catch (_) {}
      return next();
    }
    const token = _getTokenFromReq(req);
    if (!token) {
      try { console.log('[AUTH FAIL] token missing', req.path); } catch (_) {}
      return res.status(401).json({ ok: false, error: 'token_missing', redirect: '/login' });
    }
    try {
      req.usuario = jwt.verify(token, JWT_SECRET);
      try { console.log('[AUTH] OK', req.usuario?.email); } catch (_) {}
      return next();
    } catch (e) {
      try { console.log('[AUTH FAIL] token invalid', req.path, e?.message); } catch (_) {}
      return res.status(401).json({ ok: false, error: 'token_invalid', redirect: '/login' });
    }
  } catch (e) {
    try { console.error('[AUTH FATAL]', e?.message); } catch (_) {}
    try { console.error('[AUTH STACK]', e?.stack?.split('\n')?.slice(0, 5)?.join(' | ')); } catch (_) {}
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const u = req.usuario || null;
    const uid = String(u?.id || '').trim();
    if (!uid) return res.status(403).json({ ok: false, error: 'Sem permissão' });

    const { data: dbUser, error: dbErr } = await supabase
      .from('usuarios')
      .select('perfil,permissoes')
      .eq('id', uid)
      .maybeSingle();

    let perfil, perms;
    if (dbErr || !dbUser) {
      console.warn('[REQUIRE ADMIN] fallback JWT:', dbErr?.message || 'not found');
      perfil = String(u?.perfil || '').trim().toLowerCase();
      perms = Array.isArray(u?.permissoes) ? u.permissoes : [];
      if (typeof perms === 'string') { try { perms = JSON.parse(perms); } catch (_) { perms = []; } }
    } else {
      perfil = String(dbUser.perfil || u?.perfil || '').trim().toLowerCase();
      perms = dbUser.permissoes != null ? dbUser.permissoes : (u?.permissoes || []);
      if (!Array.isArray(perms) && typeof perms === 'string') { try { perms = JSON.parse(perms); } catch (_) { perms = []; } }
      perms = Array.isArray(perms) ? perms : [];
    }

    if (perfil === 'admin' || perfil.includes('admin') || perms.includes('tudo')) {
      return next();
    }
    return res.status(403).json({ ok: false, error: 'Sem permissão — requer perfil admin' });
  } catch (e) {
    console.error('[REQUIRE ADMIN] erro:', e?.message);
    try {
      const u = req.usuario || null;
      const perfil = String(u?.perfil || '').trim().toLowerCase();
      const perms = Array.isArray(u?.permissoes) ? u.permissoes : [];
      if (perfil === 'admin' || perfil.includes('admin') || perms.includes('tudo')) return next();
    } catch (_) {}
    return res.status(403).json({ ok: false, error: 'Sem permissão' });
  }
}

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  if (req.method === 'OPTIONS') return next();
  if (req.path === '/api/health') return next();
  if (req.path === '/api/ofs_test') return next();
  if (req.path === '/api/auth/login' || req.path === '/api/auth/login/') return next();
  if (req.path === '/api/auth/refresh' || req.path === '/api/auth/refresh/') return next();
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

async function logAuditoria(tabela, operacao, registroId, dadosAntes, dadosDepois, req) {
  try {
    const ip = req?.headers?.['x-forwarded-for'] || req?.ip || null;
    const row = {
      tabela: String(tabela || '').trim(),
      operacao: String(operacao || '').trim(),
      registro_id: registroId != null ? String(registroId) : null,
      dados_antes: dadosAntes ? dadosAntes : null,
      dados_depois: dadosDepois ? dadosDepois : null,
      usuario_id: req?.usuario?.id != null ? String(req.usuario.id) : null,
      usuario_nome: req?.usuario?.nome || req?.usuario?.email || null,
      ip: ip != null ? String(ip) : null,
      created_at: new Date().toISOString(),
    };
    await supabase.from('audit_log').insert([row]);
  } catch (e) {
    try { console.warn('[AUDIT]', e?.message || e); } catch (_) {}
  }
}

app.get('/api/audit_log', authMiddleware, async (req, res) => {
  try {
    const tabela = req.query.tabela != null ? String(req.query.tabela).trim() : '';
    const operacao = req.query.operacao != null ? String(req.query.operacao).trim() : '';
    const registroId = req.query.registro_id != null ? String(req.query.registro_id).trim() : '';
    const limit = Math.max(1, Math.min(500, parseInt(String(req.query.limit || ''), 10) || 200));
    const offset = Math.max(0, parseInt(String(req.query.offset || ''), 10) || 0);

    let q = supabase.from('audit_log').select('*').order('created_at', { ascending: false });
    if (tabela) q = q.eq('tabela', tabela);
    if (operacao) q = q.eq('operacao', operacao);
    if (registroId) q = q.eq('registro_id', registroId);
    q = q.range(offset, offset + limit - 1);

    const { data, error } = await q;
    if (error) return res.status(500).json({ ok: false, error: error.message || String(error) });
    return ok(res, data || []);
  } catch (e) { return err(res, e); }
});

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
    const body = (req && req.body && typeof req.body === 'object') ? req.body : {};
    const email = body.email ?? body.usuario ?? body.login ?? body.user ?? '';
    const senha = body.senha ?? body.password ?? body.pass ?? '';
    try {
      console.log('[LOGIN DEBUG] body recebido:', JSON.stringify({
        hasBody: !!req.body,
        keys: Object.keys(body || {}),
        email: (email == null ? '' : String(email)).trim().toLowerCase(),
        senhaLen: (senha == null ? 0 : String(senha).length),
      }));
    } catch (_) {}
    if (!email || !senha)
      return res.status(400).json({ error: 'Email e senha obrigatórios' });

    console.log('[LOGIN] chamado', String(email).trim().toLowerCase());
    console.log('[LOGIN DEBUG] email tentado:', String(email).trim().toLowerCase());
    console.log('[LOGIN DEBUG] senha recebida length:', (senha == null ? 0 : String(senha).length));

    const emailNorm = String(email).trim().toLowerCase();
    let rows = null;
    let e1 = null;
    const isMissingColumnErr = (err) => {
      const msg = String(err?.message || err || '').toLowerCase();
      return msg.includes('could not find the') || msg.includes('does not exist');
    };
    const extractMissingCol = (err) => {
      const msg = String(err?.message || err || '');
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column\s+"?(\w+)"?\s+does not exist/i);
      return (m1 && m1[1]) || (m2 && m2[1]) || null;
    };
    const findUser = async (colName, value) => {
      let q = supabase.from('usuarios').select('*').eq(colName, value).limit(1);
      const r1 = await q;
      if (!r1?.error) return r1;
      if (isMissingColumnErr(r1.error) && extractMissingCol(r1.error) === 'ativo') {
        const r2 = await supabase.from('usuarios').select('*').eq(colName, value).limit(1);
        return r2;
      }
      return r1;
    };
    const idCandidates = [
      { col: 'email', val: emailNorm },
      { col: 'usuario', val: emailNorm },
      { col: 'login', val: emailNorm },
      { col: 'user', val: emailNorm },
      { col: 'email', val: String(email).trim() },
      { col: 'usuario', val: String(email).trim() },
      { col: 'login', val: String(email).trim() },
    ];
    for (const c of idCandidates) {
      try {
        const r = await findUser(c.col, c.val);
        if (r?.error) {
          if (isMissingColumnErr(r.error)) continue;
          rows = r.data;
          e1 = r.error;
          break;
        }
        rows = r.data;
        e1 = null;
        if (Array.isArray(rows) && rows.length) break;
      } catch (e) {
        e1 = e;
        break;
      }
    }

    if (e1) {
      console.error('Erro busca usuario:', e1);
      return res.status(500).json({ error: 'Erro ao buscar usuário: ' + e1.message });
    }
    if (!rows || rows.length === 0) {
      console.error('Usuário não encontrado (ou acesso bloqueado por RLS).', {
        email: emailNorm,
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
    const hashCandidates = [usuario?.senha_hash, usuario?.senhaHash, usuario?.hash, usuario?.senha]
      .map((h) => (h == null ? '' : String(h)))
      .filter((h) => String(h || '').trim() !== '');
    const hash = (hashCandidates.find((h) => String(h).startsWith('$2')) || hashCandidates[0] || '').trim();
    console.log('[LOGIN DEBUG] hash do banco:', hash ? hash.substring(0, 20) : '');

    let senhaValida = false;

    const senhaStr = senha == null ? '' : String(senha);
    const senhaTrim = senhaStr.trim();
    const senhaNoNbsp = senhaStr.replace(/\u00A0/g, ' ').trim();
    const senhaNorm = (senhaStr && senhaStr.normalize) ? senhaStr.normalize('NFKC') : senhaStr;
    const senhaNormTrim = (senhaNorm && senhaNorm.normalize) ? senhaNorm.trim() : (senhaNorm || '').trim();

    try {
      senhaValida = await bcrypt.compare(senhaStr, hash);
      if (!senhaValida && senhaTrim && senhaTrim !== senhaStr) senhaValida = await bcrypt.compare(senhaTrim, hash);
      if (!senhaValida && senhaNoNbsp && senhaNoNbsp !== senhaStr) senhaValida = await bcrypt.compare(senhaNoNbsp, hash);
      if (!senhaValida && senhaNorm && senhaNorm !== senhaStr) senhaValida = await bcrypt.compare(senhaNorm, hash);
      if (!senhaValida && senhaNormTrim && senhaNormTrim !== senhaTrim) senhaValida = await bcrypt.compare(senhaNormTrim, hash);
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

    if (!senhaValida && hash && !hash.startsWith('$2')) {
      senhaValida = (senhaStr === hash);
    }

    console.log('[LOGIN]', String(email).trim().toLowerCase(), '| senhaValida:', senhaValida, '| hashInicio:', (hash ? hash.substring(0, 10) : ''));

    if (!senhaValida) return res.status(401).json({ error: 'Senha incorreta' });

    let perms = usuario.permissoes != null ? usuario.permissoes : [];
    if (typeof perms === 'string') { try { perms = JSON.parse(perms); } catch (_) { perms = []; } }
    if (!Array.isArray(perms)) perms = [];
    const perfilNorm = String(usuario.perfil || '').trim().toLowerCase();
    if ((perfilNorm === 'admin' || perfilNorm.includes('admin')) && !perms.includes('tudo')) perms = ['tudo', ...perms];

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        permissoes: perms,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    console.log('[TOKEN GERADO] perfil:', usuario.perfil, 'permissoes:', usuario.permissoes);

    await supabase.from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', usuario.id)
      .select('id')
      .maybeSingle();

    console.log('Login OK:', usuario.email);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        permissoes: perms,
        canais_chat: usuario.canais_chat,
        avatar_iniciais: usuario.avatar_iniciais || 'AD',
        avatar_cor: usuario.avatar_cor || '#4A90D9',
      },
    });
  } catch (err) {
    try { console.error('[LOGIN ERROR]', err?.message, err?.stack); } catch (_) {}
    res.status(500).json({ error: 'Erro interno: ' + String(err?.message || err) });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', req.usuario.id)
      .maybeSingle();
    if (error || !usuario) {
      const msg = String(error?.message || error || '');
      console.warn('[AUTH/ME] não encontrou no banco, usando JWT. err:', msg);
      return res.json({
        id: req.usuario?.id,
        nome: req.usuario?.nome,
        email: req.usuario?.email,
        perfil: req.usuario?.perfil,
        permissoes: req.usuario?.permissoes || [],
        canais_chat: req.usuario?.canais_chat,
        avatar_iniciais: req.usuario?.avatar_iniciais,
        avatar_cor: req.usuario?.avatar_cor,
      });
    }
    let perms = usuario.permissoes != null ? usuario.permissoes : [];
    if (typeof perms === 'string') { try { perms = JSON.parse(perms); } catch (_) { perms = []; } }
    if (!Array.isArray(perms)) perms = [];
    const perfilNorm = String(usuario.perfil || '').trim().toLowerCase();
    if ((perfilNorm === 'admin' || perfilNorm.includes('admin')) && !perms.includes('tudo')) perms = ['tudo', ...perms];
    res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      permissoes: perms,
      canais_chat: usuario.canais_chat,
      avatar_iniciais: usuario.avatar_iniciais || 'AD',
      avatar_cor: usuario.avatar_cor || '#4A90D9',
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const oldToken =
      _getTokenFromReq(req)
      || String(req.body?.token || req.body?.access_token || req.body?.refresh_token || '').trim()
      || String(req.headers['x-refresh-token'] || '').trim();
    if (!oldToken) return res.status(401).json({ ok: false, error: 'token_missing', redirect: '/login' });

    let payload = null;
    try {
      payload = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });
    } catch (_) {
      try { payload = jwt.decode(oldToken); } catch (e) { payload = null; }
    }
    const uid = String(payload?.id || '').trim();
    if (!uid) return res.status(401).json({ ok: false, error: 'token_invalid', redirect: '/login' });

    const { data: dbUser, error } = await supabase
      .from('usuarios')
      .select('id,nome,email,perfil,permissoes,canais_chat,ativo,avatar_iniciais,avatar_cor')
      .eq('id', uid)
      .single();
    if (error || !dbUser) return res.status(401).json({ ok: false, error: 'user_not_found', redirect: '/login' });
    if (dbUser.ativo === false) return res.status(401).json({ ok: false, error: 'user_inactive', redirect: '/login' });

    let perms = dbUser.permissoes != null ? dbUser.permissoes : [];
    if (typeof perms === 'string') { try { perms = JSON.parse(perms); } catch (_) { perms = []; } }
    if (!Array.isArray(perms)) perms = [];
    const perfilNorm = String(dbUser.perfil || '').trim().toLowerCase();
    if ((perfilNorm === 'admin' || perfilNorm.includes('admin')) && !perms.includes('tudo')) perms = ['tudo', ...perms];

    const token = jwt.sign(
      { id: dbUser.id, nome: dbUser.nome, email: dbUser.email, perfil: dbUser.perfil, permissoes: perms },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    console.log('[TOKEN REFRESH] perfil:', dbUser.perfil, 'permissoes:', dbUser.permissoes);
    return res.json({
      ok: true,
      token,
      usuario: {
        id: dbUser.id,
        nome: dbUser.nome,
        email: dbUser.email,
        perfil: dbUser.perfil,
        permissoes: perms,
        canais_chat: dbUser.canais_chat,
        avatar_iniciais: dbUser.avatar_iniciais || initialsFromName(dbUser.nome),
        avatar_cor: dbUser.avatar_cor || avatarColorFromText(dbUser.email),
      },
    });
  } catch (e) {
    console.error('Erro refresh token:', e);
    return res.status(500).json({ ok: false, error: 'Erro interno' });
  }
});

app.post('/api/email/enviar', authMiddleware, async (req, res) => {
  try {
    setNoCache(res);
    if (!transporter) return res.status(500).json({ ok: false, error: 'smtp_not_configured' });
    const para = String(req.body?.para || req.body?.to || '').trim();
    const assunto = String(req.body?.assunto || req.body?.subject || '').trim();
    const corpo = String(req.body?.corpo || req.body?.html || '').trim();
    const anexosRaw = Array.isArray(req.body?.anexos) ? req.body.anexos : [];
    if (!para || !para.includes('@')) return res.status(400).json({ ok: false, error: 'para_invalido' });
    if (!assunto) return res.status(400).json({ ok: false, error: 'assunto_obrigatorio' });
    if (!corpo) return res.status(400).json({ ok: false, error: 'corpo_obrigatorio' });

    const attachments = [];
    for (const a of anexosRaw.slice(0, 10)) {
      if (!a || typeof a !== 'object') continue;
      const filename = String(a.nome || a.filename || 'anexo').trim() || 'anexo';
      const contentType = String(a.tipo || a.contentType || 'application/octet-stream').trim() || 'application/octet-stream';
      let base64 = String(a.base64 || a.content || '').trim();
      if (!base64) continue;
      const comma = base64.indexOf(',');
      if (comma >= 0 && base64.slice(0, comma).toLowerCase().includes('base64')) base64 = base64.slice(comma + 1);
      base64 = base64.replace(/\s+/g, '');
      if (!base64) continue;
      attachments.push({ filename, content: base64, encoding: 'base64', contentType });
    }

    await transporter.sendMail({
      from: `"Italy Embalagens" <${String(process.env.EMAIL_USER || '').trim()}>`,
      to: para,
      subject: assunto,
      html: corpo,
      attachments,
    });
    return res.json({ ok: true, msg: 'Email enviado com sucesso' });
  } catch (e) {
    console.error('[EMAIL ERROR]', String(e?.message || e));
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
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
    await logAuditoria('usuarios', 'INSERT', data?.id, null, data, req);
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.put('/api/usuarios/:id', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });

    let antes = null;
    try {
      const r0 = await supabase.from('usuarios').select('*').eq('id', id).maybeSingle();
      antes = r0?.data || null;
    } catch (_) {}

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
    await logAuditoria('usuarios', 'UPDATE', id, antes, data, req);
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.put('/api/usuarios/:id/senha', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const senha = String(req.body?.senha || '').trim();
    if (!id || !senha) return res.status(400).json({ ok: false, error: 'id e senha obrigatórios' });
    const senha_hash = await bcrypt.hash(senha, 10);
    let antes = null;
    try {
      const r0 = await supabase.from('usuarios').select('*').eq('id', id).maybeSingle();
      antes = r0?.data || null;
    } catch (_) {}
    const { data, error } = await supabase.from('usuarios').update({ senha_hash }).eq('id', id).select('id').maybeSingle();
    if (error) throw error;
    await logAuditoria('usuarios', 'UPDATE', id, antes, data || { id }, req);
    return ok(res, { id });
  } catch (e) { return err(res, e); }
});

app.delete('/api/usuarios/:id', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });

    if (String(req.usuario?.id || '') === id) {
      return res.status(400).json({ error: 'Você não pode deletar seu próprio usuário' });
    }

    const ADMINS_PROTEGIDOS = ['sidao', 'mano', 'italy'];
    const { data: uDel, error: uDelErr } = await supabase
      .from('usuarios')
      .select('email,perfil')
      .eq('id', id)
      .maybeSingle();
    if (uDelErr) throw uDelErr;
    if (uDel && ADMINS_PROTEGIDOS.includes(String(uDel.email || '').toLowerCase())) {
      return res.status(403).json({ ok: false, error: 'Este usuário não pode ser excluído' });
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

app.get('/api/configuracoes/:chave', authMiddleware, async (req, res) => {
  try {
    const chave = String(req.params.chave || '').trim();
    if (!chave) return res.status(400).json({ ok: false, error: 'chave obrigatória' });
    const { data, error } = await supabase.from('configuracoes').select('chave,valor,updated_at,atualizado_por').eq('chave', chave).maybeSingle();
    if (error) {
      const msg = String(error.message || error);
      const m = msg.toLowerCase();
      if (m.includes('does not exist') || m.includes('relation') || m.includes('schema cache')) return ok(res, null);
      throw error;
    }
    return ok(res, data ? (data.valor ?? null) : null);
  } catch (e) { return err(res, e); }
});

app.put('/api/configuracoes/:chave', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const chave = String(req.params.chave || '').trim();
    if (!chave) return res.status(400).json({ ok: false, error: 'chave obrigatória' });
    const body = req.body || {};
    const valor = (body && Object.prototype.hasOwnProperty.call(body, 'valor')) ? body.valor : body;
    const payload = {
      chave,
      valor,
      atualizado_por: req.usuario?.nome || 'sistema',
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('configuracoes').upsert([payload], { onConflict: 'chave' }).select('chave,valor,updated_at,atualizado_por').maybeSingle();
    if (error) throw error;
    return ok(res, data ? (data.valor ?? null) : valor);
  } catch (e) { return err(res, e); }
});

app.get('/api/admin/maquinas_validas_ofs', requireAdmin, async (req, res) => {
  try {
    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

    const selectCompat = async (table, cols) => {
      let cur = String(cols || '*');
      for (let tentativa = 0; tentativa < 10; tentativa++) {
        const { data, error } = await supabase.from(table).select(cur);
        if (!error) return { data: data || [], error: null };
        const msg = String(error.message || error);
        const m1 = msg.match(/Could not find the '([^']+)' column/i);
        const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
        const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
        if (!col) return { data: null, error };
        const parts = cur.split(',').map(s => s.trim()).filter(Boolean);
        const next = parts.filter(c => c !== col);
        if (!next.length || next.length === parts.length) return { data: null, error };
        cur = next.join(',');
      }
      const { data, error } = await supabase.from(table).select('*');
      if (error) return { data: null, error };
      return { data: data || [], error: null };
    };

    const { data: maquinasRaw, error: maqErr } = await selectCompat('maquinas', 'id,nome,col,ativo');
    if (maqErr) return res.status(500).json({ ok: false, error: String(maqErr.message || maqErr) });
    const validSet = new Set();
    (maquinasRaw || []).forEach((m) => {
      if (m && m.ativo === false) return;
      const a = norm(m?.nome);
      const b = norm(m?.col);
      if (a) validSet.add(a);
      if (b) validSet.add(b);
    });

    const countBy = new Map();
    const rawBy = new Map();
    const addNome = (nome, ofId, seenInOf) => {
      const n = norm(nome);
      if (!n) return;
      if (!rawBy.has(n)) rawBy.set(n, String(nome || '').trim() || n);
      if (seenInOf.has(n)) return;
      seenInOf.add(n);
      countBy.set(n, (countBy.get(n) || 0) + 1);
    };

    const parseFluxo = (v) => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try {
          const p = JSON.parse(v || '[]');
          return Array.isArray(p) ? p : [];
        } catch (e) { return []; }
      }
      return [];
    };

    const parseMaq = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return [];
        if (s.startsWith('[') || s.startsWith('{')) {
          try {
            const p = JSON.parse(s);
            if (Array.isArray(p)) return p;
            if (p && typeof p === 'object') return [p];
          } catch (e) {}
        }
        return [s];
      }
      if (v && typeof v === 'object') return [v];
      return [];
    };

    let offset = 0;
    const limit = 1000;
    for (let page = 0; page < 200; page++) {
      const { data, error } = await supabase
        .from('ofs')
        .select('id,fluxo_maquinas,maq')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) return res.status(500).json({ ok: false, error: String(error.message || error) });
      const rows = data || [];
      rows.forEach((of) => {
        const seenInOf = new Set();
        const fluxo = parseFluxo(of?.fluxo_maquinas);
        fluxo.forEach((it) => {
          if (it && typeof it === 'object' && !Array.isArray(it)) {
            addNome(it.nome || it.maquina || it.name || it.id || '', of?.id, seenInOf);
          } else {
            addNome(it, of?.id, seenInOf);
          }
        });
        const maqArr = parseMaq(of?.maq);
        maqArr.forEach((it) => {
          if (it && typeof it === 'object' && !Array.isArray(it)) {
            addNome(it.nome || it.maquina || it.name || it.id || '', of?.id, seenInOf);
          } else {
            addNome(it, of?.id, seenInOf);
          }
        });
      });
      if (rows.length < limit) break;
      offset += limit;
    }

    const invalid = Array.from(countBy.entries())
      .filter(([k]) => !validSet.has(k))
      .map(([k, count]) => ({ nome: rawBy.get(k) || k, count }))
      .sort((a, b) => (b.count || 0) - (a.count || 0));

    return ok(res, {
      invalidas: invalid,
      total_invalidas: invalid.length,
      total_maquinas_cadastro: validSet.size,
      total_maquinas_encontradas_nas_ofs: countBy.size,
    });
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

const estoqueFotosUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const okExt = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!okExt.has(ext)) return cb(new Error('Tipo de arquivo não permitido'));
    return cb(null, true);
  },
});

app.post('/api/estoque_fotos/upload', authMiddleware, estoqueFotosUpload.single('file'), async (req, res) => {
  try {
    const f = req.file || null;
    if (!f) return res.status(400).json({ ok: false, error: 'Arquivo obrigatório' });

    const tipo = String(req.body?.tipo || req.query?.tipo || '').trim().toLowerCase();
    const itemId = String(req.body?.item_id || req.body?.id || req.query?.item_id || req.query?.id || '').trim();
    if (!['chapa', 'faca', 'cliche'].includes(tipo)) return res.status(400).json({ ok: false, error: 'tipo inválido' });
    if (!itemId) return res.status(400).json({ ok: false, error: 'item_id obrigatório' });

    const ext = path.extname(f.originalname || '').toLowerCase() || '.png';
    const safeTipo = tipo === 'chapa' ? 'chapas' : (tipo === 'faca' ? 'facas' : 'cliches');
    const filename = `${safeTipo}/${itemId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    const { error: upErr } = await supabase.storage
      .from('estoque-fotos')
      .upload(filename, f.buffer, { contentType: f.mimetype, upsert: true });
    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from('estoque-fotos').getPublicUrl(filename);
    const url = String(urlData?.publicUrl || '').trim();
    if (!url) return res.status(500).json({ ok: false, error: 'Falha ao obter URL pública' });

    const tryUpdateFotoUrl = async (table, id, extra) => {
      const payload = { ...(extra || {}), foto_url: url };
      for (let i = 0; i < 6; i++) {
        const { data, error } = await supabase.from(table).update(payload).eq('id', id).select('*').maybeSingle();
        if (!error) return { data, error: null, table };
        const msg = String(error.message || error);
        const m1 = msg.match(/Could not find the '([^']+)' column/i);
        const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
        const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
        if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
          delete payload[col];
          continue;
        }
        return { data: null, error, table };
      }
      return { data: null, error: new Error('Falha ao salvar foto_url'), table };
    };

    let upd = null;
    if (tipo === 'chapa') {
      const preferred = await _chapasPreferV2Table();
      const tablesToTry = preferred === 'chapas_estoque_v2'
        ? ['chapas_estoque_v2', 'chapas_estoque']
        : ['chapas_estoque', 'chapas_estoque_v2'];
      for (const t of tablesToTry) {
        const r = await tryUpdateFotoUrl(t, itemId, t === 'chapas_estoque_v2' ? { atualizado_por: req?.usuario?.nome || 'sistema' } : {});
        if (!r.error) { upd = r; break; }
      }
    } else if (tipo === 'faca') {
      upd = await tryUpdateFotoUrl('facas_estoque', itemId, { foto: url, imagem_url: url });
    } else {
      upd = await tryUpdateFotoUrl('cliches_estoque', itemId, { foto: url, imagem_url: url });
    }

    cacheClearPrefix('chapas_estoque:');
    cacheClearPrefix('chapas_');
    return ok(res, { url, data: upd?.data || null, table: upd?.table || null });
  } catch (e) {
    _logApiError('ESTOQUE_FOTOS_UPLOAD', req, e, { file: req?.file ? { name: req.file.originalname, size: req.file.size, type: req.file.mimetype } : null });
    if (e instanceof multer.MulterError) return res.status(400).json({ ok: false, error: e.message });
    return res.status(500).json({ ok: false, error: String(e?.message || e), rid: req._rid || null });
  }
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
  return ok(res, []);
});
async function insertOne(table, row) {
  if (!supabase) throw new Error('Supabase não configurado no ambiente. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY).');
  if (table !== 'ofs') {
    const { data, error } = await supabase.from(table).insert([row]).select('*').limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
  }
  let payload = { ...(row || {}) };
  const ignoredColumns = [];
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { data, error } = await supabase.from(table).insert([payload]).select('*').limit(1);
    if (!error) return (data && data[0]) || null;
    const msg = String(error.message || error);
    const m1 = msg.match(/Could not find the '([^']+)' column/i);
    const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
    const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
    if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
      try { ignoredColumns.push(col); } catch (_) {}
      try { console.warn('[OFS INSERT] ignorando coluna inexistente:', col); } catch (_) {}
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
  const ignoredColumns = [];
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select('*').limit(1);
    if (!error) return (data && data[0]) || null;
    const msg = String(error.message || error);
    const m1 = msg.match(/Could not find the '([^']+)' column/i);
    const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
    const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
    if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
      try { ignoredColumns.push(col); } catch (_) {}
      try { console.warn('[OFS UPDATE] ignorando coluna inexistente:', col); } catch (_) {}
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
  const toNum = (v, def = 0) => {
    const n = Number(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : def;
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
  if (has('prioridade')) {
    const n = Math.trunc(Number(p.prioridade));
    out.prioridade = Number.isFinite(n) ? n : null;
  }
  if (has('prioridade_producao')) {
    const n = Math.trunc(Number(p.prioridade_producao));
    out.prioridade_producao = Number.isFinite(n) ? n : null;
  }
  if (has('maq')) {
    out.maq = Array.isArray(p.maq) ? JSON.stringify(p.maq) : (typeof p.maq === 'string' ? p.maq : '[]');
  }
  if (has('imgs')) {
    out.imgs = Array.isArray(p.imgs) ? JSON.stringify(p.imgs) : (typeof p.imgs === 'string' ? p.imgs : '[]');
  }
  if (has('itens')) {
    if (Array.isArray(p.itens)) {
      out.itens = p.itens.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const desc = String(item.desc ?? item.descricao ?? item.nome ?? item.item ?? '').trim();
        const ref = String(item.ref ?? item.referencia ?? item.cod ?? '').trim();
        const qtd = Math.round(toNum(item.qtd ?? item.quantidade ?? 0, 0));
        const vunit = toNum(item.vunit ?? item.valor_unitario ?? item.valorUnitario ?? 0, 0);
        const valor_total = toNum(
          item.valor_total ?? item.total ?? item.valorTotal ?? (qtd * vunit),
          (qtd * vunit),
        );

        const maquina = String(item.maquina ?? item.maquina_item ?? item.maq ?? item.machine ?? '').trim();
        const maquina_id = item.maquina_id ?? item.maqId ?? item.machineId ?? null;
        const maquina_nome = String(item.maquina_nome ?? item.maqNome ?? item.machineName ?? item.maquina ?? maquina ?? '').trim();

        return {
          ...item,
          desc,
          descricao: item.descricao ?? desc,
          ref,
          qtd,
          quantidade: Math.round(toNum(item.quantidade ?? qtd, qtd)),
          vunit,
          valor_unitario: item.valor_unitario ?? vunit,
          valor_total,
          maquina,
          maquina_id,
          maquina_nome,
        };
      }).filter(Boolean);
    }
    else if (typeof p.itens === 'string') {
      try { out.itens = JSON.parse(p.itens || '[]'); } catch (e) { out.itens = []; }
    } else out.itens = [];
  }
  if (has('fluxo_maquinas')) {
    if (Array.isArray(p.fluxo_maquinas)) {
      out.fluxo_maquinas = p.fluxo_maquinas.map((m) => {
        if (typeof m === 'string') return m;
        if (m && typeof m === 'object') return (m.nome ?? m.name ?? m.maquina ?? String(m));
        return String(m ?? '');
      });
    }
    else if (typeof p.fluxo_maquinas === 'string') {
      try { out.fluxo_maquinas = JSON.parse(p.fluxo_maquinas); } catch (e) { out.fluxo_maquinas = []; }
    } else out.fluxo_maquinas = [];
  }
  if (has('maquina_atual_index')) {
    const idx = Number(p.maquina_atual_index);
    out.maquina_atual_index = Number.isFinite(idx) ? idx : 0;
  }
  if (has('maquina_por_item')) {
    if (p.maquina_por_item && typeof p.maquina_por_item === 'object' && !Array.isArray(p.maquina_por_item)) {
      out.maquina_por_item = p.maquina_por_item;
    } else if (typeof p.maquina_por_item === 'string') {
      try { out.maquina_por_item = JSON.parse(p.maquina_por_item); } catch (e) { out.maquina_por_item = {}; }
    } else out.maquina_por_item = {};
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
  if (has('data_faturamento')) out.data_faturamento = sanitizeDate(p.data_faturamento);
  const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (out.empresa_id && !isUuid(out.empresa_id)) {
    if (!out.emp_id) out.emp_id = out.empresa_id;
    delete out.empresa_id;
  }
  if (out.cliente_id && !isUuid(out.cliente_id)) {
    if (!out.cli_id) out.cli_id = out.cliente_id;
    delete out.cliente_id;
  }

  const itensArr = Array.isArray(out.itens) ? out.itens : [];
  const primeiroItem = itensArr[0] && typeof itensArr[0] === 'object' ? itensArr[0] : {};
  const primeiroDesc = String(primeiroItem.desc ?? primeiroItem.descricao ?? '').trim();
  if (primeiroDesc && !out.descricao_manual) {
    out.descricao = primeiroDesc;
    out.prodDesc = primeiroDesc;
  } else {
    if ((out.descricao == null || String(out.descricao).trim() === '') && primeiroDesc) out.descricao = primeiroDesc;
    if ((out.prodDesc == null || String(out.prodDesc).trim() === '') && primeiroDesc) out.prodDesc = primeiroDesc;
  }
  if (out.valor_total === undefined && out.valor_venda === undefined && Array.isArray(out.itens) && out.itens.length) {
    const sum = out.itens.reduce((s, it) => {
      if (!it || typeof it !== 'object') return s;
      return s + toNum(it.valor_total ?? it.total ?? 0, 0);
    }, 0);
    out.valor_total = sum;
    out.valor_venda = sum;
  }

  return out;
}

const OFS_TABLE_COLS = [
  'id', 'numero', 'of', 'of_num', 'of_seq', 'seq',
  'status', 'cliente_id', 'cli_id', 'cliId', 'cliid',
  'cliNome', 'clinome', 'cliente_nome',
  'vendedor_id', 'vendId', 'vendid', 'vendedor', 'vendNome',
  'emp_id', 'empId', 'empresa_id', 'empNome',
  'data_entrega', 'ent', 'dia', 'data_producao',
  'data_conclusao', 'data_faturamento', 'dia_programacao',
  'urgente', 'urg',
  'quantidade', 'qtd', 'qtd_pedida', 'qtd_produzida', 'qtd_perdida',
  'caixas_excedentes', 'qtd_chapas',
  'valor_total', 'valor_venda', 'preco', 'total',
  'descricao', 'obs', 'obs2',
  'itens', 'imgs', 'imagem_url',
  'maq', 'fluxo', 'fluxo_maquinas', 'maquina_atual_index',
  'chp', 'chapa_id', 'maquina_perda',
  'deleted_at',
  'prioridade', 'sem_papel',
  'cidade_entrega', 'modo_programacao',
  'usuario_conclusao',
  'tipo_caixa', 'caixa_comprimento', 'caixa_largura', 'caixa_altura',
  'cond_pagamento', 'pagto', 'ramo', 'smp_id',
  'created_at', 'updated_at',
];
const OFS_TABLE_COLS_SET = new Set(OFS_TABLE_COLS);
const OFS_SELECTABLE_COLS = OFS_TABLE_COLS.filter((c) => c !== 'prodDesc');
const OFS_SELECTABLE_COLS_SET = new Set(OFS_SELECTABLE_COLS);
try { console.log('[BOOT] OFS_SELECTABLE_COLS_SET size:', OFS_SELECTABLE_COLS_SET?.size); } catch (_) {}
function _ofsSelectableHas(col) {
  try { return !!(OFS_SELECTABLE_COLS_SET && typeof OFS_SELECTABLE_COLS_SET.has === 'function' && OFS_SELECTABLE_COLS_SET.has(col)); } catch (_) { return false; }
}
function _ofsTableHas(col) {
  try { return !!(OFS_TABLE_COLS_SET && typeof OFS_TABLE_COLS_SET.has === 'function' && OFS_TABLE_COLS_SET.has(col)); } catch (_) { return false; }
}
function _filterOfsPayloadKnownCols(input, keepMeta = true) {
  const src = input && typeof input === 'object' ? input : {};
  const out = {};
  Object.keys(src).forEach((k) => {
    if (keepMeta && String(k || '').startsWith('_')) { out[k] = src[k]; return; }
    if (_ofsTableHas(k)) out[k] = src[k];
  });
  return out;
}

function ofPayloadFiltrado(body) {
  const b = _filterOfsPayloadKnownCols(body || {}, true);
  const p = _filterOfsPayloadKnownCols(b || {}, false);
  p.updated_at = new Date().toISOString();
  return p;
}

async function ofsInsertWithRetry(row) {
  function sanitizarPayloadOF(payload) {
    const inteiros = [
      'qtd', 'quantidade', 'qtd_pedida',
      'qtd_produzida', 'qtd_perdida', 'caixas_excedentes',
      'maquina_atual_index', 'prioridade', 'prioridade_producao'
    ];
    const decimais = [
      'valor_total', 'valor_venda', 'valor_unitario',
      'caixa_comprimento', 'caixa_largura', 'caixa_altura'
    ];
    const out = { ...(payload || {}) };
    const toIntOr = (v) => {
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      if (!s) return null;
      const n = Math.round(Number(s.replace(',', '.')));
      return Number.isFinite(n) ? n : null;
    };
    const toDecOr = (v) => {
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      if (!s) return null;
      const n = parseFloat(s.replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };
    inteiros.forEach((k) => {
      if (out[k] === undefined) return;
      const n = toIntOr(out[k]);
      if (n === null) delete out[k];
      else out[k] = n;
    });
    decimais.forEach((k) => {
      if (out[k] === undefined) return;
      const n = toDecOr(out[k]);
      if (n === null) delete out[k];
      else out[k] = n;
    });
    if (Array.isArray(out.itens)) {
      out.itens = out.itens.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const qtd = toIntOr(item.qtd ?? item.quantidade ?? 0);
        const quantidade = toIntOr(item.quantidade ?? item.qtd ?? 0);
        const vunit = toDecOr(item.vunit ?? item.valor_unitario ?? 0);
        const valor_unitario = toDecOr(item.valor_unitario ?? item.vunit ?? 0);
        const valor_total = toDecOr(item.valor_total ?? item.total ?? 0);
        return {
          ...item,
          ...(qtd === null ? {} : { qtd }),
          ...(quantidade === null ? {} : { quantidade }),
          ...(vunit === null ? {} : { vunit }),
          ...(valor_unitario === null ? {} : { valor_unitario }),
          ...(valor_total === null ? {} : { valor_total }),
        };
      }).filter(Boolean);
    }
    return out;
  }

  let p = sanitizarPayloadOF({ ...(row || {}) });
  const ignoredColumns = [];
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const r = await supabase.from('ofs').insert([p]).select('*').single();
    if (!r.error) return r;
    const msg = String(r.error.message || r.error);
    const m1 = msg.match(/Could not find the '([^']+)' column/i);
    const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
    const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
    if (col && Object.prototype.hasOwnProperty.call(p, col)) {
      try { ignoredColumns.push(col); } catch (_) {}
      try { console.warn('[OFS INSERT] ignorando coluna inexistente:', col); } catch (_) {}
      delete p[col];
      continue;
    }
    r.ignoredColumns = ignoredColumns;
    return r;
  }
  return { data: null, error: { message: 'Falha ao inserir OF após tentativas' }, ignoredColumns };
}

async function ofsUpdateWithRetry(id, row) {
  function sanitizarPayloadOF(payload) {
    const inteiros = [
      'qtd', 'quantidade', 'qtd_pedida',
      'qtd_produzida', 'qtd_perdida', 'caixas_excedentes',
      'maquina_atual_index', 'prioridade', 'prioridade_producao'
    ];
    const decimais = [
      'valor_total', 'valor_venda', 'valor_unitario',
      'caixa_comprimento', 'caixa_largura', 'caixa_altura'
    ];
    const out = { ...(payload || {}) };
    const toIntOr = (v) => {
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      if (!s) return null;
      const n = Math.round(Number(s.replace(',', '.')));
      return Number.isFinite(n) ? n : null;
    };
    const toDecOr = (v) => {
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      if (!s) return null;
      const n = parseFloat(s.replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };
    inteiros.forEach((k) => {
      if (out[k] === undefined) return;
      const n = toIntOr(out[k]);
      if (n === null) delete out[k];
      else out[k] = n;
    });
    decimais.forEach((k) => {
      if (out[k] === undefined) return;
      const n = toDecOr(out[k]);
      if (n === null) delete out[k];
      else out[k] = n;
    });
    if (Array.isArray(out.itens)) {
      out.itens = out.itens.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const qtd = toIntOr(item.qtd ?? item.quantidade ?? 0);
        const quantidade = toIntOr(item.quantidade ?? item.qtd ?? 0);
        const vunit = toDecOr(item.vunit ?? item.valor_unitario ?? 0);
        const valor_unitario = toDecOr(item.valor_unitario ?? item.vunit ?? 0);
        const valor_total = toDecOr(item.valor_total ?? item.total ?? 0);
        return {
          ...item,
          ...(qtd === null ? {} : { qtd }),
          ...(quantidade === null ? {} : { quantidade }),
          ...(vunit === null ? {} : { vunit }),
          ...(valor_unitario === null ? {} : { valor_unitario }),
          ...(valor_total === null ? {} : { valor_total }),
        };
      }).filter(Boolean);
    }
    return out;
  }

  let p = sanitizarPayloadOF({ ...(row || {}) });
  delete p.id;
  delete p.numero;
  delete p.of;
  delete p.of_num;
  delete p.seq;
  const ignoredColumns = [];
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const r = await supabase.from('ofs').update(p).eq('id', id).select('*').single();
    if (!r.error) return r;
    try {
      console.error('[OFS UPDATE] tentativa', tentativa, 'erro:', r.error?.message, 'payload keys:', Object.keys(p || {}).join(','));
    } catch (_) {}
    const msg = String(r.error.message || r.error);
    const m1 = msg.match(/Could not find the '([^']+)' column/i);
    const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
    const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
    if (col && Object.prototype.hasOwnProperty.call(p, col)) {
      try { ignoredColumns.push(col); } catch (_) {}
      try { console.warn('[OFS UPDATE] ignorando coluna inexistente:', col); } catch (_) {}
      delete p[col];
      continue;
    }
    r.ignoredColumns = ignoredColumns;
    return r;
  }
  return { data: null, error: { message: 'Falha ao atualizar OF após tentativas' }, ignoredColumns };
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
    cnpj_cpf: 'cnpj',
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
    ramo: 'ramo',
    vendedor_id: 'vendedor_id',
    vendId: 'vendedor_id',
    ativo: 'ativo',
  };
  Object.entries(map).forEach(([from, to]) => {
    if (b[from] !== undefined) out[to] = b[from];
  });
  out.updated_at = new Date().toISOString();
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
      if (p.razao_social !== undefined) { p.rs = p.razao_social; delete p.razao_social; }
      return p;
    })(),
  ];
  let lastErr = null;
  for (const p of attempts) {
    let cur = { ...(p || {}) };
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const { data, error } = await supabase.from('clientes').insert([cur]).select();
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
      if (msg.includes('column') || msg.includes('Could not find')) break;
      return { data: null, error };
    }
  }
  return { data: null, error: lastErr };
}

async function clientesUpdateCompat(id, payload) {
  const attempts = [
    payload,
    (() => {
      const p = { ...payload };
      if (p.observacoes !== undefined) { p.obs = p.observacoes; delete p.observacoes; }
      if (p.razao_social !== undefined) { p.rs = p.razao_social; delete p.razao_social; }
      return p;
    })(),
  ];
  let lastErr = null;
  for (const p of attempts) {
    let cur = { ...(p || {}) };
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const { data, error } = await supabase.from('clientes').update(cur).eq('id', id).select().limit(1);
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
      if (msg.includes('column') || msg.includes('Could not find')) break;
      return { data: null, error };
    }
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

function vendedoresPayload(p) {
  const b = vendedoresIn(p || {});
  const out = {};
  const map = {
    nome: 'nome',
    email: 'email',
    tel: 'tel',
    telefone: 'tel',
    reg: 'reg',
    registro: 'reg',
    regiao: 'reg',
    meta: 'meta',
    meta_mensal: 'meta',
    comissao_pct: 'comissao_pct',
    comissaoPct: 'comissao_pct',
    comissao: 'comissao_pct',
    ativo: 'ativo',
    emp_id: 'emp_id',
    empId: 'emp_id',
    empresa_id: 'emp_id',
    empresaId: 'emp_id',
  };
  Object.entries(map).forEach(([from, to]) => {
    if (b[from] !== undefined) out[to] = b[from];
  });
  Object.keys(out).forEach(k => (out[k] === undefined || out[k] === '') && delete out[k]);
  return out;
}

async function vendedoresInsertCompat(payload) {
  let cur = { ...(payload || {}) };
  let lastErr = null;
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const { data, error } = await supabase.from('vendedores').insert([cur]).select();
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
}

async function vendedoresUpdateCompat(id, payload) {
  let cur = { ...(payload || {}) };
  let lastErr = null;
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const { data, error } = await supabase.from('vendedores').update(cur).eq('id', id).select();
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
}

function comprasIn(p) {
  const out = { ...(p || {}) };
  if (out.data !== undefined && out.data_pedido === undefined) out.data_pedido = out.data;
  if (out.forn_id !== undefined && out.fornecedor_id === undefined) out.fornecedor_id = out.forn_id;
  if (out.fornecedorId !== undefined && out.fornecedor_id === undefined) out.fornecedor_id = out.fornecedorId;
  if (out.empId !== undefined && out.emp_id === undefined) out.emp_id = out.empId;
  if (out.empresaId !== undefined && out.empresa_id === undefined) out.empresa_id = out.empresaId;
  if (out.valor !== undefined && out.valor_total === undefined) out.valor_total = out.valor;
  if (out.observacao !== undefined && out.obs === undefined && out.observacoes === undefined) out.obs = out.observacao;
  delete out.data;
  delete out.forn_id;
  delete out.fornecedorId;
  delete out.empId;
  delete out.empresaId;
  return out;
}

const STATUS_COMPRA_MAP = {
  'Rascunho': 'rascunho',
  'rascunho': 'rascunho',
  'Solicitada': 'solicitada',
  'solicitada': 'solicitada',
  'Em aberto': 'em_aberto',
  'em aberto': 'em_aberto',
  'Recebida': 'recebida',
  'recebida': 'recebida',
  'Parcial': 'parcial',
  'parcial': 'parcial',
};

function normalizeCompraStatus(v) {
  const raw = v == null ? '' : String(v).trim();
  if (!raw) return null;
  if (STATUS_COMPRA_MAP[raw]) return STATUS_COMPRA_MAP[raw];
  const normalized = raw.toLowerCase().replace(/\s+/g, '_');
  return normalized || null;
}

function comprasPayload(body) {
  const b = comprasIn(body || {});
  const campos = [
    'fornecedor_id', 'fornecedor', 'empresa_id', 'emp_id',
    'data_pedido', 'data_entrega', 'data_previsao',
    'status', 'valor_total', 'valor', 'obs', 'observacao', 'observacoes',
    'nf', 'numero_nf', 'itens', 'tipo', 'urgente',
    'usuario_id', 'created_at', 'updated_at',
    'item', 'qtd', 'quantidade', 'valor_unitario'
  ];
  const p = {};
  campos.forEach(k => { if (b[k] !== undefined) p[k] = b[k]; });
  if (p.status !== undefined) p.status = normalizeCompraStatus(p.status);
  Object.keys(p).forEach(k => (p[k] === undefined || p[k] === '') && delete p[k]);
  return p;
}

async function comprasInsertCompat(payload) {
  let cur = { ...(payload || {}) };
  let lastErr = null;
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const { data, error } = await supabase.from('compras').insert([cur]).select();
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
}

async function comprasUpdateCompat(id, payload) {
  let cur = { ...(payload || {}) };
  let lastErr = null;
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const { data, error } = await supabase.from('compras').update(cur).eq('id', id).select();
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
}

app.get('/api/ofs', authMiddleware, async (req, res) => {
  try {
    console.log('[OFS CHEGOU]', req.query);
    console.log('[OFS GET START]', req.query);
    try {
      console.log('[OFS DEBUG ENTRY]', {
        query: req.query,
        usuario: req?.usuario?.id,
        supabaseOk: !!supabase,
        colsSetSize: OFS_SELECTABLE_COLS_SET?.size,
      });
    } catch (_) {}
    console.log('[OFS GET COLS CHECK]', {
      tableLen: Array.isArray(OFS_TABLE_COLS) ? OFS_TABLE_COLS.length : null,
      selectableLen: Array.isArray(OFS_SELECTABLE_COLS) ? OFS_SELECTABLE_COLS.length : null,
      setSize: (OFS_SELECTABLE_COLS_SET && typeof OFS_SELECTABLE_COLS_SET.size === 'number') ? OFS_SELECTABLE_COLS_SET.size : null,
    });
    setNoCache(res);
    const testeRapido = await supabase.from('ofs').select('id').limit(1);
    console.log('[OFS TESTE RAPIDO]', testeRapido.error?.message || 'OK');
    if (testeRapido.error) {
      return res.status(500).json({ ok: false, error: testeRapido.error.message });
    }
    try {
      console.log('[OFS COLS]', JSON.stringify({
        table: Array.isArray(OFS_TABLE_COLS) ? OFS_TABLE_COLS.length : null,
        selectable: Array.isArray(OFS_SELECTABLE_COLS) ? OFS_SELECTABLE_COLS.length : null,
        set: OFS_SELECTABLE_COLS_SET && typeof OFS_SELECTABLE_COLS_SET.size === 'number' ? OFS_SELECTABLE_COLS_SET.size : null,
      }));
    } catch (_) {}
    const limit = Math.max(1, Math.min(500, parseInt(String(req.query.limit || ''), 10) || 500));
    const offset = Math.max(0, parseInt(String(req.query.offset || ''), 10) || 0);
    const incluirExcluidas = String(req.query.incluir_excluidas || '') === '1';
    const incluirCanceladas = String(req.query.incluir_canceladas || req.query.incluir_excluidas || req.query.incluirExcluidas || '') === '1';
    const excluirCanceladas = String(req.query.excluir_canceladas || req.query.excluirCanceladas || '') === '1';
    const empId = req.query.empId ? String(req.query.empId).trim() : '';
    const clienteId = String(req.query.cliente_id || req.query.clienteId || req.query.cli_id || req.query.cliId || '').trim();
    const numeroRaw = String(req.query.numero || req.query.of_num || req.query.of || '').trim();
    const numero = numeroRaw ? String(numeroRaw).replace(/\D/g, '') : '';
    let statusRaw = req.query.status ? String(req.query.status).trim() : '';
    try { statusRaw = decodeURIComponent(statusRaw); } catch (_) {}
    const status = statusRaw && statusRaw.toLowerCase() !== 'todos' ? statusRaw : '';
    const lite = String(req.query.lite || '') === '1';
    const from = String(req.query.from || req.query.de || '').trim();
    const to = String(req.query.to || req.query.ate || '').trim();
    const dateFieldRaw = String(req.query.date_field || req.query.dateField || '').trim().toLowerCase();
    const orderByRaw = String(req.query.order_by || req.query.orderBy || '').trim();
    const orderRaw = String(req.query.order || '').trim().toLowerCase();
    const orderAsc = orderRaw === 'asc';
    const orderDir = orderAsc ? 'asc' : 'desc';
    const ALLOWED_ORDER_BY = new Set([
      'created_at', 'updated_at', 'data_entrega', 'ent', 'dia',
      'numero', 'of', 'status', 'valor_total',
    ]);
    let orderBy = orderByRaw || 'created_at';
    if (!ALLOWED_ORDER_BY.has(orderBy)) orderBy = 'created_at';
    if (!_ofsSelectableHas(orderBy)) orderBy = 'created_at';

    const CACHE_VERSION = 'ofs_v4';
    const cacheKey = [
      CACHE_VERSION,
      String(req?.usuario?.id || ''),
      empId,
      clienteId,
      numero ? ('num=' + numero) : '',
      status,
      lite ? 'lite1' : 'lite0',
      from,
      to,
      dateFieldRaw || 'date_default',
      orderBy,
      orderDir,
      incluirExcluidas ? 'incl_excl1' : 'incl_excl0',
      incluirCanceladas ? 'incl_can1' : 'incl_can0',
      excluirCanceladas ? 'exc_can1' : 'exc_can0',
      String(limit),
      String(offset),
    ].join('|');
    const forceNoCache =
      String(req.query.nocache || req.query.no_cache || '') === '1' ||
      String(req.query.cache || '') === '0' ||
      String(req.query.clear_cache || req.query.clearCache || '') === '1';
    if (forceNoCache) {
      try { cacheClearPrefix(CACHE_VERSION); } catch (_) {}
    }
    const cached = forceNoCache ? null : cacheGet(cacheKey);
    try {
      const cacheHit = cached != null;
      console.log('[OFS CACHE]', cacheHit ? 'HIT' : 'MISS', String(cacheKey).slice(0, 220));
    } catch (_) {}
    if (cached != null) {
      if (Array.isArray(cached)) return ok(res, cached);
      if (cached && typeof cached === 'object' && Array.isArray(cached.data)) {
        return res.json({ ok: true, data: cached.data, total: Number.isFinite(Number(cached.total)) ? Number(cached.total) : cached.data.length });
      }
      return ok(res, cached);
    }

    const selectBaseCols = OFS_TABLE_COLS.slice();
    const selectLitePref = [
      'id', 'of', 'numero', 'of_num', 'seq',
      'status', 'created_at', 'updated_at', 'deleted_at',
      'emp_id', 'empId', 'empresa_id',
      'cli_id', 'cliId', 'cliente_id',
      'cliNome', 'clinome', 'cliente_nome',
      'vendedor_id', 'vendId',
      'vendNome', 'vendedor',
      'qtd', 'quantidade', 'qtd_pedida',
      'prioridade', 'sem_papel',
      'obs', 'descricao',
      'valor_total', 'valor_venda',
      'urgente', 'urg',
      'dia', 'data_producao', 'ent', 'data_entrega',
      'data_conclusao', 'usuario_conclusao',
      'qtd_produzida', 'qtd_perdida', 'qtd_pedida', 'caixas_excedentes',
      'maquina_perda', 'maq', 'fluxo_maquinas', 'maquina_atual_index',
      'imgs', 'imagem_url',
    ];
    const selectCols = (lite ? selectLitePref : selectBaseCols).filter((c) => _ofsSelectableHas(c));
    const shouldExcludeCanceladas = (excluirCanceladas && !incluirCanceladas && !incluirExcluidas);
    const enrichJoinClientVend = async (rows) => {
      const arr = Array.isArray(rows) ? rows : [];
      if (!arr.length) return arr;
      const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
      const cliIds = Array.from(new Set(
        arr.map((o) => String(o?.cli_id ?? o?.cliId ?? o?.cliente_id ?? '').trim()).filter(Boolean)
      )).slice(0, 150);
      const vendIdsFromRows = Array.from(new Set(
        arr.map((o) => String(
          o?.vendedor_id ?? o?.vendId ?? o?.vend_id ?? o?.vendedorId ?? o?.vendId ?? ''
        ).trim()).filter(Boolean)
      ));
      const vendIdsFromVendedorField = Array.from(new Set(
        arr.map((o) => String(o?.vendedor ?? o?.vendedor_nome ?? o?.vendNome ?? '').trim())
          .filter((v) => isUuid(v))
      ));
      const preVendIds = Array.from(new Set([...vendIdsFromRows, ...vendIdsFromVendedorField])).slice(0, 150);
      if (!cliIds.length && !preVendIds.length) return arr;
      try {
        let cls = [];
        if (cliIds.length) {
          const r1 = await supabase
            .from('clientes')
            .select('id,nome,vendedor_id')
            .in('id', cliIds);
          if (!r1.error && Array.isArray(r1.data)) cls = r1.data;
        }
        const byCliId = new Map();
        cls.forEach((c) => { if (c?.id) byCliId.set(String(c.id), c); });
        const vendIdsFromClients = Array.from(new Set(
          cls.map((c) => String(c?.vendedor_id || '').trim()).filter(Boolean)
        ));
        const vendIds = Array.from(new Set([...vendIdsFromClients, ...preVendIds])).slice(0, 150);
        const byVendId = new Map();
        if (vendIds.length) {
          const { data: vds } = await supabase
            .from('vendedores')
            .select('id,nome')
            .in('id', vendIds);
          (Array.isArray(vds) ? vds : []).forEach((v) => { if (v?.id) byVendId.set(String(v.id), v); });
        }
        return arr.map((o) => {
          const cid = String(o?.cli_id ?? o?.cliId ?? o?.cliente_id ?? '').trim();
          const c = cid ? (byCliId.get(cid) || null) : null;
          let vid = String(
            o?.vendedor_id ?? o?.vendId ?? o?.vend_id ?? o?.vendedorId ?? ''
          ).trim();
          if (!vid || !isUuid(vid)) vid = String(c?.vendedor_id || '').trim();
          if ((!vid || !isUuid(vid))) {
            const maybe = String(o?.vendedor ?? o?.vendedor_nome ?? o?.vendNome ?? '').trim();
            if (isUuid(maybe)) vid = maybe;
          }
          const v = (vid && isUuid(vid)) ? (byVendId.get(vid) || null) : null;
          const vendNomeExisting = String(o?.vendNome || o?.vendedor_nome || o?.vendedor || '').trim();
          const vendNomeSafe = (vendNomeExisting && !isUuid(vendNomeExisting)) ? vendNomeExisting : '';
          return {
            ...o,
            cliNome: (c?.nome || o?.cliNome || o?.clinome || o?.cliente_nome || o?.cli_nome || o?.cliente || ''),
            vendNome: (v?.nome || vendNomeSafe || ''),
            vendedor_id: (vid && isUuid(vid)) ? vid : (c?.vendedor_id || o?.vendedor_id || o?.vendId || null),
          };
        });
      } catch (e) {
        try { console.warn('[enrich] erro:', e?.message); } catch (_) {}
        return arr;
      }
    };

    const colsValidas = selectCols.filter((c) => _ofsSelectableHas(c));
    let data = null;
    let rawErr = null;
    let colsArr = colsValidas.slice();
    let colMissingHits = 0;
    let useSelectAllFallback = false;
    let total = null;
    let dateCol = '';
    const isDeletedAt = (v) => {
      if (v == null) return false;
      const s = String(v).trim();
      if (!s) return false;
      const sl = s.toLowerCase();
      if (sl === 'null' || sl === 'undefined' || sl === '0') return false;
      if (s === '0000-00-00' || s.startsWith('0000-00-00')) return false;
      return true;
    };
    if (from && to) {
      const fallback = (_ofsSelectableHas('dia') ? 'dia' : 'created_at');
      const wantsEntrega = (dateFieldRaw === 'entrega' || dateFieldRaw === 'data_entrega' || dateFieldRaw === 'ent');
      if (wantsEntrega) {
        if (_ofsSelectableHas('data_entrega')) dateCol = 'data_entrega';
        else if (_ofsSelectableHas('ent')) dateCol = 'ent';
        else dateCol = fallback;
      } else {
        dateCol = fallback;
      }
    }

    let empCols = empId ? ['emp_id', 'empId', 'empresa_id'] : [];
    let cliCols = clienteId ? ['cli_id', 'cliId', 'cliente_id', 'cliid'] : [];
    let numCols = numero ? ['numero', 'of', 'of_num'] : [];

    for (let tentativa = 0; tentativa < 8; tentativa++) {
      const sel = tentativa === 0 ? '*' : (colsArr.length ? colsArr.join(',') : 'id,numero,status,created_at');

      let q = supabase
        .from('ofs')
        .select(sel, { count: 'exact' })
        .order(orderBy, { ascending: orderAsc })
        .range(offset, offset + limit - 1);

      if (status) q = q.eq('status', status);

      if (empId && Array.isArray(empCols) && empCols.length) {
        const empCol = empCols[Math.min(tentativa, empCols.length - 1)];
        if (empCol) q = q.eq(empCol, empId);
      }

      if (clienteId && Array.isArray(cliCols) && cliCols.length) {
        const expr = cliCols.map((c) => `${c}.eq.${clienteId}`).join(',');
        if (expr) q = q.or(expr);
      }

      if (numero && Array.isArray(numCols) && numCols.length) {
        const expr = numCols.map((c) => `${c}.eq.${numero}`).join(',');
        if (expr) q = q.or(expr);
      }

      if (!incluirExcluidas) q = q.is('deleted_at', null);
      if (shouldExcludeCanceladas) q = q.neq('status', 'Cancelada').neq('status', 'Cancelado');
      if (from && to) q = q.gte(dateCol || 'data_entrega', from).lte(dateCol || 'data_entrega', to);

      const r = await q;

      if (!r.error) {
        data = r.data || [];
        if (typeof r.count === 'number') total = r.count;
        console.log('[OFS GET] OK tentativa=' + tentativa + ' rows=' + (Array.isArray(data) ? data.length : 0));
        break;
      }

      rawErr = r.error;
      const msg = String(r.error?.message || '');
      console.error('[OFS GET] erro tentativa=' + tentativa + ':', msg);

      const colMatch =
        msg.match(/column ofs\."?(\w+)"? does not exist/i) ||
        msg.match(/column "?(\w+)"? does not exist/i) ||
        msg.match(/Could not find the '(\w+)' column/i);

      if (colMatch) {
        const colProb = colMatch[1];
        console.warn('[OFS GET] removendo coluna:', colProb);
        colsArr = colsArr.filter((c) => c !== colProb);
        if (orderBy === colProb) orderBy = 'created_at';
        if (dateCol === colProb) dateCol = 'created_at';
        if (Array.isArray(cliCols) && cliCols.includes(colProb)) cliCols = cliCols.filter((c) => c !== colProb);
        if (Array.isArray(numCols) && numCols.includes(colProb)) numCols = numCols.filter((c) => c !== colProb);
        if (Array.isArray(empCols) && empCols.includes(colProb)) empCols = empCols.filter((c) => c !== colProb);
        continue;
      }

      if (msg.includes('does not exist') || msg.includes('Could not find')) {
        colsArr = [
          'id', 'numero', 'of', 'status', 'created_at', 'updated_at', 'deleted_at',
          'cli_id', 'cliId', 'cliente_id', 'emp_id', 'empId', 'empresa_id',
          'data_entrega', 'ent', 'valor_total', 'valor_venda', 'qtd', 'quantidade',
          'descricao', 'obs', 'urgente', 'urg', 'imgs', 'imagem_url',
          'maq', 'fluxo_maquinas', 'data_conclusao', 'cliNome', 'clinome'
        ];
        continue;
      }

      break;
    }

    if (!data && rawErr) {
      try { console.error('[OFS GET QUERY ERROR]', rawErr?.message || rawErr); } catch (_) {}
      _logApiError('OFS GET', req, rawErr, { selectCols: colsArr, limit, offset, empId, status, from, to, lite });
      return res.status(500).json({ ok: false, error: String(rawErr.message || rawErr), rid: req._rid || null });
    }

    try {
      const before = Array.isArray(data) ? data : [];
      console.log('[OFS DEBUG] total antes do filtro:', before.length);
      console.log('[OFS DEBUG] com deleted_at:', before.filter((o) => isDeletedAt(o?.deleted_at)).length);
    } catch (_) {}
    if (!incluirExcluidas) {
      data = (Array.isArray(data) ? data : []).filter((o) => !isDeletedAt(o?.deleted_at));
      if (typeof total === 'number') total = Number(data.length);
    }

    const enriched = await enrichJoinClientVend(Array.isArray(data) ? data : []);
    let rows = (enriched || []).map((row) => {
      if (!row || typeof row !== 'object') return row;
      const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
      const raw = String(row.vendNome || row.vendedor_nome || row.vendedor || '').trim();
      const vendedor_nome = (raw && !isUuid(raw)) ? raw : '';
      return { ...row, vendedor_nome };
    });
    try {
      const VENDEDOR_PADRAO_ID = '0c4852da-ffff-4c1b-bfc4-38e169d6d580';
      const VENDEDOR_PADRAO_NOME = 'RONI MEIA VENDA';
      const { data: todosClientes } = await supabase
        .from('clientes')
        .select('id,nome,vendedor_id')
        .limit(5000);
      const cliMap = new Map(
        (Array.isArray(todosClientes) ? todosClientes : [])
          .filter((c) => c && c.id)
          .map((c) => [String(c.id), c])
      );

      const { data: todosVendedores } = await supabase
        .from('vendedores')
        .select('id,nome')
        .limit(5000);
      const vendMap = new Map(
        (Array.isArray(todosVendedores) ? todosVendedores : [])
          .filter((v) => v && v.id)
          .map((v) => [String(v.id), String(v.nome || '').trim()])
      );

      rows = (rows || []).map((r) => {
        if (!r || typeof r !== 'object') return r;
        const cid = String(r.cli_id || r.cliente_id || '').trim();
        const cli = cid ? (cliMap.get(cid) || null) : null;
        const vidRaw = String(r.vendedor_id || '').trim();
        const vid = vidRaw || VENDEDOR_PADRAO_ID;
        const cliNome = String(cli?.nome || r.cliNome || '').trim();
        let vendNome = String((vid ? (vendMap.get(vid) || '') : '') || r.vendNome || '').trim();
        if (!vendNome && !vidRaw) vendNome = VENDEDOR_PADRAO_NOME;
        const vendedor_nome = String(r.vendedor_nome || '').trim() || vendNome;
        return { ...r, cliNome, vendNome, vendedor_id: vid, vendedor_nome };
      });
    } catch (_) {}
    try {
      const sample = rows && rows[0] ? rows[0] : null;
      console.log('[OFS SAMPLE]', JSON.stringify({
        id: sample?.id,
        of: sample?.of,
        cli_id: sample?.cli_id,
        cliNome: sample?.cliNome,
        vendedor_id: sample?.vendedor_id,
        vendNome: sample?.vendNome,
        imagem_url: sample?.imagem_url,
        imgs: sample?.imgs,
      }));
    } catch (_) {}
    const payload = { data: rows, total: Number.isFinite(Number(total)) ? Number(total) : (Array.isArray(rows) ? rows.length : 0) };
    cacheSet(cacheKey, payload, 10 * 1000);
    return res.json({ ok: true, ...payload });
  } catch (e) {
    console.error('[OFS GET FATAL ERROR]', e?.message);
    console.error('[OFS GET STACK]', e?.stack?.split('\n')?.slice(0, 5)?.join(' | '));
    try {
      const { data, error } = await supabase
        .from('ofs')
        .select('id,numero,status,created_at')
        .limit(5);
      console.log('[OFS TEST]', error?.message || 'OK', Array.isArray(data) ? data.length : null);
    } catch (e2) {
      console.log('[OFS TEST]', String(e2?.message || e2));
    }
    _logApiError('OFS GET', req, e, { query: req.query });
    return res.status(500).json({ ok: false, error: String(e.message || e), rid: req._rid || null });
  }
});
async function _maybeRegistrarComissaoOF(req, body, ofRow) {
  try {
    const vendedorId = String(body?.vendedor_id ?? body?.vend_id ?? body?.vendId ?? ofRow?.vendedor_id ?? ofRow?.vend_id ?? ofRow?.vendId ?? '').trim();
    const valorOf = Number(body?.valor_total ?? body?.valor_venda ?? ofRow?.valor_total ?? ofRow?.valor_venda ?? 0);
    console.log('[COMISSAO] vendedorId:', vendedorId, 'valorOf:', valorOf);
    if (!vendedorId || !(valorOf > 0)) return;
    const { data: vend } = await supabase.from('vendedores').select('*').eq('id', vendedorId).maybeSingle();
    const VENDEDOR_PADRAO_ID = '0c4852da-ffff-4c1b-bfc4-38e169d6d580';
    const VENDEDOR_PADRAO_NOME = 'RONI MEIA VENDA';
    let perc = Number(vend?.comissao_pct ?? vend?.comissao ?? vend?.comissaoPct ?? 0);
    if (vendedorId === VENDEDOR_PADRAO_ID) perc = 0.5;
    console.log('[OF COMISSAO] vendedorId:', vendedorId, 'valorOf:', valorOf, 'comissao%:', perc);
    if (!(perc > 0)) return;
    const valorComissao = valorOf * (perc / 100);
    const vendNome = String(vend?.nome || '').trim() || (vendedorId === VENDEDOR_PADRAO_ID ? VENDEDOR_PADRAO_NOME : '');
    const numero = body?.of ?? body?.numero ?? ofRow?.of ?? ofRow?.numero ?? '';
    await supabase.from('historico_acoes').insert([{
      tipo_acao: 'comissao_of',
      descricao: `Comissão OF #${numero || ''}: ${vendNome || ''} — R$ ${valorComissao.toFixed(2)} (${perc}% de R$ ${valorOf.toFixed(2)})`,
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
    const { data: chapa, error: e1 } = await supabase.from(table).select('*').eq('id', chapaId).maybeSingle();
    if (e1 || !chapa) return;
    const canonChapa = _chapasCanonicalFromAny(chapa, table);

    const ofNumero = body?.of ?? body?.numero ?? ofRow?.of ?? ofRow?.numero ?? null;
    const cliRef = body?.cliId ?? body?.cli_id ?? body?.cliente_id ?? ofRow?.cliId ?? ofRow?.cli_id ?? ofRow?.cliente_id ?? '';
    const empId = body?.emp_id ?? body?.empId ?? ofRow?.emp_id ?? ofRow?.empId ?? 'E1';
    const usuario = req?.usuario?.nome || 'sistema';

    if (table === 'chapas_estoque_v2') {
      const obs = `Saída automática - OF #${ofNumero || ''} · Cliente: ${cliRef || ''}`.trim();
      const origemId = ofNumero ? String(ofNumero) : (ofRow?.id ? String(ofRow.id) : null);
      const movRes = await _chapasMovimentarV2Rpc({
        chapa_id: chapaId,
        tipo: 'saida',
        quantidade: qtdChapas,
        nf: body?.nf || null,
        obs,
        origem: 'of',
        origem_id: origemId,
        usuario,
        emp_id: empId || null,
      });
      if (movRes?.error) {
        if (_chapasMovRpcIsSaldoInsuficiente(movRes.error)) {
          console.warn('[OF BAIXA CHAPAS] saldo insuficiente:', movRes.error?.message || movRes.error);
          return;
        }
        return;
      }
      cacheClearPrefix('chapas_estoque:');
      const desc = `Estoque chapas: SAIDA -${qtdChapas} · ${canonChapa.nome || ''} · ${canonChapa.fornecedor || ''} · ${canonChapa.nomenclatura || ''} · ${canonChapa.tamanho || ''}${ofNumero ? (' · OF #' + String(ofNumero)) : ''}`.trim();
      await _chapasLogAcao(req, 'estoque_saida', desc);
      return;
    }

    const qtdAtual = Math.trunc(Number(canonChapa.quantidade || 0) || 0);
    const qtdNova = Math.max(0, qtdAtual - qtdChapas);
    const updPayload = { qtd: qtdNova };
    const upd = await supabase.from(table).update(updPayload).eq('id', chapaId);
    if (upd.error) return;
    cacheClearPrefix('chapas_estoque:');
  } catch (e) {}
}

function _parseFluxoAny(v){
  if(Array.isArray(v)) return v.map(x=>String(x||'').trim()).filter(Boolean);
  if(typeof v === 'string'){
    const s = v.trim();
    if(!s) return [];
    try{
      const p = JSON.parse(s);
      if(Array.isArray(p)) return p.map(x=>String(x||'').trim()).filter(Boolean);
    }catch(_){}
    return [s].filter(Boolean);
  }
  return [];
}

function _ofPickFluxoNames(of){
  try{
    let f = of?.fluxo_maquinas ?? of?.maq ?? [];
    if(typeof f === 'string'){
      const raw = String(f||'').trim();
      if(!raw) f = [];
      else { try{ f = JSON.parse(raw || '[]'); }catch(_){ f = _parseFluxoAny(raw); } }
    }
    if(!Array.isArray(f)) f = [];
    return f.map((x)=>{
      if(x && typeof x === 'object'){
        const n = x.nome ?? x.maquina ?? x.name ?? x.value ?? x.label ?? '';
        return String(n||'').trim();
      }
      return String(x||'').trim();
    }).filter(Boolean);
  }catch(_){
    return [];
  }
}

function _ofPickMaqAtualName(of){
  try{
    const f = _ofPickFluxoNames(of);
    if(!f.length) return '';
    const idx = Number(of?.maquina_atual_index ?? 0) || 0;
    return String(f[Math.min(Math.max(0, idx), f.length - 1)] || f[0] || '').trim();
  }catch(_){
    return '';
  }
}

async function _autoPickSugestaoMaquinaNome(body){
  const toNumOrNull = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  try{
    if(!supabase) return { ok:false, skipped:'supabase_not_configured' };
    const comp = Number(body?.comprimento_mm ?? body?.caixa_comprimento ?? body?.caixaComprimento ?? body?.comprimento ?? 0) || 0;
    const larg = Number(body?.largura_mm ?? body?.caixa_largura ?? body?.caixaLargura ?? body?.largura ?? 0) || 0;
    const alt = Number(body?.altura_mm ?? body?.caixa_altura ?? body?.caixaAltura ?? body?.altura ?? 0) || 0;
    const onda = String(body?.onda ?? body?.of_onda ?? body?.onda_caixa ?? '').trim();
    if(!(comp > 0 && larg > 0)) return { ok:false, skipped:'sem_medidas' };

    const { data: maquinas, error } = await supabase
      .from('maquinas')
      .select('id,nome,col,puxada_min,puxada_max,boca_max,ativo,ordem')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .limit(50);
    if (error || !Array.isArray(maquinas) || !maquinas.length) {
      return { ok: false, skipped: 'sem_maquinas' };
    }
    const maquinasAtivas = maquinas.filter(m =>
      m.ativo === true &&
      String(m.nome || '').trim() !== '' &&
      String(m.nome || '').trim() !== 'null'
    );
    if (!maquinasAtivas.length) {
      return { ok: false, skipped: 'sem_maquinas_ativas' };
    }

    const folgaPuxadaBase = 20;
    const folgaBocaBase = 15;
    const ondaNorm = onda.toLowerCase();
    const folgaPuxada = ondaNorm.includes('bc') ? folgaPuxadaBase + 5 : folgaPuxadaBase;
    const folgaBoca = ondaNorm.includes('bc') ? folgaBocaBase + 5 : folgaBocaBase;
    const desenvolvimento = (comp + alt) * 2 + folgaPuxada;
    const boca = larg + (alt * 2) + folgaBoca;

    const compat = (maquinasAtivas || []).filter((m)=>{
      const puxMin = toNumOrNull(m.puxada_min);
      const puxMax = toNumOrNull(m.puxada_max);
      const bocaMax = toNumOrNull(m.boca_max);
      const devOk = (puxMin == null || desenvolvimento >= puxMin) && (puxMax == null || desenvolvimento <= puxMax);
      const bocaOk = (bocaMax == null || boca <= bocaMax);
      return !!(devOk && bocaOk);
    }).map((m)=>({ id:m.id, nome:String(m.nome||'').trim() })).filter((m)=>m.nome);

    if(!compat.length) return { ok:false, skipped:'sem_compativeis' };

    const statusNotIn = '("Concluído","Concluido","Cancelada","Cancelado","Pedido Pronto")';
    const { data: ofsRaw } = await supabase
      .from('ofs')
      .select('id,status,fluxo_maquinas,maq,maquina_atual_index,deleted_at')
      .is('deleted_at', null)
      .not('status', 'in', statusNotIn)
      .limit(5000);
    const ofs = Array.isArray(ofsRaw) ? ofsRaw : [];
    const filaMap = new Map();
    const cand = new Set(compat.map(x=>String(x.nome)));
    ofs.forEach((o)=>{
      const mk = String(_ofPickMaqAtualName(o) || '').trim();
      if(!mk || !cand.has(mk)) return;
      filaMap.set(mk, (filaMap.get(mk) || 0) + 1);
    });

    const dt30 = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10);
    const { data: perdasRaw } = await supabase
      .from('caixas_perdidas')
      .select('id,of_id,qtd_perdida,maquina_perda,maquina,maquina_nome,data,created_at')
      .gte('data', dt30)
      .limit(5000);
    const perdas = Array.isArray(perdasRaw) ? perdasRaw : [];
    const ofIds = [...new Set(perdas.map(p=>String(p?.of_id||'').trim()).filter(Boolean))];
    const ofQtdMap = new Map();
    for(let i=0;i<ofIds.length;i+=200){
      const chunk = ofIds.slice(i,i+200);
      const { data: ofsP } = await supabase
        .from('ofs')
        .select('id,qtd,qtd_produzida,quantidade')
        .in('id', chunk)
        .limit(200);
      (Array.isArray(ofsP)?ofsP:[]).forEach((x)=>{
        const id = String(x?.id||'').trim();
        if(!id) return;
        const qtd = Number(x?.qtd_produzida ?? x?.qtd ?? x?.quantidade ?? 0) || 0;
        ofQtdMap.set(id, qtd);
      });
    }
    const perdaAgg = new Map();
    const pickMaq = (p)=>{
      const a = String(p?.maquina_perda||'').trim();
      const b = String(p?.maquina_nome||'').trim();
      const c = String(p?.maquina||'').trim();
      return a || b || c;
    };
    perdas.forEach((p)=>{
      const mk = String(pickMaq(p) || '').trim();
      if(!mk || !cand.has(mk)) return;
      const lost = Math.trunc(Number(p?.qtd_perdida||0) || 0);
      const prod = ofQtdMap.get(String(p?.of_id||'').trim()) || 0;
      const cur = perdaAgg.get(mk) || { lost:0, prod:0 };
      cur.lost += lost;
      cur.prod += Math.trunc(Number(prod)||0);
      perdaAgg.set(mk, cur);
    });
    const lossRate = (mk)=>{
      const a = perdaAgg.get(mk) || { lost:0, prod:0 };
      const lost = Number(a.lost||0) || 0;
      const prod = Number(a.prod||0) || 0;
      if(prod > 0) return lost / prod;
      return lost > 0 ? 1 : 0;
    };

    const ranked = compat.map((m)=>{
      const fila = Math.trunc(Number(filaMap.get(m.nome) || 0) || 0);
      const taxa = lossRate(m.nome);
      const penal = taxa > 0.05 ? 1000 : 0;
      return { ...m, fila, taxa_perda: taxa, penalidade: penal };
    });
    ranked.sort((a,b)=>{
      if((a.penalidade||0) !== (b.penalidade||0)) return (a.penalidade||0) - (b.penalidade||0);
      if((a.fila||0) !== (b.fila||0)) return (a.fila||0) - (b.fila||0);
      if((a.taxa_perda||0) !== (b.taxa_perda||0)) return (a.taxa_perda||0) - (b.taxa_perda||0);
      return String(a.nome).localeCompare(String(b.nome));
    });
    const melhor = ranked[0];
    if(!melhor || !melhor.nome) return { ok:false, skipped:'sem_melhor' };
    return { ok:true, nome: melhor.nome, fila: melhor.fila, taxa_perda: melhor.taxa_perda, penalidade: melhor.penalidade };
  }catch(e){
    return { ok:false, skipped:'erro', error: String(e?.message || e) };
  }
}

async function _autoSugerirMaquinaParaOF(body, created){
  try{
    const fluxoBody = _parseFluxoAny(body?.fluxo_maquinas ?? body?.fluxoMaquinas ?? body?.maq ?? body?.maquinas ?? []);
    const fluxoCreated = _parseFluxoAny(created?.fluxo_maquinas ?? created?.maq ?? []);
    if(fluxoBody.length || fluxoCreated.length) return { ok:false, skipped:'ja_tem_maquina' };
    const sug = await _autoPickSugestaoMaquinaNome({ ...(created||{}), ...(body||{}) });
    if(!sug || !sug.ok || !sug.nome) return { ok:false, skipped: sug?.skipped || 'sem_melhor' };

    const updPayload = {
      fluxo_maquinas: [sug.nome],
      maq: JSON.stringify([sug.nome]),
      maquina_atual_index: 0
    };
    const upd = await supabase.from('ofs').update(updPayload).eq('id', created?.id).select().maybeSingle();
    if(upd.error) return { ok:false, skipped:'falha_update', error: upd.error.message };
    return { ok:true, nome: sug.nome, updated: upd.data || null, fila: sug.fila, taxa_perda: sug.taxa_perda, penalidade: sug.penalidade };
  }catch(e){
    return { ok:false, skipped:'erro', error: String(e?.message || e) };
  }
}

app.post('/api/ofs', authMiddleware, async (req, res) => {
  try {
    setNoCache(res);
    const body = req.body || {};
    const filtered = ofPayloadFiltrado(body);
    if ((filtered.of == null || String(filtered.of || '').trim() === '') && (filtered.numero == null || String(filtered.numero || '').trim() === '')) {
      try {
        const { data: last } = await supabase
          .from('ofs')
          .select('seq,of,numero')
          .order('seq', { ascending: false })
          .limit(1)
          .maybeSingle();
        const lastSeq = Math.trunc(Number(last?.seq || 0) || 0);
        const nextSeq = lastSeq > 0 ? (lastSeq + 1) : 1;
        filtered.seq = nextSeq;
        const numStr = String(nextSeq);
        filtered.of = numStr;
        filtered.numero = numStr;
      } catch (_) {}
    }
    console.log('[OF SAVE]', req.method, req.params.id || 'novo', JSON.stringify(Object.keys(body)));
    const createdRes = await ofsInsertWithRetry(ofIn(filtered));
    if (createdRes.error) throw createdRes.error;
    let created = createdRes.data;
    await logAuditoria('ofs', 'INSERT', created?.id, null, created, req);
    await _maybeRegistrarComissaoOF(req, body, created);
    await _maybeBaixaAutomaticaChapasOF(req, body, created);
    try {
      const cliId = String(body?.cli_id || body?.cliId || created?.cli_id || created?.cliId || created?.cliente_id || '').trim();
      const vendId = String(
        body?.vendedor_id || body?.vendId || body?.vend_id ||
        created?.vendedor_id || created?.vendId || created?.vend_id || ''
      ).trim();
      if (cliId && vendId) {
        await supabase
          .from('clientes')
          .update({ vendedor_id: vendId })
          .eq('id', cliId)
          .is('vendedor_id', null);
        cacheClearPrefix('clientes_');
      }
    } catch (_) {}
    try {
      const itens = Array.isArray(body?.itens) ? body.itens : [];
      for (const item of itens) {
        const itemChapaId = String(item?.chapa_id ?? item?.chapaId ?? '').trim();
        const itemQtdChapas = Math.trunc(Number(item?.qtd_chapas ?? item?.qtdChapas ?? item?.qchp ?? 0) || 0);
        if (!itemChapaId || !(itemQtdChapas > 0)) continue;
        await _maybeBaixaAutomaticaChapasOF(req, {
          chapa_id: itemChapaId,
          qtd_chapas: itemQtdChapas,
          of: created?.of ?? body?.of ?? '',
          numero: created?.numero ?? body?.numero ?? '',
          emp_id: body?.emp_id ?? body?.empId ?? created?.emp_id ?? created?.empId ?? 'E1',
          _estoqueJaBaixadoCriacao: false,
        }, created);
      }
    } catch (_) {}
    try{
      const sug = await _autoSugerirMaquinaParaOF(body, created);
      if(sug && sug.ok && sug.updated) created = sug.updated;
    }catch(_){}
    const warnings = (createdRes && Array.isArray(createdRes.ignoredColumns) && createdRes.ignoredColumns.length)
      ? { ignored_columns: createdRes.ignoredColumns.slice() }
      : null;
    return res.json({ ok: true, data: created, ...(warnings ? { warnings } : {}) });
  } catch (e) {
    _logApiError('OFS POST', req, e, { bodyKeys: Object.keys(req.body || {}), bodySize: _safeJson(req.body || {}).length });
    return res.status(500).json({ ok: false, error: String(e?.message || e), rid: req._rid || null });
  }
});

app.get('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const joinKeys = ['cli_id', 'cliente_id', 'cliId'];
    let data = null;
    for (const key of joinKeys) {
      const r = await supabase
        .from('ofs')
        .select(`*,cliente:clientes!${key}(nome,vendedor_id,vendedor:vendedores!vendedor_id(nome))`)
        .eq('id', id)
        .maybeSingle();
      if (!r.error) { data = r.data; break; }
      const msg = String(r.error?.message || '');
      if (msg.includes('relationship') || msg.includes('schema cache') || msg.includes('Could not find a relationship')) continue;
      break;
    }
    if (!data) {
      const r = await supabase.from('ofs').select('*').eq('id', id).maybeSingle();
      if (r.error) return res.status(500).json({ ok: false, error: r.error.message });
      data = r.data;
    }
    if (!data) return res.status(404).json({ ok: false, error: 'OF não encontrada' });

    const clienteJoin = data.cliente && typeof data.cliente === 'object' ? data.cliente : null;
    const vendNested = clienteJoin?.vendedor && typeof clienteJoin.vendedor === 'object' ? clienteJoin.vendedor : null;
    const { cliente, ...rest } = data;

    let cliNome = clienteJoin?.nome || data.cliNome || data.clinome || '';
    let vendNome = vendNested?.nome || data.vendNome || data.vendedor_nome || data.vendedor || '';
    let vendedorId = clienteJoin?.vendedor_id || data.vendedor_id || data.vendId || null;
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    if (vendNome && isUuid(String(vendNome).trim())) vendNome = '';
    if (!vendedorId && vendNome && isUuid(String(vendNome).trim())) vendedorId = String(vendNome).trim();

    if (!cliNome || !vendNome) {
      const cliId = String(data.cli_id || data.cliId || data.cliente_id || '').trim();
      if (cliId) {
        const { data: cli } = await supabase
          .from('clientes')
          .select('nome,vendedor_id,vendedor:vendedores!vendedor_id(nome)')
          .eq('id', cliId)
          .maybeSingle();
        if (cli) {
          cliNome = cliNome || cli.nome || '';
          vendedorId = vendedorId || cli.vendedor_id || null;
          const v = cli.vendedor && typeof cli.vendedor === 'object' ? cli.vendedor : null;
          vendNome = vendNome || v?.nome || '';
        }
      }
    }
    if ((!vendNome || isUuid(String(vendNome || '').trim())) && vendedorId && isUuid(String(vendedorId || '').trim())) {
      try {
        const { data: vend } = await supabase.from('vendedores').select('nome').eq('id', String(vendedorId)).maybeSingle();
        if (vend?.nome) vendNome = String(vend.nome).trim();
      } catch (_) {}
    }
    if (vendNome && isUuid(String(vendNome).trim())) vendNome = '';
    return ok(res, { ...rest, cliNome, vendNome, vendedor_id: vendedorId, vendedor_nome: vendNome });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
});

app.put('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    setNoCache(res);
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const body = _filterOfsPayloadKnownCols(req.body || {}, true);
    const cleanBody = { ...body };
    console.log('[OF SAVE]', req.method, id, JSON.stringify(Object.keys(body || {})));

    const { data: ofAtual } = await supabase
      .from('ofs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!ofAtual) return res.status(404).json({ ok: false, error: 'OF não encontrada' });

    try {
      const hasEntrega = Object.prototype.hasOwnProperty.call(body, 'ent') || Object.prototype.hasOwnProperty.call(body, 'data_entrega');
      const hasMaq = Object.prototype.hasOwnProperty.call(body, 'fluxo_maquinas') || Object.prototype.hasOwnProperty.call(body, 'maq');
      if (hasEntrega || hasMaq) {
        const oldEntrega = String(ofAtual?.ent || ofAtual?.data_entrega || '').slice(0, 10);
        const newEntrega = String((body.ent ?? body.data_entrega ?? '') || '').slice(0, 10);
        const oldMaqRaw = ofAtual?.fluxo_maquinas ?? ofAtual?.maq ?? null;
        const newMaqRaw = (Object.prototype.hasOwnProperty.call(body, 'fluxo_maquinas') ? body.fluxo_maquinas : (Object.prototype.hasOwnProperty.call(body, 'maq') ? body.maq : undefined));
        const normMaq = (v) => {
          if (v == null) return '';
          if (Array.isArray(v)) return v.map(x => String(x || '').trim()).filter(Boolean).join(' | ');
          if (typeof v === 'string') {
            const s = v.trim();
            if (!s) return '';
            try {
              const p = JSON.parse(s);
              if (Array.isArray(p)) return p.map(x => String(x || '').trim()).filter(Boolean).join(' | ');
            } catch (_) {}
            return s;
          }
          if (typeof v === 'object') {
            try {
              const p = Array.isArray(v) ? v : Object.values(v);
              return (Array.isArray(p) ? p : []).map(x => String(x || '').trim()).filter(Boolean).join(' | ');
            } catch (_) { return ''; }
          }
          return String(v || '').trim();
        };
        const oldMaq = normMaq(oldMaqRaw);
        const newMaq = newMaqRaw === undefined ? oldMaq : normMaq(newMaqRaw);
        const motivo = String(req.body?.motivo || req.body?.motivo_reprogramacao || req.body?.obs_motivo || '').trim();
        const changedEntrega = hasEntrega && (newEntrega !== oldEntrega);
        const changedMaq = hasMaq && (newMaq !== oldMaq);
        if (changedEntrega || changedMaq) {
          await logAuditoria('ofs', 'REPROGRAMACAO', id, {
            entrega: oldEntrega || null,
            maquinas: oldMaq || null,
          }, {
            entrega: (hasEntrega ? (newEntrega || null) : oldEntrega || null),
            maquinas: (hasMaq ? (newMaq || null) : oldMaq || null),
            motivo: motivo || null,
          }, req);
        }
      }
    } catch (_) {}

    try {
      const vn = String(cleanBody?.vendedor_nome || '').trim();
      const v2 = String(cleanBody?.vendNome || '').trim();
      if (vn) cleanBody.vendedor = vn;
      else if (v2) cleanBody.vendedor = v2;
    } catch (_) {}
    try {
      const ofNum = cleanBody?.of != null ? String(cleanBody.of || '').trim() : '';
      const num = cleanBody?.numero != null ? String(cleanBody.numero || '').trim() : '';
      const val = ofNum || num || '';
      if (val) {
        if (!ofNum) cleanBody.of = val;
        if (!num) cleanBody.numero = val;
      }
    } catch (_) {}

    const expectedUpdatedAt = String(
      body?._expected_updated_at ?? body?.expected_updated_at ?? body?.if_match_updated_at
      ?? req.headers['if-match'] ?? req.headers['x-of-updated-at'] ?? ''
    ).trim();
    const currentUpdatedAt = String(ofAtual?.updated_at || '').trim();
    if (expectedUpdatedAt && currentUpdatedAt && expectedUpdatedAt !== currentUpdatedAt) {
      return res.status(409).json({ ok: false, error: 'concurrency_conflict', current: ofAtual, rid: req._rid || null });
    }

    ['seq', 'id', 'created_at'].forEach((k) => delete cleanBody[k]);
    if (!Object.prototype.hasOwnProperty.call(body, 'itens')) delete cleanBody.itens;

    const valorAtual = Number(ofAtual?.valor_total ?? ofAtual?.valor_venda ?? 0);
    const zerarValor = body?._zerar_valor === true || body?._zerar_valor === 'true' || body?._zerar_valor === 1 || body?._zerar_valor === '1';
    const hasValor = Object.prototype.hasOwnProperty.call(body, 'valor_total') || Object.prototype.hasOwnProperty.call(body, 'valor_venda');
    if (hasValor && !zerarValor) {
      const valBody = Number(cleanBody.valor_total ?? cleanBody.valor_venda ?? NaN);
      if (Number.isFinite(valBody) && valBody === 0 && valorAtual > 0) {
        delete cleanBody.valor_total;
        delete cleanBody.valor_venda;
      }
    }

    const filtered = ofPayloadFiltrado(cleanBody);
    delete filtered.id;
    delete filtered.of_num;
    delete filtered.seq;
    delete filtered.created_at;
    filtered.updated_at = new Date().toISOString();

    const updRes = await ofsUpdateWithRetry(id, ofIn(filtered));
    if (updRes.error) throw updRes.error;
    const updated = updRes.data;
    await _maybeRegistrarComissaoOF(req, body, updated);
    await logAuditoria('ofs', 'UPDATE', id, ofAtual, updated, req);
    try {
      const cliId = String(body?.cli_id || body?.cliId || ofAtual?.cli_id || ofAtual?.cliId || ofAtual?.cliente_id || '').trim();
      const vendId = String(
        filtered?.vendedor_id || body?.vendedor_id || body?.vendId ||
        body?.vend_id || ofAtual?.vendedor_id || ofAtual?.vendId || ''
      ).trim();
      if (cliId && vendId) {
        await supabase
          .from('clientes')
          .update({ vendedor_id: vendId })
          .eq('id', cliId)
          .is('vendedor_id', null);
        cacheClearPrefix('clientes_');
      }
    } catch (_) {}

    try {
      const hasQtd = Object.prototype.hasOwnProperty.call(body, 'qtd') || Object.prototype.hasOwnProperty.call(body, 'quantidade');
      const qtdNovaRaw = hasQtd ? (body.qtd ?? body.quantidade) : undefined;
      const qtdNova = Number(qtdNovaRaw ?? NaN);
      const qtdAntiga = Number(ofAtual?.qtd ?? NaN);
      const statusAtual = String(ofAtual?.status || '').trim().toLowerCase();
      const foiConcluida = statusAtual === 'pedido pronto' || statusAtual === 'concluida' || statusAtual === 'concluído';

      if (foiConcluida && Number.isFinite(qtdNova) && qtdNova > 0 && Number.isFinite(qtdAntiga) && qtdAntiga > 0 && qtdNova < qtdAntiga) {
        const qtdPerdida = Math.trunc(qtdAntiga - qtdNova);
        const valorOriginal = Number(ofAtual?.valor_total ?? ofAtual?.valor_venda ?? 0);
        const valorUnit = qtdAntiga > 0 ? (valorOriginal / qtdAntiga) : 0;
        const cliId = String(
          ofAtual?.cli_id ?? ofAtual?.cliId ?? ofAtual?.cliente_id ?? ofAtual?.clienteId
          ?? updated?.cli_id ?? updated?.cliId ?? updated?.cliente_id ?? updated?.clienteId
          ?? body?.cli_id ?? body?.cliId ?? body?.cliente_id ?? body?.clienteId
          ?? ''
        ).trim();

        let cliNome = '';
        if (cliId) {
          try {
            const { data: cliData } = await supabase.from('clientes').select('nome').eq('id', cliId).maybeSingle();
            cliNome = String(cliData?.nome || '').trim();
          } catch (_) {}
        }

        const hoje = new Date().toISOString().slice(0, 10);
        const mes = new Date().toISOString().slice(0, 7);
        const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

        let maquinaPerda = String(
          body?.maquina_perda ?? body?.maquinaPerda ?? body?.maquina ?? updated?.maquina_perda ?? updated?.maquina ?? updated?.maquina_nome ?? ''
        ).trim();
        let maquinaPerdaId = String(
          body?.maquina_perda_id ?? body?.maquinaPerdaId ?? body?.maquina_id ?? body?.maquinaId ?? ''
        ).trim();
        try {
          if (!maquinaPerda || !maquinaPerdaId) {
            const fluxo = parseFluxo(updated?.fluxo_maquinas ?? updated?.maq ?? ofAtual?.fluxo_maquinas ?? ofAtual?.maq);
            const idx = Number(updated?.maquina_atual_index ?? ofAtual?.maquina_atual_index ?? 0) || 0;
            const pick = fluxo[idx] ?? fluxo[0] ?? null;
            const raw = (pick && typeof pick === 'object')
              ? String(pick.nome || pick.name || pick.maquina || pick.col || pick.id || '').trim()
              : String(pick || '').trim();
            if (raw) {
              if (isUuid(raw)) { if (!maquinaPerdaId) maquinaPerdaId = raw; }
              else if (!maquinaPerda) maquinaPerda = raw;
            }
          }
        } catch (_) {}

        const payload = {
          of_id: id,
          produto: String(updated?.prodDesc ?? updated?.descricao ?? body?.prodDesc ?? body?.descricao ?? ''),
          cliente: String(cliNome || ''),
          maquina_perda: maquinaPerda || null,
          maquina_perda_id: maquinaPerdaId || null,
          valor_unitario: Number.isFinite(valorUnit) ? valorUnit : 0,
          qtd_perdida: qtdPerdida,
          valor_perdido: qtdPerdida * (Number.isFinite(valorUnit) ? valorUnit : 0),
          data: hoje,
          mes_referencia: mes,
          emp_id: String(updated?.emp_id ?? updated?.empId ?? body?.emp_id ?? body?.empId ?? ''),
          usuario: req.usuario?.nome || 'sistema',
          obs: 'Ajuste pós-conclusão de OF',
        };

        try {
          const { error } = await supabase.from('caixas_perdidas').insert([payload]);
          if (error) {
            const msg = String(error.message || error).toLowerCase();
            if (!(msg.includes('does not exist') || msg.includes('not exist') || msg.includes('not find') || msg.includes('not found'))) {
              throw error;
            }
          }
        } catch (_) {}

        try {
          await supabase.from('historico_acoes').insert([{
            tipo_acao: 'caixas_perdidas_ajuste',
            descricao: `OF #${String(updated?.of ?? updated?.numero ?? '')}: ajuste de qtd ${qtdAntiga}→${qtdNova}, ${qtdPerdida} cx perdidas`,
            usuario: req.usuario?.nome || 'sistema',
            data_hora: new Date().toISOString(),
          }]);
        } catch (_) {}
      }

      const valorOriginal = Number(ofAtual?.valor_total ?? ofAtual?.valor_venda ?? 0);
      const semValorNoBody = !Object.prototype.hasOwnProperty.call(body, 'valor_total') && !Object.prototype.hasOwnProperty.call(body, 'valor_venda');
      if (semValorNoBody && Number.isFinite(qtdNova) && qtdNova > 0 && Number.isFinite(qtdAntiga) && qtdAntiga > 0 && qtdNova !== qtdAntiga && valorOriginal > 0) {
        const novoValor = Math.round(((qtdNova / qtdAntiga) * valorOriginal) * 100) / 100;
        try {
          const rV = await supabase.from('ofs').update({ valor_total: novoValor, valor_venda: novoValor }).eq('id', id).select('valor_total,valor_venda').maybeSingle();
          if (!rV?.error && updated) { updated.valor_total = rV?.data?.valor_total ?? novoValor; updated.valor_venda = rV?.data?.valor_venda ?? novoValor; }
        } catch (_) {}
      }
    } catch (errCaixas) {
      console.error('[OF PUT] erro ao registrar caixas perdidas:', errCaixas?.message);
    }
    const warnings = (updRes && Array.isArray(updRes.ignoredColumns) && updRes.ignoredColumns.length)
      ? { ignored_columns: updRes.ignoredColumns.slice() }
      : null;
    return res.json({ ok: true, data: updated, ...(warnings ? { warnings } : {}) });
  } catch (e) {
    _logApiError('OFS PUT', req, e, { id: req.params?.id, bodyKeys: Object.keys(req.body || {}), bodySize: _safeJson(req.body || {}).length });
    return res.status(500).json({ ok: false, error: String(e?.message || e), rid: req._rid || null });
  }
});
app.delete('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const now = new Date().toISOString();
    let antes = null;
    try {
      const r0 = await supabase.from('ofs').select('*').eq('id', id).maybeSingle();
      antes = r0?.data || null;
    } catch (_) {}
    const payload = { deleted_at: now, updated_at: now };
    let { data, error } = await supabase.from('ofs').update(payload).eq('id', id).select('*').maybeSingle();
    if (error) {
      const msg = String(error.message || error);
      if (msg.toLowerCase().includes('deleted_at') && (msg.includes('column') || msg.includes('Could not find'))) {
        await deleteOne('ofs', id);
        await logAuditoria('ofs', 'DELETE', id, antes, null, req);
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
    await logAuditoria('ofs', 'DELETE', id, antes, null, req);
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

app.post('/api/of/upload', authMiddleware, ofUpload.single('file'), async (req, res) => {
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
        const r = await q.limit(150);
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

app.get('/api/relatorio/resultado-empresas', authMiddleware, async (req, res) => {
  try {
    const dataInicio = String(req.query.dataInicio || '').trim();
    const dataFim = String(req.query.dataFim || '').trim();
    const empId = String(req.query.empId || '').trim();

    let q = supabase
      .from('ofs')
      .select([
        'id',
        'empresa_id',
        'emp_id',
        'valor_total',
        'valor_venda',
        'qtd',
        'quantidade',
        'qtd_produzida',
        'qtd_perdida',
        'qtd_chapas',
        'chapa_id',
        'status',
        'data_conclusao',
        'deleted_at',
      ].join(','))
      .eq('status', 'Concluído')
      .is('deleted_at', null);

    if (dataInicio) q = q.gte('data_conclusao', dataInicio);
    if (dataFim) q = q.lte('data_conclusao', dataFim + 'T23:59:59');
    if (empId) q = q.eq('emp_id', empId);

    const { data: ofs, error } = await q.limit(5000);
    if (error) return res.status(500).json({ ok: false, error: String(error.message || error) });

    const chapaIds = Array.from(new Set((ofs || [])
      .map((o) => String(o?.chapa_id || '').trim())
      .filter(Boolean)));

    const precoChapa = {};
    if (chapaIds.length > 0) {
      const tableCh = await _chapasPreferV2Table();
      const cols = tableCh === 'chapas_estoque_v2' ? 'id,valor_unitario' : 'id,val,valor_unitario';
      const r = await supabase.from(tableCh).select(cols).in('id', chapaIds);
      if (!r.error) {
        (r.data || []).forEach((row) => {
          const v = tableCh === 'chapas_estoque_v2'
            ? Number(row.valor_unitario || 0)
            : Number((row.valor_unitario ?? row.val) || 0);
          precoChapa[String(row.id)] = Number.isFinite(v) ? v : 0;
        });
      }
    }

    const empresas = {};
    (ofs || []).forEach((of) => {
      const emp = String(of.emp_id || of.empresa_id || 'SEM EMPRESA');
      if (!empresas[emp]) {
        empresas[emp] = {
          emp_id: emp,
          total_ofs: 0,
          valor_faturado: 0,
          caixas_produzidas: 0,
          caixas_perdidas: 0,
          total_chapas: 0,
          valor_chapas: 0,
          lucro_estimado: 0,
        };
      }

      const valor = Number(of.valor_total ?? of.valor_venda ?? 0) || 0;
      const caixasProd = Number(of.qtd_produzida ?? of.qtd ?? of.quantidade ?? 0) || 0;
      const caixasPerd = Number(of.qtd_perdida ?? 0) || 0;
      const qtdCh = Number(of.qtd_chapas ?? 0) || 0;
      const chapaId = String(of.chapa_id || '').trim();
      const vUnitCh = chapaId ? (Number(precoChapa[chapaId] || 0) || 0) : 0;
      const custoCh = qtdCh * vUnitCh;

      empresas[emp].total_ofs += 1;
      empresas[emp].valor_faturado += valor;
      empresas[emp].caixas_produzidas += caixasProd;
      empresas[emp].caixas_perdidas += caixasPerd;
      empresas[emp].total_chapas += qtdCh;
      empresas[emp].valor_chapas += custoCh;
      empresas[emp].lucro_estimado += (valor - custoCh);
    });

    const out = Object.values(empresas).sort((a, b) => String(a.emp_id).localeCompare(String(b.emp_id)));
    return res.json({ ok: true, data: out });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.get('/api/caixas_perdidas', authMiddleware, async (req, res) => {
  try {
    const enrichMaquinas = async (rows) => {
      const list = Array.isArray(rows) ? rows : [];
      const ids = [...new Set(list.map(r => String(r?.maquina_id || r?.maquinaId || '').trim()).filter(Boolean))];
      if (!ids.length) return list;
      const { data: maqs, error: em } = await supabase.from('maquinas').select('id,nome');
      if (em) return list;
      const map = new Map((Array.isArray(maqs) ? maqs : []).map(m => [String(m.id), String(m.nome || '').trim()]));
      return list.map((r) => {
        const mid = String(r?.maquina_id || r?.maquinaId || '').trim();
        const nome = mid ? (map.get(mid) || '') : '';
        const fallback = String(r?.maquina || '').trim();
        const finalNome = nome || fallback;
        return { ...r, maquina: finalNome, maquina_nome: finalNome };
      });
    };

    let q = supabase.from('caixas_perdidas').select('*').order('data', { ascending: false });
    if (req.query.empId) q = q.eq('emp_id', req.query.empId);
    const mes = String(req.query.mes || '').trim();
    if (mes && mes !== 'undefined' && mes !== 'null' && mes.length >= 7) {
      const [ano, mm] = mes.split('-').map(Number);
      if (ano > 2000 && mm >= 1 && mm <= 12) {
        const dtIni = `${mes}-01`;
        const dtFim = new Date(ano, mm, 0).toISOString().slice(0, 10);
        const { data: d1 } = await supabase.from('caixas_perdidas')
          .select('*').eq('mes_referencia', mes)
          .order('data', { ascending: false });
        const { data: d2 } = await supabase.from('caixas_perdidas')
          .select('*').is('mes_referencia', null)
          .gte('data', dtIni).lte('data', dtFim)
          .order('data', { ascending: false });
        const todos = [...(d1 || []), ...(d2 || [])];
        const vistos = new Set();
        const result = todos.filter((r) => {
          if (vistos.has(r.id)) return false;
          vistos.add(r.id);
          return true;
        });
        if (req.query.empId) {
          const filtered = result.filter((r) => r.emp_id === req.query.empId);
          return ok(res, await enrichMaquinas(filtered));
        }
        return ok(res, await enrichMaquinas(result));
      }
    }
    if (req.query.de) q = q.gte('data', req.query.de);
    if (req.query.ate) q = q.lte('data', req.query.ate);
    const { data, error } = await q.limit(1000);
    if (error) {
      const msg = String(error.message || error).toLowerCase();
      if (msg.includes('does not exist') || msg.includes('not exist')) return ok(res, []);
      throw error;
    }
    return ok(res, await enrichMaquinas(data || []));
  } catch (e) { err(res, e); }
});

app.get('/api/admin/corrigir_ofs_concluidas_sem_qtd', requireAdmin, async (req, res) => {
  try {
    const { data: ofs, error } = await supabase
      .from('ofs')
      .select('id,qtd,qtd_pedida,qtd_produzida,status')
      .in('status', ['Concluído', 'Concluido', 'Pedido Pronto'])
      .or('qtd.eq.0,qtd.is.null');
    if (error) return res.status(500).json({ ok: false, error: error.message || String(error) });

    let corrigidas = 0;
    for (const of of (ofs || [])) {
      const qtdAtual = Number(of?.qtd || 0) || 0;
      const qtdCorreta = Number(of?.qtd_pedida || of?.qtd_produzida || 0) || 0;
      if (qtdAtual === 0 && qtdCorreta > 0) {
        const { error: upErr } = await supabase
          .from('ofs')
          .update({ qtd: Math.trunc(qtdCorreta), qtd_produzida: Math.trunc(qtdCorreta) })
          .eq('id', of.id);
        if (!upErr) corrigidas++;
      }
    }
    return res.json({ ok: true, corrigidas });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post('/api/caixas_perdidas', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const hoje = new Date().toISOString().slice(0, 10);
    const mes = new Date().toISOString().slice(0, 7);
    const payload = {
      of_id: b.of_id || null,
      produto: String(b.produto || ''),
      cliente: String(b.cliente || ''),
      maquina: b.maquina != null ? String(b.maquina || '') : undefined,
      maquina_id: b.maquina_id != null ? String(b.maquina_id || '') : undefined,
      valor_unitario: Number(b.valor_unitario || 0),
      qtd_perdida: Math.trunc(Number(b.qtd_perdida || 0)),
      valor_perdido: Number(b.valor_perdido || 0),
      data: b.data || hoje,
      mes_referencia: b.mes_referencia || mes,
      emp_id: b.emp_id || '',
      usuario: b.usuario || req.usuario?.nome || 'sistema',
      obs: b.obs || ''
    };
    if (!payload.maquina) delete payload.maquina;
    if (!payload.maquina_id) delete payload.maquina_id;
    let { data, error } = await supabase.from('caixas_perdidas').insert([payload]).select().single();
    if (error) {
      const msg = String(error.message || error);
      const m = msg.toLowerCase();
      if (m.includes('does not exist') || m.includes('not exist') || m.includes('not find') || m.includes('not found')) {
        return ok(res, { skipped: true, reason: 'table_missing' });
      }
      if (m.includes('column') && (m.includes('maquina') || m.includes('maquina_id'))) {
        const payload2 = { ...payload };
        delete payload2.maquina;
        delete payload2.maquina_id;
        const r2 = await supabase.from('caixas_perdidas').insert([payload2]).select().single();
        if (r2.error) {
          const msg2 = String(r2.error.message || r2.error);
          const m2 = msg2.toLowerCase();
          if (m2.includes('does not exist') || m2.includes('not exist') || m2.includes('not find') || m2.includes('not found')) {
            return ok(res, { skipped: true, reason: 'table_missing' });
          }
          throw r2.error;
        }
        return ok(res, r2.data);
      }
      throw error;
    }
    return ok(res, data);
  } catch (e) { err(res, e); }
});

app.put('/api/caixas_perdidas/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload.id;
    const { data, error } = await supabase
      .from('caixas_perdidas')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.patch('/api/caixas_perdidas/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload.id;
    const { data, error } = await supabase
      .from('caixas_perdidas')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.delete('/api/caixas_perdidas/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('caixas_perdidas').delete().eq('id', req.params.id);
    if (error) {
      const msg = String(error.message || error);
      const m = msg.toLowerCase();
      if (m.includes('does not exist') || m.includes('not exist') || m.includes('not find') || m.includes('not found')) {
        return ok(res, true);
      }
      throw error;
    }
    return ok(res, true);
  } catch (e) { err(res, e); }
});

app.get('/api/amostras', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('amostras').select('*').order('created_at', { ascending: false });
    if (req.query.empId) q = q.eq('emp_id', req.query.empId);
    if (req.query.status) q = q.eq('status', req.query.status);
    if (req.query.cliente_id) q = q.eq('cliente_id', req.query.cliente_id);
    const { data, error } = await q;
    if (error) throw error;
    return ok(res, data || []);
  } catch (e) { return err(res, e); }
});

app.post('/api/amostras', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const payload = {
      cliente_id: b.cliente_id || null,
      cliente_nome: String(b.cliente_nome || b.cliente || ''),
      produto: String(b.produto || ''),
      descricao: String(b.descricao || ''),
      observacoes: String(b.observacoes || b.obs || ''),
      status: String(b.status || 'Pendente'),
      data_pedido: b.data_pedido || null,
      data_entrega: b.data_entrega || null,
      data_aprovacao: b.data_aprovacao || null,
      imagem_url: String(b.imagem_url || b.foto || ''),
      emp_id: String(b.emp_id || b.empId || 'E1'),
      criado_por: req.usuario?.nome || 'sistema',
    };
    const { data, error } = await supabase
      .from('amostras').insert([payload]).select().single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.put('/api/amostras/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    delete payload.id;
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('amostras').update(payload)
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.delete('/api/amostras/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('amostras').delete().eq('id', req.params.id);
    if (error) throw error;
    return ok(res, true);
  } catch (e) { return err(res, e); }
});

app.get('/api/tempos_reais', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('tempos_reais').select('*')
      .order('created_at', { ascending: false });

    if (req.query.maquina_id) q = q.eq('maquina_id', req.query.maquina_id);
    if (req.query.de) q = q.gte('created_at', req.query.de);
    if (req.query.ate) q = q.lte('created_at', req.query.ate);

    const { data, error } = await q;
    if (error) throw error;
    return ok(res, data || []);
  } catch (e) {
    const msg = String(e?.message || e || '').toLowerCase();
    const code = String(e?.code || e?.details?.code || '');
    const isMissing = code === '42P01' || msg.includes('relation') && msg.includes('tempos_reais') && msg.includes('does not exist');
    if (isMissing) {
      if (!globalThis.__temposReaisMissingLogged) {
        globalThis.__temposReaisMissingLogged = true;
        console.warn('[TEMPOS_REAIS] tabela não existe (retornando [])');
      }
      return ok(res, []);
    }
    if (msg.includes('does not exist') || msg.includes('column')) {
      return ok(res, []);
    }
    return err(res, e);
  }
});

app.post('/api/tempos_reais', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const maquina_id = String(b.maquina_id || '').trim();
    if (!maquina_id) return res.status(400).json({ ok: false, error: 'maquina_id obrigatório' });

    let maquina_nome = String(b.maquina_nome || '').trim();
    if (!maquina_nome) {
      try {
        const { data: m, error: em } = await supabase.from('maquinas').select('nome,col').eq('id', maquina_id).maybeSingle();
        if (!em && m) maquina_nome = String(m.nome || m.col || '').trim();
      } catch (_) {}
    }

    const payload = {
      maquina_id,
      maquina_nome: maquina_nome || null,
      of_id: b.of_id || null,
      tipo_caixa: String(b.tipo_caixa || '').trim() || null,
      velocidade_cxh: Number.isFinite(Number(b.velocidade_cxh)) ? Math.trunc(Number(b.velocidade_cxh)) : null,
      quantidade: Number.isFinite(Number(b.quantidade)) ? Math.trunc(Number(b.quantidade)) : null,
      setup_min: Number.isFinite(Number(b.setup_min)) ? Math.trunc(Number(b.setup_min)) : null,
      producao_min: Number.isFinite(Number(b.producao_min)) ? Math.trunc(Number(b.producao_min)) : null,
      data: b.data || null,
      obs: String(b.obs || '').trim() || null,
    };

    const { data, error } = await supabase.from('tempos_reais').insert([payload]).select('*').single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) {
    const msg = String(e?.message || e || '').toLowerCase();
    const code = String(e?.code || e?.details?.code || '');
    const isMissing = code === '42P01' || msg.includes('relation') && msg.includes('tempos_reais') && msg.includes('does not exist');
    if (isMissing) {
      if (!globalThis.__temposReaisMissingLogged) {
        globalThis.__temposReaisMissingLogged = true;
        console.warn('[TEMPOS_REAIS] tabela não existe (skipped)');
      }
      return ok(res, { skipped: true, reason: 'tempos_reais_unavailable' });
    }
    return err(res, e);
  }
});

app.put('/api/tempos_reais/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const payload = { ...(req.body || {}) };
    delete payload.id;
    delete payload.tempo_total_min;
    delete payload.created_at;
    const { data, error } = await supabase
      .from('tempos_reais').update(payload)
      .eq('id', id).select('*').single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) {
    const msg = String(e?.message || e || '').toLowerCase();
    const code = String(e?.code || e?.details?.code || '');
    const isMissing = code === '42P01' || msg.includes('relation') && msg.includes('tempos_reais') && msg.includes('does not exist');
    if (isMissing) {
      if (!globalThis.__temposReaisMissingLogged) {
        globalThis.__temposReaisMissingLogged = true;
        console.warn('[TEMPOS_REAIS] tabela não existe (skipped)');
      }
      return ok(res, { skipped: true, reason: 'tempos_reais_unavailable' });
    }
    return err(res, e);
  }
});

app.delete('/api/tempos_reais/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('tempos_reais').delete().eq('id', req.params.id);
    if (error) throw error;
    return ok(res, true);
  } catch (e) {
    const msg = String(e?.message || e || '').toLowerCase();
    const code = String(e?.code || e?.details?.code || '');
    const isMissing = code === '42P01' || msg.includes('relation') && msg.includes('tempos_reais') && msg.includes('does not exist');
    if (isMissing) {
      if (!globalThis.__temposReaisMissingLogged) {
        globalThis.__temposReaisMissingLogged = true;
        console.warn('[TEMPOS_REAIS] tabela não existe (skipped)');
      }
      return ok(res, { skipped: true, reason: 'tempos_reais_unavailable' });
    }
    return err(res, e);
  }
});

app.patch('/api/ofs/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    try {
      const { data: ofAtual } = await supabase
        .from('ofs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (ofAtual) {
        const body = req.body || {};
        const hasEntrega = Object.prototype.hasOwnProperty.call(body, 'ent') || Object.prototype.hasOwnProperty.call(body, 'data_entrega');
        const hasMaq = Object.prototype.hasOwnProperty.call(body, 'fluxo_maquinas') || Object.prototype.hasOwnProperty.call(body, 'maq');
        if (hasEntrega || hasMaq) {
          const oldEntrega = String(ofAtual?.ent || ofAtual?.data_entrega || '').slice(0, 10);
          const newEntrega = String((body.ent ?? body.data_entrega ?? '') || '').slice(0, 10);
          const oldMaqRaw = ofAtual?.fluxo_maquinas ?? ofAtual?.maq ?? null;
          const newMaqRaw = (Object.prototype.hasOwnProperty.call(body, 'fluxo_maquinas') ? body.fluxo_maquinas : (Object.prototype.hasOwnProperty.call(body, 'maq') ? body.maq : undefined));
          const normMaq = (v) => {
            if (v == null) return '';
            if (Array.isArray(v)) return v.map(x => String(x || '').trim()).filter(Boolean).join(' | ');
            if (typeof v === 'string') {
              const s = v.trim();
              if (!s) return '';
              try {
                const p = JSON.parse(s);
                if (Array.isArray(p)) return p.map(x => String(x || '').trim()).filter(Boolean).join(' | ');
              } catch (_) {}
              return s;
            }
            if (typeof v === 'object') {
              try {
                const p = Array.isArray(v) ? v : Object.values(v);
                return (Array.isArray(p) ? p : []).map(x => String(x || '').trim()).filter(Boolean).join(' | ');
              } catch (_) { return ''; }
            }
            return String(v || '').trim();
          };
          const oldMaq = normMaq(oldMaqRaw);
          const newMaq = newMaqRaw === undefined ? oldMaq : normMaq(newMaqRaw);
          const motivo = String(body?.motivo || body?.motivo_reprogramacao || body?.obs_motivo || '').trim();
          const changedEntrega = hasEntrega && (newEntrega !== oldEntrega);
          const changedMaq = hasMaq && (newMaq !== oldMaq);
          if (changedEntrega || changedMaq) {
            await logAuditoria('ofs', 'REPROGRAMACAO', id, {
              entrega: oldEntrega || null,
              maquinas: oldMaq || null,
            }, {
              entrega: (hasEntrega ? (newEntrega || null) : oldEntrega || null),
              maquinas: (hasMaq ? (newMaq || null) : oldMaq || null),
              motivo: motivo || null,
            }, req);
          }
        }
      }
    } catch (_) {}
    const payload = { ...ofIn(req.body || {}), updated_at: new Date().toISOString() };
    delete payload.id; delete payload.numero; delete payload.of; delete payload.of_num; delete payload.seq;
    const upd = await ofsUpdateWithRetry(id, payload);
    if (upd.error) throw upd.error;
    const data = upd.data;
    try {
      const cliId = String(req.body?.cli_id || req.body?.cliId || '').trim();
      const vendId = String(req.body?.vendedor_id || req.body?.vendId || req.body?.vend_id || '').trim();
      if (cliId && vendId) {
        await supabase.from('clientes').update({ vendedor_id: vendId }).eq('id', cliId).is('vendedor_id', null);
        cacheClearPrefix('clientes_');
      }
    } catch (_) {}
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

app.get('/api/admin/ofs_sem_valor', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ofs')
      .select('id,numero,valor_total,valor_venda,qtd,status')
      .or('valor_total.eq.0,valor_total.is.null')
      .is('deleted_at', null)
      .limit(10);
    if (error) throw error;
    return ok(res, data || []);
  } catch (e) { return err(res, e); }
});

app.patch('/api/ofs/:id/baixa', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });

    const { data: of, error: errOf } = await supabase.from('ofs').select('*').eq('id', id).maybeSingle();
    if (errOf) return res.status(500).json({ ok: false, error: errOf.message || String(errOf) });
    if (!of) return res.status(404).json({ ok: false, error: 'OF não encontrada' });

    const qtdOriginal = Number(of?.qtd || of?.quantidade || 0);
    const valorOriginal = Number(of?.valor_total || of?.valor_venda || 0);

    const concluirTudo = !!(req.body?.concluir_tudo || req.body?.concluirTudo);
    const idx0 = Number(of?.maquina_atual_index != null ? of.maquina_atual_index : 0);
    const idx = Number.isFinite(idx0) && idx0 >= 0 ? idx0 : 0;
    const maqBody = String(req.body?.maquina || req.body?.maq || '').trim();

    let fluxoRaw = of.fluxo_maquinas;
    if (typeof fluxoRaw === 'string') {
      try { fluxoRaw = JSON.parse(fluxoRaw || '[]'); } catch (_) { fluxoRaw = []; }
    }
    const fluxoArr = Array.isArray(fluxoRaw) ? fluxoRaw : [];
    const fluxoNamesFromRaw = (arr) => (arr || []).map((x) => {
      if (x && typeof x === 'object' && !Array.isArray(x)) return String(x.nome || x.maquina || x.name || x.id || '').trim();
      return String(x || '').trim();
    }).filter(Boolean);
    let fluxo = fluxoNamesFromRaw(fluxoArr);
    if (!fluxo.length) {
      const maq = parseFluxo(of.maq);
      fluxo = Array.isArray(maq) ? maq.map((x) => String(x || '').trim()).filter(Boolean) : [];
    }

    const atual0 = fluxo[idx] != null ? String(fluxo[idx]) : '';
    const nextIdx = concluirTudo ? Math.max(fluxo.length, idx + 1) : (idx + 1);
    const proxima = (!concluirTudo && nextIdx < fluxo.length) ? String(fluxo[nextIdx]) : '';
    const concluida = concluirTudo ? true : (fluxo.length === 0 || nextIdx >= fluxo.length);
    const atual = concluirTudo ? (fluxo.length ? String(fluxo[fluxo.length - 1]) : atual0) : atual0;
    const maquinaRef = maqBody || atual0;

    const nowIso = new Date().toISOString();
    const payload = {
      maquina_atual_index: nextIdx,
      status: concluida ? 'Concluído' : 'Em Produção',
      data_conclusao: concluida ? nowIso : undefined,
    };

    const qtdReal = req.body?.qtd_real != null ? Number(req.body.qtd_real) : null;
    if (qtdReal != null && Number.isFinite(qtdReal) && qtdReal > 0) {
      payload.qtd = qtdReal;
      if (valorOriginal > 0 && qtdOriginal > 0 && qtdReal !== qtdOriginal) {
        payload.valor_total = Math.round((qtdReal / qtdOriginal) * valorOriginal * 100) / 100;
        payload.valor_venda = payload.valor_total;
      }
    }

    const isFluxoObj = fluxoArr.some((x) => x && typeof x === 'object' && !Array.isArray(x));
    if (isFluxoObj) {
      const markOne = (row) => {
        if (!(row && typeof row === 'object' && !Array.isArray(row))) return row;
        const nome = String(row.nome || row.maquina || row.name || '').trim();
        if (!nome) return row;
        const ok = maquinaRef ? (nome === maquinaRef) : false;
        if (!ok) return row;
        return { ...row, concluido: true, data_baixa: nowIso };
      };
      const fluxoAtualizado = concluirTudo
        ? fluxoArr.map((row) => (row && typeof row === 'object' && !Array.isArray(row)) ? ({ ...row, concluido: true, data_baixa: nowIso }) : row)
        : fluxoArr.map(markOne);
      payload.fluxo_maquinas = fluxoAtualizado;
    }

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const upd = await ofsUpdateWithRetry(id, payload);
    if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message || String(upd.error) });

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
      ? `OF #${numero} baixada em ${atual || '—'} — CONCLUÍDO ✓`
      : `OF #${numero} baixada em ${atual || '—'} → próxima: ${proxima || '—'}`;

    if (concluida) {
      try {
        const ofRel = (upd && upd.data) ? upd.data : of;
        const mesRef = new Date().toISOString().slice(0, 7);
        await supabase.from('relatorio_producao').insert([{
          mes_referencia: mesRef,
          data: nowIso.slice(0, 10),
          cliente: of.cli_id ?? of.cliente_id ?? of.cliId ?? '',
          produto: of.prodDesc ?? of.prod_desc ?? of.prod ?? of.descricao ?? '',
          quantidade: ofRel.qtd ?? ofRel.quantidade ?? 0,
          valor: ofRel.valor_total ?? ofRel.valor_venda ?? 0,
          maquina: atual || '',
          status: 'Concluído',
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

    const dataOut = upd?.data ? { ...upd.data, ...payload } : { id, ...payload };
    return res.json({ ok: true, data: dataOut, concluida, proxima: proxima || null, status: payload.status });
  } catch (e) {
    const msg = String(e?.message || e);
    return res.status(500).json({ ok: false, error: msg });
  }
});

app.post('/api/ofs/:id/concluir', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const sid = String(id || '').trim();
    if (!sid) return res.status(400).json({ ok: false, error: 'id obrigatório' });

    const body = req.body || {};
    console.log('[CONCLUIR OF] body:', JSON.stringify(body));
    const qtdProduzidaRaw = Number(body.qtd_produzida || body.qtd_real || body.qtdProduzida || body.caixas_produzidas || 0);
    const qtdPerdida = Math.trunc(Number(body.qtd_perdida || body.qtdPerdida || body.caixas_perdidas || 0) || 0);
    if (!Number.isFinite(qtdProduzidaRaw) || qtdProduzidaRaw < 0) return res.status(400).json({ ok: false, error: 'qtd_produzida inválida' });
    if (!Number.isFinite(qtdPerdida) || qtdPerdida < 0) return res.status(400).json({ ok: false, error: 'qtd_perdida inválida' });

    const { data: of, error: errOf } = await supabase.from('ofs').select('*').eq('id', sid).maybeSingle();
    if (errOf) return res.status(500).json({ ok: false, error: errOf.message || String(errOf) });
    if (!of) return res.status(404).json({ ok: false, error: 'OF não encontrada' });

    const qtdPedida = Number(of.qtd_pedida || of.quantidade || of.qtd || 0);
    const qtdProduzida = (Number(qtdProduzidaRaw) || 0) || (Number(qtdPedida) || 0);
    const qtdFinal = (qtdProduzida > 0) ? Math.trunc(qtdProduzida) : Math.trunc(qtdPedida || 0);
    const valorTotalOriginal = Number(of.valor_total || of.valor_venda || 0);
    const excedente = Math.max(0, Math.trunc(qtdFinal) - Math.trunc(qtdPedida || 0));
    let novoValor = valorTotalOriginal;
    if (qtdPedida > 0 && qtdFinal > 0) {
      novoValor = (valorTotalOriginal / qtdPedida) * qtdFinal;
      novoValor = Math.round(novoValor * 100) / 100;
    }

    let fluxoRaw = of.fluxo_maquinas;
    if (typeof fluxoRaw === 'string') {
      try { fluxoRaw = JSON.parse(fluxoRaw || '[]'); } catch (_) { fluxoRaw = []; }
    }
    const fluxoArr = Array.isArray(fluxoRaw) ? fluxoRaw : [];
    const fluxoNamesFromRaw = (arr) => (arr || []).map((x) => {
      if (x && typeof x === 'object' && !Array.isArray(x)) return String(x.nome || x.maquina || x.name || x.id || '').trim();
      return String(x || '').trim();
    }).filter(Boolean);
    let fluxo = fluxoNamesFromRaw(fluxoArr);
    if (!fluxo.length) {
      const maq = parseFluxo(of.maq);
      fluxo = Array.isArray(maq) ? maq.map((x) => String(x || '').trim()).filter(Boolean) : [];
    }

    const nowIso = new Date().toISOString();
    const updateData = {
      status: 'Concluído',
      qtd_produzida: qtdFinal,
      qtd: qtdFinal,
      qtd_perdida: qtdPerdida,
      caixas_excedentes: excedente,
      valor_total: novoValor,
      valor_venda: novoValor,
      data_conclusao: nowIso,
      usuario_conclusao: req.usuario?.nome || 'sistema',
      updated_at: nowIso,
      maquina_atual_index: Math.max(fluxo.length, Number(of.maquina_atual_index || 0) || 0),
    };
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    const fluxoPickMaquina = () => {
      try {
        const fluxoArr2 = parseFluxo(of.fluxo_maquinas || of.maq);
        const idx0 = Number(of.maquina_atual_index || 0);
        const idx = Number.isFinite(idx0) && idx0 >= 0 ? idx0 : 0;
        const pick = (Array.isArray(fluxoArr2) && fluxoArr2.length)
          ? (fluxoArr2[Math.min(idx, fluxoArr2.length - 1)] ?? fluxoArr2[0] ?? null)
          : null;
        if (!pick) return { nome: '', id: '' };
        if (pick && typeof pick === 'object' && !Array.isArray(pick)) {
          const nome = String(pick.nome || pick.col || pick.name || pick.maquina || '').trim();
          const id = String(pick.id || '').trim();
          return { nome, id };
        }
        const s = String(pick || '').trim();
        return isUuid(s) ? { nome: '', id: s } : { nome: s, id: '' };
      } catch (_) {
        return { nome: '', id: '' };
      }
    };

    const mpRaw = body.maquina_perda != null ? String(body.maquina_perda).trim() : '';
    const midRaw = Object.prototype.hasOwnProperty.call(body, 'maquina_perda_id')
      ? (body.maquina_perda_id == null ? '' : String(body.maquina_perda_id || '').trim())
      : '';
    const pickMaq = fluxoPickMaquina();
    const maquinaPerdaNome = mpRaw || (qtdPerdida > 0 ? (pickMaq.nome || '') : '') || String(of.maquina_perda || '').trim();
    const maquinaPerdaId = (midRaw && isUuid(midRaw)) ? midRaw : (qtdPerdida > 0 ? (isUuid(pickMaq.id) ? pickMaq.id : '') : '') || String(of.maquina_perda_id || '').trim();
    updateData.maquina_perda = maquinaPerdaNome || (of.maquina_perda ?? null);
    if (Object.prototype.hasOwnProperty.call(body, 'maquina_perda_id')) updateData.maquina_perda_id = (maquinaPerdaId && isUuid(maquinaPerdaId)) ? maquinaPerdaId : null;
    else updateData.maquina_perda_id = (maquinaPerdaId && isUuid(maquinaPerdaId)) ? maquinaPerdaId : (of.maquina_perda_id ?? null);
    if (body.data_faturamento) {
      updateData.data_faturamento = String(body.data_faturamento).trim();
    }

    const mprodRaw =
      body.maquina_producao != null ? String(body.maquina_producao).trim()
      : (body.maquina_produzida != null ? String(body.maquina_produzida).trim()
      : (body.maquina != null ? String(body.maquina).trim() : ''));

    const isFluxoObj = fluxoArr.some((x) => x && typeof x === 'object' && !Array.isArray(x));
    if (isFluxoObj) {
      updateData.fluxo_maquinas = fluxoArr.map((row) => (row && typeof row === 'object' && !Array.isArray(row)) ? ({ ...row, concluido: true, data_baixa: nowIso }) : row);
    }

    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);
    console.log('[CONCLUIR OF] updateData:', JSON.stringify(updateData));
    const upd = await ofsUpdateWithRetry(sid, updateData);
    if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message || String(upd.error) });

    try {
      const { data: ofVerif } = await supabase
        .from('ofs')
        .select('maquina_perda,qtd_perdida,qtd_produzida')
        .eq('id', sid)
        .maybeSingle();
      console.log('[CONCLUIR VERIFICACAO]', ofVerif);
    } catch (_) {}

    if (qtdPerdida > 0) {
      try {
        let cliNome = '';
        const cliId = String(
          of.cli_id || of.cliente_id || of.cliId || ''
        ).trim();
        if (cliId) {
          try {
            const { data: cliData } = await supabase
              .from('clientes')
              .select('nome')
              .eq('id', cliId)
              .maybeSingle();
            cliNome = String(cliData?.nome || '').trim();
          } catch (_) {}
        }

        let maquinaNome = String(body.maquina_perda || '').trim();
        let maquinaPerdaId = '';
        if (Object.prototype.hasOwnProperty.call(body, 'maquina_perda_id')) maquinaPerdaId = String(body.maquina_perda_id || '').trim();
        if (!maquinaNome || (!maquinaPerdaId || !isUuid(maquinaPerdaId))) {
          const picked = fluxoPickMaquina();
          if (!maquinaNome) maquinaNome = String(picked.nome || '').trim();
          if ((!maquinaPerdaId || !isUuid(maquinaPerdaId)) && isUuid(picked.id)) maquinaPerdaId = picked.id;
        }

        const valorUnit = qtdPedida > 0 ? (valorTotalOriginal / qtdPedida) : 0;
        const payloadPerda = {
          of_id: sid,
          produto: String(of.prodDesc || of.descricao || ''),
          cliente: cliNome || '',
          maquina_perda: maquinaNome || null,
          maquina_perda_id: (maquinaPerdaId && isUuid(maquinaPerdaId)) ? maquinaPerdaId : null,
          valor_unitario: Number.isFinite(valorUnit) ? valorUnit : 0,
          qtd_perdida: qtdPerdida,
          valor_perdido: qtdPerdida * (Number.isFinite(valorUnit) ? valorUnit : 0),
          data: nowIso.slice(0, 10),
          mes_referencia: nowIso.slice(0, 7),
          emp_id: String(of.emp_id || ''),
          usuario: req.usuario?.nome || 'sistema',
          obs: '',
        };

        let tentativa = payloadPerda;
        for (let t = 0; t < 3; t++) {
          const ins = await supabase.from('caixas_perdidas').insert([tentativa]).select().single();
          const perdaErr = ins?.error || null;
          if (!perdaErr) break;
          const msg = String(perdaErr.message || '').toLowerCase();
          if (msg.includes('maquina_perda_id') && msg.includes('column')) { delete tentativa.maquina_perda_id; continue; }
          if (msg.includes('maquina_perda') && msg.includes('column')) { delete tentativa.maquina_perda; continue; }
          if (msg.includes('maquina') && msg.includes('column')) { delete tentativa.maquina_perda; delete tentativa.maquina_perda_id; continue; }
          break;
        }
      } catch (_) {}
    }

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

    const usuario = req.body?.usuario ? String(req.body.usuario) : 'sistema';
    const numero = of.of != null ? of.of : (of.numero != null ? of.numero : '');
    const atual = (Array.isArray(fluxo) && fluxo.length) ? String(fluxo[fluxo.length - 1]) : '';
    const maquinaProducaoOut = mprodRaw || atual || '';
    const msg = `OF #${numero} baixada em ${maquinaProducaoOut || '—'} — CONCLUÍDO ✓`;

    try {
      const ofRel = (upd && upd.data) ? upd.data : of;
      const mesRef = new Date().toISOString().slice(0, 7);
      await supabase.from('relatorio_producao').insert([{
        mes_referencia: mesRef,
        data: nowIso.slice(0, 10),
        cliente: of.cli_id ?? of.cliente_id ?? of.cliId ?? '',
        produto: of.prodDesc ?? of.prod_desc ?? of.prod ?? of.descricao ?? '',
        quantidade: ofRel.qtd ?? ofRel.quantidade ?? 0,
        valor: ofRel.valor_total ?? ofRel.valor_venda ?? 0,
        maquina: maquinaProducaoOut || '',
        status: 'Concluído',
      }]);
    } catch (e) {}

    try {
      await supabase.from('historico_acoes').insert([{
        data_hora: nowIso,
        tipo_acao: 'baixa_of',
        descricao: msg,
        usuario,
      }]);
    } catch (e) {}

    const dataOut = upd?.data ? { ...upd.data, ...updateData } : { id: sid, ...updateData };
    return res.json({
      ok: true,
      data: { ...dataOut, maquina_producao: maquinaProducaoOut || null },
      concluida: true,
      proxima: null,
      status: 'Concluído',
      excedente,
      novo_valor_total: novoValor,
      mensagem: `OF concluída.${excedente > 0 ? (' ' + excedente + ' caixas excedentes.') : ''}`,
    });
  } catch (e) {
    const msg = String(e?.message || e);
    return res.status(500).json({ ok: false, error: msg });
  }
});

app.post('/api/ofs/:id/avancar-etapa', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const sid = String(id || '').trim();
    if (!sid) return res.status(400).json({ ok: false, error: 'id obrigatório' });

    const body = req.body || {};
    const maquinaConcluida = String(body.maquina_concluida || body.maquina || body.maquinaConcluida || '').trim();
    const qtdProduzida = Number(body.qtd_produzida || body.qtd_real || body.qtdProduzida || body.caixas_produzidas || 0);
    const qtdPerdida = Math.trunc(Number(body.qtd_perdida || body.qtdPerdida || body.caixas_perdidas || 0) || 0);
    if (!maquinaConcluida) return res.status(400).json({ ok: false, error: 'maquina_concluida obrigatória' });
    if (!Number.isFinite(qtdProduzida) || qtdProduzida < 0) return res.status(400).json({ ok: false, error: 'qtd_produzida inválida' });
    if (!Number.isFinite(qtdPerdida) || qtdPerdida < 0) return res.status(400).json({ ok: false, error: 'qtd_perdida inválida' });

    const { data: of, error: errOf } = await supabase.from('ofs').select('*').eq('id', sid).maybeSingle();
    if (errOf) return res.status(500).json({ ok: false, error: errOf.message || String(errOf) });
    if (!of) return res.status(404).json({ ok: false, error: 'OF não encontrada' });

    let fluxoRaw = of.fluxo_maquinas;
    if (typeof fluxoRaw === 'string') {
      try { fluxoRaw = JSON.parse(fluxoRaw || '[]'); } catch (_) { fluxoRaw = []; }
    }
    const fluxoArr = Array.isArray(fluxoRaw) ? fluxoRaw : [];
    let fluxo = fluxoArr.map((m) => {
      if (m && typeof m === 'object' && !Array.isArray(m)) {
        return {
          ...m,
          nome: String(m.nome || m.maquina || m.name || m.id || '').trim(),
          concluido: m.concluido === true,
        };
      }
      return { nome: String(m || '').trim(), concluido: false };
    }).filter((m) => m && m.nome);

    if (!fluxo.length) {
      const maq = parseFluxo(of.maq);
      const nomes = (Array.isArray(maq) ? maq : []).map((x) => String(x || '').trim()).filter(Boolean);
      fluxo = nomes.map((n) => ({ nome: n, concluido: false }));
    }

    const nowIso = new Date().toISOString();
    const targetKey = maquinaConcluida.trim().toUpperCase();
    let found = false;
    fluxo = fluxo.map((m) => {
      const nomeKey = String(m.nome || '').trim().toUpperCase();
      if (nomeKey && nomeKey === targetKey) {
        found = true;
        return { ...m, concluido: true, data_baixa: nowIso };
      }
      return m;
    });
    if (!found) return res.status(400).json({ ok: false, error: 'Máquina não encontrada no fluxo' });

    const todasConcluidas = fluxo.length > 0 && fluxo.every((m) => m && m.concluido === true);
    const updateData = {
      fluxo_maquinas: fluxo,
      updated_at: nowIso,
    };

    if (todasConcluidas) {
      updateData.status = 'Concluído';
      updateData.data_conclusao = nowIso;

      if (qtdProduzida > 0) {
        updateData.qtd_produzida = Number(qtdProduzida);
        const qtdOriginal = Number(of.qtd || of.quantidade || of.qtd_pedida || 1);
        const valorOriginal = Number(of.valor_total || of.valor_venda || 0);
        if (qtdOriginal > 0) {
          let novoValor = (valorOriginal / qtdOriginal) * Number(qtdProduzida);
          novoValor = Math.round(novoValor * 100) / 100;
          updateData.valor_total = novoValor;
          updateData.valor_venda = novoValor;
        }
      }
    }

    if (todasConcluidas && qtdPerdida > 0) {
      try {
        await supabase.from('caixas_perdidas').insert([{
          of_id: sid,
          quantidade: Number(qtdPerdida),
          motivo: 'Perda na produção',
          data: nowIso,
          usuario_id: req.usuario?.id || null,
          usuario_nome: req.usuario?.nome || req.usuario?.email || null,
        }]);
      } catch (_) {}
    }

    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);
    const upd = await ofsUpdateWithRetry(sid, updateData);
    if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message || String(upd.error) });

    const maqsRestantes = (fluxo || []).filter((m) => !m.concluido).map((m) => m.nome);
    return res.json({
      ok: true,
      concluida: todasConcluidas,
      maquinas_restantes: maqsRestantes,
      mensagem: todasConcluidas
        ? '✅ OF concluída! Todas as etapas finalizadas.'
        : `✅ ${maquinaConcluida} concluída! Faltam: ${maqsRestantes.join(', ')}`,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message });
  }
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

app.get('/api/roteiro/semana', authMiddleware, async (req, res) => {
  try {
    const empId = String(req.query.emp_id ?? req.query.empId ?? '').trim();
    const { data: roteiro, error: er } = await supabase.from('roteiro_entrega').select('*').eq('ativo', true);
    if (er) throw er;
    const baseQ = () => supabase
      .from('ofs')
      .select('*')
      .is('deleted_at', null)
      .not('status', 'in', '("Concluído","Cancelada","Cancelado")')
      .order('data_entrega', { ascending: true });

    let ofs = null;
    if (empId) {
      let lastErr = null;
      const cols = ['emp_id', 'empId', 'empresa_id', 'empresa'];
      for (const col of cols) {
        const { data, error } = await baseQ().eq(col, empId);
        if (!error) { ofs = data || []; lastErr = null; break; }
        lastErr = error;
        const msg = String(error.message || '');
        const m = msg.match(/column ["\s]*([\w.]+)["\s]* does not exist/i)
          || msg.match(/Could not find the '([\w]+)' column/i);
        const missingCol = m && m[1] ? String(m[1]).split('.').pop() : '';
        if (missingCol && missingCol === col) continue;
        throw error;
      }
      if (lastErr && ofs == null) throw lastErr;
    } else {
      const { data, error: eo } = await baseQ();
      if (eo) throw eo;
      ofs = data || [];
    }

    const { data: clientes, error: ec } = await supabase.from('clientes').select('*').limit(5000);
    if (ec) throw ec;

    const cliMap = new Map((Array.isArray(clientes) ? clientes : []).map((c) => [String(c.id), c]));
    const roteiroMap = new Map((Array.isArray(roteiro) ? roteiro : []).map((r) => [String(r.cidade || '').toLowerCase().trim(), r]));

    const ofsEnriquecidas = (Array.isArray(ofs) ? ofs : [])
      .filter((o) => {
        const dt = String(o.data_entrega ?? o.ent ?? '').slice(0, 10);
        return !!dt;
      })
      .map((o) => {
        const cliId = String(o.cli_id || o.cliente_id || '').trim();
        const cli = cliMap.get(cliId) || null;
        const cidade = String(o.cidade_entrega || cli?.cidade || '').trim();
        const rota = roteiroMap.get(String(cidade || '').toLowerCase().trim()) || null;
        const rua = String(cli?.endereco || cli?.ender || cli?.end || cli?.rua || '').trim();
        const num = String(cli?.numero || cli?.num || '').trim();
        const bairro = String(cli?.bairro || '').trim();
        const cep = String(cli?.cep || '').trim();
        const uf = String(cli?.uf || cli?.estado || '').trim();
        const endParts = [rua, num ? `nº ${num}` : '', bairro, cep, uf].filter(Boolean);
        return {
          ...o,
          cli_id: cliId || o.cli_id || o.cliente_id || null,
          cliente_nome: String(cli?.nome || '').trim(),
          cliente_tel: String(cli?.tel || cli?.telefone || '').trim(),
          cliente_endereco: endParts.join(' · '),
          cidade_entrega: cidade,
          dia_semana: rota?.dia_semana ?? null,
          sem_roteiro: !rota,
        };
      });

    return res.json({ ok: true, data: ofsEnriquecidas, roteiro: Array.isArray(roteiro) ? roteiro : [] });
  } catch (e) {
    return err(res, e);
  }
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
    const cacheKey = '';
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    let selectSlim = 'id,nome,cnpj,tel,email,cidade,estado,vendedor_id,emp_id,ativo,rs,ie,uf,end,ramo,pagto,rep,obs,observacoes,vendedor,vendId,empId';
    for (const col of cols) {
      let localSelect = selectSlim;
      let lastLocalErr = null;
      for (let i = 0; i < 8; i++) {
        let q = supabase.from('clientes').select(localSelect).order('nome');
        if (col) q = q.eq(col, empId);
        if (hasPaging) q = q.range(offset, offset + limit - 1);
        const { data, error } = await q;
        if (!error) {
          const rows = data || [];
          if (!lite) {
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
          return ok(res, trimmed);
        }

        lastLocalErr = error;
        const msg = String(error.message || '');
        const m = msg.match(/column ["\s]*([\w.]+)["\s]* does not exist/i)
          || msg.match(/Could not find the '([\w]+)' column/i);
        const missingCol = m && m[1] ? String(m[1]).split('.').pop() : '';

        if (col && missingCol && missingCol === col) {
          break;
        }

        if (missingCol) {
          localSelect = localSelect.split(',').map(s => s.trim()).filter((c) => c && c !== missingCol).join(',');
          if (!localSelect) break;
          continue;
        }

        if (col && (msg.includes('column') || msg.includes('Could not find'))) {
          break;
        }
        throw error;
      }

      if (lastLocalErr) lastErr = lastLocalErr;
      const msg = String(lastLocalErr?.message || lastLocalErr || '');
      if (col && (msg.includes('column') || msg.includes('Could not find'))) continue;

      if (lastLocalErr) {
        let q2 = supabase.from('clientes').select('*').order('nome');
        if (col) q2 = q2.eq(col, empId);
        if (hasPaging) q2 = q2.range(offset, offset + limit - 1);
        const all = await q2;
        if (!all.error) {
          const rows = all.data || [];
          if (!lite) {
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
          return ok(res, trimmed);
        }
        lastErr = all.error;
      }
      if (lastLocalErr) throw lastLocalErr;
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
    await logAuditoria('clientes', 'INSERT', data?.[0]?.id, null, data?.[0] || null, req);
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/clientes/:id', authMiddleware, async (req, res) => {
  try {
    let antes = null;
    try {
      const r0 = await supabase.from('clientes').select('*').eq('id', String(req.params.id || '').trim()).maybeSingle();
      antes = r0?.data || null;
    } catch (_) {}
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
    await logAuditoria('clientes', 'UPDATE', String(req.params.id || '').trim(), antes, updated, req);
    ok(res, updated);
  } catch (e) { err(res, e); }
});

app.delete('/api/clientes/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });

    const manterParaRaw = (req.query && req.query.manter_para != null) ? req.query.manter_para : (req.body && req.body.manter_para != null ? req.body.manter_para : null);
    const manterPara = String(manterParaRaw || '').trim();
    const manter = (manterPara && manterPara !== id) ? manterPara : '';

    const cols = ['cli_id', 'cliId', 'cliente_id', 'clienteId'];
    const isMissingCol = (err) => {
      const msg = String(err?.message || err || '');
      return msg.includes("Could not find the '") || msg.toLowerCase().includes('column') || msg.toLowerCase().includes('does not exist');
    };

    let hasRefs = false;
    for (const col of cols) {
      try {
        const { data, error } = await supabase.from('ofs').select('id').eq(col, id).limit(1);
        if (error) {
          if (isMissingCol(error)) continue;
          throw error;
        }
        if (Array.isArray(data) && data.length > 0) { hasRefs = true; break; }
      } catch (e) {
        if (isMissingCol(e)) continue;
        throw e;
      }
    }

    if (hasRefs) {
      const alvo = manter ? manter : null;
      let algumUpdate = false;
      let lastConstraintErr = null;

      for (const col of cols) {
        try {
          const { error } = await supabase.from('ofs').update({ [col]: alvo }).eq(col, id);
          if (error) {
            if (isMissingCol(error)) continue;
            lastConstraintErr = error;
            continue;
          }
          algumUpdate = true;
        } catch (e) {
          if (isMissingCol(e)) continue;
          lastConstraintErr = e;
          continue;
        }
      }

      if (!algumUpdate) {
        if (manter) return res.status(400).json({ ok: false, error: 'Não foi possível migrar as OFs deste cliente. Verifique as colunas de cliente na tabela ofs.' });
        if (lastConstraintErr) {
          return res.status(409).json({
            ok: false,
            error: 'Cliente possui OFs vinculadas. Passe manter_para=<id> para migrar antes de excluir.',
            has_ofs: true,
            hint: 'DELETE /api/clientes/' + id + '?manter_para=<id_do_cliente_que_fica>',
          });
        }
      }

      if (manter) {
        try { await supabase.from('orcamentos').update({ cliente_id: manter }).eq('cliente_id', id); } catch (_) {}
        try { await supabase.from('visitas_vendedor').update({ cliente_id: manter }).eq('cliente_id', id); } catch (_) {}
        try {
          await supabase.from('historico_acoes').insert([{
            tipo_acao: 'cliente_deduplicado',
            descricao: `Cliente duplicado excluído (id=${id}), OFs migradas para id=${manter}`,
            usuario: req.usuario?.nome || 'sistema',
            data_hora: new Date().toISOString(),
          }]);
        } catch (_) {}
      }
    }

    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
    cacheClearPrefix('clientes_');
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

app.get('/api/chapas_estoque/:id/detalhes_compra', authMiddleware, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ ok: false, error: 'Chapa não encontrada' });
    const c = _chapasCanonicalFromAny(data, table);
    return ok(res, {
      fornecedor: c.fornecedor || null,
      nomenclatura: c.nomenclatura || null,
      tamanho: c.tamanho || null,
      valor_unitario: Number(c.valor_unitario || 0),
      empresa_vinculada: c.empresa_vinculada || null,
      qual_cnpj: c.qual_cnpj || null,
      nome: c.nome || null,
      categoria: c.categoria || null,
    });
  } catch (e) { err(res, e); }
});

app.get('/api/chapas_estoque/:id/ficha_compra', authMiddleware, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ ok: false, error: 'Chapa não encontrada' });

    const c = _chapasCanonicalFromAny(data, table);
    let ultimoPreco = Number(c.valor_unitario || 0);
    let ultimaNF = String(c.nf || '').trim();
    if (table === 'chapas_estoque_v2') {
      try {
        const { data: movs } = await supabase
          .from('chapas_estoque_movimentos_v2')
          .select('nf,created_at')
          .eq('chapa_id', id)
          .eq('tipo', 'entrada')
          .order('created_at', { ascending: false })
          .limit(1);
        if (Array.isArray(movs) && movs[0]) ultimaNF = String(movs[0].nf || ultimaNF || '').trim();
      } catch (_) {}
    }

    const estoqueMin = Number(c.estoque_minimo || 200);
    const qtdAtual = Number(c.quantidade || 0);
    return ok(res, {
      id: c.id,
      fornecedor: c.fornecedor,
      nomenclatura: c.nomenclatura,
      tamanho: c.tamanho,
      nome: c.nome,
      categoria: c.categoria,
      empresa_vinculada: c.empresa_vinculada,
      qual_cnpj: c.qual_cnpj,
      vincos: c.vincos,
      emp_id: c.emp_id,
      valor_unitario: ultimoPreco,
      ultima_nf: ultimaNF,
      quantidade_atual: qtdAtual,
      estoque_minimo: estoqueMin,
      precisa_repor: qtdAtual < estoqueMin,
      sugestao_compra: Math.max(0, estoqueMin - qtdAtual),
      _preenchimento: {
        fornecedor: c.fornecedor,
        produto: c.nomenclatura,
        tamanho: c.tamanho,
        unidade: 'UN',
        valor_unitario: ultimoPreco,
        nota_fiscal: ultimaNF,
        obs: `Reposição: ${c.nome || c.nomenclatura}`,
        chapa_id: c.id,
        emp_id: c.emp_id,
      },
    });
  } catch (e) { err(res, e); }
});

app.get('/api/chapas_estoque/alertas_reposicao', authMiddleware, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    const empId = req.query.empId ? String(req.query.empId) : '';
    let { data, error } = await supabase.from(table).select('*');
    if (error) return res.status(500).json({ ok: false, error: error.message });
    let rows = (data || []).map((r) => _chapasCanonicalFromAny(r, table));
    if (empId) rows = rows.filter((r) => String(r.emp_id || '').trim() === empId);
    const alertas = rows
      .filter((r) => Number(r.quantidade || 0) < Number(r.estoque_minimo || 200))
      .map((r) => ({ ...r, deficit: Number(r.estoque_minimo || 200) - Number(r.quantidade || 0) }))
      .sort((a, b) => b.deficit - a.deficit);
    return ok(res, alertas);
  } catch (e) { err(res, e); }
});

// ══════════════════════════════════════════════════════════════
// VENDEDORES
// ══════════════════════════════════════════════════════════════
app.get('/api/vendedores', authMiddleware, async (req, res) => {
  try {
    const empId = req.query.empId ? String(req.query.empId) : '';
    const cacheKey = '';
    const cols = empId ? ['empId', 'emp_id', 'empresa', 'empresa_id'] : [null];
    let lastErr = null;
    for (const col of cols) {
      let q = supabase.from('vendedores').select('*').order('nome');
      if (col) q = q.eq(col, empId);
      const { data, error } = await q;
      if (!error) {
        const rows = data || [];
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
    const payload = vendedoresPayload(req.body || {});
    const { data, error } = await vendedoresInsertCompat(payload);
    if (error) throw error;
    cacheClearPrefix('vendedores_');
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/vendedores/:id', authMiddleware, async (req, res) => {
  try {
    const payload = vendedoresPayload({ ...(req.body || {}) });
    delete payload.id;
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    const { data, error } = await vendedoresUpdateCompat(req.params.id, payload);
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
    if (req.query.cliente_id) q = q.eq('cliente_id', String(req.query.cliente_id));
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
    payload.public_token = crypto.randomBytes(24).toString('hex');
    if (b.cliente_id && String(b.cliente_id).match(/^[0-9a-f-]{36}$/i)) payload.cliente_id = b.cliente_id;

    let inserted = await supabase.from('orcamentos').insert([payload]).select().single();
    if (inserted.error) {
      const msg = String(inserted.error.message || inserted.error);
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
        delete payload[col];
        inserted = await supabase.from('orcamentos').insert([payload]).select().single();
      }
    }
    if (inserted.error) return res.status(500).json({ error: inserted.error.message });
    return ok(res, inserted.data);
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
});
app.put('/api/orcamentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const atual = await supabase.from('orcamentos').select('*').eq('id', id).maybeSingle();
    if (atual.error) return res.status(500).json({ error: atual.error.message });
    if (atual.data) {
      try {
        const last = await supabase.from('orcamentos_versoes')
          .select('versao')
          .eq('orcamento_id', id)
          .order('versao', { ascending: false })
          .limit(1)
          .maybeSingle();
        const lastV = Math.trunc(Number(last?.data?.versao || 0) || 0);
        const verRow = {
          orcamento_id: id,
          versao: lastV + 1,
          snapshot: atual.data,
          criado_por: req.usuario?.nome || 'sistema',
        };
        const ins = await supabase.from('orcamentos_versoes').insert([verRow]);
        if (ins.error) {
          const msg = String(ins.error.message || ins.error);
          const m = msg.toLowerCase();
          if (!(m.includes('does not exist') || m.includes('relation') || m.includes('schema cache'))) {
            throw ins.error;
          }
        }
      } catch (_) {}
    }
    const b = req.body || {};
    const updates = {};
    const has = (k) => Object.prototype.hasOwnProperty.call(b, k);
    if (has('medidas') || has('titulo')) updates.titulo = b.medidas ?? b.titulo ?? '';
    if (has('cliente_nome') || has('descricao')) {
      updates.descricao = b.cliente_nome ?? b.descricao ?? '';
      updates.cliente_nome = b.cliente_nome ?? '';
    }
    if (has('medidas')) updates.medidas = b.medidas ?? '';
    if (has('quantidade')) updates.quantidade = b.quantidade ?? 0;
    if (has('onda')) updates.onda = b.onda ?? '';
    if (has('valor_unitario')) updates.valor_unitario = b.valor_unitario ?? 0;
    if (has('valor_total')) updates.valor_total = b.valor_total ?? 0;
    if (has('parametros')) updates.parametros = b.parametros ?? {};
    if (has('resultados')) updates.resultados = b.resultados ?? [];
    if (has('status')) updates.status = b.status ?? atual.data?.status ?? 'Rascunho';
    if (!Object.keys(updates).length) return ok(res, atual.data || null);
    let upd = await supabase.from('orcamentos').update(updates).eq('id', id).select().single();
    if (upd.error) {
      const msg = String(upd.error.message || upd.error);
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && Object.prototype.hasOwnProperty.call(updates, col)) {
        delete updates[col];
        upd = await supabase.from('orcamentos').update(updates).eq('id', id).select().single();
      }
    }
    if (upd.error) return res.status(500).json({ error: upd.error.message });
    return ok(res, upd.data);
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
});
app.delete('/api/orcamentos/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('orcamentos').delete().eq('id', req.params.id);
    if (error) throw error;
    return ok(res, true);
  } catch (e) { return err(res, e); }
});

app.post('/api/orcamentos/:id/token', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const cur = await supabase.from('orcamentos').select('id,public_token').eq('id', id).maybeSingle();
    if (cur.error) return res.status(500).json({ ok: false, error: cur.error.message });
    const existing = String(cur.data?.public_token || '').trim();
    if (existing) return ok(res, { token: existing });
    const token = crypto.randomBytes(24).toString('hex');
    let upd = await supabase.from('orcamentos').update({ public_token: token }).eq('id', id).select('id,public_token').single();
    if (upd.error) {
      const msg = String(upd.error.message || upd.error);
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col === 'public_token') return res.status(400).json({ ok: false, error: 'public_token não disponível' });
      return res.status(500).json({ ok: false, error: upd.error.message });
    }
    return ok(res, { token: String(upd.data?.public_token || token) });
  } catch (e) { return err(res, e); }
});

app.get('/api/orcamentos/:id/versoes', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const r = await supabase.from('orcamentos_versoes')
      .select('*')
      .eq('orcamento_id', id)
      .order('versao', { ascending: false })
      .limit(50);
    if (r.error) {
      const msg = String(r.error.message || r.error);
      const m = msg.toLowerCase();
      if (m.includes('does not exist') || m.includes('relation') || m.includes('schema cache')) return ok(res, []);
      return res.status(500).json({ ok: false, error: r.error.message });
    }
    return ok(res, r.data || []);
  } catch (e) { return err(res, e); }
});

app.post('/api/orcamentos/:id/restaurar', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const versao = Math.trunc(Number(req.body?.versao ?? 0) || 0);
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    if (!(versao > 0)) return res.status(400).json({ ok: false, error: 'versao obrigatória' });

    const cur = await supabase.from('orcamentos').select('*').eq('id', id).maybeSingle();
    if (cur.error) return res.status(500).json({ ok: false, error: cur.error.message });
    if (!cur.data) return res.status(404).json({ ok: false, error: 'Orçamento não encontrado' });

    const v = await supabase.from('orcamentos_versoes').select('*').eq('orcamento_id', id).eq('versao', versao).maybeSingle();
    if (v.error) return res.status(500).json({ ok: false, error: v.error.message });
    if (!v.data) return res.status(404).json({ ok: false, error: 'Versão não encontrada' });

    try {
      const last = await supabase.from('orcamentos_versoes')
        .select('versao')
        .eq('orcamento_id', id)
        .order('versao', { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastV = Math.trunc(Number(last?.data?.versao || 0) || 0);
      await supabase.from('orcamentos_versoes').insert([{
        orcamento_id: id,
        versao: lastV + 1,
        snapshot: cur.data,
        criado_por: req.usuario?.nome || 'sistema',
      }]);
    } catch (_) {}

    const s = (v.data.snapshot && typeof v.data.snapshot === 'object') ? v.data.snapshot : {};
    const updates = {
      titulo: s.titulo ?? '',
      descricao: s.descricao ?? '',
      cliente_nome: s.cliente_nome ?? '',
      medidas: s.medidas ?? '',
      quantidade: s.quantidade ?? 0,
      onda: s.onda ?? '',
      valor_unitario: s.valor_unitario ?? 0,
      valor_total: s.valor_total ?? 0,
      parametros: s.parametros ?? {},
      resultados: s.resultados ?? [],
      status: s.status ?? cur.data.status ?? 'Rascunho',
    };
    const upd = await supabase.from('orcamentos').update(updates).eq('id', id).select().single();
    if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message });
    return ok(res, upd.data);
  } catch (e) { return err(res, e); }
});

app.get('/api/public/orcamentos/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const token = String(req.query.token || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    if (!token) return res.status(401).json({ ok: false, error: 'token obrigatório' });
    const r = await supabase.from('orcamentos').select('*').eq('id', id).maybeSingle();
    if (r.error) return res.status(500).json({ ok: false, error: r.error.message });
    if (!r.data) return res.status(404).json({ ok: false, error: 'Orçamento não encontrado' });
    const curTok = String(r.data.public_token || '').trim();
    if (!curTok || curTok !== token) return res.status(403).json({ ok: false, error: 'token inválido' });
    const o = r.data;
    return res.json({
      ok: true,
      data: {
        id: o.id,
        numero_orcamento: o.numero_orcamento,
        cliente_nome: o.cliente_nome,
        medidas: o.medidas,
        quantidade: o.quantidade,
        onda: o.onda,
        valor_unitario: o.valor_unitario,
        valor_total: o.valor_total,
        resultados: o.resultados,
        emp_id: o.emp_id,
        status: o.status,
        criado_em: o.criado_em,
      },
    });
  } catch (e) { return err(res, e); }
});

app.post('/api/public/orcamentos/:id/resposta', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const token = String(req.query.token || '').trim();
    const acao = String(req.body?.acao || '').trim().toLowerCase();
    const obs = String(req.body?.obs || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    if (!token) return res.status(401).json({ ok: false, error: 'token obrigatório' });
    if (acao !== 'aprovar' && acao !== 'reprovar') return res.status(400).json({ ok: false, error: 'acao inválida' });

    const r = await supabase.from('orcamentos').select('*').eq('id', id).maybeSingle();
    if (r.error) return res.status(500).json({ ok: false, error: r.error.message });
    if (!r.data) return res.status(404).json({ ok: false, error: 'Orçamento não encontrado' });
    const curTok = String(r.data.public_token || '').trim();
    if (!curTok || curTok !== token) return res.status(403).json({ ok: false, error: 'token inválido' });

    const status = acao === 'aprovar' ? 'Aprovado' : 'Reprovado';
    const updates = {
      status,
      public_aprovacao: acao,
      public_aprovacao_em: new Date().toISOString(),
      public_aprovacao_obs: obs || null,
    };
    let upd = await supabase.from('orcamentos').update(updates).eq('id', id).select().single();
    if (upd.error) {
      const msg = String(upd.error.message || upd.error);
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && Object.prototype.hasOwnProperty.call(updates, col)) {
        delete updates[col];
        upd = await supabase.from('orcamentos').update(updates).eq('id', id).select().single();
      }
    }
    if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message });
    return ok(res, true);
  } catch (e) { return err(res, e); }
});

app.get('/orcamento-publico/:id', async (req, res) => {
  const id = String(req.params.id || '').trim();
  const token = String(req.query.token || '').trim();
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.end(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Orçamento</title>
<style>
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0b1220;color:#e5e7eb}
  .wrap{max-width:880px;margin:0 auto;padding:22px}
  .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:16px}
  .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .muted{color:rgba(229,231,235,0.70);font-size:12px}
  .btn{appearance:none;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#e5e7eb;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
  .btn-ok{background:#10b98122;border-color:#10b98166}
  .btn-bad{background:#ef444422;border-color:#ef444466}
  input,textarea{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:10px;color:#e5e7eb;padding:10px 12px}
  textarea{min-height:88px;resize:vertical}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{border:1px solid rgba(255,255,255,0.12);padding:7px 10px}
  th{background:rgba(255,255,255,0.06);text-align:left}
</style></head>
<body>
<div class="wrap">
  <div class="card">
    <div class="row" style="justify-content:space-between">
      <div>
        <div style="font-size:18px;font-weight:900">Orçamento</div>
        <div class="muted" id="sub">Carregando…</div>
      </div>
      <div class="muted">Italy Embalagens</div>
    </div>
    <div style="height:12px"></div>
    <div id="body"></div>
    <div style="height:14px"></div>
    <div class="row">
      <button class="btn btn-ok" id="btnAprovar">Aprovar</button>
      <button class="btn btn-bad" id="btnReprovar">Reprovar</button>
      <span class="muted" id="msg"></span>
    </div>
    <div style="height:10px"></div>
    <div>
      <div class="muted" style="margin-bottom:6px">Observações (opcional)</div>
      <textarea id="obs" placeholder="Escreva aqui…"></textarea>
    </div>
  </div>
</div>
<script>
  const ORC_ID=${JSON.stringify(id)};
  const TOKEN=${JSON.stringify(token)};
  const $=(id)=>document.getElementById(id);
  function fmtR(v){ try{ return 'R$ '+Number(v||0).toFixed(2).replace('.',','); }catch(e){ return 'R$ 0,00'; } }
  function fmtD(s){ if(!s) return '—'; try{ return String(s).slice(0,10).split('-').reverse().join('/'); }catch(e){ return String(s); } }
  async function load(){
    const r = await fetch('/api/public/orcamentos/'+encodeURIComponent(ORC_ID)+'?token='+encodeURIComponent(TOKEN));
    const j = await r.json().catch(()=>null);
    if(!r.ok || !j || j.ok===false){ $('sub').textContent = 'Falha ao carregar'; $('body').innerHTML = '<div class=\"muted\">Token inválido ou orçamento não encontrado.</div>'; return; }
    const o = j.data || {};
    $('sub').textContent = 'Nº '+(o.numero_orcamento||'—')+' · '+(o.cliente_nome||'—')+' · '+fmtD(o.criado_em);
    const linhas = Array.isArray(o.resultados) ? o.resultados : [];
    const tab = linhas.length ? ('<table><thead><tr><th>Onda</th><th>VL Unit.</th><th>Total</th></tr></thead><tbody>'+
      linhas.map(x=>'<tr><td>'+String(x.onda||'—')+'</td><td style=\"text-align:right\">'+fmtR(x.vUnit||x.v_unit||0)+'</td><td style=\"text-align:right\">'+fmtR(x.total||0)+'</td></tr>').join('')+
      '</tbody></table>') : '';
    $('body').innerHTML =
      '<div class=\"row\"><div style=\"flex:1\"><div class=\"muted\">Medidas</div><div style=\"font-weight:900\">'+String(o.medidas||'—')+'</div></div>'+
      '<div><div class=\"muted\">Qtd</div><div style=\"font-weight:900\">'+String(o.quantidade==null?'—':o.quantidade)+'</div></div>'+
      '<div><div class=\"muted\">Onda</div><div style=\"font-weight:900\">'+String(o.onda||'—')+'</div></div></div>'+
      '<div style=\"height:10px\"></div>'+
      '<div class=\"row\"><div><div class=\"muted\">Valor total</div><div style=\"font-size:18px;font-weight:900;color:#10b981\">'+fmtR(o.valor_total||0)+'</div></div>'+
      '<div class=\"muted\">Status: '+String(o.status||'—')+'</div></div>'+
      (tab?('<div style=\"height:12px\"></div>'+tab):'');
  }
  async function send(acao){
    $('msg').textContent = 'Enviando…';
    const r = await fetch('/api/public/orcamentos/'+encodeURIComponent(ORC_ID)+'/resposta?token='+encodeURIComponent(TOKEN), {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ acao, obs: $('obs').value || '' })
    });
    const j = await r.json().catch(()=>null);
    if(!r.ok || !j || j.ok===false){ $('msg').textContent = 'Erro ao enviar'; return; }
    $('msg').textContent = 'Resposta registrada';
    await load();
  }
  $('btnAprovar').onclick = ()=>send('aprovar');
  $('btnReprovar').onclick = ()=>send('reprovar');
  load().catch(()=>{ $('sub').textContent='Falha ao carregar'; });
</script>
</body></html>`);
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
      const m = msg.toLowerCase();
      if (m.includes('does not exist') || m.includes('not exist') || m.includes('not find') || m.includes('not found') || m.includes('schema cache')) {
        cacheSet(cacheKey, []);
        return ok(res, []);
      }
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
    if (cached != null) return ok(res, cached);
    const { data, error } = await supabase.from('maquinas').select('*').order('ordem', { ascending: true });
    if (error) throw error;
    cacheSet('maquinas', data || [], 60 * 1000);
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/maquinas/sugerir', authMiddleware, async (req, res) => {
  try {
    const comprimento = Number(req.body?.comprimento);
    const largura = Number(req.body?.largura);
    const altura = Number(req.body?.altura);
    const onda = String(req.body?.onda || '').trim();
    if (!(comprimento > 0 && largura > 0 && altura > 0)) return res.json({ ok: true, data: [] });

    const { data: maquinasRaw, error } = await supabase
      .from('maquinas')
      .select('id,nome,col,puxada_min,puxada_max,boca_max,ativo,ordem')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .limit(50);
    if (error) throw error;
    const maquinas = (Array.isArray(maquinasRaw) ? maquinasRaw : []).filter(m =>
      m.ativo === true &&
      String(m.nome || '').trim() !== '' &&
      String(m.nome || '').trim() !== 'null'
    );

    const folgaPuxadaBase = 20;
    const folgaBocaBase = 15;
    const ondaNorm = onda.toLowerCase();
    const folgaPuxada = ondaNorm.includes('bc') ? folgaPuxadaBase + 5 : folgaPuxadaBase;
    const folgaBoca = ondaNorm.includes('bc') ? folgaBocaBase + 5 : folgaBocaBase;

    const desenvolvimento = (comprimento + altura) * 2 + folgaPuxada;
    const boca = largura + (altura * 2) + folgaBoca;

    const toNumOrNull = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

    const resultado = (Array.isArray(maquinas) ? maquinas : []).map((m) => {
      const puxMin = toNumOrNull(m.puxada_min);
      const puxMax = toNumOrNull(m.puxada_max);
      const bocaMax = toNumOrNull(m.boca_max);
      const devOk = (puxMin == null || desenvolvimento >= puxMin) && (puxMax == null || desenvolvimento <= puxMax);
      const bocaOk = (bocaMax == null || boca <= bocaMax);

      const compativel = !!(devOk && bocaOk);
      let motivo = null;
      if (!devOk) {
        motivo = `Puxada necessária ${Math.round(desenvolvimento)}mm (limite: ${puxMin != null ? Math.round(puxMin) : '—'}-${puxMax != null ? Math.round(puxMax) : '—'}mm)`;
      } else if (!bocaOk) {
        motivo = `Boca necessária ${Math.round(boca)}mm (máximo: ${bocaMax != null ? Math.round(bocaMax) : '—'}mm)`;
      }

      const folgaPuxadaLivre = puxMax != null ? (puxMax - desenvolvimento) : 999999;
      const folgaBocaLivre = bocaMax != null ? (bocaMax - boca) : 999999;
      const score = (compativel ? 0 : 1_000_000) + Math.max(0, folgaPuxadaLivre) + Math.max(0, folgaBocaLivre);

      return {
        id: m.id,
        nome: m.nome,
        compativel,
        motivo,
        desenvolvimento_necessario: Math.round(desenvolvimento),
        boca_necessaria: Math.round(boca),
        score,
      };
    }).sort((a, b) => {
      if (a.compativel && !b.compativel) return -1;
      if (!a.compativel && b.compativel) return 1;
      return (Number(a.score) || 0) - (Number(b.score) || 0);
    });

    return res.json({ ok: true, data: resultado });
  } catch (e) {
    return err(res, e);
  }
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
      meta_perda_pct: b.meta_perda_pct != null ? Number(b.meta_perda_pct) : undefined,
      descricao: String(b.descricao ?? b.desc ?? '').trim() || null,
      icone: String(b.icone ?? b.ico ?? '').trim() || null,
      horario_inicio: String(b.horario_inicio ?? '').trim() || undefined,
      horario_fim: String(b.horario_fim ?? '').trim() || undefined,
      puxada_min: b.puxada_min != null && Number.isFinite(Number(b.puxada_min)) ? Number(b.puxada_min) : undefined,
      puxada_max: b.puxada_max != null && Number.isFinite(Number(b.puxada_max)) ? Number(b.puxada_max) : undefined,
      boca_max: b.boca_max != null && Number.isFinite(Number(b.boca_max)) ? Number(b.boca_max) : undefined,
      altura_max: b.altura_max != null && Number.isFinite(Number(b.altura_max)) ? Number(b.altura_max) : undefined,
      intervalo_min: b.intervalo_min != null ? Math.trunc(Number(b.intervalo_min) || 0) : undefined,
      intervalo_manha_min: b.intervalo_manha_min != null ? Math.trunc(Number(b.intervalo_manha_min) || 0) : undefined,
      almoco_inicio: String(b.almoco_inicio ?? '').trim() || undefined,
      almoco_min: b.almoco_min != null ? Math.trunc(Number(b.almoco_min) || 0) : undefined,
      intervalo_tarde_min: b.intervalo_tarde_min != null ? Math.trunc(Number(b.intervalo_tarde_min) || 0) : undefined,
      setup_manha_min: b.setup_manha_min != null ? Math.trunc(Number(b.setup_manha_min) || 0) : undefined,
      setup_tarde_min: b.setup_tarde_min != null ? Math.trunc(Number(b.setup_tarde_min) || 0) : undefined,
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
    console.log('[PUT MAQUINA] body recebido:', JSON.stringify(req.body));
    console.log('[PUT MAQUINA] id:', req.params.id);
    const b = req.body || {};
    const payload = {
      nome: b.nome !== undefined || b.col !== undefined || b.name !== undefined ? String(b.nome ?? b.col ?? b.name ?? '').trim() : undefined,
      ordem: b.ordem != null ? Number(b.ordem) : undefined,
      setor: b.setor !== undefined ? (String(b.setor ?? '').trim() || null) : undefined,
      producao: b.producao !== undefined || b.phora !== undefined ? Number(b.producao ?? b.phora ?? 0) : undefined,
      setup_medio: b.setup_medio !== undefined || b.setup !== undefined ? Number(b.setup_medio ?? b.setup ?? 0) : undefined,
      passagem_media: b.passagem_media !== undefined || b.passagem !== undefined ? Number(b.passagem_media ?? b.passagem ?? 0) : undefined,
      meta_perda_pct: b.meta_perda_pct !== undefined ? (b.meta_perda_pct === null ? null : Number(b.meta_perda_pct)) : undefined,
      descricao: b.descricao !== undefined || b.desc !== undefined ? (String(b.descricao ?? b.desc ?? '').trim() || null) : undefined,
      icone: b.icone !== undefined || b.ico !== undefined ? (String(b.icone ?? b.ico ?? '').trim() || null) : undefined,
      horario_inicio: b.horario_inicio !== undefined ? (String(b.horario_inicio ?? '').trim() || null) : undefined,
      horario_fim: b.horario_fim !== undefined ? (String(b.horario_fim ?? '').trim() || null) : undefined,
      puxada_min: b.puxada_min !== undefined && Number.isFinite(Number(b.puxada_min)) ? Number(b.puxada_min) : undefined,
      puxada_max: b.puxada_max !== undefined && Number.isFinite(Number(b.puxada_max)) ? Number(b.puxada_max) : undefined,
      boca_max: b.boca_max !== undefined && Number.isFinite(Number(b.boca_max)) ? Number(b.boca_max) : undefined,
      altura_max: b.altura_max !== undefined && Number.isFinite(Number(b.altura_max)) ? Number(b.altura_max) : undefined,
      intervalo_min: b.intervalo_min !== undefined ? Math.trunc(Number(b.intervalo_min) || 0) : undefined,
      intervalo_manha_min: b.intervalo_manha_min !== undefined ? Math.trunc(Number(b.intervalo_manha_min) || 0) : undefined,
      almoco_inicio: b.almoco_inicio !== undefined ? (String(b.almoco_inicio ?? '').trim() || null) : undefined,
      almoco_min: b.almoco_min !== undefined ? Math.trunc(Number(b.almoco_min) || 0) : undefined,
      intervalo_tarde_min: b.intervalo_tarde_min !== undefined ? Math.trunc(Number(b.intervalo_tarde_min) || 0) : undefined,
      setup_manha_min: b.setup_manha_min !== undefined ? Math.trunc(Number(b.setup_manha_min) || 0) : undefined,
      setup_tarde_min: b.setup_tarde_min !== undefined ? Math.trunc(Number(b.setup_tarde_min) || 0) : undefined,
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

// ══════════════════════════════════════════════════════════════
// TIPOS DE CAIXA
// ══════════════════════════════════════════════════════════════
app.get('/api/tipos_caixa', authMiddleware, async (req, res) => {
  try {
    const emp = String(req.query.emp_id ?? req.query.empId ?? req.usuario?.emp_id ?? req.usuario?.empId ?? '').trim();
    const cacheKey = emp ? `tipos_caixa:${emp}` : 'tipos_caixa:all';
    const cached = cacheGet(cacheKey);
    if (cached) return ok(res, cached);
    let q = supabase.from('tipos_caixa').select('*').order('nome', { ascending: true });
    if (emp) q = q.eq('emp_id', emp);
    const { data, error } = await q;
    if (error) throw error;
    cacheSet(cacheKey, data || []);
    ok(res, data || []);
  } catch (e) { err(res, e); }
});

app.post('/api/tipos_caixa', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const emp = String(b.emp_id ?? b.empId ?? req.usuario?.emp_id ?? req.usuario?.empId ?? 'E1').trim() || 'E1';
    const payload = {
      nome: String(b.nome ?? '').trim(),
      setup_min: b.setup_min != null ? Math.trunc(Number(b.setup_min) || 0) : (b.setup != null ? Math.trunc(Number(b.setup) || 0) : undefined),
      producao_hora: b.producao_hora != null ? Math.trunc(Number(b.producao_hora) || 0) : (b.producao != null ? Math.trunc(Number(b.producao) || 0) : undefined),
      observacoes: String(b.observacoes ?? b.obs ?? '').trim() || null,
      emp_id: emp,
    };
    if (!payload.nome) return res.status(400).json({ ok: false, error: 'nome_obrigatorio' });
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
    const { data, error } = await supabase.from('tipos_caixa').insert([payload]).select();
    if (error) throw error;
    cacheClearPrefix('tipos_caixa:');
    ok(res, data && data[0] ? data[0] : payload);
  } catch (e) { err(res, e); }
});

app.put('/api/tipos_caixa/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id_obrigatorio' });
    const b = req.body || {};
    const payload = {
      nome: b.nome !== undefined ? String(b.nome ?? '').trim() : undefined,
      setup_min: b.setup_min !== undefined || b.setup !== undefined ? Math.trunc(Number(b.setup_min ?? b.setup ?? 0) || 0) : undefined,
      producao_hora: b.producao_hora !== undefined || b.producao !== undefined ? Math.trunc(Number(b.producao_hora ?? b.producao ?? 0) || 0) : undefined,
      observacoes: b.observacoes !== undefined || b.obs !== undefined ? (String(b.observacoes ?? b.obs ?? '').trim() || null) : undefined,
      emp_id: b.emp_id !== undefined || b.empId !== undefined ? (String(b.emp_id ?? b.empId ?? '').trim() || null) : undefined,
    };
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
    const { data, error } = await supabase.from('tipos_caixa').update(payload).eq('id', id).select();
    if (error) throw error;
    cacheClearPrefix('tipos_caixa:');
    ok(res, data && data[0] ? data[0] : { id, ...payload });
  } catch (e) { err(res, e); }
});

app.delete('/api/tipos_caixa/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id_obrigatorio' });
    const { error } = await supabase.from('tipos_caixa').delete().eq('id', id);
    if (error) throw error;
    cacheClearPrefix('tipos_caixa:');
    ok(res, { ok: true });
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
    const payload = comprasPayload(req.body || {});
    const { data, error } = await comprasInsertCompat(payload);
    if (error) throw error;
    ok(res, (data && data[0]) ? data[0] : null);
  } catch (e) { err(res, e); }
});

app.put('/api/compras/:id', async (req, res) => {
  try {
    const payload = comprasPayload({ ...(req.body || {}) });
    delete payload.id;
    const { data, error } = await comprasUpdateCompat(req.params.id, payload);
    if (error) throw error;
    ok(res, (data && data[0]) ? data[0] : null);
  } catch (e) { err(res, e); }
});

app.delete('/api/compras/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('compras').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

app.get('/api/cotacoes', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('cotacoes').select('*').order('created_at', { ascending: false }).limit(100);
    if (req.query.empId) q = q.eq('emp_id', String(req.query.empId));
    const { data, error } = await q;
    if (error) {
      const msg = String(error.message || error);
      const m = msg.toLowerCase();
      if (m.includes('does not exist') || m.includes('relation') || m.includes('schema cache')) return ok(res, []);
      throw error;
    }
    return ok(res, data || []);
  } catch (e) { return err(res, e); }
});

app.post('/api/cotacoes', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const item = String(b.item || '').trim();
    if (!item) return res.status(400).json({ ok: false, error: 'item obrigatório' });
    const quantidade = (b.quantidade == null) ? null : Math.trunc(Number(b.quantidade));
    const fornecedor_ids = Array.isArray(b.fornecedor_ids) ? b.fornecedor_ids : (Array.isArray(b.fornecedores) ? b.fornecedores : null);
    const propostas = Array.isArray(b.propostas) ? b.propostas : null;
    const payload = {
      item,
      quantidade: Number.isFinite(quantidade) ? quantidade : null,
      emp_id: String(b.emp_id || b.empId || req.query.empId || ''),
      fornecedor_ids: fornecedor_ids || null,
      propostas: propostas || null,
      escolhido_fornecedor_id: b.escolhido_fornecedor_id || null,
      criado_por: req.usuario?.nome || 'sistema',
    };
    const { data, error } = await supabase.from('cotacoes').insert([payload]).select().single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.put('/api/cotacoes/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const b = req.body || {};
    const escolhido_fornecedor_id = b.escolhido_fornecedor_id || b.escolhidoFornecedorId || b.escolhido || null;
    const propostas = Array.isArray(b.propostas) ? b.propostas : null;
    const payload = {};
    if (escolhido_fornecedor_id !== undefined) payload.escolhido_fornecedor_id = escolhido_fornecedor_id || null;
    if (propostas !== undefined) payload.propostas = propostas || null;
    if (!Object.keys(payload).length) return res.status(400).json({ ok: false, error: 'nada para atualizar' });
    const { data, error } = await supabase.from('cotacoes').update(payload).eq('id', id).select().single();
    if (error) {
      const msg = String(error.message || error);
      const m = msg.toLowerCase();
      if (m.includes('does not exist') || m.includes('relation') || m.includes('schema cache')) return ok(res, null);
      throw error;
    }
    return ok(res, data || null);
  } catch (e) { return err(res, e); }
});

app.get('/api/avaliacoes_fornecedor/resumo', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('avaliacoes_fornecedor').select('*').order('created_at', { ascending: false }).limit(5000);
    const { data, error } = await q;
    if (error) {
      const msg = String(error.message || error);
      const m = msg.toLowerCase();
      if (m.includes('does not exist') || m.includes('relation') || m.includes('schema cache')) return ok(res, {});
      throw error;
    }
    const out = {};
    (data || []).forEach((r) => {
      const fid = String(r?.fornecedor_id || '').trim();
      if (!fid) return;
      if (!out[fid]) out[fid] = { count: 0, prazo: 0, qualidade: 0, preco: 0 };
      out[fid].count += 1;
      out[fid].prazo += Number(r?.prazo || 0) || 0;
      out[fid].qualidade += Number(r?.qualidade || 0) || 0;
      out[fid].preco += Number(r?.preco || 0) || 0;
    });
    Object.keys(out).forEach((k) => {
      const g = out[k];
      const c = Number(g.count || 0) || 1;
      g.prazo = g.prazo / c;
      g.qualidade = g.qualidade / c;
      g.preco = g.preco / c;
      g.media = (g.prazo + g.qualidade + g.preco) / 3;
    });
    return ok(res, out);
  } catch (e) { return err(res, e); }
});

app.post('/api/avaliacoes_fornecedor', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const fornecedor_id = String(b.fornecedor_id || '').trim();
    if (!fornecedor_id) return res.status(400).json({ ok: false, error: 'fornecedor_id obrigatório' });
    const clamp = (n) => Math.max(1, Math.min(5, Math.trunc(Number(n))));
    const payload = {
      fornecedor_id,
      compra_id: b.compra_id || null,
      prazo: b.prazo != null ? clamp(b.prazo) : null,
      qualidade: b.qualidade != null ? clamp(b.qualidade) : null,
      preco: b.preco != null ? clamp(b.preco) : null,
      criado_por: req.usuario?.nome || 'sistema',
    };
    const { data, error } = await supabase.from('avaliacoes_fornecedor').insert([payload]).select().single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

app.get('/api/fornecedores/:id/precos', authMiddleware, async (req, res) => {
  try {
    const fornId = String(req.params.id || '').trim();
    if (!fornId) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    const { data: forn, error: ef } = await supabase.from('fornecedores').select('id,nome').eq('id', fornId).maybeSingle();
    if (ef) throw ef;
    if (!forn) return res.status(404).json({ ok: false, error: 'Fornecedor não encontrado' });
    const fornNome = String(forn.nome || '').trim().toLowerCase();

    const loadChapas = async (table) => {
      try {
        const { data, error } = await supabase.from(table).select('id,fornecedor,nomenclatura,nom,tamanho,tam,nome');
        if (error) return null;
        return Array.isArray(data) ? data : [];
      } catch (_) { return null; }
    };
    const chapas = (await loadChapas('chapas_estoque_v2')) || (await loadChapas('chapas_estoque')) || [];
    const byId = new Map();
    chapas.forEach((c) => {
      const id = String(c?.id || '').trim();
      if (!id) return;
      const f = String(c?.fornecedor || c?.forn || '').trim().toLowerCase();
      if (!f || f !== fornNome) return;
      const nom = String(c?.nomenclatura || c?.nom || '').trim();
      const tam = String(c?.tamanho || c?.tam || '').trim();
      const nome = String(c?.nome || '').trim();
      const item = [nom, tam].filter(Boolean).join(' ').trim() || nome || 'Chapa';
      byId.set(id, item);
    });
    if (!byId.size) return ok(res, []);

    const loadMovs = async (table) => {
      try {
        const { data, error } = await supabase.from(table).select('chapa_id,created_at,valor_unitario,vunit,val,tipo').eq('tipo', 'entrada').order('created_at', { ascending: false }).limit(5000);
        if (error) return null;
        return Array.isArray(data) ? data : [];
      } catch (_) { return null; }
    };
    const movs = (await loadMovs('chapas_estoque_movimentos_v2')) || (await loadMovs('chapas_estoque_movimentos')) || [];
    const grp = new Map();
    movs.forEach((m) => {
      const cid = String(m?.chapa_id || '').trim();
      if (!cid) return;
      const item = byId.get(cid);
      if (!item) return;
      const vu = Number(m?.valor_unitario ?? m?.vunit ?? m?.val ?? NaN);
      if (!Number.isFinite(vu) || vu < 0) return;
      const t = String(m?.created_at || '').trim();
      if (!t) return;
      if (!grp.has(item)) grp.set(item, []);
      grp.get(item).push({ t, v: vu });
    });
    const out = Array.from(grp.entries()).map(([item, pontos]) => ({
      item,
      pontos: (pontos || []).slice().sort((a, b) => String(a.t).localeCompare(String(b.t))),
    })).sort((a, b) => String(a.item).localeCompare(String(b.item), 'pt-BR'));
    return ok(res, out);
  } catch (e) { return err(res, e); }
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
app.get('/api/inconformidades', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('inconformidades').select('*').order('created_at', { ascending: false });
    if (req.query.cliente_id) q = q.eq('cliente_id', String(req.query.cliente_id));
    if (req.query.empId) q = q.eq('emp_id', String(req.query.empId));
    const { data, error } = await q;
    if (error) {
      const msg = String(error.message || error);
      const m = msg.toLowerCase();
      if (m.includes('does not exist') || m.includes('not exist') || m.includes('not find') || m.includes('not found') || m.includes('schema cache')) {
        return ok(res, []);
      }
      throw error;
    }
    ok(res, data);
  } catch (e) { err(res, e); }
});

app.post('/api/inconformidades', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('inconformidades').insert([req.body]).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.put('/api/inconformidades/:id', authMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body }; delete payload.id;
    const { data, error } = await supabase.from('inconformidades')
      .update(payload).eq('id', req.params.id).select();
    if (error) throw error;
    ok(res, data[0]);
  } catch (e) { err(res, e); }
});

app.delete('/api/inconformidades/:id', authMiddleware, async (req, res) => {
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

const nfeXmlUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

function _asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

function _pick(obj, path, fallback = '') {
  try {
    const parts = String(path || '').split('.');
    let cur = obj;
    for (const p of parts) {
      if (!cur || typeof cur !== 'object') return fallback;
      cur = cur[p];
    }
    if (cur == null) return fallback;
    return cur;
  } catch (_) { return fallback; }
}

function _nfeStr(v) {
  return String(v ?? '').trim();
}

function _nfeNum(v) {
  const s = String(v ?? '').trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function _parseNfeXml(xml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    trimValues: true,
  });
  const j = parser.parse(xml);
  const proc = j?.nfeProc || j?.NfeProc || j?.procNFe || null;
  const NFe = proc?.NFe || j?.NFe || j?.nfe?.NFe || j?.nfe || null;
  const prot = proc?.protNFe || proc?.protNfe || null;
  const infProt = prot?.infProt || prot?.infprot || null;
  const infNFe = NFe?.infNFe || NFe?.infNfe || NFe?.NFe?.infNFe || null;

  const chave =
    _nfeStr(_pick(infProt, 'chNFe', '')) ||
    _nfeStr(_pick(infNFe, '@_Id', '')).replace(/^NFe/i, '');

  const ide = infNFe?.ide || null;
  const emit = infNFe?.emit || null;
  const dest = infNFe?.dest || null;
  const total = infNFe?.total || null;
  const icmsTot = total?.ICMSTot || total?.icmsTot || null;

  const itens = _asArray(infNFe?.det).map((d) => {
    const prod = d?.prod || null;
    return {
      descricao: _nfeStr(prod?.xProd || prod?.xprod || ''),
      quantidade: _nfeNum(prod?.qCom || prod?.qcom || prod?.qTrib || prod?.qtrib || 0),
      valor_unitario: _nfeNum(prod?.vUnCom || prod?.vuncom || prod?.vUnTrib || prod?.vuntrib || 0),
      valor_total: _nfeNum(prod?.vProd || prod?.vprod || 0),
      ncm: _nfeStr(prod?.NCM || prod?.ncm || ''),
      cfop: _nfeStr(prod?.CFOP || prod?.cfop || ''),
    };
  }).filter((x) => x.descricao || x.ncm || x.cfop);

  const dhEmi = _nfeStr(ide?.dhEmi || ide?.dEmi || ide?.demi || '');
  const dataEmissao = dhEmi ? dhEmi.slice(0, 10) : '';

  return {
    chave: chave || '',
    numero: _nfeStr(ide?.nNF || ide?.nnf || ''),
    serie: _nfeStr(ide?.serie || ''),
    data_emissao: dataEmissao || '',
    nome_emitente: _nfeStr(emit?.xNome || emit?.xnome || ''),
    nome_destinatario: _nfeStr(dest?.xNome || dest?.xnome || ''),
    valor_total: _nfeNum(icmsTot?.vNF || icmsTot?.vnf || 0),
    itens,
  };
}

app.post('/api/notas_fiscais/import_xml', authMiddleware, nfeXmlUpload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ ok: false, error: 'Arquivo XML obrigatório' });
    const tipo = String(req.body?.tipo || 'entrada').trim().toLowerCase() === 'saida' ? 'saida' : 'entrada';
    const xml = req.file.buffer.toString('utf8');
    const d = _parseNfeXml(xml);
    if (!d.chave && !d.numero) return res.status(400).json({ ok: false, error: 'XML inválido ou NF-e não encontrada' });

    const payload = {
      chave: d.chave || null,
      num: d.numero || null,
      serie: d.serie || null,
      tipo,
      emit: d.nome_emitente || null,
      dest: d.nome_destinatario || null,
      data: d.data_emissao || null,
      valor: d.valor_total || 0,
      status: 'Importada XML',
      itens: d.itens,
      obs: `Importada via XML em ${new Date().toISOString().slice(0, 10)}`,
    };
    const { data, error } = await supabase.from('notas_fiscais').insert([payload]).select();
    if (error) throw error;
    return ok(res, data?.[0] || null);
  } catch (e) { return err(res, e); }
});

app.post('/api/integracoes/whatsapp/enviar', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const instanceId = String(process.env.ZAPI_INSTANCE_ID || process.env.ZAPI_INSTANCE || '').trim();
    const instanceToken = String(process.env.ZAPI_INSTANCE_TOKEN || process.env.ZAPI_TOKEN || '').trim();
    const clientToken = String(process.env.ZAPI_CLIENT_TOKEN || process.env.ZAPI_SECURITY_TOKEN || '').trim();
    if (!instanceId || !instanceToken) {
      return res.status(400).json({ ok: false, error: 'Z-API não configurado (ZAPI_INSTANCE_ID e ZAPI_INSTANCE_TOKEN)' });
    }
    const phone = String(req.body?.phone || req.body?.to || '').replace(/\D/g, '');
    const message = String(req.body?.message || '').trim();
    if (!phone) return res.status(400).json({ ok: false, error: 'phone obrigatório (somente números, ex: 5511999999999)' });
    if (!message) return res.status(400).json({ ok: false, error: 'message obrigatório' });

    const url = `https://api.z-api.io/instances/${encodeURIComponent(instanceId)}/token/${encodeURIComponent(instanceToken)}/send-text`;
    const headers = { 'Content-Type': 'application/json' };
    if (clientToken) headers['client-token'] = clientToken;

    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ phone, message }) });
    const j = await r.json().catch(() => null);
    if (!r.ok) {
      return res.status(400).json({ ok: false, error: j?.message || j?.error || r.statusText || 'zapi_failed', details: j || null });
    }
    return res.json({ ok: true, data: j });
  } catch (e) { return err(res, e); }
});

let _googleOauthState = null;
let _googleOauthStateExp = 0;

function _googleNewState() {
  _googleOauthState = crypto.randomBytes(18).toString('hex');
  _googleOauthStateExp = Date.now() + 10 * 60 * 1000;
  return _googleOauthState;
}

function _googleEnv() {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const redirectUri = String(process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_OAUTH_REDIRECT_URI || '').trim();
  const calendarId = String(process.env.GOOGLE_CALENDAR_ID || 'primary').trim() || 'primary';
  return { clientId, clientSecret, redirectUri, calendarId };
}

async function _googleGetTokensByCode(code) {
  const { clientId, clientSecret, redirectUri } = _googleEnv();
  if (!clientId || !clientSecret || !redirectUri) throw new Error('google_oauth_env_missing');
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error_description || j?.error || 'google_token_exchange_failed');
  return j;
}

async function _googleAccessTokenByRefresh(refreshToken) {
  const { clientId, clientSecret } = _googleEnv();
  if (!clientId || !clientSecret) throw new Error('google_oauth_env_missing');
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error_description || j?.error || 'google_refresh_failed');
  return j?.access_token || '';
}

app.get('/api/integracoes/google/auth_url', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { clientId, redirectUri } = _googleEnv();
    if (!clientId || !redirectUri) return res.status(400).json({ ok: false, error: 'GOOGLE_CLIENT_ID/GOOGLE_REDIRECT_URI não configurado' });
    const state = _googleNewState();
    const qs = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${qs.toString()}`;
    return res.json({ ok: true, url });
  } catch (e) { return err(res, e); }
});

app.get('/api/integracoes/google/callback', async (req, res) => {
  try {
    const code = String(req.query?.code || '').trim();
    const state = String(req.query?.state || '').trim();
    if (!code) return res.status(400).send('Missing code');
    if (!state || !_googleOauthState || state !== _googleOauthState || Date.now() > _googleOauthStateExp) {
      return res.status(400).send('Invalid state');
    }
    const tok = await _googleGetTokensByCode(code);
    if (!tok.refresh_token) return res.status(400).send('No refresh_token returned (try prompt=consent)');
    await _saveConfigJson('google_calendar', { refresh_token: tok.refresh_token, updated_at: new Date().toISOString() }, null);
    _googleOauthState = null;
    _googleOauthStateExp = 0;
    return res.send('<html><body style="font-family:system-ui;padding:18px"><h2>Conectado ✓</h2><p>Você pode fechar esta aba e voltar para o sistema.</p></body></html>');
  } catch (e) {
    return res.status(500).send(`<html><body style="font-family:system-ui;padding:18px"><h2>Erro</h2><pre>${String(e?.message || e)}</pre></body></html>`);
  }
});

app.get('/api/integracoes/google/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const cfg = await _loadConfigJson('google_calendar', null);
    const has = !!(cfg && cfg.refresh_token);
    const { calendarId, redirectUri } = _googleEnv();
    return res.json({ ok: true, data: { configured: has, calendar_id: calendarId || 'primary', redirect_uri: redirectUri || null } });
  } catch (e) { return err(res, e); }
});

app.post('/api/integracoes/google/evento', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const cfg = await _loadConfigJson('google_calendar', null);
    const refreshToken = String(cfg?.refresh_token || '').trim();
    if (!refreshToken) return res.status(400).json({ ok: false, error: 'Google Calendar não configurado' });
    const { calendarId } = _googleEnv();

    const summary = String(req.body?.summary || '').trim();
    const date = String(req.body?.date || '').slice(0, 10);
    const startTime = String(req.body?.start_time || '08:00').trim() || '08:00';
    const endTime = String(req.body?.end_time || '09:00').trim() || '09:00';
    const description = String(req.body?.description || '').trim() || null;
    if (!summary) return res.status(400).json({ ok: false, error: 'summary obrigatório' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ ok: false, error: 'date inválida (YYYY-MM-DD)' });

    const accessToken = await _googleAccessTokenByRefresh(refreshToken);
    if (!accessToken) return res.status(500).json({ ok: false, error: 'google_access_token_failed' });

    const tz = String(process.env.REPORT_TZ || 'America/Sao_Paulo').trim() || 'America/Sao_Paulo';
    const start = `${date}T${startTime}:00`;
    const end = `${date}T${endTime}:00`;
    const payload = {
      summary,
      description,
      start: { dateTime: start, timeZone: tz },
      end: { dateTime: end, timeZone: tz },
    };
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId || 'primary')}/events`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return res.status(400).json({ ok: false, error: j?.error?.message || 'google_calendar_event_failed', details: j || null });
    return res.json({ ok: true, data: j });
  } catch (e) { return err(res, e); }
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
let _chapasCacheClearedOnBoot = false;
async function _chapasPreferV2Table() {
  const tables = ['chapas_estoque_v2', 'chapas_estoque'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (!error) return t;
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
    const qtd = Math.trunc(_chapasToNum(row.quantidade ?? row.qtd ?? row.quantidade_atual ?? 0, 0));
    const vunit = _chapasToNum(row.valor_unitario ?? row.val ?? row['valor_unitário'] ?? 0, 0);
    const vtot = _chapasToNum(row.valor_total ?? row.vtot ?? 0, 0) || (qtd * vunit);
    const empId = row.emp_id || 'E1';
    const empresaVinculada =
      (row.empresa_vinculada != null && String(row.empresa_vinculada).trim() !== '') ? String(row.empresa_vinculada).trim()
      : ((row.qual_cnpj != null && String(row.qual_cnpj).trim() !== '') ? String(row.qual_cnpj).trim()
      : ((row.qual != null && String(row.qual).trim() !== '') ? String(row.qual).trim()
      : _chapasEmpresaFromEmpId(empId)));
    const canon = {
      id: row.id,
      fornecedor: row.fornecedor || '',
      nomenclatura: row.nomenclatura || '',
      tamanho: row.tamanho || '',
      nome: row.nome_uso || row.nome || '',
      empresa_vinculada: empresaVinculada,
      qual_cnpj: row.qual_cnpj || row.qual || row.fabricante || '',
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
    canon.qtd = canon.quantidade;
    canon.val = canon.valor_unitario;
    canon.forn = canon.fornecedor;
    canon.nom = canon.nomenclatura;
    canon.tam = canon.tamanho;
    canon.qual = canon.qual_cnpj;
    return canon;
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

  const canon = {
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
  canon.qtd = canon.quantidade;
  canon.val = canon.valor_unitario;
  canon.forn = canon.fornecedor;
  canon.nom = canon.nomenclatura;
  canon.tam = canon.tamanho;
  canon.qual = canon.qual_cnpj;
  return canon;
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

function _chapasMovRpcIsSaldoInsuficiente(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return msg.includes('saldo insuficiente');
}

function _chapasMovRpcIsValidacao(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('quantidade inválida') ||
    msg.includes('quantidade invalida') ||
    msg.includes('tipo de movimentação inválido') ||
    msg.includes('tipo de movimentacao invalido') ||
    msg.includes('chapa não encontrada') ||
    msg.includes('chapa nao encontrada')
  );
}

async function _chapasMovimentarV2Rpc(params) {
  const p = params || {};
  const rpcArgs = {
    p_chapa_id: p.chapa_id,
    p_tipo: p.tipo,
    p_quantidade: p.quantidade,
    p_nf: p.nf ?? null,
    p_obs: p.obs ?? null,
    p_origem: p.origem ?? null,
    p_origem_id: p.origem_id ?? null,
    p_usuario: p.usuario ?? null,
    p_emp_id: p.emp_id ?? null,
  };
  return supabase.rpc('movimentar_chapa_estoque_v2', rpcArgs);
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

async function _chapasUpdateCompatV2(id, payload) {
  const p = { ...(payload || {}) };
  const proibidos = ['observacao', 'obs', 'data_entrada', 'obs_chapa', 'retalho', 'retalho_tam', 'retalho_papel'];
  proibidos.forEach((k) => { delete p[k]; });

  let data = null;
  let error = null;
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const r = await supabase.from('chapas_estoque_v2').update(p).eq('id', id).select().maybeSingle();
    data = r?.data || null;
    error = r?.error || null;
    if (!error) break;
    const msg = String(error.message || error);
    const m1 = msg.match(/Could not find the '([^']+)' column/i);
    const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
    const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
    if (col && Object.prototype.hasOwnProperty.call(p, col)) {
      delete p[col];
      continue;
    }
    break;
  }
  return { data, error };
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
    const empId = get(r, ['emp_id', 'emp id', 'empresa_id', 'empresa id', 'empid']);
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
      emp_id: empId,
      data_entrada: dataEntrada,
    };

    if ([fornecedor, nomenclatura, tamanho, nomeUso].every(v => String(v || '').trim() === '')) continue;
    out.push(item);
  }

  return out;
}

app.get('/api/chapas_estoque', authMiddleware, async (req, res) => {
  try {
    if (!_chapasCacheClearedOnBoot || String(req.query.flush_cache || '') === '1') {
      cacheClearPrefix('chapas_');
      cacheClearPrefix('chapas_estoque:');
      _chapasCacheClearedOnBoot = true;
    }
    const _isFiltroVazioChapas = (v) => {
      const s = String(v ?? '').trim().toLowerCase();
      return (
        s === '' ||
        s === 'todos' ||
        s === 'todas' ||
        s === 'todos fornecedores' ||
        s === 'todas empresas' ||
        s === 'todos clientes' ||
        s === 'todas categorias' ||
        s === 'sem filtro' ||
        s === 'all'
      );
    };
    const qEntries = Object.entries(req.query || {}).filter(([_, v]) => !_isFiltroVazioChapas(v));
    const hasFiltros = qEntries.length > 0;
    const limitDb = Math.max(1, Math.min(500, parseInt(String(req.query.limit || ''), 10) || 500));
    const offsetDb = Math.max(0, parseInt(String(req.query.offset || ''), 10) || 0);
    const CACHE_VERSION = 'chapas_v1';
    const cacheKey = hasFiltros
      ? ('chapas_estoque:' + CACHE_VERSION + ':q:' + new URLSearchParams(qEntries.sort((a, b) => String(a[0]).localeCompare(String(b[0])))).toString())
      : ('chapas_estoque:' + CACHE_VERSION + ':all:limit=' + String(limitDb) + ':offset=' + String(offsetDb));
    const cached = cacheGet(cacheKey);
    if (cached != null && !(Array.isArray(cached) && cached.length === 0)) return res.json(cached);
    const applyFilters = (inRows) => {
      let rows = Array.isArray(inRows) ? inRows : [];
      if (!_isFiltroVazioChapas(req.query.empId)) {
        const emp = String(req.query.empId).trim();
        rows = rows.filter(r => String(r.emp_id || '').trim() === emp || String(r.qual_cnpj || '').trim() === emp);
      }
      if (!_isFiltroVazioChapas(req.query.fornecedor)) {
        const f = String(req.query.fornecedor).trim().toLowerCase();
        rows = rows.filter(r => String(r.fornecedor || '').toLowerCase().includes(f));
      }
      if (!_isFiltroVazioChapas(req.query.categoria)) {
        const cat = String(req.query.categoria).trim();
        rows = rows.filter(r => String(r.categoria || '').trim() === cat);
      }
      if (!_isFiltroVazioChapas(req.query.busca)) {
        const b = String(req.query.busca).trim().toLowerCase();
        rows = rows.filter(r => [r.nome, r.nomenclatura, r.fornecedor, r.tamanho, r.nf, r.empresa_vinculada, r.qual_cnpj, r.vincos, r.observacao, r.categoria, r.cliente, r.risca_desc].join(' ').toLowerCase().includes(b));
      }
      if (!_isFiltroVazioChapas(req.query.cliente)) {
        const c = String(req.query.cliente).trim().toLowerCase();
        rows = rows.filter(r => String(r.cliente || '').toLowerCase().includes(c));
      }
      if (!_isFiltroVazioChapas(req.query.nf)) {
        const n = String(req.query.nf).trim().toLowerCase();
        rows = rows.filter(r => String(r.nf || '').toLowerCase().includes(n));
      }
      if (!_isFiltroVazioChapas(req.query.nomenclatura)) {
        const n = String(req.query.nomenclatura).trim().toLowerCase();
        rows = rows.filter(r => String(r.nomenclatura || '').toLowerCase().includes(n));
      }
      if (!_isFiltroVazioChapas(req.query.tamanho)) {
        const t = String(req.query.tamanho).trim().toLowerCase();
        rows = rows.filter(r => String(r.tamanho || '').toLowerCase().includes(t));
      }
      if (!_isFiltroVazioChapas(req.query.empresa_vinculada)) {
        const ev = String(req.query.empresa_vinculada).trim().toLowerCase();
        rows = rows.filter(r => String(r.empresa_vinculada || '').toLowerCase().includes(ev));
      }
      if (req.query.riscadas === '1') rows = rows.filter(r => !!r.riscada);
      if (req.query.com_vincos === '1') rows = rows.filter(r => String(r.vincos || '').trim() !== '');
      if (req.query.baixo === '1') rows = rows.filter(r => (Number(r.quantidade || 0) || 0) < (Number(r.estoque_minimo || 200) || 200));
      if (req.query.sem_estoque === '1') rows = rows.filter(r => (Number(r.quantidade || 0) || 0) <= 0);
      if (!_isFiltroVazioChapas(req.query.cliente_id)) {
        const cid = String(req.query.cliente_id).trim();
        rows = rows.filter(r => String(r.cliente_id || '').trim() === cid);
      }
      return rows;
    };

    const tablesToTry = ['chapas_estoque'];

    let usedTable = 'chapas_estoque';
    let rows = [];
    let lastError = null;

    for (const table of tablesToTry) {
      let sel = '*';
      let data = null;
      let error = null;
      let orderCreatedAt = true;

      for (let tentativa = 0; tentativa < 8; tentativa++) {
        let q = supabase.from(table).select(sel);
        if (orderCreatedAt) q = q.order('created_at', { ascending: false });
        q = q.range(offsetDb, offsetDb + limitDb - 1);
        const r = await q;
        data = r.data;
        error = r.error;
        try{
          if (!error && !globalThis.__chapasSampleLogged) {
            globalThis.__chapasSampleLogged = true;
            console.log('[CHAPAS SAMPLE]', JSON.stringify((data || [])[0]));
          }
        }catch(_){}
        if (!error) break;

        const msg = String(error.message || error);
        if (orderCreatedAt && msg.toLowerCase().includes('created_at') && (msg.includes('does not exist') || msg.includes('Could not find'))) {
          orderCreatedAt = false;
          continue;
        }
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
        lastError = error;
        console.error('[chapas_estoque] erro Supabase table=' + table + ':', JSON.stringify(error));
        continue;
      }

      const canon = (data || []).map((r) => _chapasCanonicalFromAny(r, table));
      const filtered = applyFilters(canon);
      if (filtered.length > 0 || table === tablesToTry[tablesToTry.length - 1]) {
        usedTable = table;
        rows = filtered;
        break;
      }
    }

    if (lastError && rows.length === 0) {
      return res.json([]);
    }

    try { res.setHeader('X-Chapas-Table', usedTable); } catch (_) {}

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

    console.log('[chapas_estoque] OK:', rows.length, 'registros', '| table:', usedTable);
    if (rows.length > 0) cacheSet(cacheKey, rows, 10 * 1000);
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
      const fornecedor = String(b.fornecedor ?? b.forn ?? b.fabricante ?? '').trim();
      const nomenclatura = String(b.nomenclatura ?? b.nom ?? b.codigo ?? b.tipo_papel ?? b.modelo ?? '').trim();
      const tamanho = String(b.tamanho ?? b.tam ?? b.size ?? '').trim().toUpperCase();
      const nomeUso = String(b.nome_uso ?? b.nome ?? b.nomeUso ?? nomenclatura ?? '').trim();
      if (!fornecedor) return res.status(400).json({ ok: false, error: 'Campo obrigatório: fornecedor' });
      if (!nomenclatura) return res.status(400).json({ ok: false, error: 'Campo obrigatório: nomenclatura (ou nom / codigo / tipo_papel)' });
      if (!tamanho) return res.status(400).json({ ok: false, error: 'Campo obrigatório: tamanho (ex: 1200X900)' });
      if (!nomeUso) return res.status(400).json({ ok: false, error: 'Campo obrigatório: nome_uso (ou nome)' });

      const payload = _chapasPayloadV2FromBody({ ...b, fornecedor, nomenclatura, tamanho, nome_uso: nomeUso, nome: nomeUso }, req, false);
      const qtdInicial = Math.trunc(Number(payload.quantidade ?? 0) || 0);
      if (qtdInicial > 0) payload.quantidade = 0;
      let { data, error } = await supabase.from('chapas_estoque_v2').insert([payload]).select().single();
      if (error) {
        const msg = String(error.message || error);
        const col = msg.match(/Could not find the '([^']+)' column/)?.[1];
        if (col && payload[col] !== undefined) {
          const retry = { ...payload };
          delete retry[col];
          const r2 = await supabase.from('chapas_estoque_v2').insert([retry]).select().single();
          data = r2.data;
          error = r2.error;
        }
      }
      if (error) return res.status(500).json({ ok: false, error: error.message });

      cacheClearPrefix('chapas_estoque:');
      await _chapasLogAcao(req, 'estoque_chapas_entrada', `Entrada: ${payload.nome_uso || ''} · ${payload.fornecedor || ''} · ${payload.nomenclatura || ''} · ${payload.tamanho || ''} · qtd=${qtdInicial}`);

      if (qtdInicial > 0) {
        const movRes = await _chapasMovimentarV2Rpc({
          chapa_id: data.id,
          tipo: 'entrada',
          quantidade: qtdInicial,
          nf: payload.nf || null,
          obs: 'Entrada inicial de estoque',
          origem: 'entrada_inicial',
          origem_id: String(data.id),
          usuario: req?.usuario?.nome || 'sistema',
          emp_id: payload.emp_id || null,
        });
        if (movRes?.error) {
          return res.status(500).json({ ok: false, error: movRes.error.message || String(movRes.error) });
        }
        try {
          const r3 = await supabase.from('chapas_estoque_v2').select('*').eq('id', data.id).maybeSingle();
          if (r3?.data) data = r3.data;
        } catch (_) {}
      }

      return res.json({ ok: true, data: _chapasCanonicalFromAny(data, 'chapas_estoque_v2') });
    }

    const fornecedor = String(b.fornecedor ?? b.forn ?? b.fabricante ?? '').trim();
    const nomenclatura = String(b.nomenclatura ?? b.nom ?? b.codigo ?? b.tipo_papel ?? b.modelo ?? '').trim();
    const tamanho = String(b.tamanho ?? b.tam ?? b.size ?? '').trim().toUpperCase();
    const nomeUso = String(b.nome_uso ?? b.nome ?? b.nomeUso ?? nomenclatura ?? '').trim();
    if (!fornecedor) return res.status(400).json({ ok: false, error: 'Campo obrigatório: fornecedor' });
    if (!nomenclatura) return res.status(400).json({ ok: false, error: 'Campo obrigatório: nomenclatura (ou nom / codigo / tipo_papel)' });
    if (!tamanho) return res.status(400).json({ ok: false, error: 'Campo obrigatório: tamanho (ex: 1200X900)' });
    if (!nomeUso) return res.status(400).json({ ok: false, error: 'Campo obrigatório: nome_uso (ou nome)' });

    const payload = {
      forn: fornecedor,
      nom: nomenclatura,
      tam: tamanho,
      nome: nomeUso,
      nome_uso: nomeUso,
      nome_comercial: String(b.nome_comercial ?? b.nomeComercial ?? nomenclatura ?? '').trim(),
      qual: String(b.qual_cnpj ?? b.qual ?? '').trim(),
      qual_cnpj: String(b.qual_cnpj ?? b.qual ?? '').trim(),
      nf: String(b.nf ?? '').trim(),
      numero_nf: String(b.numero_nf ?? b.nf ?? '').trim(),
      qtd: Math.trunc(Number(b.quantidade ?? b.qtd ?? 0)),
      quantidade: Math.trunc(Number(b.quantidade ?? b.qtd ?? 0)),
      quantidade_atual: Math.trunc(Number(b.quantidade_atual ?? b.quantidade ?? b.qtd ?? 0)),
      val: Number(b.valor_unitario ?? b.val ?? 0),
      valor_unitario: Number(b.valor_unitario ?? b.val ?? 0),
      vincos: String(b.vincos ?? '').trim(),
      observacao: String(b.observacao ?? b.obs ?? b.observacoes ?? '').trim(),
      data_entrada: b.data_entrada ?? b.dataEntrada ?? b.entrada_de_dados ?? null,
      emp_id: String(b.emp_id ?? b.empId ?? 'E1').trim(),
      categoria: String(b.categoria ?? 'Estoque Simples').trim(),
    };
    let insPayload = { ...payload };
    let data = null;
    let error = null;
    for (let tentativa = 0; tentativa < 8; tentativa++) {
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
    if (error) return res.status(500).json({ ok: false, error: String(error.message || error) });
    cacheClearPrefix('chapas_estoque:');
    await _chapasLogAcao(req, 'estoque_chapas_entrada', `Entrada (legado): ${payload.nom || ''} · ${payload.forn || ''} · ${payload.tam || ''} · qtd=${payload.qtd ?? 0}`);
    return res.json({ ok: true, data: _chapasCanonicalFromAny(data, 'chapas_estoque') });
  } catch (e) { err(res, e); }
});
app.put('/api/chapas_estoque/:id', authMiddleware, async (req, res) => {
  try {
    const table = await _chapasPreferV2Table();
    const b = req.body || {};

    if (table === 'chapas_estoque_v2') {
      const payload = _chapasPayloadV2FromBody(b, req, true);
      if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
      const { data, error } = await _chapasUpdateCompatV2(String(req.params.id || '').trim(), payload);
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
      await _chapasLogAcao(req, 'estoque_chapas_patch', `Atualização rápida: ${data?.nome_uso || ''} · ${data?.fornecedor || ''} · ${data?.nomenclatura || ''} · ${data?.tamanho || ''} · qtd=${data?.quantidade ?? ''}`);
      return res.json(_chapasCanonicalFromAny(data, 'chapas_estoque_v2'));
    }

    const payload = {};
    if (b.quantidade !== undefined) payload.qtd = Number(b.quantidade);
    if (b.qtd !== undefined) payload.qtd = Number(b.qtd);
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    const { data, error } = await supabase.from('chapas_estoque').update(payload).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    cacheClearPrefix('chapas_estoque:');
    await _chapasLogAcao(req, 'estoque_chapas_patch', `Atualização rápida (legado): ${data?.nom || ''} · ${data?.forn || ''} · ${data?.tam || ''} · qtd=${data?.qtd ?? ''}`);
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

async function _chapasAtualizarQtdEstoqueChapa(chapaId, qtdNova, req, updatedAt) {
  const id = String(chapaId || '').trim();
  const qtd = Math.trunc(Number(qtdNova) || 0);
  const at = updatedAt || new Date().toISOString();
  const usuario = req?.usuario?.nome || 'sistema';

  const tryUpdate = async (table, payload) => {
    let p = { ...(payload || {}) };
    let data = null;
    let error = null;
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const r = await supabase.from(table).update(p).eq('id', id).select('*').maybeSingle();
      data = r?.data || null;
      error = r?.error || null;
      if (!error) break;
      const msg = String(error.message || error);
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && Object.prototype.hasOwnProperty.call(p, col)) {
        delete p[col];
        continue;
      }
      break;
    }
    return { data, error, table };
  };

  const r1 = await tryUpdate('chapas_estoque_v2', {
    qtd_estoque: qtd,
    quantidade: qtd,
    updated_at: at,
    atualizado_por: usuario,
  });
  if (!r1.error && r1.data) return r1;

  const r2 = await tryUpdate('chapas_estoque', {
    qtd_estoque: qtd,
    qtd,
    quantidade: qtd,
    updated_at: at,
  });
  if (!r2.error && r2.data) return r2;

  const error = r1.error || r2.error || new Error('Falha ao atualizar estoque da chapa');
  return { data: null, error, table: r2.table || r1.table || '' };
}

async function verificarEstoqueMinimo(req, canonChapa) {
  try {
    const c = canonChapa && typeof canonChapa === 'object' ? canonChapa : {};
    const chapaId = String(c.id || '').trim();
    if (!chapaId) return;
    const qtd = Math.trunc(Number(c.quantidade ?? c.qtd ?? 0) || 0);
    const min = Math.trunc(Number(c.estoque_minimo ?? c.min ?? 0) || 0);
    if (!(min > 0)) return;
    if (qtd >= min) return;

    const empId = String(c.emp_id || c.empId || '').trim() || null;
    const fornecedorNome = String(c.fornecedor || c.forn || '').trim();
    const nom = String(c.nomenclatura || c.nom || c.nome || '').trim();
    const tam = String(c.tamanho || c.tam || '').trim();
    const item = [nom, tam].filter(Boolean).join(' ').trim() || 'Chapa';
    const qtdSug = Math.max(0, min - qtd);
    if (!(qtdSug > 0)) return;

    let fornecedorId = null;
    if (fornecedorNome) {
      try {
        const { data: f1, error: ef } = await supabase.from('fornecedores').select('id,nome').ilike('nome', fornecedorNome).limit(1);
        if (!ef && Array.isArray(f1) && f1[0]?.id) fornecedorId = String(f1[0].id);
      } catch (_) {}
      if (!fornecedorId) {
        try {
          const { data: fs } = await supabase.from('fornecedores').select('id,nome').order('nome');
          const alvo = fornecedorNome.toLowerCase();
          const hit = (Array.isArray(fs) ? fs : []).find((x) => String(x?.nome || '').trim().toLowerCase() === alvo) || null;
          if (hit?.id) fornecedorId = String(hit.id);
        } catch (_) {}
      }
    }

    let ultimoValorPago = null;
    try {
      const tryTables = ['chapas_estoque_movimentos_v2', 'chapas_estoque_movimentos'];
      for (const t of tryTables) {
        let q = supabase.from(t).select('*').eq('chapa_id', chapaId).eq('tipo', 'entrada').order('created_at', { ascending: false }).limit(1);
        const { data, error } = await q;
        if (error) continue;
        const row = Array.isArray(data) ? data[0] : null;
        const vu = Number(row?.valor_unitario ?? row?.vunit ?? row?.val ?? NaN);
        if (Number.isFinite(vu) && vu > 0) { ultimoValorPago = vu; break; }
      }
    } catch (_) {}
    if (!Number.isFinite(Number(ultimoValorPago))) {
      const vu0 = Number(c.valor_unitario ?? c.val ?? 0);
      ultimoValorPago = Number.isFinite(vu0) ? vu0 : 0;
    }

    try {
      let q = supabase.from('compras').select('id,item,status,emp_id,fornecedor_id').eq('status', 'rascunho').eq('item', item).limit(1);
      if (empId) q = q.eq('emp_id', empId);
      if (fornecedorId) q = q.eq('fornecedor_id', fornecedorId);
      const { data, error } = await q;
      if (!error && Array.isArray(data) && data.length) return;
    } catch (_) {}

    const compraPayload = comprasPayload({
      fornecedor_id: fornecedorId,
      fornecedor: fornecedorNome || undefined,
      item,
      quantidade: qtdSug,
      qtd: qtdSug,
      valor_unitario: ultimoValorPago || 0,
      status: 'rascunho',
      obs: 'Criado automaticamente — estoque mínimo atingido',
      emp_id: empId || undefined,
      data_pedido: new Date().toISOString().slice(0, 10),
      tipo: 'chapas',
    });
    const ins = await comprasInsertCompat(compraPayload);
    if (ins?.error) return;

    try {
      const mensagem = `Rascunho de compra criado automaticamente: ${item}`;
      await supabase.from('notificacoes').insert([{
        mensagem,
        tipo: 'warning',
        lida: false,
        data_hora: new Date().toISOString(),
        criado_por: req?.usuario?.nome || 'sistema',
      }]);
    } catch (_) {}
  } catch (_) {}
}

app.post('/api/chapas_estoque/:id/movimento', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const tipo = String(b.tipo || '').trim().toLowerCase();
    if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
      return res.status(400).json({ ok: false, error: 'Tipo inválido — use: entrada | saida | ajuste' });
    }

    const id = String(req.params.id || '').trim();
    const preferred = await _chapasPreferV2Table();
    const tablesToTry = preferred === 'chapas_estoque_v2'
      ? ['chapas_estoque_v2', 'chapas_estoque']
      : ['chapas_estoque', 'chapas_estoque_v2'];

    let cur = null;
    let table = '';
    for (const t of tablesToTry) {
      const r = await supabase.from(t).select('*').eq('id', id).maybeSingle();
      if (r?.data) { cur = r.data; table = t; break; }
    }
    if (!cur || !table) return res.status(404).json({ ok: false, error: 'Chapa não encontrada' });

    const canonCur = _chapasCanonicalFromAny(cur, table);
    const oldQtd = Number(canonCur.quantidade || 0) || 0;
    const updatedAt = new Date().toISOString();
    let newQtd = oldQtd;
    let deltaAbs = 0;

    if (tipo === 'ajuste') {
      const alvo = Math.trunc(_chapasToNum((b.quantidade ?? b.qtd_nova ?? b.qtd), NaN));
      if (!Number.isFinite(alvo) || alvo < 0) return res.status(400).json({ ok: false, error: 'Quantidade inválida para ajuste' });
      newQtd = alvo;
      deltaAbs = newQtd - oldQtd;
    } else {
      const raw = (b.delta ?? b.quantidade ?? b.qtd);
      deltaAbs = Math.trunc(_chapasToNum(raw, NaN));
      if (!Number.isFinite(deltaAbs) || deltaAbs <= 0) return res.status(400).json({ ok: false, error: 'Quantidade (delta) deve ser um número positivo' });
      newQtd = tipo === 'entrada' ? (oldQtd + deltaAbs) : (oldQtd - deltaAbs);
      if (newQtd < 0) {
        return res.status(409).json({
          ok: false,
          error: 'Saldo insuficiente',
          saldo: oldQtd,
          solicitado: deltaAbs,
        });
      }
    }

    if (table === 'chapas_estoque_v2') {
      if (tipo === 'ajuste' && Math.trunc(Number(deltaAbs) || 0) === 0) {
        return res.json({
          ok: true,
          data: { ...canonCur, _movimento: { tipo, oldQtd, newQtd: oldQtd, delta: 0 } },
          qtd_estoque: Math.trunc(Number(oldQtd) || 0),
          qtd_anterior: Math.trunc(Number(oldQtd) || 0),
          mensagem: `Estoque atualizado: ${Math.trunc(Number(oldQtd) || 0)} → ${Math.trunc(Number(oldQtd) || 0)}`,
        });
      }

      const tipoRpc = tipo === 'ajuste' ? (deltaAbs > 0 ? 'entrada' : 'saida') : tipo;
      const qtdRpc = tipo === 'ajuste' ? Math.abs(Math.trunc(Number(deltaAbs) || 0)) : Math.abs(Math.trunc(Number(deltaAbs) || 0));
      const obs = (b.obs != null && String(b.obs).trim() !== '')
        ? String(b.obs).trim()
        : (tipo === 'ajuste' ? `Ajuste de estoque (alvo=${Math.trunc(Number(newQtd) || 0)})` : null);
      const origem = (b.origem != null && String(b.origem).trim() !== '') ? String(b.origem).trim() : (tipo === 'ajuste' ? 'ajuste' : 'manual');
      const origemId = (b.origem_id != null && String(b.origem_id).trim() !== '') ? String(b.origem_id).trim() : null;
      const movRes = await _chapasMovimentarV2Rpc({
        chapa_id: id,
        tipo: tipoRpc,
        quantidade: qtdRpc,
        nf: (b.nf != null && String(b.nf).trim() !== '') ? String(b.nf).trim() : null,
        obs,
        origem,
        origem_id: origemId,
        usuario: req?.usuario?.nome || 'sistema',
        emp_id: canonCur.emp_id || null,
      });

      if (movRes?.error) {
        if (_chapasMovRpcIsSaldoInsuficiente(movRes.error)) return res.status(409).json({ ok: false, error: 'Saldo insuficiente' });
        if (_chapasMovRpcIsValidacao(movRes.error)) return res.status(400).json({ ok: false, error: movRes.error.message || String(movRes.error) });
        return res.status(500).json({ ok: false, error: movRes.error.message || String(movRes.error) });
      }

      const updCompat = await _chapasAtualizarQtdEstoqueChapa(id, newQtd, req, updatedAt);
      if (updCompat?.error) return res.status(500).json({ ok: false, error: String(updCompat.error.message || updCompat.error) });

      if (b.nf != null && String(b.nf).trim() !== '') {
        try {
          await supabase.from('chapas_estoque_v2').update({ nf: String(b.nf).trim(), atualizado_por: req?.usuario?.nome || 'sistema' }).eq('id', id).select('id').maybeSingle();
        } catch (_) {}
      }

      cacheClearPrefix('chapas_estoque:');

      const updRow = updCompat?.data || null;
      const canonUpd = updRow ? _chapasCanonicalFromAny(updRow, 'chapas_estoque_v2') : { ...canonCur, quantidade: Math.trunc(Number(newQtd) || 0) };

      const deltaTxt = tipo === 'ajuste' ? `de ${oldQtd} para ${newQtd}` : `${tipo === 'entrada' ? '+' : '-'}${Math.abs(deltaAbs)}`;
      const desc = `Estoque chapas: ${tipo.toUpperCase()} ${deltaTxt} · ${canonUpd.nome || ''} · ${canonUpd.fornecedor || ''} · ${canonUpd.nomenclatura || ''} · ${canonUpd.tamanho || ''}`.trim();
      await _chapasLogAcao(req, `estoque_${tipo}`, desc);

      const qtdOut = Math.trunc(Number(canonUpd.quantidade || newQtd) || 0);
      await logAuditoria('chapas_estoque_v2', 'MOVIMENTO', id, { qtd_anterior: oldQtd }, { qtd_nova: qtdOut, tipo, obs: String(b.obs || '').trim() }, req);
      return res.json({
        ok: true,
        data: { ...canonUpd, _movimento: { tipo, oldQtd, newQtd: Number(canonUpd.quantidade || newQtd) || newQtd, delta: deltaAbs } },
        qtd_estoque: qtdOut,
        qtd_anterior: Math.trunc(Number(oldQtd) || 0),
        mensagem: `Estoque atualizado: ${Math.trunc(Number(oldQtd) || 0)} → ${qtdOut}`,
      });
    }

    const patch = table === 'chapas_estoque_v2'
      ? { quantidade: newQtd, atualizado_por: req?.usuario?.nome || 'sistema' }
      : { qtd: newQtd };

    if (b.nf) {
      if (table === 'chapas_estoque_v2') patch.nf = String(b.nf).trim();
      else patch.nf = String(b.nf).trim();
    }
    if (tipo === 'entrada' && b.valor_unitario != null) {
      const vu = Number(String(b.valor_unitario).replace(',', '.'));
      if (Number.isFinite(vu) && vu >= 0) {
        if (table === 'chapas_estoque_v2') patch.valor_unitario = vu;
        else patch.val = vu;
      }
    }

    if (table === 'chapas_estoque_v2') {
      patch.qtd_estoque = Math.trunc(Number(newQtd) || 0);
      patch.updated_at = updatedAt;
    } else {
      patch.qtd_estoque = Math.trunc(Number(newQtd) || 0);
      patch.updated_at = updatedAt;
    }

    let upd = null;
    let updErr = null;
    {
      let p2 = { ...patch };
      for (let i = 0; i < 3; i++) {
        const r = await supabase.from(table).update(p2).eq('id', id).select().maybeSingle();
        upd = r?.data || null;
        updErr = r?.error || null;
        if (!updErr) break;
        const msg = String(updErr.message || '');
        const m = msg.match(/Could not find the '([^']+)' column/);
        if (m && m[1] && p2[m[1]] !== undefined) {
          delete p2[m[1]];
          continue;
        }
        break;
      }
    }
    if (updErr) return res.status(500).json({ ok: false, error: updErr.message });
    cacheClearPrefix('chapas_estoque:');

    const updCompat2 = await _chapasAtualizarQtdEstoqueChapa(id, newQtd, req, updatedAt);
    if (updCompat2?.error) return res.status(500).json({ ok: false, error: String(updCompat2.error.message || updCompat2.error) });
    const finalRow = updCompat2?.data || upd || cur;
    const finalTable = updCompat2?.data ? updCompat2.table : table;
    const canonUpd = _chapasCanonicalFromAny(finalRow || {}, finalTable);
    const deltaTxt = tipo === 'ajuste' ? `de ${oldQtd} para ${newQtd}` : `${tipo === 'entrada' ? '+' : '-'}${Math.abs(deltaAbs)}`;
    const desc = `Estoque chapas: ${tipo.toUpperCase()} ${deltaTxt} · ${canonUpd.nome || ''} · ${canonUpd.fornecedor || ''} · ${canonUpd.nomenclatura || ''} · ${canonUpd.tamanho || ''}`.trim();
    await _chapasLogAcao(req, `estoque_${tipo}`, desc);

    if (table === 'chapas_estoque_v2') {
      const delta = tipo === 'entrada'
        ? Math.abs(deltaAbs)
        : (tipo === 'saida' ? -Math.abs(deltaAbs) : Math.trunc((Number(newQtd) || 0) - (Number(oldQtd) || 0)));
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
        valor_unitario: (tipo === 'entrada' ? Number(String(b.valor_unitario ?? canonUpd.valor_unitario ?? canonUpd.val ?? 0).replace(',', '.')) : null),
      };
      try {
        await supabase.from('chapas_estoque_movimentos_v2').insert([mov]);
      } catch (_) {}
    }
    if (table !== 'chapas_estoque_v2') {
      const delta = tipo === 'entrada'
        ? Math.abs(deltaAbs)
        : (tipo === 'saida' ? -Math.abs(deltaAbs) : Math.trunc((Number(newQtd) || 0) - (Number(oldQtd) || 0)));
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
        valor_unitario: (tipo === 'entrada' ? Number(String(b.valor_unitario ?? canonUpd.valor_unitario ?? canonUpd.val ?? 0).replace(',', '.')) : null),
      };
      try {
        await supabase.from('chapas_estoque_movimentos').insert([mov]);
      } catch (_) {}
    }

    const qtdOut = Math.trunc(Number(canonUpd.quantidade || canonUpd.qtd || newQtd) || 0);
    await logAuditoria(String(finalTable || table), 'MOVIMENTO', id, { qtd_anterior: oldQtd }, { qtd_nova: qtdOut, tipo, obs: String(b.obs || '').trim() }, req);
    try {
      const reduziu = (tipo === 'saida') || (tipo === 'ajuste' && Math.trunc(Number(newQtd) || 0) < Math.trunc(Number(oldQtd) || 0));
      if (reduziu) await verificarEstoqueMinimo(req, canonUpd);
    } catch (_) {}
    return res.json({
      ok: true,
      data: { ...canonUpd, _movimento: { tipo, oldQtd, newQtd, delta: deltaAbs } },
      qtd_estoque: qtdOut,
      qtd_anterior: Math.trunc(Number(oldQtd) || 0),
      mensagem: `Estoque atualizado: ${Math.trunc(Number(oldQtd) || 0)} → ${qtdOut}`,
    });
  } catch (e) { err(res, e); }
});

app.get('/api/chapas_estoque/metricas', authMiddleware, async (req, res) => {
  try {
    const months = Math.max(1, Math.min(12, Math.trunc(_chapasToNum(req.query.months, 3))));
    const empId = String(req.query.empId || '').trim();
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - months);
    const startIso = start.toISOString();

    const sumSaidas = new Map();
    const ultimoPreco = new Map();
    const ultimoPrecoData = new Map();

    const fetchPaged = async (table, builderFn) => {
      const pageSize = 1000;
      for (let page = 0; page < 30; page++) {
        let q = builderFn(supabase.from(table).select('*'));
        q = q.range(page * pageSize, page * pageSize + pageSize - 1);
        const { data, error } = await q;
        if (error) return { ok: false, error };
        const rows = Array.isArray(data) ? data : [];
        if (!rows.length) return { ok: true, done: true };
        const done = rows.length < pageSize;
        return { ok: true, rows, done, nextPage: page + 1, pageSize };
      }
      return { ok: true, done: true };
    };

    const loadSaidas = async (table) => {
      const pageSize = 1000;
      for (let page = 0; page < 30; page++) {
        let q = supabase.from(table).select('chapa_id,delta,tipo,created_at,emp_id').order('created_at', { ascending: false });
        q = q.eq('tipo', 'saida').gte('created_at', startIso);
        if (empId) q = q.eq('emp_id', empId);
        q = q.range(page * pageSize, page * pageSize + pageSize - 1);
        const { data, error } = await q;
        if (error) return { ok: false, error };
        const rows = Array.isArray(data) ? data : [];
        for (const r of rows) {
          const id = String(r?.chapa_id || '').trim();
          if (!id) continue;
          const d = Math.abs(Math.trunc(Number(r?.delta || 0) || 0));
          if (!(d > 0)) continue;
          sumSaidas.set(id, (sumSaidas.get(id) || 0) + d);
        }
        if (rows.length < pageSize) return { ok: true };
      }
      return { ok: true };
    };

    const loadUltimosPrecos = async (table) => {
      const pageSize = 1000;
      for (let page = 0; page < 20; page++) {
        let q = supabase.from(table).select('*').order('created_at', { ascending: false }).eq('tipo', 'entrada');
        if (empId) q = q.eq('emp_id', empId);
        q = q.range(page * pageSize, page * pageSize + pageSize - 1);
        const { data, error } = await q;
        if (error) return { ok: false, error };
        const rows = Array.isArray(data) ? data : [];
        for (const r of rows) {
          const id = String(r?.chapa_id || '').trim();
          if (!id || ultimoPreco.has(id)) continue;
          const vu = Number(r?.valor_unitario ?? r?.valor ?? r?.vunit ?? r?.val ?? NaN);
          if (Number.isFinite(vu) && vu >= 0) {
            ultimoPreco.set(id, vu);
            if (r?.created_at) ultimoPrecoData.set(id, String(r.created_at));
          }
        }
        if (rows.length < pageSize) return { ok: true };
      }
      return { ok: true };
    };

    const tryTables = ['chapas_estoque_movimentos_v2', 'chapas_estoque_movimentos'];
    let loadedAny = false;
    for (const t of tryTables) {
      try {
        const s = await loadSaidas(t);
        if (!s.ok) continue;
        const p = await loadUltimosPrecos(t);
        if (!p.ok) continue;
        loadedAny = true;
        break;
      } catch (_) {}
    }

    if (!loadedAny) return ok(res, {});

    const out = {};
    const keys = new Set([...sumSaidas.keys(), ...ultimoPreco.keys()]);
    keys.forEach((id) => {
      const totalSaidas = Math.trunc(Number(sumSaidas.get(id) || 0) || 0);
      out[id] = {
        consumo_ultimos_meses: totalSaidas,
        consumo_medio_mes: totalSaidas / months,
        ultimo_preco: ultimoPreco.has(id) ? Number(ultimoPreco.get(id)) : null,
        ultimo_preco_data: ultimoPrecoData.get(id) || null,
      };
    });
    return ok(res, out);
  } catch (e) {
    _logApiError('CHAPAS_METRICAS', req, e);
    return res.status(500).json({ ok: false, error: String(e?.message || e), rid: req._rid || null });
  }
});

app.get('/api/chapas_estoque_movimentos', authMiddleware, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(150, Math.trunc(_chapasToNum(req.query.limit, 120))));
    const chapaId = String(req.query.chapa_id || '').trim();
    const tipo = String(req.query.tipo || '').trim().toLowerCase();
    const empId = String(req.query.empId || '').trim();
    const de = String(req.query.de || '').trim();
    const ate = String(req.query.ate || '').trim();
    const isIsoDate = (s) => /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(s || '').trim());
    const deIso = isIsoDate(de) ? `${de}T00:00:00.000Z` : '';
    const ateIso = isIsoDate(ate) ? `${ate}T23:59:59.999Z` : '';

    let movs = null;
    let movErr = null;
    try {
      let q = supabase.from('chapas_estoque_movimentos_v2').select('*').order('created_at', { ascending: false }).limit(limit);
      if (chapaId) q = q.eq('chapa_id', chapaId);
      if (tipo) q = q.eq('tipo', tipo);
      if (empId) q = q.eq('emp_id', empId);
      if (deIso) q = q.gte('created_at', deIso);
      if (ateIso) q = q.lte('created_at', ateIso);
      const r = await q;
      movs = r?.data || [];
      movErr = r?.error || null;
      if (!movErr && Array.isArray(movs) && movs.length > 0) return ok(res, movs);
    } catch (e) {
      movErr = e;
    }

    if (movErr || !Array.isArray(movs) || movs.length === 0) {
      const tipos = ['estoque_entrada', 'estoque_saida', 'estoque_ajuste', 'estoque_manual', 'estoque_chapas_patch', 'baixa_of'];
      let qh = supabase
        .from('historico_acoes')
        .select('*')
        .in('tipo_acao', tipos)
        .order('data_hora', { ascending: false })
        .limit(limit);
      if (deIso) qh = qh.gte('data_hora', deIso);
      if (ateIso) qh = qh.lte('data_hora', ateIso);
      const { data: hist, error: histErr } = await qh;

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

app.delete('/api/chapas_estoque_movimentos', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const preferred = await _chapasPreferV2Table();
    if (preferred !== 'chapas_estoque_v2') return res.status(400).json({ ok: false, error: 'Movimentações disponíveis apenas no v2' });

    const delFilter = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await supabase
      .from('chapas_estoque_movimentos_v2')
      .delete()
      .neq('id', delFilter)
      .select('id');
    if (error) throw error;

    await logAuditoria('chapas_estoque_movimentos_v2', 'DELETE_ALL', 'all', {}, { deleted: (data || []).length }, req);
    return res.json({ ok: true, deleted: (data || []).length });
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
    const tipoRpc = delta < 0 ? 'entrada' : 'saida';
    const qtdRpc = Math.abs(delta);
    if (qtdRpc > 0) {
      const movRes = await _chapasMovimentarV2Rpc({
        chapa_id: chapaId,
        tipo: tipoRpc,
        quantidade: qtdRpc,
        nf: null,
        obs: `Reversão do movimento ${movId} (${mov.tipo})`.trim(),
        origem: 'reversao_movimento',
        origem_id: String(movId),
        usuario: req?.usuario?.nome || 'sistema',
        emp_id: canonCur.emp_id || mov.emp_id || null,
      });
      if (movRes?.error) {
        if (_chapasMovRpcIsSaldoInsuficiente(movRes.error)) return res.status(409).json({ ok: false, error: 'Saldo insuficiente' });
        if (_chapasMovRpcIsValidacao(movRes.error)) return res.status(400).json({ ok: false, error: movRes.error.message || String(movRes.error) });
        return res.status(500).json({ ok: false, error: movRes.error.message || String(movRes.error) });
      }
    }

    const { error: revErr } = await supabase
      .from('chapas_estoque_movimentos_v2')
      .update({ reverted: true, reverted_by: req?.usuario?.nome || 'sistema', reverted_at: new Date().toISOString() })
      .eq('id', movId);
    if (revErr) return res.status(500).json({ ok: false, error: revErr.message });

    cacheClearPrefix('chapas_estoque:');
    const { data: upd } = await supabase.from('chapas_estoque_v2').select('*').eq('id', chapaId).maybeSingle();
    const canonUpd = upd ? _chapasCanonicalFromAny(upd, 'chapas_estoque_v2') : { ...canonCur, quantidade: curQtd - delta };
    await _chapasLogAcao(req, 'estoque_movimento_revertido', `Movimento revertido (${mov.tipo}) delta=${delta} · ${canonUpd.nome || ''} · ${canonUpd.fornecedor || ''} · ${canonUpd.nomenclatura || ''} · ${canonUpd.tamanho || ''}`);

    return ok(res, { chapa: canonUpd });
  } catch (e) { err(res, e); }
});

app.post('/api/chapas_estoque/upsert_sem_historico', authMiddleware, async (req, res) => {
  try {
    const preferred = await _chapasPreferV2Table();
    const table = preferred === 'chapas_estoque_v2' ? 'chapas_estoque_v2' : 'chapas_estoque';
    const inRows = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.rows) ? req.body.rows : []);
    const rowsRaw = Array.isArray(inRows) ? inRows : [];
    try { console.log('[UPSERT CHAPAS]', rowsRaw.length, 'itens recebidos'); } catch (_) {}
    if (!rowsRaw.length) return res.status(400).json({ ok: false, error: 'rows vazio' });

    const normNom = (v) => String(v || '').trim().toUpperCase();
    const normTam = (v) => String(v || '').trim().toUpperCase().replace(/\s+/g, '').replace(/MM/g, '').replace(/×/g, 'X');
    const toInt = (v) => Math.trunc(Number(String(v ?? '').toString().replace(/\./g, '').replace(',', '.')) || 0);
    const toNum = (v) => Number(String(v ?? '').toString().replace(/R\$/gi, '').replace(/\s+/g, '').replace(/\./g, '').replace(',', '.')) || 0;

    const byKey = new Map();
    const errors = [];
    rowsRaw.forEach((r, idx) => {
      const row = r && typeof r === 'object' ? r : {};
      const fornecedor = String(row.fornecedor ?? row.forn ?? row.FORNECEDOR ?? '').trim();
      const nomenclatura = String(row.nomenclatura ?? row.nom ?? row.NOMENCLATURA ?? '').trim();
      const tamanho = String(row.tamanho ?? row.tam ?? row.TAMANHO ?? '').trim();
      const nome = String(row.nome ?? row.nome_uso ?? row.NOME ?? '').trim();
      const qualCnpj = String(row.qual_cnpj ?? row.qual ?? row['QUAL CNPJ'] ?? row.QUAL_CNPJ ?? '').trim();
      const nf = String(row.nf ?? row.NF ?? '').trim();
      const quantidade = toInt(row.quantidade ?? row.qtd ?? row.QUANTIDADE ?? 0);
      const valorUnitario = toNum(row.valor_unitario ?? row.val ?? row.VALOR ?? row['R$'] ?? row['R$ (UN)'] ?? row['R$ (UNIDADE)'] ?? 0);

      const key = `${normNom(nomenclatura)}|${normTam(tamanho)}`;
      if (!nomenclatura || !tamanho) {
        errors.push({ idx, error: 'nomenclatura/tamanho obrigatórios' });
        return;
      }
      byKey.set(key, { idx, fornecedor, nomenclatura, tamanho, nome, qual_cnpj: qualCnpj, nf, quantidade, valor_unitario: valorUnitario });
    });

    const rows = Array.from(byKey.values());
    const nomCol = table === 'chapas_estoque_v2' ? 'nomenclatura' : 'nom';
    const tamCol = table === 'chapas_estoque_v2' ? 'tamanho' : 'tam';

    const noms = Array.from(new Set(rows.map((r) => normNom(r.nomenclatura)))).slice(0, 500);
    const tams = Array.from(new Set(rows.map((r) => normTam(r.tamanho)))).slice(0, 500);

    let existing = [];
    if (noms.length && tams.length) {
      const r0 = await supabase.from(table).select(`id,${nomCol},${tamCol}`).in(nomCol, noms).in(tamCol, tams);
      if (r0.error) throw r0.error;
      existing = Array.isArray(r0.data) ? r0.data : [];
    }
    const existingKeys = new Set(existing.map((e) => `${normNom(e?.[nomCol])}|${normTam(e?.[tamCol])}`));

    const updPayload = [];
    const insPayload = [];
    rows.forEach((r) => {
      const key = `${normNom(r.nomenclatura)}|${normTam(r.tamanho)}`;
      const isUpd = existingKeys.has(key);

      if (table === 'chapas_estoque_v2') {
        const base = {
          fornecedor: r.fornecedor,
          nomenclatura: r.nomenclatura,
          tamanho: String(r.tamanho || '').trim().toUpperCase(),
          qual_cnpj: r.qual_cnpj || null,
          nf: r.nf || null,
          quantidade: Math.max(0, Math.trunc(Number(r.quantidade || 0) || 0)),
          valor_unitario: Math.max(0, Number(r.valor_unitario || 0) || 0),
        };
        if (isUpd) updPayload.push(base);
        else insPayload.push({
          ...base,
          nome_uso: r.nome || r.nomenclatura,
          categoria: 'Estoque Simples',
        });
        return;
      }

      const base = {
        forn: r.fornecedor,
        nom: r.nomenclatura,
        tam: String(r.tamanho || '').trim().toUpperCase(),
        qual_cnpj: r.qual_cnpj || null,
        qual: r.qual_cnpj || null,
        nf: r.nf || null,
        qtd: Math.max(0, Math.trunc(Number(r.quantidade || 0) || 0)),
        val: Math.max(0, Number(r.valor_unitario || 0) || 0),
      };
      if (isUpd) updPayload.push(base);
      else insPayload.push({ ...base, nome: r.nome || r.nomenclatura, nome_uso: r.nome || r.nomenclatura });
    });

    let updated = 0;
    let inserted = 0;
    const onConflict = `${nomCol},${tamCol}`;

    const runUpsert = async (payload, kind) => {
      if (!payload.length) return;
      const r = await supabase.from(table).upsert(payload, { onConflict, ignoreDuplicates: false });
      if (!r.error) {
        if (kind === 'upd') updated += payload.length;
        if (kind === 'ins') inserted += payload.length;
        return;
      }
      const msg = String(r.error?.message || r.error);
      const noConstraint = msg.toLowerCase().includes('no unique') || msg.toLowerCase().includes('no unique or exclusion') || msg.toLowerCase().includes('on conflict');
      if (!noConstraint) throw r.error;

      for (let i = 0; i < payload.length; i++) {
        const p = payload[i];
        try {
          if (kind === 'upd') {
            const u = await supabase.from(table).update(p).eq(nomCol, p[nomCol]).eq(tamCol, p[tamCol]);
            if (u.error) throw u.error;
            updated += 1;
          } else {
            const ins = await supabase.from(table).insert([p]);
            if (ins.error) throw ins.error;
            inserted += 1;
          }
        } catch (e) {
          errors.push({ idx: null, error: String(e?.message || e), key: `${p[nomCol]}|${p[tamCol]}` });
        }
      }
    };

    await runUpsert(updPayload, 'upd');
    await runUpsert(insPayload, 'ins');

    cacheClearPrefix('chapas_estoque:');
    return res.json({ ok: true, updated, inserted, errors });
  } catch (e) {
    _logApiError('CHAPAS UPSERT SEM HIST', req, e, { bodyKeys: Object.keys(req.body || {}) });
    return res.status(500).json({ ok: false, error: String(e?.message || e), rid: req._rid || null });
  }
});

app.post('/api/chapas_estoque/importar_sql', authMiddleware, async (req, res) => {
  try {
    const preferred = await _chapasPreferV2Table();
    const table = preferred === 'chapas_estoque_v2' ? 'chapas_estoque_v2' : 'chapas_estoque';
    const inRows = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.rows) ? req.body.rows : []);
    const rowsRaw = Array.isArray(inRows) ? inRows : [];
    if (!rowsRaw.length) return res.status(400).json({ ok: false, error: 'rows vazio' });

    const payload = rowsRaw.map((r) => (r && typeof r === 'object') ? r : {}).map((row) => {
      if (table === 'chapas_estoque_v2') {
        return {
          fornecedor: row.fornecedor ?? row.forn ?? null,
          nomenclatura: row.nomenclatura ?? row.nom ?? null,
          tamanho: row.tamanho ?? row.tam ?? null,
          nome_uso: row.nome_uso ?? row.nome ?? row.nomenclatura ?? row.nom ?? null,
          qual_cnpj: row.qual_cnpj ?? row.qual ?? row['QUAL CNPJ'] ?? null,
          nf: row.nf ?? null,
          quantidade: row.quantidade ?? row.qtd ?? row.QUANTIDADE ?? null,
          valor_unitario: row.valor_unitario ?? row.val ?? row.VALOR ?? null,
        };
      }
      return {
        forn: row.forn ?? row.fornecedor ?? null,
        nom: row.nom ?? row.nomenclatura ?? null,
        tam: row.tam ?? row.tamanho ?? null,
        nome: row.nome ?? row.nome_uso ?? row.nom ?? row.nomenclatura ?? null,
        qual_cnpj: row.qual_cnpj ?? row.qual ?? row['QUAL CNPJ'] ?? null,
        nf: row.nf ?? null,
        qtd: row.qtd ?? row.quantidade ?? row.QUANTIDADE ?? null,
        val: row.val ?? row.valor_unitario ?? row.VALOR ?? null,
      };
    });

    try { console.log('[IMPORTAR SQL CHAPAS]', table, 'itens:', payload.length); } catch (_) {}
    const onConflict = table === 'chapas_estoque_v2' ? 'nomenclatura,tamanho' : 'nom,tam';
    const r = await supabase.from(table).upsert(payload, { onConflict, ignoreDuplicates: false });
    if (r.error) {
      const msg = String(r.error?.message || r.error);
      const noConstraint = msg.toLowerCase().includes('no unique') || msg.toLowerCase().includes('no unique or exclusion') || msg.toLowerCase().includes('on conflict');
      if (noConstraint) {
        return res.status(400).json({
          ok: false,
          error: 'missing_unique_constraint_nom_tam',
          message: msg,
          suggested_sql: table === 'chapas_estoque_v2'
            ? 'ALTER TABLE chapas_estoque_v2 ADD CONSTRAINT chapas_estoque_v2_nomenclatura_tamanho_unique UNIQUE (nomenclatura, tamanho);'
            : 'ALTER TABLE chapas_estoque ADD CONSTRAINT chapas_estoque_nom_tam_unique UNIQUE (nom, tam);',
        });
      }
      throw r.error;
    }

    cacheClearPrefix('chapas_estoque:');
    return ok(res, { table, upserted: payload.length });
  } catch (e) {
    _logApiError('CHAPAS IMPORTAR SQL', req, e, { bodyType: Array.isArray(req.body) ? 'array' : typeof req.body });
    return res.status(500).json({ ok: false, error: String(e?.message || e), rid: req._rid || null });
  }
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
      const { data, error } = await supabase.from('chapas_estoque_v2').insert(chunk).select('id');
      if (error) return res.status(500).json({ ok: false, error: error.message, inserted, errors });
      inserted += Array.isArray(data) ? data.length : chunk.length;
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
      emp_id: c.emp_id || 'E1',
      criado_por: req?.usuario?.nome || 'sistema',
      atualizado_por: req?.usuario?.nome || 'sistema',
    })).filter(x => x.fornecedor && x.nomenclatura && x.tamanho);

    const chunkSize = 200;
    let inserted = 0;
    for (let i = 0; i < mapped.length; i += chunkSize) {
      const chunk = mapped.slice(i, i + chunkSize);
      const { data, error } = await supabase.from('chapas_estoque_v2').insert(chunk).select('id');
      if (error) return res.status(500).json({ ok: false, error: error.message, inserted });
      inserted += Array.isArray(data) ? data.length : chunk.length;
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

app.post('/api/chapas_estoque/sugerir_menor_desperdicio', authMiddleware, async (req, res) => {
  try {
    const comp = Number(req.body?.comprimento_mm);
    const larg = Number(req.body?.largura_mm);
    const alt  = Number(req.body?.altura_mm);
    const empId = String(req.body?.emp_id || req.body?.empId || '').trim();

    if (!(comp > 0 && larg > 0 && alt > 0)) {
      return res.status(400).json({ ok: false, error: 'comprimento_mm, largura_mm e altura_mm são obrigatórios e devem ser > 0' });
    }

    const devLarg = comp + (alt * 2) + 20;
    const devComp = (larg * 2) + (alt * 2) + 30;
    const areaCaixa = devLarg * devComp;

    const table = await _chapasPreferV2Table();
    let q = supabase.from(table).select('*').limit(5000);
    if (empId) q = q.eq('emp_id', empId);
    const { data: chapasRaw, error } = await q;
    if (error) throw error;

    const chapas = (Array.isArray(chapasRaw) ? chapasRaw : [])
      .map(r => _chapasCanonicalFromAny(r, table))
      .filter(c => (Number(c.quantidade || c.qtd || 0) || 0) > 0);

    const resultados = [];

    for (const c of chapas) {
      const tam = String(c.tamanho || c.tam || '').trim();
      const m = tam.match(/(\d+)\s*[xX×]\s*(\d+)/);
      if (!m) continue;

      const d1 = Number(m[1]);
      const d2 = Number(m[2]);
      if (!(d1 > 0 && d2 > 0)) continue;

      const areaChapa = d1 * d2;

      const sentidoA = d1 >= devComp && d2 >= devLarg;
      const sentidoB = d1 >= devLarg && d2 >= devComp;
      if (!sentidoA && !sentidoB) continue;

      let cxL, cxC;
      if (sentidoA) {
        cxC = Math.floor(d1 / devComp);
        cxL = Math.floor(d2 / devLarg);
      } else {
        cxC = Math.floor(d1 / devLarg);
        cxL = Math.floor(d2 / devComp);
      }
      const caixasPorChapa = Math.max(1, cxL * cxC);
      const areaUsada = caixasPorChapa * areaCaixa;
      const despPct = Math.round(((areaChapa - areaUsada) / areaChapa) * 100);

      resultados.push({
        id: c.id,
        nome: String(c.nome || c.nomenclatura || '').trim(),
        fornecedor: String(c.fornecedor || '').trim(),
        tamanho: tam,
        dim1: d1,
        dim2: d2,
        area_chapa_mm2: areaChapa,
        quantidade: Number(c.quantidade || c.qtd || 0) || 0,
        valor_unitario: Number(c.valor_unitario || c.val || 0) || 0,
        cabe: true,
        caixas_por_chapa: caixasPorChapa,
        desperdicio_real_pct: Math.max(0, despPct),
        economia_vs_pior: 0,
      });
    }

    if (!resultados.length) {
      return res.json({
        ok: true,
        chapas: [],
        aviso: 'nenhuma_chapa_compativel',
        dados_caixa: { desenvolvimento_largura: devLarg, desenvolvimento_comprimento: devComp, area_caixa_mm2: areaCaixa }
      });
    }

    resultados.sort((a, b) => a.desperdicio_real_pct - b.desperdicio_real_pct);
    const piorPct = resultados[resultados.length - 1].desperdicio_real_pct;
    resultados.forEach(r => { r.economia_vs_pior = piorPct - r.desperdicio_real_pct; });

    return res.json({
      ok: true,
      dados_caixa: { desenvolvimento_largura: devLarg, desenvolvimento_comprimento: devComp, area_caixa_mm2: areaCaixa },
      chapas: resultados.slice(0, 10),
    });
  } catch (e) {
    _logApiError('CHAPA_SUGERIR', req, e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
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
      const { data, error } = await supabase.from(t).insert(chunk).select('id');
      if (error) throw error;
      inserted += Array.isArray(data) ? data.length : chunk.length;
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
    const { data, error } = await supabase.from('notificacoes').update({ lida: true }).eq('lida', false).select('id');
    if (error) throw error;
    ok(res, { updated: Array.isArray(data) ? data.length : 0 });
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
      const { data, error } = await supabase.from('relatorio_producao').insert(part).select('id');
      if (error) throw error;
      inserted += Array.isArray(data) ? data.length : part.length;
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
      const { data, error } = await supabase.from('relatorio_aparras').insert(part).select('id');
      if (error) throw error;
      inserted += Array.isArray(data) ? data.length : part.length;
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
    const limit = Math.max(1, Math.min(150, parseInt(String(req.query.limit || ''), 10) || 150));
    const offset = Math.max(0, parseInt(String(req.query.offset || ''), 10) || 0);
    const dataInicioRaw = String(req.query.dataInicio || req.query.data_inicio || '').trim();
    const dataFimRaw = String(req.query.dataFim || req.query.data_fim || '').trim();
    const dataInicio = dataInicioRaw ? dataInicioRaw : (() => {
      const dt = new Date();
      dt.setDate(dt.getDate() - 30);
      return dt.toISOString();
    })();

    let q = supabase.from('historico_acoes')
      .select('*')
      .ilike('tipo_acao', '%estoque%')
      .order('data_hora', { ascending: false })
      .range(offset, offset + limit - 1);
    if (dataInicio) q = q.gte('data_hora', dataInicio);
    if (dataFimRaw) q = q.lte('data_hora', dataFimRaw);
    const { data, error } = await q;
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
    let payload = { ...(req.body || {}) };
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const { data, error } = await supabase.from('recebimento_insumos').insert([payload]).select();
      if (!error) return ok(res, data && data[0] ? data[0] : null);
      const msg = String(error.message || error);
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column\s+"([^"]+)"\s+does not exist/i);
      const col = (m1 && m1[1]) || (m2 && m2[1]) || null;
      if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
        delete payload[col];
        continue;
      }
      throw error;
    }
    return res.status(400).json({ ok: false, error: 'Falha ao inserir recebimento' });
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

let _relEmailTask = null;
let _relEmailState = { enabled: false, cron: null, to: [], empId: null, lastRunAt: null, lastOk: null, lastError: null };

async function _loadConfigJson(chave, fallback) {
  try {
    const { data, error } = await supabase.from('configuracoes').select('valor').eq('chave', chave).maybeSingle();
    if (error) return fallback;
    if (!data || data.valor == null) return fallback;
    return data.valor;
  } catch (_) { return fallback; }
}

async function _saveConfigJson(chave, valor, req) {
  const payload = {
    chave,
    valor,
    atualizado_por: req?.usuario?.nome || 'sistema',
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('configuracoes').upsert(payload, { onConflict: 'chave' });
  if (error) throw error;
}

function _smtpTransport() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Math.trunc(Number(process.env.SMTP_PORT || 587) || 587);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const secure = String(process.env.SMTP_SECURE || '').trim().toLowerCase() === 'true' || port === 465;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function _isoDay(d) {
  try { return new Date(d).toISOString().slice(0, 10); } catch (_) { return ''; }
}

function _range(period) {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  if (period === 'semana') {
    const x = startOfDay(now);
    const dow = x.getDay();
    const diff = (dow === 0) ? 6 : (dow - 1);
    x.setDate(x.getDate() - diff);
    return { de: x, ate: endOfDay(now), label: `Semana ${_isoDay(x)} → ${_isoDay(now)}` };
  }
  if (period === 'mes') {
    const de = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { de, ate: endOfDay(now), label: `Mês ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}` };
  }
  const y = startOfDay(now);
  y.setDate(y.getDate() - 1);
  return { de: y, ate: endOfDay(y), label: `Ontem ${_isoDay(y)}` };
}

async function _fetchResumoEmail({ empId, period }) {
  const { de, ate, label } = _range(period || 'ontem');
  const deIso = de.toISOString();
  const ateIso = ate.toISOString();

  let qOf = supabase.from('ofs').select('id,numero,of,status,valor_total,valor_venda,val,emp_id,created_at,data_conclusao,updated_at').gte('created_at', deIso).lte('created_at', ateIso).limit(5000);
  if (empId) qOf = qOf.eq('emp_id', empId);
  const ofsR = await qOf;
  const ofs = Array.isArray(ofsR.data) ? ofsR.data : [];

  let qCmp = supabase.from('compras').select('id,status,valor,vtot,emp_id,created_at').gte('created_at', deIso).lte('created_at', ateIso).limit(5000);
  if (empId) qCmp = qCmp.eq('emp_id', empId);
  const cmpR = await qCmp;
  const compras = Array.isArray(cmpR.data) ? cmpR.data : [];

  const sumOf = (o) => Number(o?.valor_total ?? o?.valor_venda ?? o?.val ?? 0) || 0;
  const sumCmp = (c) => Number(c?.valor ?? c?.vtot ?? 0) || 0;

  const totalVendas = ofs.reduce((s, o) => s + sumOf(o), 0);
  const totalCompras = compras.reduce((s, c) => s + sumCmp(c), 0);
  const stCount = {};
  ofs.forEach((o) => {
    const st = String(o?.status || '—').trim() || '—';
    stCount[st] = (stCount[st] || 0) + 1;
  });

  return {
    label,
    ofsCount: ofs.length,
    comprasCount: compras.length,
    totalVendas,
    totalCompras,
    status: stCount,
    sampleOfs: ofs.slice(0, 12).map((o) => ({
      numero: o?.numero ?? o?.of ?? '—',
      status: o?.status ?? '—',
      valor: sumOf(o),
      created_at: String(o?.created_at || '').slice(0, 10),
      emp_id: o?.emp_id ?? '',
    })),
  };
}

function _renderResumoEmailHtml(resumo) {
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtMoney = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const statusRows = Object.entries(resumo.status || {}).sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td style="text-align:right;font-family:monospace">${esc(v)}</td></tr>`).join('');
  const ofsRows = (resumo.sampleOfs || []).map((o) => `
    <tr>
      <td style="font-family:monospace">${esc(o.numero)}</td>
      <td>${esc(o.status)}</td>
      <td style="text-align:right">${fmtMoney(o.valor)}</td>
      <td style="text-align:center">${esc(o.created_at || '—')}</td>
    </tr>`).join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Relatório</title>
  </head><body style="margin:0;background:#0b1220;color:#e5e7eb;font-family:Arial,sans-serif">
  <div style="max-width:920px;margin:0 auto;padding:18px">
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:14px">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
        <div>
          <div style="font-size:18px;font-weight:900">Relatório (ERP)</div>
          <div style="margin-top:6px;color:rgba(229,231,235,0.70);font-size:12px">${esc(resumo.label || '')}</div>
        </div>
        <div style="color:rgba(229,231,235,0.70);font-size:12px">Italy Embalagens</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:14px">
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:12px">
          <div style="font-size:11px;color:rgba(229,231,235,0.70);font-family:monospace">OFs</div>
          <div style="font-size:20px;font-weight:900">${esc(resumo.ofsCount)}</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:12px">
          <div style="font-size:11px;color:rgba(229,231,235,0.70);font-family:monospace">Vendas (R$)</div>
          <div style="font-size:20px;font-weight:900;color:#10b981">${fmtMoney(resumo.totalVendas)}</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:12px">
          <div style="font-size:11px;color:rgba(229,231,235,0.70);font-family:monospace">Compras</div>
          <div style="font-size:20px;font-weight:900">${esc(resumo.comprasCount)}</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:12px">
          <div style="font-size:11px;color:rgba(229,231,235,0.70);font-family:monospace">Compras (R$)</div>
          <div style="font-size:20px;font-weight:900;color:#f59e0b">${fmtMoney(resumo.totalCompras)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;margin-top:14px">
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:12px">
          <div style="font-weight:900;margin-bottom:8px">Status das OFs</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr><th style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.12);padding:6px 8px">Status</th><th style="text-align:right;border-bottom:1px solid rgba(255,255,255,0.12);padding:6px 8px">Qtd</th></tr></thead>
            <tbody>${statusRows || '<tr><td colspan="2" style="padding:6px 8px;color:rgba(229,231,235,0.70)">—</td></tr>'}</tbody>
          </table>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:12px">
          <div style="font-weight:900;margin-bottom:8px">Amostra de OFs</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr>
              <th style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.12);padding:6px 8px">OF</th>
              <th style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.12);padding:6px 8px">Status</th>
              <th style="text-align:right;border-bottom:1px solid rgba(255,255,255,0.12);padding:6px 8px">Valor</th>
              <th style="text-align:center;border-bottom:1px solid rgba(255,255,255,0.12);padding:6px 8px">Data</th>
            </tr></thead>
            <tbody>${ofsRows || '<tr><td colspan="4" style="padding:6px 8px;color:rgba(229,231,235,0.70)">—</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  </body></html>`;
}

async function _sendResumoEmail({ to, subject, html }) {
  const transport = _smtpTransport();
  if (!transport) throw new Error('smtp_not_configured');
  const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
  if (!from) throw new Error('smtp_from_missing');
  const info = await transport.sendMail({ from, to, subject, html });
  return info;
}

async function _reloadRelEmailSchedule() {
  if (_relEmailTask) {
    try { _relEmailTask.stop(); } catch (_) {}
    _relEmailTask = null;
  }
  const cfg = await _loadConfigJson('relatorio_email', null);
  const enabled = !!cfg?.enabled;
  const cronExpr = String(cfg?.cron || '').trim() || '0 7 * * 1';
  const to = Array.isArray(cfg?.to) ? cfg.to.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const empId = String(cfg?.emp_id || cfg?.empId || '').trim() || null;
  _relEmailState = { ..._relEmailState, enabled, cron: cronExpr, to, empId };

  if (!enabled) return;
  if (!cron || !cron.validate(cronExpr)) {
    _relEmailState = { ..._relEmailState, lastOk: false, lastError: 'cron_invalid' };
    return;
  }
  if (!to.length) {
    _relEmailState = { ..._relEmailState, lastOk: false, lastError: 'no_recipients' };
    return;
  }
  _relEmailTask = cron.schedule(cronExpr, async () => {
    try {
      const resumo = await _fetchResumoEmail({ empId, period: cfg?.period || 'ontem' });
      const html = _renderResumoEmailHtml(resumo);
      const subject = `Relatório ERP — ${resumo.label}`;
      await _sendResumoEmail({ to, subject, html });
      _relEmailState = { ..._relEmailState, lastRunAt: new Date().toISOString(), lastOk: true, lastError: null };
    } catch (e) {
      _relEmailState = { ..._relEmailState, lastRunAt: new Date().toISOString(), lastOk: false, lastError: String(e?.message || e) };
    }
  }, { scheduled: true, timezone: String(process.env.REPORT_TZ || 'America/Sao_Paulo') });
}

app.get('/api/relatorios/email/status', authMiddleware, requireAdmin, async (req, res) => {
  return ok(res, _relEmailState);
});

app.get('/api/relatorios/email/config', authMiddleware, requireAdmin, async (req, res) => {
  const cfg = await _loadConfigJson('relatorio_email', { enabled: false, cron: '0 7 * * 1', period: 'ontem', to: [], emp_id: '' });
  return ok(res, cfg);
});

app.put('/api/relatorios/email/config', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const cfg = {
      enabled: !!b.enabled,
      cron: String(b.cron || '').trim() || '0 7 * * 1',
      period: String(b.period || 'ontem').trim(),
      to: Array.isArray(b.to) ? b.to.map((x) => String(x || '').trim()).filter(Boolean) : [],
      emp_id: String(b.emp_id || b.empId || '').trim(),
    };
    await _saveConfigJson('relatorio_email', cfg, req);
    await _reloadRelEmailSchedule();
    return ok(res, cfg);
  } catch (e) { return err(res, e); }
});

app.post('/api/relatorios/email/enviar_agora', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const cfg = await _loadConfigJson('relatorio_email', null);
    const to = Array.isArray(cfg?.to) ? cfg.to.map((x) => String(x || '').trim()).filter(Boolean) : [];
    if (!to.length) return res.status(400).json({ ok: false, error: 'no_recipients' });
    const empId = String(cfg?.emp_id || cfg?.empId || '').trim() || null;
    const resumo = await _fetchResumoEmail({ empId, period: cfg?.period || 'ontem' });
    const html = _renderResumoEmailHtml(resumo);
    const subject = `Relatório ERP — ${resumo.label}`;
    await _sendResumoEmail({ to, subject, html });
    _relEmailState = { ..._relEmailState, lastRunAt: new Date().toISOString(), lastOk: true, lastError: null };
    return ok(res, true);
  } catch (e) {
    _relEmailState = { ..._relEmailState, lastRunAt: new Date().toISOString(), lastOk: false, lastError: String(e?.message || e) };
    return err(res, e);
  }
});

function _assistNorm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function _assistTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function _assistFmtDateBr(iso) {
  const s = String(iso || '').slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s || '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

const _assistBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
function _assistFmtBRL(v) {
  const n = Number(v);
  const ok = Number.isFinite(n) ? n : 0;
  return _assistBRL.format(ok);
}

function _assistDaysDiff(aIso, bIso) {
  const a = new Date(String(aIso).slice(0, 10) + 'T00:00:00');
  const b = new Date(String(bIso).slice(0, 10) + 'T00:00:00');
  const da = a.getTime();
  const db = b.getTime();
  if (!Number.isFinite(da) || !Number.isFinite(db)) return 0;
  return Math.floor((da - db) / 86400000);
}

function _assistMonthFromText(norm) {
  const map = {
    janeiro: 1, fevereiro: 2, marco: 3, março: 3, abril: 4, maio: 5, junho: 6,
    julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  };
  for (const k of Object.keys(map)) {
    if (norm.includes(k)) return map[k];
  }
  const m1 = norm.match(/\b(?:mes|mês|em)\s*(0?[1-9]|1[0-2])\b/);
  if (m1) return Number(m1[1]);
  const m2 = norm.match(/\b(0?[1-9]|1[0-2])\b/);
  if (m2 && (norm.includes('fatur') || norm.includes('venda') || norm.includes('total de') || norm.includes('mes') || norm.includes('mês'))) {
    return Number(m2[1]);
  }
  return null;
}

function _assistMonthRange(year, month) {
  const y = Number(year);
  const m = Number(month);
  const ini = new Date(y, m - 1, 1);
  const fim = new Date(y, m, 0);
  return { de: ini.toISOString().slice(0, 10), ate: fim.toISOString().slice(0, 10) };
}

function _assistWeekRange(todayIso) {
  const base = new Date(String(todayIso).slice(0, 10) + 'T12:00:00');
  const dow = base.getDay();
  const diffMon = (dow === 0 ? 6 : (dow - 1));
  const mon = new Date(base);
  mon.setDate(base.getDate() - diffMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { de: mon.toISOString().slice(0, 10), ate: sun.toISOString().slice(0, 10) };
}

async function _assistUser(req) {
  const u = req.usuario || {};
  const uid = String(u.id || '').trim();
  let nome = String(u.nome || u.name || '').trim();
  let email = String(u.email || '').trim();
  let perfil = String(u.perfil || '').trim();
  if ((!nome || nome.length < 2) && uid) {
    try {
      const { data } = await supabase.from('usuarios').select('nome,email,perfil').eq('id', uid).maybeSingle();
      if (data) {
        nome = nome || String(data.nome || '').trim();
        email = email || String(data.email || '').trim();
        perfil = perfil || String(data.perfil || '').trim();
      }
    } catch (_) {}
  }
  const nomeSafe = nome || email || 'Olá';
  return { id: uid || null, nome: nomeSafe, email: email || null, perfil: perfil || null };
}

function _assistPickOfNumber(o) {
  return String(o?.of ?? o?.numero ?? '').trim() || '—';
}

function _assistPickOfEntrega(o) {
  return String(o?.data_entrega ?? o?.ent ?? '').slice(0, 10);
}

function _assistPickOfConclusao(o) {
  return String(o?.data_conclusao ?? '').slice(0, 10);
}

function _assistPickOfClienteId(o) {
  return String(o?.cli_id ?? o?.cliId ?? o?.cliente_id ?? o?.clienteId ?? '').trim();
}

function _assistIsConcluida(o) {
  const st = _assistNorm(o?.status || '');
  return st.includes('conclu') || st === 'feito' || st === 'finalizado';
}

function _assistIsCancelada(o) {
  const st = _assistNorm(o?.status || '');
  return st.includes('cancel');
}

function _assistPickOfValor(o) {
  const v = Number(o?.valor_total ?? o?.valor_venda ?? o?.val ?? 0);
  return Number.isFinite(v) ? v : 0;
}

async function _assistLoadClientesByIds(ids) {
  const arr = Array.isArray(ids) ? ids.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const uniq = Array.from(new Set(arr)).slice(0, 200);
  if (!uniq.length) return new Map();
  try {
    const { data } = await supabase.from('clientes').select('id,nome').in('id', uniq);
    const m = new Map();
    (Array.isArray(data) ? data : []).forEach((c) => { if (c?.id) m.set(String(c.id), String(c.nome || '').trim()); });
    return m;
  } catch (_) {
    return new Map();
  }
}

function _jarvisFirstName(full) {
  const s = _jarvisPrettyName(full);
  const parts = s.split(/\s+/).filter(Boolean);
  return parts[0] || s || 'Usuário';
}

function _jarvisHasAny(norm, ...words) {
  return words.some((w) => norm.includes(_assistNorm(w)));
}

function _jarvisPrettyName(full) {
  const raw = String(full || '').trim();
  if (!raw) return '';
  const parts = raw.split(/\s+/).filter(Boolean);
  const safe = parts.map((p) => {
    const s = String(p || '').trim();
    if (!s) return '';
    const low = s.toLowerCase();
    return low.charAt(0).toUpperCase() + low.slice(1);
  }).filter(Boolean);
  return safe.join(' ').trim();
}

function _jarvisLastOfNumFromHistory(historico) {
  const hist = Array.isArray(historico) ? historico : [];
  const scan = hist.slice(-10).reverse();
  for (const m of scan) {
    const txt = String(m?.content || m?.texto || m?.text || '').trim();
    if (!txt) continue;
    const mm = _assistNorm(txt).match(/\bof\s*#?\s*([0-9]{1,8})\b/);
    if (mm) return String(mm[1]);
    const mh = txt.match(/\B#\s*([0-9]{1,8})\b/);
    if (mh) return String(mh[1]);
  }
  return '';
}

async function _jarvisBuildContext({ pergunta, norm, hoje, month, year, nomeUsuario }) {
  const ctx = {};
  const cap = (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []);
  const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const mesAtual = new Date().toISOString().slice(0, 7);
  ctx.data_hora_atual = new Date().toLocaleString('pt-BR');
  ctx.usuario = _jarvisFirstName(nomeUsuario || '');

  const { data: ofsAbertasRaw } = await supabase
    .from('ofs')
    .select('id,of,numero,status,cli_id,cliente_id,descricao,data_entrega,ent,valor_total,valor_venda,val,urg,urgente,deleted_at,imagem_url,imgs,data_conclusao')
    .is('deleted_at', null)
    .neq('status', 'Cancelada')
    .limit(500);
  const ofsAbertas = (Array.isArray(ofsAbertasRaw) ? ofsAbertasRaw : []).filter((o) => o && !_assistIsCancelada(o) && !_assistIsConcluida(o));
  ctx.total_ofs_abertas = ofsAbertas.length;
  ctx.ofs_atrasadas = cap(ofsAbertas.filter((o) => {
    const ent = String(o.data_entrega ?? o.ent ?? '').slice(0, 10);
    return ent && ent < hoje;
  }).sort((a, b) => String(a.data_entrega ?? a.ent ?? '').localeCompare(String(b.data_entrega ?? b.ent ?? ''))), 80);
  ctx.ofs_hoje = cap(ofsAbertas.filter((o) => String(o.data_entrega ?? o.ent ?? '').slice(0, 10) === hoje), 80);
  ctx.ofs_urgentes = cap(ofsAbertas.filter((o) => !!(o.urg || o.urgente)), 80);

  const numMatch = String(pergunta || '').match(/\b(\d{1,8})\b/);
  if (numMatch) {
    const n = String(numMatch[1] || '').trim();
    const { data: ofEspecifica } = await supabase
      .from('ofs')
      .select('*')
      .or(`of.eq.${n},numero.eq.${n}`)
      .is('deleted_at', null)
      .limit(1);
    if (Array.isArray(ofEspecifica) && ofEspecifica[0]) ctx.of_especifica = ofEspecifica[0];
  }
  try{
    const ofCtx = ctx.of_especifica || null;
    if(ofCtx){
      const sug = await _autoPickSugestaoMaquinaNome(ofCtx);
      if(sug && sug.ok && sug.nome){
        ctx.sugestao_maquina = sug.nome;
        ctx.sugestao_maquina_meta = { fila: sug.fila, taxa_perda: sug.taxa_perda, penalidade: sug.penalidade };
      }
    }
  }catch(_){}

  const { data: chapasRaw } = await supabase
    .from('chapas_estoque')
    .select('nome,fornecedor,nomenclatura,tamanho,quantidade_atual,quantidade,estoque_minimo,valor_unitario')
    .limit(200);
  const chapas = Array.isArray(chapasRaw) ? chapasRaw : [];
  ctx.total_chapas = chapas.length;
  ctx.estoque_critico = cap(chapas.filter((c) => {
    const qtd = safeNum(c.quantidade_atual ?? c.quantidade ?? 0);
    const min = safeNum(c.estoque_minimo ?? 0);
    return qtd < (min || 200);
  }), 80);

  const { data: ofsMesRaw } = await supabase
    .from('ofs')
    .select('valor_total,valor_venda,val,status,data_conclusao,deleted_at')
    .gte('data_conclusao', mesAtual + '-01')
    .is('deleted_at', null)
    .limit(5000);
  const ofsMes = (Array.isArray(ofsMesRaw) ? ofsMesRaw : []).filter((o) => _assistIsConcluida(o));
  ctx.faturamento_mes = ofsMes.reduce((s, o) => s + _assistPickOfValor(o), 0);

  const { data: clientesRaw } = await supabase.from('clientes').select('id,nome,tel,telefone').limit(200);
  const clientes = Array.isArray(clientesRaw) ? clientesRaw : [];
  ctx.total_clientes = clientes.length;

  try {
    const { data: perdasRaw } = await supabase
      .from('caixas_perdidas')
      .select('qtd_perdida,valor_perdido,maquina,data')
      .gte('data', mesAtual + '-01')
      .limit(5000);
    const perdas = Array.isArray(perdasRaw) ? perdasRaw : [];
    ctx.perdas_mes = {
      total_caixas: perdas.reduce((s, p) => s + safeNum(p.qtd_perdida ?? 0), 0),
      valor_total: perdas.reduce((s, p) => s + safeNum(p.valor_perdido ?? 0), 0),
    };
  } catch (_) {
    ctx.perdas_mes = { total_caixas: 0, valor_total: 0 };
  }

  try {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mes = d.toISOString().slice(0, 7);
      const de = mes + '-01';
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      const { data: ofsM } = await supabase
        .from('ofs')
        .select('valor_total,valor_venda,val,status,deleted_at')
        .gte('data_conclusao', de)
        .lte('data_conclusao', fim)
        .is('deleted_at', null)
        .limit(1000);
      const total = (Array.isArray(ofsM) ? ofsM : [])
        .filter(o => !o.deleted_at)
        .reduce((s, o) => s + (Number(o.valor_total ?? o.valor_venda ?? o.val ?? 0) || 0), 0);
      meses.push({ mes, total: Math.round(total) });
    }
    ctx.tendencia_faturamento = meses;
    const vals = meses.map(m => m.total).filter(v => v > 0);
    if (vals.length >= 2) {
      const ultimo = vals[vals.length - 1];
      const penultimo = vals[vals.length - 2];
      ctx.variacao_mes_pct = penultimo > 0 ? Math.round(((ultimo - penultimo) / penultimo) * 100) : 0;
    }
  } catch (_) {}

  try {
    const mesRef = new Date().toISOString().slice(0, 7);
    const { data: ofsClientes } = await supabase
      .from('ofs')
      .select('cli_id,cliente_id,valor_total,valor_venda,val,deleted_at,status')
      .gte('created_at', mesRef + '-01')
      .is('deleted_at', null)
      .limit(2000);
    const mapCli = {};
    (Array.isArray(ofsClientes) ? ofsClientes : []).forEach(o => {
      const cid = String(o.cli_id || o.cliente_id || '').trim();
      if (!cid) return;
      const v = Number(o.valor_total ?? o.valor_venda ?? o.val ?? 0) || 0;
      mapCli[cid] = (mapCli[cid] || 0) + v;
    });
    const topIds = Object.entries(mapCli).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);
    if (topIds.length) {
      const { data: clisTop } = await supabase.from('clientes').select('id,nome').in('id', topIds).limit(200);
      ctx.top_clientes_mes = topIds.map(id => {
        const c = (Array.isArray(clisTop) ? clisTop : []).find(x => String(x.id) === String(id));
        return { nome: c?.nome || id, valor: Math.round(mapCli[id] || 0) };
      });
    }
  } catch (_) {}

  try {
    const { data: ofsAbertas } = await supabase
      .from('ofs')
      .select('fluxo_maquinas,maq,maquina_atual_index,status,deleted_at')
      .is('deleted_at', null)
      .not('status', 'in', '("Concluído","Cancelada","Cancelado")')
      .limit(500);
    const filaMap = {};
    (Array.isArray(ofsAbertas) ? ofsAbertas : []).forEach(o => {
      const fluxo = parseFluxo(o.fluxo_maquinas || o.maq || []);
      const idx = Number(o.maquina_atual_index || 0) || 0;
      const maq = String(fluxo[idx] || fluxo[0] || '').trim();
      if (maq) filaMap[maq] = (filaMap[maq] || 0) + 1;
    });
    ctx.fila_maquinas = Object.entries(filaMap)
      .sort((a, b) => b[1] - a[1])
      .map(([maq, qtd]) => ({ maquina: maq, ofs_na_fila: qtd }));
  } catch (_) {}

  try {
    const anoAtual = new Date().getFullYear();
    const { data: ofsAno } = await supabase
      .from('ofs')
      .select('valor_total,valor_venda,val,status,deleted_at,data_conclusao')
      .gte('data_conclusao', `${anoAtual}-01-01`)
      .is('deleted_at', null)
      .limit(5000);
    const concluidas = (Array.isArray(ofsAno) ? ofsAno : []).filter(o =>
      !o.deleted_at && (String(o.status || '').toLowerCase().includes('conclu'))
    );
    ctx.faturamento_ano_atual = Math.round(concluidas.reduce((s, o) =>
      s + (Number(o.valor_total ?? o.valor_venda ?? o.val ?? 0) || 0), 0));
    ctx.total_ofs_concluidas_ano = concluidas.length;
  } catch (_) {}

  ctx.hoje = hoje;
  ctx.mes = month || (new Date().getMonth() + 1);
  ctx.ano = year;
  return ctx;
}

async function _jarvisCallClaude({ pergunta, nomeUsuario, dadosContexto, historico }) {
  const key = String(process.env.ANTHROPIC_API_KEY || '').trim();
  if (!key) return { ok: false, error: 'missing_key' };
  const firstName = _jarvisFirstName(nomeUsuario);
  const systemPrompt =
    `Você é o JARVIS, assistente inteligente da Italy Embalagens, uma fábrica de caixas de papelão.\n\n` +
    `USUÁRIO LOGADO: ${firstName} (chame sempre pelo primeiro nome)\n` +
    `DATA/HORA: ${new Date().toLocaleString('pt-BR')}\n\n` +
    `DADOS DO SISTEMA:\n${JSON.stringify(dadosContexto || {}, null, 2)}\n\n` +
    `INSTRUÇÕES:\n` +
    `- Responda SEMPRE em português brasileiro\n` +
    `- Seja direto e objetivo como o JARVIS do Iron Man\n` +
    `- Use emojis relevantes nas respostas\n` +
    `- Formate valores em R$ (ex: R$ 45.230,00)\n` +
    `- Formate datas como DD/MM/AAAA\n` +
    `- Quando listar OFs, mostre: número, cliente, status, data entrega\n` +
    `- Quando não souber algo, diga o que sabe e sugira alternativas\n` +
    `- Se perguntarem sobre OF específica e você tiver os dados, detalhe tudo\n` +
    `- Para ações de alteração, sempre confirme antes de executar\n` +
    `- Você tem acesso completo aos dados do sistema listados acima\n` +
    `- Nunca diga que não tem acesso aos dados — os dados estão no contexto acima`;

  const msgs = [];
  const hist = Array.isArray(historico) ? historico : [];
  for (const m of hist.slice(-5)) {
    const role = String(m?.role || m?.tipo || '').toLowerCase() === 'user' ? 'user' : 'assistant';
    const content = String(m?.content || m?.texto || m?.text || '').trim();
    if (!content) continue;
    msgs.push({ role, content });
  }
  msgs.push({ role: 'user', content: String(pergunta || '').trim() });

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: msgs,
    }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    return { ok: false, error: String(j?.error?.message || j?.error || r.status) };
  }
  const txt = Array.isArray(j?.content)
    ? j.content.map((c) => (c && c.type === 'text' ? String(c.text || '') : '')).join('\n').trim()
    : String(j?.content || j?.text || '').trim();
  return { ok: true, text: txt };
}

async function _callOpenAI({ mensagem, sistema, historico, json, modelo }) {
  try {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');

    const modeloFinal = modelo || 'gpt-4o';
    const msgs = [];

    if (sistema) msgs.push({ role: 'system', content: String(sistema) });

    if (Array.isArray(historico)) {
      historico.slice(-8).forEach((m) => {
        const role = String(m?.role || '').toLowerCase() === 'assistant' ? 'assistant' : 'user';
        const content = String(m?.content || m?.texto || m?.text || '').trim();
        if (content) msgs.push({ role, content });
      });
    }

    msgs.push({ role: 'user', content: String(mensagem || '') });

    const bodyReq = {
      model: modeloFinal,
      messages: msgs,
      max_tokens: 2000,
      temperature: 0.4,
    };

    if (json) bodyReq.response_format = { type: 'json_object' };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(bodyReq),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok) {
      throw new Error(data?.error?.message || `OpenAI erro HTTP ${r.status}`);
    }

    const texto = String(data?.choices?.[0]?.message?.content || '').trim();
    return { ok: true, text: texto, modelo: modeloFinal };
  } catch (e) {
    throw e;
  }
}

async function _callJarvisIA({ pergunta, nomeUsuario, dadosContexto, historico, modo }) {
  try {
    const temClaude = !!String(process.env.ANTHROPIC_API_KEY || '').trim();
    const temOpenAI = !!OPENAI_API_KEY;
    console.log('[CALLJARVIS]', { temOpenAI: !!OPENAI_API_KEY, modelo: 'gpt-4o', perguntaLen: pergunta?.length });

    const hoje = new Date().toLocaleString('pt-BR');
    const firstName = _jarvisFirstName(nomeUsuario || 'usuário');

    const systemBase = `Você é o JARVIS, assistente de inteligência artificial da Italy Embalagens.
Seu papel é responder perguntas com base nos dados reais do ERP abaixo.

USUÁRIO LOGADO: ${firstName}
DATA E HORA: ${hoje}

═══ DADOS REAIS DO SISTEMA ═══
${JSON.stringify(dadosContexto || {}, null, 2)}
══════════════════════════════

INSTRUÇÕES OBRIGATÓRIAS:
1. Use APENAS os dados acima para responder — nunca invente números
2. Responda SEMPRE em português brasileiro
3. Seja analítico e completo — explique o que os dados significam
4. Formate valores em R$ com separador de milhar (ex: R$ 45.230,00)
5. Formate datas como DD/MM/AAAA
6. Para listas de OFs: número, cliente, status, data entrega, valor
7. Quando perguntarem sobre tendências: compare períodos e indique se melhorou ou piorou
8. Quando perguntarem sobre problemas: identifique causas e sugira ações
9. Se os dados não contiverem a informação pedida: diga exatamente o que está faltando
10. Para relatórios: organize em seções com títulos claros

CAPACIDADES:
- Analisar OFs atrasadas, urgentes, por máquina, por cliente
- Calcular faturamento por período, por empresa, por vendedor
- Identificar padrões de perda e problemas de produção
- Comparar desempenho entre períodos
- Sugerir prioridades de produção
- Gerar relatórios detalhados em HTML para impressão`;

    if (modo === 'turbo' && temClaude && temOpenAI) {
      try {
        const [rClaude, rOpenAI] = await Promise.allSettled([
          _jarvisCallClaude({ pergunta, nomeUsuario, dadosContexto, historico }),
          _callOpenAI({ mensagem: pergunta, sistema: systemBase, historico, modelo: 'gpt-4o' }),
        ]);

        const textoClaude = rClaude.status === 'fulfilled' ? String(rClaude.value?.text || '') : '';
        const textoOpenAI = rOpenAI.status === 'fulfilled' ? String(rOpenAI.value?.text || '') : '';

        if (textoClaude && textoOpenAI) {
          const sintese = await _callOpenAI({
            mensagem: `Duas análises foram feitas sobre a pergunta: "${pergunta}"

ANÁLISE 1 (Claude):
${textoClaude}

ANÁLISE 2 (GPT-4o):
${textoOpenAI}

Sintetize as duas análises em UMA resposta única, completa e superior.
Aproveite os pontos fortes de cada análise.
Responda em português brasileiro, de forma direta e clara.
NÃO mencione que houve duas análises — apenas dê a melhor resposta possível.`,
            sistema: 'Você sintetiza análises em respostas superiores. Responda em português.',
            modelo: 'gpt-4o',
          });
          return { ok: true, text: sintese.text, origem: 'turbo' };
        }

        if (textoClaude) return { ok: true, text: textoClaude, origem: 'claude' };
        if (textoOpenAI) return { ok: true, text: textoOpenAI, origem: 'openai' };
      } catch (e) {
        console.warn('[JARVIS TURBO] erro:', e?.message);
      }
    }

    if (temClaude) {
      try {
        const r = await _jarvisCallClaude({ pergunta, nomeUsuario, dadosContexto, historico });
        if (r?.ok && r.text) return { ok: true, text: r.text, origem: 'claude' };
      } catch (e) {
        console.warn('[JARVIS] Claude falhou, tentando OpenAI:', e?.message);
      }
    }

    if (temOpenAI) {
      try {
        const r = await _callOpenAI({
          mensagem: pergunta,
          sistema: systemBase,
          historico,
          modelo: 'gpt-4o',
        });
        if (r?.ok && r.text) return { ok: true, text: r.text, origem: 'openai' };
      } catch (e) {
        console.warn('[JARVIS] OpenAI também falhou:', e?.message);
      }
    }

    return { ok: false, text: '', origem: 'nenhuma' };
  } catch (e) {
    throw e;
  }
}

const _jarvisPendingActions = new Map();
function _jarvisNewActionId() {
  return 'act_' + Date.now().toString(36) + '_' + Math.random().toString(16).slice(2);
}
function _jarvisStoreAction(userId, action) {
  const id = _jarvisNewActionId();
  _jarvisPendingActions.set(id, { id, userId: String(userId || ''), createdAt: Date.now(), action });
  return id;
}
function _jarvisGetAction(id, userId) {
  const a = _jarvisPendingActions.get(String(id || '')) || null;
  if (!a) return null;
  if (String(a.userId || '') !== String(userId || '')) return null;
  if ((Date.now() - Number(a.createdAt || 0)) > 15 * 60 * 1000) {
    _jarvisPendingActions.delete(String(id || ''));
    return null;
  }
  return a;
}

function _jarvisParseDateBrToIso(s, fallbackYear) {
  const raw = String(s || '').trim();
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return '';
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  let yy = m[3] ? Number(m[3]) : Number(fallbackYear || new Date().getFullYear());
  if (yy < 100) yy = 2000 + yy;
  if (!(yy > 1900 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31)) return '';
  const dt = new Date(yy, mm - 1, dd);
  if (!Number.isFinite(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
}

async function _jarvisFindOFByNumero(ofNum) {
  const n = String(ofNum || '').replace(/\D/g, '');
  if (!n) return null;
  const { data: d1 } = await supabase
    .from('ofs')
    .select('*')
    .or(`of.eq.${n},numero.eq.${n}`)
    .is('deleted_at', null)
    .limit(1);
  if (Array.isArray(d1) && d1[0]) return d1[0];
  const { data: d2 } = await supabase
    .from('ofs')
    .select('*')
    .or(`of.ilike.%${n}%,numero.ilike.%${n}%`)
    .is('deleted_at', null)
    .limit(1);
  return Array.isArray(d2) && d2[0] ? d2[0] : null;
}

async function _jarvisFindClienteByNome(nome) {
  const termo = String(nome || '').trim();
  if (!termo) return null;
  const { data } = await supabase.from('clientes').select('id,nome,telefone').ilike('nome', '%' + termo.replace(/%/g, '') + '%').limit(1);
  return Array.isArray(data) && data[0] ? data[0] : null;
}

async function _jarvisFindChapaByNome(nome) {
  const termo = String(nome || '').trim();
  if (!termo) return null;
  const { data } = await supabase
    .from('chapas_estoque')
    .select('id,nomenclatura,nome_uso,nome,quantidade,quantidade_atual,qtd,estoque_minimo')
    .ilike('nomenclatura', '%' + termo.replace(/%/g, '') + '%')
    .limit(1);
  return Array.isArray(data) && data[0] ? data[0] : null;
}

function _jarvisInternalBase(req) {
  const host = String(req.get('host') || '').trim();
  if (!host) return '';
  const xf = String(req.headers['x-forwarded-proto'] || '').trim();
  const proto = xf || String(req.protocol || '').trim() || 'http';
  return `${proto}://${host}`;
}

async function _jarvisCallInternal(req, path, { method, body } = {}) {
  const base = _jarvisInternalBase(req);
  if (!base) throw new Error('internal_base_missing');
  const auth = req.headers.authorization || req.headers.Authorization || '';
  const url = base + path;
  const r = await fetch(url, {
    method: method || 'GET',
    headers: {
      Authorization: String(auth || ''),
      'Content-Type': 'application/json',
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(String(j?.error || j?.message || r.status));
  return j;
}

async function _jarvisDetectAction({ norm, pergunta, ofNum, year }) {
  const p = String(pergunta || '').trim();
  if (!p) return null;

  if (ofNum && _jarvisHasAny(norm, 'imagem', 'foto') && _jarvisHasAny(norm, 'troque', 'trocar', 'mude', 'mudar', 'altere', 'alterar', 'atualize', 'atualizar', 'adicione', 'adicionar', 'inserir', 'coloque', 'colocar')) {
    return { type: 'of_upload_image', ofNum };
  }
  if (ofNum && _jarvisHasAny(norm, 'cancele', 'cancelar', 'cancela')) {
    return { type: 'of_cancel', ofNum };
  }
  if (ofNum && _jarvisHasAny(norm, 'data de entrega', 'entrega') && _jarvisHasAny(norm, 'altere', 'alterar', 'mude', 'mudar', 'troque', 'trocar', 'para')) {
    const m = p.match(/(?:entrega|data de entrega)[^0-9]*([0-9]{1,2}\/[0-9]{1,2}(?:\/[0-9]{2,4})?)/i);
    const dt = _jarvisParseDateBrToIso(m ? m[1] : '', year);
    if (dt) return { type: 'of_set_entrega', ofNum, data: dt };
  }
  if (ofNum && _jarvisHasAny(norm, 'quantidade', 'qtd', 'caixas') && _jarvisHasAny(norm, 'altere', 'alterar', 'mude', 'mudar', 'para')) {
    const m = p.match(/(?:quantidade|qtd|caixas)[^0-9]*([0-9]{1,9})/i) || p.match(/para\s+([0-9]{1,9})\b/i);
    const q = m ? Math.trunc(Number(m[1])) : 0;
    if (q > 0) return { type: 'of_set_qtd', ofNum, qtd: q };
  }
  if (ofNum && _jarvisHasAny(norm, 'urgencia', 'urgência', 'urgente') && _jarvisHasAny(norm, 'adicione', 'adicionar', 'coloque', 'marque', 'set')) {
    return { type: 'of_set_urgente', ofNum };
  }
  if (ofNum && _jarvisHasAny(norm, 'cliente') && _jarvisHasAny(norm, 'mude', 'mudar', 'troque', 'alterar', 'altere', 'para')) {
    const m = p.match(/cliente\s+da\s+of\s+[0-9]{1,8}\s+para\s+(.+)$/i) || p.match(/cliente\s+para\s+(.+)$/i);
    const cliNome = m ? String(m[1] || '').trim() : '';
    if (cliNome) return { type: 'of_set_cliente', ofNum, clienteNome: cliNome };
  }
  if (ofNum && _jarvisHasAny(norm, 'conclua', 'concluir', 'concluida', 'concluída', 'concluido', 'concluído')) {
    const m = p.match(/\bcom\s+([0-9]{1,9})\s*(?:caixas?|cx)\b/i) || p.match(/\b([0-9]{1,9})\s*(?:caixas?|cx)\b/i);
    const qtdProd = m ? Math.trunc(Number(m[1])) : 0;
    return { type: 'of_concluir', ofNum, qtdProduzida: (qtdProd > 0 ? qtdProd : undefined) };
  }
  if (_jarvisHasAny(norm, 'entrada') && _jarvisHasAny(norm, 'chapa')) {
    const m = p.match(/entrada\s+de\s+([0-9]{1,9})\s+(?:unidades\s+)?na\s+chapa\s+(.+)$/i);
    const qtd = m ? Math.trunc(Number(m[1])) : 0;
    const chapaNome = m ? String(m[2] || '').trim() : '';
    if (qtd > 0 && chapaNome) return { type: 'chapa_entrada', qtd, chapaNome };
  }
  if (_jarvisHasAny(norm, 'estoque minimo', 'estoque mínimo') && _jarvisHasAny(norm, 'chapa') && _jarvisHasAny(norm, 'para')) {
    const m = p.match(/estoque\s+m[ií]nimo\s+da\s+chapa\s+(.+?)\s+para\s+([0-9]{1,9})\b/i);
    const chapaNome = m ? String(m[1] || '').trim() : '';
    const min = m ? Math.trunc(Number(m[2])) : 0;
    if (chapaNome && min >= 0) return { type: 'chapa_set_min', chapaNome, min };
  }
  if (_jarvisHasAny(norm, 'cadastre o cliente') && _jarvisHasAny(norm, 'telefone')) {
    const m = p.match(/cadastre\s+o\s+cliente\s+(.+?)\s+com\s+telefone\s+(.+)$/i);
    const cliNome = m ? String(m[1] || '').trim() : '';
    const tel = m ? String(m[2] || '').trim() : '';
    if (cliNome && tel) return { type: 'cliente_create', clienteNome: cliNome, telefone: tel };
  }
  if (_jarvisHasAny(norm, 'atualize o telefone') && _jarvisHasAny(norm, 'cliente') && _jarvisHasAny(norm, 'para')) {
    const m = p.match(/telefone\s+do\s+cliente\s+(.+?)\s+para\s+(.+)$/i);
    const cliNome = m ? String(m[1] || '').trim() : '';
    const tel = m ? String(m[2] || '').trim() : '';
    if (cliNome && tel) return { type: 'cliente_set_tel', clienteNome: cliNome, telefone: tel };
  }
  return null;
}

// ─── HELPERS JARVIS ───────────────────────────────────────────

async function _jarvisOfsDoCliente(cliId) {
  const cols = ['cli_id', 'cliente_id', 'cliId', 'clienteId'];
  const isMissingCol = (e) => {
    const m = String(e?.message || e || '');
    return m.includes("Could not find the '") || m.toLowerCase().includes('does not exist');
  };
  for (const col of cols) {
    try {
      const { data, error } = await supabase
        .from('ofs')
        .select(
          'id,of,numero,status,cli_id,cliente_id,descricao,prodDesc,produto,' +
          'qtd,quantidade,qtd_pedida,qtd_produzida,' +
          'ent,data_entrega,data_conclusao,data_producao,dia,' +
          'fluxo_maquinas,maq,maquina_atual_index,' +
          'urg,urgente,imagem_url,imgs,deleted_at,valor_total,valor_venda'
        )
        .eq(col, cliId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500);
      if (!error) return Array.isArray(data) ? data : [];
      if (isMissingCol(error)) continue;
      throw error;
    } catch (e) {
      if (isMissingCol(e)) continue;
      throw e;
    }
  }
  return [];
}

function _jarvisPickMaqAtualOf(o) {
  try {
    let f = o.fluxo_maquinas || o.maq || [];
    if (typeof f === 'string') f = JSON.parse(f || '[]');
    if (!Array.isArray(f) || !f.length) return '—';
    const idx = Number(o.maquina_atual_index || 0) || 0;
    const item = f[Math.min(idx, f.length - 1)] || f[0];
    if (item && typeof item === 'object') return String(item.nome || item.maquina || item.name || '').trim() || '—';
    return String(item || '').trim() || '—';
  } catch (_) { return '—'; }
}

function _jarvisPickAllImgs(o) {
  const iu = String(o.imagem_url || '').trim();
  try {
    const raw = o.imgs;
    const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : (Array.isArray(raw) ? raw : []);
    const lista = [...(iu ? [iu] : []), ...arr.map(x => String(x || '').trim())].filter(Boolean);
    return [...new Set(lista)].slice(0, 5);
  } catch (_) { return iu ? [iu] : []; }
}

function _jarvisMaqAtualOf(o) { return _jarvisPickMaqAtualOf(o); }
function _jarvisTodasImgsOf(o) { return _jarvisPickAllImgs(o); }

app.post('/api/assistente', authMiddleware, async (req, res) => {
  try {
    const { nome: nomeFull, email, perfil } = await _assistUser(req);
    const nome = _jarvisFirstName(nomeFull || email || '');
    const pergunta = String(req.body?.pergunta || req.body?.texto || req.body?.q || '').trim();
    if (!pergunta) return res.status(400).json({ ok: false, error: 'pergunta_obrigatoria' });
    const norm = _assistNorm(pergunta);
    const hoje = _assistTodayIso();
    const month = _assistMonthFromText(norm);
    const year = new Date().getFullYear();

    const respond = (txt, extra) => res.json({ ok: true, resposta: String(txt || '').trim(), ...(extra && typeof extra === 'object' ? extra : {}) });
    const naoEntendi = () => respond(
      `Desculpe ${nome}, não entendi sua pergunta. Tente perguntar sobre OFs, faturamento, estoque, clientes ou perdas.`,
      { suggestions: ['/ajuda', '/resumo', '/atrasadas', '/estoque'] }
    );

    const has = (...words) => words.every((w) => norm.includes(_assistNorm(w)));
    const hasAny = (...words) => words.some((w) => norm.includes(_assistNorm(w)));

    const empIdCtx = String(req.body?.empId || req.body?.emp_id || req.query?.empId || '').trim() || null;

    const hasMedidas = /\b\d{1,4}\s*[x×]\s*\d{1,4}\s*[x×]\s*\d{1,4}\b/i.test(pergunta);
    const hasCaixasNum = /\bcaix[a-z]*\b/i.test(pergunta) && /\b\d{1,6}\b/.test(pergunta);
    if ((hasMedidas || hasCaixasNum) && !norm.startsWith('/')) {
      try{
        const usuario_id = String(req?.usuario?.id || '').trim() || null;
        const r = await _pedidoLinguagemNaturalProcess({ texto: pergunta, empId: empIdCtx, usuario_id, req });
        if (r?.ok && r?.of) {
          const ofRow = r.of;
          const num = String(ofRow?.of || ofRow?.numero || '').trim();
          const cli = String(ofRow?.cliNome || ofRow?.cliente_nome || '').trim();
          const prod = String(ofRow?.descricao || ofRow?.prodDesc || '').trim();
          const ent = String(ofRow?.data_entrega || ofRow?.ent || '').slice(0, 10);
          const mk = String(_ofPickMaqAtualName(ofRow) || '').trim();
          return respond(
            `✅ Pedido entendido e OF criada!\n` +
            `• OF #${num || ofRow?.id}\n` +
            `• Cliente: ${cli || '—'}\n` +
            `• Produto: ${prod || '—'}\n` +
            `• Entrega: ${_assistFmtDateBr(ent)}\n` +
            (mk ? `• Sugestão/Máquina: ${mk}\n` : '') +
            `\nSe quiser, eu já te monto o sequenciamento da máquina.`,
            { dadosExtras: { tipo: 'of_criada_linguagem_natural', of_id: ofRow?.id, numero: num || null } }
          );
        }
        if (r?.erro === 'cliente_nao_encontrado') {
          const sug = Array.isArray(r?.sugestoes) ? r.sugestoes : [];
          return respond(
            `⚠️ Entendi o pedido, mas não encontrei o cliente "${String(r?.dados_extraidos?.cliente_nome || '').trim()}".\n` +
            (sug.length ? `Sugestões:\n${sug.slice(0, 8).map((x)=>`• ${x}`).join('\n')}` : `Me diga o nome do cliente como está cadastrado.`),
            { dadosExtras: { tipo: 'pedido_cliente_nao_encontrado', dados_extraidos: r?.dados_extraidos || null } }
          );
        }
        if (Array.isArray(r?.campos_faltando) && r.campos_faltando.length) {
          return respond(
            `⚠️ Entendi parcialmente, mas faltaram dados: ${r.campos_faltando.join(', ')}.\n` +
            `Me envie a frase novamente incluindo esses campos (ex: "500 caixas 30x20x15 onda B entrega 2026-05-25 cliente X").`,
            { dadosExtras: { tipo: 'pedido_campos_faltando', dados_extraidos: r?.dados_extraidos || null } }
          );
        }
      }catch(_){}
    }

    if (hasAny('perda','perdas','caixas perdidas') || (hasAny('maquina','máquina') && hasAny('perda','perdas'))) {
      try{
        const qs = new URLSearchParams();
        if(empIdCtx) qs.set('empId', empIdCtx);
        qs.set('meses', '3');
        const anal = await _jarvisCallInternal(req, '/api/analytics/padroes_perda?' + qs.toString());
        const data = anal?.data || anal || null;
        const alertas = Array.isArray(data?.alertas) ? data.alertas : [];
        const pior = data?.pior_combinacao || null;
        const msg =
          `📉 Padrões de perda (últimos ${data?.meses || 3} meses)\n` +
          (alertas.length
            ? `\n⚠️ Alertas (máquinas > 2× média geral):\n` + alertas.slice(0, 8).map((a)=>`• ${a.maquina}: média ${Math.round(Number(a.media_por_of||0))} cx/OF (geral ${Math.round(Number(a.media_geral||0))})`).join('\n')
            : `\n✅ Sem alertas acima de 2× a média geral.`) +
          (pior ? `\n\n🔥 Pior combinação: ${pior.maquina_perda} · ${pior.dia_semana} · ${pior.turno} — ${Math.round(Number(pior.total_perdido||0))} cx perdidas` : '');
        return respond(msg, { dadosExtras: { tipo: 'analise_perdas', data } });
      }catch(_){}
    }

    const imgMatch = pergunta.match(/https?:\/\/\S+/i);
    if (imgMatch && (norm.includes('recebi uma imagem') || /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(imgMatch[0]))) {
      const url = String(imgMatch[0] || '').replace(/[)\],.]+$/g, '').trim();
      if (url) return respond(`Imagem recebida!`, { images: [url], dadosExtras: { tipo: 'imagem_recebida', url } });
    }

    if (hasAny('cadastrar cliente', 'cadastre o cliente', 'novo cliente', 'adicionar cliente', 'criar cliente', 'adicione o cliente')) {
      return res.json({
        ok: true,
        resposta:
          `Vou cadastrar um novo cliente! Me informe os dados:\n` +
          `1️⃣ Qual o nome do cliente?`,
        jarvis_state: {
          acao: 'cadastrar_cliente',
          etapa: 'nome',
          dados: { nome: '', cnpj: '', tel: '', email: '', cidade: '', ramo: '', vendedor_id: null },
        },
      });
    }

    if (hasAny('quanto vamos faturar', 'previsão de faturamento', 'previsao de faturamento', 'faturamento previsto')) {
      const mesRef = new Date().toISOString().slice(0, 7);
      const [ano, mm] = mesRef.split('-').map(Number);
      const dtIni = `${mesRef}-01`;
      const dtFim = new Date(ano, mm, 0).toISOString().slice(0, 10);
      const { data: ofsRaw } = await supabase
        .from('ofs')
        .select('status,deleted_at,data_entrega,ent,data_conclusao,valor_total,valor_venda,val')
        .is('deleted_at', null)
        .limit(5000);
      const rows = Array.isArray(ofsRaw) ? ofsRaw : [];
      const ativas = rows.filter((o) => !_assistIsCancelada(o));
      const conclMes = ativas.filter((o) => {
        const dc = String(o.data_conclusao || '').slice(0, 10);
        return dc && dc >= dtIni && dc <= dtFim && _assistIsConcluida(o);
      });
      const abertasMesEntrega = ativas.filter((o) => {
        if (_assistIsConcluida(o)) return false;
        const ent = _assistPickOfEntrega(o);
        return ent && ent >= dtIni && ent <= dtFim;
      });
      const faturado = conclMes.reduce((s, o) => s + _assistPickOfValor(o), 0);
      const previstoAberto = abertasMesEntrega.reduce((s, o) => s + _assistPickOfValor(o), 0);
      const total = faturado + previstoAberto;
      return respond(
        `📊 Previsão de faturamento de ${mesRef}:\n` +
        `• Total previsto: ${_assistFmtMoney(total)}\n` +
        `• Já faturado (OFs concluídas no mês): ${_assistFmtMoney(faturado)}\n` +
        `• Em OFs abertas com entrega este mês: ${_assistFmtMoney(previstoAberto)}\n\n` +
        `💡 Por que sugiro isso: somei o valor total das OFs concluídas no mês + OFs abertas com entrega entre ${_assistFmtDateBr(dtIni)} e ${_assistFmtDateBr(dtFim)}.`
      );
    }

    if (hasAny('clientes vip', 'melhores clientes', 'quais clientes merecem atenção', 'quais clientes merecem atencao')) {
      const now = new Date();
      const dt3m = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
      const dtMesIni = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const dtMesFim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const { data: ofsRaw } = await supabase
        .from('ofs')
        .select('cli_id,cliente_id,deleted_at,status,valor_total,valor_venda,val,data_conclusao,data_entrega,ent,created_at')
        .is('deleted_at', null)
        .limit(5000);
      const rows = (Array.isArray(ofsRaw) ? ofsRaw : []).filter((o) => !_assistIsCancelada(o));
      const in3m = rows.filter((o) => {
        const dc = String(o.data_conclusao || o.created_at || '').slice(0, 10);
        return dc && dc >= dt3m;
      });
      const sumMap = new Map();
      const cntMes = new Map();
      const hadBefore = new Map();
      const hadThis = new Map();
      in3m.forEach((o) => {
        const cid = String(_assistPickOfClienteId(o) || '').trim();
        if (!cid) return;
        sumMap.set(cid, (sumMap.get(cid) || 0) + _assistPickOfValor(o));
        const dc = String(o.data_conclusao || o.created_at || '').slice(0, 10);
        if (dc >= dtMesIni && dc <= dtMesFim) {
          cntMes.set(cid, (cntMes.get(cid) || 0) + 1);
          hadThis.set(cid, true);
        } else {
          hadBefore.set(cid, true);
        }
      });
      const ids = [...new Set([...sumMap.keys()])];
      const cliMap = await _assistLoadClientesByIds(ids);
      const top = ids
        .map((id) => ({ id, valor: sumMap.get(id) || 0 }))
        .sort((a, b) => (b.valor || 0) - (a.valor || 0))
        .slice(0, 10);
      const frequentes = ids
        .filter((id) => (cntMes.get(id) || 0) >= 4)
        .sort((a, b) => (cntMes.get(b) || 0) - (cntMes.get(a) || 0))
        .slice(0, 10);
      const queda = ids
        .filter((id) => hadBefore.get(id) && !hadThis.get(id))
        .sort((a, b) => (sumMap.get(b) || 0) - (sumMap.get(a) || 0))
        .slice(0, 10);
      const lnTop = top.map((x, i) => `• ${i + 1}. ${String(cliMap.get(x.id) || '—')} — ${_assistFmtMoney(x.valor)}`);
      const lnFreq = frequentes.map((id, i) => `• ${i + 1}. ${String(cliMap.get(id) || '—')} — ${Number(cntMes.get(id) || 0)} compras no mês`);
      const lnQueda = queda.map((id, i) => `• ${i + 1}. ${String(cliMap.get(id) || '—')} — comprava antes e não comprou neste mês`);
      return respond(
        `👑 Clientes VIP (últimos 3 meses):\n\n` +
        `🥇 Top compradores:\n${lnTop.join('\n') || '—'}\n\n` +
        `📈 Mais frequentes (mês atual):\n${lnFreq.join('\n') || '—'}\n\n` +
        `⚠️ Clientes em queda:\n${lnQueda.join('\n') || '—'}\n\n` +
        `💡 Por que sugiro isso: usei as OFs dos últimos 3 meses e somei valores por cliente; frequência considera compras no mês atual; “queda” = tinha compra antes e zero neste mês.`
      );
    }

    if (/como (fa[cç]o|fazer|funciona)|me ensine|n[aã]o sei como/i.test(pergunta)) {
      const p = _assistNorm(pergunta);
      const mk = (lines) => lines.map((t, i) => `${['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣'][i] || '•'} ${t}`).join('\n');
      if (p.includes('criar') && p.includes('of')) {
        return respond(`📋 Como criar uma OF:\n` + mk([
          `Vá em PCP e clique em "+ Nova OF"`,
          `Selecione o cliente (use o autocomplete)`,
          `Preencha Produto/Descrição, Quantidade e Data de entrega`,
          `Abra "Produção" e selecione o fluxo de máquinas (sugestão é opcional)`,
          `Clique em "Salvar OF"`,
          `Dica: se precisar dividir em itens, use os itens da OF (Detalhes)`,
        ]));
      }
      if ((p.includes('entrada') || p.includes('dar entrada')) && (p.includes('estoque') || p.includes('chapa'))) {
        return respond(`📦 Como dar entrada no estoque:\n` + mk([
          `Vá em Estoque (Chapas)`,
          `Clique em "📥 Entrada em Lote"`,
          `Informe NF/fornecedor e as quantidades`,
          `Confirme e verifique se a chapa atualizou`,
        ]));
      }
      if (p.includes('concluir') && p.includes('of')) {
        return respond(`✅ Como concluir uma OF:\n` + mk([
          `No PCP, localize a OF`,
          `Use a ação de concluir (ou peça no JARVIS: "concluir OF 123")`,
          `Informe: produzidas, perdidas e a máquina`,
          `Confirme na tela`,
        ]));
      }
      if ((p.includes('cadastrar') || p.includes('cadastro') || p.includes('novo')) && p.includes('cliente')) {
        return respond(`👥 Como cadastrar cliente:\n` + mk([
          `Vá em Clientes e clique em "+ Novo Cliente"`,
          `Preencha nome e telefone (o resto é opcional)`,
          `Salve`,
          `Dica: também dá para cadastrar pelo JARVIS: "cadastrar cliente"`,
        ]));
      }
      if (p.includes('cota') || p.includes('cotacao')) {
        return respond(`🛒 Como fazer cotação:\n` + mk([
          `Vá em Compras MP`,
          `Crie uma cotação e adicione itens/quantidades`,
          `Selecione fornecedores e registre propostas`,
          `Marque o fornecedor escolhido e finalize`,
        ]));
      }
      if (p.includes('jarvis')) {
        return respond(`⚙️ Como usar o JARVIS:\n` + mk([
          `Digite um número (ex: "230") para ver uma OF`,
          `Peça ações: "concluir OF 230", "altere a OF 230"`,
          `Peça listas: "OFs do cliente X", "clientes VIP"`,
          `Peça relatórios: "relatório de estoque", "relatório de perdas"`,
        ]));
      }
      return respond(`🧠 Me diga exatamente o que você quer aprender (ex: "como criar uma OF", "como dar entrada no estoque").`);
    }

    if (hasAny('imagem', 'imagens', 'foto', 'fotos') && hasAny('cliente')) {
      const m =
        pergunta.match(/(?:imagens?|fotos?)\s+(?:das?\s+)?(?:ofs?\s+)?(?:do\s+)?(?:cliente\s+)?(.+)$/i) ||
        pergunta.match(/(?:cliente)\s+(.+)$/i) ||
        null;
      const cliNome = m ? String(m[1] || '').trim() : '';
      if (cliNome) {
        const termo = cliNome.replace(/%/g, '').trim();
        const { data: clientesRaw } = await supabase
          .from('clientes')
          .select('id,nome')
          .ilike('nome', `%${termo}%`)
          .limit(5);
        const clientes = Array.isArray(clientesRaw) ? clientesRaw : [];
        if (!clientes.length) return respond(`${nome}, não encontrei nenhum cliente com o nome "${cliNome}".`);

        const all = [];
        for (const c of clientes) {
          const cid = String(c?.id || '').trim();
          if (!cid) continue;
          const ofsCli = await _jarvisOfsDoCliente(cid);
          (Array.isArray(ofsCli) ? ofsCli : []).forEach((o) => all.push({ ...o, _cliNome: String(c.nome || '').trim() }));
        }
        const seen = new Set();
        const ofs = all.filter((o) => {
          const id = String(o.id || '').trim() || String(o.of || o.numero || '').trim();
          if (!id) return false;
          if (_assistIsCancelada(o)) return false;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        const ofsComImg = ofs.map((o) => {
          const urls = _jarvisTodasImgsOf(o);
          return { o, url: (Array.isArray(urls) && urls[0]) ? String(urls[0] || '').trim() : '' };
        }).filter((x) => !!x.url).slice(0, 20);
        const cli0 = clientes[0];
        const cliNome0 = String(cli0?.nome || cliNome || '').trim() || cliNome;
        if (!ofsComImg.length) {
          return respond(`${nome}, encontrei ${ofs.length} OFs do cliente "${cliNome0}", mas nenhuma possui imagem cadastrada.`);
        }

        const imagens = ofsComImg.map(({ o, url }) => ({
          numero: o.of || o.numero || '',
          descricao: String(o.descricao || o.prodDesc || o.produto || '').trim(),
          imgUrl: url,
          status: String(o.status || '').trim(),
        }));
        return respond(
          `${nome}, aqui estão as imagens das OFs de "${cliNome0}" (${imagens.length} OFs com imagem):`,
          { dadosExtras: { tipo: 'galeria_imagens', imagens } }
        );
      }
    }

    if (/^\s*\d{1,4}\s*$/.test(pergunta)) {
      const n = String(pergunta || '').trim();
      const of = await _jarvisFindOFByNumero(n);
      if (!of) return respond(`Não encontrei nenhuma OF com o número ${n}. Verifique o número e tente novamente.`);
      const cid = _assistPickOfClienteId(of);
      const cliMap = await _assistLoadClientesByIds([cid]);
      const cNome = String(cliMap.get(cid) || of.cliNome || of.cliente_nome || '—').trim() || '—';
      const numOf = _assistPickOfNumber(of);
      const produto = String(of.descricao || of.prodDesc || of.produto || of.prod || '').trim() || '—';
      const qtd = Math.trunc(Number(of.qtd_pedida || of.qtd_produzida || of.quantidade || of.qtd || 0) || 0);
      const valor = _assistPickOfValor(of);
      const status = String(of.status || '—').trim() || '—';
      const diaPedido = String(of.data_pedido || of.dia || of.data || of.created_at || '').slice(0, 10);
      const entrega = _assistPickOfEntrega(of);
      const urg = !!(of.urg || of.urgente);
      const emp = String(of.emp_id || of.empId || of.empresa || of.empresa_id || '').trim() || '—';
      const obs = String(of.obs || of.observacao || '').trim();
      const fluxo = parseFluxo(of.fluxo_maquinas || of.maq || of.maquinas || of.etapas || []);
      const fluxoTxt = fluxo.length ? fluxo.map((x) => String(x || '').trim()).filter(Boolean).join(' → ') : '—';
      const texto =
        `📋 OF #${numOf}\n` +
        `👤 Cliente: ${cNome}\n` +
        `📦 Produto: ${produto}\n` +
        `📦 Quantidade: ${qtd.toLocaleString('pt-BR')} caixas\n` +
        `💰 Valor: ${valor ? _assistFmtMoney(valor) : '—'}\n` +
        `🏷 Status: ${status}\n` +
        `📅 Data do pedido: ${diaPedido ? _assistFmtDateBr(diaPedido) : '—'}\n` +
        `🚚 Entrega: ${entrega ? _assistFmtDateBr(entrega) : '—'}\n` +
        `🏭 Máquinas: ${fluxoTxt}\n` +
        `⚡ Urgente: ${urg ? 'Sim' : 'Não'}\n` +
        `🏢 Empresa: ${emp}\n` +
        (obs ? `📝 Observações: ${obs}\n` : '');

      const imgs203 = _jarvisTodasImgsOf ? _jarvisTodasImgsOf(of) : [];
      if (imgs203 && imgs203.length) {
        return res.json({
          ok: true,
          resposta: texto,
          images: imgs203,
          dadosExtras: { tipo: 'of_imagem', of_id: of.id, numero: numOf, imagem_url: imgs203[0]||null, imgs: imgs203, acoes_imagem: ['abrir','baixar','imprimir'] }
        });
      }
      return respond(texto);
    }

    if (norm.includes('pdf') && (norm.includes('cliente') || norm.includes('relatorio') || norm.includes('relatório'))) {
      const mCli = pergunta.match(/(?:pdf|relat[oó]rio)\s+(?:do\s+)?(?:cliente\s+)?(.+)$/i) || pergunta.match(/cliente\s+(.+?)(?:\s+pdf|\s+relat|\s*$)/i) || null;
      const cliNomeBusca = mCli ? String(mCli[1]||'').trim().replace(/\?+$/,'').trim() : '';
      if (!cliNomeBusca) return respond(`${nome}, qual o nome do cliente para o PDF?`);
      const { data: cls } = await supabase.from('clientes').select('id,nome').ilike('nome',`%${cliNomeBusca.replace(/%/g,'')}%`).limit(3);
      const clientes = Array.isArray(cls) ? cls : [];
      if (!clientes.length) return respond(`${nome}, não encontrei cliente com "${cliNomeBusca}".`);
      const cli = clientes[0];
      const urlPdf = `/api/relatorio/cliente_pdf?cliente_id=${encodeURIComponent(cli.id)}&cliente_nome=${encodeURIComponent(cli.nome)}`;
      return res.json({
        ok: true,
        resposta: `${nome}, PDF das OFs de **${cli.nome}** pronto! Clique no link abaixo para abrir, imprimir ou salvar:`,
        dadosExtras: { tipo: 'pdf_link', url: urlPdf, cliente_nome: cli.nome, label: `📄 Abrir PDF — ${cli.nome}` }
      });
    }

    if (
      hasAny('ofs do cliente','of do cliente','ofs da cliente','situação do cliente',
        'situacao do cliente','tem of do cliente','ofs abertas do cliente',
        'pedidos do cliente','quantas ofs tem o cliente','quantas ofs do cliente',
        'quais ofs do cliente','pedidos abertos do cliente','status do cliente',
        'situação das ofs do cliente','pdf do cliente','relatorio do cliente',
        'relatório do cliente')
    ) {
      const mCli =
        pergunta.match(/(?:ofs?|pedidos?|situa[cç][aã]o|quantas ofs (?:tem|do)|pdf|relat[oó]rio)\s+(?:o\s+)?(?:do\s+|da\s+)?(?:cliente\s+)?(.+)$/i) ||
        pergunta.match(/cliente\s+(.+)$/i) || null;
      const cliNomeBusca = mCli ? String(mCli[1]||'').trim().replace(/\?+$/,'').trim() : '';
      if (!cliNomeBusca) return respond(`${nome}, me diga o nome do cliente.`);

      const { data: cls } = await supabase.from('clientes').select('id,nome,cidade,cnpj,tel,telefone').ilike('nome',`%${cliNomeBusca.replace(/%/g,'')}%`).limit(5);
      const clientes = Array.isArray(cls) ? cls : [];
      if (!clientes.length) return respond(`${nome}, não encontrei cliente com "${cliNomeBusca}".`);

      const cli = clientes[0];
      const cliNome = String(cli.nome||'').trim();
      const cliId = String(cli.id||'').trim();
      const todasOfsCliente = await _jarvisOfsDoCliente(cliId);

      const abertas    = todasOfsCliente.filter(o => { const s=String(o.status||'').toLowerCase(); return !s.includes('conclu')&&!s.includes('cancel'); });
      const concluidas = todasOfsCliente.filter(o => String(o.status||'').toLowerCase().includes('conclu'));
      const canceladas = todasOfsCliente.filter(o => String(o.status||'').toLowerCase().includes('cancel'));
      const atrasadas  = abertas.filter(o => { const e=String(o.data_entrega||o.ent||'').slice(0,10); return e && e < hoje; });
      const urgentes   = abertas.filter(o => o.urg || o.urgente);

      // agrupa abertas por status
      const porStatus = {};
      abertas.forEach(o => {
        const s = String(o.status||'Em aberto').trim();
        if (!porStatus[s]) porStatus[s] = 0;
        porStatus[s]++;
      });
      const statusResumo = Object.entries(porStatus).map(([s,n])=>`${s}: ${n}`).join(' | ');

      const totalCaixasAbertas = abertas.reduce((s,o)=>s+Math.trunc(Number(o.qtd_pedida||o.quantidade||o.qtd||0)||0),0);
      const totalValorAbertas  = abertas.reduce((s,o)=>s+Number(o.valor_total||o.valor_venda||0),0);

      const fmtOf = (o) => {
        const num  = String(o.of||o.numero||'—');
        const desc = String(o.descricao||o.prodDesc||o.produto||'—').trim();
        const qtd  = Math.trunc(Number(o.qtd_pedida||o.quantidade||o.qtd||0)||0);
        const ent  = String(o.data_entrega||o.ent||'').slice(0,10);
        const dia  = String(o.data_producao||o.dia||'').slice(0,10);
        const maq  = _jarvisMaqAtualOf(o);
        const atras = ent && ent < hoje;
        const atrDias = atras ? Math.floor((new Date(hoje)-new Date(ent))/86400000) : 0;
        return (
          `• OF #${num}${(o.urg||o.urgente)?' 🚨':''}${atras?' ⚠️':''} [${String(o.status||'').trim()}]\n`+
          `  ${desc} | ${qtd.toLocaleString('pt-BR')} cx\n`+
          `  Entrega: ${ent?_assistFmtDateBr(ent):'—'}${atras?` (${atrDias}d atraso)`:''} | Prod: ${dia?_assistFmtDateBr(dia):'—'}\n`+
          `  Máquina: ${maq}`
        );
      };
      const fmtConc = (o) => {
        const num  = String(o.of||o.numero||'—');
        const desc = String(o.descricao||o.prodDesc||o.produto||'—').trim();
        const qtd  = Math.trunc(Number(o.qtd_produzida||o.qtd||0)||0);
        const dc   = String(o.data_conclusao||'').slice(0,10);
        const val  = Number(o.valor_total||o.valor_venda||0);
        return `• OF #${num} — ${desc} — ${qtd.toLocaleString('pt-BR')} cx${dc?` — ${_assistFmtDateBr(dc)}`:''}${val>0?` — R$ ${val.toLocaleString('pt-BR',{minimumFractionDigits:2})}`:''}`;
      };

      const pedirPdf = norm.includes('pdf') || norm.includes('relatorio') || norm.includes('relatório');

      const linhas = [
        `📋 **${cliNome}**${cli.cidade?' — '+cli.cidade:''}`,
        cli.cnpj ? `CNPJ: ${cli.cnpj}` : null,
        ``,
        `📊 RESUMO:`,
        `🔵 Em aberto: ${abertas.length} (${totalCaixasAbertas.toLocaleString('pt-BR')} cx | R$ ${totalValorAbertas.toLocaleString('pt-BR',{minimumFractionDigits:2})})`,
        abertas.length > 0 ? `   Status: ${statusResumo}` : null,
        atrasadas.length > 0 ? `   ⚠️ Atrasadas: ${atrasadas.length}` : null,
        urgentes.length > 0  ? `   🚨 Urgentes: ${urgentes.length}` : null,
        `✅ Concluídas: ${concluidas.length}`,
        canceladas.length > 0 ? `❌ Canceladas: ${canceladas.length}` : null,
        ``,
        `🔵 OFs EM ABERTO:`,
        ...abertas.slice(0,10).map(fmtOf),
        abertas.length > 10 ? `  ...e mais ${abertas.length-10} OFs abertas` : null,
        ``,
        `✅ ÚLTIMAS CONCLUÍDAS:`,
        ...concluidas.slice(0,5).map(fmtConc),
        concluidas.length > 5 ? `  ...e mais ${concluidas.length-5} concluídas` : null,
        pedirPdf ? `\n📄 Para gerar o PDF deste cliente, diga: "gerar PDF do cliente ${cliNome}"` : null,
      ].filter(x => x !== null);

      return respond(linhas.join('\n'), {
        dadosExtras: {
          tipo: 'cliente_ofs',
          cliente_id: cliId,
          cliente_nome: cliNome,
          total_abertas: abertas.length,
          total_concluidas: concluidas.length,
          total_canceladas: canceladas.length,
          atrasadas: atrasadas.length,
          urgentes: urgentes.length,
          total_caixas_abertas: totalCaixasAbertas,
          total_valor_abertas: totalValorAbertas,
        }
      });
    }

    if (hasAny('relatório de', 'relatorio de', 'relatório sobre', 'relatorio sobre', 'me dê um relatório', 'me de um relatorio')) {
      const temaRaw =
        (pergunta.match(/relat[óo]rio\s+(?:de|sobre)\s+(.+)$/i)?.[1]) ||
        (pergunta.match(/me\s+d[êe]\s+um\s+relat[óo]rio\s+(?:de|sobre)\s+(.+)$/i)?.[1]) ||
        '';
      const tema = String(temaRaw || '').trim();
      if (!tema) return respond(`${nome}, qual tema você quer no relatório? Ex: OFs, clientes, estoque, perdas, faturamento, máquinas, fornecedores.`);

      const tnorm = _assistNorm(tema);
      let assunto = 'geral';
      if (tnorm.includes('of')) assunto = 'ofs';
      else if (tnorm.includes('client')) assunto = 'clientes';
      else if (tnorm.includes('estoque') || tnorm.includes('chapa')) assunto = 'estoque';
      else if (tnorm.includes('perda') || tnorm.includes('caixas perdidas')) assunto = 'perdas';
      else if (tnorm.includes('fatur') || tnorm.includes('venda')) assunto = 'faturamento';
      else if (tnorm.includes('maquin')) assunto = 'maquinas';
      else if (tnorm.includes('fornec')) assunto = 'fornecedores';

      const dados = {};
      if (assunto === 'ofs') {
        const { data } = await supabase.from('ofs').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(500);
        dados.ofs = data || [];
      } else if (assunto === 'clientes') {
        const { data } = await supabase.from('clientes').select('*').limit(500);
        dados.clientes = data || [];
      } else if (assunto === 'estoque') {
        const { data } = await supabase.from('chapas_estoque').select('*').limit(500);
        dados.estoque = data || [];
      } else if (assunto === 'perdas') {
        const { data } = await supabase.from('caixas_perdidas').select('*').order('data', { ascending: false }).limit(500);
        dados.perdas = data || [];
      } else if (assunto === 'maquinas') {
        const { data } = await supabase.from('maquinas').select('*').order('ordem', { ascending: true }).limit(500);
        dados.maquinas = data || [];
      } else if (assunto === 'fornecedores') {
        const { data } = await supabase.from('fornecedores').select('*').limit(500);
        dados.fornecedores = data || [];
      } else if (assunto === 'faturamento') {
        const { data } = await supabase.from('ofs').select('id,of,numero,status,valor_total,valor_venda,val,emp_id,data_conclusao,created_at,deleted_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(1000);
        dados.ofs = data || [];
      } else {
        const ctx = await _jarvisBuildContext({ pergunta, norm, hoje, month, year, nomeUsuario: nome });
        Object.assign(dados, ctx || {});
      }

      const useClaude = !!String(process.env.ANTHROPIC_API_KEY || '').trim();
      if (!useClaude) {
        return respond(`${nome}, para gerar relatório automático eu preciso da chave ANTHROPIC_API_KEY configurada no servidor.`);
      }

      const perguntaRel =
        `Gere um relatório completo sobre: ${tema}.\n` +
        `Responda SOMENTE com HTML (sem Markdown) usando <h2>, <p>, <ul> e uma <table class="jarvis-table"> para os dados.\n` +
        `Inclua: resumo executivo, dados em tabela, insights principais e sugestões de ação.\n` +
        `Não inclua <script>.\n` +
        `DADOS:\n${JSON.stringify(dados || {}, null, 2)}`;

      const rClaude = await _jarvisCallClaude({ pergunta: perguntaRel, nomeUsuario: nome, dadosContexto: {}, historico: req.body?.historico || [] });
      if (!rClaude.ok) return respond(`${nome}, não consegui gerar o relatório agora (${String(rClaude.error || 'erro')}).`);
      return res.json({
        ok: true,
        resposta: `📄 Relatório pronto: ${tema}`,
        html: String(rClaude.text || '').trim(),
        report: true,
      });
    }

    if (/tutorial|como usar|me ensine|como funciona|ajuda geral/i.test(pergunta)) {
      return res.json({
        ok: true,
        resposta:
          `⚙️ Tutorial do Sistema Italy Embalagens\n\n` +
          `📋 PCP / Ordens de Fabricação (OFs)\n` +
          `- Para criar uma OF: Menu PCP → botão "+ Nova OF" → preencha cliente, produto, máquinas, quantidade e data de entrega\n` +
          `- Para clonar uma OF existente: clique em "Clonar" nas ações da OF → ajuste data e quantidade → Salvar\n` +
          `- Para concluir uma OF: botão "▶" na OF → informar quantidade produzida → Concluir\n` +
          `- Para cancelar: botão vermelho "Cancelar OF"\n` +
          `- Para comparar OFs: marque 2 checkboxes → botão "⚖️ Comparar OFs"\n\n` +
          `📦 Estoque de Chapas\n` +
          `- Para dar entrada: Estoques → Chapas → "Entrada em Lote" → informe NF, chapas e quantidades\n` +
          `- Para ver estoque crítico: itens em vermelho estão abaixo do mínimo\n` +
          `- Para ajustar quantidade: clique na chapa → botão "Movimentação"\n` +
          `- Gerar QR Code: botão QR na chapa para identificação física\n\n` +
          `👥 Clientes\n` +
          `- Cadastrar: Cadastros → Clientes → "+ Novo Cliente"\n` +
          `- Ver histórico completo: clique no cliente → abas OFs, Financeiro, Visitas\n` +
          `- Importar em massa: botão "Importar Excel"\n` +
          `- Verificar duplicatas: botão "Verificar Duplicatas"\n\n` +
          `📊 Relatórios\n` +
          `- Exportar Excel: botão "⬇ Excel" em qualquer listagem\n` +
          `- Relatórios do PCP: botão "📄 Relatório" com seleção de período\n\n` +
          `🎯 Comandos rápidos do JARVIS\n` +
          `- /resumo — resumo completo do dia\n` +
          `- /atrasadas — OFs em atraso\n` +
          `- /estoque — estoque de chapas\n` +
          `- /dashboard — faturamento do ano\n` +
          `- /ajuda — lista de comandos\n\n` +
          `Quer tutorial detalhado de alguma área específica?`,
        suggestions: ['Como criar OF', 'Como dar entrada no estoque', 'Como cadastrar cliente', '/ajuda'],
      });
    }
    if (/como criar.*(of|ordem)/i.test(pergunta)) {
      return res.json({
        ok: true,
        resposta:
          `📋 Como criar uma OF (PCP)\n` +
          `1) Abra o menu PCP\n` +
          `2) Clique em "+ Nova OF"\n` +
          `3) Preencha cliente, descrição/produto, quantidade e data de entrega\n` +
          `4) Selecione o fluxo de máquinas\n` +
          `5) Clique em "Salvar"\n\n` +
          `Dica: para reaproveitar uma OF parecida, use "Clonar" e ajuste data/quantidade.`,
        suggestions: ['Clonar OF', 'Concluir OF', 'Cancelar OF'],
      });
    }
    if (/como.*(entrada|estoque|chapa)/i.test(pergunta)) {
      return res.json({
        ok: true,
        resposta:
          `📦 Como dar entrada no estoque de chapas\n` +
          `1) Vá em Estoques → Chapas\n` +
          `2) Clique em "Entrada em Lote"\n` +
          `3) Informe NF, selecione as chapas e quantidades\n` +
          `4) Confirme para registrar a movimentação\n\n` +
          `Dica: itens abaixo do mínimo ficam destacados como críticos.`,
        suggestions: ['/estoque', 'Estoque crítico', 'Movimentação de chapa'],
      });
    }
    if (/como.*(cliente|cadastr)/i.test(pergunta)) {
      return res.json({
        ok: true,
        resposta:
          `👥 Como cadastrar um cliente\n` +
          `1) Cadastros → Clientes\n` +
          `2) Clique em "+ Novo Cliente"\n` +
          `3) Preencha os dados principais (nome, telefone, CNPJ, endereço)\n` +
          `4) Salve\n\n` +
          `Dica: se existir duplicidade, use a verificação de duplicatas antes de cadastrar novamente.`,
        suggestions: ['Clientes inativos', 'Cliente existe X?', 'Top clientes do mês'],
      });
    }
    if (/como.*(relatorio|relatório|dre|faturamento)/i.test(pergunta)) {
      return res.json({
        ok: true,
        resposta:
          `📊 Como usar relatórios\n` +
          `- No PCP: use "📄 Relatório" e selecione o período\n` +
          `- Para exportar: use "⬇ Excel" nas listagens\n` +
          `- Para indicadores: use /dashboard (faturamento anual) e "Faturamento do mês"\n\n` +
          `Se você me disser o período (ex: abril/2026), eu resumo os números.`,
        suggestions: ['/dashboard', 'Faturamento do mês', 'Faturamento por empresa'],
      });
    }

    const ofNumMatch = norm.match(/\b(?:of|ordem)\s*(?:#|n|nº|no|numero|número)?\s*([0-9]{1,8})\b/);
    let ofNum = ofNumMatch ? String(ofNumMatch[1]) : '';
    const match = pergunta.match(/\b(\d+)\b/);
    if (!ofNum && match) ofNum = String(match[1] || '').trim();
    const historico = req.body?.historico || req.body?.history || null;
    if (!ofNum && historico && (_jarvisHasAny(norm, 'ela', 'anterior', 'anterior?', 'da anterior') || (norm.includes('of') && _jarvisHasAny(norm, 'anterior')))) {
      ofNum = _jarvisLastOfNumFromHistory(historico);
    }

    if (ofNum && hasAny('programa','programar','agendar','agende','mover para','move para') && hasAny('of','ordem')) {
      const of = await _jarvisFindOFByNumero(ofNum);
      if (!of) return respond(`${nome}, não encontrei a OF #${ofNum}.`);

      const mMaq = pergunta.match(/(?:na|para a|máquina|maquina)\s+([A-Z0-9\s]+?)(?:\s+para|\s+amanhã|\s+dia|\s*$)/i);
      const mData = pergunta.match(/(?:para\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i) ||
                    (norm.includes('amanhã') || norm.includes('amanha') ? ['','amanhã'] : null);

      const maqNova = mMaq ? String(mMaq[1]||'').trim().toUpperCase() : '';
      let dataNova = '';
      if (mData && mData[1] !== 'amanhã') {
        const partes = mData[1].split('/');
        const y = partes[2] ? (partes[2].length === 2 ? '20'+partes[2] : partes[2]) : new Date().getFullYear();
        dataNova = `${y}-${String(partes[1]).padStart(2,'0')}-${String(partes[0]).padStart(2,'0')}`;
      } else if (norm.includes('amanhã') || norm.includes('amanha')) {
        const d = new Date(); d.setDate(d.getDate()+1);
        dataNova = d.toISOString().slice(0,10);
      }

      const nOf = _assistPickOfNumber(of);
      const uid = String(req?.usuario?.id||'');
      const actionId = _jarvisStoreAction(uid, { type:'of_programar', ofId:String(of.id), ofNum:nOf, maqNova, dataProducao:dataNova });

      const detalhes = [
        maqNova ? `Máquina: ${maqNova}` : null,
        dataNova ? `Data de produção: ${dataNova.split('-').reverse().join('/')}` : null,
      ].filter(Boolean).join(' | ');

      return res.json({
        ok:true,
        resposta:`${nome}, confirmar programação da OF #${nOf}?\n${detalhes}`,
        actions:[
          {id:actionId,label:'✅ Confirmar',decision:'confirm'},
          {id:actionId,label:'❌ Cancelar',decision:'cancel'},
        ]
      });
    }

    if (ofNum && hasAny('clonar','clone','copiar','cópia','duplicar')) {
      const of = await _jarvisFindOFByNumero(ofNum);
      if (!of) return respond(`${nome}, não encontrei a OF #${ofNum}.`);

      const mData = pergunta.match(/(?:entrega|para)\s+(?:dia\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
      const mCli  = pergunta.match(/(?:para o|para a|cliente)\s+(.+?)(?:\s+com|\s+entrega|\s*$)/i);
      let novaEntrega = '';
      if (mData) {
        const p = mData[1].split('/');
        const y = p[2] ? (p[2].length===2?'20'+p[2]:p[2]) : new Date().getFullYear();
        novaEntrega = `${y}-${String(p[1]).padStart(2,'0')}-${String(p[0]).padStart(2,'0')}`;
      }
      let novoCliNome = mCli ? String(mCli[1]||'').trim() : '';
      let novoCliId = of.cli_id || of.cliente_id || of.cliId || null;
      if (novoCliNome) {
        const {data:clsC} = await supabase.from('clientes').select('id,nome').ilike('nome',`%${novoCliNome}%`).limit(1);
        if (Array.isArray(clsC)&&clsC[0]) { novoCliId=clsC[0].id; novoCliNome=clsC[0].nome; }
      }

      const nOf = _assistPickOfNumber(of);
      const uid = String(req?.usuario?.id||'');
      const actionId = _jarvisStoreAction(uid, {type:'of_clonar', ofId:String(of.id), ofNum:nOf, novaEntrega, novoCliId, novoCliNome});

      return res.json({
        ok:true,
        resposta:`${nome}, confirmar clonagem da OF #${nOf}?\n${novoCliNome?'Novo cliente: '+novoCliNome:'Mesmo cliente'}${novaEntrega?' | Nova entrega: '+novaEntrega.split('-').reverse().join('/'):''}`,
        actions:[
          {id:actionId,label:'✅ Confirmar',decision:'confirm'},
          {id:actionId,label:'❌ Cancelar',decision:'cancel'},
        ]
      });
    }

    if (hasAny('mover todas','reagendar todas','reprogramar todas') && hasAny('ofs','of')) {
      const mMaq = pergunta.match(/(?:da|de)\s+([A-Z0-9\s]+?)(?:\s+de|\s+para|\s*$)/i);
      const maqNome = mMaq ? String(mMaq[1]||'').trim().toUpperCase() : '';
      let dataDestino = '';
      if (norm.includes('amanhã')||norm.includes('amanha')) {
        const d=new Date(); d.setDate(d.getDate()+1); dataDestino=d.toISOString().slice(0,10);
      } else {
        const mData = pergunta.match(/para\s+(?:dia\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
        if (mData) { const p=mData[1].split('/'); const y=p[2]?(p[2].length===2?'20'+p[2]:p[2]):new Date().getFullYear(); dataDestino=`${y}-${String(p[1]).padStart(2,'0')}-${String(p[0]).padStart(2,'0')}`; }
      }
      if (!maqNome||!dataDestino) return respond(`${nome}, preciso saber a máquina e a data destino. Ex: "mover todas as OFs da IMP 03 para amanhã"`);

      const {data:ofsMaq} = await supabase.from('ofs').select('id,of,numero,dia,data_producao,fluxo_maquinas,maq,maquina_atual_index,status').is('deleted_at',null).limit(500);
      const lista = (Array.isArray(ofsMaq)?ofsMaq:[]).filter(o=>{
        let f=o.fluxo_maquinas||o.maq||[];
        if(typeof f==='string'){try{f=JSON.parse(f);}catch(_){f=[];}}
        if(!Array.isArray(f)) return false;
        const idx=Number(o.maquina_atual_index||0)||0;
        const item=f[Math.min(idx,f.length-1)]||f[0];
        const mNome=item&&typeof item==='object'?String(item.nome||item.maquina||'').trim():String(item||'').trim();
        return mNome.toUpperCase()===maqNome;
      });

      if (!lista.length) return respond(`${nome}, não encontrei OFs abertas na máquina ${maqNome}.`);
      const uid = String(req?.usuario?.id||'');
      const actionId = _jarvisStoreAction(uid,{type:'of_reagendar_lote', maqNome, dataDestino, ids:lista.map(o=>o.id)});
      return res.json({
        ok:true,
        resposta:`${nome}, confirmar reagendamento de ${lista.length} OFs da ${maqNome} para ${dataDestino.split('-').reverse().join('/')}?`,
        actions:[{id:actionId,label:'✅ Confirmar',decision:'confirm'},{id:actionId,label:'❌ Cancelar',decision:'cancel'}]
      });
    }

    if (hasAny('fila','fila da','fila de') && (norm.match(/\b(imp|cor|acab|vinco|maq)\b/i) || norm.includes('maquina') || norm.includes('máquina'))) {
      const mMaq = pergunta.match(/(?:fila\s+(?:da|de|do)\s+)([A-Z0-9\s]+?)(?:\?|$)/i) ||
                   pergunta.match(/(?:da|de|do)\s+([A-Z0-9\s]+?)(?:\?|$)/i);
      const maqBusca = mMaq ? String(mMaq[1]||'').trim().toUpperCase() : '';
      if (!maqBusca) return respond(`${nome}, qual máquina? Ex: "fila da IMP 02"`);

      const {data:ofsAll} = await supabase.from('ofs').select('id,of,numero,status,cliNome,cliente_nome,cli_id,descricao,prodDesc,qtd,quantidade,qtd_pedida,data_entrega,ent,dia,data_producao,fluxo_maquinas,maq,maquina_atual_index,urg,urgente,deleted_at').is('deleted_at',null).limit(500);
      const fila = (Array.isArray(ofsAll)?ofsAll:[]).filter(o=>{
        const s=String(o.status||'').toLowerCase();
        if(s.includes('conclu')||s.includes('cancel')) return false;
        let f=o.fluxo_maquinas||o.maq||[];
        if(typeof f==='string'){try{f=JSON.parse(f);}catch(_){f=[];}}
        if(!Array.isArray(f)||!f.length) return false;
        const idx=Number(o.maquina_atual_index||0)||0;
        const item=f[Math.min(idx,f.length-1)]||f[0];
        const mNome=item&&typeof item==='object'?String(item.nome||item.maquina||'').trim():String(item||'').trim();
        return mNome.toUpperCase()===maqBusca;
      }).sort((a,b)=>{
        const urgA=(a.urg||a.urgente)?0:1; const urgB=(b.urg||b.urgente)?0:1;
        if(urgA!==urgB) return urgA-urgB;
        const ea=String(a.data_entrega||a.ent||''); const eb=String(b.data_entrega||b.ent||'');
        return ea.localeCompare(eb);
      });

      if(!fila.length) return respond(`${nome}, a máquina ${maqBusca} não tem OFs na fila agora.`);
      const cliIds=fila.map(o=>String(o.cli_id||o.cliente_id||'').trim()).filter(Boolean);
      const cliMap=await _assistLoadClientesByIds(cliIds);
      const totalCx=fila.reduce((s,o)=>s+Math.trunc(Number(o.qtd_pedida||o.quantidade||o.qtd||0)||0),0);

      const linhas=fila.slice(0,15).map((o,i)=>{
        const num=String(o.of||o.numero||'—');
        const cli=String(cliMap.get(String(o.cli_id||o.cliente_id||'').trim())||o.cliNome||o.cliente_nome||'—').trim();
        const desc=String(o.descricao||o.prodDesc||'').trim();
        const qtd=Math.trunc(Number(o.qtd_pedida||o.quantidade||o.qtd||0)||0);
        const ent=String(o.data_entrega||o.ent||'').slice(0,10);
        const dia=String(o.data_producao||o.dia||'').slice(0,10);
        const atras=ent&&ent<hoje;
        return `${i+1}. OF #${num}${(o.urg||o.urgente)?' 🚨':''}${atras?' ⚠️':''} — ${cli}\n   ${desc} | ${qtd.toLocaleString('pt-BR')} cx | Entrega: ${ent?ent.split('-').reverse().join('/'):'—'} | Prod: ${dia?dia.split('-').reverse().join('/'):'—'}`;
      });

      return respond(`🏭 Fila da ${maqBusca}: ${fila.length} OF${fila.length!==1?'s':''} (${totalCx.toLocaleString('pt-BR')} cx)\n\n${linhas.join('\n')}${fila.length>15?'\n...e mais '+(fila.length-15)+' OFs':''}`);
    }

    if (hasAny('como está a produção','como esta a producao','produção agora','producao agora','status da produção','status da producao')) {
      const {data:ofsAbRaw} = await supabase.from('ofs').select('id,status,fluxo_maquinas,maq,maquina_atual_index,qtd,quantidade,qtd_pedida,deleted_at').is('deleted_at',null).limit(800);
      const ofsAb=(Array.isArray(ofsAbRaw)?ofsAbRaw:[]).filter(o=>{const s=String(o.status||'').toLowerCase();return !s.includes('conclu')&&!s.includes('cancel');});

      const {data:conclHoje} = await supabase.from('ofs').select('id,qtd_produzida,qtd,quantidade,valor_total,valor_venda').gte('data_conclusao',hoje).is('deleted_at',null).limit(500);
      const conclH=Array.isArray(conclHoje)?conclHoje:[];
      const cxHoje=conclH.reduce((s,o)=>s+Math.trunc(Number(o.qtd_produzida||o.qtd||0)||0),0);
      const fatHoje=conclH.reduce((s,o)=>s+Number(o.valor_total||o.valor_venda||0),0);

      const maqMap=new Map();
      ofsAb.forEach(o=>{
        let f=o.fluxo_maquinas||o.maq||[];
        if(typeof f==='string'){try{f=JSON.parse(f);}catch(_){f=[];}}
        if(!Array.isArray(f)||!f.length) return;
        const idx=Number(o.maquina_atual_index||0)||0;
        const item=f[Math.min(idx,f.length-1)]||f[0];
        const mNome=item&&typeof item==='object'?String(item.nome||item.maquina||'').trim():String(item||'').trim();
        if(!mNome) return;
        if(!maqMap.has(mNome)) maqMap.set(mNome,{ofs:0,caixas:0});
        const cur=maqMap.get(mNome);
        cur.ofs++;
        cur.caixas+=Math.trunc(Number(o.qtd_pedida||o.quantidade||o.qtd||0)||0);
      });

      const maqLinhas=[...maqMap.entries()].sort((a,b)=>b[1].ofs-a[1].ofs).slice(0,8).map(([m,v])=>`  🏭 ${m}: ${v.ofs} OF${v.ofs!==1?'s':''} (${v.caixas.toLocaleString('pt-BR')} cx)`);
      const totalCxAb=ofsAb.reduce((s,o)=>s+Math.trunc(Number(o.qtd_pedida||o.quantidade||o.qtd||0)||0),0);

      return respond(
        `📊 Produção agora (${hoje.split('-').reverse().join('/')}):\n\n`+
        `🔵 Em produção: ${ofsAb.length} OFs (${totalCxAb.toLocaleString('pt-BR')} cx)\n`+
        `✅ Concluídas hoje: ${conclH.length} OFs (${cxHoje.toLocaleString('pt-BR')} cx)\n`+
        `💰 Faturado hoje: R$ ${fatHoje.toLocaleString('pt-BR',{minimumFractionDigits:2})}\n\n`+
        `Carga por máquina:\n${maqLinhas.join('\n')||'  —'}`
      );
    }

    if (hasAny('histórico do cliente','historico do cliente','histórico de compras','historico de compras','ticket médio','ticket medio')) {
      const mCli=pergunta.match(/(?:histórico|historico|ticket)\s+(?:do|da|de)\s+(?:cliente\s+)?(.+?)(?:\?|$)/i)||pergunta.match(/cliente\s+(.+?)(?:\?|$)/i)||null;
      const cliNomeBusca=mCli?String(mCli[1]||'').trim().replace(/\?+$/,'').trim():'';
      if(!cliNomeBusca) return respond(`${nome}, qual o cliente? Ex: "histórico do cliente Padaria X"`);
      const {data:cls}=await supabase.from('clientes').select('id,nome,cidade,tel,telefone').ilike('nome',`%${cliNomeBusca.replace(/%/g,'')}%`).limit(3);
      const clientes=Array.isArray(cls)?cls:[];
      if(!clientes.length) return respond(`${nome}, não encontrei cliente com "${cliNomeBusca}".`);
      const cli=clientes[0]; const cliNome=String(cli.nome||'').trim(); const cliId=String(cli.id||'').trim();
      const todas=await _jarvisOfsDoCliente(cliId);
      const concluidas=todas.filter(o=>String(o.status||'').toLowerCase().includes('conclu'));
      const abertas=todas.filter(o=>{const s=String(o.status||'').toLowerCase();return !s.includes('conclu')&&!s.includes('cancel');});
      const totalFat=concluidas.reduce((s,o)=>s+Number(o.valor_total||o.valor_venda||0),0);
      const ticketMedio=concluidas.length>0?totalFat/concluidas.length:0;
      const totalCx=concluidas.reduce((s,o)=>s+Math.trunc(Number(o.qtd_produzida||o.qtd||0)||0),0);
      const ultimas=concluidas.slice(0,5).map(o=>{
        const num=String(o.of||o.numero||'—');
        const desc=String(o.descricao||o.prodDesc||o.produto||'').trim();
        const dc=String(o.data_conclusao||'').slice(0,10);
        const val=Number(o.valor_total||o.valor_venda||0);
        return `• OF #${num} — ${desc} — ${dc?dc.split('-').reverse().join('/'):'—'} — R$ ${val.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
      });
      return respond(
        `📊 Histórico: ${cliNome}\n`+
        (cli.cidade?`📍 ${cli.cidade}\n`:'')+
        (cli.tel||cli.telefone?`📞 ${cli.tel||cli.telefone}\n`:'')+
        `\n📈 RESUMO:\n`+
        `• Total de OFs: ${todas.length}\n`+
        `• Concluídas: ${concluidas.length}\n`+
        `• Em aberto: ${abertas.length}\n`+
        `• Total caixas produzidas: ${totalCx.toLocaleString('pt-BR')}\n`+
        `• Faturamento total: R$ ${totalFat.toLocaleString('pt-BR',{minimumFractionDigits:2})}\n`+
        `• Ticket médio por OF: R$ ${ticketMedio.toLocaleString('pt-BR',{minimumFractionDigits:2})}\n`+
        `\n🕐 Últimas concluídas:\n${ultimas.join('\n')||'—'}`
      );
    }

    if (hasAny('o que preciso comprar','o que devo comprar','sugestão de compra','sugestao de compra','comprar esta semana','comprar essa semana')) {
      const {data:chapasRaw}=await supabase.from('chapas_estoque').select('id,nome,nomenclatura,nom,fornecedor,forn,tamanho,tam,quantidade,qtd,quantidade_atual,estoque_minimo,valor_unitario,val').limit(500);
      const chapas=Array.isArray(chapasRaw)?chapasRaw:[];
      const criticas=chapas.filter(c=>{
        const qtd=Math.trunc(Number(c.quantidade_atual||c.quantidade||c.qtd||0)||0);
        const min=Math.trunc(Number(c.estoque_minimo||200)||200);
        return qtd<min;
      }).sort((a,b)=>{
        const qa=Math.trunc(Number(a.quantidade_atual||a.quantidade||a.qtd||0)||0);
        const qb=Math.trunc(Number(b.quantidade_atual||b.quantidade||b.qtd||0)||0);
        const ma=Math.trunc(Number(a.estoque_minimo||200)||200);
        const mb=Math.trunc(Number(b.estoque_minimo||200)||200);
        return (qa-ma)-(qb-mb);
      });
      if(!criticas.length) return respond(`${nome}, estoque de chapas está OK! Nenhuma abaixo do mínimo.`);
      const linhas=criticas.slice(0,10).map(c=>{
        const nom=String(c.nomenclatura||c.nom||c.nome||'—').trim();
        const tam=String(c.tamanho||c.tam||'').trim();
        const forn=String(c.fornecedor||c.forn||'').trim();
        const qtd=Math.trunc(Number(c.quantidade_atual||c.quantidade||c.qtd||0)||0);
        const min=Math.trunc(Number(c.estoque_minimo||200)||200);
        const sug=Math.max(0,min-qtd);
        const val=Number(c.valor_unitario||c.val||0);
        return `• ${nom}${tam?' ('+tam+')':''}\n  Saldo: ${qtd} | Mínimo: ${min} | Comprar: ${sug} un${val>0?' | ~R$ '+(sug*val).toLocaleString('pt-BR',{minimumFractionDigits:2}):''}${forn?' | '+forn:''}`;
      });
      const totalVal=criticas.slice(0,10).reduce((s,c)=>{
        const qtd=Math.trunc(Number(c.quantidade_atual||c.quantidade||c.qtd||0)||0);
        const min=Math.trunc(Number(c.estoque_minimo||200)||200);
        const val=Number(c.valor_unitario||c.val||0);
        return s+(Math.max(0,min-qtd)*val);
      },0);
      return respond(`🛒 ${nome}, ${criticas.length} chapa${criticas.length!==1?'s':''} para comprar:\n\n${linhas.join('\n')}\n\n💰 Investimento estimado: R$ ${totalVal.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
    }

    if (hasAny('compare','comparar','comparativo') && hasAny('faturamento','vendas','mês','mes')) {
      const meses={janeiro:1,fevereiro:2,marco:3,'março':3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
      const palavras=norm.split(/\s+/);
      const mesesEncontrados=[];
      palavras.forEach(p=>{if(meses[p]) mesesEncontrados.push(meses[p]);});
      if(mesesEncontrados.length<2) return respond(`${nome}, preciso de dois meses. Ex: "compare faturamento de abril com maio"`);
      const y=new Date().getFullYear();
      const fatMes=async(m)=>{
        const ini=`${y}-${String(m).padStart(2,'0')}-01`;
        const fim=new Date(y,m,0).toISOString().slice(0,10);
        const {data}=await supabase.from('ofs').select('valor_total,valor_venda,qtd_produzida,qtd,status,deleted_at').gte('data_conclusao',ini).lte('data_conclusao',fim).is('deleted_at',null).limit(5000);
        const rows=(Array.isArray(data)?data:[]).filter(o=>String(o.status||'').toLowerCase().includes('conclu'));
        return {fat:rows.reduce((s,o)=>s+Number(o.valor_total||o.valor_venda||0),0),ofs:rows.length,cx:rows.reduce((s,o)=>s+Math.trunc(Number(o.qtd_produzida||o.qtd||0)||0),0)};
      };
      const [r1,r2]=await Promise.all([fatMes(mesesEncontrados[0]),fatMes(mesesEncontrados[1])]);
      const nomeMes=n=>Object.keys(meses).find(k=>meses[k]===n&&!k.includes('ç'))||String(n);
      const diff=r2.fat-r1.fat; const pct=r1.fat>0?((diff/r1.fat)*100):0;
      return respond(
        `📊 Comparativo de faturamento (${y}):\n\n`+
        `📅 ${nomeMes(mesesEncontrados[0]).charAt(0).toUpperCase()+nomeMes(mesesEncontrados[0]).slice(1)}:\n`+
        `  💰 R$ ${r1.fat.toLocaleString('pt-BR',{minimumFractionDigits:2})} | ${r1.ofs} OFs | ${r1.cx.toLocaleString('pt-BR')} cx\n\n`+
        `📅 ${nomeMes(mesesEncontrados[1]).charAt(0).toUpperCase()+nomeMes(mesesEncontrados[1]).slice(1)}:\n`+
        `  💰 R$ ${r2.fat.toLocaleString('pt-BR',{minimumFractionDigits:2})} | ${r2.ofs} OFs | ${r2.cx.toLocaleString('pt-BR')} cx\n\n`+
        `${diff>=0?'📈':'📉'} Variação: ${diff>=0?'+':''}R$ ${Math.abs(diff).toLocaleString('pt-BR',{minimumFractionDigits:2})} (${diff>=0?'+':''}${pct.toFixed(1)}%)`
      );
    }

    if (hasAny('produtos mais fabricados','produtos mais vendidos','mais fabricados','mais produzidos','ranking de produtos')) {
      const m=new Date().toISOString().slice(0,7);
      const {data:ofsRaw}=await supabase.from('ofs').select('descricao,prodDesc,produto,qtd_produzida,qtd,status,deleted_at,data_conclusao').gte('data_conclusao',m+'-01').is('deleted_at',null).limit(5000);
      const rows=(Array.isArray(ofsRaw)?ofsRaw:[]).filter(o=>String(o.status||'').toLowerCase().includes('conclu'));
      const ranking=new Map();
      rows.forEach(o=>{
        const prod=String(o.descricao||o.prodDesc||o.produto||'Sem descrição').trim();
        const qtd=Math.trunc(Number(o.qtd_produzida||o.qtd||0)||0);
        ranking.set(prod,(ranking.get(prod)||0)+qtd);
      });
      const top=[...ranking.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
      if(!top.length) return respond(`${nome}, não há dados de produção para este mês ainda.`);
      const linhas=top.map(([p,q],i)=>`${i+1}. ${p}: ${q.toLocaleString('pt-BR')} cx`);
      return respond(`🏆 Top ${top.length} produtos mais fabricados (${m}):\n\n${linhas.join('\n')}`);
    }

    if (hasAny('abrir cliente','abre o cliente','abre a cliente','buscar cliente','encontrar cliente','ver cliente') && !hasAny('ofs do cliente','of do cliente')) {
      const mCli=pergunta.match(/(?:abrir?|abre|buscar|encontrar|ver)\s+(?:o\s+|a\s+)?(?:cliente\s+)?(.+?)(?:\?|$)/i)||null;
      const cliNomeBusca=mCli?String(mCli[1]||'').trim().replace(/\?+$/,'').trim():'';
      if(!cliNomeBusca) return respond(`${nome}, qual o nome do cliente?`);
      const {data:cls}=await supabase.from('clientes').select('id,nome,cidade,tel,telefone,cnpj').ilike('nome',`%${cliNomeBusca.replace(/%/g,'')}%`).limit(5);
      const clientes=Array.isArray(cls)?cls:[];
      if(!clientes.length) return respond(`${nome}, não encontrei cliente com "${cliNomeBusca}".`);
      const linhas=clientes.map((c,i)=>`${i+1}. **${String(c.nome||'').trim()}**${c.cidade?' — '+c.cidade:''}${c.tel||c.telefone?' | 📞 '+(c.tel||c.telefone):''}${c.cnpj?' | CNPJ: '+c.cnpj:''}`);
      return res.json({
        ok:true,
        resposta:`${nome}, encontrei ${clientes.length} cliente${clientes.length!==1?'s':''}:\n\n${linhas.join('\n')}`,
        dadosExtras:{tipo:'clientes_lista', clientes:clientes.map(c=>({id:c.id,nome:c.nome,cidade:c.cidade,tel:c.tel||c.telefone}))}
      });
    }

    if (hasAny('máquina mais livre','maquina mais livre','qual máquina','qual maquina') && hasAny('livre','disponível','disponivel','menos ocupada','menos carregada')) {
      const {data:maqAll}=await supabase.from('maquinas').select('id,nome,col').eq('ativo',true);
      const {data:ofsAb}=await supabase.from('ofs').select('fluxo_maquinas,maq,maquina_atual_index,status,deleted_at').is('deleted_at',null).limit(500);
      const contagem=new Map();
      (Array.isArray(maqAll)?maqAll:[]).forEach(m=>{const n=String(m.nome||m.col||'').trim();if(n) contagem.set(n,0);});
      (Array.isArray(ofsAb)?ofsAb:[]).forEach(o=>{
        const s=String(o.status||'').toLowerCase();
        if(s.includes('conclu')||s.includes('cancel')) return;
        let f=o.fluxo_maquinas||o.maq||[];
        if(typeof f==='string'){try{f=JSON.parse(f);}catch(_){f=[];}}
        if(!Array.isArray(f)||!f.length) return;
        const idx=Number(o.maquina_atual_index||0)||0;
        const item=f[Math.min(idx,f.length-1)]||f[0];
        const mNome=item&&typeof item==='object'?String(item.nome||item.maquina||'').trim():String(item||'').trim();
        if(mNome) contagem.set(mNome,(contagem.get(mNome)||0)+1);
      });
      const ranking=[...contagem.entries()].sort((a,b)=>a[1]-b[1]);
      if(!ranking.length) return respond(`${nome}, não encontrei máquinas cadastradas.`);
      const linhas=ranking.slice(0,8).map(([m,n],i)=>`${i+1}. ${m}: ${n} OF${n!==1?'s':''} na fila`);
      const livre=ranking[0];
      return respond(`🏭 ${nome}, a máquina mais livre é **${livre[0]}** com ${livre[1]} OF${livre[1]!==1?'s':''} na fila.\n\nRanking (menos para mais carregada):\n${linhas.join('\n')}`);
    }

    if (hasAny('última entrada','ultima entrada','histórico de chapa','historico de chapa','última compra de chapa','ultima compra de chapa') && hasAny('chapa','onda','papel')) {
      const mChapa=pergunta.match(/(?:entrada|chapa|compra)\s+(?:de\s+)?(.+?)(?:\?|$)/i)||null;
      const termoBusca=mChapa?String(mChapa[1]||'').trim():'';
      const tables=['chapas_estoque_movimentos_v2','chapas_estoque_movimentos'];
      let movs=[];
      for(const t of tables){
        try{
          let q2=supabase.from(t).select('chapa_id,tipo,delta,created_at,nf,usuario,obs,valor_unitario,vunit,val').eq('tipo','entrada').order('created_at',{ascending:false}).limit(100);
          const {data,error}=await q2;
          if(!error&&Array.isArray(data)){movs=data;break;}
        }catch(_){}
      }
      let chapaIds=[];
      if(termoBusca){
        const {data:chapas}=await supabase.from('chapas_estoque').select('id,nomenclatura,nom,nome,tamanho,tam').or(`nomenclatura.ilike.%${termoBusca}%,nom.ilike.%${termoBusca}%,nome.ilike.%${termoBusca}%`).limit(5);
        chapaIds=(Array.isArray(chapas)?chapas:[]).map(c=>String(c.id));
        movs=movs.filter(m=>chapaIds.includes(String(m.chapa_id||'')));
      }
      if(!movs.length) return respond(`${nome}, não encontrei histórico de entradas${termoBusca?' para "'+termoBusca+'"':''}.`);
      const linhas=movs.slice(0,8).map(m=>{
        const dt=String(m.created_at||'').slice(0,10).split('-').reverse().join('/');
        const qtd=Math.abs(Math.trunc(Number(m.delta||0)||0));
        const vu=Number(m.valor_unitario||m.vunit||m.val||0);
        return `• ${dt} — ${qtd} un${vu>0?' | R$ '+vu.toFixed(2)+'/un':''}${m.nf?' | NF: '+m.nf:''}${m.usuario?' | '+m.usuario:''}`;
      });
      return respond(`📦 ${nome}, histórico de entradas${termoBusca?' ('+termoBusca+')':''}:\n\n${linhas.join('\n')}`);
    }

    if (ofNum && hasAny('custo','quanto custou','quanto de chapa','chapas da of','chapa da of')) {
      const of=await _jarvisFindOFByNumero(ofNum);
      if(!of) return respond(`${nome}, não encontrei a OF #${ofNum}.`);
      const nOf=_assistPickOfNumber(of);
      const chapaId=String(of.chapa_id||of.chp||'').trim();
      const qtdChapas=Math.trunc(Number(of.qtd_chapas||of.qchp||0)||0);
      if(!chapaId||!qtdChapas) return respond(`${nome}, a OF #${nOf} não tem chapas registradas.`);
      const table='chapas_estoque';
      const {data:chapa}=await supabase.from(table).select('id,nomenclatura,nom,nome,valor_unitario,val,tamanho,tam').eq('id',chapaId).maybeSingle();
      if(!chapa) return respond(`${nome}, não encontrei os dados da chapa da OF #${nOf}.`);
      const nom=String(chapa.nomenclatura||chapa.nom||chapa.nome||'—').trim();
      const tam=String(chapa.tamanho||chapa.tam||'').trim();
      const vu=Number(chapa.valor_unitario||chapa.val||0);
      const custo=qtdChapas*vu;
      const valorOf=Number(of.valor_total||of.valor_venda||0);
      const pctCusto=valorOf>0?((custo/valorOf)*100):0;
      return respond(
        `📊 Custo de chapas da OF #${nOf}:\n\n`+
        `📄 Chapa: ${nom}${tam?' ('+tam+')':''}\n`+
        `🔢 Quantidade usada: ${qtdChapas.toLocaleString('pt-BR')} un\n`+
        `💰 Valor unitário: R$ ${vu.toFixed(2)}\n`+
        `💰 Custo total chapas: R$ ${custo.toLocaleString('pt-BR',{minimumFractionDigits:2})}\n`+
        (valorOf>0?`📊 Representa ${pctCusto.toFixed(1)}% do valor da OF (R$ ${valorOf.toLocaleString('pt-BR',{minimumFractionDigits:2})})`:'')
      );
    }

    if (hasAny('valor total do estoque','inventário','inventario','valor do estoque','total do estoque')) {
      const {data:chapasRaw}=await supabase.from('chapas_estoque').select('nome,nomenclatura,nom,fornecedor,forn,tamanho,tam,quantidade,qtd,quantidade_atual,valor_unitario,val,estoque_minimo').limit(1000);
      const chapas=Array.isArray(chapasRaw)?chapasRaw:[];
      let totalVal=0, totalItens=0, abaixoMin=0, semValor=0;
      chapas.forEach(c=>{
        const qtd=Math.trunc(Number(c.quantidade_atual||c.quantidade||c.qtd||0)||0);
        const vu=Number(c.valor_unitario||c.val||0);
        const min=Math.trunc(Number(c.estoque_minimo||200)||200);
        totalVal+=qtd*vu; totalItens+=qtd;
        if(vu===0) semValor++;
        if(qtd<min) abaixoMin++;
      });
      return respond(
        `📦 Inventário do estoque (${hoje.split('-').reverse().join('/')}):\n\n`+
        `🏷️ Total de tipos de chapas: ${chapas.length}\n`+
        `🔢 Total de unidades: ${totalItens.toLocaleString('pt-BR')}\n`+
        `💰 Valor total estimado: R$ ${totalVal.toLocaleString('pt-BR',{minimumFractionDigits:2})}\n`+
        `⚠️ Abaixo do mínimo: ${abaixoMin}\n`+
        `❓ Sem valor cadastrado: ${semValor}`
      );
    }

    if (hasAny('vão atrasar','vao atrasar','previsão de atraso','previsao de atraso','risco de atraso','podem atrasar')) {
      const d=new Date(); const dow=d.getDay(); const diffMon=dow===0?6:dow-1;
      const mon=new Date(d); mon.setDate(d.getDate()-diffMon);
      const sun=new Date(mon); sun.setDate(mon.getDate()+6);
      const deS=mon.toISOString().slice(0,10); const ateS=sun.toISOString().slice(0,10);
      const {data:ofsRaw}=await supabase.from('ofs').select('id,of,numero,status,data_entrega,ent,cli_id,cliente_id,cliNome,cliente_nome,qtd,quantidade,qtd_pedida,fluxo_maquinas,maq,deleted_at').is('deleted_at',null).limit(500);
      const semana=(Array.isArray(ofsRaw)?ofsRaw:[]).filter(o=>{
        const s=String(o.status||'').toLowerCase();
        if(s.includes('conclu')||s.includes('cancel')) return false;
        const ent=String(o.data_entrega||o.ent||'').slice(0,10);
        return ent>=deS&&ent<=ateS;
      });
      const atrasadas=semana.filter(o=>{const ent=String(o.data_entrega||o.ent||'').slice(0,10);return ent&&ent<hoje;});
      const cliMap=await _assistLoadClientesByIds(semana.map(o=>String(o.cli_id||o.cliente_id||'').trim()));
      const linhas=semana.slice(0,12).map(o=>{
        const num=String(o.of||o.numero||'—');
        const cli=String(cliMap.get(String(o.cli_id||o.cliente_id||'').trim())||o.cliNome||o.cliente_nome||'—').trim();
        const ent=String(o.data_entrega||o.ent||'').slice(0,10);
        const atras=ent&&ent<hoje;
        const maq=_jarvisMaqAtualOf(o);
        return `• OF #${num}${atras?' ⚠️ ATRASADA':''} — ${cli} — Entrega: ${ent?ent.split('-').reverse().join('/'):'—'} — ${maq}`;
      });
      return respond(
        `📅 OFs da semana (${deS.split('-').reverse().join('/')} a ${ateS.split('-').reverse().join('/')}):\n\n`+
        `Total: ${semana.length} | Já atrasadas: ${atrasadas.length}\n\n`+
        `${linhas.join('\n')||'Nenhuma OF esta semana.'}`
      );
    }

    if (hasAny('modo fábrica','modo fabrica','modo operador','modo producao','modo produção')) {
      const {data:maqAll}=await supabase.from('maquinas').select('id,nome,col').eq('ativo',true).order('ordem',{ascending:true});
      const maquinas=(Array.isArray(maqAll)?maqAll:[]).map(m=>String(m.nome||m.col||'').trim()).filter(Boolean);
      return res.json({
        ok:true,
        resposta:
          `🏭 **MODO FÁBRICA ATIVADO**\n\n`+
          `Comandos disponíveis:\n`+
          `• "OF da IMP 02" → ver OF atual da máquina\n`+
          `• "concluir OF 498" → registrar produção\n`+
          `• "imagem da OF 498" → ver referência visual\n`+
          `• "fila da IMP 03" → ver próximas OFs\n`+
          `• "parei IMP 02 por manutenção" → registrar parada\n\n`+
          `Máquinas disponíveis:\n${maquinas.map(m=>`• ${m}`).join('\n')||'—'}`,
        dadosExtras:{ tipo:'modo_fabrica', maquinas }
      });
    }

    if (ofNum && hasAny('concluir','finalizar','dar baixa','concluída','concluida') && hasAny('of','ordem')) {
      const of = await _jarvisFindOFByNumero(ofNum);
      if (!of) return respond(`${nome}, não encontrei a OF #${ofNum}.`);
      const cid = _assistPickOfClienteId(of);
      const cliMap = await _assistLoadClientesByIds([cid]);
      const cNome = String(cliMap.get(cid)||of.cliNome||of.cliente_nome||'—').trim()||'—';
      const nOf   = _assistPickOfNumber(of);
      const qtd   = Math.trunc(Number(of.qtd_pedida||of.quantidade||of.qtd||0)||0);
      const desc  = String(of.descricao||of.prodDesc||of.produto||of.prod||'').trim()||'—';
      const fluxo = parseFluxo(of.fluxo_maquinas||of.maq||[]);

      return res.json({
        ok: true,
        resposta:
          `📋 Concluir OF #${nOf}\n`+
          `Cliente: ${cNome}\n`+
          `Produto: ${desc}\n`+
          `Qtd pedida: ${qtd.toLocaleString('pt-BR')} caixas\n\n`+
          `Quantas caixas foram **produzidas**?`,
        jarvis_state: {
          acao: 'concluir_of',
          of_id: String(of.id||''),
          of_numero: nOf,
          etapa: 'aguardando_qtd_produzida',
          dados: { qtd_pedida: qtd, maquinas: fluxo.slice(0,12) },
        },
      });
    }

    if (ofNum && (_jarvisHasAny(norm, 'altere', 'alterar', 'mude', 'mudar', 'edite', 'editar') && _jarvisHasAny(norm, 'of', 'ordem'))) {
      const of = await _jarvisFindOFByNumero(ofNum);
      if (!of) return respond(`${nome}, não encontrei a OF #${ofNum}.`);
      const cid = _assistPickOfClienteId(of);
      const cliMap = await _assistLoadClientesByIds([cid]);
      const cNome = String(cliMap.get(cid) || of.cliNome || of.cliente_nome || '—').trim() || '—';
      const nOf = _assistPickOfNumber(of);
      const qtd = Math.trunc(Number(of.qtd_pedida || of.quantidade || of.qtd || 0) || 0);
      const entrega = _assistPickOfEntrega(of);
      const desc = String(of.descricao || of.prodDesc || of.produto || of.prod || '').trim() || '—';
      const obs = String(of.obs || of.observacao || '').trim();
      const urg = !!(of.urg || of.urgente);
      const fluxo = parseFluxo(of.fluxo_maquinas || of.maq || []);
      return res.json({
        ok: true,
        resposta:
          `✏️ Editar OF #${nOf}\n` +
          `Cliente: ${cNome}\n` +
          `Produto: ${desc}\n` +
          `Quantidade: ${qtd.toLocaleString('pt-BR')}\n` +
          `Entrega: ${entrega ? _assistFmtDateBr(entrega) : '—'}\n` +
          `Urgente: ${urg ? 'Sim' : 'Não'}\n` +
          `Máquinas: ${fluxo.length ? fluxo.join(' → ') : '—'}\n` +
          (obs ? `Obs: ${obs}\n` : '') +
          `\nO que deseja alterar? (data de entrega, quantidade, cliente, produto, urgente, máquinas, observações)`,
        jarvis_state: {
          acao: 'alterar_of',
          of_id: String(of.id || ''),
          of_numero: Number(nOf) || Number(ofNum) || ofNum,
          etapa: 'aguardando_campo',
          dados: {
            of_atual: {
              data_entrega: entrega || null,
              qtd,
              cliente: cNome,
              produto: desc,
              urgente: urg,
              maquinas: fluxo.slice(0, 20),
              obs: obs || '',
            },
          },
        },
      });
    }

    const act = await _jarvisDetectAction({ norm, pergunta, ofNum, year });
    if (act) {
      const uid = String(req?.usuario?.id || '');
      let resumo = '';
      try {
        if (act.type.startsWith('of_')) {
          const of = await _jarvisFindOFByNumero(act.ofNum);
          if (!of) return respond(`${nome}, não encontrei a OF #${act.ofNum}.`);
          const cid = _assistPickOfClienteId(of);
          const cliMap = await _assistLoadClientesByIds([cid]);
          const cNome = String(cliMap.get(cid) || of.cliNome || of.cliente_nome || '—').trim() || '—';
          const nOf = _assistPickOfNumber(of);
          const qtd = Math.trunc(Number(of.qtd_pedida || of.quantidade || of.qtd || 0) || 0);
          if (act.type === 'of_cancel') resumo = `⚠️ Confirmar cancelamento da OF #${nOf} — ${cNome} — ${qtd} caixas?`;
          else if (act.type === 'of_upload_image') resumo = `⚠️ Confirmar troca da imagem da OF #${nOf} — ${cNome}?`;
          else if (act.type === 'of_set_entrega') resumo = `⚠️ Confirmar alteração da entrega da OF #${nOf} — ${cNome} para ${_assistFmtDateBr(act.data)}?`;
          else if (act.type === 'of_set_qtd') resumo = `⚠️ Confirmar alteração da quantidade da OF #${nOf} — ${cNome} para ${Number(act.qtd).toLocaleString('pt-BR')} caixas?`;
          else if (act.type === 'of_set_urgente') resumo = `⚠️ Confirmar marcar urgência na OF #${nOf} — ${cNome}?`;
          else if (act.type === 'of_set_cliente') resumo = `⚠️ Confirmar trocar cliente da OF #${nOf} para "${act.clienteNome}"?`;
          else if (act.type === 'of_concluir') resumo = `⚠️ Confirmar concluir a OF #${nOf} — ${cNome}${act.qtdProduzida ? ` (produzidas ${Number(act.qtdProduzida).toLocaleString('pt-BR')} cx)` : ''}?`;
          else resumo = `⚠️ Confirmar ação na OF #${nOf}?`;
          act.ofId = String(of.id || '');
        } else if (act.type.startsWith('chapa_')) {
          const ch = await _jarvisFindChapaByNome(act.chapaNome);
          if (!ch) return respond(`${nome}, não encontrei a chapa "${act.chapaNome}".`);
          const nomeCh = String(ch.nomenclatura || ch.nome_uso || ch.nome || '—').trim() || '—';
          if (act.type === 'chapa_entrada') resumo = `⚠️ Confirmar entrada de ${Number(act.qtd).toLocaleString('pt-BR')} unidade(s) na chapa "${nomeCh}"?`;
          else if (act.type === 'chapa_set_min') resumo = `⚠️ Confirmar ajuste do estoque mínimo da chapa "${nomeCh}" para ${Number(act.min).toLocaleString('pt-BR')}?`;
          act.chapaId = String(ch.id || '');
        } else if (act.type.startsWith('cliente_')) {
          if (act.type === 'cliente_create') resumo = `⚠️ Confirmar cadastro do cliente "${act.clienteNome}" com telefone "${act.telefone}"?`;
          if (act.type === 'cliente_set_tel') resumo = `⚠️ Confirmar atualizar telefone do cliente "${act.clienteNome}" para "${act.telefone}"?`;
        } else {
          resumo = `⚠️ Confirmar ação?`;
        }
      } catch (_) {
        resumo = `⚠️ Confirmar ação?`;
      }
      const actionId = _jarvisStoreAction(uid, act);
      return res.json({
        ok: true,
        resposta: resumo,
        actions: [
          { id: actionId, label: '✅ Confirmar', decision: 'confirm' },
          { id: actionId, label: '❌ Cancelar', decision: 'cancel' },
        ],
      });
    }

    if (norm.startsWith('/ajuda') || norm.startsWith('/help') ||
        hasAny('o que você pode fazer','o que voce pode fazer','o que você faz',
               'como usar o jarvis','quais comandos','o que posso pedir',
               'me ajude','preciso de ajuda')) {
      return res.json({
        ok: true,
        resposta:
`${nome}, sou o JARVIS — IA integrada ao ERP Italy Embalagens. Veja tudo que posso fazer:

📋 ORDENS DE FABRICAÇÃO
- "imagem da OF 498" → imagem + dados completos + ações
- "OF 498" → todos os dados da OF
- "OFs do cliente João" → situação completa com status
- "OFs atrasadas" / "OFs urgentes" / "OFs de hoje"
- "concluir OF 498" → solicito dados e concluo
- "cancelar OF 498" → cancelo após confirmação
- "altere a entrega da OF 498 para 25/05" → altero após confirmação
- "programa a OF 498 para amanhã na IMP 03" → reagendo
- "clonar OF 498 para cliente X com entrega 30/05" → cria cópia
- "mover todas as OFs da IMP 03 para amanhã" → lote

🏭 PRODUÇÃO
- "como está a produção agora" → dashboard em tempo real
- "fila da IMP 02" → OFs em ordem de prioridade
- "qual máquina está mais livre" → ranking de carga
- "quais OFs vão atrasar essa semana" → previsão
- "ranking de produtos mais fabricados" → top produtos
- "modo fábrica" → interface simplificada para operadores

👥 CLIENTES
- "histórico do cliente X" → OFs, ticket médio, total gasto
- "abre o cliente Padaria X" → busca com dados
- "clientes inativos" → sem pedido há 30 dias
- "top clientes do mês" → maiores compradores
- "PDF do cliente X" → relatório para imprimir
- "compare faturamento de abril com maio" → comparativo

📦 ESTOQUE
- "quanto tem de chapa onda B" → saldo atual
- "estoque crítico" → abaixo do mínimo
- "valor total do estoque" → inventário completo
- "o que preciso comprar esta semana" → sugestão de compra
- "dar entrada de 100 na chapa X" → registra após confirmação
- "última entrada de onda B 1200x900" → histórico
- "custo de chapas da OF 498" → cálculo de custo

📊 RELATÓRIOS
- "faturamento do mês" / "faturamento de abril"
- "compare faturamento de abril com maio"
- "/dashboard" → gráfico anual
- "/resumo" → resumo completo do dia
- "/atrasadas" → lista rápida

💡 DICAS
- Digite só o número (ex: "498") → mostro a OF direto
- Botão 📎 → enviar imagem para atualizar foto de OF
- Botão 🎤 → comando por voz
- "modo fábrica" → modo simplificado para chão de fábrica`,
        suggestions: ['imagem da OF 498','fila da IMP 02','o que preciso comprar','como está a produção agora','PDF do cliente X']
      });
    }

    if (norm.startsWith('/resumo')) {
      const { data } = await supabase
        .from('ofs')
        .select('id,of,numero,status,ent,data_entrega,data_conclusao,deleted_at,urg,urgente,cli_id,cliente_id,cliNome,cliente_nome')
        .order('created_at', { ascending: false })
        .limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const ativos = rows.filter((o) => !o.deleted_at && !_assistIsCancelada(o));
      const abertas = ativos.filter((o) => !_assistIsConcluida(o));
      const atras = abertas.filter((o) => {
        const ent = _assistPickOfEntrega(o);
        return ent && ent < hoje;
      });
      const hojeList = abertas.filter((o) => _assistPickOfEntrega(o) === hoje);
      const urg = abertas.filter((o) => !!(o.urg || o.urgente));
      const topAtras = atras.sort((a, b) => (_assistPickOfEntrega(a) || '').localeCompare(_assistPickOfEntrega(b) || '')).slice(0, 5);
      const cliMap = await _assistLoadClientesByIds(topAtras.map(_assistPickOfClienteId));
      const linhas = topAtras.map((o) => {
        const ent = _assistPickOfEntrega(o);
        const atraso = ent ? _assistDaysDiff(hoje, ent) : 0;
        const cid = _assistPickOfClienteId(o);
        const cNome = String(cliMap.get(cid) || o.cliNome || o.cliente_nome || '—').trim() || '—';
        return `📦 OF #${_assistPickOfNumber(o)} — ${cNome} — ${atraso} dia(s)`;
      });
      return res.json({
        ok: true,
        resposta:
          `${_jarvisFirstName(nome)}, resumo do dia (${_assistFmtDateBr(hoje)}):\n` +
          `🚨 Atrasadas: ${atras.length}\n` +
          `📅 Entregas hoje: ${hojeList.length}\n` +
          `⚡ Urgentes: ${urg.length}\n\n` +
          `Top atrasadas:\n${linhas.join('\n') || '—'}`,
        suggestions: ['/atrasadas', 'OFs de hoje', 'OFs urgentes', '/estoque'],
      });
    }

    if (norm.startsWith('/atrasadas')) {
      const { data } = await supabase
        .from('ofs')
        .select('id,of,numero,status,ent,data_entrega,deleted_at,cli_id,cliente_id,cliNome,cliente_nome')
        .order('created_at', { ascending: false })
        .limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const ativos = rows.filter((o) => !o.deleted_at && !_assistIsCancelada(o) && !_assistIsConcluida(o));
      const atras = ativos.filter((o) => {
        const ent = _assistPickOfEntrega(o);
        return ent && ent < hoje;
      }).sort((a, b) => (_assistPickOfEntrega(a) || '').localeCompare(_assistPickOfEntrega(b) || ''));
      const cliMap = await _assistLoadClientesByIds(atras.map(_assistPickOfClienteId));
      const top = atras.slice(0, 10);
      const linhas = top.map((o) => {
        const ent = _assistPickOfEntrega(o);
        const atraso = ent ? _assistDaysDiff(hoje, ent) : 0;
        const cid = _assistPickOfClienteId(o);
        const cNome = String(cliMap.get(cid) || o.cliNome || o.cliente_nome || '—').trim() || '—';
        return `📦 OF #${_assistPickOfNumber(o)} — ${cNome} — ${atraso} dia(s)`;
      });
      const tbl = {
        headers: ['OF', 'Cliente', 'Entrega', 'Atraso (dias)'],
        rows: top.map((o) => {
          const ent = _assistPickOfEntrega(o);
          const atraso = ent ? _assistDaysDiff(hoje, ent) : 0;
          const cid = _assistPickOfClienteId(o);
          const cNome = String(cliMap.get(cid) || o.cliNome || o.cliente_nome || '—').trim() || '—';
          return [
            String(_assistPickOfNumber(o)),
            cNome,
            ent ? _assistFmtDateBr(ent) : '—',
            String(atraso),
          ];
        }),
      };
      const extra = atras.length > top.length ? `\n...e mais ${atras.length - top.length} itens` : '';
      return res.json({
        ok: true,
        resposta: `${_jarvisFirstName(nome)}, OFs atrasadas: ${atras.length}\n${linhas.join('\n') || '—'}${extra}`,
        table: tbl,
        suggestions: ['/resumo', 'OFs urgentes', 'Estoque crítico', '/dashboard'],
      });
    }

    if (norm.startsWith('/dashboard')) {
      const y = year;
      const de = `${y}-01-01`;
      const ate = `${y}-12-31`;
      const { data } = await supabase
        .from('ofs')
        .select('status,data_conclusao,valor_total,valor_venda,val,deleted_at')
        .gte('data_conclusao', de)
        .lte('data_conclusao', ate)
        .limit(5000);
      const rows = (Array.isArray(data) ? data : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
      const sums = Array.from({ length: 12 }).map(() => 0);
      rows.forEach((o) => {
        const dt = String(o.data_conclusao || '').slice(0, 10);
        const m = dt.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return;
        const mm = Number(m[2]);
        if (!(mm >= 1 && mm <= 12)) return;
        sums[mm - 1] += _assistPickOfValor(o);
      });
      const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return res.json({
        ok: true,
        resposta: `${_jarvisFirstName(nome)}, dashboard (${y}):`,
        chart: { type: 'bar', title: 'Faturamento', labels, data: sums.map((v) => Math.round(Number(v || 0))) },
        suggestions: ['/resumo', '/atrasadas', '/estoque'],
      });
    }

    if (_jarvisHasAny(norm, '/estoque') || ((hasAny('mostre', 'mostrar', 'ver') || norm.startsWith('estoque')) && hasAny('estoque') && (hasAny('chapa', 'chapas') || norm.includes('chapa')))) {
      const { data } = await supabase
        .from('chapas_estoque')
        .select('id,nomenclatura,nome_uso,nome,quantidade,quantidade_atual,qtd,estoque_minimo')
        .order('nomenclatura', { ascending: true })
        .limit(400);
      const rows = Array.isArray(data) ? data : [];
      const toQtd = (c) => Math.trunc(Number(c.quantidade_atual ?? c.quantidade ?? c.qtd ?? 0) || 0);
      const toMin = (c) => Math.trunc(Number(c.estoque_minimo ?? 0) || 0);
      const top = rows.slice(0, 40);
      const tbl = {
        headers: ['Chapa', 'Saldo', 'Mínimo'],
        rows: top.map((c) => [
          String(c.nomenclatura || c.nome_uso || c.nome || '—').trim() || '—',
          String(toQtd(c)),
          String(toMin(c)),
        ]),
      };
      const extra = rows.length > top.length ? ` (mostrando 40 de ${rows.length})` : '';
      return res.json({ ok: true, resposta: `${_jarvisFirstName(nome)}, aqui está o estoque de chapas${extra}:`, table: tbl });
    }

    if ((hasAny('grafico', 'gráfico') || norm.startsWith('/dashboard')) && hasAny('faturamento', 'vendas', 'venda')) {
      const y = year;
      const de = `${y}-01-01`;
      const ate = `${y}-12-31`;
      const { data } = await supabase
        .from('ofs')
        .select('status,data_conclusao,valor_total,valor_venda,val,deleted_at')
        .gte('data_conclusao', de)
        .lte('data_conclusao', ate)
        .limit(5000);
      const rows = (Array.isArray(data) ? data : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
      const sums = Array.from({ length: 12 }).map(() => 0);
      rows.forEach((o) => {
        const dt = String(o.data_conclusao || '').slice(0, 10);
        const m = dt.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return;
        const mm = Number(m[2]);
        if (!(mm >= 1 && mm <= 12)) return;
        sums[mm - 1] += _assistPickOfValor(o);
      });
      const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return res.json({
        ok: true,
        resposta: `${_jarvisFirstName(nome)}, gráfico de faturamento (${y}) pronto:`,
        chart: { type: 'bar', title: 'Faturamento', labels, data: sums.map((v) => Math.round(Number(v || 0))) },
      });
    }

    let _ofCtx = null;
    const loadOfCtx = async () => {
      if (_ofCtx) return _ofCtx;
      const of = await _jarvisFindOFByNumero(ofNum);
      if (!of) return null;
      const cid = _assistPickOfClienteId(of);
      const cliMap = await _assistLoadClientesByIds([cid]);
      _ofCtx = {
        of,
        numero: _assistPickOfNumber(of),
        clienteId: cid || '',
        clienteNome: String(cliMap.get(cid) || of.cliNome || of.cliente_nome || '—').trim() || '—',
        entrega: _assistPickOfEntrega(of),
        status: String(of.status || '—').trim() || '—',
        qtd: Math.trunc(Number(of.qtd_pedida || of.quantidade || of.qtd || 0) || 0),
        urgente: !!(of.urg || of.urgente),
      };
      return _ofCtx;
    };

    if (ofNum && norm.includes('status') && !hasAny('alterar', 'altere', 'mudar', 'trocar', 'concluir', 'concluida', 'concluída', 'concluido', 'concluído')) {
      const ctx = await loadOfCtx();
      if (!ctx) return respond(`${nome}, não encontrei a OF #${ofNum}.`);
      return respond(`${nome}, a OF #${ctx.numero} está com status "${ctx.status}"${ctx.entrega ? ` e entrega em ${_assistFmtDateBr(ctx.entrega)}` : ''}.`);
    }

    if (ofNum && hasAny('cliente') && !hasAny('alterar', 'altere', 'mudar', 'trocar', 'para')) {
      const ctx = await loadOfCtx();
      if (!ctx) return respond(`${nome}, não encontrei a OF #${ofNum}.`);
      return respond(`${nome}, a OF #${ctx.numero} é do cliente ${ctx.clienteNome}${ctx.entrega ? ` (entrega ${_assistFmtDateBr(ctx.entrega)})` : ''}.`);
    }

    if (ofNum && hasAny('entrega', 'data de entrega') && !hasAny('alterar', 'altere', 'mudar', 'trocar', 'para')) {
      const ctx = await loadOfCtx();
      if (!ctx) return respond(`${nome}, não encontrei a OF #${ofNum}.`);
      return respond(`${nome}, a entrega da OF #${ctx.numero} é ${ctx.entrega ? _assistFmtDateBr(ctx.entrega) : '—'}.`);
    }

    if (ofNum && hasAny('quantidade', 'qtd', 'caixas') && !hasAny('alterar', 'altere', 'mudar', 'trocar', 'para')) {
      const ctx = await loadOfCtx();
      if (!ctx) return respond(`${nome}, não encontrei a OF #${ofNum}.`);
      return respond(`${nome}, a OF #${ctx.numero} está com ${Number(ctx.qtd || 0).toLocaleString('pt-BR')} caixa(s) no pedido.`);
    }

    if (ofNum && hasAny('urgente', 'urgência', 'urgencia') && !hasAny('adicione', 'adicionar', 'coloque', 'marque', 'set')) {
      const ctx = await loadOfCtx();
      if (!ctx) return respond(`${nome}, não encontrei a OF #${ofNum}.`);
      return respond(`${nome}, a OF #${ctx.numero} está ${ctx.urgente ? 'marcada como URGENTE' : 'sem marcação de urgência'}.`);
    }

    if (ofNum && (norm.includes('imagem') || norm.includes('foto'))) {
      let row = null;

      const campos = 'id,of,numero,imagem_url,imgs,descricao,prodDesc,status,cliNome,cliente_nome,cli_id,cliente_id,qtd,quantidade,qtd_pedida,data_entrega,ent,data_producao,dia,valor_total,valor_venda,urg,urgente';

      const { data: d1 } = await supabase.from('ofs')
        .select(campos).or(`of.eq.${ofNum},numero.eq.${ofNum}`)
        .is('deleted_at', null).limit(1);
      row = Array.isArray(d1) && d1[0] ? d1[0] : null;

      if (!row) {
        const { data: d2 } = await supabase.from('ofs')
          .select(campos)
          .or(`of.ilike.%${ofNum}%,numero.ilike.%${ofNum}%`)
          .is('deleted_at', null).limit(1);
        row = Array.isArray(d2) && d2[0] ? d2[0] : null;
      }

      if (!row) return respond(`${nome}, não encontrei a OF #${ofNum}.`);

      const iu = String(row.imagem_url || '').trim();
      let urls = [];
      try {
        const raw = row.imgs;
        const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : (Array.isArray(raw) ? raw : []);
        urls = [...new Set([...(iu ? [iu] : []), ...arr.map(x => String(x || '').trim()).filter(Boolean)])].slice(0, 5);
      } catch (_) { urls = iu ? [iu] : []; }
      urls = (Array.isArray(urls) ? urls : []).map((u)=>{
        const s = String(u || '').trim();
        if(!s) return '';
        if(s.startsWith('http') || s.startsWith('data:') || s.startsWith('/')) return s;
        return '/' + s;
      }).filter(Boolean).slice(0, 5);

      const numOf  = String(row.of || row.numero || '—');
      const desc   = String(row.descricao || row.prodDesc || '').trim() || '—';
      const status = String(row.status || '').trim() || '—';
      const cli    = String(row.cliNome || row.cliente_nome || '').trim() || '—';
      const qtd    = Math.trunc(Number(row.qtd_pedida || row.quantidade || row.qtd || 0));
      const ent    = String(row.data_entrega || row.ent || '').slice(0, 10);
      const dia    = String(row.data_producao || row.dia || '').slice(0, 10);
      const val    = Number(row.valor_total || row.valor_venda || 0);
      const urg    = !!(row.urg || row.urgente);
      const fmtD   = s => s ? s.split('-').reverse().join('/') : '—';
      const isAtras = ent && ent < hoje;

      const dadosTexto =
        `📋 OF #${numOf}${urg ? ' 🚨 URGENTE' : ''}${isAtras ? ' ⚠️ ATRASADA' : ''}\n` +
        `👤 Cliente: ${cli}\n` +
        `📦 Produto: ${desc}\n` +
        `📊 Status: ${status}\n` +
        `🔢 Quantidade: ${qtd.toLocaleString('pt-BR')} caixas\n` +
        `🚚 Entrega: ${fmtD(ent)}\n` +
        (dia ? `🏭 Produção: ${fmtD(dia)}\n` : '') +
        (val > 0 ? `💰 Valor: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` : '') +
        `\nO que deseja fazer?\n• Baixar imagem\n• Imprimir imagem\n• Alterar data de entrega\n• Concluir esta OF\n• Cancelar esta OF`;

      if (!urls.length) {
        return res.json({
          ok: true,
          resposta: `A OF #${numOf} não possui imagem cadastrada.`,
          images: [],
          dadosExtras: { tipo: 'of', of_id: row.id, numero: numOf, imagem_url: null, pode_baixar: false, pode_imprimir: false }
        });
      }

      return res.json({
        ok: true,
        resposta: `Aqui está a imagem da OF #${numOf}:`,
        images: [urls[0]],
        dadosExtras: {
          tipo: 'of',
          of_id: row.id,
          numero: numOf,
          imagem_url: urls[0] || null,
          pode_baixar: true,
          pode_imprimir: true,
        },
      });
    }

    if (hasAny('que horas sao', 'que horas são', 'hora', 'horas') && (norm.includes('que horas') || norm === 'hora' || norm === 'horas')) {
      const now = new Date();
      return respond(`${nome}, agora são ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`);
    }

    if (hasAny('quem sou eu', 'meus dados', 'meu perfil')) {
      const parts = [
        `${nome}, aqui estão seus dados:`,
        `👤 Nome: ${nome}`,
        email ? `📧 Email: ${email}` : null,
        perfil ? `🔐 Perfil: ${perfil}` : null,
      ].filter(Boolean).join('\n');
      return respond(parts);
    }

    if (hasAny('resumo do dia', 'resumo hoje')) {
      const { de: wDe, ate: wAte } = _assistWeekRange(hoje);
      const { data: ofsAll } = await supabase
        .from('ofs')
        .select('id,of,numero,status,ent,data_entrega,data_conclusao,deleted_at,cli_id,cliente_id,valor_total,valor_venda,val,urg,urgente,qtd_perdida,valor_perdido')
        .order('created_at', { ascending: false })
        .limit(5000);
      const ofs = Array.isArray(ofsAll) ? ofsAll : [];
      const ativos = ofs.filter((o) => !o.deleted_at && !_assistIsCancelada(o));
      const atrasadas = ativos.filter((o) => {
        if (_assistIsConcluida(o)) return false;
        const ent = _assistPickOfEntrega(o);
        return ent && ent < hoje;
      });
      const entregasHoje = ativos.filter((o) => {
        const ent = _assistPickOfEntrega(o);
        return ent === hoje && !_assistIsConcluida(o);
      });
      const perdasHoje = ativos
        .filter((o) => _assistPickOfConclusao(o) === hoje)
        .reduce((s, o) => s + (Number(o.qtd_perdida || 0) || 0), 0);

      const { data: chapasAll } = await supabase.from('chapas_estoque').select('id,nomenclatura,nome_uso,nome,quantidade,quantidade_atual,qtd,estoque_minimo').limit(5000);
      const chapas = Array.isArray(chapasAll) ? chapasAll : [];
      const crit = chapas.filter((c) => {
        const qtd = Number(c.quantidade_atual ?? c.quantidade ?? c.qtd ?? 0) || 0;
        const min = Number(c.estoque_minimo ?? 0) || 0;
        return min > 0 && qtd < min;
      });

      const texto = [
        `${nome}, resumo de hoje (${_assistFmtDateBr(hoje)}):`,
        `📦 OFs atrasadas: ${atrasadas.length}`,
        `📅 Entregas de hoje: ${entregasHoje.length}`,
        `📉 Estoque crítico (chapas): ${crit.length}`,
        `🧯 Perdas concluídas hoje: ${Number(perdasHoje || 0).toLocaleString('pt-BR')}`,
        `📆 Semana: ${_assistFmtDateBr(wDe)} a ${_assistFmtDateBr(wAte)}`,
      ].join('\n');
      return respond(texto);
    }

    if (hasAny('estoque critico', 'estoque crítico', 'chapas abaixo do minimo', 'chapas abaixo do mínimo', 'abaixo do minimo', 'abaixo do mínimo')) {
      const { data } = await supabase.from('chapas_estoque').select('id,fornecedor,nomenclatura,nome_uso,nome,tamanho,quantidade,quantidade_atual,qtd,estoque_minimo').order('nomenclatura', { ascending: true }).limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const crit = rows.filter((c) => {
        const qtd = Number(c.quantidade_atual ?? c.quantidade ?? c.qtd ?? 0) || 0;
        const min = Number(c.estoque_minimo ?? 0) || 0;
        return min > 0 && qtd < min;
      });
      const top = crit.slice(0, 10);
      const linhas = top.map((c) => {
        const qtd = Number(c.quantidade_atual ?? c.quantidade ?? c.qtd ?? 0) || 0;
        const min = Number(c.estoque_minimo ?? 0) || 0;
        const nom = String(c.nomenclatura || c.nome_uso || c.nome || '—').trim();
        return `📦 ${nom} — saldo ${qtd} (mín ${min})`;
      });
      const extra = crit.length > top.length ? `\n...e mais ${crit.length - top.length} itens` : '';
      return respond(`${nome}, encontrei ${crit.length} chapas abaixo do mínimo:\n${linhas.join('\n') || '—'}${extra}`);
    }

    if (hasAny('estoque zerado', 'zerado', 'quantidade = 0')) {
      const { data } = await supabase.from('chapas_estoque').select('id,nomenclatura,nome_uso,nome,quantidade,quantidade_atual,qtd').order('nomenclatura', { ascending: true }).limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const zer = rows.filter((c) => (Number(c.quantidade_atual ?? c.quantidade ?? c.qtd ?? 0) || 0) === 0);
      const top = zer.slice(0, 10);
      const linhas = top.map((c) => `📦 ${String(c.nomenclatura || c.nome_uso || c.nome || '—').trim()} — saldo 0`);
      const extra = zer.length > top.length ? `\n...e mais ${zer.length - top.length} itens` : '';
      return respond(`${nome}, encontrei ${zer.length} chapas com estoque zerado:\n${linhas.join('\n') || '—'}${extra}`);
    }

    if (hasAny('quanto tem de', 'quanto temos de', 'quanto tem da', 'quantidade de') && hasAny('chapa', 'chapas')) {
      const m = norm.match(/\b(?:de|da)\s+(.+)$/);
      const termo = m ? String(m[1] || '').trim() : '';
      if (!termo) {
      } else {
      const { data } = await supabase.from('chapas_estoque').select('id,nomenclatura,nome_uso,nome,quantidade,quantidade_atual,qtd,estoque_minimo').limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const t = _assistNorm(termo);
      const found = rows.find((c) => _assistNorm(c.nomenclatura || c.nome_uso || c.nome || '').includes(t)) || null;
      if (!found) return respond(`${nome}, não encontrei essa chapa no estoque.`);
      const qtd = Number(found.quantidade_atual ?? found.quantidade ?? found.qtd ?? 0) || 0;
      const min = Number(found.estoque_minimo ?? 0) || 0;
      const nom = String(found.nomenclatura || found.nome_uso || found.nome || '—').trim();
      return respond(`${nome}, a chapa "${nom}" está com saldo ${qtd}${(min ? ` (mín ${min})` : '')}.`);
      }
    }

    if (hasAny('valor total do estoque', 'valor do estoque', 'total do estoque')) {
      const { data } = await supabase.from('chapas_estoque').select('id,quantidade,quantidade_atual,qtd,valor_total,valor_unitario,val').limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const total = rows.reduce((s, c) => {
        const vt = Number(c.valor_total ?? 0);
        if (Number.isFinite(vt) && vt > 0) return s + vt;
        const qtd = Number(c.quantidade_atual ?? c.quantidade ?? c.qtd ?? 0) || 0;
        const vu = Number(c.valor_unitario ?? c.val ?? 0) || 0;
        return s + (qtd * vu);
      }, 0);
      return respond(`${nome}, o valor total estimado do estoque de chapas é ${_assistFmtBRL(total)}.`);
    }

    if (hasAny('chapas mais usadas', 'mais usadas')) {
      const m = month || (new Date().getMonth() + 1);
      const { de, ate } = _assistMonthRange(year, m);
      const { data: ofsAll } = await supabase
        .from('ofs')
        .select('id,status,deleted_at,data_conclusao,ent,data_entrega,chp,chapa_id,qchp,qtd_chapas,emp_id,empId')
        .gte('data_conclusao', de)
        .lte('data_conclusao', ate)
        .limit(5000);
      const ofs = (Array.isArray(ofsAll) ? ofsAll : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
      const by = new Map();
      ofs.forEach((o) => {
        const chp = String(o.chp || o.chapa_id || '').trim();
        if (!chp) return;
        const q = Number(o.qchp ?? o.qtd_chapas ?? 0) || 0;
        by.set(chp, (by.get(chp) || 0) + q);
      });
      const ids = Array.from(by.keys());
      const { data: chapasAll } = ids.length
        ? await supabase.from('chapas_estoque').select('id,nomenclatura,nome_uso,nome').in('id', ids.slice(0, 200))
        : { data: [] };
      const nomById = new Map();
      (Array.isArray(chapasAll) ? chapasAll : []).forEach((c) => { if (c?.id) nomById.set(String(c.id), String(c.nomenclatura || c.nome_uso || c.nome || '').trim()); });
      const top = Array.from(by.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const linhas = top.map(([id, q]) => `📦 ${nomById.get(id) || id} — ${Number(q || 0).toLocaleString('pt-BR')} saídas`);
      return respond(`${nome}, top 5 chapas mais usadas em ${String(de).slice(5, 7)}/${String(de).slice(0, 4)}:\n${linhas.join('\n') || '—'}`);
    }

    if (hasAny('ofs atrasadas', 'of atrasada', 'atrasadas', 'em atraso', 'passou da data')) {
      const { data } = await supabase
        .from('ofs')
        .select('id,of,numero,status,ent,data_entrega,deleted_at,cli_id,cliente_id,cliNome,cliente_nome')
        .order('created_at', { ascending: false })
        .limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const ativos = rows.filter((o) => !o.deleted_at && !_assistIsCancelada(o) && !_assistIsConcluida(o));
      const atras = ativos.filter((o) => {
        const ent = _assistPickOfEntrega(o);
        return ent && ent < hoje;
      }).sort((a, b) => (_assistPickOfEntrega(a) || '').localeCompare(_assistPickOfEntrega(b) || ''));
      const cliMap = await _assistLoadClientesByIds(atras.map(_assistPickOfClienteId));
      const top = atras.slice(0, 10);
      const linhas = top.map((o) => {
        const ent = _assistPickOfEntrega(o);
        const atraso = ent ? _assistDaysDiff(hoje, ent) : 0;
        const cid = _assistPickOfClienteId(o);
        const cNome = String(cliMap.get(cid) || o.cliNome || o.cliente_nome || '—').trim() || '—';
        return `📦 OF #${_assistPickOfNumber(o)} — ${cNome} — ${atraso} dia(s) de atraso`;
      });
      const extra = atras.length > top.length ? `\n...e mais ${atras.length - top.length} itens` : '';
      return respond(`${nome}, encontrei ${atras.length} OF(s) atrasada(s):\n${linhas.join('\n') || '—'}${extra}`);
    }

    if (hasAny(
      'ofs de hoje', 'entregas de hoje', 'of hoje', 'entrega hoje',
      'quantas ofs tem em aberto para hoje', 'ofs em aberto para hoje',
      'ofs para hoje', 'quantas ofs para hoje'
    )) {
      const { data: ofsHojeRaw } = await supabase
        .from('ofs')
        .select('id,of,numero,status,ent,data_entrega,deleted_at,cli_id,cliente_id,cliNome,cliente_nome,fluxo_maquinas,maq,maquina_atual_index')
        .or(`data_entrega.eq.${hoje},ent.eq.${hoje}`)
        .is('deleted_at', null)
        .limit(500);

      const rows = Array.isArray(ofsHojeRaw) ? ofsHojeRaw : [];
      const ativos = rows.filter(o => !o.deleted_at && String(o.status || '').toLowerCase() !== 'cancelada' && String(o.status || '').toLowerCase() !== 'cancelado');
      const abertas = ativos.filter(o => !String(o.status || '').toLowerCase().includes('conclu'));
      const cliMap = await _assistLoadClientesByIds(abertas.map(_assistPickOfClienteId));

      const top = abertas.slice(0, 10);
      const linhas = top.map(o => {
        const cid = _assistPickOfClienteId(o);
        const cNome = String(cliMap.get(cid) || o.cliNome || o.cliente_nome || '—').trim() || '—';
        const maq = _jarvisMaqAtualOf(o);
        const st = String(o.status || '—').trim();
        return `• OF #${_assistPickOfNumber(o)} — ${cNome} — ${st} — Máq: ${maq}`;
      });
      const extra = abertas.length > 10 ? `\n...e mais ${abertas.length - 10} itens` : '';
      return respond(
        `${nome}, OFs em aberto para hoje (${_assistFmtDateBr(hoje)}): ${abertas.length}\n${linhas.join('\n') || '—'}${extra}`
      );
    }

    if (hasAny('ofs urgentes', 'of urgente', 'urgentes', 'urgente')) {
      const { data } = await supabase
        .from('ofs')
        .select('id,of,numero,status,ent,data_entrega,deleted_at,cli_id,cliente_id,cliNome,cliente_nome,urg,urgente')
        .order('created_at', { ascending: false })
        .limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const ativos = rows.filter((o) => !o.deleted_at && !_assistIsCancelada(o) && !_assistIsConcluida(o));
      const urg = ativos.filter((o) => !!(o.urg || o.urgente));
      const cliMap = await _assistLoadClientesByIds(urg.map(_assistPickOfClienteId));
      const top = urg.slice(0, 10);
      const linhas = top.map((o) => {
        const cid = _assistPickOfClienteId(o);
        const cNome = String(cliMap.get(cid) || o.cliNome || o.cliente_nome || '—').trim() || '—';
        const ent = _assistPickOfEntrega(o);
        return `🚨 OF #${_assistPickOfNumber(o)} — ${cNome}${ent ? ` — entrega ${_assistFmtDateBr(ent)}` : ''}`;
      });
      const extra = urg.length > top.length ? `\n...e mais ${urg.length - top.length} itens` : '';
      return respond(`${nome}, encontrei ${urg.length} OF(s) urgente(s):\n${linhas.join('\n') || '—'}${extra}`);
    }

    if (hasAny('ofs em aberto', 'em aberto') && norm.includes('of')) {
      const { data } = await supabase
        .from('ofs')
        .select('id,status,emp_id,empId,deleted_at')
        .order('created_at', { ascending: false })
        .limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const ativos = rows.filter((o) => !o.deleted_at && !_assistIsCancelada(o));
      const ab = ativos.filter((o) => _assistNorm(o.status || '') === 'em aberto');
      const by = new Map();
      ab.forEach((o) => {
        const emp = String(o.emp_id || o.empId || '—').trim() || '—';
        by.set(emp, (by.get(emp) || 0) + 1);
      });
      const lines = Array.from(by.entries()).sort((a, b) => b[1] - a[1]).map(([emp, c]) => `🏢 ${emp}: ${c}`);
      return respond(`${nome}, OFs em aberto por empresa:\n${lines.join('\n') || '—'}`);
    }

    if (hasAny('quantas ofs', 'quantas of', 'total de ofs', 'quantas ordens') && norm.includes('of')) {
      const { data } = await supabase.from('ofs').select('id,status,deleted_at').order('created_at', { ascending: false }).limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const ativos = rows.filter((o) => !o.deleted_at && !_assistIsCancelada(o));
      return respond(`${nome}, temos ${ativos.length} OF(s) ativas no sistema (amostra até 5000 registros).`);
    }

    if (hasAny('status da of', 'status of', 'situacao da of', 'situação da of') && ofNum) {
      const { data } = await supabase.from('ofs').select('id,of,numero,status,ent,data_entrega,deleted_at').or(`of.eq.${ofNum},numero.eq.${ofNum}`).limit(10);
      const row = Array.isArray(data) && data[0] ? data[0] : null;
      if (!row) return respond(`${nome}, não encontrei a OF #${ofNum}.`);
      const st = String(row.status || '—').trim() || '—';
      const ent = _assistPickOfEntrega(row);
      return respond(`${nome}, a OF #${_assistPickOfNumber(row)} está com status "${st}"${ent ? ` e entrega em ${_assistFmtDateBr(ent)}` : ''}.`);
    }

    if (hasAny('ofs desta semana', 'of desta semana', 'essa semana', 'esta semana') && norm.includes('of')) {
      const { de, ate } = _assistWeekRange(hoje);
      const { data } = await supabase
        .from('ofs')
        .select('id,of,numero,status,ent,data_entrega,deleted_at,cli_id,cliente_id,cliNome,cliente_nome')
        .order('created_at', { ascending: false })
        .limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const ativos = rows.filter((o) => !o.deleted_at && !_assistIsCancelada(o));
      const list = ativos.filter((o) => {
        const ent = _assistPickOfEntrega(o);
        return ent && ent >= de && ent <= ate;
      });
      const cliMap = await _assistLoadClientesByIds(list.map(_assistPickOfClienteId));
      const top = list.slice(0, 10);
      const linhas = top.map((o) => {
        const cid = _assistPickOfClienteId(o);
        const cNome = String(cliMap.get(cid) || o.cliNome || o.cliente_nome || '—').trim() || '—';
        const ent = _assistPickOfEntrega(o);
        return `📦 OF #${_assistPickOfNumber(o)} — ${cNome}${ent ? ` — ${_assistFmtDateBr(ent)}` : ''}`;
      });
      const extra = list.length > top.length ? `\n...e mais ${list.length - top.length} itens` : '';
      return respond(`${nome}, OFs com entrega nesta semana (${_assistFmtDateBr(de)} a ${_assistFmtDateBr(ate)}): ${list.length}\n${linhas.join('\n') || '—'}${extra}`);
    }

    if (hasAny('ofs concluidas', 'ofs concluídas', 'concluidas hoje', 'concluídas hoje', 'concluidas este mes', 'concluídas este mês', 'concluidas no mes', 'concluídas no mês')) {
      const perHoje = norm.includes('hoje');
      const m = month || (new Date().getMonth() + 1);
      const range = perHoje ? { de: hoje, ate: hoje } : _assistMonthRange(year, m);
      const { data } = await supabase
        .from('ofs')
        .select('id,of,numero,status,data_conclusao,deleted_at,cli_id,cliente_id,cliNome,cliente_nome')
        .gte('data_conclusao', range.de)
        .lte('data_conclusao', range.ate)
        .order('data_conclusao', { ascending: false })
        .limit(5000);
      const rows = (Array.isArray(data) ? data : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
      const cliMap = await _assistLoadClientesByIds(rows.map(_assistPickOfClienteId));
      const top = rows.slice(0, 10);
      const linhas = top.map((o) => {
        const cid = _assistPickOfClienteId(o);
        const cNome = String(cliMap.get(cid) || o.cliNome || o.cliente_nome || '—').trim() || '—';
        const dt = _assistPickOfConclusao(o);
        return `✅ OF #${_assistPickOfNumber(o)} — ${cNome}${dt ? ` — ${_assistFmtDateBr(dt)}` : ''}`;
      });
      const extra = rows.length > top.length ? `\n...e mais ${rows.length - top.length} itens` : '';
      const label = perHoje ? _assistFmtDateBr(hoje) : `${String(range.de).slice(5, 7)}/${String(range.de).slice(0, 4)}`;
      return respond(`${nome}, OFs concluídas (${label}): ${rows.length}\n${linhas.join('\n') || '—'}${extra}`);
    }

    if (hasAny('faturamento', 'quanto faturamos', 'vendas de', 'total de') && (norm.includes('fatur') || norm.includes('venda'))) {
      const m = month || (new Date().getMonth() + 1);
      const { de, ate } = _assistMonthRange(year, m);
      const { data } = await supabase
        .from('ofs')
        .select('id,status,data_conclusao,valor_total,valor_venda,val,deleted_at,emp_id,empId')
        .gte('data_conclusao', de)
        .lte('data_conclusao', ate)
        .limit(5000);
      const rows = (Array.isArray(data) ? data : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
      const total = rows.reduce((s, o) => s + _assistPickOfValor(o), 0);
      if (hasAny('por empresa', 'empresa')) {
        const by = new Map();
        rows.forEach((o) => {
          const emp = String(o.emp_id || o.empId || '—').trim() || '—';
          by.set(emp, (by.get(emp) || 0) + _assistPickOfValor(o));
        });
        const lines = Array.from(by.entries()).sort((a, b) => b[1] - a[1]).map(([emp, v]) => `🏢 ${emp}: ${_assistFmtBRL(v)}`);
        return respond(`${nome}, faturamento por empresa em ${String(de).slice(5, 7)}/${String(de).slice(0, 4)}:\n${lines.join('\n') || '—'}`);
      }
      return respond(`${nome}, o faturamento em ${String(de).slice(5, 7)}/${String(de).slice(0, 4)} foi ${_assistFmtBRL(total)}.`);
    }

    if (hasAny('melhor mes do ano', 'melhor mês do ano')) {
      const y = year;
      const sums = [];
      for (let m = 1; m <= 12; m++) {
        const { de, ate } = _assistMonthRange(y, m);
        const { data } = await supabase
          .from('ofs')
          .select('id,status,data_conclusao,valor_total,valor_venda,val,deleted_at')
          .gte('data_conclusao', de)
          .lte('data_conclusao', ate)
          .limit(5000);
        const rows = (Array.isArray(data) ? data : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
        const total = rows.reduce((s, o) => s + _assistPickOfValor(o), 0);
        sums.push({ m, total });
      }
      const best = sums.sort((a, b) => b.total - a.total)[0] || { m: 1, total: 0 };
      return respond(`${nome}, o melhor mês de ${y} foi ${String(best.m).padStart(2, '0')}/${y} com ${_assistFmtBRL(best.total)}.`);
    }

    if (hasAny('faturamento total do ano', 'total do ano', 'faturamento do ano')) {
      const y = year;
      const { de, ate } = { de: `${y}-01-01`, ate: `${y}-12-31` };
      const { data } = await supabase
        .from('ofs')
        .select('id,status,data_conclusao,valor_total,valor_venda,val,deleted_at')
        .gte('data_conclusao', de)
        .lte('data_conclusao', ate)
        .limit(5000);
      const rows = (Array.isArray(data) ? data : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
      const total = rows.reduce((s, o) => s + _assistPickOfValor(o), 0);
      return respond(`${nome}, o faturamento total de ${y} é ${_assistFmtBRL(total)}.`);
    }

    if (hasAny('clientes inativos', 'cliente inativo', 'inativos')) {
      const dt = new Date();
      dt.setDate(dt.getDate() - 30);
      const cut = dt.toISOString().slice(0, 10);
      const { data: ofsAll } = await supabase.from('ofs').select('id,cli_id,cliente_id,created_at,deleted_at').gte('created_at', cut).limit(5000);
      const ofs = (Array.isArray(ofsAll) ? ofsAll : []).filter((o) => !o.deleted_at);
      const activeCli = new Set(ofs.map(_assistPickOfClienteId).filter(Boolean));
      const { data: clsAll } = await supabase.from('clientes').select('id,nome,ativo,created_at').order('created_at', { ascending: false }).limit(5000);
      const cls = Array.isArray(clsAll) ? clsAll : [];
      const inativos = cls.filter((c) => {
        const idc = String(c.id || '').trim();
        const ativo = (c.ativo === undefined) ? true : !!c.ativo;
        return ativo && idc && !activeCli.has(idc);
      });
      const top = inativos.slice(0, 10);
      const linhas = top.map((c) => `👤 ${String(c.nome || '—').trim() || '—'}`);
      const extra = inativos.length > top.length ? `\n...e mais ${inativos.length - top.length} itens` : '';
      return respond(`${nome}, encontrei ${inativos.length} cliente(s) sem OF nos últimos 30 dias:\n${linhas.join('\n') || '—'}${extra}`);
    }

    if (hasAny('top clientes do mes', 'top clientes do mês')) {
      const m = new Date().getMonth() + 1;
      const { de, ate } = _assistMonthRange(year, m);
      const { data } = await supabase
        .from('ofs')
        .select('id,status,data_conclusao,valor_total,valor_venda,val,deleted_at,cli_id,cliente_id')
        .gte('data_conclusao', de)
        .lte('data_conclusao', ate)
        .limit(5000);
      const rows = (Array.isArray(data) ? data : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
      const by = new Map();
      rows.forEach((o) => {
        const cid = _assistPickOfClienteId(o) || '—';
        by.set(cid, (by.get(cid) || 0) + _assistPickOfValor(o));
      });
      const cliMap = await _assistLoadClientesByIds(Array.from(by.keys()).filter((x) => x !== '—'));
      const top = Array.from(by.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const linhas = top.map(([cid, v]) => `🏆 ${cliMap.get(cid) || cid} — ${_assistFmtBRL(v)}`);
      return respond(`${nome}, top 5 clientes do mês (${String(de).slice(5, 7)}/${String(de).slice(0, 4)}):\n${linhas.join('\n') || '—'}`);
    }

    if (hasAny('quantos clientes temos', 'quantos clientes')) {
      const { data } = await supabase.from('clientes').select('id,ativo').limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const ativos = rows.filter((c) => (c.ativo === undefined ? true : !!c.ativo));
      return respond(`${nome}, temos ${ativos.length} cliente(s) ativo(s) (amostra até 5000 registros).`);
    }

    if (hasAny('cliente', 'existe') && norm.includes('cliente') && norm.includes('existe')) {
      const m = norm.match(/\bcliente\s+(.+?)\s+existe\b/);
      const termo = m ? String(m[1] || '').trim() : '';
      if (termo) {
        const { data } = await supabase.from('clientes').select('id,nome').ilike('nome', '%' + termo.replace(/%/g, '') + '%').limit(5);
        const rows = Array.isArray(data) ? data : [];
        if (!rows.length) return respond(`${nome}, não encontrei cliente com esse nome.`);
        const linhas = rows.slice(0, 5).map((c) => `👤 ${String(c.nome || '').trim()} (id ${String(c.id || '').slice(0, 8)})`);
        return respond(`${nome}, encontrei ${rows.length} resultado(s):\n${linhas.join('\n')}`);
      }
    }

    if (hasAny('caixas perdidas', 'perdas') && hasAny('hoje', 'este mes', 'este mês', 'mês', 'mes')) {
      const perHoje = norm.includes('hoje');
      const m = month || (new Date().getMonth() + 1);
      const range = perHoje ? { de: hoje, ate: hoje } : _assistMonthRange(year, m);
      const { data } = await supabase
        .from('ofs')
        .select('id,status,data_conclusao,qtd_perdida,valor_perdido,deleted_at,maquina_perda')
        .gte('data_conclusao', range.de)
        .lte('data_conclusao', range.ate)
        .limit(5000);
      const rows = (Array.isArray(data) ? data : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
      const totalPerd = rows.reduce((s, o) => s + (Number(o.qtd_perdida || 0) || 0), 0);
      const totalValPerd = rows.reduce((s, o) => s + (Number(o.valor_perdido || 0) || 0), 0);
      return respond(`${nome}, perdas no período ${_assistFmtDateBr(range.de)} a ${_assistFmtDateBr(range.ate)}:\n🧯 Caixas perdidas: ${Number(totalPerd).toLocaleString('pt-BR')}\n💸 Valor perdido: ${_assistFmtBRL(totalValPerd)}`);
    }

    if (hasAny('maquina com mais perdas', 'máquina com mais perdas')) {
      const m = month || (new Date().getMonth() + 1);
      const { de, ate } = _assistMonthRange(year, m);
      const { data } = await supabase
        .from('ofs')
        .select('id,status,data_conclusao,qtd_perdida,deleted_at,maquina_perda')
        .gte('data_conclusao', de)
        .lte('data_conclusao', ate)
        .limit(5000);
      const rows = (Array.isArray(data) ? data : []).filter((o) => !o.deleted_at && _assistIsConcluida(o));
      const by = new Map();
      rows.forEach((o) => {
        const maq = String(o.maquina_perda || '').trim() || '—';
        const q = Number(o.qtd_perdida || 0) || 0;
        by.set(maq, (by.get(maq) || 0) + q);
      });
      const best = Array.from(by.entries()).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
      return respond(`${nome}, a máquina com mais perdas em ${String(de).slice(5, 7)}/${String(de).slice(0, 4)} foi "${best[0]}" com ${Number(best[1] || 0).toLocaleString('pt-BR')} caixas perdidas.`);
    }

    if (hasAny('quantas maquinas temos', 'quantas máquinas temos', 'quantas maquinas', 'quantas máquinas')) {
      const { data } = await supabase.from('maquinas').select('id,ativo,nome').limit(5000);
      const rows = Array.isArray(data) ? data : [];
      const ativas = rows.filter((m) => (m.ativo === undefined ? true : !!m.ativo));
      return respond(`${nome}, temos ${ativas.length} máquina(s) ativa(s).`);
    }

    if (hasAny('compras pendentes', 'compras pendente', 'compra pendente')) {
      const { data } = await supabase.from('compras').select('id,fornecedor,status,valor_total,valor,data_pedido,deleted_at').order('created_at', { ascending: false }).limit(200);
      const rows = Array.isArray(data) ? data : [];
      const pend = rows.filter((c) => {
        const st = _assistNorm(c.status || '');
        if (!st) return true;
        return !(st.includes('recebid') || st.includes('entreg'));
      });
      const top = pend.slice(0, 10);
      const linhas = top.map((c) => `🧾 ${String(c.fornecedor || '—').trim() || '—'} — ${String(c.status || 'Pendente')} — ${_assistFmtBRL(c.valor_total ?? c.valor ?? 0)}`);
      const extra = pend.length > top.length ? `\n...e mais ${pend.length - top.length} itens` : '';
      return respond(`${nome}, compras pendentes: ${pend.length}\n${linhas.join('\n') || '—'}${extra}`);
    }

    if (hasAny('fornecedores cadastrados', 'fornecedores', 'fornecedor')) {
      const { data } = await supabase.from('fornecedores').select('id,nome,created_at').order('created_at', { ascending: false }).limit(200);
      const rows = Array.isArray(data) ? data : [];
      const top = rows.slice(0, 10).map((f) => `🏭 ${String(f.nome || '—').trim() || '—'}`);
      const extra = rows.length > top.length ? `\n...e mais ${rows.length - top.length} itens` : '';
      return respond(`${nome}, fornecedores cadastrados: ${rows.length}\n${top.join('\n') || '—'}${extra}`);
    }

    if (hasAny('chapa','chapas') && hasAny('estoque','quanto tem','quantas tem','saldo','disponivel','disponível')) {
      const mChapa = pergunta.match(/(?:chapa|chapas?)\s+(?:de\s+)?(.+?)(?:\s+no\s+estoque|\s+disponivel|\s+disponível|\?|$)/i) ||
                     pergunta.match(/estoque\s+(?:da?\s+)?chapa\s+(.+)$/i) || null;
      const termoBusca = mChapa ? String(mChapa[1]||'').trim() : '';

      const table = 'chapas_estoque';
      let q = supabase.from(table).select('id,nome,nomenclatura,nom,fornecedor,forn,tamanho,tam,quantidade,qtd,quantidade_atual,estoque_minimo,valor_unitario,val').limit(20);
      if (termoBusca) q = q.or(`nomenclatura.ilike.%${termoBusca}%,nom.ilike.%${termoBusca}%,nome.ilike.%${termoBusca}%`);
      else q = q.order('created_at', { ascending: false });

      const { data: chapas } = await q;
      const rows = Array.isArray(chapas) ? chapas : [];
      if (!rows.length) return respond(`${nome}, não encontrei chapas${termoBusca?' com "'+termoBusca+'"':''} no estoque.`);

      const linhas = rows.slice(0,10).map(c => {
        const nom = String(c.nomenclatura||c.nom||c.nome||'—').trim();
        const tam = String(c.tamanho||c.tam||'').trim();
        const forn = String(c.fornecedor||c.forn||'').trim();
        const qtd = Math.trunc(Number(c.quantidade_atual||c.quantidade||c.qtd||0)||0);
        const min = Math.trunc(Number(c.estoque_minimo||0)||0);
        const val = Number(c.valor_unitario||c.val||0);
        const alerta = min > 0 && qtd < min ? ' ⚠️ ABAIXO DO MÍNIMO' : '';
        return `• ${nom}${tam?' ('+tam+')':''} | Saldo: **${qtd}**${min>0?' | Mín: '+min:''}${val>0?' | R$ '+val.toFixed(2):''}${forn?' | '+forn:''}${alerta}`;
      });

      return respond(`${nome}, estoque de chapas${termoBusca?' ('+termoBusca+')':''}:\n${linhas.join('\n')}${rows.length>10?'\n...e mais '+(rows.length-10)+' chapas':''}`);
    }

    if (hasAny('chapa','chapas') && hasAny('adicionar','adicione','entrada','dar entrada','subtrair','retire','retirar','baixar','saida','saída','ajustar','ajuste')) {
      const tipo = hasAny('adicionar','adicione','entrada','dar entrada') ? 'entrada' : hasAny('subtrair','retire','retirar','baixar','saida','saída') ? 'saida' : 'ajuste';
      const mQtd   = pergunta.match(/(\d+)\s*(?:unidades?|un|folhas?|chapas?)?/i);
      const mChapa = pergunta.match(/(?:na|da|na chapa|chapa)\s+(.+?)(?:\s+\d|\s+unidade|\s*$)/i) || pergunta.match(/chapa\s+(.+?)(?:\s+\d|\s*$)/i) || null;
      const qtd = mQtd ? Math.trunc(Number(mQtd[1])||0) : 0;
      const termoBusca = mChapa ? String(mChapa[1]||'').trim().replace(/\d+/g,'').trim() : '';

      if (!qtd || !termoBusca) {
        return respond(`${nome}, para movimentar estoque de chapa preciso saber:\n- Qual chapa (nome ou nomenclatura)\n- Quantidade\n- Tipo: entrada ou saída\n\nEx: "dar entrada de 100 na chapa onda B 1200x900"`);
      }

      const { data: chapas } = await supabase.from('chapas_estoque')
        .select('id,nome,nomenclatura,nom,tamanho,tam,quantidade,qtd,quantidade_atual')
        .or(`nomenclatura.ilike.%${termoBusca}%,nom.ilike.%${termoBusca}%,nome.ilike.%${termoBusca}%`)
        .limit(3);
      const rows = Array.isArray(chapas) ? chapas : [];

      if (!rows.length) return respond(`${nome}, não encontrei chapa com "${termoBusca}".`);
      if (rows.length > 1) {
        const opts = rows.map((c,i)=>`${i+1}. ${String(c.nomenclatura||c.nom||c.nome||'').trim()} ${String(c.tamanho||c.tam||'').trim()}`).join('\n');
        return respond(`${nome}, encontrei mais de uma chapa:\n${opts}\n\nEspecifique melhor o nome.`);
      }

      const chapa = rows[0];
      const nomChapa = String(chapa.nomenclatura||chapa.nom||chapa.nome||'').trim();
      const qtdAtual = Math.trunc(Number(chapa.quantidade_atual||chapa.quantidade||chapa.qtd||0)||0);
      const tipoLabel = tipo === 'entrada' ? 'ENTRADA' : tipo === 'saida' ? 'SAÍDA' : 'AJUSTE';

      const uid = String(req?.usuario?.id || '');
      const actionId = _jarvisStoreAction(uid, {
        type: 'chapa_movimento',
        chapaId: String(chapa.id),
        chapaName: nomChapa,
        tipo,
        qtd,
        qtdAtual,
      });

      return res.json({
        ok: true,
        resposta: `${nome}, confirmar ${tipoLabel} de **${qtd}** unidades na chapa **${nomChapa}**?\nSaldo atual: ${qtdAtual} → Novo saldo: ${tipo==='entrada'?qtdAtual+qtd:tipo==='saida'?qtdAtual-qtd:qtd}`,
        actions: [
          { id: actionId, label: '✅ Confirmar', decision: 'confirm' },
          { id: actionId, label: '❌ Cancelar',  decision: 'cancel'  },
        ]
      });
    }

    const isComplexo = _jarvisHasAny(
      norm,
      'analise', 'análise', 'compare', 'comparar', 'explique', 'por que', 'como melhorar',
      'sugestao', 'sugestão', 'estrategia', 'estratégia', 'previsao', 'previsão',
      'tendencia', 'tendência', 'relatório', 'relatorio', 'dashboard', 'insight'
    );
    const modoReq = String(req.body?.modo || '').trim().toLowerCase();
    const turboDisponivel = !!(String(process.env.ANTHROPIC_API_KEY || '').trim() && OPENAI_API_KEY);
    const modoIA = (modoReq === 'turbo' && turboDisponivel) ? 'turbo' : (isComplexo && OPENAI_API_KEY ? 'turbo' : 'normal');

    const isCmd = _jarvisHasAny(norm, '/ajuda', '/resumo', '/estoque', '/atrasadas', '/dashboard');

    let dadosContexto = {};
    try {
      dadosContexto = await _jarvisBuildContext({ pergunta, norm, hoje, month, year, nomeUsuario: nome });
    } catch (e) {
      console.error('[JARVIS BUILD CONTEXT]', e?.message);
      dadosContexto = {};
    }

    const pediuRelatorio = _jarvisHasAny(norm, 'relatorio', 'relatório', 'gerar relatorio', 'gerar relatório', 'exportar', 'imprimir', 'baixar relatorio', 'baixar relatório', 'pdf');
    if (!isCmd && pediuRelatorio && OPENAI_API_KEY) {
      try {
        const promptRelatorio = `Gere um relatório completo sobre: ${pergunta}

Use os dados do ERP: ${JSON.stringify(dadosContexto, null, 2)}

Retorne APENAS HTML válido (sem markdown, sem explicação fora do HTML).
O HTML deve:
- Ter um <style> interno com CSS para impressão
- Incluir @media print com margens adequadas
- Usar tabelas bem formatadas com bordas
- Ter cabeçalho com logo "Italy Embalagens" e data
- Ter rodapé com total de registros
- Usar cores: fundo branco, texto preto, bordas #ddd
- Ter um botão de impressão: <button onclick="window.print()"
  style="display:block;margin:10px auto;padding:8px 20px;
  background:#1a7a4a;color:white;border:none;border-radius:4px;
  cursor:pointer;font-size:14px" class="no-print">Imprimir relatório</button>
- O botão deve ter class="no-print" para não aparecer na impressão`;

        const rRel = await _callOpenAI({
          mensagem: promptRelatorio,
          sistema: 'Você gera relatórios HTML para impressão. Retorne apenas HTML válido.',
          modelo: 'gpt-4o',
        });

        const htmlRel = String(rRel?.text || '').trim();
        if (htmlRel) {
          return res.json({
            ok: true,
            resposta: 'Relatório gerado! Clique em "Imprimir" para imprimir ou salvar como PDF.',
            html_relatorio: htmlRel,
            html: htmlRel,
            report: true,
            pode_imprimir: true,
            origem: 'openai',
            origem_ia: 'openai',
          });
        }
      } catch (e) {
        console.error('[JARVIS RELATORIO]', e?.message);
      }
    }

    const temIA = !!OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
    if (temIA) {
      let dadosCtx = {};
      try {
        dadosCtx = await _jarvisBuildContext({
          pergunta, norm, hoje, month, year, nomeUsuario: nome
        });
      } catch (eBc) {
        console.error('[JARVIS BC]', eBc?.message);
      }

      try {
        const rFinal = await _callJarvisIA({
          pergunta,
          nomeUsuario: nome,
          dadosContexto: dadosCtx,
          historico: historico || [],
          modo: 'normal',
        });
        if (rFinal?.ok && String(rFinal.text || '').trim()) {
          return respond(String(rFinal.text).trim(), { origem_ia: rFinal.origem });
        }
      } catch (eF) {
        console.error('[JARVIS FALLBACK]', eF?.message);
      }
    }

    return naoEntendi();
  } catch (e) {
    return err(res, e);
  }
});

app.get('/api/ia/status', authMiddleware, async (req, res) => {
  try {
    return res.json({
      ok: true,
      claude: { ativo: !!String(process.env.ANTHROPIC_API_KEY || '').trim(), modelo: 'claude-sonnet-4' },
      openai: { ativo: !!OPENAI_API_KEY, modelo: 'gpt-4o' },
      modo_turbo_disponivel: !!(String(process.env.ANTHROPIC_API_KEY || '').trim() && OPENAI_API_KEY),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post('/api/jarvis/turbo', authMiddleware, async (req, res) => {
  try {
    const { nome: nomeUsuarioFull, email } = await _assistUser(req);
    const nomeUsuario = _jarvisFirstName(nomeUsuarioFull || email || '');
    const pergunta = String(req.body?.pergunta || '').trim();
    const historico = Array.isArray(req.body?.historico) ? req.body.historico : [];

    if (!pergunta) return res.status(400).json({ ok: false, error: 'pergunta_obrigatoria' });

    const hoje = new Date().toISOString().slice(0, 10);
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const norm = _assistNorm(pergunta);

    const dadosContexto = await _jarvisBuildContext({ pergunta, norm, hoje, month, year, nomeUsuario });

    const rIA = await _callJarvisIA({
      pergunta,
      nomeUsuario,
      dadosContexto,
      historico,
      modo: 'turbo',
    });

    return res.json({
      ok: true,
      resposta: rIA.text || 'Não consegui processar.',
      origem: rIA.origem,
      modo: 'turbo',
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post('/api/assistente/acao', authMiddleware, async (req, res) => {
  try {
    const uid = String(req?.usuario?.id || '');
    const id = String(req.body?.id || '').trim();
    const decisao = String(req.body?.decisao || req.body?.decision || 'confirm').trim().toLowerCase();
    const pending = _jarvisGetAction(id, uid);
    const nome = (await _assistUser(req)).nome;
    const first = _jarvisFirstName(nome);
    if (!pending) return res.status(404).json({ ok: false, error: 'acao_expirada' });
    if (decisao === 'cancel') {
      _jarvisPendingActions.delete(id);
      return res.json({ ok: true, resposta: `${first}, ação cancelada.` });
    }
    const act = pending.action || {};
    _jarvisPendingActions.delete(id);

    if (act.type === 'of_cancel') {
      const ofId = act.ofId;
      if (!ofId) return res.json({ ok: true, resposta: `${first}, não encontrei a OF.` });
      await supabase.from('ofs').update({ status: 'Cancelada', deleted_at: new Date().toISOString() }).eq('id', ofId);
      return res.json({ ok: true, resposta: `✅ ${first}, OF #${act.ofNum||act.ofId} cancelada com sucesso.` });
    }

    if (act.type === 'of_set_entrega') {
      const ofId = act.ofId;
      if (!ofId) return res.json({ ok: true, resposta: `${first}, não encontrei a OF.` });
      await supabase.from('ofs').update({ ent: act.data, data_entrega: act.data, updated_at: new Date().toISOString() }).eq('id', ofId);
      return res.json({ ok: true, resposta: `✅ ${first}, data de entrega da OF #${act.ofNum} alterada para ${act.data.split('-').reverse().join('/')}.` });
    }

    if (act.type === 'of_set_qtd') {
      const ofId = act.ofId;
      if (!ofId) return res.json({ ok: true, resposta: `${first}, não encontrei a OF.` });
      await supabase.from('ofs').update({ qtd: act.qtd, quantidade: act.qtd, qtd_pedida: act.qtd, updated_at: new Date().toISOString() }).eq('id', ofId);
      return res.json({ ok: true, resposta: `✅ ${first}, quantidade da OF #${act.ofNum} alterada para ${Number(act.qtd).toLocaleString('pt-BR')} caixas.` });
    }

    if (act.type === 'of_set_urgente') {
      const of = act.ofId ? { id: act.ofId } : await _jarvisFindOFByNumero(act.ofNum);
      if (!of?.id) return res.json({ ok: true, resposta: `${first}, não encontrei a OF #${act.ofNum}.` });
      await _jarvisCallInternal(req, `/api/ofs/${String(of.id)}`, { method: 'PATCH', body: { urg: true, urgente: true } });
      return res.json({ ok: true, resposta: `✅ ${first}, urgência adicionada na OF #${act.ofNum}.` });
    }

    if (act.type === 'of_set_cliente') {
      const of = act.ofId ? { id: act.ofId } : await _jarvisFindOFByNumero(act.ofNum);
      if (!of?.id) return res.json({ ok: true, resposta: `${first}, não encontrei a OF #${act.ofNum}.` });
      const cli = await _jarvisFindClienteByNome(act.clienteNome);
      if (!cli?.id) return res.json({ ok: true, resposta: `${first}, não encontrei o cliente "${act.clienteNome}".` });
      await _jarvisCallInternal(req, `/api/ofs/${String(of.id)}`, { method: 'PATCH', body: { cli_id: cli.id, cliente_id: cli.id, cliNome: cli.nome, cliente_nome: cli.nome } });
      return res.json({ ok: true, resposta: `✅ ${first}, cliente da OF #${act.ofNum} atualizado para ${cli.nome}.` });
    }

    if (act.type === 'of_concluir') {
      const ofId = act.ofId;
      if (!ofId) return res.json({ ok: true, resposta: `${first}, não encontrei a OF.` });
      const qtdProd  = act.qtdProduzida || 0;
      const qtdPerd  = act.qtdPerdida   || 0;
      const maqPerda = act.maquina      || '';
      const now = new Date().toISOString();
      await supabase.from('ofs').update({
        status: 'Concluído',
        qtd_produzida: qtdProd,
        qtd_perdida: qtdPerd,
        maquina_perda: maqPerda || null,
        data_conclusao: now,
        usuario_conclusao: req.usuario?.nome || 'sistema',
        updated_at: now,
      }).eq('id', ofId);
      return res.json({ ok: true, resposta: `✅ ${first}, OF #${act.ofNum} concluída! Produzidas: ${Number(qtdProd).toLocaleString('pt-BR')} cx | Perdidas: ${Number(qtdPerd).toLocaleString('pt-BR')} cx.` });
    }

    if (act.type === 'of_programar') {
      const payload = {};
      if (act.maqNova) {
        payload.fluxo_maquinas = [act.maqNova];
        payload.maq = JSON.stringify([act.maqNova]);
        payload.maquina_atual_index = 0;
      }
      if (act.dataProducao) { payload.data_producao = act.dataProducao; payload.dia = act.dataProducao; }
      payload.updated_at = new Date().toISOString();
      await supabase.from('ofs').update(payload).eq('id', act.ofId);
      return res.json({ok:true, resposta:`✅ ${first}, OF #${act.ofNum} programada!${act.maqNova?' Máquina: '+act.maqNova:''}${act.dataProducao?' | Data: '+act.dataProducao.split('-').reverse().join('/'):''}` });
    }

    if (act.type === 'of_clonar') {
      const {data:ofOrig} = await supabase.from('ofs').select('*').eq('id',act.ofId).maybeSingle();
      if (!ofOrig) return res.json({ok:false, resposta:`${first}, OF original não encontrada.`});
      const {data:last} = await supabase.from('ofs').select('seq,of,numero').order('seq',{ascending:false}).limit(1).maybeSingle();
      const nextSeq = Math.trunc(Number(last?.seq||0)||0)+1;
      const numStr = String(nextSeq);
      const clone = {...ofOrig};
      delete clone.id; delete clone.created_at; delete clone.updated_at; delete clone.deleted_at;
      delete clone.data_conclusao; delete clone.qtd_produzida; delete clone.qtd_perdida;
      delete clone.usuario_conclusao; delete clone.maquina_perda;
      clone.seq = nextSeq; clone.of = numStr; clone.numero = numStr;
      clone.status = 'Em aberto';
      if (act.novaEntrega) { clone.ent = act.novaEntrega; clone.data_entrega = act.novaEntrega; }
      if (act.novoCliId) { clone.cli_id = act.novoCliId; clone.cliente_id = act.novoCliId; }
      clone.created_at = new Date().toISOString();
      clone.updated_at = new Date().toISOString();
      const {data:nova, error} = await supabase.from('ofs').insert([clone]).select('id,of,numero').single();
      if (error) return res.json({ok:false, resposta:`${first}, erro ao clonar: ${error.message}`});
      return res.json({ok:true, resposta:`✅ ${first}, OF #${act.ofNum} clonada! Nova OF criada: #${nova.of||nova.numero}`});
    }

    if (act.type === 'of_reagendar_lote') {
      let ok2=0;
      for (const id of (act.ids||[])) {
        const r = await supabase.from('ofs').update({dia:act.dataDestino,data_producao:act.dataDestino,updated_at:new Date().toISOString()}).eq('id',id);
        if(!r.error) ok2++;
      }
      return res.json({ok:true, resposta:`✅ ${first}, ${ok2} OFs da ${act.maqNome} reagendadas para ${act.dataDestino.split('-').reverse().join('/')}.`});
    }

    if (act.type === 'of_upload_image') {
      const of = act.ofId ? { id: act.ofId } : await _jarvisFindOFByNumero(act.ofNum);
      if (!of?.id) return res.json({ ok: true, resposta: `${first}, não encontrei a OF #${act.ofNum}.` });
      const newId = _jarvisStoreAction(uid, { type: 'of_upload_image_file', ofId: String(of.id || ''), ofNum: String(act.ofNum || '') });
      return res.json({
        ok: true,
        resposta: `${first}, selecione a imagem para a OF #${act.ofNum}:`,
        actions: [
          { id: newId, label: '📎 Enviar imagem', decision: 'upload', ofId: String(of.id || '') },
          { id: newId, label: '❌ Cancelar', decision: 'cancel', ofId: String(of.id || '') },
        ],
      });
    }

    if (act.type === 'chapa_entrada') {
      if (!act.chapaId) return res.json({ ok: true, resposta: `${first}, não encontrei a chapa.` });
      await _jarvisCallInternal(req, `/api/chapas_estoque/${String(act.chapaId)}/movimento`, { method: 'POST', body: { tipo: 'entrada', delta: act.qtd, obs: 'Entrada via JARVIS' } });
      return res.json({ ok: true, resposta: `✅ ${first}, entrada registrada no estoque.` });
    }

    if (act.type === 'chapa_set_min') {
      if (!act.chapaId) return res.json({ ok: true, resposta: `${first}, não encontrei a chapa.` });
      await _jarvisCallInternal(req, `/api/chapas_estoque/${String(act.chapaId)}`, { method: 'PATCH', body: { estoque_minimo: act.min } });
      return res.json({ ok: true, resposta: `✅ ${first}, estoque mínimo atualizado.` });
    }

    if (act.type === 'chapa_movimento') {
      const { chapaId, tipo, qtd, chapaName } = act;
      const payload = { tipo, delta: qtd, qtd, obs: `Movimentação via JARVIS por ${req.usuario?.nome||'sistema'}` };
      if (String(tipo || '') === 'ajuste') payload.quantidade = qtd;
      const j = await _jarvisCallInternal(req, `/api/chapas_estoque/${String(chapaId)}/movimento`, { method: 'POST', body: payload });
      const novoSaldo = j?.qtd_estoque ?? '—';
      return res.json({ ok: true, resposta: `✅ ${first}, ${tipo==='entrada'?'entrada':'saída'} de **${qtd}** na chapa **${chapaName}** registrada! Novo saldo: **${novoSaldo}**` });
    }

    if (act.type === 'cliente_create') {
      await _jarvisCallInternal(req, '/api/clientes', { method: 'POST', body: { nome: act.clienteNome, telefone: act.telefone, ativo: true } });
      return res.json({ ok: true, resposta: `✅ ${first}, cliente cadastrado com sucesso.` });
    }

    if (act.type === 'cliente_set_tel') {
      const cli = await _jarvisFindClienteByNome(act.clienteNome);
      if (!cli?.id) return res.json({ ok: true, resposta: `${first}, não encontrei o cliente "${act.clienteNome}".` });
      await _jarvisCallInternal(req, `/api/clientes/${String(cli.id)}`, { method: 'PUT', body: { telefone: act.telefone } });
      return res.json({ ok: true, resposta: `✅ ${first}, telefone atualizado para ${act.telefone}.` });
    }

    return res.json({ ok: true, resposta: `${first}, ação executada.` });
  } catch (e) {
    return err(res, e);
  }
});

app.post('/api/assistente/upload', authMiddleware, ofUpload.single('file'), async (req, res) => {
  try {
    const uid = String(req?.usuario?.id || '');
    const id = String(req.body?.id || '').trim();
    const pending = _jarvisGetAction(id, uid);
    const nome = (await _assistUser(req)).nome;
    const first = _jarvisFirstName(nome);
    if (!pending) return res.status(404).json({ ok: false, error: 'acao_expirada' });
    const act = pending.action || {};
    if (act.type !== 'of_upload_image_file') return res.status(400).json({ ok: false, error: 'acao_invalida' });
    const f = req.file || null;
    if (!f) return res.status(400).json({ ok: false, error: 'arquivo_obrigatorio' });
    _jarvisPendingActions.delete(id);

    const ext = path.extname(f.originalname || '').toLowerCase() || '.png';
    const filename = `of-images/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    let bucket = 'of-images';
    let upErr = null;
    try {
      const r1 = await supabase.storage.from(bucket).upload(filename, f.buffer, { contentType: f.mimetype, upsert: false });
      upErr = r1?.error || null;
    } catch (e) { upErr = e; }
    if (upErr) {
      bucket = 'uploads';
      const r2 = await supabase.storage.from(bucket).upload(filename, f.buffer, { contentType: f.mimetype, upsert: false });
      if (r2?.error) throw r2.error;
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    const url = String(urlData?.publicUrl || '').trim();
    if (!url) throw new Error('upload_url_missing');

    await _jarvisCallInternal(req, `/api/ofs/${String(act.ofId)}`, { method: 'PATCH', body: { imagem_url: url } });
    return res.json({ ok: true, resposta: `✅ ${first}, imagem da OF #${act.ofNum || ''} atualizada com sucesso!`, images: [url] });
  } catch (e) {
    return err(res, e);
  }
});

app.get('/api/relatorio/cliente_pdf', authMiddleware, async (req, res) => {
  try {
    const cliId   = String(req.query.cliente_id || '').trim();
    const cliNome = String(req.query.cliente_nome || '').trim();
    if (!cliId) return res.status(400).json({ ok: false, error: 'cliente_id obrigatorio' });

    const { data: cli } = await supabase.from('clientes').select('*').eq('id', cliId).maybeSingle();
    const todasOfs = await _jarvisOfsDoCliente(cliId);
    const abertas    = todasOfs.filter(o => { const s=String(o.status||'').toLowerCase(); return !s.includes('conclu')&&!s.includes('cancel'); });
    const concluidas = todasOfs.filter(o => String(o.status||'').toLowerCase().includes('conclu'));
    const hoje = new Date().toLocaleDateString('pt-BR');

    const fmtData = s => { if(!s) return '—'; const m=String(s).slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?`${m[3]}/${m[2]}/${m[1]}`:s; };
    const esc = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    const rowsAbertas = abertas.map(o => {
      const ent = String(o.data_entrega||o.ent||'').slice(0,10);
      const atras = ent && ent < new Date().toISOString().slice(0,10);
      return `<tr${atras?' style="background:#fff3cd"':''}>
        <td>${esc(o.of||o.numero||'')}</td>
        <td>${esc(o.descricao||o.prodDesc||o.produto||'')}</td>
        <td>${Math.trunc(Number(o.qtd_pedida||o.quantidade||o.qtd||0)||0).toLocaleString('pt-BR')}</td>
        <td>${esc(o.status||'')}</td>
        <td>${fmtData(ent)}${atras?' ⚠️':''}</td>
        <td>${esc(fmtData(String(o.data_producao||o.dia||'').slice(0,10)))}</td>
      </tr>`;
    }).join('');

    const rowsConc = concluidas.slice(0,20).map(o => `<tr>
      <td>${esc(o.of||o.numero||'')}</td>
      <td>${esc(o.descricao||o.prodDesc||o.produto||'')}</td>
      <td>${Math.trunc(Number(o.qtd_produzida||o.qtd||0)||0).toLocaleString('pt-BR')}</td>
      <td>${fmtData(String(o.data_conclusao||'').slice(0,10))}</td>
      <td>R$ ${Number(o.valor_total||o.valor_venda||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
    </tr>`).join('');

    const totalCaixas = abertas.reduce((s,o)=>s+Math.trunc(Number(o.qtd_pedida||o.quantidade||o.qtd||0)||0),0);
    const totalValor  = abertas.reduce((s,o)=>s+Number(o.valor_total||o.valor_venda||0),0);

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Relatório — ${esc(cli?.nome||cliNome)}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#222;margin:20px}
      h1{font-size:18px;color:#1a1a2e;margin-bottom:4px}
      h2{font-size:14px;color:#1a1a2e;margin:16px 0 6px}
      .info{color:#555;margin-bottom:12px;font-size:11px}
      .resumo{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap}
      .card{background:#f0f4ff;border-radius:6px;padding:10px 16px;min-width:120px}
      .card-num{font-size:22px;font-weight:bold;color:#1a1a2e}
      .card-label{font-size:10px;color:#555;margin-top:2px}
      table{width:100%;border-collapse:collapse;margin-bottom:16px}
      th{background:#1a1a2e;color:#fff;padding:6px 8px;text-align:left;font-size:11px}
      td{padding:5px 8px;border-bottom:1px solid #eee;font-size:11px}
      tr:nth-child(even) td{background:#f9f9f9}
      .footer{margin-top:24px;color:#888;font-size:10px;border-top:1px solid #eee;padding-top:8px}
      @media print{body{margin:10px}.no-print{display:none}}
    </style></head><body>
    <div class="no-print" style="margin-bottom:12px">
      <button onclick="window.print()" style="padding:8px 16px;background:#1a1a2e;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px">🖨️ Imprimir / Salvar PDF</button>
    </div>
    <h1>Italy Embalagens — Relatório de OFs</h1>
    <div class="info">
      Cliente: <strong>${esc(cli?.nome||cliNome)}</strong>
      ${cli?.cidade?' | Cidade: '+esc(cli.cidade):''}
      ${cli?.cnpj?' | CNPJ: '+esc(cli.cnpj):''}
      <br>Gerado em: ${hoje}
    </div>
    <div class="resumo">
      <div class="card"><div class="card-num">${abertas.length}</div><div class="card-label">Em aberto</div></div>
      <div class="card"><div class="card-num">${totalCaixas.toLocaleString('pt-BR')}</div><div class="card-label">Caixas em aberto</div></div>
      <div class="card"><div class="card-num">R$ ${totalValor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div class="card-label">Valor em aberto</div></div>
      <div class="card"><div class="card-num">${concluidas.length}</div><div class="card-label">Concluídas</div></div>
    </div>
    ${abertas.length > 0 ? `
    <h2>🔵 OFs em Aberto (${abertas.length})</h2>
    <table><thead><tr><th>Nº OF</th><th>Produto</th><th>Qtd (cx)</th><th>Status</th><th>Entrega</th><th>Produção</th></tr></thead>
    <tbody>${rowsAbertas}</tbody></table>` : ''}
    ${concluidas.length > 0 ? `
    <h2>✅ OFs Concluídas (${concluidas.length > 20 ? 'últimas 20 de '+concluidas.length : concluidas.length})</h2>
    <table><thead><tr><th>Nº OF</th><th>Produto</th><th>Qtd (cx)</th><th>Conclusão</th><th>Valor</th></tr></thead>
    <tbody>${rowsConc}</tbody></table>` : ''}
    <div class="footer">Italy Embalagens — ${hoje} — Relatório gerado pelo sistema ERP</div>
    </body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="relatorio_${cliId}.html"`);
    return res.send(html);
  } catch(e) {
    return res.status(500).json({ ok: false, error: String(e?.message||e) });
  }
});

app.post('/api/ofs/:id/baixa_maquina', authMiddleware, async (req, res) => {
  try {
    const ofId = String(req.params.id || '').trim();
    const maquina = String(req.body?.maquina || req.body?.maquina_nome || '').trim();
    const operador = String(req.body?.operador || req.usuario?.nome || '').trim();
    const qtdProduzida = Math.trunc(Number(req.body?.qtd_produzida || 0) || 0);
    const temProblema = !!(req.body?.tem_problema || req.body?.temProblema);
    const obsProblema = String(req.body?.obs_problema || req.body?.obsProblema || '').trim();
    const qtdPerdida = Math.trunc(Number(req.body?.qtd_perdida || 0) || 0);
    const imagemUrl = String(req.body?.imagem_url || '').trim();

    if (!ofId) return res.status(400).json({ ok: false, error: 'id obrigatório' });
    if (!maquina) return res.status(400).json({ ok: false, error: 'maquina obrigatória' });

    const { data: of, error: errOf } = await supabase.from('ofs').select('*').eq('id', ofId).maybeSingle();
    if (errOf || !of) return res.status(404).json({ ok: false, error: 'OF não encontrada' });

    const now = new Date().toISOString();

    let fluxoRaw = of.fluxo_maquinas;
    if (typeof fluxoRaw === 'string') { try { fluxoRaw = JSON.parse(fluxoRaw || '[]'); } catch (_) { fluxoRaw = []; } }
    const fluxoArr = Array.isArray(fluxoRaw) ? fluxoRaw : [];
    const isFluxoObj = fluxoArr.some(x => x && typeof x === 'object');

    let fluxoAtualizado = fluxoArr;
    let novoIdx = Number(of.maquina_atual_index || 0) || 0;

    if (isFluxoObj) {
      fluxoAtualizado = fluxoArr.map(row => {
        if (!row || typeof row !== 'object') return row;
        const nomeMaq = String(row.nome || row.maquina || row.name || '').trim().toUpperCase();
        if (nomeMaq === maquina.toUpperCase()) {
          return { ...row, concluido: true, data_baixa: now, operador: operador || null, qtd_baixa: qtdProduzida || null };
        }
        return row;
      });
    }

    novoIdx = novoIdx + 1;
    const todasConcluidas = isFluxoObj
      ? fluxoAtualizado.every(x => x && typeof x === 'object' ? !!x.concluido : true)
      : novoIdx >= fluxoArr.length;

    const updatePayload = {
      fluxo_maquinas: fluxoAtualizado,
      maquina_atual_index: novoIdx,
      updated_at: now,
    };
    if (String(of.status || '').toLowerCase() === 'em aberto') {
      updatePayload.status = 'Em Produção';
    }

    const upd = await ofsUpdateWithRetry(ofId, updatePayload);
    if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message });

    try {
      await supabase.from('historico_acoes').insert([{
        data_hora: now,
        tipo_acao: 'baixa_maquina',
        descricao: `OF #${of.of || of.numero} baixada na máquina ${maquina}${qtdProduzida > 0 ? ` — ${qtdProduzida.toLocaleString('pt-BR')} cx` : ''}${temProblema ? ' ⚠️ COM PROBLEMA' : ''}`,
        usuario: operador || req.usuario?.nome || 'sistema',
      }]);
    } catch (_) {}

    if (temProblema && (obsProblema || qtdPerdida > 0 || imagemUrl)) {
      const cliId = String(of.cli_id || of.cliente_id || of.cliId || '').trim();
      let cliNome = '';
      if (cliId) {
        try {
          const { data: cliData } = await supabase.from('clientes').select('nome').eq('id', cliId).maybeSingle();
          cliNome = String(cliData?.nome || '').trim();
        } catch (_) {}
      }
      const inconf = {
        of_id: ofId,
        of_numero: String(of.of || of.numero || ''),
        cliente_id: cliId || null,
        cliente_nome: cliNome || String(of.cliNome || of.cliente_nome || '').trim(),
        maquina: maquina,
        operador: operador || req.usuario?.nome || '',
        obs: obsProblema,
        qtd_perdida: qtdPerdida || 0,
        imagem_url: imagemUrl || String(of.imagem_url || '').trim() || null,
        imagem_problema_url: imagemUrl || null,
        status: 'Aberta',
        emp_id: String(of.emp_id || of.empId || '').trim() || null,
        created_at: now,
      };
      Object.keys(inconf).forEach(k => { if (inconf[k] === null || inconf[k] === '') delete inconf[k]; });
      try { await supabase.from('inconformidades').insert([inconf]); } catch (e) { console.warn('[BAIXA MAQ] inconformidade:', e?.message); }
    }

    return res.json({
      ok: true,
      data: upd.data,
      todasConcluidas,
      mensagem: todasConcluidas
        ? `✅ OF #${of.of || of.numero} passou por todas as máquinas! Agora você pode fazer a Conclusão Final.`
        : `✅ OF #${of.of || of.numero} baixada na máquina ${maquina}.`,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get('/api/inconformidades_controle', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('inconformidades')
      .select('*')
      .order('created_at', { ascending: false });
    if (req.query.empId) q = q.eq('emp_id', req.query.empId);
    if (req.query.status) q = q.eq('status', req.query.status);
    if (req.query.maquina) q = q.eq('maquina', req.query.maquina);
    if (req.query.de) q = q.gte('created_at', req.query.de);
    if (req.query.ate) q = q.lte('created_at', req.query.ate + 'T23:59:59');
    const { data, error } = await q.limit(500);
    if (error) {
      const m = String(error.message || '').toLowerCase();
      if (m.includes('does not exist') || m.includes('relation')) return ok(res, []);
      throw error;
    }
    return ok(res, data || []);
  } catch (e) { return err(res, e); }
});

app.put('/api/inconformidades_controle/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const payload = { ...(req.body || {}), updated_at: new Date().toISOString() };
    delete payload.id;
    const { data, error } = await supabase.from('inconformidades').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return ok(res, data);
  } catch (e) { return err(res, e); }
});

function _tzParts(date, timeZone){
  const d = date instanceof Date ? date : new Date(date);
  const tz = String(timeZone || 'America/Sao_Paulo');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(d);
  const get = (t)=> parts.find(p=>p.type===t)?.value || '';
  return {
    y: Number(get('year')) || 0,
    m: Number(get('month')) || 0,
    d: Number(get('day')) || 0,
    hh: Number(get('hour')) || 0,
    mm: Number(get('minute')) || 0,
    ss: Number(get('second')) || 0,
    isoDate: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

function _isoDateFromTzNow(timeZone){
  try{ return _tzParts(new Date(), timeZone).isoDate; }catch(_){ return new Date().toISOString().slice(0,10); }
}

function _addDaysIso(iso, delta){
  try{
    const d = new Date(String(iso||'').slice(0,10) + 'T00:00:00');
    if(isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + (Number(delta)||0));
    return d.toISOString().slice(0,10);
  }catch(_){ return ''; }
}

function _monthKey(iso){
  return String(iso||'').slice(0,7);
}

function _monthStartIso(iso){
  const s = String(iso||'').slice(0,10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return '';
  return `${m[1]}-${m[2]}-01`;
}

function _safeParseJsonLoose(txt){
  const raw = String(txt||'').trim();
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(_){}
  const m = raw.match(/\{[\s\S]*\}/);
  if(m){ try{ return JSON.parse(m[0]); }catch(_){} }
  return null;
}

function _uniqEmails(list){
  const out = [];
  const seen = new Set();
  (Array.isArray(list)?list:[]).forEach((x)=>{
    const e = String(x||'').trim().toLowerCase();
    if(!e || !e.includes('@')) return;
    if(seen.has(e)) return;
    seen.add(e);
    out.push(e);
  });
  return out;
}

async function _analyticsPadroesPerdaCompute({ empId, meses }){
  const nMeses = Math.max(1, Math.min(12, Math.trunc(Number(meses || 3) || 3)));
  const now = new Date();
  const dtIni = new Date(now.getFullYear(), now.getMonth() - (nMeses - 1), 1);
  const iniIso = dtIni.toISOString().slice(0,10);
  let q = supabase
    .from('caixas_perdidas')
    .select('id,of_id,qtd_perdida,maquina_perda,maquina,maquina_nome,data,created_at,emp_id')
    .gte('data', iniIso)
    .limit(5000);
  if(empId) q = q.eq('emp_id', empId);
  const { data, error } = await q;
  if(error){
    const msg = String(error.message||error).toLowerCase();
    if(msg.includes('does not exist') || msg.includes('not exist')) return { ok:true, data:{ empId: empId||null, meses:nMeses, grupos:[], alertas:[], pior_combinacao:null } };
    throw error;
  }
  const rows = Array.isArray(data) ? data : [];
  const pickMaq = (r)=> String(r?.maquina_perda || r?.maquina_nome || r?.maquina || '').trim() || '—';
  const dowName = (dow)=>{
    const map = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    return map[dow] || '—';
  };
  const turno = (h)=>{
    const hh = Number(h)||0;
    if(hh >= 6 && hh < 12) return 'manhã';
    if(hh >= 12 && hh < 18) return 'tarde';
    return 'noite';
  };
  const groups = new Map();
  const perMaq = new Map();
  const allOfs = new Set();
  let totalLost = 0;
  rows.forEach((r)=>{
    const mk = pickMaq(r);
    const lost = Math.trunc(Number(r?.qtd_perdida||0) || 0);
    totalLost += lost;
    const ofId = String(r?.of_id||'').trim();
    if(ofId) allOfs.add(ofId);
    const dtRaw = String(r?.created_at || r?.data || '').trim() || '';
    const dt = dtRaw ? new Date(dtRaw) : new Date();
    const dow = dt.getDay();
    const hr = dt.getHours();
    const key = `${mk}||${dow}||${turno(hr)}`;
    const cur = groups.get(key) || { maquina_perda: mk, dia_semana: dowName(dow), turno: turno(hr), total_perdido: 0, ofs: new Set() };
    cur.total_perdido += lost;
    if(ofId) cur.ofs.add(ofId);
    groups.set(key, cur);
    const mcur = perMaq.get(mk) || { total:0, ofs:new Set() };
    mcur.total += lost;
    if(ofId) mcur.ofs.add(ofId);
    perMaq.set(mk, mcur);
  });
  const geralDen = Math.max(1, allOfs.size || rows.length || 1);
  const mediaGeral = totalLost / geralDen;
  const grupos = [...groups.values()].map((g)=>{
    const nOf = Math.max(1, g.ofs.size || 0);
    return { maquina_perda: g.maquina_perda, dia_semana: g.dia_semana, turno: g.turno, total_perdido: g.total_perdido, media_por_of: g.total_perdido / nOf };
  }).sort((a,b)=> (b.total_perdido - a.total_perdido));
  const pior = grupos[0] || null;
  const alertas = [];
  [...perMaq.entries()].forEach(([mk, v])=>{
    const den = Math.max(1, v.ofs.size || 0);
    const med = v.total / den;
    if(med > (mediaGeral * 2) && v.total > 0){
      alertas.push({ maquina: mk, media_por_of: med, media_geral: mediaGeral, fator: mediaGeral > 0 ? (med / mediaGeral) : null });
    }
  });
  alertas.sort((a,b)=> (b.media_por_of - a.media_por_of));
  return {
    ok: true,
    data: {
      empId: empId || null,
      meses: nMeses,
      total_perdido: totalLost,
      media_geral_por_of: mediaGeral,
      pior_combinacao: pior,
      grupos: grupos.slice(0, 500),
      alertas: alertas.slice(0, 50),
    }
  };
}

function _horasUteisAteEntrega(hojeIso, entregaIso){
  const h = String(hojeIso||'').slice(0,10);
  const e = String(entregaIso||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(h) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return 0;
  if(e <= h) return 0;
  const start = new Date(h + 'T00:00:00');
  const end = new Date(e + 'T00:00:00');
  if(isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  let hrs = 0;
  const day = new Date(start);
  while(day < end){
    const dow = day.getDay();
    if(dow !== 0 && dow !== 6) hrs += 10;
    day.setDate(day.getDate() + 1);
  }
  return hrs;
}

async function _analyticsPrevisaoAtrasosCompute({ empId }){
  const hojeIso = _isoDateFromTzNow(process.env.REPORT_TZ || 'America/Sao_Paulo');
  const statusNotIn = '("Concluído","Concluido","Cancelada","Cancelado","Pedido Pronto")';
  let q = supabase
    .from('ofs')
    .select('id,of,numero,status,cli_id,cliId,cliente_id,descricao,cliNome,cliente_nome,ent,data_entrega,data_producao,dia,fluxo_maquinas,maq,maquina_atual_index,qtd,quantidade,qtd_produzida,created_at,emp_id,deleted_at')
    .is('deleted_at', null)
    .not('status', 'in', statusNotIn)
    .limit(5000);
  if(empId) q = q.eq('emp_id', empId);
  const { data: ofsRaw, error: eOf } = await q;
  if(eOf) throw eOf;
  const ofs = Array.isArray(ofsRaw) ? ofsRaw : [];
  const empFilter = String(empId||'').trim();
  const ativos = empFilter ? ofs.filter(o=>String(o?.emp_id||o?.empId||o?.empresa_id||'').trim()===empFilter) : ofs;

  const { data: maqsRaw } = await supabase.from('maquinas').select('id,nome,producao,phora,setup_medio,setup').eq('ativo', true).limit(500);
  const maqs = Array.isArray(maqsRaw) ? maqsRaw : [];
  const maqMap = new Map(maqs.map(m=>{
    const nome = String(m?.nome||'').trim();
    const prod = Number(m?.producao ?? m?.phora ?? 0) || 0;
    const setup = Number(m?.setup_medio ?? m?.setup ?? 0) || 0;
    return [nome, { prodHora: prod, setupMin: setup }];
  }));

  const pickEntrega = (o)=> String(o?.data_entrega ?? o?.ent ?? '').slice(0,10);
  const pickQtd = (o)=> Number(o?.qtd_produzida ?? o?.qtd ?? o?.quantidade ?? 0) || 0;
  const queueByMaq = new Map();
  ativos.forEach((o)=>{
    const mk = String(_ofPickMaqAtualName(o) || '').trim();
    if(!mk) return;
    if(!queueByMaq.has(mk)) queueByMaq.set(mk, []);
    queueByMaq.get(mk).push(o);
  });
  const avgHrsByMaq = new Map();
  queueByMaq.forEach((arr, mk)=>{
    const meta = maqMap.get(mk) || { prodHora: 0, setupMin: 0 };
    const prodHora = Number(meta.prodHora||0) || 0;
    const setupH = (Number(meta.setupMin||0) || 0) / 60;
    const est = arr.map((o)=>{
      const qtd = Math.max(0, pickQtd(o));
      const h = (prodHora > 0 ? (qtd / prodHora) : 0) + setupH;
      return Number.isFinite(h) ? h : 0;
    }).filter(x=>x > 0);
    const avg = est.length ? (est.reduce((s,x)=>s+x,0) / est.length) : 1;
    avgHrsByMaq.set(mk, avg);
  });

  const out = [];
  for(const ofRow of ativos){
    const entrega = pickEntrega(ofRow);
    if(!entrega) continue;
    const fluxo = _ofPickFluxoNames(ofRow);
    if(!fluxo.length) continue;
    const horasDisp = _horasUteisAteEntrega(hojeIso, entrega);
    let horasEst = 0;
    for(const mk of fluxo){
      const qArr = queueByMaq.get(mk) || [];
      const ahead = qArr.filter((o)=>{
        if(String(o?.id||'') === String(ofRow?.id||'')) return false;
        const e2 = pickEntrega(o);
        return e2 && entrega && e2 < entrega;
      }).length;
      const avg = Number(avgHrsByMaq.get(mk) || 1) || 1;
      horasEst += ahead * avg;
    }
    const lim = horasDisp * 0.8;
    const limMed = horasDisp * 0.6;
    let risco = 'ok';
    if(horasEst > lim) risco = 'alto';
    else if(horasEst > limMed) risco = 'medio';
    const cliente = String(ofRow?.cliNome || ofRow?.cliente_nome || '').trim();
    const numero = String(ofRow?.of || ofRow?.numero || '').trim();
    out.push({
      of_id: ofRow.id,
      numero,
      cliente,
      entrega,
      risco,
      horas_disponiveis: Number(horasDisp.toFixed(2)),
      horas_estimadas: Number(horasEst.toFixed(2)),
    });
  }
  return { ok:true, data: out.sort((a,b)=> String(a.entrega).localeCompare(String(b.entrega)) || String(b.risco).localeCompare(String(a.risco))) };
}

async function _notificarRiscoAtraso({ empId, items }){
  try{
    const arr = Array.isArray(items) ? items : [];
    const altos = arr.filter(x=>x && x.risco === 'alto').slice(0, 50);
    if(!altos.length) return;
    const agora = new Date().toISOString();
    for(const it of altos){
      const msg = `⚠️ Risco ALTO de atraso — OF #${it.numero||it.of_id} — entrega ${it.entrega} (estimado ${it.horas_estimadas}h / disponível ${it.horas_disponiveis}h)`;
      const { data: existente, error: e1 } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('mensagem', msg)
        .eq('lida', false)
        .limit(1);
      if(e1) continue;
      if(Array.isArray(existente) && existente.length) continue;
      await supabase.from('notificacoes').insert([{
        mensagem: msg,
        tipo: 'warning',
        lida: false,
        data_hora: agora,
        criado_por: 'AUTO',
        emp_id: empId || null,
      }]);
    }
  }catch(_){}
}

app.get('/api/analytics/padroes_perda', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const empId = String(req.query.empId || '').trim();
    const meses = Math.max(1, Math.min(12, Math.trunc(Number(req.query.meses || 3) || 3)));
    const r = await _analyticsPadroesPerdaCompute({ empId: empId || null, meses });
    return res.json(r);
  }catch(e){ return err(res, e); }
});

app.get('/api/analytics/previsao_atrasos', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const empId = String(req.query.empId || '').trim();
    const r = await _analyticsPrevisaoAtrasosCompute({ empId: empId || null });
    try{ await _notificarRiscoAtraso({ empId: empId || null, items: r?.data || [] }); }catch(_){}
    return res.json(r);
  }catch(e){ return err(res, e); }
});

async function _anthropicExtrairPedidoJson(texto){
  const key = String(process.env.ANTHROPIC_API_KEY || '').trim();
  if(!key) throw new Error('missing_anthropic_key');
  const hojeIso = _isoDateFromTzNow(process.env.REPORT_TZ || 'America/Sao_Paulo');
  const system =
    'Você extrai dados de pedidos de caixas de papelão. Retorne APENAS JSON válido sem markdown:\n' +
    '{ cliente_nome, produto, quantidade, comprimento_mm, largura_mm, altura_mm, onda, data_entrega (YYYY-MM-DD), urgente (bool), observacoes }\n' +
    'Se não conseguir extrair um campo, use null. Data relativa como "semana que vem" = hoje + 7 dias.';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 700,
      system,
      messages: [
        { role: 'user', content: `Hoje: ${hojeIso}\n\nPedido:\n${String(texto||'')}` }
      ],
    }),
  });
  const j = await r.json().catch(()=>null);
  if(!r.ok) throw new Error(String(j?.error?.message || j?.error || r.status));
  const txt = Array.isArray(j?.content) ? j.content.map(c=>c && c.type==='text'?String(c.text||''):'').join('\n').trim() : String(j?.content||j?.text||'').trim();
  const parsed = _safeParseJsonLoose(txt);
  if(!parsed || typeof parsed !== 'object') throw new Error('json_parse_failed');
  const fixIso = (s)=>{
    const raw = String(s||'').trim();
    if(!raw) return null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    return null;
  };
  const out = {
    cliente_nome: parsed.cliente_nome != null ? String(parsed.cliente_nome||'').trim() : null,
    produto: parsed.produto != null ? String(parsed.produto||'').trim() : null,
    quantidade: parsed.quantidade != null ? Math.trunc(Number(parsed.quantidade)||0) : null,
    comprimento_mm: parsed.comprimento_mm != null ? Math.trunc(Number(parsed.comprimento_mm)||0) : null,
    largura_mm: parsed.largura_mm != null ? Math.trunc(Number(parsed.largura_mm)||0) : null,
    altura_mm: parsed.altura_mm != null ? Math.trunc(Number(parsed.altura_mm)||0) : null,
    onda: parsed.onda != null ? String(parsed.onda||'').trim() : null,
    data_entrega: fixIso(parsed.data_entrega),
    urgente: parsed.urgente != null ? !!parsed.urgente : null,
    observacoes: parsed.observacoes != null ? String(parsed.observacoes||'').trim() : null,
  };
  if(!out.data_entrega && typeof parsed.data_entrega === 'string'){
    const n = _assistNorm(parsed.data_entrega);
    if(n.includes('semana que vem') || n.includes('semana vem') || n.includes('semana que vem')){
      out.data_entrega = _addDaysIso(hojeIso, 7) || null;
    }
  }
  return out;
}

async function _pedidoLinguagemNaturalProcess({ texto, empId, usuario_id, req }){
  const extraidos = await _anthropicExtrairPedidoJson(texto);
  const faltando = [];
  if(!extraidos.cliente_nome) faltando.push('cliente_nome');
  if(!extraidos.produto) faltando.push('produto');
  if(!(Number(extraidos.quantidade||0) > 0)) faltando.push('quantidade');
  if(!extraidos.data_entrega) faltando.push('data_entrega');
  if(faltando.length){
    return { ok:false, dados_extraidos: extraidos, campos_faltando: faltando };
  }
  const termo = String(extraidos.cliente_nome||'').replace(/%/g,'').trim();
  let qCli = supabase.from('clientes').select('id,nome').ilike('nome', `%${termo}%`).limit(10);
  if(empId) qCli = qCli.eq('emp_id', empId);
  const { data: clientesRaw } = await qCli;
  const clientes = Array.isArray(clientesRaw) ? clientesRaw : [];
  if(!clientes.length){
    const sugSet = new Set();
    const tokens = _assistNorm(termo).split(/\s+/).filter(Boolean).slice(0, 4);
    for(const tk of tokens){
      if(tk.length < 2) continue;
      let q2 = supabase.from('clientes').select('nome').ilike('nome', `%${tk.replace(/%/g,'')}%`).limit(10);
      if(empId) q2 = q2.eq('emp_id', empId);
      const { data: d2 } = await q2;
      (Array.isArray(d2)?d2:[]).forEach((c)=>{ const n = String(c?.nome||'').trim(); if(n) sugSet.add(n); });
      if(sugSet.size >= 10) break;
    }
    return { ok:false, dados_extraidos: extraidos, erro:'cliente_nao_encontrado', sugestoes: Array.from(sugSet).slice(0, 10) };
  }
  const low = _assistNorm(termo);
  const exato = clientes.find(c=>_assistNorm(c?.nome||'') === low) || clientes[0];
  const cliId = String(exato?.id||'').trim();
  if(!cliId){
    return { ok:false, dados_extraidos: extraidos, erro:'cliente_nao_encontrado', sugestoes: clientes.map(c=>String(c?.nome||'').trim()).filter(Boolean).slice(0,10) };
  }
  const payload = {
    cli_id: cliId,
    cliId,
    cliente_id: cliId,
    cliNome: String(exato?.nome||'').trim(),
    descricao: String(extraidos.produto||'').trim(),
    prodDesc: String(extraidos.produto||'').trim(),
    qtd: Math.trunc(Number(extraidos.quantidade)||0),
    quantidade: Math.trunc(Number(extraidos.quantidade)||0),
    ent: extraidos.data_entrega,
    data_entrega: extraidos.data_entrega,
    onda: extraidos.onda || null,
    caixa_comprimento: extraidos.comprimento_mm || null,
    caixa_largura: extraidos.largura_mm || null,
    caixa_altura: extraidos.altura_mm || null,
    urg: !!extraidos.urgente,
    urgente: !!extraidos.urgente,
    obs: extraidos.observacoes ? String(extraidos.observacoes) : '',
    emp_id: empId || 'E1',
    criado_por: usuario_id || null,
    status: 'Em aberto',
  };

  if(req){
    const r = await _jarvisCallInternal(req, '/api/ofs', { method:'POST', body: payload });
    const created = r?.data || null;
    if(!created) throw new Error('of_create_failed');
    return { ok:true, of: created, cliente_encontrado:true, dados_extraidos: extraidos };
  }

  const filtered = ofPayloadFiltrado(payload);
  if ((filtered.of == null || String(filtered.of || '').trim() === '') && (filtered.numero == null || String(filtered.numero || '').trim() === '')) {
    try {
      const { data: last } = await supabase
        .from('ofs')
        .select('seq,of,numero')
        .order('seq', { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastSeq = Math.trunc(Number(last?.seq || 0) || 0);
      const nextSeq = lastSeq > 0 ? (lastSeq + 1) : 1;
      filtered.seq = nextSeq;
      const numStr = String(nextSeq);
      filtered.of = numStr;
      filtered.numero = numStr;
    } catch (_) {}
  }
  const createdRes = await ofsInsertWithRetry(ofIn(filtered));
  if (createdRes.error) throw createdRes.error;
  let created = createdRes.data;
  try{
    const sug = await _autoSugerirMaquinaParaOF(payload, created);
    if(sug && sug.ok && sug.updated) created = sug.updated;
  }catch(_){}
  return { ok:true, of: created, cliente_encontrado:true, dados_extraidos: extraidos };
}

app.post('/api/pedido/linguagem_natural', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const texto = String(req.body?.texto || '').trim();
    const empId = String(req.body?.empId || req.body?.emp_id || '').trim();
    const usuario_id = String(req.body?.usuario_id || req?.usuario?.id || '').trim();
    if(!texto) return res.status(400).json({ ok:false, error:'texto_obrigatorio' });
    const r = await _pedidoLinguagemNaturalProcess({ texto, empId: empId || null, usuario_id: usuario_id || null, req });
    return res.json(r);
  }catch(e){ return err(res, e); }
});

async function _sequenciamentoListar({ maquina, empId }){
  const statusNotIn = '("Concluído","Concluido","Cancelada","Cancelado","Pedido Pronto")';
  let q = supabase
    .from('ofs')
    .select('id,of,numero,status,cliNome,cliente_nome,cli_id,cliente_id,data_entrega,ent,prioridade,prioridade_producao,urg,urgente,fluxo_maquinas,maq,maquina_atual_index,created_at,emp_id,deleted_at,tipo_caixa,tipo_caixa_id,onda')
    .is('deleted_at', null)
    .not('status', 'in', statusNotIn)
    .limit(5000);
  if(empId) q = q.eq('emp_id', empId);
  const { data: ofsRaw, error } = await q;
  if(error) throw error;
  const ofs = Array.isArray(ofsRaw)?ofsRaw:[];
  const mk = String(maquina||'').trim();
  const filtered = mk ? ofs.filter(o=>String(_ofPickMaqAtualName(o)||'').trim()===mk) : ofs;
  const ord = (a,b)=>{
    const ua = !!(a?.urg || a?.urgente);
    const ub = !!(b?.urg || b?.urgente);
    if(ua !== ub) return ua ? -1 : 1;
    const ea = String(a?.data_entrega ?? a?.ent ?? '9999-99-99').slice(0,10) || '9999-99-99';
    const eb = String(b?.data_entrega ?? b?.ent ?? '9999-99-99').slice(0,10) || '9999-99-99';
    if(ea !== eb) return ea.localeCompare(eb);
    const pa = Number(a?.prioridade_producao ?? a?.prioridade ?? 0) || 0;
    const pb = Number(b?.prioridade_producao ?? b?.prioridade ?? 0) || 0;
    if(pa !== pb) return pb - pa;
    return String(a?.created_at||'').localeCompare(String(b?.created_at||''));
  };
  const base = filtered.slice().sort(ord);
  if(!mk) return base;
  let manual = null;
  try{
    const { data: man, error: em } = await supabase
      .from('sequenciamento_manual')
      .select('of_id,posicao,maquina,updated_at')
      .eq('maquina', mk)
      .limit(5000);
    if(!em && Array.isArray(man)) manual = man;
  }catch(_){}
  if(!manual) return base;
  const posMap = new Map((manual||[]).map(x=>[String(x?.of_id||'').trim(), Number(x?.posicao||0)||0]).filter(x=>x[0]));
  const hasManual = (o)=> posMap.has(String(o?.id||'').trim());
  const a = base.filter(hasManual).sort((x,y)=> (posMap.get(String(x.id))||0) - (posMap.get(String(y.id))||0));
  const b = base.filter(o=>!hasManual(o));
  return a.concat(b);
}

async function _sequenciamentoSalvarOrdem({ maquina, ordem }){
  const mk = String(maquina||'').trim();
  const arr = Array.isArray(ordem)?ordem:[];
  if(!mk || !arr.length) return { ok:false, error:'invalid_payload' };
  const clean = arr
    .map((x)=>({ of_id: String(x?.of_id||'').trim(), posicao: Math.trunc(Number(x?.posicao||0)||0) }))
    .filter(x=>x.of_id && x.posicao >= 0)
    .slice(0, 5000);
  if(!clean.length) return { ok:false, error:'empty' };
  const nowIso = new Date().toISOString();
  try{
    const up = clean.map((x)=>({ of_id: x.of_id, maquina: mk, posicao: x.posicao, updated_at: nowIso }));
    const { error } = await supabase.from('sequenciamento_manual').upsert(up, { onConflict: 'of_id,maquina' });
    if(!error) return { ok:true, saved:'sequenciamento_manual', count: up.length };
  }catch(_){}
  for(const x of clean){
    const pr = Math.max(0, 100000 - x.posicao);
    await supabase.from('ofs').update({ prioridade_producao: pr }).eq('id', x.of_id).limit(1);
  }
  return { ok:true, saved:'prioridade_producao', count: clean.length };
}

app.get('/api/sequenciamento', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const maquina = String(req.query.maquina||'').trim();
    const empId = String(req.query.empId||'').trim();
    const lista = await _sequenciamentoListar({ maquina, empId: empId || null });
    return ok(res, lista);
  }catch(e){ return err(res, e); }
});

app.post('/api/sequenciamento/reordenar', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const maquina = String(req.body?.maquina||'').trim();
    const ordem = Array.isArray(req.body?.ordem) ? req.body.ordem : [];
    const r = await _sequenciamentoSalvarOrdem({ maquina, ordem });
    return res.json({ ok:true, data:r });
  }catch(e){ return err(res, e); }
});

app.post('/api/sequenciamento/auto', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const maquina = String(req.body?.maquina||'').trim();
    const empId = String(req.body?.empId||'').trim();
    const lista = await _sequenciamentoListar({ maquina, empId: empId || null });
    const keySetup = (o)=> String(o?.tipo_caixa_id || o?.tipo_caixa || o?.onda || '').trim();
    const entrega = (o)=> String(o?.data_entrega ?? o?.ent ?? '9999-99-99').slice(0,10) || '9999-99-99';
    const urg = (o)=> !!(o?.urg || o?.urgente);
    const sorted = (lista||[]).slice().sort((a,b)=>{
      const ua = urg(a); const ub = urg(b);
      if(ua !== ub) return ua ? -1 : 1;
      const ea = entrega(a); const eb = entrega(b);
      if(ea !== eb) return ea.localeCompare(eb);
      const sa = keySetup(a); const sb = keySetup(b);
      if(sa !== sb) return sa.localeCompare(sb);
      return String(a?.created_at||'').localeCompare(String(b?.created_at||''));
    });
    const ordem = sorted.map((o,i)=>({ of_id: o.id, posicao: i+1 }));
    const saved = await _sequenciamentoSalvarOrdem({ maquina, ordem });
    return res.json({ ok:true, data:{ maquina, total: ordem.length, saved } });
  }catch(e){ return err(res, e); }
});

app.get('/api/clientes/mapa', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const empId = String(req.query.empId||'').trim();
    const hoje = _isoDateFromTzNow(process.env.REPORT_TZ || 'America/Sao_Paulo');
    const de30 = _addDaysIso(hoje, -30) || _addDaysIso(hoje, -31);
    const de90 = _addDaysIso(hoje, -93) || _addDaysIso(hoje, -90);
    const de365 = _addDaysIso(hoje, -365) || _addDaysIso(hoje, -366);

    let qCli = supabase.from('clientes').select('id,nome,cidade,estado,uf,tel,telefone,vendedor_id,emp_id').limit(5000);
    if(empId) qCli = qCli.eq('emp_id', empId);
    const { data: clientesRaw, error: eCli } = await qCli;
    if(eCli) throw eCli;
    const clientes = Array.isArray(clientesRaw)?clientesRaw:[];

    const ofCols = 'id,cli_id,cliId,cliente_id,valor_total,valor_venda,val,created_at,data_conclusao,emp_id,deleted_at,status';
    let qOf1 = supabase
      .from('ofs')
      .select(ofCols)
      .gte('created_at', de365)
      .is('deleted_at', null)
      .limit(5000);
    if(empId) qOf1 = qOf1.eq('emp_id', empId);
    const { data: ofsRaw1 } = await qOf1;
    const ofs1 = Array.isArray(ofsRaw1)?ofsRaw1:[];

    let qOf2 = supabase
      .from('ofs')
      .select(ofCols)
      .gte('data_conclusao', de365)
      .is('deleted_at', null)
      .limit(5000);
    if(empId) qOf2 = qOf2.eq('emp_id', empId);
    const { data: ofsRaw2 } = await qOf2;
    const ofs2 = Array.isArray(ofsRaw2)?ofsRaw2:[];

    const seenOf = new Set();
    const ofs = [];
    [...ofs1, ...ofs2].forEach((o)=>{
      const id = String(o?.id||'').trim();
      if(!id || seenOf.has(id)) return;
      seenOf.add(id);
      ofs.push(o);
    });

    const valOf = (o)=> Number(o?.valor_total ?? o?.valor_venda ?? o?.val ?? 0) || 0;
    const cliKey = (o)=> String(o?.cli_id || o?.cliId || o?.cliente_id || '').trim();
    const agg = new Map();
    ofs.forEach((o)=>{
      const cid = cliKey(o);
      if(!cid) return;
      const st = String(o?.status||'').toLowerCase();
      if(st.includes('cancel')) return;
      const dt = String(o?.data_conclusao || o?.created_at || '').slice(0,10);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(dt)) return;
      const cur = agg.get(cid) || { total_ofs_mes:0, valor_mes:0, total_ofs_3m:0, valor_3m:0, total_ofs_ano:0, valor_ano:0, ultima_of:'' };
      const v = valOf(o);
      cur.total_ofs_ano += 1;
      cur.valor_ano += v;
      if(de30 && dt >= de30){ cur.total_ofs_mes += 1; cur.valor_mes += v; }
      if(de90 && dt >= de90){ cur.total_ofs_3m += 1; cur.valor_3m += v; }
      if(dt && (!cur.ultima_of || dt > cur.ultima_of)) cur.ultima_of = dt;
      agg.set(cid, cur);
    });
    const out = clientes.map((c)=>{
      const id = String(c?.id||'').trim();
      const a = agg.get(id) || { total_ofs_mes:0, valor_mes:0, total_ofs_3m:0, valor_3m:0, total_ofs_ano:0, valor_ano:0, ultima_of:'' };
      return {
        id,
        nome: String(c?.nome||'').trim(),
        cidade: String(c?.cidade||'').trim() || null,
        estado: String(c?.estado||'').trim() || null,
        uf: String(c?.uf||'').trim() || null,
        tel: String(c?.tel || c?.telefone || '').trim() || null,
        ultima_of: a.ultima_of || null,
        total_ofs_mes: a.total_ofs_mes,
        valor_mes: Number((Number(a.valor_mes||0)).toFixed(2)),
        total_ofs_3m: a.total_ofs_3m,
        valor_3m: Number((Number(a.valor_3m||0)).toFixed(2)),
        total_ofs_ano: a.total_ofs_ano,
        valor_ano: Number((Number(a.valor_ano||0)).toFixed(2)),
        lat: null,
        lng: null,
        vendedor_id: c?.vendedor_id || null,
        emp_id: c?.emp_id || null,
      };
    });

    const cityAgg = new Map();
    out.forEach((c)=>{
      const cidade = String(c?.cidade||'').trim();
      const est = String(c?.estado || c?.uf || '').trim();
      if(!cidade) return;
      const key = _assistNorm(cidade) + '|' + _assistNorm(est);
      const cur = cityAgg.get(key) || { cidade, estado: est || null, total_clientes: 0, valor_mes: 0, valor_ano: 0, total_ofs_mes: 0 };
      cur.total_clientes += 1;
      cur.total_ofs_mes += Math.trunc(Number(c?.total_ofs_mes||0)||0);
      cur.valor_mes += Number(c?.valor_mes||0)||0;
      cur.valor_ano += Number(c?.valor_ano||0)||0;
      cityAgg.set(key, cur);
    });
    const cidades = Array.from(cityAgg.values()).map((x)=>({
      cidade: x.cidade,
      estado: x.estado,
      total_clientes: x.total_clientes,
      total_ofs_mes: x.total_ofs_mes,
      valor_mes: Number((Number(x.valor_mes||0)).toFixed(2)),
      valor_ano: Number((Number(x.valor_ano||0)).toFixed(2)),
    })).sort((a,b)=>(Number(b.valor_mes||0)||0)-(Number(a.valor_mes||0)||0)).slice(0, 2000);

    return res.json({ ok:true, data: out, clientes: out, cidades });
  }catch(e){ return err(res, e); }
});

app.get('/api/clientes/cidade/:cidade', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const cidadeParam = String(req.params.cidade || '').trim();
    const empId = String(req.query.empId || '').trim();
    const estado = String(req.query.estado || '').trim();
    const periodo = Math.max(7, Math.min(365, Number(req.query.periodo) || 30));

    if(!cidadeParam) return res.status(400).json({ ok:false, error:'cidade_obrigatoria' });

    let qCli = supabase.from('clientes').select('*').ilike('cidade', '%' + cidadeParam + '%');
    if(empId) qCli = qCli.eq('emp_id', empId);
    if(estado) qCli = qCli.or(`estado.ilike.%${estado}%,uf.ilike.%${estado}%`);
    const { data: clientesRaw, error: eCli } = await qCli.limit(500);
    if(eCli) throw eCli;
    const clientes = Array.isArray(clientesRaw) ? clientesRaw : [];
    if(!clientes.length){
      return res.json({
        ok: true,
        cidade: cidadeParam,
        estado: estado || null,
        resumo: { total_clientes: 0, total_ofs_periodo: 0, valor_total_periodo: 0, ticket_medio: 0, melhor_mes: null, valor_melhor_mes: 0 },
        clientes: [],
        vendedores: [],
        historico_mensal: []
      });
    }

    const vendIds = [...new Set(clientes.map(c => String(c?.vendedor_id || c?.vendId || '').trim()).filter(Boolean))];
    const vendMap = new Map();
    if(vendIds.length){
      const { data: vends, error: eVend } = await supabase.from('vendedores').select('id,nome,comissao_pct').in('id', vendIds).limit(1000);
      if(eVend){
        const msg = String(eVend?.message || eVend || '').toLowerCase();
        if(!(msg.includes('does not exist') || msg.includes('not exist'))) throw eVend;
      }
      (Array.isArray(vends)?vends:[]).forEach(v => { try{ vendMap.set(String(v.id), v); }catch(_){} });
    }

    const cliIds = clientes.map(c => String(c?.id || '').trim()).filter(Boolean);
    const dataCorte = new Date();
    dataCorte.setDate(dataCorte.getDate() - periodo);
    const dataCorteIso = dataCorte.toISOString().slice(0, 10);

    const camposCli = ['cli_id', 'cliente_id', 'cliId'];
    let todasOfs = [];
    for(const campo of camposCli){
      try{
        const { data: ofs, error: eOf } = await supabase
          .from('ofs')
          .select('id,of,numero,status,cli_id,cliId,cliente_id,valor_total,valor_venda,val,created_at,data_conclusao,deleted_at')
          .in(campo, cliIds)
          .gte('created_at', dataCorteIso + 'T00:00:00')
          .is('deleted_at', null)
          .limit(5000);
        if(!eOf && Array.isArray(ofs)){
          todasOfs = [...todasOfs, ...ofs];
          break;
        }
        const msg = String(eOf?.message || ''); 
        if(msg.includes('column') || msg.includes('Could not find')) continue;
        throw eOf;
      }catch(e){
        const msg = String(e?.message || '');
        if(msg.includes('column') || msg.includes('Could not find')) continue;
        throw e;
      }
    }
    const ofsMap = new Map();
    (Array.isArray(todasOfs)?todasOfs:[]).forEach(o => { if(o?.id) ofsMap.set(String(o.id), o); });
    const ofsPeriodo = Array.from(ofsMap.values()).filter(o => !_assistIsCancelada(o));

    const historicoMap = {};
    const agora = new Date();
    for(let i = 11; i >= 0; i--){
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const mes = d.toISOString().slice(0, 7);
      historicoMap[mes] = { mes, valor: 0, total_ofs: 0 };
    }
    const dataAnoCorte = new Date();
    dataAnoCorte.setMonth(dataAnoCorte.getMonth() - 11);
    const dataAnoIso = dataAnoCorte.toISOString().slice(0, 7) + '-01';
    let ofsAno = [];
    for(const campo of camposCli){
      try{
        const { data: oA, error: eA } = await supabase
          .from('ofs')
          .select('cli_id,cliId,cliente_id,valor_total,valor_venda,val,created_at,deleted_at,status')
          .in(campo, cliIds)
          .gte('created_at', dataAnoIso + 'T00:00:00')
          .is('deleted_at', null)
          .limit(5000);
        if(!eA && Array.isArray(oA)){
          ofsAno = oA;
          break;
        }
      }catch(_){}
    }
    (Array.isArray(ofsAno)?ofsAno:[]).filter(o => !_assistIsCancelada(o)).forEach(o => {
      const mes = String(o?.created_at || '').slice(0, 7);
      if(historicoMap[mes]){
        historicoMap[mes].valor += Number(o?.valor_total ?? o?.valor_venda ?? o?.val ?? 0) || 0;
        historicoMap[mes].total_ofs += 1;
      }
    });
    const historico_mensal = Object.values(historicoMap).map(x=>({
      mes: x.mes,
      valor: Math.round((Number(x.valor||0)||0) * 100) / 100,
      total_ofs: Math.trunc(Number(x.total_ofs||0)||0),
    }));
    let melhorMes = null;
    let valorMelhorMes = 0;
    historico_mensal.forEach(h=>{
      const v = Number(h?.valor||0)||0;
      if(v > valorMelhorMes){
        valorMelhorMes = v;
        melhorMes = String(h?.mes||'');
      }
    });

    const ofsporCli = {};
    ofsPeriodo.forEach(o=>{
      const cid = String(o?.cli_id || o?.cliId || o?.cliente_id || '').trim();
      if(!cid) return;
      if(!ofsporCli[cid]) ofsporCli[cid] = [];
      ofsporCli[cid].push(o);
    });

    const resultClientes = clientes.map((c)=>{
      const cid = String(c?.id || '').trim();
      const ofsC = ofsporCli[cid] || [];
      const valor = ofsC.reduce((s,o)=> s + (Number(o?.valor_total ?? o?.valor_venda ?? o?.val ?? 0) || 0), 0);
      const vendId = String(c?.vendedor_id || c?.vendId || '').trim();
      const vend = vendMap.get(vendId);
      let ultimaOf = null;
      ofsC.forEach(o=>{
        const dt = String(o?.created_at || o?.data_conclusao || '').trim();
        if(!dt) return;
        if(!ultimaOf || dt.localeCompare(String(ultimaOf?.created_at || ultimaOf?.data_conclusao || '')) > 0) ultimaOf = o;
      });
      return {
        id: cid,
        nome: String(c?.nome || '').trim(),
        cnpj: String(c?.cnpj || '').trim() || null,
        tel: String(c?.tel || c?.telefone || '').trim() || null,
        ramo: String(c?.ramo || '').trim() || null,
        vendedor_id: vendId || null,
        vendedor_nome: (vend && vend.nome) ? String(vend.nome) : null,
        total_ofs_periodo: ofsC.length,
        valor_periodo: Math.round((Number(valor||0)||0) * 100) / 100,
        ticket_medio: ofsC.length ? Math.round(((Number(valor||0)||0) / ofsC.length) * 100) / 100 : 0,
        ultima_of_data: ultimaOf ? String(ultimaOf?.created_at || ultimaOf?.data_conclusao || '').slice(0, 10) : null,
        ultima_of_numero: ultimaOf ? String(ultimaOf?.of || ultimaOf?.numero || '') : null,
        ultima_of_status: ultimaOf ? String(ultimaOf?.status || '') : null,
        ativo: (c && ('ativo' in c)) ? !!c.ativo : true,
      };
    }).sort((a,b)=>(Number(b.valor_periodo||0)||0)-(Number(a.valor_periodo||0)||0));

    const totalOfsPeriodo = resultClientes.reduce((s,c)=> s + Math.trunc(Number(c?.total_ofs_periodo||0)||0), 0);
    const valorTotalPeriodo = resultClientes.reduce((s,c)=> s + (Number(c?.valor_periodo||0)||0), 0);
    const ticketMedio = totalOfsPeriodo > 0 ? (valorTotalPeriodo / totalOfsPeriodo) : 0;

    const vendAgg = new Map();
    resultClientes.forEach(c=>{
      const vid = String(c?.vendedor_id || '').trim();
      if(!vid) return;
      const cur = vendAgg.get(vid) || { id: vid, nome: String(c?.vendedor_nome||'').trim() || null, total_clientes_cidade: 0, total_ofs_periodo: 0, valor_periodo: 0 };
      cur.total_clientes_cidade += 1;
      cur.total_ofs_periodo += Math.trunc(Number(c?.total_ofs_periodo||0)||0);
      cur.valor_periodo += Number(c?.valor_periodo||0)||0;
      vendAgg.set(vid, cur);
    });
    const vendedores = Array.from(vendAgg.values()).map(v=>({
      id: v.id,
      nome: v.nome,
      total_clientes_cidade: Math.trunc(Number(v.total_clientes_cidade||0)||0),
      total_ofs_periodo: Math.trunc(Number(v.total_ofs_periodo||0)||0),
      valor_periodo: Math.round((Number(v.valor_periodo||0)||0) * 100) / 100,
      percentual_cidade: valorTotalPeriodo > 0 ? Math.round(((Number(v.valor_periodo||0)||0) / valorTotalPeriodo) * 1000) / 10 : 0,
    })).sort((a,b)=>(Number(b.valor_periodo||0)||0)-(Number(a.valor_periodo||0)||0));

    const estadoOut = estado || String(clientes[0]?.estado || clientes[0]?.uf || '').trim() || null;
    return res.json({
      ok: true,
      cidade: cidadeParam,
      estado: estadoOut,
      resumo: {
        total_clientes: resultClientes.length,
        total_ofs_periodo: totalOfsPeriodo,
        valor_total_periodo: Math.round((Number(valorTotalPeriodo||0)||0) * 100) / 100,
        ticket_medio: Math.round((Number(ticketMedio||0)||0) * 100) / 100,
        melhor_mes: melhorMes ? (String(melhorMes).split('-').reverse().join('/')) : null,
        valor_melhor_mes: Math.round((Number(valorMelhorMes||0)||0) * 100) / 100,
      },
      clientes: resultClientes,
      vendedores,
      historico_mensal,
    });
  }catch(e){ return err(res, e); }
});

app.get('/api/pedidos_recorrentes', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const empId = String(req.query.empId||'').trim();
    let q = supabase.from('pedidos_recorrentes').select('*').order('created_at', { ascending: false }).limit(2000);
    if(empId) q = q.eq('emp_id', empId);
    const { data, error } = await q;
    if(error){
      const msg = String(error.message||error).toLowerCase();
      if(msg.includes('does not exist') || msg.includes('not exist')) return ok(res, []);
      throw error;
    }
    return ok(res, data || []);
  }catch(e){ return err(res, e); }
});

app.post('/api/pedidos_recorrentes', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const b = req.body || {};
    const row = {
      cliente_id: b.cliente_id || null,
      descricao: String(b.descricao||''),
      quantidade: Math.trunc(Number(b.quantidade||0)||0),
      onda: b.onda != null ? String(b.onda||'') : null,
      comprimento_mm: b.comprimento_mm != null ? Math.trunc(Number(b.comprimento_mm||0)||0) : null,
      largura_mm: b.largura_mm != null ? Math.trunc(Number(b.largura_mm||0)||0) : null,
      altura_mm: b.altura_mm != null ? Math.trunc(Number(b.altura_mm||0)||0) : null,
      dia_do_mes: Math.max(1, Math.min(31, Math.trunc(Number(b.dia_do_mes||1)||1))),
      ativo: b.ativo == null ? true : !!b.ativo,
      antecedencia_dias: b.antecedencia_dias == null ? 3 : Math.max(0, Math.min(31, Math.trunc(Number(b.antecedencia_dias||3)||3))),
      emp_id: String(b.emp_id || b.empId || 'E1').trim(),
      criado_por: String(b.criado_por || req?.usuario?.id || '').trim() || null,
      created_at: new Date().toISOString(),
      ultima_geracao: b.ultima_geracao || null,
    };
    const { data, error } = await supabase.from('pedidos_recorrentes').insert([row]).select().single();
    if(error) throw error;
    return ok(res, data);
  }catch(e){ return err(res, e); }
});

app.put('/api/pedidos_recorrentes/:id', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const id = String(req.params.id||'').trim();
    if(!id) return res.status(400).json({ ok:false, error:'id_obrigatorio' });
    const b = req.body || {};
    const payload = { ...b };
    delete payload.id;
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('pedidos_recorrentes').update(payload).eq('id', id).select().single();
    if(error) throw error;
    return ok(res, data);
  }catch(e){ return err(res, e); }
});

app.delete('/api/pedidos_recorrentes/:id', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const id = String(req.params.id||'').trim();
    if(!id) return res.status(400).json({ ok:false, error:'id_obrigatorio' });
    const { data, error } = await supabase.from('pedidos_recorrentes').update({ ativo:false, updated_at:new Date().toISOString() }).eq('id', id).select().single();
    if(error){
      const msg = String(error.message||error).toLowerCase();
      if(msg.includes('does not exist') || msg.includes('not exist')) return ok(res, true);
      throw error;
    }
    return ok(res, data || true);
  }catch(e){ return err(res, e); }
});

async function _gerarRecorrenteSePrecisa(rec, forcar){
  const hojeIso = _isoDateFromTzNow(process.env.REPORT_TZ || 'America/Sao_Paulo');
  const diaHoje = Number(String(hojeIso).slice(8,10)) || 0;
  const diaDoMes = Math.max(1, Math.min(31, Math.trunc(Number(rec?.dia_do_mes||1)||1)));
  const ant = Math.max(0, Math.min(31, Math.trunc(Number(rec?.antecedencia_dias||3)||3)));
  const diaGera = diaDoMes - ant;
  if(!forcar && diaHoje !== diaGera) return { ok:false, skipped:'nao_e_dia' };
  const rid = String(rec?.id||'').trim();
  const empId = String(rec?.emp_id || 'E1').trim();
  const mes = _monthKey(hojeIso);
  const tag = `[RECORRENTE:${rid}]`;
  const { data: exist } = await supabase.from('ofs').select('id,of,numero,obs,created_at').ilike('obs', `%${tag}%`).gte('created_at', mes+'-01').is('deleted_at', null).limit(1);
  if(Array.isArray(exist) && exist.length) return { ok:false, skipped:'ja_existe', existente: exist[0] };
  const cliId = String(rec?.cliente_id||'').trim();
  if(!cliId) return { ok:false, skipped:'sem_cliente' };
  const desc = String(rec?.descricao||'').trim();
  const qtd = Math.trunc(Number(rec?.quantidade||0)||0);
  if(!(qtd > 0) || !desc) return { ok:false, skipped:'dados_incompletos' };
  const entrega = _addDaysIso(hojeIso, Math.max(0, ant)) || hojeIso;
  const payload = {
    cli_id: cliId,
    cliId,
    cliente_id: cliId,
    descricao: desc,
    prodDesc: desc,
    qtd,
    quantidade: qtd,
    ent: entrega,
    data_entrega: entrega,
    onda: rec?.onda || null,
    caixa_comprimento: rec?.comprimento_mm || null,
    caixa_largura: rec?.largura_mm || null,
    caixa_altura: rec?.altura_mm || null,
    obs: `${tag} ${String(rec?.obs||'').trim()}`.trim(),
    emp_id: empId,
    criado_por: rec?.criado_por || null,
    status: 'Em aberto',
  };
  const filtered = ofPayloadFiltrado(payload);
  if ((filtered.of == null || String(filtered.of || '').trim() === '') && (filtered.numero == null || String(filtered.numero || '').trim() === '')) {
    try {
      const { data: last } = await supabase.from('ofs').select('seq').order('seq', { ascending: false }).limit(1).maybeSingle();
      const lastSeq = Math.trunc(Number(last?.seq || 0) || 0);
      const nextSeq = lastSeq > 0 ? (lastSeq + 1) : 1;
      filtered.seq = nextSeq;
      const numStr = String(nextSeq);
      filtered.of = numStr;
      filtered.numero = numStr;
    } catch (_) {}
  }
  const createdRes = await ofsInsertWithRetry(ofIn(filtered));
  if(createdRes.error) throw createdRes.error;
  const created = createdRes.data;
  await supabase.from('pedidos_recorrentes').update({ ultima_geracao: hojeIso, updated_at: new Date().toISOString() }).eq('id', rid);
  return { ok:true, created, tag };
}

app.post('/api/pedidos_recorrentes/gerar_agora', authMiddleware, async (req, res) => {
  try{
    if(!supabase) return res.status(500).json({ ok:false, error:'supabase_not_configured' });
    const id = String(req.body?.id || '').trim();
    if(!id) return res.status(400).json({ ok:false, error:'id_obrigatorio' });
    const { data: rec, error } = await supabase.from('pedidos_recorrentes').select('*').eq('id', id).limit(1).maybeSingle();
    if(error) throw error;
    if(!rec) return res.status(404).json({ ok:false, error:'not_found' });
    const r = await _gerarRecorrenteSePrecisa(rec, true);
    return res.json({ ok:true, data:r });
  }catch(e){ return err(res, e); }
});

function _mailTransportPrefer(){
  if(transporter) return transporter;
  try{
    const host = String(process.env.EMAIL_HOST || process.env.SMTP_HOST || '').trim();
    const port = Math.trunc(Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587) || 587);
    const user = String(process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
    const pass = String(process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
    if(!host || !user || !pass) return null;
    return nodemailer.createTransport({ host, port, secure: false, auth: { user, pass }, tls: { rejectUnauthorized: false } });
  }catch(_){ return null; }
}

async function _relDiarioFetchData(empId){
  const tz = String(process.env.REPORT_TZ || 'America/Sao_Paulo');
  const hoje = _isoDateFromTzNow(tz);
  const mesAtual = _monthKey(hoje);
  const mesAnterior = _monthKey(_addDaysIso(_monthStartIso(hoje), -1));
  const mesAtualIni = mesAtual + '-01';
  const mesAntIni = mesAnterior + '-01';
  const mesAntFim = _addDaysIso(mesAtualIni, -1);
  let qOf = supabase.from('ofs').select('id,of,numero,status,cliNome,cliente_nome,descricao,data_entrega,ent,valor_total,valor_venda,val,data_conclusao,created_at,emp_id,deleted_at').is('deleted_at', null).limit(5000);
  if(empId) qOf = qOf.eq('emp_id', empId);
  const { data: ofsRaw } = await qOf;
  const ofs = Array.isArray(ofsRaw) ? ofsRaw : [];
  const entrega = (o)=> String(o?.data_entrega ?? o?.ent ?? '').slice(0,10);
  const valor = (o)=> Number(o?.valor_total ?? o?.valor_venda ?? o?.val ?? 0) || 0;
  const abertas = ofs.filter(o=>o && !_assistIsCancelada(o) && !_assistIsConcluida(o));
  const atrasadas = abertas.filter(o=>{ const e = entrega(o); return e && e < hoje; }).sort((a,b)=> entrega(a).localeCompare(entrega(b)));
  const entregasHoje = abertas.filter(o=>entrega(o) === hoje).sort((a,b)=> String(a?.cliente_nome||a?.cliNome||'').localeCompare(String(b?.cliente_nome||b?.cliNome||'')));
  const concluidasMesAtual = ofs.filter(o=>{ const dc = String(o?.data_conclusao||'').slice(0,10); return dc && dc >= mesAtualIni && _assistIsConcluida(o); });
  const concluidasMesAnt = ofs.filter(o=>{ const dc = String(o?.data_conclusao||'').slice(0,10); return dc && dc >= mesAntIni && dc <= mesAntFim && _assistIsConcluida(o); });
  const fatAtual = concluidasMesAtual.reduce((s,o)=>s+valor(o),0);
  const fatAnt = concluidasMesAnt.reduce((s,o)=>s+valor(o),0);
  const pct = fatAnt > 0 ? ((fatAtual - fatAnt) / fatAnt) * 100 : null;

  let chapasCrit = [];
  try{
    let qc = supabase.from('chapas_estoque').select('id,nome,nomenclatura,tamanho,fornecedor,quantidade_atual,quantidade,qtd,estoque_minimo').limit(1000);
    if(empId) qc = qc.eq('emp_id', empId);
    const { data: chRaw } = await qc;
    const ch = Array.isArray(chRaw)?chRaw:[];
    chapasCrit = ch.filter((c)=>{
      const qtd = Math.trunc(Number(c?.quantidade_atual ?? c?.quantidade ?? c?.qtd ?? 0) || 0);
      const min = Math.trunc(Number(c?.estoque_minimo ?? 200) || 200);
      return qtd < min;
    }).slice(0, 50);
  }catch(_){}

  let perdasSemana = { total_caixas:0, valor_total:0 };
  try{
    const now = new Date();
    const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
    const dow = d0.getDay();
    const diff = (dow === 0) ? 6 : (dow - 1);
    d0.setDate(d0.getDate() - diff);
    const ini = d0.toISOString().slice(0,10);
    let qp = supabase.from('caixas_perdidas').select('qtd_perdida,valor_perdido,data,emp_id').gte('data', ini).limit(5000);
    if(empId) qp = qp.eq('emp_id', empId);
    const { data: pr } = await qp;
    const per = Array.isArray(pr)?pr:[];
    perdasSemana = {
      total_caixas: per.reduce((s,p)=>s+(Number(p?.qtd_perdida||0)||0),0),
      valor_total: per.reduce((s,p)=>s+(Number(p?.valor_perdido||0)||0),0),
    };
  }catch(_){}

  let riscoAtraso = [];
  try{
    const prev = await _analyticsPrevisaoAtrasosCompute({ empId: empId || null });
    const arr = Array.isArray(prev?.data)?prev.data:[];
    riscoAtraso = arr.filter(x=>x && (x.risco==='alto' || x.risco==='medio')).slice(0, 30);
    try{ await _notificarRiscoAtraso({ empId: empId || null, items: arr }); }catch(_){}
  }catch(_){}

  return { empId: empId || null, hoje, atrasadas, entregasHoje, fatAtual, fatAnt, pct, chapasCrit, riscoAtraso, perdasSemana };
}

function _relDiarioRenderHtml(d){
  const fmtMoney = (v)=>_assistFmtMoney(Number(v||0)||0);
  const fmtPct = (p)=> (p == null ? '—' : (p >= 0 ? `+${p.toFixed(1)}%` : `${p.toFixed(1)}%`));
  const rowOf = (o)=>`<tr>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08)">${String(o?.of||o?.numero||'—')}</td>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08)">${String(o?.cliNome||o?.cliente_nome||'—')}</td>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08)">${String(o?.descricao||'—')}</td>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:center">${_assistFmtDateBr(String(o?.data_entrega??o?.ent??'').slice(0,10))}</td>
  </tr>`;
  const rowsAtras = (d.atrasadas||[]).slice(0,5).map(rowOf).join('');
  const rowsHoje = (d.entregasHoje||[]).slice(0,8).map(rowOf).join('');
  const riscoRows = (d.riscoAtraso||[]).slice(0,12).map((x)=>`<tr>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08)">${String(x.numero||x.of_id||'—')}</td>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08)">${String(x.cliente||'—')}</td>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:center">${_assistFmtDateBr(String(x.entrega||''))}</td>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:center">${String(x.risco||'ok')}</td>
  </tr>`).join('');
  const chapasRows = (d.chapasCrit||[]).slice(0,10).map((c)=>`<tr>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08)">${String(c?.nome||c?.nomenclatura||'—')}</td>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08)">${String(c?.tamanho||'—')}</td>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:right">${Math.trunc(Number(c?.quantidade_atual ?? c?.quantidade ?? c?.qtd ?? 0)||0)}</td>
    <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:right">${Math.trunc(Number(c?.estoque_minimo ?? 200)||200)}</td>
  </tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Relatório Diário</title></head>
  <body style="margin:0;background:#0f172a;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
  <div style="max-width:920px;margin:0 auto;padding:22px 14px">
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:16px 16px 10px">
      <div style="font-weight:900;font-size:18px">Relatório Diário — ${_assistFmtDateBr(d.hoje)}</div>
      <div style="color:rgba(229,231,235,0.70);margin-top:4px">ERP Italy Embalagens</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:14px">
        <div style="font-weight:900;margin-bottom:8px">OFs atrasadas</div>
        <div style="font-size:28px;font-weight:900;color:#ef4444">${(d.atrasadas||[]).length}</div>
        <div style="margin-top:10px;font-size:13px;color:rgba(229,231,235,0.85)">5 mais antigas</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
          <thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">OF</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Cliente</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Produto</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Entrega</th></tr></thead>
          <tbody>${rowsAtras || '<tr><td colspan="4" style="padding:8px;color:rgba(229,231,235,0.70)">—</td></tr>'}</tbody>
        </table>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:14px">
        <div style="font-weight:900;margin-bottom:8px">Entregas de hoje</div>
        <div style="font-size:28px;font-weight:900;color:#22c55e">${(d.entregasHoje||[]).length}</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
          <thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">OF</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Cliente</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Produto</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Entrega</th></tr></thead>
          <tbody>${rowsHoje || '<tr><td colspan="4" style="padding:8px;color:rgba(229,231,235,0.70)">—</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:14px">
        <div style="font-weight:900;margin-bottom:8px">Faturamento</div>
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          <div><div style="color:rgba(229,231,235,0.70);font-size:12px">Mês atual</div><div style="font-size:20px;font-weight:900">${fmtMoney(d.fatAtual)}</div></div>
          <div><div style="color:rgba(229,231,235,0.70);font-size:12px">Mês anterior</div><div style="font-size:20px;font-weight:900">${fmtMoney(d.fatAnt)}</div></div>
          <div><div style="color:rgba(229,231,235,0.70);font-size:12px">Variação</div><div style="font-size:20px;font-weight:900">${fmtPct(d.pct)}</div></div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:14px">
        <div style="font-weight:900;margin-bottom:8px">Perdas da semana</div>
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          <div><div style="color:rgba(229,231,235,0.70);font-size:12px">Caixas</div><div style="font-size:20px;font-weight:900">${Math.trunc(Number(d?.perdasSemana?.total_caixas||0)||0)}</div></div>
          <div><div style="color:rgba(229,231,235,0.70);font-size:12px">Valor</div><div style="font-size:20px;font-weight:900">${fmtMoney(Number(d?.perdasSemana?.valor_total||0)||0)}</div></div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:14px">
        <div style="font-weight:900;margin-bottom:8px">Estoque crítico (Chapas)</div>
        <div style="color:rgba(229,231,235,0.70);font-size:12px;margin-bottom:8px">${(d.chapasCrit||[]).length} item(ns)</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Chapa</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Tam.</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Qtd</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Min</th></tr></thead>
          <tbody>${chapasRows || '<tr><td colspan="4" style="padding:8px;color:rgba(229,231,235,0.70)">—</td></tr>'}</tbody>
        </table>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:14px">
        <div style="font-weight:900;margin-bottom:8px">OFs em risco de atraso</div>
        <div style="color:rgba(229,231,235,0.70);font-size:12px;margin-bottom:8px">${(d.riscoAtraso||[]).length} item(ns)</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">OF</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Cliente</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Entrega</th><th style="text-align:center;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.12)">Risco</th></tr></thead>
          <tbody>${riscoRows || '<tr><td colspan="4" style="padding:8px;color:rgba(229,231,235,0.70)">—</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>
  </body></html>`;
}

let _relDiarioCron = null;
async function _relDiarioEnviar(){
  const toFixos = ['eleomarfridres@gmail.com','yagostebanfridres@gmail.com'];
  let extra = [];
  let empId = null;
  try{
    const cfg = await _loadConfigJson('relatorio_email', null);
    if(cfg && Array.isArray(cfg.to)) extra = cfg.to;
    empId = String(cfg?.emp_id || cfg?.empId || '').trim() || null;
  }catch(_){}
  const to = _uniqEmails([...toFixos, ...(extra||[])]);
  if(!to.length) return;
  const data = await _relDiarioFetchData(empId);
  const html = _relDiarioRenderHtml(data);
  const subject = `Relatório Diário ERP — ${_assistFmtDateBr(data.hoje)}`;
  const t = _mailTransportPrefer();
  if(!t) throw new Error('smtp_not_configured');
  const from = String(process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  if(!from) throw new Error('smtp_from_missing');
  await t.sendMail({ from, to: to.join(','), subject, html });
}

if(cron && cron.validate('0 7 * * *')){
  try{
    if(_relDiarioCron) { try{ _relDiarioCron.stop(); }catch(_){}; _relDiarioCron = null; }
    _relDiarioCron = cron.schedule('0 7 * * *', async ()=>{
      try{ await _relDiarioEnviar(); }catch(e){ try{ console.warn('[REL DIARIO]', String(e?.message||e)); }catch(_){} }
    }, { scheduled:true, timezone: 'America/Sao_Paulo' });
  }catch(e){
    try{ console.warn('[REL DIARIO] cron falhou:', String(e?.message||e)); }catch(_){}
  }
}

if(cron && cron.validate('0 6 * * *')){
  cron.schedule('0 6 * * *', async ()=>{
    try{
      const { data: recsRaw, error } = await supabase.from('pedidos_recorrentes').select('*').eq('ativo', true).limit(2000);
      if(error) throw error;
      const recs = Array.isArray(recsRaw)?recsRaw:[];
      const geradas = [];
      for(const rec of recs){
        const r = await _gerarRecorrenteSePrecisa(rec, false);
        if(r && r.ok && r.created) geradas.push(r.created);
      }
      if(geradas.length){
        const to = _uniqEmails(['eleomarfridres@gmail.com','yagostebanfridres@gmail.com']);
        const t = _mailTransportPrefer();
        if(t){
          const from = String(process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
          const subject = `OFs geradas automaticamente (recorrentes) — ${_assistFmtDateBr(_isoDateFromTzNow(process.env.REPORT_TZ || 'America/Sao_Paulo'))}`;
          const rows = geradas.slice(0, 30).map((o)=>`<li>OF #${String(o?.of||o?.numero||'—')} — ${String(o?.cliNome||o?.cliente_nome||'—')} — ${String(o?.descricao||'—')}</li>`).join('');
          const html = `<!doctype html><html><body style="margin:0;background:#0f172a;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial"><div style="max-width:760px;margin:0 auto;padding:18px"><div style="font-weight:900;font-size:18px;margin-bottom:10px">Pedidos Recorrentes</div><div>Foram geradas ${geradas.length} OF(s):</div><ul style="margin-top:10px">${rows}</ul></div></body></html>`;
          await t.sendMail({ from, to: to.join(','), subject, html });
        }
      }
    }catch(e){
      try{ console.warn('[RECORRENTES CRON]', String(e?.message||e)); }catch(_){}
    }
  }, { scheduled:true, timezone:'America/Sao_Paulo' });
}

setTimeout(() => { _reloadRelEmailSchedule().catch(() => {}); }, 500);

if (cron) {
  cron.schedule('*/30 * * * *', async () => {
    try {
      const agoraStr = new Date().toISOString();
      const trintaMin = new Date(Date.now() - 31*60*1000).toISOString();
      const { data: novasAtras } = await supabase.from('ofs')
        .select('id,of,numero,cliNome,cliente_nome,data_entrega,ent')
        .lt('data_entrega', new Date().toISOString().slice(0,10))
        .is('deleted_at', null)
        .not('status', 'in', '("Concluído","Cancelada","Cancelado")')
        .gte('updated_at', trintaMin)
        .limit(10);

      if (Array.isArray(novasAtras) && novasAtras.length) {
        for (const of2 of novasAtras) {
          const msg = `⚠️ OF #${of2.of||of2.numero} — ${of2.cliNome||of2.cliente_nome||'—'} passou da data de entrega!`;
          await supabase.from('notificacoes').insert([{ mensagem: msg, tipo: 'warning', lida: false, data_hora: agoraStr, criado_por: 'JARVIS' }]);
        }
      }

      const { data: chapasC } = await supabase.from('chapas_estoque').select('id,nomenclatura,nom,nome,quantidade,qtd,quantidade_atual,estoque_minimo').limit(500);
      const criticas = (Array.isArray(chapasC)?chapasC:[]).filter(c => {
        const qtd = Math.trunc(Number(c.quantidade_atual||c.quantidade||c.qtd||0)||0);
        const min = Math.trunc(Number(c.estoque_minimo||200)||200);
        return qtd < min && qtd >= 0;
      });
      if (criticas.length > 0) {
        const msg = `📦 ${criticas.length} chapa${criticas.length!==1?'s':''} abaixo do estoque mínimo! Use "estoque crítico" para ver.`;
        const { data: existente } = await supabase.from('notificacoes').select('id').eq('mensagem', msg).eq('lida', false).limit(1);
        if (!Array.isArray(existente) || !existente.length) {
          await supabase.from('notificacoes').insert([{ mensagem: msg, tipo: 'warning', lida: false, data_hora: new Date().toISOString(), criado_por: 'JARVIS' }]);
        }
      }
    } catch(e) { console.warn('[JARVIS CRON]', e?.message); }
  }, { scheduled: true, timezone: String(process.env.REPORT_TZ || 'America/Sao_Paulo') });
  console.log('✅ JARVIS: alertas proativos configurados (30min)');
}

app.use((e, req, res, next) => {
  if (!e) return next();
  const msg = String(e.message || e);
  if (e instanceof multer.MulterError) return res.status(400).json({ ok: false, error: msg });
  if (msg.includes('Tipo de arquivo não permitido')) return res.status(400).json({ ok: false, error: msg });
  return res.status(500).json({ ok: false, error: msg });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
