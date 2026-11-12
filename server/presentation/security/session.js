const { AppError } = require('../../shared/errors');
const { authenticate } = require('../../business/application/auth/auth.service');
const { parseCookies, serializeCookie, isSecureRequest } = require('../http');

const SESSION_COOKIE = 'questify_session';

function getSessionToken(req) {
  return parseCookies(req)[SESSION_COOKIE] || null;
}

function sessionCookie(req, token, maxAge) {
  return serializeCookie(SESSION_COOKIE, token, { maxAge, secure: isSecureRequest(req) });
}

function clearedSessionCookie(req) {
  return serializeCookie(SESSION_COOKIE, '', { maxAge: 0, secure: isSecureRequest(req) });
}

/**
 * Convenção do Squad 1 para todos os squads: retorna `{ id, nome, email, papel, ativo }`
 * do usuário autenticado ou lança 401. `id` (UUID) é o identificador estável do usuário.
 */
async function requireUser(req, db) {
  const user = await authenticate(getSessionToken(req), db);
  if (!user) throw new AppError(401, 'NAO_AUTENTICADO', 'Sessão ausente, inválida ou expirada.');
  return user;
}

/** Exige um dos papéis informados; use após `requireUser`. */
function requireRole(user, ...papeis) {
  if (!papeis.includes(user.papel)) throw new AppError(403, 'ACESSO_NEGADO', 'Você não tem permissão para esta operação.');
}

module.exports = { SESSION_COOKIE, getSessionToken, sessionCookie, clearedSessionCookie, requireUser, requireRole };
