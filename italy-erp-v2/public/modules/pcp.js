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
function iso(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function tagStatus(status) {
  const s = status || 'Em aberto';
  if (s === 'Em aberto') return ['t-ab', 'Em aberto'];
  if (s === 'Em produção') return ['t-pr', 'Em produção'];
  if (s === 'Concluída') return ['t-ok', 'Concluída'];
  if (s === 'Cancelada') return ['t-at', 'Cancelada'];
  return ['t-ab', s];
}
export function mountPCP({ root, api }) {
  const wrap = el('div');
  root.innerHTML = '';
  root.appendChild(wrap);

  const today = new Date();
  let de = iso(today);
  let ate = iso(addDays(today, 6));
  let status = '';
  let maquinaId = '';
  let urgente = false;
  let meta = { empresas: [], clientes: [], maquinas: [], fluxos: [] };
  let ofs = [];
  const toolbar = el('div', { class: 'ptoolbar' }, [
    el('input', { type: 'date', value: de }),
    el('input', { type: 'date', value: ate }),
    el('select'),
    el('select'),
    el('label', { style: 'display:flex;align-items:center;gap:8px;color:var(--text2);font-size:.72rem;font-family:var(--mono);text-transform:uppercase;' }, [
      el('input', { type: 'checkbox' }),
      el('span', { text: 'Urgente' }),
    ]),
    el('button', { class: 'btn btn-accent', text: '+ Nova OF', onclick: () => openForm(null) }),
  ]);
  wrap.appendChild(toolbar);

  const [inpDe, inpAte] = toolbar.querySelectorAll('input[type="date"]');
  const [selStatus, selMaq] = toolbar.querySelectorAll('select');
  const chkUrg = toolbar.querySelector('input[type="checkbox"]');
  inpDe.addEventListener('change', () => {
    de = inpDe.value;
    load();
  });
  inpAte.addEventListener('change', () => {
    ate = inpAte.value;
    load();
  });
  selStatus.addEventListener('change', () => {
    status = selStatus.value;
    load();
  });
  selMaq.addEventListener('change', () => {
    maquinaId = selMaq.value;
    load();
  });
  chkUrg.addEventListener('change', () => {
    urgente = chkUrg.checked;
    load();
  });
  const board = el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;padding:10px 0;' });
  wrap.appendChild(board);
  async function loadMeta() {
    const r = await api('/api/ofs/meta');
    if (!r.ok) throw new Error(r.error || 'Falha ao carregar meta');
    meta = r.data;
    selStatus.innerHTML = '';
    for (const s of ['', 'Em aberto', 'Em produção', 'Concluída', 'Cancelada']) {
      selStatus.appendChild(el('option', { value: s, text: s || 'Todos status' }));
    }
    selMaq.innerHTML = '';
    selMaq.appendChild(el('option', { value: '', text: 'Todas máquinas' }));
    for (const m of meta.maquinas || []) selMaq.appendChild(el('option', { value: m.id, text: m.nome }));
  }
  async function load() {
    const params = new URLSearchParams();
    if (de) params.set('de', de);
    if (ate) params.set('ate', ate);
    if (status) params.set('status', status);
    if (maquinaId) params.set('maquina_id', maquinaId);
    if (urgente) params.set('urgente', 'true');
    const r = await api(`/api/ofs?${params.toString()}`);
    if (!r.ok) throw new Error(r.error || 'Falha ao carregar OFs');
    ofs = r.data || [];
    render();
  }
  function render() {
    board.innerHTML = '';
    const start = de ? new Date(de) : new Date();
    const end = ate ? new Date(ate) : addDays(start, 6);
    const days = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) days.push(iso(d));

    for (const day of days) board.appendChild(renderDay(day));
  }
  function renderDay(day) {
    const box = el('div', { class: 'sbox' });
    const head = el('div', { class: 'sbox-h' }, [
      el('div', { style: 'font-family:var(--mono);font-weight:800;', text: day.split('-').reverse().join('/') }),
      el('div', { class: 'page-sub', text: `${(ofs || []).filter((o) => (o.data_producao || day) === day).length} OFs` }),
    ]);
    const body = el('div', { class: 'sbox-b', style: 'display:flex;flex-direction:column;gap:8px;min-height:140px;' });
    body.dataset.day = day;

    body.addEventListener('dragover', (e) => {
      e.preventDefault();
      body.style.outline = `2px solid var(--accent)`;
      body.style.outlineOffset = '2px';
    });
    body.addEventListener('dragleave', () => {
      body.style.outline = '';
      body.style.outlineOffset = '';
    });
    body.addEventListener('drop', async (e) => {
      e.preventDefault();
      body.style.outline = '';
      body.style.outlineOffset = '';
      const id = e.dataTransfer.getData('text/of-id');
      if (!id) return;
      const of = ofs.find((x) => x.id === id);
      if (!of) return;
      if ((of.data_producao || day) === day) return;
      const r = await api(`/api/ofs/${id}`, { method: 'PUT', body: { data_producao: day } });
      if (!r.ok) return showToast(r.error || 'Falha ao mover', 'error');
      showToast('OF movida', 'success');
      await load();
    });

    const items = (ofs || []).filter((o) => (o.data_producao || day) === day);
    for (const of of items) body.appendChild(renderCard(of));

    box.appendChild(head);
    box.appendChild(body);
    return box;
  }
  function renderCard(of) {
    const [cls, lbl] = tagStatus(of.status);
    const top = el('div', { style: 'display:flex;align-items:center;gap:8px;justify-content:space-between;' });
    const left = el('div', { style: 'display:flex;align-items:center;gap:8px;' });
    const numEl = el('div', { class: 'of-num', text: `OF ${of.numero}` });
    const st = el('span', { class: `tag ${cls}`, text: lbl });
    left.appendChild(numEl);
    left.appendChild(st);
    if (of.urgente) left.appendChild(el('span', { class: 'tag t-ug', text: 'URG' }));

    const act = el('button', {
      class: 'btn-icon',
      text: of.urgente ? '!' : '!',
      onclick: async (e) => {
        e.stopPropagation();
        const r = await api(`/api/ofs/${of.id}`, { method: 'PUT', body: { urgente: !of.urgente } });
        if (!r.ok) return showToast(r.error || 'Falha', 'error');
        showToast(!of.urgente ? 'Marcado urgente' : 'Urgência removida', 'success');
        await load();
      },
    });
    top.appendChild(left);
    top.appendChild(act);

    const desc = el('div', { style: 'font-size:.78rem;color:var(--text2);line-height:1.25;' });
    desc.textContent = of.descricao || (of.clientes?.nome ? of.clientes.nome : '');

    const foot = el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;' });
    if (of.maquinas?.nome) foot.appendChild(el('span', { class: 'tag', style: 'background:var(--s2);border:1px solid var(--border);color:var(--text2);', text: of.maquinas.nome }));
    if (of.quantidade != null) foot.appendChild(el('span', { class: 'tag', style: 'background:var(--s2);border:1px solid var(--border);color:var(--text2);', text: `${of.quantidade} un` }));
    if (of.data_entrega) foot.appendChild(el('span', { class: 'tag', style: 'background:var(--s2);border:1px solid var(--border);color:var(--text2);', text: `Entrega ${String(of.data_entrega).split('-').reverse().join('/')}` }));

    const card = el('div', {
      class: `sbox`,
      style: `padding:12px;border-radius:12px;cursor:pointer;background:linear-gradient(180deg,color-mix(in srgb,var(--surface) 96%,black 4%),var(--surface));${
        of.urgente ? 'border-left:3px solid var(--red);' : ''
      }`,
      onclick: () => openForm(of),
      draggable: 'true',
      ondragstart: (e) => {
        e.dataTransfer.setData('text/of-id', of.id);
        e.dataTransfer.effectAllowed = 'move';
      },
    });

    card.appendChild(top);
    card.appendChild(desc);
    card.appendChild(foot);
    return card;
  }
  function opt(list, value, label) {
    const o = el('option', { value, text: label });
    return o;
  }
  function formOf(of) {
    const f = el('form', { class: 'fg' }, [
      field('Número*', 'numero'),
      select('Cliente', 'cliente_id', meta.clientes.map((c) => ({ v: c.id, t: `${c.codigo} — ${c.nome}` })), true),
      select('Empresa', 'empresa_id', meta.empresas.map((c) => ({ v: c.id, t: `${c.sigla} — ${c.nome}` }))),
      select('Máquina', 'maquina_id', meta.maquinas.map((m) => ({ v: m.id, t: m.nome }))),
      select('Fluxo', 'fluxo_id', meta.fluxos.map((x) => ({ v: x.id, t: x.nome }))),
      select('Status', 'status', ['Em aberto', 'Em produção', 'Concluída', 'Cancelada'].map((s) => ({ v: s, t: s }))),
      field('Entrega', 'data_entrega', false, 'date'),
      field('Produção', 'data_producao', false, 'date'),
      field('Prioridade', 'prioridade', false, 'number'),
      select('Urgente', 'urgente', [
        { v: 'false', t: 'Não' },
        { v: 'true', t: 'Sim' },
      ]),
      field('Quantidade', 'quantidade', false, 'number'),
      area('Descrição', 'descricao', true),
      area('Obs', 'obs', true),
      itensEditor(),
    ]);

    if (of) {
      set(f, 'numero', of.numero);
      set(f, 'cliente_id', of.cliente_id || '');
      set(f, 'empresa_id', of.empresa_id || '');
      set(f, 'maquina_id', of.maquina_id || '');
      set(f, 'fluxo_id', of.fluxo_id || '');
      set(f, 'status', of.status || 'Em aberto');
      set(f, 'data_entrega', of.data_entrega || '');
      set(f, 'data_producao', of.data_producao || '');
      set(f, 'prioridade', of.prioridade ?? 0);
      set(f, 'urgente', of.urgente ? 'true' : 'false');
      set(f, 'quantidade', of.quantidade ?? 0);
      set(f, 'descricao', of.descricao || '');
      set(f, 'obs', of.obs || '');
      setItens(f, of.itens || []);
    } else {
      set(f, 'status', 'Em aberto');
      set(f, 'data_producao', de || iso(new Date()));
      set(f, 'prioridade', 0);
      set(f, 'urgente', 'false');
      set(f, 'quantidade', 0);
      setItens(f, []);
    }
    return f;
  }
  function field(label, name, full = false, type = 'text') {
    return el('div', { class: `mf ${full ? 'fgf' : ''}` }, [el('label', { text: label }), el('input', { name, type, autocomplete: 'off' })]);
  }
  function area(label, name, full = false) {
    return el('div', { class: `mf ${full ? 'fgf' : ''}` }, [el('label', { text: label }), el('textarea', { name, rows: '3' })]);
  }
  function select(label, name, items, full = false) {
    const w = el('div', { class: `mf ${full ? 'fgf' : ''}` }, [el('label', { text: label })]);
    const s = el('select', { name });
    s.appendChild(opt([], '', '—'));
    for (const it of items) s.appendChild(opt([], it.v, it.t));
    w.appendChild(s);
    return w;
  }
  function itensEditor() {
    const box = el('div', { class: 'mf fgf' }, [el('label', { text: 'Itens' })]);
    const table = el('table', { class: 'of-itens-table' });
    table.innerHTML =
      '<thead><tr><th>Descrição</th><th style="width:110px;">Qtd</th><th style="width:70px;"></th></tr></thead><tbody></tbody>';
    const tbd = table.querySelector('tbody');
    const addBtn = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: '+ Item', onclick: () => addItemRow(tbd, { descricao: '', quantidade: 0 }) });
    box.appendChild(table);
    box.appendChild(el('div', { style: 'margin-top:8px;display:flex;justify-content:flex-end;' }, [addBtn]));
    box.dataset.itens = '1';
    return box;
  }
  function addItemRow(tbd, item) {
    const tr = el('tr');
    const tdD = el('td');
    const tdQ = el('td');
    const tdX = el('td', { class: 'tc' });
    const iD = el('input', { value: item.descricao || '' });
    const iQ = el('input', { type: 'number', step: '1', value: String(item.quantidade ?? 0) });
    const bx = el('button', { type: 'button', class: 'btn-icon', text: '✕', onclick: () => tr.remove() });
    tdD.appendChild(iD);
    tdQ.appendChild(iQ);
    tdX.appendChild(bx);
    tr.appendChild(tdD);
    tr.appendChild(tdQ);
    tr.appendChild(tdX);
    tbd.appendChild(tr);
  }
  function getItens(form) {
    const box = form.querySelector('[data-itens="1"]');
    const rows = [...box.querySelectorAll('tbody tr')];
    return rows
      .map((tr) => {
        const [d, q] = tr.querySelectorAll('input');
        return { descricao: d.value.trim(), quantidade: Number(q.value || 0) };
      })
      .filter((x) => x.descricao);
  }
  function setItens(form, itens) {
    const box = form.querySelector('[data-itens="1"]');
    const tbd = box.querySelector('tbody');
    tbd.innerHTML = '';
    for (const it of itens || []) addItemRow(tbd, it);
  }
  function get(form, name) {
    const i = form.querySelector(`[name="${name}"]`);
    return i ? i.value : '';
  }
  function set(form, name, value) {
    const i = form.querySelector(`[name="${name}"]`);
    if (i) i.value = value == null ? '' : String(value);
  }
  async function openForm(of) {
    const f = formOf(of);
    openModal({
      title: of ? `Editar OF ${of.numero}` : 'Nova OF',
      content: f,
      actions: [
        of
          ? {
              label: 'Cancelar OF',
              className: 'btn btn-red',
              onClick: async () => {
                const ok = await confirmModal({ title: 'Cancelar OF', message: 'Confirmar cancelamento?' });
                if (!ok) return;
                const r = await api(`/api/ofs/${of.id}/cancel`, { method: 'POST' });
                if (!r.ok) throw new Error(r.error || 'Falha ao cancelar');
                showToast('OF cancelada', 'success');
                await load();
              },
            }
          : { label: 'Fechar', className: 'btn btn-ghost', onClick: () => {} },
        {
          label: 'Salvar',
          className: 'btn btn-accent',
          onClick: async () => {
            const payload = {
              numero: get(f, 'numero').trim(),
              cliente_id: get(f, 'cliente_id') || null,
              empresa_id: get(f, 'empresa_id') || null,
              maquina_id: get(f, 'maquina_id') || null,
              fluxo_id: get(f, 'fluxo_id') || null,
              status: get(f, 'status') || 'Em aberto',
              data_entrega: get(f, 'data_entrega') || null,
              data_producao: get(f, 'data_producao') || null,
              prioridade: Number(get(f, 'prioridade') || 0),
              urgente: get(f, 'urgente') === 'true',
              quantidade: Number(get(f, 'quantidade') || 0),
              descricao: get(f, 'descricao').trim() || null,
              obs: get(f, 'obs').trim() || null,
              itens: getItens(f),
            };
            if (!payload.numero) throw new Error('Número é obrigatório');
            const r = of
              ? await api(`/api/ofs/${of.id}`, { method: 'PUT', body: payload })
              : await api('/api/ofs', { method: 'POST', body: payload });
            if (!r.ok) throw new Error(r.error || 'Falha ao salvar');
            showToast('Salvo', 'success');
            await load();
          },
        },
      ],
    });
  }
  const onChange = (e) => {
    if (!e.detail?.table || e.detail.table === 'ofs') load().catch(() => {});
  };
  window.addEventListener('sb:change', onChange);
  Promise.resolve()
    .then(loadMeta)
    .then(load)
    .catch((e) => showToast(e.message || 'Erro', 'error'));
  return {
    refresh: load,
    unmount() {
      window.removeEventListener('sb:change', onChange);
    },
  };
}
