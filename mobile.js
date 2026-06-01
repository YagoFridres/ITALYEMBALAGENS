/* mobile.js — Italy Embalagens ERP
   Interface mobile completa. Ativa apenas em dispositivos <= 768px.
   Desktop não é afetado. Mesmas APIs, mesmos dados, mesma autenticação. */

(function() {
  'use strict';

  var isMobile = window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (!isMobile) {
    console.log('[MOBILE] Dispositivo desktop detectado — interface desktop ativa');
    return;
  }

  console.log('[MOBILE] Dispositivo móvel detectado — ativando interface mobile');

  function getToken() {
    try {
      return localStorage.getItem('token') || sessionStorage.getItem('token') ||
        localStorage.getItem('access_token') || '';
    } catch (e) {
      try { return sessionStorage.getItem('token') || ''; } catch (_) { return ''; }
    }
  }

  function authH() {
    var t = getToken();
    return t
      ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }

  async function api(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({}, authH(), opts.headers || {});
    var full = String(url || '');
    full = full + (full.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
    var r = await fetch(full, opts);
    return r.json();
  }

  var State = {
    paginaAtual: 'hub',
    usuario: window.CURRENT_USER || {},
    ofs: [],
    ofsFiltradas: [],
    filtroOfs: { busca: '', status: '', maquina: '' },
    loading: false
  };

  var css =
    'body{overflow-x:hidden!important}' +
    '.sidebar,#sidebar,[class*=\"sidebar\"],.side-nav,nav.side,.nav-lateral{display:none!important}' +
    '.main-content,#main-content,[class*=\"main-content\"],.page-content,.content-area{margin-left:0!important;padding:0!important;width:100%!important;max-width:100%!important}' +
    '.top-bar,.header,#header,[class*=\"top-bar\"],[class*=\"header-desktop\"]{display:none!important}' +
    '#m-app{position:fixed;inset:0;z-index:10000;background:#080c14;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;-webkit-font-smoothing:antialiased}' +
    '#m-header{background:#0b1220;border-bottom:1px solid rgba(255,255,255,0.08);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;min-height:52px}' +
    '#m-content{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:12px;padding-bottom:80px}' +
    '#m-nav{position:fixed;bottom:0;left:0;right:0;background:#0b1220;border-top:1px solid rgba(255,255,255,0.08);display:flex;z-index:10001;height:58px}' +
    '.m-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;background:none;border:none;color:#64748b;font-size:10px;padding:6px 4px;transition:color 0.2s}' +
    '.m-nav-btn.ativo{color:#4A90D9}' +
    '.m-nav-btn svg{width:22px;height:22px}' +
    '#m-drawer{position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,0.6);display:none}' +
    '#m-drawer.aberto{display:block}' +
    '#m-drawer-panel{position:absolute;left:0;top:0;bottom:0;width:80%;max-width:300px;background:#0b1220;border-right:1px solid rgba(255,255,255,0.1);overflow-y:auto;padding:20px 0}' +
    '.m-drawer-item{padding:12px 20px;color:#94a3b8;font-size:14px;display:flex;align-items:center;gap:10px;cursor:pointer}' +
    '.m-drawer-item:hover{background:rgba(255,255,255,0.04);color:#e2e8f0}' +
    '.m-drawer-item.ativo{color:#4A90D9;background:rgba(74,144,217,0.08)}' +
    '.m-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;margin-bottom:10px}' +
    '.m-input{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;color:#e2e8f0;font-size:16px;box-sizing:border-box;outline:none}' +
    '.m-input:focus{border-color:rgba(74,144,217,0.5)}' +
    '.m-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 18px;border-radius:10px;border:none;cursor:pointer;font-size:14px;font-weight:500;min-height:44px;transition:opacity 0.2s}' +
    '.m-btn:active{opacity:0.8}' +
    '.m-btn-primary{background:#4A90D9;color:#fff}' +
    '.m-btn-ghost{background:rgba(255,255,255,0.07);color:#94a3b8}' +
    '#m-ptr{text-align:center;color:#64748b;font-size:12px;padding:8px;display:none}' +
    '.m-skeleton{background:linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:m-shimmer 1.5s infinite;border-radius:8px}' +
    '@keyframes m-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';

  function criarAppShell() {
    if (document.getElementById('m-app')) return;
    if (!document.getElementById('m-css')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'm-css';
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    var app = document.createElement('div');
    app.id = 'm-app';
    app.innerHTML =
      '<div id=\"m-header\">' +
        '<button onclick=\"mToggleDrawer()\" style=\"background:none;border:none;color:#e2e8f0;padding:4px;cursor:pointer\">' +
          '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" width=\"24\" height=\"24\">' +
            '<line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"/>' +
            '<line x1=\"3\" y1=\"12\" x2=\"21\" y2=\"12\"/>' +
            '<line x1=\"3\" y1=\"18\" x2=\"21\" y2=\"18\"/>' +
          '</svg>' +
        '</button>' +
        '<div style=\"display:flex;align-items:center;gap:8px\">' +
          '<span id=\"m-header-titulo\" style=\"color:#e2e8f0;font-weight:600;font-size:15px\">Italy ERP</span>' +
        '</div>' +
        '<div style=\"display:flex;align-items:center;gap:8px\">' +
          '<div id=\"m-notif-btn\" onclick=\"mIrPara(\'chat\')\" style=\"position:relative;cursor:pointer\">' +
            '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#94a3b8\" stroke-width=\"2\" width=\"22\" height=\"22\">' +
              '<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/>' +
            '</svg>' +
            '<div id=\"m-chat-badge\" style=\"display:none;position:absolute;top:-3px;right:-3px;width:16px;height:16px;border-radius:50%;background:#dc2626;color:#fff;font-size:9px;font-weight:700;align-items:center;justify-content:center\"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id=\"m-ptr\">↓ Solte para atualizar</div>' +
      '<div id=\"m-content\"></div>' +
      '<nav id=\"m-nav\">' +
        '<button class=\"m-nav-btn ativo\" data-pag=\"hub\" onclick=\"mIrPara(\'hub\')\">' +
          '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">' +
            '<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\"/>' +
            '<rect x=\"14\" y=\"3\" width=\"7\" height=\"7\"/>' +
            '<rect x=\"14\" y=\"14\" width=\"7\" height=\"7\"/>' +
            '<rect x=\"3\" y=\"14\" width=\"7\" height=\"7\"/>' +
          '</svg>' +
          'Hub' +
        '</button>' +
        '<button class=\"m-nav-btn\" data-pag=\"pcp\" onclick=\"mIrPara(\'pcp\')\">' +
          '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">' +
            '<path d=\"M9 11l3 3L22 4\"/>' +
            '<path d=\"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11\"/>' +
          '</svg>' +
          'PCP' +
        '</button>' +
        '<button class=\"m-nav-btn\" data-pag=\"ofmaq\" onclick=\"mIrPara(\'ofmaq\')\">' +
          '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">' +
            '<rect x=\"2\" y=\"7\" width=\"20\" height=\"14\" rx=\"2\"/>' +
            '<path d=\"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\"/>' +
          '</svg>' +
          'Máquinas' +
        '</button>' +
        '<button class=\"m-nav-btn\" data-pag=\"mais\" onclick=\"mToggleDrawer()\">' +
          '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">' +
            '<circle cx=\"12\" cy=\"12\" r=\"1\"/>' +
            '<circle cx=\"19\" cy=\"12\" r=\"1\"/>' +
            '<circle cx=\"5\" cy=\"12\" r=\"1\"/>' +
          '</svg>' +
          'Mais' +
        '</button>' +
      '</nav>';
    document.body.appendChild(app);

    var drawer = document.createElement('div');
    drawer.id = 'm-drawer';
    drawer.innerHTML =
      '<div id=\"m-drawer-panel\">' +
        '<div style=\"padding:16px 20px 8px;border-bottom:1px solid rgba(255,255,255,0.07);margin-bottom:8px\">' +
          '<div style=\"color:#e2e8f0;font-weight:700;font-size:16px\">Menu</div>' +
          '<div id=\"m-drawer-usuario\" style=\"color:#64748b;font-size:12px;margin-top:2px\"></div>' +
        '</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'hub\');mToggleDrawer()\">Hub Inicial</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'pcp\');mToggleDrawer()\">PCP / Programação</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'ofmaq\');mToggleDrawer()\">OFs por Máquina</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'clientes\');mToggleDrawer()\">Clientes</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'estoque\');mToggleDrawer()\">Estoque</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'orcamentos\');mToggleDrawer()\">Orçamentos</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'dashboard\');mToggleDrawer()\">Dashboard</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'agenda\');mToggleDrawer()\">Agenda</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'historico-passagens\');mToggleDrawer()\">Histórico Passagens</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'chat\');mToggleDrawer()\">Chat</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'amostras\');mToggleDrawer()\">Amostras</div>' +
        '<div class=\"m-drawer-item\" onclick=\"mIrPara(\'pedidos-recorrentes\');mToggleDrawer()\">Pedidos Recorrentes</div>' +
        '<div style=\"padding:20px 20px 0;border-top:1px solid rgba(255,255,255,0.07);margin-top:8px\">' +
          '<div class=\"m-drawer-item\" style=\"color:#f43f5e\" onclick=\"if(typeof logout===\'function\')logout()\">Sair</div>' +
        '</div>' +
      '</div>';
    drawer.addEventListener('click', function(e) { if (e.target === drawer) window.mToggleDrawer(); });
    document.body.appendChild(drawer);

    var u = window.CURRENT_USER || {};
    var dEl = document.getElementById('m-drawer-usuario');
    if (dEl) dEl.textContent = u.nome || u.email || 'Usuário';
  }

  var Paginas = {};

  function setHeaderTitle(pag) {
    var titulos = {
      hub: 'Hub Inicial',
      pcp: 'PCP / Programação',
      ofmaq: 'OFs por Máquina',
      clientes: 'Clientes',
      estoque: 'Estoque',
      orcamentos: 'Orçamentos',
      dashboard: 'Dashboard',
      agenda: 'Agenda',
      chat: 'Chat',
      'historico-passagens': 'Histórico de Passagens',
      amostras: 'Amostras',
      'pedidos-recorrentes': 'Pedidos Recorrentes'
    };
    var tEl = document.getElementById('m-header-titulo');
    if (tEl) tEl.textContent = titulos[pag] || pag;
  }

  function setActiveNav(pag) {
    var btns = document.querySelectorAll('.m-nav-btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      b.classList.toggle('ativo', b.getAttribute('data-pag') === pag);
    }
    var items = document.querySelectorAll('.m-drawer-item');
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      var on = String(it.getAttribute('onclick') || '');
      it.classList.toggle('ativo', on.indexOf("mIrPara('" + pag + "')") >= 0);
    }
  }

  function renderLoading(content) {
    content.innerHTML =
      '<div style=\"padding:8px\">' +
        '<div class=\"m-card\"><div class=\"m-skeleton\" style=\"height:20px;margin-bottom:8px\"></div><div class=\"m-skeleton\" style=\"height:14px;width:70%\"></div></div>' +
        '<div class=\"m-card\"><div class=\"m-skeleton\" style=\"height:20px;margin-bottom:8px\"></div><div class=\"m-skeleton\" style=\"height:14px;width:60%\"></div></div>' +
        '<div class=\"m-card\"><div class=\"m-skeleton\" style=\"height:20px;margin-bottom:8px\"></div><div class=\"m-skeleton\" style=\"height:14px;width:80%\"></div></div>' +
      '</div>';
  }

  function renderFallback(content, pag) {
    content.innerHTML =
      '<div style=\"padding:20px;text-align:center;color:#64748b\">' +
        '<p style=\"font-size:14px\">Carregando ' + String(pag || '') + '...</p>' +
      '</div>';
    setTimeout(function() {
      try { if (typeof window.go === 'function') window.go(pag); } catch (e) {}
    }, 250);
  }

  Paginas.hub = function(content) {
    var u = window.CURRENT_USER || {};
    content.innerHTML =
      '<div class=\"m-card\">' +
        '<div style=\"color:#64748b;font-size:12px\">Usuário</div>' +
        '<div style=\"color:#e2e8f0;font-weight:700;font-size:16px;margin-top:4px\">' + (u.nome || u.email || 'Usuário') + '</div>' +
      '</div>' +
      '<div class=\"m-card\">' +
        '<button class=\"m-btn m-btn-primary\" style=\"width:100%\" onclick=\"mIrPara(\'pcp\')\">Abrir PCP</button>' +
      '</div>';
  };

  window.mIrPara = function(pag) {
    criarAppShell();
    State.paginaAtual = pag;
    setActiveNav(pag);
    setHeaderTitle(pag);
    var content = document.getElementById('m-content');
    if (!content) return;
    renderLoading(content);
    if (Paginas[pag]) {
      try { Paginas[pag](content); } catch (e) { renderFallback(content, pag); }
    } else {
      renderFallback(content, pag);
    }
  };

  window.mToggleDrawer = function() {
    var d = document.getElementById('m-drawer');
    if (d) d.classList.toggle('aberto');
  };

  criarAppShell();
  try { window.mIrPara('hub'); } catch (e) {}

  try {
    var lastW = window.innerWidth;
    window.addEventListener('resize', function() {
      var now = window.innerWidth;
      if (lastW <= 768 && now > 900) {
        try { location.reload(); } catch (_) {}
      }
      lastW = now;
    });
  } catch (e) {}

  try { window.__mobileApi = api; } catch (e) {}
})();
