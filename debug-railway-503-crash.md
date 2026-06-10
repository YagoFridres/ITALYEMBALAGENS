# [OPEN] railway-503-crash

## Contexto
- Sintoma: servidor retorna 503 e o processo no Railway caiu.
- Objetivo: coletar evidência de runtime com `railway logs`, tentar `railway up` e validar sintaxe com `node --check server.js`.

## Hipóteses
1. `server.js` tem erro de sintaxe e o processo cai ao iniciar.
2. O boot falha por variável de ambiente ausente ou configuração inválida no Railway.
3. Há exceção em tempo de inicialização após carregar módulos/rotas.
4. O CLI `railway` não está disponível/autenticado neste ambiente local.
5. O deploy cai por limite de memória ou erro de build/start remoto.

## Evidências
- `railway logs` falhou com `CommandNotFoundException`: o CLI `railway` não está instalado/disponível neste ambiente.
- `railway up` falhou com `CommandNotFoundException`: o CLI `railway` não está instalado/disponível neste ambiente.
- `node --check server.js` retornou sucesso (`exit code 0`), sem erro de sintaxe.

## Próximos passos
- Instalar/autenticar o CLI do Railway neste ambiente ou colar os logs do painel do Railway.
- Se houver stack/runtime error no boot, analisar a partir dos logs remotos.
