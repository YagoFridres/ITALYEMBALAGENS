# [OPEN] Debug Session: ofmaq-bridge-stack

## Context
- Symptom: `RangeError: Maximum call stack size exceeded` em produção com centenas de entradas `wrapped`.
- Suspeita principal: re-wrap infinito em entrypoints do OFmaq, especialmente `bridgeLegacyOfmaqEntrypoints()` e wrappers legados (`accordion`, `swipe`, outros patches).
- Escopo paralelo relacionado: Simulador ainda sem evidência conclusiva em produção; redesigns full-screen e ajustes visuais ficam subordinados ao fix urgente do stack overflow.

## Hypotheses
1. `bridgeLegacyOfmaqEntrypoints()` recria wrappers em cada execução do patch e encadeia closures antigas.
2. Outro patch reatribui `window.renderOFsPorMaquina` e funções irmãs após o bridge, invalidando o guard simples por flag.
3. Há ciclo entre wrappers de tipos diferentes (`bridge`, `accordion`, `swipe`, prioridade/hub) chamando entrypoints globais.
4. Produção está servindo ordem/cópia diferente do `patch.js`, então os guards locais não equivalem ao runtime real.
5. O erro de stack não está no bridge em si, mas em outro wrapper genérico recorrente que aparece como `wrapped` no sourcemap/stack.

## Evidence Plan
- Instrumentar wrappers do OFmaq para registrar identidade, target e profundidade de wrapping.
- Reproduzir via reloads repetidos e navegação entre OFmaq e outras telas.
- Mapear o runtime real em produção/local e comparar com o código em disco.
- Só depois aplicar fix mínimo com guard estrutural.

## Status
- Aberto
