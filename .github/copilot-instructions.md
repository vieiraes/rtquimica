# Instruções para agentes de IA (RTQuímico)

> Fonte única e self-contained de regras para qualquer agente de IA atuando neste repositório
> (GitHub Copilot, Claude Code, Gemini CLI). `CLAUDE.md` e `GEMINI.md`, na raiz, são apenas
> ponteiros para este arquivo — mantenha as regras aqui, não duplique nos outros dois.

## 1. Contexto do projeto

- **RTQuímico**: SaaS B2B/B2C multi-tenant para gestão de Responsabilidades Técnicas (RTs) de profissionais da Química.
- **Frontend**: React 19 + TypeScript, Vite, CSS vanilla (`src/styles.css`, dark/light via `data-theme`). **Sem Tailwind** nem outros frameworks de estilo — nova estilização vai em `src/styles.css`.
- **Estado/roteamento**: gerido por estado (`page`) interno em `src/App.tsx`.
- **Tipagens**: centralizadas em `src/types.ts`; mapeadores DB↔UI em `src/lib/mappers.ts` (`mapRt`, `mapAlert`, `mapAction`, categorias). Retornos do Supabase (em inglês) devem ser mapeados para as interfaces consumidas pelos componentes visuais.
- **Backend**: Supabase (Auth + Postgres com RLS + Storage).
  - ⚠️ **Decisão de 12/07/2026** (`docs/BOARD_CODE_REVIEW.md`, item RTQ-4): o modo **local** (Supabase CLI) foi **abandonado** como ambiente de validação/operação; o ambiente de referência passa a ser o **Supabase remoto (Cloud)**.
  - ⚠️ **Mas o projeto remoto ainda não existe** (nem foi criado no Supabase Cloud, nem linkado via `supabase link`) — só a decisão de migrar foi tomada, a execução (criar projeto, link, primeiro `db push`) ainda está pendente. **Não assuma que `supabase db push --linked` vai funcionar de primeira**: confirme com o usuário se o projeto já foi criado/linkado antes de tentar aplicar qualquer migration.
  - `.vscode/mcp.json` ainda aponta só para `127.0.0.1:54321` (local) — resquício da fase anterior; não assumir que o MCP local reflete o estado do Cloud.
- Para arquitetura, RBAC e histórico de decisões, `docs/CONHECIMENTO.md` é a fonte viva e mais atual — mais confiável que este resumo em caso de divergência.

## 2. Padrões de modelagem de banco de dados

- **Inglês obrigatório**: tabelas, colunas, enums, triggers sempre em inglês (ex.: `technical_responsibilities`, `tenant_admin`, `alerts`). Não usar português no schema.
- **Tenant isolation**: toda entidade transacional nova precisa de `tenant_id` referenciando `public.tenants(id)`.
- **RLS custom**: toda tabela nova precisa de policies considerando `tenant_id` e a função utilitária `public.current_user_role() = 'superadmin'`.
- Papéis (`app_role`): `superadmin`, `tenant_admin`, `tenant_member`, `tenant_external_client` — detalhes em `docs/CONHECIMENTO.md`.

---

## Regra obrigatória: análise socrática antes de agir

Para **toda demanda** solicitada (feature, correção, refactor, análise, decisão de arquitetura), faça **primeiro uma análise socrática** antes de implementar ou responder em definitivo.

### O que a análise socrática deve fazer:

1. **Fazer perguntas-chave** que expõem premissas, ambiguidades e trade-offs da demanda.
2. **Apostar na causa raiz**: quando necessário, utilizar a técnica dos "5 porquês" para ir ao fundo de um problema, sempre estimulando a solução e não a busca por culpados.
3. **Questionar evidências e consequências**: perguntar "De onde veio essa informação?" e "O que aconteceria se levássemos essa ideia ao extremo?" para testar a solidez das premissas e antecipar impactos.
4. **Responder a essas perguntas com base no código/contexto real** — ler os arquivos antes de afirmar.
5. **Explicitar dependências, riscos e o que muda de forma difícil de reverter** (URLs, schema, migrations, contratos, APIs públicas, etc.).
6. **Só então propor o plano/execução**.

### Quando confirmar com o owner antes de codar:

Se a demanda tiver:
- **Ambiguidade relevante** (não fica claro qual a solução ideal)
- **Impacto difícil de reverter** (schema, migrations, contratos, URLs públicas)
- **Decisão arquitetural** que afeta a evolução futura do projeto

Nestes casos, apresentar a análise e **confirmar com o owner antes de codar**.

Para mudanças **locais, isoladas e reversíveis**, a análise pode ser curta e seguir direto para a implementação.

### Formato recomendado da análise:

