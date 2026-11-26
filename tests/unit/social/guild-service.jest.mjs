import { describe, test, expect, jest } from '@jest/globals';
import { createGuildService } from '../../../src/business/application/social/guild.service.js';
import {
  ConflictError,
  UnauthenticatedError,
  ValidationError,
} from '../../../src/shared/errors.js';

describe('Serviço de Guildas (guild.service)', () => {
  test('cria guilda com sucesso quando usuário, categoria e nome são válidos', async () => {
    const repository = {
      findCategoryById: jest.fn().mockResolvedValue({ id: 2, name: 'Exatas' }),
      findByName: jest.fn().mockResolvedValue(null),
      createGuildWithAdmin: jest.fn().mockResolvedValue({
        id: 10,
        name: 'Matemática Discreta',
        categoryId: 2,
      }),
      listCategories: jest.fn(),
    };
    const withTransaction = jest.fn(async (callback) => callback('tx-mock'));
    const service = createGuildService({ repository, withTransaction });

    const result = await service.createGuild(
      { name: '  Matemática   Discreta ', categoryId: 2 },
      99
    );

    expect(repository.findCategoryById).toHaveBeenCalledWith(2, 'tx-mock');
    expect(repository.findByName).toHaveBeenCalledWith('Matemática Discreta', 'tx-mock');
    expect(repository.createGuildWithAdmin).toHaveBeenCalledWith(
      'tx-mock',
      { name: 'Matemática Discreta', categoryId: 2, adminRole: 'admin' },
      99
    );
    expect(result.membership).toEqual({ userId: 99, role: 'admin' });
  });

  test('lança UnauthenticatedError se userId for inválido', async () => {
    const service = createGuildService({ repository: {}, withTransaction: jest.fn() });
    await expect(service.createGuild({ name: 'Guilda Teste', categoryId: 1 }, null))
      .rejects.toThrow(UnauthenticatedError);
  });

  test('lança ConflictError quando já existe guilda com o mesmo nome', async () => {
    const repository = {
      findCategoryById: jest.fn().mockResolvedValue({ id: 1 }),
      findByName: jest.fn().mockResolvedValue({ id: 5, name: 'Devs JS' }),
      createGuildWithAdmin: jest.fn(),
    };
    const withTransaction = jest.fn(async (callback) => callback('tx-mock'));
    const service = createGuildService({ repository, withTransaction });

    await expect(service.createGuild({ name: 'Devs JS', categoryId: 1 }, 7))
      .rejects.toThrow(ConflictError);
    expect(repository.createGuildWithAdmin).not.toHaveBeenCalled();
  });

  test('lança ValidationError quando a categoria não existe no banco', async () => {
    const repository = {
      findCategoryById: jest.fn().mockResolvedValue(null),
      findByName: jest.fn(),
      createGuildWithAdmin: jest.fn(),
    };
    const withTransaction = jest.fn(async (callback) => callback('tx-mock'));
    const service = createGuildService({ repository, withTransaction });

    await expect(service.createGuild({ name: 'Nova Guilda', categoryId: 999 }, 7))
      .rejects.toThrow(ValidationError);
  });
});
