export const QUEST_CREDIT_KEY_PREFIX = 'quest-completed';

function domainError(message, code) {
  return Object.assign(new TypeError(message), { code });
}

export function parsePositiveId(raw) {
  if (typeof raw === 'number') {
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }
  if (typeof raw === 'string' && /^\d{1,15}$/.test(raw.trim())) {
    const value = Number(raw.trim());
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }
  return null;
}

export function normalizeCompletionDate(value) {
  let date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    date = new Date(value);
  } else if (typeof value === 'string') {
    let candidate = value.trim();
    if (!candidate) {
      throw domainError('Data de conclusão inválida.', 'INVALID_COMPLETION_DATE');
    }

    candidate = candidate.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');
    if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
      candidate += 'T00:00:00.000Z';
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(candidate)) {
      candidate += 'Z';
    }

    date = new Date(candidate);
  } else {
    throw domainError('Data de conclusão inválida.', 'INVALID_COMPLETION_DATE');
  }

  if (Number.isNaN(date.getTime())) {
    throw domainError('Data de conclusão inválida.', 'INVALID_COMPLETION_DATE');
  }

  return date.toISOString();
}

export function buildQuestCreditKey(input = {}) {
  const { userId, questId, completedAt } = input ?? {};

  const normalizedUserId = parsePositiveId(userId);
  if (normalizedUserId === null) {
    throw domainError('Identificador de usuário inválido.', 'INVALID_USER_ID');
  }

  const normalizedQuestId = parsePositiveId(questId);
  if (normalizedQuestId === null) {
    throw domainError('Identificador da quest inválido.', 'INVALID_QUEST_ID');
  }

  const normalizedCompletedAt = normalizeCompletionDate(completedAt);

  return `${QUEST_CREDIT_KEY_PREFIX}:${normalizedUserId}:${normalizedQuestId}:${normalizedCompletedAt}`;
}
