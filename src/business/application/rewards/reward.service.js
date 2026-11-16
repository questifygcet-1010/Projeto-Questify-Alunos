// CAMADA 2 — Negócio / subcamada Aplicação | Squad 4
// Caso de uso do catálogo fixo: entrega o resultado já validado pelo domínio.
// Cenário 1: getCatalog() devolve cada recompensa com todos os campos.
// Cenários 2 e 3: erros de definição/duplicidade acompanham o resultado.
import { REWARD_CATALOG, buildRewardCatalog } from '../../domain/rewards/reward-catalog.js';

/** Fábrica com catálogo injetável (permite testar cenários inválidos). */
export function createRewardService({ catalog = REWARD_CATALOG } = {}) {
  function getCatalog() {
    return buildRewardCatalog(catalog);
  }

  /** Atalho para consumidores que só precisam das recompensas válidas. */
  function listRewards() {
    return getCatalog().rewards;
  }

  return { getCatalog, listRewards };
}

const defaultService = createRewardService();

export const getCatalog = defaultService.getCatalog;
export const listRewards = defaultService.listRewards;
