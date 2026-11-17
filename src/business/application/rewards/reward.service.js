import { findActiveRewards } from '../../../persistence/repositories/rewards/rewards.repository.js';

/**
 * Devolve as recompensas ativas.
 */
export async function listCatalog() {
  const rewards = await findActiveRewards();

  return rewards.map((r) => ({
    id: r.id,
    nome: r.nome,
    descricao: r.descricao,
    custoGold: r.custoGold,
    categoria: r.categoria,
    tipoBeneficio: r.tipoBeneficio,
    limiteSemanal: r.limiteSemanal,
  }));
}