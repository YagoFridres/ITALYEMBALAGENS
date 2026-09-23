# Especificação: Pacote 8-Itens — OFs Máquina, Hist Passagens, Compra Papelão, Orçamentos Garcia, Jarvis, Modal Conclusão, Comissões Excel, Relatórios 4x

## Problema
O ERP Italy Embalagens (PCP Pro) tem 8 áreas com bugs confirmados ou funcionalidade incompleta. Cada área causa perda de produtividade operacional (OFs com ações não persistindo, Orçamentos ignorando parâmetros, Relatórios vazios, Jarvis não consultando dados reais).

## Usuários / Papéis
- Operador PCP (chão de fábrica): usa OFs por Máquina, Histórico Passagens, Modal Conclusão
- Comprador: usa Compra de Papelão, vincos, impressão
- Comercial/Vendedor: usa Orçamentos, Calculadora Garcia, Comissões, Jarvis
- Financeiro/Gerente: usa Relatórios, Comissões Excel, Jarvis dados

## Goals
Entregar 8 itens funcionando via 4 commits sequenciais (~300L cada, Fact3 gates), 5 bumps monotônicos por commit, provas por item, sem quebrar deploy Railway. Todos bugs persistência visual corrigidos; cálculos Orçamentos alinhados com fórmula W3 documentada; Relatórios não vazam.

## Non-Goals
- NÃO criar colunas novas via RPC exec_sql (proibido Fact protocolo — se coluna faltar, entregar ALTER TABLE separado)
- NÃO tocar em CP/CR (Fact22 cancelado permanentemente)
- NÃO alterar mecanismo de auth, login, permissões
- NÃO substituir framework UI (continuamos vanilla DOM + patch.js monkey-patch)
- NÃO inventar padrão PDF diferente de rrOpenPrint() já vigente
- NÃO configurar chaves LLM (fora de escopo; implementar estrutura function-calling Jarvis mas usuário final valida LLM com chave no Railway)

## Constraints & Dependencies Permanentes (Fact ativos)
- **Fact2**: NÃO conectar Supabase via MCP — info_schema via usuário/SQL Editor; queries via server.js service_role key.
- **Fact3**: Por commit <280L preferencial / <500L estrito; `git diff --stat` mostrado; `node --check server.js` obrigatório.
- **Fact4**: NÃO editar index.html exceto 2 timestamps inline + bumps de versão permitidos.
- **Fact5**: 5 bumps monotônicos MESMO commit: server.js PATCH/SW_RUNTIME, sw.js CACHE_NAME, index.html swVersion inline, index.html patch.js?v= (timestamp YYYYMMDDHHMMSS estritamente > anterior 20260922200000).
- **Fact9**: Em todo evaluate browser monkey patch `prompt='1234'; alert=noop; confirm=true`.
- **Fact22**: CP/CR cancelado.
- **Fact28**: Ordem interna dentro dos 4 commits: itens críticos primeiro (OFs Máq > Papelão > Orçamentos > Jarvis/Relatórios).
- **Fact29**: Instrumentar log, provas /api/version por commit.
- **Fact30**: Stop-on-failure em smokes; relatório item por item separado.

## Assumptions Premissa (confirmadas explícitas AskUserQuestion 2026-09-23)
- (A) Sim: menus Ações OFs hoje com alert() vazio — implementar POST/PUT backend real
- (B) Sim: usar fórmula W3 = 100 − CF − MG − CV − IMP (não inventar nova)
- (C) Sim: Jarvis já tem integração LLM Anthropic+OpenAI server.js; localizar e adicionar function-calling real banco OFs/clientes
- (D) Sim: todos 4 relatórios usam rrOpenPrint() + buildStyledPrintHtml existente
- (E) Sim: Histórico Passagens chama mesmo GET endpoint ao recarregar, sem rota nova
- Info schema parciais confirmados user: `ofs.urgente` boolean + `ofs.urg` boolean (duplicata sincronizada); `ofs.sem_papel` boolean; `ofs.maq` jsonb; `ofs.dia` date. Demais colunas: mapear via grep queries no server.js existentes (whitelist).

