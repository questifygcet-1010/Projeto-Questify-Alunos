import { existsSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import pg from 'pg';
import connection from '../../server/persistence/postgres/config.js';
import { migrateUp } from './migrate.mjs';
import { assertSeedAllowed, runSeed } from './seed.mjs';

const require = createRequire(import.meta.url);

// 1. Garante que o .env exista a partir do .env.example
const rootDir = resolve(import.meta.dirname, '..', '..');
const envPath = resolve(rootDir, '.env');
const envExamplePath = resolve(rootDir, '.env.example');
if (!existsSync(envPath) && existsSync(envExamplePath)) {
  copyFileSync(envExamplePath, envPath);
  process.loadEnvFile?.(envPath);
  console.log('✔ Arquivo .env criado automaticamente a partir de .env.example.');
}

async function canConnect(config) {
  const client = new pg.Client({ ...config, connectionTimeoutMillis: 2500 });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

async function startEmbeddedFallback(config) {
  console.log('⚠ Container Docker não detectado na porta configurada.');
  console.log('→ Iniciando PostgreSQL portátil local (fallback sem Docker)...');
  let EmbeddedPostgres;
  try {
    ({ default: EmbeddedPostgres } = await import('embedded-postgres'));
  } catch {
    console.log('→ Baixando binário portátil do PostgreSQL pela primeira vez (aguarde alguns segundos)...');
    execSync('npm install --no-save embedded-postgres@^16.1.0-beta.15', { cwd: rootDir, stdio: 'inherit' });
    ({ default: EmbeddedPostgres } = await import('embedded-postgres'));
  }
  const dataDir = resolve(rootDir, '.local-pg', 'data');
  const embedded = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: config.user || 'questify',
    password: config.password || 'troque_esta_senha_de_desenvolvimento',
    port: config.port || 55432,
    persistent: true,
  });

  if (!existsSync(resolve(dataDir, 'PG_VERSION'))) {
    await embedded.initialise();
  }
  await embedded.start();
  try {
    await embedded.createDatabase(config.database || 'questify');
  } catch {
    // banco já existe
  }
  console.log(`✔ PostgreSQL portátil ativo em 127.0.0.1:${config.port || 55432}`);
  return embedded;
}

async function main() {
  const config = connection.getConnectionConfig();
  let embedded = null;

  if (await canConnect(config)) {
    console.log(`✔ Conectado ao PostgreSQL (Docker/local) em ${config.host}:${config.port}.`);
  } else {
    embedded = await startEmbeddedFallback(config);
  }

  // 2. Aplica migrations e seeds automaticamente
  const client = new pg.Client(config);
  await client.connect();
  try {
    await migrateUp(client);
    try {
      assertSeedAllowed();
      await runSeed(client);
    } catch (seedErr) {
      console.log(`ℹ Seeds ignorados: ${seedErr.message}`);
    }
  } finally {
    await client.end();
  }

  // 3. Garante que o build do frontend exista
  if (!existsSync(resolve(rootDir, 'frontend', 'dist', 'index.html'))) {
    console.log('→ Compilando frontend...');
    const { build } = await import('vite');
    await build({ root: resolve(rootDir, 'frontend'), configFile: resolve(rootDir, 'frontend', 'vite.config.js') });
  }

  // 4. Inicia o servidor HTTP da aplicação
  const { createAppServer } = require('../../backend/server.js');
  const { closePool } = require('../../server/persistence/postgres/pool.js');
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 8000);
  const server = createAppServer();

  server.listen(port, host, () => {
    console.log(`\n🚀 Questify pronto em http://${host}:${port}`);
    console.log('   Usuários de teste (senha: Questify@123):');
    console.log('   - aluno.teste@questify.local');
    console.log('   - monitor.teste@questify.local');
    console.log('   - admin.teste@questify.local\n');
  });

  const shutdown = async () => {
    server.close();
    await closePool().catch(() => {});
    if (embedded) await embedded.stop().catch(() => {});
    process.exit(0);
  };
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, shutdown);
}

main().catch((error) => {
  console.error('Erro ao iniciar o ambiente local:', error.message);
  process.exit(1);
});
