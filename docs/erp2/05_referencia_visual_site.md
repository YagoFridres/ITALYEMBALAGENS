# 05 · Referência visual extraída do site público da Italy

> **Etapa 1 · auditoria (somente leitura).** Nada aqui foi inventado: tudo foi extraído
> do **CSS público** do site em 19/10/2026, por `Invoke-WebRequest` + parsing local
> (scripts temporários, não commitados). O site **está publicado e o acesso funcionou**.
> Esta dependência **não bloqueia** a auditoria nem o planejamento.

---

## 1. De onde veio (com prova)

| Recurso | URL | Tamanho | Resultado |
|---|---|---:|---|
| Página | `https://italyembalagens.com.br` | 37.277 B | HTTP **200** — site publicado |
| Folha de estilo | `https://italyembalagens.com.br/assets/css/site.css?v=1` | 24.024 B | HTTP **200** |
| Google Fonts | `fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=Source+Sans+3:wght@400;600;700` | — | 2 famílias |

- **Não há CSS embutido** no HTML (`<style>` = 0 blocos); **todo** o estilo vem de `assets/css/site.css`.
- Único `<link rel="stylesheet"` local: `assets/css/site.css?v=1` ([_tmp_site.html L23]).

---

## 2. Tipografia

| Papel | Fonte | Pesos | Observação |
|---|---|---|---|
| Título | **Archivo** (variável) | 500–800 (usados 600, 700, 750, 800) | `font-stretch:112%` em títulos, `108%` em botões |
| Texto | **Source Sans 3** | 400, 600, 700 | corpo `400 1.0625rem/1.6` (≈17 px, entrelinha 1.6) |
| Mono (ERP) | JetBrains Mono | — | já usada no ERP para números (mantida) |

Escala real (do CSS):

| Elemento | Valor |
|---|---|
| h1 | `clamp(2.4rem, 5.6vw, 4.4rem)` · 800 · `letter-spacing:-.02em` |
| h2 | `clamp(1.8rem, 3.4vw, 2.6rem)` · 750 · `letter-spacing:-.015em` |
| h3 | `1.25rem` · 700 |
| corpo | `1.0625rem` (17 px) / 1.6 |
| lead | `1.2rem` |
| botão | `700 1rem/1` · `font-stretch:108%` |

---

## 3. Cores (tokens exatos do `:root`)

| Token | Valor | Papel no site |
|---|---|---|
| `--petroleo` | `#1E4D57` | **cor primária** (acao/nav) |
| `--petroleo-escuro` | `#123239` | fundo escuro / texto sobre verde |
| `--teal` | `#55A4AD` | **cor do logotipo** |
| `--verde` | `#A8CF4E` | **folha do logotipo** (botão principal); hover `#BADD66` |
| `--verde-escuro` | `#5E8F1F` | apoio |
| `--kraft` | `#C9A47E` | papelão |
| `--kraft-claro` | `#EFE4D6` | fundo kraft |
| `--papel` | `#F6F7F5` | fundo claro |
| `--branco` | `#FFFFFF` | fundo base |
| `--tinta` | `#17292E` | **texto de título** |
| `--texto` | `#3A4A4F` | texto corrido |
| `--linha` | `#DDE3E1` | bordas |
| `--whats` | `#1FA855` | WhatsApp; hover `#178F47` |

Outros hex usados: `#CFE0DD`, `#E3EEEC`, `#C9DCD8` (verdes claros de apoio).

**Observação importante:** o site é **claro** (fundo branco/papel). O ERP do Yago deve
permanecer **escuro**. Portanto a Etapa 2 **não** copia o fundo claro — ela **traspõe** a
identidade (petróleo + teal + verde-folha + kraft) para o tema escuro.

---

## 4. Formas, sombras, espaçamento e foco

