import styles from './EmptyState.module.css';

/**
 * Painel branco centralizado para estados vazio/erro/"em breve"
 * (padrão dos frames 272:326 e 272:578).
 * - role: "status" (vazio/informativo) ou "alert" (erro); o ícone fica vermelho em "alert"
 */
export default function EmptyState({ icon, title, description, actions, role = 'status', titleAs: Title = 'h2', className = '' }) {
  return (
    <section className={`${styles.panel} ${className}`} role={role}>
      {icon && (
        <span className={`${styles.icon} ${role === 'alert' ? styles.iconError : ''}`} aria-hidden="true">
          {icon}
        </span>
      )}
      <Title className={styles.title}>{title}</Title>
      {description && <p className={styles.description}>{description}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}
