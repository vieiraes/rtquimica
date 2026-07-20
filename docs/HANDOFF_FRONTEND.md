# Handoff de Frontend — RTQuímico

> **Para:** equipe de Frontend / UI-UX (geração assistida por IA)
> **De:** time do produto RTQuímico
> **Objetivo:** brief completo e autossuficiente para (re)construir todo o frontend — landing, autenticação, aplicação (dashboard e telas internas), design system, estados e acessibilidade.
> **Como usar:** este documento é a fonte única de verdade do escopo de front. Você pode gerar o código a partir dele sem acesso ao repositório atual. Onde houver "recomendado", trate como melhoria desejável.

---

## 0. TL;DR (o que construir)

Um **SaaS web multi-tenant** chamado **RTQuímico** para **profissionais da Química** gerenciarem suas **Responsabilidades Técnicas (RTs)** perante o CRQ (Conselho Regional de Química): prazos, documentos, conformidade das empresas e registro auditável de ações técnicas.

Entregáveis de front:
1. **Landing page** de marketing (com captação/trial e painel de autenticação).
2. **Autenticação** (login + cadastro).
3. **Aplicação logada** separada em **2 áreas**: Console da Plataforma (Superadmin) e Workspace Técnico (papéis do tenant).
4. **Catálogo fechado de telas** com IDs obrigatórios (ver §4.1 e §5).
5. **Design system** com tema claro/escuro (ver §9).
6. **Responsivo** (desktop → mobile) e **acessível** (WCAG AA).

Tom: **profissional, confiável, "tech de saúde/compliance"** — sério, limpo, com respiro. Idioma: **pt-BR**.

---

## 1. Contexto de produto

**Problema:** o químico responsável técnico precisa controlar múltiplas empresas, documentos (TRT/ART/CRT), prazos de vigência e comunicações obrigatórias ao CRQ — hoje isso vive em planilhas e gera risco de multa/irregularidade.

**Proposta de valor:**
- Centraliza as RTs, prazos e documentos num painel único.
- **Alertas automáticos** (30 e 7 dias antes do vencimento; comunicação pendente ao CRQ).
- **Diário técnico auditável** (registro de visitas, análises, orientações + evidências) que protege o profissional.
- **Checklist de conformidade** e **biblioteca de POPs** (procedimentos).
- Limite de **6 RTs ativas** por profissional (regra do CRQ) exposto na UI.

**Modelo de negócio:** assinatura (plano Profissional ~R$ 79/mês). Trial de 7 dias sem cartão.

---

## 2. Personas & papéis (RBAC)

A plataforma é **multi-tenant**: cada profissional ou assessoria é um `tenant` (workspace) com dados isolados.

| Papel (`app_role`) | Quem é | O que vê/faz no front |
|---|---|---|
| `superadmin` | Dono do SaaS | **Somente Console de Plataforma**: dashboard global, CRUD de tenants, gestão de admins, assinaturas, provisionamento e auditoria operacional. |
| `tenant_admin` | Contratante principal (químico/assessoria) | Workspace técnico completo + administração do próprio tenant (membros e dados da conta). |
| `tenant_member` | Químico atuante | Workspace técnico operacional (RTs, alertas, diário, conformidade, POPs), sem administração do tenant. |
| `tenant_external_client` | Empresa contratante (cliente final) | **Somente leitura** do Portal da empresa (status e documentos compartilhados). |

Regras de visibilidade no front:
- `superadmin` **não navega** em telas técnicas de química por padrão.
- `tenant_admin`/`tenant_member`/`tenant_external_client` **não navegam** no Console da Plataforma.
- O **Portal da empresa** é a visão padrão de `tenant_external_client`.
- Se houver impersonação de tenant para suporte, deve existir estado visual de "modo suporte" + log de auditoria.

**Persona primária (design-for):** *Mariana Vieira, Química Industrial, CRQ-IV (SP)* — atende ~4–6 empresas, foco em não perder prazos e manter registros.

---

## 3. Glossário do domínio (essencial p/ copy e rótulos)

- **RT** — Responsabilidade Técnica: vínculo do profissional com uma empresa.
- **TRT / ART / CRT** — tipos de documento que formalizam a RT.
- **CRQ** — Conselho Regional de Química (regionais: CRQ-II MG, CRQ-III RJ, CRQ-IV SP, etc.).
- **Vigência** — período de validade do documento/RT (data início → fim).
- **Comunicação ao CRQ** — obrigação de comunicar início/fim de RT (prazo ~24h) → gera alerta.
- **POP** — Procedimento Operacional Padrão (modelos editáveis).
- **Conformidade** — % de itens obrigatórios cumpridos por empresa (checklist).
- **Ação técnica** — registro datado no diário (visita, coleta, análise, laudo, orientação, outro).

