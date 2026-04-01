function ensureOverlay() {
  let overlay = document.querySelector('.modal-overlay');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeTopModal();
  });
  document.body.appendChild(overlay);
  return overlay;
}

const stack = [];

function closeTopModal() {
  const top = stack.pop();
  if (!top) return;
  top.overlay.classList.remove('open');
  top.overlay.innerHTML = '';
  if (stack.length) stack[stack.length - 1].overlay.classList.add('open');
}

export function openModal({ title, content, actions = [] }) {
  const overlay = ensureOverlay();
  overlay.classList.add('open');
  overlay.innerHTML = '';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const close = document.createElement('button');
  close.className = 'close-btn';
  close.type = 'button';
  close.textContent = '×';
  close.addEventListener('click', closeTopModal);

  const h2 = document.createElement('h2');
  h2.textContent = title || '';

  const body = document.createElement('div');
  if (typeof content === 'string') body.innerHTML = content;
  else if (content) body.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  for (const act of actions) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = act.className || 'btn btn-ghost';
    b.textContent = act.label || 'OK';
    b.addEventListener('click', async () => {
      const r = act.onClick ? await act.onClick() : null;
      if (act.close !== false) closeTopModal();
      return r;
    });
    footer.appendChild(b);
  }

  modal.appendChild(close);
  modal.appendChild(h2);
  modal.appendChild(body);
  modal.appendChild(footer);
  overlay.appendChild(modal);

  stack.push({ overlay, modal });

  return { close: closeTopModal, overlay, modal, body, footer };
}

export function confirmModal({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' }) {
  return new Promise((resolve) => {
    openModal({
      title,
      content: `<div style="font-size:.82rem;color:var(--text2);line-height:1.45;">${String(message || '')}</div>`,
      actions: [
        { label: cancelLabel, className: 'btn btn-ghost', onClick: () => resolve(false) },
        { label: confirmLabel, className: 'btn btn-red', onClick: () => resolve(true) },
      ],
    });
  });
}
