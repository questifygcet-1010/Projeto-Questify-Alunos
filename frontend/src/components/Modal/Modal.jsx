'use client';

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/components/icons';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { useFocusTrap } from '@/lib/useFocusTrap';
import styles from './Modal.module.css';

const DRAG_CLOSE_DISTANCE = 80;

/**
 * Diálogo modal acessível. Abaixo de 768px vira bottom sheet (frame 272:2):
 * colado na base, cantos superiores arredondados e alça para arrastar.
 *
 * - role="dialog", aria-modal e aria-labelledby (título)
 * - foco inicial em `initialFocusRef`, foco preso, Esc fecha, foco volta a quem abriu
 * - rolagem da página bloqueada; clique/toque no fundo fecha
 * - `closable=false` impede fechar (ex.: enquanto envia)
 */
export default function Modal({ open, onClose, title, titleId, initialFocusRef, closable = true, children }) {
  const panelRef = useRef(null);
  const dragRef = useRef(null);

  const requestClose = () => {
    if (closable) onClose();
  };

  useFocusTrap(panelRef, open, { initialFocusRef, onEscape: requestClose });
  useBodyScrollLock(open);

  if (!open) return null;

  // Arrastar a alça para baixo fecha o bottom sheet (só no mobile, onde a alça aparece).
  function handlePointerDown(event) {
    dragRef.current = { startY: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return;
    const offset = Math.max(0, event.clientY - dragRef.current.startY);
    panelRef.current.style.transform = `translateY(${offset}px)`;
  }

  function handlePointerUp(event) {
    if (!dragRef.current) return;
    const offset = event.clientY - dragRef.current.startY;
    dragRef.current = null;
    panelRef.current.style.transform = '';
    if (offset > DRAG_CLOSE_DISTANCE) requestClose();
  }

  return createPortal(
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={requestClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          className={styles.handleArea}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-hidden="true"
        >
          <span className={styles.handle} />
        </div>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={requestClose}
            disabled={!closable}
            aria-label="Fechar"
          >
            <CloseIcon strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
