# Roadmap Multi-item Itália Embalagens 2026-09-16 — Product Requirements Document

## Overview
- **Summary**: Conjunto de 🔴 Críticos (stacking de páginas, Amostras Pendentes, layout OFs por Máquina, Compra de Papelão impressão, Visão Geral cards + bug dupla contagem custo OF/Papelão), 🟡 Médios (Sem Papelão, RONI duplicado, Fornecedores categoria, Mapa Clientes, Orçamentos pasta+params+deleted_at, Histórico Passagens resumo máquina), 🟢 Perdidos no revert (Contas Pagar/Receber conectar ao backend, Comissões botão impressão).
- **Purpose**: Seguir o processo Confirmed Fact29 que funcionou no 🔴1 Passou pela Máquina: reproduzir ao vivo → instrumentar log onde não há causa confirmada → provar causa raiz → corrigir → deploy por item → prova de `/api/version` + teste ao vivo XHR/UI autenticada antes de marcar fechado.
- **Target Users**: Admin e operadores PCP/Financeiro Italy Embalagens (E1), Cartoeste (E2), Oestepack (E3).

## Goals
- Eliminar stacking de páginas e tela branca nas áreas (Central de Custos + Relatórios) com limpeza explícita do container raiz ANTES de todo novo render.
- Restaurar renderização de Amostras Pendentes no mesmo pipeline de OFs por Máquina.
- Garantir layout 100% consistente da tabela OFs por Máquina (Cores/Papel/Previsão sempre visíveis, cor botão Ações estável, colspan 15 colunas em todos os pipelines).
- Corrigir impressão de Compra de Papelão (vincos legíveis) + reconfirmar fluxo PUT/POST salvar funcionando.
- Corrigir cálculo Visão Geral: separar Custo Papelão REAL de Custo das OFs; evitar dupla contagem; criar cards Despesas Fábrica/Ganhos/Lucro corretos com somatório de lançamentos.
- Resolver 🟡 Médios (1-2 deploy cada).
- Conectar Contas Pagar/Receber (frontend já existe completo em localStorage) aos endpoints de backend do plano oficial 434104.
- Provar cada entrega via `/api/version` runtime.patch === timestamp commit + teste XHR autenticado.

## Non-Goals
- Refatorar sistema ERP-ITALY-V2 moderno (fora do escopo; só sistema legado index.html+patch.js+server.js).
- Reescrever router do sistema legado; só adicionar hooks de limpeza de container.
- Mudar arquitetura de banco além das colunas/tabelas mínimas necessárias por item.
- Criar tela nova para Contas Pagar/Receber; apenas conectar frontend existente.
- Implementar funcionalidades que o search confirmou já OK: Projeção de Vendas, Resumo Anual Todas Empresas, Perdas por Operador, Modernizar Operadores, Ordenação PCP, Comissões agrupar por cliente.

## Background & Context
**Causas raiz JÁ PROVADAS via code review/search (não precisa de instrumentação nova para esses)**:

1. **Páginas empilhadas**: `getMainPatchHost()` (patch.js linha ~42150) NÃO limpa `#patch-page-body.innerHTML=''` antes de retornar. Compartilha MESMO singleton container entre Central de Custos, Relatórios, Operadores, Estoque, Compras Papelão. Se render X adiciona filhos e render Y não substitui tudo (ou usa appendChild), conteúdo X permanece visível. Wrapper `window.go()` (patch.js ~58083) não remove `#patch-page-host` quando navega para página nativa.

2. **Amostras Pendentes NÃO RENDER**: `renderOfmaqFinal()` (patch.js ~27668) chama ensureShell/bindShell/loadCanonical/updateToolbar/renderRows MAS NUNCA chama `renderAmostrasSemana(shell)`. Grid permanece placeholder "Carregando amostras...". 4 fallbacks adicionais quebrados: id shell `ofmaq-final-shell` nunca atribuído, window.__ofmaqFinalShell não definida, botão inline Tentar Novamente usa ID errado.

3. **Layout inconsistente OFs por Máquina**: (a) `activeOfRow` (patch.js ~25729) NÃO extrai para top-level `sem_papel`, `papel_comprado`, `previsao_entrega_papel`, então `rowHtml` lê undefined e mostra "— Aguardando". (b) Pipeline ZERO usa colspan=11 em tabela de 15 colunas. (c) Coloração botão Ações: `urgenciaTipo` retorna 'normal' no primeiro render (campos `ofRaw.urg`/`prazoIso` ainda undefined) → azul, depois rerender fica vermelho quando os dados chegam.

4. **Compra de Papelão impressão**: `table.planilha` com `table-layout:fixed` + largura vinco 14% pode truncar; min-width faltando; vincos V5+ font-size 11px podem entrar em margens de impressão. Salvar PUT/POST backend (server.js 27272/27429) delete-all/reinsert consistente.

5. **Visão Geral bug custo_papelão === custo_ofs**: (a) `_ccustosCalcularCustoOfsPorCompetencia` (server.js ~35805) mesmo valor `custo = _ccustosPickCustoOf` atribuído a tanto `of.papelao` (35816) quanto `of.custo_total` (35818). (b) `_ccustosCalcularCustoPapelaoCompetencia` (35836-35841) short-circuit SOMA of.papelao ao invés de consultar `chapas_estoque_v2` (consulta real só roda quando 0 OFs). (c) custoTotalMes = ofs.total_custo + papelao + despesasFabrica (36033) = **2x papelao** + despesas = DUPLA CONTAGEM. (d) Faltam Ganhos (só receita OFs sem lançamentos manuais ganho) e Lucro (não existe card na aba 1).

6. **Sem Papelão não funciona**: 5 causas (early return silencioso sem toast, modal de alterar data obrigatório ao ativar, save só dentro do modal, motivo muda sem_papel de volta, múltiplos handlers conflitantes entre index.html nativo e patch.js).

