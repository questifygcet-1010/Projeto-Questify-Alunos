# AGENTS.md — Questify (Contexto Completo do Squad 4: Marketplace, Carteira e Recompensas)

Este repositório implementa o **Questify**, uma plataforma gamificada de produtividade acadêmica.
**Você está atuando exclusivamente no escopo do Squad 4 (Economia Transacional: catálogo de recompensas, moeda virtual Gold, carteira `wallets`, extrato `gold_ledger`, estoque e resgates `redemptions`).**

---

## 1. Contexto de Gestão e Recorte do Projeto

- **Squads Ativos:** Apenas **Squad 1, Squad 2, Squad 3, Squad 4 e Squad 6** existem neste projeto.
- **Proibição de Escopo:** **NÃO** crie pastas, serviços, tabelas ou código para Squads 5, 7 ou 8 (sem notificações em tempo real, sem SPA/PWA externa separada, sem API Gateway ou infraestrutura de microsserviços).
- **Entrega Vertical:** O Squad 4 é responsável pelo fluxo vertical completo do seu domínio: UI Next.js (`page.jsx` e componentes), Route Handlers (`/api/v1`), Services, Repositories, Migrations SQL e Testes.

---

## 2. Stack e Restrições Tecnológicas (Obrigatório)

- **Linguagem:** JavaScript puro (`.js` e `.jsx`). **NÃO use TypeScript (`.ts`/`.tsx`).** Use JSDoc para tipagem e contratos quando necessário.
- **Framework & Runtime:** Next.js (App Router) rodando exclusivamente em runtime **Node.js** (`export const runtime = 'nodejs'` nas rotas que acessam o banco). **NÃO use Edge Runtime**.
- **Banco de Dados:** PostgreSQL acessado diretamente via driver nativo `pg` (connection pool e SQL parametrizado `$1, $2...`). **NÃO adicione ORMs** (Prisma, Drizzle, Sequelize, TypeORM) nem frameworks externos (Express, NestJS).
- **Estilo Arquitetural:** Monólito modular **exclusivamente em camadas**. Não crie microsserviços, filas, eventos distribuídos, Clean Architecture ou Hexagonal.
- **Framework de Testes:** Runner nativo do Node.js (`node:test` e `node:assert`).

---

## 3. Arquitetura em Camadas e Regra de Dependência

Direção estrita e unidirecional:
**Apresentação** $\rightarrow$ **Negócio** $\rightarrow$ **Persistência** $\rightarrow$ **Dados**

1. **Camada 1 — Apresentação (`src/app/**`, `src/presentation/**`)**
   - `page.jsx`: Server Components podem chamar Services diretamente; **nunca** faça `fetch('/api/...')` de dentro de um Server Component.
   - `route.js`: Route Handlers HTTP em `/api/v1/**` validam sessão, headers de idempotência (`Idempotency-Key`), origem/CSRF e formato do payload, delegando toda a execução aos Services.
   - **Proibido:** Conter SQL, importar repositories, calcular saldo/preço ou importar módulos de `business`/`persistence` dentro de Client Components (`"use client"`).
2. **Camada 2 — Negócio (`src/business/application/rewards/**`, `src/business/domain/economy/**`)**
   - `application/rewards/`: Casos de uso e orquestração (`wallet.service.js`, `redemption.service.js`).
   - `domain/economy/`: Regras puras, políticas e invariantes (`gold-policy.js`, `reward-policy.js`).
   - **Proibido:** Importar `next/*`, manipular objetos HTTP (`Request`/`Response`), acessar `page.jsx`/DOM ou executar SQL direto.
3. **Camada 3 — Persistência (`src/persistence/**`)**
   - `postgres/pool.js` e `postgres/transaction.js`: Infraestrutura compartilhada de conexão e controle transacional.
   - `repositories/rewards/*.repository.js`: Apenas queries SQL parametrizadas e mapeamento linha $\leftrightarrow$ objeto.
   - **Proibido:** Conter regras de negócio ou decisões de autorização.
4. **Camada 4 — Dados (`database/migrations/004_rewards.sql`)**
   - DDL PostgreSQL com `CHECK` constraints (`balance >= 0`, `stock >= 0`), chaves estrangeiras, índices de consulta e constraints `UNIQUE` de idempotência.

---

## 4. Mapa de Arquivos do Squad 4 (Ownership)

Respeite as fronteiras entre Squads. Altere apenas os arquivos pertencentes ao Squad 4 (e consuma os contratos compartilhados quando necessário):

```text
src/
├── app/
│   ├── (protected)/rewards/page.jsx              # Tela do Marketplace e Saldo (Server/Client)
│   └── api/v1/
│       ├── rewards/
│       │   ├── route.js                          # GET /api/v1/rewards (listar catálogo)
│       │   └── [id]/redeem/route.js              # POST /api/v1/rewards/:id/redeem (resgate)
│       └── wallet/route.js                       # GET /api/v1/wallet (saldo e extrato/ledger)
├── presentation/
│   └── components/rewards/                       # Componentes UI do Marketplace e Carteira
├── business/
│   ├── application/rewards/
│   │   ├── wallet.service.js                     # Consulta de saldo/extrato e creditGoldForQuest()
│   │   └── redemption.service.js                 # Caso de uso redeemReward()
│   └── domain/economy/
│       ├── gold-policy.js                        # Validações de valor e regras de crédito/débito
│       └── reward-policy.js                      # Validações de disponibilidade, estoque e elegibilidade
├── persistence/
│   └── repositories/rewards/
│       ├── wallets.repository.js                 # SQL de wallets e gold_ledger
│       ├── rewards.repository.js                 # SQL de catálogo de recompensas (rewards)
│       └── redemptions.repository.js             # SQL de histórico de resgates (redemptions)
database/
└── migrations/
    └── 004_rewards.sql                           # Tabelas: wallets, gold_ledger, rewards, redemptions
tests/
├── unit/rewards/                                 # Testes unitários de policies e services (mockando repositories)
└── integration/rewards/                          # Testes de transação, concorrência e idempotência no PG
```

