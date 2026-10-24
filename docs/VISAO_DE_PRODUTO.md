# Visão de Produto & Regras de Negócio — RTQuímico

> **Documento:** Visão de Produto & Regras de Negócio (VP+RN)
> **Autor:** Product Owner Sênior — RTQuímico
> **Público:** Diretoria / Comitê de Produto / Stakeholders / Investidores
> **Status:** Draft
> **Data:** 12/07/2026
>
> _Documento executivo, autossuficiente para a diretoria compreender o produto sem consultar outros artefatos. Todas as regras de negócio são derivadas de evidência real no código (migrations em `supabase/` e lógica em `src/`)._

---

## 1. Sumário Executivo

O **RTQuímico** é uma plataforma SaaS multi-tenant que resolve uma dor cara, recorrente e regulada do profissional da Química: **gerir Responsabilidades Técnicas (RTs) perante o CRQ (Conselho Regional de Química) sem perder prazos e sem ficar sem prova de diligência**. Hoje esse controle vive em planilhas, e-mails e memória — um modelo que expõe o profissional a multas, advertências e risco à habilitação.

O **problema de negócio** é de compliance com impacto financeiro e reputacional direto: cada prazo perdido ou comunicação omitida ao CRQ pode virar autuação. A **oportunidade** é um mercado pulverizado, sem ferramenta dedicada, com dor aguda e clara disposição a pagar — porque o custo de **uma única multa evitada** supera meses de assinatura.

O **diferencial** do RTQuímico é ser um **motor de prazos + trilha de auditoria específico do domínio do CRQ**, e não um repositório passivo de arquivos. O produto age proativamente: monitora vigências, dispara alertas antecipados (30 e 7 dias) e **gera automaticamente o alerta de comunicação obrigatória ao CRQ** ao iniciar ou encerrar uma RT. Toda atuação técnica é registrada em um **diário auditável** que protege o profissional em fiscalizações.

A base técnica já está construída e validada: arquitetura **multi-tenant com isolamento rígido por RLS**, provisionamento automático de workspace no cadastro, limite regulatório de **6 RTs ativas** aplicado no banco, storage privado por tenant e um painel funcional com nove telas.

**Pedido à liderança:** aprovar a priorização do núcleo (gestão de RT + alertas automáticos + diário auditável) como **MVP comercializável** e liberar investimento na camada de **notificações externas (e-mail/push)** e na **geração de evidências em PDF** — os dois vetores que convertem a proposta de valor "à prova de esquecimento" em receita recorrente.

---

## 2. Contexto do Negócio

### Cenário Atual (AS IS)
- O químico responsável técnico assume, por lei, a RT de uma ou mais empresas, com obrigações de prazo (vigência de documentos, comunicação ao CRQ, comprovação de diligência).
- O controle é feito em **planilhas, e-mail e memória**, de forma manual e fragmentada.
- Não há ferramenta dedicada de mercado; o profissional depende de disciplina individual para não perder prazos.
- A prova de atuação (o que foi visitado, analisado, orientado) é dispersa e difícil de reconstituir em uma fiscalização.

### Cenário Futuro (TO BE)
- As RTs, prazos, documentos e ações vivem em um **painel único e centralizado**.
- O sistema **age proativamente**: alerta antes do vencimento e cria automaticamente a obrigação de comunicação ao CRQ.
- Cada ação técnica é registrada em um **diário auditável** que serve de prova de diligência.
- Assessorias operam múltiplos profissionais no mesmo workspace, com **isolamento de dados** entre clientes.
- A empresa contratante acompanha o status por um **portal somente leitura**.

---

## 3. Problema de Negócio

| Dimensão | Descrição |
|---|---|
| **Dor** | Controle manual de prazos e obrigações da RT; risco constante de esquecer vencimentos e a comunicação obrigatória ao CRQ. |
| **Impacto financeiro** | Multas e advertências do CRQ; custo de defesa em processos; perda de contratos por irregularidade. |
| **Impacto operacional** | Sobrecarga cognitiva que cresce com o nº de empresas atendidas; retrabalho para reconstituir histórico de atuação. |
| **Risco de não fazer** | Manter o status quo perpetua a exposição a autuações e limita a capacidade do profissional de escalar sua carteira com segurança. |

---

## 4. Oportunidade de Mercado

| Dimensão | Descrição |
|---|---|
| **Mercado** | Profissionais da Química habilitados no CRQ (autônomos) e assessorias que gerenciam RT de múltiplas empresas — segmento pulverizado e sem solução dedicada. |
| **Oportunidade** | Ser a primeira ferramenta especializada em gestão de RT, capturando um comportamento hoje disperso em planilhas. |
| **Potencial financeiro** | Assinatura recorrente (plano Profissional na faixa de ~R$ 79/mês) com expansão natural para assessorias (múltiplos membros por workspace). O ROI para o cliente é imediato: uma multa evitada paga meses de uso. |
| **Diferenciação** | Motor de prazos + trilha de auditoria específicos do domínio do CRQ; proatividade e proteção profissional, não apenas armazenamento. |

---

## 5. Objetivos Estratégicos

| Objetivo | Resultado Esperado | Indicador |
|---|---|---|
| Eliminar a perda de prazos de RT | Profissionais cumprem 100% das obrigações no prazo | % de prazos cumpridos no prazo (North Star) > 98% |
| Tornar toda atuação técnica comprovável | Diário auditável adotado como rotina | Nº médio de ações técnicas registradas / RT / mês |
| Converter dor de compliance em receita recorrente | Base de assinantes pagantes crescente | Conversão trial→pago > 25% |
| Escalar para assessorias | Workspaces com múltiplos membros | % de workspaces com > 1 membro ativo |
| Consolidar confiança e segurança dos dados | Isolamento e sigilo percebidos como diferencial | Churn mensal < 4% |

