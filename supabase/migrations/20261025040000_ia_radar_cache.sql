-- Explicações do radar feitas pela IA, por pessoa (a análise cita as empresas dela). Abrir de novo não gasta IA.
create table public.ai_radar_explanations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.regulatory_items(id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create index ai_radar_explanations_item_idx on public.ai_radar_explanations (item_id);

alter table public.ai_radar_explanations enable row level security;
create policy "Own radar explanations" on public.ai_radar_explanations for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.ai_radar_explanations from anon, authenticated;
grant select on public.ai_radar_explanations to authenticated;
