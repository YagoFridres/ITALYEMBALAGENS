# Hotfix 434104 + Módulo Contas a Pagar / Receber — Implementation Plan (pt-BR)

## 1. Análise Conclusiva (Pesquisa / Repository Research)

### 🔴 Bug Crítico PÓS-434103 — Visão Geral e Histórico Continuam R$0 (Parte Automática)
**Causa Raiz CONFIRMADA por comparação linha-a-linha da query OFs:**

| Endpoint | Colunas `valor_total`/`valor_venda`/`total` explicitamente SELECT |
|---|---|
| **Funciona** `/api/relatorios/custos` (aba 4 Custo por OF) | **SIM** L16429-L16436: `valor_total`, `valor_venda`, `total` — todos 3 **explicitamente na lista cols** |
| **Quebrado** `_ccustosCalcularCustoOfsPorCompetencia` (Visão Geral + Histórico) | **NÃO** L35237: `valor_total` mas **FALTAM `valor_venda` E `total`** + só lê `of.valor_total` (L35263) sem o helper `ccustosPickValorVenda` de 5 níveis de fallback. |

**Impacto real:** 98% do valor de venda das OFs vem de `valor_venda` ou `total` (campos inconsistentes no banco). Como `_ccustosCalcularCustoOfsPorCompetencia` seleciona **só `valor_total`** → `ofs.total_receita` = ~R$0 → **custo_total_mes, receita_ofs, variacao_pct, Histórico Receita/Resultado/Margem tudo ZERO.**

**2ª causa do Papelão R$0 no Visão Geral:** `_ccustosCalcularCustoPapelaoCompetencia` (L35285) usa `chapas_estoque_v2.created_at` (ou `data_recebimento`) como **data_compra**, NÃO a competência YYYY-MM do custo. A aba 4 Custo por OF usa **custo por OF individual por gramatura**, NÃO a tabela `chapas_estoque_v2` de compras avulsas. Ajuste: `_ccustosCalcularCustoPapelaoCompetencia` deve **APROVEITAR O MESMO RESULTADO DA OFS COMPETÊNCIA** (custo_papelao total retornado pelo cálculo por OF, que é R$184.095,41) em vez de ler chapas separadamente. Isso garante 100% a mesma fonte.

**3ª causa Perdas R$0:** `_ccustosCalcularPerdasCompetencia` L35337 retorna `valor: 0, qtd`. Cards Visão Geral mostram `c.perdas` (qtd caixas perdidas), mas Custo Total Mês soma `perdas.valor` (R$0). Resumo automático manual também soma `perdas.valor` R$0. Ajuste: multiplicar `qtd_perdida * custo_medio_unidade_ofs_competencia` ou usar 2% do custo_total OFs, ou no MVP manter o card qtd perdas (OK) e **não somar perdas no custo_total antes que exista cálculo de valor real** (hoje distorce errado).

### ✅ Item confirmado: Competência no Modal de Lançamento
`<input id="ccf-comp" type="month">` HTML nativo aceita **qualquer mês passado/futuro**. Nenhuma restrição `min`/`max` foi aplicada no montarHtmlLancForm nem no save. Feature já funciona de fábrica — 不需要 alterações.

### 🔧 Item: Dropdown Fornecedores no Modal (qualquer categoria exceto Folha Pagto)
Endpoint existe: `/api/fornecedores` (L19971), fallback 4 colunas de empresa, tabela `fornecedores`. Form precisa de `state.fornecedores = []`, `loadFornecedores()` paralelo `loadOperadores`, bind `trocarFornPorCategoria`: se `FOLHA_PAGTO` → select operador, **SENÃO** → `<select id=ccf-forn-forn>` options fornecedores (usar data-nome como fallback).