---

## 6. Visão do Produto

- **Propósito:** proteger o profissional da Química, garantindo que nenhuma obrigação da Responsabilidade Técnica seja perdida.
- **Missão:** transformar o controle manual da RT em um fluxo assistido, proativo e à prova de esquecimento.
- **Visão de Futuro:** ser a plataforma de referência para gestão de responsabilidade técnica no Brasil, do autônomo à assessoria.
- **North Star:** *nenhum prazo de RT perdido e toda atuação técnica comprovável.*
- **Proposta de Valor:** centralizar RTs, prazos, documentos e ações, agindo proativamente (alerta/lembra) e mantendo evidência auditável que protege o profissional.
- **Diferenciais Competitivos:**
  1. **Proativo, não passivo** — o sistema avisa antes do problema.
  2. **À prova de esquecimento** — o caminho fácil é o caminho correto.
  3. **Auditável por padrão** — todo registro serve como evidência.
  4. **Isolamento e confiança** — dados de cada workspace são estanques.
  5. **Kit de Defesa em Fiscalização** *(proposta — ver §13.7)* — não apenas gerar um PDF genérico, mas empacotar linha do tempo de ações técnicas, documentos vigentes e histórico de comunicações ao CRQ em um export único, pronto para o profissional entregar a um auditor no momento da fiscalização.

---

## 7. Público-Alvo e Personas

**Público Primário:** químicos/técnicos que exercem RT como autônomos.
**Público Secundário:** assessorias que gerenciam a RT de várias empresas (múltiplos membros no mesmo workspace).
**Beneficiário final:** as empresas contratantes, que ganham um portal de acompanhamento.

### Personas

| Atributo | Persona Primária |
|---|---|
| **Nome** | Mariana Vieira |
| **Cargo** | Química Industrial — CRQ-IV (SP) |
| **Responsabilidades** | Atende de 4 a 6 empresas; controla documentos (TRT/ART/CRT), vigências e comunicações ao CRQ. |
| **Dores** | Medo de perder prazos; falta de prova de atuação em fiscalização; sobrecarga com múltiplas empresas. |
| **Objetivos** | Não perder nenhum prazo; manter registros auditáveis; escalar a carteira com segurança. |
| **Benefícios** | Alertas antecipados, diário auditável, checklist de conformidade e visão única da carteira. |

| Atributo | Persona Secundária |
|---|---|
| **Nome** | Ricardo Alves |
| **Cargo** | Sócio de assessoria em compliance químico |
| **Responsabilidades** | Coordena vários químicos que atendem dezenas de empresas em um único workspace. |
| **Dores** | Padronizar procedimentos, acompanhar produtividade da equipe e evitar falhas de comunicação ao CRQ. |
| **Objetivos** | Escalar operação com controle e reduzir risco regulatório da carteira. |
| **Benefícios** | Workspace multi-membro, POPs padronizados e visão consolidada de conformidade. |

| Atributo | Persona Beneficiária |
|---|---|
| **Nome** | Contato de qualidade da empresa contratante |
| **Cargo** | Responsável pela conformidade na indústria cliente |
| **Responsabilidades** | Acompanhar a situação da RT contratada e ter acesso a documentos vigentes. |
| **Dores** | Falta de visibilidade sobre o status e os documentos da própria RT. |
| **Objetivos** | Confirmar que a empresa está regular perante o CRQ. |
| **Benefícios** | Portal somente leitura com status, responsável técnico e documentos compartilhados. |

---

## 8. Stakeholders

| Stakeholder | Área | Interesse | Impacto |
|---|---|---|---|
| Diretoria / Comitê de Produto | Estratégia | Retorno do investimento e diferenciação de mercado | Alto |
| Product Owner | Produto | Priorização do MVP e evolução do roadmap | Alto |
| Time de Engenharia | Tecnologia | Viabilidade técnica, segurança e escalabilidade | Alto |
| Profissionais da Química (clientes) | Uso | Não perder prazos e comprovar diligência | Alto |
| Assessorias | Uso / Expansão | Operar múltiplos profissionais com controle | Médio |
| Empresas contratantes | Beneficiário | Transparência sobre a RT contratada | Médio |
| CRQ (órgão regulador) | Regulatório | Cumprimento das obrigações legais | Indireto / Alto contexto |

---

## 9. Escopo do Produto

### Dentro do Escopo
- Cadastro e gestão de Responsabilidades Técnicas (empresa, CNPJ, documento, vigência, regional).
- Limite de 6 RTs ativas por workspace, exposto na UI.
- Alertas automáticos: comunicação ao CRQ (criação/cancelamento) e vencimento (30 e 7 dias).
- Diário técnico auditável com evidências (anexos).
- Checklist de conformidade por empresa (0–100%).
- Biblioteca de POPs (globais da plataforma e do workspace).
- Portal somente leitura para a empresa contratante.
- Multi-tenant com RBAC e isolamento por RLS; storage privado por workspace.
- Provisionamento automático de workspace no cadastro; planos e trial.

### Fora do Escopo (nesta fase)
- Integração direta com sistemas do CRQ / envio automatizado da comunicação.
- Assinatura digital de documentos.
- Emissão de notas fiscais / gestão financeira do profissional.
- Aplicativo mobile nativo (a app é web responsiva).
- Camada de notificações externas (e-mail/push/SMS) — **planejada como investimento** (ver §21/§23), hoje há apenas alertas in-app.

---

## 10. Premissas

- O limite de 6 RTs ativas reflete a regra prática do CRQ aplicável ao público-alvo.
- A comunicação ao CRQ tem prazo de ~24h e é responsabilidade do profissional; o sistema gera o alerta, mas não substitui o envio.
- Os profissionais têm disposição a pagar por uma ferramenta que reduza risco de multa.
- Decisão de produto (12/07/2026): adotar o **Supabase remoto (Cloud)** como ambiente de referência e abandonar o modo local via CLI. **Pendente:** o projeto remoto ainda não foi criado/linkado — até a conclusão de `supabase link`/`db push` (RTQ-4), não há ambiente operacional validado ponta a ponta.
- O público aceita operar em uma aplicação web responsiva (sem app nativo no MVP).

