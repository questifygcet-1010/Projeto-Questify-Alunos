import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, apiPost } from './http';

/** POST /api/auth/login — guarda os tokens no localStorage (comportamento atual). */
export async function login({ email, password }) {
  const data = await apiPost('/api/auth/login', { email, password }, { authenticated: false });
  window.localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  return data;
}

/** POST /api/auth/register */
export function register({ name, email, password }) {
  return apiPost('/api/auth/register', { name, email, password }, { authenticated: false });
}

export function hasAccessToken() {
  return Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY));
}

/** Não existe endpoint de logout: "Sair" só remove os tokens locais. */
export function clearSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
