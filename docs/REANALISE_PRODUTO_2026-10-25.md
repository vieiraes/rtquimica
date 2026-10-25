# Reanálise de Produto — RTQuímico

> **Feature avaliada:** o produto inteiro, como está no ar em 25/10/2026 (valor, mercado, posicionamento, preço, riscos, o que cortar e o que priorizar).
> **Documentos-fonte:** `CLAUDE.md`, `FOUNDER_CONTEXT.md`, `docs/VISAO_DE_PRODUTO.md`, `docs/ANALISE_VIABILIDADE_VISAO_DE_PRODUTO.md` (22/07/2026), `docs/COBRANCA_KIWIFY.md`, `docs/GOOGLE_AGENDA.md`, `docs/PLANO_IA.md`, `docs/CONHECIMENTO.md`, `src/lib/papeis.ts`, `src/components/*.tsx`, migrations e functions em `supabase/`.
> **Data:** 25/10/2026 00:24
> **Status:** Consultivo (opinião de produto)
> **Regra deste relatório:** só afirmo o que está no código ou nos docs. Benchmark que não conheço está marcado como hipótese. Não há nenhum usuário real, então não há nenhum número de uso, cliente ou receita aqui.

---

## Análise de Viabilidade

### Resumo do que entendi

O RTQuímico é um SaaS para **químicos que são responsáveis técnicos (RT) de empresas**: cadastrar as RTs (até 6 ativas), não perder prazo com o CRQ, registrar a atuação num diário que serve de prova, organizar honorários e imposto de renda, e acompanhar a norma que muda. Desde 24/10/2026 o público é **só o químico** (titular, com equipe opcional); empresa contratante saiu. Está no ar em produção, com plano único de R$ 79/mês por escritório e 7 dias grátis, mas **sem cobrança ligada e sem nenhum usuário real**.

### O que mudou desde a análise de 22/07/2026

| Ponto da análise anterior | Situação em 25/10/2026 | Veredito |
|---|---|---|
| Preocupação 4: "o Supabase Cloud não existe, nada foi validado em produção" | Projeto criado e no ar. Fluxo validado em 24/10 (login, painel, RT, diário, isolamento entre escritórios, superadmin, criação de conta). | **Resolvida.** |
| Preocupações 1 e 2: "o alerta de vencimento (30/7 dias) não existe como motor; só o painel calcula" | Continua sem motor de disparo (sem `pg_cron`, sem função agendada, sem e-mail de alerta). **Mas** a Google Agenda agora cria lembretes 28 e 7 dias antes do vencimento, que chegam ao celular sem o químico abrir o app. | **Parcialmente resolvida**, por um caminho mais barato que o que eu sugeri (Alternativa A, e-mail transacional). Só funciona para quem conectar a agenda, e o app do Google ainda está em modo Teste. |
| Mesma preocupação, lado da comunicação | A landing, a página de login e o card do plano dizem "alertas **no painel e no e-mail**". E-mail de alerta não existe. | **Piorou:** a promessa foi escrita antes do produto. |
| Preocupação 3 e Alternativa B: Kit de Defesa e risco jurídico | Não foi construído. Existe o relatório do diário para imprimir/PDF. Nenhuma conversa com especialista do CRQ registrada. | **Continua válida**, e agora é prioridade baixa. |
| Preocupação 5 e Alternativa C: "não há prova social nem disposição a pagar" | Continua exatamente igual: zero entrevista, zero piloto, zero carta de intenção. O preço de R$ 79 segue sem teste. | **Continua valendo, e é hoje o ponto mais importante.** |
| Público: autônomo + assessoria + empresa contratante (portal) | Só químicos. Portal da empresa removido. Assessoria virou "titular com equipe". | **Mudou, para melhor.** Diminui o escopo e tira o risco de RLS dar a uma empresa todas as RTs do escritório. |
| Escopo: "financeiro do profissional fora do escopo" | Financeiro entrou inteiro: honorários, despesas, OCR de comprovante, carnê-leão, guia do IR em PDF. | **Mudou muito.** É quase um segundo produto dentro do primeiro. |
| Novos módulos | IA (diário, POP, radar), Radar regulatório, Google Agenda, equipe, cobrança Kiwify, landing 3D. | O produto cresceu em largura em dois dias, sem nenhum químico ter visto. |
| Documento de visão (`VISAO_DE_PRODUTO.md`) | Parado em 12/07 (com ajuste de 22/07). Ainda fala de portal da empresa, Kit de Defesa e notificações. | **Defasado.** Não serve mais como referência de escopo. |

