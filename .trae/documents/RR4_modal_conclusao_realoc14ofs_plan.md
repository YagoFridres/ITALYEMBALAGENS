# RR4 — Correção Bug Modal Conclusão + Realocação 14 OFs para Setembro/2026 Implementation Plan

## Repository Research (RCs confirmados)

### Parte A — 3 Causas-Raiz diagnosticadas (100% confirmadas por leitura de código)

**RC #A-1 DUPLA (Data): Hierarquia oficial data_conclusao primeiro + back sobrescreve + front não envia = nunca atualiza mês.**
- Regra canônica de relatório: `_vendasOficialDateObj(of)` (server.js L2752-L2763) = `data_conclusao ?? data_faturamento ?? dia ?? created_at` — **data_conclusao sempre vence**.
- **Front bug (patch.js payload L55582-L55635):** Ao montar o body do POST `/concluir`, o modal **SÓ ENVIA `data_faturamento`** e **NÃO ENVIA `data_conclusao` nem `dia`**.
- **Back bug (server.js POST /concluir L11612):** `updateData.data_conclusao = nowIso` — **hardcoded para a hora atual do servidor**, IGNORA completamente `body.data_conclusao` mesmo que o front enviasse.
- **Resultado prático:** Usuário altera "Data de Faturamento" para 01/09 no modal. Salva. `data_faturamento` fica 01/09 (L11681-L11683 ok), mas `data_conclusao` = hoje (01/10). Relatório pega data_conclusao primeiro e OF conta em OUTUBRO de qualquer forma.

**RC #A-2 TRIPLO (Empresa Oestepack truncada 35→36 chars):** Patch.js hardcodeou o UUID da Oestepack ERRADO em **3 locais separados** (faltou o `a` final). Valor esperado Fact5 = `a6e5f5d8-4743-4ebe-885e-c2f0f741a667a` (36 chars). Valor bugado = `a6e5f5d8-4743-4ebe-885e-c2f0f741a667` (35 chars).
  - Local bug 1: `<option value="...a667">Oestepack</option>` HTML do select [patch.js L54755]
  - Local bug 2: `EMPRESA_SIGLA_UUID.E3` (pré-seleção ao abrir o modal) [patch.js L54882]
  - Local bug 3: `EMP_MAP_LOCAL[uuid]` (fallback de nome quando option não tem texto) [patch.js L55559]
- **Resultado prático:** Quando o usuário seleciona "Oestepack" no Modal de Conclusão, grava 35 chars truncados no `ofs.empresa_id` (OFs 3699/3700/3701/3702 afetadas). Esse valor NÃO dá match nos filtros `AND (UUID + sigla)` usados nos relatórios de empresa.

### Parte B — 14 OFs a ajustar (especificadas pelo usuário, pré-esclarecidas)
- **Data fixa em Setembro escolhida pelo usuário:** `30/09/2026` (último dia útil, unificada para todas as 10 OFs hoje em 01/10).
- **Empresa correta 4 OFs 3699/3700/3701/3702:** Oestepack (E3) com UUID completo 36 caracteres (confirmado: era a intenção original do usuário antes do truncamento).
- **Mapa individual das 14 OFs e ação:**
  1. 3348, 3349, 3350, 3351, 3523, 3632, 3791, 3792 (hoje = 01/10, empresa ok) → Ação: Reabrir + reconcluir com data_conclusao = data_faturamento = dia = 2026-09-30.
  2. 3699, 3701 (hoje = 01/10, empresa truncada 35 chars) → Ação: Reabrir + reconcluir com data 30/09/2026 + empresa_id = Oestepack 36 chars.
  3. 3700, 3702 (hoje = data_faturamento = 01/09 mas data_conclusao = 01/10, empresa truncada) → Ação: Reabrir + reconcluir com data_conclusao = data_faturamento = dia = 2026-09-01 + empresa_id E3 36 chars (mantém a data de faturamento que já estava correta).
  4. 3352 (já em setembro, já ok) → Ação: Apenas GET final de prova, nenhuma alteração.
  5. 3681 (já em setembro, quantidade e valor corrigidos na tarefa anterior, data_faturamento HOJE NULO) → Ação: PATCH rápido apenas para preencher `data_faturamento = 2026-09-25` (igual data_conclusao). **NÃO reabrir/reconcluir para não voltar quantidade/valor para valores antigos.**

---

## Files and Modules (escopo exato, 0 Frequência 0 Projeção)

| Arquivo | Alteração esperada | Linhas aproximadas |
|---|---|---|
| [patch.js](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js) | **3 hotfixes UUID E3 (truncado→completo) + 1 hotfix payload (adicionar data_conclusao + dia iguais à data_faturamento)** | L54755, L54882, L55559 (UUID); L55582-L55635 (payload datas) |
| [server.js](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js) | **1 hotfix data_conclusao no POST /concluir:** usar `body.data_conclusao || body.data_faturamento` antes de cair em nowIso (backward-compat com front antigo que manda só faturamento). **0 alterações em handlers de Frequência ou Projeção.** Bump versão em 5 pontos (2× server.js, 1× sw.js, 2× index.html) com timestamp do deploy. | L11612 + 5 bumps de versão |
| sw.js, index.html | Apenas bumps de versão em 3 pontos restantes, 0 código funcional | ~L3 sw.js, ~2 locais index.html head + rodapé |
| Nenhum outro arquivo | Projeção (`renderProjecaoVendas`), Frequência, dashboards, banco, migrations: 100% intactos | — |

