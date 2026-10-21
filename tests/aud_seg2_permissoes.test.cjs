'use strict';
// SEG-2 · Autorização por usuário nas APIs (comissões, financeiro, relatórios,
// dashboard, orçamentos) e mascaramento de valores da OF.
//
// O bloco SEG-2 (core) e o bloco de guardas de rota são extraídos do server.js e
// executados num contexto `vm` com um `supabase` falso e um `app` falso. Nada
// sobe o servidor e nada toca o banco real. A justificativa: provar o
// comportamento real (perfil/permissões vêm do BANCO, nunca das claims) e o
// mapeamento rota → permissão do bloco de guardas.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const REPO = path.join(__dirname, '..');
const SERVER_SRC = fs.readFileSync(path.join(REPO, 'server.js'), 'utf8');

function extrairTrecho(src, inicio, fim) {
  const i = src.indexOf(inicio);
  assert.ok(i >= 0, 'não achei o início: ' + inicio);
  const j = src.indexOf(fim, i + inicio.length);
  assert.ok(j > i, 'não achei o fim: ' + fim);
  return src.slice(i, j);
}

const CORE = extrairTrecho(SERVER_SRC, '// ── SEG-2 · core · início', '// ── SEG-2 · core · fim');
const GUARD = extrairTrecho(SERVER_SRC, '// ── SEG-2 · guardas de rota · início', '// ── SEG-2 · guardas de rota · fim');

// `_permGuard` é trocado por um espião antes do bloco de guardas, para registrar
// (rota → permissões exigidas). `requirePerm` permanece o de verdade.
const SCRIPT = [
  CORE,
  'globalThis.__mounts = [];',
  'globalThis.app = { use: function (p, mw) { globalThis.__mounts.push([p, mw]); } };',
  '_permGuard = function () { return { __perms: Array.prototype.slice.call(arguments) }; };',
  GUARD,
  'globalThis.__r = {'
    + ' requirePerm: requirePerm, _toPermArray: _toPermArray, _getUserPerms: _getUserPerms,'
    + ' _mascararValoresOf: _mascararValoresOf, _podeVerValoresOf: _podeVerValoresOf,'
    + ' _responderOfs: _responderOfs, cache: _permCache };',
].join('\n');

function fakeSupabase(mapa) {
  const st = { calls: 0, atraso: 0 };
  const api = {
    from() {
      const chain = {
        _id: null,
        select() { return chain; },
        eq(_col, val) { chain._id = val; return chain; },
        maybeSingle() {
          st.calls++;
          const concluir = () => {
            if (mapa.__erro) return { data: null, error: { message: 'db fora do ar' } };
            const row = mapa[chain._id];
            return { data: row === undefined ? null : row, error: null };
          };
          if (st.atraso > 0) return new Promise((res) => setTimeout(() => res(concluir()), st.atraso));
          return Promise.resolve(concluir());
        },
      };
      return chain;
    },
  };
  return { api, st };
}

function montar(mapa) {
  const fake = fakeSupabase(mapa || {});
  const ctx = vm.createContext({
    console: { log: () => {}, warn: () => {}, error: () => {} },
  });
  vm.runInContext(SCRIPT, ctx);
  ctx.supabase = fake.api;
  return { ctx, st: fake.st, r: ctx.__r, mounts: ctx.__mounts };
}

function fakeRes() {
  return {
    codigo: null,
    corpo: null,
    status(c) { this.codigo = c; return this; },
    json(b) { this.corpo = b; return this; },
  };
}

async function chamar(mw, usuario, method) {
  const res = fakeRes();
  let passou = 0;
  await mw({ usuario, method: method || 'GET' }, res, () => { passou++; });
  return { res, passou };
}

// ── _toPermArray ────────────────────────────────────────────────────────────
test('SEG-2: _toPermArray aceita array, string JSON e rejeita lixo', () => {
  const { r } = montar();
  assert.deepEqual(Array.from(r._toPermArray(['tudo', ' comissoes ', '', null])), ['tudo', 'comissoes']);
  assert.deepEqual(Array.from(r._toPermArray('["relatorios","dashboard"]')), ['relatorios', 'dashboard']);
  assert.deepEqual(Array.from(r._toPermArray('{ nao: json }')), []);
  assert.deepEqual(Array.from(r._toPermArray(null)), []);
  assert.deepEqual(Array.from(r._toPermArray({ tudo: true })), []);
});

// ── requirePerm: perfis ─────────────────────────────────────────────────────
test('SEG-2: admin passa sempre', async () => {
  const { r } = montar({ u1: { perfil: 'admin', permissoes: [] } });
  const { res, passou } = await chamar(r.requirePerm('comissoes'), { id: 'u1' });
  assert.equal(passou, 1);
  assert.equal(res.codigo, null);
});

