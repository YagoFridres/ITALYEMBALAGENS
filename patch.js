/* patch.js — Italy Embalagens ERP — carregado após index.html */ 
(function() { 
  'use strict'; 

  // PATCH 1 — proximoNumeroOf: busca último número e soma +1 
  window.proximoNumeroOf = async function() { 
    var token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''; 
    var h = token ? { 'Authorization': 'Bearer ' + token } : {}; 
    try { 
      var r = await fetch('/api/ofs?limit=1&order_by=numero&order=desc&t=' + Date.now(), { headers: h }); 
      if (!r.ok) throw new Error('HTTP ' + r.status); 
      var d = await r.json(); 
      var lista = d.data || d.ofs || (Array.isArray(d) ? d : []); 
      if (lista.length) { 
        var raw = String(lista[0].numero || lista[0].of_num || '0').trim(); 
        var n = parseInt(raw, 10); 
        if (!isNaN(n) && n > 0) { 
          var proximo = String(n + 1).padStart(Math.max(raw.length, 3), '0'); 
          console.log('[PATCH] proximoNumeroOf: último=' + raw + ' próximo=' + proximo); 
          return proximo; 
        } 
      } 
    } catch(e) { console.warn('[PATCH] proximoNumeroOf falhou:', e.message); } 
    var cache = window.OFS_ARQUIVO || []; 
    if (cache.length) { 
      var nums = cache.map(function(o){ return parseInt(o.numero || o.of_num || '0', 10); }).filter(function(n){ return !isNaN(n) && n > 0; }); 
      if (nums.length) return String(Math.max.apply(null, nums) + 1).padStart(3, '0'); 
    } 
    return '001'; 
  }; 

  // PATCH 2 — carregarPassagensHoje: lista com filtros Hoje/Semana/Mês 
  window.carregarPassagensHoje = async function(opts) { 
    opts = opts || {}; 
    var periodo = opts.periodo || 'hoje'; 
    var maquina = opts.maquina || ''; 
    var cliente = opts.cliente || ''; 
    var container = document.getElementById('passagens-lista'); 
    if (!container) { console.warn('[PATCH] #passagens-lista não encontrado'); return; } 
    container.innerHTML = '<p style="color:#64748b;text-align:center;padding:16px;font-size:13px">Carregando...</p>'; 
    var token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''; 
    var h = token ? { 'Authorization': 'Bearer ' + token } : {}; 
    var params = 'periodo=' + periodo + '&t=' + Date.now(); 
    if (maquina) params += '&maquina=' + encodeURIComponent(maquina); 
    if (cliente) params += '&cliente=' + encodeURIComponent(cliente); 
    try { 
      var r = await fetch('/api/passagens/hoje?' + params, { headers: h }); 
      if (!r.ok) throw new Error('HTTP ' + r.status); 
      var d = await r.json(); 
      var lista = d.passagens || []; 
      console.log('[PATCH] carregarPassagensHoje: ' + lista.length + ' registros (' + periodo + ')'); 
      function bs(p) { 
        var a = periodo === p; 
        return 'border:1px solid ' + (a?'rgba(74,144,217,0.5)':'rgba(255,255,255,0.1)') + ';background:' + (a?'rgba(74,144,217,0.2)':'rgba(255,255,255,0.04)') + ';color:' + (a?'#4A90D9':'#94a3b8') + ';border-radius:20px;padding:3px 12px;cursor:pointer;font-size:12px'; 
      } 
      var html = '<div style="display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06)">' + 
        '<button style="' + bs('hoje')   + '" onclick="carregarPassagensHoje({periodo:\\'hoje\\'})">Hoje</button>' + 
        '<button style="' + bs('semana') + '" onclick="carregarPassagensHoje({periodo:\\'semana\\'})">Esta semana</button>' + 
        '<button style="' + bs('mes')    + '" onclick="carregarPassagensHoje({periodo:\\'mes\\'})">Este mês</button>' + 
        '</div>'; 
      if (!lista.length) { 
        html += '<p style="color:#64748b;text-align:center;padding:20px;font-size:13px">Nenhuma passagem registrada neste período.</p>'; 
      } else { 
        html += lista.map(function(p) { 
          var hora = p.hora_passagem ? new Date(p.hora_passagem).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''; 
          return '<div style="display:grid;grid-template-columns:70px 1fr 110px 85px;gap:6px;align-items:center;padding:7px 12px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px">' + 
            '<span style="font-weight:700;color:#10b981">OF #' + (p.of_numero||'—') + '</span>' + 
            '<span style="color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.cliente||'—') + '</span>' + 
            '<span style="color:#94a3b8">' + (p.maquina||'—') + '</span>' + 
            '<span style="color:#64748b;white-space:nowrap">' + hora + '</span>' + 
            '</div>'; 
        }).join(''); 
      } 
      container.innerHTML = html; 
    } catch(e) { 
      container.innerHTML = '<p style="color:#f43f5e;text-align:center;padding:16px;font-size:13px">Erro ao carregar passagens.</p>'; 
      console.error('[PATCH] carregarPassagensHoje erro:', e); 
    } 
  }; 

  // PATCH 3 — Interceptar abrirNovaOfRapida para injetar número correto 
  var _origAbrir = window.abrirNovaOfRapida; 
  window.abrirNovaOfRapida = function() { 
    if (typeof _origAbrir === 'function') _origAbrir.apply(this, arguments); 
    setTimeout(function() { 
      var el = document.getElementById('of-r-numero'); 
      if (!el) { console.warn('[PATCH] #of-r-numero não encontrado'); return; } 
      if (el.tagName === 'INPUT') { el.value = '...'; el.disabled = true; } 
      else el.textContent = '...'; 
      window.proximoNumeroOf().then(function(num) { 
        window._ofRapidaNumero = num; 
        if (el.tagName === 'INPUT') { el.value = num; el.disabled = false; } 
        else el.textContent = num; 
        console.log('[PATCH] OF Rápida número injetado:', num); 
      }); 
    }, 80); 
  }; 

  // PATCH 4 — Interceptar renderHub para sempre chamar carregarPassagensHoje 
  var _origRenderHub = window.renderHub; 
  window.renderHub = function() { 
    var res = typeof _origRenderHub === 'function' ? _origRenderHub.apply(this, arguments) : undefined; 
    setTimeout(function() { window.carregarPassagensHoje(); }, 300); 
    return res; 
  }; 

  console.log('[PATCH] ✅ patch.js ativo — Italy Embalagens ERP'); 
 })(); 