**O que continua valendo da análise anterior:** (1) o problema é real e o nicho é pequeno e regulado; (2) o núcleo certo é RT + prazo + diário + conformidade; (3) o Kit de Defesa só entra como "resumo de atuação", nunca como "prova jurídica", sem validar com o CRQ; (4) a pergunta que ninguém respondeu é "o químico paga?".

### O que faz sentido aqui

- **O núcleo está feito e é coerente com a dor.** RT com limite de 6 ativas no banco, alerta de comunicação ao CRQ por trigger, diário com evidências, checklist por RT, isolamento entre escritórios. É o que um químico RT reconheceria como "o meu problema".
- **O Financeiro é a melhor ideia nova do produto, e foi a que menos apareceu na comunicação.** O químico autônomo (que recebe no CPF ou pela empresa) tem uma dor mensal e com data: carnê-leão até o último dia útil do mês, e o IR todo ano. O guia do IR em PDF com "onde clicar e o que digitar" é concreto, útil e difícil de copiar com IA genérica, porque exige a regra e o programa da Receita. Lembrete mensal com data é o que cria hábito. Atenção ao ponto fraco: os nomes das fichas foram conferidos por guias de terceiros, não pelo manual oficial (o `CLAUDE.md` já avisa).
- **A Google Agenda foi a decisão certa para o alerta.** Resolve o "me avise" sem depender de SMTP (hoje 2 e-mails por hora) e vai onde o químico já olha. Escopo `calendar.app.created` (só a agenda que o app criou) é uma boa história de confiança.
- **A IA está desenhada com cuidado:** prompt no servidor, cota e teto de tokens, o navegador só manda dados, texto sempre como rascunho que o químico revisa, nada assinado pela IA. Para um público que assina laudo com o próprio nome, isso é a postura certa.
- **O Radar tem um motivo real para existir.** Em 2025 e 2026 o CFQ publicou várias resoluções que mexem em registro e responsabilidade técnica (a busca que fiz achou as de número 332, 334, 339, 340, 342 e 344). Norma que muda é dor de químico, e "Explicar com IA" com as empresas afetadas pelo CNAE é uma ideia boa de verdade. É a única parte do produto que dá motivo para o químico voltar **sem** ter um prazo vencendo.
- **Tirar a empresa contratante foi decisão madura.** Um cliente por vez, o que o Bruno consegue atender sozinho.
- **O produto está no ar, com produto explícito.** Ter a coisa publicada muda o jogo: agora dá para colocar na frente de uma pessoa.

### O que me preocupa (visão de produto e mercado)

**1. Construiu-se para zero usuários, de novo.** Em dois dias entraram financeiro, IA, radar, agenda, cobrança, equipe e landing 3D. Nenhum químico viu nada disso. O padrão é o mesmo que o próprio fundador já registrou no Kondotec (produto muito à frente do mercado) e no Chef Suite (zero conversão). Cada módulo novo aumenta o custo de manter e o número de promessas a sustentar, sem aumentar a única coisa que falta: **alguém que diga que paga**. Isso é o risco número um, maior que qualquer risco técnico.