---

## 4. Arquitetura da informação & navegação

**Shell da aplicação:** sidebar fixa à esquerda (colapsável em mobile) + topbar sticky + área de conteúdo.

### 4.1 Separação obrigatória de shells

1. **Console da Plataforma** (`/platform/*`) — exclusivo de `superadmin`
2. **Workspace Técnico** (`/app/*`) — `tenant_admin`, `tenant_member`, `tenant_external_client`

### 4.2 Navegação por shell

**Console da Plataforma (`superadmin`)**
1. Dashboard da plataforma — `platform_dashboard`
2. Tenants — `platform_tenants`
3. Admins da plataforma — `platform_admins`
4. Assinaturas e billing — `platform_subscriptions`
5. Provisionamento — `platform_provisioning`
6. Auditoria operacional — `platform_audit`
7. Perfil do superadmin — `platform_profile`

**Workspace Técnico (`tenant_admin`/`tenant_member`/`tenant_external_client`)**
1. Visão geral (Dashboard) — `dashboard`
2. Responsabilidades — `rts`
3. Alertas — `alertas` *(badge com contagem de não lidos)*
4. Diário técnico — `acoes`
5. Conformidade — `checklist`
6. Biblioteca de POPs — `pops`
7. Central de FISPQ — `fispq`
8. Portal da empresa — `empresa`
9. Administração do tenant — `tenant_admin_panel` *(somente `tenant_admin`)*
10. Configurações (Perfil) — `perfil`

**Rotas obrigatórias:** usar React Router com deep-linking + histórico.
- Público: `/`, `/entrar`
- Plataforma: `/platform/dashboard`, `/platform/tenants`, `/platform/tenants/:id`, `/platform/admins`, `/platform/subscriptions`, `/platform/provisioning`, `/platform/audit`, `/platform/profile`
- Tenant: `/app/dashboard`, `/app/rts`, `/app/rts/:id`, `/app/alertas`, `/app/acoes`, `/app/checklist`, `/app/pops`, `/app/fispq`, `/app/fispq/:id`, `/app/empresa`, `/app/admin`, `/app/perfil`

### 4.3 Catálogo obrigatório de telas (escopo fechado)

Esta lista define **exatamente** as telas a desenhar e implementar no frontend.

| ID | Tela | Rota | Papel | Obrigatória |
|---|---|---|---|---|
| PUB-01 | Landing | `/` | público | Sim |
| PUB-02 | Autenticação | `/entrar` | público | Sim |
| PLT-01 | Dashboard da plataforma | `/platform/dashboard` | `superadmin` | Sim |
| PLT-02 | CRUD de tenants (lista) | `/platform/tenants` | `superadmin` | Sim |
| PLT-03 | Tenant detalhe/edição | `/platform/tenants/:id` | `superadmin` | Sim |
| PLT-04 | CRUD de admins da plataforma | `/platform/admins` | `superadmin` | Sim |
| PLT-05 | Assinaturas e billing | `/platform/subscriptions` | `superadmin` | Sim |
| PLT-06 | Provisionamento de instâncias | `/platform/provisioning` | `superadmin` | Sim |
| PLT-07 | Auditoria operacional | `/platform/audit` | `superadmin` | Sim |
| PLT-08 | Perfil do superadmin | `/platform/profile` | `superadmin` | Sim |
| APP-01 | Dashboard técnico | `/app/dashboard` | `tenant_admin`, `tenant_member` | Sim |
| APP-02 | Responsabilidades técnicas | `/app/rts` | `tenant_admin`, `tenant_member` | Sim |
| APP-03 | Alertas | `/app/alertas` | `tenant_admin`, `tenant_member` | Sim |
| APP-04 | Diário técnico | `/app/acoes` | `tenant_admin`, `tenant_member` | Sim |
| APP-05 | Conformidade | `/app/checklist` | `tenant_admin`, `tenant_member` | Sim |
| APP-06 | Biblioteca de POPs | `/app/pops` | `tenant_admin`, `tenant_member` | Sim |
| APP-07 | Portal da empresa | `/app/empresa` | `tenant_external_client` (foco) | Sim |
| APP-08 | Administração do tenant | `/app/admin` | `tenant_admin` | Sim |
| APP-09 | Perfil do usuário | `/app/perfil` | `tenant_admin`, `tenant_member`, `tenant_external_client` | Sim |
| APP-10 | Central de FISPQ (lista) | `/app/fispq` | `tenant_admin`, `tenant_member` | Sim |
| APP-11 | FISPQ detalhe e versões | `/app/fispq/:id` | `tenant_admin`, `tenant_member` | Sim |

