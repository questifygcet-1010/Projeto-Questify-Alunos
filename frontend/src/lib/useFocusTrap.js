'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableIn(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (element) => element.getClientRects().length > 0,
  );
}

/**
 * Prende o foco dentro de `containerRef` enquanto `active` for verdadeiro:
 * foca `initialFocusRef` (ou o primeiro elemento focável) ao abrir, faz Tab/Shift+Tab
 * circular, chama `onEscape` com Esc e devolve o foco ao elemento que estava focado
 * antes de abrir (o botão que abriu o diálogo/menu).
 */
export function useFocusTrap(containerRef, active, { initialFocusRef, onEscape } = {}) {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;
    const initial = initialFocusRef?.current || focusableIn(container)[0] || container;
    initial.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusableIn(container);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef, initialFocusRef]);
}
