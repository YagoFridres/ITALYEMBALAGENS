# 03 · Padrões visuais atuais (variações reais)

> **Etapa 1 · auditoria (somente leitura). Nada muda aqui.** Este documento mede
> **quantas variações** de cada componente existem hoje e **onde aparecem**, para
> dimensionar o design system da Etapa 2. Contagens por script local
> (`node _tmp_erp2_classes.js`), não commitado. Base: `main` = `e2c8930`.

---

## Resumo

| Componente | Variações | Diagnóstico |
|---|---:|---|
| Botões | **>25 classes** + centenas inline | sem padrão único |
| Campos (input/select) | **812 `<input>` + 300 `<select>`** em 2 arquivos, com >6 wrappers diferentes | sem padrão único |
| Modais | **2 implementações** (`.modal-overlay` e `position:fixed` inline) | z-index e overlay divergentes |
| Tabelas | **194 `<table>`** + 108 `<tbody>`; só 2 usam `.table-wrap` | quase todas ad-hoc |
| Cards | `.card` 100, `.sbox*` 253, `.ccustos-*` 25, `.card-val/lbl` 158 | 4+ famílias |
| Abas | `.tabs` 1 e `.tab` 1 | **não há componente de abas**; cada tela faz o seu |
| Toasts | `toast()` 984 chamadas; `showOfmaqCenterConfirm` 43 | feedback duplicado |
| Estados vazios/carregando | texto ad-hoc (`"Nenhum"` 246×, `"Carregando"` 431×); **0 skeleton** | sem padrão |

---

## 1. Botões

Classes mais usadas (index + patch):

| Classe | Ocorrências | Observação |
|---|---:|---|
| `.btn` | 537 | base |
| `.btn-sm` | 398 | tamanho |
| `.btn-ghost` | 351 | variante |
| `.btn-accent` | 130 | primária |
| `.btn-icon` | 50 | só ícone |
| `.btn-green` / `.btn-purple` / `.btn-red` / `.btn-orange` | 16 / 15 / 13 / 3 | cores pontuais |
| `.btn-primary` | 2 | **duplicata** de `.btn-accent` |
| `.btn-cor`, `.btn-cores-picker`, `.btn-danger-outline`, `.btn-salvar`, `.btn-pdf`, `.btn-imprimir`, `.btn-fechar`, `.btnlink`, `.btn-acoes`, `.btn-acoes-of`, `.btn-dia`, `.btn-up`, `.btn-down`, `.btn-pin-chapa`, `.btn-criar-maq`, `.btn-editar-maq` | 1–3 cada | **classes de uso único** |
| `.primary` / `.danger` | 62 / 27 | outra convenção de cor |

Além das classes, há **6.446 `style="…"` no `index.html`** e **2.692 no `patch.js`** —
muitos botões são estilizados por atributo, não por classe. `!important`: 465 (index) +
2.391 (patch).

**Conclusão:** hoje são **4 convenções concorrentes** (`btn-accent`, `primary`,
inline, e uma dúzia de classes únicas). A Etapa 2 define **um** `.btn` com variantes
(`-accent`, `-ghost`, `-danger`, …) **sem remover** nenhuma classe antiga.

## 2. Campos (inputs e selects)

| Item | index.html | patch.js |
|---|---:|---:|
| `<input` | 605 | 368 |
| `<select` | 207 | 93 |

Wrappers de campo em uso (classes): `.mf`+`.fgf` (359+99), `.fg` (41), `.fgrp` (25),
`.pep-input` (38), `.pcp-input` (46), `.estoque-modal-input` (25), `.ccpx-item-field` (33),
`.sbox*` (253). Ou seja, **≥8 convenções de formulário**. Altura de toque hoje é pequena
(campos ~28–29 px citados no inventário; precisa confirmação visual). A Etapa 2 fixa
**uma** aparência de input/select/label, sem tocar no HTML.

## 3. Modais

- **Implementação A — `.modal-overlay`:** 46 no `index.html`. Estrutura `overlay > .modal > .modal-header/.modal-body/.modal-footer`.
- **Implementação B — `position:fixed` inline:** 30 no `index.html`
  (`style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999…"`), sem classe base.
