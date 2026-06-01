/* patch.js - Italy Embalagens ERP v2 */ 
(function() { 
  'use strict'; 

  try {
    var styleEl = document.getElementById('patch-mobile-css');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'patch-mobile-css';
      styleEl.textContent =
        '@media (max-width: 768px){' +
        '.tabela-ofs thead{display:none !important;}' +
        '.tabela-ofs tr{display:block !important;background:rgba(255,255,255,0.03) !important;border:1px solid rgba(255,255,255,0.08) !important;border-radius:10px !important;margin-bottom:10px !important;padding:12px !important;}' +
        '.tabela-ofs td{display:flex !important;justify-content:space-between !important;align-items:center !important;padding:4px 0 !important;border:none !important;font-size:13px !important;}' +
        '.tabela-ofs td::before{content:attr(data-label);font-weight:600;color:#64748b;margin-right:8px;flex-shrink:0;}' +
        '.modal-content,[class*=\"modal-body\"],[id*=\"modal\"] > div{width:100% !important;max-width:100% !important;margin:0 !important;border-radius:16px 16px 0 0 !important;max-height:90vh !important;overflow-y:auto !important;position:fixed !important;bottom:0 !important;left:0 !important;right:0 !important;}' +
        'button,.btn,[class*=\"btn-\"]{min-height:40px !important;padding:8px 14px !important;font-size:13px !important;}' +
        'input,select,textarea{font-size:16px !important;min-height:40px !important;padding:8px 12px !important;}' +
        '.header-toolbar,[class*=\"toolbar\"]{padding:8px !important;flex-wrap:wrap !important;gap:6px !important;}' +
        '.acoes-grid,[class*=\"botoes-acao\"]{display:grid !important;grid-template-columns:1fr 1fr !important;gap:8px !important;}' +
        '.sidebar,[class*=\"sidebar\"],#sidebar{display:none !important;}' +
        '.main-content,[class*=\"main-content\"],#main-content{margin-left:0 !important;padding:8px !important;padding-bottom:70px !important;}' +
        '.of-card,[class*=\"of-card\"]{padding:10px !important;font-size:13px !important;}' +
        '.of-img,[class*=\"of-img\"]{width:48px !important;height:48px !important;}' +
        '.truncate-mobile{white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;max-width:150px !important;}' +
        '#page-historico-passagens{padding:8px!important;}' +
        '#hist-passagens-resultado .of-card{font-size:12px!important;}' +
        '.hist-filtros{flex-direction:column!important;}' +
        '#hist-filtros input,#hist-filtros select{width:100%!important;font-size:16px!important;}' +
        '}';
      document.head.appendChild(styleEl);
    }
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
    { id: 'hub',                label: 'Hub',        icone: 'Hub',  fixo: true  }, 
    { id: 'pcp',                label: 'PCP',        icone: 'PCP',  fixo: false }, 
    { id: 'ofmaq',              label: 'Maquinas',   icone: 'Maq',  fixo: true  }, 
    { id: 'estoque',            label: 'Estoque',    icone: 'Est',  fixo: false }, 
    { id: 'orcamentos',         label: 'Orcamentos', icone: 'Orc',  fixo: false }, 
    { id: 'amostras',           label: 'Amostras',   icone: 'Amo',  fixo: false }, 
    { id: 'clientes',           label: 'Clientes',   icone: 'Cli',  fixo: false }, 
    { id: 'dashboard',          label: 'Dashboard',  icone: 'Dash', fixo: false }, 
    { id: 'relatorios',         label: 'Relatorios', icone: 'Rel',  fixo: false }, 
    { id: 'comissoes',          label: 'Comissoes',  icone: 'Com',  fixo: false }, 
    { id: 'caixas-perdidas',    label: 'Perdas',     icone: 'Per',  fixo: false }, 
    { id: 'papelao-ia',         label: 'Papelao',    icone: 'Pap',  fixo: false }, 
    { id: 'lancamento',         label: 'Armazem',    icone: 'Arm',  fixo: false }, 
    { id: 'historico-passagens',label: 'Historico',  icone: 'His',  fixo: false }, 
    { id: 'usuarios',           label: 'Usuarios',   icone: 'Usr',  fixo: false }, 
    { id: 'vendedores',         label: 'Vendas',     icone: 'Ven',  fixo: false }, 
    { id: 'fornecedores',       label: 'Fornec',     icone: 'For',  fixo: false }, 
    { id: 'compras',            label: 'Compras',    icone: 'Com',  fixo: false }, 
    { id: 'configuracoes',      label: 'Config',     icone: 'Cfg',  fixo: false }, 
    { id: 'mapa-clientes',      label: 'Mapa',       icone: 'Map',  fixo: false }, 
    { id: 'tempos-reais',       label: 'Tempos',     icone: 'Tmp',  fixo: false }, 
    { id: 'tipos-caixa',        label: 'Tipos',      icone: 'Tip',  fixo: false }, 
    { id: 'fluxos',             label: 'Fluxos',     icone: 'Flx',  fixo: false }, 
    { id: 'facas1',             label: 'Facas',      icone: 'Fac',  fixo: false }, 
    { id: 'cliches',            label: 'Cliches',    icone: 'Cli',  fixo: false }, 
  ]; 

  function getHotbarConfig() { 
    try { 
      var salvo = localStorage.getItem('hotbar_config'); 
      if (salvo) { 
        var arr = JSON.parse(salvo); 
        if (Array.isArray(arr)) return arr.map(function(x){ return String(x||'').trim(); }).filter(Boolean); 
      } 
    } catch(e) {} 
    return ['hub', 'pcp', 'ofmaq', 'estoque']; 
  } 

  function salvarHotbarConfig(ids) { 
    var arr = Array.isArray(ids) ? ids.map(function(x){ return String(x||'').trim(); }).filter(Boolean) : []; 
    if (arr.indexOf('hub') === -1) arr.unshift('hub'); 
    if (arr.indexOf('ofmaq') === -1) arr.push('ofmaq'); 
    var uniq = []; 
    arr.forEach(function(x){ if (uniq.indexOf(x) === -1) uniq.push(x); }); 
    localStorage.setItem('hotbar_config', JSON.stringify(uniq)); 
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
      var aba = HOTBAR_ABAS.find(function(a){ return a.id===id; }) || { id: id, label: id, icone: id, fixo: false }; 
      return '<button class="mbn-item" data-tab="' + aba.id + '" onclick="go(&quot;' + aba.id + '&quot;)" ' + 
        'style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;' + 
        'padding:6px 2px;background:none;border:none;cursor:pointer;font-size:10px;color:#94a3b8;gap:1px">' + 
        '<div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.08);' + 
        'display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#e2e8f0">' + 
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
    try{ var old = document.getElementById('modal-menu-mais'); if(old) old.remove(); }catch(e){}      
    var overlay = document.createElement('div'); 
    overlay.id = 'modal-menu-mais'; 
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:flex-end'; 
 
    var ativos = getHotbarConfig(); 
    var sheet = document.createElement('div'); 
    sheet.style.cssText = 'background:#0b1220;border:1px solid rgba(255,255,255,0.12);border-radius:20px 20px 0 0;width:100%;padding:18px 16px;max-height:80vh;overflow-y:auto'; 
 
    var grid = HOTBAR_ABAS.filter(function(a){ return ativos.indexOf(a.id) === -1; }).map(function(aba) { 
      return '<div onclick="go(&quot;' + aba.id + '&quot;);document.getElementById(&quot;modal-menu-mais&quot;).remove()" style="' + 
        'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 8px;text-align:center;cursor:pointer">' + 
        '<div style="font-size:16px;margin-bottom:4px;color:#e2e8f0;font-weight:800">' + aba.icone + '</div>' + 
        '<div style="color:#e2e8f0;font-size:12px">' + aba.label + '</div>' + 
      '</div>'; 
    }).join(''); 
 
    sheet.innerHTML = 
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' + 
        '<span style="color:#e2e8f0;font-weight:800;font-size:15px">Menu</span>' + 
        '<button onclick="document.getElementById(&quot;modal-menu-mais&quot;).remove()" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer">X</button>' + 
      '</div>' + 
      '<div style="background:rgba(74,144,217,0.1);border:1px solid rgba(74,144,217,0.2);border-radius:10px;padding:12px;margin-bottom:14px;cursor:pointer" onclick="window.abrirPersonalizarHotbar()">' + 
        '<div style="color:#4A90D9;font-weight:600;font-size:13px;margin-bottom:2px">Personalizar barra de navegacao</div>' + 
        '<div style="color:#64748b;font-size:11px">Escolha quais abas aparecem embaixo</div>' + 
      '</div>' + 
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">' + grid + '</div>'; 
 
    overlay.appendChild(sheet); 
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); }); 
    document.body.appendChild(overlay); 
  }; 

  window.toggleHotbarAba = function(id, ativo) { 
    var cur = getHotbarConfig(); 
    id = String(id || '').trim(); 
    if (!id) return; 
    if (ativo) { 
      if (cur.length >= 4) { 
        alert('Maximo 4 abas. Desmarque uma primeiro.'); 
        setTimeout(function() { 
          try { 
            var cb = document.querySelector('#modal-personalizar-hotbar input[onchange*=\"' + id + '\"]'); 
            if (cb) cb.checked = false; 
          } catch(_) {} 
        }, 50); 
        return; 
      } 
      if (cur.indexOf(id) === -1) cur.push(id); 
    } else { 
      var aba = HOTBAR_ABAS.find(function(a){ return a.id === id; }); 
      if (aba && aba.fixo) return; 
      cur = cur.filter(function(a){ return a !== id; }); 
    } 
    salvarHotbarConfig(cur); 
    console.log('[PATCH] hotbar salva:', cur); 
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
              var token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''; 
              fetch('/api/ofs/reordenar', { 
                method: 'POST', 
                headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': 'Bearer ' + token 
                }, 
                body: JSON.stringify({ ordem: ids }) 
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
