const { Pool } = require('pg');
const { getConnectionConfig } = require('./config');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      ...getConnectionConfig(),
      // Em funções serverless cada instância deve segurar poucas conexões.
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
    pool.on('error', (error) => console.error('Questify: erro em conexão ociosa do pool:', error.message));
  }
  return pool;
}

async function closePool() {
  if (pool) {
    const current = pool;
    pool = undefined;
    await current.end();
  }
}

module.exports = { getPool, closePool };
