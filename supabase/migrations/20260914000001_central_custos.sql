-- =====================================================================
-- CENTRAL DE CUSTOS — Migration SQL
-- Data: 2026-09-14
-- 3 tabelas novas + seed 7 centros padrão + constraint CHECK 10 categorias
-- Adiciona também coluna chapas_estoque_v2.data_recebimento (fallback)
-- =====================================================================

-- ---------------------------------------------------------------
-- TABELA 1: centros_custo (catálogo setores)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NULL,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  cor_visual TEXT NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS centros_custo_codigo_unq ON centros_custo (codigo);
CREATE INDEX IF NOT EXISTS centros_custo_empresa_idx ON centros_custo(empresa_id);
CREATE INDEX IF NOT EXISTS centros_custo_ativo_idx ON centros_custo(ativo);

-- Seed 7 setores oficiais do documento do usuário
INSERT INTO centros_custo (codigo, nome, ativo) VALUES
  ('PROD',  'Produção',             TRUE),
  ('ADM',   'Administrativo',       TRUE),
  ('COMER', 'Comercial',            TRUE),
  ('EXP',   'Expedição',            TRUE),
  ('EST',   'Estoque',              TRUE),
  ('MAN',   'Manutenção',           TRUE),
  ('LOG',   'Veículos/Logística',   TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- ---------------------------------------------------------------
-- TABELA 2: lancamentos_custos (despesas/receitas manuais lançadas)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lancamentos_custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NULL,
  centro_custo_id UUID NULL REFERENCES centros_custo(id) ON DELETE SET NULL,
  competencia TEXT NOT NULL,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL,
  natureza TEXT NOT NULL DEFAULT 'DESPESA',
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL DEFAULT 0,
  fornecedor_beneficiario TEXT NULL,
  forma_pagamento TEXT NULL,
  observacao TEXT NULL,
  anexo_url TEXT NULL,
  of_id UUID NULL REFERENCES ofs(id) ON DELETE SET NULL,
  recorrencia_id UUID NULL,
  usuario_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lancamentos_custos DROP CONSTRAINT IF EXISTS lanc_custos_natureza_chk;
ALTER TABLE lancamentos_custos ADD CONSTRAINT lanc_custos_natureza_chk CHECK (
  natureza IN ('RECEITA','DESPESA','CUSTO_FIXO','CUSTO_VARIAVEL','INVESTIMENTO')
);

ALTER TABLE lancamentos_custos DROP CONSTRAINT IF EXISTS lanc_custos_forma_pgto_chk;
ALTER TABLE lancamentos_custos ADD CONSTRAINT lanc_custos_forma_pgto_chk CHECK (
  forma_pagamento IS NULL OR forma_pagamento IN (
    'DINHEIRO','PIX','CARTAO_CREDITO','CARTAO_DEBITO',
    'TRANSFERENCIA','BOLETO','CHEQUE','OUTRO'
  )
);

-- 10 categorias OFICIAIS do gráfico "PARA ONDE FOI O DINHEIRO?" do doc
ALTER TABLE lancamentos_custos DROP CONSTRAINT IF EXISTS lanc_custos_categoria_chk;
ALTER TABLE lancamentos_custos ADD CONSTRAINT lanc_custos_categoria_chk CHECK (
  categoria IN (
    'PAPELAO','FOLHA_PAGTO','ENERGIA','AGUA',
    'TELEFONE_INTERNET','COMBUSTIVEL','MANUTENCAO',
    'FRETES','INSUMOS','OUTROS'
  )
);

CREATE INDEX IF NOT EXISTS lanc_custos_comp_idx    ON lancamentos_custos(competencia);
CREATE INDEX IF NOT EXISTS lanc_custos_cat_idx     ON lancamentos_custos(categoria);
CREATE INDEX IF NOT EXISTS lanc_custos_centro_idx  ON lancamentos_custos(centro_custo_id);
CREATE INDEX IF NOT EXISTS lanc_custos_emp_idx     ON lancamentos_custos(empresa_id);
CREATE INDEX IF NOT EXISTS lanc_custos_of_idx      ON lancamentos_custos(of_id);
CREATE INDEX IF NOT EXISTS lanc_custos_nat_idx     ON lancamentos_custos(natureza);
CREATE INDEX IF NOT EXISTS lanc_custos_forn_idx    ON lancamentos_custos(fornecedor_beneficiario);

-- ---------------------------------------------------------------
-- TABELA 3: lancamentos_recorrentes (modelo p/ gerar mensalmente)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lancamentos_recorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NULL,
  centro_custo_id UUID NULL REFERENCES centros_custo(id) ON DELETE SET NULL,
  categoria TEXT NOT NULL,
  natureza TEXT NOT NULL DEFAULT 'DESPESA',
  descricao_padrao TEXT NOT NULL,
  fornecedor_padrao TEXT NULL,
  forma_pagamento_padrao TEXT NULL,
  valor_padrao NUMERIC(15,2) NOT NULL DEFAULT 0,
  dia_vencimento SMALLINT NOT NULL DEFAULT 5,
  periodicidade TEXT NOT NULL DEFAULT 'MENSAL',
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  observacoes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lancamentos_recorrentes DROP CONSTRAINT IF EXISTS lanc_rec_natureza_chk;
ALTER TABLE lancamentos_recorrentes ADD CONSTRAINT lanc_rec_natureza_chk CHECK (
  natureza IN ('RECEITA','DESPESA','CUSTO_FIXO','CUSTO_VARIAVEL','INVESTIMENTO')
);

ALTER TABLE lancamentos_recorrentes DROP CONSTRAINT IF EXISTS lanc_rec_categoria_chk;
ALTER TABLE lancamentos_recorrentes ADD CONSTRAINT lanc_rec_categoria_chk CHECK (
  categoria IN (
    'PAPELAO','FOLHA_PAGTO','ENERGIA','AGUA',
    'TELEFONE_INTERNET','COMBUSTIVEL','MANUTENCAO',
    'FRETES','INSUMOS','OUTROS'
  )
);

ALTER TABLE lancamentos_recorrentes DROP CONSTRAINT IF EXISTS lanc_rec_dia_chk;
ALTER TABLE lancamentos_recorrentes ADD CONSTRAINT lanc_rec_dia_chk CHECK (
  dia_vencimento BETWEEN 1 AND 31
);

ALTER TABLE lancamentos_recorrentes DROP CONSTRAINT IF EXISTS lanc_rec_periodo_chk;
ALTER TABLE lancamentos_recorrentes ADD CONSTRAINT lanc_rec_periodo_chk CHECK (
  periodicidade IN ('MENSAL','BIMESTRAL','TRIMESTRAL','SEMESTRAL','ANUAL')
);

CREATE INDEX IF NOT EXISTS lanc_recorr_emp_idx   ON lancamentos_recorrentes(empresa_id);
CREATE INDEX IF NOT EXISTS lanc_recorr_ativo_idx ON lancamentos_recorrentes(ativo);
CREATE INDEX IF NOT EXISTS lanc_recorr_cat_idx   ON lancamentos_recorrentes(categoria);

-- FK de recorrência -> lancamentos_custos (adicionar depois que tabela 3 existe)
ALTER TABLE lancamentos_custos DROP CONSTRAINT IF EXISTS lanc_custos_recorrencia_fk;
ALTER TABLE lancamentos_custos
  ADD CONSTRAINT lanc_custos_recorrencia_fk
  FOREIGN KEY (recorrencia_id) REFERENCES lancamentos_recorrentes(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------
-- Coluna auxiliar data_recebimento em chapas_estoque_v2 (custo papelao)
-- Se a coluna já existir, NÃO faz nada (IF NOT EXISTS)
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='chapas_estoque_v2' AND column_name='data_recebimento'
  ) THEN
    ALTER TABLE chapas_estoque_v2 ADD COLUMN data_recebimento DATE NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='chapas_estoque' AND column_name='data_recebimento'
  ) THEN
    ALTER TABLE chapas_estoque ADD COLUMN data_recebimento DATE NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
