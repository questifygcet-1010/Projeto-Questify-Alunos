import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQuestsRoute, isSameOrigin } from '../../src/presentation/http/quests-route.js';
import { createQuestService } from '../../src/business/application/quests/quest.service.js';
import { ForeignKeyViolationError, UnauthenticatedError } from '../../src/shared/errors.js';

const AUTH = { authorization: `Bearer ${'A'.repeat(43)}`, host: 'questify.app' };
const authenticated = async () => 42;
const rejectAuth = async () => {
  throw new UnauthenticatedError();
};
const TODAY = '2026-11-12';
const BODY = { categoryId: 3, title: 'Resumo do capítulo 6', description: 'Ler e resumir', deadline: '2026-11-20' };

// ---- Camada 1 isolada (serviço falso) ---------------------------------------------------------

test('POST sem sessão válida -> 401 e o serviço não é chamado', async () => {
  let called = false;
  const route = createQuestsRoute({ requireUser: rejectAuth, createQuest: async () => { called = true; } });
  const res = await route.create({ method: 'POST', headers: {}, body: BODY });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'UNAUTHENTICATED');
  assert.equal(called, false);
});

test('métodos errados -> 405 com Allow', async () => {
  const route = createQuestsRoute({ requireUser: authenticated });
  const post = await route.create({ method: 'GET', headers: AUTH });
  assert.equal(post.status, 405);
  assert.equal(post.headers.Allow, 'POST');
  const get = await route.categories({ method: 'POST', headers: AUTH });
  assert.equal(get.status, 405);
  assert.equal(get.headers.Allow, 'GET');
});

test('JSON inválido, corpo grande e corpo que não é objeto', async () => {
  const route = createQuestsRoute({ requireUser: authenticated, createQuest: async () => assert.fail('não deveria criar') });
  assert.equal((await route.create({ method: 'POST', headers: AUTH, bodyError: 'invalid_json' })).status, 400);
  assert.equal((await route.create({ method: 'POST', headers: AUTH, bodyError: 'too_large' })).status, 413);
  const notObject = await route.create({ method: 'POST', headers: AUTH, body: [1, 2] });
  assert.equal(notObject.status, 400);
  assert.equal(notObject.body.code, 'INVALID_JSON');
});

test('tipos errados no payload -> 400 com fields, sem chamar o serviço', async () => {
  const route = createQuestsRoute({ requireUser: authenticated, createQuest: async () => assert.fail('não deveria criar') });
  const res = await route.create({ method: 'POST', headers: AUTH, body: { ...BODY, title: 123, categoryId: { x: 1 } } });
  assert.equal(res.status, 400);
  assert.deepEqual(Object.keys(res.body.fields).sort(), ['categoryId', 'title']);
});

test('origem de outro site -> 403; mesma origem e sem Origin passam', async () => {
  const route = createQuestsRoute({ requireUser: authenticated, createQuest: async () => ({ id: 1 }) });
  const other = await route.create({ method: 'POST', headers: { ...AUTH, origin: 'https://malicioso.com' }, body: BODY });
  assert.equal(other.status, 403);
  assert.equal(other.body.code, 'FORBIDDEN_ORIGIN');
  assert.equal((await route.create({ method: 'POST', headers: { ...AUTH, origin: 'https://questify.app' }, body: BODY })).status, 201);
  assert.equal((await route.create({ method: 'POST', headers: AUTH, body: BODY })).status, 201);
  assert.equal(isSameOrigin({ origin: 'nao-e-url', host: 'questify.app' }), false);
  assert.equal(isSameOrigin({ origin: 'https://questify.app', 'x-forwarded-host': 'questify.app', host: 'interno' }), true);
  // desenvolvimento: proxy do Vite troca o Host, mas origem e servidor são locais
  assert.equal(isSameOrigin({ origin: 'http://localhost:5173', host: '127.0.0.1:8000' }), true);
  // site externo continua barrado mesmo com servidor local
  assert.equal(isSameOrigin({ origin: 'https://malicioso.com', host: '127.0.0.1:8000' }), false);
  assert.equal(isSameOrigin({ origin: 'http://localhost:5173', host: 'questify.app' }), false);
  assert.equal(isSameOrigin({ origin: 'https://questify.app' }), false);
});

test('o serviço recebe só os campos permitidos e o id da sessão', async () => {
  let received;
  const route = createQuestsRoute({
    requireUser: authenticated,
    createQuest: async (payload, userId) => { received = { payload, userId }; return { id: 1 }; },
  });
  await route.create({ method: 'POST', headers: AUTH, body: { ...BODY, xp: 9999, status: 'concluida', userId: 1 } });
  assert.equal(received.userId, 42);
  assert.deepEqual(Object.keys(received.payload).sort(), ['categoryId', 'deadline', 'description', 'title']);
});

