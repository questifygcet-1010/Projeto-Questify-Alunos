'use client';

import { useState } from 'react';
import Button from '@/components/Button/Button';
import FolderCard from '@/components/FolderCard/FolderCard';
import Skeleton from '@/components/Skeleton/Skeleton';
import Tag from '@/components/Tag/Tag';
import { joinGuild } from '@/services/guilds';
import styles from './GuildCard.module.css';

function memberLabel(count) {
  return `${count} ${count === 1 ? 'membro' : 'membros'}`;
}

/**
 * Card de guilda em Explorar (58:653): nome, categoria, membros, administrador e
 * "Abrir guilda" (secundário, se membro) ou "Entrar na guilda" (primário).
 * Entrar é mock: ao concluir, o card passa a mostrar "Abrir guilda".
 */
export default function GuildCard({ guild, onJoined }) {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const titleId = `guilda-${guild.id}-nome`;

  async function handleJoin() {
    setJoining(true);
    setError('');
    try {
      await joinGuild(guild.id);
      onJoined({ ...guild, isMember: true, memberCount: guild.memberCount + 1 });
    } catch {
      setError('Não foi possível entrar na guilda. Tente novamente.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <FolderCard className={styles.card} role="group" aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.name}>{guild.name}</h2>
      <div className={styles.meta}>
        <Tag tone="info">{guild.category}</Tag>
        <span>{memberLabel(guild.memberCount)}</span>
      </div>
      <p className={styles.admin}>Administrador: {guild.admin}</p>
      {guild.isMember ? (
        <Button href={`/guilds/${encodeURIComponent(guild.id)}`} variant="secondary" block aria-label={`Abrir guilda ${guild.name}`}>
          Abrir guilda
        </Button>
      ) : (
        <Button block loading={joining} onClick={handleJoin} aria-label={`Entrar na guilda ${guild.name}`}>
          Entrar na guilda
        </Button>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </FolderCard>
  );
}

/** Card-esqueleto com a mesma grade e aba (frame 272:149). */
export function GuildCardSkeleton() {
  return (
    <FolderCard className={styles.card} aria-hidden="true">
      <Skeleton width="55%" height={20} />
      <div className={styles.meta}>
        <Skeleton width={56} height={22} />
        <Skeleton width={72} height={22} />
      </div>
      <Skeleton width="45%" height={14} />
      <Skeleton height={40} />
    </FolderCard>
  );
}
