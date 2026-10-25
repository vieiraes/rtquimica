# Instruções para o Claude Code (RTQuímico)

> Fonte única de regras do projeto. O desenvolvimento é feito só com o Claude Code; os agentes especialistas
> ficam em `.claude/agents/` e as skills em `.claude/skills/`.

## 1. Contexto do projeto

- **RTQuímico**: SaaS B2B/B2C multi-tenant para gestão de Responsabilidades Técnicas (RTs) de profissionais da Química.
- **Frontend**: React 19 + TypeScript, Vite, CSS vanilla (`src/styles.css`), **só tema claro** (o escuro foi removido em 24/10/2026 a pedido do Bruno). Cores só pelos tokens do `:root`; borda de campo (`--field-border`) e texto secundário (`--muted`) foram escolhidos por contraste (3:1 e 7:1 contra o branco), não clarear. Sem atalhos de teclado na interface. **Sem Tailwind** nem outros frameworks de estilo — nova estilização vai em `src/styles.css`.
- **Roteamento**: cada página do painel tem URL própria (`src/lib/rotas.ts`, History API nativa, sem router). Página nova = entrada em `ROTAS` e no tipo `Page`. O Firebase reescreve qualquer rota para o `index.html`.
- **Tipagens**: centralizadas em `src/types.ts`; mapeadores DB↔UI em `src/lib/mappers.ts` (`mapRt`, `mapAlert`, `mapAction`, categorias). Retornos do Supabase (em inglês) devem ser mapeados para as interfaces consumidas pelos componentes visuais.
- **Site público × acesso**: a landing (`src/components/landing.tsx`) é só apresentação do produto, sem formulário. Login e cadastro ficam em páginas próprias, `/entrar` e `/criar-conta` (`src/components/auth-page.tsx`), abertas pelo botão Entrar/Teste grátis do menu. Página do painel aberta sem login mostra `/entrar` e, depois de entrar, abre a página pedida. Decisão do owner (24/10/2026): login separado, no modelo tradicional; não embutir o login na landing.
- **Landing 3D**: a seção "Um dia de responsável técnico" (`src/components/historia/`) é uma maquete 3D em three.js presa na tela, guiada pela rolagem. three.js só é baixado sob demanda (`Palco3D` via `React.lazy`); sem WebGL a seção vira uma grade de cartões. Textos dos cartões em `conteudo.ts`; capítulos, poses de câmera e pinos em `historia.ts`; a cena em `maquete.ts`.
- **Backend**: Supabase (Auth + Postgres com RLS + Storage).
  - **Local (desenvolvimento):** o Supabase local e o app sobem pelo portal da **infraestrutura-local** (`localhost:3490`, cartão RTQuímico; app em `localhost:5308`). O banco nasce das migrations + `supabase/seed.sql`; logins do seed `@rtquimico.local`, senha `123456`. Depois de mudar migration ou seed, rodar lá `npm run check:supabase -- rtquimica` (com o Supabase do projeto desligado, para recriar do zero). A decisão de 12/07/2026 de abandonar o local foi revista em 24/10/2026.
  - Fora do portal, `npm run dev` lê o `.env.local` (fora do git), que aponta para o mesmo Supabase local: `VITE_SUPABASE_URL=http://127.0.0.1:57141` e a anon key que o portal passa ao app (slot 7). O Supabase do cartão tem de estar ligado no portal. Fluxo validado em 24/10/2026: login, painel, cadastro de RT com o alerta do CRQ, diário, isolamento entre tenants, superadmin e criação de conta.
  - **Remoto (produção):** projeto Supabase Cloud `qbmocwoqkqazoclmxmsh` (`https://qbmocwoqkqazoclmxmsh.supabase.co`), criado em 24/10/2026 numa conta diferente da que a CLI desta máquina usa. O acesso é pelo **MCP do Supabase** com escopo do projeto (`.mcp.json`), autenticado pelo usuário com `claude /mcp`; não trocar o login da CLI (cortaria o acesso aos outros projetos). Migrations aplicadas pela Management API do Supabase com um token de acesso da conta dona (o classificador de segurança pede um "pode fazer" explícito do usuário antes de mudar o remoto); o histórico fica em `supabase_migrations.schema_migrations`, compatível com `supabase db push`. Seed **nunca** vai para o remoto. Confirmação de e-mail desligada no remoto e no local (decisão do owner, 24/10/2026): o cadastro já entra logado.
  - `.vscode/mcp.json` aponta para o Supabase local; não reflete o estado do Cloud.
