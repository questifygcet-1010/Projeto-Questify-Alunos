'use client';

import { useEffect } from 'react';

/** Bloqueia a rolagem da página enquanto um modal, bottom sheet ou menu cobre o conteúdo. */
export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previous;
    };
  }, [active]);
}
