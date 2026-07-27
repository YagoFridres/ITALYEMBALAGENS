# Debug Session: auto-modal-calc

Status: [OPEN]

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
- Pendente

## Próximos Passos
1. Ler as instruções complementares do skill.
2. Localizar pontos de abertura/visibilidade dos modais.
3. Instrumentar apenas logs de diagnóstico.
4. Reproduzir e confirmar a hipótese vencedora.
