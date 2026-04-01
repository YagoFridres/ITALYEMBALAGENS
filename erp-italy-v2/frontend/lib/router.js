import { setRouteTitle } from './store.js';

const routes = new Map();

export function registerRoute(path, def) {
  routes.set(path, def);
}

export function getRoute() {
  const raw = location.hash || '#/dashboard';
  const path = raw.startsWith('#') ? raw.slice(1) : raw;
  return path || '/dashboard';
}

export async function navigate(path) {
  location.hash = '#' + path;
}

export async function renderRoute(ctx) {
  const view = document.getElementById('view');
  if (!view) return;

  const path = getRoute();
  const def = routes.get(path) || routes.get('/404');
  if (!def) {
    view.innerHTML = `<div class="card">Rota não encontrada</div>`;
    return;
  }

  setRouteTitle(def.title || '');
  view.innerHTML = '';
  const el = await def.render(ctx);
  if (el) view.appendChild(el);
}

export function startRouter(ctx) {
  window.addEventListener('hashchange', () => renderRoute(ctx));
  return renderRoute(ctx);
}