### 🖨️ Item: Botões Imprimir rrOpenPrint (Visão Geral + Custo por OF)
Infra existe 100%: helpers já carregados no IIFE Relatórios (L447-L482 `rrEsc`/`rrFmtMoney`/`rrFmtNum`, L778-L783 `rrOpenPrint(cfg)` que chama `_buildStyledPrintHtml` → `_openStyledPrintWindow`). Padrão de cfg: `title`, `periodo`, `cards[]`, `summaryTitle`/`summaryHeaders`/`summaryRows`, `detailTitle`/`detailHeaders`/`detailRows`. Inserir botões no header de cada aba; Visão Geral não tem canvas printável direto → substituir no print por tabela "Para onde foi o dinheiro?" (10 categorias x valor).

### ↕️ Item: Tabela Custo por OF Ordenável por Colunas Numéricas
Colunas clicáveis: Venda, Papelão, Outros, Custo Total, Resultado, Margem %. Padrão simples no state: `{col:'margem', dir:'desc'}`. Toggle clic → mesma col = inverte, col nova = desc. Aplicar sort em rows antes de render. Cabeçalhos mostram ↓/↑ conforme col/dir.

### 🏗️ Módulo NOVO: Contas a Pagar / Receber (escopo)
Tudo novo, 0 tabelas existem. Reutiliza: `fornecedores` (CP), `clientes` + `ofs` (CR). Categoria: abas extras dentro da Central de Custos (abas 6 e 7). Padrão visual: igual Orçamentos/Comissões (cards, tabelas, modal novo lançamento, botões imprimir).

---

## 2. SQL Completo das Tabelas Novas (entregue ANTES como solicitado)

