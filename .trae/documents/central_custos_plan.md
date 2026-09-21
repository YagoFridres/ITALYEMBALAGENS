# Central de Custos (Menu 🔒 Financeiro) — Implementation Plan v2.0
**Alinhado 1:1 com documento oficial do usuário + 4 decisões de negócio confirmadas (2026-09-14)**

---

## 1. Decisões de negócio CONFIRMADAS pelo usuário

| Pergunta | Resposta (definitiva) |
|---|---|
| Nº abas | **5 ABAS** → 1. Visão Geral · 2. Lançamentos · 3. Centros de Custo · 4. Custo por OF · 5. Histórico Comparativo |
| Comissão Vendedor | **SEPARADA** → NÃO entra na Central, fica exclusivamente no módulo Comissões (sem duplicação) |
| Recorrência alteração valor_padrao | **SÓ PRÓXIMAS** → não retroage competências passadas; editar valor antigo de competência já gerada = edição individual na linha do Lançamento |
| Detalhe Custo por OF | **SÓ R$/un** → reaproveita 100% Relatório Custos atual (endpoint `/api/relatorios/custos` L16390 server.js) sem colunas extras de R$/m² ou R$/ton |

---

## 2. Repository Research — DADOS EXISTENTES (REAPROVEITADOS, NÃO DUPLICAMOS NENHUM)

### 2.1. Custo POR OF — Fonte Oficial ✅ (REUSAR TUDO, NADA RECALCULAR)

**Fonte única canônica**: [server.js:L16390-L16468](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L16390-L16468) → endpoint `/api/relatorios/custos`

**Fórmula canônica copiada exatamente:**
```
custo_total_OF = ((dim_comprimento_mm / 1000) * (dim_largura_mm / 1000)) * gramaturas.valor_unitario * pickQtd(ofs)
pickQtd = qtd_produzida ?? qtd ?? quantidade ?? qtd_pedida
```

**Helper alternativo idêntico (AA3)**: [server.js:L14408-L14442](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L14408-L14442) → `pickCustoOf()`. Vamos extrair esse helper para escopo de módulo e usar no endpoint consolidado também, evitando duplicação de fórmula.

**Colunas da tabela OFS usadas hoje (confirmadas Fact10 / whitelist):**
- `dim_comprimento`, `caixa_comprimento`, `dim_largura`, `caixa_largura`
- `gramatura_id` → join tabela `gramaturas.valor_unitario`
- `qtd_produzida`, `qtd`, `quantidade`, `qtd_pedida`
- `data_conclusao`, `status`
- `valor_total`, `valor_unitario` (para coluna "Venda" da tabela 4.aba)
- `numero`, `of`, `descricao`, `cli_id`

### 2.2. Custo PAPELÃO / CHAPAS — Fonte Existente ✅ (NÃO cadastrar manualmente — automático)

**Fontes oficiais para calcular "Custo com Papelão do mês":**

| Fonte | Local server.js | Campo usado |
|---|---|---|
| Chapas Estoque V2 (OFICIAL) | `chapas_estoque_v2` table L3763, L7462, L19625 | `valor_unitario` × `quantidade_atual` → `valor_total = sum(qtd * vu)`. OU coluna `valor_total` L31409 se já existir |
| Monitoramento preços fornecedor | L19609 `/api/fornecedores/:id/precos` + L21459 `chapasTables` | Tabela já existe; não vamos recriar — só consolidar o somatório do mês (lançamentos de compra) |
| Compra Papelão UI | index.html L7346 (ccpx-hero-stat "Total Comprado") | Chama o mesmo somatório acima; reutilizar |

**Como consolidar automaticamente por competência (YYYY-MM):**
- Papelão = soma de `chapas_estoque_v2` (ou v1) **movimentações de ENTRADA no mês** (tabela existe ou será gerada via join `chapas_estoque_v2` + `data_recebimento`). Se coluna `data_recebimento` não existir → cria via migration como nullable.
- **Esses custos são CUSTOS AUTOMÁTICOS** (marcados internamente com flag `origem='AUTO_PAPELAO'` no join virtual da Visão Geral).
- **NÃO cria lançamento manual duplicado na tabela `lancamentos_custos`.** O sistema distingue:
  - 🔵 **Custos Automáticos** (vindos OFs / Chapas / Perdas) — só leitura, não editáveis diretamente no Lançamentos
  - 🟣 **Custos Manuais** (salários, água, energia, combustível, manutenção, telefone, frete manual, insumos gerais, outros) — editáveis/excluíveis no CRUD da aba 2