7. **RONI MEIA VENDA duplicado**: `normalizeVend` (index.html 34611-34618) não dedupe por ID/nome; caminho PCP/Orcamentos não tem dedupe; apenas modal de Conclusão (patch.js) tem. Tabela `vendedores` provavelmente tem 2 linhas "RONI MEIA VENDA"/"RONI (MEIA VENDA)".

8. **Fornecedores categoria**: Campo não existe em NENHUMA camada (banco → server.js fornecedoresPayload() → erp-italy-v2 frontend → index.html legacy). Precisa adicionar coluna + CRUD + tabela + forms.

9. **Mapa Clientes**: 2 implementações (patch.js hub fake vs index.html mapa Leaflet real); sincronia UF→Cidade existe em 3 contextos mas try/catch larga pode silenciar; adicionar/editar cliente via modal nativo.

10. **Orçamentos pasta não persiste**: `_ensureOrcamentosPastasSchema()` (server.js 19273) ALTER TABLE só roda se Supabase permitir; se SQL não aplicou → flag schema_missing = true → pastas disabled no frontend. Sem localStorage fallback.

11. **Params comerciais não recalculam**: (a) `try/catch` silencioso no patch.js injetado (linha ~11725) → se calcRecalc não estiver carregada ainda no momento do input, mudança perdida sem feedback. (b) NÃO há campo de desconto na fórmula `calcPreco` (39301).

12. **orcamentos.deleted_at consultada sem existir**: Coluna deleted_at NÃO existe na tabela `orcamentos` (não no schema SQL). Filtro `!row?.deleted_at` no GET /api/orcamentos (17767) é inócuo (undefined → true → tudo passa). DELETE pasta orçamentos (18083) seleciona `deleted_at` explicitamente → PODE CAUSAR 500 se coluna não existir.

13. **Histórico Passagens sem resumo máquina**: Página existe (index.html 46039) com cards individuais. Falta agrupamento/consolidação POR MÁQUINA (template padrão em patch.js 35365).

14. **Contas Pagar/Receber desconectadas backend**: Frontend COMPLETO (renders, CRUD, modais, filtros, cards resumo) em index.html (38378) usando 100% localStorage. Faltam 11 endpoints API no server.js (plano 434104) + tabelas já existem per Confirmed Fact22.

15. **Comissões impressão botão stub**: `injetarBotaoImprimirComissoes = function(){}` (patch.js 37624) VAZIA. Engine impressão funciona via `window.gerarEImprimirComissoes()`. Só precisa injetar botão real na tela.

## Functional Requirements
Agrupados por prioridade (Confirmed Fact28 atualizado):

### 🔴 CRÍTICOS (5)
**FR-1 Container raiz stacking**: No `getMainPatchHost()` (e similares rrHost), limpar EXPLICITAMENTE `patch-page-body.innerHTML = ''` ANTES de retornar o host. No wrapper `window.go()`, ao navegar para páginas NÃO dinâmicas (não usam `patch-page-host`), forçar `#patch-page-host.style.display='none'` e limpar seu body.

**FR-2 Amostras Pendentes render**: (a) Chamar `renderAmostrasSemana(shell)` NO FINAL de `renderOfmaqFinal()` após `renderRows`. (b) Chamar também no final de `updateToolbar()`. (c) Atribuir `shell.root.id = 'ofmaq-final-shell'` em `bindShell`. (d) Definir `window.__ofmaqFinalShell = function(){return shell;}` e `window.__shellRef = shell`. (e) Corrigir botão inline erro para usar `ofmaq-final-root` em vez de `ofmaq-final-shell`.

**FR-3 Layout consistente OFs por Máquina**: (a) No return de `activeOfRow` adicionar campos top-level: `sem_papel: !!of.sem_papel||!!of.sem_papelao`, `papel_comprado: of.papel_comprado ?? of.papelComprado ?? null`, `previsao_entrega_papel: of.previsao_entrega_papel ?? of.previsaoEntregaPapel ?? ''`. (b) No `rowHtml` adicionar fallback `|| item.ofRaw?.campo` para cada campo não encontrado. (c) Pipeline ZERO colspan de 11 para 15. (d) Emergency view colspan de 11 para 15. (e) `urgenciaTipo` considerar campos undefined como 'normal' e estabilizar entre renders (não depender de ofRaw.urg undefined no primeiro render vs. depois false).

**FR-4 Compra de Papelão**: (a) Impressão: ajustar largura coluna vincos no `<colgroup>` de 14% para 18%, adicionar `min-width:160px` na td. (b) Garantir que V5+ aparecem (font-size 11px → 12px + padding-bottom). (c) Teste ao vivo: criar compra nova, salvar, reabrir, confirmar dados salvos corretamente (inclui vincos V1-V6).

**FR-5 Visão Geral cards corretos e reorganizados**: (a) Corrigir `_ccustosCalcularCustoOfsPorCompetencia`: `of.custo_total` deve incluir `outros_custos` reais (hoje sempre 0); manter `of.papelao` = custo de papelão separadamente. (b) Corrigir `_ccustosCalcularCustoPapelaoCompetencia`: **remover short-circuit** que soma of.papelão → sempre consultar `chapas_estoque_v2` real no período (fallback OFs só se query chapas falhar). (c) `custoTotalMes` formula: `custo_ofs_distinto + custo_papelao_real + despesasFabrica + perdas.valor` — SEM dupla contagem. (d) Campo NOVO `ganhos` = `receita_ofs (vendas OFs concluídas) + lancamentos_manuais_ganhos_total` (lançamentos marcados como tipo=categoria 'ganho'/'receita'). (e) Campo NOVO `lucro_mes` = `ganhos - custoTotalMes`. (f) **REORGANIZAR PARA 7 CARDS EXATOS** (definição usuário, ordem): 1.Despesas da Fábrica (já existe + fórmula ajustada), 2.Ganhos, 3.Lucro do Mês, 4.Custo Papelão REAL, 5.Custo das OFs (distinto de papelão), 6.Receita Bruta OFs, 7.Perdas (qtd e valor R$). (g) Cada lançamento novo criado soma no lado certo sem duplicar categoria: despesa → Despesas, ganho/receita → Ganhos, perda → Perdas. **(h) LEFT JOIN Gastos por Centro de Custo: mostrar SEMPRE os 7 centros cadastrados (Produção, Administrativo, Comercial, Expedição, Estoque, Manutenção, Veículos/Logística) com R$0,00 se não houver lançamento — nunca omitir um centro ativo.**

