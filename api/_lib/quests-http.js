'use strict';
// Adaptador HTTP (Node/Vercel) para o núcleo da Camada 1 em src/presentation/http/quests-route.js.
// Serve tanto as funções da Vercel (api/v1/*) quanto o backend/server.js local.
// O núcleo é ESM; aqui (CommonJS) ele é carregado com import() dinâmico.

const MAX_BODY_BYTES = 16_384; // mesmo limite do auth-handler e das guildas

let routePromise;
function getRoute() {
  routePromise ??= import('../../src/presentation/http/quests-route.js')
    .then((module) => module.createQuestsRoute())
    .catch((error) => {
      routePromise = undefined; // permite nova tentativa
      throw error;
    });
  return routePromise;
}

// Vercel entrega `req.body` já parseado (objeto) ou string/Buffer; o servidor local entrega o stream cru.
async function readBody(req) {
  let raw = req.body;
  if (raw === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) return { bodyError: 'too_large' };
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (typeof raw === 'string') {
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return { bodyError: 'too_large' };
    try {
      return { body: JSON.parse(raw) };
    } catch {
      return { bodyError: 'invalid_json' };
    }
  }
  if (Buffer.byteLength(JSON.stringify(raw ?? null)) > MAX_BODY_BYTES) return { bodyError: 'too_large' };
  return { body: raw };
}

function send(res, { status, headers = {}, body }) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', Buffer.byteLength(payload));
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  return res.end(payload);
}

async function run(res, handle) {
  try {
    return send(res, await handle(await getRoute()));
  } catch (error) {
    console.error('Questify quests adapter failed:', error);
    return send(res, { status: 500, body: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } });
  }
}

/** POST /api/v1/quests */
exports.quests = (req, res) =>
  run(res, async (route) => {
    const parsed = req.method === 'POST' ? await readBody(req) : {};
    return route.create({ method: req.method, headers: req.headers, ...parsed });
  });

/** GET /api/v1/quest-categories */
exports.categories = (req, res) =>
  run(res, (route) => route.categories({ method: req.method, headers: req.headers }));
