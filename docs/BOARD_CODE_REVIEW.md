# 🗂️ Board — Code Review RTQuímico

> Achados de [CODE_REVIEW.md](arquivados/CODE_REVIEW.md) _(arquivado em 22/07/2026 pela curadoria de documentação — relatório datado de 12/07/2026 cujos itens acionáveis já estão totalmente refletidos neste board, que é o artefato vivo de acompanhamento)_. Marque `[x]` ao concluir. Cards concluídos permanecem no arquivo.
>
> **Última atualização:** 22/07/2026 20:01

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
  - **Decisão (12/07):** abandonado o Supabase **local**; validar/operar em **Supabase remoto (Cloud)**. Faltam: `supabase link` + `db push` no remoto e re-teste. Inserts (cadastro de RT/diário) ainda não exercitados.

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

- [ ] **RTQ-10** · ⬜ · Adotar router (deep-linking + histórico)
  - Navegação por estado impede deep-linking e histórico do navegador.

- [ ] **RTQ-11** · ⬜ · Error Boundary, testes e CI
  - Error Boundary + testes básicos (Vitest + Testing Library) + CI (lint + typecheck + build).

- [x] **RTQ-12** · ✅ · Inicializar Git e publicar no GitHub _(infra — fora do escopo do CODE_REVIEW)_
  - Concluído: repo iniciado, commit inicial `239221d` ("first commit", autor `Bruno Vieira <vieira.es@gmail.com>`), branch `main` publicada em `git@github.com:vieiraes/rtquimica.git` com tracking `origin/main`.
  - 79 arquivos versionados; `.gitignore` manteve `node_modules`/`dist`/`.env*` fora. SSH autenticado como `vieiraes`.

- [ ] **RTQ-13** · ⬜ · GRANTs ausentes para roles da API (migration) _(descoberto na validação RTQ-4)_
  - Tabelas têm RLS + policies, mas `anon`/`authenticated` não têm privilégio de tabela → `42501 permission denied` (app não lê nada no modo conectado). **Crítico também no remoto.**
  - Feito quando: migration concedendo `grant`/`alter default privileges` a `anon, authenticated` (RLS segue controlando linhas) aplicada e validada. — [supabase/migrations/](supabase/migrations/)

- [ ] **RTQ-14** · ⬜ · Seed de auth incompleto (login local quebrado) _(descoberto na validação RTQ-4; dev-only)_
  - `seed.sql` inseria `auth.users` sem `aud`/`instance_id` (→ `invalid_credentials`) e com colunas de token em `NULL` (→ GoTrue 500). `aud`/`instance_id` **já corrigidos** em [supabase/seed.sql](supabase/seed.sql#L10); falta normalizar as colunas de token (`confirmation_token=''` etc.) no seed.
  - Feito quando: `supabase db reset` local logar sem patch manual (ou marcar N/A se o local for descartado).