---

## Implementation Steps (ordem de dependência estrita, STOP_ON_FAILURE a cada item)

### Bloco 1 — Código (Parte A, deploy no Railway)
1. **Hotfix UUID E3 3 locais (patch.js):** substituir `a6e5f5d8-4743-4ebe-885e-c2f0f741a667` (35) → `a6e5f5d8-4743-4ebe-885e-c2f0f741a667a` (36) em L54755, L54882, L55559.
2. **Hotfix payload modal (patch.js L55582):** adicionar 2 campos novos no body enviado ao POST /concluir:
   - `data_conclusao: dataFaturamento + 'T12:00:00.000Z'` (igual data faturamento que usuário escolheu, meio-dia UTC evita problema de fuso Brasil).
   - `dia: dataFaturamento` (YYYY-MM-DD puro, redundância segura).
3. **Hotfix server.js POST /concluir L11612:** mudar `data_conclusao: nowIso` para:
   ```js
   data_conclusao: sanitizeDate(body?.data_conclusao ?? body?.data_faturamento) ?? nowIso,
   ```
   (usa `sanitizeDate` oficial que já existe no CAMPOS_OFS_UPDATE L4263-4264).
4. **Syntax check:** `node --check server.js` (exit 0 obrigatório).
5. **5 bumps de versão simultâneos** com o mesmo timestamp (ex: `20261001100000`): server.js topo e rodapé handler `/api/version`; sw.js CACHE_NAME; index.html head `<meta>` query param sw + rodapé versão visível.
6. **git diff --stat** (esperado ~4 arquivos, ~20-40 linhas; proibido tocar em Projeção/Frequência). **Commit separado "fix(A): modal conclusao datas + uuid E3" + push origin/main.** Aguardar Railway deploy (~30s), validar `/api/version` retorna patch novo via MCP evaluate.

### Bloco 2 — Teste funcional Bugfix (antes de tocar as 14 OFs)
7. **Prova real do fix (MCP Browser aba produção):** Escolher uma OF de teste NÃO LISTADA nas 14 (ex: 3352 que já está em setembro, ou qualquer OF Em Produção disponível). Abrir Modal de Conclusão real do front, alterar:
   - Data de Faturamento = 2026-09-15 (mês passado, não interfere)
   - Empresa = Oestepack (E3)
   - Clicar em Confirmar Conclusão (ou simular via evaluate montando payload completo igual ao modal).
8. Validar via GET /api/ofs/:id dessa OF:
   - (a) `empresa_id === 'a6e5f5d8-4743-4ebe-885e-c2f0f741a667a'` 36 chars (não 35).
   - (b) `data_conclusao.slice(0,10) === '2026-09-15'` (igual faturamento, NÃO hoje/outubro).
   - (c) `dia === '2026-09-15'`.
9. **Prova de relatório:** chamar endpoint `_vendasOficialDateObj` via evaluate ou endpoint de setembro filtrando a OF, confirmar que cai em setembro. Reverter OF de teste de volta para estado anterior se necessário (proibido deixar OF de teste afetada).
10. **Apenas após aprovação da prova do Bloco 2:** avançar para o Bloco 3. Se falhar: corrigir regressão e revalidar.

### Bloco 3 — Realocação 14 OFs (Parte B, dados via HTTP endpoints oficiais, 0 SQL)
Para **cada uma das 14 OFs**, aplicar fluxo atômico individual com GET de prova antes e depois:

11. **Para 3681 (caso especial, NÃO reabrir!):** somente PATCH direto `{ data_faturamento: '2026-09-25', dia: '2026-09-25' }` (esses dois campos SÃO permitidos na whitelist CAMPOS_OFS_UPDATE L4406/L4264). Confirmar valor_total=192.5 e quantidade=11 intactos no GET final.
12. **Para 3352:** só GET inicial + final, nenhuma alteração (confirmação de baseline setembro).
13. **Para as 12 OFs restantes (3348, 3349, 3350, 3351, 3523, 3632, 3699, 3700, 3701, 3702, 3791, 3792):**
    1. **GET inicial** — salvar resumo (quantidade, qtd, valor_unitario, preco, valor_total, caixas_boas, dimensões comp/larg, gramatura, status, data, empresa_id ATUAL). **NÃO MUDAR esses campos, mantém 100% valor atual.**
    2. **PATCH reabrir:** `{ status: 'Em Produção', _force_status: '1' }`. Validar 200.
    3. **POST /api/ofs/:id/concluir:** body montado com:
       - Quantidade / valor / gramatura / dimensões / caixas — **EXATAMENTE os valores do GET inicial (não mexer)**
       - data_conclusao = data_faturamento = dia = alvo (2026-09-01 para 3700/3702; 2026-09-30 para as demais 10)
       - empresa_id = correto (3699/3700/3701/3702 → E3 36 chars novo UUID; demais → manter UUID empresa que já estava correto no GET inicial)
       - gramatura obrig 358 fallback + empresa_id obrig + dimensões comp/larg >0 obrig (os 3 fields validados 400 no endpoint)
    4. **PATCH corretivo de garantia (OPCIONAL, só se POST /concluir ainda não salvou datas certas por qualquer motivo):** `{ data_conclusao: alvo, data_faturamento: alvo, dia: alvo.slice(0,10) }` via whitelist normal.
    5. **GET final** — registrar todos os campos para a tabela ANTES/DEPOIS.
