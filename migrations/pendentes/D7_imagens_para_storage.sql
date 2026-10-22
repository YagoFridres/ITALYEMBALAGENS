-- [HOTFIX-6 / D7] Imagens das OFs para o Storage (bucket PRIVADO).
--
-- NAO EXECUTAR. Este arquivo esta em migrations/pendentes/ aguardando aprovacao explicita do Yago.
-- Nao ha escrita no banco de producao, nem deploy, nem alteracao de credenciais sem autorizacao.
--
-- Contexto (medido em 21/10/2026): 881 das 4.238 OFs guardam a imagem em base64 dentro de
-- `ofs.imgs` = 108 MB dos 122 MB da tabela. O objetivo e mover esse base64 para o Storage e
-- deixar em `ofs.imagem_url` apenas o caminho do objeto.
--
-- Ordem de aplicacao (quando aprovado):
--   1) rodar ESTA migracao (cria o bucket privado);
--   2) rodar `node scripts/migrar_imagens_storage.cjs --simular` (somente leitura; confere numeros);
--   3) rodar com `--aplicar --confirmar-producao` em lote pequeno (--limite 5) e validar na tela;
--   4) so entao rodar o restante.
--
-- ATENCAO: o bucket e PRIVADO. Depois da migracao, a exibicao da imagem passa a exigir URL
-- assinada (`createSignedUrl`) no servidor. Essa alteracao no server.js NAO faz parte deste
-- arquivo e precisa ser aprovada/implementada ANTES de aplicar em producao — caso contrario as
-- imagens migradas ficariam inacessiveis pela interface.

-- 1) Bucket privado (idempotente). Limite de 5 MB por arquivo e apenas tipos de imagem.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ofs-imagens',
  'ofs-imagens',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 2) Sem politicas para `anon`/`authenticated`: o acesso e feito exclusivamente pelo servidor
--    Node com a SERVICE_ROLE_KEY (que ignora RLS). Isso mantem o bucket fechado para o navegador.
--    Se algum dia o front precisar acessar direto, criar politica especifica e revisar antes.

-- 3) Conferencia (somente leitura) — rode manualmente para acompanhar a migracao:
--    select count(*)                                  as ofs_com_imagem,
--           pg_size_pretty(sum(length(imgs::text))::bigint) as base64_total
--    from public.ofs
--    where imgs is not null and imgs::text <> '[]';
