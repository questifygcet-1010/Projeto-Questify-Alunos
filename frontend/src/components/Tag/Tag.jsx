import styles from './Tag.module.css';

/**
 * Etiqueta/chip (raio 4, 12px semibold, padding 4/10).
 * tone: "gold" (recompensas, Em andamento) | "gold-solid" (novas mensagens)
 *     | "sky" (texto ink: quests concluídas) | "info" (texto primário: Pendente, categorias)
 */
export default function Tag({ tone = 'gold', icon = null, className = '', children }) {
  return (
    <span className={`${styles.tag} ${styles[tone] ?? ''} ${className}`}>
      {icon}
      {children}
    </span>
  );
}