- **z-index divergentes:** `9999` aparece 49× (index) e 32× (patch); também `99999`, `9000`, `1000`.
- Botão de fechar: ora `.close-btn` (59), ora ícone inline, ora `onclick` no overlay ("clicar fora").
- Modais longos já usam `max-height:calc(100vh - 40px)` em alguns casos (padrão do projeto),
  mas não em todos.

**Conclusão:** a Etapa 2 padroniza **por CSS** as duas implementações (o componente `.ui2`
estiliza `.modal-overlay` **e** um utilitário para os modais inline), **sem** reescrever HTML.

## 4. Tabelas

- 194 `<table>` (111 index + 83 patch) e 108 `<tbody>`.
- Só **2** usam `.table-wrap`; o resto é tabela crua com `style` inline e `.num`/`.val` (111/98).
- Colunas de negócio usam `.num` (monoespaçada) e `.lbl` (97) de forma irregular.

**Conclusão:** não existe "componente de tabela". A Etapa 2 só padroniza **aparência**
(cabeçalho, zebra, hover, densidade, rolagem), sem reordenar colunas nem mudar dados —
e a OFs por Máquina **mantém a estrutura atual** (regra do usuário).

## 5. Cards

Quatro famílias convivem: `.card` (+`.card-val` 80, `.card-lbl` 78, `.card-sub` 25),
`.sbox`/`.sbox-h`/`.sbox-b` (88/83/82), `.ccustos-*` (25) e blocos `.card-tmpl` (1).
Há ainda `.cards-row`/`.cards` (11). **Não há `kpi-*`** padronizado.

## 6. Abas

`.tabs` aparece **1×** e `.tab` **1×** no total. Ou seja, **não há componente de abas**
no sistema: cada tela (PCP, OFs por Máquina, Estoque, Financeiro) monta as suas com
`onclick` + `display`. A Etapa 2 cria um padrão de abas **visual** reutilizável sem
alterar a mecânica existente.

## 7. Toasts e confirmações

| Mecanismo | index.html | patch.js |
|---|---:|---:|
| `toast(...)` | 786 | 198 |
| `showOfmaqCenterConfirm(...)` | 0 | 43 |
| `alert(...)` | 78 | 170 |
| `confirm(...)` | 66 | 23 |
| `prompt(...)` | 35 | 12 |
| `.toast` (classe CSS) | 1 | — |

**Conclusão:** há **4+ formas de avisar** (`toast`, confirmação central, `alert`,
`prompt`). A padronização visual da Etapa 2 é **só de estilo** (o `toast` e o
`showOfmaqCenterConfirm` existentes ganham a pele `.ui2`); **não** substitui lógica.

## 8. Estados vazios, carregando e erro

- **Sem esqueleto/skeleton** (`skeleton` = 0).
- **Sem spinner padronizado** no `index.html` (`spinner` = 0; 10 no `patch.js`).
- Estados vazios e de carregamento são **texto solto**: `"Nenhum/Nenhuma"` 246× e
  `"Carregando/loading"` 431× somando os dois arquivos.

**Conclusão:** criar `.ui2-empty` e `.ui2-loading` de aparência única é ganho grande,
**sem** tocar no comportamento (apenas CSS/atributo visual).

---

## 9. Implicação para a Etapa 2 (resumo)

| Camada | O que a Etapa 2 faz | O que **não** faz |
|---|---|---|
| Tokens | redefine `--bg --surface --accent --text --font …` em `html[data-ui="2"]` | não troca HTML/JS |
| Componentes | CSS para `.btn`, inputs, `.modal`, tabelas, cards, abas, toasts, foco de teclado | não remove classe antiga |
| Chave | `localStorage.pcpro_ui='2'` ou `?ui=2` → `data-ui="2"` no `<html>` | sem a chave, **idêntico ao atual** |
| OFs por Máquina | **só visual**, mantendo essência, organização e lógica | não altera distribuição, máquinas, horários, ordem |
