import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardService } from '../../../src/business/application/rewards/reward.service.js';
import { REWARD_CATALOG } from '../../../src/business/domain/rewards/reward-catalog.js';
import { REWARD_CATEGORIES, REWARD_EFFECT_TYPES } from '../../../src/business/domain/rewards/reward-types.js';

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

// Cenário 1 — RewardService entrega o catálogo fixo completo.
test('Cenário 1: RewardService retorna todas as recompensas do catálogo', () => {
  const { rewards, errors } = createRewardService().getCatalog();

  assert.equal(errors.length, 0);
  assert.equal(rewards.length, REWARD_CATALOG.length);
  assert.deepEqual(
    rewards.map((reward) => reward.code),
    REWARD_CATALOG.map((reward) => reward.code),
  );
});

// Cenário 1 — atalho entrega apenas as recompensas válidas.
test('Cenário 1: listRewards devolve as recompensas válidas', () => {
  const service = createRewardService();
  assert.deepEqual(service.listRewards(), service.getCatalog().rewards);
});

// Cenários 2 e 3 — o service expõe os erros e não registra os itens afetados.
test('Cenários 2 e 3: RewardService propaga erros de campo e duplicidade', () => {
  const catalog = [
    makeReward({ code: 'valida', name: 'Válida' }),
    makeReward({ code: 'valida', name: 'Código repetido' }),
    makeReward({ code: 'invalida', name: '', price: 0, effectType: 'nao_existe', weeklyLimit: 0 }),
  ];

  const { rewards, errors } = createRewardService({ catalog }).getCatalog();

  assert.equal(rewards.length, 1);
  assert.equal(rewards[0].code, 'valida');

  const fields = errors.map((error) => error.field);
  assert.ok(fields.includes('code'));
  assert.ok(fields.includes('name'));
  assert.ok(fields.includes('price'));
  assert.ok(fields.includes('effectType'));
  assert.ok(fields.includes('weeklyLimit'));
});
