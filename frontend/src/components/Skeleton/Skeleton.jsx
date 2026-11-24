import styles from './Skeleton.module.css';

/** Barra de carregamento (bloco sky, como nos cards-esqueleto do frame 272:149). */
export default function Skeleton({ width = '100%', height = 16, className = '' }) {
  // Dimensões dinâmicas por uso: estilo inline permitido.
  return <span className={`${styles.skeleton} ${className}`} style={{ width, height }} aria-hidden="true" />;
}
