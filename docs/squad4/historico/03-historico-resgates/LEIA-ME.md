# História 3 — Consultar histórico de resgate de recompensas

**Objetivo:** permitir que o estudante consulte seu próprio histórico de resgates de recompensas, identificando a recompensa adquirida, o valor de Gold utilizado e a data da operação.

**Arquivos que atendem esta história:**

- `src/persistence/repositories/activity-history/gold-history.repository.js` — contém registros simulados de débitos de Gold associados a resgates de recompensas.
- `src/business/application/activity-history/activity-history.service.js` — método `getActivityHistory`, responsável por disponibilizar o histórico de Gold e ordenar os registros cronologicamente.
- `tests/unit/activity-history/activity-history.service.test.js` — verifica o retorno e a ordenação dos registros do histórico.

**Regras consideradas:**

- Cada estudante deve consultar somente seus próprios resgates.
- Os resgates devem ser identificados como débitos de Gold.
- O histórico deve preservar a recompensa resgatada, o valor efetivamente pago e a data da operação.
- O valor histórico do resgate não deve ser alterado caso o preço atual da recompensa seja modificado.

**Limitação atual:** o código possui apenas um exemplo simulado de débito referente a resgate. Ainda não existe integração com o serviço de resgate ou persistência específica dos dados da recompensa adquirida. A implementação definitiva deverá recuperar essas informações do registro persistente da operação.