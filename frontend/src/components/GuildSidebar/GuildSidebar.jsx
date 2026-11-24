import Link from 'next/link';
import Avatar from '@/components/Avatar/Avatar';
import Button from '@/components/Button/Button';
import FolderCard from '@/components/FolderCard/FolderCard';
import Tag from '@/components/Tag/Tag';
import { ChatIcon } from '@/components/icons';
import styles from './GuildSidebar.module.css';

function memberLabel(count) {
  return `${count} ${count === 1 ? 'membro' : 'membros'}`;
}

function unreadLabel(count) {
  return `${count} ${count === 1 ? 'nova' : 'novas'}`;
}

function MyGuildCard({ guild, highlight }) {
  const ring = highlight ? 'primary' : 'white';
  return (
    <FolderCard
      href={`/guilds/${encodeURIComponent(guild.id)}`}
      highlight={highlight}
      className={`${styles.card} ${highlight ? styles.cardHighlight : ''}`}
    >
      <h3 className={styles.name}>{guild.name}</h3>
      <div className={styles.members}>
        <span className={styles.avatars} aria-hidden="true">
          {guild.members.map((member) => (
            <Avatar
              key={member.initials}
              initials={member.initials}
              tone={member.tone === 'white' && !highlight ? 'primary' : member.tone}
              ring={ring}
              size="sm"
              className={styles.avatar}
            />
          ))}
        </span>
        <span>{memberLabel(guild.memberCount)}</span>
      </div>
      <div className={styles.chat}>
        <span className={styles.chatLabel}>
          <ChatIcon />
          Chat e fórum
        </span>
        {guild.unread > 0 && (
          <Tag tone="gold-solid">
            {unreadLabel(guild.unread)}
            <span className="visually-hidden"> mensagens</span>
          </Tag>
        )}
      </div>
    </FolderCard>
  );
}

/**
 * "Suas guildas". Desktop (≥1200px): coluna lateral com lista vertical e os botões
 * "Explorar guildas" e "Criar guilda". Abaixo disso: carrossel horizontal com snap,
 * com o próximo card "espiando" na borda; no mobile os botões não aparecem (frame 5:2).
 * O primeiro card (atividade mais recente) aparece destacado.
 */
export default function GuildSidebar({ guilds }) {
  return (
    <section className={styles.section} aria-labelledby="suas-guildas-titulo">
      <div className={styles.header}>
        <h2 id="suas-guildas-titulo" className={styles.title}>Suas guildas</h2>
        <Link href="/guilds" className={styles.seeAll}>
          Ver todas<span className="visually-hidden"> as guildas</span>
        </Link>
      </div>

      {guilds.length === 0 ? (
        <div className={styles.empty} role="status">
          <p>Você ainda não participa de nenhuma guilda.</p>
          <Button href="/guilds" variant="primary">Explorar guildas</Button>
        </div>
      ) : (
        <ul className={styles.list} role="list">
          {guilds.map((guild, index) => (
            <li key={guild.id} className={styles.item}>
              <MyGuildCard guild={guild} highlight={index === 0} />
            </li>
          ))}
        </ul>
      )}

      {guilds.length > 0 && (
        <div className={styles.actions}>
          <Button href="/guilds" variant="secondary" className={styles.action}>Explorar guildas</Button>
          <Button href="/guilds?criar=1" variant="secondary" className={styles.action}>Criar guilda</Button>
        </div>
      )}
    </section>
  );
}
