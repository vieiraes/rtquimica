-- Login com Google: a conta nasce pelo OAuth do Supabase Auth, sem o formulário do site.
-- O Google manda o nome em full_name/name e a foto em avatar_url/picture (raw_user_meta_data); o CRQ não vem,
-- e o painel pede para o químico informar em Perfil e configurações.
-- Papel e escritório continuam vindo só de raw_app_meta_data (o cliente não escolhe).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  new_tenant_id uuid;
  nome text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );
begin
  if new.raw_app_meta_data ->> 'tenant_id' is not null then
    new_tenant_id := (new.raw_app_meta_data ->> 'tenant_id')::uuid;
  else
    insert into public.tenants (name, plan)
    values (nome || ' Workspace', 'basic')
    returning id into new_tenant_id;
  end if;

  insert into public.profiles (id, tenant_id, role, email, name, crq_number, crq_state, avatar_url)
  values (
    new.id,
    new_tenant_id,
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'tenant_admin'::public.app_role),
    new.email,
    nome,
    new.raw_user_meta_data ->> 'numero_crq',
    new.raw_user_meta_data ->> 'crq_estado',
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;