test('SEG-2: permissão "tudo" passa sempre', async () => {
  const { r } = montar({ u1: { perfil: 'custom', permissoes: ['tudo'] } });
  const { passou } = await chamar(r.requirePerm('financeiro'), { id: 'u1' });
  assert.equal(passou, 1);
});

test('SEG-2: custom com a permissão exigida passa', async () => {
  const { r } = montar({ u1: { perfil: 'custom', permissoes: ['comissoes', 'pcp'] } });
  const { passou } = await chamar(r.requirePerm('comissoes'), { id: 'u1' });
  assert.equal(passou, 1);
});

test('SEG-2: custom sem a permissão recebe 403', async () => {
  const { r } = montar({ u1: { perfil: 'custom', permissoes: ['pcp'] } });
  const { res, passou } = await chamar(r.requirePerm('comissoes'), { id: 'u1' });
  assert.equal(passou, 0);
  assert.equal(res.codigo, 403);
  assert.equal(res.corpo.error, 'sem_permissao');
});

test('SEG-2: /api/relatorios/producao NÃO aceita "pcp" como alternativa', async () => {
  const { r } = montar({ u1: { perfil: 'custom', permissoes: ['pcp'] } });
  const { res, passou } = await chamar(r.requirePerm('relatorios'), { id: 'u1' });
  assert.equal(passou, 0);
  assert.equal(res.codigo, 403);
});

// ── requirePerm: falhas ─────────────────────────────────────────────────────
test('SEG-2: usuário inexistente → 401 (nunca as claims)', async () => {
  const { r } = montar({});
  const { res, passou } = await chamar(r.requirePerm('comissoes'), { id: 'fantasma' });
  assert.equal(passou, 0);
  assert.equal(res.codigo, 401);
  assert.equal(res.corpo.error, 'usuario_inexistente');
});

test('SEG-2: erro de banco → 503 (não libera por claim)', async () => {
  const { r } = montar({ __erro: true });
  const { res, passou } = await chamar(r.requirePerm('comissoes'), { id: 'u1' });
  assert.equal(passou, 0);
  assert.equal(res.codigo, 503);
  assert.equal(res.corpo.error, 'erro_permissoes');
});

test('SEG-2: token diz "admin", mas o banco diz custom sem permissão → 403', async () => {
  const { r } = montar({ u1: { perfil: 'custom', permissoes: [] } });
  const claimsAdmin = { id: 'u1', perfil: 'admin', permissoes: ['tudo'] };
  const { res, passou } = await chamar(r.requirePerm('comissoes'), claimsAdmin);
  assert.equal(passou, 0, 'as claims NÃO podem liberar acesso');
  assert.equal(res.codigo, 403);
});

// ── cache ───────────────────────────────────────────────────────────────────
test('SEG-2: duas checagens seguidas do mesmo usuário → 1 consulta ao banco', async () => {
  const { r, st } = montar({ u1: { perfil: 'custom', permissoes: ['comissoes'] } });
  await chamar(r.requirePerm('comissoes'), { id: 'u1' });
  await chamar(r.requirePerm('comissoes'), { id: 'u1' });
  assert.equal(st.calls, 1, 'o cache de 60s deveria evitar a 2ª consulta');
});

test('SEG-2: checagens concorrentes do mesmo usuário → 1 consulta (single-flight)', async () => {
  const { ctx, st, r } = montar({ u1: { perfil: 'custom', permissoes: ['comissoes'] } });
  st.atraso = 20;
  const p1 = ctx.__r._getUserPerms({ id: 'u1' });
  const p2 = ctx.__r._getUserPerms({ id: 'u1' });
  const [a, b] = await Promise.all([p1, p2]);
  assert.equal(st.calls, 1, 'não pode haver consulta duplicada em paralelo');
  assert.deepEqual(a, b);
  assert.equal(r.cache.has('u1'), true);
});

// ── mascaramento de valores da OF ───────────────────────────────────────────
test('SEG-2: _mascararValoresOf remove vl_unit/vl_total/valor_total em qualquer nível', () => {
  const { r } = montar();
  const entrada = {
    ok: true,
    total: 300,
    data: [{
      numero: 4042,
      valor_total: 100,
      vl_total: 100,
      vl_unit: 5,
      itens: [{ valor_total: 50, vl_unit: 2.5, qtd: 20 }],
    }],
  };
  const saida = r._mascararValoresOf(entrada);
  assert.equal(saida.data[0].numero, 4042);
  assert.equal('valor_total' in saida.data[0], false);
  assert.equal('vl_total' in saida.data[0], false);
  assert.equal('vl_unit' in saida.data[0], false);
  assert.equal('valor_total' in saida.data[0].itens[0], false);
  assert.equal('vl_unit' in saida.data[0].itens[0], false);
  assert.equal(saida.data[0].itens[0].qtd, 20);
  assert.equal(saida.total, 300, 'campos fora da lista ficam intactos');
  // o objeto original não é alterado (o cache compartilhado não pode ser corrompido)
  assert.equal(entrada.data[0].valor_total, 100);
});

