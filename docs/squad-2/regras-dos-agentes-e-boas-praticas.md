# Regras dos agentes da Squad 2: quando parar e boas práticas de codificação

Regras que os agentes de IA da Squad 2 (tech-lead, frontend, backend, segurança, QA e documentação)
seguem ao trabalhar neste repositório. Cada agente lê este documento antes de começar.
Se uma regra daqui conflitar com o pedido do responsável pela Squad 2, vale o pedido do responsável.

---

## Parte 1: quando o agente deve parar

O objetivo é parar quando o **resultado previsto** for atingido e não entrar em ciclos de "corrige uma coisa,
quebra outra". O agente não persegue perfeição: entrega o que foi pedido, comprovado, e para.

### 1.1 Antes de começar: escrever o resultado previsto
Todo trabalho começa com uma lista curta e verificável do que precisa ser verdade no fim.
É o **critério de pronto** daquela tarefa. Exemplo para a história #108 Criar Quest:

- [ ] `POST /api/v1/quests` cria a quest com status `pendente`, dono da sessão e XP da categoria.
- [ ] Sem login → 401; dados inválidos → 400 com o campo; outros métodos → 405.
- [ ] A tela mostra os erros por campo e a mensagem de sucesso.
- [ ] `npm test` e `npm run test:jest` passam, e os testes que já passavam continuam passando.

Se o pedido não permite escrever essa lista (requisito ambíguo), o agente **para e pergunta** antes de codificar.

### 1.2 Pare com sucesso quando
1. Todos os itens do critério de pronto foram verificados com evidência real (saída de teste, status HTTP, tela).
2. As suítes inteiras (`npm test` e `npm run test:jest`) passam, não só os testes novos.
3. Nenhum arquivo fora do escopo foi alterado (`git status` / `git diff --stat` conferidos).

Atingido isso, **pare**. Não "aproveite para melhorar" outra coisa. Ideias extras viram **pendências** no relatório.

### 1.3 Pare e devolva ao tech-lead (ou ao responsável) quando
| Situação | O que fazer |
|---|---|
| A mesma falha continua depois de **2 tentativas** de correção | Pare. Relate o que tentou, a saída do erro e a hipótese. |
| A correção quebrou um teste que **antes passava** | Desfaça a sua última alteração (volte ao estado verde) e pare. Não corrija em cima da quebra. |
| O mesmo arquivo foi editado **3 vezes** pelo mesmo motivo | Pare: é sinal de que o entendimento está errado. |
| A correção exige mexer em arquivo de **outra squad**, no banco real, em dependências ou em configuração de produção | Pare e peça autorização. |
| Aparece uma **decisão de regra de negócio** não definida (ex.: XP da categoria, fluxo de guilda) | Pare e pergunte. Não invente regra. |
| O problema encontrado está **fora do escopo** do pedido | Não corrija. Registre como pendência e continue o seu escopo. |
| O ambiente não deixa verificar (servidor fora, sem banco, sem permissão) | Pare e diga exatamente o que não foi verificado. Nunca declare "funciona" sem ter visto. |

### 1.4 Limite de rodadas entre agentes (tech-lead)
- Ciclo desenvolvedor → QA → correção: **no máximo 2 rodadas**. Se na 2ª ainda houver falha, o tech-lead para
  e leva ao responsável com o relatório.
- Achados **BAIXO** e **INFORMATIVO** de segurança/auditoria não abrem nova rodada: vão para pendências.
  Só **CRÍTICO**, **ALTO** e falha funcional bloqueiam a entrega.
- Cada rodada corrige **somente** os itens apontados, sem reescrever o resto.

### 1.5 Regra de ouro
> Mudança pequena, verificada, e parada. Mais vale entregar com uma pendência clara do que
> esconder uma pendência dentro de três correções que ninguém pediu.

---

## Parte 2: boas práticas de codificação

### 2.1 Arquitetura (seguir o padrão já entregue pela Squad 3)
- Camadas: **Apresentação** (`src/presentation`, `api/`, `frontend/`) → **Negócio** (`src/business/application`
  e `src/business/domain`) → **Persistência** (`src/persistence`) → **Dados** (`database/`).
- Uma camada só chama a de baixo. Regra de negócio fica no domínio, nunca na rota nem na tela.
- Dependências entram por parâmetro (ex.: `createQuestService({ repository, withTransaction })`) para poder testar.
- Gravações que precisam andar juntas usam `withTransaction`.
- Não criar estrutura nova se já existe uma equivalente; não trocar tecnologia; não instalar dependência sem autorização.

### 2.2 Código limpo
- **Nomes que dizem o que é**: `calculateQuestXp`, `validateQuestInput`, não `calc`, `aux`, `data2`.
  Seguir o idioma do arquivo vizinho (backend em inglês, telas em português).
- **Funções pequenas** com uma responsabilidade. Se precisa de "e" para explicar, provavelmente são duas funções.
- **Sem números mágicos**: valores de regra viram constantes nomeadas (ex.: `GUILD_XP_MULTIPLIER = 3`).
- **Sem código morto**, sem `console.log` de depuração e sem código comentado esquecido.
- **Comentário explica o porquê**, não o quê. O código deve se explicar sozinho.
- **Mesmo estilo do código ao redor** (aspas, indentação, nomes). Não reformatar arquivos inteiros.
- **DRY com moderação**: não duplicar regra de negócio; mas não criar abstração para algo usado uma vez só.

### 2.3 Entrada, erros e segurança
- **Validar no servidor sempre.** A validação da tela é só conveniência.
- **Copiar só os campos permitidos** do corpo da requisição (nunca aceitar `xp`, `status`, `userId` do cliente).
- O id do usuário vem **da sessão**, nunca do corpo ou da URL.
- **SQL sempre parametrizado** (`$1`, `$2`), nunca concatenando texto.
- Erros com `code` (`src/shared/errors.js`) e status HTTP correto; erro 500 sem detalhes internos.
- **Nenhum segredo no código** (senhas, URLs de banco, chaves). Tudo em variáveis de ambiente.
- No React, nunca `dangerouslySetInnerHTML` com dados de usuário.

### 2.4 Testes
- Testes com **Jest** (definido pela turma), no padrão da main: arquivos `*.jest.mjs` em `tests/`, importando de
  `@jest/globals`; rodar com `npm run test:jest` (ESM nativo, `jest.config.mjs`). `npm test` roda os testes antigos em `node --test`.
- Toda regra nova vem com teste no mesmo trabalho. Use `describe`/`test.each` para agrupar casos e `jest.fn()` para dependências falsas.
- Testar o caminho feliz **e** os erros: vazio, limite exato, limite + 1, tipo errado, sem login.
- Teste não depende de banco real nem de internet: usar repositório em memória ou banco de teste local.
- Teste com nome que descreve o comportamento: `"categoria inexistente -> 400 em categoryId"`.
- Nunca apagar ou afrouxar um teste para ele passar. Se o teste estiver errado, explicar no relatório.

### 2.5 Banco de dados
- Toda mudança de estrutura é uma migration nova numerada (`database/migrations/NNN_*.sql`); nunca editar uma
  migration já aplicada.
- Migrations não apagam dados existentes. Tabelas novas com RLS ligado e `REVOKE` de `anon`/`authenticated`.
- Nunca escrever em tabelas de outra squad.

### 2.6 Git
- Trabalhar só na `feature/Squad-2`; a `main` só recebe Pull Request.
- Commits pequenos e com mensagem que explica o quê e por quê (`feat(squad2): ...`, `fix(squad2): ...`).
- Agentes **não** fazem commit, push, merge nem deploy: quem faz é o responsável.
