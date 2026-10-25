# FOUNDER_CONTEXT — RTQuímico

> Atualizado em 25/10/2026, a partir do código e dos docs do repositório (`CLAUDE.md`, `docs/COBRANCA_KIWIFY.md`, `docs/GOOGLE_AGENDA.md`, `docs/PLANO_IA.md`, `docs/CONHECIMENTO.md`, `src/lib/papeis.ts`, `src/components/`). Onde não há evidência, está escrito "a confirmar com o Bruno". Análise completa: `docs/REANALISE_PRODUTO_2026-10-25.md`.

## Empresa
- **Nome:** RTQuímico (pasta `rtquimica`; na tela e no site, "RTQuímico").
- **Fundador:** Bruno Vieira, sozinho, ex-QA de uma fintech de pagamentos (desligado em out/2026), começando agora como fundador; sem verba de marketing e precisando gerar receita.
- **Site e app:** https://rtquimico.web.app (Firebase Hosting, projeto `rtquimico`; Supabase de produção `qbmocwoqkqazoclmxmsh`). No ar desde 25/10/2026. Landing na raiz; login em `/entrar` e cadastro em `/criar-conta`.
- **Domínio próprio:** a confirmar com o Bruno (hoje só `rtquimico.web.app`).

## Produto
SaaS multi-tenant para **químicos que são responsáveis técnicos (RT) de empresas** no Brasil. Cada químico titular tem um escritório (tenant) e pode convidar outros químicos para a equipe. Decisão do fundador (24/10/2026): **atender só químicos por agora**; empresa contratante não é cliente nem tem acesso.

Módulos (conferidos no código em 25/10/2026):
- **RTs:** cadastro com consulta pública do CNPJ (BrasilAPI, CNPJ.ws de reserva; grava razão social, CNAE e cidade). Limite de **6 RTs ativas por escritório**, aplicado no banco. "Encerrar RT" muda para cancelada.
- **Comunicação ao CRQ:** texto por modelo (sem IA) no menu ⋮ da RT; marcar como comunicada fecha o alerta e registra no diário com o protocolo. O sistema **não envia nada ao CRQ**.
- **Conformidade:** checklist por RT (6 itens-padrão, editável), com o % na lista de RTs e no painel.
- **Diário técnico:** registro de visitas e ações com anexos (evidências), busca, período, relatório para imprimir/PDF pelo navegador e **"Redigir com IA"** (rascunho a partir da anotação solta).
- **Biblioteca de POPs:** modelos da plataforma e do escritório; **adaptação por IA** do modelo à empresa (rascunho).
- **Radar regulatório:** lê RSS do CFQ (notícias e documentos), CRQ-IV (SP), CONAMA, MMA e Ibama quando alguém abre a página (no máx. a cada 3 h por fonte); lido/não lido; **"Explicar com IA"** (resumo em linguagem simples e quais empresas do químico podem ser afetadas pelo CNAE). Virou destaque "Leitura do dia" em 25/10/2026.
- **Financeiro (pessoal de cada químico):** honorários por empresa, despesas com comprovante e **OCR por foto** (tesseract.js no navegador, só imagem), **carnê-leão** (regras de 2026, com teste do exemplo da Receita), resumo do IR e **guia do IR em PDF** ("onde clicar e o que digitar" no programa da Receita).
- **Google Agenda:** cria a agenda "RTQuímico" no Google do químico com vencimentos de RT (lembretes 28 e 7 dias antes), honorários a receber e prazo do carnê-leão. Ligado em produção, mas o app do Google está em **modo Teste** (só e-mails cadastrados conectam; a conexão expira em 7 dias).
- **Painel e alertas:** dashboard só informativo (números derivados dos dados reais); alertas abertos pelo sino. Alerta de comunicação ao CRQ nasce por trigger no banco.
- **Equipe:** titular convida químico por e-mail (define senha em `/definir-senha`), desativa e reativa.
- **Assinatura:** tela para assinar pela Kiwify (ver Preço).
- **Plataforma (superadmin):** gestão de usuários e escritórios, "Liberar 30 dias". O superadmin não é químico e não abre o conteúdo das RTs.
- **IA:** DeepSeek via Edge Function `ia`; o navegador manda só os dados, o prompt fica no servidor; texto da IA é sempre rascunho. Cota por escritório (padrão em `ai_config`: 60 chamadas/mês e 5/min, teto global de 5 milhões de tokens/mês; valores em produção a confirmar com o Bruno).

