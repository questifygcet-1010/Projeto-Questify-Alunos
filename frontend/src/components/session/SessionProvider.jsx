'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/services/auth';
import { getCurrentUser, getProgress } from '@/services/user';

const SessionContext = createContext(null);

/** Dados da pessoa logada usados pela navbar e pelos menus (mock por enquanto). */
export function SessionProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getCurrentUser(), getProgress()])
      .then(([currentUser, currentProgress]) => {
        if (!active) return;
        setUser(currentUser);
        setProgress(currentProgress);
      })
      .catch(() => {
        // A navbar continua utilizável sem os dados (mostra um avatar neutro).
      });
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.replace('/login');
  }, [router]);

  const value = useMemo(() => ({ user, progress, logout }), [user, progress, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession deve ser usado dentro de <SessionProvider>.');
  return context;
}

/** "Nível 7 · 640 XP" */
export function formatLevelSummary(progress) {
  return progress ? `Nível ${progress.level} · ${progress.xp} XP` : '';
}
