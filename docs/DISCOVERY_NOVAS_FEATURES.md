# Novas Funcionalidades — Visão Técnica & Viabilidade (Discovery)

> **Documento:** discovery técnico / estudo de viabilidade
> **Autor:** Engenharia (a pedido do Produto)
> **Status:** Draft — insumo para priorização (não é compromisso de escopo)
> **Base:** briefing de produto "RTQuímico como o *Sistema Operacional do Responsável Técnico*".
> **Objetivo:** para cada ideia do briefing, responder **como construir**, **com quais APIs/fontes**, **qual o risco** e **qual o esforço** — separando o que é *integração* (API pronta), *curadoria* (montar nossa base) e *produto interno* (lógica nossa).

---

## 0. TL;DR (leitura de 1 minuto)

- **Ganhos rápidos e baratos (integração/pura UI):** Consulta CNPJ (BrasilAPI), Consulta de produtos químicos (PubChem), Calculadoras (frontend puro). Alto valor, baixo custo.
- **Precisam de curadoria própria (não há API pública boa):** Biblioteca de Legislação, "CNAE → exige RT?", Incompatibilidade química, Busca de FISPQ/SDS. Aqui o **dado é o produto** — construir e manter uma base curada é o trabalho real.
- **Precisam de backend/IA (custo recorrente + segurança):** Assistente IA, Diário com IA. Alto engajamento, mas exigem **Edge Functions** (nunca chave no front) e disciplina de custo/precisão.
- **Decisão de arquitetura central:** introduzir uma camada fina de **Supabase Edge Functions** como *proxy + cache + guardião de chaves* para tudo que fala com a web. Sem isso, várias features são inviáveis (CORS, rate limit, segredos).

> **Aposta de ouro técnica** (concordo com o briefing): **Assistente IA + Legislação + FISPQ**. Mas a parte difícil **não é a IA** — é a **base de conhecimento curada** que alimenta a IA (RAG). Sem base boa, a IA "alucina" — e em Química isso é risco de segurança.

---

## 1. Princípios de arquitetura para features externas

Antes das features, o alicerce. Quase tudo aqui depende destes 6 pontos:

1. **Camada de proxy (Supabase Edge Functions):** o frontend **não** chama APIs de terceiros direto. Motivos: (a) **CORS** — várias APIs não liberam browser; (b) **chaves** — nunca expor `service_role`/chaves de LLM no bundle Vite (tudo `VITE_*` é público); (c) **rate limit** — centralizar e controlar; (d) **normalização** — devolver ao front um formato único.
2. **Cache em Postgres:** criar tabelas de cache (ex.: `ext_chem_cache`, `ext_cnpj_cache`) com TTL. Consultas externas são lentas/instáveis e às vezes pagas — cachear reduz custo, latência e dependência de uptime alheio.
3. **Resiliência e fallback:** toda fonte externa pode cair. Definir **degradação graciosa** (ex.: se PubChem falhar, mostrar do cache + aviso "dados podem estar desatualizados").
4. **Licenciamento dos dados:** verificar termos de uso/atribuição de cada fonte (PubChem/NIH é aberto; bases governamentais BR variam; conteúdo de legislação é público mas a **curadoria** é nossa). **Não** redistribuir dado proibido.
5. **LGPD:** CNPJ é dado público de PJ (baixo risco); mas logs de consulta, prompts de IA e uploads exigem cuidado. Nada de PII sensível em prompts de LLM sem base legal.
6. **Responsabilidade técnica do dado (crítico):** dados de **segurança química** (incompatibilidade, GHS, descarte) **não podem ser "chutados"**. Sempre citar a fonte, versionar, e exibir **disclaimer** de que o profissional valida. Erro aqui é risco à vida e risco jurídico ao produto.

---

## 2. Catálogo de features (viabilidade técnica)

> Legenda de **Tipo**: 🔌 Integração (API pronta) · 📚 Curadoria (montar base) · 🧩 Interno (lógica nossa) · 🤖 IA.
> **Esforço**: P (dias) · M (semanas) · G (mês+). **Risco**: baixo/médio/alto.