### 🟡 MÉDIOS (8)
**FR-6 Botão Sem Papelão funciona (Só caminho rápido, SEM modal)**: (a) Adicionar toast/feedback no early return `!of` (nunca mais silencioso). (b) **Remover modal de alterar data** do fluxo; quando `novo === true` SEMPRE salvar `sem_papel: true` DIRETO via `persistPatch(id, { sem_papel: true })`, sem abrir `openAlterarDataPatched`, sem confirmação extra, sem pedir motivo. (c) Unificar handlers para usar sempre o mesmo caminho patch.js global `window.toggleSemPapelOf` (tanto botão card quanto bottom sheet quanto modal nativo agora chamam a mesma função global rápida). (d) Garantir que `sem_papel: true` é persistido em 1 clique, sem qualquer condição extra de fechamento de modal.

**FR-7 RONI MEIA VENDA dedupe**: (a) Em `normalizeVend` normalizar nome: remover parenteses, pontos, espaços duplicados, uppercase para comparação (mantem display original). (b) Aplicar `.dedupe()` por ID + por NOME normalizado em todos os 4 pontos: `VENDEDORES = ...map(normalizeVend)` iniciais 34317 e 35938, render select PCP 5709, modal OF/Cadastro 15677, Orçamento 4022, Agenda 52683.

**FR-8 Fornecedores categoria (5 opções fixas, validação fechada)**: (1) Banco: `ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Outros';` adicionar também `ALTER TABLE ... ADD CONSTRAINT fornecedores_categoria_check CHECK (categoria IN ('Papelão','Água','Luz','Internet','Outros')) NOT VALID;` no boot SQL. (2) Backend `fornecedoresPayload()`: adicionar `if (b.categoria !== undefined) { const validas = ['Papelão','Água','Luz','Internet','Outros']; out.categoria = validas.includes(String(b.categoria||'').trim()) ? String(b.categoria).trim() : 'Outros'; }` (validação runtime; inválido = fallback 'Outros', nunca rejeita). (3) Frontend erp-italy-v2 `fornecedores.js`: (a) adicionar coluna no grid: `{ key: 'categoria', label: 'Categoria' }`. (b) Form onAdd: `<select>` campo categoria com APENAS 5 options fixas ['Papelão','Água','Luz','Internet','Outros'], default 'Outros'. (c) Form onEdit mesmo select carregado com valor atual. Valor NUNCA é texto livre.

**FR-9 Mapa Clientes sincronia e add/edit fácil**: (a) Garantir que `_patchCliFormularioSelects` não silencia erros (adicionar console.log com prefixo MAPCLI). (b) Sincronia UF→Cidade adicionar fallback se select não for `<select>` ainda. (c) Botão no header do mapa "＋ Cliente" direto, sem precisar sair do mapa. (d) Edição fácil: clique no marcador do cliente abrir mini-modal de edição inline (campos chave).

**FR-10 Orçamentos pasta persiste**: (a) Garantir schema SQL `_ORCAMENTOS_PASTAS_SCHEMA_SQL` (server.js 19035) é SEMPRE executado no boot (não só probe condicional) — mover para execução garantida. (b) Adicionar fallback localStorage para `__orcPastasData` caso API retorne erro schema_missing. (c) Garantir `fin_ok` não bloqueia loadFolders (apenas bloqueia mutações). (d) Ao salvar orçamento, sempre re-sincronizar `pasta_id` no response.

**FR-11 Parâmetros comerciais recalculam tempo real**: (a) Remover `try/catch` silencioso no patch.js injetado (11725) → mostrar toast erro se calcRecalc undefined. (b) Adicionar `onfocus` que verifica se calcRecalc está definido, espera se não estiver, e re-aplica mudança. (c) Campo DESCONTO na fórmula: adicionar `calc-desconto` (valor em %) à lista de params comerciais, adicionar no `calcPreco()` subtraindo do preço de venda (após todos outros cálculos), adicionar oninput recalc.

**FR-12 orcamentos.deleted_at**: (1) Banco: `ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;` no boot SQL server.js junto com o schema pastas. (2) Backend: incluir `deleted_at` em `colunasCandidatas` do GET /api/orcamentos (17714-17718). (3) Incluir `.is('deleted_at', null)` no Supabase query filter (evitar filtro só em memória).

**FR-13 Histórico Passagens resumo por Máquina**: (a) Criar função `renderHistoricoPassagensMaquina()` que agrega resultado de `/api/passagens/historico` por máquina (template patch.js:35365). (b) Mostrar CARDS/TABELA no TOPO de `page-historico-passagens` antes dos cards individuais: colunas = Máquina, Nº Passagens, Qtd Caixas, Tempo Total (min), Valor Total. (c) Cada card clicável filtra o histórico para só aquela máquina.

