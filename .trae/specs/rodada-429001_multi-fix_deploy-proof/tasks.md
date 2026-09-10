# Rodada 429001 — Implementation Queue (Tasks)
Ordem de execução estrita: G0 → G1 (todos 7 itens, diagnóstico SEM EDIÇÃO) → G2 (só ❌) → G3 (itens 8-13) → Deploy → Prova /api/version.

---

## FASE G0: Preparação e verificação deploy atual (0 edições)
### Task G0-1: Poll /api/version até PATCH >= 20260910428001
- **Status:** `pending`
- **Priority:** `high`
- **Depends On:** None
- **AC Parent:** AC-G0
- **Test Requirements:**
  - `rule` TR-G0-1.1: `fetch('/api/version').then(r=>r.json()).then(j=>j.patch >= '20260910428001')` retorna true (lexicográfico). Máximo 8 polls intervalados de 45s.
  - `rule` TR-G0-1.2: Console evaluate response JSON colado na evidência.
- **Completion Evidence:** JSON response /api/version completo.

---

## FASE G1: Diagnóstico Browser AO VIVO 7 itens antigos (0 edições de código!)
Objetivo: para cada item 1-7, marcar [FUNCIONA ✅ NÃO EDITAR] vs [QUEBRADO ❌ CORRIGIR]. NÃO EDITAR NADA AINDA.

### Task G1-1: Item 1 — Compra Papelão lista vazia?
- **Status:** `pending`
- **Priority:** `high`
- **AC Parent:** AC-G1-r1
- **Roteiro browser:**
  1. Menu → 💸 Compras / Compra Papelão
  2. Esperar 10s carregamento
  3. Snapshot tela + evaluate: `(()=>{ var r = typeof window._compraPapelaoStateRef==='function' ? window._compraPapelaoStateRef() : null; return {stats: typeof window._compraPapelaoStatsResumo==='function'?window._compraPapelaoStatsResumo():null, visibleArr: Array.isArray(window.compraVisibleRows)? window.compraVisibleRows.length : (typeof window.compraVisibleRows==='function'? (()=>{ try {var v=window.compraVisibleRows(); return {len: v?.length ?? -1, isArray: Array.isArray(v)};}catch(e){return {err:String(e).slice(0,80)};}})() : 'nao_existe_funcao'}, tabelaRows: document.querySelectorAll('[data-cmpx-row]').length, consoleMapErr: (()=>{try{return !!(window.__CMP_VISIBLE_MAP_ERR_FLAG);}catch(_){return false;}})()};})()`
- **TR:** `rule` evidência tem (1) snapshot; (2) output evaluate acima; (3) classificação FUNCIONA/QUEBRADO.

### Task G1-2: Item 2 — Passou pela Máquina trava/não grava?
- **Status:** `pending`
- **Priority:** `high`
- **AC Parent:** AC-G1-r2
- **Roteiro:**
  1. Tela Programação → 1 OF status "Em produção"
  2. Abrir detalhe, click botão "Passou pela Máquina"
  3. Snapshot + evaluate `typeof window.__passouMaquinaDepthGuard !== 'undefined' ? 'GUARD_OK' : 'NO_GUARD'` + console errors
- **TR:** Screenshot double-click, evaluate guard existe, console não tem RangeError.

### Task G1-3: Item 3 — Orçamentos Parâmetros não recalculam?
- **Status:** `pending`
- **Priority:** `high`
- **AC Parent:** AC-G1-r3
- **Roteiro:**
  1. 💵 Orçamentos → Novo ou Abrir existente
  2. Se pedir senha Financeiro → digitar 1234
  3. Localizar input Custo Merc % (id=`calc-cm` ou data-calc-field="cm") → evaluate `el.value = 55; el.dispatchEvent(new Event('input',{bubbles:true,cancelable:true}));`
  4. Aguardar 300ms → verificar display w3-display atualiza (compare texto antes/depois)
- **TR:** Antes/Depois valores display w3 + Frete Total. Classifica FUNCIONA se valores mudaram sem click em "Calcular".

