// Cliente HTTP compartilhado pelos serviços. As telas nunca chamam fetch diretamente.

export const ACCESS_TOKEN_KEY = 'questify_access_token';
export const REFRESH_TOKEN_KEY = 'questify_refresh_token';

export async function readApiResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error(`A API retornou uma resposta inválida (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(data.message || `Erro da API (HTTP ${response.status}).`);
    error.status = response.status;
    error.code = data.code;
    error.fields = data.fields;
    throw error;
  }

  return data;
}

function authHeaders() {
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path) {
  const response = await fetch(path, { headers: authHeaders() });
  return readApiResponse(response);
}

export async function apiPost(path, payload, { authenticated = true } = {}) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      ...(authenticated ? authHeaders() : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return readApiResponse(response);
}
