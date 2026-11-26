// Squad 2 — rota HTTP da história #108 Criar Quest, sozinha e ligada ao serviço (Jest).
import { describe, test, expect, jest } from '@jest/globals';
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

describe('rota isolada', () => {
  test('POST sem sessão válida -> 401 e o serviço não é chamado', async () => {
    const createQuest = jest.fn();
    const route = createQuestsRoute({ requireUser: rejectAuth, createQuest });
    const res = await route.create({ method: 'POST', headers: {}, body: BODY });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
    expect(createQuest).not.toHaveBeenCalled();
  });

  test.each(['GET', 'PUT', 'PATCH', 'DELETE'])('%s em /quests -> 405 com Allow: POST', async (method) => {
    const route = createQuestsRoute({ requireUser: authenticated });
    const res = await route.create({ method, headers: AUTH });
    expect(res.status).toBe(405);
    expect(res.headers.Allow).toBe('POST');
  });

  test('POST em /quest-categories -> 405 com Allow: GET', async () => {
    const route = createQuestsRoute({ requireUser: authenticated });
    const res = await route.categories({ method: 'POST', headers: AUTH });
    expect(res.status).toBe(405);
    expect(res.headers.Allow).toBe('GET');
  });

  test('JSON inválido -> 400, corpo grande -> 413, corpo que não é objeto -> 400', async () => {
    const createQuest = jest.fn();
    const route = createQuestsRoute({ requireUser: authenticated, createQuest });
    expect((await route.create({ method: 'POST', headers: AUTH, bodyError: 'invalid_json' })).status).toBe(400);
    expect((await route.create({ method: 'POST', headers: AUTH, bodyError: 'too_large' })).status).toBe(413);
    const notObject = await route.create({ method: 'POST', headers: AUTH, body: [1, 2] });
    expect(notObject.status).toBe(400);
    expect(notObject.body.code).toBe('INVALID_JSON');
    expect(createQuest).not.toHaveBeenCalled();
  });

  test('tipos errados no payload -> 400 com fields, sem chamar o serviço', async () => {
    const createQuest = jest.fn();
    const route = createQuestsRoute({ requireUser: authenticated, createQuest });
    const res = await route.create({ method: 'POST', headers: AUTH, body: { ...BODY, title: 123, categoryId: { x: 1 } } });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields).sort()).toEqual(['categoryId', 'title']);
    expect(createQuest).not.toHaveBeenCalled();
  });

  test('origem de outro site -> 403; mesma origem e sem Origin passam', async () => {
    const route = createQuestsRoute({ requireUser: authenticated, createQuest: async () => ({ id: 1 }) });
    const other = await route.create({ method: 'POST', headers: { ...AUTH, origin: 'https://malicioso.com' }, body: BODY });
    expect(other.status).toBe(403);
    expect(other.body.code).toBe('FORBIDDEN_ORIGIN');
    expect((await route.create({ method: 'POST', headers: { ...AUTH, origin: 'https://questify.app' }, body: BODY })).status).toBe(201);
    expect((await route.create({ method: 'POST', headers: AUTH, body: BODY })).status).toBe(201);
  });

  test('o serviço recebe só os campos permitidos e o id da sessão', async () => {
    const createQuest = jest.fn(async () => ({ id: 1 }));
    const route = createQuestsRoute({ requireUser: authenticated, createQuest });
    await route.create({ method: 'POST', headers: AUTH, body: { ...BODY, xp: 9999, status: 'concluida', userId: 1 } });
    expect(createQuest).toHaveBeenCalledTimes(1);
    const [payload, userId] = createQuest.mock.calls[0];
    expect(userId).toBe(42);
    expect(Object.keys(payload).sort()).toEqual(['categoryId', 'deadline', 'description', 'title']);
  });

  test('erro inesperado do serviço -> 500 genérico, sem detalhes internos', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const route = createQuestsRoute({ requireUser: authenticated, createQuest: async () => { throw new Error('senha do banco'); } });
    const res = await route.create({ method: 'POST', headers: AUTH, body: BODY });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' });
    expect(JSON.stringify(res.body)).not.toContain('senha');
  });
});

