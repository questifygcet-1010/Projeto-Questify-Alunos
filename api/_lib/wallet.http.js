
'use strict';

// Adaptador HTTP para a carteira de Gold.
// Permite utilizar a mesma rota na Vercel e no servidor local.

let routePromise;

function getRoute() {
  routePromise ??= import('../../src/presentation/http/wallet-route.js')
    .then((module) => module.createWalletRoute())
    .catch((error) => {
      routePromise = undefined;
      throw error;
    });

  return routePromise;
}

function send(res, { status, headers = {}, body }) {
  const payload = JSON.stringify(body);

  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', Buffer.byteLength(payload));

  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
  }

  return res.end(payload);
}

async function run(res, handle) {
  try {
    const route = await getRoute();
    return send(res, await handle(route));
  } catch (error) {
    console.error('Questify wallet adapter failed:', error);

    return send(res, {
      status: 500,
      body: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor.',
      },
    });
  }
}

function createInput(req) {
  const url = new URL(req.url, 'http://localhost');

  return {
    method: req.method,
    headers: req.headers,
    query: Object.fromEntries(url.searchParams.entries()),
  };
}

/** GET /api/v1/wallet */
exports.wallet = (req, res) =>
  run(res, (route) => route.balance(createInput(req)));

/** GET /api/v1/wallet/movements */
exports.movements = (req, res) =>
  run(res, (route) => route.movements(createInput(req)));
