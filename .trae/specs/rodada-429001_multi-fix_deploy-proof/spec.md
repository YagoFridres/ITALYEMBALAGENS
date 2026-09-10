# Rodada 429001 — Multi-fix + Prova Real de Deploy
## Product Requirements Document (PRD)

## Overview
- **Summary:** Rodada massiva de 13 itens em 2 blocos: (Bloco A) Diagnóstico AO VIVO obrigatório dos itens 1-7 (aplicados 427001/428001, nunca confirmados browser real — NÃO reescrever código que já funciona, somente corrigir os que o diagnóstico provar estar quebrado); (Bloco B) Implementar 6 itens novos (8-13: PCP sort, Projeção Vendas, Resumo Anual Todas, Mapa Clientes crítico, Perdas Operador, Operadores modernizados); (Bloco C) Prova obrigatória de deploy final via `/api/version` retornando PATCH=timestamp igual ao commit enviado.
- **Purpose:** (1) Separar definitivamente o que já funciona vs o que está quebrado de fato nos itens 427001/428001 (evitar retrabalho); (2) Entregar os 6 itens novos pendentes; (3) Garantir 100% de confirmação de deploy — acabou a história de "deployou? não sei".
- **Target Users:** Usuários finais Italy Embalagens + Cartoeste + Oestepack.

## Goals
1. (G1 — Bloqueante antes de qualquer edição) **Diagnóstico 100% browser real de 7 itens antigos:** classificar cada um em (FUNCIONA ✅ NÃO EDITAR) vs (QUEBRADO ❌ CORRIGIR). Relatório público ao usuário com evidências: snapshots + console evaluates + network.
2. (G2) Corrigir apenas os itens de G1 classificados ❌ (0 retrabalho em itens já OK).
3. (G3) Implementar 6 itens novos (itens 8 a 13) com qualidade de produção, usando como base os artifacts já aprovados da rodada 427-428 (herdados spec.md/tasks.md).
4. (G4 — Bloqueante final) **Prova real de deploy via `/api/version`:** resultado exato do endpoint colado na resposta, PATCH=YYYYMMDDHHMMSS igual ao SHA do commit novo na Railway.

## Non-Goals
- NÃO alterar tabelas de banco novas sem SQL Editor manual do usuário (aproveitar colunas existentes: ativo, maq_principal, operadores_conclusao JSONB).
- NÃO conectar Supabase MCP (Fact 2 PERMANENTE PROIBIÇÃO: só REST server.js whitelist / SQL Editor manual).
- NÃO refazer UI inteira de tela nenhuma (só patches cirúrgicos).
- NÃO mexer no server /api/vendedores dedup agora (decisão explícita do usuário: ficar de olho, investigar só se o frontend dedup 3 camadas não resolver 100% dos casos).

## Background & Context
- **Fatos permanentes VERBATIM:** Fact 1 (URL prod, Railway push→main→deploy); Fact 2 (não Supabase MCP); Fact 3 (git diff --stat 300-500L/commit, se maior PARAR); Fact 4 (index.html só 2 bumps inline no mesmo commit); Fact 5 (5 bumps obrigatórios por commit); Fact 6 (UUIDs 3 empresas); Fact 8 (ordem tarefas resolvidas até 427001).
- **Deploy ativo no momento do spec:** commit 22df84e hotfix 428001 (SHA=22df84e, PATCH=20260910428001) → Railway sendo deployado. Temos que verificar no Fim de G0 se esse patch já está ativo ANTES de rodar diagnóstico G1 (para testar o hotfix mais novo, não código antigo!).
- **Open Questions já respondidas (Confirmed Fact 11 user VERBATIM):** (a) Perdas Operador inclui canceladas COM qtd_perdida>0; (b) Operadores: sugerir TODOS os vinculados à mesma máquina principal.
- **Itens G1 (7 diagnósticos obrigatórios):**
  1. Compra Papelão (CMP): lista vazia "nenhuma compra encontrada"
  2. Passou pela Máquina: trava/não grava em passagens_maquina
  3. Orçamentos: Parâmetros Comerciais não recalculam oninput
  4. Compra Papelão impressão: vincos não mostra "9/9/9/9"
  5. Amostras Pendentes: trava em "Carregando..."
  6. Cliente "USE 7": hotfix tokenização resolveu? (print resultado da busca)
  7. Vendedor duplicado Conclusão OF: dedup 3 camadas resolveu?
- **Itens G3 (6 implementações novas):**
  8. PCP/Programação sort — OFs antigas (ex: Nº 798) NÃO devem estar no topo; esperado [3343,3342,... numérico DESC]
  9. Relatório Projeção Vendas: não abre/não gera
  10. Resumo Anual: opção "Todas as Empresas" (somar E1+E2+E3)
  11. Mapa Clientes: 3 problemas: visual + formulários não salvam + CRÍTICO modal "Novo Estado" vazando para outras telas
  12. Novo relatório Perdas por Operador (mês/ano)
  13. Modernizar Operadores: toggle ativo/inativo + vincular máquina principal (schema já pronto)

