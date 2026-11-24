import styles from './PageHeader.module.css';

/** Título da página (único h1) com ações opcionais à direita. */
export default function PageHeader({ title, actions }) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
