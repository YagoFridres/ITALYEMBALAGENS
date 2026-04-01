export const store = {
  session: null,
  profile: null,
  ready: false,
};

export function setSyncPill(text, mode = 'neutral') {
  const el = document.getElementById('sync-pill');
  if (!el) return;
  el.textContent = text;
  if (mode === 'ok') el.style.color = 'var(--green)';
  else if (mode === 'warn') el.style.color = 'var(--yellow)';
  else if (mode === 'bad') el.style.color = 'var(--red)';
  else el.style.color = 'var(--text2)';
}

export function setRouteTitle(title) {
  const el = document.getElementById('route-title');
  if (el) el.textContent = title || '';
}

export function setUserBadge(text) {
  const el = document.getElementById('user-badge');
  if (el) el.textContent = text || '—';
}
