[OPEN] Debug session: modals-passagens-scroll

# Debug Session: modals-passagens-scroll

## Escopo
- ReferenceError recorrente em helpers internos do `patch.js`
- Fluxos trocados entre criar/alterar chapa
- Cor de linha ausente
- Relatório mensal com valor zerado e nomes de máquina incorretos
- Scroll quebrado em Histórico de Passagens e Caixas Perdidas

## Hipóteses Iniciais
1. Helpers internos como `_abrirModalPadrao` e `_fecharModalPadrao` estão definidos em IIFEs isolados e são chamados por blocos posteriores fora do mesmo escopo.
2. Entrypoints de criar/editar chapa foram reconectados a funções erradas durante hotfixes anteriores, invertendo `create` e `edit`.
3. O relatório mensal continua zerado porque a resolução de OF e/ou máquina falha em runtime para passagens com `of_numero` sem `of_id` e para máquinas salvas como UUID/array cru.
4. O scroll não funciona porque o `overflow` foi aplicado no nó errado ou um ancestral com altura/overflow incompatível intercepta a rolagem.
5. Caixas Perdidas continua sem operador porque o payload real de conclusão de OF não está trazendo/propagando o operador esperado até a origem da tela.

## Plano de Depuração
1. Instrumentar pontos de definição e chamada dos helpers modais.
2. Instrumentar os entrypoints de criar/editar chapa e o modo final do modal.
3. Instrumentar enriquecimento/agregação de passagens para capturar OF, valor resolvido e máquina resolvida.
4. Instrumentar diagnóstico de DOM/scroll nas telas afetadas.
5. Rodar varredura estática de nomes órfãos antes do commit.

## Evidência
- Instrumentação adicionada em `patch.js` e `server.js` para modais, criar/editar chapa, scroll do histórico/caixas perdidas e agregação do relatório mensal.
- Verificação estática via `node server.js --check-patch-internals` encontrou 2 nomes órfãos em `patch.js`:
  - `_exportarComissoesExcel`
  - `_resolver`
- `node --check patch.js`: OK
- `node --check server.js`: OK
- Servidor de debug alternativo em Node iniciado localmente e `.dbg/modals-passagens-scroll.env` gerado.
- Ainda sem eventos de reprodução capturados nas telas afetadas; arquivo de log da sessão ainda vazio.

## Próximo Passo
1. Reproduzir as telas afetadas com a instrumentação ativa.
2. Ler os logs capturados e confirmar/rejeitar hipóteses.
3. Só então aplicar correções mínimas de lógica.
