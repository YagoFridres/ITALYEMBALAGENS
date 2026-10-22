// [HOTFIX-6 / D7] Preparacao (NAO EXECUTAR) da migracao das imagens para o Storage.
// Este teste NAO toca a rede e NAO grava nada: os casos de execucao morrem nos guardas do script,
// antes de qualquer chamada ao Supabase. Verifica:
//   1) modo padrao = --simular (somente leitura);
//   2) --aplicar exige --confirmar-producao E SUPABASE_ALLOW_WRITE=1;
//   3) credenciais ausentes barram a execucao;
//   4) o script so move base64 -> Storage (upload + update), sem operacao destrutiva;
//   5) a migracao D7 cria bucket PRIVADO, idempotente e marcado como NAO EXECUTAR.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const SCRIPT = path.join(RAIZ, 'scripts', 'migrar_imagens_storage.cjs');
const MIGRACAO = path.join(RAIZ, 'migrations', 'pendentes', 'D7_imagens_para_storage.sql');

// CRLF -> LF: o checkout Windows grava CRLF e quebraria os indexOf/regex por '\n'.
const fonteScript = fs.readFileSync(SCRIPT, 'utf8').replace(/\r\n/g, '\n');
const fonteMigracao = fs.readFileSync(MIGRACAO, 'utf8').replace(/\r\n/g, '\n');

// Ambiente limpo: nunca herda credenciais reais (o teste nao pode falar com o banco de verdade).
function ambienteLimpo(extra) {
  return Object.assign({}, process.env, {
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    SUPABASE_KEY: '',
    SUPABASE_ALLOW_WRITE: '',
  }, extra || {});
}

function rodar(args, env) {
  const r = spawnSync(process.execPath, [SCRIPT].concat(args || []), {
    cwd: RAIZ,
    env: ambienteLimpo(env),
    encoding: 'utf8',
  });
  return { status: r.status, saida: String(r.stdout || '') + String(r.stderr || '') };
}

// ---- 1) modo padrao = simular (somente leitura) -----------------------------
test('fonte: modo padrao e simular (SIMULAR = !tem("--aplicar"))', () => {
  assert.ok(/const SIMULAR = !tem\('--aplicar'\);/.test(fonteScript), 'modo padrao deve ser simular');
  assert.ok(/const SOMAR_BYTES = tem\('--bytes'\);/.test(fonteScript), '--bytes e opcional no simular');
});

test('sem argumentos e sem credenciais: recusa pedindo SUPABASE_URL (prova que nao exige --aplicar)', () => {
  const r = rodar([], {});
  assert.strictEqual(r.status, 1);
  assert.match(r.saida, /Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(r.saida, /confirmar-producao/, 'o modo padrao nao deve exigir --confirmar-producao');
});

// ---- 2) --aplicar exige --confirmar-producao E SUPABASE_ALLOW_WRITE=1 --------
test('--aplicar sem --confirmar-producao: recusa e sai antes de tocar o banco', () => {
  const r = rodar(['--aplicar'], {});
  assert.strictEqual(r.status, 1);
  assert.match(r.saida, /--aplicar exige --confirmar-producao/);
});

test('--aplicar --confirmar-producao sem SUPABASE_ALLOW_WRITE=1: recusa', () => {
  const r = rodar(['--aplicar', '--confirmar-producao'], {});
  assert.strictEqual(r.status, 1);
  assert.match(r.saida, /--aplicar exige SUPABASE_ALLOW_WRITE=1/);
});

test('--aplicar com os dois guardas e sem credenciais: para em definitivo (nao executou)', () => {
  const r = rodar(['--aplicar', '--confirmar-producao'], { SUPABASE_ALLOW_WRITE: '1' });
  assert.strictEqual(r.status, 1);
  assert.match(r.saida, /Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/);
});

test('fonte: os guardas de escrita precedem a criacao do client do Supabase', () => {
  const iGuarda = fonteScript.indexOf("if (!SIMULAR) {");
  const iCliente = fonteScript.indexOf('createClient(URL_SB');
  assert.ok(iGuarda > 0 && iCliente > iGuarda, 'os guardas de --aplicar devem vir antes de createClient');
});

// ---- 3) o script so move base64 -> Storage, sem operacao destrutiva ----------
test('fonte: usa o bucket ofs-imagens e faz upload sem sobrescrever (upsert: false)', () => {
  assert.match(fonteScript, /const BUCKET = 'ofs-imagens';/);
  assert.match(fonteScript, /storage\.from\(BUCKET\)\.upload\(/);
  assert.match(fonteScript, /upsert: false/);
});

test('fonte: grava o caminho em imagem_url e esvazia imgs (nao apaga a OF)', () => {
  assert.match(fonteScript, /\.update\(\{ imagem_url: caminhos\[0\], imgs: \[\] \}\)/);
  assert.doesNotMatch(fonteScript, /\.delete\(/, 'nao pode haver operacao destrutiva no script');
  assert.doesNotMatch(fonteScript, /\.remove\(/, 'nao pode apagar objetos do Storage');
});

test('fonte: --aplicar exige --limite N como lote (suporta lote pequeno)', () => {
  assert.match(fonteScript, /const LIMITE = Number\(valorDe\('--limite'\) \|\| 0\) \|\| 0;/);
  assert.match(fonteScript, /if \(LIMITE && processadas >= LIMITE\) break;/);
});

test('fonte: avisa que a leitura exige URL assinada (bucket privado) antes de aplicar', () => {
  assert.match(fonteScript, /createSignedUrl/);
  assert.match(fonteScript, /NAO EXECUTAR EM PRODUCAO/);
});

// ---- 4) migracao D7: bucket privado, idempotente e NAO EXECUTAR --------------
test('D7: marcada como NAO EXECUTAR', () => {
  assert.match(fonteMigracao, /NAO EXECUTAR/);
});

test('D7: cria o bucket ofs-imagens como PRIVADO (public = false)', () => {
  assert.match(fonteMigracao, /insert into storage\.buckets \(id, name, public, file_size_limit, allowed_mime_types\)/);
  assert.match(fonteMigracao, /'ofs-imagens',\s*\n\s*false,/);
  assert.match(fonteMigracao, /on conflict \(id\) do nothing;/);
  assert.match(fonteMigracao, /allowed_mime_types/);
});

test('D7: comenta que o acesso e so pelo servidor (SERVICE_ROLE_KEY), sem politica para anon', () => {
  assert.match(fonteMigracao, /SERVICE_ROLE_KEY/);
  assert.match(fonteMigracao, /createSignedUrl/);
});