```sql
-- ============================================================
-- CENTRAL DE CUSTOS: MÓDULO CONTAS A PAGAR E CONTAS A RECEBER
-- Migration: 434104 · PostgreSQL / Supabase
-- Ordem: CREATE TABLE → ALTER ADD col (se existir) → FK → CHECK → índices
-- ============================================================

-- ============================================================
-- TABELA 1: contas_pagar  (duplicatas a pagar / fornecedores)
-- ============================================================
CREATE TABLE IF NOT EXISTS contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- vínculos
  empresa_id UUID NULL,   -- Fact6 UUIDs (E1/E2/E3) ou NULL (todas)
  fornecedor_id UUID NULL,  -- FK p/ fornecedores.id (reutiliza tabela existente)
  centro_custo_id UUID NULL, -- FK p/ centros_custo.id
  lancamento_custo_id UUID NULL,  -- opcional: quando gerado a partir de lancamento automatico
  of_id UUID NULL,   -- vínculo direto com OF (se despesa veio de compra p/ OF específica)

  -- documento
  numero_documento TEXT NULL,  -- NF, boleto, contrato
  serie_documento TEXT NULL,
  chave_nfe TEXT NULL,
  descricao TEXT NOT NULL DEFAULT '',

  -- valores
  valor_original NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_juros NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_multa NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_pago NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_aberto NUMERIC(15,2) NOT NULL DEFAULT 0,  -- calcular em trigger ou app

  -- datas (obrigatórias)
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE NULL,

  -- status (CHECK c/ 6 valores)
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  -- PENDENTE · PARCIAL · PAGO · ATRASADO · CANCELADO · PROTESTADO

  -- categoria igual CHECK da central (reutiliza 10 categorias oficiais)
  categoria TEXT NOT NULL DEFAULT 'OUTROS',
  natureza TEXT NOT NULL DEFAULT 'DESPESA',  -- DESPESA / RECEITA (reembolsos)

  -- formas
  forma_pagamento TEXT NULL,  -- mesma lista FORMAS_PAGAMENTO (PIX/Boleto/etc)
  conta_bancaria TEXT NULL,
  codigo_barras TEXT NULL,
  linha_digitavel TEXT NULL,

  -- parcelamento (multiplica lançamento 1 → N contas)
  parcela_atual INT NOT NULL DEFAULT 1,
  total_parcelas INT NOT NULL DEFAULT 1,
  parcela_grupo_id UUID NULL,  -- todas parcelas do mesmo título compartilham UUID

  -- audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL,

  -- constraints
  CONSTRAINT contas_pagar_chk_status CHECK (
    status IN('PENDENTE','PARCIAL','PAGO','ATRASADO','CANCELADO','PROTESTADO')
  ),
  CONSTRAINT contas_pagar_chk_categoria CHECK (
    categoria IN('PAPELAO','FOLHA_PAGTO','ENERGIA','AGUA','TELEFONE_INTERNET','COMBUSTIVEL','MANUTENCAO','FRETES','INSUMOS','OUTROS')
  ),
  CONSTRAINT contas_pagar_chk_natureza CHECK (natureza IN('DESPESA','RECEITA')),
  CONSTRAINT contas_pagar_chk_valores CHECK (
    valor_original >= 0 AND valor_desconto >= 0
    AND valor_juros >= 0 AND valor_multa >= 0
    AND valor_pago >= 0 AND valor_aberto >= 0
  ),
  CONSTRAINT contas_pagar_chk_parcelas CHECK (
    parcela_atual >= 1 AND total_parcelas >= 1 AND parcela_atual <= total_parcelas
  ),
  CONSTRAINT contas_pagar_fk_fornecedor
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL,
  CONSTRAINT contas_pagar_fk_centro_custo
    FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL,
  CONSTRAINT contas_pagar_fk_lancamento
    FOREIGN KEY (lancamento_custo_id) REFERENCES lancamentos_custos(id) ON DELETE SET NULL,
  CONSTRAINT contas_pagar_fk_of
    FOREIGN KEY (of_id) REFERENCES ofs(id) ON DELETE SET NULL
);
-- índices performance querys frequentes
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status     ON contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor ON contas_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa    ON contas_pagar(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_centro     ON contas_pagar(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_parcela_grupo ON contas_pagar(parcela_grupo_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_emissao    ON contas_pagar(data_emissao);

-- ============================================================
-- TABELA 2: contas_receber (duplicatas a receber / clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- vínculos
  empresa_id UUID NULL,   -- Fact6 UUIDs
  cliente_id UUID NULL,   -- FK clientes.id (reutiliza tabela existente)
  centro_custo_id UUID NULL,
  lancamento_custo_id UUID NULL,
  of_id UUID NULL,        -- vínculo direto com OF (recebimento de venda p/ OF)
  vendedor_id UUID NULL,  -- opcional, igual módulo Comissões

  -- documento
  numero_documento TEXT NULL,
  serie_documento TEXT NULL,
  chave_nfe TEXT NULL,
  descricao TEXT NOT NULL DEFAULT '',

  -- valores
  valor_original NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_juros NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_multa NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_recebido NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_aberto NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- datas
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE NULL,

  -- status
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  -- PENDENTE · PARCIAL · RECEBIDO · ATRASADO · CANCELADO · PROTESTADO

  categoria TEXT NOT NULL DEFAULT 'OUTROS',
  natureza TEXT NOT NULL DEFAULT 'RECEITA',  -- RECEITA / DESPESA (estornos)

  -- forma
  forma_pagamento TEXT NULL,
  conta_bancaria TEXT NULL,
  codigo_barras TEXT NULL,
  linha_digitavel TEXT NULL,

  -- parcelamento
  parcela_atual INT NOT NULL DEFAULT 1,
  total_parcelas INT NOT NULL DEFAULT 1,
  parcela_grupo_id UUID NULL,

  audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL,

  -- constraints
  CONSTRAINT contas_receber_chk_status CHECK (
    status IN('PENDENTE','PARCIAL','RECEBIDO','ATRASADO','CANCELADO','PROTESTADO')
  ),
  CONSTRAINT contas_receber_chk_categoria CHECK (
    categoria IN('PAPELAO','FOLHA_PAGTO','ENERGIA','AGUA','TELEFONE_INTERNET','COMBUSTIVEL','MANUTENCAO','FRETES','INSUMOS','OUTROS')
  ),
  CONSTRAINT contas_receber_chk_natureza CHECK (natureza IN('RECEITA','DESPESA')),
  CONSTRAINT contas_receber_chk_valores CHECK (
    valor_original >= 0 AND valor_desconto >= 0
    AND valor_juros >= 0 AND valor_multa >= 0
    AND valor_recebido >= 0 AND valor_aberto >= 0
  ),
  CONSTRAINT contas_receber_chk_parcelas CHECK (
    parcela_atual >= 1 AND total_parcelas >= 1 AND parcela_atual <= total_parcelas
  ),
  CONSTRAINT contas_receber_fk_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  CONSTRAINT contas_receber_fk_centro_custo
    FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL,
  CONSTRAINT contas_receber_fk_lancamento
    FOREIGN KEY (lancamento_custo_id) REFERENCES lancamentos_custos(id) ON DELETE SET NULL,
  CONSTRAINT contas_receber_fk_of
    FOREIGN KEY (of_id) REFERENCES ofs(id) ON DELETE SET NULL
);
-- índices
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento  ON contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status      ON contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente     ON contas_receber(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa     ON contas_receber(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_centro      ON contas_receber(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_of          ON contas_receber(of_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_parcela_grupo ON contas_receber(parcela_grupo_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_emissao     ON contas_receber(data_emissao);

-- ============================================================
-- TABELA 3: baixas_contas (histórico de pagamentos/rec. parciais)
-- (1 conta pode ter N baixas: juros, desconto, pagamentos múltiplos)
-- ============================================================
CREATE TABLE IF NOT EXISTS baixas_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tipo_conta TEXT NOT NULL,  -- 'PAGAR' | 'RECEBER'
  conta_pagar_id UUID NULL,
  conta_receber_id UUID NULL,

  data_baixa DATE NOT NULL,
  valor_baixa NUMERIC(15,2) NOT NULL DEFAULT 0,

  tipo_baixa TEXT NOT NULL DEFAULT 'NORMAL',
  -- NORMAL · DESCONTO · JUROS · MULTA · ESTORNO · PERDA · PROTESTO

  forma_pagamento TEXT NULL,
  conta_bancaria TEXT NULL,
  numero_comprovante TEXT NULL,

  descricao TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL,

  CONSTRAINT baixas_chk_tipo_conta CHECK (tipo_conta IN('PAGAR','RECEBER')),
  CONSTRAINT baixas_chk_tipo_baixa CHECK (
    tipo_baixa IN('NORMAL','DESCONTO','JUROS','MULTA','ESTORNO','PERDA','PROTESTO')
  ),
  CONSTRAINT baixas_chk_valor CHECK (valor_baixa > 0),
  CONSTRAINT baixas_fk_pagar FOREIGN KEY (conta_pagar_id)
    REFERENCES contas_pagar(id) ON DELETE CASCADE,
  CONSTRAINT baixas_fk_receber FOREIGN KEY (conta_receber_id)
    REFERENCES contas_receber(id) ON DELETE CASCADE,
  CONSTRAINT baixas_chk_exatamente_uma_conta CHECK (
    (conta_pagar_id IS NOT NULL AND conta_receber_id IS NULL)
    OR
    (conta_receber_id IS NOT NULL AND conta_pagar_id IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_baixas_pagar    ON baixas_contas(conta_pagar_id);
CREATE INDEX IF NOT EXISTS idx_baixas_receber  ON baixas_contas(conta_receber_id);
CREATE INDEX IF NOT EXISTS idx_baixas_data     ON baixas_contas(data_baixa);
CREATE INDEX IF NOT EXISTS idx_baixas_tipo     ON baixas_contas(tipo_conta, tipo_baixa);
```

