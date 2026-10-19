# 04 · Plano das próximas etapas (Etapa 2 e módulos)

> Complementa `01_inventario_telas.md`, `02_diagnostico.md` e `03_padroes_visuais.md`.
> **Nada aqui foi executado.** É o plano para aprovação.

---

## 0. Pré-requisitos e regras

- **Aguardar o merge do PR P1** (`trae/p1-of-rapida`) na `main`. Só então criar
  `trae/erp-italy-modernizacao` **a partir da `main`** (para não conflitar no `patch.js`).
- Sem merge/deploy/force-push/commit na `main`. PR por bloco, revisão antes de publicar.
- **Não editar `index.html`** — só o bump de versão (5 pontos).
- Trecho novo vive em `public/ui2/` (CSS + JS) e é carregado pelo `patch.js`.
- **Tudo atrás da chave:** `localStorage.pcpro_ui='2'` **ou** `?ui=2` → `data-ui="2"` no `<html>`.
  Sem a chave, o ERP fica **byte a byte igual** ao atual no visual.

### Os três cuidados do usuário (obrigatórios)
1. **Isolamento total do visual:** nenhum seletor `.ui2` fora de `html[data-ui="2"]`; nenhuma
   regra que afete o DOM sem a chave ligada.
2. **Desempenho separado do visual:** nenhuma rotina crítica é alterada "para consumir menos"
   sem mapear dependências (ver §4).
3. **Funcionalidade não só contagem:** além de contar botões/campos, verificar que seguem
   **visíveis, legíveis, clicáveis e funcionais** (com a chave ligada e desligada).

---

## 1. Etapa 2 · Design System (atrás da chave)

### 1.1 Arquivos
| Arquivo | Papel |
|---|---|
| `public/ui2/italy-ui2.css` | tokens (`html[data-ui="2"]`) + componentes, **só CSS** |
| `public/ui2/italy-ui2.js` | liga/desliga a chave + item "Visual novo (teste)" nas Configurações — **só isso** |
| `public/ui2/componentes.html` | página de referência antes/depois, **sem dados e sem API** |
| `patch.js` | carregar `ui2.css`/`ui2.js` quando a chave estiver ativa (bloco novo, isolado) |
| `index.html` | **apenas** o bump de versão |

### 1.2 Identidade
- Base: azul-petróleo `#1E4D57` do site novo → tokens escuros do prompt (§5 de `02_diagnostico.md`),
  com o **tema claro mantido funcionando**.
- Fonte legível (Plus Jakarta Sans / a do site); números em JetBrains Mono (já usada).
- Toque ≥ 44 px; texto base ≥ 15 px no celular; ícone acompanhado de texto.
- Extrair fontes, raios e demais cores **do CSS do site** (o Yago confirmou que só a cor
  `#1E4D57` estava legível) — **pendente: acesso ao repositório/CSS do site**.

### 1.3 Tokens e componentes (só CSS)
Redefinir `--bg --surface --s2..s4 --border --accent --text --text2 --text3 --font` em
`html[data-ui="2"]`; depois estilizar `.btn`, `.btn-accent`, `.btn-ghost`, inputs, selects,
`.modal`, tabelas, cards, abas, toasts, foco visível de teclado — **sem** HTML/JS de tela.

### 1.4 Testes obrigatórios (antes de seguir para módulos)
- **Chave desligada:** `toHaveScreenshot` (Playwright) nas telas principais contra o **mock** —
  diff pixel a pixel = 0.
- **Chave ligada:** script que conta botões, inputs e colunas visíveis por tela e compara
  ligado × desligado — números **iguais**; e checagem de **clique/visibilidade/leitura**.
- **Contraste ≥ 4,5:1** nos pares de cor (teste automatizado).
- Resoluções **1366, 1920, 768 e 390 px**.
- **Parada aqui:** entregar a página `componentes.html` antes/depois e **aguardar aprovação do Yago**
  antes de tocar em qualquer módulo.

