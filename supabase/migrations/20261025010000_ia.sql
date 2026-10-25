-- IA (DeepSeek) pela Edge Function "ia". Ver docs/PLANO_IA.md.
-- Configuração, log de uso e reserva de cota são só do servidor (service role); o químico lê o próprio uso.

create table public.ai_config (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default true,
  model text not null default 'deepseek-flash',
  calls_per_month int not null default 60 check (calls_per_month >= 0),
  calls_per_minute int not null default 5 check (calls_per_minute > 0),
  -- Teto global de tokens no mês: estourou, a IA desliga para todo mundo até virar o mês
  monthly_token_budget bigint not null default 5000000 check (monthly_token_budget > 0),
  updated_at timestamptz not null default now()
);
insert into public.ai_config (id) values (1) on conflict (id) do nothing;

create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null,
  model text,
  status text not null default 'pendente' check (status in ('pendente', 'ok', 'erro')),
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  error text,
  created_at timestamptz not null default now()
);
create index ai_usage_log_user_created_idx on public.ai_usage_log (user_id, created_at);
create index ai_usage_log_created_idx on public.ai_usage_log (created_at);

alter table public.ai_config enable row level security;
alter table public.ai_usage_log enable row level security;
create policy "Own ai usage" on public.ai_usage_log for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.ai_config from anon, authenticated;
revoke all on public.ai_usage_log from anon, authenticated;
grant select on public.ai_usage_log to authenticated;

-- Reserva uma chamada se couber nos limites (por minuto, por mês e o teto global de tokens).
-- Trava por usuário: dois cliques ao mesmo tempo não passam juntos do limite. Chamada com erro não conta.
create or replace function public.reservar_uso_ia(p_user uuid, p_operation text)
returns table (log_id uuid, motivo text, restantes int)
language plpgsql security definer set search_path = ''
as $$
declare
  cfg public.ai_config;
  no_minuto int;
  no_mes int;
  tokens_mes bigint;
  novo uuid;
begin
  select * into cfg from public.ai_config where id = 1;
  if cfg is null or not cfg.enabled then
    return query select null::uuid, 'desligada'::text, 0;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext('ia:' || p_user::text));

  select count(*) into no_minuto from public.ai_usage_log
    where user_id = p_user and status <> 'erro' and created_at > now() - interval '1 minute';
  if no_minuto >= cfg.calls_per_minute then
    return query select null::uuid, 'por_minuto'::text, 0;
    return;
  end if;

  select count(*) into no_mes from public.ai_usage_log
    where user_id = p_user and status <> 'erro' and created_at >= date_trunc('month', now());
  if no_mes >= cfg.calls_per_month then
    return query select null::uuid, 'por_mes'::text, 0;
    return;
  end if;

  select coalesce(sum(total_tokens), 0) into tokens_mes from public.ai_usage_log
    where created_at >= date_trunc('month', now());
  if tokens_mes >= cfg.monthly_token_budget then
    return query select null::uuid, 'orcamento'::text, 0;
    return;
  end if;

  insert into public.ai_usage_log (user_id, operation, model) values (p_user, p_operation, cfg.model) returning id into novo;
  return query select novo, null::text, cfg.calls_per_month - no_mes - 1;
end;
$$;

revoke execute on function public.reservar_uso_ia(uuid, text) from public, anon, authenticated;
grant execute on function public.reservar_uso_ia(uuid, text) to service_role;
