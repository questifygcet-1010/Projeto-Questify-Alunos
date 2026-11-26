// CAMADA 1 — Apresentação | Squad 2 (Quests)
// Contrato do payload de POST /api/v1/quests: só o FORMATO da requisição.
// As regras (obrigatoriedade, limites, prazo) ficam na Camada 2 (quest-policy.js).

const STRING_FIELDS = ['title', 'description', 'deadline'];

export const CONTRACT_MESSAGES = Object.freeze({
  categoryId: 'A categoria deve ser um número.',
  title: 'O título deve ser um texto.',
  description: 'A descrição deve ser um texto.',
  deadline: 'O prazo deve ser uma data no formato AAAA-MM-DD.',
});

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Confere os tipos e copia SÓ os campos que o estudante pode personalizar.
 * Retorna { value, errors }; `errors` é null quando o formato está correto.
 * `value` sem campos extras: xp, difficulty, status, userId etc. nunca passam daqui.
 */
export function parseCreateQuestPayload(body) {
  if (!isPlainObject(body)) return { value: null, errors: null, invalidJson: true };

  const errors = {};
  const { categoryId } = body;
  if (categoryId !== undefined && categoryId !== null && typeof categoryId !== 'number' && typeof categoryId !== 'string') {
    errors.categoryId = CONTRACT_MESSAGES.categoryId;
  }
  for (const field of STRING_FIELDS) {
    if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
      errors[field] = CONTRACT_MESSAGES[field];
    }
  }

  if (Object.keys(errors).length > 0) return { value: null, errors };
  return {
    value: { categoryId, title: body.title, description: body.description, deadline: body.deadline },
    errors: null,
  };
}