```
1. Perguntas socráticas
   - [Pergunta 1]
   - [Pergunta 2]
   - [...]

2. Respostas/Achados
   - [Resposta 1 — com base no código]
   - [Resposta 2 — com base no código]
   - [...]

3. Trade-offs e Riscos
   - [Trade-off 1]
   - [Risco 1]
   - [...]

4. Plano recomendado
   - Passo 1
   - Passo 2
   - [...]
```

---

## Workflow e Conventions

### Git
- **NUNCA commitar ou fazer push automaticamente.**
- Só commitar/push quando o usuário pedir explicitamente (ex: "commita", "envia pro github", "faz o push").
- Após edições de arquivos, apenas confirmar o que foi feito — não encadear git add/commit/push por conta própria.

### Migrations / Banco (Supabase)

- Fonte da verdade: SQL versionado em `supabase/migrations/` (**Supabase CLI puro** — este projeto não usa Prisma; não há `schema.prisma`).
- Ambiente de referência é o **Supabase remoto (Cloud)** (ver decisão 12/07/2026 na seção 1) — **mas o projeto remoto ainda não foi criado nem linkado**. Antes de rodar qualquer comando de push, **confirmar com o usuário** se o projeto Supabase Cloud já existe e está linkado (`supabase link`); criar um projeto novo é ação do usuário (conta/billing), não algo para o agente assumir ou disparar sozinho.
- Uma vez existindo e linkado, o fluxo normal é aplicar no remoto na mesma sessão em que a migration for criada/alterada:
  ```bash
  supabase db push --linked --include-all
  supabase migration list --linked   # o remoto deve bater com o local
  ```
- Se o projeto vier a adotar Prisma no futuro, tratá-lo como **camada de introspecção apenas** (`prisma db pull` após aplicar a migration) — **nunca** `prisma migrate`; o Supabase CLI continua dono do schema.
- Validar sempre que a migration foi aplicada corretamente no ambiente remoto antes de seguir.

### Deploy
- Deploy no Firebase é sempre executado pelo usuário.
- Quando um passo exigir deploy, solicitar explicitamente para o usuário executar.

### Documentação de planejamento
- Documentos de planejamento de features futuras devem ser criados **dentro do projeto** (ex: `docs/`), NUNCA em memória de sessão.
- Se estiver em modo somente-plano (sem permissão para criar/editar arquivos), avisar o usuário para sair desse modo (Copilot: mudar para modo Agent; Claude Code: aprovar o plano) antes de continuar.

### Board de acompanhamento (BOARD)
- Todo documento de análise/relatório que gere itens acionáveis (ex: `CODE_REVIEW.md`) deve ter um **board de acompanhamento** associado em `docs/`.
- **Nomenclatura:** `BOARD_[arquivo de referência].md` (ex: `CODE_REVIEW.md` → `BOARD_CODE_REVIEW.md`).
- **Formato:** lista única de cards (checklist), sem colunas nem seção de progresso.
  - Apenas dois status: `⬜ Pendente` e `✅ Concluído`.
  - Ao concluir, marcar `[x]` e o tick `✅`; **cards concluídos permanecem no arquivo** (não apagar).
  - Cada card: ID sequencial (ex: `RTQ-1`), título curto e referência ao(s) arquivo(s) afetado(s).
- **Sempre** manter no topo o carimbo **"Última atualização: DD/MM/AAAA HH:MM"** e atualizá-lo a cada mudança no board.

### Curadoria de documentação (`docs/`)
- **Manter a documentação de `docs/` sempre atualizada após cada atuação** (feature, fix, refactor, decisão): sincronizar checkboxes/status e boards com o estado real do código.
- **Nunca marcar item como concluído sem evidência no código** — ler os arquivos/rodar verificações antes de afirmar; anexar nota curta de evidência.
- Itens que ficaram obsoletos/N/A: sinalizar com `~~texto~~` + motivo, **não apagar**.
- Existe o agente especialista **`docs-curator`** (`.github/agents/docs-curator.agent.md`, formato Copilot) para curadorias/sincronizações amplas da pasta `docs/` — **invocar apenas quando o usuário pedir explicitamente**, nunca proativamente após cada tarefa/feature. Não há ainda um equivalente em `.claude/agents/`; enquanto isso, sessões de Claude Code fazem a curadoria pontual diretamente (baixa do próprio card/checklist da mudança em andamento), sem delegar.
- **Escopo do `docs-curator` (inegociável):** o agente edita **exclusivamente** arquivos dentro de `docs/`. **Nunca** altera código nem arquivos fora de `docs/`. Pode sugerir melhorias e, se útil, escrever um arquivo de sugestões em `docs/` (ex.: `docs/SUGESTOES_CODIGO.md`); qualquer mudança de código é sempre do agente principal/owner.
