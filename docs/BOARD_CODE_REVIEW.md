# 🗂️ Board — Code Review RTQuímico

> Achados de [CODE_REVIEW.md](arquivados/CODE_REVIEW.md) _(arquivado em 22/07/2026 pela curadoria de documentação — relatório datado de 12/07/2026 cujos itens acionáveis já estão totalmente refletidos neste board, que é o artefato vivo de acompanhamento)_. Marque `[x]` ao concluir. Cards concluídos permanecem no arquivo.
>
> **Última atualização:** 24/10/2026 21:30

**Status:** ⬜ Pendente · ✅ Concluído

---

- [x] **RTQ-1** · ✅ · Destravar o build (prop `role` no `Sidebar`)
  - `role?: string;` adicionado às props do `Sidebar`; `npx tsc -b` passa. — [src/components/layout.tsx](src/components/layout.tsx#L66) _(nota de curadoria 22/07/2026: referência de linha atualizada — `Sidebar` foi movido de `src/App.tsx` para `src/components/layout.tsx` no RTQ-7)_

- [x] **RTQ-2** · ✅ · Corrigir coluna `data_acao` → `action_date`
  - Query de `technical_actions` ordena por `action_date`. — [src/App.tsx](src/App.tsx#L82) _(nota de curadoria 22/07/2026: linha atualizada, mesmo arquivo)_

- [x] **RTQ-3** · ✅ · Padronizar categorias do `seed.sql` em slugs
  - Seed usa `visita`/`orientacao`/`laudo`, alinhado a `categoryToUi`. — [supabase/seed.sql](supabase/seed.sql#L53)
>
- [ ] **RTQ-4** · ⬜ · Validar modo Supabase ponta a ponta
  - Login → dashboard → cadastro de RT → diário técnico sem erros no modo conectado.
  - **Parcial (camada de dados validada contra Postgres real, local):** login OK; queries `technical_responsibilities` (4), `alerts` (8), `technical_actions` c/ join `order=action_date` (3, categorias `visita`/`orientacao`/`laudo`) OK; RLS isolando tenant. Confirmou na prática **RTQ-2** e **RTQ-3**.
  - **Remoto (24/10/2026):** projeto Supabase Cloud `qbmocwoqkqazoclmxmsh` criado pelo owner; as 5 migrations aplicadas pela Management API, com histórico em `supabase_migrations.schema_migrations` (RLS, triggers, bucket `documentos`, `search_path` e RTQ-15 conferidos no remoto). Auth: `site_url` = https://rtquimico.web.app; confirmação de e-mail desligada (decisão do owner). `.env.production` aponta para o remoto. **Falta:** publicar o build no Firebase e rodar o fluxo em produção.
  - **Local (24/10/2026):** fluxo completo validado no Supabase local (15 passos: login, painel, cadastro de RT com o alerta do CRQ, diário, F5, isolamento entre tenants, superadmin, criação de conta).
  - **Decisão (12/07):** abandonado o Supabase **local**; validar/operar em **Supabase remoto (Cloud)**. _(Revista em 24/10/2026: o local continua em uso pelo portal da infraestrutura-local para desenvolvimento; o remoto segue pendente para produção.)_ Faltam: `supabase link` + `db push` no remoto e re-teste. Inserts (cadastro de RT/diário) ainda não exercitados.

- [x] **RTQ-5** · ✅ · Fallback de categoria `"other"` → `"outro"`
  - Fallback de `categoryToDb` agora é `"outro"`. — [src/App.tsx](src/App.tsx#L245) (chama `categoryToDb` de [src/lib/mappers.ts](src/lib/mappers.ts#L11)) _(nota de curadoria 22/07/2026: linha atualizada após RTQ-7)_

- [x] **RTQ-6** · ✅ · Eliminar duplicação `schema.sql` × migration
  - `schema.sql` removido; migration é a fonte única. README e GEMINI repontados. — [supabase/migrations/20260610085000_rtquimica_schema.sql](supabase/migrations/20260610085000_rtquimica_schema.sql)

- [x] **RTQ-7** · ✅ · Modularizar `App.tsx` (1.154 linhas)
  - Concluído: `App.tsx` 1.154→365 linhas; `npm run build` passa. Componentes/utilitários extraídos:
    - utils/mappers → [src/lib/format.ts](src/lib/format.ts), [src/lib/mappers.ts](src/lib/mappers.ts)
    - primitivos (`Brand`/`Field`/`Modal`/`PanelHeader`/`Toggle`/`Empty`) → [src/components/primitives.tsx](src/components/primitives.tsx)
    - modais (`NewRtModal`/`NewActionModal`/`PopModal`) → [src/components/modals.tsx](src/components/modals.tsx) (payloads em [src/types.ts](src/types.ts))
    - layout (`Sidebar`/`Header`/`PageHeading`) → [src/components/layout.tsx](src/components/layout.tsx)
    - landing (`Landing`/`AuthPanel`) → [src/components/landing.tsx](src/components/landing.tsx)
    - páginas (`Dashboard`/`Responsibilities`/`Alerts`/`TechnicalDiary`/`Compliance`/`Pops`/`CompanyPortal`/`Admin`/`Profile`) → [src/components/pages.tsx](src/components/pages.tsx)

- [x] **RTQ-8** · ✅ · Substituir métricas hardcoded por dados reais
  - Dashboard deriva de `rts`/`alerts`: "Documentos a vencer" (vigência ≤30 dias), "Conformidade média" (média de `progresso`), "Vencidas" no donut e "Próximas renovações" (dias/mês calculados via helper `daysUntil`). — [src/components/pages.tsx](src/components/pages.tsx#L8) _(nota de curadoria 22/07/2026: `Dashboard` foi movido de `src/App.tsx` para `src/components/pages.tsx` no RTQ-7; `daysUntil` vive em [src/lib/format.ts](src/lib/format.ts#L23))_

- [ ] **RTQ-9** · ⬜ · Hardening: `search_path` em funções `security definer`
  - `create_rt_communication_alert` e `current_user_*` devem fixar `set search_path = ''`. — [supabase/migrations/20260610085000_rtquimica_schema.sql](supabase/migrations/20260610085000_rtquimica_schema.sql)

- [x] **RTQ-10** · ✅ · Adotar router (deep-linking + histórico)
  - Navegação por estado impede deep-linking e histórico do navegador.
  - Concluído (24/10/2026): cada página do painel tem URL própria (`/painel`, `/responsabilidades`, `/alertas`, `/diario`, `/conformidade`, `/pops`, `/empresa`, `/administracao`, `/configuracoes`) via History API nativa, sem dependência nova — [src/lib/rotas.ts](src/lib/rotas.ts), ligado em [src/App.tsx](src/App.tsx). Link direto sem login mostra a landing e, depois de entrar, abre a página pedida; `/administracao` por link só para `superadmin`/`tenant_admin`. Evidência: teste no navegador contra o app local (login real da Mariana): link direto, menu, voltar/avançar, F5, `/` → `/painel` e sair → `/`, sem erros; testes em [src/App.test.tsx](src/App.test.tsx).

- [x] **RTQ-11** · ✅ · Error Boundary, testes e CI
  - Error Boundary + testes básicos (Vitest + Testing Library) + CI (lint + typecheck + build).
  - Concluído (24/10/2026): [src/components/error-boundary.tsx](src/components/error-boundary.tsx) envolve o app em [src/main.tsx](src/main.tsx) (tela "Algo deu errado" com recarregar); Vitest + jsdom + Testing Library ([vitest.config.ts](vitest.config.ts), `npm test`) com 18 testes em 5 arquivos (rotas, história 3D, datas/categorias, Error Boundary e o App em modo demo); CI em [.github/workflows/ci.yml](.github/workflows/ci.yml) com lint, typecheck, testes e build.

- [x] **RTQ-12** · ✅ · Inicializar Git e publicar no GitHub _(infra — fora do escopo do CODE_REVIEW)_
  - Concluído: repo iniciado, commit inicial `239221d` ("first commit", autor `Bruno Vieira <vieira.es@gmail.com>`), branch `main` publicada em `git@github.com:vieiraes/rtquimica.git` com tracking `origin/main`.
  - 79 arquivos versionados; `.gitignore` manteve `node_modules`/`dist`/`.env*` fora. SSH autenticado como `vieiraes`.

- [ ] **RTQ-13** · ⬜ · GRANTs ausentes para roles da API (migration) _(descoberto na validação RTQ-4)_
  - Tabelas têm RLS + policies, mas `anon`/`authenticated` não têm privilégio de tabela → `42501 permission denied` (app não lê nada no modo conectado). **Crítico também no remoto.**
  - Feito quando: migration concedendo `grant`/`alter default privileges` a `anon, authenticated` (RLS segue controlando linhas) aplicada e validada. — [supabase/migrations/](supabase/migrations/)

- [x] **RTQ-14** · ✅ · Seed de auth incompleto (login local quebrado) _(descoberto na validação RTQ-4; dev-only)_
  - `seed.sql` inseria `auth.users` sem `aud`/`instance_id` (→ `invalid_credentials`) e com colunas de token em `NULL` (→ GoTrue 500). `aud`/`instance_id` **já corrigidos** em [supabase/seed.sql](supabase/seed.sql#L10); falta normalizar as colunas de token (`confirmation_token=''` etc.) no seed.
  - Feito quando: `supabase db reset` local logar sem patch manual (ou marcar N/A se o local for descartado).
  - Concluído (24/10/2026): o ambiente local continua valendo, via portal da infraestrutura-local (decisão do owner). O seed agora grava as colunas de token de `auth.users` como texto vazio — [supabase/seed.sql](supabase/seed.sql#L10). Evidência: `npm run check:supabase -- rtquimica` (infraestrutura-local) passou com 8 tabelas e os 3 usuários entrando, depois de recriar o banco do zero; login real da Mariana no app local.

- [x] **RTQ-15** · ✅ · Escalada de privilégio pelo cadastro e pelo update do próprio perfil _(descoberto na preparação do RTQ-4, 24/10/2026)_
  - `handle_new_user()` lia `role` e `tenant_id` de `raw_user_meta_data`, que quem se cadastra controla (`signUp` com a chave pública): qualquer pessoa virava superadmin ou entrava no tenant de outro cliente. E as policies de update de `profiles` e `tenants` liberavam qualquer coluna (`role`, `tenant_id`, `plan`).
  - Corrigido em [supabase/migrations/20261024210000_fix_privilege_escalation.sql](supabase/migrations/20261024210000_fix_privilege_escalation.sql): o trigger só confia em `raw_app_meta_data` (gravado pelo servidor) e o usuário só edita `name`, `crq_number`, `crq_state`, `phone`, `avatar_url` do perfil e `name` do tenant. O [seed](supabase/seed.sql) passou papel e tenant para `raw_app_meta_data`.
  - Evidência: no local, cadastro com `role: superadmin` e o `tenant_id` da Mariana virou `tenant_admin` do próprio workspace e não leu as RTs dela; `update` de `role`, `tenant_id` e `plan` recusados com `42501`; dados pessoais seguem editáveis. No remoto, `has_column_privilege` confirma as colunas travadas e a simulação de cadastro malicioso deu `tenant_admin` sem entrar no outro tenant.
  - Pendência relacionada: trocar papel de alguém (ex.: promover a `tenant_admin`) agora só por SQL/service role; quando a tela de Administração deixar de ser estática, criar uma função `security definer` que confira se quem chama é superadmin/tenant_admin.

