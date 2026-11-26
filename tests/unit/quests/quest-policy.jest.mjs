// Squad 2 — regras de domínio da história #108 Criar Quest (Jest).
import { describe, test, expect, jest } from '@jest/globals';
import {
  QUEST_MESSAGES,
  isValidIsoDate,
  validateQuestInput,
} from '../../../src/business/domain/quests/quest-policy.js';
import { GUILD_XP_MULTIPLIER, calculateQuestXp } from '../../../src/business/domain/quests/xp-policy.js';
import { todayIn } from '../../../src/business/application/quests/quest.service.js';

const TODAY = '2026-11-12';
const valid = { categoryId: 3, title: 'Resumo do capítulo 6', description: 'Ler e resumir', deadline: '2026-11-20' };
const ZWSP = '​'; // espaço de largura zero (invisível)

describe('validateQuestInput', () => {
  test('entrada válida é normalizada e só leva os campos personalizáveis', () => {
    const { value, errors } = validateQuestInput(
      { ...valid, title: '  Resumo   do capítulo 6 ', xp: 9999, difficulty: 'facil', status: 'concluida', userId: 7 },
      TODAY,
    );
    expect(errors).toBeNull();
    expect(value).toEqual({ categoryId: 3, title: 'Resumo do capítulo 6', description: 'Ler e resumir', deadline: '2026-11-20' });
  });

  test('categoria, título e prazo ausentes -> erro em cada campo', () => {
    const { value, errors } = validateQuestInput({ description: 'só descrição' }, TODAY);
    expect(value).toBeNull();
    expect(errors).toEqual({
      categoryId: QUEST_MESSAGES.CATEGORY_REQUIRED,
      title: QUEST_MESSAGES.TITLE_REQUIRED,
      deadline: QUEST_MESSAGES.DEADLINE_REQUIRED,
    });
  });

  test.each([null, undefined, 'texto', [1, 2], 42])('payload que não é objeto (%p) -> todos os obrigatórios faltando', (payload) => {
    const { errors } = validateQuestInput(payload, TODAY);
    expect(Object.keys(errors).sort()).toEqual(['categoryId', 'deadline', 'title']);
  });

  describe('título', () => {
    test.each([
      ['2 caracteres', 'ab', QUEST_MESSAGES.TITLE_LENGTH],
      ['101 caracteres', 'a'.repeat(101), QUEST_MESSAGES.TITLE_LENGTH],
      ['só espaços', '     ', QUEST_MESSAGES.TITLE_REQUIRED],
      ['só caracteres invisíveis', ZWSP.repeat(4), QUEST_MESSAGES.TITLE_REQUIRED],
      ['2 letras cercadas de invisíveis', `${ZWSP} ab ${ZWSP}`, QUEST_MESSAGES.TITLE_LENGTH],
    ])('%s -> erro', (_caso, title, mensagem) => {
      expect(validateQuestInput({ ...valid, title }, TODAY).errors.title).toBe(mensagem);
    });

    test.each([
      ['3 caracteres', 'abc'],
      ['100 caracteres', 'a'.repeat(100)],
      ['acentos', 'Revisão de Física e Ação'],
      ['emoji conta como 1 caractere', '🚀'.repeat(100)],
    ])('%s -> aceito', (_caso, title) => {
      expect(validateQuestInput({ ...valid, title }, TODAY).errors).toBeNull();
    });
  });

  describe('descrição', () => {
    test('é opcional e vazia vira null', () => {
      expect(validateQuestInput({ ...valid, description: '   ' }, TODAY).value.description).toBeNull();
      expect(validateQuestInput({ ...valid, description: undefined }, TODAY).value.description).toBeNull();
    });

    test('1000 caracteres passa; 1001 é recusado', () => {
      expect(validateQuestInput({ ...valid, description: 'a'.repeat(1000) }, TODAY).errors).toBeNull();
      expect(validateQuestInput({ ...valid, description: 'a'.repeat(1001) }, TODAY).errors.description)
        .toBe(QUEST_MESSAGES.DESCRIPTION_LENGTH);
    });
  });

  describe('categoria', () => {
    test.each(['abc', -1, 0, 1.5, '3.5', true])('%p é inválida', (categoryId) => {
      expect(validateQuestInput({ ...valid, categoryId }, TODAY).errors.categoryId).toBe(QUEST_MESSAGES.CATEGORY_INVALID);
    });

    test('pode chegar como string numérica', () => {
      expect(validateQuestInput({ ...valid, categoryId: '3' }, TODAY).value.categoryId).toBe(3);
    });
  });

  describe('prazo', () => {
    test.each([
      ['formato brasileiro', '20/11/2026', QUEST_MESSAGES.DEADLINE_INVALID],
      ['data inexistente', '2026-02-30', QUEST_MESSAGES.DEADLINE_INVALID],
      ['texto', 'amanhã', QUEST_MESSAGES.DEADLINE_INVALID],
      ['ontem', '2026-11-11', QUEST_MESSAGES.DEADLINE_PAST],
    ])('%s -> erro', (_caso, deadline, mensagem) => {
      expect(validateQuestInput({ ...valid, deadline }, TODAY).errors.deadline).toBe(mensagem);
    });

    test('hoje é aceito', () => {
      expect(validateQuestInput({ ...valid, deadline: TODAY }, TODAY).errors).toBeNull();
    });
  });
});

describe('isValidIsoDate', () => {
  test.each([
    ['2028-02-29', true],
    ['2027-02-29', false],
    ['2026-13-01', false],
    [20261112, false],
    ['', false],
  ])('%p -> %p', (entrada, esperado) => {
    expect(isValidIsoDate(entrada)).toBe(esperado);
  });
});

describe('XP', () => {
  test('individual = XP da categoria; guilda = 3x', () => {
    expect(GUILD_XP_MULTIPLIER).toBe(3);
    expect(calculateQuestXp(60)).toBe(60);
    expect(calculateQuestXp(60, false)).toBe(60);
    expect(calculateQuestXp(60, true)).toBe(180);
  });

  test.each([0, -10, 1.5, '60', null])('XP base inválido (%p) é erro de programação', (base) => {
    expect(() => calculateQuestXp(base)).toThrow(TypeError);
  });
});

describe('todayIn (fuso do prazo)', () => {
  test('23h30 de Brasília ainda é o mesmo dia, mesmo já sendo o dia seguinte em UTC', () => {
    const agora = new Date('2026-11-13T02:30:00Z'); // 12/11 às 23h30 em São Paulo
    expect(todayIn('America/Sao_Paulo', agora)).toBe('2026-11-12');
    expect(todayIn('UTC', agora)).toBe('2026-11-13');
  });
});
