# Debug Session: historico-modals-regressions
- **Status**: [OPEN]
- **Issue**: Julho/2026 no Histórico de Passagens continua exibindo apenas 7 linhas antigas mesmo após o commit `8b9a951`; além disso, os modais da Calculadora e da Compra de Papelão voltaram a quebrar visualmente, com campos espremidos, sobreposição e vazamento de conteúdo.
- **Debug Server**: pending
- **Log File**: .dbg/trae-debug-log-historico-modals-regressions.ndjson

## Reproduction Steps
1. Consultar `/api/passagens/historico?mes=7&ano=2026` em sessão autenticada e comparar com OFs por Máquina para o mesmo período.
2. Confirmar se o deploy em produção já incorporou o commit `8b9a951`.
3. Abrir a tela Histórico de Passagens e validar filtros, contagem e linhas retornadas em julho/2026.
4. Abrir o modal da Calculadora em sessão real e verificar sobreposição, tamanho dos campos e cortes de conteúdo.
5. Abrir o modal de Compra de Papelão e validar o layout dos vincos fixos/dinâmicos.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | O Railway ainda não propagou o backend novo e a produção segue servindo a lógica anterior de julho/2026 | High | Low | Pending |
| B | A reconciliação de `/api/passagens/historico` ainda preserva passagens órfãs ou associa números errados, mantendo só as 7 linhas antigas | High | Medium | Pending |
| C | Histórico e OFs por Máquina não estão lendo exatamente a mesma fonte canônica para julho/2026 | High | Medium | Pending |
| D | O CSS da Calculadora está acoplado a estilos globais/compartilhados e por isso volta a regredir quando outros blocos mudam | High | Low | Pending |
| E | O layout de vincos em Compra de Papelão usa grid/flex insuficiente para campos fixos e dinâmicos, causando esmagamento recorrente | High | Low | Pending |

## Log Evidence
- Pending

## Verification Conclusion
- Pending
