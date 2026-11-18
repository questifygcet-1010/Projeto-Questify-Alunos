import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUEST_CREDIT_KEY_PREFIX,
  buildQuestCreditKey,
  normalizeCompletionDate,
  parsePositiveId,
} from '../../../src/business/domain/rewards/quest-credit-key.js';

test('normaliza data ISO com timezone', () => {
  assert.equal(
    normalizeCompletionDate('2026-11-18T12:00:00Z'),
    '2026-11-18T12:00:00.000Z',
  );
});

test('converte offset de fuso para UTC', () => {
  assert.equal(
    normalizeCompletionDate('2026-11-18T09:00:00-03:00'),
    '2026-11-18T12:00:00.000Z',
  );
});

test('trata data sem timezone como UTC', () => {
  assert.equal(
    normalizeCompletionDate('2026-11-18 12:00:00'),
    '2026-11-18T12:00:00.000Z',
  );
  assert.equal(
    normalizeCompletionDate('2026-11-18T12:00:00'),
    '2026-11-18T12:00:00.000Z',
  );
});

test('aceita data sem horário como início do dia UTC', () => {
  assert.equal(
    normalizeCompletionDate('2026-11-18'),
    '2026-11-18T00:00:00.000Z',
  );
});

test('aceita Date e timestamp', () => {
  assert.equal(
    normalizeCompletionDate(new Date('2026-11-18T12:00:00Z')),
    '2026-11-18T12:00:00.000Z',
  );
  assert.equal(
    normalizeCompletionDate(Date.UTC(2026, 10, 18, 12, 0, 0)),
    '2026-11-18T12:00:00.000Z',
  );
});

test('rejeita data inválida', () => {
  for (const value of ['', '   ', 'not-a-date', '2026-13-01', null, undefined, NaN, {}, true]) {
    assert.throws(
      () => normalizeCompletionDate(value),
      { code: 'INVALID_COMPLETION_DATE' },
    );
  }
});

test('normaliza identificadores positivos', () => {
  assert.equal(parsePositiveId(7), 7);
  assert.equal(parsePositiveId('7'), 7);
  assert.equal(parsePositiveId(' 7 '), 7);
  assert.equal(parsePositiveId('0007'), 7);
});

test('rejeita identificadores inválidos', () => {
  for (const value of [0, -1, 1.5, '1.5', '', 'abc', null, undefined, true, {}, '1234567890123456']) {
    assert.equal(parsePositiveId(value), null);
  }
});

test('monta a chave composta canônica', () => {
  assert.equal(
    buildQuestCreditKey({
      userId: 7,
      questId: 42,
      completedAt: '2026-11-18T12:00:00Z',
    }),
    `${QUEST_CREDIT_KEY_PREFIX}:7:42:2026-11-18T12:00:00.000Z`,
  );
});

test('aceita identificadores como string numérica', () => {
  assert.equal(
    buildQuestCreditKey({
      userId: '7',
      questId: '42',
      completedAt: '2026-11-18 12:00:00',
    }),
    `${QUEST_CREDIT_KEY_PREFIX}:7:42:2026-11-18T12:00:00.000Z`,
  );
});

test('a chave é determinística e muda com data ou quest', () => {
  const input = { userId: 7, questId: 42, completedAt: '2026-11-18T12:00:00Z' };
  const first = buildQuestCreditKey(input);

  assert.equal(buildQuestCreditKey(input), first);
  assert.notEqual(
    buildQuestCreditKey({ ...input, completedAt: '2026-11-19T12:00:00Z' }),
    first,
  );
  assert.notEqual(buildQuestCreditKey({ ...input, questId: 43 }), first);
});

test('rejeita usuário, quest ou data inválidos', () => {
  assert.throws(
    () => buildQuestCreditKey({ userId: 0, questId: 42, completedAt: '2026-11-18T12:00:00Z' }),
    { code: 'INVALID_USER_ID' },
  );
  assert.throws(
    () => buildQuestCreditKey({ userId: 7, questId: 0, completedAt: '2026-11-18T12:00:00Z' }),
    { code: 'INVALID_QUEST_ID' },
  );
  assert.throws(
    () => buildQuestCreditKey({ userId: 7, questId: 42, completedAt: 'invalid' }),
    { code: 'INVALID_COMPLETION_DATE' },
  );
  assert.throws(() => buildQuestCreditKey(), { code: 'INVALID_USER_ID' });
  assert.throws(() => buildQuestCreditKey(null), { code: 'INVALID_USER_ID' });
});
