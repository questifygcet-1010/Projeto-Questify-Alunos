/** Cliente HTTP da API v1. A sessão fica em cookie HttpOnly (enviado automaticamente, same-origin). */
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api/v1${path}`, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Object.assign(new Error(`A API retornou uma resposta inválida (HTTP ${response.status}).`), { status: response.status });
  }
  if (!response.ok) {
    throw Object.assign(new Error(data.message || `Erro da API (HTTP ${response.status}).`), { status: response.status, code: data.code });
  }
  return data;
}
