import { el, toast } from '../lib/ui.js';
import { renderTable, openFormModal } from './crud.js';

export const operadoresRoute = {
  path: '/cadastros/operadores',
  title: 'Operadores',
  async render(ctx) {
    const { sb } = ctx;
    const root = el('div', { class: 'grid', style: 'gap:12px' });

    let rows = [];
    try {
      const { data, error } = await sb.from('operadores').select('*').order('nome');
      if (error) throw error;
      rows = data || [];
    } catch (e) {
      root.appendChild(el('div', { class: 'card', text: String(e && e.message ? e.message : e) }));
      return root;
    }

    root.appendChild(renderTable({
      title: 'Operadores',
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'setor', label: 'Setor' },
        { key: 'mat', label: 'Matrícula' },
        { key: 'ativo', label: 'Ativo', render: (r) => (r.ativo ? 'Sim' : 'Não') },
      ],
      rows,
      onAdd: () => openFormModal({
        title: 'Novo operador',
        initial: { nome: '', setor: '', mat: '', ativo: true, obs: '' },
        fields: [
          { key: 'nome', label: 'Nome' },
          { key: 'setor', label: 'Setor' },
          { key: 'mat', label: 'Matrícula' },
          { key: 'obs', label: 'Obs', type: 'textarea' },
        ],
        onSubmit: async (v) => {
          const { error } = await sb.from('operadores').insert([{ ...v, ativo: true, updated_at: new Date().toISOString() }]);
          if (error) throw error;
          toast('Operador criado', 'ok');
          location.hash = location.hash;
        },
      }),
      onEdit: (r) => openFormModal({
        title: 'Editar operador',
        initial: r,
        fields: [
          { key: 'nome', label: 'Nome' },
          { key: 'setor', label: 'Setor' },
          { key: 'mat', label: 'Matrícula' },
          { key: 'obs', label: 'Obs', type: 'textarea' },
        ],
        onSubmit: async (v) => {
          const { error } = await sb.from('operadores').update({ ...v, updated_at: new Date().toISOString() }).eq('id', r.id);
          if (error) throw error;
          toast('Operador atualizado', 'ok');
          location.hash = location.hash;
        },
      }),
      onDelete: async (r) => {
        if (!confirm(`Excluir operador "${r.nome}"?`)) return;
        const { error } = await sb.from('operadores').delete().eq('id', r.id);
        if (error) return toast(error.message, 'bad');
        toast('Operador excluído', 'ok');
        location.hash = location.hash;
      },
    }));

    return root;
  },
};

