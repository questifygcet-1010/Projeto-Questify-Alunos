'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button/Button';
import Tag from '@/components/Tag/Tag';
import { ClockSmallIcon, PlusIcon } from '@/components/icons';
import { startQuest, submitQuestProof } from '@/services/quests';
import styles from './QuestList.module.css';

const STATUS = {
  in_progress: { label: 'Em andamento', tone: 'gold', action: 'Enviar comprovante' },
  pending: { label: 'Pendente', tone: 'info', action: 'Iniciar' },
  in_review: { label: 'Em análise', tone: 'sky', action: null },
};

function QuestRow({ quest, onChange }) {
  const [busy, setBusy] = useState(false);
  const status = STATUS[quest.status] ?? STATUS.pending;

  async function handleAction() {
    setBusy(true);
    try {
      const result = quest.status === 'pending' ? await startQuest(quest.id) : await submitQuestProof(quest.id);
      onChange({ ...quest, status: result.status });
    } catch {
      // Mock: em caso de falha simulada, a quest permanece como estava.
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={styles.row}>
      <div className={styles.data}>
        <h3 className={styles.questTitle}>{quest.title}</h3>
        <p className={styles.info}>
          <span>{quest.context}</span>
          <span className={styles.deadline}>
            <ClockSmallIcon />
            {quest.deadline}
          </span>
        </p>
      </div>
      <Tag tone={status.tone} className={styles.status}>{status.label}</Tag>
      {status.action && (
        <button
          type="button"
          className={styles.action}
          onClick={handleAction}
          disabled={busy}
          aria-label={`${status.action}: ${quest.title}`}
        >
          {status.action}
        </button>
      )}
    </li>
  );
}

/** "Minhas quests" (54:2 desktop / 54:54 mobile). */
export default function QuestList({ quests, onQuestChange }) {
  return (
    <section className={styles.card} aria-labelledby="minhas-quests-titulo">
      <div className={styles.header}>
        <h2 id="minhas-quests-titulo" className={styles.title}>Minhas quests</h2>
        <div className={styles.headerActions}>
          <Link href="/progresso" className={styles.seeAll}>
            Ver todas<span className="visually-hidden"> as quests</span>
          </Link>
          {/* TODO(api): criação de quest pertence a outro squad; leva ao stub de Meu progresso. */}
          <Button href="/progresso" icon={<PlusIcon />}>Nova quest</Button>
        </div>
      </div>
      {quests.length === 0 ? (
        <p className={styles.empty} role="status">Você não tem quests em andamento.</p>
      ) : (
        <ul className={styles.list} role="list">
          {quests.map((quest) => (
            <QuestRow key={quest.id} quest={quest} onChange={onQuestChange} />
          ))}
        </ul>
      )}
    </section>
  );
}
