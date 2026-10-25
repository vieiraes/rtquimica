# Cobrança pela Kiwify

O RTQuímico cobra **por escritório**: quem assina é o titular, e a assinatura vale para toda a equipe dele. O plano é um só (R$ 79,90/mês), com 7 dias de teste grátis contados da criação da conta.

**Cobrança ligada em produção desde 25/10/2026:** produto "RTQuímico Profissional" (R$ 79,90/mês), checkout `https://pay.kiwify.com.br/KOOHUlK` no `.env.production`, webhook criado na Kiwify e `KIWIFY_WEBHOOK_SECRET` nos secrets do Supabase (cópia no `.env.local`).

## Como funciona

1. O titular clica em **Assinatura → "Assinar por R$ 79,90/mês"**. O link abre o checkout da Kiwify com o e-mail dele preenchido e com o código do escritório (`sck=<id do escritório>`).
2. A Kiwify avisa o RTQuímico pelo webhook `supabase/functions/kiwify-webhook`, conforme o evento:
   - compra aprovada ou renovada: o escritório fica **ativo** até a próxima cobrança;
   - pagamento atrasado: fica **pendente**, com 5 dias de tolerância;
   - cancelamento ou reembolso: fica **cancelado**.
3. O escritório é encontrado pelo código `sck`. Se ele não vier, o webhook procura o titular com o e-mail da compra.
4. Cada evento é gravado em `billing_events`, uma vez só. Se nenhum escritório for encontrado, o evento fica com a situação `sem_escritorio` para você conferir.
5. Sem pagamento, o químico só vê **Assinatura** e **Configurações**. Os dados ficam guardados.
6. O superadmin pode liberar 30 dias para um escritório (tela Plataforma, menu ⋮ do escritório).

## O que você precisa fazer (uma vez)

1. **Criar o produto na Kiwify**: assinatura mensal de R$ 79,90, nome "RTQuímico Profissional". Copie o link do checkout (algo como `https://pay.kiwify.com.br/XXXXXXX`).
2. **Criar o webhook na Kiwify** (Apps → Webhooks):
   - URL: `https://qbmocwoqkqazoclmxmsh.supabase.co/functions/v1/kiwify-webhook`
   - eventos: compra aprovada, assinatura renovada, assinatura atrasada, assinatura cancelada, compra reembolsada e chargeback;
   - a Kiwify mostra um **token**: ele é o segredo do webhook.
3. **Me passar os dois** (link do checkout e token). Eu faço o resto:
   - `KIWIFY_WEBHOOK_SECRET=<token>` nos secrets do Supabase;
   - `VITE_KIWIFY_CHECKOUT_URL=<link>` no `.env.production`;
   - novo build e deploy no Firebase.

## Local

O portal infraestrutura-local passa um segredo só de teste (`kiwify-local-e2e`) e o `.env.local` tem um link de exemplo, para a tela de assinatura funcionar. Os testes assinam o webhook com o segredo de teste.
