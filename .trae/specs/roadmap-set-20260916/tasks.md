# Roadmap Multi-item Itália Embalagens 2026-09-16 — Implementation Plan

Prioridade de implementação RÍGIDA = Confirmed Fact28 + atualizados 16/09 com bugs críticos novos:
1. 🔴 Críticos primeiro (T1, T2, T3, T4, T5, T6, **T17 Jarvis, T18 CustoPorOF** — 8 itens, deploy 434133 → 434140)
2. 🟡 Médios (**T19 Imprimir Lanc**, T7 Sem Papelão, T8 RONI, T9 Fornecedores, T10 Mapa Cli, T11 Orç Pasta, T12 Params Comerciais, T13 Orc Deleted_at, T14 Histórico Máquina — 9 itens, deploy 434141 → 434149)
3. 🟢 Perdidos no revert (T15 CP/CR, T16 Comissões — 2 itens, deploy 434150 → 434152)
4. 🔍 **Investigação paralela (sem deploy por enquanto):** FR-20 93% erros Postgres 24h — esperando usuário colar texto dos erros mais frequentes.
5. ❌ Itens CANCELADOS por já OK: T22 Proj Vendas, T23 Resumo Anual Todas Emp, T24 Perdas Operador, T25 Modernizar Oper + Ordenação PCP, Comissões agrupar (cancelado, já padrão).

Cada task = 1 deploy separado com 5 bumps de versão, prova `/api/version`, smoke 6 + smoke extra RLS AC-20 se tabela RLS envolvida.

---

## Task 1: Container raiz — limpar patch-page-body ANTES de retornar (elimina stacking páginas)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - No `getMainPatchHost(pageKey, title)` (patch.js ~42160), adicionar logo após pegar/criar host: `const body = document.getElementById('patch-page-body'); if (body) { body.innerHTML = ''; }` ANTES de retornar body para o caller.
  - No `rrHost()` (patch.js ~652, mesma estratégia de container compartilhado para Central de Relatórios), mesma limpeza `innerHTML = ''` do content antes de retornar.
  - No wrapper `window.go()` extendido patch.js ~58083: se a página de destino NÃO é uma das dinâmicas (centralcustos, relatorios, operadores, compras-papelao, wireframe, etc) → forçar `document.getElementById('patch-page-host').style.display = 'none'` e limpar `patch-page-body.innerHTML = ''`.
  - Não tocar em index.html (só 2 timestamps no commit).
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `rule` TR-1.1: `node --check patch.js && node --check server.js` exit code 0
  - `rule` TR-1.2: Smoke 6 endpoints, nenhum status ≥ 500 (todos 401 esperado)
  - `rule` TR-1.3: Browser MCP navigate Central Custos → Relatórios → OFs Máquina → Central Custos, evaluate `Array.from(document.querySelectorAll('#patch-page-host, [id^="page-"]')).filter(e=>e.offsetParent!==null).length === 1` em cada passo
  - `rubric` TR-1.4: Evidência visual stacking; scale 1-5 (1=sinais visíveis página anterior, 3=nenhuma sobreposição, 5=nenhuma sobreposição + filhos patch-page-body === 0 quando entrada em página nova); threshold ≥ 4; evidence=snapshots 5 navegações.
- **Notes**: Causa raiz PROVADA search container raiz; NÃO precisa de instrumentação. Deploy 434133.

---

## Task 2: Amostras Pendentes — chamar renderAmostrasSemana + corrigir shell ids/fallbacks
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - No final de `renderOfmaqFinal()` (patch.js ~27685), após linha `renderRows(shell)`, adicionar linha: `renderAmostrasSemana(shell);`
  - No final de `updateToolbar()` (patch.js ~26587), adicionar `renderAmostrasSemana(shell);` (garante rerender amostras após mudar dia/maquina/filtro).
  - Em `bindShell()` (patch.js ~27390), adicionar no início: `shell.root.id = 'ofmaq-final-shell'; window.__ofmaqFinalShell = function(){ return shell; }; window.__shellRef = shell;`.
  - No tratamento de erro catch (linha ~26533 botão inline "Tentar Novamente"): trocar `'ofmaq-final-shell'` por `'ofmaq-final-root'` (id correto do root DOM).
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `rule` TR-2.1: `node --check patch.js` exit code 0.
  - `rule` TR-2.2: Smoke 6 endpoints sem 5xx.
  - `rule` TR-2.3: Browser MCP entrar em OFs por Máquina; wait 10s; evaluate `document.querySelector('[data-ofmaq-amostras-grid] table') !== null && document.querySelector('[data-ofmaq-amostras-count]').textContent.trim().indexOf('Carregando') < 0` → true.
  - `rubric` TR-2.4: Render tabela Amostras completa com rows; scale 1-5 (1=grid vazio placeholder, 3=tabela aparece mas sem linhas, 5=tabela com N≥3 linhas + count badge coerente); threshold ≥ 4; evidence=snapshot painel Amostras.
- **Notes**: Causa raiz PROVADA (falta chamada da função + ids errados). Deploy 434134.

---

