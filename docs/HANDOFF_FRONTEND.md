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
3. **Aplicação logada** com 9 telas + 3 modais (ver §5).
4. **Design system** com tema claro/escuro (ver §9).
5. **Responsivo** (desktop → mobile) e **acessível** (WCAG AA).

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
| `superadmin` | Dono do SaaS | Painel administrativo global (métricas, usuários, receita). Vê tudo. |
| `tenant_admin` | Contratante principal (químico/assessoria) | Todo o workspace + acesso ao painel **Administração** + assinatura. |
| `tenant_member` | Químico atuante | Registra RTs, ações, checklist — sem administração. |
| `tenant_client` | Empresa contratante (cliente final) | **Somente leitura** de um **Portal da empresa** (documentos, status da RT). |

Regras de visibilidade no front:
- O item de menu **Administração** só aparece para `superadmin` ou `tenant_admin`.
- O **Portal da empresa** é a visão simplificada para `tenant_client`.

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

**Navegação (sidebar) — grupo "GESTÃO":**
1. Visão geral (Dashboard) — `dashboard`
2. Responsabilidades — `rts`
3. Alertas — `alertas` *(badge com contagem de não lidos)*
4. Diário técnico — `acoes`
5. Conformidade — `checklist`
6. Biblioteca de POPs — `pops`
7. Portal da empresa — `empresa`

**Grupo "SISTEMA":**
8. Administração — `admin` *(condicional ao papel)*
9. Configurações (Perfil) — `perfil`

**Rotas (recomendado):** hoje a navegação é por estado interno; **recomenda-se React Router** com deep-linking (ex.: `/app/dashboard`, `/app/rts`, `/app/rts/:id`) + histórico do navegador. Landing e auth em `/` e `/entrar`.

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

### 5.3 Dashboard (`dashboard`)
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

### 5.4 Responsabilidades (`rts`)
- **Objetivo:** gerir a carteira de RTs.
- **Conteúdo:** toolbar (busca por empresa + filtros **Todas/Ativa/Pendente/Vencida** + botão Adicionar) → **tabela** com colunas: Empresa (logo+razão social+CNPJ), Documento (tipo+número), Vigência, Conformidade (%+barra), Status (chip), ações (⋯).
- **Ações:** abrir "Nova RT" (modal 5.10), ver detalhes (toast/rota `/rts/:id` recomendada).
- **Estados:** vazio ("Nenhuma RT encontrada" + CTA), filtro sem resultado.

### 5.5 Alertas (`alertas`)
- **Objetivo:** priorizar prazos/pendências.
- **Conteúdo:** resumo (N pendentes) + **Marcar como lidos**; **lista** de alertas com ícone por **nível** (ver §7): título, texto, tempo, "unread dot". Painel lateral **Preferências**: toggles E-mail, Push, SMS; antecedência 30 dias, lembrete 7 dias.
- **Ações:** marcar 1 ou todos como lidos.
- **Estados:** vazio (sem alertas), todos lidos.

### 5.6 Diário técnico (`acoes`)
- **Objetivo:** registrar ações técnicas auditáveis.
- **Conteúdo:** toolbar (busca + período + **Registrar**) → **timeline** de ações (categoria, data/hora, empresa, descrição, nº de evidências/anexos). Card lateral "legal": mensagem de proteção profissional + **Exportar relatório PDF** + contador de ações (30 dias).
- **Ações:** abrir "Registrar ação" (modal 5.11).
- **Estados:** vazio (sem registros).

### 5.7 Conformidade (`checklist`)
- **Objetivo:** acompanhar itens obrigatórios por empresa.
- **Conteúdo:** seletor de empresa; **score ring** (% conforme); checklist de itens obrigatórios (marcáveis, com prioridade nos pendentes); card **Próximos passos** (sugestões) + "Ver plano de ação".
- **Ações:** marcar/desmarcar itens; salvar revisão (toast).
- **Estados:** progresso 0–100%; mensagem muda conforme ≥80%.

### 5.8 Biblioteca de POPs (`pops`)
- **Objetivo:** partir de modelos de procedimento.
- **Conteúdo:** toolbar (busca por título/segmento + "Meus POPs") → **grid de cards** (ícone por tom, segmento, título, descrição, tempo de leitura, "Usar modelo").
- **Ações:** "Usar modelo" → editor (modal 5.12).
- **Estados:** busca sem resultado.

### 5.9 Portal da empresa (`empresa`)
- **Objetivo:** visão simplificada para a empresa contratante (cliente).
- **Conteúdo:** hero de status ("Regular"), card do responsável técnico (contato), **situação da RT** (documento vigente, dias restantes, barra), **documentos compartilhados** (lista para download).
- **Estados:** sem empresa vinculada → empty state.

### 5.10 Administração (`admin`) — condicional
- **Objetivo:** visão do dono do SaaS.
- **Conteúdo:** 4 stat cards (Usuários ativos, RTs cadastradas, Receita mensal, Taxa de renovação) + tabela de usuários recentes (nome, registro, plano, status).
- **Acesso:** só `superadmin`/`tenant_admin`.

