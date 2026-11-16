// CAMADA 2 — Negócio / subcamada Domínio | Squad 4
// Catálogo FIXO de recompensas definido no código (sem estoque e sem exclusão).
// Cenário 1: toda recompensa expõe nome, descrição, preço, categoria, efeito e limite semanal.
// Cenário 2: definição inválida não é registrada e gera erro com o campo afetado.
// Cenário 3: código ou nome repetido não é registrado.
import {
  REWARD_CATEGORIES,
  REWARD_CATEGORY_VALUES,
  REWARD_EFFECT_TYPES,
  REWARD_EFFECT_TYPE_VALUES,
  REWARD_ERROR_CODES,
  REWARD_MESSAGES,
  UNLIMITED_WEEKLY_LIMIT,
} from './reward-types.js';

// Cenário 1: catálogo inicial fixo (itens apenas declarados; efeito/compra ficam para #71).
export const REWARD_CATALOG = Object.freeze([
  Object.freeze({
    code: 'prazo-extra-24h',
    name: 'Prorrogação de prazo (24 h)',
    description: 'Adiciona 24 horas ao prazo de uma quest.',
    price: 150,
    category: REWARD_CATEGORIES.BENEFIT,
    effectType: REWARD_EFFECT_TYPES.DEADLINE_EXTENSION,
    weeklyLimit: 1,
  }),
  Object.freeze({
    code: 'xp-dobrado-24h',
    name: 'XP dobrado (24 h)',
    description: 'Duplica o XP recebido nas próximas 24 horas.',
    price: 200,
    category: REWARD_CATEGORIES.BENEFIT,
    effectType: REWARD_EFFECT_TYPES.DOUBLE_XP,
    weeklyLimit: 1,
  }),
  Object.freeze({
    code: 'protecao-sequencia',
    name: 'Proteção de sequência',
    description: 'Impede a perda da sequência de atividades.',
    price: 100,
    category: REWARD_CATEGORIES.BENEFIT,
    effectType: REWARD_EFFECT_TYPES.STREAK_PROTECTION,
    weeklyLimit: 2,
  }),
  Object.freeze({
    code: 'recuperar-sequencia',
    name: 'Recuperar sequência',
    description: 'Recupera imediatamente a sequência de atividades.',
    price: 250,
    category: REWARD_CATEGORIES.BENEFIT,
    effectType: REWARD_EFFECT_TYPES.STREAK_RESTORE,
    weeklyLimit: 1,
  }),
]);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
// Cenário 2: preço sempre inteiro e maior que zero.
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;
const normalizeKey = (value) => value.trim().toLowerCase();
const buildError = (index, code, field, message) => Object.freeze({ index, code, field, message });

/** Cenário 2: valida uma definição e devolve os erros de campo encontrados. */
export function validateRewardDefinition(definition) {
  const errors = [];

  if (!isNonEmptyString(definition?.code)) {
    errors.push([REWARD_ERROR_CODES.CODE_REQUIRED, 'code', REWARD_MESSAGES.CODE_REQUIRED]);
  }
  if (!isNonEmptyString(definition?.name)) {
    errors.push([REWARD_ERROR_CODES.NAME_REQUIRED, 'name', REWARD_MESSAGES.NAME_REQUIRED]);
  }
  if (!isNonEmptyString(definition?.description)) {
    errors.push([REWARD_ERROR_CODES.DESCRIPTION_REQUIRED, 'description', REWARD_MESSAGES.DESCRIPTION_REQUIRED]);
  }
  if (!isPositiveInteger(definition?.price)) {
    errors.push([REWARD_ERROR_CODES.PRICE_INVALID, 'price', REWARD_MESSAGES.PRICE_INVALID]);
  }
  if (!REWARD_CATEGORY_VALUES.includes(definition?.category)) {
    errors.push([REWARD_ERROR_CODES.CATEGORY_INVALID, 'category', REWARD_MESSAGES.CATEGORY_INVALID]);
  }
  if (!REWARD_EFFECT_TYPE_VALUES.includes(definition?.effectType)) {
    errors.push([REWARD_ERROR_CODES.EFFECT_TYPE_INVALID, 'effectType', REWARD_MESSAGES.EFFECT_TYPE_INVALID]);
  }
  // `null` = sem limite; qualquer outro valor precisa ser inteiro > 0.
  if (definition?.weeklyLimit !== UNLIMITED_WEEKLY_LIMIT && !isPositiveInteger(definition?.weeklyLimit)) {
    errors.push([REWARD_ERROR_CODES.WEEKLY_LIMIT_INVALID, 'weeklyLimit', REWARD_MESSAGES.WEEKLY_LIMIT_INVALID]);
  }

  return errors;
}

/**
 * Cenários 1, 2 e 3: constrói o catálogo a partir das definições fixas.
 * Itens inválidos/duplicados são ignorados; `errors` diz qual campo falhou.
 */
export function buildRewardCatalog(definitions = REWARD_CATALOG) {
  const list = Array.isArray(definitions) ? definitions : [];
  const rewards = [];
  const errors = [];
  const codes = new Set();
  const names = new Set();

  list.forEach((definition, index) => {
    const fieldErrors = validateRewardDefinition(definition);
    if (fieldErrors.length > 0) {
      for (const [code, field, message] of fieldErrors) {
        errors.push(buildError(index, code, field, message));
      }
      return;
    }

    const code = definition.code.trim();
    const name = definition.name.trim();
    const codeKey = normalizeKey(code);
    const nameKey = normalizeKey(name);

    // Cenário 3: o primeiro item válido vence; o repetido não é registrado.
    if (codes.has(codeKey)) {
      errors.push(buildError(index, REWARD_ERROR_CODES.CODE_DUPLICATED, 'code', REWARD_MESSAGES.CODE_DUPLICATED));
      return;
    }
    if (names.has(nameKey)) {
      errors.push(buildError(index, REWARD_ERROR_CODES.NAME_DUPLICATED, 'name', REWARD_MESSAGES.NAME_DUPLICATED));
      return;
    }

    codes.add(codeKey);
    names.add(nameKey);
    // Cenário 1: recompensa registrada com todos os campos do contrato e sempre ativa.
    rewards.push(Object.freeze({
      code,
      name,
      description: definition.description.trim(),
      price: definition.price,
      category: definition.category,
      effectType: definition.effectType,
      weeklyLimit: definition.weeklyLimit,
      active: true,
    }));
  });

  return { rewards: Object.freeze(rewards), errors: Object.freeze(errors) };
}
