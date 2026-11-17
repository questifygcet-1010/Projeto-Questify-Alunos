const xpRepository = require(
  "../../../persistence/repositories/activity-history/xp-history.repository"
);

const goldRepository = require(
  "../../../persistence/repositories/activity-history/gold-history.repository"
);

async function getActivityHistory(userId) {
  if (!userId) {
    throw new Error("Identificador do usuário obrigatório.");
  }

  const [xpHistory, goldHistory] = await Promise.all([
    xpRepository.findByUserId(userId),
    goldRepository.findByUserId(userId),
  ]);

  // Ordena os registros do mais recente para o mais antigo.
  const sortByDate = (a, b) =>
    new Date(b.date) - new Date(a.date);

  return {
    xp: xpHistory.sort(sortByDate),
    gold: goldHistory.sort(sortByDate),
  };
}

module.exports = {
  getActivityHistory,
};