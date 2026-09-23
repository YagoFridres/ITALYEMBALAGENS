# Tasks: Pacote 8-Itens — Implementação em 4 Commits Sequenciais (~300L cada, Fact3)

Ordem gating: commit N concluído e deploy MATCH no Railway, só então começa commit N+1.
Bumps monotônicos Fact5 obrigatórios por commit.

---
## COMMIT 1: OFs por Máquina + Histórico Passagens (Bump timestamp T1 = 20260923201000)

### Descrição
Corrigir ações do menu Ações OFs por Máquina (Sem Papelão persistência, Urgente sincronia, Ver Todas Máquinas data dinâmica, Passou pela Máquina refreshless) + refletir no Histórico Passagens.

**Estimativa linhas**: ~280L (180 front patch.js/index.html + 100 back server.js normalizações + 4 arquivos bumps 5pts)

### Tarefas
#### Task 1.1 — Ver Todas as Máquinas data dinâmica
- Status: pending
- Lê: [index.html](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L6548-L6578) (setFiltroOFsMaquina), [index.html:11184-11217](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L11184-L11217) (render filter)
- Escreve: index.html ou patch.js wrapper
- Mudança: Ao clicar "Todas as máquinas" ou "", aplicar `_filtroOFsMaqData` ativo e filtrar máquinas existentes no período, não hardcoded.
- Dependências: —

#### Task 1.2 — Sem Papelão persistência visual (refresh não perde badge)
- Status: pending
- Lê: [patch.js:5035-5049](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L5035-L5049) detect badge, [patch.js:4904-4996](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L4904-L4996) 1-clique toggle, [index.html:10187](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L10187) badge
- Escreve: patch.js `_normSemPapel` unificado, aplicado tanto ao render OFs Máquina quanto ao data load
- Mudança: Garantir que badge lê `sem_papel, sem_papelao, 1, "1"` normalizados ao inicializar `OFS` e ao atualizar cache.
- Dependências: Task 1.1

#### Task 1.3 — Marcar Urgente sincroniza ambas colunas + visual
- Status: pending
- Lê: [server.js:4301-4306](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L4301-L4306) (urg↔urgente sync já existe), [index.html:12936-12975](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L12936-L12975) toggleUrgente
- Escreve: patch.js wrapper ensure ambos são atualizados em cache local após 200 OK XHR, trigger rerender sem F5.
- Mudança: Garantir que badge lê ambos `urg`||`urgente` e mostra URGENTE.
- Dependências: Task 1.2

#### Task 1.4 — Passou pela Máquina → rerender tela + badge visual sem F5
- Status: pending
- Lê: [server.js:10139-10430](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L10139-L10430) (300L endpoint), [index.html:8973-9125](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L8973-L9125) window.passouPelaMaquina
- Escreve: patch.js após XHR 200 → refresh item OF no cache local e marca `passou_maquina=true`, re-renderiza coluna com status.
- Mudança: Após clique sucesso → card OF mostra "✅ Passou por {maquina}" sem F5.
- Dependências: Task 1.3

#### Task 1.5 — Histórico Passagens auto-refresh após ação + botão Atualizar
- Status: pending
- Lê: [index.html:12372-12600](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L12372-L12600) buscarHistoricoPassagens, [server.js:13210-13540](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L13210-L13540) MERGE 2 fontes
- Escreve: (1) Botão "↻ Atualizar" no toolbar Histórico Passagens que chama buscarHistoricoPassagens() sem F5; (2) Documentar que após marcar Passou pela Máquina → clicar Atualizar ou reabrir tela mostra linha status.
- Mudança: Sem endpoint novo, reaproveitar rota.
- Dependências: Task 1.4

#### Task 1.6 — Gates + bumps Commit 1
- Status: pending
- Escreve: `server.js L1254-1255`, `sw.js L4`, `index.html L33736`, `index.html L61174` (5 bumps T1 20260923201000). `node --check server.js`. `git diff --stat`. Commit + push. Poll Railway /api/version → MATCH patch=20260923201000.
- Dependências: Todas as tasks 1.1-1.5 OK.

