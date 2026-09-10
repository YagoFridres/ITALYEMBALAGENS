# Rodada 427-428 — Correções Multi-área ERP Italy Embalagens
## Product Requirements Document (PRD)

## Overview
- **Summary:** Pacote de 10 pedidos cobrindo correções P0 (quebram tela, bloqueiam operação), P1 (funcionalidades quebradas/feias), e P2/P3 (novas features). 2 commits para respeitar Fact3 limite ~500L/deploy.
- **Purpose:** Desbloquear 2 telas quebradas (Compra Papelão lista vazia; OFs Passou pela Máquina stack overflow), corrigir bugs de recálculo/layout/repetição em Orçamentos/CMP/Amostras, adicionar 2 novos relatórios (Perdas Operador + Projeção Vendas funcionando + Resumo Anual Todas empresas), refatorar Mapa Clientes vazamento e Operadores.
- **Target Users:** Usuários finais da Italy Embalagens + Cartoeste + Oestepack (adm, financeiro, pcp, operadores de máquina).

## Goals
1. (Deploy 427001 - P0/P1) Desbloquear as 2 telas quebradas e corrigir os 3 bugs P1 adjacentes (6 pedidos).
2. (Deploy 428001 - P2/P3) Entregar os 4 pedidos restantes: Projeção Vendas funcionando, Resumo Anual Todas empresas, Perdas Operador, Operadores modernizados, Mapa Clientes corrigido.

## Non-Goals
- NÃO alterar tabelas de banco de dados novas ou colunas novas (exceto se necessário para novas features, mas usar o que já existe primeiro).
- NÃO mexer em lógica de cálculo das fórmulas da calculadora de orçamento (apenas recálculo oninput).
- NÃO refazer tela Compra Papelão inteira (só fix visible = array + layout impressão + vincos formato).
- NÃO tocar em login/autenticação/JWT.
- NÃO conectar Supabase MCP (Fact2 PERMANENTE PROIBIÇÃO — usar REST client em server.js e whitelist de colunas).

## Background & Context
- **Fatos permanentes VERBATIM do usuário:**
  - (Fact2) NÃO conectar Supabase MCP, usar REST server.js whitelist / SQL Editor manual.
  - (Fact3) todo commit rodar `git diff --stat` ANTES, esperado ~300-500L, se muito maior PARAR.
  - (Fact4) NUNCA editar index.html só exceto 2 bumps swVersion e patch.js?v= NO MESMO COMMIT (e 2 timestamps inline).
  - (Fact5) todo commit exige bumps 5 pontos: server.js PATCH+SW; sw.js CACHE_NAME; index.html inline swVersion; index.html `<script src="/patch.js?v=TIMESTAMP">`. Timestamp `YYYYMMDDHHMMSS` estritamente > patch anterior.
  - (Fact6) UUIDs empresas: Italy=E1/df5f7672-..., Cartoeste=E2/e9b734dc-..., Oestepack=E3/a6e5f5d8-...; fallback emp_id="E1|E2|E3"; flag __sem_empresa__.
  - (Fact1) URL produção=https://adm.italyembalagens.com.br/, deploy Railway push origin/main, repo=https://github.com/YagoFridres/ITALYEMBALAGENS.git.
- **Deploy ativo atual:** 426001 (SHA 2f4eeb3, PATCH=20260901426001, Railway CONFIRMADO).
- **Bumps próximos:** 427001 (após P0/P1 fixes) e 428001 (após P2/P3).

---

## Functional Requirements

### FR-1 (P0: CMP Lista Vazia visible.map is not a function)
- Garantir que a variável `visible` usada em `visible.map()` em `_compraPapelaoRenderBody()` sempre seja um Array verdadeiro. `window.compraVisibleRows` pode retornar objeto, null, Promise, ou undefined em certos estados de loading.
- Fallback aninhado robusto: `if (!Array.isArray(visible)) visible = []`.
- Garantir que `host.innerHTML` (L59316+) monta a tabela mesmo com 0 linhas (vazio é diferente de quebra).

### FR-2 (P0: OF Passou pela Máquina Maximum call stack size exceeded)
- Eliminar recursão infinita na jornada "Passou pela Máquina" (8 fontes de máquina cascata + retry loop 8→12 + re-wrap infinito `bridgeLegacyOfmaqEntrypoints`).
- Substituir chamadas recursivas de self por loops iterativos (for/while depth guard <50).
- Adicionar guard global `__window.passouMaquinaRunningGuard` depth counter com reset no finally para evitar re-entrada.
- Se um entrypoint já está rodando, enfileirar ou rejeitar graciosamente com toast vermelho claro.

