// CAMADA 2 — Negócio / subcamada Domínio | Squad 2 (Quests)
// Regras puras da criação de quest: sem I/O, sem SQL, sem HTTP.

export const QUEST_TITLE_MIN_LENGTH = 3;
export const QUEST_TITLE_MAX_LENGTH = 100;
export const QUEST_DESCRIPTION_MAX_LENGTH = 1000;

/** Regra 5 da história #108: toda quest nasce "pendente". */
export const QUEST_INITIAL_STATUS = 'pendente';

export const QUEST_DIFFICULTIES = Object.freeze({ facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' });

export const QUEST_MESSAGES = Object.freeze({
  CATEGORY_REQUIRED: 'Selecione uma categoria.',
  CATEGORY_INVALID: 'Selecione uma categoria válida.',
  TITLE_REQUIRED: 'Informe o título da quest.',
  TITLE_LENGTH: `O título deve ter entre ${QUEST_TITLE_MIN_LENGTH} e ${QUEST_TITLE_MAX_LENGTH} caracteres.`,
  DESCRIPTION_LENGTH: `A descrição deve ter no máximo ${QUEST_DESCRIPTION_MAX_LENGTH} caracteres.`,
  DEADLINE_REQUIRED: 'Informe o prazo da quest.',
  DEADLINE_INVALID: 'Informe uma data válida.',
  DEADLINE_PAST: 'O prazo não pode ser uma data passada.',
});

/** NFC + sem caracteres invisíveis/de controle + espaços colapsados + trim. */
export function normalizeText(raw) {
  if (typeof raw !== 'string') return '';
  return raw.normalize('NFC').replace(/[\p{Cf}\p{Cc}]/gu, ' ').replace(/\s+/g, ' ').trim();
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

/** "AAAA-MM-DD" de calendário válido (rejeita 2026-02-30). */
export function isValidIsoDate(raw) {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const countChars = (text) => Array.from(text).length;

/**
 * Valida e normaliza a entrada da criação de quest.
 * `today` é a data atual "AAAA-MM-DD" no fuso do usuário (o serviço informa).
 * Só lê os campos personalizáveis: XP, dificuldade, status e usuário enviados pelo cliente são ignorados.
 * Retorna { value, errors }; `errors` é null quando válido.
 */
export function validateQuestInput(payload, today) {
  const input = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const errors = {};

  const categoryProvided = input.categoryId !== undefined && input.categoryId !== null && input.categoryId !== '';
  const categoryId = parsePositiveId(input.categoryId);
  if (!categoryProvided) errors.categoryId = QUEST_MESSAGES.CATEGORY_REQUIRED;
  else if (categoryId === null) errors.categoryId = QUEST_MESSAGES.CATEGORY_INVALID;

  const title = normalizeText(input.title);
  if (!title) errors.title = QUEST_MESSAGES.TITLE_REQUIRED;
  else if (countChars(title) < QUEST_TITLE_MIN_LENGTH || countChars(title) > QUEST_TITLE_MAX_LENGTH) {
    errors.title = QUEST_MESSAGES.TITLE_LENGTH;
  }

  // Descrição é opcional (não está entre os campos obrigatórios da história).
  const description = typeof input.description === 'string' ? input.description.normalize('NFC').trim() : '';
  if (countChars(description) > QUEST_DESCRIPTION_MAX_LENGTH) errors.description = QUEST_MESSAGES.DESCRIPTION_LENGTH;

  const deadline = typeof input.deadline === 'string' ? input.deadline.trim() : '';
  if (!deadline) errors.deadline = QUEST_MESSAGES.DEADLINE_REQUIRED;
  else if (!isValidIsoDate(deadline)) errors.deadline = QUEST_MESSAGES.DEADLINE_INVALID;
  else if (today && deadline < today) errors.deadline = QUEST_MESSAGES.DEADLINE_PAST;

  if (Object.keys(errors).length > 0) return { value: null, errors };
  return { value: { categoryId, title, description: description || null, deadline }, errors: null };
}