---

## 11. Restrições

| Tipo | Restrição |
|---|---|
| **Regulatória** | Obrigações e prazos definidos pelo CRQ; regras podem variar por regional (CRQ-II, III, IV, etc.). |
| **Financeira** | Investimento incremental controlado; monetização por assinatura com trial sem cartão. |
| **Técnica** | Isolamento multi-tenant obrigatório via RLS; storage privado; base de dados modelada em inglês; frontend Vite/React. |
| **Operacional** | Deploy executado pelo owner; migrations versionadas no Supabase CLI, a serem aplicadas no remoto assim que o projeto remoto for criado/linkado (pendente — RTQ-4). |

---

## 12. Dependências

| Dependência | Tipo | Impacto |
|---|---|---|
| Supabase (Auth + Postgres/RLS + Storage) | Infraestrutura | Alto — sustenta autenticação, isolamento e persistência |
| Provedor de e-mail/push (a contratar) | Externa | Alto — habilita notificações fora da aplicação |
| Geração de PDF (a implementar) | Interna | Médio — habilita a evidência exportável |
| Regras e prazos do CRQ por regional | Regulatória | Médio — parametrização e textos precisam de validação |
| Firebase Hosting (deploy) | Infraestrutura | Médio — publicação da aplicação |

---

## 13. Funcionalidades Principais

### 13.1 Gestão de Responsabilidades Técnicas
- **Objetivo:** centralizar a carteira de RTs do profissional.
- **Problema Resolvido:** dispersão em planilhas e perda de controle sobre vigências.
- **Fluxo de Alto Nível:** cadastrar RT (empresa, CNPJ, documento, vigência, regional) → status inicial → acompanhamento na carteira.
- **Valor de Negócio:** visão única e confiável da capacidade e das obrigações.
- **Diferencial:** limite regulatório de 6 RTs ativas aplicado no banco e exposto como "X de 6".

### 13.2 Alertas Automáticos
- **Objetivo:** impedir que prazos e comunicações sejam esquecidos.
- **Problema Resolvido:** dependência da memória do profissional.
- **Fluxo de Alto Nível:** ao criar/cancelar RT → alerta de comunicação ao CRQ; ao aproximar-se do vencimento → alertas de 30 e 7 dias.
- **Valor de Negócio:** o coração da proposta "à prova de esquecimento".
- **Diferencial:** severidade por tipo, priorizando a atenção do usuário.

### 13.3 Diário Técnico Auditável
- **Objetivo:** registrar e comprovar a atuação técnica.
- **Problema Resolvido:** falta de evidência em fiscalizações.
- **Fluxo de Alto Nível:** registrar ação (categoria, descrição, data, anexos) → timeline auditável por empresa.
- **Valor de Negócio:** proteção profissional; base para relatório em PDF.
- **Diferencial:** trilha aditiva e datada, com evidências.

### 13.4 Conformidade por Checklist
- **Objetivo:** medir e direcionar a regularização por empresa.
- **Problema Resolvido:** falta de visão do que ainda falta cumprir.
- **Fluxo de Alto Nível:** checklist de itens obrigatórios → progresso 0–100% → próximos passos.
- **Valor de Negócio:** reduz risco de fiscalização.
- **Diferencial:** score de conformidade por empresa.

### 13.5 Biblioteca de POPs
- **Objetivo:** padronizar procedimentos operacionais.
- **Problema Resolvido:** onboarding lento e falta de padrões.
- **Fluxo de Alto Nível:** partir de POP global → personalizar no workspace.
- **Valor de Negócio:** acelera adoção e agrega valor à assessoria.
- **Diferencial:** POPs globais da plataforma coexistem com POPs do tenant.

### 13.6 Portal da Empresa Contratante
- **Objetivo:** dar transparência ao cliente final.
- **Problema Resolvido:** falta de visibilidade da empresa sobre a própria RT.
- **Fluxo de Alto Nível:** acesso somente leitura → status, responsável técnico e documentos.
- **Valor de Negócio:** fortalece a relação profissional–empresa.
- **Diferencial:** visão dedicada por papel (`tenant_external_client`).

### 13.7 Kit de Defesa em Fiscalização *(proposta — não implementada)*

> **Aviso:** esta funcionalidade **ainda não existe no código**. É uma proposta de produto formalizada em 20/07/2026, sem RN associada no catálogo §15. Nenhuma evidência de `supabase/` ou `src/` deve ser inferida a partir deste item até que haja implementação real.

- **Objetivo:** transformar os dados já coletados hoje (diário técnico, checklist de conformidade e alertas/comunicações ao CRQ) em um único export estruturado, pronto para o profissional apresentar a um auditor do CRQ no momento da fiscalização.
- **Problema Resolvido:** hoje, mesmo com o diário auditável e o checklist funcionando, o profissional fiscalizado não tem uma forma rápida e formatada de reunir "prova de diligência" — teria que montar isso manualmente, sob pressão, no momento da fiscalização.
- **Fluxo de Alto Nível (proposto):** profissional seleciona a RT/empresa fiscalizada → sistema compila linha do tempo de ações técnicas (RN-008), status de documentos vigentes e histórico de comunicações ao CRQ (RN-002) → gera um export único (formato a definir, ex. PDF estruturado) → profissional entrega ao auditor.
- **Valor de Negócio:** é o ponto de conversão mais direto entre "uso diário do produto" e "resultado tangível na hora que mais importa" (a fiscalização) — reforça o North Star de "toda atuação técnica comprovável" com um artefato concreto.
- **Diferencial:** não é um relatório em PDF genérico — é um pacote estruturado combinando três fontes de evidência já existentes no produto (diário, documentos, comunicações), pensado especificamente para o momento de defesa perante o CRQ. É um refinamento mais afiado do investimento em "geração de relatório em PDF" já previsto em §21/§23.
- **Pendência crítica:** o formato do kit precisa de validação com um especialista do CRQ antes de ser posicionado como "prova" com valor jurídico real — sem essa validação, o risco é entregar um PDF bem formatado mas sem força probatória de fato (ver §19).

