-- Radar regulatório: novidades dos órgãos (RSS) num lugar só para o químico. A Edge Function "radar" coleta;
-- o navegador só lê. Fontes testadas em 24/10/2026 (tmp/pesquisa-fontes-regulatorias.md).

create table public.regulatory_sources (
  id text primary key,
  name text not null,
  url text not null,
  active boolean not null default true,
  last_fetched_at timestamptz,
  last_error text
);

create table public.regulatory_items (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.regulatory_sources(id) on delete cascade,
  title text not null,
  link text not null unique,
  summary text,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now()
);
create index regulatory_items_published_idx on public.regulatory_items (published_at desc);
create index regulatory_items_source_idx on public.regulatory_items (source_id);

-- O que cada pessoa já leu
create table public.regulatory_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.regulatory_items(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create index regulatory_reads_item_idx on public.regulatory_reads (item_id);

alter table public.regulatory_sources enable row level security;
alter table public.regulatory_items enable row level security;
alter table public.regulatory_reads enable row level security;

-- Informação pública: qualquer pessoa logada lê; só a função (service role) grava fontes e itens
create policy "Read sources" on public.regulatory_sources for select to authenticated using (true);
create policy "Read items" on public.regulatory_items for select to authenticated using (true);
create policy "Own reads" on public.regulatory_reads for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.regulatory_sources, public.regulatory_items, public.regulatory_reads from anon, authenticated;
grant select on public.regulatory_sources, public.regulatory_items to authenticated;
grant select, insert, delete on public.regulatory_reads to authenticated;

insert into public.regulatory_sources (id, name, url) values
  ('cfq-noticias', 'CFQ · notícias', 'https://cfq.org.br/noticia/feed/'),
  ('cfq-documentos', 'CFQ · documentos', 'https://cfq.org.br/documentos/feed/'),
  ('crqsp-noticias', 'CRQ-IV (SP) · notícias', 'https://crqsp.org.br/category/noticias/feed/'),
  ('conama-pauta', 'CONAMA em pauta', 'https://conama.mma.gov.br/conama-em-pauta?format=feed&type=rss'),
  ('mma', 'Ministério do Meio Ambiente', 'https://www.gov.br/mma/rss.xml'),
  ('ibama', 'Ibama · notícias', 'https://www.gov.br/ibama/pt-br/assuntos/noticias/rss.xml')
on conflict (id) do nothing;