### 1.5 Entrega da Etapa 2
Commits na branch com prints reais (mock) de antes/depois + saída dos testes.

---

## 2. Ordem dos módulos (após aprovação do visual)

Ordem combinada: **menu e cabeçalho → OFs por Máquina → OF Rápida → PCP → Hub → Orçamentos → demais.**

| # | Módulo | Arquivos que vai tocar | Escopo |
|---|---|---|---|
| 1 | **Menu + cabeçalho** | `ui2/*.css`, bloco novo no `patch.js` (só ativar classes visuais) | sidebar/topbar/abas — só pele |
| 2 | **OFs por Máquina** | `ui2/*.css`; `patch.js` só p/ marcar containers | **só visual** — essência, organização e lógica inalteradas |
| 3 | **OF Rápida** | `ui2/*.css`, `patch.js` (visual) | criar/editar; número definido pelo servidor |
| 4 | **PCP** | `ui2/*.css` | tabela/cards; sem mudar dados |
| 5 | **Hub** | `ui2/*.css` | KPIs/atalhos existentes; **sem criar bloco "Atenção hoje"** |
| 6 | **Orçamentos** | `ui2/*.css` | calculadora com resumo visível |

> **Proibido em toda a modernização:** criar botões/status/etapas novos (ex.: "Iniciar/Pausar
> produção"), remover/esconder função, mudar cálculos/numeração/textos de regra, e mudar a
> lógica de OFs por Máquina.

---

## 3. Trilha de desempenho (separada do visual)

Tratada em **fase própria**, após o design system, com mapeamento de dependências antes de
qualquer alteração (cuidado nº 2):

1. **Cache de estáticos** (`index.html`/`patch.js`): trocar `no-store` por ETag/hash
   ([server.js L1150-1167](../../server.js#L1150-L1167), [L1398-1399](../../server.js#L1398-L1399)),
   ajustando o `sw.js`. Maior ganho (≈10 MB/abertura → quase 0 em reabertura).
2. **Inventário nominal** dos 45 `MutationObserver` + 56 `setInterval` do `patch.js` e
   consolidação com segurança (uma área por vez, com prova de contagem de renders).
3. **Rotas duplicadas/404:** `/api/tipos_caixa`×`/api/tipos-caixa`,
   `/api/caixas_perdidas`×`/api/caixas-perdidas`, `/api/machines`, `/api/equipamentos`.

Cada item entra como **commit isolado**, com prova de que nada mudou de comportamento.

---

## 4. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Visual novo vazar sem a chave | todos os seletores sob `html[data-ui="2"]`; teste de diff = 0 desligado |
| Alterar lógica sem perceber | proibido editar `index.html`; `patch.js` só em blocos novos e isolados; PR revisado |
| Conflito com P1 | só começar após o merge do P1 na `main` |
| Regressão funcional | teste liga/desliga contando e **operando** botões/campos |
| Contraste | teste automatizado ≥ 4,5:1 |
| Segredo no código | nunca escrever senhas/tokens em código, commits, prints ou relatórios |

---

## 5. Pendências que dependem do Yago

1. **Acesso ao CSS/fontes do site novo** (para extrair paleta, fontes e raios).
2. **Aprovação do visual** ao fim da Etapa 2 (via `componentes.html`).
3. **Confirmação das telas mortas/órfãs** (§3 de `01_inventario_telas.md`) antes de qualquer decisão.
4. **Deploy do P1:** o Yago pediu para ser avisado quando o deploy for feito — **não** farei sem autorização.

---

## 6. Estado atual (entrega da Etapa 1)

- Branch `trae/erp2-auditoria` (a partir da `main` = `e2c8930`), **só documentação**.
- Nenhuma linha de código de produção alterada. Nenhum merge/deploy/SQL.
- Aguardando: (a) merge do P1 na `main`; (b) aprovação deste inventário/diagnóstico; (c) acesso ao CSS do site.
