import { getPool } from '../../postgres/pool.js';

function executor(tx) {
  return tx ?? getPool();
}

export const goldLedgerRepository = {
  async findBalanceByUserId(userId, tx) {
    const rows = await executor(tx).unsafe(
      `SELECT COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0) AS balance
         FROM public.gold_ledger WHERE user_id = $1`,
      [userId],
    );
    return Number(rows[0].balance);
  },

  async findBySourceEventId(sourceEventId, tx) {
    const rows = await executor(tx).unsafe(
      `SELECT id, user_id, type, amount, source_event_id, description, created_at
         FROM public.gold_ledger WHERE source_event_id = $1 LIMIT 1`,
      [sourceEventId],
    );
    return rows[0] ?? null;
  },

  async createCredit({ userId, amount, sourceEventId, description }, tx) {
    const rows = await executor(tx).unsafe(
      `INSERT INTO public.gold_ledger (user_id, type, amount, source_event_id, description)
       VALUES ($1, 'CREDIT', $2, $3, $4)
       ON CONFLICT (source_event_id) DO NOTHING
       RETURNING id, user_id, type, amount, source_event_id, description, created_at`,
      [userId, amount, sourceEventId, description],
    );
    return rows[0] ?? null;
  },

  async findByUserId(userId, limit = 50) {
    return executor().unsafe(
      `SELECT id, user_id, type, amount, source_event_id, description, created_at
         FROM public.gold_ledger WHERE user_id = $1
        ORDER BY created_at DESC, id DESC LIMIT $2`,
      [userId, limit],
    );
  },
};
