# História 2 — Receber Gold por atividades concluídas

**Objetivo:** creditar Gold ao estudante quando uma atividade elegível for concluída, evitando creditar duas vezes o mesmo evento.

**Arquivos que atendem esta história:**
- `00-COMPARTILHADO/src/business/application/rewards/wallet.service.js` — método `creditForActivity`, validações e idempotência.
- `00-COMPARTILHADO/src/persistence/repositories/rewards/gold-ledger.repository.js` — gravação do crédito com proteção por `source_event_id`.
- `00-COMPARTILHADO/database/migrations/005_gold_ledger.sql` — tabela e restrição de unicidade do evento de origem.
- `00-COMPARTILHADO/tests/business/application/rewards/wallet.service.test.js` — testes da regra de crédito.

**Integração:** o evento recebido do serviço responsável pelas Quests deve fornecer o identificador do usuário, a quantidade de Gold e um identificador estável e único do evento de conclusão. O mapeamento do contrato entre squads deve ser confirmado antes da integração.

**Destino:** copie os arquivos compartilhados para os mesmos caminhos no repositório, conforme `../LEIA-ME-ANTES.md`.
