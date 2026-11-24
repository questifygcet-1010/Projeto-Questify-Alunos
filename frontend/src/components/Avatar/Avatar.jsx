import styles from './Avatar.module.css';

const SIZES = { xs: styles.xs, sm: styles.sm, md: styles.md, lg: styles.lg, xl: styles.xl };
const TONES = {
  primary: styles.primary,
  'primary-dark': styles.primaryDark,
  success: styles.success,
  gold: styles.gold,
  white: styles.white,
};

/**
 * Avatar com iniciais. Tamanhos do Figma: xs 26, sm 28, md 36, lg 40, xl 44.
 * `label` torna o avatar legível por leitor de tela; sem ele, é decorativo.
 */
export default function Avatar({ initials, size = 'md', tone = 'primary', ring, label, className = '' }) {
  const classes = [styles.avatar, SIZES[size], TONES[tone], ring && styles[`ring-${ring}`], className]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      {initials}
    </span>
  );
}
