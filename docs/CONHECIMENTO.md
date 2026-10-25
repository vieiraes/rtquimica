# Conhecimento do Projeto: RTQuímico

Este documento consolida o entendimento sobre a arquitetura, as tecnologias, as funcionalidades e as regras de negócio do projeto **RTQuímico**. A aplicação foi refatorada para um modelo **SaaS Multi-tenant**.

## 1. Visão Geral
O **RTQuímico** é uma plataforma SaaS B2B/B2C voltada para a gestão de **Responsabilidades Técnicas (RTs)** de profissionais da Química. Seu principal objetivo é fornecer um painel centralizado para controle de prazos, conformidade das empresas, documentações e registros de ações técnicas.

A plataforma opera em arquitetura **Multi-tenant**, o que significa que atende tanto profissionais autônomos (que são seus próprios Tenants) quanto Empresas de Assessoria (que podem ter vários membros trabalhando no mesmo Tenant), com isolamento rigoroso de dados.

## 2. Tecnologias Utilizadas
- **Frontend**:
  - React 19 (Tipado com TypeScript).
  - Vite como empacotador (bundler).
  - CSS Vanilla (`styles.css`), só tema claro.
  - Ícones da biblioteca `lucide-react`.
- **Backend / Infraestrutura**:
  - **Supabase** (Auth + Postgres com RLS + Storage). **Decisão (12/07/2026):** abandonar o modo **local** (Supabase CLI) como ~~fonte principal de desenvolvimento~~ e adotar o **Supabase remoto (Cloud)** como ambiente de referência — ver [BOARD_CODE_REVIEW.md](BOARD_CODE_REVIEW.md) RTQ-4. **Pendente:** o projeto remoto ainda não foi criado/linkado (sem `supabase link`/`db push` executados; `supabase/config.toml` só define o projeto local); até lá, a validação ponta a ponta segue bloqueada.
  - Controle de Acesso Baseado em Regras (RBAC) suportado nativamente pelo Postgres.
  - Banco de dados inteiramente modelado em **inglês**.
- **Versionamento**:
  - Projeto versionado em Git e publicado no GitHub (`git@github.com:vieiraes/rtquimica.git`, branch `main`).

## 3. Arquitetura Multi-tenant e RBAC
O sistema utiliza um design de banco de dados voltado para isolamento por `tenant_id`. Cada cliente ou empresa de assessoria possui um `tenant`, e os `profiles` dos usuários são atrelados a esse workspace.

### Papéis do Sistema (`app_role`):
- `superadmin`: Gestão do produto RTQuímico (não é químico). Na tela vê só os usuários e escritórios da plataforma (`/plataforma`), com contagem de RTs, sem abrir o conteúdo delas. O RLS ainda lhe dá leitura global (para suporte).
- `tenant_admin`: O contratante principal do software. Tem permissão para visualizar todas as informações do próprio workspace e gerenciar assinaturas ou convites de membros.
- `tenant_member`: O químico atuante. Pode registrar informações e ações no workspace, mas sem privilégios administrativos dentro do Tenant.
- `tenant_external_client`: A empresa que recebe a RT (cliente final). Terá acesso de apenas-leitura a um portal dedicado para ver relatórios.