describe('isSameOrigin', () => {
  test.each([
    ['URL malformada', { origin: 'nao-e-url', host: 'questify.app' }, false],
    ['x-forwarded-host vale mais que host', { origin: 'https://questify.app', 'x-forwarded-host': 'questify.app', host: 'interno' }, true],
    ['dev: proxy do Vite com origem e servidor locais', { origin: 'http://localhost:5173', host: '127.0.0.1:8000' }, true],
    ['site externo com servidor local', { origin: 'https://malicioso.com', host: '127.0.0.1:8000' }, false],
    ['origem local em servidor público', { origin: 'http://localhost:5173', host: 'questify.app' }, false],
    ['sem host', { origin: 'https://questify.app' }, false],
  ])('%s -> %p', (_caso, headers, esperado) => {
    expect(isSameOrigin(headers)).toBe(esperado);
  });
});

// ---- Camadas 1 + 2 juntas (repositório em memória) ------------------------------------------------

function memoryRepository() {
  const categories = [
    { id: 1, name: 'Resumo', difficulty: 'facil', baseXp: 30 },
    { id: 3, name: 'Estudo', difficulty: 'medio', baseXp: 60 },
    { id: 7, name: 'Prova', difficulty: 'dificil', baseXp: 100 },
  ];
  const quests = [];
  return {
    quests,
    listCategories: jest.fn(async () => categories),
    findCategoryById: jest.fn(async (id) => categories.find((c) => c.id === id) || null),
    insertQuest: jest.fn(async (tx, quest) => {
      expect(tx).toBe('TX'); // a gravação precisa usar a transação
      const saved = { id: quests.length + 1, ...quest, createdAt: new Date() };
      quests.push(saved);
      return saved;
    }),
  };
}

function wiredRoute(repository = memoryRepository()) {
  const service = createQuestService({ repository, withTransaction: (work) => work('TX'), today: () => TODAY });
  return { repository, route: createQuestsRoute({ requireUser: authenticated, ...service }) };
}