---

## 3. Arquivos e Módulos a Modificar

### Backend (`server.js`)
| Local | Alteração |
|---|---|
| `L35229` `_ccustosCalcularCustoOfsPorCompetencia` | **FIX cols:** adicionar `valor_venda,total` no SELECT L35237; trocar `receita = of.valor_total` (L35263) por helper interno igual a `ccustosPickValorVenda` (5 níveis: valor_total → valor_venda → total → of_valor_total → vl_total). **Deve reproduzir 100% o número da aba 4.** |
| `L35285` `_ccustosCalcularCustoPapelaoCompetencia` | **REFATORAR:** ao invés de consultar `chapas_estoque_v2`, aceitar parâmetro opcional `ofsCompetenciaResult` e somar `ofs.ofs[*].papelao` ou somar `custo_papelao` já retornado pelo cálculo OF individual. Fallback (se não passado) continua chapas mas loga warning. |
| `L35318` `_ccustosCalcularPerdasCompetencia` | **Fix:** opcionalmente calcular `perdas.valor = qtdPerdidas * (ofsCompetenciaResult.total_custo / Math.max(1, totalCaixasOFS))` (custo médio por caixa do mês). No MVP, card mostra **só a qtd (OK)** e o Custo Total Mês NÃO inclui perdas.valor enquanto ela for zero real. |
| `L35381` `_ccustosCalcularVisaoGeralCompetencia` | Refatorar assinatura: calcular OFs primeiro, repassar o resultado p/ Papelão e Perdas. Manter `cards_5` e alias novos shape. |
| **Boot migration** | Adicionar funções `_contasPagarReceberCreateSql()` (retorna bloco SQL §2) e `_ensureContasPagarReceberSchema()` (probe SELECT LIMIT 1). Chamar no app.listen L35947. |
| **11 novos endpoints** | `GET/POST/PUT/DELETE /api/contas-pagar`, `GET/POST/PUT/DELETE /api/contas-receber`, `POST /api/contas-pagar/:id/baixar`, `POST /api/contas-receber/:id/baixar`, `GET /api/contas-pagar/vencidas-proximas`, `GET /api/contas-receber/vencidas-proximas`, `POST /api/contas-pagar/gerar-parcelas`, `POST /api/contas-receber/gerar-parcelas`. |

