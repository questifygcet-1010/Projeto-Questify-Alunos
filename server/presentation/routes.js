const auth = require('./handlers/auth');

/**
 * Tabela única de rotas HTTP. Usada pelo servidor local (backend/server.js) e pelas
 * funções serverless da Vercel (api/v1/**), garantindo o mesmo comportamento nos dois ambientes.
 */
module.exports = {
  '/api/v1/health': auth.health,
  '/api/v1/auth/register': auth.register,
  '/api/v1/auth/login': auth.login,
  '/api/v1/auth/logout': auth.logout,
  '/api/v1/users/me': auth.me,
};
