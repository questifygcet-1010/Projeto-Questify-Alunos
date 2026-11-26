import { describe, test, expect } from '@jest/globals';
import rankingPolicy from '../../../src/business/domain/analytics/ranking-policy.js';

const { validateRankingFilter, DEFAULT_LIMIT, MAX_LIMIT } = rankingPolicy;

describe('Domínio de Ranking (ranking-policy)', () => {
  test('aplica limite padrão (20) quando limite não é informado', () => {
    const result = validateRankingFilter({ escopo: 'individual', periodo: 'semanal' });
    expect(result).toEqual({
      escopo: 'individual',
      periodo: 'semanal',
      limite: DEFAULT_LIMIT,
    });
  });

  test('rejeita escopo, período ou limite fora do intervalo permitido', () => {
    expect(() => validateRankingFilter({ escopo: 'global', periodo: 'diario' }))
      .toThrow('Escopo de ranking inválido.');
    expect(() => validateRankingFilter({ escopo: 'guilda', periodo: 'anual' }))
      .toThrow('Período de ranking inválido.');
    expect(() => validateRankingFilter({ escopo: 'turma', periodo: 'mensal', limite: MAX_LIMIT + 1 }))
      .toThrow(TypeError);
  });
});