### FR-3 (P1: Orçamentos Parâmetros Comerciais recálculo oninput)
- Os 7 inputs (Custo Merc %, Custo Fixo %, Margem %, Comissão %, Impostos %, Vl. KM Frete, KM Entrega) em AMBOS os HTMLs (1) modal calculadora inline (index.html L39441-39447) e (2) tela Parâmetros (index.html L49334-49340), bem como os blocos extras `_calcBlockSeq >0`, devem disparar `calcRecalcFromScope(blockIdx)` a cada `input` (ou change) SEM EXCEÇÃO.
- Se `calcRecalcFromScope` estiver definida mas o listener não estiver ligado (ex.: input fora do escopo criado dinamicamente), adicionar event delegation `document.addEventListener('input', ..., {capture:true})` com filtro `data-calc-field`.
- Resultado esperado: usuário edita CM% → tabela compensação recalcula imediatamente; campos bruto/líquido/com frete/unitário mudam; display w3 "Custo Mercadoria = XX.X%" atualiza; display Frete Total atualiza.

### FR-4 (P1: Compra Papelão Impressão profissional + Vincos "V1/V2/V3/V4" 9/9/9/9)
- Layout de impressão de compra deve seguir padrão visual do ERP (header com logo/empresa/fornecedor, tabela itens com colunas alinhadas, rodapé com totalizadores).
- Coluna "Vincos" em cada item deve exibir V1..V4 concatenados com barra: `9/9/9/9` (mesmo que valores repetidos), seguido de V5+ separados por vírgula se existirem extra.
- NÃO mais exibir vincos desalinhados, undefined, ou como `[object Object]`.
- Imprimir deve invocar `window.print()` com `@media print` style apropriado (sem buttons/actions, fundo branco, tabelas sem sombra).

### FR-5 (P1: OFs Amostras Pendentes travado Carregando... novamente)
- A função `renderAmostrasSemana()` deve ter `try/finally` GARANTINDO que `shell._amostrasRendering=false` + `_amostrasRenderingTimestamp=0` SEMPRE executam no final (incluindo throws).
- Timeout de lock existente de 15s é insuficiente se a API demorar mais. Aumentar para 45s OU adicionar `AbortController` real e abandonar request antigo sem deixar lock.
- Se o fetch `/api/amostras-pendentes` falhar (timeout, 500, rede), renderizar card vermelho claro "Falha ao carregar amostras: msg + botão Tentar Novamente" ao invés de spinner eterno.

### FR-6 (P2: Relatório Projeção de Vendas que não abre nem gera)
- A função `window.renderProjecaoVendas(ano)` DEVE existir no escopo global quando patch.js terminar de carregar. Atualmente `rrOpenProjecaoVendasModal()` (patch.js L3723) detecta `typeof renderProjecaoVendas !== 'function'` e mostra "Widget não carregado".
- Rota backend `/api/relatorios/projecao-vendas` já existe (server.js L21750) — conectar frontend.
- Resultado: modal abre → mostra meses passado até fim do ano corrente (ou próximo se `proximo_ano=1`) → barras/valores aparecem → se clicar em "Buscar" trocando ano, recalcula.

### FR-7 (P2: Resumo Anual — adicionar "Todas as empresas" seletor)
- Frontend `rrOpenResumoAnualModal()` (patch.js L3764) deve ter `<select>` no header com: 1 opção por empresa ativa (Italy, Cartoeste, Oestepack) + 1 opção "Todas as empresas (Soma: E1+E2+E3)".
- Backend `/api/relatorios/resumo-anual` (server.js L15765) deve aceitar query param `?emp_id=ALL` ou `?todas=1` → `companyIds = [E1, E2, E3]` no `_relatoriosFetchOfsConcluidas` range → soma todos os 3.
- Valor exibido no topo do modal e cards deve bater com o que o usuário confirmou no SQL: setembro 2026 117 OFs R$182.698,49 (soma 3 empresas).

### FR-8 (P2: Mapa Clientes — 3 problemas: visual, salvar, modal vazamento)
- (a) Visual: usar `pep-*` classes do design system das outras telas (mesmo grid, mesmo padding, mesmo card). Remover inline styles excessivos.
- (b) Salvar: formulários "Novo Estado", "Nova Cidade", "Novo Ramo" devem ter onclick salvar REAL chama POST `/api/estados`, `/api/cidades`, `/api/ramos_atividade` (verificar payload whitelist e retorno ok atualiza lista).
- (c) Vazamento modal (MAIS CRÍTICO dos 3): os modais `cad-estado-modal`, `cad-cidade-modal` (patch.js L12774/L12630) devem ser (1) construídos dentro de um `position:fixed` overlay igual ao dos outros relatórios (z-index 99999), e NÃO no rodapé da tela normal; (2) fechar SEMPRE: click fora, botão Cancelar, navegação `window.go()` para outra tela, `popstate`. NÃO PODEM ficar visíveis em outras telas (Estados/UF, Fornecedores) depois de abertos.