**Modais obrigatórios:**
- MOD-01 Nova RT
- MOD-02 Registrar ação técnica
- MOD-03 Personalizar POP
- MOD-04 Provisionar tenant / ativar-desativar assinatura
- MOD-05 Publicar versão de FISPQ

---

## 5. Especificação das telas

> Para cada tela: **objetivo**, **conteúdo/blocos**, **ações** e **estados** (loading/vazio/erro).

### 5.1 Landing page (`/`)
- **Objetivo:** converter visitante em trial.
- **Blocos:**
  - **Nav** (marca RTQuímico, links âncora: Benefícios, Planos, Segurança; toggle de tema; botões "Entrar" e "Teste grátis").
  - **Hero** split: à esquerda copy + CTA + *trust row* (Alertas automáticos • Até 6 empresas • Registros auditáveis) + **card de autenticação** (ver 5.2); à direita **mockup do painel** (janela com preview do dashboard + cards flutuantes "Dados protegidos / RLS por usuário" e "Prazo monitorado / 18 dias restantes" + elementos decorativos de "molécula").
  - **Benefícios** (3 cards com ícone): Antecipe os prazos / Documente sua atuação / Veja tudo em um lugar.
  - **CTA final** (bloco azul destacado, plano + botão).
  - **Footer** (marca, tagline, copyright).
- **Estados:** estática. Respeita tema claro/escuro.

### 5.2 Autenticação (card na landing / `/entrar`)
- **Objetivo:** login e cadastro.
- **Conteúdo:** abas **Criar conta | Entrar**.
  - *Criar conta:* Nome completo, **Número CRQ**, E-mail, Senha (mín. 6).
  - *Entrar:* E-mail, Senha.
  - Botão primário ("Criar e entrar" / "Entrar no painel") com estado *loading* ("Conectando...").
  - Link/nota: cadastro cria o perfil via trigger no banco.
- **Estados:** loading (submit), erro (mensagem do provider), sucesso (redireciona ao dashboard). Há um **modo demo** (sem backend) — botão "Abrir demo" quando o Supabase não está configurado.

### 5.3 Console da Plataforma (`/platform/*`) — apenas `superadmin`

#### 5.3.1 PLT-01 Dashboard da plataforma (`/platform/dashboard`)
- **Objetivo:** visão executiva do SaaS.
- **Conteúdo:** tenants ativos/inativos, MRR, churn, trials ativos, taxa de ativação, fila de provisionamento.
- **Ações:** filtrar período, abrir tenant, abrir assinatura.

#### 5.3.2 PLT-02 + PLT-03 Tenants (`/platform/tenants`, `/platform/tenants/:id`)
- **Objetivo:** administrar clientes (tenants).
- **Conteúdo:** tabela com status, plano, admins, data de criação; tela detalhe com abas "Dados", "Admins", "Assinatura", "Provisionamento".
- **Ações:** criar/editar tenant, ativar/desativar, trocar plano, bloquear/desbloquear, reprovisionar.

#### 5.3.3 PLT-04 Admins da plataforma (`/platform/admins`)
- **Objetivo:** gerenciar operadores da plataforma.
- **Conteúdo:** lista com papel interno, último acesso e status.
- **Ações:** criar admin, alterar papel, revogar acesso, resetar convite.

#### 5.3.4 PLT-05 Assinaturas (`/platform/subscriptions`)
- **Objetivo:** acompanhar ciclo comercial.
- **Conteúdo:** lista de assinaturas com plano, status (`trial`, `active`, `past_due`, `canceled`), próximas cobranças.
- **Ações:** ativar, pausar, cancelar, reativar, registrar observação operacional.

#### 5.3.5 PLT-06 Provisionamento (`/platform/provisioning`)
- **Objetivo:** acompanhar e operar criação/configuração de instâncias.
- **Conteúdo:** fila de jobs, duração, sucesso/falha, motivo do erro, tentativas.
- **Ações:** iniciar provisionamento, retry, cancelar job, abrir detalhe técnico do job.

