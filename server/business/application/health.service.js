const { getPool } = require('../../persistence/postgres/pool');

async function checkDatabase() {
  await getPool().query('SELECT 1');
}

module.exports = { checkDatabase };
