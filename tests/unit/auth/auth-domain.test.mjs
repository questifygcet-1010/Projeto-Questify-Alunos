import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../../server/business/domain/auth/password.js';
import { validateRegistration, validateLogin } from '../../../server/business/domain/auth/user-policy.js';

test('hash de senha nunca contém a senha e é verificável', async () => {
  const hash = await hashPassword('Questify@123');
  assert.match(hash, /^pbkdf2_sha256\$\d+\$[0-9a-f]+\$[0-9a-f]+$/);
  assert.ok(!hash.includes('Questify@123'));
  assert.equal(await verifyPassword('Questify@123', hash), true);
  assert.equal(await verifyPassword('outra', hash), false);
  assert.equal(await verifyPassword('x', 'lixo'), false);
});

test('cadastro normaliza e-mail para minúsculas e ignora papel enviado', () => {
  const result = validateRegistration({ nome: '  Ana ', email: ' ANA@Exemplo.COM ', senha: 'Senha@123', papel: 'administrador' });
  assert.deepEqual(result, { nome: 'Ana', email: 'ana@exemplo.com', senha: 'Senha@123' });
});

test('cadastro indica qual campo obrigatório falta', () => {
  for (const field of ['nome', 'email', 'senha']) {
    const payload = { nome: 'Ana', email: 'ana@exemplo.com', senha: 'Senha@123' };
    delete payload[field];
    assert.throws(() => validateRegistration(payload), (error) => error.status === 400 && error.field === field);
  }
});

test('cadastro valida limite de nome, e-mail e força da senha', () => {
  const base = { nome: 'Ana', email: 'ana@exemplo.com', senha: 'Senha@123' };
  assert.throws(() => validateRegistration({ ...base, nome: 'a'.repeat(121) }), (e) => e.field === 'nome');
  assert.doesNotThrow(() => validateRegistration({ ...base, nome: 'a'.repeat(120) }));
  assert.throws(() => validateRegistration({ ...base, email: 'invalido' }), (e) => e.field === 'email');
  assert.throws(() => validateRegistration({ ...base, senha: 'curta' }), (e) => e.field === 'senha');
  assert.throws(() => validateRegistration({ ...base, senha: 'semsimbolo123A' }), (e) => e.code === 'SENHA_FRACA');
});

test('login exige e-mail e senha', () => {
  assert.throws(() => validateLogin({ email: 'a@b.co' }), (e) => e.field === 'senha');
  assert.deepEqual(validateLogin({ email: ' A@B.co ', senha: 'x' }), { email: 'a@b.co', senha: 'x' });
});
