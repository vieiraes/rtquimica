# Google Agenda

O químico clica em **Conectar Google Agenda** em Configurações e entra com a conta Google uma única vez. A partir daí, o RTQuímico cria a agenda **RTQuímico** no Google dele e mantém nela, com lembretes:

- os vencimentos das RTs do escritório (lembretes 28 e 7 dias antes);
- os honorários a receber (lembrete 1 dia antes; saem da agenda quando ele marca como recebido);
- o prazo mensal do carnê-leão, se ele recebe no CPF (último dia útil do mês).

A permissão pedida é `calendar.app.created`: o RTQuímico só mexe na agenda que ele mesmo criou, nunca nas outras agendas do químico. **Desconectar** apaga essa agenda e revoga o acesso.

## Situação (25/10/2026)

- Cliente OAuth criado no projeto `rtquimico` do Google Cloud (tipo Aplicativo da Web, URI de retorno da `google-retorno`).
- Tela de permissão Externa; o escopo `calendar.app.created` aparece como **não sensível**.
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` gravados nos secrets do Supabase remoto (cópia no `.env.local`).
- **Modo Teste:** só os e-mails em Audience → Test users conseguem conectar, e a conexão expira a cada 7 dias. Para liberar a todos os químicos: completar a página Branding (logo, domínio `rtquimico.web.app`, links da política de privacidade e dos termos) e clicar em **Publish app**.

## Como funciona

| Peça | Papel |
|---|---|
| `supabase/functions/google-agenda` | Com login. Ações: `conectar` (devolve o endereço do Google), `sincronizar`, `desconectar`. Só químicos. |
| `supabase/functions/google-retorno` | Pública (`verify_jwt = false`). Recebe a volta do Google, confere o `state`, guarda o refresh token, cria a agenda, sincroniza e volta para `/configuracoes?google=…`. |
| `supabase/functions/_shared/agenda-eventos.ts` | Monta os eventos a partir das RTs, honorários e regime. Código puro, testado em `src/lib/agenda-eventos.test.ts`. |
| `google_calendar_links` | Ligação de cada químico. O refresh token só é lido pelas functions (service role); o navegador lê só o status. |
| `google_oauth_states` | O `state` do OAuth, que vale 10 minutos e só pode ser usado uma vez. |

A sincronização roda logo depois de conectar, sempre que o químico salva uma RT ou mexe no Financeiro, e no botão **Atualizar agora**. Ela deixa a agenda igual ao RTQuímico: grava o que mudou e apaga o que não existe mais. Os ids dos eventos são fixos, então sincronizar de novo não duplica nada.

## Local

O local usa o Google de verdade, igual à produção: o portal passa `GOOGLE_CLIENT_ID/SECRET` do `.env.local` para as functions. O cliente OAuth precisa ter também os retornos `http://127.0.0.1:57141/functions/v1/google-retorno` (Agenda) e `http://127.0.0.1:57141/auth/v1/callback` (login). O mock antigo (`scripts/mock-google.mjs`) saiu do portal.

## Produção: o que falta configurar (uma vez)

1. **Google Cloud Console** (conta vieira.es, projeto novo ou o do Firebase `rtquimico`):
   - ativar a **Google Calendar API**;
   - na **tela de consentimento OAuth**:
     - tipo "Externo";
     - nome RTQuímico, e-mail de suporte, logo e domínio `rtquimico.web.app`;
     - links da política de privacidade e dos termos (precisam existir no site);
     - escopos `openid`, `email` e `https://www.googleapis.com/auth/calendar.app.created`.
     
     Confira no console se o `calendar.app.created` aparece como **não sensível**. Se sim, publicar o app não exige a verificação com vídeo. Se o console marcar como sensível, é preciso pedir a verificação, que pode levar semanas.
   - em **Credenciais**, criar um "ID do cliente OAuth", tipo **Aplicativo da Web**, com o URI de redirecionamento `https://qbmocwoqkqazoclmxmsh.supabase.co/functions/v1/google-retorno`.
2. **Publicar o app** na tela de consentimento ("Em produção"). Em "Teste", só os e-mails cadastrados como testadores conseguem conectar, e o Google corta o acesso a cada 7 dias.
3. **Secrets do Supabase remoto:**

   ```
   supabase secrets set --project-ref qbmocwoqkqazoclmxmsh GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… APP_URL=https://rtquimico.web.app
   ```

4. **Deploy das functions e da migration** `20261025000000_google_agenda.sql`. A `google-retorno` vai com `verify_jwt = false` (já está em `supabase/config.toml`).


## Login com Google (Entrar / Criar conta)

O mesmo cliente OAuth do Google Cloud serve também para entrar no RTQuímico com a conta Google:
- **Na tela:** botão "Entrar com o Google" / "Criar conta com o Google", que chama `supabase.auth.signInWithOAuth({ provider: "google" })` e volta para `/painel`.
- **Primeiro acesso:** o trigger `handle_new_user` cria a conta como titular, com escritório próprio e o nome e a foto do Google (migration `20261025120000_login_google.sql`). O Google não manda o CRQ, então o painel mostra uma faixa até o químico informá-lo.
- **Supabase de produção:** o provedor Google está ligado em Authentication → Providers, com o mesmo Client ID e Secret, e com `rtquimico.web.app` na lista de URLs de retorno.
- **Google Cloud (obrigatório):** o cliente OAuth precisa ter o URI `https://qbmocwoqkqazoclmxmsh.supabase.co/auth/v1/callback` em "Authorized redirect URIs". Para usar no local, inclua também `http://127.0.0.1:57141/auth/v1/callback`.
- **Local:** `supabase/config.toml` tem `[auth.external.google]`, que lê `supabase/.env` (fora do git). A mudança só vale depois de reiniciar o serviço "Supabase · RTQuímico" no portal.