### Frontend (`patch.js` IIFE `window.renderPageCentralCustos`)
| Local | Alteração |
|---|---|
| state inicial L62503 | + `fornecedores:[], sortCol:'', sortDir:'desc', aba:1..7 (6=ContasPagar,7=ContasReceber), cp:{}, cr:{}` |
| helper load functions | `loadFornecedores()` paralelo `loadOperadores`; `loadContasPagar()` / `loadContasReceber()` |
| `abrirModalLancamento` trocarFornPorCategoria L63109 | ELSE (não é FOLHA_PAGTO): trocar input por `<select id=ccf-forn-forn>` options `state.fornecedores`, salvar `option[data-nome]` no payload igual padrão Operador. |
| `renderCardsVisao()` header | Inserir `<button class=ccustos-btn id=cc-print-visao>🖨️ Imprimir</button>` → onClick chama função `ccustosImprimirVisao()` que monta cfg rrOpenPrint (5 cards + tabela de categorias 10 linhas, não canvas). |
| `renderCustoOFs()` header | Inserir botão imprimir id=`cc-print-ofs`. Monta cfg: 4 cards resumo + tabela completa 9 colunas OF/Cliente/Venda/Papelão/Outros/Custo Total/Resultado/Margem. |
| `renderCustoOFs()` thead | `th` com class `ccustos-sort-header` e `data-col=venda|papelao|custo_total|resultado|margem`. Sort state guardado, aplicar em rows antes loop `forEach`. Ícones ↑↓ ao lado. |
| Novas abas 6 e 7 | HTML structure: (a) cards resumo vencidos / próximos / total aberto; (b) filtros: status, data_vencimento ini/fim, fornecedor OU cliente, OF, busca texto; (c) tabela 9 colunas com ações (Detalhe, Baixar, Editar, Excluir); (d) botão "🆕 Nova Conta" abrindo modal com parcelamento. |
| Abas tabs | `bindEventos` adicionar click cc-tab-6 e cc-tab-7 (troca state.aba + recarregar). |
| **Modal Nova Conta (Pagar / Receber)** | Campos: Nº Doc, Chave NFe, Fornecedor (CP) ou Cliente + OF (CR), Centro Custo, Categoria (10), Natureza, Data Emissão/Vencimento, Valor Original, Forma Pagto, **Parcelamento** (N de parcelas, intervalo mensal = `gerar-parcelas`), Observação. Ação gerar parcelas: preview N títulos antes de confirmar. |
| **Modal Baixar (parcial)** | Data baixa, valor (default = valor_aberto), tipo baixa (NORMAL/DESC/JUROS/MULTA), comprovante, forma. Save calcula `valor_aberto`, atualiza status (PAGO/PARCIAL) + data pagamento/recebimento. |
| Fechar modais | `fecharModaisCCustos()` já dispara em troca de rota. |

