-- LGPD: registro do aceite dos Termos de Uso e da Política de Privacidade (data do servidor + versão do texto).
-- Cadastro por e-mail: o formulário exige o aceite e manda a versão em raw_user_meta_data.aceite_termos.
-- Login com Google e contas antigas: o painel pede o aceite ao entrar e grava por aceitar_termos().
alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text check (char_length(terms_version) <= 20);

-- O cliente não escreve as colunas direto (sem grant de update): só pela função, com a hora do servidor
create or replace function public.aceitar_termos(p_versao text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sem sessão';
  end if;
  if p_versao is null or char_length(p_versao) = 0 or char_length(p_versao) > 20 then
    raise exception 'versão inválida';
  end if;
  update public.profiles
     set terms_accepted_at = now(), terms_version = p_versao
   where id = auth.uid();
end;
$$;

revoke execute on function public.aceitar_termos(text) from public, anon;
grant execute on function public.aceitar_termos(text) to authenticated;

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
  aceite text := left(nullif(trim(new.raw_user_meta_data ->> 'aceite_termos'), ''), 20);
begin
  if new.raw_app_meta_data ->> 'tenant_id' is not null then
    new_tenant_id := (new.raw_app_meta_data ->> 'tenant_id')::uuid;
  else
    insert into public.tenants (name, plan)
    values (nome || ' Workspace', 'basic')
    returning id into new_tenant_id;
  end if;

  insert into public.profiles (id, tenant_id, role, email, name, crq_number, crq_state, avatar_url, terms_version, terms_accepted_at)
  values (
    new.id,
    new_tenant_id,
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'tenant_admin'::public.app_role),
    new.email,
    nome,
    new.raw_user_meta_data ->> 'numero_crq',
    new.raw_user_meta_data ->> 'crq_estado',
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    aceite,
    case when aceite is not null then now() end
  );
  return new;
end;
$$;
