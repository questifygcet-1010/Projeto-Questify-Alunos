import pg from 'pg';
import { randomBytes } from 'node:crypto';
import connection from '../../server/persistence/postgres/config.js';
import { migrateUp } from '../../database/scripts/migrate.mjs';

/** Cria um schema PostgreSQL isolado, aplica as migrations nele e devolve um client já apontado para ele. */
export async function createTestSchema({ migrate = true } = {}) {
  const schema = `test_${randomBytes(6).toString('hex')}`;
  const baseUrl = new URL(process.env.DATABASE_URL.trim());
  const options = `-c search_path=${schema}`;
  const config = { ...connection.getConnectionConfig(), options };
  const admin = new pg.Client(connection.getConnectionConfig());
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${schema}`);
  await admin.end();

  const client = new pg.Client(config);
  await client.connect();
  if (migrate) await migrateUp(client, { log: () => {} });

  baseUrl.searchParams.set('options', options);
  const url = baseUrl;

  return {
    schema,
    client,
    url: url.toString(),
    async cleanup() {
      await client.end();
      const cleaner = new pg.Client(connection.getConnectionConfig());
      await cleaner.connect();
      await cleaner.query(`DROP SCHEMA ${schema} CASCADE`);
      await cleaner.end();
    },
  };
}
