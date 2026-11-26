const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createActivityHistoryService,
} = require(
  "../../../src/business/application/activity-history/activity-history.service"
);

const xpRepository = {
  async findByUserId(userId) {
    return [
      {
        id: 1,
        userId,
        description: "Atividade antiga",
        amount: 50,
        date: "2026-11-14T10:00:00",
      },
      {
        id: 2,
        userId,
        description: "Atividade recente",
        amount: 100,
        date: "2026-11-15T10:00:00",
      },
    ];
  },
};

const goldRepository = {
  async findByUserId(userId) {
    return [
      {
        id: 1,
        userId,
        description: "Crédito antigo",
        type: "CREDIT",
        amount: 50,
        date: "2026-11-14T10:00:00",
      },
      {
        id: 2,
        userId,
        description: "Crédito recente",
        type: "CREDIT",
        amount: 100,
        date: "2026-11-15T10:00:00",
      },
    ];
  },
};

const { getActivityHistory } = createActivityHistoryService({
  xpRepository,
  goldRepository,
});

test("deve retornar os históricos do jogador", async () => {
  const history = await getActivityHistory("user-1");

  assert.equal(history.xp.length, 2);
  assert.equal(history.gold.length, 2);
});

test("deve ordenar os registros do mais recente para o mais antigo", async () => {
  const history = await getActivityHistory("user-1");

  for (const records of [history.xp, history.gold]) {
    for (let i = 1; i < records.length; i++) {
      assert.ok(
        new Date(records[i - 1].date) >= new Date(records[i].date)
      );
    }
  }
});

test("deve rejeitar uma consulta sem identificador", async () => {
  await assert.rejects(
    getActivityHistory(null),
    /Identificador do usuário obrigatório/
  );
});