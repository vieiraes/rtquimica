-- Google Agenda: o químico entra com a conta Google uma vez e o RTQuímico mantém uma agenda "RTQuímico" no Google
-- dele (vencimentos de RT, honorários a receber, carnê-leão). Escopo calendar.app.created: só a agenda que o app criou.
-- O refresh token nunca sai do servidor: só as Edge Functions (service role) leem e gravam essas tabelas.

create table public.google_calendar_links (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  google_email text,
  calendar_id text not null,
  refresh_token text not null,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

alter table public.google_calendar_links enable row level security;
create policy "Own google link status" on public.google_calendar_links
  for select to authenticated using (user_id = (select auth.uid()));

-- Os default privileges do projeto dão tudo ao authenticated; aqui ele só lê o status, sem o token
revoke all on public.google_calendar_links from anon, authenticated;
grant select (user_id, google_email, calendar_id, last_sync_at, last_error, created_at) on public.google_calendar_links to authenticated;

-- "state" do OAuth: liga a volta do Google ao usuário que clicou em Conectar (vale 10 minutos)
create table public.google_oauth_states (
  state text primary key default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.google_oauth_states enable row level security;
revoke all on public.google_oauth_states from anon, authenticated;
