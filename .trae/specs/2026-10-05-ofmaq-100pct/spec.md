# OFs por Máquina (OFMAQ) 100% Funcional - Product Requirements Document
(pt-BR | Trae Spec Mode)

## Overview
- **Summary**: Ajustar a área de "OFs por Máquina" (OFMAQ) para ser 100% funcional e persistente em 5 blocos independentes: (A) autocomplete clientes no campo de busca, (B) botão "Ver Todas as Máquinas" funcionando para o dia selecionado, (C) todos os 9 botões do modal "Ações da OF" gravando e exibindo pop-up central, (D) remover botão interativo "Sem Papelão" de TODAS as telas exceto o modal de Ações do OFMAQ, (E) histórico de "Passou pela máquina" + botão "Histórico de hoje" com impressão/PDF.
- **Purpose**: Remover inconsistências de UI/banco, eliminar botões de Sem Papelão fora do local autorizado e prover auditabilidade completa de passagens de OFs por máquina, tudo com clique real + prova de persistência no banco.
- **Target Users**: Operador de chão de fábrica, PCP, administrativo.

## Goals
- G1: Campo de busca do OFMAQ sugere clientes (autocomplete) e filtra por cliente selecionado, mantendo busca livre.
- G2: "Ver Todas as Máquinas" exibe, no modo todas, as máquinas que têm OFs no dia selecionado, sem reset por polling.
- G3: Os 9 botões do modal Ações da OF (Passou / Urgente / Sem Papelão / Salvar Papel / Mover Máq / Alterar Data / Mover Máq+Data / Subir / Descer) gravam com sucesso HTTP 200, persistem após F5 e mostram pop-up central.
- G4: Botão interativo "Sem Papelão" só existe no modal "Ações da OF" do OFMAQ, mantendo badge/coluna somente leitura.
- G5: "Passou pela máquina" registra na tabela física `passagens_maquina` e aparece no histórico; novo botão "Histórico de hoje" mostra passagens do dia (agrupado por máquina, imprimível).

## Non-Goals
- N1: Não alterar Compra de Papelão, Orçamentos, Comissões, Relatórios (Freq/Perdas/Projeção), Jarvis, Clientes, Operadores, Custos, Modal de Conclusão, Kanban geral, Dashboard.
- N2: Não criar colunas novas no banco sem aprovação explícita do usuário via ALTER TABLE (Bloco C "Salvar dados do papel" precisará de coluna texto — em Open Questions).
- N3: Não alterar a seleção/filtro de quais OFs pertencem a cada dia/fonte canônica `/api/ofs` já usada.
- N4: Não refatorar estrutura global do patch.js fora da seção OFMAQ.

## Background & Context
- Contexto usuário confirmado (VERBATIM): Escopo travado SOMENTE tela OFs por Máquina (patch.js seção OFMAQ + endpoints server.js que ela usa). 1 commit + push separado por bloco, node --check + diff cirúrgico, bump de versão nos 5 pontos (server.js x2, sw.js, index.html x2), deploy confirmado em `/api/version`, teste com clique real + prova no banco antes de passar bloco.
- Colunas reais da tabela `ofs` confirmadas por `/api/ofs` em produção (2026-10-05 patch=20261001180000):
  - Boolean: `sem_papel`, `papel_comprado`, `urgente`, `urg`, `passou_maquina`
  - Integer: `ordem_maquina`, `prioridade_ordem`, `prioridade`, `seq`
  - Date: `dia`, `data_entrega`, `ent`, `previsao_entrega_papel`, `passou_em`, `data_conclusao`, `data_faturamento`
  - String/JSON: `maq` (jsonb stringificada), `maquina_agendada` (text), `passou_maquina_nome` (text), `passagens_maquina` (jsonb array)
  - IDs/Cliente: `id` (UUID), `numero`/`of` (text), `cli_id`/`cliente_id`, `cliente`/`cliente_nome`
- Tabela física `passagens_maquina` confirmada por código server.js L10828-L11090: colunas `of_id, of_numero, cliente, maquina, operador, data_passagem, hora_passagem, quantidade, status, empresa`.
- Endpoint `/api/passagens_maquina` GET público NÃO existe (404); fonte de histórico = coluna JSONB `ofs.passagens_maquina` (populada pelo POST passou-maquina) e consulta direta à tabela física para relatórios.
- Já existem (contexto confirmado): `showOfmaqCenterConfirm` (pop-up central), `__ALL__`/`showAllMachines`, `_applyIncrementalTbody`, polling suspenso pós-ação, `POST /api/ofs/:id/passou-maquina`.

