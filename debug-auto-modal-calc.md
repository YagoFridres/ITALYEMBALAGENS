# Debug Session: auto-modal-calc

Status: [RESOLVED]

## Sintoma
- O modal `Calculadora de Compensação — Fórmulas Garcia` abre sozinho sobre `OFs por Máquina`.
- O usuário pediu para verificar também modais de `Orçamentos` e `Compra de Papelão`.

## Hipóteses Iniciais
1. Um gatilho de boot/global está chamando a função de abertura do modal sem clique explícito do usuário.
2. A correção de full-screen deixou algum CSS/JS forçando `display`, `visibility` ou classe de aberto na inicialização.
3. Alguma rotina de navegação/renderização de `orcamentos` está sendo disparada indevidamente ao carregar outra tela.
4. Um listener genérico de teclado, polling ou restauro de estado está reabrindo o último modal conhecido.
5. Existe mais de um modal compartilhando overlay/container, e a lógica de fechamento/abertura de um deles está contaminando os demais.

## Evidência
- Reproduzido em produção sobre a tela `OFs por Máquina`, sem clique do usuário.
- O overlay `#modal-calc` estava visível já no attach inicial, com `lastIntent: null` na instrumentação temporária.
- O estado visual capturado mostrava:
  - classe `modal-overlay orc-calc-fs-ready`
  - estilo inline com `display: flex !important`
  - modal interno também em `display: flex`
- `modal-compra`, `ccp-modal-compra` e `modal-orc` não apareciam abertos espontaneamente no mesmo attach inicial.

## Causa Raiz Confirmada
1. A correção anterior de full-screen da calculadora extrapolou layout e passou a forçar visibilidade do overlay.
2. Os dois pontos que mantinham o modal visualmente aberto eram:
   - CSS injetado com `#modal-calc ... display:flex!important`
   - JS em `applyCalcFullscreenNow()` com `overlay.style.setProperty('display', 'flex', 'important')`
3. Como o ciclo nativo usa `abrir('modal-calc')` / `fechar('modal-calc')`, esse `display:flex` forçado burlava o estado normal do modal.

## Correção Aplicada
- Removido `display:flex!important` do bloco final de fullscreen de `#modal-calc`.
- Removido `overlay.style.setProperty('display', 'flex', 'important')` de `applyCalcFullscreenNow()`.
- Removida a instrumentação temporária de debug do `patch.js` após validação.

## Validação
- Sintaxe validada com `node --check patch.js`.
- Em produção, com correção equivalente injetada no DOM da sessão de teste:
  1. A calculadora deixou de aparecer sobre `OFs por Máquina`.
  2. Navegação feita sem clicar em botões de Calculadora/Compra/Orçamento:
     - `OFs por Máquina`
     - `Hub`
     - `PCP`
     - retorno para `Máquinas`
  3. Em todas as checagens de estado:
     - `modal-calc = false`
     - `modal-compra = false`
     - `ccpx-compra-fullscreen = false`
     - `ccp-modal-compra = false`
     - `modal-orc = false`

## Próximos Passos
1. Ler as instruções complementares do skill.
2. Localizar pontos de abertura/visibilidade dos modais.
3. Instrumentar apenas logs de diagnóstico.
4. Reproduzir e confirmar a hipótese vencedora.