## Open Questions (não bloqueia spec; se resposta diferente → corrigir implementação fase Implement)
1. **Nome coluna OF status visual urgente → RESOLVIDO via grep código hoje:** FONTE CANÔNICA = `urgente` boolean. LEITURA: `urgente != null ? !!urgente : !!urg` (fallback coluna legada urg). ESCRITA: grava ambas (urg = urgente). Sincronização via server.js L4301-4306 mantida. NÃO abrir mais.
2. **Jarvis function-calling → RESOLVIDO via ajuste spec hoje:** Whitelist expandida para 20+ consultas parametrizadas SEGURAS (abaixo em RF5.2 Lista Completa 20 consultas). NÃO há SQL livre (nunca). Todas parametrizadas e escapeadas.
3. **Comissões Excel ordem:** Cliente/Ordenar OF ascendente dentro de cliente → Confirmado usuário: sim.
4. **Perdas Operador fallback:** Hoje pula OF sem operador. NOVA DECISÃO: Se OF tem qtd_perdida>0 OU maquina_perda preenchido mas sem operador_conclusao → alocar em "Operador Não Informado" (não descarta). Exibir barra informativa topo relatório "X OFs com perda mas sem operador → lançadas como Não Informado".

---
# Requisitos Funcionais (numeração 1..8 = itens usuário)

## RF1 — OFs por Máquina + Ações
### RF1.1 Ver Todas as Máquinas
- Botão/select "Todas as máquinas" (já existe) respeita o **filtro de data atualmente selecionado** (hoje / semana / data específica / todas) e **NÃO fixa o dia atual hardcoded**.
- Fontes OFs: aplicar o mesmo `_filtroOFsMaqData` do render principal; listar máquinas presentes no período via `ofmaqMaquinasValidas()` filtrado.

### RF1.2 Ação: Alterar Máquina
- Persiste em coluna `maq` (jsonb) via `PATCH /api/ofs/:id`; re-renderiza OFs por Máquina SEM recarregar a página (F5 não obrigatório).
- Atualiza também: `maquina_atual_index`, `fluxo_maquinas`, `maquina_agendada` se payload tiver.

### RF1.3 Ação: Alterar Data
- Persiste coluna `dia` (date) + `ent` (compat) via normalização server.js L4308-4309; visual na mesma tela atualiza.
- Se houver combo "Sem papelão" junto, grava `sem_papel=true` em 1 mesmo payload.

### RF1.4 Ação: Marcar Urgente
- **FONTE CANÔNICA (decidida por grep no frontend hoje):** `ofs.urgente` boolean (prioritário em patch.js isUrgente L20396: `of.urgente != null ? of.urgente : of.urg`).
- **Leitura:** Todo badge, ordenação, filtro lê `urgente` primeiro, com fallback para `urg` se `urgente` for NULL (compatibilidade legado).
- **Escrita:** Grava AMBAS colunas (`urg` E `urgente`) no MESMO valor booleano (sincronização duplicata para não quebrar coluna legada). Normalização já existente em server.js L4301-4306 mantida.
- **prioridade_ordem:** seta 1 (urgente=true) / 999 (urgente=false).
- Badge visual "⚠️ URGENTE" aparece no card/tabela após clique; refresh não é obrigatório.

### RF1.5 Ação: Sem Papelão
- **Persiste coluna `ofs.sem_papel` boolean** (PUT/PATCH confirmado 200).
- **Persistência visual**: após refresh F5 ou sair/voltar tela, badge `📦 Sem Papelão` amarelo CONTINUA aparecendo.
- Fix: patch.js hoje atualiza somente cache runtime, mas o render do index.html lê `sem_papel` e `sem_papelao` antigo de OF → normalização unificada em `_normSemPapel()` patch.js.

### RF1.6 Ação: Passou pela Máquina
- Clique no botão **DISPARA** `POST /api/ofs/:id/passou-maquina` com body `{nome_maquina, operador, data_hora}`.
- Confirmação 2 fontes no backend: (a) TABELA FÍSICA `passagens_maquina` upsert linha COUNT aumenta 1; (b) COLUNA JSON `ofs.passagens_maquina` concatena novo item.
- Re-renderiza coluna status "Passou por X" na tela OFs Máq SEM F5.

## RF2 — Histórico de Passagens reflete ação
- Imediatamente após marcar "Passou pela Máquina X" em OFs por Máquina, ao abrir a tela **Histórico de Passagens** (ou clicar Buscar com mesmo período), a OF aparece com linha cujo Status = **"Passou pela Máquina X"** (nome real máquina, não placeholder).
- Usa mesmo `/api/passagens/historico` que já executa MERGE 2 fontes (ofs.passagens_maquina JSON + tabela física passagens_maquina) → sem endpoint novo.
- Opcional: adicionar botão "↻ Atualizar agora" próximo toolbar buscas para re-renderização sem F5 (mesma fetch GET).

