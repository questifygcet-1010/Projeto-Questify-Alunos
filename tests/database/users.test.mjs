import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestSchema } from '../helpers/db.mjs';
import { migrateUp, migrateDown, migrationStatus } from '../../database/scripts/migrate.mjs';
import { runSeed, SEED_PASSWORD } from '../../database/scripts/seed.mjs';
import password from '../../server/business/domain/auth/password.js';

const silent = { log: () => {} };
const insert = (client, values) =>
  client.query('INSERT INTO users (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING *', values);

test('schema do banco: estrutura, restrições, migrations e seeds', async (t) => {
  const env = await createTestSchema();
  const { client } = env;
  t.after(() => env.cleanup());

  await t.test('#139 C2/#141 C1: tabela com todos os campos e migration registrada', async () => {
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'users'`, [env.schema]);
    const columns = rows.map((r) => r.column_name).sort();
    assert.deepEqual(columns, ['ativo', 'criado_em', 'email', 'id', 'nome', 'papel', 'senha_hash']);
    const { rows: applied } = await client.query('SELECT version FROM schema_migrations');
    assert.deepEqual(applied.map((r) => r.version), ['001']);
  });

  await t.test('#139 C3: e-mail duplicado é recusado (inclusive com caixa diferente)', async () => {
    await insert(client, ['Ana', 'dup@questify.local', 'hash']);
    await assert.rejects(insert(client, ['Outra', 'dup@questify.local', 'hash']), { code: '23505' });
    await assert.rejects(insert(client, ['Outra', 'DUP@questify.local', 'hash']), { code: '23514' });
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM users WHERE email = 'dup@questify.local'`);
    assert.equal(rows[0].n, 1);
  });

  await t.test('#140 C1: campos obrigatórios e limite de 120 caracteres no nome', async () => {
    await assert.rejects(client.query(`INSERT INTO users (email, senha_hash) VALUES ('a@q.local','h')`), { code: '23502', column: 'nome' });
    await assert.rejects(client.query(`INSERT INTO users (nome, senha_hash) VALUES ('A','h')`), { code: '23502', column: 'email' });
    await assert.rejects(client.query(`INSERT INTO users (nome, email) VALUES ('A','b@q.local')`), { code: '23502', column: 'senha_hash' });
    await assert.rejects(insert(client, ['x'.repeat(121), 'c@q.local', 'h']));
  });

  await t.test('#140 C2/C3: data de cadastro, status e papel padrão', async () => {
    const { rows } = await insert(client, ['Padrão', 'padrao@q.local', 'h']);
    assert.equal(rows[0].ativo, true);
    assert.equal(rows[0].papel, 'estudante');
    assert.ok(Math.abs(Date.now() - rows[0].criado_em.getTime()) < 60_000);
    await assert.rejects(client.query(`INSERT INTO users (nome,email,senha_hash,papel) VALUES ('A','p@q.local','h','root')`), { code: '23514' });
  });

  await t.test('#139 C4 e #140 C5: id estável e desativação lógica preservam o registro', async () => {
    const { rows } = await insert(client, ['Estável', 'estavel@q.local', 'h']);
    const id = rows[0].id;
    await client.query(`UPDATE users SET nome = 'Novo Nome', papel = 'monitor', ativo = FALSE WHERE id = $1`, [id]);
    const { rows: after } = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    assert.equal(after.length, 1);
    assert.equal(after[0].id, id);
    assert.equal(after[0].ativo, false);
    assert.equal(after[0].nome, 'Novo Nome');
  });

  await t.test('#141 C3/C4: seeds criam 3 papéis com hash e são idempotentes', async () => {
    await client.query('TRUNCATE users CASCADE');
    assert.equal(await runSeed(client, silent), 3);
    assert.equal(await runSeed(client, silent), 0);
    const { rows } = await client.query('SELECT papel, senha_hash FROM users ORDER BY papel');
    assert.deepEqual(rows.map((r) => r.papel), ['administrador', 'estudante', 'monitor']);
    for (const row of rows) {
      assert.notEqual(row.senha_hash, SEED_PASSWORD);
      assert.equal(await password.verifyPassword(SEED_PASSWORD, row.senha_hash), true);
    }
  });

  await t.test('#141 C2: rollback desfaz a última migration e permite reaplicar', async () => {
    assert.deepEqual(await migrateDown(client, silent), ['001']);
    const { rows } = await client.query(`SELECT to_regclass($1 || '.users') AS t`, [env.schema]);
    assert.equal(rows[0].t, null);
    assert.equal((await migrationStatus(client))[0].applied, false);
    assert.deepEqual(await migrateUp(client, silent), ['001']);
    assert.deepEqual(await migrateUp(client, silent), []);
  });
});
