// CAMADA 2 — Negócio / subcamada Aplicação | Squad 2 (Quests)
// Orquestra o caso de uso "criar quest" (história #108). Não conhece HTTP, DOM nem SQL.
import { ForeignKeyViolationError, UnauthenticatedError, ValidationError } from '../../../shared/errors.js';
import {
  QUEST_INITIAL_STATUS,
  QUEST_MESSAGES,
  parsePositiveId,
  validateQuestInput,
} from '../../domain/quests/quest-policy.js';
import { calculateQuestXp } from '../../domain/quests/xp-policy.js';
import { withTransaction as defaultWithTransaction } from '../../../persistence/postgres/transaction.js';
import * as defaultRepository from '../../../persistence/repositories/quests/quests.repository.js';

// O prazo é uma data de calendário dos estudantes (Brasil), não do servidor (UTC na Vercel).
const QUEST_TIME_ZONE = 'America/Sao_Paulo';

/** Data de hoje "AAAA-MM-DD" no fuso informado. */
export function todayIn(timeZone, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

const invalidCategory = () => new ValidationError({ categoryId: QUEST_MESSAGES.CATEGORY_INVALID });

// Corrida entre a checagem e o INSERT: o banco rejeitou pela FK.
function interpretPersistenceError(error) {
  if (error instanceof ForeignKeyViolationError && error.field === 'categoryId') return invalidCategory();
  if (error instanceof ForeignKeyViolationError && error.field === 'userId') return new UnauthenticatedError();
  return error;
}

const withCategory = (quest, category) => ({
  ...quest,
  category: { id: category.id, name: category.name, difficulty: category.difficulty },
});

/** Fábrica com dependências injetáveis (permite testar sem banco). */
export function createQuestService({ repository, withTransaction, today = () => todayIn(QUEST_TIME_ZONE) }) {
  /**
   * Cria uma quest individual. Regras da história #108:
   * dono = usuário da sessão; dificuldade e XP vêm da categoria; status inicial "pendente".
   * XP, dificuldade, status, usuário e flag de guilda enviados pelo cliente são ignorados.
   */
  async function createQuest(payload, userId) {
    // 1. Identidade (vem da sessão, nunca do corpo)
    const authenticatedUserId = parsePositiveId(userId);
    if (authenticatedUserId === null) throw new UnauthenticatedError();

    // 2. Regras de domínio (categoria, título e prazo obrigatórios)
    const { value, errors } = validateQuestInput(payload, today());
    if (errors) throw new ValidationError(errors);

    // 3. Caso de uso atômico: categoria existe -> XP calculado -> quest gravada
    try {
      return await withTransaction(async (tx) => {
        const category = await repository.findCategoryById(value.categoryId, tx);
        if (!category) throw invalidCategory();

        // Quest de guilda (3x) depende do fluxo de guildas, ainda não definido: por ora sempre individual.
        const isGuild = false;
        const quest = await repository.insertQuest(tx, {
          userId: authenticatedUserId,
          categoryId: category.id,
          title: value.title,
          description: value.description,
          deadline: value.deadline,
          xp: calculateQuestXp(category.baseXp, isGuild),
          status: QUEST_INITIAL_STATUS,
          isGuild,
        });
        return withCategory(quest, category);
      });
    } catch (error) {
      throw interpretPersistenceError(error);
    }
  }

  /** Categorias para o formulário (dados de referência, sem dado de usuário). */
  async function listQuestCategories() {
    return repository.listCategories();
  }

  return { createQuest, listQuestCategories };
}

const defaultService = createQuestService({
  repository: defaultRepository,
  withTransaction: defaultWithTransaction,
});

export const createQuest = defaultService.createQuest;
export const listQuestCategories = defaultService.listQuestCategories;