### 2.3. PERDAS — Fonte Existente ✅ (Endepoint caixas-perdidas dashboard)

**Fonte**: `/api/caixas-perdidas/dashboard` (já mapeado). Campo `valor_total` do resumo mês = card "Perdas" Visão Geral.

**NÃO duplica**: cálculo já existe; Visão Geral só faz fetch do mesmo endpoint e soma `resumo.valor_total`.

### 2.4. Menu Financeiro (index.html L45556)

```
🔒 Financeiro (senha 1234 → sessionStorage fin_ok=1)
├─ 📋 Orçamentos  (go orcamentos)
├─ 💰 Comissões   (go comissoes)
└─ 💸 Central de Custos (go 'central-custos') ← ITEM NOVO, posição 3 APÓS Comissões
```

---

## 3. Estrutura 5 Abas (Confirmado decisão 1)

### 🔥 ABA 1: VISÃO GERAL (tela inicial default)
| Elemento | Especificação |
|---|---|
| **Topo (obrigatório)** | Seletor mês/ano estilo carousel: `← Agosto 2026 | Setembro 2026 | Outubro 2026 →` (3 meses clique rápido + dropdown calendário se clicar no nome) |
| **Todos dados por competência** | Trocar mês recarrega TUDO do mês escolhido; NÃO perde meses anteriores (tudo salvo por `competencia YYYY-MM`) |
| **5 CARDS (exatos do doc)** | 1️⃣ CUSTO TOTAL DO MÊS · 2️⃣ DESPESAS DA FÁBRICA · 3️⃣ CUSTO COM PAPELÃO · 4️⃣ CUSTO DAS OFs · 5️⃣ PERDAS |
| **Comparação vs mês anterior (embaixo de cada card)** | Label subtexto estilo: "Mês anterior R$198.300 · Variação +8,17%" (doc Histórico) |
| **Gráfico** (Chart.js, já carregado no projeto via ensureChartJsLoaded — usado no mapa clientes) | Título: **"PARA ONDE FOI O DINHEIRO?"** · Gráfico de rosca/pizza dividindo Categorias: 1. Papelão/chapas · 2. Folha de pagamento · 3. Energia elétrica · 4. Água · 5. Telefone/Internet · 6. Combustível/Gasolina · 7. Manutenção · 8. Fretes · 9. Insumos · 10. Outros |
| **Interação gráfico** | Clicar numa categoria → filtra aba Lançamentos exibindo só lançamentos dessa categoria |
| **Legend** custo | Badge abaixo do gráfico: 🔵 Automáticos (Papelão + OFs + Perdas) · 🟣 Manuais |

**Fórmulas card ABA 1 (oficial):**
| Card | Como calcular |
|---|---|
| Custo Total Mês | `Custo das OFs (automático) + Custo Papelão (automático) + Perdas (automático) + Soma todos lancamentos_custos DESPESA/CUSTO_FIXO/CUSTO_VARIAVEL da competência` |
| Despesas da Fábrica | `Soma lancamentos_custos manuais da competência (excluindo RECEITA/INVESTIMENTO)` |
| Custo com Papelão | **Automático**: `Soma valor_total movimentações ENTRADA chapas_estoque_v2 (ou v1) no mês da competência` |
| Custo das OFs | **Automático**: `SUM pickCustoOf(ofs) status concluído data_conclusao competencia=X (mesmo endpoint relatorio custos expandido com SUM)` |
| Perdas | **Automático**: `GET /api/caixas-perdidas/dashboard ?competencia → resumo_mes_atual.valor_total` |

---

### 🧾 ABA 2: LANÇAMENTOS