describe('rota + serviço', () => {
  test.each([
    [1, 30, 'facil'],
    [3, 60, 'medio'],
    [7, 100, 'dificil'],
  ])('categoria %p -> 201, pendente, dono da sessão e %p XP', async (categoryId, xp, difficulty) => {
    const { route, repository } = wiredRoute();
    const res = await route.create({ method: 'POST', headers: AUTH, body: { ...BODY, categoryId } });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'pendente', userId: 42, xp, isGuild: false });
    expect(res.body.category).toMatchObject({ id: categoryId, difficulty });
    expect(repository.quests).toHaveLength(1);
  });

  test('XP, dificuldade, status, usuário e guilda forjados no payload são ignorados', async () => {
    const { route, repository } = wiredRoute();
    const res = await route.create({
      method: 'POST',
      headers: AUTH,
      body: { ...BODY, xp: 9999, difficulty: 'dificil', status: 'concluida', userId: 1, user_id: 1, isGuild: true },
    });
    expect(res.status).toBe(201);
    expect(repository.quests[0]).toMatchObject({ xp: 60, status: 'pendente', userId: 42, isGuild: false });
  });

  test('payload incompleto -> 400 listando os campos e nada é gravado', async () => {
    const { route, repository } = wiredRoute();
    const res = await route.create({ method: 'POST', headers: AUTH, body: { description: 'sem o resto' } });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.fields).sort()).toEqual(['categoryId', 'deadline', 'title']);
    expect(repository.insertQuest).not.toHaveBeenCalled();
  });

  test('prazo no passado -> 400 em deadline e nada é gravado', async () => {
    const { route, repository } = wiredRoute();
    const res = await route.create({ method: 'POST', headers: AUTH, body: { ...BODY, deadline: '2026-11-11' } });
    expect(res.status).toBe(400);
    expect(res.body.fields.deadline).toBeTruthy();
    expect(repository.insertQuest).not.toHaveBeenCalled();
  });

  test('categoria inexistente -> 400 em categoryId', async () => {
    const { route, repository } = wiredRoute();
    const res = await route.create({ method: 'POST', headers: AUTH, body: { ...BODY, categoryId: 99 } });
    expect(res.status).toBe(400);
    expect(res.body.fields.categoryId).toBeTruthy();
    expect(repository.quests).toHaveLength(0);
  });

  test('FK do banco: categoria removida entre a checagem e o INSERT -> 400; usuário removido -> 401', async () => {
    const repo = memoryRepository();
    repo.insertQuest = async () => { throw new ForeignKeyViolationError('categoryId'); };
    expect((await wiredRoute(repo).route.create({ method: 'POST', headers: AUTH, body: BODY })).status).toBe(400);
    repo.insertQuest = async () => { throw new ForeignKeyViolationError('userId'); };
    expect((await wiredRoute(repo).route.create({ method: 'POST', headers: AUTH, body: BODY })).status).toBe(401);
  });

  test('3 envios iguais criam 3 quests distintas (não há regra de unicidade)', async () => {
    const { route, repository } = wiredRoute();
    for (let i = 0; i < 3; i += 1) {
      expect((await route.create({ method: 'POST', headers: AUTH, body: BODY })).status).toBe(201);
    }
    expect(new Set(repository.quests.map((q) => q.id)).size).toBe(3);
  });

  test('GET categorias é público -> 200 com a lista, mesmo sem sessão; criar continua exigindo login', async () => {
    const repository = memoryRepository();
    const service = createQuestService({ repository, withTransaction: (work) => work('TX'), today: () => TODAY });
    const route = createQuestsRoute({ requireUser: rejectAuth, ...service });
    const res = await route.categories({ method: 'GET', headers: {} });
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(3);
    expect((await route.create({ method: 'POST', headers: {}, body: BODY })).status).toBe(401);
  });

  describe('Cache-Control', () => {
    const CDN_CACHE = 'public, s-maxage=300, stale-while-revalidate=600';
    const service = () =>
      createQuestService({ repository: memoryRepository(), withTransaction: (work) => work('TX'), today: () => TODAY });

    test('GET categorias 200 -> cache público de CDN', async () => {
      const route = createQuestsRoute({ requireUser: rejectAuth, ...service() });
      const res = await route.categories({ method: 'GET', headers: {} });
      expect(res.status).toBe(200);
      expect(res.headers['Cache-Control']).toBe(CDN_CACHE);
    });

    test('GET categorias com erro 405 e 500 -> sem cabeçalho de cache (o adaptador aplica no-store)', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const failing = createQuestsRoute({ listQuestCategories: jest.fn(async () => { throw new Error('db fora'); }) });
      const res500 = await failing.categories({ method: 'GET', headers: {} });
      expect(res500.status).toBe(500);
      expect(res500.headers?.['Cache-Control']).toBeUndefined();
      spy.mockRestore();
      const res405 = await failing.categories({ method: 'POST', headers: {} });
      expect(res405.status).toBe(405);
      expect(res405.headers['Cache-Control']).toBeUndefined();
    });

    test('POST /quests (201, 400, 401, 405) nunca define cache público', async () => {
      const route = createQuestsRoute({ requireUser: authenticated, ...service() });
      const unauth = createQuestsRoute({ requireUser: rejectAuth, ...service() });
      const responses = [
        await route.create({ method: 'POST', headers: AUTH, body: BODY }),
        await route.create({ method: 'POST', headers: AUTH, body: { ...BODY, title: 123 } }),
        await unauth.create({ method: 'POST', headers: {}, body: BODY }),
        await route.create({ method: 'GET', headers: AUTH }),
      ];
      expect(responses.map((r) => r.status)).toEqual([201, 400, 401, 405]);
      for (const res of responses) expect(res.headers?.['Cache-Control']).toBeUndefined();
    });
  });
});
