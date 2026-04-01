let toastEl = null;
let toastTimer = null;

function ensureToast() {
  if (toastEl) return toastEl;
  toastEl = document.createElement('div');
  toastEl.className = 'toast';
  document.body.appendChild(toastEl);
  return toastEl;
}

export function showToast(message, kind = 'success') {
  const el = ensureToast();
  const colors = {
    success: ['var(--green)', 'var(--green)'],
    error: ['var(--red)', 'var(--red)'],
    warn: ['var(--yellow)', 'var(--yellow)'],
    info: ['var(--accent)', 'var(--accent)'],
  };
  const [border, color] = colors[kind] || colors.success;

  el.style.borderColor = border;
  el.style.color = color;
  el.textContent = String(message || '');

  clearTimeout(toastTimer);
  el.classList.add('show');
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
