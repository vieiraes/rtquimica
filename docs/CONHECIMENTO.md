# Conhecimento do Projeto: RTQuímico

Este documento consolida o entendimento sobre a arquitetura, as tecnologias, as funcionalidades e as regras de negócio do projeto **RTQuímico**. A aplicação foi refatorada para um modelo **SaaS Multi-tenant**.

## 1. Visão Geral
O **RTQuímico** é uma plataforma SaaS B2B/B2C voltada para a gestão de **Responsabilidades Técnicas (RTs)** de profissionais da Química. Seu principal objetivo é fornecer um painel centralizado para controle de prazos, conformidade das empresas, documentações e registros de ações técnicas.

A plataforma opera em arquitetura **Multi-tenant**, o que significa que atende tanto profissionais autônomos (que são seus próprios Tenants) quanto Empresas de Assessoria (que podem ter vários membros trabalhando no mesmo Tenant), com isolamento rigoroso de dados.

## 2. Tecnologias Utilizadas
- **Frontend**:
  - React 19 (Tipado com TypeScript).
  - Vite como empacotador (bundler).
  - CSS Vanilla (`styles.css`), suportando Dark/Light mode com `data-theme`.
  - Ícones da biblioteca `lucide-react`.
- **Backend / Infraestrutura**:
  - **Supabase Local** (em desenvolvimento).
  - Controle de Acesso Baseado em Regras (RBAC) suportado nativamente pelo Postgres.
  - Banco de dados inteiramente modelado em **inglês**.

## 3. Arquitetura Multi-tenant e RBAC
O sistema utiliza um design de banco de dados voltado para isolamento por `tenant_id`. Cada cliente ou empresa de assessoria possui um `tenant`, e os `profiles` dos usuários são atrelados a esse workspace.

### Papéis do Sistema (`app_role`):
- `superadmin`: Dono do sistema SaaS. Tem acesso global a todos os Tenants, gere faturamento e pode visualizar qualquer dado na plataforma.
- `tenant_admin`: O contratante principal do software. Tem permissão para visualizar todas as informações do próprio workspace e gerenciar assinaturas ou convites de membros.
- `tenant_member`: O químico atuante. Pode registrar informações e ações no workspace, mas sem privilégios administrativos dentro do Tenant.
- `tenant_client`: A empresa que recebe a RT (cliente final). Terá acesso de apenas-leitura a um portal dedicado para ver relatórios.

### Estrutura de Código Central
- `src/main.tsx`: Ponto de inicialização.
- `src/App.tsx`: Centralizador da aplicação. Possui rotas internas, estados globais e as consultas (Supabase JS) já adaptadas para buscar o `tenant_id` e exibir painéis condicionalmente (ex: a aba "Administração" é protegida para `superadmin` ou `tenant_admin`).
- `src/types.ts`: Tipagens dos dados mapeados. As queries recebem tabelas em inglês (ex: `technical_responsibilities`) e as mapeiam para as interfaces utilizadas no Frontend.

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
Para operar corretamente no modo local, o projeto utiliza um servidor MCP do Supabase injetado em escopo de projeto. Há um arquivo `.vscode/mcp.json` na raiz configurado para se conectar à porta `54321` (banco local do Supabase), restringindo a ação e análise do Supabase especificamente a este repositório sem afetar ambientes globais.
