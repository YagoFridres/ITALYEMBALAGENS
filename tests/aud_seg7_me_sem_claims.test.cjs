'use strict';
// SEG-7 · /api/auth/me e /api/usuarios/me não podem confiar nas claims do token.
//
// Antes: no ramo `if (error || !usuario)` os dois endpoints devolviam
// `req.usuario.*` — um token válido de um usuário JÁ EXCLUÍDO recebia de volta o
// perfil escrito no próprio token (ex.: admin/permissoes:'tudo') e o front
// liberava a interface inteira.
//
// Depois: usuário inexistente → 401; erro transitório do banco → 503; jamais as
// claims. Este teste extrai os dois handlers REAIS do server.js, registra-os num
// Express de verdade com um supabase falso e mede o HTTP. Nada sobe o servidor
// de produção e nada toca o banco.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');

const ROOT = path.join(__dirname, '..');
const SERVER_SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

// ── 1. Fonte: o fallback pelas claims foi removido ──────────────────────────
test("SEG-7: server.js não tem mais source:'jwt' nem o fallback por claims", () => {
  assert.ok(!/source:\s*'jwt'/.test(SERVER_SRC), "ainda existe source:'jwt' no server.js");
});

// ── extração das chamadas app.get('/api/...', ...) --------------------------
function extrairChamada(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'não achei: ' + marcador);
  const k = src.indexOf('(', i); // o "(" de app.get( vem antes do marcador do caminho
  assert.ok(k >= 0, 'não achei "(" de: ' + marcador);
  let d = 0;
  for (let j = k; j < src.length; j++) {
    if (src[j] === '(') d++;
    else if (src[j] === ')') { d--; if (d === 0) return src.slice(i, j + 1) + ';'; }
  }
  throw new Error('fim não achado: ' + marcador);
}

const SRC_AUTH_ME = extrairChamada(SERVER_SRC, "app.get('/api/auth/me'");
const SRC_USU_ME = extrairChamada(SERVER_SRC, "app.get('/api/usuarios/me'");

// ── montagem do app com os handlers reais -----------------------------------
function fakeSupabase(resultado) {
  return {
    from() {
      return { select() { return this; }, eq() { return this; }, maybeSingle() { return Promise.resolve(resultado); } };
    },
  };
}

function subirApp(resultado) {
  const app = express();
  app.set('etag', false);
  app.use(express.json());
  const ctx = vm.createContext({
    app,
    console: { warn: () => {}, error: () => {}, log: () => {} },
    JSON,
    String,
    Array,
    supabase: fakeSupabase(resultado),
    // authMiddleware falso: o "token" é o header x-test-user (JSON). Serve só
    // para injetar req.usuario — o que importa é a resposta dos handlers.
    authMiddleware: (req, res, next) => {
      const raw = req.headers['x-test-user'];
      if (!raw) return res.status(401).json({ ok: false, error: 'token_missing' });
      try { req.usuario = JSON.parse(raw); } catch (_) { req.usuario = {}; }
      return next();
    },
    initialsFromName: (n) => String(n || '?').slice(0, 2).toUpperCase(),
    avatarColorFromText: () => '#000',
  });
  vm.runInContext(SRC_AUTH_ME + '\n' + SRC_USU_ME, ctx);
  return app;
}

async function chamar(app, url, usuario) {
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  try {
    const headers = {};
    if (usuario) headers['x-test-user'] = JSON.stringify(usuario);
    const r = await fetch(base + url, { headers });
    let body = null;
    try { body = await r.json(); } catch (_) { body = null; }
    return { status: r.status, body };
  } finally {
    srv.close();
  }
}

const TOKEN_ADMIN_FALSO = {
  id: 'fantasma-inexistente',
  nome: 'HACKER',
  email: 'hacker@x.com',
  perfil: 'admin',
  permissoes: ['tudo'],
};

// ── 2. Usuário inexistente → 401 e NADA das claims ──────────────────────────
test('SEG-7: /api/auth/me com id inexistente → 401, sem ecoar as claims', async () => {
  const app = subirApp({ data: null, error: null });
  const r = await chamar(app, '/api/auth/me', TOKEN_ADMIN_FALSO);
  assert.equal(r.status, 401, 'deveria ser 401, veio ' + r.status);
  const txt = JSON.stringify(r.body || {});
  assert.ok(!/HACKER/.test(txt), 'vazou o nome do token');
  assert.ok(!/admin/.test(txt), 'vazou o perfil do token');
  assert.ok(!/tudo/.test(txt), 'vazou as permissões do token');
});

