# Squad 4 — Histórico de atividades

Este pacote contém a documentação do refinamento das três histórias relacionadas à consulta do histórico de atividades do estudante no Questify.

## Histórias contempladas

1. `01-HISTORICO-DE-XP` — Consultar histórico de XP.
2. `02-HISTORICO-DE-GOLD` — Consultar histórico de movimentações de Gold.
3. `03-HISTORICO-DE-RESGATES` — Consultar histórico de resgate de recompensas.

Cada pasta contém um arquivo `LEIA-ME.md` com o objetivo, os arquivos relacionados, as regras consideradas e as limitações da implementação de sua respectiva história.

## Arquivos relacionados no repositório

As três histórias utilizam componentes compartilhados:

- `src/business/application/activity-history/activity-history.service.js` — serviço responsável por consultar os históricos de XP e Gold e ordenar os registros do mais recente para o mais antigo.
- `src/persistence/repositories/activity-history/xp-history.repository.js` — fornece os registros de XP.
- `src/persistence/repositories/activity-history/gold-history.repository.js` — fornece as movimentações de Gold, incluindo débitos referentes a resgates.
- `tests/unit/activity-history/activity-history.service.test.js` — testes unitários do serviço de histórico.

## Como as histórias se relacionam

As consultas de XP e Gold são realizadas pelo mesmo serviço de aplicação, que utiliza repositórios separados para cada tipo de registro.

O histórico de resgates está relacionado ao histórico de Gold, pois cada resgate representa uma movimentação de débito. Entretanto, para apresentar informações completas sobre a recompensa adquirida e o valor efetivamente pago, será necessária a integração com os registros persistentes de resgate.

Por utilizarem componentes compartilhados, não é necessário duplicar o serviço de aplicação ou os arquivos de consulta para cada história.

## Limitações da implementação atual

A implementação existente utiliza dados simulados em memória, sendo adequada para validar inicialmente a organização do código, a consulta dos registros e a ordenação cronológica.

Ainda são necessárias as seguintes integrações:

- Persistência