14. **Stop-on-failure:** Qualquer OF retornar não-200 em qualquer etapa → parar imediatamente, reportar, não tocar OFs seguintes até resolver.

### Bloco 4 — Relatório Final
15. Montar tabela ANTES × DEPOIS para TODAS as 14 OFs com colunas: OF, Data Conc ANTES, Data Conc DEPOIS, Data Fat ANTES, Data Fat DEPOIS, Empresa ANTES, Empresa DEPOIS, QT ANTES (intacto?), QT DEPOIS, VT ANTES (intacto?), VT DEPOIS, Status ANTES, Status DEPOIS.
16. Prova extra: `GET /api/ofs/...` lista os 14 IDs em um array com `ids=` ou loop individual, confirmar todos os 14 têm `data_conclusao.slice(0,7) === '2026-09'`.
17. Resumo de protocolo: 0 toque em Frequência/Projeção, 0 migrations, 0 Supabase MCP, commits separados.

---

## Dependencies and Considerations
- **UUID Fact5 imutável:** E1=Italy, E2=Cartoeste, E3=Oestepack `a6e5f5d8-4743-4ebe-885e-c2f0f741a667a` 36 chars. Todos os filtros de empresa nos relatórios usam AND (UUID + sigla), portanto o truncamento de 1 char é suficiente para "perder" a OF em filtros de E3.
- **Backward compat server L11612:** A ordem de precedência `body.data_conclusao > body.data_faturamento > nowIso` garante que navegadores antigos com patch.js cacheado (ainda mandando só data_faturamento sem data_conclusao) continuem funcionando corretamente, pois cai no body.data_faturamento e não no nowIso. Sem breaking change.
- **3681 é caso especial por RISCO:** Reabrir/reconcluir a 3681 pode resetar a quantidade 11 → 10 e valor 192.5 → 175 se payload POST /concluir não carregar exatamente os valores corretos. Usar o PATCH direto (data_faturamento e dia são whitelist permitidos) elimina esse risco.
- **Railway deploy:** Automático a cada push origin/main, ~30s. Health check: GET /api/version retorna patch e commit SHA.
- **Filtro de relatório OFS_TABLE_COLS / _listarOfsVendasOficiais:** NÃO alterados. Continuam a usar a mesma hierarquia data_conclusao primeiro — agora, com data_conclusao e data_faturamento iguais, não há mais discrepância.

---

## Validation (obrigatória antes de marcar como complete)
1. ✅ `node --check server.js` → exit 0.
2. ✅ `git diff --stat` → só patch.js, server.js, sw.js, index.html. Nenhum diff em Projeção/Frequência.
3. ✅ Prova Bloco 2: OF teste E3 36 chars + data_conclusao = data_faturamento = mês escolhido.
4. ✅ Para cada 14 OFs: (a) GET inicial 200; (b) PATCH reabrir 200 se aplicável; (c) POST concluir 200 se aplicável; (d) GET final 200 com data_conclusao = setembro (yyyy-mm = 2026-09).
5. ✅ Checklist 14/14 OFs: verificar cada linha da tabela ANTES/DEPOIS.
6. ✅ Bump versão 5 pontos sincronizado (GET /api/version retorna patch = sw_cache = index query param).

---

## Risks
| Risco | Impacto | Mitigação |
|---|---|---|
| R1: POST /concluir hotfix L11612 tem algum side effect em outros campos | Médio | Bloco 2 faz prova isolada com OF de teste ANTES de tocar 14 OFs. Reverte se detectado. |
| R2: 3681 resetar qtd/valor se reabrir por engano | Alto | Fluxo 11 define explicitamente: 3681 SOMENTE PATCH direto data_faturamento/dia (whitelist CAMPOS_OFS_UPDATE tem esses campos). Proibido POST /concluir nessa OF. |
| R3: Railway demora >60s ou cache SW antigo | Médio | Validar /api/version patch SHA === commit SHA antes de iniciar Bloco 2/3. Hard refresh no browser. |
| R4: UUID E3 35 chars gravado impede a reabertura PATCH | Baixo | UUID não é chave primária, apenas FK não vinculante. PATCH reabrir e POST /concluir usam id OF (pk), não empresa_id. Sem bloqueio. |
| R5: Frequência / Projeção quebrar por tocar server.js | Baixo | grep no diff antes de commit: proibido ocorrência de "frequencia", "projecao", "renderProj" nos arquivos alterados. |
