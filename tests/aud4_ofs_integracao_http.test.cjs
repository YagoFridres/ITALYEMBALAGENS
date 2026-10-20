'use strict';

/**
 * AUD-4 · teste REAL de integração HTTP do /api/ofs (sem banco, sem produção).
 *
 * Sobe o server.js REAL (child process) apontando para um PostgREST FALSO local
 * que devolve 4112 OFs fictícias paginadas de 500 em 500. Valida:
 *   1. carga completa preserva TODAS as OFs (total=4112, nenhum corte artificial);
 *   2. rajada de 8 requisições idênticas concorrentes faz UMA única paginação ao banco
 *      (single-flight) em vez de multiplicar a carga;
 *   3. com o orçamento de tempo estourado, responde HTTP 503 com diagnóstico
 *      (explicitamente NÃO 200 com dados incompletos) em vez de pendurar até o 502.
 *
 * Rodar: node --test tests/aud4_ofs_integracao_http.test.cjs
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const jwt = require('jsonwebtoken');

const ROOT = path.join(__dirname, '..');
const UUID_E1 = 'df5f7672-0a6b-402d-ae65-296554236c31';
const JWT_SECRET = 'aud4_test_secret';
const EMAIL = 'auditor@e1.local';
const TOTAL_OFS = 4112;
const PAGE = 500;
const DEADLINE_MS = 5000; // piso do orçamento (server.js: Math.max(5000, env))
const PAGINA_LENTA_MS = 900; // 9 páginas x 900ms = 8.1s > 5s => estoura o orçamento

let fakeSrv = null;
let fakePort = 0;
let fakeState = null;
let appProc = null;
let appPort = 0;
let token = '';
const appLogs = [];

function json(res, code, body, contentRange) {
  const payload = JSON.stringify(body);
  const headers = { 'Content-Type': 'application/json' };
  if (contentRange) headers['Content-Range'] = contentRange;
  res.writeHead(code, headers);
  res.end(payload);
}

function parseRange(req, u) {
  // supabase-js 2.x: .range(from,to) => query params offset/limit (não header Range).
  const h = String(req.headers.range || '');
  const m = h.match(/^(\d+)-(\d+)$/);
  if (m) return { from: Number(m[1]), to: Number(m[2]) };
  const off = Number(u.searchParams.get('offset'));
  const lim = Number(u.searchParams.get('limit'));
  const from = Number.isFinite(off) && off >= 0 ? off : 0;
  const to = Number.isFinite(lim) && lim > 0 ? from + lim - 1 : from + PAGE - 1;
  return { from, to };
}

function paginaOfs(from, to) {
  const n = Math.max(0, Math.min(to - from + 1, PAGE, TOTAL_OFS - from));
  const data = [];
  for (let i = 0; i < n; i++) {
    const idx = from + i;
    data.push({
      id: 'aud4-of-' + idx,
      of: String(1000 + idx),
      numero: String(1000 + idx),
      created_at: new Date(Date.UTC(2026, 0, 1) + idx * 1000).toISOString(),
      status: 'aberta',
      empresa_id: UUID_E1,
      emp_id: UUID_E1,
      cli_id: null,
      clinome: 'CLIENTE AUD4 ' + idx,
      descricao: 'PRODUTO ' + idx,
      qtd: 1,
      itens: [{ descricao: 'PRODUTO ' + idx, valor_total: 10 }],
      valor_total: 10,
    });
  }
  return { n, data };
}

function iniciarFake() {
  fakeState = { ofsRangeCalls: 0, slowMs: 0 };
  fakeSrv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://local');
    const table = u.pathname.replace(/^\/rest\/v1\//, '').split('/')[0];

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return json(res, 400, { message: 'mock: escrita bloqueada (sem banco)', code: 'MOCK' });
    }

    const accept = String(req.headers.accept || '');
    const objectMode = accept.includes('application/vnd.pgrst.object');

    if (table === 'usuarios') {
      // resolverEmpresaId -> empresa_id da E1
      return json(res, 200, objectMode ? { empresa_id: UUID_E1 } : [{ empresa_id: UUID_E1 }], '0-0/1');
    }

    if (table === 'ofs') {
      fakeState.ofsRangeCalls++;
      const { from, to } = parseRange(req, u);
      const planned = String(req.headers.prefer || '').includes('count=planned');
      const responder = () => {
        const { n, data } = paginaOfs(from, to);
        const cr = planned
          ? ('*/' + TOTAL_OFS)
          : (from + '-' + (from + Math.max(0, n - 1)) + '/' + TOTAL_OFS);
        return json(res, 200, data, cr);
      };
      if (fakeState.slowMs > 0) return setTimeout(responder, fakeState.slowMs);
      return responder();
    }

    // Qualquer outra tabela: vazio (o server.js tolera).
    return json(res, 200, objectMode ? {} : [], '*/0');
  });
  return new Promise((resolve) => {
    fakeSrv.listen(0, '127.0.0.1', () => {
      fakePort = fakeSrv.address().port;
      resolve();
    });
  });
}

