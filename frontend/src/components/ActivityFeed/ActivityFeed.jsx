'use client';

import { useId, useRef, useState } from 'react';
import Avatar from '@/components/Avatar/Avatar';
import Button from '@/components/Button/Button';
import Tag from '@/components/Tag/Tag';
import { ChallengeIcon, ClockIcon, CommentIcon, HeartIcon } from '@/components/icons';
import { acceptChallenge, addComment, setLiked } from '@/services/feed';
import styles from './ActivityFeed.module.css';

const FILTERS = [
  { id: 'all', label: 'Tudo', matches: () => true },
  { id: 'challenge', label: 'Desafios', matches: (item) => item.type === 'challenge' },
  { id: 'post', label: 'Post', matches: (item) => item.type === 'post' },
];

function commentsLabel(count) {
  return `${count} ${count === 1 ? 'comentário' : 'comentários'}`;
}

function ItemHeader({ item, children }) {
  return (
    <div className={styles.itemHeader}>
      <Avatar initials={item.author.initials} tone={item.author.tone} size="md" />
      <div className={styles.author}>
        <p className={styles.authorName}>{item.author.name}</p>
        <p className={styles.authorAction}>{item.action} · {item.time}</p>
      </div>
      {children}
    </div>
  );
}

function ChallengeCard({ item, onChange }) {
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    setBusy(true);
    try {
      await acceptChallenge(item.id);
      onChange({ ...item, accepted: true });
    } catch {
      // Mock: falha simulada mantém o desafio como estava.
    } finally {
      setBusy(false);
    }
  }

  const challengeTag = (
    <Tag tone="gold" icon={<ChallengeIcon />} className={styles.challengeTag}>Desafio</Tag>
  );

  return (
    <article className={`${styles.item} ${styles.challenge}`} aria-labelledby={`${item.id}-titulo`}>
      <ItemHeader item={item}>
        <span className={styles.tagDesktop}>{challengeTag}</span>
      </ItemHeader>
      <span className={styles.tagMobile}>{challengeTag}</span>
      <h3 id={`${item.id}-titulo`} className={styles.challengeTitle}>{item.title}</h3>
      <p className={styles.description}>{item.description}</p>
      <div className={styles.meta}>
        <span className={styles.deadline}>
          <ClockIcon />
          {item.deadline}
        </span>
        <span>{item.difficulty}</span>
        {item.rewards.map((reward) => <Tag key={reward} tone="gold">{reward}</Tag>)}
      </div>
      <div className={styles.challengeActions}>
        {item.accepted ? (
          <Button size="lg" disabled className={styles.challengeButton}>Desafio aceito</Button>
        ) : (
          <Button size="lg" className={styles.challengeButton} onClick={handleAccept} loading={busy}>
            Aceito o desafio
          </Button>
        )}
        {/* Os detalhes do desafio ficam em Meu progresso (outro squad): leva ao stub. */}
        <Button size="lg" variant="secondary" href="/progresso" className={styles.challengeButton}>
          Ver detalhes
        </Button>
      </div>
      <p className="visually-hidden" role="status">{item.accepted ? 'Desafio aceito.' : ''}</p>
    </article>
  );
}

function PostCard({ item, onChange }) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const commentButtonRef = useRef(null);
  const formId = useId();

  async function toggleLike() {
    const liked = !item.liked;
    // Atualização otimista; reverte se o mock falhar.
    onChange({ ...item, liked, likes: item.likes + (liked ? 1 : -1) });
    try {
      await setLiked(item.id, liked);
    } catch {
      onChange(item);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    const text = comment.trim();
    if (!text) return;
    setSending(true);
    try {
      await addComment(item.id, text);
      onChange({ ...item, comments: item.comments + 1 });
      setComment('');
      setCommentOpen(false);
      setFeedback('Comentário enviado.');
      commentButtonRef.current?.focus();
    } catch {
      setFeedback('Não foi possível comentar. Tente novamente.');
    } finally {
      setSending(false);
    }
  }

  return (
    <article className={styles.item} aria-label={`${item.author.name} ${item.action}`}>
      <ItemHeader item={item} />
      <p className={styles.text}>{item.text}</p>
      {item.tags.length > 0 && (
        <div className={styles.tags}>
          {item.tags.map((tag) => <Tag key={tag.label} tone={tag.tone}>{tag.label}</Tag>)}
        </div>
      )}
      <div className={styles.interactions}>
        <button
          type="button"
          className={`${styles.interaction} ${item.liked ? styles.liked : ''}`}
          aria-pressed={item.liked}
          onClick={toggleLike}
        >
          <HeartIcon filled={item.liked} />
          <span className={styles.count}>{item.likes}</span>
          <span className="visually-hidden"> curtidas. Curtir publicação de {item.author.name}</span>
        </button>
        <button
          ref={commentButtonRef}
          type="button"
          className={styles.interaction}
          aria-expanded={commentOpen}
          aria-controls={formId}
          onClick={() => { setCommentOpen((open) => !open); setFeedback(''); }}
        >
          <CommentIcon />
          <span>{commentsLabel(item.comments)}</span>
          <span className="visually-hidden">. Comentar publicação de {item.author.name}</span>
        </button>
      </div>
      {commentOpen && (
        <form id={formId} className={styles.commentForm} onSubmit={submitComment}>
          <label htmlFor={`${formId}-campo`} className="visually-hidden">Escreva um comentário</label>
          <input
            id={`${formId}-campo`}
            className={styles.commentField}
            type="text"
            value={comment}
            maxLength={300}
            autoComplete="off"
            placeholder="Escreva um comentário"
            onChange={(event) => setComment(event.target.value)}
            disabled={sending}
            autoFocus /* foco no campo que a pessoa acabou de abrir */
          />
          <Button type="submit" loading={sending}>Enviar</Button>
        </form>
      )}
      <p className={styles.feedback} role="status">{feedback}</p>
    </article>
  );
}

/** "Atividades recentes" com filtros (Tudo / Desafios / Post) e os itens do feed. */
export default function ActivityFeed({ items, onItemChange }) {
  const [filter, setFilter] = useState('all');
  const active = FILTERS.find((option) => option.id === filter) ?? FILTERS[0];
  const visible = items.filter(active.matches);

  return (
    <section className={styles.feed} aria-labelledby="atividades-titulo">
      <div className={styles.header}>
        <h2 id="atividades-titulo" className={styles.title}>Atividades recentes</h2>
        <div className={styles.filters} role="group" aria-label="Filtrar atividades">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.filter} ${filter === option.id ? styles.filterActive : ''}`}
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty} role="status">Nenhuma atividade por aqui ainda.</p>
      ) : (
        <ul className={styles.list} role="list">
          {visible.map((item) => (
            <li key={item.id}>
              {item.type === 'challenge'
                ? <ChallengeCard item={item} onChange={onItemChange} />
                : <PostCard item={item} onChange={onItemChange} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