### 🟢 PERDIDOS NO REVERT (2 itens úteis)
**FR-14 Contas Pagar/Receber backend conectado EM ABAS 6 e 7 DA CENTRAL DE CUSTOS (Confirmed Fact16)**: (a) Implementar 11 endpoints API no server.js conforme plano `.trae/documents/central_custos_434104_contas_pagar_receber_plan.md`: GET/POST/PUT/DELETE + baixas para contas_pagar e contas_receber. (b) Integração UI: a **página de Contas Pagar individual (index.html legado)** vira **aba 6 da Central de Custos** (dentro do `renderPageCentralCustos()` usando tabs 1.Visão Geral 2.Lançamentos 3.Centros 4.Custo por OF 5.Histórico 6.Contas Pagar 7.Contas Receber). Mesma coisa para Contas Receber como aba 7. Reaproveitar os renders CRUD existentes (modais, tabelas, filtros, cards resumo) de index.html, só movendo/encapsulando para serem o conteúdo das abas 6 e 7. (c) Bind frontend fetch: trocar localStorage por `fetch()` para endpoints novos; manter localStorage como fallback offline se request falhar. (d) Garantir fk empresa_id, autorização por empresa, paginação, filtros por status/vencimento em ambos os lados (aba 6 e aba 7).

**FR-15 Comissões botão impressão**: Substituir stub `injetarBotaoImprimirComissoes` (patch.js:37624) por implementação real: encontrar container de botões na tela Comissões, injetar `<button>` "🖨️ Imprimir Relatório" que chama `window.gerarEImprimirComissoes()`, e botão "📥 Excel" já existente continua.

---

### NOVOS FRs (adicionados pós-aprovação inicial, usuários reportados 16/09)
**FR-16 Jarvis trava sistema inteiro ao abrir**: (a) Causa raiz provada: `keepJarvisOpen(ev)` no CAPTURE phase (patch.js:18678) executa `stopImmediatePropagation` e `preventDefault` em cliques no `#assist-overlay` — remove o listener de fechamento nativo e nunca mais deixa fechar. Além disso, remove o `overlay.onclick` original. **Corrigir**: (1) Remover completamente a guard `keepJarvisOpen` que captura clique e não deixa fechar. (2) Restaurar comportamento nativo: clique fora do painel (no overlay escuro) FECHA o Jarvis normalmente. (3) Confirmar que botão "X" do `#assist-panel` tem event listener e funciona, se não tiver bindar novamente. (4) Adicionar `Esc key` listener que fecha o Jarvis (padrão do sistema para todos modais). (5) Overlay só permanece aberto enquanto usuário interage com chat; qualquer clique fora fecha sem "tela escura travada".

**FR-17 Aba 4 Custo por OF (Central de Custos) não abre / trava**: Causa raiz provada: handler `/api/relatorios/custos` (server.js:16857) usa `.limit(10000)` + `_selectCompatRows` que faz até 16 retries de query com colunas removidas → Railway STATEMENT TIMEOUT ≈ 30s mata a request. **Corrigir**: (1) Instrumentar com logs `__CCUSTOS_TRACER_COF__` (tempo de cada query, nº retries, nº de linhas) no handler. (2) Adicionar `.limit(1000)` em vez de 10000 (900 ≤ Railway batchSize aprendizado 🔴1). (3) Se ainda demorar, implementar paginação (limit/offset) com totalizador parcial por chunk. (4) Frontend `loadCustoOFs` adiciona timeout 25s e toast erro amigável se request cancelar. (5) Não bloquear render de abas 1/2/3/5 se a 4 falhar (Promise.all → Promise.allSettled).

**FR-18 Imprimir relatório Lançamentos (Aba 2 Central de Custos)**: (1) Adicionar botão "🖨️ Imprimir" no toolbar de Aba 2 Lançamentos (hoje toolbar só tem ➕ Novo, 🔁 Gerar Recorrentes, input busca). (2) Handler no `bindEventos` igual ao das abas 1 e 4 que já usam `rrOpenPrint(cfg)` (padrão sistema). (3) `cfg` de impressão: colunas = Data, Competência, Descrição, Categoria, Centro de Custo, Fornecedor, Valor R$, Forma de Pagamento; considera apenas a lista FILTRADA atual (filtro de busca, competência, tipo, centro aplicados). (4) Mesmo CSS de impressão existente para abas 1 e 4 (header, totalizadores, linhas zebradas, largura A4 landscape).

**FR-19 RLS ativo em 6 tabelas — garantir sem quebra**: Aviso de usuário: RLS ativado no Supabase Advisor em centros_custo, lancamentos_custos, lancamentos_recorrentes, contas_pagar, contas_receber, baixas_contas. Backend usa SERVICE_ROLE_KEY = por design bypassa RLS. **Ação**: Instrumentar 1 teste de smoke extra em cada task envolvendo essas tabelas, ou seja, GET /api/central-custos/visao-geral e GET /api/contas-pagar cada um sem 404/409/401/500 para confirmar o bypass SERVICE_ROLE está funcionando. Se alguma quebrar, o primeiro lugar a checar é RLS.

**FR-20 93% erro Postgres em 24h (causa compartilhada) — investigação logs**: Ação compartilhada NÃO É TASK DEPLOY (sem causa confirmada ainda). Processo: usuário colar texto dos 3-5 erros mais frequentes do Supabase Logs → Postgres Logs (Level=error). Equipe analisa texto e cria batch task corretiva. (Exemplo: se erro for "column deleted_at does not exist" 400x = resolve junto FR-12 orcamentos.deleted_at; se for "relation xxx does not exist" = schema missing, etc.)

---

## Itens CANCELADOS por já estarem implementados per search (Confirmed Fact28):
- ❌ (Cancelado, já OK) Relatório de Projeção de Vendas: endpoint e tela completo no sistema (patch.js L29504), NÃO precisa ação.
- ❌ (Cancelado, já OK) Resumo Anual "Todas as Empresas": implementado `emp_id=ALL` soma os 3 UUIDs, select ALL no frontend já existe (L3911).
- ❌ (Cancelado, já OK) Relatório de Perdas por Operador: tela L3765 + endpoint L16323 completos.
- ❌ (Cancelado, já OK) Modernizar Operadores: tela nova toggle ativo + máquina principal + sugestão automática (L62336).
- ❌ (Cancelado, já OK) Ordenação da PCP/Programação: toggle asc/desc headers com `state.ofsSort` (L63299).
- ❌ (Cancelado, já OK) Comissões agrupar por cliente: modo de agrupamento default já por cliente (Confirmed Fact28), só falta botão impressão (FR-15).

