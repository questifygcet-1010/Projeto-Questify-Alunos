'use client';

// Página de detalhe existente (antigo src/guild-detail.jsx): mesmo conteúdo,
// agora sob a nova navbar e com os tokens do design system.
import { useEffect, useState } from 'react';
import Button from '@/components/Button/Button';
import styles from './GuildDetail.module.css';

const CREATED_GUILD_KEY = 'questify_created_guild';

export default function GuildDetail() {
  const [state, setState] = useState(null);

  useEffect(() => {
    // O id vem da URL real (/guilds/<id>), não do parâmetro gerado no export estático.
    const guildId = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() ?? '');
    let guild = null;
    try {
      guild = JSON.parse(window.sessionStorage.getItem(CREATED_GUILD_KEY) || 'null');
    } catch {
      guild = null;
    }
    setState({ guildId, guild });
  }, []);

  if (!state) return null;
  const { guildId, guild } = state;
  const category = guild?.categoryName ?? guild?.categoryId ?? guild?.category_id;

  return (
    <section className={styles.card} aria-labelledby="guild-detail-title">
      <p className={styles.eyebrow}>Guilda criada</p>
      <h1 id="guild-detail-title" className={styles.title}>{guild?.name || 'Sua guilda de estudos'}</h1>
      <p className={styles.subtitle}>
        A guilda foi criada com sucesso. Você é o Administrador deste grupo.
      </p>
      <dl className={styles.summary}>
        <div><dt>ID da guilda</dt><dd>{guildId}</dd></div>
        {category && <div><dt>Categoria</dt><dd>{category}</dd></div>}
        <div><dt>Seu papel</dt><dd>Administrador</dd></div>
      </dl>
      <Button href="/guilds?criar=1" block>Criar outra guilda</Button>
    </section>
  );
}
