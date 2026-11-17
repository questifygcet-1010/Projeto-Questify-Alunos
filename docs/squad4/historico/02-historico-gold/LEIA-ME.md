# História 2 — Consultar histórico de movimentações de Gold

**Objetivo:** permitir que o estudante consulte seu próprio histórico de movimentações de Gold, identificando os créditos e débitos realizados, seus valores, descrições e datas.

**Arquivos que atendem esta história:**

- `src/persistence/repositories/activity-history/gold-history.repository.js` — fornece os registros de movimentação de Gold associados ao identificador do estudante. Atualmente utiliza dados simulados.
- `src/business/application/activity-history/activity-history.service.js` — método `getActivityHistory`, responsável por solicitar os registros ao repositório e ordenar as movimentações do mais recente para o mais antigo.
- `tests/unit/activity-history/activity-history.service.test.js` — verifica o retorno do histórico, a ordenação cronológica e a rejeição de consultas sem identificador de usuário.

**Regras consideradas:**

- Cada estudante deve consultar somente suas próprias movimentações.
- Os registros devem ser apresentados do mais recente para o mais antigo.
- Créditos e débitos devem ser identificados separadamente.
- Cada movimentação deve preservar sua descrição, seu valor e sua data.

**Limitação atual:** os registros são simulados. A implementação ainda precisa ser integrada ao ledger persistente de Gold, que deverá fornecer as movimentações reais do estudante.