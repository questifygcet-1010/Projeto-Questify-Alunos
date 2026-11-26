// Squad 2 — adaptador HTTP da Vercel/servidor local (api/_lib/quests-http.js) (Jest).
// Só cenários que não chegam ao banco: método errado e cabeçalhos da resposta.
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createRequire } from 'node:module';

// ESM: o mock precisa ser registrado antes de carregar quem usa o serviço.
jest.unstable_mockModule('../../src/business/application/quests/quest.service.js', () => ({
  createQuest: jest.fn(),
  listQuestCategories: jest.fn(),
}));
const service = await import('../../src/business/application/quests/quest.service.js');
// O adaptador é CommonJS (usado pelas funções da Vercel).
const { quests, categories } = createRequire(import.meta.url)('../../api/_lib/quests-http.js');

function fakeResponse() {
  const res = { headers: {}, statusCode: 0, body: undefined };
  res.setHeader = (name, value) => { res.headers[name.toLowerCase()] = value; };
  res.end = (payload) => { res.body = JSON.parse(payload); return res; };
  return res;
}

describe('quests-http (adaptador)', () => {
  test('GET em /api/v1/quests -> 405 JSON, sem cache e com Allow: POST', async () => {
    const res = fakeResponse();
    await quests({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers.allow).toBe('POST');
    expect(res.body.code).toBeTruthy();
  });

  test('DELETE em /api/v1/quest-categories -> 405 com Allow: GET', async () => {
    const res = fakeResponse();
    await categories({ method: 'DELETE', headers: {} }, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.allow).toBe('GET');
  });

  test('Content-Length bate com o corpo enviado', async () => {
    const res = fakeResponse();
    await quests({ method: 'PUT', headers: {} }, res);
    expect(res.headers['content-length']).toBe(Buffer.byteLength(JSON.stringify(res.body)));
  });

  describe('cabeçalho final (rota + adaptador, serviço falso, sem banco)', () => {
    const PUBLICO = 'public, s-maxage=300, stale-while-revalidate=600';
    let errorSpy;
    beforeEach(() => {
      jest.clearAllMocks();
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => errorSpy.mockRestore());

    test('GET categorias 200 -> Cache-Control público', async () => {
      service.listQuestCategories.mockResolvedValue([{ id: 1 }]);
      const res = fakeResponse();
      await categories({ method: 'GET', headers: {} }, res);
      expect(res.statusCode).toBe(200);
      expect(res.headers['cache-control']).toBe(PUBLICO);
      expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
    });

    test('GET categorias com serviço lançando erro -> 500 no-store', async () => {
      service.listQuestCategories.mockRejectedValue(new Error('falha'));
      const res = fakeResponse();
      await categories({ method: 'GET', headers: {} }, res);
      expect(res.statusCode).toBe(500);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    test('categorias 405 -> no-store', async () => {
      const res = fakeResponse();
      await categories({ method: 'POST', headers: {} }, res);
      expect(res.statusCode).toBe(405);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    test('POST /quests sem token -> 401 no-store, sem chamar o serviço', async () => {
      const res = fakeResponse();
      await quests({ method: 'POST', headers: {}, body: {} }, res);
      expect(res.statusCode).toBe(401);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(service.createQuest).not.toHaveBeenCalled();
    });
  });
});
