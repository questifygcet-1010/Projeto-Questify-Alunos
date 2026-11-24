// CAMADA 2 — Negócio / subcamada Aplicação | Squad 3
// Orquestra o caso de uso "criar guilda". Não conhece HTTP, DOM nem SQL.
import {
  ConflictError,
  ForeignKeyViolationError,
  UnauthenticatedError,
  UniqueViolationError,
  ValidationError,
} from '../../../shared/errors.js';
import {
  GUILD_CREATOR_ROLE,
  GUILD_ERROR_CODES,
  GUILD_MESSAGES,
  parsePositiveId,
  validateGuildInput,
} from '../../domain/social/guild-policy.js';
import { withTransaction as defaultWithTransaction } from '../../../persistence/postgres/transaction.js';
import * as defaultRepository from '../../../persistence/repositories/social/guilds.repository.js';

const nameAlreadyUsed = () =>
  new ConflictError(GUILD_ERROR_CODES.NAME_ALREADY_USED, GUILD_MESSAGES.NAME_ALREADY_USED);

const invalidCategory = () => new ValidationError({ categoryId: GUILD_MESSAGES.CATEGORY_INVALID });

// Corrida entre duas criações: o banco rejeitou (UNIQUE/FK) depois das pré-verificações.
function interpretPersistenceError(error) {
  if (error instanceof UniqueViolationError && error.field === 'name') return nameAlreadyUsed();
  if (error instanceof ForeignKeyViolationError && error.field === 'categoryId') return invalidCategory();
  if (error instanceof ForeignKeyViolationError && error.field === 'userId') return new UnauthenticatedError();
  return error;
}

/** Fábrica com dependências injetáveis (permite testar sem banco). */
export function createGuildService({ repository, withTransaction }) {
  async function createGuild(payload, userId) {
    // 1. Autenticação/identidade
    const authenticatedUserId = parsePositiveId(userId);
    if (authenticatedUserId === null) throw new UnauthenticatedError();

    // 2. Regras de domínio (nome 3–30, categoria informada)
    const { value, errors } = validateGuildInput(payload);
    if (errors) throw new ValidationError(errors);

    // 3. Caso de uso atômico: categoria existe, nome livre, guilda + vínculo admin
    try {
      return await withTransaction(async (tx) => {
        const category = await repository.findCategoryById(value.categoryId, tx);
        if (!category) throw invalidCategory();

        if (await repository.findByName(value.name, tx)) throw nameAlreadyUsed();

        const guild = await repository.createGuildWithAdmin(
          tx,
          { name: value.name, categoryId: value.categoryId, adminRole: GUILD_CREATOR_ROLE },
          authenticatedUserId,
        );
        return { ...guild, membership: { userId: authenticatedUserId, role: GUILD_CREATOR_ROLE } };
      });
    } catch (error) {
      throw interpretPersistenceError(error);
    }
  }

  /** Categorias para o formulário (exige usuário autenticado). */
  async function listGuildCategories(userId) {
    if (parsePositiveId(userId) === null) throw new UnauthenticatedError();
    return repository.listCategories();
  }

  return { createGuild, listGuildCategories };
}

const defaultService = createGuildService({
  repository: defaultRepository,
  withTransaction: defaultWithTransaction,
});

export const createGuild = defaultService.createGuild;
export const listGuildCategories = defaultService.listGuildCategories;
