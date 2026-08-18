const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secret = 'italy_secret_2026';
const token = jwt.sign({ id:'t', perfil:'admin' }, secret, { expiresIn:'2h' });
const BASE = 'https://adm.italyembalagens.com.br';

const OFS_IDS = [
  'c4db942d-7024-401a-a330-56a7faed344a',
  'afea1a07-acb8-4967-8a1e-fa16ecc8da1b',
  'c5478e8b-c98c-40de-98de-65477363bc26',
  '0a49f941-426a-4f35-ab81-118ad57423b4',
  '3100fdd2-6d75-49c5-a3ce-18fe3a58e0f0',
  'b2886f39-c729-4592-ba55-3a7cc37713c3',
  '15ce6411-1e9a-40cf-80af-c5e6ebda1247',
  'c2f83ddc-1b71-45c3-86f5-163638bde440',
];

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
        try { resolve({ status:res.statusCode, body: JSON.parse(b), raw: b.slice(0,5000) }); }
        catch(e) { resolve({ status:res.statusCode, parseErr: e.message, raw: b.slice(0,4000) }); }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', e => resolve({ netErr: String(e?.message||e) }));
    req.end();
  });
}

async function main(){
  const out = {
    modo: 'VERIFICACAO-OFs-8-IDs-EXATOS (F5 simulado Railway AO VIVO)',
    objetivo: 'Confirmar que 8 OFs (vazadas em Emerg3) aparecem agora com MOVEIS RIPKE na listagem (alteracao manual do usuario)',
    gerado_em: new Date().toISOString(),
    ofs: [],
  };
  for (const id of OFS_IDS) {
    const r = await get('/api/ofs/' + encodeURIComponent(id) + '?bust=' + Date.now() + '_' + Math.random().toString(36).slice(2,8));
    const o = (r?.body?.data?.id) ? r.body.data : (r?.body?.id ? r.body : null);
    if (o) {
      const cliente_nome = String(o?.clinome ?? o?.cliNome ?? o?.cliente_nome ?? o?.cliente ?? '').trim() || null;
      const cli_id = String(o?.cli_id ?? o?.cliId ?? o?.cliente_id ?? '').trim() || null;
      out.ofs.push({
        ofs_id: id,
        numero: String(o?.numero ?? o?.of ?? ''),
        status: o.status || null,
        cli_id,
        cliente_nome_tela: cliente_nome,
        nome_match_ripke: /RIPKE/i.test(String(cliente_nome || '')),
        descricao: String(o?.descricao ?? o?.produto ?? '').slice(0,120) || null,
        data_entrega: String(o?.data_entrega ?? o?.ent ?? '').slice(0,10) || null,
        deleted_at: o?.deleted_at || null,
      });
    } else {
      out.ofs.push({
        ofs_id: id,
        erro_nao_encontrado: true,
        http_status: r?.status,
        http_body: (r?.raw || '').slice(0,300),
      });
    }
  }
  out.consolidado = {
    qtd_ofs: out.ofs.length,
    qtd_encontrados: out.ofs.filter(r => !r.erro_nao_encontrado).length,
    qtd_nome_contem_RIPKE: out.ofs.filter(r => r.nome_match_ripke).length,
    qtd_NOME_REAL_AQUI: out.ofs.filter(r => /NOME REAL AQUI/i.test(String(r.cliente_nome_tela || ''))).length,
    todos_RIPKE: out.ofs.filter(r => !r.erro_nao_encontrado).every(r => r.nome_match_ripke),
  };
  fs.writeFileSync(path.join(__dirname, '_VERIF_OFS_RIPKE_V2.json'), JSON.stringify(out, null, 2));
  process.exit(0);
}
main().catch(e => { try { fs.writeFileSync(path.join(__dirname,'_VERIF_OFS_RIPKE_V2_ERR.json'), JSON.stringify({err:String(e?.message||e)},null,2)); } catch(_){} process.exit(1); });