## Non-Functional Requirements
- **NFR-1 Deploy por item**: Cada fix funcional vira um commit separado com 5 bumps de versão (Confirmed Fact5), diff --stat ≤ 500 linhas. Nenhum deploy conjunto.
- **NFR-2 Prova deploy obrigatória**: `/api/version` runtime.patch === timestamp do commit; testar em aba anônima autenticada após cada deploy.
- **NFR-3 Smoke 6 endpoints pós deploy**: Nenhum status ≥ 500 após cada deploy (mesmo padrão 🔴1: ofs, fornecedores, passagens/historico, maquinas, usuarios, amostras todos 401 esperado sem 5xx).
- **NFR-4 Prova ao vivo XHR/UI autenticada**: Após cada fix 🔴/🟠, executar teste ao vivo em view autenticada do browser MCP (mesmo processo Confirmed Fact29).
- **NFR-5 Nível de confiança**: Apenas deployar após causa raiz PROVADA; não deployar por "suposição".
- **NFR-6 Compatibilidade reversa**: Nenhuma remoção de campos existentes nos payloads JSON; adições apenas.
- **NFR-7 Railway timeout**: Handlers GET que consultam Supabase em tabelas grandes sempre usar batchSize ≤ 900 e filtros de data (aprendizado 🔴1).

## Constraints
- **Technical**: Nunca conectar Supabase/Railway via MCP/integração (Confirmed Fact2). Schema/colunas confirmar por whitelist server.js ou SQL Editor Railway.
- **Technical**: Nunca editar index.html exceto 2 timestamps inline de versão no mesmo commit (Confirmed Fact4). Frontend fix em patch.js.
- **Business**: Deploy automático Railway a cada push origin/main. Timestamp novo commit SEMPRE > `20260916434132` (Confirmed Fact5).
- **Business**: Ordem de implementação RÍGIDA = Confirmed Fact28 (🔴 → 🟠 → 🟡 → 🟢). Itens OK per search (Projeção, Resumo Anual, Perdas Operador, Modernizar Operadores, Ordenação PCP, Comissões agrupar cliente) EXCLUÍDOS do escopo.
- **Dependencies**: UUIDs empresas fixos Confirmed Fact6 (E1=Italy, E2=Cartoeste, E3=Oestepack).

## Assumptions
- (A1) Todos os itens marcados como "já OK" no search (Projeção de Vendas, Resumo Anual Todas Empresas, Perdas por Operador, Modernizar Operadores, Ordenação PCP, Comissões agrupar por cliente) estão realmente funcionando e NÃO serão tocados (apenas se um bug aparecer durante a implementação).
- (A2) Tabelas `contas_pagar` e `contas_receber` já existem no banco conforme Confirmed Fact22 — não precisa de CREATE TABLE, só endpoints.
- (A3) `chapas_estoque_v2` tabela existe para consultar o custo real de papelão por competência (usado em FR-5b fallback).
- (A4) Usuário sabe senha Financeiro `1234` (Confirmed Fact9).

## Open Questions (TODAS RESPONDIDAS — ver respostas abaixo)
- [x] **OQ-FR-5f — reorganização dos cards Visão Geral**: **RESPOSTA USUÁRIO = 7 cards EXATOS** (ordem: 1.Despesas, 2.Ganhos, 3.Lucro, 4.Custo Papelão, 5.Custo OFs, 6.Receita Bruta OFs, 7.Perdas). Ver FR-5 atualizado.
- [x] **OQ-FR-6b — caminho Sem Papelão**: **RESPOSTA USUÁRIO = "Só rápido, sem modal"** (NÃO abre modal de alterar data de forma alguma). Todo clique marca sem_papel=true direto via persistPatch. Ver FR-6 atualizado.
- [x] **OQ-FR-8 — categoria Fornecedores**: **RESPOSTA USUÁRIO = 5 opções fixas ENUM/CHECK** ['Papelão','Água','Luz','Internet','Outros'] com validação backend e select fechado no frontend. Valor inválido sempre cai para 'Outros'. Ver FR-8 atualizado.
- [x] **OQ-FR-14 — Contas Pagar/Receber estrutura**: **RESPOSTA USUÁRIO = "Abas na Central de Custos" (Confirmed Fact16)**. Integração em abas 6.Contas Pagar e 7.Contas Receber DENTRO do `renderPageCentralCustos()`, reaproveitando renders/tabelas já existentes do index.html legado. Não são mais páginas independentes (a menos que usuário também queira ambas — porém resposta foi só abas na Central). Ver FR-14 atualizado.

## Acceptance Criteria

### AC-1: Container raiz sem stacking (duas páginas nunca aparecem juntas)
- **Type**: `rule`
- **Given**: View autenticada, patch versão correta carregada
- **When**: Navegar: Central de Custos → Relatórios → OFs por Máquina → Central de Custos → Amostras (5 navegações sequenciais com intervalo de 2s)
- **Then**: Em cada passo, `document.querySelectorAll('#patch-page-host, [id^="page-"]').filter(e => e.offsetParent !== null).length === 1` (apenas 1 container visível). Conteúdo anterior do patch-page-host não permanece como filho do DOM.
- **Pass Condition**: Navegação 5 vezes consecutivas, cada uma retorna length 1, sem sobreposição visível no snapshot.
- **Evidence**: Browser MCP: evaluate `visible pages length` + 2 snapshots (Central de Custos vs. Relatórios) provando não há conteúdo da página anterior.

