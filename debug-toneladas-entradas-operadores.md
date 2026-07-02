[OPEN] Debug session: toneladas-entradas-operadores

## Escopo
- Diagnosticar e corrigir o loop de erro 500 em `/api/analises/toneladas-vendidas`.
- Confirmar e corrigir a regressao visual do modal "Dar Entrada" e dos botoes da pagina Entradas.
- Confirmar se a ausencia de operadores em Caixas Perdidas e dado legado ou persistencia ainda incorreta.

## Restricoes
- Diagnosticar primeiro.
- Nao alterar regra de negocio antes de obter evidencia.
- Editar funcionalmente apenas `patch.js` e `server.js`.
- NUNCA editar `index.html`.

## Hipoteses falsificaveis
1. O endpoint `/api/analises/toneladas-vendidas` ja estava fragil e passou a entrar em 500 por dados nulos/incompativeis em colunas usadas no agregado.
2. O loop de 500 vem do front chamando a rota repetidamente sem trava de erro, nao da entrega canonica de `patch.js`.
3. A regressao visual de Entradas aconteceu porque o `patch.js` atual nao contem ou nao religa mais o enhancer dos botoes/modais especificos dessa pagina.
4. O codigo de estilo de Entradas existe, mas algum wrapper/observer posterior deixou de chamar esse enhancer apos rerenders.
5. "Sem dados" em operadores de Caixas Perdidas pode ser historico anterior ao commit `d4d6876`; se aparecer em registros novos, ainda ha falha no payload ou na gravacao backend.