#### 5.3.6 PLT-07 Auditoria operacional (`/platform/audit`)
- **Objetivo:** rastreabilidade das ações de plataforma.
- **Conteúdo:** timeline de eventos com operador, ação, alvo, timestamp, resultado.
- **Ações:** filtrar por tenant/evento/período, exportar CSV.

#### 5.3.7 PLT-08 Perfil superadmin (`/platform/profile`)
- **Objetivo:** preferências e segurança da conta de plataforma.
- **Conteúdo:** perfil, MFA (quando disponível), sessão ativa, preferências de tema/notificação.
- **Ações:** atualizar perfil, encerrar sessões, trocar senha.

### 5.4 Workspace Técnico (`/app/*`) — papéis de tenant

#### 5.4.1 APP-01 Dashboard (`/app/dashboard`)
- **Objetivo:** panorama diário das RTs.
- **Blocos:**
  - **Cabeçalho de página** (eyebrow com data, saudação, subtítulo) + botão primário **Nova RT**.
  - **4 stat cards:** RTs ativas (+ vagas disponíveis), Documentos a vencer (próx. 30 dias), Alertas pendentes (+ prioridade), Conformidade média (%). *Valores derivados dos dados reais.*
  - **Panorama das RTs** (painel largo): "donut" com total + legenda (Ativas / Pendente / Vencidas / Limite disponível) + nota de capacidade (% do limite de 6).
  - **Próximas renovações:** lista ordenada por prazo (bloco de data + empresa + "X dias"); item mais urgente destacado.
  - **Responsabilidades recentes:** 3 linhas resumidas de RT.
  - **Requer atenção:** top 3 alertas não lidos (clicáveis → Alertas).
  - **FAB "Nova RT"** em mobile.
- **Estados:** loading (skeleton/strip "sincronizando"), vazio (sem RTs → CTA cadastrar).

#### 5.4.2 APP-02 Responsabilidades (`/app/rts`)
- **Objetivo:** gerir a carteira de RTs.
- **Conteúdo:** toolbar (busca por empresa + filtros **Todas/Ativa/Pendente/Vencida** + botão Adicionar) → **tabela** com colunas: Empresa (logo+razão social+CNPJ), Documento (tipo+número), Vigência, Conformidade (%+barra), Status (chip), ações (⋯).
- **Ações:** abrir "Nova RT" (MOD-01), ver detalhes (toast/rota `/rts/:id` recomendada).
- **Estados:** vazio ("Nenhuma RT encontrada" + CTA), filtro sem resultado.

#### 5.4.3 APP-03 Alertas (`/app/alertas`)
- **Objetivo:** priorizar prazos/pendências.
- **Conteúdo:** resumo (N pendentes) + **Marcar como lidos**; **lista** de alertas com ícone por **nível** (ver §7): título, texto, tempo, "unread dot". Painel lateral **Preferências**: toggles E-mail, Push, SMS; antecedência 30 dias, lembrete 7 dias.
- **Ações:** marcar 1 ou todos como lidos.
- **Estados:** vazio (sem alertas), todos lidos.

#### 5.4.4 APP-04 Diário técnico (`/app/acoes`)
- **Objetivo:** registrar ações técnicas auditáveis.
- **Conteúdo:** toolbar (busca + período + **Registrar**) → **timeline** de ações (categoria, data/hora, empresa, descrição, nº de evidências/anexos). Card lateral "legal": mensagem de proteção profissional + **Exportar relatório PDF** + contador de ações (30 dias).
- **Ações:** abrir "Registrar ação" (MOD-02).
- **Estados:** vazio (sem registros).

#### 5.4.5 APP-05 Conformidade (`/app/checklist`)
- **Objetivo:** acompanhar itens obrigatórios por empresa.
- **Conteúdo:** seletor de empresa; **score ring** (% conforme); checklist de itens obrigatórios (marcáveis, com prioridade nos pendentes); card **Próximos passos** (sugestões) + "Ver plano de ação".
- **Ações:** marcar/desmarcar itens; salvar revisão (toast).
- **Estados:** progresso 0–100%; mensagem muda conforme ≥80%.

#### 5.4.6 APP-06 Biblioteca de POPs (`/app/pops`)
- **Objetivo:** partir de modelos de procedimento.
- **Conteúdo:** toolbar (busca por título/segmento + "Meus POPs") → **grid de cards** (ícone por tom, segmento, título, descrição, tempo de leitura, "Usar modelo").
- **Ações:** "Usar modelo" → editor (MOD-03).
- **Estados:** busca sem resultado.

