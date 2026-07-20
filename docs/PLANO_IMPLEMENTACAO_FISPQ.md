# Plano de Implementacao FISPQ

> Tipo: Planejamento tecnico para execucao futura
> Status: Proposto
> Data: 13/07/2026
> Fonte normativa base: ABNT NBR 14725 (16 secoes), com evidencia publica consolidada no material da UFU

---

## 1. Analise socratica

### 1.1 Perguntas-chave
- O produto deve emitir FISPQ oficial automaticamente ou apoiar a elaboracao e gestao com revisao humana?
- O primeiro passo de maior valor e busca/organizacao de fichas existentes ou geracao assistida de conteudo?
- Como manter isolamento multi-tenant e, ao mesmo tempo, compartilhar leitura para clientes externos do tenant?
- Quais mudancas sao dificeis de reverter e exigem desenho antecipado (schema, storage, fluxo de aprovacao)?

### 1.2 Respostas com base no contexto atual
- A opcao mais segura para o RTQuimico e atuar como assistente de elaboracao e gestao, nao como emissor juridico automatico.
- O maior ganho inicial esta na centralizacao e rastreabilidade das fichas (catalogo, versao, validade, origem e historico).
- O projeto ja opera em arquitetura multi-tenant com RBAC e RLS; a feature deve seguir o mesmo padrao de isolamento por tenant.
- Mudancas de schema e fluxo de aprovacao sao de impacto medio/alto e devem ser planejadas antes da implementacao.

### 1.3 Trade-offs e riscos
- Geracao automatica sem revisao: mais rapidez, risco juridico alto.
- Geracao assistida com aprovacao obrigatoria: menor risco, maior governanca.
- Importacao inteligente de PDF: produtividade alta, risco de extração incorreta (mitigar com confianca por campo e revisao humana).

### 1.4 Direcao recomendada
- Implementar em fases, iniciando pela Central FISPQ (MVP) e mantendo aprovacao humana obrigatoria para qualquer conteudo assistido.

---

## 2. Objetivo da feature

Disponibilizar uma Central de FISPQ por tenant para:
- cadastrar e localizar fichas por produto, CAS, fabricante e versao;
- armazenar PDF/arquivo com historico e rastreabilidade;
- apoiar elaboracao/revisao das 16 secoes da ABNT NBR 14725;
- compartilhar visualizacao controlada com perfil externo do tenant;
- manter trilha de auditoria para compliance tecnico.

---

## 3. Escopo funcional por fase

## Fase 1 - MVP Central FISPQ (prioridade alta)

### Entregas
- Listagem com busca e filtros por produto, CAS, fabricante, status e vencimento de revisao.
- Cadastro de ficha com metadados minimos:
  - nome do produto
  - CAS
  - fabricante
  - versao
  - data de emissao
  - data de revisao
  - fonte
  - responsavel tecnico
  - status (rascunho, em_revisao, aprovado, arquivado)
- Upload de PDF e anexos tecnicos.
- Versionamento basico de ficha (nova versao sem perda de historico).
- Compartilhamento em leitura para tenant_external_client.

### Fora de escopo da Fase 1
- Geracao de texto por IA.
- Parsing automatico de PDF.
- Publicacao sem aprovacao humana.

## Fase 2 - Assistente de preenchimento (prioridade media)

### Entregas
- Wizard com as 16 secoes da ABNT NBR 14725.
- Sugestoes assistidas para campos textuais com indicacao de fonte.
- Validacoes obrigatorias por secao (completude minima).
- Fluxo de aprovacao por tenant_admin antes da publicacao.

## Fase 3 - Importador inteligente de PDF (prioridade media)

### Entregas
- Extração de secoes do PDF para rascunho estruturado.
- Indicador de confianca por campo extraido.
- Tela de revisao humana antes de salvar como versao valida.
- Comparador entre versoes para facilitar atualizacao regulatoria.

## Fase 4 - Biblioteca colaborativa controlada (opcional)

### Entregas
- Repositorio de modelos compartilhaveis entre tenants (somente se houver governanca formal).
- Moderacao de conteudo e politica de qualidade.

---

## 4. Regras de negocio obrigatorias

