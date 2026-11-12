/** Erro de aplicação com status HTTP, código estável e (opcional) campo inválido. */
class AppError extends Error {
  constructor(status, code, message, field) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

module.exports = { AppError };
