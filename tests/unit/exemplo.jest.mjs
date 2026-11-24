import { describe, test, expect } from '@jest/globals';

describe('Validação do Jest', () => {
  test('deve rodar o Jest com ESM no Questify', () => {
    expect(1 + 1).toBe(2);
  });
});
