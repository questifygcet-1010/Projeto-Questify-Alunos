'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { SessionProvider } from '@/components/session/SessionProvider';
import { hasAccessToken } from '@/services/auth';
import styles from './layout.module.css';

/**
 * Layout das telas protegidas: verifica o token no navegador (nunca no servidor,
 * para não quebrar a hidratação) e redireciona para /login se ele não existir.
 */
export default function AppLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (hasAccessToken()) setAuthorized(true);
    else router.replace('/login');
  }, [router]);

  if (!authorized) {
    return <div className={styles.shell} aria-busy="true" />;
  }

  return (
    <SessionProvider>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
        <Navbar />
        <main id="conteudo" className={styles.main} tabIndex={-1}>
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
