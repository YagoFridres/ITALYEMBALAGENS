-- Adicionar colunas faltantes em inconformidades
ALTER TABLE inconformidades
  ADD COLUMN IF NOT EXISTS operadores text[],
  ADD COLUMN IF NOT EXISTS operador_principal text,
  ADD COLUMN IF NOT EXISTS qtd_perdida numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vl_unit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vl_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS produto text,
  ADD COLUMN IF NOT EXISTS cliente text,
  ADD COLUMN IF NOT EXISTS motivo text,
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- Adicionar colunas faltantes em of_passagens
ALTER TABLE of_passagens
  ADD COLUMN IF NOT EXISTS operador text,
  ADD COLUMN IF NOT EXISTS operadores text[],
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_inconformidades_empresa ON inconformidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inconformidades_maquina ON inconformidades(maquina);
CREATE INDEX IF NOT EXISTS idx_inconformidades_operador ON inconformidades(operador_principal);