**2. A landing promete o que o produto não entrega, para o público que menos perdoa isso.**
- "Alertas de vigência 30 e 7 dias antes... **no painel e no e-mail**": não há envio de e-mail de alerta (landing, login e card do plano).
- "Conformidade **e FISPQ**" e a cena 3D "FISPQ em dia, tambor por tambor": FISPQ é uma linha do checklist; a Central FISPQ nunca saiu do plano.
- Químico RT vive de norma e de assinatura. Uma promessa errada na primeira tela custa a confiança que o produto precisa para guardar o diário dele. Corrigir isso é de graça e urgente.

**3. O produto virou duas coisas e a mensagem ainda é uma só.** A landing vende "gestão de RT sem improviso". O Financeiro e o Radar são outro produto ("o escritório do químico autônomo"). Não sei qual dos dois faz o químico abrir a conta. Sem conversa não tem como saber, e vender as duas ao mesmo tempo dilui as duas. Hipótese minha, a testar: a porta de entrada é o **prazo e o diário**, e o **financeiro + IR é o que segura o químico** (hábito mensal). Pode ser o contrário.

**4. O canal ainda não existe, e este é um mercado difícil de achar por anúncio.** Nicho pequeno, regulado, sem verba de marketing. Não achei nos docs: tamanho do mercado, lista de químicos que o Bruno conheça, comunidade, sindicato ou CRQ de contato. A pergunta mais importante do projeto é **"quantos químicos RT o Bruno consegue colocar em frente do produto nas próximas 3 semanas, falando com eles?"**. Se a resposta for "poucos", o plano é outro (conteúdo, parceria com CRQ ou sindicato, curso). Isso não está nos docs: a confirmar com o Bruno.

**5. Ticket pequeno exige volume.** Aritmética simples: R$ 79 × 10 escritórios = R$ 790/mês; × 60 = R$ 4.740/mês. Para o Bruno "precisar gerar receita", o produto sozinho só vira renda com dezenas de escritórios pagantes, num nicho em que ainda não sei quantos existem. Não é razão para desistir; é razão para escolher o primeiro público com cuidado e não gastar meses antes de testar o preço.

**6. Bloqueios pequenos que travam o que já está pronto.**
- **Política de privacidade e termos de uso não existem no site.** Isso trava a publicação do app no Google (o canal de alerta que substitui o e-mail) e é necessário por LGPD: a IA manda dados para a DeepSeek, fora do Brasil, e o próprio `docs/PLANO_IA.md` diz "avisar nos termos de uso". Sem termos, o químico entrega dados de cliente dele sem saber.
- **Google em modo Teste:** só testadores conectam e a conexão cai a cada 7 dias. Na prática, hoje o único canal de alerta que existe só funciona para o Bruno.
- **SMTP:** 2 e-mails por hora. O convite de equipe e o "esqueci a senha" já dependem disso. Com 3 usuários entrando juntos, o terceiro não recebe.
- **Kiwify desligada:** o produto não foi criado lá e o webhook nunca rodou com compra real.

**7. O trial de 7 dias conta da criação da conta e pode ser curto demais para este produto.** O valor do alerta e do diário aparece em semanas (um vencimento chegando, uma visita registrada), não em 7 dias. Além disso: com a cobrança desligada, todo mundo está no trial; no dia em que ligar o link, quem criou conta há mais de 7 dias é bloqueado de uma vez (a regra vale só com `VITE_KIWIFY_CHECKOUT_URL` configurado). Se houver testadores nessa hora, eles perdem acesso sem aviso.

**8. O Radar promete mais do que cobre.**
- Só o CRQ-IV (SP) está nas fontes: químico de outra regional vê pouco do que importa para ele.
- O CFQ, a fonte mais importante, tinha a leitura ao vivo não validada em 25/10 (o servidor derrubou a conexão TLS vinda da rede de desenvolvimento; em produção, saindo do Supabase, pode funcionar: **não foi testado**).
- O Diário Oficial depende da conta no INLABS.
- MMA e Ibama em RSS de notícia tendem a trazer ruído. "Leitura do dia" como destaque vira hábito só se o que aparece for útil; se for ruído, ensina o químico a ignorar.

