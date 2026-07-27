const http = require('http');
const fs = require('fs');
const path = require('path');

const sessionId = 'auto-modal-calc';
const outDir = path.resolve(__dirname);
const logFile = path.join(outDir, `trae-debug-log-${sessionId}.ndjson`);
const envFile = path.join(outDir, `${sessionId}.env`);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(logFile, '');

function writeEnv(port) {
  const apiUrl = `http://127.0.0.1:${port}/event`;
  fs.writeFileSync(envFile, `DEBUG_SERVER_URL=${apiUrl}\nDEBUG_SESSION_ID=${sessionId}\n`);
  return apiUrl;
}

function start(port, retries) {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.url === '/health') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, sessionId }));
      return;
    }

    if (req.url === '/logs' && req.method === 'DELETE') {
      fs.writeFileSync(logFile, '');
      res.end('cleared');
      return;
    }

    if (req.url === '/event' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const evt = JSON.parse(body || '{}');
          if (!evt.ts) evt.ts = Date.now();
          fs.appendFileSync(logFile, JSON.stringify(evt) + '\n');
          res.end('ok');
        } catch (_) {
          res.statusCode = 400;
          res.end('bad json');
        }
      });
      return;
    }

    res.statusCode = 404;
    res.end('not found');
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && retries < 10) {
      start(port + 1, retries + 1);
      return;
    }
    throw err;
  });

  server.listen(port, '127.0.0.1', () => {
    const apiUrl = writeEnv(port);
    console.log('@@DEBUG_SERVER_INFO');
    console.log(JSON.stringify({
      api_url: apiUrl,
      session_id: sessionId,
      log_dir: outDir,
      log_file: logFile,
      env_file: envFile
    }, null, 2));
    console.log('@@END_DEBUG_SERVER_INFO');
  });
}

start(7777, 0);