#### 5.4.7 APP-07 Portal da empresa (`/app/empresa`)
- **Objetivo:** visão simplificada para a empresa contratante (cliente).
- **Conteúdo:** hero de status ("Regular"), card do responsável técnico (contato), **situação da RT** (documento vigente, dias restantes, barra), **documentos compartilhados** (lista para download).
- **Estados:** sem empresa vinculada → empty state.

#### 5.4.8 APP-08 Administração do tenant (`/app/admin`) — `tenant_admin`
- **Objetivo:** administrar somente o próprio workspace.
- **Conteúdo:** membros, convites pendentes, dados cadastrais do tenant, plano e status da conta.
- **Ações:** convidar/remover membro, alterar perfil de membro, atualizar dados do tenant.

#### 5.4.9 APP-09 Perfil & Configurações (`/app/perfil`)
- **Objetivo:** dados profissionais, plano e preferências.
- **Conteúdo:** card de perfil (avatar, plano atual, próxima cobrança, gerenciar assinatura); formulário de dados profissionais (nome, CRQ, e-mail, telefone, regional, especialidade); seção **Aparência** (toggle modo escuro); salvar.

#### 5.4.10 APP-10 Central de FISPQ (`/app/fispq`)
- **Objetivo:** localizar e gerir fichas de segurança por tenant.
- **Conteúdo:** toolbar com busca e filtros (produto, CAS, fabricante, status, revisão), botão **Nova FISPQ**, tabela/lista com produto, fabricante, versão atual, data de revisão e status.
- **Ações:** criar ficha, editar metadados, enviar para revisão, arquivar.
- **Estados:** vazio com CTA de criação, loading com skeleton e erro com ação de tentar novamente.

#### 5.4.11 APP-11 FISPQ detalhe e versões (`/app/fispq/:id`)
- **Objetivo:** revisar conteúdo, anexos e histórico de versões da ficha.
- **Conteúdo:** cabeçalho com status, metadados e responsável; abas **Seções ABNT**, **Versões**, **Auditoria**, **Arquivos**; painel de compartilhamento para leitura externa.
- **Ações:** criar nova versão, anexar PDF, aprovar publicação (`tenant_admin`), compartilhar para `tenant_external_client`.
- **Estados:** sem versão publicada (rascunho inicial), versão aprovada, versão arquivada.

### Modais
- **MOD-01 Nova RT:** empresa, CNPJ, tipo de documento (TRT/ART/CRT), regional (CRQ-IV/III/II), data de início, data de vigência, observações. Info: ao salvar, cria **alerta de comunicação ao CRQ (24h)**.
- **MOD-02 Registrar ação técnica:** empresa (select das RTs), categoria (Visita técnica/Coleta/Análise/Laudo/Orientação/Outro), descrição, **upload** de fotos/documentos (PDF/JPG/PNG, até 10 MB).
- **MOD-03 Personalizar POP:** título + conteúdo (editor de texto multi-linha) → salvar na biblioteca.
- **MOD-04 Provisionar tenant / assinatura:** ativar/desativar tenant, ativar/pausar/cancelar assinatura, motivo obrigatório e confirmação dupla.
- **MOD-05 Publicar versão de FISPQ:** resumo da versão, confirmação de revisão humana, registro da fonte e justificativa opcional da mudança.

**Padrão de modal:** overlay, foco preso (focus trap), fechar por **Esc** e clique no backdrop, `role="dialog"` + `aria-modal`.

---

## 6. Modelo de dados (para modelar a UI)

> O front consome estas entidades (Postgres/Supabase). Campos-chave abaixo.