test('SEG-2: _podeVerValoresOf (admin, dashboard, financeiro e negação)', async () => {
  const admin = montar({ u1: { perfil: 'admin', permissoes: [] } });
  assert.equal(await admin.r._podeVerValoresOf({ usuario: { id: 'u1' } }), true);

  const fin = montar({ u2: { perfil: 'custom', permissoes: ['financeiro'] } });
  assert.equal(await fin.r._podeVerValoresOf({ usuario: { id: 'u2' } }), true);

  const dash = montar({ u3: { perfil: 'custom', permissoes: ['dashboard'] } });
  assert.equal(await dash.r._podeVerValoresOf({ usuario: { id: 'u3' } }), true);

  const nenhum = montar({ u4: { perfil: 'custom', permissoes: ['pcp'] } });
  assert.equal(await nenhum.r._podeVerValoresOf({ usuario: { id: 'u4' } }), false);

  const inexistente = montar({});
  assert.equal(await inexistente.r._podeVerValoresOf({ usuario: { id: 'x' } }), false);
});

test('SEG-2: _responderOfs mascara para quem não tem dashboard/financeiro', async () => {
  const custom = montar({ u1: { perfil: 'custom', permissoes: ['pcp'] } });
  const res1 = fakeRes();
  await custom.r._responderOfs(res1, { ok: true, data: [{ valor_total: 9, numero: 1 }] }, { usuario: { id: 'u1' } });
  assert.equal('valor_total' in res1.corpo.data[0], false);

  const admin = montar({ u2: { perfil: 'admin', permissoes: [] } });
  const res2 = fakeRes();
  await admin.r._responderOfs(res2, { ok: true, data: [{ valor_total: 9, numero: 1 }] }, { usuario: { id: 'u2' } });
  assert.equal(res2.corpo.data[0].valor_total, 9);
});

// ── guardas de rota ─────────────────────────────────────────────────────────
test('SEG-2: bloco de guardas mapeia cada grupo de rota para a permissão da tabela', () => {
  const { mounts } = montar({});
  const mapa = new Map(mounts.map(([p, mw]) => [p, mw.__perms.join(',')]));

  const esperado = {
    '/api/comissoes': 'comissoes',
    '/api/central-custos': 'financeiro',
    '/api/centros-custo': 'financeiro',
    '/api/relatorios/custos': 'financeiro',
    '/api/relatorios/lucratividade-por-maquina': 'financeiro',
    '/api/relatorios/vendas-por-empresa': 'relatorios',
    '/api/relatorios/comparativo-mensal': 'relatorios',
    '/api/relatorios/evolucao-vendas': 'relatorios',
    '/api/relatorios/vendas-por-ramo': 'relatorios',
    '/api/relatorios/vendas-por-cidade-estado': 'relatorios',
    '/api/relatorios/controle-vendas-vendedor': 'relatorios',
    '/api/relatorios/clientes-mais-compraram': 'relatorios',
    '/api/relatorios/projecao-vendas': 'relatorios',
    '/api/relatorios/resumo-anual': 'relatorios',
    '/api/relatorios/ofs-entradas-mes': 'relatorios',
    '/api/relatorios/cliente-ficha': 'relatorios',
    '/api/relatorio': 'relatorios',
    '/api/relatorios/producao': 'relatorios',
    '/api/relatorios/aparras': 'relatorios',
    '/api/dashboard/total-geral': 'dashboard',
    '/api/dashboard/faturamento-mensal': 'dashboard',
    '/api/dashboard/faturamento-manual': 'dashboard',
    '/api/orcamentos': 'orcamentos',
    '/api/orcamentos_pastas': 'orcamentos',
  };

  for (const [rota, perm] of Object.entries(esperado)) {
    assert.equal(mapa.get(rota), perm, 'rota ' + rota + ' deveria exigir ' + perm);
  }
  assert.equal(mounts.length, Object.keys(esperado).length, 'não pode haver guarda a mais nem a menos');

  const rotas = mounts.map(([p]) => p);
  assert.equal(new Set(rotas).size, rotas.length, 'não pode haver rota duplicada');
});

test('SEG-2: produção/aparras exigem SOMENTE relatorios (nunca pcp)', () => {
  const { mounts } = montar({});
  const mapa = new Map(mounts.map(([p, mw]) => [p, mw.__perms.join(',')]));
  assert.equal(mapa.get('/api/relatorios/producao'), 'relatorios');
  assert.equal(mapa.get('/api/relatorios/aparras'), 'relatorios');
  assert.ok(!/pcp/.test(mapa.get('/api/relatorios/producao')));
  assert.ok(!/pcp/.test(mapa.get('/api/relatorios/aparras')));
});
