// Formulário temporário (servidor de TESTE): Yago digita a senha do banco do Supabase e o
// servidor recopia TODOS os dados de produção para cá (o Supabase é só lido). Desliga sozinho.
const http = require('http'), fs = require('fs'), { spawn, spawnSync } = require('child_process');
const T = process.argv[2]; // caminho secreto gerado na hora
const P = (m) => `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><title>Atualizar dados de teste</title>
<style>body{font:16px sans-serif;max-width:620px;margin:30px auto;padding:0 16px}label{display:block;margin-top:18px;font-weight:bold}input{width:100%;padding:10px;font-size:15px;box-sizing:border-box}button{margin-top:24px;padding:12px 24px;font-size:16px}.e{background:#fde2e2;color:#900;padding:12px;border-radius:6px}</style>
<h2>Servidor de TESTE — puxar dados atuais da produção</h2><p>Traz para cá os dados do sistema antigo (Supabase). O Supabase só é lido, nada é alterado lá.</p>${m ? '<p class=e>' + m + '</p>' : ''}<form method=post>
<label>Senha do banco (Supabase)</label><input name=s type=password required>
<label>SUPABASE_SERVICE_KEY (sb_secret_...) — só para a cópia completa (fotos)</label><input name=k type=password>
<label><input type=radio name=modo value=novas checked style="width:auto"> Só OFs, clientes e vendedores novos/alterados (rápido, o sistema continua no ar)</label>
<label><input type=radio name=modo value=tudo style="width:auto"> Cópia completa de tudo (uns 10 min fora do ar; apaga o que foi feito só aqui)</label>
<label><input type=checkbox name=auto value=1 style="width:auto"> Manter as OFs novas chegando sozinhas (a cada 5 min). A senha do banco fica guardada só neste servidor, num arquivo que só o administrador lê.</label>
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
    const modo = g('modo') === 'tudo' ? 'tudo' : 'novas';
    if (modo === 'tudo' && !g('k')) { r.writeHead(200, H); return r.end(P('Para a cópia completa, preencha também a SUPABASE_SERVICE_KEY.')); }
    const SEGF = '/etc/pcp-pro/sync-origem';
    if (g('auto') === '1') {
      fs.mkdirSync('/etc/pcp-pro', { recursive: true, mode: 0o700 });
      fs.writeFileSync(SEGF, cs + '\n', { mode: 0o600 }); fs.chmodSync(SEGF, 0o600);
      spawnSync('systemctl', ['enable', '--now', 'pcp-sync-ofs.timer'], { timeout: 20000 });
    } else {
      try { fs.unlinkSync(SEGF); } catch (_) {}
      spawnSync('systemctl', ['disable', '--now', 'pcp-sync-ofs.timer'], { timeout: 20000 });
    }
    r.writeHead(200, H);
    if (modo === 'novas') {
      r.end('<meta charset=utf-8><h2>Senha OK! Puxando as OFs novas (leva menos de 1 minuto, o sistema continua no ar).' + (g('auto') === '1' ? ' Daqui em diante elas chegam sozinhas a cada 5 minutos.' : '') + ' Pode fechar.</h2>');
      srv.close();
      const ent = '/run/pcp-sync-ofs-' + Date.now() + '.in';
      fs.writeFileSync(ent, cs + '\n', { mode: 0o600 });
      spawnSync('systemd-run', ['--unit=pcp-sync-ofs-agora', '--collect', '-p', 'StandardOutput=append:/opt/pcp-pro/tarefas-log/sync-ofs.log', '-p', 'StandardError=append:/opt/pcp-pro/tarefas-log/sync-ofs.log', '--setenv=HOME=/root', '--setenv=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', '/bin/bash', '/opt/pcp-pro/app/deploy/sync-ofs.sh', ent], { encoding: 'utf8', timeout: 20000 });
      setTimeout(() => process.exit(0), 2000);
      return;
    }
    r.end('<meta charset=utf-8><h2>Senha OK! Puxando os dados (uns 10 minutos; o sistema de teste fica fora do ar nesse tempo). Pode fechar e avisar o Claude.</h2>');
    srv.close();
    // A cópia roda numa unidade própria do systemd: antes ela era filha deste formulário e era
    // encerrada junto quando o formulário fechava (ficava parada no passo do backup).
    const ent = '/run/pcp-sync-' + Date.now() + '.in';
    fs.writeFileSync(ent, cs + '\n' + g('k') + '\n', { mode: 0o600 });
    fs.writeFileSync('/opt/pcp-pro/tarefas-log/sync-dados.log', '');
    spawnSync('systemctl', ['stop', 'pcp-sync-dados'], { timeout: 20000 });
    const c = spawnSync('systemd-run', ['--unit=pcp-sync-dados', '--collect', '-p', 'StandardOutput=append:/opt/pcp-pro/tarefas-log/sync-dados.log', '-p', 'StandardError=append:/opt/pcp-pro/tarefas-log/sync-dados.log', '--setenv=HOME=/root', '--setenv=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', '/bin/bash', '/opt/pcp-pro/app/deploy/sync-dados.sh', ent], { encoding: 'utf8', timeout: 20000 });
    if (c.status !== 0) fs.appendFileSync('/opt/pcp-pro/tarefas-log/sync-dados.log', 'falha ao iniciar: ' + (c.stderr || c.error) + '\n');
    setTimeout(() => process.exit(0), 2000);
  });
});
srv.listen(3005, '127.0.0.1');
setTimeout(() => process.exit(0), 6 * 3600e3);