- Nunca publicar conteudo assistido sem revisao e aprovacao humana.
- Sempre registrar origem/fonte dos dados por secao.
- Cada tenant acessa apenas os proprios dados (exceto superadmin em visao global).
- tenant_external_client possui acesso somente leitura a fichas compartilhadas.
- Toda mudanca de status e versao precisa gerar auditoria (quem, quando, o que mudou).
- Ficha arquivada permanece consultavel no historico, mas nao editavel.

---

## 5. Modelo de dados sugerido (para implementacao futura)

## 5.1 Tabelas
- fispq_documents
  - id (uuid)
  - tenant_id (uuid)
  - product_name (text)
  - cas_number (text)
  - manufacturer_name (text)
  - current_version (int)
  - status (text)
  - issue_date (date)
  - review_date (date)
  - source_type (text: fabricante, repositório, internet, interno)
  - source_url (text)
  - responsible_profile_id (uuid)
  - created_at, updated_at

- fispq_versions
  - id (uuid)
  - fispq_id (uuid)
  - tenant_id (uuid)
  - version_number (int)
  - sections_json (jsonb)
  - pdf_path (text)
  - extraction_confidence (jsonb, opcional na Fase 3)
  - change_summary (text)
  - created_by (uuid)
  - created_at

- fispq_audit_events
  - id (uuid)
  - tenant_id (uuid)
  - fispq_id (uuid)
  - event_type (text)
  - payload (jsonb)
  - actor_profile_id (uuid)
  - created_at

## 5.2 Storage
- Bucket privado recomendado: fispq-documents
- Estrutura de pasta recomendada: tenant_id/fispq_id/version/file.pdf
- Regras alinhadas ao padrao de isolamento ja usado no projeto.

---

## 6. Permissoes por papel (RBAC)

- superadmin
  - visao global, sem bypass fora das politicas administrativas definidas.
- tenant_admin
  - CRUD completo, aprovacao, arquivamento, compartilhamento.
- tenant_member
  - criar/editar rascunho e enviar para revisao.
- tenant_external_client
  - somente leitura de fichas explicitamente compartilhadas.

---

## 7. Criterios de aceite (MVP)

- Criar, editar, versionar e arquivar FISPQ no tenant sem quebrar RLS.
- Upload e download de PDF funcionando para usuarios autorizados.
- Lista com filtros por produto, CAS, status e revisao.
- Registro de auditoria para eventos criticos (criacao, aprovacao, arquivamento, nova versao).
- tenant_external_client nao consegue editar nem ver fichas nao compartilhadas.
- Fluxo minimo validado: cadastro -> revisao -> aprovacao -> compartilhamento.

---

## 8. Dependencias tecnicas

- Ajustes de schema e migrations Supabase.
- Novas policies RLS para tabelas e storage da feature.
- Componentes de UI para listagem, formulario, wizard e historico.
- Definicao de validacoes obrigatorias por secao ABNT.

---

## 9. Riscos e mitigacoes

- Risco juridico por uso indevido de conteudo assistido.
  - Mitigacao: aprovacao humana obrigatoria + disclaimer + trilha de auditoria.
- Risco de dados incompletos na importacao de PDF.
  - Mitigacao: confianca por campo e revisao obrigatoria.
- Risco de complexidade antecipada no MVP.
  - Mitigacao: limitar MVP a catalogo, versao, arquivo e aprovacao basica.

---

## 10. Backlog inicial sugerido

- FISPQ-1: Modelar tabelas e policies RLS da feature.
- FISPQ-2: Implementar listagem e filtros da Central FISPQ.
- FISPQ-3: Implementar cadastro e edicao de metadados.
- FISPQ-4: Implementar upload/download com bucket privado.
- FISPQ-5: Implementar versionamento basico.
- FISPQ-6: Implementar trilha de auditoria.
- FISPQ-7: Implementar regras de permissao por papel.
- FISPQ-8: Validar fluxo ponta a ponta em tenant real de homologacao.

---

## 11. Decisoes de escopo (registradas)

- A feature sera multi-tenant e seguira o RBAC atual.
- O perfil externo do tenant sera somente leitura.
- O produto nao fara emissao juridica automatica sem revisao humana.
- A implementacao sera faseada para reduzir risco e facilitar entrega incremental.

