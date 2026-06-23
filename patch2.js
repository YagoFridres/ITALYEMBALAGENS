(function() {
'use strict';

// ═══════════════════════════════════════
// 1. MENUS
// ═══════════════════════════════════════
function norm(t) {
  return String(t||'').trim().toLowerCase()
    .replace(/[áàãâ]/g,'a').replace(/[éèê]/g,'e')
    .replace(/[íìî]/g,'i').replace(/[óòõô]/g,'o')
    .replace(/[úùû]/g,'u').replace(/[ç]/g,'c')
    .replace(/[^\w\s]/g,'').replace(/\s+/g,' ').trim();
}

function fixMenus() {
  var sb = document.querySelector('.sidebar,[class*="sidebar"]');
  if (!sb) return;
  var all = Array.from(sb.querySelectorAll('*'));
  var folhas = all.filter(function(el) {
    return el.children.length === 0 && (el.textContent||'').trim().length > 1;
  });

  // Remover Relatório Mensal
  folhas.forEach(function(el) {
    if (norm(el.textContent) !== 'relatorio mensal') return;
    var p = el.parentElement;
    if (p && p !== sb) p.style.cssText = 'display:none!important';
    else el.style.cssText = 'display:none!important';
  });

  // Encontrar grupo Financeiro
  var grpFin = null;
  folhas.forEach(function(el) {
    if (grpFin || norm(el.textContent) !== 'financeiro') return;
    var p = el.parentElement;
    for (var i = 0; i < 8; i++) {
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
    else el.style.cssText = 'display:none!important';
  });
}

// Rodar fixMenus 15x a cada 2s
var _fmCount = 0;
var _fmInt = setInterval(function() {
  _fmCount++;
  try { fixMenus(); } catch(e) {}
  if (_fmCount >= 15) clearInterval(_fmInt);
}, 2000);
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(fixMenus, 300);
  setTimeout(fixMenus, 1000);
});

// ═══════════════════════════════════════
// 2. TONELADAS VENDIDAS — fix empresa_id
// ═══════════════════════════════════════
var EMPRESA_UUIDS = {
  'E1':'df5f7672-0a6b-402d-ae65-296554236c31',
  'E2':'e9b734dc-c7d5-4b04-898d-1ec7affa721e',
  'E3':'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
  'C104':'df5f7672-0a6b-402d-ae65-296554236c31',
  'italy':'df5f7672-0a6b-402d-ae65-296554236c31',
  'cartoeste':'e9b734dc-c7d5-4b04-898d-1ec7affa721e',
  'oestepack':'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
};

function resolverUUID(v) {
  if (!v || v === 'todas' || v === 'all') return null;
  var isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
  if (isUUID) return v;
  return EMPRESA_UUIDS[String(v)]
      || EMPRESA_UUIDS[String(v).toUpperCase()]
      || EMPRESA_UUIDS[String(v).toLowerCase()]
      || 'df5f7672-0a6b-402d-ae65-296554236c31';
}

// Interceptar fetch para corrigir empresa_id em rotas críticas
var _origFetch = window.fetch.bind(window);
window.fetch = function(url, opts) {
  try {
    if (typeof url === 'string' && (
      url.includes('/api/analises/toneladas') ||
      url.includes('/api/caixas-perdidas') ||
      url.includes('/api/comissoes')
    )) {
      var base = window.location.origin;
      var u = new URL(url.startsWith('http') ? url : base + url);
      var emp = u.searchParams.get('empresa_id') || u.searchParams.get('empresa');
      if (emp) {
        var uuid = resolverUUID(emp);
        if (uuid) {
          u.searchParams.set('empresa_id', uuid);
          u.searchParams.delete('empresa');
          url = u.pathname + u.search;
        }
      }
    }
  } catch(e) {}
  return _origFetch(url, opts);
};

// ═══════════════════════════════════════
// 3. PCP — design moderno + funcional
// ═══════════════════════════════════════

// CSS moderno para o PCP
var pcpStyle = document.getElementById('pcp2-style');
if (!pcpStyle) {
  pcpStyle = document.createElement('style');
  pcpStyle.id = 'pcp2-style';
  pcpStyle.textContent = [
    '#pcp-tbody tr { transition: filter 0.1s; }',
    '#pcp-tbody tr:hover { filter: brightness(1.15); }',
    '#pcp-tbody td { padding: 7px 8px !important; font-size: 12px !important; vertical-align: middle !important; }',
    '#pcp-tbody th { padding: 9px 8px !important; font-size: 10px !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; color: var(--color-text-secondary) !important; }',
    '.pcp2-num { font-weight: 600 !important; font-size: 13px !important; color: #60A5FA !important; }',
    '.pcp2-badge { display:inline-block; padding:2px 8px; border-radius:99px; font-size:10px; font-weight:600; }',
    '.pcp2-azul { background:rgba(59,130,246,.15); color:#60A5FA; }',
    '.pcp2-verde { background:rgba(34,197,94,.15); color:#4ADE80; }',
    '.pcp2-vermelho { background:rgba(239,68,68,.15); color:#F87171; }',
    '.pcp2-laranja { background:rgba(249,115,22,.15); color:#FB923C; }',
  ].join('\n');
  document.head.appendChild(pcpStyle);
}

function pcpCor(of) {
  var s = String(of.status||'').toLowerCase();
  var hoje = new Date().toISOString().split('T')[0];
  var ent = String(of.ent||of.data_entrega||'');
  var urg = of.urgente || of.urg;
  var del = of.deleted_at;
  if (del) return { borda:'#F97316', bg:'rgba(249,115,22,0.06)', cls:'pcp2-laranja', txt:'Excluída' };
  if (s.includes('conclu')) return { borda:'#22C55E', bg:'rgba(34,197,94,0.06)', cls:'pcp2-verde', txt:'Concluída' };
  if (urg || (ent && ent < hoje)) return { borda:'#EF4444', bg:'rgba(239,68,68,0.06)', cls:'pcp2-vermelho', txt: urg?'Urgente':'Atrasada' };
  return { borda:'#3B82F6', bg:'rgba(59,130,246,0.06)', cls:'pcp2-azul', txt:'Em Aberto' };
}

function fmtMoeda(v) {
  var n = parseFloat(v||0);
  return n > 0 ? 'R$ ' + n.toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.') : '—';
}

function fmtJson(v) {
  if (!v) return '—';
  try {
    var a = typeof v === 'string' ? JSON.parse(v) : v;
    if (Array.isArray(a)) return a.filter(Boolean).join(', ');
    if (typeof a === 'object') return Object.values(a).filter(Boolean).join(', ');
    return String(a);
  } catch(e) { return String(v); }
}

function aplicarPcpPatch() {
  var cache = window._pcpOfsCache || {};
  var hoje = new Date().toISOString().split('T')[0];
  var trs = document.querySelectorAll('#pcp-tbody tr:not([data-p2ok])');
  trs.forEach(function(tr) {
    var num = tr.getAttribute('data-of-num') || tr.getAttribute('data-of') || '';
    if (!num) {
      // tentar pegar pelo link do número
      var link = tr.querySelector('a[href*="of="], a.of-link, td:nth-child(4) a');
      if (link) num = (link.textContent||'').replace(/\D/g,'');
    }
    var of = cache[num] || cache[String(num).trim()];
    if (!of) return;

    // Cor por status
    var cor = pcpCor(of);
    tr.style.borderLeft = '3px solid ' + cor.borda;
    tr.style.backgroundColor = cor.bg;

    // Valores
    var preco = parseFloat(of.preco || 0);
    var qtd = parseInt(of.qtd || 0);
    var total = parseFloat(of.total || (preco * qtd) || 0);

    // Tamanho e cores
    var tam = (of.caixa_comprimento && of.caixa_largura)
      ? of.caixa_comprimento + '×' + of.caixa_largura + ' mm'
      : '—';
    var cores = fmtJson(of.cores_impressao);
    var maq = fmtJson(of.maq);

    // Atualizar células por data-col ou posição
    tr.querySelectorAll('td').forEach(function(td) {
      var col = (td.getAttribute('data-col')||'').toLowerCase();
      if (col.includes('unit') || col.includes('vl') || col === 'preco') {
        td.textContent = fmtMoeda(preco);
      } else if (col === 'total' || col.includes('valor_total')) {
        td.textContent = fmtMoeda(total);
      } else if (col.includes('tamanho') || col.includes('size')) {
        td.textContent = tam;
      } else if (col.includes('cor')) {
        td.textContent = cores;
      } else if (col.includes('maq') || col.includes('maquina')) {
        if (td.textContent.includes('[object')) td.textContent = maq;
      }
    });

    // Badge de status
    var statusTd = tr.querySelector('td[data-col="status"], td.status-col');
    if (statusTd && !statusTd.querySelector('.pcp2-badge')) {
      statusTd.innerHTML = '<span class="pcp2-badge ' + cor.cls + '">' + cor.txt + '</span>';
    }

    tr.setAttribute('data-p2ok','1');
  });
}

// Observer para PCP com proteção anti-loop
var _p2obs = null;
var _p2running = false;
function iniciarObserverPcp() {
  var tbody = document.getElementById('pcp-tbody');
  var content = document.getElementById('content');
  var alvo = tbody || content;
  if (!alvo || _p2obs) return;
  _p2obs = new MutationObserver(function(muts) {
    var temNovas = muts.some(function(m) {
      return Array.from(m.addedNodes).some(function(n) {
        return n.nodeType === 1 && !n.getAttribute('data-p2ok');
      });
    });
    if (!temNovas || _p2running) return;
    _p2running = true;
    clearTimeout(window._p2t);
    window._p2t = setTimeout(function() {
      aplicarPcpPatch();
      _p2running = false;
    }, 300);
  });
  _p2obs.observe(alvo, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(iniciarObserverPcp, 1000);
  setTimeout(aplicarPcpPatch, 2000);
});

// Reaplicar ao navegar
var _goOrig = window.go;
if (typeof _goOrig === 'function') {
  window.go = function(pg) {
    _p2obs && _p2obs.disconnect();
    _p2obs = null;
    _p2running = false;
    document.querySelectorAll('[data-p2ok]').forEach(function(el) {
      el.removeAttribute('data-p2ok');
    });
    var r = _goOrig.apply(this, arguments);
    setTimeout(iniciarObserverPcp, 800);
    setTimeout(aplicarPcpPatch, 1500);
    return r;
  };
}

})();
