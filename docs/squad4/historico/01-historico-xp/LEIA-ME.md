# História 1 — Consultar histórico de XP

**Objetivo:** permitir que o estudante consulte seu próprio histórico de recebimento de XP, identificando a quantidade recebida, a atividade de origem e a data de cada registro.

**Arquivos que atendem esta história:**

- `src/persistence/repositories/activity-history/xp-history.repository.js` — fornece os registros de XP associados ao identificador do estudante. Atualmente utiliza dados simulados.
- `src/business/application/activity-history/activity-history.service.js` — método `getActivityHistory`, responsável por solicitar o histórico ao repositório e ordenar os registros do mais recente para o mais antigo.
- `tests/unit/activity-history/activity-history.service.test.js` — verifica o retorno dos históricos, a ordenação cronológica e a rejeição de consultas sem identificador de usuário.

**Regras consideradas:**

- Cada estudante deve consultar somente o próprio histórico.
- Os registros devem ser apresentados do mais recente para o mais antigo.
- Cada registro deve preservar a descrição da atividade, a quantidade de XP e a data correspondente.

**Limitação atual:** os registros são simulados e ainda não estão integrados a um banco de dados ou a uma rota HTTP protegida por autenticação. A identificação do estudante deverá vir da autenticação, e não de um identificador informado livremente pelo cliente.