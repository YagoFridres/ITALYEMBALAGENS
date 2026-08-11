# Debug Session: prod-runtime-regression
- **Status**: [OPEN]
- **Issue**: O commit `cf217a1` introduziu uma regressão de runtime em produção. Após a publicação, recursos novos não aparecem e áreas já estáveis antes do commit, como Histórico de Passagens de julho/2026, também deixam de funcionar, sinalizando interrupção na execução de `patch.js`.
- **Debug Server**: pending
- **Log File**: .dbg/trae-debug-log-prod-runtime-regression.ndjson

## Reproduction Steps
1. Abrir `https://adm.italyembalagens.com.br/`.
2. Confirmar o runtime publicado via headers/versionamento.
3. Abrir o Console do navegador.
4. Identificar o primeiro erro de execução carregado pela página.
5. Verificar se o erro ocorre cedo o suficiente para interromper os blocos seguintes de `patch.js`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | O bloco final `patchFinalRoundAug20260804` chama um helper inexistente em tempo de execução e aborta o restante do arquivo. | High | Low | Pending |
| B | A produção ainda estava servindo um bundle/cache misturado, causando incompatibilidade entre `index.html`, `patch.js` e `sw.js`. | Medium | Low | Pending |
| C | O commit `cf217a1` sobrescreveu algum renderer global ativo com referência circular ou função inválida, quebrando módulos posteriores. | High | Medium | Pending |
| D | O erro real acontece antes do bloco final, em outro trecho do `patch.js`, e o commit apenas passou a expor essa falha por ordem de execução/cache. | Medium | Medium | Pending |
| E | Se o primeiro erro não for simples de isolar, o caminho mais seguro é reverter `cf217a1` para restaurar `7211acf` e retomar em commits menores. | Medium | Low | Pending |

## Log Evidence
- `https://adm.italyembalagens.com.br/` respondeu com `x-index-patch-version=20260804200000` e `x-index-sw-version=20260804200000`, descartando a hipótese de deploy antigo/cache ainda no runtime anterior.
- A carga headless pública sem sessão autenticada não exibiu erro JS logo na home; o console mostrou apenas mensagens informativas de bootstrap.
- A tentativa de reproduzir com perfil local autenticado do Chrome não ficou disponível de forma confiável no shell atual, então não houve captura rápida do primeiro erro autenticado.
- O diff do commit `cf217a1` mostra que a regressão veio de um bloco grande novo em `patch.js` (+1184 linhas), sem um ponto trivial de falha isolado rapidamente.

## Verification Conclusion
- Hipótese B: **REJECTED**. A produção já está servindo a versão nova `20260804200000`.
- Hipóteses A/C/D: **INCONCLUSIVE** neste ciclo rápido; não houve isolamento seguro do primeiro erro autenticado.
- Hipótese E: **SELECTED**. Pelo critério de restauração de estabilidade, o próximo passo é reverter `cf217a1` e voltar à base conhecida boa (`7211acf`), reaplicando depois em blocos menores e validados.
