const authService = require('../../business/application/auth/auth.service');
const { AppError } = require('../../shared/errors');
const { checkDatabase } = require('../../business/application/health.service');
const { json, readJsonBody, clientIp, route } = require('../http');
const { getSessionToken, sessionCookie, clearedSessionCookie, requireUser } = require('../security/session');
const { createRateLimiter } = require('../security/rate-limit');

const loginLimiter = createRateLimiter();

const register = route({
  methods: ['POST'],
  async handler(req, res) {
    const user = await authService.register(await readJsonBody(req));
    return json(res, 201, { user });
  },
});

const login = route({
  methods: ['POST'],
  async handler(req, res) {
    const payload = await readJsonBody(req);
    const key = `${clientIp(req)}|${typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''}`;
    loginLimiter.check(key);
    try {
      const { token, maxAge, user } = await authService.login(payload);
      loginLimiter.reset(key);
      // Token somente em cookie HttpOnly: nunca no corpo da resposta nem em localStorage.
      return json(res, 200, { user }, { 'Set-Cookie': sessionCookie(req, token, maxAge) });
    } catch (error) {
      if (error instanceof AppError && (error.status === 401 || error.status === 403)) loginLimiter.fail(key);
      throw error;
    }
  },
});

const logout = route({
  methods: ['POST'],
  async handler(req, res) {
    await authService.logout(getSessionToken(req));
    return json(res, 200, { message: 'Sessão encerrada.' }, { 'Set-Cookie': clearedSessionCookie(req) });
  },
});

const me = route({
  methods: ['GET'],
  async handler(req, res) {
    const user = await requireUser(req);
    return json(res, 200, { user });
  },
});

const health = route({
  methods: ['GET'],
  async handler(req, res) {
    await checkDatabase();
    return json(res, 200, { status: 'ok', service: 'questify', database: 'connected' });
  },
});

module.exports = { register, login, logout, me, health };
