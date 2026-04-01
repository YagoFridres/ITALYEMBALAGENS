import { renderTable } from '../components/table.js';

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, String(v));
  }
  for (const c of children) n.appendChild(c);
  return n;
}

export function mountDashboard({ root, api }) {
  const page = el('div');
  root.innerHTML = '';
  root.appendChild(page);

  async function load() {
    const res = await api('/api/dashboard/summary');
    if (!res.ok) throw new Error(res.error || 'Falha ao carregar dashboard');
    const data = res.data;

    page.innerHTML = '';
    const cards = el('div', { class: 'cards-row' }, [
      card('OFs em aberto', data.cards.emAberto, 'cv-a'),
      card('Em produção', data.cards.emProducao, 'cv-y'),
      card('Atrasadas', data.cards.atrasadas, 'cv-r'),
      card('Concluídas hoje', data.cards.concluidasHoje, 'cv-g'),
    ]);
    page.appendChild(cards);

    const grid = el('div', { class: 'g2' });
    page.appendChild(grid);

    const boxProd = box('Produção por máquina', '');
    const boxUrg = box('OFs urgentes', '');
    grid.appendChild(boxProd);
    grid.appendChild(boxUrg);

    const prodWrap = el('div');
    boxProd.querySelector('.sbox-b').appendChild(prodWrap);
    renderTable(prodWrap, {
      columns: [
        { label: 'Máquina', render: (r) => r.nome || '—' },
        { label: 'Apont.', render: (r) => r.apontamentos || 0, align: 'center' },
        { label: 'Qtd.', render: (r) => r.qtd || 0, align: 'center' },
      ],
      rows: (data.prodPorMaquina || []).sort((a, b) => (b.qtd || 0) - (a.qtd || 0)),
    });

    const urgWrap = el('div');
    boxUrg.querySelector('.sbox-b').appendChild(urgWrap);
    renderTable(urgWrap, {
      columns: [
        { label: 'OF', render: (r) => r.numero ? `OF ${r.numero}` : '—' },
        { label: 'Descrição', render: (r) => r.descricao || '' },
        { label: 'Status', render: (r) => r.status || '—', align: 'center' },
      ],
      rows: data.urgentes || [],
      rowClass: () => 'row-urg',
    });
  }

  function card(label, value, cls) {
    return el('div', { class: 'card' }, [
      el('div', { class: 'card-lbl', text: label }),
      el('div', { class: `card-val ${cls}`, text: String(value ?? 0) }),
      el('div', { class: 'card-sub', text: 'Realtime Supabase' }),
    ]);
  }

  function box(title, sub) {
    const b = el('div', { class: 'sbox' }, [
      el('div', { class: 'sbox-h' }, [
        el('div', { text: title }),
        sub ? el('div', { class: 'page-sub', text: sub }) : el('div'),
      ]),
      el('div', { class: 'sbox-b' }),
    ]);
    return b;
  }

  const onChange = () => load().catch(() => {});
  window.addEventListener('sb:change', onChange);

  load();

  return {
    refresh: load,
    unmount() {
      window.removeEventListener('sb:change', onChange);
    },
  };
}