- **tenants**: `id`, `name`, `plan` (`basic|pro|enterprise`).
- **profiles**: `id`, `tenant_id`, `role` (`superadmin|tenant_admin|tenant_member|tenant_external_client`), `email`, `name`, `crq_number`, `crq_state`, `phone`, `avatar_url`.
- **subscriptions** (contrato comercial): `tenant_id`, `status`, `plan`, `trial_ends_at`, `current_period_end`.
- **provisioning_jobs** (operação da plataforma): `tenant_id`, `status`, `started_at`, `finished_at`, `error_message`.
- **audit_events** (auditoria operacional): `actor_id`, `tenant_id`, `action`, `target_type`, `target_id`, `metadata`, `created_at`.
- **technical_responsibilities** (RT): `company_name`, `company_cnpj`, `document_type` (`TRT|ART|CRT|other`), `document_number`, `start_date`, `end_date`, `status` (`active|pending|expired|canceled`), `crq_region`, `notes`.
- **documents**: `rt_id`, `name`, `type`, `file_url`.
- **alerts**: `rt_id?`, `type`, `title`, `message`, `is_read`, `created_at`.
- **technical_actions**: `rt_id`, `category` (slug: `visita|coleta|analise|laudo|orientacao|outro`), `description`, `action_date`, `attachments` (jsonb).
- **checklists**: `rt_id`, `status`, `items` (jsonb), `progress` (0–100).
- **sop_templates**: `title`, `segment`, `content`; **globais** quando `tenant_id` é nulo.
- **fispq_documents**: `tenant_id`, `product_name`, `cas_number`, `manufacturer_name`, `status`, `issue_date`, `review_date`, `source_type`, `source_url`, `responsible_profile_id`, `current_version`.
- **fispq_versions**: `fispq_id`, `tenant_id`, `version_number`, `sections_json`, `pdf_path`, `change_summary`, `created_by`, `created_at`.
- **fispq_audit_events**: `fispq_id`, `tenant_id`, `event_type`, `payload`, `actor_profile_id`, `created_at`.

**Mapeamento de status (DB → UI):** `active→Ativa`, `pending→Pendente`, `expired→Vencida`, `canceled→Cancelada`.
**Categoria de ação (slug ↔ rótulo):** `visita→Visita técnica`, `coleta→Coleta`, `analise→Análise`, `laudo→Laudo`, `orientacao→Orientação`, `outro→Outro`.

---

## 7. Regras de negócio que afetam a UI

1. **Limite de 6 RTs ativas** por tenant — mostrar uso ("X de 6"), vagas disponíveis e % do limite.
2. **Alerta automático de comunicação ao CRQ** ao criar/cancelar RT (prazo 24h).
3. **Segregação de domínio por papel (obrigatória):**
  - `superadmin` usa apenas `/platform/*`.
  - Papéis de tenant usam apenas `/app/*`.
  - Qualquer acesso indevido deve redirecionar para tela permitida + mensagem de permissão.
4. **Níveis de alerta (cor/ícone) por tipo:**
   - `vencimento_7` → **danger** (vermelho)
   - `vencimento_30`, `comunicacao_pendente` → **warning** (âmbar)
   - `renovacao` → **success** (verde)
   - demais (`info`, "documento solicitado") → **info** (azul/neutro)
5. **Isolamento por tenant** — o usuário só vê dados do próprio workspace (o back garante via RLS; o front não deve assumir dados de outros tenants).
6. **Ações críticas de plataforma** (desativar tenant, cancelar assinatura, reprovisionar) exigem confirmação dupla + justificativa.
7. **Auditoria obrigatória** para ações administrativas da plataforma e do tenant.
8. **Modo demo** — quando o backend não está configurado, a app roda com dados mockados (útil para preview/design).
9. **FISPQ exige revisão humana para publicar** — versões em rascunho não podem ser expostas como aprovadas.
10. **Compartilhamento externo controlado** — `tenant_external_client` só visualiza fichas explicitamente compartilhadas.

---

## 8. Estados, feedback & microcopy

- **Loading:** faixa/skeleton "Sincronizando dados..." em telas que buscam dados.
- **Vazio:** ilustração/ícone + título + texto + CTA (ex.: "Nenhuma RT encontrada" → "Cadastrar RT").
- **Erro:** toast com mensagem clara; **recomendado** adicionar Error Boundary global e estados de erro persistentes (hoje só há toasts efêmeros).
- **Toast/confirmação:** aparece ao salvar (ex.: "RT cadastrada. Alerta de comunicação criado."), auto-some ~3s, `role="status"`.
- **Tom da copy:** direto, profissional, orientado a prazo/segurança.

---

## 9. Design System

### 9.1 Tokens (CSS custom properties) — tema claro
```
--primary:   #0d3b66   /* azul institucional (marca/CTAs) */
--primary-2: #15558a
--green:     #2d936c   /* sucesso / acento da marca */
--amber:     #f4a261   /* atenção */
--red:       #e76f51   /* perigo / badges */
--blue-soft: #eaf3fa
--surface:   #ffffff   --surface-2: #f7f9fb
--border:    #e3e9ee
--text:      #172534   --muted: #6b7987
--shadow:    0 16px 50px rgba(22,50,76,.08)
fundo app:   #f4f7f9
```
### 9.2 Tokens — tema escuro (`:root[data-theme="dark"]`)
```
texto #e9f0f5   fundo #0f1923
--primary #6da9d7  --primary-2 #82b8df
--surface #17232e  --surface-2 #1c2a36
--border #2b3b48   --text #edf3f7  --muted #9caab5
--blue-soft #203b50  --shadow 0 16px 50px rgba(0,0,0,.2)
```
> Troca de tema via atributo `data-theme` no `<html>` (persistir preferência). `theme-color` do documento: `#0d3b66`.

