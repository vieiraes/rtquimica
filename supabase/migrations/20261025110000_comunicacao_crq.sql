-- Comunicação ao CRQ com status próprio por RT (início e encerramento), para o quadro de acompanhamento.
-- Antes só existia o alerta "comunicacao_pendente"; agora a RT guarda quando foi comunicada e o protocolo.
alter table public.technical_responsibilities
  add column crq_start_communicated_at timestamptz,
  add column crq_start_protocol text,
  add column crq_end_communicated_at timestamptz,
  add column crq_end_protocol text;

-- RTs existentes: comunicação considerada feita quando não há alerta pendente aberto
update public.technical_responsibilities t set crq_start_communicated_at = t.created_at
where not exists (select 1 from public.alerts a where a.rt_id = t.id and a.type = 'comunicacao_pendente' and not a.is_read);

update public.technical_responsibilities t set crq_end_communicated_at = now()
where t.status = 'canceled'
  and not exists (select 1 from public.alerts a where a.rt_id = t.id and a.type = 'comunicacao_pendente' and not a.is_read);
