// Formulário temporário (servidor de TESTE): Yago digita a senha do banco do Supabase e o
// servidor recopia TODOS os dados de produção para cá (o Supabase é só lido). Desliga sozinho.
const http = require('http'), fs = require('fs'), { spawn, spawnSync } = require('child_process');
const T = process.argv[2]; // caminho secreto gerado na hora
const P = (m) => `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><title>Atualizar dados de teste</title>
<style>body{font:16px sans-serif;max-width:620px;margin:30px auto;padding:0 16px}label{display:block;margin-top:18px;font-weight:bold}input{width:100%;padding:10px;font-size:15px;box-sizing:border-box}button{margin-top:24px;padding:12px 24px;font-size:16px}.e{background:#fde2e2;color:#900;padding:12px;border-radius:6px}</style>
<h2>Servidor de TESTE — puxar dados atuais da produção</h2><p>Copia de novo tudo que está no Supabase (OFs, clientes, fotos…). O Supabase só é lido. Os registros de teste daqui são substituídos.</p>${m ? '<p class=e>' + m + '</p>' : ''}<form method=post>
<label>Senha do banco (Supabase)</label><input name=s type=password required>
<label>SUPABASE_SERVICE_KEY (sb_secret_...) — para as fotos</label><input name=k type=password required>
<button>Puxar dados</button></form>`;
const H = { 'content-type': 'text/html; charset=utf-8' };
const srv = http.createServer((q, r) => {
  if (!q.url.startsWith(T)) { r.writeHead(404); return r.end(); }
  if (q.method !== 'POST') { r.writeHead(200, H); return r.end(P('')); }
  let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
    const f = new URLSearchParams(b), g = (n) => (f.get(n) || '').trim();
    const cs = 'postgresql://postgres.ubygjqxkflfachtlogdw:' + encodeURIComponent(g('s')) + '@aws-1-sa-east-1.pooler.supabase.com:5432/postgres';
    const t = spawnSync('docker', ['run', '--rm', 'postgres:17', 'psql', cs, '-At', '-c', 'select 1'], { timeout: 60000, encoding: 'utf8' });
    if (t.status !== 0) {
      const err = String(t.stderr || t.error || '').includes('password authentication') ? 'Senha do banco INCORRETA. Tente de novo.' : 'Erro ao conectar: ' + String(t.stderr || t.error).slice(0, 200).replace(/[<>]/g, '');
      r.writeHead(200, H); return r.end(P(err));
    }
    r.writeHead(200, H);
    r.end('<meta charset=utf-8><h2>Senha OK! Puxando os dados (uns 10 minutos; o sistema de teste fica fora do ar nesse tempo). Pode fechar e avisar o Claude.</h2>');
    srv.close();
    const log = fs.openSync('/opt/pcp-pro/tarefas-log/sync-dados.log', 'w');
    const c = spawn('bash', ['/opt/pcp-pro/app/deploy/sync-dados.sh'], { detached: true, stdio: ['pipe', log, log] });
    c.stdin.end(cs + '\n' + g('k') + '\n'); c.unref();
    setTimeout(() => process.exit(0), 2000);
  });
});
srv.listen(3005, '127.0.0.1');
setTimeout(() => process.exit(0), 6 * 3600e3);
