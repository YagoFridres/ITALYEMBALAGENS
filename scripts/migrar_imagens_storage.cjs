#!/usr/bin/env node
/**
 * [HOTFIX-6 / D7] Move o base64 de `ofs.imgs` para o Storage (bucket PRIVADO `ofs-imagens`)
 * e deixa em `ofs.imagem_url` apenas o caminho do objeto (imgs = []).
 *
 * REGRAS DESTA FASE:
 *  - NAO EXECUTAR EM PRODUCAO sem aprovacao explicita do Yago.
 *  - Modo padrao = `--simular`: SOMENTE LEITURA (conta OFs com imagem).
 *    Com `--bytes` ele tambem soma o tamanho, mas para isso baixa o base64 (~108 MB hoje).
 *  - Para gravar e obrigatorio: `--aplicar --confirmar-producao` E `SUPABASE_ALLOW_WRITE=1`.
 *  - O bucket PRIVADO vem da migracao migrations/pendentes/D7_imagens_para_storage.sql.
 *  - Leitura posterior: bucket privado exige URL assinada (createSignedUrl) no servidor.
 *    Essa alteracao no server.js NAO faz parte deste script e precisa ser aprovada antes.
 *
 * USO:
 *   node scripts/migrar_imagens_storage.cjs                          # conta OFs com imagem
 *   node scripts/migrar_imagens_storage.cjs --bytes                  # conta OFs + bytes
 *   node scripts/migrar_imagens_storage.cjs --aplicar --confirmar-producao --limite 5
 *
 * ENV: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY).
 */
'use strict';

const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'ofs-imagens';
const PASSO = 100; // OFs por pagina (a varredura pede `id, imgs`; mantenha baixo)
const MIMES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

const args = process.argv.slice(2);
const tem = (flag) => args.includes(flag);
const valorDe = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : '';
};

const SIMULAR = !tem('--aplicar');
const SOMAR_BYTES = tem('--bytes');
const LIMITE = Number(valorDe('--limite') || 0) || 0;

function sairAviso(msg) {
  console.error('\n' + msg + '\n');
  process.exit(1);
}

if (!SIMULAR) {
  if (!tem('--confirmar-producao')) sairAviso('--aplicar exige --confirmar-producao (leia o cabecalho do script).');
  if (String(process.env.SUPABASE_ALLOW_WRITE || '') !== '1') sairAviso('--aplicar exige SUPABASE_ALLOW_WRITE=1 no ambiente.');
}

const URL_SB = String(process.env.SUPABASE_URL || '').trim();
const KEY_SB = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '').trim();
if (!URL_SB || !KEY_SB) sairAviso('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');

const supabase = createClient(URL_SB, KEY_SB, { auth: { persistSession: false } });

/** Le apenas OFs que tem algo em `imgs` (a coluna nao trafega o base64 na contagem). */
async function contarOfsComImagem() {
  const { count, error } = await supabase
    .from('ofs')
    .select('id', { count: 'exact', head: true })
    .not('imgs', 'is', null)
    .neq('imgs', '[]');
  if (error) throw new Error('contagem falhou: ' + error.message);
  return Number(count || 0);
}

/** Pagina as OFs com imagem trazendo `id` e `imgs` (usado no --bytes e no --aplicar). */
async function* paginasDeOfsComImagem() {
  let pagina = 0;
  for (;;) {
    const de = pagina * PASSO;
    const { data, error } = await supabase
      .from('ofs')
      .select('id,imgs,imagem_url')
      .not('imgs', 'is', null)
      .neq('imgs', '[]')
      .order('created_at', { ascending: true })
      .range(de, de + PASSO - 1);
    if (error) throw new Error('leitura falhou: ' + error.message);
    const lote = Array.isArray(data) ? data : [];
    if (!lote.length) return;
    yield lote;
    if (lote.length < PASSO) return;
    pagina++;
  }
}

