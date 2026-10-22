// [HOTFIX-EGRESS / HOTFIX-5] Quando a API responde erro que nao e JSON (502/503), o front
// mostrava "* is not valid JSON" na tela (Dashboard e busca universal de OF do Dashboard).
// Agora o JSON e lido com seguranca e a mensagem exibida e "Servidor indisponível, tente novamente.".
// Extraido do FONTE REAL de patch.js (sem rede).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// CRLF -> LF: o checkout Windows grava CRLF e quebraria os indexOf por '\n'.
const src = fs.readFileSync(path.join(__dirname, '..', 'patch.js'), 'utf8').replace(/\r\n/g, '\n');

const MSG = 'Servidor indisponível, tente novamente.';

// ---- extracao do helper _apiJsonSeguro --------------------------------------
const iniSeguro = src.indexOf("if (typeof window._apiJsonSeguro !== 'function') {");
assert.ok(iniSeguro > 0, 'helper _apiJsonSeguro nao encontrado em patch.js');
const fimSeguro = src.indexOf('\n}\n', iniSeguro) + 3;
const blocoSeguro = src.slice(iniSeguro, fimSeguro);

// ---- extracao de __dashCalcularTotalTodasOfs --------------------------------
const iniTotal = src.indexOf('async function __dashCalcularTotalTodasOfs()');
assert.ok(iniTotal > 0, '__dashCalcularTotalTodasOfs nao encontrado');
const fimTotal = src.indexOf('\n  }\n', iniTotal) + 4;
const blocoTotal = src.slice(iniTotal, fimTotal);

// ---- extracao de __dashAplicarTotalCard -------------------------------------
const iniCard = src.indexOf('function __dashAplicarTotalCard(total) {');
assert.ok(iniCard > 0, '__dashAplicarTotalCard nao encontrado');
const fimCard = src.indexOf('\n  }\n', iniCard) + 4;
const blocoCard = src.slice(iniCard, fimCard);

function montar(windows) {
  const win = Object.assign({ _apiAuthFetch: async () => { throw new Error('nao usado'); } }, windows || {});
  const fabrica = new Function('window', 'console', blocoSeguro + '\n return window._apiJsonSeguro;');
  return fabrica(win, { error() {}, warn() {} });
}

// ---- 1) _apiJsonSeguro ------------------------------------------------------
test('corpo HTML de 502 (nao-JSON) devolve null em vez de estourar', async () => {
  const api = montar();
  const resp = { ok: false, status: 502, text: async () => '<html>Bad Gateway</html>' };
  assert.strictEqual(await api(resp), null);
});

test('corpo JSON valido e lido normalmente', async () => {
  const api = montar();
  const resp = { ok: true, status: 200, text: async () => JSON.stringify({ ok: true, data: [{ id: 'x' }] }) };
  const j = await api(resp);
  assert.ok(j && j.ok === true);
  assert.strictEqual(j.data[0].id, 'x');
});

test('corpo vazio, response nulo ou text() que estoura devolvem null', async () => {
  const api = montar();
  assert.strictEqual(await api({ ok: true, text: async () => '' }), null);
  assert.strictEqual(await api({ ok: true, text: async () => '   ' }), null);
  assert.strictEqual(await api(null), null);
  assert.strictEqual(await api({ ok: true, text: async () => { throw new TypeError('network'); } }), null);
});

// ---- 2) __dashCalcularTotalTodasOfs: falha nao vira numero ----
function montarTotal(respostas) {
  const store = {};
  const apiSeguro = montar();
  const win = {
    _apiJsonSeguro: apiSeguro,
    _apiAuthFetch: async () => respostas.shift(),
  };
  const sessionStorage = { getItem: (k) => (store[k] == null ? null : store[k]), setItem: (k, v) => { store[k] = String(v); } };
  const fabrica = new Function('window', 'sessionStorage', 'console', blocoTotal + '\n return __dashCalcularTotalTodasOfs;');
  return { fn: fabrica(win, sessionStorage, { error() {} }), store };
}

