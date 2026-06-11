-- Rodar no Supabase SQL Editor antes do deploy do codigo
CREATE INDEX IF NOT EXISTS idx_ofs_empresa_status
  ON ofs(empresa_id, status);

CREATE INDEX IF NOT EXISTS idx_ofs_empresa_entrega
  ON ofs(empresa_id, data_entrega DESC);

CREATE INDEX IF NOT EXISTS idx_ofs_cli_id
  ON ofs(cli_id);

CREATE INDEX IF NOT EXISTS idx_ofs_created_at
  ON ofs(empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ofs_maquina
  ON ofs(empresa_id, maquina);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa_ativo
  ON clientes(empresa_id, ativo);

CREATE INDEX IF NOT EXISTS idx_clientes_nome
  ON clientes(empresa_id, nome);

CREATE INDEX IF NOT EXISTS idx_inconformidades_empresa
  ON inconformidades(empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_of_passagens_empresa
  ON of_passagens(created_at DESC);