---

## 5. Contratos de Integração Entre Squads

- **Com Squad 1 (Identidade e Acesso):**
  - Use obrigatoriamente `requireUser()` (de `src/presentation/security/require-user.js`) para obter o `userId` autenticado e validar sessão.
  - **Proibido:** Implementar leitura paralela de cookies, JWT ou tabelas de usuários.
- **Com Squad 2 (Quests e Gamificação):**
  - O Squad 4 é o **único** Squad autorizado a alterar `wallets` e `gold_ledger`.
  - Exponha a função `creditGoldForQuest(conclusionId, userId, amount, tx)` em `wallet.service.js` para o Squad 2 invocar dentro de `completeQuest()`.
- **Com Squad 6 (Leaderboard e Analytics):**
  - As tabelas do Squad 4 são **somente-leitura** para o Squad 6. Não altere nomes de colunas ou schemas sem manter compatibilidade com consultas analíticas.

---

## 6. Fluxos Críticos, Consistência e Concorrência

### A. Crédito de Gold por Quest: `creditGoldForQuest(conclusionId, userId, amount, tx)`
1. **Regra de Transação:** Recebe o client transacional `tx` vindo de `transactionManager.withTransaction(async (tx) => ...)`. **NUNCA** abra um `BEGIN`/`COMMIT` independente dentro de `creditGoldForQuest` quando `tx` for fornecido; use `tx.query(...)` em vez de `pool.query(...)`.
2. **Idempotência:** O `conclusionId` deve ser registrado com constraint `UNIQUE` no ledger (`gold_ledger`) para impedir crédito duplicado em caso de reenvio.
3. **Atualização Atômica:** Insere o lançamento de crédito em `gold_ledger` e incrementa o saldo em `wallets` na mesma transação.

### B. Resgate de Recompensa: `redeemReward({ userId, rewardId, idempotencyKey })`
1. Validar sessão do usuário (`requireUser()`) e chave de idempotência (`Idempotency-Key`).
2. Abrir transação única via `transactionManager.withTransaction(async (tx) => ...)`.
3. Bloquear a linha da recompensa (`SELECT ... FROM rewards WHERE id = $1 FOR UPDATE`) e da carteira (`SELECT ... FROM wallets WHERE user_id = $1 FOR UPDATE`) para evitar condição de corrida (*race condition*).
4. Validar regras de domínio (`reward-policy.js` e `gold-policy.js`): item ativo, `stock > 0`, `balance >= price`.
5. Na mesma transação:
   - Debitar `price` de `wallets`;
   - Inserir registro de saída em `gold_ledger`;
   - Decrementar `stock` em `rewards`;
   - Inserir registro em `redemptions` salvando o snapshot do preço pago (`price_paid`) e a `idempotency_key` (`UNIQUE`).
6. Qualquer falha executa `ROLLBACK` automático. **Saldo e estoque nunca podem ficar negativos.**

---

## 7. Segurança, Cache e Comandos do Projeto

- **Segurança:** Nunca exponha variáveis de ambiente sem prefixo público; use `process.env.DATABASE_URL` apenas no servidor. Verifique `Origin`/CSRF nas rotas `POST`.
- **Cache Next.js:** Rotas de carteira (`/api/v1/wallet`) e catálogo dinâmico devem refletir o estado confirmado do banco (desabilitar cache estático ou invalidar explicitamente após mutações).
- **Scripts Padrão (`package.json`):**
  - `npm run dev` — Inicia o servidor Next.js em desenvolvimento.
  - `npm run build` — Gera o build de produção.
  - `npm start` — Executa a aplicação em produção Node.js.
  - `npm run lint` — Valida estilo de código e fronteiras de importação.
  - `npm test` — Executa os testes com `node:test`.
  - `npm run db:migrate` — Executa as migrations SQL de `database/migrations/`.

---

## 8. Fluxo de Trabalho no OpenCode e Critério de Pronto (DoD)

1. **Planejamento (`Tab` $\rightarrow$ Modo Plan):** Antes de criar features novas, valide o schema SQL e os contratos de entrada/saída sem alterar arquivos.
2. **Implementação (`Tab` $\rightarrow$ Modo Build):** Construa de baixo para cima:
   `004_rewards.sql` $\rightarrow$ `repositories` $\rightarrow$ `domain/economy` $\rightarrow$ `application/rewards` $\rightarrow$ `route.js` $\rightarrow$ `UI`.
3. **Critério de Pronto (DoD):** Toda implementação de resgate ou movimentação de saldo deve conter:
   - Testes unitários das políticas em `tests/unit/rewards/`;
   - Testes de integração em `tests/integration/rewards/` simulando **resgates concorrentes simultâneos** para comprovar que estoque e saldo não ficam negativos e que a idempotência bloqueia duplicidades.

---

## 9. Fluxo Obrigatório de Git (Commit e Push)

- Antes de executar qualquer `git commit` ou `git push`, exiba no chat:
  1. A branch atual (deve ser `feature/Squad-4`);
  2. A lista exata de arquivos que entrarão no stage;
  3. A mensagem de commit proposta no padrão Conventional Commits (ex.: `feat(rewards): ...`).
- Nunca execute `git add .` sem listar os arquivos antes.
- Nunca faça `git push` para `main` ou `develop`, apenas para a branch do Squad 4.