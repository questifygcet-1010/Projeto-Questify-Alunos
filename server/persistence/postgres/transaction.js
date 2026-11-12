const { getPool } = require('./pool');

/** Executa `fn(tx)` em uma transação usando um único client do pool, do BEGIN ao COMMIT/ROLLBACK. */
async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignora falha no rollback; o erro original é mais relevante
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { withTransaction };
