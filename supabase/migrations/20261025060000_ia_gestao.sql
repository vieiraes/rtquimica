-- Gestão do produto (superadmin) vê o uso da IA e ajusta a configuração na tela Plataforma.
-- Químico continua só com o próprio uso (policy "Own ai usage"); a configuração segue fechada para ele.
create policy "Superadmin reads ai config" on public.ai_config for select to authenticated using ((select public.current_user_role()) = 'superadmin');
create policy "Superadmin updates ai config" on public.ai_config for update to authenticated using ((select public.current_user_role()) = 'superadmin') with check ((select public.current_user_role()) = 'superadmin');
create policy "Superadmin reads ai usage" on public.ai_usage_log for select to authenticated using ((select public.current_user_role()) = 'superadmin');

grant select on public.ai_config to authenticated;
grant update (enabled, calls_per_month, calls_per_minute, monthly_token_budget, updated_at) on public.ai_config to authenticated;
