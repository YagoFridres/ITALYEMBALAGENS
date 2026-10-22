// [HOTFIX-EGRESS / HOTFIX-3] Menos recargas da lista completa de OFs.
// 1) O total "todas as OFs" agora é somado no SERVIDOR (/api/dashboard/resumo-ofs →
//    total_valor_todas_ofs) em vez de o front reler a lista inteira.
// 2) O polling de OFs novas respeita o intervalo mínimo de 60 s e para com a aba oculta.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8').replace(/\r\n/g, '\n');
const patch = fs.readFileSync(path.join(__dirname, '..', 'patch.js'), 'utf8').replace(/\r\n/g, '\n');

// ---- 1) soma no servidor dentro de /api/dashboard/resumo-ofs ------------------

test('resumo-ofs seleciona a coluna `total` além de valor_total/valor_venda', () => {
  assert.ok(
    server.includes(".select('id,numero,of,status,deleted_at,empresa_id,emp_id,data_entrega,ent,dia,created_at,valor_total,valor_venda,total,urgente,urg,data_conclusao,data_faturamento,passagens_maquina')"),
    'o select do resumo-ofs precisa incluir `total` para a soma ficar idêntica à do card'
  );
});

test('resumo-ofs devolve total_valor_todas_ofs no JSON', () => {
  assert.ok(server.includes('total_valor_todas_ofs: Number(totalValorTodasOfs) || 0'), 'campo ausente na resposta');
});

const iniSoma = server.indexOf('let totalValorTodasOfs = 0;');
assert.ok(iniSoma > 0, 'bloco de soma do total nao encontrado em server.js');
const fimSoma = server.indexOf('\n    });', iniSoma) + '\n    });'.length;
const blocoSoma = server.slice(iniSoma, fimSoma);

function somar(rows) {
  return new Function('rows', blocoSoma + '\n return totalValorTodasOfs;')(rows);
}

test('soma usa a mesma regra do card: valor_total -> valor_venda -> total', () => {
  assert.strictEqual(somar([{ valor_total: 10 }, { valor_total: 5 }]), 15);
  assert.strictEqual(somar([{ valor_total: 0, valor_venda: 8 }]), 8);      // valor_total 0 cai para valor_venda
  assert.strictEqual(somar([{ valor_total: null, valor_venda: null, total: 3 }]), 3);
  assert.strictEqual(somar([{}]), 0);
  assert.strictEqual(somar([]), 0);
});

test('resumo-ofs lê todas as páginas de OFs não excluídas (sem trafegar imgs)', () => {
  assert.ok(/\.from\('ofs'\)[\s\S]{0,400}\.is\('deleted_at', null\)/.test(server), 'resumo-ofs deve excluir OFs deletadas');
  const blocoResumo = server.slice(server.indexOf("app.get('/api/dashboard/resumo-ofs'"), server.indexOf("app.post('/api/dashboard/faturamento-manual'"));
  assert.ok(!blocoResumo.includes('imagem_url') && !/['",]imgs['",]/.test(blocoResumo), 'resumo-ofs nao pode trazer colunas de imagem');
});

// ---- 2) polling de OFs novas ------------------------------------------------

test('polling de OFs novas usa intervalo >= 60 s', () => {
  const m = patch.match(/setInterval\(function\(\)\{ try \{ if \(document\.visibilityState === 'hidden'\) return; \} catch\(_\)\{\} _verificarOFsNovas\(\); \}, (\d+)\);/);
  assert.ok(m, 'setInterval do polling de OFs novas nao encontrado');
  assert.ok(Number(m[1]) >= 60000, 'intervalo do polling deve ser no minimo 60000 ms; encontrado ' + m[1]);
});

test('polling de OFs novas para quando a aba não está visível', () => {
  const idx = patch.indexOf('_verificarOFsNovas(); }, ');
  assert.ok(idx > 0, 'intervalo do polling nao encontrado');
  const trecho = patch.slice(idx - 220, idx);
  assert.ok(trecho.includes("document.visibilityState === 'hidden'"), 'falta o guard de visibilityState');
});
