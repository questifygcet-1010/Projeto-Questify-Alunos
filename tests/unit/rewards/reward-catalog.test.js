import test from 'node:test';
import assert from 'node:assert/strict';
import { REWARD_CATALOG, buildRewardCatalog } from '../../../src/business/domain/rewards/reward-catalog.js';
import {
  REWARD_CATEGORIES,
  REWARD_EFFECT_TYPES,
  REWARD_CATEGORY_VALUES,
  REWARD_EFFECT_TYPE_VALUES,
  UNLIMITED_WEEKLY_LIMIT,
} from '../../../src/business/domain/rewards/reward-types.js';

const makeReward = (overrides = {}) => ({
  code: 'recompensa-valida',
  name: 'Recompensa válida',
  description: 'Descrição válida.',
  price: 100,
  category: REWARD_CATEGORIES.BENEFIT,
  effectType: REWARD_EFFECT_TYPES.DOUBLE_XP,
  weeklyLimit: 1,
  ...overrides,
});

// Cenário 1 — catálogo carregado com sucesso.
test('Cenário 1: catálogo fixo retorna todas as recompensas com os campos exigidos', () => {
  const { rewards, errors } = buildRewardCatalog();

  assert.equal(errors.length, 0);
  assert.equal(rewards.length, REWARD_CATALOG.length);

  for (const reward of rewards) {
    assert.equal(typeof reward.code, 'string');
    assert.ok(reward.code.length > 0);
    assert.equal(typeof reward.name, 'string');
    assert.ok(reward.name.length > 0);
    assert.equal(typeof reward.description, 'string');
    assert.ok(reward.description.length > 0);
    assert.ok(Number.isInteger(reward.price) && reward.price > 0);
    assert.ok(REWARD_CATEGORY_VALUES.includes(reward.category));
    assert.ok(REWARD_EFFECT_TYPE_VALUES.includes(reward.effectType));
    assert.ok(reward.weeklyLimit === UNLIMITED_WEEKLY_LIMIT
      || (Number.isInteger(reward.weeklyLimit) && reward.weeklyLimit > 0));
    assert.equal(reward.active, true);
  }

  const codes = rewards.map((reward) => reward.code.toLowerCase());
  const names = rewards.map((reward) => reward.name.toLowerCase());
  assert.equal(new Set(codes).size, codes.length);
  assert.equal(new Set(names).size, names.length);
});

// Cenário 2 — preço inválido não registra e aponta o campo.
test('Cenário 2: preço menor/igual a zero, não inteiro ou ausente não é registrado', () => {
  for (const price of [0, -1, -0.5, 10.5, '100', null, undefined, Number.NaN]) {
    const { rewards, errors } = buildRewardCatalog([makeReward({ price })]);
    assert.equal(rewards.length, 0, `preço inválido aceito: ${String(price)}`);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'price');
    assert.equal(errors[0].code, 'REWARD_PRICE_INVALID');
  }
});

// Cenário 2 — nome vazio não registra e aponta o campo.
test('Cenário 2: nome vazio ou em branco não é registrado', () => {
  for (const name of ['', '   ', null, undefined]) {
    const { rewards, errors } = buildRewardCatalog([makeReward({ name })]);
    assert.equal(rewards.length, 0, `nome inválido aceito: ${String(name)}`);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'name');
    assert.equal(errors[0].code, 'REWARD_NAME_REQUIRED');
  }
});

// Cenário 2 — limite semanal inválido não registra; "sem limite" é válido.
test('Cenário 2: limite semanal inválido não é registrado e null representa "sem limite"', () => {
  for (const weeklyLimit of [0, -1, 1.5, '1', undefined]) {
    const { rewards, errors } = buildRewardCatalog([makeReward({ weeklyLimit })]);
    assert.equal(rewards.length, 0, `limite inválido aceito: ${String(weeklyLimit)}`);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'weeklyLimit');
    assert.equal(errors[0].code, 'REWARD_WEEKLY_LIMIT_INVALID');
  }

  const unlimited = buildRewardCatalog([makeReward({ weeklyLimit: null })]);
  assert.equal(unlimited.errors.length, 0);
  assert.equal(unlimited.rewards.length, 1);
  assert.equal(unlimited.rewards[0].weeklyLimit, null);
});

// Cenário 2 — efeito não implementado não registra e aponta o campo.
test('Cenário 2: tipo de efeito desconhecido não é registrado', () => {
  for (const effectType of ['efeito_inexistente', '', null, undefined]) {
    const { rewards, errors } = buildRewardCatalog([makeReward({ effectType })]);
    assert.equal(rewards.length, 0, `efeito inválido aceito: ${String(effectType)}`);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'effectType');
    assert.equal(errors[0].code, 'REWARD_EFFECT_TYPE_INVALID');
  }
});

// Cenário 2 — categoria inválida não registra e aponta o campo.
test('Cenário 2: categoria desconhecida não é registrada', () => {
  const { rewards, errors } = buildRewardCatalog([makeReward({ category: 'categoria_inexistente' })]);
  assert.equal(rewards.length, 0);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, 'category');
});

// Cenário 2 — o item inválido é ignorado, mas os válidos permanecem.
test('Cenário 2: recompensa inválida não impede as demais de serem registradas', () => {
  const { rewards, errors } = buildRewardCatalog([
    makeReward({ code: 'valida-1', name: 'Válida 1' }),
    makeReward({ code: 'invalida', name: 'Inválida', price: 0 }),
    makeReward({ code: 'valida-2', name: 'Válida 2' }),
  ]);

  assert.equal(rewards.length, 2);
  assert.deepEqual(rewards.map((reward) => reward.code), ['valida-1', 'valida-2']);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, 'price');
});

// Cenário 3 — código duplicado não registra.
test('Cenário 3: código duplicado não é registrado', () => {
  const { rewards, errors } = buildRewardCatalog([
    makeReward({ code: 'codigo-repetido', name: 'Primeira' }),
    makeReward({ code: 'codigo-repetido', name: 'Segunda' }),
  ]);

  assert.equal(rewards.length, 1);
  assert.equal(rewards[0].name, 'Primeira');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, 'code');
  assert.equal(errors[0].code, 'REWARD_CODE_DUPLICATED');
});

// Cenário 3 — nome duplicado não registra (sem diferenciar caixa).
test('Cenário 3: nome duplicado não é registrado', () => {
  const { rewards, errors } = buildRewardCatalog([
    makeReward({ code: 'codigo-1', name: 'XP Dobrado' }),
    makeReward({ code: 'codigo-2', name: 'xp dobrado' }),
  ]);

  assert.equal(rewards.length, 1);
  assert.equal(rewards[0].code, 'codigo-1');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, 'name');
  assert.equal(errors[0].code, 'REWARD_NAME_DUPLICATED');
});
