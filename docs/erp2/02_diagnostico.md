# 02 · Diagnóstico visual e de desempenho — com números

> **Etapa 1 · auditoria (somente leitura).** Base: `main` = `e2c8930`.
> Todas as medições abaixo foram feitas por script local sobre os arquivos do
> repositório (`node _tmp_erp2_medicoes.js` e afins, não commitados). O que **não**
> pôde ser medido está marcado como pendente em §7 — nada foi estimado como se fosse medido.

---

## 1. Corpus (tamanhos reais)

| Arquivo | Bytes | MB (decimal) | MiB | Linhas |
|---|---:|---:|---:|---:|
| `index.html` | 6.203.158 | 6,20 | 5,92 | 61.380 |
| `patch.js` | 3.939.347 | 3,94 | 3,76 | 68.404 |
| `server.js` | 1.862.084 | 1,86 | 1,78 | 39.290 |
| `sw.js` | 3.649 | 0,004 | 0,003 | 119 |
| **`index.html` + `patch.js`** | **10.142.505** | **10,14** | **9,67** | — |

> Correção ao número do Claude: "6,2 MB / 3,9 MB" está certo em **MB decimal**;
> em MiB é 5,92 / 3,76. Payload por abertura = **10,14 MB sem compressão**.

---

## 2. Por que ~10 MB são baixados a cada abertura (comprovado)

