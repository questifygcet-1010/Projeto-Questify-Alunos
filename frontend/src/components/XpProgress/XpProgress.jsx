import Tag from '@/components/Tag/Tag';
import styles from './XpProgress.module.css';

/**
 * Cartão "Progresso do estudante" (4:42 desktop / 5:22 mobile).
 * Desktop: nível | barra de XP | recompensas, numa linha.
 * Mobile: nível + Gold em cima e a barra embaixo; sem "quests concluídas".
 */
export default function XpProgress({ progress }) {
  const { level, xp, xpForNextLevel, gold, completedQuests } = progress;
  const percent = Math.min(100, Math.round((xp / xpForNextLevel) * 100));
  const missing = Math.max(0, xpForNextLevel - xp);

  return (
    <section className={styles.card} aria-labelledby="progresso-titulo">
      <div className={styles.level}>
        <h2 id="progresso-titulo" className={styles.levelTitle}>Nível {level}</h2>
        <p className={styles.levelHint}>Faltam {missing} XP para o nível {level + 1}</p>
      </div>

      <div className={styles.bar}>
        <div className={styles.labels}>
          <span className={styles.label} id="xp-rotulo">Experiência</span>
          <span className={styles.value}>{xp} / {xpForNextLevel} XP</span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-labelledby="xp-rotulo"
          aria-valuemin={0}
          aria-valuemax={xpForNextLevel}
          aria-valuenow={xp}
          aria-valuetext={`${xp} de ${xpForNextLevel} XP`}
        >
          {/* Largura dinâmica: único estilo inline permitido aqui. */}
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className={styles.rewards}>
        <Tag tone="gold">{gold} Gold</Tag>
        <Tag tone="sky" className={styles.completed}>{completedQuests} quests concluídas</Tag>
      </div>
    </section>
  );
}