| Item | Especificação |
|---|---|
| Botão topo | `➕ NOVO LANÇAMENTO` → abre modal |
| **Campos modal** (exatos doc): Descrição · Categoria (select fixo 10 categorias gráfico) · Centro de custo (FK centros_custo) · Valor (R$) · Data · Competência (YYYY-MM) · Fornecedor/Beneficiário · Forma de pagamento (Dinheiro/PIX/CC/CTB/Boleto) · Observação · Anexo/comprovante (opcional — URL string, upload via coluna nullable; se upload real demorar, MVP deixa só texto URL do comprovante) |
| CRUD | Editável inline ✅ · Excluível ✅ · Pesquisa livre topo ✅ · Filtros laterais: Categoria, Centro, Fornecedor, Forma pgto, Data início/fim |
| Recorrentes | Botão "🔁 Cadastrar como recorrência" dentro do modal novo. Cria registro `lancamentos_recorrentes`; gerar mês → seed competência com `valor_padrao`; depois **editável individualmente na linha** (regra: NÃO sincroniza de volta pra recorrência; editar recorrência só afeta competências **ainda não geradas** |
| Tag visual | Cada linha mostra badge "Aut/Man" — NÃO mostrar OFs automáticos ou Papelão automático AQUI (só aparecer em Visão Geral consolidado). Aba 2 = só lançamentos MANUAIS. |

---

### 🏢 ABA 3: CENTROS DE CUSTO (catálogo + resumo por setor)
- **Catálogo padrão inicial seed:** Produção · Administrativo · Comercial · Expedição · Estoque · Manutenção · Veículos/Logística
- **CRUD inline** igual Operadores: Nome · Código · Ativo. Criar/editar/desativar
- **CARD no topo da aba**: "Gastos por setor — competência X" → tabela/grid mini cards: cada centro + valor gasto no mês + barra visual % do total + variação vs mês anterior
- Cliquar no centro → filtra Aba Lançamentos

---

### 🧾 ABA 4: CUSTO POR OF (Reaproveita 100% Relatório de Custos Atual — NADA PARALELO)

**Fonte de dados**: `GET /api/relatorios/custos` (expandido com 2 campos novos **retorno JSON aditivo**, NÃO quebra o Relatório de Custos legado, mantém todos os campos originais)

**Colunas tabela exatas doc:**
`OF | Cliente | Venda (R$) | Papelão (R$) (automático já no custo unitário de hoje) | Outros custos (R$) (soma lancamentos_custos vinculados manualmente via of_id) | Custo total (R$) | Resultado (R$) | Margem (%)`

**Fórmulas doc OFICIAL copiadas coladinha:**
```
RESULTADO DA OF = VALOR DA VENDA (ofs.valor_total) − CUSTO REAL (Custo Papelão + Outros)
MARGEM REAL     = RESULTADO DA OF ÷ VALOR DA VENDA × 100
```

**Clicar numa OF → Abre modal detalhes custo (doc pede):**
- Gramatura · Valor/m² (campos já tem hoje no relatorio custos) · Qtd produzida · Chapas utilizadas (col `consumo_chapas_estimado` Fact10 OFS já existe) · Máquinas passadas (já tem today via `passagens_maquina`) · Perdas (OF qtd_perdida + valor perdido). Tudo vindo de fontes já existentes hoje.

---

### 📈 ABA 5: HISTÓRICO COMPARATIVO

| Item | Especificação |
|---|---|
| Título | "Evolução Mensal de Custos" |
| Carregar últimos 12 meses automaticamente | 2025-09 até 2026-09 |
| 4 Cards comparação (estilo doc Set=214k vs Ago=198k var+8,17%) | Custo Total / Custo OFs / Papelão / Despesas Manuais — cada um com: Mês Atual, Mês Anterior, Variação R$, Variação % |
| Tabela histórica 12 meses | Colunas: Mês · Custo Total · Custo OFs · Papelão · Despesas Manuais · Perdas · Resultado (Receita OFs − Custo Total) · Margem% |
| Gráfico evolução (colocar no futuro / MVP opcional) | Linha múltipla (Chart.js). MVP v1 pode ficar só tabela comparativa + 4 cards, gráfico vem como melhoria depois |

---

## 4. Tabelas Novas (3 Tabelas PostgreSQL — Nenhuma duplicação cálculo OF/Papelão/Perdas)

### 4.1. `centros_custo` — Catálogo (Aba3)
```sql
CREATE TABLE IF NOT EXISTS centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NULL,         -- Fact6, NULL = compartilhado todas empresas
  codigo TEXT NOT NULL UNIQUE,  -- ex: "PROD","ADM","COMER","EXP"
  nome TEXT NOT NULL,           -- ex: "Produção","Administrativo","Comercial","Expedição","Estoque","Manutenção","Veículos/Logística"
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  cor_visual TEXT NULL,         -- #HEXA badge visual
  observacoes TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- SEED Inicial (7 setores oficiais do doc):
INSERT INTO centros_custo (codigo, nome, ativo) VALUES
  ('PROD','Produção',TRUE),('ADM','Administrativo',TRUE),('COMER','Comercial',TRUE),
  ('EXP','Expedição',TRUE),('EST','Estoque',TRUE),('MAN','Manutenção',TRUE),('LOG','Veículos/Logística',TRUE)
ON CONFLICT (codigo) DO NOTHING;
```

### 4.2. `lancamentos_custos` — Lançamentos MANUAIS (Aba2)
```sql
CREATE TABLE IF NOT EXISTS lancamentos_custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NULL,                              -- Fact6
  centro_custo_id UUID NULL REFERENCES centros_custo(id) ON DELETE SET NULL,
  competencia TEXT NOT NULL,                         -- YYYY-MM
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL,                           -- 10 categorias gráfico Visão Geral (CHECK constraint)
  natureza TEXT NOT NULL DEFAULT 'DESPESA' CHECK (natureza IN ('RECEITA','DESPESA','CUSTO_FIXO','CUSTO_VARIAVEL','INVESTIMENTO')),
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL DEFAULT 0,
  fornecedor_beneficiario TEXT NULL,
  forma_pagamento TEXT NULL CHECK (forma_pagamento IS NULL OR forma_pagamento IN ('DINHEIRO','PIX','CARTAO_CREDITO','CARTAO_DEBITO','TRANSFERENCIA','BOLETO','CHEQUE','OUTRO')),
  observacao TEXT NULL,
  anexo_url TEXT NULL,                               -- Comprovante URL (MVP)
  of_id UUID NULL REFERENCES ofs(id) ON DELETE SET NULL,
  recorrencia_id UUID NULL,
  usuario_id UUID NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Categorias permitidas (10 categorias oficiais do gráfico PARA ONDE FOI O DINHEIRO?):
ALTER TABLE lancamentos_custos ADD CONSTRAINT lanc_custos_categoria_chk CHECK (
  categoria IN ('PAPELAO','FOLHA_PAGTO','ENERGIA','AGUA','TELEFONE_INTERNET','COMBUSTIVEL','MANUTENCAO','FRETES','INSUMOS','OUTROS')
);
CREATE INDEX IF NOT EXISTS lanc_custos_comp_idx ON lancamentos_custos(competencia);
CREATE INDEX IF NOT EXISTS lanc_custos_cat_idx ON lancamentos_custos(categoria);
CREATE INDEX IF NOT EXISTS lanc_custos_centro_idx ON lancamentos_custos(centro_custo_id);
CREATE INDEX IF NOT EXISTS lanc_custos_emp_idx ON lancamentos_custos(empresa_id);
CREATE INDEX IF NOT EXISTS lanc_custos_of_idx ON lancamentos_custos(of_id);
```

### 4.3. `lancamentos_recorrentes` — Modelo p/ gerar mensal (Aba2)
```sql
CREATE TABLE IF NOT EXISTS lancamentos_recorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NULL,
  centro_custo_id UUID NULL REFERENCES centros_custo(id) ON DELETE SET NULL,
  categoria TEXT NOT NULL REFERENCES lancamentos_custos(categoria) ON UPDATE CASCADE,  -- Mesmas 10 categorias
  natureza TEXT NOT NULL DEFAULT 'DESPESA' CHECK (natureza IN ('RECEITA','DESPESA','CUSTO_FIXO','CUSTO_VARIAVEL','INVESTIMENTO')),
  descricao_padrao TEXT NOT NULL,
  fornecedor_padrao TEXT NULL,
  forma_pagamento_padrao TEXT NULL,
  valor_padrao NUMERIC(15,2) NOT NULL DEFAULT 0,    -- Usado só quando GERAR nova competência
  dia_vencimento SMALLINT NOT NULL DEFAULT 5 CHECK (dia_vencimento BETWEEN 1 AND 31),
  periodicidade TEXT NOT NULL DEFAULT 'MENSAL' CHECK (periodicidade IN ('MENSAL','BIMESTRAL','TRIMESTRAL','SEMESTRAL','ANUAL')),
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NULL,                                -- NULL = contínua
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  observacoes TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lancamentos_custos ADD CONSTRAINT lanc_custos_rec_fk
  FOREIGN KEY (recorrencia_id) REFERENCES lancamentos_recorrentes(id) ON DELETE SET NULL;
```

---

## 5. Arquivos a serem alterados (4 arquivos + 1 novo + 1 migration)

| Arquivo | Alteração |
|---|---|
| **NOVO**: `supabase/migrations/20260914_central_custos.sql` | Migration SQL §4 (3 tabelas + seed + constraints + índices) |
| [server.js](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js) | **9 endpoints novos + expandir 1 existente aditivamente** → detalhado §6 |
| [index.html](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L45562) | (1) Inserir nav-item "💸 Central de Custos" APÓS linha 45562 (💰 Comissões). (2) 2 timestamps bump versão no final rodada. |
| [patch.js](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js) | (1) Dispatcher `patchGo` page=central-custos antes do estoque-tintas L45840. (2) IIFE `__centralCustosModule()` no fim arquivo com `window.renderPageCentralCustos(host)` → 5 abas, CSS clones orçamentos, Chart.js gráfico PARA ONDE FOI O DINHEIRO?, modais novo lancamento / gerar recorrentes / detalhe OF |

---

## 6. Endpoints Backend (server.js) — 9 NOVOS + 1 EXPANDIDO ADITIVO

### Endpoint **EXPANDIDO** (backward compat 100% — NENHUM campo removido)
| Atual | Alteração |
|---|---|
| `GET /api/relatorios/custos` L16390 | **2 campos novos adicionados NO FINAL do JSON:** `+total_custos_consolidado_competencia` (para aba 1 chamar 1 vez só) e `+ofs_completo_para_central` (boolean marker). Mantidas todas colunas rows antigas do relatório. **NÃO altera o cálculo rows[].custo_unitario / .custo_total.** NÃO quebra o modal relatório Custos existente botão Relatórios > Custos. |

### 9 Endpoints NOVOS
| Método | Rota | Função |
|---|---|---|
| GET | `/api/centros-custo` | Lista todos centros_custo, aceita `?ativo=1` ou `?ativo=0` |
| POST | `/api/centros-custo` | Criar centro novo (whitelist campos) |
| PUT | `/api/centros-custo/:id` | Editar centro |
| DELETE | `/api/centros-custo/:id` | Desativar centro (marca ativo=false — NÃO apaga hard) |
| GET | `/api/central-custos/lancamentos` | Lista lancamentos MANUAIS filtros: `?competencia=YYYY-MM` `?categoria=` `?centro_custo_id=` `?fornecedor=` `?emp_id=` `?q=` (busca descrição/obs), paginação |
| POST | `/api/central-custos/lancamentos` | Criar lançamento manual (whitelist CENTROS) |
| PUT | `/api/central-custos/lancamentos/:id` | Editar (confirma regra: alteração em linha já gerada NÃO sincroniza recorrencia_id |
| DELETE | `/api/central-custos/lancamentos/:id` | Apagar lançamento |
| POST | `/api/central-custos/recorrentes/gerar-mes` | Body: `{ competencia: "YYYY-MM" }` → Lê `lancamentos_recorrentes` ativos e que periodicidade cai nessa competência. Para cada: verifica se já existe linha em `lancamentos_custos WHERE competencia=X AND recorrencia_id=Y`. Se existir → PULA (idempotente). Se não existir → INSERE com valor_padrao, dia_vencimento → data_lancamento = primeiro dia mês. Retorna JSON `{criados: N, pulados: M, ids: [...]}`. |
| GET | `/api/central-custos/visao-geral` | **Principal da ABA1.** Body query string `?competencia=YYYY-MM&emp_id=ALL`. Retorna: `{cards_5:{...}, variacoes_vs_mes_anterior:{...}, grafico_categorias:[{label:"Papelão", valor:X}, ...{10 itens}], mes_anterior:[{mes:YYYY-MM-1, cards_5:...}], resumo_automáticos_vs_manuais:{auto:R$, manual:R$}}`. Internamente: chama helper `pickCustoOf()` → soma OFs, busca chapas_estoque_v2 mês, busca /caixas-perdidas/dashboard mês, busca SUM lancamentos_manuais. |
| GET | `/api/central-custos/historico` | **ABA5.** Retorna últimos 12 meses. JSON `{ meses: [ { mes, custo_total, custo_ofs, papelao, despesas_manuais, perdas, receita_ofs, resultado_liq, margem_pct }, ...12x ] }`. |
| GET/POST/PUT/DELETE | `/api/central-custos/recorrentes` | CRUD recorrências (usado na hora de cadastrar modelo). |

Total: 11 rotas (1 expandido + 10 novos).

---

## 7. Ordem de implementação (dependência)

1. **Migration SQL aplicada** → `supabase_apply_migration`
2. **Whitelist no server.js**: `CENTROS_CUSTO_WHITELIST`, `LANCAMENTOS_CUSTOS_WHITELIST`, `RECORRENTES_WHITELIST` (mesma blindagem de `PASSAGENS_MAQUINA_WHITELIST` L11498 — colunas proibidas são deletadas antes de insert/update)
3. **Extrair helper `pickCustoOf()` do escopo AA3 para escopo módulo-level** → reutilizar tanto endpoint de visão geral quanto mantém original L14408 funcionando
4. **Implementar os 11 endpoints server.js** na ordem:
   - CRUD centros-custo (simples)
   - CRUD lançamentos manuais (whitelist)
   - CRUD recorrentes
   - Action gerar-mes recorrente
   - Expandir `/api/relatorios/custos` com os 2 campos novos (aditivo, nada quebra)
   - `/visao-geral` → calcula 5 cards, compara mês anterior, monta 10 categorias gráfico
   - `/historico` → últimos 12 meses
5. **Frontend index.html**: nav-item menu Financeiro
6. **Frontend patch.js**:
   - Dispatcher page=central-custos
   - IIFE `__centralCustosModule()` no fim do arquivo:
     - 5 abas strip estilo orc-pastas-strip
     - Componentes reutilitários de fetch token + JWT (iguais Operadores)
     - Abas 1→5 uma por uma
     - CSS classes prefixo `#page-central-custos` + clone exato do padrão visual orçamentos (hero gradient cards, tables)
     - Modal novo lançamento · Modal gerar recorrentes · Modal detalhe OF
7. **Gates obrigatórios**:
   - `node --check server.js` → exit=0
   - `node --check patch.js` → exit=0
   - `node --check sw.js` → exit=0
   - `git diff --stat` → previsto ~1.800 a 2.200 linhas (feature GRANDE). Se passar de 2.500 → parar e comunicar.
   - 5 bumps versão timestamp (server.js, sw.js, index.html ×2)
   - Commit + push origin main Railway
   - Poll `/api/version` confirma deploy patch = novo timestamp

---

## 8. Validação Checklist pós implementação

| Nº | Item | Como testar |
|---|---|---|
| V1 | Migration Aplicou 3 tabelas | `supabase_get_tables public` → `centros_custo`, `lancamentos_custos`, `lancamentos_recorrentes` existem |
| V2 | Seed 7 setores existem | SQL: `SELECT codigo,nome FROM centros_custo ORDER BY codigo` → 7 rows |
| V3 | Nav Menu Financeiro 3 itens | Login, senha 1234, abre grupo → mostra Orçamentos · Comissões · Central de Custos, clique abre página |
| V4 | Aba1 default Visão Geral | Carrega Setembro/2026. 5 cards aparecem. Comparação vs mês anterior Agosto mostra valor e % |
| V5 | Gráfico 10 categorias aparece | Clica categoria Papelão → aba Lançamentos automaticamente filtrada |
| V6 | Cálculo Custo das OFs = Relatório antigo | Abre Relatórios > Custos mesmo período set/26, soma custo_total, confere igual card 4 da aba1 (100%) |
| V7 | Cria lançamento manual (ex: Aluguel R$5.000 ADM) | Cria → salva → Volta Visão Geral card DESPESAS DA FÁBRICA somou R$5.000, gráfico categoria OUTROS/ALUGUEL aparece, card Custo Total Mês soma R$5.000 |
| V8 | Recorrência idempotente | Cria recorrência Aluguel R$5.000 MENSAL. Clica "Gerar mês 2026-09" → retorna criados=1. Clica NOVAMENTE gerar mesmo mês → retorna criados=0, pulados=1 (não duplica). Edita valor da linha gerada pra R$5.200, salva. Edita recorrencia.valor_padrao → R$5.300, salva. A linha gerada em 09 CONTINUA 5.200 (não retroage). Gera mês 2026-10 → novo valor R$5.300 aparece. |
| V9 | Aba4 Custo por OF exatos | Colunas OF, Cliente, Venda, Papelão, Outros custos, Custo Total, Resultado, Margem. Formula: Venda - Custo = Resultado; Resultado/Venda ×100 = Margem; igual doc |
| V10 | Aba5 Histórico Comparativo | Mostra 12 meses atrás, 4 cards comparação (Atual vs Anterior R$ + var%) + tabela 8 colunas |
| V11 | Navegação SPA troca rota → fecha modais (regra hard) | Abre modal "Novo Lançamento", clica no menu em Orçamentos → modal desaparece antes de navegar (regra Fact: fechar modais ao trocar de rota) |
| V12 | Relatório Custos LEGADO funciona | Botão Relatórios > Custos abre 100% igual de antes (não quebrou com a expansão aditiva do endpoint) |

---

## 9. Riscos e Mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Diff stat > 2.200L | Comunicação prévia | Feature gigante (5 abas completas, 3 tabelas, 11 endpoints, gráfico, modais, CRUD, comparação mês, histórico 12m). Se passar de 2.500 linhas → paro e comunico ANTES de commit, como regra Fact3 |
| Endpoint /api/relatorios/custos quebrar modal antigo | ALTO | Expansão ESTRITAMENTE ADITIVA. NENHUM campo existente é deletado, renomeado ou tem valor alterado. Só campos novos no final. Após implementação, teste V12 é obrigatório. |
| Monitoramento preço chapas não tem data_recebimento | Médio | Migration adiciona coluna `chapas_estoque_v2.data_recebimento DATE NULL` via ALTER TABLE. Se for NULL, fallback: `created_at::date` |
| `pickCustoOf()` helper mover escopo quebrar AA3 | Médio | Criar **uma cópia nomeada** em escopo módulo-level `_ccustosPickCustoOf()` que é idêntica ao pickCustoOf de hoje. Chamar essa cópia nos endpoints da Central, manter o original intocado na AA3. Assim a alteração da Central não toca no código existente. |
| Recorrência duplicar lançamento por clique duplo | Médio | (1) Idempotência SQL garante mesmo rodando 10x não duplica (verifica antes). (2) Frontend desabilita botão + loading state por 3s. |
| Chart.js não carregar no gráfico ABA1 | Baixo | Função `ensureChartJsLoaded()` já existe no código e é usada em Mapa de Clientes L42452. Reutilizar a mesma, esperar Promise OK antes de inicializar gráfico. |

---

**✅ Plano pronto para REVISÃO e APROVAÇÃO.** Após sua confirmação "pode implementar", executo a ordem §7 do STEP1 (migration) até deploy Railway.