---

## 14. Jornada de Alto Nível

```
Cliente (Químico)  →  Ação                          →  Processamento (Sistema)                          →  Resultado
─────────────────    ───────────────────────────      ─────────────────────────────────────────────      ──────────────────────────────
Novo usuário       →  Cria conta (nome, CRQ, e-mail) →  Provisiona workspace + perfil admin (trigger)     →  Workspace pronto, sem fricção
Químico            →  Cadastra RT                     →  Valida limite de 6 ativas + gera alerta ao CRQ   →  RT na carteira + comunicação pendente
Sistema            →  Monitora vigência               →  Emite alertas de 30 e 7 dias                      →  Prazo antecipado, risco evitado
Químico            →  Registra ação técnica           →  Grava no diário com anexos                        →  Evidência auditável acumulada
Químico            →  Preenche checklist              →  Calcula progresso 0–100%                          →  Conformidade visível por empresa
Empresa contratante →  Acessa portal                  →  Aplica RLS (somente leitura do tenant)            →  Vê status e documentos da sua RT
```

---

## 15. Regras de Negócio

> Catálogo derivado de evidência real. As triggers, constraints e enums estão em `supabase/migrations/20260610085000_rtquimica_schema.sql`; a lógica de severidade e categorias em `src/lib/mappers.ts` e `src/`.

### RN-001 — Limite de 6 RTs ativas por workspace
- **Objetivo:** respeitar o limite prático do CRQ de responsabilidades ativas simultâneas.
- **Descrição:** um workspace não pode ter mais de 6 RTs com status `active`.
- **Gatilho:** inserção de RT ou atualização de status para `active`.
- **Entradas:** `tenant_id`, `status`.
- **Condições:** já existem 6 RTs `active` no mesmo tenant.
- **Processamento:** a trigger `enforce_active_rt_limit` conta as ativas e bloqueia a 7ª.
- **Saídas:** exceção "Limite de 6 responsabilidades técnicas ativas atingido no Workspace"; UI mostra "X de 6".
- **Exceções:** RTs em `pending`, `expired` ou `canceled` não contam.
- **Criticidade:** Alta.
- **Impacto Financeiro:** evita exposição a irregularidade por excesso de RTs.
- **Impacto Operacional:** define a capacidade máxima do profissional.
- **Impacto Regulatório:** aderência à regra do CRQ.
- **Evidência:** `enforce_active_rt_limit` / trigger `enforce_rt_limit`.

### RN-002 — Alerta automático de comunicação ao CRQ
- **Objetivo:** garantir a comunicação obrigatória ao CRQ ao iniciar/encerrar RT.
- **Descrição:** ao criar uma RT ou ao cancelá-la, o sistema cria um alerta `comunicacao_pendente`.
- **Gatilho:** `INSERT` de RT ou `UPDATE` de status para `canceled` (vindo de outro status).
- **Entradas:** `tenant_id`, `rt_id`, `status`.
- **Condições:** operação de inserção ou transição para `canceled`.
- **Processamento:** a trigger `create_rt_communication_alert` insere o alerta com prazo de ~24h.
- **Saídas:** alerta "Comunicação ao CRQ pendente".
- **Exceções:** demais transições de status não disparam o alerta.
- **Criticidade:** Alta.
- **Impacto Financeiro:** evita multa por omissão de comunicação.
- **Impacto Operacional:** elimina o esquecimento manual.
- **Impacto Regulatório:** cumpre obrigação legal perante o CRQ.
- **Evidência:** `create_rt_communication_alert` / trigger `create_communication_alert`.

### RN-003 — Alertas de vencimento (30 e 7 dias)
- **Objetivo:** antecipar o vencimento da vigência da RT.
- **Descrição:** o sistema sinaliza a aproximação do fim da vigência aos 30 e aos 7 dias.
- **Gatilho:** proximidade da `end_date` da RT.
- **Entradas:** `end_date`, `type` do alerta.
- **Condições:** faltam 30 ou 7 dias para o vencimento.
- **Processamento:** alertas `vencimento_30` e `vencimento_7` classificados por severidade na UI.
- **Saídas:** alerta de atenção (30d) e alerta crítico (7d).
- **Exceções:** RTs já vencidas/canceladas.
- **Criticidade:** Alta.
- **Impacto Financeiro:** evita perda de prazo e autuação.
- **Impacto Operacional:** direciona a renovação a tempo.
- **Impacto Regulatório:** mantém a RT vigente.
- **Evidência:** os tipos `vencimento_30`/`vencimento_7` e a função `alertLevel` (severidade) existem em `src/lib/mappers.ts`, mas **não há nenhum mecanismo de backend que gere esses alertas**. Em `supabase/migrations/20260610085000_rtquimica_schema.sql` só existem duas triggers de alerta: `enforce_active_rt_limit` (RN-001) e `create_rt_communication_alert` (RN-002, que só insere `comunicacao_pendente` em `INSERT`/cancelamento de RT) — não há trigger, `pg_cron` nem edge function que insira `vencimento_30`/`vencimento_7` em `public.alerts` (confirmado por busca em `supabase/migrations/*.sql` por `cron`/`pg_cron`/"edge function": nenhuma ocorrência). O único cálculo de proximidade de vencimento é `daysUntil()` em `src/lib/format.ts`, usado apenas client-side em `src/components/pages.tsx` (`Dashboard`) para exibir contadores/ordenar renovações — roda sob demanda, só quando o usuário abre o Dashboard, e **não persiste nenhum registro em `alerts`**. **Pendência real:** não é "falta canal externo (e-mail/push) para um alerta que já existe internamente" — é que **o alerta em si (o registro `vencimento_30`/`vencimento_7`) nunca é gerado**, nem internamente. Ver questão em aberto correspondente em §19 e leitura complementar em `docs/ANALISE_VIABILIDADE_VISAO_DE_PRODUTO.md`.

