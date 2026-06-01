// DESATIVADO — substituído por CSS responsivo no patch.js
(function(){ 'use strict'; console.log('[MOBILE] mobile.js desativado — usando CSS responsivo'); return; })();
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
    '.m-card-urgente{border-left:3px solid #dc2626}' +
    '.m-card-atrasada{border-left:3px solid #f59e0b}' +
    '.m-input{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;color:#e2e8f0;font-size:16px;box-sizing:border-box;outline:none}' +
    '.m-input:focus{border-color:rgba(74,144,217,0.5)}' +
    '.m-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 18px;border-radius:10px;border:none;cursor:pointer;font-size:14px;font-weight:500;min-height:44px;transition:opacity 0.2s}' +
    '.m-btn:active{opacity:0.8}' +
    '.m-btn-primary{background:#4A90D9;color:#fff}' +
    '.m-btn-danger{background:rgba(220,38,38,0.15);color:#f43f5e;border:1px solid rgba(220,38,38,0.3)}' +
    '.m-btn-ghost{background:rgba(255,255,255,0.07);color:#94a3b8}' +
    '.m-search-wrap{position:relative;margin-bottom:12px}' +
    '.m-search-wrap svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#64748b;width:18px;height:18px}' +
    '.m-search-wrap input{padding-left:38px}' +
    '.m-section-title{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin:14px 0 8px}' +
    '.m-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px}' +
    '.m-stat{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px}' +
    '.m-stat-label{font-size:11px;color:#64748b;margin-bottom:2px}' +
    '.m-stat-val{font-size:22px;font-weight:600;color:#e2e8f0}' +
    '.m-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:12px;-webkit-overflow-scrolling:touch}' +
    '.m-chip{white-space:nowrap;padding:5px 12px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#94a3b8}' +
    '.m-chip.ativo{background:rgba(74,144,217,0.2);color:#4A90D9;border-color:rgba(74,144,217,0.4)}' +
    '.m-badge{font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;line-height:1.1}' +
    '.m-badge-danger{background:rgba(220,38,38,0.15);color:#f43f5e}' +
    '.m-badge-warning{background:rgba(245,158,11,0.15);color:#f59e0b}' +
    '.m-badge-success{background:rgba(16,185,129,0.15);color:#10b981}' +
    '.m-badge-info{background:rgba(74,144,217,0.15);color:#4A90D9}' +
    '.m-kanban{display:flex;gap:10px;overflow-x:auto;padding-bottom:16px;-webkit-overflow-scrolling:touch}' +
    '.m-kanban-col{min-width:260px;flex-shrink:0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px}' +
    '.m-kanban-col.drop-over{border-color:rgba(74,144,217,0.5);background:rgba(74,144,217,0.04)}' +
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

  var _mPcpOfs = [];

  function _mIsoToday() {
    try { return new Date().toISOString().split('T')[0]; } catch (_) { return ''; }
  }

  function _mIsLateIso(iso) {
    try {
      if (!iso) return false;
      var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
      var now = new Date();
      now.setHours(0, 0, 0, 0);
      return d < now;
    } catch (_) {
      return false;
    }
  }

  function _mFmtBRDate(iso) {
    try {
      if (!iso) return '';
      return new Date(String(iso).slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR');
    } catch (_) {
      return '';
    }
  }

  function _mOfNumero(of) {
    return of && (of.numero || of.of_num || of.of || of.num) ? String(of.numero || of.of_num || of.of || of.num) : '—';
  }

  function _mOfCliente(of) {
    return of && (of.cliente || of.cliente_nome || of.cli || of.clienteNome) ? String(of.cliente || of.cliente_nome || of.cli || of.clienteNome) : '—';
  }

  function _mOfProduto(of) {
    return of && (of.produto || of.descricao || of.prod) ? String(of.produto || of.descricao || of.prod) : '—';
  }

  function _mOfQtd(of) {
    var v = of && (of.quantidade != null ? of.quantidade : (of.qtd != null ? of.qtd : 0));
    var n = Math.trunc(Number(v) || 0);
    return String(n);
  }

  function _mOfImg(of) {
    try {
      if (!of) return '';
      if (of.imagem_url) return String(of.imagem_url);
      if (Array.isArray(of.imgs) && of.imgs.length) return String(of.imgs[0] || '');
      if (of.img) return String(of.img);
      return '';
    } catch (_) {
      return '';
    }
  }

  Paginas.hub = async function(container) {
    container.innerHTML = '<div id=\"m-ptr-inner\"></div>';
    try {
      var d = await api('/api/ofs?limit=10&order_by=created_at&order=desc&lite=1');
      var ofs = d && (d.data || d.ofs) ? (d.data || d.ofs) : [];
      ofs = Array.isArray(ofs) ? ofs : [];
      var atrasadas = ofs.filter(function(o) { return !!(o && o.data_entrega && _mIsLateIso(o.data_entrega)); }).length;
      var urgentes = ofs.filter(function(o) { return !!(o && (o.urgente || o.urg)); }).length;

      var passagens = [];
      try {
        var dp = await api('/api/passagens/hoje?periodo=hoje');
        passagens = dp && Array.isArray(dp.passagens) ? dp.passagens : [];
      } catch (_) { passagens = []; }

      container.innerHTML =
        '<div class=\"m-stats\">' +
          '<div class=\"m-stat\"><div class=\"m-stat-label\">OFs abertas</div><div class=\"m-stat-val\">' + (d && d.total ? String(d.total) : String(ofs.length)) + '</div></div>' +
          '<div class=\"m-stat\" style=\"border-color:rgba(220,38,38,0.3)\"><div class=\"m-stat-label\">Atrasadas</div><div class=\"m-stat-val\" style=\"color:#f43f5e\">' + atrasadas + '</div></div>' +
          '<div class=\"m-stat\" style=\"border-color:rgba(245,158,11,0.3)\"><div class=\"m-stat-label\">Urgentes</div><div class=\"m-stat-val\" style=\"color:#f59e0b\">' + urgentes + '</div></div>' +
          '<div class=\"m-stat\" style=\"border-color:rgba(16,185,129,0.3)\"><div class=\"m-stat-label\">Passagens hoje</div><div class=\"m-stat-val\" style=\"color:#10b981\">' + passagens.length + '</div></div>' +
        '</div>' +
        '<div class=\"m-section-title\">Ações rápidas</div>' +
        '<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px\">' +
          '<button class=\"m-btn m-btn-primary\" onclick=\"mIrPara(\'pcp\')\" style=\"width:100%;justify-content:center\">PCP</button>' +
          '<button class=\"m-btn m-btn-ghost\" onclick=\"mIrPara(\'ofmaq\')\" style=\"width:100%;justify-content:center\">OFs por Máquina</button>' +
          '<button class=\"m-btn m-btn-ghost\" onclick=\"mAbrirOfRapida()\" style=\"width:100%;justify-content:center;grid-column:1/-1\">+ OF Rápida</button>' +
        '</div>' +
        '<div class=\"m-section-title\">Passagens de hoje (' + passagens.length + ')</div>' +
        (!passagens.length
          ? '<div style=\"color:#64748b;font-size:13px;text-align:center;padding:16px\">Nenhuma passagem hoje.</div>'
          : passagens.slice(0, 5).map(function(p) {
              var hora = '';
              try {
                if (p && p.hora_passagem) hora = new Date(p.hora_passagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              } catch (_) { hora = ''; }
              return '<div class=\"m-card\" style=\"display:flex;align-items:center;gap:10px;padding:10px 12px\">' +
                '<span style=\"font-weight:700;color:#10b981;min-width:50px;font-size:13px\">OF #' + (p && (p.of_numero || p.of || p.numero) ? String(p.of_numero || p.of || p.numero) : '—') + '</span>' +
                '<span style=\"color:#e2e8f0;flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">' + (p && (p.cliente || p.cliente_nome) ? String(p.cliente || p.cliente_nome) : '—') + '</span>' +
                '<span style=\"color:#64748b;font-size:12px\">' + hora + '</span>' +
              '</div>';
            }).join('')
        );
    } catch (e) {
      container.innerHTML = '<div style=\"color:#f43f5e;text-align:center;padding:30px\">Erro ao carregar hub.</div>';
    }
  };

  Paginas.pcp = async function(container) {
    container.innerHTML =
      '<div class=\"m-search-wrap\">' +
        '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"/></svg>' +
        '<input class=\"m-input\" id=\"m-pcp-busca\" placeholder=\"Buscar OF, cliente, vendedor...\" oninput=\"mPcpFiltrar(this.value)\">' +
      '</div>' +
      '<div class=\"m-chips\" id=\"m-pcp-status-chips\">' +
        ['Todos','Em aberto','Em produção','Urgente','Atrasada'].map(function(s, i) {
          return '<div class="m-chip' + (i === 0 ? ' ativo' : '') + '" onclick="mPcpFiltrarStatus(this,&quot;' + s + '&quot;)">' + s + '</div>';
        }).join('') +
      '</div>' +
      '<div id=\"m-pcp-lista\"><div class=\"m-skeleton\" style=\"height:80px;margin-bottom:10px\"></div><div class=\"m-skeleton\" style=\"height:80px\"></div></div>';

    await mPcpCarregar();
  };

  async function mPcpCarregar(busca) {
    try {
      var params = '?limit=50&order_by=created_at&order=desc';
      if (busca) params += '&busca=' + encodeURIComponent(String(busca));
      var d = await api('/api/ofs' + params);
      _mPcpOfs = d && (d.data || d.ofs) ? (d.data || d.ofs) : [];
      _mPcpOfs = Array.isArray(_mPcpOfs) ? _mPcpOfs : [];
      mPcpRenderizar();
    } catch (e) {
      _mPcpOfs = [];
      mPcpRenderizar();
    }
  }

  window.mPcpFiltrar = function(v) {
    try { clearTimeout(window._mPcpBuscaTimeout); } catch (_) {}
    window._mPcpBuscaTimeout = setTimeout(function() { mPcpCarregar(v); }, 350);
  };

  window.mPcpFiltrarStatus = function(chip, status) {
    try {
      var chips = document.querySelectorAll('#m-pcp-status-chips .m-chip');
      for (var i = 0; i < chips.length; i++) chips[i].classList.remove('ativo');
      if (chip && chip.classList) chip.classList.add('ativo');
    } catch (_) {}
    mPcpRenderizar(status);
  };

  function mPcpRenderizar(statusFiltro) {
    var lista = document.getElementById('m-pcp-lista');
    if (!lista) return;
    var ofs = Array.isArray(_mPcpOfs) ? _mPcpOfs.slice() : [];
    if (statusFiltro && statusFiltro !== 'Todos') {
      ofs = ofs.filter(function(o) {
        if (!o) return false;
        if (statusFiltro === 'Urgente') return !!(o.urgente || o.urg);
        if (statusFiltro === 'Atrasada') return !!(o.data_entrega && _mIsLateIso(o.data_entrega));
        return String(o.status || '').toLowerCase().indexOf(String(statusFiltro).toLowerCase()) >= 0;
      });
    }
    if (!ofs.length) {
      lista.innerHTML = '<div style=\"color:#64748b;text-align:center;padding:30px;font-size:14px\">Nenhuma OF encontrada.</div>';
      return;
    }
    lista.innerHTML = ofs.map(function(of) {
      var urg = !!(of && (of.urgente || of.urg));
      var late = !!(of && of.data_entrega && _mIsLateIso(of.data_entrega));
      var img = _mOfImg(of);
      var entrega = of && of.data_entrega ? _mFmtBRDate(of.data_entrega) : '';
      var id = of && of.id ? String(of.id) : '';
      var num = _mOfNumero(of);
      var cliente = _mOfCliente(of);
      var prod = _mOfProduto(of);
      var qtd = _mOfQtd(of);
      var st = of && of.status ? String(of.status) : '—';
      return '<div class=\"m-card' + (urg ? ' m-card-urgente' : (late ? ' m-card-atrasada' : '')) + '\" data-of-id=\"' + String(id).replace(/\"/g, '&quot;') + '\" onclick=\"mAbrirOf(this.getAttribute(&quot;data-of-id&quot;))\">' +
        '<div style=\"display:flex;gap:10px;align-items:flex-start\">' +
          (img ? '<img src=\"' + String(img).replace(/\"/g, '&quot;') + '\" style=\"width:52px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1px solid rgba(255,255,255,0.1)\">' : '') +
          '<div style=\"flex:1;min-width:0\">' +
            '<div style=\"display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap\">' +
              '<span style=\"font-weight:700;color:#4A90D9;font-size:14px\">Nº ' + num + '</span>' +
              (urg ? '<span class=\"m-badge m-badge-danger\">URGENTE</span>' : '') +
              (late ? '<span class=\"m-badge m-badge-warning\">ATRASADA</span>' : '') +
              '<span class=\"m-badge m-badge-info\" style=\"margin-left:auto\">' + st + '</span>' +
            '</div>' +
            '<div style=\"color:#e2e8f0;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">' + cliente + '</div>' +
            '<div style=\"color:#94a3b8;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">' + prod + '</div>' +
            '<div style=\"display:flex;gap:10px;margin-top:6px;font-size:11px;color:#64748b\">' +
              '<span>' + qtd + ' cx</span>' +
              (entrega ? '<span style=\"color:' + (late ? '#f59e0b' : '#64748b') + '\">Entrega: ' + entrega + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  Paginas.ofmaq = async function(container) {
    container.innerHTML = '<div style=\"color:#64748b;text-align:center;padding:20px\">Carregando OFs por máquina...</div>';
    try {
      var hoje = _mIsoToday();
      var d = await api('/api/ofs?limit=500&lite=1&from=' + encodeURIComponent(hoje) + '&date_field=data_entrega');
      var ofs = d && (d.data || d.ofs) ? (d.data || d.ofs) : [];
      ofs = Array.isArray(ofs) ? ofs : [];

      var grupos = {};
      ofs.forEach(function(of) {
        if (!of) return;
        var fluxo = Array.isArray(of.fluxo_maquinas) ? of.fluxo_maquinas : [];
        var idxM = parseInt(of.maquina_atual_index, 10);
        if (!Number.isFinite(idxM)) idxM = 0;
        var maq = of.maq || of.maquina_atual || fluxo[idxM] || 'Sem Máquina';
        maq = String(maq || '').trim() || 'Sem Máquina';
        if (!grupos[maq]) grupos[maq] = [];
        grupos[maq].push(of);
      });

      var maquinas = Object.keys(grupos).sort();
      if (!maquinas.length) {
        container.innerHTML = '<div style=\"color:#64748b;text-align:center;padding:30px\">Nenhuma OF para hoje.</div>';
        return;
      }

      var html = '<div class=\"m-kanban\">';
      maquinas.forEach(function(maq) {
        var ofsM = grupos[maq] || [];
        var colId = 'mkb-' + String(maq).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        html += '<div class=\"m-kanban-col\" id=\"' + colId + '\" data-maq=\"' + String(maq).replace(/\"/g, '&quot;') + '\">';
        html += '<div style=\"font-weight:600;color:#e2e8f0;font-size:13px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between\">' +
          '<span>' + String(maq).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>' +
          '<span class=\"m-badge m-badge-info\">' + ofsM.length + '</span>' +
        '</div>';
        ofsM.forEach(function(of, idx) {
          var urg = !!(of && (of.urgente || of.urg));
          var late = !!(of && of.data_entrega && _mIsLateIso(of.data_entrega));
          var img = _mOfImg(of);
          var id = of && of.id ? String(of.id) : '';
          var num = _mOfNumero(of);
          var cli = _mOfCliente(of);
          var qtd = _mOfQtd(of);
          html += '<div class=\"m-card' + (urg ? ' m-card-urgente' : (late ? ' m-card-atrasada' : '')) + '\" draggable=\"true\" data-of-id=\"' + id.replace(/\"/g, '&quot;') + '\" data-maq=\"' + String(maq).replace(/\"/g, '&quot;') + '\" style=\"padding:10px;margin-bottom:6px\">' +
            '<div style=\"display:flex;gap:8px;align-items:flex-start\">' +
              '<div style=\"width:22px;height:22px;border-radius:50%;background:rgba(74,144,217,0.2);color:#4A90D9;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0\">' + (idx + 1) + '</div>' +
              (img
                ? '<img src=\"' + String(img).replace(/\"/g, '&quot;') + '\" data-img=\"' + String(img).replace(/\"/g, '&quot;') + '\" onclick=\"mAbrirImagem(this.getAttribute(&quot;data-img&quot;))\" style=\"width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid rgba(255,255,255,0.1);cursor:pointer\">'
                : '<div style=\"width:44px;height:44px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);flex-shrink:0\">?</div>') +
              '<div style=\"flex:1;min-width:0\">' +
                '<div style=\"font-weight:700;color:#4A90D9;font-size:12px\">Nº ' + num + (urg ? ' <span style=\"background:rgba(220,38,38,0.2);color:#f43f5e;font-size:9px;padding:1px 4px;border-radius:3px\">URG</span>' : '') + '</div>' +
                '<div style=\"color:#e2e8f0;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">' + cli.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>' +
                '<div style=\"color:#94a3b8;font-size:11px\">' + qtd + ' cx</div>' +
              '</div>' +
            '</div>' +
            '<div style=\"text-align:right;margin-top:8px\">' +
              '<button data-of-id=\"' + id.replace(/\"/g, '&quot;') + '\" data-of-num=\"' + String(num).replace(/\"/g, '&quot;') + '\" onclick=\"mAcoesOf(this.getAttribute(&quot;data-of-id&quot;),this.getAttribute(&quot;data-of-num&quot;))\" style=\"background:rgba(255,255,255,0.07);color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px\">Ações ▾</button>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      });
      html += '</div>';
      container.innerHTML = html;
      mBindKanbanDrag();
    } catch (e) {
      container.innerHTML = '<div style=\"color:#f43f5e;text-align:center;padding:30px\">Erro ao carregar OFs por máquina.</div>';
    }
  };

  function mBindKanbanDrag() {
    var dragEl = null;
    var cards = document.querySelectorAll('.m-kanban-col .m-card[draggable]');
    for (var i = 0; i < cards.length; i++) {
      (function(card) {
        card.addEventListener('dragstart', function() {
          dragEl = card;
          setTimeout(function() { try { card.style.opacity = '0.3'; } catch (_) {} }, 0);
        });
        card.addEventListener('dragend', function() {
          try { card.style.opacity = ''; } catch (_) {}
          dragEl = null;
        });
      })(cards[i]);
    }

    var cols = document.querySelectorAll('.m-kanban-col');
    for (var j = 0; j < cols.length; j++) {
      (function(col) {
        col.addEventListener('dragover', function(e) { e.preventDefault(); col.classList.add('drop-over'); });
        col.addEventListener('dragleave', function() { col.classList.remove('drop-over'); });
        col.addEventListener('drop', function(e) {
          e.preventDefault();
          col.classList.remove('drop-over');
          if (!dragEl) return;
          var maqDest = String(col.getAttribute('data-maq') || '').trim();
          var maqOrig = String(dragEl.getAttribute('data-maq') || '').trim();
          try { col.appendChild(dragEl); } catch (_) {}
          try { dragEl.style.opacity = ''; } catch (_) {}
          try { dragEl.setAttribute('data-maq', maqDest); } catch (_) {}

          try {
            var ids = Array.prototype.slice.call(col.querySelectorAll('[data-of-id]')).map(function(c) { return c.getAttribute('data-of-id'); }).filter(Boolean);
            fetch('/api/ofs/reordenar', { method: 'POST', headers: authH(), body: JSON.stringify({ ordem: ids, maquina_id: maqDest }) });
          } catch (_) {}
          try {
            var ofId = String(dragEl.getAttribute('data-of-id') || '').trim();
            if (maqOrig !== maqDest && ofId) fetch('/api/ofs/' + encodeURIComponent(ofId), { method: 'PATCH', headers: authH(), body: JSON.stringify({ maquina_atual: maqDest }) });
          } catch (_) {}
          dragEl = null;
        });
      })(cols[j]);
    }
  }

  window.mAbrirOf = function(id) {
    try {
      if (typeof window.abrirDetalheOf === 'function') return window.abrirDetalheOf(id);
      if (typeof window.verOf === 'function') return window.verOf(id);
    } catch (_) {}
    try { window.mIrPara('pcp'); } catch (_) {}
  };

  window.mAcoesOf = function(ofId, ofNum) {
    try {
      if (typeof window.abrirBottomSheetAcoes === 'function') window.abrirBottomSheetAcoes(ofId, ofNum);
    } catch (_) {}
  };

  window.mAbrirImagem = function(url) {
    var old = document.getElementById('m-lightbox');
    if (old) old.remove();
    var div = document.createElement('div');
    div.id = 'm-lightbox';
    div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:20000;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
    div.innerHTML = '<img src=\"' + String(url || '').replace(/\"/g, '&quot;') + '\" style=\"max-width:95vw;max-height:95vh;object-fit:contain;border-radius:8px\">';
    div.addEventListener('click', function() { div.remove(); });
    document.body.appendChild(div);
  };

  window.mAbrirOfRapida = function() {
    try { if (typeof window.abrirNovaOfRapida === 'function') window.abrirNovaOfRapida(); } catch (_) {}
  };

  ['clientes','estoque','orcamentos','dashboard','agenda','chat','historico-passagens','amostras','pedidos-recorrentes'].forEach(function(pag) {
    Paginas[pag] = function(container) {
      container.innerHTML = '<div style=\"text-align:center;padding:20px;color:#64748b\"><p style=\"font-size:13px;margin-bottom:12px\">Carregando...</p></div>';
      setTimeout(function() { try { if (typeof window.go === 'function') window.go(pag); } catch (_) {} }, 100);
    };
  });

  async function verificarNotificacoes() {
    try {
      var d = await api('/api/chat/nao-lidas');
      var badge = document.getElementById('m-chat-badge');
      if (!badge) return;
      var total = Math.trunc(Number(d && d.total || 0) || 0);
      if (total > 0) {
        badge.style.display = 'flex';
        badge.textContent = total > 9 ? '9+' : String(total);
      } else {
        badge.style.display = 'none';
      }
    } catch (_) {}
  }

  window.mIrPara = function(pag) {
    criarAppShell();
    State.paginaAtual = pag;
    setActiveNav(pag);
    setHeaderTitle(pag);
    var content = document.getElementById('m-content');
    if (!content) return;
    renderLoading(content);
    if (Paginas[pag]) {
      try {
        var p = Paginas[pag](content);
        if (p && typeof p.then === 'function') {
          p.catch(function() { renderFallback(content, pag); });
        }
      } catch (e) { renderFallback(content, pag); }
    } else {
      renderFallback(content, pag);
    }
  };

  window.mToggleDrawer = function() {
    var d = document.getElementById('m-drawer');
    if (d) d.classList.toggle('aberto');
  };

  function init() {
    var tent = 0;
    var tmr = setInterval(function() {
      tent++;
      var ready = !!(window.CURRENT_USER || window._currentUser);
      if (ready || tent > 20) {
        clearInterval(tmr);
        criarAppShell();
        try { window.mIrPara('hub'); } catch (_) {}
        try { verificarNotificacoes(); } catch (_) {}
        try { setInterval(function() { verificarNotificacoes(); }, 30000); } catch (_) {}
        try { console.log('[MOBILE] Interface mobile iniciada'); } catch (_) {}
      }
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 200);
  }

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
