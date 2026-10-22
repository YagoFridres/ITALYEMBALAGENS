// [HOTFIX-EGRESS / HOTFIX-2] Imagem da OF buscada sob demanda (GET /api/ofs/:id) com cache em
// memoria e single-flight. Extrai do fonte real de patch.js:
//   - _normalizeImgs (precisa aceitar data:image, senao o base64 seria descartado);
//   - o IIFE patchImagemOfSobDemanda (_ofImagemSobDemanda / _ofAbrirImagem).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// normaliza CRLF -> LF: o checkout Windows (core.autocrlf=true) grava CRLF e quebraria os
// indexOf por '\n' usados para extrair os trechos (falso negativo, nao erro de produto).
const src = fs.readFileSync(path.join(__dirname, '..', 'patch.js'), 'utf8').replace(/\r\n/g, '\n');

const iniNorm = src.indexOf('function _normalizeImgsAny(v) {');
const fimNorm = src.indexOf('\n  }\n', iniNorm) + 4;
assert.ok(iniNorm > 0 && fimNorm > iniNorm, '_normalizeImgsAny nao encontrado em patch.js');
const blocoNorm = src.slice(iniNorm, fimNorm);

const iniIife = src.indexOf('(function patchImagemOfSobDemanda() {');
const fimIife = src.indexOf('\n})();', iniIife) + 5;
assert.ok(iniIife > 0 && fimIife > iniIife, 'IIFE patchImagemOfSobDemanda nao encontrado em patch.js');
const blocoIife = src.slice(iniIife, fimIife);

function montar(respostas) {
  const ctx = { chamadas: 0, abriuCom: null, toasts: [] };
  const window = {};
  window._normalizeImgs = new Function(blocoNorm + '\n return _normalizeImgsAny;')();
  window.toast = function (m) { ctx.toasts.push(String(m || '')); };
  window._apiAuthFetch = async function () {
    ctx.chamadas++;
    const r = respostas.shift();
    if (r === 502) return { ok: false, json: async () => { throw new SyntaxError('upstream error is not valid JSON'); } };
    return { ok: true, json: async () => r };
  };
  const fabrica = new Function('window', 'console', blocoIife + '\n return { sobDemanda: window._ofImagemSobDemanda, abrir: window._ofAbrirImagem };');
  const api = fabrica(window, { error() {} });
  return { ctx, window, sobDemanda: api.sobDemanda, abrir: api.abrir };
}

test('_normalizeImgs preserva data:image (base64) — senao o HOTFIX-2 nao acharia a imagem', () => {
  const norm = new Function(blocoNorm + '\n return _normalizeImgsAny;')();
  assert.deepStrictEqual(norm(['data:image/png;base64,AAAA']), ['data:image/png;base64,AAAA']);
  assert.deepStrictEqual(norm('https://x/y.png'), ['https://x/y.png']);
});

test('busca sob demanda resolve imagem_url e usa cache em chamadas repetidas', async () => {
  const m = montar([{ ok: true, data: { imagem_url: '/uploads/a.png' } }]);
  assert.strictEqual(await m.sobDemanda('1'), '/uploads/a.png');
  assert.strictEqual(await m.sobDemanda('1'), '/uploads/a.png');
  assert.strictEqual(m.ctx.chamadas, 1);
});

test('imagem guardada so em imgs (base64) tambem e encontrada', async () => {
  const m = montar([{ ok: true, data: { imgs: ['data:image/png;base64,BBBB'] } }]);
  assert.strictEqual(await m.sobDemanda('2'), 'data:image/png;base64,BBBB');
  assert.strictEqual(m.ctx.chamadas, 1);
});

test('chamadas simultaneas do mesmo id fazem uma unica requisicao (single-flight)', async () => {
  let liberar;
  const porta = new Promise((r) => { liberar = r; });
  const m = montar([]);
  m.window._apiAuthFetch = async () => {
    m.ctx.chamadas++;
    await porta;
    return { ok: true, json: async () => ({ ok: true, data: { imagem_url: '/uploads/sf.png' } }) };
  };
  const p1 = m.sobDemanda('sf');
  const p2 = m.sobDemanda('sf');
  liberar();
  const [a, b] = await Promise.all([p1, p2]);
  assert.strictEqual(a, '/uploads/sf.png');
  assert.strictEqual(b, '/uploads/sf.png');
  assert.strictEqual(m.ctx.chamadas, 1);
});

test('resposta sem JSON (502) devolve vazio, nao cacheia e nao quebra', async () => {
  const m = montar([502, { ok: true, data: { imagem_url: '/uploads/e.png' } }]);
  assert.strictEqual(await m.sobDemanda('e'), '');
  assert.strictEqual(await m.sobDemanda('e'), '/uploads/e.png');
  assert.strictEqual(m.ctx.chamadas, 2);
});

test('id vazio nao dispara requisicao', async () => {
  const m = montar([]);
  assert.strictEqual(await m.sobDemanda(''), '');
  assert.strictEqual(m.ctx.chamadas, 0);
});

test('_ofAbrirImagem usa a URL da lista quando existe (sem requisicao)', async () => {
  const m = montar([]);
  await m.abrir({ id: '3', url: '/uploads/j.png', abrirJanela: (u) => { m.ctx.abriuCom = u; } });
  assert.strictEqual(m.ctx.abriuCom, '/uploads/j.png');
  assert.strictEqual(m.ctx.chamadas, 0);
});

test('_ofAbrirImagem busca sob demanda quando a lista nao trouxe a imagem', async () => {
  const m = montar([{ ok: true, data: { imgs: ['data:image/png;base64,CCCC'] } }]);
  await m.abrir({ id: '4', url: '', abrirJanela: (u) => { m.ctx.abriuCom = u; } });
  assert.strictEqual(m.ctx.abriuCom, 'data:image/png;base64,CCCC');
  assert.strictEqual(m.ctx.chamadas, 1);
});

test('_ofAbrirImagem sem imagem avisa e nao abre janela', async () => {
  const m = montar([{ ok: true, data: { imgs: [] } }]);
  let abriu = false;
  await m.abrir({ id: '5', url: '', abrirJanela: () => { abriu = true; } });
  assert.strictEqual(abriu, false);
  assert.strictEqual(m.ctx.toasts.length, 1);
  assert.match(m.ctx.toasts[0], /não tem imagem|nao tem imagem/i);
});

test('TTL do cache de imagem e 5 min', () => {
  assert.match(blocoIife, /var TTL = 5 \* 60 \* 1000;/);
});
