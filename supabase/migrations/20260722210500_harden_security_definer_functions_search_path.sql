-- RTQ-9: ALTER FUNCTION (não `create or replace`) para não reescrever o corpo das
-- funções — em especial create_rt_communication_alert() tem lógica de trigger viva.
-- search_path = '' replica o padrão já usado em handle_new_user(). As 3 funções abaixo
-- já qualificam tudo com `public.`, então é hardening sem mudança de comportamento.

alter function public.current_user_tenant() set search_path = '';
alter function public.current_user_role() set search_path = '';
alter function public.create_rt_communication_alert() set search_path = '';