## RF3 — Compra de Papelão salvar/imprimir/vincos
### RF3.1 Roundtrip completo fields
- **Cabeçalho**: fornecedor, data_compra, pasta_id, ped_fornecedor, observação; todos salvas em `compras_chapas` header; ao reabrir compra via Abrir Modal os inputs aparecem preenchidos com valor salvo (não defaults).
- **Itens (todos 25 colunas `_comprasChapasBuildItemPayload`)**: ped_cliente, data_entrega, nomenclatura/PO, largura, comprimento, V1..V4 individuais, **vincos_extra (V5+)**, quantidade, lote_minimo, area_m2, valor_m2, vl_p_mil, valor_total, observacao, pedido_fornecedor. Todos roundtrip: salvar → fechar modal → abrir de novo → TODOS preenchidos (não vazios/não zero a menos que digitado zero).

### RF3.2 Tabela principal não "0 itens"
- Fix do race condition P4 identificado: **PUT /api/compras-chapas/:id NÃO apaga itens antes de confirmar insert novos**. Wrap em transaction: valida itens.length>0 primeiro; delete old somente ANTES do insert NOVOS em sequência; se insert falhar → return 500 e manter itens antigos (rollback manual).
- Fix P6: ids.length === 0 retorna map vazio → adicionar early return `itensOut = {}` e compras com `itens: []` mas header ok NÃO entra com itens antigos na próxima request.

### RF3.3 Vincos V5+ persistem e imprimem
- V5+ digitados via chip "+ Mais Vinco" no modal são salvos na coluna `vincos_extra` e aparecem no `vincos` full join `/`.
- Impressão coluna Posições dos Vincos: formato final **"9/9/9/9/100/130"** (todos os vincos preenchidos, separado `/`, sem `V5=100` sufixo; se >4 manter tudo na mesma linha ou quebrar para 2 linhas se couber melhor).

### RF3.4 Layout impressão profissional reorganizado
- Manter mesma estrutura mas:
  - Colunas tabela **100% fixas + separação clara**: borda visível 1px entre cada célula, padding 6px horizontal, texto truncado com ellipsis não corte.
  - Header empresa (nome, CNPJ, contato opcional) no canto superior ESQUERDO; N° CMP-XXX / Fornecedor / Data canto superior DIREITO.
  - Cards resumo com **espaçamento 12px**, borda cinza clara, ícones.
  - Tabela ordem colunas: SEQ | Data Entrega | PO/Nome | Largura | Comprimento | **Vincos** | Qtd | Lote Mín | Área m² | Valor/m² | R$/mil | Valor Total | Obs | Ped Forn
  - Rodapé: Quantidade Total, Área Total, Valor Total (3 colunas grid) em negrito + linha separadora superior.
  - A4 landscape 10mm margem; tabela cabeçalho sticky no print.

## RF4 — Orçamentos Calculadora Garcia afeta Orçamento
### RF4.1 Sync tempo real Parâmetros → Valor Orçamento
- Toda vez que usuário altera qualquer um dos 7 campos (cm, cf, mg, cvend, imp, vkm, km), `calcRecalc()` ou `calcRecalcFromScope(N)` executa e **SE HÁ orçamento aberto (modal editar/criar)**, atualiza o campo `valor_total` do orçamento na hora e no display UI.
- Bug atual C (raiz): "Custo Merc. % cm" NÃO participa da fórmula W3 hoje. Correção: (a) Mover fórmula: **`custoMerc = bruto * (cm/100)`** ou aplicar cm na bruto? → Confirmar fórmula. _Assumimos fórmula usuário: W3 = 100 − CF − MG − CV − IMP (CM não entra em W3; CM mostra o custo mercadoria sobre bruto mas não afeta venda; hoje label confunde)._ Ação: **manter fórmula W3 documentada usuário**, MAS atualizar display de W3 e CM em campos separados para não confundir.
- Ao salvar orçamento via PUT/POST, **garantir que `valor_total` salvo = último `comFrete` recalculado no front com parâmetros ATUAIS** (não valor antigo anterior à mudança de CM/CF/etc).

### RF4.2 Teste Orçamentos geral
- Criar orçamento novo → salvar → aparecer na lista com Nº sequencial.
- Editar: abrir → mudar qualquer campo → salvar → reflete.
- Clonar: botão clonar → duplicata com novo id.
- Imprimir: abre popup.
- Pastas: criar pasta orçamentos, mover, excluir vazia.
- Excluir: confirmar → some da lista.

## RF5 — Jarvis: painel grande centralizado + consultas reais banco
### RF5.1 Painel GRANDE centralizado
- Hoje já tem `abrirPainelJarvis()` width 780px/90vh z9001. Aumentar: **width:min(1200px, 94vw)**, height:88vh, top:50% left:50% translate. Valor z-index continuar 9001 (evitar conflito com modal Conclusão z99999). Fechar ao clicar overlay escuro e ESC key.
- O modo mini (360px inferior) continua acessível via FAB normal; o botão "Maximizar" no header abre o GRANDE.