| Item | Valor |
|---|---|
| Raios | `--raio-s:6px`, `--raio-m:12px`; botões em pílula `999px`; menu `8px`; também 4/10/14/18/20px |
| Sombra | `--sombra: 0 1px 2px rgba(18,50,57,.06), 0 8px 24px -12px rgba(18,50,57,.18)` |
| Largura | `--larg:1200px`, container com `padding:0 20px` |
| Seções | `padding: clamp(56px,8vw,104px) 0` |
| Cabeçalho | sticky, 72 px de altura, `background:rgba(255,255,255,.94)` + `backdrop-filter:blur(10px)`, borda inferior `1px var(--linha)` |
| Foco (acessibilidade) | `:focus-visible{outline:3px solid var(--verde); outline-offset:3px; border-radius:4px}` |
| Botão (base) | pílula, borda 2px, `padding:1em 1.5em`, transição `.2s`, `:active{transform:translateY(1px)}` |
| Breakpoints | 1000, 960, 920, 860, 760, 700, 600, 560, 520 px |

---

## 5. Como isso vira o tema escuro do ERP (proposta, para aprovação)

Mapeamento direto — **troca de valores** dos tokens que o ERP já tem
(`--bg --surface --accent --text …`), **sem tocar em HTML/JS**:

| Token do ERP | Proposta (adaptada do site) | Origem |
|---|---|---|
| `--bg` (fundo) | `#0E1416` | neutro escuro (o site não tem; base do prompt) |
| `--surface` | `#123239` (petróleo-escuro) / `#151E21` | `--petroleo-escuro` |
| `--accent` (primária) | `#1E4D57` (petróleo) com realce `#55A4AD` (teal) | `--petroleo` / `--teal` |
| `--verde` (ação positiva) | `#A8CF4E` com texto `#123239` | `--verde` (folha do logotipo) |
| `--kraft` | `#C9A47E` | `--kraft` |
| `--text` | `#E7EEF0` | neutro claro |
| `--text2` | `#9DB0B5` | neutro |
| `--text3` (era `#475569`, 2,49:1) | ≥ `#7C8C90` (a validar ≥ 4,5:1) | corrige o pior caso atual |
| `--font` | **Archivo** (títulos) + **Source Sans 3** (texto) | site |
| `--raio-s` / `--raio-m` | `6px` / `12px` | site |

**Contraste comprovado** (calculado) dos acentos do site sobre fundo escuro `#0E1416`:

| Cor | Contraste | AA (4,5:1) |
|---|---:|---|
| verde-folha `#A8CF4E` | **10,35:1** | ✔ |
| teal `#55A4AD` | **6,46:1** | ✔ |
| kraft `#C9A47E` | **8,05:1** | ✔ |
| verde-escuro `#5E8F1F` | 4,80:1 | ✔ |
| whats `#1FA855` | 6,01:1 | ✔ |
| branco sobre petróleo `#1E4D57` | **9,32:1** | ✔ |
| `#123239` sobre verde `#A8CF4E` (texto de botão) | **8,40:1** | ✔ |

**Decisão aprovada pelo Yago (19/10):** adotar a **paleta** (azul-petróleo + teal + verde + kraft),
com o **verde-folha como cor de ação positiva**, e **botões discretos de cantos levemente
arredondados** (`--raio-s` ≈8 px) — **não** a pílula (`999px`) do site. Manter o **tema escuro**,
limpo e simples para o chão de fábrica. (Aprovação de direção; **não** é autorização de publicação.)

---

## 6. O que (ainda) poderia vir do site

| Item | Situação |
|---|---|
| Paleta, fontes, raios, sombras, espaçamentos, foco | **Obtidos** (§2–§4) |
| Logo em vetor (SVG) | O site usa imagem (`logo img{height:46px}`); **se quiser o SVG da marca**, preciso do arquivo do logo |
| Guia de marca / manual de identidade | Não está no site; **se existir**, peça o PDF |
| GitHub/repositório do site | Não é necessário: o CSS público já bastou |

> Nada disso impede a auditoria nem o planejamento — só o **logo em vetor** é bem-vindo para a Etapa 2.

---

## 7. Estado

- **Somente documentação.** Nenhuma linha de código de produção alterada; `index.html` intocado.
- **Etapa 2 não iniciada** — aguarda a integração e validação do P1 na `main`.
- Quando liberado: criar a branch de modernização a partir da `main` e implementar **apenas o padrão
  visual com a chave de teste**, sem mexer na lógica das telas.
