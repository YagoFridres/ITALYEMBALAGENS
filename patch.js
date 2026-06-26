window._comRodando = false;
window.__comUltimaExecucao = 0;
window.__comEntradaTs = 0;
if (!window.__comRodandoWatchdogInstalled) {
  window.__comRodandoWatchdogInstalled = true;
  setInterval(function() {
    try {
      if (!window._comRodando) return;
      var startedAt = Number(window.__comEntradaTs || 0) || 0;
      if (!startedAt) return;
      if ((Date.now() - startedAt) < 15000) return;
      window._comRodando = false;
      window.__comEntradaTs = 0;
      console.warn('[COM PATCH] watchdog: _comRodando resetado por timeout real');
    } catch (_) {}
  }, 5000);
}
if (!window._urlValida) {
  window._urlValida = function(url) {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.indexOf('[') >= 0 || url.indexOf(']') >= 0) return false;
    if (url.indexOf('undefined') >= 0 || url.indexOf('null') >= 0) return false;
    if (!(url.indexOf('http') === 0 || url.indexOf('/') === 0)) return false;
    return true;
  };
}
if (typeof window._fmtRs === 'undefined') {
  window._fmtRs = function(val) {
    var n = parseFloat(val);
    if (!Number.isFinite(n)) n = 0;
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
}
(function() {
  if (window.__patchImgFixInstalled) return;
  window.__patchImgFixInstalled = true;
  function install() {
    try {
      if (!document.head || document.getElementById('patch-img-fix')) return;
      var styleImgFix = document.createElement('style');
      styleImgFix.id = 'patch-img-fix';
      styleImgFix.textContent = 'img[src=\"\"], img:not([src]) { display: none !important; }';
      document.head.appendChild(styleImgFix);
    } catch (_) {}
    try {
      if (window.__patchImgErrorInstalled) return;
      window.__patchImgErrorInstalled = true;
      document.addEventListener('error', function(e) {
        try {
          if (e && e.target && e.target.tagName === 'IMG') e.target.style.display = 'none';
        } catch (_) {}
      }, true);
    } catch (_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();

(function() {
  if (window.__patchEstoqueChapasUiFixesInstalled) return;
  window.__patchEstoqueChapasUiFixesInstalled = true;

  function _isEstoqueChapasAtivo() {
    try {
      var pg = document.querySelector('#page-sel-chapas');
      if (!pg) return !!document.getElementById('tabelaChapasEstoque');
      if (pg.style && pg.style.display === 'none') return false;
      if (pg.hidden) return false;
      return pg.offsetParent !== null || !!document.getElementById('tabelaChapasEstoque');
    } catch (_) {
      return !!document.getElementById('tabelaChapasEstoque');
    }
  }

  function _getEstoqueUiHost() {
    try {
      return document.querySelector('#page-sel-chapas #tabelaChapasEstoque tbody')
        || document.querySelector('#page-sel-chapas #tabelaChapasEstoque')
        || document.querySelector('#page-sel-chapas')
        || document.getElementById('tabelaChapasEstoque')
        || document.getElementById('est-alertas')
        || null;
    } catch (_) {
      return null;
    }
  }

  function _disconnectEstoqueUiObserver() {
    try {
      if (window.__patchEstoqueUiObs && typeof window.__patchEstoqueUiObs.disconnect === 'function') {
        window.__patchEstoqueUiObs.disconnect();
      }
    } catch (_) {}
  }

  function _observeEstoqueUiHost() {
    try {
      var host = _getEstoqueUiHost();
      if (!host) return;
      var key = host.id || host.className || host.tagName || 'host';
      if (window.__patchEstoqueUiObsHostKey === key && window.__patchEstoqueUiObsConnected) return;
      _disconnectEstoqueUiObserver();
      window.__patchEstoqueUiObs.observe(host, { childList: true, subtree: false });
      window.__patchEstoqueUiObsHostKey = key;
      window.__patchEstoqueUiObsConnected = true;
    } catch (_) {
      window.__patchEstoqueUiObsConnected = false;
    }
  }

  function _normTxt(v) {
    return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }

  function _patchEstoqueAlertasBaixo() {
    try {
      var host = document.getElementById('est-alertas');
      if (!host) return;
      var wrapper = document.getElementById('patch-est-alertas-wrap');
      var extras = Array.prototype.slice.call(host.children || []).filter(function(node) {
        return node && node.id !== 'patch-est-alertas-wrap';
      });
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'patch-est-alertas-wrap';
        wrapper.innerHTML =
          '<button type="button" id="patch-est-alertas-toggle" style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(245,158,11,.35);background:rgba(245,158,11,.08);color:#f59e0b;font-weight:800;cursor:pointer"></button>' +
          '<div id="patch-est-alertas-body" style="display:none;margin-top:8px"></div>';
        host.appendChild(wrapper);
        wrapper.querySelector('#patch-est-alertas-toggle').addEventListener('click', function() {
          try {
            window.__patchEstAlertasOpen = !window.__patchEstAlertasOpen;
            _patchEstoqueAlertasBaixo();
          } catch (_) {}
        });
      }
      var body = wrapper.querySelector('#patch-est-alertas-body');
      extras.forEach(function(node) { body.appendChild(node); });
      var itens = Array.prototype.slice.call(body.children || []).filter(function(el) {
        return el && String((el.textContent || '')).trim();
      });
      var toggle = wrapper.querySelector('#patch-est-alertas-toggle');
      if (!itens.length) {
        wrapper.style.display = 'none';
        return;
      }
      wrapper.style.display = '';
      if (toggle) {
        toggle.textContent = '⚠️ Estoque Baixo (' + String(itens.length) + ' itens)' + (window.__patchEstAlertasOpen ? '  ▲' : '  ▼');
      }
      body.style.display = window.__patchEstAlertasOpen ? 'block' : 'none';
    } catch (_) {}
  }

  function _patchEstoqueAcoesTabela() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('#tabelaChapasEstoque #est-table-body tr')).forEach(function(tr) {
        var buttons = Array.prototype.slice.call(tr.querySelectorAll('button'));
        var pinBtns = buttons.filter(function(btn) {
          var txt = String(btn.textContent || '').trim();
          return txt.indexOf('📌') >= 0 || btn.classList.contains('btn-pin-chapa') || btn.classList.contains('patch-hub-pin-chapa');
        });
        pinBtns.slice(1).forEach(function(btn) { try { btn.remove(); } catch (_) {} });
        buttons.forEach(function(btn) {
          try {
            var txt = String(btn.textContent || '').trim().toLowerCase();
            var title = String(btn.getAttribute('title') || '').trim().toLowerCase();
            var onclick = String(btn.getAttribute('onclick') || '').trim();
            if (txt.indexOf('🔳') >= 0 || txt.indexOf('qr') >= 0 || title.indexOf('qr code') >= 0 || onclick.indexOf('abrirModalQRCodeEstoque') >= 0) {
              btn.remove();
            }
          } catch (_) {}
        });
      });
      setTimeout(function() {
        try {
          var pins = document.querySelectorAll('button[title*="pin"], button[title*="Pin"], .btn-pin, [data-acao="pin"], .btn-pin-chapa, .patch-hub-pin-chapa');
          if (pins.length > 1) {
            for (var i = 1; i < pins.length; i += 1) {
              try { pins[i].remove(); } catch (_) {}
            }
          }
        } catch (_) {}
      }, 500);
    } catch (_) {}
  }

  function _patchEstoqueOcultarColunasInuteis() {
    try {
      var tabela = document.getElementById('tabelaChapasEstoque');
      if (!tabela) return;
      var headers = Array.prototype.slice.call(tabela.querySelectorAll('thead th'));
      headers.forEach(function(th) {
        try {
          var txt = _normTxt(th.textContent || '');
          if (['ultimo preco', 'consumo/mes', 'dias'].indexOf(txt) === -1) return;
          var idx = Number(th.cellIndex) + 1;
          if (!(idx > 0)) return;
          Array.prototype.slice.call(tabela.querySelectorAll('tr th:nth-child(' + idx + '), tr td:nth-child(' + idx + ')')).forEach(function(cell) {
            try { cell.style.display = 'none'; } catch (_) {}
          });
        } catch (_) {}
      });
    } catch (_) {}
  }

  function _tickEstoqueUiFixes() {
    if (!_isEstoqueChapasAtivo()) {
      try {
        if (window._estoqueInterval) {
          clearInterval(window._estoqueInterval);
          window._estoqueInterval = null;
        }
      } catch (_) {}
      return;
    }
    if (window._estoqueRenderizando) return;
    window._estoqueRenderizando = true;
    _disconnectEstoqueUiObserver();
    try {
      _patchEstoqueAlertasBaixo();
      _patchEstoqueAcoesTabela();
      _patchEstoqueOcultarColunasInuteis();
    } finally {
      window._estoqueRenderizando = false;
      _observeEstoqueUiHost();
    }
  }

  try {
    if (!window.__patchEstoqueUiObs) {
      window.__patchEstoqueUiObs = new MutationObserver(function() {
        if (window._pausarObservers) return;
        if (window._estoqueRenderizando) return;
        if (!_isEstoqueChapasAtivo()) {
          try { clearTimeout(window.__patchEstoqueUiTimer); } catch (_) {}
          try {
            if (window._estoqueInterval) {
              clearInterval(window._estoqueInterval);
              window._estoqueInterval = null;
            }
          } catch (_) {}
          return;
        }
        try { clearTimeout(window.__patchEstoqueUiTimer); } catch (_) {}
        window.__patchEstoqueUiTimer = setTimeout(_tickEstoqueUiFixes, 120);
      });
      _observeEstoqueUiHost();
    }
    if (!window.__patchEstoqueUiRootObs) {
      window.__patchEstoqueUiRootObs = new MutationObserver(function() {
        if (window._pausarObservers) return;
        try { clearTimeout(window.__patchEstoqueUiRootTimer); } catch (_) {}
        window.__patchEstoqueUiRootTimer = setTimeout(function() {
          if (!_isEstoqueChapasAtivo()) {
            try {
              if (window._estoqueInterval) {
                clearInterval(window._estoqueInterval);
                window._estoqueInterval = null;
              }
            } catch (_) {}
            return;
          }
          _observeEstoqueUiHost();
          _tickEstoqueUiFixes();
        }, 160);
      });
      window.__patchEstoqueUiRootObs.observe(document.body, { childList: true, subtree: false });
    }
  } catch (_) {}

  setTimeout(_tickEstoqueUiFixes, 500);
  setTimeout(_tickEstoqueUiFixes, 1500);
})();

(function() {
  if (window.__patchSimuladorDesperdicioInstalled) return;
  window.__patchSimuladorDesperdicioInstalled = true;

  function _simdToNum(v) {
    var n = Number(String(v == null ? '' : v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  function _simdParseDimensoes(chapa) {
    var larguraAvulsa = _simdToNum(chapa && (chapa.largura ?? chapa.largura_mm ?? chapa.dim_largura ?? chapa.caixa_largura));
    var comprimentoAvulso = _simdToNum(chapa && (chapa.comprimento ?? chapa.comprimento_mm ?? chapa.dim_comprimento ?? chapa.caixa_comprimento));
    if (larguraAvulsa > 0 && comprimentoAvulso > 0) {
      return { largura: larguraAvulsa, comprimento: comprimentoAvulso };
    }
    var src = String(chapa && (chapa.tamanho || chapa.tam || chapa.nome || chapa.nomenclatura || '') || '').trim();
    var m = src.match(/(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/);
    if (!m) return null;
    var d1 = _simdToNum(m[1]);
    var d2 = _simdToNum(m[2]);
    if (!(d1 > 0 && d2 > 0)) return null;
    return { largura: d1, comprimento: d2 };
  }

  async function _simdCarregarChapasPatched() {
    if (Array.isArray(window._simdChapasCache) && window._simdChapasCache.length) return window._simdChapasCache;
    try {
      var sbClient = window._supabase || window.supabase || null;
      if (sbClient && typeof sbClient.from === 'function') {
        var sbRes = await sbClient
          .from('chapas_estoque_v2')
          .select('*')
          .gt('quantidade', 0)
          .limit(1000);
        if (!sbRes.error && Array.isArray(sbRes.data) && sbRes.data.length) {
          window._simdChapasCache = sbRes.data;
          return sbRes.data;
        }
      }
    } catch (_) {}
    try {
      var token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || '').trim();
      var headers = token ? { Authorization: 'Bearer ' + token } : {};
      var resp = await fetch('/api/chapas_estoque?limit=1000', { headers: headers });
      var data = await resp.json().catch(function() { return null; });
      var arr = Array.isArray(data) ? data : (Array.isArray(data && data.data) ? data.data : (Array.isArray(data && data.chapas) ? data.chapas : []));
      arr = arr.filter(function(ch) {
        return (Number(ch && (ch.quantidade ?? ch.qtd ?? ch.quantidade_atual) || 0) || 0) > 0;
      });
      window._simdChapasCache = arr;
      return arr;
    } catch (_) {
      return [];
    }
  }

  function _simdCalcularLinha(chapa, largNec, compNec, qtdPedido) {
    var dims = _simdParseDimensoes(chapa);
    if (!dims) return null;
    var variantes = [
      { cols: Math.floor(dims.largura / largNec), rows: Math.floor(dims.comprimento / compNec), largura: dims.largura, comprimento: dims.comprimento },
      { cols: Math.floor(dims.largura / compNec), rows: Math.floor(dims.comprimento / largNec), largura: dims.largura, comprimento: dims.comprimento }
    ];
    variantes = variantes.filter(function(v) { return v.cols > 0 && v.rows > 0; });
    if (!variantes.length) return null;
    variantes.sort(function(a, b) { return (b.cols * b.rows) - (a.cols * a.rows); });
    var best = variantes[0];
    var planPorChapa = best.cols * best.rows;
    var areaChapa = dims.largura * dims.comprimento;
    var areaPlan = largNec * compNec;
    var desperdicioArea = Math.max(0, areaChapa - (planPorChapa * areaPlan));
    var desperdicioPct = areaChapa > 0 ? Math.round((desperdicioArea / areaChapa) * 10000) / 100 : 100;
    var estoque = Math.trunc(_simdToNum(chapa && (chapa.quantidade ?? chapa.qtd ?? chapa.quantidade_atual)));
    var valorUnit = _simdToNum(chapa && (chapa.valor_unitario ?? chapa.val));
    var chapasNec = (qtdPedido > 0 && planPorChapa > 0) ? Math.ceil(qtdPedido / planPorChapa) : null;
    return {
      id: chapa && chapa.id,
      nome: chapa && (chapa.nome || chapa.nomenclatura || chapa.nom || 'Chapa'),
      fornecedor: chapa && (chapa.fornecedor || chapa.forn || '—'),
      tamanho: chapa && (chapa.tamanho || chapa.tam || '—'),
      quantidade: estoque,
      valor_unitario: valorUnit,
      planificacoes_por_chapa: planPorChapa,
      desperdicio_real_pct: desperdicioPct,
      desperdicio_area: desperdicioArea,
      chapas_necessarias: chapasNec
    };
  }

  function _simdRenderResultadosPatched(rows) {
    var wrap = document.getElementById('simd-tabela-wrap');
    var linhas = document.getElementById('simd-linhas');
    var aviso = document.getElementById('simd-aviso');
    if (!wrap || !linhas) {
      var host = document.getElementById('sim-resultado');
      if (!host) {
        var parent = document.querySelector('.simulador-container, #simulador-desperdicio, .simulador-wrapper, #simd-resultado')
          || (document.getElementById('simd-btn') ? document.getElementById('simd-btn').closest('div, form, section') : null)
          || document.body;
        if (!parent) return;
        host = document.createElement('div');
        host.id = 'sim-resultado';
        host.style.cssText = 'margin-top:16px';
        parent.appendChild(host);
      }
      if (!Array.isArray(rows) || !rows.length) {
        host.innerHTML = '<p style="color:#f59e0b;margin-top:16px">Nenhuma chapa do estoque comporta essa planificação.</p>';
        return;
      }
      host.innerHTML = ''
        + '<table style="width:100%;margin-top:16px;border-collapse:collapse;font-size:13px">'
        + '<thead><tr style="border-bottom:1px solid #333">'
        + '<th style="text-align:left;padding:6px">Nome/Uso</th>'
        + '<th style="text-align:left;padding:6px">Fornecedor</th>'
        + '<th style="text-align:center;padding:6px">Tamanho</th>'
        + '<th style="text-align:center;padding:6px">Planif./Chapa</th>'
        + '<th style="text-align:center;padding:6px">Desperdício</th>'
        + '<th style="text-align:center;padding:6px">Estoque</th>'
        + '<th style="text-align:right;padding:6px">R$/un</th>'
        + '</tr></thead><tbody>'
        + rows.map(function(r) {
          var cor = Number(r && r.desperdicio_real_pct || 0) < 10 ? '#4caf50' : (Number(r && r.desperdicio_real_pct || 0) < 25 ? '#f59e0b' : '#ef4444');
          return ''
            + '<tr style="border-bottom:1px solid #222">'
            + '<td style="padding:6px">' + String(r && r.nome || '—').replace(/</g, '&lt;') + '</td>'
            + '<td style="padding:6px">' + String(r && r.fornecedor || '—').replace(/</g, '&lt;') + '</td>'
            + '<td style="text-align:center;padding:6px">' + String(r && r.tamanho || '—').replace(/</g, '&lt;') + '</td>'
            + '<td style="text-align:center;padding:6px">' + String(r && r.planificacoes_por_chapa || 0) + '</td>'
            + '<td style="text-align:center;padding:6px;color:' + cor + '">' + String(Number(r && r.desperdicio_real_pct || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })) + '%</td>'
            + '<td style="text-align:center;padding:6px">' + String(r && r.quantidade || 0) + '</td>'
            + '<td style="text-align:right;padding:6px">' + ((Number(r && r.valor_unitario || 0) > 0) ? window._fmtRs(r.valor_unitario) : '—') + '</td>'
            + '</tr>';
        }).join('')
        + '</tbody></table>';
      return;
    }
    var head = wrap.querySelector('.simd-grid');
    if (head) {
      head.innerHTML =
        '<div>Desperd.</div>' +
        '<div>Nome/Uso</div>' +
        '<div>Dimensões</div>' +
        '<div>Fornecedor</div>' +
        '<div style="text-align:center">Plan./chapa</div>' +
        '<div style="text-align:center">Chapas nec.</div>' +
        '<div style="text-align:right">Estoque</div>' +
        '<div style="text-align:right">R$/un</div>';
    }
    if (!Array.isArray(rows) || !rows.length) {
      if (aviso) {
        aviso.style.display = 'block';
        aviso.textContent = 'Nenhuma chapa em estoque é compatível com estas medidas. Verifique se há chapas cadastradas ou ajuste as medidas.';
      }
      linhas.innerHTML = '';
      return;
    }
    if (aviso) aviso.style.display = 'none';
    linhas.innerHTML = rows.map(function(r, idx) {
      var bg = idx === 0 ? 'rgba(34,197,94,.10)' : 'transparent';
      return ''
        + '<div class="simd-grid" style="display:grid;grid-template-columns:60px 1fr 160px 120px 100px 100px 90px 100px;padding:11px 16px;gap:8px;align-items:center;background:' + bg + ';border-bottom:0.5px solid rgba(255,255,255,0.05)">'
        + '<div style="font-size:16px;font-weight:800;color:' + (idx === 0 ? '#22c55e' : '#f59e0b') + ';text-align:center">' + String(Number(r.desperdicio_real_pct || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + '%</div>'
        + '<div><div style="font-size:13px;font-weight:700;color:#f8fafc">' + String(r.nome || 'Chapa').replace(/</g, '&lt;') + '</div></div>'
        + '<div style="font-size:12px;color:#cbd5e1">' + String(r.tamanho || '—').replace(/</g, '&lt;') + '</div>'
        + '<div style="font-size:12px;color:#94a3b8">' + String(r.fornecedor || '—').replace(/</g, '&lt;') + '</div>'
        + '<div style="font-size:13px;color:#e2e8f0;text-align:center">' + String(r.planificacoes_por_chapa || 0) + '</div>'
        + '<div style="font-size:13px;color:#e2e8f0;text-align:center">' + String(r.chapas_necessarias == null ? '—' : r.chapas_necessarias) + '</div>'
        + '<div style="font-size:13px;color:#e2e8f0;text-align:right">' + String(r.quantidade || 0) + '</div>'
        + '<div style="font-size:13px;color:#e2e8f0;text-align:right">' + ((Number(r.valor_unitario || 0) > 0) ? ('R$ ' + Number(r.valor_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '—') + '</div>'
        + '</div>';
    }).join('');
  }

  async function _simdCalcularPatched() {
    var larg = _simdToNum((document.getElementById('simd-larg') || {}).value);
    var comp = _simdToNum((document.getElementById('simd-comp') || {}).value);
    var qtdPedido = Math.trunc(_simdToNum((document.getElementById('simd-qtd') || {}).value));
    var loading = document.getElementById('simd-loading');
    var resultado = document.getElementById('simd-resultado');
    var info = document.getElementById('simd-info-planif');
    if (!(larg > 0 && comp > 0)) {
      try { alert('Preencha largura e comprimento necessários.'); } catch (_) {}
      return;
    }
    if (loading) loading.style.display = 'block';
    if (resultado) resultado.style.display = 'none';
    if (info) {
      info.innerHTML = 'Planificação: <strong style="color:rgba(255,255,255,0.8)">' + String(comp) + ' × ' + String(larg) + ' mm</strong> — Área: <strong style="color:rgba(255,255,255,0.8)">' + ((larg * comp) / 1000000).toFixed(4) + ' m²</strong>';
    }
    try {
      try { console.log('[SIMD PATCH] calcular click', { largura: larg, comprimento: comp, quantidade: qtdPedido }); } catch (_) {}
      var baseRows = [];
      if (window._simdChapaSelecionada) baseRows = [window._simdChapaSelecionada];
      else baseRows = await _simdCarregarChapasPatched();
      try {
        console.log('[SIMD PATCH] chapas carregadas:', Array.isArray(baseRows) ? baseRows.length : 0);
        if (Array.isArray(baseRows) && baseRows[0]) console.log('[SIMD PATCH] primeira chapa:', baseRows[0]);
      } catch (_) {}
      var rows = (Array.isArray(baseRows) ? baseRows : []).map(function(chapa) {
        return _simdCalcularLinha(chapa, larg, comp, qtdPedido);
      }).filter(Boolean);
      rows.sort(function(a, b) {
        var da = Number(a && a.desperdicio_real_pct || 0);
        var db = Number(b && b.desperdicio_real_pct || 0);
        if (da !== db) return da - db;
        return Number(a && a.desperdicio_area || 0) - Number(b && b.desperdicio_area || 0);
      });
      if (loading) loading.style.display = 'none';
      if (resultado) resultado.style.display = 'block';
      _simdRenderResultadosPatched(rows);
    } catch (e) {
      if (loading) loading.style.display = 'none';
      if (resultado) resultado.style.display = 'block';
      _simdRenderResultadosPatched([]);
      try { console.error('[SIMD PATCH]', e); } catch (_) {}
    }
  }

  function _bindSimdPatch() {
    try {
      var btn = document.getElementById('simd-btn');
      if (btn && btn.dataset.patchSimdBound !== '1') {
        btn.dataset.patchSimdBound = '1';
        try { btn.removeAttribute('onclick'); } catch (_) {}
        btn.addEventListener('click', function(e) {
          try { e.preventDefault(); } catch (_) {}
          try { console.log('[SIMD PATCH] botao calcular acionado'); } catch (_) {}
          _simdCalcularPatched();
        });
      }
      ['simd-larg', 'simd-comp', 'simd-qtd'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el.dataset.patchSimdInput !== '1') {
          el.dataset.patchSimdInput = '1';
          el.addEventListener('input', function() {
            try { if (typeof window._simdVerificarCampos === 'function') window._simdVerificarCampos(); } catch (_) {}
          });
        }
      });
      var busca = document.getElementById('simd-busca-chapa');
      if (busca && busca.dataset.patchSimdBusca !== '1') {
        busca.dataset.patchSimdBusca = '1';
        busca.addEventListener('input', function(e) {
          try { if (typeof window._simdBuscarChapa === 'function') window._simdBuscarChapa(String((e.target || {}).value || '')); } catch (_) {}
        });
      }
      var limpar = document.getElementById('simd-btn-limpar-chapa');
      if (limpar && limpar.dataset.patchSimdClear !== '1') {
        limpar.dataset.patchSimdClear = '1';
        limpar.addEventListener('click', function(e) {
          try { e.preventDefault(); } catch (_) {}
          try { if (typeof window._simdLimparChapaSelecionada === 'function') window._simdLimparChapaSelecionada(); } catch (_) {}
        });
      }
    } catch (_) {}
  }

  try { window._simdCarregarChapas = _simdCarregarChapasPatched; } catch (_) {}
  try { window._simdCalcular = _simdCalcularPatched; } catch (_) {}

  try {
    if (!window.__patchSimdObs) {
      window.__patchSimdObs = new MutationObserver(function() {
        if (window._pausarObservers) return;
        try { clearTimeout(window.__patchSimdObsTimer); } catch (_) {}
        window.__patchSimdObsTimer = setTimeout(_bindSimdPatch, 100);
      });
      window.__patchSimdObs.observe(document.body, { childList: true, subtree: true });
    }
  } catch (_) {}

  setTimeout(_bindSimdPatch, 600);
})();
// LIMPEZA DE OVERLAYS ÓRFÃOS — executar imediatamente
if (typeof NOTIFICACOES === 'undefined') window.NOTIFICACOES = [];
window.NOTIFICACOES = window.NOTIFICACOES || [];
(function limparOverlaysOrfaos() {
  var _OVERLAY_GRACE = 500;
  try { if (!window.__overlayTimestamps) window.__overlayTimestamps = {}; } catch (_) {}
  function removerOrfaos() {
    var removed = 0;
    try {
      document.querySelectorAll('div').forEach(function(el) {
        try {
          var s = el && el.style ? el.style : {};
          var computed = window.getComputedStyle ? window.getComputedStyle(el) : null;
          var pos = String((s && s.position) || (computed && computed.position) || '').trim().toLowerCase();
          var isFixed = pos === 'fixed';
          var inset = String((s && s.inset) || (computed && computed.inset) || '').trim();
          var cobreTudo = inset === '0' || (String(s.top) === '0px' || String(s.top) === '0') && (String(s.left) === '0px' || String(s.left) === '0') && (String(s.right) === '0px' || String(s.right) === '0') && (String(s.bottom) === '0px' || String(s.bottom) === '0');
          var semConteudo = (!el.children || el.children.length === 0) && !String(el.textContent || '').trim();
          var z = parseInt(String((s && s.zIndex) || (computed && computed.zIndex) || '0'), 10);
          var altaZIndex = Number.isFinite(z) && z > 9000;
          var display = String((computed && computed.display) || '').trim().toLowerCase();
          var visible = display !== 'none';
          var key = '';
          try { key = String(el.id || el.className || '').trim(); } catch (_) { key = ''; }
          if (!key) return;
          try {
            if (!window.__overlayTimestamps[key]) {
              window.__overlayTimestamps[key] = Date.now();
              return;
            }
          } catch (_) {}
          var age = 0;
          try { age = Date.now() - (window.__overlayTimestamps[key] || 0); } catch (_) { age = 0; }
          if (visible && age >= _OVERLAY_GRACE && isFixed && (cobreTudo || altaZIndex) && semConteudo) {
            try { console.warn('[PATCH] Removendo overlay órfão:', el.id || el.className || '(sem id)'); } catch (_) {}
            el.remove();
            removed++;
          }
        } catch (_) {}
      });
    } catch (_) {}

    try {
      ['hub-inteligencia-wrap-overlay', 'modal-overlay', 'backdrop', '_modal-backdrop'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
          try {
            var computed = window.getComputedStyle ? window.getComputedStyle(el) : null;
            var display = String((computed && computed.display) || '').trim().toLowerCase();
            var visible = display !== 'none';
            if (!window.__overlayTimestamps[id]) { window.__overlayTimestamps[id] = Date.now(); return; }
            var age = Date.now() - (window.__overlayTimestamps[id] || 0);
            if (visible && age >= _OVERLAY_GRACE) {
              try { console.warn('[PATCH] Removendo:', id); } catch (_) {}
              el.remove();
              removed++;
            }
          } catch (_) {}
        }
      });
    } catch (_) {}

    if (removed > 0) {
      try { document.body && (document.body.style.pointerEvents = ''); } catch (_) {}
      try { document.body && (document.body.style.overflow = ''); } catch (_) {}
      try { document.documentElement && (document.documentElement.style.overflow = ''); } catch (_) {}
    }
  }

  function killObservers() {
    try { if (window._hubObs && typeof window._hubObs.disconnect === 'function') window._hubObs.disconnect(); } catch (_) {}
    try { window._hubObs = null; } catch (_) {}
    try { if (window.__patchHubIntelObs && typeof window.__patchHubIntelObs.disconnect === 'function') window.__patchHubIntelObs.disconnect(); } catch (_) {}
    try { window.__patchHubIntelObs = null; } catch (_) {}
  }

  function run() {
    killObservers();
    removerOrfaos();
  }

  try { run(); } catch (_) {}
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      run();
      setTimeout(run, 700);
    });
  } else {
    setTimeout(run, 50);
    setTimeout(run, 700);
  }

  if (!window.__patchEscOverlayCleaner) {
    window.__patchEscOverlayCleaner = true;
    document.addEventListener('keydown', function(e) {
      try {
        if (!e || e.key !== 'Escape') return;
        window._ofRapidaEditandoId = null;
        run();
      } catch (_) {}
    }, true);
  }
})();

(function() {
  if (window.__patchPinsHubInstalled) return;
  window.__patchPinsHubInstalled = true;

  function getToken() {
    try { return String(localStorage.getItem('token') || localStorage.getItem('access_token') || window._token || '').trim(); } catch (_) { return ''; }
  }
  function authHeaders(extra) {
    var token = getToken();
    return Object.assign({}, extra || {}, token ? { Authorization: 'Bearer ' + token } : {});
  }
  async function apiJson(url, opts) {
    var o = opts || {};
    var headers = authHeaders(o.body ? { 'Content-Type': 'application/json' } : {});
    if (o.headers) headers = Object.assign(headers, o.headers);
    var resp = await fetch(url, {
      method: o.method || 'GET',
      headers: headers,
      body: o.body ? JSON.stringify(o.body) : undefined
    });
    var json = await resp.json().catch(function() { return null; });
    if (!resp.ok || (json && json.ok === false)) throw new Error(String(json && json.error || resp.status));
    return json;
  }
  function notify(msg, color) {
    try {
      if (typeof window.toast === 'function') return window.toast(String(msg || ''), color || 'var(--green)');
    } catch (_) {}
    try {
      if (typeof window.toastHotfix === 'function') return window.toastHotfix(String(msg || ''));
    } catch (_) {}
    try { alert(String(msg || '')); } catch (_) {}
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function fmtDate(v) {
    try {
      if (!v) return '—';
      return new Date(String(v)).toLocaleString('pt-BR');
    } catch (_) { return '—'; }
  }
  function pinIcon(tipo) {
    var t = String(tipo || '').trim().toLowerCase();
    if (t === 'of') return '📋';
    if (t === 'chapa') return '📦';
    if (t === 'tinta') return '🟡';
    if (t === 'material') return '🔧';
    if (t === 'faca') return '🗡️';
    if (t === 'cliche') return '🖨️';
    return '📌';
  }
  function ensurePinUi() {
    if (document.getElementById('patch-pins-style')) return;
    var st = document.createElement('style');
    st.id = 'patch-pins-style';
    st.textContent = ''
      + '#patch-pin-modal{position:fixed;inset:0;background:rgba(0,0,0,.65);display:none;align-items:center;justify-content:center;z-index:100100}'
      + '#patch-pin-modal .ppm-box{width:min(520px,92vw);background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:16px;color:#fff}'
      + '#patch-pin-modal .ppm-title{font-size:16px;font-weight:800;margin-bottom:8px}'
      + '#patch-pin-modal .ppm-sub{font-size:12px;color:#94a3b8;margin-bottom:10px}'
      + '#patch-pin-modal textarea{width:100%;min-height:110px;background:#111827;border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;padding:12px;resize:vertical}'
      + '#patch-pin-modal .ppm-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}'
      + '#patch-pin-modal .ppm-actions button{background:#1e293b;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:8px 12px;cursor:pointer}'
      + '#patch-pin-modal .ppm-actions .ppm-save{background:#f59e0b;border-color:#f59e0b;color:#111827;font-weight:800}'
      + '#hub-pins-ativos{background:var(--bg2,#111827);border:1px solid var(--border,#334155);border-radius:12px;padding:18px 20px;margin:0 0 24px}'
      + '#hub-pins-ativos .hub-pins-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}'
      + '#hub-pins-ativos .hub-pin-card{background:#1a2744;border-left:4px solid #f59e0b;border-radius:8px;padding:12px 16px;display:flex;gap:12px;align-items:flex-start;cursor:pointer;transition:filter .15s}'
      + '#hub-pins-ativos .hub-pin-card:hover{filter:brightness(1.1)}'
      + '#hub-pins-ativos .hub-pin-ico{font-size:20px;line-height:1;margin-top:2px}'
      + '#hub-pins-ativos .hub-pin-main{flex:1;min-width:0}'
      + '#hub-pins-ativos .hub-pin-titulo{font-size:14px;font-weight:800;color:#f8fafc}'
      + '#hub-pins-ativos .hub-pin-sub{font-size:12px;color:#cbd5e1;margin-top:2px}'
      + '#hub-pins-ativos .hub-pin-obs{font-size:12px;color:#f8fafc;font-style:italic;margin-top:8px}'
      + '#hub-pins-ativos .hub-pin-meta{font-size:11px;color:#94a3b8;margin-top:8px}'
      + '#hub-pins-ativos .hub-pin-del{background:transparent;border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:8px;padding:6px 8px;cursor:pointer}';
    document.head.appendChild(st);

    var modal = document.createElement('div');
    modal.id = 'patch-pin-modal';
    modal.innerHTML = ''
      + '<div class="ppm-box">'
      + '  <div class="ppm-title">Adicionar observação para o pin (opcional):</div>'
      + '  <div class="ppm-sub" id="patch-pin-modal-sub"></div>'
      + '  <textarea id="patch-pin-modal-text" placeholder="Ex: prioridade para hoje, item crítico, acompanhar no Hub..."></textarea>'
      + '  <div class="ppm-actions">'
      + '    <button type="button" id="patch-pin-modal-cancel">Cancelar</button>'
      + '    <button type="button" class="ppm-save" id="patch-pin-modal-save">📌 Fixar no Hub</button>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal && typeof modal._resolver === 'function') modal._resolver(null);
    });
    modal.querySelector('#patch-pin-modal-cancel').onclick = function() {
      if (typeof modal._resolver === 'function') modal._resolver(null);
    };
    modal.querySelector('#patch-pin-modal-save').onclick = function() {
      if (typeof modal._resolver === 'function') modal._resolver(String((document.getElementById('patch-pin-modal-text') || {}).value || ''));
    };
  }
  function askPinObservation(label) {
    ensurePinUi();
    return new Promise(function(resolve) {
      var modal = document.getElementById('patch-pin-modal');
      var textarea = document.getElementById('patch-pin-modal-text');
      var sub = document.getElementById('patch-pin-modal-sub');
      if (sub) sub.textContent = label ? ('Item: ' + String(label)) : '';
      if (textarea) textarea.value = '';
      modal._resolver = function(value) {
        try { modal.style.display = 'none'; } catch (_) {}
        var resolver = modal._resolver;
        modal._resolver = null;
        if (resolver) resolve(value);
      };
      modal.style.display = 'flex';
      setTimeout(function() { try { textarea && textarea.focus(); } catch (_) {} }, 30);
    });
  }

  function _pinKey(tipo, referenciaId) {
    return String(tipo || '').trim().toLowerCase() + '::' + String(referenciaId || '').trim();
  }
  async function fetchPins(force) {
    var ttl = 60000;
    var now = Date.now();
    var cache = window.__patchPinsCache || null;
    if (!force && cache && cache.ts && (now - cache.ts) < ttl && Array.isArray(cache.data)) return cache.data.slice();
    if (!force && window.__patchPinsPromise) return window.__patchPinsPromise;
    window.__patchPinsPromise = apiJson('/api/pins')
      .then(function(json) {
        var pins = Array.isArray(json && json.data) ? json.data : [];
        var map = Object.create(null);
        pins.forEach(function(pin) {
          var key = _pinKey(pin && pin.tipo, pin && pin.referencia_id);
          if (key) map[key] = pin;
        });
        window.__patchPinsCache = { ts: Date.now(), data: pins.slice(), map: map };
        window.__patchPinsPromise = null;
        return pins.slice();
      })
      .catch(function(err) {
        window.__patchPinsPromise = null;
        throw err;
      });
    return window.__patchPinsPromise;
  }
  function _getPinsMap() {
    var cache = window.__patchPinsCache || null;
    return cache && cache.map ? cache.map : Object.create(null);
  }
  function _isPinned(tipo, referenciaId) {
    var key = _pinKey(tipo, referenciaId);
    return !!_getPinsMap()[key];
  }
  function _pinBtnColors(tipo, referenciaId) {
    return _isPinned(tipo, referenciaId)
      ? { color: '#f59e0b', border: 'rgba(245,158,11,.45)', background: 'rgba(245,158,11,.14)' }
      : { color: '#94a3b8', border: 'rgba(148,163,184,.28)', background: 'rgba(148,163,184,.08)' };
  }
  function _pinBtnStyleAttr(tipo, referenciaId) {
    var c = _pinBtnColors(tipo, referenciaId);
    return 'color:' + c.color + ';border-color:' + c.border + ';background:' + c.background + ';';
  }
  function _applyPinStateToButton(btn) {
    if (!btn) return;
    var tipo = String(btn.getAttribute('data-pin-type') || '').trim().toLowerCase();
    var ref = String(btn.getAttribute('data-pin-id') || '').trim();
    if (!tipo || !ref) return;
    var c = _pinBtnColors(tipo, ref);
    try { btn.style.color = c.color; } catch (_) {}
    try { btn.style.borderColor = c.border; } catch (_) {}
    try { btn.style.background = c.background; } catch (_) {}
    try { btn.setAttribute('title', (_isPinned(tipo, ref) ? 'Pin ativo no Hub' : 'Fixar no Hub')); } catch (_) {}
  }
  function _applyPinStates(root) {
    var scope = root && root.querySelectorAll ? root : document;
    Array.prototype.slice.call(scope.querySelectorAll('[data-pin-type][data-pin-id]')).forEach(_applyPinStateToButton);
  }
  async function _refreshPinStates(force) {
    try { await fetchPins(!!force); } catch (_) {}
    _applyPinStates(document);
  }
  async function renderHubPins() {
    ensurePinUi();
    var shell = document.querySelector('#page-hub .hub-shell');
    if (!shell) return;
    var kpis = document.getElementById('hub-kpis');
    var block = document.getElementById('hub-pins-ativos');
    if (!block) {
      block = document.createElement('div');
      block.id = 'hub-pins-ativos';
      block.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px"><div><div style="font-size:18px;font-weight:800;color:#f8fafc">📌 Pins Ativos</div><div style="font-size:12px;color:#94a3b8">Visível para toda a empresa</div></div><button type="button" id="hub-pins-refresh" style="background:transparent;border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer">Atualizar</button></div><div id="hub-pins-body" class="hub-pins-grid"><div style="color:#94a3b8">Carregando...</div></div>';
      if (kpis && kpis.parentNode === shell) {
        if (kpis.nextSibling) shell.insertBefore(block, kpis.nextSibling);
        else shell.appendChild(block);
      } else {
        shell.prepend(block);
      }
      var btnRefresh = block.querySelector('#hub-pins-refresh');
      if (btnRefresh) btnRefresh.onclick = function() { renderHubPins(); };
      block.addEventListener('click', function(e) {
        var delBtn = e && e.target && (e.target.closest ? e.target.closest('.hub-pin-del') : null);
        if (delBtn) {
          try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
          apiJson('/api/pins/' + encodeURIComponent(String(delBtn.getAttribute('data-pin-id') || '')), { method: 'DELETE' })
            .then(function() {
              notify('🗑️ Pin removido', 'var(--green)');
              _refreshPinStates(true).catch(function() {});
              renderHubPins();
            })
            .catch(function(err) { notify('Erro ao remover pin: ' + String(err && err.message || err), 'var(--red)'); });
          return;
        }
        var card = e && e.target && (e.target.closest ? e.target.closest('.hub-pin-card') : null);
        if (!card) return;
        var pinId = String(card.getAttribute('data-pin-id') || '').trim();
        if (!pinId) return;
        var pin = (window.__hubPinsCache || []).find(function(p) { return String(p && p.id || '') === pinId; }) || null;
        if (!pin) return;
        try { window.__patchAbrirItemPinado(pin); } catch (_) {}
      });
    }
    var body = document.getElementById('hub-pins-body');
    if (!body) return;
    body.innerHTML = '<div style="color:#94a3b8">Carregando...</div>';
    try {
      var pins = await fetchPins();
      window.__hubPinsCache = pins.slice();
      if (!pins.length) {
        body.innerHTML = '<div style="color:#94a3b8">Nenhum pin ativo no momento.</div>';
        return;
      }
      body.innerHTML = pins.map(function(pin) {
        var titulo = String(pin && pin.titulo || pin && pin.referencia_id || 'Item');
        var subtitulo = String(pin && pin.subtitulo || '').trim();
        var obs = String(pin && pin.observacao || '').trim();
        var meta = 'Fixado por ' + String(pin && pin.criado_por || 'sistema') + ' em ' + fmtDate(pin && pin.criado_em);
        return ''
          + '<div class="hub-pin-card" data-pin-id="' + esc(pin && pin.id || '') + '">'
          + '  <div class="hub-pin-ico">' + pinIcon(pin && pin.tipo) + '</div>'
          + '  <div class="hub-pin-main">'
          + '    <div class="hub-pin-titulo">' + esc(titulo) + '</div>'
          + (subtitulo ? '<div class="hub-pin-sub">' + esc(subtitulo) + '</div>' : '')
          + (obs ? '<div class="hub-pin-obs">' + esc(obs) + '</div>' : '')
          + '    <div class="hub-pin-meta">' + esc(meta) + '</div>'
          + '  </div>'
          + '  <button type="button" class="hub-pin-del" data-pin-id="' + esc(pin && pin.id || '') + '">🗑️</button>'
          + '</div>';
      }).join('');
    } catch (e) {
      body.innerHTML = '<div style="color:#fca5a5">Erro ao carregar pins: ' + esc(e && e.message || e) + '</div>';
    }
  }

  window.__patchAbrirItemPinado = function(pin) {
    var tipo = String(pin && pin.tipo || '').trim().toLowerCase();
    var detalhe = pin && pin.detalhe || {};
    var id = String(detalhe && detalhe.id || pin && pin.referencia_id || '').trim();
    try {
      if (tipo === 'of') {
        if (typeof window.__comAbrirModalOF === 'function' && id) return window.__comAbrirModalOF(id);
        if (typeof window.abrirOf === 'function' && id) return window.abrirOf(id);
      }
      if (tipo === 'tinta') {
        try { if (typeof window.go === 'function') window.go('estoque-tintas'); } catch (_) {}
        if (typeof window._abrirModalNovaTinta === 'function' && detalhe) return window._abrirModalNovaTinta(detalhe);
      }
      if (tipo === 'material') {
        try { if (typeof window.go === 'function') window.go('estoque-materiais'); } catch (_) {}
        if (typeof window._abrirModalNovoMaterial === 'function' && detalhe) return window._abrirModalNovoMaterial(detalhe);
      }
      if (tipo === 'faca') {
        try { if (typeof window.go === 'function') window.go('facas1'); } catch (_) {}
        if (typeof window.abrirModalFaca1 === 'function' && id) return window.abrirModalFaca1(id);
      }
      if (tipo === 'cliche') {
        try { if (typeof window.go === 'function') window.go('cliches'); } catch (_) {}
      }
      if (tipo === 'chapa') {
        try { if (typeof window.go === 'function') window.go('sel-chapas'); } catch (_) { try { window.go('chapas'); } catch (__) {} }
      }
    } catch (_) {}
  };

  window.__patchRefreshPinsHub = function() {
    renderHubPins().catch(function() {});
  };
  window.__patchRefreshPinStates = function(force) {
    return _refreshPinStates(!!force);
  };
  window.__patchPinBtnStyleAttr = _pinBtnStyleAttr;
  window.__patchApplyPinStates = _applyPinStates;
  setTimeout(function() {
    _refreshPinStates(false).catch(function() {});
  }, 350);

  window.__patchOpenPinModal = async function(tipo, referenciaId, label) {
    try {
      var t = String(tipo || '').trim().toLowerCase();
      var ref = String(referenciaId || '').trim();
      if (!t || !ref) return false;
      var observacao = await askPinObservation(label || t.toUpperCase());
      if (observacao === null) return false;
      await apiJson('/api/pins', {
        method: 'POST',
        body: { tipo: t, referencia_id: ref, observacao: String(observacao || '').trim() }
      });
      notify('📌 Item fixado no Hub com sucesso!', 'var(--green)');
      _refreshPinStates(true).catch(function() {});
      renderHubPins().catch(function() {});
      return true;
    } catch (e) {
      notify('Erro ao criar pin: ' + String(e && e.message || e), 'var(--red)');
      return false;
    }
  };

  window.__patchCloneOF = async function(ofId, buscaModal) {
    try {
      var id = String(ofId || '').trim();
      if (!id) throw new Error('OF inválida para clonagem');
      var detalhe = await apiJson('/api/ofs/' + encodeURIComponent(id));
      var of = detalhe && (detalhe.data || detalhe) || null;
      if (!of || !of.id) throw new Error('OF não encontrada');
      var payload = Object.assign({}, of);
      [
        'id', 'created_at', 'updated_at', 'data_conclusao', 'numero', 'of', 'status',
        'seq', 'concluido_em', 'concluido_por'
      ].forEach(function(k) { try { delete payload[k]; } catch (_) {} });
      payload.status = 'Em aberto';
      var created = await apiJson('/api/ofs', { method: 'POST', body: payload });
      var nova = created && (created.data || created) || {};
      notify('✅ OF #' + String(of.numero || '—') + ' clonada como #' + String(nova.numero || nova.of || '—') + ' com sucesso!', 'var(--green)');
      try {
        if (buscaModal && buscaModal.style) buscaModal.style.display = 'none';
      } catch (_) {}
      try {
        var modal = document.getElementById('buscador-universal-modal');
        if (modal) modal.remove();
      } catch (_) {}
      return nova;
    } catch (e) {
      notify('Erro ao clonar OF: ' + String(e && e.message || e), 'var(--red)');
      throw e;
    }
  };

  try {
    var hubDeb = null;
    var obs = new MutationObserver(function() {
      if (window._pausarObservers) return;
      clearTimeout(hubDeb);
      hubDeb = setTimeout(function() {
        try {
          var pageHub = document.getElementById('page-hub');
          if (pageHub && pageHub.style.display !== 'none') renderHubPins();
        } catch (_) {}
      }, 180);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  setTimeout(function() {
    renderHubPins().catch(function() {});
    _refreshPinStates(true).catch(function() {});
  }, 1200);
})();

(function() {
  if (window.__patchHubTotalGeralInstalled) return;
  window.__patchHubTotalGeralInstalled = true;
  try {
    if (window._dashTotalInterval) {
      clearInterval(window._dashTotalInterval);
      window._dashTotalInterval = null;
    }
  } catch (_) {}

  function _hubToken() {
    try { return String(window._token || localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { return ''; }
  }
  function _hubFmtMoney(v) {
    try { return 'R$\u00a0' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } catch (_) { return 'R$\u00a00,00'; }
  }
  function _hubMesAtualNome() {
    try {
      return new Date().toLocaleDateString('pt-BR', { month: 'long' });
    } catch (_) { return 'este mês'; }
  }
  async function _hubFetchTotalGeral() {
    try {
      if (window.__hubTotalFetchErro) return null;
      var cache = window._hubTotalGeralCache || null;
      if (cache && cache.done && cache.data) return cache.data;
      var token = _hubToken();
      var resp = await fetch('/api/dashboard/total-geral', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var json = await resp.json().catch(function() { return null; });
      if (!resp.ok || !json || json.ok === false) {
        window.__hubTotalFetchErro = true;
        return null;
      }
      window._hubTotalGeralCache = { ts: Date.now(), data: json, done: true };
      return json;
    } catch (_) {
      window.__hubTotalFetchErro = true;
      return null;
    }
  }
  function _hubFindCardByLabel(kpis, labelText) {
    var cards = Array.prototype.slice.call((kpis && kpis.querySelectorAll('.hub-kpi')) || []);
    return cards.find(function(card) {
      var l = card.querySelector('.l');
      return String(l && l.textContent || '').trim().toLowerCase() === String(labelText || '').trim().toLowerCase();
    }) || null;
  }
  function _hubUpsertCard(kpis, label, value, sub, color, beforeCard) {
    if (!kpis) return null;
    var card = _hubFindCardByLabel(kpis, label);
    if (!card) {
      card = document.createElement('div');
      card.className = 'hub-kpi';
      card.innerHTML = '<div class="l"></div><div class="v"></div><div class="s"></div>';
      if (beforeCard && beforeCard.parentNode === kpis) kpis.insertBefore(card, beforeCard);
      else kpis.appendChild(card);
    }
    var l = card.querySelector('.l');
    var v = card.querySelector('.v');
    var s = card.querySelector('.s');
    if (l) l.textContent = label;
    if (v) {
      v.textContent = value;
      if (color) v.style.color = color;
    }
    if (s) s.textContent = sub || '';
    return card;
  }
  async function _patchHubTotalCards() {
    try {
      var page = document.getElementById('page-hub');
      var kpis = document.getElementById('hub-kpis');
      if (!page || !kpis) return;
      var data = await _hubFetchTotalGeral();
      if (!data) {
        _hubUpsertCard(kpis, 'FATURAMENTO DO MÊS', '—', 'Sem dados no momento', '#94a3b8');
        _hubUpsertCard(kpis, 'TOTAL EM OFs (HISTÓRICO)', '—', 'Sem dados no momento', '#94a3b8');
        return;
      }

      var mesNome = _hubMesAtualNome();
      var fatCard = _hubFindCardByLabel(kpis, 'Faturamento do mês');
      if (fatCard) {
        _hubUpsertCard(
          kpis,
          'Faturamento do mês',
          _hubFmtMoney(data.total_mes_atual || 0),
          String(Number(data.count_mes_atual || 0)) + ' OFs em ' + mesNome,
          '#10B981'
        );
      } else {
        _hubUpsertCard(
          kpis,
          'FATURAMENTO DO MÊS',
          _hubFmtMoney(data.total_mes_atual || 0),
          String(Number(data.count_mes_atual || 0)) + ' OFs em ' + mesNome,
          '#10B981'
        );
      }

      var amCard = _hubFindCardByLabel(kpis, 'Amostras Pendentes');
      _hubUpsertCard(
        kpis,
        'TOTAL EM OFs (HISTÓRICO)',
        _hubFmtMoney(data.total_historico || 0),
        String(Number(data.count_historico || 0)) + ' OFs no total',
        '#F59E0B',
        amCard
      );
      if (amCard) {
        var labelAtual = amCard.querySelector('.l');
        if (labelAtual && String(labelAtual.textContent || '').trim() === 'Amostras Pendentes') {
          amCard.parentNode && amCard.parentNode.removeChild(amCard);
        }
      }
    } catch (_) {}
  }

  try {
    if (!window.__patchHubTotalObs) {
      var deb = null;
      window.__patchHubTotalObs = new MutationObserver(function() {
        if (window._pausarObservers) return;
        clearTimeout(deb);
        deb = setTimeout(function() {
          try {
            var page = document.getElementById('page-hub');
            if (!page || page.style.display === 'none') return;
            if (window.__patchHubTotalLoaded || window.__hubTotalFetchErro) return;
            window.__patchHubTotalLoaded = true;
            _patchHubTotalCards();
          } catch (_) {}
        }, 180);
      });
      window.__patchHubTotalObs.observe(document.body, { childList: true, subtree: true });
    }
    setTimeout(function() {
      try {
        var page = document.getElementById('page-hub');
        if (!page || page.style.display === 'none') return;
        if (window.__patchHubTotalLoaded || window.__hubTotalFetchErro) return;
        window.__patchHubTotalLoaded = true;
        _patchHubTotalCards();
      } catch (_) {}
    }, 800);
  } catch (_) {}
})();

(function() {
  try {
    if (typeof window.toastHotfix !== 'function') {
      window.toastHotfix = function(msg) {
        var s = '';
        try { s = String(msg == null ? '' : msg); } catch (_) { s = ''; }
        try {
          if (typeof window._notificacaoOF === 'function') return window._notificacaoOF(s, 'sucesso');
        } catch (_) {}
        try { alert(s); } catch (_) {}
      };
    }
  } catch (_) {}

  try {
    if (!document.getElementById('patch-modal-solid-style')) {
      var st = document.createElement('style');
      st.id = 'patch-modal-solid-style';
      st.textContent = ''
        + '.modal,.modal-content,[class*="modal"],'
        + '#modal-nova-tinta,#modal-novo-material,'
        + '[id*="modal"]>div{background:var(--bg2,#1a1a2e)!important;}';
      document.head.appendChild(st);
    }
  } catch (_) {}
})();

window.addEventListener('error', function(e) {
  try { console.error('[PATCH ERROR GLOBAL]', e && e.message, e && e.filename, e && e.lineno); } catch (_) {}
});
window.addEventListener('unhandledrejection', function(e) {
  try {
    var r = e && e.reason;
    console.error('[PATCH PROMISE ERROR]', r && r.message ? r.message : r);
  } catch (_) {}
});

(function() {
  if (window.__patchFixImgsSrcInstalled) return;
  window.__patchFixImgsSrcInstalled = true;
  function _fixImgsSrc() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('img')).forEach(function(img) {
        try {
          if (!img || img.dataset && img.dataset.patchImgFix === '1') return;
          var src = String(img.getAttribute('src') || '').trim();
          var isAdm = src.indexOf('adm.italyembalagens.com.br') >= 0;
          var bad =
            !src ||
            src === '[]' ||
            src === 'null' ||
            src === 'undefined' ||
            src.indexOf('[object') >= 0 ||
            src.indexOf('/[]') >= 0 ||
            src.indexOf('undefined') >= 0 ||
            (isAdm && (src.indexOf('[') >= 0 || src.endsWith('[')));
          if (bad) {
            try { img.removeAttribute('src'); } catch (_) {}
            try { img.style.display = 'none'; } catch (_) {}
            try { img.dataset.patchImgFix = '1'; } catch (_) {}
          }
        } catch (_) {}
      });
    } catch (_) {}
  }
  try { _fixImgsSrc(); } catch (_) {}
  try { setInterval(_fixImgsSrc, 2000); } catch (_) {}
})();
(function() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
  var _logOrig = console.log.bind(console);
  var _warnOrig = console.warn.bind(console);
  console.log = function() {
    var msg = String(arguments[0] || '');
    if (
      msg.indexOf('[ERRO]') === 0 ||
      msg.indexOf('[CRITICO]') === 0 ||
      msg.indexOf('[CRÍTICO]') === 0 ||
      msg.indexOf('[COM]') === 0 ||
      msg.indexOf('[COM PATCH]') === 0 ||
      msg.indexOf('[IMPRIMIR]') === 0 ||
      msg.indexOf('[HIST CLI]') === 0 ||
      msg.indexOf('[PAINEL CLI]') === 0
    ) {
      return _logOrig.apply(console, arguments);
    }
  };
  console.warn = function() {
    var msg = String(arguments[0] || '');
    if (msg.indexOf('[PATCH]') >= 0 || msg.toLowerCase().indexOf('overlay') >= 0) return;
    return _warnOrig.apply(console, arguments);
  };
})();

(function() {
  try { document.getElementById('patch-light-mode')?.remove(); } catch (_) {}
  try {
    var _existeStyleClaro = document.getElementById('patch-light-mode-v2');
    if (_existeStyleClaro) return;
    var s = document.createElement('style');
    s.id = 'patch-light-mode-v2';
    s.textContent = ''
      + 'body.light,body[data-theme=\"light\"]{color:#111!important;background:#f5f5f5!important;}'
      + 'body.light .card,body.light .modal-content,body.light [class*=\"modal\"] > div,'
      + 'body[data-theme=\"light\"] .card,body[data-theme=\"light\"] .modal-content,body[data-theme=\"light\"] [class*=\"modal\"] > div'
      + '{background:#fff!important;color:#111!important;}'
      + 'body.light input,body.light select,body.light textarea,'
      + 'body[data-theme=\"light\"] input,body[data-theme=\"light\"] select,body[data-theme=\"light\"] textarea'
      + '{color:#111!important;background:#fff!important;border-color:#ddd!important;}'
      + 'body.light .sidebar,body[data-theme=\"light\"] .sidebar{background:#fff!important;}'
      + 'body.light .topbar,body[data-theme=\"light\"] .topbar{background:#fff!important;}';
    document.head.appendChild(s);
  } catch (_) {}
})();
(function() {
  if (window.__patchFetchGuardInstalled) return;
  window.__patchFetchGuardInstalled = true;
  var _fetchOrig = window.fetch;
  if (typeof _fetchOrig !== 'function') return;
  window.fetch = function(input, init) {
    try {
      var url = '';
      try { url = input && typeof input === 'object' && input.url ? String(input.url) : String(input || ''); } catch (_) { url = ''; }
      var u = String(url || '');
      if (
        u.indexOf('undefined') >= 0 ||
        u.indexOf('null') >= 0 ||
        u.indexOf('[object') >= 0 ||
        u.indexOf('/[]') >= 0
      ) {
        try { console.warn('[GUARD] URL inválida bloqueada:', u.substring(0, 140)); } catch (_) {}
        try { return Promise.resolve(new Response('{}', { status: 400, headers: { 'Content-Type': 'application/json' } })); } catch (_) { return Promise.resolve({ ok: false, status: 400 }); }
      }
    } catch (_) {}
    return _fetchOrig.apply(this, arguments);
  };
})();
if (!window._debounce) {
  window._debounce = function(fn, delay) {
    var timer = null;
    return function() {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
    };
  };
}
try {
console.log('[PATCH] versão ' + Date.now() + ' carregado');
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
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
  }

  /* Todas as pages sem overflow lateral */
  [id^="page-"], .page, [data-page] {
    max-width: 100% !important;
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

  html, body {
    overflow-x: hidden !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  body {
    padding-bottom: 64px !important;
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
    max-width: 100% !important;
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
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    overflow-x: hidden !important;
    position: relative !important;
    left: 0 !important;
  }

  section, [id^="page-"], .page,
  [data-page], .tab-content {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .topbar, #topbar,
  .top-bar, #top-bar, .header-bar,
  [class*="top-bar"], [class*="header-bar"],
  header, #header {
    flex-wrap: wrap !important;
    padding: 6px 8px !important;
    gap: 4px !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .topbar .logo-icon,
  .topbar img, #topbar img,
  .top-bar img, #top-bar img,
  header img, #header img,
  [class*="logo"] img {
    height: 28px !important;
    width: auto !important;
  }

  .topbar-badges { flex-wrap: wrap !important; gap: 4px !important; }
  .tbadge,
  [class*="badge-status"], [class*="status-badge"],
  .badge-atrasados, .badge-urgentes, .badge-concluidos,
  [id*="badge"], [class*="badge"] {
    font-size: 10px !important;
    padding: 3px 6px !important;
    min-width: 0 !important;
  }

  [class*="busca-global"], [id*="busca-global"],
  input[placeholder*="Buscar"], input[placeholder*="buscar"] {
    width: 100% !important;
    flex: 1 1 100% !important;
    order: 10 !important;
  }

  .clock, #clock,
  [class*="hora-atual"], [id*="hora-atual"] {
    display: none !important;
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

  #page-estoque #est-table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: 10px !important;
  }
  #page-estoque #est-table-wrap:after {
    content: '→ deslize para ver mais' !important;
    display: block !important;
    text-align: right !important;
    font-size: 10px !important;
    color: #4A90D9 !important;
    padding: 4px !important;
  }
  #page-estoque #est-table-wrap table {
    display: table !important;
    width: max-content !important;
    min-width: 100% !important;
    max-width: none !important;
  }
  #page-estoque #est-table-wrap table thead { display: table-header-group !important; }
  #page-estoque #est-table-wrap table tbody { display: table-row-group !important; }
  #page-estoque #est-table-wrap table tfoot { display: table-footer-group !important; }
  #page-estoque #est-table-wrap table tr { display: table-row !important; padding: 0 !important; margin: 0 !important; background: transparent !important; border-radius: 0 !important; border: none !important; }
  #page-estoque #est-table-wrap table th,
  #page-estoque #est-table-wrap table td {
    display: table-cell !important;
    white-space: nowrap !important;
    vertical-align: middle !important;
    width: auto !important;
  }
  #page-estoque #est-table-wrap table th:first-child,
  #page-estoque #est-table-wrap table td:first-child {
    position: sticky !important;
    left: 0 !important;
    z-index: 2 !important;
    background: #0b1220 !important;
  }

  #page-pcp #pcp-table-wrap,
  #pcp-table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  #page-pcp table.pcp-table,
  table.pcp-table {
    display: table !important;
    width: max-content !important;
    min-width: 100% !important;
    max-width: none !important;
  }
  #page-pcp table.pcp-table thead,
  table.pcp-table thead { display: table-header-group !important; }
  #page-pcp table.pcp-table tbody,
  table.pcp-table tbody { display: table-row-group !important; }
  #page-pcp table.pcp-table tr,
  table.pcp-table tr { display: table-row !important; padding: 0 !important; margin: 0 !important; background: transparent !important; border: none !important; border-radius: 0 !important; }
  #page-pcp table.pcp-table th,
  #page-pcp table.pcp-table td,
  table.pcp-table th,
  table.pcp-table td {
    display: table-cell !important;
    white-space: nowrap !important;
    width: auto !important;
  }

  #page-facas1 table,
  #page-facas2 table,
  #page-cliches table {
    display: table !important;
    width: max-content !important;
    min-width: 100% !important;
    max-width: none !important;
  }
  #page-facas1 table thead,
  #page-facas2 table thead,
  #page-cliches table thead { display: table-header-group !important; }
  #page-facas1 table tbody,
  #page-facas2 table tbody,
  #page-cliches table tbody { display: table-row-group !important; }
  #page-facas1 table tr,
  #page-facas2 table tr,
  #page-cliches table tr { display: table-row !important; padding: 0 !important; margin: 0 !important; background: transparent !important; border: none !important; border-radius: 0 !important; }
  #page-facas1 table th,
  #page-facas1 table td,
  #page-facas2 table th,
  #page-facas2 table td,
  #page-cliches table th,
  #page-cliches table td {
    display: table-cell !important;
    white-space: nowrap !important;
    width: auto !important;
  }

  #page-estoque [class*="toolbar"],
  #page-estoque [class*="acoes"],
  #page-estoque [class*="btn-group"],
  [id*="page-estoque"] > div:first-of-type {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
  }
  #page-estoque button,
  [id*="page-estoque"] button {
    flex: 1 1 calc(50% - 6px) !important;
    min-width: 0 !important;
    font-size: 12px !important;
    padding: 8px 6px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  #page-estoque [class*="filtro"],
  #page-estoque select,
  [id*="page-estoque"] select {
    width: 100% !important;
    margin-bottom: 6px !important;
  }

  #page-orcamentos table td:nth-child(n+8) { display: flex !important; }
  #page-orcamentos table td:last-child { display: flex !important; }

  #modal-calculadora,
  #modal-orcamento-calc,
  [id*="calc-compensacao"] {
    max-height: 92vh !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  #modal-calculadora .modal-footer,
  #modal-calculadora .rodape,
  #modal-orcamento-calc .modal-footer,
  #modal-orcamento-calc .rodape {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    padding: 10px !important;
  }
  #modal-calculadora .modal-footer button,
  #modal-calculadora .rodape button,
  #modal-orcamento-calc .modal-footer button,
  #modal-orcamento-calc .rodape button {
    width: 100% !important;
    min-height: 44px !important;
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
    max-width: 100% !important;
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
    max-width: 100% !important;
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

/* ============================================
   MOBILE IMPROVEMENTS — patch.js
   Apenas correções do layout existente
   ============================================ */

@media (max-width: 768px) {
  body,
  .main-content, #main-content,
  .page-content, #page-content,
  .conteudo-principal {
    padding-bottom: 80px !important;
  }

  .modal-overlay {
    align-items: flex-end !important;
    padding: 0 !important;
  }
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 90vh !important;
    border-radius: 16px 16px 0 0 !important;
    overflow-y: auto !important;
    margin: 0 !important;
  }
  .modal-footer {
    position: sticky !important;
    bottom: 0 !important;
    z-index: 10 !important;
    background: var(--bg-secondary, #1e293b) !important;
    padding: 12px 16px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
  }
  .modal-footer button,
  .modal-footer .btn,
  .modal-footer [class*="btn-"] {
    width: 100% !important;
    min-height: 44px !important;
    font-size: 0.88rem !important;
  }

  input, select, textarea {
    font-size: 16px !important;
    min-height: 42px !important;
    padding: 8px 12px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  button, .btn, [class*="btn-"], [role="button"] {
    min-height: 44px !important;
    font-size: 0.85rem !important;
  }

  .mob-btn-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  .table-scroll-mobile {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    width: 100% !important;
  }

  .hub-stats-grid {
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  .mob-no-overflow {
    white-space: normal !important;
    word-break: break-word !important;
  }

  #graficosHistoricoBox {
    grid-template-columns: 1fr !important;
  }

  #modal-calc.modal-overlay {
    align-items: stretch !important;
    justify-content: stretch !important;
    padding: 0 !important;
  }
  #modal-calc #modal-calculadora {
    width: 100% !important;
    max-width: 100% !important;
    height: 100vh !important;
    max-height: 100vh !important;
    margin: 0 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 12px !important;
  }
  #modal-calc #modal-calculadora .close-btn {
    position: fixed !important;
    top: 10px !important;
    right: 10px !important;
    z-index: 10000 !important;
  }
  #modal-calc #modal-calculadora h2 {
    margin-top: 0 !important;
    padding-right: 56px !important;
  }
  #modal-calc #modal-calculadora .calc-header-row {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 10px !important;
  }
  #modal-calc #modal-calculadora .calc-header-row label {
    white-space: normal !important;
  }
  #modal-calc #modal-calculadora #calc-cli {
    width: 100% !important;
  }

  #modal-calc #modal-calculadora .modal-body,
  #modal-calc #modal-calculadora .calc-body {
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
    flex: 1 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 12px 16px !important;
  }

  #modal-calc #modal-calculadora .calc-col-esq {
    display: contents !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  #modal-calc #modal-calculadora .calc-row-top,
  #modal-calc #modal-calculadora .calc-row-dims,
  #modal-calc #modal-calculadora .calc-row-valores {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    align-items: stretch !important;
  }
  #modal-calc #modal-calculadora .calc-row-top { order: 2 !important; }
  #modal-calc #modal-calculadora .calc-row-dims { order: 3 !important; }
  #modal-calc #modal-calculadora .calc-row-valores { order: 4 !important; }
  #modal-calc #modal-calculadora #calc-extra-fields { order: 5 !important; }

  #modal-calc #modal-calculadora .calc-col-dir {
    order: 6 !important;
    width: 100% !important;
    border-left: none !important;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
    padding: 12px 0 0 0 !important;
    background: transparent !important;
    overflow: visible !important;
  }

  #modal-calc #modal-calculadora .calc-tabela-wrap {
    order: 7 !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    flex: 0 0 auto !important;
  }

  #modal-calc #modal-calculadora input,
  #modal-calc #modal-calculadora select {
    width: 100% !important;
    font-size: 16px !important;
    min-height: 42px !important;
    box-sizing: border-box !important;
  }

  #modal-calc #modal-calculadora .modal-footer.rodape {
    position: sticky !important;
    bottom: 0 !important;
    z-index: 20 !important;
    background: #0f172a !important;
    border-top: 1px solid rgba(255,255,255,0.12) !important;
    padding: 12px 16px !important;
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    margin-top: 0 !important;
  }
  #modal-calc #modal-calculadora .modal-footer.rodape > div:first-child {
    grid-column: 1 / -1 !important;
    margin-right: 0 !important;
  }
  #modal-calc #modal-calculadora .modal-footer.rodape button:first-of-type {
    grid-column: 1 / -1 !important;
  }
  #modal-calc #modal-calculadora .modal-footer.rodape button {
    width: 100% !important;
    min-height: 44px !important;
    font-size: 0.85rem !important;
  }

  .chapas-table-wrapper,
  #tabelaChapasEstoque {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    width: 100% !important;
  }
  #tabelaChapasEstoque th:first-child,
  #tabelaChapasEstoque td:first-child {
    position: sticky !important;
    left: 0 !important;
    z-index: 2 !important;
    background: var(--bg-secondary, #1e293b) !important;
    min-width: 120px !important;
    max-width: 160px !important;
    font-size: 0.75rem !important;
    padding: 8px 6px !important;
    border-right: 1px solid rgba(255,255,255,0.08) !important;
  }
  #tabelaChapasEstoque tbody tr {
    border-bottom: 1px solid rgba(255,255,255,0.06) !important;
  }
  #tabelaChapasEstoque td {
    font-size: 0.75rem !important;
    padding: 8px 6px !important;
    white-space: nowrap !important;
  }

  #painelDetalheChapa {
    align-items: flex-end !important;
    padding: 0 !important;
  }
  #painelDetalheChapa > div {
    max-width: 100% !important;
    border-radius: 16px 16px 0 0 !important;
    max-height: 92vh !important;
  }
  #painelQtdAtual { font-size: 1.5rem !important; }

  .ofs-maquina-board {
    overflow-x: auto !important;
    display: flex !important;
    gap: 12px !important;
    padding-bottom: 12px !important;
    -webkit-overflow-scrolling: touch !important;
  }
  .ofs-maquina-coluna {
    min-width: 280px !important;
    flex-shrink: 0 !important;
  }

  .of-card {
    padding: 10px !important;
    font-size: 0.8rem !important;
  }

  .sistema-header, .top-header {
    padding: 6px 10px !important;
  }

  .badge-atrasados, .badge-urgentes, .badge-concluidos,
  [class*="badge-status"] {
    font-size: 0.68rem !important;
    padding: 3px 6px !important;
  }

  .modal-overlay { z-index: 9000 !important; }
  #painelDetalheChapa { z-index: 9500 !important; }

  /* ===== PCP/PROGRAMAÇÃO ===== */
  .tabela-ofs, #tabela-pcp, [id*="tabelaPCP"], [id*="tabela-ofs"] {
    display: block !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  /* ===== KANBAN OFs POR MÁQUINA ===== */
  .kanban-board, [id*="kanban"], .ofs-maquina-board {
    display: flex !important;
    overflow-x: auto !important;
    gap: 10px !important;
    padding-bottom: 16px !important;
    -webkit-overflow-scrolling: touch !important;
  }
  .kanban-col, .maquina-col, .ofs-maquina-coluna {
    min-width: 270px !important;
    flex-shrink: 0 !important;
  }

  /* ===== FORMULÁRIOS GERAIS ===== */
  .form-row, .form-inline,
  [style*="display:flex"][class*="form"],
  [style*="display: flex"][class*="form"] {
    flex-direction: column !important;
    gap: 10px !important;
  }

  .modal-box input:not([type="checkbox"]):not([type="radio"]),
  .modal-box select,
  .modal-box textarea {
    width: 100% !important;
    box-sizing: border-box !important;
    font-size: 16px !important;
  }

  /* ===== TABELAS GERAIS ===== */
  .table-container, .tabela-container, [class*="tabela-wrap"] {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  /* ===== HEADER DO SISTEMA ===== */
  .sistema-top-bar, .header-principal {
    flex-wrap: wrap !important;
    gap: 4px !important;
    padding: 6px 8px !important;
  }
  .header-btn-group button {
    font-size: 0.72rem !important;
    padding: 4px 8px !important;
  }

  /* ===== CARDS DO HUB ===== */
  .hub-grid, .dashboard-grid, [class*="cards-grid"] {
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  /* ===== FINANCEIRO ===== */
  .financeiro-tabela, [id*="financeiro"] table {
    display: block !important;
    overflow-x: auto !important;
  }

  /* ===== ANÁLISES/GRÁFICOS ===== */
  .grafico-card canvas {
    max-width: 100% !important;
    height: auto !important;
  }

  /* ===== MENUS E NAVEGAÇÃO ===== */
  .menu-lateral { display: none !important; }
  .menu-mobile-bottom {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 9000 !important;
    background: #0f172a !important;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
  }

  /* ===== ESPAÇO PARA MENU INFERIOR ===== */
  .main-content, .page-content, .conteudo-principal, #app-content {
    padding-bottom: 80px !important;
  }

  /* ===== MODAIS BOTTOM SHEET ===== */
  .modal-overlay {
    align-items: flex-end !important;
    padding: 0 !important;
  }
  .modal-box {
    border-radius: 16px 16px 0 0 !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* ===== BOTÕES DE AÇÃO ===== */
  button, .btn, [class*="btn-"] {
    min-height: 40px !important;
  }

  .btn-group-mobile {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 6px !important;
  }

  /* ===== TEXTO NÃO CORTAR (apenas em tabelas) ===== */
  table th, table td { white-space: nowrap !important; }

  /* ===== CLIENTES INATIVOS MOBILE ===== */
  #listaClientesInativosModal > div { grid-template-columns: 1fr 1fr !important; }
  #listaClientesInativosModal > div span:nth-child(3),
  #listaClientesInativosModal > div span:nth-child(4) { display: none !important; }
}

@media (max-width: 390px) {
  .hub-grid { grid-template-columns: 1fr !important; }
  .badge-status { font-size: 0.62rem !important; }
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

  function extractOfsRows(raw) {
    return Array.isArray(raw) ? raw : (Array.isArray(raw && raw.data) ? raw.data : (Array.isArray(raw && raw.ofs) ? raw.ofs : []));
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
        var lista = extractOfsRows(d);
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
    { id: 'gramaturas',          label: 'Gramaturas',          icone: '📐', grupo: 'Cadastros' },
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
    { id: 'toneladas-vendidas',  label: 'Toneladas Vendidas',  icone: '⚖️', grupo: 'Análises' },
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

  (function patchMenusExtras() {
    function _allMenuTexts() {
      try { return Array.prototype.slice.call(document.querySelectorAll('a, li, div, span, button')); } catch (_) { return []; }
    }
    function _findByText(txt) {
      txt = String(txt || '').trim();
      if (!txt) return null;
      var els = _allMenuTexts();
      for (var i = 0; i < els.length; i += 1) {
        var el = els[i];
        try {
          if (String(el.textContent || '').trim() === txt) return el;
        } catch (_) {}
      }
      return null;
    }
    function _findItemEl(base) {
      try { return base && (base.closest ? base.closest('a,button,li,.menu-item,[class*="item"]') : null); } catch (_) { return null; }
    }
    function _sanitizeCloneIds(node) {
      try {
        if (!node || !node.querySelectorAll) return;
        if (node.id) node.id = '';
        Array.prototype.slice.call(node.querySelectorAll('[id]')).forEach(function(el) { try { el.id = ''; } catch (_) {} });
      } catch (_) {}
    }
    function _replaceExactText(root, oldText, newText) {
      try {
        Array.prototype.slice.call(root.querySelectorAll('*')).forEach(function(el) {
          try {
            var kids = Array.prototype.slice.call(el.childNodes || []);
            kids.forEach(function(nd) {
              if (nd && nd.nodeType === 3 && String(nd.nodeValue || '').trim() === oldText) nd.nodeValue = newText;
            });
          } catch (_) {}
        });
      } catch (_) {}
    }
    function _ocultarRelatorioMensal() {
      if (window._pausarObservers) return;
      try {
        Array.prototype.slice.call(document.querySelectorAll('a, li, span, div')).forEach(function(el) {
          try {
            if (!el || el.children == null) return;
            if (el.children.length !== 0) return;
            if (String(el.textContent || '').trim() !== 'Relatório Mensal') return;
            var alvo = el;
            for (var i = 0; i < 3; i++) {
              if (!alvo) break;
              try { alvo.style.display = 'none'; } catch (_) {}
              try { alvo.style.visibility = 'hidden'; } catch (_) {}
              try { alvo.style.height = '0'; } catch (_) {}
              try { alvo.style.overflow = 'hidden'; } catch (_) {}
              alvo = alvo.parentElement;
            }
          } catch (_) {}
        });
      } catch (_) {}
    }
    function _removerRelatorioMensalAgressivo() {
      try {
        Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function(el) {
          try {
            if (!el || el.childElementCount !== 0) return;
            if (String(el.textContent || '').trim() !== 'Relatório Mensal') return;
            var alvo = el.closest ? el.closest('li, .nav-item, .menu-item, a') : null;
            if (alvo && alvo.parentNode) alvo.parentNode.removeChild(alvo);
          } catch (_) {}
        });
      } catch (_) {}
    }
    function _ensureMenuClone(refText, newText, menuKey, pageId) {
      try {
        if (document.querySelector('[data-patch-menu="' + menuKey + '"]')) return true;
        var refEl = _findByText(refText);
        var item = _findItemEl(refEl) || refEl;
        if (!item || !item.parentNode) return false;
        var clone = item.cloneNode(true);
        _sanitizeCloneIds(clone);
        clone.setAttribute('data-patch-menu', menuKey);
        _replaceExactText(clone, refText, newText);
        clone.addEventListener('click', function(e) {
          try { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); } catch (_) {}
          try { if (typeof window.go === 'function') window.go(pageId); } catch (_) {}
          return false;
        }, true);
        item.parentNode.insertBefore(clone, item.nextSibling);
        return true;
      } catch (_) { return false; }
    }
    function tickMenus() {
      try { _ocultarRelatorioMensal(); } catch (_) {}
      try { _removerRelatorioMensalAgressivo(); } catch (_) {}
      try { _ensureMenuClone('Fornecedores', '📐 Gramaturas', 'gramaturas', 'gramaturas'); } catch (_) {}
      try { _ensureMenuClone('Caixas Perdidas', '⚖️ Toneladas Vendidas', 'toneladas', 'toneladas-vendidas'); } catch (_) {}
    }
    try { tickMenus(); } catch (_) {}
    try { _ocultarRelatorioMensal(); } catch (_) {}
    try {
      if (!document.getElementById('patch-rm-style')) {
        var styleRM = document.createElement('style');
        styleRM.id = 'patch-rm-style';
        styleRM.textContent = ''
          + 'a[href*="relatorio-mensal"],'
          + 'a[href*="relmensal"],'
          + '[onclick*="relmensal"],'
          + '[data-page="relmensal"],'
          + '[data-section="relmensal"]{display:none!important;}';
        document.head.appendChild(styleRM);
      }
    } catch (_) {}
    try { _removerRelatorioMensalAgressivo(); } catch (_) {}
    try { [100, 500, 1000, 2000, 5000].forEach(function(t) { setTimeout(_ocultarRelatorioMensal, t); }); } catch (_) {}
    try { [500, 1500, 3000].forEach(function(t) { setTimeout(_removerRelatorioMensalAgressivo, t); }); } catch (_) {}
    try {
      if (!window.__patchRelMensalObs) {
        window.__patchRelMensalObs = new MutationObserver(_ocultarRelatorioMensal);
        window.__patchRelMensalObs.observe(document.body, { childList: true, subtree: true });
      }
    } catch (_) {}
    if (!window.__patchMenusExtrasObs) {
      window.__patchMenusExtrasObs = new MutationObserver(function() {
        if (window._pausarObservers) return;
        tickMenus();
      });
      try { window.__patchMenusExtrasObs.observe(document.body, { childList: true, subtree: true }); } catch (_) {}
    }
  })();

  (function patchPaginasExtrasCustom() {
    if (window.__patchPaginasExtrasCustom) return;
    window.__patchPaginasExtrasCustom = true;

    function apiJson(url, opts) {
      opts = opts || {};
      var token = '';
      try { token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim(); } catch (_) {}
      var headers = Object.assign({}, opts.headers || {}, token ? { Authorization: 'Bearer ' + token } : {});
      return fetch(url, Object.assign({}, opts, { headers: headers })).then(function(r) {
        return r.json().catch(function() { return null; }).then(function(j) {
          if (!r.ok) throw new Error(String(j && (j.error || j.message) || ('Falha em ' + url)));
          return j;
        });
      });
    }
    function esc(v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function(ch) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[ch] || ch; }); }
    function money(v) { try { return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } catch (_) { return 'R$ 0,00'; } }
    function num(v, dec) { try { return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); } catch (_) { return String(v || 0); } }
    function ensureStyles() {
      if (document.getElementById('patch-extra-pages-style')) return;
      var st = document.createElement('style');
      st.id = 'patch-extra-pages-style';
      st.textContent = ''
        + '.pep-wrap{padding:20px;color:#e5e7eb}'
        + '.pep-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px}'
        + '.pep-title{font-size:24px;font-weight:900;color:#f8fafc}'
        + '.pep-sub{font-size:12px;color:#94a3b8;margin-top:4px}'
        + '.pep-btn,.pep-input,.pep-select{background:#0f172a;border:1px solid #1e293b;color:#e5e7eb;border-radius:10px;padding:10px 12px;font-size:13px}'
        + '.pep-btn{cursor:pointer;font-weight:700}'
        + '.pep-btn.primary{background:linear-gradient(135deg,#2563eb,#1d4ed8);border-color:#2563eb}'
        + '.pep-btn.danger{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);color:#fecaca}'
        + '.pep-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:14px}'
        + '.pep-card,.pep-panel{background:linear-gradient(135deg,#0f172a,#111827);border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:18px}'
        + '.pep-card-label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:800}'
        + '.pep-card-val{font-size:26px;font-weight:900;color:#f8fafc;margin-top:10px}'
        + '.pep-card-sub{font-size:12px;color:#94a3b8;margin-top:8px}'
        + '.pep-table{width:100%;border-collapse:collapse}'
        + '.pep-table th{background:#0f172a;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.08em;padding:10px 8px;text-align:left;border-bottom:1px solid #1e293b}'
        + '.pep-table td{padding:10px 8px;border-bottom:1px solid #1e293b;font-size:12px;color:#e5e7eb;vertical-align:top}'
        + '.pep-table tbody tr:hover{background:#1e293b}'
        + '.pep-rank-item{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-bottom:12px}'
        + '.pep-track{height:8px;border-radius:4px;background:#1e293b;overflow:hidden;margin-top:6px}'
        + '.pep-bar{height:8px;border-radius:4px;background:linear-gradient(90deg,#6366f1,#22c55e)}'
        + '.pep-modal{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:100200}'
        + '.pep-modal-box{width:min(620px,92vw);background:#0b1220;border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:18px}'
        + '.pep-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}'
        + '.pep-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}'
        + '@media (max-width:960px){.pep-cards{grid-template-columns:1fr 1fr}.pep-grid{grid-template-columns:1fr}}'
        + '@media (max-width:640px){.pep-cards{grid-template-columns:1fr}}';
      document.head.appendChild(st);
    }
    function pagesParent() {
      var first = document.querySelector('[id^="page-"], [data-page]');
      return first && first.parentNode ? first.parentNode : document.body;
    }
    function ensurePage(pageId) {
      var page = document.getElementById('page-' + pageId) || document.querySelector('[data-page="' + pageId + '"]');
      if (page) return page;
      var base = document.querySelector('[id^="page-"], [data-page]');
      page = document.createElement('div');
      page.id = 'page-' + pageId;
      page.setAttribute('data-page', pageId);
      page.className = base && base.className ? base.className : 'page';
      page.style.display = 'none';
      pagesParent().appendChild(page);
      return page;
    }
    function showOnlyPage(pageId) {
      Array.prototype.slice.call(document.querySelectorAll('[id^="page-"], [data-page]')).forEach(function(pg) {
        try {
          var id = String(pg.getAttribute('data-page') || pg.id || '').replace(/^page-/, '');
          if (id === pageId) pg.style.display = '';
          else pg.style.display = 'none';
        } catch (_) {}
      });
    }

    async function loadFornecedores() {
      try {
        var j = await apiJson('/api/fornecedores');
        return Array.isArray(j) ? j : ((j && (j.data || j.fornecedores)) || []);
      } catch (_) { return []; }
    }
    async function loadGramaturas() {
      try {
        await apiJson('/api/gramaturas/init', { method: 'POST' }).catch(function() { return null; });
        var j = await apiJson('/api/gramaturas');
        return Array.isArray(j) ? j : ((j && (j.data || j.gramaturas)) || []);
      } catch (_) { return []; }
    }
    async function openGramaturaModal(item, done) {
      ensureStyles();
      var fornecedores = await loadFornecedores();
      var old = document.getElementById('pep-gram-modal');
      if (old) old.remove();
      var it = item || {};
      var wrap = document.createElement('div');
      wrap.id = 'pep-gram-modal';
      wrap.className = 'pep-modal';
      wrap.innerHTML = ''
        + '<div class="pep-modal-box">'
        + '  <div class="pep-head" style="margin-bottom:12px"><div><div class="pep-title" style="font-size:20px">' + (it.id ? 'Editar Gramatura' : 'Nova Gramatura') + '</div></div></div>'
        + '  <div class="pep-grid">'
        + '    <div><div class="pep-sub">Nome</div><input class="pep-input" id="pg-nome" value="' + esc(it.nome || '') + '" placeholder="Kraft 150"></div>'
        + '    <div><div class="pep-sub">Gramatura (g/m²)</div><input class="pep-input" id="pg-gram" type="number" step="0.01" value="' + esc(it.gramatura || '') + '"></div>'
        + '    <div><div class="pep-sub">Valor Unitário (R$/m²)</div><input class="pep-input" id="pg-vunit" type="number" step="0.01" value="' + esc(it.valor_unitario || '') + '"></div>'
        + '    <div><div class="pep-sub">Fornecedor</div>'
        + (fornecedores.length
            ? '<select class="pep-select" id="pg-forn"><option value="">Selecionar fornecedor...</option>' + fornecedores.map(function(f) { var id = String(f && f.id || ''); var nm = String(f && f.nome || ''); return '<option value="' + esc(id) + '"' + (String(it.fornecedor_id || '') === id ? ' selected' : '') + '>' + esc(nm) + '</option>'; }).join('') + '</select>'
            : '<input class="pep-input" id="pg-forn-livre" value="' + esc(it.fornecedor_nome || '') + '" placeholder="Fornecedor">')
        + '    </div>'
        + '  </div>'
        + '  <div class="pep-actions"><button class="pep-btn" id="pg-cancel">Cancelar</button><button class="pep-btn primary" id="pg-save">Salvar</button></div>'
        + '</div>';
      wrap.addEventListener('click', function(e) { if (e.target === wrap) wrap.remove(); });
      document.body.appendChild(wrap);
      document.getElementById('pg-cancel').onclick = function() { wrap.remove(); };
      document.getElementById('pg-save').onclick = async function() {
        try {
          var body = {
            nome: String(document.getElementById('pg-nome').value || '').trim(),
            gramatura: Number(document.getElementById('pg-gram').value || 0) || 0,
            valor_unitario: Number(document.getElementById('pg-vunit').value || 0) || 0
          };
          var sel = document.getElementById('pg-forn');
          var livre = document.getElementById('pg-forn-livre');
          if (sel && sel.value) {
            body.fornecedor_id = String(sel.value || '').trim();
            body.fornecedor_nome = String(sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].text || '').trim();
          } else if (livre) {
            body.fornecedor_nome = String(livre.value || '').trim();
          }
          await apiJson(it.id ? ('/api/gramaturas/' + encodeURIComponent(it.id)) : '/api/gramaturas', {
            method: it.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          wrap.remove();
          if (typeof done === 'function') done();
        } catch (e) {
          alert(String(e && e.message || e || 'Falha ao salvar gramatura'));
        }
      };
    }
    async function renderGramaturasPage() {
      ensureStyles();
      var page = ensurePage('gramaturas');
      showOnlyPage('gramaturas');
      var lista = await loadGramaturas();
      page.innerHTML = ''
        + '<div class="pep-wrap">'
        + '  <div class="pep-head"><div><div class="pep-title">📐 Gramaturas</div><div class="pep-sub">Cadastro de gramaturas e custo por m²</div></div><button class="pep-btn primary" id="gram-nova">+ Nova Gramatura</button></div>'
        + '  <div class="pep-panel"><div style="overflow:auto"><table class="pep-table"><thead><tr><th>Nome</th><th>Gramatura (g/m²)</th><th>Valor Unitário (R$/m²)</th><th>Fornecedor</th><th>Ações</th></tr></thead><tbody>'
        + (lista.length ? lista.map(function(g) {
          return '<tr data-gid="' + esc(g.id || '') + '"><td>' + esc(g.nome || '—') + '</td><td>' + num(g.gramatura || 0, 2) + '</td><td>' + money(g.valor_unitario || 0) + '</td><td>' + esc(g.fornecedor_nome || '—') + '</td><td><button class="pep-btn" data-gedit="' + esc(g.id || '') + '">Editar</button> <button class="pep-btn danger" data-gdel="' + esc(g.id || '') + '">Desativar</button></td></tr>';
        }).join('') : '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Nenhuma gramatura cadastrada.</td></tr>')
        + '  </tbody></table></div></div>'
        + '</div>';
      document.getElementById('gram-nova').onclick = function() { openGramaturaModal(null, renderGramaturasPage); };
      Array.prototype.slice.call(page.querySelectorAll('[data-gedit]')).forEach(function(btn) {
        btn.onclick = function() {
          var id = String(btn.getAttribute('data-gedit') || '');
          var item = (lista || []).find(function(g) { return String(g && g.id || '') === id; }) || null;
          openGramaturaModal(item, renderGramaturasPage);
        };
      });
      Array.prototype.slice.call(page.querySelectorAll('[data-gdel]')).forEach(function(btn) {
        btn.onclick = async function() {
          if (!confirm('Desativar esta gramatura?')) return;
          try {
            await apiJson('/api/gramaturas/' + encodeURIComponent(String(btn.getAttribute('data-gdel') || '')), { method: 'DELETE' });
            renderGramaturasPage();
          } catch (e) { alert(String(e && e.message || e || 'Falha ao desativar')); }
        };
      });
    }

    function currentMesAno() {
      var d = new Date();
      return { mes: d.getMonth() + 1, ano: d.getFullYear(), gramatura_id: '' };
    }
    function tonesState() {
      if (!window.__tonesState) window.__tonesState = currentMesAno();
      return window.__tonesState;
    }
    async function renderToneladasPage() {
      ensureStyles();
      var page = ensurePage('toneladas-vendidas');
      showOnlyPage('toneladas-vendidas');
      var st = tonesState();
      var grams = await loadGramaturas();
      var j = await apiJson('/api/analises/toneladas?mes=' + encodeURIComponent(st.mes) + '&ano=' + encodeURIComponent(st.ano)).catch(function() { return null; });
      var resumo = (j && j.resumo) || {};
      var det = Array.isArray(j && j.detalhamento) ? j.detalhamento : [];
      var totalOfs = det.length;
      var gramSel = (grams || []).find(function(g) { return String(g && g.id || '') === String(st.gramatura_id || ''); }) || null;
      var gramG = gramSel ? (Number(gramSel.gramatura || 0) || 0) : 0;
      var tonTotal = gramG > 0
        ? det.reduce(function(s, r) { return s + (((Number(r && r.m2_total || 0) || 0) * gramG) / 1000000); }, 0)
        : 0;
      var cardsTon = gramG > 0
        ? ('<div class="pep-card"><div class="pep-card-label">Toneladas Produzidas</div><div class="pep-card-val">' + num(tonTotal || 0, 3) + '</div><div class="pep-card-sub">' + esc(String(gramG).replace('.', ',') + ' g/m²') + '</div></div>')
        : '';
      var totalM2 = Number(resumo.total_m2 || 0) || 0;
      var receitaTotal = Number(resumo.receita_total || 0) || 0;
      var custoMedio = Number(resumo.custo_medio_m2 || 0) || 0;
      var totalizador = 'Total: ' + totalOfs + ' OFs · ' + num(totalM2 || 0, 3) + ' m² · ' + money(receitaTotal || 0);
      page.innerHTML = ''
        + '<div class="pep-wrap">'
        + '  <div class="pep-head">'
        + '    <div><div class="pep-title">⚖️ Toneladas Vendidas</div><div class="pep-sub">M² produzidos e estimativa de toneladas por gramatura</div></div>'
        + '    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
        + '      <select class="pep-select" id="tones-mes">' + Array.from({ length: 12 }).map(function(_, i) { var m = i + 1; return '<option value="' + m + '"' + (Number(st.mes) === m ? ' selected' : '') + '>' + String(m).padStart(2, '0') + '</option>'; }).join('') + '</select>'
        + '      <select class="pep-select" id="tones-ano">' + Array.from({ length: 5 }).map(function(_, i) { var a = new Date().getFullYear() - 2 + i; return '<option value="' + a + '"' + (Number(st.ano) === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select>'
        + '      <select class="pep-select" id="tones-gram"><option value="">Gramatura padrão (g/m²)</option>' + (grams || []).map(function(g) { var id = String(g && g.id || ''); var label = String(g && g.nome || '—') + ' · ' + num(g && g.gramatura || 0, 0) + ' g/m²'; return '<option value="' + esc(id) + '"' + (String(st.gramatura_id || '') === id ? ' selected' : '') + '>' + esc(label) + '</option>'; }).join('') + '</select>'
        + '      <button class="pep-btn primary" id="tones-refresh">Calcular</button>'
        + '    </div>'
        + '  </div>'
        + '  <div class="pep-cards">'
        + '    <div class="pep-card"><div class="pep-card-label">M² Produzidos</div><div class="pep-card-val">' + num(totalM2 || 0, 2) + '</div><div class="pep-card-sub">Área total do período</div></div>'
        + '    <div class="pep-card"><div class="pep-card-label">OFs Concluídas</div><div class="pep-card-val">' + num(totalOfs || 0, 0) + '</div><div class="pep-card-sub">Quantidade de OFs</div></div>'
        + '    <div class="pep-card"><div class="pep-card-label">Receita Total</div><div class="pep-card-val">' + money(receitaTotal || 0) + '</div><div class="pep-card-sub">Somatório do período</div></div>'
        + '    <div class="pep-card"><div class="pep-card-label">Custo Médio/m²</div><div class="pep-card-val">' + money(custoMedio || 0) + '</div><div class="pep-card-sub">Receita ÷ m²</div></div>'
        + cardsTon
        + '  </div>'
        + '  <div class="pep-panel">'
        + '    <div class="pep-head" style="margin-bottom:10px"><div class="pep-title" style="font-size:18px">Detalhamento</div><div class="pep-sub">' + esc(totalizador) + '</div></div>'
        + '    <div style="overflow:auto"><table class="pep-table"><thead><tr><th>Nº OF</th><th>Cliente</th><th>Produto</th><th>Comp×Larg (cm)</th><th>Área/Cx (m²)</th><th>Qtd</th><th>Total m²</th><th>Vl Unit</th><th>Custo/m²</th><th>Receita</th></tr></thead><tbody>'
        + (det.length ? det.map(function(r) {
          var compCm = Number(r && r.comp_cm || 0) || 0;
          var largCm = Number(r && r.larg_cm || 0) || 0;
          var semDim = !(compCm > 0 && largCm > 0);
          var dim = semDim ? 'sem dimensão' : (num(compCm, 0) + '×' + num(largCm, 0));
          var trStyle = semDim ? ' style="opacity:0.7;color:#94a3b8"' : '';
          return '<tr' + trStyle + '><td>#' + esc(r && r.of_numero || '—') + '</td><td>' + esc(r && (r.cliente_nome || r.cliente) || '—') + '</td><td>' + esc(r && r.produto || '—') + '</td><td>' + esc(dim) + '</td><td>' + (Number(r && r.area_m2 || 0) > 0 ? num(r.area_m2 || 0, 4) : '—') + '</td><td>' + num(r && r.quantidade || 0, 0) + '</td><td>' + num(r && r.m2_total || 0, 2) + '</td><td>' + money(r && r.valor_unitario || 0) + '</td><td>' + money(r && r.custo_m2 || 0) + '</td><td>' + money(r && r.receita || 0) + '</td></tr>';
        }).join('') : '<tr><td colspan="10" style="text-align:center;color:#94a3b8">Nenhuma OF concluída no período.</td></tr>')
        + '    </tbody><tfoot><tr><td colspan="10" style="font-weight:800;color:#e5e7eb">' + esc(totalizador) + '</td></tr></tfoot></table></div>'
        + '  </div>'
        + '</div>';
      document.getElementById('tones-refresh').onclick = function() {
        st.mes = Number(document.getElementById('tones-mes').value || 1);
        st.ano = Number(document.getElementById('tones-ano').value || new Date().getFullYear());
        st.gramatura_id = String((document.getElementById('tones-gram') || {}).value || '').trim();
        renderToneladasPage();
      };
    }

    function openCustomPage(pageId) {
      if (pageId === 'gramaturas') { renderGramaturasPage(); return true; }
      if (pageId === 'toneladas-vendidas') { renderToneladasPage(); return true; }
      return false;
    }
    try {
      var origGo = window.go;
      if (typeof origGo === 'function' && !origGo._patchExtrasCustom) {
        window.go = function(id) {
          var pid = String(id || '').trim();
          if (openCustomPage(pid)) return;
          return origGo.apply(this, arguments);
        };
        window.go._patchExtrasCustom = true;
      }
    } catch (_) {}
    try { window.renderGramaturas = renderGramaturasPage; } catch (_) {}
    try { window.carregarGramaturas = renderGramaturasPage; } catch (_) {}
    try { window.renderToneladasVendidas = renderToneladasPage; } catch (_) {}
    try { _ensureVendedoresMap(); } catch (_) {}
  })();

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
    try{ if (typeof (window.go) === 'function') window.go(pid); }catch(e){}
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

  (function patchPermissoesLiberadasExcetoFinanceiro() {
    function isFinanceiroPage(pid) {
      var page = String(pid || '').trim().toLowerCase();
      return page === 'orcamentos' || page === 'comissoes';
    }

    function liberarElementosNaoFinanceiro() {
      try {
        document.querySelectorAll('.nav-item, .menu-item, [data-section], button, a, [onclick]').forEach(function(el) {
          if (!el) return;
          var dentroFinanceiro = false;
          try {
            dentroFinanceiro = !!el.closest('#nav-group-financeiro, #ng-financeiro, #menu-fin-orcamentos, #menu-fin-comissoes');
          } catch (_) {}
          if (dentroFinanceiro) return;
          try { el.disabled = false; } catch (_) {}
          try { el.removeAttribute('disabled'); } catch (_) {}
          try { el.removeAttribute('aria-disabled'); } catch (_) {}
          try { el.style.pointerEvents = ''; } catch (_) {}
          try { el.style.opacity = ''; } catch (_) {}
          try { if (el.classList) el.classList.remove('bloqueado', 'disabled', 'is-disabled'); } catch (_) {}
          try {
            var ds = String(el.style.display || '').trim().toLowerCase();
            if (ds === 'none') el.style.display = '';
          } catch (_) {}
        });
      } catch (_) {}
      try {
        document.querySelectorAll('.no-perm-overlay').forEach(function(el) { el.remove(); });
      } catch (_) {}
    }

    function hook() {
      if (window.__patchPermissoesLiberadasExcetoFinanceiro) return;
      window.__patchPermissoesLiberadasExcetoFinanceiro = true;

      var origHasPerm = (typeof window.hasPerm === 'function') ? window.hasPerm : null;
      var origTemPermPagina = (typeof window.temPermPagina === 'function') ? window.temPermPagina : null;
      var origAplicarPermissoes = (typeof window.aplicarPermissoes === 'function') ? window.aplicarPermissoes : null;
      var origMostrarSemPermissao = (typeof window.mostrarSemPermissao === 'function') ? window.mostrarSemPermissao : null;

      window.hasPerm = function(keyOrList) {
        if (Array.isArray(keyOrList)) {
          return keyOrList.some(function(k) { return window.hasPerm(k); });
        }
        var key = String(keyOrList || '').trim().toLowerCase();
        if (!key) return true;
        if (key.indexOf('financeiro') >= 0) {
          try { return origHasPerm ? !!origHasPerm.apply(this, arguments) : true; } catch (_) { return true; }
        }
        return true;
      };

      window.temPermPagina = function(paginaId) {
        var pid = String(paginaId || '').trim();
        if (!isFinanceiroPage(pid)) return true;
        if (origTemPermPagina) {
          try { return !!origTemPermPagina.apply(this, arguments); } catch (_) {}
        }
        try {
          if (sessionStorage.getItem('fin_ok') === '1') return true;
          var s = prompt('Senha do Financeiro:');
          if (s === null) return false;
          if (String(s).trim() === '1234') {
            sessionStorage.setItem('fin_ok', '1');
            return true;
          }
          if (String(s).trim() !== '') alert('Senha incorreta.');
        } catch (_) {}
        return false;
      };

      window.aplicarPermissoes = function() {
        try { if (origAplicarPermissoes) origAplicarPermissoes.apply(this, arguments); } catch (_) {}
        liberarElementosNaoFinanceiro();
      };

      window.mostrarSemPermissao = function(paginaId) {
        if (!isFinanceiroPage(paginaId)) {
          liberarElementosNaoFinanceiro();
          return;
        }
        try { if (origMostrarSemPermissao) return origMostrarSemPermissao.apply(this, arguments); } catch (_) {}
      };

      window.podeSelecionarChapas = function() { return true; };

      try {
        var origGo = window.go;
        if (typeof origGo === 'function' && !origGo._patchPermissoesLiberadasExcetoFinanceiro) {
          var wrappedGo = function(id) {
            var ret = origGo.apply(this, arguments);
            setTimeout(liberarElementosNaoFinanceiro, 40);
            return ret;
          };
          wrappedGo._patchPermissoesLiberadasExcetoFinanceiro = true;
          window.go = wrappedGo;
        }
      } catch (_) {}

      liberarElementosNaoFinanceiro();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        hook();
        setInterval(liberarElementosNaoFinanceiro, 1500);
      });
    } else {
      hook();
      setInterval(liberarElementosNaoFinanceiro, 1500);
    }
  })();

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
    var def = ['hub', 'pcp', 'ofmaq'];
    var arr = null;
    try {
      var salvo = localStorage.getItem('hotbar_config');
      if (salvo) {
        var x = JSON.parse(salvo);
        if (Array.isArray(x)) arr = x;
      }
    } catch(e) {}
    if (!Array.isArray(arr) || arr.length === 0) return def.slice();
    var out = [];
    arr.forEach(function(id){
      var pid = String(id || '').trim();
      if (!pid) return;
      if (out.indexOf(pid) !== -1) return;
      if (!_isValidPageId(pid)) return;
      out.push(pid);
    });
    if (out.indexOf('hub') === -1) out.unshift('hub');
    if (out[0] !== 'hub') out = ['hub'].concat(out.filter(function(x){ return x !== 'hub'; }));
    return out.slice(0, 4);
  }

  function salvarHotbarConfig(ids) {
    var arr = Array.isArray(ids) ? ids : [];
    var out = [];
    arr.forEach(function(id){
      var pid = String(id || '').trim();
      if (!pid) return;
      if (out.indexOf(pid) !== -1) return;
      if (!_isValidPageId(pid)) return;
      out.push(pid);
    });
    if (out.indexOf('hub') === -1) out.unshift('hub');
    if (out[0] !== 'hub') out = ['hub'].concat(out.filter(function(x){ return x !== 'hub'; }));
    out = out.slice(0, 4);
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
      var on = 'mobileGoPage(&quot;' + aba.id + '&quot;)';
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
  window.renderHotbarPatch = renderHotbar;

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
    html += '<button onclick="abrirPersonalizarHotbar()" style="' +
      'width:100%;background:rgba(74,144,217,0.1);color:#4A90D9;' +
      'border:1px solid rgba(74,144,217,0.25);border-radius:10px;' +
      'padding:12px;cursor:pointer;font-size:13px;font-weight:600;' +
      'display:flex;align-items:center;gap:8px;margin-bottom:14px;justify-content:center">' +
      '⚙ Personalizar barra de navegação</button>';

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

  window.abrirPersonalizarHotbar = function() {
    var menu = document.getElementById('mob-menu-mais');
    if (menu) menu.remove();

    var old = document.getElementById('modal-personalizar-hotbar');
    if (old) { old.remove(); return; }

    var configuradas = [];
    try{
      var x = JSON.parse(localStorage.getItem('hotbar_config') || '["hub","pcp","ofmaq"]');
      if (Array.isArray(x)) configuradas = x.map(function(a){ return String(a||'').trim(); }).filter(Boolean);
    }catch(e){ configuradas = ['hub','pcp','ofmaq']; }
    if (configuradas.indexOf('hub') === -1) configuradas.unshift('hub');

    var paginas = (window._todasPaginas || PAGINAS_REAIS_DESKTOP || []).filter(function(p){
      if (!p || !p.id) return false;
      if (p.id === 'hub') return false;
      var elPage = document.getElementById('page-' + p.id) || document.querySelector('[data-page="' + p.id + '"]');
      return !!elPage;
    });

    var overlay = document.createElement('div');
    overlay.id = 'modal-personalizar-hotbar';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9600;display:flex;align-items:flex-end';

    overlay.innerHTML =
      '<div style="background:#0b1220;border-radius:18px 18px 0 0;width:100%;max-height:85vh;overflow-y:auto;padding:20px">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px;align-items:center">' +
          '<span style="color:#e2e8f0;font-weight:700;font-size:15px">Personalizar Hotbar</span>' +
          '<button onclick="document.getElementById(&quot;modal-personalizar-hotbar&quot;).remove()" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer">✕</button>' +
        '</div>' +
        '<p style="color:#64748b;font-size:12px;margin:0 0 16px">Máximo 4 atalhos. Hub é fixo.</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          paginas.map(function(p){
            var selecionado = configuradas.indexOf(p.id) !== -1;
            var ic = String(p.icone || '📌').replace(/</g,'').replace(/>/g,'');
            var lb = String(p.label || p.id).replace(/</g,'').replace(/>/g,'');
            return '<label style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,' + (selecionado?'0.15':'0.07') + ');border-radius:10px;cursor:pointer">' +
              '<input type="checkbox" ' + (selecionado?'checked':'') + ' data-id="' + p.id + '" onchange="toggleHotbarItem(this)" style="width:20px;height:20px;accent-color:#4A90D9;flex-shrink:0">' +
              '<span style="font-size:18px">' + ic + '</span>' +
              '<span style="color:#e2e8f0;font-size:14px">' + lb + '</span>' +
            '</label>';
          }).join('') +
        '</div>' +
        '<button onclick="salvarHotbarConfig()" style="width:100%;background:#4A90D9;color:#fff;border:none;border-radius:10px;padding:14px;cursor:pointer;font-size:14px;font-weight:600;margin-top:16px">Salvar configuração</button>' +
      '</div>';

    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  };

  window.toggleHotbarItem = function(checkbox) {
    try{
      var selecionados = Array.prototype.slice.call(document.querySelectorAll('#modal-personalizar-hotbar input[type="checkbox"]:checked'))
        .map(function(cb){ return String(cb.dataset && cb.dataset.id || '').trim(); })
        .filter(Boolean);
      if (selecionados.length > 3 && checkbox && checkbox.checked) {
        checkbox.checked = false;
        alert('Máximo 3 atalhos além do Hub.');
      }
    }catch(e){}
  };

  window.salvarHotbarConfig = function() {
    var selecionados = ['hub'].concat(
      Array.prototype.slice.call(document.querySelectorAll('#modal-personalizar-hotbar input[type="checkbox"]:checked'))
        .map(function(cb){ return String(cb.dataset && cb.dataset.id || '').trim(); })
        .filter(Boolean)
        .slice(0, 3)
    );
    salvarHotbarConfig(selecionados);
    try{ document.getElementById('modal-personalizar-hotbar') && document.getElementById('modal-personalizar-hotbar').remove(); }catch(e){}
    alert('Hotbar salva! ✓');
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

  try {
    if (window._patchAccordionObs && typeof window._patchAccordionObs.disconnect === 'function') window._patchAccordionObs.disconnect();
  } catch (_) {}
  window._patchAccordionObs = new MutationObserver(function(muts, observer) {
    if (window._pausarObservers) return;
    var encontrou = muts.some(function(m) {
      return Array.from(m.addedNodes).some(function(n) {
        return n.nodeType === 1 && (
          (n.classList && n.classList.contains('maq-header')) ||
          (n.querySelector && n.querySelector('.maq-header'))
        );
      });
    });
    if (encontrou) {
      setTimeout(aplicarAccordion, 200);
      try { observer.disconnect(); } catch (_) {}
      try { window._patchAccordionObs = null; } catch (_) {}
    }
  });
  window._patchAccordionObs.observe(document.body, { childList: true, subtree: true });

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

  function patchAbrirOfRapida() { return; }

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

  function patchGoAcordeon() { return; }

  console.log('[PATCH] v3 ativo - Italy Embalagens ERP');
  patchToggleMobMenu();
  patchRenderHub();
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
    } catch(e) {}
  }, 1000);

})();
} catch (e) {
  try { console.error('[PATCH INIT ERROR]', e && e.message, e && e.stack); } catch (_) {}
}

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
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  [id^="page-"] {
    max-width: 100% !important;
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

(function patchErpFixesV4() {
  try {
    if (!document.getElementById('patch-fixes-v4-style')) {
      var st = document.createElement('style');
      st.id = 'patch-fixes-v4-style';
      st.textContent = `
.historico-passagens,
#historico-passagens,
[id*="historico"],
[class*="historico-lista"]{
  overflow-y:auto !important;
  max-height:60vh !important;
}
.modal-box .historico-passagens,
.modal-box #historico-passagens,
.modal-box [id*="historico"],
.modal-box [class*="historico-lista"]{
  overflow-y:auto !important;
  max-height:60vh !important;
}

#page-historico-passagens{
  max-height:none !important;
  overflow:visible !important;
}
#hist-graficos-wrap{
  overflow:visible !important;
}
#hist-graficos-wrap > div > div > div[style*="height"]{
  position:relative !important;
  overflow:visible !important;
  height:260px !important;
}
#hist-graficos-wrap > div > div:nth-child(2) > div[style*="height"]{
  height:240px !important;
}
#hist-chart-semana,
#hist-chart-mes{
  display:block !important;
  width:100% !important;
  height:100% !important;
}

@media print{
  body, .relatorio-inativos, table, td, th, tr, span, p, div{
    color:#000 !important;
    -webkit-print-color-adjust:exact !important;
  }
}
.relatorio-inativos td,
.relatorio-inativos th,
.relatorio-inativos .cliente-nome,
#relatorio-inativos *{
  color:#1a1a1a !important;
}
      `;
      document.head.appendChild(st);
    }
  } catch (_) {}

  function patchHistoricoPassagensGraficos() {
    var fn = window.carregarGraficosPassagens;
    if (typeof fn !== 'function' || fn._patchFixChartMes) return;
    var wrapped = async function() {
      var r = await fn.apply(this, arguments);
      try {
        var cMes = document.getElementById('hist-chart-mes');
        var cSemana = document.getElementById('hist-chart-semana');
        if (cMes) {
          cMes.setAttribute('height', '240');
          cMes.style.height = '240px';
          cMes.style.maxHeight = 'none';
        }
        if (cSemana) {
          cSemana.setAttribute('height', '260');
          cSemana.style.height = '260px';
          cSemana.style.maxHeight = 'none';
        }
        var wrapMes = cMes ? cMes.parentElement : null;
        if (wrapMes) {
          wrapMes.style.position = 'relative';
          wrapMes.style.overflow = 'visible';
          wrapMes.style.height = '240px';
          wrapMes.style.maxHeight = 'none';
        }
        var wrapSemana = cSemana ? cSemana.parentElement : null;
        if (wrapSemana) {
          wrapSemana.style.position = 'relative';
          wrapSemana.style.overflow = 'visible';
          wrapSemana.style.height = '260px';
          wrapSemana.style.maxHeight = 'none';
        }
        try { if (window._histChartMes && typeof window._histChartMes.resize === 'function') window._histChartMes.resize(); } catch (_) {}
        try { if (window._histChartSemana && typeof window._histChartSemana.resize === 'function') window._histChartSemana.resize(); } catch (_) {}
      } catch (_) {}
      return r;
    };
    wrapped._patchFixChartMes = true;
    window.carregarGraficosPassagens = wrapped;
  }
  try { patchHistoricoPassagensGraficos(); } catch (_) {}

  function _normUpper(s) {
    var v = String(s == null ? '' : s).trim().toUpperCase();
    try { v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    v = v.replace(/\s+/g, ' ').trim();
    return v;
  }

  function _parseJsonMaybe(v) {
    if (v == null) return null;
    if (Array.isArray(v) || typeof v === 'object') return v;
    if (typeof v === 'string') {
      var s = v.trim();
      if (!s) return null;
      try { return JSON.parse(s); } catch (_) { return null; }
    }
    return null;
  }

  function _maquinasFromOf(of) {
    var list = [];
    if (!of || typeof of !== 'object') return list;
    var fluxo = _parseJsonMaybe(of.fluxo_maquinas) ?? _parseJsonMaybe(of.maq) ?? null;
    if (Array.isArray(fluxo)) {
      fluxo.forEach(function(m) {
        if (typeof m === 'string') list.push(m);
        else if (m && typeof m === 'object') list.push(m.nome || m.name || m.maquina || '');
      });
    }
    var ag = String(of.maquina_agendada || '').trim();
    if (ag) list.unshift(ag);
    list = list.map(function(x) { return String(x || '').trim(); }).filter(Boolean);
    var uniq = [];
    var seen = new Set();
    list.forEach(function(x) {
      var k = _normUpper(x);
      if (!k || seen.has(k)) return;
      seen.add(k);
      uniq.push(x);
    });
    return uniq;
  }

  function _opsFromOf(of) {
    var ops = [];
    if (!of || typeof of !== 'object') return ops;
    var raw = _parseJsonMaybe(of.operadores_conclusao);
    if (Array.isArray(raw)) {
      raw.forEach(function(o) {
        if (typeof o === 'string') ops.push(o);
        else if (o && typeof o === 'object') ops.push(o.nome || o.name || o.operador || o.usuario || '');
      });
    }
    var one = String(of.operador_conclusao || '').trim();
    if (one) ops.push(one);
    ops = ops.map(function(x) { return String(x || '').trim(); }).filter(Boolean);
    var uniq = [];
    var seen = new Set();
    ops.forEach(function(x) {
      var k = _normUpper(x);
      if (!k || seen.has(k)) return;
      seen.add(k);
      uniq.push(x);
    });
    return uniq;
  }

  async function _buscarOfPorNumero(numero) {
    var num = String(numero || '').replace(/\D/g, '').trim();
    if (!num) return null;
    var token = '';
    try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { token = ''; }
    var h = token ? { Authorization: 'Bearer ' + token } : {};
    var url = '/api/ofs?numero=' + encodeURIComponent(num) + '&lite=1&limit=5&excluir_canceladas=1&nocache=1&t=' + Date.now();
    var r = await fetch(url, { headers: h });
    var j = await r.json().catch(function() { return null; });
    var data = extractOfsRows(j);
    return (Array.isArray(data) && data[0]) ? data[0] : null;
  }

  function _preencherMaq(maqList) {
    var sel = document.getElementById('inc-maquina');
    if (sel && maqList.length) {
      var alvo = _normUpper(maqList[0]);
      var foundVal = '';
      try {
        Array.from(sel.options || []).forEach(function(opt) {
          if (foundVal) return;
          var txt = String(opt.textContent || opt.value || '').trim();
          if (_normUpper(txt) === alvo) foundVal = opt.value || txt;
        });
      } catch (_) {}
      if (foundVal) sel.value = foundVal;
      else sel.value = maqList[0];
    }
    var wrap = document.getElementById('inc-maquinas-checkboxes');
    if (wrap) {
      var set = new Set(maqList.map(_normUpper));
      Array.from(wrap.querySelectorAll('input[type="checkbox"]')).forEach(function(cb) {
        var v = String(cb.value || '').trim();
        cb.checked = !!(v && set.has(_normUpper(v)));
      });
    }
  }

  function _preencherOps(opsList) {
    var cont = document.getElementById('inc-operadores-of-lista');
    if (!cont) return;
    var set = new Set(opsList.map(_normUpper));
    Array.from(cont.querySelectorAll('input[type="checkbox"]')).forEach(function(cb) {
      var v = String(cb.value || '').trim();
      cb.checked = !!(v && set.has(_normUpper(v)));
    });
  }

  var _lastNum = '';
  var _lock = false;
  async function _onOfNumero() {
    if (_lock) return;
    var input = document.getElementById('inc-of-numero');
    if (!input) return;
    var num = String(input.value || '').replace(/\D/g, '').trim();
    if (!num || num === _lastNum) return;
    _lastNum = num;
    _lock = true;
    try {
      var of = await _buscarOfPorNumero(num);
      if (of) {
        _preencherMaq(_maquinasFromOf(of));
        _preencherOps(_opsFromOf(of));
      }
    } catch (_) {}
    _lock = false;
  }

  function _bindInc() {
    var input = document.getElementById('inc-of-numero');
    if (!input || input.dataset.patchAutoOf === '1') return;
    input.dataset.patchAutoOf = '1';
    input.addEventListener('blur', _onOfNumero, true);
    input.addEventListener('change', _onOfNumero, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(_bindInc, 200); setInterval(_bindInc, 900); });
  } else {
    setTimeout(_bindInc, 200);
    setInterval(_bindInc, 900);
  }
})();

(function initComissoesEditarQtdProduzida() {
  function escSel(s) {
    var v = String(s || '');
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(v);
    return v.replace(/[^a-zA-Z0-9_\-]/g, function(ch) { return '\\' + ch; });
  }

  function findOfById(ofId) {
    var id = String(ofId || '').trim();
    if (!id) return null;
    var d = window._comissoesData;
    var vds = d && Array.isArray(d.vendedores) ? d.vendedores : [];
    for (var i = 0; i < vds.length; i++) {
      var ofs = vds[i] && Array.isArray(vds[i].ofs) ? vds[i].ofs : [];
      for (var j = 0; j < ofs.length; j++) {
        var o = ofs[j];
        var oid = String((o && (o.id || o.of_id || o.ofId)) || '').trim();
        if (oid === id) return o;
      }
    }
    return null;
  }

  function recalcOperadoresProporcional(ops, qtdAnt, qtdNova) {
    if (!Array.isArray(ops)) return ops;
    var a = Math.trunc(Number(qtdAnt || 0) || 0);
    var n = Math.trunc(Number(qtdNova || 0) || 0);
    if (!(a > 0) || n < 0) return ops;
    var items = ops.map(function(o, idx) {
      if (!o || typeof o !== 'object') return { idx: idx, o: o, has: false };
      var raw = (o.qtd != null) ? Number(o.qtd) : (o.quantidade != null ? Number(o.quantidade) : NaN);
      if (!Number.isFinite(raw)) return { idx: idx, o: o, has: false };
      var prop = (raw / a) * n;
      var base = Math.floor(prop);
      var rem = prop - base;
      return { idx: idx, o: o, has: true, base: base, rem: rem };
    });
    var picked = items.filter(function(x) { return x.has; });
    if (!picked.length) return ops;
    var sumBase = picked.reduce(function(s, x) { return s + x.base; }, 0);
    var remaining = n - sumBase;
    picked.sort(function(x, y) { return y.rem - x.rem; });
    for (var i = 0; i < picked.length && remaining > 0; i++) { picked[i].base += 1; remaining--; }
    if (remaining < 0) {
      picked.sort(function(x, y) { return x.rem - y.rem; });
      for (var j = 0; j < picked.length && remaining < 0; j++) {
        if (picked[j].base > 0) { picked[j].base -= 1; remaining++; }
      }
    }
    var byIdx = {};
    picked.forEach(function(x) { byIdx[x.idx] = x.base; });
    return ops.map(function(o, idx) {
      if (!Object.prototype.hasOwnProperty.call(byIdx, idx)) return o;
      var out = (o && typeof o === 'object') ? Object.assign({}, o) : {};
      if (Object.prototype.hasOwnProperty.call(out, 'qtd')) out.qtd = byIdx[idx];
      else if (Object.prototype.hasOwnProperty.call(out, 'quantidade')) out.quantidade = byIdx[idx];
      else out.qtd = byIdx[idx];
      return out;
    });
  }

  function enhanceComissoesTable() {
    try {
      if (String(window._PAGE_ATUAL || '') !== 'comissoes') return;
      var tab = document.getElementById('tabela-comissoes-ofs');
      if (!tab) return;
      var trs = tab.querySelectorAll('tbody tr');
      if (!trs || !trs.length) return;
      trs.forEach(function(tr) {
        if (!tr || tr.dataset.patchQtdProd === '1') return;
        var btn = tr.querySelector('button[onclick*="abrirModalTrocarVendedorOF"]');
        if (!btn) return;
        var oc = String(btn.getAttribute('onclick') || '');
        var m = oc.match(/abrirModalTrocarVendedorOF\('([^']*)'/);
        var ofId = m && m[1] ? String(m[1]).trim() : '';
        if (!ofId) return;
        var ofObj = findOfById(ofId) || {};
        var qtdProd = Math.trunc(Number(ofObj.qtd_produzida ?? ofObj.qtdProduzida ?? ofObj.qtd_real ?? ofObj.qtdReal ?? 0) || 0);
        var tdQtd = tr.children && tr.children[3] ? tr.children[3] : null;
        if (!tdQtd) return;
        var wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:2px;';
        var top = document.createElement('div');
        top.innerHTML = tdQtd.innerHTML;
        var bottom = document.createElement('div');
        bottom.className = 'patch-qtdprod-row';
        bottom.style.cssText = 'display:flex;align-items:center;gap:6px;justify-content:flex-end;';
        bottom.innerHTML =
          '<span style="color:#94a3b8;font-size:0.72rem">Prod:</span>' +
          '<span class="patch-qtdprod-val" data-of-id="' + ofId + '" style="font-weight:800;color:#22d3ee">' + qtdProd + '</span>' +
          '<button type="button" class="patch-qtdprod-edit" data-of-id="' + ofId + '" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;border-radius:6px;padding:2px 6px;cursor:pointer;font-size:0.78rem;line-height:1">✏️</button>';
        wrap.appendChild(top);
        wrap.appendChild(bottom);
        tdQtd.innerHTML = '';
        tdQtd.appendChild(wrap);
        tr.dataset.patchQtdProd = '1';
      });
    } catch (_) {}
  }

  async function salvarQtdProduzida(ofId, qtdNova) {
    var id = String(ofId || '').trim();
    var ofObj = findOfById(id) || null;
    if (!id || !ofObj) throw new Error('OF inválida');
    var qtdAnt = Math.trunc(Number(ofObj.qtd_produzida ?? 0) || 0);
    var caixasAnt = Math.trunc(Number(ofObj.caixas_boas ?? 0) || 0);
    var valorAntigo = Number(ofObj.valor_venda ?? ofObj.valor_total ?? ofObj.vl_total ?? ofObj.total ?? 0) || 0;
    var valorUnitario = (qtdAnt > 0) ? (valorAntigo / qtdAnt) : 0;
    var novoTotal = (valorUnitario > 0)
      ? (Math.round((valorUnitario * qtdNova) * 100) / 100)
      : valorAntigo;
    var opsRaw = ofObj.operadores_conclusao ?? null;
    var ops = null;
    if (opsRaw != null) {
      try { ops = (typeof opsRaw === 'string') ? JSON.parse(String(opsRaw || '[]')) : opsRaw; } catch (_) { ops = null; }
    }
    var opsNovo = Array.isArray(ops) ? recalcOperadoresProporcional(ops, qtdAnt, qtdNova) : null;
    var caixasNova = Math.max(0, caixasAnt + (qtdNova - qtdAnt));
    var payload = {
      qtd_produzida: qtdNova,
      caixas_boas: caixasNova,
      valor_venda: novoTotal,
      valor_total: novoTotal
    };
    if (Array.isArray(opsNovo)) payload.operadores_conclusao = opsNovo;

    var resp = null;
    if (typeof window.apiFetch === 'function') {
      resp = await window.apiFetch('/api/ofs/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(payload) });
    } else {
      var base = (window.location && window.location.protocol === 'file:') ? (window.API_BASE || '') : '';
      var token = '';
      try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) {}
      resp = await fetch(base + '/api/ofs/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload),
      });
    }
    var json = await resp.json().catch(function() { return null; });
    if (!resp.ok || (json && json.ok === false)) throw new Error(String(json?.error || 'Erro'));

    ofObj.qtd_produzida = qtdNova;
    ofObj.caixas_boas = caixasNova;
    ofObj.valor_venda = novoTotal;
    ofObj.valor_total = novoTotal;
    ofObj.total = novoTotal;
    ofObj.vl_total = novoTotal;
    if (Array.isArray(opsNovo)) ofObj.operadores_conclusao = opsNovo;
    try {
      var idx = Array.isArray(window.OFs) ? window.OFs.findIndex(function(o) { return String(o?.id || '').trim() === id; }) : -1;
      if (idx >= 0) {
        window.OFs[idx].qtd_produzida = qtdNova;
        window.OFs[idx].caixas_boas = caixasNova;
        window.OFs[idx].valor_venda = novoTotal;
        window.OFs[idx].valor_total = novoTotal;
        window.OFs[idx].total = novoTotal;
        window.OFs[idx].vl_total = novoTotal;
        if (Array.isArray(opsNovo)) window.OFs[idx].operadores_conclusao = opsNovo;
      }
    } catch (_) {}
    try {
      if (typeof window.comRecalcularLocal === 'function') window.comRecalcularLocal();
    } catch (_) {}
    return {
      qtdNova: qtdNova,
      novoTotal: novoTotal
    };
  }

  function bindInlineEdit() {
    if (window.__patchComQtdProdBind) return;
    window.__patchComQtdProdBind = true;
    document.addEventListener('click', function(ev) {
      var btn = ev && ev.target && ev.target.closest ? ev.target.closest('.patch-qtdprod-edit') : null;
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      var ofId = String(btn.dataset.ofId || '').trim();
      if (!ofId) return;
      var row = btn.parentElement;
      if (!row || row.dataset.editing === '1') return;
      var ofObj = findOfById(ofId) || {};
      var qtdAnt = Math.trunc(Number(ofObj.qtd_produzida ?? 0) || 0);
      row.dataset.editing = '1';
      var original = row.innerHTML;
      row.innerHTML = '';

      var lab = document.createElement('span');
      lab.textContent = 'Prod:';
      lab.style.cssText = 'color:#94a3b8;font-size:0.72rem';
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.min = '0';
      inp.step = '1';
      inp.value = String(qtdAnt);
      inp.style.cssText = 'width:92px;padding:4px 6px;border-radius:6px;border:1px solid rgba(255,255,255,0.14);background:rgba(15,23,42,0.6);color:#e2e8f0;font-size:0.85rem;';
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.textContent = '✅';
      ok.style.cssText = 'background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.35);color:#4ade80;border-radius:6px;padding:2px 6px;cursor:pointer;';
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = '❌';
      cancel.style.cssText = 'background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:6px;padding:2px 6px;cursor:pointer;';
      row.appendChild(lab);
      row.appendChild(inp);
      row.appendChild(ok);
      row.appendChild(cancel);
      setTimeout(function() { try { inp.focus(); inp.select(); } catch (_) {} }, 0);

      function restore() { row.innerHTML = original; row.dataset.editing = '0'; }
      cancel.onclick = function(e) { if (e) { e.preventDefault(); e.stopPropagation(); } restore(); };
      ok.onclick = async function(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var qtdNova = Math.trunc(Number(inp.value || 0) || 0);
        if (qtdNova < 0) { try { window.toast('Quantidade inválida', 'var(--orange)'); } catch (_) {} return; }
        try {
          var resultado = await salvarQtdProduzida(ofId, qtdNova);
          restore();
          var vEl = document.querySelector('.patch-qtdprod-val[data-of-id="' + escSel(ofId) + '"]');
          if (vEl) vEl.textContent = String(qtdNova);
          try {
            var tr = btn.closest ? btn.closest('tr') : null;
            var tdTotal = tr && tr.children && tr.children[5] ? tr.children[5] : null;
            if (tdTotal && typeof window.comFmtMoney === 'function') {
              tdTotal.textContent = window.comFmtMoney(Number(resultado?.novoTotal || 0));
            }
            var tdCom = tr && tr.children && tr.children[7] ? tr.children[7] : null;
            var ofAtual = findOfById(ofId) || null;
            if (tdCom && ofAtual && typeof window.comFmtMoney === 'function') {
              tdCom.textContent = window.comFmtMoney(Number(ofAtual.comissaoValor || 0));
            }
          } catch (_) {}
          try {
            if (typeof window['renderComissoes'] === 'function') window['renderComissoes']();
          } catch (_) {}
          try { window.toast('✓ Quantidade produzida atualizada', 'var(--green)'); } catch (_) {}
        } catch (err) {
          try { window.toast('Erro ao salvar qtd produzida', 'var(--red)'); } catch (_) {}
          restore();
        }
      };
    }, true);
  }

  function hookRenderComissoes() {
    if (window.__patchComHooked) return;
    window.__patchComHooked = true;
    try { setTimeout(enhanceComissoesTable, 0); } catch (_) {}
    try {
      var term = String(window.__comissoesBuscaTerm || '').trim();
      if (term && typeof window.filtrarComissoesPorBusca === 'function') window.filtrarComissoesPorBusca(term);
    } catch (_) {}
  }

  (function() {
    if (window.__cpDashboardV2Installed) return;
    window.__cpDashboardV2Installed = true;

    function _cpHost() {
      return document.querySelector('[data-secao-ativa="caixas-perdidas"]')
        || document.querySelector('#page-caixas-perdidas')
        || document.querySelector('#caixas-perdidas-content')
        || document.querySelector('[data-section="caixas-perdidas"]')
        || document.querySelector('.caixas-perdidas-container')
        || null;
    }

    function _cpEsc(v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function(ch) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[ch] || ch; }); }
    function _cpFmtMoney(v) { try { return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } catch (_) { return 'R$ 0,00'; } }
    function _cpFmtNum(v) { try { return Number(v || 0).toLocaleString('pt-BR'); } catch (_) { return String(v || 0); } }
    function _cpNorm(v) { try { return String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) { return String(v || '').trim().toLowerCase(); } }
    function _cpDateBr(v) {
      var s = String(v || '').trim();
      if (!s) return '—';
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4);
      return s;
    }
    function _cpList(v) {
      if (Array.isArray(v)) return v.map(function(x) { return String(x || '').trim(); }).filter(Boolean);
      if (typeof v === 'string') {
        var s = String(v || '').trim();
        if (!s) return [];
        if ((s.charAt(0) === '[' && s.charAt(s.length - 1) === ']') || (s.charAt(0) === '{' && s.charAt(s.length - 1) === '}')) {
          try {
            var p = JSON.parse(s);
            if (Array.isArray(p)) return p.map(function(x) { return String(x || '').trim(); }).filter(Boolean);
          } catch (_) {}
        }
        return s.split(/[,;|/]+/g).map(function(x) { return String(x || '').trim(); }).filter(Boolean);
      }
      return [];
    }

    function _cpEnsureStyleV2() {
      if (window._caixasPerdidaStyleV2) return;
      window._caixasPerdidaStyleV2 = true;
      var st = document.createElement('style');
      st.id = 'cp-dashboard-v2-style';
      st.textContent = ''
        + '.cpv2{padding:18px;color:var(--text1,#e5e7eb)}'
        + '.cpv2-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px}'
        + '.cpv2-title{font-size:24px;font-weight:800;color:#f8fafc}'
        + '.cpv2-sub{font-size:12px;color:#94a3b8;margin-top:4px}'
        + '.cpv2-actions,.cpv2-filters,.cpv2-periods{display:flex;gap:8px;flex-wrap:wrap;align-items:center}'
        + '.cpv2-btn,.cpv2-select,.cpv2-search{background:#0f172a;border:1px solid #1e293b;color:#e5e7eb;border-radius:10px;padding:10px 12px;font-size:13px}'
        + '.cpv2-btn{cursor:pointer;font-weight:700}'
        + '.cpv2-btn.is-active{background:#1e293b;border-color:#334155;color:#fff}'
        + '.cpv2-btn.refresh{background:linear-gradient(135deg,#2563eb,#1d4ed8);border-color:#2563eb}'
        + '.cpv2-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}'
        + '.cpv2-card{background:linear-gradient(135deg,#0f172a,#111827);border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:20px 24px;min-height:112px}'
        + '.cpv2-card-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:800}'
        + '.cpv2-card-value{font-size:28px;font-weight:900;color:#f8fafc;margin-top:10px}'
        + '.cpv2-card-sub{font-size:12px;color:#94a3b8;margin-top:8px}'
        + '.cpv2-compare-up{color:#ef4444}.cpv2-compare-down{color:#22c55e}'
        + '.cpv2-ranks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px}'
        + '.cpv2-panel{background:linear-gradient(135deg,#0f172a,#111827);border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:18px}'
        + '.cpv2-panel-title{font-size:16px;font-weight:800;color:#f8fafc;margin-bottom:14px}'
        + '.cpv2-rank-item{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;margin-bottom:12px}'
        + '.cpv2-rank-name{font-size:13px;color:#e5e7eb;font-weight:700}'
        + '.cpv2-rank-meta{font-size:11px;color:#94a3b8}'
        + '.cp-ranking-track{height:8px;border-radius:4px;background:#1e293b;overflow:hidden;margin-top:6px}'
        + '.cp-ranking-bar{height:8px;border-radius:4px;background:linear-gradient(90deg,#ef4444,#f97316);transition:width .6s ease}'
        + '.cp-rank-op-bar{background:linear-gradient(90deg,#f59e0b,#fbbf24)}'
        + '.cpv2-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;background:rgba(239,68,68,.16);color:#fecaca;border:1px solid rgba(239,68,68,.22)}'
        + '.cpv2-table-panel{background:linear-gradient(135deg,#0f172a,#111827);border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:18px}'
        + '.cpv2-table-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}'
        + '.cpv2-table{width:100%;border-collapse:collapse}'
        + '.cpv2-table thead th{background:#0f172a;text-transform:uppercase;font-size:11px;color:#64748b;letter-spacing:.08em;padding:10px 8px;border-bottom:1px solid #1e293b;text-align:left}'
        + '.cpv2-table tbody tr{border-bottom:1px solid #1e293b;cursor:pointer}'
        + '.cpv2-table tbody tr:hover{background:#1e293b}'
        + '.cpv2-table tbody tr.expandida{background:#1a2035}'
        + '.cpv2-table td{padding:10px 8px;font-size:12px;color:#e5e7eb;vertical-align:top}'
        + '.cpv2-mach-badge{display:inline-flex;align-items:center;background:#1e3a5f;color:#60a5fa;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:800;margin:2px 4px 2px 0}'
        + '.cpv2-op-chip{display:inline-flex;align-items:center;background:#2d1f0e;color:#f59e0b;border-radius:12px;padding:2px 10px;font-size:11px;font-weight:800;margin:2px 4px 2px 0}'
        + '.cpv2-empty{padding:48px 18px;text-align:center;color:#94a3b8}'
        + '.cpv2-empty-ico{font-size:54px;display:block;margin-bottom:14px}'
        + '.cpv2-detail{padding:12px 10px 16px 10px}'
        + '.cpv2-inner{width:100%;border-collapse:collapse}'
        + '.cpv2-inner th,.cpv2-inner td{padding:8px 6px;border-bottom:1px solid rgba(148,163,184,.12);font-size:12px}'
        + '@media (max-width:980px){.cpv2-summary,.cpv2-ranks{grid-template-columns:1fr 1fr}}'
        + '@media (max-width:720px){.cpv2-summary,.cpv2-ranks{grid-template-columns:1fr}.cpv2-table-actions{align-items:stretch}.cpv2-search,.cpv2-select{width:100%}}';
      document.head.appendChild(st);
    }

    function _cpState() {
      if (!window.__cpDashState) {
        window.__cpDashState = { periodo: 'mes', maquina: '', empresa_id: '', todas_empresas: 'true', busca: '', expand: {} };
      }
      return window.__cpDashState;
    }

    async function _cpFetchDashboard(force) {
      var state = _cpState();
      state.todas_empresas = state.empresa_id ? 'false' : 'true';
      var now = Date.now();
      var key = JSON.stringify({ periodo: state.periodo, maquina: state.maquina, empresa_id: state.empresa_id, todas_empresas: state.todas_empresas });
      if (!window._cpDashCache) window._cpDashCache = {};
      if (!force && window._cpDashCache[key] && (now - window._cpDashCache[key].ts) < 60000) return window._cpDashCache[key].data;
      var token = '';
      try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || '').trim(); } catch (_) {}
      var qs = new URLSearchParams();
      if (state.periodo && state.periodo !== 'mes') qs.set('periodo', state.periodo);
      if (state.maquina) qs.set('maquina', state.maquina);
      if (state.empresa_id) qs.set('empresa_id', state.empresa_id);
      if (state.todas_empresas) qs.set('todas_empresas', state.todas_empresas);
      var resp = await fetch('/api/caixas-perdidas/dashboard?' + qs.toString(), { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var json = await resp.json().catch(function() { return null; });
      if (!resp.ok || !json || json.ok === false) throw new Error(String(json && (json.error || json.message) || 'Falha ao carregar dashboard'));
      window._cpDashCache[key] = { ts: now, data: json };
      return json;
    }

    function _cpDownloadCsv(rows) {
      try {
        var list = Array.isArray(rows) ? rows : [];
        var lines = [['Data Conclusao','OF','Cliente','Produto','Qtd Perdida','Valor Perdido','Maquinas','Operadores','Concluido Por']];
        list.forEach(function(r) {
          lines.push([
            r.data_conclusao || '',
            r.of_numero || '',
            r.cliente_nome || '',
            r.produto || '',
            r.quantidade_perdida || 0,
            Number(r.valor_perdido || 0).toFixed(2).replace('.', ','),
            (r.maquinas || []).join(' | '),
            (r.operadores || []).join(' | '),
            r.concluido_por || ''
          ]);
        });
        var csv = lines.map(function(cols) {
          return cols.map(function(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(';');
        }).join('\r\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'caixas_perdidas.csv';
        a.click();
        setTimeout(function() { URL.revokeObjectURL(url); }, 800);
      } catch (_) {}
    }

    function _cpBuildTableRows(data) {
      var state = _cpState();
      var busca = _cpNorm(state.busca);
      var rows = Array.isArray(data && data.detalhamento) ? data.detalhamento.slice() : [];
      if (busca) {
        rows = rows.filter(function(r) {
          var txt = [r.of_numero, r.cliente_nome, r.produto, (r.maquinas || []).join(' '), (r.operadores || []).join(' ')].join(' ');
          return _cpNorm(txt).indexOf(busca) >= 0;
        });
      }
      return rows;
    }

    function _cpRender(data) {
      var host = _cpHost();
      if (!host) return;
      _cpEnsureStyleV2();
      try {
        if (data && data._debug) console.log('[CP FRONTEND] debug:', JSON.stringify(data._debug));
      } catch (_) {}
      try {
        host.dataset.secaoAtiva = 'caixas-perdidas';
        host.setAttribute('data-secao-ativa', 'caixas-perdidas');
      } catch (_) {}
      var state = _cpState();
      var resumo = (data && data.resumo_mes_atual) || {};
      var comp = (data && data.comparacao_mes_anterior) || {};
      var rankM = Array.isArray(data && data.ranking_maquinas) ? data.ranking_maquinas : [];
      var rankO = Array.isArray(data && data.ranking_operadores) ? data.ranking_operadores : [];
      var rows = _cpBuildTableRows(data);
      var maquinasOpts = Array.from(new Set((Array.isArray(data && data.detalhamento) ? data.detalhamento : []).reduce(function(acc, r) { return acc.concat(r && r.maquinas || []); }, []))).filter(Boolean);
      var empresasOpts = Array.from(new Set((Array.isArray(data && data.detalhamento) ? data.detalhamento : []).map(function(r) { return String(r && r.empresa_id || '').trim(); }).filter(Boolean)));
      var maxM = Math.max(1, ...rankM.map(function(r) { return Number(r && r.total_caixas || 0) || 0; }));
      var maxO = Math.max(1, ...rankO.map(function(r) { return Number(r && r.total_caixas || 0) || 0; }));
      var varCx = Number(comp.variacao_caixas_pct || 0) || 0;
      var varCls = varCx > 0 ? 'cpv2-compare-up' : 'cpv2-compare-down';
      var varArrow = varCx > 0 ? '↑' : '↓';
      if (!(Array.isArray(data && data.detalhamento) && data.detalhamento.length)) {
        var dbgTab = (data && data._debug && data._debug.tabelaAtiva) ? String(data._debug.tabelaAtiva) : 'não encontrada';
        var dbgTot = (data && data._debug && data._debug.totalRegistros != null) ? String(data._debug.totalRegistros) : '0';
        host.innerHTML = ''
          + '<div class="cpv2"><div class="cpv2-head"><div><div class="cpv2-title">💥 Caixas Perdidas</div><div class="cpv2-sub">Dashboard consolidado de perdas</div></div></div>'
          + '<div class="cpv2-panel cpv2-empty">'
          + '  <span class="cpv2-empty-ico">📦</span>'
          + '  <div style="font-size:18px;font-weight:800;color:#e5e7eb">Nenhuma perda no período selecionado</div>'
          + '  <div style="margin-top:6px">Ajuste os filtros ou verifique outros períodos.</div>'
          + '  <div style="margin-top:12px;color:#64748b;font-size:13px">Tabela: ' + _cpEsc(dbgTab) + ' · Registros históricos: ' + _cpEsc(dbgTot) + '</div>'
          + '  <div style="margin-top:18px">'
          + '    <button onclick="window._carregarCPTodosPeriodos && window._carregarCPTodosPeriodos()" style="background:#3b82f6;color:white;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-size:14px">📊 Ver todos os períodos</button>'
          + '  </div>'
          + '</div></div>';
        return;
      }
      host.innerHTML = ''
        + '<div class="cpv2">'
        + '  <div class="cpv2-head">'
        + '    <div><div class="cpv2-title">💥 Caixas Perdidas</div><div class="cpv2-sub">Dashboard consolidado de perdas</div></div>'
        + '    <div class="cpv2-actions">'
        + '      <div class="cpv2-periods">'
        + '        <button class="cpv2-btn' + (state.periodo === 'hoje' ? ' is-active' : '') + '" data-cp-periodo="hoje">Hoje</button>'
        + '        <button class="cpv2-btn' + (state.periodo === 'semana' ? ' is-active' : '') + '" data-cp-periodo="semana">Esta Semana</button>'
        + '        <button class="cpv2-btn' + (state.periodo === 'mes' ? ' is-active' : '') + '" data-cp-periodo="mes">Este Mês</button>'
        + '        <button class="cpv2-btn' + (state.periodo === 'todos' ? ' is-active' : '') + '" data-cp-periodo="todos">Todos os períodos</button>'
        + '      </div>'
        + '      <div class="cpv2-filters">'
        + '        <select class="cpv2-select" id="cpv2-maquina"><option value="">Todas as Máquinas</option>' + maquinasOpts.map(function(m) { return '<option value="' + _cpEsc(m) + '"' + (state.maquina === m ? ' selected' : '') + '>' + _cpEsc(m) + '</option>'; }).join('') + '</select>'
        + '        <select class="cpv2-select" id="cpv2-empresa"><option value="">Todas as Empresas</option>' + empresasOpts.map(function(eid) { return '<option value="' + _cpEsc(eid) + '"' + (state.empresa_id === eid ? ' selected' : '') + '>' + _cpEsc(eid) + '</option>'; }).join('') + '</select>'
        + '        <button class="cpv2-btn refresh" id="cpv2-refresh">Atualizar 🔄</button>'
        + '      </div>'
        + '    </div>'
        + '  </div>'
        + '  <div class="cpv2-summary">'
        + '    <div class="cpv2-card"><div class="cpv2-card-label">Caixas Perdidas</div><div class="cpv2-card-value">' + _cpFmtNum(resumo.total_caixas) + ' cx</div><div class="cpv2-card-sub">' + _cpEsc(resumo.mes_referencia || '') + '</div></div>'
        + '    <div class="cpv2-card"><div class="cpv2-card-label">Valor Perdido</div><div class="cpv2-card-value">' + _cpFmtMoney(resumo.valor_total) + '</div><div class="cpv2-card-sub">Perdas do período</div></div>'
        + '    <div class="cpv2-card"><div class="cpv2-card-label">VS Mês Anterior</div><div class="cpv2-card-value ' + varCls + '">' + varArrow + ' ' + String(Math.abs(varCx)).replace('.', ',') + '%</div><div class="cpv2-card-sub">Anterior: ' + _cpFmtNum(comp.total_caixas) + ' cx · ' + _cpFmtMoney(comp.valor_total) + '</div></div>'
        + '    <div class="cpv2-card"><div class="cpv2-card-label">Ocorrências</div><div class="cpv2-card-value">' + _cpFmtNum(resumo.total_ocorrencias) + '</div><div class="cpv2-card-sub">Registros consolidados</div></div>'
        + '  </div>'
        + '  <div class="cpv2-ranks">'
        + '    <div class="cpv2-panel"><div class="cpv2-panel-title">🏭 Ranking de Máquinas</div>' + rankM.map(function(r, idx) { var pct = Math.max(4, Math.round(((Number(r && r.total_caixas || 0) || 0) / maxM) * 100)); return '<div class="cpv2-rank-item"><div style="font-weight:900;color:#64748b">' + (idx + 1) + '.</div><div><div class="cpv2-rank-name">' + _cpEsc(r && r.maquina || '—') + '</div><div class="cp-ranking-track"><div class="cp-ranking-bar" style="width:' + pct + '%"></div></div><div class="cpv2-rank-meta">' + _cpFmtNum(r && r.total_caixas || 0) + ' cx · ' + _cpFmtMoney(r && r.valor_perdido || 0) + '</div></div><div class="cpv2-badge">' + _cpFmtNum(r && r.ocorrencias || 0) + '</div></div>'; }).join('') + '</div>'
        + '    <div class="cpv2-panel"><div class="cpv2-panel-title">👷 Operadores com Mais Perdas</div>' + rankO.map(function(r, idx) { var pct = Math.max(4, Math.round(((Number(r && r.total_caixas || 0) || 0) / maxO) * 100)); return '<div class="cpv2-rank-item"><div style="font-weight:900;color:#64748b">' + (idx + 1) + '.</div><div><div class="cpv2-rank-name">' + _cpEsc(r && r.operador || '—') + '</div><div class="cp-ranking-track"><div class="cp-ranking-bar cp-rank-op-bar" style="width:' + pct + '%"></div></div><div class="cpv2-rank-meta">' + _cpFmtNum(r && r.total_caixas || 0) + ' cx · ' + _cpFmtMoney(r && r.valor_perdido || 0) + '</div></div><div class="cpv2-badge" style="background:rgba(245,158,11,.18);color:#fcd34d;border-color:rgba(245,158,11,.22)">' + _cpFmtNum(r && r.ocorrencias || 0) + '</div></div>'; }).join('') + '</div>'
        + '  </div>'
        + '  <div class="cpv2-table-panel">'
        + '    <div class="cpv2-table-actions"><input class="cpv2-search" id="cpv2-busca" placeholder="Buscar OF ou cliente..." value="' + _cpEsc(state.busca || '') + '"><button class="cpv2-btn" id="cpv2-excel">Excel</button></div>'
        + '    <div style="overflow:auto"><table class="cpv2-table"><thead><tr><th>Data Conclusão</th><th>Nº OF</th><th>Cliente</th><th>Produto</th><th>Qtd Perdida</th><th>Valor Perdido</th><th>Máquinas</th><th>Operadores</th><th>Concluído Por</th></tr></thead><tbody>'
        + rows.map(function(r, idx) {
          var exp = !!state.expand[idx];
          var line = '<tr class="' + (exp ? 'expandida' : '') + '" data-cp-row="' + idx + '">'
            + '<td>' + _cpEsc(_cpDateBr(r.data_conclusao)) + '</td>'
            + '<td style="font-weight:800;color:#93c5fd">#' + _cpEsc(r.of_numero || '—') + '</td>'
            + '<td>' + _cpEsc(r.cliente_nome || '—') + '</td>'
            + '<td>' + _cpEsc(r.produto || '—') + '</td>'
            + '<td>' + _cpFmtNum(r.quantidade_perdida || 0) + '</td>'
            + '<td style="font-weight:800">' + _cpFmtMoney(r.valor_perdido || 0) + '</td>'
            + '<td>' + (r.maquinas || []).map(function(m) { return '<span class="cpv2-mach-badge">' + _cpEsc(m) + '</span>'; }).join('') + '</td>'
            + '<td>' + (r.operadores || []).map(function(op) { return '<span class="cpv2-op-chip">' + _cpEsc(op) + '</span>'; }).join('') + '</td>'
            + '<td>' + _cpEsc(r.concluido_por || '—') + '</td>'
            + '</tr>';
          if (!exp) return line;
          return line + '<tr class="expandida" data-cp-detail="' + idx + '"><td colspan="9"><div class="cpv2-detail"><table class="cpv2-inner"><thead><tr><th>Máquina</th><th>Qtd Perdida</th><th>Operadores Responsáveis</th></tr></thead><tbody>' + (r.detalhes || []).map(function(d) { return '<tr><td>' + _cpEsc(d.maquina || '—') + '</td><td>' + _cpFmtNum(d.qtd_perdida || 0) + '</td><td>' + (d.operadores || []).map(function(op) { return '<span class="cpv2-op-chip">' + _cpEsc(op) + '</span>'; }).join('') + '</td></tr>'; }).join('') + '</tbody></table></div></td></tr>';
        }).join('')
        + '    </tbody></table></div>'
        + '  </div>'
        + '</div>';

      Array.prototype.slice.call(host.querySelectorAll('[data-cp-periodo]')).forEach(function(btn) {
        btn.onclick = function() { _cpState().periodo = String(btn.getAttribute('data-cp-periodo') || 'mes'); _cpRenderPage(false); };
      });
      var selM = document.getElementById('cpv2-maquina');
      if (selM) selM.onchange = function() { _cpState().maquina = String(selM.value || ''); _cpRenderPage(false); };
      var selE = document.getElementById('cpv2-empresa');
      if (selE) selE.onchange = function() { _cpState().empresa_id = String(selE.value || ''); _cpState().todas_empresas = _cpState().empresa_id ? 'false' : 'true'; _cpRenderPage(false); };
      var inpB = document.getElementById('cpv2-busca');
      if (inpB) inpB.oninput = function() { _cpState().busca = String(inpB.value || ''); _cpRender(data); };
      var btnR = document.getElementById('cpv2-refresh');
      if (btnR) btnR.onclick = function() { _cpRenderPage(true); };
      var btnX = document.getElementById('cpv2-excel');
      if (btnX) btnX.onclick = function() { _cpDownloadCsv(rows); };
      Array.prototype.slice.call(host.querySelectorAll('tr[data-cp-row]')).forEach(function(tr) {
        tr.onclick = function() {
          var idx = String(tr.getAttribute('data-cp-row') || '');
          _cpState().expand[idx] = !_cpState().expand[idx];
          _cpRender(data);
        };
      });
    }

    async function _cpRenderPage(force) {
      var host = _cpHost();
      if (!host) return;
      if (window.__cpDashLoading) return;
      window.__cpDashLoading = true;
      try {
        host.dataset.secaoAtiva = 'caixas-perdidas';
        host.setAttribute('data-secao-ativa', 'caixas-perdidas');
      } catch (_) {}
      try {
        var data = await _cpFetchDashboard(!!force);
        _cpRender(data);
      } catch (e) {
        host.innerHTML = '<div class="cpv2"><div class="cpv2-panel cpv2-empty"><span class="cpv2-empty-ico">⚠️</span><div style="font-size:18px;font-weight:800;color:#e5e7eb">Erro ao carregar caixas perdidas</div><div style="margin-top:6px">' + _cpEsc(String(e && e.message || e || 'Falha inesperada')) + '</div></div></div>';
      } finally {
        window.__cpDashLoading = false;
      }
    }

    try {
      window.renderCaixasPerdidas = function() { _cpRenderPage(false); };
      window.renderCaixasPerdidas._patchDashboardV2 = true;
    } catch (_) {}
    try {
      window.carregarCaixasPerdidas = async function() { await _cpRenderPage(false); return []; };
      window.carregarCaixasPerdidas._patchDashboardV2 = true;
    } catch (_) {}
    try { window._renderCaixasPerdidasV2 = _cpRenderPage; } catch (_) {}
    try { window._carregarCPTodosPeriodos = function() { _cpState().periodo = 'todos'; _cpRenderPage(true); }; } catch (_) {}
  })();

  function tick() {
    try { hookRenderComissoes(); } catch (_) {}
    try { enhanceComissoesTable(); } catch (_) {}
    try { if (typeof window.__ensureComissoesBusca === 'function') window.__ensureComissoesBusca(); } catch (_) {}
  }

  function stopTickWhenReady() {
    try {
      var buscaOk = !!document.getElementById('comissoes-busca-of');
      var hookOk = !!window.__patchComHooked;
      if (buscaOk && hookOk && window.__patchComissoesTickInterval) {
        clearInterval(window.__patchComissoesTickInterval);
        window.__patchComissoesTickInterval = null;
      }
    } catch (_) {}
  }

  function startTick() {
    try { tick(); } catch (_) {}
    stopTickWhenReady();
    if (window.__patchComissoesTickInterval) return;
    window.__patchComissoesTickInterval = setInterval(function() {
      try { tick(); } catch (_) {}
      stopTickWhenReady();
    }, 900);
  }

  bindInlineEdit();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startTick, 250); });
  else { setTimeout(startTick, 250); }
})();

(function patchPainelClienteApi() {
  function escHLocal(s) {
    try { return window.escH ? window.escH(s) : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); } catch (_) { return String(s == null ? '' : s); }
  }
  function escAttrLocal(s) {
    var v = String(s == null ? '' : s);
    return escHLocal(v).replace(/`/g, '&#96;');
  }
  function fmtMoneyLocal(v) {
    var n = Number(v || 0) || 0;
    try { if (typeof window.fmtR === 'function') return window.fmtR(n); } catch (_) {}
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtDataLocal(s) {
    var d = String(s || '').slice(0, 10);
    try { if (typeof window.fmtD === 'function') return window.fmtD(d); } catch (_) {}
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      var parts = d.split('-');
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return d || '—';
  }
  function getAuthHeader() {
    var token = '';
    try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }
  async function apiGet(url) {
    if (typeof window.apiFetch === 'function') return await window.apiFetch(url, { method: 'GET' });
    return await fetch(url, { method: 'GET', headers: getAuthHeader() });
  }
  function setTxt(id, txt) {
    try { var el = document.getElementById(id); if (el) el.textContent = String(txt); } catch (_) {}
  }
  function renderPainel(json) {
    var totalPedidos = Number(json && json.total_pedidos || 0) || 0;
    var totalFaturado = Number(json && json.total_faturado || 0) || 0;
    var ofsAbertas = Number(json && json.ofs_abertas || 0) || 0;
    setTxt('pcTotalPedidos', totalPedidos);
    setTxt('pcTotalFaturado', fmtMoneyLocal(totalFaturado));
    setTxt('pcOfsAbertas', ofsAbertas);

    var listEl = document.getElementById('pcOfsAbertasList');
    var abertas = (json && Array.isArray(json.ofs_em_aberto)) ? json.ofs_em_aberto : [];
    if (listEl) {
      if (!abertas.length) {
        listEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Nenhuma OF em aberto.</div>';
      } else {
        listEl.innerHTML = abertas.map(function(o) {
          var num = String(o && o.numero || '—').trim() || '—';
          var prod = String(o && o.produto || '').trim();
          var qtd = (o && o.quantidade != null) ? (Number(o.quantidade) || 0) : 0;
          var ent = String(o && o.data_entrega || '').slice(0, 10);
          var stt = String(o && o.status || '—').trim() || '—';
          var maq = String(o && o.maquina || '').trim();
          return (
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px">' +
              '<div style="min-width:0">' +
                '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                  '<span style="font-weight:900;color:#4A90D9">OF #' + escHLocal(num) + '</span>' +
                  '<span style="color:#94a3b8;font-size:0.78rem">' + escHLocal(stt) + '</span>' +
                  (ent ? '<span style="color:#64748b;font-size:0.78rem">📅 ' + escHLocal(fmtDataLocal(ent)) + '</span>' : '') +
                  (qtd ? '<span style="color:#64748b;font-size:0.78rem">📦 ' + escHLocal(String(qtd)) + ' cx</span>' : '') +
                  (maq ? '<span style="color:#64748b;font-size:0.78rem">🧰 ' + escHLocal(maq) + '</span>' : '') +
                '</div>' +
                (prod ? '<div style="color:#e2e8f0;font-size:0.86rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHLocal(prod) + '</div>' : '') +
              '</div>' +
              '<button class="btn btn-ghost btn-sm" data-pc-of="' + escAttrLocal(num) + '" style="white-space:nowrap">Abrir</button>' +
            '</div>'
          );
        }).join('');
        try {
          Array.prototype.slice.call(listEl.querySelectorAll('button[data-pc-of]')).forEach(function(btn) {
            if (!btn || btn.dataset.bound === '1') return;
            btn.dataset.bound = '1';
            btn.onclick = function(ev) {
              try { if (ev) { ev.preventDefault(); ev.stopPropagation(); } } catch (_) {}
              var n = String(btn.getAttribute('data-pc-of') || '').trim();
              try { if (typeof window.editarOFDoHistorico === 'function') window.editarOFDoHistorico(n); } catch (_) {}
            };
          });
        } catch (_) {}
      }
    }

    var topEl = document.getElementById('pcTopProdutos');
    var prods = (json && Array.isArray(json.produtos_mais_pedidos)) ? json.produtos_mais_pedidos : [];
    if (topEl) {
      if (!prods.length) {
        topEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Sem dados suficientes.</div>';
      } else {
        topEl.innerHTML = prods.map(function(p, i) {
          var nome = String(p && p.produto || 'Sem produto').trim() || 'Sem produto';
          var vezes = Number(p && p.vezes || 0) || 0;
          return (
            '<div style="display:flex;justify-content:space-between;gap:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px">' +
              '<div style="min-width:0;color:#e2e8f0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (i + 1) + '. ' + escHLocal(nome) + '</div>' +
              '<div style="color:#94a3b8;font-family:var(--mono);font-weight:800">' + escHLocal(String(vezes)) + ' pedidos</div>' +
            '</div>'
          );
        }).join('');
      }
    }

    var histEl = document.getElementById('pcHistorico');
    var hist = (json && Array.isArray(json.historico)) ? json.historico : [];
    if (histEl) {
      if (!hist.length) {
        histEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Nenhum pedido encontrado.</div>';
      } else {
        var th = 'padding:8px 10px;border:1px solid var(--border);background:var(--s2);font-size:.65rem;font-weight:900;font-family:var(--mono);text-transform:uppercase;white-space:nowrap;';
        var td = 'padding:8px 10px;border:1px solid var(--s3);font-size:.78rem;';
        histEl.innerHTML = '<div style="overflow:auto;border:1px solid var(--border);border-radius:10px">' +
          '<table style="width:100%;border-collapse:collapse;min-width:920px">' +
            '<thead><tr>' +
              '<th style=\"' + th + '\">Data</th>' +
              '<th style=\"' + th + '\">Nº OF</th>' +
              '<th style=\"' + th + '\">Produto</th>' +
              '<th style=\"' + th + ';text-align:right\">Qtd</th>' +
              '<th style=\"' + th + '\">Status</th>' +
              '<th style=\"' + th + ';text-align:right\">Valor</th>' +
              '<th style=\"' + th + ';text-align:center\">Ação</th>' +
            '</tr></thead>' +
            '<tbody>' +
              hist.map(function(r) {
                var num = String(r && r.numero || '—').trim() || '—';
                var prod = String(r && r.produto || '—').trim() || '—';
                var dt = String(r && (r.data_entrega || r.created_at) || '').slice(0, 10);
                var qtd = (r && r.quantidade != null) ? (Number(r.quantidade) || 0) : 0;
                var stt = String(r && r.status || '—').trim() || '—';
                var valor = Number(r && r.total || 0) || 0;
                return (
                  '<tr>' +
                    '<td style=\"' + td + ';font-family:var(--mono)\">' + escHLocal(dt ? fmtDataLocal(dt) : '—') + '</td>' +
                    '<td style=\"' + td + ';font-family:var(--mono);font-weight:900;color:var(--accent)\">' + escHLocal(num) + '</td>' +
                    '<td style=\"' + td + ';max-width:360px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">' + escHLocal(prod) + '</td>' +
                    '<td style=\"' + td + ';text-align:right;font-family:var(--mono)\">' + escHLocal(String(qtd || 0)) + '</td>' +
                    '<td style=\"' + td + ';color:var(--text2)\">' + escHLocal(stt) + '</td>' +
                    '<td style=\"' + td + ';text-align:right;font-family:var(--mono);font-weight:900;color:var(--green)\">' + escHLocal(fmtMoneyLocal(valor)) + '</td>' +
                    '<td style=\"' + td + ';text-align:center\"><button class=\"btn btn-ghost btn-sm\" data-pc-of=\"' + escAttrLocal(num) + '\">Abrir</button></td>' +
                  '</tr>'
                );
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>';
        try {
          Array.prototype.slice.call(histEl.querySelectorAll('button[data-pc-of]')).forEach(function(btn2) {
            if (!btn2 || btn2.dataset.bound === '1') return;
            btn2.dataset.bound = '1';
            btn2.onclick = function(ev2) {
              try { if (ev2) { ev2.preventDefault(); ev2.stopPropagation(); } } catch (_) {}
              var n2 = String(btn2.getAttribute('data-pc-of') || '').trim();
              try { if (typeof window.editarOFDoHistorico === 'function') window.editarOFDoHistorico(n2); } catch (_) {}
            };
          });
        } catch (_) {}
      }
    }
  }
  function showLoading() {
    try {
      setTxt('pcTotalPedidos', '—');
      setTxt('pcTotalFaturado', '—');
      setTxt('pcOfsAbertas', '—');
      var listEl = document.getElementById('pcOfsAbertasList');
      if (listEl) listEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Carregando…</div>';
      var topEl = document.getElementById('pcTopProdutos');
      if (topEl) topEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Carregando…</div>';
      var histEl = document.getElementById('pcHistorico');
      if (histEl) histEl.innerHTML = '<div style="color:#64748b;font-size:0.85rem">Carregando…</div>';
    } catch (_) {}
  }
  function hook() {
    if (typeof window.carregarPainelCliente !== 'function') return;
    if (window.carregarPainelCliente._patchPainelClienteApi) return;
    var orig = window.carregarPainelCliente;
    window.carregarPainelCliente = async function() {
      var st = null;
      try { st = window._PCLI || null; } catch (_) { st = null; }
      var cid = '';
      try { cid = String(st && st.cliId || '').trim(); } catch (_) { cid = ''; }
      if (!cid) return await orig.apply(this, arguments);
      try {
        if (st) st.loading = true;
        showLoading();
        var resp = await apiGet('/api/clientes/' + encodeURIComponent(cid) + '/painel?t=' + Date.now());
        var json = await resp.json().catch(function() { return null; });
        if (!resp.ok || !json || json.ok === false) throw new Error(String(json && json.error || 'Erro'));
        if (st) st.loading = false;
        renderPainel(json);
        return;
      } catch (e) {
        try { if (st) st.loading = false; } catch (_) {}
        return await orig.apply(this, arguments);
      }
    };
    window.carregarPainelCliente._patchPainelClienteApi = true;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(hook, 250); setInterval(hook, 1500); });
  } else {
    setTimeout(hook, 250);
    setInterval(hook, 1500);
  }
})();

(function patchClientesInativosApi() {
  function digitsOnly(v) { return String(v || '').replace(/\D+/g, ''); }
  function ensureInativosModalStyles() {
    try {
      if (document.getElementById('patch-style-clientes-inativos')) return;
      var styleInativos = document.createElement('style');
      styleInativos.id = 'patch-style-clientes-inativos';
      styleInativos.textContent =
        '#modalClientesInativos, #modal-clientes-inativos, .modal-clientes-inativos{' +
        'background:rgba(0,0,0,0.75) !important;' +
        '}' +
        '#modalClientesInativos .modal-box, #modalClientesInativos > div, ' +
        '#modal-clientes-inativos .modal-container, #modal-clientes-inativos > div > div, ' +
        '.modal-clientes-inativos .modal-inner{' +
        'background:#1e2433 !important;border:1px solid #2d3748 !important;' +
        '}';
      document.head.appendChild(styleInativos);
    } catch (_) {}
  }
  function applyInativosModalStyles() {
    try {
      ensureInativosModalStyles();
      var modal = document.getElementById('modalClientesInativos');
      if (modal) {
        try { modal.style.setProperty('background', 'rgba(0,0,0,0.75)', 'important'); } catch (_) {}
        var box = modal.querySelector('.modal-box') || modal.firstElementChild;
        if (box) {
          try { box.style.setProperty('background', '#1e2433', 'important'); } catch (_) {}
          try { box.style.setProperty('border', '1px solid #2d3748', 'important'); } catch (_) {}
        }
      }
    } catch (_) {}
  }
  function getAuthHeader() {
    var token = '';
    try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }
  async function apiGet(url) {
    if (typeof window.apiFetch === 'function') return await window.apiFetch(url, { method: 'GET' });
    return await fetch(url, { method: 'GET', headers: getAuthHeader() });
  }
  function waUrl(tel) {
    var d = digitsOnly(tel);
    if (!d) return '';
    if (d.startsWith('55')) return 'https://wa.me/' + d;
    return 'https://wa.me/55' + d;
  }
  function hook() {
    ensureInativosModalStyles();
    if (typeof window.carregarClientesInativos !== 'function') return;
    if (window.carregarClientesInativos._patchNovaApi) return;
    var orig = window.carregarClientesInativos;
    window.carregarClientesInativos = async function() {
      var dias = String(document.getElementById('filtroInativosDias') && document.getElementById('filtroInativosDias').value || '30');
      var tbody = document.getElementById('tabelaClientesInativos');
      var total = document.getElementById('clientesInativosTotal');
      applyInativosModalStyles();
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:20px;text-align:center;color:#64748b">Carregando...</td></tr>';
      try {
        var resp = await apiGet('/api/clientes/inativos?dias=' + encodeURIComponent(dias) + '&t=' + Date.now());
        var json = await resp.json().catch(function() { return null; });
        var list = (json && json.ok && Array.isArray(json.data)) ? json.data : [];
        try { window._clientesInativosLista = list; } catch (_) {}
        if (total) total.textContent = String(list.length) + ' clientes sem pedido há ' + dias + '+ dias';
        if (typeof window.renderClientesInativosTbody === 'function') window.renderClientesInativosTbody(list);
        applyInativosModalStyles();
        try {
          var busca = document.getElementById('buscaClienteInativo');
          if (busca && busca.value && typeof window.filtrarClientesInativos === 'function') window.filtrarClientesInativos(busca.value);
        } catch (_) {}
        return;
      } catch (e) {
        try { return await orig.apply(this, arguments); } catch (_) {}
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:20px;text-align:center;color:#ef4444">Erro ao carregar dados.</td></tr>';
      }
    };
    window.carregarClientesInativos._patchNovaApi = true;
    if (typeof window.abrirClientesInativos === 'function' && !window.abrirClientesInativos._patchBgSolid) {
      var origAbrir = window.abrirClientesInativos;
      window.abrirClientesInativos = async function() {
        var r = await origAbrir.apply(this, arguments);
        applyInativosModalStyles();
        return r;
      };
      window.abrirClientesInativos._patchBgSolid = true;
    }
    if (typeof window.renderClientesInativosTbody === 'function' && !window.renderClientesInativosTbody._patchWaBtn) {
      var origRender = window.renderClientesInativosTbody;
      window.renderClientesInativosTbody = function(lista) {
        try { origRender.apply(this, arguments); } catch (_) {}
        applyInativosModalStyles();
        try {
          var tbody2 = document.getElementById('tabelaClientesInativos');
          if (!tbody2) return;
          var trs = tbody2.querySelectorAll('tr');
          trs.forEach(function(tr) {
            if (!tr || tr.dataset.patchWa === '1') return;
            var tds = tr.children || [];
            if (!tds || tds.length < 4) return;
            var tdTel = tds[3];
            if (!tdTel) return;
            var tel = String(tdTel.textContent || '').trim();
            var url = waUrl(tel);
            if (!url) { tr.dataset.patchWa = '1'; return; }
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = '📞 WhatsApp';
            btn.style.cssText = 'margin-left:10px;padding:4px 8px;border-radius:8px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);color:#4ade80;cursor:pointer;font-size:0.72rem;font-weight:700;';
            btn.onclick = function(ev) {
              try { if (ev) { ev.preventDefault(); ev.stopPropagation(); } } catch (_) {}
              try { window.open(url, '_blank'); } catch (_) {}
            };
            tdTel.appendChild(btn);
            tr.dataset.patchWa = '1';
          });
        } catch (_) {}
      };
      window.renderClientesInativosTbody._patchWaBtn = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(hook, 300); setInterval(hook, 2000); });
  else { setTimeout(hook, 300); setInterval(hook, 2000); }
})();

(function patchAutocompleteCalcCliente() {
  function escHLocal(s) {
    try { return window.escH ? window.escH(s) : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); } catch (_) { return String(s == null ? '' : s); }
  }
  function clientesRef() {
    try { if (Array.isArray(window.CLIENTES)) return window.CLIENTES; } catch (_) {}
    try { if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) return CLIENTES; } catch (_) {}
    return [];
  }
  window.selecionarClienteOrcamento = function(id, nome) {
    var cid = String(id || '').trim();
    var nm = String(nome || '').replace(/&#39;/g, "'").trim();
    var sel = document.getElementById('calc-cli');
    var input = document.getElementById('calc-cliente-input');
    var hidden = document.getElementById('calc-cli-id');
    var dd = document.getElementById('calc-cliente-dropdown');
    try { if (hidden) hidden.value = cid; } catch (_) {}
    try { if (input) input.value = nm; } catch (_) {}
    try { if (dd) dd.style.display = 'none'; } catch (_) {}
    if (sel) {
      try {
        if (cid && sel.querySelector && !sel.querySelector('option[value="' + cid.replace(/"/g, '\\"') + '"]')) {
          var opt = document.createElement('option');
          opt.value = cid;
          opt.textContent = nm || cid;
          sel.appendChild(opt);
        }
      } catch (_) {}
      try { sel.value = cid; } catch (_) {}
      try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
    }
  };

  window.buscarClienteOrcamento = function(termo) {
    var dd = document.getElementById('calc-cliente-dropdown');
    if (!dd) return;

    var t = String(termo || '').toLowerCase().trim();
    var todos = clientesRef().slice();
    todos.sort(function(a, b) {
      var an = String(a && (a.nome || a.rs || a.razao_social || a.razao || '') || '').trim().toLowerCase();
      var bn = String(b && (b.nome || b.rs || b.razao_social || b.razao || '') || '').trim().toLowerCase();
      return an.localeCompare(bn, 'pt-BR');
    });
    var lista = t.length === 0
      ? todos.slice(0, 10)
      : todos.filter(function(c) {
        var nome = String(c && (c.nome || c.rs || c.razao_social || c.razao || '') || '').toLowerCase();
        return nome.indexOf(t) !== -1;
      }).slice(0, 15);

    if (!todos.length) {
      dd.innerHTML = '<div style="padding:12px 14px;color:#94a3b8;font-size:13px">Carregando clientes...</div>';
      dd.style.display = 'block';
      return;
    }
    if (!lista.length) {
      dd.innerHTML = '<div style="padding:12px 14px;color:#94a3b8;font-size:13px">Nenhum cliente encontrado</div>';
      dd.style.display = 'block';
      return;
    }

    dd.innerHTML = '';
    lista.forEach(function(c) {
      var id = String(c && c.id || '').trim();
      var nomeRaw = String((c && (c.nome || c.rs || c.razao_social || c.razao)) || 'Sem nome');
      var nome = nomeRaw.trim() || 'Sem nome';
      var cidade = String(c && (c.cidade || '') || '').trim();
      var cnpj = String(c && (c.cnpj || c.documento || '') || '').trim();
      var row = document.createElement('div');
      row.style.cssText = 'padding:10px 14px;cursor:pointer;border-bottom:1px solid #2d3748;transition:background 0.1s;background:#1e2433';
      row.onmouseover = function() { try { row.style.background = '#2a3347'; } catch (_) {} };
      row.onmouseout = function() { try { row.style.background = '#1e2433'; } catch (_) {} };
      row.innerHTML =
        '<div style="font-weight:500;color:#f1f5f9;font-size:13px">' + escHLocal(nome) + '</div>' +
        '<div style="font-size:11px;color:#64748b">' + escHLocal(cidade) + (cnpj ? (' · ' + escHLocal(cnpj)) : '') + '</div>';
      row.onclick = function(ev) {
        try { if (ev) { ev.preventDefault(); ev.stopPropagation(); } } catch (_) {}
        try { window.selecionarClienteOrcamento(id, nome); } catch (_) {}
      };
      dd.appendChild(row);
    });

    if (!t && todos.length > 10) {
      dd.innerHTML += '<div style="padding:8px 14px;color:#64748b;font-size:11px;text-align:center;border-top:1px solid #2d3748">Digite para filtrar entre ' + escHLocal(String(todos.length)) + ' clientes</div>';
    }

    dd.style.display = 'block';
  };

  function ensure() {
    var sel = document.getElementById('calc-cli');
    if (!sel) return;
    if (sel.dataset.patchAutocomplete === '1') return;
    sel.dataset.patchAutocomplete = '1';

    var wrap = document.createElement('div');
    wrap.id = 'wrap-calc-cliente';
    wrap.style.position = 'relative';
    wrap.style.flex = '1';
    wrap.style.zIndex = '9999';

    var input = document.createElement('input');
    input.id = 'calc-cliente-input';
    input.type = 'text';
    input.placeholder = 'Digite o nome do cliente...';
    input.autocomplete = 'off';
    input.style.cssText = 'width:100%;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text1);font-size:14px';

    var dd = document.createElement('div');
    dd.id = 'calc-cliente-dropdown';
    dd.style.cssText = 'display:block;position:absolute;top:100%;left:0;right:0;z-index:99999;background:#1e2433 !important;border:1px solid #2d3748;border-top:none;border-radius:0 0 8px 8px;max-height:240px;overflow-y:auto;box-shadow:0 12px 32px rgba(0,0,0,0.7)';
    dd.style.display = 'none';

    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = 'calc-cli-id';
    hidden.value = '';

    wrap.appendChild(input);
    wrap.appendChild(dd);
    wrap.appendChild(hidden);

    try { sel.parentNode.insertBefore(wrap, sel); } catch (_) {}
    try { sel.style.display = 'none'; } catch (_) {}

    try {
      var optSel = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
      var currentId = String(sel.value || '').trim();
      var currentTxt = optSel ? String(optSel.textContent || '').trim() : '';
      if (currentId) hidden.value = currentId;
      if (currentTxt && currentTxt !== '-- Selecione o cliente --' && currentTxt !== '— Selecione o cliente —') input.value = currentTxt;
    } catch (_) {}

    function close() { try { dd.style.display = 'none'; } catch (_) {} }
    input.oninput = null;
    input.onfocus = null;
    input.addEventListener('focus', function() { try { window.buscarClienteOrcamento(String(input.value || '')); } catch (_) {} }, true);
    input.addEventListener('input', function() { try { window.buscarClienteOrcamento(String(input.value || '')); } catch (_) {} }, true);
    document.addEventListener('click', function(ev) {
      try { if (!ev.target.closest('#wrap-calc-cliente')) close(); } catch (_) {}
    }, true);
  }
  function startEnsureCalcCliente() {
    try { ensure(); } catch (_) {}
    if (window.__patchCalcClienteInterval) return;
    window.__patchCalcClienteInterval = setInterval(function() {
      try { ensure(); } catch (_) {}
      try {
        var sel = document.getElementById('calc-cli');
        if (sel && sel.dataset.patchAutocomplete === '1' && window.__patchCalcClienteInterval) {
          clearInterval(window.__patchCalcClienteInterval);
          window.__patchCalcClienteInterval = null;
        }
      } catch (_) {}
    }, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startEnsureCalcCliente, 500); });
  else { setTimeout(startEnsureCalcCliente, 500); }
})();

(function patchBotaoCalculadoraAbrir() {
  function openModalDirect() {
    try {
      var ov = document.getElementById('modal-calc') || document.getElementById('overlay-calculadora') || document.getElementById('modal-bg-calculadora');
      if (ov) {
        ov.style.display = 'flex';
        ov.style.pointerEvents = 'auto';
        try { ov.classList.add('open', 'show', 'active'); } catch (_) {}
        try { ov.style.zIndex = '99999'; } catch (_) {}
      }
    } catch (_) {}
    try {
      var modal = document.getElementById('modal-calculadora') || document.getElementById('modal-orcamento-calc') || document.querySelector('.modal-calculadora');
      if (modal) {
        modal.style.display = 'flex';
        modal.style.pointerEvents = 'auto';
        try { modal.style.zIndex = '100000'; } catch (_) {}
      }
    } catch (_) {}
    try { document.body && (document.body.style.overflow = 'hidden'); } catch (_) {}
  }

  function abrirCalcFallback() {
    try {
      if (typeof window.abrirCalculadoraCaixas === 'function') { window.abrirCalculadoraCaixas(); return; }
    } catch (_) {}
    try {
      if (typeof window.abrirCalculadora === 'function') { window.abrirCalculadora(); return; }
    } catch (_) {}
    try {
      var modal = document.getElementById('modal-calc') || document.getElementById('modal-calculadora') || document.getElementById('modal-calc-orcamento') || document.getElementById('modal-orcamento-calc');
      if (modal) {
        modal.style.display = 'flex';
        try { modal.classList.add('open', 'show', 'active'); } catch (_) {}
        return;
      }
    } catch (_) {}
  }

  function ensureFn() {
    if (typeof window.abrirCalculadora !== 'function') {
      window.abrirCalculadora = function() {
        try { if (typeof window.abrir === 'function') window.abrir('modal-calc'); } catch (_) {}
        openModalDirect();
      };
      window.abrirCalculadora._patchCalcOpen = true;
      return;
    }
    if (window.abrirCalculadora._patchCalcOpen) return;
    var orig = window.abrirCalculadora;
    window.abrirCalculadora = function() {
      try {
        return orig.apply(this, arguments);
      } catch (_) {
        try { if (typeof window.abrir === 'function') window.abrir('modal-calc'); } catch (_) {}
        try { openModalDirect(); } catch (_) {}
        return;
      } finally {
        try {
          var ov = document.getElementById('modal-calc');
          if (ov && String(getComputedStyle(ov).display || '') === 'none') openModalDirect();
        } catch (_) {}
      }
    };
    window.abrirCalculadora._patchCalcOpen = true;
  }

  function bindBtn() {
    var btn =
      document.querySelector('#btn-calculadora, .btn-calculadora') ||
      document.querySelector('button[onclick*="abrirCalculadora"]') ||
      Array.prototype.slice.call(document.querySelectorAll('button')).find(function(b) {
        var t = String(b && b.textContent || '').toLowerCase();
        return t.indexOf('calculadora de caixas') >= 0;
      }) ||
      null;
    if (!btn || btn.dataset.patchCalcBtn === '1') return;
    btn.dataset.patchCalcBtn = '1';
    btn.onclick = function(e) {
      try { if (e) { e.preventDefault(); e.stopPropagation(); } } catch (_) {}
      ensureFn();
      abrirCalcFallback();
    };
  }

  function tick() {
    ensureFn();
    bindBtn();
  }

  function startTickCalc() {
    try { tick(); } catch (_) {}
    if (window.__patchCalcOpenInterval) return;
    window.__patchCalcOpenInterval = setInterval(function() {
      try { tick(); } catch (_) {}
      try {
        var btn =
          document.querySelector('#btn-calculadora, .btn-calculadora') ||
          document.querySelector('button[onclick*="abrirCalculadora"]');
        var btnOk = !!(btn && btn.dataset.patchCalcBtn === '1');
        var fnOk = !!(window.abrirCalculadora && window.abrirCalculadora._patchCalcOpen);
        if (btnOk && fnOk && window.__patchCalcOpenInterval) {
          clearInterval(window.__patchCalcOpenInterval);
          window.__patchCalcOpenInterval = null;
        }
      } catch (_) {}
    }, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startTickCalc, 600); });
  else { setTimeout(startTickCalc, 600); }
})();

(function patchBuscaComissoesPorOf() {
  window.__ensureComissoesBusca = function() {
    try {
      var bar = document.querySelector('#page-comissoes .filtros-comissao');
      if (!bar) return;
      if (document.getElementById('comissoes-busca-of')) return;
      var input = document.createElement('input');
      input.id = 'comissoes-busca-of';
      input.type = 'text';
      input.placeholder = '🔍 Buscar por nº OF, cliente...';
      input.style.cssText = 'padding:7px 12px;border-radius:6px;background:var(--bg2);border:1px solid var(--border);color:var(--text1);width:220px';
      input.oninput = function() { try { if (typeof window.filtrarComissoesPorBusca === 'function') window.filtrarComissoesPorBusca(input.value); } catch (_) {} };
      bar.appendChild(input);
    } catch (_) {}
  };
  window.filtrarComissoesPorBusca = function(termo) {
    var t = String(termo || '').toLowerCase().trim();
    try { window.__comissoesBuscaTerm = termo; } catch (_) {}
    var linhas = document.querySelectorAll('#tabela-comissoes-ofs tbody tr');
    linhas.forEach(function(tr) {
      var txt = String(tr && tr.textContent || '').toLowerCase();
      tr.style.display = (!t || txt.indexOf(t) !== -1) ? '' : 'none';
    });
  };
  function startEnsureBuscaComissoes() {
    try { window.__ensureComissoesBusca(); } catch (_) {}
    [400, 1200, 2400].forEach(function(t) {
      setTimeout(function() {
        try {
          if (!document.getElementById('comissoes-busca-of')) window.__ensureComissoesBusca();
        } catch (_) {}
      }, t);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startEnsureBuscaComissoes, 600); });
  else { setTimeout(startEnsureBuscaComissoes, 600); }
})();

(function patchCalcularComissoesSqlBackend() {
  if (window.__patchCalcularComissoesSqlBackendInstalled) return;
  window.__patchCalcularComissoesSqlBackendInstalled = true;

  var _comissoesMesSelectors = [
    '#com-mes', '#comissao-mes', '#mes-com',
    'select[name="mes"]', '.com-mes-sel',
    '#filtro-mes', '#mes-filtro'
  ];
  var _comissoesAnoSelectors = [
    '#com-ano', '#comissao-ano', '#ano-com',
    'select[name="ano"]', '.com-ano-sel',
    '#filtro-ano', '#ano-filtro'
  ];

  function _preencherMesAtual() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('input[type="month"]')).forEach(function(inp) {
        if (!inp || String(inp.value || '').trim()) return;
        var hoje = new Date();
        inp.value = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
      });
    } catch (_) {}
  }

  function _iniciarTelaCom() {
    try { _preencherMesAtual(); } catch (_) {}
  }

  function _patchGoTelaCom() {
    try {
      var orig = window.go;
      if (typeof orig !== 'function' || orig._patchComMesInit) return;
      var wrapped = function(tela) {
        var r = orig.apply(this, arguments);
        try {
          if (String(tela || '').toLowerCase().indexOf('comiss') >= 0) {
            setTimeout(_preencherMesAtual, 400);
          }
        } catch (_) {}
        return r;
      };
      wrapped._patchComMesInit = true;
      window.go = wrapped;
    } catch (_) {}
  }

  function _acharCampoComissao(selectors) {
    var fallback = null;
    for (var i = 0; i < selectors.length; i += 1) {
      try {
        var el = document.querySelector(selectors[i]);
        if (!el) continue;
        if (!fallback) fallback = el;
        if (String(el.value || '').trim()) return el;
      } catch (_) {}
    }
    return fallback;
  }

  function parseMesAno() {
    var mesEl = _acharCampoComissao(_comissoesMesSelectors);
    var anoEl = _acharCampoComissao(_comissoesAnoSelectors);
    var mesNum = '';
    var anoNum = '';

    try { console.log('[COM] mesEl:', mesEl && mesEl.id, mesEl && mesEl.value); } catch (_) {}
    try { console.log('[COM] anoEl:', anoEl && anoEl.id, anoEl && anoEl.value); } catch (_) {}

    if (mesEl && String(mesEl.value || '').trim()) {
      var v = String(mesEl.value || '').trim();
      if (v.indexOf('-') >= 0) {
        var parts = v.split('-');
        if (parts.length >= 2) {
          anoNum = String(parts[0] || '').trim();
          mesNum = String(parts[1] || '').trim();
        }
      } else if (!isNaN(parseInt(v, 10))) {
        mesNum = String(parseInt(v, 10)).padStart(2, '0');
        anoNum = String((anoEl && anoEl.value) || new Date().getFullYear()).trim();
      }
    }

    if (!mesNum || !anoNum) {
      try {
        var textoMes = String((document.querySelector('.com-mes-label, [data-mes]') || {}).textContent || '');
        var meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        var low = textoMes.toLowerCase();
        meses.forEach(function(nome, idx) {
          if (!mesNum && low.indexOf(nome) >= 0) mesNum = String(idx + 1).padStart(2, '0');
        });
        if (!anoNum) {
          var anoMatch = textoMes.match(/\d{4}/);
          if (anoMatch) anoNum = anoMatch[0];
        }
      } catch (_) {}
    }

    if (!mesNum || !anoNum) {
      var hoje = new Date();
      mesNum = String(hoje.getMonth() + 1).padStart(2, '0');
      anoNum = String(hoje.getFullYear());
      try { console.log('[COM] fallback para mes atual:', anoNum + '-' + mesNum); } catch (_) {}
    }

    return {
      mesEl: mesEl || null,
      anoEl: anoEl || null,
      mesNum: String(parseInt(mesNum, 10) || (new Date().getMonth() + 1)).padStart(2, '0'),
      anoNum: String(parseInt(anoNum, 10) || new Date().getFullYear())
    };
  }

  function fmt(v) {
    return 'R$ ' + (Number(v || 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtData(d) {
    try { return d ? new Date(d).toLocaleDateString('pt-BR') : '—'; } catch (_) { return '—'; }
  }

  function setTextMany(selectors, value) {
    selectors.forEach(function(sel) {
      try {
        var el = document.querySelector(sel);
        if (el) el.textContent = value;
      } catch (_) {}
    });
  }

  function _forcarRenderComissoes(json) {
    if (!json) return;

    try {
      var cardsHost = document.querySelector('#page-comissoes #com-cards, #com-cards');
      if (cardsHost && !cardsHost.querySelector('.com-total-vendido, .com-total-comissao, .com-total-ofs, .card-val')) {
        cardsHost.innerHTML = ''
          + '<div class="sbox"><div class="sbox-h">Total Vendido</div><div class="sbox-b"><div class="card-val com-total-vendido cv-g">R$ 0,00</div></div></div>'
          + '<div class="sbox"><div class="sbox-h">Total Comissão</div><div class="sbox-b"><div class="card-val com-total-comissao cv-a">R$ 0,00</div></div></div>'
          + '<div class="sbox"><div class="sbox-h">Total OFs</div><div class="sbox-b"><div class="card-val com-total-ofs">0</div></div></div>';
      }
    } catch (_) {}

    try {
      setTextMany([
        '#page-comissoes .com-total-vendido',
        '#page-comissoes [data-com="total_vendido"]',
        '#page-comissoes [data-field="total_vendido"]',
        '#page-comissoes .cv-g',
        '.com-total-vendido'
      ], fmt(json.total_vendido));
      setTextMany([
        '#page-comissoes .com-total-comissao',
        '#page-comissoes [data-com="total_comissao"]',
        '#page-comissoes [data-field="total_comissao"]',
        '#page-comissoes .cv-a',
        '.com-total-comissao'
      ], fmt(json.total_comissao));
      setTextMany([
        '#page-comissoes .com-total-ofs',
        '#page-comissoes [data-com="total_ofs"]',
        '#page-comissoes [data-field="total_ofs"]',
        '.com-total-ofs'
      ], String(json.total_ofs || 0));
    } catch (_) {}
  }

  function _renderTabelaVendedores(json) {
    if (!(json && json.vendedores && json.vendedores.length)) return;
    var pg = document.querySelector('#page-comissoes, [data-page="comissoes"]');
    if (!pg) {
      try { console.warn('[COM] #page-comissoes nao encontrado'); } catch (_) {}
      return;
    }

    var tbodies = pg.querySelectorAll('tbody');
    try {
      console.log('[COM] tbodies:', tbodies.length);
    } catch (_) {}
    var tbodyVend = tbodies[0];
    if (!tbodyVend) {
      try { console.warn('[COM] tbody vendedores nao encontrado'); } catch (_) {}
      return;
    }

    var tableVend = tbodyVend.closest ? tbodyVend.closest('table') : null;
    try {
      console.log('[COM TBODY]', tbodyVend && tbodyVend.id, tableVend && tableVend.id);
    } catch (_) {}

    try {
      var theadVend = tableVend && tableVend.querySelector('thead');
      if (theadVend) {
        theadVend.innerHTML = ''
          + '<tr>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Vendedor</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">OFs</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Total Vendido</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">% Comissão</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Comissão R$</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:center">Ação</th>'
          + '</tr>';
      }
    } catch (_) {}

    tbodyVend.innerHTML = (json.vendedores || []).map(function(v) {
      return ''
        + '<tr>'
        + '<td style="padding:10px 14px">' + String(v && v.nome || '—') + '</td>'
        + '<td style="text-align:center;padding:10px 14px">' + String(Number(v && v.ofs || 0) || 0) + '</td>'
        + '<td style="text-align:right;padding:10px 14px">' + fmt(v && v.total) + '</td>'
        + '<td style="text-align:center;padding:10px 14px">' + (Number(v && v.comissao_pct || 1) || 1).toFixed(2) + '%</td>'
        + '<td style="text-align:right;padding:10px 14px;color:#4ade80;font-weight:600">' + fmt(v && v.comissao_rs) + '</td>'
        + '<td style="padding:10px 14px;text-align:center">'
        + '<button onclick="window._editarComissaoPct && window._editarComissaoPct(' + JSON.stringify(String(v && v.id || '')) + ',' + JSON.stringify(String(v && v.nome || '')) + ',' + String(Number(v && v.comissao_pct || 0) || 0) + ')" style="padding:4px 8px;border-radius:4px;border:1px solid var(--border,#333);background:transparent;color:var(--text1,#fff);cursor:pointer;font-size:11px">✏️</button>'
        + '</td>'
        + '</tr>';
    }).join('') + ''
      + '<tr style="font-weight:700;border-top:2px solid var(--border,#333)">'
      + '<td style="padding:10px 14px">TOTAL</td>'
      + '<td style="text-align:center;padding:10px 14px">' + String(json.total_ofs || 0) + '</td>'
      + '<td style="text-align:right;padding:10px 14px">' + fmt(json.total_vendido) + '</td>'
      + '<td></td>'
      + '<td style="text-align:right;padding:10px 14px;color:#4ade80">' + fmt(json.total_comissao) + '</td>'
      + '<td></td>'
      + '</tr>';
    try { console.log('[COM] tabela vendedores OK:', (json.vendedores || []).length, 'vendedores'); } catch (_) {}
  }

  function _renderTabelaOFs(json) {
    if (!(json && json.ofs && json.ofs.length)) return;
    var pg = document.querySelector('#page-comissoes, [data-page="comissoes"]');
    if (!pg) return;
    var tbodies = pg.querySelectorAll('tbody');
    var tbodyOFs = tbodies[1] || tbodies[0];
    if (!tbodyOFs) {
      try { console.warn('[COM] tbody OFs nao encontrado'); } catch (_) {}
      return;
    }

    var _prevPause = window._pausarObservers;
    window._pausarObservers = true;
    try {
    var tableOFs = tbodyOFs.closest ? tbodyOFs.closest('table') : null;
    try {
      var theadOFs = tableOFs && tableOFs.querySelector('thead');
      if (theadOFs) {
        theadOFs.innerHTML = ''
          + '<tr>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">N° OF</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Cliente</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Produto</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Qtd</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Vendedor</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Valor OF</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">%</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:right">Comissão R$</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Data</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Data Conclusão</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2)">Status</th>'
          + '<th style="padding:8px;border:1px solid var(--border);background:var(--s2);text-align:center">Ação</th>'
          + '</tr>';
      }
    } catch (_) {}

    var porVendedor = {};
    (json.ofs || []).forEach(function(of) {
      var v = String(of && of.vendedor || 'Sem Vendedor').trim() || 'Sem Vendedor';
      if (!porVendedor[v]) porVendedor[v] = [];
      porVendedor[v].push(of);
    });

    var html = '';
    Object.keys(porVendedor).forEach(function(vendNome) {
      var lista = porVendedor[vendNome] || [];
      var totalVend = lista.reduce(function(s, o) { return s + (Number(o && o.valor_total || 0) || 0); }, 0);
      var totalCom = lista.reduce(function(s, o) { return s + (Number(o && o.comissao_rs || 0) || 0); }, 0);
      html += ''
        + '<tr style="background:var(--accent,#6366f1);color:#fff;font-weight:700">'
        + '<td colspan="12" style="padding:8px 12px">👤 ' + String(vendNome) + ' — ' + String(lista.length) + ' OFs — ' + fmt(totalVend) + ' — Comissão: ' + fmt(totalCom) + '</td>'
        + '</tr>';
      html += lista.map(function(of) {
        return ''
          + '<tr>'
          + '<td style="padding:7px 12px">#' + String(of && of.numero || '—') + '</td>'
          + '<td style="padding:7px 12px">' + String(of && of.cliente || '—') + '</td>'
          + '<td style="padding:7px 12px">' + String((of && (of.produto || of.descricao)) || '—') + '</td>'
          + '<td style="padding:7px 12px;text-align:center">' + String((of && of.qtd) != null ? (of.qtd || 0) : '—') + '</td>'
          + '<td style="padding:7px 12px">' + String(of && of.vendedor || '—') + '</td>'
          + '<td style="padding:7px 12px;text-align:right">' + fmt(of && of.valor_total) + '</td>'
          + '<td style="padding:7px 12px;text-align:center">' + (Number(of && of.comissao_pct || 1) || 1).toFixed(2) + '%</td>'
          + '<td style="padding:7px 12px;text-align:right;color:#4ade80">' + fmt(of && of.comissao_rs) + '</td>'
          + '<td style="padding:7px 12px">' + fmtData(of && of.created_at) + '</td>'
          + '<td style="padding:7px 12px">' + fmtData(of && of.data_conclusao) + '</td>'
          + '<td style="padding:7px 12px">' + String(of && of.status || '—') + '</td>'
          + '<td style="padding:7px 12px;text-align:center">'
          + '<button style="padding:3px 8px;border-radius:4px;border:1px solid var(--border,#333);background:transparent;color:var(--text1,#fff);cursor:pointer;font-size:10px" onclick="window.abrirOf && window.abrirOf(' + JSON.stringify(String(of && of.id || '')) + ')">Traçar</button>'
          + '</td>'
          + '</tr>';
      }).join('');
    });

    tbodyOFs.innerHTML = html;
    try { console.log('[COM] detalhamento por vendedor OK:', (json.ofs || []).length, 'OFs'); } catch (_) {}
    } finally {
      setTimeout(function() { window._pausarObservers = _prevPause || false; }, 100);
    }
  }

  function _renderDetalheOFs(ofs) {
    _renderTabelaOFs({ ofs: ofs || [] });
  }

  async function calcularViaApi() {
    var ref = parseMesAno();
    var mesVal = String(ref.mesNum || '').padStart(2, '0');
    var anoVal = String(ref.anoNum || '');
    var token = '';
    try { token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { token = ''; }

    try { console.log('[COM] Calculando:', anoVal + '-' + mesVal); } catch (_) {}

    try {
      var allCards = document.querySelectorAll(
        '#page-comissoes [class*="com-total"], ' +
        '#page-comissoes [class*="comissao-total"], ' +
        '#page-comissoes .card-val, #page-comissoes .cv-g, #page-comissoes .cv-a'
      );
      allCards.forEach(function(card) {
        try { card.textContent = 'Calculando...'; } catch (_) {}
      });
    } catch (_) {}

    var resp = await fetch('/api/comissoes/relatorio?mes=' + encodeURIComponent(mesVal) + '&ano=' + encodeURIComponent(anoVal), {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });
    var json = await resp.json().catch(function() { return null; });

    try {
      console.log(
        '[COM] resposta API:',
        json && json.ok,
        'OFs:',
        json && json.total_ofs,
        'Total:',
        json && json.total_vendido
      );
    } catch (_) {}

    if (!json || !json.ok) {
      try { console.error('[COM] erro API:', json && json.error); } catch (_) {}
      try { alert('Erro: ' + String(json && json.error || 'Falha ao calcular')); } catch (_) {}
      return null;
    }

    window._comissoesSqlData = json;
    window._comissoesData = {
      totalGeral: Number(json.total_vendido || 0) || 0,
      totalComissao: Number(json.total_comissao || 0) || 0,
      totalPedidos: Number(json.total_ofs || 0) || 0,
      vendedores: (json.vendedores || []).map(function(v) {
        var total = Number(v && v.total || 0) || 0;
        var pct = Number(v && v.comissao_pct || 0) || 0;
        var nome = String(v && v.nome || 'Sem Vendedor');
        var vendId = String(v && v.id || '');
        var ofs = Array.isArray(json && json.ofs) ? json.ofs : [];
        var key = nome.toLowerCase().trim();
        var ofsLista = ofs.filter(function(o) {
          return String(o && o.vendedor || '').toLowerCase().trim() === key;
        });
        return {
          vendNome: nome,
          nome: nome,
          vendId: vendId,
          id: vendId,
          total: total,
          peds: Number(v && v.ofs || 0) || 0,
          quantidade: Number(v && v.ofs || 0) || 0,
          ofs: ofsLista,
          ofsList: ofsLista,
          ofs_lista: ofsLista,
          comissaoRs: Number(v && v.comissao_rs || (total * (pct / 100))) || 0,
          comissao: pct,
          comissao_pct: pct
        };
      })
    };

    try { if (typeof window['renderComissoes'] === 'function') window['renderComissoes'](); } catch (e) { try { console.warn('[COM] renderComissoes erro:', e && e.message); } catch (_) {} }
    try { if (typeof window.renderRelatorioComissoes === 'function') window.renderRelatorioComissoes(); } catch (_) {}
    try { if (typeof window.atualizarTabelaComissoes === 'function') window.atualizarTabelaComissoes(); } catch (_) {}

    try { _forcarRenderComissoes(json); } catch (_) {}
    try { setTimeout(function() { _renderTabelaVendedores(json); _renderTabelaOFs(json); }, 700); } catch (_) {}
    try {
      setTimeout(function() {
        try { _forcarRenderComissoes(json); } catch (_) {}
      }, 400);
    } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('comissoes-calculadas', { detail: json })); } catch (_) {}
    return json;
  }

  window._editarComissaoPct = async function(vendId, vendNome, pctAtual) {
    var novo = prompt('Comissao de ' + vendNome + ' (%)\nAtual: ' + pctAtual + '%\n\nNovo valor:', pctAtual);
    if (novo === null) return;
    var pct = parseFloat(String(novo).replace(',', '.'));
    if (isNaN(pct) || pct < 0 || pct > 100) {
      alert('Valor invalido');
      return;
    }
    var token = '';
    try { token = String(localStorage.getItem('token') || '').trim(); } catch (_) {}
    var payload = JSON.stringify({ comissao_pct: pct });
    var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
    var resp = await fetch('/api/vendedores/' + encodeURIComponent(vendId), {
      method: 'PATCH',
      headers: headers,
      body: payload
    }).catch(function() { return null; });
    if (!resp || !resp.ok) {
      resp = await fetch('/api/vendedores/' + encodeURIComponent(vendId), {
        method: 'PUT',
        headers: headers,
        body: payload
      });
    }
    var json = await resp.json().catch(function() { return null; });
    if (json && json.ok) {
      alert('Comissao atualizada!');
      if (typeof window.calcularComissoes === 'function') window.calcularComissoes();
    } else {
      alert('Erro ao atualizar comissao');
    }
  };

  window.__calcularComissoesLegacy = async function() {
    try {
      return await calcularViaApi();
    } catch (e) {
      try { console.error('[COM] erro fetch:', e && e.message); } catch (_) {}
      try { alert('Erro: ' + String(e && e.message || e)); } catch (_) {}
      return null;
    }
  };

  function _vincularBtnCalcular() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('button')).forEach(function(btn) {
        try {
          if (!btn || btn.dataset.patchCom === '1') return;
          var txt = String(btn.textContent || '').trim();
          if (!(txt === 'Calcular' || txt.indexOf('Calcular') >= 0)) return;
          btn.dataset.patchCom = '1';
          btn.addEventListener('click', function(e) {
            try { e.preventDefault(); } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
            window.calcularComissoes();
          }, true);
        } catch (_) {}
      });
    } catch (_) {}
  }

  try { _patchGoTelaCom(); } catch (_) {}
  try { setTimeout(_patchGoTelaCom, 600); } catch (_) {}
  try { setTimeout(_patchGoTelaCom, 1500); } catch (_) {}
  try { setTimeout(_preencherMesAtual, 200); } catch (_) {}
  try { setTimeout(_preencherMesAtual, 800); } catch (_) {}
  try { setTimeout(_preencherMesAtual, 2000); } catch (_) {}
  try { setTimeout(_iniciarTelaCom, 500); } catch (_) {}

  async function _abrirModalImpressao() {
    var data = window._comissoesSqlData || {};
    var vends = Array.isArray(data.vendedores) ? data.vendedores : [];
    var mesEl = document.getElementById('com-mes') || document.querySelector('select[name="mes"]');
    var anoEl = document.getElementById('com-ano') || document.querySelector('select[name="ano"]');
    var mesAtual = (mesEl && mesEl.value) || '';
    var anoAtual = (anoEl && anoEl.value) || new Date().getFullYear();

    var antigo = document.getElementById('modal-impressao-com');
    if (antigo) antigo.remove();

    var overlay = document.createElement('div');
    overlay.id = 'modal-impressao-com';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center';

    var vendsOpts = vends
      .filter(function(v) { return String(v && v.nome || '') !== 'Sem Vendedor'; })
      .map(function(v) {
        var vendId = String(v && (v.id || v.vendid || v.vendedor_id || '') || '').trim();
        var vendNome = String(v && (v.nome || v.vendedor || v.vendedor_nome || '') || '—').trim();
        return '<label style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;cursor:pointer;background:var(--bg3,#0d0d1a);margin-bottom:6px">'
          + '<input type="checkbox" value="' + vendId + '" data-vendedor="' + vendNome.replace(/"/g, '&quot;') + '" data-vendid="' + vendId.replace(/"/g, '&quot;') + '" checked style="width:16px;height:16px">'
          + '<span style="color:var(--text1,#fff)">' + vendNome + '</span>'
          + '<span style="color:#4ade80;margin-left:auto">' + fmt(v && v.total) + '</span>'
          + '</label>';
      }).join('');

    overlay.innerHTML = ''
      + '<div style="background:var(--bg2,#1a1a2e);border-radius:12px;padding:28px;width:480px;max-width:95vw;max-height:90vh;overflow-y:auto">'
      + '<h3 style="color:var(--text1,#fff);margin-bottom:20px;font-size:16px">🖨️ Imprimir Relatório de Comissões</h3>'
      + '<div style="margin-bottom:16px">'
      + '<label style="color:var(--text2,#aaa);font-size:11px;text-transform:uppercase;display:block;margin-bottom:6px">Mês de Referência</label>'
      + '<div style="color:var(--text1,#fff);font-size:14px;padding:10px;background:var(--bg3,#0d0d1a);border-radius:6px" id="imp-mes-label">' + String(mesAtual || (anoAtual + '-??')) + '</div>'
      + '</div>'
      + '<div style="margin-bottom:20px">'
      + '<label style="color:var(--text2,#aaa);font-size:11px;text-transform:uppercase;display:block;margin-bottom:8px">Selecionar Vendedores</label>'
      + '<label style="display:flex;align-items:center;gap:8px;padding:8px;cursor:pointer;margin-bottom:8px">'
      + '<input type="checkbox" id="imp-todos" checked style="width:16px;height:16px">'
      + '<span style="color:var(--text1,#fff);font-weight:600">Todos os vendedores</span>'
      + '</label>'
      + '<div id="imp-vends-list">' + vendsOpts + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:10px;justify-content:flex-end">'
      + '<button type="button" data-imp-close="1" style="padding:10px 20px;border-radius:6px;border:1px solid var(--border,#333);background:transparent;color:var(--text1,#fff);cursor:pointer">Cancelar</button>'
      + '<button type="button" id="btn-gerar-impressao-com" style="padding:10px 24px;border-radius:6px;border:none;background:#6366f1;color:#fff;cursor:pointer;font-weight:600">🖨️ Gerar e Imprimir</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    try {
      try { console.log('[IMPRIMIR] modal aberto, _comissoesSqlData:', !!window._comissoesSqlData, window._comissoesSqlData && window._comissoesSqlData.total_ofs); } catch (_) {}
      overlay.querySelector('[data-imp-close="1"]').onclick = function() { overlay.remove(); };
      Array.prototype.slice.call(overlay.querySelectorAll('button')).forEach(function(btn) {
        try {
          var t = String(btn.textContent || '');
          if (t.indexOf('Gerar') < 0 && t.indexOf('Imprimir') < 0) return;
          try { btn.removeAttribute('onclick'); } catch (_) {}
          if (btn.dataset && btn.dataset.patchImpBtn === '1') return;
          btn.dataset.patchImpBtn = '1';
          btn.addEventListener('click', function(e) {
            try { e.preventDefault(); } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
            try { console.log('[IMPRIMIR] botão clicado'); } catch (_) {}
            try { window._gerarImpressaoComissoes(); } catch (err) { try { console.error('[IMPRIMIR] erro:', err && err.message); } catch (_) {} }
          }, true);
        } catch (_) {}
      });
      document.getElementById('imp-todos').addEventListener('change', function() {
        Array.prototype.slice.call(document.querySelectorAll('#imp-vends-list input[type=checkbox]')).forEach(function(cb) {
          cb.checked = !!document.getElementById('imp-todos').checked;
        });
      });
    } catch (_) {}
  }

  window._gerarImpressaoComissoes = function() {
    var data = window._comissoesSqlData;
    try { console.log('[IMPRIMIR] data existe:', !!data, 'total_ofs:', data && data.total_ofs, 'ofs length:', data && data.ofs && data.ofs.length); } catch (_) {}

    if (!data || !data.total_ofs) {
      try { alert('Calcule o relatório primeiro'); } catch (_) {}
      return;
    }

    var checked = [];
    try { checked = Array.prototype.slice.call(document.querySelectorAll('#imp-vends-list input[type=checkbox]:checked')) || []; } catch (_) { checked = []; }
    var selecionados = new Set();
    checked.forEach(function(cb) {
      try {
        var id = String(cb && (cb.getAttribute('data-vendid') || cb.value) || '').trim().toLowerCase();
        var nome = String(cb && cb.getAttribute('data-vendedor') || '').trim().toLowerCase();
        if (id) selecionados.add('id:' + id);
        if (nome) selecionados.add('nome:' + nome);
      } catch (_) {}
    });
    var impTodos = document.getElementById('imp-todos');
    var todosSel = (impTodos ? impTodos.checked : true) !== false;

    var fmtLocal = function(v) {
      return 'R$\u00a0' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    var fmtD = function(d) {
      if (!d) return '—';
      try { return new Date(d).toLocaleDateString('pt-BR'); } catch (_) { return '—'; }
    };

    var vendedorSelecionado = function(of) {
      if (todosSel) return true;
      var vendId = String(of && (of.vendid || of.vendedor_id || of.vendId || of.vend_id || '') || '').trim().toLowerCase();
      var vendNome = String(of && (of._vendedor_resolvido || of._vendedor_nome || of.vendedor || of.vendedor_nome || of.vendNome || '') || '').trim().toLowerCase();
      return (vendId && selecionados.has('id:' + vendId)) || (vendNome && selecionados.has('nome:' + vendNome));
    };

    var vends = (data.vendedores || []).filter(function(v) {
      if (todosSel) return true;
      var vendId = String(v && (v.id || v.vendid || v.vendedor_id || '') || '').trim().toLowerCase();
      var vendNome = String(v && (v.nome || v.vendedor || v.vendedor_nome || '') || '').trim().toLowerCase();
      return (vendId && selecionados.has('id:' + vendId)) || (vendNome && selecionados.has('nome:' + vendNome));
    });

    var ofs = (data.ofs || []).filter(function(of) {
      return vendedorSelecionado(of);
    });

    var parts = String(data.mes || '').split('-');
    var ano = parts[0] || '';
    var mes = parts[1] || '';
    var meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    var nomeMes = meses[Math.max(0, (parseInt(mes, 10) || 1) - 1)] || mes;

    var agora = new Date();
    var html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comissões ' + nomeMes + '/' + ano + '</title>'
      + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:20px}h1{font-size:20px;margin-bottom:4px}h2{font-size:13px;color:#666;font-weight:normal;margin-bottom:20px}.cards{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}.card{border:1px solid #ddd;border-radius:6px;padding:12px 18px;min-width:140px}.lbl{font-size:10px;color:#888;text-transform:uppercase;margin-bottom:3px}.val{font-size:16px;font-weight:700}.green{color:#16a34a}table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:11px}th{background:#f0f0f0;padding:7px 8px;text-align:left;border-bottom:2px solid #ccc;font-size:10px;text-transform:uppercase}td{padding:6px 8px;border-bottom:1px solid #eee}.vh{background:#1a1a2e;color:#fff;padding:8px 12px;border-radius:4px;margin:16px 0 8px;font-weight:700;font-size:12px}.tf{font-weight:700;background:#f5f5f5}@media print{body{padding:0}}</style>'
      + '</head><body>'
      + '<h1>Relatório de Comissões — ' + nomeMes + '/' + ano + '</h1>'
      + '<h2>Italy Embalagens · Gerado em ' + agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR') + '</h2>'
      + '<div class="cards">'
      + '<div class="card"><div class="lbl">Total Vendido</div><div class="val">' + fmtLocal(data.total_vendido) + '</div></div>'
      + '<div class="card"><div class="lbl">Total Comissão</div><div class="val green">' + fmtLocal(data.total_comissao) + '</div></div>'
      + '<div class="card"><div class="lbl">Total OFs</div><div class="val">' + String(data.total_ofs || 0) + '</div></div>'
      + '</div>'
      + '<h3 style="margin-bottom:8px;font-size:13px">Resumo por Vendedor</h3>'
      + '<table><thead><tr><th>Vendedor</th><th>OFs</th><th style="text-align:right">Total Vendido</th><th style="text-align:center">%</th><th style="text-align:right">Comissão R$</th></tr></thead><tbody>'
      + vends.map(function(v) {
        return '<tr><td>' + String(v && v.nome || '—') + '</td><td>' + String(v && v.ofs || 0) + '</td><td style="text-align:right">' + fmtLocal(v && v.total) + '</td><td style="text-align:center">' + (Number(v && v.comissao_pct || 1) || 1).toFixed(2) + '%</td><td style="text-align:right" class="green">' + fmtLocal(v && v.comissao_rs) + '</td></tr>';
      }).join('')
      + '<tr class="tf"><td>TOTAL</td><td>' + String(vends.reduce(function(s, v) { return s + (Number(v && v.ofs || 0) || 0); }, 0)) + '</td><td style="text-align:right">' + fmtLocal(vends.reduce(function(s, v) { return s + (Number(v && v.total || 0) || 0); }, 0)) + '</td><td></td><td style="text-align:right" class="green">' + fmtLocal(vends.reduce(function(s, v) { return s + (Number(v && v.comissao_rs || 0) || 0); }, 0)) + '</td></tr>'
      + '</tbody></table>'
      + vends.map(function(v) {
        var vOfs = ofs.filter(function(o) { return String(o && o.vendedor || '') === String(v && v.nome || ''); });
        if (!vOfs.length) return '';
        return '<div class="vh">📋 ' + String(v && v.nome || '—') + ' — ' + String(vOfs.length) + ' OFs — ' + fmtLocal(v && v.total) + '</div>'
          + '<table><thead><tr><th>Nº OF</th><th>Cliente</th><th style="text-align:right">Valor</th><th style="text-align:center">%</th><th style="text-align:right">Comissão</th><th>Data Conclusão</th><th>Status</th></tr></thead><tbody>'
          + vOfs.map(function(o) {
            return '<tr><td>#' + String(o && o.numero || '—') + '</td><td>' + String(o && o.cliente || '—') + '</td><td style="text-align:right">' + fmtLocal(o && o.valor_total) + '</td><td style="text-align:center">' + (Number(o && o.comissao_pct || 1) || 1).toFixed(2) + '%</td><td style="text-align:right" class="green">' + fmtLocal(o && o.comissao_rs) + '</td><td>' + fmtD((o && (o.data_conclusao || o.created_at)) || null) + '</td><td>' + String(o && o.status || '—') + '</td></tr>';
          }).join('')
          + '<tr class="tf"><td colspan="2">Total ' + String(v && v.nome || '—') + '</td><td style="text-align:right">' + fmtLocal(v && v.total) + '</td><td></td><td style="text-align:right" class="green">' + fmtLocal(v && v.comissao_rs) + '</td><td colspan="2"></td></tr>'
          + '</tbody></table>';
      }).join('')
      + '</body></html>';

    try { var m = document.getElementById('modal-impressao-com'); if (m) m.remove(); } catch (_) {}
    var win = null;
    try { win = window.open('', '_blank', 'width=900,height=700'); } catch (_) { win = null; }
    if (!win) {
      try { alert('Popup bloqueado! Permita popups para este site e tente novamente.'); } catch (_) {}
      return;
    }
    try {
      win.document.write(html);
      win.document.close();
    } catch (e) {
      try { alert('Erro ao abrir impressão: ' + String(e && e.message || e)); } catch (_) {}
      return;
    }
    setTimeout(function() { try { win.print(); } catch (_) {} }, 1000);
  };

  window._abrirModalImpressaoComissoes = _abrirModalImpressao;
  window.gerarEImprimirComissoes = function() { _abrirModalImpressao(); };
  window.injetarBotaoImprimirComissoes = function() {};

  function _vincularBtnImprimir() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('button')).forEach(function(btn) {
        try {
          var txt = String(btn.textContent || '').trim();
          if ((txt.indexOf('Imprimir') >= 0 || txt.indexOf('imprimir') >= 0) && !btn.dataset.patchPrint) {
            btn.dataset.patchPrint = '1';
            btn.addEventListener('click', function(e) {
              try { e.preventDefault(); } catch (_) {}
              try { e.stopPropagation(); } catch (_) {}
              _abrirModalImpressao();
            }, true);
          }
        } catch (_) {}
      });
    } catch (_) {}
  }

  try { _vincularBtnCalcular(); } catch (_) {}
  try { _vincularBtnImprimir(); } catch (_) {}
})();

(function patchClientesEditarEPainel() {
  if (window.__patchClientesEditarEPainelInstalled) return;
  window.__patchClientesEditarEPainelInstalled = true;

  function _vincularBtnEditarCliente() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('[onclick*="editarCliente"], .btn-editar-cliente')).forEach(function(btn) {
        try {
          if (!btn || btn.dataset.patchEdit) return;
          btn.dataset.patchEdit = '1';
          var onclick = String(btn.getAttribute('onclick') || '');
          var m = onclick.match(/editarCliente\(['"]([^'"]+)['"]\)/);
          var id = (m && m[1]) ? m[1] : (btn.dataset && (btn.dataset.id || btn.dataset.clienteId || btn.dataset.cliente_id));
          if (!id) return;
          btn.addEventListener('click', function(e) {
            try { e.preventDefault(); } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
            try {
              if (typeof window.editarCliente === 'function') return window.editarCliente(id);
            } catch (_) {}
            try {
              if (typeof window._abrirModalEditarCliente === 'function') return window._abrirModalEditarCliente(id);
            } catch (_) {}
          }, true);
        } catch (_) {}
      });
    } catch (_) {}
  }

  window._abrirModalEditarCliente = async function(id) {
    var token = '';
    try { token = String(localStorage.getItem('token') || '').trim(); } catch (_) {}
    var resp = await fetch('/api/clientes/' + encodeURIComponent(id), {
      headers: { 'Authorization': 'Bearer ' + token }
    }).catch(function() { return null; });
    if (!resp || !resp.ok) {
      try { alert('Cliente não encontrado'); } catch (_) {}
      return;
    }
    var json = await resp.json().catch(function() { return null; });
    var c = (json && (json.data || json.ok && json.data)) ? (json.data || json.ok && json.data) : json;
    if (!(c && c.id)) {
      try { alert('Cliente não encontrado'); } catch (_) {}
      return;
    }

    try { var old = document.getElementById('patch-modal-editar-cli'); if (old) old.remove(); } catch (_) {}
    var overlay = document.createElement('div');
    overlay.id = 'patch-modal-editar-cli';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = ''
      + '<div style="background:var(--bg2,#1a1a2e);border-radius:12px;padding:28px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto">'
      + '<h3 style="color:var(--text1,#fff);margin-bottom:20px">Editar Cliente</h3>'
      + '<div style="display:grid;gap:12px">'
      + '<input id="ec-nome" value="' + String(c.nome || '') + '" placeholder="Nome *" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-cnpj" value="' + String(c.cnpj || '') + '" placeholder="CNPJ" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-cidade" value="' + String(c.cidade || '') + '" placeholder="Cidade" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-uf" value="' + String(c.uf || '') + '" placeholder="UF" maxlength="2" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-tel" value="' + String(c.tel || c.telefone || '') + '" placeholder="Telefone" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '<input id="ec-email" value="' + String(c.email || '') + '" placeholder="Email" style="padding:10px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg3,#0d0d1a);color:var(--text1,#fff);width:100%">'
      + '</div>'
      + '<div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">'
      + '<button type="button" data-ec-close="1" style="padding:10px 20px;border-radius:6px;border:1px solid var(--border,#333);background:transparent;color:var(--text1,#fff);cursor:pointer">Cancelar</button>'
      + '<button type="button" data-ec-save="1" style="padding:10px 20px;border-radius:6px;border:none;background:var(--accent,#6366f1);color:#fff;cursor:pointer;font-weight:600">Salvar</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    try { overlay.querySelector('[data-ec-close="1"]').onclick = function() { overlay.remove(); }; } catch (_) {}
    try { overlay.querySelector('[data-ec-save="1"]').onclick = function() { window._salvarEdicaoCliente(id); }; } catch (_) {}
  };

  window._salvarEdicaoCliente = async function(id) {
    var token = '';
    try { token = String(localStorage.getItem('token') || '').trim(); } catch (_) {}
    var body = {
      nome: String((document.getElementById('ec-nome') || {}).value || '').trim(),
      cnpj: String((document.getElementById('ec-cnpj') || {}).value || '').trim(),
      cidade: String((document.getElementById('ec-cidade') || {}).value || '').trim(),
      uf: String((document.getElementById('ec-uf') || {}).value || '').trim(),
      tel: String((document.getElementById('ec-tel') || {}).value || '').trim(),
      email: String((document.getElementById('ec-email') || {}).value || '').trim()
    };
    if (!body.nome) {
      try { alert('Nome obrigatório'); } catch (_) {}
      return;
    }
    var resp = await fetch('/api/clientes/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    var json = await resp.json().catch(function() { return null; });
    var updated = (json && json.data) ? json.data : json;
    if (resp.ok && updated) {
      try { var ov = document.getElementById('patch-modal-editar-cli'); if (ov) ov.remove(); } catch (_) {}
      try { window._clientesCarregados = false; } catch (_) {}
      try { window.CLIENTES = []; } catch (_) {}
      try { window._CLIENTES = []; } catch (_) {}
      try { if (typeof window.carregarClientes === 'function') await window.carregarClientes(true); } catch (_) {}
      try { if (typeof window.renderClientes === 'function') window.renderClientes(); } catch (_) {}
      try {
        if (typeof window._notificacaoOF === 'function') window._notificacaoOF('Cliente atualizado!', 'sucesso');
      } catch (_) {}
    } else {
      try { alert('Erro: ' + String((json && (json.error || json.message)) || 'Falha ao salvar')); } catch (_) {}
    }
  };

  (function _patchPainelClienteId() {
    if (window.__patchPainelClienteIdInstalled) return;
    window.__patchPainelClienteIdInstalled = true;
    var orig = window.abrirPainelCliente || window.verCliente || window.abrirCliente;
    var nomeFn = window.abrirPainelCliente ? 'abrirPainelCliente' : (window.verCliente ? 'verCliente' : 'abrirCliente');
    if (typeof orig !== 'function' || !nomeFn) return;
    window[nomeFn] = function(id) {
      var args = Array.prototype.slice.call(arguments, 1);
      var cid = String(id || '').trim();
      try { console.log('[HIST CLI] id:', cid, typeof id); } catch (_) {}
      if (!cid || cid === 'undefined' || cid === 'null') {
        try { console.warn('[PAINEL CLI] ID vazio!'); } catch (_) {}
        return;
      }
      try {
        if (typeof window.getCli === 'function' && !window.getCli(cid)) {
          var nome = String((args && args[0]) || '').trim();
          var alt = null;
          try { if (nome && typeof window.getCliByName === 'function') alt = window.getCliByName(nome); } catch (_) { alt = null; }
          if (!alt && nome && Array.isArray(window.CLIENTES)) {
            var low = nome.toLowerCase();
            alt = window.CLIENTES.find(function(c) { return String(c && c.nome || '').toLowerCase().trim() === low; }) || null;
          }
          if (alt && alt.id) cid = String(alt.id).trim();
        }
      } catch (_) {}
      var callArgs = [cid].concat(args);
      return orig.apply(this, callArgs);
    };
  })();

  var t = null;
  try {
    var obs = new MutationObserver(function() {
      if (window._pausarObservers) return;
      if (t) return;
      t = setTimeout(function() {
        t = null;
        _vincularBtnEditarCliente();
      }, 100);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  try { setTimeout(_vincularBtnEditarCliente, 600); } catch (_) {}
  try { setTimeout(_vincularBtnEditarCliente, 1500); } catch (_) {}
})();

(function patchOfRapidaClienteEspecial() {
  function normClienteNome(v) {
    var s = String(v == null ? '' : v).trim();
    if (!s) return '';
    s = s
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return s;
  }

  function getClientesCount() {
    try {
      if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) return CLIENTES.length;
    } catch (_) {}
    try {
      if (Array.isArray(window.CLIENTES)) return window.CLIENTES.length;
    } catch (_) {}
    return 0;
  }

  function setClientesLista(lista) {
    var out = Array.isArray(lista) ? lista.slice() : [];
    try {
      if (typeof normalizeCli === 'function') out = out.map(function(c) { return normalizeCli(c); });
    } catch (_) {}
    try {
      if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) {
        CLIENTES.length = 0;
        out.forEach(function(c) { CLIENTES.push(c); });
      }
    } catch (_) {}
    try { window.CLIENTES = out; } catch (_) {}
    try { window._CLIENTES = out; } catch (_) {}
    try { window.clientes = out; } catch (_) {}
  }

  function clientesRef() {
    try {
      if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) return CLIENTES;
    } catch (_) {}
    return Array.isArray(window.CLIENTES) ? window.CLIENTES : (Array.isArray(window.clientes) ? window.clientes : []);
  }

  function acharClienteRobusto(nome) {
    var alvo = normClienteNome(nome);
    if (!alvo) return null;
    var lista = clientesRef();
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      var base = c && (c.nome || c.razao_social || c.razao || '');
      if (normClienteNome(base) === alvo) return c;
    }
    for (var j = 0; j < lista.length; j++) {
      var c2 = lista[j];
      var nome2 = c2 && (c2.nome || c2.razao_social || c2.razao || '');
      var hay = [nome2, c2 && c2.cnpj, c2 && c2.cidade, c2 && (c2.tel || c2.telefone)]
        .filter(Boolean)
        .map(normClienteNome)
        .join(' | ');
      var n2 = normClienteNome(nome2);
      if (hay && (hay.indexOf(alvo) !== -1 || (n2 && alvo.indexOf(n2) !== -1))) return c2;
    }
    return null;
  }

  function syncClienteOfRapida(input) {
    var el = input || document.getElementById('of-r-cliente');
    if (!el) return null;
    var cli = acharClienteRobusto(el.value);
    if (cli && cli.id) {
      el.dataset.clienteId = String(cli.id);
      el.dataset.clienteNome = String(cli.nome || cli.razao_social || cli.razao || el.value || '').trim();
      return cli;
    }
    delete el.dataset.clienteId;
    delete el.dataset.clienteNome;
    return null;
  }

  function getAuthHeader() {
    var token = '';
    try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function fetchClientePorNome(nome) {
    var q = String(nome || '').trim();
    if (!q) return Promise.resolve(null);
    var urls = [
      '/api/clientes?q=' + encodeURIComponent(q) + '&limit=5&t=' + Date.now(),
      '/api/clientes?search=' + encodeURIComponent(q) + '&limit=5&t=' + Date.now(),
      '/api/clientes?busca=' + encodeURIComponent(q) + '&limit=5&t=' + Date.now()
    ];
    var tryOne = function(i) {
      if (i >= urls.length) return Promise.resolve(null);
      return fetch(urls[i], { headers: getAuthHeader() })
        .then(function(r) { return r && r.ok ? r.json().catch(function() { return null; }) : null; })
        .then(function(j) {
          var arr = j && (j.data || j.clientes || j.items);
          if (j && j.ok && Array.isArray(arr) && arr.length) return arr[0] || null;
          return null;
        })
        .catch(function() { return null; })
        .then(function(c) { return c ? c : tryOne(i + 1); });
    };
    return tryOne(0);
  }

  async function ensureClientesCarregadosAbertura() {
    if (getClientesCount() >= 5) return getClientesCount();
    console.log('[OF] carregando CLIENTES antes de abrir...');
    try {
      if (typeof carregarClientes === 'function') {
        try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
      }
    } catch (_) {}
    if (getClientesCount() >= 5) return getClientesCount();
    var token = '';
    try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
    try {
      var r = await fetch('/api/clientes?limit=2000&order=created_at&dir=desc&t=' + Date.now(), { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var j = await r.json().catch(function() { return null; });
      if (j && j.ok && Array.isArray(j.data)) setClientesLista(j.data);
    } catch (_) {}
    console.log('[OF] CLIENTES prontos:', getClientesCount());
    return getClientesCount();
  }

  async function ensureClienteId(el) {
    if (!el) return null;
    try {
      if (el.dataset && el.dataset.clienteId) return { id: String(el.dataset.clienteId || '').trim() };
    } catch (_) {}
    var raw = String(el.value || '').trim();
    if (!raw) return null;
    var cli = syncClienteOfRapida(el);
    if (cli && cli.id) return cli;
    try {
      if (typeof carregarClientes === 'function') await carregarClientes(true);
    } catch (_) {}
    cli = syncClienteOfRapida(el);
    if (cli && cli.id) return cli;
    var remoto = await fetchClientePorNome(raw);
    var rid = String(remoto && (remoto.id || remoto.cli_id || remoto.cliente_id) || '').trim();
    if (rid) {
      try { el.dataset.clienteId = rid; } catch (_) {}
      try { el.dataset.clienteNome = String(remoto.nome || remoto.razao_social || remoto.razao || raw || '').trim(); } catch (_) {}
      try { if (el.dataset && el.dataset.clienteNome) el.value = String(el.dataset.clienteNome || '').trim(); } catch (_) {}
      return { id: rid, nome: String(remoto.nome || '').trim() };
    }
    return null;
  }

  function bindClienteInput() {
    var el = document.getElementById('of-r-cliente');
    if (!el || el.dataset.patchClienteEspecial === '1') return;
    el.dataset.patchClienteEspecial = '1';
    ['input', 'change', 'blur'].forEach(function(evt) {
      el.addEventListener(evt, function() { syncClienteOfRapida(el); }, true);
    });
    setTimeout(function() { syncClienteOfRapida(el); }, 0);
  }

  function patchAberturaPorClique() {
    if (document.documentElement.dataset.patchOfOpenClick === '1') return;
    document.documentElement.dataset.patchOfOpenClick = '1';
    document.addEventListener('click', async function(e) {
      var btn = e && e.target && e.target.closest ? e.target.closest('button, [onclick]') : null;
      if (!btn) return;
      if (btn.dataset && btn.dataset.patchOfOpening === '1') return;

      var oc = '';
      var txt = '';
      try { oc = String(btn.getAttribute('onclick') || ''); } catch (_) {}
      try { txt = String(btn.textContent || '').trim(); } catch (_) {}

      var isNovaOF = oc.indexOf('abrirModalOF') !== -1 || oc.indexOf('abrirNovaOf(') !== -1 || oc.indexOf('abrirNovaOF(') !== -1 || txt === 'Nova OF';
      var isOFRapida = oc.indexOf('abrirNovaOfRapida') !== -1 || oc.indexOf('abrirOFRapida') !== -1 || oc.indexOf('abrirOfRapida') !== -1 || txt === 'OF Rápida' || txt === 'Rápida';
      if (!isNovaOF && !isOFRapida) return;

      var openFn = null;
      if (isOFRapida) openFn = window.abrirNovaOfRapida || window.abrirOFRapida || window.abrirOfRapida || null;
      else openFn = window.abrirModalOF || window.abrirNovaOf || null;
      if (typeof openFn !== 'function') return;

      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

      try { btn.dataset.patchOfOpening = '1'; } catch (_) {}
      try {
        await ensureClientesCarregadosAbertura();
        openFn.apply(window, []);
      } catch (_) {
        try { openFn.apply(window, []); } catch (_) {}
      } finally {
        setTimeout(function() {
          try { delete btn.dataset.patchOfOpening; } catch (_) {}
        }, 1200);
      }
    }, true);
  }

  function patchSalvar(fnName) {
    var orig = window[fnName];
    if (typeof orig !== 'function' || orig._patchClienteEspecial) return;
    var wrapped = async function() {
      var el = document.getElementById('of-r-cliente');
      if (el) {
        var cli = null;
        try { cli = await ensureClienteId(el); } catch (_) { cli = syncClienteOfRapida(el); }
        var cliId = String((el.dataset && el.dataset.clienteId) ? el.dataset.clienteId : '').trim();
        if (!cliId) {
          try { alert('Selecione um cliente válido da lista.'); } catch (_) {}
          try { el.focus(); el.select && el.select(); } catch (_) {}
          return;
        }
        var nomeCanonico = String((cli && (cli.nome || cli.razao_social || cli.razao)) || el.dataset.clienteNome || el.value || '').trim();
        if (nomeCanonico) el.value = nomeCanonico;
        try {
          var hiddenCli = document.querySelector('#f-cli-id, input[name="cli_id"], input[name="cliId"]');
          if (hiddenCli) hiddenCli.value = cliId;
        } catch (_) {}
      }
      return orig.apply(this, arguments);
    };
    wrapped._patchClienteEspecial = true;
    window[fnName] = wrapped;
  }

  function tick() {
    try { bindClienteInput(); } catch (_) {}
    try { patchAberturaPorClique(); } catch (_) {}
    try { patchSalvar('salvarOfRapida'); } catch (_) {}
    try { patchSalvar('salvarNovaOfRapida'); } catch (_) {}
    try { patchSalvar('salvarOFRapida'); } catch (_) {}
    try { patchSalvar('salvarNovaOF'); } catch (_) {}
    try { patchSalvar('salvarOF'); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 150);
      setInterval(tick, 1000);
    });
  } else {
    setTimeout(tick, 150);
    setInterval(tick, 1000);
  }
})();

(function patchEditarOfPcpAbrirNaOfRapida() {
  function tokenHeaders() {
    var token = '';
    try { token = String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  async function fetchOf(id) {
    var sid = String(id || '').trim();
    if (!sid) return null;
    try {
      if (typeof window.apiFetch === 'function') {
        var r1 = await window.apiFetch('/api/ofs/' + encodeURIComponent(sid), { method: 'GET' });
        var j1 = await r1.json().catch(function() { return null; });
        if (j1 && j1.ok && j1.data) return j1.data;
        return j1 && j1.ok ? j1 : j1;
      }
    } catch (_) {}
    var r = await fetch('/api/ofs/' + encodeURIComponent(sid), { headers: tokenHeaders() });
    var j = await r.json().catch(function() { return null; });
    if (j && j.ok && j.data) return j.data;
    return j && j.ok ? j : j;
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    if (val == null) return;
    try { el.value = String(val); } catch (_) {}
  }

  function setChecked(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    try { el.checked = !!v; } catch (_) {}
  }

  function patchSalvarOfRapida() {
    if (typeof window.salvarOfRapida !== 'function') return;
    if (window.salvarOfRapida._patchEditToPatch) return;
    var orig = window.salvarOfRapida;
    window.salvarOfRapida = async function() {
      var editId = String(window._ofRapidaEditandoId || '').trim();
      if (!editId) return orig.apply(this, arguments);

      var btn = document.getElementById('btn-salvar-of-rapida');
      try { if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; } } catch (_) {}
      try {
        var clienteNome = String(document.getElementById('of-r-cliente')?.value || '').trim();
        var produto = String(document.getElementById('of-r-produto')?.value || '').trim();
        var empId = String(document.getElementById('of-r-empresa')?.value || 'E1').trim() || 'E1';
        var vendId = String(document.getElementById('of-r-vendedor')?.value || '').trim();
        var qtd = Math.trunc(Number(document.getElementById('of-r-qtd')?.value || 0) || 0);
        var vlunit = parseFloat(String(document.getElementById('of-r-vlunit')?.value || '0').replace(',', '.')) || 0;
        var totalManualEl = document.getElementById('of-r-total');
        var total = parseFloat(String(totalManualEl?.value || '0').replace(',', '.')) || (qtd * vlunit);
        var ref = String(document.getElementById('of-r-ref')?.value || '').trim();
        var comp = parseFloat(String(document.getElementById('of-r-comp')?.value || '').replace(',', '.')) || 0;
        var larg = parseFloat(String(document.getElementById('of-r-larg')?.value || '').replace(',', '.')) || 0;
        var entrega = String(document.getElementById('of-r-entrega')?.value || '').slice(0, 10);
        var urgente = !!document.getElementById('of-r-urgente')?.checked;
        var maquinaSel = String(document.getElementById('of-r-maquina')?.value || '').trim();
        var dataAgend = String(window._ofRapidaDataAgendamento || '').slice(0, 10);
        var agendamentoAuto = !!(maquinaSel && dataAgend);

        var erros = [];
        if (!clienteNome) erros.push('Cliente');
        if (!produto) erros.push('Produto');
        if (!(qtd > 0)) erros.push('Quantidade');
        if (!(vlunit > 0)) erros.push('Valor Unit.');
        if (!(larg > 0 && comp > 0)) erros.push('Dimensões (L×C)');
        if (!maquinaSel) erros.push('Máquina');
        if (!entrega) erros.push('Data de Entrega');
        if (erros.length) {
          alert('Preencha: ' + erros.join(', '));
          return;
        }

        var cli = (Array.isArray(window.CLIENTES) ? window.CLIENTES : (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES) ? CLIENTES : [])).find(function(c) {
          var n = String(c?.nome || c?.razao_social || c?.razao || '').trim();
          if (!n) return false;
          return n.toLowerCase() === clienteNome.toLowerCase();
        }) || null;
        var cliId = String(cli?.id || '').trim();
        if (!cliId) {
          alert('Selecione um cliente válido da lista.');
          return;
        }

        var coresPayload = [];
        try {
          if (typeof window.coresPayloadFromSelecionadas === 'function') coresPayload = window.coresPayloadFromSelecionadas(window.coresSelecionadasOFRapida);
        } catch (_) {}

        var payload = {
          cli_id: cliId,
          cliId: cliId,
          cliente_id: cliId,
          vendedor_id: vendId,
          vendId: vendId,
          vend_id: vendId,
          prodDesc: produto,
          descricao: produto,
          produto: produto,
          quantidade: qtd,
          qtd: qtd,
          valor_total: total,
          valor_venda: total,
          ent: entrega,
          data_entrega: entrega,
          urg: urgente,
          urgente: urgente,
          emp_id: empId,
          empId: empId,
          caixa_comprimento: comp,
          caixa_largura: larg,
          dim_comprimento: comp,
          dim_largura: larg,
          cores_impressao: coresPayload,
          itens: [{
            desc: produto,
            descricao: produto,
            ref: ref,
            qtd: qtd,
            quantidade: qtd,
            vunit: vlunit,
            valor_unitario: vlunit,
            valor_total: total,
            maquina: maquinaSel || '',
            maquinas_fluxo: [],
            maquinas_fluxo_ids: [],
          }],
          maquina_agendada: maquinaSel || undefined,
          data_agendamento: agendamentoAuto ? dataAgend : undefined,
          agendamento_auto: agendamentoAuto ? true : undefined,
          fluxo_maquinas: maquinaSel ? [maquinaSel] : [],
          maq: maquinaSel ? [maquinaSel] : undefined,
        };

        var r2 = null;
        if (typeof window.apiFetch === 'function') {
          r2 = await window.apiFetch('/api/ofs/' + encodeURIComponent(editId), { method: 'PATCH', body: payload });
        } else {
          r2 = await fetch('/api/ofs/' + encodeURIComponent(editId), { method: 'PATCH', headers: Object.assign({ 'Content-Type': 'application/json' }, tokenHeaders()), body: JSON.stringify(payload) });
        }
        var d2 = r2 ? await r2.json().catch(function() { return null; }) : null;
        if (!(r2 && r2.ok) || (d2 && d2.ok === false)) throw new Error(d2?.error || d2?.message || 'Erro ao salvar');

        window._ofRapidaEditandoId = null;
        try { if (typeof window.fecharNovaOfRapida === 'function') window.fecharNovaOfRapida(); } catch (_) {}
        try { window.toast('OF atualizada com sucesso! ✅', 'var(--green)'); } catch (_) {}
        try { if (typeof window.carregarOFs === 'function') window.carregarOFs(); } catch (_) {}
        try { if (typeof window.renderPCP === 'function') window.renderPCP(); } catch (_) {}
        try { if (typeof window.renderOFsPorMaquina === 'function') window.renderOFsPorMaquina(); } catch (_) {}
        return;
      } catch (e) {
        try { window.toast('Erro ao atualizar OF: ' + String(e?.message || e), 'var(--red)'); } catch (_) {}
        return;
      } finally {
        try { if (btn) { btn.textContent = '💾 Salvar Alterações'; btn.disabled = false; } } catch (_) {}
      }
    };
    window.salvarOfRapida._patchEditToPatch = true;
  }

  function patchAbrirModalOF() {
    if (typeof window.abrirModalOF !== 'function') return;
    if (window.abrirModalOF._patchToOfRapidaEdit) return;
    var orig = window.abrirModalOF;
    window.abrirModalOF = async function(ofId) {
      var sid = String(ofId || '').trim();
      if (!sid) return orig.apply(this, arguments);
      if (typeof window.abrirNovaOfRapida !== 'function') return orig.apply(this, arguments);

      try { window._ofRapidaEditandoId = sid; } catch (_) {}
      try { window.abrirNovaOfRapida(); } catch (_) { return orig.apply(this, arguments); }

      await new Promise(function(r) { setTimeout(r, 450); });
      var of = await fetchOf(sid);
      if (!of || of.error) return;

      var cliNome = String(of.cliente || of.cliNome || of.cliente_nome || '').trim();
      var produto = String(of.produto || of.prodDesc || of.descricao || '').trim();
      var empId = String(of.emp_id || of.empId || 'E1').trim() || 'E1';
      var vendId = String(of.vendedor_id || of.vendId || of.vend_id || '').trim();
      var qtd = of.quantidade ?? of.qtd ?? of.qtd_pedida ?? '';
      var vlunit = of.vl_unit ?? of.valor_unitario ?? of.vunit ?? '';
      var total = of.total ?? of.valor_total ?? of.valor_venda ?? '';
      var entrega = String(of.data_entrega || of.ent || '').slice(0, 10);
      var pedido = String(of.data_pedido || of.dia || of.created_at || '').slice(0, 10);
      var comp = of.caixa_comprimento ?? of.dim_comprimento ?? of.comprimento ?? '';
      var larg = of.caixa_largura ?? of.dim_largura ?? of.largura ?? '';
      var maquina = '';
      try {
        if (Array.isArray(of.maq) && of.maq.length) maquina = String(of.maq[0] || '').trim();
      } catch (_) {}
      maquina = maquina || String(of.maquina_agendada || of.maquina || of.maquina_atual || '').trim();

      try { setVal('of-r-cliente', cliNome); } catch (_) {}
      try { setVal('of-r-produto', produto); } catch (_) {}
      try { setVal('of-r-empresa', empId); } catch (_) {}
      try { setVal('of-r-vendedor', vendId); } catch (_) {}
      try { setVal('of-r-qtd', qtd); } catch (_) {}
      try { setVal('of-r-vlunit', vlunit); } catch (_) {}
      try { setVal('of-r-total', total); } catch (_) {}
      try { setVal('of-r-entrega', entrega); } catch (_) {}
      try { if (pedido) setVal('of-r-pedido', pedido); } catch (_) {}
      try { setVal('of-r-comp', comp); } catch (_) {}
      try { setVal('of-r-larg', larg); } catch (_) {}
      try { setVal('of-r-maquina', maquina); } catch (_) {}
      try { setChecked('of-r-urgente', !!(of.urgente === true || of.urg === true || of.urgente === 1 || of.urg === 1)); } catch (_) {}

      try {
        var numSpan = document.getElementById('of-r-numero');
        if (numSpan) numSpan.textContent = String(of.numero || of.of || sid.slice(0, 8));
      } catch (_) {}
      try { window._ofRapidaNumero = String(of.numero || of.of || '').trim(); } catch (_) {}

      try {
        var header = document.querySelector('#modal-of-rapida div[style*="font-weight:800"]');
        if (header) header.textContent = '✏️ Editar OF Rápida';
      } catch (_) {}
      try {
        var btn = document.getElementById('btn-salvar-of-rapida');
        if (btn) btn.textContent = '💾 Salvar Alterações';
      } catch (_) {}

      patchSalvarOfRapida();
    };
    window.abrirModalOF._patchToOfRapidaEdit = true;
  }

  function tick() {
    patchAbrirModalOF();
    patchSalvarOfRapida();
  }

  function startTickOfRapida() {
    try { tick(); } catch (_) {}
    if (window.__patchOfRapidaEditInterval) return;
    window.__patchOfRapidaEditInterval = setInterval(function() {
      try { tick(); } catch (_) {}
      try {
        var abriuOk = !!(window.abrirModalOF && window.abrirModalOF._patchToOfRapidaEdit);
        var salvarOk = !!(window.salvarOfRapida && window.salvarOfRapida._patchSalvarEdicaoOf);
        if (abriuOk && salvarOk && window.__patchOfRapidaEditInterval) {
          clearInterval(window.__patchOfRapidaEditInterval);
          window.__patchOfRapidaEditInterval = null;
        }
      } catch (_) {}
    }, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(startTickOfRapida, 400); });
  else { setTimeout(startTickOfRapida, 400); }
})();

(function patchOfRapidaCoresMultiItemAndSalvarEdicao() {
  function escTxt(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getToastFn() {
    if (typeof window.mostrarToast === 'function') return window.mostrarToast;
    if (typeof window.toast === 'function') return function(msg) { return window.toast(msg, /❌|erro/i.test(String(msg || '')) ? 'var(--red)' : 'var(--green)'); };
    return function(msg) { try { alert(msg); } catch (_) {} };
  }

  function getToken() {
    try { return String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || ''); } catch (_) { return ''; }
  }

  function getColorsSource() {
    var src = Array.isArray(window.coresDisponiveis) ? window.coresDisponiveis : (Array.isArray(window.CORES_IMPRESSAO) ? window.CORES_IMPRESSAO : []);
    if (src.length) return src;
    return [
      { id: 'amarelo', nome: 'Amarelo', hex: '#FFD700' },
      { id: 'azul-claro', nome: 'Azul Claro', hex: '#87CEEB' },
      { id: 'azul-escuro', nome: 'Azul Escuro', hex: '#00008B' },
      { id: 'branco', nome: 'Branco', hex: '#FFFFFF' },
      { id: 'dourado', nome: 'Dourado', hex: '#FFD700' },
      { id: 'laranja', nome: 'Laranja', hex: '#FFA500' },
      { id: 'marrom', nome: 'Marrom', hex: '#8B4513' },
      { id: 'preto', nome: 'Preto', hex: '#000000' },
      { id: 'rosa', nome: 'Rosa', hex: '#FFC0CB' },
      { id: 'roxo', nome: 'Roxo', hex: '#800080' },
      { id: 'verde', nome: 'Verde', hex: '#008000' },
      { id: 'verde-limao', nome: 'Verde Limão', hex: '#32CD32' },
      { id: 'vermelho', nome: 'Vermelho', hex: '#FF0000' },
      { id: 'sem-impressao', nome: 'Sem Impressão', hex: '#64748b' }
    ];
  }

  function getItemColorIds(idx) {
    if (!window.coresSelecionadasOFRapidaItens || typeof window.coresSelecionadasOFRapidaItens !== 'object') window.coresSelecionadasOFRapidaItens = {};
    if (!Array.isArray(window.coresSelecionadasOFRapidaItens[idx])) window.coresSelecionadasOFRapidaItens[idx] = [];
    return window.coresSelecionadasOFRapidaItens[idx];
  }

  function getItemIdxFromContainer(card, fallback) {
    return String(
      card && (
        card.getAttribute('data-item-idx')
        || card.getAttribute('data-item-index')
        || (card.dataset ? (card.dataset.itemIdx || card.dataset.itemIndex) : '')
        || fallback
      ) || fallback || ''
    ).trim();
  }

  function syncItemColorState(card, idx, rawValues) {
    if (!card) return [];
    idx = String(idx == null ? '' : idx).trim();
    if (!idx) idx = getItemIdxFromContainer(card, '');
    if (!idx) return [];
    var values = Array.isArray(rawValues) ? rawValues.slice() : [];
    if (!values.length) {
      try {
        values = Array.prototype.slice.call(
          card.querySelectorAll('input[type="checkbox"][data-cor]:checked, .cor-opcao input:checked, .cores-item input:checked')
        ).map(function(el) {
          return String(el && (el.value || (el.dataset && el.dataset.cor) || el.getAttribute('data-cor') || '') || '').trim();
        }).filter(Boolean);
      } catch (_) { values = []; }
    }
    window.coresSelecionadasOFRapidaItens = window.coresSelecionadasOFRapidaItens || {};
    window.coresSelecionadasOFRapidaItens[idx] = values;
    try { card.setAttribute('data-item-idx', idx); } catch (_) {}
    try { card.setAttribute('data-item-index', idx); } catch (_) {}
    try { card.dataset.coresSel = JSON.stringify(values); } catch (_) {}
    try { card.dataset.coresSelecionadas = JSON.stringify(values); } catch (_) {}
    try {
      var hidden = card.querySelector('input[type="hidden"][name*="cor"], input[type="hidden"][name*="cores"]');
      if (hidden) hidden.value = JSON.stringify((typeof window.getItemColorPayloadOFRapida === 'function') ? window.getItemColorPayloadOFRapida(idx) : []);
    } catch (_) {}
    try {
      var label = card.querySelector('.label-cores-count, .cores-label, [data-cores-label], .cores-selecionadas-label, [class*="cores-sel"], [data-cores-count], [id^="btnCoresLabelItemOFRapida_"]');
      if (label) label.textContent = values.length + ' cores selecionadas';
    } catch (_) {}
    return values;
  }

  function getItemColorPayload(idx) {
    var ids = getItemColorIds(idx).slice();
    var cores = getColorsSource();
    return ids.map(function(id) {
      var s = String(id || '').trim();
      var cor = cores.find(function(c) { return String(c && (c.id || c.nome) || '').trim() === s; }) || null;
      if (!cor) return null;
      return { id: cor.id || cor.nome, nome: cor.nome || cor.id, hex: cor.hex || cor.cor || '#64748b' };
    }).filter(Boolean);
  }
  try { window.getItemColorPayloadOFRapida = getItemColorPayload; } catch (_) {}

  window.renderSeletorCoresItemOFRapida = function(index) {
    var idx = String(index == null ? '' : index).trim();
    if (!idx) return;
    var el = document.getElementById('seletorCoresItemOFRapida_' + idx);
    if (!el) return;
    var selectedIds = getItemColorIds(idx);
    var cores = getColorsSource();
    el.innerHTML = cores.map(function(cor) {
      var id = String(cor && (cor.id || cor.nome) || '').trim();
      var nome = String(cor && (cor.nome || cor.id) || '').trim();
      var hex = String(cor && (cor.hex || cor.cor) || '#64748b').trim() || '#64748b';
      var on = selectedIds.indexOf(id) >= 0;
      var styleExtra = on ? ('border-color:' + escTxt(hex) + ';color:' + escTxt(hex) + ';background:' + escTxt(hex) + '18;') : '';
      return '<button type="button" class="btn-cor ' + (on ? 'selecionado' : '') + '" data-cor-id="' + escTxt(id) + '" style="' + styleExtra + '" onclick="toggleCorItemOFRapida(\'' + escTxt(idx) + '\',\'' + escTxt(id) + '\')" title="' + escTxt(nome) + '">' +
        '<span class="circulo-cor" style="background:' + escTxt(hex) + '"></span>' +
        '<span>' + escTxt(nome) + '</span>' +
      '</button>';
    }).join('');
    try {
      if (typeof window.atualizarBotaoCores === 'function') {
        window.atualizarBotaoCores(selectedIds, 'btnCoresLabelItemOFRapida_' + idx, 'resumoCoresItemOFRapida_' + idx);
      } else {
        var lbl = document.getElementById('btnCoresLabelItemOFRapida_' + idx);
      if (lbl) lbl.textContent = '🎨 ' + selectedIds.length + ' cores selecionadas';
      }
      var card = el.closest ? el.closest('.ofr-item-card, [data-item-idx], .item-adicional, .of-item') : null;
      if (card) {
        syncItemColorState(card, idx, selectedIds);
      }
    } catch (_) {}
  };

  window.toggleCorItemOFRapida = function(index, corId) {
    var idx = String(index == null ? '' : index).trim();
    var id = String(corId || '').trim();
    if (!idx || !id) return;
    var list = getItemColorIds(idx);
    var pos = list.indexOf(id);
    if (pos >= 0) list.splice(pos, 1);
    else list.push(id);
    window.renderSeletorCoresItemOFRapida(idx);
    try {
      var card = document.querySelector('.ofr-item-card[data-item-idx="' + idx + '"], [data-item-idx="' + idx + '"], [data-item-index="' + idx + '"]');
      if (card) syncItemColorState(card, idx, list);
    } catch (_) {}
  };

  if (typeof window.toggleDropdownCores === 'function' && !window.toggleDropdownCores._patchMultiItem) {
    var _origToggleDropdownCores = window.toggleDropdownCores;
    window.toggleDropdownCores = function(dropdownId, btnId) {
      try {
        var ddId = String(dropdownId || '').trim();
        var btn = String(btnId || '').trim();
        if (ddId.indexOf('dropdownCoresItemOFRapida_') === 0) {
          Array.prototype.slice.call(document.querySelectorAll('[id^="dropdownCoresItemOFRapida_"]')).forEach(function(el) {
            if (el && el.id !== ddId) el.style.display = 'none';
          });
        }
        return _origToggleDropdownCores.apply(this, [ddId, btn]);
      } catch (_) {
        return _origToggleDropdownCores.apply(this, arguments);
      }
    };
    window.toggleDropdownCores._patchMultiItem = true;
  }

  function ensureMultiItemColors() {
    Array.prototype.slice.call(document.querySelectorAll('.ofr-item-card, [data-item-idx], [data-item-index], .item-adicional, .item-of')).forEach(function(card, order) {
      var idx = getItemIdxFromContainer(card, order);
      if (!card) return;
      try { card.setAttribute('data-item-idx', idx); } catch (_) {}
      try { card.setAttribute('data-item-index', idx); } catch (_) {}
      var btn = card.querySelector('#btnAbrirCoresItemOFRapida_' + idx) || card.querySelector('[id^="btnAbrirCoresItemOFRapida_"]');
      var dd = card.querySelector('#dropdownCoresItemOFRapida_' + idx) || card.querySelector('[id^="dropdownCoresItemOFRapida_"]');
      var grid = card.querySelector('#seletorCoresItemOFRapida_' + idx) || card.querySelector('[id^="seletorCoresItemOFRapida_"]');
      var resumo = card.querySelector('#resumoCoresItemOFRapida_' + idx) || card.querySelector('[id^="resumoCoresItemOFRapida_"]');
      if (btn && btn.id !== 'btnAbrirCoresItemOFRapida_' + idx) btn.id = 'btnAbrirCoresItemOFRapida_' + idx;
      if (dd && dd.id !== 'dropdownCoresItemOFRapida_' + idx) dd.id = 'dropdownCoresItemOFRapida_' + idx;
      if (grid && grid.id !== 'seletorCoresItemOFRapida_' + idx) grid.id = 'seletorCoresItemOFRapida_' + idx;
      if (resumo && resumo.id !== 'resumoCoresItemOFRapida_' + idx) resumo.id = 'resumoCoresItemOFRapida_' + idx;
      var lbl = btn ? btn.querySelector('span[id^="btnCoresLabelItemOFRapida_"]') : null;
      if (lbl && lbl.id !== 'btnCoresLabelItemOFRapida_' + idx) lbl.id = 'btnCoresLabelItemOFRapida_' + idx;
      if (btn && btn.dataset.patchColorIdx !== idx) {
        btn.dataset.patchColorIdx = idx;
        btn.onclick = function(ev) {
          try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
          window.toggleDropdownCores('dropdownCoresItemOFRapida_' + idx, 'btnAbrirCoresItemOFRapida_' + idx);
        };
      }
      try { syncItemColorState(card, idx); } catch (_) {}
      try { window.renderSeletorCoresItemOFRapida(idx); } catch (_) {}
    });
  }

  if (!window.__patchColorOutsideClickBound) {
    window.__patchColorOutsideClickBound = true;
    document.addEventListener('click', function(ev) {
      var t = ev && ev.target;
      if (t && t.closest && t.closest('.cores-picker-wrapper')) return;
      Array.prototype.slice.call(document.querySelectorAll('[id^="dropdownCoresItemOFRapida_"]')).forEach(function(el) {
        if (el) el.style.display = 'none';
      });
    }, true);
  }
  if (!window.__patchColorItemDelegationBound) {
    window.__patchColorItemDelegationBound = true;
    document.addEventListener('click', function(ev) {
      try {
        var btn = ev && ev.target && (ev.target.closest ? ev.target.closest('[id^="seletorCoresItemOFRapida_"] .btn-cor') : null);
        if (!btn) return;
        var grid = btn.closest ? btn.closest('[id^="seletorCoresItemOFRapida_"]') : null;
        var idx = String(grid && grid.id || '').replace('seletorCoresItemOFRapida_', '').trim();
        var corId = String(btn.getAttribute('data-cor-id') || '').trim();
        if (!idx || !corId) return;
        try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
        if (typeof window.toggleCorItemOFRapida === 'function') window.toggleCorItemOFRapida(idx, corId);
      } catch (_) {}
    }, true);
    document.addEventListener('click', function(ev) {
      try {
        var cb = ev && ev.target && (ev.target.closest ? ev.target.closest('input[type="checkbox"][data-cor], .cor-opcao input, .cores-item input') : null);
        if (!cb) return;
        var card = cb.closest ? cb.closest('.ofr-item-card, [data-item-idx], [data-item-index], .item-adicional, .item-of') : null;
        if (!card) return;
        var idx = getItemIdxFromContainer(card, '');
        if (!idx) return;
        setTimeout(function() {
          try { syncItemColorState(card, idx); } catch (_) {}
        }, 0);
      } catch (_) {}
    }, true);
    document.addEventListener('change', function(ev) {
      try {
        var sel = ev && ev.target && (ev.target.matches ? (ev.target.matches('.cores-select, select[multiple], select[data-tipo="cores"], .cores-impressao-select, select[name*="cores"]') ? ev.target : null) : null);
        if (!sel) return;
        var card = sel.closest ? sel.closest('.ofr-item-card, [data-item-idx], [data-item-index], .item-adicional, .of-item') : null;
        if (!card) return;
        var idx = getItemIdxFromContainer(card, '');
        if (!idx) return;
        var values = Array.prototype.slice.call(sel.selectedOptions || []).map(function(opt) { return String(opt && opt.value || '').trim(); }).filter(Boolean);
        try { sel.dataset.coresSelecionadas = JSON.stringify(values); } catch (_) {}
        syncItemColorState(card, idx, values);
        if (typeof window.renderSeletorCoresItemOFRapida === 'function') window.renderSeletorCoresItemOFRapida(idx);
      } catch (_) {}
    }, true);
  }

  window.salvarEdicaoOf = async function() {
    var id = String(window._ofRapidaEditandoId || '').trim();
    var toast = getToastFn();
    if (!id) {
      try { console.warn('[salvarEdicaoOf] sem id de edição'); } catch (_) {}
      return;
    }

    var getV = function() {
      for (var i = 0; i < arguments.length; i += 1) {
        var sel = arguments[i];
        if (!sel) continue;
        var el = null;
        try { el = document.querySelector(sel); } catch (_) { el = null; }
        if (el && el.value !== undefined && el.value !== '') return el.value;
      }
      return null;
    };

    var body = { _allow_partial: '1' };
    var maquina = getV('#of-r-maquina', '#ofr-maquina', 'select[name="maquina"]', '[data-campo="maquina"]');
    var tipo = getV('#ofr-tipo', '#of-r-tipo', 'select[name="tipo_caixa"]', 'select[name="tipo"]');
    var produto = getV('#of-r-produto', '#ofr-produto', 'input[name="produto"]', '[data-campo="produto"]');
    var quantidade = getV('#of-r-qtd', '#ofr-quantidade', 'input[name="quantidade"]');
    var comprimento = getV('#of-r-comp', '#ofr-comp', 'input[name="comprimento"]');
    var largura = getV('#of-r-larg', '#ofr-larg', 'input[name="largura"]');
    var altura = getV('#ofr-alt', '#of-r-alt', 'input[name="altura"]');
    var entrega = getV('#of-r-entrega', '#ofr-entrega', 'input[name="data_entrega"]', 'input[type="date"]');
    var vlUnit = getV('#of-r-vlunit', '#ofr-vl-unit', 'input[name="vl_unit"]', 'input[name="valor_unitario"]');
    var obs = getV('#ofr-obs', '#of-r-obs', 'textarea[name="observacoes"]', 'textarea[name="obs"]');
    var cliId = getV('#ofr-cliente-id', '#of-r-cliente-id', 'input[name="cli_id"]');
    var vendId = getV('#of-r-vendedor', '#ofr-vendedor', 'select[name="vendedor_id"]');

    if (maquina) {
      body.maquina = maquina;
      body.maquina_agendada = maquina;
      body.maq = [maquina];
      body.fluxo_maquinas = [maquina];
    }
    if (tipo) body.tipo_caixa = tipo;
    if (produto) {
      body.produto = produto;
      body.descricao = produto;
      body.prodDesc = produto;
    }
    if (quantidade != null && quantidade !== '') {
      body.quantidade = Number(quantidade);
      body.qtd = Number(quantidade);
    }
    if (comprimento != null && comprimento !== '') {
      body.comprimento = Number(comprimento);
      body.caixa_comprimento = Number(comprimento);
      body.dim_comprimento = Number(comprimento);
    }
    if (largura != null && largura !== '') {
      body.largura = Number(largura);
      body.caixa_largura = Number(largura);
      body.dim_largura = Number(largura);
    }
    if (altura != null && altura !== '') {
      body.altura = Number(altura);
      body.caixa_altura = Number(altura);
      body.dim_altura = Number(altura);
    }
    if (entrega) {
      body.data_entrega = entrega;
      body.ent = entrega;
    }
    if (vlUnit != null && vlUnit !== '') {
      body.vl_unit = Number(vlUnit);
      body.valor_unitario = Number(vlUnit);
    }
    if (obs) {
      body.observacoes = obs;
      body.obs = obs;
    }
    if (cliId) {
      body.cli_id = cliId;
      body.cliente_id = cliId;
      body.cliId = cliId;
    }
    if (vendId) {
      body.vendedor_id = vendId;
      body.vendId = vendId;
      body.vend_id = vendId;
    }
    if ((body.vl_unit || body.valor_unitario) && (body.quantidade || body.qtd)) {
      var qty = Number(body.quantidade || body.qtd || 0) || 0;
      var unit = Number(body.vl_unit || body.valor_unitario || 0) || 0;
      if (qty > 0 && unit > 0) {
        body.valor_total = qty * unit;
        body.valor_venda = qty * unit;
      }
    }
    try {
      if (Array.isArray(window.coresSelecionadasOFRapida) && window.coresSelecionadasOFRapida.length && typeof window.coresPayloadFromSelecionadas === 'function') {
        body.cores_impressao = window.coresPayloadFromSelecionadas(window.coresSelecionadasOFRapida);
      }
    } catch (_) {}

    if (Object.keys(body).length === 1) {
      toast('⚠️ Nenhum campo preenchido para salvar');
      return;
    }

    try { console.log('[salvarEdicaoOf] enviando PATCH para OF', id, body); } catch (_) {}
    var btn = document.getElementById('btn-salvar-of-rapida');
    try { if (btn) { btn.disabled = true; btn.textContent = '⏳ Salvando...'; } } catch (_) {}
    try {
      var resp = await fetch('/api/ofs/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: Object.assign({ 'Content-Type': 'application/json' }, getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
        body: JSON.stringify(body)
      });
      var result = await resp.json().catch(function() { return {}; });
      try { console.log('[salvarEdicaoOf] resposta:', resp.status, result); } catch (_) {}
      if (!resp.ok || (result && result.ok === false)) {
        toast('❌ Erro ao salvar: ' + String(result && result.error || resp.status));
        return;
      }
      toast('✅ OF #' + String(window._ofRapidaEditandoNumero || id.substring(0, 8)) + ' salva!');
      window._ofRapidaEditandoId = null;
      window._ofRapidaEditandoNumero = null;
      try { document.getElementById('btn-salvar-edicao-of') && document.getElementById('btn-salvar-edicao-of').remove(); } catch (_) {}
      try {
        var btnOrig = document.querySelector('#modal-of-rapida button[type="submit"], .btn-salvar-of');
        if (btnOrig) btnOrig.style.display = '';
      } catch (_) {}
      var btnFechar = null;
      try {
        btnFechar = document.querySelector('#modal-of-rapida .modal-close, [onclick*="fecharModalOfRapida"], [onclick*="fecharNovaOf"], [onclick*="fecharOFRapida"]');
      } catch (_) {}
      if (btnFechar) {
        try { btnFechar.click(); } catch (_) {}
      } else {
        try {
          var modal = document.getElementById('modal-of-rapida') || document.getElementById('modal-nova-of-rapida') || document.getElementById('modal-of-rapida-ov');
          if (modal) modal.style.display = 'none';
        } catch (_) {}
      }
      setTimeout(function() {
        try { if (window.carregarOFs) window.carregarOFs(true); else if (window.renderPCP) window.renderPCP(); } catch (_) {}
      }, 300);
    } catch (e) {
      try { console.error('[salvarEdicaoOf]', e); } catch (_) {}
      toast('❌ Erro de rede: ' + String(e && e.message || e));
    } finally {
      try { if (btn) { btn.disabled = false; btn.textContent = '💾 Salvar Alterações'; } } catch (_) {}
    }
  };

  function wrapSalvarOfRapidaEdicao() {
    if (typeof window.salvarOfRapida !== 'function') return;
    if (window.salvarOfRapida._patchSalvarEdicaoOf) return;
    var orig = window.salvarOfRapida;
    window.salvarOfRapida = async function() {
      if (String(window._ofRapidaEditandoId || '').trim()) return window.salvarEdicaoOf();
      return orig.apply(this, arguments);
    };
    window.salvarOfRapida._patchSalvarEdicaoOf = true;
  }

  function patchAbrirModalNumero() {
    if (typeof window.abrirModalOF !== 'function') return;
    if (window.abrirModalOF._patchNumeroEdicao) return;
    var orig = window.abrirModalOF;
    window.abrirModalOF = async function(ofId) {
      var r = await orig.apply(this, arguments);
      try {
        var span = document.getElementById('of-r-numero');
        if (span) window._ofRapidaEditandoNumero = String(span.textContent || '').trim() || null;
      } catch (_) {}
      return r;
    };
    window.abrirModalOF._patchNumeroEdicao = true;
  }

  function tick() {
    ensureMultiItemColors();
    wrapSalvarOfRapidaEdicao();
    patchAbrirModalNumero();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tick, 300); setInterval(tick, 1200); });
  } else {
    setTimeout(tick, 300);
    setInterval(tick, 1200);
  }
})();

(function patchClienteValidoNovaOf() {
  function normClienteNome(v) {
    var s = String(v == null ? '' : v).trim();
    if (!s) return '';
    s = s
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return s;
  }

  function clientesRef() {
    return Array.isArray(window.CLIENTES) ? window.CLIENTES : (Array.isArray(window.clientes) ? window.clientes : []);
  }

  function acharClienteRobusto(nome) {
    var alvo = normClienteNome(nome);
    if (!alvo) return null;
    var lista = clientesRef();
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      var base = c && (c.nome || c.rs || c.razao_social || c.razao || '');
      if (normClienteNome(base) === alvo) return c;
    }
    for (var j = 0; j < lista.length; j++) {
      var c2 = lista[j];
      var hay = [c2 && c2.nome, c2 && c2.rs, c2 && c2.razao_social, c2 && c2.cidade, c2 && c2.tel, c2 && c2.telefone, c2 && c2.cnpj]
        .filter(Boolean)
        .map(normClienteNome)
        .join(' | ');
      if (hay && hay.indexOf(alvo) !== -1) return c2;
    }
    return null;
  }

  function syncClienteNovaOf(input) {
    var el = input || document.getElementById('f-cli-search');
    if (!el) return null;
    var cli = acharClienteRobusto(el.value);
    if (cli && cli.id) {
      el.dataset.clienteId = String(cli.id);
      el.dataset.clienteNome = String(cli.nome || cli.rs || cli.razao_social || cli.razao || el.value || '').trim();
      try {
        var sel = document.getElementById('f-cli');
        if (sel) sel.value = String(cli.id);
      } catch (_) {}
      try {
        var hid = document.getElementById('f-cli-id');
        if (hid) hid.value = String(cli.id);
      } catch (_) {}
      try { if (typeof window.ofCliChange === 'function') window.ofCliChange(); } catch (_) {}
      return cli;
    }
    delete el.dataset.clienteId;
    delete el.dataset.clienteNome;
    return null;
  }

  function bindClienteNovaOf() {
    var el = document.getElementById('f-cli-search');
    if (!el || el.dataset.patchClienteValidoNovaOf === '1') return;
    el.dataset.patchClienteValidoNovaOf = '1';
    ['input', 'change', 'blur'].forEach(function(evt) {
      el.addEventListener(evt, function() { syncClienteNovaOf(el); }, true);
    });
    setTimeout(function() { syncClienteNovaOf(el); }, 0);
  }

  function patchResolveCliId() {
    var orig = window.ofResolveCliIdFromModal;
    if (typeof orig !== 'function' || orig._patchClienteValidoNovaOf) return;
    var wrapped = function() {
      try {
        var el = document.getElementById('f-cli-search');
        if (el && el.dataset && el.dataset.clienteId) return String(el.dataset.clienteId || '').trim();
      } catch (_) {}
      var r = orig.apply(this, arguments);
      try {
        var rid = String(r || '').trim();
        var inp = document.getElementById('f-cli-search');
        if (rid && inp && inp.dataset) inp.dataset.clienteId = rid;
      } catch (_) {}
      return r;
    };
    wrapped._patchClienteValidoNovaOf = true;
    window.ofResolveCliIdFromModal = wrapped;
  }

  function patchOfCliChange() {
    var orig = window.ofCliChange;
    if (typeof orig !== 'function' || orig._patchClienteValidoNovaOf) return;
    var wrapped = function() {
      var r = orig.apply(this, arguments);
      try {
        var sel = document.getElementById('f-cli');
        var id = sel ? String(sel.value || '').trim() : '';
        var inp = document.getElementById('f-cli-search');
        if (inp && inp.dataset) {
          if (id) {
            inp.dataset.clienteId = id;
            try {
              if (typeof window.getCli === 'function') {
                var c = window.getCli(id);
                if (c && (c.nome || c.rs)) inp.dataset.clienteNome = String(c.nome || c.rs || '').trim();
              }
            } catch (_) {}
          } else {
            delete inp.dataset.clienteId;
            delete inp.dataset.clienteNome;
          }
        }
      } catch (_) {}
      return r;
    };
    wrapped._patchClienteValidoNovaOf = true;
    window.ofCliChange = wrapped;
  }

  function patchApiFetchForCliId() {
    var orig = window.apiFetch;
    if (typeof orig !== 'function' || orig._patchClienteValidoNovaOf) return;
    var wrapped = function(url, opts) {
      try {
        var u = String(url || '');
        var m = String((opts && opts.method) || 'GET').toUpperCase();
        if ((m === 'POST' || m === 'PATCH') && u.indexOf('/api/ofs') !== -1 && opts) {
          var el = document.getElementById('f-cli-search') || document.getElementById('of-r-cliente');
          var cliId = el && el.dataset ? String(el.dataset.clienteId || '').trim() : '';
          var cliNome = el && el.dataset ? String(el.dataset.clienteNome || '').trim() : '';
          if (!cliNome && el) cliNome = String(el.value || '').trim();
          if (cliId && opts.body) {
            if (typeof opts.body === 'string') {
              try {
                var o = JSON.parse(opts.body);
                if (o && typeof o === 'object') {
                  if (!o.cliId) o.cliId = cliId;
                  if (!o.cli_id) o.cli_id = cliId;
                  if (!o.cliente_id) o.cliente_id = cliId;
                  if (cliNome) {
                    if (!o.cliente_nome) o.cliente_nome = cliNome;
                    if (!o.cliNome) o.cliNome = cliNome;
                  }
                  if (Array.isArray(o.itens) && typeof window.getItemColorPayloadOFRapida === 'function') {
                    o.itens = o.itens.map(function(item, idx) {
                      var payloadCores = window.getItemColorPayloadOFRapida(String(idx));
                      return Object.assign({}, item || {}, { cores_impressao: payloadCores });
                    });
                  }
                  opts.body = JSON.stringify(o);
                }
              } catch (_) {}
            } else if (typeof opts.body === 'object') {
              if (!opts.body.cliId) opts.body.cliId = cliId;
              if (!opts.body.cli_id) opts.body.cli_id = cliId;
              if (!opts.body.cliente_id) opts.body.cliente_id = cliId;
              if (cliNome) {
                if (!opts.body.cliente_nome) opts.body.cliente_nome = cliNome;
                if (!opts.body.cliNome) opts.body.cliNome = cliNome;
              }
              if (Array.isArray(opts.body.itens) && typeof window.getItemColorPayloadOFRapida === 'function') {
                opts.body.itens = opts.body.itens.map(function(item, idx) {
                  var payloadCores = window.getItemColorPayloadOFRapida(String(idx));
                  return Object.assign({}, item || {}, { cores_impressao: payloadCores });
                });
              }
            }
          }
        }
      } catch (_) {}
      return orig.apply(this, arguments);
    };
    wrapped._patchClienteValidoNovaOf = true;
    window.apiFetch = wrapped;
  }

  function tick() {
    try { bindClienteNovaOf(); } catch (_) {}
    try { patchResolveCliId(); } catch (_) {}
    try { patchOfCliChange(); } catch (_) {}
    try { patchApiFetchForCliId(); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 250);
      setInterval(tick, 1200);
    });
  } else {
    setTimeout(tick, 250);
    setInterval(tick, 1200);
  }
})();

(function patchFacasNumeroCategoria() {
  function authH() {
    var token = '';
    try { token = String(localStorage.getItem('token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function ensureNormalizeFaca() {
    var orig = window.normalizeFaca;
    if (typeof orig !== 'function' || orig._patchFacasNumeroCategoria) return;
    var wrapped = function(r) {
      var out = orig.apply(this, arguments) || {};
      try { out.numero = r && (r.numero || r.num || r.numeracao) ? String(r.numero || r.num || r.numeracao) : (out.numero || ''); } catch (_) {}
      try { out.categoria = r && (r.categoria || r.cat) ? String(r.categoria || r.cat) : (out.categoria || ''); } catch (_) {}
      return out;
    };
    wrapped._patchFacasNumeroCategoria = true;
    window.normalizeFaca = wrapped;
  }

  function fetchCategorias() {
    return fetch('/api/facas_categorias', { headers: authH() })
      .then(function(r) { return r.json(); })
      .then(function(j) { return (j && j.ok && Array.isArray(j.data)) ? j.data : []; })
      .catch(function() { return []; });
  }

  function fillCategoriaSelect(sel, cats) {
    if (!sel) return;
    var cur = String(sel.value || '');
    sel.innerHTML = '<option value="">Todas</option>';
    (cats || []).forEach(function(c) {
      var nome = String((c && (c.nome || c.name)) || '').trim();
      if (!nome) return;
      var opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      sel.appendChild(opt);
    });
    sel.value = cur;
  }

  function loadAndBindCategorias() {
    if (window.__facasCatsLoading) return;
    window.__facasCatsLoading = true;
    fetchCategorias().then(function(cats) {
      window.__FACAS_CATEGORIAS = cats || [];
      fillCategoriaSelect(document.getElementById('facas1-cat-filtro'), cats);
      fillCategoriaSelect(document.getElementById('facas2-cat-filtro'), cats);
      fillCategoriaSelect(document.getElementById('fa1-categoria'), cats);
    }).finally(function() { window.__facasCatsLoading = false; });
  }

  function ensureFacasToolbar(pageId, renderFnName) {
    var page = document.getElementById(pageId);
    if (!page) return;
    var bar = page.querySelector('.ptoolbar');
    if (!bar || bar.dataset.patchFacasNumeroCategoria === '1') return;
    bar.dataset.patchFacasNumeroCategoria = '1';

    var busca = bar.querySelector('input[id$="-busca"]');
    if (!busca) return;

    var num = document.createElement('input');
    num.id = pageId === 'page-facas1' ? 'facas1-num-busca' : 'facas2-num-busca';
    num.placeholder = '🔢 Número...';
    num.style.width = '140px';
    num.oninput = function() { try { if (typeof window[renderFnName] === 'function') window[renderFnName](); } catch (_) {} };

    var sel = document.createElement('select');
    sel.id = pageId === 'page-facas1' ? 'facas1-cat-filtro' : 'facas2-cat-filtro';
    sel.style.width = '160px';
    sel.style.background = 'var(--s2)';
    sel.style.border = '1px solid var(--border)';
    sel.style.color = 'var(--text)';
    sel.style.borderRadius = '8px';
    sel.style.padding = '7px 10px';
    sel.style.fontSize = '.85rem';
    sel.onchange = function() { try { if (typeof window[renderFnName] === 'function') window[renderFnName](); } catch (_) {} };

    var btnCat = document.createElement('button');
    btnCat.className = 'btn btn-ghost btn-sm';
    btnCat.type = 'button';
    btnCat.textContent = '+ Categoria';
    btnCat.onclick = function() {
      var nome = String(prompt('Nome da categoria:') || '').trim();
      if (!nome) return;
      fetch('/api/facas_categorias', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authH()),
        body: JSON.stringify({ nome: nome })
      })
        .then(function(r) { return r.json(); })
        .then(function(j) {
          if (!j || !j.ok) throw new Error((j && j.error) ? j.error : 'Falha ao criar categoria');
          loadAndBindCategorias();
          try { if (typeof window.toast === 'function') window.toast('✓ Categoria criada', 'var(--green)'); } catch (_) {}
        })
        .catch(function(e) { try { if (typeof window.toast === 'function') window.toast(String(e && e.message ? e.message : e), 'var(--red)'); } catch (_) {} });
    };

    if (busca.nextSibling) bar.insertBefore(num, busca.nextSibling);
    else bar.appendChild(num);
    bar.insertBefore(sel, num.nextSibling);
    bar.insertBefore(btnCat, sel.nextSibling);

    loadAndBindCategorias();
  }

  function ensureFacasTableHeaders() {
    [['page-facas1', 'facas1-body'], ['page-facas2', 'facas2-body']].forEach(function(pair) {
      var page = document.getElementById(pair[0]);
      if (!page) return;
      var tbody = document.getElementById(pair[1]);
      if (!tbody) return;
      var table = tbody.closest ? tbody.closest('table') : null;
      var tr = table ? table.querySelector('thead tr') : null;
      if (!tr || tr.dataset.patchFacasNumeroCategoria === '1') return;
      tr.dataset.patchFacasNumeroCategoria = '1';
      var ths = tr.querySelectorAll('th');
      if (!ths || ths.length < 2) return;
      var thFoto = ths[0];
      var thNome = ths[1];
      if (thNome && String(thNome.textContent || '').toUpperCase().indexOf('NOME') !== -1) {
        var thNum = document.createElement('th');
        thNum.textContent = 'NÚMERO';
        thNum.style.cssText = thNome.style.cssText;
        var thCat = document.createElement('th');
        thCat.textContent = 'CATEGORIA';
        thCat.style.cssText = thNome.style.cssText;
        tr.insertBefore(thCat, thNome);
        tr.insertBefore(thNum, thCat);
        try { table.style.minWidth = '980px'; } catch (_) {}
      }
    });
  }

  function patchRenderFacas(fnName, bodyId, buscaId, numBuscaId, catSelId) {
    var orig = window[fnName];
    if (typeof orig !== 'function' || orig._patchFacasNumeroCategoria) return;
    var wrapped = function() {
      ensureFacasTableHeaders();
      var body = document.getElementById(bodyId);
      if (!body) return orig.apply(this, arguments);
      var busca = String(((document.getElementById(buscaId) || {}).value || '')).toLowerCase();
      var buscaNum = String(((document.getElementById(numBuscaId) || {}).value || '')).toLowerCase().trim();
      var cat = String(((document.getElementById(catSelId) || {}).value || '')).trim();
      var lista = Array.isArray(window.FACAS) ? window.FACAS : [];
      if (busca) {
        lista = lista.filter(function(f) {
          var hay = String((f.nome || '') + (f.obs || '') + (f.medidas || '') + ((f.maquinas || []).join(' ')) + ((f.clientes || []).join(' '))).toLowerCase();
          return hay.indexOf(busca) !== -1;
        });
      }
      if (buscaNum) {
        lista = lista.filter(function(f) { return String(f.numero || '').toLowerCase().indexOf(buscaNum) !== -1; });
      }
      if (cat) {
        lista = lista.filter(function(f) { return String(f.categoria || '').trim() === cat; });
      }
      if (!lista.length) {
        body.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text3)">Nenhuma faca cadastrada — clique em ＋ Nova Faca</td></tr>';
        return;
      }
      body.innerHTML = lista.map(function(f) {
        var cliNomes = (f.clientes || []).map(function(id) { var c = (Array.isArray(window.CLIENTES) ? window.CLIENTES : []).find(function(x) { return x.id === id; }); return c ? c.nome : id; }).join(', ');
        var maqStr = (f.maquinas || []).join(', ') || '—';
        var thumb = (typeof window.renderFotoItem === 'function') ? window.renderFotoItem(f.foto, f.nome) : '';
        var num = String(f.numero || '').trim() || '—';
        var catTxt = String(f.categoria || '').trim() || '—';
        var nomeTxt = String(f.nome || '—');
        var medidasTxt = String(f.medidas || '—');
        var valorTxt = f.valor ? ('R$ ' + Number(f.valor).toFixed(2)) : '—';
        var esc = (typeof window.escAttr === 'function') ? window.escAttr : function(s) { return String(s || '').replace(/"/g, '&quot;'); };
        return '<tr>' +
          '<td style="padding:8px 10px;border:1px solid var(--border)">' + thumb + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem;color:var(--text2)">' + esc(num) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem">' + esc(catTxt) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-weight:600">' + esc(nomeTxt) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem;color:var(--text2)">' + esc(medidasTxt) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem">' + esc(maqStr) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);font-size:.78rem">' + esc(cliNomes || '—') + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);text-align:right;color:var(--green)">' + esc(valorTxt) + '</td>' +
          '<td style="padding:8px 10px;border:1px solid var(--border);text-align:center">' +
            '<button class="btn btn-ghost btn-sm" data-pin-type="faca" data-pin-id="' + esc(f.id) + '" onclick="window.__patchOpenPinModal && window.__patchOpenPinModal(\'faca\',\'' + esc(f.id) + '\',\'Faca\')" style="font-size:.68rem;margin-right:4px;' + (window.__patchPinBtnStyleAttr ? window.__patchPinBtnStyleAttr('faca', String(f.id || '')) : '') + '">📌</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="abrirModalFaca1(\'' + esc(f.id) + '\')" style="font-size:.68rem;margin-right:4px">✏</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="abrirModalQRCodeEstoque(\'faca\',\'' + esc(f.id) + '\',\'' + esc(f.nome || '') + '\')" style="font-size:.68rem;margin-right:4px">🔳</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="excluirFaca1(\'' + esc(f.id) + '\')" style="font-size:.68rem;color:var(--red)">🗑</button>' +
          '</td>' +
        '</tr>';
      }).join('');
    };
    wrapped._patchFacasNumeroCategoria = true;
    window[fnName] = wrapped;
  }

  function ensureModalFields() {
    var modal = document.getElementById('modal-faca1');
    if (!modal || modal.dataset.patchFacasNumeroCategoria === '1') return;
    var grid = modal.querySelector('.modal-body div[style*="grid-template-columns"]');
    var nome = document.getElementById('fa1-nome');
    if (!grid || !nome) return;
    modal.dataset.patchFacasNumeroCategoria = '1';

    var wrapNum = document.createElement('div');
    wrapNum.className = 'mf';
    wrapNum.innerHTML = '<label>NÚMERO</label><input id="fa1-numero" placeholder="Ex: F001">';

    var wrapCat = document.createElement('div');
    wrapCat.className = 'mf';
    wrapCat.innerHTML = '<label>CATEGORIA</label><select id="fa1-categoria" style="background:var(--s2);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 8px;font-size:.85rem;font-family:var(--font);width:100%"><option value="">Selecionar...</option></select>';

    var ref = document.getElementById('fa1-medidas');
    if (ref && ref.parentElement && ref.parentElement.nextSibling) {
      grid.insertBefore(wrapNum, ref.parentElement.nextSibling);
      grid.insertBefore(wrapCat, wrapNum.nextSibling);
    } else {
      grid.appendChild(wrapNum);
      grid.appendChild(wrapCat);
    }

    loadAndBindCategorias();
  }

  function patchAbrirModalFaca1() {
    var orig = window.abrirModalFaca1;
    if (typeof orig !== 'function' || orig._patchFacasNumeroCategoria) return;
    var wrapped = function(id) {
      var r = orig.apply(this, arguments);
      try { ensureModalFields(); } catch (_) {}
      try {
        var f = id && Array.isArray(window.FACAS) ? window.FACAS.find(function(x) { return x.id === id; }) : null;
        var numEl = document.getElementById('fa1-numero');
        if (numEl) numEl.value = f ? (f.numero || '') : '';
        var catEl = document.getElementById('fa1-categoria');
        if (catEl) catEl.value = f ? (f.categoria || '') : '';
      } catch (_) {}
      return r;
    };
    wrapped._patchFacasNumeroCategoria = true;
    window.abrirModalFaca1 = wrapped;
  }

  function patchApiForFacas() {
    var origFetch = window.fetch;
    if (typeof origFetch !== 'function' || origFetch._patchFacasNumeroCategoria) return;
    var wrapped = function(url, opts) {
      try {
        var u = String(url || '');
        var m = String((opts && opts.method) || 'GET').toUpperCase();
        if ((m === 'POST' || m === 'PUT') && u.indexOf('/facas_estoque') !== -1 && opts && opts.body && typeof opts.body === 'string') {
          try {
            var o = JSON.parse(opts.body);
            if (o && typeof o === 'object') {
              var num = String((document.getElementById('fa1-numero') || {}).value || '').trim();
              var cat = String((document.getElementById('fa1-categoria') || {}).value || '').trim();
              if (num) o.numero = num;
              if (cat) o.categoria = cat;
              opts.body = JSON.stringify(o);
            }
          } catch (_) {}
        }
      } catch (_) {}
      return origFetch.apply(this, arguments);
    };
    wrapped._patchFacasNumeroCategoria = true;
    window.fetch = wrapped;
  }

  function tick() {
    try { ensureNormalizeFaca(); } catch (_) {}
    try { ensureFacasToolbar('page-facas1', 'renderFacas1'); } catch (_) {}
    try { ensureFacasToolbar('page-facas2', 'renderFacas2'); } catch (_) {}
    try { patchRenderFacas('renderFacas1', 'facas1-body', 'facas1-busca', 'facas1-num-busca', 'facas1-cat-filtro'); } catch (_) {}
    try { patchRenderFacas('renderFacas2', 'facas2-body', 'facas2-busca', 'facas2-num-busca', 'facas2-cat-filtro'); } catch (_) {}
    try { patchAbrirModalFaca1(); } catch (_) {}
    try { ensureModalFields(); } catch (_) {}
    try { patchApiForFacas(); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 350);
      setInterval(tick, 1500);
    });
  } else {
    setTimeout(tick, 350);
    setInterval(tick, 1500);
  }
})();

(function patchClientesUX() {
  function injectCss() {
    if (document.getElementById('patch-clientes-css')) return;
    var cssClientes =
      '/* Container dos botões do topo de clientes */\n' +
      '.clientes-acoes-topo,\n' +
      '#clientes-toolbar,\n' +
      '[data-tela="clientes"] .toolbar,\n' +
      '.clientes-header-buttons {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  gap: 8px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '}\n' +
      '\n' +
      '/* Topo real da tela de clientes */\n' +
      '#page-clientes .ptoolbar {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  justify-content: flex-end !important;\n' +
      '  gap: 8px !important;\n' +
      '  padding: 8px 16px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '}\n' +
      '#page-clientes .ptoolbar > div[style*="flex:1"] {\n' +
      '  flex: 1 1 auto !important;\n' +
      '}\n' +
      '#page-clientes .cli-quick-filters {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  gap: 6px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '  margin: 0 !important;\n' +
      '}\n' +
      '#page-clientes .cli-quick-filters button,\n' +
      '#page-clientes .cli-quick-filters select,\n' +
      '#page-clientes [data-quick-filter] {\n' +
      '  opacity: 1 !important;\n' +
      '  pointer-events: auto !important;\n' +
      '}\n' +
      '#page-clientes .ptoolbar button {\n' +
      '  opacity: 1 !important;\n' +
      '  pointer-events: auto !important;\n' +
      '}\n' +
      '\n' +
      '/* Filtros de busca alinhados */\n' +
      '.clientes-filtros,\n' +
      '#clientes-filtros {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  gap: 8px !important;\n' +
      '  padding: 8px 16px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '}\n' +
      '\n' +
      '.cli-card {\n' +
      '  display: flex !important;\n' +
      '  flex-direction: column !important;\n' +
      '  height: 100% !important;\n' +
      '  cursor: pointer !important;\n' +
      '  transition: box-shadow 0.2s ease !important;\n' +
      '}\n' +
      '\n' +
      '.cli-card:hover {\n' +
      '  box-shadow: 0 4px 20px rgba(79,142,247,0.2) !important;\n' +
      '}\n' +
      '\n' +
      '.cli-card > div:last-child,\n' +
      '.cli-card .cli-acoes,\n' +
      '.cliente-card .acoes,\n' +
      '.cliente-card-footer,\n' +
      '.cliente-acoes {\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  gap: 6px !important;\n' +
      '  flex-wrap: wrap !important;\n' +
      '  margin-top: auto !important;\n' +
      '  opacity: 1 !important;\n' +
      '  pointer-events: auto !important;\n' +
      '}\n' +
      '\n' +
      '.cli-card button:last-of-type { margin-top: auto !important; }\n' +
      '\n' +
      '.cli-card button,\n' +
      '.cliente-card .acoes button,\n' +
      '.cliente-card-footer button,\n' +
      '.cliente-acoes button {\n' +
      '  padding: 4px 10px !important;\n' +
      '  font-size: 12px !important;\n' +
      '  border-radius: 6px !important;\n' +
      '  white-space: nowrap !important;\n' +
      '  flex: 1 !important;\n' +
      '  min-width: 60px !important;\n' +
      '  text-align: center !important;\n' +
      '  display: inline-flex !important;\n' +
      '  align-items: center !important;\n' +
      '}\n';
    var styleClientes = document.createElement('style');
    styleClientes.id = 'patch-clientes-css';
    styleClientes.textContent = cssClientes;
    (document.head || document.documentElement).appendChild(styleClientes);
  }

  function looksLikeClientesModal(modal) {
    if (!modal) return false;
    try {
      return !!modal.querySelector('input[name="estado"], #f-estado, input[placeholder="SC"], input[placeholder="UF"], input[name="uf"]');
    } catch (_) {
      return false;
    }
  }

  function mapEstadoToUfInModal(modal) {
    if (!looksLikeClientesModal(modal)) return;
    try {
      var inputEstado = modal.querySelector('input[name="estado"], #f-estado, input[placeholder="SC"]');
      if (inputEstado) {
        if (String(inputEstado.name || '').toLowerCase() === 'estado') inputEstado.name = 'uf';
        if (String(inputEstado.id || '').toLowerCase() === 'f-estado') inputEstado.id = 'f-uf';
      }
    } catch (_) {}
  }

  function clientesModalLike(modal) {
    if (!modal) return false;
    try {
      return !!modal.querySelector('#cl-nome, #cli-nome, #modal-cli, input[id*="cli-"], input[id*="cl-"]');
    } catch (_) {
      return false;
    }
  }

  function addClienteToArrays(novoCliente) {
    if (!novoCliente || !novoCliente.id) return;
    var id = String(novoCliente.id || '').trim();
    if (!id) return;
    var normalizado = novoCliente;
    try { if (typeof normalizeCli === 'function') normalizado = normalizeCli(novoCliente); } catch (_) {}
    var apply = function(arrName, getter) {
      try {
        var arr = getter();
        if (!Array.isArray(arr)) return;
        var existe = arr.find(function(c) { return String(c && c.id || '').trim() === id; });
        if (!existe) arr.push(normalizado);
      } catch (_) {}
    };
    apply('CLIENTES', function() { return (typeof CLIENTES !== 'undefined') ? CLIENTES : null; });
    apply('_CLIENTES', function() { return window._CLIENTES; });
    try {
      if (Array.isArray(window.CLIENTES)) {
        var existeW = window.CLIENTES.find(function(c) { return String(c && c.id || '').trim() === id; });
        if (!existeW) window.CLIENTES.push(normalizado);
      }
    } catch (_) {}
  }

  function getClientesListaAtual() {
    try {
      if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES) && CLIENTES.length) return CLIENTES;
    } catch (_) {}
    try {
      if (Array.isArray(window.CLIENTES) && window.CLIENTES.length) return window.CLIENTES;
    } catch (_) {}
    try {
      if (Array.isArray(window._CLIENTES) && window._CLIENTES.length) return window._CLIENTES;
    } catch (_) {}
    return [];
  }

  async function _carregarTodosClientes() {
    try {
      var token = '';
      try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
      var resp = await fetch('/api/clientes?limit=2000&order=created_at&dir=desc&t=' + Date.now(), {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      var json = await resp.json().catch(function() { return null; });
      if (json && json.ok && Array.isArray(json.data) && json.data.length) {
        try {
          if (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) {
            CLIENTES.length = 0;
            json.data.forEach(function(c) { CLIENTES.push(c); });
          }
        } catch (_) {}
        try { window.CLIENTES = json.data; } catch (_) {}
        try { window._CLIENTES = json.data; } catch (_) {}
        console.log('[PATCH] clientes carregados:', json.data.length);
        if (typeof renderClientes === 'function') renderClientes();
      }
    } catch (e) {
      try { console.error('[PATCH] carregarTodosClientes', e); } catch (_) {}
    }
  }

  function findClienteById(id) {
    var alvo = String(id || '').trim();
    if (!alvo) return null;
    var lista = getClientesListaAtual();
    for (var i = 0; i < lista.length; i++) {
      if (String(lista[i] && lista[i].id || '').trim() === alvo) return lista[i];
    }
    return null;
  }

  function getMesclaDuplicadoIds() {
    try {
      var nodes = document.querySelectorAll('#mescla-duplicados input.mescla-duplicado-id');
      return Array.prototype.map.call(nodes, function(el) { return String(el.value || '').trim(); }).filter(Boolean);
    } catch (_) {
      return [];
    }
  }

  function renderMesclaPreview() {
    try {
      var principal = findClienteById(document.getElementById('mescla-principal-id') && document.getElementById('mescla-principal-id').value);
      var duplicados = getMesclaDuplicadoIds().map(findClienteById).filter(Boolean);
      var box = document.getElementById('mescla-preview');
      if (!box) return;
      box.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px">' +
            '<div style="font-weight:700;color:var(--text);margin-bottom:8px">Cliente Principal</div>' +
            (principal
              ? '<div style="color:var(--text);font-size:13px">' + String(principal.nome || '-') + '</div>' +
                '<div style="color:var(--text2);font-size:12px;margin-top:4px">' + String(principal.cnpj || principal.documento || '-') + '</div>'
              : '<div style="color:var(--text2);font-size:12px">Selecione o cliente principal</div>') +
          '</div>' +
          '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px">' +
            '<div style="font-weight:700;color:var(--text);margin-bottom:8px">Clientes a Mesclar</div>' +
            (duplicados.length
              ? duplicados.map(function(duplicado) {
                  return '<div style="padding:6px 0;border-top:1px solid rgba(255,255,255,0.06)">' +
                    '<div style="color:var(--text);font-size:13px">' + String(duplicado.nome || '-') + '</div>' +
                    '<div style="color:var(--text2);font-size:12px;margin-top:4px">' + String(duplicado.cnpj || duplicado.documento || '-') + '</div>' +
                  '</div>';
                }).join('')
              : '<div style="color:var(--text2);font-size:12px">Selecione ao menos um cliente duplicado</div>') +
          '</div>' +
        '</div>';
    } catch (_) {}
  }

  function syncMesclaField(input, hidden, listId) {
    try {
      if (!input || !hidden) return;
      var list = document.getElementById(listId);
      var val = String(input.value || '').trim();
      var opt = list ? Array.prototype.find.call(list.options || [], function(o) { return String(o.value || '').trim() === val; }) : null;
      hidden.value = opt ? String(opt.getAttribute('data-id') || '') : '';
      renderMesclaPreview();
    } catch (_) {}
  }

  function bindMesclaField(input, hidden, listId) {
    if (!input || input.dataset.patchMesclaBind === '1') return;
    input.dataset.patchMesclaBind = '1';
    ['input', 'change'].forEach(function(evt) {
      input.addEventListener(evt, function() { syncMesclaField(input, hidden, listId); });
    });
  }

  function addMesclaDuplicadoRow() {
    try {
      var wrap = document.getElementById('mescla-duplicados');
      if (!wrap) return;
      var idx = wrap.querySelectorAll('.mescla-duplicado-row').length + 1;
      var row = document.createElement('div');
      row.className = 'mescla-duplicado-row';
      row.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:8px';
      row.innerHTML =
        '<div>' +
          '<label style="display:block;color:var(--text2);font-size:12px;margin-bottom:4px">CLIENTE DUPLICADO ' + idx + '</label>' +
          '<input class="mescla-duplicado-busca" list="mescla-clientes-lista" placeholder="Buscar cliente..." style="width:100%;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text)">' +
          '<input type="hidden" class="mescla-duplicado-id">' +
        '</div>' +
        '<button type="button" class="mescla-remover-dup" style="padding:8px 10px;background:rgba(255,255,255,0.08);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer">Remover</button>';
      wrap.appendChild(row);
      var input = row.querySelector('.mescla-duplicado-busca');
      var hidden = row.querySelector('.mescla-duplicado-id');
      bindMesclaField(input, hidden, 'mescla-clientes-lista');
      row.querySelector('.mescla-remover-dup').onclick = function() {
        try { row.remove(); } catch (_) {}
        renderMesclaPreview();
      };
    } catch (_) {}
  }

  async function confirmarMesclaClientes() {
    try {
      var principalInput = document.querySelector('#mescla-principal-id, [data-mescla-principal], .mescla-principal input[type="hidden"], #mescla-cliente-principal');
      var principalId = String((principalInput && (principalInput.value || principalInput.dataset && (principalInput.dataset.id || principalInput.dataset.mesclaPrincipal))) || '').trim();
      if (!principalId || principalId === 'undefined') {
        toastHotfix('⚠️ Selecione o cliente principal primeiro', 'var(--orange)');
        return;
      }

      var duplicados = Array.from(new Set(
        Array.prototype.slice.call(document.querySelectorAll('[data-duplicado-id], .mescla-duplicado[data-id], #mescla-duplicados [data-cliente-id], .cliente-duplicado-item, .mescla-duplicado-id'))
          .map(function(el) {
            return String(((el && el.dataset && (el.dataset.duplicadoId || el.dataset.id || el.dataset.clienteId)) || el.value || '')).trim();
          })
          .concat(getMesclaDuplicadoIds())
          .filter(function(id) { return id && id !== principalId && id !== 'undefined'; })
      ));
      if (!duplicados.length) {
        toastHotfix('⚠️ Adicione pelo menos um cliente duplicado para mesclar', 'var(--orange)');
        return;
      }

      if (!confirm('Confirmar mescla dos clientes?')) return;
      try { console.log('[mesclar] principal:', principalId, 'duplicados:', duplicados); } catch (_) {}

      var btn = document.querySelector('#btn-confirmar-mescla, .btn-confirmar-mescla, #mescla-confirmar, [onclick*="confirmarMescla"]');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Mesclando...'; }
      var token = '';
      try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
      var resp = await fetch('/api/clientes/mesclar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? ('Bearer ' + token) : ''
        },
        body: JSON.stringify({
          principal_id: principalId,
          duplicados: duplicados
        })
      });
      var json = await resp.json().catch(function() { return null; });
      if (!resp.ok || !json || !json.ok) throw new Error((json && json.error) || ('Erro ' + resp.status));
      try {
        ['modal-mesclar-clientes', 'modal-mescla', 'mesclar-modal'].forEach(function(id) {
          var modal = document.getElementById(id);
          if (modal) modal.remove();
        });
        Array.prototype.slice.call(document.querySelectorAll('[id*="mescl"][id*="modal"]')).forEach(function(el) {
          try { el.remove(); } catch (_) {}
        });
      } catch (_) {}
      try { window._clientesCarregados = false; } catch (_) {}
      try { window.OFS_ARQUIVO = null; } catch (_) {}
      try { window.OFS_CACHE = null; } catch (_) {}
      try { window._ofsArquivoLastLoad = 0; } catch (_) {}
      try { await _carregarTodosClientes(); } catch (_) {}
      try { if (typeof carregarClientes === 'function') await carregarClientes(true); } catch (_) {}
      try { if (typeof renderClientes === 'function') setTimeout(renderClientes, 300); } catch (_) {}
      toastHotfix('✅ Mesclados com sucesso! ' + String(json.ofs_migradas || 0) + ' OFs migradas', 'var(--green)');
    } catch (e) {
      toastHotfix('❌ Erro ao mesclar: ' + String(e && e.message || e), 'var(--red)');
      try { console.error('[mesclar]', e); } catch (_) {}
    } finally {
      try {
        var btn2 = document.querySelector('#btn-confirmar-mescla, .btn-confirmar-mescla, #mescla-confirmar, [onclick*="confirmarMescla"]');
        if (btn2) { btn2.disabled = false; btn2.textContent = 'Confirmar Mescla'; }
      } catch (_) {}
    }
  }
  window.confirmarMesclaClientes = confirmarMesclaClientes;

  function abrirModalMesclarClientes() {
    try {
      var old = document.getElementById('modal-mesclar-clientes');
      if (old) old.remove();
      var lista = getClientesListaAtual();
      var modal = document.createElement('div');
      modal.id = 'modal-mesclar-clientes';
      modal.style.position = 'fixed';
      modal.style.inset = '0';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '20px';
      modal.style.zIndex = '99999';
      try { modal.style.setProperty('background', 'rgba(0,0,0,0.75)', 'important'); } catch (_) { modal.style.background = 'rgba(0,0,0,0.75)'; }
      try { modal.style.setProperty('backdrop-filter', 'blur(2px)', 'important'); } catch (_) {}
      modal.innerHTML =
        '<div style="background:var(--bg2,#1e2433) !important;border:1px solid var(--border,#2d3748);border-radius:12px;padding:24px;width:100%;max-width:760px;max-height:90vh;overflow-y:auto">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
            '<h3 style="margin:0;color:var(--text);font-size:16px">🔗 Mesclar Clientes</h3>' +
            '<button id="mescla-close" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
          '</div>' +
          '<div>' +
            '<label style="display:block;color:var(--text2);font-size:12px;margin-bottom:4px">CLIENTE PRINCIPAL</label>' +
            '<input id="mescla-principal-busca" list="mescla-clientes-lista" placeholder="Buscar cliente..." style="width:100%;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text)">' +
            '<input type="hidden" id="mescla-principal-id">' +
          '</div>' +
          '<div id="mescla-duplicados" style="margin-top:14px"></div>' +
          '<button id="mescla-add-dup" type="button" style="margin-top:10px;padding:8px 12px;background:rgba(124,106,247,0.16);border:1px solid rgba(124,106,247,0.38);border-radius:8px;color:#c9c2ff;cursor:pointer;font-size:13px">+ Adicionar outro duplicado</button>' +
          '<datalist id="mescla-clientes-lista">' +
            lista.map(function(c) {
              var label = String(c && c.nome || '-');
              var cnpj = String(c && (c.cnpj || c.documento || '') || '').trim();
              var value = cnpj ? (label + ' | ' + cnpj) : label;
              return '<option value="' + value.replace(/"/g, '&quot;') + '" data-id="' + String(c && c.id || '').replace(/"/g, '&quot;') + '"></option>';
            }).join('') +
          '</datalist>' +
          '<div id="mescla-preview" style="margin-top:16px"></div>' +
          '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">' +
            '<button id="mescla-cancelar" style="padding:8px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer">Cancelar</button>' +
            '<button id="mescla-confirmar" style="padding:8px 16px;background:#7c6af7;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">Confirmar Mescla</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);
      try {
        var box = modal.firstElementChild;
        if (box) {
          try { box.style.setProperty('background', 'var(--bg2,#1e2433)', 'important'); } catch (_) {}
          try { box.style.setProperty('border', '1px solid var(--border,#2d3748)', 'important'); } catch (_) {}
        }
      } catch (_) {}
      var close = function() { try { modal.remove(); } catch (_) {} };
      document.getElementById('mescla-close').onclick = close;
      document.getElementById('mescla-cancelar').onclick = close;
      document.getElementById('mescla-confirmar').onclick = confirmarMesclaClientes;
      document.getElementById('mescla-add-dup').onclick = function() { addMesclaDuplicadoRow(); };
      bindMesclaField(document.getElementById('mescla-principal-busca'), document.getElementById('mescla-principal-id'), 'mescla-clientes-lista');
      addMesclaDuplicadoRow();
      renderMesclaPreview();
    } catch (e) {
      try { console.error('[MESCLAR CLIENTES]', e); } catch (_) {}
    }
  }

  function _resetFiltrosClientes() {
    try {
      var sit = document.querySelector('#cli-sit');
      if (sit) {
        sit.value = '';
        try { sit.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
      }
      var ramo = document.querySelector('#cli-ramo');
      if (ramo) {
        ramo.value = '';
        try { ramo.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
      }
      var emp = document.querySelector('#cli-emp-fil');
      if (emp) {
        emp.value = '';
        try { emp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
      }
      if (typeof renderClientes === 'function') {
        try { renderClientes(); } catch (_) {}
      }
      try { _carregarTodosClientes(); } catch (_) {}
    } catch (_) {}
  }

  function ensureBtnVerTodos() {
    try {
      var bar = document.querySelector('#page-clientes .ptoolbar');
      if (!bar) return;
      if (document.getElementById('patch-cli-ver-todos')) return;
      var btn = document.createElement('button');
      btn.id = 'patch-cli-ver-todos';
      btn.className = 'btn btn-ghost btn-sm';
      btn.textContent = 'Ver Todos';
      btn.onclick = async function() {
        try {
          ['#cli-busca', '#cli-ramo', '#cli-sit', '#cli-emp-fil'].forEach(function(s) {
            var el = document.querySelector(s);
            if (!el) return;
            el.value = '';
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
            try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
          });
          try {
            if (typeof EMP_FILTRO !== 'undefined' && EMP_FILTRO) {
              if (window.__EMP_FILTRO_ANT == null) window.__EMP_FILTRO_ANT = EMP_FILTRO;
              EMP_FILTRO = '';
            }
          } catch (_) {}
          await _carregarTodosClientes();
          if (typeof carregarClientes === 'function') {
            try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
          }
          if (typeof renderClientes === 'function') {
            try { renderClientes(); } catch (_) {}
          }
        } catch (e) {
          try { console.error('[PATCH VER TODOS]', e); } catch (_) {}
        }
      };
      var before = bar.querySelector('button[onclick*="abrirClientesInativos"], button[onclick*="clientesAbrirImportExcel"], button[onclick*="clientesVerificarDuplicatas"], button[onclick*="abrirModalCliente"]');
      if (before && before.parentNode === bar) bar.insertBefore(btn, before);
      else bar.appendChild(btn);
    } catch (_) {}
  }

  function ensureBtnMesclarClientes() {
    try {
      var bar = document.querySelector('#page-clientes .ptoolbar');
      if (!bar) return;
      if (document.getElementById('patch-cli-mesclar')) return;
      var btn = document.createElement('button');
      btn.id = 'patch-cli-mesclar';
      btn.textContent = '🔗 Mesclar';
      btn.setAttribute('style', 'background:#7c6af7 !important;color:#fff !important;border:none !important;padding:6px 12px !important;border-radius:6px !important;cursor:pointer !important;font-size:13px !important;');
      btn.onclick = function() { abrirModalMesclarClientes(); };
      var after = bar.querySelector('button[onclick*="clientesVerificarDuplicatas"]');
      if (after && after.parentNode === bar) {
        if (after.nextSibling) bar.insertBefore(btn, after.nextSibling);
        else bar.appendChild(btn);
      } else {
        bar.appendChild(btn);
      }
    } catch (_) {}
  }

  function ensureClientesQuickFiltersNoTopo() {
    try {
      var toolbar = document.querySelector('#page-clientes .ptoolbar');
      var widget = document.querySelector('#page-clientes #widget-analise-clientes > div:first-child');
      if (!toolbar || !widget) return;
      widget.style.display = 'none';
      var host = document.getElementById('patch-cli-quick-filters');
      if (!host) {
        host = document.createElement('div');
        host.id = 'patch-cli-quick-filters';
        host.className = 'cli-quick-filters';
        host.innerHTML =
          '<button type="button" id="patch-analise-inativos" style="background:#4A90D9;color:#fff;border:none;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:13px;font-weight:600">Sem pedir há +30 dias</button>' +
          '<button type="button" id="patch-analise-ativos" style="background:rgba(255,255,255,0.07);color:#94a3b8;border:none;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:13px">Quem mais pede</button>' +
          '<button type="button" id="patch-analise-valor" style="background:rgba(255,255,255,0.07);color:#94a3b8;border:none;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:13px">Maior valor</button>' +
          '<select id="patch-sel-dias-inativo" style="background:#0b1220;color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:4px 10px;font-size:12px">' +
            '<option value="15">15 dias</option>' +
            '<option value="30" selected>30 dias</option>' +
            '<option value="60">60 dias</option>' +
            '<option value="90">90 dias</option>' +
          '</select>';
      }
      var spacer = toolbar.querySelector('div[style*="flex:1"]');
      if (host.parentNode !== toolbar) {
        if (spacer && spacer.nextSibling) toolbar.insertBefore(host, spacer.nextSibling);
        else toolbar.appendChild(host);
      }
      var origSel = document.getElementById('sel-dias-inativo');
      var cloneSel = document.getElementById('patch-sel-dias-inativo');
      if (origSel && cloneSel && cloneSel.value !== origSel.value) cloneSel.value = origSel.value;
      if (!host.dataset.patchBound) {
        host.dataset.patchBound = '1';
        var escHLocal = function(s) {
          try { return window.escH ? window.escH(s) : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); } catch (_) { return String(s == null ? '' : s); }
        };
        var fmtMoneyLocal = function(v) {
          var n = Number(v || 0) || 0;
          try { if (typeof window.fmtR === 'function') return window.fmtR(n); } catch (_) {}
          return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        var fmtDataLocal = function(s) {
          var d = String(s || '').slice(0, 10);
          try { if (typeof window.fmtD === 'function') return window.fmtD(d); } catch (_) {}
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
            var parts = d.split('-');
            return parts[2] + '/' + parts[1] + '/' + parts[0];
          }
          return d || '—';
        };
        var getAuthHeader = function() {
          var token = '';
          try { token = String(localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''); } catch (_) {}
          return token ? { Authorization: 'Bearer ' + token } : {};
        };
        var apiGet = async function(url) {
          if (typeof window.apiFetch === 'function') return await window.apiFetch(url, { method: 'GET' });
          return await fetch(url, { method: 'GET', headers: getAuthHeader() });
        };
        var ensureRankingModal = function() {
          var old = document.getElementById('modal-ranking-clientes');
          if (old) return old;
          var modal = document.createElement('div');
          modal.id = 'modal-ranking-clientes';
          modal.style.position = 'fixed';
          modal.style.inset = '0';
          modal.style.display = 'none';
          modal.style.alignItems = 'center';
          modal.style.justifyContent = 'center';
          modal.style.padding = '20px';
          modal.style.zIndex = '99999';
          try { modal.style.setProperty('background', 'rgba(0,0,0,0.75)', 'important'); } catch (_) { modal.style.background = 'rgba(0,0,0,0.75)'; }
          try { modal.style.setProperty('backdrop-filter', 'blur(2px)', 'important'); } catch (_) {}
          modal.innerHTML =
            '<div id="modal-ranking-clientes-box" style="width:100%;max-width:860px;max-height:90vh;overflow:auto;border-radius:12px;padding:18px 18px 14px;border:1px solid var(--border,#2d3748);background:var(--bg2,#1e2433)">' +
              '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px">' +
                '<div style="min-width:0">' +
                  '<div id="ranking-clientes-titulo" style="font-weight:800;color:var(--text,#e2e8f0);font-size:15px">Ranking</div>' +
                  '<div id="ranking-clientes-sub" style="margin-top:2px;color:var(--text2,#94a3b8);font-size:12px"></div>' +
                '</div>' +
                '<button id="ranking-clientes-close" style="background:none;border:none;color:var(--text2,#94a3b8);font-size:20px;cursor:pointer">✕</button>' +
              '</div>' +
              '<div id="ranking-clientes-body" style="display:flex;flex-direction:column;gap:8px"></div>' +
            '</div>';
          modal.addEventListener('click', function(ev) { try { if (ev.target === modal) modal.style.display = 'none'; } catch (_) {} });
          document.body.appendChild(modal);
          var btnClose = document.getElementById('ranking-clientes-close');
          if (btnClose) btnClose.onclick = function() { modal.style.display = 'none'; };
          return modal;
        };
        var renderRanking = function(rows, tipo) {
          var body = document.getElementById('ranking-clientes-body');
          if (!body) return;
          var list = Array.isArray(rows) ? rows : [];
          if (!list.length) {
            body.innerHTML = '<div style="padding:14px;color:var(--text2,#94a3b8);text-align:center">Nenhum dado encontrado.</div>';
            return;
          }
          var topMetric = 0;
          list.forEach(function(r) {
            var m = (tipo === 'valor') ? Number(r && r.faturamento || 0) : Number(r && r.total_ofs || 0);
            if (m > topMetric) topMetric = m;
          });
          if (!(topMetric > 0)) topMetric = 1;
          body.innerHTML = list.map(function(r, i) {
            var medalha = (i === 0) ? '🥇' : (i === 1) ? '🥈' : (i === 2) ? '🥉' : '#';
            var nome = String(r && r.nome || '—').trim() || '—';
            var cidade = String(r && r.cidade || '—').trim() || '—';
            var qtd = Number(r && r.total_ofs || 0) || 0;
            var fat = Number(r && r.faturamento || 0) || 0;
            var metric = (tipo === 'valor') ? fat : qtd;
            var pct = Math.max(0, Math.min(100, (metric / topMetric) * 100));
            var lblMetric = (tipo === 'valor') ? fmtMoneyLocal(fat) : (String(qtd) + ' OFs');
            var sub = (tipo === 'valor') ? (String(qtd) + ' OFs') : fmtMoneyLocal(fat);
            return (
              '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 12px;display:flex;gap:12px;align-items:center">' +
                '<div style="width:44px;flex:0 0 44px;text-align:center;font-family:var(--mono);font-weight:900;color:var(--accent,#4A90D9)">' + escHLocal(medalha) + '<div style="margin-top:2px;color:var(--text2,#94a3b8);font-size:11px">' + (i + 1) + '</div></div>' +
                '<div style="flex:1;min-width:0">' +
                  '<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline">' +
                    '<div style="min-width:0">' +
                      '<div style="color:var(--text,#e2e8f0);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHLocal(nome) + '</div>' +
                      '<div style="margin-top:2px;color:var(--text2,#94a3b8);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHLocal(cidade) + '</div>' +
                    '</div>' +
                    '<div style="text-align:right;flex:0 0 auto">' +
                      '<div style="color:var(--text,#e2e8f0);font-weight:900;font-family:var(--mono)">' + escHLocal(lblMetric) + '</div>' +
                      '<div style="margin-top:2px;color:var(--text2,#94a3b8);font-size:11px">' + escHLocal(sub) + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div style="margin-top:10px;height:8px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden">' +
                    '<div style="height:100%;width:' + pct.toFixed(1) + '%;background:linear-gradient(90deg,#4A90D9,#22d3ee);border-radius:999px"></div>' +
                  '</div>' +
                '</div>' +
              '</div>'
            );
          }).join('');
        };
        var abrirRankingClientes = async function(tipo) {
          var modal = ensureRankingModal();
          modal.style.display = 'flex';
          var titulo = document.getElementById('ranking-clientes-titulo');
          var sub = document.getElementById('ranking-clientes-sub');
          var body = document.getElementById('ranking-clientes-body');
          if (titulo) titulo.textContent = (tipo === 'valor') ? 'Maior valor' : 'Quem mais pede';
          if (sub) sub.textContent = 'Carregando…';
          if (body) body.innerHTML = '<div style="padding:14px;color:var(--text2,#94a3b8);text-align:center">Carregando…</div>';
          try {
            var resp = await apiGet('/api/clientes/ranking?tipo=' + encodeURIComponent(tipo === 'valor' ? 'valor' : 'quantidade') + '&limit=50&t=' + Date.now());
            var json = await resp.json().catch(function() { return null; });
            var rows = (json && json.ok && Array.isArray(json.data)) ? json.data : [];
            if (sub) sub.textContent = rows.length ? (rows.length + ' clientes') : 'Sem dados';
            renderRanking(rows, tipo === 'valor' ? 'valor' : 'quantidade');
          } catch (e) {
            if (sub) sub.textContent = 'Erro ao carregar';
            if (body) body.innerHTML = '<div style="padding:14px;color:#f87171;text-align:center">Erro ao carregar ranking.</div>';
          }
        };
        var setTipo = function(tipo) {
          ['inativos', 'ativos', 'valor'].forEach(function(t) {
            var b = document.getElementById('patch-analise-' + t);
            if (!b) return;
            if (t === tipo) {
              b.style.background = '#4A90D9';
              b.style.color = '#fff';
              b.style.fontWeight = '600';
            } else {
              b.style.background = 'rgba(255,255,255,0.07)';
              b.style.color = '#94a3b8';
              b.style.fontWeight = '400';
            }
          });
        };
        document.getElementById('patch-analise-inativos').onclick = function() {
          try { if (origSel && cloneSel) origSel.value = cloneSel.value; } catch (_) {}
          try { if (typeof window.abrirClientesInativos === 'function') window.abrirClientesInativos(); } catch (_) { try { if (typeof carregarAnaliseClientes === 'function') carregarAnaliseClientes('inativos'); } catch (_) {} }
          setTipo('inativos');
        };
        document.getElementById('patch-analise-ativos').onclick = function() {
          try { abrirRankingClientes('quantidade'); } catch (_) {}
          setTipo('ativos');
        };
        document.getElementById('patch-analise-valor').onclick = function() {
          try { abrirRankingClientes('valor'); } catch (_) {}
          setTipo('valor');
        };
        cloneSel.onchange = function() {
          try { if (origSel) origSel.value = cloneSel.value; } catch (_) {}
          try { if (typeof window.abrirClientesInativos === 'function') window.abrirClientesInativos(); } catch (_) { try { if (typeof carregarAnaliseClientes === 'function') carregarAnaliseClientes('inativos'); } catch (_) {} }
          setTipo('inativos');
        };
      }
    } catch (_) {}
  }

  function _adicionarBadgeOfs() {
    try {
      var cards = document.querySelectorAll('.cli-card');
      cards.forEach(function(card) {
        if (card.querySelector('.badge-ofs')) return;
        var nome = card.querySelector('.cli-name, .cli-nome, h3, strong');
        var total = card.querySelector('.cli-stat b');
        var txt = String(total && total.textContent || '').trim();
        if (!nome || !txt) return;
        var badge = document.createElement('span');
        badge.className = 'badge-ofs';
        badge.style.cssText = 'background:var(--accent);color:#fff;border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700;margin-left:6px;display:inline-flex;align-items:center;';
        badge.textContent = txt + ' OFs';
        nome.appendChild(badge);
      });
    } catch (_) {}
  }

  function patchRenderClientesBadge() {
    var orig = window.renderClientes;
    if (typeof orig !== 'function' || orig._patchBadgeOfs) return;
    var wrapped = function() {
      var r = orig.apply(this, arguments);
      setTimeout(_adicionarBadgeOfs, 40);
      return r;
    };
    wrapped._patchBadgeOfs = true;
    window.renderClientes = wrapped;
  }

  function patchSalvarAntiDuploClique() {
    if (document.documentElement.dataset.patchClientesSalvarLock === '1') return;
    document.documentElement.dataset.patchClientesSalvarLock = '1';
    document.addEventListener('click', function(e) {
      try {
        var btn = e && e.target && e.target.closest ? e.target.closest('button') : null;
        if (!btn) return;
        var texto = String(btn.textContent || '').trim().toLowerCase();
        if (!(texto === 'salvar' || texto === 'salvar alteracoes' || texto === 'salvar alterações')) return;
        var modal = btn.closest ? btn.closest('.modal, [id*="modal"], .modal-overlay') : null;
        if (!clientesModalLike(modal)) return;
        if (btn.dataset.patchLockUntil && Number(btn.dataset.patchLockUntil) > Date.now()) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.dataset.patchLockUntil = String(Date.now() + 2000);
        setTimeout(function() {
          try {
            btn.disabled = false;
            btn.style.opacity = '1';
            delete btn.dataset.patchLockUntil;
          } catch (_) {}
        }, 2000);
      } catch (_) {}
    }, true);
  }

  function patchFetchClientesAfterPost() {
    var origFetch = window.fetch;
    if (typeof origFetch !== 'function' || origFetch._patchClientesAfterPost) return;
    var wrapped = function(url, opts) {
      var isClientesPost = false;
      try {
        var u = typeof url === 'string' ? url : (url && url.url ? String(url.url) : '');
        var m = String((opts && opts.method) || 'GET').toUpperCase();
        isClientesPost = (m === 'POST' && u.indexOf('/api/clientes') !== -1);
      } catch (_) {}

      var p = origFetch.apply(this, arguments);

      if (isClientesPost) {
        try {
          p.then(function(res) {
            try { return res.clone().json(); } catch (_) { return null; }
          }).then(async function(data) {
            try {
              if (!(data && data.ok && data.data)) return;
              var novoCliente = data.data;
              console.log('[NOVO CLIENTE]', novoCliente.nome, novoCliente.id);

              if (typeof carregarClientes === 'function') {
                try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
              }

              var existe = null;
              try {
                var arr = (Array.isArray(window.CLIENTES) ? window.CLIENTES : ((typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) ? CLIENTES : []));
                existe = arr.find(function(c) { return String(c && c.id || '').trim() === String(novoCliente.id || '').trim(); }) || null;
              } catch (_) {}

              if (!existe) {
                console.log('[PATCH] adicionando cliente manualmente ao array');
                addClienteToArrays(novoCliente);
                try { await _carregarTodosClientes(); } catch (_) {}
              }

              if (typeof renderClientes === 'function') {
                try { renderClientes(); } catch (_) {}
              }
            } catch (_) {}
          }).catch(function() {});
        } catch (_) {}
      }

      return p;
    };
    wrapped._patchClientesAfterPost = true;
    window.fetch = wrapped;
  }

  function abrirModalNovoCliente() {
    try {
      var existente = document.getElementById('modal-novo-cliente-overlay');
      if (existente) existente.remove();
    } catch (_) {}

    var overlay = document.createElement('div');
    overlay.id = 'modal-novo-cliente-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:18px;';
    overlay.innerHTML =
      '<div style="width:100%;max-width:520px;max-height:90vh;overflow:auto;border-radius:12px;padding:16px;border:1px solid var(--border,#2d3748);background:var(--bg2,#111827);color:var(--text,#e5e7eb)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">' +
          '<div style="font-weight:800;font-size:15px">Novo cliente</div>' +
          '<button id="novo-cli-fechar" style="background:none;border:none;color:var(--text2,#94a3b8);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:10px">' +
          '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Nome</label><input id="novo-cli-nome" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
          '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Razão social</label><input id="novo-cli-rs" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
            '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">CNPJ/Documento</label><input id="novo-cli-cnpj" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
            '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Telefone</label><input id="novo-cli-tel" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
            '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">E-mail</label><input id="novo-cli-email" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
            '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Cidade</label><input id="novo-cli-cidade" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc)"></div>' +
          '</div>' +
          '<div><label style="font-size:11px;color:var(--text2,#94a3b8);display:block;margin-bottom:5px">Observações</label><textarea id="novo-cli-obs" rows="3" style="width:100%;padding:10px 12px;background:var(--bg,#0b1220);border:1px solid var(--border,#273449);border-radius:8px;color:var(--text,#f8fafc);resize:vertical"></textarea></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px">' +
          '<button id="novo-cli-cancelar" style="padding:9px 12px;border-radius:10px;border:1px solid var(--border,#273449);background:transparent;color:var(--text,#e5e7eb);cursor:pointer">Cancelar</button>' +
          '<button id="novo-cli-salvar" style="padding:9px 12px;border-radius:10px;border:1px solid rgba(34,197,94,0.35);background:rgba(34,197,94,0.18);color:#bbf7d0;cursor:pointer;font-weight:700">Salvar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    function fechar() {
      try { overlay.remove(); } catch (_) {}
    }

    overlay.addEventListener('click', function(e) {
      try { if (e && e.target === overlay) fechar(); } catch (_) {}
    });
    try { document.getElementById('novo-cli-fechar').onclick = fechar; } catch (_) {}
    try { document.getElementById('novo-cli-cancelar').onclick = fechar; } catch (_) {}
    try { document.getElementById('novo-cli-salvar').onclick = salvarNovoCliente; } catch (_) {}
    try { document.getElementById('novo-cli-nome').focus(); } catch (_) {}
  }

  async function salvarNovoCliente() {
    try {
      var nome = String((document.getElementById('novo-cli-nome') || {}).value || '').trim();
      var rs = String((document.getElementById('novo-cli-rs') || {}).value || '').trim();
      var cnpj = String((document.getElementById('novo-cli-cnpj') || {}).value || '').trim();
      var tel = String((document.getElementById('novo-cli-tel') || {}).value || '').trim();
      var email = String((document.getElementById('novo-cli-email') || {}).value || '').trim();
      var cidade = String((document.getElementById('novo-cli-cidade') || {}).value || '').trim();
      var observacoes = String((document.getElementById('novo-cli-obs') || {}).value || '').trim();

      if (!nome && !rs) {
        alert('Nome obrigatório');
        return;
      }

      var token = '';
      try { token = String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || ''); } catch (_) { token = ''; }
      var headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = 'Bearer ' + token;

      var payload = {
        nome: nome || rs || '',
        rs: rs || nome || '',
        cnpj: cnpj || '',
        documento: cnpj || '',
        telefone: tel || '',
        tel: tel || '',
        email: email || '',
        cidade: cidade || '',
        observacoes: observacoes || ''
      };

      var resp = await fetch('/api/clientes', { method: 'POST', headers: headers, body: JSON.stringify(payload) });
      var json = null;
      try { json = await resp.json(); } catch (_) { json = null; }
      if (!(json && json.ok && json.data)) {
        var msg = (json && (json.error || json.message)) ? String(json.error || json.message) : ('Erro ao salvar (' + resp.status + ')');
        alert(msg);
        return;
      }

      try {
        var overlay = document.getElementById('modal-novo-cliente-overlay');
        if (overlay) overlay.remove();
      } catch (_) {}

      try { window._clientesCarregados = false; } catch (_) {}
      try { window._CLIENTES = []; } catch (_) {}
      try { window.CLIENTES = []; } catch (_) {}
      try { if (typeof CLIENTES !== 'undefined') CLIENTES.length = 0; } catch (_) {}

      try {
        if (typeof carregarClientes === 'function') {
          try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
        }
      } catch (_) {}

      try { if (typeof renderClientes === 'function') renderClientes(); } catch (_) {}
      try { alert('Cliente criado'); } catch (_) {}
    } catch (e) {
      try { alert(String(e && e.message ? e.message : e)); } catch (_) {}
    }
  }

  function ensureBtnNovoCliente() {
    try {
      if (typeof window.novoCliente !== 'function') window.novoCliente = abrirModalNovoCliente;
      if (typeof window._salvarNovoCliente !== 'function') window._salvarNovoCliente = salvarNovoCliente;

      var cand = [];
      try {
        var b0 = document.getElementById('btn-novo-cliente') || document.querySelector('[data-novo-cliente], .btn-novo-cliente');
        if (b0) cand.push(b0);
      } catch (_) {}
      try {
        cand = cand.concat(Array.prototype.slice.call(document.querySelectorAll('button, a')).filter(function(el) {
          if (!el) return false;
          if (el.dataset && el.dataset.patchNovoCliente === '1') return false;
          var txt = String(el.textContent || '').trim().toLowerCase();
          var oc = String(el.getAttribute && (el.getAttribute('onclick') || '') || '').toLowerCase();
          return el.id === 'btn-novo-cliente' || txt.indexOf('novo cliente') >= 0 || oc.indexOf('novocliente') >= 0 || oc.indexOf('novoCliente') >= 0;
        }));
      } catch (_) {}

      cand.forEach(function(btn) {
        try {
          if (!btn || (btn.dataset && btn.dataset.patchNovoCliente === '1')) return;
          btn.dataset.patchNovoCliente = '1';
          btn.onclick = function(e) {
            try { if (e && typeof e.preventDefault === 'function') e.preventDefault(); } catch (_) {}
            try { if (e && typeof e.stopPropagation === 'function') e.stopPropagation(); } catch (_) {}
            try { window.novoCliente(); } catch (_) { try { abrirModalNovoCliente(); } catch (_) {} }
          };
        } catch (_) {}
      });
    } catch (_) {}
  }

  window.abrirModalNovoCliente = abrirModalNovoCliente;
  window.salvarNovoCliente = salvarNovoCliente;

  async function _reloadClientes() {
    try {
      try { if (typeof _cliSituacao !== 'undefined') _cliSituacao = ''; } catch (_) {}
      try { if (typeof window._cliSituacao !== 'undefined') window._cliSituacao = ''; } catch (_) {}
      try { if (typeof _cliFiltro !== 'undefined') _cliFiltro = ''; } catch (_) {}
      try { if (typeof window._cliFiltro !== 'undefined') window._cliFiltro = ''; } catch (_) {}
      try { if (typeof _cliRamo !== 'undefined') _cliRamo = ''; } catch (_) {}
      try { if (typeof window._cliRamo !== 'undefined') window._cliRamo = ''; } catch (_) {}
      try { if (typeof _cliBusca !== 'undefined') _cliBusca = ''; } catch (_) {}
      try { if (typeof window._cliBusca !== 'undefined') window._cliBusca = ''; } catch (_) {}

      ['#cli-busca', '#cli-ramo', '#cli-sit', '#cli-emp-fil'].forEach(function(s) {
        try {
          var el = document.querySelector(s);
          if (!el) return;
          el.value = '';
          try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
          try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
        } catch (_) {}
      });

      if (typeof carregarClientes === 'function') {
        try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
      }

      await new Promise(function(r) { setTimeout(r, 800); });

      if (typeof renderClientes === 'function') {
        try { renderClientes(); } catch (_) {}
        try { console.log('[CLIENTES] lista recarregada após salvar'); } catch (_) {}
        return;
      }

      if (typeof carregarClientes === 'function') return;

      var links = document.querySelectorAll('a, [onclick]');
      for (var i = 0; i < links.length; i++) {
        var el2 = links[i];
        var oc = '';
        try { oc = el2.getAttribute('onclick') || ''; } catch (_) { oc = ''; }
        var txt = '';
        try { txt = String(el2.textContent || '').trim(); } catch (_) { txt = ''; }
        if (oc.indexOf('clientes') !== -1 || txt === 'Clientes') {
          try { if (typeof el2.click === 'function') el2.click(); } catch (_) {}
          return;
        }
      }
    } catch (e) {
      try { console.error('[RELOAD CLIENTES ERR]', e); } catch (_) {}
    }
  }

  function patchClickSalvar() {
    if (document.documentElement.dataset.patchClientesClickSalvar === '1') return;
    document.documentElement.dataset.patchClientesClickSalvar = '1';
    document.addEventListener('click', function(e) {
      try {
        var btn = e && e.target && e.target.closest ? e.target.closest('button') : null;
        if (!btn) return;
        var texto = String(btn.textContent || '').trim().toLowerCase();
        if (texto !== 'salvar') return;
        var modal = btn.closest ? btn.closest('.modal, [class*="modal"], .modal-overlay') : null;
        if (!modal) return;
        mapEstadoToUfInModal(modal);
      } catch (_) {}
    }, true);
  }

  function tick() {
    try { injectCss(); } catch (_) {}
    try { patchClickSalvar(); } catch (_) {}
    try { ensureBtnVerTodos(); } catch (_) {}
    try { ensureBtnMesclarClientes(); } catch (_) {}
    try { ensureBtnNovoCliente(); } catch (_) {}
    try { ensureClientesQuickFiltersNoTopo(); } catch (_) {}
    try { patchRenderClientesBadge(); } catch (_) {}
    try { _adicionarBadgeOfs(); } catch (_) {}
    try { patchSalvarAntiDuploClique(); } catch (_) {}
    try { patchFetchClientesAfterPost(); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 200);
      setInterval(tick, 2500);
    });
  } else {
    setTimeout(tick, 200);
    setInterval(tick, 2500);
  }
})();

(function _iniciarClientes() {
  async function run() {
    try {
      await new Promise(function(r) { setTimeout(r, 2000); });

      if (typeof carregarClientes === 'function') {
        try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
      }

      var total = 0;
      try { total = (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) ? CLIENTES.length : (Array.isArray(window.CLIENTES) ? window.CLIENTES.length : 0); } catch (_) { total = 0; }
      console.log('[PATCH CLIENTES TOTAL]', total);

      if (total > 0 && typeof renderClientes === 'function') {
        try { renderClientes(); } catch (_) {}
        return;
      }

      try {
        if (typeof EMP_FILTRO !== 'undefined' && EMP_FILTRO) {
          if (window.__EMP_FILTRO_ANT == null) window.__EMP_FILTRO_ANT = EMP_FILTRO;
          EMP_FILTRO = '';
        }
      } catch (_) {}

      if (typeof carregarClientes === 'function') {
        try { await carregarClientes(true); } catch (_) { try { await carregarClientes(); } catch (_) {} }
      }

      try { total = (typeof CLIENTES !== 'undefined' && Array.isArray(CLIENTES)) ? CLIENTES.length : 0; } catch (_) { total = 0; }
      if (total > 0) {
        try { if (typeof renderClientes === 'function') renderClientes(); } catch (_) {}
        return;
      }

      var token = '';
      try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
      var resp = await fetch('/api/clientes?limit=2000&order=created_at&dir=desc&t=' + Date.now(), { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var json = await resp.json().catch(function() { return null; });
      var arr = json && json.ok && Array.isArray(json.data) ? json.data : null;
      if (arr && arr.length) {
        var out = arr;
        try { if (typeof normalizeCli === 'function') out = arr.map(function(c) { return normalizeCli(c); }); } catch (_) {}
        try { CLIENTES = out; } catch (_) {}
        try { window._CLIENTES = out; } catch (_) {}
        try { window.CLIENTES = out; } catch (_) {}
        console.log('[PATCH CLIENTES FORÇADO]', out.length);
        if (typeof renderClientes === 'function') {
          try { renderClientes(); } catch (_) {}
        }
      }
    } catch (e) {
      try { console.error('[PATCH CLIENTES INIT]', e); } catch (_) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { run(); });
  else run();
})();

(function patchMenuEstoques() {
  function _adicionarMenuEstoques() {
    try {
      var grupo = document.querySelector('#ng-estoques .nav-group-items');
      if (!grupo) return;

      var ultimoEstoque = document.getElementById('menu-cliches') || document.getElementById('menu-facas') || document.getElementById('menu-estoque');
      if (!ultimoEstoque) return;

      var novos = [
        { icon: '🎨', label: 'Estoque de Tintas', tela: 'estoque-tintas' },
        { icon: '🔧', label: 'Estoque de Materiais', tela: 'estoque-materiais' },
        { icon: '📊', label: 'Dashboard Estoques', tela: 'estoque-dashboard' },
      ];

      novos.forEach(function(item) {
        try {
          if (document.querySelector('#ng-estoques .nav-item[onclick*="' + item.tela + '"]')) return;
          var el = ultimoEstoque.cloneNode(true);
          el.id = 'menu-' + item.tela;
          el.setAttribute('onclick', "go('" + item.tela + "');closeNavGroupsExcept('ng-estoques')");
          var ico = el.querySelector('span.ico') || el.querySelector('.ico') || el.querySelector('span');
          if (ico) ico.textContent = item.icon;
          var txt = el.childNodes;
          if (txt && txt.length) {
            for (var i = 0; i < txt.length; i++) {
              var n = txt[i];
              if (n && n.nodeType === 3) { n.textContent = item.label; break; }
            }
          }
          if (!el.textContent || el.textContent.trim().length < 3) el.textContent = item.label;
          grupo.insertBefore(el, ultimoEstoque.nextSibling);
          ultimoEstoque = el;
        } catch (_) {}
      });

      console.log('[PATCH] itens de estoque adicionados ao menu');
    } catch (_) {}
  }

  function init() {
    setTimeout(_adicionarMenuEstoques, 1500);
    try {
      var obs = new MutationObserver(function(_, observer) {
        if (window._pausarObservers) return;
        try {
          var temEstoque = document.querySelector('#ng-estoques .nav-item[onclick*="estoque"]');
          var temNovos = document.querySelector('#ng-estoques .nav-item[onclick*="estoque-tintas"]');
          if (temEstoque && !temNovos) _adicionarMenuEstoques();
          temNovos = document.querySelector('#ng-estoques .nav-item[onclick*="estoque-tintas"]');
          if (temNovos) {
            try { observer.disconnect(); } catch (_) {}
            try { window._patchMenuEstoquesObs = null; } catch (_) {}
          }
        } catch (_) {}
      });
      window._patchMenuEstoquesObs = obs;
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

(function patchGoClientesEEstoques() {
  function authHeaders() {
    var token = '';
    try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function num(v) {
    var n = Number(v || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function getMainPatchHost(pageKey, title) {
    var main = document.querySelector('.content, #content, .content-wrapper, .main-area, #main-content, #page-content, body > div:last-child');
    if (!main) return null;

    var host = document.getElementById('patch-page-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'patch-page-host';
      host.className = 'page';
      host.style.cssText = 'display:none;flex:1;overflow-y:auto;padding:20px;background:var(--bg)';
      host.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px">' +
          '<h2 id="patch-page-title" style="margin:0;color:var(--text);font-size:18px"></h2>' +
        '</div>' +
        '<div id="patch-page-body"></div>';
      main.appendChild(host);
    }

    try {
      document.querySelectorAll('[id^="page-"]').forEach(function(el) {
        if (el !== host) el.style.display = 'none';
      });
    } catch (_) {}
    try { host.style.display = 'block'; } catch (_) {}
    try { document.getElementById('patch-page-title').textContent = title || ''; } catch (_) {}
    try { window._PAGE_ATUAL = pageKey; } catch (_) {}
    return document.getElementById('patch-page-body');
  }

  function hidePatchHost() {
    try {
      var host = document.getElementById('patch-page-host');
      if (host) host.style.display = 'none';
    } catch (_) {}
  }

  function runAfterGoEffects(page) {
    var p = String(page || '');
    if (p.toLowerCase() === 'dashboard') {
      setTimeout(function() {
        try { if (typeof window.renderProjecaoVendas === 'function') window.renderProjecaoVendas(); } catch (_) {}
      }, 400);
    }
    if (p === 'ofmaq' || p.indexOf('maq') >= 0) {
      [300, 600, 1000, 1500, 2000, 3000].forEach(function(delay) {
        setTimeout(function() {
          try {
            var headers = document.querySelectorAll('.maq-header');
            if (headers.length > 0) aplicarAccordion();
          } catch (_) {}
        }, delay);
      });
    }
    if (p === 'hub') {
      setTimeout(function() {
        try { window.carregarPassagensHoje(); } catch (_) {}
      }, 400);
    }
  }

  function safeAttr(v) {
    return esc(v).replace(/`/g, '&#96;');
  }

  function fechaModalById(id) {
    try {
      var el = document.getElementById(id);
      if (el) el.remove();
    } catch (_) {}
  }

  function _getInputVal(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function _getNumVal(id) {
    var n = Number(_getInputVal(id).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  function _getToken() {
    var token = '';
    try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
    return token;
  }

  function _fmtDateISO(v) {
    if (!v) return '';
    var s = String(v).trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var d = new Date(s);
    if (!Number.isFinite(d.getTime())) return '';
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return String(d.getFullYear()) + '-' + mm + '-' + dd;
  }

  function _statusBadgeHtml(status, vencendo) {
    var s = String(status || '');
    if (vencendo) return '<span class="badge badge-venc">Venc.</span>';
    if (s === 'zerado') return '<span class="badge badge-zerado">Zerado</span>';
    if (s === 'critico') return '<span class="badge badge-critico">Crítico</span>';
    if (s === 'baixo') return '<span class="badge badge-baixo">Baixo</span>';
    return '<span class="badge badge-ok">OK</span>';
  }

  function _calcStatus(qtd, minimo) {
    var q = num(qtd);
    var m = num(minimo);
    if (q <= 0) return 'zerado';
    if (m > 0 && q <= m * 0.5) return 'critico';
    if (m > 0 && q <= m) return 'baixo';
    return 'ok';
  }

  function _isVencendo(validade) {
    if (!validade) return false;
    var d = new Date(String(validade));
    if (!Number.isFinite(d.getTime())) return false;
    var hoje = new Date();
    var em30 = new Date(hoje.getTime() + 30 * 86400000);
    return d.getTime() >= hoje.getTime() && d.getTime() <= em30.getTime();
  }

  function _ensureEstoqueStyle() {
    if (document.getElementById('patch-estoques-style')) return;
    var st = document.createElement('style');
    st.id = 'patch-estoques-style';
    st.textContent =
      '.badge{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:800;white-space:nowrap}' +
      '.badge-ok{ background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid #10b981; }' +
      '.badge-baixo{ background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid #f59e0b; }' +
      '.badge-critico{ background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid #ef4444; }' +
      '.badge-zerado{ background: rgba(127,29,29,0.3); color: #fca5a5; border: 1px solid #ef4444; }' +
      '.badge-venc{ background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid #a855f7; }' +
      '.pcp-table{width:100%;border-collapse:collapse;font-size:13px}' +
      '.pcp-table th{color:var(--text2);text-align:left;padding:10px;border-bottom:2px solid var(--border);font-size:12px;letter-spacing:0.3px}' +
      '.pcp-table td{padding:10px;border-bottom:1px solid var(--border);color:var(--text)}' +
      '.pcp-table td.muted{color:var(--text2)}' +
      '.pcp-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}' +
      '.pcp-btn{display:inline-flex;align-items:center;gap:6px;border-radius:8px;padding:6px 10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);cursor:pointer;font-size:12px}' +
      '.pcp-btn.primary{background:var(--accent);border-color:transparent;color:#fff;font-weight:700}' +
      '.pcp-btn.danger{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.35);color:#ef4444;font-weight:800}' +
      '.pcp-input{padding:8px 10px;border-radius:10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-size:13px}' +
      '.pcp-select{padding:8px 10px;border-radius:10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-size:13px}';
    document.head.appendChild(st);
  }

  function _abrirModalNovaTinta(tintaExistente) {
    _ensureEstoqueStyle();
    fechaModalById('modal-nova-tinta');
    var t = tintaExistente || {};
    var titulo = t && t.id ? 'Editar Tinta' : 'Nova Tinta';
    var modal = document.createElement('div');
    modal.id = 'modal-nova-tinta';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML =
      '<div style="background:var(--card);border-radius:12px;padding:24px;width:100%;max-width:820px;max-height:92vh;overflow-y:auto;border:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px">' +
          '<h3 style="color:var(--text);font-size:16px;margin:0">🎨 ' + esc(titulo) + '</h3>' +
          '<button id="nt-fechar" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Nome *</label><input id="nt-nome" class="pcp-input" value="' + safeAttr(t.nome || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Código</label><input id="nt-codigo" class="pcp-input" value="' + safeAttr(t.codigo || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Pantone</label><input id="nt-pantone" class="pcp-input" value="' + safeAttr(t.pantone || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Cor</label>' +
            '<div style="display:flex;gap:8px;align-items:center;margin-top:4px">' +
              '<input id="nt-cor-picker" type="color" value="' + safeAttr((String(t.cor || '').match(/^#/) ? t.cor : '#000000')) + '" style="width:56px;height:38px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:4px">' +
              '<input id="nt-cor" class="pcp-input" value="' + safeAttr(t.cor || '') + '" style="flex:1">' +
            '</div>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Tipo</label>' +
            '<select id="nt-tipo" class="pcp-select" style="width:100%;margin-top:4px">' +
              '<option value="">Selecionar...</option>' +
              [
                { v: 'base_agua', l: 'Base Água' },
                { v: 'uv', l: 'UV' },
                { v: 'verniz', l: 'Verniz' },
                { v: 'outro', l: 'Outro' }
              ].map(function(o) { return '<option value="' + o.v + '"' + (String(t.tipo || '') === o.v ? ' selected' : '') + '>' + o.l + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Fabricante</label><input id="nt-fabricante" class="pcp-input" value="' + safeAttr(t.fabricante || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Fornecedor</label><input id="nt-fornecedor" class="pcp-input" value="' + safeAttr(t.fornecedor || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Lote</label><input id="nt-lote" class="pcp-input" value="' + safeAttr(t.lote || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Validade</label><input id="nt-validade" type="date" class="pcp-input" value="' + safeAttr(_fmtDateISO(t.validade || t.data_validade || '')) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Unidade</label>' +
            '<select id="nt-unidade" class="pcp-select" style="width:100%;margin-top:4px">' +
              ['kg', 'litro'].map(function(u) { return '<option value="' + u + '"' + (String(t.unidade || 'kg') === u ? ' selected' : '') + '>' + u + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Peso líquido</label><input id="nt-peso" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.peso_liquido != null ? t.peso_liquido : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade atual *</label><input id="nt-qtd" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.quantidade_atual != null ? t.quantidade_atual : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade mínima</label><input id="nt-qtd-min" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.quantidade_minima != null ? t.quantidade_minima : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade ideal</label><input id="nt-qtd-ideal" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.quantidade_ideal != null ? t.quantidade_ideal : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Custo unitário (R$)</label><input id="nt-custo" type="number" step="0.01" class="pcp-input" value="' + safeAttr(t.custo_unitario != null ? t.custo_unitario : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Localização</label><input id="nt-local" class="pcp-input" value="' + safeAttr(t.localizacao || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Observações</label><textarea id="nt-obs" class="pcp-input" style="width:100%;margin-top:4px;min-height:90px;resize:vertical">' + esc(t.observacoes || '') + '</textarea></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
          '<button id="nt-cancelar" class="pcp-btn">Cancelar</button>' +
          '<button id="nt-salvar" class="pcp-btn primary">💾 Salvar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    var corPicker = document.getElementById('nt-cor-picker');
    var corInput = document.getElementById('nt-cor');
    if (corPicker && corInput) {
      corPicker.oninput = function() { corInput.value = corPicker.value; };
      corInput.oninput = function() {
        var v = String(corInput.value || '').trim();
        if (/^#[0-9a-f]{6}$/i.test(v)) corPicker.value = v;
      };
    }
    document.getElementById('nt-fechar').onclick = function() { fechaModalById('modal-nova-tinta'); };
    document.getElementById('nt-cancelar').onclick = function() { fechaModalById('modal-nova-tinta'); };
    document.getElementById('nt-salvar').onclick = function() { window._salvarTinta(String(t.id || '')); };
  }

  function _abrirModalMovTinta(tinta) {
    _ensureEstoqueStyle();
    fechaModalById('modal-mov-tinta');
    var t = tinta || {};
    var modal = document.createElement('div');
    modal.id = 'modal-mov-tinta';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML =
      '<div style="background:var(--card);border-radius:12px;padding:24px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;border:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px">' +
          '<h3 style="color:var(--text);font-size:16px;margin:0">↕ Movimentar Tinta</h3>' +
          '<button id="mt-fechar" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="color:var(--text2);font-size:12px;margin-bottom:10px">Tinta</div>' +
        '<div style="font-weight:900;color:var(--text);margin-bottom:14px">' + esc(t.nome || '-') + '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label style="color:var(--text2);font-size:12px">Tipo *</label>' +
            '<select id="mt-tipo" class="pcp-select" style="width:100%;margin-top:4px">' +
              '<option value="entrada">Entrada ↓</option>' +
              '<option value="saida">Saída ↑</option>' +
              '<option value="ajuste">Ajuste</option>' +
              '<option value="perda">Perda</option>' +
              '<option value="inventario">Inventário</option>' +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade *</label><input id="mt-qtd" type="number" step="0.01" class="pcp-input" value="0" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Operador</label><input id="mt-operador" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Setor</label>' +
            '<select id="mt-setor" class="pcp-select" style="width:100%;margin-top:4px">' +
              ['Produção','Manutenção','Expedição','Limpeza','Outro'].map(function(s) { return '<option value="' + safeAttr(s) + '">' + esc(s) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Nº OF</label><input id="mt-of" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Custo unitário (R$)</label><input id="mt-custo" type="number" step="0.01" class="pcp-input" value="0" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Motivo</label><input id="mt-motivo" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Observações</label><textarea id="mt-obs" class="pcp-input" style="width:100%;margin-top:4px;min-height:80px;resize:vertical"></textarea></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
          '<button id="mt-cancelar" class="pcp-btn">Cancelar</button>' +
          '<button id="mt-confirmar" class="pcp-btn primary">Confirmar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('mt-fechar').onclick = function() { fechaModalById('modal-mov-tinta'); };
    document.getElementById('mt-cancelar').onclick = function() { fechaModalById('modal-mov-tinta'); };
    document.getElementById('mt-confirmar').onclick = function() { window._movimentarTinta(String(t.id || '')); };
  }

  async function _salvarTinta(id) {
    var payload = {
      nome: _getInputVal('nt-nome'),
      codigo: _getInputVal('nt-codigo'),
      cor: _getInputVal('nt-cor'),
      tipo: _getInputVal('nt-tipo'),
      pantone: _getInputVal('nt-pantone'),
      fabricante: _getInputVal('nt-fabricante'),
      fornecedor: _getInputVal('nt-fornecedor'),
      lote: _getInputVal('nt-lote'),
      validade: _getInputVal('nt-validade') || null,
      unidade: _getInputVal('nt-unidade') || 'kg',
      peso_liquido: _getNumVal('nt-peso'),
      quantidade_atual: _getNumVal('nt-qtd'),
      quantidade_minima: _getNumVal('nt-qtd-min'),
      quantidade_ideal: _getNumVal('nt-qtd-ideal'),
      custo_unitario: _getNumVal('nt-custo'),
      localizacao: _getInputVal('nt-local'),
      observacoes: (function() { var el = document.getElementById('nt-obs'); return el ? String(el.value || '') : ''; })(),
      ativo: true
    };
    if (!payload.nome) { alert('Nome é obrigatório'); return; }
    var token = _getToken();
    var method = id ? 'PATCH' : 'POST';
    var url = id ? ('/api/estoque_tintas/' + encodeURIComponent(id)) : '/api/estoque_tintas';
    var resp = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
      body: JSON.stringify(payload)
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && (json.ok || json.id)) {
      fechaModalById('modal-nova-tinta');
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueTintas(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  async function _excluirTinta(id) {
    if (!id) return;
    if (!confirm('Desativar esta tinta?')) return;
    var token = _getToken();
    var resp = await fetch('/api/estoque_tintas/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { 'Authorization': token ? ('Bearer ' + token) : '' }
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && (json.ok || json.data)) {
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueTintas(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  async function _movimentarTinta(id) {
    if (!id) return;
    var payload = {
      tipo: _getInputVal('mt-tipo'),
      quantidade: _getNumVal('mt-qtd'),
      operador: _getInputVal('mt-operador'),
      setor: _getInputVal('mt-setor'),
      of_numero: _getInputVal('mt-of'),
      motivo: _getInputVal('mt-motivo'),
      custo_unitario: _getNumVal('mt-custo'),
      observacoes: (function() { var el = document.getElementById('mt-obs'); return el ? String(el.value || '') : ''; })(),
    };
    if (!payload.tipo || payload.quantidade <= 0) { alert('Tipo e quantidade são obrigatórios'); return; }
    var token = _getToken();
    var resp = await fetch('/api/estoque_tintas/' + encodeURIComponent(id) + '/movimentar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
      body: JSON.stringify(payload)
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && json.ok) {
      fechaModalById('modal-mov-tinta');
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueTintas(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  function _abrirModalNovoMaterial(materialExistente) {
    _ensureEstoqueStyle();
    fechaModalById('modal-novo-material');
    var m = materialExistente || {};
    var titulo = m && m.id ? 'Editar Material' : 'Novo Material';
    var modal = document.createElement('div');
    modal.id = 'modal-novo-material';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML =
      '<div style="background:var(--card);border-radius:12px;padding:24px;width:100%;max-width:900px;max-height:92vh;overflow-y:auto;border:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px">' +
          '<h3 style="color:var(--text);font-size:16px;margin:0">🔩 ' + esc(titulo) + '</h3>' +
          '<button id="nm-fechar" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Nome *</label><input id="nm-nome" class="pcp-input" value="' + safeAttr(m.nome || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Código</label><input id="nm-codigo" class="pcp-input" value="' + safeAttr(m.codigo || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Categoria *</label>' +
            '<div style="display:flex;gap:8px;align-items:center;margin-top:4px">' +
              '<select id="nm-categoria" class="pcp-select" style="flex:1">' +
                ['Ferramentas','EPIs','Manutenção','Escritório','Limpeza','Produção','Expedição','Outro'].map(function(o) { return '<option value="' + safeAttr(o) + '"' + (String(m.categoria || '') === String(o) ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
              '</select>' +
              '<button id="nm-nova-cat" class="pcp-btn" type="button">Nova</button>' +
            '</div>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Subcategoria</label><input id="nm-subcategoria" class="pcp-input" value="' + safeAttr(m.subcategoria || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Marca</label><input id="nm-marca" class="pcp-input" value="' + safeAttr(m.marca || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Fornecedor</label><input id="nm-fornecedor" class="pcp-input" value="' + safeAttr(m.fornecedor || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Unidade</label>' +
            '<select id="nm-unidade" class="pcp-select" style="width:100%;margin-top:4px">' +
              ['un','kg','litro','metro','caixa','pacote','par','m²','m'].map(function(o) { return '<option value="' + safeAttr(o) + '"' + (String(m.unidade || 'un') === String(o) ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Código de barras</label><input id="nm-codbarras" class="pcp-input" value="' + safeAttr(m.codigo_barras || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Validade</label><input id="nm-validade" type="date" class="pcp-input" value="' + safeAttr(_fmtDateISO(m.validade || m.data_validade || '')) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Qtd atual *</label><input id="nm-qtd" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.quantidade_atual != null ? m.quantidade_atual : (m.quantidade != null ? m.quantidade : 0)) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Qtd mínima</label><input id="nm-qtd-min" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.quantidade_minima != null ? m.quantidade_minima : (m.estoque_minimo != null ? m.estoque_minimo : 0)) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Qtd ideal</label><input id="nm-qtd-ideal" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.quantidade_ideal != null ? m.quantidade_ideal : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Qtd máxima</label><input id="nm-qtd-max" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.quantidade_maxima != null ? m.quantidade_maxima : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Custo médio (R$)</label><input id="nm-custo-medio" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.custo_medio != null ? m.custo_medio : (m.custo_unitario != null ? m.custo_unitario : 0)) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Último custo (R$)</label><input id="nm-ultimo-custo" type="number" step="0.01" class="pcp-input" value="' + safeAttr(m.ultimo_custo != null ? m.ultimo_custo : 0) + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Corredor</label><input id="nm-loc-cor" class="pcp-input" value="' + safeAttr(m.localizacao_corredor || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Prateleira</label><input id="nm-loc-pra" class="pcp-input" value="' + safeAttr(m.localizacao_prateleira || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Caixa/Gaveta</label><input id="nm-loc-cai" class="pcp-input" value="' + safeAttr(m.localizacao_caixa || '') + '" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Descrição</label><textarea id="nm-desc" class="pcp-input" style="width:100%;margin-top:4px;min-height:80px;resize:vertical">' + esc(m.descricao || '') + '</textarea></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Observações</label><textarea id="nm-obs" class="pcp-input" style="width:100%;margin-top:4px;min-height:80px;resize:vertical">' + esc(m.observacoes || '') + '</textarea></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
          '<button id="nm-cancelar" class="pcp-btn">Cancelar</button>' +
          '<button id="nm-salvar" class="pcp-btn primary">💾 Salvar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('nm-fechar').onclick = function() { fechaModalById('modal-novo-material'); };
    document.getElementById('nm-cancelar').onclick = function() { fechaModalById('modal-novo-material'); };
    document.getElementById('nm-salvar').onclick = function() { window._salvarMaterial(String(m.id || '')); };
    document.getElementById('nm-nova-cat').onclick = function() {
      var n = prompt('Nova categoria:');
      if (!n) return;
      n = String(n).trim();
      if (!n) return;
      var sel = document.getElementById('nm-categoria');
      if (!sel) return;
      var opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n;
      sel.appendChild(opt);
      sel.value = n;
    };
  }

  function _abrirModalMovMaterial(material) {
    _ensureEstoqueStyle();
    fechaModalById('modal-mov-material');
    var m = material || {};
    var modal = document.createElement('div');
    modal.id = 'modal-mov-material';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML =
      '<div style="background:var(--card);border-radius:12px;padding:24px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;border:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px">' +
          '<h3 style="color:var(--text);font-size:16px;margin:0">↕ Movimentar Material</h3>' +
          '<button id="mm-fechar" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="color:var(--text2);font-size:12px;margin-bottom:10px">Material</div>' +
        '<div style="font-weight:900;color:var(--text);margin-bottom:14px">' + esc(m.nome || '-') + '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label style="color:var(--text2);font-size:12px">Tipo *</label>' +
            '<select id="mm-tipo" class="pcp-select" style="width:100%;margin-top:4px">' +
              '<option value="entrada">Entrada ↓</option>' +
              '<option value="saida">Saída ↑</option>' +
              '<option value="ajuste">Ajuste</option>' +
              '<option value="perda">Perda</option>' +
              '<option value="inventario">Inventário</option>' +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Quantidade *</label><input id="mm-qtd" type="number" step="0.01" class="pcp-input" value="0" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Operador</label><input id="mm-operador" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Setor</label>' +
            '<select id="mm-setor" class="pcp-select" style="width:100%;margin-top:4px">' +
              ['Produção','Manutenção','Expedição','Limpeza','Outro'].map(function(s) { return '<option value="' + safeAttr(s) + '">' + esc(s) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div><label style="color:var(--text2);font-size:12px">Custo unitário (R$)</label><input id="mm-custo" type="number" step="0.01" class="pcp-input" value="0" style="width:100%;margin-top:4px"></div>' +
          '<div><label style="color:var(--text2);font-size:12px">Motivo</label><input id="mm-motivo" class="pcp-input" value="" style="width:100%;margin-top:4px"></div>' +
          '<div style="grid-column:1/-1"><label style="color:var(--text2);font-size:12px">Observações</label><textarea id="mm-obs" class="pcp-input" style="width:100%;margin-top:4px;min-height:80px;resize:vertical"></textarea></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
          '<button id="mm-cancelar" class="pcp-btn">Cancelar</button>' +
          '<button id="mm-confirmar" class="pcp-btn primary">Confirmar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('mm-fechar').onclick = function() { fechaModalById('modal-mov-material'); };
    document.getElementById('mm-cancelar').onclick = function() { fechaModalById('modal-mov-material'); };
    document.getElementById('mm-confirmar').onclick = function() { window._movimentarMaterial(String(m.id || '')); };
  }

  async function _salvarMaterial(id) {
    var payload = {
      nome: _getInputVal('nm-nome'),
      codigo: _getInputVal('nm-codigo'),
      categoria: _getInputVal('nm-categoria'),
      subcategoria: _getInputVal('nm-subcategoria'),
      marca: _getInputVal('nm-marca'),
      fornecedor: _getInputVal('nm-fornecedor'),
      unidade: _getInputVal('nm-unidade'),
      codigo_barras: _getInputVal('nm-codbarras'),
      validade: _getInputVal('nm-validade') || null,
      quantidade_atual: _getNumVal('nm-qtd'),
      quantidade_minima: _getNumVal('nm-qtd-min'),
      quantidade_ideal: _getNumVal('nm-qtd-ideal'),
      quantidade_maxima: _getNumVal('nm-qtd-max'),
      custo_medio: _getNumVal('nm-custo-medio'),
      ultimo_custo: _getNumVal('nm-ultimo-custo'),
      localizacao_corredor: _getInputVal('nm-loc-cor'),
      localizacao_prateleira: _getInputVal('nm-loc-pra'),
      localizacao_caixa: _getInputVal('nm-loc-cai'),
      descricao: (function() { var el = document.getElementById('nm-desc'); return el ? String(el.value || '') : ''; })(),
      observacoes: (function() { var el = document.getElementById('nm-obs'); return el ? String(el.value || '') : ''; })(),
      ativo: true
    };
    if (!payload.nome) { alert('Nome é obrigatório'); return; }
    if (!payload.categoria) { alert('Categoria é obrigatória'); return; }
    var token = _getToken();
    var method = id ? 'PATCH' : 'POST';
    var url = id ? ('/api/estoque_materiais/' + encodeURIComponent(id)) : '/api/estoque_materiais';
    var resp = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
      body: JSON.stringify(payload)
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && (json.ok || json.id)) {
      fechaModalById('modal-novo-material');
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueMateriais(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  async function _excluirMaterial(id) {
    if (!id) return;
    if (!confirm('Desativar este material?')) return;
    var token = _getToken();
    var resp = await fetch('/api/estoque_materiais/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { 'Authorization': token ? ('Bearer ' + token) : '' }
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && (json.ok || json.data)) {
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueMateriais(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  async function _movimentarMaterial(id) {
    if (!id) return;
    var payload = {
      tipo: _getInputVal('mm-tipo'),
      quantidade: _getNumVal('mm-qtd'),
      operador: _getInputVal('mm-operador'),
      setor: _getInputVal('mm-setor'),
      motivo: _getInputVal('mm-motivo'),
      custo_unitario: _getNumVal('mm-custo'),
      observacoes: (function() { var el = document.getElementById('mm-obs'); return el ? String(el.value || '') : ''; })(),
    };
    if (!payload.tipo || payload.quantidade <= 0) { alert('Tipo e quantidade são obrigatórios'); return; }
    var token = _getToken();
    var resp = await fetch('/api/estoque_materiais/' + encodeURIComponent(id) + '/movimentar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
      body: JSON.stringify(payload)
    });
    var json = await resp.json().catch(function() { return null; });
    if (json && json.ok) {
      fechaModalById('modal-mov-material');
      var host = document.getElementById('patch-page-body') || document.getElementById('patch-page-host');
      _renderEstoqueMateriais(host);
      return;
    }
    alert('Erro: ' + ((json && (json.error || json.message)) || 'desconhecido'));
  }

  window._abrirModalNovaTinta = _abrirModalNovaTinta;
  window._salvarTinta = _salvarTinta;
  window._movimentarTinta = _movimentarTinta;
  window._abrirModalMovTinta = _abrirModalMovTinta;
  window._excluirTinta = _excluirTinta;
  window._abrirModalNovoMaterial = _abrirModalNovoMaterial;
  window._salvarMaterial = _salvarMaterial;
  window._movimentarMaterial = _movimentarMaterial;
  window._abrirModalMovMaterial = _abrirModalMovMaterial;
  window._excluirMaterial = _excluirMaterial;

  function _renderEstoqueTintas(main) {
    main = main || getMainPatchHost('estoque-tintas', '🎨 Estoque de Tintas');
    if (!main) return;
    _ensureEstoqueStyle();
    main.innerHTML =
      '<div id="patch-estoque-bc-tintas" style="background:linear-gradient(135deg,#0f172a,#1e293b);border-left:4px solid #f59e0b;border-radius:8px;padding:12px 20px;margin-bottom:16px">' +
        '<div style="font-size:16px;font-weight:700;color:#e2e8f0">📦 ESTOQUES  ›  🟡 Estoque de Tintas</div>' +
        '<div id="patch-estoque-bc-tintas-sub" style="font-size:12px;color:#64748b;margin-top:2px">Carregando...</div>' +
      '</div>' +
      '<div id="patch-tintas">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' +
          '<button class="pcp-btn primary" id="btn-nova-tinta" type="button">+ Nova Tinta</button>' +
          '<input id="patch-tintas-q" class="pcp-input" placeholder="🔍 buscar..." style="min-width:220px;flex:1" />' +
          '<select id="patch-tintas-filtro" class="pcp-select" style="min-width:220px">' +
            '<option value="">Todos</option>' +
            '<option value="critico">Crítico</option>' +
            '<option value="baixo">Alerta</option>' +
            '<option value="ok">OK</option>' +
            '<option value="vencendo">Vencendo</option>' +
          '</select>' +
        '</div>' +
        '<div id="patch-tintas-body" style="color:var(--text2);padding:20px">Carregando...</div>' +
      '</div>';

    var inputQ = document.getElementById('patch-tintas-q');
    var selF = document.getElementById('patch-tintas-filtro');
    var body = document.getElementById('patch-tintas-body');
    document.getElementById('btn-nova-tinta').onclick = function() { window._abrirModalNovaTinta(null); };

    function renderRows(list) {
      var q = String(inputQ && inputQ.value || '').trim().toLowerCase();
      var f = String(selF && selF.value || '').trim();
      var rows = (Array.isArray(list) ? list : []).map(function(t) {
        var qtd = num(t && t.quantidade_atual);
        var min = num(t && t.quantidade_minima);
        var st = _calcStatus(qtd, min);
        var venc = _isVencendo(t && (t.validade || t.data_validade));
        return { raw: t, qtd: qtd, min: min, st: st, venc: venc };
      }).filter(function(x) {
        if (f === 'vencendo') return x.venc;
        if (f && x.st !== f) return false;
        if (!q) return true;
        var t = x.raw || {};
        var blob = [
          t.nome, t.codigo, t.pantone, t.tipo, t.fabricante, t.fornecedor, t.lote
        ].map(function(v) { return String(v || '').toLowerCase(); }).join(' ');
        return blob.indexOf(q) >= 0;
      });

      window.__ESTOQUE_TINTAS_CACHE = rows.map(function(x) { return x.raw; });
      window.__ESTOQUE_TINTAS_BYID = Object.create(null);
      rows.forEach(function(x) { var id = String(x.raw && x.raw.id || '').trim(); if (id) window.__ESTOQUE_TINTAS_BYID[id] = x.raw; });

      if (!rows.length) {
        body.innerHTML = '<div style="color:var(--text2);padding:40px;text-align:center">Nenhuma tinta encontrada</div>';
        return;
      }

      body.innerHTML =
        '<table class="pcp-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Nome</th>' +
              '<th>Cor</th>' +
              '<th>Tipo</th>' +
              '<th>Fabricante</th>' +
              '<th style="text-align:center">Qtd Atual</th>' +
              '<th style="text-align:center">Unidade</th>' +
              '<th style="text-align:center">Mínimo</th>' +
              '<th style="text-align:center">Status</th>' +
              '<th style="text-align:center">Validade</th>' +
              '<th style="text-align:right">Ações</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            rows.map(function(x) {
              var t = x.raw || {};
              var id = String(t.id || '');
              var validade = t.validade || t.data_validade || '';
              return '<tr>' +
                '<td>' + esc(t.nome || '-') + '</td>' +
                '<td class="muted">' + esc(t.cor || '-') + '</td>' +
                '<td class="muted">' + esc(t.tipo || '-') + '</td>' +
                '<td class="muted">' + esc(t.fabricante || t.fornecedor || '-') + '</td>' +
                '<td style="text-align:center;font-weight:900;color:' + (x.st === 'zerado' || x.st === 'critico' ? '#ef4444' : 'var(--text)') + '">' + esc(String(x.qtd)) + '</td>' +
                '<td style="text-align:center" class="muted">' + esc(t.unidade || '-') + '</td>' +
                '<td style="text-align:center" class="muted">' + esc(String(x.min)) + '</td>' +
                '<td style="text-align:center">' + _statusBadgeHtml(x.st, x.venc) + '</td>' +
                '<td style="text-align:center" class="muted">' + esc(validade ? _fmtDateISO(validade).split('-').reverse().join('/') : '-') + '</td>' +
                '<td style="text-align:right">' +
                  '<div class="pcp-actions">' +
                    '<button class="pcp-btn" type="button" data-pin-type="tinta" data-pin-id="' + safeAttr(id) + '" style="' + (window.__patchPinBtnStyleAttr ? window.__patchPinBtnStyleAttr('tinta', id) : '') + '" onclick="window.__patchOpenPinModal && window.__patchOpenPinModal(\'tinta\',\'' + safeAttr(id) + '\',\'Tinta\')">📌</button>' +
                    '<button class="pcp-btn" type="button" onclick="window._abrirModalMovTinta(window.__ESTOQUE_TINTAS_BYID[\'' + safeAttr(id) + '\'])">Movimentar ↕</button>' +
                    '<button class="pcp-btn" type="button" onclick="window._abrirModalNovaTinta(window.__ESTOQUE_TINTAS_BYID[\'' + safeAttr(id) + '\'])">Editar ✏</button>' +
                    '<button class="pcp-btn danger" type="button" onclick="window._excluirTinta(\'' + safeAttr(id) + '\')">Excluir 🗑</button>' +
                  '</div>' +
                '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>';
    }

    function wireFilters(list) {
      if (inputQ) inputQ.oninput = function() { renderRows(list); };
      if (selF) selF.onchange = function() { renderRows(list); };
      renderRows(list);
    }

    fetch('/api/estoque_tintas', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        var data = res && (res.data || res) || [];
        if (!Array.isArray(data)) data = [];
        try {
          var sub = document.getElementById('patch-estoque-bc-tintas-sub');
          if (sub) sub.textContent = String(data.length) + ' itens cadastrados · Atualizado agora';
        } catch (_) {}
        wireFilters(data);
      })
      .catch(function(e) {
        body.innerHTML = '<div style="color:#f75a5a;padding:20px">Erro: ' + esc(e && e.message || e) + '</div>';
        try {
          var sub = document.getElementById('patch-estoque-bc-tintas-sub');
          if (sub) sub.textContent = 'Falha ao carregar · Tente novamente';
        } catch (_) {}
      });
  }

  function _renderEstoqueMateriais(main) {
    main = main || getMainPatchHost('estoque-materiais', '🔧 Estoque de Materiais');
    if (!main) return;
    _ensureEstoqueStyle();
    main.innerHTML =
      '<div id="patch-estoque-bc-materiais" style="background:linear-gradient(135deg,#0f172a,#1e293b);border-left:4px solid #10b981;border-radius:8px;padding:12px 20px;margin-bottom:16px">' +
        '<div style="font-size:16px;font-weight:700;color:#e2e8f0">📦 ESTOQUES  ›  🔧 Estoque de Materiais</div>' +
        '<div id="patch-estoque-bc-materiais-sub" style="font-size:12px;color:#64748b;margin-top:2px">Carregando...</div>' +
      '</div>' +
      '<div id="patch-materiais">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' +
          '<button class="pcp-btn primary" id="btn-novo-material" type="button">+ Novo Material</button>' +
          '<input id="patch-mat-q" class="pcp-input" placeholder="🔍 buscar..." style="min-width:220px;flex:1" />' +
          '<select id="patch-mat-cat" class="pcp-select" style="min-width:220px"><option value="">Todas categorias</option></select>' +
          '<select id="patch-mat-filtro" class="pcp-select" style="min-width:180px">' +
            '<option value="">Todos</option>' +
            '<option value="critico">Crítico</option>' +
            '<option value="baixo">Alerta</option>' +
            '<option value="ok">OK</option>' +
            '<option value="vencendo">Vencendo</option>' +
          '</select>' +
        '</div>' +
        '<div id="patch-materiais-body" style="color:var(--text2);padding:20px">Carregando...</div>' +
      '</div>';

    var inputQ = document.getElementById('patch-mat-q');
    var selCat = document.getElementById('patch-mat-cat');
    var selF = document.getElementById('patch-mat-filtro');
    var body = document.getElementById('patch-materiais-body');
    document.getElementById('btn-novo-material').onclick = function() { window._abrirModalNovoMaterial(null); };

    function renderList(list) {
      var q = String(inputQ && inputQ.value || '').trim().toLowerCase();
      var cat = String(selCat && selCat.value || '').trim();
      var f = String(selF && selF.value || '').trim();

      var rows = (Array.isArray(list) ? list : []).map(function(m) {
        var qtd = num(m && (m.quantidade_atual != null ? m.quantidade_atual : m.quantidade));
        var min = num(m && (m.quantidade_minima != null ? m.quantidade_minima : m.estoque_minimo));
        var st = _calcStatus(qtd, min);
        var venc = _isVencendo(m && (m.validade || m.data_validade));
        var categoria = String((m && (m.categoria || '')) || 'Sem categoria').trim() || 'Sem categoria';
        var loc = [m.localizacao_corredor, m.localizacao_prateleira, m.localizacao_caixa].filter(Boolean).join('-') || (m.localizacao || '');
        return { raw: m, qtd: qtd, min: min, st: st, venc: venc, categoria: categoria, loc: loc };
      }).filter(function(x) {
        if (cat && x.categoria !== cat) return false;
        if (f === 'vencendo') return x.venc;
        if (f && x.st !== f) return false;
        if (!q) return true;
        var m = x.raw || {};
        var blob = [
          m.codigo, m.nome, m.marca, m.categoria, m.subcategoria, m.fornecedor, m.codigo_barras
        ].map(function(v) { return String(v || '').toLowerCase(); }).join(' ');
        return blob.indexOf(q) >= 0;
      });

      window.__ESTOQUE_MATERIAIS_CACHE = rows.map(function(x) { return x.raw; });
      window.__ESTOQUE_MATERIAIS_BYID = Object.create(null);
      rows.forEach(function(x) { var id = String(x.raw && x.raw.id || '').trim(); if (id) window.__ESTOQUE_MATERIAIS_BYID[id] = x.raw; });

      if (!rows.length) {
        body.innerHTML = '<div style="color:var(--text2);padding:40px;text-align:center">Nenhum material encontrado</div>';
        return;
      }

      var grupos = {};
      rows.forEach(function(x) {
        if (!grupos[x.categoria]) grupos[x.categoria] = [];
        grupos[x.categoria].push(x);
      });
      var cats = Object.keys(grupos).sort(function(a, b) { return a.localeCompare(b); });

      body.innerHTML =
        cats.map(function(categoria) {
          var items = grupos[categoria] || [];
          return '<details open style="margin-bottom:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 12px">' +
            '<summary style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--text);font-weight:900">' +
              '<span>' + esc(categoria) + '</span>' +
              '<span style="color:var(--text2);font-weight:800;font-size:12px">' + esc(String(items.length)) + ' itens</span>' +
            '</summary>' +
            '<div style="margin-top:10px;overflow:auto">' +
              '<table class="pcp-table">' +
                '<thead>' +
                  '<tr>' +
                    '<th>Código</th>' +
                    '<th>Nome</th>' +
                    '<th>Marca</th>' +
                    '<th style="text-align:center">Qtd Atual</th>' +
                    '<th style="text-align:center">Unidade</th>' +
                    '<th style="text-align:center">Mínimo</th>' +
                    '<th>Localização</th>' +
                    '<th style="text-align:center">Status</th>' +
                    '<th style="text-align:right">Ações</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' +
                  items.map(function(x) {
                    var m = x.raw || {};
                    var id = String(m.id || '');
                    return '<tr>' +
                      '<td class="muted">' + esc(m.codigo || '-') + '</td>' +
                      '<td>' + esc(m.nome || '-') + '</td>' +
                      '<td class="muted">' + esc(m.marca || '-') + '</td>' +
                      '<td style="text-align:center;font-weight:900;color:' + (x.st === 'zerado' || x.st === 'critico' ? '#ef4444' : 'var(--text)') + '">' + esc(String(x.qtd)) + '</td>' +
                      '<td style="text-align:center" class="muted">' + esc(m.unidade || '-') + '</td>' +
                      '<td style="text-align:center" class="muted">' + esc(String(x.min)) + '</td>' +
                      '<td class="muted">' + esc(x.loc || '-') + '</td>' +
                      '<td style="text-align:center">' + _statusBadgeHtml(x.st, x.venc) + '</td>' +
                      '<td style="text-align:right">' +
                        '<div class="pcp-actions">' +
                          '<button class="pcp-btn" type="button" data-pin-type="material" data-pin-id="' + safeAttr(id) + '" style="' + (window.__patchPinBtnStyleAttr ? window.__patchPinBtnStyleAttr('material', id) : '') + '" onclick="window.__patchOpenPinModal && window.__patchOpenPinModal(\'material\',\'' + safeAttr(id) + '\',\'Material\')">📌</button>' +
                          '<button class="pcp-btn" type="button" onclick="window._abrirModalMovMaterial(window.__ESTOQUE_MATERIAIS_BYID[\'' + safeAttr(id) + '\'])">Movimentar ↕</button>' +
                          '<button class="pcp-btn" type="button" onclick="window._abrirModalNovoMaterial(window.__ESTOQUE_MATERIAIS_BYID[\'' + safeAttr(id) + '\'])">Editar ✏</button>' +
                          '<button class="pcp-btn danger" type="button" onclick="window._excluirMaterial(\'' + safeAttr(id) + '\')">Excluir 🗑</button>' +
                        '</div>' +
                      '</td>' +
                    '</tr>';
                  }).join('') +
                '</tbody>' +
              '</table>' +
            '</div>' +
          '</details>';
        }).join('');
    }

    function fillCategorias(list) {
      var set = {};
      (Array.isArray(list) ? list : []).forEach(function(m) {
        var c = String(m && m.categoria || '').trim();
        if (!c) return;
        set[c] = 1;
      });
      var cats = Object.keys(set).sort(function(a, b) { return a.localeCompare(b); });
      if (selCat) {
        cats.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          selCat.appendChild(opt);
        });
      }
    }

    function wire(list) {
      fillCategorias(list);
      if (inputQ) inputQ.oninput = function() { renderList(list); };
      if (selCat) selCat.onchange = function() { renderList(list); };
      if (selF) selF.onchange = function() { renderList(list); };
      renderList(list);
    }

    fetch('/api/estoque_materiais', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        var data = res && (res.data || res) || [];
        if (!Array.isArray(data)) data = [];
        try {
          var sub = document.getElementById('patch-estoque-bc-materiais-sub');
          if (sub) sub.textContent = String(data.length) + ' itens cadastrados · Atualizado agora';
        } catch (_) {}
        wire(data);
      })
      .catch(function(e) {
        body.innerHTML = '<div style="color:#f75a5a;padding:20px">Erro: ' + esc(e && e.message || e) + '</div>';
        try {
          var sub = document.getElementById('patch-estoque-bc-materiais-sub');
          if (sub) sub.textContent = 'Falha ao carregar · Tente novamente';
        } catch (_) {}
      });
  }

  function _renderDashboardEstoques(main) {
    main = main || getMainPatchHost('estoque-dashboard', '📊 Dashboard Estoques');
    if (!main) return;
    _ensureEstoqueStyle();
    main.innerHTML =
      '<div id="patch-estoque-bc-dashboard" style="background:linear-gradient(135deg,#0f172a,#1e293b);border-left:4px solid #3b82f6;border-radius:8px;padding:12px 20px;margin-bottom:16px">' +
        '<div style="font-size:16px;font-weight:700;color:#e2e8f0">📦 ESTOQUES  ›  📊 Dashboard de Estoques</div>' +
        '<div style="font-size:12px;color:#64748b;margin-top:2px">Visão consolidada de todos os estoques</div>' +
      '</div>' +
      '<div id="patch-dashboard-estoques">' +
        '<div id="patch-dashboard-body" style="color:var(--text2);padding:20px">Carregando...</div>' +
      '</div>';

    function fmtBRL(v) {
      var n = Number(v || 0) || 0;
      try { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); } catch (_) { return 'R$ ' + String(n.toFixed(2)); }
    }

    fetch('/api/dashboard/estoques-resumo', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        var container = document.getElementById('patch-dashboard-body');
        if (!container) return;
        if (!res || res.ok === false) throw new Error((res && res.error) || 'Falha ao carregar dashboard');
        var chapas = res.chapas || {};
        var tintas = res.tintas || {};
        var materiais = res.materiais || {};
        var movs = Array.isArray(res.movimentacoes_recentes) ? res.movimentacoes_recentes : [];

        var valCh = Number(chapas.valor_total || 0) || 0;
        var valTi = Number(tintas.valor_total || 0) || 0;
        var valMa = Number(materiais.valor_total || 0) || 0;
        var totalValor = valCh + valTi + valMa;
        var totalCriticos = (Number(chapas.criticos || 0) || 0) + (Number(tintas.criticos || 0) || 0) + (Number(materiais.criticos || 0) || 0);
        var vencendo30 = Number(tintas.vencendo || 0) || 0;
        var totalItens = (Number(chapas.total_itens || 0) || 0) + (Number(tintas.total_itens || 0) || 0) + (Number(materiais.total_itens || 0) || 0);

        var pct = function(v) { return totalValor > 0 ? Math.round((v / totalValor) * 1000) / 10 : 0; };
        var pctCh = pct(valCh);
        var pctTi = pct(valTi);
        var pctMa = pct(valMa);

        var barSeg = function(color, p) {
          var w = Math.max(0, Math.min(100, Number(p || 0) || 0));
          return '<div style="height:100%;width:' + w + '%;background:' + color + '"></div>';
        };

        var movIcon = function(tipo) {
          var s = String(tipo || '').toLowerCase();
          if (s.indexOf('entrada') >= 0) return '➕';
          if (s.indexOf('saida') >= 0) return '➖';
          if (s.indexOf('ajuste') >= 0) return '🛠️';
          if (s.indexOf('baixa') >= 0) return '✅';
          return '↕';
        };

        container.innerHTML =
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:14px">' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
              '<div style="color:var(--text2);font-size:12px">💰 Valor Total</div>' +
              '<div style="color:var(--text);font-size:22px;font-weight:1000;margin-top:4px">' + esc(fmtBRL(totalValor)) + '</div>' +
            '</div>' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
              '<div style="color:var(--text2);font-size:12px">🔴 Itens Críticos</div>' +
              '<div style="color:#ef4444;font-size:22px;font-weight:1000;margin-top:4px">' + esc(String(totalCriticos)) + '</div>' +
            '</div>' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
              '<div style="color:var(--text2);font-size:12px">🕒 Vencendo 30d</div>' +
              '<div style="color:#f59e0b;font-size:22px;font-weight:1000;margin-top:4px">' + esc(String(vencendo30)) + '</div>' +
            '</div>' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
              '<div style="color:var(--text2);font-size:12px">📦 Total</div>' +
              '<div style="color:var(--text);font-size:22px;font-weight:1000;margin-top:4px">' + esc(String(totalItens)) + '</div>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-bottom:14px">' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;border-top:3px solid #f59e0b">' +
              '<div style="font-weight:950;color:var(--text);margin-bottom:6px">🟡 TINTAS</div>' +
              '<div style="color:var(--text2);font-size:12px">' + esc(String(tintas.total_itens || 0)) + ' itens</div>' +
              '<div style="color:var(--text);font-size:18px;font-weight:1000;margin-top:6px">' + esc(fmtBRL(valTi)) + '</div>' +
              '<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">' +
                '<div>● <span style="color:#ef4444;font-weight:900">Críticos:</span> ' + esc(String(tintas.criticos || 0)) + '</div>' +
                '<div>● <span style="color:#f59e0b;font-weight:900">Alertas:</span> ' + esc(String(tintas.alertas || 0)) + '</div>' +
                '<div>● <span style="color:#10b981;font-weight:900">OK:</span> ' + esc(String(tintas.ok || 0)) + '</div>' +
                '<div>● <span style="color:#f59e0b;font-weight:900">Venc.:</span> ' + esc(String(tintas.vencendo || 0)) + '</div>' +
              '</div>' +
              '<div style="margin-top:12px"><button class="pcp-btn" type="button" id="btn-abre-tintas">Abrir Tintas</button></div>' +
            '</div>' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;border-top:3px solid #3b82f6">' +
              '<div style="font-weight:950;color:var(--text);margin-bottom:6px">🟦 CHAPAS</div>' +
              '<div style="color:var(--text2);font-size:12px">' + esc(String(chapas.total_itens || 0)) + ' itens</div>' +
              '<div style="color:var(--text);font-size:18px;font-weight:1000;margin-top:6px">' + esc(fmtBRL(valCh)) + '</div>' +
              '<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">' +
                '<div>● <span style="color:#ef4444;font-weight:900">Críticos:</span> ' + esc(String(chapas.criticos || 0)) + '</div>' +
                '<div>● <span style="color:#f59e0b;font-weight:900">Alertas:</span> ' + esc(String(chapas.alertas || 0)) + '</div>' +
                '<div>● <span style="color:#10b981;font-weight:900">OK:</span> ' + esc(String(chapas.ok || 0)) + '</div>' +
              '</div>' +
              '<div style="margin-top:12px"><button class="pcp-btn" type="button" id="btn-abre-chapas">Abrir Chapas</button></div>' +
            '</div>' +
            '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;border-top:3px solid #10b981">' +
              '<div style="font-weight:950;color:var(--text);margin-bottom:6px">🔧 MATERIAIS</div>' +
              '<div style="color:var(--text2);font-size:12px">' + esc(String(materiais.total_itens || 0)) + ' itens</div>' +
              '<div style="color:var(--text);font-size:18px;font-weight:1000;margin-top:6px">' + esc(fmtBRL(valMa)) + '</div>' +
              '<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">' +
                '<div>● <span style="color:#ef4444;font-weight:900">Críticos:</span> ' + esc(String(materiais.criticos || 0)) + '</div>' +
                '<div>● <span style="color:#f59e0b;font-weight:900">Alertas:</span> ' + esc(String(materiais.alertas || 0)) + '</div>' +
                '<div>● <span style="color:#10b981;font-weight:900">OK:</span> ' + esc(String(materiais.ok || 0)) + '</div>' +
              '</div>' +
              '<div style="margin-top:12px"><button class="pcp-btn" type="button" id="btn-abre-materiais">Abrir Materiais</button></div>' +
            '</div>' +
          '</div>' +

          '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:14px">' +
            '<div style="font-weight:950;color:var(--text);margin-bottom:10px">Distribuição do valor</div>' +
            '<div style="height:14px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,0.08);display:flex">' +
              barSeg('#3b82f6', pctCh) + barSeg('#f59e0b', pctTi) + barSeg('#10b981', pctMa) +
            '</div>' +
            '<div style="color:var(--text2);font-size:12px;margin-top:10px">' +
              'Chapas: ' + esc(String(pctCh.toFixed(1))) + '% · Tintas: ' + esc(String(pctTi.toFixed(1))) + '% · Materiais: ' + esc(String(pctMa.toFixed(1))) + '%' +
            '</div>' +
          '</div>' +

          '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">' +
            '<div style="font-weight:950;color:var(--text);margin-bottom:10px">Movimentações recentes</div>' +
            (movs.length ? (
              '<div style="display:flex;flex-direction:column;gap:8px">' +
                movs.slice(0, 10).map(function(m) {
                  var dt = String(m.created_at || m.updated_at || '');
                  var d = dt ? new Date(dt) : null;
                  var show = d && Number.isFinite(d.getTime()) ? (String(d.toLocaleDateString('pt-BR')) + ' ' + String(d.toLocaleTimeString('pt-BR')).slice(0, 5)) : '-';
                  return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px;background:rgba(0,0,0,0.10)">' +
                    '<div style="min-width:0">' +
                      '<div style="font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(movIcon(m.tipo)) + ' ' + esc(String(m.categoria || '-')) + ' · ' + esc(String(m.item || m.nome || m.material_nome || m.tinta_nome || m.nomenclatura || '-')) + '</div>' +
                      '<div style="color:var(--text2);font-size:12px;margin-top:2px">' + esc(show) + (m.operador ? (' · ' + esc(String(m.operador))) : '') + '</div>' +
                    '</div>' +
                    '<div style="font-weight:1000;color:var(--text)">' + esc(String(m.quantidade ?? m.delta ?? 0)) + '</div>' +
                  '</div>';
                }).join('') +
              '</div>'
            ) : '<div style="color:var(--text2);padding:8px 0">Nenhuma movimentação recente</div>') +
          '</div>';

        try {
          var bt = document.getElementById('btn-abre-tintas');
          if (bt) bt.onclick = function() { try { go('estoque-tintas'); } catch (_) {} };
          var bc = document.getElementById('btn-abre-chapas');
          if (bc) bc.onclick = function() { try { go('chapas'); } catch (_) { try { go('chapas-estoque'); } catch (__) {} } };
          var bm = document.getElementById('btn-abre-materiais');
          if (bm) bm.onclick = function() { try { go('estoque-materiais'); } catch (_) {} };
        } catch (_) {}
      })
      .catch(function(e) {
        var c = document.getElementById('patch-dashboard-body');
        if (c) c.innerHTML = '<div style="padding:20px;color:#f75a5a">Erro ao carregar dashboard: ' + esc(e && e.message || e) + '</div>';
      });
  }

  function patchGo() {
    var orig = window.go;
    if (typeof orig !== 'function' || orig._patchClientesEstoquesCustom) return;
    var wrapped = async function(tela) {
      var page = String(tela || '');
      if (page === 'estoque-tintas') {
        var hostTintas = getMainPatchHost('estoque-tintas', '🎨 Estoque de Tintas');
        _renderEstoqueTintas(hostTintas);
        return;
      }
      if (page === 'estoque-materiais') {
        var hostMateriais = getMainPatchHost('estoque-materiais', '🔧 Estoque de Materiais');
        _renderEstoqueMateriais(hostMateriais);
        return;
      }
      if (page === 'estoque-dashboard') {
        var hostDash = getMainPatchHost('estoque-dashboard', '📊 Dashboard Estoques');
        _renderDashboardEstoques(hostDash);
        return;
      }
      hidePatchHost();
      var r = orig.apply(this, arguments);
      if (page === 'clientes') {
        setTimeout(function() {
          try { _resetFiltrosClientes(); } catch (_) {}
          try { _carregarTodosClientes(); } catch (_) {}
          try { window._clientesCarregados = false; } catch (_) {}
          try {
            if (typeof carregarClientes === 'function') {
              Promise.resolve(carregarClientes(true)).catch(function() { try { return carregarClientes(); } catch (_) {} });
            }
          } catch (_) {}
          try { if (typeof renderClientes === 'function') setTimeout(renderClientes, 120); } catch (_) {}
          try {
            var w = document.querySelector('#page-clientes #widget-analise-clientes');
            if (w) w.style.display = 'none';
          } catch (_) {}
          try {
            var grid = document.getElementById('cli-grid') || document.querySelector('#page-clientes #cli-grid');
            if (grid) grid.style.display = '';
            var lista = document.getElementById('clientes-lista') || document.querySelector('#page-clientes #clientes-lista');
            if (lista) lista.style.display = '';
          } catch (_) {}
        }, 400);
      }
      runAfterGoEffects(page);
      return r;
    };
    wrapped._patchClientesEstoquesCustom = true;
    window.go = wrapped;
  }

  function init() {
    patchGo();
    setTimeout(patchGo, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

(function patchDashboardEstoques() {
  function cleanupAnalisesHost() {
    try {
      var host = document.getElementById('patch-estoque-dashboard');
      if (host && host.parentNode && host.parentNode.id === 'dash-body') host.remove();
    } catch (_) {}
  }

  cleanupAnalisesHost();
  function startCleanupAnalisesHost() {
    cleanupAnalisesHost();
    if (window.__cleanupAnalisesHostInterval) return;
    window.__cleanupAnalisesHostInterval = setInterval(function() {
      cleanupAnalisesHost();
    }, 1200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { startCleanupAnalisesHost(); });
  } else {
    startCleanupAnalisesHost();
  }
  return;

  function authHeaders() {
    var token = '';
    try { token = String(localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || ''); } catch (_) {}
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function ensureHost() {
    var dashBody = document.getElementById('dash-body');
    if (!dashBody) return null;
    var host = document.getElementById('patch-estoque-dashboard');
    if (!host) {
      host = document.createElement('div');
      host.id = 'patch-estoque-dashboard';
      host.style.marginBottom = '16px';
      try { dashBody.prepend(host); } catch (_) { dashBody.appendChild(host); }
    }
    return host;
  }

  function num(v) {
    var n = Number(v || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderDashboardEstoques(container) {
    if (!container) return;
    if (container.dataset.loading === '1') return;
    container.dataset.loading = '1';
    container.innerHTML = '<div style="padding:20px;color:var(--text2)">Carregando...</div>';

    fetch('/api/estoque_dashboard', { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res || res.ok === false) throw new Error((res && res.error) || 'Falha ao carregar dashboard');
        var tintas = res.tintas || { total: 0, criticos: 0, alertas: 0, ok: 0 };
        var chapas = res.chapas || { total: 0, criticos: 0, alertas: 0, ok: 0 };
        var cards = [
          { nome: 'Tintas', icon: '🎨', total: num(tintas.total), criticos: num(tintas.criticos), alertas: num(tintas.alertas), ok: num(tintas.ok), cor: '#f7923a' },
          { nome: 'Chapas', icon: '📦', total: num(chapas.total), criticos: num(chapas.criticos), alertas: num(chapas.alertas), ok: num(chapas.ok), cor: '#4f8ef7' }
        ];
        var tintasCriticas = (Array.isArray(res.tintas_data) ? res.tintas_data : []).filter(function(t) {
          return num(t && t.quantidade_atual) <= num(t && t.quantidade_minima);
        });
        container.innerHTML =
          '<div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">' +
            cards.map(function(c) {
              return '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;border-left:4px solid ' + c.cor + '">' +
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
                  '<span style="font-size:24px">' + c.icon + '</span>' +
                  '<div>' +
                    '<div style="font-weight:700;font-size:16px">' + esc(c.nome) + '</div>' +
                    '<div style="color:var(--text2);font-size:13px">' + esc(String(c.total)) + ' itens cadastrados</div>' +
                  '</div>' +
                '</div>' +
                '<div style="display:flex;gap:12px">' +
                  '<div style="flex:1;text-align:center;padding:10px;background:rgba(247,90,90,0.1);border-radius:8px">' +
                    '<div style="font-size:22px;font-weight:700;color:#f75a5a">' + esc(String(c.criticos)) + '</div>' +
                    '<div style="font-size:11px;color:var(--text2)">Críticos</div>' +
                  '</div>' +
                  '<div style="flex:1;text-align:center;padding:10px;background:rgba(247,146,58,0.1);border-radius:8px">' +
                    '<div style="font-size:22px;font-weight:700;color:#f7923a">' + esc(String(c.alertas)) + '</div>' +
                    '<div style="font-size:11px;color:var(--text2)">Alertas</div>' +
                  '</div>' +
                  '<div style="flex:1;text-align:center;padding:10px;background:rgba(62,207,142,0.1);border-radius:8px">' +
                    '<div style="font-size:22px;font-weight:700;color:#3ecf8e">' + esc(String(c.ok)) + '</div>' +
                    '<div style="font-size:11px;color:var(--text2)">OK</div>' +
                  '</div>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
          (tintasCriticas.length
            ? '<div style="padding:0 16px 16px">' +
                '<div style="font-weight:600;margin-bottom:10px;color:var(--text)">🚨 Tintas em nível crítico</div>' +
                '<table style="width:100%;border-collapse:collapse">' +
                  '<thead><tr style="color:var(--text2);font-size:12px">' +
                    '<th style="text-align:left;padding:8px">Nome</th>' +
                    '<th style="text-align:center;padding:8px">Atual</th>' +
                    '<th style="text-align:center;padding:8px">Mínimo</th>' +
                    '<th style="text-align:center;padding:8px">Unidade</th>' +
                  '</tr></thead>' +
                  '<tbody>' +
                    tintasCriticas.map(function(t) {
                      return '<tr style="border-top:1px solid var(--border)">' +
                        '<td style="padding:8px;font-size:13px">' + esc(t && t.nome || '') + '</td>' +
                        '<td style="padding:8px;text-align:center;color:#f75a5a;font-weight:600">' + esc(String(num(t && t.quantidade_atual))) + '</td>' +
                        '<td style="padding:8px;text-align:center;color:var(--text2)">' + esc(String(num(t && t.quantidade_minima))) + '</td>' +
                        '<td style="padding:8px;text-align:center;color:var(--text2)">' + esc(t && t.unidade || '-') + '</td>' +
                      '</tr>';
                    }).join('') +
                  '</tbody>' +
                '</table>' +
              '</div>'
            : '');
      })
      .catch(function(e) {
        container.innerHTML = '<div style="padding:20px;color:#f75a5a">Erro ao carregar dashboard: ' + esc(e && e.message || e) + '</div>';
      })
      .finally(function() {
        delete container.dataset.loading;
      });
  }

  function tryRender() {
    try {
      var page = document.getElementById('page-dashboard');
      if (!page || page.offsetParent === null) return;
      var host = ensureHost();
      if (!host) return;
      renderDashboardEstoques(host);
    } catch (_) {}
  }

  function patchRenderDashboard() {
    var orig = window.renderDashboard;
    if (typeof orig !== 'function' || orig._patchDashboardEstoques) return;
    var wrapped = function() {
      var r = orig.apply(this, arguments);
      setTimeout(tryRender, 100);
      return r;
    };
    wrapped._patchDashboardEstoques = true;
    window.renderDashboard = wrapped;
  }

  var obs = new MutationObserver(function(_, observer) {
    if (window._pausarObservers) return;
    try { patchRenderDashboard(); } catch (_) {}
    try { tryRender(); } catch (_) {}
    try {
      var host = document.getElementById('patch-estoque-dashboard');
      if (host && window.renderDashboard && window.renderDashboard._patchDashboardEstoques) {
        observer.disconnect();
      }
    } catch (_) {}
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      try { patchRenderDashboard(); } catch (_) {}
      try { obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] }); } catch (_) {}
      setTimeout(tryRender, 1200);
    });
  } else {
    try { patchRenderDashboard(); } catch (_) {}
    try { obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] }); } catch (_) {}
    setTimeout(tryRender, 1200);
  }
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
    var imgSafe = '';
    try { imgSafe = (window._urlValida && window._urlValida(String(d.img || '').trim())) ? String(d.img || '').trim() : ''; } catch (_) { imgSafe = ''; }
    var imgHTML = imgSafe
      ? '<img class="mob-of-img-thumb" src="' + imgSafe +
        '" onclick="_mobVerImagem(\'' + imgSafe + '\')" onerror="this.style.display=\'none\'">'
      : '';
    var btnA = d.id ? 'onclick="_mobAlterar(\'' + d.id + '\')"' : '';
    var btnC = d.id ? 'onclick="_mobCancelar(\'' + d.id + '\')"' : '';
    var pinStyle = '';
    try { pinStyle = window.__patchPinBtnStyleAttr ? window.__patchPinBtnStyleAttr('of', d.id || '') : 'color:#94a3b8;border-color:rgba(148,163,184,.28);background:rgba(148,163,184,.08);'; } catch (_) {}
    var btnP = d.id ? 'onclick="window.__patchOpenPinModal && window.__patchOpenPinModal(\'of\',\'' + d.id + '\',\'OF\')"' : '';
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
            '<button class="mob-of-btn" data-pin-type="of" data-pin-id="' + (d.id || '') + '" style="' + pinStyle + '" ' + btnP + '>📌</button>' +
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
    try {
      table.style.display = '';
      table.style.cssText = '';
    } catch (_) {}
    return;
  }

  function watchPCP() {
    var page = document.getElementById('page-pcp');
    if (!page) return;
    var obs = new MutationObserver(function(mutations, observer) {
      if (window._pausarObservers) return;
      mutations.forEach(function(m) {
        if (m.type !== 'attributes') return;
        var vis = page.style.display !== 'none' &&
                  !page.classList.contains('hidden');
        if (vis) {
          setTimeout(renderCards, 350);
          try { observer.disconnect(); } catch (_) {}
        }
      });
    });
    obs.observe(page, { attributes: true, attributeFilter: ['style','class'] });
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
    try {
      if (Array.isArray(src)) src = src[0];
    } catch (_) {}
    var s = '';
    try { s = String(src == null ? '' : src).trim(); } catch (_) { s = ''; }
    if (!s || s === '[]' || s === 'null' || s === 'undefined' || s === '[object Object]') s = '';
    try { if (!(window._urlValida && window._urlValida(s))) s = ''; } catch (_) { s = ''; }
    img.src = s;
    img.onerror = function() { try { this.style.display = 'none'; } catch (_) {} };
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

(function patchOfmaqAndHubIntelligence() {
  var originalSortByPriority = (typeof window.ordenarOFsPorPrioridade === 'function')
    ? window.ordenarOFsPorPrioridade
    : null;
  var originalRenderOfmaq = (typeof window.renderOFsPorMaquina === 'function')
    ? window.renderOFsPorMaquina
    : null;
  var originalCardOfmaq = (typeof window.cardOFMaquina === 'function')
    ? window.cardOFMaquina
    : null;
  function escHLocal(s) {
    try {
      return window.escH
        ? window.escH(s)
        : String(s == null ? '' : s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
    } catch (_) {
      return String(s == null ? '' : s);
    }
  }

  function escAttrLocal(s) {
    return escHLocal(s).replace(/`/g, '&#96;');
  }

  function getToken() {
    try {
      return String(
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        window._token ||
        ''
      );
    } catch (_) {
      return String(window._token || '');
    }
  }

  function getAuthHeader() {
    var token = getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  async function apiJson(url, opts) {
    var cfg = opts || {};
    if (typeof window.apiFetch === 'function') {
      var resp1 = await window.apiFetch(url, cfg);
      var data1 = await resp1.json().catch(function() { return null; });
      return { resp: resp1, data: data1 };
    }
    var headers = Object.assign({}, getAuthHeader(), cfg.headers || {});
    if (cfg.body && typeof cfg.body !== 'string' && !(cfg.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      cfg.body = JSON.stringify(cfg.body);
    }
    var resp = await fetch(url, Object.assign({}, cfg, { headers: headers }));
    var data = await resp.json().catch(function() { return null; });
    return { resp: resp, data: data };
  }

  function fmtDateBR(iso) {
    var s = String(iso || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '—';
    try {
      if (typeof window.fmtD === 'function') return window.fmtD(s);
    } catch (_) {}
    return s.split('-').reverse().join('/');
  }

  function fmtWeekdayDate(iso) {
    var s = String(iso || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return fmtDateBR(s);
    try {
      return new Date(s + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch (_) {
      return fmtDateBR(s);
    }
  }

  function ensureStyles() {
    if (document.getElementById('patch-ofmaq-hub-intelligence-style')) return;
    var st = document.createElement('style');
    st.id = 'patch-ofmaq-hub-intelligence-style';
    st.textContent = ''
      + '.patch-ofmaq-toolbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
      + '.patch-ofmaq-badges{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px}'
      + '.patch-ofmaq-color-dot{width:10px;height:10px;border-radius:999px;display:inline-block;border:1px solid rgba(255,255,255,0.18);box-shadow:0 0 0 2px rgba(0,0,0,0.18) inset}'
      + '.patch-ofmaq-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800;line-height:1.2;border:1px solid transparent}'
      + '.patch-ofmaq-chip.green{background:rgba(16,185,129,0.14);border-color:rgba(16,185,129,0.32);color:#34d399}'
      + '.patch-ofmaq-chip.yellow{background:rgba(245,158,11,0.14);border-color:rgba(245,158,11,0.35);color:#fbbf24}'
      + '.patch-ofmaq-chip.red{background:rgba(239,68,68,0.14);border-color:rgba(239,68,68,0.35);color:#fca5a5}'
      + '.patch-ofmaq-chip.darkred{background:rgba(127,17,17,0.45);border-color:rgba(239,68,68,0.45);color:#fecaca}'
      + '.patch-ofmaq-cap-badge{display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:900;line-height:1.2;border:1px solid rgba(255,255,255,0.08)}'
      + '.patch-ofmaq-cap-badge.ok{background:rgba(16,185,129,0.12);border-color:rgba(16,185,129,0.28);color:#34d399}'
      + '.patch-ofmaq-cap-badge.warn{background:rgba(245,158,11,0.12);border-color:rgba(245,158,11,0.3);color:#fbbf24}'
      + '.patch-ofmaq-cap-badge.bad{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.3);color:#fca5a5}'
      + '.patch-ofmaq-calendar-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:999px;background:rgba(74,144,217,0.18);color:#93c5fd;cursor:pointer;font-size:15px}'
      + '.patch-ofmaq-calendar-btn:hover{filter:brightness(1.12)}'
      + '.patch-ofmaq-setup-sep{margin:10px 0 6px;padding:7px 10px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);font-size:12px;font-weight:800;color:var(--text1)}'
      + '.patch-ofmaq-setup-subsep{margin:6px 0 4px;padding:6px 10px 6px 14px;border-left:3px solid rgba(74,144,217,0.6);background:rgba(74,144,217,0.06);border-radius:6px;font-size:11px;font-weight:700;color:var(--text2)}'
      + '.patch-ofmaq-economia{font-size:12px;color:#22c55e;font-weight:800;margin-top:4px}'
      + '#patch-ofmaq-reag-modal{position:fixed;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:10020;padding:16px}'
      + '#patch-ofmaq-reag-modal .patch-reag-card{width:min(460px,96vw);background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:18px 18px 16px;box-shadow:0 20px 60px rgba(0,0,0,0.38)}'
      + '#patch-ofmaq-reag-modal .patch-reag-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}'
      + '#patch-ofmaq-reag-modal .patch-reag-actions button{padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text1);cursor:pointer;font-size:13px}'
      + '#patch-ofmaq-reag-modal .patch-reag-actions button.primary{background:var(--accent);border-color:var(--accent);color:#fff}'
      + '#patch-ofmaq-redistrib-modal{position:fixed;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:10025;padding:16px}'
      + '#patch-ofmaq-redistrib-modal .box{width:min(980px,96vw);max-height:88vh;overflow:auto;background:var(--bg2);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px 16px 14px;box-shadow:0 30px 90px rgba(0,0,0,0.55)}'
      + '#patch-ofmaq-redistrib-modal .top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}'
      + '#patch-ofmaq-redistrib-modal .ttl{font-size:18px;font-weight:900;color:var(--text1)}'
      + '#patch-ofmaq-redistrib-modal .sub{margin-top:4px;color:var(--text2);font-size:12px}'
      + '#patch-ofmaq-redistrib-modal .close{background:transparent;border:1px solid rgba(255,255,255,0.14);color:var(--text1);border-radius:10px;padding:6px 10px;cursor:pointer}'
      + '#patch-ofmaq-redistrib-modal .chips{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 12px}'
      + '#patch-ofmaq-redistrib-modal .chip{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:var(--text1);border-radius:999px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:800}'
      + '#patch-ofmaq-redistrib-modal .chip.is-active{background:rgba(74,144,217,0.22);border-color:rgba(74,144,217,0.35);color:#eaf2ff}'
      + '#patch-ofmaq-redistrib-modal .list{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px}'
      + '#patch-ofmaq-redistrib-modal .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px}'
      + '#patch-ofmaq-redistrib-modal .row{display:flex;align-items:center;justify-content:space-between;gap:10px}'
      + '#patch-ofmaq-redistrib-modal .meta{color:var(--text2);font-size:12px;margin-top:6px;line-height:1.35}'
      + '#patch-ofmaq-redistrib-modal .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}'
      + '#patch-ofmaq-redistrib-modal .actions button{padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:var(--text1);cursor:pointer;font-size:12px;font-weight:800}'
      + '#patch-ofmaq-redistrib-modal .actions button.primary{background:var(--accent);border-color:var(--accent);color:#fff}'
      + '#patch-ofmaq-redistrib-modal .foot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08)}'
      + '#hub-inteligencia .patch-hub-intel-item{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;margin-bottom:8px;border-radius:8px;cursor:pointer;transition:filter 0.15s}'
      + '#hub-inteligencia .patch-hub-intel-item:hover{filter:brightness(1.12)}';
    document.head.appendChild(st);
  }

  function normalizeText(s) {
    var v = String(s || '').trim().toLowerCase();
    try { v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return v;
  }

  function parseDateOnly(v) {
    var s = String(v || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var d = new Date(s + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function addBusinessDays(base, days) {
    var d = new Date(base.getTime());
    var remaining = Math.max(0, Math.trunc(Number(days || 0) || 0));
    while (remaining > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) remaining -= 1;
    }
    return d;
  }

  function nextBusinessDate(offset) {
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    return addBusinessDays(start, offset || 1).toISOString().slice(0, 10);
  }

  function businessDaysDelta(dataEntrega) {
    var entrega = parseDateOnly(dataEntrega);
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (!entrega) return null;
    if (entrega.getTime() === hoje.getTime()) return 0;
    var forward = entrega > hoje;
    var from = forward ? new Date(hoje.getTime()) : new Date(entrega.getTime());
    var to = forward ? entrega : hoje;
    var count = 0;
    while (from < to) {
      from.setDate(from.getDate() + 1);
      if (from.getDay() !== 0 && from.getDay() !== 6) count += 1;
    }
    return forward ? count : -count;
  }

  window.diasUteisRestantes = function(dataEntrega) {
    var diff = businessDaysDelta(dataEntrega);
    return diff == null ? 0 : diff;
  };

  if (!window._CAPACIDADE_MAQUINA) {
    window._CAPACIDADE_MAQUINA = {
      semana: {
        periodos: [
          { inicio: '07:20', fim: '11:30' },
          { inicio: '13:30', fim: '17:30' }
        ],
        total_minutos: 490,
        uteis_minutos: 416,
      },
      sexta: {
        periodos: [
          { inicio: '05:00', fim: '12:00' }
        ],
        total_minutos: 420,
        uteis_minutos: 357,
      }
    };
  }
  if (typeof window._minutosUteisDia !== 'function') {
    window._minutosUteisDia = function(date) {
      var d = date instanceof Date ? date : new Date(date);
      var dow = d.getDay();
      if (dow === 0 || dow === 6) return 0;
      if (dow === 5) return (window._CAPACIDADE_MAQUINA && window._CAPACIDADE_MAQUINA.sexta ? window._CAPACIDADE_MAQUINA.sexta.uteis_minutos : 0) || 0;
      return (window._CAPACIDADE_MAQUINA && window._CAPACIDADE_MAQUINA.semana ? window._CAPACIDADE_MAQUINA.semana.uteis_minutos : 0) || 0;
    };
  }
  if (typeof window._diasUteis !== 'function') {
    window._diasUteis = function(dataInicio, dataFim) {
      var di = dataInicio instanceof Date ? new Date(dataInicio.getTime()) : new Date(dataInicio);
      var df = dataFim instanceof Date ? new Date(dataFim.getTime()) : new Date(dataFim);
      if (isNaN(di.getTime()) || isNaN(df.getTime())) return 0;
      di.setHours(0, 0, 0, 0);
      df.setHours(0, 0, 0, 0);
      var dias = 0;
      var d = new Date(di.getTime());
      while (d <= df) {
        var dow = d.getDay();
        if (dow !== 0 && dow !== 6) dias++;
        d.setDate(d.getDate() + 1);
      }
      return dias;
    };
  }

  function getOfDelivery(of) {
    return String(of && (of.data_entrega || of.ent || of.dataEntrega) || '').slice(0, 10);
  }

  function isUrgente(of) {
    return !!(of && (
      of.urgente === true || of.urgente === 1 || of.urgente === '1' ||
      of.urg === true || of.urg === 1 || of.urg === '1'
    ));
  }

  function sortOfsByPriorityLocal(ofs) {
    return (Array.isArray(ofs) ? ofs.slice() : []).sort(function(a, b) {
      var ua = isUrgente(a);
      var ub = isUrgente(b);
      if (ua !== ub) return ua ? -1 : 1;
      var da = getOfDelivery(a) || '9999-99-99';
      var db = getOfDelivery(b) || '9999-99-99';
      if (da !== db) return da.localeCompare(db);
      var ca = String(a && (a.created_at || a.updated_at || '') || '');
      var cb = String(b && (b.created_at || b.updated_at || '') || '');
      if (ca !== cb) return ca.localeCompare(cb);
      return String(a && (a.numero || a.of || '') || '').localeCompare(String(b && (b.numero || b.of || '') || ''));
    });
  }

  function getVisibleGroups() {
    var groups = window._ofmaqLastGroupOfs;
    return (groups && typeof groups === 'object') ? groups : {};
  }

  function getCurrentOfById(id) {
    var sid = String(id || '').trim();
    if (!sid) return null;
    var groups = getVisibleGroups();
    var keys = Object.keys(groups || {});
    for (var i = 0; i < keys.length; i += 1) {
      var list = Array.isArray(groups[keys[i]]) ? groups[keys[i]] : [];
      for (var j = 0; j < list.length; j += 1) {
        if (String(list[j] && list[j].id || '').trim() === sid) return list[j];
      }
    }
    var raw = Array.isArray(window.OFS) ? window.OFS : (Array.isArray(window._ofmaqBaseList) ? window._ofmaqBaseList : []);
    for (var k = 0; k < raw.length; k += 1) {
      if (String(raw[k] && raw[k].id || '').trim() === sid) return raw[k];
    }
    return null;
  }

  function getMachineListEl(maquina) {
    var mk = String(maquina || '').trim();
    if (!mk) return null;
    var all = Array.prototype.slice.call(document.querySelectorAll('.maq-body[data-maquina-id], .maq-ofs[data-maquina-id], [data-maquina-lista="1"][data-maquina-id]'));
    return all.find(function(el) {
      return String(el && (el.getAttribute('data-maquina-id') || el.getAttribute('data-maquina') || '') || '').trim() === mk;
    }) || null;
  }

  function _isoDateOnly(d) {
    try {
      var x = d instanceof Date ? d : new Date(d);
      if (isNaN(x.getTime())) return '';
      return new Date(x.getFullYear(), x.getMonth(), x.getDate()).toISOString().slice(0, 10);
    } catch (_) { return ''; }
  }

  function _capacidadeDia(date) {
    var d = date instanceof Date ? date : new Date(date);
    var dow = d.getDay();
    if (dow === 0 || dow === 6) return { uteis: 0, total: 0 };
    var cap = (dow === 5) ? (window._CAPACIDADE_MAQUINA && window._CAPACIDADE_MAQUINA.sexta) : (window._CAPACIDADE_MAQUINA && window._CAPACIDADE_MAQUINA.semana);
    return {
      uteis: Number(cap && cap.uteis_minutos || 0) || 0,
      total: Number(cap && cap.total_minutos || 0) || 0,
    };
  }

  function _getQtdOf(of) {
    try {
      var v = of ? (of.quantidade ?? of.qtd ?? of.qtd_pedida ?? of.qtdPedida ?? of.qtd_produzida) : null;
      if (v != null && v !== '') {
        var n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      var itens = of && of.itens;
      if (typeof itens === 'string') { try { itens = JSON.parse(itens); } catch (_) { itens = null; } }
      if (Array.isArray(itens) && itens[0]) {
        var v2 = itens[0].quantidade ?? itens[0].qtd ?? itens[0].qtd_pedida ?? null;
        var n2 = Number(v2);
        return Number.isFinite(n2) ? n2 : null;
      }
    } catch (_) {}
    return null;
  }

  function _velocidadeMaquina(maquina) {
    try {
      var md = typeof window.getDadosMaquina === 'function' ? window.getDadosMaquina(maquina) : null;
      if (md && typeof md === 'object') {
        var raw = md.velocidade ?? md.vel ?? md.velocidade_por_min ?? md.cx_min ?? md.caixas_min ?? null;
        if (raw != null && raw !== '') {
          var v = Number(raw);
          if (Number.isFinite(v) && v > 0) return v;
        }
        var perHour = md.velocidade_hora ?? md.velocidade_por_hora ?? md.cx_hora ?? md.caixas_hora ?? md.prod_hora ?? md.capacidade_hora ?? null;
        if (perHour != null && perHour !== '') {
          var vh = Number(perHour);
          if (Number.isFinite(vh) && vh > 0) return (vh / 60);
        }
      }
    } catch (_) {}
    return null;
  }

  function _minutosOf(of, maquina) {
    var qtd = _getQtdOf(of);
    var vel = _velocidadeMaquina(maquina);
    if (qtd != null && vel != null && vel > 0) {
      var m = qtd / vel;
      if (Number.isFinite(m) && m > 0) return Math.max(1, Math.round(m));
    }
    return 30;
  }

  function _updateCapacidadeHeader(maquina, texto, cls) {
    var list = getMachineListEl(maquina);
    var block = list ? list.parentElement : null;
    var header = block ? block.querySelector('.maq-header') : null;
    if (!header) return;
    var left = header.querySelector('div');
    if (!left) return;
    var el = left.querySelector('.patch-ofmaq-cap-badge');
    if (!texto) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.className = 'patch-ofmaq-cap-badge';
      left.appendChild(el);
    }
    el.className = 'patch-ofmaq-cap-badge ' + String(cls || '');
    el.textContent = texto;
  }

  function _atualizarCapacidadePorMaquina() {
    try {
      var groups = getVisibleGroups();
      var hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      var cap = _capacidadeDia(hoje);
      Object.keys(groups || {}).forEach(function(maquina) {
        var ofs = Array.isArray(groups[maquina]) ? groups[maquina] : [];
        if (!ofs.length || String(maquina || '').trim() === 'Sem Máquina') {
          _updateCapacidadeHeader(maquina, '', '');
          return;
        }
        var ocup = ofs.reduce(function(s, of) { return s + _minutosOf(of, maquina); }, 0);
        var uteis = Number(cap.uteis || 0) || 0;
        var total = Number(cap.total || 0) || 0;
        if (!(uteis > 0) || !(total > 0)) {
          _updateCapacidadeHeader(maquina, '', '');
          return;
        }
        if (ocup <= uteis) {
          var pct = Math.round((ocup / uteis) * 100);
          _updateCapacidadeHeader(maquina, '🟢 ' + pct + '% ocupada', 'ok');
          return;
        }
        if (ocup > uteis && ocup <= total) {
          _updateCapacidadeHeader(maquina, '🟡 Sobrecarregada (+' + (ocup - uteis) + ' min)', 'warn');
          return;
        }
        _updateCapacidadeHeader(maquina, '🔴 Fora do horário (+' + (ocup - total) + ' min)', 'bad');
      });
    } catch (_) {}
  }

  function ensureOfmaqToolbarButtons() {
    var toolbar = document.querySelector('#page-ofmaq .ptoolbar');
    if (!toolbar) return;
    var anchor = document.getElementById('ofmaq-btn-todas-ofs') || toolbar.lastElementChild;
    var wrap = document.getElementById('patch-ofmaq-toolbar-actions');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'patch-ofmaq-toolbar-actions';
      wrap.className = 'patch-ofmaq-toolbar-actions';
      if (anchor && anchor.parentNode === toolbar) toolbar.insertBefore(wrap, anchor);
      else toolbar.appendChild(wrap);
    }
    if (!document.getElementById('patch-btn-prioridade')) {
      var btnOrd = document.createElement('button');
      btnOrd.id = 'patch-btn-prioridade';
      btnOrd.style.cssText = 'padding:7px 14px;border-radius:6px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px';
      btnOrd.textContent = '🎯 Ordenar por Prioridade';
      btnOrd.onclick = function() { try { if (typeof window._ordenarPorPrioridade === 'function') window._ordenarPorPrioridade(); else if (typeof window.ordenarOFsPorPrioridade === 'function') window.ordenarOFsPorPrioridade(); } catch (_) {} };
      wrap.appendChild(btnOrd);
    }
    if (!document.getElementById('btn-agrupar-setup')) {
      var btnAgr = document.createElement('button');
      btnAgr.id = 'btn-agrupar-setup';
      btnAgr.style.cssText = 'padding:7px 14px;border-radius:6px;background:var(--bg2);color:var(--text1);border:1px solid var(--border);cursor:pointer;font-size:13px';
      btnAgr.textContent = '🎨 Agrupar Setup';
      btnAgr.onclick = function() { try { if (typeof window.toggleAgrupamentoSetup === 'function') window.toggleAgrupamentoSetup(); } catch (_) {} };
      wrap.appendChild(btnAgr);
    }
    updateAgrupamentoButton();

    try {
      Array.prototype.slice.call(toolbar.querySelectorAll('button')).forEach(function(b) {
        var t = String(b && b.textContent || '').toLowerCase();
        if (t.indexOf('ordenar por prioridade') >= 0 && !b._patchBoundPrior) {
          b._patchBoundPrior = true;
          b.onclick = function() { try { if (typeof window._ordenarPorPrioridade === 'function') window._ordenarPorPrioridade(); } catch (_) {} };
        }
        if (t.indexOf('agrupar setup') >= 0 && !b._patchBoundSetup) {
          b._patchBoundSetup = true;
          b.onclick = function() { try { if (typeof window.toggleAgrupamentoSetup === 'function') window.toggleAgrupamentoSetup(); } catch (_) {} };
        }
      });
    } catch (_) {}
  }

  function updateAgrupamentoButton() {
    var btn = document.getElementById('btn-agrupar-setup');
    if (!btn) return;
    var ativo = !!window._agrupamentoSetupAtivo;
    btn.style.background = ativo ? 'var(--accent)' : 'var(--bg2)';
    btn.style.color = ativo ? '#fff' : 'var(--text1)';
    btn.textContent = ativo ? '🎨 Agrupado por Setup ✓' : '🎨 Agrupar Setup';
  }

  function getBadgeForDays(diff) {
    if (diff == null) return null;
    if (diff < 0) return { cls: 'darkred', text: 'ATRASADA ' + Math.abs(diff) + ' dia' + (Math.abs(diff) > 1 ? 's' : '') };
    if (diff <= 1) return { cls: 'red', text: 'URGENTE! ' + diff + ' dia' + (diff === 1 ? ' útil' : 's úteis') };
    if (diff <= 4) return { cls: 'yellow', text: diff + ' dias úteis ⚠️' };
    return { cls: 'green', text: diff + ' dias úteis' };
  }

  function getCardContentEl(card) {
    if (!card) return null;
    var content = card.querySelector('.patch-ofmaq-card-main');
    if (content) return content;
    if (card.children && card.children[1] && card.children[1].tagName === 'DIV') return card.children[1];
    return card.querySelector('div') || card;
  }

  function buildSuggestionMap() {
    var groups = getVisibleGroups();
    var out = {};
    Object.keys(groups || {}).forEach(function(maquina) {
      var ofs = Array.isArray(groups[maquina]) ? groups[maquina] : [];
      if (!ofs.length || maquina === 'Sem Máquina') return;
      var maqDados = null;
      var cap = null;
      try { maqDados = typeof window.getDadosMaquina === 'function' ? window.getDadosMaquina(maquina) : null; } catch (_) {}
      try { cap = typeof window.calcularCapacidadeMaquina === 'function' ? window.calcularCapacidadeMaquina(maqDados, ofs) : null; } catch (_) {}
      var pct = Number(cap && (cap.pct != null ? cap.pct : cap.ocupacaoPct) || 0) || 0;
      var minTotal = Number(cap && (cap.minTotal != null ? cap.minTotal : cap.totalMin) || 0) || 0;
      var minOcupados = Number(cap && (cap.minOcupados != null ? cap.minOcupados : cap.minutos_ocupados) || 0) || 0;
      var overloaded = pct > 90 || (minTotal > 0 && minOcupados > (minTotal * 0.9));
      if (!overloaded) return;
      ofs.forEach(function(of) {
        var dias = businessDaysDelta(getOfDelivery(of));
        if (dias != null && dias >= 3) {
          out[String(of && of.id || '')] = {
            maquina: maquina,
            dias: dias,
            capacidade: cap || null,
          };
        }
      });
    });
    window._ofmaqOverloadMap = out;
  }

  function decorateOfmaqCards() {
    buildSuggestionMap();
    Array.prototype.slice.call(document.querySelectorAll('#ofs-por-maquina-container .of-card-maquina[data-of-id], #ofs-por-maquina-container .of-card[data-of-id]')).forEach(function(card) {
      if (!card) return;
      var id = String(card.getAttribute('data-of-id') || '').trim();
      var of = getCurrentOfById(id);
      if (!of) return;
      var content = getCardContentEl(card);
      if (!content) return;
      var existing = content.querySelector('.patch-ofmaq-badges');
      if (existing) existing.remove();
      var diff = businessDaysDelta(getOfDelivery(of));
      var badge = getBadgeForDays(diff);
      var wrap = document.createElement('div');
      wrap.className = 'patch-ofmaq-badges';
      if (window._agrupamentoSetupAtivo) {
        try {
          var cor = (typeof window._ofmaqCorKey === 'function') ? window._ofmaqCorKey(of) : '';
          if (cor) {
            var dot = document.createElement('span');
            dot.className = 'patch-ofmaq-color-dot';
            dot.title = 'Setup/Cor: ' + String(cor);
            try {
              if (typeof window._ofmaqCorStyle === 'function') {
                var st = window._ofmaqCorStyle(cor);
                if (st && typeof st === 'object') {
                  if (st.background) dot.style.background = st.background;
                  if (st.border) dot.style.borderColor = st.border;
                }
              }
            } catch (_) {}
            wrap.appendChild(dot);
          }
        } catch (_) {}
      }
      if (badge) {
        var badgeEl = document.createElement('span');
        badgeEl.className = 'patch-ofmaq-chip ' + badge.cls;
        badgeEl.textContent = badge.text;
        wrap.appendChild(badgeEl);
      }
      if (window._ofmaqOverloadMap[id]) {
        var btn = document.createElement('button');
        btn.className = 'patch-ofmaq-calendar-btn';
        btn.type = 'button';
        btn.title = 'Sugestão de reagendamento';
        btn.textContent = '📅';
        btn.onclick = function(ev) {
          try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
          window.mostrarSugestaoReagendamento(id, window._ofmaqOverloadMap[id].maquina);
        };
        wrap.appendChild(btn);
      }
      var pinBtn = document.createElement('button');
      pinBtn.className = 'patch-ofmaq-calendar-btn';
      pinBtn.type = 'button';
      pinBtn.setAttribute('data-pin-type', 'of');
      pinBtn.setAttribute('data-pin-id', id);
      pinBtn.title = 'Fixar OF no Hub';
      pinBtn.textContent = '📌';
      try {
        var pinStyle = window.__patchPinBtnStyleAttr ? window.__patchPinBtnStyleAttr('of', id) : '';
        if (pinStyle) pinBtn.style.cssText += pinStyle;
      } catch (_) {}
      pinBtn.onclick = function(ev) {
        try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
        try {
          if (typeof window.__patchOpenPinModal === 'function') window.__patchOpenPinModal('of', id, 'OF');
        } catch (_) {}
      };
      wrap.appendChild(pinBtn);
      if (!wrap.children.length) return;
      content.insertBefore(wrap, content.firstChild);
    });
  }

  function parseColors(of) {
    var raw = of && (of.cores_impressao != null ? of.cores_impressao : of.impressao_cor);
    var arr = [];
    try {
      if (Array.isArray(raw)) {
        arr = raw.map(function(x) { return String(x && (x.nome || x.name || x) || '').trim(); });
      } else if (raw && typeof raw === 'object') {
        arr = Object.values(raw).map(function(x) { return String(x && (x.nome || x.name || x) || '').trim(); });
      } else if (typeof raw === 'string') {
        var s = raw.trim();
        if (s.charAt(0) === '[') {
          var parsed = JSON.parse(s || '[]');
          if (Array.isArray(parsed)) arr = parsed.map(function(x) { return String(x && (x.nome || x.name || x) || '').trim(); });
        } else {
          arr = s.split(/[,+;|/]+/g).map(function(x) { return String(x || '').trim(); });
        }
      }
    } catch (_) {
      arr = [];
    }
    arr = arr.filter(Boolean);
    return arr.length ? arr : ['Sem cor'];
  }

  function _hashColor(s) {
    var str = String(s || '');
    var h = 0;
    for (var i = 0; i < str.length; i += 1) h = ((h << 5) - h) + str.charCodeAt(i);
    h = Math.abs(h);
    var hue = h % 360;
    return 'hsl(' + hue + ',70%,55%)';
  }

  function _pickCorKey(of) {
    try {
      var cand = [
        of && (of.cor ?? of.tinta ?? of.ref ?? of.referencia ?? of.cor_tinta),
        (of && typeof of === 'object') ? (of.cores ?? of.cores_impressao ?? of.impressao_cor) : null,
        of && (of.descricao || of.prodDesc || of.produto || of.obs || of.observacao)
      ];
      var s = cand.map(function(x) { return String(x == null ? '' : x); }).join(' | ').toUpperCase();
      if (s.indexOf('NATURAL') >= 0) return 'NATURAL';
      if (s.indexOf('KRAFT') >= 0) return 'KRAFT';
      if (s.indexOf('BRANCO') >= 0 || s.indexOf('WHITE') >= 0) return 'BRANCO';
      if (s.indexOf('PRETO') >= 0 || s.indexOf('BLACK') >= 0) return 'PRETO';
      if (s.indexOf('AZUL') >= 0) return 'AZUL';
      if (s.indexOf('VERMELH') >= 0) return 'VERMELHO';
      if (s.indexOf('VERDE') >= 0) return 'VERDE';
      if (s.indexOf('AMAREL') >= 0) return 'AMARELO';
      if (s.indexOf('ROXO') >= 0) return 'ROXO';
      if (s.indexOf('ROSA') >= 0) return 'ROSA';
      if (s.indexOf('CINZA') >= 0 || s.indexOf('GRAFITE') >= 0 || s.indexOf('GRAY') >= 0) return 'CINZA';
      var pant = s.match(/PANTONE\\s*(\\d{2,4}[A-Z]?)/i);
      if (pant) return ('PANTONE ' + String(pant[1]).toUpperCase()).trim();
      var num = s.match(/\\b(\\d{2,4})\\b/);
      if (num) return String(num[1]);
      var cols = parseColors(of);
      if (cols && cols[0]) return String(cols[0]).toUpperCase().trim();
    } catch (_) {}
    return 'SEM COR';
  }

  window._ofmaqCorKey = _pickCorKey;
  window._ofmaqCorStyle = function(corKey) {
    var k = String(corKey || '').toUpperCase().trim();
    if (!k) return { background: '#64748b', border: 'rgba(255,255,255,0.18)' };
    if (k === 'NATURAL') return { background: '#92400e', border: 'rgba(251,191,36,0.35)' };
    if (k === 'KRAFT') return { background: '#f59e0b', border: 'rgba(245,158,11,0.45)' };
    if (k === 'BRANCO') return { background: '#f8fafc', border: 'rgba(0,0,0,0.22)' };
    if (k === 'PRETO') return { background: '#0b1220', border: 'rgba(255,255,255,0.22)' };
    if (k === 'AZUL') return { background: '#3b82f6', border: 'rgba(59,130,246,0.5)' };
    if (k === 'VERMELHO') return { background: '#ef4444', border: 'rgba(239,68,68,0.5)' };
    if (k === 'VERDE') return { background: '#22c55e', border: 'rgba(34,197,94,0.5)' };
    if (k === 'AMARELO') return { background: '#eab308', border: 'rgba(234,179,8,0.55)' };
    if (k === 'ROXO') return { background: '#8b5cf6', border: 'rgba(139,92,246,0.5)' };
    if (k === 'ROSA') return { background: '#ec4899', border: 'rgba(236,72,153,0.5)' };
    if (k === 'CINZA') return { background: '#94a3b8', border: 'rgba(148,163,184,0.55)' };
    return { background: _hashColor(k), border: 'rgba(255,255,255,0.22)' };
  };

  function parseDimensions(of) {
    var candidates = [
      of && of.medidas,
      of && of.medida,
      of && of.tamanho,
      of && of.dimensao,
      of && of.dimensoes,
      of && of.obs,
      of && of.observacao,
      of && of.descricao,
      of && of.prodDesc,
      of && of.produto
    ];
    var largura = Number(of && (of.largura || of.larg)) || 0;
    var comprimento = Number(of && (of.comprimento || of.compr || of.altura)) || 0;
    if (largura > 0 && comprimento > 0) return { largura: largura, comprimento: comprimento };
    for (var i = 0; i < candidates.length; i += 1) {
      var s = String(candidates[i] || '');
      var m = s.match(/(\d{2,4})\s*[x×]\s*(\d{2,4})/i);
      if (m) {
        return { largura: Number(m[1]) || 0, comprimento: Number(m[2]) || 0 };
      }
    }
    return { largura: 0, comprimento: 0 };
  }

  function buildSizeLabel(dim) {
    var largura = Number(dim && dim.largura || 0) || 0;
    var comprimento = Number(dim && dim.comprimento || 0) || 0;
    if (largura > 0 && comprimento > 0) return '~' + largura + '×' + comprimento + 'mm';
    return 'sem medida definida';
  }

  function buildSetupGroups(ofs) {
    var source = Array.isArray(ofs) ? ofs.slice() : [];
    var colorBuckets = {};
    source.forEach(function(of) {
      var colorKey = parseColors(of).join(' + ');
      if (!colorBuckets[colorKey]) colorBuckets[colorKey] = [];
      colorBuckets[colorKey].push(of);
    });
    var colorKeys = Object.keys(colorBuckets).sort(function(a, b) { return a.localeCompare(b); });
    var sections = [];
    var ordered = [];
    colorKeys.forEach(function(colorKey) {
      var items = colorBuckets[colorKey].slice().sort(function(a, b) {
        var da = parseDimensions(a);
        var db = parseDimensions(b);
        if (da.largura !== db.largura) return da.largura - db.largura;
        if (da.comprimento !== db.comprimento) return da.comprimento - db.comprimento;
        return String(a && (a.numero || a.of || '') || '').localeCompare(String(b && (b.numero || b.of || '') || ''));
      });
      var clusters = [];
      items.forEach(function(of) {
        var dim = parseDimensions(of);
        var target = null;
        for (var i = 0; i < clusters.length; i += 1) {
          var ref = clusters[i].ref;
          if (Math.abs((ref.largura || 0) - (dim.largura || 0)) <= 20 && Math.abs((ref.comprimento || 0) - (dim.comprimento || 0)) <= 20) {
            target = clusters[i];
            break;
          }
        }
        if (!target) {
          target = { ref: dim, items: [] };
          clusters.push(target);
        }
        target.items.push(of);
      });
      sections.push({ type: 'color', label: '🎨 ' + colorKey + ' (' + items.length + ' OFs)' });
      clusters.forEach(function(cluster) {
        sections.push({ type: 'size', label: '📐 ' + buildSizeLabel(cluster.ref) + ' (' + cluster.items.length + ' OFs)' });
        cluster.items.forEach(function(of) {
          ordered.push(of);
          sections.push({ type: 'card', of: of });
        });
      });
    });
    return { sections: sections, ordered: ordered };
  }

  function setupKey(of) {
    return parseColors(of).join(' + ') + '|' + buildSizeLabel(parseDimensions(of));
  }

  function countSetups(ofs) {
    var list = Array.isArray(ofs) ? ofs : [];
    if (list.length < 2) return 0;
    var total = 0;
    for (var i = 1; i < list.length; i += 1) {
      if (setupKey(list[i - 1]) !== setupKey(list[i])) total += 1;
    }
    return total;
  }

  function updateEconomiaHeader(maquina, texto) {
    var list = getMachineListEl(maquina);
    var block = list ? list.parentElement : null;
    var header = block ? block.querySelector('.maq-header') : null;
    if (!header) return;
    var left = header.querySelector('div');
    if (!left) return;
    var el = left.querySelector('.patch-ofmaq-economia');
    if (!texto) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.className = 'patch-ofmaq-economia';
      left.appendChild(el);
    }
    el.textContent = texto;
  }

  function applySetupGroupingVisual() {
    try {
      var groups = getVisibleGroups();
      Object.keys(groups || {}).forEach(function(maquina) {
        updateEconomiaHeader(maquina, '');
      });
    } catch (_) {}
  }

  function closeReagendamentoModal() {
    var modal = document.getElementById('patch-ofmaq-reag-modal');
    if (modal) modal.remove();
  }

  window.mostrarSugestaoReagendamento = function(ofId, maquina) {
    var of = getCurrentOfById(ofId);
    if (!of) return;
    closeReagendamentoModal();
    var entrega = getOfDelivery(of);
    var dias = businessDaysDelta(entrega);
    var overlay = document.createElement('div');
    overlay.id = 'patch-ofmaq-reag-modal';
    overlay.innerHTML = ''
      + '<div class="patch-reag-card">'
      + '  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">'
      + '    <div style="font-size:18px;font-weight:800;color:var(--text1)">📅 Sugestão de Reagendamento</div>'
      + '    <button type="button" id="patch-reag-close" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:20px">✕</button>'
      + '  </div>'
      + '  <div style="margin-top:14px;color:var(--text1);font-weight:700">OF #' + escHLocal(String(of.numero || of.of || '—')) + ' — ' + escHLocal(String(of.prodDesc || of.produto || of.descricao || 'Produto')) + '</div>'
      + '  <div style="margin-top:4px;color:var(--text2);font-size:13px">' + escHLocal(String(of.cliNome || of.cliente || of.cliente_nome || 'Cliente')) + '</div>'
      + '  <div style="margin-top:12px;color:var(--text2);font-size:13px">Entrega: ' + escHLocal(fmtDateBR(entrega)) + ' (' + escHLocal(String(dias == null ? 0 : dias)) + ' dias úteis restantes)</div>'
      + '  <div style="margin-top:12px;color:var(--text1);line-height:1.5">'
      + '    <div>' + escHLocal(String(maquina || 'Esta máquina')) + ' está sobrecarregada hoje.</div>'
      + '    <div>Esta OF tem folga para ser movida.</div>'
      + '  </div>'
      + '  <div style="margin-top:14px;color:var(--text2);font-size:12px;font-weight:700">Mover para:</div>'
      + '  <div class="patch-reag-actions">'
      + '    <button type="button" class="primary" data-date="' + escAttrLocal(nextBusinessDate(1)) + '">📅 Amanhã ' + escHLocal(fmtWeekdayDate(nextBusinessDate(1))) + '</button>'
      + '    <button type="button" data-date="' + escAttrLocal(nextBusinessDate(2)) + '">📅 ' + escHLocal(fmtWeekdayDate(nextBusinessDate(2))) + '</button>'
      + '    <button type="button" data-keep="1">Manter</button>'
      + '  </div>'
      + '</div>';
    overlay.addEventListener('click', function(ev) {
      if (ev.target === overlay) closeReagendamentoModal();
    });
    document.body.appendChild(overlay);
    var closeBtn = document.getElementById('patch-reag-close');
    if (closeBtn) closeBtn.onclick = closeReagendamentoModal;
    Array.prototype.slice.call(overlay.querySelectorAll('button[data-date]')).forEach(function(btn) {
      btn.onclick = async function() {
        var novaData = String(btn.getAttribute('data-date') || '').slice(0, 10);
        await window._aplicarSugestaoReagendamento(ofId, novaData);
      };
    });
    var keepBtn = overlay.querySelector('button[data-keep]');
    if (keepBtn) keepBtn.onclick = closeReagendamentoModal;
  };

  window._aplicarSugestaoReagendamento = async function(ofId, novaData) {
    try {
      var payload = { data_programada: novaData, data_producao: novaData, dia: novaData };
      var result = await apiJson('/api/ofs/' + encodeURIComponent(String(ofId || '').trim()), { method: 'PATCH', body: payload });
      if (!result.resp || !result.resp.ok || (result.data && result.data.ok === false)) {
        throw new Error((result.data && (result.data.error || result.data.message)) || 'Falha ao reagendar');
      }
      closeReagendamentoModal();
      try { window.toast('✓ OF reagendada', 'var(--green)'); } catch (_) {}
      try { if (typeof window.renderOFsPorMaquina === 'function') window.renderOFsPorMaquina(); } catch (_) {}
    } catch (e) {
      try { window.toast('Erro ao reagendar OF: ' + (e && e.message ? e.message : e), 'var(--red)'); } catch (_) {}
    }
  };

  function _subDiasUteis(date, dias) {
    var d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
    d.setHours(0, 0, 0, 0);
    var remaining = Math.max(0, Math.trunc(Number(dias || 0) || 0));
    while (remaining > 0) {
      d.setDate(d.getDate() - 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) remaining -= 1;
    }
    return d;
  }

  function _maqAtualOf(of) {
    try {
      var m = of && (of.maquina_atual || of.maq || of.maquina || of.maquina_nome || of.maquinaNome || of.maquina_atual_nome);
      m = String(m || '').trim();
      if (m) return m;
      var fluxo = of && (of.fluxo_maquinas || of.fluxo || of.maquinas_fluxo);
      if (typeof fluxo === 'string') { try { fluxo = JSON.parse(fluxo); } catch (_) { fluxo = null; } }
      if (fluxo && typeof fluxo === 'object' && !Array.isArray(fluxo)) {
        try { fluxo = Object.values(fluxo); } catch (_) { fluxo = null; }
      }
      if (!Array.isArray(fluxo)) fluxo = [];
      var idx = Number(of && (of.maquina_atual_index ?? of.maquinaAtualIndex ?? 0) || 0);
      if (!Number.isFinite(idx)) idx = 0;
      var mx = String(fluxo[idx] || fluxo[0] || '').trim();
      return mx || '';
    } catch (_) {}
    return '';
  }

  function _statusAbertoOuProducao(of) {
    var s = String(of && of.status || '').trim().toLowerCase();
    return (s.indexOf('aberto') >= 0) || (s.indexOf('produ') >= 0);
  }

  function _prodDateOf(of) {
    var s = String(of && (of.data_producao || of.dia || of.data_programada || of.dia_programacao) || '').slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return _isoDateOnly(new Date());
  }

  function _buildCargaPorMaqPorDia(ofs) {
    var map = {};
    (Array.isArray(ofs) ? ofs : []).forEach(function(of) {
      if (!of) return;
      if (!_statusAbertoOuProducao(of)) return;
      var maq = _maqAtualOf(of);
      if (!maq) return;
      var dia = _prodDateOf(of);
      if (!map[maq]) map[maq] = {};
      if (!map[maq][dia]) map[maq][dia] = 0;
      map[maq][dia] += _minutosOf(of, maq);
    });
    return map;
  }

  async function _aplicarDataProducao(ofId, novaData) {
    var id = String(ofId || '').trim();
    var dt = String(novaData || '').slice(0, 10);
    if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(dt)) return false;
    var payload = { data_producao: dt, dia: dt, data_programada: dt };
    var r1 = await apiJson('/api/ofs/' + encodeURIComponent(id), { method: 'PUT', body: payload });
    if (r1 && r1.resp && r1.resp.ok && !(r1.data && r1.data.ok === false)) return true;
    var r2 = await apiJson('/api/ofs/' + encodeURIComponent(id), { method: 'PATCH', body: payload });
    return !!(r2 && r2.resp && r2.resp.ok && !(r2.data && r2.data.ok === false));
  }

  function _calcularSugestoesRedistribuicao() {
    try {
      var all = Array.isArray(window.OFS) ? window.OFS : (Array.isArray(window._ofmaqBaseList) ? window._ofmaqBaseList : []);
      all = Array.isArray(all) ? all : [];
      var hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      var hojeIso = _isoDateOnly(hoje);
      var carga = _buildCargaPorMaqPorDia(all);

      var sugs = [];
      all.forEach(function(of) {
        if (!of) return;
        if (!_statusAbertoOuProducao(of)) return;
        var entregaIso = getOfDelivery(of);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(entregaIso)) return;
        var entrega = parseDateOnly(entregaIso);
        if (!entrega) return;
        if (entrega <= hoje) return;
        var maq = _maqAtualOf(of);
        if (!maq || maq === 'Sem Máquina') return;

        var capHoje = _capacidadeDia(hoje);
        var uteisHoje = Number(capHoje.uteis || 0) || 0;
        var ocupHoje = Number(carga[maq] && carga[maq][hojeIso] || 0) || 0;
        var sobreHoje = uteisHoje > 0 && ocupHoje > uteisHoje;
        if (!sobreHoje) return;

        var limite = _subDiasUteis(entrega, 2);
        var limiteIso = _isoDateOnly(limite);
        var minOf = _minutosOf(of, maq);

        var propostaIso = '';
        var cursor = new Date(hoje.getTime());
        for (var tent = 0; tent < 45; tent += 1) {
          var diaIso = _isoDateOnly(cursor);
          if (diaIso > limiteIso) break;
          var capDia = _capacidadeDia(cursor);
          var uteis = Number(capDia.uteis || 0) || 0;
          if (uteis > 0) {
            var ocup = Number(carga[maq] && carga[maq][diaIso] || 0) || 0;
            if ((ocup + minOf) <= uteis) {
              propostaIso = diaIso;
              break;
            }
          }
          cursor.setDate(cursor.getDate() + 1);
        }

        var foraPrazo = !propostaIso;
        var diasUteisAteLimite = window._diasUteis ? window._diasUteis(hoje, limite) : (businessDaysDelta(limiteIso) || 0);
        var diasAntesPrazo = propostaIso ? ((window._diasUteis ? window._diasUteis(parseDateOnly(propostaIso), limite) : 0) - 1) : 0;
        var cliente = String(of && (of.cliNome || of.cliente || of.cliente_nome || '') || '').trim();
        var produto = String(of && (of.prodDesc || of.produto || of.descricao || '') || '').trim();
        sugs.push({
          id: String(of.id || '').trim(),
          numero: String(of.numero || of.of || '').trim(),
          cliente: cliente || '—',
          produto: produto || '—',
          maquina: maq,
          entrega: entregaIso,
          limite: limiteIso,
          minutos: minOf,
          sobreHoje: true,
          ocupHoje: ocupHoje,
          uteisHoje: uteisHoje,
          proposta: propostaIso,
          foraPrazo: foraPrazo,
          comFolga: !foraPrazo && diasAntesPrazo >= 5,
          urgente: isUrgente(of),
          diasAteLimite: diasUteisAteLimite,
          diasAntesPrazo: diasAntesPrazo
        });
      });

      sugs.sort(function(a, b) {
        if (!!a.urgente !== !!b.urgente) return a.urgente ? -1 : 1;
        var da = String(a.entrega || '9999-99-99');
        var db = String(b.entrega || '9999-99-99');
        if (da !== db) return da.localeCompare(db);
        return String(a.numero || '').localeCompare(String(b.numero || ''));
      });
      return sugs;
    } catch (_) {}
    return [];
  }

  function _renderSugestoesRedistribuicaoModal() {
    ensureStyles();
    var state = window.__ofmaqRedistribState || { filter: 'todas', ignored: {} };
    if (!state.sugestoes) state.sugestoes = _calcularSugestoesRedistribuicao();
    if (!state.ignored) state.ignored = {};
    window.__ofmaqRedistribState = state;

    var list = (state.sugestoes || []).filter(function(s) { return s && !state.ignored[s.id]; });
    var filtro = String(state.filter || 'todas');
    if (filtro === 'sobre') list = list.filter(function(s) { return !!s.sobreHoje; });
    if (filtro === 'fora') list = list.filter(function(s) { return !!s.foraPrazo; });
    if (filtro === 'folga') list = list.filter(function(s) { return !!s.comFolga; });

    var overlay = document.getElementById('patch-ofmaq-redistrib-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'patch-ofmaq-redistrib-modal';
      overlay.addEventListener('click', function(ev) { if (ev.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
    }

    var total = (state.sugestoes || []).filter(function(s) { return s && !state.ignored[s.id]; }).length;
    var sobre = (state.sugestoes || []).filter(function(s) { return s && !state.ignored[s.id] && s.sobreHoje; }).length;
    var fora = (state.sugestoes || []).filter(function(s) { return s && !state.ignored[s.id] && s.foraPrazo; }).length;

    overlay.innerHTML = ''
      + '<div class="box">'
      + '  <div class="top">'
      + '    <div>'
      + '      <div class="ttl">⚡ Sugestões de Redistribuição</div>'
      + '      <div class="sub">' + escHLocal(String(total)) + ' OFs identificadas · Sobrecarregadas hoje: ' + escHLocal(String(sobre)) + ' · Fora do prazo: ' + escHLocal(String(fora)) + '</div>'
      + '    </div>'
      + '    <button type="button" class="close" id="patch-red-close">Fechar</button>'
      + '  </div>'
      + '  <div class="chips">'
      + '    <button type="button" class="chip' + (filtro === 'todas' ? ' is-active' : '') + '" data-fil="todas">Todas</button>'
      + '    <button type="button" class="chip' + (filtro === 'sobre' ? ' is-active' : '') + '" data-fil="sobre">Sobrecarregadas hoje</button>'
      + '    <button type="button" class="chip' + (filtro === 'fora' ? ' is-active' : '') + '" data-fil="fora">Fora do prazo</button>'
      + '    <button type="button" class="chip' + (filtro === 'folga' ? ' is-active' : '') + '" data-fil="folga">Com folga</button>'
      + '  </div>'
      + '  <div class="list" id="patch-red-list"></div>'
      + '  <div class="foot">'
      + '    <div style="color:var(--text2);font-size:12px">Ordenação: urgência primeiro, depois proximidade do prazo</div>'
      + '    <button type="button" class="primary" id="patch-red-applyall">✅ Aplicar Todas</button>'
      + '  </div>'
      + '</div>';

    var closeBtn = document.getElementById('patch-red-close');
    if (closeBtn) closeBtn.onclick = function() { try { overlay.remove(); } catch (_) {} };

    Array.prototype.slice.call(overlay.querySelectorAll('[data-fil]')).forEach(function(btn) {
      btn.onclick = function() {
        state.filter = String(btn.getAttribute('data-fil') || 'todas');
        _renderSugestoesRedistribuicaoModal();
      };
    });

    var listEl = document.getElementById('patch-red-list');
    if (!listEl) return;
    if (!list.length) {
      listEl.innerHTML = '<div style="color:var(--text2);padding:14px">Nenhuma sugestão para este filtro.</div>';
      return;
    }

    listEl.innerHTML = list.map(function(s) {
      var titulo = 'OF #' + String(s.numero || '—') + ' — ' + String(s.cliente || '—');
      var subt = String(s.produto || '—');
      var situ = s.foraPrazo
        ? '🔴 Fora do prazo (sem capacidade até ' + fmtDateBR(s.limite) + ')'
        : '🟡 Sobrecarregada hoje (+' + String(Math.max(0, (s.ocupHoje || 0) - (s.uteisHoje || 0))) + ' min)';
      var sug = s.proposta
        ? ('✅ Sugestão: Produzir em ' + fmtDateBR(s.proposta) + ' (' + String(Math.max(0, s.diasAntesPrazo || 0)) + ' dias úteis antes do prazo)')
        : '⚠️ Sem data viável antes do prazo';
      return ''
        + '<div class="card" data-id="' + escAttrLocal(String(s.id || '')) + '">'
        + '  <div class="row"><div style="font-weight:900;color:var(--text1);font-size:13px">' + escHLocal(titulo) + '</div><div style="color:var(--text2);font-size:12px">' + escHLocal(String(s.maquina || '')) + '</div></div>'
        + '  <div class="meta" style="color:var(--text2)">' + escHLocal(subt) + '</div>'
        + '  <div class="meta">📅 Entrega: ' + escHLocal(fmtDateBR(s.entrega)) + ' · ⏱️ Tempo estimado: ' + escHLocal(String(s.minutos || 0)) + ' min</div>'
        + '  <div class="meta">' + escHLocal(situ) + '</div>'
        + '  <div class="meta" style="color:var(--text1)">' + escHLocal(sug) + '</div>'
        + '  <div class="actions">'
        + '    <button type="button" class="primary" data-act="apply" ' + (s.proposta ? ('data-date="' + escAttrLocal(String(s.proposta)) + '"') : 'disabled') + '>✅ Aplicar</button>'
        + '    <button type="button" data-act="ignore">Ignorar</button>'
        + '  </div>'
        + '</div>';
    }).join('');

    listEl.querySelectorAll('[data-act="ignore"]').forEach(function(btn) {
      btn.onclick = function() {
        var card = btn.closest('.card');
        var id = String(card && card.getAttribute('data-id') || '');
        if (!id) return;
        state.ignored[id] = true;
        _renderSugestoesRedistribuicaoModal();
      };
    });
    listEl.querySelectorAll('[data-act="apply"]').forEach(function(btn) {
      btn.onclick = async function() {
        var card = btn.closest('.card');
        var id = String(card && card.getAttribute('data-id') || '');
        var dt = String(btn.getAttribute('data-date') || '');
        if (!id || !dt) return;
        btn.disabled = true;
        try {
          var okk = await _aplicarDataProducao(id, dt);
          if (okk) {
            state.ignored[id] = true;
            try { window.toast('✓ Aplicado: ' + fmtDateBR(dt), 'var(--green)'); } catch (_) {}
            try { if (typeof window.renderOFsPorMaquina === 'function') window.renderOFsPorMaquina(); } catch (_) {}
            _renderSugestoesRedistribuicaoModal();
          } else {
            try { window.toast('Erro ao aplicar sugestão', 'var(--red)'); } catch (_) {}
          }
        } catch (e) {
          try { window.toast('Erro: ' + String(e && e.message || e), 'var(--red)'); } catch (_) {}
        } finally {
          btn.disabled = false;
        }
      };
    });

    var applyAll = document.getElementById('patch-red-applyall');
    if (applyAll) applyAll.onclick = async function() {
      applyAll.disabled = true;
      try {
        var cur = (state.sugestoes || []).filter(function(s) { return s && !state.ignored[s.id] && s.proposta; });
        for (var i = 0; i < cur.length; i += 1) {
          var s = cur[i];
          var okk = await _aplicarDataProducao(s.id, s.proposta);
          if (okk) state.ignored[s.id] = true;
        }
        try { window.toast('✅ Sugestões aplicadas', 'var(--green)'); } catch (_) {}
        try { if (typeof window.renderOFsPorMaquina === 'function') window.renderOFsPorMaquina(); } catch (_) {}
        _renderSugestoesRedistribuicaoModal();
      } catch (e) {
        try { window.toast('Erro ao aplicar todas: ' + String(e && e.message || e), 'var(--red)'); } catch (_) {}
      } finally {
        applyAll.disabled = false;
      }
    };
  }

  window._hookRedistribBanner = function() {
    try {
      if (String(window._PAGE_ATUAL || '') !== 'ofmaq') return;
      var container = document.getElementById('ofs-por-maquina-container') || document.getElementById('ofsmaq-container') || document.getElementById('ofmaq-body') || document.querySelector('#page-ofmaq');
      if (!container) return;
      var nodes = Array.prototype.slice.call(container.querySelectorAll('*')).filter(function(el) {
        var t = String(el && el.textContent || '');
        return t && /podem ser redistribu/i.test(t);
      });
      nodes.forEach(function(el) {
        if (!el || el._patchRedistribBound) return;
        el._patchRedistribBound = true;
        try { el.style.cursor = 'pointer'; } catch (_) {}
        el.onclick = function(ev) {
          try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
          window.__ofmaqRedistribState = { filter: 'todas', ignored: {}, sugestoes: _calcularSugestoesRedistribuicao() };
          _renderSugestoesRedistribuicaoModal();
        };
      });
    } catch (_) {}
  };

  async function savePriorityOrder(maquina, ids) {
    return apiJson('/api/ofs/reordenar', {
      method: 'POST',
      body: { maquina_id: maquina, ids: ids, ordem: ids }
    });
  }

  function _areaOf(of) {
    var d = parseDimensions(of);
    var a = Number(d && d.largura || 0) * Number(d && d.comprimento || 0);
    return a > 0 ? a : null;
  }

  function _sortByAreaDesc(list) {
    var src = Array.isArray(list) ? list.slice() : [];
    return src.sort(function(a, b) {
      var aa = _areaOf(a);
      var ab = _areaOf(b);
      if (aa == null && ab == null) return 0;
      if (aa == null) return 1;
      if (ab == null) return -1;
      return ab - aa;
    });
  }

  window._ordenarPorPrioridade = async function() {
    var groups = getVisibleGroups();
    var maquinas = Object.keys(groups || {});
    if (!maquinas.length) return false;
    try {
      for (var i = 0; i < maquinas.length; i += 1) {
        var maq = maquinas[i];
        var ofs = Array.isArray(groups[maq]) ? groups[maq].slice() : [];
        if (!ofs.length) continue;
        var urg = [];
        var rest = [];
        ofs.forEach(function(of) { (isUrgente(of) ? urg : rest).push(of); });
        urg = _sortByAreaDesc(urg);
        rest = _sortByAreaDesc(rest);
        var sorted = urg.concat(rest);
        var ids = sorted.map(function(of) { return String(of && of.id || '').trim(); }).filter(Boolean);
        if (!ids.length) continue;
        if (!window._ordemMaquinas || typeof window._ordemMaquinas !== 'object') window._ordemMaquinas = {};
        window._ordemMaquinas[maq] = ids.slice();
        await savePriorityOrder(maq, ids);
      }
      try { if (typeof window.renderOFsPorMaquina === 'function') await window.renderOFsPorMaquina(); } catch (_) {}
      try { window.toast('✅ OFs ordenadas por tamanho (maior → menor)', 'var(--green)'); } catch (_) {}
      return true;
    } catch (e) {
      try { window.toast('Erro ao ordenar OFs: ' + (e && e.message ? e.message : e), 'var(--red)'); } catch (_) {}
      return false;
    }
  };

  window.ordenarOFsPorPrioridade = async function(arg) {
    if (Array.isArray(arg)) {
      var urg = [];
      var rest = [];
      (arg || []).forEach(function(of) { (isUrgente(of) ? urg : rest).push(of); });
      return _sortByAreaDesc(urg).concat(_sortByAreaDesc(rest));
    }
    return window._ordenarPorPrioridade();
  };

  window._agruparPorSetup = async function() {
    var groups = getVisibleGroups();
    var maquinas = Object.keys(groups || {});
    if (!maquinas.length) return false;
    try {
      var totalGrupos = 0;
      for (var i = 0; i < maquinas.length; i += 1) {
        var maq = maquinas[i];
        var ofs = Array.isArray(groups[maq]) ? groups[maq].slice() : [];
        if (!ofs.length) continue;
        var buckets = {};
        ofs.forEach(function(of) {
          var k = (typeof window._ofmaqCorKey === 'function') ? window._ofmaqCorKey(of) : 'SEM COR';
          k = String(k || 'SEM COR').toUpperCase().trim() || 'SEM COR';
          if (!buckets[k]) buckets[k] = [];
          buckets[k].push(of);
        });
        var keys = Object.keys(buckets);
        totalGrupos += keys.length;
        keys.sort(function(a, b) { return (buckets[b].length || 0) - (buckets[a].length || 0); });
        var ordered = [];
        keys.forEach(function(k) {
          var list = buckets[k] || [];
          var ug = [];
          var nn = [];
          list.forEach(function(of) { (isUrgente(of) ? ug : nn).push(of); });
          ug.forEach(function(of) { ordered.push(of); });
          nn.forEach(function(of) { ordered.push(of); });
        });
        var ids = ordered.map(function(of) { return String(of && of.id || '').trim(); }).filter(Boolean);
        if (!ids.length) continue;
        if (!window._ordemMaquinas || typeof window._ordemMaquinas !== 'object') window._ordemMaquinas = {};
        window._ordemMaquinas[maq] = ids.slice();
        await savePriorityOrder(maq, ids);
      }
      window._agrupamentoSetupAtivo = true;
      updateAgrupamentoButton();
      try { if (typeof window.renderOFsPorMaquina === 'function') await window.renderOFsPorMaquina(); } catch (_) {}
      try { window.toast('✅ OFs agrupadas por setup/cor (' + totalGrupos + ' grupos)', 'var(--green)'); } catch (_) {}
      return true;
    } catch (e) {
      try { window.toast('Erro ao agrupar OFs: ' + (e && e.message ? e.message : e), 'var(--red)'); } catch (_) {}
      return false;
    }
  };

  window.toggleAgrupamentoSetup = function() {
    window._agrupamentoSetupAtivo = !window._agrupamentoSetupAtivo;
    updateAgrupamentoButton();
    if (window._agrupamentoSetupAtivo) {
      window._agruparPorSetup().catch(function() {});
      return;
    }
    try { if (typeof window.renderOFsPorMaquina === 'function') window.renderOFsPorMaquina(); } catch (_) {}
  };

  function afterRenderOfmaq() {
    ensureStyles();
    ensureOfmaqToolbarButtons();
    decorateOfmaqCards();
    applySetupGroupingVisual();
    try { _atualizarCapacidadePorMaquina(); } catch (_) {}
    try { if (typeof window._hookRedistribBanner === 'function') window._hookRedistribBanner(); } catch (_) {}
  }

  function hookRenderOfmaq() {
    if (typeof window.renderOFsPorMaquina !== 'function') return;
    if (window.renderOFsPorMaquina._patchedPriorityHub) return;
    var orig = window.renderOFsPorMaquina;
    window.renderOFsPorMaquina = async function() {
      var result = await orig.apply(this, arguments);
      setTimeout(afterRenderOfmaq, 40);
      return result;
    };
    window.renderOFsPorMaquina._patchedPriorityHub = true;
  }

  if (typeof originalCardOfmaq === 'function' && !window.cardOFMaquina._patchedPriorityHub) {
    window.cardOFMaquina = function() {
      return originalCardOfmaq.apply(this, arguments);
    };
    window.cardOFMaquina._patchedPriorityHub = true;
  }

  function buildHubIntelBlockHtml() {
    return ''
      + '<div id="hub-inteligencia" style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin-bottom:24px">'
      + '  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
      + '    <div style="display:flex;align-items:center;gap:10px">'
      + '      <span style="font-size:20px">📋</span>'
      + '      <div>'
      + '        <div style="font-weight:700;font-size:16px;color:var(--text1)">O que fazer hoje</div>'
      + '        <div style="font-size:12px;color:var(--text2)" id="hub-intel-data"></div>'
      + '      </div>'
      + '    </div>'
      + '    <button onclick="carregarInteligenciaHub()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:20px" title="Atualizar">↻</button>'
      + '  </div>'
      + '  <div id="hub-intel-lista"><div style="color:var(--text2);font-size:13px">Carregando análise...</div></div>'
      + '</div>';
  }

  function ensureHubIntelBlock() {
    var shell = document.querySelector('#page-hub .hub-shell');
    if (!shell) return null;
    var existing = document.getElementById('hub-inteligencia');
    if (existing) return existing;
    var kpis = document.getElementById('hub-kpis');
    var wrap = document.createElement('div');
    wrap.innerHTML = buildHubIntelBlockHtml();
    var block = wrap.firstElementChild;
    if (!block) return null;
    if (kpis && kpis.parentNode === shell) shell.insertBefore(block, kpis);
    else shell.prepend(block);
    return block;
  }

  window.navegarParaAlerta = function(rota) {
    var destino = String(rota || '').trim();
    if (!destino) return;
    try { if (typeof window.navigateTo === 'function') { window.navigateTo(destino); return; } } catch (_) {}
    try { if (typeof window.renderSection === 'function') { window.renderSection(destino); return; } } catch (_) {}
    try { if (typeof window.go === 'function') { window.go(destino); return; } } catch (_) {}
    try {
      var menuItem = document.querySelector('[data-section="' + destino + '"], [onclick*="' + destino + '"]');
      if (menuItem) menuItem.click();
    } catch (_) {}
  };

  window.carregarInteligenciaHub = async function() {
    try {
      ensureStyles();
      var block = ensureHubIntelBlock();
      var lista = document.getElementById('hub-intel-lista');
      var dataEl = document.getElementById('hub-intel-data');
      if (!block || !lista) return;
      if (dataEl) {
        try {
          var hoje = new Date();
          dataEl.textContent = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        } catch (_) {}
      }
      lista.innerHTML = '<div style="color:var(--text2);font-size:13px;padding:8px 0">Analisando dados...</div>';

      var token = '';
      try {
        token =
          String(window._token || localStorage.getItem('token') || '') ||
          String((document.cookie.match(/(?:^|;\\s*)token=([^;]+)/) || [])[1] || '');
      } catch (_) { token = ''; }

      var r = await fetch('/api/hub/inteligencia', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      if (!r || !r.ok) {
        lista.innerHTML = '<div style="color:var(--text2);font-size:12px;padding:8px">Central de inteligência indisponível no momento.</div>';
        return;
      }
      var data = await r.json().catch(function() { return {}; });
      var alertas = Array.isArray(data && data.alertas) ? data.alertas : [];
      if (!alertas.length) {
        lista.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;color:#10b981"><span style="font-size:20px">✅</span><span>Tudo em ordem! Nenhum alerta no momento.</span></div>';
        return;
      }
      var cores = {
        danger: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
        warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
        info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' }
      };
      lista.innerHTML = alertas.map(function(a) {
        var c = cores[a.tipo] || cores.info;
        var acao = escAttrLocal(String(a.acao || ''));
        return ''
          + '<div class="patch-hub-intel-item" data-acao="' + acao + '" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin-bottom:6px;border-radius:8px;cursor:pointer;background:' + c.bg + ';border:1px solid ' + c.border + '">'
          + '  <div style="display:flex;align-items:center;gap:10px">'
          + '    <span style="font-size:18px">' + escHLocal(a.icone || 'ℹ️') + '</span>'
          + '    <div>'
          + '      <div style="font-weight:600;font-size:13px;color:' + c.text + '">' + escHLocal(a.titulo || '') + '</div>'
          + '      <div style="font-size:11px;color:var(--text2)">' + escHLocal(a.subtitulo || '') + '</div>'
          + '    </div>'
          + '  </div>'
          + '  <span style="font-size:11px;color:' + c.text + ';white-space:nowrap;margin-left:10px">' + escHLocal(a.acao_label || 'ver →') + '</span>'
          + '</div>';
      }).join('');
      Array.prototype.slice.call(lista.querySelectorAll('.patch-hub-intel-item[data-acao]')).forEach(function(item) {
        item.onclick = function() {
          try { window.navegarParaAlerta(String(item.getAttribute('data-acao') || '')); } catch (_) {}
        };
      });
    } catch (_) {
      try {
        var lista2 = document.getElementById('hub-intel-lista');
        if (lista2) lista2.innerHTML = '<div style="color:var(--text2);font-size:12px;padding:8px">Central de inteligência indisponível.</div>';
      } catch (_) {}
    }
  };

  function hookRenderHubIntel() {
    if (typeof window.renderHub !== 'function') return;
    if (window.renderHub._patchedHubIntel) return;
    var orig = window.renderHub;
    window.renderHub = async function() {
      var result = await orig.apply(this, arguments);
      var block = ensureHubIntelBlock();
      if (block && block.dataset.hubIntelLoaded !== '1') {
        block.dataset.hubIntelLoaded = '1';
        try { window.carregarInteligenciaHub(); } catch (_) {}
      }
      return result;
    };
    window.renderHub._patchedHubIntel = true;
  }

  function initHubObserver() {
    try { if (window._hubObs && typeof window._hubObs.disconnect === 'function') window._hubObs.disconnect(); } catch (_) {}
    try { window._hubObs = null; } catch (_) {}
    try { if (window.__patchHubIntelObs && typeof window.__patchHubIntelObs.disconnect === 'function') window.__patchHubIntelObs.disconnect(); } catch (_) {}
    try { window.__patchHubIntelObs = null; } catch (_) {}
  }

  function tick() {
    ensureStyles();
    hookRenderOfmaq();
    hookRenderHubIntel();
    ensureOfmaqToolbarButtons();
    try { if (window._hubIntelInterval) clearInterval(window._hubIntelInterval); } catch (_) {}
    try { window._hubIntelInterval = null; } catch (_) {}
    if (document.getElementById('page-hub')) ensureHubIntelBlock();
  }

  if (typeof originalSortByPriority === 'function') {
    originalSortByPriority = originalSortByPriority.bind(window);
  }
  if (typeof originalRenderOfmaq === 'function') {
    originalRenderOfmaq = originalRenderOfmaq.bind(window);
  }
  hookRenderOfmaq();
  hookRenderHubIntel();
  initHubObserver();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      tick();
      setTimeout(afterRenderOfmaq, 500);
    });
  } else {
    tick();
    setTimeout(afterRenderOfmaq, 500);
  }
})();

(function patchInconformidadesCaixasPerdidas() {
  function authToken() {
    try {
      return String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || '').trim();
    } catch (_) {
      return '';
    }
  }

  function authHeaders(extra) {
    var token = authToken();
    var headers = extra ? Object.assign({}, extra) : {};
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  function toastLocal(msg) {
    try {
      if (typeof window.mostrarToast === 'function') return window.mostrarToast(msg);
    } catch (_) {}
    try {
      if (typeof window.toast === 'function') return window.toast(msg, /❌|erro/i.test(String(msg || '')) ? 'var(--red)' : 'var(--green)');
    } catch (_) {}
    try { alert(msg); } catch (_) {}
  }

  function fmtDataLocal(v) {
    try { if (typeof window.fmtD === 'function') return window.fmtD(v); } catch (_) {}
    var s = String(v || '').slice(0, 10);
    if (!s) return '—';
    var p = s.split('-');
    return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : s;
  }

  function fmtNumLocal(v) {
    try { if (typeof window.fmtN === 'function') return window.fmtN(v); } catch (_) {}
    return Number(v || 0).toLocaleString('pt-BR');
  }

  function fmtMoneyLocal(v) {
    try { if (typeof window.fmtR === 'function') return window.fmtR(v); } catch (_) {}
    return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escHLocal2(v) {
    try { if (typeof window.escH === 'function') return window.escH(v); } catch (_) {}
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escAttrLocal2(v) {
    return escHLocal2(v);
  }

  function normMaq(v) {
    var raw = String(v || '').trim().toLowerCase();
    try { raw = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return raw;
  }

  function uniqStrings(arr) {
    return Array.from(new Set((Array.isArray(arr) ? arr : []).map(function(x) { return String(x || '').trim(); }).filter(Boolean)));
  }

  function parseArrayField(raw) {
    try {
      if (Array.isArray(raw)) return uniqStrings(raw);
      if (raw && typeof raw === 'object') return uniqStrings(Object.values(raw));
      if (typeof raw === 'string') {
        var s = raw.trim();
        if (!s) return [];
        if (s.charAt(0) === '[') return uniqStrings(JSON.parse(s || '[]'));
        return uniqStrings(s.split(/[,;|]/g));
      }
    } catch (_) {}
    return [];
  }

  function getMaquinaSelecionadaNome() {
    var maqSel = String((document.getElementById('cp-maq') || {}).value || (window._cpFiltro && window._cpFiltro.maquina_id) || '').trim();
    if (!maqSel) return '';
    try {
      var src = Array.isArray(window.MAQUINAS) ? window.MAQUINAS : (Array.isArray(window.MAQUINAS) ? window.MAQUINAS : []);
      var it = src.find(function(m) { return String(m && m.id || '').trim() === maqSel; }) || null;
      return String(it && (it.col || it.nome || it.name || it.codigo) || maqSel).trim();
    } catch (_) {
      return maqSel;
    }
  }

  function getCpPeriodo() {
    var f = window._cpFiltro || {};
    var de = String(f.de || '').slice(0, 10);
    var ate = String(f.ate || '').slice(0, 10);
    var mesSelecionado = String((document.getElementById('cp-mesref') || {}).value || f.mes_ref || '').trim();
    if (mesSelecionado && /^\d{4}-\d{2}$/.test(mesSelecionado)) {
      var parts = mesSelecionado.split('-');
      var ano = Number(parts[0]);
      var mes = Number(parts[1]);
      if (ano > 2000 && mes >= 1 && mes <= 12) {
        de = mesSelecionado + '-01';
        ate = new Date(ano, mes, 0).toISOString().slice(0, 10);
      }
    }
    return { de: de, ate: ate, mes: mesSelecionado };
  }

  function getOfCacheById(ofId) {
    var id = String(ofId || '').trim();
    if (!id) return null;
    var bases = [
      Array.isArray(window.OFS) ? window.OFS : [],
      Array.isArray(window.OFs) ? window.OFs : [],
      Array.isArray(window.OFs_CACHE) ? window.OFs_CACHE : [],
      Array.isArray(window._ofsCarregadas) ? window._ofsCarregadas : [],
      Array.isArray(window.OFsUnico) ? window.OFsUnico : []
    ];
    for (var i = 0; i < bases.length; i += 1) {
      var arr = bases[i];
      var found = arr.find(function(of) { return String(of && of.id || '').trim() === id; }) || null;
      if (found) return found;
    }
    return null;
  }

  function normalizeInconfRow(item) {
    var ofData = getOfCacheById(item && item.of_id);
    var operadores = [];
    try {
      var rawOps = item && (item.operadores_nomes || item.operador_display || item.operadores);
      if (Array.isArray(rawOps)) operadores = rawOps;
      else if (typeof rawOps === 'string') {
        var txtOps = String(rawOps || '').trim();
        if (txtOps) {
          if (txtOps.charAt(0) === '[') {
            var parsedOps = JSON.parse(txtOps);
            if (Array.isArray(parsedOps)) operadores = parsedOps;
          } else {
            operadores = txtOps.split(/[,;|]+/g);
          }
        }
      }
    } catch (_) { operadores = []; }
    operadores = (Array.isArray(operadores) ? operadores : []).map(function(op) { return String(op || '').trim(); }).filter(Boolean);
    var operadorDisplay = String(item && (item.operadores_nomes || item.operador_display || item.operador_principal || item.operador_nome || item.operador || item.usuario_conclusao || item.usuario) || '').trim() || (operadores[0] || '—');
    var qtdPerdida = Number(item && (item.quantidade != null ? item.quantidade : (item.qtd_perdida != null ? item.qtd_perdida : item.caixas_perdidas)) || 0) || 0;
    var vlUnit = Number(item && (item.vl_unit != null ? item.vl_unit : item.valor_unitario) || (ofData && (ofData.vl_unit || ofData.valor_unitario)) || 0) || 0;
    var vlTotal = Number(item && (item.vl_total != null ? item.vl_total : item.valor_perdido) || 0) || ((qtdPerdida || 0) * (vlUnit || 0));
    var produto = String(item && item.produto || '').trim() || String(ofData && (ofData.produto || ofData.descricao || ofData.prodDesc) || '').trim() || '—';
    var cliente = String(item && (item.cliente_nome || item.cliente) || '').trim() || String(ofData && (ofData.cli_nome || ofData.cliente || ofData.cliente_nome || ofData.cliNome) || '').trim() || '—';
    var maquina = String(item && (item.maquina || item.maquina_nome || item.maquina_perda) || '').trim() || String(ofData && (ofData.maquina || ofData.maq || ofData.maquina_atual || ofData.maquina_nome) || '').trim() || '—';
    var ofNumero = String(item && (item.of_numero || item.of_num || item.numero || item.of) || '').trim() || String(ofData && (ofData.numero || ofData.of) || '').trim() || '—';
    var imgUrl = String(item && (item.imagem_url || item.foto_url || item.imgUrl) || '').trim() || String(ofData && (ofData.imagem_url || ofData.imgUrl || (Array.isArray(ofData.imgs) ? ofData.imgs[0] : '')) || '').trim();
    try { if (!(window._urlValida && window._urlValida(imgUrl))) imgUrl = ''; } catch (_) { imgUrl = ''; }
    return {
      id: String(item && item.id || '').trim(),
      of_id: String(item && item.of_id || '').trim(),
      of_numero: ofNumero,
      produto: produto,
      maquina: maquina,
      maquina_perda: String(item && item.maquina_perda || '').trim(),
      cliente: cliente,
      qtd_perdida: qtdPerdida,
      vl_unit: vlUnit,
      vl_total: vlTotal,
      valor_unitario: vlUnit,
      valor_perdido: vlTotal,
      usuario: String(item && (item.usuario_conclusao || item.concluido_por || item.usuario) || '').trim() || '—',
      usuario_conclusao: String(item && (item.usuario_conclusao || item.concluido_por || item.usuario) || '').trim() || '—',
      concluido_por: String(item && (item.usuario_conclusao || item.concluido_por || item.usuario) || '').trim() || '—',
      operador_display: operadorDisplay,
      operador_principal: String(item && item.operador_principal || '').trim(),
      operadores_nomes: operadores.join(', '),
      operadores: operadores,
      turno: String(item && item.turno || '').trim(),
      imgUrl: imgUrl,
      imagem_url: imgUrl,
      motivo: String(item && item.motivo || '').trim(),
      data: String(item && (item.data || item.created_at || item.updated_at || '') || '').slice(0, 10),
      created_at: String(item && (item.created_at || item.updated_at || '') || ''),
      mes_referencia: String(item && item.mes_referencia || '').trim() || String(item && (item.data || item.created_at || '') || '').slice(0, 7),
      empresa_id: String(item && (item.empresa_id || item.emp_id) || '').trim()
    };
  }

  async function fetchInconformidadesCp() {
    var resp = await fetch('/api/caixas_perdidas', { headers: authHeaders() });
    var json = await resp.json().catch(function() { return null; });
    if (!resp.ok) throw new Error(String(json && json.error || resp.status));
    var arr = Array.isArray(json) ? json : (Array.isArray(json && json.data) ? json.data : (Array.isArray(json && json.inconformidades) ? json.inconformidades : []));
    return arr.map(normalizeInconfRow);
  }

  function filterCpRows(rows) {
    var listaBase = Array.isArray(rows) ? rows : [];
    var periodo = getCpPeriodo();
    var maqNomeSel = getMaquinaSelecionadaNome();
    var mesSel = String((document.getElementById('cp-mesref') || {}).value || (window._cpFiltro && window._cpFiltro.mes_ref) || '').trim();
    var tipo = String((window._cpFiltro && window._cpFiltro.tipo) || '').trim().toLowerCase();
    var mesAtual = '';
    try { mesAtual = new Date().toISOString().slice(0, 7); } catch (_) { mesAtual = ''; }
    var semanaDe = '';
    var semanaAte = '';
    if (tipo === 'semana') {
      try {
        var now = new Date();
        var d = new Date(now);
        var dow = d.getDay();
        var diff = (dow === 0 ? -6 : (1 - dow));
        d.setDate(d.getDate() + diff);
        semanaDe = d.toISOString().slice(0, 10);
        var d2 = new Date(d);
        d2.setDate(d2.getDate() + 6);
        semanaAte = d2.toISOString().slice(0, 10);
      } catch (_) {}
    }
    return listaBase.filter(function(r) {
      var data = String(r && (r.data || '') || '').slice(0, 10);
      var mr = String(r && (r.mes_referencia || (data ? data.slice(0, 7) : '')) || '').trim();
      if (tipo === 'mes') {
        var alvoMes = mesSel || mesAtual;
        if (alvoMes && mr !== alvoMes) return false;
      } else if (tipo === 'semana') {
        if (semanaDe && data && data < semanaDe) return false;
        if (semanaAte && data && data > semanaAte) return false;
      } else {
        if (periodo.de && data && data < periodo.de) return false;
        if (periodo.ate && data && data > periodo.ate) return false;
        if (mesSel) {
          if (mr !== mesSel) return false;
        }
      }
      if (maqNomeSel && normMaq(r && r.maquina) !== normMaq(maqNomeSel) && normMaq(r && r.maquina) !== normMaq(String((document.getElementById('cp-maq') || {}).value || ''))) return false;
      return true;
    });
  }

  function renderCpRowsPatched(rows) {
    var lista = filterCpRows(rows);
    var totalQtd = lista.reduce(function(s, r) { return s + (Number(r && r.qtd_perdida || 0) || 0); }, 0);
    var totalValor = lista.reduce(function(s, r) { return s + (Number(r && (r.vl_total != null ? r.vl_total : r.valor_perdido) || 0) || 0); }, 0);
    var cards = document.getElementById('cp-cards');
    if (cards) {
      cards.innerHTML = ''
        + '<div class="card"><div class="card-lbl">Total Caixas Perdidas</div><div class="card-val cv-r">' + fmtNumLocal(totalQtd) + '</div><div class="card-sub">unidades</div></div>'
        + '<div class="card"><div class="card-lbl">Valor Total Perdido</div><div class="card-val cv-r" style="font-size:1.1rem">' + fmtMoneyLocal(totalValor) + '</div></div>'
        + '<div class="card"><div class="card-lbl">Ocorrências</div><div class="card-val cv-a">' + fmtNumLocal(lista.length) + '</div></div>';
    }

    var tbody = document.querySelector('#cp-table tbody');
    if (!tbody) return;
    try {
      var thead = document.querySelector('#cp-table thead');
      var ths = thead ? thead.querySelectorAll('th') : null;
      if (ths && ths[0]) ths[0].textContent = 'Data';
      if (ths && ths[1]) ths[1].textContent = 'OF';
      if (ths && ths[2]) ths[2].textContent = 'Máquina';
      if (ths && ths[3]) ths[3].textContent = 'Cliente';
      if (ths && ths[4]) ths[4].textContent = 'Qtd Perdida';
      if (ths && ths[5]) ths[5].textContent = 'Operadores';
      if (ths && ths[6]) ths[6].textContent = 'Turno';
      if (ths && ths[7]) ths[7].textContent = 'Concluído por';
      if (ths && ths[8]) ths[8].textContent = 'Produto';
      if (ths && ths[9]) ths[9].textContent = 'Valor';
    } catch (_) {}
    tbody.innerHTML = lista.map(function(item) {
      var id = String(item && item.id || '').trim();
      var maquinaDisplay = (item && (item.maquina || item.maquina_perda)) || '—';
      var operadoresLista = Array.isArray(item && item.operadores) ? item.operadores : [];
      var operadorDisplay = String(item && (item.operador_display || item.usuario) || '—').trim() || '—';
      var qtdPerdida = Number(item && item.qtd_perdida || 0) || 0;
      var vlUnit = Number(item && (item.vl_unit != null ? item.vl_unit : item.valor_unitario) || 0) || 0;
      var vlTotal = Number(item && (item.vl_total != null ? item.vl_total : item.valor_perdido) || 0) || ((qtdPerdida || 0) * (vlUnit || 0));
      var turno = String(item && item.turno || '').trim() || '—';
      var operadores = operadoresLista.length
        ? operadoresLista.map(function(op) {
            return '<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;background:rgba(96,165,250,.16);border:1px solid rgba(96,165,250,.35);color:#dbeafe;font-size:11px;font-weight:700;margin:2px 4px 2px 0">' + escHLocal2(op) + '</span>';
          }).join('')
        : escHLocal2(operadorDisplay || '—');
      var imgCell = '';
      return ''
        + '<tr data-cp-id="' + escAttrLocal2(id) + '">'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-family:var(--mono);font-size:.72rem;color:var(--text2)">' + escHLocal2(fmtDataLocal(item && (item.data || item.created_at))) + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-family:var(--mono);font-size:.74rem;color:var(--accent)">' + escHLocal2(item && item.of_numero || '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem;white-space:nowrap">' + escHLocal2(maquinaDisplay) + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem">' + escHLocal2(item && (item.cliente_nome || item.cliente) || '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);text-align:right;font-family:var(--mono);font-weight:800;color:var(--red)">' + fmtNumLocal(qtdPerdida) + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem">' + operadores + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem;text-align:center">' + escHLocal2(turno) + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem">' + escHLocal2(item && (item.concluido_por || item.usuario_conclusao || item.usuario) || '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);font-size:.75rem">' + escHLocal2(item && item.produto || '—') + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);text-align:right;font-family:var(--mono);font-weight:800">' + (vlTotal > 0 ? fmtMoneyLocal(vlTotal) : (vlUnit > 0 ? fmtMoneyLocal(vlUnit) : '—')) + '</td>'
        + '<td style="padding:7px 10px;border:1px solid var(--border);text-align:center">' + imgCell + '</td>'
        + '</tr>';
    }).join('') || '<tr><td colspan="11" style="padding:10px;border:1px solid var(--border);color:var(--text2);text-align:center">Sem lançamentos no período</td></tr>';
    try {
      if (!document.getElementById('patch-style-cp-hide-foto')) {
        var st = document.createElement('style');
        st.id = 'patch-style-cp-hide-foto';
        st.textContent = '#cp-table th:nth-child(11), #cp-table td:nth-child(11){display:none !important;}';
        document.head.appendChild(st);
      }
    } catch (_) {}
  }

  window.renderCaixasPerdidas = function() {
    try {
      var container0 = document.querySelector('#caixas-perdidas-content, [data-section="caixas-perdidas"], .caixas-perdidas-container, #analises-content, #main-content, #page-caixas-perdidas');
      if (container0) {
        container0.dataset.secaoAtiva = 'caixas-perdidas';
        container0.setAttribute('data-secao-ativa', 'caixas-perdidas');
      }
    } catch (_) {}
    renderCpRowsPatched(Array.isArray(window._cpRows) ? window._cpRows : []);
    try { fixarBotaoNovaInconformidade(); } catch (_) {}
  };

  if (typeof window.cpRender === 'function' && !window.cpRender._patchInconfRows) {
    var _cpRenderOriginal = window.cpRender;
    window.cpRender = function(rows) {
      try {
        renderCpRowsPatched(Array.isArray(rows) ? rows : (Array.isArray(window._cpRows) ? window._cpRows : []));
      } catch (_) {
        return _cpRenderOriginal.apply(this, arguments);
      }
    };
    window.cpRender._patchInconfRows = true;
  }

  if (typeof window.carregarCaixasPerdidas === 'function' && !window.carregarCaixasPerdidas._patchInconfRows) {
    var _carregarCaixasPerdidasOriginal = window.carregarCaixasPerdidas;
    window.carregarCaixasPerdidas = async function() {
      var result = await _carregarCaixasPerdidasOriginal.apply(this, arguments);
      try {
        var itens = await fetchInconformidadesCp();
        if (Array.isArray(itens)) {
          window._cpRows = itens;
          renderCpRowsPatched(itens);
        }
      } catch (_) {}
      try { fixarBotaoNovaInconformidade(); } catch (_) {}
      return result;
    };
    window.carregarCaixasPerdidas._patchInconfRows = true;
  }

  async function carregarOfModal(ofId) {
    var of = getOfCacheById(ofId);
    if (of) return of;
    if (!ofId) return null;
    try {
      var resp = await fetch('/api/ofs/' + encodeURIComponent(String(ofId || '').trim()), { headers: authHeaders() });
      var json = await resp.json().catch(function() { return null; });
      return json && (json.data || json) || null;
    } catch (_) {
      return null;
    }
  }

  async function carregarOperadoresModal() {
    try {
      var r = await fetch('/api/operadores?t=' + Date.now(), { headers: authHeaders() });
      var j = await r.json().catch(function() { return null; });
      var ops = (j && j.ok && Array.isArray(j.data)) ? j.data : (Array.isArray(j && j.data) ? j.data : []);
      return uniqStrings(ops.map(function(o) { return String(o && (o.nome || o.name || o.operador_nome) || '').trim(); }));
    } catch (_) {
      return [];
    }
  }

  window.adicionarOperadorInconf = function(nome) {
    var n = String(nome || '').trim().toUpperCase();
    if (!n) return;
    var container = document.getElementById('inconf-operadores-chips');
    if (!container) return;
    var selVal = (window.CSS && typeof window.CSS.escape === 'function')
      ? window.CSS.escape(n)
      : n.replace(/[^a-zA-Z0-9_\-]/g, function(ch) { return '\\' + ch; });
    if (container.querySelector('input[value="' + selVal + '"]')) return;
    var label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(59,130,246,0.15);border:1px solid #3b82f6;border-radius:20px;cursor:pointer;font-size:12px;color:#f1f5f9;user-select:none';
    label.innerHTML = '<input type="checkbox" value="' + escAttrLocal2(n) + '" checked style="width:14px;height:14px;accent-color:#3b82f6"> ' + escHLocal2(n);
    container.appendChild(label);
  };

  window.calcularValorInconf = function() {
    var qtd = Number((document.getElementById('inconf-qtd') || {}).value || 0);
    var vl = Number((document.getElementById('inconf-vl-unit') || {}).value || 0);
    var total = document.getElementById('inconf-vl-total');
    if (total) total.value = (qtd * vl).toFixed(2);
  };

  window.abrirModalInconformidade = async function(ofId, ofNumero, maquinaParam) {
    try {
      var old = document.getElementById('modal-nova-inconformidade');
      if (old) old.remove();
    } catch (_) {}

    var ofData = await carregarOfModal(ofId);
    var produto = String(ofData && (ofData.produto || ofData.descricao || ofData.prodDesc) || '').trim();
    var cliente = String(ofData && (ofData.cli_nome || ofData.cliente || ofData.cliente_nome || ofData.cliNome) || '').trim();
    var maquina = String(maquinaParam || ofData && (ofData.maquina || ofData.maq || ofData.maquina_atual) || '').trim();
    var vlUnit = Number(ofData && (ofData.vl_unit || ofData.valor_unitario) || 0) || 0;
    var operadores = parseArrayField(ofData && (ofData.operadores || ofData.operadores_of || ofData.operadoresOf));
    var opOptions = await carregarOperadoresModal();

    var modal = document.createElement('div');
    modal.id = 'modal-nova-inconformidade';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.78);backdrop-filter:blur(4px);z-index:100001;display:flex;align-items:center;justify-content:center;padding:16px';
    modal.innerHTML = ''
      + '<div style="width:min(760px,96vw);max-height:92vh;overflow:auto;background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,0.45);padding:22px">'
      + '  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px">'
      + '    <div>'
      + '      <div style="font-size:18px;font-weight:700;color:#f8fafc">⚠️ Registrar Perda / Inconformidade</div>'
      + '      <div style="font-size:12px;color:#94a3b8;margin-top:4px">Preencha os dados da perda para alimentar a análise de caixas perdidas.</div>'
      + '    </div>'
      + '    <button type="button" id="btn-fechar-inconf-modal" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer">✕</button>'
      + '  </div>'
      + '  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px">'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">OF</label><input id="inconf-of-numero" value="' + escAttrLocal2(ofNumero || ofData && (ofData.numero || ofData.of) || '') + '" readonly style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">MÁQUINA</label><input id="inconf-maquina" value="' + escAttrLocal2(maquina) + '" placeholder="Ex: IMP 01" style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">PRODUTO</label><input id="inconf-produto" value="' + escAttrLocal2(produto) + '" readonly style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">CLIENTE</label><input id="inconf-cliente" value="' + escAttrLocal2(cliente) + '" readonly style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">QTD PERDIDA</label><input id="inconf-qtd" type="number" min="0" step="1" oninput="calcularValorInconf()" style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">VL UNIT</label><input id="inconf-vl-unit" type="number" min="0" step="0.01" value="' + escAttrLocal2(vlUnit ? vlUnit.toFixed(2) : '') + '" oninput="calcularValorInconf()" style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">VL TOTAL</label><input id="inconf-vl-total" type="number" min="0" step="0.01" readonly style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '    <div><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">MOTIVO</label><input id="inconf-motivo" placeholder="Ex: Erro de impressão" style="width:100%;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc"></div>'
      + '  </div>'
      + '  <div style="margin-top:16px">'
      + '    <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:5px">OPERADORES</label>'
      + '    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
      + '      <input id="inconf-operador-input" list="inconf-operadores-list" placeholder="Digite ou selecione um operador" style="flex:1;min-width:220px;padding:10px 12px;background:#111827;border:1px solid #273449;border-radius:8px;color:#f8fafc">'
      + '      <datalist id="inconf-operadores-list">' + opOptions.map(function(op) { return '<option value="' + escAttrLocal2(op) + '"></option>'; }).join('') + '</datalist>'
      + '      <button type="button" id="btn-add-operador-inconf" style="padding:10px 14px;background:#2563eb;border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer">+ Operador</button>'
      + '    </div>'
      + '    <div id="inconf-operadores-chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"></div>'
      + '  </div>'
      + '  <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px">'
      + '    <button type="button" id="btn-cancelar-inconf" style="padding:10px 16px;background:#1f2937;border:1px solid #334155;border-radius:8px;color:#e5e7eb;cursor:pointer">Cancelar</button>'
      + '    <button type="button" id="btn-confirmar-inconf" onclick="confirmarRegistroInconformidade(\'' + escAttrLocal2(ofId || '') + '\',\'' + escAttrLocal2(ofNumero || ofData && (ofData.numero || ofData.of) || '') + '\',\'' + escAttrLocal2(maquina) + '\')" style="padding:10px 16px;background:#ef4444;border:none;border-radius:8px;color:#fff;font-weight:700;cursor:pointer">⚠️ Registrar Perda</button>'
      + '  </div>'
      + '</div>';

    modal.addEventListener('click', function(ev) {
      if (ev.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
    try { document.body.style.overflow = 'hidden'; } catch (_) {}

    var closeModal = function() {
      try { modal.remove(); } catch (_) {}
      try { document.body.style.overflow = ''; } catch (_) {}
    };
    var btnClose = document.getElementById('btn-fechar-inconf-modal');
    var btnCancel = document.getElementById('btn-cancelar-inconf');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    var btnAdd = document.getElementById('btn-add-operador-inconf');
    var inpAdd = document.getElementById('inconf-operador-input');
    if (btnAdd) btnAdd.onclick = function() {
      window.adicionarOperadorInconf(inpAdd && inpAdd.value || '');
      if (inpAdd) inpAdd.value = '';
    };
    if (inpAdd) {
      inpAdd.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          window.adicionarOperadorInconf(inpAdd.value || '');
          inpAdd.value = '';
        }
      });
    }

    operadores.forEach(function(op) { window.adicionarOperadorInconf(op); });
    window.calcularValorInconf();
  };

  window.confirmarRegistroInconformidade = async function(ofId, ofNumero, maquinaParam) {
    var maquina = String((document.getElementById('inconf-maquina') || {}).value || maquinaParam || '').trim();
    var qtd = Number((document.getElementById('inconf-qtd') || {}).value || 0);
    var vlUnit = Number((document.getElementById('inconf-vl-unit') || {}).value || 0);
    var vlTotal = Number((document.getElementById('inconf-vl-total') || {}).value || (qtd * vlUnit));
    var motivo = String((document.getElementById('inconf-motivo') || {}).value || '').trim();
    var produto = String((document.getElementById('inconf-produto') || {}).value || '').trim();
    var cliente = String((document.getElementById('inconf-cliente') || {}).value || '').trim();
    var checkboxes = document.querySelectorAll('#inconf-operadores-chips input[type="checkbox"]:checked');
    var operadores = Array.prototype.slice.call(checkboxes).map(function(cb) { return String(cb.value || '').trim(); }).filter(Boolean);

    if (!maquina) { toastLocal('⚠️ Informe a máquina'); return; }
    if (!qtd || qtd <= 0) { toastLocal('⚠️ Informe a quantidade perdida'); return; }

    var btnConfirmar = document.getElementById('btn-confirmar-inconf');
    if (btnConfirmar) { btnConfirmar.disabled = true; btnConfirmar.textContent = 'Salvando...'; }

    try {
      var resp = await fetch('/api/inconformidades', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          of_id: ofId || null,
          of_numero: ofNumero || null,
          maquina: maquina,
          produto: produto || null,
          cliente: cliente || null,
          operadores: operadores,
          operador_principal: operadores[0] || null,
          qtd_perdida: qtd,
          vl_unit: vlUnit,
          vl_total: vlTotal || (qtd * vlUnit),
          motivo: motivo || null
        })
      });
      var data = await resp.json().catch(function() { return null; });
      if (!resp.ok) throw new Error(String(data && data.error || resp.status));
      toastLocal('✅ Inconformidade registrada com sucesso!');
      var modal = document.getElementById('modal-nova-inconformidade');
      if (modal) modal.remove();
      try { document.body.style.overflow = ''; } catch (_) {}
      if (typeof window.carregarCaixasPerdidas === 'function') await window.carregarCaixasPerdidas();
      else if (typeof window.renderCaixasPerdidas === 'function') window.renderCaixasPerdidas();
    } catch (e) {
      toastLocal('❌ Erro ao salvar: ' + String(e && e.message || e));
      if (btnConfirmar) { btnConfirmar.disabled = false; btnConfirmar.textContent = '⚠️ Registrar Perda'; }
    }
  };

  function fixarBotaoNovaInconformidade() {
    Array.prototype.slice.call(document.querySelectorAll('#page-caixas-perdidas button, #page-inconformidades button')).forEach(function(btn) {
      var txt = String(btn && btn.textContent || '').trim();
      if (!txt) return;
      if (!(/inconformidade/i.test(txt) || /registrar perda/i.test(txt) || /nova perda/i.test(txt) || /^registrar$/i.test(txt))) return;
      if (btn.dataset.inconfFixed === '1') return;
      btn.dataset.inconfFixed = '1';
      var onclickAtual = String(btn.getAttribute('onclick') || '');
      if (onclickAtual.indexOf('abrirModalInconformidade') >= 0) return;
      btn.onclick = function(e) {
        try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
        window.abrirModalInconformidade(null, null, null);
      };
    });
  }

  window.fixarBotaoNovaInconformidade = fixarBotaoNovaInconformidade;
  fixarBotaoNovaInconformidade();
  try {
    if (window._obsInconf && typeof window._obsInconf.disconnect === 'function') window._obsInconf.disconnect();
  } catch (_) {}
  try {
    window._obsInconf = new MutationObserver(function(_, observer) {
      if (window._pausarObservers) return;
      fixarBotaoNovaInconformidade();
      var temBotao = document.querySelector('#page-caixas-perdidas button[data-inconf-fixed="1"], #page-inconformidades button[data-inconf-fixed="1"]');
      if (temBotao) {
        try { observer.disconnect(); } catch (_) {}
        try { window._obsInconf = null; } catch (_) {}
      }
    });
    window._obsInconf.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
})();

(function patchPerformanceInputs() {
  var debounce = window._debounce;
  if (typeof window.debounce !== 'function') window.debounce = debounce;
  window._ofsPag = window._ofsPag || { offset: 0, limit: 10, total: 0, hasMore: false, loading: false, filtros: {} };
  window._armazemPag = window._armazemPag || { offset: 0, limit: 10, total: 0, hasMore: false, loading: false, filtros: {} };

  function bindDebouncedInput(selector, delay) {
    Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function(input) {
      if (!input || input.dataset.debounceBound === '1') return;
      var original = input.oninput;
      if (typeof original !== 'function') return;
      input.oninput = debounce(function(ev) { return original.call(this, ev); }, delay);
      input.dataset.debounceBound = '1';
    });
  }

  function bindAll() {
    bindDebouncedInput('#pcp-busca', 300);
    bindDebouncedInput('#busca-of', 300);
    bindDebouncedInput('#busca-cliente', 300);
    bindDebouncedInput('#busca-geral', 300);
    bindDebouncedInput('#lanc-busca', 300);
    bindDebouncedInput('input[placeholder*="Buscar"]', 300);
    bindDebouncedInput('input[placeholder*="buscar"]', 300);
    bindDebouncedInput('input[placeholder*="Filtrar"]', 300);
    bindDebouncedInput('input[placeholder*="pesquisar"]', 300);
  }

  function wrapRenderer(nome) {
    if (typeof window[nome] !== 'function' || window[nome]._patchDebounceInputs) return;
    var original = window[nome];
    var wrapped = function() {
      var result = original.apply(this, arguments);
      setTimeout(bindAll, 0);
      return result;
    };
    wrapped._patchDebounceInputs = true;
    window[nome] = wrapped;
  }

  function init() {
    wrapRenderer('renderPCP');
    wrapRenderer('renderLancamento');
    bindAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 800);
  setTimeout(init, 1800);
  setTimeout(bindAll, 2500);
})();

(function patchCheckupHotfixes() {
  function esc(v) {
    try { if (typeof window.escH === 'function') return window.escH(v); } catch (_) {}
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function tokenHeaders(extra) {
    var token = '';
    try { token = String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim(); } catch (_) {}
    var headers = extra ? Object.assign({}, extra) : {};
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  function toastHotfix(msg, tone) {
    try { if (typeof window.mostrarToast === 'function') return window.mostrarToast(msg); } catch (_) {}
    try { if (typeof window.toast === 'function') return window.toast(msg, tone || 'var(--accent)'); } catch (_) {}
    try { alert(msg); } catch (_) {}
  }

  function ensurePainelClienteScroll() {
    try {
      var modal = document.querySelector('#modal-hist-cli .modal');
      if (modal) {
        modal.style.maxHeight = '85vh';
        modal.style.overflowY = 'auto';
      }
      var body = document.getElementById('hist-cli-body');
      if (body) {
        body.style.maxHeight = 'calc(85vh - 90px)';
        body.style.overflowY = 'auto';
      }
    } catch (_) {}
  }

  function hideProjecaoVendas() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('#widget-projecao-vendas, .projecao-vendas, [id*="projecao"]')).forEach(function(el) {
        if (!el) return;
        var box = el.closest ? (el.closest('.sbox') || el) : el;
        box.style.display = 'none';
      });
    } catch (_) {}
  }

  window.abrirRankingClientes = async function(tipo) {
    var tipoNorm = String(tipo || '').trim().toLowerCase();
    tipoNorm = (tipoNorm === 'valor' || tipoNorm === 'faturamento') ? 'faturamento' : 'quantidade';
    var resp = await fetch('/api/clientes/ranking?tipo=' + encodeURIComponent(tipoNorm) + '&limit=30&t=' + Date.now(), {
      headers: tokenHeaders()
    });
    var data = await resp.json().catch(function() { return []; });
    var lista = Array.isArray(data) ? data : (Array.isArray(data && data.data) ? data.data : []);

    var anterior = document.getElementById('modal-ranking-clientes');
    if (anterior) anterior.remove();

    var titulo = tipoNorm === 'faturamento' ? 'Maior Valor' : 'Quem Mais Pede';
    var overlay = document.createElement('div');
    overlay.id = 'modal-ranking-clientes';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:20px';

    var rows = lista.slice(0, 30).map(function(c, i) {
      var medalha = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '#' + (i + 1)));
      var val = tipoNorm === 'faturamento'
        ? 'R$ ' + (Number(c && c.faturamento || 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : String(Number(c && c.total_ofs || 0) || 0) + ' OFs';
      return '<tr style="border-bottom:1px solid #2d3748">'
        + '<td style="padding:8px 12px;font-size:18px">' + esc(medalha) + '</td>'
        + '<td style="padding:8px 12px;color:#f1f5f9">' + esc(c && c.nome || '—') + '</td>'
        + '<td style="padding:8px 12px;color:#64748b">' + esc(c && c.cidade || '') + '</td>'
        + '<td style="padding:8px 12px;text-align:right;color:#3b82f6;font-weight:600">' + esc(val) + '</td>'
        + '</tr>';
    }).join('');

    overlay.innerHTML = '<div style="background:#1e2433;border:1px solid #2d3748;border-radius:14px;padding:28px;width:100%;max-width:600px;max-height:85vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.6);position:relative">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
      + '<h2 style="font-size:18px;font-weight:700;color:#f1f5f9;margin:0">' + esc(tipoNorm === 'faturamento' ? '💰 Maior Valor' : '📦 Quem Mais Pede') + '</h2>'
      + '<button type="button" id="ranking-close-hotfix" style="background:none;border:none;color:#64748b;font-size:24px;cursor:pointer">×</button></div>'
      + '<table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #2d3748">'
      + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b">#</th>'
      + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b">CLIENTE</th>'
      + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b">CIDADE</th>'
      + '<th style="padding:8px 12px;text-align:right;font-size:11px;color:#64748b">' + esc(tipoNorm === 'faturamento' ? 'VALOR' : 'OFs') + '</th>'
      + '</tr></thead><tbody>' + (rows || '<tr><td colspan="4" style="padding:12px;color:#94a3b8;text-align:center">Nenhum dado encontrado.</td></tr>') + '</tbody></table></div>';

    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    try { document.getElementById('ranking-close-hotfix').onclick = function() { overlay.remove(); }; } catch (_) {}
  };

  function fixarBotoesRankingClientes() {
    try {
      var btnAtivos = document.getElementById('patch-analise-ativos');
      var btnValor = document.getElementById('patch-analise-valor');
      if (btnAtivos && btnAtivos.dataset.rankFixed !== '1') {
        btnAtivos.dataset.rankFixed = '1';
        btnAtivos.onclick = function() { window.abrirRankingClientes('quantidade'); };
      }
      if (btnValor && btnValor.dataset.rankFixed !== '1') {
        btnValor.dataset.rankFixed = '1';
        btnValor.onclick = function() { window.abrirRankingClientes('faturamento'); };
      }
    } catch (_) {}
  }

  function hideLegacyComissoesUi() {}

  function renderTelaComissoes() {
    try { if (typeof window.injetarBotaoImprimirComissoes === 'function') window.injetarBotaoImprimirComissoes(); } catch (_) {}
  }

  window.gerarEImprimirComissoes = function() {
    try {
      if (typeof window._abrirModalImpressaoComissoes === 'function') return window._abrirModalImpressaoComissoes();
    } catch (_) {}
    return null;
  };

  function hookRenderComissoesSimple() {
    try { renderTelaComissoes(); } catch (_) {}
  }

  window.aplicarClickImagemOF = function() {
    Array.prototype.slice.call(document.querySelectorAll('[data-of-id]')).forEach(function(card) {
      var ofId = String(card && card.dataset && card.dataset.ofId || '').trim();
      if (!ofId) return;
      var temImgReal = card.querySelector('img[src^="http"], img[src^="data:"]');
      if (temImgReal) return;
      var placeholder = card.querySelector(
        '.of-img-placeholder, [data-img-placeholder], .img-placeholder, .of-sem-imagem, .kb-img-ph, .kb-of-img-ph, .cli-of-img-fb, .ofmaq-thumb.of-img, .of-img, img[src=""], img:not([src]), .card-img-area:empty'
      );
      if (!placeholder || placeholder.dataset.clickOk === '1') return;
      placeholder.dataset.clickOk = '1';
      placeholder.style.cursor = 'pointer';
      placeholder.title = '📷 Clique para adicionar foto';
      placeholder.onclick = function(e) {
        try { if (e) { e.stopPropagation(); e.preventDefault(); } } catch (_) {}
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*,application/pdf';
        inp.onchange = async function() {
          var file = inp.files && inp.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = async function(ev) {
            var base64 = ev && ev.target ? ev.target.result : '';
            try {
              if (placeholder.tagName === 'IMG') placeholder.src = base64;
              else {
                placeholder.style.backgroundImage = 'url(' + base64 + ')';
                placeholder.style.backgroundSize = 'cover';
                placeholder.style.backgroundPosition = 'center';
                placeholder.textContent = '';
              }
            } catch (_) {}
            try {
              var token = '';
              try { token = String(window._token || localStorage.getItem('token') || localStorage.getItem('access_token') || '').trim(); } catch (_) {}
              var resp = await fetch('/api/ofs/' + encodeURIComponent(ofId) + '/imagem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token ? ('Bearer ' + token) : '' },
                body: JSON.stringify({ imagem_base64: base64, tipo: file.type })
              });
              toastHotfix(resp.ok ? '📷 Foto salva!' : '❌ Erro ao salvar foto', resp.ok ? 'var(--green)' : 'var(--red)');
            } catch (err) {
              toastHotfix('❌ ' + String(err && err.message || err), 'var(--red)');
            }
          };
          reader.readAsDataURL(file);
        };
        document.body.appendChild(inp);
        inp.click();
        setTimeout(function() { try { document.body.removeChild(inp); } catch (_) {} }, 1000);
      };
    });
  };

  function patchCaixasPerdidasSafe() {
    if (typeof window.carregarCaixasPerdidas === 'function' && !window.carregarCaixasPerdidas._patchSafeHotfix) {
      var origLoad = window.carregarCaixasPerdidas;
      window.carregarCaixasPerdidas = async function() {
        try {
          return await origLoad.apply(this, arguments);
        } catch (_) {
          try { window._cpRows = Array.isArray(window._cpRows) ? window._cpRows : []; } catch (_) {}
          try { if (typeof window.renderCaixasPerdidas === 'function') window.renderCaixasPerdidas(); } catch (_) {}
          return [];
        } finally {
          try {
            var page = document.querySelector('#caixas-perdidas-content, [data-section="caixas-perdidas"], .caixas-perdidas-container, #analises-content, #main-content, #page-caixas-perdidas');
            if (page) {
              page.dataset.secaoAtiva = 'caixas-perdidas';
              page.setAttribute('data-secao-ativa', 'caixas-perdidas');
              page.style.display = '';
            }
            if (typeof window.renderCaixasPerdidas === 'function') window.renderCaixasPerdidas();
          } catch (_) {}
        }
      };
      window.carregarCaixasPerdidas._patchSafeHotfix = true;
    }
    if (typeof window.renderCaixasPerdidas === 'function' && !window.renderCaixasPerdidas._patchSafeHotfix) {
      var origRender = window.renderCaixasPerdidas;
      window.renderCaixasPerdidas = function() {
        try {
          var page = document.querySelector('#caixas-perdidas-content, [data-section="caixas-perdidas"], .caixas-perdidas-container, #analises-content, #main-content, #page-caixas-perdidas');
          if (page) {
            page.dataset.secaoAtiva = 'caixas-perdidas';
            page.setAttribute('data-secao-ativa', 'caixas-perdidas');
            page.style.display = '';
          }
        } catch (_) {}
        try {
          return origRender.apply(this, arguments);
        } catch (_) {
          var tbody = document.querySelector('#cp-table tbody');
          if (tbody) tbody.innerHTML = '<tr><td colspan="11" style="padding:10px;border:1px solid var(--border);color:var(--text2);text-align:center">Sem lancamentos no periodo</td></tr>';
        }
      };
      window.renderCaixasPerdidas._patchSafeHotfix = true;
    }
    if (typeof window.renderCaixasPerdidas === 'function' && !window._renderCaixasProtegido) {
      var _renderCaixasOrig = window.renderCaixasPerdidas;
      window._renderCaixasProtegido = true;
      window.renderCaixasPerdidas = async function() {
        var container = null;
        try {
          container = document.querySelector('#caixas-perdidas-content, [data-section="caixas-perdidas"], .caixas-perdidas-container, #analises-content, #main-content, #page-caixas-perdidas');
          if (container) {
            container.dataset.secaoAtiva = 'caixas-perdidas';
            container.setAttribute('data-secao-ativa', 'caixas-perdidas');
            container.dataset.renderCaixasLock = '1';
          }
          return await _renderCaixasOrig.apply(this, arguments);
        } catch (e) {
          try { console.error('[caixas-perdidas render]', e && e.message || e); } catch (_) {}
          var c = document.querySelector('[data-secao-ativa="caixas-perdidas"]');
          if (c && !c.querySelector('.caixas-tabela, table, #cp-table')) {
            c.innerHTML += '<div style="padding:40px;text-align:center;color:var(--text2)">Sem lançamentos no período</div>';
          }
          return [];
        } finally {
          try {
            if (container) delete container.dataset.renderCaixasLock;
            var tbody2 = document.querySelector('#cp-table tbody');
            if (tbody2 && !tbody2.children.length) {
              tbody2.innerHTML = '<tr><td colspan="11" style="padding:10px;border:1px solid var(--border);color:var(--text2);text-align:center">Sem lançamentos no período</td></tr>';
            }
          } catch (_) {}
        }
      };
      window.renderCaixasPerdidas._patchSafeHotfix = true;
    }
  }

  function tick() {
    ensurePainelClienteScroll();
    hideProjecaoVendas();
    fixarBotoesRankingClientes();
    hookRenderComissoesSimple();
    patchCaixasPerdidasSafe();
    try { window.aplicarClickImagemOF(); } catch (_) {}
  }

  try {
    if (typeof window.renderProjecaoVendas === 'function' && !window.renderProjecaoVendas._patchHideWidget) {
      var origProj = window.renderProjecaoVendas;
      window.renderProjecaoVendas = async function() {
        hideProjecaoVendas();
        return null;
      };
      window.renderProjecaoVendas._patchHideWidget = true;
      window.renderProjecaoVendas._orig = origProj;
    }
  } catch (_) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tick, 200);
      setTimeout(tick, 900);
      setTimeout(function() { try { window.aplicarClickImagemOF(); } catch (_) {} }, 2000);
    });
  } else {
    setTimeout(tick, 200);
    setTimeout(tick, 900);
    setTimeout(function() { try { window.aplicarClickImagemOF(); } catch (_) {} }, 2000);
  }

  try {
    if (window._obsRankHotfix && typeof window._obsRankHotfix.disconnect === 'function') window._obsRankHotfix.disconnect();
  } catch (_) {}
  try {
    window._obsRankHotfix = new MutationObserver(function() {
      if (window._pausarObservers) return;
      ensurePainelClienteScroll();
      hideProjecaoVendas();
      fixarBotoesRankingClientes();
      patchCaixasPerdidasSafe();
      try { window.aplicarClickImagemOF(); } catch (_) {}
    });
    window._obsRankHotfix.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
  setInterval(function() {
    try { window.aplicarClickImagemOF(); } catch (_) {}
  }, 8000);
})();

(function patchLog404Resources() {
  if (window.__patchLog404ResourcesInstalled) return;
  window.__patchLog404ResourcesInstalled = true;

  try {
    window.addEventListener('error', function(ev) {
      try {
        var t = ev && ev.target;
        if (!t) return;
        var tag = String(t.tagName || '').toLowerCase();
        if (tag === 'img' || tag === 'script' || tag === 'link') {
          var url = '';
          try { url = String(t.src || t.href || '').trim(); } catch (_) { url = ''; }
          if (url) console.warn('[404/RESOURCE]', tag, url);
        }
      } catch (_) {}
    }, true);
  } catch (_) {}

  try {
    var origFetch = window.fetch;
    if (typeof origFetch === 'function' && !origFetch._patchLog404) {
      var wrapped = function(input, init) {
        var url = '';
        try { url = input && typeof input === 'object' && input.url ? String(input.url) : String(input || ''); } catch (_) { url = ''; }
        var p = origFetch.apply(this, arguments);
        try {
          Promise.resolve(p).then(function(res) {
            try { if (res && res.status === 404) console.warn('[404/FETCH]', url); } catch (_) {}
          }).catch(function() {});
        } catch (_) {}
        return p;
      };
      wrapped._patchLog404 = true;
      window.fetch = wrapped;
    }
  } catch (_) {}
})();

(function patchOfAntiLoop() {
  try {
    if (window._patchOfProtegido) return;
    var fnNome = (typeof window.abrirOf === 'function') ? 'abrirOf' : ((typeof window.editarOf === 'function') ? 'editarOf' : '');
    if (!fnNome) return;
    var orig = window[fnNome];
    if (typeof orig !== 'function') return;
    window._patchOfProtegido = true;
    window[fnNome] = function() {
      try { if (window._abrindoOf) return; } catch (_) {}
      window._abrindoOf = true;
      try {
        return orig.apply(this, arguments);
      } finally {
        setTimeout(function() { try { window._abrindoOf = false; } catch (_) {} }, 2000);
      }
    };
  } catch (_) {}
})();

(function patchFixImgSrcVazio() {
  if (window.__patchFixImgSrcVazioInstalled) return;
  window.__patchFixImgSrcVazioInstalled = true;

  function _fixImg(img) {
    try {
      if (!img || img.tagName !== 'IMG') return;
      var src = '';
      try { src = String(img.getAttribute('src') || '').trim(); } catch (_) { src = ''; }
      var isAdm = src.indexOf('adm.italyembalagens.com.br') >= 0;
      var bad =
        !src ||
        src === '[]' ||
        src === 'null' ||
        src === 'undefined' ||
        src.indexOf('[object') >= 0 ||
        src.indexOf('/[]') >= 0 ||
        src.indexOf('undefined') >= 0 ||
        (isAdm && (src.indexOf('[') >= 0 || src.endsWith('[')));
      if (bad) {
        try { img.removeAttribute('src'); } catch (_) {}
        try { img.style.display = 'none'; } catch (_) {}
      }
    } catch (_) {}
  }

  function scan() {
    try { Array.prototype.slice.call(document.querySelectorAll('img')).forEach(_fixImg); } catch (_) {}
  }

  try { scan(); } catch (_) {}
  try { setTimeout(scan, 800); } catch (_) {}

  try {
    var _obsImg = new MutationObserver(function(muts) {
      if (window._pausarObservers) return;
      try {
        muts.forEach(function(m) {
          Array.prototype.slice.call(m.addedNodes || []).forEach(function(n) {
            try {
              if (!n) return;
              if (n.tagName === 'IMG') _fixImg(n);
              else if (n.querySelectorAll) Array.prototype.slice.call(n.querySelectorAll('img')).forEach(_fixImg);
            } catch (_) {}
          });
        });
      } catch (_) {}
    });
    _obsImg.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
})();

(function _iniciarPollingOFs() {
  if (window.__patchPollingOFsInstalled) return;
  window.__patchPollingOFsInstalled = true;

  var _ultimaVerificacao = Date.now();
  var _rodando = false;

  function addNovasOfs(reais) {
    if (!Array.isArray(reais) || !reais.length) return;
    var targets = [
      (Array.isArray(window.OFs) ? window.OFs : null),
      (Array.isArray(window.OFS) ? window.OFS : null),
      (Array.isArray(window._OFs) ? window._OFs : null),
      (Array.isArray(window._ofsCarregadas) ? window._ofsCarregadas : null)
    ].filter(Boolean);
    targets.forEach(function(arr) {
      try { Array.prototype.unshift.apply(arr, reais); } catch (_) {}
    });
  }

  async function _verificarOFsNovas() {
    if (_rodando) return;
    _rodando = true;
    try {
      var token = '';
      try { token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || '').trim(); } catch (_) { token = ''; }
      if (!token) return;
      var ts = '';
      try { ts = new Date(_ultimaVerificacao - 5000).toISOString(); } catch (_) { ts = ''; }
      var resp = await fetch('/api/ofs?after=' + encodeURIComponent(ts) + '&limit=50&offset=0', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!resp.ok) return;
      var json = await resp.json().catch(function() { return null; });
      var novas = (json && (json.data || json.ofs)) ? (json.data || json.ofs) : [];
      if (!Array.isArray(novas) || !novas.length) {
        _ultimaVerificacao = Date.now();
        return;
      }

      var baseArr = Array.isArray(window.OFs) ? window.OFs : (Array.isArray(window.OFS) ? window.OFS : (Array.isArray(window._OFs) ? window._OFs : []));
      var idsExistentes = new Set((baseArr || []).map(function(o) { return String(o && o.id || '').trim(); }).filter(Boolean));
      var reais = novas.filter(function(o) {
        var id = String(o && o.id || '').trim();
        return id && !idsExistentes.has(id);
      });
      if (reais.length) {
        addNovasOfs(reais);
        try {
          var pcp = document.getElementById('page-pcp');
          var arm = document.getElementById('page-armazenamento');
          var visPcp = pcp && pcp.style.display !== 'none';
          var visArm = arm && arm.style.display !== 'none';
          if (visPcp && typeof window.renderPCP === 'function') window.renderPCP();
          if (visArm && typeof window.renderArmazenamento === 'function') window.renderArmazenamento();
          if ((visPcp || visArm) && typeof window.carregarOFs === 'function') {
            try { window.carregarOFs(true); } catch (_) {}
          }
        } catch (_) {}
        try { console.log('[POLL] ' + reais.length + ' OF(s) nova(s) detectada(s)'); } catch (_) {}
      }
      _ultimaVerificacao = Date.now();
    } catch (e) {
      try { console.warn('[POLL] erro:', e && e.message); } catch (_) {}
    } finally {
      _rodando = false;
    }
  }

  setInterval(_verificarOFsNovas, 30000);
})();

(function patchBackupNotifEChapas() {
  if (window.__patchBackupNotifEChapasInstalled) return;
  window.__patchBackupNotifEChapasInstalled = true;

  function _tokenAuth() {
    try {
      return String(localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim();
    } catch (_) {
      return '';
    }
  }

  window._notificacaoOF = function(mensagem, tipo) {
    tipo = tipo || 'sucesso';
    try {
      var anterior = document.getElementById('notif-of-overlay');
      if (anterior) anterior.remove();
    } catch (_) {}

    var cores = {
      sucesso: { bg: '#16a34a', icon: 'OK' },
      criada: { bg: '#6366f1', icon: 'OF' },
      erro: { bg: '#dc2626', icon: 'ERRO' }
    };
    var cor = cores[tipo] || cores.sucesso;

    var el = document.createElement('div');
    el.id = 'notif-of-overlay';
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'pointer-events:none'
    ].join(';');
    el.innerHTML = ''
      + '<div style="background:' + cor.bg + ';color:#fff;padding:32px 48px;border-radius:16px;font-size:28px;font-weight:700;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:notifSlideIn 0.3s ease;max-width:80vw">'
      + '<div style="font-size:32px;margin-bottom:12px">' + cor.icon + '</div>'
      + String(mensagem || '')
      + '</div>';

    if (!document.getElementById('notif-style')) {
      var style = document.createElement('style');
      style.id = 'notif-style';
      style.textContent = ''
        + '@keyframes notifSlideIn {'
        + 'from { opacity:0; transform: scale(0.8); }'
        + 'to { opacity:1; transform: scale(1); }'
        + '}';
      document.head.appendChild(style);
    }

    document.body.appendChild(el);
    setTimeout(function() {
      try { el.remove(); } catch (_) {}
    }, 3000);
  };

  function _avisar(msg, tipo) {
    try {
      if (typeof window._notificacaoOF === 'function') return window._notificacaoOF(msg, tipo);
    } catch (_) {}
    try {
      if (typeof toast === 'function') return toast(msg, tipo === 'erro' ? 'var(--red)' : 'var(--green)');
    } catch (_) {}
    try { alert(msg); } catch (_) {}
  }

  async function _exportarBackup() {
    var token = _tokenAuth();
    try {
      var resp = await fetch('/api/backup/exportar', {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var blob = await resp.blob();
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'backup-italy-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        try { URL.revokeObjectURL(url); } catch (_) {}
        try { a.remove(); } catch (_) {}
      }, 300);
      _avisar('Backup exportado com sucesso!', 'sucesso');
    } catch (e) {
      _avisar('Erro ao exportar: ' + String(e && e.message || e), 'erro');
    }
  }

  async function _importarBackup() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async function(e) {
      var file = e && e.target && e.target.files && e.target.files[0];
      if (!file) return;
      var texto = await file.text();
      var dados = null;
      try {
        dados = JSON.parse(texto);
      } catch (_) {
        alert('Arquivo JSON inválido');
        return;
      }

      var totalOfs = Number(dados && dados.total_ofs || (Array.isArray(dados && dados.ofs) ? dados.ofs.length : 0)) || 0;
      var totalClientes = Number(dados && dados.total_clientes || (Array.isArray(dados && dados.clientes) ? dados.clientes.length : 0)) || 0;
      if (!confirm('Importar ' + totalOfs + ' OFs e ' + totalClientes + ' clientes?\nIsso vai atualizar registros existentes.')) return;

      try {
        var token = _tokenAuth();
        var resp = await fetch('/api/backup/importar', {
          method: 'POST',
          headers: Object.assign(
            { 'Content-Type': 'application/json' },
            token ? { Authorization: 'Bearer ' + token } : {}
          ),
          body: JSON.stringify(dados)
        });
        var json = await resp.json().catch(function() { return null; });
        if (!resp.ok || !json || json.ok === false) {
          throw new Error(String(json && json.error || 'falha ao importar'));
        }
        _avisar('Importado! ' + json.ofs_importadas + ' OFs e ' + json.clientes_importados + ' clientes', 'sucesso');
        if (json.erros && json.erros.length) console.warn('[IMPORT] erros:', json.erros);
      } catch (err) {
        alert('Erro ao importar: ' + String(err && err.message || err));
      }
    };
    input.click();
  }

  window._exportarBackup = _exportarBackup;
  window._importarBackup = _importarBackup;

  function _adicionarBotoesBackup() {
    try {
      var toolbar = document.querySelector(
        '#page-pcp .topbar-actions, #page-armazenamento .toolbar, ' +
        '#page-pcp .pcp-actions, #page-armazenamento .top-bar, ' +
        '.armazenamento-toolbar, [data-page="pcp"] .actions, #page-pcp .ptoolbar'
      );
      if (!toolbar || toolbar.dataset.backupAdded === '1') return;
      toolbar.dataset.backupAdded = '1';

      var btnExportar = document.createElement('button');
      btnExportar.className = 'btn btn-ghost btn-sm';
      btnExportar.id = 'btn-backup-exportar';
      btnExportar.textContent = 'Exportar JSON';
      btnExportar.style.cssText = 'font-size:.75rem;padding:6px 12px;border-radius:6px';
      btnExportar.onclick = function() { _exportarBackup(); };

      var btnImportar = document.createElement('button');
      btnImportar.className = 'btn btn-ghost btn-sm';
      btnImportar.id = 'btn-backup-importar';
      btnImportar.textContent = 'Importar JSON';
      btnImportar.style.cssText = 'font-size:.75rem;padding:6px 12px;border-radius:6px';
      btnImportar.onclick = function() { _importarBackup(); };

      toolbar.appendChild(btnExportar);
      toolbar.appendChild(btnImportar);
    } catch (_) {}
  }

  function _wrapNotifFn(fnName, mensagem, tipo, shouldSkip) {
    try {
      var orig = window[fnName];
      if (typeof orig !== 'function' || orig._patchNotifOfWrapped) return;
      var wrapped = async function() {
        var skip = false;
        try { skip = typeof shouldSkip === 'function' ? !!shouldSkip() : false; } catch (_) {}
        var result = await orig.apply(this, arguments);
        if (!skip) {
          setTimeout(function() {
            try { window._notificacaoOF(mensagem, tipo); } catch (_) {}
          }, 500);
        }
        return result;
      };
      wrapped._patchNotifOfWrapped = true;
      window[fnName] = wrapped;
    } catch (_) {}
  }

  function _patchNotificacoesOF() {
    _wrapNotifFn('salvarOfRapida', 'OF Criada com Sucesso!', 'criada', function() { return !!window._ofRapidaEditandoId; });
    _wrapNotifFn('salvarNovaOfRapida', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('salvarOFRapida', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('salvarNovaOF', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('salvarOF', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('criarOf', 'OF Criada com Sucesso!', 'criada');
    _wrapNotifFn('concluirOfPainel', 'OF Concluída com Sucesso!', 'sucesso');
    _wrapNotifFn('concluirOfModal', 'OF Concluída com Sucesso!', 'sucesso');
    _wrapNotifFn('concluirOf', 'OF Concluída com Sucesso!', 'sucesso');
    _wrapNotifFn('confirmarConclusao', 'OF Concluída com Sucesso!', 'sucesso');
  }

  (function _paginacaoChapas() {
    var paginaAtual = 0;
    var POR_PAGINA = 10;

    function _linhasFiltradas() {
      var busca = String((document.getElementById('sc-busca') || {}).value || '').toLowerCase();
      var status = String((document.getElementById('sc-status') || {}).value || '').trim();
      return Array.prototype.slice.call(document.querySelectorAll('#sc-tbody .sc-linha')).filter(function(tr) {
        var matchB = !busca || String(tr.dataset.busca || '').includes(busca);
        var matchS = !status || String(tr.dataset.status || '') === status;
        return matchB && matchS;
      });
    }

    function _renderPaginado() {
      var container = document.querySelector('#sc-tbody');
      if (!container) return;

      var todasLinhas = Array.prototype.slice.call(container.querySelectorAll('.sc-linha'));
      if (!todasLinhas.length) return;

      var filtradas = _linhasFiltradas();
      var total = filtradas.length;
      var totalPags = Math.max(1, Math.ceil(total / POR_PAGINA));
      if (paginaAtual >= totalPags) paginaAtual = totalPags - 1;
      if (paginaAtual < 0) paginaAtual = 0;

      todasLinhas.forEach(function(el) { el.style.display = 'none'; });
      filtradas.forEach(function(el, i) {
        el.style.display = (i >= paginaAtual * POR_PAGINA && i < (paginaAtual + 1) * POR_PAGINA) ? '' : 'none';
      });

      var paginador = document.getElementById('chapas-paginador');
      if (total <= POR_PAGINA) {
        if (paginador) paginador.remove();
        return;
      }

      if (!paginador) {
        paginador = document.createElement('div');
        paginador.id = 'chapas-paginador';
        paginador.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px;justify-content:center;margin-top:8px';
        var host = container.closest('table');
        host = host && host.parentElement ? host.parentElement : (container.parentElement || container);
        host.appendChild(paginador);
      }

      paginador.innerHTML = ''
        + '<button type="button" onclick="window._chapasAnterior()" ' + (paginaAtual === 0 ? 'disabled' : '') + ' style="padding:8px 16px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg2,#1a1a2e);color:var(--text1,#fff);cursor:pointer;' + (paginaAtual === 0 ? 'opacity:.4;' : '') + '">&larr; Anterior</button>'
        + '<span style="color:var(--text2,#aaa);font-size:13px">Pagina ' + (paginaAtual + 1) + ' de ' + totalPags + ' <span style="font-size:11px">(' + total + ' OFs)</span></span>'
        + '<button type="button" onclick="window._chapasProximo()" ' + (paginaAtual >= totalPags - 1 ? 'disabled' : '') + ' style="padding:8px 16px;border-radius:6px;border:1px solid var(--border,#333);background:var(--bg2,#1a1a2e);color:var(--text1,#fff);cursor:pointer;' + (paginaAtual >= totalPags - 1 ? 'opacity:.4;' : '') + '">Proximo &rarr;</button>';
    }

    window._chapasAnterior = function() {
      if (paginaAtual > 0) {
        paginaAtual -= 1;
        _renderPaginado();
      }
    };

    window._chapasProximo = function() {
      paginaAtual += 1;
      _renderPaginado();
    };

    function _wrapSelChapas(fnName, resetPage) {
      try {
        var orig = window[fnName];
        if (typeof orig !== 'function' || orig._patchChapasPaginado) return;
        window[fnName] = function() {
          var result = orig.apply(this, arguments);
          if (resetPage) paginaAtual = 0;
          setTimeout(_renderPaginado, 150);
          setTimeout(_renderPaginado, 500);
          return result;
        };
        window[fnName]._patchChapasPaginado = true;
      } catch (_) {}
    }

    function _tickChapas() {
      _wrapSelChapas('renderSelecaoChapas', true);
      _wrapSelChapas('filtrarTabelaSelChapas', false);
      try {
        var pg = document.querySelector('#page-sel-chapas');
        if (pg && pg.style.display !== 'none' && document.getElementById('sc-tbody')) {
          setTimeout(_renderPaginado, 120);
        }
      } catch (_) {}
    }

    var obsChapas = new MutationObserver(function() {
      if (window._pausarObservers) return;
      try {
        var pg = document.querySelector('#page-sel-chapas');
        if (pg && pg.style.display !== 'none') {
          paginaAtual = 0;
          setTimeout(_tickChapas, 150);
        }
      } catch (_) {}
    });
    obsChapas.observe(document.body, { childList: true, subtree: true });
    setTimeout(_tickChapas, 400);
    setInterval(_tickChapas, 1500);
  })();

  (function _hubPinsChapas() {
    function _injectHubPinIntoChapasRows() {
      try {
        Array.prototype.slice.call(document.querySelectorAll('#tabelaChapasEstoque #est-table-body tr')).forEach(function(tr) {
          if (!tr) return;
          var actionsWrap = tr.querySelector('td[data-label="Ações"] > div') || tr.querySelector('td:last-child > div');
          if (!actionsWrap) return;
          var refBtn = actionsWrap.querySelector('[data-acao-chapa][data-id]') || actionsWrap.querySelector('.btn-pin-chapa');
          var chapaId = String(refBtn && refBtn.getAttribute('data-id') || '').trim();
          if (!chapaId) {
            var onclickRaw = String(refBtn && refBtn.getAttribute('onclick') || '').trim();
            var match = onclickRaw.match(/togglePinChapa\('([^']+)'/);
            chapaId = String(match && match[1] || '').trim();
          }
          if (!chapaId) return;

          var btn = actionsWrap.querySelector('.patch-hub-pin-chapa');
          if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-icon btn-sm patch-hub-pin-chapa';
            btn.textContent = '📌';
            btn.setAttribute('data-pin-type', 'chapa');
            btn.setAttribute('data-pin-id', chapaId);
            btn.setAttribute('title', 'Fixar chapa no Hub');
            btn.style.cssText = 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;padding:4px 6px;cursor:pointer;font-size:0.78rem;line-height:1;';
            btn.onclick = function(ev) {
              try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
              try {
                if (typeof window.__patchOpenPinModal === 'function') window.__patchOpenPinModal('chapa', chapaId, 'Chapa');
              } catch (_) {}
            };
            var nextRef = actionsWrap.querySelector('.btn-pin-chapa');
            if (nextRef && nextRef.nextSibling) actionsWrap.insertBefore(btn, nextRef.nextSibling);
            else actionsWrap.appendChild(btn);
          }

          btn.setAttribute('data-pin-id', chapaId);
          try { _applyPinStateToButton(btn); } catch (_) {}
        });
      } catch (_) {}
    }

    function _tickHubPinChapas() {
      try {
        if (!document.getElementById('tabelaChapasEstoque')) return;
        _injectHubPinIntoChapasRows();
      } catch (_) {}
    }

    try {
      var obs = new MutationObserver(function() {
        if (window._pausarObservers) return;
        setTimeout(_tickHubPinChapas, 80);
      });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
    setTimeout(_tickHubPinChapas, 700);
    setInterval(_tickHubPinChapas, 1500);
  })();

  try {
    var obsBackup = new MutationObserver(function() {
      if (window._pausarObservers) return;
      _adicionarBotoesBackup();
      _patchNotificacoesOF();
    });
    obsBackup.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}

  setTimeout(_adicionarBotoesBackup, 600);
  setTimeout(_adicionarBotoesBackup, 1200);
  setInterval(_patchNotificacoesOF, 1500);
  _patchNotificacoesOF();
})();

function _renderTabelaVendedores(json) {
  try {
    if (!json || !json.vendedores || !json.vendedores.length) return;
    var pg = document.querySelector('#page-comissoes, [data-page="comissoes"]');
    if (!pg) return;
    var tbody = document.querySelector('#tabela-comissoes-vendedor tbody');
    if (!tbody) {
      var tbodies = pg.querySelectorAll('tbody');
      tbody = tbodies && tbodies[0] ? tbodies[0] : null;
    }
    if (!tbody) return;
    var fmt = function(v) {
      return 'R$\u00a0' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    tbody.innerHTML = (json.vendedores || []).map(function(v) {
      return ''
        + '<tr>'
        + '<td style="padding:10px 14px 10px 16px;text-align:left">' + String(v && v.nome || '—') + '</td>'
        + '<td style="text-align:center;padding:10px 14px">' + String(Number(v && v.ofs || 0) || 0) + '</td>'
        + '<td style="text-align:center;padding:10px 14px">' + fmt(v && v.total) + '</td>'
        + '<td style="text-align:center;padding:10px 14px">' + (Number(v && v.comissao_pct || 1) || 1).toFixed(2) + '%</td>'
        + '<td style="text-align:center;padding:10px 14px;color:#4ade80;font-weight:600">' + fmt(v && v.comissao_rs) + '</td>'
        + '<td style="padding:10px 14px">—</td>'
        + '</tr>';
    }).join('') + ''
      + '<tr data-com-total="1" style="font-weight:700;border-top:2px solid #334155">'
      + '<td style="padding:10px 14px 10px 16px;text-align:left">TOTAL</td>'
      + '<td style="text-align:center;padding:10px 14px">' + String(json.total_ofs || 0) + '</td>'
      + '<td style="text-align:center;padding:10px 14px">' + fmt(json.total_vendido) + '</td>'
      + '<td style="text-align:center;padding:10px 14px"></td>'
      + '<td style="text-align:center;padding:10px 14px;color:#4ade80">' + fmt(json.total_comissao) + '</td>'
      + '<td></td>'
      + '</tr>';
    try { _aplicarCoresResumoVendedores(); } catch (_) {}
  } catch (_) {}
}

function _aplicarCoresResumoVendedores() {
  try {
    var pg = document.querySelector('#page-comissoes, [data-page="comissoes"]');
    if (!pg) return;
    var tbody = document.querySelector('#tabela-comissoes-vendedor tbody');
    if (!tbody) {
      var tbodies = pg.querySelectorAll('tbody');
      tbody = tbodies && tbodies[0] ? tbodies[0] : null;
    }
    if (!tbody) return;
    var tabelaResumo = tbody.closest ? tbody.closest('table') : null;
    if (!tabelaResumo) return;
    var linhas = tabelaResumo.querySelectorAll('tbody tr');
    var cores = ['#1a2744', '#1a3a2a', '#2d1f3a', '#2d2a1a'];
    var idx = 0;
    Array.prototype.slice.call(linhas).forEach(function(tr) {
      try {
        var textoLinha = String(tr.textContent || '').toUpperCase();
        if (textoLinha.indexOf('TOTAL') >= 0 || tr.getAttribute('data-com-total') === '1') {
          tr.style.background = '#0f172a';
          tr.style.fontWeight = '700';
          tr.style.borderTop = '2px solid #334155';
        } else {
          tr.style.background = cores[idx % cores.length];
          idx++;
        }
        tr.style.transition = 'filter 0.15s';
        if (!tr.dataset.comHoverBound) {
          tr.dataset.comHoverBound = '1';
          tr.addEventListener('mouseenter', function() { try { tr.style.filter = 'brightness(1.15)'; } catch (_) {} });
          tr.addEventListener('mouseleave', function() { try { tr.style.filter = 'brightness(1)'; } catch (_) {} });
        }
      } catch (_) {}
    });
    window._coresVendedoresAplicadas = true;
  } catch (_) {}
}

function _acharSecaoDetalhamentoOFs() {
  var secao = null;
  try {
    secao = document.querySelector('#section-detalhamento, .section-detalhamento, [data-section="detalhamento-ofs"]');
  } catch (_) {}
  if (secao) return secao;

  try {
    var candidatos = [];
    Array.prototype.slice.call(document.querySelectorAll('h2, h3, h4, h5, span, div, p, b, strong, label, a')).forEach(function(el) {
      try {
        if (String(el.textContent || '').indexOf('Detalhamento das OFs') >= 0) candidatos.push(el);
      } catch (_) {}
    });
    try { console.log('[FIX] candidatos encontrados:', candidatos.length); } catch (_) {}

    candidatos.sort(function(a, b) {
      return (Number(a && a.offsetHeight || 0) || 0) - (Number(b && b.offsetHeight || 0) || 0);
    });

    for (var c = 0; c < candidatos.length && !secao; c += 1) {
      var cand = candidatos[c];
      var el = cand ? cand.parentElement : null;
      for (var i = 0; i < 10 && el && el !== document.body; i += 1) {
        var cls = '';
        try { cls = String(el.className || '').toLowerCase(); } catch (_) { cls = ''; }
        if ((el.offsetHeight || 0) > 80
          && (el.offsetWidth || 0) > 400
          && cls.indexOf('sidebar') < 0
          && String(el.tagName || '') !== 'BODY'
          && String(el.tagName || '') !== 'HTML') {
          secao = el;
          break;
        }
        el = el.parentElement;
      }
    }
  } catch (_) {}

  if (secao) return secao;

  try {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node = null;
    while ((node = walker.nextNode())) {
      var txt = String(node.textContent || '').trim();
      if (txt.indexOf('Detalhamento') >= 0 && txt.indexOf('OFs') >= 0) {
        var alvo = node.parentElement;
        for (var j = 0; j < 10 && alvo && alvo !== document.body; j += 1) {
          if ((alvo.offsetHeight || 0) > 80 && (alvo.offsetWidth || 0) > 400) {
            secao = alvo;
            break;
          }
          alvo = alvo.parentElement;
        }
        if (secao) break;
      }
    }
  } catch (_) {}

  if (secao) return secao;

  try {
    Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function(el) {
      if (secao) return;
      try {
        if (String(el.textContent || '').indexOf('Detalhamento das OFs') >= 0
          && (el.offsetHeight || 0) > 100
          && (el.offsetWidth || 0) > 500) {
          secao = el;
        }
      } catch (_) {}
    });
  } catch (_) {}

  return secao;
}

function _injetarTabelaOFs(secaoDetalhamento, todasOFs, grupos, helpers) {
  helpers = helpers || {};
  var escHtml = helpers.escHtml || function(v) { return String(v == null ? '' : v); };
  var cliNorm = helpers.cliNorm || function(v) { return String(v == null ? '' : v).trim().toLowerCase(); };
  var ensureMapaClientes = helpers.ensureMapaClientes || function() { return window._mapaClientesComissao || {}; };
  var ordemVendedores = (grupos || []).map(function(g) {
    return String(g && (g.vendedor || g.nome || g.vendedor_nome || '') || '').trim();
  });
  var getNomeVend = function(of) {
    var vid = String(of && (of.vendedor_id || of.vendId || of.vend_id || '') || '').trim().toLowerCase();
    var vendMap = window._vendedoresMap || {};
    return String(
      of && (of._vendedor_resolvido || of._vendedor_nome || of.vendedor)
      || vendMap[vid]
      || '—'
    ).trim() || '—';
  };
  var listaOFs = Array.isArray(todasOFs) ? todasOFs.slice() : [];
  listaOFs.sort(function(a, b) {
    var nA = getNomeVend(a);
    var nB = getNomeVend(b);
    var iA = ordemVendedores.indexOf(nA);
    var iB = ordemVendedores.indexOf(nB);
    return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
  });
  try {
    console.log('[INJECT] ordem após sort:', listaOFs.slice(0, 5).map(function(o) { return getNomeVend(o); }));
  } catch (_) {}

  var totaisPorVendedor = Object.create(null);
  listaOFs.forEach(function(of) {
    var nome = getNomeVend(of);
    if (!totaisPorVendedor[nome]) {
      totaisPorVendedor[nome] = { count: 0, vendas: 0, comissao: 0 };
    }
    totaisPorVendedor[nome].count += 1;
    totaisPorVendedor[nome].vendas += Number(of && (of.valor_total || of.valor_venda || 0) || 0) || 0;
    totaisPorVendedor[nome].comissao += (Number(of && (of.valor_total || of.valor_venda || 0) || 0) || 0)
      * ((Number(of && (of.comissao_pct || 1) || 1) || 1) / 100);
  });

  var cores = ['#1a2744', '#1a3a2a', '#2d1f3a', '#2d2a1a'];
  var coresHeader = [
    { bg: '#0d1f3c', border: '#1d4ed8', text: '#60a5fa' },
    { bg: '#0d2d1a', border: '#059669', text: '#10b981' },
    { bg: '#1f0d3c', border: '#7c3aed', text: '#a78bfa' },
    { bg: '#2d1f0e', border: '#d97706', text: '#f59e0b' }
  ];
  ensureMapaClientes();
  window._comissaoOFs = listaOFs.slice();
  var htmlFinal = '';
  var vendedorAtual = null;
  listaOFs.forEach(function(of, idx) {
    var quantidade = Number(of && (of.quantidade ?? of.qtd ?? 0) || 0) || 0;
    var valorTotal = Number(of && (of.valor_total ?? of.valor_venda ?? 0) || 0) || 0;
    var vu = Number(of && of.valor_unitario || 0) || 0;
    if (!vu && valorTotal && quantidade > 0) vu = valorTotal / quantidade;
    var comPct = Number(of && (of.comissao_pct || 1) || 1) || 1;
    var comissaoRS = valorTotal * (comPct / 100);
    var nomeVend = getNomeVend(of);
    var idxVend = ordemVendedores.indexOf(nomeVend);
    var corBg = cores[(idxVend >= 0 ? idxVend : 0) % cores.length];
    var cHead = coresHeader[(idxVend >= 0 ? idxVend : 0) % coresHeader.length];
    var data = '—';
    try { data = of && of.data_conclusao ? new Date(of.data_conclusao).toLocaleDateString('pt-BR') : '—'; } catch (_) {}
    var nomeCliente = String(of && (of.cliente_nome || of._cliente_nome || of.cliente) || '...') || '...';
    if (nomeVend !== vendedorAtual) {
      vendedorAtual = nomeVend;
      var t = totaisPorVendedor[nomeVend] || {};
      htmlFinal += ''
        + '<tr style="background:' + cHead.bg + ';border-left:4px solid ' + cHead.border + ';border-top:2px solid ' + cHead.border + ';border-bottom:1px solid ' + cHead.border + '">'
        + '<td colspan="11" style="padding:8px 16px;font-weight:700;color:' + cHead.text + ';font-size:13px">'
        + '👤 ' + escHtml(nomeVend)
        + ' &nbsp;·&nbsp; <span style="font-weight:400;color:#94a3b8;font-size:12px">'
        + (t.count || 0) + ' OFs &nbsp;·&nbsp; Total: R$ ' + Number(t.vendas || 0).toFixed(2).replace('.', ',')
        + ' &nbsp;·&nbsp; Comissão: R$ ' + Number(t.comissao || 0).toFixed(2).replace('.', ',')
        + '</span></td></tr>';
    }
    htmlFinal += ''
      + '<tr data-of-idx="' + idx + '" data-cli-id="' + escHtml(of && (of.cli_id || of.cliId || '') || '') + '"'
      + ' style="background:' + corBg + ';border-bottom:1px solid #1e2d40;cursor:default"'
      + ' onmouseenter="this.style.filter=\'brightness(1.15)\'"'
      + ' onmouseleave="this.style.filter=\'\'">'
      + '<td style="padding:9px 12px;text-align:center;font-size:13px;color:#94a3b8">#' + escHtml(of && (of.numero || of.of_numero) || '—') + '</td>'
      + '<td style="padding:9px 12px;text-align:left;font-size:13px" class="td-cli">' + escHtml(nomeCliente) + '</td>'
      + '<td style="padding:9px 12px;text-align:center;font-size:13px">' + escHtml(nomeVend) + '</td>'
      + '<td style="padding:9px 12px;text-align:center;font-size:13px">' + escHtml(quantidade || '—') + '</td>'
      + '<td style="padding:9px 12px;text-align:center;font-size:13px">R$ ' + Number(valorTotal || 0).toFixed(2).replace('.', ',') + '</td>'
      + '<td style="padding:9px 12px;text-align:center;font-size:13px">' + (vu > 0 ? ('R$ ' + vu.toFixed(2).replace('.', ',')) : '—') + '</td>'
      + '<td style="padding:9px 12px;text-align:center;font-size:13px">' + Number(comPct || 1).toFixed(2).replace('.', ',') + '%</td>'
      + '<td style="padding:9px 12px;text-align:center;font-size:13px;color:#10b981;font-weight:600">R$ ' + comissaoRS.toFixed(2).replace('.', ',') + '</td>'
      + '<td style="padding:9px 12px;text-align:center;font-size:13px">' + escHtml(data) + '</td>'
      + '<td style="padding:9px 12px;text-align:center"><span style="background:#064e3b;color:#10b981;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600">Concluído</span></td>'
      + '<td style="padding:9px 12px;text-align:center"><button onclick="window._abrirModalEdicaoOF&&window._comissaoOFs&&window._abrirModalEdicaoOF(window._comissaoOFs[' + idx + '])" style="background:transparent;border:1px solid #3a4a6b;color:#94a3b8;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer">✏️ Trocar</button></td>'
      + '</tr>';
  });
  secaoDetalhamento.innerHTML = ''
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #1e293b">'
    + '  <h3 style="font-size:14px;font-weight:600;color:#f1f5f9;margin:0">📋 Detalhamento das OFs</h3>'
    + '  <button onclick="window._exportarComissoesExcel&&window._exportarComissoesExcel()" style="background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer">⬇ Excel</button>'
    + '</div>'
    + '<div style="padding:12px 20px">'
    + '  <div style="display:flex;gap:8px;align-items:center">'
    + '    <span style="color:#64748b;font-size:14px">🔍</span>'
    + '    <input id="comissao-busca-of-input" type="text" placeholder="Buscar por nº da OF ou nome do cliente..." style="flex:1;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#f1f5f9;font-size:13px;outline:none" oninput="window._filtrarTabelaComissoes&&window._filtrarTabelaComissoes(this.value)" />'
    + '    <button onclick="window._filtrarTabelaComissoes&&window._filtrarTabelaComissoes(document.getElementById(\'comissao-busca-of-input\').value)" style="background:#3b82f6;color:white;border:none;border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer">Buscar</button>'
    + '  </div>'
    + '</div>'
    + '<div style="overflow-x:auto">'
    + '  <table id="tabela-ofs-comissao" style="width:100%;border-collapse:collapse">'
    + '    <thead><tr style="background:#0f172a">'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600"># OF</th>'
    + '      <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">CLIENTE</th>'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">VENDEDOR</th>'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">QTD</th>'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">VALOR TOTAL</th>'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">PREÇO UNIT.</th>'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">% COMISSÃO</th>'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">COMISSÃO (R$)</th>'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">DATA</th>'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">STATUS</th>'
    + '      <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">AÇÕES</th>'
    + '    </tr></thead>'
    + '    <tbody id="tbody-ofs-comissao">' + (htmlFinal || '<tr><td colspan="11" style="padding:20px;text-align:center;color:#64748b">Nenhuma OF encontrada no período</td></tr>') + '</tbody>'
    + '  </table>'
    + '</div>';
  setTimeout(function() {
    try {
      var root = secaoDetalhamento || secao || document;
      try {
        var wrapCom = (root && root.closest) ? root.closest('#page-comissoes, [data-page="comissoes"], .page-comissoes') : null;
        if (wrapCom) root = wrapCom;
      } catch (_) {}
      root.querySelectorAll('input[placeholder*="OF"], input[placeholder*="cliente"]').forEach(function(input) {
        try {
          if (input.id === 'comissao-busca-of-input') return;
          var container = input.closest('div[style], .busca-container, p') || input.parentElement;
          if (container && !container.contains(document.getElementById('comissao-busca-of-input'))) container.style.display = 'none';
        } catch (_) {}
      });
      root.querySelectorAll('button').forEach(function(btn) {
        try {
          if (String(btn.textContent || '').trim() === 'Buscar' && btn.id !== 'btn-busca-comissao') {
            var isNosso = !!(btn.closest && btn.closest('#tabela-ofs-comissao, [id*="comissao-busca"]'));
            if (!isNosso && btn.parentElement && btn.parentElement.style) btn.parentElement.style.display = 'none';
          }
        } catch (_) {}
      });
    } catch (_) {}
  }, 200);
  window._filtrarTabelaComissoes = function(termo) {
    var t = String(termo || '').toLowerCase();
    Array.prototype.slice.call(document.querySelectorAll('#tbody-ofs-comissao tr')).forEach(function(tr) {
      var txt = String(tr.textContent || '').toLowerCase();
      tr.style.display = (!t || txt.indexOf(t) >= 0) ? '' : 'none';
    });
  };
}

async function _resolverClientesEmLote(cliIds, callback) {
  try {
    var idsUnicos = Array.from(new Set((Array.isArray(cliIds) ? cliIds : []).filter(Boolean).map(function(id) {
      return String(id || '').trim();
    }).filter(Boolean)));
    if (!idsUnicos.length) return;
    var LOTE = 10;
    var token = '';
    try { token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim(); } catch (_) {}
    for (var i = 0; i < idsUnicos.length; i += LOTE) {
      var lote = idsUnicos.slice(i, i + LOTE);
      await Promise.all(lote.map(async function(cliId) {
        var norm = String(cliId || '').toLowerCase().trim();
        try {
          if (window._mapaClientesComissao && window._mapaClientesComissao[norm]) {
            if (typeof callback === 'function') callback(cliId, window._mapaClientesComissao[norm]);
            return;
          }
        } catch (_) {}
        try {
          var r = await fetch('/api/clientes/' + encodeURIComponent(cliId) + '?lite=1', {
            headers: token ? { Authorization: 'Bearer ' + token } : {}
          });
          if (!r.ok) return;
          var c = await r.json();
          var base = c && (c.data || c);
          var nome = String((base && (base.nome || base.rs || base.razao_social)) || (Array.isArray(base) && base[0] && (base[0].nome || base[0].rs || base[0].razao_social)) || '').trim();
          if (nome) {
            if (!window._mapaClientesComissao) window._mapaClientesComissao = Object.create(null);
            window._mapaClientesComissao[norm] = nome;
            if (typeof callback === 'function') callback(cliId, nome);
          }
        } catch (_) {}
      }));
      if (i + LOTE < idsUnicos.length) {
        await new Promise(function(resolve) { setTimeout(resolve, 200); });
      }
    }
  } catch (_) {}
}

function _injetarDetalhamentoComissoes(todasOFs, grupos, helpers) {
  var secao = null;
  try {
    var paginaComissoes = document.querySelector('#page-comissoes, [data-page="comissoes"], .page-comissoes');
    if (paginaComissoes) {
      var filhos = Array.prototype.slice.call(paginaComissoes.children || []).filter(function(el) {
        try { return (el.offsetHeight || 0) > 50; } catch (_) { return false; }
      });
      if (filhos.length >= 2) secao = filhos[1];
    }
  } catch (_) {}

  if (!secao) {
    try {
      var todos = document.querySelectorAll('div, section, article');
      for (var i = 0; i < todos.length; i += 1) {
        var el = todos[i];
        var textoFilhos = Array.prototype.slice.call(el.childNodes || []).filter(function(n) {
          return n && (n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && n.children && n.children.length === 0));
        }).map(function(n) {
          return String(n.textContent || '').trim();
        }).join(' ');
        if (textoFilhos.indexOf('Detalhamento') >= 0 && (el.offsetHeight || 0) > 50) {
          secao = el.parentElement;
          if (secao && (secao.offsetHeight || 0) < 100) secao = secao.parentElement;
          break;
        }
      }
    } catch (_) {}
  }

  if (!secao) {
    try { secao = null; } catch (_) {}
  }

  try {
    console.log('[INJECT] secao encontrada:', !!secao, secao && secao.tagName, secao && secao.offsetHeight);
  } catch (_) {}

  if (!secao) {
    try { console.error('[INJECT] impossível encontrar seção — abortando'); } catch (_) {}
    return;
  }

  var _prevPause = window._pausarObservers;
  window._pausarObservers = true;
  try {
    _injetarTabelaOFs(secao, todasOFs, grupos, helpers);
  } finally {
    setTimeout(function() { window._pausarObservers = _prevPause || false; }, 500);
  }

  try {
    var cliIds = (Array.isArray(todasOFs) ? todasOFs : []).filter(function(of) {
      return of && (of.cli_id || of.cliId) && !(of.cliente_nome || of._cliente_nome || of.cliente);
    }).map(function(of) {
      return String(of.cli_id || of.cliId || '').trim();
    }).filter(Boolean);
    _resolverClientesEmLote(cliIds, function(cliId, nome) {
      try {
        document.querySelectorAll('tr[data-cli-id="' + String(cliId).replace(/"/g, '&quot;') + '"] .td-cli').forEach(function(td) {
          td.textContent = nome;
        });
      } catch (_) {}
    });
  } catch (_) {}
}

function _aguardarSecaoERenderizar(todasOFs, grupos, helpers, tentativas) {
  if (typeof helpers === 'number' && tentativas == null) {
    tentativas = helpers;
    helpers = null;
  }
  tentativas = Number(tentativas || 0) || 0;
  if (tentativas > 30) {
    try { console.error('[FIX] seção não encontrada após 30 tentativas'); } catch (_) {}
    return;
  }

  var secao = _acharSecaoDetalhamentoOFs();
  if (!secao) {
    try { console.log('[FIX] tentativa', tentativas + 1, '— aguardando...'); } catch (_) {}
    setTimeout(function() { _aguardarSecaoERenderizar(todasOFs, grupos, helpers, tentativas + 1); }, 300);
    return;
  }

  try {
    console.log('[FIX] seção encontrada! tag:', secao.tagName, 'h:', secao.offsetHeight, 'class:', String(secao.className || '').substring(0, 50));
  } catch (_) {}
  _injetarTabelaOFs(secao, todasOFs, grupos, helpers);
}

function _renderTabelaOFs(json) {
  var _prevPause = window._pausarObservers;
  window._pausarObservers = true;
  try {
    try { _ensureVendedoresMap(); } catch (_) {}
    var escHtml = function(v) {
      return String(v == null ? '' : v).replace(/[&<>"]/g, function(ch) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] || ch;
      });
    };
    var cliNorm = function(v) { return String(v == null ? '' : v).trim().toLowerCase(); };
    var ensureMapaClientes = function() {
      if (!window._mapaClientesComissao) window._mapaClientesComissao = Object.create(null);
      try {
        if (Array.isArray(window.CLIENTES)) {
          window.CLIENTES.forEach(function(c) {
            var key = cliNorm(c && c.id);
            var nome = String(c && (c.nome || c.rs || c.razao_social) || '').trim();
            if (key && nome) window._mapaClientesComissao[key] = nome;
          });
        }
      } catch (_) {}
      try {
        if (Array.isArray(window._CLIENTES)) {
          window._CLIENTES.forEach(function(c) {
            var key = cliNorm(c && c.id);
            var nome = String(c && (c.nome || c.rs || c.razao_social) || '').trim();
            if (key && nome) window._mapaClientesComissao[key] = nome;
          });
        }
      } catch (_) {}
      return window._mapaClientesComissao;
    };
    var dadosComissoes = json && json.data && (json.data.grupos || json.data.vendedores || json.data.ofs) ? json.data : json;
    var grupos = [];
    if (Array.isArray(dadosComissoes)) grupos = dadosComissoes;
    else if (dadosComissoes && Array.isArray(dadosComissoes.grupos)) grupos = dadosComissoes.grupos;
    else if (dadosComissoes && Array.isArray(dadosComissoes.vendedores)) grupos = dadosComissoes.vendedores;
    else if (dadosComissoes && typeof dadosComissoes === 'object') {
      try {
        var primeiraChaveArray = Object.keys(dadosComissoes).find(function(k) {
          return Array.isArray(dadosComissoes[k]) && dadosComissoes[k].length > 0;
        });
        if (primeiraChaveArray) grupos = dadosComissoes[primeiraChaveArray];
      } catch (_) {}
    }
    try { console.log('[FIX OFs] grupos encontrados:', grupos.length); } catch (_) {}
    var todasOFs = (grupos || []).flatMap(function(g) {
      var nomeVend = String(g && (g.vendedor || g.nome || g.vendedor_nome || g.vendedor_id) || '').trim() || '—';
      var ofs = (g && (g.ofs || g.orders || g.ordens || g.items || g.of)) || [];
      if (!Array.isArray(ofs)) ofs = [];
      return ofs.map(function(of) {
        var vendMap = window._vendedoresMap || {};
        var vendIdNorm = String(of && (of.vendedor_id || of.vendId || of.vend_id || '') || '').trim().toLowerCase();
        var vendedorResolvido = nomeVend !== '—' ? nomeVend : (vendMap[vendIdNorm] || '—');
        var out = Object.assign({}, of || {}, { _vendedor_nome: nomeVend, _vendedor_resolvido: vendedorResolvido });
        if (!out.vendedor && nomeVend) out.vendedor = nomeVend;
        return out;
      });
    });
    if ((!todasOFs || !todasOFs.length) && dadosComissoes && Array.isArray(dadosComissoes.ofs)) todasOFs = dadosComissoes.ofs.slice();
    try {
      var ordemVendedores = (grupos || []).map(function(g) {
        return String(g && (g.vendedor || g.nome || g.vendedor_nome || '') || '').trim();
      });
      todasOFs.sort(function(a, b) {
        var nomeA = String(a && (a._vendedor_resolvido || a._vendedor_nome || '') || '').trim();
        var nomeB = String(b && (b._vendedor_resolvido || b._vendedor_nome || '') || '').trim();
        var idxA = ordemVendedores.indexOf(nomeA);
        var idxB = ordemVendedores.indexOf(nomeB);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });
    } catch (_) {}
    try { console.log('[FIX OFs] total OFs para renderizar:', todasOFs.length); } catch (_) {}
    setTimeout(function() {
      _injetarDetalhamentoComissoes(todasOFs, grupos, {
        escHtml: escHtml,
        cliNorm: cliNorm,
        ensureMapaClientes: ensureMapaClientes
      });
    }, 800);
    try { console.log('[COM] detalhamento por vendedor OK'); } catch (_) {}
  } catch (_) {}
  finally {
    setTimeout(function() { window._pausarObservers = _prevPause || false; }, 100);
  }
}

function _ocultarGraficoComissoes() {
  try {
    var pg = document.querySelector('#page-comissoes');
    if (!pg) return;
    Array.prototype.slice.call(pg.querySelectorAll('canvas, .chart-container, [class*="chart"], [id*="chart"]')).forEach(function(el) {
      try { el.style.display = 'none'; } catch (_) {}
    });
    Array.prototype.slice.call(pg.querySelectorAll('h3, h4, .section-title')).forEach(function(el) {
      try {
        var txt = String(el && el.textContent || '');
        if (txt.indexOf('Comissão por Vendedor') >= 0 || txt.indexOf('Vendas e Comissões') >= 0) {
          var container = (el.closest && el.closest('.card, .section, div[class]')) || el.parentElement;
          if (container) container.style.display = 'none';
        }
      } catch (_) {}
    });
  } catch (_) {}
}

(function() {
  if (window.__patchComissoesUnicaDefinicao) return;
  window.__patchComissoesUnicaDefinicao = true;
  var _comCalcEmAndamento = false;

  function _normalizarComissoesData(val) {
    if (!val || !val.vendedores || !Array.isArray(val.vendedores)) return val;
    val.vendedores = val.vendedores.map(function(v) {
      var out = Object.assign({}, v || {});
      out.ofs = Array.isArray(out.ofs) ? out.ofs : [];
      return out;
    });
    return val;
  }

  function _pad2(n) { return String(n || '').padStart(2, '0'); }

  function _fmtMoney(v) {
    return 'R$\u00a0' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function _nomeMes(mesNum) {
    var meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    var idx = (parseInt(String(mesNum || ''), 10) || 1) - 1;
    return meses[idx] || 'Mês';
  }

  function _getToken() {
    try { return String(localStorage.getItem('token') || localStorage.getItem('access_token') || window._token || '').trim(); } catch (_) { return ''; }
  }

  function _getPeriodoSelecionado() {
    var pg = null;
    try { pg = document.querySelector('#page-comissoes'); } catch (_) { pg = null; }
    var mesSel = null;
    var anoSel = null;
    try { mesSel = pg ? pg.querySelector('#comissao-mes-select') : document.getElementById('comissao-mes-select'); } catch (_) { mesSel = null; }
    try { anoSel = pg ? pg.querySelector('#comissao-ano-select') : document.getElementById('comissao-ano-select'); } catch (_) { anoSel = null; }
    var mesNum = '';
    var anoNum = '';
    try { mesNum = String(mesSel && mesSel.value || '').trim(); } catch (_) { mesNum = ''; }
    try { anoNum = String(anoSel && anoSel.value || '').trim(); } catch (_) { anoNum = ''; }
    if (mesNum && anoNum) return { mesNum: _pad2(mesNum), anoNum: anoNum };

    var inp = null;
    try { inp = document.querySelector('input[type="month"]'); } catch (_) { inp = null; }
    var val = '';
    try { val = String(inp && inp.value || '').trim(); } catch (_) { val = ''; }
    if (val && val.indexOf('-') >= 0) {
      var p = val.split('-');
      if (p[0] && p[1]) return { mesNum: _pad2(p[1]), anoNum: String(p[0]) };
    }
    var h = new Date();
    return { mesNum: _pad2(h.getMonth() + 1), anoNum: String(h.getFullYear()) };
  }

  function _ensurePeriodoSelects() {
    try {
      var pg = document.querySelector('#page-comissoes');
      if (!pg) return;
      var host = null;
      var inp = null;
      try { inp = pg.querySelector('input[type="month"]'); } catch (_) { inp = null; }
      if (inp && inp.parentElement) host = inp.parentElement;
      if (!host) host = pg.querySelector('.toolbar, .topbar, .card, .section, div') || pg;
      if (!host) return;

      if (pg.querySelector('#comissao-mes-select') && pg.querySelector('#comissao-ano-select')) return;

      var h = new Date();
      var anoAtual = h.getFullYear();
      var mesAtual = h.getMonth() + 1;

      var wrap = document.createElement('div');
      wrap.id = 'comissoes-periodo-selects';
      wrap.style.display = 'flex';
      wrap.style.flexWrap = 'wrap';
      wrap.style.gap = '8px';
      wrap.style.alignItems = 'center';
      wrap.style.margin = '0 0 10px 0';

      var selMes = document.createElement('select');
      selMes.id = 'comissao-mes-select';
      selMes.style.background = '#0b1220';
      selMes.style.color = '#fff';
      selMes.style.border = '1px solid rgba(255,255,255,0.12)';
      selMes.style.borderRadius = '8px';
      selMes.style.padding = '8px 10px';

      var meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      for (var i = 1; i <= 12; i++) {
        var op = document.createElement('option');
        op.value = String(i);
        op.textContent = meses[i - 1];
        selMes.appendChild(op);
      }

      var selAno = document.createElement('select');
      selAno.id = 'comissao-ano-select';
      selAno.style.background = '#0b1220';
      selAno.style.color = '#fff';
      selAno.style.border = '1px solid rgba(255,255,255,0.12)';
      selAno.style.borderRadius = '8px';
      selAno.style.padding = '8px 10px';

      var anos = [2024, 2025, 2026];
      if (anos.indexOf(anoAtual) < 0) anos.push(anoAtual);
      anos = anos.filter(function(v, i, a) { return a.indexOf(v) === i; }).sort(function(a, b) { return a - b; });
      for (var j = 0; j < anos.length; j++) {
        var oy = document.createElement('option');
        oy.value = String(anos[j]);
        oy.textContent = String(anos[j]);
        selAno.appendChild(oy);
      }

      var ref = _getPeriodoSelecionado();
      try { selMes.value = String(parseInt(ref.mesNum, 10) || mesAtual); } catch (_) { selMes.value = String(mesAtual); }
      try { selAno.value = String(parseInt(ref.anoNum, 10) || anoAtual); } catch (_) { selAno.value = String(anoAtual); }

      var sync = function() {
        try {
          if (inp) {
            inp.value = String(selAno.value) + '-' + _pad2(selMes.value);
            inp.style.display = 'none';
          }
        } catch (_) {}
      };

      selMes.addEventListener('change', sync);
      selAno.addEventListener('change', sync);
      sync();

      host.insertBefore(wrap, host.firstChild);
      wrap.appendChild(selMes);
      wrap.appendChild(selAno);
    } catch (_) {}
  }

  function _prevPeriodo(mesNum, anoNum) {
    var m = parseInt(String(mesNum || ''), 10);
    var a = parseInt(String(anoNum || ''), 10);
    if (!m || !a) return null;
    if (m === 1) return { mesNum: '12', anoNum: String(a - 1) };
    return { mesNum: _pad2(m - 1), anoNum: String(a) };
  }

  async function _fetchComissoes(mesNum, anoNum) {
    try {
      var token = _getToken();
      var resp = await fetch('/api/comissoes/relatorio?mes=' + encodeURIComponent(String(parseInt(mesNum, 10))) + '&ano=' + encodeURIComponent(String(anoNum)), {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      var json = await resp.json().catch(function() { return null; });
      if (!json || !json.ok) return null;
      return json;
    } catch (_) { return null; }
  }

  function _ensureComissoesStyle() {
    try {
      if (document.getElementById('patch-comissoes-ui')) return;
      var s = document.createElement('style');
      s.id = 'patch-comissoes-ui';
      s.textContent = ''
        + '#comissoes-topo{margin:0 0 18px 0}'
        + '#comissoes-dashboard{display:grid;grid-template-columns:repeat(5,minmax(220px,1fr));gap:16px;margin:0 0 16px 0}'
        + '#comissoes-dashboard .c-card{background:linear-gradient(135deg,#1e2d40 0%,#1a2535 100%);border:1px solid #2a3f5f;border-radius:12px;padding:20px 24px;min-height:100px;color:#fff;box-sizing:border-box}'
        + '#comissoes-dashboard .c-lab{font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.5px;margin-bottom:10px;font-weight:700}'
        + '#comissoes-dashboard .c-val{font-size:26px;font-weight:700;color:#fff;line-height:1.15}'
        + '#comissoes-dashboard .c-sub{font-size:12px;color:#94a3b8;margin-top:10px}'
        + '#comissoes-dashboard .c-card.is-comissao .c-val{color:#10b981}'
        + '#comissoes-dashboard .c-card.is-top .c-val{color:#60a5fa}'
        + '#comissoes-ranking{display:flex;justify-content:center;align-items:stretch;gap:16px;padding:0 24px 16px;margin:0 0 16px 0;flex-wrap:wrap}'
        + '#comissoes-ranking .r-item{flex:1 1 280px;max-width:360px;min-width:240px;background:#111827;border:1px solid #2a3f5f;border-radius:12px;padding:14px 16px;color:#fff;box-sizing:border-box}'
        + '#comissoes-ranking .r-top{display:flex;justify-content:space-between;gap:12px;font-weight:700;font-size:14px;align-items:center}'
        + '#comissoes-ranking .r-medal{font-size:1.4em;margin-right:6px}'
        + '#comissoes-ranking .r-name{font-size:16px;font-weight:800}'
        + '#comissoes-ranking .r-bar{height:8px;border-radius:999px;background:rgba(255,255,255,0.10);overflow:hidden;margin-top:10px}'
        + '#comissoes-ranking .r-bar > div{height:100%;background:#6366f1;border-radius:999px}'
        + '#comissoes-busca{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0}'
        + '#comissoes-busca input{background:#0b1220;color:#fff;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 10px;min-width:240px}'
        + '#comissoes-busca button{background:#1e2435;color:#fff;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 10px;cursor:pointer}'
        + '#comissoes-busca-res{margin-top:8px;background:#0b1220;border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:10px 12px;color:#fff}'
        + '#comissoes-modal{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:none;align-items:center;justify-content:center;z-index:100000}'
        + '#comissoes-modal .m-box{width:min(900px,94vw);max-height:88vh;overflow:auto;background:#0b1220;border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:14px 14px 12px;color:#fff}'
        + '#comissoes-modal .m-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}'
        + '#comissoes-modal .m-title{font-size:15px;font-weight:800}'
        + '#comissoes-modal .m-close{background:transparent;border:1px solid rgba(255,255,255,0.18);color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer}'
        + '#comissoes-modal .m-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}'
        + '#comissoes-modal label{font-size:12px;opacity:0.85;display:block;margin-bottom:4px}'
        + '#comissoes-modal input,#comissoes-modal select,#comissoes-modal textarea{width:100%;background:#111827;color:#fff;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:8px 10px}'
        + '#comissoes-modal textarea{min-height:90px;resize:vertical}'
        + '#comissoes-modal .m-full{grid-column:1/-1}'
        + '#comissoes-modal .m-autocomplete{position:relative}'
        + '#comissoes-modal .m-suggest{margin-top:6px;max-height:180px;overflow:auto;border:1px solid rgba(255,255,255,0.10);border-radius:10px;background:#0f172a}'
        + '#comissoes-modal .m-s-item{padding:8px 10px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06)}'
        + '#comissoes-modal .m-s-item:last-child{border-bottom:0}'
        + '#comissoes-modal .m-s-item:hover{background:#1e2d40}'
        + '#comissoes-modal .m-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}'
        + '#comissoes-modal .m-save{background:#16a34a;border:1px solid rgba(255,255,255,0.12)}'
        + '#comissoes-modal .m-cancel{background:#1f2937;border:1px solid rgba(255,255,255,0.12)}'
        + '#page-comissoes table tbody tr:hover,[data-page=\"comissoes\"] table tbody tr:hover,.page-comissoes table tbody tr:hover{background:#1e2d40!important}'
        + '#page-comissoes table thead th,[data-page=\"comissoes\"] table thead th,.page-comissoes table thead th{background:#0f172a!important;color:#94a3b8!important;font-size:11px!important;text-transform:uppercase!important;letter-spacing:.5px!important;padding:10px 12px!important}'
        + '#page-comissoes table tbody td,[data-page=\"comissoes\"] table tbody td,.page-comissoes table tbody td{padding:10px 12px!important;border-bottom:1px solid #1e293b!important}'
        + '#page-comissoes table tbody td:nth-child(1),#page-comissoes table tbody td:nth-child(3),#page-comissoes table tbody td:nth-child(4),#page-comissoes table tbody td:nth-child(5),#page-comissoes table tbody td:nth-child(6),#page-comissoes table tbody td:nth-child(7),#page-comissoes table tbody td:nth-child(8),#page-comissoes table tbody td:nth-child(9),#page-comissoes table tbody td:nth-child(10),[data-page=\"comissoes\"] table tbody td:nth-child(1),[data-page=\"comissoes\"] table tbody td:nth-child(3),[data-page=\"comissoes\"] table tbody td:nth-child(4),[data-page=\"comissoes\"] table tbody td:nth-child(5),[data-page=\"comissoes\"] table tbody td:nth-child(6),[data-page=\"comissoes\"] table tbody td:nth-child(7),[data-page=\"comissoes\"] table tbody td:nth-child(8),[data-page=\"comissoes\"] table tbody td:nth-child(9),[data-page=\"comissoes\"] table tbody td:nth-child(10),.page-comissoes table tbody td:nth-child(1),.page-comissoes table tbody td:nth-child(3),.page-comissoes table tbody td:nth-child(4),.page-comissoes table tbody td:nth-child(5),.page-comissoes table tbody td:nth-child(6),.page-comissoes table tbody td:nth-child(7),.page-comissoes table tbody td:nth-child(8),.page-comissoes table tbody td:nth-child(9),.page-comissoes table tbody td:nth-child(10){text-align:center!important}'
        + '#page-comissoes table tbody td:nth-child(2),[data-page=\"comissoes\"] table tbody td:nth-child(2),.page-comissoes table tbody td:nth-child(2){text-align:left!important}'
        + '#page-comissoes #tabela-comissoes-vendedor tbody td,[data-page=\"comissoes\"] #tabela-comissoes-vendedor tbody td,.page-comissoes #tabela-comissoes-vendedor tbody td{padding:12px 14px!important;border-bottom:1px solid rgba(148,163,184,0.12)!important}'
        + '#page-comissoes #tabela-comissoes-vendedor tbody tr:hover,[data-page=\"comissoes\"] #tabela-comissoes-vendedor tbody tr:hover,.page-comissoes #tabela-comissoes-vendedor tbody tr:hover{background:#1e2d40!important}'
        + '#page-comissoes button[data-com-trocar],[data-page=\"comissoes\"] button[data-com-trocar],.page-comissoes button[data-com-trocar]{background:transparent!important;border:1px solid #3a4a6b!important;color:#94a3b8!important;border-radius:6px!important;padding:4px 10px!important;font-size:12px!important}'
        + '#page-comissoes button[data-com-trocar]:hover,[data-page=\"comissoes\"] button[data-com-trocar]:hover,.page-comissoes button[data-com-trocar]:hover{border-color:#60a5fa!important;color:#60a5fa!important}'
        + '@media (max-width:980px){#comissoes-dashboard{grid-template-columns:repeat(2,minmax(220px,1fr))}}'
        + '@media (max-width:700px){#comissoes-modal .m-grid{grid-template-columns:1fr}#comissoes-dashboard{grid-template-columns:repeat(2,minmax(0,1fr))}}';
      document.head.appendChild(s);
    } catch (_) {}
    try { _ensureComissoesStyleV2(); } catch (_) {}
  }

  function _ensureComissoesStyleV2() {
    try {
      if (window._comissoesStyleV2) return;
      window._comissoesStyleV2 = true;
      if (document.getElementById('patch-comissoes-style-v2')) return;
      var st = document.createElement('style');
      st.id = 'patch-comissoes-style-v2';
      st.textContent = ''
        + '#page-comissoes #tabela-comissoes-vendedor tbody td:first-child,[data-page=\"comissoes\"] #tabela-comissoes-vendedor tbody td:first-child,.page-comissoes #tabela-comissoes-vendedor tbody td:first-child{padding-left:16px!important;text-align:left!important;}'
        + '#page-comissoes #tabela-comissoes-vendedor tbody td:not(:first-child),[data-page=\"comissoes\"] #tabela-comissoes-vendedor tbody td:not(:first-child),.page-comissoes #tabela-comissoes-vendedor tbody td:not(:first-child){text-align:center!important;vertical-align:middle!important;}'
        + '#page-comissoes #tabela-comissoes-vendedor tbody tr[data-com-total=\"1\"],[data-page=\"comissoes\"] #tabela-comissoes-vendedor tbody tr[data-com-total=\"1\"],.page-comissoes #tabela-comissoes-vendedor tbody tr[data-com-total=\"1\"]{font-weight:700!important;border-top:2px solid #334155!important;background:#0f172a!important;}'
        + '#page-comissoes #tabela-comissoes-ofs thead th,[data-page=\"comissoes\"] #tabela-comissoes-ofs thead th,.page-comissoes #tabela-comissoes-ofs thead th{padding:10px 12px!important;font-size:11px!important;text-transform:uppercase!important;color:#64748b!important;letter-spacing:.5px!important;text-align:center!important;}'
        + '#page-comissoes #tabela-comissoes-ofs thead th:nth-child(2),[data-page=\"comissoes\"] #tabela-comissoes-ofs thead th:nth-child(2),.page-comissoes #tabela-comissoes-ofs thead th:nth-child(2){text-align:left!important;}'
        + '#page-comissoes #tabela-comissoes-ofs tbody td,[data-page=\"comissoes\"] #tabela-comissoes-ofs tbody td,.page-comissoes #tabela-comissoes-ofs tbody td{padding:10px 12px!important;text-align:center!important;vertical-align:middle!important;}'
        + '#page-comissoes #tabela-comissoes-ofs tbody td:nth-child(2),[data-page=\"comissoes\"] #tabela-comissoes-ofs tbody td:nth-child(2),.page-comissoes #tabela-comissoes-ofs tbody td:nth-child(2){text-align:left!important;}'
        + '#_com_detalhe,.detalhamento-ofs,[data-section=\"detalhamento-ofs\"]{overflow-y:auto!important;max-height:72vh!important;pointer-events:auto!important;min-height:120px!important;}'
        + '#_com_detalhe details>div,.detalhamento-ofs table,.detalhamento-ofs .table-wrap{overflow:auto!important;}';
      document.head.appendChild(st);
    } catch (_) {}
  }

  function _adicionarTopoComissoes(json, prevJson, periodoLabel) {
    try {
      var existente = document.getElementById('_com_topo_v3');
      var hashAtual = JSON.stringify(Number(json && (json.total_geral_vendas != null ? json.total_geral_vendas : json.total_vendido) || 0) || 0);
      if (existente) {
        if (existente.dataset && existente.dataset.hash === hashAtual && String(existente.innerHTML || '').trim()) return;
        _renderDashboard(json, prevJson, periodoLabel);
        _renderRanking(json);
        try { if (existente.dataset) existente.dataset.hash = hashAtual; } catch (_) {}
        try { console.log('[COM PATCH] topo atualizado (já existia)'); } catch (_) {}
        return;
      }
      _renderDashboard(json, prevJson, periodoLabel);
      _renderRanking(json);
      try {
        var criado = document.getElementById('_com_topo_v3');
        if (criado && criado.dataset) criado.dataset.hash = hashAtual;
      } catch (_) {}
      try {
        var container = _acharContainerComissoes();
        console.log('[COM PATCH] container encontrado:', !!container, container && container.tagName, container && container.offsetHeight);
        if (!container) {
          console.error('[COM PATCH] container não encontrado - topo não inserido');
          setTimeout(function() {
            try {
              var c2 = _acharContainerComissoes();
              var topo = document.getElementById('_com_topo_v3');
              if (c2 && topo && !topo.parentElement) {
                c2.insertBefore(topo, c2.firstChild || null);
                console.log('[COM PATCH] topo inserido na 2a tentativa');
              }
            } catch (_) {}
          }, 1000);
        }
      } catch (_) {}
    } catch (_) {}
  }

  function _acharContainerComissoes() {
    try {
      var todos = Array.from(document.querySelectorAll('h2, h3, h4, h5, span, div, p, label, b, strong'));
      for (var t = 0; t < todos.length; t += 1) {
        var el = todos[t];
        try {
          var temTexto = String(el && el.textContent || '').indexOf('Comissão por Vendedor') >= 0 && el.offsetParent !== null;
          if (!temTexto) continue;
          var pai = el.parentElement;
          for (var i = 0; i < 8 && pai && pai !== document.body; i += 1) {
            if ((pai.offsetHeight || 0) > 150 && (pai.offsetWidth || 0) > 400) return pai;
            pai = pai.parentElement;
          }
        } catch (_) {}
      }
    } catch (_) {}
    try {
      var trs = Array.from(document.querySelectorAll('table tbody tr'));
      var trVendedor = trs.find(function(tr) {
        var txt = String(tr && tr.textContent || '');
        return txt.indexOf('ELEOMAR') >= 0 && txt.indexOf('R$') >= 0;
      });
      if (trVendedor) {
        var paiTab = trVendedor.closest ? trVendedor.closest('table') : null;
        paiTab = paiTab ? paiTab.parentElement : null;
        for (var j = 0; j < 5 && paiTab; j += 1) {
          if ((paiTab.offsetHeight || 0) > 200) return paiTab;
          paiTab = paiTab.parentElement;
        }
      }
    } catch (_) {}
    return null;
  }

  function _acharPontoInsercaoTopoComissoes() {
    var pontoInsercao = null;
    var containerPai = null;
    try {
      var container = _acharContainerComissoes();
      if (container) {
        pontoInsercao = container;
        containerPai = container.parentElement;
        return { pontoInsercao: pontoInsercao, containerPai: containerPai };
      }
    } catch (_) {}
    try {
      Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function(el) {
        if (pontoInsercao) return;
        try { if (el && el.closest && el.closest('#_com_topo_v3')) return; } catch (_) {}
        if (
          el &&
          el.children &&
          el.children.length <= 2 &&
          String(el.textContent || '').trim() === 'Comissão por Vendedor'
        ) {
          var pai = el.parentElement;
          for (var i = 0; i < 6 && pai; i++) {
            if ((pai.offsetHeight || 0) > 200) {
              pontoInsercao = pai;
              containerPai = pai.parentElement;
              break;
            }
            pai = pai.parentElement;
          }
        }
      });
    } catch (_) {}
    if (!pontoInsercao) {
      try {
        Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function(el) {
          if (pontoInsercao) return;
          if (
            el &&
            String(el.textContent || '').indexOf('Total Vendido') >= 0 &&
            String(el.textContent || '').indexOf('Total Comissão') >= 0 &&
            el.offsetHeight > 50 &&
            el.offsetHeight < 300
          ) {
            pontoInsercao = el;
            containerPai = el.parentElement;
          }
        });
      } catch (_) {}
    }
    return { pontoInsercao: pontoInsercao, containerPai: containerPai };
  }

  function _getPgComissoes() {
    try {
      return (
        document.querySelector('#page-comissoes') ||
        document.querySelector('[data-page=\"comissoes\"]') ||
        document.querySelector('.page-comissoes')
      );
    } catch (_) { return null; }
  }

  function _ensureTopoV3Wrapper(sectionFallback) {
    var wrap = null;
    try { wrap = document.getElementById('_com_topo_v3'); } catch (_) { wrap = null; }
    if (wrap) return wrap;
    try {
      wrap = document.createElement('div');
      wrap.id = '_com_topo_v3';
      wrap.style.cssText =
        'position:sticky;top:0;left:0;right:0;' +
        'width:100%;background:var(--bg, #0f1117);z-index:100;' +
        'padding:8px 16px;box-sizing:border-box';
      var p = _acharPontoInsercaoTopoComissoes();
      if (p.pontoInsercao && !document.getElementById('_com_topo_v3')) p.pontoInsercao.insertBefore(wrap, p.pontoInsercao.firstChild);
      else if (sectionFallback) sectionFallback.insertBefore(wrap, sectionFallback.firstChild || null);
    } catch (_) {}
    return wrap;
  }

  function _renderDashboard(json, prevJson, periodoLabel) {
    try {
      var pg = _getPgComissoes();
      if (!pg) pg = document.body;
      var tbody = document.querySelector('#tabela-comissoes-vendedor tbody');
      if (!tbody) {
        var tbodies = pg ? pg.querySelectorAll('tbody') : null;
        tbody = tbodies && tbodies[0] ? tbodies[0] : null;
      }
      if (!tbody) return;
      var table = tbody.closest ? tbody.closest('table') : null;
      if (!table) return;

      var totalV = Number(json && json.total_vendido || 0) || 0;
      var totalOfs = Number(json && json.total_ofs || 0) || 0;
      var totalCom = Number(json && json.total_comissao || 0) || 0;

      var prevV = prevJson ? (Number(prevJson.total_vendido || 0) || 0) : null;
      var deltaPct = null;
      if (prevV != null && prevV > 0) deltaPct = ((totalV - prevV) / prevV) * 100;

      var top = null;
      try {
        var vs = Array.isArray(json && json.vendedores) ? json.vendedores.slice() : [];
        vs.sort(function(a, b) { return Number(b && b.total || 0) - Number(a && a.total || 0); });
        top = vs[0] || null;
      } catch (_) { top = null; }
      var topNome = String(top && top.nome || '—');
      var topTot = Number(top && top.total || 0) || 0;
      var topShare = totalV > 0 ? (topTot / totalV) * 100 : 0;

      var section = table.closest ? (table.closest('.card, .section') || table.parentNode) : table.parentNode;
      var wrap = _ensureTopoV3Wrapper(section);
      var topo = wrap ? wrap.querySelector('#comissoes-topo') : null;
      if (!topo) {
        topo = document.createElement('div');
        topo.id = 'comissoes-topo';
        if (wrap) wrap.appendChild(topo);
        else if (section && section.parentNode) section.parentNode.insertBefore(topo, section);
      }
      var dash = topo.querySelector('#comissoes-dashboard');
      if (!dash) {
        dash = document.createElement('div');
        dash.id = 'comissoes-dashboard';
        topo.appendChild(dash);
      }

      var arrow = '';
      var cor = '#94a3b8';
      var deltaTxt = '—';
      if (deltaPct != null) {
        var up = deltaPct >= 0;
        arrow = up ? '↑' : '↓';
        cor = up ? '#4ade80' : '#f87171';
        deltaTxt = arrow + ' ' + Math.abs(deltaPct).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
      }

      dash.innerHTML = ''
        + '<div class="c-card"><div class="c-lab">Total Vendido</div><div class="c-val">' + _fmtMoney(totalV) + '</div><div class="c-sub">' + String(periodoLabel || '').replace(/</g, '&lt;') + '</div></div>'
        + '<div class="c-card"><div class="c-lab">OFs do Período</div><div class="c-val">' + String(totalOfs) + ' OFs</div><div class="c-sub">&nbsp;</div></div>'
        + '<div class="c-card is-comissao"><div class="c-lab">Total Comissões</div><div class="c-val">' + _fmtMoney(totalCom) + '</div><div class="c-sub">&nbsp;</div></div>'
        + '<div class="c-card"><div class="c-lab">vs Mês Anterior</div><div class="c-val" style="color:' + cor + '">' + deltaTxt + '</div><div class="c-sub">' + (prevV != null ? ('Anterior: ' + _fmtMoney(prevV)) : 'Anterior: —') + '</div></div>'
        + '<div class="c-card is-top"><div class="c-lab">Melhor Vendedor</div><div class="c-val">' + String(topNome).replace(/</g, '&lt;') + '</div><div class="c-sub">' + _fmtMoney(topTot) + ' · ' + topShare.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '% do total</div></div>';
    } catch (_) {}
  }

  function _renderRanking(json) {
    try {
      var pg = _getPgComissoes();
      var wrap = null;
      try { wrap = document.getElementById('_com_topo_v3'); } catch (_) { wrap = null; }
      var topo = wrap ? wrap.querySelector('#comissoes-topo') : (pg ? pg.querySelector('#comissoes-topo') : document.getElementById('comissoes-topo'));
      if (!topo) return;
      var vend = Array.isArray(json && json.vendedores) ? json.vendedores.slice() : [];
      vend.sort(function(a, b) { return Number(b && b.total || 0) - Number(a && a.total || 0); });
      vend = vend.filter(function(v) { return v && Number(v.total || 0) > 0; }).slice(0, 3);
      if (!vend.length) return;
      var max = Number(vend[0] && vend[0].total || 0) || 1;
      var ranking = topo.querySelector('#comissoes-ranking');
      if (!ranking) {
        ranking = document.createElement('div');
        ranking.id = 'comissoes-ranking';
        topo.appendChild(ranking);
      }
      var medals = ['🥇', '🥈', '🥉'];
      ranking.innerHTML = vend.map(function(v, idx) {
        var total = Number(v && v.total || 0) || 0;
        var pct = Math.max(0, Math.min(100, (total / max) * 100));
        return ''
          + '<div class="r-item">'
          + '<div class="r-top"><div><span class="r-medal">' + medals[idx] + '</span><span class="r-name">' + String(v && v.nome || '—').replace(/</g, '&lt;') + '</span></div><div>' + _fmtMoney(total) + ' · ' + String(Number(v && v.ofs || 0) || 0) + ' OFs</div></div>'
          + '<div class="r-bar"><div style="width:' + pct.toFixed(0) + '%"></div></div>'
          + '</div>';
      }).join('');
      try {
        ranking.style.display = 'flex';
        ranking.style.justifyContent = 'center';
        ranking.style.alignItems = 'stretch';
        ranking.style.gap = '16px';
        ranking.style.padding = '0 24px 16px';
        ranking.style.flexWrap = 'wrap';
      } catch (_) {}
    } catch (_) {}
  }

  function _ensureBuscaUI() {
    try {
      var pg = _getPgComissoes();
      if (!pg) pg = document.body;
      var tbody = document.querySelector('#tabela-comissoes-ofs tbody');
      if (!tbody) {
        var tbodies = pg.querySelectorAll('tbody');
        tbody = (tbodies && tbodies[1]) ? tbodies[1] : (tbodies && tbodies[0] ? tbodies[0] : null);
      }
      if (!tbody) return;
      var table = tbody.closest ? tbody.closest('table') : null;
      if (!table) return;
      if (pg.querySelector('#comissoes-busca')) return;

      var host = document.createElement('div');
      host.id = 'comissoes-busca';
      host.innerHTML = ''
        + '<input type="text" id="comissao-busca-of" placeholder="🔍 Buscar por nº da OF ou nome do cliente..." />'
        + '<button id="comissao-busca-btn">Buscar</button>'
        + '<div id="comissoes-busca-info" style="display:none;margin-top:8px;color:var(--text2,#94a3b8);font-size:12px"></div>'
        + '<div id="comissoes-busca-nav" style="display:none;margin-top:8px;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"></div>'
        + '<div id="comissoes-busca-res" style="display:none"></div>';
      table.parentNode.insertBefore(host, table);

      var inp = host.querySelector('#comissao-busca-of');
      var btn = host.querySelector('#comissao-busca-btn');
      var info = host.querySelector('#comissoes-busca-info');
      var nav = host.querySelector('#comissoes-busca-nav');
      var res = host.querySelector('#comissoes-busca-res');

      var badge = function(st) {
        var raw = String(st || '').trim();
        if (!raw) raw = '—';
        var s = raw.toLowerCase();
        var bg = '#334155';
        var fg = '#e2e8f0';
        if (s.indexOf('conclu') >= 0 || s === 'pedido pronto') { bg = '#064e3b'; fg = '#10b981'; raw = 'Concluído'; }
        else if (s.indexOf('produ') >= 0) { bg = '#1e3a5f'; fg = '#60a5fa'; raw = 'Em Produção'; }
        else if (s.indexOf('aber') >= 0) { bg = '#422006'; fg = '#f59e0b'; raw = 'Aberta'; }
        else if (s.indexOf('canc') >= 0) { bg = '#4c0519'; fg = '#f43f5e'; raw = 'Cancelada'; }
        return '<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:' + bg + ';color:' + fg + ';border:1px solid rgba(255,255,255,0.08)">' + String(raw).replace(/</g, '&lt;') + '</span>';
      };

      var normNum = function(v) { return String(v || '').replace(/[^\d]/g, '').trim(); };
      var clearHighlights = function() {
        try {
          Array.prototype.slice.call(pg.querySelectorAll('tr[data-com-busca-hl="1"]')).forEach(function(tr) {
            try {
              delete tr.dataset.comBuscaHl;
              tr.removeAttribute('data-com-busca-hl');
            } catch (_) {}
            try { tr.style.background = ''; tr.style.borderLeft = ''; } catch (_) {}
          });
        } catch (_) {}
      };
      var highlight = function(tr) {
        try {
          tr.setAttribute('data-com-busca-hl', '1');
          tr.style.background = 'rgba(234,179,8,0.2)';
          tr.style.borderLeft = '3px solid #eab308';
        } catch (_) {}
      };
      function scrollToRow(tr) {
        try { tr.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
      }
      function renderNav(state) {
        try {
          if (!nav) return;
          if (!state || !state.rows || state.rows.length < 2) { nav.style.display = 'none'; nav.innerHTML = ''; return; }
          var total = state.rows.length;
          var idx = Math.max(0, Math.min(total - 1, Number(state.idx || 0) || 0));
          state.idx = idx;
          var curNum = String(state.nums[idx] || '').trim();
          nav.style.display = 'flex';
          nav.innerHTML = ''
            + '<div style="color:var(--text1,#e2e8f0);font-size:12px">'
            + 'OF <b style="color:#60a5fa">' + String(idx + 1) + '</b> de <b>' + String(total) + '</b>: '
            + '<span style="font-weight:800;color:#60a5fa">#' + curNum.replace(/</g, '&lt;') + '</span>'
            + '</div>'
            + '<div style="display:flex;gap:10px;flex-wrap:wrap">'
            + '<button type="button" id="com-busca-prev">← Anterior</button>'
            + '<button type="button" id="com-busca-next">Próxima →</button>'
            + '</div>';
          var bPrev = nav.querySelector('#com-busca-prev');
          var bNext = nav.querySelector('#com-busca-next');
          if (bPrev) bPrev.onclick = function() { state.idx = (state.idx - 1 + total) % total; renderNav(state); scrollToRow(state.rows[state.idx]); };
          if (bNext) bNext.onclick = function() { state.idx = (state.idx + 1) % total; renderNav(state); scrollToRow(state.rows[state.idx]); };
        } catch (_) {}
      }

      function escHtml(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
      function hasLetters(v) { return /[A-Za-zÀ-ÿ]/.test(String(v || '')); }
      function fmtDateBrLocal(v) {
        try {
          var s = String(v || '').trim();
          if (!s) return '—';
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split('-').reverse().join('/');
          var d = new Date(s);
          if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
        } catch (_) {}
        return '—';
      }
      function pickQtd(of) {
        var q = of && (of.quantidade ?? of.qtd ?? of.qtd_pedida);
        return q != null && q !== '' ? String(q) : '—';
      }
      function pickCliente(of) {
        return String(of && (of.cliente_nome || of.cliNome || of.cliente || of.clinome) || '—').trim() || '—';
      }
      function pickEntrega(of) {
        return String(of && (of.data_entrega || of.ent || of.entrega) || '').trim();
      }
      function renderBuscaCards(ofs, emptyText) {
        if (!res) return;
        try { res._ofsData = Array.isArray(ofs) ? ofs.slice() : []; } catch (_) {}
        if (!Array.isArray(ofs) || !ofs.length) {
          res.style.display = 'block';
          res.innerHTML = '<div style="margin-top:10px;padding:12px 14px;border:1px solid rgba(255,255,255,0.08);border-radius:10px;background:rgba(255,255,255,0.03);color:var(--text2,#94a3b8)">' + escHtml(emptyText || 'Nenhum resultado.') + '</div>';
          return;
        }
        res.style.display = 'block';
        res.innerHTML = ofs.map(function(of) {
          var entrega = pickEntrega(of);
          return ''
            + '<div class="com-busca-card" data-of-id="' + escHtml(String(of && of.id || '')) + '" style="margin-top:10px;border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:12px 14px;background:linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92));box-shadow:0 12px 30px rgba(0,0,0,0.15)">'
            + '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">'
            + '<div>'
            + '<div style="font-size:14px;font-weight:800;color:#f8fafc">OF #' + escHtml(String(of && (of.numero || of.of_num || of.of_numero || '') || '—')) + '</div>'
            + '<div style="margin-top:3px;font-size:13px;color:#cbd5e1">' + escHtml(pickCliente(of)) + '</div>'
            + '</div>'
            + '<div>' + badge(of && of.status) + '</div>'
            + '</div>'
            + '<div style="margin-top:10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px 14px;font-size:12px;color:#94a3b8">'
            + '<div><span style="color:#64748b">Valor:</span> <b style="color:#e2e8f0">' + _fmtMoney(of && (of.valor_total ?? of.valor_venda ?? 0)) + '</b></div>'
            + '<div><span style="color:#64748b">Quantidade:</span> <b style="color:#e2e8f0">' + escHtml(pickQtd(of)) + '</b></div>'
            + '<div><span style="color:#64748b">Entrega:</span> <b style="color:#e2e8f0">' + escHtml(entrega ? fmtDateBrLocal(entrega) : '—') + '</b></div>'
            + '<div><span style="color:#64748b">Vendedor:</span> <b style="color:#e2e8f0">' + escHtml(String(of && (of.vendNome || of.vendedor_nome || of.vendedor) || '—')) + '</b></div>'
            + '</div>'
            + '<div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">'
            + '<button type="button" data-acao="concluir">✅ Concluir</button>'
            + '<button type="button" data-acao="editar">✏️ Editar</button>'
            + '<button type="button" data-acao="clonar">📋 Clonar</button>'
            + '</div>'
            + '</div>';
        }).join('');
      }

      async function buscar() {
        var raw = String(inp && inp.value || '').trim();
        if (!raw) return;
        if (window._buscaMultiplaOF) {} else { window._buscaMultiplaOF = true; }
        if (res) { res.style.display = 'none'; res.innerHTML = ''; }
        if (info) { info.style.display = 'none'; info.textContent = ''; }
        if (nav) { nav.style.display = 'none'; nav.innerHTML = ''; }
        clearHighlights();

        if (hasLetters(raw)) {
          var tokenCli = _getToken();
          var respCli = await fetch('/api/ofs/buscar?cliente=' + encodeURIComponent(raw) + '&status=' + encodeURIComponent('Em aberto'), { headers: tokenCli ? { Authorization: 'Bearer ' + tokenCli } : {} });
          var jsonCli = await respCli.json().catch(function() { return null; });
          var ofsCli = Array.isArray(jsonCli && jsonCli.data) ? jsonCli.data : [];
          ofsCli = ofsCli.filter(function(of) {
            var st = String(of && of.status || '').trim().toLowerCase();
            return !(st.indexOf('conclu') >= 0 || st.indexOf('cancel') >= 0 || st === 'pedido pronto');
          });
          if (info) {
            info.style.display = 'block';
            info.textContent = ofsCli.length
              ? (String(ofsCli.length) + " OFs em aberto encontradas para '" + raw + "'")
              : ("Nenhuma OF em aberto encontrada para '" + raw + "'");
          }
          renderBuscaCards(ofsCli, "Nenhuma OF em aberto encontrada para '" + raw + "'");
          return;
        }

        var numeros = raw.split(/[\s,;]+/).map(function(n) { return String(n || '').trim(); }).filter(Boolean);
        numeros = numeros.map(normNum).filter(Boolean);
        numeros = Array.from(new Set(numeros));
        if (!numeros.length) return;

        var rows = Array.prototype.slice.call(pg.querySelectorAll('tr[data-of-num]'));
        var map = {};
        rows.forEach(function(r) {
          var k = normNum(r.getAttribute('data-of-num') || '');
          if (k && !map[k]) map[k] = r;
        });

        var foundNums = [];
        var foundRows = [];
        var missing = [];
        numeros.forEach(function(n) {
          var tr = map[n] || null;
          if (tr) { foundNums.push(n); foundRows.push(tr); highlight(tr); }
          else missing.push(n);
        });

        if (foundRows.length) {
          window.__comBuscaMultiState = { nums: foundNums, rows: foundRows, idx: 0 };
          renderNav(window.__comBuscaMultiState);
          scrollToRow(foundRows[0]);
        } else {
          window.__comBuscaMultiState = null;
        }

        if (info) {
          info.style.display = 'block';
          info.textContent = String(foundRows.length) + ' encontradas na tabela · ' + String(missing.length) + ' em outros períodos';
        }

        if (!missing.length) return;

        var token = _getToken();
        var jobs = missing.map(function(n) {
          return fetch('/api/ofs/buscar?numero=' + encodeURIComponent(n), { headers: token ? { Authorization: 'Bearer ' + token } : {} })
            .then(function(r) { return r.json().catch(function() { return null; }); })
            .then(function(j) {
              if (!j || !j.ok) return null;
              var of = j.data || j;
              return of && of.id ? of : null;
            })
            .catch(function() { return null; });
        });
        var ofs = (await Promise.all(jobs)).filter(Boolean);
        if (!ofs.length) {
          renderBuscaCards([], 'OF não encontrada no sistema.');
          return;
        }

        if (res) renderBuscaCards(ofs, 'OF não encontrada no sistema.');
      }

      btn.addEventListener('click', function(e) { try { e.preventDefault(); } catch (_) {} buscar(); });
      inp.addEventListener('keydown', function(e) { if (e && e.key === 'Enter') { try { e.preventDefault(); } catch (_) {} buscar(); } });
      if (res) {
        res.onclick = function(ev) {
          try {
            var btnA = ev && ev.target && (ev.target.closest ? ev.target.closest('button[data-acao]') : null);
            if (!btnA) return;
            var card = btnA.closest('.com-busca-card');
            if (!card) return;
            var ofId = String(card.getAttribute('data-of-id') || '').trim();
            if (!ofId) return;
            var lista = Array.isArray(res._ofsData) ? res._ofsData : [];
            var of = lista.find(function(x) { return String(x && x.id || '') === ofId; }) || null;
            var acao = String(btnA.getAttribute('data-acao') || '');
            if (acao === 'editar') {
              if (typeof window._abrirModalEdicaoOF === 'function') window._abrirModalEdicaoOF(of || ofId);
              else _abrirModalOF(ofId);
              return;
            }
            if (acao === 'concluir') { _abrirFluxoConclusaoOF(ofId, of || null); return; }
            if (acao === 'clonar') {
              if (typeof window.__patchCloneOF === 'function') window.__patchCloneOF(ofId);
              return;
            }
          } catch (_) {}
        };
      }
    } catch (_) {}
  }

  function _ensureModal() {
    try {
      if (document.getElementById('comissoes-modal')) return;
      var modal = document.createElement('div');
      modal.id = 'comissoes-modal';
      modal.innerHTML = ''
        + '<div class="m-box">'
        + '<div class="m-head"><div class="m-title" id="comissoes-modal-title">Editar OF</div><button class="m-close" id="comissoes-modal-close">Fechar</button></div>'
        + '<div id="comissoes-modal-body"></div>'
        + '</div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) {
        try {
          if (e && e.target === modal) {
            modal.style.display = 'none';
          }
        } catch (_) {}
      });
      var btnClose = modal.querySelector('#comissoes-modal-close');
      if (btnClose) btnClose.addEventListener('click', function() { modal.style.display = 'none'; });
    } catch (_) {}
  }

  async function _loadClientesMapa() {
    try {
      if (window.__CLIENTES_MAPA && Object.keys(window.__CLIENTES_MAPA).length) return window.__CLIENTES_MAPA;
      var token = _getToken();
      var resp = await fetch('/api/clientes/mapa', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var j = await resp.json().catch(function() { return null; });
      var mapa = (j && (j.mapa || j.data || j.clientes || j)) || null;
      if (!mapa || typeof mapa !== 'object') return null;
      var out = {};
      Object.keys(mapa).forEach(function(k) {
        out[String(k).toLowerCase()] = mapa[k];
      });
      window.__CLIENTES_MAPA = out;
      window.CLIENTES = window.CLIENTES || out;
      return out;
    } catch (_) { return null; }
  }

  async function _loadVendedoresLista() {
    try {
      if (window.__VENDEDORES_LISTA && window.__VENDEDORES_LISTA.length) return window.__VENDEDORES_LISTA;
      var token = _getToken();
      var resp = await fetch('/api/vendedores', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var j = await resp.json().catch(function() { return null; });
      var lista = (j && (j.data || j.vendedores)) || [];
      if (!Array.isArray(lista)) lista = [];
      window.__VENDEDORES_LISTA = lista;
      window._vendedoresMap = window._vendedoresMap || {};
      lista.forEach(function(v) {
        try {
          var id = String(v && v.id || '').trim().toLowerCase();
          var nome = String(v && (v.nome || v.name) || '').trim();
          if (id && nome) window._vendedoresMap[id] = nome;
          if (nome) window._vendedoresMap[nome.toLowerCase()] = nome;
        } catch (_) {}
      });
      return lista;
    } catch (_) { return []; }
  }

  async function _ensureVendedoresMap() {
    try {
      if (window._vendedoresMap && Object.keys(window._vendedoresMap).length > 0) return window._vendedoresMap;
      await _loadVendedoresLista();
      return window._vendedoresMap || {};
    } catch (_) { return {}; }
  }

  function _resolverVendedor(of) {
    try {
      if (!window._vendedoresMap) return String(of && (of.vendedor || of.vendedor_nome || of.vendNome) || '—').trim() || '—';
      var vid = String(of && (of.vendedor_id || of.vendId || of.vend_id || '') || '').trim().toLowerCase();
      var vnome = String(of && (of.vendedor || of.vendedor_nome || of.vendNome || '') || '').trim().toLowerCase();
      return window._vendedoresMap[vid]
        || window._vendedoresMap[vnome]
        || String(of && (of.vendedor || of.vendedor_nome || of.vendNome) || '—').trim()
        || '—';
    } catch (_) {
      return String(of && (of.vendedor || of.vendedor_nome || of.vendNome) || '—').trim() || '—';
    }
  }

  async function _buscarClientesApi(search) {
    try {
      var token = _getToken();
      var q = String(search || '').trim();
      var resp = await fetch('/api/clientes?search=' + encodeURIComponent(q) + '&limit=20', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var j = await resp.json().catch(function() { return null; });
      var lista = (j && (j.data || j.clientes)) || [];
      return Array.isArray(lista) ? lista : [];
    } catch (_) { return []; }
  }

  async function _buscarClienteAtual(id) {
    try {
      id = String(id || '').trim();
      if (!id) return null;
      var token = _getToken();
      var resp = await fetch('/api/clientes/' + encodeURIComponent(id), { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var j = await resp.json().catch(function() { return null; });
      var cli = (j && (j.data || j)) || null;
      return cli && cli.id ? cli : null;
    } catch (_) { return null; }
  }

  async function _buscarVendedorAtual(id) {
    try {
      id = String(id || '').trim();
      if (!id) return null;
      var token = _getToken();
      var resp = await fetch('/api/vendedores/' + encodeURIComponent(id), { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var j = await resp.json().catch(function() { return null; });
      return (j && (j.data || j)) || null;
    } catch (_) { return null; }
  }

  async function _buscarResumoCaixasPerdidas(ofId) {
    try {
      ofId = String(ofId || '').trim();
      if (!ofId) return { qtd: 0, maquinas: 0, itens: [] };
      var token = _getToken();
      var resp = await fetch('/api/caixas-perdidas?of_id=' + encodeURIComponent(ofId), { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var j = await resp.json().catch(function() { return null; });
      var itens = (j && (j.data || j)) || [];
      if (!Array.isArray(itens)) itens = [];
      var qtd = itens.reduce(function(s, it) { return s + (Math.trunc(Number(it && it.qtd_perdida || 0)) || 0); }, 0);
      var maquinas = {};
      itens.forEach(function(it) {
        var key = String(it && (it.maquina_nome || it.maquina || it.maquina_id) || '').trim();
        if (key) maquinas[key] = true;
      });
      return { qtd: qtd, maquinas: Object.keys(maquinas).length, itens: itens };
    } catch (_) { return { qtd: 0, maquinas: 0, itens: [] }; }
  }

  async function _obterComissaoPadraoVendedor(vendId, vendNome) {
    try {
      var pct = null;
      var dataCom = window._comissoesSqlData;
      var list = Array.isArray(dataCom && dataCom.vendedores) ? dataCom.vendedores : [];
      if (vendId) {
        var hit = list.find(function(v) { return String(v && v.id || '').trim() === String(vendId).trim(); });
        if (hit && hit.comissao_pct != null) pct = Number(hit.comissao_pct);
      }
      if ((pct == null || isNaN(pct)) && vendNome) {
        var hit2 = list.find(function(v) { return String(v && v.nome || '').trim().toLowerCase() === String(vendNome || '').trim().toLowerCase(); });
        if (hit2 && hit2.comissao_pct != null) pct = Number(hit2.comissao_pct);
      }
      if (pct != null && !isNaN(pct)) return pct;
      var vend = await _buscarVendedorAtual(vendId);
      var vp = Number(vend && (vend.comissao_pct ?? vend.comissao ?? vend.comissaoPct) || 0);
      if (!isNaN(vp) && vp > 0) return vp;
    } catch (_) {}
    return null;
  }

  function _snapshotOfParaResumo(meta) {
    meta = meta || {};
    return {
      numero: String(meta.numero || '').trim(),
      cliente: String(meta.cliente || '').trim(),
      vendedor: String(meta.vendedor || '').trim(),
      quantidade: meta.quantidade != null && meta.quantidade !== '' ? Number(meta.quantidade) : null,
      valor_total: meta.valor_total != null && meta.valor_total !== '' ? Number(meta.valor_total) : null,
      comissao_pct: meta.comissao_pct != null && meta.comissao_pct !== '' ? Number(meta.comissao_pct) : null,
      status: String(meta.status || '').trim(),
      created_at: String(meta.created_at || '').slice(0, 10),
      data_conclusao: String(meta.data_conclusao || '').slice(0, 10),
      observacoes: String(meta.observacoes || '').trim()
    };
  }

  function _valorDiffStr(v) {
    if (v == null || v === '') return '—';
    if (typeof v === 'number') return String(v);
    return String(v);
  }

  function _fecharResumoAlteracoes() {
    try {
      if (window.__comResumoAlteracoesTimer) {
        clearTimeout(window.__comResumoAlteracoesTimer);
        window.__comResumoAlteracoesTimer = null;
      }
      var el = document.getElementById('com-of-resumo-alteracoes');
      if (el && el.parentNode) el.parentNode.removeChild(el);
    } catch (_) {}
  }

  function _mostrarResumoAlteracoes(original, novo, onClose) {
    try {
      _fecharResumoAlteracoes();
      var oldV = original || {};
      var newV = novo || {};
      var defs = [
        ['cliente', 'Cliente', oldV.cliente, newV.cliente],
        ['vendedor', 'Vendedor', oldV.vendedor, newV.vendedor],
        ['quantidade', 'Quantidade', oldV.quantidade, newV.quantidade],
        ['valor_total', 'Valor Total', oldV.valor_total, newV.valor_total],
        ['status', 'Status', oldV.status, newV.status],
        ['comissao_pct', '% Comissão', oldV.comissao_pct != null ? Number(oldV.comissao_pct).toFixed(2) + '%' : '—', newV.comissao_pct != null ? Number(newV.comissao_pct).toFixed(2) + '%' : '—'],
        ['created_at', 'Data Criação', oldV.created_at, newV.created_at],
        ['data_conclusao', 'Data Conclusão', oldV.data_conclusao, newV.data_conclusao],
        ['observacoes', 'Observações', oldV.observacoes, newV.observacoes]
      ];
      var changes = defs.filter(function(row) { return _valorDiffStr(row[2]) !== _valorDiffStr(row[3]); });
      var wrap = document.createElement('div');
      wrap.id = 'com-of-resumo-alteracoes';
      wrap.style.position = 'fixed';
      wrap.style.inset = '0';
      wrap.style.background = 'rgba(0,0,0,0.35)';
      wrap.style.zIndex = '100002';
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'center';
      wrap.innerHTML = ''
        + '<div style="background:#0f2d1a;border:1px solid #10b981;border-radius:12px;padding:24px;min-width:380px;max-width:760px;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.45)">'
        + '<div style="font-size:18px;font-weight:800;margin-bottom:14px">✅ OF #' + String(newV.numero || oldV.numero || '—').replace(/</g, '&lt;') + ' salva com sucesso!</div>'
        + '<div style="font-size:13px;color:#d1fae5;margin-bottom:14px">Alterações realizadas:</div>'
        + '<div id="com-of-resumo-lista">' + (changes.length ? changes.map(function(row) {
            return '<div style="display:grid;grid-template-columns:120px 1fr 20px 1fr;gap:8px;align-items:start;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08)"><div style="color:#94a3b8">' + row[1] + '</div><div style="color:#f87171">' + String(_valorDiffStr(row[2])).replace(/</g, '&lt;') + '</div><div style="color:#64748b;text-align:center">→</div><div style="color:#10b981">' + String(_valorDiffStr(row[3])).replace(/</g, '&lt;') + '</div></div>';
          }).join('') : '<div style="color:#d1fae5">Nenhuma alteração detectada.</div>') + '</div>'
        + '<div style="display:flex;justify-content:flex-end;margin-top:16px"><button id="com-of-resumo-ok" style="background:#10b981;color:#072814;border:none;border-radius:8px;padding:10px 18px;font-weight:800;cursor:pointer">OK</button></div>'
        + '</div>';
      document.body.appendChild(wrap);
      var closeFn = function() {
        _fecharResumoAlteracoes();
        if (typeof onClose === 'function') onClose();
      };
      var okBtn = document.getElementById('com-of-resumo-ok');
      if (okBtn) okBtn.onclick = closeFn;
      wrap.addEventListener('click', function(e) { if (e.target === wrap) closeFn(); });
      window.__comResumoAlteracoesTimer = setTimeout(closeFn, 5000);
    } catch (_) {
      try { if (typeof onClose === 'function') onClose(); } catch (__) {}
    }
  }

  try { window._mostrarResumoAlteracoes = _mostrarResumoAlteracoes; } catch (_) {}

  function _ensureConclusaoModalStyle() {
    try {
      if (document.getElementById('com-conclusao-modal-style')) return;
      var st = document.createElement('style');
      st.id = 'com-conclusao-modal-style';
      st.textContent = ''
        + '@keyframes modalEntrada{from{opacity:0;transform:scale(.92) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}'
        + '.com-conc-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99998;display:flex;align-items:center;justify-content:center;padding:24px}'
        + '.com-conc-shell{position:relative;background:linear-gradient(145deg,#0f1729 0%,#111827 100%);border:1px solid #1e3a5f;border-radius:16px;box-shadow:0 30px 100px rgba(0,0,0,.8),0 0 0 1px rgba(59,130,246,.1);width:560px;max-width:95vw;max-height:90vh;overflow-y:auto;padding:0;animation:modalEntrada .25s ease-out;color:#f1f5f9}'
        + '.com-conc-head{background:linear-gradient(135deg,#0d1f3c,#1a2f52);border-bottom:1px solid #1e3a5f;border-radius:16px 16px 0 0;padding:24px 28px;display:flex;justify-content:space-between;align-items:center;gap:16px}'
        + '.com-conc-x{background:transparent;border:1px solid #334155;color:#94a3b8;border-radius:8px;width:32px;height:32px;cursor:pointer}'
        + '.com-conc-x:hover{border-color:#ef4444;color:#ef4444}'
        + '.com-conc-body{padding:28px}'
        + '.com-conc-foot{border-top:1px solid #1e293b;padding:20px 28px;display:flex;justify-content:flex-end;gap:12px}'
        + '.com-conc-field{margin-bottom:18px}'
        + '.com-conc-label{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;color:#94a3b8;font-weight:700}'
        + '.com-conc-input,.com-conc-select,.com-conc-text{width:100%;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 16px;color:#f1f5f9;box-sizing:border-box}'
        + '.com-conc-input[readonly]{background:#0f172a;border-color:#1e293b;color:#94a3b8}'
        + '.com-conc-qtd{background:#0d2218;border:2px solid #10b981;border-radius:10px;padding:14px 16px;font-size:22px;font-weight:700;color:#10b981;text-align:center;width:100%;box-sizing:border-box}'
        + '.com-conc-loss-row{background:rgba(15,23,42,.82);border:1px solid #1e293b;border-radius:10px;padding:12px;margin-top:10px}'
        + '.com-conc-loss-grid{display:grid;grid-template-columns:minmax(0,1fr) 140px 38px;gap:10px;align-items:center}'
        + '.com-conc-operator-row{display:flex;gap:8px;align-items:center;margin-top:8px}'
        + '.com-conc-mini-btn{background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer}'
        + '.com-conc-remove{background:transparent;border:1px solid rgba(239,68,68,.45);color:#ef4444;border-radius:8px;width:36px;height:36px;cursor:pointer}'
        + '.com-conc-add-op{margin-top:8px;background:transparent;border:none;color:#60a5fa;cursor:pointer;padding:0}'
        + '.com-conc-summary{background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:16px;margin-top:16px}'
        + '.com-conc-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px;font-size:13px;color:#cbd5e1}'
        + '.com-conc-cancel{background:transparent;border:1px solid #334155;color:#94a3b8;border-radius:8px;padding:10px 20px;cursor:pointer}'
        + '.com-conc-cancel:hover{border-color:#94a3b8}'
        + '.com-conc-save{background:linear-gradient(135deg,#059669,#10b981);color:#fff;font-weight:700;border:none;border-radius:8px;padding:10px 24px;box-shadow:0 4px 15px rgba(16,185,129,.3);cursor:pointer}'
        + '.com-conc-save:hover{filter:brightness(1.1);transform:translateY(-1px)}'
        + '.com-conc-save:disabled{opacity:.5;cursor:not-allowed;transform:none;filter:none}'
        + '@keyframes popupEntrada{from{opacity:0;transform:scale(.8) translateY(-20px)}to{opacity:1;transform:scale(1) translateY(0)}}'
        + '@media (max-width:640px){.com-conc-head,.com-conc-body,.com-conc-foot{padding-left:18px;padding-right:18px}.com-conc-loss-grid{grid-template-columns:1fr}.com-conc-summary-grid{grid-template-columns:1fr}}';
      document.head.appendChild(st);
    } catch (_) {}
  }

  function _parseFluxoConclusao(raw) {
    try {
      if (Array.isArray(raw)) return raw;
      if (!raw) return [];
      if (typeof raw === 'string') {
        var txt = String(raw || '').trim();
        if (!txt) return [];
        if (txt.charAt(0) === '[' || txt.charAt(0) === '{') {
          var parsed = JSON.parse(txt);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && typeof parsed === 'object') {
            var maybe = parsed.etapas || parsed.maquinas || parsed.fluxo || parsed.sequencia || parsed.maq || [];
            return Array.isArray(maybe) ? maybe : [];
          }
        }
        return txt.split(/[,\n;\t|]+/g).map(function(s) { return String(s || '').trim(); }).filter(Boolean);
      }
    } catch (_) {}
    return [];
  }

  async function _carregarOperadoresParaConclusao() {
    try { window._operadoresConclusaoCache = null; } catch (_) {}
    try { delete window._operadoresConclusaoCache; } catch (_) {}

    try {
      var opNativos = window.OPERADORES || window._operadores || window.operadores || window.listaOperadores;
      if (Array.isArray(opNativos) && opNativos.length > 0) {
        window._operadoresConclusaoCache = opNativos;
        return opNativos;
      }
    } catch (_) {}

    var token = _getToken();
    var rotas = ['/api/operadores', '/api/operadores?todos=true', '/api/operadores?limit=100'];
    for (var i = 0; i < rotas.length; i += 1) {
      try {
        var r = await fetch(rotas[i], { headers: token ? { Authorization: 'Bearer ' + token } : {} });
        if (!r.ok) continue;
        var d = await r.json().catch(function() { return null; });
        var lista = Array.isArray(d) ? d : ((d && (d.operadores || d.data)) || []);
        lista = Array.isArray(lista) ? lista : [];
        if (lista.length > 0) {
          window._operadoresConclusaoCache = lista;
          return lista;
        }
      } catch (_) {}
    }
    window._operadoresConclusaoCache = [];
    return [];
  }

  async function _carregarOperadoresConclusao() {
    return _carregarOperadoresParaConclusao();
  }

  async function _carregarMaquinasParaConclusao() {
    try { window._maquinasConclusaoCache = null; } catch (_) {}
    try { delete window._maquinasConclusaoCache; } catch (_) {}

    try {
      var maqNativas = window.MAQUINAS || window._maquinas || window.maquinas || window.listaMaquinas;
      if (Array.isArray(maqNativas) && maqNativas.length > 6) {
        window._maquinasConclusaoCache = maqNativas;
        return maqNativas;
      }
    } catch (_) {}

    try {
      var sels = Array.prototype.slice.call(document.querySelectorAll('select'));
      for (var s = 0; s < Math.min(200, sels.length); s += 1) {
        var sel = sels[s];
        if (!sel || !sel.options || sel.options.length <= 8) continue;
        var opts = Array.prototype.slice.call(sel.options).filter(function(o) {
          var txt = String(o && o.textContent || '').trim();
          return o && o.value && (txt.indexOf('IMP') >= 0 || txt.indexOf('Risc') >= 0 || txt.indexOf('Colad') >= 0 || txt.indexOf('Acab') >= 0 || txt.indexOf('Corte') >= 0);
        });
        if (opts.length > 6) {
          var listaDom = opts.map(function(o) { return { id: String(o.value || '').trim(), nome: String(o.textContent || '').trim() }; }).filter(function(m) { return m.id && m.nome; });
          if (listaDom.length > 6) {
            window._maquinasConclusaoCache = listaDom;
            return listaDom;
          }
        }
      }
    } catch (_) {}

    var token = _getToken();
    var rotasApi = ['/api/maquinas?todas=true', '/api/maquinas?limit=100&todas=true', '/api/maquinas?limit=100', '/api/maquinas', '/api/machines', '/api/equipamentos'];
    for (var j = 0; j < rotasApi.length; j += 1) {
      try {
        var r2 = await fetch(rotasApi[j], { headers: token ? { Authorization: 'Bearer ' + token } : {} });
        if (!r2.ok) continue;
        var d2 = await r2.json().catch(function() { return null; });
        var lista2 = Array.isArray(d2) ? d2 : ((d2 && (d2.maquinas || d2.data)) || []);
        lista2 = Array.isArray(lista2) ? lista2 : [];
        if (lista2.length > 6) {
          window._maquinasConclusaoCache = lista2;
          try { console.log('[maquinas]', lista2.map(function(m) { return String((m && (m.nome || m.descricao || m.codigo || m.col)) || '').trim(); }).filter(Boolean)); } catch (_) {}
          return lista2;
        }
      } catch (_) {}
    }
    window._maquinasConclusaoCache = [];
    return [];
  }

  function _mostrarPopupConclusaoOF(of) {
    try {
      var prev = document.getElementById('popup-conclusao-of');
      if (prev) prev.remove();
      var popup = document.createElement('div');
      var numero = String(of && (of.numero || of.of_num || '') || '').trim();
      var cliente = String(of && (of.cliente_nome || of.cliente || of.cliNome || '') || '').trim();
      var qtd = Math.trunc(Number(of && (of.quantidade_produzida || of.quantidade || of.qtd || 0) || 0) || 0);
      popup.id = 'popup-conclusao-of';
      popup.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);';
      popup.innerHTML = ''
        + '<div style="background:linear-gradient(135deg,#0a2018,#0d2d1a);border:1px solid #10b981;border-radius:16px;padding:40px 48px;text-align:center;box-shadow:0 0 60px rgba(16,185,129,0.3);animation:popupEntrada 0.3s ease-out;max-width:420px;width:90vw;">'
        + '<div style="font-size:56px;margin-bottom:16px;">✅</div>'
        + '<div style="font-size:22px;font-weight:700;color:#10b981;margin-bottom:8px;">OF #' + String(numero).replace(/</g, '&lt;') + ' Concluída!</div>'
        + '<div style="font-size:14px;color:#94a3b8;margin-bottom:4px;">' + String(cliente).replace(/</g, '&lt;') + '</div>'
        + '<div style="font-size:13px;color:#64748b;margin-bottom:24px;">' + String(qtd || 0) + ' caixas produzidas</div>'
        + '<button type="button" id="popup-conclusao-of-ok" style="background:linear-gradient(135deg,#059669,#10b981);color:white;border:none;border-radius:8px;padding:12px 32px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.3);">OK</button>'
        + '</div>';
      popup.addEventListener('click', function(e) {
        if (e.target === popup) popup.remove();
      });
      document.body.appendChild(popup);
      var ok = document.getElementById('popup-conclusao-of-ok');
      if (ok) ok.onclick = function() { try { popup.remove(); } catch (_) {} };
      setTimeout(function() { try { popup.remove(); } catch (_) {} }, 4000);
    } catch (_) {}
  }

  function _getResumoConclusao(of, qtdProd, perdas) {
    var qtdPedido = Math.trunc(Number(of && (of.qtd_pedida ?? of.quantidade ?? of.qtd ?? 0) || 0) || 0);
    var produzidas = Math.trunc(Number(qtdProd || 0) || 0);
    var perdasQtd = (Array.isArray(perdas) ? perdas : []).reduce(function(s, p) { return s + (Math.trunc(Number(p && p.qtd || 0)) || 0); }, 0);
    var excedente = produzidas - qtdPedido;
    var vunit = Number(of && (of.preco ?? of.valor_unitario ?? of.vl_unit ?? 0) || 0) || 0;
    if (!(vunit > 0) && qtdPedido > 0) {
      var vt = Number(of && (of.valor_total ?? of.valor_venda ?? 0) || 0) || 0;
      if (vt > 0) vunit = vt / qtdPedido;
    }
    var novoTotal = Math.round((vunit * produzidas) * 100) / 100;
    var perdasValor = Math.round((vunit * perdasQtd) * 100) / 100;
    return { qtdPedido: qtdPedido, produzidas: produzidas, perdasQtd: perdasQtd, excedente: excedente, valorUnitario: vunit, novoTotal: novoTotal, perdasValor: perdasValor };
  }

  try { window._abrirModalEdicaoOF = function(of) { return _abrirModalOF(typeof of === 'string' ? of : (of && of.id)); }; } catch (_) {}

  async function _abrirModalConclusaoFallback(ofId, ofDados) {
    try {
      _ensureConclusaoModalStyle();
      var of = ofDados || null;
      if (!of) {
        var tokenFetch = _getToken();
        var respFetch = await fetch('/api/ofs/' + encodeURIComponent(String(ofId || '').trim()), { headers: tokenFetch ? { Authorization: 'Bearer ' + tokenFetch } : {} });
        var jsonFetch = await respFetch.json().catch(function() { return null; });
        of = (jsonFetch && (jsonFetch.data || jsonFetch)) || null;
      }
      if (!of) return;

      try { window._maquinasConclusaoCache = null; } catch (_) {}
      try { window._operadoresConclusaoCache = null; } catch (_) {}

      var numero = String(of && (of.numero || of.of_num || of.of_numero || '') || '—').trim();
      var cliente = String(of && (of.cliNome || of.cliente_nome || of.cliente || '') || 'Cliente não identificado').trim();
      var usuario = '';
      try { usuario = String((window.CURRENT_USER && (window.CURRENT_USER.nome || window.CURRENT_USER.name)) || localStorage.getItem('nome') || 'Usuário').trim(); } catch (_) { usuario = 'Usuário'; }
      var hoje = new Date().toISOString().slice(0, 10);
      var qtdInicial = Math.trunc(Number(of && (of.quantidade ?? of.qtd ?? of.qtd_pedida ?? 0) || 0) || 0);
      var maquinasFluxo = _parseFluxoConclusao(of && (of.fluxo_maquinas || of.maq));
      maquinasFluxo = (Array.isArray(maquinasFluxo) ? maquinasFluxo : []).map(function(x) {
        if (x && typeof x === 'object') return String(x.nome || x.name || x.maquina || x.col || x.id || '').trim();
        return String(x || '').trim();
      }).filter(Boolean).filter(function(v, i, a) { return a.indexOf(v) === i; });
      if (!maquinasFluxo.length) {
        var maqAtual = String(of && (of.maquina || of.maq || of.maquina_atual || of.maquina_agendada) || '').trim();
        if (maqAtual) maquinasFluxo = [maqAtual];
      }
      var preloadMaquinas = _carregarMaquinasParaConclusao().catch(function() { return []; });
      var preloadOperadores = _carregarOperadoresParaConclusao().catch(function() { return []; });
      Promise.all([preloadMaquinas, preloadOperadores]).then(function(pair) {
        try { console.log('[conclusao] máquinas:', (pair[0] && pair[0].length) || 0, 'operadores:', (pair[1] && pair[1].length) || 0); } catch (_) {}
      }).catch(function() {});
      var operadores = [];

      var backdrop = document.createElement('div');
      backdrop.className = 'com-conc-backdrop';
      backdrop.innerHTML = ''
        + '<div class="com-conc-shell" role="dialog" aria-modal="true">'
        + '  <div class="com-conc-head">'
        + '    <div>'
        + '      <div style="font-size:18px;font-weight:700;color:#f1f5f9">✔ Concluindo OF #' + String(numero).replace(/</g, '&lt;') + '</div>'
        + '      <div style="margin-top:4px;font-size:13px;color:#60a5fa">' + String(cliente).replace(/</g, '&lt;') + '</div>'
        + '    </div>'
        + '    <button type="button" class="com-conc-x" data-close="1">×</button>'
        + '  </div>'
        + '  <div class="com-conc-body">'
        + '    <div class="com-conc-field">'
        + '      <label class="com-conc-label">Concluído por</label>'
        + '      <input id="conclusao-usuario" class="com-conc-input" readonly value="' + String(usuario).replace(/"/g, '&quot;') + '"/>'
        + '    </div>'
        + '    <div class="com-conc-field">'
        + '      <label class="com-conc-label" style="color:#10b981">🏭 Caixas Produzidas *</label>'
        + '      <input id="conclusao-caixas-produzidas" class="com-conc-qtd" type="number" min="0" step="1" value="' + String(qtdInicial) + '"/>'
        + '    </div>'
        + '    <div class="com-conc-field">'
        + '      <label class="com-conc-label">📅 Data de Faturamento *</label>'
        + '      <input id="conclusao-data-faturamento" class="com-conc-input" type="date" value="' + hoje + '"/>'
        + '    </div>'
        + '    <div class="com-conc-field">'
        + '      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">'
        + '        <label class="com-conc-label" style="margin-bottom:0">💥 Caixas Perdidas por Máquina</label>'
        + '        <button type="button" class="com-conc-mini-btn" id="conclusao-add-perda">+ Adicionar</button>'
        + '      </div>'
        + '      <div id="conclusao-perdas-lista"></div>'
        + '      <div id="conclusao-total-perdido" style="margin-top:10px;font-size:13px;font-weight:700;color:#ef4444">Total perdido: 0 caixas</div>'
        + '    </div>'
        + '    <div class="com-conc-summary">'
        + '      <div class="com-conc-summary-grid">'
        + '        <div>Pedido: <b id="conc-res-pedido">0</b></div>'
        + '        <div>Produzidas: <b id="conc-res-produzidas">0</b></div>'
        + '        <div>Excedente: <b id="conc-res-excedente">0</b></div>'
        + '        <div>Perdas: <b id="conc-res-perdas">0</b></div>'
        + '      </div>'
        + '      <div style="height:1px;background:#1e293b;margin:14px 0"></div>'
        + '      <div id="conc-res-financeiro" style="font-size:13px;font-weight:700;color:#10b981">Valor unitário: R$ 0,00  ·  Novo total: R$ 0,00  ·  Perdas: R$ 0,00</div>'
        + '    </div>'
        + '  </div>'
        + '  <div class="com-conc-foot">'
        + '    <button type="button" class="com-conc-cancel" data-close="1">Cancelar</button>'
        + '    <button type="button" class="com-conc-save" id="conclusao-confirmar">✔ Confirmar Conclusão</button>'
        + '  </div>'
        + '</div>';
      document.body.appendChild(backdrop);

      var shell = backdrop.querySelector('.com-conc-shell');
      var qtdEl = backdrop.querySelector('#conclusao-caixas-produzidas');
      var dataEl = backdrop.querySelector('#conclusao-data-faturamento');
      var perdasLista = backdrop.querySelector('#conclusao-perdas-lista');
      var totalPerdidoEl = backdrop.querySelector('#conclusao-total-perdido');
      var btnSalvar = backdrop.querySelector('#conclusao-confirmar');
      var onEsc = function(e) {
        try {
          if (e && e.key === 'Escape') closeModal();
        } catch (_) {}
      };

      function closeModal() {
        try { document.removeEventListener('keydown', onEsc, true); } catch (_) {}
        try { if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); } catch (_) {}
      }
      try { document.addEventListener('keydown', onEsc, true); } catch (_) {}
      backdrop.addEventListener('click', function(e) { if (e.target === backdrop) closeModal(); });
      if (shell) shell.addEventListener('click', function(e) { try { e.stopPropagation(); } catch (_) {} });
      Array.prototype.slice.call(backdrop.querySelectorAll('[data-close="1"]')).forEach(function(btn) {
        btn.onclick = function(e) { try { e.preventDefault(); } catch (_) {} closeModal(); };
      });

      function optionHtml(lista, selected, placeholder) {
        var cur = String(selected || '').trim();
        var opts = ['<option value="">' + String(placeholder || 'Selecionar...').replace(/</g, '&lt;') + '</option>'].concat((lista || []).map(function(nome) {
          var v = '';
          var label = '';
          if (nome && typeof nome === 'object') {
            v = String(nome.id || nome.nome || nome.descricao || nome.email || '').trim();
            label = String(nome.nome || nome.descricao || nome.email || nome.id || '').trim();
          } else {
            v = String(nome || '').trim();
            label = v;
          }
          return '<option value="' + v.replace(/"/g, '&quot;') + '"' + (v === cur ? ' selected' : '') + '>' + label.replace(/</g, '&lt;') + '</option>';
        }));
        return opts.join('');
      }
      function collectPerdas() {
        return Array.prototype.slice.call(perdasLista.querySelectorAll('.com-conc-loss-row')).map(function(row) {
          var maq = String((row.querySelector('.conc-loss-maq') || {}).value || '').trim();
          var qtd = Math.trunc(Number((row.querySelector('.conc-loss-qtd') || {}).value || 0) || 0);
          var ops = Array.prototype.slice.call(row.querySelectorAll('.conc-loss-op')).map(function(sel) {
            return String(sel && sel.value || '').trim();
          }).filter(Boolean);
          return { maquina: maq, qtd: qtd, operadores: ops };
        }).filter(function(item) { return item.maquina && item.qtd > 0; });
      }
      function updateResumo() {
        var resumo = _getResumoConclusao(of, qtdEl && qtdEl.value, collectPerdas());
        try { backdrop.querySelector('#conc-res-pedido').textContent = String(resumo.qtdPedido); } catch (_) {}
        try { backdrop.querySelector('#conc-res-produzidas').textContent = String(resumo.produzidas); } catch (_) {}
        try { backdrop.querySelector('#conc-res-excedente').textContent = String(resumo.excedente); } catch (_) {}
        try { backdrop.querySelector('#conc-res-perdas').textContent = String(resumo.perdasQtd); } catch (_) {}
        try { totalPerdidoEl.textContent = 'Total perdido: ' + String(resumo.perdasQtd) + ' caixas'; } catch (_) {}
        try {
          var financeiro = backdrop.querySelector('#conc-res-financeiro');
          if (financeiro) {
            financeiro.style.color = resumo.perdasQtd > 0 ? '#fca5a5' : '#10b981';
            financeiro.textContent = 'Valor unitário: ' + _fmtMoney(resumo.valorUnitario) + '  ·  Novo total: ' + _fmtMoney(resumo.novoTotal) + '  ·  Perdas: ' + _fmtMoney(resumo.perdasValor);
          }
        } catch (_) {}
        if (btnSalvar) btnSalvar.disabled = !(resumo.produzidas > 0);
        return resumo;
      }
      function addOperadorRow(host, selected) {
        var row = document.createElement('div');
        row.className = 'com-conc-operator-row';
        row.innerHTML = ''
          + '<select class="com-conc-select conc-loss-op" style="flex:1">' + optionHtml(operadores, selected, 'Selecionar operador...') + '</select>'
          + '<button type="button" class="com-conc-remove">×</button>';
        host.appendChild(row);
        row.querySelector('.com-conc-remove').onclick = function() { row.remove(); updateResumo(); };
        row.querySelector('.conc-loss-op').onchange = updateResumo;
      }
      async function addPerdaRow(data) {
        var payload = data || {};
        var maquinasApi = await preloadMaquinas.catch(function() { return []; });
        var maquinas = (Array.isArray(maquinasApi) ? maquinasApi.slice() : []).filter(Boolean);
        if (!maquinas.length && maquinasFluxo.length) {
          maquinas = maquinasFluxo.map(function(nome) { return { id: nome, nome: nome }; });
        }
        var opsApi = await preloadOperadores.catch(function() { return []; });
        var operadoresLista = (Array.isArray(opsApi) ? opsApi.slice() : []).filter(Boolean);
        var row = document.createElement('div');
        row.className = 'com-conc-loss-row';
        row.innerHTML = ''
          + '<div class="com-conc-loss-grid">'
          + '  <select class="com-conc-select conc-loss-maq">' + optionHtml(maquinas, payload.maquina || ((maquinas[0] && (maquinas[0].id || maquinas[0].nome || maquinas[0].descricao)) || ''), 'Selecionar máquina...') + '</select>'
          + '  <input class="com-conc-input conc-loss-qtd" type="number" min="0" step="1" value="' + String(payload.qtd || '') + '"/>'
          + '  <button type="button" class="com-conc-remove">×</button>'
          + '</div>'
          + '<button type="button" class="com-conc-add-op">+ Operador nesta perda</button>'
          + '<div class="conc-loss-ops"></div>';
        perdasLista.appendChild(row);
        row.querySelector('.com-conc-remove').onclick = function() { row.remove(); updateResumo(); };
        row.querySelector('.conc-loss-maq').onchange = updateResumo;
        row.querySelector('.conc-loss-qtd').oninput = updateResumo;
        var opsHost = row.querySelector('.conc-loss-ops');
        row.querySelector('.com-conc-add-op').onclick = function() {
          var prevOps = operadores;
          operadores = operadoresLista;
          addOperadorRow(opsHost, '');
          operadores = prevOps;
          updateResumo();
        };
        var opsInit = Array.isArray(payload.operadores) ? payload.operadores : [];
        if (opsInit.length) opsInit.forEach(function(op) {
          var prevOps = operadores;
          operadores = operadoresLista;
          addOperadorRow(opsHost, op);
          operadores = prevOps;
        });
        updateResumo();
      }

      var addPerdaBtn = backdrop.querySelector('#conclusao-add-perda');
      if (addPerdaBtn) addPerdaBtn.onclick = function() { addPerdaRow({}).catch(function() {}); };
      if (qtdEl) qtdEl.oninput = updateResumo;
      if (dataEl) dataEl.onchange = updateResumo;
      updateResumo();

      if (btnSalvar) btnSalvar.onclick = async function(e) {
        try { e.preventDefault(); } catch (_) {}
        var resumo = updateResumo();
        var caixasProduzidas = parseInt((qtdEl && qtdEl.value) || '0', 10);
        var dataFaturamento = String((dataEl && dataEl.value) || '').trim();
        if (!(caixasProduzidas > 0)) { try { alert('Informe as caixas produzidas.'); } catch (_) {} return; }
        if (!dataFaturamento) { try { alert('Informe a data de faturamento.'); } catch (_) {} return; }
        var perdas = collectPerdas();
        var precoUnitario = Number(resumo.valorUnitario || 0) || 0;
        var body = {
          status: 'Concluído',
          data_faturamento: dataFaturamento,
          qtd_produzida: caixasProduzidas,
          caixas_produzidas: caixasProduzidas,
          caixas_boas: caixasProduzidas,
          preco: precoUnitario,
          valor_unitario: precoUnitario,
          valor_total: resumo.novoTotal,
          valor_venda: resumo.novoTotal,
          usuario_conclusao: usuario,
          _allow_partial: '1'
        };
        btnSalvar.disabled = true;
        var token = _getToken();
        try {
          var r1 = await fetch('/api/ofs/' + encodeURIComponent(String(of.id || ofId)) + '/concluir', {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
            body: JSON.stringify(body)
          });
          var j1 = await r1.json().catch(function() { return null; });
          if (!j1 || !j1.ok) throw new Error(String(j1 && (j1.error || j1.message) || 'Falha ao concluir OF'));
          try {
            var ofAtualizada = j1.data || j1.of || null;
            if (ofAtualizada && of && typeof of === 'object') Object.assign(of, ofAtualizada);
            if (ofAtualizada && Array.isArray(window.OFs)) {
              var idxAtual = window.OFs.findIndex(function(item) { return String(item && item.id || '').trim() === String(ofAtualizada && ofAtualizada.id || of.id || ofId).trim(); });
              if (idxAtual >= 0) window.OFs[idxAtual] = Object.assign({}, window.OFs[idxAtual], ofAtualizada);
            }
          } catch (_) {}

          for (var i = 0; i < perdas.length; i += 1) {
            var perda = perdas[i];
            await fetch('/api/caixas-perdidas', {
              method: 'POST',
              headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
              body: JSON.stringify({
                of_id: of.id || ofId,
                of_numero: of.numero || null,
                produto: of.produto || of.descricao || of.prodDesc || '',
                cliente: cliente,
                emp_id: of.emp_id || of.empId || of.empresa_id || 'E1',
                maquina: perda.maquina,
                quantidade: perda.qtd,
                qtd_perdida: perda.qtd,
                valor_unitario: resumo.valorUnitario,
                valor_perdido: Math.round((resumo.valorUnitario * perda.qtd) * 100) / 100,
                operadores: perda.operadores,
                usuario: usuario,
                usuario_conclusao: usuario,
                data: dataFaturamento,
                obs: 'Perda registrada na conclusão da OF'
              })
            }).catch(function() { return null; });
          }

          closeModal();
          _mostrarPopupConclusaoOF({
            numero: numero,
            cliente_nome: cliente,
            quantidade_produzida: caixasProduzidas,
            quantidade: caixasProduzidas
          });
          try { if (typeof window.toast === 'function') window.toast('✅ OF concluída com sucesso', 'var(--green)'); } catch (_) {}
          try { if (typeof window.calcularComissoes === 'function') window.calcularComissoes(); } catch (_) {}
        } catch (errConc) {
          try { alert('Erro ao concluir OF: ' + String(errConc && errConc.message || errConc)); } catch (_) {}
        } finally {
          btnSalvar.disabled = false;
          updateResumo();
        }
      };
    } catch (_) {}
  }

  async function _abrirFluxoConclusaoOF(ofId, ofObj) {
    try {
      ofId = String(ofId || '').trim();
      if (!ofId) return;
      await _abrirModalConclusaoFallback(ofId, ofObj || null);
    } catch (_) {}
  }

  function _renderModalForm(of) {
    var id = String(of && of.id || '').trim();
    var numero = String(of && (of.numero || of.of_num || of.of_numero || '') || '').trim();
    var cliId = String(of && (of.cli_id || of.cliId || of.cliente_id || of.clienteId || '') || '').trim();
    var vendId = String(of && (of.vendedor_id || of.vendId || of.vend_id || '') || '').trim();
    var qtd = (of && (of.quantidade ?? of.qtd ?? of.qtd_pedida)) != null ? String(of.quantidade ?? of.qtd ?? of.qtd_pedida) : '';
    var valTot = (of && (of.valor_total ?? of.valor_venda ?? of.valorTotal)) != null ? String(of.valor_total ?? of.valor_venda ?? of.valorTotal) : '';
    var valUnit = Number(of && (of.valor_unitario ?? of.vl_unit ?? null));
    if (!(valUnit > 0)) {
      var qtdNumBase = Number(of && (of.quantidade ?? of.qtd ?? of.qtd_pedida ?? 0) || 0) || 0;
      var totalNumBase = Number(of && (of.valor_total ?? of.valor_venda ?? of.valorTotal ?? 0) || 0) || 0;
      if (qtdNumBase > 0 && totalNumBase > 0) valUnit = totalNumBase / qtdNumBase;
    }
    if (!(valUnit > 0)) {
      var itens0 = of && of.itens;
      if (typeof itens0 === 'string') { try { itens0 = JSON.parse(itens0); } catch (_) { itens0 = null; } }
      if (Array.isArray(itens0) && itens0[0]) {
        var vuItem = Number(itens0[0].vunit ?? itens0[0].valor_unitario ?? 0) || 0;
        if (vuItem > 0) valUnit = vuItem;
      }
    }
    var comPct = (of && (of.comissao_pct ?? of.comissao ?? '')) != null ? String(of.comissao_pct ?? of.comissao ?? '') : '';
    var createdAt = String(of && (of.created_at || of.createdAt || '') || '').slice(0, 10);
    var dataConc = String(of && (of.data_conclusao || of.dataConclusao || '') || '').slice(0, 10);
    var status = String(of && of.status || '').trim();
    var obs = String(of && (of.observacoes || of.obs || of.observacao || '') || '').trim();
    var perdasResumo = of && of.__perdasResumo ? of.__perdasResumo : null;

    return ''
      + '<div class="m-grid">'
      + '<div><label>Número da OF</label><input id="com-of-numero" value="' + String(numero).replace(/"/g, '&quot;') + '" readonly /></div>'
      + '<div><label>Status</label><select id="com-of-status">'
      + '<option value="Aberta">Aberta</option>'
      + '<option value="Em Produção">Em Produção</option>'
      + '<option value="Concluído">Concluído</option>'
      + '<option value="Cancelada">Cancelada</option>'
      + '</select></div>'
      + '<div class="m-full m-autocomplete"><label>Cliente</label><input id="com-of-cli-busca" placeholder="Buscar cliente..." autocomplete="off" /><div id="com-of-cli-suggest" class="m-suggest" style="display:none"></div><input id="com-of-cli-id" value="' + String(cliId).replace(/"/g, '&quot;') + '" style="display:none" /></div>'
      + '<div class="m-full"><label>Vendedor</label><select id="com-of-vend-select"></select><input id="com-of-vend-id" value="' + String(vendId).replace(/"/g, '&quot;') + '" style="display:none" /></div>'
      + '<div><label>Quantidade</label><input type="number" step="1" id="com-of-qtd" value="' + String(qtd).replace(/"/g, '&quot;') + '" /></div>'
      + '<div><label>Valor Unitário</label><input type="number" step="0.01" id="edit-of-valor-unitario" value="' + (valUnit > 0 ? String(valUnit.toFixed(2)) : '') + '" /></div>'
      + '<div><label>Valor Total</label><input type="number" step="0.01" id="com-of-valor" readonly value="' + String(valTot).replace(/"/g, '&quot;') + '" /></div>'
      + '<div><label>% Comissão</label><input type="number" step="0.01" id="com-of-comissao" value="' + String(comPct).replace(/"/g, '&quot;') + '" /></div>'
      + '<div class="m-full" id="com-of-comissao-resumo" style="font-size:13px;color:#10b981;font-weight:700">Comissão: R$ 0,00</div>'
      + '<div><label>Data de Criação</label><input type="date" id="com-of-created" value="' + String(createdAt).replace(/"/g, '&quot;') + '" /></div>'
      + '<div><label>Data de Conclusão</label><input type="date" id="com-of-conclusao" value="' + String(dataConc).replace(/"/g, '&quot;') + '" /></div>'
      + '<div></div>'
      + '<div class="m-full"><label>Caixas Perdidas</label><input readonly id="com-of-perdas-resumo" value="' + String(perdasResumo ? (String(perdasResumo.qtd || 0) + ' caixas perdidas em ' + String(perdasResumo.maquinas || 0) + ' máquinas') : '0 caixas perdidas em 0 máquinas').replace(/"/g, '&quot;') + '" /></div>'
      + '<div class="m-full"><label>Observações</label><textarea id="com-of-obs">' + String(obs).replace(/</g, '&lt;') + '</textarea></div>'
      + '</div>'
      + '<div class="m-actions">'
      + '<button class="m-cancel" id="com-of-cancelar">Cancelar</button>'
      + '<button class="m-save" id="com-of-salvar">Salvar Alterações</button>'
      + '</div>'
      + '<input type="hidden" id="com-of-id" value="' + String(id).replace(/"/g, '&quot;') + '" />';
  }

  async function _abrirModalOF(id) {
    try {
      id = String(id || '').trim();
      if (!id) return;
      _ensureComissoesStyle();
      _ensureModal();
      var modal = document.getElementById('comissoes-modal');
      var title = document.getElementById('comissoes-modal-title');
      var body = document.getElementById('comissoes-modal-body');
      if (!modal || !body) return;

      var token = _getToken();
      var resp = await fetch('/api/ofs/' + encodeURIComponent(id), { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      var j = await resp.json().catch(function() { return null; });
      var of = (j && (j.data || j)) || null;
      if (!of || (j && j.ok === false)) {
        body.innerHTML = '<div style="padding:8px 4px">Erro ao carregar OF.</div>';
        modal.style.display = 'flex';
        return;
      }

      try {
        var perdasResumo = await _buscarResumoCaixasPerdidas(id);
        of.__perdasResumo = perdasResumo;
      } catch (_) {}
      try {
        var pctAtual = Number(of && (of.comissao_pct ?? of.comissao ?? ''));
        if (!(pctAtual > 0)) {
          var pctPadrao = await _obterComissaoPadraoVendedor(of && (of.vendedor_id || of.vendId || of.vend_id), of && (of.vendNome || of.vendedor_nome || of.vendedor));
          if (pctPadrao != null && !isNaN(pctPadrao)) of.comissao_pct = pctPadrao;
        }
      } catch (_) {}

      var originalSnapshot = _snapshotOfParaResumo({
        numero: of && (of.numero || of.of_num || of.of_numero || ''),
        cliente: of && (of.cliNome || of.cliente_nome || of.cliente || ''),
        vendedor: of && (of.vendNome || of.vendedor_nome || of.vendedor || ''),
        quantidade: of && (of.quantidade ?? of.qtd ?? of.qtd_pedida ?? ''),
        valor_total: of && (of.valor_total ?? of.valor_venda ?? of.valorTotal ?? ''),
        comissao_pct: of && (of.comissao_pct ?? of.comissao ?? ''),
        status: of && of.status,
        created_at: of && (of.created_at || of.createdAt || ''),
        data_conclusao: of && (of.data_conclusao || of.dataConclusao || ''),
        observacoes: of && (of.observacoes || of.obs || of.observacao || '')
      });
      try { window._ofOriginalSnapshot = originalSnapshot; } catch (_) {}

      try { if (title) title.textContent = 'Editar OF #' + String(of && (of.numero || of.of_num || of.of_numero || '')); } catch (_) {}
      body.innerHTML = _renderModalForm(of);

      try { document.getElementById('com-of-status').value = String(of && of.status || ''); } catch (_) {}
      try {
        var cliBusca = document.getElementById('com-of-cli-busca');
        var cliSuggest = document.getElementById('com-of-cli-suggest');
        var cliHidden = document.getElementById('com-of-cli-id');
        var renderCliSuggestions = function(lista) {
          if (!cliSuggest) return;
          lista = Array.isArray(lista) ? lista : [];
          if (!lista.length) {
            cliSuggest.style.display = 'none';
            cliSuggest.innerHTML = '';
            return;
          }
          cliSuggest.style.display = 'block';
          cliSuggest.innerHTML = lista.map(function(c) {
            var nome = String(c && (c.nome || c.rs || c.razao || '') || '').trim();
            var idCli = String(c && c.id || '').trim();
            return '<div class="m-s-item" data-cli-id="' + idCli.replace(/"/g, '&quot;') + '" data-cli-nome="' + nome.replace(/"/g, '&quot;') + '">' + nome.replace(/</g, '&lt;') + '</div>';
          }).join('');
          Array.prototype.slice.call(cliSuggest.querySelectorAll('.m-s-item')).forEach(function(el) {
            el.onclick = function() {
              var idSel = String(el.getAttribute('data-cli-id') || '').trim();
              var nomeSel = String(el.getAttribute('data-cli-nome') || '').trim();
              if (cliHidden) cliHidden.value = idSel;
              if (cliBusca) cliBusca.value = nomeSel;
              cliSuggest.style.display = 'none';
            };
          });
        };

        if (cliBusca) {
          var atual = await _buscarClienteAtual(cliHidden && cliHidden.value);
          if (atual) cliBusca.value = String(atual.nome || atual.rs || atual.razao || '').trim();
          cliBusca.oninput = async function() {
            var termo = String(cliBusca.value || '').trim();
            if (termo.length < 2) {
              renderCliSuggestions([]);
              return;
            }
            var lista = await _buscarClientesApi(termo);
            renderCliSuggestions(lista);
          };
          cliBusca.onblur = function() {
            setTimeout(function() {
              try { if (cliSuggest) cliSuggest.style.display = 'none'; } catch (_) {}
            }, 180);
          };
        }
      } catch (_) {}

      try {
        var vendList = await _loadVendedoresLista();
        var vendSelect = document.getElementById('com-of-vend-select');
        var vendHidden = document.getElementById('com-of-vend-id');
        if (vendSelect && Array.isArray(vendList)) {
          var arrV = vendList.map(function(v) {
            return { id: String(v && v.id || '').trim(), nome: String(v && v.nome || '').trim() };
          }).filter(function(x) { return x.id && x.nome; });
          arrV.sort(function(a, b) { return a.nome.localeCompare(b.nome); });
          vendSelect.innerHTML = arrV.map(function(x) {
            return '<option value="' + x.id.replace(/"/g, '&quot;') + '">' + x.nome.replace(/</g, '&lt;') + '</option>';
          }).join('');
          if (vendHidden && vendHidden.value) {
            try { vendSelect.value = String(vendHidden.value); } catch (_) {}
          }
          vendSelect.onchange = function() { if (vendHidden) vendHidden.value = String(vendSelect.value || ''); };
        }
      } catch (_) {}

      var btnCancel = body.querySelector('#com-of-cancelar');
      var btnSave = body.querySelector('#com-of-salvar');
      var qtdInput = body.querySelector('#com-of-qtd');
      var valorUnitInput = body.querySelector('#edit-of-valor-unitario');
      var valorTotalInput = body.querySelector('#com-of-valor');
      var comPctInput = body.querySelector('#com-of-comissao');
      var comResumoEl = body.querySelector('#com-of-comissao-resumo');
      var _atualizarTotaisEdicao = function() {
        try {
          var qtdCalc = Number(String((qtdInput && qtdInput.value) || '').replace(',', '.')) || 0;
          var vuCalc = Number(String((valorUnitInput && valorUnitInput.value) || '').replace(',', '.')) || 0;
          var pctCalc = Number(String((comPctInput && comPctInput.value) || '').replace(',', '.')) || 0;
          var totalCalc = Math.round((qtdCalc * vuCalc) * 100) / 100;
          if (valorTotalInput) valorTotalInput.value = (qtdCalc > 0 && vuCalc >= 0) ? totalCalc.toFixed(2) : '';
          if (comResumoEl) comResumoEl.textContent = 'Comissão: ' + _fmtMoney(Math.round((totalCalc * (pctCalc / 100)) * 100) / 100);
        } catch (_) {}
      };
      if (qtdInput) qtdInput.oninput = _atualizarTotaisEdicao;
      if (valorUnitInput) valorUnitInput.oninput = _atualizarTotaisEdicao;
      if (comPctInput) comPctInput.oninput = _atualizarTotaisEdicao;
      _atualizarTotaisEdicao();
      if (btnCancel && !btnCancel.dataset.boundCancel) {
        btnCancel.dataset.boundCancel = '1';
        btnCancel.addEventListener('click', function(e) {
          try { e.preventDefault(); } catch (_) {}
          try { modal.style.display = 'none'; } catch (_) {}
        });
      }

      if (btnSave && !btnSave.dataset.boundSave) {
        btnSave.dataset.boundSave = '1';
        btnSave.addEventListener('click', async function(e) {
          try { e.preventDefault(); } catch (_) {}
          var payload = {};
          var ofId = String((body.querySelector('#com-of-id') || {}).value || (of && of.id) || id || '').trim();
          var cliInput = body.querySelector('#com-of-cli-busca');
          var cliHidden = body.querySelector('#com-of-cli-id');
          var cliId = String((cliHidden && cliHidden.value) || (cliInput && cliInput.dataset && (cliInput.dataset.cliId || cliInput.dataset.cliid)) || (of && of.cli_id) || '').trim();
          var vendId = String((body.querySelector('#com-of-vend-id') || {}).value || (of && (of.vendedor_id || of.vendId || of.vend_id)) || '').trim();
          var qtd = String((body.querySelector('#com-of-qtd') || {}).value || '').trim();
          var valorUnit = String((body.querySelector('#edit-of-valor-unitario') || {}).value || '').trim();
          var qtdNum = Number(String(qtd).replace(',', '.')) || 0;
          var valorUnitNum = Number(String(valorUnit).replace(',', '.')) || 0;
          var valorTotalCalc = Math.round((qtdNum * valorUnitNum) * 100) / 100;
          var st = String((body.querySelector('#com-of-status') || {}).value || (of && of.status) || '').trim();
          var created = String((body.querySelector('#com-of-created') || {}).value || '').trim();
          var conc = String((body.querySelector('#com-of-conclusao') || {}).value || '').trim();
          var obs = String((body.querySelector('#com-of-obs') || {}).value || '').trim();
          var comPct = String((body.querySelector('#com-of-comissao') || {}).value || '').trim();

          try { console.log('[TROCAR] salvando OF id:', ofId); } catch (_) {}

          if (cliId) payload.cli_id = cliId;
          if (vendId) payload.vendedor_id = vendId;
          if (qtd) payload.quantidade = qtdNum;
          if (valorUnit) payload.valor_unitario = valorUnitNum;
          payload.valor_total = valorTotalCalc;
          if (st) payload.status = st;
          if (created) payload.created_at = created;
          if (conc) payload.data_conclusao = conc;
          if (obs) payload.observacoes = obs;
          if (comPct) payload.comissao_pct = Number(String(comPct).replace(',', '.'));
          Object.keys(payload).forEach(function(chave) {
            if (String(chave || '').charAt(0) === '_') delete payload[chave];
          });

          try { console.log('[TROCAR] body:', JSON.stringify(payload)); } catch (_) {}

          try {
            if (!ofId) {
              try { alert('OF inválida (sem id).'); } catch (_) {}
              return;
            }
            if (!cliId) {
              try { alert('Selecione um cliente válido.'); } catch (_) {}
              return;
            }
            var r2 = await fetch('/api/ofs/' + encodeURIComponent(ofId), {
              method: 'PUT',
              headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
              body: JSON.stringify(payload)
            });
            var j2 = await r2.json().catch(function() { return null; });
            try { console.log('[TROCAR] resultado:', r2 && r2.status, JSON.stringify(j2)); } catch (_) {}
            if (r2.ok && j2 && j2.ok) {
              var vendSelect = body.querySelector('#com-of-vend-select');
              var vendNomeNovo = '';
              try {
                vendNomeNovo = vendSelect && vendSelect.options && vendSelect.selectedIndex >= 0
                  ? String(vendSelect.options[vendSelect.selectedIndex].text || '').trim()
                  : '';
              } catch (_) { vendNomeNovo = ''; }
              var novoSnapshot = _snapshotOfParaResumo({
                numero: (body.querySelector('#com-of-numero') || {}).value,
                cliente: (body.querySelector('#com-of-cli-busca') || {}).value,
                vendedor: vendNomeNovo,
                quantidade: qtd,
                valor_total: valorTotalCalc,
                comissao_pct: comPct,
                status: st,
                created_at: created,
                data_conclusao: conc,
                observacoes: obs
              });
              _mostrarResumoAlteracoes(originalSnapshot, novoSnapshot, function() {
                try { modal.style.display = 'none'; } catch (_) {}
              });
              try { if (typeof window.calcularComissoes === 'function') window.calcularComissoes(); } catch (_) {}
            } else {
              try { alert('Erro ao salvar: ' + String(j2 && (j2.error || j2.message) || r2.status || 'Falha')); } catch (_) {}
            }
          } catch (err) {
            try { console.error('[TROCAR] erro fetch:', err); } catch (_) {}
            try { alert('Erro de conexão ao salvar OF.'); } catch (_) {}
          }
        });
      }

      modal.style.display = 'flex';
    } catch (_) {}
  }

  try { window.__comAbrirModalOF = _abrirModalOF; } catch (_) {}

  function _bindTrocarClick() {
    try {
      if (window.__comTrocarBound) return;
      window.__comTrocarBound = true;
      document.addEventListener('click', function(e) {
        try {
          var btn = e && e.target && (e.target.closest ? e.target.closest('button[data-com-trocar]') : null);
          if (!btn) return;
          var id = String(btn.getAttribute('data-of-id') || '').trim();
          if (!id) return;
          try { e.preventDefault(); e.stopImmediatePropagation(); } catch (_) {}
          _abrirModalOF(id);
        } catch (_) {}
      }, true);
    } catch (_) {}
  }

  function _ensureExtras(json, mesNum, anoNum) {
    try {
      _ensureComissoesStyle();
      _ensurePeriodoSelects();
      _ensureBuscaUI();
      _bindTrocarClick();
    } catch (_) {}
  }

  function _forcarRenderComissoesPatch() {
    try {
      if (window._comissoesSqlData) {
        var ref = _getPeriodoSelecionado();
        try { _ensureVendedoresMap(); } catch (_) {}
        _renderTabelaVendedores(window._comissoesSqlData);
        _renderTabelaOFs(window._comissoesSqlData);
        _ocultarGraficoComissoes();
        _ensureExtras(window._comissoesSqlData, ref.mesNum, ref.anoNum);
      }
    } catch (_) {}
  }

  try {
    if (!window._patchComissoesDataSetterInstalled) {
      window._patchComissoesDataSetterInstalled = true;
      window.__comissoesDataInternal = _normalizarComissoesData(window._comissoesData);
      Object.defineProperty(window, '_comissoesData', {
        get: function() { return window.__comissoesDataInternal; },
        set: function(val) {
          window.__comissoesDataInternal = _normalizarComissoesData(val);
        },
        configurable: true
      });
    }
  } catch (_) {}

  function _naComissoesAgora() {
    try {
      var urlAtual = String(window.location.hash || '') + ' ' + String(document.title || '');
      var low = urlAtual.toLowerCase();
      if (low.indexOf('comiss') >= 0) return true;
    } catch (_) {}
    try {
      var sec = document.querySelector('#page-comissoes,[data-page=\"comissoes\"],.page-comissoes');
      if (sec && sec.offsetParent !== null) return true;
    } catch (_) {}
    try {
      var el = Array.from(document.querySelectorAll('*')).find(function(e) {
        return e && String(e.textContent || '').indexOf('Comissão por Vendedor') >= 0 && e.offsetParent !== null;
      });
      if (el) return true;
    } catch (_) {}
    return false;
  }

  function _acharPaginaComissoesPatch() {
    var pg = null;
    try { pg = _getPgComissoes(); } catch (_) { pg = null; }
    if (pg) return pg;
    try {
      var el = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, div, span, p, label, strong, b')).find(function(node) {
        return node && String(node.textContent || '').indexOf('Comissão por Vendedor') >= 0 && node.offsetParent !== null;
      });
      var pai = el ? el.parentElement : null;
      for (var i = 0; i < 8 && pai && pai !== document.body; i += 1) {
        if ((pai.offsetHeight || 0) > 200 && (pai.offsetWidth || 0) > 400) return pai;
        pai = pai.parentElement;
      }
    } catch (_) {}
    return null;
  }

  function _escHtmlCom(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _pctCom(v) {
    var n = Number(v || 0) || 0;
    return n;
  }

  if (typeof window._obterPercComissao !== 'function') {
    window._obterPercComissao = function(vendid) {
      if (!vendid) return 0;
      var v = String(vendid || '').toUpperCase().trim();
      if (!v) return 0;
      if (v.indexOf('MEIA') >= 0) return 0.5;
      if (v.indexOf('ELEOMAR') >= 0 || v.indexOf('CHEIA') >= 0 || v.indexOf('RONI') >= 0) return 1.0;
      return 1.0;
    };
  }

  function _comDataDetalhamento(of) {
    return String(
      of && (
        of.ent ||
        of.data_entrega ||
        of.dia ||
        of.data_pedido ||
        of.data ||
        of.data_conclusao ||
        of.created_at
      ) || ''
    ).trim();
  }

  function _obterPctComissaoSync(of, vendedorFallback) {
    var pct = _pctCom(of && (of.comissao_pct != null ? of.comissao_pct : (of.pct_comissao != null ? of.pct_comissao : of.comissao)));
    if (pct > 0) return pct;
    try {
      var vendidVal = String(
        of && (
          of.vendid ||
          of.vendedor_id ||
          of.vendId ||
          of.vend_id ||
          of.vendedor ||
          of.vendNome ||
          of.vendedor_nome
        ) || vendedorFallback || ''
      ).trim();
      var pctVendid = Number(window._obterPercComissao(vendidVal) || 0) || 0;
      if (pctVendid > 0) return pctVendid;
    } catch (_) {}
    try {
      var dataCom = window._comissoesSqlData;
      var lista = Array.isArray(dataCom && dataCom.vendedores) ? dataCom.vendedores : [];
      var vendId = String(of && (of.vendid || of.vendedor_id || of.vendId || of.vend_id || '') || '').trim().toLowerCase();
      var vendNome = String(
        of && (of._vendedor_resolvido || of._vendedor_nome || of.vendedor || of.vendedor_nome || of.vendNome)
        || vendedorFallback
        || ''
      ).trim().toLowerCase();
      var hit = null;
      if (vendId) {
        hit = lista.find(function(v) {
          return String(v && (v.id || v.vendid || v.vendedor_id || '') || '').trim().toLowerCase() === vendId;
        }) || null;
      }
      if (!hit && vendNome) {
        hit = lista.find(function(v) {
          return String(v && (v.nome || v.vendedor || v.vendedor_nome || '') || '').trim().toLowerCase() === vendNome;
        }) || null;
      }
      var pctLista = Number(hit && (hit.comissao_pct ?? hit.comissao ?? hit.comissaoPct) || 0) || 0;
      if (pctLista > 0) return pctLista;
    } catch (_) {}
    return 0;
  }

  function _fmtDataComDetalhamento(v) {
    if (!v) return '—';
    try { return new Date(v).toLocaleDateString('pt-BR'); } catch (_) { return '—'; }
  }

  function _normalizarOFComissao(of, vendedorFallback) {
    var qtd = Number(of && (of.quantidade != null ? of.quantidade : (of.qtd != null ? of.qtd : of.quant)) || 0) || 0;
    var valorTotal = Number(of && (of.valor_total != null ? of.valor_total : (of.total != null ? of.total : (of.valor != null ? of.valor : of.valor_venda))) || 0) || 0;
    var vendidVal = String(
      of && (
        of.vendid ||
        of.vendedor_id ||
        of.vendId ||
        of.vend_id ||
        of.vendedor ||
        of.vendNome ||
        of.vendedor_nome
      ) || vendedorFallback || ''
    ).trim();
    var pctRaw = _obterPctComissaoSync(of, vendedorFallback);
    var fator = (Number(pctRaw || 0) || 0) / 100;
    var comissaoValor = Number(
      of && (
        of.comissao_rs != null ? of.comissao_rs :
        (of.comissao_valor != null ? of.comissao_valor :
         (of.valor_comissao != null ? of.valor_comissao : null))
      )
    );
    if (!Number.isFinite(comissaoValor)) comissaoValor = Number((valorTotal * fator) || 0) || 0;
    return {
      raw: of || {},
      id: String(of && of.id || '').trim(),
      numero: String(of && (of.numero != null ? of.numero : (of.numero_of || of.num_of || of.of_num || of.of || of.id)) || '—').trim() || '—',
      cliente: String(of && (of.cliente || of.cliente_nome || of.clinome || of.cliNome) || '—').trim() || '—',
      vendedor: String(of && (of.vendedor || of.vendedor_nome || of.vendNome) || vendedorFallback || 'Sem vendedor').trim() || 'Sem vendedor',
      vendid: vendidVal,
      qtd: qtd,
      valor_total: valorTotal,
      preco_unit: Number(of && (of.preco ?? of.valor_unitario ?? of.vl_unit) || 0) || (qtd > 0 ? (valorTotal / qtd) : 0),
      comissao_pct: pctRaw,
      comissao_valor: comissaoValor,
      data: _comDataDetalhamento(of),
      status: String(of && of.status || 'Concluída').trim() || 'Concluída'
    };
  }

  function _renderBuscaOFComissaoCard(of) {
    var ofNorm = _normalizarOFComissao(of, _comBuscaVendedor(of) || '—');
    var concluida = _comStatusConcluida(of);
    var status = String(ofNorm && ofNorm.status || 'Pendente');
    var vendidVal = String(
      of && (
        of.vendid ||
        of.vendedor ||
        of.vendNome ||
        of.vendedor_nome ||
        ofNorm.vendid ||
        ofNorm.vendedor
      ) || ''
    ).trim();
    var percComissao = Number(window._obterPercComissao(vendidVal) || 0) || 0;
    var totalVal = parseFloat(of && (of.total != null ? of.total : (of.valor_total != null ? of.valor_total : ofNorm.valor_total)) || 0) || 0;
    var comissaoVal = totalVal * percComissao / 100;
    try {
      console.log('[DEBUG COMISSAO]', {
        vendid: of && of.vendid,
        vendedor: of && of.vendedor,
        total: of && of.total,
        perc: window._obterPercComissao((of && (of.vendid || of.vendedor)) || ''),
        comissao_calculada: (parseFloat(of && of.total) || 0) * window._obterPercComissao((of && (of.vendid || of.vendedor)) || '') / 100
      });
    } catch (_) {}
    return ''
      + '<div style="background:#1e293b;border:1px solid ' + (concluida ? '#166534' : '#92400e') + ';border-radius:8px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">'
      + '<div style="flex:1;min-width:200px">'
      + '<div style="color:#60a5fa;font-size:16px;font-weight:700">#' + _escHtmlCom(ofNorm.numero) + '</div>'
      + '<div style="color:#f1f5f9;font-size:14px;margin-top:4px">' + _escHtmlCom(ofNorm.cliente) + '</div>'
      + '<div style="color:#94a3b8;font-size:12px;margin-top:2px">Vendedor: ' + _escHtmlCom(ofNorm.vendedor) + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:20px;flex-wrap:wrap">'
      + '<div style="text-align:center"><div style="color:#64748b;font-size:11px;text-transform:uppercase">Qtd</div><div style="color:#f1f5f9;font-weight:600">' + String(ofNorm.qtd) + '</div></div>'
      + '<div style="text-align:center"><div style="color:#64748b;font-size:11px;text-transform:uppercase">Valor Total</div><div style="color:#f1f5f9;font-weight:600">' + _escHtmlCom(window._fmtRs(ofNorm.valor_total)) + '</div></div>'
      + '<div style="text-align:center"><div style="color:#64748b;font-size:11px;text-transform:uppercase">Preço Unit.</div><div style="color:#94a3b8">' + _escHtmlCom(window._fmtRs(ofNorm.preco_unit)) + '</div></div>'
      + '<div style="text-align:center"><div style="color:#64748b;font-size:11px;text-transform:uppercase">Comissão</div><div style="color:#22c55e;font-weight:600">' + _escHtmlCom(window._fmtRs(comissaoVal)) + '</div></div>'
      + '<div style="text-align:center"><div style="color:#64748b;font-size:11px;text-transform:uppercase">Data</div><div style="color:#94a3b8">' + _escHtmlCom(_fmtDataComDetalhamento(ofNorm.data)) + '</div></div>'
      + '</div>'
      + '<div style="display:flex;gap:8px;align-items:center">'
      + '<span style="background:' + (concluida ? '#166534' : '#92400e') + ';color:' + (concluida ? '#4ade80' : '#fbbf24') + ';padding:4px 10px;border-radius:4px;font-size:12px;white-space:nowrap">' + _escHtmlCom(status) + '</span>'
      + (concluida ? '' : '<button type="button" data-acao="concluir-of-comissao" data-of-id="' + _escHtmlCom(ofNorm.id) + '" style="background:#16a34a;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:12px;white-space:nowrap">✅ Concluir</button>')
      + '<button type="button" data-acao="editar-of-comissao" data-com-trocar="1" data-of-id="' + _escHtmlCom(ofNorm.id) + '" style="background:#2a5298;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:12px;white-space:nowrap">✏️ Editar</button>'
      + '</div>'
      + '</div>';
  }

  function _normalizarGruposComissoes(json) {
    var ofsBase = Array.isArray(json && json.ofs) ? json.ofs.slice() : [];
    var grupos = Array.isArray(json && json.grupos) ? json.grupos.slice() : [];
    if (!grupos.length && Array.isArray(json && json.vendedores)) {
      grupos = json.vendedores.map(function(v) {
        return {
          vendedor: v && (v.nome || v.vendedor || v.vendNome),
          total_vendas: Number(v && (v.total_vendas != null ? v.total_vendas : v.total) || 0) || 0,
          comissao_pct: v && v.comissao_pct,
          ofs: []
        };
      });
    }
    if (!grupos.length && ofsBase.length) {
      var mapa = Object.create(null);
      ofsBase.forEach(function(of) {
        var nome = String(of && (of.vendedor || of.vendedor_nome || of.vendNome) || 'Sem vendedor').trim() || 'Sem vendedor';
        if (!mapa[nome]) mapa[nome] = { vendedor: nome, total_vendas: 0, ofs: [] };
        mapa[nome].ofs.push(of);
        mapa[nome].total_vendas += Number(of && (of.valor_total != null ? of.valor_total : of.total) || 0) || 0;
      });
      grupos = Object.keys(mapa).map(function(nome) { return mapa[nome]; });
    }
    return grupos.map(function(g) {
      var nome = String(g && (g.vendedor || g.nome || g.vendedor_nome) || 'Sem vendedor').trim() || 'Sem vendedor';
      var ofsGrupo = Array.isArray(g && g.ofs) ? g.ofs.slice() : ofsBase.filter(function(of) {
        return String(of && (of.vendedor || of.vendedor_nome || of.vendNome) || 'Sem vendedor').trim() === nome;
      });
      var ofsNorm = ofsGrupo.map(function(of) { return _normalizarOFComissao(of, nome); });
      var totalVendas = Number(g && (g.total_vendas != null ? g.total_vendas : g.total) || 0) || ofsNorm.reduce(function(s, of) {
        return s + (Number(of.valor_total || 0) || 0);
      }, 0);
      return {
        vendedor: nome,
        total_vendas: totalVendas,
        ofs: ofsNorm,
        comissao_total: ofsNorm.reduce(function(s, of) { return s + (Number(of.comissao_valor || 0) || 0); }, 0)
      };
    });
  }

  function _renderizarBuscaOFs() {
    try {
      var detalhe = document.getElementById('_com_detalhe');
      if (!detalhe) return;
      var host = detalhe.querySelector('[data-com-search-host]');
      if (!host) return;
      if (document.getElementById('_com_busca')) return;
      var wrap = document.createElement('div');
      wrap.id = '_com_busca_wrap';
      wrap.style.cssText = 'display:flex;gap:8px;margin:12px 0';
      wrap.innerHTML =
        '<input id="_com_busca" type="text" placeholder="🔍 Buscar por nº da OF ou nome do cliente..." ' +
        'style="flex:1;padding:10px 14px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#f1f5f9;font-size:14px;outline:none" />' +
        '<button type="button" id="_com_btn_buscar" ' +
        'style="padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">Buscar</button>';
      host.appendChild(wrap);
      if (!document.getElementById('_com_busca_resultado')) {
        var res = document.createElement('div');
        res.id = '_com_busca_resultado';
        res.style.cssText = 'margin-bottom:16px';
        host.appendChild(res);
      }
    } catch (_) {}
  }

  function _comBuscaTokens(termo) {
    return Array.from(new Set(
      String(termo || '')
        .split(/[,\n;]+/)
        .map(function(t) { return String(t || '').trim(); })
        .filter(Boolean)
    ));
  }
  function _comBuscaNumero(of) {
    return String(of && (of.of || of.numero || of.of_num || of.of_numero || '') || '').trim();
  }
  function _comBuscaNumeroNorm(v) {
    return String(v || '').replace(/[^\d]/g, '');
  }
  function _comBuscaCliente(of) {
    return String(of && (of.clinome || of.cliNome || of.cliente_nome || of.cliente || '') || '').trim();
  }
  function _comBuscaVendedor(of) {
    try {
      var nome = String(of && (of._vendedor_resolvido || of.vendedor_nome || of.vendNome || of.vendedor || '') || '').trim();
      if (nome && nome !== '—') return nome;
      if (typeof _resolverVendedor === 'function') {
        nome = String(_resolverVendedor(of) || '').trim();
        if (nome) return nome;
      }
    } catch (_) {}
    return String(of && (of.vendedor_nome || of.vendNome || of.vendedor || '') || '').trim();
  }
  function _comStatusConcluida(of) {
    return String(of && of.status || '').toLowerCase().indexOf('conclu') >= 0;
  }
  async function _comAbrirConclusao(ofId) {
    var sid = String(ofId || '').trim();
    if (!sid) return;
    try {
      if (typeof window.concluirOFComBaixa === 'function') return await window.concluirOFComBaixa(sid);
    } catch (_) {}
    try {
      if (typeof window.abrirModalConclusao === 'function') return await window.abrirModalConclusao(sid);
    } catch (_) {}
    try {
      if (typeof window._abrirConclusao === 'function') return await window._abrirConclusao(sid);
    } catch (_) {}
    try {
      if (typeof window.abrirConclusaoOf === 'function') return await window.abrirConclusaoOf(sid);
    } catch (_) {}
    try {
      if (typeof window._abrirFluxoConclusaoOF === 'function') return await window._abrirFluxoConclusaoOF(sid);
    } catch (_) {}
    try {
      if (typeof document !== 'undefined' && typeof window.CustomEvent === 'function') {
        document.dispatchEvent(new CustomEvent('concluirOF', { detail: { id: sid } }));
      }
    } catch (_) {}
  }
  async function _comAbrirEdicao(ofId) {
    var sid = String(ofId || '').trim();
    if (!sid) return;
    try {
      if (typeof window.abrirEdicaoOF === 'function') return await window.abrirEdicaoOF(sid);
    } catch (_) {}
    try {
      if (typeof window._abrirEdicao === 'function') return await window._abrirEdicao(sid);
    } catch (_) {}
    try {
      if (typeof window.abrirModalEdicaoOF === 'function') return await window.abrirModalEdicaoOF(sid);
    } catch (_) {}
    try {
      if (typeof window._abrirModalEdicaoOF === 'function') return await window._abrirModalEdicaoOF(sid);
    } catch (_) {}
    try {
      if (typeof window.__comAbrirModalOF === 'function') return await window.__comAbrirModalOF(sid);
    } catch (_) {}
    try {
      if (typeof document !== 'undefined' && typeof window.CustomEvent === 'function') {
        document.dispatchEvent(new CustomEvent('editarOF', { detail: { id: sid } }));
      }
    } catch (_) {}
  }
  function _comBuscaMatch(of, termo) {
    var numeroRaw = _comBuscaNumero(of);
    var numeroNorm = _comBuscaNumeroNorm(numeroRaw);
    var cliente = _comBuscaCliente(of).toLowerCase();
    var vendedor = _comBuscaVendedor(of).toLowerCase();
    var termoTxt = String(termo || '').trim();
    var termoNorm = _comBuscaNumeroNorm(termoTxt);
    if (termoNorm) return numeroRaw.indexOf(termoTxt) >= 0 || numeroNorm.indexOf(termoNorm) >= 0;
    var low = termoTxt.toLowerCase();
    return cliente.indexOf(low) >= 0 || vendedor.indexOf(low) >= 0;
  }
  function _comBuscaDedup(lista) {
    var map = Object.create(null);
    return (Array.isArray(lista) ? lista : []).filter(function(of) {
      var key = String(of && of.id || '').trim() || (_comBuscaNumero(of) + '|' + _comBuscaCliente(of)).toLowerCase();
      if (!key || map[key]) return false;
      map[key] = true;
      return true;
    });
  }
  function _comEmpresaBuscaSelecionada() {
    try {
      var sels = [
        '#com-empresa', '#comissao-empresa', '#empresa-com', '#filtro-empresa', '#empresa-filtro',
        'select[name="empresa"]', 'select[name="empresa_id"]', '[data-com-empresa]'
      ];
      for (var i = 0; i < sels.length; i++) {
        var el = document.querySelector(sels[i]);
        if (!el) continue;
        var v = String(el.value || el.getAttribute('data-com-empresa') || '').trim();
        var low = v.toLowerCase();
        if (!v || low === 'todas' || low === 'todos' || low === 'all') return '';
        return v;
      }
    } catch (_) {}
    return '';
  }
  async function _comBuscarOFsRemotas(termos) {
    var token = '';
    try { token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim(); } catch (_) { token = ''; }
    var headers = token ? { Authorization: 'Bearer ' + token } : {};
    var sbClient = null;
    try { sbClient = window._supabase || window.supabase || null; } catch (_) { sbClient = null; }
    var empresaSel = _comEmpresaBuscaSelecionada();
    var jobs = (Array.isArray(termos) ? termos : []).map(async function(termo) {
      var termoTxt = String(termo || '').trim();
      if (!termoTxt) return [];
      var termoNum = _comBuscaNumeroNorm(termoTxt);
      try {
        if (sbClient && typeof sbClient.from === 'function') {
          var query = sbClient
            .from('ofs')
            .select('id, of, numero, of_num, clinome, cliente, cliente_nome, vendedor, vendedor_nome, vendNome, vendid, vendedor_id, vend_id, preco, valor_unitario, total, valor_total, valor_venda, qtd, quantidade, qtd_produzida, ent, dia, status, empresa_id, emp_id, cores_impressao, itens')
            .is('deleted_at', null)
            .limit(50);
          if (empresaSel) query = query.eq('empresa_id', empresaSel);
          if (termoNum) {
            query = query.or('of.eq.' + termoNum + ',numero.eq.' + termoNum + ',of_num.eq.' + termoNum);
          } else {
            var termoSafe = termoTxt.replace(/[%(),]/g, ' ').trim();
            query = query.or('clinome.ilike.%' + termoSafe + '%,cliente.ilike.%' + termoSafe + '%,cliente_nome.ilike.%' + termoSafe + '%');
          }
          var sbRes = await query;
          if (!sbRes.error && Array.isArray(sbRes.data) && sbRes.data.length) return sbRes.data;
        }
      } catch (_) {}
      try {
        var url = termoNum
          ? '/api/ofs/buscar?numero=' + encodeURIComponent(termoNum)
          : '/api/ofs/buscar?cliente=' + encodeURIComponent(termoTxt) + '&status=todos';
        var resp = await fetch(url, { headers: headers });
        var json = await resp.json().catch(function() { return null; });
        var data = Array.isArray(json && json.data) ? json.data : (Array.isArray(json) ? json : (json && json.id ? [json] : []));
        if (data.length) return data;
      } catch (_) {}
      try {
        var resp2 = await fetch('/api/ofs?incluir_excluidas=1&limit=300&offset=0&busca=' + encodeURIComponent(termoTxt), { headers: headers });
        var json2 = await resp2.json().catch(function() { return null; });
        return Array.isArray(json2 && json2.data) ? json2.data : (Array.isArray(json2) ? json2 : []);
      } catch (_) {
        return [];
      }
    });
    var packs = await Promise.all(jobs);
    return _comBuscaDedup([].concat.apply([], packs));
  }

  function _comBindSearchListeners() {
    try {
      if (!window._comListenersRegistrados) {
        window._comListenersRegistrados = true;
        window.__comBuscaInputHandler = function(e) {
          try {
            var v = String(e && e.target && e.target.value || '');
            if (!v.trim() && typeof window._buscarOFsComissao === 'function') window._buscarOFsComissao('');
          } catch (_) {}
        };
        window.__comBuscaKeyHandler = function(e) {
          try {
            if (e && e.key === 'Enter') {
              e.preventDefault();
              if (typeof window._buscarOFsComissao === 'function') window._buscarOFsComissao(String((e.target || {}).value || ''));
            }
          } catch (_) {}
        };
        window.__comBuscaClickHandler = function() {
          try {
            var v = String((document.getElementById('_com_busca') || {}).value || '');
            if (typeof window._buscarOFsComissao === 'function') window._buscarOFsComissao(v);
          } catch (_) {}
        };
      }
      var inp = document.getElementById('_com_busca');
      var btn = document.getElementById('_com_btn_buscar');
      if (window.__comBuscaInputRef && window.__comBuscaInputRef !== inp) {
        try { window.__comBuscaInputRef.removeEventListener('input', window.__comBuscaInputHandler); } catch (_) {}
        try { window.__comBuscaInputRef.removeEventListener('keydown', window.__comBuscaKeyHandler); } catch (_) {}
      }
      if (window.__comBuscaBtnRef && window.__comBuscaBtnRef !== btn) {
        try { window.__comBuscaBtnRef.removeEventListener('click', window.__comBuscaClickHandler); } catch (_) {}
      }
      if (inp && window.__comBuscaInputRef !== inp) {
        inp.addEventListener('input', window.__comBuscaInputHandler);
        inp.addEventListener('keydown', window.__comBuscaKeyHandler);
        window.__comBuscaInputRef = inp;
      }
      if (btn && window.__comBuscaBtnRef !== btn) {
        btn.addEventListener('click', window.__comBuscaClickHandler);
        window.__comBuscaBtnRef = btn;
      }
    } catch (_) {}
  }
  function _comBindActionDelegation() {
    try {
      if (window.__comActionDelegationBound) return;
      window.__comActionDelegationBound = true;
      document.addEventListener('click', function(e) {
        try {
          var btnConcluir = e && e.target && (e.target.closest ? e.target.closest('[data-acao="concluir-of-comissao"]') : null);
          if (btnConcluir) {
            try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
            var ofIdConc = String(btnConcluir.getAttribute('data-of-id') || btnConcluir.dataset.ofId || '').trim();
            _comAbrirConclusao(ofIdConc);
            return;
          }
          var btnEditar = e && e.target && (e.target.closest ? e.target.closest('[data-acao="editar-of-comissao"]') : null);
          if (btnEditar) {
            try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
            var ofIdEdit = String(btnEditar.getAttribute('data-of-id') || btnEditar.dataset.ofId || '').trim();
            _comAbrirEdicao(ofIdEdit);
            return;
          }
        } catch (_) {}
      }, true);
    } catch (_) {}
  }

  function _disconnectComissoesObserver() {
    try {
      if (window.__comMutationObserver && typeof window.__comMutationObserver.disconnect === 'function') {
        window.__comMutationObserver.disconnect();
      }
    } catch (_) {}
  }

  function _connectComissoesObserver() {
    try {
      if (window.__comMutationObserverConnected) return;
      var alvo = document.querySelector('#page-comissoes, [data-page="comissoes"], .page-comissoes');
      if (!alvo) return;
      if (!window.__comMutationObserver) {
        window.__comMutationObserver = new MutationObserver(function(mutations) {
          try {
            if (window._pausarObservers || window._comRodando || !_naComissoesAgora()) return;
            if (window.__comSuspenderObserverAte && Date.now() < window.__comSuspenderObserverAte) return;
            var mudou = (mutations || []).some(function(m) {
              return (m.addedNodes && m.addedNodes.length) || (m.removedNodes && m.removedNodes.length);
            });
            if (mudou) _agendarRenderComissoesPatch(180);
          } catch (_) {}
        });
      }
      window.__comMutationObserver.observe(alvo, { childList: true, subtree: true });
      window.__comMutationObserverConnected = true;
    } catch (_) {}
  }

  window._buscarOFsComissao = async function(termo) {
    termo = String(termo || '').trim();
    var resultDiv = document.getElementById('_com_busca_resultado');
    if (!resultDiv) return;
    if (!termo) {
      resultDiv.innerHTML = '';
      return;
    }
    resultDiv.innerHTML = '<p style="color:#94a3b8;padding:12px">Buscando...</p>';
    try {
      try { await _ensureVendedoresMap(); } catch (_) {}
      var termos = _comBuscaTokens(termo);
      var ofs = Array.isArray(window._comOfsData) ? window._comOfsData : [];
      var locais = ofs.filter(function(of) {
        return !termos.length || termos.some(function(t) { return _comBuscaMatch(of, t); });
      });
      var remotas = await _comBuscarOFsRemotas(termos);
      var encontradas = _comBuscaDedup(locais.concat(remotas));
      if (!encontradas.length) {
        resultDiv.innerHTML = '<p style="color:#f87171;padding:12px">Nenhuma OF encontrada para "' + _escHtmlCom(termo) + '".</p>';
        return;
      }
      var html = encontradas.map(function(of) { return _renderBuscaOFComissaoCard(of); }).join('');
      resultDiv.innerHTML =
        '<div style="color:#94a3b8;font-size:12px;margin-bottom:8px">' + String(encontradas.length) + ' resultado(s) para "' + _escHtmlCom(termo) + '":</div>'
        + html;
    } catch (e) {
      resultDiv.innerHTML = '<p style="color:#f87171;padding:12px">Erro na busca: ' + _escHtmlCom(e && e.message || e) + '</p>';
    }
  };

  window._filtrarComissaoOFs = window._buscarOFsComissao;

  async function _renderComissoesPatch() {
    if (window._comRodando) {
      try { console.log('[COM PATCH] já rodando, ignorando'); } catch (_) {}
      return;
    }
    window._comRodando = true;
    var _comTimeout = setTimeout(function() {
      window._comRodando = false;
      try { console.log('[COM PATCH] timeout de segurança: _comRodando liberado'); } catch (_) {}
    }, 10000);
    try {
      _ensureComissoesStyle();
      try { await _ensureVendedoresMap(); } catch (_) {}
      _comBindActionDelegation();
      _disconnectComissoesObserver();
      window.__comSuspenderObserverAte = Date.now() + 1500;
      window.__comEntradaTs = Date.now();
      _ensurePeriodoSelects();
      _bindTrocarClick();
      var paginaCom = _acharPaginaComissoesPatch();
      if (!paginaCom) {
        try { console.warn('[COM PATCH] container de comissões não encontrado'); } catch (_) {}
        clearTimeout(_comTimeout);
        window._comRodando = false;
        return;
      }
      try {
        var barra = null;
        var candidatos = Array.prototype.slice.call(paginaCom.querySelectorAll('div, section, header, form'));
        barra = candidatos.find(function(el) {
          try {
            if (!el || el.id === '_com_topo' || el.id === '_com_detalhe') return false;
            var txt = String(el.textContent || '').toLowerCase();
            if (txt.indexOf('calcular') < 0 && txt.indexOf('imprimir') < 0) return false;
            var temSelect = !!el.querySelector('select, input[type="month"], input[type="date"]');
            var temBtn = Array.prototype.slice.call(el.querySelectorAll('button')).some(function(b) {
              var t = String(b && b.textContent || '').toLowerCase();
              return t.indexOf('calcular') >= 0 || t.indexOf('imprimir') >= 0;
            });
            return temSelect && temBtn && (el.offsetHeight || 0) < 260;
          } catch (_) { return false; }
        }) || null;
        if (barra && !barra._comMovedToTop) barra._comMovedToTop = true;
      } catch (_) {}
      Array.prototype.slice.call(paginaCom.children || []).forEach(function(child) {
        try {
          if (!child || child.id === '_com_topo' || child.id === '_com_detalhe') return;
          var manterToolbar = !!(child.querySelector && child.querySelector('#com-mes, #com-ano, [name="mes-comissao"], [name="ano-comissao"], input[type="month"], button'));
          if (manterToolbar) return;
          child.style.display = 'none';
        } catch (_) {}
      });
      try {
        var legadoTopo = document.getElementById('_com_topo_v3');
        if (legadoTopo) legadoTopo.remove();
      } catch (_) {}

      var divTopo = document.getElementById('_com_topo');
      if (!divTopo) {
        divTopo = document.createElement('div');
        divTopo.id = '_com_topo';
        divTopo.style.cssText = 'padding:12px 16px 0;box-sizing:border-box;';
        paginaCom.insertBefore(divTopo, paginaCom.firstChild || null);
      }
      var filtrosWrap = null;
      try { filtrosWrap = divTopo.querySelector('#_com_filtros'); } catch (_) { filtrosWrap = null; }
      if (!filtrosWrap) {
        filtrosWrap = document.createElement('div');
        filtrosWrap.id = '_com_filtros';
        filtrosWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:4px 0 14px';
        divTopo.appendChild(filtrosWrap);
      }
      var conteudoWrap = null;
      try { conteudoWrap = divTopo.querySelector('#_com_topo_conteudo'); } catch (_) { conteudoWrap = null; }
      if (!conteudoWrap) {
        conteudoWrap = document.createElement('div');
        conteudoWrap.id = '_com_topo_conteudo';
        divTopo.appendChild(conteudoWrap);
      }

      var divDetalhe = document.getElementById('_com_detalhe');
      if (!divDetalhe) {
        divDetalhe = document.createElement('div');
        divDetalhe.id = '_com_detalhe';
        divDetalhe.style.cssText = 'padding:0 16px 24px;box-sizing:border-box;overflow-y:auto;max-height:72vh;pointer-events:auto;min-height:140px;';
        paginaCom.appendChild(divDetalhe);
      }

      try {
        var barra2 = null;
        try { barra2 = barra; } catch (_) { barra2 = null; }
        if (barra2 && barra2.parentElement && barra2.parentElement !== filtrosWrap) {
          filtrosWrap.insertBefore(barra2, filtrosWrap.firstChild || null);
          try { barra2.style.margin = '0'; } catch (_) {}
        }
      } catch (_) {}

      try {
        var topoBuscaAntigo = document.getElementById('com-busca-wrap') || document.getElementById('com-busca-of') || document.getElementById('com-busca-btn');
        if (topoBuscaAntigo) {
          var wrapAntigo = topoBuscaAntigo.closest ? topoBuscaAntigo.closest('#com-busca-wrap, #_com_busca_wrap') : null;
          if (wrapAntigo) wrapAntigo.remove();
          else if (topoBuscaAntigo.remove) topoBuscaAntigo.remove();
        }
      } catch (_) {}

      try { _comBindSearchListeners(); } catch (_) {}

      conteudoWrap.innerHTML = '<p style="color:#94a3b8;padding:20px 4px">[COM] Carregando comissões...</p>';
      divDetalhe.innerHTML = '';

      var ref = _getPeriodoSelecionado();
      var mes = String(ref.mesNum || '').trim() || String(new Date().getMonth() + 1);
      var ano = String(ref.anoNum || '').trim() || String(new Date().getFullYear());
      var token = '';
      try { token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || '').trim(); } catch (_) {}
      var resp = await fetch('/api/comissoes/relatorio?mes=' + encodeURIComponent(mes) + '&ano=' + encodeURIComponent(ano), {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      var data = await resp.json().catch(function() { return null; });
      if (!resp.ok || !data || data.ok === false) throw new Error((data && data.error) || ('HTTP ' + resp.status));

      var vendedores = Array.isArray(data && data.vendedores) ? data.vendedores : [];
      var todasOfsRaw = Array.isArray(data && data.ofs) ? data.ofs : [];
      window._comOfsData = todasOfsRaw;
      var totalGeral = Number(data && data.total_vendido || 0) || 0;
      var totalOFs = Number(data && data.total_ofs || 0) || 0;
      var totalComissoes = Number(data && data.total_comissao || 0) || 0;

      var grupos = (vendedores || []).map(function(v) {
        var id = String(v && v.id || '').trim();
        var idNorm = id.toLowerCase();
        var vendNome = String(v && v.nome || v && v.vendedor || '').trim() || 'Sem vendedor';
        var vendNomeNorm = vendNome.toLowerCase();
        var ofsVendedor = (todasOfsRaw || []).filter(function(of) {
          var vid = String(of && of.vendedor_id || '').trim().toLowerCase();
          if (idNorm && vid) return vid === idNorm;
          var vn = String(of && of.vendedor || '').trim().toLowerCase();
          return !!vendNomeNorm && vn === vendNomeNorm;
        });
        var ofsNorm = ofsVendedor.map(function(of) { return _normalizarOFComissao(of, vendNome); });
        return {
          id: id,
          vendedor: vendNome,
          comissao_pct: Number(v && v.comissao_pct || 0) || 0,
          total_vendas: Number(v && v.total || 0) || 0,
          comissao_rs: Number(v && v.comissao_rs || 0) || 0,
          comissao_total: Number(v && v.comissao_rs || 0) || 0,
          ofs_count: Number(v && v.ofs || 0) || 0,
          ofs: ofsNorm
        };
      });

      window._comissaoOFs = (todasOfsRaw || []).slice();
      window._comissoesSqlData = data;
      window._comissoesData = _normalizarComissoesData({
        totalGeral: totalGeral,
        totalComissao: totalComissoes,
        totalPedidos: totalOFs,
        vendedores: (vendedores || []).map(function(v) {
          return {
            nome: String(v && v.nome || '—'),
            total: Number(v && v.total || 0) || 0,
            ofs: Number(v && v.ofs || 0) || 0,
            comissao_rs: Number(v && v.comissao_rs || 0) || 0,
            comissao_pct: Number(v && v.comissao_pct || 0) || 0
          };
        })
      });
      try {
        var prev = _prevPeriodo(mes, ano);
        window.__comissoesPrevData = prev ? await _fetchComissoes(prev.mesNum, prev.anoNum) : null;
      } catch (_) { window.__comissoesPrevData = null; }

      var prevTotal = Number(window.__comissoesPrevData && (window.__comissoesPrevData.total_geral_vendas != null ? window.__comissoesPrevData.total_geral_vendas : window.__comissoesPrevData.total_vendido) || 0) || 0;
      var deltaTxt = '—';
      if (prevTotal > 0) {
        var deltaPct = ((totalGeral - prevTotal) / prevTotal) * 100;
        deltaTxt = (deltaPct >= 0 ? '↑ ' : '↓ ') + Math.abs(deltaPct).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
      }
      var ranking = grupos.slice().sort(function(a, b) { return Number(b.total_vendas || 0) - Number(a.total_vendas || 0); }).slice(0, 3);
      var rankingMax = Number(ranking[0] && ranking[0].total_vendas || 0) || 1;
      var coresVendedor = ['#1a3a5c', '#1a3a2c', '#3a1a3a', '#3a2a1a'];
      var _fmtBr = function(v) { return (Number(v || 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
      var _fmtRs = function(v) { return 'R$ ' + _fmtBr(v); };

      var htmlCards = ''
        + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;padding:4px 0 16px">'
        + '  <div style="background:#1e293b;border-radius:10px;padding:16px 20px"><div style="color:#64748b;font-size:12px;text-transform:uppercase">Total Vendido</div><div style="color:#f1f5f9;font-size:22px;font-weight:700">' + _escHtmlCom(_fmtRs(totalGeral)) + '</div></div>'
        + '  <div style="background:#1e293b;border-radius:10px;padding:16px 20px"><div style="color:#64748b;font-size:12px;text-transform:uppercase">OFs Concluídas</div><div style="color:#f1f5f9;font-size:22px;font-weight:700">' + String(totalOFs) + '</div></div>'
        + '  <div style="background:#1e293b;border-radius:10px;padding:16px 20px"><div style="color:#64748b;font-size:12px;text-transform:uppercase">Total Comissões</div><div style="color:#22c55e;font-size:22px;font-weight:700">' + _escHtmlCom(_fmtRs(totalComissoes)) + '</div></div>'
        + '  <div style="background:#1e293b;border-radius:10px;padding:16px 20px"><div style="color:#64748b;font-size:12px;text-transform:uppercase">Vendedores</div><div style="color:#f1f5f9;font-size:22px;font-weight:700">' + String((vendedores || []).length) + '</div><div style="color:#94a3b8;font-size:12px;margin-top:6px">vs mês anterior: ' + _escHtmlCom(deltaTxt) + '</div></div>'
        + '</div>';

      var medals = ['🥇', '🥈', '🥉'];
      var htmlRanking = ranking.length ? ''
        + '<div style="display:flex;gap:16px;flex-wrap:wrap;padding:0 0 16px">'
        + ranking.map(function(g, idx) {
          var pctBar = Math.max(4, Math.min(100, (Number(g.total_vendas || 0) / rankingMax) * 100));
          return ''
            + '<div style="flex:1 1 240px;min-width:240px;background:#111827;border:1px solid #2a3f5f;border-radius:12px;padding:14px 16px;color:#fff">'
            + '<div style="display:flex;justify-content:space-between;gap:12px;font-weight:700;font-size:14px;align-items:center"><div><span style="font-size:1.4em;margin-right:6px">' + medals[idx] + '</span><span style="font-size:16px;font-weight:800">' + _escHtmlCom(g.vendedor) + '</span></div><div>' + _escHtmlCom(_fmtRs(g.total_vendas)) + '</div></div>'
            + '<div style="height:8px;border-radius:999px;background:rgba(255,255,255,0.10);overflow:hidden;margin-top:10px"><div style="height:100%;width:' + pctBar.toFixed(0) + '%;background:#6366f1;border-radius:999px"></div></div>'
            + '<div style="margin-top:8px;color:#94a3b8;font-size:12px">' + String(g.ofs.length) + ' OFs · Comissão ' + _escHtmlCom(_fmtRs(g.comissao_total)) + '</div>'
            + '</div>';
        }).join('')
        + '</div>' : '';

      var htmlResumo = ''
        + '<div style="overflow:auto;border:1px solid #1e293b;border-radius:12px;background:#0f172a">'
        + '<table style="width:100%;border-collapse:collapse">'
        + '<thead><tr style="background:#111827;color:#64748b;font-size:12px;text-transform:uppercase">'
        + '<th style="padding:10px 12px;text-align:left">Vendedor</th>'
        + '<th style="padding:10px 12px;text-align:right">OFs</th>'
        + '<th style="padding:10px 12px;text-align:right">Valor Total</th>'
        + '<th style="padding:10px 12px;text-align:right">% Comissão</th>'
        + '<th style="padding:10px 12px;text-align:right">Comissão (R$)</th>'
        + '</tr></thead><tbody>'
        + (vendedores || []).map(function(v, i) {
          var pct = Number(v && v.comissao_pct || 0) || 0;
          return ''
            + '<tr style="background:' + coresVendedor[i % coresVendedor.length] + '">'
            + '<td style="padding:10px 12px;color:#f1f5f9;font-weight:600">' + _escHtmlCom(String(v && v.nome || '—')) + '</td>'
            + '<td style="padding:10px 12px;text-align:right;color:#cbd5e1">' + String(Number(v && v.ofs || 0) || 0) + '</td>'
            + '<td style="padding:10px 12px;text-align:right;color:#f1f5f9">' + _escHtmlCom(_fmtRs(Number(v && v.total || 0) || 0)) + '</td>'
            + '<td style="padding:10px 12px;text-align:right;color:#cbd5e1">' + _escHtmlCom(pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + '%</td>'
            + '<td style="padding:10px 12px;text-align:right;color:#22c55e;font-weight:700">' + _escHtmlCom(_fmtRs(Number(v && v.comissao_rs || 0) || 0)) + '</td>'
            + '</tr>';
        }).join('')
        + '</tbody></table></div>';

      conteudoWrap.innerHTML = htmlCards + htmlRanking + htmlResumo;

      var htmlDetalhe = '<div data-com-search-host="1"><h3 style="color:#f1f5f9;padding:12px 0 4px;margin-top:8px">📋 Detalhamento das OFs</h3></div>';
      htmlDetalhe += grupos.map(function(g, gi) {
        return ''
          + '<details data-vendedor="' + _escHtmlCom(g.vendedor) + '" open style="margin-top:16px;border:1px solid #1e293b;border-radius:10px;overflow:hidden;background:#0f172a">'
          + '<summary style="list-style:none;cursor:pointer;background:' + coresVendedor[gi % coresVendedor.length] + ';padding:10px 14px;color:#f8fafc;font-weight:700">'
          + '🔽 ' + _escHtmlCom(g.vendedor) + ' — ' + String(g.ofs.length) + ' OFs — Total: ' + _escHtmlCom(_fmtRs(g.total_vendas)) + ' — Comissão: ' + _escHtmlCom(_fmtRs(g.comissao_total))
          + '</summary>'
          + '<div style="overflow-x:auto">'
          + '<table style="width:100%;border-collapse:collapse;background:#0f172a">'
          + '<thead><tr style="background:#1e293b;color:#64748b;font-size:11px;text-transform:uppercase">'
          + '<th style="padding:8px 10px;text-align:left;white-space:nowrap"># OF</th>'
          + '<th style="padding:8px 10px;text-align:left;white-space:nowrap">Cliente</th>'
          + '<th style="padding:8px 10px;text-align:left;white-space:nowrap">Vendedor</th>'
          + '<th style="padding:8px 10px;text-align:right;white-space:nowrap">Qtd</th>'
          + '<th style="padding:8px 10px;text-align:right;white-space:nowrap">Valor Total</th>'
          + '<th style="padding:8px 10px;text-align:right;white-space:nowrap">Preço Unit.</th>'
          + '<th style="padding:8px 10px;text-align:right;white-space:nowrap">% Comissão</th>'
          + '<th style="padding:8px 10px;text-align:right;white-space:nowrap">Comissão (R$)</th>'
          + '<th style="padding:8px 10px;text-align:left;white-space:nowrap">Data</th>'
          + '<th style="padding:8px 10px;text-align:left;white-space:nowrap">Status</th>'
          + '<th style="padding:8px 10px;text-align:center;white-space:nowrap">Ações</th>'
          + '</tr></thead><tbody>'
          + g.ofs.map(function(of) {
            var searchTxt = [of.numero, of.cliente, of.vendedor].join(' ').toLowerCase();
            var dataStr = '—';
            try { dataStr = of.data ? new Date(of.data).toLocaleDateString('pt-BR') : '—'; } catch (_) { dataStr = '—'; }
            var concluida = _comStatusConcluida(of);
            var badgeBg = concluida ? '#166534' : '#92400e';
            var badgeFg = concluida ? '#4ade80' : '#fbbf24';
            return ''
              + '<tr data-of-row="1" data-search="' + _escHtmlCom(searchTxt) + '" data-of-numero="' + _escHtmlCom(of.numero) + '" data-of-cliente="' + _escHtmlCom(of.cliente) + '" data-of-status="' + _escHtmlCom(of.status) + '" data-of-id="' + _escHtmlCom(of.id) + '" style="border-bottom:1px solid #1e293b">'
              + '<td style="padding:7px 10px;color:#60a5fa">#' + _escHtmlCom(of.numero) + '</td>'
              + '<td style="padding:7px 10px;color:#f1f5f9">' + _escHtmlCom(of.cliente) + '</td>'
              + '<td style="padding:7px 10px;color:#94a3b8">' + _escHtmlCom(of.vendedor) + '</td>'
              + '<td style="padding:7px 10px;text-align:right;color:#94a3b8">' + String(of.qtd || 0) + '</td>'
              + '<td style="padding:7px 10px;text-align:right;color:#f1f5f9">' + _escHtmlCom(_fmtRs(of.valor_total)) + '</td>'
              + '<td style="padding:7px 10px;text-align:right;color:#94a3b8">' + _escHtmlCom(_fmtRs(of.preco_unit)) + '</td>'
              + '<td style="padding:7px 10px;text-align:right;color:#94a3b8">' + _escHtmlCom(of.comissao_pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + '%</td>'
              + '<td style="padding:7px 10px;text-align:right;color:#22c55e;font-weight:600">' + _escHtmlCom(_fmtRs(of.comissao_valor)) + '</td>'
              + '<td style="padding:7px 10px;color:#94a3b8">' + _escHtmlCom(dataStr) + '</td>'
              + '<td style="padding:7px 10px"><span style="background:' + badgeBg + ';color:' + badgeFg + ';padding:2px 8px;border-radius:4px;font-size:11px">' + _escHtmlCom(of.status) + '</span></td>'
              + '<td style="padding:7px 10px;text-align:center">'
              + (concluida ? '' : '<button type="button" data-acao="concluir-of-comissao" data-of-id="' + _escHtmlCom(of.id) + '" style="background:#16a34a;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:12px;margin-right:6px">✔ Concluir</button>')
              + '<button type="button" data-acao="editar-of-comissao" data-com-trocar="1" data-of-id="' + _escHtmlCom(of.id) + '" style="background:#2a5298;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:12px">✏️ Editar</button>'
              + '</td>'
              + '</tr>';
          }).join('')
          + '</tbody></table></div></details>';
      }).join('');
      divDetalhe.innerHTML = htmlDetalhe;
      _renderizarBuscaOFs();
      try { _comBindSearchListeners(); } catch (_) {}
      try {
        var v0 = '';
        try { v0 = String((document.getElementById('_com_busca') || {}).value || '').trim(); } catch (_) { v0 = ''; }
        if (v0) window._buscarOFsComissao && window._buscarOFsComissao(v0);
      } catch (_) {}
      try {
        var paginaCom2 = document.querySelector('#page-comissoes, [data-page="comissoes"], .page-comissoes');
        if (paginaCom2) {
          paginaCom2.style.overflow = 'visible';
          paginaCom2.style.height = 'auto';
          paginaCom2.style.maxHeight = 'none';
        }
        try { document.body.style.overflowY = 'auto'; } catch (_) {}
        ['_com_topo', '_com_detalhe'].forEach(function(id) {
          try {
            var el = document.getElementById(id);
            if (!el) return;
            if (id === '_com_detalhe') {
              el.style.overflowY = 'auto';
              el.style.overflowX = 'hidden';
              el.style.height = 'auto';
              el.style.maxHeight = '72vh';
              el.style.pointerEvents = 'auto';
            } else {
              el.style.overflow = 'visible';
              el.style.height = 'auto';
              el.style.maxHeight = 'none';
            }
          } catch (_) {}
        });
      } catch (_) {}
    } catch (e) {
      try { console.error('[COM PATCH] erro:', e); } catch (_) {}
      var topoErro = document.getElementById('_com_topo');
      if (topoErro) topoErro.innerHTML = '<p style="color:#f87171;padding:20px">Erro ao carregar comissões: ' + _escHtmlCom(e && e.message || e) + '</p>';
    } finally {
      clearTimeout(_comTimeout);
      window._comRodando = false;
      window.__comEntradaTs = 0;
      setTimeout(function() {
        try { _connectComissoesObserver(); } catch (_) {}
      }, 120);
      try { console.log('[COM PATCH] render finalizado, _comRodando liberado'); } catch (_) {}
    }
  }

  try { window._renderComissoesPatch = _renderComissoesPatch; } catch (_) {}
  try { window.__comissoesPatchCalcular = _renderComissoesPatch; } catch (_) {}
  try { window._executarCalculoComissoes = _renderComissoesPatch; } catch (_) {}

  function _agendarRenderComissoesPatch(delay) {
    try { clearTimeout(window.__comRenderAgendaTimer); } catch (_) {}
    window.__comRenderAgendaTimer = setTimeout(function() {
      try { if (!window._comRodando) _renderComissoesPatch(); } catch (_) {}
    }, Number(delay || 0) || 0);
  }

  function _bloquearRenderNativoComissoes() {
    var nomesParaBlocar = ['renderComissoes', 'calcularComissoes', 'renderizarComissoes', 'carregarComissoes'];
    nomesParaBlocar.forEach(function(nome) {
      try {
        if (typeof window[nome] === 'function' && !window[nome]._bloqueado) {
          var original = window[nome];
          var wrapped = function() {
            try { console.log('[COM PATCH] função nativa ' + nome + ' bloqueada - usando patch'); } catch (_) {}
            if (_naComissoesAgora()) _agendarRenderComissoesPatch(60);
          };
          wrapped._bloqueado = true;
          wrapped.__comOriginal = original;
          window['__comOriginal_' + nome] = original;
          window[nome] = wrapped;
          try { console.log('[COM PATCH] função ' + nome + ' bloqueada com sucesso'); } catch (_) {}
        }
      } catch (_) {}
    });
    try {
      window.gerarRelatorioComissoes = function() { if (_naComissoesAgora()) _agendarRenderComissoesPatch(60); };
      window.renderRelatorioComissoes = function() { if (_naComissoesAgora()) _agendarRenderComissoesPatch(60); };
    } catch (_) {}
  }

  function _rebindBtnCalcular() {
    try {
      Array.from(document.querySelectorAll('button')).forEach(function(btn) {
        if (!btn || btn._patchBoundComDef) return;
        var txt = String(btn.textContent || '').trim().toLowerCase();
        if (txt !== 'calcular' && txt.indexOf('calcular') < 0) return;
        btn._patchBoundComDef = true;
        btn.addEventListener('click', function(e) {
          try { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); } catch (_) {}
          window.__comUltimaExecucao = 0;
          window.__comEntradaTs = 0;
          window._comRodando = false;
          _agendarRenderComissoesPatch(120);
        }, true);
      });
    } catch (_) {}
  }

  function _instalarDetectorNavComissoes() {}

  function _instalarObsEnriquecerComissoes() {
    try {
      if (window.__comObsEnriquecerRef && typeof window.__comObsEnriquecerRef.disconnect === 'function') {
        window.__comObsEnriquecerRef.disconnect();
      }
    } catch (_) {}
    try { window.__comObsEnriquecerRef = null; } catch (_) {}
  }

  try {
    if (!window.__comPatchNavInstalled) {
      window.__comPatchNavInstalled = true;
      document.addEventListener('click', function(e) {
        try {
          var el = e && e.target && (e.target.closest ? e.target.closest('a, li, [data-page], button') : null);
          if (!el) return;
          var txt = String(el.textContent || '').trim().toLowerCase();
          var dataPage = String((el.getAttribute && el.getAttribute('data-page')) || '').toLowerCase();
          var href = String((el.getAttribute && el.getAttribute('href')) || '').toLowerCase();
          if (txt.indexOf('comiss') >= 0 || dataPage.indexOf('comiss') >= 0 || href.indexOf('comiss') >= 0) {
            try { console.log('[COM PATCH] clique em comissões detectado'); } catch (_) {}
            setTimeout(function() { if (!window._comRodando) _renderComissoesPatch(); }, 600);
          }
        } catch (_) {}
      }, true);
      window.addEventListener('hashchange', function() {
        try { if (_naComissoesAgora()) _agendarRenderComissoesPatch(400); } catch (_) {}
      });
      window.addEventListener('popstate', function() {
        try { if (_naComissoesAgora()) _agendarRenderComissoesPatch(400); } catch (_) {}
      });
    }
  } catch (_) {}

  try {
    var _goOrigComFix = window.go;
    if (_goOrigComFix && !window._patchGoComFixed) {
      window._patchGoComFixed = true;
      window.go = function(tela) {
        var args = Array.prototype.slice.call(arguments, 1);
        var r = _goOrigComFix.apply(this, [tela].concat(args));
        if (String(tela || '').toLowerCase().indexOf('comiss') >= 0) {
          setTimeout(_rebindBtnCalcular, 500);
          setTimeout(function() { _agendarRenderComissoesPatch(200); }, 600);
        }
        return r;
      };
    }
  } catch (_) {}

  try { _instalarObsEnriquecerComissoes(); } catch (_) {}
  try { _bloquearRenderNativoComissoes(); } catch (_) {}
  try { setTimeout(_bloquearRenderNativoComissoes, 500); } catch (_) {}
  try { setTimeout(_bloquearRenderNativoComissoes, 1500); } catch (_) {}
  try { setTimeout(_bloquearRenderNativoComissoes, 3000); } catch (_) {}
  try { [100, 500, 1000, 2000].forEach(function(t) { setTimeout(_rebindBtnCalcular, t); }); } catch (_) {}
  try { if (_naComissoesAgora()) _agendarRenderComissoesPatch(800); } catch (_) {}
})();

(function() {
  if (window.__patchCoresItensOF) return;
  window.__patchCoresItensOF = true;
  document.addEventListener('click', function(e) {
    try {
      var corBtn = e && e.target && (e.target.closest ? e.target.closest('[data-cor], .cor-btn, .color-tag, .btn-cor') : null);
      if (!corBtn) return;
      try {
        var gridItem = corBtn.closest ? corBtn.closest('[id^="seletorCoresItemOFRapida_"]') : null;
        if (gridItem && corBtn.classList && corBtn.classList.contains('btn-cor')) return;
      } catch (_) {}
      var itemContainer = corBtn.closest ? corBtn.closest('[data-item-idx], .item-adicional, .of-item') : null;
      if (!itemContainer) return;
      corBtn.classList.toggle('selected');
      corBtn.classList.toggle('active');
      corBtn.classList.toggle('selecionado');
      var isSelected = corBtn.classList.contains('selected') || corBtn.classList.contains('active');
      try { corBtn.style.opacity = isSelected ? '1' : '0.4'; } catch (_) {}
      try { corBtn.style.outline = isSelected ? '2px solid #fff' : 'none'; } catch (_) {}

      var corVal = '';
      try { corVal = String(corBtn.getAttribute('data-cor') || corBtn.dataset.cor || corBtn.textContent || '').trim(); } catch (_) { corVal = ''; }
      if (corVal) {
        var raw = String(itemContainer.dataset.coresSel || '[]');
        var arr = [];
        try { arr = JSON.parse(raw); } catch (_) { arr = []; }
        if (!Array.isArray(arr)) arr = [];
        var exists = arr.indexOf(corVal) >= 0;
        if (isSelected && !exists) arr.push(corVal);
        if (!isSelected && exists) arr = arr.filter(function(x) { return x !== corVal; });
        itemContainer.dataset.coresSel = JSON.stringify(arr);
        itemContainer.dataset.coresSelecionadas = JSON.stringify(arr);
        try {
          var hidden = itemContainer.querySelector('input[type=hidden][name*=\"cor\"], input[type=hidden][name*=\"cores\"]');
          if (hidden) hidden.value = itemContainer.dataset.coresSel;
        } catch (_) {}
      }

      var counter = itemContainer.querySelector ? itemContainer.querySelector('.label-cores-count, .cores-label, [data-cores-label], [class*=\"cores-sel\"], [data-cores-count], [id^=\"btnCoresLabelItemOFRapida_\"]') : null;
      var selecionadas = 0;
      try {
        selecionadas = itemContainer.querySelectorAll('[data-cor].selected, [data-cor].active, .cor-btn.selected, .cor-btn.active, .color-tag.selected, .color-tag.active, .btn-cor.selecionado, .btn-cor.selected, .btn-cor.active').length;
      } catch (_) { selecionadas = 0; }
      if (counter) {
        try { counter.textContent = String(selecionadas) + ' cores selecionadas'; } catch (_) {}
      }
    } catch (_) {}
  }, true);
})();

(function() {
  if (window.__patchNotifUnicaInstalled) return;
  window.__patchNotifUnicaInstalled = true;
  var _notifAtiva = false;

  function _instalar() {
    try {
      var orig = window._notificacaoOF;
      if (typeof orig !== 'function') return;
      if (orig.__patchNotifUnicaWrapped) return;
      var wrapped = function(msg, tipo) {
        if (_notifAtiva) return;
        _notifAtiva = true;
        setTimeout(function() { _notifAtiva = false; }, 4000);
        return orig.call(this, msg, tipo);
      };
      wrapped.__patchNotifUnicaWrapped = true;
      window._notificacaoOF = wrapped;
    } catch (_) {}
  }

  try { _instalar(); } catch (_) {}
  try { setTimeout(_instalar, 800); } catch (_) {}
  try { setInterval(_instalar, 2500); } catch (_) {}
})();

(function() {
  if (window.__patchBuscadorUniversalRecorrentes) return;
  window.__patchBuscadorUniversalRecorrentes = true;

  function esc(v) {
    try { return window.escH ? window.escH(v) : String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); } catch (_) { return String(v == null ? '' : v); }
  }
  function fmtMoney(v) {
    try { return 'R$\u00a0' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } catch (_) { return 'R$\u00a00,00'; }
  }
  function fmtVal(v) {
    if (v == null || v === '') return '—';
    if (typeof v === 'object') {
      try { return JSON.stringify(v, null, 2); } catch (_) { return String(v); }
    }
    return String(v);
  }
  function authHeaders() {
    try {
      if (typeof headersAuth === 'function') return headersAuth();
    } catch (_) {}
    var token = '';
    try { token = String(localStorage.getItem('token') || localStorage.getItem('access_token') || '').trim(); } catch (_) { token = ''; }
    return token ? { Authorization: 'Bearer ' + token } : {};
  }
  async function fetchJson(url) {
    try {
      var resp = await fetch(url, { headers: authHeaders() });
      return await resp.json().catch(function() { return null; });
    } catch (_) { return null; }
  }
  function debounce(fn, wait) {
    var t = null;
    return function() {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(null, args); }, wait);
    };
  }
  function statusBadge(st) {
    var raw = String(st || '').trim();
    var s = raw.toLowerCase();
    var bg = '#334155';
    var fg = '#e2e8f0';
    if (s.indexOf('conclu') >= 0 || s === 'pedido pronto') { raw = 'Concluído'; bg = '#064e3b'; fg = '#10b981'; }
    else if (s.indexOf('produ') >= 0) { raw = 'Em Produção'; bg = '#1e3a5f'; fg = '#60a5fa'; }
    else if (s.indexOf('aber') >= 0) { raw = 'Aberta'; bg = '#422006'; fg = '#f59e0b'; }
    else if (s.indexOf('canc') >= 0) { raw = 'Cancelada'; bg = '#4c0519'; fg = '#f43f5e'; }
    return '<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:' + bg + ';color:' + fg + '">' + esc(raw || '—') + '</span>';
  }
  function ensureStyle() {
    if (window._buscaUniversalStyleInjetado) return;
    window._buscaUniversalStyleInjetado = true;
    var style = document.createElement('style');
    style.textContent = ''
      + '#buscador-universal-modal{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center}'
      + '#buscador-universal-modal .bu-modal{width:85vw;max-width:1200px;height:82vh;background:#0f172a;border:1px solid #1e293b;border-radius:16px;box-shadow:0 25px 80px rgba(0,0,0,0.8);display:flex;flex-direction:column;overflow:hidden}'
      + '#buscador-universal-modal .bu-header{background:#0d1829;padding:20px 28px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;gap:12px}'
      + '#buscador-universal-modal .bu-title-h{font-size:18px;font-weight:700;color:#f1f5f9}'
      + '#buscador-universal-modal .bu-close{background:transparent;border:1px solid #334155;color:#94a3b8;border-radius:8px;padding:6px 14px;cursor:pointer}'
      + '#buscador-universal-modal .bu-close:hover{color:#fff;border-color:#60a5fa}'
      + '#buscador-universal-modal .bu-search{padding:20px 28px;display:flex;gap:12px;align-items:center}'
      + '#buscador-universal-modal .bu-search .bu-input{flex:1;background:#1e293b;border:2px solid #334155;border-radius:10px;padding:14px 18px;font-size:15px;color:#fff;outline:none}'
      + '#buscador-universal-modal .bu-search .bu-input:focus{border-color:#3b82f6}'
      + '#buscador-universal-modal .bu-search .bu-btn{background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:13px 24px;font-size:14px;font-weight:600;cursor:pointer}'
      + '#buscador-universal-modal .bu-search .bu-btn:hover{background:#2563eb}'
      + '#buscador-universal-modal .bu-chips{padding:0 28px 16px;display:flex;gap:10px;flex-wrap:wrap;border-bottom:1px solid #1e293b}'
      + '#buscador-universal-modal .bu-chip{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:6px 16px;font-size:12px;color:#94a3b8;cursor:pointer}'
      + '#buscador-universal-modal .bu-chip:hover{border-color:#60a5fa}'
      + '#buscador-universal-modal .bu-chip.is-active{background:#1d4ed8;border-color:#3b82f6;color:#fff}'
      + '#buscador-universal-modal .bu-results{padding:0 28px 28px;overflow-y:auto;height:calc(82vh - 200px)}'
      + '#buscador-universal-modal .bu-empty{display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;text-align:center}'
      + '#pcp-busca-universal{padding:0}'
      + '#pcp-busca-universal .bu-wrap{max-width:100%;margin:0 auto}'
      + '#pcp-busca-universal .bu-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}'
      + '#pcp-busca-universal .bu-loading{display:flex;align-items:center;gap:10px;color:#94a3b8;padding:20px 0}'
      + '#pcp-busca-universal .bu-spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.15);border-top-color:#60a5fa;border-radius:50%;animation:bu-spin .8s linear infinite}'
      + '#pcp-busca-universal .bu-group{margin:18px 0 4px 0}'
      + '#pcp-busca-universal .bu-title{font-size:12px;text-transform:uppercase;color:#64748b;letter-spacing:.5px;display:flex;align-items:center;gap:8px;margin:16px 0 8px}'
      + '#pcp-busca-universal .bu-title:after{content:\"\";flex:1;height:1px;background:#1e293b}'
      + '#pcp-busca-universal .bu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:10px}'
      + '#pcp-busca-universal .bu-card{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:10px;color:#fff;cursor:pointer;transition:all .15s;position:relative}'
      + '#pcp-busca-universal .bu-card:hover{border-color:#60a5fa;background:#1e3050;transform:translateY(-1px)}'
      + '#pcp-busca-universal .bu-ico{font-size:18px;line-height:1;min-width:26px;text-align:center}'
      + '#pcp-busca-universal .bu-main{font-size:13px;font-weight:700;color:#f8fafc}'
      + '#pcp-busca-universal .bu-sub{font-size:12px;color:#94a3b8;margin-top:2px}'
      + '#pcp-busca-modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:100001}'
      + '#pcp-busca-modal .m-box{width:min(980px,94vw);max-height:88vh;overflow:auto;background:#0b1220;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:16px;color:#fff}'
      + '#pcp-busca-modal .m-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}'
      + '#pcp-busca-modal .m-title{font-size:16px;font-weight:800}'
      + '#pcp-busca-modal .m-close{background:transparent;border:1px solid rgba(255,255,255,.16);color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer}'
      + '#pcp-busca-modal .m-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}'
      + '#pcp-busca-modal .m-item{background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px}'
      + '#pcp-busca-modal .m-label{font-size:11px;text-transform:uppercase;color:#94a3b8;letter-spacing:.5px;margin-bottom:4px}'
      + '#pcp-busca-modal .m-value{font-size:13px;color:#fff;white-space:pre-wrap;word-break:break-word}'
      + '#pcp-busca-modal .m-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}'
      + '#pcp-busca-modal .m-actions button{background:#1e293b;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:8px 12px;cursor:pointer}'
      + '@keyframes bu-spin{to{transform:rotate(360deg)}}'
      + '@media (max-width:780px){#pcp-busca-universal .bu-grid{grid-template-columns:1fr}#pcp-busca-modal .m-grid{grid-template-columns:1fr}#buscador-universal-modal .bu-modal{width:94vw;height:86vh}#buscador-universal-modal .bu-results{height:calc(86vh - 210px)}}';
    document.head.appendChild(style);
  }
  function ensureModal() {
    if (document.getElementById('pcp-busca-modal')) return;
    var modal = document.createElement('div');
    modal.id = 'pcp-busca-modal';
    modal.innerHTML = '<div class="m-box"><div class="m-head"><div class="m-title" id="pcp-busca-modal-title">Detalhes</div><button class="m-close" id="pcp-busca-modal-close">X</button></div><div id="pcp-busca-modal-body"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });
    modal.querySelector('#pcp-busca-modal-close').onclick = function() { modal.style.display = 'none'; };
  }
  function objectGridHtml(obj) {
    var keys = Object.keys(obj || {});
    return '<div class="m-grid">' + keys.map(function(k) {
      return '<div class="m-item"><div class="m-label">' + esc(k) + '</div><div class="m-value">' + esc(fmtVal(obj[k])) + '</div></div>';
    }).join('') + '</div>';
  }
  function fmtDateBr(v) {
    try {
      var s = String(v || '').trim();
      if (!s) return '—';
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split('-').reverse().join('/');
      var d = new Date(s);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
    } catch (_) {}
    return '—';
  }
  function parseItensBusca(v) {
    try {
      if (Array.isArray(v)) return v;
      if (!v) return [];
      if (typeof v === 'string') {
        var t = String(v).trim();
        if (!t) return [];
        var p = JSON.parse(t);
        return Array.isArray(p) ? p : [];
      }
      return [];
    } catch (_) { return []; }
  }
  function renderDetailsRows(rows) {
    return '<div class="m-grid">' + (rows || []).map(function(row) {
      return '<div class="m-item' + (row && row.full ? ' m-full' : '') + '"' + (row && row.full ? ' style="grid-column:1/-1"' : '') + '>'
        + '<div class="m-label">' + esc(row && row.label || '') + '</div>'
        + '<div class="m-value">' + (row && row.html ? String(row.value || '') : esc(row && row.value != null && row.value !== '' ? row.value : '—')) + '</div>'
        + '</div>';
    }).join('') + '</div>';
  }
  function pinTypeFromKind(kind, obj) {
    var k = String(kind || '').trim();
    if (k === 'ofs') return 'of';
    if (k === 'facas') return 'faca';
    if (k === 'cliches') return 'cliche';
    if (k === 'estoque') return String(obj && (obj.tipo_pin || obj.__pinTipo || obj.tipoItem || '') || '').trim() || 'material';
    return '';
  }
  async function openDetails(kind, item) {
    ensureModal();
    var modal = document.getElementById('pcp-busca-modal');
    var title = document.getElementById('pcp-busca-modal-title');
    var body = document.getElementById('pcp-busca-modal-body');
    if (!modal || !title || !body) return;

    var obj = item || {};
    var ttl = 'Detalhes';
    if (kind === 'clientes') {
      var cliDet = await fetchJson('/api/clientes/' + encodeURIComponent(String(item && item.id || '')));
      obj = (cliDet && (cliDet.data || cliDet)) || obj;
      ttl = 'Cliente: ' + String(obj.nome || obj.rs || item.nome || '—');
    } else if (kind === 'ofs') {
      var ofDet = await fetchJson('/api/ofs/' + encodeURIComponent(String(item && item.id || '')));
      obj = (ofDet && (ofDet.data || ofDet)) || obj;
      ttl = 'OF #' + String(obj && (obj.numero || item && item.numero || item && item.id) || '—');
    } else if (kind === 'facas') {
      ttl = 'Faca #' + String(item && (item.numero || item.codigo || item.nome) || '—');
    } else if (kind === 'cliches') {
      ttl = 'Clichê: ' + String(item && (item.codigo || item.nome) || '—');
    } else if (kind === 'estoque') {
      ttl = 'Estoque: ' + String(item && (item.nomenclatura || item.nome || item.fornecedor) || '—');
    }

    title.textContent = ttl;
    if (kind === 'ofs') {
      var itens = parseItensBusca(obj && obj.itens);
      var item0 = itens[0] || {};
      var cliId = String(obj && (obj.cli_id || obj.cliente_id || obj.cliId) || '').trim();
      var vendId = String(obj && (obj.vendedor_id || obj.vendId || obj.vendedorId) || '').trim();
      var cliNome = String(obj && (obj.cliente || obj.cliNome || obj.cliente_nome) || '').trim();
      var vendNome = String(obj && (obj.vendedor || obj.vendNome || obj.vendedor_nome) || '').trim();
      if (cliId) {
        var cliInfo = await fetchJson('/api/clientes/' + encodeURIComponent(cliId));
        var cliObj = (cliInfo && (cliInfo.data || cliInfo)) || null;
        if (cliObj) cliNome = String(cliObj.nome || cliObj.rs || cliNome || '').trim();
      }
      if (vendId) {
        var vendInfo = await fetchJson('/api/vendedores/' + encodeURIComponent(vendId));
        var vendObj = (vendInfo && (vendInfo.data || vendInfo)) || null;
        if (vendObj) vendNome = String(vendObj.nome || vendObj.nome_completo || vendObj.vendedor || vendNome || '').trim();
      }
      var qtdOf = obj ? (obj.quantidade ?? obj.qtd ?? item0.qtd) : item0.qtd;
      var vUnitOf = item0.vunit ?? item0.valor_unitario ?? (obj ? (obj.valor_unitario ?? obj.vl_unit) : null);
      var vTotalOf = obj ? (obj.valor_total ?? obj.valor_venda ?? obj.total ?? item0.valor_total ?? item0.total) : (item0.valor_total ?? item0.total);
      body.innerHTML = renderDetailsRows([
        { label: 'Nº OF', value: obj && (obj.numero || obj.of || '—') },
        { label: 'Status', value: statusBadge(obj && obj.status), html: true },
        { label: 'Cliente', value: cliNome || '—' },
        { label: 'Vendedor', value: vendNome || '—' },
        { label: 'Descrição', value: obj && (obj.descricao || obj.prodDesc || item0.desc || item0.descricao || item0.nome || '—') },
        { label: 'Quantidade', value: qtdOf != null && qtdOf !== '' ? qtdOf : '—' },
        { label: 'Valor Unitário', value: vUnitOf != null && vUnitOf !== '' ? fmtMoney(vUnitOf) : '—' },
        { label: 'Valor Total', value: vTotalOf != null && vTotalOf !== '' ? fmtMoney(vTotalOf) : '—' },
        { label: 'Máquina', value: obj && (obj.maq || item0.maquina_nome || item0.maquina || '—') },
        { label: 'Data de Entrega', value: fmtDateBr(obj && (obj.data_entrega || obj.ent)) },
        { label: 'Data de Produção', value: fmtDateBr(obj && obj.data_producao) },
        { label: 'Observações', value: obj && (obj.obs || obj.observacoes || '—'), full: true },
        { label: 'Urgente', value: (obj && (obj.urgente === true || obj.urg === true || String(obj.urgente || obj.urg || '').toLowerCase() === 'true' || String(obj.urgente || obj.urg || '') === '1')) ? 'Sim' : 'Não' }
      ]) + '<div class="m-actions" id="pcp-busca-modal-actions"></div>';
    } else if (kind === 'clientes') {
      body.innerHTML = renderDetailsRows([
        { label: 'Nome completo', value: obj && (obj.nome || obj.rs || '—'), full: true },
        { label: 'Documento', value: obj && (obj.cnpj || obj.cpf || obj.cnpj_cpf || obj.cnpjCpf || obj.documento || '—') },
        { label: 'Telefone', value: obj && (obj.telefone || obj.tel || '—') },
        { label: 'Email', value: obj && (obj.email || '—') },
        { label: 'Cidade / UF', value: [obj && (obj.cidade || ''), obj && (obj.uf || '')].filter(Boolean).join(' / ') || '—' },
        { label: 'Observações', value: obj && (obj.observacoes || obj.obs || '—'), full: true }
      ]) + '<div class="m-actions" id="pcp-busca-modal-actions"></div>';
    } else {
      body.innerHTML = objectGridHtml(obj) + '<div class="m-actions" id="pcp-busca-modal-actions"></div>';
    }
    var actions = document.getElementById('pcp-busca-modal-actions');

    if (kind === 'ofs') {
      var btnOf = document.createElement('button');
      btnOf.textContent = '✏️ Editar OF';
      btnOf.onclick = function() {
        modal.style.display = 'none';
        try {
          if (typeof window.__comAbrirModalOF === 'function') window.__comAbrirModalOF(String(item && item.id || ''));
        } catch (_) {}
      };
      actions.appendChild(btnOf);
      var btnCloneOf = document.createElement('button');
      btnCloneOf.textContent = '📋 Clonar';
      btnCloneOf.onclick = async function() {
        try {
          btnCloneOf.disabled = true;
          if (typeof window.__patchCloneOF === 'function') {
            await window.__patchCloneOF(String(obj && obj.id || item && item.id || ''), modal);
          }
        } catch (_) {
        } finally {
          btnCloneOf.disabled = false;
        }
      };
      actions.appendChild(btnCloneOf);
      var btnCloseOf = document.createElement('button');
      btnCloseOf.textContent = 'Fechar';
      btnCloseOf.onclick = function() { modal.style.display = 'none'; };
      actions.appendChild(btnCloseOf);
    }

    if (kind === 'clientes') {
      var btnCli = document.createElement('button');
      btnCli.textContent = 'Ver Painel do Cliente';
      btnCli.onclick = function() {
        var cliId = String(obj && obj.id || item && item.id || '').trim();
        if (!cliId) return;
        modal.style.display = 'none';
        try {
          var fnCli = window.abrirPainelCliente || window.verCliente || window.abrirCliente;
          if (typeof fnCli === 'function') fnCli(cliId);
        } catch (_) {}
      };
      actions.appendChild(btnCli);
      var btnCloseCli = document.createElement('button');
      btnCloseCli.textContent = 'Fechar';
      btnCloseCli.onclick = function() { modal.style.display = 'none'; };
      actions.appendChild(btnCloseCli);
    }
    if (actions && kind !== 'clientes' && kind !== 'ofs') {
      var btnClose = document.createElement('button');
      btnClose.textContent = 'Fechar';
      btnClose.onclick = function() { modal.style.display = 'none'; };
      actions.appendChild(btnClose);
    }
    modal.style.display = 'flex';
  }

  function uniqBy(list, keyFn) {
    var map = {};
    return (Array.isArray(list) ? list : []).filter(function(item) {
      var key = keyFn(item);
      if (!key) return true;
      if (map[key]) return false;
      map[key] = true;
      return true;
    });
  }
  function normalizeCliente(c) {
    return { kind: 'clientes', id: c.id, nome: c.nome || c.rs || '—', cidade: c.cidade || '', uf: c.uf || '', raw: c };
  }
  function normalizeOf(of) {
    return { kind: 'ofs', id: of.id, numero: of.numero || of.id, cliente: of.cliente || of.clinome || of.cliente_nome || of.cliNome || '—', valor_total: of.valor_total || of.total || 0, status: of.status || '', tipo_pin: 'of', raw: of };
  }
  function normalizeFaca(f) {
    return { kind: 'facas', id: f.id, codigo: f.codigo || f.numero || f.nome || '—', descricao: f.descricao || f.nome || '—', status: f.condicao || f.status || f.categoria || '—', tipo_pin: 'faca', raw: f };
  }
  function normalizeCliche(c) {
    return { kind: 'cliches', id: c.id, codigo: c.codigo || c.nome || '—', cliente: c.cliente || c.nome_cliente || '—', cores: c.cores || c.descricao || '—', tipo_pin: 'cliche', raw: c };
  }
  function normalizeEstoque(x) {
    return { kind: 'estoque', id: x.id || (x.nomenclatura || x.nome || x.fornecedor), nome: x.nomenclatura || x.nome || x.nome_uso || '—', quantidade: x.quantidade || x.quantidade_atual || 0, fornecedor: x.fornecedor || '—', tipo_pin: x && (x.tipo_pin || x.__pinTipo) || 'material', raw: x };
  }
  function activeCats() {
    var filter = String(window._buscaUniversalCategoria || 'todos');
    if (filter === 'todos') return ['clientes', 'ofs', 'facas', 'cliches', 'estoque'];
    return [filter];
  }
  async function runSearch(term, root) {
    term = String(term || '').trim();
    window._buscaUniversalTermo = term;
    var scope = root || document;
    var resultBox = scope.querySelector ? scope.querySelector('#busca-universal-results') : document.getElementById('busca-universal-results');
    if (!resultBox) return;
    if (!term || term.length < 3) {
      resultBox.innerHTML = '<div style="color:#94a3b8;padding:8px 2px">Digite ao menos 3 caracteres para buscar.</div>';
      return;
    }
    var key = String(window._buscaUniversalCategoria || 'todos') + '|' + term.toLowerCase();
    if (window._buscaUniversalLastKey === key) return;
    window._buscaUniversalLastKey = key;
    resultBox.innerHTML = '<div class="bu-loading"><div class="bu-spinner"></div><div>Buscando...</div></div>';

    var cats = activeCats();
    var jobs = [];
    if (cats.indexOf('clientes') >= 0) jobs.push(fetchJson('/api/clientes?search=' + encodeURIComponent(term) + '&limit=10').then(function(j) { return ['clientes', (j && (j.data || j.clientes)) || []]; }));
    if (cats.indexOf('ofs') >= 0) jobs.push(Promise.all([
      fetchJson('/api/ofs/buscar?numero=' + encodeURIComponent(term)),
      fetchJson('/api/ofs?search=' + encodeURIComponent(term) + '&limit=10')
    ]).then(function(arr) {
      var a = [];
      var j1 = arr[0];
      var j2 = arr[1];
      if (j1 && j1.ok) {
        if (Array.isArray(j1.data)) a = a.concat(j1.data);
        else if (j1.data) a.push(j1.data);
        else if (j1.id) a.push(j1);
      }
      a = a.concat((j2 && (j2.data || j2.rows)) || []);
      return ['ofs', uniqBy(a, function(x) { return String(x && (x.id || x.numero) || ''); })];
    }));
    if (cats.indexOf('facas') >= 0) jobs.push(fetchJson('/api/facas?search=' + encodeURIComponent(term) + '&limit=10').then(function(j) { return ['facas', (j && j.data) || []]; }));
    if (cats.indexOf('cliches') >= 0) jobs.push(fetchJson('/api/cliches?search=' + encodeURIComponent(term) + '&limit=10').then(function(j) { return ['cliches', (j && j.data) || []]; }));
    if (cats.indexOf('estoque') >= 0) jobs.push(Promise.all([
      fetchJson('/api/chapas?search=' + encodeURIComponent(term) + '&limit=10'),
      fetchJson('/api/materiais?search=' + encodeURIComponent(term) + '&limit=10')
    ]).then(function(arr) {
      var chapas = ((arr[0] && arr[0].data) || []).map(function(x) { return Object.assign({}, x || {}, { tipo_pin: 'chapa' }); });
      var materiais = ((arr[1] && arr[1].data) || []).map(function(x) { return Object.assign({}, x || {}, { tipo_pin: 'material' }); });
      return ['estoque', uniqBy(chapas.concat(materiais), function(x) { return String(x && (x.id || x.nomenclatura || x.nome) || ''); })];
    }));

    var settled = await Promise.all(jobs);
    var groups = { clientes: [], ofs: [], facas: [], cliches: [], estoque: [] };
    settled.forEach(function(pair) { groups[pair[0]] = Array.isArray(pair[1]) ? pair[1] : []; });

    groups.clientes = groups.clientes.map(normalizeCliente);
    groups.ofs = groups.ofs.map(normalizeOf);
    groups.facas = groups.facas.map(normalizeFaca);
    groups.cliches = groups.cliches.map(normalizeCliche);
    groups.estoque = groups.estoque.map(normalizeEstoque);

    var defs = [
      ['clientes', '🏢 CLIENTES'],
      ['ofs', '📋 OFs'],
      ['facas', '🔧 FACAS'],
      ['cliches', '🖨️ CLICHÊS'],
      ['estoque', '📦 ESTOQUE']
    ];
    var html = '';
    defs.forEach(function(def) {
      var cat = def[0];
      var label = def[1];
      var list = groups[cat] || [];
      if (!list.length) return;
      html += '<div class="bu-group"><div class="bu-title">' + label + ' (' + list.length + ')</div><div class="bu-grid">';
      html += list.map(function(item) {
        if (cat === 'clientes') {
          return '<div class="bu-card" data-kind="' + cat + '" data-id="' + esc(item.id) + '"><div class="bu-ico">🏢</div><div><div class="bu-main">' + esc(item.nome) + '</div><div class="bu-sub">' + esc([item.cidade, item.uf].filter(Boolean).join('/')) + '</div></div></div>';
        }
        if (cat === 'ofs') {
          return '<div class="bu-card" data-kind="' + cat + '" data-id="' + esc(item.id) + '"><div class="bu-ico">📋</div><div><div class="bu-main">#' + esc(item.numero) + ' · ' + esc(item.cliente) + '</div><div class="bu-sub">' + fmtMoney(item.valor_total) + ' · ' + statusBadge(item.status) + '</div></div></div>';
        }
        if (cat === 'facas') {
          return '<div class="bu-card" data-kind="' + cat + '" data-id="' + esc(item.id) + '"><div class="bu-ico">🔧</div><div><div class="bu-main">' + esc(item.codigo) + '</div><div class="bu-sub">' + esc(item.descricao) + ' · ' + esc(item.status) + '</div></div></div>';
        }
        if (cat === 'cliches') {
          return '<div class="bu-card" data-kind="' + cat + '" data-id="' + esc(item.id) + '"><div class="bu-ico">🖨️</div><div><div class="bu-main">' + esc(item.codigo) + ' · ' + esc(item.cliente) + '</div><div class="bu-sub">' + esc(item.cores) + '</div></div></div>';
        }
        return '<div class="bu-card" data-kind="' + cat + '" data-id="' + esc(item.id) + '"><div class="bu-ico">📦</div><div><div class="bu-main">' + esc(item.nome) + '</div><div class="bu-sub">' + esc(item.fornecedor) + ' · Qtd: ' + esc(item.quantidade) + '</div></div></div>';
      }).join('');
      html += '</div></div>';
    });
    if (!html) html = '<div style="color:#94a3b8;padding:8px 2px">Nenhum resultado encontrado para \'' + esc(term) + '\'</div>';
    resultBox.innerHTML = html;
    window.__buscaUniversalData = groups;
  }

  function bindUi(root) {
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    var input = root.querySelector('#busca-universal-input');
    var btn = root.querySelector('#busca-universal-btn');
    var debounced = debounce(function() { runSearch(input && input.value, root); }, 400);
    if (input) input.addEventListener('input', function() {
      var val = String(input.value || '').trim();
      if (val.length >= 3) debounced();
    });
    if (btn) btn.addEventListener('click', function() { runSearch(input && input.value, root); });
    if (input) input.addEventListener('keydown', function(e) {
      if (e && e.key === 'Enter') {
        try { e.preventDefault(); } catch (_) {}
        runSearch(input && input.value, root);
      }
    });
    Array.prototype.slice.call(root.querySelectorAll('.bu-chip')).forEach(function(chip) {
      chip.addEventListener('click', function() {
        Array.prototype.slice.call(root.querySelectorAll('.bu-chip')).forEach(function(c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        window._buscaUniversalCategoria = String(chip.getAttribute('data-cat') || 'todos');
        window._buscaUniversalLastKey = '';
        if (input && String(input.value || '').trim().length >= 3) runSearch(input.value, root);
      });
    });
    root.addEventListener('click', function(e) {
      var card = e && e.target && (e.target.closest ? e.target.closest('.bu-card') : null);
      if (!card) return;
      var kind = String(card.getAttribute('data-kind') || '');
      var id = String(card.getAttribute('data-id') || '');
      var list = (((window.__buscaUniversalData || {})[kind]) || []);
      var item = list.find(function(x) { return String(x && x.id || '') === id; });
      if (!item) return;
      openDetails(kind, item.raw || item);
    });
  }

  function sectionInnerHtml() {
    return ''
      + '<div id="pcp-busca-universal">'
      + '<div class="bu-wrap">'
      + '<div class="bu-search">'
      + '<input id="busca-universal-input" class="bu-input" placeholder="Digite cliente, nº OF, faca, clichê..." />'
      + '<button id="busca-universal-btn" class="bu-btn">Buscar</button>'
      + '</div>'
      + '<div class="bu-chips">'
      + '<button class="bu-chip is-active" data-cat="todos">Todos</button>'
      + '<button class="bu-chip" data-cat="clientes">Clientes</button>'
      + '<button class="bu-chip" data-cat="ofs">OFs</button>'
      + '<button class="bu-chip" data-cat="facas">Facas</button>'
      + '<button class="bu-chip" data-cat="cliches">Clichês</button>'
      + '<button class="bu-chip" data-cat="estoque">Estoque</button>'
      + '</div>'
      + '<div id="busca-universal-results" class="bu-results"><div class="bu-empty"><div><div style="font-size:40px;margin-bottom:10px">🔍</div><div>Digite para buscar em todo o sistema</div></div></div></div>'
      + '</div>'
      + '</div>';
  }

  function renderPaginaRecorrentesMensagem() {
    try {
      var page = document.getElementById('page-pedidos-recorrentes');
      if (!page) return;
      if (page.dataset.buscaUniversalMsg === '1') return;
      page.dataset.buscaUniversalMsg = '1';
      page.innerHTML = '<div style="padding:26px;color:#94a3b8;text-align:center">Use o 🔍 Buscador do Sistema no menu acima.</div>';
    } catch (_) {}
  }

  function fecharBuscadorUniversal() {
    try {
      var m = document.getElementById('buscador-universal-modal');
      if (m && m.parentNode) m.parentNode.removeChild(m);
    } catch (_) {}
  }

  function abrirBuscadorUniversal() {
    try {
      ensureStyle();
      ensureModal();
      if (document.getElementById('buscador-universal-modal')) return;
      var wrap = document.createElement('div');
      wrap.id = 'buscador-universal-modal';
      wrap.innerHTML = ''
        + '<div class="bu-modal" role="dialog" aria-modal="true">'
        + '<div class="bu-header"><div class="bu-title-h">🔍 Buscador do Sistema</div><button class="bu-close" id="bu-close-btn">✕ Fechar</button></div>'
        + '<div id="bu-inner"></div>'
        + '</div>';
      document.body.appendChild(wrap);
      var inner = wrap.querySelector('#bu-inner');
      inner.innerHTML = sectionInnerHtml();
      var root = inner.querySelector('#pcp-busca-universal');
      bindUi(root);

      var btnClose = wrap.querySelector('#bu-close-btn');
      if (btnClose) btnClose.onclick = function() { fecharBuscadorUniversal(); };
      wrap.addEventListener('click', function(e) { if (e.target === wrap) fecharBuscadorUniversal(); }, true);

      var inp = root ? root.querySelector('#busca-universal-input') : null;
      if (inp) {
        inp.focus();
        if (window._buscaUniversalTermo) {
          inp.value = window._buscaUniversalTermo;
          if (String(window._buscaUniversalTermo).trim().length >= 3) {
            window._buscaUniversalLastKey = '';
            runSearch(window._buscaUniversalTermo, root);
          }
        }
      }
    } catch (_) {}
  }

  try { window._abrirBuscadorUniversal = abrirBuscadorUniversal; } catch (_) {}

  function installHooks() {
    try {
      window._buscaUniversalCategoria = window._buscaUniversalCategoria || 'todos';
      window.renderPedidosRecorrentes = function() { renderPaginaRecorrentesMensagem(); };
      window.carregarPedidosRecorrentes = function() { renderPaginaRecorrentesMensagem(); };
      window.recorrentesRecarregar = function() { renderPaginaRecorrentesMensagem(); };
    } catch (_) {}
  }

  function renomearAba() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('button, a, li, span, div')).forEach(function(el) {
        try {
          if (!el || !el.textContent) return;
          if (String(el.textContent || '').trim() === 'Pedidos Recorrentes') {
            el.textContent = '🔍 Buscador do Sistema';
          }
        } catch (_) {}
      });
    } catch (_) {}
  }

  try {
    installHooks();
    renderPaginaRecorrentesMensagem();
    renomearAba();

    if (!window.__buscaUniversalRenameObs) {
      window.__buscaUniversalRenameObs = new MutationObserver(function() {
        if (window._pausarObservers) return;
        renomearAba();
      });
      window.__buscaUniversalRenameObs.observe(document.body, { childList: true, subtree: true });
    }

    if (!window.__buscaUniversalClickIntercept) {
      window.__buscaUniversalClickIntercept = true;
      document.addEventListener('click', function(e) {
        try {
          var el = e && e.target && (e.target.closest ? e.target.closest('button, a, li') : null);
          if (!el) return;
          var txt = String(el.textContent || '');
          if (txt.indexOf('Buscador do Sistema') >= 0 || String(el.id || '') === 'aba-pcp-recorrentes') {
            try { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); } catch (_) {}
            abrirBuscadorUniversal();
            return false;
          }
        } catch (_) {}
      }, true);
    }

    if (!window.__buscaUniversalEsc) {
      window.__buscaUniversalEsc = true;
      document.addEventListener('keydown', function(e) {
        try {
          if (e && e.key === 'Escape') fecharBuscadorUniversal();
        } catch (_) {}
      }, true);
    }

    setTimeout(renomearAba, 600);
    setTimeout(renderPaginaRecorrentesMensagem, 800);
  } catch (_) {}
})();