### AC-2: Amostras Pendentes renderiza ao entrar em OFs por Máquina
- **Type**: `rule`
- **Given**: Backend `/api/amostras` retorna N linhas (confirmado per enunciado do usuário "backend confirmado retornando dados")
- **When**: Entrar em página OFs por Máquina, esperar 8s (poll inicial + loadCanonicalRows + updateToolbar)
- **Then**: `data-ofmaq-amostras-count` badge NÃO é "0 pendente(s)" se houver amostras abertas. Grid `[data-ofmaq-amostras-grid]` contém `<table>` com linhas (NÃO tem texto "Carregando amostras..." nem "Nao foi possivel carregar").
- **Pass Condition**: `grid.querySelector('table') !== null && badge.textContent !== '0 pendente(s)'` quando há amostras.
- **Evidence**: Browser MCP snapshot tela OFs por Máquina mostrando painel Amostras Pendentes com linhas + evaluate badge count.

### AC-3: Layout OFs por Máquina estável após 2 renders
- **Type**: `rule`
- **Given**: View OFs por Máquina carregada
- **When**: Roda `renderRows(shell, true)` → espera 2s → roda `renderRows(shell, true)` de novo
- **Then**: (a) Colunas sempre 15 (thead tr.children.length === 15). (b) Coluna "Cores" NÃO tem "Sem Impressão" em OFs cujo ofRaw.cores tem valores. (c) Coluna "Papel / Previsão" NÃO mostra "— Aguardando" em OFs com ofRaw.papel_comprado setado. (d) Colspan empty rows = 15. (e) Botão Ações cor NÃO alterna entre renders para mesma OF (data-urgente estável).
- **Pass Condition**: Todos 5 sub-itens (a-e) verificados após 2 renders.
- **Evidence**: Browser MCP evaluate count ths + colspan value + check 2 OFs específicas com cores e papel_comprado conhecidos + botão data-urgente hash.

### AC-4: Compra de Papelão impressão mostra vincos + salvar funciona
- **Type**: `rule` (2 partes: impressão + salvar)
- **Given**: Tela Compra de Papelão, criar compra teste nova
- **When**: (1) Preencher item com V1 V2 V3 V4 V5 V6, Salvar (POST nova) → reabrir (GET por id). (2) Clicar Imprimir → inspecionar HTML de impressão retornado.
- **Then**: (1) Reabrir mostra V1-V6 intactos (nenhum vinco perdido). (2) HTML impressão tem largura vinco ≥ 16% e valores V1-V4 aparecem em V > 14px font-size, V5+ aparecem sem corte.
- **Pass Condition**: (a) 6 vincos presentes no payload após reabrir; (b) coluna vinco HTML impressão ≥ 16%.
- **Evidence**: Browser MCP evaluate POST criar → GET buscar → assert 6 vincos; evaluate `_compraPapelaoBuildCompraPrintHtmlFromPayload` → extrair largura% col vinco + texto V5+.

### AC-5: Visão Geral cards valores corretos (sem dupla contagem + 3 novos campos)
- **Type**: `rule`
- **Given**: Competência corrente setembro/2026 tem OFs concluidas + lançamentos manuais + entradas papelão em chapas_estoque_v2 (per Confirmed Fact28 Visão Geral já provou R$471k receita, R$206k custo em 434125)
- **When**: Disparar `GET /api/central-custos/visao-geral?competencia=2026-09` via XHR autenticado
- **Then**: (a) `cards.custo_ofs !== cards.custo_papelao` (DIFERENTES — não são o mesmo valor exato de antes). (b) `cards.custo_total_mes === round(cards.custo_ofs + cards.custo_papelao + cards.despesas_fabrica)` (sem dupla contagem, não 2x). (c) Existe campo `cards.ganhos` na resposta, numérico, > 0. (d) Existe campo `cards.lucro_mes` na resposta, numérico, = `round(cards.ganhos - cards.custo_total_mes)`.
- **Pass Condition**: (a)(b)(c)(d) all true.
- **Evidence**: Browser MCP XHR response parse JSON → assert campos diferentes, fórmula bate, novos campos existem.

### AC-6: Botão Sem Papelão sem early return silencioso
- **Type**: `rule`
- **Given**: PCP com OF carregada, botão Sem Papelão visível
- **When**: Clicar em botão Sem Papelão em OF com ID conhecido
- **Then**: (a) Nenhum early return sem toast de feedback. (b) OF passa a ter `sem_papel === true` após clique (verificar via fetch OF por id). (c) Se usuário optar por caminho rápido, salva sem abrir modal de Alterar Data.
- **Pass Condition**: (a) toast visível + (b) sem_papel=true no fetch seguinte.
- **Evidence**: Browser MCP toast snapshot + GET /api/ofs/:id antes/depois do clique.

### AC-7: Vendedores sem duplicados em TODOS os dropdowns
- **Type**: `rule`
- **Given**: Página PCP, Modal Nova OF, Orçamentos, Agenda
- **When**: Em cada tela, buscar `<select>` de vendedores → contar opções com nome normalizado contendo "RONI"
- **Then**: Contagem === 1 para RONI (MEIA VENDA) em TODOS os 4 dropdowns. Nenhuma duplicação.
- **Pass Condition**: 4 telas × RONI count = 1.
- **Evidence**: Browser MCP evaluate cada dropdown options.map(nome_normalizado).filter(n.includes('RONI')).length === 1.

### AC-8: Fornecedores categoria salva e persiste
- **Type**: `rule`
- **Given**: Coluna categoria existe no banco (APÓS migration apply)
- **When**: (1) POST novo fornecedor com categoria "Papelão". (2) PUT fornecedor mudando categoria para "Água". (3) GET /api/fornecedores
- **Then**: Resposta GET retorna o fornecedor com `categoria === 'Água'` e a coluna aparece na tabela frontend + select add/edit.
- **Pass Condition**: (a) backend persiste o campo + (b) tabela erp-italy-v2 exibe coluna Categoria + (c) form add/edit tem select funcional.
- **Evidence**: Node fetch smoke POST → PUT → GET JSON parse; Browser MCP tela Fornecedores snapshot.