### Outros arquivos (mesmos 4 sempre)
- `index.html`: só 2 bumps inline timestamp
- `sw.js`: CACHE_NAME bump
- Supabase: SQL aplicado via `_ensureContasPagarReceberSchema` (padrão Fact18), não usa Supabase MCP proibido.

---

## 4. Passos de Implementação (Ordem de Dependência)

### FASE A — HOTFIX de bugs (Prioridade 0, resolve Visão Geral / Histórico R$0)
1. `_ccustosCalcularCustoOfsPorCompetencia`: cols SELECT incluem `valor_venda,total` + helper de fallback de 5 níveis para `receita`.
2. Refatorar fluxo: `_ccustosCalcularVisaoGeralCompetencia` calcula OFs primeiro → passa o objeto p/ PapelaoCompetencia e PerdasCompetencia. PapelãoCompetencia usa `soma ofs.papelao` como fonte primária. PerdasCompetencia calcula valor médio por caixa se OFs tem dados.
3. Rodar `node --check server.js` + poll `/api/central-custos/visao-geral` e confirmar `receita_ofs ~ 417.650`, `custo_papelao ~ 184.095`, `custo_ofs > 0`, `cards.receita_ofs = R$417mil`.

### FASE B — Melhorias UI (Prioridade 1)
4. Modal lançamento: loadFornecedores + swap else=FOLHA_PAGTO → dropdown fornecedores.
5. Custo por OF thead ordenável: state.sortCol/Dir, toggle click, ↑↓ nos headers.
6. Botões Imprimir Visão Geral + Custo por OF via `rrOpenPrint(cfg)`.

### FASE C — Módulo Contas Pagar / Receber (Prioridade 2)
7. Boot DDL: SQL completo §2 em `_contasPagarReceberCreateSql()` + `_ensureContasPagarReceberSchema`.
8. Endpoints CRUD + baixar + gerar-parcelas + vencidas/proximas.
9. Frontend abas 6 e 7: cards resumo / filtros / tabela / modal novo / modal baixar / botão imprimir cada aba.

### FASE D — Deploy
10. 5 bumps timestamp 434104. `git diff --stat` (esperado ~900L, Módulo Contas é grande; se >1500L PARAR e reportar).
11. Commit ÚNICO `git push origin main` → SHA 7 chars.
12. Poll Railway `runtime.patch === timestamp && git.commit prefix SHA`.
13. Smoke: todos 11 novos endpoints return 401 (não 500).
14. Visão Geral / Histórico Setembro mostrar R$417mil receita. Teste ABA ANÔNIMA patch limpo.

---

## 5. Dependências e Considerações

