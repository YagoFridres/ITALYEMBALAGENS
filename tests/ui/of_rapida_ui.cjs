// Teste real de interface (Chromium) da OF Rápida, com API 100% simulada (dados fictícios).
// Uso: node of_rapida_ui.cjs <pasta-do-repo> [largura]
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(process.argv[2] || '.');
const WIDTH = Number(process.argv[3] || 1366);

const EMPRESAS = [
  { id: 'df5f7672-0a6b-402d-ae65-296554236c31', codigo: 'E1', sigla: 'ITALY', nome: 'Italy Embalagens' },
  { id: 'e9b734dc-c7d5-4b04-898d-1ec7affa721e', codigo: 'E2', sigla: 'CARTO', nome: 'Cartoeste' },
  { id: 'a6e5f5d8-4743-4ebe-885e-c2f0741a667a', codigo: 'E3', sigla: 'OESTE', nome: 'Oestepack' },
];
const OF_TESTE = {
  id: '11111111-2222-4333-8444-555555555555', numero: '9001', of: '9001', status: 'Em aberto',
  cli_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', clinome: 'CLIENTE FICTICIO', cliNome: 'CLIENTE FICTICIO', cliente_nome: 'CLIENTE FICTICIO',
  descricao: 'CAIXA TESTE 30X20', produto: 'CAIXA TESTE 30X20', qtd: 100, quantidade: 100, valor_unitario: 2.5, valor_total: 250,
  emp_id: 'E1', empresa_id: EMPRESAS[0].id, data_entrega: '2026-10-25', dia: '2026-10-19', maq: ['IMP 01'], maquina_agendada: 'IMP 01',
  caixa_comprimento: 300, caixa_largura: 200, cores_impressao: [{ nome: 'Preto' }], itens: [], created_at: '2026-10-19T10:00:00Z',
};
const USER = { id: 'u-teste', nome: 'Teste', email: 'teste@exemplo.local', role: 'admin', perfil: 'admin', is_admin: true, admin: true, emp_id: 'E1', empresa_id: EMPRESAS[0].id };

function apiStub(url, method) {
  const u = new URL(url);
  const p = u.pathname;
  if (p === '/api/auth/me') return { ok: true, user: USER, ...USER };
  if (p === '/api/ofs/proximo-numero') return { ok: true, proximo: '9002', maior: '9001' };
  if (p === '/api/empresas') return { ok: true, data: EMPRESAS };
  if (p === '/api/maquinas') return { ok: true, data: ['IMP 01','IMP 02','IMP 03','IMP 04','IMP 05','RISCADOR','CORTE VINCO ROTATIVA'].map((n, i) => ({ id: 'm' + i, nome: n, ativo: true })) };
  if (p === '/api/vendedores') return { ok: true, data: [{ id: 'v1', nome: 'VENDEDOR FICTICIO', ativo: true }] };
  if (p === '/api/clientes') return { ok: true, data: [{ id: OF_TESTE.cli_id, nome: 'CLIENTE FICTICIO', ativo: true }] };
  if (/^\/api\/ofs\/[0-9a-f-]{36}$/.test(p) && method === 'GET') return { ok: true, data: OF_TESTE };
  if (p === '/api/ofs' && method === 'GET') return { ok: true, data: [OF_TESTE], total: 1 };
  if (method !== 'GET') return { __bloqueado: true };
  return { ok: true, data: [] };
}

