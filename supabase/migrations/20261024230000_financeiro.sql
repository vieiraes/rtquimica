-- Módulo financeiro do químico: honorários (receitas), despesas dedutíveis (livro-caixa), carnê-leão e resumo do IR.
-- Finança é pessoal: cada lançamento é só de quem o criou. Nem o titular do escritório nem o superadmin leem
-- os lançamentos de outra pessoa (diferente das RTs, que são do escritório inteiro).

-- Como o químico recebe pela RT: 'pf' (autônomo, no CPF: carnê-leão e livro-caixa) ou 'pj' (pela própria empresa)
alter table public.profiles add column tax_regime text check (tax_regime in ('pf', 'pj'));
grant update (tax_regime) on public.profiles to authenticated;

create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('receita', 'despesa')),
  -- Receita: empresa atendida (RT opcional) e quem pagou; 'pf' entra no carnê-leão, 'pj' costuma ter IR retido na fonte
  rt_id uuid references public.technical_responsibilities(id) on delete set null,
  payer_type text check (payer_type in ('pf', 'pj')),
  payer_name text,
  payer_document text,
  -- Despesa: categoria do livro-caixa e se reduz o imposto
  category text,
  deductible boolean not null default false,
  description text not null,
  amount_cents bigint not null check (amount_cents > 0),
  withheld_tax_cents bigint not null default 0 check (withheld_tax_cents >= 0),
  due_date date not null,
  paid_on date,
  receipt_path text,
  created_at timestamptz not null default now(),
  constraint receita_tem_pagador check (kind <> 'receita' or payer_type is not null)
);

create index financial_entries_user_due_idx on public.financial_entries (user_id, due_date);
create index financial_entries_tenant_idx on public.financial_entries (tenant_id);
create index financial_entries_rt_idx on public.financial_entries (rt_id);

alter table public.financial_entries enable row level security;

create policy "Own financial entries" on public.financial_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and tenant_id = (select public.current_user_tenant()));

grant select, insert, update, delete on public.financial_entries to authenticated;

-- Comprovantes ficam num bucket próprio, numa pasta por pessoa (o bucket 'documentos' é por escritório)
insert into storage.buckets (id, name, public)
values ('financeiro', 'financeiro', false)
on conflict (id) do nothing;

create policy "financeiro_own_folder_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'financeiro' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "financeiro_own_folder_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'financeiro' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "financeiro_own_folder_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'financeiro' and (storage.foldername(name))[1] = (select auth.uid())::text);