### RN-004 — Severidade dos alertas
- **Objetivo:** priorizar a atenção do usuário por criticidade.
- **Descrição:** cada tipo de alerta recebe um nível visual.
- **Gatilho:** renderização do alerta na UI.
- **Entradas:** `type` do alerta.
- **Condições:** mapeamento por tipo.
- **Processamento:** `vencimento_7` → `danger`; `vencimento_30` e `comunicacao_pendente` → `warning`; `renovacao` → `success`; demais → `info`.
- **Saídas:** cor/ícone correspondentes.
- **Exceções:** nenhuma.
- **Criticidade:** Média.
- **Impacto Financeiro:** indireto (reduz risco de ignorar o crítico).
- **Impacto Operacional:** melhora a triagem de prazos.
- **Impacto Regulatório:** indireto.
- **Evidência:** função `alertLevel` em `src/lib/mappers.ts`.

### RN-005 — Tipos de documento
- **Objetivo:** padronizar os documentos que formalizam a RT.
- **Descrição:** documentos aceitos são `TRT`, `ART`, `CRT` e `other`.
- **Gatilho:** cadastro de RT ou documento.
- **Entradas:** `document_type`.
- **Condições:** valor pertencente ao enum.
- **Processamento:** validação pelo enum `document_type`.
- **Saídas:** RT/documento classificado.
- **Exceções:** valores fora do enum são rejeitados.
- **Criticidade:** Média.
- **Impacto Financeiro:** indireto.
- **Impacto Operacional:** padroniza relatórios.
- **Impacto Regulatório:** aderência ao domínio do CRQ.
- **Evidência:** `create type public.document_type as enum ('TRT','ART','CRT','other')`.

### RN-006 — Status da RT
- **Objetivo:** governar o ciclo de vida da RT e as métricas.
- **Descrição:** status possíveis: `active`, `pending`, `expired`, `canceled`.
- **Gatilho:** criação/atualização da RT.
- **Entradas:** `status`.
- **Condições:** valor pertencente ao enum `rt_status`.
- **Processamento:** apenas `active` conta para o limite (RN-001).
- **Saídas:** status mapeado para a UI (Ativa/Pendente/Vencida/Cancelada).
- **Exceções:** nenhuma.
- **Criticidade:** Média.
- **Impacto Financeiro:** indireto.
- **Impacto Operacional:** governa capacidade e métricas.
- **Impacto Regulatório:** reflete a situação da RT.
- **Evidência:** enum `rt_status` e mapeamento `statusToUi` em `src/lib/mappers.ts`.

### RN-007 — Isolamento multi-tenant
- **Objetivo:** garantir sigilo e conformidade entre workspaces.
- **Descrição:** cada usuário só acessa dados do próprio tenant (exceto `superadmin`).
- **Gatilho:** qualquer consulta/escrita nas tabelas do tenant.
- **Entradas:** `tenant_id` do usuário autenticado.
- **Condições:** `tenant_id = current_user_tenant()` ou papel `superadmin`.
- **Processamento:** RLS habilitado em todas as tabelas com policies de isolamento.
- **Saídas:** apenas dados do próprio workspace.
- **Exceções:** `superadmin` tem visão global.
- **Criticidade:** Alta.
- **Impacto Financeiro:** indireto (risco de vazamento/quebra de confiança).
- **Impacto Operacional:** viabiliza o modelo multi-tenant.
- **Impacto Regulatório:** LGPD e sigilo profissional.
- **Evidência:** `enable row level security`, funções `current_user_tenant`/`current_user_role` e policies "Tenant isolation *".

### RN-008 — Diário técnico auditável
- **Objetivo:** manter prova de diligência da atuação técnica.
- **Descrição:** cada ação é datada, vinculada à RT/empresa e pode ter anexos.
- **Gatilho:** registro de ação técnica.
- **Entradas:** `category`, `description`, `action_date`, `attachments`.
- **Condições:** categoria válida (visita/coleta/analise/laudo/orientacao/outro).
- **Processamento:** persistência em `technical_actions` com contagem de evidências.
- **Saídas:** timeline auditável por empresa.
- **Exceções:** nenhuma.
- **Criticidade:** Alta.
- **Impacto Financeiro:** reduz custo de defesa em fiscalização.
- **Impacto Operacional:** organiza o histórico de atuação.
- **Impacto Regulatório:** prova de diligência.
- **Evidência:** tabela `technical_actions`; `categoryToUi`/`mapAction` em `src/lib/mappers.ts`.

### RN-009 — Conformidade por checklist
- **Objetivo:** medir e direcionar a regularização por empresa.
- **Descrição:** cada RT tem um checklist com progresso de 0 a 100%.
- **Gatilho:** atualização de itens do checklist.
- **Entradas:** `items`, `progress`.
- **Condições:** `progress` entre 0 e 100; um checklist por RT.
- **Processamento:** cálculo do progresso e status.
- **Saídas:** score de conformidade e próximos passos.
- **Exceções:** nenhuma.
- **Criticidade:** Média.
- **Impacto Financeiro:** indireto (reduz risco).
- **Impacto Operacional:** direciona a ação de regularização.
- **Impacto Regulatório:** aproxima a empresa da conformidade.
- **Evidência:** tabela `checklists` com `check (progress between 0 and 100)` e `unique (rt_id)`.

