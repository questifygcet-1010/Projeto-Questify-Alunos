const xpRepository = require(
  "../../../persistence/repositories/activity-history/xp-history.repository"
);
const goldRepository = require(
  "../../../persistence/repositories/activity-history/gold-history.repository"
);

function createActivityHistoryService({
  xpRepository: xpRepo = xpRepository,
  goldRepository: goldRepo = goldRepository,
} = {}) {
  async function getActivityHistory(userId) {
    if (!userId) {
      throw new Error("Identificador do usuário obrigatório.");
    }

    const [xpHistory, goldHistory] = await Promise.all([
      xpRepo.findByUserId(userId),
      goldRepo.findByUserId(userId),
    ]);

    const sortByDate = (a, b) => new Date(b.date) - new Date(a.date);

    return {
      xp: [...xpHistory].sort(sortByDate),
      gold: [...goldHistory].sort(sortByDate),
    };
  }

  return { getActivityHistory };
}

const activityHistoryService = createActivityHistoryService();

module.exports = {
  createActivityHistoryService,
  getActivityHistory: activityHistoryService.getActivityHistory,
};