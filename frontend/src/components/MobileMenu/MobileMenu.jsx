'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from '@/components/Avatar/Avatar';
import { CloseIcon, LogoMark, LogoutIcon } from '@/components/icons';
import { formatLevelSummary, useSession } from '@/components/session/SessionProvider';
import { MOBILE_LINKS, isActivePath } from '@/lib/navigation';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { useFocusTrap } from '@/lib/useFocusTrap';
import styles from './MobileMenu.module.css';

const DESKTOP_QUERY = '(min-width: 960px)';

/**
 * Menu mobile aberto (frame 5:182): cobre a página com o fundo sky, barra com logo
 * e botão fechar, cabeçalho do usuário e a lista de navegação.
 * Fecha com o X, com Esc, ao navegar e ao passar para a largura desktop.
 * O foco fica preso no painel e volta ao botão de menu ao fechar.
 */
export default function MobileMenu({ open, onClose }) {
  const { user, progress, logout } = useSession();
  const pathname = usePathname();
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  useFocusTrap(panelRef, open, { initialFocusRef: closeButtonRef, onEscape: onClose });
  useBodyScrollLock(open);

  // Fecha ao navegar (inclusive ao clicar no link da página atual).
  const lastPathname = useRef(pathname);
  useEffect(() => {
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Fecha se a janela crescer até a navbar desktop.
  useEffect(() => {
    if (!open) return undefined;
    const media = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event) => {
      if (event.matches) onClose();
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      id="menu-mobile"
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div className={styles.bar}>
        <Link href="/" className={styles.logo} aria-label="Questify — Início" onClick={onClose}>
          <LogoMark className={styles.logoMark} />
          <span className={styles.logoText} aria-hidden="true">Questify</span>
        </Link>
        <button ref={closeButtonRef} type="button" className={styles.closeButton} aria-label="Fechar menu" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className={styles.panel}>
        <div className={styles.userHeader}>
          <Avatar initials={user?.initials ?? ''} size="xl" />
          <div className={styles.userData}>
            <p className={styles.userName}>{user?.name ?? ''}</p>
            <p className={styles.userMeta}>{formatLevelSummary(progress)}</p>
          </div>
        </div>
        <div className={styles.divider} role="presentation" />

        <nav aria-label="Menu principal">
          <ul className={styles.list} role="list">
            {MOBILE_LINKS.map(({ href, label, Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`${styles.item} ${active ? styles.itemActive : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.divider} role="presentation" />
        <button type="button" className={`${styles.item} ${styles.danger}`} onClick={logout}>
          <LogoutIcon />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
