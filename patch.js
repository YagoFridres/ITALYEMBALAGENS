// LIMPEZA DE OVERLAYS ÓRFÃOS — executar imediatamente
(function limparOverlaysOrfaos() {
  var _OVERLAY_GRACE = 500;
  try { if (!window.__overlayTimestamps) window.__overlayTimestamps = {}; } catch (_) {}
  function removerOrfaos() {
    var removed = 0;
    try {
      document.querySelectorAll('div').forEach(function(el) {
        try {
          var s = el && el.style ? el.style : {};
          var computed = window.getComputedStyle ? window.getComputedStyle(el) : null;
          var pos = String((s && s.position) || (computed && computed.position) || '').trim().toLowerCase();
          var isFixed = pos === 'fixed';
          var inset = String((s && s.inset) || (computed && computed.inset) || '').trim();
          var cobreTudo = inset === '0' || (String(s.top) === '0px' || String(s.top) === '0') && (String(s.left) === '0px' || String(s.left) === '0') && (String(s.right) === '0px' || String(s.right) === '0') && (String(s.bottom) === '0px' || String(s.bottom) === '0');
          var semConteudo = (!el.children || el.children.length === 0) && !String(el.textContent || '').trim();
          var z = parseInt(String((s && s.zIndex) || (computed && computed.zIndex) || '0'), 10);
          var altaZIndex = Number.isFinite(z) && z > 9000;
          var display = String((computed && computed.display) || '').trim().toLowerCase();
          var visible = display !== 'none';
          var key = '';
          try { key = String(el.id || el.className || '').trim(); } catch (_) { key = ''; }
          if (!key) return;
          try {
            if (!window.__overlayTimestamps[key]) {
              window.__overlayTimestamps[key] = Date.now();
              return;
            }
          } catch (_) {}
          var age = 0;
          try { age = Date.now() - (window.__overlayTimestamps[key] || 0); } catch (_) { age = 0; }
          if (visible && age >= _OVERLAY_GRACE && isFixed && (cobreTudo || altaZIndex) && semConteudo) {
            try { console.warn('[PATCH] Removendo overlay órfão:', el.id || el.className || '(sem id)'); } catch (_) {}
            el.remove();
            removed++;
          }
        } catch (_) {}
      });
    } catch (_) {}

    try {
      ['hub-inteligencia-wrap-overlay', 'modal-overlay', 'backdrop', '_modal-backdrop'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
          try {
            var computed = window.getComputedStyle ? window.getComputedStyle(el) : null;
            var display = String((computed && computed.display) || '').trim().toLowerCase();
            var visible = display !== 'none';
            if (!window.__overlayTimestamps[id]) { window.__overlayTimestamps[id] = Date.now(); return; }
            var age = Date.now() - (window.__overlayTimestamps[id] || 0);
            if (visible && age >= _OVERLAY_GRACE) {
              try { console.warn('[PATCH] Removendo:', id); } catch (_) {}
              el.remove();
              removed++;
            }
          } catch (_) {}
        }
      });
    } catch (_) {}

    if (removed > 0) {
      try { document.body && (document.body.style.pointerEvents = ''); } catch (_) {}
      try { document.body && (document.body.style.overflow = ''); } catch (_) {}
      try { document.documentElement && (document.documentElement.style.overflow = ''); } catch (_) {}
    }
  }

  function killObservers() {
    try { if (window._hubObs && typeof window._hubObs.disconnect === 'function') window._hubObs.disconnect(); } catch (_) {}
    try { window._hubObs = null; } catch (_) {}
    try { if (window.__patchHubIntelObs && typeof window.__patchHubIntelObs.disconnect === 'function') window.__patchHubIntelObs.disconnect(); } catch (_) {}
    try { window.__patchHubIntelObs = null; } catch (_) {}
  }

  function run() {
    killObservers();
    removerOrfaos();
  }

  try { run(); } catch (_) {}
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      run();
      setTimeout(run, 700);
    });
  } else {
    setTimeout(run, 50);
    setTimeout(run, 700);
  }

  if (!window.__patchEscOverlayCleaner) {
    window.__patchEscOverlayCleaner = true;
    document.addEventListener('keydown', function(e) {
      try {
        if (!e || e.key !== 'Escape') return;
        window._ofRapidaEditandoId = null;
        run();
      } catch (_) {}
    }, true);
  }
})();

(function() {
  try {
    if (typeof window.toastHotfix !== 'function') {
      window.toastHotfix = function(msg) {
        var s = '';
        try { s = String(msg == null ? '' : msg); } catch (_) { s = ''; }
        try {
          if (typeof window._notificacaoOF === 'function') return window._notificacaoOF(s, 'sucesso');
        } catch (_) {}
        try { alert(s); } catch (_) {}
      };
    }
  } catch (_) {}

  try {
    if (!document.getElementById('patch-modal-solid-style')) {
      var st = document.createElement('style');
      st.id = 'patch-modal-solid-style';
      st.textContent = ''
        + '.modal,.modal-content,[class*="modal"],'
        + '#modal-nova-tinta,#modal-novo-material,'
        + '[id*="modal"]>div{background:var(--bg2,#1a1a2e)!important;}';
      document.head.appendChild(st);
    }
  } catch (_) {}
})();

window.addEventListener('error', function(e) {
  try { console.error('[PATCH ERROR GLOBAL]', e && e.message, e && e.filename, e && e.lineno); } catch (_) {}
});
window.addEventListener('unhandledrejection', function(e) {
  try {
    var r = e && e.reason;
    console.error('[PATCH PROMISE ERROR]', r && r.message ? r.message : r);
  } catch (_) {}
});

(function() {
  if (window.__patchFixImgsSrcInstalled) return;
  window.__patchFixImgsSrcInstalled = true;
  function _fixImgsSrc() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('img')).forEach(function(img) {
        try {
          if (!img || img.dataset && img.dataset.patchImgFix === '1') return;
          var src = String(img.getAttribute('src') || '').trim();
          if (!src || src === '[]' || src === 'null' || src === 'undefined' || src.endsWith('/[]')) {
            try { img.removeAttribute('src'); } catch (_) {}
            try { img.style.display = 'none'; } catch (_) {}
            try { img.dataset.patchImgFix = '1'; } catch (_) {}
          }
        } catch (_) {}
      });
    } catch (_) {}
  }
  try { _fixImgsSrc(); } catch (_) {}
  try { setInterval(_fixImgsSrc, 2000); } catch (_) {}
})();
(function() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
  var _logOrig = console.log.bind(console);
  var _warnOrig = console.warn.bind(console);
  console.log = function() {
    var msg = String(arguments[0] || '');
    if (
      msg.indexOf('[ERRO]') === 0 ||
      msg.indexOf('[CRITICO]') === 0 ||
      msg.indexOf('[CRÍTICO]') === 0 ||
      msg.indexOf('[COM]') === 0 ||
      msg.indexOf('[COM PATCH]') === 0 ||
      msg.indexOf('[IMPRIMIR]') === 0 ||
      msg.indexOf('[HIST CLI]') === 0 ||
      msg.indexOf('[PAINEL CLI]') === 0
    ) {
      return _logOrig.apply(console, arguments);
    }
  };
  console.warn = function() {
    var msg = String(arguments[0] || '');
    if (msg.indexOf('[PATCH]') >= 0 || msg.toLowerCase().indexOf('overlay') >= 0) return;
    return _warnOrig.apply(console, arguments);
  };
})();

(function() {
  try { document.getElementById('patch-light-mode')?.remove(); } catch (_) {}
  try {
    var _existeStyleClaro = document.getElementById('patch-light-mode-v2');
    if (_existeStyleClaro) return;
    var s = document.createElement('style');
    s.id = 'patch-light-mode-v2';
    s.textContent = ''
      + 'body.light,body[data-theme=\"light\"]{color:#111!important;background:#f5f5f5!important;}'
      + 'body.light .card,body.light .modal-content,body.light [class*=\"modal\"] > div,'
      + 'body[data-theme=\"light\"] .card,body[data-theme=\"light\"] .modal-content,body[data-theme=\"light\"] [class*=\"modal\"] > div'
      + '{background:#fff!important;color:#111!important;}'
      + 'body.light input,body.light select,body.light textarea,'
      + 'body[data-theme=\"light\"] input,body[data-theme=\"light\"] select,body[data-theme=\"light\"] textarea'
      + '{color:#111!important;background:#fff!important;border-color:#ddd!important;}'
      + 'body.light .sidebar,body[data-theme=\"light\"] .sidebar{background:#fff!important;}'
      + 'body.light .topbar,body[data-theme=\"light\"] .topbar{background:#fff!important;}';
    document.head.appendChild(s);
  } catch (_) {}
})();
(function() {
  if (window.__patchFetchGuardInstalled) return;
  window.__patchFetchGuardInstalled = true;
  var _fetchOrig = window.fetch;
  if (typeof _fetchOrig !== 'function') return;
  window.fetch = function(input, init) {
    try {
      var url = '';
      try { url = input && typeof input === 'object' && input.url ? String(input.url) : String(input || ''); } catch (_) { url = ''; }
      var u = String(url || '');
      if (
        u.indexOf('undefined') >= 0 ||
        u.indexOf('null') >= 0 ||
        u.indexOf('[object') >= 0 ||
        u.indexOf('/[]') >= 0
      ) {
        try { console.warn('[GUARD] URL inválida bloqueada:', u.substring(0, 140)); } catch (_) {}
        try { return Promise.resolve(new Response('{}', { status: 400, headers: { 'Content-Type': 'application/json' } })); } catch (_) { return Promise.resolve({ ok: false, status: 400 }); }
      }
    } catch (_) {}
    return _fetchOrig.apply(this, arguments);
  };
})();
if (!window._debounce) {
  window._debounce = function(fn, delay) {
    var timer = null;
    return function() {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
    };
  };
}
try {
console.log('[PATCH] versão ' + Date.now() + ' carregado');
/* patch.js - Italy Embalagens ERP v2 */
(function() {
  'use strict';

  try {
    var cssM = `
/* ════════════════════════════════════════════
   ITALY EMBALAGENS ERP — CSS RESPONSIVO
   Adapta o sistema PC para mobile/tablet.
   Não cria novo sistema. Mesmas APIs/dados.
   ════════════════════════════════════════════ */

/* ── MOBILE ATÉ 768px ─────────────────────── */
@media (max-width: 768px) {

  /* 1. ESTRUTURA: sidebar oculta, conteúdo full width */
  .sidebar, #sidebar, nav.side, .side-nav,
  [class*="sidebar-"]:not(#mobile-bottom-nav),
  [id*="sidebar"]:not(#mobile-bottom-nav) {
    display: none !important;
  }
  .main-content, #main-content, .content,
  #content, [class*="main-content"],
  [class*="content-area"], .app-body, #app-body {
    margin-left: 0 !important;
    padding: 8px 8px 68px !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
  }

  /* Todas as pages sem overflow lateral */
  [id^="page-"], .page, [data-page] {
    max-width: 100% !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }

  /* 2. HEADER COMPACTO */
  .top-bar, #top-bar, .header-bar, #header-bar,
  [class*="top-bar"], [class*="topbar"] {
    padding: 6px 10px !important;
    flex-wrap: wrap !important;
    gap: 4px !important;
    font-size: 12px !important;
  }
  .empresa-tabs, [class*="empresa-tab"],
  .emp-sel-bar { display: none !important; }

  /* 3. HOTBAR — sempre visível no rodapé */
  #mobile-bottom-nav, .mobile-bottom-nav {
    display: flex !important;
    position: fixed !important;
    bottom: 0 !important; left: 0 !important; right: 0 !important;
    z-index: 1000 !important;
    background: #0b1220 !important;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
  }
  body { padding-bottom: 64px !important; }

  /* 4. INPUTS — sem zoom no iOS */
  input, select, textarea { font-size: 16px !important; }
  input[type="date"], input[type="time"] { font-size: 14px !important; }

  /* 5. BOTÕES MAIORES PARA TOQUE */
  button, .btn, [class*="btn-"], [role="button"] {
    min-height: 40px !important;
    padding: 8px 12px !important;
    font-size: 13px !important;
    touch-action: manipulation !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  /* 6. TABELAS → CARDS */
  table:not(.no-card):not([class*="kanban"]) {
    display: block !important; width: 100% !important;
  }
  table:not(.no-card) thead { display: none !important; }
  table:not(.no-card) tbody { display: block !important; }
  table:not(.no-card) tr {
    display: block !important;
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 10px !important;
    margin-bottom: 8px !important;
    padding: 10px !important;
  }
  table:not(.no-card) td {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 3px 0 !important;
    border: none !important;
    font-size: 12px !important;
    min-height: 20px !important;
  }
  /* Esconder colunas menos importantes */
  table:not(.no-card) td:nth-child(n+8) { display: none !important; }
  /* Coluna de ações sempre visível */
  table:not(.no-card) td:last-child {
    display: flex !important;
    justify-content: flex-end !important;
    padding-top: 8px !important;
    border-top: 1px solid rgba(255,255,255,0.06) !important;
    margin-top: 4px !important;
  }

  /* 7. MODAIS → BOTTOM SHEET */
  [id*="modal"] {
    align-items: flex-end !important;
    padding: 0 !important;
  }
  [id*="modal"] > div,
  [id*="modal"] > .modal-content,
  .modal-content, .modal-body {
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 18px 18px 0 0 !important;
    max-height: 93vh !important;
    overflow-y: auto !important;
    margin: 0 !important;
  }

  /* 8. KANBAN — scroll horizontal */
  .kb-board, .kb-maq-board, [class*="kb-board"] {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-snap-type: x proximity !important;
    gap: 10px !important;
  }
  .kb-col, [class*="kb-col"] {
    min-width: 270px !important;
    flex-shrink: 0 !important;
    scroll-snap-align: start !important;
  }
  .kb-card, [class*="kb-card"] {
    padding: 12px !important;
    cursor: pointer !important;
  }
  .kb-img, .of-ln-img { width: 44px !important; height: 44px !important; }

  /* 9. TOOLBAR DO PCP */
  [class*="pcp-acoes"], [id*="pcp-acoes"],
  [class*="toolbar-pcp"], [class*="pcp-toolbar"] {
    flex-wrap: wrap !important; gap: 6px !important;
  }
  [class*="pcp-acoes"] > button,
  [id*="pcp-acoes"] > button {
    flex: 1 1 calc(50% - 6px) !important;
    min-width: 0 !important;
  }

  /* 10. FILTROS EM COLUNA */
  [class*="filtros-"], [class*="-filtros"],
  [class*="filter-bar"] {
    flex-direction: column !important; gap: 6px !important;
  }
  [class*="filtros-"] select,
  [class*="filter-bar"] select { width: 100% !important; }

  /* 11. CHAT */
  #chat-painel, #painel-chat-grande > div {
    width: 100% !important;
    max-width: 100% !important;
    left: 0 !important; right: 0 !important;
    bottom: 62px !important;
    border-radius: 16px 16px 0 0 !important;
    max-height: 70vh !important;
  }

  /* 12. DASHBOARD */
  canvas, [class*="chart"] {
    max-width: 100% !important; height: auto !important;
  }
  [class*="kpi-cards"], [class*="stats-grid"],
  [class*="dashboard-cards"] {
    grid-template-columns: repeat(2,1fr) !important;
    gap: 8px !important;
  }

  /* 13. AGENDA */
  #agenda-grid { gap: 2px !important; }
  #agenda-grid > div {
    min-height: 55px !important;
    font-size: 10px !important;
    padding: 3px !important;
  }

  /* 14. PROJEÇÃO / GRÁFICOS COM SCROLL */
  #widget-projecao-vendas,
  [id*="grafico"], [id*="chart"] {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  /* 15. IMAGENS */
  img { max-width: 100% !important; height: auto !important; }

  /* 16. TEXTOS */
  h1 { font-size: 18px !important; }
  h2 { font-size: 16px !important; }
  h3 { font-size: 15px !important; }

  /* 17. SCROLLBAR FINA */
  ::-webkit-scrollbar { width: 3px !important; height: 3px !important; }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2) !important;
    border-radius: 3px !important;
  }

  /* 18. FAB não sobrepor hotbar */
  #fab-menu-container { bottom: 72px !important; }

  /* 19. LINHAS OFs POR MÁQUINA */
  .of-linha-row { gap: 6px !important; padding: 8px !important; }
  .of-ln-prod { display: none !important; }

  /* 20. SELETOR DE MÁQUINA */
  #ofmaq-seletor-maquinas {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    flex-wrap: nowrap !important;
    gap: 6px !important;
    padding-bottom: 6px !important;
  }
  #ofmaq-seletor-maquinas button {
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    padding: 8px 14px !important;
    font-size: 13px !important;
  }
}

/* ── CELULAR PEQUENO ATÉ 480px ───────────────── */
@media (max-width: 480px) {
  body { font-size: 12px !important; }
  .main-content, #main-content {
    padding: 6px 6px 68px !important;
  }
  [class*="kpi-cards"], [class*="stats-grid"] {
    grid-template-columns: repeat(2,1fr) !important;
  }
  .kb-col, [class*="kb-col"] { min-width: 250px !important; }
  [id*="modal"] > div { max-height: 96vh !important; }
  h1 { font-size: 16px !important; }
}

/* ── TABLET 769px – 1024px ──────────────────── */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar, #sidebar, [class*="sidebar"] {
    width: 200px !important;
  }
  .main-content, #main-content, [class*="main-content"] {
    margin-left: 200px !important;
  }
  table { overflow-x: auto !important; display: block !important; }
}
`;

    cssM = `
/* ITALY ERP — CSS MOBILE DEFINITIVO v4
   Fonte: sistema PC adaptado. Sem dados mock. Sem páginas legadas. */

@media (max-width: 768px) {

  * { box-sizing: border-box !important; margin-left: 0 !important; }

  .page-body, .ptoolbar, .page-header,
  .content > *, .page > * {
    margin-left: initial !important;
  }

  html, body {
    overflow-x: hidden !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  body {
    padding-bottom: 64px !important;
  }

  .sidebar, #sidebar, nav.side, .side-nav,
  [class*="sidebar"]:not(#mobile-bottom-nav):not(.mobile-bottom-nav),
  .left-panel, #left-panel, .left-menu, #left-menu,
  .nav-left, #nav-left, .left-nav, #left-nav,
  .nav-lateral, #nav-lateral, aside {
    display: none !important;
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
    flex: 0 !important;
    position: fixed !important;
    left: -9999px !important;
  }

  .layout, .content, .page, .page-body {
    margin-left: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .main-content, #main-content,
  .content-wrapper, #content-wrapper,
  .app-main, #app-main,
  .page-content, #page-content,
  .app-content, #app-content,
  .page-wrapper, #page-wrapper,
  [class*="main-content"],
  [class*="content-wrap"],
  [class*="app-content"],
  [class*="content-area"] {
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 8px 10px 72px !important;
    padding-left: 10px !important;
    padding-right: 10px !important;
    padding-bottom: 72px !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    overflow-x: hidden !important;
    position: relative !important;
    left: 0 !important;
  }

  section, [id^="page-"], .page,
  [data-page], .tab-content {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .topbar, #topbar,
  .top-bar, #top-bar, .header-bar,
  [class*="top-bar"], [class*="header-bar"],
  header, #header {
    flex-wrap: wrap !important;
    padding: 6px 8px !important;
    gap: 4px !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .topbar .logo-icon,
  .topbar img, #topbar img,
  .top-bar img, #top-bar img,
  header img, #header img,
  [class*="logo"] img {
    height: 28px !important;
    width: auto !important;
  }

  .topbar-badges { flex-wrap: wrap !important; gap: 4px !important; }
  .tbadge,
  [class*="badge-status"], [class*="status-badge"],
  .badge-atrasados, .badge-urgentes, .badge-concluidos,
  [id*="badge"], [class*="badge"] {
    font-size: 10px !important;
    padding: 3px 6px !important;
    min-width: 0 !important;
  }

  [class*="busca-global"], [id*="busca-global"],
  input[placeholder*="Buscar"], input[placeholder*="buscar"] {
    width: 100% !important;
    flex: 1 1 100% !important;
    order: 10 !important;
  }

  .clock, #clock,
  [class*="hora-atual"], [id*="hora-atual"] {
    display: none !important;
  }

  .empresa-tabs, [class*="empresa-tab"],
  .emp-sel-bar, [data-empresa-selector] {
    display: none !important;
  }

  #mobile-bottom-nav, .mobile-bottom-nav {
    display: flex !important;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    z-index: 1000 !important;
    background: #0b1220 !important;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
    height: 58px !important;
  }

  input, select, textarea {
    font-size: 16px !important;
    max-width: 100% !important;
  }
  input[type="date"], input[type="time"] {
    font-size: 14px !important;
  }

  button, .btn, [class*="btn-"], [role="button"] {
    min-height: 40px !important;
    padding: 8px 12px !important;
    font-size: 13px !important;
    touch-action: manipulation !important;
  }

  table:not(.no-card) {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  table:not(.no-card) thead { display: none !important; }
  table:not(.no-card) tbody { display: block !important; width: 100% !important; }
  table:not(.no-card) tr {
    display: block !important;
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 10px !important;
    margin-bottom: 8px !important;
    padding: 10px !important;
    width: 100% !important;
    overflow: hidden !important;
  }
  table:not(.no-card) td {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 3px 0 !important;
    border: none !important;
    font-size: 12px !important;
    width: 100% !important;
    word-break: break-word !important;
  }
  table:not(.no-card) td:nth-child(n+8) { display: none !important; }
  table:not(.no-card) td:last-child {
    display: flex !important;
    justify-content: flex-end !important;
    padding-top: 8px !important;
    border-top: 1px solid rgba(255,255,255,0.06) !important;
    margin-top: 4px !important;
  }

  #page-estoque #est-table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: 10px !important;
  }
  #page-estoque #est-table-wrap:after {
    content: '→ deslize para ver mais' !important;
    display: block !important;
    text-align: right !important;
    font-size: 10px !important;
    color: #4A90D9 !important;
    padding: 4px !important;
  }
  #page-estoque #est-table-wrap table {
    display: table !important;
    width: max-content !important;
    min-width: 100% !important;
    max-width: none !important;
  }
  #page-estoque #est-table-wrap table thead { display: table-header-group !important; }
  #page-estoque #est-table-wrap table tbody { display: table-row-group !important; }
  #page-estoque #est-table-wrap table tfoot { display: table-footer-group !important; }
  #page-estoque #est-table-wrap table tr { display: table-row !important; padding: 0 !important; margin: 0 !important; background: transparent !important; border-radius: 0 !important; border: none !important; }
  #page-estoque #est-table-wrap table th,
  #page-estoque #est-table-wrap table td {
    display: table-cell !important;
    white-space: nowrap !important;
    vertical-align: middle !important;
    width: auto !important;
  }
  #page-estoque #est-table-wrap table th:first-child,
  #page-estoque #est-table-wrap table td:first-child {
    position: sticky !important;
    left: 0 !important;
    z-index: 2 !important;
    background: #0b1220 !important;
  }

  #page-pcp #pcp-table-wrap,
  #pcp-table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  #page-pcp table.pcp-table,
  table.pcp-table {
    display: table !important;
    width: max-content !important;
    min-width: 100% !important;
    max-width: none !important;
  }
  #page-pcp table.pcp-table thead,
  table.pcp-table thead { display: table-header-group !important; }
  #page-pcp table.pcp-table tbody,
  table.pcp-table tbody { display: table-row-group !important; }
  #page-pcp table.pcp-table tr,
  table.pcp-table tr { display: table-row !important; padding: 0 !important; margin: 0 !important; background: transparent !important; border: none !important; border-radius: 0 !important; }
  #page-pcp table.pcp-table th,
  #page-pcp table.pcp-table td,
  table.pcp-table th,
  table.pcp-table td {
    display: table-cell !important;
    white-space: nowrap !important;
    width: auto !important;
  }

  #page-facas1 table,
  #page-facas2 table,
  #page-cliches table {
    display: table !important;
    width: max-content !important;
    min-width: 100% !important;
    max-width: none !important;
  }
  #page-facas1 table thead,
  #page-facas2 table thead,
  #page-cliches table thead { display: table-header-group !important; }
  #page-facas1 table tbody,
  #page-facas2 table tbody,
  #page-cliches table tbody { display: table-row-group !important; }
  #page-facas1 table tr,
  #page-facas2 table tr,
  #page-cliches table tr { display: table-row !important; padding: 0 !important; margin: 0 !important; background: transparent !important; border: none !important; border-radius: 0 !important; }
  #page-facas1 table th,
  #page-facas1 table td,
  #page-facas2 table th,
  #page-facas2 table td,
  #page-cliches table th,
  #page-cliches table td {
    display: table-cell !important;
    white-space: nowrap !important;
    width: auto !important;
  }

  #page-estoque [class*="toolbar"],
  #page-estoque [class*="acoes"],
  #page-estoque [class*="btn-group"],
  [id*="page-estoque"] > div:first-of-type {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
  }
  #page-estoque button,
  [id*="page-estoque"] button {
    flex: 1 1 calc(50% - 6px) !important;
    min-width: 0 !important;
    font-size: 12px !important;
    padding: 8px 6px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  #page-estoque [class*="filtro"],
  #page-estoque select,
  [id*="page-estoque"] select {
    width: 100% !important;
    margin-bottom: 6px !important;
  }

  #page-orcamentos table td:nth-child(n+8) { display: flex !important; }
  #page-orcamentos table td:last-child { display: flex !important; }

  #modal-calculadora,
  #modal-orcamento-calc,
  [id*="calc-compensacao"] {
    max-height: 92vh !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  #modal-calculadora .modal-footer,
  #modal-calculadora .rodape,
  #modal-orcamento-calc .modal-footer,
  #modal-orcamento-calc .rodape {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    padding: 10px !important;
  }
  #modal-calculadora .modal-footer button,
  #modal-calculadora .rodape button,
  #modal-orcamento-calc .modal-footer button,
  #modal-orcamento-calc .rodape button {
    width: 100% !important;
    min-height: 44px !important;
  }

  [id*="modal"] {
    align-items: flex-end !important;
    padding: 0 !important;
  }
  [id*="modal"] > div,
  .modal-content, .modal-body,
  [class*="modal-content"] {
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 18px 18px 0 0 !important;
    max-height: 93vh !important;
    overflow-y: auto !important;
    margin: 0 !important;
  }

  .kb-board, [class*="kb-board"] {
    display: flex !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    gap: 10px !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .kb-col, [class*="kb-col"] {
    min-width: 270px !important;
    flex-shrink: 0 !important;
  }

  #fab-menu-container { bottom: 68px !important; right: 12px !important; }

  #painel-chat-grande {
    padding: 0 !important;
    align-items: flex-end !important;
  }
  #painel-chat-grande > div {
    width: 100% !important;
    max-width: 100% !important;
    height: 90vh !important;
    border-radius: 18px 18px 0 0 !important;
  }

  canvas, [class*="chart"] {
    max-width: 100% !important;
    height: auto !important;
  }
  [class*="kpi-cards"], [class*="stats-grid"],
  [class*="dashboard-cards"] {
    grid-template-columns: repeat(2,1fr) !important;
    gap: 8px !important;
  }

  #agenda-grid > div {
    min-height: 55px !important;
    font-size: 10px !important;
    padding: 3px !important;
  }

  img { max-width: 100% !important; height: auto !important; }

  #ofmaq-seletor-maquinas {
    display: flex !important;
    overflow-x: auto !important;
    flex-wrap: nowrap !important;
    -webkit-overflow-scrolling: touch !important;
    gap: 6px !important;
    padding-bottom: 6px !important;
    width: 100% !important;
  }
  #ofmaq-seletor-maquinas button {
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    min-height: 36px !important;
    padding: 6px 14px !important;
  }

  ::-webkit-scrollbar { width: 3px !important; height: 3px !important; }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15) !important;
    border-radius: 3px !important;
  }

  div, section, article, aside, nav, main, header, footer {
    max-width: 100% !important;
    min-width: 0 !important;
  }
}

@media (max-width: 480px) {
  .main-content, #main-content { padding: 6px 8px 68px !important; }
  [class*="kpi-cards"] { grid-template-columns: 1fr 1fr !important; }
  .kb-col { min-width: 250px !important; }
  h1 { font-size: 16px !important; }
  h2 { font-size: 15px !important; }
  h3 { font-size: 14px !important; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar, #sidebar, [class*="sidebar"] {
    width: 200px !important;
  }
  .main-content, #main-content {
    margin-left: 200px !important;
  }
}

/* ============================================
   MOBILE IMPROVEMENTS — patch.js
   Apenas correções do layout existente
   ============================================ */

@media (max-width: 768px) {
  body,
  .main-content, #main-content,
  .page-content, #page-content,
  .conteudo-principal {
    padding-bottom: 80px !important;
  }

  .modal-overlay {
    align-items: flex-end !important;
    padding: 0 !important;
  }
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 90vh !important;
    border-radius: 16px 16px 0 0 !important;
    overflow-y: auto !important;
    margin: 0 !important;
  }
  .modal-footer {
    position: sticky !important;
    bottom: 0 !important;
    z-index: 10 !important;
    background: var(--bg-secondary, #1e293b) !important;
    padding: 12px 16px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
  }
  .modal-footer button,
  .modal-footer .btn,
  .modal-footer [class*="btn-"] {
    width: 100% !important;
    min-height: 44px !important;
    font-size: 0.88rem !important;
  }

  input, select, textarea {
    font-size: 16px !important;
    min-height: 42px !important;
    padding: 8px 12px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  button, .btn, [class*="btn-"], [role="button"] {
    min-height: 44px !important;
    font-size: 0.85rem !important;
  }

  .mob-btn-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  .table-scroll-mobile {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    width: 100% !important;
  }

  .hub-stats-grid {
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  .mob-no-overflow {
    white-space: normal !important;
    word-break: break-word !important;
  }

  #graficosHistoricoBox {
    grid-template-columns: 1fr !important;
  }

  #modal-calc.modal-overlay {
    align-items: stretch !important;
    justify-content: stretch !important;
    padding: 0 !important;
  }
  #modal-calc #modal-calculadora {
    width: 100% !important;
    max-width: 100% !important;
    height: 100vh !important;
    max-height: 100vh !important;
    margin: 0 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 12px !important;
  }
  #modal-calc #modal-calculadora .close-btn {
    position: fixed !important;
    top: 10px !important;
    right: 10px !important;
    z-index: 10000 !important;
  }
  #modal-calc #modal-calculadora h2 {
    margin-top: 0 !important;
    padding-right: 56px !important;
  }
  #modal-calc #modal-calculadora .calc-header-row {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 10px !important;
  }
  #modal-calc #modal-calculadora .calc-header-row label {
    white-space: normal !important;
  }
  #modal-calc #modal-calculadora #calc-cli {
    width: 100% !important;
  }

  #modal-calc #modal-calculadora .modal-body,
  #modal-calc #modal-calculadora .calc-body {
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
    flex: 1 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 12px 16px !important;
  }

  #modal-calc #modal-calculadora .calc-col-esq {
    display: contents !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  #modal-calc #modal-calculadora .calc-row-top,
  #modal-calc #modal-calculadora .calc-row-dims,
  #modal-calc #modal-calculadora .calc-row-valores {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    align-items: stretch !important;
  }
  #modal-calc #modal-calculadora .calc-row-top { order: 2 !important; }
  #modal-calc #modal-calculadora .calc-row-dims { order: 3 !important; }
  #modal-calc #modal-calculadora .calc-row-valores { order: 4 !important; }
  #modal-calc #modal-calculadora #calc-extra-fields { order: 5 !important; }

  #modal-calc #modal-calculadora .calc-col-dir {
    order: 6 !important;
    width: 100% !important;
    border-left: none !important;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
    padding: 12px 0 0 0 !important;
    background: transparent !important;
    overflow: visible !important;
  }

  #modal-calc #modal-calculadora .calc-tabela-wrap {
    order: 7 !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    flex: 0 0 auto !important;
  }

  #modal-calc #modal-calculadora input,
  #modal-calc #modal-calculadora select {
    width: 100% !important;
    font-size: 16px !important;
    min-height: 42px !important;
    box-sizing: border-box !important;
  }

  #modal-calc #modal-calculadora .modal-footer.rodape {
    position: sticky !important;
    bottom: 0 !important;
    z-index: 20 !important;
    background: #0f172a !important;
    border-top: 1px solid rgba(255,255,255,0.12) !important;
    padding: 12px 16px !important;
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    margin-top: 0 !important;
  }
  #modal-calc #modal-calculadora .modal-footer.rodape > div:first-child {
    grid-column: 1 / -1 !important;
    margin-right: 0 !important;
  }
  #modal-calc #modal-calculadora .modal-footer.rodape button:first-of-type {
    grid-column: 1 / -1 !important;
  }
  #modal-calc #modal-calculadora .modal-footer.rodape button {
    width: 100% !important;
    min-height: 44px !important;
    font-size: 0.85rem !important;
  }

  .chapas-table-wrapper,
  #tabelaChapasEstoque {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    width: 100% !important;
  }
  #tabelaChapasEstoque th:first-child,
  #tabelaChapasEstoque td:first-child {
    position: sticky !important;
    left: 0 !important;
    z-index: 2 !important;
    background: var(--bg-secondary, #1e293b) !important;
    min-width: 120px !important;
    max-width: 160px !important;
    font-size: 0.75rem !important;
    padding: 8px 6px !important;
    border-right: 1px solid rgba(255,255,255,0.08) !important;
  }
  #tabelaChapasEstoque tbody tr {
    border-bottom: 1px solid rgba(255,255,255,0.06) !important;
  }
  #tabelaChapasEstoque td {
    font-size: 0.75rem !important;
    padding: 8px 6px !important;
    white-space: nowrap !important;
  }

  #painelDetalheChapa {
    align-items: flex-end !important;
    padding: 0 !important;
  }
  #painelDetalheChapa > div {
    max-width: 100% !important;
    border-radius: 16px 16px 0 0 !important;
    max-height: 92vh !important;
  }
  #painelQtdAtual { font-size: 1.5rem !important; }

  .ofs-maquina-board {
    overflow-x: auto !important;
    display: flex !important;
    gap: 12px !important;
    padding-bottom: 12px !important;
    -webkit-overflow-scrolling: touch !important;
  }
  .ofs-maquina-coluna {
    min-width: 280px !important;
    flex-shrink: 0 !important;
  }

  .of-card {
    padding: 10px !important;
    font-size: 0.8rem !important;
  }

  .sistema-header, .top-header {
    padding: 6px 10px !important;
  }

  .badge-atrasados, .badge-urgentes, .badge-concluidos,
  [class*="badge-status"] {
    font-size: 0.68rem !important;
    padding: 3px 6px !important;
  }

  .modal-overlay { z-index: 9000 !important; }
  #painelDetalheChapa { z-index: 9500 !important; }

  /* ===== PCP/PROGRAMAÇÃO ===== */
  .tabela-ofs, #tabela-pcp, [id*="tabelaPCP"], [id*="tabela-ofs"] {
    display: block !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  /* ===== KANBAN OFs POR MÁQUINA ===== */
  .kanban-board, [id*="kanban"], .ofs-maquina-board {
    display: flex !important;
    overflow-x: auto !important;
    gap: 10px !important;
    padding-bottom: 16px !important;
    -webkit-overflow-scrolling: touch !important;
  }
  .kanban-col, .maquina-col, .ofs-maquina-coluna {
    min-width: 270px !important;
    flex-shrink: 0 !important;
  }

  /* ===== FORMULÁRIOS GERAIS ===== */
  .form-row, .form-inline,
  [style*="display:flex"][class*="form"],
  [style*="display: flex"][class*="form"] {
    flex-direction: column !important;
    gap: 10px !important;
  }

  .modal-box input:not([type="checkbox"]):not([type="radio"]),
  .modal-box select,
  .modal-box textarea {
    width: 100% !important;
    box-sizing: border-box !important;
    font-size: 16px !important;
  }

  /* ===== TABELAS GERAIS ===== */
  .table-container, .tabela-container, [class*="tabela-wrap"] {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  /* ===== HEADER DO SISTEMA ===== */
  .sistema-top-bar, .header-principal {
    flex-wrap: wrap !important;
    gap: 4px !important;
    padding: 6px 8px !important;
  }
  .header-btn-group button {
    font-size: 0.72rem !important;
    padding: 4px 8px !important;
  }

  /* ===== CARDS DO HUB ===== */
  .hub-grid, .dashboard-grid, [class*="cards-grid"] {
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  /* ===== FINANCEIRO ===== */
  .financeiro-tabela, [id*="financeiro"] table {
    display: block !important;
    overflow-x: auto !important;
  }

  /* ===== ANÁLISES/GRÁFICOS ===== */
  .grafico-card canvas {
    max-width: 100% !important;
    height: auto !important;
  }

  /* ===== MENUS E NAVEGAÇÃO ===== */
  .menu-lateral { display: none !important; }
  .menu-mobile-bottom {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 9000 !important;
    background: #0f172a !important;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
  }

  /* ===== ESPAÇO PARA MENU INFERIOR ===== */
  .main-content, .page-content, .conteudo-principal, #app-content {
    padding-bottom: 80px !important;
  }

  /* ===== MODAIS BOTTOM SHEET ===== */
  .modal-overlay {
    align-items: flex-end !important;
    padding: 0 !important;
  }
  .modal-box {
    border-radius: 16px 16px 0 0 !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* ===== BOTÕES DE AÇÃO ===== */
  button, .btn, [class*="btn-"] {
    min-height: 40px !important;
  }

  .btn-group-mobile {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 6px !important;
  }

  /* ===== TEXTO NÃO CORTAR (apenas em tabelas) ===== */
  table th, table td { white-space: nowrap !important; }

  /* ===== CLIENTES INATIVOS MOBILE ===== */
  #listaClientesInativosModal > div { grid-template-columns: 1fr 1fr !important; }
  #listaClientesInativosModal > div span:nth-child(3),
  #listaClientesInativosModal > div span:nth-child(4) { display: none !important; }
}

@media (max-width: 390px) {
  .hub-grid { grid-template-columns: 1fr !important; }
  .badge-status { font-size: 0.62rem !important; }
}
`;

    var elCSS = document.getElementById('patch-css-mobile');
    if (!elCSS) {
      elCSS = document.createElement('style');
      elCSS.id = 'patch-css-mobile';
      document.head.appendChild(elCSS);
    }
    elCSS.textContent = cssM;
    console.log('[PATCH] CSS mobile v4 — ' + cssM.length + ' chars');
  } catch (_) {}

  // ── UTIL: pegar token ──────────────────────────────────────────
  function getToken() {
    return localStorage.getItem('token') ||
           sessionStorage.getItem('token') ||
           localStorage.getItem('access_token') || '';
  }

  function extractOfsRows(raw) {
    return Array.isArray(raw) ? raw : (Array.isArray(raw && raw.data) ? raw.data : (Array.isArray(raw && raw.ofs) ? raw.ofs : []));
  }

  // ── PATCH 1: proximoNumeroOf ───────────────────────────────────
  // Busca a OF com maior numero e retorna numero + 1 formatado
  window.proximoNumeroOf = async function() {
    var token = getToken();
    var h = token ? { 'Authorization': 'Bearer ' + token } : {};
    try {
      // Rota dedicada (mais confiavel)
      var r0 = await fetch('/api/ofs/proximo-numero?t=' + Date.now(), { headers: h });
      if (r0.ok) {
        var d0 = await r0.json();
        if (d0 && d0.ok && Number(d0.maior) > 0 && d0.proximo) {
          var proximoNum = parseInt(d0.proximo, 10);
          var maiorNum = parseInt(d0.maior, 10);
          if (!isNaN(proximoNum) && !isNaN(maiorNum) && proximoNum === maiorNum) {
            d0.proximo = String(maiorNum + 1).padStart(String(d0.proximo).length, '0');
          }
          console.log('[PATCH] proximoNumeroOf via rota dedicada: maior=' + d0.maior + ' proximo=' + d0.proximo);
          return String(d0.proximo);
        }
      }
    } catch(e0) { console.warn('[PATCH] rota dedicada falhou:', e0.message); }
    try {
      // Tentar com order_by=numero
      var r = await fetch('/api/ofs?limit=5&order_by=numero&order=desc&t=' + Date.now(), { headers: h });
      if (r.ok) {
        var d = await r.json();
        var lista = extractOfsRows(d);
        console.log('[PATCH] OFs recebidas para calcular proximo numero:', lista.slice(0,3).map(function(o){ return {numero: o.numero, of_num: o.of_num, id: o.id}; }));
        // Tentar todos os campos possiveis de numero
        var maior = 0;
        lista.forEach(function(o) {
          // Log para ver TODOS os campos retornados
          if (lista.indexOf(o) === 0) console.log('[PATCH] campos da primeira OF:', Object.keys(o));
        // Tentar TODOS os campos possiveis
          var valoresTentados = [o.numero, o.of_num, o.numero_of, o.num, o.seq, o.sequencia, o.cod, o.codigo, o.of];
          valoresTentados.forEach(function(v) {
            if (v !== null && v !== undefined && v !== '') {
              var n = parseInt(String(v).replace(/\D/g,''), 10);
              if (!isNaN(n) && n > maior) {
                maior = n;
                console.log('[PATCH] campo com numero valido encontrado: valor=' + v + ' n=' + n);
              }
            }
          });
        });
        if (maior > 0) {
          var proximo = String(maior + 1).padStart(String(maior).length >= 3 ? String(maior).length : 3, '0');
          console.log('[PATCH] proximoNumeroOf: maior=' + maior + ' proximo=' + proximo);
          return proximo;
        }
      }
    } catch(e) { console.warn('[PATCH] proximoNumeroOf API falhou:', e.message); }

    // Fallback: usar OFs ja carregadas em memoria
    var cache = window.OFS_ARQUIVO || window._ofs_cache || [];
    if (cache.length) {
      var nums = [];
      cache.forEach(function(o) {
        ['numero','of_num','numero_of','num','of'].forEach(function(campo) {
          if (o && o[campo]) {
            var n = parseInt(String(o[campo]).replace(/\D/g,''), 10);
            if (!isNaN(n) && n > 0) nums.push(n);
          }
        });
      });
      if (nums.length) {
        var max = Math.max.apply(null, nums);
        return String(max + 1).padStart(3, '0');
      }
    }
    console.warn('[PATCH] proximoNumeroOf: usando fallback 001');
    return '001';
  };

  // ── PATCH 3: garantir numero no payload ao salvar OF Rapida ───
  var _origSalvar1 = window.salvarOfRapida;
  var _origSalvar2 = window.salvarNovaOfRapida;
  var _wrapSalvar = function(orig) {
    return function() {
      var el = document.getElementById('of-r-numero');
      var num = window._ofRapidaNumero ||
                (el ? (el.value || el.textContent || '').replace(/[^0-9]/g,'') : '') ||
                '001';
      window._ofRapidaNumero = num;
      if (el) { if (el.tagName === 'INPUT') el.value = num; else el.textContent = num; }
      console.log('[PATCH] salvar OF Rapida numero:', num);
      if (typeof orig === 'function') return orig.apply(this, arguments);
    };
  };
  if (typeof _origSalvar1 === 'function') window.salvarOfRapida = _wrapSalvar(_origSalvar1);
  if (typeof _origSalvar2 === 'function') window.salvarNovaOfRapida = _wrapSalvar(_origSalvar2);

  // ── PATCH 4: carregarPassagensHoje com filtros ─────────────────
  window.carregarPassagensHoje = async function(opts) {
    opts = opts || {};
    var periodo = opts.periodo || 'hoje';
    var container = document.getElementById('passagens-lista');
    if (!container) return;
    container.innerHTML = '<p style="color:#64748b;text-align:center;padding:16px;font-size:13px">Carregando...</p>';
    var token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    var h = token ? { 'Authorization': 'Bearer ' + token } : {};
    try {
      var r = await fetch('/api/passagens/hoje?periodo=' + periodo + '&t=' + Date.now(), { headers: h });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var d = await r.json();
      var lista = d.passagens || [];
      function bs(p) {
        return 'border:none;border-radius:20px;padding:4px 12px;cursor:pointer;font-size:12px;' +
          'background:' + (periodo===p ? '#4A90D9' : 'rgba(255,255,255,0.07)') + ';' +
          'color:' + (periodo===p ? '#fff' : '#94a3b8');
      }
      var html =
        '<div style="display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06)">' +
        '<button style="' + bs('hoje')   + '" onclick="carregarPassagensHoje({periodo:\'hoje\'})">Hoje</button>' +
        '<button style="' + bs('ontem')  + '" onclick="carregarPassagensHoje({periodo:\'ontem\'})">Ontem</button>' +
        '<button style="' + bs('semana') + '" onclick="carregarPassagensHoje({periodo:\'semana\'})">Semana</button>' +
        '<button style="' + bs('mes')    + '" onclick="carregarPassagensHoje({periodo:\'mes\'})">Mes</button>' +
        '</div>';
      if (!lista.length) {
        html += '<p style="color:#64748b;text-align:center;padding:20px;font-size:13px">Nenhuma passagem neste periodo.</p>';
      } else {
        html += '<div style="overflow-y:auto;max-height:280px">' + lista.map(function(p) {
          var hora = p.hora_passagem ? new Date(p.hora_passagem).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
          return '<div style="display:flex;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px">' +
            '<span style="font-weight:700;color:#10b981;min-width:55px">OF #' + (p.of_numero||'-') + '</span>' +
            '<span style="color:#e2e8f0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.cliente||'-') + '</span>' +
            '<span style="color:#94a3b8;min-width:70px;text-align:right">' + (p.maquina||'-') + '</span>' +
            '<span style="color:#64748b;min-width:70px;text-align:right">' + hora + '</span>' +
            '</div>';
        }).join('') + '</div>';
      }
      container.innerHTML = html;
    } catch(e) {
      container.innerHTML = '<p style="color:#f43f5e;text-align:center;padding:16px;font-size:13px">Erro ao carregar passagens.</p>';
      console.error('[PATCH] carregarPassagensHoje:', e);
    }
  };

  var HOTBAR_ABAS = [
    { id: 'hub',   label: 'Hub',      icone: '🏠', fixo: true  },
    { id: 'pcp',   label: 'PCP',      icone: '📋', fixo: false },
    { id: 'ofmaq', label: 'Máquinas', icone: '⚙',  fixo: true  },
  ];

  var PAGINAS_REAIS_DESKTOP = [
    { id: 'hub',                 label: 'Hub Inicial',         icone: '🏠', grupo: 'Produção' },
    { id: 'pcp',                 label: 'PCP',                 icone: '📋', grupo: 'Produção' },
    { id: 'ofmaq',               label: 'OFs por Máquina',     icone: '⚙',  grupo: 'Produção' },
    { id: 'historico-passagens', label: 'Histórico Passagens', icone: '🕒', grupo: 'Produção' },
    { id: 'lancamento',          label: 'Armazenamento',       icone: '📦', grupo: 'Produção' },
    { id: 'amostras',            label: 'Amostras',            icone: '🔬', grupo: 'Produção' },
    { id: 'pedidos-recorrentes', label: 'Recorrentes',         icone: '🔄', grupo: 'Produção' },
    { id: 'roteiro-entrega',     label: 'Roteiro Entrega',     icone: '🚚', grupo: 'Produção' },

    { id: 'clientes',            label: 'Clientes',            icone: '👥', grupo: 'Cadastros' },
    { id: 'mapa-clientes',       label: 'Mapa Clientes',       icone: '🗺', grupo: 'Cadastros' },
    { id: 'fornecedores',        label: 'Fornecedores',        icone: '🏭', grupo: 'Cadastros' },
    { id: 'vendedores',          label: 'Vendedores',          icone: '🤝', grupo: 'Cadastros' },
    { id: 'usuarios',            label: 'Usuários',            icone: '👤', grupo: 'Cadastros' },

    { id: 'orcamentos',          label: 'Orçamentos',          icone: '💰', grupo: 'Financeiro', senha: true },
    { id: 'comissoes',           label: 'Comissões',           icone: '💵', grupo: 'Financeiro', senha: true },

    { id: 'estoque',             label: 'Estoque Chapas',      icone: '📦', grupo: 'Estoques' },
    { id: 'facas1',              label: 'Estoque Facas',       icone: '🔧', grupo: 'Estoques' },
    { id: 'cliches',             label: 'Estoque Clichês',     icone: '🖼', grupo: 'Estoques' },
    { id: 'compras',             label: 'Compras',             icone: '🛒', grupo: 'Estoques' },
    { id: 'sel-chapas',          label: 'Seleção de Chapas',   icone: '🧾', grupo: 'Estoques' },
    { id: 'papelao-ia',          label: 'Papelão IA',          icone: '🧠', grupo: 'Estoques' },
    { id: 'simd',                label: 'Simulador (SIMD)',    icone: '♻',  grupo: 'Estoques' },

    { id: 'fluxos',              label: 'Fluxos',              icone: '🔀', grupo: 'Máquinas' },
    { id: 'maquinas',            label: 'Cadastro Máquinas',   icone: '🖨', grupo: 'Máquinas' },
    { id: 'tipos-caixa',         label: 'Tipos de Caixa',      icone: '📦', grupo: 'Máquinas' },
    { id: 'tempos-reais',        label: 'Tempos Reais',        icone: '⏱',  grupo: 'Máquinas' },

    { id: 'agenda',              label: 'Agenda',              icone: '📅', grupo: 'Comunicações' },

    { id: 'operadores',          label: 'Operadores',          icone: '👷', grupo: 'Qualidade' },
    { id: 'inconformidades',     label: 'Inconformidades',     icone: '⚠',  grupo: 'Qualidade' },

    { id: 'dashboard',           label: 'Dashboard',           icone: '📊', grupo: 'Análises' },
    { id: 'relatorios',          label: 'Relatórios',          icone: '🖨', grupo: 'Análises' },
    { id: 'caixas-perdidas',     label: 'Caixas Perdidas',     icone: '📦', grupo: 'Análises' },
    { id: 'relmensal',           label: 'Relatório Mensal',    icone: '📅', grupo: 'Análises' },
    { id: 'configuracoes',       label: 'Configurações',       icone: '⚙',  grupo: 'Análises' },
  ];

  function _hotbarCap(s){
    var t = String(s || '').trim();
    if(!t) return '';
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function _hotbarLabelFromId(id){
    var s = String(id || '').trim().replace(/^page-/, '');
    if(!s) return '';
    return s.split('-').map(_hotbarCap).join(' ');
  }
  function _hotbarIconFromLabel(label){
    var t = String(label || '').trim();
    if(!t) return '';
    var parts = t.split(/\s+/).filter(Boolean);
    var one = parts[0] || t;
    return one.slice(0, 3);
  }
  function _hotbarEnsureAllPagesFromDom(){ return; }

  function _findPaginaById(pid){
    var id = String(pid || '').trim();
    if(!id) return null;
    for (var i = 0; i < (PAGINAS_REAIS_DESKTOP || []).length; i++) {
      var p = PAGINAS_REAIS_DESKTOP[i];
      if (p && p.id === id) return p;
    }
    return null;
  }

  try{ window._todasPaginas = PAGINAS_REAIS_DESKTOP; }catch(e){}

  window.mobileGoPage = function(page) {
    var menu = document.getElementById('mob-menu-mais');
    if (menu) menu.remove();
    var pid = String(page || '').trim();
    if(!pid) return;
    var paginasFinanceiro = ['orcamentos', 'comissoes'];
    if (paginasFinanceiro.indexOf(pid) !== -1) {
      try{
        if (sessionStorage.getItem('fin_ok') !== '1') {
          var senha = prompt('Senha do Financeiro:');
          if (senha !== '1234') { if(senha!==null) alert('Senha incorreta.'); return; }
          sessionStorage.setItem('fin_ok', '1');
        }
      }catch(e){}
    }
    try{ if (typeof (window.go) === 'function') window.go(pid); }catch(e){}
  };

  function goFinanceiro(pageId){
    var pid = String(pageId || '').trim();
    if(!pid) return;
    try{
      if (sessionStorage.getItem('fin_ok') === '1') { try{ go(pid); }catch(e){} return; }
    }catch(e){}
    var senha = prompt('Senha do financeiro:');
    if (senha === null) return;
    if (senha === '1234') {
      try { sessionStorage.setItem('fin_ok', '1'); } catch (e) {}
      try{
        var grupo = document.getElementById('nav-group-financeiro');
        if(grupo) grupo.style.display = 'block';
      }catch(e){}
      try{ go(pid); }catch(e){}
    } else {
      alert('Senha incorreta.');
    }
  }
  window.goFinanceiro = goFinanceiro;

  (function patchPermissoesLiberadasExcetoFinanceiro() {
    function isFinanceiroPage(pid) {
      var page = String(pid || '').trim().toLowerCase();
      return page === 'orcamentos' || page === 'comissoes';
    }

    function liberarElementosNaoFinanceiro() {
      try {
        document.querySelectorAll('.nav-item, .menu-item, [data-section], button, a, [onclick]').forEach(function(el) {
          if (!el) return;
          var dentroFinanceiro = false;
          try {
            dentroFinanceiro = !!el.closest('#nav-group-financeiro, #ng-financeiro, #menu-fin-orcamentos, #menu-fin-comissoes');
          } catch (_) {}
          if (dentroFinanceiro) return;
          try { el.disabled = false; } catch (_) {}
          try { el.removeAttribute('disabled'); } catch (_) {}
          try { el.removeAttribute('aria-disabled'); } catch (_) {}
          try { el.style.pointerEvents = ''; } catch (_) {}
          try { el.style.opacity = ''; } catch (_) {}
          try { if (el.classList) el.classList.remove('bloqueado', 'disabled', 'is-disabled'); } catch (_) {}
          try {
            var ds = String(el.style.display || '').trim().toLowerCase();
            if (ds === 'none') el.style.display = '';
          } catch (_) {}
        });
      } catch (_) {}
      try {
        document.querySelectorAll('.no-perm-overlay').forEach(function(el) { el.remove(); });
      } catch (_) {}
    }

    function hook() {
      if (window.__patchPermissoesLiberadasExcetoFinanceiro) return;
      window.__patchPermissoesLiberadasExcetoFinanceiro = true;

      var origHasPerm = (typeof window.hasPerm === 'function') ? window.hasPerm : null;
      var origTemPermPagina = (typeof window.temPermPagina === 'function') ? window.temPermPagina : null;
      var origAplicarPermissoes = (typeof window.aplicarPermissoes === 'function') ? window.aplicarPermissoes : null;
      var origMostrarSemPermissao = (typeof window.mostrarSemPermissao === 'function') ? window.mostrarSemPermissao : null;

      window.hasPerm = function(keyOrList) {
        if (Array.isArray(keyOrList)) {
          return keyOrList.some(function(k) { return window.hasPerm(k); });
        }
        var key = String(keyOrList || '').trim().toLowerCase();
        if (!key) return true;
        if (key.indexOf('financeiro') >= 0) {
          try { return origHasPerm ? !!origHasPerm.apply(this, arguments) : true; } catch (_) { return true; }
        }
        return true;
      };

      window.temPermPagina = function(paginaId) {
        var pid = String(paginaId || '').trim();
        if (!isFinanceiroPage(pid)) return true;
        if (origTemPermPagina) {
          try { return !!origTemPermPagina.apply(this, arguments); } catch (_) {}
        }
        try {
          if (sessionStorage.getItem('fin_ok') === '1') return true;
          var s = prompt('Senha do Financeiro:');
          if (s === null) return false;
          if (String(s).trim() === '1234') {
            sessionStorage.setItem('fin_ok', '1');
            return true;
          }
          if (String(s).trim() !== '') alert('Senha incorreta.');
        } catch (_) {}
        return false;
      };

      window.aplicarPermissoes = function() {
        try { if (origAplicarPermissoes) origAplicarPermissoes.apply(this, arguments); } catch (_) {}
        liberarElementosNaoFinanceiro();
      };

      window.mostrarSemPermissao = function(paginaId) {
        if (!isFinanceiroPage(paginaId)) {
          liberarElementosNaoFinanceiro();
          return;
        }
        try { if (origMostrarSemPermissao) return origMostrarSemPermissao.apply(this, arguments); } catch (_) {}
      };

      window.podeSelecionarChapas = function() { return true; };

      try {
        var origGo = window.go;
        if (typeof origGo === 'function' && !origGo._patchPermissoesLiberadasExcetoFinanceiro) {
          var wrappedGo = function(id) {
            var ret = origGo.apply(this, arguments);
            setTimeout(liberarElementosNaoFinanceiro, 40);
            return ret;
          };
          wrappedGo._patchPermissoesLiberadasExcetoFinanceiro = true;
          window.go = wrappedGo;
        }
      } catch (_) {}

      liberarElementosNaoFinanceiro();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        hook();
        setInterval(liberarElementosNaoFinanceiro, 1500);
      });
    } else {
      hook();
      setInterval(liberarElementosNaoFinanceiro, 1500);
    }
  })();

  function _hotbarValidIds(){
    try{
      return (PAGINAS_REAIS_DESKTOP || []).map(function(p){ return String(p && p.id || '').trim(); }).filter(Boolean);
    }catch(e){ return []; }
  }
  function _isValidPageId(id){
    var pid = String(id || '').trim();
    if(!pid) return false;
    return _hotbarValidIds().indexOf(pid) !== -1;
  }

  function getHotbarConfig() {
    var def = ['hub', 'pcp', 'ofmaq'];
    var arr = null;
    try {
      var salvo = localStorage.getItem('hotbar_config');
      if (salvo) {
        var x = JSON.parse(salvo);
        if (Array.isArray(x)) arr = x;
      }
    } catch(e) {}
    if (!Array.isArray(arr) || arr.length === 0) return def.slice();
    var out = [];
    arr.forEach(function(id){
      var pid = String(id || '').trim();
      if (!pid) return;
      if (out.indexOf(pid) !== -1) return;
      if (!_isValidPageId(pid)) return;
      out.push(pid);
    });
    if (out.indexOf('hub') === -1) out.unshift('hub');
    if (out[0] !== 'hub') out = ['hub'].concat(out.filter(function(x){ return x !== 'hub'; }));
    return out.slice(0, 4);
  }

  function salvarHotbarConfig(ids) {
    var arr = Array.isArray(ids) ? ids : [];
    var out = [];
    arr.forEach(function(id){
      var pid = String(id || '').trim();
      if (!pid) return;
      if (out.indexOf(pid) !== -1) return;
      if (!_isValidPageId(pid)) return;
      out.push(pid);
    });
    if (out.indexOf('hub') === -1) out.unshift('hub');
    if (out[0] !== 'hub') out = ['hub'].concat(out.filter(function(x){ return x !== 'hub'; }));
    out = out.slice(0, 4);
    try{ localStorage.setItem('hotbar_config', JSON.stringify(out)); }catch(e){}
    renderHotbar();
  }

  function _hotbarPaginaAtiva() {
    var id = String(window._PAGE_ATUAL || '').trim();
    var m = {
      hub: ['hub','home'],
      pcp: ['pcp'],
      ofmaq: ['ofmaq','maquinas','fluxos','tipos-caixa','tempos-reais','ofs-maquina'],
      estoque: ['estoque','facas1','cliches','lancamento','estoques'],
      dashboard: ['dashboard','relatorios','relmensal','comissoes','caixas-perdidas','caixas_perdidas'],
    };
    for (var k in m) {
      if (!Object.prototype.hasOwnProperty.call(m, k)) continue;
      if ((m[k] || []).indexOf(id) !== -1) return k;
    }
    return id;
  }

  function atualizarAbaAtiva() {
    var active = _hotbarPaginaAtiva();
    var nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;
    Array.prototype.forEach.call(nav.querySelectorAll('.mbn-item'), function(btn){
      var tab = String(btn.getAttribute('data-tab') || btn.id || '').trim();
      tab = tab.indexOf('mbn-') === 0 ? tab.slice(4) : tab;
      btn.classList.toggle('active', tab && tab === active);
    });
  }

  function renderHotbar() {
    var nav = document.getElementById('mobile-bottom-nav');
    if (!nav) { console.warn('[PATCH] hotbar nao encontrada'); return; }
    var ativos = getHotbarConfig();
    var html = ativos.slice(0, 4).map(function(id) {
      var aba = HOTBAR_ABAS.find(function(a){ return a.id===id; }) || _findPaginaById(id) || { id: id, label: id, icone: '📌', fixo: false };
      var on = 'mobileGoPage(&quot;' + aba.id + '&quot;)';
      return '<button class="mbn-item" data-tab="' + aba.id + '" onclick="' + on + '" ' +
        'style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'padding:6px 2px;background:none;border:none;cursor:pointer;font-size:10px;color:#94a3b8;gap:1px">' +
        '<div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.08);' +
        'display:flex;align-items:center;justify-content:center;font-size:14px">' +
        String(aba.icone || '').replace(/</g,'').replace(/>/g,'') + '</div>' +
        '<span style="font-size:9px">' + String(aba.label || '').replace(/</g,'').replace(/>/g,'') + '</span>' +
        '</button>';
    }).join('');
    html += '<button onclick="abrirMenuMais()" ' +
      'style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'padding:6px 2px;background:none;border:none;cursor:pointer;font-size:10px;color:#94a3b8;gap:1px">' +
      '<div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.08);' +
      'display:flex;align-items:center;justify-content:center;font-size:14px">☰</div>' +
      '<span style="font-size:9px">Mais</span></button>';
    nav.innerHTML = html;
    atualizarAbaAtiva();
  }
  window.renderHotbarPatch = renderHotbar;

  window.abrirMenuMais = function() {
    var old = document.getElementById('mob-menu-mais');
    if (old) { old.remove(); return; }

    var naHotbar = Array.from(document.querySelectorAll('#mobile-bottom-nav [data-tab]'))
      .map(function(b){ return String(b && b.dataset ? b.dataset.tab : '').trim(); })
      .filter(Boolean);

    var paginas = (PAGINAS_REAIS_DESKTOP || []).filter(function(p) {
      if (!p || !p.id) return false;
      if (naHotbar.indexOf(p.id) !== -1) return false;
      var elPage = document.getElementById('page-' + p.id) || document.querySelector('[data-page="' + p.id + '"]');
      if (!elPage) return false;
      try{
        var st = String(elPage.getAttribute('style') || '');
        if (/display\s*:\s*none\s*!important/i.test(st)) return false;
      }catch(e){}
      return true;
    });

    var grupos = {};
    paginas.forEach(function(p) {
      var g = p.grupo || 'Outros';
      if (!grupos[g]) grupos[g] = [];
      grupos[g].push(p);
    });

    var overlay = document.createElement('div');
    overlay.id = 'mob-menu-mais';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,0.7);display:flex;align-items:flex-end';

    var html = '<div style="background:#0b1220;border-radius:18px 18px 0 0;width:100%;max-height:82vh;overflow-y:auto;padding:16px 14px 72px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
        '<span style="color:#e2e8f0;font-weight:700;font-size:16px">Menu</span>' +
        '<button onclick="document.getElementById(&quot;mob-menu-mais&quot;).remove()" style="background:none;border:none;color:#64748b;font-size:24px;cursor:pointer">✕</button>' +
      '</div>';
    html += '<button onclick="abrirPersonalizarHotbar()" style="' +
      'width:100%;background:rgba(74,144,217,0.1);color:#4A90D9;' +
      'border:1px solid rgba(74,144,217,0.25);border-radius:10px;' +
      'padding:12px;cursor:pointer;font-size:13px;font-weight:600;' +
      'display:flex;align-items:center;gap:8px;margin-bottom:14px;justify-content:center">' +
      '⚙ Personalizar barra de navegação</button>';

    Object.keys(grupos).forEach(function(grupo) {
      html += '<div style="margin-bottom:16px">' +
        '<div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">' + grupo + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';

      grupos[grupo].forEach(function(p) {
        html += '<button onclick="mobileGoPage(&quot;' + p.id + '&quot;)" style="' +
          'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);' +
          'border-radius:12px;padding:14px 8px;cursor:pointer;color:#e2e8f0;' +
          'display:flex;flex-direction:column;align-items:center;gap:5px;' +
          'touch-action:manipulation;-webkit-tap-highlight-color:transparent">' +
          '<span style="font-size:22px">' + (p.icone||'📌') + '</span>' +
          '<span style="font-size:11px;color:#94a3b8;text-align:center;line-height:1.2">' + p.label + '</span>' +
          (p.senha ? '<span style="font-size:9px;color:#f59e0b">🔒</span>' : '') +
        '</button>';
      });

      html += '</div></div>';
    });

    html += '</div>';
    overlay.innerHTML = html;
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  };

  window.abrirPersonalizarHotbar = function() {
    var menu = document.getElementById('mob-menu-mais');
    if (menu) menu.remove();

    var old = document.getElementById('modal-personalizar-hotbar');
    if (old) { old.remove(); return; }

    var configuradas = [];
    try{
      var x = JSON.parse(localStorage.getItem('hotbar_config') || '["hub","pcp","ofmaq"]');
      if (Array.isArray(x)) configuradas = x.map(function(a){ return String(a||'').trim(); }).filter(Boolean);
    }catch(e){ configuradas = ['hub','pcp','ofmaq']; }
    if (configuradas.indexOf('hub') === -1) configuradas.unshift('hub');

    var paginas = (window._todasPaginas || PAGINAS_REAIS_DESKTOP || []).filter(function(p){
      if (!p || !p.id) return false;
      if (p.id === 'hub') return false;
      var elPage = document.getElementById('page-' + p.id) || document.querySelector('[data-page="' + p.id + '"]');
      return !!elPage;
    });

    var overlay = document.createElement('div');
    overlay.id = 'modal-personalizar-hotbar';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9600;display:flex;align-items:flex-end';

    overlay.innerHTML =
      '<div style="background:#0b1220;border-radius:18px 18px 0 0;width:100%;max-height:85vh;overflow-y:auto;padding:20px">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px;align-items:center">' +
          '<span style="color:#e2e8f0;font-weight:700;font-size:15px">Personalizar Hotbar</span>' +
          '<button onclick="document.getElementById(&quot;modal-personalizar-hotbar&quot;).remove()" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer">✕</button>' +
        '</div>' +
        '<p style="color:#64748b;font-size:12px;margin:0 0 16px">Máximo 4 atalhos. Hub é fixo.</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          paginas.map(function(p){
            var selecionado = configuradas.indexOf(p.id) !== -1;
            var ic = String(p.icone || '📌').replace(/</g,'').replace(/>/g,'');
            var lb = String(p.label || p.id).replace(/</g,'').replace(/>/g,'');
            return '<label style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,' + (selecionado?'0.15':'0.07') + ');border-radius:10px;cursor:pointer">' +
              '<input type="checkbox" ' + (selecionado?'checked':'') + ' data-id="' + p.id + '" onchange="toggleHotbarItem(this)" style="width:20px;height:20px;accent-color:#4A90D9;flex-shrink:0">' +
              '<span style="font-size:18px">' + ic + '</span>' +
              '<span style="color:#e2e8f0;font-size:14px">' + lb + '</span>' +
            '</label>';
          }).join('') +
        '</div>' +
        '<button onclick="salvarHotbarConfig()" style="width:100%;background:#4A90D9;color:#fff;border:none;border-radius:10px;padding:14px;cursor:pointer;font-size:14px;font-weight:600;margin-top:16px">Salvar configuração</button>' +
      '</div>';

    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  };

  window.toggleHotbarItem = function(checkbox) {
    try{
      var selecionados = Array.prototype.slice.call(document.querySelectorAll('#modal-personalizar-hotbar input[type="checkbox"]:checked'))
        .map(function(cb){ return String(cb.dataset && cb.dataset.id || '').trim(); })
        .filter(Boolean);
      if (selecionados.length > 3 && checkbox && checkbox.checked) {
        checkbox.checked = false;
        alert('Máximo 3 atalhos além do Hub.');
      }
    }catch(e){}
  };

  window.salvarHotbarConfig = function() {
    var selecionados = ['hub'].concat(
      Array.prototype.slice.call(document.querySelectorAll('#modal-personalizar-hotbar input[type="checkbox"]:checked'))
        .map(function(cb){ return String(cb.dataset && cb.dataset.id || '').trim(); })
        .filter(Boolean)
        .slice(0, 3)
    );
    salvarHotbarConfig(selecionados);
    try{ document.getElementById('modal-personalizar-hotbar') && document.getElementById('modal-personalizar-hotbar').remove(); }catch(e){}
    alert('Hotbar salva! ✓');
  };

  window.toggleHotbarAba = function(id, ativo) {
    var base = ['hub', 'pcp', 'ofmaq'];
    id = String(id || '').trim();
    if (!id) return;
    if (!_isValidPageId(id)) return;
    if (ativo) {
      if (base.indexOf(id) !== -1) { salvarHotbarConfig(getHotbarConfig()); return; }
      salvarHotbarConfig(base.concat([id]));
      return;
    }
    if (base.indexOf(id) !== -1) return;
    salvarHotbarConfig(base);
  };

  function aplicarAccordion() {
    var headers = document.querySelectorAll('.maq-header');
    if (!headers.length) return;
    console.log('[PATCH] accordion v4:', headers.length, 'headers');

    headers.forEach(function(header) {
      if (header._pv4) return;
      header._pv4 = true;
      try { header.setAttribute('data-pv4', '1'); } catch(e) {}

      var body = null;
      var next = header.nextElementSibling;
      while (next) {
        if (next.tagName !== 'SCRIPT' && next.tagName !== 'STYLE') {
          body = next;
          break;
        }
        next = next.nextElementSibling;
      }
      if (!body) {
        console.warn('[PATCH] accordion: body nao encontrado');
        return;
      }

      var onclickOriginal = header.getAttribute('onclick');
      if (onclickOriginal) header.removeAttribute('onclick');
      header.style.userSelect = 'none';

      body.style.display = 'none';
      var aberto = false;

      if (!header.querySelector('.patch-seta-v4')) {
        var seta = document.createElement('span');
        seta.className = 'patch-seta-v4';
        seta.textContent = '▼';
        seta.style.cssText = 'display:inline-block;transition:transform 0.3s;' +
          'font-size:11px;opacity:0.5;margin-left:8px;pointer-events:none';
        header.appendChild(seta);
      }

      header.style.cursor = 'pointer';
      header.addEventListener('click', function(e) {
        if (e.target !== header && (
          e.target.tagName === 'BUTTON' || e.target.tagName === 'A' ||
          e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' ||
          e.target.closest('button') || e.target.closest('a') ||
          e.target.closest('select')
        )) return;

        aberto = !aberto;

        body.style.display = aberto ? '' : 'none';
        if (aberto && getComputedStyle(body).display === 'none') {
          body.style.display = 'flex';
        }
        if (aberto) {
          body.style.flexDirection = 'column';
          body.style.gap = '8px';
          body.style.padding = '10px';
        }

        var s = header.querySelector('.patch-seta-v4');
        if (s) s.style.transform = aberto ? 'rotate(180deg)' : 'rotate(0deg)';

        if (aberto && typeof Sortable !== 'undefined' && !body._sortInst) {
          body._sortInst = new Sortable(body, {
            animation: 150,
            delay: 100,
            delayOnTouchOnly: true,
            ghostClass: 'of-sort-ghost',
            onEnd: function() {
              var cards = Array.from(body.querySelectorAll('[data-of-id]'));
              cards.forEach(function(c, i) {
                var badge = c.querySelector('.ordem-badge');
                if (badge) badge.textContent = i + 1;
              });
              var ids = cards.map(function(c) { return c.dataset.ofId; }).filter(Boolean);
              if (!ids.length) return;
              var maq = '';
              try{
                maq = String((header && header.dataset && (header.dataset.maq || header.dataset.maquina)) || (body && body.dataset && (body.dataset.maq || body.dataset.maquina)) || '').trim();
              }catch(_){}
              var token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
              fetch('/api/ofs/reordenar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(maq ? { ordem: ids, maquina_id: maq } : { ordem: ids })
              }).then(function(r) { return r.json(); })
              .then(function(d) { console.log('[PATCH] ordem salva:', d && d.ok ? 'OK' : 'ERRO'); })
              .catch(function(e) { console.warn('[PATCH] reordenar:', e && e.message ? e.message : e); });
            }
          });
          console.log('[PATCH] Sortable ativo em:', String(header.textContent || '').trim().substring(0, 25));
        }
      }, true);
    });
  }

  if (!document.getElementById('patch-sort-style')) {
    var st = document.createElement('style');
    st.id = 'patch-sort-style';
    st.textContent = '.of-sort-ghost{opacity:0.4!important;background:rgba(74,144,217,0.2)!important;}' +
      '.maq-header{cursor:pointer!important;user-select:none!important}' +
      '.maq-header:hover{opacity:0.9}';
    document.head.appendChild(st);
  }

  ['renderOFsPorMaquina','renderMaquinas','renderOfmaq','renderOFsMaquina','renderMaq',
   'carregarOFsMaquina','loadOFsMaquina'].forEach(function(nome) {
    if (typeof window[nome] === 'function' && !window[nome]._patchedAccordion) {
      var orig = window[nome];
      window[nome] = function() {
        var res = orig.apply(this, arguments);
        setTimeout(aplicarAccordion, 300);
        setTimeout(aplicarAccordion, 700);
        return res;
      };
      window[nome]._patchedAccordion = true;
      console.log('[PATCH] interceptou render:', nome);
    }
  });

  try {
    if (window._patchAccordionObs && typeof window._patchAccordionObs.disconnect === 'function') window._patchAccordionObs.disconnect();
  } catch (_) {}
  window._patchAccordionObs = new MutationObserver(function(muts, observer) {
    var encontrou = muts.some(function(m) {
      return Array.from(m.addedNodes).some(function(n) {
        return n.nodeType === 1 && (
          (n.classList && n.classList.contains('maq-header')) ||
          (n.querySelector && n.querySelector('.maq-header'))
        );
      });
    });
    if (encontrou) {
      setTimeout(aplicarAccordion, 200);
      try { observer.disconnect(); } catch (_) {}
      try { window._patchAccordionObs = null; } catch (_) {}
    }
  });
  window._patchAccordionObs.observe(document.body, { childList: true, subtree: true });

  setTimeout(aplicarAccordion, 1000);
  setTimeout(aplicarAccordion, 2000);

  function patchToggleMobMenu() {
    if (window.toggleMobMenu && !window.toggleMobMenu._patched) {
      var _origToggleMob = window.toggleMobMenu;
      window.toggleMobMenu = function() {
        var res = typeof _origToggleMob === 'function' ? _origToggleMob.apply(this, arguments) : undefined;
        setTimeout(function() {
          var menu = document.getElementById('mob-more-body') ||
            document.querySelector('.mob-more-b') ||
            document.querySelector('.mob-menu, #mob-menu, [id*="mob-menu"], [class*="mob-menu"]');
          if (menu && !menu.querySelector('#btn-personalizar-hotbar')) {
            var btn = document.createElement('button');
            btn.id = 'btn-personalizar-hotbar';
            btn.textContent = 'Personalizar barra de navegacao';
            btn.style.cssText = 'width:100%;padding:12px;background:rgba(74,144,217,0.15);color:#4A90D9;' +
              'border:1px solid rgba(74,144,217,0.3);border-radius:8px;cursor:pointer;font-size:13px;margin-bottom:10px';
            btn.onclick = function() { try { window.abrirPersonalizarHotbar(); } catch(e) {} };
            try { menu.insertBefore(btn, menu.firstChild); } catch(_) { menu.appendChild(btn); }
          }
        }, 100);
        return res;
      };
      window.toggleMobMenu._patched = true;
    }
  }

  window.abrirPersonalizarHotbar = function() {
    try { var m = document.getElementById('modal-menu-mais'); if (m) m.remove(); } catch(_) {}
    try {
      var old = document.getElementById('modal-personalizar-hotbar');
      if (old) { old.remove(); return; }
    } catch(e) {}

    var ativos = getHotbarConfig();
    var overlay = document.createElement('div');
    overlay.id = 'modal-personalizar-hotbar';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:flex-end';

    var configHtml = HOTBAR_ABAS.map(function(aba) {
      var fixo = !!aba.fixo;
      var ativo = ativos.indexOf(aba.id) !== -1;
      return '<label style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:' + (fixo?'default':'pointer') + '">' +
        '<input type="checkbox" ' + (ativo?'checked':'') + ' ' + (fixo?'disabled':'') +
        ' onchange="toggleHotbarAba(&quot;' + aba.id + '&quot;,this.checked)" style="width:20px;height:20px;cursor:' + (fixo?'default':'pointer') + '">' +
        '<span style="font-size:13px;font-weight:800;min-width:40px;color:#e2e8f0">' + aba.icone + '</span>' +
        '<span style="color:' + (fixo?'#64748b':'#e2e8f0') + ';font-size:15px">' + aba.label + (fixo?' (fixo)':'') + '</span>' +
      '</label>';
    }).join('');

    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:#0b1220;border-radius:20px 20px 0 0;width:100%;padding:20px 16px 40px;max-height:80vh;overflow-y:auto';
    sheet.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
        '<span style="color:#e2e8f0;font-weight:700;font-size:16px">Personalizar navegacao</span>' +
        '<button onclick="document.getElementById(&quot;modal-personalizar-hotbar&quot;).remove()" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer">X</button>' +
      '</div>' +
      '<p style="color:#64748b;font-size:13px;margin-bottom:12px">Maximo 4 abas. Hub e Maquinas sao fixos.</p>' +
      configHtml;

    overlay.appendChild(sheet);
    overlay.addEventListener('click', function(e2){ if(e2.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  };

  function patchAbrirOfRapida() { return; }

  window.renderProjecaoVendas = async function(anoExibir) {
    var container = document.getElementById('widget-projecao-vendas');
    if (!container) return;
    anoExibir = anoExibir || new Date().getFullYear();
    container.innerHTML = '<p style="color:#64748b;text-align:center;padding:20px;font-size:13px">Carregando projecao...</p>';
    var token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    var h = token ? { 'Authorization': 'Bearer ' + token } : {};
    try {
      var r = await fetch('/api/dashboard/faturamento-mensal?t=' + Date.now(), { headers: h });
      var d = await r.json();
      var meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      var hoje = new Date();
      var anoAtual = hoje.getFullYear();
      var mesAtual = hoje.getMonth() + 1;
      var mapa = {};
      (d.dados || []).forEach(function(m){ mapa[m.ano + '-' + m.mes] = m; });
      (d.futuros || []).forEach(function(m){ mapa[m.ano + '-' + m.mes] = m; });

      var maxVal = 1;
      for (var mm = 1; mm <= 12; mm++) {
        var v = (mapa[anoExibir + '-' + mm] || {}).valor || 0;
        if (v > maxVal) maxVal = v;
      }
      var totalAno = 0;
      for (var mm2 = 1; mm2 <= 12; mm2++) {
        totalAno += (mapa[anoExibir + '-' + mm2] || {}).valor || 0;
      }
      function fmt(v){
        if(!v) return 'R$ 0';
        if(v >= 1000000) return 'R$ ' + (v/1000000).toFixed(1) + 'M';
        if(v >= 1000) return 'R$ ' + (v/1000).toFixed(0) + 'k';
        return 'R$ ' + parseFloat(v).toFixed(0);
      }

      var anos = [];
      for (var a = anoAtual - 2; a <= anoAtual + 2; a++) anos.push(a);
      var botoesAno = anos.map(function(a2){
        return '<button onclick="window.renderProjecaoVendas(' + a2 + ')" style="border:none;border-radius:20px;padding:3px 10px;cursor:pointer;font-size:11px;background:' + (a2 === anoExibir ? '#4A90D9' : 'rgba(255,255,255,0.07)') + ';color:' + (a2 === anoExibir ? '#fff' : '#94a3b8') + '">' + a2 + (a2 > anoAtual ? '*' : '') + '</button>';
      }).join('');

      var barras = '';
      for (var mm3 = 1; mm3 <= 12; mm3++) {
        var k = anoExibir + '-' + mm3;
        var item = mapa[k] || { valor: 0, fonte: 'vazio' };
        var val = item.valor || 0;
        var fonte = item.fonte || 'vazio';
        var ehAtual = (anoExibir === anoAtual && mm3 === mesAtual);
        var pct = Math.round((val / maxVal) * 100);
        var cor = fonte === 'of' ? '#10b981' : (fonte === 'manual' ? '#f59e0b' : (fonte === 'projecao' ? 'rgba(74,144,217,0.6)' : 'rgba(255,255,255,0.04)'));
        var lbl = val > 0 ? (fonte === 'projecao' ? '~' + fmt(val) : fmt(val)) : '-';
        var obs = item.obs || '';
        barras += '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;min-width:0">' +
          '<span style="font-size:8px;color:#94a3b8;white-space:nowrap;overflow:hidden;max-width:100%;text-align:center">' + lbl + '</span>' +
          '<div style="width:100%;background:rgba(255,255,255,0.05);border-radius:4px 4px 0 0;height:120px;display:flex;align-items:flex-end;position:relative;cursor:pointer" onclick="window.editarMesFaturamento(' + anoExibir + ',' + mm3 + ',' + val + ',&quot;' + String(obs).replace(/&/g,'&amp;').replace(/\"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '&quot;)" title="Clique para editar">' +
            (ehAtual ? '<div style="position:absolute;inset:0;border:2px solid #f59e0b;border-radius:4px;pointer-events:none"></div>' : '') +
            '<div style="width:100%;border-radius:4px 4px 0 0;background:' + cor + ';height:' + Math.max(pct, val > 0 ? 3 : 0) + '%"></div>' +
          '</div>' +
          '<span style="font-size:9px;color:' + (ehAtual ? '#f59e0b' : '#64748b') + ';font-weight:' + (ehAtual ? '700' : '400') + '">' + meses[mm3-1] + '</span>' +
        '</div>';
      }

      container.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px">' +
          '<span style="color:#e2e8f0;font-weight:700;font-size:14px">Projecao de Vendas</span>' +
          '<div style="display:flex;gap:4px;flex-wrap:wrap">' + botoesAno + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
          '<div style="background:rgba(16,185,129,0.1);border-radius:8px;padding:8px 12px;flex:1;min-width:90px"><div style="color:#64748b;font-size:10px">Total ' + anoExibir + '</div><div style="color:#10b981;font-size:14px;font-weight:700">' + fmt(totalAno) + '</div></div>' +
          '<div style="background:rgba(74,144,217,0.1);border-radius:8px;padding:8px 12px;flex:1;min-width:90px"><div style="color:#64748b;font-size:10px">Tend. mensal</div><div style="color:#4A90D9;font-size:14px;font-weight:700">' + ((d.crescimento_pct >= 0) ? '+' : '') + d.crescimento_pct + '%</div></div>' +
          '<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px 12px;flex:1;min-width:90px"><div style="color:#64748b;font-size:10px">Base</div><div style="color:#94a3b8;font-size:13px;font-weight:600">' + (d.base_meses || 0) + ' meses</div></div>' +
        '</div>' +
        '<div style="display:flex;gap:3px;align-items:flex-end;height:120px;padding:0 2px">' + barras + '</div>' +
        '<div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">' +
          '<div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;background:#10b981;border-radius:2px"></div><span style="color:#64748b;font-size:10px">Sistema</span></div>' +
          '<div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;background:#f59e0b;border-radius:2px"></div><span style="color:#64748b;font-size:10px">Manual</span></div>' +
          '<div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;background:rgba(74,144,217,0.6);border-radius:2px"></div><span style="color:#64748b;font-size:10px">Projecao</span></div>' +
          '<span style="color:#4A90D9;font-size:10px;cursor:pointer;margin-left:auto" onclick="window.renderProjecaoVendas(' + anoExibir + ')">Atualizar</span>' +
        '</div>';
    } catch(e) {
      container.innerHTML = '<p style="color:#f43f5e;text-align:center;padding:16px;font-size:13px">Erro ao carregar projecao.</p>';
      console.error('[PATCH] projecaoVendas:', e);
    }
  };

  window.editarMesFaturamento = function(ano, mes, valorAtual, obsAtual) {
    try {
      var old = document.getElementById('modal-fat-manual');
      if (old) old.remove();
    } catch(e) {}
    var mesesNomes = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    var overlay = document.createElement('div');
    overlay.id = 'modal-fat-manual';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px';
    overlay.innerHTML =
      '<div style="background:#0f172a;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:20px;width:100%;max-width:360px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
          '<span style="color:#e2e8f0;font-weight:700">' + mesesNomes[mes-1] + '/' + ano + '</span>' +
          '<button id="fat-close" style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer">X</button>' +
        '</div>' +
        '<label style="color:#94a3b8;font-size:12px;display:block;margin-bottom:6px">Valor do mes (R$)</label>' +
        '<input id="fat-val" type="number" min="0" step="0.01" value="' + (valorAtual || '') + '" placeholder="Ex: 150000" style="width:100%;background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;font-size:16px;box-sizing:border-box;margin-bottom:12px">' +
        '<label style="color:#94a3b8;font-size:12px;display:block;margin-bottom:6px">Observacao (opcional)</label>' +
        '<input id="fat-obs" type="text" value="' + (obsAtual || '') + '" placeholder="Ex: dados estimados" style="width:100%;background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;font-size:14px;box-sizing:border-box;margin-bottom:16px">' +
        '<div style="display:flex;gap:8px">' +
          '<button id="fat-save" style="flex:1;background:#4A90D9;color:#fff;border:none;border-radius:8px;padding:10px;cursor:pointer;font-size:14px;font-weight:600">Salvar</button>' +
          (valorAtual > 0 ? '<button id="fat-del" style="background:rgba(239,68,68,0.15);color:#f43f5e;border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:10px;cursor:pointer;font-size:13px">Remover</button>' : '') +
        '</div>' +
      '</div>';
    overlay.addEventListener('click', function(e2){ if (e2.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    var c = document.getElementById('fat-close');
    if (c) c.onclick = function(){ overlay.remove(); };
    var s = document.getElementById('fat-save');
    if (s) s.onclick = function(){ window.salvarFatManual(ano, mes); };
    var d = document.getElementById('fat-del');
    if (d) d.onclick = function(){ window.deletarFatManual(ano, mes); };
    setTimeout(function(){
      var el = document.getElementById('fat-val');
      if (el) { try { el.focus(); el.select(); } catch(_) {} }
    }, 100);
  };

  window.salvarFatManual = async function(ano, mes) {
    var vEl = document.getElementById('fat-val');
    var oEl = document.getElementById('fat-obs');
    var valor = parseFloat(vEl ? (vEl.value || '0') : '0');
    var obs = oEl ? (oEl.value || '') : '';
    if (isNaN(valor) || valor < 0) { alert('Valor invalido'); return; }
    var token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    try {
      var r = await fetch('/api/dashboard/faturamento-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ ano: ano, mes: mes, valor: valor, observacao: obs })
      });
      var d = await r.json();
      if (d && d.ok) {
        try { var m = document.getElementById('modal-fat-manual'); if (m) m.remove(); } catch(_) {}
        window.renderProjecaoVendas(ano);
      } else {
        alert('Erro: ' + ((d && d.error) ? d.error : 'Tente novamente'));
      }
    } catch(e) { alert('Erro de conexao'); }
  };

  window.deletarFatManual = async function(ano, mes) {
    if (!confirm('Remover valor manual de ' + mes + '/' + ano + '?')) return;
    var token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    try {
      var r = await fetch('/api/dashboard/faturamento-manual/' + ano + '/' + mes, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var d = await r.json();
      if (d && d.ok) {
        try { var m = document.getElementById('modal-fat-manual'); if (m) m.remove(); } catch(_) {}
        window.renderProjecaoVendas(ano);
      }
    } catch(e) { alert('Erro de conexao'); }
  };

  function patchRenderHub() {
    if (window.renderHub && !window.renderHub._patched) {
      var _orig = window.renderHub;
      window.renderHub = async function() {
        var res = await _orig.apply(this, arguments);
        setTimeout(function() {
          try { window.carregarPassagensHoje(); } catch(_) {}
        }, 400);
        return res;
      };
      window.renderHub._patched = true;
      console.log('[PATCH] renderHub interceptada');
    }
  }

  function patchGoAcordeon() { return; }

  console.log('[PATCH] v3 ativo - Italy Embalagens ERP');
  patchToggleMobMenu();
  patchRenderHub();
  try{
    function _bindSwipeMaquinas(){
      try{
        if (typeof window._isMobileLike === 'function' && !window._isMobileLike()) return;
      }catch(_){}
      if (String(window._PAGE_ATUAL || '') !== 'ofmaq') return;
      var container = document.getElementById('ofs-por-maquina-container') || document.getElementById('ofsmaq-container') || document.getElementById('ofmaq-body');
      if (!container) return;
      if (container.dataset && container.dataset._swipeMaqBound === '1') return;
      if (container.dataset) container.dataset._swipeMaqBound = '1';

      if (!document.getElementById('patch-swipe-style')) {
        var st = document.createElement('style');
        st.id = 'patch-swipe-style';
        st.textContent = '@keyframes patchSwipeFade{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-60%) scale(.92)}}';
        document.head.appendChild(st);
      }

      var sx = 0;
      var sy = 0;
      container.addEventListener('touchstart', function(e){
        try{
          var t = e.touches && e.touches[0];
          if(!t) return;
          sx = t.clientX;
          sy = t.clientY;
        }catch(_){}
      }, { passive:true });

      container.addEventListener('touchend', function(e){
        try{
          if (String(window._PAGE_ATUAL || '') !== 'ofmaq') return;
          var view = String(window._ofmaqView || 'dia').trim().toLowerCase() || 'dia';
          if (view !== 'dia') return;

          var t = e.changedTouches && e.changedTouches[0];
          if(!t) return;
          var dx = t.clientX - sx;
          var dy = t.clientY - sy;
          if (Math.abs(dx) < 60) return;
          if (Math.abs(dy) > Math.abs(dx) * 0.7) return;

          var sel = document.getElementById('ofsmaq-select-maquina') || document.getElementById('ofsmaq-filtro-maquina');
          if (!sel || !sel.options || sel.options.length < 2) return;
          var opts = Array.prototype.slice.call(sel.options).map(function(o){ return String(o && o.value || '').trim(); }).filter(Boolean);
          if (!opts.length) return;
          var cur = String(sel.value || '').trim();
          var idx = opts.indexOf(cur);
          if (idx < 0) idx = (dx < 0 ? -1 : opts.length);
          var next = dx < 0 ? opts[idx + 1] : opts[idx - 1];
          if (!next) return;

          sel.value = next;
          try{ sel.dispatchEvent(new Event('change', { bubbles:true })); }catch(_){
            try{ if(typeof window.renderOFsPorMaquina === 'function') window.renderOFsPorMaquina(); }catch(__){}
          }

          var indicator = document.createElement('div');
          indicator.textContent = (dx < 0 ? '→ ' : '← ') + next;
          indicator.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(74,144,217,0.92);color:#fff;padding:10px 18px;border-radius:20px;font-size:15px;font-weight:700;z-index:9999;pointer-events:none;animation:patchSwipeFade .85s forwards';
          document.body.appendChild(indicator);
          setTimeout(function(){ try{ indicator.remove(); }catch(_){ } }, 900);
        }catch(_){}
      }, { passive:true });
    }

    ['renderOFsPorMaquina','ofsMaqFiltroDia','ofmaqNav'].forEach(function(nome){
      try{
        var fn = window[nome];
        if (typeof fn !== 'function') return;
        if (fn._patchedSwipeMaq) return;
        window[nome] = function(){
          var r = fn.apply(this, arguments);
          setTimeout(_bindSwipeMaquinas, 280);
          return r;
        };
        window[nome]._patchedSwipeMaq = true;
      }catch(_){}
    });

    setTimeout(_bindSwipeMaquinas, 900);
  }catch(_){}
  try{ setTimeout(function(){ try{ renderHotbar(); }catch(e){} }, 200); }catch(e){}
  try{
    setTimeout(function(){
      try{
        atualizarAbaAtiva();
        setInterval(function(){ try{ atualizarAbaAtiva(); }catch(e){} }, 1200);
      }catch(e){}
    }, 700);
  }catch(e){}
  setTimeout(function(){ try { aplicarAccordion(); } catch(e) {} }, 800);

  setInterval(function() {
    try {
      patchToggleMobMenu();
      patchRenderHub();
    } catch(e) {}
  }, 1000);

})();
} catch (e) {
  try { console.error('[PATCH INIT ERROR]', e && e.message, e && e.stack); } catch (_) {}
}

(function(){ return;
  try{
    var cssM = `
@media (max-width: 768px) {

  /* LAYOUT */
  .sidebar, #sidebar, nav.side, .side-nav {
    display: none !important;
  }
  .content, #content, .main-content, #main-content,
  .content-area, .app-content {
    margin-left: 0 !important;
    padding: 8px 12px 80px !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  [id^="page-"] {
    max-width: 100% !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }
  body { padding-bottom: 70px !important; }

  /* BOTTOM NAV — classes reais do sistema */
  .mobile-bottom-nav, #mobile-bottom-nav {
    display: flex !important;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 64px !important;
    background: #0b0b1a !important;
    border-top: 1px solid rgba(255,255,255,0.1) !important;
    align-items: center !important;
    justify-content: space-around !important;
    padding: 0 4px !important;
    padding-bottom: env(safe-area-inset-bottom, 0px) !important;
    z-index: 1000 !important;
    box-sizing: border-box !important;
  }

  /* Botão da bottom nav — classe real: mbn-item */
  .mbn-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 3px !important;
    padding: 8px 10px !important;
    border-radius: 10px !important;
    min-width: 52px !important;
    cursor: pointer !important;
    border: none !important;
    background: transparent !important;
    color: #64748b !important;
    transition: all 0.15s !important;
    flex: 1 !important;
  }
  .mbn-item:active {
    background: rgba(255,255,255,0.06) !important;
    transform: scale(0.92) !important;
  }
  .mbn-item.ativo, .mbn-item.active {
    background: rgba(99,102,241,0.12) !important;
    color: #818cf8 !important;
  }
  .mbn-item svg {
    width: 22px !important;
    height: 22px !important;
  }

  /* Ícone e label — classes reais: mbn-ico, mbn-lbl */
  .mbn-ico {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 0 !important;
    line-height: 0 !important;
  }
  .mbn-lbl {
    font-size: 9px !important;
    font-weight: 600 !important;
    letter-spacing: 0.3px !important;
    text-transform: uppercase !important;
    line-height: 1 !important;
    color: inherit !important;
  }

  /* SIDEBAR oculta no mobile */
  .sidebar, #sidebar,
  [class*="sidebar"]:not(.mobile-bottom-nav) {
    display: none !important;
  }

  /* TOPBAR compacto */
  .topbar, #topbar, .top-bar, #top-bar,
  [class*="topbar"] {
    height: 54px !important;
    padding: 0 12px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 200 !important;
    background: #0b0b1a !important;
    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
    box-sizing: border-box !important;
  }

  /* CARDS DE OF */
  .mob-of-cards {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    padding: 10px 0 20px !important;
  }
  .mob-of-card {
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 14px !important;
    padding: 14px !important;
  }
  .mob-of-card.urgente-card {
    border-left: 3px solid #f59e0b !important;
  }
  .mob-of-card.atrasado-card {
    border-left: 3px solid #ef4444 !important;
  }
  .mob-of-card-top {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    margin-bottom: 8px !important;
  }
  .mob-of-num {
    font-size: 14px !important;
    font-weight: 800 !important;
    color: #818cf8 !important;
  }
  .mob-of-badge {
    font-size: 9px !important;
    font-weight: 700 !important;
    padding: 3px 8px !important;
    border-radius: 5px !important;
    text-transform: uppercase !important;
  }
  .mob-of-badge.urgente  { background: rgba(245,158,11,0.15); color: #f59e0b; }
  .mob-of-badge.atrasado { background: rgba(239,68,68,0.15);  color: #ef4444; }
  .mob-of-badge.ok       { background: rgba(34,197,94,0.12);  color: #22c55e; }
  .mob-of-cliente {
    font-size: 15px !important;
    font-weight: 700 !important;
    color: #f1f5f9 !important;
    margin-bottom: 6px !important;
  }
  .mob-of-row {
    display: flex !important;
    gap: 12px !important;
    flex-wrap: wrap !important;
    margin-bottom: 4px !important;
  }
  .mob-of-meta {
    font-size: 11px !important;
    color: #64748b !important;
  }
  .mob-of-entrega {
    font-size: 12px !important;
    font-weight: 600 !important;
    margin: 6px 0 !important;
  }
  .mob-of-entrega.atrasada { color: #ef4444 !important; }
  .mob-of-entrega.urgente  { color: #f59e0b !important; }
  .mob-of-entrega.ok       { color: #64748b !important; }
  .mob-of-total {
    font-size: 14px !important;
    font-weight: 700 !important;
    color: #22c55e !important;
  }
  .mob-of-unitario {
    font-size: 11px !important;
    color: #64748b !important;
  }
  .mob-of-processo {
    font-size: 11px !important;
    color: #475569 !important;
    margin: 4px 0 6px !important;
    text-transform: uppercase !important;
  }
  .mob-of-bottom {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-top: 10px !important;
    padding-top: 10px !important;
    border-top: 1px solid rgba(255,255,255,0.06) !important;
    gap: 6px !important;
  }
  .mob-of-img-thumb {
    width: 42px !important;
    height: 42px !important;
    border-radius: 8px !important;
    object-fit: cover !important;
    flex-shrink: 0 !important;
    cursor: pointer !important;
  }
  .mob-of-actions {
    display: flex !important;
    gap: 6px !important;
    flex: 1 !important;
    justify-content: flex-end !important;
  }
  .mob-of-btn {
    padding: 8px 10px !important;
    border: none !important;
    border-radius: 8px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    flex: 1 !important;
    touch-action: manipulation !important;
  }
  .mob-of-btn:active { transform: scale(0.93) !important; }
  .mob-of-btn.alterar  { background: rgba(30,58,138,0.6);  color: #93c5fd; }
  .mob-of-btn.cancelar { background: rgba(69,10,10,0.6);   color: #fca5a5; }
  .mob-of-btn.rapida   { background: rgba(30,30,58,0.6);   color: #a5b4fc; }

  /* DRAWER */
  #mob-more-drawer {
    position: fixed !important;
    bottom: 64px !important;
    left: 0 !important;
    right: 0 !important;
    max-height: 78vh !important;
    background: #0d0d20 !important;
    border-radius: 20px 20px 0 0 !important;
    border-top: 1px solid rgba(255,255,255,0.1) !important;
    transform: translateY(110%) !important;
    transition: transform 0.3s cubic-bezier(0.34,1.2,0.64,1) !important;
    z-index: 998 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }
  #mob-more-drawer.open {
    transform: translateY(0) !important;
  }
  .mob-drawer-handle {
    width: 36px !important;
    height: 4px !important;
    background: rgba(255,255,255,0.15) !important;
    border-radius: 2px !important;
    margin: 12px auto 0 !important;
    flex-shrink: 0 !important;
  }
  .mob-drawer-search-wrap {
    padding: 12px 14px 8px !important;
  }
  .mob-drawer-search {
    width: 100% !important;
    padding: 10px 14px !important;
    background: rgba(255,255,255,0.06) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 10px !important;
    color: #fff !important;
    font-size: 14px !important;
    box-sizing: border-box !important;
    outline: none !important;
  }
  .mob-drawer-grid {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8px !important;
    padding: 8px 14px 20px !important;
    overflow-y: auto !important;
  }
  .mob-drawer-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 5px !important;
    padding: 12px 6px !important;
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 12px !important;
    cursor: pointer !important;
    text-align: center !important;
  }
  .mob-drawer-item:active {
    background: rgba(99,102,241,0.15) !important;
    transform: scale(0.95) !important;
  }
  .mob-drawer-item span {
    font-size: 10px !important;
    color: #94a3b8 !important;
    line-height: 1.2 !important;
    font-weight: 500 !important;
  }
  .mob-drawer-overlay {
    position: fixed !important;
    inset: 0 !important;
    background: rgba(0,0,0,0.6) !important;
    z-index: 997 !important;
    display: none !important;
  }
  .mob-drawer-overlay.open { display: block !important; }

  /* BUSCA GLOBAL */
  .mob-search-overlay {
    position: fixed !important;
    inset: 0 !important;
    background: #080815 !important;
    z-index: 1100 !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 16px !important;
    transform: translateY(-100%) !important;
    transition: transform 0.25s ease !important;
    box-sizing: border-box !important;
  }
  .mob-search-overlay.open {
    transform: translateY(0) !important;
  }
  .mob-search-header {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    margin-bottom: 16px !important;
  }
  .mob-search-input {
    flex: 1 !important;
    padding: 12px 16px !important;
    background: rgba(255,255,255,0.07) !important;
    border: 1px solid rgba(255,255,255,0.12) !important;
    border-radius: 12px !important;
    color: #fff !important;
    font-size: 16px !important;
    outline: none !important;
  }
  .mob-search-close {
    padding: 10px 14px !important;
    background: rgba(255,255,255,0.06) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 10px !important;
    color: #94a3b8 !important;
    cursor: pointer !important;
    font-size: 18px !important;
  }
  .mob-search-results {
    flex: 1 !important;
    overflow-y: auto !important;
  }
  .mob-search-item {
    padding: 12px !important;
    border-radius: 10px !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    margin-bottom: 8px !important;
    cursor: pointer !important;
    background: rgba(255,255,255,0.03) !important;
  }
  .mob-search-item-title {
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #e2e8f0 !important;
    margin-bottom: 3px !important;
  }
  .mob-search-item-sub {
    font-size: 11px !important;
    color: #64748b !important;
  }

  /* FORMULÁRIOS */
  input, select, textarea {
    font-size: 16px !important;
    min-height: 44px !important;
    box-sizing: border-box !important;
  }
  button, .btn, [class*="btn-"] {
    min-height: 44px !important;
    touch-action: manipulation !important;
  }

  /* TABELAS GENÉRICAS */
  table {
    display: block !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    white-space: nowrap !important;
  }

  /* KANBAN */
  .kb-board, [class*="kb-board"] {
    overflow-x: auto !important;
    scroll-snap-type: x mandatory !important;
    display: flex !important;
    gap: 10px !important;
  }
  .kb-col, [class*="kb-col"] {
    min-width: 270px !important;
    scroll-snap-align: start !important;
    flex-shrink: 0 !important;
  }

  /* DASHBOARD */
  [class*="dashboard-cards"], [class*="kpi-cards"],
  [class*="stats-grid"] {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
  }

  /* CHAT */
  #chat-painel {
    width: 100% !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 64px !important;
    height: 60vh !important;
    border-radius: 16px 16px 0 0 !important;
  }

  /* MODAL BOTTOM SHEET */
  [id*="modal"][style*="display: flex"],
  [id*="modal"][style*="display:flex"] {
    align-items: flex-end !important;
    padding: 0 !important;
  }
  [id*="modal"] > div,
  [class*="modal-content"] {
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 18px 18px 0 0 !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    margin: 0 !important;
  }

  /* TIPOGRAFIA */
  h1 { font-size: 18px !important; }
  h2 { font-size: 16px !important; }
  h3 { font-size: 15px !important; }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 3px !important; height: 3px !important; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15) !important; border-radius: 3px !important; }
}

@media (max-width: 480px) {
  .mob-drawer-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar, #sidebar {
    width: 200px !important;
  }
  .main-content, #main-content, .content {
    margin-left: 200px !important;
  }
}
`;

    var elCSS = document.getElementById('patch-css-mobile');
    if (!elCSS) {
      elCSS = document.createElement('style');
      elCSS.id = 'patch-css-mobile';
      (document.head || document.documentElement).appendChild(elCSS);
    }
    elCSS.textContent = cssM;

    try{
      var nav = document.getElementById('mobile-bottom-nav');
      if (nav) {
        Array.prototype.forEach.call(nav.querySelectorAll('.mbn-item'), function(b){
          try{ b.classList.add('mob-nav-item'); }catch(e){}
        });
        Array.prototype.forEach.call(nav.querySelectorAll('.mbn-lbl'), function(l){
          try{ l.classList.add('mob-nav-label'); }catch(e){}
        });
      }
    }catch(e){}

    console.log('[PATCH] Mobile CSS v2 aplicado');
  }catch(e){}
})();

(function initMobileNav() {
  return;
  if (typeof isMobile !== 'function' || !isMobile()) return;
  if (typeof isMobile !== 'function' || !isMobile()) return;

  function buildBottomNav() {
    var nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;
    var items = [
      { id:'mob-nav-hub',  page:'hub',     label:'Hub',
        icon:'<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
      { id:'mob-nav-pcp',  page:'pcp',     label:'PCP',
        icon:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' },
      { id:'mob-nav-maq',  page:'ofmaq',   label:'Máquinas',
        icon:'<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
      { id:'mob-nav-est',  page:'estoque', label:'Estoque',
        icon:'<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>' },
      { id:'mob-nav-mais', page:null,      label:'Mais',
        icon:'<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>' }
    ];
    nav.innerHTML = items.map(function(it) {
      return '<button class="mob-nav-item" id="' + it.id + '" ' +
        'onclick="' + (it.page
          ? 'go(\'' + it.page + '\');_setMobNav(\'' + it.id + '\')'
          : '_toggleMobDrawer()') + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          it.icon + '</svg>' +
        '<span class="mob-nav-label">' + it.label + '</span>' +
        '</button>';
    }).join('');
  }

  window._setMobNav = function(activeId) {
    document.querySelectorAll('.mob-nav-item').forEach(function(el) {
      el.classList.toggle('active', el.id === activeId);
    });
  };

  var MODULOS = [
    {label:'Hub',             page:'hub'},
    {label:'PCP',             page:'pcp'},
    {label:'OF Máquina',      page:'ofmaq'},
    {label:'Hist. Passagens', page:'historico-passagens'},
    {label:'Agenda',          page:'agenda'},
    {label:'Amostras',        page:'amostras'},
    {label:'Orçamentos',      page:'orcamentos'},
    {label:'Clientes',        page:'clientes'},
    {label:'Mapa Clientes',   page:'mapa-clientes'},
    {label:'Estoque',         page:'estoque'},
    {label:'Sel. Chapas',     page:'sel-chapas'},
    {label:'Papelão IA',      page:'papelao-ia'},
    {label:'Máquinas',        page:'maquinas'},
    {label:'Tempos Reais',    page:'tempos-reais'},
    {label:'Tipos Caixa',     page:'tipos-caixa'},
    {label:'Fluxos',          page:'fluxos'},
    {label:'Facas',           page:'facas1'},
    {label:'Clichês',         page:'cliches'},
    {label:'Pedidos Rec.',    page:'pedidos-recorrentes'},
    {label:'Relatórios',      page:'relatorios'},
    {label:'Rel. Mensal',     page:'relmensal'},
    {label:'Dashboard',       page:'dashboard'},
    {label:'Comissões',       page:'comissoes'},
    {label:'Vendedores',      page:'vendedores'},
    {label:'Usuários',        page:'usuarios'},
    {label:'Fornecedores',    page:'fornecedores'},
    {label:'Compras',         page:'compras'},
    {label:'Operadores',      page:'operadores'},
    {label:'Contas Pagar',    page:'contaspagar'},
    {label:'Contas Receber',  page:'contasreceber'},
    {label:'NFe',             page:'nfe'},
    {label:'Logística',       page:'logistica'},
    {label:'Motoristas',      page:'motoristas'},
    {label:'Roteiro Ent.',    page:'roteiro-entrega'},
    {label:'Lançamento',      page:'lancamento'},
    {label:'Qualidade',       page:'qualidade'},
    {label:'Inconform.',      page:'inconformidades'},
    {label:'Cx. Perdidas',    page:'caixas-perdidas'},
    {label:'Arte Final',      page:'artefinal'},
    {label:'SIMD',            page:'simd'},
    {label:'Tablets',         page:'tablets'},
    {label:'Apontamento',     page:'apontamento'},
    {label:'Configurações',   page:'configuracoes'},
    {label:'Facas 2',         page:'facas2'}
  ];
  window._DRAWER_MODULOS = MODULOS;

  function buildDrawer() {
    var ex = document.getElementById('mob-more-drawer');
    if (ex) ex.remove();

    var overlay = document.createElement('div');
    overlay.className = 'mob-drawer-overlay';
    overlay.id = 'mob-drawer-overlay';
    overlay.onclick = function() { _toggleMobDrawer(false); };
    document.body.appendChild(overlay);

    var drawer = document.createElement('div');
    drawer.id = 'mob-more-drawer';
    drawer.innerHTML =
      '<div class="mob-drawer-handle"></div>' +
      '<div class="mob-drawer-search-wrap">' +
        '<input class="mob-drawer-search" id="mob-drawer-search-input" ' +
          'type="search" placeholder="Buscar módulo..." ' +
          'oninput="_filterDrawer(this.value)">' +
      '</div>' +
      '<div class="mob-drawer-grid" id="mob-drawer-grid"></div>';
    document.body.appendChild(drawer);
    _renderDrawerItems('');
  }

  window._renderDrawerItems = function(filtro) {
    var grid = document.getElementById('mob-drawer-grid');
    if (!grid) return;
    var f = (filtro || '').toLowerCase().trim();
    var lista = f ? MODULOS.filter(function(m) {
      return m.label.toLowerCase().indexOf(f) !== -1;
    }) : MODULOS;
    grid.innerHTML = lista.map(function(m) {
      return '<div class="mob-drawer-item" onclick="_goFromDrawer(\'' + m.page + '\')">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
          'stroke-linecap="round" stroke-linejoin="round" width="22" height="22">' +
          '<rect x="3" y="3" width="7" height="7" rx="1"/>' +
          '<rect x="14" y="3" width="7" height="7" rx="1"/>' +
          '<rect x="3" y="14" width="7" height="7" rx="1"/>' +
          '<rect x="14" y="14" width="7" height="7" rx="1"/>' +
        '</svg>' +
        '<span>' + m.label + '</span>' +
      '</div>';
    }).join('');
  };

  window._filterDrawer = function(v) { _renderDrawerItems(v); };

  window._goFromDrawer = function(page) {
    _toggleMobDrawer(false);
    if (typeof go === 'function') go(page);
  };

  window._toggleMobDrawer = function(forceState) {
    var drawer  = document.getElementById('mob-more-drawer');
    var overlay = document.getElementById('mob-drawer-overlay');
    if (!drawer) return;
    var open = typeof forceState === 'boolean'
      ? forceState
      : !drawer.classList.contains('open');
    drawer.classList.toggle('open', open);
    if (overlay) overlay.classList.toggle('open', open);
    if (open) {
      var inp = document.getElementById('mob-drawer-search-input');
      if (inp) { inp.value = ''; _renderDrawerItems(''); }
    }
  };

  function buildStatusBadges() {
    var topbar = document.querySelector(
      '.topbar, #topbar, .top-bar, #top-bar');
    if (!topbar || document.getElementById('mob-status-badges')) return;
    var wrap = document.createElement('div');
    wrap.className = 'mob-status-badges';
    wrap.id = 'mob-status-badges';
    wrap.innerHTML =
      '<div class="mob-badge atrasados">' +
        '<span class="mob-badge-num" id="mob-badge-atrasados">0</span>ATRASADOS' +
      '</div>' +
      '<div class="mob-badge urgentes">' +
        '<span class="mob-badge-num" id="mob-badge-urgentes">0</span>URGENTES' +
      '</div>' +
      '<div class="mob-badge concluidos">' +
        '<span class="mob-badge-num" id="mob-badge-concluidos">0</span>CONCLUÍDOS' +
      '</div>';
    topbar.appendChild(wrap);
    function syncBadges() {
      [
        ['#mob-badge-atrasados',
         '[id*="count-atrasados"],[id*="badge-atrasados"],[data-count="atrasados"]'],
        ['#mob-badge-urgentes',
         '[id*="count-urgentes"],[id*="badge-urgentes"],[data-count="urgentes"]'],
        ['#mob-badge-concluidos',
         '[id*="count-concluidos"],[id*="badge-concluidos"],[data-count="concluidos"]']
      ].forEach(function(pair) {
        var mob = document.querySelector(pair[0]);
        var src = document.querySelector(pair[1]);
        if (mob && src) {
          var v = (src.textContent || src.innerText || '0').trim();
          if (v !== mob.textContent) mob.textContent = v;
        }
      });
    }
    setInterval(syncBadges, 2000);
    syncBadges();
  }

  function init() {
    buildStatusBadges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

(function patchErpFixesV4() {
  try {
    if (!document.getElementById('patch-fixes-v4-style')) {
      var st = document.createElement('style');
      st.id = 'patch-fixes-v4-style';
      st.textContent = `
.historico-passagens,
#historico-passagens,
[id*="historico"],
[class*="historico-lista"]{
  overflow-y:auto !important;
  max-height:60vh !important;
}
.modal-box .historico-passagens,
.modal-box #historico-passagens,
.modal-box [id*="historico"],
.modal-box [class*="historico-lista"]{
  overflow-y:auto !important;
  max-height:60vh !important;
}

#page-historico-passagens{
  max-height:none !important;
  overflow:visible !important;
}
#hist-graficos-wrap{
  overflow:visible !important;
}
#hist-graficos-wrap > div > div > div[style*="height"]{
  position:relative !important;
  overflow:visible !important;
  height:260px !important;
}
#hist-graficos-wrap > div > div:nth-child(2) > div[style*="height"]{
  height:240px !important;
}
#hist-chart-semana,
#hist-chart-mes{
  display:block !important;
  width:100% !important;
  height:100% !important;
}

@media print{
  body, .relatorio-inativos, table, td, th, tr, span, p, div{
    color:#000 !important;
    -webkit-print-color-adjust:exact !important;
  }
}
.relatorio-inativos td,
.relatorio-inativos th,
.relatorio-inativos .cliente-nome,
#relatorio-inativos *{
  color:#1a1a1a !important;
}
      `;
      document.head.appendChild(st);
    }
  } catch (_) {}

  function patchHistoricoPassagensGraficos() {
    var fn = window.carregarGraficosPassagens;
    if (typeof fn !== 'function' || fn._patchFixChartMes) return;
    var wrapped = async function() {
      var r = await fn.apply(this, arguments);
      try {
        var cMes = document.getElementById('hist-chart-mes');
        var cSemana = document.getElementById('hist-chart-semana');
        if (cMes) {
          cMes.setAttribute('height', '240');
          cMes.style.height = '240px';
          cMes.style.maxHeight = 'none';
        }
        if (cSemana) {
          cSemana.setAttribute('height', '260');
          cSemana.style.height = '260px';
          cSemana.style.maxHeight = 'none';
        }
        var wrapMes = cMes ? cMes.parentElement : null;
        if (wrapMes) {
          wrapMes.style.position = 'relative';
          wrapMes.style.overflow = 'visible';
          wrapMes.style.height = '240px';
          wrapMes.style.maxHeight = 'none';
        }
        var wrapSemana = cSemana ? cSemana.parentElement : null;
        if (wrapSemana) {
          wrapSemana.style.position = 'relative';
          wrapSemana.style.overflow = 'visible';
          wrapSemana.style.height = '260px';
          wrapSemana.style.maxHeight = 'none';
        }
        try { if (window._histChartMes && typeof window._histChartMes.resize === 'function') window._histChartMes.resize(); } catch (_) {}
        try { if (window._histChartSemana && typeof window._histChartSemana.resize === 'function') window._histChartSemana.resize(); } catch (_) {}
      } catch (_) {}
      return r;
    };
    wrapped._patchFixChartMes = true;
    window.carregarGraficosPassagens = wrapped;
  }
  try { patchHistoricoPassagensGraficos(); } catch (_) {}

  function _normUpper(s) {
    var v = String(s == null ? '' : s).trim().toUpperCase();
    try { v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    v = v.replace(/\s+/g, ' ').trim();
    return v;
  }

  function _parseJsonMaybe(v) {
    if (v == null) return null;
    if (Array.isArray(v) || typeof v === 'object') return v;
    if (typeof v === 'string') {
      var s = v.trim();
      if (!s) return null;
      try { return JSON.parse(s); } catch (_) { return null; }
    }
    return null;
  }

  function _maquinasFromOf(of) {
    var list = [];
    if (!of || typeof of !== 'object') return list;
    var fluxo = _parseJsonMaybe(of.fluxo_maquinas) ?? _parseJsonMaybe(of.maq) ?? null;
    if (Array.isArray(fluxo)) {
      fluxo.forEach(function(m) {
        if (typeof m === 'string') list.push(m);
        else if (m && typeof m === 'object') list.push(m.nome || m.name || m.maquina || '');
      });
    }
    var ag = String(of.maquina_agendada || '').trim();
    if (ag) list.unshift(ag);
    list = list.map(function(x) { return String(x || '').trim(); }).filter(Boolean);
    var uniq = [];
    var seen = new Set();
    list.forEach(function(x) {
      var k = _normUpper(x);
      if (!k || seen.has(k)) return;
      seen.add(k);
      uniq.push(x);
    });
    return uniq;
  }

  function _opsFromOf(of) {
    var ops = [];
    if (!of || typeof of !== 'object') return ops;
    var raw = _parseJsonMaybe(of.operadores_conclusao);
    if (Array.isArray(raw)) {
      raw.forEach(function(o) {
        if (typeof o === 'string') ops.push(o);
        else if (o && typeof o === 'object') ops.push(o.nome || o.name || o.operador || o.usuario || '');
      });
    }
    var one = String(of.operador_conclusao || '').trim();
    if (one) ops.push(one);
    ops = ops.map(function(x) { return String(x || '').trim(); }).filter(Boolean);
    var uniq = [];
    var seen = new Set();
    ops.forEach(function(x) {
      var k = _normUpper(x);
      if (!k || seen.has(k)) return;
      seen.add(k);
      uniq.push(x);
    });
    return uniq;
  }

  async function _buscarOfPorNumero(numero) {
    var num = String(numero || '').replace(/\D/g, '').trim();
    if (!num) return null;
    var token = '';
    try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { token = ''; }
    var h = token ? { Authorization: 'Bearer ' + token } : {};
    var url = '/api/ofs?numero=' + encodeURIComponent(num) + '&lite=1&limit=5&excluir_canceladas=1&nocache=1&t=' + Date.now();
    var r = await fetch(url, { headers: h });
    var j = await r.json().catch(function() { return null; });
    var data = extractOfsRows(j);
    return (Array.isArray(data) && data[0]) ? data[0] : null;
  }

  function _preencherMaq(maqList) {
    var sel = document.getElementById('inc-maquina');
    if (sel && maqList.length) {
      var alvo = _normUpper(maqList[0]);
      var foundVal = '';
      try {
        Array.from(sel.options || []).forEach(function(opt) {
          if (foundVal) return;
          var txt = String(opt.textContent || opt.value || '').trim();
          if (_normUpper(txt) === alvo) foundVal = opt.value || txt;
        });
      } catch (_) {}
      if (foundVal) sel.value = foundVal;
      else sel.value = maqList[0];
    }
    var wrap = document.getElementById('inc-maquinas-checkboxes');
    if (wrap) {
      var set = new Set(maqList.map(_normUpper));
      Array.from(wrap.querySelectorAll('input[type="checkbox"]')).forEach(function(cb) {
        var v = String(cb.value || '').trim();
        cb.checked = !!(v && set.has(_normUpper(v)));
      });
    }
  }

  function _preencherOps(opsList) {
    var cont = document.getElementById('inc-operadores-of-lista');
    if (!cont) return;
    var set = new Set(opsList.map(_normUpper));
    Array.from(cont.querySelectorAll('input[type="checkbox"]')).forEach(function(cb) {
      var v = String(cb.value || '').trim();
      cb.checked = !!(v && set.has(_normUpper(v)));
    });
  }

  var _lastNum = '';
  var _lock = false;
  async function _onOfNumero() {
    if (_lock) return;
    var input = document.getElementById('inc-of-numero');
    if (!input) return;
    var num = String(input.value || '').replace(/\D/g, '').trim();
    if (!num || num === _lastNum) return;
    _lastNum = num;
    _lock = true;
    try {
      var of = await _buscarOfPorNumero(num);
      if (of) {
        _preencherMaq(_maquinasFromOf(of));
        _preencherOps(_opsFromOf(of));
      }
    } catch (_) {}
    _lock = false;
  }

  function _bindInc() {
    var input = document.getElementById('inc-of-numero');
    if (!input || input.dataset.patchAutoOf === '1') return;
    input.dataset.patchAutoOf = '1';
    input.addEventListener('blur', _onOfNumero, true);
    input.addEventListener('change', _onOfNumero, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(_bindInc, 200); setInterval(_bindInc, 900); });
  } else {
    setTimeout(_bindInc, 200);
    setInterval(_bindInc, 900);
  }
})();

(function initComissoesEditarQtdProduzida() {
  function escSel(s) {
    var v = String(s || '');
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(v);
    return v.replace(/[^a-zA-Z0-9_\-]/g, function(ch) { return '\\' + ch; });
  }

  function findOfById(ofId) {
    var id = String(ofId || '').trim();
    if (!id) return null;
    var d = window._comissoesData;
    var vds = d && Array.isArray(d.vendedores) ? d.vendedores : [];
    for (var i = 0; i < vds.length; i++) {
      var ofs = vds[i] && Array.isArray(vds[i].ofs) ? vds[i].ofs : [];
      for (var j = 0; j < ofs.length; j++) {
        var o = ofs[j];
        var oid = String((o && (o.id || o.of_id || o.ofId)) || '').trim();
        if (oid === id) return o;
      }
    }
    return null;
  }

  function recalcOperadoresProporcional(ops, qtdAnt, qtdNova) {
    if (!Array.isArray(ops)) return ops;
    var a = Math.trunc(Number(qtdAnt || 0) || 0);
    var n = Math.trunc(Number(qtdNova || 0) || 0);
    if (!(a > 0) || n < 0) return ops;
    var items = ops.map(function(o, idx) {
      if (!o || typeof o !== 'object') return { idx: idx, o: o, has: false };
      var raw = (o.qtd != null) ? Number(o.qtd) : (o.quantidade != null ? Number(o.quantidade) : NaN);
      if (!Number.isFinite(raw)) return { idx: idx, o: o, has: false };
      var prop = (raw / a) * n;
      var base = Math.floor(prop);
      var rem = prop - base;
      return { idx: idx, o: o, has: true, base: base, rem: rem };
    });
    var picked = items.filter(function(x) { return x.has; });
    if (!picked.length) return ops;
    var sumBase = picked.reduce(function(s, x) { return s + x.base; }, 0);
    var remaining = n - sumBase;
    picked.sort(function(x, y) { return y.rem - x.rem; });
    for (var i = 0; i < picked.length && remaining > 0; i++) { picked[i].base += 1; remaining--; }
    if (remaining < 0) {
      picked.sort(function(x, y) { return x.rem - y.rem; });
      for (var j = 0; j < picked.length && remaining < 0; j++) {
        if (picked[j].base > 0) { picked[j].base -= 1; remaining++; }
      }
    }
    var byIdx = {};
    picked.forEach(function(x) { byIdx[x.idx] = x.base; });
    return ops.map(function(o, idx) {
      if (!Object.prototype.hasOwnProperty.call(byIdx, idx)) return o;
      var out = (o && typeof o === 'object') ? Object.assign({}, o) : {};
      if (Object.prototype.hasOwnProperty.call(out, 'qtd')) out.qtd = byIdx[idx];
      else if (Object.prototype.hasOwnProperty.call(out, 'quantidade')) out.quantidade = byIdx[idx];
      else out.qtd = byIdx[idx];
      return out;
    });
  }

  function enhanceComissoesTable() {
    try {
      if (String(window._PAGE_ATUAL || '') !== 'comissoes') return;
      var tab = document.getElementById('tabela-comissoes-ofs');
      if (!tab) return;
      var trs = tab.querySelectorAll('tbody tr');
      if (!trs || !trs.length) return;
      trs.forEach(function(tr) {
        if (!tr || tr.dataset.patchQtdProd === '1') return;
        var btn = tr.querySelector('button[onclick*="abrirModalTrocarVendedorOF"]');
        if (!btn) return;
        var oc = String(btn.getAttribute('onclick') || '');
        var m = oc.match(/abrirModalTrocarVendedorOF\('([^']*)'/);
        var ofId = m && m[1] ? String(m[1]).trim() : '';
        if (!ofId) return;
        var ofObj = findOfById(ofId) || {};
        var qtdProd = Math.trunc(Number(ofObj.qtd_produzida ?? ofObj.qtdProduzida ?? ofObj.qtd_real ?? ofObj.qtdReal ?? 0) || 0);
        var tdQtd = tr.children && tr.children[3] ? tr.children[3] : null;
        if (!tdQtd) return;
        var wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:2px;';
        var top = document.createElement('div');
        top.innerHTML = tdQtd.innerHTML;
        var bottom = document.createElement('div');
        bottom.className = 'patch-qtdprod-row';
        bottom.style.cssText = 'display:flex;align-items:center;gap:6px;justify-content:flex-end;';
        bottom.innerHTML =
          '<span style="color:#94a3b8;font-size:0.72rem">Prod:</span>' +
          '<span class="patch-qtdprod-val" data-of-id="' + ofId + '" style="font-weight:800;color:#22d3ee">' + qtdProd + '</span>' +
          '<button type="button" class="patch-qtdprod-edit" data-of-id="' + ofId + '" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;border-radius:6px;padding:2px 6px;cursor:pointer;font-size:0.78rem;line-height:1">✏️</button>';
        wrap.appendChild(top);
        wrap.appendChild(bottom);
        tdQtd.innerHTML = '';
        tdQtd.appendChild(wrap);
        tr.dataset.patchQtdProd = '1';
      });
    } catch (_) {}
  }

  async function salvarQtdProduzida(ofId, qtdNova) {
    var id = String(ofId || '').trim();
    var ofObj = findOfById(id) || null;
    if (!id || !ofObj) throw new Error('OF inválida');
    var qtdAnt = Math.trunc(Number(ofObj.qtd_produzida ?? 0) || 0);
    var caixasAnt = Math.trunc(Number(ofObj.caixas_boas ?? 0) || 0);
    var valorAntigo = Number(ofObj.valor_venda ?? ofObj.valor_total ?? ofObj.vl_total ?? ofObj.total ?? 0) || 0;
    var valorUnitario = (qtdAnt > 0) ? (valorAntigo / qtdAnt) : 0;
    var novoTotal = (valorUnitario > 0)
      ? (Math.round((valorUnitario * qtdNova) * 100) / 100)
      : valorAntigo;
    var opsRaw = ofObj.operadores_conclusao ?? null;
    var ops = null;
    if (opsRaw != null) {
      try { ops = (typeof opsRaw === 'string') ? JSON.parse(String(opsRaw || '[]')) : opsRaw; } catch (_) { ops = null; }
    }
    var opsNovo = Array.isArray(ops) ? recalcOperadoresProporcional(ops, qtdAnt, qtdNova) : null;
    var caixasNova = Math.max(0, caixasAnt + (qtdNova - qtdAnt));
    var payload = {
      qtd_produzida: qtdNova,
      caixas_boas: caixasNova,
      valor_venda: novoTotal,
      valor_total: novoTotal
    };
    if (Array.isArray(opsNovo)) payload.operadores_conclusao = opsNovo;

    var resp = null;
    if (typeof window.apiFetch === 'function') {
      resp = await window.apiFetch('/api/ofs/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(payload) });
    } else {
      var base = (window.location && window.location.protocol === 'file:') ? (window.API_BASE || '') : '';
      var token = '';
      try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) {}
      resp = await fetch(base + '/api/ofs/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload),
      });
    }
    var json = await resp.json().catch(function() { return null; });
    if (!resp.ok || (json && json.ok === false)) throw new Error(String(json?.error || 'Erro'));

    ofObj.qtd_produzida = qtdNova;
    ofObj.caixas_boas = caixasNova;
    ofObj.valor_venda = novoTotal;
    ofObj.valor_total = novoTotal;
    ofObj.total = novoTotal;
    ofObj.vl_total = novoTotal;
    if (Array.isArray(opsNovo)) ofObj.operadores_conclusao = opsNovo;
    try {
      var idx = Array.isArray(window.OFs) ? window.OFs.findIndex(function(o) { return String(o?.id || '').trim() === id; }) : -1;
      if (idx >= 0) {
        window.OFs[idx].qtd_produzida = qtdNova;
        window.OFs[idx].caixas_boas = caixasNova;
        window.OFs[idx].valor_venda = novoTotal;
        window.OFs[idx].valor_total = novoTotal;
        window.OFs[idx].total = novoTotal;
        window.OFs[idx].vl_total = novoTotal;
        if (Array.isArray(opsNovo)) window.OFs[idx].operadores_conclusao = opsNovo;
      }
    } catch (_) {}
    try {
      if (typeof window.comRecalcularLocal === 'function') window.comRecalcularLocal();
    } catch (_) {}
    return {
      qtdNova: qtdNova,
      novoTotal: novoTotal
    };
  }

  function bindInlineEdit() {
    if (window.__patchComQtdProdBind) return;
    window.__patchComQtdProdBind = true;
    document.addEventListener('click', function(ev) {
      var btn = ev && ev.target && ev.target.closest ? ev.target.closest('.patch-qtdprod-edit') : null;
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      var ofId = String(btn.dataset.ofId || '').trim();
      if (!ofId) return;
      var row = btn.parentElement;
      if (!row || row.dataset.editing === '1') return;
      var ofObj = findOfById(ofId) || {};
      var qtdAnt = Math.trunc(Number(ofObj.qtd_produzida ?? 0) || 0);
      row.dataset.editing = '1';
      var original = row.innerHTML;
      row.innerHTML = '';

      var lab = document.createElement('span');
      lab.textContent = 'Prod:';
      lab.style.cssText = 'color:#94a3b8;font-size:0.72rem';
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.min = '0';
      inp.step = '1';
      inp.value = String(qtdAnt);
      inp.style.cssText = 'width:92px;padding:4px 6px;border-radius:6px;border:1px solid rgba(255,255,255,0.14);background:rgba(15,23,42,0.6);color:#e2e8f0;font-size:0.85rem;';
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.textContent = '✅';
      ok.style.cssText = 'background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.35);color:#4ade80;border-radius:6px;padding:2px 6px;cursor:pointer;';
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = '❌';
      cancel.style.cssText = 'background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:6px;padding:2px 6px;cursor:pointer;';
      row.appendChild(lab);
      row.appendChild(inp);
      row.appendChild(ok);
      row.appendChild(cancel);
      setTimeout(function() { try { inp.focus(); inp.select(); } catch (_) {} }, 0);

      function restore() { row.innerHTML = original; row.dataset.editing = '0'; }
      cancel.onclick = function(e) { if (e) { e.preventDefault(); e.stopPropagation(); } restore(); };
      ok.onclick = async function(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var qtdNova = Math.trunc(Number(inp.value || 0) || 0);
        if (qtdNova < 0) { try { window.toast('Quantidade inválida', 'var(--orange)'); } catch (_) {} return; }
        try {
          var resultado = await salvarQtdProduzida(ofId, qtdNova);
          restore();
          var vEl = document.querySelector('.patch-qtdprod-val[data-of-id="' + escSel(ofId) + '"]');
          if (vEl) vEl.textContent = String(qtdNova);
          try {
            var tr = btn.closest ? btn.closest('tr') : null;
            var tdTotal = tr && tr.children && tr.children[5] ? tr.children[5] : null;
            if (tdTotal && typeof window.comFmtMoney === 'function') {
              tdTotal.textContent = window.comFmtMoney(Number(resultado?.novoTotal || 0));
            }
            var tdCom = tr && tr.children && tr.children[7] ? tr.children[7] : null;
            var ofAtual = findOfById(ofId) || null;
            if (tdCom && ofAtual && typeof window.comFmtMoney === 'function') {
              tdCom.textContent = window.comFmtMoney(Number(ofAtual.comissaoValor || 0));
            }
          } catch (_) {}
          try {
            if (typeof window.renderComissoes === 'function') window.renderComissoes();
          } catch (_) {}
          try { window.toast('✓ Quantidade produzida atualizada', 'var(--green)'); } catch (_) {}
        } catch (err) {
          try { window.toast('Erro ao salvar qtd produzida', 'var(--red)'); } catch (_) {}
          restore();
        }
      };
    }, true);
  }

  function hookRenderComissoes() {
    if (window.__patchComHooked) return;
    if (typeof window.renderComissoes !== 'function') return;
    window.__patchComHooked = true;
    var orig = window.renderComissoes;
    window.renderComissoes = async function() {
      var r = await orig.apply(this, arguments);
      setTimeout(enhanceComissoesTable, 0);
      try {
        var term = String(window.__comissoesBuscaTerm || '').trim();
        if (term && typeof window.filtrarComissoesPorBusca === 'function') window.filtrarComissoesPorBusca(term);
      } catch (_) {}
      return r;
    };
  }

  function tick() {
    try { hookRenderComissoes(); } catch (_) {}
    try { enhanceComissoesTable(); } catch (_) {}
    try { if (typeof window.__ensureComissoesBusca === 'function') window.__ensureComissoesBusca(); } catch (_) {}
  }

  function stopTickWhenReady() {
    try {
      var buscaOk = !!document.getElementById('comissoes-busca-of');
      var hookOk = !!window.__patchComHooked;
      if (buscaOk && hookOk && window.__patchComissoesTickInterval) {
        clearInterval(window.__patchComissoesTickInterval);
        window.__patchComissoesTickInterval = null;
      }
    } catch (_) {}
  }

  function startTick() {
    try { tick(); } catch (_) {}
    stopTickWhenReady();
    if (window.__patchComissoesTickInterval) return;
    window.__patchComissoesTickInterval = setInterval(function() {
      try { tick(); } catch (_) {}
      stopTickWhenReady();
    }, 900);
  }

  bindInlineEdit();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startTick, 250); });
  else { setTimeout(startTick, 250); }
})();

(function patchPainelClienteApi() {
  function escHLocal(s) {
    try { return window.escH ? window.escH(s) : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); } catch (_) { return String(s == null ? '' : s); }
  }
  function escAttrLocal(s) {
    var v = String(s == null ? '' : s);
    return escHLocal(v).replace(/`/g, '&#96;');
  }
  function fmtMoneyLocal(v) {
    var n = Number(v || 0) || 0;
    try { if (typeof window.fmtR === 'function') return window.fmtR(n); } catch (_) {}
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtDataLocal(s) {
    var d = String(s || '').slice(0, 10);
    try { if (typeof window.fmtD === 'function') return window.fmtD(d); } catch (_) {}
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      var parts = d.split('-');
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return d || '—';
  }
  function getAuthHeader() {
    var token = '';
    try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }
  async function apiGet(url) {
    if (typeof window.apiFetch === 'function') return await window.apiFetch(url, { method: 'GET' });
    return await fetch(url, { method: 'GET', headers: getAuthHeader() });
  }
  function setTxt(id, txt) {
    try { var el = document.getElementById(id); if (el) el.textContent = String(txt); } catch (_) {}
  }
  function renderPainel(json) {
    var totalPedidos = Number(json && json.total_pedidos || 0) || 0;
    var totalFaturado = Number(json && json.total_faturado || 0) || 0;
    var ofsAbertas = Number(json && json.ofs_abertas || 0) || 0;
    setTxt('pcTotalPedidos', totalPedidos);
    setTxt('pcTotalFaturado', fmtMoneyLocal(totalFaturado));
    setTxt('pcOfsAbertas', ofsAbertas);

    var listEl = document.getElementById('pcOfsAbertasList');
    var abertas = (json && Array.isArray(json.ofs_em_aberto)) ? json.ofs_em_aberto : [];
    if (listEl) {
      if (!abertas.length) {
        listEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Nenhuma OF em aberto.</div>';
      } else {
        listEl.innerHTML = abertas.map(function(o) {
          var num = String(o && o.numero || '—').trim() || '—';
          var prod = String(o && o.produto || '').trim();
          var qtd = (o && o.quantidade != null) ? (Number(o.quantidade) || 0) : 0;
          var ent = String(o && o.data_entrega || '').slice(0, 10);
          var stt = String(o && o.status || '—').trim() || '—';
          var maq = String(o && o.maquina || '').trim();
          return (
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px">' +
              '<div style="min-width:0">' +
                '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                  '<span style="font-weight:900;color:#4A90D9">OF #' + escHLocal(num) + '</span>' +
                  '<span style="color:#94a3b8;font-size:0.78rem">' + escHLocal(stt) + '</span>' +
                  (ent ? '<span style="color:#64748b;font-size:0.78rem">📅 ' + escHLocal(fmtDataLocal(ent)) + '</span>' : '') +
                  (qtd ? '<span style="color:#64748b;font-size:0.78rem">📦 ' + escHLocal(String(qtd)) + ' cx</span>' : '') +
                  (maq ? '<span style="color:#64748b;font-size:0.78rem">🧰 ' + escHLocal(maq) + '</span>' : '') +
                '</div>' +
                (prod ? '<div style="color:#e2e8f0;font-size:0.86rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHLocal(prod) + '</div>' : '') +
              '</div>' +
              '<button class="btn btn-ghost btn-sm" data-pc-of="' + escAttrLocal(num) + '" style="white-space:nowrap">Abrir</button>' +
            '</div>'
          );
        }).join('');
        try {
          Array.prototype.slice.call(listEl.querySelectorAll('button[data-pc-of]')).forEach(function(btn) {
            if (!btn || btn.dataset.bound === '1') return;
            btn.dataset.bound = '1';
            btn.onclick = function(ev) {
              try { if (ev) { ev.preventDefault(); ev.stopPropagation(); } } catch (_) {}
              var n = String(btn.getAttribute('data-pc-of') || '').trim();
              try { if (typeof window.editarOFDoHistorico === 'function') window.editarOFDoHistorico(n); } catch (_) {}
            };
          });
        } catch (_) {}
      }
    }

    var topEl = document.getElementById('pcTopProdutos');
    var prods = (json && Array.isArray(json.produtos_mais_pedidos)) ? json.produtos_mais_pedidos : [];
    if (topEl) {
      if (!prods.length) {
        topEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Sem dados suficientes.</div>';
      } else {
        topEl.innerHTML = prods.map(function(p, i) {
          var nome = String(p && p.produto || 'Sem produto').trim() || 'Sem produto';
          var vezes = Number(p && p.vezes || 0) || 0;
          return (
            '<div style="display:flex;justify-content:space-between;gap:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px">' +
              '<div style="min-width:0;color:#e2e8f0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (i + 1) + '. ' + escHLocal(nome) + '</div>' +
              '<div style="color:#94a3b8;font-family:var(--mono);font-weight:800">' + escHLocal(String(vezes)) + ' pedidos</div>' +
            '</div>'
          );
        }).join('');
      }
    }

    var histEl = document.getElementById('pcHistorico');
    var hist = (json && Array.isArray(json.historico)) ? json.historico : [];
    if (histEl) {
      if (!hist.length) {
        histEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Nenhum pedido encontrado.</div>';
      } else {
        var th = 'padding:8px 10px;border:1px solid var(--border);background:var(--s2);font-size:.65rem;font-weight:900;font-family:var(--mono);text-transform:uppercase;white-space:nowrap;';
        var td = 'padding:8px 10px;border:1px solid var(--s3);font-size:.78rem;';
        histEl.innerHTML = '<div style="overflow:auto;border:1px solid var(--border);border-radius:10px">' +
          '<table style="width:100%;border-collapse:collapse;min-width:920px">' +
            '<thead><tr>' +
              '<th style=\"' + th + '\">Data</th>' +
              '<th style=\"' + th + '\">Nº OF</th>' +
              '<th style=\"' + th + '\">Produto</th>' +
              '<th style=\"' + th + ';text-align:right\">Qtd</th>' +
              '<th style=\"' + th + '\">Status</th>' +
              '<th style=\"' + th + ';text-align:right\">Valor</th>' +
              '<th style=\"' + th + ';text-align:center\">Ação</th>' +
            '</tr></thead>' +
            '<tbody>' +
              hist.map(function(r) {
                var num = String(r && r.numero || '—').trim() || '—';
                var prod = String(r && r.produto || '—').trim() || '—';
                var dt = String(r && (r.data_entrega || r.created_at) || '').slice(0, 10);
                var qtd = (r && r.quantidade != null) ? (Number(r.quantidade) || 0) : 0;
                var stt = String(r && r.status || '—').trim() || '—';
                var valor = Number(r && r.total || 0) || 0;
                return (
                  '<tr>' +
                    '<td style=\"' + td + ';font-family:var(--mono)\">' + escHLocal(dt ? fmtDataLocal(dt) : '—') + '</td>' +
                    '<td style=\"' + td + ';font-family:var(--mono);font-weight:900;color:var(--accent)\">' + escHLocal(num) + '</td>' +
                    '<td style=\"' + td + ';max-width:360px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">' + escHLocal(prod) + '</td>' +
                    '<td style=\"' + td + ';text-align:right;font-family:var(--mono)\">' + escHLocal(String(qtd || 0)) + '</td>' +
                    '<td style=\"' + td + ';color:var(--text2)\">' + escHLocal(stt) + '</td>' +
                    '<td style=\"' + td + ';text-align:right;font-family:var(--mono);font-weight:900;color:var(--green)\">' + escHLocal(fmtMoneyLocal(valor)) + '</td>' +
                    '<td style=\"' + td + ';text-align:center\"><button class=\"btn btn-ghost btn-sm\" data-pc-of=\"' + escAttrLocal(num) + '\">Abrir</button></td>' +
                  '</tr>'
                );
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>';
        try {
          Array.prototype.slice.call(histEl.querySelectorAll('button[data-pc-of]')).forEach(function(btn2) {
            if (!btn2 || btn2.dataset.bound === '1') return;
            btn2.dataset.bound = '1';
            btn2.onclick = function(ev2) {
              try { if (ev2) { ev2.preventDefault(); ev2.stopPropagation(); } } catch (_) {}
              var n2 = String(btn2.getAttribute('data-pc-of') || '').trim();
              try { if (typeof window.editarOFDoHistorico === 'function') window.editarOFDoHistorico(n2); } catch (_) {}
            };
          });
        } catch (_) {}
      }
    }
  }
  function showLoading() {
    try {
      setTxt('pcTotalPedidos', '—');
      setTxt('pcTotalFaturado', '—');
      setTxt('pcOfsAbertas', '—');
      var listEl = document.getElementById('pcOfsAbertasList');
      if (listEl) listEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Carregando…</div>';
      var topEl = document.getElementById('pcTopProdutos');
      if (topEl) topEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Carregando…</div>';
      var histEl = document.getElementById('pcHistorico');
      if (histEl) histEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Carregando…</div>';
    } catch (_) {}
  }
  function hook() {
    if (typeof window.carregarPainelCliente !== 'function') return;
    if (window.carregarPainelCliente._patchPainelClienteApi) return;
    var orig = window.carregarPainelCliente;
    window.carregarPainelCliente = async function() {
      var st = null;
      try { st = window._PCLI || null; } catch (_) { st = null; }
      var cid = '';
      try { cid = String(st && st.cliId || '').trim(); } catch (_) { cid = ''; }
      if (!cid) return await orig.apply(this, arguments);
      try {
        if (st) st.loading = true;
        showLoading();
        var resp = await apiGet('/api/clientes/' + encodeURIComponent(cid) + '/painel?t=' + Date.now());
        var json = await resp.json().catch(function() { return null; });
        if (!resp.ok || !json || json.ok === false) throw new Error(String(json && json.error || 'Erro'));
        if (st) st.loading = false;
        renderPainel(json);
        return;
      } catch (e) {
        try { if (st) st.loading = false; } catch (_) {}
        return await orig.apply(this, arguments);
      }
    };
    window.carregarPainelCliente._patchPainelClienteApi = true;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(hook, 250); setInterval(hook, 1500); });
  } else {
    setTimeout(hook, 250);
    setInterval(hook, 1500);
  }
})();

(function patchClientesInativosApi() {
  function digitsOnly(v) { return String(v || '').replace(/\D+/g, ''); }
  function ensureInativosModalStyles() {
    try {
      if (document.getElementById('patch-style-clientes-inativos')) return;
      var styleInativos = document.createElement('style');
      styleInativos.id = 'patch-style-clientes-inativos';
      styleInativos.textContent =
        '#modalClientesInativos, #modal-clientes-inativos, .modal-clientes-inativos{' +
        'background:rgba(0,0,0,0.75) !important;' +
        '}' +
        '#modalClientesInativos .modal-box, #modalClientesInativos > div, ' +
        '#modal-clientes-inativos .modal-container, #modal-clientes-inativos > div > div, ' +
        '.modal-clientes-inativos .modal-inner{' +
        'background:#1e2433 !important;border:1px solid #2d3748 !important;' +
        '}';
      document.head.appendChild(styleInativos);
    } catch (_) {}
  }
  function applyInativosModalStyles() {
    try {
      ensureInativosModalStyles();
      var modal = document.getElementById('modalClientesInativos');
      if (modal) {
        try { modal.style.setProperty('background', 'rgba(0,0,0,0.75)', 'important'); } catch (_) {}
        var box = modal.querySelector('.modal-box') || modal.firstElementChild;
        if (box) {
          try { box.style.setProperty('background', '#1e2433', 'important'); } catch (_) {}
          try { box.style.setProperty('border', '1px solid #2d3748', 'important'); } catch (_) {}
        }
      }
    } catch (_) {}
  }
  function getAuthHeader() {
    var token = '';
    try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }
  async function apiGet(url) {
    if (typeof window.apiFetch === 'function') return await window.apiFetch(url, { method: 'GET' });
    return await fetch(url, { method: 'GET', headers: getAuthHeader() });
  }
  function waUrl(tel) {
    var d = digitsOnly(tel);
    if (!d) return '';
    if (d.startsWith('55')) return 'https://wa.me/' + d;
    return 'https://wa.me/55' + d;
  }
  function hook() {
    ensureInativosModalStyles();
    if (typeof window.carregarClientesInativos !== 'function') return;
    if (window.carregarClientesInativos._patchNovaApi) return;
    var orig = window.carregarClientesInativos;
    window.carregarClientesInativos = async function() {
      var dias = String(document.getElementById('filtroInativosDias') && document.getElementById('filtroInativosDias').value || '30');
      var tbody = document.getElementById('tabelaClientesInativos');
      var total = document.getElementById('clientesInativosTotal');
      applyInativosModalStyles();
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:20px;text-align:center;color:#64748b">Carregando...</td></tr>';
      try {
        var resp = await apiGet('/api/clientes/inativos?dias=' + encodeURIComponent(dias) + '&t=' + Date.now());
        var json = await resp.json().catch(function() { return null; });
        var list = (json && json.ok && Array.isArray(json.data)) ? json.data : [];
        try { window._clientesInativosLista = list; } catch (_) {}
        if (total) total.textContent = String(list.length) + ' clientes sem pedido há ' + dias + '+ dias';
        if (typeof window.renderClientesInativosTbody === 'function') window.renderClientesInativosTbody(list);
        applyInativosModalStyles();
        try {
          var busca = document.getElementById('buscaClienteInativo');
          if (busca && busca.value && typeof window.filtrarClientesInativos === 'function') window.filtrarClientesInativos(busca.value);
        } catch (_) {}
        return;
      } catch (e) {
        try { return await orig.apply(this, arguments); } catch (_) {}
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:20px;text-align:center;color:#ef4444">Erro ao carregar dados.</td></tr>';
      }
    };
    window.carregarClientesInativos._patchNovaApi = true;
    if (typeof window.abrirClientesInativos === 'function' && !window.abrirClientesInativos._patchBgSolid) {
      var origAbrir = window.abrirClientesInativos;
      window.abrirClientesInativos = async function() {
        var r = await origAbrir.apply(this, arguments);
        applyInativosModalStyles();
        return r;
      };
      window.abrirClientesInativos._patchBgSolid = true;
    }
    if (typeof window.renderClientesInativosTbody === 'function' && !window.renderClientesInativosTbody._patchWaBtn) {
      var origRender = window.renderClientesInativosTbody;
      window.renderClientesInativosTbody = function(lista) {
        try { origRender.apply(this, arguments); } catch (_) {}
        applyInativosModalStyles();
        try {
          var tbody2 = document.getElementById('tabelaClientesInativos');
          if (!tbody2) return;
          var trs = tbody2.querySelectorAll('tr');
          trs.forEach(function(tr) {
            if (!tr || tr.dataset.patchWa === '1') return;
            var tds = tr.children || [];
            if (!tds || tds.length < 4) return;
            var tdTel = tds[3];
            if (!tdTel) return;
            var tel = String(tdTel.textContent || '').trim();
            var url = waUrl(tel);
            if (!url) { tr.dataset.patchWa = '1'; return; }
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = '📞 WhatsApp';
            btn.style.cssText = 'margin-left:10px;padding:4px 8px;border-radius:8px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);color:#4ade80;cursor:pointer;font-size:0.72rem;font-weight:700;';
            btn.onclick = function(ev) {
              try { if (ev) { ev.preventDefault(); ev.stopPropagation(); } } catch (_) {}
              try { window.open(url, '_blank'); } catch (_) {}
            };
            tdTel.appendChild(btn);
            tr.dataset.patchWa = '1';
          });
        } catch (_) {}
      };
      window.renderClientesInativosTbody._patchWaBtn = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(hook, 300); setInterval(hook, 2000); });
  else { setTimeout(hook, 300); setInterval(hook, 2000); }
})();

(function patchAutocompleteCalcCliente() {
  function escHLocal(s) {
    try { return window.escH ? window.escH(s) : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); } catch (_) { return String(s == null ? '' : s); }
  }
  function clientesRef() {
    try { if (Array.isArray(window.CLIENTES)) return window.CLIENTES; } catch (_) {}
    try { if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) return CLIENTES; } catch (_) {}
    return [];
  }
  window.selecionarClienteOrcamento = function(id, nome) {
    var cid = String(id || '').trim();
    var nm = String(nome || '').replace(/&#39;/g, "'").trim();
    var sel = document.getElementById('calc-cli');
    var input = document.getElementById('calc-cliente-input');
    var hidden = document.getElementById('calc-cli-id');
    var dd = document.getElementById('calc-cliente-dropdown');
    try { if (hidden) hidden.value = cid; } catch (_) {}
    try { if (input) input.value = nm; } catch (_) {}
    try { if (dd) dd.style.display = 'none'; } catch (_) {}
    if (sel) {
      try {
        if (cid && sel.querySelector && !sel.querySelector('option[value="' + cid.replace(/"/g, '\\"') + '"]')) {
          var opt = document.createElement('option');
          opt.value = cid;
          opt.textContent = nm || cid;
          sel.appendChild(opt);
        }
      } catch (_) {}
      try { sel.value = cid; } catch (_) {}
      try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
    }
  };

  window.buscarClienteOrcamento = function(termo) {
    var dd = document.getElementById('calc-cliente-dropdown');
    if (!dd) return;

    var t = String(termo || '').toLowerCase().trim();
    var todos = clientesRef().slice();
    todos.sort(function(a, b) {
      var an = String(a && (a.nome || a.rs || a.razao_social || a.razao || '') || '').trim().toLowerCase();
      var bn = String(b && (b.nome || b.rs || b.razao_social || b.razao || '') || '').trim().toLowerCase();
      return an.localeCompare(bn, 'pt-BR');
    });
    var lista = t.length === 0
      ? todos.slice(0, 10)
      : todos.filter(function(c) {
        var nome = String(c && (c.nome || c.rs || c.razao_social || c.razao || '') || '').toLowerCase();
        return nome.indexOf(t) !== -1;
      }).slice(0, 15);

    if (!todos.length) {
      dd.innerHTML = '<div style="padding:12px 14px;color:#94a3b8;font-size:13px">Carregando clientes...</div>';
      dd.style.display = 'block';
      return;
    }
    if (!lista.length) {
      dd.innerHTML = '<div style="padding:12px 14px;color:#94a3b8;font-size:13px">Nenhum cliente encontrado</div>';
      dd.style.display = 'block';
      return;
    }

    dd.innerHTML = '';
    lista.forEach(function(c) {
      var id = String(c && c.id || '').trim();
      var nomeRaw = String((c && (c.nome || c.rs || c.razao_social || c.razao)) || 'Sem nome');
      var nome = nomeRaw.trim() || 'Sem nome';
      var cidade = String(c && (c.cidade || '') || '').trim();
      var cnpj = String(c && (c.cnpj || c.documento || '') || '').trim();
      var row = document.createElement('div');
      row.style.cssText = 'padding:10px 14px;cursor:pointer;border-bottom:1px solid #2d3748;transition:background 0.1s;background:#1e2433';
      row.onmouseover = function() { try { row.style.background = '#2a3347'; } catch (_) {} };
      row.onmouseout = function() { try { row.style.background = '#1e2433'; } catch (_) {} };
      row.innerHTML =
        '<div style="font-weight:500;color:#f1f5f9;font-size:13px">' + escHLocal(nome) + '</div>' +
        '<div style="font-size:11px;color:#64748b">' + escHLocal(cidade) + (cnpj ? (' · ' + escHLocal(cnpj)) : '') + '</div>';
      row.onclick = function(ev) {
        try { if (ev) { ev.preventDefault(); ev.stopPropagation(); } } catch (_) {}
        try { window.selecionarClienteOrcamento(id, nome); } catch (_) {}
      };
      dd.appendChild(row);
    });

    if (!t && todos.length > 10) {
      dd.innerHTML += '<div style="padding:8px 14px;color:#64748b;font-size:11px;text-align:center;border-top:1px solid #2d3748">Digite para filtrar entre ' + escHLocal(String(todos.length)) + ' clientes</div>';
    }

    dd.style.display = 'block';
  };

  function ensure() {
    var sel = document.getElementById('calc-cli');
    if (!sel) return;
    if (sel.dataset.patchAutocomplete === '1') return;
    sel.dataset.patchAutocomplete = '1';

    var wrap = document.createElement('div');
    wrap.id = 'wrap-calc-cliente';
    wrap.style.position = 'relative';
    wrap.style.flex = '1';
    wrap.style.zIndex = '9999';

    var input = document.createElement('input');
    input.id = 'calc-cliente-input';
    input.type = 'text';
    input.placeholder = 'Digite o nome do cliente...';
    input.autocomplete = 'off';
    input.style.cssText = 'width:100%;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text1);font-size:14px';

    var dd = document.createElement('div');
    dd.id = 'calc-cliente-dropdown';
    dd.style.cssText = 'display:block;position:absolute;top:100%;left:0;right:0;z-index:99999;background:#1e2433 !important;border:1px solid #2d3748;border-top:none;border-radius:0 0 8px 8px;max-height:240px;overflow-y:auto;box-shadow:0 12px 32px rgba(0,0,0,0.7)';
    dd.style.display = 'none';

    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = 'calc-cli-id';
    hidden.value = '';

    wrap.appendChild(input);
    wrap.appendChild(dd);
    wrap.appendChild(hidden);

    try { sel.parentNode.insertBefore(wrap, sel); } catch (_) {}
    try { sel.style.display = 'none'; } catch (_) {}

    try {
      var optSel = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
      var currentId = String(sel.value || '').trim();
      var currentTxt = optSel ? String(optSel.textContent || '').trim() : '';
      if (currentId) hidden.value = currentId;
      if (currentTxt && currentTxt !== '-- Selecione o cliente --' && currentTxt !== '— Selecione o cliente —') input.value = currentTxt;
    } catch (_) {}

    function close() { try { dd.style.display = 'none'; } catch (_) {} }
    input.oninput = null;
    input.onfocus = null;
    input.addEventListener('focus', function() { try { window.buscarClienteOrcamento(String(input.value || '')); } catch (_) {} }, true);
    input.addEventListener('input', function() { try { window.buscarClienteOrcamento(String(input.value || '')); } catch (_) {} }, true);
    document.addEventListener('click', function(ev) {
      try { if (!ev.target.closest('#wrap-calc-cliente')) close(); } catch (_) {}
    }, true);
  }
  function startEnsureCalcCliente() {
    try { ensure(); } catch (_) {}
    if (window.__patchCalcClienteInterval) return;
    window.__patchCalcClienteInterval = setInterval(function() {
      try { ensure(); } catch (_) {}
      try {
        var sel = document.getElementById('calc-cli');
        if (sel && sel.dataset.patchAutocomplete === '1' && window.__patchCalcClienteInterval) {
          clearInterval(window.__patchCalcClienteInterval);
          window.__patchCalcClienteInterval = null;
        }
      } catch (_) {}
    }, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startEnsureCalcCliente, 500); });
  else { setTimeout(startEnsureCalcCliente, 500); }
})();

(function patchBotaoCalculadoraAbrir() {
  function openModalDirect() {
    try {
      var ov = document.getElementById('modal-calc') || document.getElementById('overlay-calculadora') || document.getElementById('modal-bg-calculadora');
      if (ov) {
        ov.style.display = 'flex';
        ov.style.pointerEvents = 'auto';
        try { ov.classList.add('open', 'show', 'active'); } catch (_) {}
        try { ov.style.zIndex = '99999'; } catch (_) {}
      }
    } catch (_) {}
    try {
      var modal = document.getElementById('modal-calculadora') || document.getElementById('modal-orcamento-calc') || document.querySelector('.modal-calculadora');
      if (modal) {
        modal.style.display = 'flex';
        modal.style.pointerEvents = 'auto';
        try { modal.style.zIndex = '100000'; } catch (_) {}
      }
    } catch (_) {}
    try { document.body && (document.body.style.overflow = 'hidden'); } catch (_) {}
  }

  function abrirCalcFallback() {
    try {
      if (typeof window.abrirCalculadoraCaixas === 'function') { window.abrirCalculadoraCaixas(); return; }
    } catch (_) {}
    try {
      if (typeof window.abrirCalculadora === 'function') { window.abrirCalculadora(); return; }
    } catch (_) {}
    try {
      var modal = document.getElementById('modal-calc') || document.getElementById('modal-calculadora') || document.getElementById('modal-calc-orcamento') || document.getElementById('modal-orcamento-calc');
      if (modal) {
        modal.style.display = 'flex';
        try { modal.classList.add('open', 'show', 'active'); } catch (_) {}
        return;
      }
    } catch (_) {}
  }

  function ensureFn() {
    if (typeof window.abrirCalculadora !== 'function') {
      window.abrirCalculadora = function() {
        try { if (typeof window.abrir === 'function') window.abrir('modal-calc'); } catch (_) {}
        openModalDirect();
      };
      window.abrirCalculadora._patchCalcOpen = true;
      return;
    }
    if (window.abrirCalculadora._patchCalcOpen) return;
    var orig = window.abrirCalculadora;
    window.abrirCalculadora = function() {
      try {
        return orig.apply(this, arguments);
      } catch (_) {
        try { if (typeof window.abrir === 'function') window.abrir('modal-calc'); } catch (_) {}
        try { openModalDirect(); } catch (_) {}
        return;
      } finally {
        try {
          var ov = document.getElementById('modal-calc');
          if (ov && String(getComputedStyle(ov).display || '') === 'none') openModalDirect();
        } catch (_) {}
      }
    };
    window.abrirCalculadora._patchCalcOpen = true;
  }

  function bindBtn() {
    var btn =
      document.querySelector('#btn-calculadora, .btn-calculadora') ||
      document.querySelector('button[onclick*="abrirCalculadora"]') ||
      Array.prototype.slice.call(document.querySelectorAll('button')).find(function(b) {
        var t = String(b && b.textContent || '').toLowerCase();
        return t.indexOf('calculadora de caixas') >= 0;
      }) ||
      null;
    if (!btn || btn.dataset.patchCalcBtn === '1') return;
    btn.dataset.patchCalcBtn = '1';
    btn.onclick = function(e) {
      try { if (e) { e.preventDefault(); e.stopPropagation(); } } catch (_) {}
      ensureFn();
      abrirCalcFallback();
    };
  }

  function tick() {
    ensureFn();
    bindBtn();
  }

  function startTickCalc() {
    try { tick(); } catch (_) {}
    if (window.__patchCalcOpenInterval) return;
    window.__patchCalcOpenInterval = setInterval(function() {
      try { tick(); } catch (_) {}
      try {
        var btn =
          document.querySelector('#btn-calculadora, .btn-calculadora') ||
          document.querySelector('button[onclick*="abrirCalculadora"]');
        var btnOk = !!(btn && btn.dataset.patchCalcBtn === '1');
        var fnOk = !!(window.abrirCalculadora && window.abrirCalculadora._patchCalcOpen);
        if (btnOk && fnOk && window.__patchCalcOpenInterval) {
          clearInterval(window.__patchCalcOpenInterval);
          window.__patchCalcOpenInterval = null;
        }
      } catch (_) {}
    }, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startTickCalc, 600); });
  else { setTimeout(startTickCalc, 600); }
})();

(function patchBuscaComissoesPorOf() {
  window.__ensureComissoesBusca = function() {
    try {
      var bar = document.querySelector('#page-comissoes .filtros-comissao');
      if (!bar) return;
      if (document.getElementById('comissoes-busca-of')) return;
      var input = document.createElement('input');
      input.id = 'comissoes-busca-of';
      input.type = 'text';
      input.placeholder = '🔍 Buscar por nº OF, cliente...';
      input.style.cssText = 'padding:7px 12px;border-radius:6px;background:var(--bg2);border:1px solid var(--border);color:var(--text1);width:220px';
      input.oninput = function() { try { if (typeof window.filtrarComissoesPorBusca === 'function') window.filtrarComissoesPorBusca(input.value); } catch (_) {} };
      bar.appendChild(input);
    } catch (_) {}
  };
  window.filtrarComissoesPorBusca = function(termo) {
    var t = String(termo || '').toLowerCase().trim();
    try { window.__comissoesBuscaTerm = termo; } catch (_) {}
    var linhas = document.querySelectorAll('#tabela-comissoes-ofs tbody tr');
    linhas.forEach(function(tr) {
      var txt = String(tr && tr.textContent || '').toLowerCase();
      tr.style.display = (!t || txt.indexOf(t) !== -1) ? '' : 'none';
    });
  };
  function startEnsureBuscaComissoes() {
    try { window.__ensureComissoesBusca(); } catch (_) {}
    if (window.__ensureComissoesBuscaInterval) return;
    window.__ensureComissoesBuscaInterval = setInterval(function() {
      try { window.__ensureComissoesBusca(); } catch (_) {}
      if (document.getElementById('comissoes-busca-of') && window.__ensureComissoesBuscaInterval) {
        clearInterval(window.__ensureComissoesBuscaInterval);
        window.__ensureComissoesBuscaInterval = null;
      }
    }, 1800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startEnsureBuscaComissoes, 600); });
  else { setTimeout(startEnsureBuscaComissoes, 600); }
})();

(function patchCalcularComissoesSqlBackend() {
  if (window.__patchCalcularComissoesSqlBackendInstalled) return;
  window.__patchCalcularComissoesSqlBackendInstalled = true;

  var _comissoesMesSelectors = [
    '#com-mes', '#comissao-mes', '#mes-com',
    'select[name="mes"]', '.com-mes-sel',
    '#filtro-mes', '#mes-filtro'
  ];
  var _comissoesAnoSelectors = [
    '#com-ano', '#comissao-ano', '#ano-com',
    'select[name="ano"]', '.com-ano-sel',
    '#filtro-ano', '#ano-filtro'
  ];

  function _preencherMesAtual() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('input[type="month"]')).forEach(function(inp) {
        if (!inp || String(inp.value || '').trim()) return;
        var hoje = new Date();
        inp.value = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
      });
    } catch (_) {}
  }

  function _iniciarTelaCom() {
    try { _preencherMesAtual(); } catch (_) {}
  }

  function _patchGoTelaCom() {
    try {
      var orig = window.go;
      if (typeof orig !== 'function' || orig._patchComMesInit) return;
      var wrapped = function(tela) {
        var r = orig.apply(this, arguments);
        try {
          if (String(tela || '').toLowerCase().indexOf('comiss') >= 0) {
            setTimeout(_preencherMesAtual, 400);
          }
        } catch (_) {}
        return r;
      };
      wrapped._patchComMesInit = true;
      window.go = wrapped;
    } catch (_) {}
  }

  function _acharCampoComissao(selectors) {
    var fallback = null;
    for (var i = 0; i < selectors.length; i += 1) {
      try {
        var el = document.querySelector(selectors[i]);
        if (!el) continue;
        if (!fallback) fallback = el;
        if (String(el.value || '').trim()) return el;
      } catch (_) {}
    }
    return fallback;
  }

  function parseMesAno() {
    var mesEl = _acharCampoComissao(_comissoesMesSelectors);
    var anoEl = _acharCampoComissao(_comissoesAnoSelectors);
    var mesNum = '';
    var anoNum = '';

    try { console.log('[COM] mesEl:', mesEl && mesEl.id, mesEl && mesEl.value); } catch (_) {}
    try { console.log('[COM] anoEl:', anoEl && anoEl.id, anoEl && anoEl.value); } catch (_) {}

    if (mesEl && String(mesEl.value || '').trim()) {
      var v = String(mesEl.value || '').trim();
      if (v.indexOf('-') >= 0) {
        var parts = v.split('-');
        if (parts.length >= 2) {
          anoNum = String(parts[0] || '').trim();
          mesNum = String(parts[1] || '').trim();
        }
      } else if (!isNaN(parseInt(v, 10))) {
        mesNum = String(parseInt(v, 10)).padStart(2, '0');
        anoNum = String((anoEl && anoEl.value) || new Date().getFullYear()).trim();
      }
    }

    if (!mesNum || !anoNum) {
      try {
        var textoMes = String((document.querySelector('.com-mes-label, [data-mes]') || {}).textContent || '');
        var meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        var low = textoMes.toLowerCase();
        meses.forEach(function(nome, idx) {
          if (!mesNum && low.indexOf(nome) >= 0) mesNum = String(idx + 1).padStart(2, '0');
        });
        if (!anoNum) {
          var anoMatch = textoMes.match(/\d{4}/);
          if (anoMatch) anoNum = anoMatch[0];
        }
      } catch (_) {}
    }

    if (!mesNum || !anoNum) {
      var hoje = new Date();
      mesNum = String(hoje.getMonth() + 1).padStart(2, '0');
      anoNum = String(hoje.getFullYear());
      try { console.log('[COM] fallback para mes atual:', anoNum + '-' + mesNum); } catch (_) {}
    }

    return {
      mesEl: mesEl || null,
      anoEl: anoEl || null,
      mesNum: String(parseInt(mesNum, 10) || (new Date().getMonth() + 1)).padStart(2, '0'),
      anoNum: String(parseInt(anoNum, 10) || new Date().getFullYear())
    };
  }

  function fmt(v) {
    return 'R$ ' + (Number(v || 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtData(d) {
    try { return d ? new Date(d).toLocaleDateString('pt-BR') : '—'; } catch (_) { return '—'; }
  }

  function setTextMany(selectors, value) {
    selectors.forEach(function(sel) {
      try {
        var el = document.querySelector(sel);
        if (el) el.textContent = value;
      } catch (_) {}
    });
  }

  function _forcarRenderComissoes(json) {
    if (!json) return;

    try {
      var cardsHost = document.querySelector('#page-comissoes #com-cards, #com-cards');
      if (cardsHost && !cardsHost.querySelector('.com-total-vendido, .com-total-comissao, .com-total-ofs, .card-val')) {
        cardsHost.innerHTML = ''
          + '<div class="sbox"><div class="sbox-h">Total Vendido</div><div class="sbox-b"><div class="card-val com-total-vendido cv-g">R$ 0,00</div></div></div>'
          + '<div class="sbox"><div class="sbox-h">Total Comissão</div><div class="sbox-b"><div class="card-val com-total-comissao cv-a">R$ 0,00</div></div></div>'
          + '<div class="sbox"><div class="sbox-h">Total OFs</div><div class="sbox-b"><div class="card-val com-total-ofs">0</div></div></div>';
      }
    } catch (_) {}

    try {
      setTextMany([
        '#page-comissoes .com-total-vendido',
        '#page-comissoes [data-com="total_vendido"]',
        '#page-comissoes [data-field="total_vendido"]',
        '#page-comissoes .cv-g',
        '.com-total-vendido'
      ], fmt(json.total_vendido));
      setTextMany([
        '#page-comissoes .com-total-comissao',
        '#page-comissoes [data-com="total_comissao"]',
        '#page-comissoes [data-field="total_comissao"]',
        '#page-comissoes .cv-a',
        '.com-total-comissao'
      ], fmt(json.total_comissao));
      setTextMany([
        '#page-comissoes .com-total-ofs',
        '#page-comissoes [data-com="total_ofs"]',
        '#page-comissoes [data-field="total_ofs"]',
        '.com-total-ofs'
      ], String(json.total_ofs || 0));
    } catch (_) {}
  }

  function _renderTabelaVendedores(json) {
    if (!(json && json.vendedores && json.vendedores.length)) return;
    var pg = document.querySelector('#page-comissoes, [data-page="comissoes"]');
    if (!pg) {
      try { console.warn('[COM] #page-comissoes nao encontrado'); } catch (_) {}
      return;
    }

    var tbodies = pg.querySelectorAll('tbody');
    try {
      console.log('[COM] tbodies:', tbodies.length);
    } catch (_) {}
    var tbodyVend = tbodies[0];
    if (!tbodyVend) {
      try { console.warn('[COM] tbody vendedores nao encontrado'); } catch (_) {}
      return;
    }

    var tableVend = tbodyVend.closest ? tbodyVend.closest('table') : null;
    try {
      console.log('[COM TBODY]', tbodyVend && tbodyVend.id, tableVend && tableVend.id);
    } catch (_) {}

    try {
      var theadVend = tableVend && tableVend.querySelector('thead');
      if (theadVend) {
        theadVend.innerHTML = ''
          + '<tr>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Vendedor</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">OFs</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Total Vendido</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">% Comissão</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Comissão R$</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:center">Ação</th>'
          + '</tr>';
      }
    } catch (_) {}

    tbodyVend.innerHTML = (json.vendedores || []).map(function(v) {
      return ''
        + '<tr>'
        + '<td style="padding:10px 14px">' + String(v && v.nome || '—') + '</td>'
        + '<td style="text-align:center;padding:10px 14px">' + String(Number(v && v.ofs || 0) || 0) + '</td>'
        + '<td style="text-align:right;padding:10px 14px">' + fmt(v && v.total) + '</td>'
        + '<td style="text-align:center;padding:10px 14px">' + (Number(v && v.comissao_pct || 1) || 1).toFixed(2) + '%</td>'
        + '<td style="text-align:right;padding:10px 14px;color:#4ade80;font-weight:600">' + fmt(v && v.comissao_rs) + '</td>'
        + '<td style="padding:10px 14px;text-align:center">'
        + '<button onclick="window._editarComissaoPct && window._editarComissaoPct(' + JSON.stringify(String(v && v.id || '')) + ',' + JSON.stringify(String(v && v.nome || '')) + ',' + String(Number(v && v.comissao_pct || 0) || 0) + ')" style="padding:4px 8px;border-radius:4px;border:1px solid var(--border,#333);background:transparent;color:var(--text1,#fff);cursor:pointer;font-size:11px">✏️</button>'
        + '</td>'
        + '</tr>';
    }).join('') + ''
      + '<tr style="font-weight:700;border-top:2px solid var(--border,#333)">'
      + '<td style="padding:10px 14px">TOTAL</td>'
      + '<td style="text-align:center;padding:10px 14px">' + String(json.total_ofs || 0) + '</td>'
      + '<td style="text-align:right;padding:10px 14px">' + fmt(json.total_vendido) + '</td>'
      + '<td></td>'
      + '<td style="text-align:right;padding:10px 14px;color:#4ade80">' + fmt(json.total_comissao) + '</td>'
      + '<td></td>'
      + '</tr>';
    try { console.log('[COM] tabela vendedores OK:', (json.vendedores || []).length, 'vendedores'); } catch (_) {}
  }

  function _renderTabelaOFs(json) {
    if (!(json && json.ofs && json.ofs.length)) return;
    var pg = document.querySelector('#page-comissoes, [data-page="comissoes"]');
    if (!pg) return;
    var tbodies = pg.querySelectorAll('tbody');
    var tbodyOFs = tbodies[1] || tbodies[0];
    if (!tbodyOFs) {
      try { console.warn('[COM] tbody OFs nao encontrado'); } catch (_) {}
      return;
    }

    var tableOFs = tbodyOFs.closest ? tbodyOFs.closest('table') : null;
    try {
      var theadOFs = tableOFs && tableOFs.querySelector('thead');
      if (theadOFs) {
        theadOFs.innerHTML = ''
          + '<tr>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">N° OF</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Cliente</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Produto</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Qtd</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Vendedor</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Valor OF</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">%</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Comissão R$</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Data</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Data Conclusão</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Status</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:center">Ação</th>'
          + '</tr>';
      }
    } catch (_) {}

    var porVendedor = {};
    (json.ofs || []).forEach(function(of) {
      var v = String(of && of.vendedor || 'Sem Vendedor').trim() || 'Sem Vendedor';
      if (!porVendedor[v]) porVendedor[v] = [];
      porVendedor[v].push(of);
    });

    var html = '';
    Object.keys(porVendedor).forEach(function(vendNome) {
      var lista = porVendedor[vendNome] || [];
      var totalVend = lista.reduce(function(s, o) { return s + (Number(o && o.valor_total || 0) || 0); }, 0);
      var totalCom = lista.reduce(function(s, o) { return s + (Number(o && o.comissao_rs || 0) || 0); }, 0);
      html += ''
        + '<tr style="background:var(--accent,#6366f1);color:#fff;font-weight:700">'
        + '<td colspan="12" style="padding:8px 12px">👤 ' + String(vendNome) + ' — ' + String(lista.length) + ' OFs — ' + fmt(totalVend) + ' — Comissão: ' + fmt(totalCom) + '</td>'
        + '</tr>';
      html += lista.map(function(of) {
        return ''
          + '<tr>'
          + '<td style="padding:7px 12px">#' + String(of && of.numero || '—') + '</td>'
          + '<td style="padding:7px 12px">' + String(of && of.cliente || '—') + '</td>'
          + '<td style="padding:7px 12px">' + String((of && (of.produto || of.descricao)) || '—') + '</td>'
          + '<td style="padding:7px 12px;text-align:center">' + String((of && of.qtd) != null ? (of.qtd || 0) : '—') + '</td>'
          + '<td style="padding:7px 12px">' + String(of && of.vendedor || '—') + '</td>'
          + '<td style="padding:7px 12px;text-align:right">' + fmt(of && of.valor_total) + '</td>'
          + '<td style="padding:7px 12px;text-align:center">' + (Number(of && of.comissao_pct || 1) || 1).toFixed(2) + '%</td>'
          + '<td style="padding:7px 12px;text-align:right;color:#4ade80">' + fmt(of && of.comissao_rs) + '</td>'
          + '<td style="padding:7px 12px">' + fmtData(of && of.created_at) + '</td>'
          + '<td style="padding:7px 12px">' + fmtData(of && of.data_conclusao) + '</td>'
          + '<td style="padding:7px 12px">' + String(of && of.status || '—') + '</td>'
          + '<td style="padding:7px 12px;text-align:center">'
          + '<button style="padding:3px 8px;border-radius:4px;border:1px solid var(--border,#333);background:transparent;color:var(--text1,#fff);cursor:pointer;font-size:10px" onclick="window.abrirOf && window.abrirOf(' + JSON.stringify(String(of && of.id || '')) + ')">Traçar</button>'
          + '</td>'
          + '</tr>';
      }).join('');
    });

    tbodyOFs.innerHTML = html;
    try { console.log('[COM] detalhamento por vendedor OK:', (json.ofs || []).length, 'OFs'); } catch (_) {}
  }

  function _renderDetalheOFs(ofs) {
    _renderTabelaOFs({ ofs: ofs || [] });
  }

  async function calcularViaApi() {
    var ref = parseMesAno();
    var mesVal = String(ref.mesNum || '').padStart(2, '0');
    var anoVal = String(ref.anoNum || '');
    var token = '';
    try { token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { token = ''; }

    try { console.log('[COM] Calculando:', anoVal + '-' + mesVal); } catch (_) {}

    try {
      var allCards = document.querySelectorAll(
        '#page-comissoes [class*="com-total"], ' +
        '#page-comissoes [class*="comissao-total"], ' +
        '#page-comissoes .card-val, #page-comissoes .cv-g, #page-comissoes .cv-a'
      );
      allCards.forEach(function(card) {
        try { card.textContent = 'Calculando...'; } catch (_) {}
      });
    } catch (_) {}

    var resp = await fetch('/api/comissoes/relatorio?mes=' + encodeURIComponent(mesVal) + '&ano=' + encodeURIComponent(anoVal), {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });
    var json = await resp.json().catch(function() { return null; });

    try {
      console.log(
        '[COM] resposta API:',
        json && json.ok,
        'OFs:',
        json && json.total_ofs,
        'Total:',
        json && json.total_vendido
      );
    } catch (_) {}

    if (!json || !json.ok) {
      try { console.error('[COM] erro API:', json && json.error); } catch (_) {}
      try { alert('Erro: ' + String(json && json.error || 'Falha ao calcular')); } catch (_) {}
      return null;
    }

    window._comissoesSqlData = json;
    window._comissoesData = {
      totalGeral: Number(json.total_vendido || 0) || 0,
      totalComissao: Number(json.total_comissao || 0) || 0,
      totalPedidos: Number(json.total_ofs || 0) || 0,
      vendedores: (json.vendedores || []).map(function(v) {
        var total = Number(v && v.total || 0) || 0;
        var pct = Number(v && v.comissao_pct || 0) || 0;
        var nome = String(v && v.nome || 'Sem Vendedor');
        var vendId = String(v && v.id || '');
        var ofs = Array.isArray(json && json.ofs) ? json.ofs : [];
        var key = nome.toLowerCase().trim();
        var ofsLista = ofs.filter(function(o) {
          return String(o && o.vendedor || '').toLowerCase().trim() === key;
        });
        return {
          vendNome: nome,
          nome: nome,
          vendId: vendId,
          id: vendId,
          total: total,
          peds: Number(v && v.ofs || 0) || 0,
          quantidade: Number(v && v.ofs || 0) || 0,
          ofs: ofsLista,
          ofsList: ofsLista,
          ofs_lista: ofsLista,
          comissaoRs: Number(v && v.comissao_rs || (total * (pct / 100))) || 0,
          comissao: pct,
          comissao_pct: pct
        };
      })
    };

    try { if (typeof window.renderComissoes === 'function') window.renderComissoes(); } catch (e) { try { console.warn('[COM] renderComissoes erro:', e && e.message); } catch (_) {} }
    try { if (typeof window.renderRelatorioComissoes === 'function') window.renderRelatorioComissoes(); } catch (_) {}
    try { if (typeof window.atualizarTabelaComissoes === 'function') window.atualizarTabelaComissoes(); } catch (_) {}

    try { _forcarRenderComissoes(json); } catch (_) {}
    try { setTimeout(function() { _renderTabelaVendedores(json); _renderTabelaOFs(json); }, 700); } catch (_) {}
    try {
      setTimeout(function() {
        try { _forcarRenderComissoes(json); } catch (_) {}
      }, 400);
    } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('comissoes-calculadas', { detail: json })); } catch (_) {}
    return json;
  }

  window._editarComissaoPct = async function(vendId, vendNome, pctAtual) {
    var novo = prompt('Comissao de ' + vendNome + ' (%)\nAtual: ' + pctAtual + '%\n\nNovo valor:', pctAtual);
    if (novo === null) return;
    var pct = parseFloat(String(novo).replace(',', '.'));
    if (isNaN(pct) || pct < 0 || pct > 100) {
      alert('Valor invalido');
      return;
    }
    var token = '';
    try { token = String(localStorage.getItem('token') || '').trim(); } catch (_) {}
    var payload = JSON.stringify({ comissao_pct: pct });
    var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
    var resp = await fetch('/api/vendedores/' + encodeURIComponent(vendId), {
      method: 'PATCH',
      headers: headers,
      body: payload
    }).catch(function() { return null; });
    if (!resp || !resp.ok) {
      resp = await fetch('/api/vendedores/' + encodeURIComponent(vendId), {
        method: 'PUT',
        headers: headers,
        body: payload
      });
    }
    var json = await resp.json().catch(function() { return null; });
    if (json && json.ok) {
      alert('Comissao atualizada!');
      if (typeof window.calcularComissoes === 'function') window.calcularComissoes();
    } else {
      alert('Erro ao atualizar comissao');
    }
  };

  window.__calcularComissoesLegacy = async function() {
    try {
      return await calcularViaApi();
    } catch (e) {
      try { console.error('[COM] erro fetch:', e && e.message); } catch (_) {}
      try { alert('Erro: ' + String(e && e.message || e)); } catch (_) {}
      return null;
    }
  };

  function _vincularBtnCalcular() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('button')).forEach(function(btn) {
        try {
          if (!btn || btn.dataset.patchCom === '1') return;
          var txt = String(btn.textContent || '').trim();
          if (!(txt === 'Calcular' || txt.indexOf('Calcular') >= 0)) return;
          btn.dataset.patchCom = '1';
          btn.addEventListener('click', function(e) {
            try { e.preventDefault(); } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
            window.calcularComissoes();
          }, true);
        } catch (_) {}
      });
    } catch (_) {}
  }

  try { _patchGoTelaCom(); } catch (_) {}
  try { setTimeout(_patchGoTelaCom, 600); } catch (_) {}
  try { setTimeout(_patchGoTelaCom, 1500); } catch (_) {}
  try { setTimeout(_preencherMesAtual, 200); } catch (_) {}
  try { setTimeout(_preencherMesAtual, 800); } catch (_) {}
  try { setTimeout(_preencherMesAtual, 2000); } catch (_) {}
  try { setTimeout(_iniciarTelaCom, 500); } catch (_) {}

  async function _abrirModalImpressao() {
    var data = window._comissoesSqlData || {};
    var vends = Array.isArray(data.vendedores) ? data.vendedores : [];
    var mesEl = document.getElementById('com-mes') || document.querySelector('select[name="mes"]');
    var anoEl = document.getElementById('com-ano') || document.querySelector('select[name="ano"]');
    var mesAtual = (mesEl && mesEl.value) || '';
    var anoAtual = (anoEl && anoEl.value) || new Date().getFullYear();

    var antigo = document.getElementById('modal-impressao-com');
    if (antigo) antigo.remove();

    var overlay = document.createElement('div');
    overlay.id = 'modal-impressao-com';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center';

    var vendsOpts = vends
      .filter(function(v) { return String(v && v.nome || '') !== 'Sem Vendedor'; })
      .map(function(v) {
        return '<label style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;cursor:pointer;background:var(--bg3,#0d0d1a);margin-bottom:6px">'
          + '<input type="checkbox" value="' + String(v && v.id || '') + '" checked style="width:16px;height:16px">'
          + '<span style="color:var(--text1,#fff)">' + String(v && v.nome || '—') + '</span>'
          + '<span style="color:#4ade80;margin-left:auto">' + fmt(v && v.total) + '</span>'
          + '</label>';
      }).join('');

    overlay.innerHTML = ''
      + '<div style="background:var(--bg2,#1a1a2e);border-radius:12px;padding:28px;width:480px;max-width:95vw;max-height:90vh;overflow-y:auto">'
      + '<h3 style="color:var(--text1,#fff);margin-bottom:20px;font-size:16px">🖨️ Imprimir Relatório de Comissões</h3>'
      + '<div style="margin-bottom:16px">'
      + '<label style="color:var(--text2,#aaa);font-size:11px;text-transform:uppercase;display:block;margin-bottom:6px">Mês de Referência</label>'
      + '<div style="color:var(--text1,#fff);font-size:14px;padding:10px;background:var(--bg3,#0d0d1a);border-radius:6px" id="imp-mes-label">' + String(mesAtual || (anoAtual + '-??')) + '</div>'
      + '</div>'
      + '<div style="margin-bottom:20px">'
      + '<label style="color:var(--text2,#aaa);font-size:11px;text-transform:uppercase;display:block;margin-bottom:8px">Selecionar Vendedores</label>'
      + '<label style="display:flex;align-items:center;gap:8px;padding:8px;cursor:pointer;margin-bottom:8px">'
      + '<input type="checkbox" id="imp-todos" checked style="width:16px;height:16px">'
      + '<span style="color:var(--text1,#fff);font-weight:600">Todos os vendedores</span>'
      + '</label>'
      + '<div id="imp-vends-list">' + vendsOpts + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:10px;justify-content:flex-end">'
      + '<button type="button" data-imp-close="1" style="padding:10px 20px;border-radius:6px;border:1px solid var(--border,#333);background:transparent;color:var(--text1,#fff);cursor:pointer">Cancelar</button>'
      + '<button type="button" id="btn-gerar-impressao-com" style="padding:10px 24px;border-radius:6px;border:none;background:#6366f1;color:#fff;cursor:pointer;font-weight:600">🖨️ Gerar e Imprimir</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    try {
      try { console.log('[IMPRIMIR] modal aberto, _comissoesSqlData:', !!window._comissoesSqlData, window._comissoesSqlData && window._comissoesSqlData.total_ofs); } catch (_) {}
      overlay.querySelector('[data-imp-close="1"]').onclick = function() { overlay.remove(); };
      Array.prototype.slice.call(overlay.querySelectorAll('button')).forEach(function(btn) {
        try {
          var t = String(btn.textContent || '');
          if (t.indexOf('Gerar') < 0 && t.indexOf('Imprimir') < 0) return;
          try { btn.removeAttribute('onclick'); } catch (_) {}
          if (btn.dataset && btn.dataset.patchImpBtn === '1') return;
          btn.dataset.patchImpBtn = '1';
          btn.addEventListener('click', function(e) {
            try { e.preventDefault(); } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
            try { console.log('[IMPRIMIR] botão clicado'); } catch (_) {}
            try { window._gerarImpressaoComissoes(); } catch (err) { try { console.error('[IMPRIMIR] erro:', err && err.message); } catch (_) {} }
          }, true);
        } catch (_) {}
      });
      document.getElementById('imp-todos').addEventListener('change', function() {
        Array.prototype.slice.call(document.querySelectorAll('#imp-vends-list input[type=checkbox]')).forEach(function(cb) {
          cb.checked = !!document.getElementById('imp-todos').checked;
        });
      });
    } catch (_) {}
  }

  window._gerarImpressaoComissoes = function() {
    var data = window._comissoesSqlData;
    try { console.log('[IMPRIMIR] data existe:', !!data, 'total_ofs:', data && data.total_ofs, 'ofs length:', data && data.ofs && data.ofs.length); } catch (_) {}

    if (!data || !data.total_ofs) {
      try { alert('Calcule o relatório primeiro'); } catch (_) {}
      return;
    }

    var checked = [];
    try { checked = Array.prototype.slice.call(document.querySelectorAll('#imp-vends-list input:checked')) || []; } catch (_) { checked = []; }
    var selecionados = new Set(checked.map(function(cb) { return cb && cb.value; }));
    var impTodos = document.getElementById('imp-todos');
    var todosSel = (impTodos ? impTodos.checked : true) !== false;

    var fmtLocal = function(v) {
      return 'R$\u00a0' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    var fmtD = function(d) {
      if (!d) return '—';
      try { return new Date(d).toLocaleDateString('pt-BR'); } catch (_) { return '—'; }
    };

    var vends = (data.vendedores || []).filter(function(v) {
      return todosSel || selecionados.has(String(v && v.id || ''));
    });

    var ofs = (data.ofs || []).filter(function(of) {
      return todosSel || vends.some(function(v) { return String(v && v.nome || '') === String(of && of.vendedor || ''); });
    });

    var parts = String(data.mes || '').split('-');
    var ano = parts[0] || '';
    var mes = parts[1] || '';
    var meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    var nomeMes = meses[Math.max(0, (parseInt(mes, 10) || 1) - 1)] || mes;

    var agora = new Date();
    var html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comissões ' + nomeMes + '/' + ano + '</title>'
      + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:20px}h1{font-size:20px;margin-bottom:4px}h2{font-size:13px;color:#666;font-weight:normal;margin-bottom:20px}.cards{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}.card{border:1px solid #ddd;border-radius:6px;padding:12px 18px;min-width:140px}.lbl{font-size:10px;color:#888;text-transform:uppercase;margin-bottom:3px}.val{font-size:16px;font-weight:700}.green{color:#16a34a}table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:11px}th{background:#f0f0f0;padding:7px 8px;text-align:left;border-bottom:2px solid #ccc;font-size:10px;text-transform:uppercase}td{padding:6px 8px;border-bottom:1px solid #eee}.vh{background:#1a1a2e;color:#fff;padding:8px 12px;border-radius:4px;margin:16px 0 8px;font-weight:700;font-size:12px}.tf{font-weight:700;background:#f5f5f5}@media print{body{padding:0}}</style>'
      + '</head><body>'
      + '<h1>Relatório de Comissões — ' + nomeMes + '/' + ano + '</h1>'
      + '<h2>Italy Embalagens · Gerado em ' + agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR') + '</h2>'
      + '<div class="cards">'
      + '<div class="card"><div class="lbl">Total Vendido</div><div class="val">' + fmtLocal(data.total_vendido) + '</div></div>'
      + '<div class="card"><div class="lbl">Total Comissão</div><div class="val green">' + fmtLocal(data.total_comissao) + '</div></div>'
      + '<div class="card"><div class="lbl">Total OFs</div><div class="val">' + String(data.total_ofs || 0) + '</div></div>'
      + '</div>'
      + '<h3 style="margin-bottom:8px;font-size:13px">Resumo por Vendedor</h3>'
      + '<table><thead><tr><th>Vendedor</th><th>OFs</th><th style="text-align:right">Total Vendido</th><th style="text-align:center">%</th><th style="text-align:right">Comissão R$</th></tr></thead><tbody>'
      + vends.map(function(v) {
        return '<tr><td>' + String(v && v.nome || '—') + '</td><td>' + String(v && v.ofs || 0) + '</td><td style="text-align:right">' + fmtLocal(v && v.total) + '</td><td style="text-align:center">' + (Number(v && v.comissao_pct || 1) || 1).toFixed(2) + '%</td><td style="text-align:right" class="green">' + fmtLocal(v && v.comissao_rs) + '</td></tr>';
      }).join('')
      + '<tr class="tf"><td>TOTAL</td><td>' + String(vends.reduce(function(s, v) { return s + (Number(v && v.ofs || 0) || 0); }, 0)) + '</td><td style="text-align:right">' + fmtLocal(vends.reduce(function(s, v) { return s + (Number(v && v.total || 0) || 0); }, 0)) + '</td><td></td><td style="text-align:right" class="green">' + fmtLocal(vends.reduce(function(s, v) { return s + (Number(v && v.comissao_rs || 0) || 0); }, 0)) + '</td></tr>'
      + '</tbody></table>'
      + vends.map(function(v) {
        var vOfs = ofs.filter(function(o) { return String(o && o.vendedor || '') === String(v && v.nome || ''); });
        if (!vOfs.length) return '';
        return '<div class="vh">📋 ' + String(v && v.nome || '—') + ' — ' + String(vOfs.length) + ' OFs — ' + fmtLocal(v && v.total) + '</div>'
          + '<table><thead><tr><th>Nº OF</th><th>Cliente</th><th style="text-align:right">Valor</th><th style="text-align:center">%</th><th style="text-align:right">Comissão</th><th>Data Conclusão</th><th>Status</th></tr></thead><tbody>'
          + vOfs.map(function(o) {
            return '<tr><td>#' + String(o && o.numero || '—') + '</td><td>' + String(o && o.cliente || '—') + '</td><td style="text-align:right">' + fmtLocal(o && o.valor_total) + '</td><td style="text-align:center">' + (Number(o && o.comissao_pct || 1) || 1).toFixed(2) + '%</td><td style="text-align:right" class="green">' + fmtLocal(o && o.comissao_rs) + '</td><td>' + fmtD((o && (o.data_conclusao || o.created_at)) || null) + '</td><td>' + String(o && o.status || '—') + '</td></tr>';
          }).join('')
          + '<tr class="tf"><td colspan="2">Total ' + String(v && v.nome || '—') + '</td><td style="text-align:right">' + fmtLocal(v && v.total) + '</td><td></td><td style="text-align:right" class="green">' + fmtLocal(v && v.comissao_rs) + '</td><td colspan="2"></td></tr>'
          + '</tbody></table>';
      }).join('')
      + '</body></html>';

    try { var m = document.getElementById('modal-impressao-com'); if (m) m.remove(); } catch (_) {}
    var win = null;
    try { win = window.open('', '_blank', 'width=900,height=700'); } catch (_) { win = null; }
    if (!win) {
      try { alert('Popup bloqueado! Permita popups para este site e tente novamente.'); } catch (_) {}
      return;
    }
    try {
      win.document.write(html);
      win.document.close();
    } catch (e) {
      try { alert('Erro ao abrir impressão: ' + String(e && e.message || e)); } catch (_) {}
      return;
    }
    setTimeout(function() { try { win.print(); } catch (_) {} }, 1000);
  };

  window._abrirModalImpressaoComissoes = _abrirModalImpressao;
  window.gerarEImprimirComissoes = function() { _abrirModalImpressao(); };
  window.injetarBotaoImprimirComissoes = function() {};

  function _vincularBtnImprimir() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('button')).forEach(function(btn) {
        try {
          var txt = String(btn.textContent || '').trim();
          if ((txt.indexOf('Imprimir') >= 0 || txt.indexOf('imprimir') >= 0) && !btn.dataset.patchPrint) {
            btn.dataset.patchPrint = '1';
            btn.addEventListener('click', function(e) {
              try { e.preventDefault(); } catch (_) {}
              try { e.stopPropagation(); } catch (_) {}
              _abrirModalImpressao();
            }, true);
          }
        } catch (_) {}
      });
    } catch (_) {}
  }

  try { _vincularBtnCalcular(); } catch (_) {}
  try { _vincularBtnImprimir(); } catch (_) {}
})();

(function patchClientesEditarEPainel() {
  if (window.__patchClientesEditarEPainelInstalled) return;
  window.__patchClientesEditarEPainelInstalled = true;

  function _vincularBtnEditarCliente() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('[onclick*="editarCliente"], .btn-editar-cliente')).forEach(function(btn) {
        try {
          if (!btn || btn.dataset.patchEdit) return;
          btn.dataset.patchEdit = '1';
          var onclick = String(btn.getAttribute('onclick') || '');
          var m = onclick.match(/editarCliente\(['"]([^'"]+)['"]\)/);
          var id = (m && m[1]) ? m[1] : (btn.dataset && (btn.dataset.id || btn.dataset.clienteId || btn.dataset.cliente_id));
          if (!id) return;
          btn.addEventListener('click', function(e) {
            try { e.preventDefault(); } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
            try {
              if (typeof window.editarCliente === 'function') return window.editarCliente(id);
            } catch (_) {}
            try {
              if (typeof window._abrirModalEditarCliente === 'function') return window._abrirModalEditarCliente(id);
            } catch (_) {}
          }, true);
        } catch (_) {}
      });
    } catch (_) {}
  }

  window._abrirModalEditarCliente = async function(id) {
    var token = '';
    try { token = String(localStorage.getItem('token') || '').trim(); } catch (_) {}
    var resp = await fetch('/api/clientes/' + encodeURIComponent(id), {
      headers: { 'Authorization': 'Bearer ' + token }
    }).catch(function() { return null; });
    if (!resp || !resp.ok) {
      try { alert('Cliente não encontrado'); } catch (_) {}
      return;
    }
    var json = await resp.json().catch(function() { return null; });
    var c = (json && (json.data || json.ok && json.data)) ? (json.data || json.ok && json.data) : json;
    if (!(c && c.id)) {
      try { alert('Cliente não encontrado'); } catch (_) {}
      return;
    }

    try { var old = document.getElementById('patch-modal-editar-cli'); if (old) old.remove(); } catch (_) {}
    var overlay = document.createElement('div');
    overlay.id = 'patch-modal-editar-cli';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = ''
      + '<div style="background:var(--bg2,#1a1a2e);border-radius:12px;padding:28px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto">'
      + '<h3 style="color:var(--text1,#fff);margin-bottom:20px">Editar Cliente</h3>'
      + '<div style="display:grid;gap:12px">'
      + '<input id="ec-nome" value="' + String(c.nome || '') + '" placeholder="Nome *" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-cnpj" value="' + String(c.cnpj || '') + '" placeholder="CNPJ" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-cidade" value="' + String(c.cidade || '') + '" placeholder="Cidade" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-uf" value="' + String(c.uf || '') + '" placeholder="UF" maxlength="2" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-tel" value="' + String(c.tel || c.telefone || '') + '" placeholder="Telefone" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-email" value="' + String(c.email || '') + '" placeholder="Email" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '</div>'
      + '<div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">'
      + '<button type="button" data-ec-close="1" style="padding:10px 20px;border-radius:6px;border:1px solid var(--border,#333);background:transparent;color:var(--text1,#fff);cursor:pointer">Cancelar</button>'
      + '<button type="button" data-ec-save="1" style="padding:10px 20px;border-radius:6px;border:none;background:var(--accent,#6366f1);color:#fff;cursor:pointer;font-weight:600">Salvar</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    try { overlay.querySelector('[data-ec-close="1"]').onclick = function() { overlay.remove(); }; } catch (_) {}
    try { overlay.querySelector('[data-ec-save="1"]').onclick = function() { window._salvarEdicaoCliente(id); }; } catch (_) {}
  };

  window._salvarEdicaoCliente = async function(id) {
    var token = '';
    try { token = String(localStorage.getItem('token') || '').trim(); } catch (_) {}
    var body = {
      nome: String((document.getElementById('ec-nome') || {}).value || '').trim(),
      cnpj: String((document.getElementById('ec-cnpj') || {}).value || '').trim(),
      cidade: String((document.getElementById('ec-cidade') || {}).value || '').trim(),
      uf: String((document.getElementById('ec-uf') || {}).value || '').trim(),
      tel: String((document.getElementById('ec-tel') || {}).value || '').trim(),
      email: String((document.getElementById('ec-email') || {}).value || '').trim()
    };
    if (!body.nome) {
      try { alert('Nome obrigatório'); } catch (_) {}
      return;
    }
    var resp = await fetch('/api/clientes/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    var json = await resp.json().catch(function() { return null; });
    var updated = (json && json.data) ? json.data : json;
    if (resp.ok && updated) {
      try { var ov = document.getElementById('patch-modal-editar-cli'); if (ov) ov.remove(); } catch (_) {}
      try { window._clientesCarregados = false; } catch (_) {}
      try { window.CLIENTES = []; } catch (_) {}
      try { window._CLIENTES = []; } catch (_) {}
      try { if (typeof window.carregarClientes === 'function') await window.carregarClientes(true); } catch (_) {}
      try { if (typeof window.renderClientes === 'function') window.renderClientes(); } catch (_) {}
      try {
        if (typeof window._notificacaoOF === 'function') window._notificacaoOF('Cliente atualizado!', 'sucesso');
      } catch (_) {}
    } else {
      try { alert('Erro: ' + String((json && (json.error || json.message)) || 'Falha ao salvar')); } catch (_) {}
    }
  };

  (function _patchPainelClienteId() {
    if (window.__patchPainelClienteIdInstalled) return;
    window.__patchPainelClienteIdInstalled = true;
    var orig = window.abrirPainelCliente || window.verCliente || window.abrirCliente;
    var nomeFn = window.abrirPainelCliente ? 'abrirPainelCliente' : (window.verCliente ? 'verCliente' : 'abrirCliente');
    if (typeof orig !== 'function' || !nomeFn) return;
    window[nomeFn] = function(id) {
      var args = Array.prototype.slice.call(arguments, 1);
      var cid = String(id || '').trim();
      try { console.log('[HIST CLI] id:', cid, typeof id); } catch (_) {}
      if (!cid || cid === 'undefined' || cid === 'null') {
        try { console.warn('[PAINEL CLI] ID vazio!'); } catch (_) {}
        return;
      }
      try {
        if (typeof window.getCli === 'function' && !window.getCli(cid)) {
          var nome = String((args && args[0]) || '').trim();
          var alt = null;
          try { if (nome && typeof window.getCliByName === 'function') alt = window.getCliByName(nome); } catch (_) { alt = null; }
          if (!alt && nome && Array.isArray(window.CLIENTES)) {
            var low = nome.toLowerCase();
            alt = window.CLIENTES.find(function(c) { return String(c && c.nome || '').toLowerCase().trim() === low; }) || null;
          }
          if (alt && alt.id) cid = String(alt.id).trim();
        }
      } catch (_) {}
      var callArgs = [cid].concat(args);
      return orig.apply(this, callArgs);
    };
  })();

  var t = null;
  try {
    var obs = new MutationObserver(function() {
      if (t) return;
      t = setTimeout(function() {
        t = null;
        _vincularBtnEditarCliente();
      }, 100);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  try { setTimeout(_vincularBtnEditarCliente, 600); } catch (_) {}
  try { setTimeout(_vincularBtnEditarCliente, 1500); } catch (_) {}
})();

(function patchOfRapidaClienteEspecial() {
  function normClienteNome(v) {
    var s = String(v == null ? '' : v).trim();
    if (!s) return '';
    s = s
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return s;
  }

  function getClientesCount() {
    try {
      if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) return CLIENTES.length;
    } catch (_) {}
    try {
      if (Array.isArray(window.CLIENTES)) return window.CLIENTES.length;
    } catch (_) {}
    return 0;
  }

  function setClientesLista(lista) {
    var out = Array.isArray(lista) ? lista.slice() : [];
    try {
      if (typeof normalizeCli === 'function') out = out.map(function(c) { return normalizeCli(c); });
    } catch (_) {}
    try {
      if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) {
        CLIENTES.length = 0;
        out.forEach(function(c) { CLIENTES.push(c); });
      }
    } catch (_) {}
    try { window.CLIENTES = out; } catch (_) {}
    try { window._CLIENTES = out; } catch (_) {}
    try { window.clientes = out; } catch (_) {}
  }

  function clientesRef() {
    try {
      if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) return CLIENTES;
    } catch (_) {}
    return Array.isArray(window.CLIENTES) ? window.CLIENTES : (Array.isArray(window.clientes) ? window.clientes : []);
  }

  function acharClienteRobusto(nome) {
    var alvo = normClienteNome(nome);
    if (!alvo) return null;
    var lista = clientesRef();
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      var base = c && (c.nome || c.razao_social || c.razao || '');
      if (normClienteNome(base) === alvo) return c;
    }
    for (var j = 0; j < lista.length; j++) {
      var c2 = lista[j];
      var nome2 = c2 && (c2.nome || c2.razao_social || c2.razao || '');
      var hay = [nome2, c2 && c2.cnpj, c2 && c2.cidade, c2 && (c2.tel || c2.telefone)]
        .filter(Boolean)
        .map(normClienteNome)
        .join(' | ');
      var n2 = normClienteNome(nome2);
      if (hay && (hay.indexOf(alvo) !== -1 || (n2 && alvo.indexOf(n2) !== -1))) return c2;
    }
    return null;
  }

  function syncClienteOfRapida(input) {
    var el = input || document.getElementById('of-r-cliente');
    if (!el) return null;
    var cli = acharClienteRobusto(el.value);
    if (cli && cli.id) {
      el.dataset.clienteId = String(cli.id);
      el.dataset.clienteNome = String(cli.nome || cli.razao_social || cli.razao || el.value || '').trim();
      return cli;
    }
    delete el.dataset.clienteId;
    delete el.dataset.clienteNome;
    return null;
  }

  function getAuthHeader() {
    var token = '';
    try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function fetchClientePorNome(nome) {
    var q = String(nome || '').trim();
    if (!q) return Promise.resolve(null);
    var urls = [
      '/api/clientes?q=' + encodeURIComponent(q) + '&limit=5&t=' + Date.now(),
      '/api/clientes?search=' + encodeURIComponent(q) + '&limit=5&t=' + Date.now(),
      '/api/clientes?busca=' + encodeURIComponent(q) + '&limit=5&t=' + Date.now()
    ];
    var tryOne = function(i) {
      if (i >= urls.length) return Promise.resolve(null);
      return fetch(urls[i], { headers: getAuthHeader() })
        .then(function(r) { return r && r.ok ? r.json().catch(function() { return null; }) : null; })
        .then(function(j) {
          var arr = j && (j.data || j.clientes || j.items);
          if (j && j.ok && Array.isArray(arr) && arr.length) return arr[0] || null;
          return null;
        })
        .catch(function() { return null; })
        .then(function(c) { return c ? c : tryOne(i + 1); });
    };
    return tryOne(0);
  }

  async function ensureClientesCarregadosAbertura() {
    if (getClientesCount() >= 5) return getClientesCount();
    console.log('[OF] carregando CLIENTES antes de abrir...');
    try {
      if (typeof carregarClientes === 'function') {
        try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
      }
    } catch (_) {}
    if (getClientesCount() >= 5) return getClientesCount();
    var token = '';
    try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
    try {
      var r = await fetch('/api/clientes?limit=2000&order=created_at&dir=desc&t=' + Date.now(), { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var j = await r.json().catch(function() { return null; });
      if (j && j.ok && Array.isArray(j.data)) setClientesLista(j.data);
    } catch (_) {}
    console.log('[OF] CLIENTES prontos:', getClientesCount());
    return getClientesCount();
  }

  async function ensureClienteId(el) {
    if (!el) return null;
    try {
      if (el.dataset && el.dataset.clienteId) return { id: String(el.dataset.clienteId || '').trim() };
    } catch (_) {}
    var raw = String(el.value || '').trim();
    if (!raw) return null;
    var cli = syncClienteOfRapida(el);
    if (cli && cli.id) return cli;
    try {
      if (typeof carregarClientes === 'function') await carregarClientes(true);
    } catch (_) {}
    cli = syncClienteOfRapida(el);
    if (cli && cli.id) return cli;
    var remoto = await fetchClientePorNome(raw);
    var rid = String(remoto && (remoto.id || remoto.cli_id || remoto.cliente_id) || '').trim();
    if (rid) {
      try { el.dataset.clienteId = rid; } catch (_) {}
      try { el.dataset.clienteNome = String(remoto.nome || remoto.razao_social || remoto.razao || raw || '').trim(); } catch (_) {}
      try { if (el.dataset && el.dataset.clienteNome) el.value = String(el.dataset.clienteNome || '').trim(); } catch (_) {}
      return { id: rid, nome: String(remoto.nome || '').trim() };
    }
    return null;
  }

  function bindClienteInput() {
    var el = document.getElementById('of-r-cliente');
    if (!el || el.dataset.patchClienteEspecial === '1') return;
    el.dataset.patchClienteEspecial = '1';
    ['input', 'change', 'blur'].forEach(function(evt) {
      el.addEventListener(evt, function() { syncClienteOfRapida(el); }, true);
    });
    setTimeout(function() { syncClienteOfRapida(el); }, 0);
  }

  function patchAberturaPorClique() {
    if (document.documentElement.dataset.patchOfOpenClick === '1') return;
    document.documentElement.dataset.patchOfOpenClick = '1';
    document.addEventListener('click', async function(e) {
      var btn = e && e.target && e.target.closest ? e.target.closest('button, [onclick]') : null;
      if (!btn) return;
      if (btn.dataset && btn.dataset.patchOfOpening === '1') return;

      var oc = '';
      var txt = '';
      try { oc = String(btn.getAttribute('onclick') || ''); } catch (_) {}
      try { txt = String(btn.textContent || '').trim(); } catch (_) {}

      var isNovaOF = oc.indexOf('abrirModalOF') !== -1 || oc.indexOf('abrirNovaOf(') !== -1 || oc.indexOf('abrirNovaOF(') !== -1 || txt === 'Nova OF';
      var isOFRapida = oc.indexOf('abrirNovaOfRapida') !== -1 || oc.indexOf('abrirOFRapida') !== -1 || oc.indexOf('abrirOfRapida') !== -1 || txt === 'OF Rápida' || txt === 'Rápida';
      if (!isNovaOF && !isOFRapida) return;

      var openFn = null;
      if (isOFRapida) openFn = window.abrirNovaOfRapida || window.abrirOFRapida || window.abrirOfRapida || null;
      else openFn = window.abrirModalOF || window.abrirNovaOf || null;
      if (typeof openFn !== 'function') return;

      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

      try { btn.dataset.patchOfOpening = '1'; } catch (_) {}
      try {
        await ensureClientesCarregadosAbertura();
        openFn.apply(window, []);
      } catch (_) {
        try { openFn.apply(window, []); } catch (_) {}
      } finally {
        setTimeout(function() {
          try { delete btn.dataset.patchOfOpening; } catch (_) {}
        }, 1200);
      }
    }, true);
  }

  function patchSalvar(fnName) {
    var orig = window[fnName];
    if (typeof orig !== 'function' || orig._patchClienteEspecial) return;
    var wrapped = async function() {
      var el = document.getElementById('of-r-cliente');
      if (el) {
        var cli = null;
        try { cli = await ensureClienteId(el); } catch (_) { cli = syncClienteOfRapida(el); }
        var cliId = String((el.dataset && el.dataset.clienteId) ? el.dataset.clienteId : '').trim();
        if (!cliId) {
          try { alert('Selecione um cliente válido da lista.'); } catch (_) {}
          try { el.focus(); el.select && el.select(); } catch (_) {}
          return;
        }
        var nomeCanonico = String((cli && (cli.nome || cli.razao_social || cli.razao)) || el.dataset.clienteNome || el.value || '').trim();
        if (nomeCanonico) el.value = nomeCanonico;
        try {
          var hiddenCli = document.querySelector('#f-cli-id, input[name="cli_id"], input[name="cliId"]');
          if (hiddenCli) hiddenCli.value = cliId;
        } catch (_) {}
      }
      return orig.apply(this, arguments);
    };
    wrapped._patchClienteEspecial = true;
    window[fnName] = wrapped;
  }

  function tick() {
    try { bindClienteInput(); } catch (_) {}
    try { patchAberturaPorClique(); } catch (_) {}
    try { patchSalvar('salvarOfRapida'); } catch (_) {}
    try { patchSalvar('salvarNovaOfRapida'); } catch (_) {}
    try { patchSalvar('salvarOFRapida'); } catch (_) {}
    try { patchSalvar('salvarNovaOF'); } catch (_) {}
    try { patchSalvar('salvarOF'); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 150);
      setInterval(tick, 1000);
    });
  } else {
    setTimeout(tick, 150);
    setInterval(tick, 1000);
  }
})();

(function patchEditarOfPcpAbrirNaOfRapida() {
  function tokenHeaders() {
    var token = '';
    try { token = String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  async function fetchOf(id) {
    var sid = String(id || '').trim();
    if (!sid) return null;
    try {
      if (typeof window.apiFetch === 'function') {
        var r1 = await window.apiFetch('/api/ofs/' + encodeURIComponent(sid), { method: 'GET' });
        var j1 = await r1.json().catch(function() { return null; });
        if (j1 && j1.ok && j1.data) return j1.data;
        return j1 && j1.ok ? j1 : j1;
      }
    } catch (_) {}
    var r = await fetch('/api/ofs/' + encodeURIComponent(sid), { headers: tokenHeaders() });
    var j = await r.json().catch(function() { return null; });
    if (j && j.ok && j.data) return j.data;
    return j && j.ok ? j : j;
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    if (val == null) return;
    try { el.value = String(val); } catch (_) {}
  }

  function setChecked(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    try { el.checked = !!v; } catch (_) {}
  }

  function patchSalvarOfRapida() {
    if (typeof window.salvarOfRapida !== 'function') return;
    if (window.salvarOfRapida._patchEditToPatch) return;
    var orig = window.salvarOfRapida;
    window.salvarOfRapida = async function() {
      var editId = String(window._ofRapidaEditandoId || '').trim();
      if (!editId) return orig.apply(this, arguments);

      var btn = document.getElementById('btn-salvar-of-rapida');
      try { if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; } } catch (_) {}
      try {
        var clienteNome = String(document.getElementById('of-r-cliente')?.value || '').trim();
        var produto = String(document.getElementById('of-r-produto')?.value || '').trim();
        var empId = String(document.getElementById('of-r-empresa')?.value || 'E1').trim() || 'E1';
        var vendId = String(document.getElementById('of-r-vendedor')?.value || '').trim();
        var qtd = Math.trunc(Number(document.getElementById('of-r-qtd')?.value || 0) || 0);
        var vlunit = parseFloat(String(document.getElementById('of-r-vlunit')?.value || '0').replace(',', '.')) || 0;
        var totalManualEl = document.getElementById('of-r-total');
        var total = parseFloat(String(totalManualEl?.value || '0').replace(',', '.')) || (qtd * vlunit);
        var ref = String(document.getElementById('of-r-ref')?.value || '').trim();
        var comp = parseFloat(String(document.getElementById('of-r-comp')?.value || '').replace(',', '.')) || 0;
        var larg = parseFloat(String(document.getElementById('of-r-larg')?.value || '').replace(',', '.')) || 0;
        var entrega = String(document.getElementById('of-r-entrega')?.value || '').slice(0, 10);
        var urgente = !!document.getElementById('of-r-urgente')?.checked;
        var maquinaSel = String(document.getElementById('of-r-maquina')?.value || '').trim();
        var dataAgend = String(window._ofRapidaDataAgendamento || '').slice(0, 10);
        var agendamentoAuto = !!(maquinaSel && dataAgend);

        var erros = [];
        if (!clienteNome) erros.push('Cliente');
        if (!produto) erros.push('Produto');
        if (!(qtd > 0)) erros.push('Quantidade');
        if (!(vlunit > 0)) erros.push('Valor Unit.');
        if (!(larg > 0 && comp > 0)) erros.push('Dimensões (L×C)');
        if (!maquinaSel) erros.push('Máquina');
        if (!entrega) erros.push('Data de Entrega');
        if (erros.length) {
          alert('Preencha: ' + erros.join(', '));
          return;
        }

        var cli = (Array.isArray(window.CLIENTES) ? window.CLIENTES : (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES) ? CLIENTES : [])).find(function(c) {
          var n = String(c?.nome || c?.razao_social || c?.razao || '').trim();
          if (!n) return false;
          return n.toLowerCase() === clienteNome.toLowerCase();
        }) || null;
        var cliId = String(cli?.id || '').trim();
        if (!cliId) {
          alert('Selecione um cliente válido da lista.');
          return;
        }

        var coresPayload = [];
        try {
          if (typeof window.coresPayloadFromSelecionadas === 'function') coresPayload = window.coresPayloadFromSelecionadas(window.coresSelecionadasOFRapida);
        } catch (_) {}

        var payload = {
          cli_id: cliId,
          cliId: cliId,
          cliente_id: cliId,
          vendedor_id: vendId,
          vendId: vendId,
          vend_id: vendId,
          prodDesc: produto,
          descricao: produto,
          produto: produto,
          quantidade: qtd,
          qtd: qtd,
          valor_total: total,
          valor_venda: total,
          ent: entrega,
          data_entrega: entrega,
          urg: urgente,
          urgente: urgente,
          emp_id: empId,
          empId: empId,
          caixa_comprimento: comp,
          caixa_largura: larg,
          dim_comprimento: comp,
          dim_largura: larg,
          cores_impressao: coresPayload,
          itens: [{
            desc: produto,
            descricao: produto,
            ref: ref,
            qtd: qtd,
            quantidade: qtd,
            vunit: vlunit,
            valor_unitario: vlunit,
            valor_total: total,
            maquina: maquinaSel || '',
            maquinas_fluxo: [],
            maquinas_fluxo_ids: [],
          }],
          maquina_agendada: maquinaSel || undefined,
          data_agendamento: agendamentoAuto ? dataAgend : undefined,
          agendamento_auto: agendamentoAuto ? true : undefined,
          fluxo_maquinas: maquinaSel ? [maquinaSel] : [],
          maq: maquinaSel ? [maquinaSel] : undefined,
        };

        var r2 = null;
        if (typeof window.apiFetch === 'function') {
          r2 = await window.apiFetch('/api/ofs/' + encodeURIComponent(editId), { method: 'PATCH', body: payload });
        } else {
          r2 = await fetch('/api/ofs/' + encodeURIComponent(editId), { method: 'PATCH', headers: Object.assign({ 'Content-Type': 'application/json' }, tokenHeaders()), body: JSON.stringify(payload) });
        }
        var d2 = r2 ? await r2.json().catch(function() { return null; }) : null;
        if (!(r2 && r2.ok) || (d2 && d2.ok === false)) throw new Error(d2?.error || d2?.message || 'Erro ao salvar');

        window._ofRapidaEditandoId = null;
        try { if (typeof window.fecharNovaOfRapida === 'function') window.fecharNovaOfRapida(); } catch (_) {}
        try { window.toast('OF atualizada com sucesso! ✅', 'var(--green)'); } catch (_) {}
        try { if (typeof window.carregarOFs === 'function') window.carregarOFs(); } catch (_) {}
        try { if (typeof window.renderPCP === 'function') window.renderPCP(); } catch (_) {}
        try { if (typeof window.renderOFsPorMaquina === 'function') window.renderOFsPorMaquina(); } catch (_) {}
        return;
      } catch (e) {
        try { window.toast('Erro ao atualizar OF: ' + String(e?.message || e), 'var(--red)'); } catch (_) {}
        return;
      } finally {
        try { if (btn) { btn.textContent = '💾 Salvar Alterações'; btn.disabled = false; } } catch (_) {}
      }
    };
    window.salvarOfRapida._patchEditToPatch = true;
  }

  function patchAbrirModalOF() {
    if (typeof window.abrirModalOF !== 'function') return;
    if (window.abrirModalOF._patchToOfRapidaEdit) return;
    var orig = window.abrirModalOF;
    window.abrirModalOF = async function(ofId) {
      var sid = String(ofId || '').trim();
      if (!sid) return orig.apply(this, arguments);
      if (typeof window.abrirNovaOfRapida !== 'function') return orig.apply(this, arguments);

      try { window._ofRapidaEditandoId = sid; } catch (_) {}
      try { window.abrirNovaOfRapida(); } catch (_) { return orig.apply(this, arguments); }

      await new Promise(function(r) { setTimeout(r, 450); });
      var of = await fetchOf(sid);
      if (!of || of.error) return;

      var cliNome = String(of.cliente || of.cliNome || of.cliente_nome || '').trim();
      var produto = String(of.produto || of.prodDesc || of.descricao || '').trim();
      var empId = String(of.emp_id || of.empId || 'E1').trim() || 'E1';
      var vendId = String(of.vendedor_id || of.vendId || of.vend_id || '').trim();
      var qtd = of.quantidade ?? of.qtd ?? of.qtd_pedida ?? '';
      var vlunit = of.vl_unit ?? of.valor_unitario ?? of.vunit ?? '';
      var total = of.total ?? of.valor_total ?? of.valor_venda ?? '';
      var entrega = String(of.data_entrega || of.ent || '').slice(0, 10);
      var pedido = String(of.data_pedido || of.dia || of.created_at || '').slice(0, 10);
      var comp = of.caixa_comprimento ?? of.dim_comprimento ?? of.comprimento ?? '';
      var larg = of.caixa_largura ?? of.dim_largura ?? of.largura ?? '';
      var maquina = '';
      try {
        if (Array.isArray(of.maq) && of.maq.length) maquina = String(of.maq[0] || '').trim();
      } catch (_) {}
      maquina = maquina || String(of.maquina_agendada || of.maquina || of.maquina_atual || '').trim();

      try { setVal('of-r-cliente', cliNome); } catch (_) {}
      try { setVal('of-r-produto', produto); } catch (_) {}
      try { setVal('of-r-empresa', empId); } catch (_) {}
      try { setVal('of-r-vendedor', vendId); } catch (_) {}
      try { setVal('of-r-qtd', qtd); } catch (_) {}
      try { setVal('of-r-vlunit', vlunit); } catch (_) {}
      try { setVal('of-r-total', total); } catch (_) {}
      try { setVal('of-r-entrega', entrega); } catch (_) {}
      try { if (pedido) setVal('of-r-pedido', pedido); } catch (_) {}
      try { setVal('of-r-comp', comp); } catch (_) {}
      try { setVal('of-r-larg', larg); } catch (_) {}
      try { setVal('of-r-maquina', maquina); } catch (_) {}
      try { setChecked('of-r-urgente', !!(of.urgente === true || of.urg === true || of.urgente === 1 || of.urg === 1)); } catch (_) {}

      try {
        var numSpan = document.getElementById('of-r-numero');
        if (numSpan) numSpan.textContent = String(of.numero || of.of || sid.slice(0, 8));
      } catch (_) {}
      try { window._ofRapidaNumero = String(of.numero || of.of || '').trim(); } catch (_) {}

      try {
        var header = document.querySelector('#modal-of-rapida div[style*="font-weight:800"]');
        if (header) header.textContent = '✏️ Editar OF Rápida';
      } catch (_) {}
      try {
        var btn = document.getElementById('btn-salvar-of-rapida');
        if (btn) btn.textContent = '💾 Salvar Alterações';
      } catch (_) {}

      patchSalvarOfRapida();
    };
    window.abrirModalOF._patchToOfRapidaEdit = true;
  }

  function tick() {
    patchAbrirModalOF();
    patchSalvarOfRapida();
  }

  function startTickOfRapida() {
    try { tick(); } catch (_) {}
    if (window.__patchOfRapidaEditInterval) return;
    window.__patchOfRapidaEditInterval = setInterval(function() {
      try { tick(); } catch (_) {}
      try {
        var abriuOk = !!(window.abrirModalOF && window.abrirModalOF._patchToOfRapidaEdit);
        var salvarOk = !!(window.salvarOfRapida && window.salvarOfRapida._patchSalvarEdicaoOf);
        if (abriuOk && salvarOk && window.__patchOfRapidaEditInterval) {
          clearInterval(window.__patchOfRapidaEditInterval);
          window.__patchOfRapidaEditInterval = null;
        }
      } catch (_) {}
    }, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startTickOfRapida, 400); });
  else { setTimeout(startTickOfRapida, 400); }
})();

(function patchOfRapidaCoresMultiItemAndSalvarEdicao() {
  function escTxt(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getToastFn() {
    if (typeof window.mostrarToast === 'function') return window.mostrarToast;
    if (typeof window.toast === 'function') return function(msg) { return window.toast(msg, /❌|erro/i.test(String(msg || '')) ? 'var(--red)' : 'var(--green)'); };
    return function(msg) { try { alert(msg); } catch (_) {} };
  }

  function getToken() {
    try { return String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || ''); } catch (_) { return ''; }
  }

  function getColorsSource() {
    var src = Array.isArray(window.coresDisponiveis) ? window.coresDisponiveis : (Array.isArray(window.CORES_IMPRESSAO) ? window.CORES_IMPRESSAO : []);
    if (src.length) return src;
    return [
      { id: 'amarelo', nome: 'Amarelo', hex: '#FFD700' },
      { id: 'azul-claro', nome: 'Azul Claro', hex: '#87CEEB' },
      { id: 'azul-escuro', nome: 'Azul Escuro', hex: '#00008B' },
      { id: 'branco', nome: 'Branco', hex: '#FFFFFF' },
      { id: 'dourado', nome: 'Dourado', hex: '#FFD700' },
      { id: 'laranja', nome: 'Laranja', hex: '#FFA500' },
      { id: 'marrom', nome: 'Marrom', hex: '#8B4513' },
      { id: 'preto', nome: 'Preto', hex: '#000000' },
      { id: 'rosa', nome: 'Rosa', hex: '#FFC0CB' },
      { id: 'roxo', nome: 'Roxo', hex: '#800080' },
      { id: 'verde', nome: 'Verde', hex: '#008000' },
      { id: 'verde-limao', nome: 'Verde Limão', hex: '#32CD32' },
      { id: 'vermelho', nome: 'Vermelho', hex: '#FF0000' },
      { id: 'sem-impressao', nome: 'Sem Impressão', hex: '#64748b' }
    ];
  }

  function getItemColorIds(idx) {
    if (!window.coresSelecionadasOFRapidaItens || typeof window.coresSelecionadasOFRapidaItens !== 'object') window.coresSelecionadasOFRapidaItens = {};
    if (!Array.isArray(window.coresSelecionadasOFRapidaItens[idx])) window.coresSelecionadasOFRapidaItens[idx] = [];
    return window.coresSelecionadasOFRapidaItens[idx];
  }

  function getItemColorPayload(idx) {
    var ids = getItemColorIds(idx).slice();
    var cores = getColorsSource();
    return ids.map(function(id) {
      var s = String(id || '').trim();
      var cor = cores.find(function(c) { return String(c && (c.id || c.nome) || '').trim() === s; }) || null;
      if (!cor) return null;
      return { id: cor.id || cor.nome, nome: cor.nome || cor.id, hex: cor.hex || cor.cor || '#64748b' };
    }).filter(Boolean);
  }

  window.renderSeletorCoresItemOFRapida = function(index) {
    var idx = String(index == null ? '' : index).trim();
    if (!idx) return;
    var el = document.getElementById('seletorCoresItemOFRapida_' + idx);
    if (!el) return;
    var selectedIds = getItemColorIds(idx);
    var cores = getColorsSource();
    el.innerHTML = cores.map(function(cor) {
      var id = String(cor && (cor.id || cor.nome) || '').trim();
      var nome = String(cor && (cor.nome || cor.id) || '').trim();
      var hex = String(cor && (cor.hex || cor.cor) || '#64748b').trim() || '#64748b';
      var on = selectedIds.indexOf(id) >= 0;
      var styleExtra = on ? ('border-color:' + escTxt(hex) + ';color:' + escTxt(hex) + ';background:' + escTxt(hex) + '18;') : '';
      return '<button type="button" class="btn-cor ' + (on ? 'selecionado' : '') + '" style="' + styleExtra + '" onclick="toggleCorItemOFRapida(\'' + escTxt(idx) + '\',\'' + escTxt(id) + '\')" title="' + escTxt(nome) + '">' +
        '<span class="circulo-cor" style="background:' + escTxt(hex) + '"></span>' +
        '<span>' + escTxt(nome) + '</span>' +
      '</button>';
    }).join('');
    try {
      if (typeof window.atualizarBotaoCores === 'function') {
        window.atualizarBotaoCores(selectedIds, 'btnCoresLabelItemOFRapida_' + idx, 'resumoCoresItemOFRapida_' + idx);
      } else {
        var lbl = document.getElementById('btnCoresLabelItemOFRapida_' + idx);
        if (lbl) lbl.textContent = selectedIds.length ? ('🎨 ' + selectedIds.length + ' cores selecionadas') : '🎨 Selecionar Cores';
      }
    } catch (_) {}
  };

  window.toggleCorItemOFRapida = function(index, corId) {
    var idx = String(index == null ? '' : index).trim();
    var id = String(corId || '').trim();
    if (!idx || !id) return;
    var list = getItemColorIds(idx);
    var pos = list.indexOf(id);
    if (pos >= 0) list.splice(pos, 1);
    else list.push(id);
    window.renderSeletorCoresItemOFRapida(idx);
  };

  if (typeof window.toggleDropdownCores === 'function' && !window.toggleDropdownCores._patchMultiItem) {
    var _origToggleDropdownCores = window.toggleDropdownCores;
    window.toggleDropdownCores = function(dropdownId, btnId) {
      try {
        var ddId = String(dropdownId || '').trim();
        var btn = String(btnId || '').trim();
        if (ddId.indexOf('dropdownCoresItemOFRapida_') === 0) {
          Array.prototype.slice.call(document.querySelectorAll('[id^="dropdownCoresItemOFRapida_"]')).forEach(function(el) {
            if (el && el.id !== ddId) el.style.display = 'none';
          });
        }
        return _origToggleDropdownCores.apply(this, [ddId, btn]);
      } catch (_) {
        return _origToggleDropdownCores.apply(this, arguments);
      }
    };
    window.toggleDropdownCores._patchMultiItem = true;
  }

  function ensureMultiItemColors() {
    Array.prototype.slice.call(document.querySelectorAll('.ofr-item-card, [data-item-idx]')).forEach(function(card, order) {
      var idx = String(card && (card.getAttribute('data-item-idx') || card.dataset.itemIdx || order) || order).trim();
      if (!card) return;
      try { card.setAttribute('data-item-idx', idx); } catch (_) {}
      var btn = card.querySelector('#btnAbrirCoresItemOFRapida_' + idx) || card.querySelector('[id^="btnAbrirCoresItemOFRapida_"]');
      var dd = card.querySelector('#dropdownCoresItemOFRapida_' + idx) || card.querySelector('[id^="dropdownCoresItemOFRapida_"]');
      var grid = card.querySelector('#seletorCoresItemOFRapida_' + idx) || card.querySelector('[id^="seletorCoresItemOFRapida_"]');
      var resumo = card.querySelector('#resumoCoresItemOFRapida_' + idx) || card.querySelector('[id^="resumoCoresItemOFRapida_"]');
      if (btn && btn.id !== 'btnAbrirCoresItemOFRapida_' + idx) btn.id = 'btnAbrirCoresItemOFRapida_' + idx;
      if (dd && dd.id !== 'dropdownCoresItemOFRapida_' + idx) dd.id = 'dropdownCoresItemOFRapida_' + idx;
      if (grid && grid.id !== 'seletorCoresItemOFRapida_' + idx) grid.id = 'seletorCoresItemOFRapida_' + idx;
      if (resumo && resumo.id !== 'resumoCoresItemOFRapida_' + idx) resumo.id = 'resumoCoresItemOFRapida_' + idx;
      var lbl = btn ? btn.querySelector('span[id^="btnCoresLabelItemOFRapida_"]') : null;
      if (lbl && lbl.id !== 'btnCoresLabelItemOFRapida_' + idx) lbl.id = 'btnCoresLabelItemOFRapida_' + idx;
      if (btn && btn.dataset.patchColorIdx !== idx) {
        btn.dataset.patchColorIdx = idx;
        btn.onclick = function(ev) {
          try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
          window.toggleDropdownCores('dropdownCoresItemOFRapida_' + idx, 'btnAbrirCoresItemOFRapida_' + idx);
        };
      }
      try { window.renderSeletorCoresItemOFRapida(idx); } catch (_) {}
    });
  }

  if (!window.__patchColorOutsideClickBound) {
    window.__patchColorOutsideClickBound = true;
    document.addEventListener('click', function(ev) {
      var t = ev && ev.target;
      if (t && t.closest && t.closest('.cores-picker-wrapper')) return;
      Array.prototype.slice.call(document.querySelectorAll('[id^="dropdownCoresItemOFRapida_"]')).forEach(function(el) {
        if (el) el.style.display = 'none';
      });
    }, true);
  }

  window.salvarEdicaoOf = async function() {
    var id = String(window._ofRapidaEditandoId || '').trim();
    var toast = getToastFn();
    if (!id) {
      try { console.warn('[salvarEdicaoOf] sem id de edição'); } catch (_) {}
      return;
    }

    var getV = function() {
      for (var i = 0; i < arguments.length; i += 1) {
        var sel = arguments[i];
        if (!sel) continue;
        var el = null;
        try { el = document.querySelector(sel); } catch (_) { el = null; }
        if (el && el.value !== undefined && el.value !== '') return el.value;
      }
      return null;
    };

    var body = { _allow_partial: '1' };
    var maquina = getV('#of-r-maquina', '#ofr-maquina', 'select[name="maquina"]', '[data-campo="maquina"]');
    var tipo = getV('#ofr-tipo', '#of-r-tipo', 'select[name="tipo_caixa"]', 'select[name="tipo"]');
    var produto = getV('#of-r-produto', '#ofr-produto', 'input[name="produto"]', '[data-campo="produto"]');
    var quantidade = getV('#of-r-qtd', '#ofr-quantidade', 'input[name="quantidade"]');
    var comprimento = getV('#of-r-comp', '#ofr-comp', 'input[name="comprimento"]');
    var largura = getV('#of-r-larg', '#ofr-larg', 'input[name="largura"]');
    var altura = getV('#ofr-alt', '#of-r-alt', 'input[name="altura"]');
    var entrega = getV('#of-r-entrega', '#ofr-entrega', 'input[name="data_entrega"]', 'input[type="date"]');
    var vlUnit = getV('#of-r-vlunit', '#ofr-vl-unit', 'input[name="vl_unit"]', 'input[name="valor_unitario"]');
    var obs = getV('#ofr-obs', '#of-r-obs', 'textarea[name="observacoes"]', 'textarea[name="obs"]');
    var cliId = getV('#ofr-cliente-id', '#of-r-cliente-id', 'input[name="cli_id"]');
    var vendId = getV('#of-r-vendedor', '#ofr-vendedor', 'select[name="vendedor_id"]');

    if (maquina) {
      body.maquina = maquina;
      body.maquina_agendada = maquina;
      body.maq = [maquina];
      body.fluxo_maquinas = [maquina];
    }
    if (tipo) body.tipo_caixa = tipo;
    if (produto) {
      body.produto = produto;
      body.descricao = produto;
      body.prodDesc = produto;
    }
    if (quantidade != null && quantidade !== '') {
      body.quantidade = Number(quantidade);
      body.qtd = Number(quantidade);
    }
    if (comprimento != null && comprimento !== '') {
      body.comprimento = Number(comprimento);
      body.caixa_comprimento = Number(comprimento);
      body.dim_comprimento = Number(comprimento);
    }
    if (largura != null && largura !== '') {
      body.largura = Number(largura);
      body.caixa_largura = Number(largura);
      body.dim_largura = Number(largura);
    }
    if (altura != null && altura !== '') {
      body.altura = Number(altura);
      body.caixa_altura = Number(altura);
      body.dim_altura = Number(altura);
    }
    if (entrega) {
      body.data_entrega = entrega;
      body.ent = entrega;
    }
    if (vlUnit != null && vlUnit !== '') {
      body.vl_unit = Number(vlUnit);
      body.valor_unitario = Number(vlUnit);
    }
    if (obs) {
      body.observacoes = obs;
      body.obs = obs;
    }
    if (cliId) {
      body.cli_id = cliId;
      body.cliente_id = cliId;
      body.cliId = cliId;
    }
    if (vendId) {
      body.vendedor_id = vendId;
      body.vendId = vendId;
      body.vend_id = vendId;
    }
    if ((body.vl_unit || body.valor_unitario) && (body.quantidade || body.qtd)) {
      var qty = Number(body.quantidade || body.qtd || 0) || 0;
      var unit = Number(body.vl_unit || body.valor_unitario || 0) || 0;
      if (qty > 0 && unit > 0) {
        body.valor_total = qty * unit;
        body.valor_venda = qty * unit;
      }
    }
    try {
      if (Array.isArray(window.coresSelecionadasOFRapida) && window.coresSelecionadasOFRapida.length && typeof window.coresPayloadFromSelecionadas === 'function') {
        body.cores_impressao = window.coresPayloadFromSelecionadas(window.coresSelecionadasOFRapida);
      }
    } catch (_) {}

    if (Object.keys(body).length === 1) {
      toast('⚠️ Nenhum campo preenchido para salvar');
      return;
    }

    try { console.log('[salvarEdicaoOf] enviando PATCH para OF', id, body); } catch (_) {}
    var btn = document.getElementById('btn-salvar-of-rapida');
    try { if (btn) { btn.disabled = true; btn.textContent = '⏳ Salvando...'; } } catch (_) {}
    try {
      var resp = await fetch('/api/ofs/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: Object.assign({ 'Content-Type': 'application/json' }, getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
        body: JSON.stringify(body)
      });
      var result = await resp.json().catch(function() { return {}; });
      try { console.log('[salvarEdicaoOf] resposta:', resp.status, result); } catch (_) {}
      if (!resp.ok || (result && result.ok === false)) {
        toast('❌ Erro ao salvar: ' + String(result && result.error || resp.status));
        return;
      }
      toast('✅ OF #' + String(window._ofRapidaEditandoNumero || id.substring(0, 8)) + ' salva!');
      window._ofRapidaEditandoId = null;
      window._ofRapidaEditandoNumero = null;
      try { document.getElementById('btn-salvar-edicao-of') && document.getElementById('btn-salvar-edicao-of').remove(); } catch (_) {}
      try {
        var btnOrig = document.querySelector('#modal-of-rapida button[type="submit"], .btn-salvar-of');
        if (btnOrig) btnOrig.style.display = '';
      } catch (_) {}
      var btnFechar = null;
      try {
        btnFechar = document.querySelector('#modal-of-rapida .modal-close, [onclick*="fecharModalOfRapida"], [onclick*="fecharNovaOf"], [onclick*="fecharOFRapida"]');
      } catch (_) {}
      if (btnFechar) {
        try { btnFechar.click(); } catch (_) {}
      } else {
        try {
          var modal = document.getElementById('modal-of-rapida') || document.getElementById('modal-nova-of-rapida') || document.getElementById('modal-of-rapida-ov');
          if (modal) modal.style.display = 'none';
        } catch (_) {}
      }
      setTimeout(function() {
        try { if (window.carregarOFs) window.carregarOFs(true); else if (window.renderPCP) window.renderPCP(); } catch (_) {}
      }, 300);
    } catch (e) {
      try { console.error('[salvarEdicaoOf]', e); } catch (_) {}
      toast('❌ Erro de rede: ' + String(e && e.message || e));
    } finally {
      try { if (btn) { btn.disabled = false; btn.textContent = '💾 Salvar Alterações'; } } catch (_) {}
    }
  };

  function wrapSalvarOfRapidaEdicao() {
    if (typeof window.salvarOfRapida !== 'function') return;
    if (window.salvarOfRapida._patchSalvarEdicaoOf) return;
    var orig = window.salvarOfRapida;
    window.salvarOfRapida = async function() {
      if (String(window._ofRapidaEditandoId || '').trim()) return window.salvarEdicaoOf();
      return orig.apply(this, arguments);
    };
    window.salvarOfRapida._patchSalvarEdicaoOf = true;
  }

  function patchAbrirModalNumero() {
    if (typeof window.abrirModalOF !== 'function') return;
    if (window.abrirModalOF._patchNumeroEdicao) return;
    var orig = window.abrirModalOF;
    window.abrirModalOF = async function(ofId) {
      var r = await orig.apply(this, arguments);
      try {
        var span = document.getElementById('of-r-numero');
        if (span) window._ofRapidaEditandoNumero = String(span.textContent || '').trim() || null;
      } catch (_) {}
      return r;
    };
    window.abrirModalOF._patchNumeroEdicao = true;
  }

  function tick() {
    ensureMultiItemColors();
    wrapSalvarOfRapidaEdicao();
    patchAbrirModalNumero();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tick, 300); setInterval(tick, 1200); });
  } else {
    setTimeout(tick, 300);
    setInterval(tick, 1200);
  }
})();

(function patchClienteValidoNovaOf() {
  function normClienteNome(v) {
    var s = String(v == null ? '' : v).trim();
    if (!s) return '';
    s = s
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return s;
  }

  function clientesRef() {
    return Array.isArray(window.CLIENTES) ? window.CLIENTES : (Array.isArray(window.clientes) ? window.clientes : []);
  }

  function acharClienteRobusto(nome) {
    var alvo = normClienteNome(nome);
    if (!alvo) return null;
    var lista = clientesRef();
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      var base = c && (c.nome || c.rs || c.razao_social || c.razao || '');
      if (normClienteNome(base) === alvo) return c;
    }
    for (var j = 0; j < lista.length; j++) {
      var c2 = lista[j];
      var hay = [c2 && c2.nome, c2 && c2.rs, c2 && c2.razao_social, c2 && c2.cidade, c2 && c2.tel, c2 && c2.telefone, c2 && c2.cnpj]
        .filter(Boolean)
        .map(normClienteNome)
        .join(' | ');
      if (hay && hay.indexOf(alvo) !== -1) return c2;
    }
    return null;
  }

  function syncClienteNovaOf(input) {
    var el = input || document.getElementById('f-cli-search');
    if (!el) return null;
    var cli = acharClienteRobusto(el.value);
    if (cli && cli.id) {
      el.dataset.clienteId = String(cli.id);
      el.dataset.clienteNome = String(cli.nome || cli.rs || cli.razao_social || cli.razao || el.value || '').trim();
      try {
        var sel = document.getElementById('f-cli');
        if (sel) sel.value = String(cli.id);
      } catch (_) {}
      try {
        var hid = document.getElementById('f-cli-id');
        if (hid) hid.value = String(cli.id);
      } catch (_) {}
      try { if (typeof window.ofCliChange === 'function') window.ofCliChange(); } catch (_) {}
      return cli;
    }
    delete el.dataset.clienteId;
    delete el.dataset.clienteNome;
    return null;
  }

  function bindClienteNovaOf() {
    var el = document.getElementById('f-cli-search');
    if (!el || el.dataset.patchClienteValidoNovaOf === '1') return;
    el.dataset.patchClienteValidoNovaOf = '1';
    ['input', 'change', 'blur'].forEach(function(evt) {
      el.addEventListener(evt, function() { syncClienteNovaOf(el); }, true);
    });
    setTimeout(function() { syncClienteNovaOf(el); }, 0);
  }

  function patchResolveCliId() {
    var orig = window.ofResolveCliIdFromModal;
    if (typeof orig !== 'function' || orig._patchClienteValidoNovaOf) return;
    var wrapped = function() {
      try {
        var el = document.getElementById('f-cli-search');
        if (el && el.dataset && el.dataset.clienteId) return String(el.dataset.clienteId || '').trim();
      } catch (_) {}
      var r = orig.apply(this, arguments);
      try {
        var rid = String(r || '').trim();
        var inp = document.getElementById('f-cli-search');
        if (rid && inp && inp.dataset) inp.dataset.clienteId = rid;
      } catch (_) {}
      return r;
    };
    wrapped._patchClienteValidoNovaOf = true;
    window.ofResolveCliIdFromModal = wrapped;
  }

  function patchOfCliChange() {
    var orig = window.ofCliChange;
    if (typeof orig !== 'function' || orig._patchClienteValidoNovaOf) return;
    var wrapped = function() {
      var r = orig.apply(this, arguments);
      try {
        var sel = document.getElementById('f-cli');
        var id = sel ? String(sel.value || '').trim() : '';
        var inp = document.getElementById('f-cli-search');
        if (inp && inp.dataset) {
          if (id) {
            inp.dataset.clienteId = id;
            try {
              if (typeof window.getCli === 'function') {
                var c = window.getCli(id);
                if (c && (c.nome || c.rs)) inp.dataset.clienteNome = String(c.nome || c.rs || '').trim();
              }
            } catch (_) {}
          } else {
            delete inp.dataset.clienteId;
            delete inp.dataset.clienteNome;
          }
        }
      } catch (_) {}
      return r;
    };
    wrapped._patchClienteValidoNovaOf = true;
    window.ofCliChange = wrapped;
  }

  function patchApiFetchForCliId() {
    var orig = window.apiFetch;
    if (typeof orig !== 'function' || orig._patchClienteValidoNovaOf) return;
    var wrapped = function(url, opts) {
      try {
        var u = String(url || '');
        var m = String((opts && opts.method) || 'GET').toUpperCase();
        if (m === 'POST' && u.indexOf('/api/ofs') !== -1 && opts) {
          var el = document.getElementById('f-cli-search') || document.getElementById('of-r-cliente');
          var cliId = el && el.dataset ? String(el.dataset.clienteId || '').trim() : '';
          var cliNome = el && el.dataset ? String(el.dataset.clienteNome || '').trim() : '';
          if (!cliNome && el) cliNome = String(el.value || '').trim();
          if (cliId && opts.body) {
            if (typeof opts.body === 'string') {
              try {
                var o = JSON.parse(opts.body);
                if (o && typeof o === 'object') {
                  if (!o.cliId) o.cliId = cliId;
                  if (!o.cli_id) o.cli_id = cliId;
                  if (!o.cliente_id) o.cliente_id = cliId;
                  if (cliNome) {
                    if (!o.cliente_nome) o.cliente_nome = cliNome;
                    if (!o.cliNome) o.cliNome = cliNome;
                  }
                  opts.body = JSON.stringify(o);
                }
              } catch (_) {}
            } else if (typeof opts.body === 'object') {
              if (!opts.body.cliId) opts.body.cliId = cliId;
              if (!opts.body.cli_id) opts.body.cli_id = cliId;
              if (!opts.body.cliente_id) opts.body.cliente_id = cliId;
              if (cliNome) {
                if (!opts.body.cliente_nome) opts.body.cliente_nome = cliNome;
                if (!opts.body.cliNome) opts.body.cliNome = cliNome;
              }
            }
          }
        }
      } catch (_) {}
      return orig.apply(this, arguments);
    };
    wrapped._patchClienteValidoNovaOf = true;
    window.apiFetch = wrapped;
  }

  function tick() {
    try { bindClienteNovaOf(); } catch (_) {}
    try { patchResolveCliId(); } catch (_) {}
    try { patchOfCliChange(); } catch (_) {}
    try { patchApiFetchForCliId(); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 250);
      setInterval(tick, 1200);
    });
  } else {
    setTimeout(tick, 250);
    setInterval(tick, 1200);
  }
})();

(function patchFacasNumeroCategoria() {
  function authH() {
    var token = '';
    try { token = String(localStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function ensureNormalizeFaca() {
    var orig = window.normalizeFaca;
    if (typeof orig !== 'function' || orig._patchFacasNumeroCategoria) return;
    var wrapped = function(r) {
      var out = orig.apply(this, arguments) || {};
      try { out.numero = r && (r.numero || r.num || r.numeracao) ? String(r.numero || r.num || r.numeracao) : (out.numero || ''); } catch (_) {}
      try { out.categoria = r && (r.categoria || r.cat) ? String(r.categoria || r.cat) : (out.categoria || ''); } catch (_) {}
      return out;
    };
    wrapped._patchFacasNumeroCategoria = true;
    window.normalizeFaca = wrapped;
  }

  function fetchCategorias() {
    return fetch('/api/facas_categorias', { headers: authH() })
      .then(function(r) { return r.json(); })
      .then(function(j) { return (j && j.ok && Array.isArray(j.data)) ? j.data : []; })
      .catch(function() { return []; });
  }

  function fillCategoriaSelect(sel, cats) {
    if (!sel) return;
    var cur = String(sel.value || '');
    sel.innerHTML = '<option value="">Todas</option>';
    (cats || []).forEach(function(c) {
      var nome = String((c && (c.nome || c.name)) || '').trim();
      if (!nome) return;
      var opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      sel.appendChild(opt);
    });
    sel.value = cur;
  }

  function loadAndBindCategorias() {
    if (window.__facasCatsLoading) return;
    window.__facasCatsLoading = true;
    fetchCategorias().then(function(cats) {
      window.__FACAS_CATEGORIAS = cats || [];
      fillCategoriaSelect(document.getElementById('facas1-cat-filtro'), cats);
      fillCategoriaSelect(document.getElementById('facas2-cat-filtro'), cats);
      fillCategoriaSelect(document.getElementById('fa1-categoria'), cats);
    }).finally(function() { window.__facasCatsLoading = false; });
  }

  function ensureFacasToolbar(pageId, renderFnName) {
    var page = document.getElementById(pageId);
    if (!page) return;
    var bar = page.querySelector('.ptoolbar');
    if (!bar || bar.dataset.patchFacasNumeroCategoria === '1') return;
    bar.dataset.patchFacasNumeroCategoria = '1';

    var busca = bar.querySelector('input[id$="-busca"]');
    if (!busca) return;

    var num = document.createElement('input');
    num.id = pageId === 'page-facas1' ? 'facas1-num-busca' : 'facas2-num-busca';
    num.placeholder = '🔢 Número...';
    num.style.width = '140px';
    num.oninput = function() { try { if (typeof window[renderFnName] === 'function') window[renderFnName](); } catch (_) {} };

    var sel = document.createElement('select');
    sel.id = pageId === 'page-facas1' ? 'facas1-cat-filtro' : 'facas2-cat-filtro';
    sel.style.width = '160px';
    sel.style.background = 'var(--s2)';
    sel.style.border = '1px solid var(--border)';
    sel.style.color = 'var(--text)';
    sel.style.borderRadius = '8px';
    sel.style.padding = '7px 10px';
    sel.style.fontSize = '.85rem';
    sel.onchange = function() { try { if (typeof window[renderFnName] === 'function') window[renderFnName](); } catch (_) {} };

    var btnCat = document.createElement('button');
    btnCat.className = 'btn btn-ghost btn-sm';
    btnCat.type = 'button';
    btnCat.textContent = '+ Categoria';
    btnCat.onclick = function() {
      var nome = String(prompt('Nome da categoria:') || '').trim();
      if (!nome) return;
      fetch('/api/facas_categorias', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authH()),
        body: JSON.stringify({ nome: nome })
      })
        .then(function(r) { return r.json(); })
        .then(function(j) {
          if (!j || !j.ok) throw new Error((j && j.error) ? j.error : 'Falha ao criar categoria');
          loadAndBindCategorias();
          try { if (typeof window.toast === 'function') window.toast('✓ Categoria criada', 'var(--green)'); } catch (_) {}
        })
        .catch(function(e) { try { if (typeof window.toast === 'function') window.toast(String(e && e.message ? e.message : e), 'var(--red)'); } catch (_) {} });
    };

    if (busca.nextSibling) bar.insertBefore(num, busca.nextSibling);
    else bar.appendChild(num);
    bar.insertBefore(sel, num.nextSibling);
    bar.insertBefore(btnCat, sel.nextSibling);

    loadAndBindCategorias();
  }

  function ensureFacasTableHeaders() {
    [['page-facas1', 'facas1-body'], ['page-facas2', 'facas2-body']].forEach(function(pair) {
      var page = document.getElementById(pair[0]);
      if (!page) return;
      var tbody = document.getElementById(pair[1]);
      if (!tbody) return;
      var table = tbody.closest ? tbody.closest('table') : null;
      var tr = table ? table.querySelector('thead tr') : null;
      if (!tr || tr.dataset.patchFacasNumeroCategoria === '1') return;
      tr.dataset.patchFacasNumeroCategoria = '1';
      var ths = tr.querySelectorAll('th');
      if (!ths || ths.length < 2) return;
      var thFoto = ths[0];
      var thNome = ths[1];
      if (thNome && String(thNome.textContent || '').toUpperCase().indexOf('NOME') !== -1) {
        var thNum = document.createElement('th');
        thNum.textContent = 'NÚMERO';
        thNum.style.cssText = thNome.style.cssText;
        var thCat = document.createElement('th');
        thCat.textContent = 'CATEGORIA';
        thCat.style.cssText = thNome.style.cssText;
        tr.insertBefore(thCat, thNome);
        tr.insertBefore(thNum, thCat);
        try { table.style.minWidth = '980px'; } catch (_) {}
      }
    });
  }

  function patchRenderFacas(fnName, bodyId, buscaId, numBuscaId, catSelId) {
    var orig = window[fnName];
    if (typeof orig !== 'function' || orig._patchFacasNumeroCategoria) return;
    var wrapped = function() {
      ensureFacasTableHeaders();
      var body = document.getElementById(bodyId);
      if (!body) return orig.apply(this, arguments);
      var busca = String(((document.getElementById(buscaId) || {}).value || '')).toLowerCase();
      var buscaNum = String(((document.getElementById(numBuscaId) || {}).value || '')).toLowerCase().trim();
      var cat = String(((document.getElementById(catSelId) || {}).value || '')).trim();
      var lista = Array.isArray(window.FACAS) ? window.FACAS : [];
      if (busca) {
        lista = lista.filter(function(f) {
          var hay = String((f.nome || '') + (f.obs || '') + (f.medidas || '') + ((f.maquinas || []).join(' ')) + ((f.clientes || []).join(' '))).toLowerCase();
          return hay.indexOf(busca) !== -1;
        });
      }
      if (buscaNum) {
        lista = lista.filter(function(f) { return String(f.numero || '').toLowerCase().indexOf(buscaNum) !== -1; });
      }
      if (cat) {
        lista = lista.filter(function(f) { return String(f.categoria || '').trim() === cat; });
      }
      if (!lista.length) {
        body.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text3)">Nenhuma faca cadastrada — clique em ＋ Nova Faca</td></tr>';
        return;
      }
      body.innerHTML = lista.map(function(f) {
        var cliNomes = (f.clientes || []).map(function(id) { var c = (Array.isArray(window.CLIENTES) ? window.CLIENTES : []).find(function(x) { return x.id === id; }); return c ? c.nome : id; }).join(', ');
        var maqStr = (f.maquinas || []).join(', ') || '—';
        var thumb = (typeof window.renderFotoItem === 'function') ? window.renderFotoItem(f.foto, f.nome) : '';
        var num = String(f.numero || '').trim() || '—';
        var catTxt = String(f.categoria || '').trim() || '—';
        var nomeTxt = String(f.nome || '—');
        var medidasTxt = String(f.medidas || '—');
        var valorTxt = f.valor ? ('R$ ' + Number(f.valor).toFixed(2)) : '—';
        var esc = (typeof window.escAttr === 'function') ? window.escAttr : function(s) { return String(s || '').replace(/"/g, '&quot;'); };
        return '<tr>' +
          '<td style="padding:8px 10px;border:1px solid var(--border)">' + thumb + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem;color:var(--text2)">' + esc(num) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem">' + esc(catTxt) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-weight:600">' + esc(nomeTxt) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem;color:var(--text2)">' + esc(medidasTxt) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem">' + esc(maqStr) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem">' + esc(cliNomes || '—') + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);text-align:right;color:var(--green)">' + esc(valorTxt) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);text-align:center">' +
            '<button class="btn btn-ghost btn-sm" onclick="abrirModalFaca1(\'' + esc(f.id) + '\')" style="font-size:.68rem;margin-right:4px">✏</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="abrirModalQRCodeEstoque(\'faca\',\'' + esc(f.id) + '\',\'' + esc(f.nome || '') + '\')" style="font-size:.68rem;margin-right:4px">🔳</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="excluirFaca1(\'' + esc(f.id) + '\')" style="font-size:.68rem;color:var(--red)">🗑</button>' +
          '</td>' +
        '</tr>';
      }).join('');
    };
    wrapped._patchFacasNumeroCategoria = true;
    window[fnName] = wrapped;
  }

  function ensureModalFields() {
    var modal = document.getElementById('modal-faca1');
    if (!modal || modal.dataset.patchFacasNumeroCategoria === '1') return;
    var grid = modal.querySelector('.modal-body div[style*="grid-template-columns"]');
    var nome = document.getElementById('fa1-nome');
    if (!grid || !nome) return;
    modal.dataset.patchFacasNumeroCategoria = '1';

    var wrapNum = document.createElement('div');
    wrapNum.className = 'mf';
    wrapNum.innerHTML = '<label>NÚMERO</label><input id="fa1-numero" placeholder="Ex: F001">';

    var wrapCat = document.createElement('div');
    wrapCat.className = 'mf';
    wrapCat.innerHTML = '<label>CATEGORIA</label><select id="fa1-categoria" style="background:var(--s2);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 8px;font-size:.85rem;font-family:var(--font);width:100%"><option value="">Selecionar...</option></select>';

    var ref = document.getElementById('fa1-medidas');
    if (ref && ref.parentElement && ref.parentElement.nextSibling) {
      grid.insertBefore(wrapNum, ref.parentElement.nextSibling);
      grid.insertBefore(wrapCat, wrapNum.nextSibling);
    } else {
      grid.appendChild(wrapNum);
      grid.appendChild(wrapCat);
    }

    loadAndBindCategorias();
  }

  function patchAbrirModalFaca1() {
    var orig = window.abrirModalFaca1;
    if (typeof orig !== 'function' || orig._patchFacasNumeroCategoria) return;
    var wrapped = function(id) {
      var r = orig.apply(this, arguments);
      try { ensureModalFields(); } catch (_) {}
      try {
        var f = id && Array.isArray(window.FACAS) ? window.FACAS.find(function(x) { return x.id === id; }) : null;
        var numEl = document.getElementById('fa1-numero');
        if (numEl) numEl.value = f ? (f.numero || '') : '';
        var catEl = document.getElementById('fa1-categoria');
        if (catEl) catEl.value = f ? (f.categoria || '') : '';
      } catch (_) {}
      return r;
    };
    wrapped._patchFacasNumeroCategoria = true;
    window.abrirModalFaca1 = wrapped;
  }

  function patchApiForFacas() {
    var origFetch = window.fetch;
    if (typeof origFetch !== 'function' || origFetch._patchFacasNumeroCategoria) return;
    var wrapped = function(url, opts) {
      try {
        var u = String(url || '');
        var m = String((opts && opts.method) || 'GET').toUpperCase();
        if ((m === 'POST' || m === 'PUT') && u.indexOf('/facas_estoque') !== -1 && opts && opts.body && typeof opts.body === 'string') {
          try {
            var o = JSON.parse(opts.body);
            if (o && typeof o === 'object') {
              var num = String((document.getElementById('fa1-numero') || {}).value || '').trim();
              var cat = String((document.getElementById('fa1-categoria') || {}).value || '').trim();
              if (num) o.numero = num;
              if (cat) o.categoria = cat;
              opts.body = JSON.stringify(o);
            }
          } catch (_) {}
        }
      } catch (_) {}
      return origFetch.apply(this, arguments);
    };
    wrapped._patchFacasNumeroCategoria = true;
    window.fetch = wrapped;
  }

  function tick() {
    try { ensureNormalizeFaca(); } catch (_) {}
    try { ensureFacasToolbar('page-facas1', 'renderFacas1'); } catch (_) {}
    try { ensureFacasToolbar('page-facas2', 'renderFacas2'); } catch (_) {}
    try { patchRenderFacas('renderFacas1', 'facas1-body', 'facas1-busca', 'facas1-num-busca', 'facas1-cat-filtro'); } catch (_) {}
    try { patchRenderFacas('renderFacas2', 'facas2-body', 'facas2-busca', 'facas2-num-busca', 'facas2-cat-filtro'); } catch (_) {}
    try { patchAbrirModalFaca1(); } catch (_) {}
    try { ensureModalFields(); } catch (_) {}
    try { patchApiForFacas(); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 350);
      setInterval(tick, 1500);
    });
  } else {
    setTimeout(tick, 350);
    setInterval(tick, 1500);
  }
})();

(function patchClientesUX() {
  function injectCss() {
    if (document.getElementById('patch-clientes-css')) return;
    var cssClientes =
      '/* Container dos botões do topo de clientes */\n' +
      '.clientes-acoes-topo,\n' +
      '#clientes-toolbar,\n' +
      '[data-tela="clientes"] .toolbar,\n' +
      '.clientes-header-buttons {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  gap: 8px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '}\n' +
      '\n' +
      '/* Topo real da tela de clientes */\n' +
      '#page-clientes .ptoolbar {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  justify-content: flex-end !important;\n' +
      '  gap: 8px !important;\n' +
      '  padding: 8px 16px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '}\n' +
      '#page-clientes .ptoolbar > div[style*="flex:1"] {\n' +
      '  flex: 1 1 auto !important;\n' +
      '}\n' +
      '#page-clientes .cli-quick-filters {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  gap: 6px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '  margin: 0 !important;\n' +
      '}\n' +
      '#page-clientes .cli-quick-filters button,\n' +
      '#page-clientes .cli-quick-filters select,\n' +
      '#page-clientes [data-quick-filter] {\n' +
      '  opacity: 1 !important;\n' +
      '  pointer-events: auto !important;\n' +
      '}\n' +
      '#page-clientes .ptoolbar button {\n' +
      '  opacity: 1 !important;\n' +
      '  pointer-events: auto !important;\n' +
      '}\n' +
      '\n' +
      '/* Filtros de busca alinhados */\n' +
      '.clientes-filtros,\n' +
      '#clientes-filtros {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  gap: 8px !important;\n' +
      '  padding: 8px 16px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '}\n' +
      '\n' +
      '.cli-card {\n' +
      '  display: flex !important;\n' +
      '  flex-direction: column !important;\n' +
      '  height: 100% !important;\n' +
      '  cursor: pointer !important;\n' +
      '  transition: box-shadow 0.2s ease !important;\n' +
      '}\n' +
      '\n' +
      '.cli-card:hover {\n' +
      '  box-shadow: 0 4px 20px rgba(79,142,247,0.2) !important;\n' +
      '}\n' +
      '\n' +
      '.cli-card > div:last-child,\n' +
      '.cli-card .cli-acoes,\n' +
      '.cliente-card .acoes,\n' +
      '.cliente-card-footer,\n' +
      '.cliente-acoes {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  gap: 6px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '  margin-top: auto !important;\n' +
      '  opacity: 1 !important;\n' +
      '  pointer-events: auto !important;\n' +
      '}\n' +
      '\n' +
      '.cli-card button:last-of-type { margin-top: auto !important; }\n' +
      '\n' +
      '.cli-card button,\n' +
      '.cliente-card .acoes button,\n' +
      '.cliente-card-footer button,\n' +
      '.cliente-acoes button {\n' +
      '  padding: 4px 10px !important;\n' +
      '  font-size: 12px !important;\n' +
      '  border-radius: 6px !important;\n' +
      '  white-space: nowrap !important;\n' +
      '  flex: 1 !important;\n' +
      '  min-width: 60px !important;\n' +
      '  text-align: center !important;\n' +
      '  display: inline-flex !important;\n' +
      '  align-items: center !important;\n' +
      '}\n';
    var styleClientes = document.createElement('style');
    styleClientes.id = 'patch-clientes-css';
    styleClientes.textContent = cssClientes;
    (document.head || document.documentElement).appendChild(styleClientes);
  }

  function looksLikeClientesModal(modal) {
    if (!modal) return false;
    try {
      return !!modal.querySelector('input[name="estado"], #f-estado, input[placeholder="SC"], input[placeholder="UF"], input[name="uf"]');
    } catch (_) {
      return false;
    }
  }

  function mapEstadoToUfInModal(modal) {
    if (!looksLikeClientesModal(modal)) return;
    try {
      var inputEstado = modal.querySelector('input[name="estado"], #f-estado, input[placeholder="SC"]');
      if (inputEstado) {
        if (String(inputEstado.name || '').toLowerCase() === 'estado') inputEstado.name = 'uf';
        if (String(inputEstado.id || '').toLowerCase() === 'f-estado') inputEstado.id = 'f-uf';
      }
    } catch (_) {}
  }

  function clientesModalLike(modal) {
    if (!modal) return false;
    try {
      return !!modal.querySelector('#cl-nome, #cli-nome, #modal-cli, input[id*="cli-"], input[id*="cl-"]');
    } catch (_) {
      return false;
    }
  }

  function addClienteToArrays(novoCliente) {
    if (!novoCliente || !novoCliente.id) return;
    var id = String(novoCliente.id || '').trim();
    if (!id) return;
    var normalizado = novoCliente;
    try { if (typeof normalizeCli === 'function') normalizado = normalizeCli(novoCliente); } catch (_) {}
    var apply = function(arrName, getter) {
      try {
        var arr = getter();
        if (!Array.isArray(arr)) return;
        var existe = arr.find(function(c) { return String(c && c.id || '').trim() === id; });
        if (!existe) arr.push(normalizado);
      } catch (_) {}
    };
    apply('CLIENTES', function() { return (typeof CLIENTES !== 'undefined') ? CLIENTES : null; });
    apply('_CLIENTES', function() { return window._CLIENTES; });
    try {
      if (Array.isArray(window.CLIENTES)) {
        var existeW = window.CLIENTES.find(function(c) { return String(c && c.id || '').trim() === id; });
        if (!existeW) window.CLIENTES.push(normalizado);
      }
    } catch (_) {}
  }

  function getClientesListaAtual() {
    try {
      if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES) && CLIENTES.length) return CLIENTES;
    } catch (_) {}
    try {
      if (Array.isArray(window.CLIENTES) && window.CLIENTES.length) return window.CLIENTES;
    } catch (_) {}
    try {
      if (Array.isArray(window._CLIENTES) && window._CLIENTES.length) return window._CLIENTES;
    } catch (_) {}
    return [];
  }

  async function _carregarTodosClientes() {
    try {
      var token = '';
      try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
      var resp = await fetch('/api/clientes?limit=2000&order=created_at&dir=desc&t=' + Date.now(), {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      var json = await resp.json().catch(function() { return null; });
      if (json && json.ok && Array.isArray(json.data) && json.data.length) {
        try {
          if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) {
            CLIENTES.length = 0;
            json.data.forEach(function(c) { CLIENTES.push(c); });
          }
        } catch (_) {}
        try { window.CLIENTES = json.data; } catch (_) {}
        try { window._CLIENTES = json.data; } catch (_) {}
        console.log('[PATCH] clientes carregados:', json.data.length);
        if (typeof renderClientes === 'function') renderClientes();
      }
    } catch (e) {
      try { console.error('[PATCH] carregarTodosClientes', e); } catch (_) {}
    }
  }

  function findClienteById(id) {
    var alvo = String(id || '').trim();
    if (!alvo) return null;
    var lista = getClientesListaAtual();
    for (var i = 0; i < lista.length; i++) {
      if (String(lista[i] && lista[i].id || '').trim() === alvo) return lista[i];
    }
    return null;
  }

  function getMesclaDuplicadoIds() {
    try {
      var nodes = document.querySelectorAll('#mescla-duplicados input.mescla-duplicado-id');
      return Array.prototype.map.call(nodes, function(el) { return String(el.value || '').trim(); }).filter(Boolean);
    } catch (_) {
      return [];
    }
  }

  function renderMesclaPreview() {
    try {
      var principal = findClienteById(document.getElementById('mescla-principal-id') && document.getElementById('mescla-principal-id').value);
      var duplicados = getMesclaDuplicadoIds().map(findClienteById).filter(Boolean);
      var box = document.getElementById('mescla-preview');
      if (!box) return;
      box.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px">' +
            '<div style="font-weight:700;color:var(--text);margin-bottom:8px">Cliente Principal</div>' +
            (principal
              ? '<div style="color:var(--text);font-size:13px">' + String(principal.nome || '-') + '</div>' +
                '<div style="color:var(--text2);font-size:12px;margin-top:4px">' + String(principal.cnpj || principal.documento || '-') + '</div>'
              : '<div style="color:var(--text2);font-size:12px">Selecione o cliente principal</div>') +
          '</div>' +
          '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px">' +
            '<div style="font-weight:700;color:var(--text);margin-bottom:8px">Clientes a Mesclar</div>' +
            (duplicados.length
              ? duplicados.map(function(duplicado) {
                  return '<div style="padding:6px 0;border-top:1px solid rgba(255,255,255,0.06)">' +
                    '<div style="color:var(--text);font-size:13px">' + String(duplicado.nome || '-') + '</div>' +
                    '<div style="color:var(--text2);font-size:12px;margin-top:4px">' + String(duplicado.cnpj || duplicado.documento || '-') + '</div>' +
                  '</div>';
                }).join('')
              : '<div style="color:var(--text2);font-size:12px">Selecione ao menos um cliente duplicado</div>') +
          '</div>' +
        '</div>';
    } catch (_) {}
  }

  function syncMesclaField(input, hidden, listId) {
    try {
      if (!input || !hidden) return;
      var list = document.getElementById(listId);
      var val = String(input.value || '').trim();
      var opt = list ? Array.prototype.find.call(list.options || [], function(o) { return String(o.value || '').trim() === val; }) : null;
      hidden.value = opt ? String(opt.getAttribute('data-id') || '') : '';
      renderMesclaPreview();
    } catch (_) {}
  }

  function bindMesclaField(input, hidden, listId) {
    if (!input || input.dataset.patchMesclaBind === '1') return;
    input.dataset.patchMesclaBind = '1';
    ['input', 'change'].forEach(function(evt) {
      input.addEventListener(evt, function() { syncMesclaField(input, hidden, listId); });
    });
  }

  function addMesclaDuplicadoRow() {
    try {
      var wrap = document.getElementById('mescla-duplicados');
      if (!wrap) return;
      var idx = wrap.querySelectorAll('.mescla-duplicado-row').length + 1;
      var row = document.createElement('div');
      row.className = 'mescla-duplicado-row';
      row.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:8px';
      row.innerHTML =
        '<div>' +
          '<label style="display:block;color:var(--text2);font-size:12px;margin-bottom:4px">CLIENTE DUPLICADO ' + idx + '</label>' +
          '<input class="mescla-duplicado-busca" list="mescla-clientes-lista" placeholder="Buscar cliente..." style="width:100%;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text)">' +
          '<input type="hidden" class="mescla-duplicado-id">' +
        '</div>' +
        '<button type="button" class="mescla-remover-dup" style="padding:8px 10px;background:rgba(255,255,255,0.08);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer">Remover</button>';
      wrap.appendChild(row);
      var input = row.querySelector('.mescla-duplicado-busca');
      var hidden = row.querySelector('.mescla-duplicado-id');
      bindMesclaField(input, hidden, 'mescla-clientes-lista');
      row.querySelector('.mescla-remover-dup').onclick = function() {
        try { row.remove(); } catch (_) {}
        renderMesclaPreview();
      };
    } catch (_) {}
  }

  async function confirmarMesclaClientes() {
    try {
      var principalInput = document.querySelector('#mescla-principal-id, [data-mescla-principal], .mescla-principal input[type="hidden"], #mescla-cliente-principal');
      var principalId = String((principalInput && (principalInput.value || principalInput.dataset && (principalInput.dataset.id || principalInput.dataset.mesclaPrincipal))) || '').trim();
      if (!principalId || principalId === 'undefined') {
        toastHotfix('⚠️ Selecione o cliente principal primeiro', 'var(--orange)');
        return;
      }

      var duplicados = Array.from(new Set(
        Array.prototype.slice.call(document.querySelectorAll('[data-duplicado-id], .mescla-duplicado[data-id], #mescla-duplicados [data-cliente-id], .cliente-duplicado-item, .mescla-duplicado-id'))
          .map(function(el) {
            return String(((el && el.dataset && (el.dataset.duplicadoId || el.dataset.id || el.dataset.clienteId)) || el.value || '')).trim();
          })
          .concat(getMesclaDuplicadoIds())
          .filter(function(id) { return id && id !== principalId && id !== 'undefined'; })
      ));
      if (!duplicados.length) {
        toastHotfix('⚠️ Adicione pelo menos um cliente duplicado para mesclar', 'var(--orange)');
        return;
      }

      if (!confirm('Confirmar mescla dos clientes?')) return;
      try { console.log('[mesclar] principal:', principalId, 'duplicados:', duplicados); } catch (_) {}

      var btn = document.querySelector('#btn-confirmar-mescla, .btn-confirmar-mescla, #mescla-confirmar, [onclick*="confirmarMescla"]');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Mesclando...'; }
      var token = '';
      try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
      var resp = await fetch('/api/clientes/mesclar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? ('Bearer ' + token) : ''
        },
        body: JSON.stringify({
          principal_id: principalId,
          duplicados: duplicados
        })
      });
      var json = await resp.json().catch(function() { return null; });
      if (!resp.ok || !json || !json.ok) throw new Error((json && json.error) || ('Erro ' + resp.status));
      try {
        ['modal-mesclar-clientes', 'modal-mescla', 'mesclar-modal'].forEach(function(id) {
          var modal = document.getElementById(id);
          if (modal) modal.remove();
        });
        Array.prototype.slice.call(document.querySelectorAll('[id*="mescl"][id*="modal"]')).forEach(function(el) {
          try { el.remove(); } catch (_) {}
        });
      } catch (_) {}
      try { window._clientesCarregados = false; } catch (_) {}
      try { window.OFS_ARQUIVO = null; } catch (_) {}
      try { window.OFS_CACHE = null; } catch (_) {}
      try { window._ofsArquivoLastLoad = 0; } catch (_) {}
      try { await _carregarTodosClientes(); } catch (_) {}
      try { if (typeof carregarClientes === 'function') await carregarClientes(true); } catch (_) {}
      try { if (typeof renderClientes === 'function') setTimeout(renderClientes, 300); } catch (_) {}
      toastHotfix('✅ Mesclados com sucesso! ' + String(json.ofs_migradas || 0) + ' OFs migradas', 'var(--green)');
    } catch (e) {
      toastHotfix('❌ Erro ao mesclar: ' + String(e && e.message || e), 'var(--red)');
      try { console.error('[mesclar]', e); } catch (_) {}
    } finally {
      try {
        var btn2 = document.querySelector('#btn-confirmar-mescla, .btn-confirmar-mescla, #mescla-confirmar, [onclick*="confirmarMescla"]');
        if (btn2) { btn2.disabled = false; btn2.textContent = 'Confirmar Mescla'; }
      } catch (_) {}
    }
  }
  window.confirmarMesclaClientes = confirmarMesclaClientes;

  function abrirModalMesclarClientes() {
    try {
      var old = document.getElementById('modal-mesclar-clientes');
      if (old) old.remove();
      var lista = getClientesListaAtual();
      var modal = document.createElement('div');
      modal.id = 'modal-mesclar-clientes';
      modal.style.position = 'fixed';
      modal.style.inset = '0';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '20px';
      modal.style.zIndex = '99999';
      try { modal.style.setProperty('background', 'rgba(0,0,0,0.75)', 'important'); } catch (_) { modal.style.background = 'rgba(0,0,0,0.75)'; }
      try { modal.style.setProperty('backdrop-filter', 'blur(2px)', 'important'); } catch (_) {}
      modal.innerHTML =
        '<div style="background:var(--bg2,#1e2433) !important;border:1px solid var(--border,#2d3748);border-radius:12px;padding:24px;width:100%;max-width:760px;max-height:90vh;overflow-y:auto">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
            '<h3 style="margin:0;color:var(--text);font-size:16px">🔗 Mesclar Clientes</h3>' +
            '<button id="mescla-close" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
          '</div>' +
          '<div>' +
            '<label style="display:block;color:var(--text2);font-size:12px;margin-bottom:4px">CLIENTE PRINCIPAL</label>' +
            '<input id="mescla-principal-busca" list="mescla-clientes-lista" placeholder="Buscar cliente..." style="width:100%;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text)">' +
            '<input type="hidden" id="mescla-principal-id">' +
          '</div>' +
          '<div id="mescla-duplicados" style="margin-top:14px"></div>' +
          '<button id="mescla-add-dup" type="button" style="margin-top:10px;padding:8px 12px;background:rgba(124,106,247,0.16);border:1px solid rgba(124,106,247,0.38);border-radius:8px;color:#c9c2ff;cursor:pointer;font-size:13px">+ Adicionar outro duplicado</button>' +
          '<datalist id="mescla-clientes-lista">' +
            lista.map(function(c) {
              var label = String(c && c.nome || '-');
              var cnpj = String(c && (c.cnpj || c.documento || '') || '').trim();
              var value = cnpj ? (label + ' | ' + cnpj) : label;
              return '<option value="' + value.replace(/"/g, '&quot;') + '" data-id="' + String(c && c.id || '').replace(/"/g, '&quot;') + '"></option>';
            }).join('') +
          '</datalist>' +
          '<div id="mescla-preview" style="margin-top:16px"></div>' +
          '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">' +
            '<button id="mescla-cancelar" style="padding:8px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer">Cancelar</button>' +
            '<button id="mescla-confirmar" style="padding:8px 16px;background:#7c6af7;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">Confirmar Mescla</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);
      try {
        var box = modal.firstElementChild;
        if (box) {
          try { box.style.setProperty('background', 'var(--bg2,#1e2433)', 'important'); } catch (_) {}
          try { box.style.setProperty('border', '1px solid var(--border,#2d3748)', 'important'); } catch (_) {}
        }
      } catch (_) {}
      var close = function() { try { modal.remove(); } catch (_) {} };
      document.getElementById('mescla-close').onclick = close;
      document.getElementById('mescla-cancelar').onclick = close;
      document.getElementById('mescla-confirmar').onclick = confirmarMesclaClientes;
      document.getElementById('mescla-add-dup').onclick = function() { addMesclaDuplicadoRow(); };
      bindMesclaField(document.getElementById('mescla-principal-busca'), document.getElementById('mescla-principal-id'), 'mescla-clientes-lista');
      addMesclaDuplicadoRow();
      renderMesclaPreview();
    } catch (e) {
      try { console.error('[MESCLAR CLIENTES]', e); } catch (_) {}
    }
  }

  function _resetFiltrosClientes() {
    try {
      var sit = document.querySelector('#cli-sit');
      if (sit) {
        sit.value = '';
        try { sit.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
      }
      var ramo = document.querySelector('#cli-ramo');
      if (ramo) {
        ramo.value = '';
        try { ramo.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
      }
      var emp = document.querySelector('#cli-emp-fil');
      if (emp) {
        emp.value = '';
        try { emp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
      }
      if (typeof renderClientes === 'function') {
        try { renderClientes(); } catch (_) {}
      }
      try { _carregarTodosClientes(); } catch (_) {}
    } catch (_) {}
  }

  function ensureBtnVerTodos() {
    try {
      var bar = document.querySelector('#page-clientes .ptoolbar');
      if (!bar) return;
      if (document.getElementById('patch-cli-ver-todos')) return;
      var btn = document.createElement('button');
      btn.id = 'patch-cli-ver-todos';
      btn.className = 'btn btn-ghost btn-sm';
      btn.textContent = 'Ver Todos';
      btn.onclick = async function() {
        try {
          ['#cli-busca', '#cli-ramo', '#cli-sit', '#cli-emp-fil'].forEach(function(s) {
            var el = document.querySelector(s);
            if (!el) return;
            el.value = '';
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
            try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
          });
          try {
            if (typeof EMP_FILTRO !== 'undefined' && EMP_FILTRO) {
              if (window.__EMP_FILTRO_ANT == null) window.__EMP_FILTRO_ANT = EMP_FILTRO;
              EMP_FILTRO = '';
            }
          } catch (_) {}
          await _carregarTodosClientes();
          if (typeof carregarClientes === 'function') {
            try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
          }
          if (typeof renderClientes === 'function') {
            try { renderClientes(); } catch (_) {}
          }
        } catch (e) {
          try { console.error('[PATCH VER TODOS]', e); } catch (_) {}
        }
      };
      var before = bar.querySelector('button[onclick*="abrirClientesInativos"], button[onclick*="clientesAbrirImportExcel"], button[onclick*="clientesVerificarDuplicatas"], button[onclick*="abrirModalCliente"]');
      if (before && before.parentNode === bar) bar.insertBefore(btn, before);
      else bar.appendChild(btn);
    } catch (_) {}
  }

  function ensureBtnMesclarClientes() {
    try {
      var bar = document.querySelector('#page-clientes .ptoolbar');
      if (!bar) return;
      if (document.getElementById('patch-cli-mesclar')) return;
      var btn = document.createElement('button');
      btn.id = 'patch-cli-mesclar';
      btn.textContent = '🔗 Mesclar';
      btn.setAttribute('style', 'background:#7c6af7 !important;color:#fff !important;border:none !important;padding:6px 12px !important;border-radius:6px !important;cursor:pointer !important;font-size:13px !important;');
      btn.onclick = function() { abrirModalMesclarClientes(); };
      var after = bar.querySelector('button[onclick*="clientesVerificarDuplicatas"]');
      if (after && after.parentNode === bar) {
        if (after.nextSibling) bar.insertBefore(btn, after.nextSibling);
        else bar.appendChild(btn);
      } else {
        bar.appendChild(btn);
      }
    } catch (_) {}
  }

  function ensureClientesQuickFiltersNoTopo() {
    try {
      var toolbar = document.querySelector('#page-clientes .ptoolbar');
      var widget = document.querySelector('#page-clientes #widget-analise-clientes > div:first-child');
      if (!toolbar || !widget) return;
      widget.style.display = 'none';
      var host = document.getElementById('patch-cli-quick-filters');
      if (!host) {
        host = document.createElement('div');
        host.id = 'patch-cli-quick-filters';
        host.className = 'cli-quick-filters';
        host.innerHTML =
          '<button type="button" id="patch-analise-inativos" style="background:#4A90D9;color:#fff;border:none;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:13px;font-weight:600">Sem pedir há +30 dias</button>' +
          '<button type="button" id="patch-analise-ativos" style="background:rgba(255,255,255,0.07);color:#94a3b8;border:none;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:13px">Quem mais pede</button>' +
          '<button type="button" id="patch-analise-valor" style="background:rgba(255,255,255,0.07);color:#94a3b8;border:none;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:13px">Maior valor</button>' +
          '<select id="patch-sel-dias-inativo" style="background:#0b1220;color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:4px 10px;font-size:12px">' +
            '<option value="15">15 dias</option>' +
            '<option value="30" selected>30 dias</option>' +
            '<option value="60">60 dias</option>' +
            '<option value="90">90 dias</option>' +
          '</select>';
      }
      var spacer = toolbar.querySelector('div[style*="flex:1"]');
      if (host.parentNode !== toolbar) {
        if (spacer && spacer.nextSibling) toolbar.insertBefore(host, spacer.nextSibling);
        else toolbar.appendChild(host);
      }
      var origSel = document.getElementById('sel-dias-inativo');
      var cloneSel = document.getElementById('patch-sel-dias-inativo');
      if (origSel && cloneSel && cloneSel.value !== origSel.value) cloneSel.value = origSel.value;
      if (!host.dataset.patchBound) {
        host.dataset.patchBound = '1';
        var escHLocal = function(s) {
          try { return window.escH ? window.escH(s) : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); } catch (_) { return String(s == null ? '' : s); }
        };
        var fmtMoneyLocal = function(v) {
          var n = Number(v || 0) || 0;
          try { if (typeof window.fmtR === 'function') return window.fmtR(n); } catch (_) {}
          return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        var fmtDataLocal = function(s) {
          var d = String(s || '').slice(0, 10);
          try { if (typeof window.fmtD === 'function') return window.fmtD(d); } catch (_) {}
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
            var parts = d.split('-');
            return parts[2] + '/' + parts[1] + '/' + parts[0];
          }
          return d || '—';
        };
        var getAuthHeader = function() {
          var token = '';
          try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''); } catch (_) {}
          return token ? { Authorization: 'Bearer ' + token } : {};
        };
        var apiGet = async function(url) {
          if (typeof window.apiFetch === 'function') return await window.apiFetch(url, { method: 'GET' });
          return await fetch(url, { method: 'GET', headers: getAuthHeader() });
        };
        var ensureRankingModal = function() {
          var old = document.getElementById('modal-ranking-clientes');
          if (old) return old;
          var modal = document.createElement('div');
          modal.id = 'modal-ranking-clientes';
          modal.style.position = 'fixed';
          modal.style.inset = '0';
          modal.style.display = 'none';
          modal.style.alignItems = 'center';
          modal.style.justifyContent = 'center';
          modal.style.padding = '20px';
          modal.style.zIndex = '99999';
          try { modal.style.setProperty('background', 'rgba(0,0,0,0.75)', 'important'); } catch (_) { modal.style.background = 'rgba(0,0,0,0.75)'; }
          try { modal.style.setProperty('backdrop-filter', 'blur(2px)', 'important'); } catch (_) {}
          modal.innerHTML =
            '<div id="modal-ranking-clientes-box" style="width:100%;max-width:860px;max-height:90vh;overflow:auto;border-radius:12px;padding:18px 18px 14px;border:1px solid var(--border,#2d3748);background:var(--bg2,#1e2433)">' +
              '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px">' +
                '<div style="min-width:0">' +
                  '<div id="ranking-clientes-titulo" style="font-weight:800;color:var(--text,#e2e8f0);font-size:15px">Ranking</div>' +
                  '<div id="ranking-clientes-sub" style="margin-top:2px;color:var(--text2,#94a3b8);font-size:12px"></div>' +
                '</div>' +
                '<button id="ranking-clientes-close" style="background:none;border:none;color:var(--text2,#94a3b8);font-size:20px;cursor:pointer">✕</button>' +
              '</div>' +
              '<div id="ranking-clientes-body" style="display:flex;flex-direction:column;gap:8px"></div>' +
            '</div>';
          modal.addEventListener('click', function(ev) { try { if (ev.target === modal) modal.style.display = 'none'; } catch (_) {} });
          document.body.appendChild(modal);
          var btnClose = document.getElementById('ranking-clientes-close');
          if (btnClose) btnClose.onclick = function() { modal.style.display = 'none'; };
          return modal;
        };
        var renderRanking = function(rows, tipo) {
          var body = document.getElementById('ranking-clientes-body');
          if (!body) return;
          var list = Array.isArray(rows) ? rows : [];
          if (!list.length) {
            body.innerHTML = '<div style="padding:14px;color:var(--text2,#94a3b8);text-align:center">Nenhum dado encontrado.</div>';
            return;
          }
          var topMetric = 0;
          list.forEach(function(r) {
            var m = (tipo === 'valor') ? Number(r && r.faturamento || 0) : Number(r && r.total_ofs || 0);
            if (m > topMetric) topMetric = m;
          });
          if (!(topMetric > 0)) topMetric = 1;
          body.innerHTML = list.map(function(r, i) {
            var medalha = (i === 0) ? '🥇' : (i === 1) ? '🥈' : (i === 2) ? '🥉' : '#';
            var nome = String(r && r.nome || '—').trim() || '—';
            var cidade = String(r && r.cidade || '—').trim() || '—';
            var qtd = Number(r && r.total_ofs || 0) || 0;
            var fat = Number(r && r.faturamento || 0) || 0;
            var metric = (tipo === 'valor') ? fat : qtd;
            var pct = Math.max(0, Math.min(100, (metric / topMetric) * 100));
            var lblMetric = (tipo === 'valor') ? fmtMoneyLocal(fat) : (String(qtd) + ' OFs');
            var sub = (tipo === 'valor') ? (String(qtd) + ' OFs') : fmtMoneyLocal(fat);
            return (
              '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 12px;display:flex;gap:12px;align-items:center">' +
                '<div style="width:44px;flex:0 0 44px;text-align:center;font-family:var(--mono);font-weight:900;color:var(--accent,#4A90D9)">' + escHLocal(medalha) + '<div style="margin-top:2px;color:var(--text2,#94a3b8);font-size:11px">' + (i + 1) + '</div></div>' +
                '<div style="flex:1;min-width:0">' +
                  '<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline">' +
                    '<div style="min-width:0">' +
                      '<div style="color:var(--text,#e2e8f0);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHLocal(nome) + '</div>' +
                      '<div style="margin-top:2px;color:var(--text2,#94a3b8);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHLocal(cidade) + '</div>' +
                    '</div>' +
                    '<div style="text-align:right;flex:0 0 auto">' +
                      '<div style="color:var(--text,#e2e8f0);font-weight:900;font-family:var(--mono)">' + escHLocal(lblMetric) + '</div>' +
                      '<div style="margin-top:2px;color:var(--text2,#94a3b8);font-size:11px">' + escHLocal(sub) + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div style="margin-top:10px;height:8px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden">' +
                    '<div style="height:100%;width:' + pct.toFixed(1) + '%;background:linear-gradient(90deg,#4A90D9,#22d3ee);border-radius:999px"></div>' +
                  '</div>' +
                '</div>' +
              '</div>'
            );
          }).join('');
        };
        var abrirRankingClientes = async function(tipo) {
          var modal = ensureRankingModal();
          modal.style.display = 'flex';
          var titulo = document.getElementById('ranking-clientes-titulo');
          var sub = document.getElementById('ranking-clientes-sub');
          var body = document.getElementById('ranking-clientes-body');
          if (titulo) titulo.textContent = (tipo === 'valor') ? 'Maior valor' : 'Quem mais pede';
          if (sub) sub.textContent = 'Carregando…';
          if (body) body.innerHTML = '<div style="padding:14px;color:var(--text2,#94a3b8);text-align:center">Carregando…</div>';
          try {
            var resp = await apiGet('/api/clientes/ranking?tipo=' + encodeURIComponent(tipo === 'valor' ? 'valor' : 'quantidade') + '&limit=50&t=' + Date.now());
            var json = await resp.json().catch(function() { return null; });
            var rows = (json && json.ok && Array.isArray(json.data)) ? json.data : [];
            if (sub) sub.textContent = rows.length ? (rows.length + ' clientes') : 'Sem dados';
            renderRanking(rows, tipo === 'valor' ? 'valor' : 'quantidade');
          } catch (e) {
            if (sub) sub.textContent = 'Erro ao carregar';
            if (body) body.innerHTML = '<div style="padding:14px;color:#f87171;text-align:center">Erro ao carregar ranking.</div>';
          }
        };
        var setTipo = function(tipo) {
          ['inativos', 'ativos', 'valor'].forEach(function(t) {
            var b = document.getElementById('patch-analise-' + t);
            if (!b) return;
            if (t === tipo) {
              b.style.background = '#4A90D9';
              b.style.color = '#fff';
              b.style.fontWeight = '600';
            } else {
              b.style.background = 'rgba(255,255,255,0.07)';
              b.style.color = '#94a3b8';
              b.style.fontWeight = '400';
            }
          });
        };
        document.getElementById('patch-analise-inativos').onclick = function() {
          try { if (origSel && cloneSel) origSel.value = cloneSel.value; } catch (_) {}
          try { if (typeof window.abrirClientesInativos === 'function') window.abrirClientesInativos(); } catch (_) { try { if (typeof carregarAnaliseClientes === 'function') carregarAnaliseClientes('inativos'); } catch (_) {} }
          setTipo('inativos');
        };
        document.getElementById('patch-analise-ativos').onclick = function() {
          try { abrirRankingClientes('quantidade'); } catch (_) {}
          setTipo('ativos');
        };
        document.getElementById('patch-analise-valor').onclick = function() {
          try { abrirRankingClientes('valor'); } catch (_) {}
          setTipo('valor');
        };
        cloneSel.onchange = function() {
          try { if (origSel) origSel.value = cloneSel.value; } catch (_) {}
          try { if (typeof window.abrirClientesInativos === 'function') window.abrirClientesInativos(); } catch (_) { try { if (typeof carregarAnaliseClientes === 'function') carregarAnaliseClientes('inativos'); } catch (_) {} }
          setTipo('inativos');
        };
      }
    } catch (_) {}
  }

  function _adicionarBadgeOfs() {
    try {
      var cards = document.querySelectorAll('.cli-card');
      cards.forEach(function(card) {
        if (card.querySelector('.badge-ofs')) return;
        var nome = card.querySelector('.cli-name, .cli-nome, h3, strong');
        var total = card.querySelector('.cli-stat b');
        var txt = String(total && total.textContent || '').trim();
        if (!nome || !txt) return;
        var badge = document.createElement('span');
        badge.className = 'badge-ofs';
        badge.style.cssText = 'background:var(--accent);color:#fff;border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700;margin-left:6px;display:inline-flex;align-items:center;';
        badge.textContent = txt + ' OFs';
        nome.appendChild(badge);
      });
    } catch (_) {}
  }

  function patchRenderClientesBadge() {
    var orig = window.renderClientes;
    if (typeof orig !== 'function' || orig._patchBadgeOfs) return;
    var wrapped = function() {
      var r = orig.apply(this, arguments);
      setTimeout(_adicionarBadgeOfs, 40);
      return r;
    };
    wrapped._patchBadgeOfs = true;
    window.renderClientes = wrapped;
  }

  function patchSalvarAntiDuploClique() {
    if (document.documentElement.dataset.patchClientesSalvarLock === '1') return;
    document.documentElement.dataset.patchClientesSalvarLock = '1';
    document.addEventListener('click', function(e) {
      try {
        var btn = e && e.target && e.target.closest ? e.target.closest('button') : null;
        if (!btn) return;
        var texto = String(btn.textContent || '').trim().toLowerCase();
        if (!(texto === 'salvar' || texto === 'salvar alteracoes' || texto === 'salvar alterações')) return;
        var modal = btn.closest ? btn.closest('.modal, [id*="modal"], .modal-overlay') : null;
        if (!clientesModalLike(modal)) return;
        if (btn.dataset.patchLockUntil && Number(btn.dataset.patchLockUntil) > Date.now()) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.dataset.patchLockUntil = String(Date.now() + 2000);
        setTimeout(function() {
          try {
            btn.disabled = false;
            btn.style.opacity = '1';
            delete btn.dataset.patchLockUntil;
          } catch (_) {}
        }, 2000);
      } catch (_) {}
    }, true);
  }

  function patchFetchClientesAfterPost() {
    var origFetch = window.fetch;
    if (typeof origFetch !== 'function' || origFetch._patchClientesAfterPost) return;
    var wrapped = function(url, opts) {
      var isClientesPost = false;
      try {
        var u = typeof url === 'string' ? url : (url && url.url ? String(url.url) : '');
        var m = String((opts && opts.method) || 'GET').toUpperCase();
        isClientesPost = (m === 'POST' && u.indexOf('/api/clientes') !== -1);
      } catch (_) {}

      var p = origFetch.apply(this, arguments);

      if (isClientesPost) {
        try {
          p.then(function(res) {
            try { return res.clone().json(); } catch (_) { return null; }
          }).then(async function(data) {
            try {
              if (!(data && data.ok && data.data)) return;
              var novoCliente = data.data;
              console.log('[NOVO CLIENTE]', novoCliente.nome, novoCliente.id);

              if (typeof carregarClientes === 'function') {
                try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
              }

              var existe = null;
              try {
                var arr = (Array.isArray(window.CLIENTES) ? window.CLIENTES : ((typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) ? CLIENTES : []));
                existe = arr.find(function(c) { return String(c && c.id || '').trim() === String(novoCliente.id || '').trim(); }) || null;
              } catch (_) {}

              if (!existe) {
                console.log('[PATCH] adicionando cliente manualmente ao array');
                addClienteToArrays(novoCliente);
                try { await _carregarTodosClientes(); } catch (_) {}
              }

              if (typeof renderClientes === 'function') {
                try { renderClientes(); } catch (_) {}
              }
            } catch (_) {}
          }).catch(function() {});
        } catch (_) {}
      }

      return p;
    };
    wrapped._patchClientesAfterPost = true;
    window.fetch = wrapped;
  }

  function abrirModalNovoCliente() {
    try {
      var existente = document.getElementById('modal-novo-cliente-overlay');
      if (existente) existente.remove();
    } catch (_) {}

    var overlay = document.createElement('div');
    overlay.id = 'modal-novo-cliente-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:18px;';
    overlay.innerHTML =
      '<div style="width:100%;max-width:520px;max-height:90vh;overflow:auto;border-radius:12px;padding:16px;border:1px solid var(--border,#2d3748);background:var(--bg2,#111827);color:var(--text,#e5e7eb)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">' +
          '<div style="font-weight:800;font-size:15px">Novo cliente</div>' +
          '<button id="novo-cli-fechar" style="background:none;border:none;color:var(--text2,#94a3b8);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:10px">' +
          '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Nome</label><input id="novo-cli-nome" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
          '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Razão social</label><input id="novo-cli-rs" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
            '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">CNPJ/Documento</label><input id="novo-cli-cnpj" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
            '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Telefone</label><input id="novo-cli-tel" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
            '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">E-mail</label><input id="novo-cli-email" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
            '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Cidade</label><input id="novo-cli-cidade" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
          '</div>' +
          '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Observações</label><textarea id="novo-cli-obs" rows="3" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc);resize:vertical"></textarea></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px">' +
          '<button id="novo-cli-cancelar" style="padding:9px 12px;border-radius:10px;border:1px solid var(--border,#273449);background:transparent;color:var(--text,#e5e7eb);cursor:pointer">Cancelar</button>' +
          '<button id="novo-cli-salvar" style="padding:9px 12px;border-radius:10px;border:1px solid rgba(34,197,94,0.35);background:rgba(34,197,94,0.18);color:#bbf7d0;cursor:pointer;font-weight:700">Salvar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    function fechar() {
      try { overlay.remove(); } catch (_) {}
    }

    overlay.addEventListener('click', function(e) {
      try { if (e && e.target === overlay) fechar(); } catch (_) {}
    });
    try { document.getElementById('novo-cli-fechar').onclick = fechar; } catch (_) {}
    try { document.getElementById('novo-cli-cancelar').onclick = fechar; } catch (_) {}
    try { document.getElementById('novo-cli-salvar').onclick = salvarNovoCliente; } catch (_) {}
    try { document.getElementById('novo-cli-nome').focus(); } catch (_) {}
  }

  async function salvarNovoCliente() {
    try {
      var nome = String((document.getElementById('novo-cli-nome') || {}).value || '').trim();
      var rs = String((document.getElementById('novo-cli-rs') || {}).value || '').trim();
      var cnpj = String((document.getElementById('novo-cli-cnpj') || {}).value || '').trim();
      var tel = String((document.getElementById('novo-cli-tel') || {}).value || '').trim();
      var email = String((document.getElementById('novo-cli-email') || {}).value || '').trim();
      var cidade = String((document.getElementById('novo-cli-cidade') || {}).value || '').trim();
      var observacoes = String((document.getElementById('novo-cli-obs') || {}).value || '').trim();

      if (!nome && !rs) {
        alert('Nome obrigatório');
        return;
      }

      var token = '';
      try { token = String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || ''); } catch (_) { token = ''; }
      var headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = 'Bearer ' + token;

      var payload = {
        nome: nome || rs || '',
        rs: rs || nome || '',
        cnpj: cnpj || '',
        documento: cnpj || '',
        telefone: tel || '',
        tel: tel || '',
        email: email || '',
        cidade: cidade || '',
        observacoes: observacoes || ''
      };

      var resp = await fetch('/api/clientes', { method: 'POST', headers: headers, body: JSON.stringify(payload) });
      var json = null;
      try { json = await resp.json(); } catch (_) { json = null; }
      if (!(json && json.ok && json.data)) {
        var msg = (json && (json.error || json.message)) ? String(json.error || json.message) : ('Erro ao salvar (' + resp.status + ')');
        alert(msg);
        return;
      }

      try {
        var overlay = document.getElementById('modal-novo-cliente-overlay');
        if (overlay) overlay.remove();
      } catch (_) {}

      try { window._clientesCarregados = false; } catch (_) {}
      try { window._CLIENTES = []; } catch (_) {}
      try { window.CLIENTES = []; } catch (_) {}
      try { if (typeof CLIENTES !== 'undefined') CLIENTES.length = 0; } catch (_) {}

      try {
        if (typeof carregarClientes === 'function') {
          try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
        }
      } catch (_) {}

      try { if (typeof renderClientes === 'function') renderClientes(); } catch (_) {}
      try { alert('Cliente criado'); } catch (_) {}
    } catch (e) {
      try { alert(String(e && e.message ? e.message : e)); } catch (_) {}
    }
  }

  function ensureBtnNovoCliente() {
    try {
      if (typeof window.novoCliente !== 'function') window.novoCliente = abrirModalNovoCliente;
      if (typeof window._salvarNovoCliente !== 'function') window._salvarNovoCliente = salvarNovoCliente;

      var cand = [];
      try {
        var b0 = document.getElementById('btn-novo-cliente') || document.querySelector('[data-novo-cliente], .btn-novo-cliente');
        if (b0) cand.push(b0);
      } catch (_) {}
      try {
        cand = cand.concat(Array.prototype.slice.call(document.querySelectorAll('button, a')).filter(function(el) {
          if (!el) return false;
          if (el.dataset && el.dataset.patchNovoCliente === '1') return false;
          var txt = String(el.textContent || '').trim().toLowerCase();
          var oc = String(el.getAttribute && (el.getAttribute('onclick') || '') || '').toLowerCase();
          return el.id === 'btn-novo-cliente' || txt.indexOf('novo cliente') >= 0 || oc.indexOf('novocliente') >= 0 || oc.indexOf('novoCliente') >= 0;
        }));
      } catch (_) {}

      cand.forEach(function(btn) {
        try {
          if (!btn || (btn.dataset && btn.dataset.patchNovoCliente === '1')) return;
          btn.dataset.patchNovoCliente = '1';
          btn.onclick = function(e) {
            try { if (e && typeof e.preventDefault === 'function') e.preventDefault(); } catch (_) {}
            try { if (e && typeof e.stopPropagation === 'function') e.stopPropagation(); } catch (_) {}
            try { window.novoCliente(); } catch (_) { try { abrirModalNovoCliente(); } catch (_) {} }
          };
        } catch (_) {}
      });
    } catch (_) {}
  }

  window.abrirModalNovoCliente = abrirModalNovoCliente;
  window.salvarNovoCliente = salvarNovoCliente;

  async function _reloadClientes() {
    try {
      try { if (typeof _cliSituacao !== 'undefined') _cliSituacao = ''; } catch (_) {}
      try { if (typeof window._cliSituacao !== 'undefined') window._cliSituacao = ''; } catch (_) {}
      try { if (typeof _cliFiltro !== 'undefined') _cliFiltro = ''; } catch (_) {}
      try { if (typeof window._cliFiltro !== 'undefined') window._cliFiltro = ''; } catch (_) {}
      try { if (typeof _cliRamo !== 'undefined') _cliRamo = ''; } catch (_) {}
      try { if (typeof window._cliRamo !== 'undefined') window._cliRamo = ''; } catch (_) {}
      try { if (typeof _cliBusca !== 'undefined') _cliBusca = ''; } catch (_) {}
      try { if (typeof window._cliBusca !== 'undefined') window._cliBusca = ''; } catch (_) {}

      ['#cli-busca', '#cli-ramo', '#cli-sit', '#cli-emp-fil'].forEach(function(s) {
        try {
          var el = document.querySelector(s);
          if (!el) return;
          el.value = '';
          try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
          try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
        } catch (_) {}
      });

      if (typeof carregarClientes === 'function') {
        try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
      }

      await new Promise(function(r) { setTimeout(r, 800); });

      if (typeof renderClientes === 'function') {
        try { renderClientes(); } catch (_) {}
        try { console.log('[CLIENTES] lista recarregada após salvar'); } catch (_) {}
        return;
      }

      if (typeof carregarClientes === 'function') return;

      var links = document.querySelectorAll('a, [onclick]');
      for (var i = 0; i < links.length; i++) {
        var el2 = links[i];
        var oc = '';
        try { oc = el2.getAttribute('onclick') || ''; } catch (_) { oc = ''; }
        var txt = '';
        try { txt = String(el2.textContent || '').trim(); } catch (_) { txt = ''; }
        if (oc.indexOf('clientes') !== -1 || txt === 'Clientes') {
          try { if (typeof el2.click === 'function') el2.click(); } catch (_) {}
          return;
        }
      }
    } catch (e) {
      try { console.error('[RELOAD CLIENTES ERR]', e); } catch (_) {}
    }
  }

  function patchClickSalvar() {
    if (document.documentElement.dataset.patchClientesClickSalvar === '1') return;
    document.documentElement.dataset.patchClientesClickSalvar = '1';
    document.addEventListener('click', function(e) {
      try {
        var btn = e && e.target && e.target.closest ? e.target.closest('button') : null;
        if (!btn) return;
        var texto = String(btn.textContent || '').trim().toLowerCase();
        if (texto !== 'salvar') return;
        var modal = btn.closest ? btn.closest('.modal, [class*="modal"], .modal-overlay') : null;
        if (!modal) return;
        mapEstadoToUfInModal(modal);
      } catch (_) {}
    }, true);
  }

  function tick() {
    try { injectCss(); } catch (_) {}
    try { patchClickSalvar(); } catch (_) {}
    try { ensureBtnVerTodos(); } catch (_) {}
    try { ensureBtnMesclarClientes(); } catch (_) {}
    try { ensureBtnNovoCliente(); } catch (_) {}
    try { ensureClientesQuickFiltersNoTopo(); } catch (_) {}
    try { patchRenderClientesBadge(); } catch (_) {}
    try { _adicionarBadgeOfs(); } catch (_) {}
    try { patchSalvarAntiDuploClique(); } catch (_) {}
    try { patchFetchClientesAfterPost(); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 200);
      setInterval(tick, 2500);
    });
  } else {
    setTimeout(tick, 200);
    setInterval(tick, 2500);
  }
})();

(function _iniciarClientes() {
  async function run() {
    try {
      await new Promise(function(r) { setTimeout(r, 2000); });

      if (typeof carregarClientes === 'function') {
        try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
      }

      var total = 0;
      try { total = (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) ? CLIENTES.length : (Array.isArray(window.CLIENTES) ? window.CLIENTES.length : 0); } catch (_) { total = 0; }
      console.log('[PATCH CLIENTES TOTAL]', total);

      if (total > 0 && typeof renderClientes === 'function') {
        try { renderClientes(); } catch (_) {}
        return;
      }

      try {
        if (typeof EMP_FILTRO !== 'undefined' && EMP_FILTRO) {
          if (window.__EMP_FILTRO_ANT == null) window.__EMP_FILTRO_ANT = EMP_FILTRO;
          EMP_FILTRO = '';
        }
      } catch (_) {}

      if (typeof carregarClientes === 'function') {
        try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
      }

      try { total = (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) ? CLIENTES.length : 0; } catch (_) { total = 0; }
      if (total > 0) {
        try { if (typeof renderClientes === 'function') renderClientes(); } catch (_) {}
        return;
      }

      var token = '';
      try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
      var resp = await fetch('/api/clientes?limit=2000&order=created_at&dir=desc&t=' + Date.now(), { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var json = await resp.json().catch(function() { return null; });
      var arr = json && json.ok && Array.isArray(json.data) ? json.data : null;
      if (arr && arr.length) {
        var out = arr;
        try { if (typeof normalizeCli === 'function') out = arr.map(function(c) { return normalizeCli(c); }); } catch (_) {}
        try { CLIENTES = out; } catch (_) {}
        try { window._CLIENTES = out; } catch (_) {}
        try { window.CLIENTES = out; } catch (_) {}
        console.log('[PATCH CLIENTES FORÇADO]', out.length);
        if (typeof renderClientes === 'function') {
          try { renderClientes(); } catch (_) {}
        }
      }
    } catch (e) {
      try { console.error('[PATCH CLIENTES INIT]', e); } catch (_) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { run(); });
  else run();
})();

(function patchMenuEstoques() {
  function _adicionarMenuEstoques() {
    try {
      var grupo = document.querySelector('#ng-estoques .nav-group-items');
      if (!grupo) return;

      var ultimoEstoque = document.getElementById('menu-cliches') || document.getElementById('menu-facas') || document.getElementById('menu-estoque');
      if (!ultimoEstoque) return;

      var novos = [
        { icon: '🎨', label: 'Estoque de Tintas', tela: 'estoque-tintas' },
        { icon: '🔧', label: 'Estoque de Materiais', tela: 'estoque-materiais' },
        { icon: '📊', label: 'Dashboard Estoques', tela: 'estoque-dashboard' },
      ];

      novos.forEach(function(item) {
        try {
          if (document.querySelector('#ng-estoques .nav-item[onclick*="' + item.tela + '"]')) return;
          var el = ultimoEstoque.cloneNode(true);
          el.id = 'menu-' + item.tela;
          el.setAttribute('onclick', "go('" + item.tela + "');closeNavGroupsExcept('ng-estoques')");
          var ico = el.querySelector('span.ico') || el.querySelector('.ico') || el.querySelector('span');
          if (ico) ico.textContent = item.icon;
          var txt = el.childNodes;
          if (txt && txt.length) {
            for (var i = 0; i < txt.length; i++) {
              var n = txt[i];
              if (n && n.nodeType === 3) { n.textContent = item.label; break; }
            }
          }
          if (!el.textContent || el.textContent.trim().length < 3) el.textContent = item.label;
          grupo.insertBefore(el, ultimoEstoque.nextSibling);
          ultimoEstoque = el;
        } catch (_) {}
      });

      console.log('[PATCH] itens de estoque adicionados ao menu');
    } catch (_) {}
  }

  function init() {
    setTimeout(_adicionarMenuEstoques, 1500);
    try {
      var obs = new MutationObserver(function(_, observer) {
        try {
          var temEstoque = document.querySelector('#ng-estoques .nav-item[onclick*="estoque"]');
          var temNovos = document.querySelector('#ng-estoques .nav-item[onclick*="estoque-tintas"]');
          if (temEstoque && !temNovos) _adicionarMenuEstoques();
          temNovos = document.querySelector('#ng-estoques .nav-item[onclick*="estoque-tintas"]');
          if (temNovos) {
            try { observer.disconnect(); } catch (_) {}
            try { window._patchMenuEstoquesObs = null; } catch (_) {}
          }
        } catch (_) {}
      });
      window._patchMenuEstoquesObs = obs;
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

(function patchGoClientesEEstoques() {
  function authHeaders() {
    var token = '';
    try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function num(v) {
    var n = Number(v || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function getMainPatchHost(pageKey, title) {
    var main = document.querySelector('.content, #content, .content-wrapper, .main-area, #main-content, #page-content, body > div:last-child');
    if (!main) return null;

    var host = document.getElementById('patch-page-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'patch-page-host';
      host.className = 'page';
      host.style.cssText = 'display:none;flex:1;overflow-y:auto;padding:20px;background:var(--bg)';
      host.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px">' +
          '<h2 id="patch-page-title" style="margin:0;color:var(--text);font-size:18px"></h2>' +
        '</div>' +
        '<div id="patch-page-body"></div>';
      main.appendChild(host);
    }

    try {
      document.querySelectorAll('[id^="page-"]').forEach(function(el) {
        if (el !== host) el.style.display = 'none';
      });
    } catch (_) {}
    try { host.style.display = 'block'; } catch (_) {}
    try { document.getElementById('patch-page-title').textContent = title || ''; } catch (_) {}
    try { window._PAGE_ATUAL = pageKey; } catch (_) {}
    return document.getElementById('patch-page-body');
  }

  function hidePatchHost() {
    try {
      var host = document.getElementById('patch-page-host');
      if (host) host.style.display = 'none';
    } catch (_) {}
  }

  function runAfterGoEffects(page) {
    var p = String(page || '');
    if (p.toLowerCase() === 'dashboard') {
      setTimeout(function() {
        try { if (typeof window.renderProjecaoVendas === 'function') window.renderProjecaoVendas(); } catch (_) {}
      }, 400);
    }
    if (p === 'ofmaq' || p.indexOf('maq') >= 0) {
      [300, 600, 1000, 1500, 2000, 3000].forEach(function(delay) {
        setTimeout(function() {
          try {
            var headers = document.querySelectorAll('.maq-header');
            if (headers.length > 0) aplicarAccordion();
          } catch (_) {}
        }, delay);
      });
    }
    if (p === 'hub') {
      setTimeout(function() {
        try { window.carregarPassagensHoje(); } catch (_) {}
      }, 400);
    }
  }

  function safeAttr(v) {
    return esc(v).replace(/`/g, '&#96;');
  }

  function fechaModalById(id) {
    try {
      var el = document.getElementById(id);
      if (el) el.remove();
    } catch (_) {}
  }

  function _getInputVal(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function _getNumVal(id) {
    var n = Number(_getInputVal(id).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  function _getToken() {
    var token = '';
    try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
    return token;
  }

  function _fmtDateISO(v) {
    if (!v) return '';
    var s = String(v).trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var d = new Date(s);
    if (!Number.isFinite(d.getTime())) return '';
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return String(d.getFullYear()) + '-' + mm + '-' + dd;
  }

  function _statusBadgeHtml(status, vencendo) {
    var s = String(status || '');
    if (vencendo) return '<span class="badge badge-venc">Venc.</span>';
    if (s === 'zerado') return '<span class="badge badge-zerado">Zerado</span>';
    if (s === 'critico') return '<span class="badge badge-critico">Crítico</span>';
    if (s === 'baixo') return '<span class="badge badge-baixo">Baixo</span>';
    return '<span class="badge badge-ok">OK</span>';
  }

  function _calcStatus(qtd, minimo) {
    var q = num(qtd);
    var m = num(minimo);
    if (q <= 0) return 'zerado';
    if (m > 0 && q <= m * 0.5) return 'critico';
    if (m > 0 && q <= m) return 'baixo';
    return 'ok';
  }

  function _isVencendo(validade) {
    if (!validade) return false;
    var d = new Date(String(validade));
    if (!Number.isFinite(d.getTime())) return false;
    var hoje = new Date();
    var em30 = new Date(hoje.getTime() + 30 * 86400000);
    return d.getTime() >= hoje.getTime() && d.getTime() <= em30.getTime();
  }

  function _ensureEstoqueStyle() {
    if (document.getElementById('patch-estoques-style')) return;
    var st = document.createElement('style');
    st.id = 'patch-estoques-style';
    st.textContent =
      '.badge{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:800;white-space:nowrap}' +
      '.badge-ok{ background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid #10b981; }' +
      '.badge-baixo{ background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid #f59e0b; }' +
      '.badge-critico{ background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid #ef4444; }' +
      '.badge-zerado{ background: rgba(127,29,29,0.3); color: #fca5a5; border: 1px solid #ef4444; }' +
      '.badge-venc{ background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid #a855f7; }' +
      '.pcp-table{width:100%;border-collapse:collapse;font-size:13px}' +
      '.pcp-table th{color:var(--text2);text-align:left;padding:10px;border-bottom:2px solid var(--border);font-size:12px;letter-spacing:0.3px}' +
      '.pcp-table td{padding:10px;border-bottom:1px solid var(--border);color:var(--text)}' +
      '.pcp-table td.muted{color:var(--text2)}' +
      '.pcp-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}' +
      '.pcp-btn{display:inline-flex;align-items:center;gap:6px;border-radius:8px;padding:6px 10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);cursor:pointer;font-size:12px}' +
      '.pcp-btn.primary{background:var(--accent);border-color:transparent;color:#fff;font-weight:700}' +
      '.pcp-btn.danger{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.35);color:#ef4444;font-weight:800}' +
      '.pcp-input{padding:8px 10px;border-radius:10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-size:13px}' +
      '.pcp-select{padding:8px 10px;border-radius:10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-size:13px}';
    document.head.appendChild(st);
  }

  function _abrirModalNovaTinta(tintaExistente) {
    _ensureEstoqueStyle();
    fechaModalById('modal-nova-tinta');
    var t = tintaExistente || {};
    var titulo = t && t.id ? 'Editar Tinta' : 'Nova Tinta';
    var modal = document.createElement('div');
    modal.id = 'modal-nova-tinta';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML =
      '<div style="background:var(--card);border-radius:12px;padding:24px;width:100%;max-width:820px;max-height:92vh;overflow-y:auto;border:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px">' +
          '<h3 style="color:var(--text);font-size:16px;margin:0">🎨 ' + esc(titulo) + '</h3>' +
          '<button id="nt-fechar" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Nome *</label><input id="nt-nome" class="pcp-input" value="' + safeAttr(t.nome || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Código</label><input id="nt-codigo" class="pcp-input" value="' + safeAttr(t.codigo || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Pantone</label><input id="nt-pantone" class="pcp-input" value="' + safeAttr(t.pantone || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Cor</label>' +
            '<div style="display:flex;gap:8px;align-items:center;margin-top:4px">' +
              '<input id="nt-cor-picker" type="color" value="' + safeAttr((String(t.cor || '').match(/^#/) ? t.cor : '#000000')) + '" style="width:56px;height:38px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:4px">' +
              '<input id="nt-cor" class="pcp-input" value="' + safeAttr(t.cor || '') + '" style="flex:1">' +
            '</div>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Tipo</label>' +
            '<select id="nt-tipo" class="pcp-select" style="width:100%;margin-top:4px">' +
              '<option value="">Selecionar...</option>' +
              [
                { v: 'base_agua', l: 'Base Água' },
                { v: 'uv', l: 'UV' },
                { v: 'verniz', l: 'Verniz' },
                { v: 'outro', l: 'Outro' }
              ].map(function(o) { return '<option value="' + o.v + '"' + (String(t.tipo || '') === o.v ? ' selected' : '') + '>' + o.l + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Fabricante</label><input id="nt-fabricante" class="pcp-input" value="' + safeAttr(t.fabricante || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Fornecedor</label><input id="nt-fornecedor" class="pcp-input" value="' + safeAttr(t.fornecedor || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Lote</label><input id="nt-lote" class="pcp-input" value="' + safeAttr(t.lote || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Validade</label><input id="nt-validade" type="date" class="pcp-input" value="' + safeAttr(_fmtDateISO(t.validade || t.data_validade || '')) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Unidade</label>' +
            '<select id="nt-unidade" class="pcp-select" style="width:100%;margin-top:4px">' +
              ['kg', 'litro'].map(function(u) { return '<option value="' + u + '"' + (String(t.unidade || 'kg') === u ? ' selected' : '') + '>' + u + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Peso líquido</label><input id="nt-peso" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.peso_liquido != null ? t.peso_liquido : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade atual *</label><input id="nt-qtd" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.quantidade_atual != null ? t.quantidade_atual : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade mínima</label><input id="nt-qtd-min" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.quantidade_minima != null ? t.quantidade_minima : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade ideal</label><input id="nt-qtd-ideal" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.quantidade_ideal != null ? t.quantidade_ideal : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Custo unitário (R$)</label><input id="nt-custo" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.custo_unitario != null ? t.custo_unitario : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Localização</label><input id="nt-local" class="pcp-input" value="' + safeAttr(t.localizacao || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Observações</label><textarea id="nt-obs" class="pcp-input" style="width:100%;margin-top:4px;min-height:90px;resize:vertical">' + esc(t.observacoes || '') + '</textarea></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
          '<button id="nt-cancelar" class="pcp-btn">Cancelar</button>' +
          '<button id="nt-salvar" class="pcp-btn primary">💾 Salvar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    var corPicker = document.getElementById('nt-cor-picker');
    var corInput = document.getElementById('nt-cor');
    if (corPicker && corInput) {
      corPicker.oninput = function() { corInput.value = corPicker.value; };
      corInput.oninput = function() {
        var v = String(corInput.value || '').trim();
        if (/^#[0-9a-f]{6}$/i.test(v)) corPicker.value = v;
      };
    }
    document.getElementById('nt-fechar').onclick = function() { fechaModalById('modal-nova-tinta'); };
    document.getElementById('nt-cancelar').onclick = function() { fechaModalById('modal-nova-tinta'); };
    document.getElementById('nt-salvar').onclick = function() { window._salvarTinta(String(t.id || '')); };
  }

  function _abrirModalMovTinta(tinta) {
    _ensureEstoqueStyle();
    fechaModalById('modal-mov-tinta');
    var t = tinta || {};
    var modal = document.createElement('div');
    modal.id = 'modal-mov-tinta';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML =
      '<div style="background:var(--card);border-radius:12px;padding:24px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;border:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px">' +
          '<h3 style="color:var(--text);font-size:16px;margin:0">↕ Movimentar Tinta</h3>' +
          '<button id="mt-fechar" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="color:var(--text2);font-size:12px;margin-bottom:10px">Tinta</div>' +
        '<div style="font-weight:900;color:var(--text);margin-bottom:14px">' + esc(t.nome || '-') + '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label style="color:var(--text2);font-size:12px">Tipo *</label>' +
            '<select id="mt-tipo" class="pcp-select" style="width:100%;margin-top:4px">' +
              '<option value="entrada">Entrada ↓</option>' +
              '<option value="saida">Saída ↑</option>' +
              '<option value="ajuste">Ajuste</option>' +
              '<option value="perda">Perda</option>' +
              '<option value="inventario">Inventário</option>' +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade *</label><input id="mt-qtd" type="number" step="0.01" class="pcp-input" value="0" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Operador</label><input id="mt-operador" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Setor</label>' +
            '<select id="mt-setor" class="pcp-select" style="width:100%;margin-top:4px">' +
              ['Produção','Manutenção','Expedição','Limpeza','Outro'].map(function(s) { return '<option value="' + safeAttr(s) + '">' + esc(s) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Nº OF</label><input id="mt-of" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Custo unitário (R$)</label><input id="mt-custo" type="number" step="0.01" class="pcp-input" value="0" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Motivo</label><input id="mt-motivo" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Observações</label><textarea id="mt-obs" class="pcp-input" style="width:100%;margin-top:4px;min-height:80px;resize:vertical"></textarea></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
          '<button id="mt-cancelar" class="pcp-btn">Cancelar</button>' +
          '<button id="mt-confirmar" class="pcp-btn primary">Confirmar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('mt-fechar').onclick = function() { fechaModalById('modal-mov-tinta'); };
    document.getElementById('mt-cancelar').onclick = function() { fechaModalById('modal-mov-tinta'); };
    document.getElementById('mt-confirmar').onclick = function() { window._movimentarTinta(String(t.id || '')); };
  }

  async function _salvarTinta(id) {
    var payload = {
      nome: _getInputVal('nt-nome'),
      codigo: _getInputVal('nt-codigo'),
      cor: _getInputVal('nt-cor'),
      tipo: _getInputVal('nt-tipo'),
      pantone: _getInputVal('nt-pantone'),
      fabricante: _getInputVal('nt-fabricante'),
      fornecedor: _getInputVal('nt-fornecedor'),
      lote: _getInputVal('nt-lote'),
      validade: _getInputVal('nt-validade') || null,
      unidade: _getInputVal('nt-unidade') || 'kg',
      peso_liquido: _getNumVal('nt-peso'),
      quantidade_atual: _getNumVal('nt-qtd'),
      quantidade_minima: _getNumVal('nt-qtd-min'),
      quantidade_ideal: _getNumVal('nt-qtd-ideal'),
      custo_unitario: _getNumVal('nt-custo'),
      localizacao: _getInputVal('nt-local'),
      observacoes: (function() { var el = document.getElementById('nt-obs'); return el ? String(el.value || '') : ''; })(),
      ativo: true
    };
    if (!payload.nome) { alert('Nome é obrigatório'); return; }
    var token = _getToken();
    var method = id ? 'PATCH' : 'POST';
    var url = id ? ('/api/estoque_tintas/' + encodeURIComponent(id)) : '/api/estoque_tintas';
    var resp = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
      body: JSON.stringify(payload)
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && (json.ok || json.id)) {
      fechaModalById('modal-nova-tinta');
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueTintas(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  async function _excluirTinta(id) {
    if (!id) return;
    if (!confirm('Desativar esta tinta?')) return;
    var token = _getToken();
    var resp = await fetch('/api/estoque_tintas/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { 'Authorization': token ? ('Bearer ' + token) : '' }
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && (json.ok || json.data)) {
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueTintas(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  async function _movimentarTinta(id) {
    if (!id) return;
    var payload = {
      tipo: _getInputVal('mt-tipo'),
      quantidade: _getNumVal('mt-qtd'),
      operador: _getInputVal('mt-operador'),
      setor: _getInputVal('mt-setor'),
      of_numero: _getInputVal('mt-of'),
      motivo: _getInputVal('mt-motivo'),
      custo_unitario: _getNumVal('mt-custo'),
      observacoes: (function() { var el = document.getElementById('mt-obs'); return el ? String(el.value || '') : ''; })(),
    };
    if (!payload.tipo || payload.quantidade <= 0) { alert('Tipo e quantidade são obrigatórios'); return; }
    var token = _getToken();
    var resp = await fetch('/api/estoque_tintas/' + encodeURIComponent(id) + '/movimentar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
      body: JSON.stringify(payload)
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && json.ok) {
      fechaModalById('modal-mov-tinta');
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueTintas(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  function _abrirModalNovoMaterial(materialExistente) {
    _ensureEstoqueStyle();
    fechaModalById('modal-novo-material');
    var m = materialExistente || {};
    var titulo = m && m.id ? 'Editar Material' : 'Novo Material';
    var modal = document.createElement('div');
    modal.id = 'modal-novo-material';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML =
      '<div style="background:var(--card);border-radius:12px;padding:24px;width:100%;max-width:900px;max-height:92vh;overflow-y:auto;border:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px">' +
          '<h3 style="color:var(--text);font-size:16px;margin:0">🔩 ' + esc(titulo) + '</h3>' +
          '<button id="nm-fechar" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Nome *</label><input id="nm-nome" class="pcp-input" value="' + safeAttr(m.nome || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Código</label><input id="nm-codigo" class="pcp-input" value="' + safeAttr(m.codigo || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Categoria *</label>' +
            '<div style="display:flex;gap:8px;align-items:center;margin-top:4px">' +
              '<select id="nm-categoria" class="pcp-select" style="flex:1">' +
                ['Ferramentas','EPIs','Manutenção','Escritório','Limpeza','Produção','Expedição','Outro'].map(function(o) { return '<option value="' + safeAttr(o) + '"' + (String(m.categoria || '') === String(o) ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
              '</select>' +
              '<button id="nm-nova-cat" class="pcp-btn" type="button">Nova</button>' +
            '</div>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Subcategoria</label><input id="nm-subcategoria" class="pcp-input" value="' + safeAttr(m.subcategoria || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Marca</label><input id="nm-marca" class="pcp-input" value="' + safeAttr(m.marca || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Fornecedor</label><input id="nm-fornecedor" class="pcp-input" value="' + safeAttr(m.fornecedor || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Unidade</label>' +
            '<select id="nm-unidade" class="pcp-select" style="width:100%;margin-top:4px">' +
              ['un','kg','litro','metro','caixa','pacote','par','m²','m'].map(function(o) { return '<option value="' + safeAttr(o) + '"' + (String(m.unidade || 'un') === String(o) ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Código de barras</label><input id="nm-codbarras" class="pcp-input" value="' + safeAttr(m.codigo_barras || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Validade</label><input id="nm-validade" type="date" class="pcp-input" value="' + safeAttr(_fmtDateISO(m.validade || m.data_validade || '')) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Qtd atual *</label><input id="nm-qtd" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.quantidade_atual != null ? m.quantidade_atual : (m.quantidade != null ? m.quantidade : 0)) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Qtd mínima</label><input id="nm-qtd-min" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.quantidade_minima != null ? m.quantidade_minima : (m.estoque_minimo != null ? m.estoque_minimo : 0)) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Qtd ideal</label><input id="nm-qtd-ideal" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.quantidade_ideal != null ? m.quantidade_ideal : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Qtd máxima</label><input id="nm-qtd-max" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.quantidade_maxima != null ? m.quantidade_maxima : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Custo médio (R$)</label><input id="nm-custo-medio" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.custo_medio != null ? m.custo_medio : (m.custo_unitario != null ? m.custo_unitario : 0)) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Último custo (R$)</label><input id="nm-ultimo-custo" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.ultimo_custo != null ? m.ultimo_custo : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Corredor</label><input id="nm-loc-cor" class="pcp-input" value="' + safeAttr(m.localizacao_corredor || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Prateleira</label><input id="nm-loc-pra" class="pcp-input" value="' + safeAttr(m.localizacao_prateleira || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Caixa/Gaveta</label><input id="nm-loc-cai" class="pcp-input" value="' + safeAttr(m.localizacao_caixa || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Descrição</label><textarea id="nm-desc" class="pcp-input" style="width:100%;margin-top:4px;min-height:80px;resize:vertical">' + esc(m.descricao || '') + '</textarea></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Observações</label><textarea id="nm-obs" class="pcp-input" style="width:100%;margin-top:4px;min-height:80px;resize:vertical">' + esc(m.observacoes || '') + '</textarea></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
          '<button id="nm-cancelar" class="pcp-btn">Cancelar</button>' +
          '<button id="nm-salvar" class="pcp-btn primary">💾 Salvar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('nm-fechar').onclick = function() { fechaModalById('modal-novo-material'); };
    document.getElementById('nm-cancelar').onclick = function() { fechaModalById('modal-novo-material'); };
    document.getElementById('nm-salvar').onclick = function() { window._salvarMaterial(String(m.id || '')); };
    document.getElementById('nm-nova-cat').onclick = function() {
      var n = prompt('Nova categoria:');
      if (!n) return;
      n = String(n).trim();
      if (!n) return;
      var sel = document.getElementById('nm-categoria');
      if (!sel) return;
      var opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n;
      sel.appendChild(opt);
      sel.value = n;
    };
  }

  function _abrirModalMovMaterial(material) {
    _ensureEstoqueStyle();
    fechaModalById('modal-mov-material');
    var m = material || {};
    var modal = document.createElement('div');
    modal.id = 'modal-mov-material';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML =
      '<div style="background:var(--card);border-radius:12px;padding:24px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;border:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px">' +
          '<h3 style="color:var(--text);font-size:16px;margin:0">↕ Movimentar Material</h3>' +
          '<button id="mm-fechar" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="color:var(--text2);font-size:12px;margin-bottom:10px">Material</div>' +
        '<div style="font-weight:900;color:var(--text);margin-bottom:14px">' + esc(m.nome || '-') + '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label style="color:var(--text2);font-size:12px">Tipo *</label>' +
            '<select id="mm-tipo" class="pcp-select" style="width:100%;margin-top:4px">' +
              '<option value="entrada">Entrada ↓</option>' +
              '<option value="saida">Saída ↑</option>' +
              '<option value="ajuste">Ajuste</option>' +
              '<option value="perda">Perda</option>' +
              '<option value="inventario">Inventário</option>' +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade *</label><input id="mm-qtd" type="number" step="0.01" class="pcp-input" value="0" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Operador</label><input id="mm-operador" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Setor</label>' +
            '<select id="mm-setor" class="pcp-select" style="width:100%;margin-top:4px">' +
              ['Produção','Manutenção','Expedição','Limpeza','Outro'].map(function(s) { return '<option value="' + safeAttr(s) + '">' + esc(s) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Custo unitário (R$)</label><input id="mm-custo" type="number" step="0.01" class="pcp-input" value="0" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Motivo</label><input id="mm-motivo" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Observações</label><textarea id="mm-obs" class="pcp-input" style="width:100%;margin-top:4px;min-height:80px;resize:vertical"></textarea></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
          '<button id="mm-cancelar" class="pcp-btn">Cancelar</button>' +
          '<button id="mm-confirmar" class="pcp-btn primary">Confirmar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('mm-fechar').onclick = function() { fechaModalById('modal-mov-material'); };
    document.getElementById('mm-cancelar').onclick = function() { fechaModalById('modal-mov-material'); };
    document.getElementById('mm-confirmar').onclick = function() { window._movimentarMaterial(String(m.id || '')); };
  }

  async function _salvarMaterial(id) {
    var payload = {
      nome: _getInputVal('nm-nome'),
      codigo: _getInputVal('nm-codigo'),
      categoria: _getInputVal('nm-categoria'),
      subcategoria: _getInputVal('nm-subcategoria'),
      marca: _getInputVal('nm-marca'),
      fornecedor: _getInputVal('nm-fornecedor'),
      unidade: _getInputVal('nm-unidade'),
      codigo_barras: _getInputVal('nm-codbarras'),
      validade: _getInputVal('nm-validade') || null,
      quantidade_atual: _getNumVal('nm-qtd'),
      quantidade_minima: _getNumVal('nm-qtd-min'),
      quantidade_ideal: _getNumVal('nm-qtd-ideal'),
      quantidade_maxima: _getNumVal('nm-qtd-max'),
      custo_medio: _getNumVal('nm-custo-medio'),
      ultimo_custo: _getNumVal('nm-ultimo-custo'),
      localizacao_corredor: _getInputVal('nm-loc-cor'),
      localizacao_prateleira: _getInputVal('nm-loc-pra'),
      localizacao_caixa: _getInputVal('nm-loc-cai'),
      descricao: (function() { var el = document.getElementById('nm-desc'); return el ? String(el.value || '') : ''; })(),
      observacoes: (function() { var el = document.getElementById('nm-obs'); return el ? String(el.value || '') : ''; })(),
      ativo: true
    };
    if (!payload.nome) { alert('Nome é obrigatório'); return; }
    if (!payload.categoria) { alert('Categoria é obrigatória'); return; }
    var token = _getToken();
    var method = id ? 'PATCH' : 'POST';
    var url = id ? ('/api/estoque_materiais/' + encodeURIComponent(id)) : '/api/estoque_materiais';
    var resp = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
      body: JSON.stringify(payload)
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && (json.ok || json.id)) {
      fechaModalById('modal-novo-material');
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueMateriais(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  async function _excluirMaterial(id) {
    if (!id) return;
    if (!confirm('Desativar este material?')) return;
    var token = _getToken();
    var resp = await fetch('/api/estoque_materiais/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { 'Authorization': token ? ('Bearer ' + token) : '' }
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && (json.ok || json.data)) {
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueMateriais(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  async function _movimentarMaterial(id) {
    if (!id) return;
    var payload = {
      tipo: _getInputVal('mm-tipo'),
      quantidade: _getNumVal('mm-qtd'),
      operador: _getInputVal('mm-operador'),
      setor: _getInputVal('mm-setor'),
      motivo: _getInputVal('mm-motivo'),
      custo_unitario: _getNumVal('mm-custo'),
      observacoes: (function() { var el = document.getElementById('mm-obs'); return el ? String(el.value || '') : ''; })(),
    };
    if (!payload.tipo || payload.quantidade <= 0) { alert('Tipo e quantidade são obrigatórios'); return; }
    var token = _getToken();
    var resp = await fetch('/api/estoque_materiais/' + encodeURIComponent(id) + '/movimentar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
      body: JSON.stringify(payload)
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && json.ok) {
      fechaModalById('modal-mov-material');
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueMateriais(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  window._abrirModalNovaTinta = _abrirModalNovaTinta;
  window._salvarTinta = _salvarTinta;
  window._movimentarTinta = _movimentarTinta;
  window._abrirModalMovTinta = _abrirModalMovTinta;
  window._excluirTinta = _excluirTinta;
  window._abrirModalNovoMaterial = _abrirModalNovoMaterial;
  window._salvarMaterial = _salvarMaterial;
  window._movimentarMaterial = _movimentarMaterial;
  window._abrirModalMovMaterial = _abrirModalMovMaterial;
  window._excluirMaterial = _excluirMaterial;

  function _renderEstoqueTintas(main) {
    main = main || getMainPatchHost('estoque-tintas', '🎨 Estoque de Tintas');
    if (!main) return;
    _ensureEstoqueStyle();
    main.innerHTML =
      '<div id="patch-tintas">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' +
          '<button class="pcp-btn primary" id="btn-nova-tinta" type="button">+ Nova Tinta</button>' +
          '<input id="patch-tintas-q" class="pcp-input" placeholder="🔍 buscar..." style="min-width:220px;flex:1" />' +
          '<select id="patch-tintas-filtro" class="pcp-select" style="min-width:220px">' +
            '<option value="">Todos</option>' +
            '<option value="critico">Crítico</option>' +
            '<option value="baixo">Alerta</option>' +
            '<option value="ok">OK</option>' +
            '<option value="vencendo">Vencendo</option>' +
          '</select>' +
        '</div>' +
        '<div id="patch-tintas-body" style="color:var(--text2);padding:20px">Carregando...</div>' +
      '</div>';

    var inputQ = document.getElementById('patch-tintas-q');
    var selF = document.getElementById('patch-tintas-filtro');
    var body = document.getElementById('patch-tintas-body');
    document.getElementById('btn-nova-tinta').onclick = function() { window._abrirModalNovaTinta(null); };

    function renderRows(list) {
      var q = String(inputQ && inputQ.value || '').trim().toLowerCase();
      var f = String(selF && selF.value || '').trim();
      var rows = (Array.isArray(list) ? list : []).map(function(t) {
        var qtd = num(t && t.quantidade_atual);
        var min = num(t && t.quantidade_minima);
        var st = _calcStatus(qtd, min);
        var venc = _isVencendo(t && (t.validade || t.data_validade));
        return { raw: t, qtd: qtd, min: min, st: st, venc: venc };
      }).filter(function(x) {
        if (f === 'vencendo') return x.venc;
        if (f && x.st !== f) return false;
        if (!q) return true;
        var t = x.raw || {};
        var blob = [
          t.nome, t.codigo, t.pantone, t.tipo, t.fabricante, t.fornecedor, t.lote
        ].map(function(v) { return String(v || '').toLowerCase(); }).join(' ');
        return blob.indexOf(q) >= 0;
      });

      window.__ESTOQUE_TINTAS_CACHE = rows.map(function(x) { return x.raw; });
      window.__ESTOQUE_TINTAS_BYID = Object.create(null);
      rows.forEach(function(x) { var id = String(x.raw && x.raw.id || '').trim(); if (id) window.__ESTOQUE_TINTAS_BYID[id] = x.raw; });

      if (!rows.length) {
        body.innerHTML = '<div style="color:var(--text2);padding:40px;text-align:center">Nenhuma tinta encontrada</div>';
        return;
      }

      body.innerHTML =
        '<table class="pcp-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Nome</th>' +
              '<th>Cor</th>' +
              '<th>Tipo</th>' +
              '<th>Fabricante</th>' +
              '<th style="text-align:center">Qtd Atual</th>' +
              '<th style="text-align:center">Unidade</th>' +
              '<th style="text-align:center">Mínimo</th>' +
              '<th style="text-align:center">Status</th>' +
              '<th style="text-align:center">Validade</th>' +
              '<th style="text-align:right">Ações</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            rows.map(function(x) {
              var t = x.raw || {};
              var id = String(t.id || '');
              var validade = t.validade || t.data_validade || '';
              return '<tr>' +
                '<td>' + esc(t.nome || '-') + '</td>' +
                '<td class="muted">' + esc(t.cor || '-') + '</td>' +
                '<td class="muted">' + esc(t.tipo || '-') + '</td>' +
                '<td class="muted">' + esc(t.fabricante || t.fornecedor || '-') + '</td>' +
                '<td style="text-align:center;font-weight:900;color:' + (x.st === 'zerado' || x.st === 'critico' ? '#ef4444' : 'var(--text)') + '">' + esc(String(x.qtd)) + '</td>' +
                '<td style="text-align:center" class="muted">' + esc(t.unidade || '-') + '</td>' +
                '<td style="text-align:center" class="muted">' + esc(String(x.min)) + '</td>' +
                '<td style="text-align:center">' + _statusBadgeHtml(x.st, x.venc) + '</td>' +
                '<td style="text-align:center" class="muted">' + esc(validade ? _fmtDateISO(validade).split('-').reverse().join('/') : '-') + '</td>' +
                '<td style="text-align:right">' +
                  '<div class="pcp-actions">' +
                    '<button class="pcp-btn" type="button" onclick="window._abrirModalMovTinta(window.__ESTOQUE_TINTAS_BYID[\'' + safeAttr(id) + '\'])">Movimentar ↕</button>' +
                    '<button class="pcp-btn" type="button" onclick="window._abrirModalNovaTinta(window.__ESTOQUE_TINTAS_BYID[\'' + safeAttr(id) + '\'])">Editar ✏</button>' +
                    '<button class="pcp-btn danger" type="button" onclick="window._excluirTinta(\'' + safeAttr(id) + '\')">Excluir 🗑</button>' +
                  '</div>' +
                '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>';
    }

    function wireFilters(list) {
      if (inputQ) inputQ.oninput = function() { renderRows(list); };
      if (selF) selF.onchange = function() { renderRows(list); };
      renderRows(list);
    }

    fetch('/api/estoque_tintas', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        var data = res && (res.data || res) || [];
        if (!Array.isArray(data)) data = [];
        wireFilters(data);
      })
      .catch(function(e) {
        body.innerHTML = '<div style="color:#f75a5a;padding:20px">Erro: ' + esc(e && e.message || e) + '</div>';
      });
  }

  function _renderEstoqueMateriais(main) {
    main = main || getMainPatchHost('estoque-materiais', '🔧 Estoque de Materiais');
    if (!main) return;
    _ensureEstoqueStyle();
    main.innerHTML =
      '<div id="patch-materiais">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' +
          '<button class="pcp-btn primary" id="btn-novo-material" type="button">+ Novo Material</button>' +
          '<input id="patch-mat-q" class="pcp-input" placeholder="🔍 buscar..." style="min-width:220px;flex:1" />' +
          '<select id="patch-mat-cat" class="pcp-select" style="min-width:220px"><option value="">Todas categorias</option></select>' +
          '<select id="patch-mat-filtro" class="pcp-select" style="min-width:180px">' +
            '<option value="">Todos</option>' +
            '<option value="critico">Crítico</option>' +
            '<option value="baixo">Alerta</option>' +
            '<option value="ok">OK</option>' +
            '<option value="vencendo">Vencendo</option>' +
          '</select>' +
        '</div>' +
        '<div id="patch-materiais-body" style="color:var(--text2);padding:20px">Carregando...</div>' +
      '</div>';

    var inputQ = document.getElementById('patch-mat-q');
    var selCat = document.getElementById('patch-mat-cat');
    var selF = document.getElementById('patch-mat-filtro');
    var body = document.getElementById('patch-materiais-body');
    document.getElementById('btn-novo-material').onclick = function() { window._abrirModalNovoMaterial(null); };

    function renderList(list) {
      var q = String(inputQ && inputQ.value || '').trim().toLowerCase();
      var cat = String(selCat && selCat.value || '').trim();
      var f = String(selF && selF.value || '').trim();

      var rows = (Array.isArray(list) ? list : []).map(function(m) {
        var qtd = num(m && (m.quantidade_atual != null ? m.quantidade_atual : m.quantidade));
        var min = num(m && (m.quantidade_minima != null ? m.quantidade_minima : m.estoque_minimo));
        var st = _calcStatus(qtd, min);
        var venc = _isVencendo(m && (m.validade || m.data_validade));
        var categoria = String((m && (m.categoria || '')) || 'Sem categoria').trim() || 'Sem categoria';
        var loc = [m.localizacao_corredor, m.localizacao_prateleira, m.localizacao_caixa].filter(Boolean).join('-') || (m.localizacao || '');
        return { raw: m, qtd: qtd, min: min, st: st, venc: venc, categoria: categoria, loc: loc };
      }).filter(function(x) {
        if (cat && x.categoria !== cat) return false;
        if (f === 'vencendo') return x.venc;
        if (f && x.st !== f) return false;
        if (!q) return true;
        var m = x.raw || {};
        var blob = [
          m.codigo, m.nome, m.marca, m.categoria, m.subcategoria, m.fornecedor, m.codigo_barras
        ].map(function(v) { return String(v || '').toLowerCase(); }).join(' ');
        return blob.indexOf(q) >= 0;
      });

      window.__ESTOQUE_MATERIAIS_CACHE = rows.map(function(x) { return x.raw; });
      window.__ESTOQUE_MATERIAIS_BYID = Object.create(null);
      rows.forEach(function(x) { var id = String(x.raw && x.raw.id || '').trim(); if (id) window.__ESTOQUE_MATERIAIS_BYID[id] = x.raw; });

      if (!rows.length) {
        body.innerHTML = '<div style="color:var(--text2);padding:40px;text-align:center">Nenhum material encontrado</div>';
        return;
      }

      var grupos = {};
      rows.forEach(function(x) {
        if (!grupos[x.categoria]) grupos[x.categoria] = [];
        grupos[x.categoria].push(x);
      });
      var cats = Object.keys(grupos).sort(function(a, b) { return a.localeCompare(b); });

      body.innerHTML =
        cats.map(function(categoria) {
          var items = grupos[categoria] || [];
          return '<details open style="margin-bottom:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 12px">' +
            '<summary style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--text);font-weight:900">' +
              '<span>' + esc(categoria) + '</span>' +
              '<span style="color:var(--text2);font-weight:800;font-size:12px">' + esc(String(items.length)) + ' itens</span>' +
            '</summary>' +
            '<div style="margin-top:10px;overflow:auto">' +
              '<table class="pcp-table">' +
                '<thead>' +
                  '<tr>' +
                    '<th>Código</th>' +
                    '<th>Nome</th>' +
                    '<th>Marca</th>' +
                    '<th style="text-align:center">Qtd Atual</th>' +
                    '<th style="text-align:center">Unidade</th>' +
                    '<th style="text-align:center">Mínimo</th>' +
                    '<th>Localização</th>' +
                    '<th style="text-align:center">Status</th>' +
                    '<th style="text-align:right">Ações</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' +
                  items.map(function(x) {
                    var m = x.raw || {};
                    var id = String(m.id || '');
                    return '<tr>' +
                      '<td class="muted">' + esc(m.codigo || '-') + '</td>' +
                      '<td>' + esc(m.nome || '-') + '</td>' +
                      '<td class="muted">' + esc(m.marca || '-') + '</td>' +
                      '<td style="text-align:center;font-weight:900;color:' + (x.st === 'zerado' || x.st === 'critico' ? '#ef4444' : 'var(--text)') + '">' + esc(String(x.qtd)) + '</td>' +
                      '<td style="text-align:center" class="muted">' + esc(m.unidade || '-') + '</td>' +
                      '<td style="text-align:center" class="muted">' + esc(String(x.min)) + '</td>' +
                      '<td class="muted">' + esc(x.loc || '-') + '</td>' +
                      '<td style="text-align:center">' + _statusBadgeHtml(x.st, x.venc) + '</td>' +
                      '<td style="text-align:right">' +
                        '<div class="pcp-actions">' +
                          '<button class="pcp-btn" type="button" onclick="window._abrirModalMovMaterial(window.__ESTOQUE_MATERIAIS_BYID[\'' + safeAttr(id) + '\'])">Movimentar ↕</button>' +
                          '<button class="pcp-btn" type="button" onclick="window._abrirModalNovoMaterial(window.__ESTOQUE_MATERIAIS_BYID[\'' + safeAttr(id) + '\'])">Editar ✏</button>' +
                          '<button class="pcp-btn danger" type="button" onclick="window._excluirMaterial(\'' + safeAttr(id) + '\')">Excluir 🗑</button>' +
                        '</div>' +
                      '</td>' +
                    '</tr>';
                  }).join('') +
                '</tbody>' +
              '</table>' +
            '</div>' +
          '</details>';
        }).join('');
    }

    function fillCategorias(list) {
      var set = {};
      (Array.isArray(list) ? list : []).forEach(function(m) {
        var c = String(m && m.categoria || '').trim();
        if (!c) return;
        set[c] = 1;
      });
      var cats = Object.keys(set).sort(function(a, b) { return a.localeCompare(b); });
      if (selCat) {
        cats.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          selCat.appendChild(opt);
        });
      }
    }

    function wire(list) {
      fillCategorias(list);
      if (inputQ) inputQ.oninput = function() { renderList(list); };
      if (selCat) selCat.onchange = function() { renderList(list); };
      if (selF) selF.onchange = function() { renderList(list); };
      renderList(list);
    }

    fetch('/api/estoque_materiais', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        var data = res && (res.data || res) || [];
        if (!Array.isArray(data)) data = [];
        wire(data);
      })
      .catch(function(e) {
        body.innerHTML = '<div style="color:#f75a5a;padding:20px">Erro: ' + esc(e && e.message || e) + '</div>';
      });
  }

  function _renderDashboardEstoques(main) {
    main = main || getMainPatchHost('estoque-dashboard', '📊 Dashboard Estoques');
    if (!main) return;
    _ensureEstoqueStyle();
    main.innerHTML =
      '<div id="patch-dashboard-estoques">' +
        '<div id="patch-dashboard-body" style="color:var(--text2);padding:20px">Carregando...</div>' +
      '</div>';

    function fmtBRL(v) {
      var n = Number(v || 0) || 0;
      try { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); } catch (_) { return 'R$ ' + String(n.toFixed(2)); }
    }

    function ensureChartJs() {
      return new Promise(function(resolve) {
        try {
          if (window.Chart) return resolve(true);
          if (typeof window.ensureChartJsLoaded === 'function') {
            Promise.resolve(window.ensureChartJsLoaded()).then(function(ok) { resolve(!!ok); }).catch(function() { resolve(false); });
            return;
          }
        } catch (_) {}
        try {
          var s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
          s.onload = function() { resolve(!!window.Chart); };
          s.onerror = function() { resolve(false); };
          document.head.appendChild(s);
        } catch (_) { resolve(false); }
      });
    }

    fetch('/api/estoque_dashboard', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        var container = document.getElementById('patch-dashboard-body');
        if (!container) return;
        if (!res || res.ok === false) throw new Error((res && res.error) || 'Falha ao carregar dashboard');

        var cards = res.cards || {};
        var valores = res.valores || {};
        var alertas = Array.isArray(res.alertas) ? res.alertas : [];
        var movs = Array.isArray(res.movimentos) ? res.movimentos : [];
        var tintas = res.tintas || {};
        var materiais = res.materiais || {};
        var chapas = res.chapas || {};

        container.innerHTML =
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-bottom:14px">' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
              '<div style="color:var(--text2);font-size:12px">💰 Valor Total em Estoque</div>' +
              '<div style="color:var(--text);font-size:22px;font-weight:1000;margin-top:4px">' + esc(fmtBRL(cards.valor_total || 0)) + '</div>' +
            '</div>' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
              '<div style="color:var(--text2);font-size:12px">⚠️ Itens Críticos</div>' +
              '<div style="color:var(--text);font-size:22px;font-weight:1000;margin-top:4px">' + esc(String(cards.itens_criticos || 0)) + '</div>' +
            '</div>' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
              '<div style="color:var(--text2);font-size:12px">🕒 Vencendo em 30 dias</div>' +
              '<div style="color:var(--text);font-size:22px;font-weight:1000;margin-top:4px">' + esc(String(cards.vencendo_30d || 0)) + '</div>' +
            '</div>' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
              '<div style="color:var(--text2);font-size:12px">📦 Total de Itens</div>' +
              '<div style="color:var(--text);font-size:22px;font-weight:1000;margin-top:4px">' + esc(String(cards.total_itens || 0)) + '</div>' +
            '</div>' +
          '</div>' +

          '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;margin-bottom:14px">' +
            '<div style="font-weight:950;color:var(--text);margin-bottom:10px">🚨 Alertas Ativos</div>' +
            (alertas.length ? (
              '<div style="display:flex;flex-direction:column;gap:8px">' +
                alertas.slice(0, 40).map(function(a) {
                  var badge = _statusBadgeHtml(a.status, a.vencendo);
                  var un = a.unidade ? (' ' + String(a.unidade)) : '';
                  return '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px;background:rgba(0,0,0,0.10)">' +
                    '<div style="min-width:0">' +
                      '<div style="color:var(--text);font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(a.categoria || '-') + ' · ' + esc(a.nome || '-') + '</div>' +
                      '<div style="color:var(--text2);font-size:12px;margin-top:2px">' +
                        esc(String(a.quantidade_atual || 0) + un) + ' (mín: ' + esc(String(a.quantidade_minima || 0)) + ')' +
                      '</div>' +
                    '</div>' +
                    '<div>' + badge + '</div>' +
                  '</div>';
                }).join('') +
              '</div>'
            ) : '<div style="color:var(--text2);padding:8px 0">✅ Todos os estoques em ordem</div>') +
          '</div>' +

          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-bottom:14px">' +
            [
              { nome: 'Tintas', icon: '🎨', d: tintas, cor: '#4f8ef7' },
              { nome: 'Chapas', icon: '📦', d: chapas, cor: '#22c55e' },
              { nome: 'Materiais', icon: '🔩', d: materiais, cor: '#f59e0b' }
            ].map(function(c) {
              var d = c.d || {};
              return '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;border-left:4px solid ' + c.cor + '">' +
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
                  '<div style="font-size:22px">' + c.icon + '</div>' +
                  '<div style="font-weight:950;color:var(--text)">' + esc(c.nome) + '</div>' +
                  '<div style="margin-left:auto;color:var(--text2);font-size:12px">' + esc(String(d.total || 0)) + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
                  '<span class="badge badge-critico">Críticos: ' + esc(String(d.critico || d.criticos || 0)) + '</span>' +
                  '<span class="badge badge-baixo">Alertas: ' + esc(String(d.alerta || d.alertas || 0)) + '</span>' +
                  '<span class="badge badge-ok">OK: ' + esc(String(d.ok || 0)) + '</span>' +
                  '<span class="badge badge-venc">Venc.: ' + esc(String(d.vencendo || 0)) + '</span>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px">' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px">' +
                '<div style="font-weight:950;color:var(--text)">Distribuição do valor em estoque</div>' +
                '<div style="color:var(--text2);font-size:12px">' + esc(fmtBRL((valores.tintas || 0) + (valores.materiais || 0) + (valores.chapas || 0))) + '</div>' +
              '</div>' +
              '<div style="height:220px;position:relative"><canvas id="patch-estoque-donut" style="width:100%;height:100%"></canvas></div>' +
            '</div>' +
          '</div>' +

          '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
            '<div style="font-weight:950;color:var(--text);margin-bottom:10px">Movimentações recentes</div>' +
            (movs.length ? (
              '<table class="pcp-table">' +
                '<thead><tr>' +
                  '<th>Data/Hora</th><th>Tipo</th><th>Item</th><th style="text-align:center">Qtd</th><th>Operador</th><th>Setor</th>' +
                '</tr></thead>' +
                '<tbody>' +
                  movs.slice(0, 10).map(function(m) {
                    var dt = String(m.created_at || '');
                    var d = dt ? new Date(dt) : null;
                    var show = d && Number.isFinite(d.getTime()) ? (String(d.toLocaleDateString('pt-BR')) + ' ' + String(d.toLocaleTimeString('pt-BR')).slice(0, 5)) : '-';
                    var item = m.item || m.nome || m.material_nome || m.tinta_nome || '';
                    var cat = m.categoria || '';
                    return '<tr>' +
                      '<td class="muted">' + esc(show) + '</td>' +
                      '<td class="muted">' + esc(String(m.tipo || '-')) + '</td>' +
                      '<td>' + esc((cat ? (cat + ' · ') : '') + (item || String(m.material_id || m.tinta_id || '-'))) + '</td>' +
                      '<td style="text-align:center;font-weight:900">' + esc(String(m.quantidade || 0)) + '</td>' +
                      '<td class="muted">' + esc(String(m.operador || '-')) + '</td>' +
                      '<td class="muted">' + esc(String(m.setor || '-')) + '</td>' +
                    '</tr>';
                  }).join('') +
                '</tbody>' +
              '</table>'
            ) : '<div style="color:var(--text2);padding:8px 0">Nenhuma movimentação recente</div>') +
          '</div>';

        ensureChartJs().then(function(ok) {
          if (!ok || !window.Chart) return;
          var canvas = document.getElementById('patch-estoque-donut');
          if (!canvas) return;
          try { if (window._patchEstoqueDonut && typeof window._patchEstoqueDonut.destroy === 'function') window._patchEstoqueDonut.destroy(); } catch (_) {}
          var ctx = canvas.getContext('2d');
          var labels = ['Tintas', 'Chapas', 'Materiais', 'Outros'];
          var data = [num(valores.tintas), num(valores.chapas), num(valores.materiais), num(valores.outros)];
          window._patchEstoqueDonut = new window.Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: labels,
              datasets: [{
                data: data,
                backgroundColor: ['#4f8ef7', '#22c55e', '#f59e0b', '#94a3b8'],
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } }
            }
          });
        });
      })
      .catch(function(e) {
        var c = document.getElementById('patch-dashboard-body');
        if (c) c.innerHTML = '<div style="padding:20px;color:#f75a5a">Erro ao carregar dashboard: ' + esc(e && e.message || e) + '</div>';
      });
  }

  function patchGo() {
    var orig = window.go;
    if (typeof orig !== 'function' || orig._patchClientesEstoquesCustom) return;
    var wrapped = async function(tela) {
      var page = String(tela || '');
      if (page === 'estoque-tintas') {
        var hostTintas = getMainPatchHost('estoque-tintas', '🎨 Estoque de Tintas');
        _renderEstoqueTintas(hostTintas);
        return;
      }
      if (page === 'estoque-materiais') {
        var hostMateriais = getMainPatchHost('estoque-materiais', '🔧 Estoque de Materiais');
        _renderEstoqueMateriais(hostMateriais);
        return;
      }
      if (page === 'estoque-dashboard') {
        var hostDash = getMainPatchHost('estoque-dashboard', '📊 Dashboard Estoques');
        _renderDashboardEstoques(hostDash);
        return;
      }
      hidePatchHost();
      var r = orig.apply(this, arguments);
      if (page === 'clientes') {
        setTimeout(function() {
          try { _resetFiltrosClientes(); } catch (_) {}
          try { _carregarTodosClientes(); } catch (_) {}
          try { window._clientesCarregados = false; } catch (_) {}
          try {
            if (typeof carregarClientes === 'function') {
              Promise.resolve(carregarClientes(true)).catch(function() { try { return carregarClientes(); } catch (_) {} });
            }
          } catch (_) {}
          try { if (typeof renderClientes === 'function') setTimeout(renderClientes, 120); } catch (_) {}
          try {
            var w = document.querySelector('#page-clientes #widget-analise-clientes');
            if (w) w.style.display = 'none';
          } catch (_) {}
          try {
            var grid = document.getElementById('cli-grid') || document.querySelector('#page-clientes #cli-grid');
            if (grid) grid.style.display = '';
            var lista = document.getElementById('clientes-lista') || document.querySelector('#page-clientes #clientes-lista');
            if (lista) lista.style.display = '';
          } catch (_) {}
        }, 400);
      }
      runAfterGoEffects(page);
      return r;
    };
    wrapped._patchClientesEstoquesCustom = true;
    window.go = wrapped;
  }

  function init() {
    patchGo();
    setTimeout(patchGo, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

(function patchDashboardEstoques() {
  function cleanupAnalisesHost() {
    try {
      var host = document.getElementById('patch-estoque-dashboard');
      if (host && host.parentNode && host.parentNode.id === 'dash-body') host.remove();
    } catch (_) {}
  }

  cleanupAnalisesHost();
  function startCleanupAnalisesHost() {
    cleanupAnalisesHost();
    if (window.__cleanupAnalisesHostInterval) return;
    window.__cleanupAnalisesHostInterval = setInterval(function() {
      cleanupAnalisesHost();
    }, 1200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { startCleanupAnalisesHost(); });
  } else {
    startCleanupAnalisesHost();
  }
  return;

  function authHeaders() {
    var token = '';
    try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function ensureHost() {
    var dashBody = document.getElementById('dash-body');
    if (!dashBody) return null;
    var host = document.getElementById('patch-estoque-dashboard');
    if (!host) {
      host = document.createElement('div');
      host.id = 'patch-estoque-dashboard';
      host.style.marginBottom = '16px';
      try { dashBody.prepend(host); } catch (_) { dashBody.appendChild(host); }
    }
    return host;
  }

  function num(v) {
    var n = Number(v || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderDashboardEstoques(container) {
    if (!container) return;
    if (container.dataset.loading === '1') return;
    container.dataset.loading = '1';
    container.innerHTML = '<div style="padding:20px;color:var(--text2)">Carregando...</div>';

    fetch('/api/estoque_dashboard', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res || res.ok === false) throw new Error((res && res.error) || 'Falha ao carregar dashboard');
        var tintas = res.tintas || { total: 0, criticos: 0, alertas: 0, ok: 0 };
        var chapas = res.chapas || { total: 0, criticos: 0, alertas: 0, ok: 0 };
        var cards = [
          { nome: 'Tintas', icon: '🎨', total: num(tintas.total), criticos: num(tintas.criticos), alertas: num(tintas.alertas), ok: num(tintas.ok), cor: '#f7923a' },
          { nome: 'Chapas', icon: '📦', total: num(chapas.total), criticos: num(chapas.criticos), alertas: num(chapas.alertas), ok: num(chapas.ok), cor: '#4f8ef7' }
        ];
        var tintasCriticas = (Array.isArray(res.tintas_data) ? res.tintas_data : []).filter(function(t) {
          return num(t && t.quantidade_atual) <= num(t && t.quantidade_minima);
        });
        container.innerHTML =
          '<div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">' +
            cards.map(function(c) {
              return '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;border-left:4px solid ' + c.cor + '">' +
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
                  '<span style="font-size:24px">' + c.icon + '</span>' +
                  '<div>' +
                    '<div style="font-weight:700;font-size:16px">' + esc(c.nome) + '</div>' +
                    '<div style="color:var(--text2);font-size:13px">' + esc(String(c.total)) + ' itens cadastrados</div>' +
                  '</div>' +
                '</div>' +
                '<div style="display:flex;gap:12px">' +
                  '<div style="flex:1;text-align:center;padding:10px;background:rgba(247,90,90,0.1);border-radius:8px">' +
                    '<div style="font-size:22px;font-weight:700;color:#f75a5a">' + esc(String(c.criticos)) + '</div>' +
                    '<div style="font-size:11px;color:var(--text2)">Críticos</div>' +
                  '</div>' +
                  '<div style="flex:1;text-align:center;padding:10px;background:rgba(247,146,58,0.1);border-radius:8px">' +
                    '<div style="font-size:22px;font-weight:700;color:#f7923a">' + esc(String(c.alertas)) + '</div>' +
                    '<div style="font-size:11px;color:var(--text2)">Alertas</div>' +
                  '</div>' +
                  '<div style="flex:1;text-align:center;padding:10px;background:rgba(62,207,142,0.1);border-radius:8px">' +
                    '<div style="font-size:22px;font-weight:700;color:#3ecf8e">' + esc(String(c.ok)) + '</div>' +
                    '<div style="font-size:11px;color:var(--text2)">OK</div>' +
                  '</div>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
          (tintasCriticas.length
            ? '<div style="padding:0 16px 16px">' +
                '<div style="font-weight:600;margin-bottom:10px;color:var(--text)">🚨 Tintas em nível crítico</div>' +
                '<table style="width:100%;border-collapse:collapse">' +
                  '<thead><tr style="color:var(--text2);font-size:12px">' +
                    '<th style="text-align:left;padding:8px">Nome</th>' +
                    '<th style="text-align:center;padding:8px">Atual</th>' +
                    '<th style="text-align:center;padding:8px">Mínimo</th>' +
                    '<th style="text-align:center;padding:8px">Unidade</th>' +
                  '</tr></thead>' +
                  '<tbody>' +
                    tintasCriticas.map(function(t) {
                      return '<tr style="border-top:1px solid var(--border)">' +
                        '<td style="padding:8px;font-size:13px">' + esc(t && t.nome || '') + '</td>' +
                        '<td style="padding:8px;text-align:center;color:#f75a5a;font-weight:600">' + esc(String(num(t && t.quantidade_atual))) + '</td>' +
                        '<td style="padding:8px;text-align:center;color:var(--text2)">' + esc(String(num(t && t.quantidade_minima))) + '</td>' +
                        '<td style="padding:8px;text-align:center;color:var(--text2)">' + esc(t && t.unidade || '-') + '</td>' +
                      '</tr>';
                    }).join('') +
                  '</tbody>' +
                '</table>' +
              '</div>'
            : '');
      })
      .catch(function(e) {
        container.innerHTML = '<div style="padding:20px;color:#f75a5a">Erro ao carregar dashboard: ' + esc(e && e.message || e) + '</div>';
      })
      .finally(function() {
        delete container.dataset.loading;
      });
  }

  function tryRender() {
    try {
      var page = document.getElementById('page-dashboard');
      if (!page || page.offsetParent === null) return;
      var host = ensureHost();
      if (!host) return;
      renderDashboardEstoques(host);
    } catch (_) {}
  }

  function patchRenderDashboard() {
    var orig = window.renderDashboard;
    if (typeof orig !== 'function' || orig._patchDashboardEstoques) return;
    var wrapped = function() {
      var r = orig.apply(this, arguments);
      setTimeout(tryRender, 100);
      return r;
    };
    wrapped._patchDashboardEstoques = true;
    window.renderDashboard = wrapped;
  }

  var obs = new MutationObserver(function(_, observer) {
    try { patchRenderDashboard(); } catch (_) {}
    try { tryRender(); } catch (_) {}
    try {
      var host = document.getElementById('patch-estoque-dashboard');
      if (host && window.renderDashboard && window.renderDashboard._patchDashboardEstoques) {
        observer.disconnect();
      }
    } catch (_) {}
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      try { patchRenderDashboard(); } catch (_) {}
      try { obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] }); } catch (_) {}
      setTimeout(tryRender, 1200);
    });
  } else {
    try { patchRenderDashboard(); } catch (_) {}
    try { obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] }); } catch (_) {}
    setTimeout(tryRender, 1200);
  }
})();

window._mbnActive = function(id) {
  document.querySelectorAll('.mbn-item').forEach(function(el) {
    var on = el.id === id;
    el.classList.toggle('ativo', on);
    el.classList.toggle('active', on);
  });
};

(function initMobilePCP() {
  return;
  if (typeof isMobile !== 'function' || !isMobile()) return;

  function fmtData(str) {
    if (!str) return '';
    var p = String(str).split(/[-\/]/);
    if (p.length === 3) {
      if (p[0].length === 4) return p[2] + '/' + p[1] + '/' + p[0];
      return p[0] + '/' + p[1] + '/' + p[2];
    }
    return str;
  }

  function statusEntrega(dataStr) {
    if (!dataStr) return 'ok';
    var p = String(dataStr).split(/[-\/]/);
    var d = p[0].length === 4
      ? new Date(p[0], p[1]-1, p[2])
      : new Date(p[2], p[1]-1, p[0]);
    if (isNaN(d.getTime())) return 'ok';
    var hoje = new Date(); hoje.setHours(0,0,0,0);
    var diff = Math.floor((d - hoje) / 86400000);
    if (diff < 0)  return 'atrasada';
    if (diff <= 3) return 'urgente';
    return 'ok';
  }

  function lerDadosTR(tr) {
    var tds = tr.querySelectorAll('td');
    function txt(i) {
      return tds[i] ? (tds[i].textContent || '').trim() : '';
    }
    var imgEl = tr.querySelector('img');
    return {
      id:       tr.dataset.id || tr.dataset.ofId || tr.id || '',
      num:      txt(0) || txt(1),
      cliente:  txt(2) || txt(3),
      vendedor: txt(4) || txt(5),
      qtd:      txt(5) || txt(6),
      vlUnit:   txt(6) || txt(7),
      total:    txt(7) || txt(8),
      entrega:  txt(3) || txt(4),
      processo: txt(8) || txt(9),
      img:      imgEl ? (imgEl.src || imgEl.dataset.src || '') : ''
    };
  }

  function buildCardHTML(d) {
    var se = statusEntrega(d.entrega);
    var badgeClass = se === 'atrasada' ? 'atrasado' : se === 'urgente' ? 'urgente' : 'ok';
    var badgeLabel = se === 'atrasada' ? 'Atrasado' : se === 'urgente' ? 'Urgente' : 'OK';
    var borda = se === 'atrasada' ? ' atrasado-card' : se === 'urgente' ? ' urgente-card' : '';
    var imgHTML = d.img
      ? '<img class="mob-of-img-thumb" src="' + d.img +
        '" onclick="_mobVerImagem(\'' + d.img + '\')" onerror="this.style.display=\'none\'">'
      : '';
    var btnA = d.id ? 'onclick="_mobAlterar(\'' + d.id + '\')"' : '';
    var btnC = d.id ? 'onclick="_mobCancelar(\'' + d.id + '\')"' : '';
    return (
      '<div class="mob-of-card' + borda + '" data-of-id="' + d.id + '">' +
        '<div class="mob-of-card-top">' +
          '<span class="mob-of-num">OF ' + (d.num||'—') + '</span>' +
          '<span class="mob-of-badge ' + badgeClass + '">' + badgeLabel + '</span>' +
        '</div>' +
        '<div class="mob-of-cliente">' + (d.cliente||'—') + '</div>' +
        '<div class="mob-of-row">' +
          (d.vendedor ? '<span class="mob-of-meta">' + d.vendedor + '</span>' : '') +
          (d.qtd      ? '<span class="mob-of-meta">' + d.qtd + ' un</span>' : '') +
        '</div>' +
        (d.entrega
          ? '<div class="mob-of-entrega ' + se + '">Entrega: ' + fmtData(d.entrega) + '</div>'
          : '') +
        '<div class="mob-of-valores">' +
          (d.total  ? '<span class="mob-of-total">'    + d.total  + '</span>' : '') +
          (d.vlUnit ? '<span class="mob-of-unitario">un: ' + d.vlUnit + '</span>' : '') +
        '</div>' +
        (d.processo ? '<div class="mob-of-processo">' + d.processo + '</div>' : '') +
        '<div class="mob-of-bottom">' +
          imgHTML +
          '<div class="mob-of-actions">' +
            '<button class="mob-of-btn alterar"  ' + btnA + '>Alterar</button>' +
            '<button class="mob-of-btn cancelar" ' + btnC + '>Cancelar</button>' +
            '<button class="mob-of-btn rapida" ' +
              'onclick="if(typeof abrirOFRapida===\'function\')abrirOFRapida()">⚡ Rápida</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderCards() {
    var page = document.getElementById('page-pcp');
    if (!page) return;
    var old = document.getElementById('mob-of-cards-container');
    if (old) old.remove();
    var table = page.querySelector('table');
    if (!table) return;
    var rows = table.querySelectorAll('tbody tr');
    if (!rows.length) return;
    var container = document.createElement('div');
    container.className = 'mob-of-cards';
    container.id = 'mob-of-cards-container';
    rows.forEach(function(tr) {
      if (tr.style.display === 'none') return;
      container.innerHTML += buildCardHTML(lerDadosTR(tr));
    });
    table.style.cssText = 'display:none!important';
    table.parentNode.insertBefore(container, table);
  }

  function watchPCP() {
    var page = document.getElementById('page-pcp');
    if (!page) return;
    var obs = new MutationObserver(function(mutations, observer) {
      mutations.forEach(function(m) {
        if (m.type !== 'attributes') return;
        var vis = page.style.display !== 'none' &&
                  !page.classList.contains('hidden');
        if (vis) {
          setTimeout(renderCards, 350);
          try { observer.disconnect(); } catch (_) {}
        }
      });
    });
    obs.observe(page, { attributes: true, attributeFilter: ['style','class'] });
  }

  window._mobAlterar = function(id) {
    if (typeof alterarOf === 'function') return alterarOf(id);
    if (typeof editarOf  === 'function') return editarOf(id);
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (tr) { var b = tr.querySelector('button[onclick*="alterar"],button[onclick*="editar"]'); if(b) b.click(); }
  };

  window._mobCancelar = function(id) {
    if (typeof cancelarOf === 'function') return cancelarOf(id);
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (tr) { var b = tr.querySelector('button[onclick*="cancelar"]'); if(b) b.click(); }
  };

  window._mobVerImagem = function(src) {
    var o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);' +
      'z-index:9999;display:flex;align-items:center;justify-content:center;';
    o.onclick = function() { o.remove(); };
    var img = document.createElement('img');
    try {
      if (Array.isArray(src)) src = src[0];
    } catch (_) {}
    var s = '';
    try { s = String(src == null ? '' : src).trim(); } catch (_) { s = ''; }
    if (!s || s === '[]' || s === 'null' || s === 'undefined' || s === '[object Object]') s = '';
    img.src = s;
    img.onerror = function() { try { this.style.display = 'none'; } catch (_) {} };
    img.style.cssText = 'max-width:95vw;max-height:90vh;border-radius:10px;';
    o.appendChild(img);
    document.body.appendChild(o);
  };

  function init() {
    renderCards();
    watchPCP();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { setTimeout(init, 500); }
})();

(function initMobileSearch() {
  return;
  return;

  function buildSearchUI() {
    if (document.getElementById('mob-search-overlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'mob-search-overlay';
    overlay.className = 'mob-search-overlay';
    overlay.innerHTML =
      '<div class="mob-search-header">' +
        '<input class="mob-search-input" id="mob-search-input" type="search" ' +
          'placeholder="Buscar OF, cliente, produto..." ' +
          'oninput="_mobSearch(this.value)">' +
        '<button class="mob-search-close" ' +
          'onclick="_toggleMobSearch(false)">✕</button>' +
      '</div>' +
      '<div class="mob-search-results" id="mob-search-results">' +
        '<p style="color:#475569;font-size:13px;padding:20px 0;text-align:center">' +
          'Digite para buscar...' +
        '</p>' +
      '</div>';
    document.body.appendChild(overlay);

    var startY = 0;
    overlay.addEventListener('touchstart', function(e) {
      startY = e.touches[0].clientY;
    }, { passive: true });
    overlay.addEventListener('touchmove', function(e) {
      if (e.touches[0].clientY - startY > 80) _toggleMobSearch(false);
    }, { passive: true });
  }

  window._toggleMobSearch = function(forceState) {
    var o = document.getElementById('mob-search-overlay');
    if (!o) { buildSearchUI(); o = document.getElementById('mob-search-overlay'); }
    var open = typeof forceState === 'boolean'
      ? forceState : !o.classList.contains('open');
    o.classList.toggle('open', open);
    if (open) setTimeout(function() {
      var inp = document.getElementById('mob-search-input');
      if (inp) { inp.focus(); inp.value = ''; _mobSearch(''); }
    }, 100);
  };

  window._mobSearch = function(termo) {
    var res = document.getElementById('mob-search-results');
    if (!res) return;
    if (!termo || termo.length < 2) {
      res.innerHTML = '<p style="color:#475569;font-size:13px;' +
        'padding:20px 0;text-align:center">Digite para buscar...</p>';
      return;
    }
    var t = termo.toLowerCase();
    var resultados = [];

    document.querySelectorAll('#page-pcp table tbody tr')
      .forEach(function(tr) {
        if ((tr.textContent || '').toLowerCase().indexOf(t) === -1) return;
        var tds = tr.querySelectorAll('td');
        function c(i){ return tds[i] ? tds[i].textContent.trim() : ''; }
        resultados.push({
          tipo: 'OF',
          titulo: 'OF ' + c(0) + ' — ' + c(2),
          sub:    c(4) + ' | Entrega: ' + c(3),
          id:     tr.dataset.id || tr.dataset.ofId || ''
        });
      });

    (window._DRAWER_MODULOS || []).forEach(function(m) {
      if (m.label.toLowerCase().indexOf(t) !== -1)
        resultados.push({ tipo:'Módulo', titulo: m.label, sub:'', page: m.page });
    });

    if (!resultados.length) {
      res.innerHTML = '<p style="color:#475569;font-size:13px;' +
        'padding:20px 0;text-align:center">Sem resultados para "' + termo + '"</p>';
      return;
    }

    res.innerHTML = resultados.slice(0, 30).map(function(r) {
      var oc = r.page
        ? 'onclick="_toggleMobSearch(false);if(typeof go===\'function\')go(\'' + r.page + '\')"'
        : r.id
          ? 'onclick="_toggleMobSearch(false);_mobAlterar(\'' + r.id + '\')"'
          : '';
      return '<div class="mob-search-item" ' + oc + '>' +
        '<div class="mob-search-item-title">' + r.titulo + '</div>' +
        (r.sub ? '<div class="mob-search-item-sub">' + r.sub + '</div>' : '') +
        '</div>';
    }).join('');
  };

  function addSearchIcon() {
    var topbar = document.querySelector(
      '.topbar,#topbar,.top-bar,#top-bar');
    if (!topbar || document.getElementById('mob-search-icon')) return;
    var btn = document.createElement('button');
    btn.id = 'mob-search-icon';
    btn.onclick = function() { _toggleMobSearch(); };
    btn.style.cssText = 'background:none;border:none;cursor:pointer;' +
      'padding:8px;color:#94a3b8;display:flex;align-items:center;' +
      'flex-shrink:0;';
    btn.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
        'stroke-linejoin="round">' +
        '<circle cx="11" cy="11" r="8"/>' +
        '<line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
      '</svg>';
    topbar.appendChild(btn);
  }

  function init() { buildSearchUI(); addSearchIcon(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

(function patchOfmaqAndHubIntelligence() {
  var originalSortByPriority = (typeof window.ordenarOFsPorPrioridade === 'function')
    ? window.ordenarOFsPorPrioridade
    : null;
  var originalRenderOfmaq = (typeof window.renderOFsPorMaquina === 'function')
    ? window.renderOFsPorMaquina
    : null;
  var originalCardOfmaq = (typeof window.cardOFMaquina === 'function')
    ? window.cardOFMaquina
    : null;
  function escHLocal(s) {
    try {
      return window.escH
        ? window.escH(s)
        : String(s == null ? '' : s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
    } catch (_) {
      return String(s == null ? '' : s);
    }
  }

  function escAttrLocal(s) {
    return escHLocal(s).replace(/`/g, '&#96;');
  }

  function getToken() {
    try {
      return String(
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        window._token ||
        ''
      );
    } catch (_) {
      return String(window._token || '');
    }
  }

  function getAuthHeader() {
    var token = getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  async function apiJson(url, opts) {
    var cfg = opts || {};
    if (typeof window.apiFetch === 'function') {
      var resp1 = await window.apiFetch(url, cfg);
      var data1 = await resp1.json().catch(function() { return null; });
      return { resp: resp1, data: data1 };
    }
    var headers = Object.assign({}, getAuthHeader(), cfg.headers || {});
    if (cfg.body && typeof cfg.body !== 'string' && !(cfg.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      cfg.body = JSON.stringify(cfg.body);
    }
    var resp = await fetch(url, Object.assign({}, cfg, { headers: headers }));
    var data = await resp.json().catch(function() { return null; });
    return { resp: resp, data: data };
  }

  function fmtDateBR(iso) {
    var s = String(iso || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '—';
    try {
      if (typeof window.fmtD === 'function') return window.fmtD(s);
    } catch (_) {}
    return s.split('-').reverse().join('/');
  }

  function fmtWeekdayDate(iso) {
    var s = String(iso || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return fmtDateBR(s);
    try {
      return new Date(s + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch (_) {
      return fmtDateBR(s);
    }
  }

  function ensureStyles() {
    if (document.getElementById('patch-ofmaq-hub-intelligence-style')) return;
    var st = document.createElement('style');
    st.id = 'patch-ofmaq-hub-intelligence-style';
    st.textContent = ''
      + '.patch-ofmaq-toolbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
      + '.patch-ofmaq-badges{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px}'
      + '.patch-ofmaq-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800;line-height:1.2;border:1px solid transparent}'
      + '.patch-ofmaq-chip.green{background:rgba(16,185,129,0.14);border-color:rgba(16,185,129,0.32);color:#34d399}'
      + '.patch-ofmaq-chip.yellow{background:rgba(245,158,11,0.14);border-color:rgba(245,158,11,0.35);color:#fbbf24}'
      + '.patch-ofmaq-chip.red{background:rgba(239,68,68,0.14);border-color:rgba(239,68,68,0.35);color:#fca5a5}'
      + '.patch-ofmaq-chip.darkred{background:rgba(127,17,17,0.45);border-color:rgba(239,68,68,0.45);color:#fecaca}'
      + '.patch-ofmaq-calendar-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:999px;background:rgba(74,144,217,0.18);color:#93c5fd;cursor:pointer;font-size:15px}'
      + '.patch-ofmaq-calendar-btn:hover{filter:brightness(1.12)}'
      + '.patch-ofmaq-setup-sep{margin:10px 0 6px;padding:7px 10px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);font-size:12px;font-weight:800;color:var(--text1)}'
      + '.patch-ofmaq-setup-subsep{margin:6px 0 4px;padding:6px 10px 6px 14px;border-left:3px solid rgba(74,144,217,0.6);background:rgba(74,144,217,0.06);border-radius:6px;font-size:11px;font-weight:700;color:var(--text2)}'
      + '.patch-ofmaq-economia{font-size:12px;color:#22c55e;font-weight:800;margin-top:4px}'
      + '#patch-ofmaq-reag-modal{position:fixed;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:10020;padding:16px}'
      + '#patch-ofmaq-reag-modal .patch-reag-card{width:min(460px,96vw);background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:18px 18px 16px;box-shadow:0 20px 60px rgba(0,0,0,0.38)}'
      + '#patch-ofmaq-reag-modal .patch-reag-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}'
      + '#patch-ofmaq-reag-modal .patch-reag-actions button{padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text1);cursor:pointer;font-size:13px}'
      + '#patch-ofmaq-reag-modal .patch-reag-actions button.primary{background:var(--accent);border-color:var(--accent);color:#fff}'
      + '#hub-inteligencia .patch-hub-intel-item{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;margin-bottom:8px;border-radius:8px;cursor:pointer;transition:filter 0.15s}'
      + '#hub-inteligencia .patch-hub-intel-item:hover{filter:brightness(1.12)}';
    document.head.appendChild(st);
  }

  function normalizeText(s) {
    var v = String(s || '').trim().toLowerCase();
    try { v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return v;
  }

  function parseDateOnly(v) {
    var s = String(v || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var d = new Date(s + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function addBusinessDays(base, days) {
    var d = new Date(base.getTime());
    var remaining = Math.max(0, Math.trunc(Number(days || 0) || 0));
    while (remaining > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) remaining -= 1;
    }
    return d;
  }

  function nextBusinessDate(offset) {
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    return addBusinessDays(start, offset || 1).toISOString().slice(0, 10);
  }

  function businessDaysDelta(dataEntrega) {
    var entrega = parseDateOnly(dataEntrega);
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (!entrega) return null;
    if (entrega.getTime() === hoje.getTime()) return 0;
    var forward = entrega > hoje;
    var from = forward ? new Date(hoje.getTime()) : new Date(entrega.getTime());
    var to = forward ? entrega : hoje;
    var count = 0;
    while (from < to) {
      from.setDate(from.getDate() + 1);
      if (from.getDay() !== 0 && from.getDay() !== 6) count += 1;
    }
    return forward ? count : -count;
  }

  window.diasUteisRestantes = function(dataEntrega) {
    var diff = businessDaysDelta(dataEntrega);
    return diff == null ? 0 : diff;
  };

  function getOfDelivery(of) {
    return String(of && (of.data_entrega || of.ent || of.dataEntrega) || '').slice(0, 10);
  }

  function isUrgente(of) {
    return !!(of && (
      of.urgente === true || of.urgente === 1 || of.urgente === '1' ||
      of.urg === true || of.urg === 1 || of.urg === '1'
    ));
  }

  function sortOfsByPriorityLocal(ofs) {
    return (Array.isArray(ofs) ? ofs.slice() : []).sort(function(a, b) {
      var ua = isUrgente(a);
      var ub = isUrgente(b);
      if (ua !== ub) return ua ? -1 : 1;
      var da = getOfDelivery(a) || '9999-99-99';
      var db = getOfDelivery(b) || '9999-99-99';
      if (da !== db) return da.localeCompare(db);
      var ca = String(a && (a.created_at || a.updated_at || '') || '');
      var cb = String(b && (b.created_at || b.updated_at || '') || '');
      if (ca !== cb) return ca.localeCompare(cb);
      return String(a && (a.numero || a.of || '') || '').localeCompare(String(b && (b.numero || b.of || '') || ''));
    });
  }

  function getVisibleGroups() {
    var groups = window._ofmaqLastGroupOfs;
    return (groups && typeof groups === 'object') ? groups : {};
  }

  function getCurrentOfById(id) {
    var sid = String(id || '').trim();
    if (!sid) return null;
    var groups = getVisibleGroups();
    var keys = Object.keys(groups || {});
    for (var i = 0; i < keys.length; i += 1) {
      var list = Array.isArray(groups[keys[i]]) ? groups[keys[i]] : [];
      for (var j = 0; j < list.length; j += 1) {
        if (String(list[j] && list[j].id || '').trim() === sid) return list[j];
      }
    }
    var raw = Array.isArray(window.OFS) ? window.OFS : (Array.isArray(window._ofmaqBaseList) ? window._ofmaqBaseList : []);
    for (var k = 0; k < raw.length; k += 1) {
      if (String(raw[k] && raw[k].id || '').trim() === sid) return raw[k];
    }
    return null;
  }

  function getMachineListEl(maquina) {
    var mk = String(maquina || '').trim();
    if (!mk) return null;
    var all = Array.prototype.slice.call(document.querySelectorAll('.maq-body[data-maquina-id], .maq-ofs[data-maquina-id], [data-maquina-lista="1"][data-maquina-id]'));
    return all.find(function(el) {
      return String(el && (el.getAttribute('data-maquina-id') || el.getAttribute('data-maquina') || '') || '').trim() === mk;
    }) || null;
  }

  function ensureOfmaqToolbarButtons() {
    var toolbar = document.querySelector('#page-ofmaq .ptoolbar');
    if (!toolbar) return;
    var anchor = document.getElementById('ofmaq-btn-todas-ofs') || toolbar.lastElementChild;
    var wrap = document.getElementById('patch-ofmaq-toolbar-actions');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'patch-ofmaq-toolbar-actions';
      wrap.className = 'patch-ofmaq-toolbar-actions';
      if (anchor && anchor.parentNode === toolbar) toolbar.insertBefore(wrap, anchor);
      else toolbar.appendChild(wrap);
    }
    if (!document.getElementById('patch-btn-prioridade')) {
      var btnOrd = document.createElement('button');
      btnOrd.id = 'patch-btn-prioridade';
      btnOrd.setAttribute('onclick', 'ordenarOFsPorPrioridade()');
      btnOrd.style.cssText = 'padding:7px 14px;border-radius:6px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px';
      btnOrd.textContent = '🎯 Ordenar por Prioridade';
      wrap.appendChild(btnOrd);
    }
    if (!document.getElementById('btn-agrupar-setup')) {
      var btnAgr = document.createElement('button');
      btnAgr.id = 'btn-agrupar-setup';
      btnAgr.setAttribute('onclick', 'toggleAgrupamentoSetup()');
      btnAgr.style.cssText = 'padding:7px 14px;border-radius:6px;background:var(--bg2);color:var(--text1);border:1px solid var(--border);cursor:pointer;font-size:13px';
      btnAgr.textContent = '🎨 Agrupar Setup';
      wrap.appendChild(btnAgr);
    }
    updateAgrupamentoButton();
  }

  function updateAgrupamentoButton() {
    var btn = document.getElementById('btn-agrupar-setup');
    if (!btn) return;
    var ativo = !!window._agrupamentoSetupAtivo;
    btn.style.background = ativo ? 'var(--accent)' : 'var(--bg2)';
    btn.style.color = ativo ? '#fff' : 'var(--text1)';
    btn.textContent = ativo ? '🎨 Agrupado por Setup ✓' : '🎨 Agrupar Setup';
  }

  function getBadgeForDays(diff) {
    if (diff == null) return null;
    if (diff < 0) return { cls: 'darkred', text: 'ATRASADA ' + Math.abs(diff) + ' dia' + (Math.abs(diff) > 1 ? 's' : '') };
    if (diff <= 1) return { cls: 'red', text: 'URGENTE! ' + diff + ' dia' + (diff === 1 ? ' útil' : 's úteis') };
    if (diff <= 4) return { cls: 'yellow', text: diff + ' dias úteis ⚠️' };
    return { cls: 'green', text: diff + ' dias úteis' };
  }

  function getCardContentEl(card) {
    if (!card) return null;
    var content = card.querySelector('.patch-ofmaq-card-main');
    if (content) return content;
    if (card.children && card.children[1] && card.children[1].tagName === 'DIV') return card.children[1];
    return card.querySelector('div') || card;
  }

  function buildSuggestionMap() {
    var groups = getVisibleGroups();
    var out = {};
    Object.keys(groups || {}).forEach(function(maquina) {
      var ofs = Array.isArray(groups[maquina]) ? groups[maquina] : [];
      if (!ofs.length || maquina === 'Sem Máquina') return;
      var maqDados = null;
      var cap = null;
      try { maqDados = typeof window.getDadosMaquina === 'function' ? window.getDadosMaquina(maquina) : null; } catch (_) {}
      try { cap = typeof window.calcularCapacidadeMaquina === 'function' ? window.calcularCapacidadeMaquina(maqDados, ofs) : null; } catch (_) {}
      var pct = Number(cap && (cap.pct != null ? cap.pct : cap.ocupacaoPct) || 0) || 0;
      var minTotal = Number(cap && (cap.minTotal != null ? cap.minTotal : cap.totalMin) || 0) || 0;
      var minOcupados = Number(cap && (cap.minOcupados != null ? cap.minOcupados : cap.minutos_ocupados) || 0) || 0;
      var overloaded = pct > 90 || (minTotal > 0 && minOcupados > (minTotal * 0.9));
      if (!overloaded) return;
      ofs.forEach(function(of) {
        var dias = businessDaysDelta(getOfDelivery(of));
        if (dias != null && dias >= 3) {
          out[String(of && of.id || '')] = {
            maquina: maquina,
            dias: dias,
            capacidade: cap || null,
          };
        }
      });
    });
    window._ofmaqOverloadMap = out;
  }

  function decorateOfmaqCards() {
    buildSuggestionMap();
    Array.prototype.slice.call(document.querySelectorAll('#ofs-por-maquina-container .of-card-maquina[data-of-id], #ofs-por-maquina-container .of-card[data-of-id]')).forEach(function(card) {
      if (!card) return;
      var id = String(card.getAttribute('data-of-id') || '').trim();
      var of = getCurrentOfById(id);
      if (!of) return;
      var content = getCardContentEl(card);
      if (!content) return;
      var existing = content.querySelector('.patch-ofmaq-badges');
      if (existing) existing.remove();
      var diff = businessDaysDelta(getOfDelivery(of));
      var badge = getBadgeForDays(diff);
      if (!badge && !window._ofmaqOverloadMap[id]) return;
      var wrap = document.createElement('div');
      wrap.className = 'patch-ofmaq-badges';
      if (badge) {
        var badgeEl = document.createElement('span');
        badgeEl.className = 'patch-ofmaq-chip ' + badge.cls;
        badgeEl.textContent = badge.text;
        wrap.appendChild(badgeEl);
      }
      if (window._ofmaqOverloadMap[id]) {
        var btn = document.createElement('button');
        btn.className = 'patch-ofmaq-calendar-btn';
        btn.type = 'button';
        btn.title = 'Sugestão de reagendamento';
        btn.textContent = '📅';
        btn.onclick = function(ev) {
          try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
          window.mostrarSugestaoReagendamento(id, window._ofmaqOverloadMap[id].maquina);
        };
        wrap.appendChild(btn);
      }
      content.insertBefore(wrap, content.firstChild);
    });
  }

  function parseColors(of) {
    var raw = of && (of.cores_impressao != null ? of.cores_impressao : of.impressao_cor);
    var arr = [];
    try {
      if (Array.isArray(raw)) {
        arr = raw.map(function(x) { return String(x && (x.nome || x.name || x) || '').trim(); });
      } else if (raw && typeof raw === 'object') {
        arr = Object.values(raw).map(function(x) { return String(x && (x.nome || x.name || x) || '').trim(); });
      } else if (typeof raw === 'string') {
        var s = raw.trim();
        if (s.charAt(0) === '[') {
          var parsed = JSON.parse(s || '[]');
          if (Array.isArray(parsed)) arr = parsed.map(function(x) { return String(x && (x.nome || x.name || x) || '').trim(); });
        } else {
          arr = s.split(/[,+;|/]+/g).map(function(x) { return String(x || '').trim(); });
        }
      }
    } catch (_) {
      arr = [];
    }
    arr = arr.filter(Boolean);
    return arr.length ? arr : ['Sem cor'];
  }

  function parseDimensions(of) {
    var candidates = [
      of && of.medidas,
      of && of.medida,
      of && of.tamanho,
      of && of.dimensao,
      of && of.dimensoes,
      of && of.obs,
      of && of.observacao,
      of && of.descricao,
      of && of.prodDesc,
      of && of.produto
    ];
    var largura = Number(of && (of.largura || of.larg)) || 0;
    var comprimento = Number(of && (of.comprimento || of.compr || of.altura)) || 0;
    if (largura > 0 && comprimento > 0) return { largura: largura, comprimento: comprimento };
    for (var i = 0; i < candidates.length; i += 1) {
      var s = String(candidates[i] || '');
      var m = s.match(/(\d{2,4})\s*[x×]\s*(\d{2,4})/i);
      if (m) {
        return { largura: Number(m[1]) || 0, comprimento: Number(m[2]) || 0 };
      }
    }
    return { largura: 0, comprimento: 0 };
  }

  function buildSizeLabel(dim) {
    var largura = Number(dim && dim.largura || 0) || 0;
    var comprimento = Number(dim && dim.comprimento || 0) || 0;
    if (largura > 0 && comprimento > 0) return '~' + largura + '×' + comprimento + 'mm';
    return 'sem medida definida';
  }

  function buildSetupGroups(ofs) {
    var source = Array.isArray(ofs) ? ofs.slice() : [];
    var colorBuckets = {};
    source.forEach(function(of) {
      var colorKey = parseColors(of).join(' + ');
      if (!colorBuckets[colorKey]) colorBuckets[colorKey] = [];
      colorBuckets[colorKey].push(of);
    });
    var colorKeys = Object.keys(colorBuckets).sort(function(a, b) { return a.localeCompare(b); });
    var sections = [];
    var ordered = [];
    colorKeys.forEach(function(colorKey) {
      var items = colorBuckets[colorKey].slice().sort(function(a, b) {
        var da = parseDimensions(a);
        var db = parseDimensions(b);
        if (da.largura !== db.largura) return da.largura - db.largura;
        if (da.comprimento !== db.comprimento) return da.comprimento - db.comprimento;
        return String(a && (a.numero || a.of || '') || '').localeCompare(String(b && (b.numero || b.of || '') || ''));
      });
      var clusters = [];
      items.forEach(function(of) {
        var dim = parseDimensions(of);
        var target = null;
        for (var i = 0; i < clusters.length; i += 1) {
          var ref = clusters[i].ref;
          if (Math.abs((ref.largura || 0) - (dim.largura || 0)) <= 20 && Math.abs((ref.comprimento || 0) - (dim.comprimento || 0)) <= 20) {
            target = clusters[i];
            break;
          }
        }
        if (!target) {
          target = { ref: dim, items: [] };
          clusters.push(target);
        }
        target.items.push(of);
      });
      sections.push({ type: 'color', label: '🎨 ' + colorKey + ' (' + items.length + ' OFs)' });
      clusters.forEach(function(cluster) {
        sections.push({ type: 'size', label: '📐 ' + buildSizeLabel(cluster.ref) + ' (' + cluster.items.length + ' OFs)' });
        cluster.items.forEach(function(of) {
          ordered.push(of);
          sections.push({ type: 'card', of: of });
        });
      });
    });
    return { sections: sections, ordered: ordered };
  }

  function setupKey(of) {
    return parseColors(of).join(' + ') + '|' + buildSizeLabel(parseDimensions(of));
  }

  function countSetups(ofs) {
    var list = Array.isArray(ofs) ? ofs : [];
    if (list.length < 2) return 0;
    var total = 0;
    for (var i = 1; i < list.length; i += 1) {
      if (setupKey(list[i - 1]) !== setupKey(list[i])) total += 1;
    }
    return total;
  }

  function updateEconomiaHeader(maquina, texto) {
    var list = getMachineListEl(maquina);
    var block = list ? list.parentElement : null;
    var header = block ? block.querySelector('.maq-header') : null;
    if (!header) return;
    var left = header.querySelector('div');
    if (!left) return;
    var el = left.querySelector('.patch-ofmaq-economia');
    if (!texto) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.className = 'patch-ofmaq-economia';
      left.appendChild(el);
    }
    el.textContent = texto;
  }

  function applySetupGroupingVisual() {
    var groups = getVisibleGroups();
    Object.keys(groups || {}).forEach(function(maquina) {
      var listEl = getMachineListEl(maquina);
      if (!listEl) return;
      var cards = Array.prototype.slice.call(listEl.querySelectorAll('[data-of-id]'));
      var mapCards = {};
      cards.forEach(function(card) {
        var id = String(card.getAttribute('data-of-id') || '').trim();
        if (id) mapCards[id] = card;
      });
      if (!window._agrupamentoSetupAtivo) {
        updateEconomiaHeader(maquina, '');
        return;
      }
      var ofs = Array.isArray(groups[maquina]) ? groups[maquina] : [];
      var visual = buildSetupGroups(ofs);
      var maqDados = null;
      try { maqDados = typeof window.getDadosMaquina === 'function' ? window.getDadosMaquina(maquina) : null; } catch (_) {}
      var setupMedio = Number(maqDados && (maqDados.setup_medio || maqDados.tempo_setup_padrao_min || maqDados.passagem_media || maqDados.setup) || 0) || 0;
      var setupsSem = countSetups(ofs);
      var setupsCom = countSetups(visual.ordered);
      var economia = Math.max(0, setupsSem - setupsCom);
      updateEconomiaHeader(maquina, economia > 0 ? ('💰 Economia estimada: ' + economia + ' setups (≈ ' + (economia * setupMedio) + 'min)') : '💰 Economia estimada: 0 setup');
      var frag = document.createDocumentFragment();
      visual.sections.forEach(function(section) {
        if (section.type === 'color' || section.type === 'size') {
          var sep = document.createElement('div');
          sep.className = section.type === 'color' ? 'patch-ofmaq-setup-sep' : 'patch-ofmaq-setup-subsep';
          sep.textContent = section.label;
          frag.appendChild(sep);
          return;
        }
        var card = mapCards[String(section.of && section.of.id || '')];
        if (card) frag.appendChild(card);
      });
      listEl.replaceChildren(frag);
    });
  }

  function closeReagendamentoModal() {
    var modal = document.getElementById('patch-ofmaq-reag-modal');
    if (modal) modal.remove();
  }

  window.mostrarSugestaoReagendamento = function(ofId, maquina) {
    var of = getCurrentOfById(ofId);
    if (!of) return;
    closeReagendamentoModal();
    var entrega = getOfDelivery(of);
    var dias = businessDaysDelta(entrega);
    var overlay = document.createElement('div');
    overlay.id = 'patch-ofmaq-reag-modal';
    overlay.innerHTML = ''
      + '<div class="patch-reag-card">'
      + '  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">'
      + '    <div style="font-size:18px;font-weight:800;color:var(--text1)">📅 Sugestão de Reagendamento</div>'
      + '    <button type="button" id="patch-reag-close" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:20px">✕</button>'
      + '  </div>'
      + '  <div style="margin-top:14px;color:var(--text1);font-weight:700">OF #' + escHLocal(String(of.numero || of.of || '—')) + ' — ' + escHLocal(String(of.prodDesc || of.produto || of.descricao || 'Produto')) + '</div>'
      + '  <div style="margin-top:4px;color:var(--text2);font-size:13px">' + escHLocal(String(of.cliNome || of.cliente || of.cliente_nome || 'Cliente')) + '</div>'
      + '  <div style="margin-top:12px;color:var(--text2);font-size:13px">Entrega: ' + escHLocal(fmtDateBR(entrega)) + ' (' + escHLocal(String(dias == null ? 0 : dias)) + ' dias úteis restantes)</div>'
      + '  <div style="margin-top:12px;color:var(--text1);line-height:1.5">'
      + '    <div>' + escHLocal(String(maquina || 'Esta máquina')) + ' está sobrecarregada hoje.</div>'
      + '    <div>Esta OF tem folga para ser movida.</div>'
      + '  </div>'
      + '  <div style="margin-top:14px;color:var(--text2);font-size:12px;font-weight:700">Mover para:</div>'
      + '  <div class="patch-reag-actions">'
      + '    <button type="button" class="primary" data-date="' + escAttrLocal(nextBusinessDate(1)) + '">📅 Amanhã ' + escHLocal(fmtWeekdayDate(nextBusinessDate(1))) + '</button>'
      + '    <button type="button" data-date="' + escAttrLocal(nextBusinessDate(2)) + '">📅 ' + escHLocal(fmtWeekdayDate(nextBusinessDate(2))) + '</button>'
      + '    <button type="button" data-keep="1">Manter</button>'
      + '  </div>'
      + '</div>';
    overlay.addEventListener('click', function(ev) {
      if (ev.target === overlay) closeReagendamentoModal();
    });
    document.body.appendChild(overlay);
    var closeBtn = document.getElementById('patch-reag-close');
    if (closeBtn) closeBtn.onclick = closeReagendamentoModal;
    Array.prototype.slice.call(overlay.querySelectorAll('button[data-date]')).forEach(function(btn) {
      btn.onclick = async function() {
        var novaData = String(btn.getAttribute('data-date') || '').slice(0, 10);
        await window._aplicarSugestaoReagendamento(ofId, novaData);
      };
    });
    var keepBtn = overlay.querySelector('button[data-keep]');
    if (keepBtn) keepBtn.onclick = closeReagendamentoModal;
  };

  window._aplicarSugestaoReagendamento = async function(ofId, novaData) {
    try {
      var payload = { data_programada: novaData, data_producao: novaData, dia: novaData };
      var result = await apiJson('/api/ofs/' + encodeURIComponent(String(ofId || '').trim()), { method: 'PATCH', body: payload });
      if (!result.resp || !result.resp.ok || (result.data && result.data.ok === false)) {
        throw new Error((result.data && (result.data.error || result.data.message)) || 'Falha ao reagendar');
      }
      closeReagendamentoModal();
      try { window.toast('✓ OF reagendada', 'var(--green)'); } catch (_) {}
      try { if (typeof window.renderOFsPorMaquina === 'function') window.renderOFsPorMaquina(); } catch (_) {}
    } catch (e) {
      try { window.toast('Erro ao reagendar OF: ' + (e && e.message ? e.message : e), 'var(--red)'); } catch (_) {}
    }
  };

  async function savePriorityOrder(maquina, ids) {
    return apiJson('/api/ofs/reordenar', {
      method: 'POST',
      body: { maquina_id: maquina, ids: ids, ordem: ids }
    });
  }

  window.ordenarOFsPorPrioridade = async function(arg) {
    if (Array.isArray(arg)) return sortOfsByPriorityLocal(arg);
    var groups = getVisibleGroups();
    var maquinas = Object.keys(groups || {});
    if (!maquinas.length) {
      if (typeof originalSortByPriority === 'function' && arg != null) return originalSortByPriority(arg);
      return [];
    }
    try {
      for (var i = 0; i < maquinas.length; i += 1) {
        var maq = maquinas[i];
        var sorted = sortOfsByPriorityLocal(groups[maq] || []);
        var ids = sorted.map(function(of) { return String(of && of.id || '').trim(); }).filter(Boolean);
        if (!ids.length) continue;
        if (!window._ordemMaquinas || typeof window._ordemMaquinas !== 'object') window._ordemMaquinas = {};
        window._ordemMaquinas[maq] = ids.slice();
        await savePriorityOrder(maq, ids);
      }
      try { if (typeof window.renderOFsPorMaquina === 'function') await window.renderOFsPorMaquina(); } catch (_) {}
      try { window.toast('✅ OFs reorganizadas por prioridade', 'var(--green)'); } catch (_) {}
      return true;
    } catch (e) {
      try { window.toast('Erro ao reorganizar OFs: ' + (e && e.message ? e.message : e), 'var(--red)'); } catch (_) {}
      return false;
    }
  };

  window.toggleAgrupamentoSetup = function() {
    window._agrupamentoSetupAtivo = !window._agrupamentoSetupAtivo;
    updateAgrupamentoButton();
    try { if (typeof window.renderOFsPorMaquina === 'function') window.renderOFsPorMaquina(); } catch (_) {}
  };

  function afterRenderOfmaq() {
    ensureStyles();
    ensureOfmaqToolbarButtons();
    decorateOfmaqCards();
    applySetupGroupingVisual();
  }

  function hookRenderOfmaq() {
    if (typeof window.renderOFsPorMaquina !== 'function') return;
    if (window.renderOFsPorMaquina._patchedPriorityHub) return;
    var orig = window.renderOFsPorMaquina;
    window.renderOFsPorMaquina = async function() {
      var result = await orig.apply(this, arguments);
      setTimeout(afterRenderOfmaq, 40);
      return result;
    };
    window.renderOFsPorMaquina._patchedPriorityHub = true;
  }

  if (typeof originalCardOfmaq === 'function' && !window.cardOFMaquina._patchedPriorityHub) {
    window.cardOFMaquina = function() {
      return originalCardOfmaq.apply(this, arguments);
    };
    window.cardOFMaquina._patchedPriorityHub = true;
  }

  function buildHubIntelBlockHtml() {
    return ''
      + '<div id="hub-inteligencia" style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin-bottom:24px">'
      + '  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
      + '    <div style="display:flex;align-items:center;gap:10px">'
      + '      <span style="font-size:20px">📋</span>'
      + '      <div>'
      + '        <div style="font-weight:700;font-size:16px;color:var(--text1)">O que fazer hoje</div>'
      + '        <div style="font-size:12px;color:var(--text2)" id="hub-intel-data"></div>'
      + '      </div>'
      + '    </div>'
      + '    <button onclick="carregarInteligenciaHub()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:20px" title="Atualizar">↻</button>'
      + '  </div>'
      + '  <div id="hub-intel-lista"><div style="color:var(--text2);font-size:13px">Carregando análise...</div></div>'
      + '</div>';
  }

  function ensureHubIntelBlock() {
    var shell = document.querySelector('#page-hub .hub-shell');
    if (!shell) return null;
    var existing = document.getElementById('hub-inteligencia');
    if (existing) return existing;
    var kpis = document.getElementById('hub-kpis');
    var wrap = document.createElement('div');
    wrap.innerHTML = buildHubIntelBlockHtml();
    var block = wrap.firstElementChild;
    if (!block) return null;
    if (kpis && kpis.parentNode === shell) shell.insertBefore(block, kpis);
    else shell.prepend(block);
    return block;
  }

  window.navegarParaAlerta = function(rota) {
    var destino = String(rota || '').trim();
    if (!destino) return;
    try { if (typeof window.navigateTo === 'function') { window.navigateTo(destino); return; } } catch (_) {}
    try { if (typeof window.renderSection === 'function') { window.renderSection(destino); return; } } catch (_) {}
    try { if (typeof window.go === 'function') { window.go(destino); return; } } catch (_) {}
    try {
      var menuItem = document.querySelector('[data-section="' + destino + '"], [onclick*="' + destino + '"]');
      if (menuItem) menuItem.click();
    } catch (_) {}
  };

  window.carregarInteligenciaHub = async function() {
    try {
      ensureStyles();
      var block = ensureHubIntelBlock();
      var lista = document.getElementById('hub-intel-lista');
      var dataEl = document.getElementById('hub-intel-data');
      if (!block || !lista) return;
      if (dataEl) {
        try {
          var hoje = new Date();
          dataEl.textContent = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        } catch (_) {}
      }
      lista.innerHTML = '<div style="color:var(--text2);font-size:13px;padding:8px 0">Analisando dados...</div>';

      var token = '';
      try {
        token =
          String(window._token || localStorage.getItem('token') || '') ||
          String((document.cookie.match(/(?:^|;\\s*)token=([^;]+)/) || [])[1] || '');
      } catch (_) { token = ''; }

      var r = await fetch('/api/hub/inteligencia', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      if (!r || !r.ok) {
        lista.innerHTML = '<div style="color:var(--text2);font-size:12px;padding:8px">Central de inteligência indisponível no momento.</div>';
        return;
      }
      var data = await r.json().catch(function() { return {}; });
      var alertas = Array.isArray(data && data.alertas) ? data.alertas : [];
      if (!alertas.length) {
        lista.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;color:#10b981"><span style="font-size:20px">✅</span><span>Tudo em ordem! Nenhum alerta no momento.</span></div>';
        return;
      }
      var cores = {
        danger: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
        warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
        info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' }
      };
      lista.innerHTML = alertas.map(function(a) {
        var c = cores[a.tipo] || cores.info;
        var acao = escAttrLocal(String(a.acao || ''));
        return ''
          + '<div class="patch-hub-intel-item" data-acao="' + acao + '" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin-bottom:6px;border-radius:8px;cursor:pointer;background:' + c.bg + ';border:1px solid ' + c.border + '">'
          + '  <div style="display:flex;align-items:center;gap:10px">'
          + '    <span style="font-size:18px">' + escHLocal(a.icone || 'ℹ️') + '</span>'
          + '    <div>'
          + '      <div style="font-weight:600;font-size:13px;color:' + c.text + '">' + escHLocal(a.titulo || '') + '</div>'
          + '      <div style="font-size:11px;color:var(--text2)">' + escHLocal(a.subtitulo || '') + '</div>'
          + '    </div>'
          + '  </div>'
          + '  <span style="font-size:11px;color:' + c.text + ';white-space:nowrap;margin-left:10px">' + escHLocal(a.acao_label || 'ver →') + '</span>'
          + '</div>';
      }).join('');
      Array.prototype.slice.call(lista.querySelectorAll('.patch-hub-intel-item[data-acao]')).forEach(function(item) {
        item.onclick = function() {
          try { window.navegarParaAlerta(String(item.getAttribute('data-acao') || '')); } catch (_) {}
        };
      });
    } catch (_) {
      try {
        var lista2 = document.getElementById('hub-intel-lista');
        if (lista2) lista2.innerHTML = '<div style="color:var(--text2);font-size:12px;padding:8px">Central de inteligência indisponível.</div>';
      } catch (_) {}
    }
  };

  function hookRenderHubIntel() {
    if (typeof window.renderHub !== 'function') return;
    if (window.renderHub._patchedHubIntel) return;
    var orig = window.renderHub;
    window.renderHub = async function() {
      var result = await orig.apply(this, arguments);
      var block = ensureHubIntelBlock();
      if (block && block.dataset.hubIntelLoaded !== '1') {
        block.dataset.hubIntelLoaded = '1';
        try { window.carregarInteligenciaHub(); } catch (_) {}
      }
      return result;
    };
    window.renderHub._patchedHubIntel = true;
  }

  function initHubObserver() {
    try { if (window._hubObs && typeof window._hubObs.disconnect === 'function') window._hubObs.disconnect(); } catch (_) {}
    try { window._hubObs = null; } catch (_) {}
    try { if (window.__patchHubIntelObs && typeof window.__patchHubIntelObs.disconnect === 'function') window.__patchHubIntelObs.disconnect(); } catch (_) {}
    try { window.__patchHubIntelObs = null; } catch (_) {}
  }

  function tick() {
    ensureStyles();
    hookRenderOfmaq();
    hookRenderHubIntel();
    ensureOfmaqToolbarButtons();
    try { if (window._hubIntelInterval) clearInterval(window._hubIntelInterval); } catch (_) {}
    try { window._hubIntelInterval = null; } catch (_) {}
    if (document.getElementById('page-hub')) ensureHubIntelBlock();
  }

  if (typeof originalSortByPriority === 'function') {
    originalSortByPriority = originalSortByPriority.bind(window);
  }
  if (typeof originalRenderOfmaq === 'function') {
    originalRenderOfmaq = originalRenderOfmaq.bind(window);
  }
  hookRenderOfmaq();
  hookRenderHubIntel();
  initHubObserver();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      tick();
      setTimeout(afterRenderOfmaq, 500);
    });
  } else {
    tick();
    setTimeout(afterRenderOfmaq, 500);
  }
})();

(function patchInconformidadesCaixasPerdidas() {
  function authToken() {
    try {
      return String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || '').trim();
    } catch (_) {
      return '';
    }
  }

  function authHeaders(extra) {
    var token = authToken();
    var headers = extra ? Object.assign({}, extra) : {};
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  function toastLocal(msg) {
    try {
      if (typeof window.mostrarToast === 'function') return window.mostrarToast(msg);
    } catch (_) {}
    try {
      if (typeof window.toast === 'function') return window.toast(msg, /❌|erro/i.test(String(msg || '')) ? 'var(--red)' : 'var(--green)');
    } catch (_) {}
    try { alert(msg); } catch (_) {}
  }

  function fmtDataLocal(v) {
    try { if (typeof window.fmtD === 'function') return window.fmtD(v); } catch (_) {}
    var s = String(v || '').slice(0, 10);
    if (!s) return '—';
    var p = s.split('-');
    return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : s;
  }

  function fmtNumLocal(v) {
    try { if (typeof window.fmtN === 'function') return window.fmtN(v); } catch (_) {}
    return Number(v || 0).toLocaleString('pt-BR');
  }

  function fmtMoneyLocal(v) {
    try { if (typeof window.fmtR === 'function') return window.fmtR(v); } catch (_) {}
    return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escHLocal2(v) {
    try { if (typeof window.escH === 'function') return window.escH(v); } catch (_) {}
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escAttrLocal2(v) {
    return escHLocal2(v);
  }

  function normMaq(v) {
    var raw = String(v || '').trim().toLowerCase();
    try { raw = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return raw;
  }

  function uniqStrings(arr) {
    return Array.from(new Set((Array.isArray(arr) ? arr : []).map(function(x) { return String(x || '').trim(); }).filter(Boolean)));
  }

  function parseArrayField(raw) {
    try {
      if (Array.isArray(raw)) return uniqStrings(raw);
      if (raw && typeof raw === 'object') return uniqStrings(Object.values(raw));
      if (typeof raw === 'string') {
        var s = raw.trim();
        if (!s) return [];
        if (s.charAt(0) === '[') return uniqStrings(JSON.parse(s || '[]'));
        return uniqStrings(s.split(/[,;|]/g));
      }
    } catch (_) {}
    return [];
  }

  function getMaquinaSelecionadaNome() {
    var maqSel = String((document.getElementById('cp-maq') || {}).value || (window._cpFiltro && window._cpFiltro.maquina_id) || '').trim();
    if (!maqSel) return '';
    try {
      var src = Array.isArray(window.MAQUINAS) ? window.MAQUINAS : (Array.isArray(window.MAQUINAS) ? window.MAQUINAS : []);
      var it = src.find(function(m) { return String(m && m.id || '').trim() === maqSel; }) || null;
      return String(it && (it.col || it.nome || it.name || it.codigo) || maqSel).trim();
    } catch (_) {
      return maqSel;
    }
  }

  function getCpPeriodo() {
    var f = window._cpFiltro || {};
    var de = String(f.de || '').slice(0, 10);
    var ate = String(f.ate || '').slice(0, 10);
    var mesSelecionado = String((document.getElementById('cp-mesref') || {}).value || f.mes_ref || '').trim();
    if (mesSelecionado && /^\d{4}-\d{2}$/.test(mesSelecionado)) {
      var parts = mesSelecionado.split('-');
      var ano = Number(parts[0]);
      var mes = Number(parts[1]);
      if (ano > 2000 && mes >= 1 && mes <= 12) {
        de = mesSelecionado + '-01';
        ate = new Date(ano, mes, 0).toISOString().slice(0, 10);
      }
    }
    return { de: de, ate: ate, mes: mesSelecionado };
  }

  function getOfCacheById(ofId) {
    var id = String(ofId || '').trim();
    if (!id) return null;
    var bases = [
      Array.isArray(window.OFS) ? window.OFS : [],
      Array.isArray(window.OFs) ? window.OFs : [],
      Array.isArray(window.OFs_CACHE) ? window.OFs_CACHE : [],
      Array.isArray(window._ofsCarregadas) ? window._ofsCarregadas : [],
      Array.isArray(window.OFsUnico) ? window.OFsUnico : []
    ];
    for (var i = 0; i < bases.length; i += 1) {
      var arr = bases[i];
      var found = arr.find(function(of) { return String(of && of.id || '').trim() === id; }) || null;
      if (found) return found;
    }
    return null;
  }

  function normalizeInconfRow(item) {
    var ofData = getOfCacheById(item && item.of_id);
    var operadores = [];
    var operadorDisplay = String(item && item.usuario || '').trim() || '—';
    var qtdPerdida = Number(item && (item.qtd_perdida != null ? item.qtd_perdida : item.caixas_perdidas) || 0) || 0;
    var vlUnit = Number(item && (item.vl_unit != null ? item.vl_unit : item.valor_unitario) || (ofData && (ofData.vl_unit || ofData.valor_unitario)) || 0) || 0;
    var vlTotal = Number(item && (item.vl_total != null ? item.vl_total : item.valor_perdido) || 0) || ((qtdPerdida || 0) * (vlUnit || 0));
    var produto = String(item && item.produto || '').trim() || String(ofData && (ofData.produto || ofData.descricao || ofData.prodDesc) || '').trim() || '—';
    var cliente = String(item && item.cliente || '').trim() || String(ofData && (ofData.cli_nome || ofData.cliente || ofData.cliente_nome || ofData.cliNome) || '').trim() || '—';
    var maquina = String(item && (item.maquina || item.maquina_perda) || '').trim() || String(ofData && (ofData.maquina || ofData.maq || ofData.maquina_atual) || '').trim() || '—';
    var ofNumero = String(item && (item.of_numero || item.of_num || item.numero || item.of) || '').trim() || String(ofData && (ofData.numero || ofData.of) || '').trim() || '—';
    var imgUrl = String(item && (item.imagem_url || item.foto_url || item.imgUrl) || '').trim() || String(ofData && (ofData.imagem_url || ofData.imgUrl || (Array.isArray(ofData.imgs) ? ofData.imgs[0] : '')) || '').trim();
    return {
      id: String(item && item.id || '').trim(),
      of_id: String(item && item.of_id || '').trim(),
      of_numero: ofNumero,
      produto: produto,
      maquina: maquina,
      maquina_perda: String(item && item.maquina_perda || '').trim(),
      cliente: cliente,
      qtd_perdida: qtdPerdida,
      vl_unit: vlUnit,
      vl_total: vlTotal,
      valor_unitario: vlUnit,
      valor_perdido: vlTotal,
      usuario: String(item && item.usuario || '').trim() || '—',
      operador_display: operadorDisplay,
      operador_principal: String(item && item.operador_principal || '').trim(),
      operadores: operadores,
      imgUrl: imgUrl,
      imagem_url: imgUrl,
      motivo: String(item && item.motivo || '').trim(),
      data: String(item && (item.data || item.created_at || item.updated_at || '') || '').slice(0, 10),
      created_at: String(item && (item.created_at || item.updated_at || '') || ''),
      mes_referencia: String(item && item.mes_referencia || '').trim() || String(item && (item.data || item.created_at || '') || '').slice(0, 7),
      empresa_id: String(item && (item.empresa_id || item.emp_id) || '').trim()
    };
  }

  async function fetchInconformidadesCp() {
    var resp = await fetch('/api/caixas_perdidas', { headers: authHeaders() });
    var json = await resp.json().catch(function() { return null; });
    if (!resp.ok) throw new Error(String(json && json.error || resp.status));
    var arr = Array.isArray(json) ? json : (Array.isArray(json && json.data) ? json.data : (Array.isArray(json && json.inconformidades) ? json.inconformidades : []));
    return arr.map(normalizeInconfRow);
  }

  function filterCpRows(rows) {
    var listaBase = Array.isArray(rows) ? rows : [];
    var periodo = getCpPeriodo();
    var maqNomeSel = getMaquinaSelecionadaNome();
    var mesSel = String((document.getElementById('cp-mesref') || {}).value || (window._cpFiltro && window._cpFiltro.mes_ref) || '').trim();
    var tipo = String((window._cpFiltro && window._cpFiltro.tipo) || '').trim().toLowerCase();
    var mesAtual = '';
    try { mesAtual = new Date().toISOString().slice(0, 7); } catch (_) { mesAtual = ''; }
    var semanaDe = '';
    var semanaAte = '';
    if (tipo === 'semana') {
      try {
        var now = new Date();
        var d = new Date(now);
        var dow = d.getDay();
        var diff = (dow === 0 ? -6 : (1 - dow));
        d.setDate(d.getDate() + diff);
        semanaDe = d.toISOString().slice(0, 10);
        var d2 = new Date(d);
        d2.setDate(d2.getDate() + 6);
        semanaAte = d2.toISOString().slice(0, 10);
      } catch (_) {}
    }
    return listaBase.filter(function(r) {
      var data = String(r && (r.data || '') || '').slice(0, 10);
      var mr = String(r && (r.mes_referencia || (data ? data.slice(0, 7) : '')) || '').trim();
      if (tipo === 'mes') {
        var alvoMes = mesSel || mesAtual;
        if (alvoMes && mr !== alvoMes) return false;
      } else if (tipo === 'semana') {
        if (semanaDe && data && data < semanaDe) return false;
        if (semanaAte && data && data > semanaAte) return false;
      } else {
        if (periodo.de && data && data < periodo.de) return false;
        if (periodo.ate && data && data > periodo.ate) return false;
        if (mesSel) {
          if (mr !== mesSel) return false;
        }
      }
      if (maqNomeSel && normMaq(r && r.maquina) !== normMaq(maqNomeSel) && normMaq(r && r.maquina) !== normMaq(String((document.getElementById('cp-maq') || {}).value || ''))) return false;
      return true;
    });
  }

  function renderCpRowsPatched(rows) {
    var lista = filterCpRows(rows);
    var totalQtd = lista.reduce(function(s, r) { return s + (Number(r && r.qtd_perdida || 0) || 0); }, 0);
    var totalValor = lista.reduce(function(s, r) { return s + (Number(r && (r.vl_total != null ? r.vl_total : r.valor_perdido) || 0) || 0); }, 0);
    var cards = document.getElementById('cp-cards');
    if (cards) {
      cards.innerHTML = ''
        + '<div class="card"><div class="card-lbl">Total Caixas Perdidas</div><div class="card-val cv-r">' + fmtNumLocal(totalQtd) + '</div><div class="card-sub">unidades</div></div>'
        + '<div class="card"><div class="card-lbl">Valor Total Perdido</div><div class="card-val cv-r" style="font-size:1.1rem">' + fmtMoneyLocal(totalValor) + '</div></div>'
        + '<div class="card"><div class="card-lbl">Ocorrências</div><div class="card-val cv-a">' + fmtNumLocal(lista.length) + '</div></div>';
    }

    var tbody = document.querySelector('#cp-table tbody');
    if (!tbody) return;
    try {
      var thead = document.querySelector('#cp-table thead');
      var ths = thead ? thead.querySelectorAll('th') : null;
      if (ths && ths[9]) ths[9].textContent = 'USUÁRIO';
    } catch (_) {}
    tbody.innerHTML = lista.map(function(item) {
      var id = String(item && item.id || '').trim();
      var maquinaDisplay = (item && (item.maquina || item.maquina_perda)) || '—';
      var operadorDisplay = item && item.usuario || '—';
      var qtdPerdida = Number(item && item.qtd_perdida || 0) || 0;
      var vlUnit = Number(item && (item.vl_unit != null ? item.vl_unit : item.valor_unitario) || 0) || 0;
      var vlTotal = Number(item && (item.vl_total != null ? item.vl_total : item.valor_perdido) || 0) || ((qtdPerdida || 0) * (vlUnit || 0));
      var operadores = operadorDisplay;
      var imgCell = '';
      return ''
        + '<tr data-cp-id="' + escAttrLocal2(id) + '">'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-family:var(--mono);font-size:.72rem;color:var(--text2)">' + escHLocal2(fmtDataLocal(item && (item.data || item.created_at))) + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-family:var(--mono);font-size:.74rem;color:var(--accent)">' + escHLocal2(item && item.of_numero || '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem">' + escHLocal2(item && item.produto || '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem;white-space:nowrap">' + escHLocal2(maquinaDisplay) + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem">' + escHLocal2(item && item.cliente || '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);text-align:right;font-family:var(--mono);font-weight:800;color:var(--red)">' + fmtNumLocal(qtdPerdida) + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);text-align:right;font-family:var(--mono)">' + (vlUnit > 0 ? fmtMoneyLocal(vlUnit) : '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);text-align:right;font-family:var(--mono);font-weight:800">' + (vlTotal > 0 ? fmtMoneyLocal(vlTotal) : '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem">' + escHLocal2(item && item.usuario || '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem">' + escHLocal2(operadores || '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);text-align:center">' + imgCell + '</td>'
        + '</tr>';
    }).join('') || '<tr><td colspan="11" style="padding:10px;border:1px solid var(--border);color:var(--text2);text-align:center">Sem lançamentos no período</td></tr>';
    try {
      if (!document.getElementById('patch-style-cp-hide-foto')) {
        var st = document.createElement('style');
        st.id = 'patch-style-cp-hide-foto';
        st.textContent = '#cp-table th:nth-child(11), #cp-table td:nth-child(11){display:none !important;}';
        document.head.appendChild(st);
      }
    } catch (_) {}
  }

  window.renderCaixasPerdidas = function() {
    try {
      var container0 = document.querySelector('#caixas-perdidas-content, [data-section="caixas-perdidas"], .caixas-perdidas-container, #analises-content, #main-content, #page-caixas-perdidas');
      if (container0) {
        container0.dataset.secaoAtiva = 'caixas-perdidas';
        container0.setAttribute('data-secao-ativa', 'caixas-perdidas');
      }
    } catch (_) {}
    renderCpRowsPatched(Array.isArray(window._cpRows) ? window._cpRows : []);
    try { fixarBotaoNovaInconformidade(); } catch (_) {}
  };

  if (typeof window.cpRender === 'function' && !window.cpRender._patchInconfRows) {
    var _cpRenderOriginal = window.cpRender;
    window.cpRender = function(rows) {
      try {
        renderCpRowsPatched(Array.isArray(rows) ? rows : (Array.isArray(window._cpRows) ? window._cpRows : []));
      } catch (_) {
        return _cpRenderOriginal.apply(this, arguments);
      }
    };
    window.cpRender._patchInconfRows = true;
  }

  if (typeof window.carregarCaixasPerdidas === 'function' && !window.carregarCaixasPerdidas._patchInconfRows) {
    var _carregarCaixasPerdidasOriginal = window.carregarCaixasPerdidas;
    window.carregarCaixasPerdidas = async function() {
      var result = await _carregarCaixasPerdidasOriginal.apply(this, arguments);
      try {
        var itens = await fetchInconformidadesCp();
        if (Array.isArray(itens)) {
          window._cpRows = itens;
          renderCpRowsPatched(itens);
        }
      } catch (_) {}
      try { fixarBotaoNovaInconformidade(); } catch (_) {}
      return result;
    };
    window.carregarCaixasPerdidas._patchInconfRows = true;
  }

  async function carregarOfModal(ofId) {
    var of = getOfCacheById(ofId);
    if (of) return of;
    if (!ofId) return null;
    try {
      var resp = await fetch('/api/ofs/' + encodeURIComponent(String(ofId || '').trim()), { headers: authHeaders() });
      var json = await resp.json().catch(function() { return null; });
      return json && (json.data || json) || null;
    } catch (_) {
      return null;
    }
  }

  async function carregarOperadoresModal() {
    try {
      var r = await fetch('/api/operadores?t=' + Date.now(), { headers: authHeaders() });
      var j = await r.json().catch(function() { return null; });
      var ops = (j && j.ok && Array.isArray(j.data)) ? j.data : (Array.isArray(j && j.data) ? j.data : []);
      return uniqStrings(ops.map(function(o) { return String(o && (o.nome || o.name || o.operador_nome) || '').trim(); }));
    } catch (_) {
      return [];
    }
  }

  window.adicionarOperadorInconf = function(nome) {
    var n = String(nome || '').trim().toUpperCase();
    if (!n) return;
    var container = document.getElementById('inconf-operadores-chips');
    if (!container) return;
    var selVal = (window.CSS && typeof window.CSS.escape === 'function')
      ? window.CSS.escape(n)
      : n.replace(/[^a-zA-Z0-9_\-]/g, function(ch) { return '\\' + ch; });
    if (container.querySelector('input[value="' + selVal + '"]')) return;
    var label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(59,130,246,0.15);border:1px solid #3b82f6;border-radius:20px;cursor:pointer;font-size:12px;color:#f1f5f9;user-select:none';
    label.innerHTML = '<input type="checkbox" value="' + escAttrLocal2(n) + '" checked style="width:14px;height:14px;accent-color:#3b82f6"> ' + escHLocal2(n);
    container.appendChild(label);
  };

  window.calcularValorInconf = function() {
    var qtd = Number((document.getElementById('inconf-qtd') || {}).value || 0);
    var vl = Number((document.getElementById('inconf-vl-unit') || {}).value || 0);
    var total = document.getElementById('inconf-vl-total');
    if (total) total.value = (qtd * vl).toFixed(2);
  };

  window.abrirModalInconformidade = async function(ofId, ofNumero, maquinaParam) {
    try {
      var old = document.getElementById('modal-nova-inconformidade');
      if (old) old.remove();
    } catch (_) {}

    var ofData = await carregarOfModal(ofId);
    var produto = String(ofData && (ofData.produto || ofData.descricao || ofData.prodDesc) || '').trim();
    var cliente = String(ofData && (ofData.cli_nome || ofData.cliente || ofData.cliente_nome || ofData.cliNome) || '').trim();
    var maquina = String(maquinaParam || ofData && (ofData.maquina || ofData.maq || ofData.maquina_atual) || '').trim();
    var vlUnit = Number(ofData && (ofData.vl_unit || ofData.valor_unitario) || 0) || 0;
    var operadores = parseArrayField(ofData && (ofData.operadores || ofData.operadores_of || ofData.operadoresOf));
    var opOptions = await carregarOperadoresModal();

    var modal = document.createElement('div');
    modal.id = 'modal-nova-inconformidade';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.78);backdrop-filter:blur(4px);z-index:100001;display:flex;align-items:center;justify-content:center;padding:16px';
    modal.innerHTML = ''
      + '<div style="width:min(760px,96vw);max-height:92vh;overflow:auto;background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,0.45);padding:22px">'
      + '  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px">'
      + '    <div>'
      + '      <div style="font-size:18px;font-weight:700;color:#f8fafc">⚠️ Registrar Perda / Inconformidade</div>'
      + '      <div style="font-size:12px;color:#94a3b8;margin-top:4px">Preencha os dados da perda para alimentar a análise de caixas perdidas.</div>'
      + '    </div>'
      + '    <button type="button" id="btn-fechar-inconf-modal" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer">✕</button>'
      + '  </div>'
      + '  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px">'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">OF</label><input id="inconf-of-numero" value="' + escAttrLocal2(ofNumero || ofData && (ofData.numero || ofData.of) || '') + '" readonly style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">MÁQUINA</label><input id="inconf-maquina" value="' + escAttrLocal2(maquina) + '" placeholder="Ex: IMP 01" style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">PRODUTO</label><input id="inconf-produto" value="' + escAttrLocal2(produto) + '" readonly style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">CLIENTE</label><input id="inconf-cliente" value="' + escAttrLocal2(cliente) + '" readonly style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">QTD PERDIDA</label><input id="inconf-qtd" type="number" min="0" step="1" oninput="calcularValorInconf()" style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">VL UNIT</label><input id="inconf-vl-unit" type="number" min="0" step="0.01" value="' + escAttrLocal2(vlUnit ? vlUnit.toFixed(2) : '') + '" oninput="calcularValorInconf()" style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">VL TOTAL</label><input id="inconf-vl-total" type="number" min="0" step="0.01" readonly style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">MOTIVO</label><input id="inconf-motivo" placeholder="Ex: Erro de impressão" style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '  </div>'
      + '  <div style="margin-top:16px">'
      + '    <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">OPERADORES</label>'
      + '    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
      + '      <input id="inconf-operador-input" list="inconf-operadores-list" placeholder="Digite ou selecione um operador" style="flex:1;min-width:220px;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc">'
      + '      <datalist id="inconf-operadores-list">' + opOptions.map(function(op) { return '<option value="' + escAttrLocal2(op) + '"></option>'; }).join('') + '</datalist>'
      + '      <button type="button" id="btn-add-operador-inconf" style="padding:10px 14px;background:#2563eb;border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer">+ Operador</button>'
      + '    </div>'
      + '    <div id="inconf-operadores-chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"></div>'
      + '  </div>'
      + '  <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px">'
      + '    <button type="button" id="btn-cancelar-inconf" style="padding:10px 16px;background:#1f2937;border:1px solid #334155;border-radius:8px;color:#e5e7eb;cursor:pointer">Cancelar</button>'
      + '    <button type="button" id="btn-confirmar-inconf" onclick="confirmarRegistroInconformidade(\'' + escAttrLocal2(ofId || '') + '\',\'' + escAttrLocal2(ofNumero || ofData && (ofData.numero || ofData.of) || '') + '\',\'' + escAttrLocal2(maquina) + '\')" style="padding:10px 16px;background:#ef4444;border:none;border-radius:8px;color:#fff;font-weight:700;cursor:pointer">⚠️ Registrar Perda</button>'
      + '  </div>'
      + '</div>';

    modal.addEventListener('click', function(ev) {
      if (ev.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
    try { document.body.style.overflow = 'hidden'; } catch (_) {}

    var closeModal = function() {
      try { modal.remove(); } catch (_) {}
      try { document.body.style.overflow = ''; } catch (_) {}
    };
    var btnClose = document.getElementById('btn-fechar-inconf-modal');
    var btnCancel = document.getElementById('btn-cancelar-inconf');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    var btnAdd = document.getElementById('btn-add-operador-inconf');
    var inpAdd = document.getElementById('inconf-operador-input');
    if (btnAdd) btnAdd.onclick = function() {
      window.adicionarOperadorInconf(inpAdd && inpAdd.value || '');
      if (inpAdd) inpAdd.value = '';
    };
    if (inpAdd) {
      inpAdd.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          window.adicionarOperadorInconf(inpAdd.value || '');
          inpAdd.value = '';
        }
      });
    }

    operadores.forEach(function(op) { window.adicionarOperadorInconf(op); });
    window.calcularValorInconf();
  };

  window.confirmarRegistroInconformidade = async function(ofId, ofNumero, maquinaParam) {
    var maquina = String((document.getElementById('inconf-maquina') || {}).value || maquinaParam || '').trim();
    var qtd = Number((document.getElementById('inconf-qtd') || {}).value || 0);
    var vlUnit = Number((document.getElementById('inconf-vl-unit') || {}).value || 0);
    var vlTotal = Number((document.getElementById('inconf-vl-total') || {}).value || (qtd * vlUnit));
    var motivo = String((document.getElementById('inconf-motivo') || {}).value || '').trim();
    var produto = String((document.getElementById('inconf-produto') || {}).value || '').trim();
    var cliente = String((document.getElementById('inconf-cliente') || {}).value || '').trim();
    var checkboxes = document.querySelectorAll('#inconf-operadores-chips input[type="checkbox"]:checked');
    var operadores = Array.prototype.slice.call(checkboxes).map(function(cb) { return String(cb.value || '').trim(); }).filter(Boolean);

    if (!maquina) { toastLocal('⚠️ Informe a máquina'); return; }
    if (!qtd || qtd <= 0) { toastLocal('⚠️ Informe a quantidade perdida'); return; }

    var btnConfirmar = document.getElementById('btn-confirmar-inconf');
    if (btnConfirmar) { btnConfirmar.disabled = true; btnConfirmar.textContent = 'Salvando...'; }

    try {
      var resp = await fetch('/api/inconformidades', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          of_id: ofId || null,
          of_numero: ofNumero || null,
          maquina: maquina,
          produto: produto || null,
          cliente: cliente || null,
          operadores: operadores,
          operador_principal: operadores[0] || null,
          qtd_perdida: qtd,
          vl_unit: vlUnit,
          vl_total: vlTotal || (qtd * vlUnit),
          motivo: motivo || null
        })
      });
      var data = await resp.json().catch(function() { return null; });
      if (!resp.ok) throw new Error(String(data && data.error || resp.status));
      toastLocal('✅ Inconformidade registrada com sucesso!');
      var modal = document.getElementById('modal-nova-inconformidade');
      if (modal) modal.remove();
      try { document.body.style.overflow = ''; } catch (_) {}
      if (typeof window.carregarCaixasPerdidas === 'function') await window.carregarCaixasPerdidas();
      else if (typeof window.renderCaixasPerdidas === 'function') window.renderCaixasPerdidas();
    } catch (e) {
      toastLocal('❌ Erro ao salvar: ' + String(e && e.message || e));
      if (btnConfirmar) { btnConfirmar.disabled = false; btnConfirmar.textContent = '⚠️ Registrar Perda'; }
    }
  };

  function fixarBotaoNovaInconformidade() {
    Array.prototype.slice.call(document.querySelectorAll('#page-caixas-perdidas button, #page-inconformidades button')).forEach(function(btn) {
      var txt = String(btn && btn.textContent || '').trim();
      if (!txt) return;
      if (!(/inconformidade/i.test(txt) || /registrar perda/i.test(txt) || /nova perda/i.test(txt) || /^registrar$/i.test(txt))) return;
      if (btn.dataset.inconfFixed === '1') return;
      btn.dataset.inconfFixed = '1';
      var onclickAtual = String(btn.getAttribute('onclick') || '');
      if (onclickAtual.indexOf('abrirModalInconformidade') >= 0) return;
      btn.onclick = function(e) {
        try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
        window.abrirModalInconformidade(null, null, null);
      };
    });
  }

  window.fixarBotaoNovaInconformidade = fixarBotaoNovaInconformidade;
  fixarBotaoNovaInconformidade();
  try {
    if (window._obsInconf && typeof window._obsInconf.disconnect === 'function') window._obsInconf.disconnect();
  } catch (_) {}
  try {
    window._obsInconf = new MutationObserver(function(_, observer) {
      fixarBotaoNovaInconformidade();
      var temBotao = document.querySelector('#page-caixas-perdidas button[data-inconf-fixed="1"], #page-inconformidades button[data-inconf-fixed="1"]');
      if (temBotao) {
        try { observer.disconnect(); } catch (_) {}
        try { window._obsInconf = null; } catch (_) {}
      }
    });
    window._obsInconf.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
})();

(function patchPerformanceInputs() {
  var debounce = window._debounce;
  if (typeof window.debounce !== 'function') window.debounce = debounce;
  window._ofsPag = window._ofsPag || { offset: 0, limit: 10, total: 0, hasMore: false, loading: false, filtros: {} };
  window._armazemPag = window._armazemPag || { offset: 0, limit: 10, total: 0, hasMore: false, loading: false, filtros: {} };

  function bindDebouncedInput(selector, delay) {
    Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function(input) {
      if (!input || input.dataset.debounceBound === '1') return;
      var original = input.oninput;
      if (typeof original !== 'function') return;
      input.oninput = debounce(function(ev) { return original.call(this, ev); }, delay);
      input.dataset.debounceBound = '1';
    });
  }

  function bindAll() {
    bindDebouncedInput('#pcp-busca', 300);
    bindDebouncedInput('#busca-of', 300);
    bindDebouncedInput('#busca-cliente', 300);
    bindDebouncedInput('#busca-geral', 300);
    bindDebouncedInput('#lanc-busca', 300);
    bindDebouncedInput('input[placeholder*="Buscar"]', 300);
    bindDebouncedInput('input[placeholder*="buscar"]', 300);
    bindDebouncedInput('input[placeholder*="Filtrar"]', 300);
    bindDebouncedInput('input[placeholder*="pesquisar"]', 300);
  }

  function wrapRenderer(nome) {
    if (typeof window[nome] !== 'function' || window[nome]._patchDebounceInputs) return;
    var original = window[nome];
    var wrapped = function() {
      var result = original.apply(this, arguments);
      setTimeout(bindAll, 0);
      return result;
    };
    wrapped._patchDebounceInputs = true;
    window[nome] = wrapped;
  }

  function init() {
    wrapRenderer('renderPCP');
    wrapRenderer('renderLancamento');
    bindAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 800);
  setTimeout(init, 1800);
  setTimeout(bindAll, 2500);
})();

(function patchCheckupHotfixes() {
  function esc(v) {
    try { if (typeof window.escH === 'function') return window.escH(v); } catch (_) {}
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function tokenHeaders(extra) {
    var token = '';
    try { token = String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim(); } catch (_) {}
    var headers = extra ? Object.assign({}, extra) : {};
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  function toastHotfix(msg, tone) {
    try { if (typeof window.mostrarToast === 'function') return window.mostrarToast(msg); } catch (_) {}
    try { if (typeof window.toast === 'function') return window.toast(msg, tone || 'var(--accent)'); } catch (_) {}
    try { alert(msg); } catch (_) {}
  }

  function ensurePainelClienteScroll() {
    try {
      var modal = document.querySelector('#modal-hist-cli .modal');
      if (modal) {
        modal.style.maxHeight = '85vh';
        modal.style.overflowY = 'auto';
      }
      var body = document.getElementById('hist-cli-body');
      if (body) {
        body.style.maxHeight = 'calc(85vh - 90px)';
        body.style.overflowY = 'auto';
      }
    } catch (_) {}
  }

  function hideProjecaoVendas() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('#widget-projecao-vendas, .projecao-vendas, [id*="projecao"]')).forEach(function(el) {
        if (!el) return;
        var box = el.closest ? (el.closest('.sbox') || el) : el;
        box.style.display = 'none';
      });
    } catch (_) {}
  }

  window.abrirRankingClientes = async function(tipo) {
    var tipoNorm = String(tipo || '').trim().toLowerCase();
    tipoNorm = (tipoNorm === 'valor' || tipoNorm === 'faturamento') ? 'faturamento' : 'quantidade';
    var resp = await fetch('/api/clientes/ranking?tipo=' + encodeURIComponent(tipoNorm) + '&limit=30&t=' + Date.now(), {
      headers: tokenHeaders()
    });
    var data = await resp.json().catch(function() { return []; });
    var lista = Array.isArray(data) ? data : (Array.isArray(data && data.data) ? data.data : []);

    var anterior = document.getElementById('modal-ranking-clientes');
    if (anterior) anterior.remove();

    var titulo = tipoNorm === 'faturamento' ? 'Maior Valor' : 'Quem Mais Pede';
    var overlay = document.createElement('div');
    overlay.id = 'modal-ranking-clientes';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:20px';

    var rows = lista.slice(0, 30).map(function(c, i) {
      var medalha = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '#' + (i + 1)));
      var val = tipoNorm === 'faturamento'
        ? 'R$ ' + (Number(c && c.faturamento || 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : String(Number(c && c.total_ofs || 0) || 0) + ' OFs';
      return '<tr style="border-bottom:1px solid #2d3748">'
        + '<td style="padding:8px 12px;font-size:18px">' + esc(medalha) + '</td>'
        + '<td style="padding:8px 12px;color:#f1f5f9">' + esc(c && c.nome || '—') + '</td>'
        + '<td style="padding:8px 12px;color:#64748b">' + esc(c && c.cidade || '') + '</td>'
        + '<td style="padding:8px 12px;text-align:right;color:#3b82f6;font-weight:600">' + esc(val) + '</td>'
        + '</tr>';
    }).join('');

    overlay.innerHTML = '<div style="background:#1e2433;border:1px solid #2d3748;border-radius:14px;padding:28px;width:100%;max-width:600px;max-height:85vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.6);position:relative">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
      + '<h2 style="font-size:18px;font-weight:700;color:#f1f5f9;margin:0">' + esc(tipoNorm === 'faturamento' ? '💰 Maior Valor' : '📦 Quem Mais Pede') + '</h2>'
      + '<button type="button" id="ranking-close-hotfix" style="background:none;border:none;color:#64748b;font-size:24px;cursor:pointer">×</button></div>'
      + '<table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #2d3748">'
      + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b">#</th>'
      + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b">CLIENTE</th>'
      + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b">CIDADE</th>'
      + '<th style="padding:8px 12px;text-align:right;font-size:11px;color:#64748b">' + esc(tipoNorm === 'faturamento' ? 'VALOR' : 'OFs') + '</th>'
      + '</tr></thead><tbody>' + (rows || '<tr><td colspan="4" style="padding:12px;color:#94a3b8;text-align:center">Nenhum dado encontrado.</td></tr>') + '</tbody></table></div>';

    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    try { document.getElementById('ranking-close-hotfix').onclick = function() { overlay.remove(); }; } catch (_) {}
  };

  function fixarBotoesRankingClientes() {
    try {
      var btnAtivos = document.getElementById('patch-analise-ativos');
      var btnValor = document.getElementById('patch-analise-valor');
      if (btnAtivos && btnAtivos.dataset.rankFixed !== '1') {
        btnAtivos.dataset.rankFixed = '1';
        btnAtivos.onclick = function() { window.abrirRankingClientes('quantidade'); };
      }
      if (btnValor && btnValor.dataset.rankFixed !== '1') {
        btnValor.dataset.rankFixed = '1';
        btnValor.onclick = function() { window.abrirRankingClientes('faturamento'); };
      }
    } catch (_) {}
  }

  function hideLegacyComissoesUi() {}

  function renderTelaComissoes() {
    try { if (typeof window.injetarBotaoImprimirComissoes === 'function') window.injetarBotaoImprimirComissoes(); } catch (_) {}
  }

  window.gerarEImprimirComissoes = function() {
    try {
      if (typeof window._abrirModalImpressaoComissoes === 'function') return window._abrirModalImpressaoComissoes();
    } catch (_) {}
    return null;
  };

  function hookRenderComissoesSimple() {
    try { renderTelaComissoes(); } catch (_) {}
  }

  window.aplicarClickImagemOF = function() {
    Array.prototype.slice.call(document.querySelectorAll('[data-of-id]')).forEach(function(card) {
      var ofId = String(card && card.dataset && card.dataset.ofId || '').trim();
      if (!ofId) return;
      var temImgReal = card.querySelector('img[src^="http"], img[src^="data:"]');
      if (temImgReal) return;
      var placeholder = card.querySelector(
        '.of-img-placeholder, [data-img-placeholder], .img-placeholder, .of-sem-imagem, .kb-img-ph, .kb-of-img-ph, .cli-of-img-fb, .ofmaq-thumb.of-img, .of-img, img[src=""], img:not([src]), .card-img-area:empty'
      );
      if (!placeholder || placeholder.dataset.clickOk === '1') return;
      placeholder.dataset.clickOk = '1';
      placeholder.style.cursor = 'pointer';
      placeholder.title = '📷 Clique para adicionar foto';
      placeholder.onclick = function(e) {
        try { if (e) { e.stopPropagation(); e.preventDefault(); } } catch (_) {}
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*,application/pdf';
        inp.onchange = async function() {
          var file = inp.files && inp.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = async function(ev) {
            var base64 = ev && ev.target ? ev.target.result : '';
            try {
              if (placeholder.tagName === 'IMG') placeholder.src = base64;
              else {
                placeholder.style.backgroundImage = 'url(' + base64 + ')';
                placeholder.style.backgroundSize = 'cover';
                placeholder.style.backgroundPosition = 'center';
                placeholder.textContent = '';
              }
            } catch (_) {}
            try {
              var token = '';
              try { token = String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || '').trim(); } catch (_) {}
              var resp = await fetch('/api/ofs/' + encodeURIComponent(ofId) + '/imagem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
                body: JSON.stringify({ imagem_base64: base64, tipo: file.type })
              });
              toastHotfix(resp.ok ? '📷 Foto salva!' : '❌ Erro ao salvar foto', resp.ok ? 'var(--green)' : 'var(--red)');
            } catch (err) {
              toastHotfix('❌ ' + String(err && err.message || err), 'var(--red)');
            }
          };
          reader.readAsDataURL(file);
        };
        document.body.appendChild(inp);
        inp.click();
        setTimeout(function() { try { document.body.removeChild(inp); } catch (_) {} }, 1000);
      };
    });
  };

  function patchCaixasPerdidasSafe() {
    if (typeof window.carregarCaixasPerdidas === 'function' && !window.carregarCaixasPerdidas._patchSafeHotfix) {
      var origLoad = window.carregarCaixasPerdidas;
      window.carregarCaixasPerdidas = async function() {
        try {
          return await origLoad.apply(this, arguments);
        } catch (_) {
          try { window._cpRows = Array.isArray(window._cpRows) ? window._cpRows : []; } catch (_) {}
          try { if (typeof window.renderCaixasPerdidas === 'function') window.renderCaixasPerdidas(); } catch (_) {}
          return [];
        } finally {
          try {
            var page = document.querySelector('#caixas-perdidas-content, [data-section="caixas-perdidas"], .caixas-perdidas-container, #analises-content, #main-content, #page-caixas-perdidas');
            if (page) {
              page.dataset.secaoAtiva = 'caixas-perdidas';
              page.setAttribute('data-secao-ativa', 'caixas-perdidas');
              page.style.display = '';
            }
            if (typeof window.renderCaixasPerdidas === 'function') window.renderCaixasPerdidas();
          } catch (_) {}
        }
      };
      window.carregarCaixasPerdidas._patchSafeHotfix = true;
    }
    if (typeof window.renderCaixasPerdidas === 'function' && !window.renderCaixasPerdidas._patchSafeHotfix) {
      var origRender = window.renderCaixasPerdidas;
      window.renderCaixasPerdidas = function() {
        try {
          var page = document.querySelector('#caixas-perdidas-content, [data-section="caixas-perdidas"], .caixas-perdidas-container, #analises-content, #main-content, #page-caixas-perdidas');
          if (page) {
            page.dataset.secaoAtiva = 'caixas-perdidas';
            page.setAttribute('data-secao-ativa', 'caixas-perdidas');
            page.style.display = '';
          }
        } catch (_) {}
        try {
          return origRender.apply(this, arguments);
        } catch (_) {
          var tbody = document.querySelector('#cp-table tbody');
          if (tbody) tbody.innerHTML = '<tr><td colspan="11" style="padding:10px;border:1px solid var(--border);color:var(--text2);text-align:center">Sem lancamentos no periodo</td></tr>';
        }
      };
      window.renderCaixasPerdidas._patchSafeHotfix = true;
    }
    if (typeof window.renderCaixasPerdidas === 'function' && !window._renderCaixasProtegido) {
      var _renderCaixasOrig = window.renderCaixasPerdidas;
      window._renderCaixasProtegido = true;
      window.renderCaixasPerdidas = async function() {
        var container = null;
        try {
          container = document.querySelector('#caixas-perdidas-content, [data-section="caixas-perdidas"], .caixas-perdidas-container, #analises-content, #main-content, #page-caixas-perdidas');
          if (container) {
            container.dataset.secaoAtiva = 'caixas-perdidas';
            container.setAttribute('data-secao-ativa', 'caixas-perdidas');
            container.dataset.renderCaixasLock = '1';
          }
          return await _renderCaixasOrig.apply(this, arguments);
        } catch (e) {
          try { console.error('[caixas-perdidas render]', e && e.message || e); } catch (_) {}
          var c = document.querySelector('[data-secao-ativa="caixas-perdidas"]');
          if (c && !c.querySelector('.caixas-tabela, table, #cp-table')) {
            c.innerHTML += '<div style="padding:40px;text-align:center;color:var(--text2)">Sem lançamentos no período</div>';
          }
          return [];
        } finally {
          try {
            if (container) delete container.dataset.renderCaixasLock;
            var tbody2 = document.querySelector('#cp-table tbody');
            if (tbody2 && !tbody2.children.length) {
              tbody2.innerHTML = '<tr><td colspan="11" style="padding:10px;border:1px solid var(--border);color:var(--text2);text-align:center">Sem lançamentos no período</td></tr>';
            }
          } catch (_) {}
        }
      };
      window.renderCaixasPerdidas._patchSafeHotfix = true;
    }
  }

  function tick() {
    ensurePainelClienteScroll();
    hideProjecaoVendas();
    fixarBotoesRankingClientes();
    hookRenderComissoesSimple();
    patchCaixasPerdidasSafe();
    try { window.aplicarClickImagemOF(); } catch (_) {}
  }

  try {
    if (typeof window.renderProjecaoVendas === 'function' && !window.renderProjecaoVendas._patchHideWidget) {
      var origProj = window.renderProjecaoVendas;
      window.renderProjecaoVendas = async function() {
        hideProjecaoVendas();
        return null;
      };
      window.renderProjecaoVendas._patchHideWidget = true;
      window.renderProjecaoVendas._orig = origProj;
    }
  } catch (_) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 200);
      setTimeout(tick, 900);
      setTimeout(function() { try { window.aplicarClickImagemOF(); } catch (_) {} }, 2000);
    });
  } else {
    setTimeout(tick, 200);
    setTimeout(tick, 900);
    setTimeout(function() { try { window.aplicarClickImagemOF(); } catch (_) {} }, 2000);
  }

  try {
    if (window._obsRankHotfix && typeof window._obsRankHotfix.disconnect === 'function') window._obsRankHotfix.disconnect();
  } catch (_) {}
  try {
    window._obsRankHotfix = new MutationObserver(function() {
      ensurePainelClienteScroll();
      hideProjecaoVendas();
      fixarBotoesRankingClientes();
      patchCaixasPerdidasSafe();
      try { window.aplicarClickImagemOF(); } catch (_) {}
    });
    window._obsRankHotfix.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  setInterval(function() {
    try { window.aplicarClickImagemOF(); } catch (_) {}
  }, 8000);
})();

(function patchLog404Resources() {
  if (window.__patchLog404ResourcesInstalled) return;
  window.__patchLog404ResourcesInstalled = true;

  try {
    window.addEventListener('error', function(ev) {
      try {
        var t = ev && ev.target;
        if (!t) return;
        var tag = String(t.tagName || '').toLowerCase();
        if (tag === 'img' || tag === 'script' || tag === 'link') {
          var url = '';
          try { url = String(t.src || t.href || '').trim(); } catch (_) { url = ''; }
          if (url) console.warn('[404/RESOURCE]', tag, url);
        }
      } catch (_) {}
    }, true);
  } catch (_) {}

  try {
    var origFetch = window.fetch;
    if (typeof origFetch === 'function' && !origFetch._patchLog404) {
      var wrapped = function(input, init) {
        var url = '';
        try { url = input && typeof input === 'object' && input.url ? String(input.url) : String(input || ''); } catch (_) { url = ''; }
        var p = origFetch.apply(this, arguments);
        try {
          Promise.resolve(p).then(function(res) {
            try { if (res && res.status === 404) console.warn('[404/FETCH]', url); } catch (_) {}
          }).catch(function() {});
        } catch (_) {}
        return p;
      };
      wrapped._patchLog404 = true;
      window.fetch = wrapped;
    }
  } catch (_) {}
})();

(function patchOfAntiLoop() {
  try {
    if (window._patchOfProtegido) return;
    var fnNome = (typeof window.abrirOf === 'function') ? 'abrirOf' : ((typeof window.editarOf === 'function') ? 'editarOf' : '');
    if (!fnNome) return;
    var orig = window[fnNome];
    if (typeof orig !== 'function') return;
    window._patchOfProtegido = true;
    window[fnNome] = function() {
      try { if (window._abrindoOf) return; } catch (_) {}
      window._abrindoOf = true;
      try {
        return orig.apply(this, arguments);
      } finally {
        setTimeout(function() { try { window._abrindoOf = false; } catch (_) {} }, 2000);
      }
    };
  } catch (_) {}
})();

(function patchFixImgSrcVazio() {
  if (window.__patchFixImgSrcVazioInstalled) return;
  window.__patchFixImgSrcVazioInstalled = true;

  function _fixImg(img) {
    try {
      if (!img || img.tagName !== 'IMG') return;
      var src = '';
      try { src = String(img.getAttribute('src') || '').trim(); } catch (_) { src = ''; }
      var bad = !src || src === '[]' || src === 'null' || src === 'undefined' || src.indexOf('[object') >= 0 || src.indexOf('/[]') >= 0;
      if (bad) img.style.display = 'none';
    } catch (_) {}
  }

  function scan() {
    try { Array.prototype.slice.call(document.querySelectorAll('img')).forEach(_fixImg); } catch (_) {}
  }

  try { scan(); } catch (_) {}
  try { setTimeout(scan, 800); } catch (_) {}

  try {
    var _obsImg = new MutationObserver(function(muts) {
      try {
        muts.forEach(function(m) {
          Array.prototype.slice.call(m.addedNodes || []).forEach(function(n) {
            try {
              if (!n) return;
              if (n.tagName === 'IMG') _fixImg(n);
              else if (n.querySelectorAll) Array.prototype.slice.call(n.querySelectorAll('img')).forEach(_fixImg);
            } catch (_) {}
          });
        });
      } catch (_) {}
    });
    _obsImg.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
})();

(function _iniciarPollingOFs() {
  if (window.__patchPollingOFsInstalled) return;
  window.__patchPollingOFsInstalled = true;

  var _ultimaVerificacao = Date.now();
  var _rodando = false;

  function addNovasOfs(reais) {
    if (!Array.isArray(reais) || !reais.length) return;
    var targets = [
      (Array.isArray(window.OFs) ? window.OFs : null),
      (Array.isArray(window.OFS) ? window.OFS : null),
      (Array.isArray(window._OFs) ? window._OFs : null),
      (Array.isArray(window._ofsCarregadas) ? window._ofsCarregadas : null)
    ].filter(Boolean);
    targets.forEach(function(arr) {
      try { Array.prototype.unshift.apply(arr, reais); } catch (_) {}
    });
  }

  async function _verificarOFsNovas() {
    if (_rodando) return;
    _rodando = true;
    try {
      var token = '';
      try { token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || '').trim(); } catch (_) { token = ''; }
      if (!token) return;
      var ts = '';
      try { ts = new Date(_ultimaVerificacao - 5000).toISOString(); } catch (_) { ts = ''; }
      var resp = await fetch('/api/ofs?after=' + encodeURIComponent(ts) + '&limit=50&offset=0', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!resp.ok) return;
      var json = await resp.json().catch(function() { return null; });
      var novas = (json && (json.data || json.ofs)) ? (json.data || json.ofs) : [];
      if (!Array.isArray(novas) || !novas.length) {
        _ultimaVerificacao = Date.now();
        return;
      }

      var baseArr = Array.isArray(window.OFs) ? window.OFs : (Array.isArray(window.OFS) ? window.OFS : (Array.isArray(window._OFs) ? window._OFs : []));
      var idsExistentes = new Set((baseArr || []).map(function(o) { return String(o && o.id || '').trim(); }).filter(Boolean));
      var reais = novas.filter(function(o) {
        var id = String(o && o.id || '').trim();
        return id && !idsExistentes.has(id);
      });
      if (reais.length) {
        addNovasOfs(reais);
        try {
          var pcp = document.getElementById('page-pcp');
          var arm = document.getElementById('page-armazenamento');
          var visPcp = pcp && pcp.style.display !== 'none';
          var visArm = arm && arm.style.display !== 'none';
          if (visPcp && typeof window.renderPCP === 'function') window.renderPCP();
          if (visArm && typeof window.renderArmazenamento === 'function') window.renderArmazenamento();
          if ((visPcp || visArm) && typeof window.carregarOFs === 'function') {
            try { window.carregarOFs(true); } catch (_) {}
          }
        } catch (_) {}
        try { console.log('[POLL] ' + reais.length + ' OF(s) nova(s) detectada(s)'); } catch (_) {}
      }
      _ultimaVerificacao = Date.now();
    } catch (e) {
      try { console.warn('[POLL] erro:', e && e.message); } catch (_) {}
    } finally {
      _rodando = false;
    }
  }

  setInterval(_verificarOFsNovas, 30000);
})();

(function patchBackupNotifEChapas() {
  if (window.__patchBackupNotifEChapasInstalled) return;
  window.__patchBackupNotifEChapasInstalled = true;

  function _tokenAuth() {
    try {
      return String(localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim();
    } catch (_) {
      return '';
    }
  }

  window._notificacaoOF = function(mensagem, tipo) {
    tipo = tipo || 'sucesso';
    try {
      var anterior = document.getElementById('notif-of-overlay');
      if (anterior) anterior.remove();
    } catch (_) {}

    var cores = {
      sucesso: { bg: '#16a34a', icon: 'OK' },
      criada: { bg: '#6366f1', icon: 'OF' },
      erro: { bg: '#dc2626', icon: 'ERRO' }
    };
    var cor = cores[tipo] || cores.sucesso;

    var el = document.createElement('div');
    el.id = 'notif-of-overlay';
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'pointer-events:none'
    ].join(';');
    el.innerHTML = ''
      + '<div style="background:' + cor.bg + ';color:#fff;padding:32px 48px;border-radius:16px;font-size:28px;font-weight:700;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:notifSlideIn 0.3s ease;max-width:80vw">'
      + '<div style="font-size:32px;margin-bottom:12px">' + cor.icon + '</div>'
      + String(mensagem || '')
      + '</div>';

    if (!document.getElementById('notif-style')) {
      var style = document.createElement('style');
      style.id = 'notif-style';
      style.textContent = ''
        + '@keyframes notifSlideIn {'
        + 'from { opacity:0; transform: scale(0.8); }'
        + 'to { opacity:1; transform: scale(1); }'
        + '}';
      document.head.appendChild(style);
    }

    document.body.appendChild(el);
    setTimeout(function() {
      try { el.remove(); } catch (_) {}
    }, 3000);
  };

  function _avisar(msg, tipo) {
    try {
      if (typeof window._notificacaoOF === 'function') return window._notificacaoOF(msg, tipo);
    } catch (_) {}
    try {
      if (typeof toast === 'function') return toast(msg, tipo === 'erro' ? 'var(--red)' : 'var(--green)');
    } catch (_) {}
    try { alert(msg); } catch (_) {}
  }

  async function _exportarBackup() {
    var token = _tokenAuth();
    try {
      var resp = await fetch('/api/backup/exportar', {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var blob = await resp.blob();
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'backup-italy-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        try { URL.revokeObjectURL(url); } catch (_) {}
        try { a.remove(); } catch (_) {}
      }, 300);
      _avisar('Backup exportado com sucesso!', 'sucesso');
    } catch (e) {
      _avisar('Erro ao exportar: ' + String(e && e.message || e), 'erro');
    }
  }

  async function _importarBackup() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async function(e) {
      var file = e && e.target && e.target.files && e.target.files[0];
      if (!file) return;
      var texto = await file.text();
      var dados = null;
      try {
        dados = JSON.parse(texto);
      } catch (_) {
        alert('Arquivo JSON inválido');
        return;
      }

      var totalOfs = Number(dados && dados.total_ofs || (Array.isArray(dados && dados.ofs) ? dados.ofs.length : 0)) || 0;
      var totalClientes = Number(dados && dados.total_clientes || (Array.isArray(dados && dados.clientes) ? dados.clientes.length : 0)) || 0;
      if (!confirm('Importar ' + totalOfs + ' OFs e ' + totalClientes + ' clientes?\nIsso vai atualizar registros existentes.')) return;

      try {
        var token = _tokenAuth();
        var resp = await fetch('/api/backup/importar', {
          method: 'POST',
          headers: Object.assign(
            { 'Content-Type': 'application/json' },
            token ? { Authorization: 'Bearer ' + token } : {}
          ),
          body: JSON.stringify(dados)
        });
        var json = await resp.json().catch(function() { return null; });
        if (!resp.ok || !json || json.ok === false) {
          throw new Error(String(json && json.error || 'falha ao importar'));
        }
        _avisar('Importado! ' + json.ofs_importadas + ' OFs e ' + json.clientes_importados + ' clientes', 'sucesso');
        if (json.erros && json.erros.length) console.warn('[IMPORT] erros:', json.erros);
      } catch (err) {
        alert('Erro ao importar: ' + String(err && err.message || err));
      }
    };
    input.click();
  }

  window._exportarBackup = _exportarBackup;
  window._importarBackup = _importarBackup;

  function _adicionarBotoesBackup() {
    try {
      var toolbar = document.querySelector(
        '#page-pcp .topbar-actions, #page-armazenamento .toolbar, ' +
        '#page-pcp .pcp-actions, #page-armazenamento .top-bar, ' +
        '.armazenamento-toolbar, [data-page="pcp"] .actions, #page-pcp .ptoolbar'
      );
      if (!toolbar || toolbar.dataset.backupAdded === '1') return;
      toolbar.dataset.backupAdded = '1';

      var btnExportar = document.createElement('button');
      btnExportar.className = 'btn btn-ghost btn-sm';
      btnExportar.id = 'btn-backup-exportar';
      btnExportar.textContent = 'Exportar JSON';
      btnExportar.style.cssText = 'font-size:.75rem;padding:6px 12px;border-radius:6px';
      btnExportar.onclick = function() { _exportarBackup(); };

      var btnImportar = document.createElement('button');
      btnImportar.className = 'btn btn-ghost btn-sm';
      btnImportar.id = 'btn-backup-importar';
      btnImportar.textContent = 'Importar JSON';
      btnImportar.style.cssText = 'font-size:.75rem;padding:6px 12px;border-radius:6px';
      btnImportar.onclick = function() { _importarBackup(); };

      toolbar.appendChild(btnExportar);
      toolbar.appendChild(btnImportar);
    } catch (_) {}
  }

  function _wrapNotifFn(fnName, mensagem, tipo, shouldSkip) {
    try {
      var orig = window[fnName];
      if (typeof orig !== 'function' || orig._patchNotifOfWrapped) return;
      var wrapped = async function() {
        var skip = false;
        try { skip = typeof shouldSkip === 'function' ? !!shouldSkip() : false; } catch (_) {}
        var result = await orig.apply(this, arguments);
        if (!skip) {
          setTimeout(function() {
            try { window._notificacaoOF(mensagem, tipo); } catch (_) {}
          }, 500);
        }
        return result;
      };
      wrapped._patchNotifOfWrapped = true;
      window[fnName] = wrapped;
    } catch (_) {}
  }

  function _patchNotificacoesOF() {
    _wrapNotifFn('salvarOfRapida', 'OF Criada com Sucesso!', 'criada', function() { return !!window._ofRapidaEditandoId; });
    _wrapNotifFn('salvarNovaOfRapida', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('salvarOFRapida', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('salvarNovaOF', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('salvarOF', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('criarOf', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('concluirOfPainel', 'OF Concluída com Sucesso!', 'sucesso');
    _wrapNotifFn('concluirOfModal', 'OF Concluída com Sucesso!', 'sucesso');
    _wrapNotifFn('concluirOf', 'OF Concluída com Sucesso!', 'sucesso');
    _wrapNotifFn('confirmarConclusao', 'OF Concluída com Sucesso!', 'sucesso');
  }

  (function _paginacaoChapas() {
    var paginaAtual = 0;
    var POR_PAGINA = 10;

    function _linhasFiltradas() {
      var busca = String((document.getElementById('sc-busca') || {}).value || '').toLowerCase();
      var status = String((document.getElementById('sc-status') || {}).value || '').trim();
      return Array.prototype.slice.call(document.querySelectorAll('#sc-tbody .sc-linha')).filter(function(tr) {
        var matchB = !busca || String(tr.dataset.busca || '').includes(busca);
        var matchS = !status || String(tr.dataset.status || '') === status;
        return matchB && matchS;
      });
    }

    function _renderPaginado() {
      var container = document.querySelector('#sc-tbody');
      if (!container) return;

      var todasLinhas = Array.prototype.slice.call(container.querySelectorAll('.sc-linha'));
      if (!todasLinhas.length) return;

      var filtradas = _linhasFiltradas();
      var total = filtradas.length;
      var totalPags = Math.max(1, Math.ceil(total / POR_PAGINA));
      if (paginaAtual >= totalPags) paginaAtual = totalPags - 1;
      if (paginaAtual < 0) paginaAtual = 0;

      todasLinhas.forEach(function(el) { el.style.display = 'none'; });
      filtradas.forEach(function(el, i) {
        el.style.display = (i >= paginaAtual * POR_PAGINA && i < (paginaAtual + 1) * POR_PAGINA) ? '' : 'none';
      });

      var paginador = document.getElementById('chapas-paginador');
      if (total <= POR_PAGINA) {
        if (paginador) paginador.remove();
        return;
      }

      if (!paginador) {
        paginador = document.createElement('div');
        paginador.id = 'chapas-paginador';
        paginador.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px;justify-content:center;margin-top:8px';
        var host = container.closest('table');
        host = host && host.parentElement ? host.parentElement : (container.parentElement || container);
        host.appendChild(paginador);
      }

      paginador.innerHTML = ''
        + '<button type="button" onclick="window._chapasAnterior()" ' + (paginaAtual === 0 ? 'disabled' : '') + ' style="padding:8px 16px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg2,#1a1a2e);color:var(--text1,#fff);cursor:pointer;' + (paginaAtual === 0 ? 'opacity:.4;' : '') + '">&larr; Anterior</button>'
        + '<span style="color:var(--text2,#aaa);font-size:13px">Pagina ' + (paginaAtual + 1) + ' de ' + totalPags + ' <span style="font-size:11px">(' + total + ' OFs)</span></span>'
        + '<button type="button" onclick="window._chapasProximo()" ' + (paginaAtual >= totalPags - 1 ? 'disabled' : '') + ' style="padding:8px 16px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg2,#1a1a2e);color:var(--text1,#fff);cursor:pointer;' + (paginaAtual >= totalPags - 1 ? 'opacity:.4;' : '') + '">Proximo &rarr;</button>';
    }

    window._chapasAnterior = function() {
      if (paginaAtual > 0) {
        paginaAtual -= 1;
        _renderPaginado();
      }
    };

    window._chapasProximo = function() {
      paginaAtual += 1;
      _renderPaginado();
    };

    function _wrapSelChapas(fnName, resetPage) {
      try {
        var orig = window[fnName];
        if (typeof orig !== 'function' || orig._patchChapasPaginado) return;
        window[fnName] = function() {
          var result = orig.apply(this, arguments);
          if (resetPage) paginaAtual = 0;
          setTimeout(_renderPaginado, 150);
          setTimeout(_renderPaginado, 500);
          return result;
        };
        window[fnName]._patchChapasPaginado = true;
      } catch (_) {}
    }

    function _tickChapas() {
      _wrapSelChapas('renderSelecaoChapas', true);
      _wrapSelChapas('filtrarTabelaSelChapas', false);
      try {
        var pg = document.querySelector('#page-sel-chapas');
        if (pg && pg.style.display !== 'none' && document.getElementById('sc-tbody')) {
          setTimeout(_renderPaginado, 120);
        }
      } catch (_) {}
    }

    var obsChapas = new MutationObserver(function() {
      try {
        var pg = document.querySelector('#page-sel-chapas');
        if (pg && pg.style.display !== 'none') {
          paginaAtual = 0;
          setTimeout(_tickChapas, 150);
        }
      } catch (_) {}
    });
    obsChapas.observe(document.body, { childList: true, subtree: true });
    setTimeout(_tickChapas, 400);
    setInterval(_tickChapas, 1500);
  })();

  try {
    var obsBackup = new MutationObserver(function() {
      _adicionarBotoesBackup();
      _patchNotificacoesOF();
    });
    obsBackup.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}

  setTimeout(_adicionarBotoesBackup, 600);
  setTimeout(_adicionarBotoesBackup, 1200);
  setInterval(_patchNotificacoesOF, 1500);
  _patchNotificacoesOF();
})();

function _renderTabelaVendedores(json) {
  try {
    if (!json || !json.vendedores || !json.vendedores.length) return;
    var pg = document.querySelector('#page-comissoes, [data-page="comissoes"]');
    if (!pg) return;
    var tbody = document.querySelector('#tabela-comissoes-vendedor tbody');
    if (!tbody) {
      var tbodies = pg.querySelectorAll('tbody');
      tbody = tbodies && tbodies[0] ? tbodies[0] : null;
    }
    if (!tbody) return;
    var fmt = function(v) {
      return 'R$\u00a0' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    tbody.innerHTML = (json.vendedores || []).map(function(v) {
      return ''
        + '<tr>'
        + '<td style="padding:10px 14px">' + String(v && v.nome || '—') + '</td>'
        + '<td style="text-align:center;padding:10px 14px">' + String(Number(v && v.ofs || 0) || 0) + '</td>'
        + '<td style="text-align:right;padding:10px 14px">' + fmt(v && v.total) + '</td>'
        + '<td style="text-align:center;padding:10px 14px">' + (Number(v && v.comissao_pct || 1) || 1).toFixed(2) + '%</td>'
        + '<td style="text-align:right;padding:10px 14px;color:#4ade80;font-weight:600">' + fmt(v && v.comissao_rs) + '</td>'
        + '<td style="padding:10px 14px">—</td>'
        + '</tr>';
    }).join('') + ''
      + '<tr style="font-weight:700;border-top:2px solid var(--border,#333)">'
      + '<td style="padding:10px 14px">TOTAL</td>'
      + '<td style="text-align:center;padding:10px 14px">' + String(json.total_ofs || 0) + '</td>'
      + '<td style="text-align:right;padding:10px 14px">' + fmt(json.total_vendido) + '</td>'
      + '<td></td>'
      + '<td style="text-align:right;padding:10px 14px;color:#4ade80">' + fmt(json.total_comissao) + '</td>'
      + '<td></td>'
      + '</tr>';
  } catch (_) {}
}

function _renderTabelaOFs(json) {
  try {
    if (!json || !json.ofs || !json.ofs.length) return;
    var pg = document.querySelector('#page-comissoes, [data-page="comissoes"]');
    if (!pg) return;
    var tbody = document.querySelector('#tabela-comissoes-ofs tbody');
    if (!tbody) {
      var tbodies = pg.querySelectorAll('tbody');
      tbody = (tbodies && tbodies[1]) ? tbodies[1] : (tbodies && tbodies[0] ? tbodies[0] : null);
    }
    if (!tbody) return;
    var fmt = function(v) {
      return 'R$\u00a0' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    var fmtD = function(d) {
      if (!d) return '—';
      try { return new Date(d).toLocaleDateString('pt-BR'); } catch (_) { return '—'; }
    };
    var porVendedor = {};
    (json.ofs || []).forEach(function(of) {
      var v = String(of && of.vendedor || 'Sem Vendedor').trim() || 'Sem Vendedor';
      if (!porVendedor[v]) porVendedor[v] = [];
      porVendedor[v].push(of);
    });
    var html = '';
    Object.keys(porVendedor).forEach(function(vendNome) {
      var lista = porVendedor[vendNome] || [];
      var totalVend = lista.reduce(function(s, o) { return s + (Number(o && o.valor_total || 0) || 0); }, 0);
      var totalCom = lista.reduce(function(s, o) { return s + (Number(o && o.comissao_rs || 0) || 0); }, 0);
      html += ''
        + '<tr style="background:var(--accent,#6366f1);color:#fff;font-weight:700">'
        + '<td colspan="12" style="padding:8px 12px">👤 ' + String(vendNome) + ' — ' + String(lista.length) + ' OFs — ' + fmt(totalVend) + ' — Comissão: ' + fmt(totalCom) + '</td>'
        + '</tr>';
      html += lista.map(function(of) {
        return ''
          + '<tr>'
          + '<td style="padding:7px 12px">#' + String(of && of.numero || '—') + '</td>'
          + '<td style="padding:7px 12px">' + String(of && of.cliente || '—') + '</td>'
          + '<td style="padding:7px 12px">' + String((of && (of.produto || of.descricao)) || '—') + '</td>'
          + '<td style="padding:7px 12px;text-align:center">' + String((of && of.qtd) != null ? (of.qtd || 0) : '—') + '</td>'
          + '<td style="padding:7px 12px">' + String(of && of.vendedor || '—') + '</td>'
          + '<td style="padding:7px 12px;text-align:right">' + fmt(of && of.valor_total) + '</td>'
          + '<td style="padding:7px 12px;text-align:center">' + (Number(of && of.comissao_pct || 1) || 1).toFixed(2) + '%</td>'
          + '<td style="padding:7px 12px;text-align:right;color:#4ade80">' + fmt(of && of.comissao_rs) + '</td>'
          + '<td style="padding:7px 12px">' + fmtD(of && of.created_at) + '</td>'
          + '<td style="padding:7px 12px">' + fmtD(of && of.data_conclusao) + '</td>'
          + '<td style="padding:7px 12px">' + String(of && of.status || '—') + '</td>'
          + '<td style="padding:7px 12px;text-align:center">'
          + '<button onclick=\"window.abrirOf&&window.abrirOf(' + JSON.stringify(String(of && of.id || '')) + ')\" style=\"padding:3px 8px;border-radius:4px;border:1px solid var(--border,#333);background:transparent;color:var(--text1,#fff);cursor:pointer;font-size:10px\">Traçar</button>'
          + '</td>'
          + '</tr>';
      }).join('');
    });
    tbody.innerHTML = html;
  } catch (_) {}
}

(function() {
  if (window.__patchComissoesUnicaDefinicao) return;
  window.__patchComissoesUnicaDefinicao = true;
  var _comCalcEmAndamento = false;

  window.__comissoesPatchCalcular = async function() {
    if (_comCalcEmAndamento) return;
    _comCalcEmAndamento = true;
    var inp = null;
    try {
      try { inp = document.querySelector('input[type=\"month\"]'); } catch (_) { inp = null; }
      if (inp && !String(inp.value || '').trim()) {
        try {
          var hoje = new Date();
          inp.value = String(hoje.getFullYear()) + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
        } catch (_) {}
      }

      var val = '';
      try { val = String(inp && inp.value || '').trim(); } catch (_) { val = ''; }
      var anoNum = '';
      var mesNum = '';
      if (val && val.indexOf('-') >= 0) {
        anoNum = val.split('-')[0];
        mesNum = val.split('-')[1];
      }
      if (!mesNum || !anoNum) {
        var h = new Date();
        anoNum = String(h.getFullYear());
        mesNum = String(h.getMonth() + 1).padStart(2, '0');
      }

      try { console.log('[COM PATCH] chamando API mes=' + mesNum + ' ano=' + anoNum); } catch (_) {}

      var token = '';
      try { token = String(localStorage.getItem('token') || '').trim(); } catch (_) {}

      var resp = await fetch('/api/comissoes/relatorio?mes=' + encodeURIComponent(mesNum) + '&ano=' + encodeURIComponent(anoNum), { headers: { Authorization: 'Bearer ' + token } });
      var json = await resp.json().catch(function() { return null; });
      try { console.log('[COM PATCH] resposta:', json && json.ok, json && json.total_ofs, json && json.total_vendido); } catch (_) {}
      if (!json || !json.ok) {
        try { console.error('[COM PATCH] erro:', json && json.error); } catch (_) {}
        return;
      }
      window._comissoesSqlData = json;
      window._comissoesData = {
        totalGeral: json.total_vendido,
        totalComissao: json.total_comissao,
        totalPedidos: json.total_ofs,
        vendedores: (json.vendedores || []).map(function(v) {
          var out = Object.assign({}, v);
          out.vendNome = v.nome;
          out.nome = v.nome;
          out.vendId = v.id;
          out.total = v.total;
          out.peds = v.ofs;
          out.comissaoRs = v.comissao_rs;
          out.comissao = v.comissao_pct;
          out.comissao_pct = v.comissao_pct;
          out.ofsList = [];
          return out;
        })
      };
      try {
        var fmt = function(v) { return 'R$\u00a0' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };
        var setEl = function(sel, v) { var el = document.querySelector(sel); if (el) el.textContent = v; };
        setEl('#com-total-vendido, [data-com=\"total_vendido\"]', fmt(json.total_vendido));
        setEl('#com-total-comissao, [data-com=\"total_comissao\"]', fmt(json.total_comissao));
        setEl('#com-total-ofs, [data-com=\"total_ofs\"]', String(json.total_ofs || 0));
      } catch (_) {}

      try { if (typeof window.renderComissoes === 'function') window.renderComissoes(); } catch (_) {}
      setTimeout(function() { _renderTabelaVendedores(json); _renderTabelaOFs(json); }, 500);
    } catch (e) {
      try { console.error('[COM PATCH] fetch erro:', e && e.message); } catch (_) {}
    } finally {
      setTimeout(function() { _comCalcEmAndamento = false; }, 3000);
    }
  };

  function _vincularBtnCalcularComissoes() {
    try {
      var pg = document.querySelector('#page-comissoes, [id*="comiss"], [data-page="comissoes"]');
      if (!pg) return;
      Array.prototype.slice.call(pg.querySelectorAll('button')).forEach(function(btn) {
        try {
          if (!btn) return;
          var txt = String(btn.textContent || '').trim();
          if (txt !== 'Calcular') return;
          if (btn.dataset && btn.dataset.comPatch2 === '1') return;
          try { btn.onclick = null; } catch (_) {}
          try { btn.removeAttribute('onclick'); } catch (_) {}
          var novo = btn.cloneNode(true);
          btn.parentNode.replaceChild(novo, btn);
          novo.dataset.comPatch2 = '1';
          novo.addEventListener('click', function(e) {
            try { e.preventDefault(); } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
            try { e.stopImmediatePropagation(); } catch (_) {}
            try { console.log('[COM] botão Calcular encontrado, vinculando...'); } catch (_) {}
            window.calcularComissoes();
          }, true);
        } catch (_) {}
      });
    } catch (_) {}
  }

  function _instalarOverrideComissoes() {
    try {
      if (typeof window.__comissoesPatchCalcular === 'function') {
        window.calcularComissoes = window.__comissoesPatchCalcular;
        window.gerarRelatorioComissoes = window.__comissoesPatchCalcular;
        window.renderRelatorioComissoes = window.__comissoesPatchCalcular;
      }
    } catch (_) {}
    try { _vincularBtnCalcularComissoes(); } catch (_) {}
  }

  try { _instalarOverrideComissoes(); } catch (_) {}
  try { setTimeout(_instalarOverrideComissoes, 300); } catch (_) {}
  try { setTimeout(_instalarOverrideComissoes, 1200); } catch (_) {}
})();

(function() {
  if (window.__patchCoresItensOF) return;
  window.__patchCoresItensOF = true;
  document.addEventListener('click', function(e) {
    try {
      var corBtn = e && e.target && (e.target.closest ? e.target.closest('[data-cor], .cor-btn, .color-tag') : null);
      if (!corBtn) return;
      var itemContainer = corBtn.closest ? corBtn.closest('[data-item-idx], .item-adicional, .of-item') : null;
      if (!itemContainer) return;
      corBtn.classList.toggle('selected');
      corBtn.classList.toggle('active');
      var isSelected = corBtn.classList.contains('selected') || corBtn.classList.contains('active');
      try { corBtn.style.opacity = isSelected ? '1' : '0.4'; } catch (_) {}
      try { corBtn.style.outline = isSelected ? '2px solid #fff' : 'none'; } catch (_) {}

      var corVal = '';
      try { corVal = String(corBtn.getAttribute('data-cor') || corBtn.dataset.cor || corBtn.textContent || '').trim(); } catch (_) { corVal = ''; }
      if (corVal) {
        var raw = String(itemContainer.dataset.coresSel || '[]');
        var arr = [];
        try { arr = JSON.parse(raw); } catch (_) { arr = []; }
        if (!Array.isArray(arr)) arr = [];
        var exists = arr.indexOf(corVal) >= 0;
        if (isSelected && !exists) arr.push(corVal);
        if (!isSelected && exists) arr = arr.filter(function(x) { return x !== corVal; });
        itemContainer.dataset.coresSel = JSON.stringify(arr);
        try {
          var hidden = itemContainer.querySelector('input[type=hidden][name*=\"cor\"], input[type=hidden][name*=\"cores\"]');
          if (hidden) hidden.value = itemContainer.dataset.coresSel;
        } catch (_) {}
      }

      var counter = itemContainer.querySelector ? itemContainer.querySelector('[class*=\"cores-sel\"], [data-cores-count]') : null;
      var selecionadas = 0;
      try {
        selecionadas = itemContainer.querySelectorAll('[data-cor].selected, [data-cor].active, .cor-btn.selected, .cor-btn.active, .color-tag.selected, .color-tag.active').length;
      } catch (_) { selecionadas = 0; }
      if (counter) {
        try { counter.textContent = String(selecionadas) + ' cores selecionadas'; } catch (_) {}
      }
    } catch (_) {}
  }, true);
})();

(function() {
  if (window.__patchNotifUnicaInstalled) return;
  window.__patchNotifUnicaInstalled = true;
  var _notifAtiva = false;

  function _instalar() {
    try {
      var orig = window._notificacaoOF;
      if (typeof orig !== 'function') return;
      if (orig.__patchNotifUnicaWrapped) return;
      var wrapped = function(msg, tipo) {
        if (_notifAtiva) return;
        _notifAtiva = true;
        setTimeout(function() { _notifAtiva = false; }, 4000);
        return orig.call(this, msg, tipo);
      };
      wrapped.__patchNotifUnicaWrapped = true;
      window._notificacaoOF = wrapped;
    } catch (_) {}
  }

  try { _instalar(); } catch (_) {}
  try { setTimeout(_instalar, 800); } catch (_) {}
  try { setInterval(_instalar, 2500); } catch (_) {}
})();