- Para arquitetura, RBAC e histórico de decisões, `docs/CONHECIMENTO.md` é a fonte viva e mais atual — mais confiável que este resumo em caso de divergência.

## 2. Padrões de modelagem de banco de dados

- **Inglês obrigatório**: tabelas, colunas, enums, triggers sempre em inglês (ex.: `technical_responsibilities`, `tenant_admin`, `alerts`). Não usar português no schema.
- **Tenant isolation**: toda entidade transacional nova precisa de `tenant_id` referenciando `public.tenants(id)`.
- **RLS custom**: toda tabela nova precisa de policies considerando `tenant_id` e a função utilitária `public.current_user_role() = 'superadmin'`.
- **Papel e tenant nunca vêm do cliente:** `handle_new_user()` só lê `role`/`tenant_id` de `raw_app_meta_data`; o usuário só edita colunas pessoais do perfil e o nome do tenant (privilégio por coluna). Não reabrir isso (RTQ-15).
- **Financeiro** (`/financeiro`, `src/components/financeiro.tsx`): honorários, despesas com comprovante, carnê-leão e resumo do IR. Lançamento é **pessoal** (`financial_entries`, RLS por `user_id`; nem o titular nem o superadmin veem os de outra pessoa); comprovantes no bucket `financeiro`, pasta `<user_id>/`. A conta do carnê-leão fica em `src/lib/impostos.ts` (regras de 2026, com teste do exemplo da Receita): mudou a lei, trocar as constantes e o teste. `profiles.tax_regime` (`pf`/`pj`) decide se o carnê-leão se aplica.
- **Google Agenda** (`docs/GOOGLE_AGENDA.md`): o químico conecta em Configurações (OAuth, escopo `calendar.app.created`) e as functions `google-agenda`/`google-retorno` mantêm a agenda "RTQuímico" no Google dele (vencimentos de RT, honorários a receber, carnê-leão). Refresh token só no servidor (`google_calendar_links`, sem grant da coluna). No local tudo fala com o mock do Google (`scripts/mock-google.mjs`, `localhost:5330`), que o portal sobe; produção depende de criar o OAuth no Google Cloud (passo a passo no doc).
- **IA** (`docs/PLANO_IA.md`): Edge Function `ia` com três operações, cada uma com prompt e validação em `supabase/functions/_shared/ia-*.ts` (o navegador manda só os dados): `diario_redigir` ("Redigir com IA" no Registrar ação), `radar_explicar` ("Explicar com IA" no Radar: resumo + empresas afetadas pelo CNAE, guardado em `ai_radar_explanations`, ver de novo não gasta) e `pop_adaptar` ("Gerar rascunho com IA" ao usar um modelo da biblioteca; o POP salvo vai para `sop_templates` do escritório). A função só abre links `https` públicos. limites e teto de tokens em `ai_config`, reserva atômica em `reservar_uso_ia`, uso em `ai_usage_log` (só service role grava; falha não conta). Local fala com o mock da DeepSeek (`scripts/mock-deepseek.mjs`, `localhost:5331`); a chave real vai como secret `DEEPSEEK_API_KEY` só no deploy. O texto da IA é sempre rascunho que o químico revisa.
- **Radar regulatório** (`/radar`): Edge Function `radar` lê os RSS de `regulatory_sources` (CFQ, CRQ-SP, CONAMA, MMA, Ibama) quando alguém abre a página, no máximo a cada 3 h por fonte, e guarda em `regulatory_items` (o navegador só lê; lido/não lido em `regulatory_reads`). O leitor (`_shared/radar-rss.ts`) descarta anexos e imagens dos feeds do gov.br; as resoluções do CFQ (sem feed) vêm da página pública, pelos links `viewPageResolucao.php?id=` (fonte `kind = cfq-resolucoes`). Use sempre `www.cfq.org.br`: o domínio sem www aponta para 127.0.0.1 no DNS público do CFQ. Em 25/10/2026 o servidor do CFQ também derrubava a conexão TLS vinda desta rede, então a leitura ao vivo do CFQ não foi validada.
- **CNPJ no cadastro de RT** (`src/lib/cnpj.ts`): BrasilAPI direto do navegador, CNPJ.ws de reserva; grava razão social, CNAE e cidade na RT. Falhar a consulta nunca impede o cadastro manual.
- **Guia do IR em PDF** (Financeiro → aba Imposto de renda → "Baixar guia do IR (PDF)"): `src/lib/guia-ir.ts` monta "onde clicar e o que digitar" no programa IRPF a partir dos lançamentos do ano (fichas de PJ, de PF/carnê-leão com livro-caixa mês a mês, ou pró-labore e lucros para quem recebe pela empresa) e `src/lib/guia-ir-pdf.ts` desenha com jsPDF (carregado só ao gerar). Nomes das fichas conferidos com o IRPF 2026 por guias de terceiros (o manual oficial não foi achado): ao virar o ano, conferir no programa novo e ajustar os textos e o teste. O guia diz que o informe oficial de cada empresa vale mais.
- **Comprovante por foto** (Nova despesa → "Ler valores da foto"): OCR com tesseract.js no navegador, sem serviço pago; `src/lib/ocr-comprovante.ts` tira valor, data, CNPJ e sugere a categoria. Motor e idioma (por) vêm do CDN jsdelivr na primeira leitura de cada navegador. PDF não é lido, só imagem.
- **Equipe** (`supabase/functions/equipe`): titular convida químico (cria o acesso, coloca no escritório e manda o e-mail de definir senha → `/definir-senha`), desativa/reativa (ban no Auth + `profiles.active`); superadmin muda papel titular/equipe. O Auth grava o `app_metadata` depois do INSERT, então o trigger cria um workspace avulso: a função corrige o perfil e apaga esse workspace.
- **Comunicação ao CRQ** (menu ⋮ da RT): texto por modelo, sem IA (`src/lib/comunicacao-crq.ts`); marcar como comunicada fecha o alerta `comunicacao_pendente` da RT e registra no diário com o protocolo. "Encerrar RT" muda para `canceled` (o trigger cria o alerta do encerramento).
- **Conformidade** grava um checklist por RT em `checklists`; o `progresso` da RT (lista e média do painel) vem dele e é `null` sem revisão. **Diário**: evidências no bucket `documentos` (pasta do escritório), busca, período e relatório para imprimir/PDF.
- **Produto explícito:** telas e documentos dizem onde clicar e o que preencher (nome exato do botão ou ficha); em assunto de órgão oficial, passo a passo e tabela campo → valor.
- **Edge Functions no local:** função nova só é servida depois de reiniciar o serviço "Supabase · RTQuímico" no portal (a lista de funções é montada quando ele liga).
- Papéis (`app_role`): `superadmin`, `tenant_admin`, `tenant_member`, `tenant_external_client` — detalhes em `docs/CONHECIMENTO.md`. O que cada papel vê fica em `src/lib/papeis.ts` (menu, página inicial e redirecionamento de URL de outro papel):
  - `superadmin` é a **gestão do produto**, não é químico: só `/plataforma` (usuários e escritórios) e `/configuracoes`; não abre o painel de RTs.
  - `tenant_admin` (titular) tem o painel do químico + `/equipe`; `tenant_member` tem o painel sem `/equipe`.
  - **Só químicos (24/10/2026):** `tenant_external_client` (empresa contratante) continua no enum, mas não entra no painel (tela de acesso desligado) e o portal da empresa foi removido. Voltar a atender empresas exige antes ligar cada empresa à RT dela no banco: hoje o RLS daria a ela todas as RTs do escritório.
  - Logins locais, um por papel (senha `123456`): `superadmin@`, `mariana@` (titular, escritório A, recebe no CPF), `carla@` (equipe, A, recebe pela empresa), `joao@` (titular, escritório B) — todos `@rtquimico.local`, também na ficha do portal.

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
- Só commitar/push quando o usuário pedir explicitamente (ex: "commita", "envia pro github", "faz o push") ou declarar deploy (ver abaixo).
- Após edições de arquivos, apenas confirmar o que foi feito — não encadear git add/commit/push por conta própria.

