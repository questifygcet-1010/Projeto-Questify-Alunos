const { AppError } = require('../../shared/errors');

/**
 * Configuração de conexão lida exclusivamente de variáveis de ambiente.
 * DATABASE_URL  -> connection string do PostgreSQL (obrigatória)
 * DATABASE_SSL  -> 'require' (TLS sem validar CA) ou 'verify-full' (TLS validado). Vazio = sem TLS
 *                  (também é possível usar ?sslmode=require na própria URL).
 */
function getConnectionConfig() {
  const connectionString = (process.env.DATABASE_URL || '').trim();
  if (!connectionString) {
    throw new AppError(503, 'MISSING_DATABASE_URL', 'Defina DATABASE_URL no ambiente (.env local ou variáveis da Vercel).');
  }
  const url = new URL(connectionString);
  const config = {
    host: url.hostname,
    port: Number(url.port || 5432),
    database: url.pathname.replace(/^\/+/, ''),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
  const options = url.searchParams.get('options');
  if (options) config.options = options;
  const ssl = (process.env.DATABASE_SSL || url.searchParams.get('sslmode') || '').trim().toLowerCase();
  if (ssl === 'require') config.ssl = { rejectUnauthorized: false };
  else if (ssl === 'verify-full') config.ssl = { rejectUnauthorized: true };
  return config;
}

/** Descrição segura da conexão em uso (sem expor a senha), útil para diagnosticar erros de login. */
function describeConnection() {
  try {
    const url = new URL(process.env.DATABASE_URL);
    return `${decodeURIComponent(url.username)}@${url.hostname}:${url.port || 5432}${url.pathname} (senha com ${decodeURIComponent(url.password).length} caracteres)`;
  } catch {
    return 'DATABASE_URL ausente ou inválida';
  }
}

module.exports = { getConnectionConfig, describeConnection };
