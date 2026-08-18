const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'t', perfil:'admin' }, secret, { expiresIn:'2h' });
const BASE = 'https://adm.italyembalagens.com.br';

const OFS_NUMS = [2597,2598,2599,2600,2601,2602,2603,2604];

function get(p) {
  return new Promise((resolve) => {
    const opts = {
      host:'adm.italyembalagens.com.br', path: p, method:'GET',
      headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/json' },
      timeout: 60000,
    };
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve({ status:res.statusCode, body: JSON.parse(b), raw: b.slice(0,4000) }); }
        catch(e) { resolve({ status:res.statusCode, parseErr: e.message, raw: b.slice(0,3000) }); }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', e => resolve({ netErr: String(e?.message||e) }));
    req.end();
  });
}

function pickOf(resp) {
  if (resp?.body?.data?.id) return resp.body.data;
  if (resp?.body?.data && Array.isArray(resp.body.data) && resp.body.data[0]?.id) return resp.body.data[0];
  if (Array.isArray(resp?.body) && resp.body[0]?.id) return resp.body[0];
  if (resp?.body?.id) return resp.body;
  return null;
}

async function main(){
  const out = {
    modo: 'VERIFICACAO-OFs-2597-a-2604-DEVE-SER-MOVEIS-RIPKE (F5 simulado Railway AO VIVO)',
    gerado_em: new Date().toISOString(),
    ofs: [],
  };
  for (const n of OFS_NUMS) {
    let r = await get('/api/ofs/buscar?q=' + n + '&bust=' + Date.now() + '_' + Math.random().toString(36).slice(2,8));
    let o = pickOf(r);
    // Tenta fallback por numero diretamente se o buscar nao bateu exato
    if (!o) {
      const r2 = await get('/api/ofs?limit=500&order=created_at&dir=desc&bust=' + Date.now() + '_' + Math.random().toString(36).slice(2,8));
      if (Array.isArray(r2.body?.data)) {
        o = r2.body.data.find(x => String(x?.numero ?? x?.of ?? '') === String(n));
      } else if (Array.isArray(r2.body)) {
        o = r2.body.find(x => String(x?.numero ?? x?.of ?? '') === String(n));
      }
    }
    if (o) {
      const cliente_nome = String(o?.clinome ?? o?.cliNome ?? o?.cliente_nome ?? o?.cliente ?? '').trim() || null;
      const cli_id = String(o?.cli_id ?? o?.cliId ?? o?.cliente_id ?? '').trim() || null;
      out.ofs.push({
        numero: n,
        ofs_id: o.id || null,
        status: o.status || null,
        cli_id,
        cliente_nome_tela: cliente_nome,
        descricao: String(o?.descricao ?? o?.produto ?? '').slice(0,120) || null,
        data_entrega: String(o?.data_entrega ?? o?.ent ?? '').slice(0,10) || null,
        deleted_at: o?.deleted_at || null,
      });
    } else {
      out.ofs.push({ numero: n, nao_encontrado: true, ultimo_raw_status: r?.status, ultimo_raw_parseErr: r?.parseErr || null, ultimo_raw_preview: (r?.raw||'').slice(0,300) });
    }
  }
  const todos_ripke = out.ofs.every(r => /RIPKE/i.test(String(r.cliente_nome_tela || '')));
  const contador_zeros = out.ofs.filter(r => r.total_ofs === 0 || r.total_ofs === '0').length;
  const falhas_ripke = out.ofs.filter(r => !(/RIPKE/i.test(String(r.cliente_nome_tela || '')))).length;
  out.consolidado = {
    qtd_ofs: out.ofs.length,
    todos_com_nome_ripke: todos_ripke,
    qtd_falhas_ripke: falhas_ripke,
    qtd_nao_encontradas: out.ofs.filter(r => r.nao_encontrado).length,
  };
  fs.writeFileSync(path.join(__dirname, '_VERIF_OFS_RIPKE_NODE.json'), JSON.stringify(out, null, 2));
  process.exit(0);
}
main().catch(e => { try { fs.writeFileSync(path.join(__dirname,'_VERIF_OFS_RIPKE_ERR.json'), JSON.stringify({err:String(e?.message||e)},null,2)); } catch(_){} process.exit(1); });
