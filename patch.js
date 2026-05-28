/* patch.js — Italy Embalagens ERP v2 */ 
(function() { 
  'use strict'; 
 
  // ── UTIL: pegar token ────────────────────────────────────────── 
  function getToken() { 
    return localStorage.getItem('token') || 
           sessionStorage.getItem('token') || 
           localStorage.getItem('access_token') || ''; 
  } 
 
  // ── PATCH 1: proximoNumeroOf ─────────────────────────────────── 
  // Busca a OF com maior número e retorna número + 1 formatado 
  window.proximoNumeroOf = async function() { 
    var token = getToken(); 
    var h = token ? { 'Authorization': 'Bearer ' + token } : {}; 
    try { 
      // Tentar com order_by=numero 
      var r = await fetch('/api/ofs?limit=5&order_by=numero&order=desc&t=' + Date.now(), { headers: h }); 
      if (r.ok) { 
        var d = await r.json(); 
        var lista = d.data || d.ofs || (Array.isArray(d) ? d : []); 
        console.log('[PATCH] OFs recebidas para calcular próximo número:', lista.slice(0,3).map(function(o){ return {numero: o.numero, of_num: o.of_num, id: o.id}; })); 
        // Tentar todos os campos possíveis de número 
        var maior = 0; 
        lista.forEach(function(o) { 
          // Log para ver TODOS os campos retornados 
          if (lista.indexOf(o) === 0) console.log('[PATCH] campos da primeira OF:', Object.keys(o)); 
          // Tentar TODOS os campos possíveis 
          var valoresTentados = [o.numero, o.of_num, o.numero_of, o.num, o.seq, o.sequencia, o.cod, o.codigo, o.of]; 
          valoresTentados.forEach(function(v) { 
            if (v !== null && v !== undefined && v !== '') { 
              var n = parseInt(String(v).replace(/\D/g,''), 10); 
              if (!isNaN(n) && n > maior) { 
                maior = n; 
                console.log('[PATCH] campo com número válido encontrado: valor=' + v + ' n=' + n); 
              } 
            } 
          }); 
        }); 
        if (maior > 0) { 
          var proximo = String(maior + 1).padStart(String(maior).length >= 3 ? String(maior).length : 3, '0'); 
          console.log('[PATCH] proximoNumeroOf: maior=' + maior + ' próximo=' + proximo); 
          return proximo; 
        } 
      } 
    } catch(e) { console.warn('[PATCH] proximoNumeroOf API falhou:', e.message); } 
 
    // Fallback: usar OFs já carregadas em memória 
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
 
  // ── PATCH 2: injetar número ao abrir modal OF Rápida ────────── 
  var _origAbrir = window.abrirNovaOfRapida; 
  window.abrirNovaOfRapida = function() { 
    if (typeof _origAbrir === 'function') _origAbrir.apply(this, arguments); 
    setTimeout(function() { 
      var el = document.getElementById('of-r-numero'); 
      if (!el) { console.warn('[PATCH] #of-r-numero não encontrado'); return; } 
      var setVal = function(v) { 
        if (el.tagName === 'INPUT') el.value = v; 
        else el.textContent = v; 
      }; 
      try { el.disabled = true; } catch(_) {} 
      setVal('...'); 
      window.proximoNumeroOf().then(function(num) { 
        window._ofRapidaNumero = num; 
        setVal(num); 
        try { el.disabled = false; } catch(_) {} 
        console.log('[PATCH] OF Rápida número:', num); 
      }); 
    }, 100); 
  }; 
 
  // ── PATCH 3: garantir número no payload ao salvar OF Rápida ─── 
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
      console.log('[PATCH] salvar OF Rápida número:', num); 
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
    if (!container) { console.warn('[PATCH] #passagens-lista não encontrado'); return; } 
    container.innerHTML = '<p style="color:#64748b;text-align:center;padding:16px;font-size:13px">Carregando...</p>'; 
    var token = getToken(); 
    var h = token ? { 'Authorization': 'Bearer ' + token } : {}; 
    try { 
      var r = await fetch('/api/passagens/hoje?periodo=' + periodo + '&t=' + Date.now(), { headers: h }); 
      if (!r.ok) throw new Error('HTTP ' + r.status); 
      var d = await r.json(); 
      var lista = d.passagens || []; 
      console.log('[PATCH] passagens:', lista.length, 'registros (' + periodo + ')'); 
      function bs(p) { 
        return 'border:none;border-radius:20px;padding:4px 14px;cursor:pointer;font-size:12px;font-weight:500;background:' + 
          (periodo===p ? '#4A90D9' : 'rgba(255,255,255,0.07)') + ';color:' + 
          (periodo===p ? '#fff' : '#94a3b8'); 
      } 
      var html = '<div style="display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06)">' + 
        '<button style="' + bs('hoje')   + '" onclick="carregarPassagensHoje({periodo:\'hoje\'})">Hoje</button>' + 
        '<button style="' + bs('semana') + '" onclick="carregarPassagensHoje({periodo:\'semana\'})">Esta semana</button>' + 
        '<button style="' + bs('mes')    + '" onclick="carregarPassagensHoje({periodo:\'mes\'})">Este mês</button>' + 
        '</div>'; 
      if (!lista.length) { 
        html += '<p style="color:#64748b;text-align:center;padding:20px;font-size:13px">Nenhuma passagem registrada neste período.</p>'; 
      } else { 
        html += '<div style="overflow-y:auto;max-height:300px">' + lista.map(function(p) { 
          var hora = p.hora_passagem ? new Date(p.hora_passagem).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''; 
          return '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px">' + 
            '<span style="font-weight:700;color:#10b981;min-width:55px">OF #' + (p.of_numero||'—') + '</span>' + 
            '<span style="color:#e2e8f0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.cliente||'—') + '</span>' + 
            '<span style="color:#94a3b8;min-width:80px">' + (p.maquina||'—') + '</span>' + 
            '<span style="color:#64748b;min-width:75px;text-align:right">' + hora + '</span>' + 
            '</div>'; 
        }).join('') + '</div>'; 
      } 
      container.innerHTML = html; 
    } catch(e) { 
      container.innerHTML = '<p style="color:#f43f5e;text-align:center;padding:16px;font-size:13px">Erro ao carregar passagens.</p>'; 
      console.error('[PATCH] carregarPassagensHoje:', e); 
    } 
  }; 
 
  // ── PATCH 5: interceptar renderHub ──────────────────────────── 
  var _origHub = window.renderHub; 
  window.renderHub = function() { 
    var res = typeof _origHub === 'function' ? _origHub.apply(this, arguments) : undefined; 
    setTimeout(function() { window.carregarPassagensHoje(); }, 400); 
    return res; 
  }; 
 
  // ── PATCH 6: accordion OFs por Máquina ────────────────────────── 
  function aplicarAccordion() { 
    // Seletor real do header (index.html usa .maq-header) 
    var headers = document.querySelectorAll('.maq-header'); 
    console.log('[PATCH] aplicarAccordion: ' + headers.length + ' headers encontrados'); 
 
    headers.forEach(function(header) { 
      if (header._patchAcordeon) return; // não duplicar 
      header._patchAcordeon = true; 
      try { header.setAttribute('data-patch-acordeon', '1'); } catch(_) {} 
 
      // O conteúdo fica no próximo elemento irmão 
      var body = header.nextElementSibling; 
      if (!body) return; 
 
      // Remover onclick inline para não dar toggle duplo 
      try { if (header.getAttribute && header.getAttribute('onclick')) header.removeAttribute('onclick'); } catch(_) {} 
 
      // Fechar inicialmente 
      body.style.display = 'none'; 
 
      // Adicionar indicador visual no header 
      var seta = header.querySelector('.maq-seta') || header.querySelector('svg') || null; 
 
      header.style.cursor = 'pointer'; 
      header.addEventListener('click', function(e) { 
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || 
            e.target.closest('button') || e.target.closest('select')) return; 
 
        var aberto = body.style.display !== 'none'; 
        body.style.display = aberto ? 'none' : 'flex'; 
        try { 
          body.style.flexDirection = 'column'; 
          body.style.gap = '8px'; 
          if (!aberto) body.style.padding = '10px'; 
        } catch(_) {} 
        if (seta) seta.style.transform = aberto ? 'rotate(0deg)' : 'rotate(180deg)'; 
        console.log('[PATCH] accordion:', header.textContent.trim().substring(0,20), aberto ? 'fechou' : 'abriu'); 
 
        // Iniciar Sortable ao abrir (se disponível) 
        if (!aberto && typeof Sortable !== 'undefined' && !body._sortInst) { 
          body._sortInst = new Sortable(body, { 
            animation: 150, 
            delay: 100, 
            delayOnTouchOnly: true, 
            onEnd: function() { 
              var ids = Array.from(body.querySelectorAll('[data-of-id]')) 
                .map(function(el){ return el.dataset.ofId; }).filter(Boolean); 
              if (!ids.length) return; 
              var token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''; 
              var maq = body.dataset.maquinaId || body.dataset.maquina || body.dataset.maquinaNome || body.dataset.maquinaName || ''; 
              fetch('/api/ofs/reordenar', { 
                method: 'POST', 
                headers: Object.assign({'Content-Type':'application/json'}, token ? {Authorization:'Bearer '+token} : {}), 
                body: JSON.stringify({ ordem: ids, maquina_id: String(maq || '').trim() }) 
              }).catch(function(e){ console.warn('[PATCH] reordenar:', e); }); 
            } 
          }); 
        } 
      }); 
    }); 
  } 
 
  // Interceptar a função de render real (renderOFsPorMaquina) 
  var _nomeFuncRender = 'renderOFsPorMaquina'; 
  var _origRenderMaq = window[_nomeFuncRender]; 
  if (typeof _origRenderMaq === 'function') { 
    window[_nomeFuncRender] = function() { 
      var res = _origRenderMaq.apply(this, arguments); 
      setTimeout(aplicarAccordion, 300); 
      return res; 
    }; 
    console.log('[PATCH] interceptou ' + _nomeFuncRender); 
  } else { 
    console.warn('[PATCH] função', _nomeFuncRender, 'não encontrada — tentando MutationObserver'); 
    // Fallback: observar mudanças no DOM da tela de máquinas 
    var _observer = new MutationObserver(function() { 
      var headers2 = document.querySelectorAll('.maq-header:not([data-patch-acordeon])'); 
      if (headers2.length > 0) aplicarAccordion(); 
    }); 
    _observer.observe(document.body, { childList: true, subtree: true }); 
  } 
 
  console.log('[PATCH] ✅ patch.js v2 ativo — Italy Embalagens ERP'); 
 
})(); 