test('502 no meio da leitura devolve null (nao finge R$ 0,00) e nao grava cache', async () => {
  const m = montarTotal([{ ok: false, status: 502, text: async () => '<html>502</html>' }]);
  assert.strictEqual(await m.fn(), null);
  assert.strictEqual(m.store.dash_total_todas_ofs, undefined, 'erro nao pode virar cache');
});

test('leitura completa soma e devolve o numero (e grava cache)', async () => {
  // [HOTFIX-3] o total agora vem somado do servidor (total_valor_todas_ofs), nao da lista inteira
  const m = montarTotal([{ ok: true, status: 200, text: async () => JSON.stringify({ ok: true, total_valor_todas_ofs: 15 }) }]);
  assert.strictEqual(await m.fn(), 15);
  assert.ok(m.store.dash_total_todas_ofs, 'leitura completa deve gravar cache');
});

test('corpo 200 que nao e JSON tambem devolve null', async () => {
  const m = montarTotal([{ ok: true, status: 200, text: async () => '<!doctype html><h1>erro</h1>' }]);
  assert.strictEqual(await m.fn(), null);
});

// ---- 3) __dashAplicarTotalCard: mensagem amigavel --------
function montarCard() {
  const els = {};
  const document = {
    getElementById: (id) => els[id] || null,
  };
  const __dashValorFormatado = (v) => 'R$ ' + Number(v).toFixed(2);
  const fabrica = new Function('document', '__dashValorFormatado', blocoCard + '\n return __dashAplicarTotalCard;');
  return { aplicar: fabrica(document, __dashValorFormatado), els };
}

test('__dashAplicarTotalCard(null) escreve a mensagem amigavel no card', () => {
  const m = montarCard();
  m.els['dash-card-total-geral'] = { textContent: '', style: {} };
  m.aplicar(null);
  assert.strictEqual(m.els['dash-card-total-geral'].textContent, MSG);
});

test('__dashAplicarTotalCard(numero) escreve o valor formatado', () => {
  const m = montarCard();
  m.els['dash-card-total-geral'] = { textContent: '⏳ Somando...', style: {} };
  m.aplicar(1234);
  assert.strictEqual(m.els['dash-card-total-geral'].textContent, 'R$ 1234.00');
});

// ---- 4) nenhum ponto do Dashboard usa r.json() cru --------
test('busca universal de OF do Dashboard usa _apiJsonSeguro + mensagem amigavel', () => {
  const ini = src.indexOf('function __dashBuscarEPaginar(resumoDiv, offset, termoRaw, forcarRefresh) {');
  assert.ok(ini > 0);
  const fim = src.indexOf('\n  }\n', ini) + 4;
  const bloco = src.slice(ini, fim);
  assert.match(bloco, /window\._apiJsonSeguro\(r\)/);
  assert.ok(bloco.includes(MSG));
  assert.doesNotMatch(bloco, /\.then\(function\(r\) \{ return r\.json\(\); \}\)/);
});

test('carregamentos de /api/dashboard/resumo-ofs usam _apiJsonSeguro + mensagem amigavel', () => {
  const ocorrencias = src.split('_apiAuthFetch(\'/api/dashboard/resumo-ofs\')').length - 1;
  // [HOTFIX-3] 2 carregamentos do Dashboard + 1 fallback do total ("todas as OFs") = 3
  assert.strictEqual(ocorrencias, 3, 'esperados 3 acessos a resumo-ofs (2 cards + 1 total)');
  assert.doesNotMatch(src, /_apiAuthFetch\('\/api\/dashboard\/resumo-ofs'\)[\s\S]{0,120}?\.then\(function\(r\) \{ return r\.json\(\); \}\)/);
  const msgOcorrencias = src.split(MSG).length - 1;
  assert.ok(msgOcorrencias >= 4, 'mensagem amigavel deve aparecer nos pontos do Dashboard, achei ' + msgOcorrencias);
});
