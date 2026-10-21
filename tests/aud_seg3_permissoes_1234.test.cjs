'use strict';
// SEG-3 · permissões do Financeiro e de valores no navegador.
//
// Remove a senha fixa '1234' e o sessionStorage.fin_ok e passa a decidir por
// permissão real do usuário (mesma origem do SEG-2):
//   - Admin / 'tudo' -> sempre passa.
//   - Sem usuário -> nega.
//   - Página do Financeiro: Orçamentos='orcamentos', Comissões='comissoes',
//     Central de Custos='financeiro'.
//   - Valores (Dashboard/Histórico): 'dashboard' ou 'financeiro'.
//
// Roda o bloco SEG-3 do patch.js e o do index.html em contexto `vm`; não sobe
// servidor e não toca banco. Também faz varredura de código-fonte para garantir
// que nenhuma liberação por senha fixa sobrou nas fontes ativas.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PATCH = fs.readFileSync(path.join(ROOT, 'patch.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function extrairBloco(src, inicio, fim) {
  const i = src.indexOf(inicio);
  assert.ok(i >= 0, 'não achei o início do bloco SEG-3: ' + inicio);
  const j = src.indexOf(fim, i);
  assert.ok(j > i, 'não achei o fim do bloco SEG-3: ' + fim);
  return src.slice(i, j);
}

// ── patch.js ────────────────────────────────────────────────────────────────
const BLOCO_PATCH = extrairBloco(
  PATCH,
  '// ── SEG-3 ·',
  '// ── SEG-3 · permissões de Financeiro e de valores (navegador) · fim'
);

function carregarPatch(usuario) {
  const win = {};
  const ctx = vm.createContext({ window: win, console });
  if (usuario !== undefined) ctx.CURRENT_USER = usuario;
  vm.runInContext(BLOCO_PATCH, ctx);
  return win;
}

// ── index.html ──────────────────────────────────────────────────────────────
const BLOCO_INDEX = extrairBloco(
  INDEX,
  '// ── SEG-3 ·',
  '// ── SEG-3 · permissões de Financeiro e de valores (cliente) · fim'
);

// O bloco do index.html declara funções (function _permFinTem(){...}) no escopo
// do script. Para testar, avaliamos e expomos as funções via um objeto-retorno.
function carregarIndex(usuario) {
  const win = {};
  const ctx = vm.createContext({ window: win, console });
  if (usuario !== undefined) ctx.CURRENT_USER = usuario;
  vm.runInContext(
    BLOCO_INDEX +
      '\nglobalThis.__fns = { _permFinTem, podeVerValoresFinanceiros, podeAcessarFinanceiro, temAlgumAcessoFinanceiro };',
    ctx
  );
  return ctx.__fns;
}

const ADMIN = { perfil: 'admin', permissoes: [] };
const TUDO = { perfil: 'operador', permissoes: ['tudo'] };
const FIN = { perfil: 'pcp', permissoes: ['financeiro'] };
const COM = { perfil: 'pcp', permissoes: ['comissoes'] };
const ORC = { perfil: 'pcp', permissoes: ['orcamentos'] };
const DASH = { perfil: 'pcp', permissoes: ['dashboard'] };
const NADA = { perfil: 'pcp', permissoes: ['pcp'] };

