/** Repositório de sessões (Squad 1). Apenas o hash do token é persistido. */

async function create(db, { tokenHash, userId, expiresAt }) {
  await db.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenHash, userId, expiresAt]);
}

/** Retorna o usuário dono de uma sessão não expirada, ou null. `nowSeconds` em epoch (s). */
async function findUserByTokenHash(db, tokenHash, nowSeconds) {
  const { rows } = await db.query(
    `SELECT u.id, u.nome, u.email, u.papel, u.ativo, u.criado_em
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > $2
      LIMIT 1`,
    [tokenHash, nowSeconds],
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, nome: row.nome, email: row.email, papel: row.papel, ativo: row.ativo, criadoEm: row.criado_em };
}

async function remove(db, tokenHash) {
  await db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
}

async function removeExpired(db, nowSeconds) {
  await db.query('DELETE FROM sessions WHERE expires_at <= $1', [nowSeconds]);
}

module.exports = { create, findUserByTokenHash, remove, removeExpired };
