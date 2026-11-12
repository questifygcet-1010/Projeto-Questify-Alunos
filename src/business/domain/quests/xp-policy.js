// CAMADA 2 — Negócio / subcamada Domínio | Squad 2 (Quests)
// Regra de recompensa: o XP vem da categoria; quest de guilda vale 3x. Sem I/O.

export const GUILD_XP_MULTIPLIER = 3;

/** XP gravado na quest: o da categoria, multiplicado em quest de guilda. */
export function calculateQuestXp(baseXp, isGuild = false) {
  if (!Number.isSafeInteger(baseXp) || baseXp <= 0) {
    throw new TypeError('baseXp deve ser um inteiro positivo.');
  }
  return isGuild ? baseXp * GUILD_XP_MULTIPLIER : baseXp;
}