## Task 3: Layout OFs por Máquina consistente (activeOfRow campos + fallbacks + colspan 15)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - `activeOfRow` (patch.js ~25729 return): adicionar 3 campos novos top-level: `sem_papel: !!(of?.sem_papel===true || of?.sem_papelao===true || ofRaw?.sem_papel===true || ofRaw?.sem_papelao===true)`, `papel_comprado: of?.papel_comprado ?? of?.papelComprado ?? ofRaw?.papel_comprado ?? ofRaw?.papelComprado ?? null`, `previsao_entrega_papel: of?.previsao_entrega_papel ?? of?.previsaoEntregaPapel ?? ofRaw?.previsao_entrega_papel ?? ofRaw?.previsaoEntregaPapel ?? ''`.
  - `rowHtml` (patch.js ~26611 IIFE Papel/Previsão): adicionar fallback `|| item?.ofRaw?.papel_comprado || item?.ofRaw?.papelComprado` e similar para previsao.
  - Pipeline ZERO renderRows (patch.js ~25218): trocar `colspan="11"` por `colspan="15"` no empty row.
  - Emergency view (patch.js ~27652/27655): trocar `colspan` de 11 para 15 no empty row.
  - `urgenciaTipo` (patch.js ~25709): considerar `urg === undefined` como mesma coisa que `urg === false` para estabilizar primeiro vs segundo render (não mudar botão cor duas vezes por OF).
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `rule` TR-3.1: `node --check patch.js` OK.
  - `rule` TR-3.2: Smoke 6 sem 5xx.
  - `rule` TR-3.3: Browser MCP evaluate OFs por Máquina após 2 renders: (a) thead th.length === 15. (b) tbody rows com colspan === 15. (c) Em 2 OFs com papel_comprado conhecido via ofRaw, coluna Papel mostra valor (não "— Aguardando").
  - `rule` TR-3.4: Botão Ações data-urgente hash consistente entre renders iguais para mesma OF.
  - `rubric` TR-3.5: Layout visual coerência; scale 1-5 (1=colunas quebradas/flicker, 3=todas colunas presentes mas botão alterna cor, 5=15 colunas estáveis + botão Ações cor estável + colspan sem desalinhamento); threshold ≥ 4; evidence=snapshot tabela OFs completa.
- **Notes**: Deploy 434135.

---

## Task 4: Compra de Papelão — impressão coluna vinco ajustada + teste salvar fluxo
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - `_compraPapelaoBuildCompraPrintHtmlFromPayload` (patch.js ~8333): ajustar `<colgroup>` largura vinco de 14% para 18%, adicionar `style="min-width:160px; white-space:normal;"` no `<td>` da célula de vincos; aumentar tamanho fonte V5+ de 11px para 12px + adicionar `padding-top:4px;`.
  - Reconfirmar fluxo salvar: criar compra teste (1 item com V1-V6), POST criar (200), GET por id, PUT editar, GET novamente → todos os 6 vincos permanecem intactos.
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `rule` TR-4.1: `node --check patch.js` e `node --check server.js` OK.
  - `rule` TR-4.2: Smoke 6 sem 5xx.
  - `rule` TR-4.3: Browser MCP criar compra nova teste via UI ou evaluate XHR POST /api/compras-chapas → buscar GET → re-abrir; assert item.vincos_lista contém 6 valores.
  - `rule` TR-4.4: HTML impressão buildado: `colgroup` coluna vinco largura% >= 17 e td vinco min-width >= 150.
  - `rubric` TR-4.5: Visual impressão; scale 1-5 (1=vincos truncados/ilegíveis, 3=aparecem mas pequenos, 5=vinco V1-V6 legíveis tamanho adequado); threshold ≥ 4; evidence=evaluate innerHTML col vinco.
- **Notes**: Deploy 434136.

---

## Task 5: Visão Geral parte 1/2 — separar custo_ofs de custo_papelao, remover dupla contagem + 7 centros de custo (FR-5h, AC-19, AC-21)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - `_ccustosCalcularCustoOfsPorCompetencia` (server.js ~35805-35818): HOJE `custo = _ccustosPickCustoOf` → `of.papelao = custo` e `of.custo_total = custo`. CORRIGIR: (a) manter `of.papelao = custo` (papelao por OF continua sendo `_ccustosPickCustoOf`). (b) `of.custo_total` = AGORA `custo_papelao + outros_custos` (onde outros_custos começa 0 por OF, pode crescer no futuro). Mesmo resultado por agora NÃO É MAIS o mesmo que papelao em nomenclatura para o próximo passo. (c) `ofs.total_custo` no return continua somando `of.custo_total`.
  - `_ccustosCalcularCustoPapelaoCompetencia` (server.js ~35836-35841 short-circuit): **REMover** o curto-circuito que soma `of.papelao` para retornar. SEMPRE consultar `chapas_estoque_v2` real no período com data_compra gte/lte competência. Query: somar `valor_total` de entradas no mês (mesmo padrão já existente fallback L35843-L35875). **Manter** fallback para o somatório `of.papelao` se query chapas falhar (retorna vazio OU erro Supabase).
  - `_ccustosCalcularVisaoGeralCompetencia` custoTotalMes (server.js ~36033): **HOJE** `ofs.total_custo + papelao + despesasFabrica` = dupla contagem. CORRIGIR para `ofs.total_custo + papelao_real + despesasFabrica` MAS com a garantia de que `ofs.total_custo` e `papelao_real` são conceitos DIFERENTES (tarefa acima isolou os dois) e SOMA-SE normal (não mais dupla contagem do mesmo valor numérico idêntico).
  - **NOVO (AC-19 — 7 centros de custo):** No handler `/api/central-custos/visao-geral` (L36534), onde hoje faz `Object.keys(atual.por_centro || {}).map(...)`, **SUBSTITUIR** por:
    ```js
    // LEFT JOIN com todos os centros de centrosMap para garantir 7 sempre
    const todosCentros = Array.from(centrosMap.values()).filter(c => c.ativo !== false);
    const gastosPorCentro = todosCentros.map(function(cc) {
      const valor = atual.por_centro && atual.por_centro[cc.id || cc.codigo || cc.nome] ? Number(atual.por_centro[cc.id || cc.codigo || cc.nome] || 0) : 0;
      return { id: cc.id || cc.codigo, nome: cc.nome, codigo: cc.codigo, valor: Number(isNaN(valor) ? 0 : valor) };
    });
    ```
    Com isso, mesmo centros SEM lançamento aparecem com R$0,00 — nunca são omitidos.
