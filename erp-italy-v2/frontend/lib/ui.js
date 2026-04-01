export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (k === 'class') node.className = String(v);
    else if (k === 'text') node.textContent = String(v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, String(v));
  });
  (children || []).forEach((c) => {
    if (c === undefined || c === null) return;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

export function toast(text, mode = 'neutral') {
  const id = 'toast';
  let elToast = document.getElementById(id);
  if (!elToast) {
    elToast = document.createElement('div');
    elToast.id = id;
    elToast.style.position = 'fixed';
    elToast.style.bottom = '18px';
    elToast.style.left = '18px';
    elToast.style.maxWidth = 'min(520px, 92vw)';
    elToast.style.padding = '12px 14px';
    elToast.style.borderRadius = '12px';
    elToast.style.border = '1px solid var(--border)';
    elToast.style.background = 'rgba(15,26,47,.96)';
    elToast.style.boxShadow = 'var(--shadow)';
    elToast.style.fontWeight = '900';
    elToast.style.zIndex = '80';
    elToast.style.display = 'none';
    document.body.appendChild(elToast);
  }
  elToast.textContent = text || '';
  elToast.style.display = 'block';
  if (mode === 'ok') elToast.style.color = 'var(--green)';
  else if (mode === 'warn') elToast.style.color = 'var(--yellow)';
  else if (mode === 'bad') elToast.style.color = 'var(--red)';
  else elToast.style.color = 'var(--text)';
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    elToast.style.display = 'none';
  }, 2200);
}

export function modal(contentEl) {
  const root = el('div', { class: 'modal open' });
  const card = el('div', { class: 'modal-card' }, [contentEl]);
  root.appendChild(card);
  root.addEventListener('click', (e) => {
    if (e.target === root) root.remove();
  });
  return {
    open() {
      document.body.appendChild(root);
    },
    close() {
      root.remove();
    },
  };
}
