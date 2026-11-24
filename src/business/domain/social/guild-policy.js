// CAMADA 2 — Negócio / subcamada Domínio | Squad 3
// Regras puras: sem I/O, sem SQL, sem HTTP.

export const GUILD_NAME_MIN_LENGTH = 3;
export const GUILD_NAME_MAX_LENGTH = 30;

export const GUILD_ROLES = Object.freeze({ ADMIN: 'admin', MEMBER: 'member' });
/** Regra: o criador da guilda torna-se Administrador. */
export const GUILD_CREATOR_ROLE = GUILD_ROLES.ADMIN;

export const GUILD_ERROR_CODES = Object.freeze({ NAME_ALREADY_USED: 'GUILD_NAME_ALREADY_USED' });

export const GUILD_MESSAGES = Object.freeze({
  NAME_LENGTH: `O nome da guilda deve ter entre ${GUILD_NAME_MIN_LENGTH} e ${GUILD_NAME_MAX_LENGTH} caracteres.`,
  CATEGORY_REQUIRED: 'Selecione uma categoria válida.',
  CATEGORY_INVALID: 'Selecione uma categoria válida.',
  NAME_ALREADY_USED: 'Este nome de guilda já está em uso, escolha outro.',
});

/** NFC + espaços colapsados + trim, para que "Física  Básica " e "Física Básica" sejam o mesmo nome. */
export function normalizeGuildName(rawName) {
  if (typeof rawName !== 'string') return '';
  return rawName.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Retorna mensagem de erro ou null. Conta caracteres (code points), não bytes. */
export function validateGuildName(rawName) {
  const length = Array.from(normalizeGuildName(rawName)).length;
  if (length < GUILD_NAME_MIN_LENGTH || length > GUILD_NAME_MAX_LENGTH) return GUILD_MESSAGES.NAME_LENGTH;
  return null;
}

/** Aceita inteiro positivo (number ou string numérica). Retorna number ou null. */
export function parsePositiveId(raw) {
  if (typeof raw === 'number') return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  if (typeof raw === 'string' && /^\d{1,15}$/.test(raw.trim())) {
    const value = Number(raw.trim());
    return value > 0 ? value : null;
  }
  return null;
}

/** Valida e normaliza a entrada. Retorna { value, errors }; `errors` é null quando válido. */
export function validateGuildInput(payload) {
  const input = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const errors = {};

  const nameError = validateGuildName(input.name);
  if (nameError) errors.name = nameError;

  const categoryId = parsePositiveId(input.categoryId);
  if (categoryId === null) errors.categoryId = GUILD_MESSAGES.CATEGORY_REQUIRED;

  if (Object.keys(errors).length > 0) return { value: null, errors };
  return { value: { name: normalizeGuildName(input.name), categoryId }, errors: null };
}
