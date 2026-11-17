// T4 — Script de sync do catálogo (Squad 4).
// Copia o REWARD_CATALOG (código) para a tabela `rewards` (banco).
// Uso: npm run seed:rewards
//
// - Tudo numa transação: ou grava tudo, ou não grava nada.
// - Idempotente: rodar várias vezes não duplica.
// - Nunca apaga: o que saiu do código fica com ativa = false.

import { REWARD_CATALOG } from '../src/business/domain/rewards/reward-catalog.js';
import {
  upsertReward,
  deactivateMissing,
} from '../src/persistence/repositories/rewards/rewards.repository.js';
import { withTransaction } from '../src/persistence/postgres/transaction.js';
import { pool } from '../src/persistence/postgres/pool.js';

// Travas antes de tocar no banco.
function checkCatalog() {
  if (REWARD_CATALOG.length === 0) {
    // Sem isso, deactivateMissing inativaria TODAS as recompensas.
    throw new Error('REWARD_CATALOG está vazio. Nada foi alterado no banco.');
  }

  const pendentes = REWARD_CATALOG.filter(
    (r) => r.limiteSemanal === undefined,
  ).map((r) => r.codigo);

  if (pendentes.length > 0) {
    throw new Error(
      `limiteSemanal não definido em: ${pendentes.join(', ')}. ` +
        'Use um número, ou null para "sem limite". Nada foi alterado no banco.',
    );
  }
}

async function main() {
  checkCatalog();

  const inativadas = await withTransaction(async (tx) => {
    for (const reward of REWARD_CATALOG) {
      await upsertReward(reward, tx);
    }
    return deactivateMissing(
      REWARD_CATALOG.map((r) => r.codigo),
      tx,
    );
  });

  console.log(
    `Catálogo sincronizado: ${REWARD_CATALOG.length} recompensa(s) ativa(s), ` +
      `${inativadas} inativada(s).`,
  );
}

main()
  .catch((err) => {
    console.error(`Falha no seed:rewards: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());