-- Fecha duas formas de um usuário comum se promover a superadmin ou entrar no tenant de outro cliente.
--
-- 1) handle_new_user() lia tenant_id e role de raw_user_meta_data, que quem se cadastra preenche à vontade
--    (supabase.auth.signUp({ options: { data: { role: 'superadmin' } } }) com a chave pública do site).
--    Agora lê de raw_app_meta_data, que só o servidor (service role / SQL) grava. Cadastro pelo site
--    sempre cria um tenant novo, com o usuário como tenant_admin dele.
--
-- 2) A policy "Users can update their own profile" e "Tenant admins can update their own tenant" liberavam
--    qualquer coluna. Privilégio por coluna: o usuário só edita os dados pessoais do perfil e o nome do tenant.
--    role, tenant_id e plan passam a mudar só por SQL/service role.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  new_tenant_id uuid;
begin
  if new.raw_app_meta_data ->> 'tenant_id' is not null then
    new_tenant_id := (new.raw_app_meta_data ->> 'tenant_id')::uuid;
  else
    insert into public.tenants (name, plan)
    values (coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)) || ' Workspace', 'basic')
    returning id into new_tenant_id;
  end if;

  insert into public.profiles (id, tenant_id, role, email, name, crq_number, crq_state)
  values (
    new.id,
    new_tenant_id,
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'tenant_admin'::public.app_role),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'numero_crq',
    new.raw_user_meta_data ->> 'crq_estado'
  );
  return new;
end;
$$;

revoke update on public.profiles from anon, authenticated;
grant update (name, crq_number, crq_state, phone, avatar_url) on public.profiles to authenticated;

revoke update on public.tenants from anon, authenticated;
grant update (name) on public.tenants to authenticated;
