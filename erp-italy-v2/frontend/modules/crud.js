import { el, modal, toast } from '../lib/ui.js';

export function renderTable({ title, columns, rows, onAdd, onEdit, onDelete }) {
  const head = el('div', { class: 'row', style: 'margin-bottom:10px' }, [
    el('div', { style: 'font-weight:1000', text: title }),
    el('div', { class: 'spacer' }),
    onAdd ? el('button', { class: 'btn btn-primary', type: 'button', onclick: onAdd }, ['＋ Novo']) : null,
  ]);

  const tbl = el('table', { class: 'tbl' });
  const thead = el('thead');
  thead.appendChild(el('tr', {}, [
    ...columns.map((c) => el('th', { text: c.label })),
    el('th', { text: '' }),
  ]));
  tbl.appendChild(thead);

  const tbody = el('tbody');
  rows.forEach((r) => {
    tbody.appendChild(el('tr', {}, [
      ...columns.map((c) => el('td', { text: c.render ? c.render(r) : (r[c.key] ?? '') })),
      el('td', {}, [
        el('div', { class: 'row', style: 'justify-content:flex-end' }, [
          onEdit ? el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => onEdit(r) }, ['Editar']) : null,
          onDelete ? el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => onDelete(r) }, ['Excluir']) : null,
        ].filter(Boolean)),
      ]),
    ]));
  });
  tbl.appendChild(tbody);

  return el('div', { class: 'card' }, [head, el('div', { style: 'overflow:auto' }, [tbl])]);
}

export function openFormModal({ title, fields, initial, onSubmit }) {
  const state = { ...initial };

  const form = el('div', {}, [
    el('div', { class: 'modal-title', text: title }),
    el('div', { style: 'height:10px' }),
    ...fields.flatMap((f) => {
      const input = el(f.type === 'textarea' ? 'textarea' : 'input', {
        class: 'in',
        value: state[f.key] ?? '',
        placeholder: f.placeholder || '',
      });
      if (f.type === 'textarea') input.rows = 3;
      if (f.type === 'number') input.type = 'number';
      input.addEventListener('input', () => {
        state[f.key] = f.type === 'number' ? (input.value === '' ? null : Number(input.value)) : input.value;
      });
      return [
        el('label', { class: 'lbl', text: f.label }),
        input,
      ];
    }),
    el('div', { style: 'height:12px' }),
    el('div', { class: 'row', style: 'justify-content:flex-end' }, [
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => m.close() }, ['Cancelar']),
      el('button', { class: 'btn btn-primary', type: 'button', onclick: async () => {
        try {
          await onSubmit(state);
          m.close();
        } catch (e) {
          toast(String(e && e.message ? e.message : e), 'bad');
        }
      } }, ['Salvar']),
    ]),
  ]);

  const m = modal(form);
  m.open();
}