function startStatic() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      let f = u.pathname === '/' ? '/index.html' : u.pathname;
      const fp = path.join(ROOT, f);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.statusCode = 404; return res.end(''); }
      const ct = f.endsWith('.js') ? 'application/javascript' : f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream';
      res.setHeader('Content-Type', ct);
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const srv = await startStatic();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined) });
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: WIDTH < 500 ? 844 : 900 }, serviceWorkers: 'block' });
  const writes = [];
  await ctx.route('**/api/**', async (route) => {
    const r = route.request();
    const body = apiStub(r.url(), r.method());
    if (body && body.__bloqueado) { writes.push(r.method() + ' ' + new URL(r.url()).pathname); return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'bloqueado no teste' }) }); }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  await ctx.addInitScript(() => { try { localStorage.setItem('token', 'tok-ficticio'); localStorage.setItem('access_token', 'tok-ficticio'); } catch (_) {} });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { const t = m.text(); if (/REENTRY|Uncaught|TypeError|ReferenceError/i.test(t)) logs.push(m.type() + ': ' + t.slice(0, 200)); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + String(e.message).slice(0, 200)));

  const res0 = {};
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  // tela de escolha de dispositivo: clica no botão real, como o usuário
  const dev = WIDTH < 500 ? 'mobile' : 'desktop';
  if (await page.locator('#device-screen.show').count()) {
    await page.locator('#device-screen [onclick*="' + dev + '"]').first().click();
  }
  await page.waitForTimeout(7000); // espera os setTimeout de boot do patch.js (até 6 s)
  res0.cobertura = await page.evaluate(() => { const b = document.getElementById('btn-nova-of-rapida'); if (!b) return null; const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return e ? (e.id || e.className || e.tagName) : null; });

  const res = Object.assign(res0, { largura: WIDTH, etapas: [] });
  async function aberta() { return page.evaluate(() => !!document.getElementById('modal-of-rapida')); }
  async function fechar() {
    await page.evaluate(() => { try { document.getElementById('modal-of-rapida')?.remove(); document.getElementById('modal-of-rapida-ov')?.remove(); } catch (_) {} });
    await page.waitForTimeout(400);
  }
  async function cliqueBotao(rotulo) {
    // clica no PRIMEIRO atalho VISÍVEL da OF Rápida (desktop: barra do PCP; celular: atalho móvel)
    const alvo = await page.evaluate(() => {
      const cands = [...document.querySelectorAll('button,a,[onclick]')].filter((el) => {
        const oc = String(el.getAttribute('onclick') || '');
        const tx = (el.textContent || '').trim();
        const ok = el.id === 'btn-nova-of-rapida' || /abrirNovaOfRapida|abrirOfRapida|abrirOFRapida/.test(oc) || /^⚡?\s*OF R[áa]pida$/i.test(tx);
        if (!ok) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      });
      if (!cands.length) return null;
      const el = cands[0];
      el.setAttribute('data-teste-alvo', '1');
      el.scrollIntoView({ block: 'center' });
      return (el.id || '') + ' "' + (el.textContent || '').trim().slice(0, 30) + '"';
    });
    if (!alvo) { res.etapas.push({ rotulo, erro: 'nenhum atalho visível da OF Rápida' }); return false; }
    await page.locator('[data-teste-alvo="1"]').first().click();
    await page.evaluate(() => document.querySelectorAll('[data-teste-alvo]').forEach((e) => e.removeAttribute('data-teste-alvo')));
    await page.waitForTimeout(2500);
    const a = await aberta();
    const st = await page.evaluate(() => {
      const b = document.getElementById('btn-salvar-of-rapida');
      const n = document.getElementById('of-r-numero') || document.getElementById('of-r-num-display');
      return { salvarHabilitado: b ? !b.disabled : null, salvarTexto: b ? b.textContent.trim() : null, numero: n ? n.textContent.trim() : null };
    });
    res.etapas.push({ rotulo, alvo, abriu: a, ...st });
    return a;
  }
  await cliqueBotao('1º clique ⚡ OF Rápida');
  await fechar();
  await cliqueBotao('2º clique (reabrir)');
  await fechar();
  await cliqueBotao('3º clique (reabrir de novo)');
  await fechar();

  // Ctrl+N e botão antigo (abrirModalOF sem id) devem abrir a OF Rápida
  await page.keyboard.press('Control+n').catch(() => {});
  await page.waitForTimeout(2500);
  res.etapas.push({ rotulo: 'Ctrl+N', abriu: await aberta() });
  await fechar();
  await page.evaluate(() => { try { window.abrirModalOF(); } catch (_) {} });
  await page.waitForTimeout(2500);
  res.etapas.push({ rotulo: 'abrirModalOF() sem id', abriu: await aberta() });
  await fechar();

  // Edição: abrirModalOF(id) deve abrir a OF Rápida em modo edição, preenchida
  await page.evaluate((id) => { try { window.abrirModalOF(id); } catch (_) {} }, OF_TESTE.id);
  await page.waitForTimeout(4000);
  const ed = await page.evaluate(() => {
    const m = document.getElementById('modal-of-rapida');
    const h = m ? m.querySelector('div[style*="font-weight:800"]') : null;
    const v = (id) => { const e = document.getElementById(id); return e ? (e.value || e.textContent || '').trim() : null; };
    const b = document.getElementById('btn-salvar-of-rapida');
    return { abriu: !!m, titulo: h ? h.textContent.trim() : null, cliente: v('of-r-cliente'), produto: v('of-r-produto'), qtd: v('of-r-qtd'), botao: b ? b.textContent.trim() : null };
  });
  res.etapas.push({ rotulo: 'Editar OF existente (abrirModalOF(id))', ...ed });
  await fechar();

  res.novaOfVisiveis = await page.evaluate(() => [...document.querySelectorAll('button,a')].filter((b) => /^[＋+\s]*nova\s*of$/i.test((b.textContent || '').trim()) && b.offsetParent !== null).length);
  res.reentryBlocked = logs.filter((l) => /REENTRY-BLOCKED/.test(l)).length;
  res.errosJs = logs.filter((l) => !/REENTRY-BLOCKED/.test(l));
  res.escritasBloqueadas = writes;
  await page.screenshot({ path: path.join(__dirname, 'shot_' + path.basename(ROOT) + '_' + WIDTH + '.png') });
  console.log(JSON.stringify(res, null, 2));
  await browser.close();
  srv.close();
})().catch((e) => { console.error('FALHA DO TESTE:', e); process.exit(2); });
