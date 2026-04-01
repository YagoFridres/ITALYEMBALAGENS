import { createSupabase } from './lib/supabase.js';
import { store, setSyncPill, setUserBadge } from './lib/store.js';
import { registerRoute, startRouter } from './lib/router.js';
import { toast } from './lib/ui.js';
import { loadProfile, loadSession, signIn, signOut } from './auth.js';
import { renderNav, updateNavActive } from './modules/nav.js';
import { dashboardRoute } from './modules/dashboard.js';
import { clientesRoute } from './modules/clientes.js';
import { fornecedoresRoute } from './modules/fornecedores.js';
import { vendedoresRoute } from './modules/vendedores.js';
import { operadoresRoute } from './modules/operadores.js';
import { chapasRoute } from './modules/chapas.js';
import { usuariosRoute } from './modules/usuarios.js';
import { enableRealtime } from './realtime.js';

const { client: sb, configured } = createSupabase();

const ctx = {
  sb,
  configured,
  profile: null,
  counts: { clientes: 0, chapas: 0 },
  _rtOff: [],
};

function showShell() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('shell').style.display = '';
}

function showLogin() {
  document.getElementById('shell').style.display = 'none';
  document.getElementById('login').style.display = '';
}

async function refreshCounts() {
  try {
    const { count: c1 } = await sb.from('clientes').select('*', { count: 'exact', head: true });
    const { count: c2 } = await sb.from('chapas').select('*', { count: 'exact', head: true });
    ctx.counts = { clientes: c1 || 0, chapas: c2 || 0 };
  } catch (e) {}
}

function setupRealtime() {
  ctx._rtOff.forEach((fn) => fn());
  ctx._rtOff = [];
  ctx._rtOff.push(enableRealtime(sb, 'clientes', () => refreshCounts()));
  ctx._rtOff.push(enableRealtime(sb, 'chapas', () => refreshCounts()));
}

async function boot() {
  if (!configured) {
    setSyncPill('Config Supabase', 'warn');
    showLogin();
    document.getElementById('login-err').style.display = 'block';
    document.getElementById('login-err').textContent = 'Configure SUPABASE no arquivo frontend/config.js';
    return;
  }

  setSyncPill('Conectando...', 'warn');
  await loadSession(sb).catch(() => null);
  if (!store.session) {
    showLogin();
    setSyncPill('Offline', 'warn');
    return;
  }

  await loadProfile(sb).catch(() => null);
  ctx.profile = store.profile;
  if (!ctx.profile || !ctx.profile.ativo) {
    await signOut(sb).catch(() => null);
    showLogin();
    setSyncPill('Sem perfil', 'bad');
    return;
  }

  setUserBadge(`${ctx.profile.nome || '—'} · ${ctx.profile.role || '—'}`);
  renderNav();
  setupRealtime();
  await refreshCounts();
  showShell();
  setSyncPill('Online', 'ok');
  await startRouter(ctx);
}

function setupHandlers() {
  const mobBtn = document.getElementById('mob-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  if (mobBtn && sidebar) {
    mobBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  window.addEventListener('hashchange', () => {
    if (sidebar) sidebar.classList.remove('open');
    updateNavActive();
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut(sb).catch(() => null);
    showLogin();
    setSyncPill('Offline', 'warn');
  });

  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = (document.getElementById('login-email').value || '').trim();
    const pass = (document.getElementById('login-pass').value || '').trim();
    const err = document.getElementById('login-err');
    err.style.display = 'none';
    try {
      await signIn(sb, email, pass);
      await loadProfile(sb);
      ctx.profile = store.profile;
      if (!ctx.profile || !ctx.profile.ativo) {
        await signOut(sb).catch(() => null);
        err.style.display = 'block';
        err.textContent = 'Usuário sem perfil ativo.';
        return;
      }
      setUserBadge(`${ctx.profile.nome || '—'} · ${ctx.profile.role || '—'}`);
      renderNav();
      setupRealtime();
      await refreshCounts();
      showShell();
      setSyncPill('Online', 'ok');
      toast('Bem-vindo', 'ok');
      location.hash = '#/dashboard';
    } catch (e) {
      err.style.display = 'block';
      err.textContent = String(e && e.message ? e.message : e);
    }
  });
}

registerRoute(dashboardRoute.path, dashboardRoute);
registerRoute(clientesRoute.path, clientesRoute);
registerRoute(fornecedoresRoute.path, fornecedoresRoute);
registerRoute(vendedoresRoute.path, vendedoresRoute);
registerRoute(operadoresRoute.path, operadoresRoute);
registerRoute(chapasRoute.path, chapasRoute);
registerRoute(usuariosRoute.path, usuariosRoute);
registerRoute('/404', { title: 'Não encontrado', render: async () => document.createTextNode('') });

setupHandlers();
boot().catch((e) => {
  console.error(e);
  setSyncPill('Erro', 'bad');
  showLogin();
});

