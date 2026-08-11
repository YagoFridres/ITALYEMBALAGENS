# Debug Session: stock-jarvis-regressions
- **Status**: [OPEN]
- **Issue**: Regressao critica apos os commits de Sugestoes e Comissoes. Estoque de Chapas quebra ao abrir apos acao em sugestao de compra; Comissoes quebra ao abrir; Jarvis foi reportado como quebra geral da tela; Historico de Passagens apresenta filtros duplicados e possivel divergencia de fonte de dados.
- **Debug Server**: pending
- **Log File**: .dbg/trae-debug-log-stock-jarvis-regressions.ndjson

## Reproduction Steps
1. Abrir Compra de Papelao e acionar "OK, vou comprar" em uma sugestao.
2. Navegar para Estoque de Chapas e capturar erro de carregamento no console.
3. Abrir Comissoes e capturar erro de carregamento no console.
4. Abrir Jarvis em sessao real e capturar erro exato no console.
5. Abrir Historico de Passagens e verificar duplicacao de filtros e lista de maquinas.
6. Comparar julho/2026 entre Historico de Passagens e OFs por Maquina.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | `renderEstoqueWireframePage` referencia `sugestoesCompra` fora do escopo apos a mudanca de persistencia | High | Low | Pending |
| B | `_comAuditPickTotalVendido` foi definido em escopo diferente do consumidor ou nao foi carregado antes do uso | High | Low | Pending |
| C | O patch do Jarvis introduziu erro global ao reconfigurar overlay/helpers antes do estado DOM esperado | Medium | Medium | Pending |
| D | `_histEnsureUi()` esta injetando controles duplicados por falta de idempotencia real no shell/toolbar | High | Low | Pending |
| E | Historico consulta fonte diferente da usada por OFs por Maquina para passagens/conclusao, causando divergencia em julho/2026 | High | Medium | Pending |

## Log Evidence
- Pending

## Verification Conclusion
- Pending
