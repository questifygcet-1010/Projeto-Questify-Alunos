const { AppError } = require('../../../shared/errors');

const PAPEIS = ['estudante', 'monitor', 'administrador'];
const NOME_MAX = 120;
const EMAIL_MAX = 254;
const SENHA_MIN = 8;
const SENHA_MAX = 256;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_FORTE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-]).+$/;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function required(payload, field) {
  const value = payload[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, 'CAMPO_OBRIGATORIO', `Campo obrigatório ausente: ${field}.`, field);
  }
}

/** Valida o cadastro. O papel nunca vem do payload: novos usuários são sempre `estudante` (padrão do banco). */
function validateRegistration(payload) {
  for (const field of ['nome', 'email', 'senha']) required(payload, field);
  const nome = payload.nome.trim();
  const email = normalizeEmail(payload.email);
  const senha = payload.senha;

  if (nome.length > NOME_MAX) {
    throw new AppError(400, 'NOME_INVALIDO', `O nome deve ter até ${NOME_MAX} caracteres.`, 'nome');
  }
  if (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX) {
    throw new AppError(400, 'EMAIL_INVALIDO', 'Informe um e-mail válido.', 'email');
  }
  if (senha.length < SENHA_MIN || senha.length > SENHA_MAX) {
    throw new AppError(400, 'SENHA_INVALIDA', `A senha deve ter entre ${SENHA_MIN} e ${SENHA_MAX} caracteres.`, 'senha');
  }
  if (!SENHA_FORTE.test(senha)) {
    throw new AppError(400, 'SENHA_FRACA', 'A senha deve ter letra maiúscula, minúscula, número e símbolo.', 'senha');
  }
  return { nome, email, senha };
}

function validateLogin(payload) {
  for (const field of ['email', 'senha']) required(payload, field);
  return { email: normalizeEmail(payload.email), senha: payload.senha };
}

module.exports = { PAPEIS, normalizeEmail, validateRegistration, validateLogin };
