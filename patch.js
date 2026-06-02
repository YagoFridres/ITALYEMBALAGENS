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
    max-width: 100vw !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
  }

  /* Todas as pages sem overflow lateral */
  [id^="page-"], .page, [data-page] {
    max-width: 100vw !important;
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

  body {
    overflow-x: hidden !important;
    padding-bottom: 64px !important;
    width: 100% !important;
    max-width: 100vw !important;
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
    max-width: 100vw !important;
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
    width: 100vw !important;
    max-width: 100vw !important;
    min-width: 0 !important;
    overflow-x: hidden !important;
    position: relative !important;
    left: 0 !important;
  }

  section, [id^="page-"], .page,
  [data-page], .tab-content {
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .top-bar, #top-bar, .header-bar,
  [class*="top-bar"], [class*="header-bar"],
  header, #header {
    padding: 6px 10px !important;
    flex-wrap: wrap !important;
    gap: 4px !important;
    width: 100% !important;
    max-width: 100vw !important;
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
    max-width: 100vw !important;
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
    max-width: 100vw !important;
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
    var base = ['hub', 'pcp', 'ofmaq'];
    var extra = 'estoque';
    try {
      var salvo = localStorage.getItem('hotbar_config');
      if (salvo) {
        var arr = JSON.parse(salvo);
        if (Array.isArray(arr)) {
          arr = arr.map(function(x){ return String(x||'').trim(); }).filter(Boolean);
          for (var i = 0; i < arr.length; i++) {
            var it = arr[i];
            if (base.indexOf(it) !== -1) continue;
            if (_isValidPageId(it)) { extra = it; break; }
          }
        }
      }
    } catch(e) {}
    var out = base.slice();
    if (extra && out.indexOf(extra) === -1 && _isValidPageId(extra)) out.push(extra);
    return out.slice(0, 4);
  }

  function salvarHotbarConfig(ids) {
    var base = ['hub', 'pcp', 'ofmaq'];
    var arr = Array.isArray(ids) ? ids.map(function(x){ return String(x||'').trim(); }).filter(Boolean) : [];
    var extra = '';
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i];
      if (base.indexOf(it) !== -1) continue;
      if (_isValidPageId(it)) { extra = it; break; }
    }
    var out = base.slice();
    if (extra && out.indexOf(extra) === -1) out.push(extra);
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
      var on = (aba.id === 'orcamentos' || aba.id === 'comissoes')
        ? 'goFinanceiro(&quot;' + aba.id + '&quot;)'
        : 'go(&quot;' + aba.id + '&quot;)';
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
  function patchAbrirOfRapida() { 
    if (window.abrirNovaOfRapida && !window.abrirNovaOfRapida._patched) { 
      _fnOrigOfRapida = window.abrirNovaOfRapida; 
      window.abrirNovaOfRapida = function() { 
        if (typeof _fnOrigOfRapida === 'function') _fnOrigOfRapida.apply(this, arguments); 
        setTimeout(function() { 
          var el = document.getElementById('of-r-numero'); 
          if (!el) { 
            console.warn('[PATCH] #of-r-numero nao encontrado apos abrir modal'); 
            return; 
          } 
          if (el.tagName === 'INPUT') { el.value = '...'; el.disabled = true; } 
          else el.textContent = '...'; 
          window.proximoNumeroOf().then(function(num) { 
            window._ofRapidaNumero = num; 
            if (el.tagName === 'INPUT') { el.value = num; el.disabled = false; } 
            else el.textContent = num; 
            console.log('[PATCH] OF Rapida numero injetado:', num); 
          }); 
        }, 150); 
      }; 
      window.abrirNovaOfRapida._patched = true; 
      console.log('[PATCH] abrirNovaOfRapida interceptada'); 
    } 
  } 
 
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
  patchAbrirOfRapida(); 
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
      if (window.abrirNovaOfRapida && !window.abrirNovaOfRapida._patched) { 
        console.log('[PATCH] abrirNovaOfRapida foi sobrescrita! Reaplicando...'); 
        patchAbrirOfRapida(); 
      } 
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
    max-width: 100vw !important;
    box-sizing: border-box !important;
  }
  [id^="page-"] {
    max-width: 100vw !important;
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