- **Acceptance Criteria Addressed**: AC-5a, AC-5b, AC-19 (7 centros R$0), AC-21 (≠custos)
- **Test Requirements**:
  - `rule` TR-5.1: `node --check server.js` OK.
  - `rule` TR-5.2: Smoke 6 sem 5xx. Smoke extra AC-20 (RLS bypass): `GET /api/central-custos/visao-geral 401 anônimo` — **SEM 403** (prova service_role bypass RLS).
  - `rule` TR-5.3: XHR autenticado `GET /api/central-custos/visao-geral?competencia=2026-09`: assert `cards.custo_ofs !== cards.custo_papelao` (NÃO idênticos em centavos) e diferença % ≥ 1% → validar AC-21.
  - `rule` TR-5.4: Formula custo_total_mes bate: `Math.abs(cards.custo_total_mes - (cards.custo_ofs + cards.custo_papelao + cards.despesas_fabrica)) < 0.05` (sem dupla contagem; nova soma coerente).
  - `rule` TR-5.5: **NOVO (AC-19)** No mesmo XHR acima → `gastosPorCentro.length === 7` (exatos 7 centros); cada elemento tem `.valor` numérico (pode ser 0); não faltam Produção/Comercial/Expedição/Estoque/Logística.
- **Notes**: Deploy 434137. Parte 2 adiciona novos cards Ganhos/Lucro e ajuste lançamentos.

---

## Task 6: Visão Geral parte 2/2 — cards Ganhos e Lucro, lançamentos somam lado certo
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Em `_ccustosCalcularVisaoGeralCompetencia`: calcular `lancs_ganhos = lancamentos_manuais.filter(l => l.tipo === 'ganho' || l.tipo === 'receita' || l.categoria === 'ganho').reduce(soma valor, 0)` e `lancs_despesas = lancamentos_manuais.filter(l => l.tipo === 'despesa' || l.tipo === 'custo' || l.categoria === 'despesa').reduce(soma valor, 0)` (para não duplicar já existente em `lancs.total`). Se `lancs_despesas > 0` não somar novamente em despesasFabrica se já foi incluído (garantir não dupla contagem com lancs.total já existente).
  - Novo campo `ganhos = receita_ofs + lancs_ganhos` (não só receita OFs).
  - Novo campo `lucro_mes = ganhos - (cards.custo_total_mes vindo da Task 5)` (ou `ganhos - (custo_ofs + custo_papelao + despesasFabrica + perdas_valor)` conforme fórmula correta da Task 5).
  - Montar `cards_5` (36042) para incluir `ganhos` e `lucro_mes`.
  - No frontend `renderCardsVisao()` (patch.js ~63115): **REORGANIZAR PARA 7 CARDS EXATOS** (definição do usuário, ordem fixa): (1) Despesas da Fábrica, (2) Ganhos do Mês, (3) Lucro do Mês, (4) Custo Papelão (REAL chapas_estoque_v2), (5) Custo das OFs, (6) Receita Bruta OFs, (7) Perdas. Todos os 7 cards com formatação de moeda R$ consistente, cores coerentes (verde=lucro, vermelho=despesa/perda).
  - Garantir que lançamento novo criado com tipo='despesa' some em Despesas, tipo='ganho' some em Ganhos, tipo='perda' some em Perdas (sem duplicar categoria = filtrar por tipo E categoria, um ou outro).
- **Acceptance Criteria Addressed**: AC-5c, AC-5d, AC-5g
- **Test Requirements**:
  - `rule` TR-6.1: `node --check server.js && node --check patch.js` OK.
  - `rule` TR-6.2: Smoke 6 sem 5xx. Smoke extra AC-20 RLS bypass OK (central-custos 401, sem 403).
  - `rule` TR-6.3: XHR visão geral: `cards.ganhos !== undefined && typeof cards.ganhos === 'number' && cards.ganhos > 0`.
  - `rule` TR-6.4: `cards.lucro_mes !== undefined && Math.abs(cards.lucro_mes - (cards.ganhos - cards.custo_total_mes)) < 0.05`.
  - `rubric` TR-6.5: Cards visíveis; scale 1-5 (1=só cards antigos aparecem, 3=ganhos/lucro aparecem mas sem formatação, 5=5-7 cards bem formatados com R$/unidade e valores coerentes); threshold ≥ 4; evidence=snapshot Central Visão Geral.
- **Notes**: Deploy 434138. Termina T1→T6 🔴 originais. Próximo 🔴: T17 Jarvis (434139), T18 CustoPorOF (434140).

---

## Task 17: Jarvis trava sistema — remover keepJarvisOpen + clique fora fecha + Esc fecha 🔴 (NOVO)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - **Patch.js 18678 — Causa raiz:** função `keepJarvisOpen(ev)` ligada em CAPTURE phase no `#assist-overlay` executa `ev.stopImmediatePropagation()` + `ev.preventDefault()` → cliques no backdrop escuro NÃO executam o onclick nativo (que fecharia o painel), e o `overlay.onclick` original é removido na função `bindJarvisOverlayGuard`. Resultado = overlay aberto, tela escura travada, SEM FORMA de fechar.
  - **Ação 1 — eliminar:** No topo de `bindJarvisOverlayGuard()` (L18691), **SAIR IMEDIATAMENTE return;** sem executar NADA (não liga keepJarvisOpen, não remove onclick, não captura cliques). Alternativa: comentar todo o corpo.
  - **Ação 2 — restaurar comportamento nativo:** se `overlay && overlay.onclick === null || overlay.onclick === undefined`, restaurar um onclick básico: `overlay.onclick = function(e) { if (e.target === overlay) { window._jarvisFechar && window._jarvisFechar(); } };` (clique FORA do painel = overlay puro → fecha).
  - **Ação 3 — Esc key:** document.addEventListener `keydown` onetime, guardado em `window.__jarvisEscBound`:
    ```js
    if (!window.__jarvisEscBound) {
      document.addEventListener('keydown', function(ev){
        if (ev.key === 'Escape') {
          const o = document.getElementById('assist-overlay');
          if (o && o.style.display === 'block') { window._jarvisFechar && window._jarvisFechar(); }
        }
      });
      window.__jarvisEscBound = true;
    }
    ```
  - **Ação 4 — botão X do painel:** garantir que `#assist-panel .jarvis-close, #assist-panel [data-action=close]` onclick chama `window._jarvisFechar()`; se não tiver, bindar no `wrapJarvisClose`.
