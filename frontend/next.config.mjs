import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const isDev = process.env.NODE_ENV === 'development';
const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Produção: export estático em frontend/out (servido pela Vercel com preset "Other"
 * e pelo backend/server.js). As rotas /api continuam sendo as funções da pasta api/.
 *
 * Desenvolvimento: `next dev` com rewrite de /api para o backend local (porta 8000)
 * e os redirecionamentos dos links antigos do Vite. Em produção esses dois itens
 * ficam no vercel.json e no backend/server.js, porque o export estático não os aplica.
 */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  agentRules: false, // não gerar frontend/AGENTS.md no `next dev`
  turbopack: { root: repoRoot },
  ...(isDev
    ? {
        async rewrites() {
          return [{ source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' }];
        },
        async redirects() {
          return [
            { source: '/index.html', destination: '/login', permanent: false },
            { source: '/register.html', destination: '/register', permanent: false },
          ];
        },
      }
    : { output: 'export' }),
};

export default nextConfig;
