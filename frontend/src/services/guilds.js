import { exploreGuilds, myGuilds } from '@/mocks/guilds';
import { apiGet, apiPost } from './http';
import { mockList, mockResponse } from './mock-utils';

// TODO(api): trocar por GET /api/v1/guilds?member=me (ordenado por atividade recente)
export async function listMyGuilds() {
  const guilds = await mockList(myGuilds);
  return guilds.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
}

// TODO(api): trocar por GET /api/v1/guilds (ainda não existe no backend)
export function listGuilds() {
  return mockList(exploreGuilds);
}

// TODO(api): trocar por POST /api/v1/guilds/:id/members
export function joinGuild(id) {
  return mockResponse({ id, isMember: true }, 400);
}

/** GET /api/v1/guild-categories (API real) → [{ id, name }] */
export async function fetchCategories() {
  const data = await apiGet('/api/v1/guild-categories');
  return data.categories;
}

/**
 * POST /api/v1/guilds (API real). Respostas: 201 (guilda), 400 com `fields`,
 * 401 e 409 (nome em uso) — o erro lançado traz `status`, `code` e `fields`.
 * A descrição não é enviada: o backend ainda não aceita o campo.
 */
export function createGuild({ name, categoryId }) {
  // TODO(api): enviar `description` quando o backend aceitar o campo.
  return apiPost('/api/v1/guilds', { name, categoryId });
}
