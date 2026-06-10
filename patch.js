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
  .kanban-board .of-card img,
  [id*="kanban"] .of-card img,
  .ofs-maquina-board .of-card img {
    width: 100% !important;
    height: auto !important;
    max-height: 120px !important;
    object-fit: cover !important;
    border-radius: 6px !important;
    display: block !important;
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
        var lista = d.data || d.ofs || (Array.isArray(d) ? d : []); 
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
    try{ if (typeof window.go === 'function') window.go(pid); }catch(e){}
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
 
  new MutationObserver(function(muts) { 
    var encontrou = muts.some(function(m) { 
      return Array.from(m.addedNodes).some(function(n) { 
        return n.nodeType === 1 && ( 
          (n.classList && n.classList.contains('maq-header')) || 
          (n.querySelector && n.querySelector('.maq-header')) 
        ); 
      }); 
    }); 
    if (encontrou) setTimeout(aplicarAccordion, 200); 
  }).observe(document.body, { childList: true, subtree: true }); 
 
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

  var _fnOrigOfRapida = null;
 
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
 
  function patchGoAcordeon() { 
    if (window.go && !window.go._patched) { 
      var _origGoAcordeon = window.go; 
      window.go = function(page) { 
        var res = typeof _origGoAcordeon === 'function' ? _origGoAcordeon.apply(this, arguments) : undefined; 
        var p = String(page || ''); 
        if (String(page || '').toLowerCase() === 'dashboard') { 
          setTimeout(function() { 
            try { if (typeof window.renderProjecaoVendas === 'function') window.renderProjecaoVendas(); } catch(_) {} 
          }, 400); 
        } 
        if (p === 'ofmaq' || p.indexOf('maq') >= 0) { 
          [300, 600, 1000, 1500, 2000, 3000].forEach(function(delay) { 
            setTimeout(function() { 
              var headers = document.querySelectorAll('.maq-header'); 
              if (headers.length > 0) { 
                aplicarAccordion(); 
                console.log('[PATCH] accordion aplicado em ofmaq apos ' + delay + 'ms: ' + headers.length + ' headers'); 
              } 
            }, delay); 
          }); 
        } 
        if (p === 'hub') { 
          setTimeout(function() { window.carregarPassagensHoje(); }, 400); 
        } 
        return res; 
      }; 
      window.go._patched = true; 
    } 
  } 
 
  console.log('[PATCH] v3 ativo - Italy Embalagens ERP'); 
  patchToggleMobMenu(); 
  patchRenderHub(); 
  patchGoAcordeon(); 
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
      patchGoAcordeon(); 
    } catch(e) {} 
  }, 1000); 
 
})(); 

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