### RF5.2 Function-calling dados reais
- Server.js `_callJarvisIA` já chama Anthropic/OpenAI. Adicionar etapa prévia: antes chamar LLM gerar texto, **detectar via regex (whitelist expandida 20+ consultas parametrizadas)** se é pergunta de dados.
- Adicionar módulo server `_jarvisFunctionDispatch(pergunta, empId)` — retorna Promise<{resposta:string, tipo: 'dados-banco' | 'llm'}>.
- **Whitelist COMPLETA (20 consultas parametrizadas SEGURAS — NÃO SQL livre, NENHUMA query montada com concatenação de strings; todos parâmetros via variáveis bind escapeadas)**:
  1. **OFs abertas**: "OFs [abertas/em aberto/para hoje/semana/mês] [do cliente X]" → status não concluído, cliente opcional → count + lista top 20 (OF, Cliente, Produto, Máq, Qtd, Data Entrega).
  2. **Caixas por cliente período**: "Quantas caixas [o cliente X] [comprou/vendeu] [mês N/ano N/período N-N]" → SUM qtd + SUM valor_total.
  3. **Status OF número**: "Status [da OF número N / OF N / N]" → detalhe OF (status, máq atual, cliente, qtd, R$, data entrega, urg/sem_papel).
  4. **Compras papelão fornecedor**: "Compras de [papelão/chapas] [fornecedor X] [mês N/período]" → qtd compras + R$ total + itens count.
  5. **OFs sem papelão**: "OFs [sem papelão/falta papelão] [hoje/semana/mês/período]" → count + lista top 20 (OF, Cliente, Máq, Data).
  6. **Clientes com OFs abertas**: "[Quais/Liste] clientes [com OFs abertos/tem OFs em aberto] [hoje/semana/mês]" → top 10 clientes + count OFs.
  7. **OFs atrasadas**: "OFs [atrasadas/em atraso/atraso] [hoje/semana/período]" → status Atrasado → count + lista (OF, Cliente, Atraso dias, Máq).
  8. **Toneladas vendidas**: "[Toneladas/Peso] [vendidas/vendido] [mês N/ano N/período]" → SUM kg/ton convertido.
  9. **Comissões vendedor**: "[Comissão/Comissões] [do vendedor X/vendedor X] [mês N/período]" → R$ comissão + Nº OFs + Cliente.
  10. **Estoque abaixo mínimo**: "[Chapas em estoque/Estoque de chapas] [abaixo do mínimo/baixo]" → lista chapas + estoque atual vs mínimo.
  11. **Fornecedor papelão top**: "[Qual fornecedor/Melhor fornecedor] de [papelão/chapas] [mês N/período]" → R$ por fornecedor + rank.
  12. **Caixas perdidas**: "[Caixas perdidas/Perdas/perdido] [mês N/período/hoje]" → qtd perdida + R$ valor perdido + top 5 cliente/OF.
  13. **Ticket médio**: "[Ticket médio/Valor médio por OF] [mês N/período]" → média R$ / OF + comparação mês anterior.
  14. **Clientes inativos**: "[Clientes inativos/Clientes sem compra] [60 dias/90 dias/3 meses/ano N]" → lista clientes inativos + dias desde última compra + última OF.
  15. **Faturamento período**: "[Faturamento/Total vendido/Receita] [hoje/ontem/semana/mês N/período]" → R$ total + count OF + caixas.
  16. **Última OF cliente**: "[Última OF/OF mais recente] [do cliente X/cliente X]" → Nº OF + data + status + valor.
  17. **OFs passou máquina**: "[OFs que passaram/Histórico passagens] [máquina X] [hoje/semana/período]" → count passagens + OFs + datas.
  18. **Compras papelão pendentes**: "[Compras de papelão/Pedidos chapas] [pendentes/não chegou/em aberto]" → status aberto + fornecedor + data.
  19. **Orçamentos status**: "[Orçamentos] [abertos/ganhos/perdidos/aprovados] [mês N/período]" → count + R$ total + cliente top 5.
  20. **Resumo diário/semanal/mensal**: "[Resumo/Relatório] [diário/de hoje/semanal/mês N]" → cards 4-6 itens chave (OFs criadas, concluídas, atrasadas, faturamento, caixas, perdas).
