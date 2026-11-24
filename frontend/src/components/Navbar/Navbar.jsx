'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AccountMenu from '@/components/AccountMenu/AccountMenu';
import MobileMenu from '@/components/MobileMenu/MobileMenu';
import { BellWithDotIcon, LogoMark, MenuIcon } from '@/components/icons';
import { PRIMARY_LINKS, isActivePath } from '@/lib/navigation';
import styles from './Navbar.module.css';

export function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="Questify — Início">
      <LogoMark className={styles.logoMark} />
      <span className={styles.logoText} aria-hidden="true">Questify</span>
    </Link>
  );
}

export function NotificationsLink() {
  // TODO(api): indicador de não lidas virá de GET /api/v1/notifications/unread-count
  return (
    <Link href="/notificacoes" className={styles.iconButton} aria-label="Notificações (há notificações não lidas)">
      <BellWithDotIcon />
    </Link>
  );
}

/**
 * Navbar de largura total. Os links e o Menu da conta aparecem a partir de 960px
 * (largura mínima em que tudo cabe numa linha, medida no navegador);
 * abaixo disso, a barra mobile com sino + botão de menu.
 */
export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo />
          <nav aria-label="Principal" className={styles.desktopOnly}>
            <ul className={styles.links} role="list">
              {PRIMARY_LINKS.map(({ href, label }) => {
                const active = isActivePath(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`${styles.link} ${active ? styles.linkActive : ''}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className={styles.actions}>
          <NotificationsLink />
          <span className={`${styles.divider} ${styles.desktopOnly}`} aria-hidden="true" />
          <div className={styles.desktopOnly}>
            <AccountMenu />
          </div>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.mobileOnly}`}
            aria-label="Abrir menu"
            aria-haspopup="dialog"
            aria-expanded={mobileOpen}
            aria-controls="menu-mobile"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={closeMobileMenu} />
    </header>
  );
}