test('erro inesperado do serviço -> 500 genérico, sem detalhes internos', async (t) => {
  t.mock.method(console, 'error', () => {});
  const route = createQuestsRoute({ requireUser: authenticated, createQuest: async () => { throw new Error('senha do banco'); } });
  const res = await route.create({ method: 'POST', headers: AUTH, body: BODY });
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' });
});

// ---- Camadas 1 + 2 juntas (repositório em memória) ------------------------------------------------

function memoryRepository() {
  const categories = [
    { id: 1, name: 'Resumo', difficulty: 'facil', baseXp: 30 },
    { id: 3, name: 'Estudo', difficulty: 'medio', baseXp: 60 },
  ];
  const quests = [];
  return {
    quests,
    async listCategories() { return categories; },
    async findCategoryById(id) { return categories.find((c) => c.id === id) || null; },
    async insertQuest(tx, quest) {
      assert.equal(tx, 'TX', 'a gravação precisa usar a transação');
      const saved = { id: quests.length + 1, ...quest, createdAt: new Date() };
      quests.push(saved);
      return saved;
    },
  };
}

function wiredRoute(repository = memoryRepository()) {
  const service = createQuestService({ repository, withTransaction: (work) => work('TX'), today: () => TODAY });
  return { repository, route: createQuestsRoute({ requireUser: authenticated, ...service }) };
}

test('criação válida -> 201, status pendente, dono da sessão e XP da categoria', async () => {
  const { route, repository } = wiredRoute();
  const res = await route.create({ method: 'POST', headers: AUTH, body: BODY });
  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'pendente');
  assert.equal(res.body.userId, 42);
  assert.equal(res.body.xp, 60);
  assert.equal(res.body.isGuild, false);
  assert.deepEqual(res.body.category, { id: 3, name: 'Estudo', difficulty: 'medio' });
  assert.equal(repository.quests.length, 1);
});

test('XP, dificuldade, status, usuário e guilda forjados no payload são ignorados', async () => {
  const { route, repository } = wiredRoute();
  const res = await route.create({
    method: 'POST',
    headers: AUTH,
    body: { ...BODY, xp: 9999, difficulty: 'dificil', status: 'concluida', userId: 1, user_id: 1, isGuild: true },
  });
  assert.equal(res.status, 201);
  const saved = repository.quests[0];
  assert.equal(saved.xp, 60);
  assert.equal(saved.status, 'pendente');
  assert.equal(saved.userId, 42);
  assert.equal(saved.isGuild, false);
});

test('payload incompleto -> 400 listando os campos e nada é gravado', async () => {
  const { route, repository } = wiredRoute();
  const res = await route.create({ method: 'POST', headers: AUTH, body: { description: 'sem o resto' } });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
  assert.deepEqual(Object.keys(res.body.fields).sort(), ['categoryId', 'deadline', 'title']);
  assert.equal(repository.quests.length, 0);
});

test('categoria inexistente -> 400 em categoryId', async () => {
  const { route, repository } = wiredRoute();
  const res = await route.create({ method: 'POST', headers: AUTH, body: { ...BODY, categoryId: 99 } });
  assert.equal(res.status, 400);
  assert.ok(res.body.fields.categoryId);
  assert.equal(repository.quests.length, 0);
});

test('FK do banco: categoria removida entre a checagem e o INSERT -> 400; usuário removido -> 401', async () => {
  const repo = memoryRepository();
  repo.insertQuest = async () => { throw new ForeignKeyViolationError('categoryId'); };
  assert.equal((await wiredRoute(repo).route.create({ method: 'POST', headers: AUTH, body: BODY })).status, 400);
  repo.insertQuest = async () => { throw new ForeignKeyViolationError('userId'); };
  assert.equal((await wiredRoute(repo).route.create({ method: 'POST', headers: AUTH, body: BODY })).status, 401);
});

test('GET categorias é público -> 200 com a lista, mesmo sem sessão', async () => {
  const repository = memoryRepository();
  const service = createQuestService({ repository, withTransaction: (work) => work('TX'), today: () => TODAY });
  const route = createQuestsRoute({ requireUser: rejectAuth, ...service });
  const res = await route.categories({ method: 'GET', headers: {} });
  assert.equal(res.status, 200);
  assert.equal(res.body.categories.length, 2);
  // criar continua exigindo login
  assert.equal((await route.create({ method: 'POST', headers: {}, body: BODY })).status, 401);
});