1. `index.html` carrega `patch.js` por `<script src="/patch.js?v=20261009100500">`
   ([index.html L61377](../../index.html#L61377)) e `mobile.js` ([L61378](../../index.html#L61378)).
2. Todo arquivo estático é servido com **`no-store`**:
   - [server.js L1398-1399](../../server.js#L1398-L1399): `express.static(..., { etag:false, lastModified:false, setHeaders: setNoCache })`;
   - [server.js L1150-1167](../../server.js#L1150-L1167) `setNoCache`: `no-store, no-cache, must-revalidate`, `Pragma: no-cache`, `Expires: 0` (exceto `sw.js` e `manifest.json`);
   - aplicado em **61 pontos** do `server.js`.
3. O Service Worker **força rede, sem cache**, para o que importa:
   [sw.js L9-15](../../sw.js#L9-L15) `isNetworkOnlyPath()` trata `/patch.js`, `/sw.js`,
   navegação e `/index.html` como *network-only*; [sw.js L79-86](../../sw.js#L79-L86)
   usa `fetch(event.request, { cache:'no-store' })`. Só imagens/fontes entram no Cache API ([sw.js L93](../../sw.js#L93)).

**Conclusão:** o `?v=` versiona, mas **não** evita o download — o navegador baixa
`index.html` (~6,20 MB) + `patch.js` (~3,94 MB) **a cada abertura**. Este é o maior
ganho de velocidade isolado disponível, e é **independente** de qualquer mudança visual
(cuidado nº 2 do usuário: desempenho tratado à parte do visual).

---

## 3. Contadores (medidos)

| Padrão | index.html | patch.js | sw.js | server.js |
|---|---:|---:|---:|---:|
| `!important` | 465 | 2.391 | 0 | 0 |
| `style="` (inline) | 6.446 | 2.692 | 0 | 128 |
| `@media` | 28 | 67 | 0 | 2 |
| `new MutationObserver` | 5 | 45 | 0 | 0 |
| `setInterval(` | 16 | 56 | 0 | 1 |
| `setTimeout(` | 150 | 437 | 0 | 14 |
| `window.fetch =` (wrapper) | 0 | 9 | 0 | 0 |
| `addEventListener(` | 195 | 293 | 3 | 0 |
| `querySelectorAll(` | 151 | 388 | 0 | 0 |
| `data-theme` | 59 | 9 | 0 | 0 |

| server.js | valor |
|---|---:|
| `setNoCache` | 61 |
| rotas `app.<verbo>()` | 440 (439 únicas) |
| literais `"/api/"` | 452 |
| consultas `.from('…')` | 788 |

| Estruturas de tela (index.html) | valor |
|---|---:|
| `id="page-*"` | 46 (45 páginas + 1 referência em CSS) |
| modais (`id="*modal*"`) | 73 |
| `class="modal-overlay"` | 46 |
| modais `style="…position:fixed"` (2ª implementação) | 30 |
| `z-index:9999` | 49 (index) + 32 (patch) |
| `onclick="go('…')"` | 51 |
| `onclick="abrirModal…"` | 75 |
| `window.<nome> = function` | 53 |
| classes CSS distintas (`class="…"`) | 1.558 |

| Camadas de override no patch.js | ocorrências |
|---|---:|
| `window.go` (nome) | 80 |
| `window.go =` (redefinições) | 35 |
| `abrirModalOF` | 30 |
| `renderOrcamentos` | 40 |
| `abrirCalculadora` | 41 |

> Correção/ajuste ao Claude: ele citou "47 MutationObserver" e "45" em pontos diferentes.
> Contando `new MutationObserver` **no patch.js**, são **45** (e 5 no `index.html`).
> `setInterval` = 56 no `patch.js` (igual) e 16 no `index.html` (igual).

---

## 4. Processamento contínuo (peso no celular)

- **45 observadores** de DOM (`new MutationObserver`) + **56 timers** (`setInterval`) no
  `patch.js`; **5 + 16** no `index.html`. Muitos rodam **sem parar** (polls de tela), o que
  no celular pesa em bateria/CPU e provoca "cards pulando".
- **9 wrappers de `window.fetch`** no `patch.js` interceptam tráfego (há cache de OFs com
  TTL 60 s — `_patchFetchOfsCached`, do P1).
- Camadas que se reescrevem (`go` ×35, `renderOrcamentos` ×40, `abrirCalculadora` ×41):
  cada nova camada roda sobre a anterior → custo acumulado e depuração difícil.
- Rotas chamadas repetidas vezes / duplicadas: `/api/tipos_caixa` **e** `/api/tipos-caixa`;
  `/api/caixas_perdidas` **e** `/api/caixas-perdidas`; `/api/machines` e `/api/equipamentos`
  (404); rota duplicada `passou-maquina` (ver `08_INVENTARIO`).

> **Regra do usuário (cuidado nº 2):** nada disso deve ser alterado "para reduzir consumo"
> sem antes mapear dependências. Estas medições servem de **diagnóstico**, não de autorização
> para editar rotinas críticas.

---

## 5. Tokens e contraste (medidos)

**Tema escuro (default)**, extraído do `index.html`:

| Token | Valor | Papel |
|---|---|---|
| `--bg` | `#0f1117` | fundo |
| `--surface` | `#17191f` | superfície |
| `--s2`…`--s4` | `#1e2028` / `#252830` / `#2c2f3a` | elevações |
| `--border` / `--b2` | `#2a2d38` / `#343748` | bordas |
| `--accent` / `--accent2` | `#2563eb` / `#1d4ed8` | primária |
| `--text` / `--text2` / `--text3` | `#f1f5f9` / `#94a3b8` / `#475569` | texto 1/2/3 |
| `--font` / `--mono` | `Inter` / `JetBrains Mono` | tipografia |

Há um **segundo conjunto** de tokens light (`--bg1/--bg2/--text1/--card-bg/--input-bg/…`),
totalizando **66 tokens** — dois sistemas de tema convivendo.

**Contraste atual (WCAG AA = 4,5:1 para texto):**

| Par | Contraste | Veredito |
|---|---:|---|
| `--text` `#f1f5f9` sobre `--bg` `#0f1117` | **17,22:1** | ok |
| `--text2` `#94a3b8` sobre `--bg` | **7,36:1** | ok |
| `--text3` `#475569` sobre `--bg` | **2,49:1** | **reprova** |
| `--accent` `#2563eb` sobre `--bg` | **3,65:1** | reprova p/ texto normal |
| `--text3` `#475569` sobre `--surface` `#17191f` | **2,32:1** | **reprova** |

**Contraste da proposta (Etapa 2) — todos aprovam:**

| Uso | Contraste |
|---|---:|
| texto `#E7EEF0` sobre fundo `#0E1416` | 15,82:1 |
| secundário `#9DB0B5` sobre fundo | 8,24:1 |
| petróleo-destaque `#4FB3C4` sobre fundo | 7,59:1 |
| kraft `#C49A6C` sobre fundo | 7,24:1 |
| alerta `#E0A33A` sobre fundo | 8,38:1 |
| verde-status `#2E9E6B` sobre fundo | 5,50:1 |
| perigo `#E5534B` sobre fundo | 5,02:1 |
| texto branco `#FFFFFF` sobre botão petróleo `#0F5E6E` | 7,38:1 |
| texto branco `#FFFFFF` sobre botão verde `#1F7A52` | 5,30:1 |

> A proposta do prompt fica **entre 5,0:1 e 15,8:1** — acima do mínimo de 4,5:1 em todos
> os pares de texto. (`--text3 #475569` atual = 2,49:1 é o pior caso confirmado.)

---

## 6. Leitura do diagnóstico (o que mudar sem tocar em lógica)

| Problema | Evidência | Correção prevista (Etapa 2 ou fase de desempenho) |
|---|---|---|
| ~10 MB por abertura | §2 | cache de `index.html`/`patch.js` (hash/ETag em vez de `no-store`); **fase de desempenho, separada do visual** |
| `--text3` ilegível (2,49:1) | §5 | novo token `--text3` ≥ 4,5:1 (só CSS, atrás de `data-ui="2"`) |
| 2.400+ `!important`, 9.100 `style=` | §3 | componentes por classe no `ui2`, sem tocar no legado |
| 101 observers/intervals | §4 | mapear e reduzir **com cuidado**, uma área por vez |
| 2 implementações de modal | §3, §5 | componente único no `ui2`; legado intacto |
| Sem padrão de botão/aba/toast | §3, `03_padroes_visuais.md` | `.btn`, `.tabs`, `.toast` no `ui2` |

---

## 7. O que NÃO foi medido (pendente, sem inventar)

1. Tempo até login/Hub/OFs por Máquina; troca de aba; memória após 10 min — exigem
   DevTools contra mock ou a sessão do Yago (não medido nesta passada).
2. Bytes **na rede** com compressão (gzip/brotli do Railway) e nº de requisições por tela.
3. Requisições duplicadas reais por tela (só as rotas duplicadas foram identificadas).
4. Comportamento em celular real (Moto G Power / iPhone 12).
5. Quais observers/intervals rodam "sem parar" nominalmente: identificados por contagem;
   a lista nominal dos 45/56 será levantada na fase de desempenho, com o Yago.