**9. Textos regulatórios do produto precisam de conferência com a norma de hoje.** Comunicação ao CRQ em 24 h, tipos TRT/ART/CRT e o "limite de 6" vieram de documento de julho. O CFQ publicou muita coisa depois (resoluções 332, 334, 339, 340, 342 e 344, segundo minha busca de hoje, que **não** abri uma a uma). O `VISAO_DE_PRODUTO.md` já lista como pendência validar o limite por escritório ou por profissional. Se o texto da comunicação ao CRQ estiver desatualizado, o produto erra justamente na frase que o químico copia e envia.

### Alternativas com melhor relação custo x retorno

**Alternativa A: Piloto com 10 químicos antes de qualquer módulo novo**
- **O que é:** colocar o produto em frente de 10 químicos RT de verdade, um a um, com o Bruno do lado, por 3 semanas, sem desenvolver nada novo no meio. Ver o que cada um faz sozinho.
- **Esforço:** Baixo em código (zero), médio em tempo do Bruno (listar, convidar, 30 min por pessoa, uma conversa na semana 3).
- **Retorno esperado:** responde as quatro perguntas que travam tudo: quem abre a conta, o que usa, o que ignora, quanto paga. Dá o primeiro depoimento e o primeiro canal.
- **Exemplo de mercado:** hipótese, prática padrão de discovery em software vertical de nicho (primeiros clientes um a um, antes de escalar). Não citei caso específico.
- **Trade-off:** o Bruno passa semanas conversando, não programando. Para quem é desenvolvedor/QA, é o passo mais desconfortável e o de mais retorno.

**Alternativa B: Consertar a promessa e destravar o Google (landing + política de privacidade e termos + publicar o app)**
- **O que é:** trocar na landing, no login e no card do plano "no e-mail" por "na sua Google Agenda"; tirar FISPQ da landing e da cena 3D (ou escrever "item de checklist"); escrever e publicar política de privacidade e termos de uso (incluindo o aviso da IA e da DeepSeek); completar o Branding no Google Cloud e clicar em Publish app.
- **Esforço:** Baixo (texto, duas páginas estáticas, 1 hora de console do Google, com o escopo não sensível).
- **Retorno esperado:** o canal de alerta passa a funcionar para qualquer químico, a promessa deixa de ser falsa, e a LGPD fica coberta. Destrava a Alternativa A.
- **Exemplo de mercado:** não é benchmark, é higiene básica de SaaS que lida com dado de terceiro.
- **Trade-off:** a landing perde uma frase mais forte ("no e-mail") até existir o e-mail de verdade.

**Alternativa C: Ligar a cobrança agora, com trial maior, e testar a compra**
- **O que é:** seguir o passo a passo de `docs/COBRANCA_KIWIFY.md` (criar o produto de R$ 79 na Kiwify, criar o webhook, passar o link e o token), subir o `KIWIFY_WEBHOOK_SECRET`, e fazer uma compra real de teste para ver o webhook liberar o escritório. Para os pilotos, usar o "Liberar 30 dias" do superadmin (já existe) em vez de depender dos 7 dias.
- **Esforço:** Baixo (uma tarde do Bruno, sem código novo; só o build com `VITE_KIWIFY_CHECKOUT_URL`).
- **Retorno esperado:** o produto passa a poder receber. Pega cedo o bug do primeiro pagamento, que é o pior momento para descobrir. Sem isso, o piloto não consegue responder "pagaria?" com cartão na mão.
- **Exemplo de mercado:** no Chef Suite, o mesmo Bruno já registrou falhas silenciosas de webhook da Kiwify (e-mail diferente, retry duplicando); vale testar o mesmo aqui. É dado do próprio portfólio, não de mercado.
- **Trade-off:** ligar antes de ter pilotos bloqueia contas de trial vencido. Mitigação: antes de ligar, liberar 30 dias para cada conta real.

