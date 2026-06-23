(function() {
'use strict';

// 1. INTERCEPTAR FETCH — adicionar empresa_id correto em toneladas
var EUUIDS = {
  'C104':'df5f7672-0a6b-402d-ae65-296554236c31',
  'E1':'df5f7672-0a6b-402d-ae65-296554236c31',
  'E2':'e9b734dc-c7d5-4b04-898d-1ec7affa721e',
  'E3':'a6e5f5d8-4743-4ebe-885e-c2f0f741a667',
  'italy':'df5f7672-0a6b-402d-ae65-296554236c31',
  'cartoeste':'e9b734dc-c7d5-4b04-898d-1ec7affa721e',
  'oestepack':'a6e5f5d8-4743-4ebe-885e-c2f0f741a667'
};
function getEmpUUID() {
  var raw = (window._empresaAtual || window._empresaId ||
    (typeof getEmpresaId==='function' && getEmpresaId()) ||
    localStorage.getItem('empresa_id') || 'E1');
  var isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(raw));
  if (isUUID) return raw;
  return EUUIDS[String(raw)] || EUUIDS[String(raw).toUpperCase()] || 'df5f7672-0a6b-402d-ae65-296554236c31';
}
var _of = window.fetch.bind(window);
window.fetch = function(url, opts) {
  try {
    if (typeof url === 'string' && url.includes('/api/analises/toneladas')) {
      var sep = url.includes('?') ? '&' : '?';
      if (!url.includes('empresa_id=')) {
        url = url + sep + 'empresa_id=' + encodeURIComponent(getEmpUUID());
      }
    }
  } catch(e) {}
  return _of(url, opts);
};

// 2. MENUS — remover Relatório Mensal e Caixas Perdidas duplicada
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
  var folhas = Array.from(sb.querySelectorAll('*')).filter(function(el) {
    return el.children.length===0 && (el.textContent||'').trim().length>1;
  });
  // Remover Relatório Mensal
  folhas.forEach(function(el) {
    if (norm(el.textContent)!=='relatorio mensal') return;
    var p = el.closest('li') || el.closest('a') || el.parentElement;
    if (p && p!==sb) p.style.cssText='display:none!important';
    else el.style.cssText='display:none!important';
  });
  // Encontrar grupo Financeiro
  var grpFin = null;
  folhas.forEach(function(el) {
    if (grpFin||norm(el.textContent)!=='financeiro') return;
    var p=el.parentElement;
    for(var i=0;i<8;i++){
      if(!p||p===sb)break;
      if(p.querySelectorAll('a,li').length>=3){grpFin=p;break;}
      p=p.parentElement;
    }
  });
  // Remover Caixas Perdidas fora do Financeiro
  folhas.forEach(function(el) {
    if(norm(el.textContent)!=='caixas perdidas')return;
    if(grpFin&&grpFin.contains(el))return;
    var p=el.closest('li')||el.parentElement;
    if(p&&p!==sb)p.style.cssText='display:none!important';
  });
}
var _fmc=0,_fmi=setInterval(function(){
  _fmc++;try{fixMenus();}catch(e){}
  if(_fmc>=60)clearInterval(_fmi);
},1000);
document.addEventListener('DOMContentLoaded',function(){
  setTimeout(fixMenus,300);setTimeout(fixMenus,1000);
});

// 3. PCP — corrigir [object Object] em cores e máquinas
function fmtJson(v) {
  if(!v)return'—';
  try{
    var a=typeof v==='string'?JSON.parse(v):v;
    if(Array.isArray(a))return a.filter(Boolean).join(', ');
    if(typeof a==='object')return Object.values(a).filter(Boolean).join(', ');
    return String(a);
  }catch(e){return String(v);}
}
function fixPcpObjectObj() {
  document.querySelectorAll('#pcp-tbody td').forEach(function(td) {
    if((td.textContent||'').includes('[object Object]')) {
      var tr = td.closest('tr');
      if(!tr) return;
      var raw = tr.getAttribute('data-of');
      if(!raw) return;
      try {
        var of = JSON.parse(raw);
        var txt = td.textContent;
        if(txt.includes('[object Object]')) {
          // Tentar identificar se é cores ou máquinas
          var idx = Array.from(tr.querySelectorAll('td')).indexOf(td);
          var headers = document.querySelectorAll('#pcp-tbody thead th, table thead th');
          var hdr = headers[idx] ? (headers[idx].textContent||'').toLowerCase() : '';
          if(hdr.includes('cor')) td.textContent = fmtJson(of.cores_impressao);
          else if(hdr.includes('maq')) td.textContent = fmtJson(of.maq);
          else {
            // Tentar ambos
            if(of.cores_impressao) td.textContent = fmtJson(of.cores_impressao);
            else if(of.maq) td.textContent = fmtJson(of.maq);
          }
        }
      } catch(e){}
    }
  });
}
var _pObs=new MutationObserver(function(){
  clearTimeout(window._p2t);
  window._p2t=setTimeout(fixPcpObjectObj,500);
});
document.addEventListener('DOMContentLoaded',function(){
  var el=document.getElementById('content');
  if(el)_pObs.observe(el,{childList:true,subtree:true});
  setTimeout(fixPcpObjectObj,2000);
});

})();