### AC-9: Mapa Clientes sem erros silenciados + edição fácil
- **Type**: `rubric`
- **Dimension**: Robustez e UX do Mapa Clientes
- **Scale**: 1-5
- **Anchors**: 1 = erros largamente silenciados, sincronia UF→Cidade não funciona; 3 = funciona sem erros logs, edição via modal nativo; 5 = erros logados com prefixo MAPCLI, botão + Cliente direto no mapa, clique marcador abre mini-modal inline edição.
- **Pass Threshold**: ≥ 4
- **Evidence**: Browser MCP evaluate console entries prefix MAPCLI > 0 durante 1 operação de erro simulado; snapshot botão +Cliente visível.

### AC-10: Orçamentos pasta persiste após recarga
- **Type**: `rule`
- **Given**: Schema orcamentos_pastas aplicado (sem schema_missing flag true)
- **When**: (1) Criar pasta "Teste Roadmap" → vincular um orçamento a ela. (2) Recarregar página completa Ctrl+F5
- **Then**: Após recarga, pasta "Teste Roadmap" aparece no painel #orc-pastas-panel e o orçamento vinculado mostra pasta correta no select.
- **Pass Condition**: localStorage e Supabase ambos tem a pasta e o vínculo pasta_id correto.
- **Evidence**: Browser MCP 2 passos (cria → recarrega) → snapshot pasta panel + evaluate pasta_id do orçamento.

### AC-11: Parâmetros comerciais recalculam (inclui desconto)
- **Type**: `rule`
- **Given**: Calculadora orçamentos aberta com valores conhecidos
- **When**: (1) Digitar 5% em calc-mg → esperar 300ms → ver preço mudado (sem try/catch silencioso). (2) Digitar 3% em novo campo calc-desconto → preço cai correspondentemente.
- **Then**: Ambos (1) e (2) produzem alteração no valor total calculado. Nenhum erro silenciado.
- **Pass Condition**: Preço após cada digitação diferente do inicial e cálculo matemático bate (valores conhecidos).
- **Evidence**: Browser MCP evaluate: digitar evento dispatch change → ler valor calculado antes/depois 100ms.

### AC-12: orcamentos.deleted_at filtra corretamente
- **Type**: `rule`
- **Given**: Coluna deleted_at existe (APÓS migration)
- **When**: (1) Soft delete 1 orçamento (set deleted_at = now()) via SQL. (2) GET /api/orcamentos?limit=all
- **Then**: Orçamento deletado NÃO aparece no array response. Filtro aplicado via Supabase query (não só memória).
- **Pass Condition**: Orçamento test com deleted_at IS NOT null ausente de resultado GET.
- **Evidence**: Node smoke fetch: SQL set → fetch → assert id ausente.

### AC-13: Histórico Passagens tem resumo por máquina (cards no topo)
- **Type**: `rule`
- **Given**: Página Histórico de Passagens, range 1 mês (há passagens de múltiplas máquinas per 🔴1 >2200)
- **When**: Carregar página, esperar 5s para conclusão fetch + render
- **Then**: (a) Container com class `historico-resumo-maquina` EXISTE no DOM antes dos cards individuais. (b) Mostra N cards/rows = número máquinas distintas no período (>= 4: CORTE, IMP 01, Riscador, etc.). (c) Clicar em card de máquina filtra o histórico abaixo (apenas aquela máquina).
- **Pass Condition**: (a)(b)(c) true.
- **Evidence**: Browser MCP evaluate resumo container exists + children.length >= 4 + clique em 1 card filtra resultados.

### AC-14: Contas Pagar/Receber conectadas (não localStorage vazio)
- **Type**: `rule`
- **Given**: Tabelas contas_pagar / contas_receber existem
- **When**: (1) Criar nova Conta a Pagar via frontend UI (preencher + salvar). (2) Recarregar página. (3) Contar linhas tabela.
- **Then**: Nova conta aparece após recarga (persistida via backend, não só localStorage). Endpoints POST, GET, PUT, DELETE todos retornam status < 500.
- **Pass Condition**: Após reload, id da nova conta aparece em `GET /api/contas-pagar`.
- **Evidence**: Node smoke POST → GET by id; Browser MCP UI snapshot após reload.

### AC-15: Comissões tem botão Imprimir funcional
- **Type**: `rule`
- **Given**: Página Comissões carregada com dados.
- **When**: Buscar `<button>` com texto contendo "Imprimir" no container de botões comissões.
- **Then**: (a) Botão existe (não é stub) e (b) onclick handler chama `window.gerarEImprimirComissoes` via console.log ou nova janela aberta.
- **Pass Condition**: button exist + onclick handler bound correto.
- **Evidence**: Browser MCP evaluate querySelector('button...Impress') !== null + onclick type check.

### AC-16: Jarvis fecha sem travar (overlay não bloqueia o sistema)
- **Type**: `rule`
- **Given**: Usuário logado ADMIN, qualquer página do sistema.
- **When**: (1) Clicar no FAB do Jarvis para abrir chat. (2) Clicar FORA do painel chat (overlay escuro). (3) Pressionar tecla `Esc`. (4) Clicar no botão "X" do painel.
- **Then**: Todos os 4 eventos FECHAM o Jarvis: `#assist-overlay.style.display === 'none'` e `#assist-panel.classList.contains('open') === false`. NÃO HÁ tela escura travada; foco é liberado para o sistema.
- **Pass Condition**: 4 eventos → overlay some, usuário volta a interagir com sistema.
- **Evidence**: Browser MCP evaluate após cada ação. `!document.getElementById('assist-overlay') || document.getElementById('assist-overlay').style.display !== 'block'`.