**NÃO tem (não prometer):**
- **Alerta de vencimento (30 e 7 dias) gerado pelo sistema e enviado por e-mail.** Não existe motor de disparo (sem `pg_cron` nem função agendada) nem envio de e-mail de alerta. Hoje o vencimento aparece no painel (calculado ao abrir) e na Google Agenda (se o químico conectar). **A landing, a página de login e o card do plano ainda dizem "no painel e no e-mail"**: está errado e precisa ser corrigido.
- **FISPQ como módulo.** Existe só o item "FISPQs disponíveis" no checklist; a Central FISPQ nunca saiu do plano (`docs/PLANO_IMPLEMENTACAO_FISPQ.md`, board parado em 13/07/2026). A landing cita "Conformidade e FISPQ" e a história 3D fala de FISPQ "tambor por tambor": é mais do que o produto entrega.
- **Kit de Defesa em Fiscalização** (pacote diário + documentos + comunicações): proposta de 20/07/2026, não implementada. O que existe é o relatório do diário para imprimir/PDF.
- Envio ou integração com o CRQ; assinatura digital; emissão de nota fiscal.
- **Leitura ao vivo do site do CFQ** (o servidor derrubava a conexão TLS vinda da rede de desenvolvimento em 25/10/2026; não validada) e **Diário Oficial (DOU)** no Radar (depende de conta no INLABS, pendente).
- Radar de outros CRQs: só o CRQ-IV (SP) está nas fontes.
- Portal da empresa contratante e atendimento a empresas (removidos em 24/10/2026).
- Aplicativo nativo (é web responsiva; a landing diz que funciona no navegador do celular).
- Cobrança funcionando (Kiwify desligada), política de privacidade e termos de uso (o site não tem), e-mail transacional em volume (hoje só 2 e-mails por hora, o padrão do Supabase).
- Leitura de PDF no OCR do comprovante; guia do IR conferido com o manual oficial (foi conferido por guias de terceiros).

## Preço
- **Plano único "Profissional": R$ 79/mês por escritório**, com **7 dias grátis sem cartão** (a landing diz "sem cartão"), até 6 RTs ativas, toda a equipe incluída. Fonte: `docs/COBRANCA_KIWIFY.md`, `src/components/landing.tsx`.
- Cobrança pela **Kiwify** (assinatura mensal, webhook `kiwify-webhook`). **Está desligada**: o produto ainda não foi criado na Kiwify e `VITE_KIWIFY_CHECKOUT_URL` está vazio em produção, então ninguém é bloqueado e ninguém paga. Pagamento atrasado tem 5 dias de tolerância; sem pagamento o químico só vê Assinatura e Configurações (os dados ficam guardados).
- Como o trial já conta da criação da conta, quem cria conta hoje terá o teste vencido antes de existir como pagar: **a confirmar com o Bruno** se o trial valerá a partir do dia em que a cobrança ligar.
- Custo variável: chamadas à DeepSeek (limitadas por `ai_config`). Custo por escritório: a confirmar com o Bruno.
- Origem do preço R$ 79: a "faixa de ~R$ 79/mês" do `docs/VISAO_DE_PRODUTO.md` (12/07/2026), sem teste com cliente. Nenhuma validação de disposição a pagar encontrada.

## Estágio
- **No ar desde 25/10/2026**, em https://rtquimico.web.app. Repositório com 8 commits; os 4 últimos são de 24/10/2026 (papéis, financeiro, IA, radar, agenda, cobrança, landing 3D). Vários módulos (financeiro, IA, radar, agenda, cobrança, equipe) nasceram em 24 e 25/10/2026.
- **Usuários reais: nenhum.** Sem cliente, sem piloto, sem pagante, sem métrica de uso. **Receita: zero.**
- **Pendências externas (todas do Bruno):**
  1. **Kiwify:** criar o produto "RTQuímico Profissional" (R$ 79/mês), o webhook e passar o link e o token (passo a passo em `docs/COBRANCA_KIWIFY.md`).
  2. **SMTP próprio:** hoje 2 e-mails por hora (convite de equipe e "esqueci a senha" usam isso).
  3. **Google:** publicar o app (Branding com logo, domínio, **política de privacidade e termos, que o site ainda não tem**) e clicar em Publish app. O escopo `calendar.app.created` aparece como não sensível, o que dispensa a verificação com vídeo (a confirmar no console).
  4. **INLABS:** conta para ler o Diário Oficial.
  5. Secret que falta no Supabase remoto: `KIWIFY_WEBHOOK_SECRET`. Os `GOOGLE_*` constam como gravados em `docs/GOOGLE_AGENDA.md`, mas o `CLAUDE.md` ainda diz que faltam: os dois docs divergem, a confirmar com o Bruno.
