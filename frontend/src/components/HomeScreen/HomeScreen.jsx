'use client';

import { useCallback, useEffect, useState } from 'react';
import ActivityFeed from '@/components/ActivityFeed/ActivityFeed';
import Button from '@/components/Button/Button';
import EmptyState from '@/components/EmptyState/EmptyState';
import FolderCard from '@/components/FolderCard/FolderCard';
import GuildSidebar from '@/components/GuildSidebar/GuildSidebar';
import PostComposer from '@/components/PostComposer/PostComposer';
import QuestList from '@/components/QuestList/QuestList';
import Skeleton from '@/components/Skeleton/Skeleton';
import XpProgress from '@/components/XpProgress/XpProgress';
import { AlertCircleIcon, RefreshIcon } from '@/components/icons';
import { useSession } from '@/components/session/SessionProvider';
import { listActivities, publishPost } from '@/services/feed';
import { listMyGuilds } from '@/services/guilds';
import { listQuests } from '@/services/quests';
import { getProgress } from '@/services/user';
import styles from './HomeScreen.module.css';

const replaceById = (list, updated) => list.map((item) => (item.id === updated.id ? updated : item));

function HomeSkeleton() {
  return (
    <div className={styles.grid} aria-hidden="true">
      <div className={`${styles.progress} ${styles.skeletonCard}`}>
        <Skeleton width={120} height={24} />
        <Skeleton height={8} />
      </div>
      <div className={styles.guilds}>
        <Skeleton width={140} height={22} />
        <div className={styles.skeletonGuilds}>
          {[0, 1, 2].map((key) => (
            <FolderCard key={key} className={styles.skeletonGuild}>
              <Skeleton width="70%" height={18} />
              <Skeleton width="50%" height={16} />
              <Skeleton width="40%" height={16} />
            </FolderCard>
          ))}
        </div>
      </div>
      <div className={`${styles.quests} ${styles.skeletonCard}`}>
        <Skeleton width={160} height={22} />
        {[0, 1, 2].map((key) => <Skeleton key={key} height={42} />)}
      </div>
      <div className={`${styles.composer} ${styles.skeletonCard}`}>
        <Skeleton height={44} />
      </div>
      <div className={`${styles.feed} ${styles.skeletonCard}`}>
        <Skeleton width={200} height={22} />
        <Skeleton height={120} />
      </div>
    </div>
  );
}

/**
 * Início (frames 4:2 desktop e 5:2 mobile).
 * Abaixo de 1200px: coluna única na ordem do mobile (progresso → guildas em
 * carrossel → quests → publicar → atividades). A partir de 1200px: progresso no
 * topo, feed à esquerda e "Suas guildas" na coluna lateral de 380px.
 */
export default function HomeScreen() {
  const { user } = useSession();
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [progress, quests, activities, guilds] = await Promise.all([
        getProgress(),
        listQuests(),
        listActivities(),
        listMyGuilds(),
      ]);
      setData({ progress, quests, activities, guilds });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePublish(text) {
    const author = { name: user?.name ?? 'Você', initials: user?.initials ?? '', tone: 'primary' };
    const post = await publishPost({ text, author });
    setData((current) => ({ ...current, activities: [post, ...current.activities] }));
  }

  const updateQuest = (quest) => setData((current) => ({ ...current, quests: replaceById(current.quests, quest) }));
  const updateActivity = (item) =>
    setData((current) => ({ ...current, activities: replaceById(current.activities, item) }));

  return (
    <>
      <h1 className="visually-hidden">Início</h1>

      {status === 'loading' && (
        <>
          <p className="visually-hidden" role="status">Carregando o Início...</p>
          <HomeSkeleton />
        </>
      )}

      {status === 'error' && (
        <EmptyState
          role="alert"
          icon={<AlertCircleIcon />}
          title="Não foi possível carregar o Início"
          description="Verifique sua conexão e tente novamente."
          actions={(
            <Button size="lg" icon={<RefreshIcon />} onClick={load}>Tentar novamente</Button>
          )}
        />
      )}

      {status === 'ready' && data && (
        <div className={styles.grid}>
          <div className={styles.progress}>
            <XpProgress progress={data.progress} />
          </div>
          <div className={styles.guilds}>
            <GuildSidebar guilds={data.guilds} />
          </div>
          <div className={styles.quests}>
            <QuestList quests={data.quests} onQuestChange={updateQuest} />
          </div>
          <div className={styles.composer}>
            <PostComposer user={user} onPublish={handlePublish} />
          </div>
          <div className={styles.feed}>
            <ActivityFeed items={data.activities} onItemChange={updateActivity} />
          </div>
        </div>
      )}
    </>
  );
}
