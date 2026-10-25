-- Tenants Fixos
insert into public.tenants (id, name, plan)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Assessoria Mariana Vieira', 'pro'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'João Química Ltda', 'basic'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'RTQuímico (gestão do produto)', 'enterprise')
on conflict (id) do nothing;

-- Assinatura (Kiwify): escritório da Mariana pago por 30 dias; o do João em teste grátis (7 dias, padrão da tabela)
update public.tenants set subscription_status = 'active', paid_until = now() + interval '30 days' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Um login por papel (senha 123456): superadmin@ = gestão do produto; mariana@ = titular do escritório A (tenant_admin);
-- carla@ = química da equipe da Mariana (tenant_member). Empresa contratante (tenant_external_client) está sem login: o produto atende só químicos.
-- joao@ = titular de outro escritório (B), para testar o isolamento entre tenants.
-- Usuários. Papel e tenant vão em raw_app_meta_data: o trigger handle_new_user só confia nele. As colunas de token vão como texto vazio: nulas, o GoTrue não consegue logar.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, instance_id,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values
  ('11111111-1111-1111-1111-111111111111', 'superadmin@rtquimico.local', crypt('123456', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"], "role": "superadmin", "tenant_id": "cccccccc-cccc-cccc-cccc-cccccccccccc"}', '{"nome": "Gestão RTQuímico"}', now(), now(), 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', '', '', '', '', '', '', ''),
  ('22222222-2222-2222-2222-222222222222', 'mariana@rtquimico.local', crypt('123456', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"], "role": "tenant_admin", "tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', '{"nome": "Mariana Vieira", "numero_crq": "04289123", "crq_estado": "SP"}', now(), now(), 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', '', '', '', '', '', '', ''),
  ('33333333-3333-3333-3333-333333333333', 'joao@rtquimico.local', crypt('123456', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"], "role": "tenant_admin", "tenant_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', '{"nome": "João Química"}', now(), now(), 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', '', '', '', '', '', '', ''),
  ('44444444-4444-4444-4444-444444444444', 'carla@rtquimico.local', crypt('123456', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"], "role": "tenant_member", "tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', '{"nome": "Carla Souza", "numero_crq": "04311876", "crq_estado": "SP"}', now(), now(), 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', '', '', '', '', '', '', '')
on conflict (id) do nothing;

-- Identidades para o login funcionar
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'superadmin@rtquimico.local')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'mariana@rtquimico.local')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', format('{"sub":"%s","email":"%s"}', '33333333-3333-3333-3333-333333333333', 'joao@rtquimico.local')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', format('{"sub":"%s","email":"%s"}', '44444444-4444-4444-4444-444444444444', 'carla@rtquimico.local')::jsonb, 'email', now(), now(), now())
on conflict (id) do nothing;

-- Aguardar os triggers rodarem
do $$ begin perform pg_sleep(0.5); end $$;

-- RTs para Mariana (Tenant A). Vigências relativas a hoje, para o seed não envelhecer (a CRT da QuimNova vence em 18 dias, como diz o alerta).
insert into public.technical_responsibilities (id, tenant_id, user_id, company_name, company_cnpj, document_type, document_number, start_date, end_date, status, crq_region)
values
  ('d1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'BioLab Análises', '12.345.678/0001-90', 'TRT', 'TRT-2026-0182', current_date - 288, current_date + 77, 'active', 'CRQ-IV'),
  ('d2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Aqua Pura Ambiental', '28.491.730/0001-44', 'ART', 'ART-2025-0941', current_date - 340, current_date + 25, 'active', 'CRQ-IV'),
  ('d3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'QuimNova Indústria', '43.981.275/0001-08', 'CRT', 'CRT-2025-2210', current_date - 347, current_date + 18, 'pending', 'CRQ-IV'),
  ('d4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Verde Ciclo Efluentes', '09.441.875/0001-31', 'TRT', 'TRT-2025-0672', current_date - 245, current_date + 120, 'active', 'CRQ-IV')
on conflict (id) do nothing;

-- RTs para João (Tenant B)
insert into public.technical_responsibilities (id, tenant_id, user_id, company_name, company_cnpj, document_type, document_number, start_date, end_date, status, crq_region)
values
  ('d5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'João Petroquímica', '99.999.999/0001-99', 'TRT', 'TRT-2026-9999', current_date - 250, current_date + 115, 'active', 'CRQ-V')
on conflict (id) do nothing;

-- Alertas (Mariana)
insert into public.alerts (tenant_id, rt_id, type, title, message, is_read)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd3333333-3333-3333-3333-333333333333', 'vencimento_7', 'CRT vence em 18 dias', 'QuimNova Indústria precisa iniciar a renovação.', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'comunicacao_pendente', 'Comunicação ao CRQ pendente', 'Confirme o protocolo da nova responsabilidade técnica.', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd2222222-2222-2222-2222-222222222222', 'info', 'Documento solicitado', 'Aqua Pura Ambiental solicitou acesso ao relatório mensal.', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1111111-1111-1111-1111-111111111111', 'renovacao', 'Renovação concluída', 'A TRT da BioLab Análises foi atualizada com sucesso.', true);

-- Ações Técnicas (Mariana)
insert into public.technical_actions (tenant_id, rt_id, category, description, action_date)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1111111-1111-1111-1111-111111111111', 'visita', 'Inspeção das rotinas de preparo de amostras e atualização do livro de registros.', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd2222222-2222-2222-2222-222222222222', 'orientacao', 'Treinamento da equipe sobre armazenamento e identificação de reagentes.', now() - interval '3 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd4444444-4444-4444-4444-444444444444', 'laudo', 'Emissão de parecer técnico sobre os resultados do monitoramento de efluentes.', now() - interval '7 days');

-- Financeiro (pessoal de cada químico): Mariana recebe no CPF (carnê-leão), Carla pela própria empresa
update public.profiles set tax_regime = 'pf' where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set tax_regime = 'pj' where id = '44444444-4444-4444-4444-444444444444';
insert into public.financial_entries (tenant_id, user_id, kind, rt_id, payer_type, payer_name, payer_document, category, deductible, description, amount_cents, withheld_tax_cents, due_date, paid_on)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'receita', 'd1111111-1111-1111-1111-111111111111', 'pj', 'BioLab Análises', '12.345.678/0001-90', null, false, 'Honorários de RT', 180000, 2700, current_date - 12, current_date - 12),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'receita', 'd2222222-2222-2222-2222-222222222222', 'pj', 'Aqua Pura Ambiental', '28.491.730/0001-44', null, false, 'Honorários de RT', 150000, 0, current_date - 6, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'receita', null, 'pf', 'Sítio Boa Água (José Pereira)', null, null, false, 'Laudo de potabilidade do poço', 240000, 0, current_date - 3, current_date - 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'receita', 'd4444444-4444-4444-4444-444444444444', 'pj', 'Verde Ciclo Efluentes', '09.441.875/0001-31', null, false, 'Honorários de RT', 220000, 0, current_date + 9, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'despesa', null, null, null, null, 'anuidade_crq', true, 'Anuidade CRQ-IV', 78000, 0, current_date - 20, current_date - 20),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'despesa', null, null, null, null, 'curso', true, 'Curso de atualização em efluentes', 45000, 0, current_date - 4, current_date - 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'despesa', null, null, null, null, 'deslocamento', false, 'Combustível das visitas', 32000, 0, current_date - 2, current_date - 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'receita', 'd3333333-3333-3333-3333-333333333333', 'pj', 'QuimNova Indústria', '43.981.275/0001-08', null, false, 'Nota fiscal de serviços de RT', 210000, 0, current_date - 8, current_date - 8);

-- Templates de POP (Global = tenant_id null)
insert into public.sop_templates (tenant_id, title, segment, content)
values
  (null, 'Coleta de amostras de água', 'Coleta de Amostras', 'Padroniza identificação, preservação, transporte e cadeia de custódia.'),
  (null, 'Calibração de pHmetro', 'Calibração', 'Rotina de verificação, calibração e registro para medidores de pH.'),
  (null, 'Controle de qualidade interno', 'Controle de Qualidade', 'Define controles, critérios de aceitação e tratamento de desvios.'),
  (null, 'Gestão de resíduos químicos', 'Segurança', 'Segregação, acondicionamento, rotulagem e destinação de resíduos.'),
  (null, 'Operação de sistema de efluentes', 'Efluentes', 'Procedimentos operacionais e parâmetros críticos da estação.'),
  (null, 'Resposta a derramamentos', 'Segurança', 'Ações imediatas, contenção, limpeza e documentação do incidente.');
