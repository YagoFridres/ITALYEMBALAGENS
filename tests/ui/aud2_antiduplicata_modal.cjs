'use strict';
// AUD-2 · teste REAL de navegador do modal de confirmação de duplicata (OF Rápida).
//
// Isolado: sobe um servidor HTTP local que serve um fixture + o `patch.js` REAL.
// Nada de produção, nada de banco. O 409 e o "criar mesmo assim" são simulados
// com dados fictícios, exercitando o hook real `__patch_numero_apos_salvar__`.
//
// Requer um Chrome/Edge instalado (puppeteer-core, sem baixar navegador).
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const PATCH_JS_PATH = path.join(ROOT, 'patch.js');

function acharNavegador() {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  for (const c of candidatos) { try { if (fs.existsSync(c)) return c; } catch (_) {} }
  return null;
}

let puppeteerCore = null;
try { puppeteerCore = require('puppeteer-core'); } catch (_) { puppeteerCore = null; }

const FIXTURE = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>AUD-2 fixture</title></head><body>
<button id="btn-salvar-of-rapida">Salvar OF</button>
<pre id="__of_rapida_payload_temp__" hidden></pre>
<script>
  // Igual ao ERP real: a base de salvarOfRapida existe ANTES do patch.js.
  window.salvarOfRapida = async function () { return { ok: true }; };
  window.toast = function () {};
</script>
<script src="/patch.js"></script>
</body></html>`;

function subirServidor() {
  const patch = fs.readFileSync(PATCH_JS_PATH, 'utf8');
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      if (req.url === '/patch.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end(patch);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(FIXTURE);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, porta: srv.address().port }));
  });
}

const ID_HOOK = '__patch_numero_apos_salvar__';

test('AUD-2 · modal 409: Confirmar reenvia, Cancelar não reenvia (navegador real)', async (t) => {
  const nav = acharNavegador();
  if (!puppeteerCore || !nav) {
    t.skip('puppeteer-core ou Chrome/Edge ausente — teste de navegador não executado');
    return;
  }

  const { srv, porta } = await subirServidor();
  const browser = await puppeteerCore.launch({
    executablePath: nav,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:' + porta + '/', { waitUntil: 'load', timeout: 30000 });

    // O hook real tem de estar registrado pelo patch.js.
    await page.waitForFunction(
      (id) => typeof window._salvarOfRapidaRegisterHook === 'function'
        && Array.isArray(window.__salvarOfRapida_hooks__)
        && window.__salvarOfRapida_hooks__.some((h) => h && h.id === id),
      { timeout: 30000 },
      ID_HOOK
    );

    // Prepara o cenário: base devolve 409 no primeiro disparo e ok depois;
    // registra quantas vezes o "criar mesmo assim" foi acionado.
    async function prepararCenario(confirmar) {
      return await page.evaluate((conf) => {
        window.__aud2 = { confirmCalls: 0, reenvios: 0, ultimaMsg: '' };
        let primeira = true;
        window.__salvarOfRapida_BASE__ = async function () {
          if (primeira) {
            primeira = false;
            return {
              ok: false, duplicata: true, _httpStatus: 409,
              mensagem: 'Já existe OF com o mesmo cliente, produto e quantidade.',
              ofs_duplicadas: [{ numero: '4999', created_at: '2026-10-19T16:00:00Z', qtd: 10 }],
            };
          }
          return { ok: true, numero_final: '5000', numero_solicitado: '5000' };
        };
        window.__OF_RAPIDA_SALVAR_DE_NOVO__ = function () {
          window.__aud2.reenvios += 1;
          window.__aud2.forcouNoReenvio = (window.__OF_RAPIDA_FORCAR_DUPLICATA === true);
        };
        window.confirm = function (msg) { window.__aud2.confirmCalls += 1; window.__aud2.ultimaMsg = String(msg || ''); return !!conf; };
        window.__OF_RAPIDA_FORCAR_DUPLICATA = false;
        return true;
      }, confirmar);
    }

    // ── Cenário 1: usuário CANCELA o modal → não cria
    await prepararCenario(false);
    await page.evaluate(async () => { await window.salvarOfRapida(); });
    const cancelar = await page.evaluate(() => ({
      confirm: window.__aud2.confirmCalls,
      reenvios: window.__aud2.reenvios,
      forcou: window.__OF_RAPIDA_FORCAR_DUPLICATA,
      msg: window.__aud2.ultimaMsg,
    }));
    assert.equal(cancelar.confirm, 1, 'o modal (window.confirm) deve aparecer 1 vez');
    assert.equal(cancelar.reenvios, 0, 'com Cancelar NÃO pode reenviar/criar');
    assert.equal(cancelar.forcou, false, 'com Cancelar não pode marcar FORCAR_DUPLICATA');
    assert.ok(/semelhante|duplicada|mesmo cliente/i.test(cancelar.msg), 'a mensagem do modal deve avisar sobre duplicata');

    // ── Cenário 2: usuário CONFIRMA o modal → reenvia (cria)
    await prepararCenario(true);
    await page.evaluate(async () => { await window.salvarOfRapida(); });
    const confirmar = await page.evaluate(() => ({
      confirm: window.__aud2.confirmCalls,
      reenvios: window.__aud2.reenvios,
      forcouNoReenvio: window.__aud2.forcouNoReenvio === true,
    }));
    assert.equal(confirmar.confirm, 1, 'o modal deve aparecer 1 vez');
    assert.equal(confirmar.reenvios, 1, 'com Confirmar DEVE reenviar/criar');
    assert.equal(confirmar.forcouNoReenvio, true, 'no reenvio o flag FORCAR_DUPLICATA deve estar ligado');
    // após o reenvio dar certo, o flag é zerado (comportamento correto do patch.js)
    const flagFinal = await page.evaluate(() => window.__OF_RAPIDA_FORCAR_DUPLICATA === true);
    assert.equal(flagFinal, false, 'após criar, o flag FORCAR_DUPLICATA deve voltar a false');
  } finally {
    await browser.close();
    srv.close();
  }
});
