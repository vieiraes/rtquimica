-- Equipe: acesso ativo ou desativado (desativar não apaga os dados da pessoa; o login fica bloqueado no Auth).
-- Só a Edge Function "equipe" (service role) muda: não há grant de update dessa coluna para authenticated.
alter table public.profiles add column active boolean not null default true;