### RN-010 — POPs globais vs. do workspace
- **Objetivo:** oferecer procedimentos padronizados e personalizáveis.
- **Descrição:** POPs com `tenant_id` nulo são globais (visíveis a todos); os demais pertencem ao tenant.
- **Gatilho:** consulta/uso de POPs.
- **Entradas:** `tenant_id` do POP.
- **Condições:** `tenant_id is null` (global) ou igual ao do usuário (do workspace).
- **Processamento:** policies de leitura para globais e isolamento para os do tenant.
- **Saídas:** biblioteca combinada de POPs.
- **Exceções:** `superadmin` gerencia todos.
- **Criticidade:** Baixa.
- **Impacto Financeiro:** indireto.
- **Impacto Operacional:** acelera onboarding e padronização.
- **Impacto Regulatório:** indireto.
- **Evidência:** tabela `sop_templates` e policy "Global templates are readable by all".

### RN-011 — Armazenamento privado por workspace
- **Objetivo:** garantir sigilo dos documentos.
- **Descrição:** documentos ficam em bucket privado, acessíveis apenas dentro da pasta do tenant.
- **Gatilho:** upload/leitura de arquivo.
- **Entradas:** `bucket_id`, caminho do arquivo.
- **Condições:** primeira pasta do caminho = `current_user_tenant()`.
- **Processamento:** policies de storage por pasta de tenant.
- **Saídas:** acesso restrito ao próprio workspace.
- **Exceções:** nenhuma (bucket não é público).
- **Criticidade:** Alta.
- **Impacto Financeiro:** indireto (risco de vazamento).
- **Impacto Operacional:** organiza documentos por cliente.
- **Impacto Regulatório:** LGPD e sigilo.
- **Evidência:** bucket `documentos` (`public: false`) e policies `storage_user_folder_*`.

### RN-012 — Planos e trial
- **Objetivo:** monetizar via assinatura com conversão de baixo atrito.
- **Descrição:** planos `basic`, `pro`, `enterprise`; novos workspaces iniciam em `basic`; trial de 7 dias sem cartão.
- **Gatilho:** criação/atualização do tenant.
- **Entradas:** `plan`.
- **Condições:** valor pertencente ao enum `plan_type`.
- **Processamento:** default `basic` no provisionamento; trial gerido no go-to-market.
- **Saídas:** tenant com plano associado.
- **Exceções:** nenhuma.
- **Criticidade:** Média.
- **Impacto Financeiro:** direto (receita recorrente).
- **Impacto Operacional:** define pacotes de valor.
- **Impacto Regulatório:** nenhum.
- **Evidência:** enum `plan_type`; default `'basic'` em `tenants`/`handle_new_user`; trial em `docs/HANDOFF_FRONTEND.md`. **Nota:** a duração do trial (7 dias) é regra comercial documentada, ainda não codificada no schema.

### RN-013 — Provisionamento automático de workspace
- **Objetivo:** onboarding sem fricção.
- **Descrição:** ao criar conta, um workspace é provisionado e o usuário vira `tenant_admin`.
- **Gatilho:** inserção de usuário em `auth.users`.
- **Entradas:** metadados do cadastro (nome, CRQ, role, tenant_id opcional).
- **Condições:** se não houver `tenant_id` nos metadados, cria novo tenant; caso contrário, vincula ao existente (convite).
- **Processamento:** trigger `handle_new_user` cria tenant (plano `basic`) e o perfil.
- **Saídas:** workspace + perfil admin prontos.
- **Exceções:** convites com `tenant_id` não criam novo workspace.
- **Criticidade:** Alta.
- **Impacto Financeiro:** melhora conversão (ativação imediata).
- **Impacto Operacional:** elimina passos manuais.
- **Impacto Regulatório:** nenhum.
- **Evidência:** `handle_new_user` / trigger `on_auth_user_created`.

### RN-014 — Papéis e controle de acesso (RBAC)
- **Objetivo:** definir o que cada papel vê e faz.
- **Descrição:** papéis `superadmin`, `tenant_admin`, `tenant_member`, `tenant_external_client`.
- **Gatilho:** autenticação e renderização de telas/permissões.
- **Entradas:** `role` do perfil.
- **Condições:** papel do usuário autenticado.
- **Processamento:** policies e visibilidade condicional na UI (ex.: aba Administração para `superadmin`/`tenant_admin`).
- **Saídas:** acesso e visibilidade conforme papel.
- **Exceções:** `superadmin` sobrepõe o isolamento.
- **Criticidade:** Alta.
- **Impacto Financeiro:** indireto.
- **Impacto Operacional:** governa colaboração e segurança.
- **Impacto Regulatório:** sigilo e segregação de acesso.
- **Evidência:** enum `app_role`; policies por papel; visibilidade condicional descrita em `docs/CONHECIMENTO.md` e `docs/HANDOFF_FRONTEND.md`.

### Tabela-resumo das Regras de Negócio

| ID | Nome | Área | Criticidade |
|---|---|---|---|
| RN-001 | Limite de 6 RTs ativas | Regulatória / Capacidade | Alta |
| RN-002 | Alerta automático de comunicação ao CRQ | Regulatória / Alertas | Alta |
| RN-003 | Alertas de vencimento (30 e 7 dias) | Alertas | Alta |
| RN-004 | Severidade dos alertas | Experiência / Alertas | Média |
| RN-005 | Tipos de documento | Domínio | Média |
| RN-006 | Status da RT | Domínio / Métricas | Média |
| RN-007 | Isolamento multi-tenant | Segurança | Alta |
| RN-008 | Diário técnico auditável | Compliance | Alta |
| RN-009 | Conformidade por checklist | Compliance | Média |
| RN-010 | POPs globais vs. do workspace | Conteúdo | Baixa |
| RN-011 | Armazenamento privado por workspace | Segurança | Alta |
| RN-012 | Planos e trial | Monetização | Média |
| RN-013 | Provisionamento automático de workspace | Onboarding | Alta |
| RN-014 | Papéis e controle de acesso (RBAC) | Segurança | Alta |

