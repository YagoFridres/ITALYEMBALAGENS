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

  var HOTBAR_TODAS_ABAS = [ 
    { id: 'hub',        label: 'Hub',       icon: '[Hub]', fixo: true  }, 
    { id: 'pcp',        label: 'PCP',       icon: '[PCP]', fixo: false }, 
    { id: 'ofmaq',      label: 'Maquinas',  icon: '[Maq]', fixo: true  }, 
    { id: 'estoque',    label: 'Estoque',   icon: '[Est]', fixo: false }, 
    { id: 'orcamentos', label: 'Orcamentos',icon: '[Orc]', fixo: false }, 
    { id: 'amostras',   label: 'Amostras',  icon: '[Amo]', fixo: false }, 
    { id: 'clientes',   label: 'Clientes',  icon: '[Cli]', fixo: false }, 
    { id: 'analises',   label: 'Analises',  icon: '[Ana]', fixo: false }, 
    { id: 'papelao',    label: 'Papelao',   icon: '[Pap]', fixo: false }, 
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
      analises: ['dashboard','relatorios','comissoes','caixas-perdidas','caixas_perdidas','configuracoes'], 
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
    var abas = ativos.slice(0, 4); 
    var html = abas.map(function(id) { 
      var aba = HOTBAR_TODAS_ABAS.find(function(a){ return a.id === id; }) || { id: id, label: id, icon: '[Doc]' }; 
      return '<button class="mbn-item" id="mbn-' + aba.id + '" data-tab="' + aba.id + '" onclick="go(&quot;' + aba.id + '&quot;)">' + 
        '<div class="mbn-ico">' + aba.icon + '</div><div class="mbn-lbl">' + aba.label + '</div></button>'; 
    }).join(''); 
    html += '<button class="mbn-item" id="mbn-mais" onclick="abrirMenuMais()"><div class="mbn-ico">=</div><div class="mbn-lbl">Mais</div></button>'; 
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
 
    var grid = HOTBAR_TODAS_ABAS.filter(function(a){ return ativos.indexOf(a.id) === -1; }).map(function(aba) { 
      return '<div onclick="go(&quot;' + aba.id + '&quot;);document.getElementById(&quot;modal-menu-mais&quot;).remove()" style="' + 
        'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 8px;text-align:center;cursor:pointer">' + 
        '<div style="font-size:26px;margin-bottom:4px">' + aba.icon + '</div>' + 
        '<div style="color:#e2e8f0;font-size:12px">' + aba.label + '</div>' + 
      '</div>'; 
    }).join(''); 
 
    var checks = HOTBAR_TODAS_ABAS.map(function(aba) { 
      var fixo = !!aba.fixo; 
      var ativo = ativos.indexOf(aba.id) !== -1; 
      return '<label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:' + (fixo?'default':'pointer') + '">' + 
        '<input type="checkbox" ' + (ativo?'checked':'') + ' ' + (fixo?'disabled':'') + ' onchange="toggleHotbarAba(&quot;' + aba.id + '&quot;,this.checked)" style="width:18px;height:18px">' + 
        '<span style="font-size:18px">' + aba.icon + '</span>' + 
        '<span style="color:' + (fixo?'#64748b':'#e2e8f0') + ';font-size:14px">' + aba.label + (fixo?' (fixo)':'') + '</span>' + 
      '</label>'; 
    }).join(''); 
 
    sheet.innerHTML = 
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' + 
        '<span style="color:#e2e8f0;font-weight:800;font-size:15px">Menu</span>' + 
        '<button onclick="document.getElementById(&quot;modal-menu-mais&quot;).remove()" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer">X</button>' + 
      '</div>' + 
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">' + grid + '</div>' + 
      '<div style="border-top:1px solid rgba(255,255,255,0.12);padding-top:12px">' + 
        '<div style="color:#94a3b8;font-size:13px;margin-bottom:10px">Personalizar barra (max. 4 abas)</div>' + 
        '<div>' + checks + '</div>' + 
      '</div>'; 
 
    overlay.appendChild(sheet); 
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); }); 
    document.body.appendChild(overlay); 
  }; 

  window.toggleHotbarAba = function(id, ativo) { 
    var cur = getHotbarConfig(); 
    id = String(id || '').trim(); 
    if (!id) return; 
    if (ativo && cur.indexOf(id) === -1) { 
      if (cur.length >= 4) { 
        alert('Maximo 4 abas na barra. Desmarque uma para adicionar outra.'); 
        try{ 
          var q = document.querySelectorAll('#modal-menu-mais input[type="checkbox"]'); 
          Array.prototype.forEach.call(q, function(cb){ 
            try{ if(cb && cb.getAttribute('onchange') && cb.getAttribute('onchange').indexOf(id) !== -1) cb.checked = false; }catch(_){} 
          }); 
        }catch(_){} 
        return; 
      } 
      cur.push(id); 
    } else if (!ativo) { 
      cur = cur.filter(function(a){ return a !== id; }); 
    } 
    salvarHotbarConfig(cur); 
  }; 

  function aplicarAccordion() { 
    var headers = document.querySelectorAll('.maq-header'); 
    if (!headers.length) return; 
    console.log('[PATCH] accordion v4:', headers.length, 'headers'); 
 
    headers.forEach(function(header) { 
      if (header._pv4) return; 
      header._pv4 = true; 
      try { header.setAttribute('data-pv4', '1'); } catch(e) {} 
 
      var body = header.nextElementSibling; 
      if (!body) return; 
 
      header.removeAttribute('onclick'); 
 
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
 
        if (aberto) { 
          body.style.display = 'flex'; 
          body.style.flexDirection = 'column'; 
          body.style.gap = '8px'; 
          body.style.padding = '10px'; 
        } else { 
          body.style.display = 'none'; 
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
      }); 
    }); 
  } 
 
  if (!document.getElementById('patch-sort-style')) { 
    var st = document.createElement('style'); 
    st.id = 'patch-sort-style'; 
    st.textContent = '.of-sort-ghost{opacity:0.4!important;background:rgba(74,144,217,0.2)!important;}'; 
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
              'border:1px solid rgba(74,144,217,0.3);border-radius:8px;cursor:pointer;font-size:13px;margin-top:8px'; 
            btn.onclick = function() { try { window.abrirPersonalizarHotbar(); } catch(e) {} }; 
            menu.appendChild(btn); 
          } 
        }, 100); 
        return res; 
      }; 
      window.toggleMobMenu._patched = true; 
    } 
  } 

  window.abrirPersonalizarHotbar = function() { 
    try { 
      var old = document.getElementById('modal-hotbar-personalizar'); 
      if (old) old.remove(); 
    } catch(e) {} 
 
    var overlay = document.createElement('div'); 
    overlay.id = 'modal-hotbar-personalizar'; 
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:flex-end'; 
 
    function getHidden() { 
      try { 
        var raw = localStorage.getItem('mbn_hidden'); 
        var arr = raw ? JSON.parse(raw) : []; 
        return Array.isArray(arr) ? arr : []; 
      } catch(e) { return []; } 
    } 
    function setHidden(arr) { 
      try { localStorage.setItem('mbn_hidden', JSON.stringify(arr || [])); } catch(e) {} 
    } 
    function applyHidden() { 
      var hidden = getHidden(); 
      ['hub','pcp','ofmaq','estoque'].forEach(function(k){ 
        var el = document.getElementById('mbn-' + k); 
        if (el) el.style.display = hidden.indexOf(k) >= 0 ? 'none' : ''; 
      }); 
    } 
 
    var hidden = getHidden(); 
    var sheet = document.createElement('div'); 
    sheet.style.cssText = 'background:#0b1220;border:1px solid rgba(255,255,255,0.12);border-radius:20px 20px 0 0;width:100%;padding:18px 16px;max-height:80vh;overflow-y:auto'; 
    sheet.innerHTML = 
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' + 
        '<span style="color:#e2e8f0;font-weight:800;font-size:15px">Personalizar barra</span>' + 
        '<button id="btn-fechar-hotbar" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer">X</button>' + 
      '</div>' + 
      ['hub','pcp','ofmaq','estoque'].map(function(k){ 
        var checked = hidden.indexOf(k) === -1 ? 'checked' : ''; 
        return '<label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer">' + 
          '<input type="checkbox" data-k="' + k + '" ' + checked + ' style="width:18px;height:18px">' + 
          '<span style="color:#e2e8f0;font-size:14px">' + k + '</span>' + 
        '</label>'; 
      }).join(''); 
 
    overlay.appendChild(sheet); 
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); }); 
    document.body.appendChild(overlay); 
 
    var fecharBtn = document.getElementById('btn-fechar-hotbar'); 
    if (fecharBtn) fecharBtn.onclick = function(){ overlay.remove(); }; 
 
    Array.prototype.forEach.call(sheet.querySelectorAll('input[type="checkbox"][data-k]'), function(cb) { 
      cb.addEventListener('change', function() { 
        var k = String(cb.getAttribute('data-k') || '').trim(); 
        if (!k) return; 
        var cur = getHidden(); 
        if (cb.checked) cur = cur.filter(function(x){ return x !== k; }); 
        else if (cur.indexOf(k) === -1) cur.push(k); 
        setHidden(cur); 
        applyHidden(); 
      }); 
    }); 
 
    applyHidden(); 
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
 
  function patchRenderHub() { 
    if (window.renderHub && !window.renderHub._patched) { 
      var _orig = window.renderHub; 
      window.renderHub = async function() { 
        var res = await _orig.apply(this, arguments); 
        setTimeout(function() { window.carregarPassagensHoje(); }, 400); 
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
