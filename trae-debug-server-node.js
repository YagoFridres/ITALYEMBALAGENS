const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const raw = String(argv[i] || '');
    if (!raw.startsWith('--')) continue;
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (next && !String(next).startsWith('--')) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeJson(req, cb) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body || '{}');
      cb(null, parsed);
    } catch (e) {
      cb(e);
    }
  });
}

function nowMs() {
  return Date.now();
}

function tryListen(host, startPort, maxTries, onReady) {
  let port = startPort;
  let tries = 0;
  const attempt = () => {
    const server = http.createServer();
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && tries < maxTries) {
        tries += 1;
        port += 1;
        attempt();
        return;
      }
      throw err;
    });
    server.listen(port, host, () => onReady(server, port));
  };
  attempt();
}

const args = parseArgs(process.argv);
const sessionId = String(args.session || '').trim();
if (!sessionId) {
  process.stderr.write('Missing --session\n');
  process.exit(2);
}

const outdir = path.resolve(process.cwd(), String(args.outdir || '.dbg'));
const basePort = Number(args.port || 7777) || 7777;
const clean = args.clean === true || String(args.clean || '') === 'true';
const idleSec = Number(args.idle || 0) || 0;
const host = (args.remote === true || String(args.remote || '') === 'true') ? '0.0.0.0' : '127.0.0.1';

ensureDir(outdir);

const logFile = path.join(outdir, `trae-debug-log-${sessionId}.ndjson`);
const envFile = path.join(outdir, `${sessionId}.env`);

if (clean) {
  try { fs.writeFileSync(logFile, ''); } catch (_) {}
}

let lastEventAt = nowMs();
let idleTimer = null;
const touchIdle = () => {
  lastEventAt = nowMs();
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

tryListen(host, basePort, 10, (server, port) => {
  const apiUrl = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}/event`;
  try {
    fs.writeFileSync(envFile, `DEBUG_SERVER_URL=${apiUrl}\nDEBUG_SESSION_ID=${sessionId}\n`);
  } catch (_) {}

  process.stdout.write('@@DEBUG_SERVER_INFO\n');
  process.stdout.write(JSON.stringify({
    api_url: apiUrl,
    session_id: sessionId,
    log_dir: outdir,
    log_file: logFile,
    env_file: envFile
  }, null, 2) + '\n');
  process.stdout.write('@@END_DEBUG_SERVER_INFO\n');

  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = String(parsedUrl.pathname || '');

    if (req.method === 'OPTIONS' && pathname === '/event') {
      Object.keys(corsHeaders).forEach((k) => res.setHeader(k, corsHeaders[k]));
      res.statusCode = 204;
      res.end('');
      return;
    }

    if (req.method === 'GET' && pathname === '/health') {
      Object.keys(corsHeaders).forEach((k) => res.setHeader(k, corsHeaders[k]));
      res.end(JSON.stringify({ ok: true, sessionId, uptime_ms: nowMs() - lastEventAt, log_file: logFile }));
      return;
    }

    if (req.method !== 'POST' || pathname !== '/event') {
      Object.keys(corsHeaders).forEach((k) => res.setHeader(k, corsHeaders[k]));
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: 'not-found' }));
      return;
    }

    safeJson(req, (err, body) => {
      Object.keys(corsHeaders).forEach((k) => res.setHeader(k, corsHeaders[k]));
      if (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'invalid-json' }));
        return;
      }
      const event = body && typeof body === 'object' ? { ...body } : {};
      event.sessionId = String(event.sessionId || sessionId);
      event.runId = String(event.runId || 'pre-fix');
      event.hypothesisId = String(event.hypothesisId || '');
      event.msg = String(event.msg || '');
      event.ts = Number(event.ts || 0) || nowMs();
      try {
        fs.appendFileSync(logFile, JSON.stringify(event) + '\n');
      } catch (_) {}
      touchIdle();
      res.end(JSON.stringify({ ok: true }));
    });
  });

  if (idleSec > 0) {
    idleTimer = setInterval(() => {
      const delta = nowMs() - lastEventAt;
      if (delta > (idleSec * 1000)) {
        try { server.close(); } catch (_) {}
        process.exit(0);
      }
    }, 1000).unref();
  }
});

