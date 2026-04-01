import { el, toast } from '../lib/ui.js';
import { renderTable, openFormModal } from './crud.js';

export const fornecedoresRoute = {
  path: '/cadastros/fornecedores',
  title: 'Fornecedores',
  async render(ctx) {
    const { sb } = ctx;
    const root = el('div', { class: 'grid', style: 'gap:12px' });

    let rows = [];
    try {
      const { data, error } = await sb.from('fornecedores').select('*').order('nome');
      if (error) throw error;
      rows = data || [];
    } catch (e) {
      root.appendChild(el('div', { class: 'card', text: String(e && e.message ? e.message : e) }));
      return root;
    }

    root.appendChild(renderTable({
      title: 'Fornecedores',
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'uf', label: 'UF' },
        { key: 'tel', label: 'Telefone' },
      ],
      rows,
      onAdd: () => openFormModal({
        title: 'Novo fornecedor',
        initial: { nome: '', cnpj: '', tel: '', email: '', cidade: '', uf: '', end: '', obs: '' },
        fields: [
          { key: 'nome', label: 'Nome' },
          { key: 'cnpj', label: 'CNPJ' },
          { key: 'tel', label: 'Telefone' },
          { key: 'email', label: 'E-mail' },
          { key: 'cidade', label: 'Cidade' },
          { key: 'uf', label: 'UF' },
          { key: 'end', label: 'Endereço' },
          { key: 'obs', label: 'Obs', type: 'textarea' },
        ],
        onSubmit: async (v) => {
          const { error } = await sb.from('fornecedores').insert([{ ...v, updated_at: new Date().toISOString() }]);
          if (error) throw error;
          toast('Fornecedor criado', 'ok');
          location.hash = location.hash;
        },
      }),
      onEdit: (r) => openFormModal({
        title: 'Editar fornecedor',
        initial: r,
        fields: [
          { key: 'nome', label: 'Nome' },
          { key: 'cnpj', label: 'CNPJ' },
          { key: 'tel', label: 'Telefone' },
          { key: 'email', label: 'E-mail' },
          { key: 'cidade', label: 'Cidade' },
          { key: 'uf', label: 'UF' },
          { key: 'end', label: 'Endereço' },
          { key: 'obs', label: 'Obs', type: 'textarea' },
        ],
        onSubmit: async (v) => {
          const { error } = await sb.from('fornecedores').update({ ...v, updated_at: new Date().toISOString() }).eq('id', r.id);
          if (error) throw error;
          toast('Fornecedor atualizado', 'ok');
          location.hash = location.hash;
        },
      }),
      onDelete: async (r) => {
        if (!confirm(`Excluir fornecedor "${r.nome}"?`)) return;
        const { error } = await sb.from('fornecedores').delete().eq('id', r.id);
        if (error) return toast(error.message, 'bad');
        toast('Fornecedor excluído', 'ok');
        location.hash = location.hash;
      },
    }));

    return root;
  },
};

