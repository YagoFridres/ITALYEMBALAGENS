-- ============================================================================
-- D4_normaliza_nomes_passagens.sql  ·  item OFMAQ-16  ·  575 nomes de máquina
-- fora do padrão na tabela física `passagens_maquina`
-- ----------------------------------------------------------------------------
-- NÃO EXECUTAR. Este arquivo é apenas a PROPOSTA de correção de dados, com os
-- SELECTs de conferência e o ROLLBACK explícito (nada é gravado).
--
-- Contexto (prompt OFMAQ-16, linhas 872-878):
--   `_upsertPassagemMaquinaRegistro` (server.js ~14103) grava `maquina_nome`
--   em `passagens_maquina` já com `_canonMaqNome`; mas há 575 linhas ANTIGAS
--   com nome fora do padrão: JSON serializado (`["IMP 05"]`), UUID, `[]` ou
--   "Sem máquina".
--
--   A correção de CÓDIGO já normaliza o nome antes de gravar
--   (`_canonMaqNome`/`_normMaqNome`, server.js ~21380) e usa `.select('id')`
--   no insert. Este arquivo corrige o DADO antigo para a tabela física ficar
--   igual à coluna JSON `ofs.passagens_maquina` e à canonização do app.
--
--   Canonização replicada do código (`_canonMaqNome`):
--     IMP 0x (1..5) .......... "IMP 01".."IMP 05"
--     corte/vinco/rotativa ... "CORTE VINCO ROTATIVA" (ou "cvr"/"rotativa")
--     riscador/risc ......... "Riscador"
--     acabamento/acab ....... "Acabamento"
--     qualquer outra coisa ... NULL (UUID, "[]", "Sem máquina", vazio)
--
-- Números esperados (conferir no PASSO 1 antes de qualquer coisa):
--   PASSO 1 · todas as linhas com `maquina_nome` fora do padrão ...... 575
--   PASSO 3 · linhas cujo nome CANONIZA para uma máquina válida .... (conferir;
--             são as que o PASSO 4 atualiza — o prompt só fixa o total 575)
--   PASSO 5 · sobra que NÃO canoniza (UUID/[]/Sem máquina) ......... (decisão)
--
--   Obs.: as colunas são `maquina` e `maquina_nome`; o PASSO 4 normaliza as
--   duas quando as duas estiverem fora do padrão, para não sobrar divergência.
--   A lista canônica é MAQUINAS_CATALOGO_PADRAO (server.js ~6713).
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PASSO 1 · Conferência · distribuição dos nomes fora do padrão
--           (esperado: a SOMA da coluna `qtd` = 575)
-- ---------------------------------------------------------------------------
SELECT
  p.maquina_nome AS nome_atual,
  p.maquina      AS maquina_atual,
  count(*)       AS qtd
FROM passagens_maquina p
WHERE COALESCE(p.maquina_nome, '') NOT IN (
  'IMP 01','IMP 02','IMP 03','IMP 04','IMP 05',
  'Riscador','CORTE VINCO ROTATIVA','Acabamento'
)
GROUP BY 1, 2
ORDER BY 3 DESC, 1;


-- ---------------------------------------------------------------------------
-- PASSO 2 · Conferência · total global fora do padrão (esperado: 575)
-- ---------------------------------------------------------------------------
SELECT count(*) AS total_fora_do_padrao
FROM passagens_maquina p
WHERE COALESCE(p.maquina_nome, '') NOT IN (
  'IMP 01','IMP 02','IMP 03','IMP 04','IMP 05',
  'Riscador','CORTE VINCO ROTATIVA','Acabamento'
);


