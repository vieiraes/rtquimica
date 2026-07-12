create extension if not exists "pgcrypto";

create type public.app_role as enum ('superadmin', 'tenant_admin', 'tenant_member', 'tenant_client');
create type public.plan_type as enum ('basic', 'pro', 'enterprise');
create type public.rt_status as enum ('active', 'pending', 'expired', 'canceled');
create type public.document_type as enum ('TRT', 'ART', 'CRT', 'other');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan public.plan_type not null default 'basic',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  role public.app_role not null default 'tenant_member',
  email text not null,
  name text not null,
  crq_number text,
  crq_state text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.technical_responsibilities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  company_name text not null,
  company_cnpj text not null,
  document_type public.document_type not null,
  document_number text,
  start_date date not null,
  end_date date not null,
  status public.rt_status not null default 'pending',
  crq_region text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rt_id uuid not null references public.technical_responsibilities(id) on delete cascade,
  name text not null,
  type public.document_type not null default 'other',
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rt_id uuid references public.technical_responsibilities(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.technical_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rt_id uuid not null references public.technical_responsibilities(id) on delete cascade,
  category text not null,
  description text not null,
  action_date timestamptz not null default now(),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rt_id uuid not null references public.technical_responsibilities(id) on delete cascade,
  status text not null,
  items jsonb not null default '[]'::jsonb,
  progress integer not null default 0 check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (rt_id)
);

create table public.sop_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  title text not null,
  segment text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Funções Utilitárias para RLS
create or replace function public.current_user_tenant()
returns uuid language sql security definer stable
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns public.app_role language sql security definer stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Trigger: Criação Automática de Perfil e Tenant (Workspace)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  new_tenant_id uuid;
begin
  if new.raw_user_meta_data ->> 'tenant_id' is not null then
    new_tenant_id := (new.raw_user_meta_data ->> 'tenant_id')::uuid;
  else
    insert into public.tenants (name, plan)
    values (coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)) || ' Workspace', 'basic')
    returning id into new_tenant_id;
  end if;

  insert into public.profiles (id, tenant_id, role, email, name, crq_number, crq_state)
  values (
    new.id,
    new_tenant_id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'tenant_admin'::public.app_role),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'numero_crq',
    new.raw_user_meta_data ->> 'crq_estado'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: Limite de 6 RTs ativas (por tenant ou por usuario?)
-- O ideal é por tenant se for consultoria, ou por usuario. Manteremos por tenant como limite generico.
create or replace function public.enforce_active_rt_limit()
returns trigger language plpgsql
as $$
begin
  if new.status = 'active' and (
    select count(*) from public.technical_responsibilities
    where tenant_id = new.tenant_id and status = 'active' and id <> new.id
  ) >= 6 then
    raise exception 'Limite de 6 responsabilidades técnicas ativas atingido no Workspace';
  end if;
  return new;
end;
$$;

create trigger enforce_rt_limit
  before insert or update of status on public.technical_responsibilities
  for each row execute procedure public.enforce_active_rt_limit();

-- Trigger: Alerta de Comunicação
create or replace function public.create_rt_communication_alert()
returns trigger language plpgsql security definer
as $$
begin
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.status = 'canceled' and old.status <> 'canceled') then
    insert into public.alerts (tenant_id, rt_id, type, title, message)
    values (
      new.tenant_id,
      new.id,
      'comunicacao_pendente',
      'Comunicação ao CRQ pendente',
      'Comunique o início ou encerramento da responsabilidade técnica ao CRQ em até 24 horas.'
    );
  end if;
  return new;
end;
$$;

create trigger create_communication_alert
  after insert or update of status on public.technical_responsibilities
  for each row execute procedure public.create_rt_communication_alert();

-- RLS
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.technical_responsibilities enable row level security;
alter table public.documents enable row level security;
alter table public.alerts enable row level security;
alter table public.technical_actions enable row level security;
alter table public.checklists enable row level security;
alter table public.sop_templates enable row level security;

-- Policies: Tenants
create policy "Superadmin can manage all tenants" on public.tenants
  for all using (public.current_user_role() = 'superadmin');
create policy "Tenant members can view their own tenant" on public.tenants
  for select using (id = public.current_user_tenant());
create policy "Tenant admins can update their own tenant" on public.tenants
  for update using (id = public.current_user_tenant() and public.current_user_role() = 'tenant_admin');

-- Policies: Profiles
create policy "Superadmin can manage all profiles" on public.profiles
  for all using (public.current_user_role() = 'superadmin');
create policy "Users can view profiles in their tenant" on public.profiles
  for select using (tenant_id = public.current_user_tenant());
create policy "Users can update their own profile" on public.profiles
  for update using (id = auth.uid());

-- Common Policy Generator Macro Equivalent for Tenant Isolation
-- For technical_responsibilities, documents, alerts, technical_actions, checklists
create policy "Superadmin all rts" on public.technical_responsibilities for all using (public.current_user_role() = 'superadmin');
create policy "Tenant isolation rts" on public.technical_responsibilities for all using (tenant_id = public.current_user_tenant());

create policy "Superadmin all documents" on public.documents for all using (public.current_user_role() = 'superadmin');
create policy "Tenant isolation documents" on public.documents for all using (tenant_id = public.current_user_tenant());

create policy "Superadmin all alerts" on public.alerts for all using (public.current_user_role() = 'superadmin');
create policy "Tenant isolation alerts" on public.alerts for all using (tenant_id = public.current_user_tenant());

create policy "Superadmin all technical_actions" on public.technical_actions for all using (public.current_user_role() = 'superadmin');
create policy "Tenant isolation technical_actions" on public.technical_actions for all using (tenant_id = public.current_user_tenant());

create policy "Superadmin all checklists" on public.checklists for all using (public.current_user_role() = 'superadmin');
create policy "Tenant isolation checklists" on public.checklists for all using (tenant_id = public.current_user_tenant());

-- Policies: SOP Templates
create policy "Superadmin all templates" on public.sop_templates for all using (public.current_user_role() = 'superadmin');
create policy "Global templates are readable by all" on public.sop_templates for select using (tenant_id is null);
create policy "Tenant isolation templates" on public.sop_templates for all using (tenant_id = public.current_user_tenant());

-- Storage
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy "storage_user_folder_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.current_user_tenant()::text);
create policy "storage_user_folder_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.current_user_tenant()::text);
create policy "storage_user_folder_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.current_user_tenant()::text);
create policy "storage_user_folder_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.current_user_tenant()::text);