---

## Functional Requirements (Bloco G1 + G3)

### (PRÉ-REQUISITO BLOQUEANTE) FR-G0: Verificar deploy ativo /api/version ANTES de G1
- ANTES de rodar qualquer teste de diagnóstico item 1-7, bater `GET /api/version` na produção e confirmar que PATCH ≥ 20260910428001 (hotfix da manhã já deployado).
- Se ainda PATCH=20260910427001 ou menor → aguardar 60s e re-bater, repetir no máximo 8x.
- Motivo: o diagnóstico G1 precisa rodar no código que enviamos hoje, não no código de ontem!

### FR-G1: Diagnóstico Browser Real dos 7 itens antigos (nenhuma edição de código ainda)
Para cada item 1..7:
- Passo A: Navegar até a tela.
- Passo B: Reproduzir cenário.
- Passo C: Registrar evidência objetiva: (1) snapshot da tela; (2) console evaluate `typeof` / flags de estado / innerHTML; (3) console errors.
- Passo D: Classificação binária obrigatória: **FUNCIONA ✅ (NÃO EDITAR)** OU **QUEBRADO ❌ (CORRIGIR)**.
- Classificação NÃO pode ser "talvez". Fornecer evidência explícita para cada.

### FR-8 (G3: Item 8) — PCP/Programação Ordenação Correta
- Painel OFs (Programação / PCP) ordenar por **campo numérico do número da OF** (não string, para evitar "798">"3340").
- Default: **DESC** (maior número primeiro = mais recente no topo).
- Resultado esperado na tela hoje: top10 = [3343, 3342, 3341, 3340, 3339, 3338, 3337, 3336, 3335, 3334]. 798, 722, 544 NÃO aparecem no top 10.

### FR-9 (G3: Item 9) — Projeção de Vendas (Abre e Gera)
- `window.renderProjecaoVendas` exista no escopo global.
- Menu Relatórios → Projeção Vendas: abre modal SEM toast "Widget de projeção não carregado".
- Ao abrir: widget renderiza pelo menos 6 meses de histórico + projeção com barras/valores reais (dados do backend /api/relatorios/projecao-vendas).
- Seletor de ano: trocar ano → recalcula.

### FR-10 (G3: Item 10) — Resumo Anual + "Todas as Empresas"
- Frontend: `<select>` header do Resumo Anual tem 4 opções: Italy / Cartoeste / Oestepack / **Todas as empresas (Soma)**.
- Backend `GET /api/relatorios/resumo-anual?emp_id=ALL` retorna soma 3 empresas.
- Valor referência (conferência visual): setembro/2026 → ≈ 117 OFs concluídas / ≈ R$ 182.698,49 soma 3.

### FR-11 (G3: Item 11) — Mapa Clientes (3 frentes)
**11a (Visual):** Usar classes `pep-wrap pep-card` padrão do design system. Remover estilos inline quebrados.  
**11b (Salvar):** Formulários "Novo Estado", "Nova Cidade", "Novo Ramo" → onclick salvar REAL chama POST `/api/estados`, `/api/cidades`, `/api/ramos_atividade`; retorno 200 atualiza a lista sem F5.  
**11c (Vazamento MODAL — MAIS CRÍTICO DOS 13 itens):** modais de "Novo Estado" / "Nova Cidade" etc NÃO PODEM vazar para outras telas: (1) renderizados dentro de overlay `position:fixed; inset:0; z-index:99999;`; (2) fecham em **todas** as 4 situações: Cancelar, click fora, navegação `window.go()`, `popstate/hashchange`; (3) após navegação, `document.querySelectorAll('[id$="-modal"]')` = vazio.

### FR-12 (G3: Item 12) — Novo Relatório Perdas por Operador
- Entry menu ao lado de Resumo/Projeção.
- Filtros: mês (1-12) + ano (numérico) + Buscar.
- Fonte dados: `GET /api/relatorios/perdas-operador` endpoint NOVO server.js.
- Query: OFs no mês/ano com qtd_perdida>0 OU maquina_perda not null (inclui canceladas, user confirmou).
- Unpack `operadores_conclusao` (JSONB array text) → Map por operador → soma qtd_perdida + valor_perdida (pro-rata com valor_total/qtd).
- Tabela: Operador | Qtd Perdida | Valor Perdido | OFs com perda | % Perda.
- Cards topo: Total Perdido R$ | Total Caixas Perdidas | % Perda no período | Top 3 Operadores.

### FR-13 (G3: Item 13) — Modernizar Operadores (2 frentes + 1 integração)
**13a Interface Gestão:** Tabela Operadores tem toggle ativo/inativo + dropdown máquina principal (todas máquinas cadastradas); salvar PUT `/api/operadores/:id` com `ativo:boolean`, `maq_principal:string`.  
**13b Inativação filtro:** Modal Conclusão OF — chips/select operadores MOSTRAM SOMENTE os ativos=true.  
**13c Sugestão máquina_principal:** Se Modal Conclusão OF tiver máquina atual=X, operadores que têm `maq_principal=X` aparecem PRÉ-SELECIONADOS/destacados como sugestão.