---
### Test Requirements Commit 1
| TR | Tipo | Criterio (AC map) | Evidencia fonte |
|---|---|---|---|
| TR-C1-1 | rule | Ver Todas máquinas com data 2026-09-20 não mostra máquina que só trabalhou dia 21 (OFMAQ-1). | browser evaluate + count máquinas |
| TR-C1-2 | rule | Marcar Sem Papelão → salvar → XHR 200 → F5 → badge continua presente no DOM (OFMAQ-2). | browser snap + evaluate |
| TR-C1-3 | rule | Marcar urgente → query POST mostra ambas colunas urg + urgente true (OFMAQ-3). | XHR log ou server.js insert |
| TR-C1-4 | rule | "Passou IMP01" → na mesma sessão sem F5, badge aparece (OFMAQ-4 refreshless parte 1). | browser snap após 1s |
| TR-C1-5 | rule | Histórico Passagens mesmo período → linha OF teste com Status="Passou pela Máquina IMP01" (HP-1). | browser DOM busca string |
| TR-C1-6 | rubric | OFMAQ-R1 (refreshless <500ms). | 2 pts se <500ms. |
| TR-C1-7 | rule | `/api/version` Railway patch=20260923201000 (Deploy MATCH). | PowerShell poll |

---
## COMMIT 2: Compra de Papelão salvar/vincos/layout impressão (Bump T2 = 20260923202000)

### Descrição
Fix put-sem-rollback (causa 0 itens), vincos V5+, roundtrip fields todos, layout impressão profissional reorganizado.

**Estimativa**: ~300L (220 front patch.js HTML + 80 back server.js PUT transaction rollback + bumps)

### Tarefas
#### Task 2.1 — PUT /api/compras-chapas/:id NÃO apaga antes de validar insert novos itens (Fix 0 itens P4)
- Status: pending
- Lê: [server.js:28192-28266](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L28192-L28266) (PUT atual: delete old → insert new sem rollback)
- Escreve: server.js PUT endpoint. Novo fluxo: (1) Carrega itens atuais atuaisOld (backup memória); (2) Valida body.itens.length>0 (senão return 400 "Sem itens"); (3) Delete old; (4) Insert new; (5) Se insert.error → tenta rollback manual: reinsertar atuaisOld (registrar erro crítico se rollback falhar) → return 500.
- Mudança: Compra editada não perde itens se erro.
- Dependências: —

#### Task 2.2 — Fix ids.length === 0 não popula itensOut (P6 causa 0 itens)
- Status: pending
- Lê: [server.js:27696-27705](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L27696-L27705) (ids.length===0 branch)
- Escreve: Adicionar early retorno `itensOut = {}` e `return {headers, itensOut}` sem cair no map que cria vazio. Mais: testar ao buscar compra que não tem itens → header aparece com "0 itens" (correto) mas ao expandir não mostra linhas fantasma.
- Dependências: Task 2.1

#### Task 2.3 — Roundtrip 100% fields cabeçalho + 25 itens
- Status: pending
- Lê: [patch.js:8577-8772](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L8577-L8772) (abrirCompraModal) + server BuildItemPayload L27581
- Escreve: patch.js carregarCompraById → cada campo DOM recebe valor salvo (não default). Checar cada um: fornecedor, data_compra (type=date), pasta_id (option selected), ped_fornecedor, observacao; depois cada item linha: ped_cli, data_entrega, PO, L, C, V1..V4, chips V5+, qtd, lote, area, vlm2, vlmil, total, obs, ped_forn.
- Mudança: Ao editar reabre tudo preenchido.
- Dependências: Task 2.2

#### Task 2.4 — Vincos V5+ na impressão concatenados formato "/" sem "V5="
- Status: pending
- Lê: [patch.js:8416-8514](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L8416-L8514) (BuildCompraPrintHtmlFromPayload) coluna Posições dos Vincos L8440-8455
- Escreve: Remover a 2ª linha "· V5=100 · V6=130". Trocar para: `_compraVincosArrayFull(item).join('/')` direto, fonte Consolas 14px. Se lista vazia mostrar "—".
- Mudança: 6 vincos vira "10/20/30/40/50/60" em 1 linha.
- Dependências: Task 2.3

#### Task 2.5 — Layout impressão reorganizado profissional
- Status: pending
- Lê: patch.js BuildCompraPrintHtmlFromPayload (mesmo acima).
- Escreve: (1) Cabeçalho esq: Italy Embalagens (endereço/contato se disponível — usar valores hardcoded default empresa se não disponível). Cabeçalho dir: N° Compra, Fornecedor, Data em box com borda; (2) 4 cards meta: Ped Fornecedor, Pasta, Status, Observação; (3) Tabela 14 cols com `border-collapse:collapse; border:1px solid #ccc;` em cada td/th; padding `6px 8px`; cabeçalho `background:#1e3a5f; color:white; position:sticky; top:0;`; (4) 3 totalizadores rodapé grid `3 colunas`, negrito, `border-top:2px solid #1e3a5f; padding-top:8px`.
- Mudança: Mais legível, colunas separadas.
- Dependências: Task 2.4