### Migrations / Banco (Supabase)

- Fonte da verdade: SQL versionado em `supabase/migrations/` (**Supabase CLI puro** — este projeto não usa Prisma; não há `schema.prisma`).
- Toda migration nova tem de subir do zero no Supabase local (infraestrutura-local, ver seção 1). O remoto **ainda não foi criado nem linkado**. Antes de rodar qualquer comando de push, **confirmar com o usuário** se o projeto Supabase Cloud já existe e está linkado (`supabase link`); criar um projeto novo é ação do usuário (conta/billing), não algo para o agente assumir ou disparar sozinho.
- Uma vez existindo e linkado, o fluxo normal é aplicar no remoto na mesma sessão em que a migration for criada/alterada:
  ```bash
  supabase db push --linked --include-all
  supabase migration list --linked   # o remoto deve bater com o local
  ```
- Se o projeto vier a adotar Prisma no futuro, tratá-lo como **camada de introspecção apenas** (`prisma db pull` após aplicar a migration) — **nunca** `prisma migrate`; o Supabase CLI continua dono do schema.
- Validar sempre que a migration foi aplicada corretamente no ambiente remoto antes de seguir.

### Verificações
- `npm run lint`, `npm run typecheck`, `npm test` (Vitest + jsdom, sempre em modo demonstração, sem Supabase) e `npm run build`. A CI (`.github/workflows/ci.yml`) roda as quatro em todo push.

