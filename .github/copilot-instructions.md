

## Regra obrigatória: análise socrática antes de agir

Para **toda demanda** solicitada (feature, correção, refactor, análise, decisão de arquitetura), faça **primeiro uma análise socrática** antes de implementar ou responder em definitivo.

### O que a análise socrática deve fazer:

1. **Fazer perguntas-chave** que expõem premissas, ambiguidades e trade-offs da demanda.
2. **Apostar na causa raiz**: quando necessário, utilizar a técnica dos "5 porquês" para ir ao fundo de um problema, sempre estimulando a solução e não a busca por culpados.
3. **Questionar evidências e consequências**: perguntar "De onde veio essa informação?" e "O que aconteceria se levássemos essa ideia ao extremo?" para testar a solidez das premissas e antecipar impactos.
4. **Responder a essas perguntas com base no código/contexto real** — ler os arquivos antes de afirmar.
5. **Explicitar dependências, riscos e o que muda de forma difícil de reverter** (URLs, schema, migrations, contratos, públicos APIs, etc.).
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

O fluxo depende de o projeto usar **Prisma ORM** ou o **Supabase CLI puro**. 

#### A) Projetos Supabase **COM** Prisma ORM
- Fonte da verdade do schema: `packages/db/prisma/schema.prisma`. Migrations versionadas em `packages/db/prisma/migrations/`.
- Conexão: `DATABASE_URL` (pooler, porta 6543) para runtime; `DIRECT_URL` (porta 5432) para migrations (ver `.env.example`).
- Ao alterar o schema, gerar e aplicar a migration na mesma sessão (rodar em `packages/db`):
  ```bash
  # dev: cria a migration a partir do diff do schema e aplica no banco
  npx prisma migrate dev --name <descricao_curta>

  # remoto/prod: aplica apenas migrations pendentes (sem gerar novas)
  npx prisma migrate deploy

  # validar estado (deve acusar "Database schema is up to date")
  npx prisma migrate status
  ```
- **Não** usar `supabase db push` / `supabase migration` aqui — o Supabase CLI não é a fonte da verdade neste fluxo (não há pasta `supabase/`).
- Validar que a migration foi aplicada corretamente no ambiente remoto antes de seguir.

#### B) Projetos Supabase **SEM** Prisma (Supabase CLI puro)
- Fonte da verdade: SQL versionado em `supabase/migrations/` (gerado por `supabase migration new` ou `supabase db diff`).
- Sempre que criar/alterar uma migration, aplicar no remoto na mesma sessão com:
  ```bash
  supabase db push --linked --include-all
  supabase migration list --linked
  ```
- Validar que a migration foi aplicada corretamente no ambiente remoto (a lista remota deve bater com a local).

### Deploy
- Deploy no Firebase é sempre executado pelo usuário.
- Quando um passo exigir deploy, solicitar explicitamente para o usuário executar.

### Documentação de planejamento
- Documentos de planejamento de features futuras devem ser criados **dentro do projeto** (ex: `docs/`), NUNCA em memória de sessão.
- Se estiver em modo Plan (sem permissão para criar arquivos), avisar o usuário para mudar para modo Agent antes de continuar.

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
- Existe o agente especialista **`docs-curator`** (`.github/agents/docs-curator.agent.md`) para essa tarefa — delegar a ele curadorias/sincronizações da pasta `docs/`.


