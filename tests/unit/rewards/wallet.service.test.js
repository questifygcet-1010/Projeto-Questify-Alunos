import test from 'node:test';
import assert from 'node:assert/strict';
import { createWalletService } from '../../../../src/business/application/rewards/wallet.service.js';

test('retorna o saldo calculado pelo repositório', async () => {
  const service = createWalletService({ repository: { async findBalanceByUserId() { return 120; } } });
  assert.deepEqual(await service.getBalance(7), { userId: 7, balance: 120 });
});

test('lista movimentações do próprio usuário', async () => {
  const movements = [{ id: 1, type: 'CREDIT', amount: 30 }];
  const service = createWalletService({ repository: { async findByUserId(userId, limit) {
    assert.equal(userId, 7); assert.equal(limit, 20); return movements;
  } } });
  assert.equal(await service.listMovements(7, 20), movements);
});

test('não credita novamente um evento já processado', async () => {
  const movement = { id: 1, user_id: 7, amount: 30, source_event_id: 'quest-9' };
  const service = createWalletService({
    transaction: (work) => work({}),
    repository: {
      async findBySourceEventId() { return movement; },
      async findBalanceByUserId() { return 80; },
    },
  });
  const result = await service.creditForActivity({ userId: 7, amount: 30, sourceEventId: 'quest-9' });
  assert.equal(result.credited, false);
  assert.equal(result.duplicated, true);
  assert.equal(result.balance, 80);
});

test('rejeita quantidade de Gold inválida', async () => {
  const service = createWalletService();
  await assert.rejects(() => service.creditForActivity({ userId: 7, amount: -1, sourceEventId: 'quest-9' }),
    { code: 'VALIDATION_ERROR' });
});
