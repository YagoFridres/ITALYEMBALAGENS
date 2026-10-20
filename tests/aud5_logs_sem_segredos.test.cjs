'use strict';
/**
 * AUD-5: o servidor não pode registrar trechos de chaves de API nem de hash de senha.
 * Sobe o server.js com chaves FICTÍCIAS e verifica que nenhum trecho delas aparece no log.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const FAKE_OPENAI = 'sk-test-FAKEOPENAI-1234567890abcdef';
const FAKE_ANTHROPIC = 'sk-ant-FAKEANTHROPIC-1234567890abcdef';

test('boot não imprime trecho das chaves de IA', async () => {
  const env = Object.assign({}, process.env, {
    PORT: '3987', SUPABASE_URL: 'http://127.0.0.1:9', SUPABASE_SERVICE_ROLE_KEY: 'fake-service-key',
    JWT_SECRET: 'jwt-fake-0123456789abcdef0123456789abcdef', OPENAI_API_KEY: FAKE_OPENAI, ANTHROPIC_API_KEY: FAKE_ANTHROPIC,
  });
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  await new Promise((r) => setTimeout(r, 7000));
  child.kill('SIGKILL');
  assert.ok(/IA DIAGNOSTICO/.test(out), 'linha de diagnóstico de IA não apareceu');
  assert.ok(/configurada/.test(out));
  for (const k of [FAKE_OPENAI, FAKE_ANTHROPIC]) {
    assert.equal(out.includes(k.slice(0, 10)), false, 'vazou prefixo de chave: ' + k.slice(0, 4) + '…');
    assert.equal(out.includes(k.slice(-8)), false, 'vazou sufixo de chave');
  }
});

test('código não registra trecho de hash nem e-mail no log de sucesso/senha do login', () => {
  const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
  assert.equal(/hashInicio/.test(src), false);
  assert.equal(/primeiros 10 chars/.test(src), false);
  assert.equal(/\[LOGIN\]',\s*String\(usuario\?\.email/.test(src), false);
});