/** Devolve a lista de data URLs (base64) de uma OF. */
function dataUrlsDe(imgs) {
  let arr = imgs;
  try { if (typeof arr === 'string') arr = JSON.parse(arr || '[]'); } catch (_) { arr = []; }
  if (!Array.isArray(arr)) arr = [];
  return arr.map((v) => String(v || '').trim()).filter((v) => /^data:image\//i.test(v));
}

function bytesDeDataUrl(dataUrl) {
  const i = dataUrl.indexOf(',');
  if (i < 0) return 0;
  return Buffer.from(dataUrl.slice(i + 1), 'base64').length;
}

async function simular() {
  const total = await contarOfsComImagem();
  console.log('[simular] OFs com imagem em `imgs`: ' + total);
  if (!SOMAR_BYTES) {
    console.log('[simular] (use --bytes para somar o tamanho; isso baixa o base64 do banco)');
    return;
  }
  let ofs = 0;
  let arquivos = 0;
  let bytes = 0;
  for await (const lote of paginasDeOfsComImagem()) {
    for (const of of lote) {
      const urls = dataUrlsDe(of && of.imgs);
      if (!urls.length) continue;
      ofs++;
      arquivos += urls.length;
      for (const u of urls) bytes += bytesDeDataUrl(u);
    }
  }
  console.log('[simular] OFs com base64: ' + ofs + ' | arquivos: ' + arquivos + ' | total: ' + (bytes / 1048576).toFixed(2) + ' MB');
}

async function aplicar() {
  let processadas = 0;
  let enviados = 0;
  let puladas = 0;
  for await (const lote of paginasDeOfsComImagem()) {
    for (const of of lote) {
      if (LIMITE && processadas >= LIMITE) break;
      const id = String((of && of.id) || '').trim();
      const urls = dataUrlsDe(of && of.imgs);
      if (!id || !urls.length) { puladas++; continue; }

      const caminhos = [];
      for (let i = 0; i < urls.length; i++) {
        const m = urls[i].match(/^data:image\/([a-z0-9+.-]+);base64,(.*)$/i);
        if (!m) { puladas++; continue; }
        const ext = String(m[1] || '').toLowerCase() === 'jpeg' ? 'jpg' : String(m[1] || '').toLowerCase();
        if (!MIMES[ext]) { puladas++; continue; }
        const buffer = Buffer.from(m[2] || '', 'base64');
        const caminho = 'ofs/' + id + '/' + (i + 1) + '.' + ext;
        const up = await supabase.storage.from(BUCKET).upload(caminho, buffer, { contentType: MIMES[ext], upsert: false });
        if (up.error && !/already exists|duplicate/i.test(String(up.error.message || ''))) {
          throw new Error('upload falhou (' + id + '): ' + up.error.message);
        }
        caminhos.push(caminho);
        enviados++;
      }
      if (!caminhos.length) { puladas++; continue; }

      const { error: errUpd } = await supabase
        .from('ofs')
        .update({ imagem_url: caminhos[0], imgs: [] })
        .eq('id', id);
      if (errUpd) throw new Error('update falhou (' + id + '): ' + errUpd.message);
      processadas++;
    }
    if (LIMITE && processadas >= LIMITE) break;
  }
  console.log('[aplicar] OFs migradas: ' + processadas + ' | arquivos enviados: ' + enviados + ' | puladas: ' + puladas);
  console.log('[aplicar] proximo passo: validar a exibicao das imagens na interface antes de continuar.');
}

(async () => {
  try {
    if (SIMULAR) {
      console.log('[HOTFIX-6] modo SIMULAR (somente leitura) — bucket ' + BUCKET);
      await simular();
    } else {
      console.log('[HOTFIX-6] modo APLICAR — bucket ' + BUCKET + (LIMITE ? ' | limite ' + LIMITE : ''));
      await aplicar();
    }
  } catch (e) {
    console.error('[HOTFIX-6] ERRO: ' + (e && e.message ? e.message : e));
    process.exit(1);
  }
})();
