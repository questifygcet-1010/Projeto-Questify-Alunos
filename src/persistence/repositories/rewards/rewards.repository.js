import { pool } from '../../postgres/pool.js';

const COLUNAS = `id, codigo, nome, descricao, custo_gold, categoria,
                 tipo_beneficio, limite_semanal, ativa`;

// Converte uma linha do banco (snake_case) para o formato do código (camelCase).
function toReward(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    nome: row.nome,
    descricao: row.descricao,
    custoGold: row.custo_gold,
    categoria: row.categoria,
    tipoBeneficio: row.tipo_beneficio,
    limiteSemanal: row.limite_semanal, // null = sem limite
    ativa: row.ativa,
  };
}

/**
 * Lista só as recompensas ativas.
 * Usada pela tela (via RewardService).
 */
export async function findActiveRewards() {
  const { rows } = await pool.query(
    `SELECT ${COLUNAS} FROM rewards WHERE ativa = true ORDER BY codigo`,
  );
  return rows.map(toReward);
}

/**
 * Cria a recompensa ou atualiza se o `codigo` já existir.
 * Sempre deixa `ativa = true` (reativa o que voltou ao código).
 * @param reward Objeto do REWARD_CATALOG
 * @param tx     Client da transação aberta pelo seed
 */
export async function upsertReward(reward, tx) {
  await tx.query(
    `INSERT INTO rewards
       (codigo, nome, descricao, custo_gold, categoria,
        tipo_beneficio, limite_semanal, ativa)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     ON CONFLICT (codigo) DO UPDATE SET
       nome           = EXCLUDED.nome,
       descricao      = EXCLUDED.descricao,
       custo_gold     = EXCLUDED.custo_gold,
       categoria      = EXCLUDED.categoria,
       tipo_beneficio = EXCLUDED.tipo_beneficio,
       limite_semanal = EXCLUDED.limite_semanal,
       ativa          = true`,
    [
      reward.codigo,
      reward.nome,
      reward.descricao,
      reward.custoGold,
      reward.categoria,
      reward.tipoBeneficio,
      reward.limiteSemanal,
    ],
  );
}

/**
 * Marca como inativas as recompensas que não estão mais no código.
 * Nunca usa DELETE: o histórico de resgates continua apontando para elas.
 * @param codigos Lista de `codigo` que continuam no código
 * @param tx      Client da transação aberta pelo seed
 * @returns quantidade de recompensas inativadas
 */
export async function deactivateMissing(codigos, tx) {
  const { rowCount } = await tx.query(
    `UPDATE rewards
        SET ativa = false
      WHERE ativa = true
        AND codigo <> ALL($1::text[])`,
    [codigos],
  );
  return rowCount;
}