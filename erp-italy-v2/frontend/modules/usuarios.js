import { el, toast } from '../lib/ui.js';
import { requireRole } from '../auth.js';

export const usuariosRoute = {
  path: '/admin/usuarios',
  title: 'Usuários',
  async render(ctx) {
    const { sb } = ctx;
    const root = el('div', { class: 'grid', style: 'gap:12px' });

    if (!requireRole('admin')) {
      root.appendChild(el('div', { class: 'card', text: 'Sem acesso.' }));
      return root;
    }

    let rows = [];
    try {
      const { data, error } = await sb.from('app_users').select('*').order('nome');
      if (error) throw error;
      rows = data || [];
    } catch (e) {
      root.appendChild(el('div', { class: 'card', text: String(e && e.message ? e.message : e) }));
      return root;
    }

    const tbl = el('table', { class: 'tbl' });
    const thead = el('thead');
    thead.appendChild(el('tr', {}, [
      el('th', { text: 'Nome' }),
      el('th', { text: 'Role' }),
      el('th', { text: 'Ativo' }),
      el('th', { text: '' }),
    ]));
    tbl.appendChild(thead);

    const tbody = el('tbody');
    rows.forEach((u) => {
      tbody.appendChild(el('tr', {}, [
        el('td', { text: u.nome || '—' }),
        el('td', { text: u.role || '—' }),
        el('td', { text: u.ativo ? 'Sim' : 'Não' }),
        el('td', {}, [
          el('button', {
            class: 'btn btn-ghost',
            type: 'button',
            onclick: async () => {
              const { error } = await sb.from('app_users').update({ ativo: !u.ativo, updated_at: new Date().toISOString() }).eq('id', u.id);
              if (error) return toast(error.message, 'bad');
              toast('Atualizado', 'ok');
              location.hash = location.hash;
            },
          }, [u.ativo ? 'Desativar' : 'Ativar']),
        ]),
      ]));
    });
    tbl.appendChild(tbody);

    root.appendChild(el('div', { class: 'card' }, [
      el('div', { style: 'font-weight:1000;margin-bottom:10px', text: 'Usuários (perfil do sistema)' }),
      el('div', { style: 'overflow:auto' }, [tbl]),
    ]));

    return root;
  },
};