**Alternativa D: Foco no "kit" que o químico mais deve usar toda semana (Agenda + diário + financeiro), com o Radar como bônus**
- **O que é:** na comunicação e na ordem do onboarding, mostrar primeiro as 3 coisas que o químico usa todo mês: prazos na agenda, registro de visita, honorário e carnê-leão. O Radar e a IA aparecem como ajuda, não como razão de compra, até o piloto dizer o contrário.
- **Esforço:** Baixo (texto e ordem das telas; sem módulo novo).
- **Retorno esperado:** uma mensagem só, ligada a dor com data. Evita vender cinco coisas para um produto que ainda não provou nenhuma.
- **Exemplo de mercado:** hipótese de analogia: ferramentas verticais de profissional liberal costumam entrar pela obrigação com data (imposto, prazo) e crescer pelo resto. Não verifiquei um caso.
- **Trade-off:** o Radar (a ideia mais diferente) perde destaque no discurso, embora continue no painel.

**Alternativa E: Motor próprio de alerta por e-mail (resumo semanal de vencimentos)**
- **O que é:** função agendada que, uma vez por semana, manda um e-mail com o que vence nos próximos 30 dias. Depende do SMTP próprio.
- **Esforço:** Médio (agendamento + e-mail + SMTP + teste), maior que A, B, C e D.
- **Retorno esperado:** cumpre de fato a promessa original "à prova de esquecimento" para quem não usa Google Agenda.
- **Exemplo de mercado:** lembrete por e-mail é padrão em software de prazo e renovação (analogia, não verifiquei produto específico).
- **Trade-off:** só vale se o piloto mostrar que os químicos **não** usam a agenda (celular ou Outlook, por exemplo). Se usam, é esforço jogado fora.

### Preço

- **R$ 79/mês por escritório, plano único, equipe incluída:** simples e coerente com "um escritório, uma assinatura". Para quem cuida de 4 a 6 RTs, parece pouco perto do que o químico provavelmente cobra por RT (não sei quanto; **a confirmar nas conversas**). Para quem tem 1 RT, pode parecer alto. Hoje o preço não vem de nenhum teste; vem de uma "faixa de ~R$ 79" no documento de julho.
- **Não mexer no preço antes de falar com 10 químicos.** Perguntar nas conversas, sem oferecer número primeiro: "quanto você pagaria?" e "a que preço você diria que é caro demais?"; depois mostrar R$ 79.
- **Hipóteses para testar (não verificadas):** (a) plano anual com desconto (ex.: 10 meses pelo preço de 12); (b) preço de fundador para os 10 primeiros, mantido enquanto a assinatura continuar; (c) o teto de 6 RTs é natural para segmentar: escritório com equipe maior é outro público.
- **Trial:** 7 dias é curto para um produto cujo valor aparece em semanas. Para os pilotos, 30 dias (já existe o "Liberar 30 dias"). Para o público geral, decidir depois de ver o que o piloto fez nos primeiros 7 dias. Uma regra melhor, a avaliar: **o trial começar na primeira RT cadastrada**, não na criação da conta (exigiria mudança de código, então só se o piloto mostrar que gente cria conta e some).

### O que cortar ou congelar

