// Squad 2 — repositório de quests (Camada 3) com um banco falso (Jest). Não acessa banco real.
import { describe, test, expect, jest } from '@jest/globals';
import {
  findCategoryById,
  insertQuest,
  listCategories,
} from '../../src/persistence/repositories/quests/quests.repository.js';
import { ForeignKeyViolationError } from '../../src/shared/errors.js';

const QUEST = {
  userId: 1, categoryId: 3, title: 'Resumo', description: null, deadline: '2026-11-20', xp: 60, status: 'pendente', isGuild: false,
};

// O driver `postgres` devolve BIGINT como string e DATE como Date.
const QUEST_ROW = {
  id: '10', user_id: '1', category_id: '3', title: 'Resumo', description: null,
  deadline: new Date('2026-11-20T00:00:00Z'), xp: 60, status: 'pendente', is_guild: false, created_at: new Date(),
};

const fakeDb = (rows) => ({ unsafe: jest.fn(async () => rows) });

describe('quests.repository', () => {
  test('listCategories converte as linhas (BIGINT string -> número)', async () => {
    const db = fakeDb([{ id: '1', name: 'Resumo', difficulty: 'facil', base_xp: '30' }]);
    await expect(listCategories(db)).resolves.toEqual([{ id: 1, name: 'Resumo', difficulty: 'facil', baseXp: 30 }]);
  });

  test('findCategoryById usa parâmetro ($1) e devolve null quando não existe', async () => {
    const db = fakeDb([]);
    await expect(findCategoryById("3; DROP TABLE quests", db)).resolves.toBeNull();
    const [sql, params] = db.unsafe.mock.calls[0];
    expect(sql).toContain('WHERE id = $1');
    expect(sql).not.toContain('DROP');
    expect(params).toEqual(['3; DROP TABLE quests']);
  });

  test('insertQuest grava com 8 parâmetros e devolve a quest convertida', async () => {
    const tx = fakeDb([QUEST_ROW]);
    const saved = await insertQuest(tx, QUEST);
    const [sql, params] = tx.unsafe.mock.calls[0];
    expect(sql).toMatch(/VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8\)/);
    expect(params).toEqual([1, 3, 'Resumo', null, '2026-11-20', 60, 'pendente', false]);
    expect(saved).toMatchObject({ id: 10, userId: 1, categoryId: 3, deadline: '2026-11-20', xp: 60, status: 'pendente' });
  });

  test('insertQuest exige userId e status (vindos do serviço)', async () => {
    const tx = fakeDb([QUEST_ROW]);
    await expect(insertQuest(tx, { ...QUEST, userId: undefined })).rejects.toThrow(TypeError);
    await expect(insertQuest(tx, { ...QUEST, status: '' })).rejects.toThrow(TypeError);
    expect(tx.unsafe).not.toHaveBeenCalled();
  });

  test.each([
    ['quests_category_id_fkey', 'categoryId'],
    ['quests_user_id_fkey', 'userId'],
  ])('violação de FK %s vira ForeignKeyViolationError(%s)', async (constraint_name, field) => {
    const tx = { unsafe: jest.fn(async () => { throw Object.assign(new Error('fk'), { code: '23503', constraint_name }); }) };
    await expect(insertQuest(tx, QUEST)).rejects.toMatchObject({ field });
    await expect(insertQuest(tx, QUEST)).rejects.toBeInstanceOf(ForeignKeyViolationError);
  });

  test('outros erros do banco passam adiante sem tradução', async () => {
    const original = Object.assign(new Error('timeout'), { code: '57014' });
    const tx = { unsafe: jest.fn(async () => { throw original; }) };
    await expect(insertQuest(tx, QUEST)).rejects.toBe(original);
  });
});
