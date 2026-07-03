[OPEN] Debug session: modal-helper-checker

# Debug Session: modal-helper-checker

## Escopo
- Investigar por que o checker de funcoes orfas nao capturou `_abrirModalPadraoShared`
- Corrigir o erro atual no botao "Alterar Chapas"
- Auditar todas as variantes de helpers de modal padrao
- Consolidar um unico padrao canonico de modal
- Validar novamente o checker sobre o arquivo inteiro e atual no disco

## Hipoteses Iniciais
1. O checker atual coleta apenas um subconjunto de chamadas e definicoes, deixando passar variantes relevantes em cenarios reais.
2. O checker considera "definido em algum ponto do texto" como suficiente, mas nao detecta dependencias quebradas por ordem de execucao ou por variantes redundantes nao inicializadas.
3. Existem multiplas variantes de helper de modal no `patch.js` (`Shared`, `Real`, canonico) e nem todos os call sites foram migrados para o helper unico.
4. O caminho que abre o seletor de chapas ainda aponta para uma variante transitiva de modal que nao esta garantida no escopo global quando o clique ocorre.
5. Pode haver outros nomes chamaveis orfaos ou variantes inconsistentes escondidas no arquivo inteiro que ainda nao explodiram em runtime.

## Evidencias A Coletar
- Implementacao atual do checker em `server.js`
- Lista completa de variantes de modal padrao em `patch.js`
- Call sites de `_abrirModalPadraoShared` e `_fecharModalPadraoShared`
- Estado atual do worktree apos o push anterior
- Resultado do checker corrigido sobre o arquivo atual no disco
