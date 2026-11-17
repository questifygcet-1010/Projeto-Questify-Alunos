# História 3 — Registrar e consultar movimentações de Gold

**Objetivo:** manter o registro persistente dos créditos e permitir que o estudante consulte suas movimentações.

**Arquivos que atendem esta história:**
- `00-COMPARTILHADO/src/business/application/rewards/wallet.service.js` — método `listMovements`.
- `00-COMPARTILHADO/src/presentation/http/wallet-route.js` — operação HTTP de consulta das movimentações.
- `00-COMPARTILHADO/src/persistence/repositories/rewards/gold-ledger.repository.js` — consulta ordenada do histórico e persistência dos créditos.
- `00-COMPARTILHADO/api/v1/wallet.js` — endpoint `/api/v1/wallet/movements`.
- `00-COMPARTILHADO/database/migrations/005_gold_ledger.sql` — tabela que mantém o histórico.

**Destino:** copie os arquivos compartilhados para os mesmos caminhos no repositório, conforme `../LEIA-ME-ANTES.md`.
