'use strict';
// SEG-4 · requireAdmin sempre exige admin (não depende mais do prefixo da rota).
//
// Antes: `needsAdmin = p.startsWith('/api/usuarios') || p.startsWith('/api/configuracoes')`.
// Assim, qualquer rota /api/admin/* ou /api/_jj3/* que usasse requireAdmin pegava
// `next()` direto — qualquer usuário logado disparava correções em massa de OFs.
//
// Este teste extrai o `requireAdmin` real do server.js e o executa num contexto
// `vm` com um `supabase` falso (só a consulta a `usuarios`). Nada sobe o servidor
// e nada toca o banco.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SERVER_SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

// ── extração do requireAdmin ────────────────────────────────────────────────
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

const FN = extrairFuncao(SERVER_SRC, 'async function requireAdmin(req, res, next)');

// Cria um contexto vm com um `supabase` falso e devolve o requireAdmin.
function montarServidor(dbResultado) {
  const ctx = vm.createContext({
    console: { warn: () => {}, error: () => {}, log: () => {} },
    supabase: {
      from() {
        return {
          select() { return this; },
          eq() { return this; },
          maybeSingle() { return Promise.resolve(dbResultado); },
        };
      },
    },
    // authMiddleware só seria chamado se req.usuario não existisse; nos testes
    // sempre setamos req.usuario, então nunca chega aqui.
    authMiddleware: (req, res) => res.status(401).json({ ok: false, error: 'token_missing' }),
  });
  vm.runInContext(FN + '\nglobalThis.__requireAdmin = requireAdmin;', ctx);
  return ctx.__requireAdmin;
}

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

// Executa requireAdmin para um usuário do token e devolve o desfecho.
async function rodar({ usuario, db }) {
  const requireAdmin = montarServidor(db);
  const req = { usuario, originalUrl: '/x', url: '/x', path: '/x' };
  const res = fakeRes();
  let passou = false;
  await requireAdmin(req, res, () => { passou = true; });
  return { passou, status: res.statusCode, body: res.body };
}

const ADMIN_DB = { data: { perfil: 'admin', permissoes: [] }, error: null };
const CUSTOM_DB = { data: { perfil: 'custom', permissoes: ['pcp'] }, error: null };
const TUDO_DB = { data: { perfil: 'operador', permissoes: ['tudo'] }, error: null };

// ── 1. Fonte: requireAdmin não pode mais depender de prefixo de rota ────────
test('SEG-4: requireAdmin não usa mais needsAdmin por prefixo', () => {
  assert.ok(!/needsAdmin/.test(SERVER_SRC), 'sobrou a variável needsAdmin no server.js');
  assert.ok(
    !/p\.startsWith\('\/api\/usuarios'\)/.test(SERVER_SRC),
    'sobrou a condição de prefixo /api/usuarios'
  );
});

test('SEG-4: toda rota /api/admin/* e /api/_jj3/* exige requireAdmin', () => {
  const re = /app\.(get|post|put|patch|delete)\(\s*'(\/api\/(?:admin|_jj3)\/[^']*)'\s*,([\s\S]*?)\basync\s*\(/g;
  const linhas = SERVER_SRC.split('\n');
  let m;
  let total = 0;
  while ((m = re.exec(SERVER_SRC))) {
    total++;
    const tail = m[3] || '';
    assert.ok(
      /requireAdmin/.test(tail),
      'rota sem requireAdmin: ' + m[2] + ' -> ' + tail.trim().slice(0, 80)
    );
  }
  assert.ok(total >= 11, 'esperava pelo menos 11 rotas admin/_jj3, achei ' + total);
  // sanity: a checagem acima varre o fonte inteiro
  assert.ok(linhas.length > 1000);
});

// ── 2. Comportamento: token custom → 403, admin → passa ─────────────────────
test('SEG-4: usuário custom no banco → 403', async () => {
  const r = await rodar({ usuario: { id: 'u1', perfil: 'admin' }, db: CUSTOM_DB });
  assert.equal(r.passou, false, 'custom não pode passar');
  assert.equal(r.status, 403);
});

test('SEG-4: admin no banco → passa, mesmo com claim mentindo como custom', async () => {
  const r = await rodar({ usuario: { id: 'u1', perfil: 'custom' }, db: ADMIN_DB });
  assert.equal(r.passou, true, 'admin no banco deve passar');
});

test("SEG-4: permissão 'tudo' no banco → passa", async () => {
  const r = await rodar({ usuario: { id: 'u1', perfil: 'operador' }, db: TUDO_DB });
  assert.equal(r.passou, true);
});

test('SEG-4: token sem id → 403', async () => {
  const r = await rodar({ usuario: { perfil: 'admin' }, db: ADMIN_DB });
  assert.equal(r.passou, false);
  assert.equal(r.status, 403);
});

// ── 3. Banco indisponível: cai para as claims e AINDA exige admin ───────────
test('SEG-4: banco com erro + claim custom → 403 (não libera por prefixo)', async () => {
  const r = await rodar({
    usuario: { id: 'u1', perfil: 'custom', permissoes: ['pcp'] },
    db: { data: null, error: { message: 'db down' } },
  });
  assert.equal(r.passou, false, 'erro de banco não pode liberar rota admin');
  assert.equal(r.status, 403);
});

test('SEG-4: banco com erro + claim admin → passa', async () => {
  const r = await rodar({
    usuario: { id: 'u1', perfil: 'admin', permissoes: [] },
    db: { data: null, error: { message: 'db down' } },
  });
  assert.equal(r.passou, true);
});

test('SEG-4: usuário inexistente no banco + claim custom → 403', async () => {
  const r = await rodar({
    usuario: { id: 'fantasma', perfil: 'custom', permissoes: [] },
    db: { data: null, error: null },
  });
  assert.equal(r.passou, false);
  assert.equal(r.status, 403);
});

// ── 4. Requisitos do prompt: /api/_jj3 e /api/usuarios ─────────────────────
test('SEG-4: PATCH /api/_jj3/corrigir_empresa_of/:id tem requireAdmin', () => {
  const i = SERVER_SRC.indexOf("app.patch('/api/_jj3/corrigir_empresa_of/:id'");
  assert.ok(i >= 0, 'rota não encontrada');
  assert.ok(/requireAdmin/.test(SERVER_SRC.slice(i, i + 80)), 'deveria exigir admin');
});

test('SEG-4: GET /api/admin/sync-vendedores-ofs tem requireAdmin', () => {
  const i = SERVER_SRC.indexOf("app.get('/api/admin/sync-vendedores-ofs'");
  assert.ok(i >= 0, 'rota não encontrada');
  assert.ok(/requireAdmin/.test(SERVER_SRC.slice(i, i + 80)), 'deveria exigir admin');
});

test('SEG-4: /api/usuarios continua exigindo requireAdmin', () => {
  const i = SERVER_SRC.indexOf("app.get('/api/usuarios'");
  assert.ok(i >= 0, 'rota não encontrada');
  assert.ok(/requireAdmin/.test(SERVER_SRC.slice(i, i + 60)), 'deveria exigir admin');
});
