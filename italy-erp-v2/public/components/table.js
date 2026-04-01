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

export function renderTable(container, { columns, rows, rowKey = (r) => r.id, rowClass = () => '', onRowClick } = {}) {
  const wrap = el('div', { class: 'table-wrap' });
  const table = el('table', { class: 'pcp-table' });
  const thead = el('thead');
  const trh = el('tr');

  for (const c of columns) {
    const th = el('th', { text: c.label || '' });
    if (c.className) th.classList.add(...String(c.className).split(/\s+/).filter(Boolean));
    trh.appendChild(th);
  }
  thead.appendChild(trh);

  const tbody = el('tbody');
  for (const r of rows || []) {
    const tr = el('tr');
    const cls = rowClass(r);
    if (cls) tr.className = cls;
    tr.dataset.key = String(rowKey(r));
    if (onRowClick) tr.addEventListener('click', () => onRowClick(r));

    for (const c of columns) {
      const td = el('td');
      if (c.align === 'center') td.classList.add('tc');
      const v = c.render ? c.render(r) : r[c.key];
      if (v instanceof Node) td.appendChild(v);
      else td.textContent = v == null ? '' : String(v);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);

  container.innerHTML = '';
  container.appendChild(wrap);
  return { wrap, table, tbody };
}