### Deploy
- Produção: **Firebase Hosting**, projeto `rtquimico` (https://rtquimico.web.app), conta `vieira.es@gmail.com` fixada nesta pasta com `firebase login:use`.
- Deploy só quando o usuário declarar ("publica em produção", "deploya"). Aí é a entrega completa: commit + push no GitHub + `npm run build && firebase deploy --only hosting` + teste rápido em produção.
- `.env.production` aponta para o Supabase remoto (URL + chave publicável, ambas públicas) e sobrepõe o `.env.local` no build. Antes de publicar, conferir que o bundle cita `qbmocwoqkqazoclmxmsh.supabase.co` e não cita `57141`/`55321` nem `sbp_`.

### Documentação de planejamento
- Documentos de planejamento de features futuras devem ser criados **dentro do projeto** (ex: `docs/`), NUNCA em memória de sessão.
- Se estiver em modo de plano, avisar o usuário para aprovar o plano antes de criar/editar arquivos.

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
- Existe o agente especialista **`docs-curator`** (`.claude/agents/docs-curator.md`) para curadorias/sincronizações amplas da pasta `docs/` — **invocar apenas quando o usuário pedir explicitamente**, nunca proativamente após cada tarefa/feature. No dia a dia, a sessão principal faz a curadoria pontual diretamente (baixa do próprio card/checklist da mudança em andamento), sem delegar.
- **Escopo do `docs-curator` (inegociável):** o agente edita **exclusivamente** arquivos dentro de `docs/`. **Nunca** altera código nem arquivos fora de `docs/`. Pode sugerir melhorias e, se útil, escrever um arquivo de sugestões em `docs/` (ex.: `docs/SUGESTOES_CODIGO.md`); qualquer mudança de código é sempre do agente principal/owner.
- Existe também o agente **`par-senior`** (`.claude/agents/par-senior.md`) para avaliar se uma feature vale a pena construir; grava só o próprio relatório em `docs/`.
