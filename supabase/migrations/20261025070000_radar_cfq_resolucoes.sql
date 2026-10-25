-- Radar: resoluções do CFQ (sem feed; lidas da página pública de resoluções) e correção do endereço do CFQ.
-- cfq.org.br (sem www) aponta para 127.0.0.1 no DNS público do próprio CFQ (conferido em 25/10/2026 no Google e
-- na Cloudflare); só www.cfq.org.br tem servidor. Os feeds antigos falhavam em qualquer lugar, não só no local.
alter table public.regulatory_sources add column kind text not null default 'rss' check (kind in ('rss', 'cfq-resolucoes'));

update public.regulatory_sources set url = replace(url, 'https://cfq.org.br/', 'https://www.cfq.org.br/') where url like 'https://cfq.org.br/%';

insert into public.regulatory_sources (id, name, url, kind) values
  ('cfq-resolucoes', 'CFQ · resoluções', 'https://www.cfq.org.br/resolucoes/', 'cfq-resolucoes')
on conflict (id) do nothing;
