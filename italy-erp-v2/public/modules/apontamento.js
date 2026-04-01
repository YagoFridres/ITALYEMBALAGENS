import { openModal } from '../components/modals.js';
import { showToast } from '../components/toast.js';
import { renderTable } from '../components/table.js';

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDur(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
}

export function mountApontamento({ root, api, sb }) {
  const wrap = el('div');
  root.innerHTML = '';
  root.appendChild(wrap);

  const header = el('div', { class: 'sbox' }, [
    el('div', { class: 'sbox-h' }, [el('div', { text: 'Tablets — Apontamento' }), el('div', { class: 'page-sub', text: 'Chão de fábrica' })]),
    el('div', { class: 'sbox-b' }),
  ]);
  wrap.appendChild(header);

  const box = header.querySelector('.sbox-b');
  const controls = el('div', { class: 'g2' });
  box.appendChild(controls);

  const left = el('div', { class: 'sbox' }, [el('div', { class: 'sbox-h', text: 'Seleção' }), el('div', { class: 'sbox-b' })]);
  const right = el('div', { class: 'sbox' }, [el('div', { class: 'sbox-h', text: 'Status da máquina' }), el('div', { class: 'sbox-b' })]);
  controls.appendChild(left);
  controls.appendChild(right);

  const selWrap = left.querySelector('.sbox-b');
  const statWrap = right.querySelector('.sbox-b');

  const selMaq = el('select');
  const inpOper = el('input', { placeholder: 'Operador (opcional)', autocomplete: 'off' });
  const btnReload = el('button', { class: 'btn btn-ghost', text: 'Recarregar', onclick: () => refresh() });
  selWrap.appendChild(el('div', { class: 'ptoolbar' }, [selMaq, inpOper, btnReload]));

  const listWrap = el('div');
  selWrap.appendChild(listWrap);

  const statTop = el('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;' });
  const statLeft = el('div');
  const timerEl = el('div', { class: 'clock', text: '00:00:00' });
  statTop.appendChild(statLeft);
  statTop.appendChild(timerEl);
  statWrap.appendChild(statTop);
  const statBtns = el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;' });
  statWrap.appendChild(statBtns);

  let maquinas = [];
  let maquinaId = '';
  let active = null;
  let tick = null;

  async function loadMaquinas() {
    const { data, error } = await sb.from('maquinas').select('*').order('nome', { ascending: true });
    if (error) throw new Error(error.message);
    maquinas = data || [];
    selMaq.innerHTML = '';
    selMaq.appendChild(el('option', { value: '', text: 'Selecione a máquina' }));
    for (const m of maquinas) selMaq.appendChild(el('option', { value: m.id, text: m.nome }));
  }

  selMaq.addEventListener('change', () => {
    maquinaId = selMaq.value;
    refresh();
  });

  async function refresh() {
    stopTick();
    active = null;
    timerEl.textContent = '00:00:00';
    statLeft.innerHTML = '';
    statBtns.innerHTML = '';
    listWrap.innerHTML = '';
    if (!maquinaId) return;

    const dia = todayISO();
    const [ofsRes, actRes] = await Promise.all([
      api(`/api/ofs?de=${dia}&ate=${dia}&maquina_id=${maquinaId}`),
      api('/api/apontamentos/ativos'),
    ]);
    if (!ofsRes.ok) return showToast(ofsRes.error || 'Falha ao carregar OFs', 'error');
    if (!actRes.ok) return showToast(actRes.error || 'Falha ao carregar apontamentos', 'error');

    active = (actRes.data || []).find((a) => a.maquina_id === maquinaId) || null;
    renderStatus();
    renderOfs(ofsRes.data || []);
    if (active?.inicio) startTick(new Date(active.inicio).getTime());
  }

  function renderStatus() {
    const m = maquinas.find((x) => x.id === maquinaId);
    statLeft.innerHTML = '';
    statLeft.appendChild(el('div', { style: 'font-family:var(--mono);font-weight:800;color:var(--accent);', text: m ? m.nome : '—' }));
    if (active) {
      statLeft.appendChild(el('div', { style: 'font-size:.78rem;color:var(--text2);margin-top:2px;', text: `Rodando: OF ${active.ofs?.numero || '—'}` }));
      statLeft.appendChild(el('div', { style: 'font-size:.72rem;color:var(--text3);margin-top:2px;', text: active.operador ? `Operador: ${active.operador}` : 'Operador: —' }));
      const bFinish = el('button', {
        class: 'btn btn-green',
        text: 'Finalizar',
        onclick: () => finishFlow(),
      });
      statBtns.appendChild(bFinish);
    } else {
      statLeft.appendChild(el('div', { style: 'font-size:.78rem;color:var(--text2);margin-top:2px;', text: 'Livre' }));
    }
  }

  function renderOfs(rows) {
    const actions = (r) => {
      const btn = el('button', {
        class: 'btn btn-accent btn-sm',
        text: active ? 'Ocupado' : 'Iniciar',
        onclick: (e) => {
          e.stopPropagation();
          if (active) return;
          startFlow(r);
        },
      });
      if (active) btn.disabled = true;
      return btn;
    };
    renderTable(listWrap, {
      columns: [
        { label: 'OF', render: (r) => (r.numero ? `OF ${r.numero}` : '—'), align: 'center' },
        { label: 'Descrição', render: (r) => r.descricao || '' },
        { label: 'Qtd', render: (r) => r.quantidade ?? 0, align: 'center' },
        { label: '', render: actions, align: 'center' },
      ],
      rows,
      rowClass: (r) => (r.urgente ? 'row-urg' : ''),
    });
  }

  async function startFlow(of) {
    const operador = inpOper.value.trim() || null;
    const r = await api('/api/apontamentos/start', { method: 'POST', body: { of_id: of.id, maquina_id: maquinaId, operador } });
    if (!r.ok) return showToast(r.error || 'Falha ao iniciar', 'error');
    showToast('Iniciado', 'success');
    await refresh();
  }

  async function finishFlow() {
    if (!active) return;
    const content = el('div', { class: 'fg' }, [
      el('div', { class: 'mf fgf' }, [el('label', { text: 'Quantidade produzida' }), el('input', { name: 'q', type: 'number', step: '1', value: '0' })]),
      el('div', { class: 'mf fgf' }, [el('label', { text: 'Obs' }), el('textarea', { name: 'obs', rows: '3' })]),
    ]);
    openModal({
      title: `Finalizar OF ${active.ofs?.numero || ''}`,
      content,
      actions: [
        { label: 'Cancelar', className: 'btn btn-ghost', onClick: () => {} },
        {
          label: 'Finalizar',
          className: 'btn btn-green',
          onClick: async () => {
            const q = Number(content.querySelector('[name="q"]').value || 0);
            const obs = content.querySelector('[name="obs"]').value.trim() || null;
            const r = await api(`/api/apontamentos/${active.id}/finish`, { method: 'POST', body: { quantidade_produzida: q, obs } });
            if (!r.ok) throw new Error(r.error || 'Falha ao finalizar');
            showToast('Finalizado', 'success');
            await refresh();
          },
        },
      ],
    });
  }

  function startTick(startMs) {
    stopTick();
    tick = setInterval(() => {
      timerEl.textContent = fmtDur(Date.now() - startMs);
    }, 250);
  }

  function stopTick() {
    if (tick) clearInterval(tick);
    tick = null;
  }

  const onChange = (e) => {
    const t = e.detail?.table;
    if (!t || t === 'apontamentos' || t === 'ofs') refresh().catch(() => {});
  };
  window.addEventListener('sb:change', onChange);

  Promise.resolve()
    .then(loadMaquinas)
    .catch((e) => showToast(e.message || 'Erro', 'error'));

  return {
    refresh,
    unmount() {
      stopTick();
      window.removeEventListener('sb:change', onChange);
    },
  };
}
