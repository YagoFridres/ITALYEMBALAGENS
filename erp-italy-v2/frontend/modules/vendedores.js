import { el, toast } from '../lib/ui.js';
import { renderTable, openFormModal } from './crud.js';

export const vendedoresRoute = {
  path: '/cadastros/vendedores',
  title: 'Vendedores',
  async render(ctx) {
    const { sb } = ctx;
    const root = el('div', { class: 'grid', style: 'gap:12px' });

    let rows = [];
    try {
      const { data, error } = await sb.from('vendedores').select('*').order('nome');
      if (error) throw error;
      rows = data || [];
    } catch (e) {
      root.appendChild(el('div', { class: 'card', text: String(e && e.message ? e.message : e) }));
      return root;
    }

    root.appendChild(renderTable({
      title: 'Vendedores',
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'tel', label: 'Telefone' },
        { key: 'email', label: 'E-mail' },
        { key: 'reg', label: 'Região' },
      ],
      rows,
      onAdd: () => openFormModal({
        title: 'Novo vendedor',
        initial: { nome: '', tel: '', email: '', reg: '' },
        fields: [
          { key: 'nome', label: 'Nome' },
          { key: 'tel', label: 'Telefone' },
          { key: 'email', label: 'E-mail' },
          { key: 'reg', label: 'Região' },
        ],
        onSubmit: async (v) => {
          const { error } = await sb.from('vendedores').insert([{ ...v, updated_at: new Date().toISOString() }]);
          if (error) throw error;
          toast('Vendedor criado', 'ok');
          location.hash = location.hash;
        },
      }),
      onEdit: (r) => openFormModal({
        title: 'Editar vendedor',
        initial: r,
        fields: [
          { key: 'nome', label: 'Nome' },
          { key: 'tel', label: 'Telefone' },
          { key: 'email', label: 'E-mail' },
          { key: 'reg', label: 'Região' },
        ],
        onSubmit: async (v) => {
          const { error } = await sb.from('vendedores').update({ ...v, updated_at: new Date().toISOString() }).eq('id', r.id);
          if (error) throw error;
          toast('Vendedor atualizado', 'ok');
          location.hash = location.hash;
        },
      }),
      onDelete: async (r) => {
        if (!confirm(`Excluir vendedor "${r.nome}"?`)) return;
        const { error } = await sb.from('vendedores').delete().eq('id', r.id);
        if (error) return toast(error.message, 'bad');
        toast('Vendedor excluído', 'ok');
        location.hash = location.hash;
      },
    }));

    return root;
  },
};

