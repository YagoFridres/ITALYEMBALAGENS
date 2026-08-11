# Debug Session: historico-ofs-passagens
- **Status**: [OPEN]
- **Issue**: Histórico de Passagens (jul/2026) retorna apenas 7 linhas porque a API lê `passagens_maquina` (tabela) em vez de `ofs.passagens_maquina` (coluna JSON canônica).
- **Expected**: Julho/2026 deve retornar volume próximo do real (centenas), alinhado com o que as OFs carregam em `ofs.passagens_maquina`.
- **Log File**: `.dbg/trae-debug-log-historico-ofs-passagens.ndjson`

## Reproduction Steps
1. Em sessão autenticada, chamar `/api/passagens/historico?mes=7&ano=2026&limit=1000`.
2. Conferir `total` e uma amostra de OFs retornadas.
3. Comparar `total` antes e depois do ajuste de fonte (tabela `passagens_maquina` vs coluna `ofs.passagens_maquina`).

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Expected Signal |
|----|------------|------------|--------|-----------------|
| A | `/api/passagens/historico` lê `passagens_maquina` (tabela) e por isso o mês retorna ~7 linhas | High | Low | Log indicando `source=passagens_maquina_table` e `rawRows≈7` |
| B | `ofs.passagens_maquina` contém o histórico real, mas não está sendo usado pela API | High | Low | Log indicando `ofsWithPassagens` alto (centenas) quando consultado |
| C | Mesmo lendo `ofs.passagens_maquina`, o parsing não extrai `data_passagem` e o filtro de mês zera o resultado | Medium | Medium | Log com `passagensParsed>0` mas `passagensInRange=0` |
| D | O escopo de empresa (emp_id/empresa_id) está filtrando fora a massa de julho | Medium | Low | Log com `empresaResolved` e diferença grande com/sem filtro |

## Evidence
- Pre-fix (produção): `/api/passagens/historico?mes=7&ano=2026` retorna `total=7` (OFs 1242, 1243, 1492, 1498, 1497, 1500, 1499). Log: `.dbg/trae-debug-log-historico-ofs-passagens.ndjson` linha 1.

## Verification Conclusion
- Pending