### FR-9 (P3: Novo relatório Perdas por Operador (mês/ano))
- Nova entrada no menu de relatórios (ao lado de Resumo Anual / Projeção Vendas).
- Filtros: Mês (dropdown 1-12) + Ano (input numérico) + Botão Buscar.
- Fonte de dados: `/api/relatorios/perdas-operador` ENDPOINT NOVO server.js whitelist:
  - Query `ofs` com status concluído (ou todos?), onde `operadores_conclusao` (coluna JSONB array text — ou colunas legado) tem conteúdo E (`maquina_perda` is not null OR `qtd_perdida` >0).
  - Para cada operador (unpack de `operadores_conclusao` array), somar: qtd_perdida total; valor_perdido (cruzar com valor_unitário se possível, se não `valor_total / qtd_caixas * qtd_perdida`).
  - Agrupar por operador, ordenar DESC por qtd_perdida.
- Tabela resultado: Operador | Qtd Perdida (caixas) | Valor Perdido (R$) | OFs com perda | % Perda.
- Cards topo: Total Perdas (R$) | Total Caixas Perdidas | % Perda no período | Top 3 Operadores.

### FR-10 (P3: Modernizar área de Operadores — ativo toggle + modal filtro + sugestão maq_principal)
- (a) Gestão Operadores (tela já existe? se não criar entrypoint): tabela com nome, telefone, ativo (toggle on/off), `maq_principal` (select dropdown todas as máquinas do catálogo). Salvar PUT `/api/operadores/:id` com `ativo` boolean e `maq_principal` string.
- (b) Modal Conclusão OF (onde `operadores_conclusao` é escolhido): no `<select multiple>` ou chips, EXIBIR SOMENTE operadores com `ativo = true` (ignorar inativos).
- (c) Tela de perda/Registro Perda: se usuário selecionar a máquina X, AUTO-PREENCHER o(s) operador(es) que tem `maq_principal = X` (sugestão amarela, usuário pode remover manualmente).
- Endpoint `/api/operadores` GET já deve existir (server.js) — se não tiver filtro `?ativo=1`, adicionar.

---

## Non-Functional Requirements
- **NFR-1 Performance:** cada recálculo de orçamento em tempo real < 100ms (para 5 itens extras).
- **NFR-2 Robustez:** NENHUM throw desprotegido em JS do navegador que quebre tela inteira (defesa em profundidade: try/catch outer + inner, igual a 425001 `_compraPapelaoRenderBody` outer).
- **NFR-3 Compatibilidade:** Firefox 128+, Chrome 120+, Edge atual; mobile Chrome Android (viewport < 450px).
- **NFR-4 Segurança:** Todo POST/PUT passar por whitelist de colunas backend (server.js `*Payload` functions). NÃO expor Service Role key para o navegador.
- **NFR-5 Memory:** nenhum leak de event listeners em MutationObserver do Mapa Clientes (modal vazio removido remove listeners também).
- **NFR-6 Rastreabilidade:** todo toast de erro deve console.error com stack + reportar via `_ofmaqReportError` onde apropriado.

## Constraints
- **Técnica:** Deploy em 2 commits; Fact3 ~300-500L máximo cada; somente index.html é editável para os 2 timestamps de bump versão NO MESMO commit (Fact4).
- **Negócio:** Senha Financeiro = 1234 para abrir tela Comissões/Orçamentos (se necessário testar).
- **Dependências:** endpoint `/api/relatorios/resumo-anual`, `/api/relatorios/projecao-vendas`, `/api/estados`, `/api/cidades`, `/api/ramos_atividade`, `/api/operadores` já existem ou serão criados nesta rodada.
- **Implícita:** UUID Italy Embalagens = E1 default em todos os relatórios se emp_id = ALL não especificado, exceto se "Todas empresas" selecionado.

## Assumptions
1. Colunas `operadores_conclusao`, `qtd_perdida`, `maquina_perda` estão realmente preenchidas em produção como o usuário disse.
2. Tabela `operadores` já tem colunas boolean `ativo` e text `maq_principal` (se não existir, adicionar NOT NULL com defaults via migration SQL manual que o usuário roda no Editor — não por MCP).
3. `window.renderProjecaoVendas` está declarada em algum lugar de patch.js ou index.html mas não liga na inicialização (regressão loading order).