- **Congelar módulos novos.** Nada de novo no Financeiro, no Radar nem na IA até o piloto responder. O que está pronto já é suficiente para testar.
- **Parar a landing 3D.** Já está feita; não investir mais nela. Se pesar no carregamento ou confundir, o cartão estático (já existe como alternativa sem WebGL) resolve.
- **Arquivar a Central FISPQ.** `docs/PLANO_IMPLEMENTACAO_FISPQ.md` e o board ficam parados desde 13/07. Tirar das mensagens do produto. Reabrir só se químico pedir.
- **Adiar o Kit de Defesa.** O relatório do diário para imprimir/PDF cobre a fase de teste. Só construir o pacote se químico pedir e depois de ouvir alguém do CRQ.
- **Não ampliar as fontes do Radar nem ligar o DOU agora.** Primeiro checar a leitura do CFQ em produção e perguntar se o químico lê.
- **Não construir o portal da empresa nem voltar a atender empresas** até haver caso real.
- **Reescrever o `VISAO_DE_PRODUTO.md`** (ou marcar como histórico) para não guiar decisão por documento de julho. É trabalho do `docs-curator`, a pedido do Bruno.

### As próximas apostas (custo x retorno)

| # | Aposta | Custo | Retorno | Quando |
|---|---|---|---|---|
| 1 | **Tirar as promessas falsas e publicar política de privacidade e termos** (Alternativa B, primeira metade) | Baixo: texto e duas páginas | Alto: confiança, LGPD, destrava o Google | Primeiro, esta semana |
| 2 | **Ligar a Kiwify e testar uma compra real** (Alternativa C) | Baixo: uma tarde, sem código | Alto: o produto pode receber; pega bug de webhook cedo | Esta semana, em paralelo à 1 |
| 3 | **Publicar o app no Google** (Alternativa B, segunda metade) | Baixo: 1 hora de console, depende da aposta 1 | Alto: o alerta passa a chegar a qualquer químico | Logo depois da 1 |
| 4 | **Piloto com 10 químicos, 3 semanas** (Alternativa A, com o trial de 30 dias) | Médio em tempo, zero em código | O maior: validação, canal, depoimento, preço | Começa assim que 1 a 3 estiverem prontas |
| 5 | **E-mail semanal de vencimentos** (Alternativa E) | Médio, depende de SMTP próprio | Só se o piloto mostrar que a agenda não pega | Condicional: decidir no fim do piloto |

### Passo a passo do piloto (aposta 4)

1. **Listar 15 químicos RT** que o Bruno consiga alcançar por conversa direta (colegas de faculdade e de trabalho, conhecidos, grupos). Se não houver 15, essa é a descoberta mais importante do relatório: o canal é o problema.
2. **Mensagem curta, uma por pessoa:** "Montei uma ferramenta para químico RT controlar prazos do CRQ, diário e honorário. Posso te mostrar em 20 minutos? Não vendo nada agora, quero saber se ajuda."
3. **Sessão de 20 a 30 minutos com a pessoa abrindo o produto**, o Bruno só olhando. Anotar onde trava. Não explicar antes.
4. **Dar 30 dias** ao escritório dela (menu ⋮ do escritório em Plataforma, "Liberar 30 dias").
5. **Medir, por pessoa, na semana 1 e na semana 3** (a ver no banco ou perguntando): cadastrou a 1ª RT? conectou a Google Agenda? registrou 1 ação no diário? lançou 1 honorário? abriu o Radar? voltou depois do dia 1?
6. **Conversa final de 15 minutos:** "O que você deixaria de usar? O que faltou? Pagaria R$ 79/mês? Se não, quanto?" e "Você indicaria para quem?".
7. **Decidir com o resultado**, sem emoção: se 3 de 10 dizem que pagam, vale insistir; se ninguém, mudar o produto antes de mexer no preço.

### Minha recomendação

Se fosse meu produto, eu **parava de construir hoje** e usava as próximas duas semanas em quatro coisas, nesta ordem:

1. **Limpar a landing e escrever a política de privacidade e os termos** (aposta 1). É o que mais pesa para um público que lida com norma, e custa horas.
2. **Ligar a Kiwify e fazer uma compra real de teste** (aposta 2), liberando antes 30 dias para qualquer conta real existente.
3. **Publicar o app no Google** (aposta 3): o canal de alerta que o produto tem hoje só funciona para o Bruno.
4. **Sentar com 10 químicos** (aposta 4) e deixar o que eles disserem decidir o que vem depois: se o diário, se o financeiro, se o radar, se o e-mail.

