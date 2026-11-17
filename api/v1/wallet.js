import { createWalletRoute } from '../../src/presentation/http/wallet-route.js';

const route = createWalletRoute();

export default async function handler(request, response) {
  const input = {
    method: request.method,
    headers: request.headers,
    query: request.query,
  };
  const result = request.url?.startsWith('/api/v1/wallet/movements')
    ? await route.movements(input)
    : await route.balance(input);
  return response.status(result.status).json(result.body);
}