## Open Questions
- [ ] (OPCIONAL item 9 Perdas Operador) O relatório deve incluir OFs canceladas também? Ou só concluídas com perda? Default assumido: TODAS as OFs com `qtd_perdida>0` independente de status.
- [ ] (OPCIONAL item 10 Operadores) Quando há múltiplos operadores vinculados a mesma `maq_principal`, devemos sugerir TODOS (checkboxes marcados de primeira) ou só o primeiro? Default assumido: todos auto-sugerir (e usuário remove quem não for).
- [ ] (OPCIONAL item 8) O usuário quer visual completamente igual a "Estoques" (pep-wrap), ou só organizado? Default assumido: pep-wrap padrão + grid 2 colunas.

---

## Acceptance Criteria

### AC-1: (rule) CMP visible = Array SEMPRE
- **Given:** tela Compra Papelão aberta (user logado), existam N compras cadastradas (cards topo com R$ + m² preenchidos)
- **When:** `_compraPapelaoRenderBody()` executa 3 vezes seguidas + durante loading `compraVisibleRows` retorna undefined / objeto Promise / não array
- **Then:** NUNCA aparece `[PATCH-CMP] render body map falhou: visible.map is not a function`; as compras aparecem na tabela; NÃO aparece "Nenhuma compra encontrada" a menos que realmente 0.
- **Pass Condition:** console com warnings zerados para esse erro específico após reload 3x; tabela tem linhas igual ao totalizador de cards.
- **Evidence:** browser MCP evaluate `(() => { try { var st = window._compraPapelaoStateRef ? window._compraPapelaoStateRef() : null; var vis = window.compraVisibleRows ? window.compraVisibleRows() : null; return { isArray: Array.isArray(vis), len: Array.isArray(vis)?vis.length:-1, cards: (window._compraPapelaoStatsResumo && typeof window._compraPapelaoStatsResumo==='function') ? window._compraPapelaoStatsResumo() : null }; })()` e snapshot da tabela com rows.

### AC-2: (rule) Passou pela Máquina SEM recursão infinita
- **Given:** user navega OFs por Máquina, escolhe qualquer OF com status não concluído
- **When:** clica 2 vezes seguidas rapidamente no botão "✅ Passou pela Máquina" (simulando double click)
- **Then:** NÃO aparece `Uncaught RangeError: Maximum call stack size exceeded` no console; APENAS 1 request POST é feito (ou 2ª é rejeitada com toast "Aguarde a ação anterior terminar..."); o status da OF muda para "Concluída" (ou equivalente).
- **Pass Condition:** console limpo de RangeError para esse click; 0 ou 1 requests apenas (verificado Network tab ou evaluate window._passouMaquinaReqCount).
- **Evidence:** evaluate `(typeof window.__passouMaquinaDepthGuard !== 'undefined' ? 'guard_exists' : 'no_guard')` + double click action + toast verificação.

### AC-3: (rule) Parâmetros Comerciais recalculam oninput
- **Given:** modal calculadora orçamento aberto (1 item base default), valores padrão cm=49 cf=15 mg=25 cv=1 imp=10 vkm=1.15 km=50
- **When:** usuário digita novo valor em Custo Merc % → 55; depois Margem % → 20; depois KM Entrega → 80 (3 edits total)
- **Then:** APÓS CADA edit o display de "Custo Mercadoria = XX.X%" atualiza (antes 100 - 15 - 25 - 1 - 10 = 49 → para 55=45 → display 45.0%); Frete Total (antes 1.15*50=R$57.50 → depois 1.15*80=R$92) e tabela compensação rows valores atualizam na mesma hora; NÃO precisa clicar em "Calcular".
- **Pass Condition:** evaluate `document.querySelectorAll('[data-calc-field="w3-display"]').forEach(el)` retorna texto batendo com 100-soma dos params; Frete-display bate; tbody ter 3 rows com valores após edit.
- **Evidence:** evaluate + input type programático via `el.dispatchEvent(new Event('input', {bubbles:true}))`.

### AC-4: (rubric) Compra Papelão layout impressão profissional + vincos formato
- **Dimension:** Layout e completude do impresso
- **Scale:** 1-5
- **Anchors:** 1 = modal impressão ainda tem botões/lixo, vincos undefined e valores errados; 3 = layout OK (sem actions), porém vincos ainda separados errados; 5 = layout profissional, cabeçalho com compra/fornecedor/data, tabela itens, coluna Vincos mostra "9/9/9/9" para V1-4 todos 9, e extra V5 "6" aparece "9/9/9/9 · V5=6".
- **Pass Threshold:** >= 4
- **Evidence:** screenshot modo impressão print ou evaluate `document.querySelector('@media print stylesheet')` + verificar texto dos vincos em tela preview (evaluate `document.querySelectorAll('[data-cmpx-print-vincos]').map(t => t.innerText)`).

