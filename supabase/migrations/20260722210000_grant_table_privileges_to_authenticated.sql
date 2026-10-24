-- RTQ-13: sem GRANT nenhum, o Postgres barra o acesso antes de avaliar RLS (42501).
-- RLS + policies continuam sendo o filtro real de linha/operação; o GRANT aqui só abre
-- a porta no nível de tabela para `authenticated`.
--
-- Sem grant para `anon`: não há nenhum `supabase.from(...)` no app rodando sem sessão
-- (landing page usa mock client-side via isSupabaseConfigured, não Supabase real) — não
-- conceder `anon` reduz superfície de ataque. Reavaliar se um fluxo público for adicionado.

grant select, insert, update, delete on
  public.tenants,
  public.profiles,
  public.technical_responsibilities,
  public.documents,
  public.alerts,
  public.technical_actions,
  public.checklists,
  public.sop_templates
to authenticated;

-- Evita a mesma lacuna se uma tabela nova for criada no futuro (não é substituto de RLS).
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