O que eu **não** faria agora: módulo novo, mais fonte no Radar, FISPQ, Kit de Defesa, mudança de preço, reforma de landing. Cada um desses só faz sentido depois que alguém da área disser que quer.

A tese que eu apostaria, para ser testada e não aceita: **o químico entra pelo prazo e pelo diário e fica pelo financeiro e pelo imposto de renda**. Se o piloto confirmar, a mensagem muda para "a agenda e o escritório do químico RT"; se mostrar o contrário, o Radar vira a porta de entrada.

### O que eu investigaria antes de decidir

1. **Quantos químicos RT o Bruno realmente consegue alcançar em 3 semanas e quanto tempo por semana ele tem a partir de novembro.** Sem isso, qualquer plano é chute. (Nos docs: a confirmar.)
2. **A norma vigente.** Abrir as resoluções CFQ de 2025 e 2026 (332, 334, 339, 340, 342 e 344) e conferir: prazo de comunicação ao CRQ, tipos de documento e se o limite de 6 RTs é por escritório ou por profissional. Se possível, uma conversa com alguém do CRQ ou do CFQ. Fontes que achei na busca de hoje (não li inteiras): [Res. CFQ 339/2025](https://crqsp.org.br/wp-content/uploads/2025/12/RESOLUCAO-CFQ-No-339-DE-22-DE-OUTUBRO-DE-2025-RESOLUCAO-CFQ-No-339-DE-22-DE-OUTUBRO-DE-2025-DOU-Imprensa-Nacional.pdf), [Res. CFQ 334/2025](https://crqsp.org.br/wp-content/uploads/2025/11/SEI_0245266_Resolucao_334_.pdf), [Res. CFQ 344/2026](https://crqsp.org.br/wp-content/uploads/2026/02/RESOLUCAO-CFQ-No-344_2026.pdf). A busca também mostrou que a Res. 332/2025 é contestada pela OAB-SP no tema condomínios; trato como disputa, não como regra.
3. **O que o químico usa hoje** para controlar prazo e imposto (planilha? agenda? contador? sistema da consultoria?) e **quanto cobra por RT**. É isso que define concorrência real (hoje o repositório não cita nenhum concorrente) e se R$ 79 é pouco ou muito.
4. **A leitura do CFQ em produção.** Abrir o Radar em https://rtquimico.web.app e ver se o `cfq-documentos` traz itens (o teste do `CLAUDE.md` foi só da rede de desenvolvimento). Barato e define se o Radar vale como destaque.
5. **Custo real por escritório**: tokens da DeepSeek no mês (`ai_usage_log`) e o plano do Supabase e do Firebase. O dado não está nos docs: a confirmar com o Bruno.

### Pontos que ficam "a confirmar com o Bruno"

- Tamanho do mercado (nenhum número no repo).
- Tempo semanal disponível a partir de novembro e quantos químicos RT ele alcança pessoalmente.
- Domínio próprio para o produto (hoje só `rtquimico.web.app`).
- Cota da IA em produção (padrão no código: 60 chamadas por mês e 5 por minuto; valor em uso e se vale por usuário ou por escritório).
- Custo mensal por escritório e custo fixo de infraestrutura.
- Se o trial passará a contar do dia em que a cobrança ligar, e como tratar quem já criou conta.
- Se os `GOOGLE_*` estão no Supabase remoto (`docs/GOOGLE_AGENDA.md` diz que sim; `CLAUDE.md` diz que faltam).
- Meta de 6 meses (proposta: 10 químicos testando de verdade e 3 pagando).
- Lista de concorrentes reais e o que o químico usa hoje.
- Norma vigente sobre comunicação ao CRQ, limite de RTs e tipos de documento (item 2 acima).
