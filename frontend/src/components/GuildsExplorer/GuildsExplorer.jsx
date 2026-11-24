'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button/Button';
import CreateGuildModal from '@/components/CreateGuildModal/CreateGuildModal';
import EmptyState from '@/components/EmptyState/EmptyState';
import GuildCard, { GuildCardSkeleton } from '@/components/GuildCard/GuildCard';
import PageHeader from '@/components/PageHeader/PageHeader';
import SearchField from '@/components/SearchField/SearchField';
import { AlertCircleIcon, PlusIcon, RefreshIcon, SearchIcon } from '@/components/icons';
import { filterGuilds } from '@/lib/search';
import { listGuilds } from '@/services/guilds';
import styles from './GuildsExplorer.module.css';

const SKELETON_COUNT = 6;

/**
 * Guildas — Explorar (58:588 desktop / 58:727 mobile) com os estados
 * Carregando (272:149), Busca sem resultado (272:326) e Erro (272:458).
 * `/guilds?criar=1` abre o modal Criar guilda direto (link do Início).
 */
export default function GuildsExplorer() {
  const router = useRouter();
  const searchRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [guilds, setGuilds] = useState([]);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setGuilds(await listGuilds());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Lido no navegador (export estático): abre o modal e limpa o parâmetro da URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('criar') === '1') {
      setModalOpen(true);
      params.delete('criar');
      const rest = params.toString();
      router.replace(rest ? `/guilds?${rest}` : '/guilds', { scroll: false });
    }
  }, [router]);

  const visible = useMemo(() => filterGuilds(guilds, query), [guilds, query]);

  function clearSearch() {
    setQuery('');
    searchRef.current?.focus();
  }

  const updateGuild = (updated) =>
    setGuilds((current) => current.map((guild) => (guild.id === updated.id ? updated : guild)));

  const openModal = () => setModalOpen(true);

  return (
    <>
      <PageHeader
        title="Guildas"
        actions={(
          <Button size="lg" icon={<PlusIcon />} onClick={openModal} className={styles.createButton}>
            Criar guilda
          </Button>
        )}
      />

      <div className={styles.content}>
        <SearchField
          ref={searchRef}
          id="busca-guildas"
          label="Buscar guildas por nome ou assunto"
          placeholder="Buscar por nome ou assunto"
          value={query}
          onChange={setQuery}
          aria-controls="lista-guildas"
        />

        {status === 'loading' && (
          <div className={styles.loading}>
            <p className={styles.loadingText} role="status">Carregando guildas...</p>
            <ul className={styles.grid} role="list" aria-hidden="true">
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <li key={index} className={styles.cell}><GuildCardSkeleton /></li>
              ))}
            </ul>
          </div>
        )}

        {status === 'error' && (
          <EmptyState
            role="alert"
            icon={<AlertCircleIcon />}
            title="Não foi possível carregar as guildas"
            description="Verifique sua conexão e tente novamente."
            actions={<Button size="lg" icon={<RefreshIcon />} onClick={load}>Tentar novamente</Button>}
          />
        )}

        {status === 'ready' && visible.length === 0 && (
          <EmptyState
            icon={<SearchIcon />}
            title="Nenhuma guilda encontrada"
            description={
              query.trim()
                ? `Não encontramos guildas para "${query.trim()}". Tente outro termo ou limpe a busca.`
                : 'Ainda não há guildas para mostrar.'
            }
            actions={(
              <>
                {query.trim() && <Button variant="secondary" onClick={clearSearch}>Limpar busca</Button>}
                <Button onClick={openModal}>Criar guilda</Button>
              </>
            )}
          />
        )}

        {status === 'ready' && visible.length > 0 && (
          <ul id="lista-guildas" className={styles.grid} role="list" aria-label="Guildas">
            {visible.map((guild) => (
              <li key={guild.id} className={styles.cell}>
                <GuildCard guild={guild} onJoined={updateGuild} />
              </li>
            ))}
          </ul>
        )}

        {status === 'ready' && query.trim() && visible.length > 0 && (
          <p className="visually-hidden" role="status">
            {visible.length} {visible.length === 1 ? 'guilda encontrada' : 'guildas encontradas'}
          </p>
        )}
      </div>

      <CreateGuildModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
