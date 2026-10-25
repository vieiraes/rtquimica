-- Assinatura do escritório pela Kiwify (um plano: R$ 79/mês). Teste grátis de 7 dias a partir da criação.
-- Só o servidor (webhook kiwify-webhook e função equipe) muda a assinatura: o grant de update de tenants segue só em (name).
alter table public.tenants
  add column subscription_status text not null default 'trial' check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  add column trial_ends_at timestamptz default (now() + interval '7 days'),
  add column paid_until timestamptz,
  add column kiwify_subscription_id text,
  add column billing_email text;

-- Escritórios que já existiam ganham os 7 dias a partir de hoje
update public.tenants set trial_ends_at = now() + interval '7 days' where trial_ends_at is null;

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  buyer_email text,
  tenant_id uuid references public.tenants(id) on delete set null,
  status text not null check (status in ('aplicado', 'ignorado', 'sem_escritorio')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index billing_events_tenant_idx on public.billing_events (tenant_id);

alter table public.billing_events enable row level security;
create policy "Superadmin reads billing events" on public.billing_events for select to authenticated using ((select public.current_user_role()) = 'superadmin');
revoke all on public.billing_events from anon, authenticated;
grant select on public.billing_events to authenticated;