### Task G1-4: Item 4 — Compra Papelão impressão vincos 9/9/9/9?
- **Status:** `pending`
- **Priority:** `medium`
- **AC Parent:** AC-G1-r4
- **Roteiro:**
  1. Compra Papelão → Abrir detalhe de 1 compra existente
  2. Clicar botão Imprimir / Preview Impressão (data-cmpx-print)
  3. evaluate `document.querySelectorAll('[data-cmpx-print-vincos]').length > 0 ? Array.from(document.querySelectorAll('[data-cmpx-print-vincos]')).map(e=>e.innerText).slice(0,5) : 'NENHUM_VINCO_TAG_ENCONTRADO'`
- **TR:** evaluate strings de vincos (contém "/" formato). Snapshot preview.

### Task G1-5: Item 5 — Amostras Pendentes trava "Carregando..."?
- **Status:** `pending`
- **Priority:** `high`
- **AC Parent:** AC-G1-r5
- **Roteiro:**
  1. Tela OFs por Máquina → rolar até painel Amostras Pendentes (canto direito)
  2. Esperar 20s → snapshot + evaluate `(()=>{try { return {rendering: window.__shellRef?._amostrasRendering ?? 'NO_SHELL', ts: (Date.now() - (window.__shellRef?._amostrasRenderingTimestamp ?? 0))/1000, html: document.querySelector('[data-amostras-semana-host]')?.innerText?.slice(0, 200) ?? 'NO_HOST'};}catch(e){return {err:String(e).slice(0,120)};}})()`
- **TR:** rendering=false ou mensagem "Tentar Novamente" visível, NÃO spinner infinito após 20s.

### Task G1-6: Item 6 — Cliente USE 7 "cliente inválido" resolvido?
- **Status:** `pending`
- **Priority:** `high`
- **AC Parent:** AC-G1-r6
- **Roteiro:**
  1. Menu → ⚡ OF Rápida (ou Programação → Nova OF Rápida)
  2. Campo Cliente → digitar **"USE 7"** (com espaço exato) → blur/tab
  3. Console evaluate (verificar sem toast "cliente inválido"): `Array.from(document.querySelectorAll('.toast, [data-toast-type="erro"]')).map(t => t.innerText).slice(0,5)` + buscarNaListaLocalPorNome evaluate simulado
  4. Repetir com "USE7" (sem espaço)
- **TR:** Nenhum toast "cliente inválido" para os dois termos; console debug (se enable) mostra similaridade >= 0.8 para USE 7.

### Task G1-7: Item 7 — Vendedor duplicado Conclusão OF resolvido?
- **Status:** `pending`
- **Priority:** `high`
- **AC Parent:** AC-G1-r7
- **Roteiro:**
  1. Programação → 1 OF qualquer → botão Concluir
  2. Modal abre → abrir dropdown Vendedor
  3. evaluate `(() => { var el = document.querySelector('#conclusao-vendedor'); if(!el) return {error:'sem select conclusao-vendedor'}; var opts = Array.from(el.options || []); var mapa = {}; opts.forEach(o => { var k = String(o.value || '').trim() + '||' + String(o.text || '').trim(); if(!mapa[k]) mapa[k]=0; mapa[k]++; }); var roniCount = opts.filter(o => /RONI MEIA VENDA/i.test(o.text || '')).length; var todosCount = opts.filter(o => (o.value || '').trim()).length; return {totalOptions: opts.length, vendedoresComValor: todosCount, roniMeiaVendaCount: roniCount, duplicatas: Object.entries(mapa).filter(([k,v]) => v>1)}; })()`
- **TR:** `roniCount === 1` e `duplicatas.length === 0` (0 duplicações de qualquer vendedor). Classifica FUNCIONA se count 1.

---

## FASE G2: Aplicar correções SÓ nos itens marcados QUEBRADO ❌
Cada item marcado QUEBRADO no G1 vira Task G2-i. Itens FUNCIONA ✅ → status `cancelled` explicitamente com motivo "Classificação G1: já funciona. NÃO EDITAR (aprovado heurística retrabalho zero)".

Exemplo skeleton para cada:
### Task G2-1: Corrigir Item 1 CMP Lista Vazia (se QUEBRADO)
- **Status:** `pending` → só passa para in_progress SE G1-1 = QUEBRADO.
- **Depends On:** G1-1 concluído.

(Skeletons para G2-2..G2-7 idem. Serão ativados apenas para ❌.)

---

