// Fixtures da tela Início com os dados do Figma (frames 4:2 e 5:2).

export const quests = [
  {
    id: 'q-lista-3',
    title: 'Lista 3 de Cálculo I',
    context: 'Guilda Cálculo I · +120 XP',
    deadline: 'Prazo: sexta, 06 nov',
    status: 'in_progress',
  },
  {
    id: 'q-resumo-cap-6',
    title: 'Resumo do capítulo 6 de Estruturas de Dados',
    context: 'Individual',
    deadline: 'Prazo: quinta, 05 nov',
    status: 'pending',
  },
  {
    id: 'q-estudar-2h',
    title: 'Estudar 2 h de Estruturas de Dados',
    context: 'Individual',
    deadline: 'Prazo: hoje, 18:00',
    status: 'in_progress',
  },
];

/**
 * Itens do feed. `type`:
 * - "challenge": desafio proposto por uma guilda (filtro "Desafios")
 * - "post": publicação de estudante (filtro "Post")
 * - "achievement": conquista desbloqueada (só aparece em "Tudo")
 * Posts e conquistas mostram a linha de interações (curtir/comentar), conforme a
 * anotação 131:7 do Figma.
 */
export const activities = [
  {
    id: 'a-desafio-lista-3',
    type: 'challenge',
    author: { name: 'Guilda Cálculo I — Turma A', initials: 'CI', tone: 'primary-dark' },
    action: 'propôs um desafio',
    time: 'há 2 h',
    title: 'Entregar a Lista 3 de exercícios de Cálculo I',
    description: 'Resolva as 12 questões da lista e envie a resolução até sexta-feira para validar a conclusão da quest.',
    deadline: 'Prazo: sexta, 06 nov',
    difficulty: 'Dificuldade: Média',
    rewards: ['+120 XP', '+30 Gold'],
    accepted: false,
  },
  {
    id: 'a-post-marcos',
    type: 'post',
    author: { name: 'Marcos Ribeiro', initials: 'MR', tone: 'success' },
    action: 'concluiu uma quest',
    time: 'há 1 h',
    text: 'Terminei o resumo do capítulo 4 de Anatomia Veterinária. Quem quiser, deixo o material na guilda.',
    tags: [{ label: '+80 XP', tone: 'gold' }, { label: 'Nível 5 alcançado', tone: 'info' }],
    likes: 12,
    liked: true,
    comments: 3,
  },
  {
    id: 'a-conquista-luiza',
    type: 'achievement',
    author: { name: 'Luiza Ferreira', initials: 'LF', tone: 'primary-dark' },
    action: 'desbloqueou uma conquista',
    time: 'há 3 h',
    text: 'Sequência de 7 dias de estudo concluída. Próxima meta: 14 dias.',
    tags: [{ label: 'Conquista: Constância', tone: 'gold' }],
    likes: 8,
    liked: false,
    comments: 1,
  },
];
