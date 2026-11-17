const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getActivityHistory,
} = require(
  "../../../src/business/application/activity-history/activity-history.service"
);

test("deve retornar os históricos do jogador", async () => {
  const history = await getActivityHistory("demo-user");

  assert.ok(history.xp.length > 0);
  assert.ok(history.gold.length > 0);
});

test("deve ordenar os registros do mais recente para o mais antigo", async () => {
  const history = await getActivityHistory("demo-user");

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