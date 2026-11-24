import Link from 'next/link';
import styles from './FolderCard.module.css';

/**
 * Base do "card com aba". Com `href` vira um link (o card inteiro é clicável).
 * `highlight` = fundo primário e texto branco (primeiro card de "Suas guildas").
 */
export default function FolderCard({ href, highlight = false, className = '', children, ...rest }) {
  const classes = `${styles.folder} ${highlight ? styles.highlight : ''} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