## Functional Requirements
### Bloco A — Busca com autocomplete de clientes
- **FR-A1**: Campo "Buscar OF, cliente, produto, tamanho ou cor..." do OFMAQ sugere ~8 clientes ao digitar (fonte: lista já carregada em `window._CLIENTES || window.CLIENTES || fetch /api/clientes`).
- **FR-A2**: Sugestões são case/accent insensitive. Escolher uma sugestão filtra a lista OFMAQ para exibir apenas OFs daquele cliente; busca livre por OF/produto/tamanho/cor segue funcionando.
### Bloco B — Botão Ver Todas as Máquinas
- **FR-B1**: Clique em "Ver Todas as Máquinas" define o select como "Todas as máquinas" e exibe cards/tabela de TODAS as máquinas que possuem OFs NO DIA SELECIONADO (não na semana inteira).
- **FR-B2**: Segundoo clique volta ao modo "uma máquina"; o estado (todas/uma, dia, máquina selecionada) não reseta com polling.
### Bloco C — 9 Botões do modal Ações gravam + pop-up central
- **FR-C1**: 9 botões do modal: Passou pela máquina · Marcar/remover Urgente · Marcar Sem Papelão · Salvar dados do papel · Mover de máquina · Alterar data · Mover máquina+data · Mover para cima · Mover para baixo. Cada um emite HTTP 200, salva no banco e persiste após F5.
- **FR-C2**: Marcar urgente sincroniza `urgente`, `urg` e `prioridade_ordem` (1=urgente, 999=normal).
- **FR-C3**: Mover para cima/baixo persiste `ordem_maquina` (sobrevive F5, sem polling desfazer).
- **FR-C4**: Mover de máquina grava `maq` + `maquina_agendada`; Mover máquina+data grava os 2.
- **FR-C5**: "Salvar dados do papel": como o banco hoje só tem `papel_comprado` (BOOLEAN) e `previsao_entrega_papel` (DATE), só teremos funcionalidade de texto livre DEPOIS do usuário executar o ALTER TABLE de coluna de texto (ver Open Questions). Até lá, este botão edita apenas boolean+date existentes ou mostra mensagem explicativa.
- **FR-C6**: Pop-up central (showOfmaqCenterConfirm) com mensagem clara aparece em TODAS ações bem-sucedidas; erro mostra pop-up com causa.
### Bloco D — Botão Sem Papelão SOMENTE no modal Ações
- **FR-D1**: Remover botão interativo "Sem Papelão" de: (a) Dashboard tabela `#dash-tabela-ofs` data-dash-acao="sempapel", (b) kanban/zero `#ofmaq-action-sem-papel-zero`, (c) linhas OFMAQ `.patch-ofmaq-sem-papel-btn`, (d) cards OFMAQ `.patch-ofmaq-sem-papel-btn`, (e) handlers globais que criam/reativam o botão fora do modal.
- **FR-D2**: Manter coluna/badge SOMENTE LEITURA "Sem Papelão" (indicador visual, não clicável) em listagens. Manter lógica de salvar em `ofs.sem_papel` via modal de Ações.
### Bloco E — Histórico Passou pela máquina + Histórico de hoje
- **FR-E1**: Clique "Passou pela máquina" persiste em `passagens_maquina` + sincroniza `ofs.passagens_maquina` JSONB e aparece no histórico do relatório.
- **FR-E2**: Novo botão "Histórico de hoje" no topo do OFMAQ abre modal com: nº OF, cliente, máquina, horário, agrupado por máquina com totalizador, botão "Imprimir/PDF" usando `rrOpenPrint`. Fonte: `passagens_maquina` do dia (fuso America/Sao_Paulo).

## Non-Functional Requirements
- **NFR-1**: Cada bloco = 1 commit separado, `node --check server.js` exit 0, `git diff --stat` cirúrgico (< ~400 linhas totais por commit), 5 bumps obrigatórios por commit.
- **NFR-2**: Deploy Railway automático a cada push origin/main; `runtime.patch` atualizado em `/api/version` antes de validar bloco.
- **NFR-3**: Zero alterações fora de: `server.js` (endpoints OFMAQ + versão), `index.html` (2 bumps), `sw.js` (CACHE_NAME), `patch.js` (apenas seção OFMAQ + botões Sem Papelão fora para remoção).
- **NFR-4**: Teste real (clique DOM + HTTP 200 + valor no banco via GET /api/ofs/:id + F5 persiste) como prova por bloco.

## Constraints
- **Técnicas**: Nenhum `rpc/exec_sql`; todo UPDATE via PATCH /api/ofs/:id com whitelist existente e POST /api/ofs/:id/passou-maquina. Nenhuma migration automática.
- **Negócio**: Nenhum dado de OF é criado/removido; só atualizações de colunas OFMAQ + insert em passagens_maquina. Coluna nova só por ALTER TABLE aprovado pelo usuário.
- **Dependências**: Deploy Railway automático (push origin main), Supabase credenciais Railway, Service Worker cache-bust por versão, monkey patch login Fact6 (1234).

## Assumptions
- A1: Lista `/api/clientes` já está carregada em memória (autocomplete reaproveita; fallback é novo fetch leve limit=2000).
- A2: Endpoint POST passou-maquina já funciona e é a fonte canônica; só preciso garantir que a UI chama correto e exibe pop-up.
- A3: `rrOpenPrint` padrão de impressão já existe no sistema (outros relatórios usam) — reutilizar.
- A4: Bloco C "Salvar dados do papel" hoje é insuficiente (só bool+date) para texto livre; provavelmente será necessária coluna nova (confirmar em Open Questions).

