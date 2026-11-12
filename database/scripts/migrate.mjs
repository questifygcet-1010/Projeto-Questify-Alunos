import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import connection from '../../server/persistence/postgres/config.js';

const here = dirname(fileURLToPath(import.meta.url));
export const defaultMigrationsDir = resolve(here, '..', 'migrations');
const LOCK_ID = 727274;

/** Lê pares NNN_nome.up.sql / NNN_nome.down.sql. Toda migration precisa de rollback. */
export async function loadMigrations(dir = defaultMigrationsDir) {
  const files = (await readdir(dir)).filter((file) => file.endsWith('.up.sql')).sort();
  const migrations = [];
  for (const file of files) {
    const match = /^(\d+)_(.+)\.up\.sql$/.exec(file);
    if (!match) throw new Error(`Nome de migration inválido: ${file}`);
    const [, version, name] = match;
    const up = await readFile(resolve(dir, file), 'utf8');
    let down;
    try {
      down = await readFile(resolve(dir, `${version}_${name}.down.sql`), 'utf8');
    } catch {
      throw new Error(`A migration ${version}_${name} não possui arquivo .down.sql (rollback).`);
    }
    migrations.push({ version, name, up, down, checksum: createHash('sha256').update(up).digest('hex') });
  }
  return migrations;
}

async function ensureTable(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

async function appliedMigrations(client) {
  const { rows } = await client.query('SELECT version, name, checksum FROM schema_migrations ORDER BY version');
  return rows;
}

async function inTransaction(client, sql, after) {
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await after();
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function withLock(client, fn) {
  await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
  try {
    return await fn();
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]);
  }
}

/** Aplica, em ordem, as migrations pendentes. Falha se uma migration já aplicada foi alterada. */
export async function migrateUp(client, { dir, log = console.log } = {}) {
  const migrations = await loadMigrations(dir);
  return withLock(client, async () => {
    await ensureTable(client);
    const applied = new Map((await appliedMigrations(client)).map((row) => [row.version, row]));
    for (const row of applied.values()) {
      const local = migrations.find((m) => m.version === row.version);
      if (!local) throw new Error(`Migration ${row.version}_${row.name} aplicada no banco, mas ausente em database/migrations.`);
      if (local.checksum !== row.checksum) {
        throw new Error(`Migration ${row.version}_${row.name} já foi aplicada e não pode ser modificada. Crie uma nova migration.`);
      }
    }
    const ran = [];
    for (const migration of migrations.filter((m) => !applied.has(m.version))) {
      await inTransaction(client, migration.up, () =>
        client.query('INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)', [migration.version, migration.name, migration.checksum]));
      log(`✔ aplicada ${migration.version}_${migration.name}`);
      ran.push(migration.version);
    }
    if (ran.length === 0) log('Nenhuma migration pendente.');
    return ran;
  });
}

/** Desfaz as últimas `steps` migrations aplicadas (padrão: 1). */
export async function migrateDown(client, { dir, steps = 1, log = console.log } = {}) {
  const migrations = await loadMigrations(dir);
  return withLock(client, async () => {
    await ensureTable(client);
    const applied = (await appliedMigrations(client)).reverse().slice(0, steps);
    const reverted = [];
    for (const row of applied) {
      const local = migrations.find((m) => m.version === row.version);
      if (!local) throw new Error(`Arquivo da migration ${row.version}_${row.name} não encontrado para rollback.`);
      await inTransaction(client, local.down, () => client.query('DELETE FROM schema_migrations WHERE version = $1', [row.version]));
      log(`↩ desfeita ${row.version}_${row.name}`);
      reverted.push(row.version);
    }
    if (reverted.length === 0) log('Nenhuma migration para desfazer.');
    return reverted;
  });
}

export async function migrationStatus(client, { dir } = {}) {
  const migrations = await loadMigrations(dir);
  await ensureTable(client);
  const applied = new Set((await appliedMigrations(client)).map((row) => row.version));
  return migrations.map((m) => ({ version: m.version, name: m.name, applied: applied.has(m.version) }));
}

async function main() {
  const command = process.argv[2] || 'up';
  const client = new pg.Client(connection.getConnectionConfig());
  await client.connect();
  try {
    if (command === 'up') await migrateUp(client);
    else if (command === 'down') await migrateDown(client, { steps: Number(process.argv[3] || 1) });
    else if (command === 'status') console.table(await migrationStatus(client));
    else throw new Error(`Comando desconhecido: ${command}. Use up, down [n] ou status.`);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Erro: ${error.message}`);
    if (error.code === '28P01' || error.code === 'ECONNREFUSED') console.error(`Conexão usada: ${connection.describeConnection()}`);
    process.exit(1);
  });
}
