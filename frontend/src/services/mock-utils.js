// Utilitários dos serviços mockados.
//
// Parâmetros de URL para conferir estados (só afetam os mocks):
// - `?mock=error`: todo mock falha (estados "Erro de carregamento")
// - `?mock=empty`: listas mockadas voltam vazias (ex.: "Suas guildas" sem guildas)
// Também é possível forçar o erro com NEXT_PUBLIC_MOCK_ERROR=1 no ambiente de dev.

const DEFAULT_DELAY_MS = 600;

export function mockMode() {
  if (process.env.NEXT_PUBLIC_MOCK_ERROR === '1') return 'error';
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('mock');
}

/** Resolve `value` (clonado) depois de um pequeno atraso, ou rejeita se o erro estiver forçado. */
export function mockResponse(value, delay = DEFAULT_DELAY_MS) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (mockMode() === 'error') {
        reject(new Error('Falha simulada do mock.'));
        return;
      }
      resolve(structuredClone(value));
    }, delay);
  });
}

/** Igual a mockResponse, mas devolve [] quando `?mock=empty`. */
export function mockList(list, delay) {
  return mockResponse(mockMode() === 'empty' ? [] : list, delay);
}
