// Squad 2 — configuração da tela de quests.

// Modo demonstração: a tela funciona sem login e NÃO grava a quest no banco
// (só mostra o resultado). Para ligar ao login e gravar de verdade, troque para false.
export const MODO_DEMONSTRACAO = true;

// Usadas só no modo demonstração quando a API de categorias não responde (ex.: prévia sem banco).
// Mesmos valores provisórios de database/migrations/002_quests.sql.
export const CATEGORIAS_EXEMPLO = [
  { id: 1, name: 'Resumo', difficulty: 'facil', baseXp: 30 },
  { id: 2, name: 'Curso ou palestra', difficulty: 'facil', baseXp: 30 },
  { id: 3, name: 'Estudo', difficulty: 'medio', baseXp: 60 },
  { id: 4, name: 'Lista de exercícios', difficulty: 'medio', baseXp: 60 },
  { id: 5, name: 'Apresentação', difficulty: 'medio', baseXp: 60 },
  { id: 6, name: 'Projeto em grupo', difficulty: 'dificil', baseXp: 100 },
  { id: 7, name: 'Prova', difficulty: 'dificil', baseXp: 100 },
];