---

## 12. Historias tecnicas por sprint (proposta inicial)

## Sprint 0 - Fundacao de dados e seguranca (estimativa: 8 pontos)
- ST-01 (3 pts): Criar migration inicial das tabelas `fispq_documents`, `fispq_versions`, `fispq_audit_events` com constraints basicas.
- ST-02 (3 pts): Implementar policies RLS por `tenant_id` e regras por papel (`tenant_admin`, `tenant_member`, `tenant_external_client`).
- ST-03 (2 pts): Criar bucket privado e padrao de caminho `tenant_id/fispq_id/version/file.pdf`.

## Sprint 1 - Central FISPQ MVP (estimativa: 13 pontos)
- ST-04 (3 pts): Construir tela de listagem com busca/filtros por produto, CAS, fabricante, status e revisao.
- ST-05 (3 pts): Construir formulario de cadastro/edicao de metadados da FISPQ.
- ST-06 (3 pts): Implementar upload/download de PDF com controle de acesso por papel.
- ST-07 (2 pts): Implementar fluxo de status (`rascunho`, `em_revisao`, `aprovado`, `arquivado`).
- ST-08 (2 pts): Registrar trilha de auditoria para criacao, aprovacao e arquivamento.

## Sprint 2 - Versionamento e readiness operacional (estimativa: 10 pontos)
- ST-09 (3 pts): Implementar criacao de nova versao sem perda de historico.
- ST-10 (2 pts): Implementar visualizacao de historico de versoes e diff resumido.
- ST-11 (3 pts): Implementar fluxo de compartilhamento em leitura para `tenant_external_client`.
- ST-12 (2 pts): Validar fluxo ponta a ponta em homologacao com cenario multi-tenant.

---

## 13. Sequenciamento de implementacao (ordem obrigatoria)

1. Banco e seguranca primeiro:
   - modelagem de tabelas, indices e constraints
   - policies RLS e regras de storage
2. Contrato de dados e camada de acesso:
   - tipos e payloads esperados no frontend
   - tratamento de erro e estados de carregamento
3. UI principal:
   - listagem e cadastro
   - detalhe e versoes
4. Fluxo de aprovacao e compartilhamento:
   - transicao de status
   - permissao de leitura para perfil externo
5. Homologacao ponta a ponta:
   - testes funcionais por papel
   - validacao de isolamento entre tenants

Justificativa da ordem:
- schema e RLS sao a base de isolamento e compliance; sem isso, as telas podem induzir comportamento incorreto.
- o front deve nascer contra contrato de dados estavel para reduzir retrabalho.

---

## 14. Roteiro de validacao com Produto e Responsavel Tecnico

- Objetivo da validacao: confirmar que o MVP atende operacao real sem risco regulatorio.
- Participantes minimos: Product Owner, representante tecnico (RT), engenharia e UX.
- Checklist da sessao:
  - confirmar campos obrigatorios de cadastro por tipo de empresa/produto
  - confirmar regra de aprovacao humana antes de publicacao
  - confirmar fluxo de consulta pelo perfil externo
  - confirmar mensagens de disclaimer e trilha de auditoria
  - confirmar criterios de arquivamento e reativacao de versao

Resultado esperado:
- documento de decisoes aprovadas e pendencias abertas para a sprint seguinte.

---

## 15. Criterios de homologacao ponta a ponta

- Cenario 1 - tenant_admin cria e aprova FISPQ:
  - deve conseguir criar, anexar PDF, enviar para revisao, aprovar e compartilhar.
- Cenario 2 - tenant_member opera rascunho:
  - deve criar/editar rascunho, mas nao aprovar publicacao final.
- Cenario 3 - tenant_external_client em leitura:
  - deve acessar somente fichas compartilhadas e sem opcoes de edicao.
- Cenario 4 - isolamento multi-tenant:
  - usuario do tenant A nao acessa dados do tenant B.
- Cenario 5 - auditoria:
  - eventos de criacao, mudanca de status, nova versao e arquivamento devem ser registrados.

Critorio de saida para ir a producao:
- 100% dos cenarios acima aprovados em homologacao.

---

Documento preparado para execucao futura e pronto para planejamento de sprint.
