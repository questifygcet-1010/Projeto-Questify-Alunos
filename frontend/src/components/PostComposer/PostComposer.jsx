'use client';

import { useState } from 'react';
import Avatar from '@/components/Avatar/Avatar';
import Button from '@/components/Button/Button';
import { useMediaQuery } from '@/lib/useMediaQuery';
import styles from './PostComposer.module.css';

const MAX_LENGTH = 500;

/**
 * "Compor publicação" (4:60 desktop / 5:96 mobile). Publicar adiciona o post no
 * topo do feed (mock, só em memória). No mobile o frame não mostra o botão: ele
 * aparece quando há texto digitado.
 */
export default function PostComposer({ user, onPublish }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isDesktop = useMediaQuery('(min-width: 768px)', true);
  const trimmed = text.trim();

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!trimmed) {
      event.currentTarget.querySelector('input')?.focus();
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onPublish(trimmed);
      setText('');
    } catch {
      setError('Não foi possível publicar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} data-has-text={trimmed ? 'true' : undefined}>
      <Avatar initials={user?.initials ?? ''} size="lg" className={styles.avatar} />
      <label htmlFor="nova-publicacao" className="visually-hidden">Escreva uma publicação para a turma</label>
      <input
        id="nova-publicacao"
        className={styles.field}
        type="text"
        value={text}
        maxLength={MAX_LENGTH}
        autoComplete="off"
        placeholder={isDesktop ? 'Compartilhe seu progresso com a turma' : 'Compartilhe seu progresso'}
        onChange={(event) => setText(event.target.value)}
        disabled={submitting}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'nova-publicacao-erro' : undefined}
      />
      <Button type="submit" className={styles.publish} loading={submitting}>
        Publicar
      </Button>
      {error && (
        <p id="nova-publicacao-erro" className={styles.error} role="alert">{error}</p>
      )}
    </form>
  );
}
