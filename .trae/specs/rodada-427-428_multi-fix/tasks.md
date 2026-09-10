# Rodada 427-428 — Implementation Plan
## Dividido em 2 deploys para respeitar Fact3 ~350L/deploy máximo esperado.

---

## Deploy #1: 427001 (P0 + P1 Críticos: ~350L esperado, aprovado Fact3 se <=500L)

### Task 1: Fix CMP Lista Vazia visible.map is not a function (P0)
- **Status:** `pending`
- **Priority:** `high`
- **Depends On:** None
- **Description:**
  - Localizar [patch.js:L59205-L59314](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L59205-L59314).
  - Variável `visible` (L59205) é calculada com fallback inline, porém `typeof window.compraVisibleRows === 'function' && window.compraVisibleRows()` retorna algo que NÃO é array em algum momento de loading inicial (Promise, objeto literal {data: [...]}, null).
  - Adicionar após linha 59205: `if (!Array.isArray(visible)) visible = [];`.
  - Mesma garantia para `totalItens` (L59208-L59216) já tem try/catch, manter.
  - Exibir 1 card amarelo extra se `visible.length===0 && resumo.total_compras>0` (sugestão de toast "Aguardando carregamento de compras...").
- **Acceptance Criteria Addressed:** AC-1
- **Test Requirements:**
  - `rule` TR-1.1: Em runtime local, evaluate `window.compraVisibleRows = function(){ return null; }` → depois `_compraPapelaoRenderBody()` executa SEM throw `visible.map is not a function` e retorna tabela vazia (0 erros).
  - `rule` TR-1.2: `window.compraVisibleRows = () => { return {foo: 1, data: [...]}` (objeto não array) → NÃO quebra.
  - `rule` TR-1.3: Depois do fix, `node --check patch.js` exit 0.

