const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend');

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  if (!req.url) return send(res, 400, 'Bad Request');

  if (req.url.startsWith('/api/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, service: 'erp-italy-v2', ts: new Date().toISOString() }));
    return;
  }

  const urlPath = req.url.split('?')[0];
  const safePath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return send(res, 403, 'Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (safePath !== '/index.html') {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (err2, data2) => {
          if (err2) return send(res, 404, 'Not Found');
          res.writeHead(200, { 'Content-Type': contentType(indexPath) });
          res.end(data2);
        });
        return;
      }
      return send(res, 404, 'Not Found');
    }
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`ERP Italy V2 rodando em http://localhost:${PORT}`);
});

