import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGuildsRoute } from '../../src/presentation/http/guilds-route.js';
import { createGuildService } from '../../src/business/application/social/guild.service.js';
import { ForeignKeyViolationError, UnauthenticatedError, UniqueViolationError } from '../../src/shared/errors.js';

const AUTH = { authorization: `Bearer ${'A'.repeat(43)}` };
const authenticated = async () => 42;
const rejectAuth = async () => {
  throw new UnauthenticatedError();
};

// ---- Camada 1 isolada (serviço falso) ---------------------------------------------------------

test('POST sem sessão válida -> 401 e o serviço não é chamado', async () => {
  let called = false;
  const route = createGuildsRoute({ requireUser: rejectAuth, createGuild: async () => (called = true) });
  const res = await route.create({ method: 'POST', headers: {}, body: { name: 'Matemática Avançada', categoryId: 1 } });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'UNAUTHENTICATED');
  assert.equal(called, false);
});

test('POST com sucesso -> 201 e repassa payload e userId ao serviço', async () => {
  let received;
  const route = createGuildsRoute({
    requireUser: authenticated,
    createGuild: async (payload, userId) => {
      received = { payload, userId };
      return { id: 9, name: 'Matemática Avançada' };
    },
  });
  const body = { name: 'Matemática Avançada', categoryId: 1 };
  const res = await route.create({ method: 'POST', headers: AUTH, body });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { id: 9, name: 'Matemática Avançada' });
  assert.deepEqual(received, { payload: body, userId: 42 });
});

test('corpo ausente, JSON inválido ou não-objeto -> 400; corpo grande -> 413', async () => {
  const route = createGuildsRoute({ requireUser: authenticated, createGuild: async () => assert.fail('não deveria chamar') });
  for (const request of [{ bodyError: 'invalid_json' }, { body: [] }, { body: 'texto' }, { body: null }, {}]) {
    const res = await route.create({ method: 'POST', headers: AUTH, ...request });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'INVALID_JSON');
  }
  const tooLarge = await route.create({ method: 'POST', headers: AUTH, bodyError: 'too_large' });
  assert.equal(tooLarge.status, 413);
});

test('o 401 vem antes da validação do corpo', async () => {
  const route = createGuildsRoute({ requireUser: rejectAuth });
  const res = await route.create({ method: 'POST', headers: {}, bodyError: 'invalid_json' });
  assert.equal(res.status, 401);
});

test('método diferente de POST -> 405 com Allow', async () => {
  const route = createGuildsRoute({ requireUser: authenticated });
  const res = await route.create({ method: 'GET', headers: AUTH });
  assert.equal(res.status, 405);
  assert.equal(res.headers.Allow, 'POST');
});

test('erro inesperado -> 500 sem vazar detalhes', async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    const route = createGuildsRoute({
      requireUser: authenticated,
      createGuild: async () => {
        throw new Error('senha do banco: segredo');
      },
    });
    const res = await route.create({ method: 'POST', headers: AUTH, body: {} });
    assert.equal(res.status, 500);
    assert.equal(JSON.stringify(res.body).includes('segredo'), false);
  } finally {
    console.error = originalError;
  }
});

test('GET categorias -> 200 com lista; sem sessão -> 401; outro método -> 405', async () => {
  const categories = [{ id: 1, name: 'Matemática' }];
  const route = createGuildsRoute({ requireUser: authenticated, listGuildCategories: async () => categories });
  const ok = await route.categories({ method: 'GET', headers: AUTH });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body, { categories });

  const denied = await createGuildsRoute({ requireUser: rejectAuth }).categories({ method: 'GET', headers: {} });
  assert.equal(denied.status, 401);

  const wrongMethod = await route.categories({ method: 'POST', headers: AUTH });
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.Allow, 'GET');
});

// ---- Camada 1 + serviço real (Camada 2) com repositório em memória -----------------------------
// Cobre a seção "Testes" da tarefa pelo caminho completo rota -> serviço -> repositório.