(function patchEstoquesTintasMateriaisFacasCamposV1() {
  function _tok() {
    try { return String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { return ''; }
  }
  function _hdrAuth() {
    var t = _tok();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }
  function _hdrJson() {
    var h = { 'Content-Type': 'application/json' };
    var t = _tok();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }
  function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _emp() {
    try { return String(window.EMP_FILTRO || '').trim() || 'E1'; } catch (_) { return 'E1'; }
  }
  function _empresaQs(extra) {
    var qs = [];
    var empresaId = String((window.CURRENT_USER?.empresa_id || window.CURRENT_USER?.empId || '')).trim();
    if (empresaId) qs.push('empresa_id=' + encodeURIComponent(empresaId));
    if (extra) qs.push(String(extra));
    return qs.join('&');
  }
  function _toast(msg, cor) {
    try { if (typeof window.toast === 'function') return window.toast(msg, cor); } catch (_) {}
    try { alert(msg); } catch (_) {}
  }
  function _isMobile() {
    try { return typeof window.isMobile === 'function' ? !!window.isMobile() : (window.innerWidth < 760); } catch (_) { return window.innerWidth < 760; }
  }
  function _fmtMoney(v) {
    var n = Number(v || 0) || 0;
    try { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); } catch (_) { return 'R$ ' + n.toFixed(2); }
  }
  function _fmtDateBR(iso) {
    var s = String(iso || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
    var y = s.slice(0, 4), m = s.slice(5, 7), d = s.slice(8, 10);
    return d + '/' + m + '/' + y;
  }
  function _daysBetween(a, b) {
    var ta = (a instanceof Date) ? a.getTime() : new Date(a).getTime();
    var tb = (b instanceof Date) ? b.getTime() : new Date(b).getTime();
    if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
    return Math.floor((ta - tb) / 86400000);
  }

  function _ensureDrawerModules() {
    try {
      var mods = Array.isArray(window._DRAWER_MODULOS) ? window._DRAWER_MODULOS : null;
      if (mods) {
        var add = function(id, label, icone) {
          if (mods.some(function(m) { return String(m?.id || '') === id; })) return;
          mods.push({ id: id, label: label, icone: icone, grupo: 'Estoques' });
        };
        if (!mods.some(function(m) { return String(m?.id || '') === 'dashboard-estoques'; })) {
          mods.unshift({ id: 'dashboard-estoques', label: 'Dashboard Estoques', icone: '📊', grupo: 'Estoques' });
        }
        add('historico-movimentos', 'Histórico Movimentos', '🕘');
        add('estoque-tintas', 'Estoque de Tintas', '🎨');
        add('estoque-materiais', 'Estoque de Materiais', '🧰');
      }
      var mods2 = Array.isArray(window._DRAWER_MODULOS) ? window._DRAWER_MODULOS : null;
      if (mods2 && !mods2.some(function(m) { return String(m?.id || '') === 'custo-producao'; })) {
        mods2.push({ id: 'custo-producao', label: 'Custo Produção', icone: '🧾', grupo: 'Financeiro' });
      }
    } catch (_) {}
  }

  function _ensurePage(id, title) {
    var pid = 'page-' + id;
    var el = document.getElementById(pid);
    if (el) return el;
    el = document.createElement('div');
    el.id = pid;
    el.className = 'page';
    el.style.display = 'none';
    el.innerHTML =
      '<div class="ptoolbar" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
        '<h2 style="margin:0;color:#e2e8f0;font-size:18px">' + _esc(title) + '</h2>' +
        '<div style="flex:1"></div>' +
        '<button class="btn btn-ghost btn-sm" id="' + _esc(id) + '-refresh">↻ Atualizar</button>' +
        '<button class="btn btn-accent btn-sm" id="' + _esc(id) + '-add">＋ Adicionar</button>' +
      '</div>' +
      '<div class="page-body" id="' + _esc(id) + '-body"></div>';
    document.body.appendChild(el);
    return el;
  }

  function _patchGoEstoques() {
    var origGo = window.go;
    if (typeof origGo !== 'function' || origGo._patchEstoquesPagesV1) return;
    var wrapped = function(id) {
      var r = origGo.apply(this, arguments);
      var pid = String(id || '').trim();
      setTimeout(function() {
        try {
          if (pid === 'estoque-tintas') _renderTintasPage(true);
          else if (pid === 'estoque-materiais') _renderMateriaisPage(true);
          else if (pid === 'dashboard-estoques') _renderDashboardEstoques(true);
        } catch (e) {
          try { _toast('Erro ao abrir ' + pid, 'var(--red)'); } catch (_) {}
        }
      }, 10);
      return r;
    };
    wrapped._patchEstoquesPagesV1 = true;
    window.go = wrapped;
  }

  function _statusBadge(qtd, min) {
    var q = Number(qtd || 0) || 0;
    var m = Number(min || 0) || 0;
    if (m <= 0) return '<span style="background:#334155;color:#e2e8f0;border-radius:999px;padding:3px 8px;font-size:11px">ok</span>';
    if (q <= 0) return '<span style="background:#ef4444;color:#fff;border-radius:999px;padding:3px 8px;font-size:11px">crítico</span>';
    if (q < m) return '<span style="background:#f59e0b;color:#111827;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:900">baixo</span>';
    return '<span style="background:#10b981;color:#06281a;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:900">ok</span>';
  }

  function _openModal(opts) {
    try { document.getElementById(opts.id + '-ov')?.remove(); } catch (_) {}
    try { document.getElementById(opts.id + '-m')?.remove(); } catch (_) {}
    var ov = document.createElement('div');
    ov.id = opts.id + '-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,0.72);backdrop-filter:blur(3px)';
    var m = document.createElement('div');
    m.id = opts.id + '-m';
    m.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99991;background:#0d1320;border:1px solid rgba(255,255,255,0.12);border-radius:14px;width:min(720px,96vw);max-height:92vh;overflow:auto;box-shadow:0 22px 70px rgba(0,0,0,0.7)';
    ov.onclick = function(e) { if (e && e.target === ov) close(); };
    function close() { try { ov.remove(); } catch (_) {} try { m.remove(); } catch (_) {} }
    m.innerHTML =
      '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;gap:10px">' +
        '<div style="font-weight:900;color:#e2e8f0">' + _esc(opts.title || '') + '</div>' +
        '<button type="button" id="' + _esc(opts.id) + '-close" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer">✕</button>' +
      '</div>' +
      '<div style="padding:14px 16px" id="' + _esc(opts.id) + '-content"></div>';
    document.body.appendChild(ov);
    document.body.appendChild(m);
    m.querySelector('#' + opts.id + '-close').onclick = close;
    var host = m.querySelector('#' + opts.id + '-content');
    try { if (typeof opts.render === 'function') opts.render(host, close); } catch (_) {}
    return { close: close, el: m, ov: ov };
  }

  async function _apiJson(url, opts) {
    var r = await fetch(url, opts);
    var j = await r.json().catch(function() { return null; });
    if (!r.ok || !j || j.ok === false) {
      var msg = (j && j.error) ? String(j.error) : ('HTTP ' + r.status);
      throw new Error(msg);
    }
    return j;
  }

  function _ensurePageSimple(id, title) {
    var pid = 'page-' + id;
    var el = document.getElementById(pid);
    if (el) return el;
    el = document.createElement('div');
    el.id = pid;
    el.className = 'page';
    el.style.display = 'none';
    el.innerHTML =
      '<div class="ptoolbar" style="gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center">' +
        '<h2 style="margin:0;color:#e2e8f0;font-size:18px">' + _esc(title) + '</h2>' +
        '<div style="flex:1"></div>' +
        '<button class="btn btn-ghost btn-sm" id="' + _esc(id) + '-refresh">↻ Atualizar</button>' +
      '</div>' +
      '<div class="page-body" id="' + _esc(id) + '-body"></div>';
    document.body.appendChild(el);
    return el;
  }

  var _cacheChapas = { ts: 0, items: [] };
  async function _loadChapas(force) {
    if (!force && (Date.now() - _cacheChapas.ts) < 4000) return _cacheChapas.items;
    var url = '/api/chapas_estoque?nocache=1&t=' + Date.now();
    try { url += '&empId=' + encodeURIComponent(_emp()); } catch (_) {}
    var j = await _apiJson(url, { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } });
    var rows = (j && Array.isArray(j.data)) ? j.data : (Array.isArray(j?.chapas) ? j.chapas : (Array.isArray(j) ? j : []));
    _cacheChapas = { ts: Date.now(), items: Array.isArray(rows) ? rows : [] };
    return _cacheChapas.items;
  }

  function _stockClass(qtd, min) {
    var q = Number(qtd || 0) || 0;
    var m = Number(min || 0) || 0;
    if (m > 0 && q <= 0) return 'crit';
    if (m > 0 && q <= (m * 0.5)) return 'crit';
    if (m > 0 && q < m) return 'alert';
    return 'ok';
  }

  function _tintaValClass(t) {
    var s = String(t?.data_validade || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'ok';
    var dias = Math.floor((new Date(s + 'T00:00:00').getTime() - Date.now()) / 86400000);
    if (dias < 0) return 'crit';
    if (dias <= 30) return 'alert';
    return 'ok';
  }

  function _renderDashboardEstoques(force) {
    var page = _ensurePageSimple('dashboard-estoques', '📊 Dashboard de Estoques');
    if (!page || page.style.display === 'none') return;
    var body = document.getElementById('dashboard-estoques-body');
    if (!body) return;
    if (!body.dataset.init) {
      body.dataset.init = '1';
      document.getElementById('dashboard-estoques-refresh').onclick = function() { _renderDashboardEstoques(true); };
    }
    body.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:.85rem">Carregando…</div>';

    Promise.all([
      _loadChapas(!!force).catch(function() { return []; }),
      _loadTintas(!!force).catch(function() { return []; }),
      _loadMateriais(!!force).catch(function() { return []; }),
      (async function() {
        try {
          var r = await fetch('/api/facas_estoque?empId=' + encodeURIComponent(_emp()), { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } });
          var j = await r.json().catch(function() { return null; });
          if (!r.ok || !j || j.ok === false) return [];
          return Array.isArray(j.data) ? j.data : (Array.isArray(j) ? j : []);
        } catch (_) { return []; }
      })()
    ]).then(function(all) {
      var chapas = Array.isArray(all[0]) ? all[0] : [];
      var tintas = Array.isArray(all[1]) ? all[1] : [];
      var mats = Array.isArray(all[2]) ? all[2] : [];
      var facas = Array.isArray(all[3]) ? all[3] : [];

      var sum = function(list, getMin, getQtd) {
        var out = { total: 0, crit: 0, alert: 0, ok: 0 };
        list.forEach(function(x) {
          out.total += 1;
          var c = _stockClass(getQtd(x), getMin(x));
          if (c === 'crit') out.crit += 1;
          else if (c === 'alert') out.alert += 1;
          else out.ok += 1;
        });
        return out;
      };

      var chapSum = sum(chapas, function(x) { return x?.estoque_minimo ?? x?.min ?? x?.quantidade_minima ?? 0; }, function(x) { return x?.quantidade_atual ?? x?.quantidade ?? x?.qtd ?? 0; });
      var tinSum = (function() {
        var out = { total: tintas.length, crit: 0, alert: 0, ok: 0 };
        tintas.forEach(function(t) {
          var c = _tintaValClass(t);
          if (c === 'crit') out.crit += 1;
          else if (c === 'alert') out.alert += 1;
          else out.ok += 1;
        });
        return out;
      })();
      var matSum = sum(mats, function(x) { return x?.quantidade_minima ?? 0; }, function(x) { return x?.quantidade_atual ?? 0; });
      var facSum = (function() {
        var out = { total: facas.length, crit: 0, alert: 0, ok: 0 };
        facas.forEach(function(f) {
          var df = String(f?.data_fabricacao || '').slice(0, 10);
          var vida = Math.trunc(Number(f?.vida_util_dias ?? 730) || 0);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(df) || !(vida > 0)) { out.ok += 1; return; }
          var diasUsados = Math.floor((Date.now() - new Date(df + 'T00:00:00').getTime()) / 86400000);
          if (!Number.isFinite(diasUsados) || diasUsados < 0) diasUsados = 0;
          var pct = Math.min(100, Math.round((diasUsados / vida) * 100));
          if (pct >= 86) out.crit += 1;
          else if (pct >= 61) out.alert += 1;
          else out.ok += 1;
        });
        return out;
      })();

      var card = function(titulo, id, s, icon) {
        return (
          '<div data-dash="' + _esc(id) + '" style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 12px;background:rgba(255,255,255,0.02);cursor:pointer">' +
            '<div style="font-weight:900;color:#e2e8f0;margin-bottom:6px">' + _esc(icon) + ' ' + _esc(titulo) + '</div>' +
            '<div style="color:#94a3b8;font-size:.8rem">' + _esc(String(s.total)) + ' itens</div>' +
            '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;font-size:.78rem">' +
              '<span style="color:#fecaca;font-weight:900">🔴 ' + _esc(String(s.crit)) + '</span>' +
              '<span style="color:#fde68a;font-weight:900">⚠️ ' + _esc(String(s.alert)) + '</span>' +
              '<span style="color:#bbf7d0;font-weight:900">✅ ' + _esc(String(s.ok)) + '</span>' +
            '</div>' +
          '</div>'
        );
      };

      body.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
          card('Chapas', 'estoque', chapSum, '📦') +
          card('Tintas', 'estoque-tintas', tinSum, '🎨') +
          card('Materiais', 'estoque-materiais', matSum, '🧰') +
          card('Facas', 'facas1', facSum, '🔧') +
        '</div>' +
        '<div style="margin-top:12px;color:var(--text3);font-size:.78rem">Clique em um card para abrir o estoque filtrado nos itens críticos/alertas.</div>';

      body.querySelectorAll('[data-dash]').forEach(function(el) {
        el.onclick = function() {
          var id = String(el.getAttribute('data-dash') || '').trim();
          try {
            if (id === 'estoque-tintas') {
              var sel = document.getElementById('tintas-status');
              if (sel) sel.value = '';
            }
            if (typeof window.go === 'function') window.go(id);
            setTimeout(function() {
              if (id === 'estoque-tintas') {
                var sel2 = document.getElementById('tintas-status');
                if (sel2) sel2.value = 'critico';
                try { _renderTintasList(); } catch (_) {}
              }
              if (id === 'estoque-materiais') {
                var sel3 = document.getElementById('mat-status');
                if (sel3) sel3.value = 'critico';
                try { _renderMateriaisList(); } catch (_) {}
              }
            }, 200);
          } catch (_) {}
        };
      });
    }).catch(function(e) {
      body.innerHTML = '<div style="padding:12px;color:var(--red);font-size:.85rem">Erro ao carregar dashboard: ' + _esc(String(e?.message || e || '')) + '</div>';
    });
  }

  function _renderHistoricoMovimentos(force) {
    var page = _ensurePageSimple('historico-movimentos', '🕘 Histórico de Movimentos');
    if (!page || page.style.display === 'none') return;
    var body = document.getElementById('historico-movimentos-body');
    if (!body) return;
    if (!body.dataset.init) {
      body.dataset.init = '1';
      body.innerHTML =
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center">' +
          '<div style="display:flex;gap:8px;overflow:auto;white-space:nowrap;flex:1" id="mov-chips">' +
            ['Todos','Chapas','Tintas','Materiais','Entradas','Saídas'].map(function(x){ return '<button class="btn btn-ghost btn-sm" data-chip="' + _esc(x) + '" style="min-height:44px">' + _esc(x) + '</button>'; }).join('') +
          '</div>' +
          '<input type="date" id="mov-de" style="background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:#e8f0fe;font-size:14px;outline:none" />' +
          '<input type="date" id="mov-ate" style="background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:#e8f0fe;font-size:14px;outline:none" />' +
        '</div>' +
        '<div id="mov-timeline"></div>';
      document.getElementById('historico-movimentos-refresh').onclick = function() { _renderHistoricoMovimentos(true); };
      body.querySelectorAll('button[data-chip]').forEach(function(b) {
        b.onclick = function() {
          body.dataset.chip = String(b.getAttribute('data-chip') || 'Todos');
          body.querySelectorAll('button[data-chip]').forEach(function(x){ x.classList.toggle('btn-accent', x === b); });
          _renderHistoricoMovimentos(false);
        };
      });
      var d1 = new Date(); d1.setDate(d1.getDate() - 7);
      try { body.querySelector('#mov-de').value = d1.toISOString().slice(0,10); } catch (_) {}
      try { body.querySelector('#mov-ate').value = new Date().toISOString().slice(0,10); } catch (_) {}
      body.querySelector('#mov-de').onchange = function() { _renderHistoricoMovimentos(true); };
      body.querySelector('#mov-ate').onchange = function() { _renderHistoricoMovimentos(true); };
      body.dataset.chip = 'Todos';
    }

    var chip = String(body.dataset.chip || 'Todos');
    var de = String((body.querySelector('#mov-de') || {}).value || '').trim();
    var ate = String((body.querySelector('#mov-ate') || {}).value || '').trim();
    var timeline = document.getElementById('mov-timeline');
    if (!timeline) return;
    timeline.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:.85rem">Carregando…</div>';

    Promise.all([
      _loadChapas(!!force).catch(function() { return []; }),
      _loadTintas(!!force).catch(function() { return []; }),
      _loadMateriais(!!force).catch(function() { return []; }),
      _apiJson('/api/chapas_estoque_movimentos?limit=250&de=' + encodeURIComponent(de) + '&ate=' + encodeURIComponent(ate) + '&empId=' + encodeURIComponent(_emp()) + '&t=' + Date.now(), { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } }).catch(function() { return { data: [] }; }),
      _apiJson('/api/estoque_tintas/movimentos?limit=250&de=' + encodeURIComponent(de) + '&ate=' + encodeURIComponent(ate) + '&t=' + Date.now(), { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } }).catch(function() { return { data: [] }; }),
      _apiJson('/api/estoque_materiais/movimentos?limit=250&de=' + encodeURIComponent(de) + '&ate=' + encodeURIComponent(ate) + '&t=' + Date.now(), { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } }).catch(function() { return { data: [] }; }),
    ]).then(function(all) {
      var chapas = Array.isArray(all[0]) ? all[0] : [];
      var tintas = Array.isArray(all[1]) ? all[1] : [];
      var mats = Array.isArray(all[2]) ? all[2] : [];
      var movCh = Array.isArray(all[3]?.data) ? all[3].data : (Array.isArray(all[3]) ? all[3] : []);
      var movTi = Array.isArray(all[4]?.data) ? all[4].data : (Array.isArray(all[4]) ? all[4] : []);
      var movMa = Array.isArray(all[5]?.data) ? all[5].data : (Array.isArray(all[5]) ? all[5] : []);

      var chapaNome = {};
      chapas.forEach(function(c) {
        var id = String(c?.id || '').trim();
        if (!id) return;
        chapaNome[id] = String(c?.nomenclatura || c?.nome || c?.uso || c?.codigo || id).trim();
      });
      var tintaNome = {};
      tintas.forEach(function(t) { var id = String(t?.id || '').trim(); if (id) tintaNome[id] = String(t?.nome || id).trim(); });
      var matNome = {};
      mats.forEach(function(m) { var id = String(m?.id || '').trim(); if (id) matNome[id] = String(m?.nome || id).trim(); });

      var norm = [];
      movCh.forEach(function(m) {
        norm.push({
          fonte: 'Chapas',
          tipo: String(m?.tipo || '').toLowerCase() || (Number(m?.delta || 0) < 0 ? 'saida' : 'entrada'),
          delta: Number(m?.delta || 0) || 0,
          created_at: m?.created_at || '',
          item: chapaNome[String(m?.chapa_id || '').trim()] || String(m?.chapa_id || 'Chapa'),
          usuario: m?.usuario || m?.confirmado_por || m?.criado_por || '',
          of: m?.of || m?.of_numero || m?.origem_id || '',
        });
      });
      movTi.forEach(function(m) {
        norm.push({
          fonte: 'Tintas',
          tipo: String(m?.tipo || '').toLowerCase(),
          delta: Number(m?.delta || 0) || 0,
          created_at: m?.created_at || '',
          item: tintaNome[String(m?.tinta_id || '').trim()] || String(m?.tinta_id || 'Tinta'),
          usuario: m?.criado_por || '',
          of: m?.of_numero || '',
        });
      });
      movMa.forEach(function(m) {
        norm.push({
          fonte: 'Materiais',
          tipo: String(m?.tipo || '').toLowerCase(),
          delta: Number(m?.delta || 0) || 0,
          created_at: m?.created_at || '',
          item: matNome[String(m?.material_id || '').trim()] || String(m?.material_id || 'Material'),
          usuario: m?.criado_por || '',
          of: m?.of_numero || '',
        });
      });

      norm = norm.filter(function(m) {
        if (chip === 'Chapas' && m.fonte !== 'Chapas') return false;
        if (chip === 'Tintas' && m.fonte !== 'Tintas') return false;
        if (chip === 'Materiais' && m.fonte !== 'Materiais') return false;
        if (chip === 'Entradas' && m.tipo !== 'entrada') return false;
        if (chip === 'Saídas' && m.tipo !== 'saida') return false;
        return true;
      });
      norm.sort(function(a, b) { return String(b.created_at || '').localeCompare(String(a.created_at || '')); });

      if (!norm.length) {
        timeline.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:.85rem">Sem movimentos no período.</div>';
        return;
      }

      var grp = {};
      norm.forEach(function(m) {
        var day = String(m.created_at || '').slice(0, 10) || '—';
        if (!grp[day]) grp[day] = [];
        grp[day].push(m);
      });
      var days = Object.keys(grp).sort(function(a, b) { return b.localeCompare(a); });

      timeline.innerHTML = days.map(function(day) {
        var title = (day === new Date().toISOString().slice(0,10)) ? 'HOJE' : (day === (function(){ var d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })() ? 'ONTEM' : day);
        var items = grp[day].slice().sort(function(a, b) { return String(b.created_at || '').localeCompare(String(a.created_at || '')); });
        return (
          '<div style="margin-bottom:14px">' +
            '<div style="color:#94a3b8;font-weight:900;font-size:.78rem;margin:6px 0">─── ' + _esc(title) + ' ──────────────────</div>' +
            items.map(function(m) {
              var h = String(m.created_at || '').slice(11, 16);
              var ic = m.tipo === 'entrada' ? '⬆️' : '⬇️';
              var sign = m.tipo === 'entrada' ? '+' : '-';
              var qty = Math.abs(Number(m.delta || 0) || 0);
              return (
                '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 12px;background:rgba(255,255,255,0.02);margin-bottom:10px">' +
                  '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px">' +
                    '<div style="font-weight:900;color:#e2e8f0">' + _esc(ic) + ' ' + _esc(m.tipo.toUpperCase()) + '</div>' +
                    '<div style="color:#94a3b8;font-family:var(--mono);font-weight:900">' + _esc(h || '') + '</div>' +
                  '</div>' +
                  '<div style="margin-top:6px;color:#e2e8f0;font-weight:900">' + _esc(m.item || '') + '</div>' +
                  '<div style="margin-top:4px;color:#94a3b8;font-size:.82rem">' + _esc(m.fonte) + (m.of ? (' · OF ' + _esc(m.of)) : '') + '</div>' +
                  '<div style="margin-top:6px;color:#94a3b8;font-size:.82rem">' + _esc(sign + String(qty)) + (m.usuario ? (' · ' + _esc(m.usuario)) : '') + '</div>' +
                '</div>'
              );
            }).join('') +
          '</div>'
        );
      }).join('');
    }).catch(function(e) {
      timeline.innerHTML = '<div style="padding:12px;color:var(--red);font-size:.85rem">Erro ao carregar movimentos.</div>';
    });
  }

  function _renderCustoProducao(force) {
    var page = _ensurePageSimple('custo-producao', '🧾 Custo de Produção');
    if (!page || page.style.display === 'none') return;
    var body = document.getElementById('custo-producao-body');
    if (!body) return;
    if (!body.dataset.init) {
      body.dataset.init = '1';
      document.getElementById('custo-producao-refresh').onclick = function() { _renderCustoProducao(true); };
      var d1 = new Date(); d1.setDate(d1.getDate() - 30);
      body.innerHTML =
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center">' +
          '<input type="date" id="custo-de" style="background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:#e8f0fe;font-size:14px;outline:none" />' +
          '<input type="date" id="custo-ate" style="background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:#e8f0fe;font-size:14px;outline:none" />' +
          '<button class="btn btn-ghost btn-sm" id="custo-export" style="min-height:44px">Exportar</button>' +
        '</div>' +
        '<div id="custo-host"></div>';
      try { body.querySelector('#custo-de').value = d1.toISOString().slice(0,10); } catch (_) {}
      try { body.querySelector('#custo-ate').value = new Date().toISOString().slice(0,10); } catch (_) {}
      body.querySelector('#custo-de').onchange = function() { _renderCustoProducao(true); };
      body.querySelector('#custo-ate').onchange = function() { _renderCustoProducao(true); };
      body.querySelector('#custo-export').onclick = function() {
        try {
          var txt = body.dataset.exportTxt || '';
          if (txt) navigator.clipboard.writeText(txt).catch(function(){});
          _toast('✓ Export copiado', 'var(--green)');
        } catch (_) {}
      };
    }
    var de = String((body.querySelector('#custo-de') || {}).value || '').trim();
    var ate = String((body.querySelector('#custo-ate') || {}).value || '').trim();
    var host = document.getElementById('custo-host');
    if (!host) return;
    host.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:.85rem">Carregando…</div>';

    Promise.all([
      (async function() {
        var all = [];
        var limit = 200;
        for (var page = 0; page < 6; page++) {
          var offset = page * limit;
          var url = '/api/ofs?lite=1&limit=' + limit + '&offset=' + offset +
            '&status=' + encodeURIComponent('Concluído') +
            '&de=' + encodeURIComponent(de) + '&ate=' + encodeURIComponent(ate) +
            '&nocache=1&t=' + Date.now();
          var r = await fetch(url, { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } });
          var j = await r.json().catch(function() { return null; });
          var rows = (j && j.ok !== false && Array.isArray(j.data)) ? j.data : (Array.isArray(j?.ofs) ? j.ofs : []);
          rows = Array.isArray(rows) ? rows : [];
          all = all.concat(rows);
          if (rows.length < limit) break;
        }
        return all;
      })(),
      _loadChapas(!!force),
      _loadTintas(!!force),
      _apiJson('/api/estoque_tintas/movimentos?limit=400&tipo=saida&de=' + encodeURIComponent(de) + '&ate=' + encodeURIComponent(ate) + '&t=' + Date.now(), { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } }).catch(function() { return { data: [] }; }),
      _apiJson('/api/estoque_materiais/movimentos?limit=400&tipo=saida&de=' + encodeURIComponent(de) + '&ate=' + encodeURIComponent(ate) + '&t=' + Date.now(), { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } }).catch(function() { return { data: [] }; }),
    ]).then(function(all) {
      var ofs = Array.isArray(all[0]) ? all[0] : [];
      var chapas = Array.isArray(all[1]) ? all[1] : [];
      var tintas = Array.isArray(all[2]) ? all[2] : [];
      var movT = Array.isArray(all[3]?.data) ? all[3].data : (Array.isArray(all[3]) ? all[3] : []);
      var movM = Array.isArray(all[4]?.data) ? all[4].data : (Array.isArray(all[4]) ? all[4] : []);

      var precoChapa = {};
      chapas.forEach(function(c) {
        var id = String(c?.id || '').trim();
        if (!id) return;
        var v = Number(c?.valor_unitario ?? c?.val ?? c?.valor ?? 0) || 0;
        precoChapa[id] = v;
      });
      var precoTinta = {};
      tintas.forEach(function(t) {
        var id = String(t?.id || '').trim();
        if (!id) return;
        precoTinta[id] = Number(t?.preco_kg ?? 0) || 0;
      });

      var movTByOf = {};
      movT.forEach(function(m) {
        var ofn = String(m?.of_numero || '').trim();
        if (!ofn) return;
        if (!movTByOf[ofn]) movTByOf[ofn] = [];
        movTByOf[ofn].push(m);
      });
      var movMByOf = {};
      movM.forEach(function(m) {
        var ofn = String(m?.of_numero || '').trim();
        if (!ofn) return;
        if (!movMByOf[ofn]) movMByOf[ofn] = [];
        movMByOf[ofn].push(m);
      });

      var lines = [];
      var exportLines = ['of;produto;qtd_produzida;custo_chapas;custo_tintas;custo_materiais;custo_total;custo_por_caixa'];

      ofs.slice(0, 200).forEach(function(of) {
        var ofNum = String(of?.of ?? of?.numero ?? of?.of_num ?? '').trim();
        var prod = String(of?.descricao ?? of?.produto ?? of?.prodDesc ?? '').trim();
        var qtdProd = Math.trunc(Number(of?.qtd_produzida ?? of?.qtd ?? of?.quantidade ?? 0) || 0);
        var qtdCh = Math.trunc(Number(of?.qtd_chapas ?? 0) || 0);
        var chapaId = String(of?.chapa_id ?? of?.chp ?? '').trim();
        var vCh = chapaId ? (Number(precoChapa[chapaId] || 0) || 0) : 0;
        var custoCh = qtdCh * vCh;

        var tinMovs = movTByOf[ofNum] || [];
        var custoT = 0;
        tinMovs.forEach(function(m) {
          var id = String(m?.tinta_id || '').trim();
          var vu = Number(m?.valor_unitario);
          if (!Number.isFinite(vu) || vu <= 0) vu = Number(precoTinta[id] || 0) || 0;
          var q = Math.abs(Number(m?.delta || 0) || 0);
          custoT += q * vu;
        });

        var matMovs = movMByOf[ofNum] || [];
        var custoM = 0;
        matMovs.forEach(function(m) {
          var vu = Number(m?.valor_unitario);
          if (!Number.isFinite(vu) || vu <= 0) return;
          var q = Math.abs(Number(m?.delta || 0) || 0);
          custoM += q * vu;
        });

        var total = custoCh + custoT + custoM;
        var porCx = (qtdProd > 0) ? (total / qtdProd) : 0;

        lines.push({
          of: ofNum,
          prod: prod,
          qtd: qtdProd,
          ch: custoCh,
          ti: custoT,
          ma: custoM,
          tot: total,
          pcx: porCx,
        });
        exportLines.push([ofNum, prod.replace(/;/g, ','), qtdProd, custoCh.toFixed(2), custoT.toFixed(2), custoM.toFixed(2), total.toFixed(2), porCx.toFixed(4)].join(';'));
      });

      body.dataset.exportTxt = exportLines.join('\n');

      if (!lines.length) {
        host.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:.85rem">Sem OFs concluídas no período.</div>';
        return;
      }

      host.innerHTML = lines.map(function(x) {
        return (
          '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 12px;background:rgba(255,255,255,0.02);margin-bottom:10px">' +
            '<div style="font-weight:900;color:#e2e8f0">OF #' + _esc(x.of || '—') + (x.prod ? (' · ' + _esc(x.prod)) : '') + '</div>' +
            '<div style="margin-top:6px;color:#94a3b8;font-size:.82rem">' + _esc(String(x.qtd || 0)) + ' caixas</div>' +
            '<div style="margin-top:10px;display:grid;grid-template-columns:1fr auto;gap:6px;color:#e2e8f0;font-size:.86rem">' +
              '<div>Chapas:</div><div style="font-family:var(--mono)">' + _esc(_fmtMoney(x.ch)) + '</div>' +
              '<div>Tintas:</div><div style="font-family:var(--mono)">' + _esc(_fmtMoney(x.ti)) + '</div>' +
              '<div>Materiais:</div><div style="font-family:var(--mono)">' + _esc(_fmtMoney(x.ma)) + '</div>' +
            '</div>' +
            '<div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;display:grid;grid-template-columns:1fr auto;gap:6px;color:#e2e8f0;font-size:.9rem;font-weight:900">' +
              '<div>Total:</div><div style="font-family:var(--mono)">' + _esc(_fmtMoney(x.tot)) + '</div>' +
              '<div>Por caixa:</div><div style="font-family:var(--mono)">' + _esc(_fmtMoney(x.pcx)) + '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }).catch(function(e) {
      host.innerHTML = '<div style="padding:12px;color:var(--red);font-size:.85rem">Erro ao calcular custos.</div>';
    });
  }

  var _cacheTintas = { ts: 0, items: [] };
  async function _loadTintas(force) {
    if (!force && (Date.now() - _cacheTintas.ts) < 4000) return _cacheTintas.items;
    var j = await _apiJson('/api/estoque_tintas?' + _empresaQs('nocache=1&t=' + Date.now()), { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } });
    _cacheTintas = { ts: Date.now(), items: Array.isArray(j.data) ? j.data : j };
    return _cacheTintas.items;
  }

  function _renderTintasPage(force) {
    var page = _ensurePage('estoque-tintas', '🎨 Estoque de Tintas');
    if (!page || page.style.display === 'none') return;
    var body = document.getElementById('estoque-tintas-body');
    if (!body) return;
    if (!body.dataset.init) {
      body.dataset.init = '1';
      body.insertAdjacentHTML('afterbegin',
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
          '<input id="tintas-busca" placeholder="Buscar nome/cor/fornecedor..." style="flex:1;min-width:220px;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:#e8f0fe;font-size:14px;outline:none" />' +
          '<select id="tintas-status" style="min-width:180px;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:#e8f0fe;font-size:14px;outline:none">' +
            '<option value="">Todos</option>' +
            '<option value="baixo">Estoque baixo</option>' +
            '<option value="critico">Crítico</option>' +
          '</select>' +
        '</div>' +
        '<div id="tintas-table-host"></div>'
      );
      document.getElementById('estoque-tintas-refresh').onclick = function() { _renderTintasPage(true); };
      document.getElementById('estoque-tintas-add').onclick = function() { _openTintaForm(null); };
      body.querySelector('#tintas-busca').addEventListener('input', function() { _renderTintasList(); });
      body.querySelector('#tintas-status').addEventListener('change', function() { _renderTintasList(); });
    }
    _loadTintas(!!force).then(function() { _renderTintasList(); }).catch(function(e) {
      try {
        var host = document.getElementById('tintas-table-host');
        if (host) host.innerHTML = '<div style="padding:14px;color:var(--red);font-size:.85rem">Erro ao carregar tintas: ' + _esc(String(e?.message || e || '')) + '</div>';
      } catch (_) {}
      _toast('Erro ao carregar tintas', 'var(--red)');
    });
  }

  function _renderTintasList() {
    var host = document.getElementById('tintas-table-host');
    if (!host) return;
    var busca = String((document.getElementById('tintas-busca') || {}).value || '').trim().toLowerCase();
    var flt = String((document.getElementById('tintas-status') || {}).value || '').trim();
    var items = Array.isArray(_cacheTintas.items) ? _cacheTintas.items.slice() : [];
    if (busca) items = items.filter(function(x) {
      return (String(x?.nome || '') + ' ' + String(x?.cor || '') + ' ' + String(x?.fornecedor || '')).toLowerCase().indexOf(busca) >= 0;
    });
    if (flt) items = items.filter(function(x) {
      var q = Number(x?.quantidade_atual || 0) || 0;
      var m = Number(x?.quantidade_minima || 0) || 0;
      if (flt === 'critico') return q <= 0 || (m > 0 && q <= (m * 0.5));
      if (flt === 'baixo') return m > 0 && q > 0 && q < m;
      return true;
    });
    if (!items.length) {
      host.innerHTML = '<div style="padding:14px;color:var(--text3);font-size:.85rem">Nenhuma tinta encontrada.</div>';
      return;
    }
    var validadeBadge = function(t) {
      var s = String(t?.data_validade || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
      var diasVenc = Math.floor((new Date(s + 'T00:00:00').getTime() - Date.now()) / 86400000);
      if (diasVenc < 0) return '<span style="background:#ef4444;color:#fff;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:900">🔴 VENCIDA</span>';
      if (diasVenc <= 30) return '<span style="background:#f59e0b;color:#111827;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:900">⚠️ Vence em ' + _esc(String(diasVenc)) + 'd</span>';
      return '<span style="background:rgba(255,255,255,0.06);color:#e2e8f0;border-radius:999px;padding:3px 8px;font-size:11px">✅ OK</span>';
    };

    if (_isMobile()) {
      host.innerHTML = items.map(function(t) {
        var preco = Number(t?.preco_kg || 0) || 0;
        var un = String(t?.unidade || 'kg');
        var qtd = Number(t?.quantidade_atual || 0) || 0;
        var custo = preco * qtd;
        var badgeV = validadeBadge(t);
        return (
          '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 12px;background:rgba(255,255,255,0.02);margin-bottom:10px">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">' +
              '<div style="min-width:180px">' +
                '<div style="font-weight:900;color:#e2e8f0">🎨 ' + _esc(t.nome || '—') + '</div>' +
                '<div style="color:#94a3b8;font-size:.78rem;margin-top:2px">' + _esc(t.cor || '') + (t.fornecedor ? (' · ' + _esc(t.fornecedor)) : '') + '</div>' +
              '</div>' +
              '<div style="text-align:right">' +
                '<div style="font-family:var(--mono);font-weight:900;color:var(--green)">' + _esc('R$' + (preco || 0).toFixed(2)) + '/' + _esc(un) + '</div>' +
                '<div style="color:#94a3b8;font-size:.75rem">' + _esc(_fmtMoney(custo)) + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between">' +
              '<div style="color:#e2e8f0;font-size:.86rem">Qtd: <b>' + _esc(String(qtd)) + _esc(un) + '</b> · Mín: <b>' + _esc(String(t.quantidade_minima ?? 0)) + _esc(un) + '</b></div>' +
              '<div>' + _statusBadge(t.quantidade_atual, t.quantidade_minima) + '</div>' +
            '</div>' +
            '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between">' +
              '<div style="color:#94a3b8;font-size:.78rem">Validade: ' + _esc(_fmtDateBR(t.data_validade) || '—') + '</div>' +
              '<div>' + badgeV + '</div>' +
            '</div>' +
            '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
              '<button class="btn btn-accent btn-sm" data-act="ent" data-id="' + _esc(t.id) + '" style="min-height:44px;flex:1">Entrada</button>' +
              '<button class="btn btn-ghost btn-sm" data-act="sai" data-id="' + _esc(t.id) + '" style="min-height:44px;flex:1">Saída</button>' +
              '<button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + _esc(t.id) + '" style="min-height:44px;flex:1">Editar</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    } else {
      host.innerHTML =
        '<div style="overflow:auto;border:1px solid rgba(255,255,255,0.08);border-radius:12px">' +
          '<table style="width:100%;border-collapse:collapse;min-width:940px">' +
            '<thead><tr style="background:rgba(255,255,255,0.03)">' +
              '<th style="text-align:left;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Nome</th>' +
              '<th style="text-align:left;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Cor</th>' +
              '<th style="text-align:left;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Fornecedor</th>' +
              '<th style="text-align:right;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Qtd</th>' +
              '<th style="text-align:left;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Un</th>' +
              '<th style="text-align:right;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Preço</th>' +
              '<th style="text-align:center;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Validade</th>' +
              '<th style="text-align:center;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Status</th>' +
              '<th style="text-align:center;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Ações</th>' +
            '</tr></thead>' +
            '<tbody>' +
              items.map(function(t) {
                var preco = Number(t?.preco_kg || 0) || 0;
                return '<tr>' +
                  '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:900;color:#e2e8f0">' + _esc(t.nome || '') + '</td>' +
                  '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);color:#94a3b8">' + _esc(t.cor || '—') + '</td>' +
                  '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);color:#94a3b8">' + _esc(t.fornecedor || '—') + '</td>' +
                  '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;font-family:var(--mono)">' + _esc(String(t.quantidade_atual ?? 0)) + '</td>' +
                  '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06)">' + _esc(t.unidade || 'kg') + '</td>' +
                  '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;font-family:var(--mono);color:var(--green)">' + _esc('R$' + (preco || 0).toFixed(2)) + '/' + _esc(String(t.unidade || 'kg')) + '</td>' +
                  '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center">' + (validadeBadge(t) || '—') + '</td>' +
                  '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center">' + _statusBadge(t.quantidade_atual, t.quantidade_minima) + '</td>' +
                  '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;white-space:nowrap">' +
                    '<button class="btn btn-ghost btn-sm" data-act="mov" data-id="' + _esc(t.id) + '">⇄ Movimentar</button>' +
                    '<button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + _esc(t.id) + '" style="margin-left:6px">✏</button>' +
                    '<button class="btn btn-ghost btn-sm" data-act="del" data-id="' + _esc(t.id) + '" style="margin-left:6px;color:var(--red)">🗑</button>' +
                  '</td>' +
                '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>';
    }
    host.querySelectorAll('button[data-act]').forEach(function(b) {
      var id = String(b.getAttribute('data-id') || '').trim();
      var act = String(b.getAttribute('data-act') || '').trim();
      b.onclick = function() {
        var item = (_cacheTintas.items || []).find(function(r) { return String(r?.id || '') === id; }) || null;
        if (act === 'edit') return _openTintaForm(item);
        if (act === 'mov') return _openTintaMov(item);
        if (act === 'ent') return _openTintaMov(item, 'entrada');
        if (act === 'sai') return _openTintaMov(item, 'saida');
        if (act === 'del') return _deleteTinta(item);
      };
    });
  }

  function _openTintaForm(item) {
    _openModal({
      id: 'tinta-form',
      title: item ? '✏ Editar tinta' : '＋ Nova tinta',
      render: function(host, close) {
        var v = item || {};
        host.innerHTML =
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
            '<div style="grid-column:1/-1;display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Nome *</label><input id="tinta-nome" value="' + _esc(v.nome || '') + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Cor</label><input id="tinta-cor" value="' + _esc(v.cor || '') + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Fornecedor</label><input id="tinta-forn" value="' + _esc(v.fornecedor || '') + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Preço por kg</label><input id="tinta-preco" type="number" step="0.01" value="' + _esc(v.preco_kg ?? 0) + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Unidade</label><select id="tinta-un" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none"><option value="kg">kg</option><option value="litro">litro</option><option value="galao">galão</option></select></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Qtd atual</label><input id="tinta-qtd" type="number" step="0.01" value="' + _esc(v.quantidade_atual ?? 0) + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Qtd mínima</label><input id="tinta-min" type="number" step="0.01" value="' + _esc(v.quantidade_minima ?? 0) + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Data de validade</label><input id="tinta-validade" type="date" value="' + _esc(String(v.data_validade || '').slice(0,10)) + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="grid-column:1/-1;display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Observações</label><textarea id="tinta-obs" rows="3" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none;resize:vertical">' + _esc(v.observacoes || '') + '</textarea></div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px">' +
            '<button class="btn btn-ghost btn-sm" id="tinta-cancel">Cancelar</button>' +
            '<button class="btn btn-accent btn-sm" id="tinta-save">Salvar</button>' +
          '</div>';
        try { host.querySelector('#tinta-un').value = String(v.unidade || 'kg'); } catch (_) {}
        host.querySelector('#tinta-cancel').onclick = close;
        host.querySelector('#tinta-save').onclick = function() {
          var payload = {
            empresa_id: (window.CURRENT_USER?.empresa_id || window.CURRENT_USER?.empId || '') || undefined,
            nome: String(host.querySelector('#tinta-nome').value || '').trim(),
            cor: String(host.querySelector('#tinta-cor').value || '').trim(),
            fornecedor: String(host.querySelector('#tinta-forn').value || '').trim(),
            unidade: String(host.querySelector('#tinta-un').value || 'kg').trim(),
            quantidade_atual: Number(host.querySelector('#tinta-qtd').value || 0) || 0,
            quantidade_minima: Number(host.querySelector('#tinta-min').value || 0) || 0,
            preco_kg: Number(host.querySelector('#tinta-preco').value || 0) || 0,
            data_validade: String(host.querySelector('#tinta-validade').value || '').trim(),
            observacoes: String(host.querySelector('#tinta-obs').value || '').trim(),
          };
          if (!payload.nome) return _toast('Nome obrigatório', 'var(--red)');
          var url = item ? ('/api/estoque_tintas/' + encodeURIComponent(item.id)) : '/api/estoque_tintas';
          var method = item ? 'PUT' : 'POST';
          _apiJson(url, { method: method, headers: _hdrJson(), body: JSON.stringify(payload) })
            .then(function() { return _loadTintas(true); })
            .then(function() { _renderTintasList(); close(); _toast('✓ Salvo', 'var(--green)'); })
            .catch(function(e) { _toast(String(e?.message || e || 'Erro ao salvar'), 'var(--red)'); });
        };
      }
    });
  }

  function _openTintaMov(item, presetTipo) {
    if (!item) return;
    _openModal({
      id: 'tinta-mov',
      title: '⇄ Movimentar tinta',
      render: function(host, close) {
        var tipoPreset = String(presetTipo || '').trim().toLowerCase();
        host.innerHTML =
          '<div style="color:#e2e8f0;font-weight:900;margin-bottom:10px">' + _esc(item.nome || '') + '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
            (tipoPreset ? (
              '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Tipo</label><div style="background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;font-weight:900">' + (tipoPreset === 'saida' ? 'Saída' : 'Entrada') + '</div></div>'
            ) : (
              '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Tipo</label><select id="tm-tipo" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none"><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>'
            )) +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Quantidade</label><input id="tm-qtd" type="number" step="0.01" value="" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">OF (opcional)</label><input id="tm-of" value="" placeholder="Ex: 725" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Valor unit. (opcional)</label><input id="tm-vu" type="number" step="0.01" value="' + _esc(item.preco_kg ?? 0) + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="grid-column:1/-1;display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Obs</label><input id="tm-obs" value="" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px">' +
            '<button class="btn btn-ghost btn-sm" id="tm-cancel">Cancelar</button>' +
            '<button class="btn btn-accent btn-sm" id="tm-save">Salvar</button>' +
          '</div>';
        host.querySelector('#tm-cancel').onclick = close;
        host.querySelector('#tm-save').onclick = function() {
          var payload = {
            empresa_id: (window.CURRENT_USER?.empresa_id || window.CURRENT_USER?.empId || '') || undefined,
            tipo: tipoPreset || String((host.querySelector('#tm-tipo') || {}).value || '').trim(),
            quantidade: Number(host.querySelector('#tm-qtd').value || 0) || 0,
            of_numero: String(host.querySelector('#tm-of').value || '').trim(),
            valor_unitario: Number(host.querySelector('#tm-vu').value || 0) || 0,
            obs: String(host.querySelector('#tm-obs').value || '').trim(),
          };
          _apiJson('/api/estoque_tintas/' + encodeURIComponent(item.id) + '/movimentos', { method: 'POST', headers: _hdrJson(), body: JSON.stringify(payload) })
            .then(function() { return _loadTintas(true); })
            .then(function() { _renderTintasList(); close(); _toast('✓ Movimento registrado', 'var(--green)'); })
            .catch(function(e) { _toast(String(e?.message || e || 'Erro ao movimentar'), 'var(--red)'); });
        };
      }
    });
  }

  function _deleteTinta(item) {
    if (!item) return;
    if (!confirm('Excluir esta tinta?')) return;
    _apiJson('/api/estoque_tintas/' + encodeURIComponent(item.id), { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } })
      .then(function() { return _loadTintas(true); })
      .then(function() { _renderTintasList(); _toast('🗑 Excluído', 'var(--orange)'); })
      .catch(function(e) { _toast(String(e?.message || e || 'Erro ao excluir'), 'var(--red)'); });
  }

  var _cacheMateriais = { ts: 0, items: [] };
  async function _loadMateriais(force) {
    if (!force && (Date.now() - _cacheMateriais.ts) < 4000) return _cacheMateriais.items;
    var j = await _apiJson('/api/estoque_materiais?' + _empresaQs('nocache=1&t=' + Date.now()), { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } });
    _cacheMateriais = { ts: Date.now(), items: Array.isArray(j.data) ? j.data : j };
    return _cacheMateriais.items;
  }

  function _renderMateriaisPage(force) {
    var page = _ensurePage('estoque-materiais', '🧰 Estoque de Materiais');
    if (!page || page.style.display === 'none') return;
    var body = document.getElementById('estoque-materiais-body');
    if (!body) return;
    if (!body.dataset.init) {
      body.dataset.init = '1';
      body.insertAdjacentHTML('afterbegin',
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
          '<input id="mat-busca" placeholder="Buscar nome/categoria/fornecedor..." style="flex:1;min-width:220px;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:#e8f0fe;font-size:14px;outline:none" />' +
          '<select id="mat-status" style="min-width:180px;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:#e8f0fe;font-size:14px;outline:none">' +
            '<option value="">Todos</option>' +
            '<option value="baixo">Estoque baixo</option>' +
            '<option value="critico">Crítico</option>' +
          '</select>' +
        '</div>' +
        '<div id="mat-list-host"></div>'
      );
      document.getElementById('estoque-materiais-refresh').onclick = function() { _renderMateriaisPage(true); };
      document.getElementById('estoque-materiais-add').onclick = function() { _openMaterialForm(null); };
      body.querySelector('#mat-busca').addEventListener('input', function() { _renderMateriaisList(); });
      body.querySelector('#mat-status').addEventListener('change', function() { _renderMateriaisList(); });
    }
    _loadMateriais(!!force).then(function() { _renderMateriaisList(); }).catch(function(e) {
      try {
        var host = document.getElementById('mat-list-host');
        if (host) host.innerHTML = '<div style="padding:14px;color:var(--red);font-size:.85rem">Erro ao carregar materiais: ' + _esc(String(e?.message || e || '')) + '</div>';
      } catch (_) {}
      _toast('Erro ao carregar materiais', 'var(--red)');
    });
  }

  function _renderMateriaisList() {
    var host = document.getElementById('mat-list-host');
    if (!host) return;
    var busca = String((document.getElementById('mat-busca') || {}).value || '').trim().toLowerCase();
    var flt = String((document.getElementById('mat-status') || {}).value || '').trim();
    var items = Array.isArray(_cacheMateriais.items) ? _cacheMateriais.items.slice() : [];
    if (busca) items = items.filter(function(x) {
      return (String(x?.nome || '') + ' ' + String(x?.categoria || '') + ' ' + String(x?.fornecedor || '')).toLowerCase().indexOf(busca) >= 0;
    });
    if (flt) items = items.filter(function(x) {
      var q = Number(x?.quantidade_atual || 0) || 0;
      var m = Number(x?.quantidade_minima || 0) || 0;
      if (flt === 'critico') return q <= 0 || (m > 0 && q <= (m * 0.5));
      if (flt === 'baixo') return m > 0 && q > 0 && q < m;
      return true;
    });
    if (!items.length) {
      host.innerHTML = '<div style="padding:14px;color:var(--text3);font-size:.85rem">Nenhum material encontrado.</div>';
      return;
    }
    var groups = {};
    items.forEach(function(it) {
      var cat = String(it?.categoria || 'Outros').trim() || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(it);
    });
    var cats = Object.keys(groups).sort(function(a, b) { return a.localeCompare(b); });
    if (_isMobile()) {
      host.innerHTML = cats.map(function(cat) {
        var rows = groups[cat].slice().sort(function(a, b) { return String(a.nome || '').localeCompare(String(b.nome || '')); });
        var key = 'mat_cat_' + cat;
        var aberto = '';
        try { aberto = sessionStorage.getItem(key) || ''; } catch (_) { aberto = ''; }
        var open = aberto === '1';
        return (
          '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;margin-bottom:12px;overflow:hidden" data-cat="' + _esc(cat) + '">' +
            '<div data-act="toggle-cat" style="padding:12px 12px;background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer">' +
              '<div style="font-weight:900;color:#e2e8f0">▼ ' + _esc(cat).toUpperCase() + ' (' + _esc(String(rows.length)) + ' itens)</div>' +
              '<div style="color:#94a3b8;font-size:12px">' + (open ? 'ocultar' : 'mostrar') + '</div>' +
            '</div>' +
            '<div data-cat-body="1" style="display:' + (open ? 'block' : 'none') + ';padding:10px 10px">' +
              rows.map(function(x) {
                var q = Number(x?.quantidade_atual || 0) || 0;
                var un = String(x?.unidade || 'un');
                return (
                  '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 12px;background:rgba(255,255,255,0.02);margin-bottom:10px">' +
                    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">' +
                      '<div style="font-weight:900;color:#e2e8f0">' + _esc(x.nome || '—') + '</div>' +
                      '<div>' + _statusBadge(x.quantidade_atual, x.quantidade_minima) + '</div>' +
                    '</div>' +
                    '<div style="margin-top:6px;color:#94a3b8;font-size:.82rem">Qtd: <b style="color:#e2e8f0">' + _esc(String(q)) + _esc(un) + '</b> · Mín: <b style="color:#e2e8f0">' + _esc(String(x.quantidade_minima ?? 0)) + _esc(un) + '</b></div>' +
                    '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
                      '<button class="btn btn-accent btn-sm" data-act="ent" data-id="' + _esc(x.id) + '" style="min-height:44px;flex:1">+</button>' +
                      '<button class="btn btn-ghost btn-sm" data-act="sai" data-id="' + _esc(x.id) + '" style="min-height:44px;flex:1">-</button>' +
                      '<button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + _esc(x.id) + '" style="min-height:44px;flex:2">Editar</button>' +
                    '</div>' +
                  '</div>'
                );
              }).join('') +
            '</div>' +
          '</div>'
        );
      }).join('') +
      '<button id="mat-fab" style="position:fixed;right:16px;bottom:84px;z-index:9999;width:54px;height:54px;border-radius:999px;border:none;background:var(--accent);color:#fff;font-size:26px;font-weight:900;box-shadow:0 16px 40px rgba(0,0,0,0.5);cursor:pointer">+</button>';
    } else {
      host.innerHTML = cats.map(function(cat) {
        var rows = groups[cat].slice().sort(function(a, b) { return String(a.nome || '').localeCompare(String(b.nome || '')); });
        return (
          '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:12px;overflow:hidden">' +
            '<div style="padding:10px 12px;background:rgba(255,255,255,0.03);font-weight:900;color:#e2e8f0">' + _esc(cat) + '</div>' +
            '<div style="overflow:auto">' +
              '<table style="width:100%;border-collapse:collapse;min-width:780px">' +
                '<thead><tr>' +
                  '<th style="text-align:left;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Nome</th>' +
                  '<th style="text-align:left;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Fornecedor</th>' +
                  '<th style="text-align:right;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Qtd</th>' +
                  '<th style="text-align:left;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Un</th>' +
                  '<th style="text-align:center;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Status</th>' +
                  '<th style="text-align:center;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">Ações</th>' +
                '</tr></thead>' +
                '<tbody>' +
                  rows.map(function(x) {
                    return '<tr>' +
                      '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:900;color:#e2e8f0">' + _esc(x.nome || '') + '</td>' +
                      '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);color:#94a3b8">' + _esc(x.fornecedor || '—') + '</td>' +
                      '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;font-family:var(--mono)">' + _esc(String(x.quantidade_atual ?? 0)) + '</td>' +
                      '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06)">' + _esc(x.unidade || 'un') + '</td>' +
                      '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center">' + _statusBadge(x.quantidade_atual, x.quantidade_minima) + '</td>' +
                      '<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;white-space:nowrap">' +
                        '<button class="btn btn-ghost btn-sm" data-act="mov" data-id="' + _esc(x.id) + '">⇄ Movimentar</button>' +
                        '<button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + _esc(x.id) + '" style="margin-left:6px">✏</button>' +
                        '<button class="btn btn-ghost btn-sm" data-act="del" data-id="' + _esc(x.id) + '" style="margin-left:6px;color:var(--red)">🗑</button>' +
                      '</td>' +
                    '</tr>';
                  }).join('') +
                '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }
    var fab = document.getElementById('mat-fab');
    if (fab && !fab.dataset.bound) {
      fab.dataset.bound = '1';
      fab.onclick = function() { _openMaterialForm(null); };
    }
    host.querySelectorAll('[data-act="toggle-cat"]').forEach(function(h) {
      if (h.dataset.bound === '1') return;
      h.dataset.bound = '1';
      h.onclick = function() {
        var box = h.parentElement;
        var cat = String(box.getAttribute('data-cat') || '');
        var body = box.querySelector('[data-cat-body="1"]');
        if (!body) return;
        var open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        try { sessionStorage.setItem('mat_cat_' + cat, open ? '0' : '1'); } catch (_) {}
      };
    });
    host.querySelectorAll('button[data-act]').forEach(function(b) {
      var id = String(b.getAttribute('data-id') || '').trim();
      var act = String(b.getAttribute('data-act') || '').trim();
      b.onclick = function() {
        var item = (_cacheMateriais.items || []).find(function(r) { return String(r?.id || '') === id; }) || null;
        if (act === 'edit') return _openMaterialForm(item);
        if (act === 'mov') return _openMaterialMov(item);
        if (act === 'ent') return _openMaterialMov(item, 'entrada');
        if (act === 'sai') return _openMaterialMov(item, 'saida');
        if (act === 'del') return _deleteMaterial(item);
      };
    });
  }

  function _openMaterialForm(item) {
    var categoriasPadrao = ['Pregos', 'Parafusos', 'Fitas', 'Outros'];
    var cats = categoriasPadrao.slice();
    try {
      (_cacheMateriais.items || []).forEach(function(x) {
        var c = String(x?.categoria || '').trim();
        if (c && cats.indexOf(c) < 0) cats.push(c);
      });
    } catch (_) {}
    cats = cats.filter(Boolean).sort(function(a, b) { return a.localeCompare(b); });

    _openModal({
      id: 'mat-form',
      title: item ? '✏ Editar material' : '＋ Novo material',
      render: function(host, close) {
        var v = item || {};
        host.innerHTML =
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
            '<div style="display:grid;gap:6px;grid-column:1/-1">' +
              '<label style="font-size:11px;color:#94a3b8;font-weight:800">Categoria *</label>' +
              '<datalist id="mat-cat-dl">' + cats.map(function(c) { return '<option value="' + _esc(c) + '"></option>'; }).join('') + '</datalist>' +
              '<input id="mat-cat" list="mat-cat-dl" placeholder="Ex: Fitas" value="' + _esc(v.categoria || '') + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" />' +
            '</div>' +
            '<div style="grid-column:1/-1;display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Nome *</label><input id="mat-nome" value="' + _esc(v.nome || '') + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Unidade</label><input id="mat-un" value="' + _esc(v.unidade || 'un') + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Fornecedor</label><input id="mat-forn" value="' + _esc(v.fornecedor || '') + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Qtd atual</label><input id="mat-qtd" type="number" step="0.01" value="' + _esc(v.quantidade_atual ?? 0) + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Qtd mínima</label><input id="mat-min" type="number" step="0.01" value="' + _esc(v.quantidade_minima ?? 0) + '" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="grid-column:1/-1;display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Observações</label><textarea id="mat-obs" rows="3" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none;resize:vertical">' + _esc(v.observacoes || '') + '</textarea></div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px">' +
            '<button class="btn btn-ghost btn-sm" id="mat-cancel">Cancelar</button>' +
            '<button class="btn btn-accent btn-sm" id="mat-save">Salvar</button>' +
          '</div>';

        var sel = host.querySelector('#mat-cat');
        if (!sel.value) sel.value = String(v.categoria || cats[0] || 'Outros');

        host.querySelector('#mat-cancel').onclick = close;
        host.querySelector('#mat-save').onclick = function() {
          var categoria = String(sel.value || '').trim();
          var payload = {
            empresa_id: (window.CURRENT_USER?.empresa_id || window.CURRENT_USER?.empId || '') || undefined,
            categoria: categoria,
            nome: String(host.querySelector('#mat-nome').value || '').trim(),
            unidade: String(host.querySelector('#mat-un').value || 'un').trim() || 'un',
            fornecedor: String(host.querySelector('#mat-forn').value || '').trim(),
            quantidade_atual: Number(host.querySelector('#mat-qtd').value || 0) || 0,
            quantidade_minima: Number(host.querySelector('#mat-min').value || 0) || 0,
            observacoes: String(host.querySelector('#mat-obs').value || '').trim(),
          };
          if (!payload.categoria || !payload.nome) return _toast('Categoria e nome são obrigatórios', 'var(--red)');
          var url = item ? ('/api/estoque_materiais/' + encodeURIComponent(item.id)) : '/api/estoque_materiais';
          var method = item ? 'PUT' : 'POST';
          _apiJson(url, { method: method, headers: _hdrJson(), body: JSON.stringify(payload) })
            .then(function() { return _loadMateriais(true); })
            .then(function() { _renderMateriaisList(); close(); _toast('✓ Salvo', 'var(--green)'); })
            .catch(function(e) { _toast(String(e?.message || e || 'Erro ao salvar'), 'var(--red)'); });
        };
      }
    });
  }

  function _openMaterialMov(item, presetTipo) {
    if (!item) return;
    _openModal({
      id: 'mat-mov',
      title: '⇄ Movimentar material',
      render: function(host, close) {
        var tipoPreset = String(presetTipo || '').trim().toLowerCase();
        host.innerHTML =
          '<div style="color:#e2e8f0;font-weight:900;margin-bottom:10px">' + _esc(item.nome || '') + '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
            (tipoPreset ? (
              '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Tipo</label><div style="background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;font-weight:900">' + (tipoPreset === 'saida' ? 'Saída' : 'Entrada') + '</div></div>'
            ) : (
              '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Tipo</label><select id="mm-tipo" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none"><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>'
            )) +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Quantidade</label><input id="mm-qtd" type="number" step="0.01" value="" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">OF (opcional)</label><input id="mm-of" value="" placeholder="Ex: 725" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Valor unit. (opcional)</label><input id="mm-vu" type="number" step="0.01" value="" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
            '<div style="grid-column:1/-1;display:grid;gap:6px"><label style="font-size:11px;color:#94a3b8;font-weight:800">Obs</label><input id="mm-obs" value="" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" /></div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px">' +
            '<button class="btn btn-ghost btn-sm" id="mm-cancel">Cancelar</button>' +
            '<button class="btn btn-accent btn-sm" id="mm-save">Salvar</button>' +
          '</div>';
        host.querySelector('#mm-cancel').onclick = close;
        host.querySelector('#mm-save').onclick = function() {
          var payload = {
            empresa_id: (window.CURRENT_USER?.empresa_id || window.CURRENT_USER?.empId || '') || undefined,
            tipo: tipoPreset || String((host.querySelector('#mm-tipo') || {}).value || '').trim(),
            quantidade: Number(host.querySelector('#mm-qtd').value || 0) || 0,
            of_numero: String(host.querySelector('#mm-of').value || '').trim(),
            valor_unitario: Number(host.querySelector('#mm-vu').value || 0) || 0,
            obs: String(host.querySelector('#mm-obs').value || '').trim(),
          };
          _apiJson('/api/estoque_materiais/' + encodeURIComponent(item.id) + '/movimentos', { method: 'POST', headers: _hdrJson(), body: JSON.stringify(payload) })
            .then(function() { return _loadMateriais(true); })
            .then(function() { _renderMateriaisList(); close(); _toast('✓ Movimento registrado', 'var(--green)'); })
            .catch(function(e) { _toast(String(e?.message || e || 'Erro ao movimentar'), 'var(--red)'); });
        };
      }
    });
  }

  function _deleteMaterial(item) {
    if (!item) return;
    if (!confirm('Excluir este material?')) return;
    _apiJson('/api/estoque_materiais/' + encodeURIComponent(item.id), { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } })
      .then(function() { return _loadMateriais(true); })
      .then(function() { _renderMateriaisList(); _toast('🗑 Excluído', 'var(--orange)'); })
      .catch(function(e) { _toast(String(e?.message || e || 'Erro ao excluir'), 'var(--red)'); });
  }

  function _ensureFacasCampos() {
    if (window._patchFacasTipoCorteV1) return;
    window._patchFacasTipoCorteV1 = true;

    function injectFields(f) {
      var modal = document.getElementById('modal-faca1');
      if (!modal) return;
      var body = modal.querySelector('.modal-body');
      if (!body) return;
      if (body.querySelector('#fa1-tipo-corte')) return;

      try {
        var oldM = body.querySelector('#fa1-maquina-sel');
        var oldWrap = oldM ? oldM.closest('.mf') : null;
        if (oldWrap) oldWrap.style.display = 'none';
      } catch (_) {}

      var wrap = document.createElement('div');
      wrap.className = 'mf';
      wrap.style.cssText = 'grid-column:1/-1';
      wrap.innerHTML =
        '<label>TIPO DE CORTE *</label>' +
        '<div id="fa1-tipo-corte" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.85rem"><input type="radio" name="fa1-tc" value="Só Tampa"> Só Tampa</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.85rem"><input type="radio" name="fa1-tc" value="Só Fundo"> Só Fundo</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.85rem"><input type="radio" name="fa1-tc" value="Tampa e Fundo"> Tampa e Fundo</label>' +
        '</div>';

      var wrap2 = document.createElement('div');
      wrap2.className = 'mf';
      wrap2.style.cssText = 'grid-column:1/-1';
      wrap2.innerHTML =
        '<label>MÁQUINA COMPATÍVEL *</label>' +
        '<div id="fa1-maquinas-compat" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.85rem"><input type="checkbox" value="Corte Vinco Rotativa"> Corte Vinco Rotativa</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.85rem"><input type="checkbox" value="Corte Plana"> Corte Plana</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.85rem"><input type="checkbox" value="Impressora 01"> Impressora 01</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.85rem"><input type="checkbox" value="Impressora 02"> Impressora 02</label>' +
        '</div>';

      var wrap3 = document.createElement('div');
      wrap3.className = 'mf';
      wrap3.style.cssText = 'grid-column:1/-1';
      wrap3.innerHTML =
        '<label>LOCALIZAÇÃO FÍSICA *</label>' +
        '<input id="fa1-local" placeholder="Ex: Prateleira A3 / Na máquina CVR" style="width:100%;background:var(--s2);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;font-size:.85rem;font-family:var(--font)" />' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">' +
          '<div class="mf" style="margin:0"><label style="display:block;margin-bottom:6px">DATA DE FABRICAÇÃO *</label><input id="fa1-datafab" type="date" style="width:100%;background:var(--s2);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;font-size:.85rem;font-family:var(--font)" /></div>' +
          '<div class="mf" style="margin:0"><label style="display:block;margin-bottom:6px">VIDA ÚTIL (dias) *</label><input id="fa1-vida" type="number" min="1" step="1" value="730" style="width:100%;background:var(--s2);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;font-size:.85rem;font-family:var(--font)" /></div>' +
        '</div>';

      var grid = body.querySelector('div[style*="grid-template-columns"]');
      if (grid) {
        var obs = body.querySelector('#fa1-obs')?.closest('.mf') || null;
        if (obs && obs.parentElement === grid) {
          obs.insertAdjacentElement('beforebegin', wrap3);
          obs.insertAdjacentElement('beforebegin', wrap2);
          obs.insertAdjacentElement('beforebegin', wrap);
        } else {
          grid.appendChild(wrap);
          grid.appendChild(wrap2);
          grid.appendChild(wrap3);
        }
      } else {
        body.appendChild(wrap);
        body.appendChild(wrap2);
        body.appendChild(wrap3);
      }

      try {
        var tc = String(f?.tipo_corte || '').trim();
        if (tc) {
          var r = body.querySelector('#fa1-tipo-corte input[type="radio"][value="' + tc.replace(/"/g, '') + '"]');
          if (r) r.checked = true;
        }
      } catch (_) {}
      try {
        var arr = Array.isArray(f?.maquinas) ? f.maquinas : [];
        body.querySelectorAll('#fa1-maquinas-compat input[type="checkbox"]').forEach(function(ch) {
          ch.checked = arr.indexOf(String(ch.value)) >= 0;
        });
      } catch (_) {}
      try {
        var local = String(f?.localizacao_fisica || '').trim();
        if (local) body.querySelector('#fa1-local').value = local;
      } catch (_) {}
      try {
        var df = String(f?.data_fabricacao || '').slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(df)) body.querySelector('#fa1-datafab').value = df;
      } catch (_) {}
      try {
        var vd = Math.trunc(Number(f?.vida_util_dias ?? 730) || 730);
        body.querySelector('#fa1-vida').value = String(vd > 0 ? vd : 730);
      } catch (_) {}
    }

    function readTipoCorte() {
      var modal = document.getElementById('modal-faca1');
      var r = modal ? modal.querySelector('#fa1-tipo-corte input[type="radio"]:checked') : null;
      return r ? String(r.value || '').trim() : '';
    }

    function readMaquinasCompat() {
      var modal = document.getElementById('modal-faca1');
      var out = [];
      if (!modal) return out;
      modal.querySelectorAll('#fa1-maquinas-compat input[type="checkbox"]').forEach(function(ch) {
        if (ch.checked) out.push(String(ch.value || '').trim());
      });
      return out.filter(Boolean);
    }

    var origAbrir = window.abrirModalFaca1;
    if (typeof origAbrir === 'function') {
      window.abrirModalFaca1 = function(id) {
        var r = origAbrir.apply(this, arguments);
        try {
          var f = id ? (Array.isArray(window.FACAS) ? window.FACAS.find(function(x) { return String(x?.id || '') === String(id); }) : null) : null;
          injectFields(f);
        } catch (_) {}
        return r;
      };
    }

    function buildPayload(isEdit, id) {
      var nome = String(document.getElementById('fa1-nome')?.value || '').trim();
      if (!nome) throw new Error('Informe o nome da faca');
      var medidas = String(document.getElementById('fa1-medidas')?.value || '').trim();
      var valor = Number(document.getElementById('fa1-valor')?.value || 0) || 0;
      var obs = String(document.getElementById('fa1-obs')?.value || '').trim();
      var tipoCorte = readTipoCorte();
      var maqCompat = readMaquinasCompat();
      if (!tipoCorte) throw new Error('Informe o tipo de corte');
      if (!maqCompat.length) throw new Error('Selecione ao menos uma máquina compatível');
      var local = String(document.getElementById('fa1-local')?.value || '').trim();
      var dataFab = String(document.getElementById('fa1-datafab')?.value || '').trim();
      var vida = Math.trunc(Number(document.getElementById('fa1-vida')?.value || 730) || 0);
      if (!local) throw new Error('Informe a localização física');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dataFab)) throw new Error('Informe a data de fabricação');
      if (!(vida > 0)) throw new Error('Informe a vida útil (dias)');
      var cliChips = [];
      try {
        cliChips = (typeof window._getChips === 'function' ? (window._getChips('fa1-clientes-chips') || []) : []);
      } catch (_) { cliChips = []; }
      cliChips = (Array.isArray(cliChips) ? cliChips : []).map(function(x) { return typeof x === 'object' ? (x.id || x.nome || x.name || String(x)) : String(x); }).filter(Boolean);
      var payload = {
        nome: nome,
        medidas: medidas,
        valor: valor,
        obs: obs,
        emp_id: _emp(),
        tipo_corte: tipoCorte,
        maquinas: maqCompat,
        clientes: cliChips,
        localizacao_fisica: local,
        data_fabricacao: dataFab,
        vida_util_dias: vida,
      };
      if (isEdit) payload.id = id;
      return payload;
    }

    window.salvarFaca1 = async function() {
      try {
        var payload = buildPayload(false, '');
        var r = await fetch('/api/facas_estoque', { method: 'POST', headers: _hdrJson(), body: JSON.stringify(payload) });
        var d = await r.json().catch(function() { return null; });
        if (!r.ok || !d || d.ok === false) throw new Error(d?.error || ('HTTP ' + r.status));
        var newId = String(d?.data?.id || d?.id || d?.data?.[0]?.id || '').trim();
        try {
          var inp = document.getElementById('fa1-foto');
          var file = inp && inp.files && inp.files[0] ? inp.files[0] : null;
          if (newId && file && typeof window.estoqueUploadFoto === 'function') {
            await window.estoqueUploadFoto('faca', newId, file);
          }
        } catch (_) {}
        try { if (typeof window.carregarFacas === 'function') await window.carregarFacas(); } catch (_) {}
        try { if (typeof window.renderFacas1 === 'function') window.renderFacas1(); } catch (_) {}
        try { if (typeof window.fechar === 'function') window.fechar('modal-faca1'); } catch (_) {}
        _toast('✓ Faca salva', 'var(--green)');
      } catch (e) {
        _toast(String(e?.message || e || 'Erro ao salvar faca'), 'var(--red)');
      }
    };

    window.salvarEdicaoFaca1 = async function(id) {
      try {
        var fid = String(id || '').trim();
        if (!fid) throw new Error('ID inválido');
        var payload = buildPayload(true, fid);
        var r = await fetch('/api/facas_estoque/' + encodeURIComponent(fid), { method: 'PUT', headers: _hdrJson(), body: JSON.stringify(payload) });
        var d = await r.json().catch(function() { return null; });
        if (!r.ok || !d || d.ok === false) throw new Error(d?.error || ('HTTP ' + r.status));
        try {
          var inp = document.getElementById('fa1-foto');
          var file = inp && inp.files && inp.files[0] ? inp.files[0] : null;
          if (file && typeof window.estoqueUploadFoto === 'function') {
            await window.estoqueUploadFoto('faca', fid, file);
          }
        } catch (_) {}
        try { if (typeof window.carregarFacas === 'function') await window.carregarFacas(); } catch (_) {}
        try { if (typeof window.renderFacas1 === 'function') window.renderFacas1(); } catch (_) {}
        try { if (typeof window.fechar === 'function') window.fechar('modal-faca1'); } catch (_) {}
        _toast('✓ Faca atualizada', 'var(--green)');
      } catch (e) {
        _toast(String(e?.message || e || 'Erro ao atualizar faca'), 'var(--red)');
      }
    };

    function badge(txt, bg, fg) {
      return '<span style="background:' + bg + ';color:' + fg + ';border-radius:999px;padding:2px 8px;font-size:11px;font-weight:900;white-space:nowrap">' + _esc(txt) + '</span>';
    }

    function applyBadges(scopeId) {
      var body = document.getElementById(scopeId);
      if (!body) return;
      var trs = Array.prototype.slice.call(body.querySelectorAll('tr'));
      trs.forEach(function(tr) {
        if (tr.dataset.patchBadges === '1') return;
        var btn = tr.querySelector('button[onclick^="abrirModalFaca1("]');
        if (!btn) return;
        var mm = String(btn.getAttribute('onclick') || '').match(/abrirModalFaca1\\('([^']+)'\\)/);
        var id = mm && mm[1] ? mm[1] : '';
        if (!id) return;
        var f = (Array.isArray(window.FACAS) ? window.FACAS.find(function(x) { return String(x?.id || '') === id; }) : null) || null;
        if (!f) return;
        var nomeTd = tr.children && tr.children[1] ? tr.children[1] : null;
        if (!nomeTd) return;
        var tipo = String(f.tipo_corte || '').trim();
        var badges = [];
        if (tipo) {
          var bg = (tipo === 'Só Tampa') ? '#60a5fa' : (tipo === 'Só Fundo') ? '#a855f7' : '#10b981';
          badges.push(badge(tipo, bg, '#0b1220'));
        }
        var maq = Array.isArray(f.maquinas) ? f.maquinas : [];
        var wanted = ['Corte Vinco Rotativa', 'Corte Plana', 'Impressora 01', 'Impressora 02'];
        wanted.forEach(function(w) {
          if (maq.indexOf(w) >= 0) badges.push(badge(w, 'rgba(255,255,255,0.06)', '#e2e8f0'));
        });
        if (badges.length) {
          nomeTd.innerHTML = '<div style="display:flex;flex-direction:column;gap:6px">' +
            '<div>' + nomeTd.innerHTML + '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap">' + badges.join('') + '</div>' +
          '</div>';
        }
        tr.dataset.patchBadges = '1';
      });
    }

    function _vidaInfo(f) {
      var df = String(f?.data_fabricacao || '').slice(0, 10);
      var vida = Math.trunc(Number(f?.vida_util_dias ?? 730) || 0);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(df) || !(vida > 0)) return { pct: 0, cor: '#10b981', usado: 0 };
      var diasUsados = Math.floor((Date.now() - new Date(df + 'T00:00:00').getTime()) / 86400000);
      if (!Number.isFinite(diasUsados) || diasUsados < 0) diasUsados = 0;
      var pct = Math.min(100, Math.round((diasUsados / vida) * 100));
      var cor = pct <= 60 ? '#10b981' : (pct <= 85 ? '#f59e0b' : '#ef4444');
      return { pct: pct, cor: cor, usado: diasUsados };
    }

    function _openMoverFaca(f) {
      if (!f) return;
      _openModal({
        id: 'faca-mov',
        title: '📍 Movimentar faca',
        render: function(host, close) {
          host.innerHTML =
            '<div style="color:#e2e8f0;font-weight:900;margin-bottom:10px">' + _esc(f.nome || '') + '</div>' +
            '<div style="display:grid;gap:6px">' +
              '<label style="font-size:11px;color:#94a3b8;font-weight:800">Nova localização</label>' +
              '<input id="faca-mov-local" value="' + _esc(f.localizacao_fisica || '') + '" placeholder="Ex: Prateleira A3 / Na máquina CVR" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" />' +
            '</div>' +
            '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px">' +
              '<button class="btn btn-ghost btn-sm" id="faca-mov-cancel">Cancelar</button>' +
              '<button class="btn btn-accent btn-sm" id="faca-mov-save">Salvar</button>' +
            '</div>';
          host.querySelector('#faca-mov-cancel').onclick = close;
          host.querySelector('#faca-mov-save').onclick = function() {
            var local = String(host.querySelector('#faca-mov-local').value || '').trim();
            if (!local) return _toast('Informe a localização', 'var(--red)');
            fetch('/api/facas_estoque/' + encodeURIComponent(f.id), {
              method: 'PUT',
              headers: _hdrJson(),
              body: JSON.stringify({ empId: _emp(), localizacao_fisica: local })
            }).then(function(r) { return r.json().then(function(j) { return { r: r, j: j }; }); })
              .then(function(x) {
                if (!x.r.ok || !x.j || x.j.ok === false) throw new Error(x.j?.error || ('HTTP ' + x.r.status));
                try { f.localizacao_fisica = local; } catch (_) {}
                try { if (typeof window.renderFacas1 === 'function') window.renderFacas1(); } catch (_) {}
                try { if (typeof window.renderFacas2 === 'function') window.renderFacas2(); } catch (_) {}
                close();
                _toast('✓ Localização atualizada', 'var(--green)');
              })
              .catch(function(e) { _toast(String(e?.message || e || 'Erro ao salvar'), 'var(--red)'); });
          };
        }
      });
    }

    function _renderFacaCards(pageId) {
      var page = document.getElementById('page-' + pageId);
      if (!page) return;
      if (!_isMobile()) return;
      var table = page.querySelector('table');
      if (table) table.style.display = 'none';
      var host = page.querySelector('#' + pageId + '-cards-host');
      if (!host) {
        host = document.createElement('div');
        host.id = pageId + '-cards-host';
        host.style.marginTop = '10px';
        var insertAt = page.querySelector('.ptoolbar') ? page.querySelector('.ptoolbar').nextSibling : page.firstChild;
        try { page.insertBefore(host, insertAt); } catch (_) { page.appendChild(host); }
      }
      var busca = '';
      try { busca = String(document.getElementById(pageId + '-busca')?.value || '').toLowerCase(); } catch (_) { busca = ''; }
      var list = Array.isArray(window.FACAS) ? window.FACAS.slice() : [];
      if (busca) list = list.filter(function(f) { return (String(f?.nome || '') + ' ' + String(f?.obs || '') + ' ' + String(f?.medidas || '')).toLowerCase().indexOf(busca) >= 0; });
      if (!list.length) {
        host.innerHTML = '<div style="padding:14px;color:var(--text3);font-size:.85rem">Nenhuma faca cadastrada.</div>';
        return;
      }
      host.innerHTML = list.map(function(f) {
        var v = _vidaInfo(f);
        var loc = String(f?.localizacao_fisica || '').trim();
        var tipo = String(f?.tipo_corte || '').trim();
        var maq = Array.isArray(f?.maquinas) ? f.maquinas : [];
        var maqShort = maq.map(function(m) {
          if (m === 'Corte Vinco Rotativa') return 'CVR';
          if (m === 'Corte Plana') return 'CP';
          if (m === 'Impressora 01') return 'IMP01';
          if (m === 'Impressora 02') return 'IMP02';
          return String(m || '').trim();
        }).filter(Boolean);
        var alert = v.pct >= 86 ? ('<div style="margin-top:6px;color:#fecaca;font-size:.78rem;font-weight:900">⚠️ Vida útil alta</div>') : '';
        return (
          '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 12px;background:rgba(255,255,255,0.02);margin-bottom:10px">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">' +
              '<div style="font-weight:900;color:#e2e8f0">📐 ' + _esc(f.medidas || f.nome || '—') + '</div>' +
              '<div style="color:#94a3b8;font-size:.78rem">📍 ' + _esc(loc || '—') + '</div>' +
            '</div>' +
            '<div style="margin-top:10px">' +
              '<div style="height:10px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden">' +
                '<div style="height:10px;width:' + _esc(String(v.pct)) + '%;background:' + _esc(v.cor) + '"></div>' +
              '</div>' +
              '<div style="margin-top:6px;color:#94a3b8;font-size:.78rem;font-weight:900">' + _esc(String(v.pct)) + '% da vida útil</div>' +
              alert +
            '</div>' +
            '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">' +
              (tipo ? ('<span style="background:rgba(255,255,255,0.06);color:#e2e8f0;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:900">🏷️ ' + _esc(tipo) + '</span>') : '') +
            '</div>' +
            '<div style="margin-top:8px;color:#94a3b8;font-size:.82rem">🖨️ ' + _esc(maqShort.join('  ') || '—') + '</div>' +
            '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
              '<button class="btn btn-ghost btn-sm" data-act="faca-edit" data-id="' + _esc(f.id) + '" style="min-height:44px;flex:1">Editar</button>' +
              '<button class="btn btn-accent btn-sm" data-act="faca-mov" data-id="' + _esc(f.id) + '" style="min-height:44px;flex:1">Movimentar</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      host.querySelectorAll('button[data-act="faca-edit"]').forEach(function(b) {
        var id = String(b.getAttribute('data-id') || '').trim();
        b.onclick = function() { try { window.abrirModalFaca1(id); } catch (_) {} };
      });
      host.querySelectorAll('button[data-act="faca-mov"]').forEach(function(b) {
        var id = String(b.getAttribute('data-id') || '').trim();
        b.onclick = function() {
          var f = (Array.isArray(window.FACAS) ? window.FACAS.find(function(x) { return String(x?.id || '') === id; }) : null) || null;
          _openMoverFaca(f);
        };
      });
    }

    var origR1 = window.renderFacas1;
    if (typeof origR1 === 'function') {
      window.renderFacas1 = function() {
        var r = origR1.apply(this, arguments);
        try { applyBadges('facas1-body'); } catch (_) {}
        try { _renderFacaCards('facas1'); } catch (_) {}
        return r;
      };
    }
    var origR2 = window.renderFacas2;
    if (typeof origR2 === 'function') {
      window.renderFacas2 = function() {
        var r = origR2.apply(this, arguments);
        try { applyBadges('facas2-body'); } catch (_) {}
        try { _renderFacaCards('facas2'); } catch (_) {}
        return r;
      };
    }
  }

  function tick() {
    try { _patchGoEstoques(); } catch (_) {}
    try { _ensureDrawerModules(); } catch (_) {}
    try { _ensureFacasCampos(); } catch (_) {}
    try { _ensurePageSimple('dashboard-estoques', '📊 Dashboard de Estoques'); } catch (_) {}
    try { _ensurePageSimple('historico-movimentos', '🕘 Histórico de Movimentos'); } catch (_) {}
    try { _ensurePageSimple('custo-producao', '🧾 Custo de Produção'); } catch (_) {}
    try {
      var p1 = document.getElementById('page-estoque-tintas');
      if (p1 && p1.style.display !== 'none') _renderTintasPage(false);
    } catch (_) {}
    try {
      var p2 = document.getElementById('page-estoque-materiais');
      if (p2 && p2.style.display !== 'none') _renderMateriaisPage(false);
    } catch (_) {}
    try {
      var p0 = document.getElementById('page-dashboard-estoques');
      if (p0 && p0.style.display !== 'none') _renderDashboardEstoques(false);
    } catch (_) {}
    try {
      var p3 = document.getElementById('page-historico-movimentos');
      if (p3 && p3.style.display !== 'none') _renderHistoricoMovimentos(false);
    } catch (_) {}
    try {
      var p4 = document.getElementById('page-custo-producao');
      if (p4 && p4.style.display !== 'none') _renderCustoProducao(false);
    } catch (_) {}

    try {
      var host = document.querySelector('#ng-estoques .nav-group-items');
      if (host) {
        var mk = function(id, label, icon, pageId) {
          var el = document.getElementById(id);
          if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.className = 'nav-item';
            el.innerHTML = '<span class="ico">' + icon + '</span>' + label;
          }
          el.onclick = function() {
            try { window.go(pageId); } catch (_) {}
            try { window.closeNavGroupsExcept && window.closeNavGroupsExcept('ng-estoques'); } catch (_) {}
          };
          return el;
        };
        var map = {
          estoque: document.getElementById('menu-estoque'),
          facas1: document.getElementById('menu-facas'),
          cliches: document.getElementById('menu-cliches'),
          'estoque-materiais': mk('menu-estoque-materiais', 'Estoque de Materiais', '🧰', 'estoque-materiais'),
          'estoque-tintas': mk('menu-estoque-tintas', 'Estoque de Tintas', '🎨', 'estoque-tintas'),
          'dashboard-estoques': mk('menu-dashboard-estoques', 'Dashboard de Estoques', '📊', 'dashboard-estoques')
        };
        ['estoque', 'facas1', 'cliches', 'estoque-materiais', 'estoque-tintas', 'dashboard-estoques'].forEach(function(k) {
          var el = map[k];
          if (el) host.appendChild(el);
        });
      }
    } catch (_) {}

    try {
      if (typeof window.renderEstoqueTintas !== 'function' || !window.renderEstoqueTintas._patchedV1) {
        window.renderEstoqueTintas = async function() {
          try {
            if (typeof window.go === 'function') window.go('estoque-tintas');
            setTimeout(function() { try { _renderTintasPage(true); } catch (e) {} }, 20);
          } catch (e) {
            var host = document.getElementById('conteudo-principal') || document.getElementById('content') || document.body;
            try { host.innerHTML = '<div style="padding:20px;color:var(--red)">Erro ao carregar tintas: ' + _esc(String(e?.message || e || '')) + '</div>'; } catch (_) {}
          }
        };
        window.renderEstoqueTintas._patchedV1 = true;
      }
      if (typeof window.renderEstoqueMateriais !== 'function' || !window.renderEstoqueMateriais._patchedV1) {
        window.renderEstoqueMateriais = async function() {
          try {
            if (typeof window.go === 'function') window.go('estoque-materiais');
            setTimeout(function() { try { _renderMateriaisPage(true); } catch (e) {} }, 20);
          } catch (e) {
            var host = document.getElementById('conteudo-principal') || document.getElementById('content') || document.body;
            try { host.innerHTML = '<div style="padding:20px;color:var(--red)">Erro ao carregar materiais: ' + _esc(String(e?.message || e || '')) + '</div>'; } catch (_) {}
          }
        };
        window.renderEstoqueMateriais._patchedV1 = true;
      }
      if (typeof window.renderDashboardEstoques !== 'function' || !window.renderDashboardEstoques._patchedV1) {
        window.renderDashboardEstoques = async function() {
          try {
            if (typeof window.go === 'function') window.go('dashboard-estoques');
            setTimeout(function() { try { _renderDashboardEstoques(true); } catch (e) {} }, 20);
          } catch (e) {
            var host = document.getElementById('conteudo-principal') || document.getElementById('content') || document.body;
            try { host.innerHTML = '<div style="padding:20px;color:var(--red)">Erro ao carregar dashboard: ' + _esc(String(e?.message || e || '')) + '</div>'; } catch (_) {}
          }
        };
        window.renderDashboardEstoques._patchedV1 = true;
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 400);
      setInterval(tick, 1200);
    });
  } else {
    setTimeout(tick, 400);
    setInterval(tick, 1200);
  }
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

#page-historico-passagens{
  padding:20px !important;
}
#hist-graficos-wrap{
  padding:20px !important;
  margin-bottom:16px !important;
}
.patch-hist-graficos-grid{
  display:flex !important;
  gap:24px !important;
  width:100% !important;
  align-items:stretch !important;
}
.patch-hist-graf-card{
  flex:1 1 0 !important;
  min-width:0 !important;
}
.patch-hist-graf-canvaswrap{
  height:min(400px, 45vh) !important;
}
.patch-hist-graf-canvaswrap canvas{
  width:100% !important;
  height:100% !important;
}
.patch-hist-recentes{
  margin-top:14px !important;
  background:rgba(255,255,255,0.03) !important;
  border:1px solid rgba(255,255,255,0.08) !important;
  border-radius:12px !important;
  overflow:hidden !important;
}
.patch-hist-recentes .h{
  padding:10px 12px !important;
  color:#94a3b8 !important;
  font-size:12px !important;
  font-weight:700 !important;
  border-bottom:1px solid rgba(255,255,255,0.08) !important;
}
.patch-hist-recentes table{
  width:100% !important;
  border-collapse:collapse !important;
  font-size:12px !important;
}
.patch-hist-recentes th,
.patch-hist-recentes td{
  padding:8px 10px !important;
  border-bottom:1px solid rgba(255,255,255,0.05) !important;
  white-space:nowrap !important;
}
.patch-hist-recentes th{
  color:#64748b !important;
  font-weight:800 !important;
  text-transform:uppercase !important;
  letter-spacing:0.06em !important;
}
.patch-hist-recentes td{
  color:#e2e8f0 !important;
}
.patch-hist-recentes td.q{
  text-align:right !important;
  font-weight:800 !important;
}
@media (max-width: 980px){
  .patch-hist-graficos-grid{
    flex-direction:column !important;
    gap:12px !important;
  }
}
      `;
      document.head.appendChild(st);
    }
  } catch (_) {}

  try {
    if (!window.__patchInativosPrintV4) {
      window.__patchInativosPrintV4 = 1;
      window.addEventListener('beforeprint', function() {
        try {
          var tem =
            document.getElementById('modalClientesInativos') ||
            document.getElementById('listaClientesInativos') ||
            document.getElementById('tabelaClientesInativos') ||
            document.getElementById('relatorio-inativos') ||
            document.querySelector('.relatorio-inativos');
          if (!tem) return;
          if (document.getElementById('patch-print-inativos-style')) return;
          var st = document.createElement('style');
          st.id = 'patch-print-inativos-style';
          st.textContent =
            'body{color:#111 !important;background:#fff !important;}' +
            'td,th,span,p,div,a{color:#111 !important;}' +
            '.cliente-nome,.dias-sem-pedido{color:#000 !important;font-weight:500 !important;}' +
            '@media print{*{color:#000 !important;-webkit-print-color-adjust:exact !important;}}';
          document.head.appendChild(st);
        } catch (_) {}
      });
      window.addEventListener('afterprint', function() {
        try { document.getElementById('patch-print-inativos-style')?.remove(); } catch (_) {}
      });
    }
  } catch (_) {}

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
    var emp = '';
    try { if (typeof window._pinGetEmpId === 'function') emp = String(window._pinGetEmpId() || '').trim(); } catch (_) { emp = ''; }
    if (!emp) { try { emp = String(window.CURRENT_USER?.email || '').trim().toUpperCase(); } catch (_) { emp = ''; } }
    var qs = new URLSearchParams();
    qs.set('numero', String(num));
    qs.set('lite', '1');
    qs.set('limit', '5');
    qs.set('excluir_canceladas', '1');
    qs.set('nocache', '1');
    if (emp) { qs.set('empId', emp); qs.set('empresa_id', emp); }
    qs.set('t', String(Date.now()));
    var url = '/api/ofs?' + qs.toString();
    var r = await fetch(url, { headers: h });
    var j = await r.json().catch(function() { return null; });
    var data = (j && Array.isArray(j.data)) ? j.data : (Array.isArray(j) ? j : (Array.isArray(j?.ofs) ? j.ofs : []));
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
  var _lastTs = 0;
  var _lock = false;
  async function _onOfNumero() {
    if (_lock) return;
    var input = document.getElementById('inc-of-numero');
    if (!input) return;
    var num = String(input.value || '').replace(/\D/g, '').trim();
    var now = Date.now();
    if (!num) return;
    if (num === _lastNum && (now - _lastTs) < 3000) return;
    _lastNum = num;
    _lastTs = now;
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
    input.addEventListener('focus', function() { _lastNum = ''; }, true);
    input.addEventListener('keydown', function(e) {
      var k = e && (e.key || e.code || '');
      if (k === 'Enter') { setTimeout(_onOfNumero, 0); }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(_bindInc, 200); setInterval(_bindInc, 900); });
  } else {
    setTimeout(_bindInc, 200);
    setInterval(_bindInc, 900);
  }
})();

(function patchHistoricoPassagensLayoutV5() {
  function _token() {
    try { return String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { return ''; }
  }

  function _headers() {
    var t = _token();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  function _fmtDataHora(p) {
    var d = String(p?.data_passagem || p?.data || '').slice(0, 10);
    var h = String(p?.hora_passagem || p?.hora || '').trim();
    if (!d && p?.created_at) d = String(p.created_at).slice(0, 10);
    if (!h && p?.created_at) h = String(p.created_at).slice(11, 16);
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      var parts = d.split('-');
      d = parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return (d ? d : '—') + (h ? (' ' + h) : '');
  }

  async function _carregarRecentes() {
    var wrap = document.getElementById('hist-graficos-wrap');
    if (!wrap) return;
    var host = document.getElementById('patch-hist-recentes-host');
    if (!host) return;
    host.innerHTML = '<div style="padding:12px;color:#64748b;font-size:12px">Carregando…</div>';
    try {
      var r = await fetch('/api/passagens/historico?limit=20&offset=0&nocache=1&t=' + Date.now(), { headers: _headers() });
      var j = await r.json().catch(function() { return null; });
      var list = (j && Array.isArray(j.passagens)) ? j.passagens : (Array.isArray(j?.data) ? j.data : []);
      if (!Array.isArray(list) || !list.length) {
        host.innerHTML = '<div style="padding:12px;color:#64748b;font-size:12px">Sem passagens recentes.</div>';
        return;
      }
      host.innerHTML = '<table><thead><tr>' +
        '<th>Data</th><th>OF</th><th>Máquina</th><th>Operador</th><th style="text-align:right">Quantidade</th>' +
        '</tr></thead><tbody>' +
        list.map(function(p, i) {
          var of = String(p?.of_numero || p?.of || p?.ofNum || '').trim() || '—';
          var maq = String(p?.maquina || '').trim() || '—';
          var op = String(p?.usuario || p?.operador || p?.responsavel || '').trim() || '—';
          var qtd = (p?.quantidade != null) ? p.quantidade : (p?.qtd != null ? p.qtd : '');
          var qtdN = Math.trunc(Number(qtd || 0) || 0);
          return '<tr style="background:' + (i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent') + '">' +
            '<td>' + _fmtDataHora(p) + '</td>' +
            '<td style="font-family:monospace">' + String(of).replace(/</g, '&lt;') + '</td>' +
            '<td>' + String(maq).replace(/</g, '&lt;') + '</td>' +
            '<td>' + String(op).replace(/</g, '&lt;') + '</td>' +
            '<td class="q">' + String(qtdN) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';
    } catch (_) {
      host.innerHTML = '<div style="padding:12px;color:#ef4444;font-size:12px">Erro ao carregar passagens recentes.</div>';
    }
  }

  function _apply() {
    var page = document.getElementById('page-historico-passagens');
    if (!page || page.style.display === 'none') return;
    var wrap = document.getElementById('hist-graficos-wrap');
    if (!wrap) return;
    var resumo = document.getElementById('hist-resumo');
    var grid = null;
    try { grid = resumo ? resumo.nextElementSibling : null; } catch (_) { grid = null; }
    if (grid && grid.classList && !grid.classList.contains('patch-hist-graficos-grid')) {
      grid.classList.add('patch-hist-graficos-grid');
      Array.from(grid.children || []).forEach(function(card) {
        if (card && card.classList) card.classList.add('patch-hist-graf-card');
        try {
          var canvasWrap = card ? card.querySelector('div > canvas') : null;
          if (canvasWrap && canvasWrap.parentElement && canvasWrap.parentElement.classList) {
            canvasWrap.parentElement.classList.add('patch-hist-graf-canvaswrap');
          }
        } catch (_) {}
      });
    }
    if (!document.getElementById('patch-hist-recentes')) {
      var box = document.createElement('div');
      box.id = 'patch-hist-recentes';
      box.className = 'patch-hist-recentes';
      box.innerHTML = '<div class="h">Passagens recentes (últimas 20)</div><div id="patch-hist-recentes-host"></div>';
      wrap.appendChild(box);
      setTimeout(_carregarRecentes, 50);
    }
  }

  function tick() { try { _apply(); } catch (_) {} }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tick, 250); setInterval(tick, 900); });
  } else {
    setTimeout(tick, 250);
    setInterval(tick, 900);
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
      return r;
    };
  }

  function tick() {
    try { hookRenderComissoes(); } catch (_) {}
    try { enhanceComissoesTable(); } catch (_) {}
  }

  bindInlineEdit();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(tick, 250); setInterval(tick, 900); });
  else { setTimeout(tick, 250); setInterval(tick, 900); }
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

  function clientesRef() {
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
    return null;
  }

  function _resetClienteRapidaState() {
    try { window._ofRapidaClienteId = null; } catch (_) {}
    try { window._ofRapidaClienteNome = null; } catch (_) {}
    var el = document.getElementById('of-r-cliente');
    if (el) {
      try { delete el.dataset.clienteId; } catch (_) {}
      try { delete el.dataset.clienteNome; } catch (_) {}
    }
  }

  function syncClienteOfRapida(input) {
    var el = input || document.getElementById('of-r-cliente');
    if (!el) return null;
    var cli = acharClienteRobusto(el.value);
    if (cli && cli.id) {
      el.dataset.clienteId = String(cli.id);
      el.dataset.clienteNome = String(cli.nome || cli.razao_social || cli.razao || el.value || '').trim();
      try { window._ofRapidaClienteId = String(cli.id); } catch (_) {}
      try { window._ofRapidaClienteNome = String(cli.nome || cli.razao_social || cli.razao || '').trim(); } catch (_) {}
      return cli;
    }
    delete el.dataset.clienteId;
    delete el.dataset.clienteNome;
    try { window._ofRapidaClienteId = null; } catch (_) {}
    try { window._ofRapidaClienteNome = null; } catch (_) {}
    return null;
  }

  function bindClienteInput() {
    var el = document.getElementById('of-r-cliente');
    if (!el || el.dataset.patchClienteEspecial === '1') return;
    el.dataset.patchClienteEspecial = '1';
    var _ofRapidaAcCache = [];
    var _ofRapidaAcKey = '';
    var _ofRapidaAcReq = 0;
    var _prefetchClientesTodos = function(q) {
      var termo = String(q || '').trim();
      var cacheKey = termo.toLowerCase();
      if (_ofRapidaAcKey === cacheKey && _ofRapidaAcCache.length) return Promise.resolve(_ofRapidaAcCache);
      var reqId = ++_ofRapidaAcReq;
      var headers = { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') };
      return fetch('/api/clientes?todos=true&autocomplete=true&q=' + encodeURIComponent(termo), { headers: headers })
        .then(function(r) { return r.json().catch(function() { return null; }); })
        .then(function(j) {
          if (reqId !== _ofRapidaAcReq) return _ofRapidaAcCache;
          var rows = (j && Array.isArray(j.data)) ? j.data : (Array.isArray(j) ? j : []);
          _ofRapidaAcKey = cacheKey;
          _ofRapidaAcCache = rows.map(function(c) {
            var empBase = c?.empId ?? c?.emp_id ?? c?.empresa ?? c?.empresa_id ?? '';
            return {
              label: c?.nome || c?.rs || c?.razao_social || '',
              sub: [c?.cidade && c?.uf ? (String(c.cidade) + '/' + String(c.uf)) : (c?.cidade || ''), c?.tel || c?.telefone || '', c?.cnpj || ''].filter(Boolean).join(' · '),
              badge: (typeof window.getEmp === 'function' ? ((window.getEmp(empBase) || {}).sigla || '') : ''),
              data: c
            };
          });
          try {
            if (document.activeElement === el) el.dispatchEvent(new Event('input', { bubbles: true }));
          } catch (_) {}
          return _ofRapidaAcCache;
        })
        .catch(function() {
          return _ofRapidaAcCache;
        });
    };
    try {
      if (el.getAttribute('list')) el.removeAttribute('list');
    } catch (_) {}
    ['input', 'change', 'blur'].forEach(function(evt) {
      el.addEventListener(evt, function() {
        if (evt === 'input') {
          try { window._ofRapidaClienteId = null; } catch (_) {}
          try { window._ofRapidaClienteNome = null; } catch (_) {}
          try { delete el.dataset.clienteId; } catch (_) {}
          try { delete el.dataset.clienteNome; } catch (_) {}
        }
        if (evt === 'input' || evt === 'change') _prefetchClientesTodos(el.value);
        syncClienteOfRapida(el);
      }, true);
    });
    el.addEventListener('focus', function() { _prefetchClientesTodos(el.value); }, true);
    setTimeout(function() { syncClienteOfRapida(el); }, 0);

    if (!el.dataset.patchClienteAc && typeof window.ac === 'function' && typeof window.acClientes === 'function') {
      el.dataset.patchClienteAc = '1';
      try {
        window.ac(el, function(q) {
          var termo = String(q || '').trim().toLowerCase();
          return (_ofRapidaAcCache || []).filter(function(it) {
            var texto = String(it?.label || '') + ' ' + String(it?.sub || '');
            return !termo || texto.toLowerCase().indexOf(termo) >= 0;
          });
        }, function(data, lbl) {
          var cid = String(data?.id || '').trim();
          if (!cid) return;
          var nome = String(lbl || data?.nome || data?.razao_social || data?.razao || '').trim();
          try { window._ofRapidaClienteId = cid; } catch (_) {}
          try { window._ofRapidaClienteNome = nome; } catch (_) {}
          try { el.value = nome || el.value; } catch (_) {}
          try { el.dataset.clienteId = cid; } catch (_) {}
          try { el.dataset.clienteNome = nome; } catch (_) {}
        }, { minLen: 0, maxItems: 25 });
      } catch (_) {}
    }
  }

  function _patchAbrirFechar() {
    var oA = window.abrirNovaOfRapida;
    if (typeof oA === 'function' && !oA._patchCliIdV2) {
      var wA = function() {
        _resetClienteRapidaState();
        var r = oA.apply(this, arguments);
        setTimeout(function() {
          try {
            var el = document.getElementById('of-r-numero');
            if (!el || typeof window.proximoNumeroOf !== 'function') return;
            if (el.tagName === 'INPUT') { el.value = '...'; el.disabled = true; }
            else el.textContent = '...';
            window.proximoNumeroOf().then(function(num) {
              try { window._ofRapidaNumero = num; } catch (_) {}
              if (el.tagName === 'INPUT') { el.value = num; el.disabled = false; }
              else el.textContent = num;
            }).catch(function(_) {
              try { if (el.tagName === 'INPUT') el.disabled = false; } catch (__){}
            });
          } catch (_) {}
        }, 150);
        setTimeout(bindClienteInput, 60);
        return r;
      };
      wA._patchCliIdV2 = true;
      window.abrirNovaOfRapida = wA;
    }
    var oF = window.fecharNovaOfRapida;
    if (typeof oF === 'function' && !oF._patchCliIdV2) {
      var wF = function() {
        var r2 = oF.apply(this, arguments);
        _resetClienteRapidaState();
        return r2;
      };
      wF._patchCliIdV2 = true;
      window.fecharNovaOfRapida = wF;
    }
  }

  function _patchSalvarSomenteId() {
    var orig = window.salvarOfRapida;
    if (typeof orig !== 'function' || orig._patchSalvarCliIdOnlyV2) return;

    var wrapped = async function() {
      var cliId = String(window._ofRapidaClienteId || '').trim();
      if (!cliId) {
        try { alert('Selecione um cliente válido da lista.'); } catch (_) {}
        try { document.getElementById('of-r-cliente')?.focus(); } catch (_) {}
        return;
      }

      var clienteNome = String(window._ofRapidaClienteNome || (document.getElementById('of-r-cliente')?.value || '')).trim();
      try { if (window._ofRapidaClienteNome) document.getElementById('of-r-cliente').value = window._ofRapidaClienteNome; } catch (_) {}

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
      var pedido = String(document.getElementById('of-r-pedido')?.value || new Date().toISOString().split('T')[0]).slice(0, 10);
      var urgente = !!document.getElementById('of-r-urgente')?.checked;
      var maquinaSel = String(document.getElementById('of-r-maquina')?.value || '').trim();
      var dataAgend = String(window._ofRapidaDataAgendamento || '').slice(0, 10);
      var agendamentoAuto = !!(maquinaSel && dataAgend);
      if (!maquinaSel) {
        alert('Selecione a máquina principal da OF.');
        try { document.getElementById('of-r-maquina')?.focus(); } catch (_) {}
        return;
      }
      try {
        var itensAdicionais = (typeof coletarItensAdicionais === 'function') ? coletarItensAdicionais() : [];
        if (itensAdicionais === null) return;
      } catch (_) {}

      var numeroOf =
        String(window._ofRapidaNumero || '').trim() ||
        String((document.getElementById('of-r-numero') || document.getElementById('of-r-num-display'))?.textContent || '').replace(/[^\d]/g, '').trim() ||
        '001';

      var erros = [];
      if (!cliId) erros.push('Cliente');
      if (!produto) erros.push('Produto');
      if (!(qtd > 0)) erros.push('Quantidade');
      if (!(vlunit > 0)) erros.push('Valor Unit.');
      if (!(larg > 0 && comp > 0)) erros.push('Dimensões (L×C)');
      try {
        if (!Array.isArray(coresDisponiveis) || !coresDisponiveis.length) await carregarCoresImpressao(empId);
      } catch (_) {}
      var coresPayload = (typeof coresPayloadFromSelecionadas === 'function') ? coresPayloadFromSelecionadas(coresSelecionadasOFRapida) : [];
      if (!coresPayload.length) erros.push('Cores de Impressão');
      if (!entrega) erros.push('Data de Entrega');
      if (erros.length) {
        alert('Preencha: ' + erros.join(', '));
        return;
      }

      var btn = document.getElementById('btn-salvar-of-rapida');
      try { if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; } } catch (_) {}

      var imgUrl = '';
      try {
        var imgInput = document.getElementById('of-r-img');
        var file = imgInput?.files?.[0] || null;
        if (file) {
          var token = localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
          var fd = new FormData();
          fd.append('file', file);
          var base = (window.location && window.location.protocol === 'file:') ? API_BASE : '';
          var rUp = await fetch(base + '/api/ofs/upload', { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {}, body: fd });
          var dUp = await rUp.json().catch(function() { return null; });
          imgUrl = String(dUp?.data?.url || dUp?.url || dUp?.data?.publicUrl || dUp?.publicUrl || '').trim();
        }
      } catch (_) {}

      var itens = [{
        desc: produto,
        descricao: produto,
        ref: ref,
        qtd: qtd,
        quantidade: qtd,
        vunit: vlunit,
        valor_unitario: vlunit,
        valor_total: total,
        img: imgUrl || null,
        maquina: maquinaSel || '',
        maquinas_fluxo: [],
        maquinas_fluxo_ids: [],
      }];

      var payload = {
        numero: numeroOf,
        of_num: numeroOf,
        of: numeroOf,
        cli_id: cliId,
        cliId: cliId,
        cliente_id: cliId,
        cliente_nome: clienteNome || undefined,
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
        data_pedido: pedido,
        dia: pedido,
        status: 'Em aberto',
        urg: urgente,
        urgente: urgente,
        emp_id: empId,
        empId: empId,
        caixa_comprimento: comp,
        caixa_largura: larg,
        caixa_altura: null,
        dim_comprimento: comp,
        dim_largura: larg,
        dim_altura: null,
        cores_impressao: coresPayload,
        itens: itens,
        imgs: imgUrl ? [imgUrl] : [],
        imagem_url: imgUrl || null,
        maquina_agendada: maquinaSel || undefined,
        data_agendamento: agendamentoAuto ? dataAgend : undefined,
        agendamento_auto: agendamentoAuto ? true : undefined,
        fluxo_maquinas: maquinaSel ? [maquinaSel] : [],
        maq: maquinaSel ? [maquinaSel] : undefined,
      };

      try {
        var r = await apiFetch('/api/ofs', { method: 'POST', body: payload });
        var d = r ? await r.json().catch(function() { return null; }) : null;
        if (!(r && r.ok) || (d && d.ok === false)) throw new Error(d?.error || d?.message || 'Erro ao salvar');
        var ofCriada = d?.data || d;
        try { if (Array.isArray(window.OFS_ARQUIVO) && ofCriada) window.OFS_ARQUIVO.unshift(ofCriada); } catch (_) {}
        try {
          var extras = (typeof coletarItensAdicionais === 'function') ? coletarItensAdicionais() : [];
          if (extras === null) return;
          if (Array.isArray(extras) && extras.length) {
            var baseNum = parseInt(String(numeroOf || '').replace(/\D/g, ''), 10) || 0;
            var nextNum = baseNum;
            var okN = 0;
            var totalN = extras.length;
            for (var i = 0; i < extras.length; i++) {
              var it = extras[i] || {};
              nextNum += 1;
              var numStr = String(nextNum).padStart(3, '0');
              var prod2 = String(it.referencia || '').trim() || produto;
              var qtd2 = Math.trunc(Number(it.quantidade || 0) || 0);
              var unit2 = parseFloat(String(it.vl_unit || 0).replace(',', '.')) || 0;
              var tot2 = parseFloat(String(it.vl_total || 0).replace(',', '.')) || (qtd2 * unit2);
              var maqItem = String(it.maquina || it.maquina_agendada || maquinaSel || '').trim();
              if (!(qtd2 > 0)) continue;
              var itemImgUrl = '';
              try {
                var f2 = it.imagemFile || null;
                if (f2) {
                  var token2 = localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
                  var fd2 = new FormData();
                  fd2.append('file', f2);
                  var base2 = (window.location && window.location.protocol === 'file:') ? API_BASE : '';
                  var up2 = await fetch(base2 + '/api/ofs/upload', { method: 'POST', headers: token2 ? { Authorization: 'Bearer ' + token2 } : {}, body: fd2 });
                  var j2 = await up2.json().catch(function() { return null; });
                  itemImgUrl = String(j2?.data?.url || j2?.url || j2?.data?.publicUrl || j2?.publicUrl || '').trim();
                }
              } catch (_) {}
              var imgFinal = (itemImgUrl || imgUrl || '').trim();
              var itens2 = [{
                desc: prod2,
                descricao: prod2,
                ref: String(it.referencia || '').trim(),
                qtd: qtd2,
                quantidade: qtd2,
                vunit: unit2,
                valor_unitario: unit2,
                valor_total: tot2,
                img: imgFinal || null,
                maquina: maqItem || '',
                maquinas_fluxo: [],
                maquinas_fluxo_ids: [],
              }];
              var payload2 = {
                numero: numStr,
                of_num: numStr,
                of: numStr,
                cli_id: cliId,
                cliId: cliId,
                cliente_id: cliId,
                cliente_nome: clienteNome || undefined,
                vendedor_id: vendId,
                vendId: vendId,
                vend_id: vendId,
                prodDesc: prod2,
                descricao: prod2,
                produto: prod2,
                quantidade: qtd2,
                qtd: qtd2,
                valor_total: tot2,
                valor_venda: tot2,
                ent: entrega,
                data_entrega: entrega,
                data_pedido: pedido,
                dia: pedido,
                status: 'Em aberto',
                urg: urgente,
                urgente: urgente,
                emp_id: empId,
                empId: empId,
                caixa_comprimento: Number(it.caixa_comprimento ?? it.dim_comprimento ?? 0) || null,
                caixa_largura: Number(it.caixa_largura ?? it.dim_largura ?? 0) || null,
                caixa_altura: null,
                dim_comprimento: Number(it.dim_comprimento ?? it.caixa_comprimento ?? 0) || null,
                dim_largura: Number(it.dim_largura ?? it.caixa_largura ?? 0) || null,
                dim_altura: null,
                cores_impressao: Array.isArray(it.cores_impressao) ? it.cores_impressao : [],
                itens: itens2,
                imgs: imgFinal ? [imgFinal] : [],
                imagem_url: imgFinal || null,
                maquina_agendada: maqItem || undefined,
                data_agendamento: (maqItem && dataAgend) ? dataAgend : undefined,
                agendamento_auto: (maqItem && dataAgend) ? true : undefined,
                fluxo_maquinas: maqItem ? [maqItem] : [],
                maq: maqItem ? [maqItem] : undefined,
              };
              try {
                var r2 = await apiFetch('/api/ofs', { method: 'POST', body: payload2 });
                var d2 = r2 ? await r2.json().catch(function() { return null; }) : null;
                if ((r2 && r2.ok) && !(d2 && d2.ok === false)) okN += 1;
              } catch (_) {}
            }
            if (okN > 0) toast('✓ Itens adicionais criados: ' + okN + '/' + totalN, 'var(--green)');
          }
        } catch (_) {}
        try { if (typeof fecharNovaOfRapida === 'function') fecharNovaOfRapida(); } catch (_) {}
        try { toast('✓ OF criada com sucesso!', 'var(--green)'); } catch (_) {}
        try { if (typeof renderHub === 'function') renderHub(true); } catch (_) {}
        try { if (typeof carregarOFs === 'function') carregarOFs(); } catch (_) {}
        try { if (typeof renderPCP === 'function') renderPCP(); } catch (_) {}
        try { if (typeof renderOFsPorMaquina === 'function') renderOFsPorMaquina(); } catch (_) {}
      } catch (e) {
        try { console.error('[OF RAPIDA]', e); } catch (_) {}
        if (btn) {
          btn.textContent = '✗ Erro ao salvar';
          btn.style.background = '#ef4444';
          setTimeout(function() {
            try {
              btn.textContent = '⚡ Salvar OF';
              btn.disabled = false;
              btn.style.background = '';
            } catch (_) {}
          }, 2500);
        }
        return;
      } finally {
        try {
          if (btn && btn.textContent === 'Salvando...') {
            btn.textContent = '⚡ Salvar OF';
            btn.disabled = false;
          }
        } catch (_) {}
      }
    };

    wrapped._patchSalvarCliIdOnlyV2 = true;
    window.salvarOfRapida = wrapped;
    if (typeof window.salvarNovaOfRapida === 'function') {
      window.salvarNovaOfRapida = wrapped;
    }
  }

  function tick() {
    try { bindClienteInput(); } catch (_) {}
    try { _patchAbrirFechar(); } catch (_) {}
    try { _patchSalvarSomenteId(); } catch (_) {}
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

(function patchInconformidadesDeleteAndOperadoresBadge() {
  function _tok() {
    try { return String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { return ''; }
  }

  function _hdrJson() {
    var t = _tok();
    var h = { 'Content-Type': 'application/json' };
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }

  function _hdr() {
    var t = _tok();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  function _norm(s) {
    var v = String(s || '').trim().toLowerCase();
    try { v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return v.replace(/\s+/g, ' ').trim();
  }

  async function _buscarInconformidadesAtual() {
    var qs = [];
    try {
      var operador = String((document.getElementById('inc-filtro-op') || {}).value || '').trim();
      var maq = String((document.getElementById('inc-filtro-maq') || {}).value || '').trim();
      if (operador) qs.push('operador=' + encodeURIComponent(operador));
      if (maq) qs.push('maquina=' + encodeURIComponent(maq));
    } catch (_) {}
    qs.push('t=' + Date.now());
    var r = await fetch('/api/inconformidades?' + qs.join('&'), { headers: _hdr() });
    var d = await r.json().catch(function() { return null; });
    return (d && d.ok && Array.isArray(d.data)) ? d.data : (Array.isArray(d?.inconformidades) ? d.inconformidades : []);
  }

  async function _apagarInconformidade(id, card) {
    var incId = String(id || '').trim();
    if (!incId) return;
    if (!confirm('Tem certeza que deseja apagar esta inconformidade?')) return;
    try {
      var r = await fetch('/api/inconformidades/' + encodeURIComponent(incId), {
        method: 'DELETE',
        headers: _hdrJson()
      });
      if (!r.ok) {
        var j = await r.json().catch(function() { return null; });
        throw new Error(j?.error || ('HTTP ' + r.status));
      }
      if (card && card.remove) card.remove();
      try { if (typeof window.toast === 'function') window.toast('✓ Inconformidade apagada', 'var(--green)'); } catch (_) {}
    } catch (e) {
      try { if (typeof window.toast === 'function') window.toast('Erro ao apagar inconformidade', 'var(--red)'); } catch (_) {}
    }
  }

  async function _enhanceInconformidades() {
    var out = document.getElementById('inc-lista-resultado');
    if (!out) return;
    var cards = Array.from(out.querySelectorAll('.inconformidade-card'));
    if (!cards.length) return;
    var itens = await _buscarInconformidadesAtual().catch(function() { return []; });
    cards.forEach(function(card, idx) {
      if (card.dataset.patchDeleteInc === '1') return;
      card.dataset.patchDeleteInc = '1';
      var inc = Array.isArray(itens) ? itens[idx] : null;
      var incId = String(inc?.id || '').trim();
      var footer = card.querySelector('div[style*="justify-content:flex-end"]');
      if (!footer) {
        footer = document.createElement('div');
        footer.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;margin-top:10px';
        card.appendChild(footer);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '🗑️ Apagar';
      btn.style.cssText = 'background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:7px 10px;cursor:pointer;font-size:12px';
      btn.onclick = function(ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        _apagarInconformidade(incId, card);
      };
      footer.appendChild(btn);
    });
  }

  var _incWrapDone = false;
  function _hookCarregarInconformidades() {
    if (_incWrapDone || typeof window.carregarInconformidades !== 'function') return;
    _incWrapDone = true;
    var orig = window.carregarInconformidades;
    window.carregarInconformidades = async function() {
      var r = await orig.apply(this, arguments);
      setTimeout(function() { _enhanceInconformidades().catch(function(){}); }, 80);
      return r;
    };
  }

  var _incCountCache = {};
  async function _buscarIncOperador(nome) {
    var nm = String(nome || '').trim();
    if (!nm) return [];
    var key = _norm(nm);
    if (_incCountCache[key] && Array.isArray(_incCountCache[key].items)) return _incCountCache[key].items;
    var r = await fetch('/api/inconformidades?operador=' + encodeURIComponent(nm) + '&t=' + Date.now(), { headers: _hdr() });
    var d = await r.json().catch(function() { return null; });
    var items = (d && d.ok && Array.isArray(d.data)) ? d.data : (Array.isArray(d?.inconformidades) ? d.inconformidades : []);
    _incCountCache[key] = { items: items };
    return items;
  }

  function _badgeHtml(count) {
    if (!count) return '';
    if (count === 1) return '<span style="background:#666;color:#fff;border-radius:10px;padding:2px 7px;font-size:11px">1</span>';
    if (count === 2) return '<span style="background:#f59e0b;color:#fff;border-radius:10px;padding:2px 7px;font-size:11px">⚠️ 2</span>';
    return '<span style="background:#ef4444;color:#fff;border-radius:10px;padding:2px 7px;font-size:11px">🔴 ' + String(count) + '</span>';
  }

  async function _enhanceOperadoresGrid() {
    if (String(window._PAGE_ATUAL || '') !== 'operadores') return;
    var grid = document.getElementById('op-grid');
    if (!grid) return;
    var cards = Array.from(grid.querySelectorAll('.op-card'));
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var nomeEl = card.querySelector('.op-nome');
      if (!nomeEl || card.dataset.patchIncBadge === '1') continue;
      card.dataset.patchIncBadge = '1';
      var nome = String(nomeEl.textContent || '').trim();
      var items = await _buscarIncOperador(nome).catch(function() { return []; });
      var count = Array.isArray(items) ? items.length : 0;
      if (count > 0) {
        var wrap = document.createElement('span');
        wrap.className = 'patch-inc-badge-op';
        wrap.style.cssText = 'display:inline-flex;align-items:center;margin-left:8px;vertical-align:middle';
        wrap.innerHTML = _badgeHtml(count);
        nomeEl.appendChild(wrap);
      }
    }
  }

  var _opWrapDone = false;
  function _hookRenderOperadores() {
    if (_opWrapDone || typeof window.renderOperadores !== 'function') return;
    _opWrapDone = true;
    var orig = window.renderOperadores;
    window.renderOperadores = function() {
      var r = orig.apply(this, arguments);
      setTimeout(function() { _enhanceOperadoresGrid().catch(function(){}); }, 60);
      return r;
    };
  }

  var _histWrapDone = false;
  function _hookAbrirHistOp() {
    if (_histWrapDone || typeof window.abrirHistOp !== 'function') return;
    _histWrapDone = true;
    var orig = window.abrirHistOp;
    window.abrirHistOp = async function(opId) {
      var r = await orig.apply(this, arguments);
      try {
        var op = (typeof window.getOp === 'function') ? window.getOp(opId) : null;
        var nome = String(op?.nome || '').trim();
        if (!nome) return r;
        var body = document.getElementById('hist-cli-body');
        if (!body) return r;
        body.querySelectorAll('.patch-op-inc-section').forEach(function(el){ el.remove(); });
        var items = await _buscarIncOperador(nome).catch(function() { return []; });
        var html = '<div class="patch-op-inc-section" style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08)">' +
          '<div style="font-size:.82rem;font-weight:800;color:#e2e8f0;margin-bottom:10px">Inconformidades</div>';
        if (!items.length) {
          html += '<div style="color:var(--text3);font-size:.78rem">Nenhuma inconformidade registrada para este operador.</div>';
        } else {
          html += items.slice().sort(function(a,b){ return String(b?.created_at || '').localeCompare(String(a?.created_at || '')); }).map(function(ic) {
            var dt = ic?.created_at ? new Date(ic.created_at).toLocaleDateString('pt-BR') : '—';
            var of = String(ic?.of_numero || '').trim() || '—';
            var maq = String(ic?.maquina || '').trim() || '—';
            var motivo = String(ic?.obs || ic?.motivo || ic?.descricao || '').trim() || '—';
            var qtd = Math.trunc(Number(ic?.qtd_perdida || 0) || 0);
            return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px;margin-bottom:8px">' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;margin-bottom:6px">' +
                '<span style="color:#94a3b8;font-size:.72rem">' + dt + '</span>' +
                '<span style="color:#60a5fa;font-family:var(--mono);font-size:.72rem">OF ' + of + '</span>' +
                '<span style="color:#f59e0b;font-size:.72rem">' + maq + '</span>' +
                '<span style="color:#f87171;font-size:.72rem;font-weight:700">' + qtd + ' perdidas</span>' +
              '</div>' +
              '<div style="font-size:.78rem;color:#e2e8f0">' + motivo.replace(/</g,'&lt;') + '</div>' +
            '</div>';
          }).join('');
        }
        html += '</div>';
        body.insertAdjacentHTML('beforeend', html);
      } catch (_) {}
      return r;
    };
  }

  function tick() {
    try { _hookCarregarInconformidades(); } catch (_) {}
    try { _hookRenderOperadores(); } catch (_) {}
    try { _hookAbrirHistOp(); } catch (_) {}
    try { _enhanceInconformidades().catch(function(){}); } catch (_) {}
    try { _enhanceOperadoresGrid().catch(function(){}); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 180);
      setInterval(tick, 1200);
    });
  } else {
    setTimeout(tick, 180);
    setInterval(tick, 1200);
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
    new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type !== 'attributes') return;
        var vis = page.style.display !== 'none' &&
                  !page.classList.contains('hidden');
        if (vis) setTimeout(renderCards, 350);
      });
    }).observe(page, { attributes: true, attributeFilter: ['style','class'] });
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
    img.src = src;
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

(function patchMelhoriasClientesPcpHistoricoQrRecorrentesImportarOfImagem() {
  function _tok() {
    try { return String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { return ''; }
  }
  function _hdrAuth() {
    var t = _tok();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }
  function _hdrJson() {
    var h = { 'Content-Type': 'application/json' };
    var t = _tok();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }
  function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _norm(s) {
    var v = String(s || '').trim().toLowerCase();
    try { v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return v.replace(/\s+/g, ' ').trim();
  }
  function _isMobile() {
    try { return typeof window.isMobile === 'function' ? !!window.isMobile() : (window.innerWidth < 760); } catch (_) { return window.innerWidth < 760; }
  }

  function _toast(msg, cor) {
    try { if (typeof window.toast === 'function') return window.toast(msg, cor); } catch (_) {}
    try { alert(msg); } catch (_) {}
  }

  function _findClienteByNome(nome) {
    var nm = _norm(nome);
    if (!nm) return null;
    var list = Array.isArray(window.CLIENTES) ? window.CLIENTES : [];
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var cand = _norm(c?.nome || c?.razao_social || c?.razao || c?.fantasia || c?.cliente_nome || '');
      if (cand && cand === nm) return c;
    }
    for (var j = 0; j < list.length; j++) {
      var c2 = list[j];
      var cand2 = _norm(c2?.nome || c2?.razao_social || c2?.razao || c2?.fantasia || c2?.cliente_nome || '');
      if (cand2 && (cand2.indexOf(nm) >= 0 || nm.indexOf(cand2) >= 0)) return c2;
    }
    return null;
  }

  function _ensureClientesDatalist(id) {
    var dl = document.getElementById(id);
    if (!dl) {
      dl = document.createElement('datalist');
      dl.id = id;
      document.body.appendChild(dl);
    }
    var clientes = Array.isArray(window.CLIENTES) ? window.CLIENTES : [];
    dl.innerHTML = clientes.map(function(c) {
      var nome = String(c?.nome || c?.razao_social || c?.razao || c?.fantasia || '').trim();
      return nome ? ('<option value="' + _esc(nome) + '"></option>') : '';
    }).join('');
    return dl;
  }

  function _ensureVendedoresSelectOptions(sel) {
    if (!sel) return;
    var vend = Array.isArray(window.VENDEDORES) ? window.VENDEDORES : [];
    var cur = String(sel.value || '');
    var opts = ['<option value="">Selecione…</option>'].concat(vend.map(function(v) {
      var id = String(v?.id || '').trim();
      var nm = String(v?.nome || '').trim();
      if (!id) return '';
      return '<option value="' + _esc(id) + '">' + _esc(nm || id) + '</option>';
    }));
    sel.innerHTML = opts.join('');
    if (cur) sel.value = cur;
  }

  function _matchVendedorPorNome(nome) {
    var nm = _norm(nome);
    if (!nm) return '';
    var vend = Array.isArray(window.VENDEDORES) ? window.VENDEDORES : [];
    for (var i = 0; i < vend.length; i++) {
      var v = vend[i];
      var cand = _norm(v?.nome || '');
      if (cand && cand === nm) return String(v?.id || '').trim();
    }
    for (var j = 0; j < vend.length; j++) {
      var v2 = vend[j];
      var cand2 = _norm(v2?.nome || '');
      if (cand2 && (cand2.indexOf(nm) >= 0 || nm.indexOf(cand2) >= 0)) return String(v2?.id || '').trim();
    }
    return '';
  }

  function _patchClientesFiltros() {
    if (window._patchClientesFiltrosV1) return;
    window._patchClientesFiltrosV1 = true;

    window._clientesAnaliseModo = String(window._clientesAnaliseModo || '').trim();
    window._clientesFiltroAtivo = String(window._clientesFiltroAtivo || '').trim();

    function _hideClientesAnaliseContainer() {
      try {
        var c = document.getElementById('analise-clientes-resultado');
        if (c) {
          c.innerHTML = '';
          c.style.display = 'none';
        }
      } catch (_) {}
    }

    function _ensureClientesCss() {
      if (document.getElementById('patch-clientes-topo-css')) return;
      var st = document.createElement('style');
      st.id = 'patch-clientes-topo-css';
      st.textContent =
        '#page-clientes .clientes-acoes-topo{' +
          'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;' +
        '}' +
        '#page-clientes .clientes-acoes-topo .btn, #page-clientes .clientes-acoes-topo .nav-item{' +
          'min-height:44px;' +
        '}';
      document.head.appendChild(st);
    }

    function _setClientesModo(modo) {
      try { window._clientesAnaliseModo = String(modo || '').trim(); } catch (_) {}
      try {
        var page = document.getElementById('page-clientes');
        if (!page) return;
        page.querySelectorAll('[data-clientes-modo]').forEach(function(btn) {
          var on = String(btn.getAttribute('data-clientes-modo') || '') === String(window._clientesAnaliseModo || '');
          btn.style.background = on ? 'rgba(74,144,217,.22)' : '';
          btn.style.borderColor = on ? 'rgba(74,144,217,.45)' : '';
          btn.style.color = on ? '#dbeafe' : '';
          btn.style.fontWeight = on ? '800' : '';
        });
      } catch (_) {}
    }

    function _resetClientesFiltrosUI() {
      ['cli-busca', 'cli-ramo', 'cli-sit', 'cli-emp-fil'].forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        try { el.value = ''; } catch (_) {}
      });
      var dias = document.getElementById('sel-dias-inativo');
      if (dias) {
        try { dias.value = String(dias.dataset.defaultValue || dias.value || '30'); } catch (_) {}
      }
      try { window._clientesFiltroAtivo = ''; } catch (_) {}
      _setClientesModo('');
    }

    function _ensureBtnVerTodos() {
      var toolbar = document.querySelector('#page-clientes .ptoolbar');
      if (!toolbar) return;
      if (document.getElementById('btn-clientes-ver-todos')) return;
      var btnTodos = document.createElement('button');
      btnTodos.id = 'btn-clientes-ver-todos';
      btnTodos.className = 'btn btn-ghost btn-sm';
      btnTodos.setAttribute('data-clientes-modo', '');
      btnTodos.textContent = '👥 Ver Todos';
      btnTodos.style.minHeight = '44px';
      btnTodos.onclick = function(ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        window.clientesVerTodos().catch(function(_) {});
      };
      var btnNovo = toolbar.querySelector('button[onclick*="abrirModalCliente"]');
      if (btnNovo && btnNovo.parentElement === toolbar) btnNovo.insertAdjacentElement('beforebegin', btnTodos);
      else toolbar.appendChild(btnTodos);
    }

    function _layoutClientesTopo() {
      _ensureClientesCss();
      var toolbar = document.querySelector('#page-clientes .ptoolbar');
      if (!toolbar) return;
      toolbar.classList.add('clientes-acoes-topo');
      _ensureBtnVerTodos();

      var btnSem = document.getElementById('btn-analise-inativos');
      var btnMais = document.getElementById('btn-analise-ativos');
      var btnVal = document.getElementById('btn-analise-valor');
      if (btnSem) { btnSem.textContent = 'Sem pedido +30 dias'; btnSem.style.minHeight = '44px'; }
      if (btnMais) { btnMais.textContent = 'Quem mais pede'; btnMais.style.minHeight = '44px'; }
      if (btnVal) { btnVal.textContent = 'Maior valor'; btnVal.style.minHeight = '44px'; }

      var btnInativos = toolbar.querySelector('button[onclick*="abrirClientesInativos"]');
      if (btnInativos) btnInativos.style.minHeight = '44px';
      var btnImport = toolbar.querySelector('button[onclick*="clientesAbrirImportExcel"]');
      if (btnImport) btnImport.style.minHeight = '44px';
      var btnDup = toolbar.querySelector('button[onclick*="clientesVerificarDuplicatas"]');
      if (btnDup) btnDup.style.minHeight = '44px';
      var btnTodos = document.getElementById('btn-clientes-ver-todos');
      var btnNovo = toolbar.querySelector('button[onclick*="abrirModalCliente"]');
      if (btnNovo) btnNovo.style.minHeight = '44px';

      var ordered = [btnSem, btnMais, btnVal, btnInativos, btnImport, btnDup, btnTodos, btnNovo].filter(Boolean);
      ordered.forEach(function(b) {
        try { toolbar.appendChild(b); } catch (_) {}
      });
    }

    async function _refreshClientesFullList(opts) {
      var o = opts || {};
      if (o.reset !== false) _resetClientesFiltrosUI();
      _hideClientesAnaliseContainer();
      try { await window.carregarClientes(true); } catch (_) {
        try { await window.carregarClientes(false); } catch (_) {}
      }
      if (!(Array.isArray(window.CLIENTES) && window.CLIENTES.length)) {
        try {
          var tk = localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
          var emp = String(window.EMP_FILTRO || '').trim();
          var empresaAtual = String(window.CURRENT_USER?.empresa_id || '').trim();
          var qs = [];
          if (emp) qs.push('empId=' + encodeURIComponent(emp));
          if (empresaAtual) qs.push('empresa_id=' + encodeURIComponent(empresaAtual));
          qs.push('limit=2000');
          qs.push('offset=0');
          qs.push('t=' + Date.now());
          var rr = await fetch('/api/clientes?' + qs.join('&'), { headers: tk ? { Authorization: 'Bearer ' + tk } : {} });
          var jj = await rr.json().catch(function() { return null; });
          var rows = (jj && Array.isArray(jj.data)) ? jj.data : (Array.isArray(jj) ? jj : []);
          try { console.log('[CLIENTES RENDER]', rows); } catch (_) {}
          if (Array.isArray(rows) && rows.length && typeof window.normalizeCli === 'function') {
            window.CLIENTES = rows.map(window.normalizeCli);
          }
        } catch (_) {}
      }
      try { window.renderClientes(); } catch (_) {}
      try {
        var page = document.getElementById('page-clientes');
        if (page && o.scroll !== false) page.scrollTo ? page.scrollTo({ top: 0, behavior: 'smooth' }) : (page.scrollTop = 0);
      } catch (_) {}
      return true;
    }

    window.clientesVerTodos = async function() {
      await _refreshClientesFullList({ reset: true, scroll: true });
    };

    var origGo = window.go;
    if (typeof origGo === 'function' && !origGo._patchClientesDefaultTodosV1) {
      var wGo = function(id) {
        var r = origGo.apply(this, arguments);
        if (String(id || '') === 'clientes') {
          setTimeout(function() {
            try { window._clientesSkipAutoAnaliseUntil = Date.now() + 2500; } catch (_) {}
            if (String(window._clientesAnaliseModo || '').trim()) _setClientesModo('');
            _refreshClientesFullList({ reset: true, scroll: false }).catch(function(_) {});
          }, 80);
        }
        return r;
      };
      wGo._patchClientesDefaultTodosV1 = true;
      window.go = wGo;
    }

    var origRender = window.renderClientes;
    window.renderClientes = function() {
      _hideClientesAnaliseContainer();
      _layoutClientesTopo();
      _ensureBtnVerTodos();
      var baseClientes = Array.isArray(window.CLIENTES) ? window.CLIENTES.slice() : [];
      var busca = (document.getElementById('cli-busca') || {}).value || '';
      var ramo = (document.getElementById('cli-ramo') || {}).value || '';
      var sit = (document.getElementById('cli-sit') || {}).value || '';
      var empFil = (document.getElementById('cli-emp-fil') || {}).value || '';
      var rs = document.getElementById('cli-ramo');
      try {
        window.RAMOS = (function() {
          try {
            var raw = localStorage.getItem('ramos_atividade');
            var arr = JSON.parse(raw || 'null');
            if (Array.isArray(arr) && arr.length) return arr.map(function(x) { return String(x || '').trim(); }).filter(Boolean);
          } catch (_) {}
          return window.RAMOS;
        })();
      } catch (_) {}
      if (rs) {
        var cur = rs.value || '';
        rs.innerHTML = '<option value="">Todos os ramos</option>' + ((window.RAMOS || [])).map(function(r) {
          return '<option value="' + _esc(String(r || '')) + '">' + _esc(String(r || '')) + '</option>';
        }).join('');
        rs.value = cur;
      }
      var lista = baseClientes.slice();
      if (busca) lista = lista.filter(function(c) {
        return String(c?.nome || '').toLowerCase().indexOf(String(busca || '').toLowerCase()) >= 0 || String(c?.cnpj || '').indexOf(String(busca || '')) >= 0;
      });
      if (ramo) lista = lista.filter(function(c) { return String(c?.ramo || '') === String(ramo || ''); });
      if (empFil) lista = lista.filter(function(c) { return String(c?.empId || '') === String(empFil || ''); });
      try { if (window.EMP_FILTRO && !empFil) {} } catch (_) {}

      var parseDia = function(s) {
        var d = String(s || '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
        var dt = new Date(d + 'T00:00:00');
        return Number.isFinite(dt.getTime()) ? dt : null;
      };
      var hoje = new Date((typeof window.today === 'function' ? window.today() : new Date().toISOString().slice(0, 10)) + 'T00:00:00');
      var diasEntre = function(d1, d2) { return Math.floor((d1.getTime() - d2.getTime()) / 86400000); };
      var ofDataPedido = function(o) { return String(o?.dia || o?.data_pedido || o?.created_at || '').slice(0, 10); };
      var lastByCli = new Map();
      (Array.isArray(window.OFs) ? window.OFs : []).forEach(function(o) {
        var cid = String(o?.cliId ?? o?.cli_id ?? o?.cliente_id ?? '').trim();
        if (!cid) return;
        var dt = parseDia(ofDataPedido(o));
        if (!dt) return;
        var cur = lastByCli.get(cid);
        if (!cur || dt.getTime() > cur.getTime()) lastByCli.set(cid, dt);
      });
      var diasPadrao = 30;
      try {
        if (typeof window.cfgDiasClienteInativo === 'function') diasPadrao = Math.trunc(Number(window.cfgDiasClienteInativo()) || 30);
      } catch (_) {}
      var diasSemPedidoBtn = Math.trunc(Number((document.getElementById('sel-dias-inativo') || {}).value || 30) || 30);
      var situacao = function(cliId, diasInativo) {
        var d = lastByCli.get(String(cliId || '').trim()) || null;
        if (!d) return { diasSem: null, inativo: true, ultima: null };
        var diasSem = diasEntre(hoje, d);
        return { diasSem: diasSem, inativo: diasSem > (diasInativo || diasPadrao), ultima: d };
      };

      if (sit === 'ativos') lista = lista.filter(function(c) { return !situacao(c.id, diasPadrao).inativo; });
      if (sit === 'inativos') lista = lista.filter(function(c) { return situacao(c.id, diasPadrao).inativo; });

      var modo = String(window._clientesAnaliseModo || '').trim();
      if (modo === 'sem_pedido') lista = lista.filter(function(c) {
        var st = situacao(c.id, diasSemPedidoBtn);
        return st.diasSem != null && st.diasSem >= diasSemPedidoBtn;
      }).sort(function(a, b) {
        var da = situacao(a.id, diasSemPedidoBtn).diasSem || 0;
        var db = situacao(b.id, diasSemPedidoBtn).diasSem || 0;
        return db - da;
      });
      if (modo === 'mais_pede') lista = lista.sort(function(a, b) {
        var ca = (Array.isArray(window.OFs) ? window.OFs : []).filter(function(o) { return String(o?.cliId || o?.cli_id || o?.cliente_id || '').trim() === String(a?.id || '').trim(); }).length;
        var cb = (Array.isArray(window.OFs) ? window.OFs : []).filter(function(o) { return String(o?.cliId || o?.cli_id || o?.cliente_id || '').trim() === String(b?.id || '').trim(); }).length;
        return cb - ca;
      });
      if (modo === 'maior_valor') lista = lista.sort(function(a, b) {
        var oa = (Array.isArray(window.OFs) ? window.OFs : []).filter(function(o) { return String(o?.cliId || o?.cli_id || o?.cliente_id || '').trim() === String(a?.id || '').trim(); });
        var ob = (Array.isArray(window.OFs) ? window.OFs : []).filter(function(o) { return String(o?.cliId || o?.cli_id || o?.cliente_id || '').trim() === String(b?.id || '').trim(); });
        var ta = oa.reduce(function(s, o) { return s + (Number(o?.valor_total ?? o?.valor_venda ?? o?.val ?? 0) || 0); }, 0);
        var tb = ob.reduce(function(s, o) { return s + (Number(o?.valor_total ?? o?.valor_venda ?? o?.val ?? 0) || 0); }, 0);
        return tb - ta;
      });
      if (modo === 'inativos_flag') lista = lista.filter(function(c) { return c && c.ativo === false; });

      if (!lista.length && baseClientes.length && !String(busca || '').trim() && !String(ramo || '').trim() && !String(sit || '').trim() && !String(empFil || '').trim()) {
        lista = baseClientes.slice();
        modo = '';
        try { window._clientesAnaliseModo = ''; } catch (_) {}
      }

      try { if (typeof window.renderEmpBar === 'function') window.renderEmpBar(); } catch (_) {}
      var grid = document.getElementById('cli-grid');
      if (!grid) return;
      if (!lista.length) {
        grid.innerHTML = '<div style="padding:18px;color:var(--text3);text-align:center">Nenhum cliente encontrado.</div>';
        _setClientesModo(modo);
        return;
      }
      grid.innerHTML = lista.map(function(c) {
        var ofs = (Array.isArray(window.OFs) ? window.OFs : []).filter(function(o) { return String(o?.cliId || o?.cli_id || o?.cliente_id || '').trim() === String(c?.id || '').trim(); });
        var total = ofs.reduce(function(s, o) { return s + (Number(o?.valor_total ?? o?.valor_venda ?? o?.val ?? 0) || 0); }, 0);
        var emp = null;
        try { if (typeof window.getEmp === 'function') emp = window.getEmp(c.empId); } catch (_) {}
        var st = situacao(c.id, diasPadrao);
        var badgeInativo = (st.diasSem != null && st.inativo)
          ? '<span style="background:rgba(245,158,11,.16);border:1px solid rgba(245,158,11,.45);color:var(--yellow);padding:4px 8px;border-radius:999px;font-size:.66rem;font-family:var(--mono);font-weight:900;white-space:nowrap">' + _esc(String(st.diasSem)) + ' dias sem pedido</span>'
          : '';
        var cardStyle = st.inativo ? 'border:1px solid rgba(245,158,11,.45);background:rgba(245,158,11,.06)' : '';
        var empBadge = emp ? ('<span class="emp-badge emp-' + _esc(emp.cor) + '">' + _esc(emp.sigla) + '</span>') : '';
        var fmtR = (typeof window.fmtR === 'function') ? window.fmtR : function(v) { return 'R$ ' + (Number(v || 0) || 0).toFixed(2); };
        return ('<div class="cli-card" style="' + cardStyle + '">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:3px">' +
            '<div>' +
              '<div class="cli-name">' + _esc(c.nome || '') + '</div>' +
              (c.ramo ? ('<div style="font-size:.72rem;color:var(--text3);margin-top:2px">' + _esc(c.ramo) + '</div>') : '') +
            '</div>' +
            '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
              badgeInativo + empBadge +
            '</div>' +
          '</div>' +
          '<div class="cli-sub">' + _esc((c.cidade || '') + (c.uf ? '/' + c.uf : '') + ' · ' + (c.tel || '')) + '</div>' +
          '<div class="cli-sub">' + _esc(c.email || '') + '</div>' +
          '<div class="cli-stats">' +
            '<div class="cli-stat"><b>' + _esc(String(ofs.length)) + '</b> pedidos</div>' +
            '<div class="cli-stat"><b>' + _esc(fmtR(total)) + '</b> total</div>' +
            '<div class="cli-stat"><b>' + _esc(fmtR(ofs.length ? (total / ofs.length) : 0)) + '</b> ticket</div>' +
          '</div>' +
          '<div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap">' +
            '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();abrirPainelCliente(\'' + _esc(String(c.id || '')) + '\')" style="font-size:.68rem;">👤 Painel</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarCliente(\'' + _esc(String(c.id || '')) + '\')" style="font-size:.68rem;">✏ Editar</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirCliente(\'' + _esc(String(c.id || '')) + '\')" style="font-size:.68rem;color:var(--red);">🗑 Excluir</button>' +
          '</div>' +
        '</div>');
      }).join('');

      _setClientesModo(modo);
      try { if (typeof origRender === 'function' && String(window._clientesAnaliseModo || '') === '') origRender.apply(this, arguments); } catch (_) {}
    };

    var origAnalise = window.carregarAnaliseClientes;
    window.carregarAnaliseClientes = async function(tipo) {
      var skipUntil = 0;
      try { skipUntil = Number(window._clientesSkipAutoAnaliseUntil || 0) || 0; } catch (_) { skipUntil = 0; }
      if (skipUntil && Date.now() < skipUntil) {
        _hideClientesAnaliseContainer();
        return;
      }
      var t = String(tipo || 'inativos').trim() || 'inativos';
      if (t === 'inativos') window._clientesAnaliseModo = 'sem_pedido';
      else if (t === 'ativos') window._clientesAnaliseModo = 'mais_pede';
      else if (t === 'valor') window._clientesAnaliseModo = 'maior_valor';
      _setClientesModo(String(window._clientesAnaliseModo || ''));
      try { window._clientesFiltroAtivo = String(window._clientesAnaliseModo || ''); } catch (_) {}
      try { window.renderClientes(); } catch (_) {}
      _hideClientesAnaliseContainer();
      return;
    };

    ['btn-analise-inativos', 'btn-analise-ativos', 'btn-analise-valor'].forEach(function(id) {
      var btn = document.getElementById(id);
      if (!btn || btn.dataset.patchClientesBtn === '1') return;
      btn.dataset.patchClientesBtn = '1';
      btn.setAttribute('data-clientes-modo', id === 'btn-analise-inativos' ? 'sem_pedido' : (id === 'btn-analise-valor' ? 'maior_valor' : 'mais_pede'));
      btn.onclick = function(ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        try { window.carregarAnaliseClientes(id === 'btn-analise-inativos' ? 'inativos' : (id === 'btn-analise-valor' ? 'valor' : 'ativos')); } catch (_) {}
      };
      btn.style.pointerEvents = 'auto';
    });

    var btnInativosFlag = document.querySelector('#page-clientes .ptoolbar button[onclick*="abrirClientesInativos"]');
    if (btnInativosFlag && btnInativosFlag.dataset.patchClientesInativosFlag !== '1') {
      btnInativosFlag.dataset.patchClientesInativosFlag = '1';
      btnInativosFlag.setAttribute('data-clientes-modo', 'inativos_flag');
      var origClick = btnInativosFlag.onclick;
      btnInativosFlag.onclick = function(ev) {
        if (ev && (ev.altKey || ev.shiftKey)) {
          try { return (typeof origClick === 'function') ? origClick.call(this, ev) : (typeof window.abrirClientesInativos === 'function' ? window.abrirClientesInativos() : null); } catch (_) { return; }
        }
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        try { window._clientesAnaliseModo = 'inativos_flag'; } catch (_) {}
        _setClientesModo('inativos_flag');
        try { window.renderClientes(); } catch (_) {}
      };
    }

    _ensureBtnVerTodos();

    var origSalvarCliente = window.salvarCliente;
    if (typeof origSalvarCliente === 'function' && !origSalvarCliente._patchRefreshClientesV2) {
      var wrappedSalvarCliente = async function() {
        var idAntes = '';
        var empresaIdAtual = String((window.CURRENT_USER?.empresa_id || window.CURRENT_USER?.empId || '')).trim();
        try {
          var idEl = document.getElementById('cli-id');
          idAntes = String(window.CLIENTE_ATUAL_ID || (idEl ? idEl.value : '') || '').trim();
          if (idAntes === 'undefined' || idAntes === 'null') idAntes = '';
        } catch (_) {}
        var origApiFetch = window.apiFetch;
        if (typeof origApiFetch === 'function') {
          window.apiFetch = function(url, opts) {
            var u = String(url || '');
            var o = opts && typeof opts === 'object' ? Object.assign({}, opts) : {};
            var method = String(o.method || 'GET').toUpperCase();
            var isClientes = u === '/api/clientes' || u.indexOf('/api/clientes/') === 0;
            var body = o.body;
            var isPlain = body && typeof body === 'object' && !Array.isArray(body) && !(body instanceof Date) && !(body instanceof FormData);
            if (isClientes && (method === 'POST' || method === 'PUT') && isPlain) {
              body = Object.assign({}, body);
              if (empresaIdAtual) body.empresa_id = empresaIdAtual;
              if (!body.emp_id) {
                body.emp_id = String(window.EMP_FILTRO || window.CURRENT_USER?.emp_id || window.CURRENT_USER?.empId || '').trim() || body.emp_id;
              }
              o.body = body;
            }
            return origApiFetch.call(this, u, o);
          };
        }
        var r;
        try {
          r = await origSalvarCliente.apply(this, arguments);
        } finally {
          if (typeof origApiFetch === 'function') window.apiFetch = origApiFetch;
        }
        var modal = document.getElementById('modal-cli');
        var modalAberto = !!(modal && modal.style.display && modal.style.display !== 'none');
        if (modalAberto) return r;
        try {
          try { window._clientesCache = null; } catch (_) {}
          try { window._clientesCarregados = false; } catch (_) {}
          try { window.CLIENTES = []; } catch (_) {}
          await _refreshClientesFullList({ reset: !idAntes, scroll: !idAntes });
        } catch (_) {}
        return r;
      };
      wrappedSalvarCliente._patchRefreshClientesV2 = true;
      window.salvarCliente = wrappedSalvarCliente;
    }
  }

  function _patchHistoricoPassagensOverflow() {
    if (document.getElementById('patch-hist-passagens-overflow-fix')) return;
    var st = document.createElement('style');
    st.id = 'patch-hist-passagens-overflow-fix';
    st.textContent =
      '#page-historico-passagens{height:auto !important;min-height:100vh !important;overflow:visible !important;}' +
      '#page-historico-passagens *{max-height:none !important;}' +
      '#hist-graficos-wrap,#hist-passagens-resultado{overflow:visible !important;}' +
      '#hist-graficos-wrap canvas{max-width:100% !important;}' +
      '#hist-passagens-resultado{height:auto !important;min-height:0 !important;}' +
      '.patch-hist-recentes{overflow:visible !important;}';
    document.head.appendChild(st);
  }

  function _removeQrChapas() {
    if (String(window._PAGE_ATUAL || '') !== 'estoque') return;
    var host = document.getElementById('page-estoque');
    if (!host) return;
    host.querySelectorAll('[class*="qr"], [id*="qr"], button[onclick*="qr"], button[onclick*="QR"], [onclick*="/api/chapas/qr"]')
      .forEach(function(el) { try { el.remove(); } catch (_) {} });
  }

  function _ensurePcpActionsPanel() {
    var page = document.getElementById('page-pcp');
    if (!page) return;
    var tb = page.querySelector('.ptoolbar');
    if (!tb) return;
    var panel = document.getElementById('pcp-actions-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'pcp-actions-panel';
      panel.style.cssText = 'display:none;margin:8px 10px 0 10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);align-items:center;gap:10px;flex-wrap:wrap';
      tb.insertAdjacentElement('afterend', panel);
    }
    var sel = String(window.ofSel || '').trim();
    if (!sel) { panel.style.display = 'none'; panel.innerHTML = ''; return; }
    var of = (Array.isArray(window.OFs) ? window.OFs : []).find(function(o) { return String(o?.of || o?.numero || '').trim() === sel; }) || null;
    var ofId = String(of?.id || '').trim();
    if (!ofId) { panel.style.display = 'none'; panel.innerHTML = ''; return; }
    if (panel.dataset.ofId !== ofId) panel.dataset.ofId = ofId;
    panel.style.display = 'flex';
    try {
      var lbl = panel.querySelector('#pcp-actions-label');
      if (lbl) lbl.textContent = 'OF ' + sel;
    } catch (_) {}
    if (panel.dataset.patchBuilt === '1') return;
    panel.dataset.patchBuilt = '1';

    var left = document.createElement('div');
    left.id = 'pcp-actions-label';
    left.textContent = 'OF ' + sel;
    left.style.cssText = 'font-family:var(--mono);font-weight:900;color:var(--accent);margin-right:6px';
    var btnFoto = document.createElement('button');
    btnFoto.type = 'button';
    btnFoto.textContent = '📷 Adicionar foto';
    btnFoto.className = 'btn btn-ghost btn-sm';
    var btnCli = document.createElement('button');
    btnCli.type = 'button';
    btnCli.textContent = '👤 Alterar cliente';
    btnCli.className = 'btn btn-ghost btn-sm';
    panel.appendChild(left);
    panel.appendChild(btnFoto);
    panel.appendChild(btnCli);

    var fileInp = document.createElement('input');
    fileInp.type = 'file';
    fileInp.accept = 'image/*';
    fileInp.style.display = 'none';
    panel.appendChild(fileInp);

    async function uploadAndPatch(file) {
      var curSel = String(window.ofSel || '').trim();
      var curOf = (Array.isArray(window.OFs) ? window.OFs : []).find(function(o) { return String(o?.of || o?.numero || '').trim() === curSel; }) || null;
      var curId = String(curOf?.id || '').trim();
      if (!curId) return _toast('OF inválida', 'var(--red)');
      var fd = new FormData();
      fd.append('file', file, file.name || 'of.png');
      var up = await fetch('/api/ofs/upload', { method: 'POST', headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }, body: fd });
      var uj = await up.json().catch(function() { return null; });
      if (!up.ok || !uj || !uj.ok || !uj.data || !uj.data.url) {
        var msg = uj?.error || ('Falha no upload (HTTP ' + up.status + ')');
        throw new Error(msg);
      }
      var url = String(uj.data.url || '').trim();
      if (!url) throw new Error('URL inválida');
      var pr = await fetch('/api/ofs/' + encodeURIComponent(curId), {
        method: 'PATCH',
        headers: _hdrJson(),
        body: JSON.stringify({ imagem_url: url })
      });
      var pj = await pr.json().catch(function() { return null; });
      if (!pr.ok || !pj || pj.ok === false) throw new Error(pj?.error || ('Falha ao salvar imagem (HTTP ' + pr.status + ')'));
      try {
        curOf.imagem_url = url;
        if (!Array.isArray(curOf.imgs)) curOf.imgs = [];
        if (curOf.imgs.indexOf(url) < 0) curOf.imgs.unshift(url);
      } catch (_) {}
      try { if (typeof window.renderPCP === 'function') window.renderPCP(); } catch (_) {}
      _toast('✓ Foto salva na OF', 'var(--green)');
    }

    btnFoto.onclick = function(ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      fileInp.click();
    };
    fileInp.onchange = function() {
      var f = (fileInp.files && fileInp.files[0]) ? fileInp.files[0] : null;
      fileInp.value = '';
      if (!f) return;
      uploadAndPatch(f).catch(function(e) { _toast(String(e?.message || e || 'Erro ao salvar foto'), 'var(--red)'); });
    };

    btnCli.onclick = function(ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      _openAlterarClienteModal();
    };

    function _openAlterarClienteModal() {
      try { document.getElementById('pcp-alt-cli-ov')?.remove(); } catch (_) {}
      try { document.getElementById('pcp-alt-cli-modal')?.remove(); } catch (_) {}
      var ov = document.createElement('div');
      ov.id = 'pcp-alt-cli-ov';
      ov.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(3px)';
      ov.onclick = function(e) { if (e && e.target === ov) { ov.remove(); try { document.getElementById('pcp-alt-cli-modal')?.remove(); } catch (_) {} } };
      var m = document.createElement('div');
      m.id = 'pcp-alt-cli-modal';
      m.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;background:#0d1320;border:1px solid rgba(255,255,255,0.12);border-radius:14px;width:min(520px,94vw);box-shadow:0 22px 70px rgba(0,0,0,0.7);overflow:hidden';

      var dlId = 'pcp-alt-cli-dl';
      _ensureClientesDatalist(dlId);

      m.innerHTML =
        '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;gap:10px">' +
          '<div style="font-weight:900;color:#e2e8f0">👤 Alterar cliente</div>' +
          '<button type="button" id="pcp-alt-cli-close" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="padding:14px 16px;display:grid;gap:10px">' +
          '<div style="display:grid;gap:6px">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Cliente</label>' +
            '<input id="pcp-alt-cli-inp" list="' + _esc(dlId) + '" placeholder="Digite e selecione da lista" style="width:100%;background:#080c14;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none" />' +
          '</div>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:4px">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="pcp-alt-cli-cancel">Cancelar</button>' +
            '<button type="button" class="btn btn-accent btn-sm" id="pcp-alt-cli-save">Salvar</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(ov);
      document.body.appendChild(m);

      var close = function() { try { ov.remove(); } catch (_) {} try { m.remove(); } catch (_) {} };
      m.querySelector('#pcp-alt-cli-close').onclick = close;
      m.querySelector('#pcp-alt-cli-cancel').onclick = close;

      var inp = m.querySelector('#pcp-alt-cli-inp');
      var chosenId = '';
      inp.addEventListener('input', function() { chosenId = ''; });
      inp.addEventListener('change', function() {
        var c = _findClienteByNome(inp.value);
        chosenId = String(c?.id || '').trim();
      });
      inp.focus();

      m.querySelector('#pcp-alt-cli-save').onclick = function() {
        var c = _findClienteByNome(inp.value);
        var cid = String(chosenId || c?.id || '').trim();
        var cnome = String(c?.nome || c?.razao_social || c?.razao || inp.value || '').trim();
        if (!cid) return _toast('Selecione um cliente válido da lista', 'var(--yellow)');
        var curSel = String(window.ofSel || '').trim();
        var curOf = (Array.isArray(window.OFs) ? window.OFs : []).find(function(o) { return String(o?.of || o?.numero || '').trim() === curSel; }) || null;
        var curId = String(curOf?.id || '').trim();
        if (!curId) return _toast('OF inválida', 'var(--red)');
        fetch('/api/ofs/' + encodeURIComponent(curId), {
          method: 'PATCH',
          headers: _hdrJson(),
          body: JSON.stringify({ cliente_id: cid, cli_id: cid, cliNome: cnome, clinome: cnome, cliente_nome: cnome })
        }).then(function(r) { return r.json().then(function(j) { return { r: r, j: j }; }); })
          .then(function(x) {
            if (!x.r.ok || !x.j || x.j.ok === false) throw new Error(x.j?.error || ('HTTP ' + x.r.status));
            try {
              curOf.cliId = cid;
              curOf.cli_id = cid;
              curOf.cliente_id = cid;
              curOf.cliNome = cnome;
              curOf.clinome = cnome;
              curOf.cliente_nome = cnome;
            } catch (_) {}
            try { if (typeof window.renderPCP === 'function') window.renderPCP(); } catch (_) {}
            _toast('✓ Cliente atualizado', 'var(--green)');
            close();
          })
          .catch(function(e) { _toast(String(e?.message || e || 'Erro ao atualizar cliente'), 'var(--red)'); });
      };
    }
  }

  function _ensureImportarOfImagemButton() {
    var ref = document.getElementById('btn-nova-of-rapida');
    if (ref && !document.getElementById('btn-importar-of-imagem')) {
      var b = document.createElement('button');
      b.id = 'btn-importar-of-imagem';
      b.className = 'btn btn-ghost btn-sm';
      b.textContent = '📷 Importar OF por Imagem';
      b.onclick = function(ev) { if (ev) { ev.preventDefault(); ev.stopPropagation(); } _openImportarOfImagemModal(); };
      ref.insertAdjacentElement('afterend', b);
    }
    document.querySelectorAll('.hub-qbtn').forEach(function(el) {
      if (!el || el.dataset.patchImportBtn === '1') return;
      var t = String(el.textContent || '').trim();
      if (t !== '⚡ OF Rápida') return;
      el.dataset.patchImportBtn = '1';
      var b2 = document.createElement('button');
      b2.className = 'hub-qbtn';
      b2.textContent = '📷 Importar OF por Imagem';
      b2.onclick = function() { _openImportarOfImagemModal(); };
      el.insertAdjacentElement('afterend', b2);
    });
  }

  function _openImportarOfImagemModal() {
    try { document.getElementById('impof-ov')?.remove(); } catch (_) {}
    try { document.getElementById('impof-modal')?.remove(); } catch (_) {}
    var ov = document.createElement('div');
    ov.id = 'impof-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,0.72);backdrop-filter:blur(3px)';
    ov.onclick = function(e) { if (e && e.target === ov) _closeImportarOfImagemModal(); };
    var m = document.createElement('div');
    m.id = 'impof-modal';
    m.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99991;background:#0d1320;border:1px solid rgba(255,255,255,0.12);border-radius:14px;width:min(860px,96vw);max-height:92vh;overflow:auto;box-shadow:0 22px 70px rgba(0,0,0,0.7)';
    document.body.appendChild(ov);
    document.body.appendChild(m);
    _renderImportarOfImagemStep1();
  }

  function _closeImportarOfImagemModal() {
    try { document.getElementById('impof-ov')?.remove(); } catch (_) {}
    try { document.getElementById('impof-modal')?.remove(); } catch (_) {}
  }

  var _impState = { file: null, arquivo_url: '', data: null };

  function _renderImportarOfImagemStep1() {
    var m = document.getElementById('impof-modal');
    if (!m) return;
    _impState = { file: null, arquivo_url: '', data: null };
    m.innerHTML =
      '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;gap:10px">' +
        '<div style="font-weight:900;color:#e2e8f0">📷 Importar OF por Imagem</div>' +
        '<button type="button" id="impof-close" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer">✕</button>' +
      '</div>' +
      '<div style="padding:14px 16px;display:grid;gap:12px">' +
        '<div style="color:#94a3b8;font-size:12px">Selecione uma imagem (JPG/PNG), analise, confira os campos e só então salve.</div>' +
        '<input id="impof-file" type="file" accept="image/*" ' + (_isMobile() ? 'capture="environment"' : '') + ' style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:10px;border-radius:10px;color:#e2e8f0" />' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="impof-cancel">Cancelar</button>' +
          '<button type="button" class="btn btn-accent btn-sm" id="impof-analisar">Analisar imagem</button>' +
        '</div>' +
        '<div id="impof-msg" style="font-size:12px;color:#94a3b8"></div>' +
      '</div>';
    m.querySelector('#impof-close').onclick = _closeImportarOfImagemModal;
    m.querySelector('#impof-cancel').onclick = _closeImportarOfImagemModal;
    m.querySelector('#impof-analisar').onclick = function() {
      var inp = document.getElementById('impof-file');
      var f = (inp && inp.files && inp.files[0]) ? inp.files[0] : null;
      if (!f) return _toast('Selecione um arquivo', 'var(--yellow)');
      _impState.file = f;
      _analisarImpOfImagem(f);
    };
  }

  function _valFromObj(o) {
    if (!o || typeof o !== 'object') return { valor: null, low: true };
    var v = Object.prototype.hasOwnProperty.call(o, 'valor') ? o.valor : null;
    var low = !!o.low_confidence;
    return { valor: v, low: low };
  }

  function _analisarImpOfImagem(file) {
    var m = document.getElementById('impof-modal');
    if (!m) return;
    var msg = document.getElementById('impof-msg');
    if (msg) msg.textContent = 'Lendo imagem e identificando dados...';
    var fr = new FileReader();
    fr.onerror = function() {
      if (msg) msg.textContent = '';
      _toast('Falha ao ler imagem', 'var(--red)');
    };
    fr.onload = function(ev) {
      var dataUrl = String(ev && ev.target ? ev.target.result : '') || '';
      if (!dataUrl || dataUrl.indexOf('data:image/') !== 0) {
        if (msg) msg.textContent = '';
        _toast('Formato de imagem não suportado. Use JPG ou PNG', 'var(--yellow)');
        return;
      }
      fetch('/api/importar-of-imagem', {
        method: 'POST',
        headers: _hdrJson(),
        body: JSON.stringify({ imagem: dataUrl })
      })
        .then(function(r) { return r.json().then(function(j) { return { r: r, j: j }; }); })
        .then(function(x) {
          if (!x.r.ok || !x.j || x.j.ok === false) throw new Error(x.j?.error || ('HTTP ' + x.r.status));
          _impState.arquivo_url = String(x.j.arquivo_url || '').trim();
          _impState.data = x.j.data || null;
          if (!_impState.data) throw new Error('Resposta inválida');
          _renderImportarOfImagemReview(_impState.data, _impState.arquivo_url);
        })
        .catch(function(e) {
          if (msg) msg.textContent = '';
          var em = String(e?.message || e || '');
          if (em.toLowerCase().indexOf('ocr não disponível') >= 0) {
            _toast('OCR ainda não configurado no servidor. Aguarde atualização do sistema.', 'var(--yellow)');
            return;
          }
          _toast(em || 'Erro ao analisar', 'var(--red)');
        });
    };
    fr.readAsDataURL(file);
  }

  function _renderImportarOfImagemReview(data, arquivoUrl) {
    var m = document.getElementById('impof-modal');
    if (!m) return;
    var itens = [];
    try {
      var arr = data && Array.isArray(data.itens_adicionais) ? data.itens_adicionais : [];
      itens = [data].concat(arr);
    } catch (_) { itens = [data]; }
    m.innerHTML =
      '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;gap:10px">' +
        '<div style="font-weight:900;color:#e2e8f0">✅ Conferência</div>' +
        '<button type="button" id="impof-close2" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer">✕</button>' +
      '</div>' +
      '<div style="padding:14px 16px;display:grid;gap:12px">' +
        (arquivoUrl ? ('<div style="color:#94a3b8;font-size:12px;word-break:break-all">Arquivo: <a href="' + _esc(arquivoUrl) + '" target="_blank" style="color:#60a5fa">abrir</a></div>') : '') +
        '<div id="impof-itens"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="impof-voltar">Voltar</button>' +
          '<button type="button" class="btn btn-accent btn-sm" id="impof-salvar">✅ Salvar OF</button>' +
        '</div>' +
        '<div id="impof-save-msg" style="font-size:12px;color:#94a3b8"></div>' +
      '</div>';
    m.querySelector('#impof-close2').onclick = _closeImportarOfImagemModal;
    m.querySelector('#impof-voltar').onclick = _renderImportarOfImagemStep1;

    var host = document.getElementById('impof-itens');
    host.innerHTML = itens.map(function(it, idx) {
      return _renderImpItemForm(it, idx);
    }).join('');

    host.querySelectorAll('select[data-vend-select="1"]').forEach(function(sel) { _ensureVendedoresSelectOptions(sel); });
    host.querySelectorAll('select[data-emp-select="1"]').forEach(function(sel) {
      if (String(sel.value || '')) return;
      try {
        var cur = (document.getElementById('of-r-empresa') || {}).value || '';
        if (cur) sel.value = cur;
      } catch (_) {}
    });
    host.querySelectorAll('[data-vend-autofill="1"]').forEach(function(el) {
      var nm = el.getAttribute('data-vend-nome') || '';
      var vId = _matchVendedorPorNome(nm);
      var sel = host.querySelector('select[data-vend-select="1"][data-idx="' + el.getAttribute('data-idx') + '"]');
      if (sel && vId) sel.value = vId;
    });

    host.querySelectorAll('input[data-cli-input="1"]').forEach(function(inp) {
      var idx = inp.getAttribute('data-idx');
      _ensureClientesDatalist('impof-cli-dl');
      inp.setAttribute('list', 'impof-cli-dl');
      inp.addEventListener('input', function() { inp.dataset.clienteId = ''; });
      inp.addEventListener('change', function() {
        var c = _findClienteByNome(inp.value);
        inp.dataset.clienteId = String(c?.id || '').trim();
        if (c && c.nome) inp.value = String(c.nome).trim();
      });
      var c0 = _findClienteByNome(inp.value);
      if (c0 && c0.id) inp.dataset.clienteId = String(c0.id).trim();
    });

    m.querySelector('#impof-salvar').onclick = function() { _salvarImpOfs(itens, arquivoUrl); };
  }

  function _inpStyle(low) {
    return 'width:100%;background:' + (low ? 'rgba(245,158,11,0.12)' : '#080c14') + ';border:1px solid ' + (low ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.1)') + ';border-radius:10px;padding:10px 12px;color:#e8f0fe;font-size:14px;outline:none';
  }

  function _renderImpItemForm(it, idx) {
    var num = _valFromObj(it.numero_of);
    var cli = _valFromObj(it.cliente_nome);
    var vend = _valFromObj(it.vendedor);
    var ent = _valFromObj(it.data_entrega);
    var qtd = _valFromObj(it.quantidade);
    var mod = _valFromObj(it.modelo_caixa);
    var obs = _valFromObj(it.observacoes);
    var secTitle = idx === 0 ? 'Item principal' : ('Item adicional ' + idx);
    return (
      '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 12px;background:rgba(255,255,255,0.02)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">' +
          '<div style="font-weight:900;color:#e2e8f0">' + _esc(secTitle) + '</div>' +
          '<div style="color:#94a3b8;font-size:12px">' + (idx === 0 ? '' : '') + '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
          '<div style="display:grid;gap:6px">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Número OF</label>' +
            '<input data-k="numero_of" data-idx="' + _esc(idx) + '" value="' + _esc(num.valor == null ? '' : num.valor) + '" placeholder="Verificar" style="' + _inpStyle(num.low) + '" />' +
          '</div>' +
          '<div style="display:grid;gap:6px">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Empresa</label>' +
            '<select data-emp-select="1" data-idx="' + _esc(idx) + '" style="' + _inpStyle(false) + '">' +
              '<option value="E1">Italy Embalagens</option>' +
              '<option value="E2">Cartoeste</option>' +
              '<option value="E3">Oestepack</option>' +
            '</select>' +
          '</div>' +
          '<div style="display:grid;gap:6px">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Cliente *</label>' +
            '<input data-cli-input="1" data-idx="' + _esc(idx) + '" data-cliente-id="" value="' + _esc(cli.valor == null ? '' : cli.valor) + '" placeholder="Verificar" style="' + _inpStyle(cli.low) + '" />' +
          '</div>' +
          '<div style="display:grid;gap:6px">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Vendedor *</label>' +
            '<select data-vend-select="1" data-idx="' + _esc(idx) + '" style="' + _inpStyle(vend.low) + '"></select>' +
            '<span data-vend-autofill="1" data-idx="' + _esc(idx) + '" data-vend-nome="' + _esc(vend.valor == null ? '' : vend.valor) + '" style="display:none"></span>' +
          '</div>' +
          '<div style="display:grid;gap:6px">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Data de entrega *</label>' +
            '<input type="date" data-k="data_entrega" data-idx="' + _esc(idx) + '" value="' + _esc(String(ent.valor || '').slice(0,10)) + '" style="' + _inpStyle(ent.low) + '" />' +
          '</div>' +
          '<div style="display:grid;gap:6px">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Quantidade *</label>' +
            '<input type="number" min="1" data-k="quantidade" data-idx="' + _esc(idx) + '" value="' + _esc(qtd.valor == null ? '' : qtd.valor) + '" placeholder="0" style="' + _inpStyle(qtd.low) + '" />' +
          '</div>' +
          '<div style="display:grid;gap:6px;grid-column:1/-1">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Produto / Modelo *</label>' +
            '<input data-k="modelo_caixa" data-idx="' + _esc(idx) + '" value="' + _esc(mod.valor == null ? '' : mod.valor) + '" placeholder="Verificar" style="' + _inpStyle(mod.low) + '" />' +
          '</div>' +
          '<div style="display:grid;gap:6px">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Valor unitário *</label>' +
            '<input type="number" step="0.01" min="0" data-k="valor_unitario" data-idx="' + _esc(idx) + '" value="" placeholder="0,00" style="' + _inpStyle(true) + '" />' +
          '</div>' +
          '<div style="display:grid;gap:6px">' +
            '<label style="font-size:11px;color:#94a3b8;font-weight:800">Observações</label>' +
            '<input data-k="observacoes" data-idx="' + _esc(idx) + '" value="' + _esc(obs.valor == null ? '' : obs.valor) + '" placeholder="Verificar" style="' + _inpStyle(obs.low) + '" />' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function _salvarImpOfs(itensNorm, arquivoUrl) {
    var m = document.getElementById('impof-modal');
    if (!m) return;
    var host = document.getElementById('impof-itens');
    var msg = document.getElementById('impof-save-msg');
    if (msg) msg.textContent = '';

    var itens = [];
    for (var i = 0; i < itensNorm.length; i++) {
      var idx = String(i);
      var numero = String((host.querySelector('input[data-k="numero_of"][data-idx="' + idx + '"]') || {}).value || '').trim();
      var emp = String((host.querySelector('select[data-emp-select="1"][data-idx="' + idx + '"]') || {}).value || 'E1').trim() || 'E1';
      var cliInp = host.querySelector('input[data-cli-input="1"][data-idx="' + idx + '"]');
      var cliNome = String(cliInp ? cliInp.value : '').trim();
      var cliId = String(cliInp ? (cliInp.dataset.clienteId || '') : '').trim();
      if (!cliId) {
        var c = _findClienteByNome(cliNome);
        cliId = String(c?.id || '').trim();
        if (cliInp) cliInp.dataset.clienteId = cliId;
        if (c && c.nome && cliInp) cliInp.value = String(c.nome).trim();
      }
      var vendId = String((host.querySelector('select[data-vend-select="1"][data-idx="' + idx + '"]') || {}).value || '').trim();
      var ent = String((host.querySelector('input[data-k="data_entrega"][data-idx="' + idx + '"]') || {}).value || '').trim();
      var qtd = Math.trunc(Number((host.querySelector('input[data-k="quantidade"][data-idx="' + idx + '"]') || {}).value || 0) || 0);
      var prod = String((host.querySelector('input[data-k="modelo_caixa"][data-idx="' + idx + '"]') || {}).value || '').trim();
      var vunit = Number((host.querySelector('input[data-k="valor_unitario"][data-idx="' + idx + '"]') || {}).value || 0) || 0;
      var obs = String((host.querySelector('input[data-k="observacoes"][data-idx="' + idx + '"]') || {}).value || '').trim();
      if (!cliId || !vendId || !(qtd > 0) || !prod || !ent || !(vunit > 0)) {
        _toast('Preencha os campos obrigatórios (*) em todos os itens', 'var(--yellow)');
        return;
      }
      var total = Math.round((vunit * qtd) * 100) / 100;
      var payload = {
        emp_id: emp,
        empId: emp,
        cliente_id: cliId,
        cli_id: cliId,
        cliId: cliId,
        cliNome: cliNome,
        clinome: cliNome,
        vendedor_id: vendId,
        vendId: vendId,
        qtd: qtd,
        quantidade: qtd,
        descricao: prod,
        prodDesc: prod,
        data_entrega: ent,
        ent: ent,
        valor_total: total,
        valor_venda: total,
        valor_unitario: vunit,
        imagem_url: arquivoUrl || undefined,
        obs: obs || undefined,
      };
      if (numero) { payload.of = numero; payload.numero = numero; payload.of_num = numero; }
      itens.push(payload);
    }

    var iCur = 0;
    var results = [];
    function next() {
      if (iCur >= itens.length) {
        _toast('✓ OF(s) criada(s)', 'var(--green)');
        try { if (typeof window.carregarOFs === 'function') window.carregarOFs(); } catch (_) {}
        try { if (typeof window.renderPCP === 'function') setTimeout(window.renderPCP, 200); } catch (_) {}
        _closeImportarOfImagemModal();
        return;
      }
      var p = itens[iCur];
      if (msg) msg.textContent = 'Salvando ' + (iCur + 1) + ' / ' + itens.length + '...';
      fetch('/api/ofs', { method: 'POST', headers: _hdrJson(), body: JSON.stringify(p) })
        .then(function(r) { return r.json().then(function(j) { return { r: r, j: j }; }); })
        .then(function(x) {
          if (!x.r.ok || !x.j || x.j.ok === false) throw new Error(x.j?.error || ('HTTP ' + x.r.status));
          results.push(x.j.data || null);
          iCur++;
          next();
        })
        .catch(function(e) {
          if (msg) msg.textContent = '';
          _toast(String(e?.message || e || 'Erro ao salvar OF'), 'var(--red)');
        });
    }
    next();
  }

  function _patchCompraPapelaoSugerida() {
    if (window._patchCompraPapelaoSugeridaV1) return;
    window._patchCompraPapelaoSugeridaV1 = true;

    function isoDaysAgo(n) {
      var d = new Date();
      d.setHours(12,0,0,0);
      d.setDate(d.getDate() - (Math.trunc(Number(n) || 0) || 0));
      return d.toISOString().slice(0,10);
    }

    function normKey(s) { return _norm(s).toUpperCase(); }

    function guessTipo(of) {
      var v = String(of?.chp || of?.tipo_caixa || of?.tipo || '').trim();
      if (!v && Array.isArray(of?.itens) && of.itens[0]) v = String(of.itens[0]?.chp || of.itens[0]?.tipo_caixa || '').trim();
      return v;
    }

    async function fetchAllConcluidas90() {
      var from = isoDaysAgo(90);
      var all = [];
      var limit = 300;
      for (var page = 0; page < 10; page++) {
        var offset = page * limit;
        var url = '/api/ofs?lite=1&limit=' + limit + '&offset=' + offset +
          '&from=' + encodeURIComponent(from) +
          '&date_field=updated_at' +
          '&status=' + encodeURIComponent('Concluído') +
          '&excluir_canceladas=1&nocache=1&t=' + Date.now();
        var r = await fetch(url, { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } });
        var j = await r.json().catch(function() { return null; });
        var rows = (j && j.ok !== false && Array.isArray(j.data)) ? j.data : (Array.isArray(j?.ofs) ? j.ofs : []);
        rows = Array.isArray(rows) ? rows : [];
        all = all.concat(rows);
        if (rows.length < limit) break;
      }
      return all;
    }

    async function fetchEstoque() {
      var r = await fetch('/api/chapas_estoque?nocache=1&t=' + Date.now(), { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } });
      var j = await r.json().catch(function() { return null; });
      var rows = (j && j.ok !== false && Array.isArray(j.data)) ? j.data : (Array.isArray(j?.chapas) ? j.chapas : []);
      return Array.isArray(rows) ? rows : [];
    }

    function calcSugestoes(ofs, chapas) {
      var byTipo = new Map();
      ofs.forEach(function(of) {
        var tipo = guessTipo(of);
        tipo = String(tipo || '').trim();
        if (!tipo) return;
        var qtd = Math.trunc(Number(of?.qtd ?? of?.quantidade ?? 0) || 0);
        if (!(qtd > 0)) return;
        var k = normKey(tipo);
        var cur = byTipo.get(k) || { tipo: tipo, qtd90: 0 };
        cur.qtd90 += qtd;
        byTipo.set(k, cur);
      });

      var stockByTipo = new Map();
      chapas.forEach(function(ch) {
        var nome = String(ch?.nomenclatura || ch?.nome || ch?.uso || '').trim();
        var qtd = Math.trunc(Number(ch?.quantidade_atual ?? ch?.quantidade ?? ch?.qtd ?? 0) || 0);
        if (!nome) return;
        stockByTipo.set(normKey(nome), (stockByTipo.get(normKey(nome)) || 0) + qtd);
      });

      var sugestoes = [];
      byTipo.forEach(function(v, k) {
        var consumoDia = v.qtd90 / 90;
        if (!(consumoDia > 0)) return;
        var qtdAtual = 0;
        if (stockByTipo.has(k)) qtdAtual = stockByTipo.get(k);
        else {
          var best = 0;
          stockByTipo.forEach(function(q, kk) {
            if (kk.indexOf(k) >= 0 || k.indexOf(kk) >= 0) best += q;
          });
          qtdAtual = best;
        }
        var diasRest = qtdAtual > 0 ? (qtdAtual / consumoDia) : 0;
        if (diasRest >= 15) return;
        var alvoDias = 30;
        var precisa = Math.max(0, Math.ceil(consumoDia * alvoDias - qtdAtual));
        sugestoes.push({
          tipo: v.tipo,
          consumoDia: consumoDia,
          qtdAtual: qtdAtual,
          diasRest: diasRest,
          comprar: precisa,
        });
      });

      sugestoes.sort(function(a, b) { return (a.diasRest || 0) - (b.diasRest || 0); });
      return sugestoes;
    }

    function renderHost(hostEl, force) {
      if (!hostEl) return;
      if (hostEl.dataset.autoCompraInit === '1' && !force) return;
      hostEl.dataset.autoCompraInit = '1';
      hostEl.innerHTML =
        '<div class="sbox" style="margin-bottom:12px">' +
          '<div class="sbox-h" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
            '<span>🧾 Compra de Papelão Automática Sugerida</span>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
              '<button class="btn btn-ghost btn-sm" id="auto-compra-refresh">↻ Atualizar</button>' +
            '</div>' +
          '</div>' +
          '<div class="sbox-b" id="auto-compra-body">' +
            '<div style="padding:12px;color:var(--text3);font-size:.8rem">Carregando…</div>' +
          '</div>' +
        '</div>';
      var btn = hostEl.querySelector('#auto-compra-refresh');
      if (btn) btn.onclick = function() { load(hostEl); };
      load(hostEl);
    }

    async function load(hostEl) {
      var body = hostEl.querySelector('#auto-compra-body');
      if (!body) return;
      body.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:.8rem">Carregando…</div>';
      try {
        var ignored = {};
        try { ignored = JSON.parse(localStorage.getItem('AUTO_COMPRA_IGNORE') || '{}') || {}; } catch (_) { ignored = {}; }
        var ofs = await fetchAllConcluidas90();
        var chapas = await fetchEstoque();
        var sug = calcSugestoes(ofs, chapas).filter(function(s) { return !ignored[normKey(s.tipo)]; });
        if (!sug.length) {
          body.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:.82rem">Nenhuma sugestão (estoque ≥ 15 dias ou sem dados suficientes).</div>';
          return;
        }
        body.innerHTML = sug.map(function(s) {
          var dias = Math.max(0, Math.floor(Number(s.diasRest || 0)));
          var comprar = Math.max(0, Math.trunc(Number(s.comprar || 0)));
          var tipo = String(s.tipo || '').trim() || '—';
          var warn = dias <= 7 ? '#ef4444' : '#f59e0b';
          return (
            '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;background:rgba(255,255,255,0.02);margin-bottom:10px">' +
              '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
                '<div style="min-width:220px">' +
                  '<div style="font-weight:900;color:#e2e8f0;margin-bottom:4px">📦 ' + _esc(tipo) + '</div>' +
                  '<div style="color:#94a3b8;font-size:.78rem">Consumo médio: ' + _esc((Number(s.consumoDia || 0).toFixed(2))) + ' / dia · Estoque: ' + _esc(String(s.qtdAtual || 0)) + '</div>' +
                '</div>' +
                '<div style="text-align:right">' +
                  '<div style="font-family:var(--mono);font-weight:900;color:' + warn + '">~' + _esc(String(dias)) + ' dias</div>' +
                  '<div style="color:#94a3b8;font-size:.75rem">restantes</div>' +
                '</div>' +
              '</div>' +
              '<div style="margin-top:10px;color:#e2e8f0;font-size:.86rem">Você precisará comprar <b>' + _esc(String(comprar)) + '</b> chapas <b>' + _esc(tipo) + '</b> em <b>' + _esc(String(dias)) + '</b> dias.</div>' +
              '<div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">' +
                '<button class="btn btn-accent btn-sm" data-auto-compra="pedir" data-tipo="' + _esc(tipo) + '" data-comprar="' + _esc(String(comprar)) + '" data-dias="' + _esc(String(dias)) + '">Fazer pedido</button>' +
                '<button class="btn btn-ghost btn-sm" data-auto-compra="ignorar" data-tipo="' + _esc(tipo) + '">Ignorar</button>' +
              '</div>' +
            '</div>'
          );
        }).join('');
        body.querySelectorAll('button[data-auto-compra="ignorar"]').forEach(function(b) {
          b.onclick = function() {
            var t = String(b.getAttribute('data-tipo') || '').trim();
            if (!t) return;
            var cur = {};
            try { cur = JSON.parse(localStorage.getItem('AUTO_COMPRA_IGNORE') || '{}') || {}; } catch (_) { cur = {}; }
            cur[normKey(t)] = Date.now();
            try { localStorage.setItem('AUTO_COMPRA_IGNORE', JSON.stringify(cur)); } catch (_) {}
            load(hostEl);
          };
        });
        body.querySelectorAll('button[data-auto-compra="pedir"]').forEach(function(b) {
          b.onclick = function() {
            var t = String(b.getAttribute('data-tipo') || '').trim();
            var q = String(b.getAttribute('data-comprar') || '').trim();
            var d = String(b.getAttribute('data-dias') || '').trim();
            var txt = 'Compra sugerida: ' + q + ' chapas ' + t + ' (em ' + d + ' dias).';
            try { navigator.clipboard.writeText(txt).catch(function(){}); } catch (_) {}
            _toast(txt, 'var(--green)');
            try { if (typeof window.go === 'function') window.go('compras'); } catch (_) {}
          };
        });
      } catch (e) {
        body.innerHTML = '<div style="padding:12px;color:var(--red);font-size:.82rem">Erro ao calcular sugestões.</div>';
      }
    }

    window.renderPedidosRecorrentes = async function() {
      var page = document.getElementById('page-pedidos-recorrentes');
      if (!page) return;
      var body = page.querySelector('.page-body');
      if (!body) return;
      var host = document.getElementById('auto-compra-papelao-host');
      if (!host) {
        body.innerHTML = '<div id="auto-compra-papelao-host"></div>';
        host = document.getElementById('auto-compra-papelao-host');
      }
      renderHost(host, false);
    };

    window.recorrentesRecarregar = function() {
      var host = document.getElementById('auto-compra-papelao-host');
      if (host) renderHost(host, true);
    };

    function tickRec() {
      var page = document.getElementById('page-pedidos-recorrentes');
      if (page && page.style.display !== 'none') {
        try { window.renderPedidosRecorrentes(true); } catch (_) {}
      }
      var ab = document.getElementById('pcp-aba-conteudo-recorrentes');
      if (ab && ab.style.display !== 'none') {
        if (!document.getElementById('auto-compra-papelao-host-pcp')) {
          ab.innerHTML = '<div id="auto-compra-papelao-host-pcp"></div>';
          renderHost(document.getElementById('auto-compra-papelao-host-pcp'), true);
        } else {
          renderHost(document.getElementById('auto-compra-papelao-host-pcp'), false);
        }
      }
    }
    setInterval(tickRec, 1400);
    setTimeout(tickRec, 300);
  }

  function _patchEstoqueLayoutFixV1() {
    if (document.getElementById('patch-estoques-layout-fix-v1')) return;
    var st = document.createElement('style');
    st.id = 'patch-estoques-layout-fix-v1';
    st.textContent =
      '#page-dashboard-estoques,#page-estoque-tintas,#page-estoque-materiais,#page-historico-movimentos{' +
        'height:auto !important;min-height:calc(100vh - 60px) !important;' +
        'overflow-y:auto !important;overflow-x:hidden !important;' +
      '}' +
      '#page-dashboard-estoques .page-body,#page-estoque-tintas .page-body,#page-estoque-materiais .page-body,#page-historico-movimentos .page-body{' +
        'height:auto !important;min-height:0 !important;max-height:none !important;overflow:visible !important;' +
      '}' +
      '#page-dashboard-estoques *,#page-estoque-tintas *,#page-estoque-materiais *{' +
        'max-height:none !important;' +
      '}' +
      'body{' +
        'overflow-y:auto !important;' +
      '}';
    document.head.appendChild(st);
  }

  function _patchClienteAutocompleteV1() {
    if (window._patchClienteAutocompleteV1) return;
    window._patchClienteAutocompleteV1 = true;

    var getToken = function() {
      try { return String(localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { return ''; }
    };
    var hdr = function() {
      var t = getToken();
      return t ? { Authorization: 'Bearer ' + t } : {};
    };
    var norm = function(s) { return String(s || '').trim(); };
    var esc = function(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };

    function ensureBox(inputEl) {
      var box = inputEl._cliAcBox || null;
      if (box && box.parentNode) return box;
      try {
        document.querySelectorAll('.cliente-autocomplete-dropdown').forEach(function(el) {
          try { el.remove(); } catch (_) {}
        });
      } catch (_) {}
      box = document.createElement('div');
      box.className = 'cliente-autocomplete-dropdown';
      box.style.cssText =
        'position:absolute;' +
        'top:100%;left:0;right:0;z-index:99999;' +
        'background:var(--card, #1e2330);' +
        'border:1px solid var(--border, rgba(255,255,255,0.1));' +
        'border-radius:8px;' +
        'max-height:240px;overflow-y:auto;' +
        'box-shadow:0 8px 24px rgba(0,0,0,0.5);' +
        'margin-top:4px;' +
        'display:none;';
      var wrap = null;
      try { wrap = inputEl.parentElement || (inputEl.closest ? (inputEl.closest('.modal-box') || inputEl.closest('form') || inputEl.closest('.form-row') || null) : null); } catch (_) { wrap = null; }
      if (wrap) {
        try {
          var pos = '';
          try { pos = String(window.getComputedStyle(wrap).position || '').toLowerCase(); } catch (_) { pos = ''; }
          if (!pos || pos === 'static') wrap.style.position = 'relative';
        } catch (_) {}
        wrap.appendChild(box);
      } else {
        document.body.appendChild(box);
      }
      inputEl._cliAcBox = box;
      return box;
    }

    function positionBox(inputEl, box) {
      try {
        if (box && box.parentElement && inputEl && box.parentElement === inputEl.parentElement) return;
      } catch (_) {}
      var r = inputEl.getBoundingClientRect();
      var top = Math.round(r.bottom + window.scrollY + 6);
      var left = Math.round(r.left + window.scrollX);
      var w = Math.round(r.width);
      box.style.top = top + 'px';
      box.style.left = left + 'px';
      box.style.width = Math.max(240, w) + 'px';
    }

    function closeBox(inputEl) {
      var box = inputEl && inputEl._cliAcBox;
      if (box) {
        try { box.remove(); } catch (_) { try { box.style.display = 'none'; } catch (_) {} }
      }
      try { if (inputEl) inputEl._cliAcBox = null; } catch (_) {}
    }

    function renderItems(inputEl, items, onPick) {
      var box = ensureBox(inputEl);
      if (!items.length) { box.style.display = 'none'; return; }
      box.innerHTML = items.map(function(it, i) {
        return (
          '<div data-i="' + i + '" style="display:block;width:100%;box-sizing:border-box;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border, rgba(255,255,255,0.07));font-size:13px;color:var(--text, #e8eaf0);background:transparent;line-height:1.4;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
              '<div style="font-weight:900;color:var(--text1)">' + esc(it.nome || it.label || '') + '</div>' +
              (it.badge ? ('<div style="font-family:var(--mono);font-size:.72rem;color:var(--text3)">' + esc(it.badge) + '</div>') : '') +
            '</div>' +
            (it.sub ? ('<div style="margin-top:2px;color:var(--text2);font-size:.78rem">' + esc(it.sub) + '</div>') : '') +
          '</div>'
        );
      }).join('');
      positionBox(inputEl, box);
      box.style.display = 'block';
      Array.prototype.slice.call(box.querySelectorAll('[data-i]')).forEach(function(el) {
        el.onmouseenter = function() { el.style.background = 'var(--card2, #252b3b)'; };
        el.onmouseleave = function() { el.style.background = 'transparent'; };
        el.onclick = function(ev) {
          if (ev) { ev.preventDefault(); ev.stopPropagation(); }
          var idx = parseInt(String(el.getAttribute('data-i') || '0'), 10) || 0;
          var chosen = items[idx] || null;
          if (chosen) onPick(chosen);
          closeBox(inputEl);
        };
      });
    }

    function attachRemote(inputEl, opts) {
      if (!inputEl || inputEl.dataset.remoteCliAcV1 === '1') return;
      inputEl.dataset.remoteCliAcV1 = '1';

      var cfg = opts || {};
      var minLen = cfg.minLen != null ? cfg.minLen : 2;
      var limit = cfg.limit != null ? cfg.limit : 10;
      var todos = cfg.todos === true;
      var lastReq = 0;
      var lastQ = '';
      var tmr = 0;

      var fetchClientes = function(q) {
        var termo = norm(q);
        var rid = ++lastReq;
        var qs = 'q=' + encodeURIComponent(termo) + '&limit=' + encodeURIComponent(String(limit)) + '&autocomplete=true';
        if (todos) qs += '&todos=true';
        return fetch('/api/clientes?' + qs, { headers: hdr() })
          .then(function(r) { return r.json().catch(function() { return null; }); })
          .then(function(j) {
            if (rid !== lastReq) return [];
            var rows = (j && Array.isArray(j.data)) ? j.data : (Array.isArray(j) ? j : []);
            return rows.map(function(c) {
              var empBase = c?.empId ?? c?.emp_id ?? c?.empresa ?? c?.empresa_id ?? '';
              var badge = '';
              try { if (typeof window.getEmp === 'function') badge = (window.getEmp(empBase) || {}).sigla || ''; } catch (_) {}
              var sub = [c?.cidade && c?.uf ? (String(c.cidade) + '/' + String(c.uf)) : (c?.cidade || ''), c?.tel || c?.telefone || '', c?.cnpj || ''].filter(Boolean).join(' · ');
              return { id: c?.id, nome: c?.nome || c?.rs || c?.razao_social || '', sub: sub, badge: badge, raw: c };
            });
          })
          .catch(function() { return []; });
      };

      var pick = function(it) {
        try { inputEl.value = it.nome || ''; } catch (_) {}
        try { inputEl.dataset.clienteId = String(it.id || '').trim(); } catch (_) {}
        try { inputEl.dataset.clienteNome = String(it.nome || '').trim(); } catch (_) {}
        if (cfg.onPick) {
          try { cfg.onPick(it); } catch (_) {}
        }
      };

      var drive = function(ev) {
        if (ev && ev.type === 'input') {
          try { delete inputEl.dataset.clienteId; } catch (_) {}
          try { delete inputEl.dataset.clienteNome; } catch (_) {}
        }
        var q = norm(inputEl.value);
        if (q.length < minLen) { closeBox(inputEl); return; }
        if (q === lastQ) { positionBox(inputEl, ensureBox(inputEl)); return; }
        lastQ = q;
        if (tmr) clearTimeout(tmr);
        tmr = setTimeout(function() {
          fetchClientes(q).then(function(items) {
            renderItems(inputEl, items, pick);
          });
        }, 180);
      };

      if (cfg.blockExisting === true) {
        ['input','focus'].forEach(function(tp) {
          inputEl.addEventListener(tp, function(e) {
            if (e) e.stopImmediatePropagation();
            drive(e);
          }, true);
        });
      } else {
        inputEl.addEventListener('input', drive, true);
        inputEl.addEventListener('focus', drive, true);
      }

      inputEl.addEventListener('blur', function() {
        setTimeout(function() { closeBox(inputEl); }, 180);
      }, true);

      document.addEventListener('mousedown', function(ev) {
        try {
          var box = inputEl._cliAcBox;
          if (!box || box.style.display === 'none') return;
          if (ev && (ev.target === inputEl || box.contains(ev.target))) return;
          closeBox(inputEl);
        } catch (_) {}
      }, true);

      window.addEventListener('scroll', function() {
        try {
          var box = inputEl._cliAcBox;
          if (box && box.style.display !== 'none') positionBox(inputEl, box);
        } catch (_) {}
      }, true);
      window.addEventListener('resize', function() {
        try {
          var box = inputEl._cliAcBox;
          if (box && box.style.display !== 'none') positionBox(inputEl, box);
        } catch (_) {}
      });
    }

    function scan() {
      try {
        var has1 = !!document.getElementById('of-r-cliente');
        var has2 = !!document.getElementById('f-cli-search');
        if (!has1 && !has2) {
          document.querySelectorAll('.cliente-autocomplete-dropdown').forEach(function(el) {
            try { el.remove(); } catch (_) {}
          });
        }
      } catch (_) {}
      try {
        var ofRapida = document.getElementById('of-r-cliente');
        if (ofRapida) {
          attachRemote(ofRapida, { todos: true, limit: 10, minLen: 2, blockExisting: false });
        }
      } catch (_) {}

      try {
        var novaOf = document.getElementById('f-cli-search');
        var hid = document.getElementById('f-cli');
        if (novaOf) {
          attachRemote(novaOf, {
            todos: false,
            limit: 10,
            minLen: 2,
            blockExisting: true,
            onPick: function(it) {
              try { if (hid) hid.value = String(it.id || '').trim(); } catch (_) {}
              try { if (typeof window.ofCliChange === 'function') window.ofCliChange(); } catch (_) {}
            }
          });
        }
      } catch (_) {}
    }

    scan();
    var obs = new MutationObserver(function() { scan(); });
    try { obs.observe(document.body, { childList: true, subtree: true }); } catch (_) {}
  }

  function _patchApiFetchReloadClientesV1() {
    if (window._patchApiFetchReloadClientesV1) return;
    window._patchApiFetchReloadClientesV1 = true;
    var orig = window.apiFetch;
    if (typeof orig !== 'function') return;
    window.apiFetch = async function(url, opts) {
      var u = String(url || '');
      var method = String(opts?.method || 'GET').toUpperCase();
      var r = await orig.apply(this, arguments);
      try {
        if (method === 'POST' && u === '/api/clientes' && r && r.ok) {
          setTimeout(function() {
            try { window._clientesCache = null; } catch (_) {}
            try { window._clientesCarregados = false; } catch (_) {}
            try {
              var pid = String(window._PAGE_ATUAL || '').trim();
              if (pid === 'clientes' && typeof window.carregarClientes === 'function') {
                Promise.resolve(window.carregarClientes(true)).catch(function() { return window.carregarClientes(false); })
                  .then(function() { try { if (typeof window.renderClientes === 'function') window.renderClientes(); } catch (_) {} });
              }
            } catch (_) {}
          }, 60);
        }
      } catch (_) {}
      return r;
    };
  }

  function tick() {
    try { _patchClientesFiltros(); } catch (_) {}
    try { _patchHistoricoPassagensOverflow(); } catch (_) {}
    try { _removeQrChapas(); } catch (_) {}
    try { _ensurePcpActionsPanel(); } catch (_) {}
    try { _ensureImportarOfImagemButton(); } catch (_) {}
    try { _patchCompraPapelaoSugerida(); } catch (_) {}
    try { _patchEstoqueLayoutFixV1(); } catch (_) {}
    try { _patchClienteAutocompleteV1(); } catch (_) {}
    try { _patchApiFetchReloadClientesV1(); } catch (_) {}
  }

  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(tick, 250);
        setInterval(tick, 1200);
      });
    } else {
      setTimeout(tick, 250);
      setInterval(tick, 1200);
    }
  } catch (e) {
    try { console.error('[PATCH ERROR]', e); } catch (_) {}
  }
})();