## Acceptance Criteria

### AC-A1: Autocomplete sugere clientes no OFMAQ
- **Type**: `rule`
- **Given**: Tela OFMAQ carregada com 1+ cliente conhecido (ex: "MOVEIS RIPKE")
- **When**: Digitar "ripk" no campo de busca
- **Then**: Dropdown mostra ≤8 sugestões de cliente (case/accent insensitive), "MÓVEIS RIPKE" aparece
- **Pass Condition**: 1+ sugestão exibida, clicar filtra OFs para cliente escolhido (contagem linhas ≤ total inicial)
- **Evidence**: Screenshot DOM / contagem de linhas tabela OFMAQ antes/depois + payload GET `/api/ofs?cli_id=<>` confirma filtro

### AC-B1: Ver Todas as Máquinas mostra máquinas do dia selecionado
- **Type**: `rule`
- **Given**: Dia selecionado tem OFs em ≥2 máquinas
- **When**: Clicar no botão "Ver Todas as Máquinas"
- **Then**: Select mostra "Todas as máquinas"; cards/tabela mostram ≥2 seções de máquina (ex: IMP 01 + IMP 02) com a contagem de OFs do dia, não da semana
- **Pass Condition**: Nº de máquinas exibidas = nº de valores `maq` distintos nas OFs do dia (GET /api/ofs + filter dia)
- **Evidence**: GET `/api/ofs?dia=YYYY-MM-DD` agrupado por maq (count) vs contagem de headers de máquina na UI

### AC-C1: Todos os 9 botões do modal gravam, persistem e mostram pop-up
- **Type**: `rule`
- **Given**: Uma OF de teste aberta no modal de Ações
- **When**: Clicar em cada um dos 9 botões
- **Then**: Para cada ação: (1) HTTP 200, (2) GET /api/ofs/:id após ação retorna valor alterado, (3) F5 mantém valor, (4) pop-up central showOfmaqCenterConfirm aparece com texto da ação
- **Pass Condition**: 9/9 botões passam os 4 requisitos; os valores finais da OF são restaurados para estado original ou documentados
- **Evidence**: Tabela com colunas: Botão | HTTP | GET valor | F5 persistiu | Pop-up apareceu

### AC-D1: Botão interativo Sem Papelão só existe no modal de Ações do OFMAQ
- **Type**: `rule`
- **Given**: Navegação por Dashboard, Kanban/PCP, tabela OFMAQ, cards OFMAQ
- **When**: Procurar por selectores `.patch-ofmaq-sem-papel-btn`, `#ofmaq-action-sem-papel-zero`, `data-dash-acao="sempapel"` com querySelectorAll em cada tela
- **Then**: Elementos interativos são `length === 0` em todos os lugares exceto o modal Ações (data-ofmaq-final-action="sem-papel")
- **Pass Condition**: (length=0 em Dashboard, Kanban, Tabela, Cards) AND (length≥1 no modal Ações)
- **Evidence**: Objeto retornado de evaluate com counts por tela + selector modal

### AC-E1: Histórico de hoje mostra passagens do dia, agrupado por máquina, imprimível
- **Type**: `rule`
- **Given**: Marcar 2 OFs (máquinas distintas) como "Passou pela máquina" no dia
- **When**: Clicar no botão "Histórico de hoje"
- **Then**: Modal exibe as 2 OFs na máquina correta, com horário; total por máquina está correto; botão Imprimir chama rrOpenPrint sem erro
- **Pass Condition**: (Count linhas no modal ≥2) AND (Nº grupos máquina ≥2) AND (rrOpenPrint invocado com dados do dia)
- **Evidence**: POST passou-maquina ×2 OK, GET passagens de hoje confirma 2 linhas, screenshot modal + log rrOpenPrint chamado

### AC-E2: Passou pela máquina aparece no Histórico de Passagens existente
- **Type**: `rule`
- **Given**: Uma OF marcada como passou
- **When**: Abrir tela "Histórico de Passagens" e ↻ Atualizar
- **Then**: A OF aparece com a máquina correta ("Passou pela máquina X")
- **Pass Condition**: Linha encontrada com mesmo of_id
- **Evidence**: GET /api/ofs/:id retorna passou_maquina=true e passagens_maquina[] contém a entrada; avaliação DOM histórico

## Open Questions
- [ ] **OQ-C5 — "Salvar dados do papel" texto livre**: Atualmente `ofs.papel_comprado` é BOOLEAN e `ofs.previsao_entrega_papel` é DATE. Não há coluna de texto livre. Bloco C ficará incompleto até usuário executar ALTER TABLE (sugerido: `ALTER TABLE ofs ADD COLUMN IF NOT EXISTS papel_observacao TEXT NULL;` ou equivalente). Decisão pendente do usuário.