function buildRoute({ raceOnInsert } = {}) {
  const store = { guilds: [], memberships: [], categories: [{ id: 1, name: 'Matemática' }] };
  const repository = {
    findCategoryById: async (id) => store.categories.find((c) => c.id === id) ?? null,
    findByName: async (name) => store.guilds.find((g) => g.name.toLowerCase() === name.toLowerCase()) ?? null,
    listCategories: async () => store.categories,
    createGuildWithAdmin: async (tx, { name, categoryId, adminRole }, userId) => {
      if (raceOnInsert) throw raceOnInsert;
      const guild = { id: store.guilds.length + 1, name, categoryId, createdAt: 'agora' };
      store.guilds.push(guild);
      store.memberships.push({ guildId: guild.id, userId, role: adminRole });
      return guild;
    },
  };
  const service = createGuildService({ repository, withTransaction: (work) => work({}) });
  return { store, route: createGuildsRoute({ requireUser: authenticated, ...service }) };
}

const post = (route, body) => route.create({ method: 'POST', headers: AUTH, body });

test('nome com menos de 3 caracteres -> 400 com campo name', async () => {
  const { route } = buildRoute();
  const res = await post(route, { name: 'ab', categoryId: 1 });
  assert.equal(res.status, 400);
  assert.ok(res.body.fields.name);
});

test('nome com mais de 30 caracteres -> 400 com campo name', async () => {
  const { route } = buildRoute();
  const res = await post(route, { name: 'a'.repeat(31), categoryId: 1 });
  assert.equal(res.status, 400);
  assert.ok(res.body.fields.name);
});

test('nome com exatamente 3 e 30 caracteres é aceito', async () => {
  const { route } = buildRoute();
  assert.equal((await post(route, { name: 'abc', categoryId: 1 })).status, 201);
  assert.equal((await post(route, { name: 'b'.repeat(30), categoryId: 1 })).status, 201);
});

test('ausência de categoria -> 400 com campo categoryId; categoria inexistente também', async () => {
  const { route, store } = buildRoute();
  const missing = await post(route, { name: 'Matemática Avançada' });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.fields.categoryId, 'Selecione uma categoria válida.');

  const unknown = await post(route, { name: 'Matemática Avançada', categoryId: 999 });
  assert.equal(unknown.status, 400);
  assert.ok(unknown.body.fields.categoryId);
  assert.equal(store.guilds.length, 0);
});

test('criação com sucesso -> 201, guilda salva com a categoria e criador como admin', async () => {
  const { route, store } = buildRoute();
  const res = await post(route, { name: '  Matemática   Avançada ', categoryId: 1 });
  assert.equal(res.status, 201);
  assert.equal(res.body.name, 'Matemática Avançada');
  assert.equal(res.body.categoryId, 1);
  assert.deepEqual(res.body.membership, { userId: 42, role: 'admin' });
  assert.deepEqual(store.memberships, [{ guildId: res.body.id, userId: 42, role: 'admin' }]);
});

test('nome duplicado (sem diferenciar caixa) -> 409 com a mensagem da tarefa', async () => {
  const { route, store } = buildRoute();
  assert.equal((await post(route, { name: 'Física Básica', categoryId: 1 })).status, 201);
  const res = await post(route, { name: 'física básica', categoryId: 1 });
  assert.equal(res.status, 409);
  assert.equal(res.body.message, 'Este nome de guilda já está em uso, escolha outro.');
  assert.equal(store.guilds.length, 1);
});

test('corrida: UNIQUE/FK no banco depois das pré-verificações vira 409/400/401', async () => {
  const unique = await post(buildRoute({ raceOnInsert: new UniqueViolationError('name') }).route, { name: 'Física Básica', categoryId: 1 });
  assert.equal(unique.status, 409);

  const fk = await post(buildRoute({ raceOnInsert: new ForeignKeyViolationError('categoryId') }).route, { name: 'Física Básica', categoryId: 1 });
  assert.equal(fk.status, 400);

  const user = await post(buildRoute({ raceOnInsert: new ForeignKeyViolationError('userId') }).route, { name: 'Física Básica', categoryId: 1 });
  assert.equal(user.status, 401);
});
