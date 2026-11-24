
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWalletService } from '../../../src/business/application/rewards/wallet.service.js';

test('retorna o saldo calculado pelo repositório', async () => {
  const service = createWalletService({
    repository: {
      async findBalanceByUserId() {
        return 120;
      },
    },
  });

  assert.deepEqual(await service.getBalance(7), {
    userId: 7,
    balance: 120,
  });
});

test('lista movimentações do próprio usuário', async () => {
  const movements = [{ id: 1, type: 'CREDIT', amount: 30 }];

  const service = createWalletService({
    repository: {
      async findByUserId(userId, limit) {
        assert.equal(userId, 7);
        assert.equal(limit, 20);
        return movements;
      },
    },
  });

  assert.equal(await service.listMovements(7, 20), movements);
});

test('não credita novamente um evento já processado', async () => {
  const movement = {
    id: 1,
    user_id: 7,
    amount: 30,
    source_event_id: 'quest-9',
  };

  const service = createWalletService({
    transaction: (work) => work({}),
    repository: {
      async findBySourceEventId() {
        return movement;
      },
      async findBalanceByUserId() {
        return 80;
      },
    },
  });

  const result = await service.creditForActivity({
    userId: 7,
    amount: 30,
    sourceEventId: 'quest-9',
  });

  assert.equal(result.credited, false);
  assert.equal(result.duplicated, true);
  assert.equal(result.balance, 80);
});

test('rejeita quantidade de Gold inválida', async () => {
  const service = createWalletService();

  await assert.rejects(
    () => service.creditForActivity({
      userId: 7,
      amount: -1,
      sourceEventId: 'quest-9',
    }),
    { code: 'VALIDATION_ERROR' },
  );
});

// Testes do crédito de Gold por conclusão de Quest

test('credita Gold usando a transação recebida', async () => {
  const tx = { id: 'transaction-1' };
  const receivedTransactions = [];

  const movement = {
    id: 2,
    user_id: 7,
    amount: 50,
    source_event_id: 'conclusion-15',
  };

  const service = createWalletService({
    transaction: async () => {
      throw new Error('Não deveria abrir uma nova transação.');
    },
    repository: {
      async findBySourceEventId(sourceEventId, receivedTx) {
        assert.equal(sourceEventId, 'conclusion-15');
        receivedTransactions.push(receivedTx);
        return null;
      },

      async createCredit(data, receivedTx) {
        assert.equal(data.userId, 7);
        assert.equal(data.amount, 50);
        assert.equal(data.sourceEventId, 'conclusion-15');

        receivedTransactions.push(receivedTx);
        return movement;
      },

      async findBalanceByUserId(userId, receivedTx) {
        assert.equal(userId, 7);
        receivedTransactions.push(receivedTx);
        return 150;
      },
    },
  });

  const result = await service.creditGoldForQuest({
    userId: 7,
    amount: 50,
    conclusionId: 'conclusion-15',
    tx,
  });

  assert.equal(result.credited, true);
  assert.equal(result.duplicated, false);
  assert.equal(result.balance, 150);
  assert.equal(result.movement, movement);

  assert.equal(receivedTransactions.length, 3);
  assert.ok(receivedTransactions.every((receivedTx) => receivedTx === tx));
});

test('rejeita crédito de Quest sem transação', async () => {
  const service = createWalletService();

  await assert.rejects(
    () => service.creditGoldForQuest({
      userId: 7,
      amount: 50,
      conclusionId: 'conclusion-15',
    }),
    { code: 'TRANSACTION_REQUIRED' },
  );
});