### 9.3 Tipografia
- **Corpo:** *DM Sans* (400–700).
- **Títulos e marca:** *Manrope* (500–800), com `letter-spacing` negativo em H1 (ex.: `-.045em`) e H1 grande `clamp(42px,5vw,68px)`.

### 9.4 Forma & elevação
- **Raios:** botões/inputs **11px**; cards/painéis **18px**; pílulas **999px**; marca com canto assimétrico (`11px 11px 11px 3px`).
- **Sombra padrão:** `--shadow`. Elevações extras em preview/hover (translateY(-1px) nos botões).
- **Foco visível:** `outline: 3px solid rgba(45,147,108,.28)` (verde) — **manter para acessibilidade**.

### 9.5 Componentes (biblioteca a entregar)
- **Botões:** `primary` (azul, texto branco, sombra), `secondary` (surface + borda), `ghost`, `light` (branco sobre azul), variações `large` e `full`. `icon-button` 40×40.
- **Marca (Brand):** símbolo em gradiente azul (frasco/`FlaskConical`) + "RT**Químico**" (o "Químico" em verde).
- **Sidebar** azul-escuro (`#0c3559`), itens com estado ativo (barra verde à esquerda), badge vermelho de contagem, bloco de limite de RTs, botão sair.
- **Topbar** sticky com busca global (com `⌘K`), toggle de tema, sino de notificações (dot), botão de perfil.
- **Stat card** (ícone tonal + label + valor forte + detalhe).
- **Painel/Panel** com `PanelHeader` (título, subtítulo, ação com chevron).
- **Tabela de RTs** responsiva (vira cards no mobile).
- **Chips de status** (`ativa/pendente/vencida/cancelada`), **pílula** (uppercase, verde), **badge** numérico.
- **Barra de progresso** (trilho + preenchimento verde) e **score ring** (anel percentual via `conic-gradient`).
- **Toggle/switch** (`role="switch"`, `aria-checked`).
- **Campo (Field):** label + input/select/textarea; **Modal** (backdrop + dialog); **Empty state**; **Toast**.
- **Avatares:** iniciais em gradiente verde, tamanhos `small/base/large/xlarge`.
- **Ícones:** biblioteca **lucide-react** (ex.: ShieldCheck, Bell, CalendarClock, ClipboardCheck, FlaskConical, FileText, Building2, Activity, AlertTriangle, etc.).

### 9.6 Ilustração/decibel visual
- Elementos sutis de "química/molécula" (círculos/anéis) e mockup 3D do painel na landing (perspectiva leve). Nada exagerado — clean e corporativo.

---

## 10. Responsividade

- **Desktop (≥1024px):** sidebar fixa 258px + conteúdo (máx. ~1480px).
- **Tablet/mobile (<1024px):** sidebar vira **drawer** (botão de menu na topbar, backdrop, botão fechar); tabelas viram **cards**; grids de painéis colapsam para 1 coluna; **FAB** para ação primária.
- **Breakpoints sugeridos:** 640 / 768 / 1024 / 1280.
- `min-width` do app: 320px.

---

## 11. Acessibilidade (WCAG 2.1 AA — obrigatório)

- **Contraste** mínimo AA em texto e componentes (validar tons `muted` sobre `surface`).
- **Teclado:** tudo operável; ordem de foco lógica; **focus-visible** preservado (anel verde).
- **Modais:** `role="dialog"`, `aria-modal`, `aria-labelledby`, **focus trap**, fechar com **Esc** (hoje falta Esc/trap — implementar).
- **Toggles:** `role="switch"` + `aria-checked`.
- **Ícones-ação:** `aria-label` em todos os botões só-ícone (ex.: ⋯, sino, menu).
- **Busca/inputs:** `label` associado (a busca do header hoje não tem — corrigir).
- **Status dinâmico:** toasts com `aria-live`/`role="status"`.
- **Imagens/decorativos:** `aria-hidden` no que é decorativo (moléculas, mockup).

