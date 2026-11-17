# Squad 4 — Minhas três histórias de Gold

Este pacote contém **somente os arquivos da implementação das três histórias de Gold**. Não contém cópia do repositório inteiro e não substitui arquivos dos colegas.

## Como usar

1. Abra o repositório atual do Questify.
2. Entre na pasta `00-COMPARTILHADO` deste pacote.
3. Copie cada arquivo mantendo exatamente o caminho indicado dentro do repositório. Exemplo: `src/business/application/rewards/wallet.service.js` deve ir para o mesmo caminho no repositório.
4. Faça isso uma única vez para os arquivos compartilhados.
5. As pastas das três histórias servem para identificar o escopo e a ordem de integração. Elas apontam quais partes do núcleo compartilhado atendem cada história.
6. Não substitua a pasta `src`, `api` ou `database` inteira: copie apenas os arquivos listados.

## Por que existe uma pasta compartilhada?

As três histórias usam a mesma carteira e o mesmo livro de movimentações (ledger). Por isso, rota, serviço, repositório, endpoint e migração são componentes comuns. Duplicá-los em três pastas causaria arquivos repetidos e risco de versões diferentes. Copie esses arquivos uma vez e considere as três histórias atendidas pela mesma implementação central.

## Arquivos compartilhados e destinos no repositório

- `src/business/application/rewards/wallet.service.js`
- `src/presentation/http/wallet-route.js`
- `src/persistence/repositories/rewards/gold-ledger.repository.js`
- `api/v1/wallet.js`
- `database/migrations/005_gold_ledger.sql`
- `tests/business/application/rewards/wallet.service.test.js`

A migração SQL deve ser aplicada ao banco antes de testar as operações. Não execute novamente se já tiver sido aplicada.

## Limite deste pacote

O pacote não inclui catálogo de recompensas, cadastro de recompensas, resgates, estoque ou interface do Marketplace, pois pertencem ao trabalho dos outros integrantes.
