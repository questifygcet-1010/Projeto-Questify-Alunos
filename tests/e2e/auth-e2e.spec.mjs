import { test, expect } from '@playwright/test';

test.describe('Fluxos E2E de Autenticação (Questify)', () => {
  test('exibe formulário de login e redireciona para a Home ao autenticar com sucesso', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.endsWith('/api/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'fake-e2e-token',
            refreshToken: 'fake-e2e-refresh-token',
            user: { id: 1, name: 'Estudante Teste', email: 'aluno@questify.com' },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Estudante Teste', email: 'aluno@questify.com' }),
      });
    });

    await page.goto('/login');
    await expect(page.locator('#auth-title')).toHaveText('Questify');

    await page.fill('#email', 'aluno@questify.com');
    await page.fill('#password', 'SenhaForte@123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://127.0.0.1:3000/', { timeout: 10000 });
    const accessToken = await page.evaluate(() => window.localStorage.getItem('questify_access_token'));
    expect(accessToken).toBe('fake-e2e-token');
  });

  test('bloqueia cadastro quando a senha não cumpre os requisitos de segurança', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('#auth-title')).toHaveText('Criar Conta');

    await page.fill('#name', 'Estudante Teste');
    await page.fill('#email', 'novo@questify.com');
    await page.fill('#password', '12345678');
    await page.click('button[type="submit"]');

    await expect(page.getByText('A senha deve cumprir todos os requisitos de segurança indicados.')).toBeVisible();
  });

  test('cria conta com sucesso e redireciona para a tela de login', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 10,
          name: 'Estudante Novo',
          email: 'novo@questify.com',
        }),
      });
    });

    await page.goto('/register');
    await page.fill('#name', 'Estudante Novo');
    await page.fill('#email', 'novo@questify.com');
    await page.fill('#password', 'SenhaForte@123');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Conta criada com sucesso! Redirecionando...')).toBeVisible();
    await expect(page).toHaveURL('http://127.0.0.1:3000/login', { timeout: 5000 });
  });
});