---

## Non-Functional Requirements
- **NFR-1 Prova deploy 100% verificada:** Resultado EXATO do `/api/version` final colado na resposta ao usuário; `response.patch` deve ser NUMERICAMENTE igual ao timestamp do último bumps (429001+), e x-index-patch-version / response.git_sha (se tiver) bater com o commit SHA pushado.
- **NFR-2 Não retrabalho:** itens G1 classificados FUNCIONA ✅ → 0 edições de código em nada relacionado.
- **NFR-3 Robustez:** 0 throws desprotegidos; qualquer fetch async try/finally com fallback UI (não spinner eterno — já específico item 5 se quebrado).
- **NFR-4 Fact3:** Cada commit ≤ 500L. Se for 1000L+ → dividir em 2 commits (ex: itens 8-10, depois 11-13).
- **NFR-5 Fact5 todo commit:** 5 bumps sempre; PATCH estritamente maior que o anterior (20260910428001 → próximo = 20260910429001).

## Constraints / Assumptions
- (herdado) Senha Financeiro 1234 para abrir Orçamentos se necessário.
- (herdado) Colunas `operadores.ativo`, `operadores.maq_principal` existem no banco (se não existir, migration SQL manual via usuário).
- (novo) Para diagnóstico G1, se algum teste precisar de OF específica / compra específica: usar evaluate com dados mocado para confirmar comportamento se não houver dado, mas classificar com base em estrutura/lógica.

## Acceptance Criteria (Obrigatórios: rule ou rubric)

### AC-G0 (rule) Pré-check deploy 428001 ativo
- **Given:** Railway deploy 22df84e começou há pelo menos 2 minutos
- **When:** `fetch('/api/version').then(r=>r.json())`
- **Then:** `body.patch >= '20260910428001'` lexicograficamente
- **Evidence:** response JSON colado verbatim

### AC-G1-r1..r7 (rule x7) Classificação explícita binária de cada item 1-7
- Para cada item i∈[1..7]:
  - **Given:** tela item i aberta, reproduzido cenário
  - **When:** evidência coletada
  - **Then:** classificação (FUNCIONA ✅) OU (QUEBRADO ❌) + link para snapshot/evaluate correspondente
- **Evidence:** tabela 7 linhas com colunas [Item, Evidência Objective, Classificação]

### AC-8 (rule) PCP Ordenação DESC numérico estrita
- Given painel OFs carregado
- When extrair os 10 primeiros números OF do array interno `window.OFsOrdenados` (ou correspondente)
- Then primeiros 10 = 3343 > 3342 > 3341 > 3340 > 3339 > 3338 > 3337 > 3336 > 3335 > 3334 estrito
- Evidence evaluate + snapshot topo

### AC-9 (rule) Projeção Vendas abre
- Given navegador loaded patch.js completo
- When `typeof window.renderProjecaoVendas` + click menu Projeção
- Then tipo = 'function' e widget innerHTML.length ≥ 800 (tem dados visíveis)
- Evidence evaluate + snapshot modal aberto

### AC-10 (rule) Resumo Anual Todas empresas
- Given modal Resumo Anual aberto, sel Todas + set/2026, botão Buscar clicado
- When cards renderizados
- Then valor total OFs ≥ Italy sozinha (63) e ≈ 117; valor R$ ≈ 182k
- Evidence network request response JSON (emp_id=ALL) + cards snapshot

### AC-11 (rule) Mapa Clientes modal não vaza
- Given tela Mapa Clientes → aberto modal "Novo Estado"
- When clicar menu Fornecedores (navegar para outra tela)
- Then `document.querySelectorAll('[id^="cad-"][id$="-modal"], .cad-overlay-*').length === 0`
- Evidence: 2x evaluate + 2x snapshots (antes vs depois navegação)

### AC-12 (rule) Perdas Operador gera dados
- Given modal Perdas Operador, mes=9, ano=2026, Buscar clicado
- Then `document.querySelectorAll('[data-perdas-op-row]').length >=1 OU mensagem "Sem perdas no período"` visível; endpoint 200
- Evidence network 200 response + snapshot

### AC-13 (rule) Operadores ativos=false invisíveis no Conclusão
- Given operador João (ativo=false) existe; operadores Maria e Pedro ativo=true maq_principal=IMPRESSORA_01
- When modal Conclusão OF aberto com máquina=IMPRESSORA_01
- Then João NÃO está na lista; Maria/Pedro marcados suggested=true
- Evidence evaluate nomes na lista + flags suggested

### AC-FINAL (rule — NÃO PASSAR SEM ISSO) Prova deploy real
- Given último commit pushed há ≥4 minutos (tempo Railway deploy)
- When `GET /api/version` poll retornar 200
- Then `resp.patch === 20260910429001` (ou timestamp do último bump) E `resp.git_sha === commit SHA` (ou cabeçalho x-git-sha)
- Evidence **RESPONSE JSON COMPLETO colado como texto, não resumido.**