#### Task 2.6 — Gates + bumps Commit 2
- Status: pending
- Bumps T2=20260923202000. `node --check`. `git diff --stat`. Commit/push. Railway MATCH patch=20260923202000.
- Dependências: Tasks 2.1-2.5.

---
### Test Requirements Commit 2
| TR | Tipo | Criterio | Fonte |
|---|---|---|---|
| TR-C2-1 | rule | Criar compra item V1..V6 → imprimir → popup string "10/20/30/40/50/60" exata (CP-3). | browser evaluate popup HTML |
| TR-C2-2 | rule | Reabrir compra editar e salvar sem mudar nada → não fica com 0 itens; número itens igual antes/depois (CP-2). | API GET before/after |
| TR-C2-3 | rule | Roundtrip: fornecedor, pasta_id, data_compra, V5 chip valor 50 → todos presentes ao reabrir (CP-1). | DOM snapshot |
| TR-C2-4 | rubric | CP-R1 qualidade layout impressão: colunas nitidamente separadas, cabeçalho sticky, totalizadores negrito. | screenshot avaliação |
| TR-C2-5 | rule | Deploy /api/version = T2. | PowerShell poll |

---
## COMMIT 3: Orçamentos Garcia + Modal Conclusão + Comissões Excel (T3 = 20260923203000)

### Estimativa: ~270L (180 front + 70 back + 20 bumps)

### Tarefas
#### Task 3.1 — Orçamentos: Sync parâmetros Garcia → valor_orcamento em tempo real
- Status: pending
- Lê: [index.html:39371-39391](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L39371-L39391) (calcPreco W3 correta), [index.html:40129-40214](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L40129-L40214) (calcRecalc), PUT/POST orçamentos body valor_total
- Escreve: (1) Função `_atualizarOrcamentoValorFromCalc()` nova: se modal editar/criar orçamento ABERTO, pegar o último resultado calcPreco `comFrete` e escrever no input `#orc-valor-total` e no state orçamento; (2) `calcRecalc` e `calcRecalcFromScope` chamar essa nova função no final; (3) ao clicar Salvar orçamento, garantir `body.valor_total` = o valor display (não state antigo). Além disso, label display "W3 = 100 - CF - MG - CV - IMP = XX%" e "Custo Merc = XX% sobre Valor Bruto" mostrados SEPARADOS com 2 tooltips (resolver confusão C).
- Dependências: —

#### Task 3.2 — Orçamentos Geral: criar/editar/clonar/imprimir/pasta/excluir smoke básico
- Status: pending
- Escreve: Nenhum código novo se já funciona. Documentar smoke e providenciar testes. Se algum botão chamar alert() vazio → implementar backend real.
- Dependências: Task 3.1.

#### Task 3.3 — Modal Conclusão OF: aumentar largura + remover botão Sem Papelão APENAS lá
- Status: pending
- Lê: [index.html:49426-49494](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L49426-L49494) (modal container width 760px atual), [abrirModalBaixaConclusao](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L12014-L12080)
- Escreve: (1) Modal style → width `min(1100px, 94vw); max-height:92vh`; (2) Dentro do modal HTML que renderiza botões/conteúdo, remover linha `<button ... Sem Papelão>` ou container `#modal-sem-papelao-dentro-baixa` (se existir); **CUIDADO**: só do modal de conclusão (baixa-conclusao). NÃO tocar de OFs Máquina.
- Dependências: Task 3.2.

#### Task 3.4 — Comissões: Botão Excel Detalhado 6 colunas ordem Cliente→Nº OF ASC
- Status: pending
- Lê: [index.html:48224-48262](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L48224-L48262) (toolbar Comissões), [index.html:19850-19958](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L19850-L19958) (calcularComissoes → window._comissoesData)
- Escreve: (1) Adicionar `<button onclick="exportarExcelComissoes()" class="btn">📥 Excel Detalhado</button>` na toolbar; (2) Nova função `exportarExcelComissoes()`: check `window._comissoesData` existe e has >0 rows; se não, toast "Clique primeiro em Calcular"; else: usar XLSX (via window.XLSX igual Excel compra papelão) → (a) Header row: ["Cliente","Quantidade Caixas","Valor Unitário","Valor Total","Vendedor","Nº da OF"]; (b) Body rows: iterar OFs detalhados, agrupar ordenar: `sort((a,b)=>(a.cliente>b.cliente?1:a.cliente<b.cliente?-1:(parseInt(a.numero)||0)-(parseInt(b.numero)||0)))`; (c) writeFile nome `comissoes_detalhado_YYYYMMDD_HHMM.xlsx`.
- Dependências: Task 3.3.