- Se pergunta encaixa → executar consulta service_role Supabase; montar resposta texto estruturada com dados (tabelinhas Markdown-like, emojis, R$ formatado, datas).
- Se NÃO encaixa → fallback LLM normal (mesmo hoje).
- Frontend exibir distinção visual: resposta dados = badge "🔎 Dados reais · consulta bancos" (cor verde), resposta LLM genérica = badge "🧠 IA generativa".
- **Segurança adicional**: Toda consulta tem LIMIT 1000 rows máximo. Nenhuma query DELETE/UPDATE/INSERT (só SELECT).
- **Limitação Conhecida (REGISTRADA em spec como permanente até novo ajuste)**: Perguntas de dados que NÃO se encaixem exatamente nessas 20 categorias parametrizadas NÃO vão consultar o banco de dados real — automaticamente caem no fallback de LLM genérico (resposta sem dados reais). Para novas categorias (ex: "Tempos de setup por máquina por período", "Top tipos de caixa mais produzidos"), será necessário **nova rodada de implementação** adicionando a nova função correspondente ao whitelist + query SELECT parametrizada. NÃO há SQL livre flexível habilitado por motivos de segurança.
- **Observação LLM chave**: Esta entrega implementa a estrutura function-calling. Como nenhum provider está configurado no ambiente atual (Unconfigured: anthropic/openai/openrouter), a validação final de "pergunta → resposta dados" fica a cargo do usuário testar em Railway com chave ANTHROPIC_API_KEY/OPENAI_API_KEY injetada.

## RF6 — Modal de Conclusão OF
- **Aumentar tamanho**: overlay container width `min(1100px, 94vw)` (de 760px atual), max-height 92vh, padding interno 24px.
- **REMOVER apenas do modal de conclusão (NÃO de OFs por Máquina NÃO de outros locais)**: o botão "Sem Papelão" dentro do conteúdo de [modal-baixa-conclusao](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L49426-L49494) desaparece. Todo resto do fluxo de Sem Papelão (menu ações OFs Máq, badges visual) permanece 100% intacto.

## RF7 — Comissões: Excel detalhado
- Adicionar botão na toolbar Comissões (ao lado de Imprimir Relatório): **"📥 Excel Detalhado por Cliente"**.
- Ao clicar, usar `XLSX.utils.book_new()` SheetJS (já disponível em outras telas):
  - 1 Sheet ("Comissões Detalhe");
  - **6 colunas** (ordem usuário): Cliente | Quantidade Caixas | Valor Unitário | Valor Total | Vendedor | Nº da OF;
  - **Fonte de dados**: mesmo fluxo usado na Comissão OFICIAL backend: `_listarOfsVendasOficiais(range, '')` do server.js. Ou rodar no front usando `window._comissoesData` já carregado em `calcularComissoes()` → melhor no front se dados já carregados (evita nova request).
  - **Agrupamento e ordem**: Linhas agrupadas por `cliente_nome` (Cliente), ORDENADAS por (1) cliente_nome ASC, (2) `Nº da OF` (parseInt(numero/of)) ASC dentro do cliente.
  - Linhas em branco: separadores entre clientes opcionais.
  - Nome arquivo: `comissoes_detalhado_YYYYMMDD_HHMM.xlsx`.
- **Fallback sem dados**: botão disabled até que `window._comissoesData` tenha pelo menos 1 linha (após clicar "Calcular").

## RF8 — Relatórios (4x) alinhados padrão rrOpenPrint()
### RF8.1 Frequência de Compra Cliente
- **Status atual mapeado**: Rota backend `/api/relatorios/frequencia-compra-clientes` (server.js L7527-7618) funcional. UI antiga (select index.html) existe. **FALTA: entrada no novo menu rrDefs[] patch.js e função rrOpenFrequenciaCompraModal()**.
- Ação: adicionar ID `frequencia-compra-clientes` em `rrDefs[]` (após resumo-anual L3608), label "⏱ Frequência Compra Cliente"; criar função `rrOpenFrequenciaCompraModal()` que segue padrão de `rrOpenProjecaoVendasModal()` (input mês/ano → busca → chama `rrOpenPrint()` com cards + summary + detail rows):
  - Headers detail: Cliente | Nº Pedidos | Última Compra | Frequência Méd (dias) | Atrasado? | Ticket Médio
  - Summary cards: Clientes Totais | Clientes Atrasados | Frequência Média Global

### RF8.2 Perdas por Operador
#### RF8.2.1 Filtros do Modal (já existentes — mantidos)
- **3 filtros ativos no topo do modal:**
  1. **Mês:** dropdown 01 Janeiro … 12 Dezembro (default = mês corrente)
  2. **Ano:** input numérico (default = ano corrente)
  3. **Empresa:** dropdown = `Todas as empresas (Soma)` · `Italy Embalagens` · `Cartoeste` · `Oestepack`
  4. Botão `Buscar` laranja/vermelho que recarrega com base nos 3 filtros acima
- **Fonte de dados do período:** OFs com `status` = Concluído/Cancelada **dentro do mês+ano selecionados**, com data válida em (hierarquia): `data_faturamento` → `data_conclusao` → `dia` → `created_at`. Canceladas SÓ entram se tiver `qtd_perdida > 0` OU `maquina_perda` preenchida (hoje L17087-17089).

