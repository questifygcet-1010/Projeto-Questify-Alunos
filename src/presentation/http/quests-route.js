// CAMADA 1 — Apresentação | Squad 2 (Quests)
// Núcleo dos Route Handlers de quests, independente de framework (mesmo padrão de guilds-route.js):
// recebe { method, headers, body, bodyError } e devolve { status, headers?, body }.
// Os adaptadores (api/_lib/quests-http.js) ligam isto ao Node/Vercel.
//
// Responsabilidade desta camada: sessão -> origem -> formato do payload -> serviço ->
// tradução de `error.code` em status HTTP. Não repete as regras de domínio.
import {
  createQuest as defaultCreateQuest,
  listQuestCategories as defaultListQuestCategories,
} from '../../business/application/quests/quest.service.js';
import { requireUser as defaultRequireUser } from '../../security/require-user.js';
import { parseCreateQuestPayload } from '../validation/quests.js';

const STATUS_BY_CODE = Object.freeze({
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
});

const BODY_ERRORS = Object.freeze({
  invalid_json: { status: 400, code: 'INVALID_JSON', message: 'Requisição JSON inválida.' },
  too_large: { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'A requisição excede o tamanho permitido.' },
});

const json = (status, body, headers) => ({ status, body, ...(headers ? { headers } : {}) });

const methodNotAllowed = (allow) =>
  json(405, { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' }, { Allow: allow });

const bodyErrorResponse = (key) => {
  const known = BODY_ERRORS[key] ?? BODY_ERRORS.invalid_json;
  return json(known.status, { code: known.code, message: known.message });
};

function errorResponse(error) {
  const status = STATUS_BY_CODE[error?.code];
  if (!status) {
    console.error('Questify quests request failed:', error);
    return json(500, { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' });
  }
  const body = { code: error.code, message: error.message };
  if (status === 400 && error.fields) body.fields = error.fields;
  return json(status, body);
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const hostnameOf = (host) => new URL(`http://${host}`).hostname;

/**
 * Mutação só da mesma origem: se o navegador mandar `Origin`, o host precisa ser o do próprio site.
 * Em desenvolvimento o proxy do Vite troca o Host (localhost:5173 -> 127.0.0.1:8000): origem e servidor
 * ambos locais também são aceitos. Sem `Origin` (clientes que não são navegador, testes) a requisição
 * segue; o token Bearer continua obrigatório.
 */
export function isSameOrigin(headers = {}) {
  const origin = headers.origin ?? headers.Origin;
  if (origin === undefined) return true;
  const rawHost = headers['x-forwarded-host'] ?? headers.host ?? headers.Host;
  if (!rawHost) return false;
  try {
    const host = String(rawHost).split(',')[0].trim();
    const originUrl = new URL(origin);
    if (originUrl.host === host) return true;
    return LOOPBACK_HOSTS.has(originUrl.hostname) && LOOPBACK_HOSTS.has(hostnameOf(host));
  } catch {
    return false;
  }
}

export function createQuestsRoute({
  requireUser = defaultRequireUser,
  createQuest = defaultCreateQuest,
  listQuestCategories = defaultListQuestCategories,
} = {}) {
  /** POST /api/v1/quests -> 201 | 400 | 401 | 403 | 405 | 413 (sempre exige login) */
  async function create({ method, headers, body, bodyError } = {}) {
    if (method !== 'POST') return methodNotAllowed('POST');
    try {
      const userId = await requireUser(headers); // 401 antes de olhar o corpo
      if (!isSameOrigin(headers)) {
        return json(403, { code: 'FORBIDDEN_ORIGIN', message: 'Origem da requisição não permitida.' });
      }
      if (bodyError) return bodyErrorResponse(bodyError);

      const parsed = parseCreateQuestPayload(body);
      if (parsed.invalidJson) return bodyErrorResponse('invalid_json');
      if (parsed.errors) {
        return json(400, { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', fields: parsed.errors });
      }

      const quest = await createQuest(parsed.value, userId);
      return json(201, quest);
    } catch (error) {
      return errorResponse(error);
    }
  }

  /**
   * GET /api/v1/quest-categories -> 200 (alimenta a seleção de categoria da tela).
   * Público por enquanto: são só dados de referência (nome, dificuldade, XP), sem dado de usuário.
   * Criar quest (POST) continua exigindo login.
   */
  async function categories({ method } = {}) {
    if (method !== 'GET') return methodNotAllowed('GET');
    try {
      return json(200, { categories: await listQuestCategories() });
    } catch (error) {
      return errorResponse(error);
    }
  }

  return { create, categories };
}