- **Acceptance Criteria Addressed**: AC-16
- **Test Requirements**:
  - `rule` TR-17.1: `node --check patch.js` OK.
  - `rule` TR-17.2: Smoke 6 sem 5xx.
  - `rule` TR-17.3: Browser MCP qualquer página → clicar FAB abrir Jarvis → (a) evaluate `document.getElementById('assist-overlay').style.display === 'block'` (aberto). (b) Simulate click no `#assist-overlay` na área fora do painel → evaluate depois `display !== 'block'` (fechou). (c) Abrir de novo → teclar `Escape` via `dispatchEvent` → evaluate fechou. (d) Abrir → clicar no botão X → fechou. Todos 4 passos → AC16 satisfeito.
- **Notes**: Deploy 434139. Prioridade MUITO ALTA (sistema inutilizável enquanto Jarvis aberto). FR-16.

---

## Task 18: Custo por OF (aba 4 Central) não abre — logs tracer + limit 1000 + Promise.allSettled 🔴 (NOVO)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - **Backend server.js L16857 `/api/relatorios/custos`:**
    - Instrumentar com `console.log('[__CCUSTOS_TRACER_COF__]', { step:'start', range: range, t0: Date.now() })` antes de cada query.
    - Trocar `.limit(10000)` → `.limit(1000)` (aprendizado 🔴1, Railway batchSize ≤ 900). Se precisar de mais, implementar paginação com `offset += 1000` loop até < 1000 rows, e totalizadores acumular por chunk.
    - Ao fim do handler, logar: `console.log('[__CCUSTOS_TRACER_COF__]', { step:'done', rows: result.rows.length, retries_compat: compatRetriesCount || 0, total_ms: Date.now()-t0 })`.
  - **Frontend `loadCustoOFs` (patch.js L63011-63031):**
    - Trocar `Promise.all([..., loadCustoOFs(), ...])` → `Promise.allSettled([...])`. Se `loadCustoOFs` rejeitar: toast amarelo "Custo por OF carregando separadamente…" e render abas 1/2/3/5 normalmente, sem travar.
    - Adicionar `AbortController` timeout 25s: se request > 25s → abort + toast "Tempo limite excedido Custo por OF (25s). Usando cache."
- **Acceptance Criteria Addressed**: AC-17
- **Test Requirements**:
  - `rule` TR-18.1: `node --check server.js && node --check patch.js` OK.
  - `rule` TR-18.2: Smoke 6 sem 5xx.
  - `rule` TR-18.3: Browser MCP Central de Custos → esperar 20s após render inicial; evaluate `document.getElementById('custo-ofs-shell') !== null && (document.querySelectorAll('#custo-ofs-shell tbody tr').length >= 1 || document.querySelector('#custo-ofs-shell .vazio, #custo-ofs-shell .sem-resultados, #custo-ofs-shell [data-empty]') !== null)` → true.
  - `rule` TR-18.4: XHR `/api/relatorios/custos?data_inicio=2026-09-01&data_fim=2026-09-30` retorna status 200 em < 30s (não é 504/524 Railway timeout kill).
- **Notes**: Deploy 434140. Railway Statement Timeout ≈ 30s, por isso limite 1000 rows. FR-17.

---

## Task 19: Imprimir relatório Lançamentos (Aba 2 Central) — botão toolbar + rrOpenPrint handler 🟡 (NOVO)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - **Aba 2 render** `renderLancamentos()` (patch.js ~63165 toolbar): hoje tem 3 elementos (➕ Novo, 🔁 Recorrentes, input busca). **Inserir 4º botão** depois deles ou antes do input busca: `<button id="cc-btn-imprimir-lanc" class="rr-btn rr-btn-ghost">🖨️ Imprimir</button>`.
  - **bindEventos da Central (patch.js ~63800):** novo listener `document.getElementById('cc-btn-imprimir-lanc').addEventListener('click', function() { ... })` igual pattern já usado abas 1 e 4 (`cc-btn-imprimir-visao` L63865, `cc-btn-imprimir-ofs` L63820).
  - **Handler click:** pegar state `LANCAMENTOS_FILTERED` (array filtrado por busca, competência, tipo, centro) e montar `cfg = { title: 'Relatório de Lançamentos', subtitle: competencia, rows: [...], columns: [ {key:'data',label:'Data'}, {key:'competencia',label:'Competência'}, {key:'descricao',label:'Descrição'}, {key:'categoria',label:'Categoria'}, {key:'centro',label:'Centro'}, {key:'fornecedor',label:'Fornecedor'}, {key:'valor',label:'Valor R$'}, {key:'forma_pagamento',label:'Forma Pag'} ], totalizadores: { total_despesas, total_ganhos, total_perdas, saldo } }`; chamar `rrOpenPrint(cfg)` — igual abas 1 e 4, sem inventar nova infra.