#### RF8.2.2 Fallback "Operador Não Informado" (NOVO fix para relatório não ficar vazio)
- **Regra (NOVA):** Iterar OFs que foram filtradas para entrar no período. Após `unpackOperadores(of)`:
  1. Se `operadores.length > 0` → aloca normalmente entre os operadores (divide qtd/valor por operador, hoje L17137-17140).
  2. Se `operadores.length === 0` (sem operador registrado) **MAS a OF tem `qtd_perdida > 0` OU `maquina_perda` preenchida** → **NÃO descarta a OF** (hoje L17125 return → é removida). Aloca 100% da perda/produção num operador virtual fixo: **`"Operador Não Informado"`** (case-insensitive; sempre agrupa com esse nome em maiúsculo).
  3. Se `operadores.length === 0` E sem perda E sem máquina perda → descarta (igual hoje, não distorce ranking).
- **Barra informativa (NOVA, topo modal, acima dos 5 cards resumo):** fundo `warning` laranja claro borda, ícone ⚠️, texto: `⚠️ {XX} OFs com perda/registro de máquina neste período não têm operador cadastrado e foram lançadas como "Operador Não Informado". Para corrigir, edite a conclusão dessas OFs e informe o(s) operador(es).` Mostra a barra SOMENTE se `XX > 0`.

#### RF8.2.3 Cards Resumo (5 colunas grid, já existentes — mantidos, porém corrigidos)
| # | Card | Conteúdo |
|---|---|---|
| 1 | **Período** | `MM/AAAA` + nome da empresa filtrado |
| 2 | **Caixas Produzidas** | `total_qtd_produzida` formatado + Valor produzido R$ `total_valor_produzido` |
| 3 | **Caixas Perdidas** | `total_qtd_perdida` formatado + Valor perdido R$ + `% Perda (perdida / (produzida+perdida))` |
| 4 | **🏆 Top 3 Operadores (Produção)** | #1 Nome + Qtd cx, #2, #3 (ranking ordenado produzida DESC) |
| 5 | **OFs Contabilizadas** | `total_ofs` + `N operador(es) no ranking` |

#### RF8.2.4 Ranking/Tabela por Operador (colunas e ordenação)
- **Estrutura:** 1 tabela HTML completa `<thead>` fixo + `<tbody>` 1 linha por operador.
- **ORDENAÇÃO FIXA:** Linhas classificadas por **`qtd_produzida` ORDEM DECRESCENTE** (maior produtor primeiro).
- **Cada linha representa 1 operador (nome único UPPER case key):**

| Coluna | Alinhamento | Cor | Descrição do dado (campos JSON) |
|---|---|---|---|
| 1) **Operador** | Esquerda | Cor branca | `r.operador` (nome real, ou o literal "Operador Não Informado" caso fallback) |
| 2) **Caixas Produzidas** | Direita | Verde `#10b981` bold | `r.qtd_produzida` formatado pt-BR (1.000) |
| 3) **Valor Produzido** | Direita | Azul `#3b82f6` bold | `r.valor_produzido` formatado R$ BRL (R$ 1.000,00) |
| 4) **Caixas Perdidas** | Direita | Vermelho `#f87171` bold | `r.qtd_perdida` formatado pt-BR |
| 5) **Valor Perdido** | Direita | Laranja `#fb923c` | `r.valor_perdido` R$ (proporcional por operador se múltiplos) |
| 6) **OFs** | Direita | Roxo `#a78bfa` | `r.qtd_ofs` (quantas OFs distintas esse operador participou) |
| 7) **% Perda** | Direita | Amarelo `#facc15` | `r.pct_perda` = 100 * perdida / (produzida + perdida), 2 casas decimais pt-BR com símbolo % |

- **Agrupamento:** 1 OF com múltiplos operadores (array 2+ pessoas) divide `qtd_produzida`/`valor_produzido`/`qtd_perdida`/`valor_perdido` **IGUALMENTE** entre os operadores (L17137-17140). Cada operador então soma tudo no ranking por nome.
- **Zebrado:** Linhas pares fundo translúcido cinza; separador 1px inferior.