test('não credita novamente uma conclusão já processada', async () => {
  const tx = { id: 'transaction-2' };

  const movement = {
    id: 3,
    user_id: 7,
    amount: 50,
    source_event_id: 'conclusion-15',
  };

  let createCreditCalled = false;

  const service = createWalletService({
    repository: {
      async findBySourceEventId(sourceEventId, receivedTx) {
        assert.equal(sourceEventId, 'conclusion-15');
        assert.equal(receivedTx, tx);
        return movement;
      },

      async createCredit() {
        createCreditCalled = true;
      },

      async findBalanceByUserId(userId, receivedTx) {
        assert.equal(userId, 7);
        assert.equal(receivedTx, tx);
        return 150;
      },
    },
  });

  const result = await service.creditGoldForQuest({
    userId: 7,
    amount: 50,
    conclusionId: 'conclusion-15',
    tx,
  });

  assert.equal(result.credited, false);
  assert.equal(result.duplicated, true);
  assert.equal(result.balance, 150);
  assert.equal(createCreditCalled, false);
});

test('rejeita conclusão já processada com informações diferentes', async () => {
  const tx = { id: 'transaction-3' };

  const movement = {
    id: 4,
    user_id: 7,
    amount: 30,
    source_event_id: 'conclusion-15',
  };

  const service = createWalletService({
    repository: {
      async findBySourceEventId() {
        return movement;
      },
    },
  });

  await assert.rejects(
    () => service.creditGoldForQuest({
      userId: 7,
      amount: 50,
      conclusionId: 'conclusion-15',
      tx,
    }),
    { code: 'IDEMPOTENCY_CONFLICT' },
  );
});

test('rejeita conclusão já creditada para outro usuário', async () => {
  const tx = { id: 'transaction-4' };

  const movement = {
    id: 5,
    user_id: 7,
    type: 'CREDIT',
    amount: 50,
    source_event_id: 'conclusion-15',
  };

  const service = createWalletService({
    repository: {
      async findBySourceEventId() {
        return movement;
      },
    },
  });

  await assert.rejects(
    () => service.creditGoldForQuest({
      userId: 8,
      amount: 50,
      conclusionId: 'conclusion-15',
      tx,
    }),
    { code: 'IDEMPOTENCY_CONFLICT' },
  );
});

test('reconhece evento duplicado após conflito na inserção', async () => {
  const tx = { id: 'transaction-5' };

  const movement = {
    id: 6,
    user_id: 7,
    type: 'CREDIT',
    amount: 50,
    source_event_id: 'conclusion-15',
  };

  let searchCount = 0;

  const service = createWalletService({
    repository: {
      async findBySourceEventId(sourceEventId, receivedTx) {
        assert.equal(sourceEventId, 'conclusion-15');
        assert.equal(receivedTx, tx);

        searchCount++;

        return searchCount === 1 ? null : movement;
      },

      async createCredit(data, receivedTx) {
        assert.equal(data.userId, 7);
        assert.equal(data.amount, 50);
        assert.equal(receivedTx, tx);

        return null;
      },

      async findBalanceByUserId(userId, receivedTx) {
        assert.equal(userId, 7);
        assert.equal(receivedTx, tx);

        return 150;
      },
    },
  });

  const result = await service.creditGoldForQuest({
    userId: 7,
    amount: 50,
    conclusionId: 'conclusion-15',
    tx,
  });

  assert.equal(result.credited, false);
  assert.equal(result.duplicated, true);
  assert.equal(result.balance, 150);
  assert.equal(result.movement, movement);
  assert.equal(searchCount, 2);
});

test('rejeita identificadores de usuário inválidos', async () => {
  const service = createWalletService();

  const invalidUserIds = [
    0,
    -1,
    1.5,
    NaN,
    null,
    undefined,
    '7',
  ];

  for (const userId of invalidUserIds) {
    await assert.rejects(
      () => service.getBalance(userId),
      { code: 'VALIDATION_ERROR' },
    );
  }
});

test('rejeita limites inválidos no histórico de Gold', async () => {
  const service = createWalletService();

  const invalidLimits = [0, -1, 101, 1.5, NaN, null, '20'];

  for (const limit of invalidLimits) {
    await assert.rejects(
      () => service.listMovements(7, limit),
      { code: 'VALIDATION_ERROR' },
    );
  }
});