import { el } from '../lib/ui.js';
import { navigate, getRoute } from '../lib/router.js';
import { requireRole } from '../auth.js';

function navItem(icon, label, path) {
  const item = el('div', { class: 'nav-item', onclick: () => navigate(path) }, [
    el('div', { class: 'nav-ico', text: icon }),
    el('div', { class: 'nav-lbl', text: label }),
  ]);
  item.dataset.path = path;
  return item;
}

function section(label) {
  return el('div', { class: 'nav-section', text: label });
}

function subGroup(children) {
  return el('div', { class: 'nav-sub' }, children);
}

export function renderNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.innerHTML = '';

  nav.appendChild(section('Geral'));
  nav.appendChild(navItem('📊', 'Dashboard', '/dashboard'));

  nav.appendChild(section('Cadastros'));
  nav.appendChild(subGroup([
    navItem('👥', 'Clientes', '/cadastros/clientes'),
    navItem('🏪', 'Fornecedores', '/cadastros/fornecedores'),
    navItem('🤝', 'Vendedores', '/cadastros/vendedores'),
    navItem('👷', 'Operadores', '/cadastros/operadores'),
  ]));

  nav.appendChild(section('Estoques'));
  nav.appendChild(subGroup([
    navItem('📦', 'Chapas', '/estoques/chapas'),
  ]));

  if (requireRole('admin')) {
    nav.appendChild(section('Admin'));
    nav.appendChild(navItem('👤', 'Usuários', '/admin/usuarios'));
  }

  updateNavActive();
}

export function updateNavActive() {
  const path = getRoute();
  document.querySelectorAll('.nav-item').forEach((it) => {
    const p = it.dataset.path || '';
    it.classList.toggle('active', p === path);
  });
}
