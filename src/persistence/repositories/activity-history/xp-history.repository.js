// Dados simulados para o protótipo.
// Posteriormente, serão substituídos por consultas ao PostgreSQL.

const xpRecords = [
  {
    id: 1,
    userId: "demo-user",
    description: "Missão diária concluída",
    amount: 50,
    date: "2026-11-15T14:30:00",
  },
  {
    id: 2,
    userId: "demo-user",
    description: "Missão semanal concluída",
    amount: 120,
    date: "2026-11-14T18:20:00",
  },
  {
    id: 3,
    userId: "demo-user",
    description: "Desafio especial",
    amount: 80,
    date: "2026-11-12T10:00:00",
  },
];

async function findByUserId(userId) {
  return xpRecords.filter(record => record.userId === userId);
}

module.exports = {
  findByUserId,
};