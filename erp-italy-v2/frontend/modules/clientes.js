import { el, toast } from '../lib/ui.js';
import { renderTable, openFormModal } from './crud.js';

export const clientesRoute = {
  path: '/cadastros/clientes',
  title: 'Clientes',
  async render(ctx) {
    const { sb } = ctx;
    const root = el('div', { class: 'grid', style: 'gap:12px' });

    let rows = [];
    try {
      const { data, error } = await sb.from('clientes').select('*').order('nome');
      if (error) throw error;
      rows = data || [];
    } catch (e) {
      root.appendChild(el('div', { class: 'card', text: String(e && e.message ? e.message : e) }));
      return root;
    }

    const table = renderTable({
      title: 'Clientes',
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'uf', label: 'UF' },
        { key: 'tel', label: 'Telefone' },
      ],
      rows,
      onAdd: () => openFormModal({
        title: 'Novo cliente',
        initial: { nome: '', cidade: '', uf: '', tel: '', email: '', end: '', obs: '' },
        fields: [
          { key: 'nome', label: 'Nome', placeholder: 'Ex: MÓVEIS RUIZ' },
          { key: 'cidade', label: 'Cidade' },
          { key: 'uf', label: 'UF', placeholder: 'PR' },
          { key: 'tel', label: 'Telefone' },
          { key: 'email', label: 'E-mail' },
          { key: 'end', label: 'Endereço' },
          { key: 'obs', label: 'Obs', type: 'textarea' },
        ],
        onSubmit: async (v) => {
          const payload = { ...v, updated_at: new Date().toISOString() };
          const { error } = await sb.from('clientes').insert([payload]);
          if (error) throw error;
          toast('Cliente criado', 'ok');
          location.hash = location.hash;
        },
      }),
      onEdit: (r) => openFormModal({
        title: 'Editar cliente',
        initial: r,
        fields: [
          { key: 'nome', label: 'Nome' },
          { key: 'cidade', label: 'Cidade' },
          { key: 'uf', label: 'UF' },
          { key: 'tel', label: 'Telefone' },
          { key: 'email', label: 'E-mail' },
          { key: 'end', label: 'Endereço' },
          { key: 'obs', label: 'Obs', type: 'textarea' },
        ],
        onSubmit: async (v) => {
          const payload = { ...v, updated_at: new Date().toISOString() };
          const { error } = await sb.from('clientes').update(payload).eq('id', r.id);
          if (error) throw error;
          toast('Cliente atualizado', 'ok');
          location.hash = location.hash;
        },
      }),
      onDelete: async (r) => {
        if (!confirm(`Excluir cliente "${r.nome}"?`)) return;
        const { error } = await sb.from('clientes').delete().eq('id', r.id);
        if (error) return toast(error.message, 'bad');
        toast('Cliente excluído', 'ok');
        location.hash = location.hash;
      },
    });

    root.appendChild(table);
    return root;
  },
};

