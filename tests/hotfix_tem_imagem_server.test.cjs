// [HOTFIX-EGRESS / HOTFIX-1] `tem_imagem` na lista de OFs SEM baixar o base64 de `imgs`.
// Duas unidades verificadas aqui, extraidas do fonte real de server.js:
//   1) _ofsIdsComImagemNoBanco(): lista paginada de ids com imagem, com cache de 5 min e fallback em erro;
//   2) o bloco de marcacao de `tem_imagem` dentro de GET /api/ofs.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// normaliza CRLF -> LF: o checkout Windows (core.autocrlf=true) grava CRLF e quebraria os
// indexOf por '\n' usados para extrair os trechos (falso negativo, nao erro de produto).
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8').replace(/\r\n/g, '\n');

// ---- 1) helper _ofsIdsComImagemNoBanco -------------------------------------
const iniHelper = src.indexOf('let _ofsIdsComImagemCache');
const fimHelper = src.indexOf('\n  return ids;\n}\n', iniHelper);
assert.ok(iniHelper > 0 && fimHelper > iniHelper, 'helper _ofsIdsComImagemNoBanco nao encontrado em server.js');
const blocoHelper = src.slice(iniHelper, fimHelper) + '\n  return ids;\n}\n';

function montarHelper(paginas) {
  const ctx = { consultas: 0 };
  let paginaAtual = 0; // avanca entre chamadas .range() (o helper consulta uma pagina por vez)
  const fake = {
    from() {
      ctx.consultas++;
      return {
        select: () => ({
          not: () => ({
            neq: () => ({
              order: () => ({
                range: async () => {
                  const d = paginas[paginaAtual++];
                  return d && d.erro ? { data: null, error: d.erro } : { data: d || [], error: null };
                },
              }),
            }),
          }),
        }),
      };
    },
  };
  const fabrica = new Function('supabase', 'console', blocoHelper + '\n return { f: _ofsIdsComImagemNoBanco, cache: function () { return _ofsIdsComImagemCache; } };');
  const api = fabrica(fake, { warn() {} });
  return { f: api.f, cache: api.cache, ctx };
}

test('lista paginada devolve os ids com imagem e para na pagina incompleta', async () => {
  const pagina1 = Array.from({ length: 1000 }, (_, i) => ({ id: 'p1-' + i }));
  const pagina2 = [{ id: 'x' }, { id: 'y' }];
  const m = montarHelper([pagina1, pagina2]);
  const ids = await m.f();
  assert.ok(ids instanceof Set);
  assert.strictEqual(ids.size, 1002);
  assert.ok(ids.has('x') && ids.has('y') && ids.has('p1-0'));
  assert.strictEqual(m.ctx.consultas, 2);
});

test('cache de 5 min: segunda chamada nao consulta o banco de novo', async () => {
  const m = montarHelper([[{ id: 'a' }]]);
  const ids1 = await m.f();
  const ids2 = await m.f();
  assert.strictEqual(ids1, ids2); // mesmo Set (veio do cache)
  assert.strictEqual(m.ctx.consultas, 1);
});

test('Tempo de cache do helper e 5 min', () => {
  assert.match(blocoHelper, /5 \* 60 \* 1000/);
});

test('erro no banco: devolve null, nao cacheia e nao lanca', async () => {
  const m = montarHelper([{ erro: new Error('falha simulada') }, [{ id: 'z' }]]);
  const r1 = await m.f();
  assert.strictEqual(r1, null);
  assert.strictEqual(m.cache().valor, null); // erro nunca vira cache
  const r2 = await m.f();
  assert.ok(r2 instanceof Set && r2.has('z'));
  assert.strictEqual(m.ctx.consultas, 2);
});

test('_clearOfsCaches zera o cache do helper', () => {
  const iniClear = src.indexOf('function _clearOfsCaches()');
  const blocoClear = src.slice(iniClear, src.indexOf('\n}', iniClear));
  assert.ok(blocoClear.includes('_ofsIdsComImagemCache'), 'invalida o cache ao limpar caches de OFs');
});

// ---- 2) marcacao de tem_imagem dentro de GET /api/ofs ----------------------
const iniRota = src.indexOf('// [HOTFIX-EGRESS / HOTFIX-1] ');
const fimRota = src.indexOf('const totalCount = count || rows.length;', iniRota);
assert.ok(iniRota > 0 && fimRota > iniRota, 'bloco tem_imagem da rota nao encontrado em server.js');
const blocoRota = src.slice(iniRota, fimRota);

function montarRota(rows, helper) {
  const fn = new Function('rows', '_ofsIdsComImagemNoBanco', 'console', 'return (async () => {\n' + blocoRota + '\nreturn rows; })();');
  return fn(rows, helper, { warn() {} });
}

test('com imagem_url responde true; so imgs no banco tambem true; sem nada false', async () => {
  const rows = [
    { id: '1', imagem_url: '/uploads/a.png' },
    { id: '2', imagem_url: null },
    { id: '3' },
  ];
  const out = await montarRota(rows, async () => new Set(['2']));
  assert.strictEqual(out[0].tem_imagem, true);
  assert.strictEqual(out[1].tem_imagem, true);
  assert.strictEqual(out[2].tem_imagem, false);
});

test('helper indisponivel (null): recai para imagem_url sem quebrar', async () => {
  const rows = [{ id: '1', imagem_url: '/uploads/a.png' }, { id: '2', imagem_url: null }];
  const out = await montarRota(rows, async () => null);
  assert.strictEqual(out[0].tem_imagem, true);
  assert.strictEqual(out[1].tem_imagem, false);
});

test('helper com excecao tambem recai para imagem_url', async () => {
  const rows = [{ id: '9', imagem_url: '/uploads/b.png' }, { id: '10' }];
  const out = await montarRota(rows, async () => { throw new Error('boom'); });
  assert.strictEqual(out[0].tem_imagem, true);
  assert.strictEqual(out[1].tem_imagem, false);
});

test('quando toda a lista tem imagem_url o helper nem e chamado', async () => {
  let chamou = 0;
  const rows = [{ id: '1', imagem_url: '/uploads/a.png' }, { id: '2', imagem_url: '/uploads/b.png' }];
  const out = await montarRota(rows, async () => { chamou++; return new Set(); });
  assert.strictEqual(chamou, 0);
  assert.deepStrictEqual(out.map((r) => r.tem_imagem), [true, true]);
});

test('a lista de OFs nao pede a coluna imgs ao Supabase', () => {
  const iniSel = src.indexOf('const OFS_SELECT_SLIM = [');
  const fimSel = src.indexOf("].join(',')", iniSel);
  assert.ok(iniSel > 0 && fimSel > iniSel, 'OFS_SELECT_SLIM nao encontrado');
  const blocoSel = src.slice(iniSel, fimSel);
  assert.ok(!/'imgs'/.test(blocoSel), 'OFS_SELECT_SLIM nao pode trazer imgs');
  assert.ok(/'imagem_url'/.test(blocoSel), 'imagem_url continua na lista (OFs com imagem por URL)');
});
