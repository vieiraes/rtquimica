# 🗂️ Board — Code Review RTQuímico

> Achados de [CODE_REVIEW.md](CODE_REVIEW.md). Marque `[x]` ao concluir. Cards concluídos permanecem no arquivo.
>
> **Última atualização:** 12/07/2026 16:49

**Status:** ⬜ Pendente · ✅ Concluído

---

- [x] **RTQ-1** · ✅ · Destravar o build (prop `role` no `Sidebar`)
  - `role?: string;` adicionado às props do `Sidebar`; `npx tsc -b` passa. — [src/App.tsx](src/App.tsx#L677)

- [x] **RTQ-2** · ✅ · Corrigir coluna `data_acao` → `action_date`
  - Query de `technical_actions` ordena por `action_date`. — [src/App.tsx](src/App.tsx#L243)

- [x] **RTQ-3** · ✅ · Padronizar categorias do `seed.sql` em slugs
  - Seed usa `visita`/`orientacao`/`laudo`, alinhado a `categoryToUi`. — [supabase/seed.sql](supabase/seed.sql#L53)

- [ ] **RTQ-4** · ⬜ · Validar modo Supabase ponta a ponta
  - Login → dashboard → cadastro de RT → diário técnico sem erros no modo conectado.

- [x] **RTQ-5** · ✅ · Fallback de categoria `"other"` → `"outro"`
  - Fallback de `categoryToDb` agora é `"outro"`. — [src/App.tsx](src/App.tsx#L406)

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
  - Dashboard deriva de `rts`/`alerts`: "Documentos a vencer" (vigência ≤30 dias), "Conformidade média" (média de `progresso`), "Vencidas" no donut e "Próximas renovações" (dias/mês calculados via helper `daysUntil`). — [src/App.tsx](src/App.tsx#L759)

- [ ] **RTQ-9** · ⬜ · Hardening: `search_path` em funções `security definer`
  - `create_rt_communication_alert` e `current_user_*` devem fixar `set search_path = ''`. — [supabase/migrations/20260610085000_rtquimica_schema.sql](supabase/migrations/20260610085000_rtquimica_schema.sql)

- [ ] **RTQ-10** · ⬜ · Adotar router (deep-linking + histórico)
  - Navegação por estado impede deep-linking e histórico do navegador.

- [ ] **RTQ-11** · ⬜ · Error Boundary, testes e CI
  - Error Boundary + testes básicos (Vitest + Testing Library) + CI (lint + typecheck + build).

- [ ] **RTQ-12** · ⬜ · Inicializar Git e publicar no GitHub _(infra — fora do escopo do CODE_REVIEW)_
  - Repo ainda não versionado (`git init` necessário). `.gitignore` já cobre `node_modules`/`dist`/`.env`/`.env.local`.
  - Passos (fornecidos pelo owner):
    ```bash
    git init
    git add .
    git commit -m "first commit"
    git branch -M main
    git remote add origin git@github.com:vieiraes/rtquimica.git
    git push -u origin main
    ```
  - Notas: remote via **SSH** (requer chave configurada na conta GitHub). Sugiro `git add .` (não só o README) — o `.gitignore` já protege segredos/artefatos. Execução aguarda pedido explícito do owner (regra: não commitar/push automático).