### Task 2: Fix "Passou pela Máquina" stack overflow recursão (P0)
- **Status:** `pending`
- **Priority:** `high`
- **Depends On:** None
- **Description:**
  - Ler debug-ofmaq-bridge-stack.md (Hipótese #1: `bridgeLegacyOfmaqEntrypoints` rewrap infinito).
  - Funções em [patch.js:L4654-L4702](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L4654-L4702), [L5144](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L5144), [L24570](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L24570), [L26522-L26585](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L26522-L26585).
  - Criar guard global: `window.__passouMaquinaGlobalDepth = 0` + `window.__passouMaquinaLastCallAt = 0`. Toda entrypoint incrementa no início e decrementa no `finally`.
  - Se depth > 10 OU (now - lastCallAt < 300ms e depth > 3) → early return com toast amarelo claro: "Ação acionada repetidamente, aguarde 500ms..." e NÃO chamar a si mesma novamente (evitar recursão).
  - Converter loops de retry 8→12 fonte cascata em `for` com `maxIterations=20` e `break` em vez de chamar a mesma função wrapper com parâmetros ligeiramente diferentes.
  - Adicionar flag `__wrapped_by_ofmaq_bridge_depth_check` para wrappers NÃO encadear mais de 1 camada.
- **Acceptance Criteria Addressed:** AC-2
- **Test Requirements:**
  - `rule` TR-2.1: Simular recursão evaluate → forçar 12x clique (interval 100ms). Não ocorre `RangeError: Maximum call stack`.
  - `rule` TR-2.2: `window.__passouMaquinaGlobalDepth` sempre retorna a 0 após a ação finalizar.
  - `rule` TR-2.3: node --check patch.js exit 0.

### Task 3: Fix Orçamentos Parâmetros Comerciais recálculo oninput (P1)
- **Status:** `pending`
- **Priority:** `high`
- **Depends On:** None
- **Description:**
  - 2 locais de UI:
    1. Modal calculadora inline [index.html:L39441-L39447](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L39441-L39447) — inputs parâmetros têm `oninput="calcRecalcFromScope(blockIdx)"` inline: aparentemente OK (mesmo blockIdx). Mas alguns blocos extras (criados por `calcBuildExtraBlockHtml`) NÃO atualizam o blockIdx corretamente no oninput? Ou `calcFieldEl` retorna null (L39490) → early return L39493 sem recalc? Ver L39490: `if (!tbody) { if (!blockIdx && typeof calcLastResult !== 'undefined') return calcRecalc(); return; }` — se tbody ainda não foi criado no momento do oninput (ordem de renderização), retorna sem recalc.
    2. Tela parâmetros global [index.html:L49334-L49340](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L49334-L49340): `oninput="calcRecalc()"` (global, não escopo). `calcRecalc()` existe? Verificar que `window.calcRecalc` seja definido (chama `calcRecalcFromScope(0) + itens extra`).
  - Adicionar EVENT DELEGATION GLOBAL (como fallback para quaisquer inputs criados dinamicamente):
    ```js
    document.addEventListener('input', function(ev){
      var t = ev && ev.target;
      if (t && t.matches && t.matches('[data-calc-field]')) {
        var bIdxEl = t.closest('[data-calc-block]');
        var bIdx = bIdxEl ? Number(bIdxEl.getAttribute('data-calc-block') || '0') : 0;
        if (typeof window.calcRecalcFromScope === 'function') setTimeout(function(){ try { window.calcRecalcFromScope(bIdx); } catch(_){} }, 0);
        if (bIdx === 0 && typeof window.calcRecalc === 'function') setTimeout(function(){ try { window.calcRecalc(); } catch(_){} }, 0);
      }
    }, { capture: true, passive: true });
    ```
  - Injetar esse listener em patch.js (função `__ggInstallCalcListeners` onload 1 shot, guard `__calcListenersInstalled = true` para não instalar 2x).
  - Garantir que `calcFieldEl` que busca por id L493xx também exista (L493xx usa `calc-cm`, `calc-cf`, etc. IDs diferentes dos block-based). Ajustar no calcRecalc global para ler esses IDs primeiro.
- **Acceptance Criteria Addressed:** AC-3
- **Test Requirements:**
  - `rule` TR-3.1: evaluate `document.querySelector('[data-calc-field="cm"]').value = 55` + dispatch `input` event → display w3 display text "Custo Mercadoria = 45.0%" (após 55 = 100-15-25-1-10-55= < negativou? se for verificar fórmula w3).
  - `rule` TR-3.2: tbody de compensação de preço tem innerHTML diferente do inicial (ou seja: foi recalculado).
  - `rule` TR-3.3: Frete-display valor = km*vkm correto após editar km=80 vkm=1.15 → R$92,00.

### Task 4: Fix CMP Impressão layout + Vincos formato "9/9/9/9" (P1)
- **Status:** `pending`
- **Priority:** `medium`
- **Depends On:** None
- **Description:**
  - Localizar handler de impressão: `window._compraPapelaoPrintCompra` ou evento `data-cmpx-print` onclick on [patch.js](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L59300) (button data-cmpx-print).
  - Função `compraItensExpansaoHtml(compra)` (chamada em L59286) é a candidata para imprimir itens com vincos:
    - Para cada item `i` da compra: extrair `vinco1..vinco4` (v1..v4) → `[vinco1,vinco2,vinco3,vinco4].filter(v=>v!==null&&v!==undefined&&String(v).trim()!=='').join('/')` → gera "9/9/9/9".
    - Depois `vincos_extra` (array V5+) → concatenar `· V${idx+5}=${v}`.
    - Mostrar string no `<td>` coluna Vincos dentro de `<span class="cmp-print-vincos">` (negrito, mono).
  - Layout impressão: `@media print { .cmpx-actions-row, .no-print { display: none !important; } body { background: white !important; } .cmpx-table, .cmp-print-wrap { page-break-inside: avoid; } }` — injetar style tag `id=cmp-print-styles` uma vez no DOM quando primeira impressão.
  - Tela preview impressão (antes de window.print()) deve criar modal com HTML "Comprovante de Compra de Papelão" contendo: Header (empresa atual, data compra, número compra, fornecedor, status), Tabela itens (Nº | Descrição | Quantidade | Preço Unit | V1/V2/V3/V4 | Vincos extra | Total), Footer (Total geral, observações).
- **Acceptance Criteria Addressed:** AC-4
- **Test Requirements:**
  - `rubric` TR-4.1: Dimension: Layout impressão; Scale 1-5; Anchors 1=desorganizado; 3=bom mas sem header/footer; 5=profissional header/footer/tabela; Threshold ≥ 4. Evidence: avaliar visual do preview HTML gerado.
  - `rule` TR-4.2: Para um item com `vinco1=9,vinco2=9,vinco3=9,vinco4=9,vincos_extra=[{nome:'V5',valor:6}]`, evaluate string de vincos = exatamente `9/9/9/9 · V5=6`.

### Task 5: Fix Amostras Pendentes travado "Carregando..." (P1)
- **Status:** `pending`
- **Priority:** `medium`
- **Depends On:** None
- **Description:**
  - Função `renderAmostrasSemana` [patch.js:L25767-L26115](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L25767-L26115).
  - Hoje: try L25780 começa, lock `_amostrasRendering = true` L25781. finally L26114-L26115 define false.
  - MAS: se houver throws EM async (ex.: `await apiFetch` dentro do try) que não está await-correcto, finally executa imediatamente OU nunca. Verificar se a função é `async` (deve ser). L25767 é `async function renderAmostrasSemana`? Confirmar. Se NÃO async, transformar em async e esperar os fetches.
  - Aumentar timeout de lock 15s → 45s (L25771): `Date.now() - _ts > 45000`.
  - Adicionar container de erro: se fetch falhar, grid.innerHTML = `<div class="cmp-amostras-erro">...<button onclick="...">🔄 Tentar novamente</button></div>`.
  - `AbortController`: L25788 aborta anterior, cria novo L25789. Garantir que o fetch de API USE `{signal: shell._amostrasAbort?.signal}`.
- **Acceptance Criteria Addressed:** AC-5
- **Test Requirements:**
  - `rule` TR-5.1: Simular travamento (setar _amostrasRendering=true, _amostrasRenderingTimestamp=Date.now()-60000). Chamar renderAmostrasSemana → log "[lock stuck detectado (>45s)]" + _amostrasRendering=false.
  - `rule` TR-5.2: Forçar erro de rede fetch → mostra HTML do erro + botão "Tentar novamente".

### Task 6: Deploy 427001 Bumps, syntax, diff (Fact3)
- **Status:** `pending`
- **Priority:** `high`
- **Depends On:** T1, T2, T3, T4, T5 todos finalizados `completed`
- **Description:**
  - `node --check server.js patch.js sw.js index.html mobile.js` (todos que editei).
  - `git diff --stat` → contar linhas esperado ~300L. Se > 500 → STOP, dividir.
  - Bumps 5 pontos 427001 SAME COMMIT:
    - server.js `PATCH_RUNTIME_VERSION=20260910427001`, `SW_RUNTIME_VERSION=20260910427001`.
    - sw.js `CACHE_NAME=italy-erp-v20260910427001`.
    - index.html: `<script>var swVersion = '20260910427001';</script>`.
    - index.html: `<script src="/patch.js?v=20260910427001"></script>`.
  - `git add -A; git commit -m "427001 CMP visible[] + PassouMaquina depth + Params oninput + Print vincos + Amostras try/finally"`; `git push origin main`.
  - Railway poller `/api/version` PATCH >=20260910427001 confirmar antes de Deploy 2.
- **Acceptance Criteria Addressed:** NFR-4, Fact3, Fact4, Fact5
- **Test Requirements:**
  - `rule` TR-6.1: node --check todos exit 0.
  - `rule` TR-6.2: Railway poll 2 minutos retorna PATCH=20260910427001.

---

## Deploy #2: 428001 (P2 + P3 features: ~450L esperado, aprovado Fact3 se <=500L)

### Task 7: Fix Relatório Projeção Vendas — conectar front/back (P2)
- **Status:** `pending`
- **Priority:** `medium`
- **Depends On:** None
- **Description:**
  - Ver [patch.js:L3706-L3742](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L3706-L3742) `rrOpenProjecaoVendasModal()` + L3723: `typeof window.renderProjecaoVendas === 'function'` — checar onde `renderProjecaoVendas` está definida. Muito provavelmente em outra parte de patch.js ou index.html L43612-L43850 (encontrei index.html 43612 tipo='projecao-vendas'). Greppar `function renderProjecaoVendas`.
  - Se função não existe ou não está no escopo global (declarada com `let` ou `const` → não global), então:
    - Copiar a implementação de index.html L43612 ss e colocar em patch.js como `window.renderProjecaoVendas = async function(ano) {...}`.
    - Função deve fazer GET `/api/relatorios/projecao-vendas?ano=YYYY` (atualiza o endpoint para aceitar `?ano=` query em server.js [L21750](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L21750) — hoje só usa anoAtual automático).
    - Renderizar no `widget-projecao-vendas`: cards topo + barras 24 meses (histórico 12 + projeção 12).
  - Backend server L21750 adicionar query param `?ano=YYYY` → sobrescrever `anoAtual = parseInt(req.query.ano)` se válido.
- **Acceptance Criteria Addressed:** AC-6
- **Test Requirements:**
  - `rule` TR-7.1: evaluate `typeof window.renderProjecaoVendas === 'function'` = true após load page.
  - `rule` TR-7.2: Click "Projeção de Vendas" abre modal e widget tem innerHTML > 1000 chars.
  - `rule` TR-7.3: endpoint `/api/relatorios/projecao-vendas?ano=2026` retorna {ok:true, meses: [...]} (200 status).

### Task 8: Resumo Anual — "Todas as empresas" seletor (P2)
- **Status:** `pending`
- **Priority:** `medium`
- **Depends On:** None
- **Description:**
  - Frontend: `rrOpenResumoAnualModal()` [patch.js:L3764-L3874](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L3764-L3874). No header (L3780-L3784), ao lado do input ano, adicionar `<select id="rr-resumo-anual-empresa">` com options:
    - `<option value="E1">Italy Embalagens</option>`
    - `<option value="E2">Cartoeste</option>`
    - `<option value="E3">Oestepack</option>`
    - `<option value="ALL">Todas as empresas (Soma)</option>`
  - GET `/api/relatorios/resumo-anual?ano=YYYY&emp_id=ALL` (modificar backend server.js L15765).
  - Backend L15765: Modificar query onde `_resolveEmpresaUuid(req)` → se `req.query.emp_id === 'ALL'` → `empresa_id_list = [UUID_E1, UUID_E2, UUID_E3]` (hardcoded conforme Fact6 UUIDs PERMANENTES). Passar essa lista para `_relatoriosFetchOfsConcluidas` em vez de [empresa_id].
  - Alterar o retorno L15785 para `empresa_filtro_id: req.query.emp_id || (empresa_id ? uuid : null)` — retorna 'ALL' se todas.
  - Cards do modal: adicionar texto "Empresa: Italy Embalagens" OU "Empresa: Todas (3x)" no subheader.
- **Acceptance Criteria Addressed:** AC-7
- **Test Requirements:**
  - `rule` TR-8.1: Selecionar "Todas empresas" → Network request /api/relatorios/resumo-anual?emp_id=ALL → retorna {empresa_filtro_id: "ALL", ...}.
  - `rule` TR-8.2: Setembro/2026 valor_vendido ≈ 182698.49 (comparar se relatório é >= valor Italy sozinha, já que é soma).
  - `rule` TR-8.3: Alterar empresa → clicar Buscar → recalcula (valores mudam conforme).

### Task 9: Mapa Clientes — modal vazamento + salvar + visual (P2)
- **Status:** `pending`
- **Priority:** `high`
- **Depends On:** None
- **Description:**
  - Subtarefa 9a (Visual): `cadEstadoRender`, `cadCidadeRender` (patch.js L12774 ss) atualizar para usar `pep-wrap pep-card grid`. Remover inline styles desnecessários.
  - Subtarefa 9b (Salvar): `estado-novo` onclick [patch.js L12815](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L12815) — verificar se botão de salvar do form faz POST.
  - Subtarefa 9c (Vazamento — MAIS CRÍTICO):
    - Hoje `wrap = document.createElement('div')` `wrap.id='cad-estado-modal'` → NÃO há overlay. Renderiza em: `var host = document.getElementById('cad-estados-host') || document.body;` (verificar se host é dentro da tela específica ou global body).
    - Transformar em overlay padrão (igual `rr-projecao-overlay` L3708-3719): `position:fixed; inset:0; z-index:99999; background:rgba(...)`.
    - Close hooks:
      1. `MutationObserver` no `document.body` — se qualquer tela mudar (data-page-active mudar) → remove o overlay.
      2. Evento `window.addEventListener('hashchange', ...)` (se SPA usar hash) + `popstate`.
      3. Ao clicar em qualquer item do menu, invocar `__cadEstadoModalCloseAll()` helper.
      4. Helper close function: `window.__cadModaisFecharTodos = function() { document.querySelectorAll('[id^="cad-"][id$="-modal"], .cad-overlay-global').forEach(el=>{ try{ el.remove();}catch(_){}}); }` — invocada em qualquer `window.go()` override (patchar a função `go` original se existir, com wrapper).
- **Acceptance Criteria Addressed:** AC-8
- **Test Requirements:**
  - `rule` TR-9.1: Abrir "Novo Estado" → navegar para Fornecedores → evaluate `document.querySelectorAll('#cad-estado-modal').length === 0`.
  - `rule` TR-9.2: Submit formulário Novo UF = "RS" (se ainda não existir) → retorna sucesso e lista é atualizada sem refresh página.
  - `rubric` TR-9.3: Visual organização. Scale 1-5. 1=desorganizado;3=medio;5=limpo igual pep-wrap padrão. Threshold ≥4.

### Task 10: Novo endpoint e tela Relatório Perdas por Operador (mês/ano) (P3)
- **Status:** `pending`
- **Priority:** `medium`
- **Depends On:** None
- **Description:**
  - Backend: Criar `app.get('/api/relatorios/perdas-operador', authMiddleware, async...)` em server.js, seguindo pattern de `/api/relatorios/resumo-anual`.
  - Query: mês = req.query.mes, ano = req.query.ano. Date range: 1/mes/ano a 1/(mes+1)/ano.
  - `ofs`: filtrar por `created_at` ou `data_conclusao` no range. Campos: `id, operadores_conclusao, qtd_perdida, maquina_perda, valor_total, quantidade, status`.
  - Para cada OF com `qtd_perdida > 0` ou `maquina_perda`: unpack `operadores_conclusao` array. Para cada operador string: acumular Map(operador → {qtd_perdida, valor_perdida, ofs_ids_set new Set}). Valor_perdida = `(valor_total / (quantidade > 0 ? quantidade : 1)) * qtd_perdida`.
  - Result rows: `{operador, qtd_perdida, valor_perdida, qtd_ofs, pct_do_total}`. Ordenar por `qtd_perdida DESC`.
  - Frontend: Nova função `rrOpenPerdasOperadorModal()` em patch.js com mesmo pattern overlay dos outros relatórios (L3708 ss). Menu entry adicionada ao lado Resumo Anual / Projeção Vendas. Filtros ano input + mês select (1-12). Botão buscar. Cards topo: Total Perdido R$, Total Caixas Perdidas, % Perda, Top 3 Operadores. Tabela com 4 colunas.
- **Acceptance Criteria Addressed:** AC-9
- **Test Requirements:**
  - `rule` TR-10.1: GET /api/relatorios/perdas-operador?mes=9&ano=2026 → HTTP 200 {ok:true, rows:[...], totalizador:...}.
  - `rule` TR-10.2: Soma de qtd_perdida de todos operadores = qtd_perdida total do mês no banco.
  - `rule` TR-10.3: Tela modal abre, ao clicar buscar, tabela renderiza com pelo menos 1 linha se houver perdas.

### Task 11: Modernizar Operadores — ativo toggle + modal filtro ativo=true + sugestão máq_principal (P3)
- **Status:** `pending`
- **Priority:** `medium`
- **Depends On:** None
- **Description:**
  - Subtask 11a (Gestão Operadores):
    - Frontend: se já existe tela Operadores, atualizar; senão criar entrypoint no menu. Tabela colunas: Nome, Telefone, Ativo (toggle switch), Máq. Principal (select todas as máquinas de catálogo OFmaq).
    - PUT `/api/operadores/:id` body `{ativo: boolean, maq_principal: string}` — verificar se server.js endpoint existe. Se não, criar com mesmo pattern de `/api/clientes/:id` whitelist `operadoresPayload` (que já existe, conferir).
  - Subtask 11b (Modal Conclusão OF):
    - Localizar onde `<select multiple>` ou chips de operadores são criados (modal conclusão de OF, patch.js L37989 `_operadoresConclusaoCache` e ao redor).
    - Ao carregar lista de operadores para selecionar: filter `op.ativo === true`.
  - Subtask 11c (Sugestão máq_principal em tela perda):
    - No form de registro de perda (onde usuário seleciona máquina), ao mudar seletor de máquina `select[name="maquina_perda"]` → maq_nome_selecionada.
    - Buscar todos operadores onde op.maq_principal === maq_nome_selecionada OR op.maquina_principal === maq_nome_selecionada (colunas sinônimas? confirmar). Pré-marcar esses operadores no `<select multiple>` com fundo amarelo (destaque) e toast leve "Sugerido: X, Y devido à máquina IMP 04".
  - Backend GET `/api/operadores?ativo=1` adicionar query filter se já não tiver.
- **Acceptance Criteria Addressed:** AC-10
- **Test Requirements:**
  - `rule` TR-11.1: Cadastrar operador inativo → ele NÃO aparece no modal Conclusão OF de OF nova.
  - `rule` TR-11.2: Selecionar máquina X no form perda → operadores com maq_principal=X são marcados/sugeridos.
  - `rule` TR-11.3: Toggle ativo false → salva no banco (PUT /api/operadores/:id retorna ok:true).

### Task 12: Deploy 428001 Bumps, syntax, diff (Fact3)
- **Status:** `pending`
- **Priority:** `high`
- **Depends On:** T7, T8, T9, T10, T11 todos `completed`
- **Description:**
  - `node --check` tudo.
  - `git diff --stat` esperado ~450L, se > 500 STOP.
  - Bumps 5 pontos 428001 SAME COMMIT: server (PATCH+SW), sw.js CACHE, index swVersion, index patch.js?v=.
  - Commit/push; Railway poller PATCH >=20260910428001.
- **Acceptance Criteria Addressed:** NFR-4, Fact3, Fact4, Fact5
- **Test Requirements:**
  - `rule` TR-12.1: todos node --check exit 0.
  - `rule` TR-12.2: Railway deploy ok após ~3min.
