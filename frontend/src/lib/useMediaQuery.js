'use client';

import { useSyncExternalStore } from 'react';

/**
 * Verdadeiro quando a media query casa. No servidor (e na 1ª renderização da
 * hidratação) devolve `serverValue`, para não divergir do HTML gerado.
 */
export function useMediaQuery(query, serverValue = false) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