---

## 16. Papéis e Permissões

| Papel | Responsabilidade | Permissões |
|---|---|---|
| `superadmin` | Dono do SaaS | Visão global de todos os tenants, métricas e receita; sobrepõe o isolamento. |
| `tenant_admin` | Contratante principal do workspace | Gerencia workspace, assinatura e membros; acesso à Administração. |
| `tenant_member` | Químico atuante | Registra RTs, ações e conformidade; sem privilégios administrativos. |
| `tenant_external_client` | Empresa contratante | Somente leitura de um portal de acompanhamento. |

---

## 17. Métricas de Sucesso (KPIs)

- **North Star:** % de prazos de RT cumpridos no prazo (meta > 98%).
- **Operacionais:**
  - Ativação: % de novos usuários que cadastram a 1ª RT em ≤ 24h.
  - Engajamento: nº médio de ações técnicas registradas / RT / mês.
  - Proatividade eficaz: % de alertas críticos resolvidos antes do vencimento.
- **Financeiras:**
  - Conversão trial→pago > 25%.
  - Churn mensal < 4%; retenção de logo > 90%.
  - Expansão para assessorias (workspaces com múltiplos membros).
- **de Produto:**
  - NPS > 50.
  - % de RTs com checklist de conformidade ≥ 80%.
- **Metas de referência:** North Star > 98%; conversão > 25%; churn < 4%; NPS > 50.

---

## 18. Decisões de Produto

| Decisão | Justificativa | Impacto |
|---|---|---|
| Priorizar o núcleo (RT + alertas + diário) como MVP | É onde está a proposta de valor e a disposição a pagar | Foco de investimento e go-to-market |
| Aplicar o limite de 6 RTs no banco (trigger) | Garantir a regra do CRQ de forma inviolável | Segurança regulatória |
| Isolamento por RLS em todas as tabelas | Confiança e conformidade (LGPD/sigilo) | Base do modelo multi-tenant |
| Adotar Supabase remoto como ambiente de referência | Simplificar operação e validação (12/07/2026) | Fluxo local via CLI abandonado; projeto remoto ainda não criado/linkado (pendente — RTQ-4) |
| Provisionar workspace automaticamente no cadastro | Reduzir atrito de onboarding | Melhora ativação |
| Trial de 7 dias sem cartão | Aumentar conversão de topo de funil | Estratégia de monetização |
| Priorizar o Kit de Defesa em Fiscalização (§13.7) como reforço/refinamento do investimento em relatório PDF (20/07/2026) | É o maior diferencial ainda não explorado: converte dados já coletados (diário, checklist, comunicações ao CRQ) em prova de diligência pronta para uso em fiscalização — mais afiado que um PDF genérico | Reordena a fila de investimento: o Kit de Defesa passa a competir por prioridade com a camada de notificações externas (e-mail/push) na Fase 1 (ver §21/§23); formato ainda precisa de validação jurídica com especialista do CRQ (ver §19) |

---

## 19. Questões em Aberto

| Pergunta | Responsável | Próximo Passo |
|---|---|---|
| O formato do Kit de Defesa em Fiscalização (§13.7) tem valor jurídico/probatório real perante uma fiscalização do CRQ? | Produto + especialista jurídico/CRQ | Validar o formato do export com um especialista do CRQ antes de posicionar o kit como "prova" — sem essa validação, vira apenas um PDF bem formatado, sem força probatória |
| Qual provedor de e-mail/push para as notificações externas? | Produto + Engenharia | Avaliar opções e custo |
| Como implementar o disparo automático dos alertas de vencimento (RN-003)? Hoje **não existe geração alguma do registro `vencimento_30`/`vencimento_7`** — nem trigger, nem `pg_cron`, nem edge function no backend; o único cálculo (`daysUntil()`) é client-side, sob demanda, só quando o usuário abre o Dashboard, e não persiste nada em `alerts` (evidência em RN-003). A lacuna é mais fundamental do que "falta canal externo (e-mail/push)": falta o próprio motor de disparo temporal interno. | Engenharia | Definir e implementar o mecanismo de disparo (cron/edge function) que insira os registros em `alerts`; leitura complementar em `docs/ANALISE_VIABILIDADE_VISAO_DE_PRODUTO.md` |
| O limite de 6 RTs é por workspace ou por profissional em assessorias? | Produto | Validar regra com especialista do CRQ |
| A comunicação ao CRQ pode ser integrada/automatizada no futuro? | Produto | Investigar viabilidade regulatória |
| A duração do trial (7 dias) será codificada no schema? | Produto + Engenharia | Definir onde reforçar a regra comercial |
| Quando o projeto Supabase remoto (Cloud) será criado e linkado? | Engenharia | Executar `supabase link` + `db push` no remoto e revalidar RTQ-4 ponta a ponta |

---

## 20. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Usuário não confia os dados a um SaaS | Média | Alto | Isolamento por tenant (RN-007), storage privado (RN-011), comunicação clara de segurança |
| Notificações externas não chegam | Média | Alto | Camada de notificação confiável + alertas in-app como fallback; log de entrega |
| Regras do CRQ variam por regional | Média | Médio | Parametrização por regional; validar textos com especialista |
| Baixa adesão ao registro de ações | Média | Médio | Reduzir fricção (registro rápido + upload simples); reforçar o "porquê" (proteção) |
| Feature creep (inflar escopo) | Alta | Médio | Congelar o núcleo como MVP; roadmap disciplinado |
| Dependência de fornecedor (Supabase) | Baixa | Médio | Padrões abertos (Postgres) e portabilidade de dados |