-- ---------------------------------------------------------------------------
-- PASSO 3 · Simulação · nome canônico proposto (sem gravar)
--           `limpo` remove os colchetes e as aspas do JSON serializado
--           (`["IMP 05"]` -> `IMP 05`) antes de aplicar a canonização.
-- ---------------------------------------------------------------------------
WITH limpos AS (
  SELECT
    p.id,
    p.of_id,
    p.of_numero,
    p.maquina,
    p.maquina_nome,
    BTRIM(
      REGEXP_REPLACE(
        BTRIM(COALESCE(p.maquina_nome, ''), '[]"'),
        '\s+', ' ', 'g'
      )
    ) AS limpo
  FROM passagens_maquina p
  WHERE COALESCE(p.maquina_nome, '') NOT IN (
    'IMP 01','IMP 02','IMP 03','IMP 04','IMP 05',
    'Riscador','CORTE VINCO ROTATIVA','Acabamento'
  )
)
SELECT
  l.id,
  l.of_id,
  l.of_numero,
  l.maquina_nome AS nome_atual,
  l.limpo,
  CASE
    WHEN l.limpo ~* '\m(imp|impressora)\s*0*[1-5]\M'
      THEN 'IMP ' || LPAD((REGEXP_MATCH(l.limpo, '\m(?:imp|impressora)\s*0*([1-5])\M', 'i'))[1], 2, '0')
    WHEN l.limpo ~* 'corte.*vinco.*(rotat|cvr)'
      OR l.limpo ~* 'rotat.*(vinco|corte)'
      OR l.limpo ~* '^cvr$'
      OR l.limpo ~* '^rotativa$'
      THEN 'CORTE VINCO ROTATIVA'
    WHEN l.limpo ~* '^riscador' OR l.limpo ~* '^risc$'
      THEN 'Riscador'
    WHEN l.limpo ~* 'acabamento' OR l.limpo ~* '^acab'
      THEN 'Acabamento'
    ELSE NULL
  END AS nome_canonico_proposto
FROM limpos l
ORDER BY (CASE
    WHEN l.limpo ~* '\m(imp|impressora)\s*0*[1-5]\M' THEN 0
    ELSE 1
  END), l.maquina_nome, l.of_numero;


-- ---------------------------------------------------------------------------
-- PASSO 4 · PROPOSTA de ajuste (transação com ROLLBACK — não grava nada)
--           Grava o nome canônico em `maquina_nome` (e em `maquina` quando o
--           `maquina` estiver fora do padrão) SOMENTE nas linhas que canonizam.
--           Não toca em horário, quantidade, operador, OF ou qualquer outro
--           campo da passagem.
-- ---------------------------------------------------------------------------
BEGIN;

WITH limpos AS (
  SELECT
    p.id,
    p.maquina,
    BTRIM(
      REGEXP_REPLACE(
        BTRIM(COALESCE(p.maquina_nome, ''), '[]"'),
        '\s+', ' ', 'g'
      )
    ) AS limpo
  FROM passagens_maquina p
  WHERE COALESCE(p.maquina_nome, '') NOT IN (
    'IMP 01','IMP 02','IMP 03','IMP 04','IMP 05',
    'Riscador','CORTE VINCO ROTATIVA','Acabamento'
  )
),
canon AS (
  SELECT
    l.id,
    l.maquina,
    CASE
      WHEN l.limpo ~* '\m(imp|impressora)\s*0*[1-5]\M'
        THEN 'IMP ' || LPAD((REGEXP_MATCH(l.limpo, '\m(?:imp|impressora)\s*0*([1-5])\M', 'i'))[1], 2, '0')
      WHEN l.limpo ~* 'corte.*vinco.*(rotat|cvr)'
        OR l.limpo ~* 'rotat.*(vinco|corte)'
        OR l.limpo ~* '^cvr$'
        OR l.limpo ~* '^rotativa$'
        THEN 'CORTE VINCO ROTATIVA'
      WHEN l.limpo ~* '^riscador' OR l.limpo ~* '^risc$'
        THEN 'Riscador'
      WHEN l.limpo ~* 'acabamento' OR l.limpo ~* '^acab'
        THEN 'Acabamento'
      ELSE NULL
    END AS nome_canonico
  FROM limpos l
)
UPDATE passagens_maquina p
SET
  maquina_nome = c.nome_canonico,
  maquina = CASE
              WHEN COALESCE(p.maquina, '') IN (
                'IMP 01','IMP 02','IMP 03','IMP 04','IMP 05',
                'Riscador','CORTE VINCO ROTATIVA','Acabamento'
              ) THEN p.maquina
              ELSE c.nome_canonico
            END
