// Dados simulados para o protótipo.

const goldRecords = [
  {
    id: 1,
    userId: "demo-user",
    description: "Recompensa por missão",
    type: "CREDIT",
    amount: 100,
    date: "2026-11-15T15:00:00",
  },
  {
    id: 2,
    userId: "demo-user",
    description: "Resgate de recompensa: Skin especial",
    type: "DEBIT",
    amount: -50,
    date: "2026-11-15T16:30:00",
  },
  {
    id: 3,
    userId: "demo-user",
    description: "Bônus de atividade",
    type: "CREDIT",
    amount: 30,
    date: "2026-11-13T12:00:00",
  },
];

async function findByUserId(userId) {
  return goldRecords.filter(record => record.userId === userId);
}

module.exports = {
  findByUserId,
};