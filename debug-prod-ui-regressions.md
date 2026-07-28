# Debug Session: prod-ui-regressions
- **Status**: [OPEN]
- **Issue**: Regressions de producao em Orçamentos, modais centrais, Calculadora, OFs por Maquina, Facas, Comissoes, metricas mensais, Simulador de Desperdicio, Hub e Historico de Passagens.
- **Debug Server**: Pending startup
- **Log File**: .dbg/trae-debug-log-prod-ui-regressions.ndjson

## Reproduction Steps
1. Acessar `https://adm.italyembalagens.com.br/` com sessao autenticada.
2. Reproduzir a tela de Orçamentos verificando listagem/cards com dados existentes.
3. Abrir os modais de Compra de Papelao e Orçamentos/Calculadora e validar centralizacao + scroll interno.
4. Recalcular a Calculadora de Compensacao com B, C e BC marcados.
5. Executar acoes em OFs por Maquina e validar persistencia + popup.
6. Tentar criar uma nova Faca.
7. Consultar Comissoes, Historico de Passagens e Simulador de Desperdicio com dados reais.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | A listagem de Orçamentos esta descartando registros por filtro/campos de empresa incompatíveis no payload atual. | High | Low | Pending |
| B | Um patch tardio ainda reaplica estilos/layout de modal que empurram overlay e shell para o canto. | High | Low | Pending |
| C | A Calculadora gera BC, mas um render secundario reconstrói a tabela sem a linha correspondente. | High | Low | Pending |
| D | Fluxos de OFs por Maquina e Facas ainda passam por wrappers antigos que nao persistem ou nao abrem corretamente. | High | Medium | Pending |
| E | Comissoes e metricas mensais ainda misturam fontes reprocessadas em vez do valor canonico e dos campos vindos da view. | High | Medium | Pending |

## Log Evidence
- Browser integrado carregou `https://adm.italyembalagens.com.br/` com `login-screen` visível, `CURRENT_USER` vazio e erros `token_missing` / `Sessão expirada` no console.
- Evidência de causa raiz para Orçamentos: o sync silencioso do frontend consulta `/orcamentos?empId=...`, enquanto a rota backend filtrava apenas `emp_id`; isso explica a tela zerada quando os registros válidos existem em aliases como `empresa_id` / `empresa`.
- Correção aplicada:
  - `server.js`: rota `/api/orcamentos` agora aceita `empId`, `empresa_id`, `empresaId` e `empresa`, filtrando também por `empresa_id`, `empresa` e `sigla`.
  - `patch.js`: wrapper em `window.api` remove filtro de empresa excessivamente restritivo especificamente para `GET /orcamentos`, evitando sobrescrever `ORCAMENTOS` com lista vazia durante o sync.

## Verification Conclusion
- Hipótese A: confirmada por inspeção do fluxo de sync + backend.
- Hipóteses B, C, D e E: alterações em código já estão presentes, mas seguem pendentes de validação em produção autenticada.
- Bloqueio atual: falta sessão autenticada no browser integrado para reproduzir e registrar evidências visuais.
