import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUEST_MESSAGES,
  isValidIsoDate,
  validateQuestInput,
} from '../../../src/business/domain/quests/quest-policy.js';
import { GUILD_XP_MULTIPLIER, calculateQuestXp } from '../../../src/business/domain/quests/xp-policy.js';

const TODAY = '2026-11-12';
const valid = { categoryId: 3, title: 'Resumo do capítulo 6', description: 'Ler e resumir', deadline: '2026-11-20' };

test('entrada válida é normalizada e só leva os campos personalizáveis', () => {
  const { value, errors } = validateQuestInput(
    { ...valid, title: '  Resumo   do capítulo 6 ', xp: 9999, difficulty: 'facil', status: 'concluida', userId: 7 },
    TODAY,
  );
  assert.equal(errors, null);
  assert.deepEqual(value, { categoryId: 3, title: 'Resumo do capítulo 6', description: 'Ler e resumir', deadline: '2026-11-20' });
});

test('categoria, título e prazo ausentes -> erro em cada campo', () => {
  const { value, errors } = validateQuestInput({ description: 'só descrição' }, TODAY);
  assert.equal(value, null);
  assert.deepEqual(errors, {
    categoryId: QUEST_MESSAGES.CATEGORY_REQUIRED,
    title: QUEST_MESSAGES.TITLE_REQUIRED,
    deadline: QUEST_MESSAGES.DEADLINE_REQUIRED,
  });
});

test('payload que não é objeto -> todos os obrigatórios faltando', () => {
  for (const payload of [null, undefined, 'texto', [1, 2]]) {
    const { errors } = validateQuestInput(payload, TODAY);
    assert.deepEqual(Object.keys(errors).sort(), ['categoryId', 'deadline', 'title']);
  }
});

test('título só com caracteres invisíveis é tratado como vazio', () => {
  const { errors } = validateQuestInput({ ...valid, title: '​​​​' }, TODAY);
  assert.equal(errors.title, QUEST_MESSAGES.TITLE_REQUIRED);
});

test('descrição é opcional e vazia vira null', () => {
  const { value } = validateQuestInput({ ...valid, description: '   ' }, TODAY);
  assert.equal(value.description, null);
});

test('categoria inválida, título curto ou longo e descrição longa', () => {
  assert.equal(validateQuestInput({ ...valid, categoryId: 'abc' }, TODAY).errors.categoryId, QUEST_MESSAGES.CATEGORY_INVALID);
  assert.equal(validateQuestInput({ ...valid, categoryId: -1 }, TODAY).errors.categoryId, QUEST_MESSAGES.CATEGORY_INVALID);
  assert.equal(validateQuestInput({ ...valid, title: 'ab' }, TODAY).errors.title, QUEST_MESSAGES.TITLE_LENGTH);
  assert.equal(validateQuestInput({ ...valid, title: 'a'.repeat(101) }, TODAY).errors.title, QUEST_MESSAGES.TITLE_LENGTH);
  assert.equal(validateQuestInput({ ...valid, description: 'a'.repeat(1001) }, TODAY).errors.description, QUEST_MESSAGES.DESCRIPTION_LENGTH);
});

test('categoria pode chegar como string numérica', () => {
  assert.equal(validateQuestInput({ ...valid, categoryId: '3' }, TODAY).value.categoryId, 3);
});

test('prazo: formato inválido, data inexistente e passado são recusados; hoje é aceito', () => {
  assert.equal(validateQuestInput({ ...valid, deadline: '20/11/2026' }, TODAY).errors.deadline, QUEST_MESSAGES.DEADLINE_INVALID);
  assert.equal(validateQuestInput({ ...valid, deadline: '2026-02-30' }, TODAY).errors.deadline, QUEST_MESSAGES.DEADLINE_INVALID);
  assert.equal(validateQuestInput({ ...valid, deadline: '2026-11-11' }, TODAY).errors.deadline, QUEST_MESSAGES.DEADLINE_PAST);
  assert.equal(validateQuestInput({ ...valid, deadline: TODAY }, TODAY).errors, null);
});

test('isValidIsoDate', () => {
  assert.equal(isValidIsoDate('2028-02-29'), true);
  assert.equal(isValidIsoDate('2027-02-29'), false);
  assert.equal(isValidIsoDate(20261112), false);
});

test('XP: individual = XP da categoria; guilda = 3x', () => {
  assert.equal(GUILD_XP_MULTIPLIER, 3);
  assert.equal(calculateQuestXp(60), 60);
  assert.equal(calculateQuestXp(60, false), 60);
  assert.equal(calculateQuestXp(60, true), 180);
});

test('XP base inválido é erro de programação', () => {
  for (const base of [0, -10, 1.5, '60', null]) assert.throws(() => calculateQuestXp(base), TypeError);
});
