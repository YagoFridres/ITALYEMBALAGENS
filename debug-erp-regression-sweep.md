[OPEN] Debug session: erp-regression-sweep

# Debug Session: erp-regression-sweep

## Escopo
- ReferenceError em helpers compartilhados de modal no `patch.js`
- Fluxos trocados entre criar/alterar chapa
- Cor de linha ausente na tabela principal
- Relatório mensal por máquina com UUID cru e valor zerado
- Scroll quebrado em Histórico de Passagens e Caixas Perdidas
- Caixas Perdidas sem período mensal, sem impressão e com operadores vazios

## Hipóteses Iniciais
1. `_abrirModalPadrao` e `_fecharModalPadrao` existem, mas ficaram presos em escopo isolado e alguns pontos do arquivo chamam nomes não visíveis naquele trecho.
2. O fluxo de criar/editar chapa não está invertido no binding primário, e sim contaminado por estado residual (`chapa-edit-id`, `CHAPA_ATUAL_ID` ou flags globais), fazendo o modal de criação abrir em modo edição.
3. A cor de linha não aparece por uma quebra em uma das pontas do fluxo: campo do modal, payload salvo, retorno da API ou aplicação do estilo na renderização da tabela.
4. O relatório mensal continua zerado porque a agregação ainda falha ao resolver OFs e/ou campos de valor, enquanto UUIDs de máquina entram como texto cru sem resolução pela tabela de máquinas.
5. O scroll das listas está aplicado no nó errado ou interceptado por um ancestral com `overflow` restritivo, impedindo que o container alvo assuma a rolagem.

## Evidência Já Obtida
- `node --check patch.js` sem erro na rodada anterior
- `node --check server.js` sem erro na rodada anterior
- `node server.js --check-patch-internals` retornando `missing_count: 0` após ajuste do verificador
- Instrumentação parcial já adicionada em pontos de modais, scroll e relatório mensal

## Próximos Passos
1. Confirmar o estado atual das mudanças locais em `patch.js` e `server.js`
2. Revisar a instrumentação existente e completar apenas o que ainda faltar
3. Executar verificações e reprodução assistida
4. Aplicar correções mínimas baseadas em evidência
5. Validar, commitar e publicar