## FASE G3: Implementar 6 itens NOVOS (8 a 13)
### Task G3-1: Item 8 — PCP Ordenação Correta (numérico DESC)
- **Status:** `pending`
- **Priority:** `high`
- **Depends On:** G2 todos finished/cancelled
- **AC Parent:** AC-8
- **Path:** patch.js L~36570 sort function padrão PCP (ver Confirmed Fact 8 last item: `EXTRA PCP sort TODAS applied VERIFIED: top10 = 3343..3334`) → **Caso G1 em outro browser confirmar 798 no topo: corrigir parse Number(str.replace(/\D/g,'')) no comparator.**
- **TR:** `rule` evaluate top10 = [3343, 3342, ...] numérico estrito.

### Task G3-2: Item 9 — Projeção Vendas (renderProjecaoVendas → window global + conectar API)
- **Status:** `pending`
- **Priority:** `high`
- **Depends On:** None (pode paralelizar se 2 pessoas)
- **AC Parent:** AC-6
- **Path:** patch.js (encontrar `rrOpenProjecaoVendasModal()` L3706 ss + criar função `window.renderProjecaoVendas = async function(ano){}` que chama backend).
- **Backend:** server.js `/api/relatorios/projecao-vendas` adicionar `?ano=YYYY` param (já existente).
- **TR:** evaluate typeof === 'function' + widget renderizado.

### Task G3-3: Item 10 — Resumo Anual + Todas Empresas (emp_id=ALL)
- **Status:** `pending`
- **Priority:** `high`
- **AC Parent:** AC-7
- **Path:** Frontend patch.js L3764 ss (adicionar select empresas) + Backend server.js L15765 (emp_id=ALL → [E1,E2,E3] hardcoded Fact6).
- **TR:** Network request ?emp_id=ALL → cards soma.

### Task G3-4: Item 11 — Mapa Clientes 3 problemas (CRÍTICO: vazamento modal + salvar + visual)
- **Status:** `pending`
- **Priority:** `high`
- **AC Parent:** AC-8 (Mapa Clientes)
- **Subtasks:** 11a Visual pep-wrap; 11b POST formulários salvar (estados/cidades/ramos); 11c Overlay fixed + close em window.go wrapper com MutationObserver.
- **TR:** evaluate vazamento = 0 modais após navegação.

### Task G3-5: Item 12 — Novo Relatório Perdas por Operador (endpoint + modal + menu)
- **Status:** `pending`
- **Priority:** `medium`
- **AC Parent:** AC-9
- **Path:** server.js cria `/api/relatorios/perdas-operador` + patch.js cria `rrOpenPerdasOperadorModal()` com mesmo overlay padrão.
- **TR:** GET 200 JSON + tabela renderiza.

### Task G3-6: Item 13 — Modernizar Operadores (ativo toggle + maq_principal + filtro conclusão + sugestão)
- **Status:** `pending`
- **Priority:** `medium`
- **AC Parent:** AC-10
- **TR:** ativo=false não aparece na lista do modal Conclusão; sugestão preenche por máquina.

---

## Deploy 429001
### Task DEPLOY-1: Finalização, verificações, bumps
- **Status:** `pending`
- **Depends On:** G2, G3 todos `completed`/`cancelled`
- **Description:**
  1. `node --check patch.js server.js sw.js mobile.js index.html`
  2. `git diff --stat` → se > 2000L → **PARAR** (decidir split commit, user autorizou QQ2 até 2500L de qualquer forma)
  3. Bumps 5x: 429001 timestamp = 20260910429001
  4. commit + push

## Prova de Deploy OBRIGATÓRIA (só rodar após push + tempo Railway)
### Task PROVA-1: Poll /api/version até PATCH === 20260910429001
- **Status:** `pending`
- **Depends On:** DEPLOY-1 pushado + pelo menos 4 min de espera
- **Poll loops:** 12 vezes, intervalo 30s.
- **Retorno final obrigatório:**
  ```
  ===== PROVA DEPLOY REAL Railway =====
  GET https://adm.italyembalagens.com.br/api/version
  Response: <JSON AQUI, 100% INTACTO>
  Checks:
    patch === 20260910429001: true/false
    git_sha (se houver) === <commit sha>: true/false
  ======================================
  ```
