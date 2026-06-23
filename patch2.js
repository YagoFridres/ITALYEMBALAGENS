// ============================================
// PATCH2.JS -- Correcoes isoladas
// Carregado apos patch.js sem interferir nele
// ============================================

(function() {
  'use strict';

  // 1. MENUS -- remover Relatorio Mensal e Caixas Perdidas duplicada
  function fixMenus() {
    function norm(t) {
      return String(t || '').trim().toLowerCase()
        .replace(/[áàãâ]/g, 'a').replace(/[éèê]/g, 'e')
        .replace(/[íìî]/g, 'i').replace(/[óòõô]/g, 'o')
        .replace(/[úùû]/g, 'u').replace(/[ç]/g, 'c')
        .replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    }
    var sb = document.querySelector('.sidebar,[class*="sidebar"]');
    if (!sb) return;
    var folhas = Array.from(sb.querySelectorAll('*')).filter(function(el) {
      return el.children.length === 0 && (el.textContent || '').trim().length > 1;
    });

    // Remover Relatorio Mensal
    folhas.forEach(function(el) {
      if (norm(el.textContent) !== 'relatorio mensal') return;
      var p = el.parentElement;
      if (p && p !== sb) p.style.cssText = 'display:none!important';
      else el.style.cssText = 'display:none!important';
    });

    // Achar grupo Financeiro
    var grpFin = null;
    folhas.forEach(function(el) {
      if (norm(el.textContent) !== 'financeiro' || grpFin) return;
      var p = el.parentElement;
      for (var i = 0; i < 6; i++) {
        if (!p || p === sb) break;
        if (p.querySelectorAll('a,li').length >= 3) { grpFin = p; break; }
        p = p.parentElement;
      }
    });

    // Remover Caixas Perdidas fora do Financeiro
    folhas.forEach(function(el) {
      if (norm(el.textContent) !== 'caixas perdidas') return;
      if (grpFin && grpFin.contains(el)) return;
      var p = el.parentElement;
      if (p && p !== sb) p.style.cssText = 'display:none!important';
    });
  }

  // Rodar fixMenus repetidamente ate estabilizar
  var _fm = 0;
  var _fmInt = setInterval(function() {
    _fm++;
    fixMenus();
    if (_fm >= 20) clearInterval(_fmInt);
  }, 1500);

  // 2. PCP -- corrigir valores preco/total nas linhas
  function fixPcpValores() {
    var cache = window._pcpOfsCache || {};
    document.querySelectorAll('#pcp-tbody tr, .pcp-row').forEach(function(tr) {
      if (tr.getAttribute('data-valores-ok')) return;
      var num = tr.getAttribute('data-of-num') || tr.getAttribute('data-of');
      if (!num) return;
      var of = cache[num] || cache[String(num)];
      if (!of) return;
      var preco = parseFloat(of.preco || 0);
      var qtd = parseInt(of.qtd || 0, 10);
      var total = parseFloat(of.total || (preco * qtd) || 0);
      var cells = tr.querySelectorAll('td');
      cells.forEach(function(td) {
        var h = (td.getAttribute('data-col') || '').toLowerCase();
        if (h.includes('unit') || h.includes('preco')) {
          td.textContent = preco > 0 ? 'R$ ' + preco.toFixed(2).replace('.', ',') : '—';
        }
        if (h.includes('total') && !h.includes('unit')) {
          td.textContent = total > 0 ? 'R$ ' + total.toFixed(2).replace('.', ',') : '—';
        }
      });
      tr.setAttribute('data-valores-ok', '1');
    });
  }

  // 3. COR POR STATUS nas linhas do PCP
  function fixPcpCores() {
    var cache = window._pcpOfsCache || {};
    var hoje = new Date().toISOString().split('T')[0];
    document.querySelectorAll('#pcp-tbody tr, .pcp-row').forEach(function(tr) {
      if (tr.getAttribute('data-cor-ok')) return;
      var num = tr.getAttribute('data-of-num') || tr.getAttribute('data-of');
      if (!num) return;
      var of = cache[num] || cache[String(num)];
      if (!of) return;
      var s = String(of.status || '').toLowerCase();
      var ent = String(of.ent || of.data_entrega || '');
      var urg = of.urgente || of.urg;
      var del = of.deleted_at;
      var borda, bg;
      if (del) { borda = '#F97316'; bg = 'rgba(249,115,22,0.07)'; }
      else if (s.includes('conclu')) { borda = '#22C55E'; bg = 'rgba(34,197,94,0.07)'; }
      else if (urg || (ent && ent < hoje)) { borda = '#EF4444'; bg = 'rgba(239,68,68,0.07)'; }
      else { borda = '#3B82F6'; bg = 'rgba(59,130,246,0.07)'; }
      tr.style.borderLeft = '3px solid ' + borda;
      tr.style.backgroundColor = bg;
      tr.setAttribute('data-cor-ok', '1');
    });
  }

  // 4. Observer para aplicar fixes quando PCP renderizar
  var _pcpObs = new MutationObserver(function() {
    clearTimeout(window._p2pcpT);
    window._p2pcpT = setTimeout(function() {
      fixPcpValores();
      fixPcpCores();
    }, 400);
  });
  document.addEventListener('DOMContentLoaded', function() {
    var el = document.getElementById('pcp-tbody') || document.getElementById('content');
    if (el) _pcpObs.observe(el, { childList: true, subtree: true });
  });

  // 5. Toneladas Vendidas -- fix empresa_id
  window.EMPRESA_UUIDS_P2 = {
    'E1': 'df5f7672-0a6b-402d-ae65-296554236c31',
    'E2': 'e9b734dc-c7d5-4b04-898d-1ec7affa721e',
    'E3': 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
    'italy': 'df5f7672-0a6b-402d-ae65-296554236c31',
    'cartoeste': 'e9b734dc-c7d5-4b04-898d-1ec7affa721e',
    'oestepack': 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667'
  };
  window.resolverEmpresaUUID_P2 = function(v) {
    if (!v || v === 'todas' || v === 'all') return null;
    var isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
    if (isUUID) return v;
    return window.EMPRESA_UUIDS_P2[String(v)]
      || window.EMPRESA_UUIDS_P2[String(v).toUpperCase()]
      || window.EMPRESA_UUIDS_P2[String(v).toLowerCase()]
      || 'df5f7672-0a6b-402d-ae65-296554236c31';
  };

})();
