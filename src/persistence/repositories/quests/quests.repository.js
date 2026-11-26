// CAMADA 3 — Persistência | Squad 2 (Quests)
// Somente SQL parametrizado e mapeamento linha -> objeto. NÃO decide regras de negócio:
// XP, status e validações chegam prontos da Camada 2.
import { getPool } from '../../postgres/pool.js';
import { ForeignKeyViolationError } from '../../../shared/errors.js';

// constraint do PostgreSQL -> nome lógico do campo (detalhe de persistência que não vaza para o negócio)
const FOREIGN_KEY_FIELDS = {
  quests_category_id_fkey: 'categoryId',
  quests_user_id_fkey: 'userId',
};

function translateDatabaseError(error) {
  if (error?.code === '23503' && FOREIGN_KEY_FIELDS[error.constraint_name]) {
    return new ForeignKeyViolationError(FOREIGN_KEY_FIELDS[error.constraint_name], error);
  }
  return error;
}

// BIGINT chega como string no driver `postgres`; DATE chega como Date.
const toIsoDate = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : String(value));

const toCategory = (row) => ({
  id: Number(row.id),
  name: row.name,
  difficulty: row.difficulty,
  baseXp: Number(row.base_xp),
});

const toQuest = (row) => ({
  id: Number(row.id),
  userId: Number(row.user_id),
  categoryId: Number(row.category_id),
  title: row.title,
  description: row.description,
  deadline: toIsoDate(row.deadline),
  xp: Number(row.xp),
  status: row.status,
  isGuild: row.is_guild,
  createdAt: row.created_at,
});

/** Categorias de quest para a seleção na tela. */
export async function listCategories(db = getPool()) {
  const rows = await db.unsafe('SELECT id, name, difficulty, base_xp FROM quest_categories ORDER BY base_xp, name');
  return rows.map(toCategory);
}

/** Categoria escolhida: fonte da dificuldade e do XP. */
export async function findCategoryById(categoryId, db = getPool()) {
  const rows = await db.unsafe('SELECT id, name, difficulty, base_xp FROM quest_categories WHERE id = $1', [categoryId]);
  return rows[0] ? toCategory(rows[0]) : null;
}

/** Insere a quest com os valores já decididos pela Camada 2 (usuário, XP e status inclusos). */
export async function insertQuest(tx, quest) {
  const { userId, categoryId, title, description, deadline, xp, status, isGuild } = quest;
  if (!userId || !status) throw new TypeError('quest.userId e quest.status são obrigatórios.');

  try {
    const rows = await tx.unsafe(
      `INSERT INTO quests (user_id, category_id, title, description, deadline, xp, status, is_guild)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, category_id, title, description, deadline, xp, status, is_guild, created_at`,
      [userId, categoryId, title, description, deadline, xp, status, isGuild],
    );
    return toQuest(rows[0]);
  } catch (error) {
    throw translateDatabaseError(error);
  }
}