#### Task 3.5 — Gates + bumps T3 20260923203000
- Status: pending
- Deploy Railway MATCH.
- Dependências: 3.1-3.4.

---
### Test Requirements Commit 3
| TR | Tipo | Criterio | Fonte |
|---|---|---|---|
| TR-C3-1 | rule | Orçamento aberto CF 15→30 → campo valor total aumenta (W3 cai, comFrete sobe) em <1s (ORC-1). | browser evaluate oninput CF + get valor |
| TR-C3-2 | rule | PUT orçamento request payload valor_total = último valor UI (ORC-2). | XHR Network tab log |
| TR-C3-3 | rubric | ORC-R1 W3 vs CM mostrados separados sem confundir. | DOM snapshot |
| TR-C3-4 | rule | Modal conclusão DOM busca string "Sem Papelão" retorna 0 ocorrências (MOD-1). | browser evaluate |
| TR-C3-5 | rule | Modal conclusão width >900px (MOD-2). | browser getBoundingClientRect |
| TR-C3-6 | rule | Excel gerado tem 6 colunas 1ª linha + ordenado: Cliente A (OF 1, OF 10, OF 2 → corrigido parseInt ordem) (EXC-1+2). | Abrir XLSX checar |
| TR-C3-7 | rule | Deploy T3. | PowerShell |

---
## COMMIT 4: Jarvis Grande + Function Calling Banco + 4 Relatórios rrOpenPrint (T4 = 20260923204000)

### Estimativa: ~290L (front 150 + back 120 + 20 bumps)

### Tarefas
#### Task 4.1 — Jarvis painel grande centralizado (width≥1100px, 88vh)
- Status: pending
- Lê: [index.html:60720-60767](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L60720-L60767) (abrirPainelJarvis), [index.html:54638](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L54638) (assist-panel), index.html L54900 open
- Escreve: (1) AbrirPainelJarvis largura min(1200px, 94vw), height 88vh; (2) z-index 9001 (abaixo modal conclusão); (3) Fechar ao clicar overlay, ESC key listener; (4) Header painel adicionar botão maximizar se não tiver.
- Dependências: —

#### Task 4.2 — Jarvis Function Calling Banco whitelist 5 consultas (não SQL livre)
- Status: pending
- Lê: [server.js:30817-30920](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L30817-L30920) (_callJarvisIA), server.js L30712 _jarvisCallClaude, L30768 _callOpenAI
- Escreve: server.js nova função `async _jarvisFunctionDispatch(pergunta, empId)` antes de chamar LLM:
  1. Regex match "OFs (abertas|em aberto).*cliente (.*?)(\?|$)" → supabase from('ofs').select('*').eq.emp_id.ilike(%cliente%).status.not.in([concluído,concluido,cancelada]).count + json ofs list.
  2. "Quantas caixas cliente (.*?) no mês (.*)/ano (.*)" → query ofs concluídas by cliente mês/ano SUM(qtd) + SUM(valor_total).
  3. "Status da OF número (.*?)(\?|$)" → OF detalhe by numero/of.
  4. "Compras de papelão fornecedor (.*?)(período|mês)" → compras_chapas + itens R$ total.
  5. "OFs sem papelão (hoje|semana|mês)" → sem_papel=true count.
  Montar resposta texto claro, com dados. Se nenhuma match → retorna null e segue para LLM normal.
- Frontend: mensagem Jarvis que vem de function dispatch mostra badge `🔎 Dados reais` (cor verde) no header da msg; resposta LLM normal `🧠 IA`.
- Obs: Como ambiente TRAE tem Unconfigured Providers (anthropic/openai), essa implementação é código e estrutura; validação com pergunta real fica com usuário Railway.
- Dependências: Task 4.1