### AC-5: (rule) Amostras Pendentes limpa lock e mostra erro
- **Given:** user abre tela OFs por Máquina
- **When:** request API `/api/amostras-pendentes` demora > 10 segundos OU falha (simulado por evaluate Abort)
- **Then:** NÃO fica preso eternamente em "Carregando amostras..."; após >45s libera lock OU mostra "Falha ao carregar. Tentar novamente" com botão; se clicar no botão tenta de novo e consegue.
- **Pass Condition:** `shell._amostrasRendering` é `false` após 50s independente de falha.
- **Evidence:** evaluate `setTimeout(()=>{var s = __shellRef; console.log(s._amostrasRendering)}, 51000)` returns false ou string "render_failed".

### AC-6: (rule) Projeção Vendas ABRE e GERA dados
- **Given:** user logado, menu relatórios → Projeção Vendas
- **When:** clica no item de menu
- **Then:** modal abre; NÃO mostra "Widget de projeção não carregado"; mostra pelo menos 6 meses de histórico + 3 meses de projeção com barras (ou valores) com números.
- **Pass Condition:** evaluate `typeof window.renderProjecaoVendas === 'function'` (true) + container widget tem innerHTML.length > 200.
- **Evidence:** click action + snapshot widget com valores.

### AC-7: (rule) Resumo Anual Todas empresas = soma E1+E2+E3
- **Given:** modal Resumo Anual aberto em setembro/2026
- **When:** user escolhe "Todas as empresas (Soma 3)" no seletor
- **Then:** Cards topo mostram ~63+X+Y = 117 OFs total; valor vendido ≈ R$ 182.698,49; igual ao valor que usuário confirmou SQL.
- **Pass Condition:** valor batendo com valor do usuário (até centavo, se set/2026 completo em produção).
- **Evidence:** Network request `/api/relatorios/resumo-anual?emp_id=ALL` retornando payload JSON e evaluate cards match.

### AC-8: (rule) Mapa Clientes modal não vaza entre telas
- **Given:** usuário está na tela Mapa Clientes → Estados → clica "＋ Novo Estado" (modal abre)
- **When:** usuário clica no menu lateral "Fornecedores" (ou outra tela qualquer sem fechar o modal) — e depois volta para Fornecedores ou outra tela
- **Then:** o modal de "Novo Estado" NÃO está mais visível em lugar NENHUM; NÃO fica no rodapé da tela de Fornecedores. Todo innerHTML do `cad-estado-modal` e seu overlay wrapper foram removidos do DOM.
- **Pass Condition:** evaluate `document.querySelectorAll('[id="cad-estado-modal"],[id="cad-cidade-modal"]')` em tela Fornecedores = length 0 OU com `display:none` e `position:fixed` com overlay removido; modal não está visível.
- **Evidence:** evaluate + 2 snapshots (tela original com modal aberto; outra tela depois de navegar).

### AC-9: (rule) Relatório Perdas Operador gera dados
- **Given:** usuário abre novo relatório no menu; escolhe mês = 9 e ano = 2026 (setembro/2026)
- **When:** clica Buscar
- **Then:** tabela mostra pelo menos 1 operador se houver perda no mês; 4 colunas Operador/Qtd/Valor/% ; cards topo com Totais; NÃO erro 500.
- **Pass Condition:** evaluate `document.querySelectorAll('[data-perda-operador-row]').length >=1` ou 0 com mensagem "Sem perdas no período".
- **Evidence:** Network request + snapshot tabela.

### AC-10: (rule) Operadores ativos só aparecem no modal conclusão + sugestão máq_principal
- **Given:** operador "João Silva" = inativo (ativo=false); operador "Thiago" ativo=true maq_principal=IMP 04; operador "Hércules" ativo=true maq_principal=IMP 04
- **When:** usuário abre modal conclusão de OF com máquina atual = IMP 04
- **Then:** João Silva NÃO aparece na lista de chips/select; Thiago e Hércules aparecem PRÉ-SELECIONADOS/DESTACADOS amarelo como sugestão; usuário pode clicar para aceitar sugestão ou cancelar.
- **Pass Condition:** evaluate `document.querySelectorAll('[data-operador-item]').filter(e => e.dataset.nome === 'João Silva').length === 0`; Thiago/Hércules dataset-suggested="1".
- **Evidence:** evaluate names in list + flags suggested.
