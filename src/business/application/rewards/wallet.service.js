import { withTransaction } from '../../../persistence/postgres/transaction.js';
import { goldLedgerRepository } from '../../../persistence/repositories/rewards/gold-ledger.repository.js';

function appError(message, code) {
  return Object.assign(new Error(message), { code });
}

function validateUserId(userId) {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw appError('Identificador de usuário inválido.', 'VALIDATION_ERROR');
  }
}

function validateCredit({ amount, sourceEventId }) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw appError('A quantidade de Gold deve ser um inteiro positivo.', 'VALIDATION_ERROR');
  }
  if (typeof sourceEventId !== 'string' || !sourceEventId.trim()) {
    throw appError('Identificador do evento inválido.', 'VALIDATION_ERROR');
  }
}

export function createWalletService({ repository = goldLedgerRepository, transaction = withTransaction } = {}) {
  return {
    async getBalance(userId) {
      validateUserId(userId);
      return { userId, balance: await repository.findBalanceByUserId(userId) };
    },

    async listMovements(userId, limit = 50) {
      validateUserId(userId);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw appError('O limite deve estar entre 1 e 100.', 'VALIDATION_ERROR');
      }
      return repository.findByUserId(userId, limit);
    },

    async creditForActivity({ userId, amount, sourceEventId, description = 'Gold recebido por atividade concluída' }) {
      validateUserId(userId);
      validateCredit({ amount, sourceEventId });

      return transaction(async (tx) => {
        const previous = await repository.findBySourceEventId(sourceEventId, tx);
        if (previous) {
          if (Number(previous.user_id) !== userId || Number(previous.amount) !== amount) {
            throw appError('O evento já foi processado com informações diferentes.', 'IDEMPOTENCY_CONFLICT');
          }
          return { credited: false, duplicated: true, movement: previous,
            balance: await repository.findBalanceByUserId(userId, tx) };
        }

        const movement = await repository.createCredit({ userId, amount, sourceEventId, description }, tx);
        if (!movement) {
          const original = await repository.findBySourceEventId(sourceEventId, tx);
          if (!original || Number(original.user_id) !== userId || Number(original.amount) !== amount) {
            throw appError('O evento já foi processado com informações diferentes.', 'IDEMPOTENCY_CONFLICT');
          }
          return { credited: false, duplicated: true, movement: original,
            balance: await repository.findBalanceByUserId(userId, tx) };
        }

        return { credited: true, duplicated: false, movement,
          balance: await repository.findBalanceByUserId(userId, tx) };
      });
    },
  };
}

export const walletService = createWalletService();
