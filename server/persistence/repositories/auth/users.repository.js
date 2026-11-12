/** Repositório de usuários (Squad 1). `db` é um Pool ou um client de transação (`tx`). */

const PUBLIC_COLUMNS = 'id, nome, email, papel, ativo, criado_em';

function mapUser(row) {
  if (!row) return null;
  const user = {
    id: row.id,
    nome: row.nome,
    email: row.email,
    papel: row.papel,
    ativo: row.ativo,
    criadoEm: row.criado_em,
  };
  if (row.senha_hash !== undefined) user.senhaHash = row.senha_hash;
  return user;
}

/** `papel` opcional: quando ausente o banco aplica o padrão `estudante`. */
async function create(db, { nome, email, senhaHash, papel }) {
  const { rows } = await db.query(
    `INSERT INTO users (nome, email, senha_hash, papel)
     VALUES ($1, $2, $3, COALESCE($4, 'estudante'))
     RETURNING ${PUBLIC_COLUMNS}`,
    [nome, email, senhaHash, papel ?? null],
  );
  return mapUser(rows[0]);
}

async function findByEmail(db, email) {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS}, senha_hash FROM users WHERE email = $1 LIMIT 1`, [email]);
  return mapUser(rows[0]);
}

async function findById(db, id) {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1 LIMIT 1`, [id]);
  return mapUser(rows[0]);
}

/** Desativação lógica: altera o status sem apagar o usuário. */
async function setAtivo(db, id, ativo) {
  const { rows } = await db.query(`UPDATE users SET ativo = $2 WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`, [id, ativo]);
  return mapUser(rows[0]);
}

module.exports = { create, findByEmail, findById, setAtivo };
