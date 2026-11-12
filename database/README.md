# Base de usuários — Sprint 1 (Squad 1)

Camada 4 (Dados) do Questify: PostgreSQL, migrations versionadas e seeds.

## 3 Formas de Rodar Localmente

### Opção A — Automática com 1 clique / 1 comando (Com ou Sem Docker)
Se você estiver em uma máquina sem Docker (ex.: laboratório da faculdade) ou sem Node.js instalado, basta executar na raiz:
```powershell
.\iniciar.bat
```
*(Ou `npm run start:auto` se já tiver Node.js).*
* Se o **Docker Desktop** estiver aberto, ele sobe o container oficial `postgres:16-alpine`.
* Se o Docker **não estiver instalado ou estiver fechado**, ele baixa e inicia automaticamente um PostgreSQL portátil local em `.local-pg/` na porta `55432`.
* Se a máquina **não tiver Node.js**, o `iniciar.bat` baixa o Node 22 portátil em `.tools/node/`.
* Em seguida, cria o `.env`, aplica as migrations, carrega os seeds, compila o frontend e abre o servidor em http://127.0.0.1:8000.

### Opção B — Tudo dentro do Docker (Sem precisar de Node.js na máquina)
Com o Docker Desktop aberto, suba banco + aplicação + migrations + seeds em um único comando:
```powershell
docker compose up --build
```
O container `app` aguarda o `postgres` ficar saudável, roda `db:migrate`, roda `db:seed` e disponibiliza o sistema em http://127.0.0.1:8000.

### Opção C — Passo a passo tradicional (Desenvolvimento)
1. `copy .env.example .env`
2. Suba o banco: `docker compose up -d postgres`
3. Aplique as migrations: `npm run db:migrate`
4. Em desenvolvimento/staging, carregue os usuários de teste: `npm run db:seed`
5. Gere o frontend e inicie: `npm run build && npm start` → http://127.0.0.1:8000  
   (para desenvolvimento com hot reload: `npm run dev:api` em um terminal e `npm run dev` em outro).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run start:auto` | Inicia tudo automaticamente (usa Docker se ativo ou Postgres portátil se sem Docker, aplica migrations/seeds e sobe o servidor). |
| `npm run db:migrate` | Aplica migrations pendentes em ordem e registra em `schema_migrations`. Recusa se uma migration já aplicada foi alterada. |
| `npm run db:rollback` | Desfaz a última migration (`npm run db:rollback -- 2` desfaz as duas últimas). |
| `npm run db:status` | Lista migrations e se foram aplicadas. |
| `npm run db:seed` | Cria aluno, monitor e admin de teste. Idempotente; **recusa** fora de `development`/`staging`. |
| `npm test` | Testes unitários (sem banco). |
| `npm run test:db` | Testes de esquema, migrations, seeds e fluxo HTTP de autenticação (precisa de PostgreSQL; usa um schema temporário isolado). |

Cada migration é um par `NNN_nome.up.sql` / `NNN_nome.down.sql`. **Nunca edite uma migration já aplicada**; crie a próxima.

## Seeds

`aluno.teste@questify.local`, `monitor.teste@questify.local` e `admin.teste@questify.local`, senha de desenvolvimento `Questify@123` (guardada apenas como hash). Os `id`s são fixos (`00000000-0000-4000-8000-00000000000{1,2,3}`) para facilitar testes de outros squads. O ambiente é lido de `APP_ENV` (prioridade) ou `NODE_ENV`.

## Vercel

1. Crie um PostgreSQL gerenciado (Vercel Postgres/Neon, Supabase, etc.) e defina nas Environment Variables do projeto: `DATABASE_URL` (e `DATABASE_SSL=require` se o provedor exigir TLS e a URL não tiver `sslmode`).
2. Rode as migrations uma vez contra esse banco, da sua máquina: `DATABASE_URL=<url> npm run db:migrate` (em PowerShell: `$env:DATABASE_URL='<url>'; npm run db:migrate`).
3. Faça o deploy. O frontend é servido de `frontend/dist` e a API de `api/v1/**` (funções Node.js). Para dados de teste em Preview, defina `APP_ENV=staging` e rode `db:seed`; **nunca** em Production.

## API (contrato v1, Squad 1)

| Método e rota | Descrição |
|---|---|
| `POST /api/v1/auth/register` `{ nome, email, senha }` | Cria usuário `estudante` ativo. 409 `EMAIL_DUPLICADO`, 400 com `field` do campo inválido/ausente. |
| `POST /api/v1/auth/login` `{ email, senha }` | Cria sessão em cookie `HttpOnly` (`questify_session`, 7 dias). 401 genérico, 403 `CONTA_DESATIVADA`, 429 após 10 falhas/15 min. |
| `POST /api/v1/auth/logout` | Encerra a sessão. |
| `GET /api/v1/users/me` | Usuário autenticado (`id` UUID, `nome`, `email`, `papel`, `ativo`). |
| `GET /api/v1/health` | Verifica a conexão com o banco. |

Para outros squads protegerem rotas: `requireUser(req)` e `requireRole(user, 'administrador')` em `server/presentation/security/session.js`.

## Organização em camadas

```
api/v1/**                              Vercel: apenas apontam para server/presentation/routes.js
backend/server.js                      servidor local (mesma tabela de rotas + frontend/dist)
server/presentation/                   Camada 1: http, handlers, security (sessão, CSRF, rate limit)
server/business/{application,domain}/  Camada 2: auth.service, user-policy, password
server/persistence/                    Camada 3: pool/transação `pg` e repositories
database/{migrations,scripts}/         Camada 4: SQL, runner de migrations e seeds
```