---

## 12. Stack, restrições & integração

- **Framework:** React **19** + **TypeScript** (strict) + **Vite**.
- **Ícones:** `lucide-react`. **Estilo:** CSS com custom properties (pode migrar para CSS Modules/Tailwind, **desde que preserve os tokens e o tema `data-theme`**).
- **Router:** **adotar React Router** (deep-linking + histórico) — hoje é navegação por estado.
- **Backend:** **Supabase** (Auth por e-mail/senha, Postgres com RLS por tenant, Storage privado para documentos) via `@supabase/supabase-js`.
- **Variáveis de ambiente:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (a *anon key* é pública por design; **nunca** expor `service_role`).
- **Modo demo:** se as envs não existirem, rodar com dados mockados (bom para desenvolvimento de UI sem backend).
- **Qualidade:** `tsc -b` + `eslint` sem erros; **recomendado** Error Boundary + testes (Vitest + Testing Library) + CI.

---

## 13. Fluxos-chave (para prototipar)

1. **Onboarding:** landing → "Teste grátis" → cadastro (nome + CRQ + e-mail + senha) → dashboard vazio → "Nova RT".
2. **Cadastrar RT:** Nova RT (modal) → salva → aparece na lista + **alerta de comunicação ao CRQ** criado → toast.
3. **Registrar ação:** Diário → Registrar (modal) → descrição + evidências → entra na timeline.
4. **Acompanhar prazo:** Dashboard/Alertas destacam vencimentos (7/30 dias) → usuário renova.
5. **Cliente:** Portal da empresa (somente leitura) vê status e documentos.
6. **Superadmin cria tenant:** Console plataforma → Tenants → Criar tenant → Provisionar → status "ativo".
7. **Superadmin gerencia assinatura:** Assinaturas → ativar/pausar/cancelar → evento registrado em auditoria.
8. **Ciclo FISPQ:** Central FISPQ → Nova ficha → Upload/edição → Revisão → Publicar versão → Compartilhar com empresa.

---

## 14. Entregáveis esperados do time de front

1. **Design system** (tokens + componentes) documentado (Storybook recomendado).
2. **Landing** responsiva + **fluxo de auth**.
3. **2 app shells** (Plataforma e Tenant) com roteamento e guardas por papel.
4. **21 telas obrigatórias** (2 públicas + 8 plataforma + 11 tenant) + **5 modais** conforme §4.3 e §5.
5. **Tema claro/escuro** com persistência.
6. **Acessibilidade AA** (checklist §11 atendido).
7. **Integração** com Supabase (auth + leitura/escrita das entidades §6) **ou** camada mockada plugável.
8. **Estados** de loading/vazio/erro em todas as telas.

---

## 15. Fora de escopo / premissas

- Regras de RLS, triggers e segurança do banco são responsabilidade do backend (o front **não** implementa autorização de dados — apenas UX de papéis).
- Geração real de PDF, envio de e-mail/SMS/push e cobrança são integrações futuras — no front, representar como ações/estados.
- Conteúdo jurídico/normativo do CRQ é ilustrativo; validar textos oficiais com o produto.

---

### Apêndice A — Mapa rápido de telas × papéis

| Tela | superadmin | tenant_admin | tenant_member | tenant_external_client |
|---|:--:|:--:|:--:|:--:|
| Dashboard da plataforma | ✔ | – | – | – |
| Tenants (lista + detalhe) | ✔ | – | – | – |
| Admins da plataforma | ✔ | – | – | – |
| Assinaturas | ✔ | – | – | – |
| Provisionamento | ✔ | – | – | – |
| Auditoria operacional | ✔ | – | – | – |
| Perfil superadmin | ✔ | – | – | – |
| Dashboard técnico | – | ✔ | ✔ | – |
| Responsabilidades | – | ✔ | ✔ | – |
| Alertas | – | ✔ | ✔ | – |
| Diário técnico | – | ✔ | ✔ | – |
| Conformidade | – | ✔ | ✔ | – |
| POPs | – | ✔ | ✔ | – |
| Central de FISPQ | – | ✔ | ✔ | – |
| FISPQ detalhe e versões | – | ✔ | ✔ | – |
| Portal da empresa | – | ✔ | ✔ | ✔ (foco) |
| Administração do tenant | – | ✔ | – | – |
| Perfil do usuário | – | ✔ | ✔ | ✔ |

_Documento de handoff — gerado para o time de Frontend do RTQuímico._
