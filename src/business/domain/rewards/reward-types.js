// CAMADA 2 — Negócio / subcamada Domínio | Squad 4
// Constantes do catálogo FIXO de recompensas (itens digitais, sem estoque).
// Cenário 2: mensagens indicam exatamente qual campo está inválido.

export const REWARD_CATEGORIES = Object.freeze({
  BENEFIT: 'beneficio',
  COSMETIC: 'cosmetico',
  COUPON: 'cupom',
  GIFT: 'brinde',
});

export const REWARD_CATEGORY_VALUES = Object.freeze(Object.values(REWARD_CATEGORIES));

// Cenário 2: só entram no catálogo efeitos declarados/implementados.
export const REWARD_EFFECT_TYPES = Object.freeze({
  DEADLINE_EXTENSION: 'deadline_extension',
  DOUBLE_XP: 'double_xp',
  STREAK_PROTECTION: 'streak_protection',
  STREAK_RESTORE: 'streak_restore',
});

export const REWARD_EFFECT_TYPE_VALUES = Object.freeze(Object.values(REWARD_EFFECT_TYPES));

/** `null` representa "sem limite" de compras semanais. */
export const UNLIMITED_WEEKLY_LIMIT = null;

export const REWARD_ERROR_CODES = Object.freeze({
  CODE_REQUIRED: 'REWARD_CODE_REQUIRED',
  NAME_REQUIRED: 'REWARD_NAME_REQUIRED',
  DESCRIPTION_REQUIRED: 'REWARD_DESCRIPTION_REQUIRED',
  PRICE_INVALID: 'REWARD_PRICE_INVALID',
  CATEGORY_INVALID: 'REWARD_CATEGORY_INVALID',
  EFFECT_TYPE_INVALID: 'REWARD_EFFECT_TYPE_INVALID',
  WEEKLY_LIMIT_INVALID: 'REWARD_WEEKLY_LIMIT_INVALID',
  CODE_DUPLICATED: 'REWARD_CODE_DUPLICATED',
  NAME_DUPLICATED: 'REWARD_NAME_DUPLICATED',
});

export const REWARD_MESSAGES = Object.freeze({
  CODE_REQUIRED: 'O código da recompensa é obrigatório.',
  NAME_REQUIRED: 'O nome da recompensa é obrigatório.',
  DESCRIPTION_REQUIRED: 'A descrição da recompensa é obrigatória.',
  PRICE_INVALID: 'O preço deve ser um inteiro maior que zero (em Gold).',
  CATEGORY_INVALID: 'A categoria da recompensa é inválida.',
  EFFECT_TYPE_INVALID: 'O tipo de efeito da recompensa não está implementado.',
  WEEKLY_LIMIT_INVALID: 'O limite semanal deve ser um inteiro maior que zero ou "sem limite".',
  CODE_DUPLICATED: 'Já existe uma recompensa com este código no catálogo.',
  NAME_DUPLICATED: 'Já existe uma recompensa com este nome no catálogo.',
});

export const isUnlimitedWeeklyLimit = (value) => value === UNLIMITED_WEEKLY_LIMIT;