### AC-17: Aba 4 Custo por OF abre em < 15s sem erro 5xx no Railway
- **Type**: `rule`
- **Given**: Central de Custos aberta, competência corrente setembro/2026.
- **When**: Clicar aba 4 "Custo por OF". Esperar carregar.
- **Then**: (a) XHR `/api/relatorios/custos` retorna `status 200` em < 25s; (b) Tabela renderiza pelo menos 1 OF (ou mensagem "Sem registros" se 0); (c) Render de abas 1/2/3/5 não é bloqueado se a 4 falhar.
- **Pass Condition**: status 200 + tabela renderizada ou msg zero.
- **Evidence**: Browser MCP evaluate XHR status 200 + tbody rows ≥0.

### AC-18: Aba 2 Lançamentos tem botão Imprimir → rrOpenPrint exporta colunas corretas
- **Type**: `rule`
- **Given**: Central de Custos, aba 2 Lançamentos aberta, filtro competência aplicado.
- **When**: (1) Verifica botão "Imprimir" existe no toolbar. (2) Clica no botão → handler chama `rrOpenPrint(cfg)` com colunas [Data, Competência, Descrição, Categoria, Centro, Fornecedor, Valor R$, Forma Pag].
- **Then**: (a) Botão existe visível toolbar; (b) handler click existe; (c) `window._buildStyledPrintHtml` é chamado (não throw) — sem precisar imprimir de fato.
- **Pass Condition**: botão + handler correto, `rrOpenPrint` não throw.
- **Evidence**: Browser MCP evaluate.

### AC-19: Visão Geral — 7 CENTROS DE CUSTO aparecem TODOS (não só 2)
- **Type**: `rule`
- **Given**: Central de Custos, aba 1 Visão Geral, seed dos 7 centros ativos (PROD, ADM, COMER, EXP, EST, MAN, LOG).
- **When**: Montar `gastosPorCentro` (handler visao-geral).
- **Then**: Array de saída `.length === 7` exato. Os centros sem lançamento aparecem com `valor: 0` ("R$ 0,00"). Nenhum centro ativo é omitido.
- **Pass Condition**: 7 items no array; nenhum id centro ativo faltando.
- **Evidence**: Node smoke (POST /api/central-custos/visao-geral → verify 7 ids), browser evaluate `.gastos-por-centro .card-centro, .gastos-por-centro tr` length ≥ 7.

### AC-20: RLS não quebra Central de Custos + CP/CR (SERVICE_ROLE bypass)
- **Type**: `rule`
- **Given**: RLS ativado nas 6 tabelas (centros_custo, lancamentos_custos, lancamentos_recorrentes, contas_pagar, contas_receber, baixas_contas) no Supabase; backend SERVICE_ROLE_KEY.
- **When**: GET /api/central-custos/visao-geral e GET /api/contas-pagar e GET /api/contas-receber.
- **Then**: Nenhum retorna 403/409/5xx. Todos retornam <400 (200 com dados ou 200 com array vazio, 401 anônimo esperado). SERVICE_ROLE bypass RLS confirmado.
- **Pass Condition**: nenhum status 403, 409 ou 5xx.
- **Evidence**: smoke extra junto smoke 6 em cada deploy T5, T6, T15.

### AC-21: "Custo Papelão" !== "Custo das OFs" (valores distintos, R$213k não iguais)
- **Type**: `rule`
- **Given**: Visão Geral set/2026, 2245 OFs concluídas.
- **When**: Carregar visão geral → valores exibidos nos cards 4 e 5.
- **Then**: `custo_papelao !== custo_ofs` (ou no mínimo Math.abs(papelao - ofs)/max(ofs,1) > 0.01 — 1% ou mais diferente). Não são exatamente iguais como era antes (R$213.118,52 ambos).
- **Pass Condition**: diferença > 1% entre os dois cards, ou pelo menos não iguais em centavos.
- **Evidence**: Browser MCP evaluate pegar o texto dos 2 cards e comparar valores numéricos (parse BR curr).

---

## Mapeamento FR → AC:
| FR | ACs | Deploy Task |
|----|-----|-------------|
| FR-1 Container stacking | AC-1 | T1 (434133) |
| FR-2 Amostras | AC-2 | T2 (434134) |
| FR-3 Layout OFs | AC-3 | T3 (434135) |
| FR-4 Compra Papelão | AC-4 | T4 (434136) |
| FR-5 Visão Geral + 7 centros | AC-5 (7cards) + AC-19 (7centros) + AC-21 (≠custos) | T5 + T6 (434137 + 434138) |
| FR-6 Sem Papelão | AC-6 | T7 (434143) |
| FR-7 RONI | AC-7 | T8 (434144) |
| FR-8 Fornecedores | AC-8 | T9 (434145) |
| FR-9 Mapa Cli | AC-9 | T10 (434146) |
| FR-10 Orç pasta | AC-10 | T11 (434147) |
| FR-11 Params | AC-11 | T12 (434148) |
| FR-12 Orc deleted_at | AC-12 | T13 (434149) |
| FR-13 Histórico Máq | AC-13 | T14 (434150) |
| FR-14 CP/CR | AC-14 + AC-20 | T15 (434151 + 434152) |
| FR-15 Comissões | AC-15 | T16 (434153) |
| FR-16 Jarvis trava | AC-16 | T17 (434139) |
| FR-17 CustoPorOF trava | AC-17 | T18 (434140) |
| FR-18 Imprimir Lanc | AC-18 | T19 (434141) |
| FR-19 RLS bypass | AC-20 | smoke extra em T5,6,15 |
| FR-20 93% Postgres | N/A (investigação, sem deploy até causa confirmada) | Ação paralela |