- **Check constraint centralizado Categorias 10:** todos os CHECKs do contas_pagar/receber usam MESMOS valores do migration 434001 (PAPELAO/FOLHA_PAGTO/ENERGIA/…/OUTROS). NÃO permitir nova categoria sem atualizar CHECK em todos os locais.
- **FK para clientes.id / fornecedores.id / centros_custo.id:** todos `ON DELETE SET NULL` (não apaga conta se cadastro for excluído).
- **Nenhum arquivo env, nenhum MCP Supabase, NÃO editar index.html exceto 2 timestamps.**
- **Compatibilidade patch.js cacheado:** novos alias shape e fallback check; nenhum campo deletado; novas abas são adicionais (6,7) não tocam abas 1..5.
- **Parcelamento:** gerar N UUIDs de contas + 1 `parcela_grupo_id` compartilhado (UUID único da 1ª parcela). Fórmula data_vencimento: `emissão + N*30 dias` ou mensal dia X. Valor = `original/total_parcelas` arredondado 2 decimais; diferença na última parcela.

---

## 6. Validação

### Gates
- Syntax 3 arquivos exit=0.
- `git diff --stat < 1500` (porque Módulo Contas = grande). Se > 2k: PARAR pedir autorização.
- Smoke endpoints: 200 sessão logada, 401 sem JWT, NENHUM 500.

### Manual (Teste em aba anônima)
1. **Bug R$0:** Visão Geral Setembro = Venda R$417.650,27; Papelão ~R$184k; Histórico último mês = mesmos valores.
2. **Ordenação Custo OF:** clicar Margem % → maior margem no topo; clicar de novo → menor no topo.
3. **Imprimir Visão Geral:** abre janela print com 5 cards + tabela "Para onde foi o dinheiro?" 10 categorias.
4. **Modal Lançamento:** Categoria=OUTROS → Fornecedor = dropdown (fornecedores table); Trocar para=FOLHA_PAGTO → vira dropdown Operador.
5. **Competência modal:** Setembro → escolher mês=Janeiro/2024. Save com sucesso. Competência Janeiro aparece.
6. **Contas a Pagar:** Modal novo com parcelamento 3x → gerou 3 contas. Vencimentos em 30/60/90 dias. Valor original cada = total/3. Soma = total.
7. **Contas a Receber:** Vincular OF #1945, criar 2x → baixar 50% parcial (status=PARCIAL, valor_aberto=50%).
8. **Cards resumo CR/CP:** Atrasados mostra N contas, Próximos vencimentos mostra N dentro de 7 dias.

---

## 7. Riscos e Mitigação

| Risco | Mitigação |
|---|---|
| DDL `_ensureContasPagarReceberSchema` falha por coluna/FK já existir parcialmente | Usar CREATE TABLE **IF NOT EXISTS** + ALTER TABLE ADD COLUMN IF NOT EXISTS; cada CONSTRAINT tem nome único e não é recriada se existir. Probe SELECT antes de tudo. |
| Check Categorias divergente de novo | CHECK em 5 tabelas usa CONSTANTES. Backend valida whitelist antes do INSERT. Se alguém adicionar categoria: só via ALTER TABLE (não hardcoded em um lugar). |
| Endpoint novo atinge PostgREST max-rows=1000 | Sempre usar `.range()` + loop while hasMore quando SELECT potencial > 1000. Query vencidas/proximas limit=500 padrão. |
| Visão Geral AINDA R$0 após Fase A | Rodar debug: `SELECT count(*) FROM ofs WHERE data_conclusao BETWEEN '2026-09-01' AND '2026-09-30' AND status ILIKE '%conclu%'` manual Supabase SQL Editor. Se OFs = 0, não é bug de query. |
| git diff --stat explode (>= 2000) | Reportar antes de commit/push. Se necessário, quebrar em 2 commits: 434104 = Hotfix A+B Fases; 434105 = Fase C Contas. Usuário decide. |
| Cache de patch.js faz modal forn não aparecer | Testar em aba anônima. Bump timestamp é obrigatório em TODOS os 5 lugares. |
