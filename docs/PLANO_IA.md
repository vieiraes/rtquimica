# Plano: IA (DeepSeek) no RTQuímico

> Atualizado em 25/10/2026. **Implementado:** a base (`supabase/functions/ia`, `ai_config`, `ai_usage_log`, `reservar_uso_ia`, mock local) e os itens 1 (diário assistido), 2 (radar explicado, ainda sem DOU) e 3 (POP a partir do modelo) da seção 4. Faltam o 4 (comunicação ao CRQ) e o 5 (comprovante por foto, que precisa de OCR).

## 1. De onde vem o padrão: Chef Suite

O Chef Suite já usa a DeepSeek em produção. O que funciona lá e vale copiar:

- **O navegador nunca fala com a DeepSeek.** Tudo passa por uma Edge Function do Supabase (`supabase/functions/ai-call`), com `fetch` puro para `https://api.deepseek.com/chat/completions`.
- **A chave fica no servidor:** `DEEPSEEK_API_KEY` como secret do Supabase (`supabase secrets set`), lida com `Deno.env.get`.
- **Antes de chamar a IA:**
  - a função confere o login (JWT);
  - confere o plano;
  - reserva a cota e debita o crédito de forma atômica, numa RPC com advisory lock.
- **Se a chamada falha,** a função devolve o crédito e libera a cota.
- **Modelo e esforço vêm do banco** (`platform_config`), sem deploy para trocar.
- **Todo uso é registrado** (`ai_usage_log`: usuário, operação, modelo, tokens).

O que **não** copiar, porque lá é ponto fraco:

| No Chef Suite | No RTQuímico |
|---|---|
| O front monta o prompt de sistema e manda o array de mensagens inteiro (dá para trocar o prompt e fazer jailbreak) | O front manda só **qual operação** e os **dados**; o prompt mora no servidor |
| Uma operação (`history_compress`) sai sem cobrança e aceita qualquer prompt: uso livre da DeepSeek | Toda operação é cobrada ou contada; sem operação "aberta" |
| JSON pedido no texto e lido com regex se quebrar | `response_format: { type: "json_object" }` e validação com zod; resposta inválida conta como falha (estorna) |
| Sem timeout no servidor | `AbortSignal.timeout` na chamada |
| Log de uso aceita insert de qualquer um | Só a função (service role) grava o log |
| Sem mock da DeepSeek; o teste local gasta crédito real | Mock da DeepSeek no infraestrutura-local para desenvolver e rodar E2E sem custo |
| Chave real commitada em `infraestrutura-local/envs/abertos/chef-suite/.env` | Chave só no secret do Supabase e no `.env.local` (fora do git) |

## 2. Arquitetura proposta

```
navegador ──(JWT, operação + dados)──> Edge Function "ia" ──> DeepSeek
                                          │  confere papel (só químico)
                                          │  limite por plano e por minuto
                                          │  monta o prompt da operação
                                          │  valida a resposta (zod)
                                          └─> ai_usage_log (tokens, custo estimado)
```

- **Uma Edge Function `ia`** com uma lista fechada de operações, cada uma com prompt, schema de saída, teto de tokens e esforço próprios.
- **Tabelas:**
  - `ai_usage_log` (só service role grava; o químico lê só o próprio uso);
  - `ai_limits` por plano: chamadas por mês e por minuto.
- **Custo:** o log guarda os tokens e uma estimativa em reais, e um teto mensal global desliga a IA se estourar.
- **Front:** um hook `useIA(operacao)` com estados de carregando, erro e cancelar. A resposta chega sempre como **rascunho editável**, nunca é gravada direto.
- **Local:** o portal já sobe o Supabase do RTQuímico sem Edge Functions (`functions: false`). É preciso ligar as functions no cartão e criar o mock da DeepSeek em `infraestrutura-local/mocks`.

## 3. Cuidados próprios da área

- **Responsabilidade técnica é pessoal.** Laudo, parecer e comunicação ao CRQ têm a assinatura do químico. A IA só faz rascunho e o texto diz isso na tela; nada sai assinado nem é enviado sem revisão.
- **LGPD e sigilo.** A DeepSeek processa os dados fora do Brasil. Mandar o mínimo:
  - sem CPF;
  - sem nomes quando não precisar;
  - CNPJ só se a operação exigir.
  Avisar nos termos de uso. Se algum cliente exigir dados no país, a função `ia` permite trocar de provedor sem mexer no front.
- **Norma não se inventa.** Em pergunta sobre regulamentação, a IA só responde com a fonte junto (DOU, CFQ, CONAMA), vinda da base que o radar regulatório coleta (ver `tmp/pesquisa-fontes-regulatorias.md`). Sem fonte, ela diz que não sabe.

## 4. Onde a IA pode entrar (para decidir depois)

Ordem sugerida por valor × risco:

1. **Diário técnico assistido.** O químico dita ou escreve a anotação solta da visita e recebe o registro formal (data, empresa, constatações, orientações), para revisar e salvar. É uso diário, com risco baixo e prompt simples. **Bom primeiro passo.**
2. **Radar regulatório explicado.** Quando o radar (RSS do CFQ, CRQ, Ibama e CONAMA; DOU via INLABS) trouxer uma norma nova, a IA resume em linguagem simples e aponta quais empresas do químico podem ser afetadas, pela atividade (CNAE) de cada uma. Depende de montar o radar antes.
3. **POP a partir do modelo.** Pega o modelo da biblioteca e os dados da empresa e devolve um POP adaptado, como rascunho.
4. **Rascunho da comunicação ao CRQ** e de relatórios mensais para a empresa.
5. **Financeiro.** A DeepSeek não lê imagem; ler o comprovante pela foto exige outro serviço de OCR, e depois a IA sugere a categoria e se a despesa é dedutível.

## 5. Passos quando decidir

1. Fase 0 (base, sem funcionalidade visível):
   - Edge Function `ia` com uma operação de teste;
   - tabelas de log e limite;
   - mock local;
   - secret `DEEPSEEK_API_KEY` no projeto remoto;
   - testes unitários (corpo da requisição, validação) e E2E contra o mock.
2. Fase 1: a primeira funcionalidade escolhida (sugestão: diário técnico assistido), com limite pequeno por plano, para medir uso e custo.
3. Depois: as demais da lista, uma por vez, cada uma com sua operação, prompt e schema na função.
