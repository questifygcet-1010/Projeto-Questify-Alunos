const { AppError } = require('../shared/errors');

const MAX_BODY_BYTES = 16_384;

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  return res.end(body);
}

const invalidJson = () => new AppError(400, 'JSON_INVALIDO', 'Requisição JSON inválida.');
const tooLarge = () => new AppError(413, 'PAYLOAD_GRANDE', 'A requisição excede o tamanho permitido.');

function parse(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw invalidJson();
  }
}

/** Lê o corpo JSON. Na Vercel `req.body` já vem interpretado; localmente lê-se o stream. */
async function readJsonBody(req) {
  let body = req.body;
  if (body === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) throw tooLarge();
      chunks.push(chunk);
    }
    body = parse(Buffer.concat(chunks).toString('utf8'));
  } else if (Buffer.isBuffer(body) || typeof body === 'string') {
    body = parse(body.toString());
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalidJson();
  if (Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) throw tooLarge();
  return body;
}

function parseCookies(req) {
  const cookies = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

function isSecureRequest(req) {
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return proto === 'https' || Boolean(req.socket && req.socket.encrypted);
}

function serializeCookie(name, value, { maxAge, secure }) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

/** Proteção CSRF: em métodos de mutação, se houver `Origin` ele deve ser o próprio host da aplicação. */
function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  const expected = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  let actual;
  try {
    actual = new URL(origin).host;
  } catch {
    actual = null;
  }
  if (!actual || actual !== expected) throw new AppError(403, 'ORIGEM_INVALIDA', 'Origem da requisição não permitida.');
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || (req.socket && req.socket.remoteAddress) || 'unknown';
}

/** Envolve um handler com verificação de método, CSRF e tratamento padronizado de erros. */
function route({ methods, handler }) {
  return async function routeHandler(req, res) {
    try {
      if (!methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '));
        throw new AppError(405, 'METODO_NAO_PERMITIDO', 'Método não permitido.');
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') assertSameOrigin(req);
      await handler(req, res);
    } catch (error) {
      if (error instanceof AppError) {
        const payload = { message: error.message, code: error.code };
        if (error.field) payload.field = error.field;
        return json(res, error.status, payload, error.headers);
      }
      const code = error.code || 'INTERNAL_ERROR';
      console.error('Questify: erro não tratado:', { code, error });
      return json(res, 500, { message: `Erro interno do servidor (código ${code}).`, code });
    }
  };
}

module.exports = { json, readJsonBody, parseCookies, serializeCookie, isSecureRequest, assertSameOrigin, clientIp, route };