### 5.11 Perfil & Configurações (`perfil`)
- **Objetivo:** dados profissionais, plano e preferências.
- **Conteúdo:** card de perfil (avatar, plano atual, próxima cobrança, gerenciar assinatura); formulário de dados profissionais (nome, CRQ, e-mail, telefone, regional, especialidade); seção **Aparência** (toggle modo escuro); salvar.

### Modais
- **5.10-M Nova RT:** empresa, CNPJ, tipo de documento (TRT/ART/CRT), regional (CRQ-IV/III/II), data de início, data de vigência, observações. Info: ao salvar, cria **alerta de comunicação ao CRQ (24h)**.
- **5.11-M Registrar ação técnica:** empresa (select das RTs), categoria (Visita técnica/Coleta/Análise/Laudo/Orientação/Outro), descrição, **upload** de fotos/documentos (PDF/JPG/PNG, até 10 MB).
- **5.12-M Personalizar POP:** título + conteúdo (editor de texto multi-linha) → salvar na biblioteca.

**Padrão de modal:** overlay, foco preso (focus trap), fechar por **Esc** e clique no backdrop, `role="dialog"` + `aria-modal`.

---

## 6. Modelo de dados (para modelar a UI)

> O front consome estas entidades (Postgres/Supabase). Campos-chave abaixo.

- **tenants**: `id`, `name`, `plan` (`basic|pro|enterprise`).
- **profiles**: `id`, `tenant_id`, `role` (`superadmin|tenant_admin|tenant_member|tenant_client`), `email`, `name`, `crq_number`, `crq_state`, `phone`, `avatar_url`.
- **technical_responsibilities** (RT): `company_name`, `company_cnpj`, `document_type` (`TRT|ART|CRT|other`), `document_number`, `start_date`, `end_date`, `status` (`active|pending|expired|canceled`), `crq_region`, `notes`.
- **documents**: `rt_id`, `name`, `type`, `file_url`.
- **alerts**: `rt_id?`, `type`, `title`, `message`, `is_read`, `created_at`.
- **technical_actions**: `rt_id`, `category` (slug: `visita|coleta|analise|laudo|orientacao|outro`), `description`, `action_date`, `attachments` (jsonb).
- **checklists**: `rt_id`, `status`, `items` (jsonb), `progress` (0–100).
- **sop_templates**: `title`, `segment`, `content`; **globais** quando `tenant_id` é nulo.

**Mapeamento de status (DB → UI):** `active→Ativa`, `pending→Pendente`, `expired→Vencida`, `canceled→Cancelada`.
**Categoria de ação (slug ↔ rótulo):** `visita→Visita técnica`, `coleta→Coleta`, `analise→Análise`, `laudo→Laudo`, `orientacao→Orientação`, `outro→Outro`.

---

## 7. Regras de negócio que afetam a UI

1. **Limite de 6 RTs ativas** por tenant — mostrar uso ("X de 6"), vagas disponíveis e % do limite.
2. **Alerta automático de comunicação ao CRQ** ao criar/cancelar RT (prazo 24h).
3. **Níveis de alerta (cor/ícone) por tipo:**
   - `vencimento_7` → **danger** (vermelho)
   - `vencimento_30`, `comunicacao_pendente` → **warning** (âmbar)
   - `renovacao` → **success** (verde)
   - demais (`info`, "documento solicitado") → **info** (azul/neutro)
4. **Isolamento por tenant** — o usuário só vê dados do próprio workspace (o back garante via RLS; o front não deve assumir dados de outros tenants).
5. **Modo demo** — quando o backend não está configurado, a app roda com dados mockados (útil para preview/design).

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

---

## 14. Entregáveis esperados do time de front

1. **Design system** (tokens + componentes) documentado (Storybook recomendado).
2. **Landing** responsiva + **fluxo de auth**.
3. **App shell** (sidebar + topbar) + **9 telas** + **3 modais** conforme §5.
4. **Tema claro/escuro** com persistência.
5. **Acessibilidade AA** (checklist §11 atendido).
6. **Integração** com Supabase (auth + leitura/escrita das entidades §6) **ou** camada mockada plugável.
7. **Estados** de loading/vazio/erro em todas as telas.

---

## 15. Fora de escopo / premissas

- Regras de RLS, triggers e segurança do banco são responsabilidade do backend (o front **não** implementa autorização de dados — apenas UX de papéis).
- Geração real de PDF, envio de e-mail/SMS/push e cobrança são integrações futuras — no front, representar como ações/estados.
- Conteúdo jurídico/normativo do CRQ é ilustrativo; validar textos oficiais com o produto.

---

### Apêndice A — Mapa rápido de telas × papéis

| Tela | superadmin | tenant_admin | tenant_member | tenant_client |
|---|:--:|:--:|:--:|:--:|
| Dashboard | ✔ | ✔ | ✔ | – |
| Responsabilidades | ✔ | ✔ | ✔ | – |
| Alertas | ✔ | ✔ | ✔ | – |
| Diário técnico | ✔ | ✔ | ✔ | – |
| Conformidade | ✔ | ✔ | ✔ | – |
| POPs | ✔ | ✔ | ✔ | – |
| Portal da empresa | ✔ | ✔ | ✔ | ✔ (foco) |
| Administração | ✔ | ✔ | – | – |
| Perfil | ✔ | ✔ | ✔ | ✔ |

_Documento de handoff — gerado para o time de Frontend do RTQuímico._
