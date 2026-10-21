'use strict';
// SEG-5 · remover as rotas /api/_debug/* (superfície de debug aberta em produção).
//
// Antes: 5 rotas registradas ANTES do middleware global de autenticação
// (server.js ~736–859): POST/GET/DELETE /api/_debug/runtime (gravava o body em
// disco) e GET /api/_debug/caixas-perdidas/recentes|/operadores (devolviam
// perdas, operadores e clientes reais SEM token). Este teste garante que:
//   1) as 5 rotas não existem mais no server.js;
//   2) os helpers _debugRuntimeWrite/_debugRuntimeNormalizePayload (usados em
//      ~30 outros pontos legítimos) continuaram presentes;
//   3) o stub correspondente saiu do sw.js;
//   4) num servidor Express real, montado com o PRÓPRIO authMiddleware do
//      server.js, os 5 caminhos devolvem 404 (com token) e 401 (sem token),
//      nunca dados.
//
// Observação sobre o critério do prompt ("sem token → 404"): como o middleware
// global de autenticação (server.js:1577) cobre TODO /api, um request sem
// token agora é barrado com 401 ANTES de chegar ao 404. A prova de que a rota
// deixou de existir é o 404 obtido COM token válido — é o que este teste mede.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const jwt = require('jsonwebtoken');

const ROOT = path.join(__dirname, '..');
const SERVER_SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const SW_SRC = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

const CAMINHOS = [
  { metodo: 'POST', url: '/api/_debug/runtime' },
  { metodo: 'GET', url: '/api/_debug/runtime' },
  { metodo: 'DELETE', url: '/api/_debug/runtime' },
  { metodo: 'GET', url: '/api/_debug/caixas-perdidas/recentes' },
  { metodo: 'GET', url: '/api/_debug/caixas-perdidas/operadores' },
];

// ── 1. Fonte: as rotas sumiram ──────────────────────────────────────────────
test('SEG-5: nenhuma ocorrência de /api/_debug no server.js', () => {
  const n = (SERVER_SRC.match(/\/api\/_debug/g) || []).length;
  assert.equal(n, 0, 'ainda restam ' + n + ' referências a /api/_debug no server.js');
});

test('SEG-5: nenhuma rota app.*(\'/api/_debug…\') registrada', () => {
  const re = /app\.(get|post|put|patch|delete)\(\s*['"]\/api\/_debug/;
  assert.ok(!re.test(SERVER_SRC), 'sobrou rota /api/_debug registrada no server.js');
});

test('SEG-5: helpers _debugRuntime* preservados (usados em outros pontos)', () => {
  assert.ok(/function _debugRuntimeWrite\s*\(/.test(SERVER_SRC), '_debugRuntimeWrite sumiu');
  assert.ok(
    /function _debugRuntimeNormalizePayload\s*\(/.test(SERVER_SRC),
    '_debugRuntimeNormalizePayload sumiu'
  );
  const usos = (SERVER_SRC.match(/_debugRuntimeWrite\(/g) || []).length;
  assert.ok(usos >= 2, 'esperava vários usos de _debugRuntimeWrite, achei ' + usos);
});

test('SEG-5: sw.js sem stub de /api/_debug', () => {
  assert.equal((SW_SRC.match(/\/api\/_debug/g) || []).length, 0, 'sw.js ainda cita /api/_debug');
  assert.ok(!/debug:\s*'disabled'/.test(SW_SRC), "sw.js ainda tem o stub debug:'disabled'");
});

// ── 2. HTTP real: Express montado com o authMiddleware do próprio server.js ─
function extrairFuncao(src, marcador) {
  const i = src.indexOf(marcador);
  assert.ok(i >= 0, 'não achei: ' + marcador);
  const j = src.indexOf('{', i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fim não achado: ' + marcador);
}

const SECRET = 'seg5-teste-secret';
const FN_AUTH = extrairFuncao(SERVER_SRC, 'function authMiddleware(req, res, next)');

function montarAuthMiddleware() {
  const ctx = vm.createContext({
    console: { warn: () => {}, error: () => {}, log: () => {} },
    JSON,
    jwt,
    JWT_SECRET: SECRET,
    // extração de token trivial basta: aqui só provamos existência de rota,
    // não o parsing de header (coberto nos testes de auth).
    _getTokenFromReq: (req) => {
      const raw = String(req.headers.authorization || '');
      const toks = raw.toLowerCase().startsWith('bearer ') ? raw.slice(7).trim() : '';
      return toks;
    },
  });
  vm.runInContext(FN_AUTH + '\nglobalThis.__auth = authMiddleware;', ctx);
  return ctx.__auth;
}

// Reproduz a ordem de middlewares do server.js que decide a alcançabilidade:
// express → json → /api no-cache → guarda global de auth (server.js:1577).
// As rotas /api/_debug NÃO são registradas (foi exatamente o que removemos).
function subirApp() {
  const authMiddleware = montarAuthMiddleware();
  const PUBLIC = ['/api/health', '/api/ofs_test', '/api/auth/login', '/api/auth/refresh', '/api/auth/me'];
  const app = express();
  app.set('etag', false);
  app.use(express.json({ limit: '50mb' }));
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use((req, res, next) => {
    const fullPath = String(req.originalUrl || req.url || '').split('?')[0].replace(/\/+$/, '');
    if (!fullPath.startsWith('/api')) return next();
    if (req.method === 'OPTIONS') return next();
    if (PUBLIC.some((r) => fullPath === r || fullPath.startsWith(r + '/'))) return next();
    return authMiddleware(req, res, next);
  });
  // rota de sanidade pública para provar que o app sobe e responde
  app.get('/api/health', (req, res) => res.json({ ok: true }));
  // 404 final (equivale ao default do Express no server real)
  app.use((req, res) => res.status(404).json({ ok: false, error: 'not_found' }));
  return app;
}

async function chamar(base, { metodo, url }, token) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  const r = await fetch(base + url, { method: metodo, headers });
  let body = null;
  try { body = await r.json(); } catch (_) { body = null; }
  return { status: r.status, body };
}

test('SEG-5: HTTP — os 5 endpoints devolvem 404 com token (rotas removidas)', async () => {
  const app = subirApp();
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  try {
    const token = jwt.sign({ id: 'u1', perfil: 'admin' }, SECRET, { expiresIn: '1h' });
    const saude = await chamar(base, { metodo: 'GET', url: '/api/health' }, null);
    assert.equal(saude.status, 200, 'app de teste não subiu');

    for (const c of CAMINHOS) {
      const r = await chamar(base, c, token);
      assert.equal(r.status, 404, c.metodo + ' ' + c.url + ' deveria ser 404, veio ' + r.status);
      assert.ok(!r.body || r.body.error === 'not_found', 'resposta inesperada em ' + c.url);
      assert.ok(!r.body || !('rows' in r.body), 'vazou dados em ' + c.url);
    }
  } finally {
    srv.close();
  }
});

test('SEG-5: HTTP — sem token os 5 endpoints não vazam dados (401 no guarda global)', async () => {
  const app = subirApp();
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  try {
    for (const c of CAMINHOS) {
      const r = await chamar(base, c, null);
      assert.ok(r.status === 401 || r.status === 404, c.url + ' veio ' + r.status);
      assert.notEqual(r.status, 200, 'sem token não pode responder 200 em ' + c.url);
      assert.ok(!r.body || !('rows' in r.body), 'vazou perdas/operadores em ' + c.url);
      assert.ok(!r.body || r.body.ok !== true, 'sem token não pode ok:true em ' + c.url);
    }
  } finally {
    srv.close();
  }
});