#### RF8.2.5 Geração de Impressão/PDF via rrOpenPrint() (NOVA feature)
- Dentro do modal `rrOpenPerdasOperadorModal()`, ao lado direito do botão Fechar, adicionar botão **`🖨 Imprimir / PDF`** (estilo secundário, margem esquerda 8px).
- Ao clicar:
  1. Montar `cfg = { title, periodo, cards:[5 cards resumo], summaryTitle, summaryHeaders, summaryRows, detailTitle, detailHeaders, detailRows }`.
  2. `summaryRows = [ totalPeriodoProd + totalPeriodoPerd + ofsContabilizadas + operadoresCount + perdaPctGlobal ]` (1 linha sumário).
  3. `detailHeaders = [ "Operador", "Caixas Produzidas", "Valor Produzido", "Caixas Perdidas", "Valor Perdido", "OFs", "% Perda" ]`.
  4. `detailRows[][]` = ranking mapeado para `[[r.operador, fmtNum(..), fmtBRL(..), fmtNum(..), fmtBRL(..), fmtNum(..), pct + "%"]]`.
  5. Chamar `rrOpenPrint(cfg)` (mesmo padrão de relatórios que funcionam hoje).

#### RF8.2.6 Cálculo dos Dados (backend /api/relatorios/perdas-operador)
- `unpackOperadores(of)`: lê `operadores_conclusao` → `operador_conclusao` → parse array JSON, separador ,;|.
- Por OF:
  - `qtd = max(qtd, qtd_produzida, quantidade, qtd_pedida)` (normaliza colunas duplicadas)
  - `perda = max(0, qtd_perdida, caixas_perdidas)`
  - `valorPerda = (perda / (qtd+perda)) * valor_total`
  - `valorProduzido = (qtd / (qtd+perda)) * valor_total`
- Fallback "Operador Não Informado" aplicado ANTES de totalizar globais (para que as globais também incluam esse grupo e não pareçam inconsistentes).
- **Barra informativa XX = contagem de OFs que caíram no fallback.**


### RF8.3 Resumo Anual (V9b2) — GERA IMPRESSÃO/PDF
- **Status atual mapeado**: Endpoint `/api/relatorios/resumo-anual` server.js L16700+ retorna dados corretos (provado sanity V9b2 Setembro 2026 536 OFs / R$694.564,82 ✅). Frontend tab V9b2 mostra UI mas **NÃO chama rrOpenPrint()** — é só tabela.
- Ação: Em `rrOpenResumoAnualModal()` patch.js: (a) adicionar botão "🖨 Gerar PDF / Imprimir" que (b) chama rrOpenPrint(cfg) com:
  - 12 meses Janeiro..Dezembro 1 linha cada;
  - Summary cards topo: Total OFs Ano | Total Receita R$ | Total Caixas Produzidas | Perdas R$ | Margem Lucro %.
  - Meses table: Mês | Nº OFs | Receita R$ | Caixas Prod | Caixas Perd | Perda % | Ticket Médio

### RF8.4 Projeção de Vendas
- **Status atual mapeado**: Widget renderProjecaoVendas patch.js L33691-33809 + rota `/api/relatorios/projecao-vendas` server.js L23420+. Frontend rrOpenProjecaoVendasModal L3710 existe mas NÃO IMPRIME.
- Ação: No modal adicionar botão "🖨 Gerar PDF / Imprimir" → chama rrOpenPrint(cfg) com:
  - Cards: Vendas Reais (YTD) | Projetado Final Ano | Delta vs Ano Anterior % | Top Cliente Projeção
  - Detail rows 12 meses: Mês | Vendas Reais R$ | Projeção R$ (média+tendência) | Tendência (↗/↘)
  - Usa o resultado já calculado no endpoint.

---
# Requisitos Não Funcionais

## RNF1 — Performance
- Cada ação OFs Máq (RF1.x) atualiza tela em <300ms após resposta XHR sucesso.
- PUT/POST Compra Papelão: se >20 itens, loading state spinner (evita duplo clique).
- Jarvis function-calling banco: timeout Supabase 8s, senão retorna "Tentei consultar mas o banco não respondeu".

## RNF2 — Compatibilidade navegador
- Edge/Chrome + Firefox: mesma UI funcionar. Layouts responsivos <768px smartphone (modo mobile em uso).

## RNF3 — Segurança
- Jarvis function-calling: NÃO SQL livre, whitelist estrita 5 consultas parametrizadas + escape idempotente.
- OFs update: SEMPRE via PATCH whitelist existente server.js L4272 — NÃO inline raw SQL.

## RNF4 — Custo Railway Postgres (statement timeout ~30s)
- Relatórios Perdas Operador/Resumo Anual/Projeção: filtro obrigatório ano (retorna no máximo 366 dias de OFs).
- Limite de rows agregadas 5000 no máximo por consulta.

---
# Acceptance Criteria (rule = binário PASS/FAIL; rubric = 0-2, threshold ≥ 1)