- **Acceptance Criteria Addressed**: AC-18
- **Test Requirements**:
  - `rule` TR-19.1: `node --check patch.js` OK.
  - `rule` TR-19.2: Smoke 6 sem 5xx. Smoke extra RLS: GET /api/central-custos/visao-geral 401 sem 403.
  - `rule` TR-19.3: Browser MCP → abrir Central → aba 2 Lançamentos → evaluate `document.getElementById('cc-btn-imprimir-lanc') !== null && typeof window.__ccPrintLancHandler === 'function'` (handler existe).
  - `rubric` TR-19.4: Clique no botão → `window._buildStyledPrintHtml` foi chamado (mock temporário via evaluate `window._buildStyledPrintHtml = function(cfg){ return JSON.stringify(cfg); }` → click → pegar resultado e validar 8 colunas existem; scale 1-5; threshold ≥ 4.
- **Notes**: Deploy 434141. FR-18.

---

## Task 7: Botão Sem Papelão — 1 clique rápido (ELIMINAR modal de data completamente)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - `toggleSemPapelOf` (patch.js ~4899 early return): se `!of` → `toast('OF não encontrada para marcar Sem Papelão', 'erro')` e `console.error('[SEMPAPEL] of null', ofId, ofNum)`.
  - Quando `novo === true` (ligar Sem Papelão): **REMOVER COMPLETAMENTE** o bloco que abre `openAlterarDataPatched` e também qualquer `confirm()` ou `event.altKey`. Salvar DIRETO em 1 clique: `persistPatch(id, { sem_papel: true })`, SEM modal, SEM confirmação extra, SEM motivo. Toast de sucesso após save.
  - Quando `novo === false` (desligar Sem Papelão): manter atual (persistPatch sem_papel: false, funciona ok).
  - Unificar handlers: no index.html nativo `ofmaqConfirmarSemPapelao` chamar a mesma função `window.toggleSemPapelOf` do patch global para não ter 2 fluxos separados (os 4 pontos de entrada: card kanban, bottom sheet, modal nativo, modal zero-kanban → todos chamam a função global).
  - Garantir que `sem_papel = true` aparece em `data-sem-papel="1"` na row da tabela OFs por Máquina (depende de Task 3 activeOfRow; se Task 3 não deployado ainda, adicionar alias fallback nesta task também).
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-7.1: `node --check patch.js` OK.
  - `rule` TR-7.2: Smoke 6 sem 5xx.
  - `rule` TR-7.3: Browser MCP clique em Sem Papelão em OF válida → NÃO aparece modal nenhum → após 2s: fetch GET OF por id → `of.sem_papel === true`.
  - `rule` TR-7.4: Early return em OF inválida mostra toast de erro.
- **Notes**: Deploy 434139.

---

## Task 8: RONI MEIA VENDA dedupe global + normalização nome
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - `normalizeVend` (index.html ~34611): adicionar `nome_compare = (r.nome||'').replace(/[()]/g,'').replace(/\s+/g,' ').trim().toUpperCase()` para comparação dedupe (manter `r.nome` display original). Retornar já com `nome_compare` incluso.
  - Nos 2 pontos onde `VENDEDORES = data.map(normalizeVend)` (linhas ~34317 e ~35938): **DEPOIS** do map, aplicar dedupe por ID e por nome_compare:
    ```js
    var idsV={}, nomesV={};
    VENDEDORES = VENDEDORES.filter(function(v){
      if (idsV[v.id]) return false; idsV[v.id]=1;
      var nc = (v.nome_compare||String(v.nome||'').toUpperCase());
      if (nomesV[nc]) return false; nomesV[nc]=1;
      return true;
    });
    ```
  - Nos 4 renders de dropdown (PCP ~5709, Modal OF ~15677, Orçamentos ~4022, Agenda ~52683): aplicar mesmo `.filter()` antes do forEach/map se VENDEDORES não foi limpo em memória recente (ou confiar que a limpeza global acima já resolveu todos).
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `rule` TR-8.1: `node --check server.js && node --check patch.js` (se houver alteração patch) + validação sintaxe index.html via evaluate browser.
  - `rule` TR-8.2: Smoke 6 sem 5xx.
  - `rule` TR-8.3: Browser MCP 4 dropdowns avaliados: em cada, `options.filter(o => o.text.normalizeNome().includes('RONI')).length === 1` → 4/4 = true (onde normalizeNome = remove ( ) + upper + trim).
- **Notes**: Deploy 434142. Lembrar de editar APENAS 2 timestamps no index.html (commit tem que ter 5 bumps total).

---

## Task 9: Fornecedores categoria — 5 pontos (5 opções fixas ENUM/CHECK, Banco → Payload → Tabela → Add → Edit)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - (1) Banco SQL: no `_ensureFornecedoresSchema()` ou função similar de boot, adicionar DDL em transaction/sequência:
    ```
    ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Outros';
    ALTER TABLE public.fornecedores ADD CONSTRAINT IF NOT EXISTS fornecedores_categoria_check
      CHECK (categoria IN ('Papelão','Água','Luz','Internet','Outros')) NOT VALID;
    ```
    Se ALTER TABLE via RPC falhar em Railway (sem permissão), documentar SQL manual para rodar no Railway SQL Editor.
  - (2) Backend `fornecedoresPayload()` (server.js ~5101): adicionar **validação runtime** (independente do CHECK constraint) para nunca enviar valor inválido ao banco:
    ```js
    const CAT_VALIDAS = ['Papelão','Água','Luz','Internet','Outros'];
    if (b.categoria !== undefined) {
      const v = String(b.categoria||'').trim();
      out.categoria = CAT_VALIDAS.includes(v) ? v : 'Outros'; // fallback Outros nunca rejeita
    }
    ```
  - (3) Frontend erp-italy-v2 `fornecedores.js`: adicionar coluna no `columns` array: `{ key: 'categoria', label: 'Categoria' }`.
  - (4) Form onAdd: adicionar `<select>` campo categoria **COM APENAS 5 OPTIONS FIXAS** (Papelão, Água, Luz, Internet, Outros) sem opção de texto livre; selected default = 'Outros'; submit bind correto.
  - (5) Form onEdit: mesmo `<select>` com APENAS 5 options, com valor atual carregado do registro. NÃO permitir input texto livre em nenhum lugar.
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `rule` TR-9.1: `node --check server.js` + syntax check frontend fornecedores.js.
  - `rule` TR-9.2: Smoke 6 sem 5xx.
  - `rule` TR-9.3: Node smoke: POST fornecedor { nome: 'TesteCat9', categoria: 'Papelão' } → 200; POST { categoria: 'INVALIDA' } → backend salva como 'Outros' (fallback safety); PUT altera válido → 'Água'; GET retorna categoria='Água'.
  - `rubric` TR-9.4: UI Fornecedores; scale 1-5 (1=sem coluna, 3=coluna mas sem select em forms, 5=coluna visível + select add/edit 5 options funcionais); threshold ≥ 4; evidence=snapshot tela fornecedores.
- **Notes**: Deploy 434143.

---

## Task 10: Mapa Clientes — logs sem silêncio + botão +Cliente + clique marcador mini-edit
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - `_patchCliFormularioSelects` (patch.js): nos try/catch largos, adicionar `console.error('[MAPCLI]', err.message, err.stack)` no catch (não só throw vazio).
  - No header da página de mapa (index.html ~46526 container `#page-mapa-clientes`), adicionar botão "＋ Cliente" (style similar a outros botões header) que chama `abrirModalCliente()` nativo (sem sair da página).
  - Clique em marcador no mapa: além do popup atual com dados, adicionar botão "✏️ Editar" inline que abre `abrirEditarCliente(id)` (ou equivalente) direto, sem voltar para listagem.
  - Sincronia fallback: quando `_p11BindUfCidPair(selUf, selCid)` roda, selUf ainda não for `<select>` (ainda input texto), esperar 50ms por 3 tentativas via setTimeout antes de desistir.
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `rule` TR-10.1: `node --check patch.js` OK.
  - `rule` TR-10.2: Smoke 6 sem 5xx.
  - `rule` TR-10.3: Browser MCP abrir mapa → botão ＋Cliente visível querySelector(texto '+ Cliente') !== null.
  - `rule` TR-10.4: Console.log MAPCLI prefix aparece quando simular erro em modal (prova não silenciado).
  - `rubric` TR-10.5: Mapa UX; scale 1-5 (1=não há botão, 3=há botão mas sem edit inline, 5=botão +Cliente funcional + clique marcador tem botão Editar inline + erros logados); threshold ≥ 4; evidence=snapshot mapa.
- **Notes**: Deploy 434144.

---

## Task 11: Orçamentos pasta persiste — schema sempre aplicado + localStorage fallback
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - Schema SQL `_ensureOrcamentosPastasSchema()` (server.js ~19273): HOJE roda probe condicional; modificar para SEMPRE executar o SQL DDL (CREATE TABLE IF NOT EXISTS orcamentos_pastas + ADD COLUMN pasta_id) independentemente do resultado do probe — usando a mesma função SQL compat boot (mesmo padrão Task 9 ALTER TABLE).
  - Fallback localStorage frontend (patch.js ~11020 loadFolders): se API retornar `schema_orcamentos_pastas_missing` OU erro 5xx, carregar de `localStorage.getItem('orc_pastas_v1')`; salvar também no localStorage toda alteração de pasta além do POST/PUT/DELETE fetch.
  - Sync: em `loadFolders` NÃO ser bloqueado por `fin_ok !== '1'`. Apenas bloquear mutações (criar, editar, deletar pasta) se fin não ok.
  - Ao salvar um orçamento: no response handler confirmar `pasta_id` foi gravado correto e atualizar UI.
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `rule` TR-11.1: `node --check server.js && node --check patch.js` OK.
  - `rule` TR-11.2: Smoke 6 sem 5xx.
  - `rule` TR-11.3: Orçamento navegador → criar pasta "TesteRoadmap11" (POST 200) → vincular orçamento existente a pasta via UI → Ctrl+F5 recarga → pasta aparece e orçamento mostra pasta correta.
  - `rule` TR-11.4: localStorage tem cópia de pastas (fallback OK).
- **Notes**: Deploy 434145.

---

## Task 12: Parâmetros comerciais tempo real + campo DESCONTO
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - Injetados params patch.js (linha ~11725): TROCAR `try{calcRecalc()}catch(_){}` por `if (typeof calcRecalc === 'function') { calcRecalc(); } else { toast('Calculadora ainda carregando...', 'info'); setTimeout(calcRecalc, 200); }` (não silenciar erros; esperar e re-tentar).
  - Adicionar `onfocus` handler global que faz bind definitivo se calcRecalc não estava no momento do oninput.
  - Campo DESCONTO: em todas as 3 calculadoras (modal ORC simples, index.html avançada, scoped multi-blocos) adicionar `<input id="calc-desconto" type="number" min="0" max="100">` com `oninput="calcRecalc()"`.
  - Na função `calcPreco()` (index.html ~39301): após cálculo final de `precoVenda`, subtrair desconto%: `if (descontoPct > 0) precoVenda = precoVenda * ((100 - descontoPct) / 100);`; fazer o mesmo em `calcRecalcFromScope`.
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `rule` TR-12.1: `node --check patch.js` OK; syntax index.html valida (evaluate).
  - `rule` TR-12.2: Smoke 6 sem 5xx.
  - `rule` TR-12.3: Browser MCP: set calc-mg=10, ler valor. Depois set calc-desconto=5 → valor deve diminuir 5% do valor base.
  - `rule` TR-12.4: Nenhum try/catch silencioso removido → em situação de calcRecalc undefined, toast informativo aparece em vez de silêncio.
- **Notes**: Deploy 434146. Index.html: APENAS 2 timestamps inline (exceto se desconto campo adicionado em patch.js não em index).

---

## Task 13: orcamentos.deleted_at — criar coluna + filtrar na query
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - Criar coluna no boot schema: junto com Task 11 schema orçamentos (mesma função `_ensureOrcamentosPastasSchema` ou similar), adicionar: `ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;`
  - Incluir `deleted_at` nas `colunasCandidatas` GET /api/orcamentos (server.js ~17714).
  - Mover filtro de `deleted_at` de filtro memória (17767 `!row?.deleted_at`) para query Supabase `.is('deleted_at', null)` no `buildQuery()` (17719).
  - Verificar DELETE pasta orçamentos (18083) que seleciona deleted_at não causará mais erro.
- **Acceptance Criteria Addressed**: AC-12
- **Test Requirements**:
  - `rule` TR-13.1: `node --check server.js` OK.
  - `rule` TR-13.2: Smoke 6 sem 5xx.
  - `rule` TR-13.3: Prova: soft delete orçamento id conhecido (SQL set deleted_at); GET /api/orcamentos → id não aparece.
- **Notes**: Deploy 434147.

---

## Task 14: Histórico Passagens — resumo por máquina topo página
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - Criar função `renderHistoricoPassagensMaquina(rows)` (usar template patch.js:35365 agrupamento): para cada row em `passagens[]`, agrupar por `maquina_nome` ou `maquina`. Somar qtd caixas, contar passagens, somar tempo_min se existir, somar valor total.
  - Injetar container `<div class="historico-resumo-maquina">` no TOPO de `#page-historico-passagens` (ou DOM equivalente renderizado no `buscarHistoricoPassagens`), ANTES do loop de cards individuais.
  - Cada card tem: nome máquina, N passagens, total caixas, tempo (min), valor total; clique filtra histórico abaixo só para essa máquina (adiciona filtro query select máquina = X).
  - Se já existe alguma implementação stub, substituir por nova.
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-14.1: `node --check patch.js` OK.
  - `rule` TR-14.2: Smoke 6 sem 5xx.
  - `rule` TR-14.3: Browser MCP entrar Histórico Passagens, esperar 6s, evaluate: `document.querySelector('.historico-resumo-maquina') !== null && document.querySelectorAll('.historico-resumo-maquina .card, .historico-resumo-maquina .maq-row').length >= 4` (há ao menos 4 máquinas em 2245 rows).
  - `rule` TR-14.4: Clique em 1 card máquina → histórico atualiza, só passagens daquela máquina aparecem.
- **Notes**: Deploy 434148.

---

## Task 15: Contas Pagar/Receber — conectar backend + integrar ABAS 6 e 7 NA CENTRAL DE CUSTOS (Confirmed Fact16)
- **Status**: `pending`
- **Priority**: low
- **Depends On**: All 🔴 + 🟡 done
- **Description**:
  - **(A) Backend server.js**: implementar 11+ endpoints API conforme plano `.trae/documents/central_custos_434104_contas_pagar_receber_plan.md` (contém DDL tabelas e contrato endpoints):
    - GET /api/contas-pagar (filtros: status, categoria, vencimento gte/lte, empresa, busca, limit/offset)
    - GET /api/contas-pagar/:id
    - POST /api/contas-pagar
    - PUT /api/contas-pagar/:id
    - DELETE /api/contas-pagar/:id
    - POST /api/contas-pagar/:id/baixas (registrar pagamento)
    - GET /api/contas-pagar/:id/baixas
    - Mesmo 7 acima para /api/contas-receber (total 14, ou se baixas compatilhado 11).
  - Todos endpoints usam `authMiddleware` obrigatório + `empId` filter (Confirmed Fact6 UUID/sigla/E/E/E3 + flag `__sem_empresa__`). Paginação padrão limit=100 default.
  - **(B) Integração UI nas ABAS 6 e 7 da Central de Custos**:
    - Em `renderPageCentralCustos()` (patch.js ~64021), hoje existem abas 1.Visão Geral 2.Lançamentos 3.Centros 4.Custo por OF 5.Histórico (Confirmed Fact16). **ADICIONAR 2 NOVAS ABAS**: 6.Contas Pagar, 7.Contas Receber. A mesma estrutura de abas (botão tab switch, active toggle) usada nas 5 primeiras.
    - Conteúdo das abas 6/7: reaproveitar os renders já completos existentes em `index.html` (`renderContasPagar` L38417, `renderContasReceber` L38564, modais, tabelas, filtros, cards resumo — COMPLETOS hoje). **Encapsular** eles para rodar DENTRO do container da aba selecionada da Central (fora do container das páginas independentes originais). Reaproveitar as funções existentes sem duplicar código.
  - **(C) Bind frontend fetch para API**: Trocar em `salvarCP`, `salvarEdicaoCP`, `excluirCP`, `registrarPagamento` (e equivalentes CR) toda operação que hoje usa `CONTAS_PAGAR.push/splice` + `localStorage`: primeiro fazer `fetch()` para o novo endpoint do servidor; se sucesso → refletir no array memória e também no localStorage fallback; se erro de rede/5xx → usar só localStorage e avisar toast "Modo offline: sincronizar quando online".
- **Acceptance Criteria Addressed**: AC-14, Confirmed Fact16 (7 abas incluindo 6 e 7)
- **Test Requirements**:
  - `rule` TR-15.1: `node --check server.js && node --check patch.js` OK.
  - `rule` TR-15.2: Smoke 6 padrão + endpoints /api/contas-pagar e /api/contas-receber todos retornam 401 (anônimo) sem 5xx.
  - `rule` TR-15.3: XHR autenticado criar nova Conta Pagar → GET /api/contas-pagar → id aparece; navegar Central de Custos aba 6 → aparece na tabela; Ctrl+F5 recarga → id ainda existe (persistência via backend, não localStorage vazio).
  - `rule` TR-15.4: Estrutura abas Central: 7 abas (1..7) visíveis; aba 6 e 7 trocam de conteúdo corretamente ao clicar (sem stacking com abas 1..5).
- **Notes**: Potencial diff grande. Plano de 2 commits ANTES do diff: (1) Commit backend apenas endpoints (diff esperado ~300L). (2) Commit integração abas 6/7 na Central + bind frontend fetch (diff ~250L). Cada um com 5 bumps versão, prova /api/version, smoke 6. Se qualquer diff exceder 500L, PARAR e consultar usuário antes de commitar (Confirmed Fact3). Timestamp inicial 434149 (commit 1), 434150 (commit 2).

---

## Task 16: Comissões — injetar botão Imprimir real (substituir stub vazio)
- **Status**: `pending`
- **Priority**: low
- **Depends On**: None
- **Description**:
  - Substituir função stub `window.injetarBotaoImprimirComissoes = function(){};` (patch.js ~37624) por implementação real:
    ```js
    window.injetarBotaoImprimirComissoes = function() {
      var host = document.querySelector('#tela-comissoes, .comissoes-page, [data-page="comissoes"]') || (document.getElementById('page-comissoes') || document.querySelector('.comissoes-toolbar'));
      if (!host) return;
      var existing = document.querySelector('.btn-imprimir-comissoes');
      if (existing) return;
      var btn = document.createElement('button');
      btn.className = 'btn btn-imprimir-comissoes';
      btn.type = 'button';
      btn.textContent = '🖨️ Imprimir Relatório';
      btn.style.marginLeft = '10px';
      btn.onclick = function() { if (typeof window.gerarEImprimirComissoes === 'function') window.gerarEImprimirComissoes(); else toast('Engine impressão indisponível', 'erro'); };
      // injetar ao lado do botão Excel existente
      var ref = document.querySelector('.btn-exportar-excel-comissoes, .comissoes-exportar, [onclick*="_exportarComissoesExcel"]');
      if (ref && ref.parentNode) ref.parentNode.insertBefore(btn, ref.nextSibling); else host.appendChild(btn);
    };
    ```
  - Chamar `injetarBotaoImprimirComissoes()` ao final de `renderTelaComissoes()` (depois do stub atual que vazio).
- **Acceptance Criteria Addressed**: AC-15
- **Test Requirements**:
  - `rule` TR-16.1: `node --check patch.js` OK.
  - `rule` TR-16.2: Smoke 6 sem 5xx.
  - `rule` TR-16.3: Navegar tela Comissões; evaluate `document.querySelector('.btn-imprimir-comissoes') !== null` → true; clique via evaluate dispara `window.gerarEImprimirComissoes` (mock com console.log para prova).
- **Notes**: Deploy 434151. Menor task, diff esperado < 40 linhas. Última task (por enquanto).

---

## 🔍 Investigação Paralela (FR-20 — SEM DEPLOY POR ENQUANTO, sem deploy separado)
- **Status**: `pending` (aguardando input usuário)
- **Impacto potencial**: 1998 erros / 2142 requisições = 93% de falha no Postgres em 24h. Causa raiz compartilhada PODE corrigir 3-8 bugs de uma só vez.
- **Dependência**: Usuário colar texto das 3-5 mensagens de erro MAIS FREQUENTES no painel:
  - 1. Abrir **Supabase Dashboard → Italy Embalagens → Logs → Postgres Logs**
  - 2. Filtro **Level = Error** (só erros)
  - 3. Ordenar por Count (mais frequentes primeiro)
  - 4. Colar o texto cru das 3-5 mensagens mais repetidas aqui no chat
- **Ação imediata após receber texto**:
  - (a) Classificar tipo (schema_missing / coluna_missing / constraint_check / rls_permission_denied / timeout / deadlock).
  - (b) Mapear quais tasks existentes já cobrem o erro (ex: se `deleted_at does not exist` 400x → resolve na T13; se `categoria_check constraint violada` → resolve na T9; etc).
  - (c) Se houver causa NÃO COBERTA por nenhuma task existente → criar T20+ nova e inserir na fila antes de T15 CP/CR.

---

## ❌ Itens CANCELADOS (já implementados, search comprovado — NENHUMA AÇÃO NECESSÁRIA)
| Item Original | Status | Motivo cancelamento |
|---|---|---|
| Relatório de Projeção de Vendas | ✅ Já OK | Endpoint + tela modal completa existe (patch.js L29504), funcional |
| Resumo Anual Todas as Empresas | ✅ Já OK | backend soma 3 UUIDs emp_id=ALL, frontend select ALL option já existe (L3911) |
| Relatório de Perdas por Operador | ✅ Já OK | Endpoint L16323 + tela ranking L3765 completo |
| Modernizar Operadores | ✅ Já OK | Tela nova toggle ativo + máquina principal + sugestão automática (L62336) |
| Ordenação da PCP/Programação | ✅ Já OK | sort asc/desc em headers state.ofsSort (L63299-L63300) |
| Comissões agrupar por Cliente | ✅ Já OK | modo padrão já agrupa por cliente; só falta botão impressão (cobre T16) |

---

## Resumo Executivo: Ordem Tarefas x Deploy (19 tasks 🔴→🟡→🟢)
| Prioridade | Nº | Task | Deploy Estimado |
|---|---|---|---|
| 🔴 | T1 | Container raiz stacking | 434133 |
| 🔴 | T2 | Amostras Pendentes render | 434134 |
| 🔴 | T3 | Layout OFs por Máquina 15 colunas | 434135 |
| 🔴 | T4 | Compra Papelão impressão + fluxo salvar | 434136 |
| 🔴 | T5 | Visão Geral pt1: custos≠, 7 centros R$0 | 434137 |
| 🔴 | T6 | Visão Geral pt2: 7 cards Ganhos/Lucro | 434138 |
| 🔴 | T17 | Jarvis trava overlay (4 maneiras de fechar) | 434139 |
| 🔴 | T18 | Custo por OF trava → limit 1000 + Promise.allSettled | 434140 |
| 🟡 | T19 | Imprimir relatório Lançamentos (Aba 2) | 434141 |
| 🟡 | T7 | Sem Papelão 1 clique sem modal | 434142 |
| 🟡 | T8 | RONI MEIA VENDA dedupe global 4 telas | 434143 |
| 🟡 | T9 | Fornecedores categoria (5 opções + SQL CHECK + runtime validação) | 434144 |
| 🟡 | T10 | Mapa Clientes botão +Cliente + edit marcador + logs | 434145 |
| 🟡 | T11 | Orçamentos pasta sempre aplica schema + fallback localStorage | 434146 |
| 🟡 | T12 | Parâmetros comerciais recalc + campo DESCONTO | 434147 |
| 🟡 | T13 | orcamentos.deleted_at coluna + filtro Supabase query | 434148 |
| 🟡 | T14 | Histórico Passagens resumo por máquina topo | 434149 |
| 🟢 | T15 | CP/CR (backend endpoints + abas 6/7 Central binds fetch) | 434150 + 434151 (se 2 commits) |
| 🟢 | T16 | Comissões botão Imprimir real | 434152 (ou 434151 se T15 for 1 commit) |
| 🔍 | FR-20 | 93% erro Postgres 24h — espera input usuário | Nenhum deploy ainda |
