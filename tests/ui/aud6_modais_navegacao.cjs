// AUD-6 · teste real de navegador (Chromium + API simulada, dados fictícios).
// Navega pelo menu e confere que os modais FIXOS continuam inteiros e abrem;
// modais dinâmicos "vazados" continuam sendo removidos na navegação.
// Uso: node tests/ui/aud6_modais_navegacao.cjs <pasta-do-repo>
'use strict';
const path = require('path'); const fs = require('fs'); const http = require('http');
const { chromium } = require('playwright');
const ROOT = path.resolve(process.argv[2] || '.');
const USER = { id: 'u-teste', nome: 'Teste', role: 'admin', perfil: 'admin', is_admin: true, admin: true, emp_id: 'E1' };
function stub(p, m) {
  if (p === '/api/auth/me') return { ok: true, user: USER, ...USER };
  if (p === '/api/fornecedores') return { ok: true, data: [{ id: 'f1', nome: 'FORNECEDOR FICTICIO', tipo: 'Papelão' }] };
  if (m !== 'GET') return null;
  return { ok: true, data: [] };
}
(async () => {
  const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const f = u.pathname === '/' ? '/index.html' : u.pathname; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.statusCode = 404; return res.end(''); } res.setHeader('Content-Type', f.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8'); fs.createReadStream(fp).pipe(res); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
  const browser = await chromium.launch({ executablePath: exe });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'block' });
  const escritas = [];
  await ctx.route('**/api/**', (route) => { const r = route.request(); const body = stub(new URL(r.url()).pathname, r.method()); if (!body) { escritas.push(r.method() + ' ' + new URL(r.url()).pathname); return route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' }); } return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }); });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await ctx.addInitScript(() => { try { localStorage.setItem('token', 't'); localStorage.setItem('access_token', 't'); localStorage.setItem('device_pref', 'desktop'); } catch (_) {} });
  const page = await ctx.newPage();
  await page.goto(base + '/'); await page.waitForTimeout(3000);
  if (await page.locator('#device-screen.show').count()) await page.locator('#device-screen [onclick*="desktop"]').first().click();
  await page.waitForTimeout(7000);
  const antes = await page.evaluate(() => [...document.querySelectorAll('.modal-overlay[id]')].filter((o) => o.childElementCount === 0).length);
  // um modal dinâmico "vazado" (deve sumir na navegação)
  await page.evaluate(() => { const d = document.createElement('div'); d.className = 'modal'; d.id = 'teste-modal-vazado'; document.body.appendChild(d); });
  // navegação real pelo menu: Clientes → Fornecedores → Hub → Fornecedores
  const clicar = async (nome) => { await page.evaluate((n) => { const el = [...document.querySelectorAll('.sidebar [onclick], #sidebar [onclick]')].find((e) => (e.textContent || '').replace(/[^\wÀ-ú ]/g, '').trim() === n); if (el) el.click(); }, nome); await page.waitForTimeout(2500); };
  await clicar('Clientes'); await clicar('Fornecedores'); await clicar('Hub Inicial'); await clicar('Fornecedores');
  const depois = await page.evaluate(() => ({ vazios: [...document.querySelectorAll('.modal-overlay[id]')].filter((o) => o.childElementCount === 0).map((o) => o.id), vazado: !!document.getElementById('teste-modal-vazado'), abertos: [...document.querySelectorAll('.modal-overlay.open')].map((o) => o.id) }));
  await page.evaluate(() => { try { window.abrirModalFornecedor(); } catch (_) {} });
  await page.waitForTimeout(1500);
  const forn = await page.evaluate(() => { const ov = document.getElementById('modal-fornecedor'); const nome = document.getElementById('forn-e-nome'); const r = nome ? nome.getBoundingClientRect() : null; return { aberto: ov && ov.classList.contains('open'), campoNomeVisivel: !!(r && r.width > 0 && r.height > 0) }; });
  // fecha pelo ✕ e confere que fecha
  await page.evaluate(() => { try { window.fechar('modal-fornecedor'); } catch (_) {} }); await page.waitForTimeout(400);
  const fechou = await page.evaluate(() => !document.getElementById('modal-fornecedor').classList.contains('open'));
  const res = { vaziosAntesDeNavegar: antes, vaziosDepois: depois.vazios.length, exemplosVazios: depois.vazios.slice(0, 6), modalVazadoRemovido: !depois.vazado, novoFornecedorAbre: forn.aberto && forn.campoNomeVisivel, fechaPeloX: fechou, escritas };
  const ok = res.vaziosDepois === 0 && res.modalVazadoRemovido && res.novoFornecedorAbre && res.fechaPeloX && escritas.length === 0;
  console.log(JSON.stringify(res, null, 1)); console.log(ok ? 'RESULTADO: PASSOU' : 'RESULTADO: FALHOU');
  await browser.close(); srv.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALHA DO TESTE:', e); process.exit(2); });
