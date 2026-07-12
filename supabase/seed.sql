-- Tenants Fixos
insert into public.tenants (id, name, plan)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Assessoria Mariana Vieira', 'pro'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'João Química Ltda', 'basic'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'SaaS Platform Owner', 'enterprise')
on conflict (id) do nothing;

-- Usuários (Senhas: 123456)
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
values
  ('11111111-1111-1111-1111-111111111111', 'superadmin@rtquimico.local', crypt('123456', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nome": "Bruno (Super Admin)", "role": "superadmin", "tenant_id": "cccccccc-cccc-cccc-cccc-cccccccccccc"}', now(), now(), 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'mariana@rtquimico.local', crypt('123456', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nome": "Mariana Vieira", "numero_crq": "04289123", "role": "tenant_admin", "tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', now(), now(), 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'joao@rtquimico.local', crypt('123456', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nome": "João Química", "role": "tenant_admin", "tenant_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', now(), now(), 'authenticated')
on conflict (id) do nothing;

-- Identidades para o login funcionar
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'superadmin@rtquimico.local')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'mariana@rtquimico.local')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', format('{"sub":"%s","email":"%s"}', '33333333-3333-3333-3333-333333333333', 'joao@rtquimico.local')::jsonb, 'email', now(), now(), now())
on conflict (id) do nothing;

-- Aguardar os triggers rodarem
do $$ begin perform pg_sleep(0.5); end $$;

-- RTs para Mariana (Tenant A)
insert into public.technical_responsibilities (id, tenant_id, user_id, company_name, company_cnpj, document_type, document_number, start_date, end_date, status, crq_region)
values
  ('d1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'BioLab Análises', '12.345.678/0001-90', 'TRT', 'TRT-2026-0182', '2026-01-10', '2027-01-10', 'active', 'CRQ-IV'),
  ('d2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Aqua Pura Ambiental', '28.491.730/0001-44', 'ART', 'ART-2025-0941', '2025-07-22', '2026-07-22', 'active', 'CRQ-IV'),
  ('d3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'QuimNova Indústria', '43.981.275/0001-08', 'CRT', 'CRT-2025-2210', '2025-06-28', '2026-06-28', 'pending', 'CRQ-IV'),
  ('d4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Verde Ciclo Efluentes', '09.441.875/0001-31', 'TRT', 'TRT-2025-0672', '2025-09-14', '2026-09-14', 'active', 'CRQ-IV')
on conflict (id) do nothing;

-- RTs para João (Tenant B)
insert into public.technical_responsibilities (id, tenant_id, user_id, company_name, company_cnpj, document_type, document_number, start_date, end_date, status, crq_region)
values
  ('d5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'João Petroquímica', '99.999.999/0001-99', 'TRT', 'TRT-2026-9999', '2026-02-15', '2027-02-15', 'active', 'CRQ-V')
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

-- Templates de POP (Global = tenant_id null)
insert into public.sop_templates (tenant_id, title, segment, content)
values
  (null, 'Coleta de amostras de água', 'Coleta de Amostras', 'Padroniza identificação, preservação, transporte e cadeia de custódia.'),
  (null, 'Calibração de pHmetro', 'Calibração', 'Rotina de verificação, calibração e registro para medidores de pH.'),
  (null, 'Controle de qualidade interno', 'Controle de Qualidade', 'Define controles, critérios de aceitação e tratamento de desvios.'),
  (null, 'Gestão de resíduos químicos', 'Segurança', 'Segregação, acondicionamento, rotulagem e destinação de resíduos.'),
  (null, 'Operação de sistema de efluentes', 'Efluentes', 'Procedimentos operacionais e parâmetros críticos da estação.'),
  (null, 'Resposta a derramamentos', 'Segurança', 'Ações imediatas, contenção, limpeza e documentação do incidente.');
