import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';
import { apiFetch } from './api.js';

const PAPEIS = { estudante: 'Estudante', monitor: 'Monitor', administrador: 'Administrador' };

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/users/me')
      .then((data) => setUser(data.user))
      .catch((requestError) => {
        if (requestError.status === 401) window.location.href = 'index.html';
        else setError(requestError.message);
      });
  }, []);

  async function handleLogout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = 'index.html';
    }
  }

  return (
    <main className="auth-container">
      <section className="auth-card" aria-labelledby="dashboard-title">
        <h2 id="dashboard-title">Questify</h2>
        {error && <div className="error-message" role="alert">{error}</div>}
        {!user && !error && <p className="subtitle">Carregando...</p>}
        {user && (
          <>
            <p className="subtitle">Olá, {user.nome}! Sua sessão está ativa.</p>
            <ul className="password-requirements" aria-label="Dados da conta">
              <li><strong>E-mail:</strong> {user.email}</li>
              <li><strong>Papel:</strong> {PAPEIS[user.papel] || user.papel}</li>
              <li><strong>Id:</strong> {user.id}</li>
            </ul>
            <button className="btn-primary" type="button" onClick={handleLogout}>Sair</button>
          </>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Dashboard /></React.StrictMode>);
