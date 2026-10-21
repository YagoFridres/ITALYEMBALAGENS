'use strict';
// SEG-1 · JWT_SECRET sem valor reserva no código.
//
// Teste de comportamento real: o bloco do SEG-1 e o `authMiddleware` são
// extraídos do server.js e executados num contexto `vm` com um `process`
// falso (env + exit). Nada sobe o servidor, nada toca o banco.
//
//   1) NODE_ENV=production, sem JWT_SECRET -> process.exit(1)
//   2) RAILWAY_ENVIRONMENT presente, sem JWT_SECRET -> process.exit(1)
//   3) fora de produção, sem JWT_SECRET -> sobe com segredo EFÊMERO + aviso [AUD-SEC]
//   4) com JWT_SECRET -> usa exatamente o valor do ambiente
//   5) token assinado com o segredo A -> 401 (token_invalid) no servidor com segredo B
//   6) `git ls-files` não tem nenhum arquivo `_*tok*` / `_*jwt*` versionado
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execSync } = require('node:child_process');
const jwt = require('jsonwebtoken');

const REPO = path.join(__dirname, '..');
const SERVER_SRC = fs.readFileSync(path.join(REPO, 'server.js'), 'utf8');

function extrairTrecho(src, inicio, fim) {
  const i = src.indexOf(inicio);
  assert.ok(i >= 0, 'não achei o início: ' + inicio);
  const j = src.indexOf(fim, i);
  assert.ok(j > i, 'não achei o fim: ' + fim);
  return src.slice(i, j);
}

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

const BLOCO_SEG1 = extrairTrecho(SERVER_SRC, '// ── SEG-1 ·', '\nfunction _normalizeTokenCandidate');
const BLOCO_TOKENS = extrairTrecho(SERVER_SRC, 'function _normalizeTokenCandidate', '\nconst AUTH_TOKEN_MAX_AGE_MS');
const FN_AUTH = extrairFuncao(SERVER_SRC, 'function authMiddleware(req, res, next)');

const SCRIPT = [
  BLOCO_SEG1,
  BLOCO_TOKENS,
  FN_AUTH,
  'globalThis.__r = { secret: JWT_SECRET, prod: _JWT_EM_PRODUCAO, auth: authMiddleware };',
].join('\n');

// Executa o bloco real com um `process` de mentira. Devolve o que sobreviveu.
function rodar(env) {
  const logs = [];
  const saidas = [];
  const ctx = vm.createContext({
    jwt,
    process: {
      env,
      exit: (code) => {
        saidas.push(code === undefined ? 0 : code);
        const err = new Error('__PROCESS_EXIT__');
        err.__exit = true;
        throw err;
      },
    },
    crypto: { randomBytes: (n) => ({ toString: () => 'ab'.repeat(n) }) },
    console: {
      log: () => {},
      error: (...a) => logs.push(a.map((x) => String(x)).join(' ')),
    },
  });
  try {
    vm.runInContext(SCRIPT, ctx);
  } catch (e) {
    if (!e || !e.__exit) throw e;
  }
  return { saidas, log: logs.join('\n'), r: ctx.__r };
}

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

test('SEG-1: em produção, sem JWT_SECRET, o processo encerra com exit(1)', () => {
  const r = rodar({ NODE_ENV: 'production' });
  assert.deepEqual(r.saidas, [1], 'deveria encerrar o processo com código 1');
  assert.equal(r.r, undefined, 'não deveria chegar ao fim do bloco');
  assert.match(r.log, /JWT_SECRET/, 'a mensagem precisa citar JWT_SECRET');
  assert.ok(!/italy_secret_2026/.test(r.log), 'a mensagem não pode imprimir valor de segredo');
});

test('SEG-1: RAILWAY_ENVIRONMENT presente conta como produção e também encerra', () => {
  const r = rodar({ RAILWAY_ENVIRONMENT: 'production' });
  assert.deepEqual(r.saidas, [1]);
  assert.equal(r.r, undefined);
});

test('SEG-1: fora de produção, sem JWT_SECRET, sobe com segredo efêmero e avisa', () => {
  const r = rodar({});
  assert.deepEqual(r.saidas, [], 'não pode encerrar fora de produção');
  assert.ok(r.r, 'deveria ter chegado ao fim do bloco');
  assert.equal(r.r.prod, false);
  assert.equal(typeof r.r.secret, 'string');
  assert.equal(r.r.secret.length, 96, 'segredo efêmero de 48 bytes em hex');
  assert.match(r.log, /\[AUD-SEC\]/, 'precisa avisar que o segredo é efêmero');
});

test('SEG-1: com JWT_SECRET definido, usa exatamente o valor do ambiente', () => {
  const r = rodar({ JWT_SECRET: 'segredo-B-2f7c1a' });
  assert.deepEqual(r.saidas, []);
  assert.equal(r.r.secret, 'segredo-B-2f7c1a');
  assert.ok(!/ausente/.test(r.log), 'não deve avisar ausência quando a variável existe');
});

test('SEG-1: JWT_SECRET igual ao valor público antigo é denunciado', () => {
  const r = rodar({ JWT_SECRET: 'italy_secret_2026' });
  assert.deepEqual(r.saidas, []);
  assert.match(r.log, /italy_secret_2026/, 'precisa avisar que o valor público antigo está em uso');
});

test('SEG-1: token assinado com o segredo A dá 401 no servidor que usa o segredo B', () => {
  const r = rodar({ JWT_SECRET: 'segredo-B' });
  assert.equal(r.r.secret, 'segredo-B', 'o servidor de teste usa o segredo B');

  const tokenA = jwt.sign({ id: 'usr-1', perfil: 'admin', permissoes: ['tudo'] }, 'segredo-A', { expiresIn: '1h' });
  const res = fakeRes();
  let next = 0;
  r.r.auth({ headers: { authorization: 'Bearer ' + tokenA } }, res, () => { next++; });
  assert.equal(next, 0, 'não pode passar adiante');
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'token_invalid');

  // controle positivo: com o segredo certo, o mesmo tipo de token passa
  const tokenB = jwt.sign({ id: 'usr-1', perfil: 'admin', permissoes: ['tudo'] }, 'segredo-B', { expiresIn: '1h' });
  const res2 = fakeRes();
  let next2 = 0;
  const req2 = { headers: { authorization: 'Bearer ' + tokenB } };
  r.r.auth(req2, res2, () => { next2++; });
  assert.equal(next2, 1, 'token do segredo correto precisa passar');
  assert.equal(res2.statusCode, null);
  assert.equal(req2.usuario.id, 'usr-1');
});

test('SEG-1: nenhum arquivo de token/segredo continua versionado', () => {
  const lista = execSync('git ls-files', { cwd: REPO, maxBuffer: 1e9 }).toString().split('\n').filter(Boolean);
  const achados = lista.filter((f) => /^_.*(tok|jwt)/.test(f));
  assert.deepEqual(achados, [], 'estes arquivos não podem estar versionados: ' + achados.join(', '));
});

test('SEG-1: .gitignore barra os padrões _*tok*, _gera* e _gentoken*', () => {
  const gi = fs.readFileSync(path.join(REPO, '.gitignore'), 'utf8');
  for (const p of ['_*tok*', '_gera*', '_gentoken*']) {
    assert.ok(gi.split('\n').some((l) => l.trim() === p), 'falta o padrão no .gitignore: ' + p);
  }
});
