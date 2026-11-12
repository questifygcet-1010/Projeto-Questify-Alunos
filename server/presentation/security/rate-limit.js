const { AppError } = require('../../shared/errors');

/**
 * Limitador de tentativas em memória (melhor esforço). Em ambiente serverless cada instância
 * mantém seu próprio contador; para limite global use um armazenamento compartilhado.
 */
function createRateLimiter({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const hits = new Map();

  function prune(now) {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }

  return {
    check(key) {
      const now = Date.now();
      if (hits.size > 5000) prune(now);
      const entry = hits.get(key);
      if (entry && entry.resetAt > now && entry.count >= max) {
        const error = new AppError(429, 'MUITAS_TENTATIVAS', 'Muitas tentativas de login. Tente novamente mais tarde.');
        error.headers = { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) };
        throw error;
      }
    },
    fail(key) {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) hits.set(key, { count: 1, resetAt: now + windowMs });
      else entry.count += 1;
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

module.exports = { createRateLimiter };
