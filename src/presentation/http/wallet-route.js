import { requireUser as defaultRequireUser } from '../../security/require-user.js';
import { walletService as defaultWalletService } from '../../business/application/rewards/wallet.service.js';

const json = (status, body) => ({ status, body });

export function createWalletRoute({ requireUser = defaultRequireUser, service = defaultWalletService } = {}) {
  async function balance({ method, headers } = {}) {
    if (method !== 'GET') return json(405, { code: 'METHOD_NOT_ALLOWED' });
    try { return json(200, await service.getBalance(await requireUser(headers))); }
    catch (error) { return handleError(error); }
  }

  async function movements({ method, headers, query } = {}) {
    if (method !== 'GET') return json(405, { code: 'METHOD_NOT_ALLOWED' });
    try {
      const userId = await requireUser(headers);
      const limit = query?.limit === undefined ? 50 : Number(query.limit);
      return json(200, { movements: await service.listMovements(userId, limit) });
    } catch (error) { return handleError(error); }
  }

  return { balance, movements };
}

function handleError(error) {
  if (error?.code === 'UNAUTHENTICATED') return json(401, { code: error.code, message: error.message });
  if (error?.code === 'VALIDATION_ERROR') return json(400, { code: error.code, message: error.message });
  console.error('Gold wallet request failed:', error);
  return json(500, { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' });
}