#### Task 4.3 — Relatório 1/4: Frequência Compra Cliente (linkar menu novo + criar rrOpen...Modal + rrOpenPrint)
- Status: pending
- Lê: [patch.js:3569-3609](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L3569-L3609) (rrDefs[]), server.js L7527-7618 rota funcional
- Escreve: (1) Adicionar em rrDefs após L3608 `{id:'frequencia-compra-clientes',label:'⏱ Frequência Compra por Cliente',run: rrOpenFrequenciaCompraModal}`; (2) Criar função `rrOpenFrequenciaCompraModal()` = prompt ano + busca endpoint + monta cfg = cards + detail headers/rows → chama `rrOpenPrint(cfg)` (mesmo padrão ProjecaoVendas L3710-3749).
- Dependências: Task 4.2

#### Task 4.4 — Relatório 2/4: Perdas Operador (fallback Operador Não Informado + rrOpenPrint)
- Status: pending
- Lê: [server.js:17095-17126](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L17095-L17126) (unpackOperadores + if !len return), [patch.js:3772-3899](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L3772-L3899) (rrOpenPerdasOperadorModal)
- Escreve: (1) server.js /perdas-operador: se `qtd_perdida > 0 || maquina_perda` && sem operador → push `[{nome:'Operador Não Informado', qtd: perdida, maquina: maquina_perda||'—'}]` em unpackOperadores return, não vazio; (2) Frontend modal top bar informativa; (3) Montar cfg → rrOpenPrint().
- Dependências: Task 4.3.

#### Task 4.5 — Relatório 3/4: Resumo Anual adicionar botão PDF rrOpenPrint(cfg)
- Status: pending
- Lê: [patch.js:3901-3968](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L3901-L3968) (rrOpenResumoAnualModal), server.js L16700-17006 endpoint dados (536 OFs set/26, 694564.82 ✅)
- Escreve: (1) Modal Resumo Anual adicionar botão `🖨 Gerar PDF / Imprimir`; (2) cfg cards 5 + detail 12 meses Janeiro..Dezembro → chamar rrOpenPrint(cfg).
- Dependências: Task 4.4.

#### Task 4.6 — Relatório 4/4: Projeção Vendas botão PDF rrOpenPrint
- Status: pending
- Lê: [patch.js:3710-3749](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L3710-L3749) (rrOpenProjecaoVendasModal), server.js L23420 endpoint
- Escreve: Modal Projeção → botão imprimir → cfg cards 4 + detail 12 meses (Reais R$ | Projetado R$ | Tendência ↗/↘) → rrOpenPrint.
- Dependências: Task 4.5.

#### Task 4.7 — Gates + bumps T4 = 20260923204000. Último deploy.
- Status: pending
- Dependências: 4.1-4.6.

---
### Test Requirements Commit 4
| TR | Tipo | Criterio | Fonte |
|---|---|---|---|
| TR-C4-1 | rule | Jarvis painel open → width ≥ 900px (viewport ≥1280) e centralizado (JAR-1). | DOM getBoundingClientRect |
| TR-C4-2 | rule | Node script `_jarvisFunctionDispatch("OFs abertas cliente Ripke?", empId=df5f7672...)` → retorna tipo='dados-banco' e resposta tem count OFs integer (JAR-2). | RunCommand node --eval |
| TR-C4-3 | rubric | JAR-R1: estrutura function-calling implementada (sem chave ambiente TRAE) → 1 pts. | Código review |
| TR-C4-4 | rule | Novo menu Relatórios central mostra "⏱ Frequência Compra" e ao rodar abre popup rrOpenPrint com headers cliente/freq (REL-1). | browser DOM |
| TR-C4-5 | rule | Perdas Oper período tem OF sem operador → popup string "Operador Não Informado" presente (REL-2). | DOM busca |
| TR-C4-6 | rule | Resumo Anual 2026 → impressão string setembro tem "536" + "694564,82" (REL-3). | browser evaluate popup HTML |
| TR-C4-7 | rule | Projeção Vendas impressão popup → 12 linhas Janeiro..Dezembro presentes (REL-4). | DOM count rows |
| TR-C4-8 | rule | Deploy T4 /api/version MATCH Railway. | PowerShell poll |

---
## Mapa Acceptance Criteria → Tasks
| AC | Tasks |
|---|---|
| AC-1 | C1: T1.1, T1.2, T1.3, T1.4 |
| AC-2 | C1: T1.5 |
| AC-3 | C2: T2.1-T2.5 |
| AC-4 | C3: T3.1, T3.2 |
| AC-5 | C4: T4.1, T4.2 |
| AC-6 | C3: T3.3 |
| AC-7 | C3: T3.4 |
| AC-8 | C4: T4.3, T4.4, T4.5, T4.6 |
