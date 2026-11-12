const { createHash, randomBytes } = require('node:crypto');
const { AppError } = require('../../../shared/errors');
const { getPool } = require('../../../persistence/postgres/pool');
const users = require('../../../persistence/repositories/auth/users.repository');
const sessions = require('../../../persistence/repositories/auth/sessions.repository');
const { hashPassword, verifyPassword } = require('../../domain/auth/password');
const { validateRegistration, validateLogin } = require('../../domain/auth/user-policy');

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

let dummyHash;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Todas as funções aceitam `db` (Pool ou tx) para permitir transações e testes isolados. */
async function register(input, db = getPool()) {
  const { nome, email, senha } = validateRegistration(input);
  const senhaHash = await hashPassword(senha);
  try {
    return await users.create(db, { nome, email, senhaHash });
  } catch (error) {
    if (error.code === '23505') throw new AppError(409, 'EMAIL_DUPLICADO', 'Este e-mail já está cadastrado.', 'email');
    if (error.code === '23502') {
      throw new AppError(400, 'CAMPO_OBRIGATORIO', `Campo obrigatório ausente: ${error.column}.`, error.column);
    }
    throw error;
  }
}

async function login(input, db = getPool()) {
  const { email, senha } = validateLogin(input);
  const user = await users.findByEmail(db, email);

  // Verifica sempre um hash para não revelar, pelo tempo de resposta, se o e-mail existe.
  dummyHash ??= await hashPassword('questify-dummy-password');
  const valid = await verifyPassword(senha, user ? user.senhaHash : dummyHash);
  if (!user || !valid) throw new AppError(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.');
  if (!user.ativo) throw new AppError(403, 'CONTA_DESATIVADA', 'Esta conta está desativada.');

  const token = randomBytes(32).toString('base64url');
  const expiresAt = nowSeconds() + SESSION_TTL_SECONDS;
  await sessions.create(db, { tokenHash: sha256(token), userId: user.id, expiresAt });

  const { senhaHash, ...publicUser } = user;
  return { token, expiresAt, maxAge: SESSION_TTL_SECONDS, user: publicUser };
}

async function logout(token, db = getPool()) {
  if (token) await sessions.remove(db, sha256(token));
}

/** Retorna o usuário autenticado pelo token de sessão, ou null (token ausente, expirado ou conta inativa). */
async function authenticate(token, db = getPool()) {
  if (!token) return null;
  const user = await sessions.findUserByTokenHash(db, sha256(token), nowSeconds());
  return user && user.ativo ? user : null;
}

module.exports = { register, login, logout, authenticate, SESSION_TTL_SECONDS };
