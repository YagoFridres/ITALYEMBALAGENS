# OFs por Máquina (OFMAQ) 100% Funcional - Implementation Plan
(pt-BR | Trae Spec Mode | tasks.md)

## Convenções por commit / por bloco (obrigatório em CADA um de A-E)
Antes de marcar qualquer task como "pronta para validar", cada commit/bloco DEVE conter:
1. `node --check server.js` exit 0
2. `git diff --stat` ≤ ~400 linhas, tocando apenas os arquivos permitidos (server.js, patch.js seção OFMAQ, index.html x2, sw.js)
3. **5 bumps de versão**:
   - server.js `PATCH_RUNTIME_VERSION` + `SW_RUNTIME_VERSION` (2 bumps)
   - server.js `SW_RUNTIME_CACHE_NAME` (derivado, incluso no 2)
   - index.html `swVersion` (L33736)
   - index.html `<script src="/patch.js?v=...">` (L61174)
   - sw.js `CACHE_NAME`
4. `git add + commit + push origin main`
5. Poll `/api/version` → `runtime.patch === novo patch` (deploy confirmado Railway)
6. Teste real clique + prova GET banco + F5 persistência.

Padrão de patch por bloco (sequência depois do último 20261001180000):
- Bloco A → `20261005130000`
- Bloco B → `20261005140000`
- Bloco D → `20261005150000` (bloco D pode executar antes do C já que C depende de ALTER TABLE)
- Bloco E → `20261005160000`
- Bloco C → `20261005170000` (aguardando OQ-C5 ALTER TABLE)

---

## Task 1: Bloco A — Autocomplete clientes no campo busca OFMAQ (sem filtrar busca livre)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: "None" (primeiro bloco)
- **Description**:
  - Reaproveitar `window._CLIENTES || window.CLIENTES` ou endpoint `/api/clientes?limit=2000&fields=id,nome,rs`
  - Injetar UI de autocomplete abaixo do campo busca (8 itens, case/accent insensitive, limit 8)
  - Selecionar sugestão → setar filtro cliente_id e rerenderizar tabela/cards OFMAQ (busca livre por nº/produto/tamanho/cor continua funcionando via OR)
  - Fechar dropdown ao clicar fora, ESC limpar seleção
