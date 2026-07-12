# Instruções para o Agente Gemini (RTQuímico)

Este arquivo contém as diretrizes e regras fundamentais que o agente de inteligência artificial (Gemini) deve **sempre** seguir ao atuar no repositório `rtquimica`.

## 1. Contexto do Projeto
- O projeto é um SaaS B2B/B2C (Gestão de Responsabilidade Técnica de Química) operando em **Multi-tenant**.
- Frontend: **React 19**, **Vite**, e CSS Vanilla (sem uso de Tailwind ou outros frameworks de estilo).
- Backend: **Supabase** focado em desenvolvimento local via CLI (`npx supabase`).

## 2. Padrões de Modelagem de Banco de Dados
- **INGLÊS OBRIGATÓRIO**: Todas as tabelas, colunas, enums e triggers devem ser escritos obrigatoriamente em inglês (ex: `technical_responsibilities`, `tenant_admin`, `alerts`). **Não use português no Schema do banco de dados.**
- **Tenant Isolation**: Qualquer nova entidade transacional criada no banco DEVE conter a coluna `tenant_id` referenciando `public.tenants(id)`.
- **Custom RLS**: Sempre que criar uma nova tabela, crie políticas RLS considerando as regras de negócio de `tenant_id` e a função utilitária do sistema `public.current_user_role() = 'superadmin'`.

## 3. Padrões de Código (Frontend)
- **Tipagens**: Atualize e mapeie as tipagens em `src/types.ts`. Os retornos das requisições do Supabase no `App.tsx` (que virão em inglês) devem ser convertidos (mapeados) adequadamente para as interfaces TypeScript consumidas pelos componentes visuais, garantindo isolamento da lógica de visualização.
- **Não use Tailwind**: Se precisar estilizar um elemento novo, adicione a respectiva classe no arquivo `src/styles.css`.
- **Gerenciamento de Estado**: Toda a lógica de roteamento é gerida internamente por um estado (`page`) no `App.tsx`.

## 4. Integração com o MCP (Supabase)
- **Escopo Local**: O agente deve utilizar o servidor MCP definido em `.vscode/mcp.json`, apontando estritamente para o ambiente de desenvolvimento local (`127.0.0.1:54321`).
- **NÃO altere projetos de Produção**: Todas as migrações, resets de banco (`supabase db reset`) e execuções de queries SQL (`supabase/migrations/`, `supabase/seed.sql`) devem focar no escopo de *Desenvolvimento Local* a menos que explicitamente solicitado pelo usuário de forma inequívoca.

## 5. Arquivos de Referência
Sempre que precisar consultar a estrutura de papéis (RBAC) ou o relacionamento dos tenants, o agente deve visualizar o `docs/schema.dbml` ou o `docs/CONHECIMENTO.md`.
