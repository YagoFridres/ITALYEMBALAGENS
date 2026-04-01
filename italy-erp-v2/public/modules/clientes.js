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

function val(form, name) {
  const inp = form.querySelector(`[name="${name}"]`);
  return inp ? inp.value : '';
}

function setVal(form, name, value) {
  const inp = form.querySelector(`[name="${name}"]`);
  if (inp) inp.value = value == null ? '' : String(value);
}

export function mountClientes({ root, api, sb }) {
  const wrap = el('div');
  root.innerHTML = '';
  root.appendChild(wrap);

  let empresas = [];
  let search = '';
  let empresaId = '';

  const toolbar = el('div', { class: 'ptoolbar' }, [
    el('input', { placeholder: 'Buscar (nome, cidade, CNPJ, rep.)', value: '' }),
    el('select', {}, [el('option', { value: '', text: 'Todas empresas' })]),
    el('button', { class: 'btn btn-accent', text: '+ Novo cliente', onclick: () => openForm(null) }),
  ]);

  const inputSearch = toolbar.querySelector('input');
  const selEmpresa = toolbar.querySelector('select');

  inputSearch.addEventListener('input', () => {
    search = inputSearch.value;
    load();
  });
  selEmpresa.addEventListener('change', () => {
    empresaId = selEmpresa.value;
    load();
  });

  wrap.appendChild(toolbar);
  const tableHost = el('div');
  wrap.appendChild(tableHost);

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
    if (empresaId) params.set('empresa_id', empresaId);
    const res = await api(`/api/clientes?${params.toString()}`);
    if (!res.ok) throw new Error(res.error || 'Falha ao carregar clientes');

    renderTable(tableHost, {
      columns: [
        { label: 'Código', render: (r) => r.codigo || '', align: 'center' },
        { label: 'Nome', render: (r) => r.nome || '' },
        { label: 'Cidade', render: (r) => r.cidade || '' },
        { label: 'UF', render: (r) => r.uf || '', align: 'center' },
        { label: 'CNPJ', render: (r) => r.cnpj || '' },
        { label: 'Rep.', render: (r) => r.representante || '' },
        { label: 'Ativo', render: (r) => (r.ativo ? 'Sim' : 'Não'), align: 'center' },
      ],
      rows: res.data || [],
      onRowClick: (r) => openForm(r),
    });
  }

  function formHtml() {
    return el('form', { class: 'fg' }, [
      field('Código*', 'codigo'),
      field('Nome*', 'nome'),
      field('Razão social', 'razao_social', true),
      field('CNPJ', 'cnpj'),
      field('IE', 'ie'),
      field('Telefone', 'telefone'),
      field('Email', 'email'),
      field('Cidade', 'cidade'),
      field('UF', 'uf'),
      field('Endereço', 'endereco', true),
      field('Ramo', 'ramo'),
      field('Pagamento', 'pagamento'),
      field('Representante', 'representante'),
      area('Obs', 'obs', true),
      selectEmpresa('Empresa', 'empresa_id', true),
      selectAtivo('Ativo', 'ativo'),
    ]);
  }

  function field(label, name, full = false) {
    const w = el('div', { class: `mf ${full ? 'fgf' : ''}` }, [
      el('label', { text: label }),
      el('input', { name, autocomplete: 'off' }),
    ]);
    return w;
  }

  function area(label, name, full = false) {
    const w = el('div', { class: `mf ${full ? 'fgf' : ''}` }, [
      el('label', { text: label }),
      el('textarea', { name, rows: '3' }),
    ]);
    return w;
  }

  function selectEmpresa(label, name, full = false) {
    const w = el('div', { class: `mf ${full ? 'fgf' : ''}` }, [el('label', { text: label })]);
    const s = el('select', { name });
    s.appendChild(el('option', { value: '', text: '—' }));
    for (const e of empresas) s.appendChild(el('option', { value: e.id, text: e.nome }));
    w.appendChild(s);
    return w;
  }

  function selectAtivo(label, name) {
    const w = el('div', { class: 'mf' }, [el('label', { text: label })]);
    const s = el('select', { name });
    s.appendChild(el('option', { value: 'true', text: 'Sim' }));
    s.appendChild(el('option', { value: 'false', text: 'Não' }));
    w.appendChild(s);
    return w;
  }

  async function openForm(row) {
    const form = formHtml();
    if (row) {
      for (const k of Object.keys(row)) setVal(form, k, row[k]);
      setVal(form, 'ativo', row.ativo ? 'true' : 'false');
    } else {
      setVal(form, 'ativo', 'true');
    }

    const m = openModal({
      title: row ? `Cliente ${row.codigo}` : 'Novo cliente',
      content: form,
      actions: [
        row
          ? {
              label: 'Excluir',
              className: 'btn btn-red',
              onClick: async () => {
                const ok = await confirmModal({ title: 'Excluir cliente', message: 'Confirmar exclusão?' });
                if (!ok) return;
                const r = await api(`/api/clientes/${row.id}`, { method: 'DELETE' });
                if (!r.ok) throw new Error(r.error || 'Falha ao excluir');
                showToast('Cliente excluído', 'success');
                await load();
              },
            }
          : { label: 'Cancelar', className: 'btn btn-ghost', onClick: () => {} },
        { label: 'Salvar', className: 'btn btn-accent', onClick: async () => save(row, form) },
      ],
    });

    return m;
  }

  async function save(row, form) {
    const payload = {
      codigo: val(form, 'codigo').trim(),
      nome: val(form, 'nome').trim(),
      razao_social: val(form, 'razao_social').trim() || null,
      cnpj: val(form, 'cnpj').trim() || null,
      ie: val(form, 'ie').trim() || null,
      telefone: val(form, 'telefone').trim() || null,
      email: val(form, 'email').trim() || null,
      cidade: val(form, 'cidade').trim() || null,
      uf: val(form, 'uf').trim() || null,
      endereco: val(form, 'endereco').trim() || null,
      ramo: val(form, 'ramo').trim() || null,
      pagamento: val(form, 'pagamento').trim() || null,
      representante: val(form, 'representante').trim() || null,
      obs: val(form, 'obs').trim() || null,
      empresa_id: val(form, 'empresa_id') || null,
      ativo: val(form, 'ativo') === 'true',
    };
    if (!payload.codigo || !payload.nome) throw new Error('Código e nome são obrigatórios');

    const r = row
      ? await api(`/api/clientes/${row.id}`, { method: 'PUT', body: payload })
      : await api('/api/clientes', { method: 'POST', body: payload });
    if (!r.ok) throw new Error(r.error || 'Falha ao salvar');

    showToast('Salvo', 'success');
    await load();
  }

  const onChange = () => load().catch(() => {});
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