// ── 1. Fonte não pode mais conter liberação por senha fixa ──────────────────
test('SEG-3: patch.js sem senha fixa e sem fin_ok', () => {
  assert.ok(!/sessionStorage\.(getItem|setItem)\(\s*'fin_ok'/.test(PATCH), 'sobrou fin_ok no patch.js');
  assert.ok(!/senha\s*(===|!==)\s*'1234'/.test(PATCH), "sobrou comparação com '1234' no patch.js");
  assert.ok(!/Senha 1234 necessária/.test(PATCH), 'sobrou o rótulo "Senha 1234 necessária" no patch.js');
  assert.ok(!/senha:\s*true/.test(PATCH), 'sobrou a flag senha:true nas páginas do patch.js');
});

test('SEG-3: index.html sem senha fixa e sem fin_ok', () => {
  assert.ok(!/sessionStorage\.(getItem|setItem)\(\s*'fin_ok'/.test(INDEX), 'sobrou fin_ok no index.html');
  assert.ok(!/senha\s*(===|!==)\s*'1234'/.test(INDEX), "sobrou comparação com '1234' no index.html");
});

// ── 2. _permFinTem / podeAcessarFinanceiro (patch.js) ───────────────────────
test('SEG-3 patch: sem usuário nega tudo', () => {
  const w = carregarPatch(undefined);
  assert.equal(w._permFinTem('financeiro'), false);
  assert.equal(w.podeAcessarFinanceiro('orcamentos'), false);
  assert.equal(w.podeVerValoresFinanceiros(), false);
  assert.equal(w.temAlgumAcessoFinanceiro(), false);
});

test('SEG-3 patch: admin passa em tudo', () => {
  const w = carregarPatch(ADMIN);
  assert.equal(w._permFinTem('financeiro'), true);
  assert.equal(w.podeAcessarFinanceiro('orcamentos'), true);
  assert.equal(w.podeAcessarFinanceiro('comissoes'), true);
  assert.equal(w.podeAcessarFinanceiro('central-custos'), true);
  assert.equal(w.podeVerValoresFinanceiros(), true);
});

test("SEG-3 patch: permissão 'tudo' passa em tudo", () => {
  const w = carregarPatch(TUDO);
  assert.equal(w._permFinTem('qualquer'), true);
  assert.equal(w.podeAcessarFinanceiro('comissoes'), true);
  assert.equal(w.podeVerValoresFinanceiros(), true);
});

test('SEG-3 patch: comissoes só abre Comissões', () => {
  const w = carregarPatch(COM);
  assert.equal(w.podeAcessarFinanceiro('comissoes'), true);
  assert.equal(w.podeAcessarFinanceiro('orcamentos'), false);
  assert.equal(w.podeAcessarFinanceiro('central-custos'), false);
  assert.equal(w.podeVerValoresFinanceiros(), false, 'comissoes não dá acesso a valores');
  assert.equal(w.temAlgumAcessoFinanceiro(), true);
});

test('SEG-3 patch: orcamentos só abre Orçamentos', () => {
  const w = carregarPatch(ORC);
  assert.equal(w.podeAcessarFinanceiro('orcamentos'), true);
  assert.equal(w.podeAcessarFinanceiro('comissoes'), false);
  assert.equal(w.podeAcessarFinanceiro('central-custos'), false);
  assert.equal(w.temAlgumAcessoFinanceiro(), true);
});

test("SEG-3 patch: 'financeiro' abre a Central de Custos e dá acesso a valores", () => {
  const w = carregarPatch(FIN);
  assert.equal(w.podeAcessarFinanceiro('central-custos'), true);
  assert.equal(w.podeAcessarFinanceiro('centralcustos'), true);
  assert.equal(w.podeVerValoresFinanceiros(), true);
});

test("SEG-3 patch: 'dashboard' dá acesso a valores, mas não às páginas do Financeiro", () => {
  const w = carregarPatch(DASH);
  assert.equal(w.podeVerValoresFinanceiros(), true);
  assert.equal(w.podeAcessarFinanceiro('central-custos'), false);
  assert.equal(w.podeAcessarFinanceiro('comissoes'), false);
});

test('SEG-3 patch: usuário sem permissão de Financeiro não passa em nada', () => {
  const w = carregarPatch(NADA);
  assert.equal(w.temAlgumAcessoFinanceiro(), false);
  assert.equal(w.podeVerValoresFinanceiros(), false);
  assert.equal(w.podeAcessarFinanceiro('orcamentos'), false);
});

test('SEG-3 patch: página não financeira continua liberada', () => {
  const w = carregarPatch(NADA);
  assert.equal(w.podeAcessarFinanceiro('hub'), true);
  assert.equal(w.podeAcessarFinanceiro('ofmaq'), true);
  assert.equal(w._seg3PaginaPermitida('pcp'), true);
});

// ── 3. Cards da Central de Relatórios (_rrCardPermitido) ────────────────────
test('SEG-3 patch: cards da Central de Relatórios filtrados por permissão', () => {
  const wNada = carregarPatch(NADA);
  assert.equal(wNada._rrCardPermitido({ id: 'comissoes' }), false);
  assert.equal(wNada._rrCardPermitido({ id: 'custo-por-of' }), false);
  assert.equal(wNada._rrCardPermitido({ id: 'lucratividade-por-maquina' }), false);
  assert.equal(wNada._rrCardPermitido({ id: 'passagens' }), true, 'relatório comum continua visível');

  const wFin = carregarPatch(FIN);
  assert.equal(wFin._rrCardPermitido({ id: 'custo-por-of' }), true);
  assert.equal(wFin._rrCardPermitido({ id: 'lucratividade-por-maquina' }), true);
  assert.equal(wFin._rrCardPermitido({ id: 'comissoes' }), false, 'financeiro não inclui comissoes');

  const wCom = carregarPatch(COM);
  assert.equal(wCom._rrCardPermitido({ id: 'comissoes' }), true);

  const wAdmin = carregarPatch(ADMIN);
  assert.equal(wAdmin._rrCardPermitido({ id: 'comissoes' }), true);
  assert.equal(wAdmin._rrCardPermitido({ id: 'custo-por-of' }), true);
});

// ── 4. index.html: mesmas regras ────────────────────────────────────────────
test('SEG-3 index: mesmas regras de permissão do patch.js', () => {
  const fnsNada = carregarIndex(NADA);
  assert.equal(fnsNada.podeAcessarFinanceiro('orcamentos'), false);
  assert.equal(fnsNada.podeVerValoresFinanceiros(), false);
  assert.equal(fnsNada.temAlgumAcessoFinanceiro(), false);

  const fnsAdmin = carregarIndex(ADMIN);
  assert.equal(fnsAdmin.podeAcessarFinanceiro('comissoes'), true);
  assert.equal(fnsAdmin.podeAcessarFinanceiro('central-custos'), true);
  assert.equal(fnsAdmin.podeVerValoresFinanceiros(), true);

  const fnsCom = carregarIndex(COM);
  assert.equal(fnsCom.podeAcessarFinanceiro('comissoes'), true);
  assert.equal(fnsCom.podeAcessarFinanceiro('orcamentos'), false);

  const fnsSemUser = carregarIndex(undefined);
  assert.equal(fnsSemUser.podeAcessarFinanceiro('orcamentos'), false);
  assert.equal(fnsSemUser.podeVerValoresFinanceiros(), false);
});

test('SEG-3 index: permissões em string separada por vírgula caem como lixo seguro', () => {
  const fns = carregarIndex({ perfil: 'pcp', permissoes: ['dashboard,financeiro'] });
  assert.equal(fns.podeVerValoresFinanceiros(), false, 'não deve casar string com vírgula');
});

// ── 5. As telas de valores agora dependem da permissão ──────────────────────
test('SEG-3 patch: Histórico e Dashboard consultam podeVerValoresFinanceiros', () => {
  assert.ok(
    PATCH.includes('window.podeVerValoresFinanceiros()') ,
    'o patch.js deveria consultar podeVerValoresFinanceiros()'
  );
  assert.ok(
    /__dashPodeVerValores\s*=\s*function/.test(PATCH),
    'o Dashboard deveria expor __dashPodeVerValores'
  );
  assert.ok(
    !/window\.__dashDesbloquearValores[\s\S]{0,400}prompt\(/.test(PATCH),
    'o desbloqueio do Dashboard não pode mais pedir senha'
  );
});
