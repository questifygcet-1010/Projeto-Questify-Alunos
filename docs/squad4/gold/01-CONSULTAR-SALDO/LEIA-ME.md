# História 1 — Consultar saldo de Gold

**Objetivo:** permitir que o estudante autenticado consulte o saldo atual da própria carteira.

**Arquivos que atendem esta história:**
- `00-COMPARTILHADO/src/business/application/rewards/wallet.service.js` — método `getBalance`.
- `00-COMPARTILHADO/src/presentation/http/wallet-route.js` — operação HTTP de consulta do saldo.
- `00-COMPARTILHADO/src/persistence/repositories/rewards/gold-ledger.repository.js` — soma créditos e débitos persistidos.
- `00-COMPARTILHADO/api/v1/wallet.js` — endpoint `/api/v1/wallet`.
- `00-COMPARTILHADO/database/migrations/005_gold_ledger.sql` — estrutura persistente usada pelo saldo.

**Destino:** copie os arquivos compartilhados para os mesmos caminhos no repositório, conforme `../LEIA-ME-ANTES.md`.