### 2.1 Consulta de CNPJ 🔌 — *Esforço P · Risco baixo*
**O quê:** ao cadastrar uma RT, preencher automaticamente razão social, endereço, situação cadastral e **CNAEs** a partir do CNPJ.
**Como:** **[BrasilAPI — CNPJ](https://brasilapi.com.br/docs#tag/CNPJ)** (`GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}`), gratuita, sem chave. Fallback: **ReceitaWS**. Chamar via Edge Function + cache `ext_cnpj_cache` (TTL ~30 dias).
**Impacto no schema:** cache de CNPJ; opcionalmente denormalizar CNAE na RT.
**Ganho:** elimina digitação, reduz erro — **quick win** de maior ROI imediato.

### 2.2 Consulta de produtos químicos 🔌 — *Esforço M · Risco médio*
**O quê:** buscar substância por **nome / CAS / fórmula**; retornar fórmula, massa molar, sinônimos, classificação **GHS**.
**Como:**
- **[PubChem PUG-REST](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest)** (NIH, gratuita, sem chave):
  - Propriedades: `…/rest/pug/compound/name/{nome}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`
  - CID por CAS/nome, depois **GHS** via **PUG-View**: `…/rest/pug_view/data/compound/{cid}/JSON?heading=GHS+Classification`
- **[NCI CACTUS — Chemical Identifier Resolver](https://cactus.nci.nih.gov/chemical/structure)** para **conversões** (nome↔CAS↔SMILES↔fórmula): `…/chemical/structure/{input}/{repr}`.
- ⚠️ **ChemIDplus foi descontinuado** pela NLM — os dados migraram para o **PubChem**. Não construir em cima do ChemIDplus.
**Riscos:** rate limit do PubChem (~5 req/s) → **cachear** em `ext_chem_cache`; CACTUS tem **uptime instável** → tratar como *best-effort* com fallback.
**Impacto no schema:** cache de substâncias; possível catálogo próprio de "químicos favoritos" do workspace.

### 2.3 Busca de FISPQ / SDS 📚+🔌 — *Esforço G · Risco alto*
**Realidade honesta:** **não existe** uma API pública única e confiável que devolva a **FISPQ (SDS) oficial** de qualquer produto. FISPQ é documento **do fabricante** (PDF), específico por marca/lote, e no Brasil segue a **ABNT NBR 14725**.
**Como viabilizar (abordagem realista):**
1. Usar **PubChem LCSS/GHS** como camada de **dados de segurança** (perigos, precaução) — não é a FISPQ, mas cobre boa parte da necessidade.
2. Montar um **repositório curado** de links/PDFs de FISPQ por fabricante + upload no Storage do workspace.
3. (Futuro) parceria/base de fornecedores.
**Recomendação:** vender como **"Central de Segurança Química"** (dados GHS do PubChem + repositório de FISPQ do workspace), **não** como "buscador mágico de FISPQ" — para não prometer o que a web não entrega.

### 2.4 CNAE → "exige RT? quais documentos/obrigações?" 📚 — *Esforço M · Risco médio*
**O quê:** dado o CNAE da empresa, dizer se exige RT, quais documentos e obrigações.
**Como:** o **catálogo de CNAE** vem fácil (BrasilAPI/IBGE). Mas o mapeamento **"CNAE → exigência de RT/documentos"** é **conhecimento regulatório nosso** — **não há API**. É uma **tabela curada** (`cnae_regras`) mantida com apoio de especialista do CRQ.
**Valor:** altíssimo e **defensável** (dado proprietário). É um dos maiores diferenciais possíveis.

### 2.5 Biblioteca de Legislação (CFQ/CRQ/ANVISA/MAPA/IBAMA/MTE/PF) 📚 — *Esforço G · Risco médio*
**Realidade honesta:** **não há** API pública unificada de legislação brasileira por órgão. Fontes são sites/DOU heterogêneos.
**Como:** construir uma **base curada** (`legislacao`: órgão, número, ementa, vigência, link oficial, tags) alimentada por: curadoria manual + *scrapers* pontuais + (futuro) ingestão do DOU. Recursos: busca full-text (Postgres `tsvector`), favoritos, e **notificação de mudança** (diff de versões).
**Observação:** essa base é **o combustível do Assistente IA** (2.11) via RAG.

### 2.6 Calendário Regulatório 🧩 — *Esforço M · Risco baixo*
**O quê:** consolidar prazos (renovação de RT, comunicação ao CRQ, licenças, entregas).
**Como:** **100% interno** — deriva das RTs (vigências) + regras do produto + itens manuais. Motor de eventos + as notificações já previstas (30/7 dias). Sem dependência externa.
**Sinergia:** reaproveita o mecanismo de alertas que já é o coração do produto.

### 2.7 Biblioteca de POPs (evolução) 🧩 — *Esforço M · Risco baixo*
**O quê:** POPs **públicos / da comunidade / privados**, templates editáveis e **versionamento**.
**Como:** já existe `sop_templates` (global vs. tenant). Evoluir: adicionar `visibility` (public/community/private), histórico de versões (`sop_versions`), moderação da "comunidade". Tudo interno + RLS.
**Cuidado:** POP "da comunidade" precisa de **moderação** e disclaimer (responsabilidade do autor).

### 2.8 Calculadoras (diluição, molaridade, ppm, pH, estequiometria, conversões) 🧩 — *Esforço P · Risco baixo*
**Como:** **frontend puro**, sem API. Módulo de fórmulas + testes unitários (aqui teste importa: erro de cálculo = erro técnico). Altíssima frequência de uso, custo mínimo → **quick win** de engajamento diário.

### 2.9 Incompatibilidade química 📚 — *Esforço M/G · Risco alto (segurança)*
**O quê:** "posso estocar/misturar A com B?".
**Como:** base curada de **matriz de reatividade**. Referência sólida: **CAMEO Chemicals (NOAA/EPA)** tem dados de reatividade — porém **não** como API REST simples; usar como **fonte para popular nossa tabela** (`chem_incompat`) respeitando licença.
**Crítico:** **disclaimer forte** + fonte citada + validação profissional. Nunca apresentar como verdade absoluta. Este é o item de **maior risco de responsabilidade**.

### 2.10 Gestão de Resíduos Químicos 🧩 — *Esforço M · Risco baixo/médio*
**Como:** feature **interna** (classificação por **ABNT NBR 10004**, armazenamento, descarte, relatórios). Data model próprio (`residuos`, `descartes`) + geração de relatório (PDF). Pouca concorrência tem isso → diferencial.

### 2.11 Assistente IA do Químico 🤖 — *Esforço G · Risco alto (custo/precisão)*
**O quê:** perguntas do tipo "posso armazenar ácido nítrico com NaOH?", "quais documentos para RT de indústria de alimentos?".
**Como (arquitetura recomendada):**
- **LLM via Edge Function** (OpenAI/Anthropic) — **chave só no servidor**, nunca no front.
- **RAG obrigatório:** respostas **ancoradas** na nossa base curada (legislação 2.5, POPs, CNAE-regras 2.4, incompatibilidade 2.9) — com **citação da fonte**. Sem RAG, o modelo inventa (inaceitável em Química).
- **Guardrails:** recusar/《escalar》perguntas de segurança crítica sem fonte; sempre disclaimer.
- **Custo:** controlar com cache de respostas, limites por plano, e modelos menores para tarefas simples.
**Valor:** é o que faz abrir o app todo dia — **mas só funciona bem se 2.4/2.5/2.9 existirem**.

### 2.12 Diário Técnico com IA 🤖 — *Esforço M · Risco médio*
**O quê:** texto livre ("hoje fiz visita técnica…") → IA estrutura **relatório/parecer/ata/PDF**.
**Como:** Edge Function + LLM (chave server-side) sobre os dados da ação técnica já existentes; template de saída + geração de **PDF**. É um bom **primeiro caso de IA** — escopo fechado, baixo risco (não é conselho de segurança, é redação), valor imediato.

---

## 3. Tabela-resumo (priorização técnica)

| # | Feature | Tipo | Fonte/API | Esforço | Risco | Depende de |
|---|---|---|---|---|---|---|
| 2.1 | Consulta CNPJ | 🔌 | BrasilAPI / ReceitaWS | P | baixo | Edge Function |
| 2.8 | Calculadoras | 🧩 | — (front) | P | baixo | — |
| 2.6 | Calendário Regulatório | 🧩 | interno | M | baixo | motor de alertas |
| 2.2 | Consulta químicos | 🔌 | PubChem, CACTUS | M | médio | Edge Function + cache |
| 2.7 | POPs (evolução) | 🧩 | interno | M | baixo | RLS |
| 2.12 | Diário com IA | 🤖 | LLM | M | médio | Edge Function + LLM |
| 2.4 | CNAE → exige RT? | 📚 | curadoria + BrasilAPI | M | médio | especialista CRQ |
| 2.10 | Gestão de resíduos | 🧩 | interno (NBR 10004) | M | médio | — |
| 2.5 | Biblioteca de Legislação | 📚 | curadoria/scrapers | G | médio | curadoria contínua |
| 2.9 | Incompatibilidade química | 📚 | CAMEO → base própria | M/G | **alto** | validação técnica |
| 2.3 | FISPQ/SDS | 📚+🔌 | PubChem GHS + repositório | G | **alto** | curadoria |
| 2.11 | Assistente IA | 🤖 | LLM + RAG | G | **alto** | 2.4/2.5/2.9 prontas |

---

## 4. Roadmap técnico sugerido (viés de viabilidade)

**Fundação (habilitador, fazer antes das externas):**
- Camada de **Edge Functions** (proxy + segredo de chaves) + tabelas de **cache** + padrão de resiliência.

**Onda 1 — Quick wins de alto ROI:**
- 2.1 Consulta CNPJ · 2.8 Calculadoras · 2.6 Calendário Regulatório · 2.7 POPs evoluídos.
- *Por quê:* baixo risco, entregam valor já, e o CNPJ melhora o fluxo core (cadastro de RT).

**Onda 2 — Diferenciais de conhecimento:**
- 2.2 Consulta químicos (PubChem) · 2.12 Diário com IA · início da **curadoria** 2.4 (CNAE→RT) e 2.5 (Legislação).
- *Por quê:* começa a virar "hub"; a curadoria é longa, então **começar cedo**.

**Onda 3 — Aposta de ouro (depende das bases curadas):**
- 2.11 Assistente IA (RAG sobre 2.4/2.5) · 2.9 Incompatibilidade · 2.3 Central de Segurança/FISPQ · 2.10 Resíduos.

---

## 5. Riscos transversais & mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| APIs gratuitas caem / mudam / limitam | Alto | Proxy + **cache** + fallback + monitor de saúde. |
| Dado de segurança errado (incompat./GHS) | **Crítico** (vida/jurídico) | Fonte citada, versionamento, **disclaimer**, validação profissional. |
| Custo de LLM cresce sem controle | Médio | Cache de respostas, limites por plano, modelos menores, RAG enxuto. |
| Curadoria não escala (legislação/CNAE) | Alto | Tratar **curadoria como produto** (equipe/processo), não como "carga inicial". |
| Chaves vazadas no front | **Crítico** (segurança) | **Nunca** chave em `VITE_*`; tudo em Edge Function. |
| Licenciamento de fontes | Médio | Revisar termos (PubChem ok; CAMEO/gov revisar); atribuição correta. |
| Prometer "buscador de FISPQ" | Médio (reputação) | Reposicionar como "Central de Segurança" (dados GHS + repositório). |

---

## 6. Recomendação de engenharia

1. **Construir a fundação primeiro** (Edge Functions + cache). Ela destrava metade do briefing.
2. **Entregar a Onda 1** (CNPJ, Calculadoras, Calendário, POPs) — valor rápido, risco baixo, prova de conceito da nova arquitetura.
3. **Começar a curadoria cedo** (CNAE→RT e Legislação) — é o ativo **defensável** e o combustível da IA; leva tempo.
4. **IA só depois da base** — Diário com IA (Onda 2, baixo risco) valida o pipeline; Assistente IA (Onda 3) só brilha com RAG sobre dados curados.
5. **Tratar dado de segurança com rigor de produto crítico** — fonte, versão, disclaimer sempre.

> **Síntese:** a IA é a vitrine, mas o **fosso competitivo** é a **base de conhecimento curada** (CNAE→RT, Legislação, Incompatibilidade). É nela que o RTQuímico deixa de ser "gestor de RT" e vira o **hub operacional do químico** — difícil de copiar.

---

## 7. Próximos passos (spikes/POCs propostos)

- **Spike A (2 dias):** Edge Function proxy + cache consultando **BrasilAPI CNPJ** ponta a ponta (valida a fundação).
- **Spike B (2 dias):** PubChem — buscar por nome/CAS e extrair GHS de 10 substâncias comuns (valida viabilidade e rate limit).
- **Spike C (3 dias):** Diário com IA — Edge Function + LLM gerando 1 relatório em PDF a partir de uma ação técnica (valida pipeline de IA sem risco de segurança).
- **Discovery de curadoria:** dimensionar esforço de manter Legislação + CNAE→RT com um especialista do CRQ.

---

_Documento de discovery técnico — RTQuímico. Insumo para a reunião de produto; não representa compromisso de escopo até priorização._
