function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, String(v));
  }
  for (const c of children) n.appendChild(c);
  return n;
}

export function renderSidebar(container, { onNavigate, activeRoute }) {
  const root = el('div', { class: 'sidebar' });

  const brand = el('div', { class: 'sidebar-brand' }, [
    el('div', { class: 'sidebar-brand-name', text: 'PCP Pro ERP' }),
    el('div', { class: 'sidebar-brand-sub', text: 'Italy Embalagens' }),
  ]);
  root.appendChild(brand);

  const makeItem = (route, label, ico) => {
    const item = el('div', { class: `nav-item ${activeRoute === route ? 'active' : ''}` });
    item.dataset.route = route;
    item.appendChild(el('span', { class: 'ico', text: ico }));
    item.appendChild(el('span', { text: label }));
    item.addEventListener('click', () => onNavigate(route));
    return item;
  };

  root.appendChild(el('div', { class: 'sidebar-section', text: 'GERAL' }));
  root.appendChild(makeItem('dashboard', 'Dashboard', '📊'));
  root.appendChild(makeItem('pcp', 'PCP / OFs', '🧾'));
  root.appendChild(makeItem('apontamento', 'Apontamento', '⏱️'));

  root.appendChild(el('div', { class: 'sidebar-section', text: 'CADASTROS' }));
  const cadHeader = el('div', { class: 'nav-item nav-group-header' });
  cadHeader.appendChild(el('span', { class: 'ico', text: '📁' }));
  cadHeader.appendChild(el('span', { text: 'Cadastros' }));
  const arrow = el('span', { class: 'nav-arrow', text: '▾' });
  cadHeader.appendChild(arrow);

  const subgroup = el('div', { class: 'nav-subgroup' }, [
    el('div', { class: `nav-item nav-subitem ${activeRoute === 'clientes' ? 'active' : ''}` }, [
      el('span', { class: 'ico', text: '👤' }),
      el('span', { text: 'Clientes' }),
    ]),
  ]);
  subgroup.firstChild.addEventListener('click', () => onNavigate('clientes'));

  let aberto = true;
  cadHeader.addEventListener('click', () => {
    aberto = !aberto;
    subgroup.classList.toggle('fechado', !aberto);
    arrow.style.transform = aberto ? 'rotate(0deg)' : 'rotate(-90deg)';
  });

  root.appendChild(cadHeader);
  root.appendChild(subgroup);

  root.appendChild(el('div', { class: 'sidebar-section', text: 'ESTOQUES' }));
  root.appendChild(makeItem('estoque', 'Estoque', '📦'));

  container.innerHTML = '';
  container.appendChild(root);
  return root;
}