## AC-1 OFs por Máquina
- **rule OFMAQ-1**: No dia 2026-09-22, clicar "Todas as máquinas" retorna a mesma lista de máquinas presentes quando filtro data="22/09/2026" individual, não lista máquinas de outro dia.
- **rule OFMAQ-2**: Action "Sem papelão" em OF de teste → após F5 recarregar a página, OF continua com badge Sem Papelão (coluna ofs.sem_papel = true via query).
- **rule OFMAQ-3**: Marcar urgente → ambas colunas ofs.urg e ofs.urgente true via information_schema query (ou JSON).
- **rule OFMAQ-4**: "Passou pela máquina CORTE1" → tabela passagens_maquina COUNT aumenta 1 AND ofs.passagens_maquina array.length aumenta 1.
- **rubric OFMAQ-R1 (responsividade UI refreshless)**: Após clique ação sem F5, a atualização visual aparece no card OF em menos de 500ms = 2 pts; 500-1500ms = 1 pt; >1500ms ou F5 obrigatório = 0 pts. Threshold ≥1.

## AC-2 Histórico Passagens
- **rule HP-1**: Marcar OF teste N "Passou IMP01" → abrir Hist Passagens mesmo período, filtrar OF = N → 1 linha status exato = "Passou pela Máquina IMP01".

## AC-3 Compra Papelão
- **rule CP-1**: Criar compra com fornecedor=F1, pasta=Set, item1 V1..V4=9/9/9/9, item2 V1..V6=10/20/30/40/50/60 → salvo → reabrir → cada campo no modal IDÊNTICO aos digitados (roundtrip 100%).
- **rule CP-2**: Reabrir listagem → número CMP-NNN mostra 2 itens, valores não zero, não exibe "0 itens".
- **rule CP-3**: Imprimir popup busca string coluna vincos item2 = "10/20/30/40/50/60" (todos 6, formato /, sem V5=).
- **rubric CP-R1 (qualidade layout impressão)**: Colunas nitidamente separadas, sem sobreposição, headers sticky, totalizadores visíveis em negrito = 2 pts; pequenos problemas de overflow mas legível = 1 pt; texto cortado = 0. Threshold ≥1.

## AC-4 Orçamentos Garcia
- **rule ORC-1**: Orçamento aberto, mudar CF de 15 → 30 → Valor Total orçamento (R$) aumenta (W3=100-30-... cai, comFrete = 100/w3 * bruto sobe) em tempo real < 1s após oninput.
- **rule ORC-2**: Salvar orçamento → PUT body `valor_total` XHR Request Payload = último valor comFrete da UI (não valor antigo 15%).
- **rubric ORC-R1 (fórmula transparente)**: W3 e Custo Merc mostrados como labels distintas lado a lado, sem confundir operador = 2 pts; mostrados mas agrupados = 1 pt; confunde 2 campos = 0. Threshold ≥1.

## AC-5 Jarvis
- **rule JAR-1**: Abrir painel → getBoundingClientRect mostra width ≥ 900px (viewport desktop ≥1280) e centralizado.
- **rule JAR-2**: Disparar `_jarvisFunctionDispatch("Quantas OFs abertas tem Móveis Ripke hoje?", empId=df5f7672...)` → retorna `tipo='dados-banco'` e resposta contém pelo menos "OFs abertas" e o count (integer).
- **rubric JAR-R1**: Validação em Railway com chave LLM ativa = 2 pts quando pergunta real retorna dados + badge "🔎"; estrutura implementada mas sem chave no ambiente TRAE = 1 pts; sem dispatch = 0. Threshold ≥1.

## AC-6 Modal Conclusão OF
- **rule MOD-1**: Abrir modal conclusão OF de teste → query DOM no `.modal-body` não contém botão/span "Sem Papelão" (ou id sem-papelao-container).
- **rule MOD-2**: Largura modal DOM offsetWidth > 900px (≥1280 viewport).

## AC-7 Comissões Excel
- **rule EXC-1**: Gerar Excel → abrir XLSX → Planilha "Comissões Detalhe" 6 colunas exatas com 10+ linhas (se período tem vendas).
- **rule EXC-2**: Dados ordenados: 2 linhas consecutivas mesmo Cliente → Nº OF linha 1 < Nº OF linha 2 ASC.

## AC-8 Relatórios 4x
- **rule REL-1**: Novo menu rrDefs[] contém "Frequência Compra Cliente" e ao abrir → modal com dados >0 linhas (se período tiver OFs suficientes) → botão imprimir abre rrOpenPrint popup.
- **rule REL-2**: Perdas Operador período com dados → popup rrOpenPrint abre e contém "Operador Não Informado" se pelo menos 1 OF perda sem operador.
- **rule REL-3**: Resumo Anual 2026 abre popup e linha Setembro 2026 contém "536" e "694564.82" (números referência validados V9b2 ✅).
- **rule REL-4**: Projeção Vendas 2026 → botão imprimir abre popup contém 12 meses Janeiro..Dezembro.