FROM canon c
WHERE p.id = c.id
  AND c.nome_canonico IS NOT NULL
  AND (COALESCE(p.maquina_nome, '') IS DISTINCT FROM c.nome_canonico
       OR COALESCE(p.maquina, '') IS DISTINCT FROM COALESCE(c.nome_canonico, ''));
-- Esperado: UPDATE = linhas do PASSO 3 com nome_canonico_proposto não nulo.

-- PASSO 4.1 · Conferência pós-UPDATE (esperado: 0 linhas)
SELECT count(*) AS ainda_fora_do_padrao_mas_canonizavel
FROM passagens_maquina p
WHERE COALESCE(p.maquina_nome, '') NOT IN (
  'IMP 01','IMP 02','IMP 03','IMP 04','IMP 05',
  'Riscador','CORTE VINCO ROTATIVA','Acabamento'
)
AND BTRIM(REGEXP_REPLACE(BTRIM(COALESCE(p.maquina_nome, ''), '[]"'), '\s+', ' ', 'g'))
    ~* '\m(imp|impressora)\s*0*[1-5]\M|corte.*vinco.*(rotat|cvr)|rotat.*(vinco|corte)|^cvr$|^rotativa$|^riscador|^risc$|acabamento|^acab';

ROLLBACK;


-- ---------------------------------------------------------------------------
-- PASSO 5 · DECISÃO · o que NÃO canoniza (UUID, `[]`, "Sem máquina", vazio)
--           Estes NÃO têm máquina recuperável pelo nome: o PASSO 4 os deixa
--           como estão. Listar e decidir com o Yago (preencher pela coluna
--           JSON `ofs.passagens_maquina` da mesma OF, ou marcar como sem
--           máquina). NÃO corrigir automaticamente.
-- ---------------------------------------------------------------------------
WITH limpos AS (
  SELECT
    p.id,
    p.of_id,
    p.of_numero,
    p.maquina,
    p.maquina_nome,
    BTRIM(REGEXP_REPLACE(BTRIM(COALESCE(p.maquina_nome, ''), '[]"'), '\s+', ' ', 'g')) AS limpo
  FROM passagens_maquina p
  WHERE COALESCE(p.maquina_nome, '') NOT IN (
    'IMP 01','IMP 02','IMP 03','IMP 04','IMP 05',
    'Riscador','CORTE VINCO ROTATIVA','Acabamento'
  )
)
SELECT l.limpo, count(*) AS qtd, min(l.of_numero) AS exemplo_of
FROM limpos l
WHERE NOT (
  l.limpo ~* '\m(imp|impressora)\s*0*[1-5]\M'
  OR l.limpo ~* 'corte.*vinco.*(rotat|cvr)'
  OR l.limpo ~* 'rotat.*(vinco|corte)'
  OR l.limpo ~* '^cvr$'
  OR l.limpo ~* '^rotativa$'
  OR l.limpo ~* '^riscador'
  OR l.limpo ~* '^risc$'
  OR l.limpo ~* 'acabamento'
  OR l.limpo ~* '^acab'
)
GROUP BY l.limpo
ORDER BY 2 DESC;


-- ---------------------------------------------------------------------------
-- PASSO 6 · Conferência final · distribuição por nome de máquina
--           (usar como "antes x depois" da tabela física)
-- ---------------------------------------------------------------------------
SELECT COALESCE(NULLIF(BTRIM(p.maquina_nome), ''), '(vazio)') AS nome, count(*) AS qtd
FROM passagens_maquina p
GROUP BY 1
ORDER BY 2 DESC;