- **Docs de produto defasados:** `docs/VISAO_DE_PRODUTO.md` é de 12/07/2026 e ainda descreve portal da empresa contratante, "Kit de Defesa" e notificações externas como investimento; não cita financeiro, IA, radar nem agenda.
- **Riscos de qualidade conhecidos:** `docs/BOARD_CODE_REVIEW.md` (24/10/2026); landing com promessas além do produto (alerta por e-mail, FISPQ).

## Mercado e público (ICP)
- **ICP:** químico (CRQ) que é RT de **uma a seis empresas** e quer controlar prazos, registrar a atuação e organizar honorários e imposto de renda. A persona do documento é "Mariana", química industrial no CRQ-IV (SP) com 4 a 6 empresas; é persona escrita, não entrevistada.
- **Titular com equipe:** químico que coordena outros químicos no mesmo escritório (a antiga persona "assessoria"). Aceito pelo produto, mas sem evidência de demanda.
- **Fora do público por enquanto:** empresas contratantes.
- **Tamanho do mercado:** a confirmar com o Bruno. O repositório não traz número de químicos com RT ativa no Brasil, e a busca que fiz não achou um total de profissionais registrados nos CRQs.
- **Regra de 6 RTs:** o limite "regra do CRQ" vem do `docs/VISAO_DE_PRODUTO.md`; não achei a norma exata e o doc já registra como pendência validar com o CRQ se o limite é por escritório ou por profissional.
- **Norma mexendo:** em 2025 e 2026 o CFQ publicou várias resoluções (por exemplo 332, 334, 339, 340, 342 e 344, achadas em busca na web em 25/10/2026); os textos de comunicação ao CRQ, os tipos TRT/ART/CRT e o prazo de 24 horas do produto precisam ser conferidos contra a norma vigente. A confirmar.

## Concorrência
- **Não citada no repositório.** Nenhum doc traz análise de concorrentes. Substitutos prováveis (hipótese, não verificada com químicos): planilha, e-mail e lembrete no celular (a própria landing cita), agenda do celular, sistemas de gestão e consultorias de SST/ambiental que já controlam licenças e laudos das empresas, e os serviços online dos próprios CRQs.
- IA genérica (ChatGPT, Gemini) concorre com "Redigir com IA" e "Explicar com IA". Contadores e programas de carnê-leão concorrem com o Financeiro.
- Lista de concorrentes reais: a confirmar com o Bruno, depois de conversar com químicos.

## Canais e restrições
- **Canal até hoje:** nenhum. Sem campanha, sem comunidade, sem indicação, sem parceria.
- **Canais possíveis (hipótese, nenhum testado):** conversa direta com químicos que o Bruno conhece (rede pessoal: a confirmar), grupos e comunidades de químicos, CRQs e sindicatos (palestra ou nota), cursos e atualizações técnicas.
- **Restrições:** só o fundador; sem verba de marketing; precisa gerar receita; tempo semanal disponível a partir de novembro: a confirmar com o Bruno. Sem rede de químicos conhecida nos docs: a confirmar.
- **Regras de operação:** deploy só quando o Bruno declarar; produto explícito e passo a passo (onde clicar e o que preencher); tudo que é de órgão oficial vai com caminho exato.

## Situação
- **Maior gargalo:** validação e cobrança. Nenhum químico usou, nenhum disse que paga e a Kiwify está desligada. O produto cresceu muito em dois dias (financeiro, IA, radar, agenda) sem ninguém do público ter visto.
- **Maior risco de confiança:** a landing promete alerta por e-mail e FISPQ que o produto não tem, para um público que lida com norma e prazo.
- **Meta (6 meses):** a confirmar com o Bruno. Proposta na reanálise: 10 químicos testando de verdade, 3 pagando.
