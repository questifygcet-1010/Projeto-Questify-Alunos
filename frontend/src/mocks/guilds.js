// Fixtures de guildas com os dados do Figma.

/** Guildas de Explorar (frames 58:588 e 58:727). `isMember` define o botão do card. */
export const exploreGuilds = [
  { id: '1', name: 'Cálculo I — Turma A', category: 'Exatas', memberCount: 12, admin: 'Ana Silva', isMember: true },
  { id: '2', name: 'Anatomia Veterinária', category: 'Saúde', memberCount: 8, admin: 'Rodrigo Tavares', isMember: true },
  { id: '4', name: 'Educação Física em Foco', category: 'Saúde', memberCount: 15, admin: 'Tatiana Souza', isMember: true },
  { id: '5', name: 'Programação em Java', category: 'Tecnologia', memberCount: 10, admin: 'Henrique Alves', isMember: false },
  { id: '6', name: 'Estatística Aplicada', category: 'Exatas', memberCount: 9, admin: 'Débora Nunes', isMember: false },
  { id: '7', name: 'Leitura e Escrita Acadêmica', category: 'Humanas', memberCount: 7, admin: 'Paulo Ramos', isMember: false },
];

/** "Suas guildas" no Início (frames 4:2 e 5:2). `lastActivityAt` define o destaque. */
export const myGuilds = [
  {
    id: '1',
    name: 'Cálculo I — Turma A',
    memberCount: 12,
    members: [
      { initials: 'AS', tone: 'white' },
      { initials: 'MR', tone: 'success' },
      { initials: 'LF', tone: 'gold' },
    ],
    unread: 3,
    lastActivityAt: '2026-11-05T14:00:00-03:00',
  },
  {
    id: '2',
    name: 'Anatomia Veterinária',
    memberCount: 8,
    members: [
      { initials: 'JP', tone: 'primary-dark' },
      { initials: 'CM', tone: 'success' },
      { initials: 'RT', tone: 'gold' },
    ],
    unread: 0,
    lastActivityAt: '2026-11-04T09:30:00-03:00',
  },
  {
    id: '3',
    name: 'Estudos de Educação Física',
    memberCount: 15,
    members: [
      { initials: 'TS', tone: 'primary' },
      { initials: 'BN', tone: 'success' },
      { initials: 'VA', tone: 'primary-dark' },
    ],
    unread: 1,
    lastActivityAt: '2026-11-03T18:15:00-03:00',
  },
];
