import { el, toast } from '../lib/ui.js';
import { renderTable, openFormModal } from './crud.js';

export const chapasRoute = {
  path: '/estoques/chapas',
  title: 'Estoque — Chapas',
  async render(ctx) {
    const { sb } = ctx;
    const root = el('div', { class: 'grid', style: 'gap:12px' });

    let rows = [];
    try {
      const { data, error } = await sb.from('chapas').select('*').order('nome');
      if (error) throw error;
      rows = data || [];
    } catch (e) {
      root.appendChild(el('div', { class: 'card', text: String(e && e.message ? e.message : e) }));
      return root;
    }

    root.appendChild(renderTable({
      title: 'Chapas',
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'nome', label: 'Nome' },
        { key: 'tam', label: 'Tamanho' },
        { key: 'qtd', label: 'Qtd', render: (r) => String(r.qtd ?? 0) },
        { key: 'min', label: 'Mín', render: (r) => String(r.min ?? 0) },
      ],
      rows,
      onAdd: () => openFormModal({
        title: 'Nova chapa',
        initial: { codigo: '', forn: '', nom: '', tam: '', comp: null, larg: null, nome: '', qual: '', nf: '', qtd: 0, val: 0, min: 0, vincada: false, vincos: '' },
        fields: [
          { key: 'codigo', label: 'ID/Código', placeholder: 'CE001' },
          { key: 'forn', label: 'Fornecedor' },
          { key: 'nom', label: 'Abrev./Tipo' },
          { key: 'tam', label: 'Tamanho' },
          { key: 'nome', label: 'Nome' },
          { key: 'qual', label: 'Qualidade' },
          { key: 'nf', label: 'NF' },
          { key: 'qtd', label: 'Qtd', type: 'number' },
          { key: 'min', label: 'Mín', type: 'number' },
          { key: 'val', label: 'Valor unit.', type: 'number' },
          { key: 'vincos', label: 'Vincos', type: 'textarea' },
        ],
        onSubmit: async (v) => {
          const payload = { ...v, updated_at: new Date().toISOString() };
          const { error } = await sb.from('chapas').insert([payload]);
          if (error) throw error;
          toast('Chapa criada', 'ok');
          location.hash = location.hash;
        },
      }),
      onEdit: (r) => openFormModal({
        title: 'Editar chapa',
        initial: r,
        fields: [
          { key: 'codigo', label: 'ID/Código' },
          { key: 'forn', label: 'Fornecedor' },
          { key: 'nom', label: 'Abrev./Tipo' },
          { key: 'tam', label: 'Tamanho' },
          { key: 'nome', label: 'Nome' },
          { key: 'qual', label: 'Qualidade' },
          { key: 'nf', label: 'NF' },
          { key: 'qtd', label: 'Qtd', type: 'number' },
          { key: 'min', label: 'Mín', type: 'number' },
          { key: 'val', label: 'Valor unit.', type: 'number' },
          { key: 'vincos', label: 'Vincos', type: 'textarea' },
        ],
        onSubmit: async (v) => {
          const payload = { ...v, updated_at: new Date().toISOString() };
          const { error } = await sb.from('chapas').update(payload).eq('id', r.id);
          if (error) throw error;
          toast('Chapa atualizada', 'ok');
          location.hash = location.hash;
        },
      }),
      onDelete: async (r) => {
        if (!confirm(`Excluir chapa "${r.codigo || r.nome}"?`)) return;
        const { error } = await sb.from('chapas').delete().eq('id', r.id);
        if (error) return toast(error.message, 'bad');
        toast('Chapa excluída', 'ok');
        location.hash = location.hash;
      },
    }));

    return root;
  },
};

