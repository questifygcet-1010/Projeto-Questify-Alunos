const { createServer } = require('node:http');
const { createReadStream, existsSync, statSync } = require('node:fs');
const { extname, resolve, sep } = require('node:path');
const routes = require('../server/presentation/routes');
const { json } = require('../server/presentation/http');
const { closePool } = require('../server/persistence/postgres/pool');

const frontendRoot = resolve(__dirname, '..', 'frontend', 'dist');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/** Servidor local: mesma tabela de rotas da Vercel + arquivos estáticos do frontend (frontend/dist). */
function createAppServer() {
  return createServer(async (req, res) => {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      res.writeHead(400);
      return res.end();
    }

    if (url.pathname.startsWith('/api/')) {
      const handler = routes[url.pathname];
      if (!handler) return json(res, 404, { message: 'Rota não encontrada.', code: 'NAO_ENCONTRADO' });
      return handler(req, res);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }

    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = resolve(frontendRoot, relativePath);
    if (filePath !== frontendRoot && !filePath.startsWith(frontendRoot + sep)) {
      res.writeHead(403);
      return res.end();
    }
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      res.writeHead(404);
      return res.end('Not found (execute `npm run build` para gerar o frontend).');
    }
    res.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
    if (req.method === 'HEAD') return res.end();
    createReadStream(filePath).pipe(res);
  });
}

module.exports = { createAppServer };

if (require.main === module) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 8000);
  const server = createAppServer();
  server.listen(port, host, () => console.log(`Questify em http://${host}:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => closePool().finally(() => process.exit(0))));
  }
}
