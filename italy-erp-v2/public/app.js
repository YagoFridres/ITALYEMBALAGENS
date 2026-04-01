import { renderSidebar } from './components/sidebar.js';
import { showToast } from './components/toast.js';
import { mountDashboard } from './modules/dashboard.js';
import { mountClientes } from './modules/clientes.js';
import { mountEstoque } from './modules/estoque.js';
import { mountPCP } from './modules/pcp.js';
import { mountApontamento } from './modules/apontamento.js';

async function getConfig() {
  const r = await fetch('/api/config');
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'config_failed');
  return j.data;
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function detectDevice() {
  const stored = localStorage.getItem('device');
  if (stored) return stored;
  const w = window.innerWidth;
  if (w <= 560) return 'mobile';
  if (w <= 980) return 'tablet';
  return 'desktop';
}

function setDevice(device) {
  document.body.dataset.device = device;
  localStorage.setItem('device', device);
}

async function main() {
  const { supabaseUrl, supabaseAnonKey } = await getConfig();
  const sb = supabase.createClient(supabaseUrl, supabaseAnonKey);

  const theme = localStorage.getItem('theme') || 'dark';
  setTheme(theme);
  setDevice(detectDevice());

  const clock = document.getElementById('clock');
  setInterval(() => {
    const d = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    if (clock) clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, 500);

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }

  const { data: sess } = await sb.auth.getSession();
  if (!sess?.session) {
    location.href = '/';
    return;
  }

  sb.auth.onAuthStateChange((_evt, session) => {
    if (!session) location.href = '/';
  });

  async function api(path, { method = 'GET', body } = {}) {
    const { data } = await sb.auth.getSession();
    const token = data?.session?.access_token;
    const r = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => null);
    return j || { ok: false, error: 'bad_response' };
  }

  const routes = {
    dashboard: mountDashboard,
    pcp: mountPCP,
    clientes: mountClientes,
    estoque: mountEstoque,
    apontamento: mountApontamento,
  };

  const sidebarHost = document.getElementById('sidebar-host');
  const pageTitle = document.getElementById('page-title');
  const pageSub = document.getElementById('page-sub');
  const pageRoot = document.getElementById('page-root');

  let current = null;
  let currentRoute = '';

  function setHeader(route) {
    const map = {
      dashboard: ['Dashboard', 'Visão geral em tempo real'],
      pcp: ['PCP / OFs', 'Ordens de Fabricação'],
      clientes: ['Clientes', 'Cadastro e consulta'],
      estoque: ['Estoque', 'Materiais e alertas'],
      apontamento: ['Apontamento', 'Tablets no chão de fábrica'],
    };
    const [t, s] = map[route] || ['Italy ERP', ''];
    if (pageTitle) pageTitle.textContent = t;
    if (pageSub) pageSub.textContent = s;
  }

  function go(route) {
    const r = routes[route] ? route : 'dashboard';
    if (r === currentRoute) return;
    if (current?.unmount) current.unmount();
    currentRoute = r;
    setHeader(r);
    renderSidebar(sidebarHost, {
      activeRoute: r,
      onNavigate: (to) => {
        location.hash = `#${to}`;
        const sbEl = document.querySelector('.sidebar');
        if (document.body.dataset.device === 'mobile' && sbEl) sbEl.classList.remove('mob-open');
        const ov = document.getElementById('mob-sidebar-overlay');
        if (ov) ov.classList.remove('show');
      },
    });
    current = routes[r]({ root: pageRoot, api, sb });
  }

  function fromHash() {
    const h = (location.hash || '').replace(/^#/, '');
    return h || 'dashboard';
  }

  window.addEventListener('hashchange', () => go(fromHash()));
  go(fromHash());

  const mobBtn = document.getElementById('mob-menu-btn');
  const mobOv = document.getElementById('mob-sidebar-overlay');
  if (mobBtn && mobOv) {
    mobBtn.addEventListener('click', () => {
      const sbEl = document.querySelector('.sidebar');
      if (!sbEl) return;
      sbEl.classList.toggle('mob-open');
      mobOv.classList.toggle('show', sbEl.classList.contains('mob-open'));
    });
    mobOv.addEventListener('click', () => {
      const sbEl = document.querySelector('.sidebar');
      if (!sbEl) return;
      sbEl.classList.remove('mob-open');
      mobOv.classList.remove('show');
    });
  }

  function notify(table) {
    window.dispatchEvent(new CustomEvent('sb:change', { detail: { table } }));
  }

  sb.channel('ofs-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ofs' }, () => notify('ofs'))
    .subscribe();
  sb.channel('estoque-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, () => notify('estoque'))
    .subscribe();
  sb.channel('apontamentos-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'apontamentos' }, () => notify('apontamentos'))
    .subscribe();

  showToast('Conectado', 'success');
}

main().catch((e) => {
  showToast(e.message || 'Erro ao iniciar', 'error');
});
