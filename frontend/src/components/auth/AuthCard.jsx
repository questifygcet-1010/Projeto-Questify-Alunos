'use client';

// Migrado de frontend/src/main.jsx (Vite) sem mudança visual nem de comportamento.
// Mudanças: rotas novas (/login, /register), login redireciona para "/" (Início)
// e as chamadas HTTP passaram para services/auth.js.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, register } from '@/services/auth';

export default function AuthCard({ registering }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requirements = [
    [password.length >= 8, 'Pelo menos 8 caracteres'],
    [/[a-z]/.test(password) && /[A-Z]/.test(password), 'Letra maiúscula e minúscula'],
    [/\d/.test(password), 'Pelo menos um número'],
    [/[@$!%*?&._-]/.test(password), 'Pelo menos um símbolo (!@#$...)'],
  ];

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (registering && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-]).{8,}$/.test(password)) {
      setError('A senha deve cumprir todos os requisitos de segurança indicados.');
      return;
    }

    setSubmitting(true);
    try {
      if (registering) {
        await register({ name, email, password });
        setSuccess('Conta criada com sucesso! Redirecionando...');
        window.setTimeout(() => { router.push('/login'); }, 2000);
      } else {
        await login({ email, password });
        router.push('/');
      }
    } catch (submitError) {
      setError(submitError.message || 'Erro ao conectar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-container">
      <section className="auth-card" aria-labelledby="auth-title">
        <h2 id="auth-title">{registering ? 'Criar Conta' : 'Questify'}</h2>
        <p className="subtitle">
          {registering ? 'Junte-se ao Questify e comece sua jornada' : 'Faça login para continuar sua jornada'}
        </p>
        <form onSubmit={handleSubmit}>
          {registering && (
            <div className="input-group">
              <label htmlFor="name">Nome completo</label>
              <input id="name" type="text" required maxLength="120" placeholder="Seu nome" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
          )}
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" required maxLength="254" placeholder="seu.email@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="input-group">
            <label htmlFor="password">{registering ? 'Senha forte' : 'Senha'}</label>
            <input id="password" type="password" required maxLength="256" placeholder={registering ? 'Digite sua senha' : '********'} value={password} onChange={(event) => setPassword(event.target.value)} />
            {registering && (
              <ul className="password-requirements" aria-label="Requisitos da senha">
                {requirements.map(([valid, label]) => <li key={label} className={valid ? 'valid' : ''}>{valid ? '✔️' : '❌'} {label}</li>)}
              </ul>
            )}
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
          {success && <div className="success-message" role="status">{success}</div>}
          <button className="btn-primary" type="submit" disabled={submitting}>{submitting ? 'Aguarde...' : registering ? 'Cadastrar' : 'Entrar'}</button>
        </form>
        <p className="footer-link">
          {registering ? 'Já tem uma conta? ' : 'Ainda não tem uma conta? '}
          <Link href={registering ? '/login' : '/register'}>{registering ? 'Faça login' : 'Cadastre-se'}</Link>
        </p>
      </section>
    </main>
  );
}