- **Acceptance Criteria Addressed**: [AC-A1](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/.trae/specs/2026-10-05-ofmaq-100pct/spec.md#ac-a1-autocomplete-sugere-clientes-no-ofmaq)
- **Test Requirements**:
  - `rule` TR-A1.1: Digitar "ripk" → sugestão com MÓVEIS RIPKE aparece (≤8 itens); evidence: evaluate `querySelectorAll('.ofmaq-autocomplete-item')` + screenshot DOM
  - `rule` TR-A1.2: Clicar na sugestão → tabela OFMAQ mostra ≤ linhas originais, todas daquele cliente (cli_id batendo); evidence: evaluate `[...rows].every(r => r.dataset.cliId === alvo)` + GET `/api/ofs?cli_id=<id>&dia=<hoje>` count confere
  - `rule` TR-A1.3: Digitar um nº de OF (ex: "3741") continua encontrando OF sem precisar de autocomplete; evidence: OF aparece mesmo com filtro cliente ativo depois limpo
- **Notes**: Evitar polling desfazer seleção; guardar filtro cliente em estado do pipeline OFMAQ.

---

## Task 2: Bloco B — Botão "Ver Todas as Máquinas" mostra máquinas do DIA selecionado
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1 (deploy ok, patches sincronizados)
- **Description**:
  - Reproduzir bug atual (clicar no botão, ver se continua IMP 01 / 1 máquina / máquinas de semana)
  - Garantir que `showAllMachines / __ALL__` filtre por `dia === selecionado` e agrupe por `maq`/`maquina_agendada`
  - Select mostra "Todas as máquinas"; segundo clique volta para a máquina anterior
  - Estado (`__all__:true/false`, dia, maqAnterior) persiste por polling (não "pula")
- **Acceptance Criteria Addressed**: [AC-B1](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/.trae/specs/2026-10-05-ofmaq-100pct/spec.md#ac-b1-ver-todas-as-m%C3%A1quinas-mostra-m%C3%A1quinas-do-dia-selecionado)
- **Test Requirements**:
  - `rule` TR-B1.1: Reprodução do bug (3 dias diferentes: muitos OFs / poucos / 0); evidence: objeto com cada dia {dia, qtdMaquinasUIantes, qtdMaquinasBanco}
  - `rule` TR-B1.2: 1º clique → select "Todas as máquinas"; nº headers de máquina na UI === nº `maq` distintos nas OFs do dia; evidence: evaluate headers count vs GET `/api/ofs?dia=YYYY-MM-DD` group maq count
  - `rule` TR-B1.3: Esperar ≥2 ciclos polling ou recarregar → estado "Todas as máquinas" persiste; evidence: getAttribute select antes/depois polling
- **Notes**: Não tocar na contagem de OFs da semana nos cards (só no filtro do dia para decidir quais máquinas exibir).

---

## Task 3: Bloco D — Remover botão interativo Sem Papelão de todos os lugares exceto modal Ações OFMAQ
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2 (ou Task 1, paralelo teórico permitido — mas 1 commit por bloco; sequencial para manter bumps)
- **Description**:
  - Listar todos os lugares: (1) Dashboard `#dash-tabela-ofs` data-dash-acao="sempapel", (2) kanban zero `#ofmaq-action-sem-papel-zero`, (3) tabela OFMAQ `.patch-ofmaq-sem-papel-btn` em linhas, (4) cards OFMAQ `.patch-ofmaq-sem-papel-btn`, (5) handlers globais querySelectorAll `.patch-ofmaq-sem-papel-btn`
  - Remover/desativar cada um (não injetar, ou remover atributo data-action/classe, bloquear clique com event.stopImmediatePropagation em delegação)
  - MANTER: badge/coluna SOMENTE LEITURA "Sem Papelão" em listagens (data-sem-papel atributo, estilos CSS, mas SEM botão/ação)
  - MANTER: modal Ações OFMAQ `data-ofmaq-final-action="sem-papel"` (botão interno do modal OK)
- **Acceptance Criteria Addressed**: [AC-D1](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/.trae/specs/2026-10-05-ofmaq-100pct/spec.md#ac-d1-bot%C3%A3o-interativo-sem-papel%C3%A3o-s%C3%B3-existe-no-modal-de-a%C3%A7%C3%B5es-do-ofmaq)
- **Test Requirements**:
  - `rule` TR-D1.1: Evaluate counts por tela: Dashboard (querySelectorAll `.patch-ofmaq-sem-papel-btn, [data-dash-acao="sempapel"]` → length 0); KanbanPCP `#ofmaq-action-sem-papel-zero` → null; Tabela linhas → 0; Cards → 0; evidence: objeto counts {dash,kanban,tablinhas,cards,modalAcoes}
  - `rule` TR-D1.2: Modal Ações OFMAQ ainda tem 1 botão; clique faz PATCH `/api/ofs/:id` → sem_papel=true/false → GET confirma; evidence: GET antes/depois + pop-up apareceu
  - `rule` TR-D1.3: Badge "Sem Papelão" (data-sem-papel="1") continua sendo exibido como marcação visual em listagens (cor amarela); evidence: innerHTML de badge em 1 linha OF marcada
- **Notes**: Antes de tocar, guardar snapshot completo das linhas com localizações (arquivo+linha) para Relatório Final.

---

## Task 4: Bloco E — Histórico Passagens + Botão "Histórico de hoje" com impressão
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3 (sequencial p/ bump versão)
- **Description**:
  - Garantir que POST /api/ofs/:id/passou-maquina atualize BOTH: tabela física passagens_maquina + coluna JSONB ofs.passagens_maquina (debug server.js L10828-L11090 se necessário)
  - Histórico de Passagens padrão já lê ofs.passagens_maquina; validar que "Passou pela máquina X" aparece na linha
  - NOVO: Injetar botão "Histórico de hoje" no cabeçalho OFMAQ (ao lado de "Gerar Relatório" / "Agrupar Setup")
  - Clique abre modal: agrupado por máquina, colunas OF / Cliente / Máquina / Horário, total por máquina
  - Botão "Imprimir/PDF" usa `rrOpenPrint` (mesmo padrão de Relatórios / Comissões); fallback window.print se rrOpenPrint indisponível
  - Fonte dados: fazer fetch de /api/ofs com passagens_maquina do dia OU (melhor) criar endpoint de leitura leve `/api/relatorios/passagens-hoje` que consulta a tabela física passagens_maquina WHERE data_passagem = hoje (fuso America/Sao_Paulo). **Se for criar endpoint novo, confirmar antes com user no spec (aprovado aqui, desde que NÃO use migration — só SELECT)**
- **Acceptance Criteria Addressed**: [AC-E1](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/.trae/specs/2026-10-05-ofmaq-100pct/spec.md#ac-e1-hist%C3%B3rico-de-hoje-mostra-passagens-do-dia-agrupado-por-m%C3%A1quina-imprim%C3%ADvel) e [AC-E2](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/.trae/specs/2026-10-05-ofmaq-100pct/spec.md#ac-e2-passou-pela-m%C3%A1quina-aparece-no-hist%C3%B3rico-de-passagens-existente)
- **Test Requirements**:
  - `rule` TR-E1.1: POST passou-maquina ×2 (2 OFs em 2 máquinas) → 200 + GET `/api/ofs/:id` retorna passou_maquina=true e passagens_maquina[] com 1 entrada cada; evidence: corpo GET ×2
  - `rule` TR-E1.2: Abrir "Histórico de hoje" → modal tem 2 linhas, 2 grupos máquina com contagem correta; evidence: evaluate linhasModal.length + grupos.length
  - `rule` TR-E1.3: Botão Imprimir chama `rrOpenPrint` (mock/verificar que foi chamado com dados e não lança erro); evidence: evaluate log de chamada
  - `rule` TR-E1.4: Desfazer ou marcar estado final das 2 OFs de teste
- **Notes**: Usar fuso America/Sao_Paulo para data de hoje (não UTC). Ao final do bloco, reportar estado final das OFs de teste.

---

## Task 5: Bloco C — 9 Botões modal Ações gravam + pop-up central (PARTE 1: 8 botões SEM coluna "Salvar dados do papel texto")
- **Status**: `blocked`
- **Priority**: high
- **Depends On**: Task 4 concluído E resposta do usuário sobre OQ-C5 (coluna nova texto)
- **Blocked By**: OQ-C5 ("Salvar dados do papel": hoje só há papel_comprado (BOOL) e previsao_entrega_papel (DATE) — sem coluna texto livre. Bloco C só fecha 100% após ALTER TABLE aprovado/executado)
- **Unblock Condition**: Usuário confirma (a) coluna nova criada OU (b) não quer texto livre e usar só boolean+date.
- **Description**:
  - Os 8 botões (exceto "Salvar dados do papel texto"): Passou pela máquina · Marcar/remover Urgente · Sem Papelão · Mover máquina · Alterar data · Mover máquina+data · Subir · Descer
  - Para cada um: ligar/garantir PATCH OF / POST passou-maquina correto, pop-up central showOfmaqCenterConfirm com mensagem, erro → pop-up erro
  - Garantir sincronia urgente+urg+prioridade_ordem; mover grava maq+maquina_agendada; subir/descer persiste ordem_maquina no banco (não só DOM)
  - "Salvar dados do papel": se coluna criada, adicionar textarea no modal e gravar; se não, gravar só papel_comprado + previsao_entrega_papel (input date + checkbox)
- **Acceptance Criteria Addressed**: [AC-C1](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/.trae/specs/2026-10-05-ofmaq-100pct/spec.md#ac-c1-todos-os-9-bot%C3%B5es-do-modal-gravam-persistem-e-mostram-pop-up)
- **Test Requirements**:
  - `rule` TR-C1.1: Tabela 9 botões × {HTTP=200, GetValorBanco=esperado, F5persiste=true, PopUpApareceu=true}; evidence: tabela preenchida
  - `rule` TR-C1.2: Subir 2 vezes e Descer 1 → GET ordem_maquina confirma sequência esperada; F5 → ordem inalterada (polling NÃO desfez); evidence: GET ×3
  - `rule` TR-C1.3: Urgente → GET urgente=true, urg=true, prioridade_ordem=1; remover urgência → 3 campos voltam (false,false,999); evidence: GET antes/depois

---

## Task 6: Relatório Final (após todos blocos A-E concluídos)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 1, 2, 3, 4, 5 (todos completed)
- **Description**:
  - SHA de cada commit (5 commits A/B/D/E/C + bumps)
  - Tabela de provas por bloco (por TR)
  - Lista dos lugares de onde o botão Sem Papelão foi removido (arquivo + linha + tela)
  - `git diff --stat` acumulado desde commit inicial do trabalho, provando que não foram alteradas áreas: Modal Conclusão, Compra Papelão, Orçamentos, Comissões, Relatórios (Freq/Perdas/Projeção)
- **Acceptance Criteria Addressed**: Entrega Final do spec
- **Test Requirements**:
  - `rule` TR-F1: `git diff <sha-antigo> HEAD --name-only` não contém arquivos/paths fora de: server.js, sw.js, index.html, patch.js seção OFMAQ
