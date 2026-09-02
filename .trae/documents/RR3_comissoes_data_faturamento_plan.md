# RR3 — Correção de Critério de Data em Comissão (Respeita data_faturamento)

## Repository Research (Conclusões)

### Bug Literal Confirmado (Causa Raiz ÚNICA no `server.js` rota `/api/comissoes/relatorio` L2820–L2825)

A tela de Comissão tem 2 pipelines de dados separados na **mesma rota**, usando critérios de data DIFERENTES:

| Pipeline | Código | Critério de data | Status (correto/errado) |
|---|---|---|---|
| **A — Cards Topo (Total Vendido / OFs Concluídas)** | `server.js` L2848 `_listarOfsVendasOficiais()` → L2688–L2714 → L2676 `_vendasOficialDentroDoPeriodo()` → L2653 `_vendasOficialDateObj()` | ✅ **COALESCE padrão do sistema**: `data_faturamento > data_conclusao > dia > created_at` | **CORRETO** (exclui OF #2683 em setembro pois fat=2026-08-31) |
| **B — Comissão por Vendedor / Detalhamento (onde cai o RONI R$200,16)** | `server.js` L2820 `supabase.from('vw_comissoes').gte('data_conclusao', range.inicio).lt('data_conclusao', range.fim_exclusivo)` | ❌ **APENAS `data_conclusao`** (sem data_faturamento, sem fallback) | **ERRADO** (conta OF #2683 em setembro pois conclusao=2026-09-xx enquanto fat=agosto) |

**Discrepância exata do usuário**: Cards (A) excluem OF #2683 em setembro (correto, total vendido 0), mas Tabela Comissão Vendedor (B) inclui ela (errado, RONI R$200,16).

### vw_comissoes Limitação (Fact 1 Project Memory)
View `vw_comissoes` no Supabase **tem apenas `empresa_id`** (UUID). Não sabemos se tem `data_faturamento`/`data_conclusao`/`dia`/`created_at` individuais — não podemos confiar em colunas da view para aplicar COALESCE corretamente sem risco de PGRST204 (coluna inexistente).

### Abordagem Escolhida (Mais Segura, Menos Risco, Usa Código Já Existente)
**Não confiar no filtro `.gte('data_conclusao')` da `vw_comissoes`** (falta `data_faturamento`). Em vez disso:
1. **Buscar todas OFs concluídas (sem filtro de data prévio) na `vw_comissoes` com select mínimo + enriquecer com `ofs` via `_comissoesEnriquecerLista`** (função já busca dados adicionais na tabela `ofs` incluindo `data_faturamento, data_conclusao, dia, created_at`).
2. **Aplicar filtro de período APÓS o enriquecimento**, usando o **mesmo helper reutilizado do pipeline A**: `_vendasOficialDentroDoPeriodo(of, range)` que usa COALESCE(`data_faturamento > data_conclusao > dia > created_at`) 100% idêntico.
3. Resultado: Pipeline A e B usam **exatamente a mesma função de data** → zero inconsistência.

### Frontend `patch.js` (L35897–L35972, L837)
- Frontend só monta parâmetros `mes/ano/data_inicio/data_fim` e renderiza resposta JSON. **Não tem lógica própria de filtro de data** (tudo vem do backend). **Nenhuma alteração necessária no patch.js** (exceto bump versão).

## Files and Modules (Arquivos Que Serão Alterados)

- **`[server.js](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L2805-L2865)` (rota `/api/comissoes/relatorio`)**: Remover `.gte/lt data_conclusao` do query da `vw_comissoes`; adicionar `filter` pós-enriquecimento com `_vendasOficialDentroDoPeriodo()`. Ajustar `payload.criterio_total_vendido` para ambos.
- **Bumps de versão obrigatórios**: `server.js` L1249/1250, `sw.js` L4, `index.html` L33666 (swVersion), `index.html` L60641 (patch.js?v=). Timestamp = **20260901403001**.

## Implementation Steps (Passos de Implementação em Ordem)

### Step 1 — Corrigir Rota `/api/comissoes/relatorio` (server.js L2820–L2842)
1. Modificar bloco `let query = supabase.from('vw_comissoes')`:
   - **Remover** `.gte('data_conclusao', range.inicio)` e `.lt('data_conclusao', range.fim_exclusivo)` (esses filtros prévios causam o bug por ignorar `data_faturamento`).
   - Manter `.select('*')`, `.ilike('status', '%conclu%')`, filtro empresa via `.or()` se `todasEmpCom`.
2. **Adicionar novo bloco APÓS `todasOFs = _jj3FiltrarListaPorEmpresa(...)` (L2842)** — aplicar filtro de período canônico USANDO MESMO HELPER do Pipeline A (garante 100% idêntico):
   ```js
   todasOFs = todasOFs.filter(function (of) {
     return _vendasOficialDentroDoPeriodo(of, range);
   });
   ```
3. (Opcional defensivo) Incluir também no debug log L2818 `console.log('[COM] buscando ... criterio_data: COALESCE(fat>con>dia>cr)');`

### Step 2 — Aplicar Mesmo Critério de Data na Rota Secundária `/api/comissoes/busca-of` (Opcional Defensivo)
- **Apenas** se a rota `/api/comissoes/busca-of` (L2905) também calcula comissão/valores para um período filtrado — investigar se tem filtro de data. Se não tiver filtro de período na busca (busca por nº OF, é busca global), **NÃO ALTERAR** (menos diff, menos risco). Plano default: **Não alterar busca-of** (ela é busca por texto, sem filtro mês).

### Step 3 — Bump Versão 403001 nos 4 Pontos Obrigatórios
- `server.js` L1249/1250 → `PATCH_RUNTIME_VERSION` e `SW_RUNTIME_VERSION` = `20260901403001`
- `sw.js` L4 → `CACHE_NAME = 'italy-erp-v20260901403001'`
- `index.html` L33666 → `swVersion = '20260901403001'`
- `index.html` L60641 → `<script src="/patch.js?v=20260901403001"></script>`

## Dependencies and Considerations (Dependências & Riscos)

### Helper Reutilização Chave (✅ Garante Consistência)
Usaremos **exatamente a mesma função** `_vendasOficialDentroDoPeriodo()` (L2676–L2686) do Pipeline A (Total Vendido correto). Essa função chama `_vendasOficialDataRef()` → `_vendasOficialDateObj()` que faz `COALESCE(data_faturamento > data_conclusao > dia > created_at)`. Zero chance de divergir novamente.

### Colunas da View vw_comissoes (Risco Mitigado)
Fato desconhecido: se `vw_comissoes` exporta `data_faturamento` individual. Como `_comissoesEnriquecerLista` (L2307) **sempre consulta tabela `ofs`** para valores topo (`id,valor_total,valor_venda,preco,total` L2394) e depois chama `_enriquecerRespostaOFs(todasOFs)` (L2405 que puxa mais dados), **as colunas `data_faturamento/data_conclusao/dia/created_at` estarão presentes no objeto final** via fallback `ofs`. O filtro pós-enriquecimento SEMPRE vai funcionar, independente da view.

### Performance (Sem Impacto Material)
Atualmente a view `vw_comissoes` já retorna até 3023 linhas (mesmo volume do pipeline A). O filtro prévio data_conclusão reduzia para ~300 linhas por mês. Removê-lo faz o Supabase retornar ~3023 linhas concluídas toda vez, depois aplicamos filtro JS local. Comparado ao pipeline A (`_listarOfsVendasOficiais` que faz while-loop paginação chunk 1000 até 50k linhas e busca MESMA quantidade), a performance será **melhor ou igual** (view é uma query só, paginação não precisa).

### Whitelist Colunas (Sem Risco de PGRST)
Não adicionamos nenhum campo novo no `.select('*')` da view. Nenhuma query Supabase nova com coluna suspeita. PGRST204 impossível nesse commit.

## Validation (Validação Obrigatória Antes de Reportar Resolvido)

### A. Sintaxe + Diff Stat (Antes Commit)
1. `node --check server.js` → exit 0
2. `node --check patch.js` → exit 0 (apenas bump, não tem outra mudança)
3. `git diff --stat` → esperado **~15-25 linhas totais** (server ~10, bumps 4×1 linha). << 200 linhas, dentro do limite.

### B. Smoke Test Endpoint (Após Railway Deploy 403001)
Usar aba nova cold load `adm.italyembalagens.com.br`, navegar para tela 💵 Comissões, ou chamar direto via browser evaluate `fetch('/api/comissoes/relatorio?mes=9&ano=2026').then(r=>r.json())`. Verificar:

**TESTE 1 — Setembro (mes atual)**:
- `json.ofs` **NÃO PODE TER** OF `numero=2683` (ou `of=2683`).
- `json.vendedores.find(v => v.nome.indexOf('RONI') > -1)` → seu `total` e `comissao_rs` **devem ser MENORES** (excluiu R$200,16).
- `json.total_vendido === json.vendedores.reduce((s,v)=>s+v.total,0)` → MATCH (garante que não tem mais divergência).

**TESTE 2 — Agosto (mes passado, 08/2026)**:
- Buscar relatório `mes=8&ano=2026`.
- `json.ofs` **DEVE TER** OF #2683.
- Vendedor RONI no ranking **DEVE ter a diferença de +R$200,16 no total**.

### C. Comparação RONI R$200,16 (Caso de Teste Específico Usuário)
- **Antes patch (402001) setembro**: RONI tem R$200,16 da OF 2683 incluso.
- **Depois patch (403001) setembro**: RONI **não tem mais** esse valor.
- **Depois patch agosto**: RONI **tem** esse valor.

## Risks (Riscos e Seus Mitigadores)

| Risco | Impacto | Mitigação |
|---|---|---|
| `vw_comissoes` retorna 3023 linhas e enriquecimento demora | Baixo | Mesmo volume de dados que `_listarOfsVendasOficiais`, e view é 1 query só (paginação não precisa). |
| `vw_comissoes` não tem campo `status` (mas `.ilike(status conclu%)` usado) | Muito Baixo | View de comissão SEMPRE tem status (ela é base para cálculo). Se falhar, error handler já loga e retorna mensagem. |
| Colunas data não chegam no objeto após enriquecimento | Nulo | `_vendasOficialDataRef` já tem fallback robusto `??`; `_comissoesEnriquecerLista` consulta tabela `ofs` SEMPRE. |
| Filtro de empresa aplicado DUAS VEZES na ordem errada | Baixo | Ordem: (1) filtro Supabase vw_comissoes por empresa; (2) enriquecer; (3) `_filtrarOfsNaoTesteGlobal`; (4) `_jj3FiltrarListaPorEmpresa` de novo; (5) **NOVO `_vendasOficialDentroDoPeriodo`**. Ordem idêntica ao pipeline A, zero erro. |
