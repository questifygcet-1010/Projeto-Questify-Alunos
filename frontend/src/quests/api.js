// Squad 2 — chamadas da tela de quests à API (/api/v1). O token vem do login (Squad 1).
const TOKEN_KEY = 'questify_access_token';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Erro da API (HTTP ${status}).`);
    this.status = status;
    this.code = body?.code;
    this.fields = body?.fields || null;
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const response = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // resposta sem JSON: tratada abaixo pelo status
  }
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

export const listQuestCategories = () => request('/api/v1/quest-categories').then((data) => data.categories);

export const createQuest = (quest) => request('/api/v1/quests', { method: 'POST', body: quest });
