import Link from 'next/link';
import styles from './Button.module.css';

/**
 * Botão do design system.
 * - variant: "primary" (fundo azul) | "secondary" (contorno azul)
 * - size: "md" (14px, 40px de altura) | "lg" (15px, 46px — botões de estado vazio/erro e mobile)
 * - block: ocupa a largura toda
 * - loading: mostra spinner e desabilita (estado "Criando..." do Figma)
 * - href: renderiza um link com a mesma aparência
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  icon = null,
  href,
  className = '',
  children,
  type = 'button',
  disabled,
  ...rest
}) {
  const classes = [styles.button, styles[variant], size === 'lg' && styles.lg, block && styles.block, className]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon}
      <span className={styles.label}>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
