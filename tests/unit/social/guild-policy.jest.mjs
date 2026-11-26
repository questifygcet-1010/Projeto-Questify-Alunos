import { describe, test, expect } from '@jest/globals';
import {
  GUILD_NAME_MIN_LENGTH,
  GUILD_NAME_MAX_LENGTH,
  GUILD_CREATOR_ROLE,
  GUILD_MESSAGES,
  normalizeGuildName,
  validateGuildName,
  parsePositiveId,
  validateGuildInput,
} from '../../../src/business/domain/social/guild-policy.js';

describe('Domínio de Guildas (guild-policy)', () => {
  test('criador da guilda deve receber papel de admin', () => {
    expect(GUILD_CREATOR_ROLE).toBe('admin');
  });

  test('normalizeGuildName remove espaços extras nas bordas e colapsa espaços internos', () => {
    expect(normalizeGuildName('  Física   Básica  ')).toBe('Física Básica');
    expect(normalizeGuildName(123)).toBe('');
  });

  test('validateGuildName valida limites mínimo (3) e máximo (30) de caracteres', () => {
    expect(validateGuildName('AB')).toBe(GUILD_MESSAGES.NAME_LENGTH);
    expect(validateGuildName('A'.repeat(GUILD_NAME_MIN_LENGTH))).toBeNull();
    expect(validateGuildName('A'.repeat(GUILD_NAME_MAX_LENGTH))).toBeNull();
    expect(validateGuildName('A'.repeat(GUILD_NAME_MAX_LENGTH + 1))).toBe(GUILD_MESSAGES.NAME_LENGTH);
  });

  test('parsePositiveId aceita apenas inteiros positivos válidos', () => {
    expect(parsePositiveId(5)).toBe(5);
    expect(parsePositiveId(' 42 ')).toBe(42);
    expect(parsePositiveId(0)).toBeNull();
    expect(parsePositiveId(-10)).toBeNull();
    expect(parsePositiveId('abc')).toBeNull();
  });

  test('validateGuildInput normaliza dados válidos e retorna erros estruturados quando inválidos', () => {
    const valid = validateGuildInput({ name: '  Clube   de   Algoritmos ', categoryId: '3' });
    expect(valid).toEqual({
      value: { name: 'Clube de Algoritmos', categoryId: 3 },
      errors: null,
    });

    const invalid = validateGuildInput({ name: 'Oi', categoryId: 0 });
    expect(invalid.value).toBeNull();
    expect(invalid.errors).toEqual({
      name: GUILD_MESSAGES.NAME_LENGTH,
      categoryId: GUILD_MESSAGES.CATEGORY_REQUIRED,
    });
  });
});
