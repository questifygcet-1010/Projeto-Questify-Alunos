import styles from './FieldError.module.css';

/** Mensagem de erro sob um campo (12px, --color-error). Ligue ao campo via aria-describedby. */
export default function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className={styles.error}>
      {children}
    </p>
  );
}
