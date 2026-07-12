# Code Review — RTQuímico

> Data: 2026-07-12 · Escopo: revisão estática do repositório (frontend React + Supabase)
> Método: leitura do código, `tsc -b`, `eslint .`, diff de migrations/schema.

---

## 1. Resumo executivo

O RTQuímico é um SPA React 19 + Vite + TypeScript que funciona em dois modos: **demo** (dados mockados locais) e **conectado ao Supabase** (Auth + Postgres com RLS). A base é enxuta, bem tipada na maioria dos pontos e com um schema de banco maduro (RLS por tenant, triggers de negócio, storage privado).

Porém, a revisão encontrou **problemas que quebram o build e o modo Supabase**:

- **[Crítico]** O build está quebrado: `npm run build` falha em `tsc` por 2 erros de tipagem no componente `Sidebar` (prop `role` não declarada).
- **[Crítico]** No modo Supabase, o carregamento do diário técnico quebra: a query ordena por uma coluna inexistente (`data_acao` em vez de `action_date`).
- **[Alto]** Incompatibilidade de categorias entre `seed.sql` e o app: ações semeadas aparecem todas como "Outro".
- **[Médio]** `schema.sql` e a migration são **idênticos e duplicados** → risco de drift.
- **[Médio]** `App.tsx` é um monólito de 1.154 linhas; `src/components/` existe mas está vazio.

Diagnóstico geral: **protótipo sólido de UI, mas ainda não está production-ready** — o caminho "conectado ao Supabase" tem bugs que impedem uso real e o build não passa.

---

## 2. Stack e arquitetura

| Camada | Tecnologia |
|---|---|
| UI | React 19, lucide-react, CSS puro (`styles.css`) |
| Build | Vite 7, TypeScript 5.8 (strict) |
| Backend | Supabase (Auth, Postgres, Storage) via `@supabase/supabase-js` |
| Lint | ESLint 9 flat config + typescript-eslint + react-hooks |

**Observações de arquitetura:**

- **Sem router**: navegação por estado (`useState<Page>`). Aceitável para protótipo, mas impede deep-linking, histórico do navegador e code-splitting por rota.
- **Monólito**: todos os componentes (Landing, Sidebar, Dashboard, modais, etc.) vivem em [src/App.tsx](src/App.tsx). A pasta [src/components](src/components) está vazia, sinalizando uma modularização planejada mas não executada.
- **Modo dual bem pensado**: `isSupabaseConfigured` alterna entre mock e backend real de forma limpa em [src/lib/supabase.ts](src/lib/supabase.ts).

---

## 3. Bugs críticos (bloqueiam build/uso)

### 3.1 [Crítico] Build quebrado — prop `role` ausente no tipo de `Sidebar`