---

## 21. Roadmap

### Fase 1 — MVP (núcleo comercializável)
- **Objetivos:** transformar a proposta de valor em produto vendável.
- **Funcionalidades:** gestão de RT (RN-001, RN-005, RN-006), alertas automáticos (RN-002, RN-003, RN-004), diário auditável (RN-008), isolamento/segurança (RN-007, RN-011, RN-014), provisionamento (RN-013), planos/trial (RN-012) + investimento em **geração de evidências em PDF, priorizando o Kit de Defesa em Fiscalização (§13.7 — proposta, pendente de validação jurídica)** como refinamento desse investimento, e **notificações externas (e-mail/push)** (reordenada para depois na fila, ver decisão de 20/07/2026 em §18).
- **Resultado Esperado:** MVP go-to-market com North Star e conversão trial→pago mensuráveis.

### Fase 2 — Expansão (colaboração e escala)
- **Objetivos:** atender assessorias e ampliar o valor colaborativo.
- **Funcionalidades:** múltiplos membros por workspace, portal do cliente aprimorado, POPs colaborativos (RN-010), conformidade avançada (RN-009).
- **Resultado Esperado:** crescimento da base via assessorias e maior retenção.

### Fase 3 — Escala (inteligência e integrações)
- **Objetivos:** diferenciação por inteligência e integrações.
- **Funcionalidades:** sugestões proativas de conformidade, integrações com CRQ/gov, analytics de risco.
- **Resultado Esperado:** liderança de mercado e barreiras de entrada.

---

## 22. Critérios de Sucesso

- North Star (prazos cumpridos no prazo) > 98% de forma sustentada.
- Conversão trial→pago > 25% e churn mensal < 4%.
- Ativação (1ª RT em ≤ 24h) consolidada como comportamento padrão.
- Adoção do diário técnico como rotina (média crescente de ações/RT/mês).
- Pelo menos uma prova social clara de "multa evitada" atribuível ao produto.

---

## 23. Pedido à Liderança

- **Decisão:** aprovar a Fase 1 (núcleo RT + alertas + diário) como MVP go-to-market.
- **Investimento:** liberar orçamento para a **geração de evidências em PDF**, priorizando dentro dela o **Kit de Defesa em Fiscalização** (§13.7 — proposta formalizada em 20/07/2026, ainda não implementada e pendente de validação com especialista do CRQ), e, na sequência, a **camada de notificações externas (e-mail/push)**.
- **Recursos:** alocar time de produto e engenharia para o núcleo e a parametrização por regional do CRQ.
- **Aprovações esperadas:** validação de duas métricas de sucesso (North Star + conversão trial→pago) como critério de continuidade do investimento.

---

## 24. Glossário

| Termo | Definição |
|---|---|
| RT | Responsabilidade Técnica — vínculo do profissional com uma empresa. |
| CRQ | Conselho Regional de Química — órgão fiscalizador. |
| TRT / ART / CRT | Tipos de documento que formalizam a RT. |
| Vigência | Período de validade do documento/RT (início → fim). |
| Comunicação ao CRQ | Obrigação de comunicar início/fim de RT (prazo ~24h) — gera alerta. |
| POP | Procedimento Operacional Padrão. |
| Tenant / Workspace | Espaço isolado de um cliente (autônomo ou assessoria). |
| RBAC | Controle de acesso baseado em papéis. |
| RLS | Row Level Security — isolamento de dados no Postgres por linha. |
| Trial | Período de teste gratuito (7 dias, sem cartão). |
| North Star | Métrica-guia do produto. |

---

## 25. Aprovações

| Nome | Cargo | Status |
|---|---|---|
| _(a definir)_ | Diretoria / Sponsor | Pendente |
| _(a definir)_ | Comitê de Produto | Pendente |
| _(a definir)_ | Liderança de Engenharia | Pendente |
| _(a definir)_ | Product Owner | Pendente |

---

## Changelog

| Data | Mudança |
|---|---|
| 22/07/2026 | **Correção de evidência em RN-003** (curadoria de documentação): a nota anterior dava a entender que o alerta de vencimento (30/7 dias) já era gerado internamente e só faltava o canal externo (e-mail/push). Confirmado por leitura de código (`supabase/migrations/20260610085000_rtquimica_schema.sql`, `src/lib/format.ts`, `src/components/pages.tsx`) que **não existe geração alguma do registro `vencimento_30`/`vencimento_7`** — nem trigger, nem `pg_cron`, nem edge function; o único cálculo (`daysUntil()`) é client-side, sob demanda, no Dashboard, sem persistência em `alerts`. Questão em aberto (§19) reescrita para refletir essa lacuna mais fundamental. Achado originado em `docs/ANALISE_VIABILIDADE_VISAO_DE_PRODUTO.md` (análise consultiva do par-senior); esta atualização registra apenas o fato/evidência — a decisão de reordenar roadmap/prioridades (§18/§21/§23) permanece pendente de avaliação do owner. |
| 20/07/2026 | Formalizada a proposta **Kit de Defesa em Fiscalização** (§6, §13.7, §18, §19, §21, §23) como diferencial/roadmap — **proposta, ainda sem implementação no código, sem RN associada**. Registrada a decisão de priorizar esse kit como refinamento do investimento em relatório PDF, reordenando a fila em relação às notificações externas (e-mail/push), e a questão em aberto sobre validação jurídica do formato do kit com especialista do CRQ. |
| 12/07/2026 | Versão inicial do documento (Draft). |

---

_Documento de Visão de Produto & Regras de Negócio — RTQuímico. Status: Draft (última atualização: 22/07/2026). Base para decisão de priorização e investimento; regras de negócio derivadas de evidência no código._
