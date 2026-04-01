import { renderTable } from '../components/table.js';
import { openModal, confirmModal } from '../components/modals.js';
import { showToast } from '../components/toast.js';

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

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function mountEstoque({ root, api, sb }) {
  const wrap = el('div');
  root.innerHTML = '';
  root.appendChild(wrap);

  let empresas = [];
  let search = '';
  let tipo = '';
  let empresaId = '';

  const toolbar = el('div', { class: 'ptoolbar' }, [
    el('input', { placeholder: 'Buscar (código, descrição, tipo)', value: '' }),
    el('input', { placeholder: 'Tipo', value: '' }),
    el('select', {}, [el('option', { value: '', text: 'Todas empresas' })]),
    el('button', { class: 'btn btn-accent', text: '+ Novo item', onclick: () => openForm(null) }),
  ]);
  wrap.appendChild(toolbar);

  const [inputSearch, inputTipo, selEmpresa] = toolbar.querySelectorAll('input,select');
  inputSearch.addEventListener('input', () => {
    search = inputSearch.value;
    load();
  });
  inputTipo.addEventListener('input', () => {
    tipo = inputTipo.value;
    load();
  });
  selEmpresa.addEventListener('change', () => {
    empresaId = selEmpresa.value;
    load();
  });

  const host = el('div');
  wrap.appendChild(host);

  async function loadEmpresas() {
    const { data, error } = await sb.from('empresas').select('*').order('nome', { ascending: true });
    if (error) throw new Error(error.message);
    empresas = data || [];
    selEmpresa.innerHTML = '';
    selEmpresa.appendChild(el('option', { value: '', text: 'Todas empresas' }));
    for (const e of empresas) selEmpresa.appendChild(el('option', { value: e.id, text: e.nome }));
  }

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tipo) params.set('tipo', tipo);
    if (empresaId) params.set('empresa_id', empresaId);
    const res = await api(`/api/estoque?${params.toString()}`);
    if (!res.ok) throw new Error(res.error || 'Falha ao carregar estoque');

    renderTable(host, {
      columns: [
        { label: 'Código', render: (r) => r.codigo || '', align: 'center' },
        { label: 'Descrição', render: (r) => r.descricao || '' },
        { label: 'Tipo', render: (r) => r.tipo || '' },
        { label: 'Un', render: (r) => r.unidade || 'un', align: 'center' },
        {
          label: 'Qtd',
          render: (r) => {
            const q = num(r.quantidade);
            const min = num(r.quantidade_minima);
            const span = el('span', { text: q.toFixed(2).replace(/\.00$/, '') });
            if (min > 0 && q <= min) span.style.color = 'var(--yellow)';
            if (q <= 0) span.style.color = 'var(--red)';
            span.style.fontFamily = 'var(--mono)';
            return span;
          },
          align: 'center',
        },
        { label: 'Min', render: (r) => num(r.quantidade_minima).toFixed(2).replace(/\.00$/, ''), align: 'center' },
        {
          label: 'Ações',
          render: (r) => {
            const row = el('div');
            const bPlus = el('button', { class: 'btn-icon', text: '+', onclick: (e) => (e.stopPropagation(), mov(r, +1)) });
            const bMinus = el('button', { class: 'btn-icon', text: '−', onclick: (e) => (e.stopPropagation(), mov(r, -1)) });
            const bEdit = el('button', { class: 'btn-icon', text: '✎', onclick: (e) => (e.stopPropagation(), openForm(r)) });
            row.appendChild(bPlus);
            row.appendChild(bMinus);
            row.appendChild(bEdit);
            row.style.display = 'flex';
            row.style.gap = '6px';
            return row;
          },
          align: 'center',
        },
      ],
      rows: res.data || [],
      onRowClick: (r) => openForm(r),
    });
  }

  function form(row) {
    const f = el('form', { class: 'fg' }, [
      field('Código*', 'codigo'),
      field('Descrição*', 'descricao', true),
      field('Tipo', 'tipo'),
      field('Unidade', 'unidade'),
      field('Qtd', 'quantidade'),
      field('Qtd mínima', 'quantidade_minima'),
      field('Custo unit.', 'custo_unitario'),
      selEmp('Empresa', 'empresa_id', true),
    ]);
    if (row) {
      for (const k of Object.keys(row)) set(f, k, row[k]);
      set(f, 'quantidade', num(row.quantidade).toFixed(2));
      set(f, 'quantidade_minima', num(row.quantidade_minima).toFixed(2));
      set(f, 'custo_unitario', num(row.custo_unitario).toFixed(2));
    } else {
      set(f, 'unidade', 'un');
      set(f, 'quantidade', '0');
      set(f, 'quantidade_minima', '0');
      set(f, 'custo_unitario', '0');
    }
    return f;
  }

  function field(label, name, full = false) {
    return el('div', { class: `mf ${full ? 'fgf' : ''}` }, [el('label', { text: label }), el('input', { name, autocomplete: 'off' })]);
  }

  function selEmp(label, name, full = false) {
    const w = el('div', { class: `mf ${full ? 'fgf' : ''}` }, [el('label', { text: label })]);
    const s = el('select', { name });
    s.appendChild(el('option', { value: '', text: '—' }));
    for (const e of empresas) s.appendChild(el('option', { value: e.id, text: e.nome }));
    w.appendChild(s);
    return w;
  }

  function get(f, name) {
    const i = f.querySelector(`[name="${name}"]`);
    return i ? i.value : '';
  }

  function set(f, name, value) {
    const i = f.querySelector(`[name="${name}"]`);
    if (i) i.value = value == null ? '' : String(value);
  }

  async function openForm(row) {
    const f = form(row);
    openModal({
      title: row ? `Estoque ${row.codigo}` : 'Novo item de estoque',
      content: f,
      actions: [
        row
          ? {
              label: 'Excluir',
              className: 'btn btn-red',
              onClick: async () => {
                const ok = await confirmModal({ title: 'Excluir item', message: 'Confirmar exclusão?' });
                if (!ok) return;
                const r = await api(`/api/estoque/${row.id}`, { method: 'DELETE' });
                if (!r.ok) throw new Error(r.error || 'Falha ao excluir');
                showToast('Item excluído', 'success');
                await load();
              },
            }
          : { label: 'Cancelar', className: 'btn btn-ghost', onClick: () => {} },
        {
          label: 'Salvar',
          className: 'btn btn-accent',
          onClick: async () => {
            const payload = {
              codigo: get(f, 'codigo').trim(),
              descricao: get(f, 'descricao').trim(),
              tipo: get(f, 'tipo').trim() || null,
              unidade: get(f, 'unidade').trim() || 'un',
              quantidade: num(get(f, 'quantidade')),
              quantidade_minima: num(get(f, 'quantidade_minima')),
              custo_unitario: num(get(f, 'custo_unitario')),
              empresa_id: get(f, 'empresa_id') || null,
            };
            if (!payload.codigo || !payload.descricao) throw new Error('Código e descrição são obrigatórios');
            const r = row
              ? await api(`/api/estoque/${row.id}`, { method: 'PUT', body: payload })
              : await api('/api/estoque', { method: 'POST', body: payload });
            if (!r.ok) throw new Error(r.error || 'Falha ao salvar');
            showToast('Salvo', 'success');
            await load();
          },
        },
      ],
    });
  }

  async function mov(row, dir) {
    const box = el('div', { class: 'fg' }, [
      el('div', { class: 'mf fgf' }, [el('label', { text: dir > 0 ? 'Entrada' : 'Saída' }), el('input', { name: 'q', type: 'number', step: '0.01', value: '1' })]),
    ]);
    openModal({
      title: `${dir > 0 ? 'Entrada' : 'Saída'} — ${row.codigo}`,
      content: box,
      actions: [
        { label: 'Cancelar', className: 'btn btn-ghost', onClick: () => {} },
        {
          label: 'Confirmar',
          className: dir > 0 ? 'btn btn-green' : 'btn btn-red',
          onClick: async () => {
            const q = num(box.querySelector('[name="q"]').value);
            if (q <= 0) throw new Error('Quantidade inválida');
            const r = await api(`/api/estoque/${row.id}/movimento`, { method: 'POST', body: { delta: dir * q } });
            if (!r.ok) throw new Error(r.error || 'Falha ao movimentar');
            showToast('Movimento aplicado', 'success');
            await load();
          },
        },
      ],
    });
  }

  const onChange = (e) => {
    if (e.detail?.table === 'estoque') load().catch(() => {});
  };
  window.addEventListener('sb:change', onChange);

  Promise.resolve()
    .then(loadEmpresas)
    .then(load)
    .catch((e) => showToast(e.message || 'Erro', 'error'));

  return {
    refresh: load,
    unmount() {
      window.removeEventListener('sb:change', onChange);
    },
  };
}