function portaVazia() {
  return new Promise((resolve) => {
    const s = http.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

function get(p, timeoutMs = 60000, extraHeaders = {}) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port: appPort, path: p, method: 'GET', headers: { Authorization: 'Bearer ' + token, Accept: '*/*', ...extraHeaders } },
      (res) => {
        let d = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ code: res.statusCode, body: d, ms: Date.now() - t0 }));
      },
    );
    req.on('error', (e) => resolve({ code: 0, err: e.message, ms: Date.now() - t0 }));
    req.setTimeout(timeoutMs, () => { try { req.destroy(); } catch (_) {} });
    req.end();
  });
}

async function subirServidorReal() {
  appPort = await portaVazia();
  appProc = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(appPort),
      SUPABASE_URL: 'http://127.0.0.1:' + fakePort,
      SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
      JWT_SECRET,
      OFS_FULL_LOAD_DEADLINE_MS: String(DEADLINE_MS),
      OFS_FULL_LOAD_MAX_PAGES: '200',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  appProc.stdout.on('data', (c) => appLogs.push(String(c)));
  appProc.stderr.on('data', (c) => appLogs.push(String(c)));

  token = jwt.sign({ id: 'aud4', email: EMAIL, nome: 'AUD4', perfil: 'admin', permissoes: ['tudo'] }, JWT_SECRET, { expiresIn: '1h' });

  const limite = Date.now() + 45000;
  while (Date.now() < limite) {
    const r = await get('/api/version', 3000);
    if (r.code === 200) return;
    await new Promise((res) => setTimeout(res, 400));
  }
  throw new Error('server.js não ficou pronto em 45s. Logs:\n' + appLogs.join('').slice(-4000));
}

test.before(async () => {
  await iniciarFake();
  await subirServidorReal();
});

test.after(() => {
  try { if (appProc) appProc.kill(); } catch (_) {}
  try { if (fakeSrv) fakeSrv.close(); } catch (_) {}
});

test('[1] carga completa preserva TODAS as 4112 OFs (sem corte artificial)', async () => {
  const inicio = fakeState.ofsRangeCalls;
  const r = await get('/api/ofs');
  assert.equal(r.code, 200, 'HTTP deve ser 200 (logs: ' + appLogs.join('').slice(-1500) + ')');

  const j = JSON.parse(r.body);
  assert.equal(j.ok, true);
  assert.equal(j.data.length, TOTAL_OFS, 'todas as OFs devem vir na carga completa');
  assert.equal(j.total, TOTAL_OFS);
  assert.equal(j.hasMore, false);

  const chamadas = fakeState.ofsRangeCalls - inicio;
  assert.ok(chamadas <= 12, 'deve paginar em ~9 blocos de 500, não mais (veio ' + chamadas + ')');

  // primeira e última OFs presentes (nada foi perdido nas pontas)
  const ids = new Set(j.data.map((o) => o.id));
  assert.ok(ids.has('aud4-of-0') && ids.has('aud4-of-' + (TOTAL_OFS - 1)), 'pontas devem estar presentes');
});

test('[2] 8 requisições idênticas concorrentes => UMA única paginação (single-flight)', async () => {
  const inicio = fakeState.ofsRangeCalls;
  const resposta = await Promise.all(
    Array.from({ length: 8 }, (_, i) => get('/api/ofs?nocache=1&_f=' + i)),
  );
  resposta.forEach((r, i) => {
    assert.equal(r.code, 200, 'req #' + i + ' deve responder 200');
    const j = JSON.parse(r.body);
    assert.equal(j.data.length, TOTAL_OFS, 'req #' + i + ' deve receber o conjunto completo');
  });

  const chamadas = fakeState.ofsRangeCalls - inicio;
  // com single-flight: ~9 (uma carga). Sem: ~72. Aceitamos folga pequena p/ ruído do boot.
  assert.ok(chamadas <= 18, 'single-flight deveria reduzir a ~9 páginas; veio ' + chamadas);
});

test('[3] estouro do orçamento de tempo => HTTP 503 com diagnóstico (nunca 200 truncado)', async () => {
  fakeState.slowMs = PAGINA_LENTA_MS; // cada página "gasta" 900ms; orçamento = 5000ms
  try {
    const r = await get('/api/ofs?nocache=1&_f=slow');
    if (r.code !== 503) console.log('LOGS-SERVER:\n' + appLogs.join('').slice(-4000));
    assert.equal(r.code, 503, 'deve responder 503 explícito, não pendurar (veio ' + r.code + ')');
    const j = JSON.parse(r.body);
    assert.equal(j.ok, false, 'não pode ser ok:true (isso mascararia erro como sucesso)');
    assert.equal(j.diagnostico.err_code, 'OFS_PAGINACAO_TIMEOUT');
    assert.match(String(j.diagnostico.err_message), /timeout de orçamento de tempo/);
    assert.equal(j.data.length, 0, 'não deve devolver dados parciais como se fossem completos');
    assert.ok(r.ms < 15000, 'deve responder dentro do orçamento, sem pendurar (levou ' + r.ms + 'ms)');
  } finally {
    fakeState.slowMs = 0;
  }
});
