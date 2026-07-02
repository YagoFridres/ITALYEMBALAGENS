[OPEN] Debug session: erp-regression-round2

# Debug Session: erp-regression-round2

## Escopo
- Verificacao obrigatoria de nomes internos orfaos em `patch.js`
- ReferenceError em helpers compartilhados de modal
- Fluxos trocados entre criar e alterar chapa
- Cor de linha ausente na tabela principal
- Relatorio mensal por maquina com UUID cru e valor zerado
- Scroll quebrado em Historico de Passagens e Caixas Perdidas
- Caixas Perdidas sem periodo mensal, impressao e operadores consistentes

## Hipoteses Iniciais
1. `_abrirModalPadrao` e `_fecharModalPadrao` existem no arquivo, mas nao ficam disponiveis para todos os pontos de uso por ordem de execucao, escopo isolado ou sobrescrita posterior.
2. O fluxo de criar/editar chapa foi cruzado por binds duplicados, seletores trocados ou estado residual no modal (`CHAPA_ATUAL_ID`, hidden fields e cache local).
3. A cor de linha nao aparece por quebra em uma ou mais etapas: entrada no formulario, persistencia no backend, retorno da API e aplicacao do estilo na renderizacao da tabela.
4. O relatorio mensal continua incorreto porque a agregacao mistura IDs crus de maquina, nao resolve UUID -> nome em todos os casos e ainda escolhe o campo errado para valor de producao.
5. O scroll das listas falha porque o container alvo nao recebe altura efetiva ou porque algum ancestral com layout/overflow intercepta a area rolavel.

## Evidencias A Coletar
- Lista de definicoes e chamadas internas `_...` em `patch.js`
- Ordem/escopo das funcoes de modal e seus chamadores
- Bindings de abertura dos modais de criar/alterar chapa
- Payloads e respostas relacionados a `cor_linha`
- Dados agregados do relatorio mensal por maquina
- Metricas de layout/overflow nos containers de scroll
- Payload real e enriquecimento de operadores em Caixas Perdidas
