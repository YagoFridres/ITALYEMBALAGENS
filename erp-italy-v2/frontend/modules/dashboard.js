import { el } from '../lib/ui.js';

export const dashboardRoute = {
  path: '/dashboard',
  title: 'Dashboard',
  async render(ctx) {
    const k1 = el('div', { class: 'card kpi' }, [
      el('div', { class: 'kpi-l', text: 'Usuário' }),
      el('div', { class: 'kpi-v', text: (ctx.profile && ctx.profile.nome) ? ctx.profile.nome : '—' }),
      el('div', { class: 'kpi-s', text: (ctx.profile && ctx.profile.role) ? ctx.profile.role : '' }),
    ]);
    const k2 = el('div', { class: 'card kpi' }, [
      el('div', { class: 'kpi-l', text: 'Clientes' }),
      el('div', { class: 'kpi-v', text: String(ctx.counts.clientes || 0) }),
      el('div', { class: 'kpi-s', text: 'Cadastro' }),
    ]);
    const k3 = el('div', { class: 'card kpi' }, [
      el('div', { class: 'kpi-l', text: 'Chapas' }),
      el('div', { class: 'kpi-v', text: String(ctx.counts.chapas || 0) }),
      el('div', { class: 'kpi-s', text: 'Estoque' }),
    ]);
    const grid = el('div', { class: 'grid grid-3' }, [k1, k2, k3]);

    return el('div', {}, [
      grid,
      el('div', { style: 'height:12px' }),
      el('div', { class: 'card' }, [
        el('div', { style: 'font-weight:1000' , text: 'V2 — Base estável' }),
        el('div', { style: 'margin-top:6px;color:var(--text2);font-weight:800' , text: 'Auth Supabase + Realtime + CRUD modular (sem depender do index.html antigo).' }),
      ]),
    ]);
  },
};