### Estrutura de Código Central
Após a modularização (RTQ-7), o `App.tsx` deixou de ser um monólito (~1.154 → ~365 linhas) e passou a orquestrar componentes/utilitários extraídos:
- `src/main.tsx`: Ponto de inicialização.
- `src/App.tsx`: Centralizador da aplicação (rotas internas por estado, estados globais e as consultas Supabase JS adaptadas ao `tenant_id`, com painéis condicionais por papel definidos em `src/lib/papeis.ts` — ex.: `/plataforma` só para `superadmin`, `/equipe` só para `tenant_admin`).
- `src/types.ts`: Tipagens dos dados mapeados e payloads de formulário (ex.: `technical_responsibilities` mapeadas para as interfaces do Frontend).
- `src/lib/format.ts` e `src/lib/mappers.ts`: utilitários de formatação e mapeadores DB↔UI (`mapRt`, `mapAlert`, `mapAction`, categorias).
- `src/lib/supabase.ts`: cliente Supabase e flag `isSupabaseConfigured` (alterna entre mock e backend real).
- `src/components/primitives.tsx`: primitivos de UI (`Brand`, `Field`, `Modal`, `PanelHeader`, `Toggle`, `Empty`).
- `src/components/modals.tsx`: modais (`NewRtModal`, `NewActionModal`, `PopModal`).
- `src/components/layout.tsx`: `Sidebar`, `Header`, `PageHeading`.
- `src/components/landing.tsx`: `Landing` e `AuthPanel`.
- `src/components/pages.tsx`: páginas (`Dashboard`, `Responsibilities`, `Alerts`, `TechnicalDiary`, `Compliance`, `Pops`, `CompanyPortal`, `Admin`, `Profile`).

> As métricas do `Dashboard` são derivadas de dados reais (RTQ-8): documentos a vencer, conformidade média, vencidas e próximas renovações — não mais valores hardcoded.

## 4. Modelagem de Dados e Regras (Supabase)
Toda a modelagem foi migrada para nomenclatura em **inglês**. O banco adota fortemente RLS e Triggers:

### Tabelas Principais (Esquema SaaS)
- `tenants`: Representa a empresa de consultoria ou químico assinante (Workspace).
- `profiles`: Extensão do `auth.users`, liga o usuário ao `tenant_id` e a uma `role`.
- `technical_responsibilities` (Antiga `rts`): Registro das empresas sob responsabilidade técnica.
- `technical_actions`: Diário técnico para registro de atividades (visita, análise, coleta, orientação).
- `alerts`: Notificações do sistema para o usuário.
- `checklists` e `documents`: Conformidade e arquivos enviados.
- `sop_templates`: Modelos de Procedimento Operacional Padrão. Modelos globais (da plataforma) têm `tenant_id` nulo.

### Regras de Negócio e Triggers (SQL)
- **Criação Automática de Workspace**: A trigger `handle_new_user` intercepta registros via Auth. Se não houver um `tenant_id` no meta-dado (ex: num convite), um novo registro na tabela `tenants` é automaticamente criado para o usuário.
- **Limite de Atuação (Até 6 RTs)**: A trigger `enforce_active_rt_limit` bloqueia a marcação de uma `technical_responsibility` para `active` se o `tenant` já possuir 6 ativas (limite do CRQ).
- **Segurança (RLS)**: O Row Level Security baseia-se em funções utilitárias (`current_user_tenant()` e `current_user_role()`) para garantir que queries comuns no Frontend sempre devolvam apenas dados do Workspace pertencente ao usuário logado, exceto para o `superadmin` que sobrepõe a regra.

## 5. Ferramentas e Integração do Agente (MCP)
O projeto pode utilizar um servidor MCP do Supabase injetado em escopo de projeto, via `.vscode/mcp.json` na raiz, restringindo a ação e análise do Supabase especificamente a este repositório sem afetar ambientes globais.

> **Atenção — portas locais (drift):** o `supabase/config.toml` foi realocado das portas padrão (`543xx`) para a faixa **`553xx`** (api `55321`, db `55322`, studio `55323`). O `.vscode/mcp.json` ainda aponta para `http://127.0.0.1:54321/mcp` (porta antiga) e está **desalinhado** com o `config.toml`. Como a decisão é migrar a operação para o **Supabase remoto** (ver §2, projeto remoto ainda não criado/linkado), o MCP local tende a ficar obsoleto; **pendência para o owner**: alinhar o `mcp.json` (55321) ou remover a integração local em favor do remoto — e, antes disso, criar/linkar o projeto remoto (RTQ-4).
