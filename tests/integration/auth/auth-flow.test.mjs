import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestSchema } from '../../helpers/db.mjs';
import { runSeed } from '../../../database/scripts/seed.mjs';

// O pool da aplicação lê DATABASE_URL; apontamos para um schema isolado antes de carregar o servidor.
const env = await createTestSchema();
process.env.DATABASE_URL = env.url;
process.env.NODE_ENV = 'test';
const { createAppServer } = (await import('../../../backend/server.js')).default;
const { closePool } = (await import('../../../server/persistence/postgres/pool.js')).default;

const server = createAppServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closePool();
  await env.cleanup();
});

async function call(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, setCookie: response.headers.get('set-cookie') };
}

const valid = { nome: 'Maria Teste', email: 'Maria@Exemplo.com', senha: 'Senha@1234' };

test('fluxo de autenticação ponta a ponta', async (t) => {
  await t.test('health confirma a conexão com o banco', async () => {
    const res = await call('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.database, 'connected');
  });

  await t.test('cadastro cria estudante ativo, com UUID e e-mail em minúsculas', async () => {
    const res = await call('/api/v1/auth/register', { method: 'POST', body: { ...valid, papel: 'administrador' } });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, 'maria@exemplo.com');
    assert.equal(res.body.user.papel, 'estudante');
    assert.equal(res.body.user.ativo, true);
    assert.match(res.body.user.id, /^[0-9a-f-]{36}$/);
    assert.equal(res.body.user.senhaHash, undefined);
  });

  await t.test('e-mail duplicado retorna 409 e campo obrigatório ausente retorna 400 com o campo', async () => {
    const dup = await call('/api/v1/auth/register', { method: 'POST', body: { ...valid, email: 'MARIA@exemplo.com' } });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.code, 'EMAIL_DUPLICADO');
    const missing = await call('/api/v1/auth/register', { method: 'POST', body: { email: 'x@y.co', senha: 'Senha@1234' } });
    assert.equal(missing.status, 400);
    assert.equal(missing.body.field, 'nome');
  });

  let cookie;
  await t.test('login define cookie HttpOnly sem expor o token no corpo', async () => {
    const res = await call('/api/v1/auth/login', { method: 'POST', body: { email: 'maria@exemplo.com', senha: valid.senha } });
    assert.equal(res.status, 200);
    assert.match(res.setCookie, /questify_session=.+; Path=\/; HttpOnly; SameSite=Lax/);
    assert.equal(res.body.accessToken, undefined);
    cookie = res.setCookie.split(';')[0];
  });

  await t.test('credenciais inválidas retornam 401 genérico', async () => {
    const res = await call('/api/v1/auth/login', { method: 'POST', body: { email: 'maria@exemplo.com', senha: 'errada' } });
    assert.equal(res.status, 401);
    const unknown = await call('/api/v1/auth/login', { method: 'POST', body: { email: 'nao@existe.com', senha: 'errada' } });
    assert.equal(unknown.body.message, res.body.message);
  });

  await t.test('GET /users/me exige sessão e retorna o usuário', async () => {
    assert.equal((await call('/api/v1/users/me')).status, 401);
    const res = await call('/api/v1/users/me', { cookie });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'maria@exemplo.com');
  });

  await t.test('requisição de outra origem é bloqueada (CSRF)', async () => {
    const res = await call('/api/v1/auth/login', { method: 'POST', body: { email: 'a@b.co', senha: 'x' }, headers: { Origin: 'https://malicioso.example' } });
    assert.equal(res.status, 403);
  });

  await t.test('conta desativada não consegue entrar nem usar sessão existente', async () => {
    const env2 = env.client;
    await env2.query(`UPDATE users SET ativo = FALSE WHERE email = 'maria@exemplo.com'`);
    assert.equal((await call('/api/v1/users/me', { cookie })).status, 401);
    const res = await call('/api/v1/auth/login', { method: 'POST', body: { email: 'maria@exemplo.com', senha: valid.senha } });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'CONTA_DESATIVADA');
    await env2.query(`UPDATE users SET ativo = TRUE WHERE email = 'maria@exemplo.com'`);
  });

  await t.test('logout invalida a sessão', async () => {
    const res = await call('/api/v1/auth/logout', { method: 'POST', cookie });
    assert.equal(res.status, 200);
    assert.match(res.setCookie, /Max-Age=0/);
    assert.equal((await call('/api/v1/users/me', { cookie })).status, 401);
  });

  await t.test('usuários do seed conseguem fazer login', async () => {
    await runSeed(env.client, { log: () => {} });
    const res = await call('/api/v1/auth/login', { method: 'POST', body: { email: 'admin.teste@questify.local', senha: 'Questify@123' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.papel, 'administrador');
  });
});