> ✅ **RESOLVIDO** (RTQ-1 · [BOARD_CODE_REVIEW.md](BOARD_CODE_REVIEW.md)) — `role?: string;` adicionado às props do `Sidebar` em [src/App.tsx](src/App.tsx#L677); `npx tsc -b` passa.

`tsc -b` falha com 2 erros. O componente `Sidebar` desestrutura `role`, mas a interface de props não o declara.

- Uso da prop: [src/App.tsx](src/App.tsx#L457)
- Desestruturação sem tipo: [src/App.tsx](src/App.tsx#L666)

Como o script de build é `tsc -b && vite build`, **o build de produção não compila hoje**.

**Correção:** adicionar `role?: string;` à interface de props do `Sidebar` (o bloco de tipos termina em `activeCount: number;`).

```ts
  initials: string;
  activeCount: number;
  role?: string;
}) {
```

### 3.2 [Crítico] Query ordena por coluna inexistente (`data_acao`)

> ✅ **RESOLVIDO** (RTQ-2 · [BOARD_CODE_REVIEW.md](BOARD_CODE_REVIEW.md)) — a query passou a ordenar por `action_date` em [src/App.tsx](src/App.tsx#L243).

No carregamento de dados do Supabase, as ações técnicas são ordenadas por `data_acao`:

- [src/App.tsx](src/App.tsx#L243) — `.order("data_acao", { ascending: false })`

Mas a coluna real na tabela `technical_actions` é `action_date` ([supabase/migrations/20260610085000_rtquimica_schema.sql](supabase/migrations/20260610085000_rtquimica_schema.sql#L71)), e o próprio `mapAction` lê `row.action_date` ([src/App.tsx](src/App.tsx#L181)). No modo Supabase, o Postgres retorna erro `column technical_actions.data_acao does not exist`, o `Promise.all` rejeita e o usuário vê o toast "Não consegui carregar os dados".

**Correção:** trocar `"data_acao"` por `"action_date"`.

---

## 4. Consistência de dados (alto/médio)

### 4.1 [Alto] Categorias do `seed.sql` não batem com o mapa do app

> ✅ **RESOLVIDO** (RTQ-3 · [BOARD_CODE_REVIEW.md](BOARD_CODE_REVIEW.md)) — o seed passou a usar slugs `visita`/`orientacao`/`laudo`, alinhados a `categoryToUi`. Ver [supabase/seed.sql](supabase/seed.sql#L54).

`mapAction` traduz via `categoryToUi`, cujas chaves são slugs em minúsculas (`visita`, `orientacao`, `laudo`…) — [src/App.tsx](src/App.tsx#L109). Porém o `seed.sql` insere categorias como texto de exibição: `'Visita técnica'`, `'Orientação'`, `'Laudo'` — [supabase/seed.sql](supabase/seed.sql#L44).

Resultado: toda ação semeada cai no fallback e é exibida como **"Outro"**. O app, ao inserir, usa `categoryToDb` → grava slug; o seed grava rótulo. Há **dois formatos convivendo na mesma coluna**.

**Recomendação:** padronizar em slugs. Atualizar `seed.sql` para usar `visita`, `orientacao`, `laudo` (ou criar um enum/`check` na coluna `category` para forçar consistência).

### 4.2 [Médio] Fallback de categoria inconsistente

> ✅ **RESOLVIDO** (RTQ-5 · [BOARD_CODE_REVIEW.md](BOARD_CODE_REVIEW.md)) — o fallback de `categoryToDb` passou a ser `"outro"` em [src/App.tsx](src/App.tsx#L406).

Ao inserir uma ação, o fallback usa `"other"` em inglês — [src/App.tsx](src/App.tsx#L406) — enquanto todo o resto do domínio usa `"outro"`. Se cair no fallback, `mapAction` não encontra `categoryToUi["other"]` e exibe "Outro" por coincidência, mascarando o problema.

**Recomendação:** usar `"outro"` para manter o padrão.

### 4.3 [Médio] `schema.sql` duplicado da migration

> ✅ **RESOLVIDO** (RTQ-6 · [BOARD_CODE_REVIEW.md](BOARD_CODE_REVIEW.md)) — `supabase/schema.sql` foi **removido**; a migration [supabase/migrations/20260610085000_rtquimica_schema.sql](supabase/migrations/20260610085000_rtquimica_schema.sql) é a fonte única. `README.md` e `GEMINI.md` foram repontados para `supabase/migrations/`.

~~[supabase/schema.sql](supabase/schema.sql)~~ (removido no RTQ-6) era **byte a byte idêntico** a [supabase/migrations/20260610085000_rtquimica_schema.sql](supabase/migrations/20260610085000_rtquimica_schema.sql). Manter dois arquivos com o mesmo DDL leva a drift: uma futura migration altera um, o outro fica desatualizado, e o README aponta para `schema.sql` como fonte de verdade.

**Recomendação:** eleger as **migrations** como fonte única de verdade e reduzir `schema.sql` a um dump gerado (`supabase db dump`) ou removê-lo, ajustando o README.

### 4.4 [Baixo] Default de `role` divergente entre tabela e trigger

A tabela `profiles` tem default `tenant_member` ([supabase/migrations/20260610085000_rtquimica_schema.sql](supabase/migrations/20260610085000_rtquimica_schema.sql#L18)), mas o trigger `handle_new_user` insere `tenant_admin` como default ([supabase/migrations/20260610085000_rtquimica_schema.sql](supabase/migrations/20260610085000_rtquimica_schema.sql#L128)). Não é bug (o trigger sempre fornece o valor), mas a divergência confunde. Alinhar a intenção.

---

## 5. Banco de dados, RLS e segurança

Pontos **positivos**:

- **RLS habilitada** em todas as tabelas com isolamento por tenant via `current_user_tenant()` e escalada de `superadmin`.
- **Storage privado** (`documentos`, `public = false`) com políticas por pasta = `tenant_id`.
- Trigger de perfil com `set search_path = ''` (boa prática de segurança contra hijack de search_path).
- Regras de negócio no banco (limite de 6 RTs ativas, alerta automático de comunicação ao CRQ) — resiliente independentemente do cliente.

Pontos de **atenção**:

- **[Médio] `search_path` ausente em funções `security definer`**: `create_rt_communication_alert` e as funções `current_user_*` são `security definer` sem `set search_path = ''`. Recomenda-se fixar o search_path em todas as funções `security definer` para hardening.
- **[Baixo] Performance de RLS**: `current_user_tenant()`/`current_user_role()` fazem subquery em `profiles` a cada verificação. São `stable` (cacheadas por statement), mas em tabelas grandes convém indexar `profiles(id)` (já é PK) e considerar `(select auth.uid())` para evitar reavaliação por linha, conforme guia de performance do Supabase.
- **[Info] Chave anon no cliente**: correto e esperado — a `VITE_SUPABASE_ANON_KEY` é pública por design; a segurança depende da RLS, que está presente.
- **[Info] Segredos**: não há `.env` commitado; apenas `.env.example` com placeholders. Bom.

Não foram encontrados indícios de SQL injection (uso de query builder parametrizado) nem de XSS (sem `dangerouslySetInnerHTML`).

---

## 6. Qualidade de código e manutenibilidade

- **[Médio] Monólito de 1.154 linhas** em [src/App.tsx](src/App.tsx): dificulta revisão, reuso e testes. Extrair componentes para `src/components/` (Landing, Sidebar, Header, Dashboard, modais) e mapeadores/utilitários (`mapRt`, `mapAlert`, `mapAction`, `formatDate`) para `src/lib/`.
- **[Médio] Números e textos mágicos hardcoded na UI**: métricas fixas ("2 documentos a vencer", "78%", "18 dias", "214 dias restantes"), saudação fixa "Bom dia, Mariana" e data "Quarta-feira, 10 de junho" em [src/App.tsx](src/App.tsx#L52). Em modo conectado, esses valores não refletem os dados reais e induzem o usuário a erro.
- **[Médio] `progresso` derivado de forma arbitrária**: `mapRt` calcula `progresso: row.status === 'active' ? 80 : 35` ([src/App.tsx](src/App.tsx#L165)). O campo de conformidade exibido não vem da tabela `checklists`, que existe justamente para isso.
- **[Baixo] Sem tratamento de `Promise` rejeitada em `refreshAlerts`/`markAlertsRead`** quando chamadas fora de um `try/catch` (ex.: `void onMarkRead()` no botão) — erros de rede seriam silenciados. Considerar um wrapper de erro central.
- **[Baixo] Ausência de Error Boundary** e de estados de erro persistentes (só toasts efêmeros).
- **[Baixo] Sem testes** (nenhum arquivo de teste no repo) e sem CI configurado.
- **[Positivo] Lint limpo**: `eslint .` passa sem warnings.
- **[Positivo] TypeScript em modo strict** e tipagem consistente na maior parte.

---

## 7. Acessibilidade e UX

- **[Positivo]** Bom uso de `aria-label` em botões-ícone, `role="switch"` + `aria-checked` no `Toggle`, e `role="dialog"` + `aria-modal` + `aria-labelledby` nos modais.
- **[Baixo]** Busca global no header sem `<label>` associado ([src/App.tsx](src/App.tsx#L738)).
- **[Baixo]** Alguns botões-ícone sem `aria-label` (ex.: `MoreHorizontal` no painel Admin).
- **[Baixo]** Modal fecha no clique do backdrop mas não há fechamento por tecla `Esc` nem foco preso (focus trap) dentro do diálogo.
- **[Baixo]** `Empty` sempre renderiza o CTA "Cadastrar RT" mesmo em contextos onde a ação é outra (ex.: portal da empresa).

---

## 8. Plano recomendado (priorizado)

**Bloqueadores (fazer primeiro):**
1. Declarar `role?: string` nas props do `Sidebar` para destravar o build (§3.1).
2. Corrigir `data_acao` → `action_date` na query de ações (§3.2).

**Alto:**
3. Padronizar categorias em slugs no `seed.sql` e alinhar fallback `"outro"` (§4.1, §4.2).
4. Validar o modo Supabase ponta a ponta após as correções (login → dashboard → cadastro de RT → diário).

**Médio:**
5. Definir migrations como fonte única e reduzir/remover `schema.sql` duplicado (§4.3).
6. Extrair componentes de `App.tsx` para `src/components/` e utilitários para `src/lib/`.
7. Substituir métricas hardcoded por dados reais (ou marcar claramente como demo).
8. Fixar `set search_path = ''` nas funções `security definer` (§5).

**Baixo / evolução:**
9. Adotar um router (React Router) para deep-linking e histórico.
10. Adicionar Error Boundary, testes (Vitest + Testing Library) e CI (lint + typecheck + build).
11. Melhorias de a11y: `Esc`/focus trap nos modais, labels em campos de busca.

---

## Apêndice — Comandos de verificação usados

```bash
npx tsc -b --noEmit   # 2 erros em src/App.tsx (prop role)
npm run lint          # limpo
diff supabase/schema.sql supabase/migrations/20260610085000_rtquimica_schema.sql  # idênticos
```

> Nota de curadoria (12/07/2026): `supabase/schema.sql` foi removido (RTQ-6); o `diff` acima já não se aplica. A fonte única passou a ser [supabase/migrations/20260610085000_rtquimica_schema.sql](supabase/migrations/20260610085000_rtquimica_schema.sql).
