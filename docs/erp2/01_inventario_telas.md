# 01 · Inventário real de telas, abas e modais — ERP Italy

> **Etapa 1 · auditoria (somente leitura).** Nada aqui foi inventado: cada item traz a
> linha do arquivo onde foi confirmado.
>
> **Base de código:** `main` = `e2c8930` (a mesma do PR P1 pendente). Branch da auditoria:
> `trae/erp2-auditoria`.
> **Arquivos-fonte:** [`index.html`](../../index.html) (5,92 MB · 61.380 linhas),
> [`patch.js`](../../patch.js) (3,76 MB · 68.404 linhas), [`server.js`](../../server.js)
> (1,78 MB · 39.290 linhas), [`sw.js`](../../sw.js) (119 linhas).
> **Método:** leitura do menu real, das `id="page-*"`, das `id="*modal*"`, das rotas
> `app.<verbo>()` do `server.js` e dos pontos de permissão. Medições em
> [`02_diagnostico.md`](02_diagnostico.md).
>
> **Não validado nesta passada:** número de linhas por tela no banco e o
> comportamento em produção dependem de medição com o Yago/mock — ver §8.

---

## 1. Estrutura global

| Bloco | Onde | Observação |
|---|---|---|
| Topbar | [index.html L46149-46204](../../index.html#L46149-L46204) | tema claro/escuro, "Instalar App", salvar dados, trocar usuário, avatar/perfil |
| Barra de empresas | [index.html L46206](../../index.html#L46206) (`#emp-bar`) | seletor de empresa (Italy / Cartoeste / Oestepack) |
| Sidebar / menu | [index.html L46209-46320](../../index.html#L46209-L46320) | 9 grupos, 34 itens (§2) |
| Área de conteúdo | [index.html L46323](../../index.html#L46323) (`.content`) | 46 `id="page-*"`, das quais **9 ficam ocultas** (`display:none!important`, ver §3) |
| Modais | [index.html L49210](../../index.html#L49210) e ss. | **73 modais** em **duas implementações** (`.modal-overlay` e `position:fixed` inline) — ver §5 |
| Roteador | `go()` em [index.html L43052](../../index.html#L43052) + **35 redefinições** de `window.go` no `patch.js` | último `window.go` vence (§ diagnóstico) |
| PWA / Service Worker | [sw.js](../../sw.js) | `index.html`, `patch.js` e navegação são *network-only* (sem cache) |
| Versão | `patch.js?v=20261009100500` em [index.html L61377](../../index.html#L61377) | bump em 5 pontos (regra do projeto) |

---

## 2. Menu real (com a linha de cada item)

Fonte: [index.html L46215-46319](../../index.html#L46215-L46319).

**Produção**
- Hub Inicial — [`go('hub')` L46216](../../index.html#L46216)
- PCP / Programação — [`go('pcp')` L46217](../../index.html#L46217)
- OFs por Máquina — [`go('ofmaq')` L46218](../../index.html#L46218)
- Histórico de Passagens — [`go('historico-passagens')` L46219](../../index.html#L46219)
- Armazenamento de OFs — [`go('lancamento')` L46220](../../index.html#L46220)

**Comunicações** ([L46222-46231](../../index.html#L46222-L46231))
- Chat (`toggleChat()`), Agenda (`go('agenda')`), Jarvis IA (`go('hub')` + `_jarvisAbrir()`)

**Máquinas** ([L46234-46245](../../index.html#L46234-L46245))
- Fluxos, Máquinas, Tipos de Caixa, Cores de Impressão, Tempos Reais

**Cadastros** ([L46248-46259](../../index.html#L46248-L46259))
- Clientes, Mapa de Clientes, Fornecedores, Vendedores, Usuários

**Qualidade** ([L46262-46270](../../index.html#L46262-L46270))
- Operadores, Inconformidades

**Financeiro 🔒** ([L46272-46281](../../index.html#L46272-L46281)) — abre por `prompt('Senha do Financeiro:')` em [index.html L5470-5504](../../index.html#L5470-L5504)
- Orçamentos, Comissões, Central de Custos

**Estoques** ([L46284-46293](../../index.html#L46284-L46293))
- Estoque Chapas, Estoque de Facas, Estoque Clichês

**Papelão** ([L46295-46305](../../index.html#L46295-L46305))
- Compra de Papelão (`papelaoAbrirComprasChapas()`), Seleção de Chapas, Inteligência do Papelão, Simulador de Desperdício

**Análises** ([L46308-46319](../../index.html#L46308-L46319))
- Dashboard, Relatórios, Caixas Perdidas, Relatório Mensal, Configurações

---

## 3. Páginas (`id="page-*"`) — todas as 46

| # | id da página | Linha | Menu | Grupo | Celular | Estado |
|---|---|---|---|---|---|---|
| 1 | `page-pcp` | [46636](../../index.html#L46636) | sim | Produção | ~ genérico | ativa (default) |
| 2 | `page-ofmaq` | [46704](../../index.html#L46704) | sim | Produção | ✔ dedicado | ativa |
| 3 | `page-historico-passagens` | [46755](../../index.html#L46755) | sim | Produção | ~ | ativa |
| 4 | `page-agenda` | [46808](../../index.html#L46808) | sim | Comunicações | ~ | ativa |
| 5 | `page-hub` | [46836](../../index.html#L46836) | sim | Produção | ~ | ativa |
| 6 | `page-amostras` | [47026](../../index.html#L47026) | não | Produção | ~ | **órfã** (redireciona ao PCP) |
| 7 | `page-usuarios` | [47078](../../index.html#L47078) | sim | Cadastros | ~ | ativa (admin) |
| 8 | `page-roteiro-entrega` | [47113](../../index.html#L47113) | não | Logística | ~ | dentro do Mapa |
| 9 | `page-lancamento` | [47166](../../index.html#L47166) | sim ("Armazenamento de OFs") | Produção | ~ | ativa |
| 10 | `page-clientes` | [47187](../../index.html#L47187) | sim | Cadastros | ~ | ativa |
| 11 | `page-mapa-clientes` | [47243](../../index.html#L47243) | sim | Cadastros | ~ | ativa |
| 12 | `page-pedidos-recorrentes` | [47299](../../index.html#L47299) | indireto (PCP) | Produção | ~ | **quebrada** (tabela inexistente) |
| 13 | `page-estoque` | [47322](../../index.html#L47322) | sim | Estoques | ~ | ativa |
| 14 | `page-sel-chapas` | [47519](../../index.html#L47519) | sim | Papelão | ~ | ativa |
| 15 | `page-simd` | [47528](../../index.html#L47528) | sim | Papelão | ~ | fechada pelo usuário (set/26) |
| 16 | `page-papelao-ia` | [47631](../../index.html#L47631) | sim | Papelão | ~ | ativa |
| 17 | `page-fluxos` | [47651](../../index.html#L47651) | sim | Máquinas | ~ | ativa |
| 18 | `page-maquinas` | [47661](../../index.html#L47661) | sim | Máquinas | ~ | ativa |
| 19 | `page-cores-impressao` | [47674](../../index.html#L47674) | sim | Máquinas | ~ | ativa |
| 20 | `page-tempos-reais` | [47690](../../index.html#L47690) | sim | Máquinas | ~ | ativa |
| 21 | `page-tipos-caixa` | [47723](../../index.html#L47723) | sim | Máquinas | ~ | ativa |
| 22 | `page-tablets` | [47752](../../index.html#L47752) | não | — | — | **oculta** |
| 23 | `page-apontamento` | [47760](../../index.html#L47760) | não | — | — | **oculta** |
| 24 | `page-facas1` | [47820](../../index.html#L47820) | sim | Estoques | ~ | ativa |
| 25 | `page-facas2` | [47850](../../index.html#L47850) | não | — | — | **morta** (duplicada) |
| 26 | `page-cliches` | [47880](../../index.html#L47880) | sim | Estoques | ~ | ativa |
| 27 | `page-contaspagar` | [48025](../../index.html#L48025) | não | Financeiro | — | **oculta/morta** |
| 28 | `page-contasreceber` | [48075](../../index.html#L48075) | não | Financeiro | — | **oculta/morta** |
| 29 | `page-vendedores` | [48217](../../index.html#L48217) | sim | Cadastros | ~ | ativa |
| 30 | `page-nfe` | [48291](../../index.html#L48291) | não | Financeiro | — | **oculta/morta** |
| 31 | `page-logistica` | [48307](../../index.html#L48307) | não | Logística | — | **oculta/morta** |
| 32 | `page-motoristas` | [48336](../../index.html#L48336) | não | Logística | — | **oculta/morta** |
| 33 | `page-relatorios` | [48344](../../index.html#L48344) | sim | Análises | ~ | ativa (~28 relatórios, §4.9) |
| 34 | `page-comissoes` | [48410](../../index.html#L48410) | sim 🔒 | Financeiro | ✔ | ativa |
| 35 | `page-caixas-perdidas` | [48450](../../index.html#L48450) | sim | Análises | ~ | ativa |
| 36 | `page-inconformidades` | [48496](../../index.html#L48496) | sim | Qualidade | ~ | ativa (grava em tabela inexistente) |
| 37 | `page-relmensal` | [48644](../../index.html#L48644) | sim | Análises | ~ | ativa (dados fixos de março) |
| 38 | `page-configuracoes` | [48665](../../index.html#L48665) | sim | Análises | ~ | **quebrada** (tabela `configuracoes` inexistente) |
| 39 | `page-artefinal` | [48814](../../index.html#L48814) | não | — | — | **oculta** |
| 40 | `page-orcamentos` | [48929](../../index.html#L48929) | sim 🔒 | Financeiro | ✔ | ativa |
| 41 | `page-fornecedores` | [48942](../../index.html#L48942) | sim | Cadastros | ~ | ativa (abas Cotações/Avaliação quebradas) |
| 42 | `page-compras` | [48959](../../index.html#L48959) | sim (Papelão) | Papelão | ✔ | ativa |
| 43 | `page-operadores` | [48978](../../index.html#L48978) | sim | Qualidade | ~ | ativa (ranking por operador quebrado) |
| 44 | `page-qualidade` | [48998](../../index.html#L48998) | não | — | — | **oculta/morta** |
| 45 | `page-dashboard` | [49021](../../index.html#L49021) | sim | Análises | ~ | ativa |

> Total: **45 páginas** com `id="page-*"` no HTML + a tela `#tela-home` ([L46325](../../index.html#L46325)),
> que é um segundo layout de "home" (`display:none`) além do Hub. Páginas ocultas/mortas: 9.

---

## 4. Fichas por módulo

> As rotas citadas são as **reais** do `server.js` (levantadas por
> `app.<verbo>('/rota')`, 439 rotas únicas — ver §6). "Campos enviados/recebidos"
> em nível de payload fica explicitado na rota correspondente no `server.js`;
> o detalhamento campo a campo será feito na etapa de implementação de cada módulo
> (ver §8), para não inferir.

### 4.1 Produção

**PCP / Programação** — `page-pcp` ([L46636](../../index.html#L46636)) · menu "PCP / Programação"
- **Informações:** abas OFs, Amostras, Recorrentes; tabela de OFs (nº, cliente, descrição, máquina, entrega, status), totais.
- **Ações:** buscar/filtrar, criar OF (OF Rápida), editar, imprimir, exportar; trocar de aba.
- **APIs:** `GET/POST/PUT/PATCH/DELETE /api/ofs*` (22 rotas) · `/api/ofs/proximo-numero`; `/api/pedidos_recorrentes*` (5); `/api/amostras*` (4).
- **Permissão:** login (sem cadeado).
- **Depende de / abre:** OF Rápida (novo/editar), OFs por Máquina, Histórico de Passagens.
- **Celular:** só genérico.
- **Frequência:** alta (escritório/PCP).
- **Ressalva:** a aba **Recorrentes** usa tabela inexistente (`08_INVENTARIO`; confirmar com o Yago).

**OFs por Máquina** — `page-ofmaq` ([L46704](../../index.html#L46704)) · menu "OFs por Máquina"
- **Dois pipelines:** máquina única e todas as máquinas (mantidos exatamente como estão — regra do usuário).
- **Informações:** cards por máquina (capacidade tempo × horário real), fila de OFs, status, empresa, urgência, sem papelão.
- **Ações:** abrir OF, passou máquina, concluir etapa, marcar urgente, marcar sem papelão, mover OF, alterar máquina, alterar entrega, imprimir.
- **APIs:** `/api/ofs*`, `/api/of-passagens`, `/api/passagens*`, `/api/maquinas*`, `/api/fluxos*`, `/api/ofs/proximo-numero`.
- **Permissão:** login.
- **Depende de / abre:** OF Rápida (edição), Histórico de Passagens; modais `modal-iniciar-producao` ([L8831](../../index.html#L8831)), `modal-concluir-etapa` ([L12824](../../index.html#L12824)), `modal-sem-papelao` ([L12966](../../index.html#L12966)), `modal-mover-ofmaq` ([L50178](../../index.html#L50178)), `modal-alterar-maquina-ofmaq` ([L50372](../../index.html#L50372)).
- **Celular:** ✔ CSS dedicado.
- **Frequência:** muito alta (chão de fábrica).

**OF Rápida (criar e editar) / Nova OF** — dentro do PCP
- **Ficha completa:** já documentada no PR P1 (arquivo 03 do inventário Claude) e no commit `4aff333`.
- **APIs:** `POST /api/ofs`, `PATCH/PUT /api/ofs/:id`, `GET /api/ofs/proximo-numero`.
- **Permissão:** login. **Número da OF é definido pelo servidor** (o front agora não bloqueia o salvar — commit `4aff333`).

**Histórico de Passagens** — `page-historico-passagens` ([L46755](../../index.html#L46755))
- **APIs:** `/api/passagens*` (3), `/api/of-passagens`, `/api/relatorios/*`.
- **Celular:** genérico. **Frequência:** média (gestão/qualidade).
- **Ressalva:** 3 modelos de passagem coexistem (REL-P3).

**Armazenamento de OFs** — `page-lancamento` ([L47166](../../index.html#L47166)) · menu "Armazenamento de OFs"
- id interno `lancamento`. **APIs:** `/api/ofs*`. **Celular:** genérico.

**Hub Inicial** — `page-hub` ([L46836](../../index.html#L46836)) · menu "Hub Inicial"
- **Informações:** KPIs, atalhos por setor, painel de cliente (`hub-cli-modal` [L47007](../../index.html#L47007)), Jarvis.
- **APIs:** `/api/hub`, `/api/dashboard*`, `/api/pins*`, `/api/assistente*`, `/api/jarvis`.
- **Permissão:** login. **Celular:** genérico. **Frequência:** alta (todos).
- **Ressalva:** 2 KPIs com erro (ISSUE-06); widget de pins usa tabela `pins` que não existe.

**Pedidos Recorrentes** — `page-pedidos-recorrentes` ([L47299](../../index.html#L47299))
- **APIs:** `/api/pedidos_recorrentes*` (5). **Ressalva:** 5 rotas sobre tabela inexistente (bloqueio conhecido).
- **Correção P1 já aplicada:** validação de `empresa_id` (Jarvis/Recorrentes) no `server.js` (commit `c167376`/`9cc84e6`).

**Amostras** — `page-amostras` ([L47026](../../index.html#L47026)) · sem item de menu
- **API:** `/api/amostras*` (4). **Ressalva:** página órfã (redireciona ao PCP). Modal `modal-amostra` ([L49720](../../index.html#L49720)), `modal-amostra-feita` ([L19529](../../index.html#L19529)).

**Geração de imagem / OF Visual (6 templates SVG)** — fechada pelo usuário (set/26); não exposta no menu.

### 4.2 Comunicações

**Chat** — abre por `toggleChat()` ([L46227](../../index.html#L46227)); painel próprio.
- **API:** `/api/chat*` (6). **Ressalva:** lista de contatos dá 500 (`/api/chat/usuarios` seleciona colunas inexistentes).

**Agenda** — `page-agenda` ([L46808](../../index.html#L46808)); modal `modal-agenda` ([L53009](../../index.html#L53009)).
- **APIs:** `/api/agenda*` (4). **Ressalva:** sem uso (0 registros).

**Jarvis IA** — acionado do Hub (`_jarvisAbrir()`); painel próprio.
- **APIs:** `/api/assistente/acao`, `/api/jarvis`, `/api/ia`. **Ressalva:** `/assistente/acao` altera OFs para qualquer usuário logado (revisar permissão).

### 4.3 Máquinas

- **Fluxos** — `page-fluxos` ([L47651](../../index.html#L47651)) · `/api/fluxos*` (4); modal `modal-fluxo` ([L50314](../../index.html#L50314)).
- **Máquinas** — `page-maquinas` ([L47661](../../index.html#L47661)) · `/api/maquinas*` (9); modal `modal-maquina` ([L50329](../../index.html#L50329)). Ressalva: o front também chama `/api/machines` e `/api/equipamentos`, que dão 404.
- **Tipos de Caixa** — `page-tipos-caixa` ([L47723](../../index.html#L47723)) · `/api/tipos_caixa*` (4) e `/api/tipos-caixa` (1) — rota duplicada; modal `modal-tipo-caixa` ([L50409](../../index.html#L50409)).
- **Cores de Impressão** — `page-cores-impressao` ([L47674](../../index.html#L47674)) · `/api/cores-impressao*` (4); modal `modal-cor-impressao` ([L3021](../../index.html#L3021)).
- **Tempos Reais** — `page-tempos-reais` ([L47690](../../index.html#L47690)) · `/api/tempos_reais*` (4); modal `modal-tempos-reais` ([L50083](../../index.html#L50083)). Sem uso (0 registros).

### 4.4 Cadastros

- **Clientes** — `page-clientes` ([L47187](../../index.html#L47187)) · `/api/clientes*` (19); modais `modal-cli` ([L49456](../../index.html#L49456)), `modal-hist-cli` ([L50649](../../index.html#L50649)); `GET /api/clientes` filtra `ativo=true` salvo `incluir_inativos=true` (correção P1 `c167376`). 1.398 ativos; 14 nomes duplicados.
- **Mapa de Clientes** — `page-mapa-clientes` ([L47243](../../index.html#L47243)); modal `hub-cli-modal`. Geocodificação em runtime. **Celular:** restrito.
- **Fornecedores** — `page-fornecedores` ([L48942](../../index.html#L48942)) · `/api/fornecedores*` (6); modal `modal-fornecedor` ([L50285](../../index.html#L50285)). Abas Cotações (`/api/cotacoes*`) e Avaliação (`/api/avaliacoes_fornecedor*`) sobre tabelas inexistentes.
- **Vendedores** — `page-vendedores` ([L48217](../../index.html#L48217)) · `/api/vendedores*` (5) e `/api/visitas_vendedor*` (4); modais `modal-vend` ([L50233](../../index.html#L50233)), `modal-trocar-vend-of` ([L50252](../../index.html#L50252)). "VENDEDOR 03" inativo aparecia no formulário de OF (corrigido no P1: somente ativos).
- **Usuários** — `page-usuarios` ([L47078](../../index.html#L47078)) · `/api/usuarios*` (9); modais `modal-usr` ([L49394](../../index.html#L49394)), `modal-usr-senha` ([L49439](../../index.html#L49439)). **Única tela com `requireAdmin` real** ([server.js L1531](../../server.js#L1531)).

### 4.5 Qualidade

- **Operadores** — `page-operadores` ([L48978](../../index.html#L48978)) · `/api/operadores*` (5); modal `modal-operador` ([L50684](../../index.html#L50684)). Ranking por operador quebrado (`/api/perdas/por-operador` sempre falha).
- **Inconformidades** — `page-inconformidades` ([L48496](../../index.html#L48496)) · `/api/inconformidades*` (6) e `/api/inconformidades_controle*` (2); modais `modal-inconformidade` ([L49050](../../index.html#L49050)), `modal-inconformidade-manual` ([L49101](../../index.html#L49101)), `modal-inc-resolver` ([L49193](../../index.html#L49193)), `modal-inconf` ([L50704](../../index.html#L50704)). Grava em tabela inexistente (1 registro hoje).
- **Caixas Perdidas** — `page-caixas-perdidas` ([L48450](../../index.html#L48450)) · `/api/caixas-perdidas*` (3) e `/api/caixas_perdidas*` (5) — duplicadas. 1.915 registros.

### 4.6 Financeiro 🔒 (abre com senha fixa no front; ver FIN-P1)

- **Orçamentos + Calculadora** — `page-orcamentos` ([L48929](../../index.html#L48929)) · `/api/orcamentos*` (10), `/api/orcamentos_pastas*` (4); modais `modal-orc` ([L50432](../../index.html#L50432)), `modal-calc` ([L49952](../../index.html#L49952)), `modal-calculadora` ([L49953](../../index.html#L49953)). Página pública `GET /orcamento-publico/:id` ([server.js](../../server.js)). **Celular:** ✔.
- **Comissões** — `page-comissoes` ([L48410](../../index.html#L48410)) · `/api/comissoes*` (3). **Celular:** ✔.
- **Central de Custos** — `/api/central-custos*` (12), `/api/centros-custo*` (4). 7 centros, 0 lançamentos.
- **Telas mortas:** `page-contaspagar` ([L48025](../../index.html#L48025)), `page-contasreceber` ([L48075](../../index.html#L48075)), `page-nfe` ([L48291](../../index.html#L48291)), `page-logistica` ([L48307](../../index.html#L48307)), `page-motoristas` ([L48336](../../index.html#L48336)) — o drawer que as abre nunca é chamado.

### 4.7 Estoques

- **Estoque de Chapas** — `page-estoque` ([L47322](../../index.html#L47322)) · `/api/chapas*` (10), `/api/chapas_estoque*` (20), `/api/chapas_estoque_v2*` (6), `/api/chapas_estoque_movimentos*` (5), `/api/chapas_grupos*` (5), `/api/chapas_categorias*` (4); modais `modal-chp` ([L49493](../../index.html#L49493)), `modal-nova-chapa` ([L49530](../../index.html#L49530)), `modal-mov-linha` ([L49592](../../index.html#L49592)), `modal-baixa-conclusao` ([L49612](../../index.html#L49612)), `modal-excluir-chapa-confirm` ([L49768](../../index.html#L49768)), `modal-chapas-categorias` ([L49783](../../index.html#L49783)), `modal-receber-placa-chapas` ([L49856](../../index.html#L49856)), `modal-reset-chapas` ([L50586](../../index.html#L50586)). **Dois modelos em paralelo** (v1 e v2).
- **Recebimento de insumos / Entradas-Saídas** — `modal-receb-insumos` ([L49816](../../index.html#L49816)); `/api/recebimento_insumos*` (4), `/api/estoque_materiais*` (6), `/api/estoque_tintas*` (6).
- **Facas** — `page-facas1` ([L47820](../../index.html#L47820)) · `/api/facas*`, `/api/facas_estoque*` (4), `/api/facas_categorias*` (2); modal `modal-faca1` ([L47910](../../index.html#L47910)). `page-facas2` **morta**.
- **Clichês** — `page-cliches` ([L47880](../../index.html#L47880)) · `/api/cliches*`, `/api/cliches_estoque*` (4); modal `modal-cliche` ([L47953](../../index.html#L47953)).
- **Gramaturas, Tintas/Materiais, Dashboard de estoques, Lotes, Inteligência, Consumo** — rotas `/api/gramaturas*` (5), `/api/estoque_dashboard`, `/api/estoque_fotos`; `chapas_consumo` não existe.

### 4.8 Papelão

- **Compra de Papelão** — `page-compras` ([L48959](../../index.html#L48959)) · `/api/compras-chapas*` (14), `/api/compras*` (4), `/api/sugestoes-compra*` (3); modal `modal-compra` ([L50519](../../index.html#L50519)). **Celular:** ✔.
- **Seleção de Chapas** — `page-sel-chapas` ([L47519](../../index.html#L47519)).
- **Inteligência do Papelão** — `page-papelao-ia` ([L47631](../../index.html#L47631)).
- **Simulador de Desperdício/Corte** — `page-simd` ([L47528](../../index.html#L47528)) — fechado pelo usuário.

### 4.9 Análises

**Relatórios** — `page-relatorios` ([L48344](../../index.html#L48344)); `<select id="rel-tipo">` ([L48346](../../index.html#L48346)) com **28 opções**:
vendas-cliente, vendas-ramo, dre, tendencia-perdas, meta-perda-maquina, comparativo-empresas-grafico, producao-empilhada, resultado-empresas, vendas-por-vendedor, facas-mais-utilizadas, amostras-mes, projecao-vendas, clientes-inativos, frequencia-compra-clientes, resumo-anual, vendas-mensal-comissao, pedidos-aberto, pedidos-concluidos, estoque-atual, estoque, maquinas, eficiencia-maquina, compras, capacidade-semanal, nfe-importar, whatsapp-zapi, google-calendar, email-relatorio.
- **APIs:** `/api/relatorios*` (34), `/api/relatorio*` (10), `/api/notas_fiscais*` (5), `/api/integracoes*` (5), `/api/email`. Exportações: `exportarRelCSV()`, `exportarRelExcel()`, `imprimirRel()` ([L48394-48397](../../index.html#L48394-L48397)).

**Dashboard** — `page-dashboard` ([L49021](../../index.html#L49021)) · `/api/dashboard*` (6), `/api/analises` (2), `/api/analytics` (2). "Valor de Produção" protegido por senha fixa ([index.html L33544](../../index.html#L33544)).

**Relatório Mensal** — `page-relmensal` ([L48644](../../index.html#L48644)) — dados fixos de março.

**Configurações** — `page-configuracoes` ([L48665](../../index.html#L48665)) · `/api/configuracoes*` (2). **Quebrada** (tabela `configuracoes` inexistente).

### 4.10 Órfãs / mortas (sem link útil)

`page-tablets` ([L47752](../../index.html#L47752)), `page-apontamento` ([L47760](../../index.html#L47760)), `page-artefinal` ([L48814](../../index.html#L48814)), `page-qualidade` ([L48998](../../index.html#L48998)), `page-facas2` ([L47850](../../index.html#L47850)), `page-contaspagar`, `page-contasreceber`, `page-nfe`, `page-logistica`, `page-motoristas`.
Pastas `erp-italy-v2/`, `italy-erp-v2/`, `project-rebuild/`: tentativas antigas de v2, nunca implantadas (remover do deploy — SEC-01).

---

## 5. Modais (73) — duas implementações

- **Implementação A —`.modal-overlay`** (46 no `index.html`): overlay + `.modal`.
- **Implementação B —`position:fixed` inline** (30 no `index.html`, via `style="…position:fixed…z-index:9999"`): sem classe padronizada.
- Aparecem ainda `z-index:9999` **49×** no `index.html` e **32×** no `patch.js`.

| id | Linha | Tela/módulo | Finalidade |
|---|---|---|---|
| `modal-cor-impressao` | [3021](../../index.html#L3021) | Máquinas | cadastro de cor |
| `modal-todas-ofs` | [7205](../../index.html#L7205) | OFs | listagem de todas as OFs |
| `modal-rel-maquina` | [7609](../../index.html#L7609) | Relatórios | relatório por máquina |
| `inc-registrar-modal-host` | [8194](../../index.html#L8194) | Qualidade | host de inconformidade |
| `modal-iniciar-producao` | [8831](../../index.html#L8831) | OFs por Máquina | (existe no HTML; ver ressalva §7) |
| `modal-concluir-etapa` | [12824](../../index.html#L12824) | OFs por Máquina | concluir etapa |
| `modal-sem-papelao` | [12966](../../index.html#L12966) | OFs por Máquina | marcar sem papelão |
| `modal-amostra-feita` | [19529](../../index.html#L19529) | Amostras | amostra feita |
| `rec-emp-modal` | [22682](../../index.html#L22682) | Recorrentes | empresa do recorrente |
| `modal-toneladas-body` | [24595](../../index.html#L24595) | Operadores/Estoque | toneladas |
| `hub-cli-modal` | [47007](../../index.html#L47007) | Hub | painel do cliente |
| `modal-roteiro` | [47130](../../index.html#L47130) | Logística | nova cidade/roteiro |
| `modal-faca1` | [47910](../../index.html#L47910) | Facas | cadastro |
| `modal-cliche` | [47953](../../index.html#L47953) | Clichês | cadastro |
| `modal-help-shortcuts` | [47996](../../index.html#L47996) | Global | atalhos |
| `modal-conta-pagar` | [48124](../../index.html#L48124) | Financeiro (morta) | conta a pagar |
| `modal-conta-receber` | [48174](../../index.html#L48174) | Financeiro (morta) | conta a receber |
| `modal-inconformidade` | [49050](../../index.html#L49050) | Qualidade | registrar |
| `modal-inconformidade-manual` | [49101](../../index.html#L49101) | Qualidade | registrar manual |
| `modal-inc-resolver` | [49193](../../index.html#L49193) | Qualidade | resolver |
| `modal-of` | [49210](../../index.html#L49210) | PCP | OF (modal antigo) |
| `modal-usr` | [49394](../../index.html#L49394) | Usuários | cadastro |
| `modal-usr-senha` | [49439](../../index.html#L49439) | Usuários | senha |
| `modal-cli` | [49456](../../index.html#L49456) | Clientes | cadastro |
| `modal-chp` | [49493](../../index.html#L49493) | Estoque | chapa |
| `modal-nova-chapa` | [49530](../../index.html#L49530) | Estoque | nova chapa |
| `modal-mov-linha` | [49592](../../index.html#L49592) | Estoque | movimento |
| `modal-baixa-conclusao` | [49612](../../index.html#L49612) | Estoque | baixa por conclusão |
| `modal-cp-maq` | [49682](../../index.html#L49682) | OFs por Máquina | copiar/maq? |
| `modal-reconcluir-of` | [49699](../../index.html#L49699) | OFs | reconcluir |
| `modal-amostra` | [49720](../../index.html#L49720) | Amostras | amostra |
| `modal-excluir-chapa-confirm` | [49768](../../index.html#L49768) | Estoque | confirmar exclusão |
| `modal-chapas-categorias` | [49783](../../index.html#L49783) | Estoque | categorias |
| `modal-receb-insumos` | [49816](../../index.html#L49816) | Estoques | recebimento |
| `modal-receber-placa-chapas` | [49856](../../index.html#L49856) | Estoque | receber placa |
| `modal-ent` | [49894](../../index.html#L49894) | Estoque | entrada |
| `modal-aj` | [49911](../../index.html#L49911) | Estoque | ajuste |
| `modal-atv` | [49927](../../index.html#L49927) | Estoque | atividade |
| `modal-img` | [49939](../../index.html#L49939) | Global | visualizador de imagem |
| `modal-calc` | [49952](../../index.html#L49952) | Orçamentos | calculadora (overlay) |
| `modal-calculadora` | [49953](../../index.html#L49953) | Orçamentos | calculadora |
| `modal-tempos-reais` | [50083](../../index.html#L50083) | Máquinas | tempos reais |
| `modal-nfe` | [50109](../../index.html#L50109) | Financeiro (morta) | NF-e |
| `modal-entrega` | [50138](../../index.html#L50138) | Logística | entrega |
| `modal-alterar-entrega` | [50158](../../index.html#L50158) | Logística | alterar entrega |
| `modal-mover-ofmaq` | [50178](../../index.html#L50178) | OFs por Máquina | mover OF |
| `modal-oque-vai-semana` | [50194](../../index.html#L50194) | PCP | o que vai na semana |
| `modal-email-enviar` | [50208](../../index.html#L50208) | Relatórios | enviar email |
| `modal-vend` | [50233](../../index.html#L50233) | Vendedores | cadastro |
| `modal-trocar-vend-of` | [50252](../../index.html#L50252) | PCP/OF | trocar vendedor |
| `modal-mot` | [50267](../../index.html#L50267) | Logística (morta) | motorista |
| `modal-fornecedor` | [50285](../../index.html#L50285) | Fornecedores | cadastro |
| `modal-fluxo` | [50314](../../index.html#L50314) | Máquinas | fluxo |
| `modal-maquina` | [50329](../../index.html#L50329) | Máquinas | máquina |
| `modal-alterar-maquina-ofmaq` | [50372](../../index.html#L50372) | OFs por Máquina | alterar máquina |
| `modal-tipo-caixa` | [50409](../../index.html#L50409) | Máquinas | tipo de caixa |
| `modal-orc` | [50432](../../index.html#L50432) | Orçamentos | orçamento |
| `modal-compra` | [50519](../../index.html#L50519) | Papelão | compra |
| `modal-reset-chapas` | [50586](../../index.html#L50586) | Estoque | reset |
| `modal-rm-manual` | [50602](../../index.html#L50602) | Estoque | ressuprimento manual |
| `modal-rm-aparra` | [50628](../../index.html#L50628) | Estoque | ressuprimento por aparas |
| `modal-hist-cli` | [50649](../../index.html#L50649) | Clientes | histórico |
| `modal-entrada-xml` | [50657](../../index.html#L50657) | Financeiro/NF-e | entrada por XML |
| `modal-operador` | [50684](../../index.html#L50684) | Operadores | cadastro |
| `modal-inconf` | [50704](../../index.html#L50704) | Qualidade | inconformidade |
| `modal-refeito` | [52961](../../index.html#L52961) | OFs por Máquina | refeito |
| `modal-agenda` | [53009](../../index.html#L53009) | Agenda | programar visita |
| `modal-avisos` | [60681](../../index.html#L60681) | Global | avisos |

> **Ressalva importante:** o prompt do projeto proíbe criar "Iniciar/Pausar produção".
> Ele **não** deve ser criado. No entanto, **já existe** um `modal-iniciar-producao`
> ([L8831](../../index.html#L8831)) no HTML atual. A auditoria **registra a existência**
> sem alterar nada; cabe ao Yago decidir se é usado ou legado (não é alvo desta fase).

---

## 6. APIs por módulo (rotas reais do `server.js`)

Total: **439 rotas únicas** (431 sob `/api`). Grupos com contagem:

`/api/ofs` 22 · `/api/relatorios` 34 · `/api/chapas_estoque` 20 · `/api/clientes` 19 ·
`/api/compras-chapas` 14 · `/api/central-custos` 12 · `/api/chapas` 10 · `/api/orcamentos` 10 ·
`/api/relatorio` 10 · `/api/maquinas` 9 · `/api/usuarios` 9 · `/api/admin` 8 ·
`/api/chat` 6 · `/api/dashboard` 6 · `/api/estoque_materiais` 6 · `/api/estoque_tintas` 6 ·
`/api/fornecedores` 6 · `/api/inconformidades` 6 · `/api/chapas_estoque_v2` 6 ·
`/api/caixas_perdidas` 5 · `/api/chapas_estoque_movimentos` 5 · `/api/chapas_grupos` 5 ·
`/api/cidades` 5 · `/api/estados` 5 · `/api/gramaturas` 5 · `/api/integracoes` 5 ·
`/api/notas_fiscais` 5 · `/api/operadores` 5 · `/api/pedidos_recorrentes` 5 ·
`/api/ramos_atividade` 5 · `/api/vendedores` 5 · `/api/_debug` 5 · … (demais < 5).

Rotas de página estática: `GET /`, `/index.html`, `/patch.js`, `/sw.js`, `/manifest.json`,
`/icon-192.png`, `/icon-512.png`, `/orcamento-publico/:id`.

---

## 7. Permissões

| Mecanismo | Onde | Alcance |
|---|---|---|
| `requireAdmin` | [server.js L1531](../../server.js#L1531) | **só** Usuários, alguns `/api/admin/*`, integrações, email de relatórios |
| Senha do Financeiro | [index.html L5470-5504](../../index.html#L5470-L5504) (menu) e [L33544](../../index.html#L33544) (Valor de Produção) | **senha fixa no front** — não protege a API (FIN-P1) |
| `authMiddleware` | server.js (login/token) | demais rotas |
| Jarvis `/assistente/acao` | server.js | altera OFs para qualquer usuário logado (revisar) |

---

## 8. Pendências desta auditoria (não inventadas, apenas não medidas)

1. **Uso real por tela** (linhas no banco): números do `08_INVENTARIO` do Claude, **não revalidados** aqui — exigem consulta ao banco (o Yago confirmou restrição de não usar o Supabase MCP nesta fase).
2. **Campos de payload por rota**: a autoridade é o `server.js`; o detalhamento campo a campo será feito na implementação de cada módulo.
3. **Frequência de uso por setor**: estimativa qualitativa (chão de fábrica / escritório / gestão) — confirmar com o Yago.
4. **Celular por tela**: classificado por presença de CSS dedicado; a validação funcional em 390 px entra nas etapas de módulo (com mock).
5. **Telas mortas/órfãs**: confirmar com o Yago antes de qualquer decisão de remoção.
