// CAMADA 1 — Apresentação | Squad 3 (Domínio Social)
// Núcleo dos Route Handlers de guildas, independente de framework: recebe
// { method, headers, body, bodyError } e devolve { status, headers?, body }.
// Os adaptadores (api/_lib/guilds-http.js) ligam isto ao Node/Vercel.
//
// Responsabilidade desta camada: sessão -> payload -> serviço -> tradução de
// `error.code` em status HTTP. NÃO repete regras de domínio (nome 3–30, categoria):
// quem valida é a Camada 2 e o erro volta como VALIDATION_ERROR.
import {
  createGuild as defaultCreateGuild,
  listGuildCategories as defaultListGuildCategories,
} from '../../business/application/social/guild.service.js';
import { requireUser as defaultRequireUser } from '../../security/require-user.js';

// Tradução código de erro -> status. Usa `code` (não instanceof) para não depender de módulo duplicado.
const STATUS_BY_CODE = Object.freeze({
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  GUILD_NAME_ALREADY_USED: 409,
});

const BODY_ERRORS = Object.freeze({
  invalid_json: { status: 400, code: 'INVALID_JSON', message: 'Requisição JSON inválida.' },
  too_large: { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'A requisição excede o tamanho permitido.' },
});

const json = (status, body, headers) => ({ status, body, ...(headers ? { headers } : {}) });

const methodNotAllowed = (allow) =>
  json(405, { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' }, { Allow: allow });

function errorResponse(error) {
  const status = STATUS_BY_CODE[error?.code];
  if (!status) {
    console.error('Questify guilds request failed:', error);
    return json(500, { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' });
  }
  const body = { code: error.code, message: error.message };
  if (status === 400 && error.fields) body.fields = error.fields;
  return json(status, body);
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function createGuildsRoute({
  requireUser = defaultRequireUser,
  createGuild = defaultCreateGuild,
  listGuildCategories = defaultListGuildCategories,
} = {}) {
  /** POST /api/v1/guilds -> 201 | 400 | 401 | 409 */
  async function create({ method, headers, body, bodyError } = {}) {
    if (method !== 'POST') return methodNotAllowed('POST');
    try {
      const userId = await requireUser(headers); // 401 antes de olhar o corpo

      if (bodyError) {
        const known = BODY_ERRORS[bodyError] ?? BODY_ERRORS.invalid_json;
        return json(known.status, { code: known.code, message: known.message });
      }
      if (!isPlainObject(body)) {
        return json(400, { code: BODY_ERRORS.invalid_json.code, message: BODY_ERRORS.invalid_json.message });
      }

      const guild = await createGuild(body, userId);
      return json(201, guild);
    } catch (error) {
      return errorResponse(error);
    }
  }

  /** GET /api/v1/guild-categories -> 200 | 401 (alimenta o select de categorias da tela) */
  async function categories({ method, headers } = {}) {
    if (method !== 'GET') return methodNotAllowed('GET');
    try {
      const userId = await requireUser(headers);
      return json(200, { categories: await listGuildCategories(userId) });
    } catch (error) {
      return errorResponse(error);
    }
  }

  return { create, categories };
}