test('SEG-7: /api/usuarios/me com id inexistente → 401, sem ecoar as claims', async () => {
  const app = subirApp({ data: null, error: null });
  const r = await chamar(app, '/api/usuarios/me', TOKEN_ADMIN_FALSO);
  assert.equal(r.status, 401, 'deveria ser 401, veio ' + r.status);
  const txt = JSON.stringify(r.body || {});
  assert.ok(!/HACKER/.test(txt));
  assert.ok(!/admin/.test(txt));
  assert.ok(!/tudo/.test(txt));
  assert.notEqual(r.body?.source, 'jwt', "não pode mais existir source:'jwt'");
});

// ── 3. Erro transitório do banco → 503 ──────────────────────────────────────
test('SEG-7: erro de banco em /api/auth/me → 503', async () => {
  const app = subirApp({ data: null, error: { message: 'db down' } });
  const r = await chamar(app, '/api/auth/me', TOKEN_ADMIN_FALSO);
  assert.equal(r.status, 503, 'deveria ser 503, veio ' + r.status);
});

test('SEG-7: erro de banco em /api/usuarios/me → 503', async () => {
  const app = subirApp({ data: null, error: { message: 'db down' } });
  const r = await chamar(app, '/api/usuarios/me', TOKEN_ADMIN_FALSO);
  assert.equal(r.status, 503, 'deveria ser 503, veio ' + r.status);
});

// ── 4. Token sem id → 401 ───────────────────────────────────────────────────
test('SEG-7: token sem id em /api/auth/me → 401', async () => {
  const app = subirApp({ data: null, error: null });
  const r = await chamar(app, '/api/auth/me', { nome: 'x', perfil: 'admin' });
  assert.equal(r.status, 401);
});

test('SEG-7: token sem id em /api/usuarios/me → 401', async () => {
  const app = subirApp({ data: null, error: null });
  const r = await chamar(app, '/api/usuarios/me', { nome: 'x', perfil: 'admin' });
  assert.equal(r.status, 401);
});

// ── 5. Usuário real → 200 com os dados do BANCO ─────────────────────────────
test('SEG-7: /api/auth/me com usuário real → 200 e perfil do banco (ignora claim)', async () => {
  const dbUser = {
    id: 'u-real', nome: 'Maria', email: 'maria@x.com', perfil: 'pcp', permissoes: ['pcp', 'relatorios'],
    canais_chat: 'geral', avatar_iniciais: 'MA', avatar_cor: '#123', avatar_url: null,
  };
  const app = subirApp({ data: dbUser, error: null });
  // token mente: diz admin/tudo, mas o banco diz pcp.
  const r = await chamar(app, '/api/auth/me', { id: 'u-real', perfil: 'admin', permissoes: ['tudo'], nome: 'HACKER' });
  assert.equal(r.status, 200, 'veio ' + r.status);
  assert.equal(r.body.perfil, 'pcp', 'perfil deve vir do banco, não da claim');
  assert.equal(r.body.nome, 'Maria');
  assert.ok(!r.body.permissoes.includes('tudo'), 'não pode herdar "tudo" da claim');
});

test('SEG-7: /api/usuarios/me com usuário real → 200, source db', async () => {
  const dbUser = {
    id: 'u-real', nome: 'Maria', email: 'maria@x.com', perfil: 'pcp', permissoes: ['pcp'], ativo: true,
    canais_chat: null, avatar_iniciais: null, avatar_cor: null, avatar_url: null,
  };
  const app = subirApp({ data: dbUser, error: null });
  const r = await chamar(app, '/api/usuarios/me', { id: 'u-real', perfil: 'admin', permissoes: ['tudo'] });
  assert.equal(r.status, 200, 'veio ' + r.status);
  assert.equal(r.body.source, 'db');
  assert.equal(r.body.usuario.perfil, 'pcp');
});

test('SEG-7: admin no banco recebe "tudo" automaticamente', async () => {
  const dbUser = { id: 'a1', nome: 'Adm', email: 'a@x.com', perfil: 'admin', permissoes: [] };
  const app = subirApp({ data: dbUser, error: null });
  const r = await chamar(app, '/api/auth/me', { id: 'a1' });
  assert.equal(r.status, 200);
  assert.ok(r.body.permissoes.includes('tudo'));
});
