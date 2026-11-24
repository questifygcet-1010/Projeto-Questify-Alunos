'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from '@/components/Avatar/Avatar';
import { ChevronDownIcon, LogoutIcon } from '@/components/icons';
import { formatLevelSummary, useSession } from '@/components/session/SessionProvider';
import { ACCOUNT_LINKS } from '@/lib/navigation';
import styles from './AccountMenu.module.css';

/**
 * Menu da conta (frame 5:248). Padrão "menu button": aria-haspopup/aria-expanded,
 * setas ↑/↓/Home/End entre os itens, Esc e clique fora fecham e devolvem o foco ao botão.
 */
export default function AccountMenu() {
  const { user, progress, logout } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  const menuId = useId();
  const buttonId = useId();

  const items = () => Array.from(popupRef.current?.querySelectorAll('[role="menuitem"]') ?? []);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Fecha ao navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    items()[0]?.focus();

    function handlePointerDown(event) {
      if (!popupRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) {
        close(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, close]);

  function handleButtonKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleMenuKeyDown(event) {
    const list = items();
    const index = list.indexOf(document.activeElement);
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        list[(index + 1) % list.length]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        list[(index - 1 + list.length) % list.length]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        list[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        list[list.length - 1]?.focus();
        break;
      case 'Tab':
        close(false);
        break;
      default:
    }
  }

  const name = user?.name ?? '';

  return (
    <div className={styles.wrapper}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleButtonKeyDown}
      >
        <Avatar initials={user?.initials ?? ''} size="md" />
        <span className={styles.name}>{name}</span>
        <span className="visually-hidden">— menu da conta</span>
        <ChevronDownIcon className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open && (
        <div ref={popupRef} className={styles.popup} onKeyDown={handleMenuKeyDown}>
          <div className={styles.userHeader}>
            <Avatar initials={user?.initials ?? ''} size="lg" />
            <div className={styles.userData}>
              <p className={styles.userName}>{name}</p>
              <p className={styles.userMeta}>{formatLevelSummary(progress)}</p>
            </div>
          </div>
          <div className={styles.separator} role="presentation" />
          <ul id={menuId} role="menu" aria-labelledby={buttonId} className={styles.menu}>
            {ACCOUNT_LINKS.map(({ href, label, Icon }) => (
              <li key={href} role="none">
                <Link href={href} role="menuitem" tabIndex={-1} className={styles.item} onClick={() => close(false)}>
                  <Icon />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
            <li role="separator" className={styles.separator} />
            <li role="none">
              <button type="button" role="menuitem" tabIndex={-1} className={`${styles.item} ${styles.danger}`} onClick={logout}>
                <LogoutIcon />
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
